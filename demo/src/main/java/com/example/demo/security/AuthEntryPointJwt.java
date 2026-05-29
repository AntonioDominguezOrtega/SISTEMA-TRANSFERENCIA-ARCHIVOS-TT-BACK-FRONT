package com.example.demo.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/*
 * @Component: Permite que Spring detecte esta clase y la podamos inyectar
 * en el archivo de configuración WebSecurityConfig.
 */
@Component
public class AuthEntryPointJwt implements AuthenticationEntryPoint {

    private static final Logger logger = LoggerFactory.getLogger(AuthEntryPointJwt.class);

    /**
     * Método commence: Se dispara SIEMPRE que un usuario no autenticado intente acceder
     * a un recurso protegido y falle la autenticación.
     */
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException, ServletException {

        // 1. Registramos el error en la consola del servidor para depuración
        logger.error("Error de autorizacion: {}", authException.getMessage());

        // 2. Configuramos la cabecera de la respuesta HTTP
        // Le decimos al navegador/Postman: "Te voy a responder con contenido JSON"
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        // Le decimos: "El estado es 401 (No Autorizado)"
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // 3. Construimos el cuerpo del mensaje (el JSON bonito)
        final Map<String, Object> body = new HashMap<>();
        body.put("status", HttpServletResponse.SC_UNAUTHORIZED); //401
        body.put("error", "Unauthorized"); // Nombre del error
        body.put("message", authException.getMessage()); // Mensaje técnico (ej: "Bad credentials")
        body.put("path", request.getServletPath()); // A qué URL intentó entrar (ej: /api/admin)

        // 4. Convertimos el Mapa de Java a un String JSON real y lo enviamos
        // Usamos Jackson (ObjectMapper) para esta conversión automática.
        final ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(response.getOutputStream(), body);
    }
}
