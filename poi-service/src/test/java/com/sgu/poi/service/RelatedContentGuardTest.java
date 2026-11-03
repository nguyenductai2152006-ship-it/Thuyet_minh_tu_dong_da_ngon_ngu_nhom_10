package com.sgu.poi.service;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import org.springframework.web.server.ResponseStatusException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;
class RelatedContentGuardTest {
    HttpServer server; String url;
    @BeforeEach void start() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        url = "http://127.0.0.1:" + server.getAddress().getPort();
    }
    void reply(int status, String body) {
        server.createContext("/", exchange -> {
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, bytes.length);
            try (var out = exchange.getResponseBody()) { out.write(bytes); }
        }); server.start();
    }
    @AfterEach void stop() { server.stop(0); }
    @Test void acceptsEmptyRelatedLists() { reply(200, "[ ]"); assertDoesNotThrow(() -> new RelatedContentGuard(url, url).requireEmpty(3L)); }
    @Test void restrictsExistingTranslationsOrAudio() {
        reply(200, "[{\"id\":1}]");
        assertEquals(409, assertThrows(ResponseStatusException.class, () -> new RelatedContentGuard(url, url).requireEmpty(3L)).getStatusCode().value());
    }
    @Test void failsClosedWhenDependencyFails() {
        reply(503, "unavailable");
        assertEquals(502, assertThrows(ResponseStatusException.class, () -> new RelatedContentGuard(url, url).requireEmpty(3L)).getStatusCode().value());
    }
}
