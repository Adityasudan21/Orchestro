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

        if (gitLink == null || gitLink.isBlank()) {
            log.error("Task {} missing gitLink — cannot proceed", taskId);
            orchestroClient.updateTaskStatus(taskId, "NEEDS_MORE_INFO");
            return false;
        }

        String defaultBranch;
        try {
            defaultBranch = gitHubService.getDefaultBranch(gitLink);
        } catch (Exception e) {
            log.error("Failed to resolve default branch for task {}: {}", taskId, e.getMessage());
            orchestroClient.updateTaskStatus(taskId, "NEEDS_MORE_INFO");
            return false;
        }

        // The task's branch is where the AI works; the PR merges it into the default
        // branch. No branch (or the default branch itself, which can't PR into itself)
        // falls back to a generated one so a PR is always produced for human review.
        String branch = ticket.branch();
        String workBranch = (branch == null || branch.isBlank() || branch.equals(defaultBranch))
            ? "ai/task-" + taskId
            : branch;
        log.info("Task {}: working on branch '{}', PR into '{}'", taskId, workBranch, defaultBranch);

        Path repoPath;
        try {
            repoPath = gitService.cloneAndCheckout(gitLink, defaultBranch, workBranch);
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
                boolean changed = gitService.commitAndPush(repoPath, taskId, workBranch);
                if (!changed) {
                    orchestroClient.updateTaskStatus(taskId, "NEEDS_MORE_INFO");
                    return false;
                }
                gitHubService.createPullRequest(gitLink, workBranch, defaultBranch, title, taskId);
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
