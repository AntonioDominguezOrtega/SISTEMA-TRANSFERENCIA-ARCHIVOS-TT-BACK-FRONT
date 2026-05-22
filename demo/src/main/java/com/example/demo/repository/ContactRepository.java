package com.example.demo.repository;

import com.example.demo.model.Contact;
import com.example.demo.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    // Obtener TODOS los contactos de un usuario (sin paginación)
    List<Contact> findAllByUser(User user);

    // Obtener contactos de un usuario CON paginación
    Page<Contact> findByUser(User user, Pageable pageable);

    // Obtener contactos ordenados por fecha
    List<Contact> findByUserOrderByAddedAtDesc(User user);

    // Verificar si ya es contacto
    boolean existsByUserAndContactUser(User user, User contactUser);

    // Eliminar contacto
    void deleteByUserAndContactUser(User user, User contactUser);

    // Buscar contacto específico
    Optional<Contact> findByUserAndContactUser(User user, User contactUser);

    // Buscar contactos por nombre (para autocompletado)
    @Query("SELECT c.contactUser FROM Contact c WHERE c.user = :user AND " +
            "(LOWER(c.contactUser.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.contactUser.apellido) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.contactUser.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(c.contactUser.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<User> searchContacts(@Param("user") User user, @Param("search") String search);
}