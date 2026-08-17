package com.khangmoihocit.VocabFlow.modules.youtube_learning.services.Impl;

import ch.qos.logback.core.util.StringUtil;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.specification.GenericSpecificationBuilder;
import com.khangmoihocit.VocabFlow.core.utils.SortUtil;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.request.YoutubeChannelRequest;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.dtos.response.YoutubeChannelResponse;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.entities.YoutubeChannel;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.mappers.YoutubeChannelMapper;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.repositories.YoutubeChannelRepository;
import com.khangmoihocit.VocabFlow.modules.youtube_learning.services.YoutubeChannelService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;


@Slf4j(topic = "Youtube Channel SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class YoutubeChannelServiceImpl implements YoutubeChannelService {
    YoutubeChannelMapper youtubeChannelMapper;
    PageMapper pageMapper;
    YoutubeChannelRepository youtubeChannelRepository;

    @Override
    public YoutubeChannelResponse createChannel(YoutubeChannelRequest request) {
        YoutubeChannel youtubeChannel = youtubeChannelMapper.toEntity(request);

        youtubeChannel = youtubeChannelRepository.save(youtubeChannel);
        return youtubeChannelMapper.toResponse(youtubeChannel);
    }

    @Override
    public PageResponse<YoutubeChannelResponse> getAllChannels(int pageNo, int pageSize, String sort, String keyword) {
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize, SortUtil.createSort(sort));
        GenericSpecificationBuilder<YoutubeChannel> builder = new GenericSpecificationBuilder<>();

        if(StringUtils.hasText(keyword)) builder.with("name", ":", keyword);

        Specification<YoutubeChannel> specification = builder.build();
        Page<YoutubeChannel> youtubeChannelPage = youtubeChannelRepository.findAll(specification, pageable);

        return pageMapper.toPageResponse(youtubeChannelPage,
                youtubeChannelMapper.toListResponse(youtubeChannelPage.getContent()));
    }

    @Override
    public YoutubeChannelResponse getChannelById(Long id) {
        YoutubeChannel youtubeChannel = youtubeChannelRepository.findById(id)
                .orElseThrow(()->new AppException(ErrorCode.CHANNEL_NOT_FOUND));
        return youtubeChannelMapper.toResponse(youtubeChannel);
    }

    @Override
    public YoutubeChannelResponse updateChannel(Long id, YoutubeChannelRequest request) {
        YoutubeChannel youtubeChannel = youtubeChannelRepository.findById(id)
                .orElseThrow(()->new AppException(ErrorCode.CHANNEL_NOT_FOUND));

        youtubeChannel.setName(request.getName());
        youtubeChannel.setDescription(request.getDescription());
        youtubeChannel.setAvatarUrl(request.getAvatarUrl());
        youtubeChannel = youtubeChannelRepository.save(youtubeChannel);
        return youtubeChannelMapper.toResponse(youtubeChannel);
    }

    @Override
    public void deleteChannel(Long id) {
        YoutubeChannel youtubeChannel = youtubeChannelRepository.findById(id)
                .orElseThrow(()->new AppException(ErrorCode.CHANNEL_NOT_FOUND));

        youtubeChannelRepository.delete(youtubeChannel);
    }
}
