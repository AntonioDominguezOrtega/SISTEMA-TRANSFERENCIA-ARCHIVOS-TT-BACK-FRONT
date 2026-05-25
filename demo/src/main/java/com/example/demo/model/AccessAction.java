package com.example.demo.model;

public enum AccessAction {
    UPLOAD,         // Subir archivo
    SHARE,          // Compartir archivo
    VIEW,           // Ver archivo
    DOWNLOAD,       // Descargar archivo
    TOKEN_REQUEST,  // Solicitar token
    TOKEN_VERIFY,   // Verificar token
    TOKEN_FAIL,     // Token fallido
    UNLOCK,         // Desbloquear archivo
    LOCK,           // Bloquear archivo (por expiración)
    DELETE          // Eliminar archivo
}

