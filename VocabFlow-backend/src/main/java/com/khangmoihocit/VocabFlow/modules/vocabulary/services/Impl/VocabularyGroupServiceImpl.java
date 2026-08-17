package com.khangmoihocit.VocabFlow.modules.vocabulary.services.Impl;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.specification.GenericSpecificationBuilder;
import com.khangmoihocit.VocabFlow.core.utils.SortUtil;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.VocabularyGroupRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyGroupNUnitResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyGroupResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.VocabularyUnitResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyGroup;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyUnit;
import com.khangmoihocit.VocabFlow.modules.vocabulary.mappers.VocabularyGroupMapper;
import com.khangmoihocit.VocabFlow.modules.vocabulary.mappers.VocabularyUnitMapper;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyGroupRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyUnitRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.VocabularyGroupService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;


@Slf4j(topic = "VOCABULARY GROUP SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabularyGroupServiceImpl implements VocabularyGroupService {
    VocabularyGroupRepository vocabularyGroupRepository;
    VocabularyUnitRepository vocabularyUnitRepository;
    VocabularyGroupMapper vocabularyGroupMapper;
    VocabularyUnitMapper vocabularyUnitMapper;

    @Override
    public List<VocabularyGroupNUnitResponse> findAll(String sort) {
        UUID userId = UserDetailUtil.get().getId();

        GenericSpecificationBuilder<VocabularyGroup> builder = new GenericSpecificationBuilder<>();
        builder.with("userId", "=", userId);
        Specification<VocabularyGroup> specification = builder.build();

        Sort groupSort = SortUtil.createSort(sort);
        List<VocabularyGroup> groups = vocabularyGroupRepository.findAll(specification, groupSort);
        if (groups.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> groupIds = groups.stream().map(VocabularyGroup::getId).toList();

        List<VocabularyUnit> units = vocabularyUnitRepository.findByVocabularyGroupIdIn(groupIds);

        //gom nhóm theo group id
        Map<Long, List<VocabularyUnit>> unitsByGroupId = units.stream()
                .collect(Collectors.groupingBy(unit -> unit.getVocabularyGroup().getId()));

        List<VocabularyGroupNUnitResponse> responseList = new ArrayList<>();
        for (VocabularyGroup group : groups) {
            VocabularyGroupResponse groupResponse = vocabularyGroupMapper.toVocabularyResponse(group);

            List<VocabularyUnit> unitForGroups = unitsByGroupId.get(group.getId());
            List<VocabularyUnitResponse> unitResponses = vocabularyUnitMapper
                    .toVocabularyUnitListResponse(unitForGroups);

            VocabularyGroupNUnitResponse vocabularyGroupNUnitResponse = VocabularyGroupNUnitResponse.builder()
                    .vocabularyGroupResponse(groupResponse)
                    .vocabularyUnitResponseList(unitResponses)
                    .build();
            responseList.add(vocabularyGroupNUnitResponse);
        }

        return responseList;
    }

    @Override
    public VocabularyGroupResponse create(VocabularyGroupRequest request) {
        UserDetailsCustom userDetails = (UserDetailsCustom) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        VocabularyGroup vocabularyGroup = VocabularyGroup.builder()
                .userId(userDetails.getId())
                .name(request.getName())
                .build();

        vocabularyGroup = vocabularyGroupRepository.save(vocabularyGroup);
        return vocabularyGroupMapper.toVocabularyResponse(vocabularyGroup);
    }

    @Override
    @Transactional
    public VocabularyGroupResponse update(VocabularyGroupRequest request, Long id) {
        UserDetailsCustom userDetails = (UserDetailsCustom) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        VocabularyGroup vocabularyGroup = vocabularyGroupRepository.findByIdAndUserId(id, userDetails.getId())
                .orElseThrow(()->new AppException(ErrorCode.VOCABULARY_GROUP_NOT_EXISTS));

        vocabularyGroup.setName(request.getName());

        vocabularyGroup = vocabularyGroupRepository.save(vocabularyGroup);
        return vocabularyGroupMapper.toVocabularyResponse(vocabularyGroup);
    }

    @Override
    public void deleteById(Long id) {
        UserDetailsCustom userDetails = (UserDetailsCustom) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        VocabularyGroup vocabularyGroup = vocabularyGroupRepository.findByIdAndUserId(id, userDetails.getId())
                .orElseThrow(()->new AppException(ErrorCode.VOCABULARY_GROUP_NOT_EXISTS));
        vocabularyGroupRepository.delete(vocabularyGroup);
    }
}
