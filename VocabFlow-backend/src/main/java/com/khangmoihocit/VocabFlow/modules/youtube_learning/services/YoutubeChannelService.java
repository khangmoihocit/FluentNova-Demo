package com.khangmoihocit.VocabFlow.modules.youtube_learning.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.YoutubeChannelRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.YoutubeChannelResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface YoutubeChannelService {
    YoutubeChannelResponse createChannel(YoutubeChannelRequest request);

    PageResponse<YoutubeChannelResponse> getAllChannels(int pageNo, int pageSize, String sort, String keyword);

    YoutubeChannelResponse getChannelById(Long id);

    YoutubeChannelResponse updateChannel(Long id, YoutubeChannelRequest request);

    void deleteChannel(Long id);
}
