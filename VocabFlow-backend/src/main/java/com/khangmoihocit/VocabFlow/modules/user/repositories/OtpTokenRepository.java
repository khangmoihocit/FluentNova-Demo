package com.khangmoihocit.VocabFlow.modules.user.repositories;

import com.khangmoihocit.VocabFlow.modules.user.entities.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByEmailAndOtpCodeAndType (String email, String otpCode, String type);
}
