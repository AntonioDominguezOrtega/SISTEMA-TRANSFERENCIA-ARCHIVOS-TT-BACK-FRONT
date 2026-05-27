package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.ERole;
import com.example.demo.model.RecoveryMethod;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.RoleRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service // Define este componente como un Servicio de Spring (Lógica de Negocio)
@RequiredArgsConstructor // Lombok: Inyecta automáticamente todas las dependencias 'final' en el constructor
public class AuthService {

    // Inyección de dependencias necesarias
    private final UserRepository userRepository; // Para guardar usuarios
    private final RoleRepository roleRepository; // Para asignar roles
    private final PasswordEncoder passwordEncoder; // Para encriptar contraseñas
    private final JwtUtils jwtUtils; // Para generar el Token JWT
    private final TwilioService twilioService; // Para enviar el SMS
    private final EmailService emailService;
    private final StorageService storageService;  // Inyectar al principio

    // Constantes de configuración para la verificación
    private static final int VERIFICATION_CODE_LENGTH = 6;
    private static final int MAX_VERIFICATION_ATTEMPTS = 5; // Seguridad contra fuerza bruta
    private static final int CODE_EXPIRATION_MINUTES = 10;

    /**
     * REGISTRO DE USUARIO
     * Crea el usuario en la BD en estado "No Verificado" y envía el SMS.
     * @Transactional asegura que si falla el envío del SMS, se cancele el guardado en la BD.
     */
    @Transactional
    public User registerUser(RegisterRequest registerRequest) {
        // 1. Validaciones previas (Integridad de datos)
        if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
            throw new RuntimeException("La contraseña no coincide");
        }

        // Validar que no existan duplicados
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya esta en uso");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("El correo electronico ya esta en uso");
        }

        if (userRepository.existsByPhone(registerRequest.getPhone())) {
            throw new RuntimeException("El numero de telefono ya esta en uso");
        }

        // 2. Creación de la Entidad User
        User user = new User();
        user.setNombre(registerRequest.getNombre());
        user.setApellido(registerRequest.getApellido());
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPhone(registerRequest.getPhone());

        // Importante: Encriptamos la contraseña antes de guardarla
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        // 3. Asignación del Rol por defecto (ROLE_USER)
        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                .orElseThrow(() -> new RuntimeException("Error: Rol no encotrado en la base de datos"));
        roles.add(userRole);
        user.setRoles(roles);

        // 4. Generación del Código OTP (SMS)
        String verificationCode = generateVerificationCode();
        user.setVerificarionCode(verificationCode);
        user.setVerificarionCodeExpires(LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES));
        user.setVerificationAttempts(0);
        user.setIsVerifed(false); // El usuario nace "bloqueado" hasta que verifique


        // 5. Guardado en Base de Datos
        User savedUser = userRepository.save(user);

        // 6. Envío del SMS a través de Twilio
        boolean smsSent = twilioService.sendVerificationCode(user.getPhone(), verificationCode);

        // 7. RESPALDO: Si el SMS falló (por cuenta Trial o número inválido), enviamos el código por correo
        if (!smsSent) {
            log.info("Enviando código OTP por correo electrónico como respaldo a {}", user.getEmail());
            // Reutilizamos tu método de EmailService que envía el HTML con el código
            emailService.sendAccountVerificationEmail(user.getEmail(), verificationCode, user.getNombre());
        }

        // NUEVO: Crear estructura de almacenamiento personal
        storageService.initializeUserStorage(savedUser);

        return savedUser;
    }

    /**
     * VERIFICACIÓN DE CUENTA
     * Valida el código SMS ingresado por el usuario.
     */
    @Transactional
    public User verifyUser(VerificationRequest verificationRequest) {
        // Buscamos al usuario por su email
        User user = userRepository.findByEmail(verificationRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // A. Validar expiración del tiempo
        if (user.getVerificarionCodeExpires().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El codigo de verificacion ha expirado. Solicita uno nuevo");
        }

        // B. Validar intentos máximos (Seguridad)
        if (user.getVerificationAttempts() >= MAX_VERIFICATION_ATTEMPTS) {
            throw new RuntimeException("Numero de intentos excedido. Por seguridad, genera uno nuevo");
        }

        // C. Comparar código ingresado vs código guardado
        if (!user.getVerificarionCode().equals(verificationRequest.getCode())) {
            // Si falla, incrementamos el contador de errores
            user.setVerificationAttempts(user.getVerificationAttempts() + 1);
            userRepository.save(user);

            int attemptLeft = MAX_VERIFICATION_ATTEMPTS - user.getVerificationAttempts();
            throw new RuntimeException("Codigo incorrecto. Intentos restantes: " + attemptLeft);
        }

        // D. Éxito: Activar usuario y limpiar códigos
        user.setIsVerifed(true);
        user.setVerificarionCode(null);
        user.setVerificarionCodeExpires(null);
        user.setVerificationAttempts(0);

        return userRepository.save(user);
    }

    /**
     * REENVÍO DE CÓDIGO
     * Si el usuario perdió el código o expiró, generamos uno nuevo.
     */
    @Transactional
    public String resendVerificationCode(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (user.getIsVerifed()) {
            throw new RuntimeException("El usuario ya esta verificado, puede iniciar sesion");
        }

        // Generar nuevo código y reiniciar contador
        String newCode = generateVerificationCode();
        user.setVerificarionCode(newCode);
        user.setVerificarionCodeExpires(LocalDateTime.now().plusMinutes(CODE_EXPIRATION_MINUTES));
        user.setVerificationAttempts(0);

        userRepository.save(user);

        // Envio de mensaje SMS
        boolean smsSent = twilioService.sendVerificationCode(user.getPhone(), newCode);

        if (!smsSent) {
            emailService.sendPasswordResetCodeEmail(user.getEmail(), newCode, user.getNombre());
            return "El SMS falló. Nuevo código de verificación enviado a tu correo electrónico.";
        }

        return "Nuevo codigo de verificacion enviado exitosamente";
    }

    /**
     * LOGIN DE USUARIO
     * Autentica credenciales y verifica que el SMS haya sido validado previamente.
     */
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        // 1. Buscar el usuario manualmente
        User user = userRepository.findByUsername(loginRequest.getUsernameOrEmail())
                .orElseGet(() -> userRepository.findByEmail(loginRequest.getUsernameOrEmail())
                        .orElseThrow(() -> new RuntimeException("Usuario no encontrado")));

        // 2. Verificar contraseña MANUALMENTE
        if (!passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new RuntimeException("Credenciales incorrectas");
        }

        // 3. Verificar si está verificado
        if (!user.getIsVerifed()) {
            throw new RuntimeException("Su cuenta no esta verificada. Por favor valide el codigo SMS.");
        }

        // 4. Crear manualmente los UserDetails y la autenticación
        UserDetailsImpl userDetails = UserDetailsImpl.build(user);

        // 5. Forzar la autenticación en el contexto de seguridad
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 6. Generar el Token JWT
        String jwt = jwtUtils.generateJwtToken(authentication);

        // 7. Devolver la respuesta
        return new JwtResponse(
                jwt,
                "Bearer",
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhone(),
                user.getNombre(),
                user.getApellido(),
                user.getProfilePictureUrl()
        );
    }

    // Método auxiliar para generar 6 dígitos aleatorios
    private String generateVerificationCode() {
        Random random = new Random();
        StringBuilder code = new StringBuilder();

        for (int i = 0; i < VERIFICATION_CODE_LENGTH; i++) {
            code.append(random.nextInt(10)); // Agrega un número del 0 al 9
        }

        return code.toString();
    }

    // ---------------------------------------------------------
    // SECCIÓN DE RECUPERACIÓN DE CONTRASEÑA
    // ---------------------------------------------------------

    /**
     * SOLICITAR RESETEO (Paso 1)
     * El usuario ingresa su correo y elige si quiere Link o Código.
     */
    @Transactional
    public String requestPasswordReset(PasswordResetRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Seguridad: No permitir resetear si la cuenta no está verificada (evita spam)
        if (!user.getIsVerifed()) {
            throw new RuntimeException("Por favor verifique su cuenta primero");
        }

        // Limpiamos intentos fallidos previos para darle una oportunidad limpia
        user.setResetPasswordAttempts(0);

        switch (request.getMethod()) {
            case EMAIL: // Opción A: Enviar Link Mágico
                String token = generateSecureToken();
                user.setResetPasswordToken(token);
                user.setResetPasswordTokenExpires(LocalDateTime.now().plusMinutes(30)); // Token vive 30 min

                // Limpiamos el otro método para evitar conflictos
                user.setResetPasswordCode(null);
                user.setResetPasswordcCodeExpires(null);
                userRepository.save(user);

                emailService.sendPasswordResetEmail(user.getEmail(), token, user.getNombre());
                return "Se ha enviado un enlace de recuperacion a su email";

            case SMS: // Opción B: Enviar Código Numérico (OTP)
                String code = generateVerificationCode(); // Reusamos tu método existente de 6 dígitos
                user.setResetPasswordCode(code);
                user.setResetPasswordcCodeExpires(LocalDateTime.now().plusMinutes(10)); // Código vive 10 min

                user.setResetPasswordToken(null);
                user.setResetPasswordTokenExpires(null);
                userRepository.save(user);

                // 1. Intentamos enviar SMS real
                try {
                    twilioService.sendVerificationCode(user.getPhone(), code);
                } catch (Exception e) {
                    log.error("Fallo al enviar SMS de Twilio: {}", e.getMessage());
                    // No lanzamos error para que al menos le llegue el email de respaldo
                }

                // 2. RESPALDO: Enviamos el mismo código por Email (Corrección de nombre aquí)
                emailService.sendPasswordResetCodeEmail(user.getEmail(), code, user.getNombre());

                return "Se a enviado un codigo de recuperacion a su telefono y correo";

            default:
                throw new RuntimeException("Metodo de recuperacion no valida");
        }
    }

    /**
     * RESETEAR CON LINK (Paso 2 - Opción A)
     * El usuario hizo clic en el enlace del correo.
     */
    @Transactional
    public String resetPasswordWithToken(PasswordResetConfirmRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }

        // Buscamos al usuario por el token que venía en la URL
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Token invalido o expirado"));

        // Verificamos fecha de expiración
        if (user.getResetPasswordTokenExpires().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("El enlace de recuperacion ha expirado. Solicita uno nuevo.");
        }

        // Todo OK: Cambiamos contraseña
        updateUserPassword(user, request.getNewPassword());

        return "Contraseña actualiza exitosamenete.";
    }

    /**
     * RESETEAR CON CÓDIGO (Paso 2 - Opción B)
     * El usuario escribe el código manualmente.
     */
    @Transactional
    public String resetPasswordWithCode(PasswordResetCodeRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Seguridad Anti-Fuerza Bruta: Máximo 5 intentos
        if (user.getResetPasswordAttempts() >= 5) {
            throw new RuntimeException("Demasiados intentos fallidos. Por seguridad, solicite un nuevo codigo.");
        }

        // Validar expiración
        if (!request.getCode().equals(user.getResetPasswordCode())) {
            // Código incorrecto: Aumentamos contador y guardamos
            user.setResetPasswordAttempts(user.getResetPasswordAttempts() + 1);
            userRepository.save(user);

            int attemptsLeft = 5 - user.getResetPasswordAttempts();
            throw new RuntimeException("Codigo incorrecto. Intentos restantes: " + attemptsLeft);
        }

        // Todo OK: Cambiamos contraseña
        updateUserPassword(user, request.getNewPassword());

        return "Contraseña actualiza exitosamente";
    }

    @Transactional
    public String resendPasswordResetCode(String email, RecoveryMethod method) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Validamos que esté verificado antes de reenviar nada
        if (!user.getIsVerifed()) {
            throw new RuntimeException("La cuenta no esta verificada");
        }

        if (method == RecoveryMethod.SMS) {
            String newCode = generateVerificationCode();
            user.setResetPasswordCode(newCode);
            user.setResetPasswordcCodeExpires(LocalDateTime.now().plusMinutes(10));
            user.setResetPasswordAttempts(0);
            userRepository.save(user);

            // Reenvío por Twilio y Email de respaldo
            try {
                twilioService.sendVerificationCode(user.getPhone(), newCode);
            } catch (Exception e) {
                log.error("Fallo reenvio SMS: {}", e.getMessage());
            }
            // Corrección: Usamos sendPasswordResetCodeEmail (el nombre correcto en tu EmailService)
            emailService.sendPasswordResetCodeEmail(user.getEmail(), newCode, user.getNombre());

            return "Nuevo codigo enviado a su telefono";
        } else {
            // Reenviar enlace por email
            String newToken = generateSecureToken();
            user.setResetPasswordToken(newToken);
            user.setResetPasswordTokenExpires(LocalDateTime.now().plusMinutes(30));
            user.setResetPasswordAttempts(0);
            userRepository.save(user);

            emailService.sendPasswordResetEmail(user.getEmail(), newToken, user.getNombre());
            return "Nuevo enlace de recuperacion enviado a su email";
        }
    }

    // Método auxiliar para no repetir código de actualización
    private void updateUserPassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));

        // Limpiamos todos los tokens de seguridad para que no se puedan reusar
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpires(null);
        user.setResetPasswordCode(null);
        user.setResetPasswordcCodeExpires(null);
        user.setResetPasswordAttempts(0);

        userRepository.save(user);
    }

    // Método auxiliar para generar token largo y seguro (URL safe)
    private String generateSecureToken() {
        return UUID.randomUUID().toString().replace("-", "") +
                UUID.randomUUID().toString().replace("-", "").substring(0,16);
    }
}
