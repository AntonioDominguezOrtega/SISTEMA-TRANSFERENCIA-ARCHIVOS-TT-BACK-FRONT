package com.example.demo.service;

import com.example.demo.config.TwilioConfig;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j // Habilita el logger para ver en consola si se envió el mensaje.
public class TwilioService {

    private final TwilioConfig twilioConfig;

    // Inyección de dependencias por constructor (Mejor práctica que @Autowired)
    public TwilioService(TwilioConfig twilioConfig){
        this.twilioConfig = twilioConfig;
    }

    // @PostConstruct: Se ejecuta UNA SOLA VEZ justo después de que Spring inicie este servicio.
    // Sirve para configurar el cliente estático de Twilio con tus credenciales.
    @PostConstruct
    public void init() {
        Twilio.init(twilioConfig.getAccountSid(), twilioConfig.getAuthToken());
        log.info("Twilio inicializado correctamente con Account SID: {}", twilioConfig.getAccountSid());
    }

    /**
     * Envía el código OTP al usuario.
     * @param toPhoneNumber El número del usuario (debe incluir el código de país, ej: +52...)
     * @param code El código generado (ej: "4589")
     */
    public boolean sendVerificationCode(String toPhoneNumber, String code){
        try {
            // Message.creator es el método constructor de la petición a la API de Twilio
            Message message = Message.creator(
                    new PhoneNumber(toPhoneNumber), // DESTINO (Usuario)
                    new PhoneNumber(twilioConfig.getPhoneNumber()), // ORIGEN (Tu número de Twilio)
                    "Tu codigo de verificacion es: " + code + ". Valido por 10 minutos" // CUERPO DEL MENSAJE
            ).create(); // .create() dispara la petición HTTP real a Twilio.

            log.info("SMS enviado con exito, SID del mensaje: {}", message.getSid());
            return true;
        } catch (Exception e){
            // Es importante capturar errores (ej. número inválido, falta de saldo)
            log.error("Error critico al enviar SMS a {}: {}", toPhoneNumber, e.getMessage());
            return false;
        }
    }
}
