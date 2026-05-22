package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "El usuario o correo obligatorio") // Valida que no llegue vacío
    private String usernameOrEmail;

    @NotBlank(message = "La contraseña es obligatoria") // Valida que no llegue vacía
    private String password;
}
