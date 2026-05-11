package com.Orchestra.OrchestraBackend.service;

import com.Orchestra.OrchestraBackend.dto.request.ChangePasswordRequest;
import com.Orchestra.OrchestraBackend.dto.request.UpdateRoleRequest;
import com.Orchestra.OrchestraBackend.dto.response.UserResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final StoryRepository storyRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final PasswordEncoder passwordEncoder;

    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public void verifyCurrentPassword(String username, String currentPassword) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
    }

    public UserResponse updateRole(Long userId, UpdateRoleRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        user.setRole(request.getRole());
        return UserResponse.from(userRepository.save(user));
    }

    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Null out all assignee/reporter/createdBy references
        projectRepository.clearAssignee(user);
        projectRepository.clearReporter(user);
        projectRepository.clearCreatedBy(user);
        storyRepository.clearAssignee(user);
        storyRepository.clearReporter(user);
        taskRepository.clearAssignee(user);
        taskRepository.clearReporter(user);

        // Remove from project membership join table
        projectRepository.removeUserFromAllProjects(userId);

        // Delete comments and attachments created by this user
        commentRepository.deleteByUser(user);
        attachmentRepository.deleteByUploadedBy(user);

        userRepository.delete(user);
    }
}
