package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Story;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByProjectId(Long projectId);
    List<Story> findByAssignee(User assignee);

    @Modifying
    @Query("UPDATE Story s SET s.assignee = null WHERE s.assignee = :user")
    void clearAssignee(@Param("user") User user);

    @Modifying
    @Query("UPDATE Story s SET s.reporter = null WHERE s.reporter = :user")
    void clearReporter(@Param("user") User user);
}
