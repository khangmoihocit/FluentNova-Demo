package com.khangmoihocit.VocabFlow.modules.progress.dtos.response;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UserStreakResponse {
    private Integer currentStreak;
    private Integer longestStreak;
    private LocalDate lastActivityDate;
}
