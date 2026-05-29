package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class UserProfileResponse {
    private Long id;
    private String nombre;
    private String apellido;
    private String username;
    private String email;
    private String phone;
    private String profilePictureUrl;

    // Almacenamiento
    private Long storageUsed;      // bytes usados
    private Long storageLimit;     // bytes límite
    private Double storageUsedPercent;  // porcentaje usado
    private String storageUsedFormatted;  // ej: "245.3 MB"
    private String storageLimitFormatted; // ej: "1 GB"

    private LocalDateTime createdAt;
}