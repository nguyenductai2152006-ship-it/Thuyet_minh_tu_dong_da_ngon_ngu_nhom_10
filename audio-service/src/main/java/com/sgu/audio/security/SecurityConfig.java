package com.sgu.audio.security;

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
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .exceptionHandling(exception ->
                        exception
                                .authenticationEntryPoint(
                                        unauthorizedEntryPoint
                                )

                                .accessDeniedHandler(
                                        (request, response,
                                         accessDeniedException) -> {

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

                .authorizeHttpRequests(authorize ->
                        authorize

                                .requestMatchers(
                                        "/actuator/health",
                                        "/actuator/info",
                                        "/error"
                                )
                                .permitAll()

                                .requestMatchers(
                                        HttpMethod.GET,
                                        "/api/audio",
                                        "/api/audio/**"
                                )
                                .hasAnyRole("USER", "ADMIN")

                                .requestMatchers(
                                        HttpMethod.POST,
                                        "/api/audio"
                                )
                                .hasRole("ADMIN")

                                .requestMatchers(
                                        HttpMethod.PUT,
                                        "/api/audio/**"
                                )
                                .hasRole("ADMIN")

                                .requestMatchers(
                                        HttpMethod.DELETE,
                                        "/api/audio/**"
                                )
                                .hasRole("ADMIN")

                                .anyRequest()
                                .authenticated()
                )

                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }
}