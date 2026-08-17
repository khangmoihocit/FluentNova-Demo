package com.khangmoihocit.VocabFlow.modules.vocabulary.repositories;

import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyUnit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VocabularyUnitRepository extends JpaRepository<VocabularyUnit, Long> {

    Optional<VocabularyUnit> findByVocabularyGroupIsDefaultAndVocabularyGroupUserId(boolean vocabularyGroupIsDefault, UUID userId);

    Optional<VocabularyUnit> findByIdAndVocabularyGroupUserId(Long unitId, UUID userId);

    boolean existsByNameAndVocabularyGroupId(String name, Long groupId);

    List<VocabularyUnit> findByVocabularyGroupIdIn(List<Long> groupIds);
}
