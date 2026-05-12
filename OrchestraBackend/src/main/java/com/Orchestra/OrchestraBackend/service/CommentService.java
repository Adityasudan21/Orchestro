package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.request.CreateCommentRequest;
import com.Orchestra.OrchestraBackend.dto.response.CommentResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.exception.UnauthorizedException;
import com.Orchestra.OrchestraBackend.model.Comment;
import com.Orchestra.OrchestraBackend.model.Project;
import com.Orchestra.OrchestraBackend.model.Role;
import com.Orchestra.OrchestraBackend.model.Story;
import com.Orchestra.OrchestraBackend.model.Task;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.CommentRepository;
import com.Orchestra.OrchestraBackend.repository.ProjectRepository;
import com.Orchestra.OrchestraBackend.repository.StoryRepository;
import com.Orchestra.OrchestraBackend.repository.TaskRepository;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final StoryRepository storyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final Pattern MENTION_PATTERN = Pattern.compile("@([\\w.]+)");

    @Transactional(readOnly = true)
    public List<CommentResponse> getTaskComments(Long taskId) {
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
            .map(CommentResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getStoryComments(Long storyId) {
        return commentRepository.findByStoryIdOrderByCreatedAtAsc(storyId).stream()
            .map(CommentResponse::from)
            .collect(Collectors.toList());
    }

    public CommentResponse addTaskComment(Long taskId, CreateCommentRequest request, String username) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Comment comment = Comment.builder()
            .task(task)
            .user(user)
            .content(request.getContent())
            .build();
        CommentResponse result = CommentResponse.from(commentRepository.save(comment));
        processMentions(request.getContent(), user, "TASK", taskId);
        if (task.getAssignee() != null && !task.getAssignee().getId().equals(user.getId())) {
            notificationService.notify(task.getAssignee(),
                user.getUsername() + " commented on your task: " + task.getTitle(), "TASK", taskId);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getProjectComments(Long projectId) {
        return commentRepository.findByProjectIdOrderByCreatedAtAsc(projectId).stream()
            .map(CommentResponse::from)
            .collect(Collectors.toList());
    }

    public CommentResponse addProjectComment(Long projectId, CreateCommentRequest request, String username) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Comment comment = Comment.builder()
            .project(project)
            .user(user)
            .content(request.getContent())
            .build();
        return CommentResponse.from(commentRepository.save(comment));
    }

    public CommentResponse addStoryComment(Long storyId, CreateCommentRequest request, String username) {
        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + storyId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        Comment comment = Comment.builder()
            .story(story)
            .user(user)
            .content(request.getContent())
            .build();
        CommentResponse result = CommentResponse.from(commentRepository.save(comment));
        processMentions(request.getContent(), user, "STORY", storyId);
        if (story.getAssignee() != null && !story.getAssignee().getId().equals(user.getId())) {
            notificationService.notify(story.getAssignee(),
                user.getUsername() + " commented on your story: " + story.getTitle(), "STORY", storyId);
        }
        return result;
    }

    private void processMentions(String content, User commenter, String entityType, Long entityId) {
        Matcher m = MENTION_PATTERN.matcher(content);
        while (m.find()) {
            String mentioned = m.group(1);
            if (!mentioned.equals(commenter.getUsername())) {
                userRepository.findByUsername(mentioned).ifPresent(target ->
                    notificationService.notify(target,
                        commenter.getUsername() + " mentioned you in a comment", entityType, entityId)
                );
            }
        }
    }

    public void deleteComment(Long commentId, String username) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (!comment.getUser().getUsername().equals(username) && user.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
    }

    public CommentResponse updateComment(Long commentId, String content, String username) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (!comment.getUser().getUsername().equals(username) && user.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("You can only edit your own comments");
        }
        comment.setContent(content);
        return CommentResponse.from(commentRepository.save(comment));
    }
}
