package com.Orchestra.OrchestraBackend.dto.response;

import com.Orchestra.OrchestraBackend.model.Project;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private UserResponse createdBy;
    private Set<UserResponse> members;
    private LocalDateTime createdAt;

    public static ProjectResponse from(Project project) {
        return ProjectResponse.builder()
            .id(project.getId())
            .name(project.getName())
            .description(project.getDescription())
            .createdBy(project.getCreatedBy() != null ? UserResponse.from(project.getCreatedBy()) : null)
            .members(project.getMembers().stream().map(UserResponse::from).collect(Collectors.toSet()))
            .createdAt(project.getCreatedAt())
            .build();
    }
}
