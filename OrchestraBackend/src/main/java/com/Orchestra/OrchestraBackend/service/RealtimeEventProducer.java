package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.event.RealtimeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealtimeEventProducer {

    static final String TOPIC = "orchestro.events";

    private final KafkaTemplate<String, String> stringKafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publish(RealtimeEvent event) {
        try {
            String json = objectMapper.writeValueAsString(event);
            stringKafkaTemplate.send(TOPIC, event.type(), json);
            log.info("Published-----------------------------------------------------------------------------------------------------");
        } catch (Exception e) {
            log.warn("Failed to publish realtime event (Kafka unavailable?): {}", e.getMessage());
        }
    }
}
