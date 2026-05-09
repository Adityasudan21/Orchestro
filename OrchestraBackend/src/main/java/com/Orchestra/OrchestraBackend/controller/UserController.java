package com.Orchestra.OrchestraBackend.controller;

import com.Orchestra.OrchestraBackend.dto.response.UserResponse;
import com.Orchestra.OrchestraBackend.exception.ResourceNotFoundException;
import com.Orchestra.OrchestraBackend.model.Role;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream()
            .map(UserResponse::from)
            .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @GetMapping("/assignable")
    public ResponseEntity<List<UserResponse>> getAssignableUsers(Authentication auth) {
        User requester = userRepository.findByUsername(auth.getName())
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<User> users = requester.getRole() == Role.ADMIN
            ? userRepository.findAll()
            : userRepository.findByRoleIn(List.of(Role.MANAGER, Role.DEVELOPER));
        return ResponseEntity.ok(users.stream().map(UserResponse::from).collect(Collectors.toList()));
    }
}
