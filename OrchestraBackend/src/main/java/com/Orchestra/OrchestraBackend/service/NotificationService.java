package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.response.NotificationResponse;
import com.Orchestra.OrchestraBackend.event.RealtimeEvent;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.exception.UnauthorizedException;
import com.Orchestra.OrchestraBackend.model.Notification;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.NotificationRepository;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RealtimeEventProducer realtimeEventProducer;

    public void notify(User recipient, String message, String entityType, Long entityId) {
        notificationRepository.save(Notification.builder()
            .recipient(recipient)
            .message(message)
            .entityType(entityType)
            .entityId(entityId)
            .build());
        realtimeEventProducer.publish(
            new RealtimeEvent("NOTIFICATION", recipient.getUsername(), entityType, entityId, null));
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user).stream()
            .map(NotificationResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countUnread(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return notificationRepository.countByRecipientAndReadFalse(user);
    }

    public NotificationResponse markRead(Long id, String username) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        if (!notification.getRecipient().getUsername().equals(username)) {
            throw new UnauthorizedException("Cannot modify another user's notification");
        }
        notification.setRead(true);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    public void markAllRead(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        notificationRepository.markAllRead(user);
    }
}
