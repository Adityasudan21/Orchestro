package com.Orchestra.OrchestraBackend.config;

import com.Orchestra.OrchestraBackend.model.Role;
import com.Orchestra.OrchestraBackend.model.User;
import com.Orchestra.OrchestraBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initData() {
        return args -> {
            if (!userRepository.existsByUsername("admin")) {
                User admin = User.builder()
                    .username("admin")
                    .email("admin@orchestro.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
                userRepository.save(admin);
                log.info("Default admin created — username: admin / password: admin123");
            }
            if (!userRepository.existsByUsername("guest")) {
                User guest = User.builder()
                    .username("guest")
                    .email("guest@orchestro.com")
                    .password(passwordEncoder.encode("guest123"))
                    .role(Role.DEVELOPER)
                    .build();
                userRepository.save(guest);
                log.info("Guest account created — username: guest / password: guest123");
            }
            if (!userRepository.existsByUsername("ai-agent")) {
                User aiAgent = User.builder()
                    .username("ai-agent")
                    .email("ai-agent@orchestro.internal")
                    .password(passwordEncoder.encode(
                        System.getenv().getOrDefault("ORCHESTRO_AGENT_PASS", "changeme")))
                    .role(Role.DEVELOPER)
                    .build();
                userRepository.save(aiAgent);
                log.info("AI agent service account created — username: ai-agent");
            }
        };
    }
}
