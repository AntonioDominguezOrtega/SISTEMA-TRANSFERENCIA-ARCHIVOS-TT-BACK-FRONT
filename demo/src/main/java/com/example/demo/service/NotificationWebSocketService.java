package com.example.demo.service;

import com.example.demo.model.Notification;
import com.example.demo.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * SERVICIO DE NOTIFICACIONES EN TIEMPO REAL
 * Utiliza WebSockets para "empujar" (push) las alertas directamente
 * a la pantalla del usuario en React sin que él tenga que recargar la página.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    // La herramienta principal de Spring para mandar mensajes por WebSockets
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Enviar notificación directa a UN usuario específico (1 a 1).
     * Ideal para alertas como: "Carlos descargó tu archivo".
     */
    public void sendToUser(User user, Notification notification) {
        // La cola privada del usuario. En React escucharán en: /user/{username}/queue/notifications
        String destination = "/queue/notifications";

        // Convertimos la notificación de BD a un DTO ligero por seguridad
        NotificationDTO dto = NotificationDTO.fromEntity(notification);

        // Dispara el mensaje al canal del usuario
        messagingTemplate.convertAndSendToUser(
                user.getUsername(),
                destination,
                dto
        );

        log.info("Notificación en tiempo real enviada al usuario {}: {}", user.getUsername(), notification.getMessage());
    }

    /**
     * Enviar notificación a un grupo de usuarios.
     * Útil si un archivo se comparte con un equipo entero.
     */
    public void sendToUser(Iterable<User> users, Notification notification) {
        users.forEach(user -> sendToUser(user, notification));
    }

    /**
     * Enviar notificación a TODOS los conectados (Broadcast).
     * Útil para alertas globales del sistema (ej. "Mantenimiento en 5 min").
     */
    public void sendToTopic(String topic, Object payload) {
        messagingTemplate.convertAndSend("/topic/" + topic, payload);
    }

    /**
     * DTO LIGERO (Data Transfer Object)
     * Usamos 'record' (característica de Java 14+) para crear una clase inmutable rápida.
     * Protege datos sensibles: No envía contraseñas, ni tokens SMS, solo lo necesario para pintar la campanita en React.
     */
    public record NotificationDTO(
            String id,
            String type,
            String message,
            String fileShareId,
            String fileName,
            String shareBy,
            boolean isRead,
            String cratedAt
    ) {
        public static  NotificationDTO fromEntity(Notification notification) {
            return new NotificationDTO(
                    notification.getId(),
                    notification.getType().toString(),
                    notification.getMessage(),
                    notification.getFileShare() != null ? notification.getFileShare().getId() : null,
                    notification.getFileShare() != null ?
                            notification.getFileShare().getFile().getFileName() : null,
                    notification.getFileShare() != null ?
                            notification.getFileShare().getSharedBy().getNombre() + " " +
                                    notification.getFileShare().getSharedBy().getApellido() : null,
                    notification.getIsRead(),
                    notification.getCreatedAt().toString()
            );
        }
    }
}
