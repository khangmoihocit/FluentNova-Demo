package com.khangmoihocit.VocabFlow.modules.game.services.impl;

import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.game.dtos.request.GameSegmentResultDto;
import com.khangmoihocit.VocabFlow.modules.game.dtos.request.GameSubmitRequest;
import com.khangmoihocit.VocabFlow.modules.game.dtos.response.*;
import com.khangmoihocit.VocabFlow.modules.game.entities.UserGameDictationDetail;
import com.khangmoihocit.VocabFlow.modules.game.entities.UserGameSession;
import com.khangmoihocit.VocabFlow.modules.game.repositories.UserGameDictationDetailRepository;
import com.khangmoihocit.VocabFlow.modules.game.repositories.UserGameSessionRepository;
import com.khangmoihocit.VocabFlow.modules.game.services.GameService;
import com.khangmoihocit.VocabFlow.modules.progress.utils.DictationScoringUtil;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoSegmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameServiceImpl implements GameService {

    private static final String GAME_TYPE_DICTATION = "DICTATION_CHALLENGE";
    private static final String STATUS_IN_PROGRESS  = "IN_PROGRESS";
    private static final String STATUS_COMPLETED     = "COMPLETED";

    private final UserGameSessionRepository sessionRepository;
    private final UserGameDictationDetailRepository detailRepository;
    private final VideoSegmentRepository videoSegmentRepository;
    private final UserRepository userRepository;

    // ─── Helpers ──────────────────────────────────────────────────

    private User getCurrentUser() {
        UserDetailsCustom userDetails = UserDetailUtil.get();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new OurException("User không tồn tại"));
    }

    // ─── Generate ────────────────────────────────────────────────

    @Override
    @Transactional
    public GameGenerateResponse generateDictationChallenge(int count) {
        User user = getCurrentUser();

        // 1. Abandon any stale IN_PROGRESS sessions for this user
        sessionRepository.abandonInProgressSessions(user.getId());

        // 2. Fetch N random segments from published videos
        List<VideoSegment> segments = videoSegmentRepository.findRandomSegments(count);

        if (segments.isEmpty()) {
            throw new OurException("Không tìm thấy đủ segment để tạo game. Vui lòng thử lại.");
        }

        // 3. Create a new session
        UserGameSession session = UserGameSession.builder()
                .user(user)
                .gameType(GAME_TYPE_DICTATION)
                .totalQuestions(segments.size())
                .status(STATUS_IN_PROGRESS)
                .build();
        session = sessionRepository.save(session);

        // 4. Map entities → DTOs (include youtubeVideoId for cross-video player switching)
        List<GameSegmentResponse> segmentDtos = segments.stream()
                .map(s -> GameSegmentResponse.builder()
                        .id(s.getId())
                        .segmentOrder(s.getSegmentOrder())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .englishText(s.getEnglishText())
                        .vietnameseTranslation(s.getVietnameseTranslation())
                        .ipa(s.getIpa())
                        .youtubeVideoId(s.getVideo().getYoutubeVideoId())
                        .build())
                .collect(Collectors.toList());

        return GameGenerateResponse.builder()
                .sessionId(session.getId())
                .gameType(GAME_TYPE_DICTATION)
                .totalQuestions(segments.size())
                .segments(segmentDtos)
                .build();
    }

    // ─── Submit ──────────────────────────────────────────────────

    @Override
    @Transactional
    public GameSubmitResponse submitDictationChallenge(Long sessionId, GameSubmitRequest request) {
        User user = getCurrentUser();

        // 1. Find session and validate ownership + status
        UserGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new OurException("Game session không tồn tại"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new OurException("Bạn không có quyền truy cập game session này");
        }
        if (!STATUS_IN_PROGRESS.equals(session.getStatus())) {
            throw new OurException("Game session đã kết thúc hoặc bị huỷ");
        }

        // 2. Pre-fetch all referenced segments for validation
        List<Long> segmentIds = request.getResults().stream()
                .map(GameSegmentResultDto::getSegmentId)
                .collect(Collectors.toList());
        Map<Long, VideoSegment> segmentMap = videoSegmentRepository.findAllById(segmentIds).stream()
                .collect(Collectors.toMap(VideoSegment::getId, s -> s));

        // 3. Calculate score for each segment and build detail entities
        List<UserGameDictationDetail> details = new ArrayList<>();
        List<GameSubmitResponse.SegmentScoreDetail> scoreDetails = new ArrayList<>();
        int totalScore = 0;

        for (GameSegmentResultDto result : request.getResults()) {
            VideoSegment segment = segmentMap.get(result.getSegmentId());
            if (segment == null) {
                throw new OurException("Segment không tồn tại: " + result.getSegmentId());
            }

            int hint  = result.getHintCount() != null ? result.getHintCount() : 0;
            int replay = result.getReplayCount() != null ? result.getReplayCount() : 0;
            int wrong  = result.getWrongSubmitCount() != null ? result.getWrongSubmitCount() : 0;

            int score = DictationScoringUtil.calculateScore(hint, replay, wrong);
            totalScore += score;

            details.add(UserGameDictationDetail.builder()
                    .session(session)
                    .segment(segment)
                    .hintCount(hint)
                    .replayCount(replay)
                    .wrongSubmitCount(wrong)
                    .segmentScore(score)
                    .build());

            scoreDetails.add(GameSubmitResponse.SegmentScoreDetail.builder()
                    .segmentId(segment.getId())
                    .segmentScore(score)
                    .hintCount(hint)
                    .replayCount(replay)
                    .wrongSubmitCount(wrong)
                    .build());
        }

        // 4. Save all details
        detailRepository.saveAll(details);

        // 5. Update session to COMPLETED
        BigDecimal avgScore = details.isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(totalScore)
                        .divide(BigDecimal.valueOf(details.size()), 2, RoundingMode.HALF_UP);

        session.setFinalAverageScore(avgScore);
        session.setStatus(STATUS_COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);

        return GameSubmitResponse.builder()
                .sessionId(sessionId)
                .finalAverageScore(avgScore)
                .segmentDetails(scoreDetails)
                .build();
    }

    // ─── Statistics ──────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public GameStatisticsResponse getGameStatistics() {
        User user = getCurrentUser();
        var projection = sessionRepository.findGameStatistics(user.getId());
        
        return GameStatisticsResponse.builder()
                .totalGames(projection.getTotalGames() != null ? projection.getTotalGames() : 0L)
                .overallAverageScore(projection.getOverallAverageScore() != null ? projection.getOverallAverageScore() : 0.0)
                .bestDictationScore(projection.getBestDictationScore() != null ? projection.getBestDictationScore() : 0.0)
                .bestShadowingScore(projection.getBestShadowingScore() != null ? projection.getBestShadowingScore() : 0.0)
                .build();
    }

    // ─── History ─────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public Page<GameHistoryResponse> getGameHistory(int pageNo, int pageSize) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(Math.max(0, pageNo - 1), pageSize);

        return sessionRepository.findGameHistory(user.getId(), pageable)
                .map(session -> GameHistoryResponse.builder()
                        .sessionId(session.getId())
                        .gameType(session.getGameType())
                        .totalQuestions(session.getTotalQuestions())
                        .finalAverageScore(session.getFinalAverageScore())
                        .createdAt(session.getCreatedAt())
                        .build());
    }

    // ─── Session Details ─────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public GameSessionDetailResponse getGameSessionDetails(Long sessionId) {
        User user = getCurrentUser();

        UserGameSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new OurException("Game session không tồn tại"));

        if (!session.getUser().getId().equals(user.getId())) {
            throw new OurException("Bạn không có quyền truy cập game session này");
        }

        List<UserGameDictationDetail> details = detailRepository.findBySessionId(sessionId);

        List<GameSessionDetailResponse.SegmentDetail> segmentDetails = details.stream()
                .map(d -> GameSessionDetailResponse.SegmentDetail.builder()
                        .segmentId(d.getSegment().getId())
                        .videoId(d.getSegment().getVideo().getId())
                        .englishText(d.getSegment().getEnglishText())
                        .segmentScore(d.getSegmentScore())
                        .hintCount(d.getHintCount())
                        .replayCount(d.getReplayCount())
                        .wrongSubmitCount(d.getWrongSubmitCount())
                        .build())
                .collect(Collectors.toList());

        return GameSessionDetailResponse.builder()
                .sessionId(session.getId())
                .gameType(session.getGameType())
                .totalQuestions(session.getTotalQuestions())
                .finalAverageScore(session.getFinalAverageScore())
                .createdAt(session.getCreatedAt())
                .segmentDetails(segmentDetails)
                .build();
    }
}
