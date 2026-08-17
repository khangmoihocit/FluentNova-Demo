package com.khangmoihocit.VocabFlow.modules.youtube_learning.services.Impl;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.FillBlankAnswerResultResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.FillBlankSubmitResultResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.entities.UserFillBlankAnswer;
import com.khangmoihocit.VocabFlow.modules.fill_blank.entities.UserFillBlankAttempt;
import com.khangmoihocit.VocabFlow.modules.fill_blank.repositories.UserFillBlankAnswerRepository;
import com.khangmoihocit.VocabFlow.modules.fill_blank.repositories.UserFillBlankAttemptRepository;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.QuizAnswerResultResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.QuizSubmitResultResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.QuizOption;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.UserQuizAnswer;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.UserQuizAttempt;
import com.khangmoihocit.VocabFlow.modules.quiz.repositories.UserQuizAnswerRepository;
import com.khangmoihocit.VocabFlow.modules.quiz.repositories.UserQuizAttemptRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.VideoSegmentToolRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.*;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.UserSegmentAttempt;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.mappers.VideoSegmentMapper;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.UserSegmentAttemptRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoLessonRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoSegmentRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.services.VideoSegmentService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j(topic = "Video segment SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VideoSegmentServiceImpl implements VideoSegmentService {
    VideoLessonRepository videoLessonRepository;
    VideoSegmentRepository videoSegmentRepository;
    UserSegmentAttemptRepository userSegmentAttemptRepository;
    UserFillBlankAttemptRepository userFillBlankAttemptRepository;
    UserFillBlankAnswerRepository userFillBlankAnswerRepository;
    UserQuizAttemptRepository userQuizAttemptRepository;
    UserQuizAnswerRepository userQuizAnswerRepository;
    VideoSegmentMapper videoSegmentMapper;

    @Override
    public void insertSegment(Long videoId, List<VideoSegmentToolRequest> toolRequests) {
        VideoLesson videoLesson = videoLessonRepository.findById(videoId)
                .orElseThrow(()->new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND));

        List<VideoSegment> segmentsToSave = toolRequests.stream()
                .map(req -> VideoSegment.builder()
                        .video(videoLesson)
                        .segmentOrder(req.getId())
                        .startTime(req.getStart())
                        .endTime(req.getEnd())
                        .englishText(req.getText())
                        .vietnameseTranslation(req.getVietnameseTranslation())
                        .ipa(req.getIpa())
                        .lineBreakBefore(Boolean.TRUE.equals(req.getLineBreakBefore()))
                        .build()
                ).toList();

        videoSegmentRepository.saveAll(segmentsToSave);
    }

    @Transactional
    @Override
    public void updateSegment(Long videoId, List<VideoSegmentToolRequest> toolRequests) {
        VideoLesson videoLesson = videoLessonRepository.findById(videoId)
                .orElseThrow(()->new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND));

        //Lấy toàn bộ các segment cũ của video này từ Database
        List<VideoSegment> existingSegments = videoSegmentRepository.findByVideoLessonId(videoId);

        //Chuyển list cũ thành Map để tra cứu cho nhanh (Key là segmentOrder)
        Map<Integer, VideoSegment> existingSegmentMap = existingSegments.stream()
                .collect(Collectors.toMap(VideoSegment::getSegmentOrder, Function.identity()));

        List<VideoSegment> segmentsToSave = new ArrayList<>();
        Set<Integer> incomingOrders = new HashSet<>();

        //Duyệt qua danh sách Tool gửi lên để Update hoặc Insert
        for (VideoSegmentToolRequest req : toolRequests) {
            incomingOrders.add(req.getId()); // Lưu lại các order để check xóa sau

            VideoSegment segment = existingSegmentMap.get(req.getId());

            if (segment != null) {
                segment.setStartTime(req.getStart());
                segment.setEndTime(req.getEnd());
                segment.setEnglishText(req.getText());
                segment.setVietnameseTranslation(req.getVietnameseTranslation());
                segment.setIpa(req.getIpa());
                segment.setLineBreakBefore(Boolean.TRUE.equals(req.getLineBreakBefore()));
            } else {
                segment = VideoSegment.builder()
                        .video(videoLesson)
                        .segmentOrder(req.getId())
                        .startTime(req.getStart())
                        .endTime(req.getEnd())
                        .englishText(req.getText())
                        .vietnameseTranslation(req.getVietnameseTranslation())
                        .ipa(req.getIpa())
                        .lineBreakBefore(Boolean.TRUE.equals(req.getLineBreakBefore()))
                        .build();
            }
            segmentsToSave.add(segment);
        }

        // Xử lý các segment bị XÓA trên giao diện Tool
        // Tìm các segment có trong DB nhưng k có trong ds gửi lên
        List<VideoSegment> segmentsToDelete = existingSegments.stream()
                .filter(seg -> !incomingOrders.contains(seg.getSegmentOrder()))
                .collect(Collectors.toList());

        if (!segmentsToDelete.isEmpty()) {
            videoSegmentRepository.deleteAll(segmentsToDelete);
        }

        videoSegmentRepository.saveAll(segmentsToSave);
    }

    @Override
    @Transactional(readOnly = true)
    public VideoDetailResponse getById(Long videoId) {
        VideoLesson videoLesson = videoLessonRepository.findById(videoId)
                .orElseThrow(()->new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND));

        List<VideoSegment> videoSegments = videoSegmentRepository.findByVideoLessonId(videoId);

        Optional<UUID> userIdOpt = UserDetailUtil.getCurrentUserIdOptional();
        List<UserSegmentAttempt> userAttempts = new ArrayList<>();
        FillBlankSubmitResultResponse latestFillBlankResult = null;
        QuizSubmitResultResponse latestQuizResult = null;
        if (userIdOpt.isPresent()) {
            userAttempts = userSegmentAttemptRepository
                    .findByUserIdAndVideoId(userIdOpt.get(), videoId);
            latestFillBlankResult = userFillBlankAttemptRepository
                    .findTopByUserIdAndVideoLessonIdOrderByCompletedAtDesc(userIdOpt.get(), videoId)
                    .map(this::toFillBlankSubmitResult)
                    .orElse(null);
            latestQuizResult = userQuizAttemptRepository
                    .findByUserIdAndVideoLessonIdOrderByCompletedAtDesc(userIdOpt.get(), videoId)
                    .stream()
                    .findFirst()
                    .map(this::toQuizSubmitResult)
                    .orElse(null);
        }
        
        Map<Long, UserSegmentAttempt> attemptMap = userAttempts.stream()
                .collect(Collectors.toMap(attempt -> attempt.getSegment().getId(),
                        Function.identity()));

        VideoLessonSegmentResponse videoLessonResponse = VideoLessonSegmentResponse.builder()
                .id(videoLesson.getId())
                .youtubeVideoId(videoLesson.getYoutubeVideoId())
                .title(videoLesson.getTitle())
                .channelName(videoLesson.getChannel().getName())
                .build();

        List<VideoSegmentResponse> videoSegmentResponses = videoSegments.stream().map(segment -> {
            VideoSegmentResponse response = videoSegmentMapper.toResponse(segment);

            // Kiểm tra xem user đã học câu này chưa
            UserSegmentAttempt attempt = attemptMap.get(segment.getId());
            if (attempt != null) {
                response.setUserAttempt(UserAttemptResponse.builder()
                        .dictationUserText(attempt.getDictationUserText())
                        .dictationScore(attempt.getDictationScore())
                        .shadowingUserText(attempt.getShadowingUserText())
                        .shadowingScore(attempt.getShadowingScore())
                        .isMastered(attempt.getIsMastered())
                        .build());
            }
            return response;
        }).toList();

        return VideoDetailResponse.builder()
                .videoDetail(videoLessonResponse)
                .segments(videoSegmentResponses)
                .latestFillBlankResult(latestFillBlankResult)
                .latestQuizResult(latestQuizResult)
                .build();
    }

    private FillBlankSubmitResultResponse toFillBlankSubmitResult(UserFillBlankAttempt attempt) {
        List<FillBlankAnswerResultResponse> answers = userFillBlankAnswerRepository.findByAttemptId(attempt.getId()).stream()
                .sorted(Comparator.comparing(answer -> answer.getBlankItem().getBlankOrder(), Comparator.nullsLast(Integer::compareTo)))
                .map(this::toFillBlankAnswerResult)
                .toList();

        return FillBlankSubmitResultResponse.builder()
                .attemptId(attempt.getId())
                .score(attempt.getScore())
                .totalBlanks(attempt.getTotalBlanks())
                .totalCorrect(attempt.getTotalCorrect())
                .completedAt(attempt.getCompletedAt())
                .answers(answers)
                .build();
    }

    private FillBlankAnswerResultResponse toFillBlankAnswerResult(UserFillBlankAnswer answer) {
        return FillBlankAnswerResultResponse.builder()
                .blankItemId(answer.getBlankItem().getId())
                .segmentId(answer.getBlankItem().getSegment().getId())
                .blankOrder(answer.getBlankItem().getBlankOrder())
                .userAnswer(answer.getUserAnswer())
                .normalizedUserAnswer(answer.getNormalizedUserAnswer())
                .isCorrect(answer.getIsCorrect())
                .correctAnswer(answer.getBlankItem().getAnswerText())
                .acceptedAnswers(answer.getBlankItem().getAcceptedAnswers())
                .build();
    }

    private QuizSubmitResultResponse toQuizSubmitResult(UserQuizAttempt attempt) {
        List<QuizAnswerResultResponse> answers = userQuizAnswerRepository.findByAttemptId(attempt.getId()).stream()
                .sorted(Comparator.comparing(answer -> answer.getQuiz().getOrderIndex(), Comparator.nullsLast(Integer::compareTo)))
                .map(this::toQuizAnswerResult)
                .toList();

        return QuizSubmitResultResponse.builder()
                .attemptId(attempt.getId())
                .score(attempt.getScore())
                .totalCorrect(attempt.getTotalCorrect())
                .totalQuestions(attempt.getTotalQuestions())
                .completedAt(attempt.getCompletedAt())
                .answers(answers)
                .build();
    }

    private QuizAnswerResultResponse toQuizAnswerResult(UserQuizAnswer answer) {
        Long correctOptionId = answer.getQuiz().getOptions().stream()
                .filter(option -> Boolean.TRUE.equals(option.getIsCorrect()))
                .map(QuizOption::getId)
                .findFirst()
                .orElse(null);

        return QuizAnswerResultResponse.builder()
                .quizId(answer.getQuiz().getId())
                .selectedOptionId(answer.getSelectedOption() != null ? answer.getSelectedOption().getId() : null)
                .userAnswerText(answer.getUserAnswerText())
                .isCorrect(answer.getIsCorrect())
                .correctOptionId(correctOptionId)
                .explanation(answer.getQuiz().getExplanation())
                .build();
    }
}
