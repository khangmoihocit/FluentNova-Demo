package com.khangmoihocit.VocabFlow.core.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.khangmoihocit.VocabFlow.core.exception.AppException;
import com.khangmoihocit.VocabFlow.core.exception.OurException;
import com.khangmoihocit.VocabFlow.core.exception.ValidTokenException;
import com.khangmoihocit.VocabFlow.modules.user.services.Impl.UserDetailsServiceImpl;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotNull;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

import io.jsonwebtoken.security.SignatureException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j(topic = "JWT AUTHENTICATION  FILTER")
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    JwtService jwtService;
    UserDetailsServiceImpl userDetailService;

    //trước khi vào controller sẽ vào filter này để check token, check đầu -> security config
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.info("request không có token: {}", request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);

            String tokenType = jwtService.extractTokenType(jwt);
            if (!"ACCESS".equals(tokenType)) {
                sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                        "Xác thực không thành công",
                        "Vui lòng sử dụng Access Token để gọi API, không được dùng Refresh Token!");
                return;
            }

            final String userEmail = jwtService.extractUsername(jwt);
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (userEmail != null && authentication == null) {
                UserDetailsCustom userDetails = (UserDetailsCustom) userDetailService.loadUserByUsername(userEmail);
                if (!userEmail.equals(userDetails.getUsername())) {
                    sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                            "Xác thực không thành công",
                            "User token không chính xác");
                    return;
                }

                if (!userDetails.isEnabled()) {
                    sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                            "Xác thực không thành công",
                            "Tài khoản của bạn hiện đang bị khóa");
                    return;
                }

                UsernamePasswordAuthenticationToken authenticationToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
            }
            filterChain.doFilter(request, response);
        } catch (ExpiredJwtException ex) {
            sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                    "Xác thực không thành công", "Token đã hết hạn, vui lòng đăng nhập lại");
        } catch (SignatureException ex) {
            sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                    "Xác thực không thành công", "Chữ ký token không hợp lệ hoặc đã bị giả mạo");
        } catch (MalformedJwtException ex) {
            sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                    "Xác thực không thành công", "Token không đúng định dạng");
        } catch (UnsupportedJwtException ex) {
            sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                    "Xác thực không thành công", "Định dạng Token không được hệ thống hỗ trợ");
        } catch (IllegalArgumentException ex) {
            sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                    "Xác thực không thành công", "Token không hợp lệ hoặc bị trống");
        } catch (Exception ex) {
            sendErrorResponse(response, request, HttpServletResponse.SC_UNAUTHORIZED,
                    "Xác thực không thành công", "Đã xảy ra lỗi trong quá trình xác thực token");
        }
    }

    //401 Unauthorized	Chưa xác thực hoặc token không hợp lệ / hết hạn
    //403 Forbidden	Đã xác thực thành công, nhưng không có quyền truy cập
    //vì exception jwt filter sẽ không được bắt ở global exception (chỉ bắt exception ở controller)
    private void sendErrorResponse(
            @NotNull HttpServletResponse response,
            @NotNull HttpServletRequest request,
            int statusCode, String error, String message) throws IOException {

        response.setStatus(statusCode);
        response.setContentType("application/json;charset=UTF-8");

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", statusCode);
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        errorResponse.put("path", request.getRequestURL());

        ObjectMapper objectMapper = new ObjectMapper();
        String jsonResponse = objectMapper.writeValueAsString(errorResponse);

        response.getWriter().write(jsonResponse);
    }
}