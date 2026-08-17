package com.khangmoihocit.VocabFlow.modules.game.repositories;

import com.khangmoihocit.VocabFlow.modules.game.entities.UserGameDictationDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserGameDictationDetailRepository extends JpaRepository<UserGameDictationDetail, Long> {
    
    @Query("SELECT d FROM UserGameDictationDetail d JOIN FETCH d.segment s JOIN FETCH s.video WHERE d.session.id = :sessionId")
    List<UserGameDictationDetail> findBySessionId(@Param("sessionId") Long sessionId);
}
