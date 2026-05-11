package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.response.AttachmentResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.model.Attachment;
import com.Orchestra.OrchestraBackend.model.Project;
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

    public Path getFilePath(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachmentId));
        return Paths.get(attachment.getFilePath());
    }

    private String storeFile(MultipartFile file) throws IOException {
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
