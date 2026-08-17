package com.khangmoihocit.VocabFlow.modules.progress.services.impl;

import com.khangmoihocit.VocabFlow.core.constants.LearningActivityTypes;
import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.progress.utils.DictationScoringUtil;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.StudySessionRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.UpdateProgressRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.UserStreakResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.UserVideoProgressResponse;
import com.khangmoihocit.VocabFlow.modules.progress.entities.StudySession;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserStreak;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserVideoProgress;
import com.khangmoihocit.VocabFlow.modules.progress.mappers.ProgressMapper;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.StudySessionRepository;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserStreakRepository;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserVideoProgressRepository;
import com.khangmoihocit.VocabFlow.modules.progress.services.ProgressService;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoLessonRepository;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.DictationAutosaveRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.SegmentScoreDto;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.DictationAutosaveResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.ShadowingAutosaveRequest;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.request.ShadowingSegmentScoreDto;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.ShadowingAutosaveResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.UserSegmentAttempt;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.UserFavoriteVideoRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.UserSegmentAttemptRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoSegmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningStatisticsResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningHistoryResponse;

@Service
@RequiredArgsConstructor
public class ProgressServiceImpl implements ProgressService {

    private final UserVideoProgressRepository progressRepository;
    private final StudySessionRepository studySessionRepository;
    private final UserStreakRepository streakRepository;
    private final UserRepository userRepository;
    private final VideoLessonRepository videoLessonRepository;
    private final VideoSegmentRepository videoSegmentRepository;
    private final UserSegmentAttemptRepository userSegmentAttemptRepository;
    private final UserFavoriteVideoRepository userFavoriteVideoRepository;
    private final ProgressMapper progressMapper;

    private User getCurrentUser() {
        UserDetailsCustom userDetails = UserDetailUtil.get();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new OurException("User không tồn tại"));
    }

    @Override
    @Transactional
    public UserVideoProgressResponse updateVideoProgress(UpdateProgressRequest request) {
        User user = getCurrentUser();
        VideoLesson videoLesson = videoLessonRepository.findById(request.getVideoId())
                .orElseThrow(() -> new OurException("Không tìm thấy Video Lesson"));

        UserVideoProgress progress = progressRepository.findByUserIdAndVideoLessonId(user.getId(), videoLesson.getId())
                .orElse(UserVideoProgress.builder().user(user).videoLesson(videoLesson).build());

        if (request.getAvgDictationScore() != null)
            progress.setAvgDictationScore(request.getAvgDictationScore());
        if (request.getAvgShadowingScore() != null)
            progress.setAvgShadowingScore(request.getAvgShadowingScore());
        if (request.getAvgFillBlankScore() != null)
            progress.setAvgFillBlankScore(request.getAvgFillBlankScore());
        if (request.getAvgQuizScore() != null)
            progress.setAvgQuizScore(request.getAvgQuizScore());
        if (request.getCompletionPercentage() != null)
            progress.setCompletionPercentage(request.getCompletionPercentage());
        if (request.getDictationTimeSeconds() != null)
            progress.setDictationTimeSeconds(request.getDictationTimeSeconds());
        if (request.getShadowingTimeSeconds() != null)
            progress.setShadowingTimeSeconds(request.getShadowingTimeSeconds());
        if (request.getVideoWatchTimeSeconds() != null)
            progress.setVideoWatchTimeSeconds(request.getVideoWatchTimeSeconds());
        if (request.getFillBlankTimeSeconds() != null)
            progress.setFillBlankTimeSeconds(request.getFillBlankTimeSeconds());
        if (request.getQuizTimeSeconds() != null)
            progress.setQuizTimeSeconds(request.getQuizTimeSeconds());
        if (request.getStatus() != null)
            progress.setStatus(request.getStatus());
        if (request.getIsMastered() != null)
            progress.setIsMastered(request.getIsMastered());
        if (request.getFillBlankCompleted() != null)
            progress.setFillBlankCompleted(request.getFillBlankCompleted());
        if (request.getQuizCompleted() != null) {
            progress.setQuizCompleted(request.getQuizCompleted());
            progress.setIsQuizCompleted(request.getQuizCompleted());
        }

        progress.setTotalLearningTime(
                safeInt(progress.getDictationTimeSeconds()) +
                        safeInt(progress.getShadowingTimeSeconds()) +
                        safeInt(progress.getVideoWatchTimeSeconds()) +
                        safeInt(progress.getFillBlankTimeSeconds()) +
                        safeInt(progress.getQuizTimeSeconds()));

        return progressMapper.toProgressResponse(progressRepository.save(progress));
    }

    @Override
    @Transactional
    public DictationAutosaveResponse autosaveDictationProgress(DictationAutosaveRequest request) {
        User user = getCurrentUser();
        Long videoId = request.getVideoId();

        VideoLesson videoLesson = videoLessonRepository.findById(videoId)
                .orElseThrow(() -> new OurException("Không tìm thấy Video Lesson"));

        // Save incoming segment scores
        List<Long> incomingSegmentIds = request.getSegments().stream()
                .map(SegmentScoreDto::getSegmentId)
                .collect(Collectors.toList());

        List<UserSegmentAttempt> existingAttempts = userSegmentAttemptRepository
                .findByUserIdAndSegmentIdIn(user.getId(), incomingSegmentIds);
        Map<Long, UserSegmentAttempt> attemptMap = existingAttempts.stream()
                .collect(Collectors.toMap(a -> a.getSegment().getId(), a -> a));

        for (SegmentScoreDto segmentDto : request.getSegments()) {
            UserSegmentAttempt attempt = attemptMap.get(segmentDto.getSegmentId());

            // Read penalty metrics from frontend payload (default to 0 if null)
            int hintCount = segmentDto.getHintCount() != null ? segmentDto.getHintCount() : 0;
            int replayCount = segmentDto.getReplayCount() != null ? segmentDto.getReplayCount() : 0;
            int wrongSubmitCount = segmentDto.getWrongSubmitCount() != null ? segmentDto.getWrongSubmitCount() : 0;

            // Shared penalty-based scoring via utility
            int dictationScore = DictationScoringUtil.calculateScore(hintCount, replayCount, wrongSubmitCount);

            if (attempt == null) {
                VideoSegment segment = videoSegmentRepository.findById(segmentDto.getSegmentId())
                        .orElseThrow(
                                () -> new OurException("Không tìm thấy Video Segment " + segmentDto.getSegmentId()));
                attempt = UserSegmentAttempt.builder()
                        .user(user)
                        .segment(segment)
                        .dictationScore(dictationScore)
                        .dictationUserText(segmentDto.getDictationUserText())
                        .hintCount(hintCount)
                        .replayCount(replayCount)
                        .wrongSubmitCount(wrongSubmitCount)
                        .build();
            } else {
                attempt.setDictationScore(dictationScore);
                if (segmentDto.getDictationUserText() != null) {
                    attempt.setDictationUserText(segmentDto.getDictationUserText());
                }
                attempt.setHintCount(hintCount);
                attempt.setReplayCount(replayCount);
                attempt.setWrongSubmitCount(wrongSubmitCount);
            }
            userSegmentAttemptRepository.save(attempt);
        }

        userSegmentAttemptRepository.flush(); // Ensure queries run properly below

        // Aggregation Logic
        int completedSegments = userSegmentAttemptRepository.countCompletedDictationSegments(user.getId(), videoId);
        int totalSegments = videoSegmentRepository.countByVideoId(videoId);

        UserVideoProgress progress = progressRepository.findByUserIdAndVideoLessonId(user.getId(), videoId)
                .orElse(UserVideoProgress.builder().user(user).videoLesson(videoLesson).build());

        progress.setCompletedDictationSegments(completedSegments);
        progress.setLastStudiedAt(LocalDateTime.now());

        if (request.getStudyTimeSeconds() != null && request.getStudyTimeSeconds() > 0) {
            progress.setDictationTimeSeconds(
                    (progress.getDictationTimeSeconds() != null ? progress.getDictationTimeSeconds() : 0)
                            + request.getStudyTimeSeconds());
            progress.setTotalLearningTime(
                    (progress.getTotalLearningTime() != null ? progress.getTotalLearningTime() : 0)
                            + request.getStudyTimeSeconds());
            recordStudySessionAndStreak(user, videoLesson, LearningActivityTypes.DICTATION, request.getStudyTimeSeconds());
        }

        boolean isCompleted = false;
        BigDecimal avgScore = BigDecimal.ZERO;

        if (totalSegments > 0 && completedSegments >= totalSegments) {
            avgScore = userSegmentAttemptRepository.getAverageDictationScore(user.getId(), videoId);
            progress.setAvgDictationScore(avgScore);
            progress.setIsDictationCompleted(true);
            isCompleted = true;
        }

        updateProgressStatus(progress);
        progressRepository.save(progress);

        return DictationAutosaveResponse.builder()
                .isDictationCompleted(isCompleted)
                .completedSegments(completedSegments)
                .avgScore(avgScore)
                .build();
    }

    @Override
    @Transactional
    public ShadowingAutosaveResponse autosaveShadowingProgress(ShadowingAutosaveRequest request) {
        User user = getCurrentUser();
        Long videoId = request.getVideoId();

        VideoLesson videoLesson = videoLessonRepository.findById(videoId)
                .orElseThrow(() -> new OurException("Không tìm thấy Video Lesson"));

        // Save incoming segment scores
        List<Long> incomingSegmentIds = request.getSegments().stream()
                .map(ShadowingSegmentScoreDto::getSegmentId)
                .collect(Collectors.toList());

        List<UserSegmentAttempt> existingAttempts = userSegmentAttemptRepository
                .findByUserIdAndSegmentIdIn(user.getId(), incomingSegmentIds);
        Map<Long, UserSegmentAttempt> attemptMap = existingAttempts.stream()
                .collect(Collectors.toMap(a -> a.getSegment().getId(), a -> a));

        for (ShadowingSegmentScoreDto segmentDto : request.getSegments()) {
            UserSegmentAttempt attempt = attemptMap.get(segmentDto.getSegmentId());
            if (attempt == null) {
                VideoSegment segment = videoSegmentRepository.findById(segmentDto.getSegmentId())
                        .orElseThrow(
                                () -> new OurException("Không tìm thấy Video Segment " + segmentDto.getSegmentId()));
                attempt = UserSegmentAttempt.builder()
                        .user(user)
                        .segment(segment)
                        .shadowingScore(segmentDto.getShadowingScore())
                        .shadowingUserText(segmentDto.getShadowingUserText())
                        .build();
            } else {
                attempt.setShadowingScore(segmentDto.getShadowingScore());
                if (segmentDto.getShadowingUserText() != null) {
                    attempt.setShadowingUserText(segmentDto.getShadowingUserText());
                }
            }
            // Update mastered status
            int currentDictScore = attempt.getDictationScore() != null ? attempt.getDictationScore() : 0;
            int currentShadScore = attempt.getShadowingScore() != null ? attempt.getShadowingScore() : 0;
            attempt.setIsMastered(currentDictScore == 100 && currentShadScore >= 80);

            userSegmentAttemptRepository.save(attempt);
        }

        userSegmentAttemptRepository.flush(); // Ensure queries run properly below

        // Aggregation Logic
        int completedSegments = userSegmentAttemptRepository.countCompletedShadowingSegments(user.getId(), videoId);
        int totalSegments = videoSegmentRepository.countByVideoId(videoId);

        UserVideoProgress progress = progressRepository.findByUserIdAndVideoLessonId(user.getId(), videoId)
                .orElse(UserVideoProgress.builder().user(user).videoLesson(videoLesson).build());

        progress.setCompletedShadowingSegments(completedSegments);
        progress.setLastStudiedAt(LocalDateTime.now());

        if (request.getStudyTimeSeconds() != null && request.getStudyTimeSeconds() > 0) {
            progress.setShadowingTimeSeconds(
                    (progress.getShadowingTimeSeconds() != null ? progress.getShadowingTimeSeconds() : 0)
                            + request.getStudyTimeSeconds());
            progress.setTotalLearningTime(
                    (progress.getTotalLearningTime() != null ? progress.getTotalLearningTime() : 0)
                            + request.getStudyTimeSeconds());
            recordStudySessionAndStreak(user, videoLesson, LearningActivityTypes.SHADOWING, request.getStudyTimeSeconds());
        }

        boolean isCompleted = false;
        BigDecimal avgScore = BigDecimal.ZERO;

        if (totalSegments > 0 && completedSegments >= totalSegments) {
            avgScore = userSegmentAttemptRepository.getAverageShadowingScore(user.getId(), videoId);
            progress.setAvgShadowingScore(avgScore);
            progress.setIsShadowingCompleted(true);
            isCompleted = true;
        }

        updateProgressStatus(progress);
        progressRepository.save(progress);

        return ShadowingAutosaveResponse.builder()
                .isShadowingCompleted(isCompleted)
                .completedSegments(completedSegments)
                .avgScore(avgScore)
                .build();
    }

    @Override
    public UserVideoProgressResponse getVideoProgress(Long videoId) {
        User user = getCurrentUser();
        UserVideoProgress progress = progressRepository.findByUserIdAndVideoLessonId(user.getId(), videoId)
                .orElseThrow(() -> new OurException("Chưa có tiến độ cho video này"));
        return progressMapper.toProgressResponse(progress);
    }

    @Override
    @Transactional
    public void logStudySession(StudySessionRequest request) {
        User user = getCurrentUser();
        LocalDate today = LocalDate.now();

        VideoLesson videoLesson = null;
        if (request.getVideoId() != null) {
            videoLesson = videoLessonRepository.findById(request.getVideoId())
                    .orElseThrow(() -> new OurException("Không tìm thấy Video Lesson"));

            // Update UserVideoProgress
            UserVideoProgress progress = progressRepository
                    .findByUserIdAndVideoLessonId(user.getId(), videoLesson.getId())
                    .orElse(UserVideoProgress.builder().user(user).videoLesson(videoLesson).build());

            String activityType = LearningActivityTypes.normalize(request.getActivityType());
            if (LearningActivityTypes.WATCH.equals(activityType)) {
                progress.setVideoWatchTimeSeconds(
                        (progress.getVideoWatchTimeSeconds() != null ? progress.getVideoWatchTimeSeconds() : 0)
                                + request.getDurationSeconds());
            }

            progress.setTotalLearningTime(
                    (progress.getTotalLearningTime() != null ? progress.getTotalLearningTime() : 0)
                            + request.getDurationSeconds());
            progress.setLastStudiedAt(LocalDateTime.now());
            progress.setLastActivityType(activityType);
            progress.setLastActivityAt(LocalDateTime.now());
            updateProgressStatus(progress);
            progressRepository.save(progress);

            recordStudySessionAndStreak(user, videoLesson, activityType,
                    request.getDurationSeconds());
        } else {
            StudySession session = StudySession.builder()
                    .user(user)
                    .activityType(LearningActivityTypes.normalize(request.getActivityType()))
                    .durationSeconds(request.getDurationSeconds())
                    .sessionDate(today)
                    .build();
            studySessionRepository.save(session);
            updateStreak(user, today);
        }
    }

    private void updateProgressStatus(UserVideoProgress progress) {
        boolean dictationCompleted = progress.getIsDictationCompleted() != null && progress.getIsDictationCompleted();
        boolean shadowingCompleted = progress.getIsShadowingCompleted() != null && progress.getIsShadowingCompleted();
        int completedDict = progress.getCompletedDictationSegments() != null ? progress.getCompletedDictationSegments()
                : 0;
        int completedShad = progress.getCompletedShadowingSegments() != null ? progress.getCompletedShadowingSegments()
                : 0;

        if (dictationCompleted && shadowingCompleted) {
            progress.setStatus("COMPLETED");
        } else if (completedDict > 0 || completedShad > 0
                || Boolean.TRUE.equals(progress.getFillBlankCompleted())
                || Boolean.TRUE.equals(progress.getQuizCompleted())
                || Boolean.TRUE.equals(progress.getIsQuizCompleted())) {
            progress.setStatus("IN_PROGRESS");
        } else {
            progress.setStatus("NOT_STARTED");
        }
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }

    private void updateStreak(User user, LocalDate today) {
        UserStreak streak = streakRepository.findById(user.getId()).orElse(null);

        if (streak == null) {
            streak = new UserStreak();
            streak.setUser(user);
            streak.setCurrentStreak(1);
            streak.setLongestStreak(1);
            streak.setLastActivityDate(today);
        } else {
            LocalDate lastActivity = streak.getLastActivityDate();
            if (lastActivity == null) {
                streak.setCurrentStreak(1);
            } else if (lastActivity.equals(today.minusDays(1))) {
                streak.setCurrentStreak(streak.getCurrentStreak() + 1);
            } else if (lastActivity.isBefore(today.minusDays(1))) {
                streak.setCurrentStreak(1);
            }

            if (streak.getCurrentStreak() > streak.getLongestStreak()) {
                streak.setLongestStreak(streak.getCurrentStreak());
            }
            streak.setLastActivityDate(today);
        }

        streakRepository.saveAndFlush(streak);
    }

    @Override
    public UserStreakResponse getMyStreak() {
        User user = getCurrentUser();
        UserStreak streak = streakRepository.findById(user.getId())
                .orElse(UserStreak.builder().user(user).currentStreak(0).longestStreak(0).build());

        // Check if streak is broken (last activity was before yesterday)
        LocalDate today = LocalDate.now();
        if (streak.getLastActivityDate() != null && streak.getLastActivityDate().isBefore(today.minusDays(1))) {
            streak.setCurrentStreak(0);
            streakRepository.save(streak);
        }

        return progressMapper.toStreakResponse(streak);
    }

    @Override
    public List<LocalDate> getStreakCalendar(int month, int year) {
        User user = getCurrentUser();
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);

        return studySessionRepository.findDistinctSessionDates(user.getId(), start, end);
    }

    private void recordStudySessionAndStreak(User user, VideoLesson videoLesson, String activityType,
            int durationSeconds) {
        LocalDate today = LocalDate.now();
        StudySession session = studySessionRepository.findByUserIdAndVideoLessonIdAndActivityTypeAndSessionDate(
                user.getId(), videoLesson.getId(), activityType, today)
                .orElse(StudySession.builder()
                        .user(user)
                        .videoLesson(videoLesson)
                        .activityType(activityType)
                        .sessionDate(today)
                        .durationSeconds(0)
                        .build());

        session.setDurationSeconds(session.getDurationSeconds() + durationSeconds);
        studySessionRepository.save(session);

        updateStreak(user, today);
    }

    @Override
    public LearningStatisticsResponse getLearningStatistics() {
        User user = getCurrentUser();
        return progressRepository.getLearningStatistics(user.getId());
    }

    @Override
    public PageResponse<LearningHistoryResponse> getLearningHistory(int pageNo, int pageSize) {
        User user = getCurrentUser();
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);
        Page<UserVideoProgress> page = progressRepository.findLearningHistory(user.getId(), pageable);

        List<Long> videoIds = page.getContent().stream()
                .map(p -> p.getVideoLesson().getId())
                .collect(Collectors.toList());

        List<Long> favoriteVideoIds = userFavoriteVideoRepository.findFavoriteVideoIds(user.getId(), videoIds);

        List<LearningHistoryResponse> responses = page.getContent().stream()
                .map(progress -> {
                    LearningHistoryResponse history = progressMapper.toHistoryResponse(progress);
                    history.setIsFavorited(favoriteVideoIds.contains(progress.getVideoLesson().getId()));
                    return history;
                })
                .collect(Collectors.toList());

        return PageResponse.<LearningHistoryResponse>builder()
                .pageNo(pageNo)
                .pageSize(pageSize)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .data(responses)
                .build();
    }
}
