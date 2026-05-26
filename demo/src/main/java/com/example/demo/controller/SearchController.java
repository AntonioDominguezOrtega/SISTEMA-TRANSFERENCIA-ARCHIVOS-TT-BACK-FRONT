package com.example.demo.controller;

import com.example.demo.dto.SearchResultResponse;
import com.example.demo.dto.SearchSuggestionResponse;
import com.example.demo.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@PreAuthorize("hasRole('USER')")
public class SearchController {

    private final SearchService searchService;

    /**
     * Búsqueda global
     * @param q Término de búsqueda
     * @param type Opcional: "personal", "shared", "all" (por defecto "all")
     * @param page Página (por defecto 0)
     * @param size Tamaño de página (por defecto 20)
     */
    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "all") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<SearchResultResponse> results = searchService.search(query, type, page, size);
            long total = searchService.getTotalCount(query, type);

            return ResponseEntity.ok(Map.of(
                    "results", results,
                    "total", total,
                    "page", page,
                    "size", size,
                    "query", query
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Autocompletado (sugerencias mientras escribe)
     */
    @GetMapping("/suggest")
    public ResponseEntity<?> suggest(@RequestParam("q") String query) {
        try {
            List<SearchSuggestionResponse> suggestions = searchService.suggest(query);
            return ResponseEntity.ok(Map.of(
                    "suggestions", suggestions,
                    "query", query
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}