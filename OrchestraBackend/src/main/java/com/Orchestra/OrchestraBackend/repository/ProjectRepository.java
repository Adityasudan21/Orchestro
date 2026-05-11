package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Project;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByMembersContaining(User user);
    List<Project> findByCreatedBy(User user);

    @Query("SELECT DISTINCT p FROM Project p WHERE " +
           ":user MEMBER OF p.members OR " +
           "EXISTS (SELECT s FROM Story s WHERE s.project = p AND s.assignee = :user) OR " +
           "EXISTS (SELECT t FROM Task t WHERE t.story.project = p AND t.assignee = :user)")
    List<Project> findProjectsInvolving(@Param("user") User user);

    @Modifying
    @Query("UPDATE Project p SET p.assignee = null WHERE p.assignee = :user")
    void clearAssignee(@Param("user") User user);

    @Modifying
    @Query("UPDATE Project p SET p.reporter = null WHERE p.reporter = :user")
    void clearReporter(@Param("user") User user);

    @Modifying
    @Query("UPDATE Project p SET p.createdBy = null WHERE p.createdBy = :user")
    void clearCreatedBy(@Param("user") User user);

    @Modifying
    @Query(value = "DELETE FROM project_members WHERE user_id = :userId", nativeQuery = true)
    void removeUserFromAllProjects(@Param("userId") Long userId);
}
