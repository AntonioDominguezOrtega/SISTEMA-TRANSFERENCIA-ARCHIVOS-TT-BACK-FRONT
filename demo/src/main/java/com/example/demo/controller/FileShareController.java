package com.example.demo.controller;

import com.example.demo.dto.FileShareResponse;
import com.example.demo.dto.FileUploadRequest;
import com.example.demo.dto.ShareExistingFileRequest;
import com.example.demo.service.FileShareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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
     * Sube y comparte archivos NUEVOS.
     * Usa @RequestPart para separar los archivos binarios de los datos en JSON.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> uploadAndShareFiles(
            @RequestPart("files") List<MultipartFile> files,  
            @Valid @RequestPart("request") FileUploadRequest request  
    ) {
        try {
            // Unimos los archivos al request antes de mandarlos al servicio
            request.setFiles(files);
            List<FileShareResponse> responses = fileShareService.uploadAndShareFiles(request);

            return ResponseEntity.ok(Map.of(
                    "message", "Archivo cifrado y compartido exitosamente",
                    "files", responses
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // =========================================================================
    // 1.5. COMPARTIR ARCHIVOS EXISTENTES (Archivos de la Nube)
    // =========================================================================

    /**
     * Comparte archivos que el usuario ya había subido a Azure previamente.
     * Como no hay binarios nuevos, solo recibimos el JSON normal.
     */
    @PostMapping(value = "/share-existing", consumes = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> shareExistingFiles(
            @Valid @RequestBody ShareExistingFileRequest request
    ) {
        try {
            List<FileShareResponse> responses = fileShareService.shareExistingFiles(request);

            return ResponseEntity.ok(Map.of(
                    "message", "Archivos de la nube compartidos exitosamente",
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
    // 3. FLUJO DE SEGURIDAD (TOKEN SMS) Y CONTRASEÑA
    // =========================================================================

    /**
     * Solicitar token SMS para desbloquear archivo.
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

    /**
     * Verificar contraseña para desbloquear archivo.
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
     */
    @GetMapping("/{shareId}/view")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> viewFile(@PathVariable String shareId) {
        try {
            FileShareResponse response = fileShareService.viewFile(shareId);
            return ResponseEntity.ok(Map.of(
                    "file", response,
                    "message", "Acceso registrado"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Descargar archivo (físico a la computadora).
     */
    @GetMapping("/{shareId}/download")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> downloadFile(@PathVariable String shareId) {
        try {
            String downloadUrl = fileShareService.downloadFile(shareId);
            return ResponseEntity.ok(Map.of(
                    "downloadUrl", downloadUrl,
                    "message", "URL de descarga generada (válida por 1 hora)"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener detalle de un archivo específico sin alterar contadores.
     */
    @GetMapping("/{shareId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getFileDetails(@PathVariable String shareId) {
        try {
            return ResponseEntity.ok(Map.of("shareId", shareId)); // Temporal hasta crear el servicio real
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}