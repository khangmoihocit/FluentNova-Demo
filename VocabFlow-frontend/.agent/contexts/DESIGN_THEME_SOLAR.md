```markdown
# Design System Specification: The Radiant Kinetic

This document outlines the visual and structural language for a premium language learning experience. This system moves away from the "standard app" aesthetic, instead embracing a high-end editorial feel that combines warmth with futuristic technological precision.

---

## 1. Creative North Star: "The Solar Pulse"
The Creative North Star for this system is **The Solar Pulse**. This concept represents the steady, rhythmic energy of growth. We avoid static, rigid layouts in favor of an "active" UI—one that feels alive through organic depth and intentional asymmetry.

To break the "template" look:
*   **Intentional Asymmetry:** Use the `xl` (3rem) corner radius on primary hero cards, while using `md` (1.5rem) for supporting elements to create a rhythmic visual hierarchy.
*   **Overlapping Elements:** Content should "break the box." Profile avatars or progress indicators should partially overlap container boundaries to create a sense of three-dimensional space.
*   **High-Contrast Scale:** We use a dramatic jump between `display-lg` for inspiration and `body-md` for instruction, creating an authoritative, editorial cadence.

---

## 2. Color & Surface Architecture

Our palette is rooted in warmth but elevated through "Atmospheric Layering."

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning. Boundaries must be defined solely through:
1.  **Background Color Shifts:** Placing a `surface-container-low` component on a `surface` background.
2.  **Tonal Transitions:** Using the hierarchy of `surface-container` tiers to define edges.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine, warm-toned paper. 
*   **Base:** `surface` (#fff8f2)
*   **Sub-sections:** `surface-container-low` (#fef2df)
*   **Actionable Cards:** `surface-container-highest` (#ede1cf) or `surface-container-lowest` (#ffffff) to provide a "pop" against the background.

### The "Glass & Gradient" Rule
To signify "Intelligence" (AI and tech features), use **Glassmorphism**. Apply `secondary-container` at 40% opacity with a `backdrop-filter: blur(20px)`. 

**Signature Texture:** Use a subtle linear gradient from `primary` (#9b4500) to `primary-container` (#ff8c42) at 135 degrees for hero CTAs. This creates a "glow" effect rather than a flat, plastic look.

---

## 3. Typography: Editorial Authority

We use a dual-typeface system to balance human warmth with modern clarity.

*   **Display & Headline (Manrope):** The "Voice." Use Manrope for all large headers to convey a futuristic, geometric confidence. The `display-lg` (3.5rem) should be used sparingly to celebrate major milestones.
*   **Body & Labels (Inter):** The "Instructor." Inter provides maximum legibility for learning content. Use `body-lg` (1rem) for lesson text to ensure a premium, readable experience that doesn't feel cramped.

**Hierarchy Note:** Always maintain a minimum 24px vertical gap between a `headline-md` and `body-md` to let the typography "breathe" like a high-end magazine.

---

## 4. Elevation & Depth: Tonal Layering

We do not use structural lines. We use physics.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card sitting on a `surface-container-low` section creates a soft, natural lift that mimics natural paper-on-table physics.
*   **Ambient Shadows:** For floating elements (like Modals or FABs), use a custom "Solar Shadow":
    *   `box-shadow: 0px 24px 48px rgba(155, 69, 0, 0.08);`
    *   Note the use of the `primary` color (#9b4500) at 8% opacity instead of grey. This keeps the shadow "warm" and integrated.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` (#ddc1b3) at **15% opacity**. It should be felt, not seen.

---

## 5. Signature Components

### Buttons: The Pulse Points
*   **Primary:** Gradient of `primary` to `primary-container`. `9999px` (full) roundedness. No border. High-diffuse solar shadow on hover.
*   **Secondary (AI/Tech):** `secondary-container` background with `on-secondary-container` text. Used for "Smart Review" or "AI Chat."
*   **Tertiary:** No background. `primary` text weight 600. 

### Learning Cards
*   **Rule:** Forbid the use of divider lines within cards.
*   **Structure:** Use `surface-container-highest` for the card body. Use `surface-container-lowest` for an internal "Answer Area" to create a nested depth effect.
*   **Spacing:** Use a strict 32px (`xl` scale) internal padding for all learning cards to maintain an "expensive" feel.

### Progress Orbs (Custom Component)
Instead of flat bars, use concentric rings using `primary` and `secondary` (blue) to show the intersection of "Growth" and "Technology."

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `secondary` (Blue) exclusively for AI-driven features or "Technological" feedback (e.g., voice recognition waves).
*   **Do** use asymmetrical layouts (e.g., a 60/40 split grid) to create visual interest in dashboard views.
*   **Do** apply `lg` (2rem) or `xl` (3rem) corner radius to large containers to emphasize the "friendly/modern" brand pillars.

### Don't:
*   **Don't** use black (#000000) for text. Always use `on-surface` (#201b10) to maintain the warm, organic tonal range.
*   **Don't** use standard "Material Design" shadows. If a shadow looks grey or "dirty," it is incorrect.
*   **Don't** use 1px dividers to separate list items. Use 12px of vertical white space and a subtle background shift on hover instead.
*   **Don't** use sharp 0px corners. Every element in the system must have a minimum of `sm` (0.5rem) rounding to remain "inviting."

---

## 7. Spacing Scale
Maintain a "Generous" spatial rhythm to reduce cognitive load for learners.
*   **Standard Gap:** 1.5rem (`md`)
*   **Section Margin:** 3rem (`xl`)
*   **Component Internal Padding:** 1rem (`DEFAULT`) or 1.5rem (`md`)```