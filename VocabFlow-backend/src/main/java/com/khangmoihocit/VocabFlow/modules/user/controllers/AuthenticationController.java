package com.khangmoihocit.VocabFlow.modules.user.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.services.RateLimitService;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.*;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.AuthenticationResponse;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.UserResponse;
import com.khangmoihocit.VocabFlow.modules.user.services.AuthenticationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.Duration;

@Slf4j(topic = "AuthenticationController")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/auth")
public class AuthenticationController {
    AuthenticationService authenticationService;
    RateLimitService rateLimitService;

    @PostMapping("/login")
    ResponseEntity<?> login(@Valid @RequestBody AuthenticationRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("auth:login:" + clientKey(httpRequest) + ":" + normalizeEmail(request.getEmail()), 5, Duration.ofMinutes(1));
        AuthenticationResponse authenticationResponse = authenticationService.authentication(request);
        return ResponseEntity.ok(ApiResponse.success(authenticationResponse, "Dang nhap thanh cong!"));
    }

    @PostMapping("/register")
    ResponseEntity<?> register(@Valid @RequestBody UserCreationRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("auth:register:" + clientKey(httpRequest) + ":" + normalizeEmail(request.getEmail()), 3, Duration.ofMinutes(10));
        ApiResponse<UserResponse> response =
                ApiResponse.success(authenticationService.register(request), "Tao tai khoan thanh cong!");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        ApiResponse<?> response = ApiResponse.success(authenticationService.refreshToken(request));
        log.info("dang refresh token");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    ResponseEntity<?> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authenticationService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Dang xuat thanh cong!"));
    }

    @PostMapping("/verify-register")
    ResponseEntity<?> verifyRegister(@Valid @RequestBody VerifyRegisterRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("auth:verify-register:" + clientKey(httpRequest) + ":" + normalizeEmail(request.getEmail()), 5, Duration.ofMinutes(10));
        AuthenticationResponse result = authenticationService.verifyRegister(request.getEmail(), request.getOtpCode());
        return ResponseEntity.ok(ApiResponse.success(result, "Xac thuc email thanh cong!"));
    }

    @PostMapping("/resend-register-otp")
    ResponseEntity<?> resendRegisterOtp(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("auth:resend-register-otp:short:" + clientKey(httpRequest) + ":" + normalizeEmail(request.getEmail()), 1, Duration.ofMinutes(1));
        rateLimitService.check("auth:resend-register-otp:long:" + normalizeEmail(request.getEmail()), 5, Duration.ofHours(1));
        authenticationService.resendRegisterOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Ma OTP xac thuc da duoc gui den email cua ban!"));
    }

    @PostMapping("/forgot-password")
    ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("auth:forgot-password:short:" + clientKey(httpRequest) + ":" + normalizeEmail(request.getEmail()), 1, Duration.ofMinutes(1));
        rateLimitService.check("auth:forgot-password:long:" + normalizeEmail(request.getEmail()), 5, Duration.ofHours(1));
        authenticationService.forgetPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Ma OTP khoi phuc mat khau da duoc gui den email cua ban!"));
    }

    @PostMapping("/reset-password")
    ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authenticationService.resetPassword(request.getEmail(), request.getOtpCode(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success("Dat lai mat khau thanh cong! Vui long dang nhap lai."));
    }

    @PostMapping("/recover-account")
    ResponseEntity<?> recoverAccount(@Valid @RequestBody RecoverAccountRequest request) {
        authenticationService.recoverAccount(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Tai khoan cua ban da duoc khoi phuc thanh cong! Vui long dang nhap lai."));
    }

    @PostMapping("/re-new-account")
    ResponseEntity<?> reNewAccount(@Valid @RequestBody RecoverAccountRequest request) {
        authenticationService.reNewAccount(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Bay gio ban co the dang nhap lai."));
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@Valid @RequestBody GoogleLoginRequest request) throws GeneralSecurityException, IOException {
        AuthenticationResponse authenticationResponse = authenticationService.loginWithGoogle(request);
        return ResponseEntity.ok(ApiResponse.success(authenticationResponse, "Dang nhap thanh cong!"));
    }

    private String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
