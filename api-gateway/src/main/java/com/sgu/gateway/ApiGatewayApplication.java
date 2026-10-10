package com.sgu.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("identity-service", r -> r.path("/api/v1/auth/**").uri("http://identity-service:8085"))
            .route("poi-service", r -> r.path("/api/pois/**").uri("http://poi-service:8081"))
            .route("localization-service", r -> r.path("/api/localizations/**").uri("http://localization-service:8082"))
            .route("audio-service", r -> r.path("/api/audio/**").uri("http://audio-service:8083"))
            .build();
    }
}