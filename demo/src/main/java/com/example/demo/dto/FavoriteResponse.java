package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class FavoriteResponse {
    private Long favoriteId;
    private String itemId;        // fileId o shareId
    private String name;
    private String type;          // "PERSONAL" o "SHARED"
    private Boolean isFolder;
    private String folderColor;   // ← NUEVO: Color de la carpeta
    private String fileType;
    private Long fileSize;
    private LocalDateTime createdAt;
    private LocalDateTime favoritedAt;
    private String sharedBy;      // Si es compartido, quién lo envió
    private String securityLevel;
    private String accessLevel;
    private Boolean isUnlocked;   // Si requiere desbloqueo
    private Boolean isExpired;    // Si ya expiró (para compartidos)
    private String parentFolderId; // ← NUEVO: Para navegar a la carpeta padre
}