package com.example.demo.repository;

import com.example.demo.model.AccessAction;
import com.example.demo.model.AccessLog;
import com.example.demo.model.FileShare;
import com.example.demo.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    void deleteByFile_Id(String fileId);
    void deleteByFileShare_Id(String shareId);

    // HISTORIAL DEL USUARIO: Para mostrarle en su panel "Actividad reciente" (Paginado).
    Page<AccessLog> findByUserOrderByTimestampDesc(User user, Pageable pageable);

    // AUDITORÍA DE ARCHIVO: Muestra qué pasó con un archivo específico en un rango de fechas.
    // Para exportar reportes PDF de auditoría.
    List<AccessLog> findByFileIdAndTimestampBetween(String fileId, LocalDateTime start, LocalDateTime end);

    // ESTADÍSTICAS: ¿Cuántas veces VISTO?
    // Corrección: Usamos la ruta del Enum para evitar errores de cast de String a Enum en Hibernate.
    @Query("SELECT COUNT(al) FROM AccessLog al WHERE al.fileShare.id = :shareId AND al.action = com.example.demo.model.AccessAction.VIEW")
    long countViewsByShare(@Param("shareId") String shareId);

    // ESTADÍSTICAS: ¿Cuántas veces DESCARGADO?
    @Query("SELECT COUNT(al) FROM AccessLog al WHERE al.fileShare.id = :shareId AND al.action = :action")
    long countDownloadsByShare(@Param("shareId") String shareId, @Param("action") AccessAction   action);

    // SEGURIDAD ACTIVA: Monitorea si un usuario ha tenido actividad inusual recientemente
    // (ej. intentos fallidos de tokens en los últimos 5 minutos).
    @Query("SELECT al FROM AccessLog al WHERE al.user = :user AND al.timestamp >= :since")
    List<AccessLog> findRecentActivity(@Param("user") User user, @Param("since") LocalDateTime since);

    @Modifying
    @Query("DELETE FROM AccessLog al WHERE al.fileShare = :fileShare")
    void deleteByFileShare(@Param("fileShare") FileShare fileShare);
}
