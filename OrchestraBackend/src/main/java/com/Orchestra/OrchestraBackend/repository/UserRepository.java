package com.Orchestra.OrchestraBackend.repository;

import com.Orchestra.OrchestraBackend.model.Role;
import com.Orchestra.OrchestraBackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findByRoleIn(List<Role> roles);
}
