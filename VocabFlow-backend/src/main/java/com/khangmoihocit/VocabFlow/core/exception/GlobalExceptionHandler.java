package com.khangmoihocit.VocabFlow.core.exception;

import com.khangmoihocit.VocabFlow.core.enums.ErrorCode;
import com.khangmoihocit.VocabFlow.core.dtos.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
@Slf4j(topic = "GlobalExceptionHandler")
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    ResponseEntity<ApiResponse<?>> handlingRuntimeException(RuntimeException exception) {
        log.error("Exception: ", exception);
        ErrorCode errorCode = ErrorCode.UNCATEGORIZED_EXCEPTION;
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ApiResponse.error(errorCode));
    }

    @ExceptionHandler(AppException.class)
    ResponseEntity<ApiResponse<?>> handleAppException(AppException exception){
        ErrorCode errorCode = exception.getErrorCode();
        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ApiResponse.error(errorCode));
    }

    @ExceptionHandler(OurException.class)
    ResponseEntity<ApiResponse<?>> handleOurException(OurException exception){
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(exception.getMessage()));
    }

    @ExceptionHandler(ValidTokenException.class)
    ResponseEntity<?> handleValidateTokenException(ValidTokenException exception, @NotNull HttpServletRequest request){
        String message = exception.getMessage();
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        errorResponse.put("error", "Xác thực không thành công");
        errorResponse.put("message", message);
        errorResponse.put("path", request.getRequestURL());
        return ResponseEntity
                .status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(errorResponse);
    }

    @ExceptionHandler(DisabledException.class)
    ResponseEntity<?> handleDisabledExceptionException(DisabledException exception, @NotNull HttpServletRequest request){
        String message = exception.getMessage();
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("timestamp", System.currentTimeMillis());
        errorResponse.put("status", HttpServletResponse.SC_UNAUTHORIZED);
        errorResponse.put("error", "Xác thực không thành công");
        errorResponse.put("message", message);
        errorResponse.put("path", request.getRequestURL());
        return ResponseEntity
                .status(HttpServletResponse.SC_UNAUTHORIZED)
                .body(errorResponse);
    }

    //bắt lỗi từ @Valid
    //return 1 list error
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<?>> handleValidException(MethodArgumentNotValidException exception){

        Map<String, String> errors = new HashMap<>();

        exception.getBindingResult().getFieldErrors().forEach(error -> {
            errors.put(error.getField(), error.getDefaultMessage());
        });

        ErrorCode errorCode = ErrorCode.VALIDATION_ERROR;

        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ApiResponse.error(errorCode, errors));
    }

    //username sai hoặc password sai
    //xảy ra bên trong AuthenticationManager hoặc DaoAuthenticationProvider.
    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    ResponseEntity<ApiResponse<?>> handleBadCredentialsException(
            org.springframework.security.authentication.BadCredentialsException exception) {

        ErrorCode errorCode = ErrorCode.INVALID_CREDENTIALS;

        return ResponseEntity
                .status(errorCode.getStatus())
                .body(ApiResponse.error(errorCode));
    }

    //Nếu fail ở Filter authorizeHttpRequests
    @ExceptionHandler(AuthorizationDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAuthorizationDeniedException(
            AuthorizationDeniedException exception) {

        log.error("AuthorizationDeniedException: ", exception);

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ErrorCode.ACCESS_DENIED));
    }

    //Nếu fail ở @PreAuthorize
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<?>> handleAccessDeniedException(
            AccessDeniedException exception) {

        log.error("AccessDeniedException: ", exception);

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(ErrorCode.ACCESS_DENIED));
    }

    @ExceptionHandler(jakarta.validation.UnexpectedTypeException.class)
    public ResponseEntity<ApiResponse<?>> handleUnexpectedTypeException(
            jakarta.validation.UnexpectedTypeException ex,
            HttpServletRequest request) {

        log.error("Validation configuration error (UnexpectedTypeException): ", ex);

        String message = "Cấu hình validation không hợp lệ: " + ex.getMessage();

        String detail = ex.getMessage();
        if (detail.contains("Check configuration for")) {
            String field = detail.substring(detail.lastIndexOf("'") - detail.lastIndexOf("'") + 1).replace("'", "");
            message = "Validation sai kiểu dữ liệu tại field: " + field + ". Vui lòng kiểm tra annotation.";
        }

        Map<String, Object> errorDetails = new HashMap<>();
        errorDetails.put("timestamp", LocalDateTime.now().toString());
        errorDetails.put("path", request.getRequestURI());
        errorDetails.put("detail", detail);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)   // 400 là phù hợp nhất
                .body(ApiResponse.error(
                        ErrorCode.VALIDATION_ERROR,
                        errorDetails
                ));
    }
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiResponse<?>> handleMethodArgumentTypeMismatchException(
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException exception) {
        log.error("MethodArgumentTypeMismatchException: ", exception);
        
        String message = String.format("Giá trị '%s' của tham số '%s' không hợp lệ (yêu cầu kiểu %s)",
                exception.getValue(), exception.getName(), exception.getRequiredType().getSimpleName());

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ErrorCode.INVALID_REQUEST, message));
    }

}
