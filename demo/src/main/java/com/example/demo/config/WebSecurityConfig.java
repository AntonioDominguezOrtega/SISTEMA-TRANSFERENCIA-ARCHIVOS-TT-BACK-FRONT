package com.example.demo.config;

import com.example.demo.security.AuthEntryPointJwt;
import com.example.demo.security.AuthTokenFilter;
import com.example.demo.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/*
 * CLASE MAESTRA DE SEGURIDAD
 * Aquí se definen los "Cadeneros" del antro, las reglas de vestimenta (quién entra y quién no)
 * y cómo se validan las credenciales.
 */
@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Permite usar anotaciones @PreAuthorize("hasRole('ADMIN')") en los controladores
@RequiredArgsConstructor // Inyecta automáticamente las dependencias 'final' (Mejor práctica que @Autowired)
public class WebSecurityConfig {

    // Servicios necesarios inyectados por el constructor
    private final UserDetailsServiceImpl userDetailsService; // Para buscar usuarios en la BD
    private final AuthEntryPointJwt unauthorizedHandler; // Nuestro filtro personalizado para leer JWT
    private final AuthTokenFilter authTokenFilter; // Manejador de errores (401 Unauthorized)

    /**
     * PROVEEDOR DE AUTENTICACIÓN (El "Cerebro" de la validación)
     * Conecta el UserDetailsService con el PasswordEncoder.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        // NOTA IMPORTANTE: En versiones nuevas de Spring Security, el constructor EXIGE el servicio.
        // Esto garantiza que el proveedor nazca "completo" y no falle después (Inmutabilidad).
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);

        // Le asignamos el encriptador para que sepa verificar si "123456" coincide con el Hash de la BD
        authProvider.setPasswordEncoder(passwordEncoder());

        authProvider.setHideUserNotFoundExceptions(false); // ← Agrega esto para ver errores reales

        return authProvider;
    }

    /**
     * GESTOR DE AUTENTICACIÓN
     * Es la herramienta que usaremos manualmente en el Login para disparar la verificación.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        // Obtén el AuthenticationManager por defecto
        AuthenticationManager authManager = authConfig.getAuthenticationManager();
        // Verifica que esté usando tu provider
        log.info("AuthenticationManager: {}", authManager.getClass());

        return authConfig.getAuthenticationManager();
    }

    /**
     * ENCRIPTADOR DE CONTRASEÑAS
     * BCrypt es el estándar de la industria. Es lento a propósito para evitar ataques de fuerza bruta.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * CADENA DE FILTROS DE SEGURIDAD (Las "Reglas del Juego")
     * Aquí configuramos qué URLs son públicas, CORS, CSRF y Sesiones.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Desactivamos CSRF (Cross-Site Request Forgery) porque usamos JWT y API REST.
                // Al no usar cookies de sesión del navegador, este ataque no es posible.
                .csrf(AbstractHttpConfigurer::disable)

                // 2. Activamos CORS para que el Frontend (React/Angular) pueda conectarse.
                // Usa la configuración definida más abajo en corsConfigurationSource().
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // 3. Manejo de Excepciones: Si falla la autenticación, responde con JSON (no HTML).
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(unauthorizedHandler)
                )

                // 4. Gestión de Sesiones: STATELESS (Sin Estado).
                // No guardamos sesión en memoria del servidor. Cada petición debe traer su Token.
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // 5. Autorización de URLs (Lista Blanca)
                .authorizeHttpRequests(auth -> auth
                        // Rutas Públicas (Cualquiera puede entrar)
                        .requestMatchers("/api/auth/**").permitAll() // Login, Registro, Verificar SMS
                        .requestMatchers("/api/test/**").permitAll() // Pruebas
                        .requestMatchers("/error").permitAll() // Errores internos de Spring
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll() // Documentación API

                        // Rutas Privadas (Todo lo demás requiere estar autenticado)
                        .anyRequest().authenticated()
                );

        // 6. Agregamos nuestro Proveedor de Autenticación configurado
        http.authenticationProvider(authenticationProvider());

        // 7. ¡CRÍTICO! Insertamos nuestro filtro JWT *ANTES* del filtro estándar de usuario/password.
        // Si el usuario trae Token, entra directo y no le pedimos contraseña de nuevo.
        http.addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CONFIGURACIÓN CORS (Cross-Origin Resource Sharing)
     * Define quién puede hablar con nuestra API desde otro dominio/puerto.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Orígenes permitidos (El puerto de tu Frontend)
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "https://yellow-cliff-06ded060f.7.azurestaticapps.net"));

        // Métodos HTTP permitidos
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // Cabeceras permitidas (Authorization es vital para el JWT)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));

        // Exponemos la cabecera Authorization por si el frontend necesita leerla de la respuesta
        configuration.setExposedHeaders(List.of("Authorization"));

        // Permitir envío de credenciales (cookies/auth headers)
        configuration.setAllowCredentials(true);

        // Aplicar esta configuración a TODAS las rutas (/**)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
