package com.example.demo.dto;

import com.example.demo.model.SecurityLevel;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class PersonalFileUploadRequest {

    @NotNull(message = "El archivo es obligatorio")
    private MultipartFile file;

    // Carpeta destino (si es null, va a la raíz)
    private String parentFolderId;

    // NIVELES DE SEGURIDAD (igual que al compartir)
    @NotNull(message = "Debe especificar el nivel de seguridad")
    private SecurityLevel securityLevel;

    // Si securityLevel = PASSWORD
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;
    private String confirmPassword;

    // Si securityLevel = TOKEN_SMS
    private Boolean useAccountPhone = true;
    private String customPhoneNumber;
}