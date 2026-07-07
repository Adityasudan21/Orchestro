package com.Orchestra.AiAgent.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.Map;

@Service
@Slf4j
public class GitHubService {

    private final RestClient restClient;

    public GitHubService(
        RestClient.Builder restClientBuilder,
        @Value("${ai-agent.github.token}") String githubToken
    ) {
        this.restClient = restClientBuilder
            .baseUrl("https://api.github.com")
            .defaultHeader("Authorization", "Bearer " + githubToken)
            .defaultHeader("Accept", "application/vnd.github+json")
            .build();
    }

    public void createPullRequest(String gitLink, String headBranch, String baseBranch, String title, Long taskId) {
        String repoName = parseRepoName(gitLink);
        JsonNode pr = restClient.post()
            .uri("/repos/" + repoName + "/pulls")
            .contentType(MediaType.APPLICATION_JSON)
            .body(Map.of(
                "title", "[AI] " + title + " (task-" + taskId + ")",
                "body", "Automated implementation for Orchestro task #" + taskId + ".\n\nReview carefully before merging.",
                "head", headBranch,
                "base", baseBranch
            ))
            .retrieve()
            .body(JsonNode.class);
        log.info("Created PR #{} for task {}: {}", pr.get("number"), taskId, pr.get("html_url").asString());
    }

    static String parseRepoName(String gitLink) {
        String link = gitLink.replaceAll("/+$", "");
        if (link.endsWith(".git")) {
            link = link.substring(0, link.length() - 4);
        }
        String[] parts = link.split("/");
        return parts[parts.length - 2] + "/" + parts[parts.length - 1];
    }
}
