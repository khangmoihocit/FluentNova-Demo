package com.khangmoihocit.VocabFlow.modules.vocabulary.projections;

public interface WordSummary {
    Long getId();
    String getWord();
    String getPronunciation();
    String getDescription();
    String getHtmlContent();
}
