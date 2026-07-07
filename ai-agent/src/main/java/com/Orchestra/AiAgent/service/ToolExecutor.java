package com.Orchestra.AiAgent.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@Slf4j
public class ToolExecutor {

    private static final int COMMAND_TIMEOUT_SECONDS = 30;
    private static final int MAX_OUTPUT_CHARS = 8000;

    public String execute(String name, JsonNode input, Path repoPath) {
        Path base = repoPath.toAbsolutePath().normalize();
        try {
            return switch (name) {
                case "read_file" -> readFile(base, input.get("path").asString());
                case "write_file" -> writeFile(base, input.get("path").asString(), input.get("content").asString());
                case "list_directory" -> listDirectory(base, input.get("path").asString());
                case "run_command" -> runCommand(base, input.get("command").asString());
                default -> "ERROR: unknown tool " + name;
            };
        } catch (Exception e) {
            log.warn("Tool {} failed: {}", name, e.getMessage());
            return "ERROR: " + e.getMessage();
        }
    }

    private Path safePath(Path base, String relative) {
        Path target = base.resolve(relative).normalize();
        return target.startsWith(base) ? target : null;
    }

    private String readFile(Path base, String relative) throws IOException {
        Path target = safePath(base, relative);
        if (target == null) return "ERROR: path traversal not allowed";
        if (!Files.exists(target)) return "ERROR: file not found";
        return new String(Files.readAllBytes(target), StandardCharsets.UTF_8);
    }

    private String writeFile(Path base, String relative, String content) throws IOException {
        Path target = safePath(base, relative);
        if (target == null) return "ERROR: path traversal not allowed";
        Files.createDirectories(target.getParent());
        Files.writeString(target, content);
        return "OK";
    }

    private String listDirectory(Path base, String relative) throws IOException {
        Path target = safePath(base, relative);
        if (target == null) return "ERROR: path traversal not allowed";
        if (!Files.isDirectory(target)) return "ERROR: not a directory";
        try (Stream<Path> entries = Files.list(target)) {
            return entries
                .map(p -> base.relativize(p).toString())
                .sorted()
                .collect(Collectors.joining("\n"));
        }
    }

    private String runCommand(Path base, String command) throws Exception {
        Process process = new ProcessBuilder("sh", "-c", command)
            .directory(base.toFile())
            .redirectErrorStream(true)
            .start();
        // Drain output concurrently so a full pipe buffer can't block the process.
        CompletableFuture<String> output = CompletableFuture.supplyAsync(() -> {
            try {
                return new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                return "ERROR reading output: " + e.getMessage();
            }
        });
        if (!process.waitFor(COMMAND_TIMEOUT_SECONDS, TimeUnit.SECONDS)) {
            process.destroyForcibly();
            return "ERROR: command timed out";
        }
        String result = output.get(5, TimeUnit.SECONDS);
        return result.length() > MAX_OUTPUT_CHARS ? result.substring(0, MAX_OUTPUT_CHARS) : result;
    }
}
