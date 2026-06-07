import logging
import os
import tempfile

import git
from github import Github

log = logging.getLogger(__name__)

GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]


def clone_and_checkout(git_link: str, base_branch: str, ai_branch: str) -> str:
    """Clone repo, checkout base_branch, create ai_branch. Returns local path."""
    authed_url = git_link.replace("https://", f"https://x-access-token:{GITHUB_TOKEN}@")
    work_dir = tempfile.mkdtemp(prefix="orchestro-ai-")
    repo = git.Repo.clone_from(authed_url, work_dir)
    repo.git.checkout(base_branch)
    try:
        repo.git.checkout("-b", ai_branch)
    except git.GitCommandError:
        # Branch already exists remotely (retry after crash) — reset to base HEAD.
        repo.git.checkout(ai_branch)
        repo.git.reset("--hard", f"origin/{base_branch}")
    return work_dir


def commit_and_push(repo_path: str, task_id: int, ai_branch: str) -> bool:
    """Stage all changes, commit, push. Returns False if nothing changed."""
    repo = git.Repo(repo_path)
    repo.git.add("--all")
    if not repo.index.diff("HEAD") and not repo.untracked_files:
        log.warning("No changes made by agent for task %s", task_id)
        return False
    repo.index.commit(f"feat: AI agent implementation for task-{task_id}")
    repo.remotes.origin.push(refspec=f"{ai_branch}:{ai_branch}")
    log.info("Pushed branch %s for task %s", ai_branch, task_id)
    return True


def create_pr(git_link: str, head_branch: str, base_branch: str, title: str, task_id: int) -> None:
    parts = git_link.rstrip("/").removesuffix(".git").split("/")
    repo_name = f"{parts[-2]}/{parts[-1]}"
    gh_repo = Github(GITHUB_TOKEN).get_repo(repo_name)
    pr = gh_repo.create_pull(
        title=f"[AI] {title} (task-{task_id})",
        body=f"Automated implementation for Orchestro task #{task_id}.\n\nReview carefully before merging.",
        head=head_branch,
        base=base_branch,
    )
    log.info("Created PR #%s for task %s: %s", pr.number, task_id, pr.html_url)
