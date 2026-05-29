package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO para finalizar el reseteo mediante LINK (Token).
 * Se usa cuando el usuario hace clic en un enlace enviado por correo.
 */
@Data
public class PasswordResetConfirmRequest {

    // El token único (UUID o JWT) que venía en el enlace del correo.
    // Sirve para identificar al usuario sin pedirle su email de nuevo.
    @NotBlank(message = "El token es obligatorio")
    private String token;

    // La nueva contraseña que el usuario quiere establecer.
    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 6, max = 40, message = "La contraseña debe de tener entre 6 y 40 caracteres")
    private String newPassword;

    // Campo de confirmación para validar en el servicio que no hubo errores de dedo.
    @NotBlank(message = "Debe confirmar la contraseña")
    @Size(min = 6, max = 40)
    private String confirmPassword;
}
