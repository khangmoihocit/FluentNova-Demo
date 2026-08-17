name: reactjs-theme-system
description: Multi-theme architecture (Basic, Dark, Solar) using CSS custom properties and React Context

# VocabFlow Theme System Skill
You are an expert in modern CSS architecture and React state management. 
Your job is to apply and extend the VocabFlow theme system across the entire application, ensuring every new page or component respects the active theme (Basic, Dark, or Solar).

## 1) Core Architecture
- **Theme Definition**: Themes are defined via CSS Custom Properties (CSS variables) in the `src/styles/themes/` directory.
- **Activation**: Themes are toggled by setting the `data-theme` attribute on the `<html>` element (e.g., `<html data-theme="solar">`).
- **SCSS Bridge**: All SCSS files MUST use the aliases defined in `src/styles/abstract/_variables.scss` (e.g., `$color-bg`) which point to the dynamic CSS variables (`var(--color-bg)`).
- **React Management**: Use the `useTheme()` hook from `src/features/theme/context/ThemeContext.jsx` to access or change the active theme.

## 2) The Three Pillars (Themes)

### Basic (Default - Study Focused)
- **Vibe**: Clean, minimal, high-contrast, distraction-free.
- **Palette**: Neutral whites and grays with black/near-black deep accents.
- **Usage**: Standard dashboard and notebook views.

### Dark (Low-Light - Eye Friendly)
- **Vibe**: Immersive, technology-forward, late-night friendly.
- **Palette**: Deep charcoal surfaces with amber (#ffb86c) highlights and blue secondary accents for AI.
- **Usage**: Night-time study sessions.

### Solar (Premium - "The Radiant Kinetic")
- **Vibe**: High-end editorial, warm, organic, alive.
- **Palette**: Warm beige/cream surfaces (#fff8f2) with rich burnt-orange primary accents (#9b4500).
- **Rules**:
  - **No 1px Borders**: Define edges using background color shifts (e.g., `surface-container-low` on `surface`).
  - **Typography**: Dual-typeface (Manrope for headlines, Inter for body).
  - **Shadows**: Use "Solar Shadow" (tinted with primary color, not gray).

## 3) Implementation Rules for Pages/Components

### Styling Guidelines
1. **NEVER use hardcoded hex codes** (e.g., #FFFFFF). Always use SCSS variables like `$color-bg`, `$color-surface`, etc.
2. **Handle Typography**:
   - For Headlines: Ensure `font-family: var(--font-headline);`.
   - For Body: Ensure `font-family: var(--font-body);`.
3. **Layering vs. Borders**:
   - Instead of `border: 1px solid #ddd;`, use:
     ```scss
     background-color: $color-surface-container-low;
     // or
     background-color: $color-surface-container-highest;
     ```
4. **AI/Tech Features**: Use `$color-secondary` (Blue) exclusively for AI feedback, voice waves, or shadowing results.

### Component Logic
- **Theme Toggles**: Always use the ☀️, 🌙, 🔥 icons/emojis sequence when providing a theme switcher.
- **Persistence**: Trust `ThemeContext` to handle `localStorage`. Do not write custom persistence logic in local components.

## 4) Forbidden Patterns
- No `!important` to override theme variables.
- No gray shadows in the Solar theme.
- No 1px solid dividers (use whitespace or color blocks).
- No mixing Manrope into body text or Inter into display headlines (unless specified).

## 5) Output Expectations
When creating or refactoring a page:
- Apply dynamic background color: `background-color: $color-bg;`.
- Apply dynamic text color: `color: $color-text;`.
- Use the correct radius variables: `$radius-md`, `$radius-lg`, etc.
- Ensure the layout "breathes" (generous spacing per DESIGN.md).
