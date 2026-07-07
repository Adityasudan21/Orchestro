package com.Orchestra.AiAgent.listener;

import com.Orchestra.AiAgent.dto.AITicketMessage;
import com.Orchestra.AiAgent.service.TicketProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
@RequiredArgsConstructor
@Slf4j
public class TicketListener {

    private final TicketProcessingService ticketProcessingService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "ai-ticket-queue")
    public void onTicket(String message, Acknowledgment ack) {
        try {
            AITicketMessage ticket = objectMapper.readValue(message, AITicketMessage.class);
            log.info("Received ticket taskId={}", ticket.taskId());
            ticketProcessingService.processTicket(ticket);
        } catch (Exception e) {
            log.error("Unhandled error processing message", e);
        } finally {
            // Commit only after processing completes — this is what makes the queue sequential.
            // If the container crashes before this, the same message is re-delivered on restart.
            ack.acknowledge();
        }
    }
}
