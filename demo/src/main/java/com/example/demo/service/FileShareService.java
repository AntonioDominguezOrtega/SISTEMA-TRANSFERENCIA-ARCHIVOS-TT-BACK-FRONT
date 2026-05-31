package com.example.demo.service;

import com.example.demo.dto.FileShareResponse;
import com.example.demo.dto.FileUploadRequest;
import com.example.demo.dto.ShareExistingFileRequest;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;
import javax.crypto.SecretKey;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileShareService {
    // --- DEPENDENCIAS ---
    private final FileMetadataRepository fileMetadataRepository;
    private final FileShareRepository fileShareRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AccessLogRepository accessLogRepository;
    private final AzureBlobService azureBlobService;
    private final EncryptionService encryptionService;
    private final TwilioService twilioService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder; // Agregado para cifrar contraseñas de archivos
    private final NotificationWebSocketService webSocketService;

    // --- REGLAS DE NEGOCIO ---
    private static final int MAX_SMS_ATTEMPTS = 3;
    private static final int SMS_TOKEN_EXPIRATION_MINUTES = 5;
    private static final int UNLOCK_DURATION_HOURS = 24;

    // =========================================================================================
    // 1. FLUJO PRINCIPAL: SUBIR Y COMPARTIR ARCHIVOS (Pasos 1 al 6 de UI)
    // =========================================================================================

    @Transactional
    public List<FileShareResponse> uploadAndShareFiles(FileUploadRequest request) {
        // 1. Obtener usuario actual
        User currentUser = getCurrentUser();

        // 2. Validar que los campos de seguridad (contraseñas o teléfonos) vengan correctos
        validateSecurityLevel(request);

        List<FileShareResponse> responses = new ArrayList<>();

        // 3. Procesar CADA archivo que el usuario arrastró a la pantalla
        for (MultipartFile file : request.getFiles()) {
            try {
                // ==========================================================
                // 3.1 LEER el archivo en bytes
                // ==========================================================
                byte[] fileBytes = file.getBytes();

                // ==========================================================
                // 3.2 Generar clave AES única para este archivo
                // ==========================================================
                SecretKey aesKey = encryptionService.generateAesKey();
                byte[] iv = encryptionService.generateIv();

                // ==========================================================
                // 3.3 CIFRAR el contenido del archivo (¡EL PASO IMPORTANTE!)
                // ==========================================================
                String encryptedBase64 = encryptionService.encrypt(fileBytes, aesKey, iv);
                byte[] encryptedBytes = Base64.getDecoder().decode(encryptedBase64);

                // ==========================================================
                // 3.4 Generar nombre único para el blob (con extensión)
                // ==========================================================
                String originalFilename = file.getOriginalFilename();
                String extension = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    extension = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String blobName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;

                // ==========================================================
                // 3.5 SUBIR los datos CIFRADOS a Azure
                // ==========================================================
                String blobUrl = azureBlobService.uploadEncryptedData(encryptedBytes, blobName);

                // ==========================================================
                // 3.6 Envelope Encryption: Cifrar la clave AES con la clave maestra
                // ==========================================================
                String encryptedAesKey = encryptionService.encryptAesKey(aesKey);

                // ==========================================================
                // 3.7 Guardar los metadatos físicos del archivo en BD
                // ==========================================================
                FileMetadata metadata = new FileMetadata();
                metadata.setFileName(file.getOriginalFilename());
                metadata.setFileType(file.getContentType());
                metadata.setFileSize(file.getSize());
                metadata.setBlobUrl(blobUrl);
                metadata.setContainerName("archivos-seguros");
                metadata.setBlobPath(blobName);  // Guardamos el blobName
                metadata.setEncryptedAesKey(encryptedAesKey);
                metadata.setIv(Base64.getEncoder().encodeToString(iv));
                metadata.setChecksum(generateChecksum(file));
                metadata.setUploadedBy(currentUser);
                metadata.setUploadedAt(LocalDateTime.now());
                metadata.setIsFolder(false);
                metadata.setIsPersonal(false);  // Este archivo es para compartir

                FileMetadata saveMetadata = fileMetadataRepository.save(metadata);

                // 3.8 Crear los permisos (FileShare) para CADA destinatario
                for (FileUploadRequest.RecipientInfo recipient : request.getRecipients()) {
                    User targetUser = findUserByIdentifier(recipient);

                    if (fileShareRepository.existsByFile_IdAndSharedWithAndIsActiveTrue(saveMetadata.getId(), targetUser)) {
                        continue;
                    }

                    FileShare share = createFileShare(saveMetadata, currentUser, targetUser, request);
                    FileShare savedShare = fileShareRepository.save(share);

                    sendSharingNotifications(savedShare, request);
                    logAccess(currentUser, saveMetadata, savedShare, AccessAction.SHARE, true, null);

                    responses.add(mapToResponse(savedShare));
                }

                // 3.9 Copia para mí mismo
                if (Boolean.TRUE.equals(request.getSendCopyToMyself())) {
                    FileShare selfShare = createFileShare(saveMetadata, currentUser, currentUser, request);
                    fileShareRepository.save(selfShare);
                }

            } catch (Exception e) {
                log.error("Error al procesar archivo {}: {}", file.getOriginalFilename(), e.getMessage());
                throw new RuntimeException("Error al procesar archivo: " + file.getOriginalFilename(), e);
            }
        }
        return responses;
    }

    @Transactional
    public List<FileShareResponse> shareExistingFiles(ShareExistingFileRequest request) {
        User currentUser = getCurrentUser();
        FileMetadata file = fileMetadataRepository.findById(request.getFileId())
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        validateSecurityLevel(request);

        List<FileShareResponse> responses = new ArrayList<>();

        for (ShareExistingFileRequest.RecipientInfo recipient : request.getRecipients()) {
            User targetUser = findUserByIdentifier(recipient);

            // DESACTIVAR shares anteriores
            log.info("🔄 Desactivando share anterior para {} con archivo {}",
                    targetUser.getUsername(), file.getFileName());

            fileShareRepository.deactivateAllSharesForUser(file.getId(), targetUser);

            // Crear nuevo FileShare
            FileShare share = createShareFromExistingFile(file, currentUser, targetUser, request);
            FileShare savedShare = fileShareRepository.save(share);
            sendSharingNotifications(savedShare, request);
            logAccess(currentUser, file, savedShare, AccessAction.SHARE, true, null);
            responses.add(mapToResponse(savedShare));
        }

        return responses;
    }

    // =========================================================================================
    // 2. BANDEJAS DE ENTRADA Y SALIDA
    // =========================================================================================

    @Transactional(readOnly = true)
    public List<FileShareResponse> getReceivedFiles(int page, int size) {
        User currentUser = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        return fileShareRepository.findReceivedShares(currentUser, now, PageRequest.of(page, size))
                .stream()
                .filter(share -> !share.getSharedBy().getId().equals(currentUser.getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FileShareResponse> getSentFiles(int page, int size) {
        User currentUser = getCurrentUser();
        return fileShareRepository.findSentShares(currentUser, PageRequest.of(page, size))
                .stream()
                // ✅ FILTRAR: No mostrar archivos donde el destinatario soy YO mismo
                .filter(share -> !share.getSharedWith().getId().equals(currentUser.getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    // =========================================================================================
    // 3. FLUJO DE DESBLOQUEO SMS (Pasos 1 al 8 del Flujo de Desbloqueo)
    // =========================================================================================

    /**
     * PASO 3: El usuario hace clic en "Enviar Token"
     */
    @Transactional
    public String requestSmsToken(String shareId) {
        User currentUser = getCurrentUser();

        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        // ✅ Permitir acceso tanto al receptor (sharedWith) como al emisor (sharedBy)
        if (!share.getSharedWith().getId().equals(currentUser.getId()) &&
                !share.getSharedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        // Si es el emisor, no necesita desbloquear su propio archivo
        boolean isOwner = share.getSharedBy().getId().equals(currentUser.getId());
        if (isOwner) {
            throw new RuntimeException("Eres el propietario del archivo, no necesitas desbloquearlo");
        }

        if (!share.getIsActive() || share.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El archivo ha expirado");
        }

        if (share.getIsUnlocked() && share.getUnlockedUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("El archivo ya está desbloqueado hasta: " + share.getUnlockedUntil());
        }

        // Generar token de 6 dígitos
        String token = encryptionService.generateSmsToken();
        share.setCurrentSmsToken(token);
        share.setSmsTokenExpiresAt(LocalDateTime.now().plusMinutes(SMS_TOKEN_EXPIRATION_MINUTES));
        share.setSmsAttempts(0);
        share.setSmsLastAttemptAt(null);
        fileShareRepository.save(share);

        // Decidir a qué número enviarlo
        String phoneNumber = Boolean.TRUE.equals(share.getUseCustomPhone()) ? share.getCustomPhoneNumber() : currentUser.getPhone();

        // Enviar por SMS (Variable eliminada para evitar error de variable no usada)
        twilioService.sendVerificationCode(phoneNumber, token);

        // Enviar por Email (Backup)
        emailService.sendFileUnlockTokenEmail(currentUser.getEmail(), token, currentUser.getNombre(), share.getFile().getFileName());

        logAccess(currentUser, share.getFile(), share, AccessAction.TOKEN_REQUEST, true,
                "Token enviado a " + maskPhoneNumber(phoneNumber));

        return "Token enviado exitosamente";
    }

    /**
     * VERIFICAR CONTRASEÑA PARA DESBLOQUEAR ARCHIVO (24 horas)
     * Similar al flujo de SMS, pero con contraseña.
     */
    @Transactional
    public FileShareResponse verifyPassword(String shareId, String password) {
        User currentUser = getCurrentUser();

        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        // ✅ Permitir acceso tanto al receptor como al emisor
        if (!share.getSharedWith().getId().equals(currentUser.getId()) &&
                !share.getSharedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        // Si es el emisor, no necesita desbloquear su propio archivo
        boolean isOwner = share.getSharedBy().getId().equals(currentUser.getId());
        if (isOwner) {
            throw new RuntimeException("Eres el propietario del archivo, no necesitas desbloquearlo");
        }

        // Validar que el archivo tenga seguridad por contraseña
        if (share.getSecurityLevel() != SecurityLevel.PASSWORD) {
            throw new RuntimeException("Este archivo no está protegido por contraseña");
        }

        // Validar que el archivo siga activo
        if (!share.getIsActive() || share.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El archivo ha expirado");
        }

        // Validar intentos fallidos (máximo 5 intentos)
        Integer attempts = share.getSmsAttempts() != null ? share.getSmsAttempts() : 0;
        if (attempts >= 5) {
            throw new RuntimeException("Demasiados intentos fallidos. Solicita un nuevo acceso al propietario");
        }

        // Verificar contraseña
        if (share.getPasswordHash() == null || !passwordEncoder.matches(password, share.getPasswordHash())) {
            // Incrementar intentos fallidos
            share.setSmsAttempts(attempts + 1);
            share.setSmsLastAttemptAt(LocalDateTime.now());
            fileShareRepository.save(share);

            int attemptsLeft = 5 - (attempts + 1);
            throw new RuntimeException("Contraseña incorrecta. Intentos restantes: " + attemptsLeft);
        }

        // ¡CONTRASEÑA CORRECTA! -> Desbloquear por 24 horas
        share.setIsUnlocked(true);
        share.setUnlockedAt(LocalDateTime.now());
        share.setUnlockedUntil(LocalDateTime.now().plusHours(UNLOCK_DURATION_HOURS));
        share.setSmsAttempts(0);
        share.setSmsLastAttemptAt(null);

        FileShare updatedShare = fileShareRepository.save(share);

        // Registrar en auditoría
        logAccess(currentUser, share.getFile(), share, AccessAction.UNLOCK, true,
                "Archivo desbloqueado con contraseña por 24 horas");

        return mapToResponse(updatedShare);
    }

    /**
     * PASO 5: El usuario ingresa los 6 dígitos y da clic en "Verificar"
     */
    @Transactional
    public FileShareResponse verifySmsToken(String shareId, String token) {
        User currentUser = getCurrentUser();

        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        // ✅ Permitir acceso tanto al receptor como al emisor
        if (!share.getSharedWith().getId().equals(currentUser.getId()) &&
                !share.getSharedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        // Si es el emisor, no necesita desbloquear su propio archivo
        boolean isOwner = share.getSharedBy().getId().equals(currentUser.getId());
        if (isOwner) {
            throw new RuntimeException("Eres el propietario del archivo, no necesitas desbloquearlo");
        }

        if (share.getSmsAttempts() >= MAX_SMS_ATTEMPTS) {
            throw new RuntimeException("Demasiados intentos fallidos. Solicite un nuevo token");
        }

        if (share.getSmsTokenExpiresAt() == null || share.getSmsTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El token ha expirado. Solicite uno nuevo");
        }

        // ¿El código es incorrecto?
        if (!token.equals(share.getCurrentSmsToken())) {
            share.setSmsAttempts(share.getSmsAttempts() + 1);
            share.setSmsLastAttemptAt(LocalDateTime.now());
            fileShareRepository.save(share);

            logAccess(currentUser, share.getFile(), share, AccessAction.TOKEN_FAIL, false,
                    "Token incorrecto. Intento " + share.getSmsAttempts());

            int attemptsLeft = MAX_SMS_ATTEMPTS - share.getSmsAttempts();
            throw new RuntimeException("Token incorrecto. Intentos restantes: " + attemptsLeft);
        }

        // ¡CÓDIGO CORRECTO! -> Desbloquear por 24 horas
        share.setIsUnlocked(true);
        share.setUnlockedAt(LocalDateTime.now());
        share.setUnlockedUntil(LocalDateTime.now().plusHours(UNLOCK_DURATION_HOURS));
        share.setCurrentSmsToken(null);
        share.setSmsTokenExpiresAt(null);
        share.setSmsAttempts(0);

        FileShare updateShare = fileShareRepository.save(share);

        logAccess(currentUser, share.getFile(), share, AccessAction.UNLOCK, true, "Archivo desbloqueado por 24 horas");
        return mapToResponse(updateShare);
    }

    // =========================================================================================
    // 4. ACCESO AL ARCHIVO Y DESCARGA
    // =========================================================================================
    @Transactional
    public FileShareResponse viewFile(String shareId) {
        User currentUser = getCurrentUser();

        //  Permitir acceso tanto si eres el receptor como si eres el emisor
        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!share.getSharedWith().getId().equals(currentUser.getId()) &&
                !share.getSharedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        validateFileAccess(share, currentUser);

        // Incrementar estadísticas solo si es el receptor (sharedWith)
        if (share.getSharedWith().getId().equals(currentUser.getId())) {
            share.setViewCount(share.getViewCount() + 1);
            share.setLastViewedAt(LocalDateTime.now());
            fileShareRepository.save(share);

            logAccess(currentUser, share.getFile(), share, AccessAction.VIEW, true, null);

            if (Boolean.TRUE.equals(share.getNotifyOnview())) {
                sendViewNotification(share);
            }
        }

        return mapToResponse(share);
    }

    @Transactional
    public byte[] downloadFile(String shareId) {
        User currentUser = getCurrentUser();

        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!share.getSharedWith().getId().equals(currentUser.getId()) &&
                !share.getSharedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        validateFileAccess(share, currentUser);

        // Regla de Negocio: Validar que el remitente le dio permiso de descarga
        if (share.getAccessLevel() != AccessLevel.DOWNLOAD) {
            throw new RuntimeException("No tienes permiso para descargar este archivo");
        }

        // Incrementar estadísticas
        if (share.getSharedWith().getId().equals(currentUser.getId())) {
            share.setDownloadCount(share.getDownloadCount() + 1);
            share.setLastDownloadedAt(LocalDateTime.now());
            fileShareRepository.save(share);

            logAccess(currentUser, share.getFile(), share, AccessAction.DOWNLOAD, true, null);

            if (Boolean.TRUE.equals(share.getNotifyOnDownload())) {
                sendDonwloadNotification(share);
            }
        }

        try {
            // ==========================================================
            // 1. Descargar los bytes CIFRADOS desde Azure
            // ==========================================================
            byte[] encryptedBytes = azureBlobService.downloadEncryptedBytes(share.getFile().getBlobUrl());

            // ==========================================================
            // 2. Recuperar la llave AES (que está cifrada con la llave maestra)
            // ==========================================================
            SecretKey aesKey = encryptionService.decryptAesKey(share.getFile().getEncryptedAesKey());

            // ==========================================================
            // 3. Obtener el IV
            // ==========================================================
            byte[] iv = Base64.getDecoder().decode(share.getFile().getIv());

            // ==========================================================
            // 4. Convertir los bytes cifrados a Base64 (porque tu método decrypt lo espera así)
            // ==========================================================
            String encryptedBase64 = Base64.getEncoder().encodeToString(encryptedBytes);

            // ==========================================================
            // 5. DESCIFRAR el archivo
            // ==========================================================
            byte[] decryptedBytes = encryptionService.decrypt(encryptedBase64, aesKey, iv);

            log.info("Archivo descifrado exitosamente: {}", share.getFile().getFileName());

            return decryptedBytes;  // ← Devolvemos el archivo YA descifrado

        } catch (Exception e) {
            log.error("Error al descifrar archivo: {}", e.getMessage());
            throw new RuntimeException("Error al descargar el archivo: " + e.getMessage());
        }
    }
    // =========================================================================================
    // 5. TAREAS AUTOMÁTICAS (Cron Jobs)
    // =========================================================================================

    @Transactional
    public void lockExpiredFiles() {
        LocalDateTime now = LocalDateTime.now();
        // Esto encuentra TODOS los archivos desbloqueados (tanto SMS como PASSWORD)
        // cuyo tiempo de gracia ya expiró
        List<FileShare> expiredUnlocks = fileShareRepository.findExpiredUnlocks(now);

        for (FileShare share : expiredUnlocks) {
            share.setIsUnlocked(false);
            share.setUnlockedAt(null);
            share.setUnlockedUntil(null);
            // No borramos passwordHash ni currentSmsToken, solo el estado de desbloqueo
            fileShareRepository.save(share);
            log.info("Archivo re-bloqueado automáticamente: {} (security: {})",
                    share.getId(), share.getSecurityLevel());
        }
    }

    @Transactional
    public void destroyExpiredFiles() {
        LocalDateTime now = LocalDateTime.now();
        List<FileShare> expiredShare = fileShareRepository.findExpiredShares(now);

        for (FileShare share : expiredShare) {
            if (Boolean.TRUE.equals(share.getSelfDestruct())) {
                azureBlobService.delateFile(share.getFile().getBlobUrl());
                share.setIsActive(false);
                share.setIsDestroyed(true);
                share.setDestroyedAt(now);
                fileShareRepository.save(share);
                sendDestructionNotification(share);
                log.info("Archivo auto-destruido por expiracion: {}", share.getId());
            } else {
                share.setIsActive(false);
                fileShareRepository.save(share);
            }
        }
    }

    // =========================================================================================
    // 6. MÉTODOS PRIVADOS DE APOYO
    // =========================================================================================

    // Optenemos al actual usuario
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }

    // Reglas de de negocio para la buqueda del destinatario
    private User findUserByIdentifier(FileUploadRequest.RecipientInfo recipient) {
        return switch (recipient.getType()) {
            case EMAIL -> userRepository.findByEmail(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email " + recipient.getIdentifier()));
            case USERNAME -> userRepository.findByUsername(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con username " + recipient.getIdentifier()));
            case PHONE -> userRepository.findByPhone(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con telefono " + recipient.getIdentifier()));
            default -> throw new IllegalArgumentException("Tipo de destinatario no soportado: " + recipient.getType());
        };
    }

    private User findUserByIdentifier(ShareExistingFileRequest.RecipientInfo recipient) {
        return switch (recipient.getType()) {
            case EMAIL -> userRepository.findByEmail(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email " + recipient.getIdentifier()));
            case USERNAME -> userRepository.findByUsername(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con username " + recipient.getIdentifier()));
            case PHONE -> userRepository.findByPhone(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con telefono " + recipient.getIdentifier()));
            default -> throw new IllegalArgumentException("Tipo de destinatario no soportado: " + recipient.getType());
        };
    }

    // Reglas de negocio de la seguridad de los archivos
    private void validateSecurityLevel(FileUploadRequest request) {

        // Reglas de negocio para la seguridad con contraseña del archivo
        if (request.getSecurityLevel() == SecurityLevel.PASSWORD) {
            if (request.getPassword() == null || request.getConfirmPassword() == null) {
                throw new RuntimeException("Debe especificar una contraseña");
            }
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new RuntimeException("La contraseña no coinciden");
            }
            if (request.getPassword().length() < 8) {
                throw new RuntimeException("La contraseña debe de tener al menos 8 caracteres");
            }
        }

        // Reglas de negocio para seguridad con SMS del archivo
        if (request.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            if (!Boolean.TRUE.equals(request.getUseAccountPhone()) && request.getCustomPhoneNumber() == null) {
                throw new RuntimeException("Debe especificar un numero de telefono allternativo");
            }
        }
    }

    private void validateSecurityLevel(ShareExistingFileRequest request) {
        if (request.getSecurityLevel() == SecurityLevel.PASSWORD) {
            if (request.getPassword() == null || request.getConfirmPassword() == null) {
                throw new RuntimeException("Debe especificar una contraseña");
            }
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new RuntimeException("La contraseña no coinciden");
            }
            if (request.getPassword().length() < 8) {
                throw new RuntimeException("La contraseña debe de tener al menos 8 caracteres");
            }
        }

        if (request.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            if (!Boolean.TRUE.equals(request.getUseAccountPhone()) && request.getCustomPhoneNumber() == null) {
                throw new RuntimeException("Debe especificar un numero de telefono allternativo");
            }
        }
    }

    // -----------------------------------------------------------------------------------------
    // MÉTODOS DE CREACIÓN DE FILESHARE RENOMBRADOS PARA EVITAR AMBIGÜEDAD
    // -----------------------------------------------------------------------------------------

    // Método 1: Para cuando se sube un nuevo archivo
    private FileShare createFileShare(FileMetadata file, User sharedBy, User sharedWith, FileUploadRequest request) {
        log.info("📝 Creando FileShare - Asunto: '{}', Mensaje: '{}'", request.getSubject(), request.getMessage());

        FileShare share = new FileShare();
        share.setFile(file);
        share.setSharedBy(sharedBy);
        share.setSharedWith(sharedWith);
        share.setSubject(request.getSubject());
        share.setMessage(request.getMessage());
        share.setSharedAt(LocalDateTime.now());
        share.setExpiresAt(calculateExpiration(request.getExpirationTime()));
        share.setAccessLevel(request.getAccessLevel());
        share.setSecurityLevel(request.getSecurityLevel());
        
        share.setNotifyOnview(request.getNotifyOnview() != null ? request.getNotifyOnview() : false);
        share.setNotifyOnDownload(request.getNotifyOnDownload() != null ? request.getNotifyOnDownload() : false);
        share.setSelfDestruct(request.getSelfDestruct() != null ? request.getSelfDestruct() : false);
        
        share.setIsActive(true);
        share.setIsUnlocked(false);

        if (request.getSecurityLevel() == SecurityLevel.PASSWORD) {
            share.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            boolean useAccountPhone = request.getUseAccountPhone() != null ? request.getUseAccountPhone() : true;
            share.setUseCustomPhone(!useAccountPhone); // Usamos custom si no usa el de la cuenta
            share.setCustomPhoneNumber(request.getCustomPhoneNumber());
        }

        return share;
    }

    // Método 2: Para cuando se comparte un archivo que ya estaba en la nube (RENOMBRADO)
    private FileShare createShareFromExistingFile(FileMetadata file, User sharedBy, User sharedWith, ShareExistingFileRequest request) {
        log.info("📝 Creando FileShare (Existente) - Asunto: '{}'", request.getSubject());

        FileShare share = new FileShare();
        share.setFile(file);
        share.setSharedBy(sharedBy);
        share.setSharedWith(sharedWith);
        share.setSubject(request.getSubject());
        share.setMessage(request.getMessage());
        share.setSharedAt(LocalDateTime.now());
        share.setExpiresAt(calculateExistingExpiration(request.getExpirationTime()));
        share.setAccessLevel(request.getAccessLevel());
        share.setSecurityLevel(request.getSecurityLevel());
        
        share.setNotifyOnview(request.getNotifyOnView() != null ? request.getNotifyOnView() : false);
        share.setNotifyOnDownload(request.getNotifyOnDownload() != null ? request.getNotifyOnDownload() : false);
        share.setSelfDestruct(request.getSelfDestruct() != null ? request.getSelfDestruct() : false);
        
        share.setIsActive(true);
        share.setIsUnlocked(false);

        if (request.getSecurityLevel() == SecurityLevel.PASSWORD) {
            share.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        if (request.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            boolean useAccountPhone = request.getUseAccountPhone() != null ? request.getUseAccountPhone() : true;
            share.setUseCustomPhone(!useAccountPhone);
            share.setCustomPhoneNumber(request.getCustomPhoneNumber());
        }

        return share;
    }

    // -----------------------------------------------------------------------------------------
    // CALCULADORES DE EXPIRACIÓN
    // -----------------------------------------------------------------------------------------

    private LocalDateTime calculateExpiration(FileUploadRequest.ExpirationTime expirationTime) {
        if (expirationTime == null) return LocalDateTime.now().plusDays(30);
        return switch (expirationTime) {
            case HOURS_24 -> LocalDateTime.now().plusHours(24);
            case DAYS_3 -> LocalDateTime.now().plusDays(3);
            case DAYS_7 -> LocalDateTime.now().plusDays(7);
            case MONTH_1 -> LocalDateTime.now().plusMonths(1);
            case CUSTOM -> LocalDateTime.now().plusDays(30);
            default -> LocalDateTime.now().plusDays(30);
        };
    }

    private LocalDateTime calculateExistingExpiration(ShareExistingFileRequest.ExpirationTime expirationTime) {
        if (expirationTime == null) return LocalDateTime.now().plusDays(30);
        return switch (expirationTime) {
            case HOURS_24 -> LocalDateTime.now().plusHours(24);
            case DAYS_3 -> LocalDateTime.now().plusDays(3);
            case DAYS_7 -> LocalDateTime.now().plusDays(7);
            case MONTH_1 -> LocalDateTime.now().plusMonths(1);
            case CUSTOM -> LocalDateTime.now().plusDays(30);
            default -> LocalDateTime.now().plusDays(30);
        };
    }

    // --- LÓGICA DE AUDITORÍA (EXTRACCIÓN DE IP Y NAVEGADOR) ---
    private String getClientIp() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(request.getRemoteAddr())) {
                return request.getRemoteAddr();
            }
            return xfHeader.split(".")[0]; // Toma la IP original si hay proxies
        } catch (Exception e) {
            return "IP-Desconocida";
        }
    }

    private String getUserAgent() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
            return request.getHeader("User-Agent");
        } catch (Exception e) {
            return "Agente-Desconocido";
        }
    }

    private void logAccess(User user, FileMetadata file, FileShare share, AccessAction action, boolean success, String details) {
        AccessLog logItem = new AccessLog();
        logItem.setUser(user);
        logItem.setFile(file);
        logItem.setFileShare(share);
        logItem.setAction(action);
        logItem.setIpAddress(getClientIp());
        logItem.setUserAgent(getUserAgent());
        logItem.setSuccess(success);
        logItem.setDetails(details);
        accessLogRepository.save(logItem);
    }

    // --- LÓGICA DE NOTIFICACIONES ---

    private void sendSharingNotifications(FileShare share, FileUploadRequest request) {
        String content = String.format("%s %s te ha compartido el archivo: %s\nNivel de seguridad: %s\nExpira: %s\n\nInicia sesión en la plataforma para verlo.",
                share.getSharedBy().getNombre(), share.getSharedBy().getApellido(), share.getFile().getFileName(), share.getSecurityLevel(), share.getExpiresAt());

        if (request.getMessage() != null && !request.getMessage().isEmpty()) {
            content += "\n\nMensaje: " + request.getMessage();
        }

        emailService.sendSimpleMessage(share.getSharedWith().getEmail(), "Te compartio un archivo", content);

        Notification notification = new Notification();
        notification.setUser(share.getSharedWith());
        notification.setFileShare(share);
        notification.setType(NotificationType.NEW_FILE_SHARED);
        notification.setMessage("Te compartieron: " + share.getFile().getFileName());

        // 1. Guardamos y capturamos la entidad (porque necesitamos el ID que le asigna la BD)
        Notification savedNotification = notificationRepository.save(notification);

        // 2. Disparamos la alerta en tiempo real a la campanita de React
        webSocketService.sendToUser(share.getSharedWith(), savedNotification);
    }

    private void sendSharingNotifications(FileShare share, ShareExistingFileRequest request) {
        String content = String.format("%s %s te ha compartido el archivo: %s\nNivel de seguridad: %s\nExpira: %s\n\nInicia sesión en la plataforma para verlo.",
                share.getSharedBy().getNombre(), share.getSharedBy().getApellido(), share.getFile().getFileName(), share.getSecurityLevel(), share.getExpiresAt());

        if (request.getMessage() != null && !request.getMessage().isEmpty()) {
            content += "\n\nMensaje: " + request.getMessage();
        }

        emailService.sendSimpleMessage(share.getSharedWith().getEmail(), "Te compartio un archivo", content);

        Notification notification = new Notification();
        notification.setUser(share.getSharedWith());
        notification.setFileShare(share);
        notification.setType(NotificationType.NEW_FILE_SHARED);
        notification.setMessage("Te compartieron: " + share.getFile().getFileName());

        Notification savedNotification = notificationRepository.save(notification);

        webSocketService.sendToUser(share.getSharedWith(), savedNotification);
    }

    private void sendViewNotification(FileShare share) {
        String content = String.format("%s %s ha visto tu archivo: %s",
                share.getSharedWith().getNombre(), share.getSharedWith().getApellido(), share.getFile().getFileName());
        emailService.sendSimpleMessage(share.getSharedBy().getEmail(), "Tu archivo fue visto", content);

        Notification notification = new Notification();
        notification.setUser(share.getSharedBy()); // La alerta es para el DUEÑO del archivo
        notification.setFileShare(share);
        notification.setType(NotificationType.FILE_VIEWED);
        notification.setMessage(content);

        // 1. Guardamos y capturamos la entidad con su ID
        Notification savedNotification = notificationRepository.save(notification);

        // 2. Disparamos la alerta en tiempo real al dueño
        webSocketService.sendToUser(share.getSharedBy(), savedNotification);
    }

    private void sendDonwloadNotification(FileShare share) {
        String content = String.format("%s %s ha descargado tu archivo: %s",
                share.getSharedWith().getNombre(), share.getSharedWith().getApellido(), share.getFile().getFileName());

        // Te agregué el email que faltaba en este método para que quede igual al de vistas
        emailService.sendSimpleMessage(share.getSharedBy().getEmail(), "Tu archivo fue descargado", content);

        Notification notification = new Notification();
        notification.setUser(share.getSharedBy());
        notification.setFileShare(share);
        notification.setType(NotificationType.FILE_DOWNLOADED);
        notification.setMessage(content);

        // 1. Guardamos y capturamos la entidad con su ID
        Notification savedNotification = notificationRepository.save(notification);

        // 2. Disparamos la alerta en tiempo real al dueño
        webSocketService.sendToUser(share.getSharedBy(), savedNotification);
    }

    private void sendDestructionNotification(FileShare share) {
        emailService.sendSimpleMessage(share.getSharedBy().getEmail(), "Archivo auto-destruido",
                "Tu archivo '" + share.getFile().getFileName() + "' ha sido auto-destruido por expiracion");
        emailService.sendSimpleMessage(share.getSharedWith().getEmail(), "Archivo expirado",
                "El archivo '" + share.getFile().getFileName() + "' ha expirado y ya no está disponible");
    }

    private FileShareResponse mapToResponse(FileShare share) {
        boolean unlockedStatus;

        switch (share.getSecurityLevel()) {
            case PUBLIC:
                unlockedStatus = true;
                break;
            case PASSWORD:
            case TOKEN_SMS:
                unlockedStatus = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                        share.getUnlockedUntil() != null &&
                        share.getUnlockedUntil().isAfter(LocalDateTime.now());
                break;
            default:
                unlockedStatus = false;
                break;
        }

        return FileShareResponse.builder()
                .shareId(share.getId())
                .fileName(share.getFile().getFileName())
                .fileSize(share.getFile().getFileSize())
                .fileType(share.getFile().getFileType())
                .sharedAt(share.getSharedAt())
                .expiresAt(share.getExpiresAt())
                .sharedBy(share.getSharedBy().getNombre() + " " + share.getSharedBy().getApellido())
                .sharedWith(share.getSharedWith().getNombre() + " " + share.getSharedWith().getApellido())
                .accessLevel(share.getAccessLevel())
                .securityLevel(share.getSecurityLevel())
                .inUnlocked(unlockedStatus)
                .unlockedUntil(share.getUnlockedUntil())
                .viewCount(share.getViewCount())
                .donwloadCount(share.getDownloadCount())
                .hasPassword(share.getPasswordHash() != null && !share.getPasswordHash().isEmpty())
                .subject(share.getSubject())
                .message(share.getMessage())  
                .build();
    }

    private String extractBlobPath(String blobUrl) {
        return blobUrl.substring(blobUrl.lastIndexOf("/") + 1);
    }

    private String generateChecksum(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("No se pudo generar el checksum: ", e);
            return "N/A";
        }
    }

    private String maskPhoneNumber(String phone) {
        if (phone == null || phone.length() < 8) return "****";
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }

    // En FileShareService.java, agrega este método:

    /**
     * Genera URL para vista previa de archivo compartido (solo lectura)
     */
    @Transactional(readOnly = true)
    public String getPreviewUrl(String shareId) {
        User currentUser = getCurrentUser();

        // Permitir acceso tanto si eres el receptor (sharedWith) como si eres el emisor (sharedBy)
        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        // Validar que el usuario actual sea el receptor O el emisor
        if (!share.getSharedWith().getId().equals(currentUser.getId()) &&
                !share.getSharedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        // Validar que el archivo esté activo y no haya expirado
        if (!share.getIsActive() || share.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El archivo ha expirado");
        }

        // Si el archivo requiere desbloqueo, verificar que esté desbloqueado
        // NOTA: Para el emisor (sharedBy), el archivo siempre está desbloqueado (es su archivo)
        boolean isOwner = share.getSharedBy().getId().equals(currentUser.getId());

        if (!isOwner && share.getSecurityLevel() != SecurityLevel.PUBLIC) {
            boolean isUnlocked = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                    share.getUnlockedUntil() != null && share.getUnlockedUntil().isAfter(LocalDateTime.now());

            if (!isUnlocked) {
                throw new RuntimeException("El archivo está bloqueado. Solicita un token SMS o ingresa la contraseña.");
            }
        }

        String fileType = share.getFile().getFileType();
        log.info("📄 FileType desde BD (compartido): {}", fileType);

        return azureBlobService.generatePreviewUrl(share.getFile().getBlobUrl(), 30, fileType);
    }

    private void validateFileAccess(FileShare share, User currentUser) {
        if (!Boolean.TRUE.equals(share.getIsActive())) {
            throw new RuntimeException("Este archivo ya no está disponible");
        }
        if (share.getExpiresAt() != null && share.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Este archivo ha expirado");
        }

        // Si es el dueño (sharedBy), siempre tiene acceso sin desbloquear
        boolean isOwner = share.getSharedBy().getId().equals(currentUser.getId());

        if (!isOwner && share.getSecurityLevel() != SecurityLevel.PUBLIC) {
            if (!Boolean.TRUE.equals(share.getIsUnlocked()) || (share.getUnlockedUntil() != null && share.getUnlockedUntil().isBefore(LocalDateTime.now()))) {
                throw new RuntimeException("Este archivo está bloqueado. Solicite un token SMS o ingrese la contraseña");
            }
        }
    }

    @Transactional(readOnly = true)
    public FileShareResponse getFileDetails(String shareId) {
        User currentUser = getCurrentUser();

        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!share.getSharedWith().getId().equals(currentUser.getId()) &&
                !share.getSharedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        return mapToResponse(share);
    }

    /**
     * Obtener el PDF descifrado para visualización
     */
    @Transactional
    public byte[] getDecryptedFileForPreview(String shareId) {
        User currentUser = getCurrentUser();

        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        // Validar acceso
        if (!share.getSharedWith().getId().equals(currentUser.getId()) &&
                !share.getSharedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        // Validar que el archivo esté activo
        if (!share.getIsActive() || share.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El archivo ha expirado");
        }

        // Validar desbloqueo (si no es el dueño)
        boolean isOwner = share.getSharedBy().getId().equals(currentUser.getId());
        if (!isOwner && share.getSecurityLevel() != SecurityLevel.PUBLIC) {
            boolean isUnlocked = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                    share.getUnlockedUntil() != null && share.getUnlockedUntil().isAfter(LocalDateTime.now());

            if (!isUnlocked) {
                throw new RuntimeException("El archivo está bloqueado. Solicita un token o ingresa la contraseña.");
            }
        }

        try {
            // 1. Descargar bytes cifrados desde Azure
            byte[] encryptedBytes = azureBlobService.downloadEncryptedBytes(share.getFile().getBlobUrl());

            // 2. Recuperar la llave AES
            SecretKey aesKey = encryptionService.decryptAesKey(share.getFile().getEncryptedAesKey());

            // 3. Obtener el IV
            byte[] iv = Base64.getDecoder().decode(share.getFile().getIv());

            // 4. Convertir a Base64 para el decrypt
            String encryptedBase64 = Base64.getEncoder().encodeToString(encryptedBytes);

            // 5. DESCIFRAR
            byte[] decryptedBytes = encryptionService.decrypt(encryptedBase64, aesKey, iv);

            log.info("✅ PDF descifrado exitosamente: {}", share.getFile().getFileName());

            return decryptedBytes;

        } catch (Exception e) {
            log.error("Error al descifrar PDF: {}", e.getMessage());
            throw new RuntimeException("Error al preparar el archivo: " + e.getMessage());
        }
    }
}