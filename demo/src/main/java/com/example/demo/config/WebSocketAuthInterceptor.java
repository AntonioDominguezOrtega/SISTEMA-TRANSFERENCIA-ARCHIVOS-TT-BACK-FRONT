package com.example.demo.config;

import com.example.demo.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;

/**
 * INTERCEPTOR DE SEGURIDAD PARA WEBSOCKETS
 * Como los WebSockets (ws://) no pasan por la seguridad normal de HTTP (http://),
 * necesitamos este filtro para validar el JWT cuando React intente conectarse al canal.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    /**
     * Este método se ejecuta CADA VEZ que un mensaje viaja por el tubo de WebSockets.
     */
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // Envolvemos el mensaje para poder leer sus cabeceras STOMP
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // SOLO nos interesa validar cuando el usuario intenta conectarse por primera vez (CONNECT)
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {

            // React debe enviar el token en la cabecera "Authorization" al conectarse
            String token = accessor.getFirstNativeHeader("Authorization");

            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7); // Quitamos "Bearer "

                // Validamos el Token JWT usando tu herramienta existente
                if (jwtUtils.validateJwtToken(token)) {
                    String username = jwtUtils.getUsernameFromJwtToken(token);

                    // Cargamos los datos del usuario (Roles, etc.)
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    // Creamos el pase de acceso oficial de Spring Security
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());

                    // Le pegamos la identidad de seguridad a la sesión del WebSocket
                    accessor.setUser(authentication);
                    log.info("Usuario {} autenticado exitosamente via WebSocket", username);
                }
            }
        }

        // Dejamos que el mensaje siga su camino normal
        return message;
    }
}
