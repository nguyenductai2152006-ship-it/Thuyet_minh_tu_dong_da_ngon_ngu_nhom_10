package com.sgu.poi.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;
@Component
public class RelatedContentGuard {
    private final RestClient localization;
    private final RestClient audio;
    public RelatedContentGuard(@Value("${localization.service.url:http://localhost:8082}") String localizationUrl,
                               @Value("${audio.service.url:http://localhost:8083}") String audioUrl) {
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000); factory.setReadTimeout(5000);
        localization = RestClient.builder().baseUrl(localizationUrl).requestFactory(factory).build();
        audio = RestClient.builder().baseUrl(audioUrl).requestFactory(factory).build();
    }
    public void requireEmpty(Long id) {
        check(localization, "/api/localizations/poi/" + id);
        check(audio, "/api/audio/poi/" + id);
    }
    private void check(RestClient client, String path) {
        final String body;
        try {
 var request=client.get().uri(path);
 if(org.springframework.web.context.request.RequestContextHolder.getRequestAttributes() instanceof org.springframework.web.context.request.ServletRequestAttributes attrs){
  String token=attrs.getRequest().getHeader("Authorization");if(token!=null)request.header("Authorization",token);
 }
 body=request.retrieve().body(String.class);
}
        catch (RestClientException ex) { throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Không kiểm tra được nội dung liên quan. Chưa xóa POI."); }
        if (body == null || !body.replaceAll("\\s", "").equals("[]"))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "POI còn bản dịch hoặc audio. Hãy xóa nội dung liên quan hoặc chuyển POI sang INACTIVE.");
    }
}
