package com.Orchestra.OrchestraBackend.controller;

import com.Orchestra.OrchestraBackend.dto.request.CreateStoryRequest;
import com.Orchestra.OrchestraBackend.dto.request.UpdateStatusRequest;
import com.Orchestra.OrchestraBackend.dto.response.StoryResponse;
import com.Orchestra.OrchestraBackend.service.StoryService;
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
public class StoryController {

    private final StoryService storyService;

    @GetMapping("/api/projects/{projectId}/stories")
    public ResponseEntity<List<StoryResponse>> getStoriesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(storyService.getStoriesByProject(projectId));
    }

    @PostMapping("/api/projects/{projectId}/stories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<StoryResponse> createStory(
        @PathVariable Long projectId,
        @Valid @RequestBody CreateStoryRequest request,
        Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(storyService.createStory(projectId, request, auth.getName()));
    }

    @GetMapping("/api/stories/{id}")
    public ResponseEntity<StoryResponse> getStory(@PathVariable Long id) {
        return ResponseEntity.ok(storyService.getStory(id));
    }

    @PutMapping("/api/stories/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<StoryResponse> updateStory(
        @PathVariable Long id,
        @Valid @RequestBody CreateStoryRequest request
    ) {
        return ResponseEntity.ok(storyService.updateStory(id, request));
    }

    @PatchMapping("/api/stories/{id}/status")
    public ResponseEntity<StoryResponse> updateStoryStatus(
        @PathVariable Long id,
        @Valid @RequestBody UpdateStatusRequest request
    ) {
        return ResponseEntity.ok(storyService.updateStatus(id, request));
    }
}
