package com.example.demo.repository;

import com.example.demo.model.Favorite;
import com.example.demo.model.FileMetadata;
import com.example.demo.model.FileShare;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUserOrderByFavoritedAtDesc(User user);

    Optional<Favorite> findByUserAndFileMetadata(User user, FileMetadata fileMetadata);

    Optional<Favorite> findByUserAndFileShare(User user, FileShare fileShare);

    void deleteByUserAndFileMetadata(User user, FileMetadata fileMetadata);

    void deleteByUserAndFileShare(User user, FileShare fileShare);

    @Modifying
    @Query("DELETE FROM Favorite f WHERE f.fileShare = :fileShare")
    void deleteByFileShare(@Param("fileShare") FileShare fileShare);

}