package com.Orchestra.OrchestraBackend.dto.response;

import com.Orchestra.OrchestraBackend.model.Notification;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String message;
    private boolean read;
    private String entityType;
    private Long entityId;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .message(n.getMessage())
            .read(n.isRead())
            .entityType(n.getEntityType())
            .entityId(n.getEntityId())
            .createdAt(n.getCreatedAt())
            .build();
    }
}
