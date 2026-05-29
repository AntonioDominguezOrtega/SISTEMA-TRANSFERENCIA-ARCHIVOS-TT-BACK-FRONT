package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor // Genera el constructor con los argumentos finales (Inyección de dependencias)
public class AuthTokenFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    private final JwtUtils jwtUtils; // Herramienta para validar/leer el token
    private final UserDetailsService userDetailsService; // Servicio para cargar datos del usuario desde la BD

    /**
     * Este método es el CORAZÓN del filtro. Se ejecuta en cada petición (GET, POST, etc.)
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. Extraer el token JWT de la cabecera HTTP "Authorization"
            String jwt = parseJwt(request);

            // 2. Validar el token
            // Si tiene token Y el token es auténtico (firma correcta, no expirado)...
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {

                // 3. Obtener el nombre de usuario desde el token
                String username = jwtUtils.getUsernameFromJwtToken(jwt);

                // 4. Cargar los detalles del usuario desde la base de datos
                // (Esto asegura que el usuario siga existiendo y tenga los roles actualizados)
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // 5. Crear el objeto de Autenticación oficial de Spring
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null, // No necesitamos contraseña, ya presentó el token
                                userDetails.getAuthorities() // Roles (ADMIN, USER)
                        );

                // Agregamos detalles extra de la petición (IP, Sesión ID, etc.)
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 6. ¡EL MOMENTO MÁGICO!
                // Establecemos la autenticación en el Contexto de Seguridad.
                // A partir de esta línea, Spring Security considera al usuario "Logueado" para esta petición.
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            logger.error("No se puede establecer la autenticacion del usuario: {}", e.getMessage());
        }

        // 7. Continuar con el siguiente filtro en la cadena
        // (Si no validamos el token arriba, el usuario seguirá como "anónimo")
        filterChain.doFilter(request, response);
    }

    /**
     * Método auxiliar para limpiar el string del token.
     * La cabecera viene así: "Bearer eyJhbGciOiJIUzI1Ni..."
     * Necesitamos quitar la palabra "Bearer " y quedarnos solo con el código raro.
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7); // Corta los primeros 7 caracteres ("Bearer ")
        }

        return null;
    }


}
