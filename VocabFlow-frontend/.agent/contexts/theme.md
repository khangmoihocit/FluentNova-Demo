# Walkthrough: Theme System & Landing Page

## What Was Built

### 1. Multi-Theme Infrastructure (CSS Custom Properties)
Three theme files define CSS custom properties on `data-theme` attribute:

| Theme | File | Aesthetic |
|-------|------|-----------|
| **Basic** | [_basic.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/themes/_basic.scss) | Clean white/gray, Inter font, study-friendly |
| **Dark** | [_dark.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/themes/_dark.scss) | Deep grays, amber primary, blue secondary |
| **Solar** | [_solar.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/themes/_solar.scss) | Warm `#fff8f2` bg, `#9b4500` orange primary, Manrope+Inter fonts |

### 2. ThemeContext
[ThemeContext.jsx](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/features/theme/context/ThemeContext.jsx) — Provides [useTheme()](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/features/theme/context/ThemeContext.jsx#56-61) hook with:
- `theme` — current active theme string
- `setTheme(name)` — switch to a specific theme
- `toggleTheme()` — cycle: basic → dark → solar
- Persists to `localStorage`, injects `data-theme` on `<html>`

### 3. Landing Page (Vietnamese)
[LandingPage.jsx](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/features/landing/pages/LandingPage.jsx) at route `/intro`:
- Navbar with theme switcher (☀️🌙🔥)
- Hero section, Features bento grid, CTA, Footer
- All content translated to Vietnamese

---

## Verification Screenshots

### Solar Theme — Hero
![Solar theme hero section](landing_page_solar_hero_1776242797732.png)

### Solar Theme — Features Bento Grid
![Solar theme bento grid](landing_page_solar_bento_1776242799566.png)

### Basic Theme — Features Section
![Basic theme features](landing_page_scrolled_1_1776242761530.png)

### Theme Switching Demo
![Theme switching recording](landing_page_verification_1776242728215.webp)

---

## Files Changed

| Action | File |
|--------|------|
| NEW | [src/styles/themes/_basic.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/themes/_basic.scss) |
| NEW | [src/styles/themes/_dark.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/themes/_dark.scss) |
| NEW | [src/styles/themes/_solar.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/themes/_solar.scss) |
| MODIFIED | [src/styles/abstract/_variables.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/abstract/_variables.scss) — CSS custom property refs |
| MODIFIED | [src/styles/main.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/main.scss) — imports themes |
| MODIFIED | [src/styles/base/_global.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/styles/base/_global.scss) — uses CSS vars |
| NEW | [src/features/theme/context/ThemeContext.jsx](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/features/theme/context/ThemeContext.jsx) |
| NEW | [src/features/landing/pages/LandingPage.jsx](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/features/landing/pages/LandingPage.jsx) |
| NEW | [src/features/landing/styles/landing.module.scss](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/features/landing/styles/landing.module.scss) |
| NEW | [src/features/landing/index.js](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/features/landing/index.js) |
| MODIFIED | [src/main.jsx](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/main.jsx) — wrapped with [ThemeProvider](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/features/theme/context/ThemeContext.jsx#17-55) |
| MODIFIED | [src/App.jsx](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/src/App.jsx) — added `/intro` route |
| MODIFIED | [index.html](file:///d:/PROJECT_WEB/VocabFlow/VocabFlow-frontend/index.html) — Google Fonts, Material Symbols, `data-theme` default |
