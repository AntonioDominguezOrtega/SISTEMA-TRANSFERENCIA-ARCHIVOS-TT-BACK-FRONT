package com.example.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    // @NotBlank: Rechaza null, cadenas vacías "" o espacios en blanco " ".
    // message: Es el error que verá el usuario si falla la validación.
    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 50)
    private String nombre;

    @NotBlank(message = "El apellido es obligatorio")
    @Size(min = 2, max = 50)
    private String apellido;

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 20)
    private String username;

    @NotBlank(message = "El correo electronico es obligatorio")
    @Email(message = "El correo electronico debe de ser valido") // Verifica formato texto@dominio.com
    private String email;

    // Validación de Teléfono con Expresión Regular (Regex)
    // ^         : Inicio de la cadena.
    // \\+?      : Puede tener un símbolo '+' al inicio (opcional).
    // [1-9]     : El primer dígito no puede ser 0.
    // \\d{1,14} : Seguido de entre 1 y 14 dígitos numéricos (Estándar E.164 internacional).
    // $         : Fin de la cadena.
    @NotBlank(message = "El numero telefonico es obligatorio")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Número de teléfono inválido")
    private String phone;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, max = 40)
    private String password;

    // Este campo SOLO existe en el DTO, no en la Base de Datos.
    // Sirve para comparar que el usuario escribió bien su clave,
    // pero no necesitamos guardarlo en la entidad User.
    @NotBlank(message = "Debe confirmar la contraseña")
    @Size(min = 6, max = 40)
    private String confirmPassword;

}
