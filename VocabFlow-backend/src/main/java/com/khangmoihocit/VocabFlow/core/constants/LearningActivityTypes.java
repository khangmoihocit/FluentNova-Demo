package com.khangmoihocit.VocabFlow.core.constants;

public final class LearningActivityTypes {
    public static final String WATCH = "WATCH";
    public static final String FILL_BLANK = "FILL_BLANK";
    public static final String DICTATION = "DICTATION";
    public static final String SHADOWING = "SHADOWING";
    public static final String QUIZ = "QUIZ";

    private LearningActivityTypes() {
    }

    public static String normalize(String activityType) {
        if (activityType == null || activityType.isBlank()) {
            return WATCH;
        }

        String normalized = activityType.trim().toUpperCase();
        if ("LISTENING".equals(normalized) || "WATCH_VIDEO".equals(normalized)) {
            return WATCH;
        }
        if ("FILLBLANK".equals(normalized) || "FILL_BLANK".equals(normalized)) {
            return FILL_BLANK;
        }
        if ("SHADOWING".equals(normalized)) {
            return SHADOWING;
        }
        if ("DICTATION".equals(normalized)) {
            return DICTATION;
        }
        if ("QUIZ".equals(normalized)) {
            return QUIZ;
        }
        return normalized;
    }
}
