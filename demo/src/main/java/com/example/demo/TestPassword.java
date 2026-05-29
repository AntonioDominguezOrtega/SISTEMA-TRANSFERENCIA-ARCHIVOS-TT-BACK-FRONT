package com.example.demo;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        // Este es el hash que tienes en BD
        String hashFromDB = "$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG";

        // Prueba si coincide con 123456
        boolean matches = encoder.matches("123456", hashFromDB);
        System.out.println("¿Coincide 123456? " + matches);

        // Genera un NUEVO hash para 123456
        String newHash = encoder.encode("123456");
        System.out.println("Nuevo hash para 123456: " + newHash);

        // Prueba si el nuevo hash coincide
        boolean newMatches = encoder.matches("123456", newHash);
        System.out.println("¿Nuevo hash coincide? " + newMatches);
    }
}