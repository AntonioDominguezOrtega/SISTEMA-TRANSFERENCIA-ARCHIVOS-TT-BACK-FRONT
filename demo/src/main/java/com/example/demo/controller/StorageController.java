package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.service.FileShareService;
import com.example.demo.service.StorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/storage")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class StorageController {

    private final StorageService storageService;
    private final FileShareService fileShareService;

    // ==============================================================
    // 1. GESTIÓN DE CARPETAS
    // ==============================================================

    /**
     * Crear una nueva carpeta
     */
    @PostMapping("/folder")
    public ResponseEntity<?> createFolder(@Valid @RequestBody CreateFolderRequest request) {
        try {
            StorageItemResponse folder = storageService.createFolder(request);
            return ResponseEntity.ok(Map.of(
                    "message", "Carpeta creada exitosamente",
                    "folder", folder
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener contenido de una carpeta (archivos y subcarpetas)
     * Si no se pasa folderId, obtiene la raíz del usuario
     */
    @GetMapping("/folder/{folderId}")
    public ResponseEntity<?> getFolderContents(@PathVariable(required = false) String folderId) {
        try {
            List<StorageItemResponse> contents = storageService.getFolderContents(folderId);
            return ResponseEntity.ok(Map.of(
                    "contents", contents,
                    "folderId", folderId != null ? folderId : "root"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener la carpeta raíz del usuario (endpoint alternativo)
     */
    @GetMapping("/root")
    public ResponseEntity<?> getRootFolder() {
        try {
            List<StorageItemResponse> contents = storageService.getRootContents();
            return ResponseEntity.ok(Map.of(
                    "contents", contents,
                    "folderId", "root"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==============================================================
    // 2. SUBIR ARCHIVOS PERSONALES
    // ==============================================================

    /**
     * Subir archivo a la cuenta personal (tipo Google Drive)
     * El archivo se cifra AES-256 y se guarda en Azure
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPersonalFile(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "parentFolderId", required = false) String parentFolderId,
            @RequestParam("securityLevel") String securityLevel,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "confirmPassword", required = false) String confirmPassword,
            @RequestParam(value = "useAccountPhone", defaultValue = "true") Boolean useAccountPhone,
            @RequestParam(value = "customPhoneNumber", required = false) String customPhoneNumber
    ) {
        try {
            // Construir el request DTO
            PersonalFileUploadRequest request = new PersonalFileUploadRequest();
            request.setFile(file);
            request.setParentFolderId(parentFolderId);
            request.setSecurityLevel(com.example.demo.model.SecurityLevel.valueOf(securityLevel));
            request.setPassword(password);
            request.setConfirmPassword(confirmPassword);
            request.setUseAccountPhone(useAccountPhone);
            request.setCustomPhoneNumber(customPhoneNumber);

            StorageItemResponse response = storageService.uploadPersonalFile(request);

            return ResponseEntity.ok(Map.of(
                    "message", "Archivo subido exitosamente",
                    "file", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==============================================================
    // 3. MOVER Y ELIMINAR
    // ==============================================================

    /**
     * Mover archivo o carpeta a otra ubicación
     */
    @PostMapping("/move")
    public ResponseEntity<?> moveItem(@Valid @RequestBody MoveFileRequest request) {
        try {
            StorageItemResponse moved = storageService.moveItem(request.getFileId(), request.getTargetFolderId());
            return ResponseEntity.ok(Map.of(
                    "message", "Elemento movido exitosamente",
                    "item", moved
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Eliminar archivo o carpeta (mover a papelera)
     */
    @DeleteMapping("/{itemId}")
    public ResponseEntity<?> deleteItem(@PathVariable String itemId) {
        try {
            storageService.deleteItem(itemId);
            return ResponseEntity.ok(Map.of(
                    "message", "Elemento movido a la papelera"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Restaurar desde papelera
     */
    @PostMapping("/{itemId}/restore")
    public ResponseEntity<?> restoreItem(@PathVariable String itemId) {
        try {
            storageService.restoreItem(itemId);
            return ResponseEntity.ok(Map.of(
                    "message", "Elemento restaurado exitosamente"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Eliminar permanentemente (vaciar papelera)
     */
    @DeleteMapping("/{itemId}/permanent")
    public ResponseEntity<?> permanentDelete(@PathVariable String itemId) {
        try {
            storageService.permanentDelete(itemId);
            return ResponseEntity.ok(Map.of(
                    "message", "Elemento eliminado permanentemente"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==============================================================
    // 4. ACCESO A ARCHIVOS PERSONALES
    // ==============================================================

    /**
     * Obtener información de un archivo personal
     */
    @GetMapping("/{itemId}")
    public ResponseEntity<?> getItemInfo(@PathVariable String itemId) {
        try {
            StorageItemResponse item = storageService.getItemInfo(itemId);
            return ResponseEntity.ok(item);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Solicitar token SMS para desbloquear archivo personal
     */
    @PostMapping("/{fileId}/request-token")
    public ResponseEntity<?> requestPersonalFileToken(@PathVariable String fileId) {
        try {
            String message = storageService.requestPersonalFileToken(fileId);
            return ResponseEntity.ok(Map.of(
                    "message", message,
                    "fileId", fileId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verificar token SMS para desbloquear archivo personal
     */
    @PostMapping("/{fileId}/verify-token")
    public ResponseEntity<?> verifyPersonalFileToken(
            @PathVariable String fileId,
            @RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            StorageItemResponse response = storageService.verifyPersonalFileToken(fileId, token);
            return ResponseEntity.ok(Map.of(
                    "message", "Archivo desbloqueado exitosamente por 24 horas",
                    "file", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verificar contraseña para desbloquear archivo personal
     */
    @PostMapping("/{fileId}/verify-password")
    public ResponseEntity<?> verifyPersonalFilePassword(
            @PathVariable String fileId,
            @RequestBody Map<String, String> request) {
        try {
            String password = request.get("password");
            StorageItemResponse response = storageService.verifyPersonalFilePassword(fileId, password);
            return ResponseEntity.ok(Map.of(
                    "message", "Archivo desbloqueado exitosamente por 24 horas",
                    "file", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Abrir/Ver archivo personal (incrementa contador de vistas)
     */
    @GetMapping("/{fileId}/open")
    public ResponseEntity<?> openPersonalFile(@PathVariable String fileId) {
        try {
            StorageItemResponse response = storageService.openPersonalFile(fileId);
            return ResponseEntity.ok(Map.of(
                    "file", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Descargar archivo personal (genera SAS token)
     */
    @GetMapping("/{fileId}/download")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> downloadPersonalFile(@PathVariable String fileId) {
        try {
            // Usar el nuevo método que devuelve bytes descifrados
            byte[] fileBytes = storageService.downloadPersonalFileBytes(fileId);
            StorageItemResponse item = storageService.getItemInfo(fileId);

            String contentType = item.getFileType();
            if (contentType == null || contentType.isEmpty()) {
                contentType = "application/octet-stream";
            }

            // Codificar el nombre del archivo
            String fileName = item.getName();
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");

            log.info("Descargando archivo personal: {}, tamaño: {} bytes", fileName, fileBytes.length);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                    .header("Content-Type", contentType)
                    .header("Content-Length", String.valueOf(fileBytes.length))
                    .body(fileBytes);

        } catch (Exception e) {
            log.error("Error en descarga personal: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==============================================================
// 5. COMPARTIR ARCHIVOS DESDE ALMACENAMIENTO PERSONAL (FASE 2)
// ==============================================================

    /**
     * Compartir un archivo existente con otros usuarios
     * El archivo ya está en el almacenamiento personal, solo creamos los permisos
     */
    @PostMapping("/share")
    public ResponseEntity<?> shareExistingFile(@Valid @RequestBody ShareExistingFileRequest request) {
        try {
            List<FileShareResponse> responses = storageService.shareExistingFile(request);
            return ResponseEntity.ok(Map.of(
                    "message", "Archivo compartido exitosamente",
                    "shares", responses
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener todos los archivos disponibles para compartir
     * (Excluye carpetas y archivos que ya están en papelera)
     */
    @GetMapping("/shareable")
    public ResponseEntity<?> getShareableFiles() {
        try {
            List<StorageItemResponse> files = storageService.getShareableFiles();
            return ResponseEntity.ok(Map.of(
                    "files", files
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==============================================================
// 6. FAVORITOS
// ==============================================================

    @PostMapping("/favorite/{itemId}")
    public ResponseEntity<?> addFavorite(@PathVariable String itemId, @RequestParam String type) {
        try {
            FavoriteResponse favorite = storageService.addFavorite(itemId, type);
            return ResponseEntity.ok(Map.of(
                    "message", "Agregado a favoritos",
                    "favorite", favorite
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/favorite/{favoriteId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Long favoriteId) {
        try {
            storageService.removeFavorite(favoriteId);
            return ResponseEntity.ok(Map.of("message", "Eliminado de favoritos"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/favorites")
    public ResponseEntity<?> getFavorites() {
        try {
            List<FavoriteResponse> favorites = storageService.getFavorites();
            return ResponseEntity.ok(Map.of("favorites", favorites));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

// ==============================================================
// 7. RECIENTES
// ==============================================================

    @GetMapping("/recent/personal")
    public ResponseEntity<?> getRecentPersonalFiles(@RequestParam(defaultValue = "3") int days) {
        try {
            List<StorageItemResponse> files = storageService.getRecentPersonalFiles(days);
            return ResponseEntity.ok(Map.of("files", files));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/recent/shared")
    public ResponseEntity<?> getRecentSharedFiles(@RequestParam(defaultValue = "3") int days) {
        try {
            List<FileShareResponse> files = storageService.getRecentSharedFiles(days);
            return ResponseEntity.ok(Map.of("files", files));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

// ==============================================================
// 8. COMPARTIDOS (CONMIGO / POR MÍ)
// ==============================================================

    @GetMapping("/shared-with-me")
    public ResponseEntity<?> getSharedWithMe(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        try {
            // Reutilizamos el método existente de FileShareService
            List<FileShareResponse> files = fileShareService.getReceivedFiles(page, size);
            return ResponseEntity.ok(Map.of("files", files, "count", files.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/shared-by-me")
    public ResponseEntity<?> getSharedByMe(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        try {
            // Reutilizamos el método existente de FileShareService
            List<FileShareResponse> files = fileShareService.getSentFiles(page, size);
            return ResponseEntity.ok(Map.of("files", files, "count", files.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

// ==============================================================
// 9. PAPELERA (Eliminados)
// ==============================================================

    @GetMapping("/trash")
    public ResponseEntity<?> getTrash() {
        try {
            List<TrashItemResponse> trash = storageService.getTrashItems();
            return ResponseEntity.ok(Map.of("trash", trash));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/trash/empty")
    public ResponseEntity<?> emptyTrash() {
        try {
            int count = storageService.emptyTrash();
            return ResponseEntity.ok(Map.of(
                    "message", "Papelera vaciada exitosamente",
                    "deletedCount", count
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

// ==============================================================
// 10. CADUCADOS (Archivos compartidos que expiraron)
// ==============================================================

    @GetMapping("/expired")
    public ResponseEntity<?> getExpiredShares() {
        try {
            List<ExpiredShareResponse> expired = storageService.getExpiredShares();
            return ResponseEntity.ok(Map.of("expired", expired));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener URL para vista previa (solo lectura, sin permisos de descarga)
     */
    @GetMapping("/{fileId}/preview")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getPreviewUrl(@PathVariable String fileId) {
        try {
            StorageItemResponse item = storageService.getItemInfo(fileId);
            String fileType = item.getFileType();

            log.info("📄 Archivo personal - Tipo: {}, Nombre: {}", fileType, item.getName());

            // ✅ Para TODOS los tipos, devolver bytes descifrados
            byte[] decryptedBytes = storageService.getDecryptedFileBytes(fileId);

            String fileName = item.getName();
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");

            String contentType = determineContentType(fileType, fileName);

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "inline; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                    .header("Content-Length", String.valueOf(decryptedBytes.length))
                    .body(decryptedBytes);

        } catch (Exception e) {
            log.error("❌ Error en preview personal: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Determina el Content-Type basado en el tipo de archivo o extensión
     */
    private String determineContentType(String fileType, String fileName) {
        // Si tenemos el fileType de la BD, usarlo
        if (fileType != null && !fileType.isEmpty() && !"application/octet-stream".equals(fileType)) {
            return fileType;
        }

        // Fallback: detectar por extensión
        String lowerFileName = fileName.toLowerCase();
        if (lowerFileName.endsWith(".png")) return "image/png";
        if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) return "image/jpeg";
        if (lowerFileName.endsWith(".gif")) return "image/gif";
        if (lowerFileName.endsWith(".webp")) return "image/webp";
        if (lowerFileName.endsWith(".mp4")) return "video/mp4";
        if (lowerFileName.endsWith(".webm")) return "video/webm";
        if (lowerFileName.endsWith(".pdf")) return "application/pdf";
        if (lowerFileName.endsWith(".txt")) return "text/plain";
        if (lowerFileName.endsWith(".json")) return "application/json";
        if (lowerFileName.endsWith(".csv")) return "text/csv";

        return "application/octet-stream";
    }
}