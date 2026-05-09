package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.request.AssignRequest;
import com.Orchestra.OrchestraBackend.dto.request.CreateStoryRequest;
import com.Orchestra.OrchestraBackend.dto.request.UpdateStatusRequest;
import com.Orchestra.OrchestraBackend.dto.response.StoryResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.exception.UnauthorizedException;
import com.Orchestra.OrchestraBackend.model.Project;
import com.Orchestra.OrchestraBackend.model.Role;
import com.Orchestra.OrchestraBackend.model.Story;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.ProjectRepository;
import com.Orchestra.OrchestraBackend.repository.StoryRepository;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class StoryService {

    private final StoryRepository storyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<StoryResponse> getStoriesByProject(Long projectId) {
        return storyRepository.findByProjectId(projectId).stream()
            .map(StoryResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StoryResponse getStory(Long id) {
        return StoryResponse.from(storyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + id)));
    }

    public StoryResponse createStory(Long projectId, CreateStoryRequest request, String reporterUsername) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        User reporter = userRepository.findByUsername(reporterUsername)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + reporterUsername));

        Story.StoryBuilder builder = Story.builder()
            .project(project)
            .title(request.getTitle())
            .description(request.getDescription())
            .reporter(reporter)
            .gitLink(request.getGitLink())
            .commitNumber(request.getCommitNumber())
            .branch(request.getBranch());

        if (request.getAssigneeId() != null) {
            userRepository.findById(request.getAssigneeId()).ifPresent(builder::assignee);
        }

        return StoryResponse.from(storyRepository.save(builder.build()));
    }

    public StoryResponse updateStory(Long id, CreateStoryRequest request) {
        Story story = storyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + id));
        story.setTitle(request.getTitle());
        if (request.getDescription() != null) story.setDescription(request.getDescription());
        if (request.getGitLink() != null) story.setGitLink(request.getGitLink());
        if (request.getCommitNumber() != null) story.setCommitNumber(request.getCommitNumber());
        if (request.getBranch() != null) story.setBranch(request.getBranch());
        if (request.getAssigneeId() != null) {
            userRepository.findById(request.getAssigneeId()).ifPresent(story::setAssignee);
        }
        return StoryResponse.from(storyRepository.save(story));
    }

    public StoryResponse updateStatus(Long id, UpdateStatusRequest request) {
        Story story = storyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + id));
        story.setStatus(request.getStatus());
        return StoryResponse.from(storyRepository.save(story));
    }

    public StoryResponse assignStory(Long storyId, AssignRequest request, String requesterUsername) {
        User requester = userRepository.findByUsername(requesterUsername)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterUsername));
        User assignee = userRepository.findById(request.getAssigneeId())
            .orElseThrow(() -> new ResourceNotFoundException("Assignee not found: " + request.getAssigneeId()));

        if (requester.getRole() == Role.MANAGER && assignee.getRole() == Role.ADMIN) {
            throw new UnauthorizedException("Managers cannot assign stories to Admins");
        }

        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + storyId));
        story.setAssignee(assignee);
        return StoryResponse.from(storyRepository.save(story));
    }
}
