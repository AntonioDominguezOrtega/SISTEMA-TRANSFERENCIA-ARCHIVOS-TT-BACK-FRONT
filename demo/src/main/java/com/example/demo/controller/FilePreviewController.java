package com.example.demo.controller;

import com.example.demo.service.FilePreviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * CONTROLADOR DE VISTAS PREVIAS
 * Expone los endpoints para que el Frontend solicite miniaturas de imágenes,
 * fragmentos de texto o URLs firmadas temporales de PDFs.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/preview")
@RequiredArgsConstructor
public class FilePreviewController {

    private final FilePreviewService previewService;

    /**
     * Obtener vista previa de un archivo.
     * * @param shareId El ID de la transacción (FileShare)
     * @param token (Opcional) El token SMS o contraseña si el archivo requiere validación extra para previsualizar.
     * OJO: Esto asume que el usuario debe ingresar el token INCLUSO para ver la miniatura.
     */
    @GetMapping("/{shareId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getPreview(
            @PathVariable String shareId,
            @RequestParam(required = false) String token
    ){
        try {
            // Llama a tu servicio que descarga, descifra y recorta
            FilePreviewService.PreviewResponse preview =
                    previewService.getFilePreview(shareId, token);

            return ResponseEntity.ok(preview);

        } catch (Exception e) {
            // Si algo falla (ej. archivo no soportado o error de descifrado),
            // mandamos un objeto que el Frontend pueda interpretar fácilmente como error.
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "type", "error"
            ));
        }
    }

    /**
     * Streaming de video/audio (Para implementaciones futuras)
     * * @param shareId ID de la transacción
     * @param range La cabecera "Range" de HTTP (ej. "bytes=0-1024") que usan los reproductores de video HTML5.
     */
    @GetMapping("/stream/{shareId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> streamFile(
            @PathVariable String shareId,
            @RequestHeader(value = "Range", required = false) String range) {

        try {
            // Para implementar esto con archivos CIFRADOS, la lógica es muy compleja porque
            // el AES GCM requiere desencriptar el bloque entero para verificar la firma.
            // Una opción es dar un SAS Token de Azure que soporte el streaming nativo,
            // asumiendo que el archivo en Azure no estuviera cifrado por bloque entero.
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
