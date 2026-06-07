package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.event.AITicketMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class AITicketProducer {

    static final String TOPIC = "ai-ticket-queue";

    private final KafkaTemplate<String, String> stringKafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publish(AITicketMessage msg) {
        try {
            String json = objectMapper.writeValueAsString(msg);
            stringKafkaTemplate.send(TOPIC, String.valueOf(msg.taskId()), json);
            log.info("Published AI ticket for taskId={}", msg.taskId());
        } catch (Exception e) {
            log.warn("Failed to publish AI ticket (Kafka unavailable?): {}", e.getMessage());
        }
    }
}
