package com.Orchestra.OrchestraBackend.dto.request;

import com.Orchestra.OrchestraBackend.model.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTaskRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private TaskType type;
    private Long assigneeId;
    private String gitLink;
    private String commitNumber;
    private String branch;
}
