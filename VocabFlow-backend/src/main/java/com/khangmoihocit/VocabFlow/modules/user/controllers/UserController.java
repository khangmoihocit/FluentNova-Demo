package com.khangmoihocit.VocabFlow.modules.user.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.services.RateLimitService;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.ChangePasswordRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.request.UserUpdateRequest;
import com.khangmoihocit.VocabFlow.modules.user.dtos.response.UserResponse;
import com.khangmoihocit.VocabFlow.modules.user.services.AuthenticationService;
import com.khangmoihocit.VocabFlow.modules.user.services.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/user")
public class UserController {
    UserService userService;
    AuthenticationService authenticationService;
    RateLimitService rateLimitService;
    long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    List<String> ALLOWED_CONTENT_TYPES = Arrays.asList("image/jpeg", "image/png", "image/jpg");

    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("file") MultipartFile file, HttpServletRequest request) {
        rateLimitService.check("user:upload-avatar:" + clientKey(request), 5, Duration.ofMinutes(1));

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng chọn một file ảnh!"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Định dạng không hợp lệ! Chỉ chấp nhận ảnh JPG hoặc PNG."));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB."));
        }

        try{
            String avatarUrl = userService.uploadAvatar(file);
            return ResponseEntity.ok(ApiResponse.success(avatarUrl));
        }catch (OurException ex){
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/me")
    ResponseEntity<?> me(){
        UserResponse userResponse = userService.getMyInfo();

        ApiResponse<UserResponse> response =  ApiResponse.success(userResponse, "Tải thông tin của bạn thành công!");
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAll(@RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
                                                                   @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
                                                                   @RequestParam(name = "sort", defaultValue = "id,asc") String sort,
                                                                   @RequestParam(name = "keyword", defaultValue = "") String keyword){
        PageResponse<UserResponse> pageResponse = userService.getUsers(pageNo, pageSize, sort, keyword);
        ApiResponse<PageResponse<UserResponse>> response =
                ApiResponse.success(pageResponse, pageResponse.getData().isEmpty() ? "Danh sách user trống" : "Lấy danh sách thành công");

        return ResponseEntity.ok(response);
    }

    @PutMapping
    ResponseEntity<?> updateInfo(@Valid @RequestBody UserUpdateRequest request, HttpServletRequest httpRequest){
        rateLimitService.check("user:update-info:" + clientKey(httpRequest), 10, Duration.ofMinutes(1));

        ApiResponse<UserResponse> response = ApiResponse.success(userService.updateBasicInfo(request), "Cập nhật thành công!");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/toggle-active-account/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    ResponseEntity<?> toggleActiveAccount(@PathVariable(name = "id") String id, HttpServletRequest request){
        rateLimitService.check("user:toggle-active-account:" + clientKey(request) + ":" + id, 10, Duration.ofMinutes(1));

        userService.toggleActiveAccount(id);
        return ResponseEntity.ok(ApiResponse.success("cập nhật trạng thái tài khoản thành công"));
    }

    @DeleteMapping
    ResponseEntity<?> deleteById(HttpServletRequest request){
        rateLimitService.check("user:delete-account:" + clientKey(request), 3, Duration.ofMinutes(10));

        userService.deleteAccount();
        return ResponseEntity.ok(ApiResponse.success("Xóa tài khoản thành công"));
    }

    @PostMapping("/change-password-otp")
    ResponseEntity<?> requestChangePasswordOtp(HttpServletRequest request) {
        String clientKey = clientKey(request);
        rateLimitService.check("user:change-password-otp:short:" + clientKey, 1, Duration.ofMinutes(1));
        rateLimitService.check("user:change-password-otp:long:" + clientKey, 5, Duration.ofHours(1));

        authenticationService.requestChangePasswordOtp();
        ApiResponse<?> response = ApiResponse.success("Mã OTP xác nhận đổi mật khẩu đã được gửi đến email!");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request, HttpServletRequest httpRequest) {
        rateLimitService.check("user:change-password:" + clientKey(httpRequest), 5, Duration.ofMinutes(10));

        authenticationService.changePassword(request.getOldPassword(), request.getNewPassword(), request.getOtpCode());
        ApiResponse<?> response = ApiResponse.success("Đổi mật khẩu thành công!");
        return ResponseEntity.ok(response);
    }

    private String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

}
