package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Task;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByStoryId(Long storyId);
    Page<Task> findByStoryId(Long storyId, Pageable pageable);
    List<Task> findByAssignee(User assignee);

    @Modifying
    @Query("UPDATE Task t SET t.assignee = null WHERE t.assignee = :user")
    void clearAssignee(@Param("user") User user);

    @Modifying
    @Query("UPDATE Task t SET t.reporter = null WHERE t.reporter = :user")
    void clearReporter(@Param("user") User user);
}
