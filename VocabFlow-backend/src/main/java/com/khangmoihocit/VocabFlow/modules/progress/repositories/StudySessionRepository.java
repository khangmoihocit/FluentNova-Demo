package com.khangmoihocit.VocabFlow.modules.progress.repositories;

import com.khangmoihocit.VocabFlow.modules.progress.entities.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    Optional<StudySession> findByUserIdAndVideoLessonIdAndActivityTypeAndSessionDate(UUID userId, Long videoLessonId, String activityType, LocalDate sessionDate);
    
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT s.sessionDate FROM StudySession s " +
           "WHERE s.user.id = :userId AND s.sessionDate BETWEEN :startDate AND :endDate " +
           "ORDER BY s.sessionDate ASC")
    java.util.List<LocalDate> findDistinctSessionDates(UUID userId, LocalDate startDate, LocalDate endDate);
}
