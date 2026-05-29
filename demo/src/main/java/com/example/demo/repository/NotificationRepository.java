package com.example.demo.repository;

import com.example.demo.model.FileShare;
import com.example.demo.model.Notification;
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
public interface NotificationRepository extends JpaRepository<Notification, String> {

    void deleteByFileShare_Id(String shareId);

    // HISTORIAL: Trae todas las notificaciones de un usuario, de la más nueva a la más vieja.
    Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // CAMPANITA: Trae solo las alertas que el usuario NO ha visto (puntito rojo).
    List<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user);

    // BADGE DE NÚMERO: Cuenta cuántas notificaciones sin leer tiene (ej. "Tienes 3 notificaciones nuevas").
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user = :user AND n.isRead = false")
    long countUnreadByUser(@Param("user") User user);

    // BOTÓN "MARCAR TODAS COMO LEÍDAS": Actualiza todas de golpe.
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :now WHERE n.user =:user AND n.isRead = false")
    int markAllAsRead(@Param("user") User user, @Param("now") LocalDateTime now);

    // MANTENIMIENTO (CRON JOB): Borra las notificaciones muy viejas (ej. más de 30 días) para que la BD no explote.
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :cutoffDate")
    int deleteOldNotifications(@Param("cutoffDate") LocalDateTime now);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.fileShare = :fileShare")
    void deleteByFileShare(@Param("fileShare") FileShare fileShare);
}
