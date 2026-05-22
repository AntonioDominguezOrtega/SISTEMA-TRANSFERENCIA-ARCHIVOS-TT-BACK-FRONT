package com.example.demo.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender; // La librería de Spring que habla con Gmail
    private final TemplateEngine templateEngine; // Thymeleaf: Para llenar los huecos en el HTML

    @Value("${spring.mail.username}")
    private String fromEmail; // Tu correo (leído del application.properties)

    @Value("${app.frontend.url}")
    private String frontendUrl; // http://localhost:3000

    /**
     * ENVIAR LINK DE RECUPERACIÓN
     * Genera un correo con un botón que lleva al usuario a resetear su password.
     * @Async: Importante para que el usuario no se quede esperando a que Gmail responda.
     */
    @Async
    public void sendPasswordResetEmail(String toEmail, String token, String nombre) {
        try {
            // Preparamos el mensaje MIME (formato estándar de email)
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Contexto de Thymeleaf: Aquí ponemos las variables que van al HTML
            Context context = new Context();
            context.setVariable("nombre", nombre);
            // Creamos el link completo: http://localhost:3000/reset-password?token=xyz...
            context.setVariable("resetLink", frontendUrl + "/reset-password?token=" + token);
            context.setVariable("expirationMinutes", 30);

            // "Renderizamos" el HTML: Convertimos la plantilla + variables en un String HTML final
            String htmlContent = templateEngine.process("password-reset-email", context);

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Reestablecimiento de Contraseña");
            helper.setText(htmlContent, true); // true indica que es contenido HTML, no texto plano

            mailSender.send(message);
            log.info("Email con codigo de recuperacion enviado a: {}", toEmail);
        } catch (Exception e) {
            log.error("Error al enviar email de recuperacion: {}", e.getMessage());
            // No lanzamos excepción para no romper el flujo principal, solo logueamos
        }
    }

    /**
     * ENVIAR CÓDIGO DE RECUPERACIÓN (OTP)
     * Envía un correo simple con los 6 dígitos.
     */
    @Async
    public void sendPasswordResetCodeEmail(String toEmail, String code, String nombre) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            Context context = new Context();
            context.setVariable("nombre", nombre);
            context.setVariable("code", code);
            context.setVariable("expirationMinute", 10);

            // Usamos una plantilla diferente
            String htmlContent = templateEngine.process("password-reset-code-email", context);

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Codigo para Restablecer Contraeña");
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Email con codigo de recuperacion enviado a: {}", toEmail);

        } catch (Exception e) {
            log.error("Error al enviar email con codigo: {}", e.getMessage());
        }
    }

    /**
     * ENVIAR NOTIFICACIÓN GENÉRICA (CON THYMELEAF)
     * Se usa para avisos de vistas, descargas, destrucción de archivos y SMS de respaldo.
     */
    @Async
    public void sendSimpleMessage(String toEmail, String subject, String messageContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Preparamos las variables para el HTML
            Context context = new Context();
            context.setVariable("asunto", subject);
            context.setVariable("message", messageContent);

            // Renderizamos la plantilla genérica
            String htmlContent = templateEngine.process("notification-email", context);

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true = ¡Es HTML!

            mailSender.send(message);
            log.info("Email de notificación ('{}') enviado a: {}", subject, toEmail);

        } catch (Exception e) {
            log.error("Error al enviar email de notificación a {}: {}", toEmail, e.getMessage());
        }
    }
}
