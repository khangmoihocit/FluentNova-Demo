package com.khangmoihocit.VocabFlow.modules.vocabulary.repositories;

import com.khangmoihocit.VocabFlow.core.enums.AnkiStatus;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.UserSavedWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSavedWordRepository extends JpaRepository<UserSavedWord, Long>, JpaSpecificationExecutor<UserSavedWord> {

    boolean existsByUserIdAndDictionaryWordIdAndVocabularyUnitId(UUID userId, Long wordId, Long vocabularyUnitId);

    Optional<UserSavedWord> findByIdAndUserId(Long id, UUID userId);

    List<UserSavedWord> findByUserIdAndAnkiStatus(UUID userId, AnkiStatus ankiStatus);

    @Transactional
    void deleteByUserId(UUID uuid);

//    @Modifying
//    @Query("update UserSavedWord usw set usw.ankiStatus = :status where usw.vocabularyUnit.id = :vocabularyGroupId and usw.user.id = :userId")
//    int updateAnkiStatus(AnkiStatus status, Long vocabularyGroupId, UUID userId);

    List<UserSavedWord> findByUserIdAndVocabularyUnitId(UUID userId, Long vocabularyGroupId);
}
