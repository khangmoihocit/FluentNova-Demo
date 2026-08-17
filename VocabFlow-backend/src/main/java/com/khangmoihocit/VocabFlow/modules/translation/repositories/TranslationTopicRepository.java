package com.khangmoihocit.VocabFlow.modules.translation.repositories;

import com.khangmoihocit.VocabFlow.modules.translation.entities.TranslationTopic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranslationTopicRepository extends JpaRepository<TranslationTopic, Long> {
}
