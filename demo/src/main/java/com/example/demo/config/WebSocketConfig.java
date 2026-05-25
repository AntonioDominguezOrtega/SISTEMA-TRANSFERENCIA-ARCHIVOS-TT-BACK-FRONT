package com.example.demo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * CONFIGURACIÓN DE WEBSOCKETS (STOMP)
 * Permite comunicación bidireccional en tiempo real entre React y Spring Boot.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // --- Inyectamos interceptor de seguridad ---
    @Autowired
    private WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // "/topic": Para mensajes globales (ej. alertas de sistema para todos)
        // "/queue": Para mensajes directos 1 a 1 (ej. una notificación para ti)
        config.enableSimpleBroker("/topic", "/queue");

        // Si el cliente (React) le quiere mandar algo al servidor por el socket, usará "/app"
        config.setApplicationDestinationPrefixes("/app");

        // Prefijo para mandar cosas a un usuario específico (ej. "/user/maria/queue/notifications")
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // "/ws" es el "enchufe" al que React se va a conectar al iniciar la app.
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:3000") // Permite que tu Frontend se conecte
                .withSockJS(); // Fallback genial por si el internet bloquea WebSockets puros
    }

    // --- Registramos el interceptor en el canal de entrada ---
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor);
    }
}
