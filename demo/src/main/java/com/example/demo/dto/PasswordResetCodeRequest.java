package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO para finalizar el reseteo mediante CÓDIGO MANUAL (OTP).
 * Se usa cuando el usuario escribe un código de 6 dígitos en la pantalla.
 */
@Data
public class PasswordResetCodeRequest {

    // El código corto (ej. 849201) que el usuario recibió.
    @NotBlank(message = "El codigo es obligatorio")
    @Size(min = 6, max = 6, message = "El codigo debe de tener exactamente 6 digitos")
    private String code;

    // Necesario para identificar al usuario, ya que el código de 6 dígitos podría no ser único globalmente.
    @NotBlank(message = "El correo es obligatorio")
    private String email;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 6, max = 40)
    private String newPassword;

    @NotBlank(message = "Debe confirmar la contraseña")
    @Size(min = 6, max = 40)
    private String confirmPassword;
}
