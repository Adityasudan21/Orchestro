package com.Orchestra.OrchestraBackend.dto.response;

import com.Orchestra.OrchestraBackend.model.Task;
import com.Orchestra.OrchestraBackend.model.TaskType;
import com.Orchestra.OrchestraBackend.model.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TaskResponse {
    private Long id;
    private Long storyId;
    private String storyTitle;
    private Long projectId;
    private String projectName;
    private String title;
    private String description;
    private TaskType type;
    private UserResponse assignee;
    private UserResponse reporter;
    private TicketStatus status;
    private String gitLink;
    private String commitNumber;
    private String branch;
    private LocalDateTime createdAt;

    public static TaskResponse from(Task task) {
        return TaskResponse.builder()
            .id(task.getId())
            .storyId(task.getStory().getId())
            .storyTitle(task.getStory().getTitle())
            .projectId(task.getStory().getProject().getId())
            .projectName(task.getStory().getProject().getName())
            .title(task.getTitle())
            .description(task.getDescription())
            .type(task.getType())
            .assignee(task.getAssignee() != null ? UserResponse.from(task.getAssignee()) : null)
            .reporter(task.getReporter() != null ? UserResponse.from(task.getReporter()) : null)
            .status(task.getStatus())
            .gitLink(task.getGitLink())
            .commitNumber(task.getCommitNumber())
            .branch(task.getBranch())
            .createdAt(task.getCreatedAt())
            .build();
    }
}
