package com.sgu.localization.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;
@Component
public class PoiReferenceValidator {
    private final RestClient client;
    public PoiReferenceValidator(@Value("${poi.service.url:http://localhost:8081}") String baseUrl) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); factory.setReadTimeout(5000);
        client = RestClient.builder().baseUrl(baseUrl).requestFactory(factory).build();
    }
    public void requireExisting(Long poiId) { check(poiId,true); }
    public void requireReadable(Long poiId) { check(poiId,false); }
    private void check(Long poiId,boolean writing) {
        String token = null;
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes)
            token = attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
        var request = client.get().uri("/api/pois/{id}", poiId);
        if (token != null) request.header(HttpHeaders.AUTHORIZATION, token);
        try { request.retrieve().toBodilessEntity(); }
        catch (HttpClientErrorException.NotFound ex) { throw new ResponseStatusException(writing ? HttpStatus.BAD_REQUEST : HttpStatus.NOT_FOUND, "POI không tồn tại hoặc không được phép truy cập."); }
        catch (RestClientException ex) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không xác minh được POI. Chưa lưu thay đổi."); }
    }
}
