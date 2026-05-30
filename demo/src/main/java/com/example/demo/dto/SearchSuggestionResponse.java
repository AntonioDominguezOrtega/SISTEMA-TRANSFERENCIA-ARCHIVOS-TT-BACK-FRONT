package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SearchSuggestionResponse {
    private String id;
    private String name;
    private String type;          
    private String location;      
    private String icon;          
    private String folderId;     
    private Long fileSize;
    private String fileType;
    private String securityLevel;
    private Boolean isUnlocked;
    private Boolean isExpired;
    private String accessLevel;
    private String sharedBy;
}