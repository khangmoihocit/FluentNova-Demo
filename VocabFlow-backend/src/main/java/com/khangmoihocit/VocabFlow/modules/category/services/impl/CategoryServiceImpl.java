package com.khangmoihocit.VocabFlow.modules.category.services.impl;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.category.dtos.request.CategoryRequest;
import com.khangmoihocit.VocabFlow.modules.category.dtos.response.CategoryResponse;
import com.khangmoihocit.VocabFlow.modules.category.dtos.response.HomeCategoryResponse;
import com.khangmoihocit.VocabFlow.modules.category.entities.Category;
import com.khangmoihocit.VocabFlow.modules.category.mappers.CategoryMapper;
import com.khangmoihocit.VocabFlow.modules.category.projections.HomeCategoryVideoProjection;
import com.khangmoihocit.VocabFlow.modules.category.repositories.CategoryRepository;
import com.khangmoihocit.VocabFlow.modules.category.services.CategoryService;
import com.khangmoihocit.VocabFlow.modules.progress.projections.UserVideoProgressProjection;
import com.khangmoihocit.VocabFlow.modules.progress.repositories.UserVideoProgressRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.UserProgressResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.VideoLessonFilterResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.mappers.VideoLessonMapper;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoLessonRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.UserFavoriteVideoRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryServiceImpl implements CategoryService {

    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;
    PageMapper pageMapper;
    VideoLessonRepository videoLessonRepository;
    VideoLessonMapper videoLessonMapper;
    UserVideoProgressRepository userVideoProgressRepository;
    UserFavoriteVideoRepository userFavoriteVideoRepository;

    @Override
    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new OurException("Tên danh mục đã tồn tại");
        }
        Category category = categoryMapper.toEntity(request);
        category = categoryRepository.save(category);
        return categoryMapper.toResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new OurException("Không tìm thấy danh mục"));
        
        if (!category.getName().equals(request.getName()) && categoryRepository.existsByName(request.getName())) {
            throw new OurException("Tên danh mục đã tồn tại");
        }

        categoryMapper.updateEntityFromRequest(request, category);
        return categoryMapper.toResponse(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new OurException("Không tìm thấy danh mục"));
        categoryRepository.delete(category);
    }

    @Override
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new OurException("Không tìm thấy danh mục"));
        return categoryMapper.toResponse(category);
    }

    @Override
    public PageResponse<CategoryResponse> getAllCategories(int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);
        Page<Category> categories = categoryRepository.findAll(pageable);

        return pageMapper.toPageResponse(categories, categoryMapper.toListResponse(categories.getContent()));
    }

    @Override
    public List<HomeCategoryResponse> getAllCategoryHome() {
        List<HomeCategoryVideoProjection> projections = categoryRepository.getTop5VideosPerCategory();
        if (projections.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, List<HomeCategoryVideoProjection>> groupedByCategory = projections.stream()
                .collect(Collectors.groupingBy(HomeCategoryVideoProjection::getCategoryId));

        Optional<UUID> userIdOpt = UserDetailUtil.getCurrentUserIdOptional();
        Map<Long, UserVideoProgressProjection> progressMap;
        Set<Long> favoriteVideoIds = new HashSet<>();

        if (userIdOpt.isPresent()) {
            List<Long> allVideoIds = projections.stream()
                    .map(HomeCategoryVideoProjection::getVideoId)
                    .distinct()
                    .toList();

            List<UserVideoProgressProjection> progressList = userVideoProgressRepository
                    .findByUserIdAndVideoLessonIdIn(userIdOpt.get(), allVideoIds);

            progressMap = progressList.stream()
                    .collect(Collectors.toMap(UserVideoProgressProjection::getVideoId, p -> p));

            List<Long> favList = userFavoriteVideoRepository.findFavoriteVideoIds(userIdOpt.get(), allVideoIds);
            favoriteVideoIds.addAll(favList);
        } else {
            progressMap = new HashMap<>();
        }

        return groupedByCategory.entrySet().stream()
                .map(entry -> {
                    HomeCategoryVideoProjection first = entry.getValue().get(0);

                    List<VideoLessonFilterResponse> videoDTOs = entry.getValue().stream()
                            .map(p -> {
                                VideoLessonFilterResponse videoLessonFilterResponse = VideoLessonFilterResponse.builder()
                                        .id(p.getVideoId())
                                        .youtubeVideoId(p.getYoutubeVideoId())
                                        .title(p.getVideoTitle())
                                        .thumbnailUrl(p.getThumbnailUrl())
                                        .duration(p.getDuration())
                                        .difficultyLevel(p.getDifficultyLevel())
                                        .createdAt(p.getCreatedAt())
                                        .isFavorited(favoriteVideoIds.contains(p.getVideoId()))
                                        .build();

                                if (userIdOpt.isPresent()) {
                                    UserVideoProgressProjection videoProgress = progressMap.get(p.getVideoId());

                                    if (videoProgress != null) {
                                        videoLessonFilterResponse.setUserProgressResponse(
                                                UserProgressResponse.builder()
                                                        .id(videoProgress.getId())
                                                        .userId(videoProgress.getUserId())
                                                        .videoId(videoProgress.getVideoId())
                                                        .avgDictationScore(videoProgress.getAvgDictationScore())
                                                        .avgShadowingScore(videoProgress.getAvgShadowingScore())
                                                        .isDictationCompleted(videoProgress.getIsDictationCompleted())
                                                        .isShadowingCompleted(videoProgress.getIsShadowingCompleted())
                                                        .status(videoProgress.getStatus())
                                                        .build());
                                    }
                                }
                                return videoLessonFilterResponse;
                            }).toList();

                    return HomeCategoryResponse.builder()
                            .categoryId(first.getCategoryId())
                            .categoryName(first.getCategoryName())
                            .videoLessonFilterResponses(videoDTOs)
                            .build();
                })
                .collect(Collectors.toList());
    }


}
