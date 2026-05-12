package com.Orchestra.OrchestraBackend.controller;

import com.Orchestra.OrchestraBackend.dto.request.AssignRequest;
import com.Orchestra.OrchestraBackend.dto.request.CreateTaskRequest;
import com.Orchestra.OrchestraBackend.dto.request.UpdateStatusRequest;
import com.Orchestra.OrchestraBackend.dto.request.UpdateTypeRequest;
import com.Orchestra.OrchestraBackend.dto.response.PagedResponse;
import com.Orchestra.OrchestraBackend.dto.response.TaskResponse;
import com.Orchestra.OrchestraBackend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping("/api/stories/{storyId}/tasks")
    public ResponseEntity<List<TaskResponse>> getTasksByStory(@PathVariable Long storyId) {
        return ResponseEntity.ok(taskService.getTasksByStory(storyId));
    }

    @GetMapping("/api/stories/{storyId}/tasks/paged")
    public ResponseEntity<PagedResponse<TaskResponse>> getTasksByStoryPaged(
        @PathVariable Long storyId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(taskService.getTasksByStoryPaged(storyId, page, size));
    }

    @PostMapping("/api/stories/{storyId}/tasks")
    public ResponseEntity<TaskResponse> createTask(
        @PathVariable Long storyId,
        @Valid @RequestBody CreateTaskRequest request,
        Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.createTask(storyId, request, auth.getName()));
    }

    @GetMapping("/api/tasks/my")
    public ResponseEntity<List<TaskResponse>> getMyTasks(Authentication auth) {
        return ResponseEntity.ok(taskService.getMyAssignedTasks(auth.getName()));
    }

    @GetMapping("/api/tasks/{id}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTask(id));
    }

    @PutMapping("/api/tasks/{id}")
    public ResponseEntity<TaskResponse> updateTask(
        @PathVariable Long id,
        @Valid @RequestBody CreateTaskRequest request
    ) {
        return ResponseEntity.ok(taskService.updateTask(id, request));
    }

    @PatchMapping("/api/tasks/{id}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdateStatusRequest request
    ) {
        return ResponseEntity.ok(taskService.updateStatus(id, request));
    }

    @PatchMapping("/api/tasks/{id}/type")
    public ResponseEntity<TaskResponse> updateTaskType(
        @PathVariable Long id,
        @Valid @RequestBody UpdateTypeRequest request
    ) {
        return ResponseEntity.ok(taskService.updateType(id, request));
    }

    @PatchMapping("/api/tasks/{id}/assignee")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TaskResponse> assignTask(
        @PathVariable Long id,
        @Valid @RequestBody AssignRequest request,
        Authentication auth
    ) {
        return ResponseEntity.ok(taskService.assignTask(id, request, auth.getName()));
    }

    @PatchMapping("/api/tasks/{id}/reporter")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<TaskResponse> assignTaskReporter(
        @PathVariable Long id,
        @Valid @RequestBody AssignRequest request
    ) {
        return ResponseEntity.ok(taskService.assignReporter(id, request));
    }

    @DeleteMapping("/api/tasks/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
