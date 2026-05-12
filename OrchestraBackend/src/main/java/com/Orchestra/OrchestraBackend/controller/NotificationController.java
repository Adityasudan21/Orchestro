package com.Orchestra.OrchestraBackend.controller;

import com.Orchestra.OrchestraBackend.dto.response.NotificationResponse;
import com.Orchestra.OrchestraBackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/api/notifications/my")
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.getMyNotifications(auth.getName()));
    }

    @GetMapping("/api/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(auth.getName())));
    }

    @PatchMapping("/api/notifications/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(notificationService.markRead(id, auth.getName()));
    }

    @PatchMapping("/api/notifications/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        notificationService.markAllRead(auth.getName());
        return ResponseEntity.noContent().build();
    }
}
