package com.khangmoihocit.VocabFlow.modules.user.services;

import com.khangmoihocit.VocabFlow.modules.user.dtos.request.AuthenticationRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.GoogleLoginRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.RefreshTokenRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.UserCreationRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.AuthenticationResponse;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.RefreshTokenResponse;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.UserResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotNull;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;

import java.io.IOException;
import java.security.GeneralSecurityException;

public interface AuthenticationService {
    AuthenticationResponse authentication(AuthenticationRequest request);

    AuthenticationResponse loginWithGoogle(GoogleLoginRequest request) throws GeneralSecurityException, IOException;

    UserResponse register(UserCreationRequest request);

    RefreshTokenResponse refreshToken(RefreshTokenRequest refreshTokenRequest);

    void logout(RefreshTokenRequest request);

    AuthenticationResponse verifyRegister(String email, String otp);

    void resendRegisterOtp(String email);

    void forgetPassword(String email);

    void resetPassword(String email, String otp, String newPassword);

    void requestChangePasswordOtp();

    void changePassword(String oldPassword, String newPassword, String otp);

    void recoverAccount(String email);

    void reNewAccount(String email);

}
