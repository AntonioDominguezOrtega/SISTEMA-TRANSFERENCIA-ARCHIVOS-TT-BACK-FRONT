package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {

    private String token; // El JSON Web Token (JWT) cifrado. La "llave" de la sesión.

    private String type = "Bearer";  // Define el tipo de token. "Bearer" es el estándar HTTP.

    // Devolvemos información básica del usuario para que el Frontend
    // pueda usarla (ej. mostrar el nombre en el perfil) sin hacer más peticiones.
    private Long id;
    private String username;
    private String email;
    private String phone;
    private String nombre;
    private String apellido;
    private String profilePictureUrl;
}
