package com.khangmoihocit.VocabFlow.modules.user.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCreationRequest {
    @NotBlank(message = "Email khong duoc de trong")
    @Email(message = "Email khong dung dinh dang")
    @Pattern(regexp = "(?i)^[A-Za-z0-9._%+-]+@(gmail\\.com|yahoo\\.com|outlook\\.com|live\\.com)$", message = "Email không đúng định dạng")

    String email;

    @NotBlank(message = "Mat khau khong duoc de trong")
    @Size(min = 6, message = "Mat khau phai tu 6 ky tu")
    @Pattern(regexp = "^(?=.*[A-Z])(?=.*[A-Za-z])(?=.*\\d).+$", message = "Mat khau phai co it nhat 1 chu viet hoa, 1 chu cai va 1 chu so")
    String password;

    @NotEmpty(message = "Ten khong duoc de trong")
    @Size(min = 2, max = 20, message = "Ten phai tu 2-20 ky tu")
    String fullName;
}
