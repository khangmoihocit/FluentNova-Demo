package com.khangmoihocit.VocabFlow.modules.vocabulary.services.Impl;

import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.enums.AnkiStatus;
import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.security.UserDetailsCustom;
import com.khangmoihocit.VocabFlow.core.services.AnkiConnectService;
import com.khangmoihocit.VocabFlow.core.specification.GenericSpecificationBuilder;
import com.khangmoihocit.VocabFlow.core.utils.SortUtil;
import com.khangmoihocit.VocabFlow.core.utils.UserDetailUtil;
import com.khangmoihocit.VocabFlow.modules.user.entities.User;
import com.khangmoihocit.VocabFlow.modules.user.repositories.UserRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.UserSaveWordRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.LookupWordResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.UserSavedWordResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.WordSavedFindResponse;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.DictionaryWord;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.UserSavedWord;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.VocabularyUnit;
import com.khangmoihocit.VocabFlow.modules.vocabulary.mappers.UserSavedWordMapper;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.DictionaryWordRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.UserSavedWordRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyGroupRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.VocabularyUnitRepository;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.UserSavedWordService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j(topic = "USER SAVED WORD SERVICE")
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserSavedWordServiceImpl implements UserSavedWordService {
    UserSavedWordRepository userSavedWordRepository;
    UserRepository userRepository;
    DictionaryWordRepository dictionaryWordRepository;
    VocabularyGroupRepository vocabularyGroupRepository;
    VocabularyUnitRepository vocabularyUnitRepository;
    UserSavedWordMapper userSavedWordMapper;
    PageMapper pageMapper;
    AnkiConnectService ankiConnectService;

    @Override
    @Transactional //hiện là 6 câu truy vấn -> cần tối ưu lại
    public UserSavedWordResponse savedWord(UserSaveWordRequest request) {
        DictionaryWord dictionaryWord = dictionaryWordRepository.findById(request.getDictionaryWordId())
                .orElseThrow(() -> new AppException(ErrorCode.VOCABULARY_NOT_FOUND));

        UserDetailsCustom userDetails = (UserDetailsCustom) SecurityContextHolder.getContext().getAuthentication().getPrincipal();

        VocabularyUnit vocabularyUnit = new VocabularyUnit();
        if(request.getVocabularyUnitId() == null){
            vocabularyUnit  = vocabularyUnitRepository
                    .findByVocabularyGroupIsDefaultAndVocabularyGroupUserId(true, userDetails.getId())
                    .orElseThrow(()-> new AppException(ErrorCode.VOCABULARY_UNIT_DEFAULT_NOT_INIT));
            vocabularyUnit.setUpdatedAt(LocalDateTime.now());
        }else {
            vocabularyUnit = vocabularyUnitRepository
                    .findByIdAndVocabularyGroupUserId(request.getVocabularyUnitId(), userDetails.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.VOCABULARY_UNIT_NOT_EXISTS));
            vocabularyUnit.setUpdatedAt(LocalDateTime.now());
        }

        if (userSavedWordRepository.existsByUserIdAndDictionaryWordIdAndVocabularyUnitId
                (userDetails.getId(), request.getDictionaryWordId(), vocabularyUnit.getId())) {
            throw new AppException(ErrorCode.VOCABULARY_ALREADY_EXISTS);
        }

        User user = userRepository.getReferenceById(userDetails.getId());
        UserSavedWord userSavedWord = UserSavedWord.builder()
                .user(user)
                .dictionaryWord(dictionaryWord)
                .vocabularyUnit(vocabularyUnit)
                .contextSentence(request.getSourceSentence())
                .sourceUrl(request.getSourceUrl())
                .build();
        userSavedWord = userSavedWordRepository.save(userSavedWord);
        vocabularyUnitRepository.save(vocabularyUnit);
        return UserSavedWordResponse.builder().userSavedWordId(userSavedWord.getId()).build();
    }

    @Override
    public PageResponse<WordSavedFindResponse> findSaveWordByUser(int pageNo, int pageSize, String sort,
                                                                  String keyword, Long vocabularyUnitId) {
        UserDetailsCustom userDetails = (UserDetailsCustom) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize, SortUtil.createSort(sort));

        GenericSpecificationBuilder<UserSavedWord> builder = new GenericSpecificationBuilder<>();
        builder.withJoinById("user", userDetails.getId());
        builder.withJoinById("vocabularyUnit", vocabularyUnitId);
        if (StringUtils.hasText(keyword)) {// kiểm tra null và khoảng trắng
            builder.withJoin("dictionaryWord", "word", "=", keyword.trim());
        }

        Specification<UserSavedWord> specification = builder.build();

        Page<UserSavedWord> savedWordPage = userSavedWordRepository.findAll(specification, pageable);

        List<WordSavedFindResponse> data = userSavedWordMapper
                .toListWordSavedFindResponse(savedWordPage.getContent());

        return pageMapper.toPageResponse(savedWordPage, data);
    }

    @Override
    public void deleteBySavedWordId(Long userSavedWordId) {
        UserDetailsCustom userDetails = (UserDetailsCustom) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        UserSavedWord userSavedWord = userSavedWordRepository.findByIdAndUserId(userSavedWordId, userDetails.getId())
                .orElseThrow(()->new AppException(ErrorCode.VOCABULARY_NOT_FOUND));
        userSavedWordRepository.delete(userSavedWord);
    }

    @Transactional
    @Override
    public int syncWithAnki() {
        UserDetailsCustom userDetails = (UserDetailsCustom) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String rootDeckName = (user.getAnkiDeckName() != null && !user.getAnkiDeckName().isEmpty())
                ? user.getAnkiDeckName() : "VocabFlow";

        List<UserSavedWord> pendingWords =
                userSavedWordRepository.findByUserIdAndAnkiStatus(user.getId(), AnkiStatus.PENDING);

        if (pendingWords.isEmpty()) {
            return 0;
        }

        int successCount = 0;

        for (UserSavedWord savedWord : pendingWords) {
            String groupName = savedWord.getVocabularyUnit().getVocabularyGroup().getName();
            String unitName = savedWord.getVocabularyUnit().getName();

            // RootDeck::GroupName::UnitName (VD: "VocabFlow::IELTS::Unit 1")
            String fullDeckName = rootDeckName + "::" + groupName + "::" + unitName;

            ankiConnectService.createDeck(fullDeckName);

            // Bơm data vào Anki
            Long ankiNoteId = ankiConnectService.addNote(fullDeckName, savedWord.getDictionaryWord());

            if (ankiNoteId != null) {
                // Nếu thành công -> Cập nhật trạng thái vào Database
                savedWord.setAnkiNoteId(ankiNoteId);
                savedWord.setAnkiStatus(AnkiStatus.SYNCED);
                userSavedWordRepository.save(savedWord);
                successCount++;
            }
        }

        return successCount;
    }

    @Override
    public int resyncWithAnki(Long vocabularyGroupId) {
        User user = userRepository.findById(UserDetailUtil.get().getId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String rootDeckName = (user.getAnkiDeckName() != null && !user.getAnkiDeckName().isEmpty())
                ? user.getAnkiDeckName() : "VocabFlow";

        List<UserSavedWord> resyncWords =
                userSavedWordRepository.findByUserIdAndVocabularyUnitId(user.getId(), vocabularyGroupId);

        if (resyncWords.isEmpty()) {
            return 0;
        }

        int successCount = 0;

        for (UserSavedWord savedWord : resyncWords) {
            String groupName = savedWord.getVocabularyUnit().getVocabularyGroup().getName();
            String unitName = savedWord.getVocabularyUnit().getName();

            // Cấu trúc Deck 3 tầng: RootDeck::GroupName::UnitName (VD: "VocabFlow::IELTS::Unit 1")
            String fullDeckName = rootDeckName + "::" + groupName + "::" + unitName;

            ankiConnectService.createDeck(fullDeckName);
            Long ankiNoteId = ankiConnectService.addNote(fullDeckName, savedWord.getDictionaryWord());

            if (ankiNoteId != null) {
                savedWord.setAnkiNoteId(ankiNoteId);
                savedWord.setAnkiStatus(AnkiStatus.SYNCED);
                userSavedWordRepository.save(savedWord);
                successCount++;
            }
        }

        return successCount;
    }

}
