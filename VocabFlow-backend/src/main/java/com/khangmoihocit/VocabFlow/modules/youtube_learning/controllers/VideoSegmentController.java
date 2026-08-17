package com.khangmoihocit.VocabFlow.modules.youtube_learning.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.VideoSegmentToolRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoDetailResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.services.VideoSegmentService;
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
@RequestMapping("${spring.api.prefix}/video-segments")
public class VideoSegmentController {
    VideoSegmentService videoSegmentService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/{videoId}/import")
    ResponseEntity<?> importFromTool(@PathVariable Long videoId,
                                     @Valid @RequestBody List<VideoSegmentToolRequest> toolRequests){
        videoSegmentService.insertSegment(videoId, toolRequests);
        return ResponseEntity.ok(
                ApiResponse.success("import thành công các segment của video " + videoId + " !"));
    }

    @GetMapping("/{videoId}/study-detail")
    ResponseEntity<?> get(@PathVariable Long videoId){
        VideoDetailResponse videoDetailResponse = videoSegmentService.getById(videoId);
        ApiResponse<VideoDetailResponse> response = ApiResponse.success(videoDetailResponse, "Tải bài học video thành công!");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{videoId}/update")
    ResponseEntity<?> updateSegment(@PathVariable Long videoId,
                                    @Valid @RequestBody List<VideoSegmentToolRequest> toolRequests){
        videoSegmentService.updateSegment(videoId, toolRequests);
        return ResponseEntity.ok(
                ApiResponse.success("cập nhật thành công các segment của video " + videoId + " !"));
    }
}
