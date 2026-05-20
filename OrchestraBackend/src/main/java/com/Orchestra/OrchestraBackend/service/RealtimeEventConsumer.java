package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.event.RealtimeEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class RealtimeEventConsumer {

    private final SseService sseService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = RealtimeEventProducer.TOPIC, groupId = "${spring.kafka.consumer.group-id}")
    public void consume(String message) {
        try {
            RealtimeEvent event = objectMapper.readValue(message, RealtimeEvent.class);
            if (event.targetUsername() != null) {
                sseService.sendToUser(event.targetUsername(), event);
            } else {
                sseService.broadcast(event);
            }
            log.info("Consumed---------------------------------------------------------------------------");
        } catch (Exception e) {
            log.warn("Failed to deserialize realtime event: {}", e.getMessage());
        }
    }
}
