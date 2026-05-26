package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class ProfileController {

    private final ProfileService profileService;

    // ==============================================================
    // 1. PERFIL DE USUARIO
    // ==============================================================

    /**
     * Obtener perfil del usuario autenticado
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        try {
            UserProfileResponse profile = profileService.getMyProfile();
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Actualizar datos del perfil
     */
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        try {
            UserProfileResponse updated = profileService.updateProfile(request);
            return ResponseEntity.ok(Map.of(
                    "message", "Perfil actualizado exitosamente",
                    "profile", updated
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Subir/actualizar foto de perfil
     */
    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadProfilePhoto(@RequestParam("photo") MultipartFile photo) {
        try {
            String photoUrl = profileService.uploadProfilePhoto(photo);
            return ResponseEntity.ok(Map.of(
                    "message", "Foto de perfil actualizada",
                    "profilePictureUrl", photoUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Eliminar foto de perfil (volver a la predeterminada)
     */
    @DeleteMapping("/photo")
    public ResponseEntity<?> deleteProfilePhoto() {
        try {
            profileService.deleteProfilePhoto();
            return ResponseEntity.ok(Map.of(
                    "message", "Foto de perfil eliminada"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener estadísticas de almacenamiento
     */
    @GetMapping("/storage")
    public ResponseEntity<?> getStorageInfo() {
        try {
            Map<String, Object> storage = profileService.getStorageInfo();
            return ResponseEntity.ok(storage);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ==============================================================
    // 2. SISTEMA DE CONTACTOS
    // ==============================================================

    /**
     * Buscar usuarios (para agregar contactos)
     * Soporta búsqueda por nombre, username, email o teléfono
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam String query,
                                         @RequestParam(defaultValue = "0") int page,
                                         @RequestParam(defaultValue = "20") int size) {
        try {
            List<UserSearchResponse> results = profileService.searchUsers(query, page, size);
            return ResponseEntity.ok(Map.of(
                    "results", results,
                    "count", results.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Autocompletado para búsqueda de contactos
     * Devuelve sugerencias mientras el usuario escribe
     */
    @GetMapping("/suggest")
    public ResponseEntity<?> suggestUsers(@RequestParam String query) {
        try {
            List<UserSearchResponse> suggestions = profileService.suggestUsers(query);
            return ResponseEntity.ok(Map.of(
                    "suggestions", suggestions
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Agregar un contacto
     */
    @PostMapping("/contacts/{userId}")
    public ResponseEntity<?> addContact(@PathVariable Long userId) {
        try {
            ContactResponse contact = profileService.addContact(userId);
            return ResponseEntity.ok(Map.of(
                    "message", "Contacto agregado exitosamente",
                    "contact", contact
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Eliminar un contacto
     */
    @DeleteMapping("/contacts/{contactId}")
    public ResponseEntity<?> removeContact(@PathVariable Long contactId) {
        try {
            profileService.removeContact(contactId);
            return ResponseEntity.ok(Map.of(
                    "message", "Contacto eliminado"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Listar todos mis contactos
     */
    @GetMapping("/contacts")
    public ResponseEntity<?> getMyContacts(@RequestParam(defaultValue = "0") int page,
                                           @RequestParam(defaultValue = "20") int size) {
        try {
            List<ContactResponse> contacts = profileService.getMyContacts(page, size);
            return ResponseEntity.ok(Map.of(
                    "contacts", contacts,
                    "count", contacts.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Buscar dentro de mis contactos (autocompletado interno)
     */
    @GetMapping("/contacts/search")
    public ResponseEntity<?> searchMyContacts(@RequestParam String query) {
        try {
            List<ContactResponse> results = profileService.searchMyContacts(query);
            return ResponseEntity.ok(Map.of(
                    "results", results
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}