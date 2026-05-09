package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Task;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByStoryId(Long storyId);
    List<Task> findByAssignee(User assignee);
}
