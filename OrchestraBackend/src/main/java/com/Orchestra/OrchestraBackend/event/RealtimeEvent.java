package com.Orchestra.OrchestraBackend.event;

/**
 * @param type           NOTIFICATION | COMMENT_ADDED | STATUS_CHANGED
 * @param targetUsername null = broadcast to all SSE clients; non-null = send only to this user
 * @param entityType     TASK | STORY | PROJECT (null for notifications)
 * @param entityId       ID of the primary entity
 * @param parentId       storyId when entityType=TASK, projectId when entityType=STORY; null otherwise
 */
public record RealtimeEvent(
    String type,
    String targetUsername,
    String entityType,
    Long entityId,
    Long parentId
) {}
