package com.Orchestra.OrchestraBackend.dto.response;

import com.Orchestra.OrchestraBackend.model.Comment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private Long taskId;
    private Long storyId;
    private UserResponse user;
    private String content;
    private LocalDateTime createdAt;

    public static CommentResponse from(Comment comment) {
        return CommentResponse.builder()
            .id(comment.getId())
            .taskId(comment.getTask() != null ? comment.getTask().getId() : null)
            .storyId(comment.getStory() != null ? comment.getStory().getId() : null)
            .user(UserResponse.from(comment.getUser()))
            .content(comment.getContent())
            .createdAt(comment.getCreatedAt())
            .build();
    }
}
