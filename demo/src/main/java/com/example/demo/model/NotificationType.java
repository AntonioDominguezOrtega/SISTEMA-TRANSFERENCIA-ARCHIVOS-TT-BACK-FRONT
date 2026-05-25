package com.example.demo.model;

public enum NotificationType {
    NEW_FILE_SHARED,    // Te compartieron un archivo
    FILE_VIEWED,        // Vieron tu archivo
    FILE_DOWNLOADED,    // Descargaron tu archivo
    FILE_EXPIRING,      // El archivo está por expirar
    FILE_DESTROYED,     // El archivo se auto-destruyó
    TOKEN_GENERATED,    // Se generó un token SMS
    TOKEN_VERIFIED      // Token verificado exitosamente
}
