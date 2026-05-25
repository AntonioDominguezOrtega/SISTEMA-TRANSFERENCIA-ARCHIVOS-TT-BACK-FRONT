package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "contacts", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "contact_user_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Usuario que agrega el contacto
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Usuario que fue agregado como contacto
    @ManyToOne
    @JoinColumn(name = "contact_user_id", nullable = false)
    private User contactUser;

    @Column(nullable = false)
    private LocalDateTime addedAt;

    private String notes;  // Notas opcionales sobre el contacto

    @PrePersist
    protected void onCreate() {
        addedAt = LocalDateTime.now();
    }
}