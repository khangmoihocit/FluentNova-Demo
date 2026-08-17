package com.khangmoihocit.VocabFlow.modules.user.repositories;

import com.khangmoihocit.VocabFlow.modules.user.entities.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    @Query("select r from RefreshToken r where r.user.id = :id order by r.expiryDate asc")
    List<RefreshToken> getAllByUserId(UUID id);

    boolean existsByToken (String token);

    @Transactional //hàm custom sẽ cần transaction
    void deleteByToken (String token);

    @Transactional
    int deleteByUserId(UUID uuid);
}
