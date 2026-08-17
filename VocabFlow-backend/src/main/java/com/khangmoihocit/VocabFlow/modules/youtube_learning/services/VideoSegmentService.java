package com.khangmoihocit.VocabFlow.modules.youtube_learning.services;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.VideoSegmentToolRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoDetailResponse;

import java.util.List;

public interface VideoSegmentService {
    void insertSegment(Long videoId, List<VideoSegmentToolRequest> toolRequests);

    void updateSegment(Long videoId, List<VideoSegmentToolRequest> toolRequests);

    VideoDetailResponse getById(Long videoId);
}
