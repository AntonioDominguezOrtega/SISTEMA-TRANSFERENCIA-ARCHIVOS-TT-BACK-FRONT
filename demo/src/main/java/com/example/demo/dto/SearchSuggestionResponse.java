package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SearchSuggestionResponse {
    private String id;
    private String name;
    private String type;      // "PERSONAL", "SHARED", "FOLDER"
    private String location;  // Ubicación resumida
    private String icon;      // "📄", "📁", "📩"
}