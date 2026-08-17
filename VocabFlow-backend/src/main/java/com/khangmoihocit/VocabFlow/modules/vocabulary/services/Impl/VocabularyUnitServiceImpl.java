package com.khangmoihocit.VocabFlow.modules.vocabulary.services.Impl;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.VocabularyUnitRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyUnitResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyGroup;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyUnit;
import com.khangmoihocit.VocabFlow.modules.vocabulary.mappers.VocabularyUnitMapper;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyGroupRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyUnitRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.VocabularyUnitService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Objects;
import java.util.UUID;

@Slf4j(topic = "VOCABULARY UNIT SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabularyUnitServiceImpl implements VocabularyUnitService {
    VocabularyUnitRepository vocabularyUnitRepository;
    VocabularyGroupRepository vocabularyGroupRepository;
    VocabularyUnitMapper vocabularyUnitMapper;

    @Override
    public VocabularyUnitResponse create(VocabularyUnitRequest request) {
        UUID userId = UserDetailUtil.get().getId();
        VocabularyGroup vocabularyGroup = vocabularyGroupRepository
                .findByIdAndUserId(request.getVocabularyGroupId(), userId)
                .orElseThrow(()->new AppException(ErrorCode.VOCABULARY_GROUP_NOT_EXISTS));

        if(vocabularyUnitRepository
                .existsByNameAndVocabularyGroupId(request.getName(), request.getVocabularyGroupId())){
            throw new AppException(ErrorCode.VOCABULARY_UNIT_SAME_NAME);
        }

        VocabularyUnit vocabularyUnit = vocabularyUnitMapper.toVocabularyUnit(request);
        vocabularyUnit.setVocabularyGroup(vocabularyGroup);
        vocabularyUnit = vocabularyUnitRepository.save(vocabularyUnit);

        return vocabularyUnitMapper.toVocabularyUnitResponse(vocabularyUnit);
    }

    @Override
    public VocabularyUnitResponse update(VocabularyUnitRequest request, Long id) {
        UUID userId = UserDetailUtil.get().getId();
        VocabularyUnit vocabularyUnit = vocabularyUnitRepository.findByIdAndVocabularyGroupUserId(id, userId)
                .orElseThrow(()-> new AppException(ErrorCode.VOCABULARY_UNIT_NOT_EXISTS));

        if(!Objects.equals(vocabularyUnit.getName(), request.getName())){
            if(vocabularyUnitRepository
                    .existsByNameAndVocabularyGroupId(request.getName(), request.getVocabularyGroupId())){
                throw new AppException(ErrorCode.VOCABULARY_UNIT_SAME_NAME);
            }
        }
        if(!Objects.equals(vocabularyUnit.getVocabularyGroup().getId(), request.getVocabularyGroupId())){
            VocabularyGroup vocabularyGroup = vocabularyGroupRepository
                    .findByIdAndUserId(request.getVocabularyGroupId(), userId)
                    .orElseThrow(()->new AppException(ErrorCode.VOCABULARY_GROUP_NOT_EXISTS));
            vocabularyUnit.setVocabularyGroup(vocabularyGroup);
        }

        vocabularyUnit.setName(request.getName());
        vocabularyUnit.setDescription(request.getDescription());
        vocabularyUnit.setOrderIndex(request.getOrderIndex());
        vocabularyUnit = vocabularyUnitRepository.save(vocabularyUnit);
        return vocabularyUnitMapper.toVocabularyUnitResponse(vocabularyUnit);
    }

    @Override
    public void deleteById(Long id) {
        UUID userId = UserDetailUtil.get().getId();
        VocabularyUnit vocabularyUnit = vocabularyUnitRepository.findByIdAndVocabularyGroupUserId(id, userId)
                .orElseThrow(()-> new AppException(ErrorCode.VOCABULARY_UNIT_NOT_EXISTS));
        vocabularyUnitRepository.delete(vocabularyUnit);
    }
}
