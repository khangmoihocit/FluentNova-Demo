package com.khangmoihocit.VocabFlow.modules.youtube_learning.controllers;

import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.YoutubeChannelRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.YoutubeChannelResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.services.YoutubeChannelService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.function.EntityResponse;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RestController
@RequestMapping("${spring.api.prefix}/youtube-channels")
public class YoutubeChannelController {
    YoutubeChannelService youtubeChannelService;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    ResponseEntity<?> create(@Valid @RequestBody YoutubeChannelRequest request){
        YoutubeChannelResponse youtubeChannelResponse = youtubeChannelService.createChannel(request);
        ApiResponse<YoutubeChannelResponse> response = ApiResponse.success(youtubeChannelResponse, "create channel success");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    ResponseEntity<?> update(@Valid @RequestBody YoutubeChannelRequest request, @PathVariable Long id){
        YoutubeChannelResponse youtubeChannelResponse = youtubeChannelService.updateChannel(id, request);
        ApiResponse<YoutubeChannelResponse> response = ApiResponse.success(youtubeChannelResponse, "update channel success");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    ResponseEntity<?> getById(@PathVariable Long id){
        YoutubeChannelResponse youtubeChannelResponse = youtubeChannelService.getChannelById(id);
        ApiResponse<YoutubeChannelResponse> response = ApiResponse.success(youtubeChannelResponse, "get channel success");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/find-all")
    ResponseEntity<?> findAll(@RequestParam(name = "pageNo", defaultValue = "1") int pageNo,
                              @RequestParam(name = "pageSize", defaultValue = "20") int pageSize,
                              @RequestParam(name = "sort", defaultValue = "id,asc") String sort,
                              @RequestParam(name = "keyword", defaultValue = "") String keyword){
        PageResponse<YoutubeChannelResponse> youtubeChannelResponse =
                youtubeChannelService.getAllChannels(pageNo, pageSize, sort, keyword);
        ApiResponse<PageResponse<YoutubeChannelResponse>> response = ApiResponse.success(youtubeChannelResponse, "get all channel success");
        return ResponseEntity.ok(response);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    ResponseEntity<?> deleteById(@PathVariable Long id){
        youtubeChannelService.deleteChannel(id);
        ApiResponse<?> response = ApiResponse.success("deleted channel success");
        return ResponseEntity.ok(response);
    }
}
