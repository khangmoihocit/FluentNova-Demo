package com.khangmoihocit.VocabFlow.modules.user.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    @NotBlank(message = "Họ và tên không được để trống!")
    @Size(min = 2, max = 20, message = "Tên phải từ 2-50 ký tự")
    String fullName;

    @NotBlank(message = "Tên bộ anki không được là null")
    @Size(min = 2, max = 20, message = "Tên bộ anki phải từ 2-20 ký tự")
    String ankiDeckName;

    @NotBlank(message = "Tên bộ anki video không được là null")
    @Size(min = 2, max = 50, message = "Tên bộ anki video phải từ 2-50 ký tự")
    String ankiVideoDeckName;
}
