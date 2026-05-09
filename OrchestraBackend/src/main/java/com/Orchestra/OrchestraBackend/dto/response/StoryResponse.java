package com.Orchestra.OrchestraBackend.dto.response;

import com.Orchestra.OrchestraBackend.model.Story;
import com.Orchestra.OrchestraBackend.model.TicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StoryResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private String title;
    private String description;
    private UserResponse assignee;
    private UserResponse reporter;
    private TicketStatus status;
    private String gitLink;
    private String commitNumber;
    private String branch;
    private LocalDateTime createdAt;

    public static StoryResponse from(Story story) {
        return StoryResponse.builder()
            .id(story.getId())
            .projectId(story.getProject().getId())
            .projectName(story.getProject().getName())
            .title(story.getTitle())
            .description(story.getDescription())
            .assignee(story.getAssignee() != null ? UserResponse.from(story.getAssignee()) : null)
            .reporter(story.getReporter() != null ? UserResponse.from(story.getReporter()) : null)
            .status(story.getStatus())
            .gitLink(story.getGitLink())
            .commitNumber(story.getCommitNumber())
            .branch(story.getBranch())
            .createdAt(story.getCreatedAt())
            .build();
    }
}
