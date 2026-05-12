package com.Orchestra.OrchestraBackend.controller;

import com.Orchestra.OrchestraBackend.dto.request.AssignRequest;
import com.Orchestra.OrchestraBackend.dto.request.CreateProjectRequest;
import com.Orchestra.OrchestraBackend.dto.response.ProjectResponse;
import com.Orchestra.OrchestraBackend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(Authentication auth) {
        return ResponseEntity.ok(projectService.getMyProjects(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProject(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResponse> createProject(
        @Valid @RequestBody CreateProjectRequest request,
        Authentication auth
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(projectService.createProject(request, auth.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResponse> updateProject(
        @PathVariable Long id,
        @Valid @RequestBody CreateProjectRequest request
    ) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @PatchMapping("/{id}/assignee")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResponse> assignProject(
        @PathVariable Long id,
        @Valid @RequestBody AssignRequest request
    ) {
        return ResponseEntity.ok(projectService.assignProject(id, request));
    }

    @PatchMapping("/{id}/reporter")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResponse> assignProjectReporter(
        @PathVariable Long id,
        @Valid @RequestBody AssignRequest request
    ) {
        return ResponseEntity.ok(projectService.assignProjectReporter(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResponse> addMember(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(projectService.addMember(id, userId));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ProjectResponse> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(projectService.removeMember(id, userId));
    }
}
