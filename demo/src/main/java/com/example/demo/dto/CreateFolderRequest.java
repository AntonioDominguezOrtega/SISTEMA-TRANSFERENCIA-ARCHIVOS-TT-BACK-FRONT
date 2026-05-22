package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFolderRequest {

    @NotBlank(message = "El nombre de la carpeta es obligatorio")
    private String name;

    // Si es null, se crea en la raíz del usuario
    private String parentFolderId;

    // Color opcional: "blue", "green", "red", "yellow", "purple", "orange", "gray"
    private String color;
}