package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MoveFileRequest {

    @NotBlank(message = "El ID del archivo es obligatorio")
    private String fileId;

    // Si es null, mueve a la raíz
    private String targetFolderId;
}