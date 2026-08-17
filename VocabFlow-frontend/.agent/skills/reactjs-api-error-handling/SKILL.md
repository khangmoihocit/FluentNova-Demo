---
name: reactjs-api-error-handling
description: Utility skill outlining how to globally parse, format, and display unified Backend Exception payload structures (AppException, Validations, Token filters) correctly in the UI.
---

# Skill: reactjs-api-error-handling

## Purpose
The VocabFlow Backend uses a `GlobalExceptionHandler` to enforce a strict standardized JSON structure for catching Logic Errors, Validations, and System Exception crashes. This skill defines exactly how the React Frontend must parse these `error.response.data` objects via Axios loops and present them to the user (e.g., via Ant Design messages, toasts, or mapping directly into form validation rules).

## Backend Error Topologies 

### 1. Standard Error Response
Used for Logic Errors (`AppException`), Invalid Credentials, Access Denied, Custom Errors, and System Exception (`RuntimeException`).
```json
{
  "success": false,
  "code": "USER_NOT_FOUND", // e.g. INVALID_CREDENTIALS, ACCESS_DENIED, UNCATEGORIZED_EXCEPTION
  "message": "User không tồn tại trong hệ thống",
  "data": null,
  "errors": null,
  "timestamp": "2024-03-24T12:00:00"
}
```

### 2. Validation Error Response (`MethodArgumentNotValidException`)
Always maps `code: "VALIDATION_ERROR"` and contains an `errors` object mapping keys to validation failure messages. 
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "errors": {
    "email": "Email không đúng định dạng",
    "password": "Mật khẩu phải từ 8 kí tự"
  }
}
```

### 3. Filter Token/Authentication Error
Crucial Exception thrown *before* reaching the standard Controller format. Uses a distinct fallback map struct provided by Spring Boot container configurations:
```json
{
  "timestamp": 1711281600000,
  "status": 401,
  "error": "Xác thực không thành công",
  "message": "Token đã hết hạn",
  "path": "/api/v1/user/me"
}
```

---

## Frontend Parsing Rules

Whenever catching an Axios error, parse it precisely respecting these 3 tiers.

### Rule 1: Extracting Global Messages (Toast/Message)
```javascript
export const extractErrorMessage = (error, fallback = 'Đã có lỗi xảy ra') => {
  if (!error.response || !error.response.data) {
    return 'Lỗi kết nối máy chủ / Không phản hồi';
  }
  
  const data = error.response.data;

  // 1. Identify raw Token Filter structure (Status + Error present without Standard Response 'code')
  if (data.status && data.error && !data.code) {
    return data.message || data.error;
  }
  
  // 2. Identify Validation Errors returning list. (Usually we bind to form, but if shown in toast, extract first error)
  if (data.code === 'VALIDATION_ERROR' && data.errors) {
    const firstKey = Object.keys(data.errors)[0];
    if (firstKey) return data.errors[firstKey];
  }
  
  // 3. Extract Standard Error message mapping
  if (data.message) {
    return data.message;
  }
  
  return fallback;
};

// Usage inside Catch block:
// catch(err) { message.error(extractErrorMessage(err, t('custom.fallback'))); }
```

### Rule 2: Mapping Validation to Ant Design Forms
When submitting a payload from a native input screen, explicitly catch and map `VALIDATION_ERROR` objects automatically backward into the `Ant Design Form` interface fields.

```javascript
catch (error) {
  const data = error?.response?.data;
  
  // Specifically intercept Validation Arrays
  if (data?.code === 'VALIDATION_ERROR' && data.errors && form) {
     const formFields = Object.entries(data.errors).map(([key, value]) => ({
        name: key,
        errors: [value],
     }));
     // Feed error strings dynamically onto form state
     form.setFields(formFields);
     message.error(data.message || 'Vui lòng kiểm tra lại dữ liệu nhập');
  } else {
     // Default string extraction fallback
     message.error(extractErrorMessage(error, t('auth.registerFailed')));
  }
}
```

### Rule 3: Do Not Guess Structures
- Never assume `error.message` natively attached to standard Javascript Errors is the API error payload. ALWAYS dig into `error.response.data`.
- If a structure fails perfectly mapping, ALWAYS fall back securely leveraging Javascript Optional Chaining `?.`. DO NOT crash the UI parsing `null.errors`.
