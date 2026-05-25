package com.example.demo.scheduler;

import com.example.demo.model.FileMetadata;
import com.example.demo.repository.FileMetadataRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.service.AzureBlobService;
import com.example.demo.service.FileShareService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SCHEDULER (Cron Jobs)
 * El trabajador silencioso que corre en segundo plano para limpiar y asegurar el sistema.
 */
@Component
@EnableScheduling // Enciende el motor de tareas automáticas de Spring
@RequiredArgsConstructor
@Slf4j
public class FileCleanupScheduler {

    private final AzureBlobService azureBlobService;
    private final FileShareService fileShareService;
    private final FileMetadataRepository fileMetadataRepository;
    private final NotificationRepository notificationRepository; // Agregado para hacer la limpieza real

    /**
     * CANDADO DE 24 HORAS
     * Revisa cada minuto si a algún archivo ya se le acabó su tiempo de gracia de 24 horas
     * después de haber sido desbloqueado con SMS.
     * (60000 ms = 1 minuto). Ideal para pruebas. En producción podrías cambiarlo a cada hora.
     */
    @Scheduled(fixedDelay = 6000)
    public void lockExpiredFiles() {
        log.info("Iniciando re-bloqueo de archivo expirados...");
        fileShareService.lockExpiredFiles();
    }

    /**
     * AUTO-DESTRUCCIÓN
     * Se ejecuta exactamente al minuto 0 de cada hora (ej. 1:00, 2:00, 3:00).
     * Borra de Azure y de la Base de Datos los archivos que el usuario configuró para destruirse.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void destroyExpiredFiles() {
        log.info("Iniciando auto-destruccion de archivos caducados...");
        fileShareService.destroyExpiredFiles();
    }

    /**
     * MANTENIMIENTO DE BASE DE DATOS
     * Se ejecuta todos los días a las 3:00 AM de la madrugada.
     * Borra las notificaciones de la campanita que tengan más de 30 días para no saturar el servidor.
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional // Necesario porque estamos haciendo un DELETE en la base de datos
    public void cleanupOldLogs() {
        log.info("Limpiando notificaciones antiguas (mas de 30 dias)...");

        // Usamos el método que creaste en NotificationRepository
        LocalDateTime hace30Dias = LocalDateTime.now().minusDays(30);
        int eliminadas = notificationRepository.deleteOldNotifications(hace30Dias);

        log.info("Limpieza completa. Notificaciones eliminadas: {}", eliminadas);
    }

    // En FileCleanupScheduler.java, corrige el método:

    /**
     * LIMPIEZA DE PAPELERA
     * Se ejecuta todos los días a las 2:00 AM
     * Elimina permanentemente archivos que llevan más de 7 días en la papelera
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanOldTrash() {
        log.info("Iniciando limpieza de papelera (elementos con más de 7 días)...");

        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);

        // Usa el nuevo método que creamos en FileMetadataRepository
        List<FileMetadata> oldDeleted = fileMetadataRepository.findDeletedBefore(cutoff);

        int count = 0;
        for (FileMetadata item : oldDeleted) {
            try {
                // Eliminar físicamente de Azure
                if (!Boolean.TRUE.equals(item.getIsFolder()) && item.getBlobUrl() != null) {
                    azureBlobService.delateFile(item.getBlobUrl());
                }
                fileMetadataRepository.delete(item);
                count++;
            } catch (Exception e) {
                log.error("Error al limpiar elemento {}: {}", item.getId(), e.getMessage());
            }
        }

        log.info("Limpieza de papelera completada. {} elementos eliminados permanentemente", count);
    }
}
