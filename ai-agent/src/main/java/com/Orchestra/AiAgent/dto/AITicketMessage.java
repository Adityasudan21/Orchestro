package com.Orchestra.AiAgent.dto;

public record AITicketMessage(
    Long taskId,
    String title,
    String description,
    String gitLink,
    String branch
) {}
