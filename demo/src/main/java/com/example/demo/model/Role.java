package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Role {

    // Identificador único del rol.
    // Se usa Integer en lugar de Long porque la tabla de roles suele ser muy pequeña
    // (rara vez tendrás miles de millones de roles).
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // @Enumerated(EnumType.STRING):
    // Instruye a JPA para que guarde el NOMBRE del Enum (ej. "ROLE_ADMIN") como texto en la base de datos,
    // en lugar de guardar su posición numérica (0, 1). Esto es mucho más seguro y legible.
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ERole name;

    // Constructor auxiliar:
    // Permite crear un rol rápidamente solo con su nombre, sin preocuparse por el ID
    // (ya que el ID lo genera la base de datos).
    public Role(ERole name) {
        this.name = name;
    }
}
