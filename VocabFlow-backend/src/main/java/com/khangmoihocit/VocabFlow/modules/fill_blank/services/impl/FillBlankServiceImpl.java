package com.khangmoihocit.VocabFlow.modules.fill_blank.services.impl;

import com.khangmoihocit.VocabFlow.core.constants.LearningActivityTypes;
import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.CreateFillBlankItemRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.SubmitFillBlankAnswerRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.SubmitFillBlankRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.UpdateFillBlankItemRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.*;
import com.khangmoihocit.VocabFlow.modules.fill_blank.entities.UserFillBlankAnswer;
import com.khangmoihocit.VocabFlow.modules.fill_blank.entities.UserFillBlankAttempt;
import com.khangmoihocit.VocabFlow.modules.fill_blank.entities.VideoFillBlankItem;
import com.khangmoihocit.VocabFlow.modules.fill_blank.repositories.UserFillBlankAnswerRepository;
import com.khangmoihocit.VocabFlow.modules.fill_blank.repositories.UserFillBlankAttemptRepository;
import com.khangmoihocit.VocabFlow.modules.fill_blank.repositories.VideoFillBlankItemRepository;
import com.khangmoihocit.VocabFlow.modules.progress.entities.StudySession;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserStreak;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserVideoProgress;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.StudySessionRepository;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserStreakRepository;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserVideoProgressRepository;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoLessonRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoSegmentRepository;
import com.khangmoihocit.VocabFlow.modules.fill_blank.services.FillBlankService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FillBlankServiceImpl implements FillBlankService {
    private static final Pattern MULTIPLE_SPACE_PATTERN = Pattern.compile("\\s+");
    private static final Pattern EDGE_PUNCTUATION_PATTERN = Pattern.compile("^[\\p{Punct}\\s]+|[\\p{Punct}\\s]+$");

    private final VideoLessonRepository videoLessonRepository;
    private final VideoSegmentRepository videoSegmentRepository;
    private final VideoFillBlankItemRepository fillBlankItemRepository;
    private final UserFillBlankAttemptRepository attemptRepository;
    private final UserFillBlankAnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final UserVideoProgressRepository progressRepository;
    private final StudySessionRepository studySessionRepository;
    private final UserStreakRepository streakRepository;

    @Override
    public FillBlankExerciseResponse getUserFillBlank(Long videoId) {
        VideoLesson videoLesson = getVideo(videoId);
        List<VideoSegment> segments = videoSegmentRepository.findByVideoLessonId(videoId);
        List<VideoFillBlankItem> activeItems = fillBlankItemRepository
                .findByVideoLessonIdAndIsActiveTrueOrderByBlankOrderAsc(videoId);

        Map<Long, List<FillBlankItemUserResponse>> blanksBySegment = activeItems.stream()
                .collect(Collectors.groupingBy(item -> item.getSegment().getId(),
                        LinkedHashMap::new,
                        Collectors.mapping(this::toUserItemResponse, Collectors.toList())));

        List<FillBlankSegmentResponse> segmentResponses = segments.stream()
                .map(segment -> FillBlankSegmentResponse.builder()
                        .id(segment.getId())
                        .segmentOrder(segment.getSegmentOrder())
                        .startTime(segment.getStartTime())
                        .endTime(segment.getEndTime())
                        .englishText(segment.getEnglishText())
                        .vietnameseTranslation(segment.getVietnameseTranslation())
                        .ipa(segment.getIpa())
                        .lineBreakBefore(Boolean.TRUE.equals(segment.getLineBreakBefore()))
                        .blanks(blanksBySegment.getOrDefault(segment.getId(), Collections.emptyList()))
                        .build())
                .toList();

        return FillBlankExerciseResponse.builder()
                .videoId(videoLesson.getId())
                .title(videoLesson.getTitle())
                .youtubeVideoId(videoLesson.getYoutubeVideoId())
                .channelName(videoLesson.getChannel().getName())
                .totalBlanks(activeItems.size())
                .segments(segmentResponses)
                .build();
    }

    @Override
    public List<FillBlankItemAdminResponse> getAdminItems(Long videoId) {
        getVideo(videoId);
        return fillBlankItemRepository.findByVideoLessonIdOrderByBlankOrderAsc(videoId).stream()
                .map(this::toAdminItemResponse)
                .toList();
    }

    @Override
    @Transactional
    public FillBlankItemAdminResponse createItem(Long videoId, CreateFillBlankItemRequest request) {
        VideoLesson videoLesson = getVideo(videoId);
        VideoSegment segment = getSegmentForVideo(request.getSegmentId(), videoId);

        if (fillBlankItemRepository.existsByVideoLessonIdAndBlankOrder(videoId, request.getBlankOrder())) {
            throw new OurException("Thu tu blank da ton tai trong video");
        }

        validateCharRange(segment, request.getStartCharIndex(), request.getEndCharIndex(), request.getAnswerText());

        VideoFillBlankItem item = VideoFillBlankItem.builder()
                .videoLesson(videoLesson)
                .segment(segment)
                .blankOrder(request.getBlankOrder())
                .answerText(request.getAnswerText())
                .acceptedAnswers(safeAnswers(request.getAcceptedAnswers()))
                .startCharIndex(request.getStartCharIndex())
                .endCharIndex(request.getEndCharIndex())
                .tokenIndex(request.getTokenIndex())
                .blankType(defaultIfBlank(request.getBlankType(), "WORD"))
                .hint(request.getHint())
                .difficultyLevel(defaultIfBlank(request.getDifficultyLevel(), "MEDIUM"))
                .points(request.getPoints() != null ? request.getPoints() : 1)
                .isActive(request.getIsActive() == null || request.getIsActive())
                .build();

        return toAdminItemResponse(fillBlankItemRepository.save(item));
    }

    @Override
    @Transactional
    public FillBlankItemAdminResponse updateItem(Long itemId, UpdateFillBlankItemRequest request) {
        VideoFillBlankItem item = fillBlankItemRepository.findById(itemId)
                .orElseThrow(() -> new OurException("Khong tim thay blank item"));

        Long videoId = item.getVideoLesson().getId();
        VideoSegment segment = getSegmentForVideo(request.getSegmentId(), videoId);
        if (fillBlankItemRepository.existsByVideoLessonIdAndBlankOrderAndIdNot(videoId, request.getBlankOrder(), itemId)) {
            throw new OurException("Thu tu blank da ton tai trong video");
        }
        validateCharRange(segment, request.getStartCharIndex(), request.getEndCharIndex(), request.getAnswerText());

        item.setSegment(segment);
        item.setBlankOrder(request.getBlankOrder());
        item.setAnswerText(request.getAnswerText());
        item.setAcceptedAnswers(safeAnswers(request.getAcceptedAnswers()));
        item.setStartCharIndex(request.getStartCharIndex());
        item.setEndCharIndex(request.getEndCharIndex());
        item.setTokenIndex(request.getTokenIndex());
        item.setBlankType(defaultIfBlank(request.getBlankType(), "WORD"));
        item.setHint(request.getHint());
        item.setDifficultyLevel(defaultIfBlank(request.getDifficultyLevel(), "MEDIUM"));
        item.setPoints(request.getPoints() != null ? request.getPoints() : 1);
        item.setIsActive(request.getIsActive() == null || request.getIsActive());

        return toAdminItemResponse(item);
    }

    @Override
    @Transactional
    public void deleteItem(Long itemId) {
        VideoFillBlankItem item = fillBlankItemRepository.findById(itemId)
                .orElseThrow(() -> new OurException("Khong tim thay blank item"));
        fillBlankItemRepository.delete(item);
    }

    @Override
    @Transactional
    public FillBlankSubmitResultResponse submit(Long videoId, SubmitFillBlankRequest request) {
        Optional<User> userOpt = getCurrentUserOptional();
        VideoLesson videoLesson = getVideo(videoId);
        List<VideoFillBlankItem> activeItems = fillBlankItemRepository
                .findByVideoLessonIdAndIsActiveTrueOrderByBlankOrderAsc(videoId);
        if (activeItems.isEmpty()) {
            throw new OurException("Video nay chua co bai Fill Blank");
        }

        Map<Long, VideoFillBlankItem> itemMap = activeItems.stream()
                .collect(Collectors.toMap(VideoFillBlankItem::getId, Function.identity()));

        List<SubmitFillBlankAnswerRequest> submittedAnswers = request.getAnswers();
        Map<Long, SubmitFillBlankAnswerRequest> submittedAnswerMap = new HashMap<>();
        for (SubmitFillBlankAnswerRequest answer : submittedAnswers) {
            if (!itemMap.containsKey(answer.getBlankItemId())) {
                throw new OurException("Blank item khong thuoc video hoac da bi an");
            }
            if (submittedAnswerMap.put(answer.getBlankItemId(), answer) != null) {
                throw new OurException("Mot blank chi duoc nop mot cau tra loi");
            }
        }

        int totalBlanks = activeItems.size();
        int correctCount = 0;
        List<FillBlankAnswerResultResponse> resultResponses = new ArrayList<>();

        UserFillBlankAttempt attempt = null;
        if (userOpt.isPresent()) {
            attempt = UserFillBlankAttempt.builder()
                    .user(userOpt.get())
                    .videoLesson(videoLesson)
                    .totalBlanks(totalBlanks)
                    .totalCorrect(0)
                    .score(BigDecimal.ZERO)
                    .status("COMPLETED")
                    .build();
            attempt = attemptRepository.save(attempt);
        }

        for (VideoFillBlankItem item : activeItems) {
            SubmitFillBlankAnswerRequest submitted = submittedAnswerMap.get(item.getId());
            String userAnswer = submitted != null ? submitted.getUserAnswer() : null;
            String normalized = normalizeAnswer(userAnswer);
            boolean isCorrect = isCorrectAnswer(item, normalized);
            if (isCorrect) {
                correctCount++;
            }

            if (attempt != null) {
                answerRepository.save(UserFillBlankAnswer.builder()
                        .attempt(attempt)
                        .blankItem(item)
                        .userAnswer(userAnswer)
                        .normalizedUserAnswer(normalized)
                        .isCorrect(isCorrect)
                        .build());
            }

            resultResponses.add(FillBlankAnswerResultResponse.builder()
                    .blankItemId(item.getId())
                    .segmentId(item.getSegment().getId())
                    .blankOrder(item.getBlankOrder())
                    .userAnswer(userAnswer)
                    .normalizedUserAnswer(normalized)
                    .isCorrect(isCorrect)
                    .correctAnswer(item.getAnswerText())
                    .acceptedAnswers(safeAnswers(item.getAcceptedAnswers()))
                    .build());
        }

        BigDecimal score = BigDecimal.valueOf(correctCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalBlanks), 2, RoundingMode.HALF_UP);

        LocalDateTime completedAt = LocalDateTime.now();
        if (attempt != null) {
            attempt.setTotalCorrect(correctCount);
            attempt.setScore(score);
            attempt.setCompletedAt(completedAt);
            updateProgressAndSession(userOpt.get(), videoLesson, score, request.getDurationSeconds());
        }

        return FillBlankSubmitResultResponse.builder()
                .attemptId(attempt != null ? attempt.getId() : null)
                .score(score)
                .totalBlanks(totalBlanks)
                .totalCorrect(correctCount)
                .completedAt(attempt != null ? attempt.getCompletedAt() : completedAt)
                .answers(resultResponses)
                .build();
    }

    @Override
    public List<UserFillBlankAttemptResponse> getUserAttempts(Long videoId) {
        User user = getCurrentUser();
        getVideo(videoId);
        return attemptRepository.findByUserIdAndVideoLessonIdOrderByCompletedAtDesc(user.getId(), videoId).stream()
                .map(attempt -> UserFillBlankAttemptResponse.builder()
                        .id(attempt.getId())
                        .videoId(attempt.getVideoLesson().getId())
                        .score(attempt.getScore())
                        .totalBlanks(attempt.getTotalBlanks())
                        .totalCorrect(attempt.getTotalCorrect())
                        .status(attempt.getStatus())
                        .startedAt(attempt.getStartedAt())
                        .completedAt(attempt.getCompletedAt())
                        .build())
                .toList();
    }

    private VideoLesson getVideo(Long videoId) {
        return videoLessonRepository.findById(videoId)
                .orElseThrow(() -> new OurException("Khong tim thay Video Lesson"));
    }

    private User getCurrentUser() {
        UserDetailsCustom userDetails = UserDetailUtil.get();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new OurException("User khong ton tai"));
    }

    private Optional<User> getCurrentUserOptional() {
        return UserDetailUtil.getCurrentUserIdOptional()
                .flatMap(userRepository::findById);
    }

    private VideoSegment getSegmentForVideo(Long segmentId, Long videoId) {
        VideoSegment segment = videoSegmentRepository.findById(segmentId)
                .orElseThrow(() -> new OurException("Khong tim thay Video Segment"));
        if (!Objects.equals(segment.getVideo().getId(), videoId)) {
            throw new OurException("Segment khong thuoc video nay");
        }
        return segment;
    }

    private void validateCharRange(VideoSegment segment, Integer start, Integer end, String answerText) {
        if (start == null && end == null) {
            return;
        }
        if (start == null || end == null || start < 0 || end <= start) {
            throw new OurException("startCharIndex/endCharIndex khong hop le");
        }
        String text = segment.getEnglishText();
        if (text == null || end > text.length()) {
            throw new OurException("startCharIndex/endCharIndex vuot qua do dai segment");
        }
        String selectedText = text.substring(start, end);
        if (answerText != null && !normalizeAnswer(selectedText).equals(normalizeAnswer(answerText))) {
            throw new OurException("Doan text duoc chon khong khop answerText");
        }
    }

    private boolean isCorrectAnswer(VideoFillBlankItem item, String normalizedAnswer) {
        if (normalizedAnswer.isBlank()) {
            return false;
        }

        List<String> accepted = new ArrayList<>();
        accepted.add(item.getAnswerText());
        accepted.addAll(safeAnswers(item.getAcceptedAnswers()));

        return accepted.stream()
                .filter(Objects::nonNull)
                .map(this::normalizeAnswer)
                .anyMatch(normalizedAnswer::equals);
    }

    private String normalizeAnswer(String input) {
        if (input == null) {
            return "";
        }
        String normalized = input.trim().toLowerCase(Locale.ROOT);
        normalized = MULTIPLE_SPACE_PATTERN.matcher(normalized).replaceAll(" ");
        normalized = EDGE_PUNCTUATION_PATTERN.matcher(normalized).replaceAll("");
        return normalized.trim();
    }

    private void updateProgressAndSession(User user, VideoLesson videoLesson, BigDecimal latestScore, Integer durationSeconds) {
        int safeDuration = durationSeconds != null && durationSeconds > 0 ? durationSeconds : 0;
        UserVideoProgress progress = progressRepository.findByUserIdAndVideoLessonId(user.getId(), videoLesson.getId())
                .orElse(UserVideoProgress.builder().user(user).videoLesson(videoLesson).build());

        progress.setAvgFillBlankScore(latestScore);
        progress.setFillBlankCompleted(true);
        progress.setLastStudiedAt(LocalDateTime.now());
        progress.setLastActivityType(LearningActivityTypes.FILL_BLANK);
        progress.setLastActivityAt(LocalDateTime.now());
        if (safeDuration > 0) {
            progress.setFillBlankTimeSeconds(safeInt(progress.getFillBlankTimeSeconds()) + safeDuration);
            progress.setTotalLearningTime(safeInt(progress.getTotalLearningTime()) + safeDuration);
        }
        if (!"COMPLETED".equals(progress.getStatus())) {
            progress.setStatus("IN_PROGRESS");
        }
        progressRepository.save(progress);
        recordStudySessionAndStreak(user, videoLesson, LearningActivityTypes.FILL_BLANK, safeDuration);
    }

    private void recordStudySessionAndStreak(User user, VideoLesson videoLesson, String activityType, int durationSeconds) {
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
        session.setDurationSeconds(safeInt(session.getDurationSeconds()) + Math.max(durationSeconds, 0));
        studySessionRepository.save(session);
        updateStreak(user, today);
    }

    private void updateStreak(User user, LocalDate today) {
        UserStreak streak = streakRepository.findById(user.getId()).orElse(null);
        if (streak == null) {
            streak = UserStreak.builder()
                    .user(user)
                    .currentStreak(1)
                    .longestStreak(1)
                    .lastActivityDate(today)
                    .build();
        } else {
            LocalDate lastActivity = streak.getLastActivityDate();
            if (lastActivity == null || lastActivity.isBefore(today.minusDays(1))) {
                streak.setCurrentStreak(1);
            } else if (lastActivity.equals(today.minusDays(1))) {
                streak.setCurrentStreak(streak.getCurrentStreak() + 1);
            }
            if (streak.getCurrentStreak() > streak.getLongestStreak()) {
                streak.setLongestStreak(streak.getCurrentStreak());
            }
            streak.setLastActivityDate(today);
        }
        streakRepository.save(streak);
    }

    private FillBlankItemUserResponse toUserItemResponse(VideoFillBlankItem item) {
        return FillBlankItemUserResponse.builder()
                .id(item.getId())
                .segmentId(item.getSegment().getId())
                .blankOrder(item.getBlankOrder())
                .startCharIndex(item.getStartCharIndex())
                .endCharIndex(item.getEndCharIndex())
                .tokenIndex(item.getTokenIndex())
                .blankType(item.getBlankType())
                .hint(item.getHint())
                .difficultyLevel(item.getDifficultyLevel())
                .points(item.getPoints())
                .build();
    }

    private FillBlankItemAdminResponse toAdminItemResponse(VideoFillBlankItem item) {
        return FillBlankItemAdminResponse.builder()
                .id(item.getId())
                .videoId(item.getVideoLesson().getId())
                .segmentId(item.getSegment().getId())
                .segmentOrder(item.getSegment().getSegmentOrder())
                .blankOrder(item.getBlankOrder())
                .answerText(item.getAnswerText())
                .acceptedAnswers(safeAnswers(item.getAcceptedAnswers()))
                .startCharIndex(item.getStartCharIndex())
                .endCharIndex(item.getEndCharIndex())
                .tokenIndex(item.getTokenIndex())
                .blankType(item.getBlankType())
                .hint(item.getHint())
                .difficultyLevel(item.getDifficultyLevel())
                .points(item.getPoints())
                .isActive(item.getIsActive())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private List<String> safeAnswers(List<String> answers) {
        if (answers == null) {
            return new ArrayList<>();
        }
        return answers.stream()
                .filter(answer -> answer != null && !answer.isBlank())
                .map(String::trim)
                .toList();
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }
}
