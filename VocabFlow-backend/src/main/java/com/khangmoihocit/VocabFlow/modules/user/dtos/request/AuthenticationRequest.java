package com.khangmoihocit.VocabFlow.modules.user.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationRequest {
    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong dung dinh dang")
    @Pattern(regexp = "(?i)^[A-Za-z0-9._%+-]+@(gmail\\.com|yahoo\\.com|outlook\\.com|live\\.com)$", message = "Email không đúng định dạng")
    String email;

    @NotBlank(message = "Mat khau khong duoc de trong")
    @Size(min = 6, message = "Mat khau phai tu 6 ky tu")
    String password;
}
