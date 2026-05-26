package com.example.demo.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/*
 * @Entity: Indica a Spring que esta clase es una tabla en la base de datos.
 * @Table: Define configuraciones de la tabla SQL.
 * 'uniqueConstraints' asegura que no existan dos usuarios con el mismo
 * email, username o teléfono a nivel de base de datos.
 */
@Entity
@Table(name = "users" , uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "username"),
        @UniqueConstraint(columnNames = "phone")
})
@Data // genera getters, setters, toString, equals, hashCode
@NoArgsConstructor // constructor vacío
@AllArgsConstructor // Constructor con todos los campos
public class User {

    // --- Datos Personales ---

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;  // Llave primaria autoincrementable

    @NotBlank // Valida que el campo no sea vacio o nulo
    @Size(max = 50) // Limita la longitud para optimizar almacenamiento y validación.
    private String nombre;

    @NotBlank
    @Size(max = 50)
    private String apellido;

    @NotBlank
    @Size(max = 50)
    @Column(unique = true) // Refuerzo de unicidad en la columna
    private String username;

    @NotBlank
    @Size(max = 100)
    @Email // Valida que el formato sea texto@dominio.com
    @Column(unique = true)
    private String email;

    @NotBlank
    @Size(max = 15)
    @Column(unique = true)
    private String phone;

    @NotBlank
    @Size(max = 120)
    private String password;

    // --- Lógica de Verificación SMS (Tu requerimiento principal) ---

    // Aquí guardamos el OTP (ej. "458921") temporalmente.
    @Column(name = "verification_code")
    private String verificarionCode;

    // Fecha límite para usar el código (ej. 5 min después de crearlo).
    @Column(name = "verification_code_expires")
    private LocalDateTime verificarionCodeExpires;

    // Seguridad: Para bloquear si falla muchas veces seguidas.
    @Column(name = "verification_attempts")
    private Integer verificationAttempts = 0;

    // "false" hasta que introduzca el código SMS correcto.
    @Column(name = "is_verifed")
    private Boolean isVerifed = false;

    // --- Estado de la Cuenta ---

    // Permite banear/desactivar usuarios sin borrarlos.
    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    // --- Auditoría (Fechas automáticas) ---

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- Roles y Permisos (Seguridad) ---

    // Relación Muchos a Muchos: Un usuario puede tener varios roles (ADMIN, USER)
    // y un rol puede pertenecer a muchos usuarios.
    // FetchType.EAGER: Carga los roles inmediatamente al consultar el usuario (necesario para Spring Security).
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_roles",  // Crea una tabla intermedia llamada 'user_roles'
            joinColumns = @JoinColumn(name = "user_id"), // Llave foránea hacia User
            inverseJoinColumns = @JoinColumn(name = "role_id") // Llave foránea hacia Role
    )
    private Set<Role> roles = new HashSet<>();

    // --- Métodos de Ciclo de Vida JPA ---

    @PrePersist // Se ejecuta justo antes de guardar el registro por primera vez (INSERT)
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate // Se ejecuta justo antes de actualizar cualquier dato (UPDATE)
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /*
     * TOKEN DE RECUPERACIÓN (Para el link)
     * Se usa cuando enviamos un enlace único por correo.
     */
    @Column(name = "reset_password_token")
    private String resetPasswordToken;

    @Column(name = "reset_password_token_expires")
    private LocalDateTime resetPasswordTokenExpires;

    /*
     * CÓDIGO DE RECUPERACIÓN (Para entrada manual)
     * Se usa cuando el usuario prefiere copiar y pegar un código de 6 dígitos.
     */
    @Column(name = "reset_password_code")
    private String resetPasswordCode;

    @Column(name = "reset_password_code_expires")
    private LocalDateTime resetPasswordcCodeExpires;

    /*
     * SEGURIDAD EXTRA: Contador de intentos
     * Si alguien intenta adivinar el código muchas veces, lo bloqueamos.
     */
    @Column(name = "reset_password_attempts")
    private Integer resetPasswordAttempts = 0;

    // Foto de perfil (almacenada en Azure como blob)
    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    // Almacenamiento usado en bytes
    @Column(name = "storage_used")
    private Long storageUsed = 0L;

    // Límite de almacenamiento (1GB = 1073741824 bytes)
    @Column(name = "storage_limit")
    private Long storageLimit = 1073741824L; // 1 GB
}
