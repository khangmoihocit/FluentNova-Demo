package com.khangmoihocit.VocabFlow.modules.user.repositories;

import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import lombok.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<@NonNull User, @NonNull UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    //@Modifying dùng khi insert, update, delete
    @Modifying
    @Query("update User u set u.isActive = case when u.isActive = true then false else true end where u.id = :uuid")
    int toggleIsActive(UUID uuid);

    @Modifying
    @Query("update User u set u.avatarUrl = :avatarUrl where u.id = :uuid")
    int updateAvatar(String avatarUrl, UUID uuid);

    @Modifying
    @Query("update User u set u.isDeleted = true where u.id = :uuid")
    int deleteSoft(UUID uuid);

    @Modifying
    @Query("update User u set u.isVerified = true where u.email = :email")
    int updateIsVerified(String email);

    @Modifying
    @Query("update User u set u.passwordHash = :password where u.email = :email")
    int updatePassword(String password, String email);
}
