package com.example.demo.service;

import com.example.demo.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

/*
 * Esta clase implementa la interfaz 'UserDetails' de Spring Security.
 * Funciona como un envoltorio (wrapper) seguro alrededor de nuestra entidad 'User'.
 * Permite que Spring Security maneje la autenticación sin conocer los detalles
 * específicos de nuestra base de datos.
 */
@Data
@AllArgsConstructor
public class UserDetailsImpl implements UserDetails {

    // Identificador interno para referencia (no es parte de la interfaz UserDetails, pero es útil tenerlo)
    private Long id;

    private String username;

    private String email;

    // Agrega el campo profilePictureUrl
    private String profilePictureUrl;

    // @JsonIgnore: CRÍTICO. Evita que la contraseña (incluso encriptada)
    // se envíe en la respuesta JSON si alguna vez devolvemos este objeto al frontend.
    @JsonIgnore
    private String password;

    // Lista de permisos/roles que tiene el usuario.
    // Spring Security usa esto para decidir si puedes entrar a /admin o no.
    private Collection<? extends GrantedAuthority> authorities;

    /**
     * MÉTODO DE CONSTRUCCIÓN (Factory Method)
     * Convierte un objeto de base de datos 'User' en un objeto 'UserDetailsImpl'
     * que Spring Security pueda entender.
     */
    public static UserDetailsImpl build(User user) {
        // Convertimos los Roles (Set<Role>) a GrantedAuthority (formato de Spring Security)
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName().name())) // Ej: ROLE_USER -> SimpleGrantedAuthority
                .collect(Collectors.toList());

        return new UserDetailsImpl(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                user.getProfilePictureUrl(),  // ← NUEVO
                authorities
        );
    }

    // --- Métodos obligatorios de la interfaz UserDetails ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    /*
     * Los siguientes métodos controlan el estado de la cuenta a nivel de Spring Security.
     * En este caso devolvemos 'true' (habilitado) por defecto, ya que nosotros
     * manejamos la lógica de validación (SMS) y bloqueo de forma personalizada
     * en el AuthService, no aquí.
     */

    @Override
    public boolean isAccountNonExpired() {
        return true; // La cuenta nunca expira por tiempo
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // La cuenta no está bloqueada por Spring (lo manejamos nosotros con verificationAttempts)
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // La contraseña nunca expira
    }

    @Override
    public boolean isEnabled() {
        return true; // El usuario está habilitado (lo manejamos con isVerified)
    }

}
