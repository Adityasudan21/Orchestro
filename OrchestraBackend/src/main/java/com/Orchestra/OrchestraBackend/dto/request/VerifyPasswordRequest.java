package com.Orchestra.OrchestraBackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyPasswordRequest {
    @NotBlank
    private String currentPassword;
}
