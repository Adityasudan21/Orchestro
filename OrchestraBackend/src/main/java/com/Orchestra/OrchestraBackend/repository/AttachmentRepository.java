package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Attachment;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    List<Attachment> findByTaskId(Long taskId);
    List<Attachment> findByStoryId(Long storyId);
    List<Attachment> findByProjectId(Long projectId);
    void deleteByUploadedBy(User user);
}
