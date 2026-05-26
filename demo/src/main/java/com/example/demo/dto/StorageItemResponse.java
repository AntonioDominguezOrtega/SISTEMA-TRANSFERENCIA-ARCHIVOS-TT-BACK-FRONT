package com.example.demo.dto;

import com.example.demo.model.AccessLevel;
import com.example.demo.model.SecurityLevel;
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
    private SecurityLevel securityLevel;
    private AccessLevel accessLevel;

    // Para saber si el archivo está "bloqueado" (requiere token/contraseña para abrir)
    private Boolean hasPassword;       // Si tiene contraseña configurada

    // Estado de bloqueo
    private Boolean isLocked;          // Si requiere desbloqueo
    private Boolean isUnlocked;        // Si ya está desbloqueado
    private LocalDateTime unlockedUntil; // Hasta cuándo está desbloqueado
}