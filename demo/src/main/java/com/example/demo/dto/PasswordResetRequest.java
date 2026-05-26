package com.example.demo.dto;

import com.example.demo.model.RecoveryMethod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * DTO (Data Transfer Object) para iniciar el proceso de recuperación.
 * Representa el formulario donde el usuario escribe su correo y dice "¡Ayuda!".
 */
@Data  // Lombok genera automáticamente Getters, Setters, toString, etc.
public class PasswordResetRequest {

    // Validamos que el email no esté vacío y tenga formato correcto (@ y .)
    // Si no cumple, Spring devuelve un error 400 Bad Request automáticamente.
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Debe de ser un email valido")
    private String email;

    // Campo opcional para decidir por dónde quiere recibir el código.
    // Por defecto lo seteamos a EMAIL, pero dejamos la puerta abierta para SMS.
    private RecoveryMethod method = RecoveryMethod.EMAIL;
}


