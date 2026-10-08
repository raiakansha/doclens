package com.project.doclens_backend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class CorsConfig implements WebMvcConfigurer {

    private final AppProperties appProperties;


    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins = appProperties.getCors().getAllowedOrigins().split(",");
        String[] allowerHeaders = appProperties.getCors().getAllowedHeaders().split(",");
        String[] allowerMethods = appProperties.getCors().getAllowedMethods().split(",");

        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedHeaders(allowerHeaders)
                .allowedMethods(allowerMethods)
                .allowCredentials(true);

    }
}
