package com.example.demo.service;

import com.azure.core.http.rest.PagedIterable;
import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.models.BlobItem;
import com.azure.storage.blob.models.BlobStorageException;
import com.azure.storage.blob.sas.BlobSasPermission;
import com.azure.storage.blob.sas.BlobServiceSasSignatureValues;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * SERVICIO DE ALMACENAMIENTO EN AZURE
 * Se encarga exclusivamente de mover bytes entre tu servidor y la nube de Microsoft.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AzureBlobService {

    private final BlobContainerClient blobContainerClient;
    private final EncryptionService encryptionService;

    /**
     * Sube un archivo a Azure Blob Storage.
     * @param file Archivo a subir
     * @param encryptedAesKey (No se usa en este método directamente, pero está en la firma)
     * @param iv (No se usa directamente aquí)
     * @return URL pública del blob en Azure (que bloquearemos por defecto)
     */
    public String uploadEncryptedFile(MultipartFile file, String encryptedAesKey, byte[] iv) throws IOException {
        String blobName = generateBlobName(file.getOriginalFilename());
        BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

        // Se asume que el archivo ya viene cifrado (o se sube crudo y luego la app gestiona las llaves)
        try (InputStream inputStream = file.getInputStream()) {
            blobClient.upload(inputStream, file.getSize(), true);
        } catch (BlobStorageException e) {
            log.error("Error al subir archivo a Azure {}", e.getMessage());
            throw new RuntimeException("Errror al subir archivo", e);
        }

        log.info("Archivo subido exitosamente: {}", blobName);
        return blobClient.getBlobUrl();
    }

    /**
     * Sube múltiples archivos organizados en una "carpeta virtual" en Azure.
     */
    public List<String> uploadFolder(List<MultipartFile> files, String folderPath) {
        List<String> urls = new ArrayList<>();

        for (MultipartFile file : files) {
            String blobName = folderPath + "/" + generateBlobName(file.getOriginalFilename());
            BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

            try (InputStream inputStream = file.getInputStream()) {
                blobClient.upload(inputStream, file.getSize(), true);
                urls.add(blobClient.getBlobUrl());
            } catch (Exception e) {
                log.error("Error al subir el archivo {}: {}", file.getOriginalFilename(), e.getMessage());
                throw new RuntimeException("Error de subir carpeta", e);
            }
        }

        return urls;
    }

    /**
     * Descarga un archivo directamente desde Azure a la memoria RAM de tu servidor.
     * Útil si necesitas descifrarlo en el backend antes de enviarlo.
     */
    public InputStream downloadFile(String blobUrl) {
        String blobName = extractBlobNameFromUrl(blobUrl);
        BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        blobClient.downloadStream(outputStream); // Corrección: downloadStream es la forma recomendada en SDK v12

        return new ByteArrayInputStream(outputStream.toByteArray());
    }

    /**
     * FIRMA DE SEGURIDAD (SAS TOKEN) - LA JOYA DE LA CORONA
     * En lugar de descargar el archivo a tu servidor, le das a React una URL mágica
     * que le permite descargar el archivo directamente desde los servidores de Microsoft,
     * pero la URL se autodestruye en los minutos que le digas.
     */
    public String generateSasToken(String blobUrl, int expirationMinutes) {
        String blobName = extractBlobNameFromUrl(blobUrl);
        BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

        // Solo damos permiso de lectura (descargar/ver)
        BlobSasPermission permission = new BlobSasPermission()
                .setReadPermission(true);

        // Configurar expiración
        OffsetDateTime expiryTime = OffsetDateTime.now().plusMinutes(expirationMinutes);

        BlobServiceSasSignatureValues sasValues = new BlobServiceSasSignatureValues(expiryTime, permission)
                .setStartTime(OffsetDateTime.now()); // Buena práctica de seguridad

        // Genera la firma (?sv=2021-08-06&se=...&sp=r)
        String sasToken = blobClient.generateSas(sasValues);

        // Retorna la URL completa con el token de acceso pegado al final
        return blobClient.getBlobUrl() + "?" + sasToken;
    }

    /**
     * Elimina un archivo permanentemente de la nube.
     */
     public void delateFile(String blobUrl) {
         String blobName = extractBlobNameFromUrl(blobUrl);
         BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

         blobClient.delete();
         log.info("Archivo eliminado: {}", blobName);
     }

    /**
     * Lista todos los archivos que pertenecen a un "folderPath" virtual en Azure.
     */
    public List<String> listFilesInFolder(String folderPath) {
        List<String> files = new ArrayList<>();
        PagedIterable<BlobItem> blobs = blobContainerClient.listBlobs();

        for (BlobItem blob : blobs) {
            if (blob.getName().startsWith(folderPath + "/")) {
                files.add(blob.getName());
            }
        }

        return files;
    }
    // --- MÉTODOS AUXILIARES ---

    private String generateBlobName(String originalFilename) {
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        // Nombre aleatorio para evitar conflictos si 2 usuarios suben "documento.pdf"
        return UUID.randomUUID() + extension;
    }

    /**
     * Extrae el nombre del blob desde la URL completa
     * Maneja URLs con SAS tokens y espacios codificados
     */
    public String extractBlobNameFromUrl(String blobUrl) {
        String baseUrl = blobContainerClient.getBlobContainerUrl() + "/";
        String withoutBase = blobUrl.replace(baseUrl, "");

        // Remover parámetros de consulta (ej. ?sv=2021-08-06&se=...)
        int queryIndex = withoutBase.indexOf('?');
        if (queryIndex != -1) {
            withoutBase = withoutBase.substring(0, queryIndex);
        }

        // Decodificar espacios (Azure los codifica como %20)
        withoutBase = withoutBase.replace("%20", " ");

        return withoutBase;
    }

    /**
     * Subir foto de perfil a Azure Blob Storage
     */
    public String uploadProfilePhoto(MultipartFile photo, String blobName) throws IOException {
        BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

        try (InputStream inputStream = photo.getInputStream()) {
            blobClient.upload(inputStream, photo.getSize(), true);
        } catch (BlobStorageException e) {
            log.error("Error al subir foto de perfil a Azure: {}", e.getMessage());
            throw new RuntimeException("Error al subir foto de perfil", e);
        }

        log.info("Foto de perfil subida exitosamente: {}", blobName);
        return blobClient.getBlobUrl();
    }

    public String uploadEncryptedFileWithName(MultipartFile file, String encryptedAesKey, byte[] iv, String blobName) throws IOException {
        // Validar que blobName no sea null
        if (blobName == null || blobName.isEmpty()) {
            throw new RuntimeException("blobName no puede ser null o vacío");
        }

        BlobClient blobClient = blobContainerClient.getBlobClient(blobName);
        log.info("🔵 Subiendo archivo con blobName: {}", blobName);

        try (InputStream inputStream = file.getInputStream()) {
            blobClient.upload(inputStream, file.getSize(), true);
        } catch (BlobStorageException e) {
            log.error("Error al subir archivo a Azure {}", e.getMessage());
            throw new RuntimeException("Error al subir archivo", e);
        }

        String blobUrl = blobClient.getBlobUrl();
        log.info("🔵 Archivo subido, URL: {}", blobUrl);
        return blobUrl;
    }

    /**
     * Genera una URL con SAS token para acceder a un blob privado
     * @param blobUrl La URL completa del blob
     * @param expirationMinutes Minutos de validez
     * @return URL con SAS token incluido
     */
    public String generateSasTokenForUrl(String blobUrl, int expirationMinutes) {
        try {
            String blobName = extractBlobNameFromUrl(blobUrl);
            BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

            // Permisos de lectura solamente
            BlobSasPermission permission = new BlobSasPermission()
                    .setReadPermission(true);

            OffsetDateTime expiryTime = OffsetDateTime.now().plusMinutes(expirationMinutes);

            // ✅ Agregar headers para forzar visualización inline (no descarga)
            BlobServiceSasSignatureValues sasValues = new BlobServiceSasSignatureValues(expiryTime, permission)
                    .setContentDisposition("inline");  // <-- CLAVE: Forzar visualización en navegador

            String sasToken = blobClient.generateSas(sasValues);

            String signedUrl = blobClient.getBlobUrl() + "?" + sasToken;
            log.info("SAS Token generado para: {} (inline)", blobName);
            return signedUrl;

        } catch (Exception e) {
            log.error("Error generando SAS token: {}", e.getMessage());
            return blobUrl;
        }
    }

    /**
     * Genera una URL para vista previa (inline) - Funciona para PDFs e imágenes
     */
    public String generatePreviewUrl(String blobUrl, int expirationMinutes) {
        try {
            String blobName = extractBlobNameFromUrl(blobUrl);
            BlobClient blobClient = blobContainerClient.getBlobClient(blobName);

            // Detectar el tipo de archivo por extensión
            String blobNameLower = blobName.toLowerCase();
            String contentType = "application/octet-stream";
            String contentDisposition = "inline";

            if (blobNameLower.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (blobNameLower.endsWith(".jpg") || blobNameLower.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (blobNameLower.endsWith(".png")) {
                contentType = "image/png";
            } else if (blobNameLower.endsWith(".gif")) {
                contentType = "image/gif";
            } else if (blobNameLower.endsWith(".webp")) {
                contentType = "image/webp";
            } else if (blobNameLower.endsWith(".svg")) {
                contentType = "image/svg+xml";
            } else if (blobNameLower.endsWith(".mp4")) {
                contentType = "video/mp4";
                contentDisposition = "inline";
            } else if (blobNameLower.endsWith(".webm")) {
                contentType = "video/webm";
            }

            BlobSasPermission permission = new BlobSasPermission()
                    .setReadPermission(true);

            OffsetDateTime expiryTime = OffsetDateTime.now().plusMinutes(expirationMinutes);

            // Configurar headers para vista previa inline
            BlobServiceSasSignatureValues sasValues = new BlobServiceSasSignatureValues(expiryTime, permission)
                    .setContentDisposition(contentDisposition)
                    .setContentType(contentType);

            String sasToken = blobClient.generateSas(sasValues);
            String signedUrl = blobClient.getBlobUrl() + "?" + sasToken;

            log.info("Preview URL generada para: {} (tipo: {})", blobName, contentType);
            return signedUrl;

        } catch (Exception e) {
            log.error("Error generando preview URL: {}", e.getMessage());
            return blobUrl;
        }
    }
}
