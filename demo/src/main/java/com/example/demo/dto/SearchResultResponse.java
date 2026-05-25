package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SearchResultResponse {
    private String id;                    // fileId o shareId o packageId
    private String name;                  // Nombre del archivo
    private String type;                  // "PERSONAL", "SHARED", "FOLDER"
    private String location;              // Ruta de carpeta o "Recibido de: Nombre"
    private String subject;               // Asunto (solo para compartidos)
    private String sharedBy;              // Quién lo envió (solo para compartidos)
    private Long fileSize;
    private String fileType;
    private LocalDateTime date;           // Fecha de subida o recepción
    private Boolean isUnlocked;           // Si está desbloqueado (para protegidos)
    private Boolean isExpired;            // Si expiró (para compartidos)
    private String thumbnail;             // Preview opcional (Base64 o URL)
    private String folderId;              // ID de la carpeta padre (si aplica)
    private String securityLevel;         // PUBLIC, PASSWORD, TOKEN_SMS
    private Boolean isFolder;             // Si es carpeta
}