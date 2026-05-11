package com.Orchestra.OrchestraBackend.controller;

import com.Orchestra.OrchestraBackend.dto.request.CreateCommentRequest;
import com.Orchestra.OrchestraBackend.dto.response.CommentResponse;
import com.Orchestra.OrchestraBackend.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/api/tasks/{taskId}/comments")
    public ResponseEntity<List<CommentResponse>> getTaskComments(@PathVariable Long taskId) {
        return ResponseEntity.ok(commentService.getTaskComments(taskId));
    }

    @PostMapping("/api/tasks/{taskId}/comments")
    public ResponseEntity<CommentResponse> addTaskComment(
        @PathVariable Long taskId,
        @Valid @RequestBody CreateCommentRequest request,
        Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(commentService.addTaskComment(taskId, request, auth.getName()));
    }

    @GetMapping("/api/projects/{projectId}/comments")
    public ResponseEntity<List<CommentResponse>> getProjectComments(@PathVariable Long projectId) {
        return ResponseEntity.ok(commentService.getProjectComments(projectId));
    }

    @PostMapping("/api/projects/{projectId}/comments")
    public ResponseEntity<CommentResponse> addProjectComment(
        @PathVariable Long projectId,
        @Valid @RequestBody CreateCommentRequest request,
        Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(commentService.addProjectComment(projectId, request, auth.getName()));
    }

    @GetMapping("/api/stories/{storyId}/comments")
    public ResponseEntity<List<CommentResponse>> getStoryComments(@PathVariable Long storyId) {
        return ResponseEntity.ok(commentService.getStoryComments(storyId));
    }

    @PostMapping("/api/stories/{storyId}/comments")
    public ResponseEntity<CommentResponse> addStoryComment(
        @PathVariable Long storyId,
        @Valid @RequestBody CreateCommentRequest request,
        Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(commentService.addStoryComment(storyId, request, auth.getName()));
    }
}
