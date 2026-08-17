package com.khangmoihocit.VocabFlow.modules.user.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu cũ không được để trống")
    @Size(min = 8, message = "Mật khẩu cũ phải từ 8 kí tự")
    String oldPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, message = "Mật khẩu mới phải từ 8 kí tự")
    String newPassword;

    @NotBlank(message = "otp code không được để trống")
    String otpCode;
}
