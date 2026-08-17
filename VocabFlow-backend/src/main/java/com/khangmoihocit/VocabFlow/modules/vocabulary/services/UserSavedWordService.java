package com.khangmoihocit.VocabFlow.modules.vocabulary.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.enums.AnkiStatus;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.UserSaveWordRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.UserSavedWordResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.WordSavedFindResponse;

public interface UserSavedWordService {
    UserSavedWordResponse savedWord(UserSaveWordRequest request);

    PageResponse<WordSavedFindResponse> findSaveWordByUser(
            int pageNo, int pageSize, String sort, String keyword, Long vocabularyUnitID);

    void deleteBySavedWordId(Long userSavedWordId);

    int syncWithAnki();

    int resyncWithAnki(Long vocabularyGroupId);

}
