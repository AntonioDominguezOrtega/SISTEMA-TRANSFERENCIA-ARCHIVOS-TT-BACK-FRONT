package com.example.demo.config;

import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * CONFIGURACIÓN DE AZURE BLOB STORAGE
 * Lee automáticamente las variables que empiezan con "azure.storage"
 * en el application.properties y crea los clientes de conexión.
 */
@Configuration
@ConfigurationProperties(prefix = "azure.storage")
@Data
public class AzureBlobConfig {

    // Estas variables se llenan mágicamente por Spring Boot
    private String connectionString;
    private String containerName;
    private String accountName;
    private String accountkey;

    /**
     * Cliente principal para comunicarse con tu cuenta de Azure.
     */
    @Bean
    public BlobServiceClient blobServiceClient() {
        return new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .buildClient();
    }

    /**
     * Cliente específico para la "carpeta gigante" (Container) donde guardarás todo.
     * Si no existe en la nube, lo crea automáticamente al arrancar.
     */
    @Bean
    public BlobContainerClient blobContainerClient(BlobServiceClient blobServiceClient) {
        BlobContainerClient containerClient =
                blobServiceClient.getBlobContainerClient(containerName);

        // Crear contenedor si no existe
        if (!containerClient.exists()) {
            containerClient.create();
        }

        return containerClient;
    }
}
