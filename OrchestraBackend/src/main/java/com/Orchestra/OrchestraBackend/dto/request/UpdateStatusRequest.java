package com.Orchestra.OrchestraBackend.dto.request;

import com.Orchestra.OrchestraBackend.model.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {
    @NotNull
    private TicketStatus status;
}
