package com.oneclass.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        // Destination prefix for messages bound for methods annotated with @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
        // Simple in-memory message broker to carry messages to clients on destination prefixes
        registry.enableSimpleBroker("/topic");
    }

    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // Register standard WebSocket endpoint and SockJS fallback endpoint
        registry.addEndpoint("/ws-whiteboard")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        registry.addEndpoint("/ws-whiteboard")
                .setAllowedOriginPatterns("*");
    }
}
