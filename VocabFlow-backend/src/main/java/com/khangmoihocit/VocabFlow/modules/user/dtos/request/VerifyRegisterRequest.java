package com.khangmoihocit.VocabFlow.modules.user.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerifyRegisterRequest {
    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong dung dinh dang")
    @Pattern(regexp = "(?i)^[A-Za-z0-9._%+-]+@(gmail\\.com|yahoo\\.com|outlook\\.com|live\\.com)$", message = "Email không đúng định dạng")
    String email;


    @NotBlank(message = "Otp code khong duoc de trong")
    String otpCode;
}
