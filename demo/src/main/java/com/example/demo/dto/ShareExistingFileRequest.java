package com.example.demo.dto;

import com.example.demo.model.AccessLevel;
import com.example.demo.model.SecurityLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ShareExistingFileRequest {

    @NotBlank(message = "El ID del archivo es obligatorio")
    private String fileId;

    // --- PASO 2: Destinatarios ---
    @NotEmpty(message = "Debe especificar al menos un destinatario")
    private List<RecipientInfo> recipients;

    private Boolean sendCopyToMyself = false;

    // --- PASO 3: Niveles de Seguridad ---
    @NotNull(message = "Debe especificar el nivel de seguridad")
    private SecurityLevel securityLevel;

    // -> Si elige TOKEN_SMS:
    private Boolean useAccountPhone = true;
    private String customPhoneNumber;

    // -> Si elige PASSWORD:
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;
    private String confirmPassword;

    // --- PASO 4: Permisos y Configuración ---
    @NotNull(message = "Debe especificar el nivel de acceso")
    private AccessLevel accessLevel;

    @NotNull(message = "Debe especificar el tiempo de expiración")
    private ExpirationTime expirationTime;

    @Size(max = 200, message = "El asunto no puede exceder 200 caracteres")
    private String subject;

    private Boolean notifyOnView = false;
    private Boolean notifyOnDownload = false;
    private Boolean selfDestruct = false;


    // --- PASO 5: Mensaje Opcional ---@Size(max = 200, message = "El asunto no puede exceder 200 caracteres")
    @Size(max = 500, message = "El mensaje no puede exceder los 500 caracteres")
    private String message;

    @Data
    public static class RecipientInfo {
        @NotBlank(message = "Debe especificar el destinatario")
        private String identifier;

        private RecipientType type = RecipientType.EMAIL;
    }

    public enum RecipientType {
        EMAIL, USERNAME, PHONE
    }

    public enum ExpirationTime {
        HOURS_24(24),
        DAYS_3(72),
        DAYS_7(168),
        MONTH_1(720),
        CUSTOM(0);

        private final int hours;

        ExpirationTime(int hours) {
            this.hours = hours;
        }

        public int getHours() {
            return hours;
        }
    }
}