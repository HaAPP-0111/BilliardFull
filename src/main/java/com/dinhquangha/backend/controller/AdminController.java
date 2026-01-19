package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.model.Employee;
import com.dinhquangha.backend.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminResetKey;

    public AdminController(EmployeeRepository employeeRepository,
                           PasswordEncoder passwordEncoder,
                           @Value("${app.admin-reset-key:}") String adminResetKey) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminResetKey = adminResetKey;
    }

    /**
     * Securely reset a user's password using a one-time reset key configured in the environment.
     * Body: { "username": "admin", "newPassword": "...", "resetKey": "..." }
     * The endpoint is only allowed when `app.admin-reset-key` is set and matches the provided resetKey.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String newPassword = body.get("newPassword");
        String providedKey = body.get("resetKey");

        if (adminResetKey == null || adminResetKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Admin reset not enabled"));
        }
        if (providedKey == null || !providedKey.equals(adminResetKey)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Invalid reset key"));
        }
        if (username == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "username and newPassword are required"));
        }

        Optional<Employee> opt = employeeRepository.findByUsername(username);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "user not found"));
        }

        Employee user = opt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        employeeRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "password-updated", "username", username));
    }

    /**
     * Promote a user to admin role. Only callable by existing admins.
     * Example: POST /api/admin/promote/{username}
     */
    @PostMapping("/promote/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> promoteToAdmin(@PathVariable String username) {
        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "username is required"));
        }

        Optional<Employee> opt = employeeRepository.findByUsername(username);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "user not found"));
        }

        Employee user = opt.get();
        user.setRole("ROLE_ADMIN");
        employeeRepository.save(user);
        return ResponseEntity.ok(Map.of("status", "promoted", "username", username));
    }
}
