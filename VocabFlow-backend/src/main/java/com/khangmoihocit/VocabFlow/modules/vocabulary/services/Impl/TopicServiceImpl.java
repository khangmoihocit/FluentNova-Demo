package com.khangmoihocit.VocabFlow.modules.vocabulary.services.Impl;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.specification.GenericSpecificationBuilder;
import com.khangmoihocit.VocabFlow.core.utils.SortUtil;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.TopicResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.Topic;
import com.khangmoihocit.VocabFlow.modules.vocabulary.mappers.TopicMapper;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.TopicRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.TopicService;
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

import java.util.List;


@Slf4j(topic = "TOPIC SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TopicServiceImpl implements TopicService {
    PageMapper pageMapper;
    TopicMapper topicMapper;
    TopicRepository topicRepository;

    @Override
    public PageResponse<TopicResponse> findAll(int pageNo, int pageSize, String sort, String keyword) {
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize, SortUtil.createSort(sort));
        GenericSpecificationBuilder<Topic> builder = new GenericSpecificationBuilder<>();
        if(StringUtils.hasText(keyword)) builder.with("name", "=", keyword);
        Specification<Topic> specification = builder.build();

        Page<Topic> topicPage = topicRepository.findAll(specification, pageable);
        List<TopicResponse> topicResponses = topicMapper.toTopicResponse(topicPage.getContent());

        return pageMapper.toPageResponse(topicPage, topicResponses);
    }
}
