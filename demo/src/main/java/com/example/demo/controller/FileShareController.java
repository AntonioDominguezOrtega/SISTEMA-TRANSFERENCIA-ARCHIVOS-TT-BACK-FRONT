package com.example.demo.controller;

import com.example.demo.dto.FileShareResponse;
import com.example.demo.dto.FileUploadRequest;
import com.example.demo.model.FileShare;
import com.example.demo.service.FileShareService;
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
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileShareController {

    private final FileShareService fileShareService;

    // =========================================================================
    // 1. SUBIR ARCHIVOS (El corazón de la aplicación)
    // =========================================================================

    /**
     * Sube y comparte archivos.
     * CORRECCIÓN DE ARQUITECTURA: Se usa @RequestPart para separar los archivos binarios
     * de los datos en JSON. Esta es la única forma confiable de enviar ambos desde React.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> uploadAndShareFiles(
            @RequestPart("files") List<MultipartFile> files,  // Parte 1: Los binarios (PDF, imágenes)
            @Valid @RequestPart("request")FileUploadRequest request  // Parte 2: El JSON con los destinatarios y permisos
    ) {
        try {
            // Unimos los archivos al request antes de mandarlos al servicio
            request.setFiles(files);

            List<FileShareResponse> responses = fileShareService.uploadAndShareFiles(request);

            return ResponseEntity.ok(Map.of(
               "message", "Archivo compartido exitosamente",
                    "files", responses
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================================================
    // 2. BANDEJAS (Inbox y Sent)
    // =========================================================================

    /**
     * Obtener archivos que ME HAN ENVIADO (Bandeja de entrada)
     * Paginado para que no cargue miles de registros de golpe.
     */
    @GetMapping("/received")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getReceivedFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        try {
            List<FileShareResponse> files = fileShareService.getReceivedFiles(page, size);
            return ResponseEntity.ok(Map.of(
                    "files", files,
                    "count", files.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener archivos que YO HE ENVIADO (Bandeja de salida)
     */
    @GetMapping("/sent")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getSentFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        try {
            List<FileShareResponse> files = fileShareService.getSentFiles(page, size);
            return ResponseEntity.ok(Map.of(
                    "files", files,
                    "count", files.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================================================
    // 3. FLUJO DE SEGURIDAD (TOKEN SMS)
    // =========================================================================

    /**
     * Solicitar token SMS para desbloquear archivo.
     * Genera el token, lo guarda 5 mins y lo envía a Twilio.
     */
    @PostMapping("/{shareId}/request-token")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> requestSmsToken(@PathVariable String shareId) {
        try {
            String message = fileShareService.requestSmsToken(shareId);
            return ResponseEntity.ok(Map.of(
                    "message", message,
                    "shareId", shareId
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verificar token SMS ingresado por el usuario.
     * Si es correcto, otorga una "ventana" de 24 horas de acceso.
     */
    @PostMapping("/{shareId}/verify-token")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> verifySmsToken(
            @PathVariable String shareId,
            @RequestBody Map<String, String> request
    ) {
        try {
            String token = request.get("token");
            FileShareResponse response = fileShareService.verifySmsToken(shareId, token);
            return ResponseEntity.ok(Map.of(
                    "message", "Archivo desbloqueado exitosamente",
                    "file", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================================================
    // 4. ACCIONES SOBRE EL ARCHIVO (Ver y Descargar)
    // =========================================================================

    /**
     * Ver archivo (solo lectura en pantalla).
     * Incrementa contador de vistas y notifica al dueño (si lo configuró).
     */
    @GetMapping("/{shareId}/view")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> viewFile(@PathVariable String shareId) {
        try {
            FileShareResponse response = fileShareService.viewFile(shareId);
            return ResponseEntity.ok(Map.of(
                    "file", response,
                    "message", "Acceso restringido"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Descargar archivo (físico a la computadora).
     * Retorna el Link mágico de Azure para que React dispare la descarga.
     */
    /**
     * Descargar archivo (físico a la computadora).
     */
    @GetMapping("/{shareId}/download")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> downloadFile(@PathVariable String shareId) {
        try {
            byte[] fileBytes = fileShareService.downloadFile(shareId);
            FileShareResponse share = fileShareService.getFileDetails(shareId);

            String contentType = share.getFileType();
            if (contentType == null || contentType.isEmpty()) {
                contentType = "application/octet-stream";
            }

            // ODIFICAR EL NOMBRE DEL ARCHIVO PARA CABECERAS HTTP
            String fileName = share.getFileName();
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");

            log.info("📥 Descargando archivo: {}, tamaño: {} bytes, tipo: {}",
                    fileName, fileBytes.length, contentType);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                    .header("Content-Type", contentType)
                    .header("Content-Length", String.valueOf(fileBytes.length))
                    .body(fileBytes);

        } catch (Exception e) {
            log.error("Error en descarga: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener detalle de un archivo específico sin alterar contadores.
     * Útil para cuando abres el modal y quieres ver la metadata del archivo.
     */
    @GetMapping("/{shareId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getFileDetails(@PathVariable String shareId) {
        try {
            FileShareResponse response = fileShareService.getFileDetails(shareId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * VERIFICAR CONTRASEÑA PARA DESBLOQUEAR ARCHIVO
     * Endpoint: POST /api/files/{shareId}/verify-password
     * Body: { "password": "miContraseña123" }
     */
    @PostMapping("/{shareId}/verify-password")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> verifyPassword(
            @PathVariable String shareId,
            @RequestBody Map<String, String> request
    ) {
        try {
            String password = request.get("password");
            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "La contraseña es obligatoria"));
            }

            FileShareResponse response = fileShareService.verifyPassword(shareId, password);

            return ResponseEntity.ok(Map.of(
                    "message", "Archivo desbloqueado exitosamente por 24 horas",
                    "file", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener URL para vista previa de archivo compartido (solo lectura)
     */
    @GetMapping("/{shareId}/preview")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getPreviewUrl(@PathVariable String shareId) {
        try {
            FileShareResponse share = fileShareService.getFileDetails(shareId);
            String fileType = share.getFileType();

            log.info("📄 Tipo de archivo detectado: {}", fileType);
            log.info("📄 Nombre del archivo: {}", share.getFileName());

            // ✅ PARA TODOS LOS TIPOS de archivo, devolver bytes descifrados
            byte[] decryptedBytes = fileShareService.getDecryptedFileForPreview(shareId);

            String fileName = share.getFileName();
            String encodedFileName = URLEncoder.encode(fileName, StandardCharsets.UTF_8)
                    .replaceAll("\\+", "%20");

            // Determinar Content-Type según el tipo de archivo
            String contentType = determineContentType(fileType, fileName);

            log.info("✅ Bytes descifrados obtenidos, tamaño: {} bytes, tipo: {}", decryptedBytes.length, contentType);

            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "inline; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName)
                    .header("Content-Length", String.valueOf(decryptedBytes.length))
                    .body(decryptedBytes);

        } catch (Exception e) {
            log.error("❌ Error en preview: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Método auxiliar para determinar Content-Type
    private String determineContentType(String fileType, String fileName) {
        if (fileType != null && !fileType.isEmpty()) {
            return fileType;
        }

        // Fallback por extensión
        String lowerFileName = fileName.toLowerCase();
        if (lowerFileName.endsWith(".png")) return "image/png";
        if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) return "image/jpeg";
        if (lowerFileName.endsWith(".gif")) return "image/gif";
        if (lowerFileName.endsWith(".mp4")) return "video/mp4";
        if (lowerFileName.endsWith(".pdf")) return "application/pdf";
        if (lowerFileName.endsWith(".txt")) return "text/plain";

        return "application/octet-stream";
    }
}
