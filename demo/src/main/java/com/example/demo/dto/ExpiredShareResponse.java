package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ExpiredShareResponse {
    private String shareId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String sharedBy;
    private LocalDateTime sharedAt;
    private LocalDateTime expiredAt;
    private String accessLevel;
    private String securityLevel;
}