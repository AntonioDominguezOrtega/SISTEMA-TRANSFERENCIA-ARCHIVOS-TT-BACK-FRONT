package com.example.demo.service;

import com.example.demo.dto.SearchResultResponse;
import com.example.demo.dto.SearchSuggestionResponse;
import com.example.demo.model.FileMetadata;
import com.example.demo.model.FileShare;
import com.example.demo.model.User;
import com.example.demo.repository.FileMetadataRepository;
import com.example.demo.repository.FileShareRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final FileMetadataRepository fileMetadataRepository;
    private final FileShareRepository fileShareRepository;
    private final UserRepository userRepository;

    private static final int MAX_SUGGESTIONS = 10;

    // ==============================================================
    // BÚSQUEDA GLOBAL
    // ==============================================================

    @Transactional(readOnly = true)
    public List<SearchResultResponse> search(String query, String type, int page, int size) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        User currentUser = getCurrentUser();
        String searchTerm = query.trim().toLowerCase();

        List<SearchResultResponse> results = new ArrayList<>();

        // 1. Buscar en archivos PERSONALES (propios)
        if (type.equals("personal") || type.equals("all")) {
            results.addAll(searchPersonalFiles(currentUser, searchTerm));
        }

        // 2. Buscar en archivos COMPARTIDOS (recibidos)
        if (type.equals("shared") || type.equals("all")) {
            results.addAll(searchSharedFiles(currentUser, searchTerm));
        }

        // 3. Ordenar por fecha (más reciente primero)
        results.sort((a, b) -> b.getDate().compareTo(a.getDate()));

        // 4. Aplicar paginación
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, results.size());

        if (fromIndex >= results.size()) {
            return List.of();
        }

        return results.subList(fromIndex, toIndex);
    }

    @Transactional(readOnly = true)
    public long getTotalCount(String query, String type) {
        if (query == null || query.trim().isEmpty()) {
            return 0;
        }

        User currentUser = getCurrentUser();
        String searchTerm = query.trim().toLowerCase();

        long count = 0;

        if (type.equals("personal") || type.equals("all")) {
            count += countPersonalFiles(currentUser, searchTerm);
        }

        if (type.equals("shared") || type.equals("all")) {
            count += countSharedFiles(currentUser, searchTerm);
        }

        return count;
    }

    // ==============================================================
    // AUTOCOMPLETADO
    // ==============================================================

    @Transactional(readOnly = true)
    public List<SearchSuggestionResponse> suggest(String query) {
        if (query == null || query.trim().isEmpty() || query.length() < 2) {
            return List.of();
        }

        User currentUser = getCurrentUser();
        String searchTerm = query.trim().toLowerCase();

        Set<SearchSuggestionResponse> suggestions = new LinkedHashSet<>();

        // Sugerencias de archivos personales
        suggestions.addAll(suggestPersonalFiles(currentUser, searchTerm));

        // Sugerencias de archivos compartidos
        suggestions.addAll(suggestSharedFiles(currentUser, searchTerm));

        // Limitar a MAX_SUGGESTIONS
        return suggestions.stream()
                .limit(MAX_SUGGESTIONS)
                .collect(Collectors.toList());
    }

    // ==============================================================
    // MÉTODOS PRIVADOS - ARCHIVOS PERSONALES
    // ==============================================================

    private List<SearchResultResponse> searchPersonalFiles(User user, String searchTerm) {
        // Obtener todos los archivos personales del usuario (no eliminados)
        List<FileMetadata> personalFiles = fileMetadataRepository.findByUploadedBy(user)
                .stream()
                .filter(file -> !Boolean.TRUE.equals(file.getIsDeleted()))
                .collect(Collectors.toList());

        return personalFiles.stream()
                .filter(file -> matchesSearch(file, searchTerm, user))
                .map(file -> mapPersonalToResult(file, user))
                .collect(Collectors.toList());
    }

    private long countPersonalFiles(User user, String searchTerm) {
        return fileMetadataRepository.findByUploadedBy(user)
                .stream()
                .filter(file -> !Boolean.TRUE.equals(file.getIsDeleted()))
                .filter(file -> matchesSearch(file, searchTerm, user))
                .count();
    }

    private List<SearchSuggestionResponse> suggestPersonalFiles(User user, String searchTerm) {
        List<FileMetadata> personalFiles = fileMetadataRepository.findByUploadedBy(user)
                .stream()
                .filter(file -> !Boolean.TRUE.equals(file.getIsDeleted()))
                .collect(Collectors.toList());

        return personalFiles.stream()
                .filter(file -> file.getFileName().toLowerCase().contains(searchTerm))
                .limit(5)
                .map(this::mapPersonalToSuggestion)
                .collect(Collectors.toList());
    }

    private boolean matchesSearch(FileMetadata file, String searchTerm, User user) {
        // Buscar por nombre del archivo
        if (file.getFileName().toLowerCase().contains(searchTerm)) {
            return true;
        }

        // Buscar por ruta de carpeta (si tiene)
        if (file.getParentFolder() != null) {
            String folderPath = getFolderPath(file.getParentFolder());
            if (folderPath.toLowerCase().contains(searchTerm)) {
                return true;
            }
        }

        return false;
    }

    private String getFolderPath(FileMetadata folder) {
        List<String> pathParts = new ArrayList<>();
        FileMetadata current = folder;

        while (current != null) {
            pathParts.add(0, current.getFileName());
            current = current.getParentFolder();
        }

        return String.join(" > ", pathParts);
    }

    // ==============================================================
    // MÉTODOS PRIVADOS - ARCHIVOS COMPARTIDOS (RECIBIDOS)
    // ==============================================================

    private List<SearchResultResponse> searchSharedFiles(User user, String searchTerm) {
        // Obtener archivos compartidos con el usuario (activos y expirados)
        List<FileShare> shares = fileShareRepository.findAll().stream()
                .filter(share -> share.getSharedWith() != null &&
                        share.getSharedWith().getId().equals(user.getId()))
                .collect(Collectors.toList());

        return shares.stream()
                .filter(share -> matchesSearch(share, searchTerm))
                .map(this::mapSharedToResult)
                .collect(Collectors.toList());
    }

    private long countSharedFiles(User user, String searchTerm) {
        return fileShareRepository.findAll().stream()
                .filter(share -> share.getSharedWith() != null &&
                        share.getSharedWith().getId().equals(user.getId()))
                .filter(share -> matchesSearch(share, searchTerm))
                .count();
    }

    private List<SearchSuggestionResponse> suggestSharedFiles(User user, String searchTerm) {
        List<FileShare> shares = fileShareRepository.findAll().stream()
                .filter(share -> share.getSharedWith() != null &&
                        share.getSharedWith().getId().equals(user.getId()))
                .collect(Collectors.toList());

        return shares.stream()
                .filter(share -> {
                    String fileName = share.getFile().getFileName().toLowerCase();
                    String subject = share.getSubject() != null ? share.getSubject().toLowerCase() : "";
                    String sharedByName = share.getSharedBy().getNombre().toLowerCase() + " " +
                            share.getSharedBy().getApellido().toLowerCase();
                    String sharedWithName = share.getSharedWith() != null ? share.getSharedWith().getNombre().toLowerCase() + " " + share.getSharedWith().getApellido().toLowerCase() : "";

                    return fileName.contains(searchTerm) ||
                            subject.contains(searchTerm) ||
                            sharedByName.contains(searchTerm) ||
                            sharedWithName.contains(searchTerm);
                })
                .limit(5)
                .map(share -> mapSharedToSuggestion(share, user)) // PASAMOS EL USER AQUÍ
                .collect(Collectors.toList());
    }


    private boolean matchesSearch(FileShare share, String searchTerm) {
        String fileName = share.getFile().getFileName().toLowerCase();
        String subject = share.getSubject() != null ? share.getSubject().toLowerCase() : "";
        String sharedByName = (share.getSharedBy().getNombre() + " " + share.getSharedBy().getApellido()).toLowerCase();

        return fileName.contains(searchTerm) ||
                subject.contains(searchTerm) ||
                sharedByName.contains(searchTerm);
    }

    // ==============================================================
    // MÉTODOS DE MAPEO
    // ==============================================================

    private SearchResultResponse mapPersonalToResult(FileMetadata file, User user) {
        String location = "📁 Mis archivos";
        if (file.getParentFolder() != null) {
            location = "📁 " + getFolderPath(file.getParentFolder());
        }

        // Verificar si el archivo está desbloqueado (para mostrar candado)
        boolean isUnlocked = true;
        String securityLevel = "PUBLIC";

        if (!Boolean.TRUE.equals(file.getIsFolder())) {
            Optional<FileShare> personalShare = fileShareRepository.findByFile_IdAndSharedWith(file.getId(), user);
            if (personalShare.isPresent()) {
                FileShare fs = personalShare.get();
                securityLevel = fs.getSecurityLevel().toString();
                isUnlocked = fs.getIsUnlocked() != null && fs.getIsUnlocked() &&
                        fs.getUnlockedUntil() != null && fs.getUnlockedUntil().isAfter(LocalDateTime.now());
            }
        }

        return SearchResultResponse.builder()
                .id(file.getId())
                .name(file.getFileName())
                .type(file.getIsFolder() ? "FOLDER" : "PERSONAL")
                .location(location)
                .subject(null)
                .sharedBy(null)
                .fileSize(file.getFileSize())
                .fileType(file.getFileType())
                .date(file.getUploadedAt())
                .isUnlocked(isUnlocked)
                .isExpired(false)
                .thumbnail(null)
                .folderId(file.getParentFolder() != null ? file.getParentFolder().getId() : null)
                .securityLevel(securityLevel)
                .isFolder(file.getIsFolder())
                .build();
    }

    private SearchResultResponse mapSharedToResult(FileShare share) {
        FileMetadata file = share.getFile();
        boolean isExpired = share.getExpiresAt() != null && share.getExpiresAt().isBefore(LocalDateTime.now());
        boolean isUnlocked = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                share.getUnlockedUntil() != null && share.getUnlockedUntil().isAfter(LocalDateTime.now());

        String location = "📩 Recibido de: " + share.getSharedBy().getNombre() + " " + share.getSharedBy().getApellido();

        return SearchResultResponse.builder()
                .id(share.getId())
                .name(file.getFileName())
                .type("SHARED")
                .location(location)
                .subject(share.getSubject())
                .sharedBy(share.getSharedBy().getNombre() + " " + share.getSharedBy().getApellido())
                .fileSize(file.getFileSize())
                .fileType(file.getFileType())
                .date(share.getSharedAt())
                .isUnlocked(isUnlocked)
                .isExpired(isExpired)
                .thumbnail(null)
                .folderId(null)
                .securityLevel(share.getSecurityLevel().toString())
                .isFolder(false)
                .build();
    }

    private SearchSuggestionResponse mapPersonalToSuggestion(FileMetadata file) {
        String type;
        String icon;
        String location;

        // Recuperamos la lógica para detectar si está en papelera, es carpeta o archivo normal
        if (Boolean.TRUE.equals(file.getIsDeleted())) {
            type = "TRASH";
            icon = "🗑️";
            location = "Papelera";
        } else if (Boolean.TRUE.equals(file.getIsFolder())) {
            type = "FOLDER";
            icon = "📁";
            location = "Mis archivos";
        } else {
            type = "PERSONAL";
            icon = "📄";
            location = file.getParentFolder() != null ? getFolderPath(file.getParentFolder()) : "Mis archivos";
        }

        return SearchSuggestionResponse.builder()
                .id(file.getId())
                .name(file.getFileName())
                .type(type)
                .location(location)
                .icon(icon)
                .fileSize(file.getFileSize())
                .fileType(file.getFileType())
                .securityLevel("PUBLIC")
                .isUnlocked(true)
                .isExpired(false)
                .accessLevel("DOWNLOAD")
                .sharedBy(null)
                .folderId(file.getParentFolder() != null ? file.getParentFolder().getId() : null)
                .build();
    }

    // Se agrega 'User currentUser' a los parámetros para arreglar el error del IDE
    private SearchSuggestionResponse mapSharedToSuggestion(FileShare share, User currentUser) {
        FileMetadata file = share.getFile();
        boolean isExpired = share.getExpiresAt() != null && share.getExpiresAt().isBefore(LocalDateTime.now());
        boolean isUnlocked = share.getIsUnlocked() != null && share.getIsUnlocked() &&
                share.getUnlockedUntil() != null && share.getUnlockedUntil().isAfter(LocalDateTime.now());

        // Recuperamos la lógica para saber si el usuario actual lo envió o lo recibió
        boolean isSent = share.getSharedBy().getId().equals(currentUser.getId());
        String type = isSent ? "SENT" : "SHARED";
        String location = isSent && share.getSharedWith() != null ? "Para: " + share.getSharedWith().getNombre() : "De: " + share.getSharedBy().getNombre();
        String icon = isSent ? "📤" : "📩";

        return SearchSuggestionResponse.builder()
                .id(share.getId())
                .name(file.getFileName())
                .type(type)
                .location(location)
                .icon(icon)
                .fileSize(file.getFileSize())
                .fileType(file.getFileType())
                .securityLevel(share.getSecurityLevel().toString())
                .isUnlocked(isUnlocked)
                .isExpired(isExpired)
                .accessLevel(share.getAccessLevel() != null ? share.getAccessLevel().toString() : "DOWNLOAD")
                .sharedBy(share.getSharedBy().getNombre() + " " + share.getSharedBy().getApellido())
                .build();
    }

    // ==============================================================
    // MÉTODOS AUXILIARES
    // ==============================================================

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }
}