package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.event.RealtimeEvent;
import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
public class SseService {

    private final ObjectMapper objectMapper;

    // One user may have multiple tabs open → list of emitters per username.
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> emitters =
        new ConcurrentHashMap<>();

    public SseEmitter register(String username) {
        SseEmitter emitter = new SseEmitter(0L); // 0 = no timeout
        emitters.computeIfAbsent(username, k -> new CopyOnWriteArrayList<>()).add(emitter);

        Runnable cleanup = () -> remove(username, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());

        return emitter;
    }

    public void sendToUser(String username, RealtimeEvent event) {
        List<SseEmitter> list = emitters.get(username);
        if (list == null) return;
        send(list, username, event);
    }

    public void broadcast(RealtimeEvent event) {
        emitters.forEach((username, list) -> send(list, username, event));
    }

    private void send(List<SseEmitter> list, String username, RealtimeEvent event) {
        List<SseEmitter> dead = new java.util.ArrayList<>();
        for (SseEmitter emitter : list) {
            try {
                String json = objectMapper.writeValueAsString(event);
                emitter.send(SseEmitter.event().data(json));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }
        list.removeAll(dead);
        if (list.isEmpty()) emitters.remove(username);
    }

    private void remove(String username, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> list = emitters.get(username);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) emitters.remove(username);
        }
    }
}
