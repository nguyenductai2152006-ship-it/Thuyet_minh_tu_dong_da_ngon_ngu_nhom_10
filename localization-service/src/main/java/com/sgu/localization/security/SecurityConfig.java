package com.sgu.localization.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        AuthenticationEntryPoint unauthorizedEntryPoint =
                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED);

        http
                // REST API không sử dụng CSRF token
                .csrf(csrf -> csrf.disable())

                // Không lưu session
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                // Xử lý 401 / 403
                .exceptionHandling(exception ->
                        exception
                                .authenticationEntryPoint(
                                        unauthorizedEntryPoint
                                )
                                .accessDeniedHandler(
                                        (request, response, accessDeniedException) -> {
                                            response.setStatus(
                                                    HttpStatus.FORBIDDEN.value()
                                            );
                                            response.setContentType(
                                                    "application/json"
                                            );
                                            response.getWriter().write(
                                                    "{\"status\":403,\"error\":\"FORBIDDEN\",\"message\":\"Access denied\"}"
                                            );
                                        }
                                )
                )

                // Phân quyền endpoint
                .authorizeHttpRequests(authorize -> authorize

                        // Public
                        .requestMatchers(
                                "/actuator/health",
                                "/actuator/info",
                                "/error"
                        ).permitAll()

                        // USER + ADMIN được đọc localization
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/localizations",
                                "/api/localizations/**"
                        ).hasAnyRole("USER", "ADMIN")

                        // Chỉ ADMIN được tạo
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/localizations"
                        ).hasRole("ADMIN")

                        // Chỉ ADMIN được sửa
                        .requestMatchers(
                                HttpMethod.PUT,
                                "/api/localizations/**"
                        ).hasRole("ADMIN")

                        // Chỉ ADMIN được xóa
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/localizations/**"
                        ).hasRole("ADMIN")

                        // Các endpoint khác phải đăng nhập
                        .anyRequest().authenticated()
                )

                // JWT filter chạy trước UsernamePasswordAuthenticationFilter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}