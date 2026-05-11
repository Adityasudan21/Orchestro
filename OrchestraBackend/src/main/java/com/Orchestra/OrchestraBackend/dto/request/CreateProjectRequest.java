package com.Orchestra.OrchestraBackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Set;

@Data
public class CreateProjectRequest {
    @NotBlank
    private String name;
    private String description;
    private Long assigneeId;
    private Set<Long> memberIds;
}
