package com.dinhquangha.backend.config;

import com.dinhquangha.backend.security.JwtAuthenticationFilter;
import com.dinhquangha.backend.security.UserDetailsServiceImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(UserDetailsServiceImpl userDetailsService,
                          JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.userDetailsService = userDetailsService;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    // ====== 1) Password Encoder ======
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ====== 2) Auth Provider ======
    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    // ====== 3) AuthenticationManager (dùng trong AuthController) ======
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ====== 4) CORS (Local + Deploy) ======
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Nếu bạn dùng JWT Bearer (Authorization header) thì thường KHÔNG cần credentials
        // (credentials chỉ cần khi dùng cookie/session).
        config.setAllowCredentials(false);

        // ✅ Origins được phép (SỬA/THÊM domain frontend của bạn ở đây)
        List<String> FRONTEND_ORIGINS = List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",

                // ====== DEPLOY DOMAINS (chọn cái bạn dùng) ======
                "https://YOUR_DOMAIN.com",      // domain riêng (nếu có)
                "https://*.vercel.app",         // Vercel
                "https://*.netlify.app",        // Netlify
                "https://*.railway.app"         // Railway (tuỳ dự án)
        );

        for (String origin : FRONTEND_ORIGINS) {
            config.addAllowedOriginPattern(origin);
        }

        // Cho phép các method/headers
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");

        // Expose header nếu cần (thường không bắt buộc cho Bearer token)
        config.addExposedHeader("Authorization");

        // Cache preflight
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ====== 5) Security Filter Chain ======
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Bật CORS theo bean CorsConfigurationSource ở trên
                .cors(Customizer.withDefaults())

                // Tắt CSRF (REST + JWT)
                .csrf(AbstractHttpConfigurer::disable)

                // Stateless session
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Phân quyền endpoint
                .authorizeHttpRequests(auth -> auth
                        // ✅ Cho phép test nhanh
                        .requestMatchers("/", "/health").permitAll()

                        // Static uploads
                        .requestMatchers("/uploads/**").permitAll()

                        // Preflight request luôn cho phép
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public GET endpoints
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tables/**").permitAll()

                        // Invoice public (như bạn đang để)
                        .requestMatchers("/api/invoices", "/api/invoices/**").permitAll()

                        // Upload public
                        .requestMatchers(HttpMethod.POST, "/api/upload/**").permitAll()

                        // Auth + Reservation + Swagger
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/reservations",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/swagger-ui/index.html"
                        ).permitAll()

                        // Còn lại bắt buộc có JWT
                        .anyRequest().authenticated()
                )

                // Provider
                .authenticationProvider(daoAuthenticationProvider())

                // JWT filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
