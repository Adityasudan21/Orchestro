package com.Orchestra.AiAgent.service;

import com.Orchestra.AiAgent.client.OrchestroClient;
import com.Orchestra.AiAgent.dto.AITicketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.FileSystemUtils;

import java.nio.file.Path;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketProcessingService {

    private final GitService gitService;
    private final GitHubService gitHubService;
    private final LlmAgentService llmAgentService;
    private final OrchestroClient orchestroClient;

    public boolean processTicket(AITicketMessage ticket) {
        Long taskId = ticket.taskId();
        String title = ticket.title() == null ? "" : ticket.title();
        String description = ticket.description() == null ? "" : ticket.description();
        String gitLink = ticket.gitLink();
        String branch = ticket.branch();
        String aiBranch = "ai/task-" + taskId;

        if (gitLink == null || gitLink.isBlank() || branch == null || branch.isBlank()) {
            log.error("Task {} missing gitLink or branch — cannot proceed", taskId);
            orchestroClient.updateTaskStatus(taskId, "NEEDS_MORE_INFO");
            return false;
        }

        Path repoPath;
        try {
            repoPath = gitService.cloneAndCheckout(gitLink, branch, aiBranch);
        } catch (Exception e) {
            log.error("Git clone failed for task {}: {}", taskId, e.getMessage());
            orchestroClient.updateTaskStatus(taskId, "NEEDS_MORE_INFO");
            return false;
        }

        try {
            try {
                llmAgentService.run(repoPath, title, description);
            } catch (Exception e) {
                log.error("LLM agent failed for task {}: {}", taskId, e.getMessage());
                orchestroClient.updateTaskStatus(taskId, "NEEDS_MORE_INFO");
                return false;
            }

            try {
                boolean changed = gitService.commitAndPush(repoPath, taskId, aiBranch);
                if (!changed) {
                    orchestroClient.updateTaskStatus(taskId, "NEEDS_MORE_INFO");
                    return false;
                }
                gitHubService.createPullRequest(gitLink, aiBranch, branch, title, taskId);
                orchestroClient.updateTaskStatus(taskId, "IN_REVIEW");
                return true;
            } catch (Exception e) {
                log.error("Git push/PR failed for task {}: {}", taskId, e.getMessage());
                orchestroClient.updateTaskStatus(taskId, "NEEDS_MORE_INFO");
                return false;
            }
        } finally {
            FileSystemUtils.deleteRecursively(repoPath.toFile());
        }
    }
}
