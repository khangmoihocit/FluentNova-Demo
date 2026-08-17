package com.khangmoihocit.VocabFlow.core.services;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EmailService {

    @Value("${spring.brevo.api.key}")
    private String apiKey;

    public void sendOtpEmail(String toEmail, String otpCode, String type) {
        RestTemplate restTemplate = new RestTemplate();
        String url = "https://api.brevo.com/v3/smtp/email";
        String title;
        switch (type) {
            case "REGISTER":
                title = "Xác nhận đăng ký tài khoản";
                break;
            case "FORGOT_PASSWORD":
                title = "Khôi phục mật khẩu";
                break;
            case "CHANGE_PASSWORD":
                title = "Thay đổi mật khẩu";
                break;
            default:
                title = "Mã xác thực OTP";
        }

        String htmlContent = "<h3>Chào bạn,</h3>" +
                "<p>Bạn vừa yêu cầu mã OTP để <b>" + title.toLowerCase() + "</b>.</p>" +
                "<p>Mã xác thực của bạn là: <span style='font-size: 22px; font-weight: bold; color: #2563eb;'>" + otpCode + "</span></p>" +
                "<p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>" +
                "<br><p>Trân trọng,<br>Đội ngũ FluentNova</p>";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);
        headers.set("accept", "application/json");

        Map<String, Object> body = Map.of(
                "sender", Map.of("name", "FluentNova Security", "email", "khang789.pv@gmail.com"),
                "to", List.of(Map.of("email", toEmail)),
                "subject", "FluentNova - " + title,
                "htmlContent", htmlContent
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            System.out.println("Gửi OTP qua Brevo thành công tới: " + toEmail + " | Status: " + response.getStatusCode());
        } catch (Exception e) {
            System.err.println("Lỗi gửi mail qua Brevo API: " + e.getMessage());
        }
    }
}