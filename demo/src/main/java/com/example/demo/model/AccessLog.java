package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tabla de Auditoría de Seguridad (Logs).
 * Registra CADA movimiento importante de los archivos para rastreo forense.
 */

@Entity
@Table(name = "access_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Auto-incremental (1, 2, 3...), ideal para tablas de logs masivos

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // Quién hizo la acción (puede ser nulo si fue un acceso público fallido)

    @ManyToOne
    @JoinColumn(name = "file_id")
    private FileMetadata file; // Sobre qué archivo se hizo la acción

    @ManyToOne
    @JoinColumn(name = "file_share_id")
    private FileShare fileShare; // Bajo qué permisos se accedió

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessAction action; // Qué intentó hacer

    @Column(nullable = false)
    private String ipAddress; // Vital: La IP real de donde viene la petición

    private String userAgent; // El navegador o dispositivo (ej. Chrome en Windows 11)

    private Boolean success; // ¿Lo logró? (true = Éxito, false = Intento fallido)

    private String failureReason; // Si falló, ¿por qué? (ej. "Token SMS expirado", "Contraseña incorrecta")

    @Column(columnDefinition = "TEXT")
    private String details; // Extras (ej. "Intento 3 de 3 bloqueado")

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}
