package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerificationRequest {

    // El código OTP (One-Time Password) de 6 dígitos o caracteres que llegó por SMS.
    @NotBlank(message = "El código de verificación es obligatorio")
    private String code;

    // Necesitamos el email (o username) para saber A QUIÉN pertenece ese código.
    // Esto vincula el código ingresado con el usuario pendiente de verificación en la BD.
    @NotBlank(message = "El email es obligatorio")
    private String email;
}
