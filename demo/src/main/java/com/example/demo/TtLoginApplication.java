package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync; // <- Importa esto

@SpringBootApplication
@EnableAsync // <- Agrega esto para activar el envío de correos en 2do plano
public class TtLoginApplication {
    public static void main(String[] args) {
        SpringApplication.run(TtLoginApplication.class, args);
    }
}