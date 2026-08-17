package com.khangmoihocit.VocabFlow.modules.quiz.services;

import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.BulkVideoQuizRequest;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.QuizOptionRequest;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.QuizSubmitRequest;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.QuizSubmissionRequest;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.VideoQuizRequest;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.QuizSubmissionResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.QuizSubmitResultResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.QuizOptionAdminResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.UserQuizAttemptResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.VideoQuizAdminResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.VideoQuizResponse;

import java.util.List;

public interface QuizService {
    void addQuizzesToVideo(BulkVideoQuizRequest request);
    List<VideoQuizResponse> getQuizzesByVideoId(Long videoId);
    List<VideoQuizAdminResponse> getAdminQuizzesByVideoId(Long videoId);
    VideoQuizAdminResponse createQuiz(Long videoId, VideoQuizRequest request);
    VideoQuizAdminResponse updateQuiz(Long quizId, VideoQuizRequest request);
    QuizOptionAdminResponse createOption(Long quizId, QuizOptionRequest request);
    QuizOptionAdminResponse updateOption(Long optionId, QuizOptionRequest request);
    void deleteOption(Long optionId);
    QuizSubmitResultResponse submitQuiz(Long videoId, QuizSubmitRequest request);
    List<UserQuizAttemptResponse> getUserAttempts(Long videoId);
    QuizSubmissionResponse submitQuizAttempt(QuizSubmissionRequest request);
    void deleteQuiz(Long quizId);
}
