package com.khangmoihocit.VocabFlow.modules.vocabulary.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.TopicResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.WordSavedFindResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.TopicService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j(topic = "TOPIC CONTROLLER")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/topics")
public class TopicController {
    TopicService topicService;

    @GetMapping("/find-all")
    ResponseEntity<?> findAll(@RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
                              @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
                              @RequestParam(name = "sort", defaultValue = "id,asc") String sort,
                              @RequestParam(name = "keyword", defaultValue = "") String keyword){
        PageResponse<TopicResponse> result = topicService.findAll(pageNo, pageSize, sort, keyword);
        ApiResponse<PageResponse<TopicResponse>> response = ApiResponse.success(result, "tải danh sách topic trong database thành công!");

        return ResponseEntity.ok(response);
    }
}
