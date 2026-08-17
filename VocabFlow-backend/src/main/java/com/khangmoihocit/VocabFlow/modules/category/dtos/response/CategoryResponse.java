package com.khangmoihocit.VocabFlow.modules.category.dtos.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CategoryResponse {
    private Long id;
    private String name;
    private String description;
    private String iconUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
