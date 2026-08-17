package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class FillBlankSegmentResponse {
    private Long id;
    private Integer segmentOrder;
    private BigDecimal startTime;
    private BigDecimal endTime;
    private String englishText;
    private String vietnameseTranslation;
    private String ipa;
    private Boolean lineBreakBefore;
    private List<FillBlankItemUserResponse> blanks;
}
