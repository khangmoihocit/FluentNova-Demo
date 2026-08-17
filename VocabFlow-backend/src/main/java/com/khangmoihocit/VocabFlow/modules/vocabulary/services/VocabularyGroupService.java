package com.khangmoihocit.VocabFlow.modules.vocabulary.services;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.VocabularyGroupRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyGroupNUnitResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyGroupResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyGroup;

import java.util.List;

public interface VocabularyGroupService {
    List<VocabularyGroupNUnitResponse> findAll(String sort);

    VocabularyGroupResponse create(VocabularyGroupRequest request);

    VocabularyGroupResponse update(VocabularyGroupRequest request, Long id);

    void deleteById(Long id);
}
