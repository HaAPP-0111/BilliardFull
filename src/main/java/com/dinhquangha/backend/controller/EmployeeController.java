package com.dinhquangha.backend.controller;

import com.dinhquangha.backend.model.Employee;
import com.dinhquangha.backend.repository.EmployeeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class EmployeeController {

    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    public EmployeeController(EmployeeRepository employeeRepository, PasswordEncoder passwordEncoder) {
        this.employeeRepository = employeeRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String fullName = body.getOrDefault("fullName", "");
        // default to regular user for self-registration
        String role = body.getOrDefault("role", "ROLE_USER");
        if (employeeRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }
        Employee emp = new Employee();
        emp.setUsername(username);
        emp.setPassword(passwordEncoder.encode(password));
        emp.setFullName(fullName);
        emp.setRole(role);
        emp.setEnabled(true);
        employeeRepository.save(emp);
        return ResponseEntity.ok(Map.of("msg", "registered"));
    }
}
