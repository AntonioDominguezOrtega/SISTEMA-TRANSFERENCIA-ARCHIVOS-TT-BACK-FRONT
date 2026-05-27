package com.example.demo.controller;

import com.example.demo.dto.FileShareResponse;
import com.example.demo.dto.FileUploadRequest;
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
    @GetMapping("/{shareId}/download")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> downloadFile(@PathVariable String shareId) {
        try {
            String downloadUrl = fileShareService.downloadFile(shareId);
            return ResponseEntity.ok(Map.of(
                    "downloadUrl", downloadUrl,
                    "message", "URL de descarga generada (valida por 1 hora)"
            ));
        } catch (Exception e) {
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

    // En FileShareController.java, agrega este método:

    /**
     * Obtener URL para vista previa de archivo compartido (solo lectura)
     */
    @GetMapping("/{shareId}/preview")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getPreviewUrl(@PathVariable String shareId) {
        try {
            String previewUrl = fileShareService.getPreviewUrl(shareId);
            return ResponseEntity.ok(Map.of("previewUrl", previewUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
