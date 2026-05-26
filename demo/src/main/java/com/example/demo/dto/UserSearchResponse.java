package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSearchResponse {
    private Long id;
    private String nombre;
    private String apellido;
    private String username;
    private String email;
    private String phone;
    private String profilePictureUrl;
    private Boolean isContact;  // si ya es contacto
}