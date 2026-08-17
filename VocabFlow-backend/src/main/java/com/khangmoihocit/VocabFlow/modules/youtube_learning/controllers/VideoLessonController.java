package com.khangmoihocit.VocabFlow.modules.youtube_learning.controllers;


import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.VideoLessonRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonFilterResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.services.VideoLessonService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/video-lessons")
public class VideoLessonController {

    VideoLessonService videoLessonService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    ResponseEntity<?> create(@Valid @RequestBody VideoLessonRequest request) {
        VideoLessonResponse videoLessonResponse = videoLessonService.createVideoLesson(request);
        ApiResponse<VideoLessonResponse> response = ApiResponse.success(videoLessonResponse, "create video lesson success");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    ResponseEntity<?> update(@Valid @RequestBody VideoLessonRequest request, @PathVariable Long id) {
        VideoLessonResponse videoLessonResponse = videoLessonService.updateVideoLesson(id, request);
        ApiResponse<VideoLessonResponse> response = ApiResponse.success(videoLessonResponse, "update video lesson success");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    ResponseEntity<?> getById(@PathVariable Long id) {
        VideoLessonResponse videoLessonResponse = videoLessonService.getVideoLessonById(id);
        ApiResponse<VideoLessonResponse> response = ApiResponse.success(videoLessonResponse, "get video lesson success");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/find-all")
    ResponseEntity<?> findAll(@RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
                              @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
                              @RequestParam(name = "sort", defaultValue = "id,asc") String sort,
                              @RequestParam(name = "keyword", defaultValue = "") String keyword,
                              @RequestParam(name = "channelId", required = false) Long channelId,
                              @RequestParam(name = "categoryIds", required = false) List<Long> categoryIds,
                              @RequestParam(name = "difficultyLevel", required = false) String difficultyLevel) {
        PageResponse<VideoLessonFilterResponse> videoLessonResponse =
                videoLessonService.getAllVideoLessons(pageNo, pageSize, sort, channelId, keyword, categoryIds, difficultyLevel);
        ApiResponse<PageResponse<VideoLessonFilterResponse>> response = ApiResponse.success(videoLessonResponse, "get all video lesson success");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/find-all/auth")
    ResponseEntity<?> findAllAdmin(@RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
                              @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
                              @RequestParam(name = "sort", defaultValue = "id,asc") String sort,
                              @RequestParam(name = "keyword", defaultValue = "") String keyword,
                              @RequestParam(name = "channelId", required = false) Long channelId,
                              @RequestParam(name = "categoryIds", required = false) List<Long> categoryIds,
                              @RequestParam(name = "difficultyLevel", required = false) String difficultyLevel,
                                   @RequestParam(name = "isPublished", required = false) Boolean isPublished) {
        PageResponse<VideoLessonResponse> videoLessonResponse =
                videoLessonService.getAllVideoLessonsAdmin(pageNo, pageSize, sort, channelId,
                        keyword, categoryIds, difficultyLevel, isPublished);
        ApiResponse<PageResponse<VideoLessonResponse>> response = ApiResponse.success(videoLessonResponse, "get all video lesson success");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    ResponseEntity<?> deleteById(@PathVariable Long id) {
        videoLessonService.deleteVideoLesson(id);
        ApiResponse<?> response = ApiResponse.success("deleted video lesson success");
        return ResponseEntity.ok(response);
    }
}