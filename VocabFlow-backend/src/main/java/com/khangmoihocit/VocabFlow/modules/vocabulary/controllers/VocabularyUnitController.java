package com.khangmoihocit.VocabFlow.modules.vocabulary.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.VocabularyUnitRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyUnitResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.VocabularyUnitService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j(topic = "UNIT CONTROLLER")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/vocabulary-units")
public class VocabularyUnitController {
    VocabularyUnitService vocabularyUnitService;

    @PostMapping
    ResponseEntity<?> create(@Valid @RequestBody VocabularyUnitRequest request){
        VocabularyUnitResponse vocabularyUnitResponse = vocabularyUnitService.create(request);
        ApiResponse<VocabularyUnitResponse> response =
                ApiResponse.success(vocabularyUnitResponse, "tạo bộ từ vựng thành công!");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    ResponseEntity<?> update(@Valid @RequestBody VocabularyUnitRequest request, @PathVariable Long id){
        VocabularyUnitResponse vocabularyUnitResponse = vocabularyUnitService.update(request, id);
        ApiResponse<VocabularyUnitResponse> response =
                ApiResponse.success(vocabularyUnitResponse, "update bộ từ vựng thành công!");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    ResponseEntity<?> delete(@PathVariable Long id){
        vocabularyUnitService.deleteById(id);
        ApiResponse<VocabularyUnitResponse> response =
                ApiResponse.success("xóa bộ từ vựng thành công!");
        return ResponseEntity.ok(response);
    }
}
