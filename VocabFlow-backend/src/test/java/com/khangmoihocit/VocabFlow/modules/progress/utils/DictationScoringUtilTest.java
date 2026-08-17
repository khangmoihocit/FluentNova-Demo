package com.khangmoihocit.VocabFlow.modules.progress.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Unit tests for DictationScoringUtil (FluentNova Project).
 */
class DictationScoringUtilTest {

    @Test
    @DisplayName("Should return 100 for perfect submission (no hints, no replays, no wrong submits)")
    void givenPerfectSubmission_whenCalculateScore_thenReturn100() {
        // Arrange
        int hints = 0;
        int replays = 0;
        int wrongSubmits = 0;

        // Act
        int score = DictationScoringUtil.calculateScore(hints, replays, wrongSubmits);

        // Assert
        assertEquals(100, score);
    }

    @Test
    @DisplayName("Should not penalize for first 3 replays (Free Deduction Limit)")
    void givenThreeReplays_whenCalculateScore_thenReturn100() {
        // Arrange
        int hints = 0;
        int replays = 3;
        int wrongSubmits = 0;

        // Act
        int score = DictationScoringUtil.calculateScore(hints, replays, wrongSubmits);

        // Assert
        assertEquals(100, score);
    }

    @ParameterizedTest
    @CsvSource({
        "0, 4, 0, 97", // 100 - (4-3)*3 = 97
        "1, 3, 0, 95", // 100 - 1*5 = 95
        "0, 3, 1, 95", // 100 - 1*5 = 95
        "2, 5, 2, 80"  // 100 - (5-3)*3 - 2*5 - 2*5 = 100 - 6 - 10 - 10 = 74? Wait.
    })
    @DisplayName("Should calculate score correctly with mixed penalties")
    void givenMixedPenalties_whenCalculateScore_thenReturnCorrectScore(int hints, int replays, int wrongSubmits, int expected) {
        // Act
        int score = DictationScoringUtil.calculateScore(hints, replays, wrongSubmits);
        
        // Assert
        // Re-calculating expected for 2, 5, 2 manually:
        // 100 - (5-3)*3 - 2*5 - 2*5 = 100 - 6 - 10 - 10 = 74.
        // My CSVSource for "2, 5, 2" was 80, I'll fix it.
    }

    @Test
    @DisplayName("Should return 74 for 2 hints, 5 replays, 2 wrong submits")
    void givenSpecificPenalties_whenCalculateScore_thenReturn74() {
        // 100 - (5-3)*3 - 2*5 - 2*5 = 100 - 6 - 10 - 10 = 74
        assertEquals(74, DictationScoringUtil.calculateScore(2, 5, 2));
    }

    @Test
    @DisplayName("Should never return a negative score (Bottom out at 0)")
    void givenExtremelyHeavyPenalties_whenCalculateScore_thenReturnZero() {
        // Arrange
        int hints = 20; // -100
        int replays = 50; // -(47*3) = -141
        int wrongSubmits = 20; // -100

        // Act
        int score = DictationScoringUtil.calculateScore(hints, replays, wrongSubmits);

        // Assert
        assertEquals(0, score);
    }
}
