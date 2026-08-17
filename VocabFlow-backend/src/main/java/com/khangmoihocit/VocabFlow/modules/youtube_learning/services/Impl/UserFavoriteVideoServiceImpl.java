package com.khangmoihocit.VocabFlow.modules.youtube_learning.services.Impl;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.FavoriteVideoResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.UserFavoriteVideo;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoLesson;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.VideoSegment;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.keys.UserFavoriteVideoKey;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.UserFavoriteVideoRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoLessonRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.VideoSegmentRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.services.UserFavoriteVideoService;
import com.khangmoihocit.VocabFlow.core.services.AnkiConnectService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j(topic = "USER FAVORITE VIDEO SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserFavoriteVideoServiceImpl implements UserFavoriteVideoService {

    UserFavoriteVideoRepository userFavoriteVideoRepository;
    VideoLessonRepository videoLessonRepository;
    VideoSegmentRepository videoSegmentRepository;
    UserRepository userRepository;
    AnkiConnectService ankiConnectService;
    PageMapper pageMapper;

    @Override
    @Transactional
    public boolean toggleFavorite(Long videoId) {
        UUID userId = UserDetailUtil.get().getId();

        Optional<UserFavoriteVideo> existing =
                userFavoriteVideoRepository.findByIdUserIdAndIdVideoId(userId, videoId);

        if (existing.isPresent()) {
            // Đã yêu thích -> Bỏ yêu thích
            userFavoriteVideoRepository.delete(existing.get());
            log.info("User {} removed video {} from favorites", userId, videoId);
            return false;
        }

        // Kiểm tra video tồn tại
        VideoLesson videoLesson = videoLessonRepository.findById(videoId)
                .orElseThrow(() -> new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND));

        User user = userRepository.getReferenceById(userId);

        UserFavoriteVideoKey key = UserFavoriteVideoKey.builder()
                .userId(userId)
                .videoId(videoId)
                .build();

        UserFavoriteVideo favorite = UserFavoriteVideo.builder()
                .id(key)
                .user(user)
                .videoLesson(videoLesson)
                .build();

        userFavoriteVideoRepository.save(favorite);
        log.info("User {} added video {} to favorites", userId, videoId);
        return true;
    }

    @Override
    public boolean isFavorited(Long videoId) {
        UUID userId = UserDetailUtil.get().getId();
        return userFavoriteVideoRepository.existsByIdUserIdAndIdVideoId(userId, videoId);
    }

    @Override
    public PageResponse<FavoriteVideoResponse> getFavoriteVideos(int pageNo, int pageSize) {
        UUID userId = UserDetailUtil.get().getId();

        // Pageable không cần sort vì query đã ORDER BY createdAt DESC
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);

        Page<UserFavoriteVideo> favoritePage =
                userFavoriteVideoRepository.findFavoritesByUserId(userId, pageable);

        List<FavoriteVideoResponse> data = favoritePage.getContent().stream()
                .map(this::toFavoriteVideoResponse)
                .toList();

        return pageMapper.toPageResponse(favoritePage, data);
    }

    /**
     * Map entity -> DTO với channel info được flatten ra
     */
    private FavoriteVideoResponse toFavoriteVideoResponse(UserFavoriteVideo favorite) {
        VideoLesson video = favorite.getVideoLesson();
        YoutubeChannel channel = video.getChannel();

        return FavoriteVideoResponse.builder()
                .videoId(video.getId())
                .youtubeVideoId(video.getYoutubeVideoId())
                .title(video.getTitle())
                .thumbnailUrl(video.getThumbnailUrl())
                .duration(video.getDuration())
                .difficultyLevel(video.getDifficultyLevel())
                .channelName(channel != null ? channel.getName() : null)
                .channelAvatarUrl(channel != null ? channel.getAvatarUrl() : null)
                .favoritedAt(favorite.getCreatedAt())
                .build();
    }

    @Override
    public int syncVideoToAnki(Long videoId) {
        UUID userId = UserDetailUtil.get().getId();

        // Kiểm tra xem video này có trong danh sách yêu thích của người dùng không
        if (!userFavoriteVideoRepository.existsByIdUserIdAndIdVideoId(userId, videoId)) {
            throw new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        VideoLesson videoLesson = videoLessonRepository.findById(videoId)
                .orElseThrow(() -> new AppException(ErrorCode.VIDEO_LESSON_NOT_FOUND));

        List<VideoSegment> segments = videoSegmentRepository.findByVideoLessonId(videoId);
        if (segments.isEmpty()) {
            return 0;
        }

        String rootDeckName = (user.getAnkiVideoDeckName() != null && !user.getAnkiVideoDeckName().isEmpty())
                ? user.getAnkiVideoDeckName() : "English by VocabFlow Video";

        // Tên Deck: RootDeck::Tên Video (cắt ngắn 50 ký tự)
        String safeTitle = videoLesson.getTitle();
        if (safeTitle.length() > 50) {
            safeTitle = safeTitle.substring(0, 50) + "...";
        }
        safeTitle = safeTitle.replaceAll(":", "-"); // Tránh lỗi delimiter của Anki
        String fullDeckName = rootDeckName + "::" + safeTitle;

        ankiConnectService.createDeck(fullDeckName);

        int successCount = 0;
        for (VideoSegment segment : segments) {
            Long noteId = ankiConnectService.addSegmentNote(fullDeckName, segment, videoLesson.getYoutubeVideoId());
            if (noteId != null) {
                successCount++;
            }
        }

        return successCount;
    }
}
