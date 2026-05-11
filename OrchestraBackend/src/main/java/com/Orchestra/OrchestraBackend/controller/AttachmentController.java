package com.Orchestra.OrchestraBackend.controller;

import com.Orchestra.OrchestraBackend.dto.response.AttachmentResponse;
import com.Orchestra.OrchestraBackend.service.AttachmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AttachmentController {

    private final AttachmentService attachmentService;

    @GetMapping("/api/projects/{projectId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getProjectAttachments(@PathVariable Long projectId) {
        return ResponseEntity.ok(attachmentService.getProjectAttachments(projectId));
    }

    @PostMapping("/api/projects/{projectId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadToProject(
        @PathVariable Long projectId,
        @RequestParam("file") MultipartFile file,
        Authentication auth
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(attachmentService.uploadToProject(projectId, file, auth.getName()));
    }

    @GetMapping("/api/tasks/{taskId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getTaskAttachments(@PathVariable Long taskId) {
        return ResponseEntity.ok(attachmentService.getTaskAttachments(taskId));
    }

    @PostMapping("/api/tasks/{taskId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadToTask(
        @PathVariable Long taskId,
        @RequestParam("file") MultipartFile file,
        Authentication auth
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(attachmentService.uploadToTask(taskId, file, auth.getName()));
    }

    @GetMapping("/api/stories/{storyId}/attachments")
    public ResponseEntity<List<AttachmentResponse>> getStoryAttachments(@PathVariable Long storyId) {
        return ResponseEntity.ok(attachmentService.getStoryAttachments(storyId));
    }

    @PostMapping("/api/stories/{storyId}/attachments")
    public ResponseEntity<AttachmentResponse> uploadToStory(
        @PathVariable Long storyId,
        @RequestParam("file") MultipartFile file,
        Authentication auth
    ) throws IOException {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(attachmentService.uploadToStory(storyId, file, auth.getName()));
    }

    @GetMapping("/api/attachments/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws MalformedURLException {
        Path filePath = attachmentService.getFilePath(id);
        Resource resource = new UrlResource(filePath.toUri());
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filePath.getFileName() + "\"")
            .body(resource);
    }
}
