package com.example.demo.repository;

import com.example.demo.model.ERole;
import com.example.demo.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {

    // Busca la entidad Role en la BD usando el Enum (ERole) como filtro.
    // Ejemplo: findByName(ERole.ROLE_USER) -> Retorna el objeto Role con id=1
    Optional<Role> findByName(ERole name);
}
