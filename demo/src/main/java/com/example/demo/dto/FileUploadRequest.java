package com.example.demo.dto;

import com.example.demo.model.AccessLevel;
import com.example.demo.model.SecurityLevel;
import jakarta.validation.constraints.*;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * DTO principal para la transferencia segura de archivos.
 * Mapea exactamente los 6 pasos del formulario de la UI.
 */
@Data
public class FileUploadRequest {

    // --- PASO 1: Selección de Archivos ---
    // @NotEmpty(message = "Debe seleccionar al menos un archivo")
    private List<MultipartFile> files; // Los archivos físicos (PDFs, imágenes, etc.)

    // --- PASO 2: Destinatarios ---
    @NotEmpty(message = "Debe de especificar al menos un destinatario")
    private List<RecipientInfo> recipients; // Lista de personas a las que se les enviará

    private Boolean sendCopyToMyself = false; // Checkbox: Enviar copia a mí mismo

    // --- PASO 3: Niveles de Seguridad ---
    @NotNull(message = "Debe especificar el nivel de seguridad")
    private SecurityLevel securityLevel; // PUBLIC, PASSWORD, o TOKEN_SMS

    // -> Si elige TOKEN_SMS:
    private Boolean useAccountPhone = true; // ¿Usar número asociado a la cuenta?

    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Numero de telefono invalido (formato internacional requerido)")
    private String customPhoneNumber; // Input para número manual (si useAccountPhone es false)

    // -> Si elige PASSWORD:
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;
    private String confirmPassword;

    // --- PASO 4: Permisos y Configuración ---
    @NotNull(message = "Debbe especificar el nivel de acceso")
    private AccessLevel accessLevel; // READ_ONLY (recomendado) o DOWNLOAD

    @NotNull(message = "Debe especificar el tiempo de expiracion")
    private ExpirationTime expirationTime; // Dropdown de expiración

    private Boolean notifyOnview = false; // Checkbox: Notificar cuando se visualice
    private Boolean notifyOnDownload = false; // Checkbox: Notificar cuando se descargue
    private Boolean selfDestruct = false; // Checkbox: Auto-destruir después de la primera vista

    // --- PASO 5: Mensaje Opcional ---
    @Size(max = 500, message = "El mensaje no puede exceder los 500 caracteres")
    private String message;

    // En FileUploadRequest.java, agrega:

    @Size(max = 200, message = "El asunto no puede exceder 200 caracteres")
    private String subject;

    @Data
    public static class RecipientInfo {
        @NotBlank(message = "Debe de especificar el destinatario")
        private String identifier; // Puede ser: maria@email.com, carloslopez, o +525512345678

        private RecipientType type = RecipientType.EMAIL;
    }

    // =========================================================
    // ESTRUCTURAS INTERNAS (Sub-modelos de este formulario)
    // =========================================================

    public enum RecipientType {
        EMAIL, USERNAME, PHONE
    }

    /**
     * Enum que transforma la selección de la UI en horas reales para la Base de Datos.
     */
    public enum ExpirationTime {
        HOURS_24(24),
        DAYS_3(72),
        DAYS_7(168),
        MONTH_1(720),
        CUSTOM(0); // Para cuando el usuario elige una fecha exacta en el calendario

        private final int hours;

        ExpirationTime(int hours) {
            this.hours = hours;
        }

        public int getHours() {
            return hours;
        }
    }
}
