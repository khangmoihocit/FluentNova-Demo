package com.khangmoihocit.VocabFlow.modules.vocabulary.services;

import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.VocabularyUnitRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyUnitResponse;

public interface VocabularyUnitService{
    VocabularyUnitResponse create(VocabularyUnitRequest request);

    VocabularyUnitResponse update(VocabularyUnitRequest request, Long id);

    void deleteById(Long id);
}
