package com.khangmoihocit.VocabFlow.modules.vocabulary.services.Impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.khangmoihocit.VocabFlow.core.dtos.PageResponse;
import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.mapper.PageMapper;
import com.khangmoihocit.VocabFlow.core.specification.GenericSpecificationBuilder;
import com.khangmoihocit.VocabFlow.core.utils.SortUtil;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.record.GeminiWordInfo;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.request.LookupRequest;
import com.khangmoihocit.VocabFlow.modules.vocabulary.dtos.response.*;
import com.khangmoihocit.VocabFlow.modules.vocabulary.entities.DictionaryWord;
import com.khangmoihocit.VocabFlow.modules.vocabulary.mappers.DictionaryWordMapper;
import com.khangmoihocit.VocabFlow.modules.vocabulary.projections.WordSummary;
import com.khangmoihocit.VocabFlow.modules.vocabulary.repositories.DictionaryWordRepository;
import com.khangmoihocit.VocabFlow.integration.GeminiChatClientPool;
import com.khangmoihocit.VocabFlow.modules.vocabulary.services.DictionaryWordService;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Slf4j(topic = "DICTIONARY WORD SERVICE")
@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class DictionaryWordServiceImpl implements DictionaryWordService {

    DictionaryWordRepository dictionaryWordRepository;
    GeminiChatClientPool geminiPool;
    RestClient restClient;
    ObjectMapper objectMapper = new ObjectMapper();
    DictionaryWordMapper dictionaryWordMapper;
    PageMapper pageMapper;

    public DictionaryWordServiceImpl(DictionaryWordRepository dictionaryWordRepository, GeminiChatClientPool geminiPool, DictionaryWordMapper dictionaryWordMapper, PageMapper pageMapper) {
        this.dictionaryWordRepository = dictionaryWordRepository;
        this.geminiPool = geminiPool;
        this.dictionaryWordMapper = dictionaryWordMapper;
        this.pageMapper = pageMapper;
        this.restClient = RestClient.create();
    }

    @Override
    public LookupResponse lookupBasic(String word) {
        String cleanWord = word.trim().toLowerCase();

        //Kiểm tra Database (Nếu có ai đó từng tra bằng AI rồi thì hưởng sái luôn)
        Optional<DictionaryWord> existingWordOpt = dictionaryWordRepository.findFirstByWord(cleanWord);
        if (existingWordOpt.isPresent()) {
            return dictionaryWordMapper.toLookupResponse(existingWordOpt.get());
        }

        WordData dictData = fetchFromDictionaryApi(cleanWord);
        String finalAudioUrl = (dictData.audioUrl() != null) ? dictData.audioUrl() : generateGoogleTtsUrl(cleanWord);

        DictionaryWord newWord = DictionaryWord.builder()
                .word(cleanWord)
                .partOfSpeech(dictData.partOfSpeech() != null ? dictData.partOfSpeech() : "unknown")
                .pronunciation(dictData.phonetic())
                .meaningVi("Đang cập nhật!")
                .explanationEn(dictData.explanationEn())
                .explanationVi(dictData.explanationVi())
                .exampleSentence(dictData.exampleSentence())
                .audioUrl(finalAudioUrl)
                .build();

        newWord = dictionaryWordRepository.save(newWord);
        return dictionaryWordMapper.toLookupResponse(newWord);
    }

    @Override
    public LookupResponse lookupWithAi(LookupRequest request) {
        String cleanWord = request.getWord().trim().toLowerCase();

        List<DictionaryWord> existingWords = dictionaryWordRepository.findAllByWord(cleanWord);

        Optional<DictionaryWord> completeWordOpt = existingWords.stream()
                .filter(w -> !isDictionaryWordIncomplete(w))
                .findFirst();

        if (completeWordOpt.isPresent()) {
            log.info("Tra từ bằng AI: Từ '{}' đã có đầy đủ dữ liệu trong DB.", cleanWord);
            return dictionaryWordMapper.toLookupResponse(completeWordOpt.get());
        }

        WordData aiData = fetchFromGeminiApi(cleanWord, request.getContextSentence());
        WordData dictData = fetchFromDictionaryApi(cleanWord);

        DictionaryWord wordToSave = existingWords.stream()
                .filter(w -> Objects.equals(w.getPartOfSpeech(), aiData.partOfSpeech()))
                .findFirst()
                .orElse(new DictionaryWord());

        mergeDataIntoWord(wordToSave, aiData, dictData, cleanWord);

        DictionaryWord savedWord = dictionaryWordRepository.save(wordToSave);

        log.info("Tra từ bằng AI: Đã {} từ '{}'.",
                wordToSave.getId() == null ? "thêm mới" : "cập nhật", cleanWord);

        return dictionaryWordMapper.toLookupResponse(savedWord);
    }

    private void mergeDataIntoWord(DictionaryWord word, WordData aiData, WordData dictData, String cleanWord) {
        word.setWord(cleanWord);
        word.setPartOfSpeech(aiData.partOfSpeech());

        // Audio: Ưu tiên Dictionary API → fallback Google TTS
        if (!StringUtils.hasText(word.getAudioUrl())) {
            word.setAudioUrl(StringUtils.hasText(dictData.audioUrl())
                    ? dictData.audioUrl()
                    : generateGoogleTtsUrl(cleanWord));
        }

        // Các trường còn lại: chỉ cập nhật nếu hiện tại đang rỗng hoặc là placeholder
        if (!StringUtils.hasText(word.getPronunciation())) {
            word.setPronunciation(StringUtils.hasText(dictData.phonetic())
                    ? dictData.phonetic()
                    : aiData.phonetic());
        }

        if (isFieldIncomplete(word.getMeaningVi())) {
            word.setMeaningVi(aiData.meaningVi());
        }

        if (isFieldIncomplete(word.getExplanationEn())) {
            word.setExplanationEn(StringUtils.hasText(aiData.explanationEn())
                    ? aiData.explanationEn()
                    : dictData.explanationEn());
        }

        if (isFieldIncomplete(word.getExplanationVi())) {
            word.setExplanationVi(aiData.explanationVi());
        }

        if (isFieldIncomplete(word.getExampleSentence())) {
            word.setExampleSentence(aiData.exampleSentence());
        }
    }

    private boolean isFieldIncomplete(String value) {
        return !StringUtils.hasText(value) || value.contains("Đang cập nhật!");
    }

    private boolean isDictionaryWordIncomplete(DictionaryWord word) {
        if (word == null) return true;

        return !StringUtils.hasText(word.getPartOfSpeech()) || "unknown".equalsIgnoreCase(word.getPartOfSpeech())
                || !StringUtils.hasText(word.getPronunciation())
                || !StringUtils.hasText(word.getMeaningVi()) || word.getMeaningVi().contains("Đang cập nhật!")
                || !StringUtils.hasText(word.getExplanationEn())
                || !StringUtils.hasText(word.getExplanationVi())
                || !StringUtils.hasText(word.getExampleSentence());
    }

    @Override
    public TranslateResponse translateText(String text) {
        String prompt = String.format(
                "Hãy đóng vai một chuyên gia ngôn ngữ. Dịch đoạn văn tiếng Anh sau sang tiếng Việt " +
                        "một cách tự nhiên, trôi chảy và sát nghĩa nhất. " +
                        "Chỉ trả về duy nhất kết quả dịch, tuyệt đối không giải thích hay thêm ký tự thừa:\n\n\"%s\"",
                text
        );

        String translatedText = geminiPool.callWithFallback(
                client -> client.prompt().user(u -> u.text(prompt)).call().entity(String.class));

        if (translatedText.startsWith("\"") && translatedText.endsWith("\"")) {
            translatedText = translatedText.substring(1, translatedText.length() - 1);
        }

        return TranslateResponse.builder()
                .originalText(text)
                .translatedText(translatedText)
                .build();
    }

    @Override
    public PageResponse<DictionaryWordResponse> findAll(int pageNo, int pageSize, String sortParam, String keyword) {
        Sort sort = SortUtil.createSort(sortParam);
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize, sort);

        GenericSpecificationBuilder<DictionaryWord> builder = new GenericSpecificationBuilder<>();

        if (StringUtils.hasText(keyword)) {
            builder.with("word", "=", keyword.trim());
        }

        Specification<DictionaryWord> specification = builder.build();

        Page<DictionaryWord> dictionaryWordPage = dictionaryWordRepository.findAll(specification, pageable);

        return pageMapper.toPageResponse(dictionaryWordPage,
                dictionaryWordMapper.toListDictionWordResponse(dictionaryWordPage.getContent()));
    }

    @Override
    public PageResponse<TopicResponse> findWordByTopic(int pageNo, int pageSize, String sort, String topic) {
        return null;
    }

    @Override
    public List<LookupWordResponse> lookupWord(String word) {
        if(!StringUtils.hasText(word)) throw new AppException(ErrorCode.INVALID_PARAM);
        List<WordSummary> dictionaryWordList = dictionaryWordRepository.findByWord(word)
                .orElseThrow(()->new AppException(ErrorCode.VOCABULARY_NOT_FOUND));

        List<LookupWordResponse> lookupWordResponseList = new ArrayList<>();
        dictionaryWordList.forEach(dictionaryWord -> {
            LookupWordResponse lookupWordResponse = LookupWordResponse.builder()
                    .dictionaryWordId(dictionaryWord.getId())
                    .word(dictionaryWord.getWord())
                    .pronunciation(dictionaryWord.getPronunciation())
                    .description(dictionaryWord.getDescription())
                    .htmlContent(dictionaryWord.getHtmlContent())
                    .build();
            lookupWordResponseList.add(lookupWordResponse);
        });
        return lookupWordResponseList;
    }

    private WordData fetchFromDictionaryApi(String word) {
        String phonetic = null;
        String audioUrl = null;
        String partOfSpeech = null;
        String meaningVi = "Không tìm thấy nghĩa trong từ điển gốc"; // Sẽ bị Gemini ghi đè sau
        String explanationEn = null;
        String explanationVi = "";
        String exampleSentence = "";

        try {
            var response = restClient.get()
                    .uri("https://api.dictionaryapi.dev/api/v2/entries/en/{word}", word)
                    .header("User-Agent", "Mozilla/5.0")
                    .retrieve()
                    .toEntity(String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode body = objectMapper.readTree(response.getBody());
                if (body.isArray() && !body.isEmpty()) {
                    JsonNode firstEntry = body.get(0);

                    // Lấy âm thanh và phiên âm
                    if (firstEntry.has("phonetic") && !firstEntry.get("phonetic").isNull()) {
                        phonetic = firstEntry.get("phonetic").asText();
                    }
                    JsonNode phoneticsArray = firstEntry.get("phonetics");
                    if (phoneticsArray != null && phoneticsArray.isArray()) {
                        for (JsonNode node : phoneticsArray) {
                            if (phonetic == null && node.has("text")) phonetic = node.get("text").asText();
                            if (node.has("audio") && !node.get("audio").asText().isEmpty()) {
                                audioUrl = node.get("audio").asText();
                                break;
                            }
                        }
                    }

                    JsonNode meaningsArray = firstEntry.get("meanings");
                    if (meaningsArray != null && meaningsArray.isArray() && !meaningsArray.isEmpty()) {
                        JsonNode firstMeaning = meaningsArray.get(0);
                        if (firstMeaning.has("partOfSpeech")) partOfSpeech = firstMeaning.get("partOfSpeech").asText();
                        JsonNode definitions = firstMeaning.get("definitions");
                        if (definitions != null && definitions.isArray() && !definitions.isEmpty()) {
                            explanationEn = definitions.get(0).get("definition").asText();
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Dictionary API bỏ qua từ: {}", word);
        }
        return new WordData(partOfSpeech, phonetic, meaningVi, explanationEn, explanationVi, exampleSentence, audioUrl);
    }

    private WordData fetchFromGeminiApi(String word, String contextSentence) {
        GeminiWordInfo aiInfo = geminiPool.callWithFallback(client -> client.prompt()
                .user(u -> u.text("Bạn là chuyên gia ngôn ngữ. Phân tích '{word}' trong câu: '{context}'. Trả về JSON với các key: partOfSpeech, phonetic, meaningVi, explanationEn, explanationVi, exampleSentence.")
                        .param("word", word)
                        .param("context", contextSentence != null ? contextSentence : ""))
                .call()
                .entity(GeminiWordInfo.class));

        return new WordData(aiInfo.partOfSpeech(), aiInfo.phonetic(), aiInfo.meaningVi(), aiInfo.explanationEn(),
                aiInfo.explanationVi(), aiInfo.exampleSentence(), null);
    }

    private String generateGoogleTtsUrl(String text) {
        try {
            // Mã hóa URL để chống lỗi dấu cách (VD: "get ahead" -> "get+ahead")
            String encodedText = URLEncoder.encode(text, StandardCharsets.UTF_8.toString());
            return "https://translate.google.com/translate_tts?ie=UTF-8&q=" + encodedText + "&tl=en&client=tw-ob";
        } catch (Exception e) {
            return null;
        }
    }

    private record WordData(String partOfSpeech, String phonetic, String meaningVi,
                            String explanationEn, String explanationVi, String exampleSentence, String audioUrl) {
    }
}