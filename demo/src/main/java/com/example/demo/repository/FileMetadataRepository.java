package com.example.demo.repository;

import com.example.demo.model.FileMetadata;
import com.example.demo.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, String> {

    // Obtiene TODOS los archivos que ha subido un usuario.
    List<FileMetadata> findByUploadedBy(User user);

    // Igual que el anterior, pero con Paginación (para mostrar de 10 en 10 en tu interfaz).
    Page<FileMetadata> findByUploadedBy(User user, Pageable pageable);

    // Busca un archivo por su URL única en la nube (ej. Azure Blob Storage).
    Optional<FileMetadata> findByBlobUrl(String blobUrl);

    // NAVEGACIÓN DE CARPETAS: Trae los archivos que están dentro de una carpeta específica.
    List<FileMetadata> findByParentFolder(FileMetadata parentFolder);

    // PANTALLA INICIO: Filtra si quieres ver solo "Mis Carpetas" (isFolder=true) o "Mis Archivos" (isFolder=false).
    @Query("SELECT f FROM FileMetadata f WHERE f.uploadedBy = :user AND f.isFolder = :isFolder")
    List<FileMetadata> findByUserAndIsFolder(@Param("user") User user, @Param("isFolder") Boolean isFolder);

    // Busca el contenido de una carpeta usando solo el ID de la carpeta (Más rápido).
    @Query("SELECT f FROM FileMetadata f WHERE f.parentFolder.id = :folderId")
    List<FileMetadata> findByParentFolderId(@Param("folderId") String folderId);

    // Verifica si un archivo ya existe en la nube para evitar duplicados.
    boolean existsByBlobUrl(String blobUrl);

    /**
     * Buscar archivos personales del usuario subidos después de una fecha
     */
    List<FileMetadata> findByUploadedByAndIsPersonalTrueAndUploadedAtAfter(User user, LocalDateTime date);

    /**
     * Buscar archivos eliminados de un usuario
     */
    List<FileMetadata> findByUploadedByAndIsDeletedTrue(User user);

    /**
     * Buscar archivos eliminados que llevan más de X días en la papelera
     */
    @Query("SELECT f FROM FileMetadata f WHERE f.isDeleted = true AND f.deletedAt < :cutoff")
    List<FileMetadata> findDeletedBefore(@Param("cutoff") LocalDateTime cutoff);
}
