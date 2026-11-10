package com.sgu.localization.security;
import com.sgu.localization.controller.PoiLocalizationController;
import com.sgu.localization.service.PoiLocalizationService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.*;
import org.springframework.context.annotation.*;
import org.springframework.mock.web.MockServletContext;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
class AdminContentSecurityTest {
    static final String SECRET = "test-only-signing-key-for-admin-security-0123456789";
    AnnotationConfigWebApplicationContext context; MockMvc mvc;
    @Configuration @EnableWebMvc @Import(SecurityConfig.class)
    static class Config {
        @Bean JwtUtils jwtUtils() { return new JwtUtils(SECRET); }
        @Bean JwtAuthenticationFilter jwtFilter(JwtUtils utils) { return new JwtAuthenticationFilter(utils); }
        @Bean PoiLocalizationService service() { var service = mock(PoiLocalizationService.class); when(service.findByPoiId(3L)).thenReturn(List.of()); return service; }
        @Bean PoiLocalizationController controller(PoiLocalizationService service) { return new PoiLocalizationController(service); }
    }
    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext(); context.setServletContext(new MockServletContext()); context.register(Config.class); context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
    }
    @AfterEach void cleanup() { context.close(); }
    String token(String role) { return Jwts.builder().subject("test@example.invalid").claim("role", role).expiration(new Date(System.currentTimeMillis() + 60000))
        .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact(); }
    @Test void publicReadWorksWithoutLogin() throws Exception { mvc.perform(get("/api/localizations").param("poiId", "3")).andExpect(status().isOk()); }
    @Test void guestCannotDelete() throws Exception { mvc.perform(delete("/api/localizations/3")).andExpect(status().isUnauthorized()); }
    @Test void userCannotDelete() throws Exception { mvc.perform(delete("/api/localizations/3").header("Authorization", "Bearer " + token("USER"))).andExpect(status().isForbidden()); }
    @Test void adminCanDelete() throws Exception { mvc.perform(delete("/api/localizations/3").header("Authorization", "Bearer " + token("ADMIN"))).andExpect(status().isNoContent()); }
    @Test void guestCannotCreate() throws Exception { mvc.perform(post("/api/localizations").contentType("application/json").content("{}")).andExpect(status().isUnauthorized()); }
    @Test void userCannotUpdate() throws Exception { mvc.perform(put("/api/localizations/3").contentType("application/json").content("{}").header("Authorization", "Bearer " + token("USER"))).andExpect(status().isForbidden()); }
}
