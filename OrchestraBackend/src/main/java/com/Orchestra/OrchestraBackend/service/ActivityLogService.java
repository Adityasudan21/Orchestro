package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.response.ActivityLogResponse;
import com.Orchestra.OrchestraBackend.model.ActivityLog;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    public void log(String entityType, Long entityId, User actor, String action, String detail) {
        activityLogRepository.save(ActivityLog.builder()
            .entityType(entityType)
            .entityId(entityId)
            .actor(actor)
            .action(action)
            .detail(detail)
            .build());
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> getForEntity(String entityType, Long entityId) {
        return activityLogRepository
            .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
            .stream()
            .map(ActivityLogResponse::from)
            .collect(Collectors.toList());
    }
}
