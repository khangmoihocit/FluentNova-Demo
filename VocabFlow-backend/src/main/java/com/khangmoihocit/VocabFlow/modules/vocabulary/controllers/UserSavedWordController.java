package com.khangmoihocit.VocabFlow.modules.vocabulary.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.UserSaveWordRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.UserSavedWordResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.WordSavedFindResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.UserSavedWordService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j(topic = "USER SAVED WORD CONTROLLER")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/user-saved-words")
public class UserSavedWordController {
    UserSavedWordService userSavedWordService;

    @PostMapping
    ResponseEntity<?> savedWordToUser(@Valid @RequestBody UserSaveWordRequest request){
        ApiResponse<UserSavedWordResponse> response =
                ApiResponse.success(userSavedWordService.savedWord(request), "Lưu từ vựng vào sổ tay của bạn thành công!");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/find-all/{vocabularyUnitId}")
    ResponseEntity<?> findWordSaveUser(@RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
                                       @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
                                       @RequestParam(name = "sort", defaultValue = "id,asc") String sort,
                                       @RequestParam(name = "keyword", defaultValue = "") String keyword,
                                       @PathVariable Long vocabularyUnitId){
        PageResponse<WordSavedFindResponse> result = userSavedWordService.findSaveWordByUser(pageNo, pageSize, sort, keyword, vocabularyUnitId);
        ApiResponse<PageResponse<WordSavedFindResponse>> response = ApiResponse.success(result, "tải danh sách từ trong database thành công!");

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<?> deleteById(@PathVariable Long id){
        userSavedWordService.deleteBySavedWordId(id);
        ApiResponse<?> response = ApiResponse.success("Xóa từ vựng khỏi sổ tay của bạn thành công!");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync-anki")
    public ResponseEntity<?> syncVocabularyToAnki() {
        // Kiểm tra kết nối nhanh tới AnkiConnect (Port 8765) để báo lỗi sớm nếu chưa mở Anki
        try (java.net.Socket socket = new java.net.Socket()) {
            socket.connect(new java.net.InetSocketAddress("127.0.0.1", 8765), 2000);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Lỗi: Anki chưa được mở hoặc AnkiConnect chưa cấu hình đúng port 8765!")
            );
        }

        try {
            int syncedCount = userSavedWordService.syncWithAnki();

            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("syncedWords", syncedCount),
                    "Đồng bộ thành công " + syncedCount + " từ vựng sang Anki!"
            ));
        } catch (Exception e) {
            log.error("Sync Anki failed", e);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Lỗi đồng bộ Anki: " + e.getMessage())
            );
        }
    }

    @PostMapping("/resync-anki/{vocabularyUnitId}")
    public ResponseEntity<?> resyncVocabularyToAnki(@PathVariable Long vocabularyUnitId) {
        try (java.net.Socket socket = new java.net.Socket()) {
            socket.connect(new java.net.InetSocketAddress("127.0.0.1", 8765), 2000);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Lỗi: Anki chưa được mở hoặc AnkiConnect chưa cấu hình đúng port 8765!")
            );
        }

        try {
            int syncedCount = userSavedWordService.resyncWithAnki(vocabularyUnitId);

            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("syncedWords", syncedCount),
                    "Đồng bộ thành công " + syncedCount + " từ vựng sang Anki!"
            ));
        } catch (Exception e) {
            log.error("Sync Anki failed", e);
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Lỗi đồng bộ Anki: " + e.getMessage())
            );
        }
    }
}
