package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class StorageItemResponse {
    private String id;
    private String name;
    private Boolean isFolder;
    private String folderColor;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadedAt;

    // Niveles de seguridad (para archivos)
    private String securityLevel;      // "PUBLIC", "PASSWORD", "TOKEN_SMS"
    private String accessLevel;        // "READ_ONLY", "DOWNLOAD"
    private Boolean hasPassword;       // Si tiene contraseña configurada

    // Estado de bloqueo
    private Boolean isLocked;          // Si requiere desbloqueo
    private Boolean isUnlocked;        // Si ya está desbloqueado
    private LocalDateTime unlockedUntil; // Hasta cuándo está desbloqueado
}