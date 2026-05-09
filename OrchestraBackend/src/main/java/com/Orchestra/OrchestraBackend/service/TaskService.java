package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.request.CreateTaskRequest;
import com.Orchestra.OrchestraBackend.dto.request.UpdateStatusRequest;
import com.Orchestra.OrchestraBackend.dto.response.TaskResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.model.Story;
import com.Orchestra.OrchestraBackend.model.Task;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.StoryRepository;
import com.Orchestra.OrchestraBackend.repository.TaskRepository;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final StoryRepository storyRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByStory(Long storyId) {
        return taskRepository.findByStoryId(storyId).stream()
            .map(TaskResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(Long id) {
        return TaskResponse.from(taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMyAssignedTasks(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        return taskRepository.findByAssignee(user).stream()
            .map(TaskResponse::from)
            .collect(Collectors.toList());
    }

    public TaskResponse createTask(Long storyId, CreateTaskRequest request, String reporterUsername) {
        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + storyId));
        User reporter = userRepository.findByUsername(reporterUsername)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + reporterUsername));

        Task.TaskBuilder builder = Task.builder()
            .story(story)
            .title(request.getTitle())
            .description(request.getDescription())
            .type(request.getType())
            .reporter(reporter)
            .gitLink(request.getGitLink())
            .commitNumber(request.getCommitNumber())
            .branch(request.getBranch());

        if (request.getAssigneeId() != null) {
            userRepository.findById(request.getAssigneeId()).ifPresent(builder::assignee);
        }

        return TaskResponse.from(taskRepository.save(builder.build()));
    }

    public TaskResponse updateTask(Long id, CreateTaskRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
        task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getType() != null) task.setType(request.getType());
        if (request.getGitLink() != null) task.setGitLink(request.getGitLink());
        if (request.getCommitNumber() != null) task.setCommitNumber(request.getCommitNumber());
        if (request.getBranch() != null) task.setBranch(request.getBranch());
        if (request.getAssigneeId() != null) {
            userRepository.findById(request.getAssigneeId()).ifPresent(task::setAssignee);
        }
        return TaskResponse.from(taskRepository.save(task));
    }

    public TaskResponse updateStatus(Long id, UpdateStatusRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
        task.setStatus(request.getStatus());
        // TODO: when status == ASSIGNED_TO_AI, publish to Kafka topic 'ai-ticket-queue'
        return TaskResponse.from(taskRepository.save(task));
    }
}
