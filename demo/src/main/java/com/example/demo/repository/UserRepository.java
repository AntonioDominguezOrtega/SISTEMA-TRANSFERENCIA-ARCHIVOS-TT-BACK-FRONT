package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository // Marca la interfaz como un componente de acceso a datos de Spring.
public interface UserRepository extends JpaRepository<User, Long> {

    // --- Métodos de Búsqueda (Retrieval) ---
    // Retornan un 'Optional' para manejar de forma segura el caso en que el usuario no exista.

    // Usado por Spring Security para cargar el usuario en el Login.
    Optional<User> findByUsername(String username);

    // Útil si quieres permitir login con correo o recuperar contraseña.
    Optional<User> findByEmail(String email);

    // CPermite encontrar al usuario cuando envía su código SMS.
    Optional<User> findByPhone(String phone);

    // --- Métodos de Verificación (Validation) ---
    // Retornan true/false. Spring genera un "SELECT COUNT(*) > 0" optimizado.

    // Valida en el registro que el username esté disponible.
    Boolean existsByUsername(String username);

    // Valida en el registro que el email no esté en uso.
    Boolean existsByEmail(String email);

    // Valida en el registro que el teléfono no esté ya vinculado a otra cuenta.
    Boolean existsByPhone(String phone);

    // --- NUEVO: Buscar por token de recuperación ---
    Optional<User> findByResetPasswordToken(String Token);

    // Buscar usuarios por nombre, username, email o teléfono (para agregar contactos)
    @Query("SELECT u FROM User u WHERE " +
            "u.id != :currentUserId AND " +
            "(LOWER(u.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "u.phone LIKE CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("currentUserId") Long currentUserId,
                           @Param("search") String search,
                           Pageable pageable);
}
