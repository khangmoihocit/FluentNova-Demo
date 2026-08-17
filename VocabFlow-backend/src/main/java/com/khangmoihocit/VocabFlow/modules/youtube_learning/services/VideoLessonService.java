package com.khangmoihocit.VocabFlow.modules.youtube_learning.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.VideoLessonRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonFilterResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonResponse;

import java.util.List;

public interface VideoLessonService {
    VideoLessonResponse createVideoLesson(VideoLessonRequest request);

    PageResponse<VideoLessonFilterResponse> getAllVideoLessons(int pageNo, int pageSize, String sort,
                                                               Long channelId, String keyword,
                                                               List<Long> categoryIds, String difficultyLevel);

    PageResponse<VideoLessonResponse> getAllVideoLessonsAdmin(int pageNo, int pageSize, String sort,
                                                              Long channelId, String keyword,
                                                              List<Long> categoryIds, String difficultyLevel
    ,Boolean isPublished);

    VideoLessonResponse getVideoLessonById(Long id);

    VideoLessonResponse updateVideoLesson(Long id, VideoLessonRequest request);

    void deleteVideoLesson(Long id);

}
