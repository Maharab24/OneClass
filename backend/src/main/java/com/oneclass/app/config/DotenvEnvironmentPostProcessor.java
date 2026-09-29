package com.oneclass.app.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.MutablePropertySources;

import java.util.Map;

/**
 * Spring Boot EnvironmentPostProcessor that automatically loads properties
 * from a .env file into the Spring Environment before configuration files
 * (such as application.yml) are processed.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    public static final String PROPERTY_SOURCE_NAME = "dotenvProperties";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> envProperties = DotenvLoader.load();
        if (envProperties.isEmpty()) {
            return;
        }

        MutablePropertySources propertySources = environment.getPropertySources();
        if (propertySources.contains(PROPERTY_SOURCE_NAME)) {
            return;
        }

        MapPropertySource dotenvPropertySource = new MapPropertySource(PROPERTY_SOURCE_NAME, envProperties);

        // Add dotenv properties after systemEnvironment so OS environment variables take precedence,
        // but before application configuration files so values can be referenced by application.yml
        if (propertySources.contains("systemEnvironment")) {
            propertySources.addAfter("systemEnvironment", dotenvPropertySource);
        } else {
            propertySources.addFirst(dotenvPropertySource);
        }
    }

    @Override
    public int getOrder() {
        // Runs before ConfigDataEnvironmentPostProcessor (HIGHEST_PRECEDENCE + 10)
        return Ordered.HIGHEST_PRECEDENCE + 5;
    }
}

