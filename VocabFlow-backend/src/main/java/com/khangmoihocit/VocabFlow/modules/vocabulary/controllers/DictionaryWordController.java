package com.khangmoihocit.VocabFlow.modules.vocabulary.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.LookupRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.TranslateRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.UserSaveWordRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.*;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.DictionaryWordService;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.UserSavedWordService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j(topic = "VOCABULARY CONTROLLER")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/vocabularies")
public class DictionaryWordController {
    DictionaryWordService dictionaryWordService;

    @GetMapping("/lookup/basic")
    ResponseEntity<ApiResponse<LookupResponse>> lookupBasic(@RequestParam String word) {
        log.info("tra cứu basic: " + word);
        LookupResponse response = dictionaryWordService.lookupBasic(word);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu cơ bản thành công"));
    }

    @PostMapping("/lookup/ai")
    ResponseEntity<ApiResponse<LookupResponse>> lookupWithAi(@Valid @RequestBody LookupRequest request) {
        log.info("tra cứu bằng AI: " + request.getWord());
        LookupResponse response = dictionaryWordService.lookupWithAi(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Tra cứu bằng AI thành công"));
    }

    @PostMapping("/translate")
    ResponseEntity<?> translateSentence(@Valid @RequestBody TranslateRequest request) {
        TranslateResponse data = dictionaryWordService.translateText(request.getText());

        ApiResponse<TranslateResponse> response = ApiResponse.success(data, "Dịch đoạn văn thành công");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/find-all")
    ResponseEntity<?> findAllDictionWord(@RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
                                         @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
                                         @RequestParam(name = "sort", defaultValue = "word,asc") String sort,
                                         @RequestParam(name = "keyword", defaultValue = "") String keyword){
        PageResponse<DictionaryWordResponse> result = dictionaryWordService.findAll(pageNo, pageSize, sort, keyword);
        ApiResponse<PageResponse<DictionaryWordResponse>> response = ApiResponse.success(result, "tải danh sách từ trong database thành công!");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/lookup")
    ResponseEntity<?> lookup(@RequestParam String word){
        List<LookupWordResponse> lookupWordResponse = dictionaryWordService.lookupWord(word);
        ApiResponse<List<LookupWordResponse>> response = ApiResponse.success(lookupWordResponse, "Tra cứu thành công!");
        return ResponseEntity.ok(response);
    }

}
