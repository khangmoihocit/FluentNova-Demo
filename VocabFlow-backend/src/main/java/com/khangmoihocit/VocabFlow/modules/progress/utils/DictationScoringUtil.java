package com.khangmoihocit.VocabFlow.modules.progress.utils;

public final class DictationScoringUtil {

    private static final int FREE_REPLAYS = 3;

    private DictationScoringUtil() {
    }

    public static int calculateScore(int hintCount, int replayCount, int wrongSubmitCount) {
        return Math.max(0,
                100
                        - (Math.max(0, replayCount - FREE_REPLAYS) * 2)
                        - (wrongSubmitCount * 4)
                        - (hintCount * 4));
    }
}
