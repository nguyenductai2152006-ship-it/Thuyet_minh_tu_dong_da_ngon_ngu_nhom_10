package com.sgu.identity.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;

import static org.junit.jupiter.api.Assertions.*;

class JwtAuthenticationFilterTest {
    private final JwtUtils jwt = new JwtUtils("test-only-identity-filter-secret-01234567890123456789", 60000);
    private final UserDetailsService users = email -> User.withUsername(email)
            .password("unused").roles(email.startsWith("admin") ? "ADMIN" : "USER").build();
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt, users);

    @AfterEach void clearContext() { SecurityContextHolder.clearContext(); }

    private MockHttpServletRequest register(String token) {
        var request = new MockHttpServletRequest("POST", "/api/v1/auth/register");
        request.setServletPath("/api/v1/auth/register");
        if (token != null) request.addHeader("Authorization", "Bearer " + token);
        return request;
    }

    @Test void registrationIsFilteredAndLoginIsSkipped() {
        assertFalse(filter.shouldNotFilter(register(null)));
        var login = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        login.setServletPath("/api/v1/auth/login");
        assertTrue(filter.shouldNotFilter(login));
    }

    private void assertRole(String email, String role) throws Exception {
        filter.doFilter(register(jwt.generateToken(email, role)), new MockHttpServletResponse(), (request, response) -> {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            assertNotNull(auth, "Registration must authenticate the bearer token before role authorization");
            assertEquals(email, auth.getName());
            assertTrue(auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role)));
        });
    }

    @Test void adminTokenIsAuthenticatedOnRegistration() throws Exception {
        assertRole("admin@example.invalid", "ADMIN");
    }

    @Test void userTokenRetainsUserRoleOnRegistration() throws Exception {
        assertRole("user@example.invalid", "USER");
    }

    @Test void guestRemainsUnauthenticated() throws Exception {
        filter.doFilter(register(null), new MockHttpServletResponse(), (request, response) ->
                assertNull(SecurityContextHolder.getContext().getAuthentication()));
    }

    @Test void invalidTokenRemainsUnauthenticated() throws Exception {
        filter.doFilter(register("not-a-valid-jwt"), new MockHttpServletResponse(), (request, response) ->
                assertNull(SecurityContextHolder.getContext().getAuthentication()));
    }
}
