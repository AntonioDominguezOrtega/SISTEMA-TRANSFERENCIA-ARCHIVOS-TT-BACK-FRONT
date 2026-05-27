package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.model.RecoveryMethod;
import com.example.demo.model.User;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/*
 * @CrossOrigin: Permite peticiones desde cualquier origen (*).
 * Aunque ya configuramos CORS en WebSecurityConfig, esto sirve como refuerzo a nivel de controlador.
 * @RestController: Indica que esta clase responde con datos JSON (no con vistas HTML).
 * @RequestMapping: Define la base de la URL. Todos los métodos abajo empezarán con "/api/auth".
 */
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // Inyectamos nuestro servicio inteligente (donde está la lógica de Twilio y JWT)
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    /**
     * REGISTRO DE USUARIO
     * Ruta: POST http://localhost:8080/api/auth/register
     * Recibe: JSON con nombre, usuario, password, teléfono, etc.
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
            try {
                // Llamamos al servicio para crear el usuario y enviar el SMS
                User user = authService.registerUser(registerRequest);

                // Si todo sale bien, respondemos HTTP 200 (OK) con un mensaje JSON
                return ResponseEntity.ok(Map.of(
                        "message", "Usuario registrado exitosamente. Se ha enviado un codigo de verificacion a su telefono.",
                        "email", user.getEmail()
                ));
            } catch (RuntimeException e) {
                // Si falla (ej. usuario duplicado), respondemos HTTP 400 (Bad Request) con el error
                return ResponseEntity.badRequest().body(Map.of("Error", e.getMessage()));
            }
    }

    /**
     * VERIFICACIÓN DE CÓDIGO SMS
     * Ruta: POST http://localhost:8080/api/auth/verify
     * Recibe: JSON con email y el código de 6 dígitos.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyUser(@Valid @RequestBody VerificationRequest verificationRequest) {
        try {
            // El servicio verifica si el código coincide
            User user = authService.verifyUser(verificationRequest);

            return ResponseEntity.ok(Map.of(
                    "message", "Usuario verificado exitosamente",
                    "email", user.getEmail(),
                    "verified", user.getIsVerifed()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * REENVIAR CÓDIGO
     * Ruta: POST http://localhost:8080/api/auth/resend-code
     * Recibe: JSON simple {"email": "usuario@ejemplo.com"}
     */
    @PostMapping("/resend-code")
    public ResponseEntity<?> resendVerificationCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String message = authService.resendVerificationCode(email);

            return ResponseEntity.ok(Map.of("message", message));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * INICIAR SESIÓN (LOGIN)
     * Ruta: POST http://localhost:8080/api/auth/login
     * Recibe: Usuario y Contraseña.
     * Devuelve: El Token JWT si las credenciales son correctas y el usuario está verificado.
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Autenticamos y generamos el Token
            JwtResponse jwtResponse = authService.authenticateUser(loginRequest);

            // Devolvemos el objeto JwtResponse (que incluye el token y datos del usuario)
            return ResponseEntity.ok(jwtResponse);
        } catch (RuntimeException e) {
            // Captura errores como "Bad credentials" o "Usuario no verificado"
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==================================================================
    //           NUEVOS ENDPOINTS: RECUPERACIÓN DE CONTRASEÑA
    // ==================================================================

    /**
     * 1. SOLICITAR RESETEO
     * Ruta: POST /api/auth/password/reset/request
     * Body: { "email": "juan@test.com", "method": "EMAIL" (o SMS) }
     * Descripción: Verifica que el usuario exista y envía el Link o el Código.
     */
    @PostMapping("/password/reset/request")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        try {
            String message = authService.requestPasswordReset(request);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (RuntimeException e) {
            // Retorna 400 si el usuario no existe o no está verificado
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 2. CONFIRMAR CON TOKEN (Link)
     * Ruta: POST /api/auth/password/reset/confirm
     * Body: { "token": "abc-123...", "newPassword": "...", "confirmPassword": "..." }
     * Descripción: Finaliza el proceso cuando el usuario viene del clic en el correo.
     */
    @PostMapping("/password/reset/confirm")
    public ResponseEntity<?> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        try {
            String message = authService.resetPasswordWithToken(request);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (RuntimeException e) {
            // Retorna 400 si el token expiró o las contraseñas no coinciden
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 3. CONFIRMAR CON CÓDIGO (Manual)
     * Ruta: POST /api/auth/password/reset/with-code
     * Body: { "email": "...", "code": "123456", "newPassword": "...", "confirmPassword": "..." }
     * Descripción: Finaliza el proceso cuando el usuario escribe el código manualmente.
     */
    @PostMapping("/password/reset/with-code")
    public ResponseEntity<?> resetPasswordWithCode(@Valid @RequestBody PasswordResetCodeRequest request) {
        try {
            String message = authService.resetPasswordWithCode(request);
            return ResponseEntity.ok(Map.of("message", message));
        } catch (RuntimeException e) {
            // Retorna 400 si el código es incorrecto o expiró
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * 4. REENVIAR (Link o Código)
     * Ruta: POST /api/auth/password/reset/resend
     * Body: { "email": "juan@test.com", "method": "EMAIL" }
     * Descripción: Genera un nuevo token/código si el anterior expiró o se perdió.
     */
    @PostMapping("/password/reset/resend")
    public ResponseEntity<?> resendPasswordResetCode(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");

            // Leemos el método (EMAIL o SMS), si no viene, asumimos EMAIL por defecto
            // Usamos toUpperCase() para que no importe si envían "email" o "EMAIL"
            RecoveryMethod method = RecoveryMethod.valueOf(
                    request.getOrDefault("method", "EMAIL").toUpperCase()
            );

            String message = authService.resendPasswordResetCode(email, method);
            return ResponseEntity.ok(Map.of("message", message));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Metodo de recuperacion invalido (use Email o SMS)"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/debug/encoder")
    public ResponseEntity<?> debugEncoder() {
        return ResponseEntity.ok(Map.of(
                "authServiceEncoderHash", System.identityHashCode(passwordEncoder),
                "message", "Revisa los logs al iniciar"
        ));
    }
}
