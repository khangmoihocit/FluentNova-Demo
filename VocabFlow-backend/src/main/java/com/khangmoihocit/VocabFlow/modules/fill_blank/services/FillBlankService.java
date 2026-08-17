package com.khangmoihocit.VocabFlow.modules.fill_blank.services;

import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.CreateFillBlankItemRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.SubmitFillBlankRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.request.UpdateFillBlankItemRequest;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.FillBlankExerciseResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.FillBlankItemAdminResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.FillBlankSubmitResultResponse;
import com.khangmoihocit.VocabFlow.modules.fill_blank.dtos.response.UserFillBlankAttemptResponse;

import java.util.List;

public interface FillBlankService {
    FillBlankExerciseResponse getUserFillBlank(Long videoId);

    List<FillBlankItemAdminResponse> getAdminItems(Long videoId);

    FillBlankItemAdminResponse createItem(Long videoId, CreateFillBlankItemRequest request);

    FillBlankItemAdminResponse updateItem(Long itemId, UpdateFillBlankItemRequest request);

    void deleteItem(Long itemId);

    FillBlankSubmitResultResponse submit(Long videoId, SubmitFillBlankRequest request);

    List<UserFillBlankAttemptResponse> getUserAttempts(Long videoId);
}
