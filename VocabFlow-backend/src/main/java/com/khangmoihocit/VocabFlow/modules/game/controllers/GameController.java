package com.khangmoihocit.VocabFlow.modules.game.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.modules.game.dtos.request.GameSubmitRequest;
import com.khangmoihocit.VocabFlow.modules.game.dtos.response.GameGenerateResponse;
import com.khangmoihocit.VocabFlow.modules.game.dtos.response.GameHistoryResponse;
import com.khangmoihocit.VocabFlow.modules.game.dtos.response.GameSessionDetailResponse;
import com.khangmoihocit.VocabFlow.modules.game.dtos.response.GameStatisticsResponse;
import com.khangmoihocit.VocabFlow.modules.game.dtos.response.GameSubmitResponse;
import com.khangmoihocit.VocabFlow.modules.game.services.GameService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/games")
public class GameController {

    GameService gameService;

    /**
     * Generate a new Dictation Challenge.
     * Valid counts: 5, 10, 20, 30, 50.
     */
    @GetMapping("/dictation/generate")
    ResponseEntity<?> generateDictationChallenge(
            @RequestParam(name = "count", defaultValue = "10") int count) {

        GameGenerateResponse data = gameService.generateDictationChallenge(count);
        ApiResponse<GameGenerateResponse> response =
                ApiResponse.success(data, "Game generated successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Submit results for a completed Dictation Challenge.
     */
    @PostMapping("/dictation/submit/{sessionId}")
    ResponseEntity<?> submitDictationChallenge(
            @PathVariable Long sessionId,
            @Valid @RequestBody GameSubmitRequest request) {

        GameSubmitResponse data = gameService.submitDictationChallenge(sessionId, request);
        ApiResponse<GameSubmitResponse> response =
                ApiResponse.success(data, "Game submitted successfully");
        return ResponseEntity.ok(response);
    }

    /**
     * Aggregated game statistics for the current user.
     */
    @GetMapping("/statistics")
    ResponseEntity<?> getGameStatistics() {
        GameStatisticsResponse data = gameService.getGameStatistics();
        return ResponseEntity.ok(ApiResponse.success(data, "Game statistics retrieved"));
    }

    /**
     * Paginated game history for the current user.
     */
    @GetMapping("/history")
    ResponseEntity<?> getGameHistory(
            @RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
            @RequestParam(name = "pageSize", defaultValue = "20") int pageSize) {

        Page<GameHistoryResponse> data = gameService.getGameHistory(pageNo, pageSize);
        return ResponseEntity.ok(ApiResponse.success(data, "Game history retrieved"));
    }

    /**
     * Get detailed results for a specific game session.
     */
    @GetMapping("/history/{sessionId}")
    ResponseEntity<?> getGameSessionDetails(@PathVariable Long sessionId) {
        GameSessionDetailResponse data = gameService.getGameSessionDetails(sessionId);
        return ResponseEntity.ok(ApiResponse.success(data, "Game session details retrieved"));
    }
}
