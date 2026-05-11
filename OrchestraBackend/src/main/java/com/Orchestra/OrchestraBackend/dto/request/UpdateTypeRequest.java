package com.Orchestra.OrchestraBackend.dto.request;

import com.Orchestra.OrchestraBackend.model.TaskType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTypeRequest {
    @NotNull
    private TaskType type;
}
