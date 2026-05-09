package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Story;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByProjectId(Long projectId);
    List<Story> findByAssignee(User assignee);
}
