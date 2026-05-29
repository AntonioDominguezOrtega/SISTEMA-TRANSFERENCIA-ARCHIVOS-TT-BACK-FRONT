package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Representa los PERMISOS. Es el "boleto" que se genera cuando compartes
 * un FileMetadata con alguien más.
 */

@Entity
@Table(name = "file_shares")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileShare {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "file_id", nullable = false)
    private FileMetadata file;

    @ManyToOne
    @JoinColumn(name = "shared_by", nullable = false)
    private User sharedBy;

    @ManyToOne
    @JoinColumn(name = "shared_with", nullable = false)
    private User sharedWith;

    @Column(length = 200)
    private String subject;  // Asunto del envío

    @Column(nullable = false)
    private LocalDateTime sharedAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt; // Cuándo muere el link (ej. 1 mes)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccessLevel accessLevel; // (Nuevo Enum) READ_ONLY o DOWNLOAD

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SecurityLevel securityLevel; // PUBLIC, PASSWORD, TOKEN_SMS

    private String passwordHash; // Si eligió modo "Contraseña"

    // --- LÓGICA DEL TOKEN SMS (5 Minutos) ---
    private String currentSmsToken;
    private LocalDateTime smsTokenExpiresAt;
    private Integer smsAttempts = 0; // Limite de 3 intentos
    private LocalDateTime smsLastAttemptAt;

    // --- LÓGICA DE DESBLOQUEO TEMPORAL (24 Horas) ---
    @Column(nullable = false)
    private Boolean isUnlocked = false;

    private LocalDateTime unlockedAt;
    private LocalDateTime unlockedUntil; // Aquí se guarda las 24 hrs que dura abierto

    // Si eligió mandar el SMS a un número diferente al del perfil
    private String customPhoneNumber;
    private Boolean useCustomPhone = false;

    // --- PREFERENCIAS DE NOTIFICACIÓN (Nuevos) ---
    @Column(nullable = false)
    private Boolean notifyOnview = false;

    @Column(nullable = false)
    private Boolean notifyOnDownload = false;

    // --- AUDITORÍA Y ESTADÍSTICAS ---
    private Integer viewCount = 0;
    private Integer downloadCount = 0;
    private LocalDateTime lastViewedAt;
    private LocalDateTime lastDownloadedAt;

    @Column(nullable = false)
    private Boolean isActive = true;

    // --- AUTO-DESTRUCCIÓN ---
    @Column(nullable = false)
    private Boolean selfDestruct = false; // ¿Desaparece tras la primera vista?

    private Boolean isDestroyed = false;
    private LocalDateTime destroyedAt;

    @Column(length = 500)
    private String message;  // ← Agregar este campo

}

