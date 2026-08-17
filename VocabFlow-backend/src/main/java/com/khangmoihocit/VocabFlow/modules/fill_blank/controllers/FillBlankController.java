package com.khangmoihocit.VocabFlow.modules.fill_blank.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.services.RateLimitService;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.CreateFillBlankItemRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.SubmitFillBlankRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.UpdateFillBlankItemRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.FillBlankExerciseResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.FillBlankItemAdminResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.FillBlankSubmitResultResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.UserFillBlankAttemptResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.services.FillBlankService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.Duration;

@RestController
@RequestMapping("${spring.api.prefix}/fill-blanks")
@RequiredArgsConstructor
public class FillBlankController {
    private final FillBlankService fillBlankService;
    private final RateLimitService rateLimitService;

    @GetMapping("/video/{videoId}")
    public ResponseEntity<ApiResponse<FillBlankExerciseResponse>> getUserFillBlank(@PathVariable Long videoId) {
        return ResponseEntity.ok(ApiResponse.success(fillBlankService.getUserFillBlank(videoId), "Lay bai Fill Blank thanh cong"));
    }

    @PostMapping("/video/{videoId}/submit")
    public ResponseEntity<ApiResponse<FillBlankSubmitResultResponse>> submit(
            @PathVariable Long videoId,
            @Valid @RequestBody SubmitFillBlankRequest request,
            HttpServletRequest httpRequest) {
        rateLimitService.check("fill-blank:submit:" + clientKey(httpRequest) + ":" + videoId, 1, Duration.ofSeconds(3));
        return ResponseEntity.ok(ApiResponse.success(fillBlankService.submit(videoId, request), "Nop bai Fill Blank thanh cong"));
    }

    @GetMapping("/video/{videoId}/attempts")
    public ResponseEntity<ApiResponse<List<UserFillBlankAttemptResponse>>> getAttempts(@PathVariable Long videoId) {
        return ResponseEntity.ok(ApiResponse.success(fillBlankService.getUserAttempts(videoId), "Lay lich su Fill Blank thanh cong"));
    }

    @GetMapping("/admin/video/{videoId}/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<FillBlankItemAdminResponse>>> getAdminItems(@PathVariable Long videoId) {
        return ResponseEntity.ok(ApiResponse.success(fillBlankService.getAdminItems(videoId), "Lay danh sach blank item thanh cong"));
    }

    @PostMapping("/admin/video/{videoId}/items")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FillBlankItemAdminResponse>> createItem(
            @PathVariable Long videoId,
            @Valid @RequestBody CreateFillBlankItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(fillBlankService.createItem(videoId, request), "Tao blank item thanh cong"));
    }

    @PutMapping("/admin/items/{itemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<FillBlankItemAdminResponse>> updateItem(
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateFillBlankItemRequest request) {
        return ResponseEntity.ok(ApiResponse.success(fillBlankService.updateItem(itemId, request), "Cap nhat blank item thanh cong"));
    }

    @DeleteMapping("/admin/items/{itemId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long itemId) {
        fillBlankService.deleteItem(itemId);
        return ResponseEntity.ok(ApiResponse.success("Xoa blank item thanh cong"));
    }

    private String clientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
