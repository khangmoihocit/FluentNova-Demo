package com.khangmoihocit.VocabFlow.core.security;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import java.util.function.Function;

@Component
@Slf4j
public class JwtService {
    @NonFinal
    @Value("${spring.jwt.signerKey}")
    protected String SIGNER_KEY;

    @NonFinal
    @Value("${spring.jwt.issuer}")
    protected String ISSUER;

    @NonFinal
    @Value("${spring.jwt.valid-duration}")
    protected long ACCESS_TOKEN_VALID_DURATION;

    @NonFinal
    @Value("${spring.jwt.refreshable-duration}")
    protected long REFRESH_TOKEN_VALID_DURATION;



    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SIGNER_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(String email) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claim("token_type", "ACCESS")
                .issuer(ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(Instant.now().plus(ACCESS_TOKEN_VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()))
                .signWith(getSignInKey(), Jwts.SIG.HS512)
                .compact();
    }

    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claim("token_type", "REFRESH")
                .issuer(ISSUER)
                .issuedAt(new Date())
                .expiration(new Date(Instant.now().plus(REFRESH_TOKEN_VALID_DURATION, ChronoUnit.SECONDS).toEpochMilli()))
                .signWith(getSignInKey(), Jwts.SIG.HS512)
                .compact();
    }

    //đã bao gồm kiểm tra token: hạn, chữ ký, issuer,...
    public String extractUsername(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    public LocalDateTime extractExpired(String token) {
        Claims claims = extractAllClaims(token);
        LocalDateTime expired = claims.getExpiration().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        return expired;
    }

    public String extractTokenType(String token) {
        return extractAllClaims(token).get("token_type", String.class);
    }

    // Lấy theo nhiều claim khác nhau
    public <T> T extractClaims(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Giải mã token và lấy tất cả claims
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
