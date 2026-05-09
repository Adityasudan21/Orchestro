package com.Orchestra.OrchestraBackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateStoryRequest {
    @NotBlank
    private String title;
    private String description;
    private Long assigneeId;
    private String gitLink;
    private String commitNumber;
    private String branch;
}
