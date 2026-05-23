package com.example.demo.service;

import com.example.demo.dto.*;
import com.example.demo.model.Contact;
import com.example.demo.model.FileMetadata;
import com.example.demo.model.User;
import com.example.demo.repository.ContactRepository;
import com.example.demo.repository.FileMetadataRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final FileMetadataRepository fileMetadataRepository;
    private final AzureBlobService azureBlobService;

    // Tamaño máximo de la foto de perfil (5MB)
    private static final long MAX_PHOTO_SIZE = 5 * 1024 * 1024;

    // Límite de almacenamiento (1GB)
    private static final long STORAGE_LIMIT = 1073741824L;

    // ==============================================================authenticateUser
    // 1. PERFIL DE USUARIO
    // ==============================================================

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile() {
        User user = getCurrentUser();
        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();

        // Validar que el username no esté en uso por otro usuario
        if (!user.getUsername().equals(request.getUsername()) &&
                userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }

        // Validar que el email no esté en uso por otro usuario
        if (!user.getEmail().equals(request.getEmail()) &&
                userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("El correo electrónico ya está en uso");
        }

        // Validar que el teléfono no esté en uso por otro usuario
        if (!user.getPhone().equals(request.getPhone()) &&
                userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("El número de teléfono ya está en uso");
        }

        // Actualizar datos
        user.setNombre(request.getNombre());
        user.setApellido(request.getApellido());
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());

        User updated = userRepository.save(user);

        log.info("Perfil actualizado para usuario: {}", updated.getUsername());

        return mapToProfileResponse(updated);
    }

    @Transactional
    public String uploadProfilePhoto(MultipartFile photo) {
        User user = getCurrentUser();

        // Validar tamaño
        if (photo.getSize() > MAX_PHOTO_SIZE) {
            throw new RuntimeException("La foto no puede superar los 5MB");
        }

        // Validar tipo
        String contentType = photo.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Solo se permiten archivos de imagen");
        }

        try {
            // Generar nombre único para la foto
            String extension = "";
            String originalName = photo.getOriginalFilename();
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf("."));
            }
            String blobName = "profile-photos/" + user.getId() + "_" + System.currentTimeMillis() + extension;

            // Subir a Azure
            String photoUrl = azureBlobService.uploadProfilePhoto(photo, blobName);

            // Actualizar usuario
            user.setProfilePictureUrl(photoUrl);
            userRepository.save(user);

            log.info("Foto de perfil actualizada para usuario: {}", user.getUsername());

            return getProfilePictureWithSas(photoUrl); 

        } catch (Exception e) {
            log.error("Error al subir foto de perfil: {}", e.getMessage());
            throw new RuntimeException("Error al subir la foto: " + e.getMessage());
        }
    }

    @Transactional
    public void deleteProfilePhoto() {
        User user = getCurrentUser();

        if (user.getProfilePictureUrl() != null) {
            // Eliminar de Azure (opcional, mantener la imagen por si acaso)
            // azureBlobService.deleteFile(user.getProfilePictureUrl());
            user.setProfilePictureUrl(null);
            userRepository.save(user);
            log.info("Foto de perfil eliminada para usuario: {}", user.getUsername());
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStorageInfo() {
        User user = getCurrentUser();

        // Calcular almacenamiento usado (suma de todos los archivos personales del usuario)
        Long storageUsed = calculateStorageUsed(user);

        // Actualizar el campo en la entidad (para mantenerlo actualizado)
        user.setStorageUsed(storageUsed);
        userRepository.save(user);

        double percentUsed = (storageUsed.doubleValue() / STORAGE_LIMIT) * 100;

        return Map.of(
                "storageUsed", storageUsed,
                "storageLimit", STORAGE_LIMIT,
                "storageUsedPercent", Math.min(100.0, Math.round(percentUsed * 100.0) / 100.0),
                "storageUsedFormatted", formatFileSize(storageUsed),
                "storageLimitFormatted", formatFileSize(STORAGE_LIMIT),
                "isNearLimit", storageUsed > STORAGE_LIMIT * 0.9,
                "isOverLimit", storageUsed > STORAGE_LIMIT
        );
    }

    // ==============================================================
    // 2. SISTEMA DE CONTACTOS
    // ==============================================================

    @Transactional(readOnly = true)
    public List<UserSearchResponse> searchUsers(String query, int page, int size) {
        User currentUser = getCurrentUser();

        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        Page<User> users = userRepository.searchUsers(
                currentUser.getId(),
                query.trim(),
                PageRequest.of(page, size)
        );

        // usar findAllByUser en lugar de findByUser
        List<Long> contactIds = contactRepository.findAllByUser(currentUser)
                .stream()
                .map(c -> c.getContactUser().getId())
                .collect(Collectors.toList());

        return users.getContent().stream()
                .map(user -> mapToSearchResponse(user, contactIds.contains(user.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserSearchResponse> suggestUsers(String query) {
        User currentUser = getCurrentUser();

        if (query == null || query.trim().isEmpty() || query.length() < 2) {
            return List.of();
        }

        Page<User> users = userRepository.searchUsers(
                currentUser.getId(),
                query.trim(),
                PageRequest.of(0, 10)
        );

        //  usar findAllByUser en lugar de findByUser
        List<Long> contactIds = contactRepository.findAllByUser(currentUser)
                .stream()
                .map(c -> c.getContactUser().getId())
                .collect(Collectors.toList());

        return users.getContent().stream()
                .map(user -> mapToSearchResponse(user, contactIds.contains(user.getId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public ContactResponse addContact(Long contactUserId) {
        User currentUser = getCurrentUser();

        // No puedes agregarte a ti mismo
        if (currentUser.getId().equals(contactUserId)) {
            throw new RuntimeException("No puedes agregarte a ti mismo como contacto");
        }

        // Buscar el usuario a agregar
        User contactUser = userRepository.findById(contactUserId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Verificar si ya es contacto
        if (contactRepository.existsByUserAndContactUser(currentUser, contactUser)) {
            throw new RuntimeException("Este usuario ya está en tus contactos");
        }

        // Crear contacto
        Contact contact = new Contact();
        contact.setUser(currentUser);
        contact.setContactUser(contactUser);
        contact.setAddedAt(LocalDateTime.now());

        Contact saved = contactRepository.save(contact);

        log.info("Usuario {} agregó a {} como contacto",
                currentUser.getUsername(), contactUser.getUsername());

        return mapToContactResponse(saved);
    }

    @Transactional
    public void removeContact(Long contactId) {
        User currentUser = getCurrentUser();

        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contacto no encontrado"));

        // Verificar que el contacto pertenezca al usuario
        if (!contact.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("No puedes eliminar este contacto");
        }

        contactRepository.delete(contact);

        log.info("Usuario {} eliminó a {} de sus contactos",
                currentUser.getUsername(), contact.getContactUser().getUsername());
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> getMyContacts(int page, int size) {
        User currentUser = getCurrentUser();

        Page<Contact> contacts = contactRepository.findByUser(currentUser, PageRequest.of(page, size));

        return contacts.getContent().stream()
                .map(this::mapToContactResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> searchMyContacts(String query) {
        User currentUser = getCurrentUser();

        if (query == null || query.trim().isEmpty() || query.length() < 2) {
            return List.of();
        }

        List<User> matchedUsers = contactRepository.searchContacts(currentUser, query.trim());

        return matchedUsers.stream()
                .map(user -> ContactResponse.builder()
                        .userId(user.getId())
                        .nombre(user.getNombre())
                        .apellido(user.getApellido())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .profilePictureUrl(user.getProfilePictureUrl())
                        .build())
                .collect(Collectors.toList());
    }

    // ==============================================================
    // MÉTODOS PRIVADOS AUXILIARES
    // ==============================================================

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
    }

    private String getProfilePictureWithSas(String rawUrl) {
        // Si no tiene foto, no hacemos nada
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            return null;
        }
        try {
            // Generamos un token SAS válido por 2 horas (120 minutos)
            // Cuando este tiempo expire, la URL dejará de funcionar automáticamente.
            return azureBlobService.generateSasToken(rawUrl, 120);
        } catch (Exception e) {
            log.error("Error al generar SAS token para foto: {}", e.getMessage());
            return rawUrl; // Respaldo
        }
    }

    private Long calculateStorageUsed(User user) {
        // Sumar el tamaño de todos los archivos personales del usuario
        Long total = fileMetadataRepository.findByUploadedBy(user)
                .stream()
                .filter(file -> !Boolean.TRUE.equals(file.getIsFolder()))
                .filter(file -> !Boolean.TRUE.equals(file.getIsDeleted()))
                .mapToLong(FileMetadata::getFileSize)
                .sum();

        // También sumar el tamaño de las fotos de perfil (opcional, si quieres contarlas)
        // Por ahora solo contamos archivos personales

        return total;
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes == 0) return "0 B";

        String[] units = {"B", "KB", "MB", "GB", "TB"};
        int unitIndex = 0;
        double size = bytes.doubleValue();

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return String.format("%.1f %s", size, units[unitIndex]);
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        Long storageUsed = calculateStorageUsed(user);

        return UserProfileResponse.builder()
                .id(user.getId())
                .nombre(user.getNombre())
                .apellido(user.getApellido())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profilePictureUrl(getProfilePictureWithSas(user.getProfilePictureUrl()))
                .storageUsed(storageUsed)
                .storageLimit(STORAGE_LIMIT)
                .storageUsedPercent(Math.min(100.0, (storageUsed.doubleValue() / STORAGE_LIMIT) * 100))
                .storageUsedFormatted(formatFileSize(storageUsed))
                .storageLimitFormatted(formatFileSize(STORAGE_LIMIT))
                .createdAt(user.getCreatedAt())
                .build();
    }

    private UserSearchResponse mapToSearchResponse(User user, boolean isContact) {
        return UserSearchResponse.builder()
                .id(user.getId())
                .nombre(user.getNombre())
                .apellido(user.getApellido())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profilePictureUrl(getProfilePictureWithSas(user.getProfilePictureUrl()))
                .isContact(isContact)
                .build();
    }

    private ContactResponse mapToContactResponse(Contact contact) {
        User contactUser = contact.getContactUser();
        return ContactResponse.builder()
                .contactId(contact.getId())
                .userId(contactUser.getId())
                .nombre(contactUser.getNombre())
                .apellido(contactUser.getApellido())
                .username(contactUser.getUsername())
                .email(contactUser.getEmail())
                .phone(contactUser.getPhone())
                .profilePictureUrl(getProfilePictureWithSas(contactUser.getProfilePictureUrl()))
                .addedAt(contact.getAddedAt())
                .build();
    }
}