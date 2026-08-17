package com.khangmoihocit.VocabFlow.modules.vocabulary.repositories;

import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.Topic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface TopicRepository extends JpaRepository<Topic, Long>, JpaSpecificationExecutor<Topic> {
}
