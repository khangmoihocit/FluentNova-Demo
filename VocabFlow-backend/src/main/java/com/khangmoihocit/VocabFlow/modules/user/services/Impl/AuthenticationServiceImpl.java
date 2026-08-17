package com.khangmoihocit.VocabFlow.modules.user.services.Impl;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.exception.ValidTokenException;
import com.khangmoihocit.VocabFlow.core.security.JwtService;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.services.EmailService;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.AuthenticationRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.GoogleLoginRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.RefreshTokenRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.UserCreationRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.AuthenticationResponse;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.RefreshTokenResponse;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.UserResponse;
import com.khangmoihocit.VocabFlow.modules.user.entities.OtpToken;
import com.khangmoihocit.VocabFlow.modules.user.entities.RefreshToken;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.mappers.UserMapper;
import com.khangmoihocit.VocabFlow.modules.user.repositories.OtpTokenRepository;
import com.khangmoihocit.VocabFlow.modules.user.repositories.RefreshTokenRepository;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.user.services.AuthenticationService;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyGroup;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyUnit;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.UserSavedWordRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyGroupRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyUnitRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.security.auth.login.AccountException;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j(topic = "AUTHENTICATION SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationServiceImpl implements AuthenticationService {
    JwtService jwtService;
    AuthenticationManager authenticationManager;
    UserDetailsServiceImpl userDetailsService;
    RefreshTokenRepository refreshTokenRepository;
    UserRepository userRepository;
    UserMapper userMapper;
    PasswordEncoder passwordEncoder;
    VocabularyGroupRepository vocabularyGroupRepository;
    OtpTokenRepository otpTokenRepository;
    UserSavedWordRepository userSavedWordRepository;
    EmailService emailService;
    VocabularyUnitRepository vocabularyUnitRepository;

    @NonFinal
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    String clientId;

    @NonFinal
    @Value("${spring.app.google.client-id.extension}")
    String extensionClientId;

    private void saveRefreshTokenToDB(String refreshToken, User user) {
        List<RefreshToken> refreshTokenList = refreshTokenRepository.getAllByUserId(user.getId());
        if (refreshTokenList.size() > 1) {
            RefreshToken refreshTokenSave = refreshTokenList.get(0);
            refreshTokenSave.setToken(refreshToken);
            refreshTokenSave.setExpiryDate(jwtService.extractExpired(refreshToken));
            refreshTokenRepository.save(refreshTokenSave);
        } else {
            refreshTokenRepository.save(RefreshToken.builder()
                    .token(refreshToken)
                    .user(user)
                    .expiryDate(jwtService.extractExpired(refreshToken))
                    .build());
        }
    }

    private void sendOtpAndSaveDB(String email, String type){
        OtpToken otpToken = OtpToken.builder()
                .email(email)
                .otpCode(generateOtp())
                .expiresAt(LocalDateTime.now().plusMinutes(5))
                .type(type)
                .build();
        otpToken = otpTokenRepository.save(otpToken);
        emailService.sendOtpEmail(otpToken.getEmail(), otpToken.getOtpCode(), otpToken.getType());
    }

    private String generateOtp() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    private OtpToken checkAndValidateOtp(String email, String otp, String type) {
        OtpToken otpToken = otpTokenRepository.findByEmailAndOtpCodeAndType(email, otp, type)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_VERIFY_ERROR));

        if (otpToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpTokenRepository.delete(otpToken);
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }
        return otpToken;
    }

    @Override
    public AuthenticationResponse authentication(AuthenticationRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_REGISTER));

        if(!user.getIsVerified()) throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFY);
        if (user.getIsDeleted()) throw new AppException(ErrorCode.EMAIL_NOT_REGISTER);
        if ("GOOGLE".equals(user.getProvider())) throw new AppException(ErrorCode.ACCOUNT_ALREADY_GOOGLE);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsCustom userDetails = (UserDetailsCustom) authentication.getPrincipal();

        String accessToken = jwtService.generateAccessToken(userDetails.getUsername());
        String refreshToken = jwtService.generateRefreshToken(userDetails.getUsername());

        saveRefreshTokenToDB(refreshToken, user);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userMapper.toUserResponse(user))
                .build();
    }

    @Override
    public AuthenticationResponse loginWithGoogle(GoogleLoginRequest request) throws GeneralSecurityException, IOException {
        NetHttpTransport transport = new NetHttpTransport();
        GsonFactory jsonFactory = GsonFactory.getDefaultInstance();

        // 1. Cấu hình Verifier với Client ID của dự án
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(transport, jsonFactory)
                .setAudience(Arrays.asList(clientId, extensionClientId))
                .build();

        // 2. Xác thực Token
        GoogleIdToken idToken = verifier.verify(request.getToken());
        if (idToken != null) {
            GoogleIdToken.Payload payload = idToken.getPayload();

            // 3. Trích xuất thông tin
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");
            String googleId = payload.getSubject();

            Optional<User> optionalUser = userRepository.findByEmail(email);
            User user;

            if (optionalUser.isPresent()) {
                user = optionalUser.get();
                if (user.getIsDeleted()) {
                    throw new AppException(ErrorCode.ACCOUNT_DELETED_BUT_CAN_RECOVER);
                }
                if ("LOCAL".equals(user.getProvider())) {
                    user.setProvider("GOOGLE");
                    user.setProviderId(googleId);
                    userRepository.save(user);
                }
                if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
                    user.setAvatarUrl(picture);
                    userRepository.save(user);
                }
            } else {
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setFullName(name);
                newUser.setAvatarUrl(picture);
                newUser.setRole("USER");
                newUser.setPasswordHash("");
                newUser.setProvider("GOOGLE");
                newUser.setProviderId(googleId);
                newUser.setIsVerified(true);
                newUser.setIsDeleted(false);
                user = userRepository.save(newUser);

                VocabularyGroup defaultGroup = VocabularyGroup.builder()
                        .userId(newUser.getId())
                        .name("DEFAULT")
                        .isDefault(true)
                        .build();
                vocabularyGroupRepository.save(defaultGroup);

                VocabularyUnit defaultUnit = VocabularyUnit.builder()
                        .name("UNIT DEFAULT")
                        .vocabularyGroup(defaultGroup)
                        .build();
                vocabularyUnitRepository.save(defaultUnit);
            }

            String accessToken = jwtService.generateAccessToken(user.getEmail());
            String refreshToken = jwtService.generateRefreshToken(user.getEmail());
            saveRefreshTokenToDB(refreshToken, user);

            return AuthenticationResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .user(userMapper.toUserResponse(user))
                    .build();
        }else{
            throw new OurException("id gg is null");
        }
    }

    @Override
    @Transactional
    public UserResponse register(UserCreationRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmail(email);

        if (userOptional.isPresent()) {
            if (Boolean.TRUE.equals(userOptional.get().getIsDeleted())) {
                throw new AppException(ErrorCode.ACCOUNT_DELETED_BUT_CAN_RECOVER);
            } else {
                throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
            }
        }

        User user = userMapper.toUser(request);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setIsDeleted(false);
        user.setIsVerified(false);
        user = userRepository.save(user);

        sendOtpAndSaveDB(request.getEmail(), "REGISTER");

        VocabularyGroup defaultGroup = VocabularyGroup.builder()
                .userId(user.getId())
                .name("GROUP DEFAULT")
                .isDefault(true)
                .build();
        vocabularyGroupRepository.save(defaultGroup);

        VocabularyUnit defaultUnit = VocabularyUnit.builder()
                .name("UNIT DEFAULT")
                .vocabularyGroup(defaultGroup)
                .build();
        vocabularyUnitRepository.save(defaultUnit);

        return userMapper.toUserResponse(user);
    }

    @Override
    @Transactional
    public AuthenticationResponse verifyRegister(String email, String otp) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getIsVerified()) throw new AppException(ErrorCode.USER_ALREADY_VERIFIED);

        OtpToken otpToken = checkAndValidateOtp(email, otp, "REGISTER");

        user.setIsVerified(true);
        userRepository.save(user);
        otpTokenRepository.delete(otpToken);

        UserDetailsCustom userDetails = new UserDetailsCustom(user.getId(), user.getEmail(),
                user.getPasswordHash(), user.getIsActive(),
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole())));
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String accessToken = jwtService.generateAccessToken(userDetails.getUsername());
        String refreshToken = jwtService.generateRefreshToken(userDetails.getUsername());

        saveRefreshTokenToDB(refreshToken, user);

        return AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                    .user(userMapper.toUserResponse(user))
                    .build();
    }

    @Override
    @Transactional
    public void resendRegisterOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (Boolean.TRUE.equals(user.getIsVerified())) {
            throw new AppException(ErrorCode.USER_ALREADY_VERIFIED);
        }
        sendOtpAndSaveDB(email, "REGISTER");
    }

    @Override
    @Transactional
    public RefreshTokenResponse refreshToken(RefreshTokenRequest refreshTokenRequest) {
        try {
            final String username = jwtService.extractUsername(refreshTokenRequest.getRefreshToken());
            UserDetailsCustom userDetails = (UserDetailsCustom) userDetailsService.loadUserByUsername(username);
            if (!username.equals(userDetails.getUsername())) {
                throw new ValidTokenException("User token không chính xác");
            }

            if (!userDetails.isEnabled()) {
                throw new ValidTokenException("Tài khoản của bạn hiện đang bị khóa");
            }

            if (!refreshTokenRepository.existsByToken(refreshTokenRequest.getRefreshToken())) {
                throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
            }
            refreshTokenRepository.deleteByToken(refreshTokenRequest.getRefreshToken());
            String newAccessToken = jwtService.generateAccessToken(username);
            String newRefreshToken = jwtService.generateRefreshToken(username);
            User user = userRepository.findById(userDetails.getId()).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            saveRefreshTokenToDB(newRefreshToken, user);

            return RefreshTokenResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken).build();
        } catch (ExpiredJwtException ex) {
            throw new ValidTokenException("Token đã hết hạn, vui lòng đăng nhập lại");
        } catch (SignatureException ex) {
            throw new ValidTokenException("Chữ ký token không hợp lệ hoặc đã bị giả mạo");
        } catch (MalformedJwtException ex) {
            throw new ValidTokenException("Token không đúng định dạng");
        } catch (UnsupportedJwtException ex) {
            throw new ValidTokenException("Định dạng Token không được hệ thống hỗ trợ");
        } catch (IllegalArgumentException ex) {
            throw new ValidTokenException("Token không hợp lệ hoặc bị trống");
        } catch (ValidTokenException | AppException ex) {
            throw new ValidTokenException(ex.getMessage());
        } catch (Exception ex) {
            log.error(ex.getMessage());
            throw new ValidTokenException("Đã xảy ra lỗi trong quá trình xác thực token");
        }
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenRepository.deleteByToken(request.getRefreshToken());
    }

    @Override
    public void forgetPassword(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(()-> new AppException(ErrorCode.EMAIL_NOT_REGISTER));
        if(!user.getIsActive()) throw new AppException(ErrorCode.USER_NOT_FOUND);
        if(user.getIsDeleted()) throw new AppException(ErrorCode.USER_NOT_FOUND);
        if(!user.getIsVerified()) throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFY);
        if ("GOOGLE".equals(user.getProvider())) {
            throw new OurException("Tài khoản Google không thể đổi mật khẩu!");
        }
        userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        sendOtpAndSaveDB(email, "FORGOT_PASSWORD");
    }

    @Override
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        OtpToken otpToken = checkAndValidateOtp(email, otp, "FORGOT_PASSWORD");
        userRepository.updatePassword(passwordEncoder.encode(newPassword), email);
        otpTokenRepository.delete(otpToken);
    }

    @Override
    public void requestChangePasswordOtp() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if ("GOOGLE".equals(user.getProvider())) {
            throw new OurException("Tài khoản Google không thể đổi mật khẩu!");
        }

        sendOtpAndSaveDB(email, "CHANGE_PASSWORD");
    }

    @Override
    @Transactional
    public void changePassword(String oldPassword, String newPassword, String otp) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if(!user.getIsActive()) throw new AppException(ErrorCode.USER_NOT_FOUND);
        if(user.getIsDeleted()) throw new AppException(ErrorCode.USER_NOT_FOUND);
        if(!user.getIsVerified()) throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFY);
        userRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if ("GOOGLE".equals(user.getProvider())) {
            throw new OurException("Tài khoản Google không thể đổi mật khẩu!");
        }

        // Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new OurException("Mật khẩu cũ không chính xác!");
        }

        // Xác thực OTP
        OtpToken otpToken = checkAndValidateOtp(email, otp, "CHANGE_PASSWORD");

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        otpTokenRepository.delete(otpToken);
    }

    @Override
    @Transactional
    public void recoverAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!user.getIsDeleted()) {
            throw new AppException(ErrorCode.ACCOUNT_EXIST_IS_TRUE);
        }

        user.setIsDeleted(false);
        userRepository.save(user);

        log.info("Đã khôi phục thành công tài khoản cho email: {}", email);
    }

    @Override
    public void reNewAccount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (!user.getIsDeleted()) {
            throw new AppException(ErrorCode.ACCOUNT_EXIST_IS_TRUE);
        }

        refreshTokenRepository.deleteByUserId(user.getId());
        vocabularyGroupRepository.deleteByUserId(user.getId());
        userSavedWordRepository.deleteByUserId(user.getId());
        userRepository.deleteById(user.getId());
    }
}
