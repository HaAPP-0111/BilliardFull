package com.dinhquangha.backend.config;

import com.dinhquangha.backend.model.BilliardTable;
import com.dinhquangha.backend.model.Employee;
import com.dinhquangha.backend.model.Product;
import com.dinhquangha.backend.repository.BilliardTableRepository;
import com.dinhquangha.backend.repository.EmployeeRepository;
import com.dinhquangha.backend.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner createDefaultAdmin(EmployeeRepository employeeRepository,
                                                ProductRepository productRepository,
                                                BilliardTableRepository tableRepository,
                                                PasswordEncoder passwordEncoder,
                                                @org.springframework.beans.factory.annotation.Value("${app.default-admin.username:admin}") String adminUsername,
                                                @org.springframework.beans.factory.annotation.Value("${app.default-admin.password:admin123}") String adminPassword) {
        return args -> {
            if (employeeRepository.findByUsername(adminUsername).isEmpty()) {
                Employee admin = new Employee();
                admin.setUsername(adminUsername);
                // encode password read from config or env
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setFullName("Administrator");
                admin.setRole("ROLE_ADMIN");
                admin.setEnabled(true);
                employeeRepository.save(admin);
                logger.info("Default admin created -> username: {}", adminUsername);
            } else {
                logger.info("Admin user already exists, skipping creation");
            }

            // Không seed products - để admin tự thêm

            // Không seed tables - để admin tự thêm
        };
    }
}
