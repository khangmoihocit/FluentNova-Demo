package com.khangmoihocit.VocabFlow.modules.youtube_learning.services.Impl;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.specification.GenericSpecificationBuilder;
import com.khangmoihocit.VocabFlow.core.utils.SortUtil;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.category.entities.Category;
import com.khangmoihocit.VocabFlow.modules.category.mappers.CategoryMapper;
import com.khangmoihocit.VocabFlow.modules.category.repositories.CategoryRepository;
import com.khangmoihocit.VocabFlow.modules.progress.projections.UserVideoProgressProjection;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserVideoProgressRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.VideoLessonRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.UserProgressResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonFilterResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.mappers.VideoLessonMapper;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoLessonRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.YoutubeChannelRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.services.VideoLessonService;
import jakarta.persistence.EntityNotFoundException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.stream.Collectors;

import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.UserFavoriteVideoRepository;

@Slf4j(topic = "Video Lesson SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VideoLessonServiceImpl implements VideoLessonService {

    VideoLessonMapper videoLessonMapper;
    PageMapper pageMapper;
    VideoLessonRepository videoLessonRepository;
    YoutubeChannelRepository youtubeChannelRepository;
    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;
    UserVideoProgressRepository userVideoProgressRepository;
    UserFavoriteVideoRepository userFavoriteVideoRepository;

    @Override
    public VideoLessonResponse createVideoLesson(VideoLessonRequest request) {
        YoutubeChannel channel = youtubeChannelRepository.findById(request.getYoutubeChannelId())
                .orElseThrow(() -> new AppException(ErrorCode.CHANNEL_NOT_FOUND));

        if (request.getCategoryIds().isEmpty()) throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        List<Category> validCategories = categoryRepository.findByIdIn(request.getCategoryIds());

        if (validCategories.size() != request.getCategoryIds().size()) {
            throw new AppException(ErrorCode.SOME_CATEGORIES_NOT_FOUND);
        }

        VideoLesson videoLesson = videoLessonMapper.toEntity(request);
        videoLesson.setChannel(channel);
        videoLesson.setCategories(new HashSet<>(categoryRepository.findByIdIn(request.getCategoryIds())));
        videoLesson = videoLessonRepository.save(videoLesson);
        VideoLessonResponse videoLessonResponse = videoLessonMapper.toResponse(videoLesson);
        videoLessonResponse.setCategories(categoryMapper.toListResponse(videoLesson.getCategories().stream().toList()));

        return videoLessonResponse;
    }

    @Override
    public PageResponse<VideoLessonFilterResponse> getAllVideoLessons(int pageNo, int pageSize, String sort,
                                                                      Long channelId, String keyword,
                                                                      List<Long> categoryIds, String difficultyLevel) {
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize, SortUtil.createSort(sort));
        GenericSpecificationBuilder<VideoLesson> builder = new GenericSpecificationBuilder<>();
        if (channelId != null) {
            builder.withJoinById("channel", channelId);
        }
        builder.with("isPublished", "=", true);
        if (StringUtils.hasText(keyword)) {
            builder.with("title", ":", keyword);
        }

        // Lọc theo nhiều category
        if (categoryIds != null && !categoryIds.isEmpty()) {
            builder.withManyToManyJoinIn("categories", "id", categoryIds);
        }

        if (StringUtils.hasText(difficultyLevel)) {
            builder.with("difficultyLevel", "=", difficultyLevel);
        }

        Specification<VideoLesson> specification = builder.build();
        Page<VideoLesson> videoLessonPage = videoLessonRepository.findAll(specification, pageable);
        if (videoLessonPage.isEmpty()) {
            return pageMapper.toPageResponse(videoLessonPage, Collections.emptyList());
        }

        Optional<UUID> userIdOpt = UserDetailUtil.getCurrentUserIdOptional();
        Map<Long, UserVideoProgressProjection> progressMap;
        Set<Long> favoriteVideoIds = new HashSet<>();

        if (userIdOpt.isPresent()) {
            List<Long> videoIds = videoLessonPage.getContent().stream()
                    .map(VideoLesson::getId)
                    .toList();

            List<UserVideoProgressProjection> progressList = userVideoProgressRepository
                    .findByUserIdAndVideoLessonIdIn(userIdOpt.get(), videoIds);

            //  list -> Map để tra cứu siêu nhanh (Key = videoId)
            progressMap = progressList.stream()
                    .collect(Collectors.toMap(UserVideoProgressProjection::getVideoId, p -> p));

            List<Long> favList = userFavoriteVideoRepository.findFavoriteVideoIds(userIdOpt.get(), videoIds);
            favoriteVideoIds.addAll(favList);
        } else {
            progressMap = new HashMap<>();
        }

        List<VideoLessonFilterResponse> videoLessonResponses = videoLessonPage.getContent().stream()
                .map(videoLesson -> {
                    VideoLessonFilterResponse response = videoLessonMapper.toFilterResponse(videoLesson);
                    response.setIsFavorited(favoriteVideoIds.contains(videoLesson.getId()));

                    if (userIdOpt.isPresent()) {
                        UserVideoProgressProjection progress = progressMap.get(videoLesson.getId());

                        if (progress != null) {
                            response.setUserProgressResponse(
                                    UserProgressResponse.builder()
                                            .id(progress.getId())
                                            .userId(progress.getUserId())
                                            .videoId(progress.getVideoId())
                                            .avgDictationScore(progress.getAvgDictationScore())
                                            .avgShadowingScore(progress.getAvgShadowingScore())
                                            .isDictationCompleted(progress.getIsDictationCompleted())
                                            .isShadowingCompleted(progress.getIsShadowingCompleted())
                                            .status(progress.getStatus())
                                            .build()
                            );
                        }
                    }
                    return response;
                })
                .toList();
        return pageMapper.toPageResponse(videoLessonPage, videoLessonResponses);
    }

    @Override
    public PageResponse<VideoLessonResponse> getAllVideoLessonsAdmin(int pageNo, int pageSize, String sort,
                                                                     Long channelId, String keyword,
                                                                     List<Long> categoryIds, String difficultyLevel
    ,Boolean isPublished) {
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize, SortUtil.createSort(sort));

        GenericSpecificationBuilder<VideoLesson> builder = new GenericSpecificationBuilder<>();

        // Lọc theo channel (tùy chọn)
        if (channelId != null) {
            builder.withJoinById("channel", channelId);
        }

        // Lọc theo keyword (tìm theo title)
        if (StringUtils.hasText(keyword)) {
            builder.with("title", ":", keyword);
        }

        // Lọc theo nhiều category
        if (categoryIds != null && !categoryIds.isEmpty()) {
            builder.withManyToManyJoinIn("categories", "id", categoryIds);
        }

        // Lọc theo difficulty level (A1, A2, B1, B2, C1, C2)
        if (StringUtils.hasText(difficultyLevel)) {
            builder.with("difficultyLevel", "=", difficultyLevel);
        }

        if(isPublished != null){
            builder.with("isPublished", "=", isPublished);
        }

        Specification<VideoLesson> specification = builder.build();
        Page<VideoLesson> videoLessonPage = videoLessonRepository.findAll(specification, pageable);

        List<VideoLessonResponse> videoLessonResponses = new ArrayList<>();
        videoLessonPage.getContent().forEach(videoLesson -> {
            VideoLessonResponse videoLessonResponse = videoLessonMapper.toResponse(videoLesson);
            videoLessonResponse.setCategories(categoryMapper
                    .toListResponse(new ArrayList<>(videoLesson.getCategories())));

            videoLessonResponses.add(videoLessonResponse);
        });
        return pageMapper.toPageResponse(videoLessonPage, videoLessonResponses);
    }

    @Override
    public VideoLessonResponse getVideoLessonById(Long id) {
        VideoLesson videoLesson = videoLessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND));
        return videoLessonMapper.toResponse(videoLesson);
    }

    @Override
    @Transactional
    public VideoLessonResponse updateVideoLesson(Long id, VideoLessonRequest request) {
        VideoLesson videoLesson = videoLessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND));

        Long requestChannelId = request.getYoutubeChannelId();
        if (requestChannelId != null && !requestChannelId.equals(videoLesson.getChannel().getId())) {
            try {
                YoutubeChannel proxyChannel = youtubeChannelRepository.getReferenceById(requestChannelId);
                videoLesson.setChannel(proxyChannel);
            } catch (EntityNotFoundException e) {
                throw new AppException(ErrorCode.CHANNEL_NOT_FOUND);
            }
        }

        List<Long> requestCategoryIds = request.getCategoryIds();
        if (requestCategoryIds == null || requestCategoryIds.isEmpty()) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }

        // Lấy danh sách ID category hiện tại của video
        Set<Long> currentCategoryIds = videoLesson.getCategories().stream()
                .map(Category::getId)
                .collect(Collectors.toSet());

        Set<Long> newCategoryIds = new HashSet<>(requestCategoryIds);

        if (!currentCategoryIds.equals(newCategoryIds)) {
            List<Category> validCategories = categoryRepository.findByIdIn(requestCategoryIds);

            if (validCategories.size() != requestCategoryIds.size()) {
                throw new AppException(ErrorCode.SOME_CATEGORIES_NOT_FOUND);
            }

            //tối ưu: Không dùng 'new HashSet'. Clear và AddAll để Hibernate Tracking chuẩn xác
            videoLesson.getCategories().clear();
            videoLesson.getCategories().addAll(validCategories);
        }

        videoLesson.setTitle(request.getTitle());
        videoLesson.setYoutubeVideoId(request.getYoutubeVideoId());
        videoLesson.setThumbnailUrl(request.getThumbnailUrl());
        videoLesson.setDifficultyLevel(request.getDifficultyLevel());
        videoLesson.setIsPublished(request.getIsPublished());
        videoLesson.setDuration(request.getDuration());
        videoLesson.setViews(request.getViews());

        // tối ưu: Không cần gọi save()
        // Do có @Transactional, khi kết thúc hàm, Hibernate sẽ tự so sánh (Dirty Checking)
        // Nếu entity có thay đổi, nó sẽ tự sinh ra câu lệnh UPDATE.

        VideoLessonResponse response = videoLessonMapper.toResponse(videoLesson);
        response.setCategories(categoryMapper.toListResponse(new ArrayList<>(videoLesson.getCategories())));

        return response;
    }

    @Override
    public void deleteVideoLesson(Long id) {
        VideoLesson videoLesson = videoLessonRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND));

        videoLessonRepository.delete(videoLesson);
    }
}