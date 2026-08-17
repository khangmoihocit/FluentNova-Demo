package com.khangmoihocit.VocabFlow.modules.progress.repositories;

import com.khangmoihocit.VocabFlow.modules.progress.entities.UserStreak;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface UserStreakRepository extends JpaRepository<UserStreak, UUID> {
}
