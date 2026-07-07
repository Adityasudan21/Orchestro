package com.Orchestra.AiAgent.service;

import com.Orchestra.AiAgent.dto.ChatCompletion;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class LlmAgentService {

    private static final int MAX_TURNS = 30;
    private static final int MAX_TOKENS = 16384;

    private static final String SYSTEM_PROMPT =
        "You are an expert software engineer assigned a ticket. "
        + "Use the provided tools to explore the repository, understand the codebase, "
        + "then make all necessary code changes to fulfil the task. "
        + "When you are done making all changes, stop calling tools and summarise what you did.";

    private static final String TOOLS_JSON = """
        [
          {
            "type": "function",
            "function": {
              "name": "read_file",
              "description": "Read the contents of a file in the repository.",
              "parameters": {
                "type": "object",
                "properties": {
                  "path": {"type": "string", "description": "Relative path from repo root"}
                },
                "required": ["path"]
              }
            }
          },
          {
            "type": "function",
            "function": {
              "name": "write_file",
              "description": "Write or overwrite a file in the repository.",
              "parameters": {
                "type": "object",
                "properties": {
                  "path": {"type": "string", "description": "Relative path from repo root"},
                  "content": {"type": "string", "description": "Full file content to write"}
                },
                "required": ["path", "content"]
              }
            }
          },
          {
            "type": "function",
            "function": {
              "name": "list_directory",
              "description": "List files and directories inside a directory. Use '.' for repo root.",
              "parameters": {
                "type": "object",
                "properties": {
                  "path": {"type": "string", "description": "Relative path from repo root"}
                },
                "required": ["path"]
              }
            }
          },
          {
            "type": "function",
            "function": {
              "name": "run_command",
              "description": "Run a read-only shell command in the repo root (e.g. grep, find). Do not use this to modify files.",
              "parameters": {
                "type": "object",
                "properties": {
                  "command": {"type": "string", "description": "Shell command to run"}
                },
                "required": ["command"]
              }
            }
          }
        ]
        """;

    private final ToolExecutor toolExecutor;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;
    private final String model;
    private final List<Map<String, Object>> tools;

    public LlmAgentService(
        ToolExecutor toolExecutor,
        ObjectMapper objectMapper,
        RestClient.Builder restClientBuilder,
        @Value("${ai-agent.gemini.base-url}") String baseUrl,
        @Value("${ai-agent.gemini.api-key}") String apiKey,
        @Value("${ai-agent.gemini.model}") String model
    ) {
        this.toolExecutor = toolExecutor;
        this.objectMapper = objectMapper;
        this.model = model;
        this.restClient = restClientBuilder
            .baseUrl(baseUrl)
            .defaultHeader("Authorization", "Bearer " + apiKey)
            .build();
        this.tools = objectMapper.readValue(TOOLS_JSON, new TypeReference<>() {});
    }

    public void run(Path repoPath, String title, String description) {
        List<ChatCompletion.Message> messages = new ArrayList<>();
        messages.add(ChatCompletion.Message.system(SYSTEM_PROMPT));
        messages.add(ChatCompletion.Message.user(
            "Ticket Title: " + title + "\n\n"
            + "Description:\n" + (description == null || description.isBlank() ? "(no description provided)" : description) + "\n\n"
            + "Explore the repository and implement the required changes."));

        for (int turn = 0; turn < MAX_TURNS; turn++) {
            ChatCompletion.Response response = restClient.post()
                .uri("/chat/completions")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ChatCompletion.Request(model, MAX_TOKENS, messages, tools))
                .retrieve()
                .body(ChatCompletion.Response.class);

            ChatCompletion.Choice choice = response.choices().get(0);
            ChatCompletion.Message msg = choice.message();
            String finishReason = choice.finishReason();
            log.info("Turn {}/{} — finish_reason={}", turn + 1, MAX_TURNS, finishReason);

            messages.add(msg);

            if ("stop".equals(finishReason) || msg.toolCalls() == null || msg.toolCalls().isEmpty()) {
                break;
            }

            if ("length".equals(finishReason)) {
                messages.add(ChatCompletion.Message.user("Continue."));
                continue;
            }

            for (ChatCompletion.ToolCall tc : msg.toolCalls()) {
                JsonNode input = objectMapper.readTree(tc.function().arguments());
                String result = toolExecutor.execute(tc.function().name(), input, repoPath);
                messages.add(ChatCompletion.Message.tool(tc.id(), result));
            }
        }
    }
}
