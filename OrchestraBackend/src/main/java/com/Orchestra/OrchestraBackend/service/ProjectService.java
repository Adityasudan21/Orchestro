package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.request.AssignRequest;
import com.Orchestra.OrchestraBackend.dto.request.CreateProjectRequest;
import com.Orchestra.OrchestraBackend.dto.response.ProjectResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.model.Project;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.ProjectRepository;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
            .map(ProjectResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return projectRepository.findProjectsInvolving(user).stream()
            .map(ProjectResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProject(Long id) {
        return ProjectResponse.from(projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id)));
    }

    public ProjectResponse createProject(CreateProjectRequest request, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorUsername));

        Set<User> members = new HashSet<>();
        members.add(creator);
        if (request.getMemberIds() != null) {
            request.getMemberIds().forEach(id ->
                userRepository.findById(id).ifPresent(members::add)
            );
        }

        Project project = Project.builder()
            .name(request.getName())
            .description(request.getDescription())
            .createdBy(creator)
            .members(members)
            .build();

        return ProjectResponse.from(projectRepository.save(project));
    }

    public ProjectResponse updateProject(Long id, CreateProjectRequest request) {
        Project project = projectRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + id));
        project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        return ProjectResponse.from(projectRepository.save(project));
    }

    public ProjectResponse assignProject(Long projectId, AssignRequest request) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        User assignee = userRepository.findById(request.getAssigneeId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getAssigneeId()));
        project.setAssignee(assignee);
        return ProjectResponse.from(projectRepository.save(project));
    }

    public ProjectResponse assignProjectReporter(Long projectId, AssignRequest request) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        User reporter = userRepository.findById(request.getAssigneeId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getAssigneeId()));
        project.setReporter(reporter);
        return ProjectResponse.from(projectRepository.save(project));
    }

    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project not found: " + id);
        }
        projectRepository.deleteById(id);
    }
}
