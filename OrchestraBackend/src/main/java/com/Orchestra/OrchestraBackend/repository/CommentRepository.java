package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Comment;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTaskIdOrderByCreatedAtAsc(Long taskId);
    List<Comment> findByStoryIdOrderByCreatedAtAsc(Long storyId);
    List<Comment> findByProjectIdOrderByCreatedAtAsc(Long projectId);
    void deleteByUser(User user);
}
