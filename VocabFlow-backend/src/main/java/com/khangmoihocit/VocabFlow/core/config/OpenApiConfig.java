package com.khangmoihocit.VocabFlow.core.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "VocabFlow API Documentation",
                description = "Tài liệu mô tả các API cho hệ thống học từ vựng VocabFlow",
                version = "1.0",
                contact = @Contact(
                        name = "Khang",
                        email = "khangphamvan.dev@gmail.com"
                )
        ),
        // Yêu cầu mọi API mặc định phải có Token (sẽ có ổ khóa bên cạnh)
        security = {
                @SecurityRequirement(name = "bearerAuth")
        }
)
@SecurityScheme(
        name = "bearerAuth",
        description = "Nhập JWT Token của bạn vào đây (Không cần gõ chữ Bearer)",
        scheme = "bearer",
        type = SecuritySchemeType.HTTP,
        bearerFormat = "JWT",
        in = SecuritySchemeIn.HEADER
)
public class OpenApiConfig {
}