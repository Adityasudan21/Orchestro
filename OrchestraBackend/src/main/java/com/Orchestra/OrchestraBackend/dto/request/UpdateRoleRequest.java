package com.Orchestra.OrchestraBackend.dto.request;

import com.Orchestra.OrchestraBackend.model.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateRoleRequest {
    @NotNull
    private Role role;
}
