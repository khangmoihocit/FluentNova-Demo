package com.khangmoihocit.VocabFlow.modules.game.services;

import com.khangmoihocit.VocabFlow.modules.game.dtos.request.GameSubmitRequest;
import com.khangmoihocit.VocabFlow.modules.game.dtos.response.*;

import org.springframework.data.domain.Page;

public interface GameService {

    /**
     * Generate a new Dictation Challenge game session.
     * Abandons any existing IN_PROGRESS sessions for the current user.
     *
     * @param count number of random segments (5, 10, 20, 30, or 50)
     * @return session ID and segment list
     */
    GameGenerateResponse generateDictationChallenge(int count);

    /**
     * Submit results for a completed Dictation Challenge.
     * Calculates scores via DictationScoringUtil, saves details, and marks session COMPLETED.
     *
     * @param sessionId the game session to submit for
     * @param request   array of per-segment results
     * @return final average score and per-segment breakdown
     */
    GameSubmitResponse submitDictationChallenge(Long sessionId, GameSubmitRequest request);

    /**
     * Aggregated game statistics for the current user.
     * Returns zero-defaults for users who haven't played yet.
     */
    GameStatisticsResponse getGameStatistics();

    /**
     * Paginated game history for the current user, most recent first.
     *
     * @param pageNo   1-indexed page number
     * @param pageSize items per page
     * @return paginated list of GameHistoryResponse
     */
    Page<GameHistoryResponse> getGameHistory(int pageNo, int pageSize);
    /**
     * Get detailed results for a specific game session.
     *
     * @param sessionId the game session ID
     * @return GameSessionDetailResponse with segment details
     */
    GameSessionDetailResponse getGameSessionDetails(Long sessionId);
}
