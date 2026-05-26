package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidad para manejar las alertas dentro de la plataforma (Campanita de notificaciones).
 * Permite avisar al usuario cuando le envían un archivo o cuando abren uno suyo.
 */

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id; // UUID para que no sean predecibles (no pueden adivinar la notificación 1, 2, 3...)

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // El dueño de la notificación (quién la va a leer)

    @ManyToOne
    @JoinColumn(name = "file_share_id")
    private FileShare fileShare; // Opcional: El enlace directo a la transacción que generó el aviso

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type; // Categoría de la notificación

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message; // El texto visible: "Carlos ha descargado tu archivo PDF"

    @Column(nullable = false)
    private Boolean isRead = false; // ¿Ya la vio el usuario? (Para el puntito rojo en la UI)

    private LocalDateTime readAt; // Cuándo la leyó exactamente

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Se ejecuta automáticamente antes de guardar en la BD por primera vez
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
