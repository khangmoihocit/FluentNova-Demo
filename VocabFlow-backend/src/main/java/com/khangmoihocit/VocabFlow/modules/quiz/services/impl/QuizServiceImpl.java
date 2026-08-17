package com.khangmoihocit.VocabFlow.modules.quiz.services.impl;

import com.khangmoihocit.VocabFlow.core.constants.LearningActivityTypes;
import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.progress.entities.StudySession;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserStreak;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserVideoProgress;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.StudySessionRepository;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserStreakRepository;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserVideoProgressRepository;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.*;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.*;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.QuizOption;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.UserQuizAnswer;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.UserQuizAttempt;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.VideoQuiz;
import com.khangmoihocit.VocabFlow.modules.quiz.repositories.QuizOptionRepository;
import com.khangmoihocit.VocabFlow.modules.quiz.repositories.UserQuizAnswerRepository;
import com.khangmoihocit.VocabFlow.modules.quiz.repositories.UserQuizAttemptRepository;
import com.khangmoihocit.VocabFlow.modules.quiz.repositories.VideoQuizRepository;
import com.khangmoihocit.VocabFlow.modules.quiz.services.QuizService;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoLessonRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizServiceImpl implements QuizService {

    private final VideoQuizRepository videoQuizRepository;
    private final QuizOptionRepository quizOptionRepository;
    private final UserQuizAttemptRepository userQuizAttemptRepository;
    private final UserQuizAnswerRepository userQuizAnswerRepository;
    private final VideoLessonRepository videoLessonRepository;
    private final UserRepository userRepository;
    private final UserVideoProgressRepository progressRepository;
    private final StudySessionRepository studySessionRepository;
    private final UserStreakRepository streakRepository;

    @Override
    @Transactional
    public void addQuizzesToVideo(BulkVideoQuizRequest request) {
        VideoLesson videoLesson = getVideo(request.getVideoId());
        List<VideoQuiz> quizzes = request.getQuizzes().stream()
                .map(quizRequest -> buildQuiz(videoLesson, quizRequest))
                .toList();
        videoQuizRepository.saveAll(quizzes);
    }

    @Override
    public List<VideoQuizResponse> getQuizzesByVideoId(Long videoId) {
        getVideo(videoId);
        return videoQuizRepository.findByVideoLessonIdAndIsPublishedTrueOrderByOrderIndexAscIdAsc(videoId).stream()
                .map(this::toUserQuizResponse)
                .toList();
    }

    @Override
    public List<VideoQuizAdminResponse> getAdminQuizzesByVideoId(Long videoId) {
        getVideo(videoId);
        return videoQuizRepository.findByVideoLessonIdOrderByOrderIndexAscIdAsc(videoId).stream()
                .map(this::toAdminQuizResponse)
                .toList();
    }

    @Override
    @Transactional
    public VideoQuizAdminResponse createQuiz(Long videoId, VideoQuizRequest request) {
        VideoLesson videoLesson = getVideo(videoId);
        validateQuizRequest(request);
        return toAdminQuizResponse(videoQuizRepository.save(buildQuiz(videoLesson, request)));
    }

    @Override
    @Transactional
    public VideoQuizAdminResponse updateQuiz(Long quizId, VideoQuizRequest request) {
        VideoQuiz quiz = videoQuizRepository.findById(quizId)
                .orElseThrow(() -> new OurException("Khong tim thay cau hoi"));
        validateQuizRequest(request);

        quiz.setQuestionText(request.getQuestionText());
        quiz.setExplanation(request.getExplanation());
        quiz.setQuestionType(defaultIfBlank(request.getQuestionType(), "MULTIPLE_CHOICE"));
        quiz.setDifficultyLevel(defaultIfBlank(request.getDifficultyLevel(), "MEDIUM"));
        quiz.setOrderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0);
        quiz.setIsPublished(request.getIsPublished() == null || request.getIsPublished());

        quiz.getOptions().clear();
        request.getOptions().forEach(optionRequest -> quiz.getOptions().add(buildOption(quiz, optionRequest)));
        return toAdminQuizResponse(quiz);
    }

    @Override
    @Transactional
    public void deleteQuiz(Long quizId) {
        VideoQuiz quiz = videoQuizRepository.findById(quizId)
                .orElseThrow(() -> new OurException("Khong tim thay cau hoi"));
        videoQuizRepository.delete(quiz);
    }

    @Override
    @Transactional
    public QuizOptionAdminResponse createOption(Long quizId, QuizOptionRequest request) {
        VideoQuiz quiz = videoQuizRepository.findById(quizId)
                .orElseThrow(() -> new OurException("Khong tim thay cau hoi"));
        QuizOption option = buildOption(quiz, request);
        return toAdminOptionResponse(quizOptionRepository.save(option));
    }

    @Override
    @Transactional
    public QuizOptionAdminResponse updateOption(Long optionId, QuizOptionRequest request) {
        QuizOption option = quizOptionRepository.findById(optionId)
                .orElseThrow(() -> new OurException("Khong tim thay dap an"));
        option.setOptionText(request.getOptionText());
        option.setIsCorrect(Boolean.TRUE.equals(request.getIsCorrect()));
        option.setOptionOrder(request.getOptionOrder() != null ? request.getOptionOrder() : 0);
        return toAdminOptionResponse(option);
    }

    @Override
    @Transactional
    public void deleteOption(Long optionId) {
        QuizOption option = quizOptionRepository.findById(optionId)
                .orElseThrow(() -> new OurException("Khong tim thay dap an"));
        quizOptionRepository.delete(option);
    }

    @Override
    @Transactional
    public QuizSubmitResultResponse submitQuiz(Long videoId, QuizSubmitRequest request) {
        Optional<User> userOpt = getCurrentUserOptional();
        VideoLesson videoLesson = getVideo(videoId);
        List<VideoQuiz> quizzes = videoQuizRepository.findByVideoLessonIdAndIsPublishedTrueOrderByOrderIndexAscIdAsc(videoId);
        if (quizzes.isEmpty()) {
            throw new OurException("Video nay chua co cau hoi nao");
        }

        Map<Long, VideoQuiz> quizMap = quizzes.stream().collect(Collectors.toMap(VideoQuiz::getId, Function.identity()));
        Map<Long, QuizAnswerSubmitRequest> answerMap = new LinkedHashMap<>();
        for (QuizAnswerSubmitRequest answer : request.getAnswers()) {
            if (!quizMap.containsKey(answer.getQuizId())) {
                throw new OurException("Cau hoi khong thuoc video hoac chua published");
            }
            if (answerMap.put(answer.getQuizId(), answer) != null) {
                throw new OurException("Mot cau hoi chi duoc nop mot cau tra loi");
            }
        }

        int totalQuestions = quizzes.size();
        int correctCount = 0;
        List<QuizAnswerResultResponse> results = new ArrayList<>();

        UserQuizAttempt attempt = null;
        if (userOpt.isPresent()) {
            attempt = UserQuizAttempt.builder()
                    .user(userOpt.get())
                    .videoLesson(videoLesson)
                    .totalQuestions(totalQuestions)
                    .totalCorrect(0)
                    .score(BigDecimal.ZERO)
                    .status("COMPLETED")
                    .build();
            attempt = userQuizAttemptRepository.save(attempt);
        }

        for (VideoQuiz quiz : quizzes) {
            QuizAnswerSubmitRequest submitted = answerMap.get(quiz.getId());
            QuizOption selectedOption = null;
            if (submitted != null && submitted.getSelectedOptionId() != null) {
                selectedOption = quizOptionRepository.findById(submitted.getSelectedOptionId())
                        .orElseThrow(() -> new OurException("Khong tim thay dap an da chon"));
                if (!Objects.equals(selectedOption.getVideoQuiz().getId(), quiz.getId())) {
                    throw new OurException("Dap an khong thuoc cau hoi");
                }
            }

            boolean isCorrect = selectedOption != null && Boolean.TRUE.equals(selectedOption.getIsCorrect());
            if (isCorrect) {
                correctCount++;
            }

            if (attempt != null) {
                userQuizAnswerRepository.save(UserQuizAnswer.builder()
                        .attempt(attempt)
                        .quiz(quiz)
                        .selectedOption(selectedOption)
                        .userAnswerText(submitted != null ? submitted.getUserAnswerText() : null)
                        .isCorrect(isCorrect)
                        .build());
            }

            Long correctOptionId = quiz.getOptions().stream()
                    .filter(option -> Boolean.TRUE.equals(option.getIsCorrect()))
                    .map(QuizOption::getId)
                    .findFirst()
                    .orElse(null);

            results.add(QuizAnswerResultResponse.builder()
                    .quizId(quiz.getId())
                    .selectedOptionId(selectedOption != null ? selectedOption.getId() : null)
                    .userAnswerText(submitted != null ? submitted.getUserAnswerText() : null)
                    .isCorrect(isCorrect)
                    .correctOptionId(correctOptionId)
                    .explanation(quiz.getExplanation())
                    .build());
        }

        BigDecimal score = BigDecimal.valueOf(correctCount)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(totalQuestions), 2, RoundingMode.HALF_UP);

        LocalDateTime completedAt = LocalDateTime.now();
        if (attempt != null) {
            attempt.setTotalCorrect(correctCount);
            attempt.setScore(score);
            attempt.setCompletedAt(completedAt);
            updateProgressAndSession(userOpt.get(), videoLesson, score, request.getDurationSeconds());
        }

        return QuizSubmitResultResponse.builder()
                .attemptId(attempt != null ? attempt.getId() : null)
                .score(score)
                .totalCorrect(correctCount)
                .totalQuestions(totalQuestions)
                .completedAt(attempt != null ? attempt.getCompletedAt() : completedAt)
                .answers(results)
                .build();
    }

    @Override
    public List<UserQuizAttemptResponse> getUserAttempts(Long videoId) {
        User user = getCurrentUser();
        getVideo(videoId);
        return userQuizAttemptRepository.findByUserIdAndVideoLessonIdOrderByCompletedAtDesc(user.getId(), videoId).stream()
                .map(attempt -> UserQuizAttemptResponse.builder()
                        .id(attempt.getId())
                        .videoId(attempt.getVideoLesson().getId())
                        .score(attempt.getScore())
                        .totalCorrect(attempt.getTotalCorrect())
                        .totalQuestions(attempt.getTotalQuestions())
                        .status(attempt.getStatus())
                        .startedAt(attempt.getStartedAt())
                        .completedAt(attempt.getCompletedAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public QuizSubmissionResponse submitQuizAttempt(QuizSubmissionRequest request) {
        List<QuizOption> selectedOptions = quizOptionRepository.findAllByIdIn(request.getSelectedOptionIds());
        if (selectedOptions.isEmpty()) {
            throw new OurException("Khong tim thay dap an da chon");
        }

        Long videoId = request.getVideoId();
        List<QuizAnswerSubmitRequest> answers = selectedOptions.stream()
                .filter(option -> Objects.equals(option.getVideoQuiz().getVideoLesson().getId(), videoId))
                .map(option -> {
                    QuizAnswerSubmitRequest answer = new QuizAnswerSubmitRequest();
                    answer.setQuizId(option.getVideoQuiz().getId());
                    answer.setSelectedOptionId(option.getId());
                    return answer;
                })
                .toList();

        if (answers.size() != selectedOptions.size()) {
            throw new OurException("Co dap an khong thuoc video");
        }

        QuizSubmitRequest submitRequest = new QuizSubmitRequest();
        submitRequest.setDurationSeconds(0);
        submitRequest.setAnswers(answers);
        QuizSubmitResultResponse result = submitQuiz(videoId, submitRequest);

        return QuizSubmissionResponse.builder()
                .attemptId(result.getAttemptId())
                .score(result.getScore())
                .totalCorrect(result.getTotalCorrect())
                .totalQuestions(result.getTotalQuestions())
                .completedAt(result.getCompletedAt())
                .build();
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

    private VideoQuiz buildQuiz(VideoLesson videoLesson, VideoQuizRequest request) {
        validateQuizRequest(request);
        VideoQuiz quiz = VideoQuiz.builder()
                .videoLesson(videoLesson)
                .questionText(request.getQuestionText())
                .explanation(request.getExplanation())
                .questionType(defaultIfBlank(request.getQuestionType(), "MULTIPLE_CHOICE"))
                .difficultyLevel(defaultIfBlank(request.getDifficultyLevel(), "MEDIUM"))
                .orderIndex(request.getOrderIndex() != null ? request.getOrderIndex() : 0)
                .isPublished(request.getIsPublished() == null || request.getIsPublished())
                .build();
        request.getOptions().forEach(optionRequest -> quiz.getOptions().add(buildOption(quiz, optionRequest)));
        return quiz;
    }

    private QuizOption buildOption(VideoQuiz quiz, QuizOptionRequest request) {
        return QuizOption.builder()
                .videoQuiz(quiz)
                .optionText(request.getOptionText())
                .isCorrect(Boolean.TRUE.equals(request.getIsCorrect()))
                .optionOrder(request.getOptionOrder() != null ? request.getOptionOrder() : 0)
                .build();
    }

    private void validateQuizRequest(VideoQuizRequest request) {
        if (request.getOptions() == null || request.getOptions().size() < 2) {
            throw new OurException("MULTIPLE_CHOICE can co it nhat 2 dap an");
        }
        long correctCount = request.getOptions().stream()
                .filter(option -> Boolean.TRUE.equals(option.getIsCorrect()))
                .count();
        if (correctCount < 1) {
            throw new OurException("Can it nhat 1 dap an dung");
        }
    }

    private void updateProgressAndSession(User user, VideoLesson videoLesson, BigDecimal latestScore, Integer durationSeconds) {
        int safeDuration = durationSeconds != null && durationSeconds > 0 ? durationSeconds : 0;
        UserVideoProgress progress = progressRepository.findByUserIdAndVideoLessonId(user.getId(), videoLesson.getId())
                .orElse(UserVideoProgress.builder().user(user).videoLesson(videoLesson).build());

        progress.setAvgQuizScore(latestScore);
        progress.setQuizCompleted(true);
        progress.setIsQuizCompleted(true);
        progress.setLastStudiedAt(LocalDateTime.now());
        progress.setLastActivityType(LearningActivityTypes.QUIZ);
        progress.setLastActivityAt(LocalDateTime.now());
        if (safeDuration > 0) {
            progress.setQuizTimeSeconds(safeInt(progress.getQuizTimeSeconds()) + safeDuration);
            progress.setTotalLearningTime(safeInt(progress.getTotalLearningTime()) + safeDuration);
        }
        if (!"COMPLETED".equals(progress.getStatus())) {
            progress.setStatus("IN_PROGRESS");
        }
        progressRepository.save(progress);
        recordStudySessionAndStreak(user, videoLesson, LearningActivityTypes.QUIZ, safeDuration);
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

    private VideoQuizResponse toUserQuizResponse(VideoQuiz quiz) {
        VideoQuizResponse response = new VideoQuizResponse();
        response.setId(quiz.getId());
        response.setQuestionText(quiz.getQuestionText());
        response.setExplanation(null);
        response.setQuestionType(quiz.getQuestionType());
        response.setDifficultyLevel(quiz.getDifficultyLevel());
        response.setOrderIndex(quiz.getOrderIndex());
        response.setOptions(quiz.getOptions().stream()
                .sorted(Comparator.comparing(QuizOption::getOptionOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(QuizOption::getId))
                .map(this::toUserOptionResponse)
                .toList());
        return response;
    }

    private QuizOptionResponse toUserOptionResponse(QuizOption option) {
        QuizOptionResponse response = new QuizOptionResponse();
        response.setId(option.getId());
        response.setOptionText(option.getOptionText());
        response.setOptionOrder(option.getOptionOrder());
        return response;
    }

    private VideoQuizAdminResponse toAdminQuizResponse(VideoQuiz quiz) {
        return VideoQuizAdminResponse.builder()
                .id(quiz.getId())
                .videoId(quiz.getVideoLesson().getId())
                .questionText(quiz.getQuestionText())
                .explanation(quiz.getExplanation())
                .questionType(quiz.getQuestionType())
                .difficultyLevel(quiz.getDifficultyLevel())
                .orderIndex(quiz.getOrderIndex())
                .isPublished(quiz.getIsPublished())
                .options(quiz.getOptions().stream()
                        .sorted(Comparator.comparing(QuizOption::getOptionOrder, Comparator.nullsLast(Comparator.naturalOrder()))
                                .thenComparing(QuizOption::getId))
                        .map(this::toAdminOptionResponse)
                        .toList())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .build();
    }

    private QuizOptionAdminResponse toAdminOptionResponse(QuizOption option) {
        return QuizOptionAdminResponse.builder()
                .id(option.getId())
                .optionText(option.getOptionText())
                .isCorrect(option.getIsCorrect())
                .optionOrder(option.getOptionOrder())
                .build();
    }

    private String defaultIfBlank(String value, String defaultValue) {
        return value == null || value.isBlank() ? defaultValue : value.trim();
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }
}
