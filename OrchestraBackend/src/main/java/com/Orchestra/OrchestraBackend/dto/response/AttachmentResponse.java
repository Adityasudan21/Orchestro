package com.Orchestra.OrchestraBackend.dto.response;

import com.Orchestra.OrchestraBackend.model.Attachment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AttachmentResponse {
    private Long id;
    private Long taskId;
    private Long storyId;
    private String fileName;
    private String contentType;
    private UserResponse uploadedBy;
    private LocalDateTime createdAt;

    public static AttachmentResponse from(Attachment attachment) {
        return AttachmentResponse.builder()
            .id(attachment.getId())
            .taskId(attachment.getTask() != null ? attachment.getTask().getId() : null)
            .storyId(attachment.getStory() != null ? attachment.getStory().getId() : null)
            .fileName(attachment.getFileName())
            .contentType(attachment.getContentType())
            .uploadedBy(UserResponse.from(attachment.getUploadedBy()))
            .createdAt(attachment.getCreatedAt())
            .build();
    }
}
