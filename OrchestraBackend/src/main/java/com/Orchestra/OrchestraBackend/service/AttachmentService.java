package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.response.AttachmentResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.exception.UnauthorizedException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import com.Orchestra.OrchestraBackend.model.Attachment;
import com.Orchestra.OrchestraBackend.model.Project;
import com.Orchestra.OrchestraBackend.model.Role;
import com.Orchestra.OrchestraBackend.model.Story;
import com.Orchestra.OrchestraBackend.model.Task;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.AttachmentRepository;
import com.Orchestra.OrchestraBackend.repository.ProjectRepository;
import com.Orchestra.OrchestraBackend.repository.StoryRepository;
import com.Orchestra.OrchestraBackend.repository.TaskRepository;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final StoryRepository storyRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_TYPES = Set.of(
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf",
        "text/plain", "text/csv", "text/markdown",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip"
    );

    @Transactional(readOnly = true)
    public List<AttachmentResponse> getTaskAttachments(Long taskId) {
        return attachmentRepository.findByTaskId(taskId).stream()
            .map(AttachmentResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> getStoryAttachments(Long storyId) {
        return attachmentRepository.findByStoryId(storyId).stream()
            .map(AttachmentResponse::from)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> getProjectAttachments(Long projectId) {
        return attachmentRepository.findByProjectId(projectId).stream()
            .map(AttachmentResponse::from)
            .collect(Collectors.toList());
    }

    public AttachmentResponse uploadToProject(Long projectId, MultipartFile file, String username) throws IOException {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        String filePath = storeFile(file);
        Attachment attachment = Attachment.builder()
            .project(project)
            .fileName(file.getOriginalFilename())
            .filePath(filePath)
            .contentType(file.getContentType())
            .uploadedBy(user)
            .build();
        return AttachmentResponse.from(attachmentRepository.save(attachment));
    }

    public AttachmentResponse uploadToTask(Long taskId, MultipartFile file, String username) throws IOException {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        String filePath = storeFile(file);
        Attachment attachment = Attachment.builder()
            .task(task)
            .fileName(file.getOriginalFilename())
            .filePath(filePath)
            .contentType(file.getContentType())
            .uploadedBy(user)
            .build();
        return AttachmentResponse.from(attachmentRepository.save(attachment));
    }

    public AttachmentResponse uploadToStory(Long storyId, MultipartFile file, String username) throws IOException {
        Story story = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story not found: " + storyId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        String filePath = storeFile(file);
        Attachment attachment = Attachment.builder()
            .story(story)
            .fileName(file.getOriginalFilename())
            .filePath(filePath)
            .contentType(file.getContentType())
            .uploadedBy(user)
            .build();
        return AttachmentResponse.from(attachmentRepository.save(attachment));
    }

    @Transactional(readOnly = true)
    public Path getFilePath(Long attachmentId, String username) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachmentId));
        if (username != null) {
            User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
            if (!canAccess(attachment, user)) {
                throw new UnauthorizedException("You do not have access to this attachment");
            }
        }
        return Paths.get(attachment.getFilePath());
    }

    private boolean canAccess(Attachment attachment, User user) {
        if (user.getRole() == Role.ADMIN) return true;
        if (attachment.getUploadedBy().getId().equals(user.getId())) return true;
        Project project = null;
        if (attachment.getProject() != null) project = attachment.getProject();
        else if (attachment.getStory() != null) project = attachment.getStory().getProject();
        else if (attachment.getTask() != null) project = attachment.getTask().getStory().getProject();
        if (project == null) return false;
        return project.getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()))
            || (project.getAssignee() != null && project.getAssignee().getId().equals(user.getId()))
            || (project.getReporter() != null && project.getReporter().getId().equals(user.getId()))
            || (project.getCreatedBy() != null && project.getCreatedBy().getId().equals(user.getId()));
    }

    public void deleteAttachment(Long attachmentId, String username) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachmentId));
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
        if (!attachment.getUploadedBy().getUsername().equals(username) && user.getRole() != Role.ADMIN) {
            throw new UnauthorizedException("You can only delete your own attachments");
        }
        deleteFileAndRecord(attachment);
    }

    public void deleteAllByTaskId(Long taskId) {
        attachmentRepository.findByTaskId(taskId).forEach(this::deleteFileAndRecord);
    }

    public void deleteAllByStoryId(Long storyId) {
        attachmentRepository.findByStoryId(storyId).forEach(this::deleteFileAndRecord);
    }

    public void deleteAllByProjectId(Long projectId) {
        attachmentRepository.findByProjectId(projectId).forEach(this::deleteFileAndRecord);
    }

    private void deleteFileAndRecord(Attachment attachment) {
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException ignored) {}
        attachmentRepository.delete(attachment);
    }

    private String storeFile(MultipartFile file) throws IOException {
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File exceeds 10 MB limit");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                "File type not allowed: " + contentType);
        }
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        String uniqueName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path dest = uploadPath.resolve(uniqueName);
        Files.copy(file.getInputStream(), dest);
        return dest.toString();
    }
}
