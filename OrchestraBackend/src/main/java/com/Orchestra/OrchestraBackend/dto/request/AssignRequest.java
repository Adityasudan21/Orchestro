package com.Orchestra.OrchestraBackend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignRequest {
    @NotNull
    private Long assigneeId;
}
