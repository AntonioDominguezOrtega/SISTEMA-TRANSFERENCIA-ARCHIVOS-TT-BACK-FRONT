package com.example.demo.dto;

import com.example.demo.model.AccessLevel;
import com.example.demo.model.SecurityLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * DTO para mostrar la información del archivo compartido en la UI.
 * Se usa para pintar las bandejas de entrada/salida sin revelar datos sensibles (como hashes o llaves AES).
 */
@Data
@Builder // Patrón Builder para crear respuestas fácilmente en el servicio
public class FileShareResponse {
    private String shareId; // ID de la transacción (FileShare)

    // Datos del archivo
    private String fileName; // Ej: "contrato_confidencial.pdf"
    private Long fileSize; // Ej: 5347732 (bytes)
    private String fileType; // Ej: "application/pdf"

    // Tiempos
    private LocalDateTime sharedAt; // Hace 30 min
    private LocalDateTime expiresAt; // Expira en 23h

    // Usuarios involucrados
    private String sharedBy; // Antonio Ortega
    private String sharedWith; // Ambar Garcia

    // Seguridad y Permisos
    private AccessLevel accessLevel; // Solo lectura o descarga
    private SecurityLevel securityLevel; // Token SMS

    // Estado actual de bloqueo (Vital para la UI)
    private Boolean inUnlocked; // ¿Ya ingresó el SMS? Si es true, mostramos [Ver Archivo
    private Boolean hasPassword;  // true si el archivo tiene contraseña configurada
    private LocalDateTime unlockedUntil;  // Si está desbloqueado, ¿hasta cuándo? (Las 24 hrs de gracia)

    // Estadisticas
    private Integer viewCount;
    private Integer donwloadCount;

    // Mensaje adjunto
    private String message;
    private String subject;
}
