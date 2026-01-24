package com.dinhquangha.backend.security;

import com.dinhquangha.backend.model.Employee;
import com.dinhquangha.backend.repository.EmployeeRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final EmployeeRepository employeeRepository;

    public UserDetailsServiceImpl(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Employee emp = employeeRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String role = emp.getRole(); // "ADMIN" / "EMPLOYEE"
        if (role != null && !role.startsWith("ROLE_")) {
            role = "ROLE_" + role;
        }

        GrantedAuthority authority = new SimpleGrantedAuthority(role);

        return new User(
                emp.getUsername(),
                emp.getPassword(),
                emp.isEnabled(),
                true,
                true,
                true,
                Collections.singleton(authority)
        );
    }
}
