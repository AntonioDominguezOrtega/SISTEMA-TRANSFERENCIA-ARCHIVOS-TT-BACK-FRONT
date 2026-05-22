package com.example.demo.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * SERVICIO DE CRIPTOGRAFÍA (AES-256 GCM)
 * Implementa el patrón "Envelope Encryption" para proteger los archivos.
 */
@Service
@Slf4j
public class EncryptionService {

    // El estándar más seguro actualmente (Autenticado y Encriptado)
    private static final String AES_ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int AES_KEY_SIZE = 256;
    private static final int IV_SIZE = 12;

    // SecureRandom usa la entropía del sistema operativo, mucho más seguro que Math.random()
    private final SecureRandom secureRandom = new SecureRandom();

    // LLAVE MAESTRA: Se lee del properties. Nunca debe estar en el código fuente.
    @Value("${app.encryption.master-key}")
    private String masterKeyBase64;

    /**
     * PASO 1: Cuando el usuario sube un archivo, le creamos una llave AES única solo para ese archivo.
     */
    public SecretKey generateAesKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(AES_KEY_SIZE, secureRandom);
        return keyGen.generateKey();
    }

    /**
     * VECTOR DE INICIALIZACIÓN (IV)
     * Es como la "sal" de las contraseñas. Asegura que si subes dos archivos iguales,
     * el resultado cifrado sea totalmente diferente.
     */
    public byte[] generateIv() {
        byte[] iv = new byte[IV_SIZE];
        return iv;
    }

    /**
     * CIFRAR DATOS: Toma el archivo en bytes y lo convierte en un desorden ilegible.
     */
    public String encrypt(byte[] data, SecretKey key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, key, gcmSpec);

        byte[] encryptedData = cipher.doFinal(data);
        return Base64.getEncoder().encodeToString(encryptedData);
    }

    /**
     * DESCIFRAR DATOS: Toma el texto ilegible, la llave y el IV, y devuelve el archivo original.
     */
    public byte[] decrypt(String encryptedDataBase64, SecretKey key, byte[] iv) throws Exception {
        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, key, gcmSpec);

        byte[] encryptedData = Base64.getDecoder().decode(encryptedDataBase64);
        return cipher.doFinal(encryptedData);
    }

    /**
     * ENVELOPE ENCRYPTION (Guardar la llave):
     * No podemos guardar la llave del archivo en texto plano en la BD.
     * Así que ciframos la llave del archivo usando la Llave Maestra del Servidor.
     */
    public String encryptAesKey(SecretKey aesKey) throws Exception {
        SecretKey masterKey = getMasterKey();
        byte[] iv = generateIv();

        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.ENCRYPT_MODE, masterKey, gcmSpec);

        byte[] encryptedKey = cipher.doFinal(aesKey.getEncoded());

        // Juntamos IV + Llave Cifrada para guardarlo en un solo campo en la BD (encryptedAesKey)
        byte[] combined = new byte[iv.length + encryptedKey.length];
        System.arraycopy(iv, 0, combined, 0, iv.length);
        System.arraycopy(encryptedKey, 0, combined, iv.length, encryptedKey.length);

        return Base64.getEncoder().encodeToString(combined);
    }

    /**
     * ENVELOPE ENCRYPTION (Recuperar la llave):
     * Extrae el IV, y usa la Llave Maestra para revelar la llave del archivo.
     */
    public SecretKey decryptAesKey(String encryptedAesKeyBase64) throws Exception {
        SecretKey masterKey = getMasterKey();
        byte[] combined = Base64.getDecoder().decode(encryptedAesKeyBase64);

        byte[] iv = new byte[IV_SIZE];
        byte[] encryptedKey = new byte[combined.length - IV_SIZE];
        System.arraycopy(combined, 0, iv, 0, IV_SIZE);
        System.arraycopy(combined, IV_SIZE, encryptedKey, 0, encryptedKey.length);

        Cipher cipher = Cipher.getInstance(AES_ALGORITHM);
        GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
        cipher.init(Cipher.DECRYPT_MODE, masterKey, gcmSpec);

        byte[] decryptedKey = cipher.doFinal(encryptedKey);
        return new SecretKeySpec(decryptedKey, "AES");

    }

    /**
     * Obtiene la llave maestra del servidor desde Base64.
     */
    private SecretKey getMasterKey() {
        byte[] decodeKey = Base64.getDecoder().decode(masterKeyBase64);
        return new SecretKeySpec(decodeKey, "AES");
    }

    /**
     * TOKEN DE SEGURIDAD SMS
     * Genera el código para la pantalla de desbloqueo (Flujo: 2 -> 3).
     */
    public String generateSmsToken() {
        int token = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(token);
    }
}
