package com.khangmoihocit.VocabFlow.modules.user.entities;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Một User có thể có nhiều Refresh Token (đăng nhập trên đt, máy tính cùng lúc)
    //tối đa 2 thiết bị
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    User user;

    @Column(nullable = false, unique = true, columnDefinition = "TEXT")
    String token;

    @Column(name = "expiry_date", nullable = false)
    LocalDateTime expiryDate;

    // Đánh dấu token này đã bị thu hồi (khi người dùng đăng xuất)
    boolean revoked = false;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    LocalDateTime createdAt = LocalDateTime.now();
}
