package com.khangmoihocit.VocabFlow.modules.progress.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StudySessionRequest {
    private Long videoId; // Optional

    @NotBlank(message = "Loại hoạt động không được để trống")
    private String activityType;

    @NotNull(message = "Thời lượng không được để trống")
    private Integer durationSeconds;
}
