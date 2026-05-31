package com.example.demo.repository;

import com.example.demo.model.FileShare;
import com.example.demo.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FileShareRepository extends JpaRepository<FileShare, String> {

    // BANDEJA DE ENTRADA: Archivos que ME han compartido y aún no han caducado (isActive = true).
    @Query("SELECT fs FROM FileShare fs WHERE fs.sharedWith = :user AND fs.isActive = true AND fs.expiresAt > :now ORDER BY fs.sharedAt DESC")
    Page<FileShare> findReceivedShares(@Param("user") User user, @Param("now") LocalDateTime now, Pageable pageable);

    // BANDEJA DE SALIDA: Archivos que YO he enviado.
    @Query("SELECT fs FROM FileShare fs WHERE fs.sharedBy = :user AND fs.isActive = true")
    Page<FileShare> findSentShares(@Param("user") User user, Pageable pageable);

    // Valida si un usuario específico tiene acceso a un enlace compartido.
    Optional<FileShare> findByIdAndSharedWith(String id, User sharedWith);
    Optional<FileShare> findByIdAndSharedBy(String id, User sharedBy);

    // ESTADO DESBLOQUEADO: Trae los archivos que el usuario ya validó con SMS y aún están en su ventana de 24hrs.
    @Query("SELECT fs FROM FileShare fs WHERE fs.sharedWith = :user AND fs.isUnlocked = true AND fs.unlockedUntil > :now")
    List<FileShare> findCurrentlyUnlocked(@Param("user") User user, @Param("now")LocalDateTime now);

    // SISTEMA DE ALERTAS: Busca archivos que están a punto de morir para mandar una notificación.
    @Query("SELECT fs FROM FileShare fs WHERE fs.expiresAt BETWEEN :start AND :end")
    List<FileShare> findExpiringBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Archivos que necesitan re-bloqueo
    @Query("SELECT fs FROM FileShare fs WHERE fs.isUnlocked = true AND fs.unlockedUntil < :now")
    List<FileShare> findExpiredUnlocks(@Param("now") LocalDateTime now);

    // Evita que un usuario comparta el mismo archivo 2 veces a la misma persona por error.
    boolean existsByFile_IdAndSharedWithAndIsActiveTrue(String fileId, User sharedWith);

    // ==============================================================
    // CONSULTAS MASIVAS PARA TAREAS AUTOMÁTICAS (CRON JOBS)
    // ==============================================================

    // "Mata" (desactiva) de un solo golpe todos los enlaces que ya superaron su fecha de expiración final (ej. 1 mes).
    @Modifying
    @Query("UPDATE FileShare fs SET fs.isActive = false WHERE fs.expiresAt < :now")
    int deactivateExpiredShares(@Param("now") LocalDateTime now);

    // CANDADO DE 24 HRS: Vuelve a bloquear los archivos cuyo tiempo de gracia (unlockedUntil) ya pasó.
    @Modifying
    @Query("UPDATE FileShare fs SET fs.isUnlocked = false WHERE fs.unlockedUntil < :now")
    int lockExpiredUnlocks(@Param("now") LocalDateTime now);

    @Query("SELECT fs FROM FileShare fs WHERE fs.expiresAt < :now AND fs.isActive = true")
    List<FileShare> findExpiredShares(@Param("now") LocalDateTime now);



    // ==============================================================
    // NUEVOS MÉTODOS PARA FASE 3
    // ==============================================================

    /**
     * Buscar FileShare por fileId y usuario (para archivos personales)
     */
    Optional<FileShare> findByFile_IdAndSharedWith(String fileId, User sharedWith);

    /**
     * Buscar archivos compartidos CONMIGO después de una fecha (para RECIENTES)
     */
    List<FileShare> findBySharedWithAndSharedAtAfter(User sharedWith, LocalDateTime date);

    /**
     * Buscar archivos compartidos CONMIGO que expiraron antes de una fecha (para CADUCADOS)
     */
    List<FileShare> findBySharedWithAndExpiresAtBefore(User sharedWith, LocalDateTime date);

    /**
     * Buscar archivos compartidos POR MÍ después de una fecha
     */
    List<FileShare> findBySharedByAndSharedAtAfter(User sharedBy, LocalDateTime date);

    /**
     * Buscar archivos compartidos CONMIGO activos (no expirados)
     */
    @Query("SELECT fs FROM FileShare fs WHERE fs.sharedWith = :user AND fs.isActive = true AND (fs.expiresAt IS NULL OR fs.expiresAt > :now)")
    List<FileShare> findActiveSharesBySharedWith(@Param("user") User user, @Param("now") LocalDateTime now);

    // Buscar shares por file_id
    @Query("SELECT fs FROM FileShare fs WHERE fs.file.id = :fileId")
    List<FileShare> findByFile_Id(@Param("fileId") String fileId);

    // Eliminar shares por file_id (para limpieza masiva)
    @Modifying
    @Query("DELETE FROM FileShare fs WHERE fs.file.id = :fileId")
    void deleteByFile_Id(@Param("fileId") String fileId);

    /**
     * Buscar un FileShare activo por archivo y usuario destinatario
     */
    Optional<FileShare> findByFile_IdAndSharedWithAndIsActiveTrue(String fileId, User sharedWith);

    /**
     * Buscar TODOS los FileShares activos por archivo y usuario destinatario
     */
    List<FileShare> findAllByFile_IdAndSharedWithAndIsActiveTrue(String fileId, User sharedWith);

    /**
     * Desactivar TODOS los FileShares de un archivo con un usuario específico
     */
    @Modifying
    @Transactional
    @Query("UPDATE FileShare fs SET fs.isActive = false WHERE fs.file.id = :fileId AND fs.sharedWith = :sharedWith AND fs.isActive = true")
    int deactivateAllSharesForUser(@Param("fileId") String fileId, @Param("sharedWith") User sharedWith);
}

