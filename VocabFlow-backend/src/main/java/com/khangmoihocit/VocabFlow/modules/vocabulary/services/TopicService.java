package com.khangmoihocit.VocabFlow.modules.vocabulary.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.TopicResponse;

public interface TopicService {
    PageResponse<TopicResponse> findAll(int pageNo, int pageSize, String sort, String keyword);
}
