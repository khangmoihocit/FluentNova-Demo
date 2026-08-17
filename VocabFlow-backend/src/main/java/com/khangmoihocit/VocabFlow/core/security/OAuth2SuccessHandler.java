//package com.khangmoihocit.VocabFlow.core.security;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
//import com.khangmoihocit.VocabFlow.core.exception.AppException;
//import com.khangmoihocit.VocabFlow.modules.user.dtos.response.UserResponse;
//import com.khangmoihocit.VocabFlow.modules.user.entities.User;
//import com.khangmoihocit.VocabFlow.modules.user.mappers.UserMapper;
//import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
//import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyGroup;
//import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyGroupRepository;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.Cookie;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.AccessLevel;
//import lombok.RequiredArgsConstructor;
//import lombok.experimental.FieldDefaults;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.ResponseCookie;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.oauth2.core.user.OAuth2User;
//import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
//import org.springframework.stereotype.Component;
//import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
//import com.fasterxml.jackson.databind.SerializationFeature;
//import java.io.IOException;
//import java.net.URLEncoder;
//import java.nio.charset.StandardCharsets;
//import java.util.Optional;
//
//@Component
//@RequiredArgsConstructor
//@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
//public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
//
//    UserRepository userRepository;
//    VocabularyGroupRepository vocabularyGroupRepository;
//    JwtService jwtService;
//    UserMapper userMapper;
//
//    @Override
//    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
//        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
//
//        // Trích xuất thông tin từ Google
//        String email = oAuth2User.getAttribute("email");
//        String name = oAuth2User.getAttribute("name");
//        String picture = oAuth2User.getAttribute("picture");
//        String googleId = oAuth2User.getAttribute("sub");
//
//        Optional<User> optionalUser = userRepository.findByEmail(email);
//        User user;
//
//        if (optionalUser.isPresent()) {
//            user = optionalUser.get();
//            if(user.getIsDeleted()){
//                String encodedEmail = URLEncoder.encode(email, StandardCharsets.UTF_8.toString());
//                String redirectUrl = "http://localhost:5173/login?error=account_deleted&email=" + encodedEmail;
//
//                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
//                return;
//            }
//
//            if (user.getProvider().equals("LOCAL")) {
//                user.setProvider("GOOGLE");
//                user.setProviderId(googleId);
//                userRepository.save(user);
//            }
//
//            if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
//                user.setAvatarUrl(picture);
//                userRepository.save(user);
//            }
//
//        } else {
//            User newUser = new User();
//            newUser.setEmail(email);
//            newUser.setFullName(name);
//            newUser.setAvatarUrl(picture);
//            newUser.setRole("USER");
//            newUser.setPasswordHash("");
//            newUser.setProvider("GOOGLE");
//            newUser.setProviderId(googleId);
//            newUser.setIsVerified(true);
//            newUser.setIsDeleted(false);
//            user = userRepository.save(newUser);
//
//            VocabularyGroup defaultGroup = VocabularyGroup.builder()
//                    .userId(newUser.getId())
//                    .name("DEFAULT")
//                    .isDefault(true)
//                    .build();
//            vocabularyGroupRepository.save(defaultGroup);
//        }
//
//        String accessToken = jwtService.generateAccessToken(user.getEmail());
//        String refreshToken = jwtService.generateRefreshToken(user.getEmail());
//
//        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", accessToken)
//                .path("/")
//                .maxAge(2 * 60 * 60)
//                .sameSite("None")
//                .secure(true)
//                .httpOnly(false)
//                .build();
//        response.addHeader(HttpHeaders.SET_COOKIE, accessTokenCookie.toString());
//
//        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
//                .path("/")
//                .maxAge(5 * 24 * 60 * 60) // 5 ngày
//                .sameSite("None")
//                .secure(true)
//                .httpOnly(false)
//                .build();
//        response.addHeader(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString());
//
//        UserResponse userResponse = userMapper.toUserResponse(user);
//        setUserCookie(userResponse, response);
//
//        getRedirectStrategy().sendRedirect(request, response, "https://vocab-flow-silk.vercel.app/");
//    }
//
//    private void setUserCookie(UserResponse userResponse, HttpServletResponse response) {
//        try {
//            ObjectMapper objectMapper = new ObjectMapper();
//            objectMapper.registerModule(new JavaTimeModule());
//            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
//
//            String userJson = objectMapper.writeValueAsString(userResponse);
//
//            String encodedUserJson = URLEncoder.encode(userJson, StandardCharsets.UTF_8.toString());
//
//            ResponseCookie userCookie = ResponseCookie.from("user", encodedUserJson)
//                    .path("/")
//                    .maxAge(5 * 24 * 60 * 60) // 5 ngày
//                    .sameSite("None")
//                    .secure(true)
//                    .httpOnly(false)
//                    .build();
//
//            response.addHeader(HttpHeaders.SET_COOKIE, userCookie.toString());
//
//        } catch (Exception e) {
//            System.err.println("Lỗi khi lưu User vào Cookie: " + e.getMessage());
//        }
//    }
//}