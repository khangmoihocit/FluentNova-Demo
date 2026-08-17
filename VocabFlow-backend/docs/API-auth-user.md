# Tài liệu API - Authentication & User Management

Tất cả các API đều có chung định dạng Response (gói trong `ApiResponse<T>`):
```json
{
  "success": true,               // true nếu thành công, false nếu có lỗi
  "code": "SUCCESS",             // Mã code (VD: SUCCESS, ERROR, hoặc mã lỗi cụ thể)
  "message": "Thông báo",        // Thông báo cho người dùng
  "data": { ... },               // Dữ liệu trả về (tùy API)
  "errors": null,                // Chứa chi tiết lỗi validation nếu có
  "timestamp": "2024-03-24T12:00:00"
}
```

---

## 1. Authentication Controller (`/auth`)
**Prefix base:** `/auth` (ví dụ: `http://localhost:8080/api/v1/auth`)
**Quyền truy cập:** **Public** (Không cần access token)

### 1.1. Đăng nhập (Login)
- **URL**: `/login`
- **Method**: `POST`
- **Request Body** (`AuthenticationRequest` - JSON):
  ```json
  {
    "email": "user@example.com", // Bắt buộc, chuẩn định dạng email
    "password": "password123"    // Bắt buộc, tối thiểu 8 ký tự
  }
  ```
- **Response Data** (`AuthenticationResponse`): Gồm `accessToken`, `refreshToken` và object thông tin `user`.

### 1.2. Đăng ký (Register)
- **URL**: `/register`
- **Method**: `POST`
- **Request Body** (`UserCreationRequest` - JSON):
  ```json
  {
    "email": "user@example.com", // Bắt buộc
    "password": "password123",   // Bắt buộc, tối thiểu 8 ký tự
    "fullName": "Nguyen Van A"   // Bắt buộc, 2-20 ký tự
  }
  ```
- **Response Data** (`UserResponse`): Trả về thông tin user vừa tạo (chưa được verify).

### 1.3. Xác thực Email (Verify Register)
- **URL**: `/verify-register`
- **Method**: `POST`
- **Request Body** (`VerifyRegisterRequest` - JSON):
  ```json
  {
    "email": "user@example.com", // Bắt buộc
    "otpCode": "123456"          // Bắt buộc
  }
  ```
- **Response Data** (`AuthenticationResponse`): Trả ra Token để login tự động sau khi xác thực thành công.

### 1.4. Refresh Token
- **URL**: `/refresh-token`
- **Method**: `POST`
- **Request Body** (`RefreshTokenRequest` - JSON):
  ```json
  {
    "refreshToken": "eyJ..."     // Bắt buộc
  }
  ```
- **Response Data**: Access Token mới.

### 1.5. Đăng xuất (Logout)
- **URL**: `/logout`
- **Method**: `POST`
- **Request Body** (`RefreshTokenRequest` - JSON):
  ```json
  {
    "refreshToken": "eyJ..."     // Token cần thu hồi
  }
  ```
- **Response Data**: Không có data, message "Đăng xuất thành công!".

### 1.6. Quên mật khẩu (Forgot Password)
- **URL**: `/forgot-password`
- **Method**: `POST`
- **Request Body** (`ForgotPasswordRequest` - JSON):
  ```json
  {
    "email": "user@example.com"  // Bắt buộc
  }
  ```
- **Response Data**: Message báo OTP đã được gửi.

### 1.7. Đặt lại mật khẩu (Reset Password)
- **URL**: `/reset-password`
- **Method**: `POST`
- **Request Body** (`ResetPasswordRequest` - JSON):
  ```json
  {
    "email": "user@example.com",     // Bắt buộc
    "otpCode": "123456",             // Bắt buộc
    "newPassword": "newpassword123"  // Bắt buộc, từ 8 ký tự
  }
  ```
- **Response Data**: Message báo đổi mật khẩu thành công.

---

## 2. User Controller (`/user`)
**Prefix base:** `/user` (ví dụ: `http://localhost:8080/api/v1/user`)

### 2.1. Tải lên Avatar (Upload Avatar)
- **URL**: `/upload-avatar`
- **Method**: `POST`
- **Quyền truy cập**: User đã đăng nhập (Cần Access Token)
- **Request**: Dạng `multipart/form-data`
  - `file`: Hình ảnh đính kèm (chỉ nhận JPG, PNG, giới hạn < 5MB).
- **Response Data**: Chuỗi String trả về `avatarUrl` trên Cloudinary.

### 2.2. Lấy thông tin cá nhân (Get Me)
- **URL**: `/me`
- **Method**: `GET`
- **Quyền truy cập**: User đã đăng nhập (Cần Access Token)
- **Request**: Không
- **Response Data** (`UserResponse`):
  ```json
  {
    "id": "uuid...",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "role": "USER",
    "ankiDeckName": "My Deck",
    "isActive": true,
    "avatarUrl": "https://...",
    "provider": "LOCAL",
    "isDeleted": false,
    "isVerified": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
  ```

### 2.3. Lấy danh sách toàn bộ User
- **URL**: `/`
- **Method**: `GET`
- **Quyền truy cập**: Quyền **ADMIN** (`hasRole('ADMIN')`)
- **Query Parameters**:
  - `pageNo` (int): Trang hiện tại (Mặc định: 1)
  - `pageSize` (int): Kích thước trang (Mặc định: 20)
  - `sort` (string): Trường sắp xếp (Mặc định: "id,asc")
  - `keyword` (string): Chuỗi tìm kiếm (Mặc định: rỗng)
- **Response Data** (`PageResponse<UserResponse>`):
  ```json
  {
    "pageNo": 1,
    "pageSize": 20,
    "totalElements": 50,
    "totalPages": 3,
    "data": [ { /* UserResponse */ }, ... ]
  }
  ```

### 2.4. Cập nhật thông tin cơ bản
- **URL**: `/`
- **Method**: `PUT`
- **Quyền truy cập**: User đã đăng nhập
- **Request Body** (`UserUpdateRequest` - JSON):
  ```json
  {
    "fullName": "Nguyen Van B",   // Bắt buộc, 2-50 ký tự
    "ankiDeckName": "Deck English" // Bắt buộc, 2-20 ký tự
  }
  ```
- **Response Data** (`UserResponse`): Thông tin User sau khi cập nhật.

### 2.5. Kích hoạt / Vô hiệu hóa tài khoản
- **URL**: `/toggle-active-account/{id}`
- **Method**: `GET`
- **Quyền truy cập**: Quyền **ADMIN** (`hasRole('ADMIN')`)
- **Path Parameters**: `id` (String - UUID của user)
- **Response Data**: Trả về `message` thành công.

### 2.6. Xóa tài khoản cá nhân
- **URL**: `/`
- **Method**: `DELETE`
- **Quyền truy cập**: User đã đăng nhập
- **Request Body**: Không
- **Response Data**: Trả về `message` báo xóa thành công.

### 2.7. Yêu cầu mã OTP đổi mật khẩu
- **URL**: `/change-password-otp`
- **Method**: `POST`
- **Quyền truy cập**: User đã đăng nhập
- **Request Body**: Không
- **Response Data**: Trả về `message` báo đã gửi OTP.

### 2.8. Đổi mật khẩu
- **URL**: `/change-password`
- **Method**: `POST`
- **Quyền truy cập**: User đã đăng nhập
- **Request Body** (`ChangePasswordRequest` - JSON):
  ```json
  {
    "oldPassword": "password123",    // Bắt buộc, tối thiểu 8 ký tự
    "newPassword": "newpassword123", // Bắt buộc, tối thiểu 8 ký tự
    "otpCode": "123456"              // Bắt buộc
  }
  ```
- **Response Data**: Trả về `message` báo đổi mật khẩu thành công.
