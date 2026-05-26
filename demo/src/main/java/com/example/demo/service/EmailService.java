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

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String smtpUsername;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.reset-password.expiration-minutes:30}")
    private int resetExpirationMinutes;

    @Value("${app.verification.code-expiration-minutes:10}")
    private int verificationCodeExpirationMinutes;

    @Async
    public void sendAccountVerificationEmail(String toEmail, String code, String nombre) {
        try {
            Context context = new Context();
            context.setVariable("nombre", nombre);
            context.setVariable("code", code);
            context.setVariable("messageIntro", "Este es tu código para verificar tu correo y completar el registro de tu cuenta.");
            context.setVariable("expirationMinutes", verificationCodeExpirationMinutes);

            String htmlContent = templateEngine.process("codigo-registro", context);

            sendHtmlEmail(smtpUsername, toEmail, "Verifica tu cuenta en TT", htmlContent);
            log.info("Email de verificación de cuenta enviado a: {}", toEmail);
        } catch (Exception e) {
            log.error("Error al enviar email de verificación de cuenta: {}", e.getMessage(), e);
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String token, String nombre) {
        try {
            Context context = new Context();
            context.setVariable("nombre", nombre);
            context.setVariable("code", token);
            context.setVariable("messageIntro", "Este es tu código para continuar con el restablecimiento de tu contraseña.");
            context.setVariable("expirationMinutes", resetExpirationMinutes);

            String htmlContent = templateEngine.process("codigo-contraseña", context);

            sendHtmlEmail(smtpUsername, toEmail, "Restablece tu contraseña", htmlContent);
            log.info("Email con token de restablecimiento enviado a: {}", toEmail);
        } catch (Exception e) {
            log.error("Error al enviar email de restablecimiento: {}", e.getMessage(), e);
        }
    }

    @Async
    public void sendPasswordResetCodeEmail(String toEmail, String code, String nombre) {
        try {
            Context context = new Context();
            context.setVariable("nombre", nombre);
            context.setVariable("code", code);
            context.setVariable("messageIntro", "Este es tu código para continuar con el restablecimiento de tu contraseña.");
            context.setVariable("expirationMinutes", verificationCodeExpirationMinutes);

            String htmlContent = templateEngine.process("codigo-registro", context);

            sendHtmlEmail(smtpUsername, toEmail, "Código de verificación de seguridad", htmlContent);
            log.info("Email con código de seguridad enviado a: {}", toEmail);
        } catch (Exception e) {
            log.error("Error al enviar email con código: {}", e.getMessage(), e);
        }
    }

    @Async
    public void sendFileUnlockTokenEmail(String toEmail, String code, String nombre, String fileName) {
        try {
            Context context = new Context();
            context.setVariable("nombre", nombre);
            context.setVariable("messageIntro", "Recibimos una solicitud para desbloquear el archivo '" + fileName + "'. Este es tu token de acceso.");
            context.setVariable("code", code);

            String htmlContent = templateEngine.process("codigo-archivo", context);

            sendHtmlEmail(smtpUsername, toEmail, "Token para desbloquear archivo", htmlContent);
            log.info("Email de token de desbloqueo enviado a: {}", toEmail);
        } catch (Exception e) {
            log.error("Error al enviar email de token de desbloqueo: {}", e.getMessage(), e);
        }
    }

    @Async
    public void sendNotificationEmail(String toEmail, String subject, String messageContent, String nombre) {
        try {
            Context context = new Context();
            context.setVariable("nombre", nombre);
            context.setVariable("subject", subject);
            context.setVariable("message", messageContent);

            String htmlContent = templateEngine.process("notification-email", context);

            sendHtmlEmail(smtpUsername, toEmail, subject, htmlContent);
            log.info("Email de notificación ('{}') enviado a: {}", subject, toEmail);
        } catch (Exception e) {
            log.error("Error al enviar email de notificación a {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Async
    public void sendSupportEmail(String toEmail, String nombre) {
        try {
            Context context = new Context();
            context.setVariable("nombre", nombre);
            context.setVariable("subject", "Solicitud de soporte recibida");
            context.setVariable("message", "Gracias por contactarte con soporte. Un ejecutivo se pondrá en contacto contigo pronto para continuar con tu caso.");

            String htmlContent = templateEngine.process("notification-email", context);

            sendHtmlEmail(smtpUsername, toEmail, "Solicitud de soporte recibida", htmlContent);
            log.info("Email de soporte enviado a: {}", toEmail);
        } catch (Exception e) {
            log.error("Error al enviar email de soporte a {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Async
    public void sendSimpleMessage(String toEmail, String subject, String messageContent, String nombre) {
        try {
            Context context = new Context();
            context.setVariable("nombre", nombre != null ? nombre : "");
            context.setVariable("subject", subject);
            context.setVariable("message", messageContent);

            String htmlContent = templateEngine.process("notification-email", context);
            sendHtmlEmail(smtpUsername, toEmail, subject, htmlContent);
            log.info("Email genérico enviado a {} con asunto: {}", toEmail, subject);
        } catch (Exception e) {
            log.error("Error al enviar email genérico a {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Async
    public void sendSimpleMessage(String toEmail, String subject, String messageContent) {
        sendSimpleMessage(toEmail, subject, messageContent, "");
    }

    private void sendHtmlEmail(String from, String toEmail, String subject, String htmlContent) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(from);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(htmlContent, true);
        mailSender.send(message);
    }
}