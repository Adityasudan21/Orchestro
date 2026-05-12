package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.request.AssignRequest;
import com.Orchestra.OrchestraBackend.dto.request.CreateStoryRequest;
import com.Orchestra.OrchestraBackend.dto.request.UpdateStatusRequest;
import com.Orchestra.OrchestraBackend.dto.response.PagedResponse;
import com.Orchestra.OrchestraBackend.dto.response.StoryResponse;
import com.Orchestra.OrchestraBackend.dto.response.TaskResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.exception.UnauthorizedException;
import com.Orchestra.OrchestraBackend.model.Project;
import com.Orchestra.OrchestraBackend.model.Role;
import com.Orchestra.OrchestraBackend.model.Story;
import com.Orchestra.OrchestraBackend.model.Task;
import com.Orchestra.OrchestraBackend.model.TicketStatus;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.CommentRepository;
import com.Orchestra.OrchestraBackend.repository.ProjectRepository;
import com.Orchestra.OrchestraBackend.repository.StoryRepository;
import com.Orchestra.OrchestraBackend.repository.TaskRepository;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final AttachmentService attachmentService;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<StoryResponse> getStoriesByProject(Long projectId) {
        return storyRepository.findByProjectId(projectId).stream()
            .map(StoryResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PagedResponse<StoryResponse> getStoriesByProjectPaged(Long projectId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return PagedResponse.from(storyRepository.findByProjectId(projectId, pageable), StoryResponse::from);
    }

    @Transactional(readOnly = true)
    public StoryResponse getStory(Long id) {
        return StoryResponse.from(storyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + id)));
    }
    @Transactional(readOnly = true)
    public List<StoryResponse> getMyAssignedStories(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return storyRepository.findByAssignee(user).stream()
                .map(StoryResponse::from)
                .collect(Collectors.toList());
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

        Story saved = storyRepository.save(builder.build());
        activityLogService.log("STORY", saved.getId(), reporter, "CREATED", "Story created: " + saved.getTitle());
        if (saved.getAssignee() != null && !saved.getAssignee().getId().equals(reporter.getId())) {
            notificationService.notify(saved.getAssignee(),
                reporter.getUsername() + " assigned you to story: " + saved.getTitle(), "STORY", saved.getId());
        }
        return StoryResponse.from(saved);
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
        if (request.getStatus() == TicketStatus.DONE) {
            List<Task> tasks = taskRepository.findByStoryId(id);
            if (!tasks.isEmpty() && tasks.stream().anyMatch(t -> t.getStatus() != TicketStatus.DONE)) {
                throw new UnauthorizedException("Cannot mark story as DONE: not all tasks are completed");
            }
        }
        TicketStatus oldStatus = story.getStatus();
        story.setStatus(request.getStatus());
        StoryResponse result = StoryResponse.from(storyRepository.save(story));
        activityLogService.log("STORY", id, story.getAssignee() != null ? story.getAssignee() : story.getReporter(),
            "STATUS_CHANGED", oldStatus + " → " + request.getStatus());
        if (story.getAssignee() != null && story.getReporter() != null
            && !story.getAssignee().getId().equals(story.getReporter().getId())) {
            notificationService.notify(story.getReporter(),
                "Story \"" + story.getTitle() + "\" status changed to " + request.getStatus(), "STORY", id);
        }
        return result;
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
        StoryResponse result = StoryResponse.from(storyRepository.save(story));
        activityLogService.log("STORY", storyId, requester, "ASSIGNED", "Assigned to " + assignee.getUsername());
        if (!assignee.getId().equals(requester.getId())) {
            notificationService.notify(assignee,
                requester.getUsername() + " assigned you to story: " + story.getTitle(), "STORY", storyId);
        }
        return result;
    }

    public void deleteStory(Long storyId) {
        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + storyId));
        List<Task> tasks = taskRepository.findByStoryId(storyId);
        for (Task task : tasks) {
            commentRepository.deleteAll(commentRepository.findByTaskIdOrderByCreatedAtAsc(task.getId()));
            attachmentService.deleteAllByTaskId(task.getId());
        }
        taskRepository.deleteAll(tasks);
        commentRepository.deleteAll(commentRepository.findByStoryIdOrderByCreatedAtAsc(storyId));
        attachmentService.deleteAllByStoryId(storyId);
        storyRepository.delete(story);
    }

    public StoryResponse assignReporter(Long storyId, AssignRequest request) {
        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + storyId));
        User reporter = userRepository.findById(request.getAssigneeId())
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + request.getAssigneeId()));
        story.setReporter(reporter);
        return StoryResponse.from(storyRepository.save(story));
    }
}
