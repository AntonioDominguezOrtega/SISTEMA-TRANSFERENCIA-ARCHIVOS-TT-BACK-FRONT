package com.example.demo.model;

public enum SecurityLevel {
    PUBLIC, // Cualquier persona con el enlace
    PASSWORD, // Protegido por contraseña
    TOKEN_SMS // Verificación en dos pasos (Máxima seguridad)
}
