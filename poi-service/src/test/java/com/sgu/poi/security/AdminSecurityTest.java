package com.sgu.poi.security;
import com.sgu.poi.controller.AdminPoiController;
import com.sgu.poi.controller.PoiController;
import com.sgu.poi.service.PoiService;
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
class AdminSecurityTest {
    static final String SECRET = "test-only-signing-key-for-admin-security-0123456789";
    AnnotationConfigWebApplicationContext context;
    MockMvc mvc;
    @Configuration @EnableWebMvc @Import(SecurityConfig.class)
    static class Config {
        @Bean JwtUtils jwtUtils() { return new JwtUtils(SECRET); }
        @Bean JwtAuthenticationFilter jwtFilter(JwtUtils utils) { return new JwtAuthenticationFilter(utils); }
        @Bean PoiService poiService() { var service = mock(PoiService.class); when(service.getAll()).thenReturn(List.of()); when(service.getAllForAdmin()).thenReturn(List.of()); return service; }
        @Bean PoiController poiController(PoiService service) { return new PoiController(service); }
        @Bean AdminPoiController adminController(PoiService service) { return new AdminPoiController(service); }
    }
    @BeforeEach void setup() {
        context = new AnnotationConfigWebApplicationContext(); context.setServletContext(new MockServletContext());
        context.register(Config.class); context.refresh();
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
    }
    @AfterEach void cleanup() { context.close(); }
    String token(String role, long expires) { return Jwts.builder().subject("test@example.invalid").claim("role", role)
        .expiration(new Date(System.currentTimeMillis() + expires)).signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact(); }
    @Test void guestReadsPublicPois() throws Exception { mvc.perform(get("/api/pois")).andExpect(status().isOk()); }
    @Test void guestCannotReadAdminCatalogue() throws Exception { mvc.perform(get("/api/admin/pois")).andExpect(status().isUnauthorized()); }
    @Test void userCannotReadAdminCatalogue() throws Exception { mvc.perform(get("/api/admin/pois").header("Authorization", "Bearer " + token("USER", 60000))).andExpect(status().isForbidden()); }
    @Test void adminReadsFullCatalogue() throws Exception { mvc.perform(get("/api/admin/pois").header("Authorization", "Bearer " + token("ADMIN", 60000))).andExpect(status().isOk()); }
    @Test void expiredAdminTokenRejected() throws Exception { mvc.perform(get("/api/admin/pois").header("Authorization", "Bearer " + token("ADMIN", -10000))).andExpect(status().isUnauthorized()); }
    @Test void guestCannotMutatePoi() throws Exception { mvc.perform(delete("/api/pois/3")).andExpect(status().isUnauthorized()); }
    @Test void userCannotMutatePoi() throws Exception { mvc.perform(delete("/api/pois/3").header("Authorization", "Bearer " + token("USER", 60000))).andExpect(status().isForbidden()); }
    @Test void adminPassesDeleteAuthorization() throws Exception { mvc.perform(delete("/api/pois/3").header("Authorization", "Bearer " + token("ADMIN", 60000))).andExpect(status().isNoContent()); }
}
