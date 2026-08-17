---
name: reactjs-component-refactoring
description: Architectural principles for refactoring monolithic React components into modular, testable, and maintainable file structures.
---

# Skill: reactjs-component-refactoring

## Purpose
Defines a repeatable pattern for decomposing large, tangled React components into cleanly separated modules. Applies the **Single Responsibility Principle** at the file level to dramatically improve readability, testability, and long-term maintainability.

## When to Apply
- A component file exceeds **~200 lines** AND mixes two or more of the following concerns:
  1. Pure utility/algorithmic functions (no React)
  2. Complex browser API orchestration (MediaRecorder, SpeechRecognition, IntersectionObserver, WebSocket, etc.)
  3. Keyboard/mouse event listener management
  4. UI rendering (JSX)
- Multiple developers need to work on the same feature concurrently.
- Unit testing a utility or hook is blocked because it's embedded inside JSX.

## Core Extraction Layers

### Layer 1 — `utils/` (Pure Functions)
**What goes here**: Any function that takes inputs, returns outputs, and has **zero** React or browser-API side effects.

**Examples**: text normalization, scoring algorithms, data transformations, formatters, validators, color mappers.

**Rules**:
- No `useState`, `useEffect`, `useRef`, or any React imports.
- No `window`, `navigator`, `document` access.
- Every function is independently unit-testable with plain `expect()`.
- Export named functions (not default). One logical domain per file.

```
features/{feature}/utils/scoring.js    → normalizeText, levenshtein, computeScore
features/{feature}/utils/formatters.js → formatDuration, formatDate
```

### Layer 2 — `hooks/` (Stateful Logic & Browser APIs)
**What goes here**: Any complex **stateful logic** or **browser API orchestration** that doesn't render JSX.

**Examples**: MediaRecorder + SpeechRecognition, WebSocket connections, IntersectionObserver, localStorage sync, complex form state machines, keyboard shortcut managers.

**Rules**:
- One hook per file. Name the file after the hook: `useSpeechShadowing.js`.
- A hook receives **minimal params** from the component (IDs, refs, current indices).
- A hook returns a clean **API surface**: `{ state, actions }`.
- Hooks import utilities from `../utils/` — never redefine pure logic inline.
- Hooks manage their own cleanup (`useEffect` return).
- Document the purpose, params, and return shape in a JSDoc block.

```
features/{feature}/hooks/useSpeechShadowing.js  → { isRecording, toggleRecording, ... }
features/{feature}/hooks/useShortcuts.js        → (void) — side-effect only
```

### Layer 3 — `components/` (UI Orchestration)
**What goes here**: The React component that consumes hooks, composes JSX, and handles user interactions.

**Rules**:
- **No** inline algorithm logic (scoring, distance, parsing).
- **No** raw browser API calls (`getUserMedia`, `SpeechRecognition`).
- **No** `addEventListener`/`removeEventListener` — use a hook.
- **Allowed**: local UI state (`useState` for open/close, index, etc.), `useCallback` for event handlers that call hook methods, and `useEffect` for video playback guards (component-specific coordination).
- Small stateless sub-components (like a shortcut tooltip popup < 40 lines) may remain in the same file.
- The component should read like a **blueprint**: clear structure of what the UI renders, not how data is processed.

### Target Component Size
After extraction, the main component should be **~100–250 lines**. If it's still over 300 lines, consider:
- Splitting the JSX into sub-components (e.g., `<ActionBar>`, `<TextZone>`).
- Further decomposing hooks (e.g., separate `useMediaRecorder` from `useSpeechRecognition`).

## File Naming Conventions
| Layer       | Pattern                       | Example                          |
|-------------|-------------------------------|----------------------------------|
| Utility     | `{domain}.js`                 | `scoring.js`, `formatters.js`    |
| Hook        | `use{PascalCaseName}.js`      | `useSpeechShadowing.js`          |
| Component   | `{PascalCaseName}.jsx`        | `ShadowingPanel.jsx`             |

## Import Direction (Dependency DAG)
```
components/ → hooks/ → utils/
     ↓           ↓
  (styles)    (antd/3rd-party)
```
- Components import hooks and utils.
- Hooks import utils.
- Utils import nothing from the feature (pure, leaf-level).
- **Never** import a component inside a hook or utility.

## Checklist for Refactoring
1. [ ] Identify all pure functions → move to `utils/{domain}.js`
2. [ ] Identify browser API / complex state logic → extract to `hooks/use{Name}.js`
3. [ ] Identify event listener `useEffect` blocks → extract to `hooks/useShortcuts.js` or similar
4. [ ] Rewrite the component to import and consume hooks
5. [ ] Verify no circular imports exist
6. [ ] Run `npm run build` to ensure all imports resolve
7. [ ] Confirm the UI behavior is identical (no regressions)
