package com.khangmoihocit.VocabFlow.modules.feedback.dtos.request;

import com.khangmoihocit.VocabFlow.modules.feedback.enums.FeedbackType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FeedbackRequest {

    @NotNull(message = "Loai gop y khong duoc de trong")
    FeedbackType type;

    @Size(max = 255, message = "Video URL/ID khong duoc vuot qua 255 ky tu")
    String videoReference;

    @NotBlank(message = "Noi dung gop y khong duoc de trong")
    @Size(max = 4000, message = "Noi dung gop y khong duoc vuot qua 4000 ky tu")
    String content;
}
