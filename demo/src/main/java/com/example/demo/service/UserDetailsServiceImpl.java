package com.example.demo.service;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/*
 * @Service: Indica que es un componente de servicio de Spring.
 * UserDetailsService: Es la interfaz oficial de Spring Security para cargar datos de usuario.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Este método se ejecuta automáticamente cuando el usuario intenta hacer Login.
     * Spring Security pasa el nombre de usuario que se escribió en el formulario.
     */
    @Override
    @Transactional // Mantiene la sesión de base de datos abierta para cargar los Roles (Lazy Loading)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {

        // 1. Buscamos el usuario en nuestra base de datos MySQL
        User user = userRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> userRepository.findByEmail(usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Usuario no encontrado con username o email: " + usernameOrEmail)));

        // DEBUG
        log.info("=== UserDetailsServiceImpl ===");
        log.info("Usuario cargado: {}", user.getUsername());
        log.info("isVerifed: {}", user.getIsVerifed());
        log.info("isEnabled: {}", user.getIsEnabled());
        log.info("Password hash: {}", user.getPassword());

        // 2. Lo convertimos (usando el método estático 'build') al formato que Spring Security entiende
        return UserDetailsImpl.build(user);
    }
}
