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
    private String fileType;
    private Long fileSize;
    private LocalDateTime createdAt;
    private LocalDateTime favoritedAt;
    private String sharedBy;      // Si es compartido, quién lo envió
    private Boolean isUnlocked;   // Si requiere desbloqueo
    private Boolean isExpired;    // Si ya expiró (para compartidos)
}