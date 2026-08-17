package com.khangmoihocit.VocabFlow.modules.feedback.services;

import com.khangmoihocit.VocabFlow.modules.feedback.dtos.request.FeedbackRequest;
import com.khangmoihocit.VocabFlow.modules.feedback.dtos.response.FeedbackResponse;

public interface FeedbackService {
    FeedbackResponse submit(FeedbackRequest request);
}
