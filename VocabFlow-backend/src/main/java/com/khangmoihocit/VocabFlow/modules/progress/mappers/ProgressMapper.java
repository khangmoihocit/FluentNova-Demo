package com.khangmoihocit.VocabFlow.modules.progress.mappers;

import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.LearningHistoryResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.UserStreakResponse;
import com.khangmoihocit.VocabFlow.modules.progress.dtos.response.UserVideoProgressResponse;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserStreak;
import com.khangmoihocit.VocabFlow.modules.progress.entities.UserVideoProgress;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ProgressMapper {
    @Mapping(source = "videoLesson.id", target = "videoId")
    UserVideoProgressResponse toProgressResponse(UserVideoProgress entity);

    UserStreakResponse toStreakResponse(UserStreak entity);

    @Mapping(source = "videoLesson.id", target = "videoId")
    @Mapping(source = "videoLesson.title", target = "videoTitle")
    @Mapping(source = "videoLesson.thumbnailUrl", target = "videoThumbnailUrl")
    @Mapping(source = "videoLesson.channel.name", target = "channelName")
    @Mapping(source = "videoLesson.difficultyLevel", target = "difficultyLevel")
    LearningHistoryResponse toHistoryResponse(UserVideoProgress entity);
}

