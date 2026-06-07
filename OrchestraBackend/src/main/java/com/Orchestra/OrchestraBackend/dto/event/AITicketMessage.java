package com.Orchestra.OrchestraBackend.dto.event;

public record AITicketMessage(
    Long taskId,
    String title,
    String description,
    String gitLink,
    String branch
) {}
