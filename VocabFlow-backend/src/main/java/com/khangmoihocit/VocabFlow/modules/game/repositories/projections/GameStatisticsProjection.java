package com.khangmoihocit.VocabFlow.modules.game.repositories.projections;

public interface GameStatisticsProjection {
    Long getTotalGames();
    Double getOverallAverageScore();
    Double getBestDictationScore();
    Double getBestShadowingScore();
}
