package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.SecretKey;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final FileMetadataRepository fileMetadataRepository;
    private final FileShareRepository fileShareRepository;
    private final UserRepository userRepository;
    private final AccessLogRepository accessLogRepository;
    private final NotificationRepository notificationRepository;
    private final FavoriteRepository favoriteRepository;
    private final AzureBlobService azureBlobService;
    private final EncryptionService encryptionService;
    private final TwilioService twilioService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final NotificationWebSocketService webSocketService;

    // Constantes
    private static final int UNLOCK_DURATION_HOURS = 24;
    private static final int MAX_SMS_ATTEMPTS = 3;
    private static final int SMS_TOKEN_EXPIRATION_MINUTES = 5;

    // ==============================================================
    // INICIALIZACIÓN: Crear carpeta raíz para nuevo usuario
    // ==============================================================

    /**
     * Crear la estructura inicial para un usuario nuevo
     * Este método DEBE ser llamado desde AuthService después de registrar un usuario
     */
    @Transactional
    public void initializeUserStorage(User user) {
        // Crear carpeta raíz del usuario
        FileMetadata rootFolder = new FileMetadata();
        rootFolder.setFileName("Mi unidad");
        rootFolder.setFileType("folder");
        rootFolder.setFileSize(0L);
        rootFolder.setIsFolder(true);
        rootFolder.setIsPersonal(true);  // Las carpetas son personales
        rootFolder.setUploadedBy(user);
        rootFolder.setUploadedAt(LocalDateTime.now());
        rootFolder.setParentFolder(null);  // Raíz no tiene padre
        rootFolder.setFolderColor("blue");  // Color por defecto

        // CAMPOS OBLIGATORIOS - Usar valores ÚNICOS
        String uniqueId = "folder_" + user.getId() + "_" + System.currentTimeMillis();
        rootFolder.setBlobPath(uniqueId);
        rootFolder.setBlobUrl(uniqueId);
        rootFolder.setChecksum("");
        rootFolder.setContainerName("");
        rootFolder.setEncryptedAesKey("");
        rootFolder.setIv("");
        rootFolder.setCustomMetadata(null);

        fileMetadataRepository.save(rootFolder);
        log.info("Carpeta raíz creada para usuario: {}", user.getUsername());
    }

    // ==============================================================
    // 1. GESTIÓN DE CARPETAS
    // ==============================================================

    @Transactional
    public StorageItemResponse createFolder(CreateFolderRequest request) {
        User currentUser = getCurrentUser();

        // Validar carpeta padre (si existe)
        FileMetadata parentFolder = null;
        if (request.getParentFolderId() != null) {
            parentFolder = fileMetadataRepository.findById(request.getParentFolderId())
                    .orElseThrow(() -> new RuntimeException("Carpeta padre no encontrada"));

            // Validar que la carpeta padre pertenezca al usuario
            if (!parentFolder.getUploadedBy().getId().equals(currentUser.getId())) {
                throw new RuntimeException("No tienes permiso para crear carpetas aquí");
            }

            // Validar que sea una carpeta
            if (!parentFolder.getIsFolder()) {
                throw new RuntimeException("El elemento padre no es una carpeta");
            }
        }

        // Validar que no exista una carpeta con el mismo nombre en la misma ubicación
        String parentId = parentFolder != null ? parentFolder.getId() : null;
        if (existsByNameInFolder(request.getName(), parentId, currentUser)) {
            throw new RuntimeException("Ya existe una carpeta con este nombre en la ubicación actual");
        }

        // Crear nueva carpeta
        FileMetadata folder = new FileMetadata();
        folder.setFileName(request.getName());
        folder.setFileType("folder");
        folder.setFileSize(0L);
        folder.setIsFolder(true);
        folder.setIsPersonal(true);
        folder.setUploadedBy(currentUser);
        folder.setUploadedAt(LocalDateTime.now());
        folder.setParentFolder(parentFolder);
        folder.setFolderColor(request.getColor() != null ? request.getColor() : "blue");

        // CAMPOS OBLIGATORIOS - Usar valores ÚNICOS
        String uniqueId = "folder_" + currentUser.getId() + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
        folder.setBlobPath(uniqueId);
        folder.setBlobUrl(uniqueId);
        folder.setChecksum("");
        folder.setContainerName("");
        folder.setEncryptedAesKey("");
        folder.setIv("");
        folder.setCustomMetadata(null);

        FileMetadata savedFolder = fileMetadataRepository.save(folder);

        log.info("Carpeta creada: '{}' por usuario: {}", request.getName(), currentUser.getUsername());

        return mapToStorageResponse(savedFolder, currentUser);
    }

    @Transactional(readOnly = true)
    public List<StorageItemResponse> getFolderContents(String folderId) {
        User currentUser = getCurrentUser();

        log.info("=== getFolderContents ===");
        log.info("Usuario: {}", currentUser.getUsername());
        log.info("FolderId solicitado: {}", folderId);

        FileMetadata parentFolder = null;
        if (folderId != null && !folderId.isEmpty()) {
            parentFolder = fileMetadataRepository.findById(folderId)
                    .orElseThrow(() -> new RuntimeException("Carpeta no encontrada"));

            log.info("Carpeta padre encontrada: {} (ID: {})", parentFolder.getFileName(), parentFolder.getId());

            if (!parentFolder.getUploadedBy().getId().equals(currentUser.getId())) {
                throw new RuntimeException("No tienes acceso a esta carpeta");
            }

            if (!parentFolder.getIsFolder()) {
                throw new RuntimeException("El ID no corresponde a una carpeta");
            }
        } else {
            log.info("Buscando en la RAÍZ (parentFolder = null)");
        }

        // Obtener elementos
        List<FileMetadata> contents;
        if (parentFolder != null) {
            contents = fileMetadataRepository.findByParentFolder(parentFolder)
                    .stream()
                    .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                    .filter(item -> item.getUploadedBy().getId().equals(currentUser.getId()))
                    .filter(item -> Boolean.TRUE.equals(item.getIsPersonal()) || Boolean.TRUE.equals(item.getIsFolder()))  // ← CLAVE: Solo personales o carpetas
                    .collect(Collectors.toList());
        } else {
            contents = fileMetadataRepository.findByParentFolder(null)
                    .stream()
                    .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                    .filter(item -> item.getUploadedBy().getId().equals(currentUser.getId()))
                    .filter(item -> Boolean.TRUE.equals(item.getIsPersonal()) || Boolean.TRUE.equals(item.getIsFolder()))  // ← CLAVE: Solo personales o carpetas
                    .collect(Collectors.toList());
        }

        // 🔍 LOGS PARA DEPURAR
        log.info("Total elementos encontrados (sin filtrar por tipo): {}", contents.size());
        for (FileMetadata item : contents) {
            log.info("  - ID: {}, Nombre: {}, isFolder: {}, isPersonal: {}, deleted: {}",
                    item.getId(),
                    item.getFileName(),
                    item.getIsFolder(),
                    item.getIsPersonal(),
                    item.getIsDeleted()
            );
        }

        // Separar carpetas y archivos
        List<FileMetadata> carpetas = contents.stream()
                .filter(item -> Boolean.TRUE.equals(item.getIsFolder()))
                .collect(Collectors.toList());

        List<FileMetadata> archivos = contents.stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsFolder()))
                .collect(Collectors.toList());

        log.info("Carpetas: {}, Archivos: {}", carpetas.size(), archivos.size());

        return contents.stream()
                .map(item -> mapToStorageResponse(item, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StorageItemResponse> getRootContents() {
        return getFolderContents(null);
    }

    // ==============================================================
    @Transactional
    public StorageItemResponse uploadPersonalFile(PersonalFileUploadRequest request) {
        User currentUser = getCurrentUser();
        MultipartFile file = request.getFile();

        // Validar nivel de seguridad
        validateSecurityLevel(request);

        // Validar carpeta destino
        FileMetadata parentFolder = null;
        if (request.getParentFolderId() != null && !request.getParentFolderId().isEmpty()) {
            parentFolder = fileMetadataRepository.findById(request.getParentFolderId())
                    .orElseThrow(() -> new RuntimeException("Carpeta destino no encontrada"));
            if (!parentFolder.getUploadedBy().getId().equals(currentUser.getId())) {
                throw new RuntimeException("No tienes permiso para subir aquí");
            }
            if (!parentFolder.getIsFolder()) {
                throw new RuntimeException("El destino no es una carpeta");
            }
        }

        try {
            // ==========================================================
            // 1. LEER el archivo original
            // ==========================================================
            byte[] fileBytes = file.getBytes();

            // ==========================================================
            // 2. GENERAR clave AES y IV (Vector de Inicialización)
            // ==========================================================
            SecretKey aesKey = encryptionService.generateAesKey();
            byte[] iv = encryptionService.generateIv();

            // ==========================================================
            // 3. CIFRAR el contenido del archivo (¡EL PASO IMPORTANTE!)
            // ==========================================================
            String encryptedBase64 = encryptionService.encrypt(fileBytes, aesKey, iv);
            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedBase64);

            // ==========================================================
            // 4. SUBIR el archivo CIFRADO a Azure
            // ==========================================================
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String blobName = UUID.randomUUID().toString() + "_" + System.currentTimeMillis() + extension;

            // ¡Usamos el NUEVO método que solo sube datos cifrados!
            String blobUrl = azureBlobService.uploadEncryptedData(encryptedBytes, blobName);

            // ==========================================================
            // 5. CIFRAR la clave AES con la llave maestra (Envelope Encryption)
            // ==========================================================
            String encryptedAesKey = encryptionService.encryptAesKey(aesKey);

            // ==========================================================
            // 6. GUARDAR metadata en la base de datos
            // ==========================================================
            FileMetadata metadata = new FileMetadata();
            metadata.setFileName(file.getOriginalFilename());
            metadata.setFileType(file.getContentType());
            metadata.setFileSize(file.getSize());
            metadata.setBlobUrl(blobUrl);
            metadata.setContainerName("archivos-seguros");
            metadata.setBlobPath(blobName);
            metadata.setEncryptedAesKey(encryptedAesKey);
            metadata.setIv(Base64.getEncoder().encodeToString(iv));
            metadata.setChecksum(generateChecksum(file));
            metadata.setUploadedBy(currentUser);
            metadata.setUploadedAt(LocalDateTime.now());
            metadata.setIsFolder(false);
            metadata.setIsPersonal(true);
            metadata.setParentFolder(parentFolder);

            FileMetadata savedMetadata = fileMetadataRepository.save(metadata);

            // ==========================================================
            // 7. CREAR FileShare para manejar la seguridad (contraseña/token)
            // ==========================================================
            createPersonalFileShare(savedMetadata, currentUser, request);

            log.info("✅ Archivo personal CIFRADO y subido: '{}'", file.getOriginalFilename());

            return mapToStorageResponse(savedMetadata, currentUser);

        } catch (Exception e) {
            log.error("❌ Error al subir archivo personal: {}", e.getMessage());
            throw new RuntimeException("Error al subir archivo: " + e.getMessage());
        }
    }

    /**
     * Crear un FileShare especial para el propio usuario
     * Esto permite manejar los niveles de seguridad (PASSWORD, TOKEN_SMS)
     * sin modificar la lógica existente
     */
    private void createPersonalFileShare(FileMetadata file, User user, PersonalFileUploadRequest request) {
        FileShare share = new FileShare();
        share.setFile(file);
        share.setSharedBy(user);
        share.setSharedWith(user);  // ¡Compartido con sí mismo!
        share.setSharedAt(LocalDateTime.now());
        share.setExpiresAt(null);  // No expira
        share.setAccessLevel(AccessLevel.DOWNLOAD);  // Por defecto puede descargar
        share.setSecurityLevel(request.getSecurityLevel());
        share.setNotifyOnview(false);   // No notificar al propio dueño
        share.setNotifyOnDownload(false);
        share.setSelfDestruct(false);
        share.setIsActive(true);
        share.setIsUnlocked(false);
        share.setMessage(null);

        // Configurar según nivel de seguridad
        if (request.getSecurityLevel() == SecurityLevel.PASSWORD) {
            share.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            share.setUseCustomPhone(!request.getUseAccountPhone());
            if (!request.getUseAccountPhone()) {
                share.setCustomPhoneNumber(request.getCustomPhoneNumber());
            }
        }

        fileShareRepository.save(share);
    }

    // ==============================================================
    // 3. MOVER Y ELIMINAR
    // ==============================================================

    @Transactional
    public StorageItemResponse moveItem(String itemId, String targetFolderId) {
        User currentUser = getCurrentUser();

        // Obtener el elemento a mover
        FileMetadata item = fileMetadataRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Elemento no encontrado"));

        // Validar que pertenezca al usuario
        if (!item.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No puedes mover elementos que no te pertenecen");
        }

        // Validar que no sea la raíz
        if (item.getParentFolder() == null && targetFolderId == null) {
            throw new RuntimeException("El elemento ya está en la raíz");
        }

        // Obtener carpeta destino
        FileMetadata targetFolder = null;
        if (targetFolderId != null) {
            targetFolder = fileMetadataRepository.findById(targetFolderId)
                    .orElseThrow(() -> new RuntimeException("Carpeta destino no encontrada"));

            if (!targetFolder.getUploadedBy().getId().equals(currentUser.getId())) {
                throw new RuntimeException("No tienes permiso para mover aquí");
            }

            if (!targetFolder.getIsFolder()) {
                throw new RuntimeException("El destino no es una carpeta");
            }

            // No mover a sí mismo o a un subdirectorio de sí mismo
            if (item.getIsFolder() && isDescendant(item, targetFolder)) {
                throw new RuntimeException("No puedes mover una carpeta dentro de sí misma");
            }
        }

        // Mover el elemento
        item.setParentFolder(targetFolder);
        FileMetadata moved = fileMetadataRepository.save(item);

        log.info("Elemento movido: '{}' por usuario: {}", item.getFileName(), currentUser.getUsername());

        return mapToStorageResponse(moved, currentUser);
    }

    @Transactional
    public void deleteItem(String itemId) {
        User currentUser = getCurrentUser();
        FileMetadata item = fileMetadataRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Elemento no encontrado"));

        if (!item.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No puedes eliminar elementos que no te pertenecen");
        }

        item.setIsDeleted(true);
        item.setDeletedAt(LocalDateTime.now());

        // Si es carpeta, marcar también todos sus contenidos como eliminados
        if (item.getIsFolder()) {
            markFolderContentsDeleted(item, true);
        }

        fileMetadataRepository.save(item);
        log.info("Elemento movido a papelera: '{}'", item.getFileName());
    }

    @Transactional
    public void restoreItem(String itemId) {
        User currentUser = getCurrentUser();
        FileMetadata item = fileMetadataRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Elemento no encontrado"));

        if (!item.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No puedes restaurar elementos que no te pertenecen");
        }

        item.setIsDeleted(false);
        item.setDeletedAt(null);

        if (item.getIsFolder()) {
            markFolderContentsDeleted(item, false);
        }

        fileMetadataRepository.save(item);
        log.info("Elemento restaurado: '{}'", item.getFileName());
    }

    @Transactional
    public void permanentDelete(String itemId) {
        User currentUser = getCurrentUser();
        FileMetadata item = fileMetadataRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Elemento no encontrado"));

        if (!item.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No puedes eliminar elementos que no te pertenecen");
        }

        try {
            // Eliminar FileShare asociados
            if (!item.getIsFolder()) {
                List<FileShare> shares = fileShareRepository.findByFile_Id(item.getId());
                for (FileShare share : shares) {
                    deleteShareReferences(share);
                    fileShareRepository.delete(share);
                }
            } else {
                deleteFolderContentsRecursively(item);
            }

            // Eliminar de Azure (ignorar errores 404)
            if (!item.getIsFolder() && item.getBlobUrl() != null && !item.getBlobUrl().isEmpty()) {
                try {
                    azureBlobService.delateFile(item.getBlobUrl());
                } catch (Exception e) {
                    log.warn("Archivo no encontrado en Azure (ignorando): {}", item.getBlobUrl());
                }
            }

            // Eliminar metadata
            fileMetadataRepository.delete(item);
            log.info("Elemento eliminado permanentemente: '{}'", item.getFileName());

        } catch (Exception e) {
            log.error("Error eliminando elemento: {}", e.getMessage());
            throw new RuntimeException("Error al eliminar el elemento: " + e.getMessage());
        }
    }
    // ==============================================================
    // 4. ACCESO A ARCHIVOS PERSONALES (DESBLOQUEO)
    // ==============================================================

    @Transactional
    public String requestPersonalFileToken(String fileId) {
        User currentUser = getCurrentUser();
        FileShare share = getPersonalFileShare(fileId, currentUser);

        if (share.getIsUnlocked() && share.getUnlockedUntil() != null &&
                share.getUnlockedUntil().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("El archivo ya está desbloqueado hasta: " + share.getUnlockedUntil());
        }

        String token = encryptionService.generateSmsToken();
        share.setCurrentSmsToken(token);
        share.setSmsTokenExpiresAt(LocalDateTime.now().plusMinutes(SMS_TOKEN_EXPIRATION_MINUTES));
        share.setSmsAttempts(0);
        fileShareRepository.save(share);

        String phoneNumber = share.getUseCustomPhone() ? share.getCustomPhoneNumber() : currentUser.getPhone();

        try {
            twilioService.sendVerificationCode(phoneNumber, token);
        } catch (Exception e) {
            log.warn("Error al enviar SMS: {}", e.getMessage());
        }

        emailService.sendSimpleMessage(currentUser.getEmail(),
                "Código de desbloqueo",
                "Tu código para desbloquear '" + share.getFile().getFileName() + "' es: " + token);

        return "Token enviado exitosamente";
    }

    @Transactional
    public StorageItemResponse verifyPersonalFileToken(String fileId, String token) {
        User currentUser = getCurrentUser();
        FileShare share = getPersonalFileShare(fileId, currentUser);

        if (share.getSmsAttempts() >= MAX_SMS_ATTEMPTS) {
            throw new RuntimeException("Demasiados intentos fallidos. Solicite un nuevo token");
        }

        if (share.getSmsTokenExpiresAt() == null ||
                share.getSmsTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El token ha expirado");
        }

        if (!token.equals(share.getCurrentSmsToken())) {
            share.setSmsAttempts(share.getSmsAttempts() + 1);
            fileShareRepository.save(share);
            int left = MAX_SMS_ATTEMPTS - share.getSmsAttempts();
            throw new RuntimeException("Token incorrecto. Intentos restantes: " + left);
        }

        // Desbloquear
        share.setIsUnlocked(true);
        share.setUnlockedAt(LocalDateTime.now());
        share.setUnlockedUntil(LocalDateTime.now().plusHours(UNLOCK_DURATION_HOURS));
        share.setCurrentSmsToken(null);
        share.setSmsTokenExpiresAt(null);
        share.setSmsAttempts(0);
        fileShareRepository.save(share);

        log.info("Archivo personal desbloqueado con token: '{}'", share.getFile().getFileName());

        return mapToStorageResponse(share.getFile(), currentUser);
    }

    @Transactional
    public StorageItemResponse verifyPersonalFilePassword(String fileId, String password) {
        User currentUser = getCurrentUser();
        FileShare share = getPersonalFileShare(fileId, currentUser);

        if (share.getSecurityLevel() != SecurityLevel.PASSWORD) {
            throw new RuntimeException("Este archivo no está protegido por contraseña");
        }

        Integer attempts = share.getSmsAttempts() != null ? share.getSmsAttempts() : 0;
        if (attempts >= 5) {
            throw new RuntimeException("Demasiados intentos fallidos");
        }

        if (share.getPasswordHash() == null || !passwordEncoder.matches(password, share.getPasswordHash())) {
            share.setSmsAttempts(attempts + 1);
            fileShareRepository.save(share);
            throw new RuntimeException("Contraseña incorrecta. Intentos restantes: " + (4 - attempts));
        }

        // Desbloquear
        share.setIsUnlocked(true);
        share.setUnlockedAt(LocalDateTime.now());
        share.setUnlockedUntil(LocalDateTime.now().plusHours(UNLOCK_DURATION_HOURS));
        share.setSmsAttempts(0);
        fileShareRepository.save(share);

        log.info("Archivo personal desbloqueado con contraseña: '{}'", share.getFile().getFileName());

        return mapToStorageResponse(share.getFile(), currentUser);
    }

    @Transactional(readOnly = true)
    public StorageItemResponse openPersonalFile(String fileId) {
        User currentUser = getCurrentUser();
        FileShare share = getPersonalFileShare(fileId, currentUser);

        // Validar que esté desbloqueado si requiere seguridad
        if (share.getSecurityLevel() != SecurityLevel.PUBLIC) {
            boolean isUnlocked = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                    share.getUnlockedUntil() != null && share.getUnlockedUntil().isAfter(LocalDateTime.now());

            if (!isUnlocked) {
                throw new RuntimeException("Archivo bloqueado. Debes desbloquearlo primero");
            }
        }

        // Incrementar contador (opcional, para estadísticas personales)
        share.setViewCount(share.getViewCount() + 1);
        share.setLastViewedAt(LocalDateTime.now());
        fileShareRepository.save(share);

        return mapToStorageResponse(share.getFile(), currentUser);
    }

    @Transactional(readOnly = true)
    public String downloadPersonalFile(String fileId) {
        User currentUser = getCurrentUser();
        FileShare share = getPersonalFileShare(fileId, currentUser);

        // Validar que esté desbloqueado si requiere seguridad
        if (share.getSecurityLevel() != SecurityLevel.PUBLIC) {
            boolean isUnlocked = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                    share.getUnlockedUntil() != null && share.getUnlockedUntil().isAfter(LocalDateTime.now());

            if (!isUnlocked) {
                throw new RuntimeException("Archivo bloqueado. Debes desbloquearlo primero");
            }
        }

        share.setDownloadCount(share.getDownloadCount() + 1);
        share.setLastDownloadedAt(LocalDateTime.now());
        fileShareRepository.save(share);

        return azureBlobService.generateSasToken(share.getFile().getBlobUrl(), 60);
    }

    @Transactional(readOnly = true)
    public StorageItemResponse getItemInfo(String itemId) {
        User currentUser = getCurrentUser();
        FileMetadata item = fileMetadataRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Elemento no encontrado"));

        if (!item.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este elemento");
        }

        return mapToStorageResponse(item, currentUser);
    }

    // ==============================================================
    // 5. COMPARTIR ARCHIVOS DESDE ALMACENAMIENTO PERSONAL (FASE 2)
    // ==============================================================

    /**
     * Compartir un archivo existente con otros usuarios
     * Si ya existe un share activo, lo desactiva y crea uno nuevo con las nuevas credenciales
     */
    @Transactional
    public List<FileShareResponse> shareExistingFile(ShareExistingFileRequest request) {
        User currentUser = getCurrentUser();

        // 1. Obtener el archivo original
        FileMetadata file = fileMetadataRepository.findById(request.getFileId())
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        // Validar que el archivo pertenezca al usuario
        if (!file.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No puedes compartir un archivo que no te pertenece");
        }

        // Validar que sea un archivo, no una carpeta
        if (file.getIsFolder()) {
            throw new RuntimeException("No se pueden compartir carpetas");
        }

        // Validar que no esté en papelera
        if (Boolean.TRUE.equals(file.getIsDeleted())) {
            throw new RuntimeException("El archivo está en la papelera. Restáuralo antes de compartir");
        }

        // 2. Validar configuración de seguridad
        validateShareSecurityLevel(request);

        List<FileShareResponse> responses = new ArrayList<>();

        // 3. Crear FileShare para cada destinatario
        for (ShareExistingFileRequest.RecipientInfo recipient : request.getRecipients()) {
            User targetUser = findUserByIdentifier(recipient);

            // DESACTIVAR shares anteriores del mismo archivo con este usuario
            log.info("🔄 Desactivando shares anteriores para usuario: {} con archivo: {}",
                    targetUser.getUsername(), file.getFileName());

            // Método 1: Usar consulta personalizada
            fileShareRepository.deactivateAllSharesForUser(file.getId(), targetUser);

            // Método 2 (alternativa si el método de arriba no funciona):
            // List<FileShare> existingShares = fileShareRepository
            //         .findAllByFile_IdAndSharedWithAndIsActiveTrue(file.getId(), targetUser);
            // for (FileShare oldShare : existingShares) {
            //     oldShare.setIsActive(false);
            //     fileShareRepository.save(oldShare);
            // }

            // Crear el nuevo FileShare con las nuevas credenciales
            FileShare share = createShareFromExistingFile(file, currentUser, targetUser, request);
            FileShare savedShare = fileShareRepository.save(share);

            // Enviar notificaciones
            sendSharingNotifications(savedShare, request.getMessage());

            // Registrar en auditoría
            logAccess(currentUser, file, savedShare, AccessAction.SHARE, true,
                    "Compartido con: " + targetUser.getEmail() + " (nuevas credenciales)");

            responses.add(mapToFileShareResponse(savedShare));
        }

        // 4. Copia para sí mismo si lo solicitó
        if (request.getSendCopyToMyself() != null && request.getSendCopyToMyself()) {
            // Desactivar share anterior propio si existe
            fileShareRepository.deactivateAllSharesForUser(file.getId(), currentUser);

            FileShare selfShare = createShareFromExistingFile(file, currentUser, currentUser, request);
            selfShare.setNotifyOnview(false);
            selfShare.setNotifyOnDownload(false);
            fileShareRepository.save(selfShare);
        }

        return responses;
    }

    /**
     * Obtener todos los archivos que el usuario puede compartir
     * (Archivos personales, no carpetas, no en papelera)
     */
    @Transactional(readOnly = true)
    public List<StorageItemResponse> getShareableFiles() {
        User currentUser = getCurrentUser();

        // Buscar todos los archivos personales del usuario (no carpetas, no eliminados)
        List<FileMetadata> personalFiles = fileMetadataRepository.findByUploadedBy(currentUser)
                .stream()
                .filter(file -> !Boolean.TRUE.equals(file.getIsFolder()))
                .filter(file -> !Boolean.TRUE.equals(file.getIsDeleted()))
                .collect(Collectors.toList());

        return personalFiles.stream()
                .map(file -> mapToStorageResponse(file, currentUser))
                .collect(Collectors.toList());
    }

    // ==============================================================
    // MÉTODOS PRIVADOS PARA FASE 2
    // ==============================================================

    /**
     * Crear FileShare a partir de un archivo existente
     */
    private FileShare createShareFromExistingFile(FileMetadata file, User sharedBy,
                                                  User sharedWith, ShareExistingFileRequest request) {
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
        share.setNotifyOnview(request.getNotifyOnView() != null ? request.getNotifyOnView() : false);
        share.setNotifyOnDownload(request.getNotifyOnDownload() != null ? request.getNotifyOnDownload() : false);
        share.setSelfDestruct(request.getSelfDestruct() != null ? request.getSelfDestruct() : false);
        share.setIsActive(true);
        share.setIsUnlocked(false);

        // Configurar seguridad
        if (request.getSecurityLevel() == SecurityLevel.PASSWORD) {
            share.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            share.setUseCustomPhone(!request.getUseAccountPhone());
            if (!request.getUseAccountPhone()) {
                share.setCustomPhoneNumber(request.getCustomPhoneNumber());
            }
        }

        return share;
    }

    /**
     * Validar configuración de seguridad para compartir archivo existente
     */
    private void validateShareSecurityLevel(ShareExistingFileRequest request) {
        if (request.getSecurityLevel() == SecurityLevel.PASSWORD) {
            if (request.getPassword() == null || request.getConfirmPassword() == null) {
                throw new RuntimeException("Debe especificar una contraseña");
            }
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new RuntimeException("Las contraseñas no coinciden");
            }
            if (request.getPassword().length() < 8) {
                throw new RuntimeException("La contraseña debe tener al menos 8 caracteres");
            }
        }

        if (request.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            if (!request.getUseAccountPhone() &&
                    (request.getCustomPhoneNumber() == null || request.getCustomPhoneNumber().isEmpty())) {
                throw new RuntimeException("Debe especificar un número de teléfono alternativo");
            }
        }
    }

    /**
     * Calcular fecha de expiración
     */
    private LocalDateTime calculateExpiration(ShareExistingFileRequest.ExpirationTime expirationTime) {
        if (expirationTime == null) return LocalDateTime.now().plusDays(30);
        return switch (expirationTime) {
            case HOURS_24 -> LocalDateTime.now().plusHours(24);
            case DAYS_3 -> LocalDateTime.now().plusDays(3);
            case DAYS_7 -> LocalDateTime.now().plusDays(7);
            case MONTH_1 -> LocalDateTime.now().plusMonths(1);
            case CUSTOM -> LocalDateTime.now().plusDays(30);
        };
    }

    /**
     * Enviar notificaciones al compartir
     */
    private void sendSharingNotifications(FileShare share, String customMessage) {
        String content = String.format("%s %s te ha compartido el archivo: %s\n" +
                        "Nivel de seguridad: %s\n" +
                        "Expira: %s\n\n" +
                        "Inicia sesión en la plataforma para verlo.",
                share.getSharedBy().getNombre(),
                share.getSharedBy().getApellido(),
                share.getFile().getFileName(),
                share.getSecurityLevel(),
                share.getExpiresAt());

        if (customMessage != null && !customMessage.isEmpty()) {
            content += "\n\nMensaje: " + customMessage;
        }

        // Enviar email
        emailService.sendNotificationEmail(
                share.getSharedWith().getEmail(),
                "Te compartieron un archivo",
                content,
                share.getSharedWith().getNombre()
        );

        // Crear notificación en la campanita
        Notification notification = new Notification();
        notification.setUser(share.getSharedWith());
        notification.setFileShare(share);
        notification.setType(NotificationType.NEW_FILE_SHARED);
        notification.setMessage(share.getSharedBy().getNombre() + " " +
                share.getSharedBy().getApellido() + " te compartió: " + share.getFile().getFileName());

        Notification savedNotification = notificationRepository.save(notification);

        // Enviar notificación en tiempo real si está conectado
        try {
            webSocketService.sendToUser(share.getSharedWith(), savedNotification);
        } catch (Exception e) {
            log.warn("Error enviando notificación WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Mapear FileShare a FileShareResponse (reutilizando el existente)
     */
    private FileShareResponse mapToFileShareResponse(FileShare share) {
        boolean unlockedStatus = false;

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
                .message(share.getMessage())  // ← CORREGIDO
                .build();
    }

    /**
     * Buscar usuario por identificador (email, username o teléfono)
     */
    private User findUserByIdentifier(ShareExistingFileRequest.RecipientInfo recipient) {
        return switch (recipient.getType()) {
            case EMAIL -> userRepository.findByEmail(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con email: " + recipient.getIdentifier()));
            case USERNAME -> userRepository.findByUsername(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con username: " + recipient.getIdentifier()));
            case PHONE -> userRepository.findByPhone(recipient.getIdentifier())
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado con teléfono: " + recipient.getIdentifier()));
        };
    }

    // ==============================================================
    // MÉTODOS PRIVADOS AUXILIARES
    // ==============================================================

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }

    private FileShare getPersonalFileShare(String fileId, User user) {
        FileMetadata file = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        if (!file.getUploadedBy().getId().equals(user.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        // Si no encuentra la configuración (archivos viejos), la crea automáticamente como PÚBLICA
        return fileShareRepository.findByFile_IdAndSharedWith(fileId, user)
                .orElseGet(() -> {
                    FileShare newShare = new FileShare();
                    newShare.setFile(file);
                    newShare.setSharedBy(user);
                    newShare.setSharedWith(user);
                    newShare.setSharedAt(file.getUploadedAt() != null ? file.getUploadedAt() : LocalDateTime.now());
                    newShare.setExpiresAt(null); // No expira
                    newShare.setAccessLevel(AccessLevel.DOWNLOAD);
                    newShare.setSecurityLevel(SecurityLevel.PUBLIC);
                    newShare.setNotifyOnview(false);
                    newShare.setNotifyOnDownload(false);
                    newShare.setSelfDestruct(false);
                    newShare.setIsActive(true);
                    newShare.setIsUnlocked(true);
                    newShare.setViewCount(0);
                    newShare.setDownloadCount(0);
                    return fileShareRepository.save(newShare);
                });
    }

    private void validateSecurityLevel(PersonalFileUploadRequest request) {
        if (request.getSecurityLevel() == SecurityLevel.PASSWORD) {
            if (request.getPassword() == null || request.getConfirmPassword() == null) {
                throw new RuntimeException("Debe especificar una contraseña");
            }
            if (!request.getPassword().equals(request.getConfirmPassword())) {
                throw new RuntimeException("Las contraseñas no coinciden");
            }
            if (request.getPassword().length() < 8) {
                throw new RuntimeException("La contraseña debe tener al menos 8 caracteres");
            }
        }

        if (request.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            if (!request.getUseAccountPhone() &&
                    (request.getCustomPhoneNumber() == null || request.getCustomPhoneNumber().isEmpty())) {
                throw new RuntimeException("Debe especificar un número de teléfono alternativo");
            }
        }
    }

    private boolean existsByNameInFolder(String name, String parentFolderId, User user) {
        FileMetadata parent = parentFolderId != null ?
                fileMetadataRepository.findById(parentFolderId).orElse(null) : null;

        List<FileMetadata> existing = fileMetadataRepository.findByParentFolder(parent)
                .stream()
                .filter(item -> !Boolean.TRUE.equals(item.getIsDeleted()))
                .filter(item -> item.getFileName().equalsIgnoreCase(name))
                .collect(Collectors.toList());

        return !existing.isEmpty();
    }

    private boolean isDescendant(FileMetadata parent, FileMetadata possibleChild) {
        FileMetadata current = possibleChild;
        while (current != null) {
            if (current.getId().equals(parent.getId())) {
                return true;
            }
            current = current.getParentFolder();
        }
        return false;
    }

    private void markFolderContentsDeleted(FileMetadata folder, boolean deleted) {
        List<FileMetadata> contents = fileMetadataRepository.findByParentFolder(folder);
        for (FileMetadata item : contents) {
            item.setIsDeleted(deleted);
            item.setDeletedAt(deleted ? LocalDateTime.now() : null);
            if (item.getIsFolder()) {
                markFolderContentsDeleted(item, deleted);
            }
        }
        fileMetadataRepository.saveAll(contents);
    }

    private StorageItemResponse mapToStorageResponse(FileMetadata item, User currentUser) {
        log.info("📦 Mapeando item: {} (isFolder: {})", item.getFileName(), item.getIsFolder());

        // Valores por defecto
        String securityLevel = "PUBLIC";
        String accessLevel = "DOWNLOAD";
        Boolean isUnlocked = true;
        LocalDateTime unlockedUntil = null;
        Boolean hasPassword = false;

        // Solo buscar FileShare si NO es una carpeta (los archivos personales tienen FileShare)
        if (!item.getIsFolder()) {
            Optional<FileShare> share = fileShareRepository.findByFile_IdAndSharedWith(item.getId(), currentUser);
            if (share.isPresent()) {
                FileShare fs = share.get();
                securityLevel = fs.getSecurityLevel().name();
                accessLevel = fs.getAccessLevel().name();
                hasPassword = fs.getPasswordHash() != null && !fs.getPasswordHash().isEmpty();
                isUnlocked = fs.getIsUnlocked() != null && fs.getIsUnlocked() &&
                        fs.getUnlockedUntil() != null && fs.getUnlockedUntil().isAfter(LocalDateTime.now());
                unlockedUntil = fs.getUnlockedUntil();
                log.info("  🔓 Archivo con FileShare - securityLevel: {}, accessLevel: {}, isUnlocked: {}",
                        securityLevel, accessLevel, isUnlocked);
            } else {
                log.info("  📄 Archivo personal SIN FileShare - siempre desbloqueado");
            }
        }

        return StorageItemResponse.builder()
                .id(item.getId())
                .name(item.getFileName())
                .isFolder(item.getIsFolder())
                .folderColor(item.getFolderColor())
                .fileType(item.getFileType())
                .fileSize(item.getFileSize())
                .uploadedAt(item.getUploadedAt())
                .securityLevel(securityLevel)      // ← String
                .accessLevel(accessLevel)          // ← String
                .hasPassword(hasPassword)          // ← NUEVO: Si tiene contraseña
                .isLocked(!isUnlocked && !"PUBLIC".equals(securityLevel))  // ← NUEVO: Si está bloqueado
                .isUnlocked(isUnlocked)            // ← NUEVO: Si está desbloqueado
                .unlockedUntil(unlockedUntil)      // ← NUEVO: Hasta cuándo está desbloqueado
                .build();
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
            log.error("Error generando checksum: ", e);
            return "N/A";
        }
    }

    // ==============================================================
    // MÉTODOS DE AUDITORÍA Y UTILIDADES (FALTANTES)
    // ==============================================================

    /**
     * Registrar acción en el log de auditoría
     */
    private void logAccess(User user, FileMetadata file, FileShare share,
                           AccessAction action, boolean success, String details) {
        try {
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
        } catch (Exception e) {
            log.error("Error al guardar log de auditoría: {}", e.getMessage());
        }
    }

    /**
     * Obtener IP del cliente
     */
    private String getClientIp() {
        try {
            jakarta.servlet.http.HttpServletRequest request =
                    ((org.springframework.web.context.request.ServletRequestAttributes)
                            org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes())
                            .getRequest();

            String xfHeader = request.getHeader("X-Forwarded-For");
            if (xfHeader != null && !xfHeader.isEmpty()) {
                return xfHeader.split(",")[0];
            }
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "IP-Desconocida";
        }
    }

    /**
     * Obtener User-Agent del cliente
     */
    private String getUserAgent() {
        try {
            jakarta.servlet.http.HttpServletRequest request =
                    ((org.springframework.web.context.request.ServletRequestAttributes)
                            org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes())
                            .getRequest();
            return request.getHeader("User-Agent");
        } catch (Exception e) {
            return "Agente-Desconocido";
        }
    }

    // ==============================================================
    // 6. FAVORITOS
    // ==============================================================

    @Transactional
    public FavoriteResponse addFavorite(String itemId, String type) {
        User currentUser = getCurrentUser();

        // Verificar si es una carpeta (PERSONAL con isFolder = true)
        if ("PERSONAL".equals(type)) {
            FileMetadata item = fileMetadataRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("Elemento no encontrado"));

            if (!item.getUploadedBy().getId().equals(currentUser.getId())) {
                throw new RuntimeException("No puedes agregar a favoritos un elemento que no te pertenece");
            }

            // Verificar si ya existe
            Optional<Favorite> existing = favoriteRepository.findByUserAndFileMetadata(currentUser, item);
            if (existing.isPresent()) {
                throw new RuntimeException("El elemento ya está en favoritos");
            }

            Favorite favorite = new Favorite();
            favorite.setUser(currentUser);
            favorite.setFileMetadata(item);  // Puede ser carpeta o archivo
            favorite.setFavoritedAt(LocalDateTime.now());
            Favorite saved = favoriteRepository.save(favorite);

            return mapToFavoriteResponse(saved);

        } else if ("SHARED".equals(type)) {
            // Solo archivos compartidos, no carpetas compartidas por ahora
            FileShare share = fileShareRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("Archivo compartido no encontrado"));

            if (!share.getSharedWith().getId().equals(currentUser.getId())) {
                throw new RuntimeException("No puedes agregar a favoritos un archivo que no te compartieron");
            }

            Optional<Favorite> existing = favoriteRepository.findByUserAndFileShare(currentUser, share);
            if (existing.isPresent()) {
                throw new RuntimeException("El archivo ya está en favoritos");
            }

            Favorite favorite = new Favorite();
            favorite.setUser(currentUser);
            favorite.setFileShare(share);
            favorite.setFavoritedAt(LocalDateTime.now());
            Favorite saved = favoriteRepository.save(favorite);

            return mapToFavoriteResponse(saved);

        } else {
            throw new RuntimeException("Tipo inválido. Use PERSONAL o SHARED");
        }
    }

    @Transactional
    public void removeFavorite(Long favoriteId) {
        User currentUser = getCurrentUser();
        Favorite favorite = favoriteRepository.findById(favoriteId)
                .orElseThrow(() -> new RuntimeException("Favorito no encontrado"));

        if (!favorite.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No puedes eliminar este favorito");
        }

        favoriteRepository.delete(favorite);
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> getFavorites() {
        User currentUser = getCurrentUser();
        List<Favorite> favorites = favoriteRepository.findByUserOrderByFavoritedAtDesc(currentUser);

        return favorites.stream()
                .map(this::mapToFavoriteResponse)
                .collect(Collectors.toList());
    }

    // ==============================================================
    // 7. RECIENTES
    // ==============================================================

    @Transactional(readOnly = true)
    public List<StorageItemResponse> getRecentPersonalFiles(int days) {
        User currentUser = getCurrentUser();
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        List<FileMetadata> files = fileMetadataRepository
                .findByUploadedByAndIsPersonalTrueAndUploadedAtAfter(currentUser, since);

        return files.stream()
                .filter(f -> !Boolean.TRUE.equals(f.getIsFolder()))
                .filter(f -> !Boolean.TRUE.equals(f.getIsDeleted()))
                .map(f -> mapToStorageResponse(f, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FileShareResponse> getRecentSharedFiles(int days) {
        User currentUser = getCurrentUser();
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        List<FileShare> shares = fileShareRepository
                .findBySharedWithAndSharedAtAfter(currentUser, since);

        return shares.stream()
                .filter(FileShare::getIsActive)
                .filter(s -> s.getExpiresAt() == null || s.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(this::mapToFileShareResponse)
                .collect(Collectors.toList());
    }

    // ==============================================================
    // 9. PAPELERA
    // ==============================================================

    @Transactional(readOnly = true)
    public List<TrashItemResponse> getTrashItems() {
        User currentUser = getCurrentUser();

        List<FileMetadata> deletedItems = fileMetadataRepository
                .findByUploadedByAndIsDeletedTrue(currentUser);

        return deletedItems.stream()
                .map(this::mapToTrashResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public int emptyTrash() {
        User currentUser = getCurrentUser();
        List<FileMetadata> deletedItems = fileMetadataRepository
                .findByUploadedByAndIsDeletedTrue(currentUser);

        int count = 0;
        for (FileMetadata item : deletedItems) {
            try {
                // 1. Primero eliminar los FileShare asociados (si existen)
                if (!item.getIsFolder()) {
                    // Buscar y eliminar FileShares
                    List<FileShare> shares = fileShareRepository.findByFile_Id(item.getId());
                    for (FileShare share : shares) {
                        // Eliminar referencias en otras tablas
                        deleteShareReferences(share);
                        // Eliminar el share
                        fileShareRepository.delete(share);
                    }
                }

                // 2. Si es carpeta, procesar su contenido recursivamente
                if (item.getIsFolder()) {
                    deleteFolderContentsRecursively(item);
                }

                // 3. Intentar eliminar de Azure (ignorar si no existe)
                if (!item.getIsFolder() && item.getBlobUrl() != null && !item.getBlobUrl().isEmpty()) {
                    try {
                        azureBlobService.delateFile(item.getBlobUrl());
                    } catch (Exception e) {
                        // Si el archivo no existe en Azure, solo logueamos y continuamos
                        log.warn("Archivo no encontrado en Azure (ignorando): {}", item.getBlobUrl());
                    }
                }

                // 4. Finalmente eliminar el metadata
                fileMetadataRepository.delete(item);
                count++;

            } catch (Exception e) {
                log.error("Error al eliminar elemento {}: {}", item.getId(), e.getMessage());
                // No lanzamos excepción para continuar con los demás elementos
            }
        }

        log.info("Papelera vaciada para usuario: {}, {} elementos eliminados",
                currentUser.getUsername(), count);

        // Forzar flush para que la transacción se complete
        return count;
    }

    /**
     * Eliminar referencias de un FileShare en otras tablas
     */
    private void deleteShareReferences(FileShare share) {
        try {
            // Eliminar notificaciones
            notificationRepository.deleteByFileShare(share);
        } catch (Exception e) {
            log.warn("Error eliminando notificaciones: {}", e.getMessage());
        }

        try {
            // Eliminar favoritos
            favoriteRepository.deleteByFileShare(share);
        } catch (Exception e) {
            log.warn("Error eliminando favoritos: {}", e.getMessage());
        }

        try {
            // Eliminar logs de acceso
            accessLogRepository.deleteByFileShare(share);
        } catch (Exception e) {
            log.warn("Error eliminando logs: {}", e.getMessage());
        }
    }

    /**
     * Eliminar recursivamente el contenido de una carpeta (solo metadata, no Azure)
     */
    private void deleteFolderContentsRecursively(FileMetadata folder) {
        List<FileMetadata> contents = fileMetadataRepository.findByParentFolder(folder);

        for (FileMetadata item : contents) {
            if (item.getIsFolder()) {
                deleteFolderContentsRecursively(item);
            } else {
                // Eliminar FileShares
                List<FileShare> shares = fileShareRepository.findByFile_Id(item.getId());
                for (FileShare share : shares) {
                    deleteShareReferences(share);
                    fileShareRepository.delete(share);
                }
            }
            fileMetadataRepository.delete(item);
        }
    }

    // ==============================================================
    // 10. CADUCADOS
    // ==============================================================

    @Transactional(readOnly = true)
    public List<ExpiredShareResponse> getExpiredShares() {
        User currentUser = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();

        List<FileShare> expiredShares = fileShareRepository
                .findBySharedWithAndExpiresAtBefore(currentUser, now);

        return expiredShares.stream()
                .map(this::mapToExpiredResponse)
                .collect(Collectors.toList());
    }

    // ==============================================================
    // MÉTODOS AUXILIARES DE MAPEO
    // ==============================================================

    private FavoriteResponse mapToFavoriteResponse(Favorite favorite) {
        if (favorite.getFileMetadata() != null) {
            FileMetadata f = favorite.getFileMetadata();
            boolean isFolder = Boolean.TRUE.equals(f.getIsFolder());

            return FavoriteResponse.builder()
                    .favoriteId(favorite.getId())
                    .itemId(f.getId())
                    .name(f.getFileName())
                    .type("PERSONAL")
                    .isFolder(isFolder)
                    .folderColor(isFolder ? f.getFolderColor() : null)  // ← AGREGAR COLOR
                    .fileType(isFolder ? "folder" : f.getFileType())
                    .fileSize(f.getFileSize())
                    .createdAt(f.getUploadedAt())
                    .favoritedAt(favorite.getFavoritedAt())
                    .sharedBy(null)
                    .securityLevel(isFolder ? "PUBLIC" : null)
                    .accessLevel(isFolder ? "DOWNLOAD" : null)
                    .isUnlocked(true)
                    .isExpired(false)
                    .parentFolderId(f.getParentFolder() != null ? f.getParentFolder().getId() : null)
                    .build();
        } else {
            FileShare s = favorite.getFileShare();
            FileMetadata f = s.getFile();
            boolean isExpired = s.getExpiresAt() != null && s.getExpiresAt().isBefore(LocalDateTime.now());
            boolean isUnlocked = s.getIsUnlocked() != null && s.getIsUnlocked() &&
                    s.getUnlockedUntil() != null && s.getUnlockedUntil().isAfter(LocalDateTime.now());

            return FavoriteResponse.builder()
                    .favoriteId(favorite.getId())
                    .itemId(s.getId())
                    .name(f.getFileName())
                    .type("SHARED")
                    .isFolder(false)
                    .folderColor(null)
                    .fileType(f.getFileType())
                    .fileSize(f.getFileSize())
                    .createdAt(s.getSharedAt())
                    .favoritedAt(favorite.getFavoritedAt())
                    .sharedBy(s.getSharedBy().getNombre() + " " + s.getSharedBy().getApellido())
                    .securityLevel(s.getSecurityLevel().toString())
                    .accessLevel(s.getAccessLevel().toString())
                    .isUnlocked(isUnlocked)
                    .isExpired(isExpired)
                    .build();
        }
    }

    private TrashItemResponse mapToTrashResponse(FileMetadata item) {
        LocalDateTime deletedAt = item.getDeletedAt() != null ? item.getDeletedAt() : LocalDateTime.now();
        LocalDateTime expiresAt = deletedAt.plusDays(7);
        long daysLeft = java.time.Duration.between(LocalDateTime.now(), expiresAt).toDays();
        daysLeft = Math.max(0, daysLeft);

        return TrashItemResponse.builder()
                .id(item.getId())
                .name(item.getFileName())
                .isFolder(item.getIsFolder())
                .folderColor(item.getFolderColor())
                .fileType(item.getFileType())
                .fileSize(item.getFileSize())
                .deletedAt(deletedAt)
                .expiresAt(expiresAt)
                .daysLeft(daysLeft)
                .build();
    }

    private ExpiredShareResponse mapToExpiredResponse(FileShare share) {
        return ExpiredShareResponse.builder()
                .shareId(share.getId())
                .fileName(share.getFile().getFileName())
                .fileType(share.getFile().getFileType())
                .fileSize(share.getFile().getFileSize())
                .sharedBy(share.getSharedBy().getNombre() + " " + share.getSharedBy().getApellido())
                .sharedAt(share.getSharedAt())
                .expiredAt(share.getExpiresAt())
                .accessLevel(share.getAccessLevel().toString())
                .securityLevel(share.getSecurityLevel().toString())
                .build();
    }

    // En StorageService.java, agrega este método:

    /**
     * Genera URL para vista previa de archivo personal (solo lectura)
     */
    @Transactional(readOnly = true)
    public String getPreviewUrl(String fileId) {
        User currentUser = getCurrentUser();

        FileMetadata file = fileMetadataRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        // Verificar que el usuario es el dueño
        if (!file.getUploadedBy().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No tienes acceso a este archivo");
        }

        // Verificar que el archivo no esté eliminado
        if (Boolean.TRUE.equals(file.getIsDeleted())) {
            throw new RuntimeException("El archivo está en la papelera");
        }

        // Si el archivo tiene seguridad, verificar que esté desbloqueado
        if (!file.getIsFolder()) {
            Optional<FileShare> share = fileShareRepository.findByFile_IdAndSharedWith(fileId, currentUser);
            if (share.isPresent() && share.get().getSecurityLevel() != SecurityLevel.PUBLIC) {
                boolean isUnlocked = share.get().getIsUnlocked() != null && share.get().getIsUnlocked() &&
                        share.get().getUnlockedUntil() != null && share.get().getUnlockedUntil().isAfter(LocalDateTime.now());

                if (!isUnlocked) {
                    throw new RuntimeException("El archivo está bloqueado. Desbloquéalo primero.");
                }
            }
        }

        // ✅ Pasar el fileType al método de Azure
        String fileType = file.getFileType();
        log.info("📄 FileType desde BD: {}", fileType);

        return azureBlobService.generatePreviewUrl(file.getBlobUrl(), 30, fileType);
    }

    /**
     * Descargar archivo personal como bytes (YA DESCIFRADO)
     */
    @Transactional
    public byte[] downloadPersonalFileBytes(String fileId) {
        User currentUser = getCurrentUser();
        FileShare share = getPersonalFileShare(fileId, currentUser);

        // Validar que esté desbloqueado si requiere seguridad
        if (share.getSecurityLevel() != SecurityLevel.PUBLIC) {
            boolean isUnlocked = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                    share.getUnlockedUntil() != null && share.getUnlockedUntil().isAfter(LocalDateTime.now());

            if (!isUnlocked) {
                throw new RuntimeException("Archivo bloqueado. Debes desbloquearlo primero");
            }
        }

        // Incrementar contador de descargas
        share.setDownloadCount(share.getDownloadCount() + 1);
        share.setLastDownloadedAt(LocalDateTime.now());
        fileShareRepository.save(share);

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

            log.info("Archivo personal descifrado exitosamente: {}", share.getFile().getFileName());

            return decryptedBytes;

        } catch (Exception e) {
            log.error("Error al descifrar archivo personal: {}", e.getMessage());
            throw new RuntimeException("Error al descargar el archivo: " + e.getMessage());
        }
    }

    /**
     * Obtener bytes descifrados de un archivo personal
     */
    @Transactional
    public byte[] getDecryptedFileBytes(String fileId) {
        User currentUser = getCurrentUser();
        FileShare share = getPersonalFileShare(fileId, currentUser);

        // Validar desbloqueo
        if (share.getSecurityLevel() != SecurityLevel.PUBLIC) {
            boolean isUnlocked = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                    share.getUnlockedUntil() != null && share.getUnlockedUntil().isAfter(LocalDateTime.now());

            if (!isUnlocked) {
                throw new RuntimeException("Archivo bloqueado. Debes desbloquearlo primero");
            }
        }

        try {
            // Descargar bytes cifrados
            byte[] encryptedBytes = azureBlobService.downloadEncryptedBytes(share.getFile().getBlobUrl());

            // Recuperar llave AES
            SecretKey aesKey = encryptionService.decryptAesKey(share.getFile().getEncryptedAesKey());

            // Obtener IV
            byte[] iv = Base64.getDecoder().decode(share.getFile().getIv());

            // Descifrar
            String encryptedBase64 = Base64.getEncoder().encodeToString(encryptedBytes);
            byte[] decryptedBytes = encryptionService.decrypt(encryptedBase64, aesKey, iv);

            log.info("✅ Archivo personal descifrado: {}, tamaño: {} bytes",
                    share.getFile().getFileName(), decryptedBytes.length);

            return decryptedBytes;

        } catch (Exception e) {
            log.error("❌ Error descifrando archivo personal: {}", e.getMessage());
            throw new RuntimeException("Error al descifrar el archivo: " + e.getMessage());
        }
    }
}