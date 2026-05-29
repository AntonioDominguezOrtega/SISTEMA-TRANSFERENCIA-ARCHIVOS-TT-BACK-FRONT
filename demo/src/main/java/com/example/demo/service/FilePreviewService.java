package com.example.demo.service;

import com.example.demo.model.FileMetadata;
import com.example.demo.model.FileShare;
import com.example.demo.model.SecurityLevel;
import com.example.demo.repository.FileShareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Base64;

/**
 * SERVICIO DE VISTA PREVIA (PREVIEW)
 * Descarga el archivo cifrado temporalmente de Azure, lo descifra en la memoria RAM,
 * lo adapta (redimensiona imágenes o recorta textos) y lo envía al Frontend.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FilePreviewService {

    private final AzureBlobService azureBlobService;
    private final FileShareRepository fileShareRepository;
    private final EncryptionService encryptionService;

    private static final int PREVIEW_WIDTH = 800; // Ancho máximo para imágenes

    /**
     * Obtener vista previa de un archivo
     */
    public PreviewResponse getFilePreview(String shareId, String token) {
        FileShare share = fileShareRepository.findById(shareId)
                .orElseThrow(() -> new RuntimeException("Archivo no encontrado"));

        // Validar acceso (Expiración y bloqueos)
        validatePreviewAccess(share, token);

        FileMetadata file = share.getFile();
        String fileType = file.getFileType().toLowerCase();

        // Determinar tipo de vista previa basado en el MIME type
        if (fileType.startsWith("image/")) {
            return getImagePreview(file);
        } else if (fileType.equals("application/pdf")) {
            return getPdfPreview(file);
        } else if (fileType.startsWith("text/")) {
            return getTextPreview(file);
        } else {
            return getGenericPreview(file);
        }
    }

    /**
     * Vista previa para IMÁGENES
     * Descifra la imagen, le baja la resolución a 800px y la manda en Base64 para que React la pinte directo.
     */
    private PreviewResponse getImagePreview(FileMetadata file) {
        try {
            // Descargar archivo cifrado de Azure
            InputStream encryptedStream = azureBlobService.downloadFile(file.getBlobUrl());

            // Descifrar con AES en memoria
            byte[] decryptedData = decryptFile(encryptedStream, file);

            // Crear imagen redimensionada para vista previa
            BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(decryptedData));
            BufferedImage previewImage = resizeImage(originalImage, PREVIEW_WIDTH);

            // Convertir a Base64 para enviar al frontend (<img src="data:image/jpeg;base64,...">)
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(previewImage, "jpg", baos);
            String base64Image = Base64.getEncoder().encodeToString(baos.toByteArray());

            return PreviewResponse.builder()
                    .type("image")
                    .content("data:image/jpeg;base64," + base64Image)
                    .fileName(file.getFileName())
                    .fileSize(file.getFileSize())
                    .build();
        } catch (Exception e) {
            log.error("Error generado preview de imagen: {}", e.getMessage());
            return getErrorPreview("No se puede generar la vista previa de la imagen");
        }
    }

    /**
     * Vista previa para PDF
     * No lo descargamos, solo generamos un SAS Token rápido de 30 mins para que el Frontend use PDF.js
     */
    private PreviewResponse getPdfPreview(FileMetadata file) {
        try {
            String sasToken = azureBlobService.generateSasToken(file.getBlobUrl(), 30);
            String pdfUrl = file.getBlobUrl() + "?" + sasToken;

            return PreviewResponse.builder()
                    .type("pdf")
                    .content(pdfUrl)
                    .fileName(file.getFileName())
                    .fileSize(file.getFileSize())
                    .build();
        } catch (Exception e) {
            log.error("Error generando preview de PDF: {}", e.getMessage());
            return getErrorPreview("No pudo generar la vista previa del PDF");
        }
    }

    /**
     * Vista previa para TEXTO (.txt, .csv)
     * Lee solo las primeras 50 líneas para no ahogar al navegador.
     */
    private PreviewResponse getTextPreview(FileMetadata file) {
        try {
            InputStream encryptedStream = azureBlobService.downloadFile(file.getBlobUrl());
            byte[] decryptedData = decryptFile(encryptedStream, file);

            String content = new String(decryptedData);
            String[] lines = content.split("\n");
            StringBuilder preview = new StringBuilder();

            int maxLines = Math.min(50, lines.length);
            for (int i = 0; i <= maxLines; i++) {
                preview.append(lines[i]).append("\n");
            }

            if (lines.length > 50) {
                preview.append("...\n(Archivo truncado, descarga para ver completo)");
            }

            return PreviewResponse.builder()
                    .type("text")
                    .content(preview.toString())
                    .fileName(file.getFileName())
                    .fileSize(file.getFileSize())
                    .build();
        } catch (Exception e) {
            log.error("Error generando preview de texto: {}", e.getMessage());
            return getErrorPreview("No se pudo generar la vista previa del texto");
        }
    }

    /**
     * Archivos no soportados (.zip, .exe, etc)
     */
    private PreviewResponse getGenericPreview(FileMetadata file) {
        return PreviewResponse.builder()
                .type("generic")
                .fileName(file.getFileName())
                .fileSize(file.getFileSize())
                .fileType(file.getFileType())
                .build();
    }


    private PreviewResponse getErrorPreview(String errorMessage) {
        return PreviewResponse.builder()
                .type("error")
                .message(errorMessage)
                .build();
    }

    private void validatePreviewAccess(FileShare share, String token) {
        if (!share.getIsActive()) {
            throw new RuntimeException("El archivo ya no esta disponible");
        }

        if (share.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new RuntimeException("El archivo ha expirado");
        }

        if (share.getSecurityLevel() == SecurityLevel.TOKEN_SMS) {
            if (!share.getIsUnlocked() ||
                share.getUnlockedUntil().isBefore(java.time.LocalDateTime.now())) {
                throw new RuntimeException("El archivo esta bloqueado. Solicita un token SMS");
            }
        }
    }

    /**
     * MÉTODOS DE APOYO: Descifrado en memoria
     */
    private byte[] decryptFile(InputStream encryptedStream, FileMetadata file) throws Exception {
        // Recuperar y descifrar la llave AES específica de este archivo
        SecretKey aesKey = encryptionService.decryptAesKey(file.getEncryptedAesKey());
        byte[] iv = Base64.getDecoder().decode(file.getIv());

        // Leer los datos cifrados crudos
        byte[] encryptedDataBytes = encryptedStream.readAllBytes();

        // Convertimos los bytes crudos a Base64 String
        // porque tu EncryptionService.decrypt() espera un String en Base64.
        String encryptedDataBase64 = Base64.getEncoder().encodeToString(encryptedDataBytes);

        return encryptionService.decrypt(encryptedDataBase64, aesKey, iv);
    }

    /**
     * MÉTODOS DE APOYO: Redimensionar imagen
     */
    private BufferedImage resizeImage(BufferedImage originalImage, int targetWidth) {
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Mantener la proporción (aspect ratio)
        int targetHeight = (int) ((double) targetWidth / originalWidth * originalHeight);

        java.awt.Image resultingImage = originalImage.getScaledInstance(
                targetWidth, targetHeight, Image.SCALE_SMOOTH);

        BufferedImage outputImage = new BufferedImage(
                targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);

        outputImage.getGraphics().drawImage(resultingImage, 0, 0, null);

        return outputImage;
    }

    /**
     * DTO de respuesta interno
     */
    @lombok.Builder
    @lombok.Data
    public static class PreviewResponse {
        private String type;
        private String content;
        private String fileName;
        private Long fileSize;
        private String fileType;
        private String message;
    }
}


