package com.Orchestra.OrchestraBackend.dto.response;

import com.Orchestra.OrchestraBackend.model.ActivityLog;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ActivityLogResponse {
    private Long id;
    private String entityType;
    private Long entityId;
    private String actorUsername;
    private String action;
    private String detail;
    private LocalDateTime createdAt;

    public static ActivityLogResponse from(ActivityLog log) {
        return ActivityLogResponse.builder()
            .id(log.getId())
            .entityType(log.getEntityType())
            .entityId(log.getEntityId())
            .actorUsername(log.getActor() != null ? log.getActor().getUsername() : null)
            .action(log.getAction())
            .detail(log.getDetail())
            .createdAt(log.getCreatedAt())
            .build();
    }
}
