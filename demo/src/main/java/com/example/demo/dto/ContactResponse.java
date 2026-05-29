package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ContactResponse {
    private Long contactId;
    private Long userId;
    private String nombre;
    private String apellido;
    private String username;
    private String email;
    private String phone;
    private String profilePictureUrl;
    private LocalDateTime addedAt;
}