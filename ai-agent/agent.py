import logging
import os
import subprocess
from pathlib import Path

import anthropic

log = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"
MAX_TURNS = 30

TOOLS = [
    {
        "name": "read_file",
        "description": "Read the contents of a file in the repository.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path from repo root"}
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "Write or overwrite a file in the repository.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path from repo root"},
                "content": {"type": "string", "description": "Full file content to write"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "list_directory",
        "description": "List files and directories inside a directory. Use '.' for repo root.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative path from repo root"}
            },
            "required": ["path"],
        },
    },
    {
        "name": "run_command",
        "description": "Run a read-only shell command in the repo root (e.g. grep, find, cat). Do not use this to modify files.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to run"}
            },
            "required": ["command"],
        },
    },
]


def _safe_path(base: Path, relative: str) -> Path | None:
    target = (base / relative).resolve()
    if not str(target).startswith(str(base)):
        return None
    return target


def execute_tool(name: str, inp: dict, repo_path: str) -> str:
    base = Path(repo_path).resolve()

    if name == "read_file":
        target = _safe_path(base, inp["path"])
        if target is None:
            return "ERROR: path traversal not allowed"
        if not target.exists():
            return "ERROR: file not found"
        return target.read_text(errors="replace")

    if name == "write_file":
        target = _safe_path(base, inp["path"])
        if target is None:
            return "ERROR: path traversal not allowed"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(inp["content"])
        return "OK"

    if name == "list_directory":
        target = _safe_path(base, inp["path"])
        if target is None:
            return "ERROR: path traversal not allowed"
        if not target.is_dir():
            return "ERROR: not a directory"
        return "\n".join(str(p.relative_to(base)) for p in sorted(target.iterdir()))

    if name == "run_command":
        try:
            result = subprocess.run(
                inp["command"],
                shell=True,
                cwd=repo_path,
                capture_output=True,
                text=True,
                timeout=30,
            )
            return (result.stdout + result.stderr)[:8000]
        except subprocess.TimeoutExpired:
            return "ERROR: command timed out"

    return f"ERROR: unknown tool {name}"


def run_claude_agent(repo_path: str, title: str, description: str) -> None:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    system = (
        "You are an expert software engineer assigned a ticket. "
        "Use the provided tools to explore the repository, understand the codebase, "
        "then make all necessary code changes to fulfil the task. "
        "When you are done making all changes, stop calling tools and summarise what you did."
    )
    user_msg = (
        f"Ticket Title: {title}\n\n"
        f"Description:\n{description or '(no description provided)'}\n\n"
        "Explore the repository and implement the required changes."
    )
    messages: list = [{"role": "user", "content": user_msg}]

    for turn in range(MAX_TURNS):
        response = client.messages.create(
            model=MODEL,
            max_tokens=8096,
            system=system,
            tools=TOOLS,
            messages=messages,
        )
        messages.append({"role": "assistant", "content": response.content})
        log.info("Turn %d/%d — stop_reason=%s", turn + 1, MAX_TURNS, response.stop_reason)

        if response.stop_reason == "end_turn":
            break

        if response.stop_reason == "tool_use":
            results = []
            for block in response.content:
                if block.type == "tool_use":
                    result = execute_tool(block.name, block.input, repo_path)
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })
            messages.append({"role": "user", "content": results})
        else:
            break
