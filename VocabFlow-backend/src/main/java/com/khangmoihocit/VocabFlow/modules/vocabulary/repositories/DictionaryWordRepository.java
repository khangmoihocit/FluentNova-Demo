package com.khangmoihocit.VocabFlow.modules.vocabulary.repositories;

import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.DictionaryWord;
import com.khangmoihocit.VocabFlow.modules.vocabulary.projections.WordSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DictionaryWordRepository extends JpaRepository<DictionaryWord, Long>, JpaSpecificationExecutor<DictionaryWord> {

    Optional<DictionaryWord> findByWordAndPartOfSpeech(String word, String partOfSpeech);

    Optional<DictionaryWord> findFirstByWord(String word);

    List<DictionaryWord> findAllByWord(String word);

//    @Query(value = "select d.id, d.word, d.pronunciation, d.description, d.html_content as htmlContent " +
//            "from dictionary_words d " +
//            "where d.word = :word limit 1", nativeQuery = true)
    Optional<List<WordSummary>> findByWord(String word);

}
