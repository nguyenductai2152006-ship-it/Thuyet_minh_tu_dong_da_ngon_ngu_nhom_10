package com.sgu.identity.security;

import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RegistrationSecurityTest {
    AnnotationConfigWebApplicationContext context;
    MockMvc mvc;
    @RestController static class Endpoint {
        @PostMapping("/api/v1/auth/register") String register() { return "authorized"; }
    }
    @Configuration @EnableWebMvc @Import(SecurityConfig.class)
    static class Config {
        @Bean JwtUtils jwtUtils() { return new JwtUtils("test-only-registration-secret-01234567890123456789", 60000); }
        @Bean UserDetailsService users() { return email -> User.withUsername(email).password("unused")
                .roles(email.startsWith("admin") ? "ADMIN" : "USER").build(); }
        @Bean JwtAuthenticationFilter jwtFilter(JwtUtils jwt, UserDetailsService users) {
            return new JwtAuthenticationFilter(jwt, users);
        }
        @Bean Endpoint endpoint() { return new Endpoint(); }
    }
    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext();
        context.setServletContext(new MockServletContext());
        context.register(Config.class); context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(FilterChainProxy.class)).build();
    }
    @AfterEach void cleanup() { context.close(); }
    String token(String role) { return context.getBean(JwtUtils.class)
            .generateToken(role.toLowerCase() + "@example.invalid", role); }
    @Test void guestGets401() throws Exception {
        mvc.perform(post("/api/v1/auth/register")).andExpect(status().isUnauthorized());
    }
    @Test void userGets403WithoutContainerErrorDispatch() throws Exception {
        mvc.perform(post("/api/v1/auth/register").header("Authorization", "Bearer " + token("USER")))
                .andExpect(status().isForbidden())
                .andExpect(result -> assertNull(result.getResponse().getErrorMessage()));
    }
    @Test void adminReachesRegistration() throws Exception {
        mvc.perform(post("/api/v1/auth/register").header("Authorization", "Bearer " + token("ADMIN")))
                .andExpect(status().isOk());
    }
    @Test void invalidTokenGets401() throws Exception {
        mvc.perform(post("/api/v1/auth/register").header("Authorization", "Bearer invalid"))
                .andExpect(status().isUnauthorized());
    }
}
