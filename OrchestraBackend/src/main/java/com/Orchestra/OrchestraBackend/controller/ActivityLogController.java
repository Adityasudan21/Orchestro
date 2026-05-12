package com.Orchestra.OrchestraBackend.controller;

import com.Orchestra.OrchestraBackend.dto.response.ActivityLogResponse;
import com.Orchestra.OrchestraBackend.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping("/api/projects/{id}/activity")
    public ResponseEntity<List<ActivityLogResponse>> getProjectActivity(@PathVariable Long id) {
        return ResponseEntity.ok(activityLogService.getForEntity("PROJECT", id));
    }

    @GetMapping("/api/stories/{id}/activity")
    public ResponseEntity<List<ActivityLogResponse>> getStoryActivity(@PathVariable Long id) {
        return ResponseEntity.ok(activityLogService.getForEntity("STORY", id));
    }

    @GetMapping("/api/tasks/{id}/activity")
    public ResponseEntity<List<ActivityLogResponse>> getTaskActivity(@PathVariable Long id) {
        return ResponseEntity.ok(activityLogService.getForEntity("TASK", id));
    }
}
