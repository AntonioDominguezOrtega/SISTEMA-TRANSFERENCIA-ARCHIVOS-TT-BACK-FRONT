package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "favorites", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "file_metadata_id"}),
        @UniqueConstraint(columnNames = {"user_id", "file_share_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Favorite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Para archivos personales (propios)
    @ManyToOne
    @JoinColumn(name = "file_metadata_id")
    private FileMetadata fileMetadata;

    // Para archivos recibidos (compartidos contigo)
    @ManyToOne
    @JoinColumn(name = "file_share_id")
    private FileShare fileShare;

    @Column(nullable = false)
    private LocalDateTime favoritedAt;

    @PrePersist
    protected void onCreate() {
        favoritedAt = LocalDateTime.now();
    }
}