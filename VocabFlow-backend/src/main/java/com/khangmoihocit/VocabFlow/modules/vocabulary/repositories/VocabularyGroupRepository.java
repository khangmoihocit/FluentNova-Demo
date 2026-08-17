package com.khangmoihocit.VocabFlow.modules.vocabulary.repositories;

import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyGroupRepository extends JpaRepository<VocabularyGroup, Long>, JpaSpecificationExecutor<VocabularyGroup> {

    Optional<VocabularyGroup> findByIdAndUserId(Long id, UUID userId);

    @Transactional
    void deleteByUserId(UUID userId);
}
