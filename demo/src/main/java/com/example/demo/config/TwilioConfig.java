package com.example.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration // Indica que esta clase define beans o configuraciones de Spring.
@ConfigurationProperties(prefix = "twilio") // MAGIA: Busca en properties todo lo que empiece con "twilio."
@Data // Genera getters y setters automáticamente (necesarios para que Spring inyecte los valores).
public class TwilioConfig {

    // Spring buscará "twilio.account-sid" y lo guardará aquí automáticamente.
    private String accountSid;

    // Spring buscará "twilio.auth-token"
    private String authToken;

    // Spring buscará "twilio.phone-number"
    private String phoneNumber;
}
