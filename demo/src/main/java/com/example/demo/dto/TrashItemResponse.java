package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TrashItemResponse {
    private String id;
    private String name;
    private Boolean isFolder;
    private String folderColor;
    private String fileType;
    private Long fileSize;
    private LocalDateTime deletedAt;
    private LocalDateTime expiresAt;  // deletedAt + 7 días
    private Long daysLeft;            // días para eliminación permanente
}