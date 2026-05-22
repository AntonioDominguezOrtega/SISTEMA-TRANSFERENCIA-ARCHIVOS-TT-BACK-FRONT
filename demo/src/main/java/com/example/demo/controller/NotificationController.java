package com.example.demo.controller;

import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Obtener el historial de notificaciones del usuario (Para el menú desplegable de la campanita).
     * Incluye paginación y el contador de cuántas están sin leer (para el puntito rojo).
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getNotification(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        try {
            User currentUser = getCurrentUser();

            // Buscar notificaciones paginadas
            Page<Notification> notifications = notificationRepository.findByUserOrderByCreatedAtDesc(
                    currentUser,
                    PageRequest.of(page, size)
            );

            // Contar cuántas no ha leído
            long unreadCount = notificationRepository.countUnreadByUser(currentUser);

            return ResponseEntity.ok(Map.of(
                    "notifications", notifications.getContent(),
                    "totalPages", notifications.getTotalPages(),
                    "totalElements", notifications.getTotalElements(),
                    "unreadCount", unreadCount
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Marcar una sola notificación como leída (Cuando el usuario le da clic a una alerta específica).
     */
    @PostMapping("/{id}/read")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            User currentUser = getCurrentUser();

            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification no encontrado"));

            // Validar que la notificación le pertenezca al usuario actual (Evita ataques IDOR)
            if (!notification.getUser().getId().equals(currentUser.getId())) {
                throw new RuntimeException("No tiene permiso para modificar esta notificacion");
            }

            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);

            return ResponseEntity.ok(Map.of("message", "Notificacion marcada como leida"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Marcar TODAS las notificaciones como leídas (Para el botón "Marcar todo como leído").
     */
    @PostMapping("/read-all")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> markAllAsRead() {
        try {
            User currentUser = getCurrentUser();

            int update = notificationRepository.markAllAsRead(currentUser, LocalDateTime.now());

            return ResponseEntity.ok(Map.of(
                    "message", "Todas las notificaciones marcadas como leidas",
                    "count", update
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // --- MÉTODO AUXILIAR ---

    /**
     * Extrae al usuario autenticado del token JWT actual.
     * Esto evita repetir el código de SecurityContextHolder en cada método.
     */
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }
}
