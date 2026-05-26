package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Representa el archivo físico almacenado (ej. en Azure Blob Storage).
 * No guarda la lógica de a quién se le compartió, solo los datos crudos y su seguridad.
 */

@Entity
@Table(name = "file_metadata")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType; // extension/mime type (ej. application/pdf)

    @Column(nullable = false)
    private Long fileSize; // en bytes (para validar tus límites de 50MB)

    @Column(nullable = false, unique = true)
    private String blobUrl; // URL en la nube

    @Column(nullable = false)
    private String containerName;

    @Column(nullable = true)  // ← Temporal, permite null
    private String blobPath;

    // --- SEGURIDAD Y CIFRADO ---
    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedAesKey; // La llave que abre este archivo específico

    @Column(nullable = false)
    private String iv; // Vector de inicialización (requerido para descifrar)

    @Column(nullable = false)
    private String checksum; // Para verificar que el archivo no se corrompió al subirlo

    @Column(nullable = false)
    private LocalDateTime uploadedAt;

    // Quién es el dueño original del archivo
    @ManyToOne
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    // --- SOPORTE PARA CARPETAS ---
    @ManyToOne
    @JoinColumn(name = "parent_folder_id")
    private FileMetadata parentFolder;

    // --- CORRECCIÓN MySQL ---
    // Cambiamos "jsonb" por "json" para que sea compatible con tu BD MySQL.
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private Map<String, Object> customMetadata;

    @Column(nullable = false)
    private Boolean isFolder = false;

    // NUEVO: Color de la carpeta (para UI)
    // Valores posibles: "blue", "green", "red", "yellow", "purple", "orange", "gray"
    // Si es null, el frontend usará el color por defecto
    private String folderColor;

    // NUEVO: Para archivos personales (sin expiración)
    // Si es true, es un archivo "de respaldo" en la cuenta del usuario, no un enlace compartido
    // Los archivos personales NO tienen registros en FileShare (o tienen uno especial)
    @Column(nullable = false)
    private Boolean isPersonal = false;

    // NUEVO: Campo para saber si el archivo/carpeta está en "papelera"
    private Boolean isDeleted = false;

    private LocalDateTime deletedAt;
}

