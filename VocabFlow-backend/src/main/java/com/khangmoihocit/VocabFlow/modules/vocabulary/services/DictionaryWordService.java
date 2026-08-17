package com.khangmoihocit.VocabFlow.modules.vocabulary.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.LookupRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.*;

import java.util.List;

public interface DictionaryWordService {
    LookupResponse lookupBasic(String word);

    LookupResponse lookupWithAi(LookupRequest request);

    TranslateResponse translateText(String request);

    PageResponse<DictionaryWordResponse> findAll(int pageNo, int pageSize, String sort, String keyword);

    PageResponse<TopicResponse> findWordByTopic(int pageNo, int pageSize, String sort, String topic);

    //v2 look up with updated dictionary
    List<LookupWordResponse> lookupWord(String word);
}
