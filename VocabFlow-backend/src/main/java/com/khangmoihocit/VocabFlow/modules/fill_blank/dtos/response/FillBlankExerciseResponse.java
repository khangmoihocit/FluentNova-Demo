package com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FillBlankExerciseResponse {
    private Long videoId;
    private String title;
    private String youtubeVideoId;
    private String channelName;
    private Integer totalBlanks;
    private List<FillBlankSegmentResponse> segments;
}
