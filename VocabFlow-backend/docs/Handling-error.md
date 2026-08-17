# Tài liệu API - Cơ chế xử lý lỗi (Error Handling)

Hệ thống VocabFlow Backend sử dụng phương pháp xử lý lỗi tập trung thông qua `GlobalExceptionHandler` (`@ControllerAdvice`). Tất cả các Exception phát sinh (từ validation, logic nghiệp vụ, đến lỗi hệ thống) đều được format lại theo định dạng chuẩn của `ApiResponse<?>`.

### Cấu trúc chung của Error Response
Mọi Response báo lỗi đều sẽ có chung bộ khung:
```json
{
  "success": false,
  "code": "MÃ_LỖI",                 // Ví dụ: ERROR_CODE, VALIDATION_ERROR, ACCESS_DENIED
  "message": "Chi tiết lỗi",        // Mô tả vì sao lỗi
  "data": null,                     // (Luôn null khi có lỗi)
  "errors": { ... },                // (Field bổ sung nếu là lỗi danh sách như Validation)
  "timestamp": "2024-03-24T12:00:00"
}
```

---

## 1. Các trường hợp lỗi phổ biến

### 1.1 Lỗi Logic Nghiệp Vụ - `AppException`
Được ném ra khi có lỗi liên quan đến các kịch bản định sẵn (User không tồn tại, sai mật khẩu, tài khoản bị khoá, v.v...). Code và nội dung sẽ được map từ enum `ErrorCode`.

- **Mã HTTP Status**: Thường là `400 Bad Request` / `404 Not Found` (Tuỳ cấu hình enum).
- **Ví dụ**:
  ```json
  {
    "success": false,
    "code": "USER_NOT_FOUND",
    "message": "User không tồn tại trong hệ thống",
    "timestamp": "2024-03-24T00:00:00"
  }
  ```

### 1.2 Lỗi Validation (Ngoại lệ `@Valid`) - `MethodArgumentNotValidException`
Được ném ra khi request body gửi lên bị sai dữ liệu so với Rule định nghĩa trong các Model Dto (Ví dụ: Email sai định dạng, mật khẩu ngắn dưới 8 ký tự).
- **HTTP Status**: Theo cấu hình `ErrorCode.VALIDATION_ERROR` (Thường `400 Bad Request`).
- **Response**: Trả về thêm object dánh sách trường lỗi (`errors`).
  ```json
  {
    "success": false,
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "errors": {
      "email": "Email không đúng định dạng",
      "password": "Mật khẩu phải từ 8 kí tự"
    },
    "timestamp": "2024-03-24T00:00:00"
  }
  ```

### 1.3 Lỗi sai Credentials - `BadCredentialsException`
Xảy ra khi đăng nhập thất bại (sai email hoặc mật khẩu) trong quá trình call Security Context.
- **HTTP Status**: Tuỳ enum (thường `401 Unauthorized`).
- **Response**:
  ```json
  {
    "success": false,
    "code": "INVALID_CREDENTIALS",
    "message": "Email hoặc mật khẩu không chính xác",
    "timestamp": "2024-03-24T00:00:00"
  }
  ```

### 1.4 Lỗi Phân Quyền - `AccessDeniedException` / `AuthorizationDeniedException`
Xảy ra khi User đang đăng nhập ở một nhóm Role cụ thể cố tình gọi API yêu cầu bảo mật cao hơn (`@PreAuthorize("hasRole('ADMIN')")`).
- **HTTP Status**: `403 Forbidden`
- **Response**:
  ```json
  {
    "success": false,
    "code": "ACCESS_DENIED",
    "message": "Không có quyền truy cập",
    "timestamp": "2024-03-24T00:00:00"
  }
  ```

### 1.5 Lỗi Ngoại lệ tuỳ biến - `OurException`
Nơi ném các lỗi Custom String truyền vào mà không thông qua ErrorCode Enum.
- **HTTP Status**: `400 Bad Request`.
- **Response**:
  ```json
  {
    "success": false,
    "code": "ERROR",
    "message": "File ảnh có kích thước quá giới hạn",
    "timestamp": "2024-03-24T00:00:00"
  }
  ```

### 1.6 Lỗi Xác Thực Token - `ValidTokenException` / `DisabledException`
Ném ra trong chuỗi filter trước khi tới Controller (Token lỗi, token bị hạn, tài khoản bị khoá nhưng cầm đúng token).
*Đối với trường hợp này, Server trả về Object custom Map thay vì dùng ApiResponse chuẩn:*
- **HTTP Status**: `401 Unauthorized`
- **Response**:
  ```json
  {
    "timestamp": 1711281600000,
    "status": 401,
    "error": "Xác thực không thành công",
    "message": "Token đã hết hạn",
    "path": "http://localhost:8080/api/v1/user/me"
  }
  ```

### 1.7 Lỗi Hệ thống chưa kịp cấu hình / Unknown - `RuntimeException`
Kém ra cho các lỗi null pointer, logic hệ thống.
- **HTTP Status**: Map theo Enum `UNCATEGORIZED_EXCEPTION` (Thường `500 Internal Server Error`).
- **Response**: 
  ```json
  {
    "success": false,
    "code": "UNCATEGORIZED_EXCEPTION",
    "message": "Lỗi hệ thống không xác định",
    "timestamp": "2024-03-24T00:00:00"
  }
  ```
