# Skill: reactjs-i18n

## Purpose
Provide a scalable internationalization (i18n) system for React applications using i18next and react-i18next.

This skill ensures:
- No hardcoded UI text
- Clean separation between content and UI
- Easy multi-language support (Vietnamese default)

---

## 1. Tech Stack

- i18next
- react-i18next
- Ant Design (locale integration)

---

## 2. Project Structure

src/i18n/
  index.js
  locales/
    vi/
      translation.json
    en/
      translation.json (optional)

---

## 3. i18n Initialization

Create:

src/i18n/index.js

Requirements:
- default language: "vi"
- fallback language: "vi"
- enable interpolation (no escaping)

---

## 4. Translation File Structure

Organize by feature/module:

{
  "common": {
    "login": "Đăng nhập",
    "register": "Đăng ký",
    "logout": "Đăng xuất",
    "email": "Email",
    "password": "Mật khẩu",
    "confirmPassword": "Xác nhận mật khẩu",
    "submit": "Xác nhận",
    "cancel": "Hủy"
  },
  "auth": {
    "loginTitle": "Đăng nhập vào hệ thống",
    "registerTitle": "Tạo tài khoản",
    "forgotPassword": "Quên mật khẩu?",
    "resetPassword": "Đặt lại mật khẩu",
    "otp": "Mã xác nhận",
    "verifyEmail": "Xác thực email"
  },
  "notebook": {
    "title": "Sổ tay từ vựng",
    "addWord": "Thêm từ",
    "syncAnki": "Đồng bộ Anki",
    "empty": "Chưa có từ vựng nào"
  }
}

---

## 5. Usage in Components

Use:

import { useTranslation } from 'react-i18next'

const { t } = useTranslation()

Replace ALL hardcoded text:

<Button>{t('common.login')}</Button>

---

## 6. Rules (STRICT)

- NEVER hardcode UI text
- ALWAYS use t('key')
- ALWAYS group keys by feature
- NEVER use meaningless keys like:
  - "text1", "labelA"

---

## 7. Ant Design Integration

Wrap app with:

ConfigProvider locale={vi_VN}

Import:
import vi_VN from 'antd/es/locale/vi_VN'

---

## 8. Form Validation

All validation messages must use i18n:

Example:
t('validation.required')
t('validation.invalidEmail')

---

## 9. Naming Convention

Format:

<feature>.<element>

Examples:
- common.login
- auth.forgotPassword
- notebook.empty

---

## 10. Extensibility

Must support:
- multiple languages (vi, en)
- dynamic language switching

Optional:
- language switcher UI

---

## 11. Do NOT

- Do NOT mix English and Vietnamese in UI
- Do NOT duplicate translation keys
- Do NOT store long paragraphs in components

---

## 12. Output Expectations

When this skill is used:
- All UI text must use i18n
- Translation files must be created
- No hardcoded strings remain