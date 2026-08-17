package com.khangmoihocit.VocabFlow.modules.quiz.mappers;

import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.QuizOptionRequest;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.request.VideoQuizRequest;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.QuizOptionResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.dtos.response.VideoQuizResponse;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.QuizOption;
import com.khangmoihocit.VocabFlow.modules.quiz.entities.VideoQuiz;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface QuizMapper {
    QuizOption toOptionEntity(QuizOptionRequest request);
    QuizOptionResponse toOptionResponse(QuizOption entity);

    VideoQuiz toQuizEntity(VideoQuizRequest request);
    VideoQuizResponse toQuizResponse(VideoQuiz entity);
}
