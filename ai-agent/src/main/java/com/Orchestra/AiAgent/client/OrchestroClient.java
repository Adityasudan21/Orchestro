package com.Orchestra.AiAgent.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
@Slf4j
public class OrchestroClient {

    private final RestClient restClient;

    public OrchestroClient(
        RestClient.Builder restClientBuilder,
        @Value("${orchestro.base-url}") String baseUrl,
        @Value("${orchestro.agent.username}") String username,
        @Value("${orchestro.agent.password}") String password
    ) {
        this.restClient = restClientBuilder
            .baseUrl(baseUrl)
            .requestInterceptor((request, body, execution) -> {
                request.getHeaders().setBasicAuth(username, password);
                return execution.execute(request, body);
            })
            .build();
    }

    public void updateTaskStatus(Long taskId, String status) {
        try {
            restClient.patch()
                .uri("/api/tasks/{id}/status", taskId)
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("status", status))
                .retrieve()
                .toBodilessEntity();
            log.info("Updated task {} to {}", taskId, status);
        } catch (Exception e) {
            log.error("Failed to update task {} status to {}: {}", taskId, status, e.getMessage());
        }
    }
}
