package com.example.demo.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;


/*
 * @Component: Hace que Spring gestione esta clase y podamos inyectarla
 * en otros lugares (como en el filtro de seguridad) usando @Autowired.
 */
@Component
public class JwtUtils {

    // Logger para registrar eventos en la consola (útil para ver errores de validación)
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    // Inyectamos la CLAVE SECRETA desde application.properties
    @Value("${app.jwt.secret}")
    private String jwtSecret;

    // Inyectamos el TIEMPO DE EXPIRACIÓN desde application.properties
    @Value("${app.jwt.expiration-ms}")
    private int jwtExpirationMs;

    /**
     * Transforma la clave secreta (String) en un objeto criptográfico Key.
     * Esto es necesario para el algoritmo HMAC-SHA.
     */
    private Key key (){
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * 1. GENERAR TOKEN
     * Se ejecuta cuando el usuario hace Login exitoso.
     * Crea el "pasaporte" digital con sus datos.
     */

    public String generateJwtToken(Authentication authentication) {
        // Obtener el username del principal (puede ser String o UserDetails)
        Object principal = authentication.getPrincipal();
        String username;

        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date((new Date()).getTime() + jwtExpirationMs))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * 2. OBTENER USUARIO DEL TOKEN
     * Decodifica el token para saber quién está haciendo la petición.
     */
    public String getUsernameFromJwtToken(String token){
        return Jwts.parserBuilder()
                .setSigningKey(key()) // Usamos la clave para abrir el token
                .build()
                .parseClaimsJws(token) // Leemos los datos (Claims)
                .getBody()
                .getSubject(); // Devolvemos el username (que guardamos en el Subject arriba)
    }


    /**
     * 3. VALIDAR TOKEN
     * Verifica si el token es auténtico y no ha sido manipulado ni ha expirado.
     */
    public boolean validateJwtToken(String authToken){
        try {
            Jwts.parserBuilder()
                    .setSigningKey(key()) // Si la firma no coincide con nuestra clave, lanzará error
                    .build()
                    .parseClaimsJws(authToken);
            return true;
        } catch (MalformedJwtException e){
            logger.error("Token JWT invalido: {}", e.getMessage()); // Estructura rota
        } catch (ExpiredJwtException e){
            logger.error("Token JWT expirado: {}", e.getMessage()); // Pasó la fecha límite
        } catch (UnsupportedJwtException e){
            logger.error("Token JWT no soportado: {}", e.getMessage());
        } catch (IllegalArgumentException e){
            logger.error("El claims JWT esta vacio: {}", e.getMessage());
        }

        return false;
    }


}
