package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Project;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByMembersContaining(User user);
    List<Project> findByCreatedBy(User user);
}
