---
name: reactjs-feature-structure
description: Architecture system implementing a modular, isolated feature-oriented mapping algorithm over standard types-directory bindings.
---

# Skill: reactjs-feature-structure

## Purpose
Provides a convention for grouping complex React modules by domain/feature instead of purely by external file type (`/pages`, `/services`, etc). This structural "vibe coding" philosophy dramatically improves multi-file maintainability, code searchability, and isolation of business rules as an application scales.

## Core Rules
Traditionally, a React app uses pure type-based directories (e.g., all APIs in `/services`, all global models in `/models`, all components in `/components`). 
When a robust feature grows complex (like the Notebook feature containing grids, multiple Modals, table hooks, and nested APIs), this basic structure tangles global code and makes it difficult to reason about the isolated bounds of a feature domain.

**Use Feature-Driven Structure:**
Instead, cluster related units of a domain/feature exclusively within a designated `/features/{featureName}/` component zone.

### Strict Feature Folder Architecture
A feature folder follows its own enclosed mini-architecture:

```
src/features/{featureName}/
  ├── api/             # All robust private service API bindings explicitly mapping domains for this feature
  ├── components/      # UI components tightly coupled/exclusive to this feature layer (e.g., Grid Modals)
  ├── pages/           # High-level route container components (Page level UI bindings)
  ├── hooks/           # (Optional) Custom hooks handling logic specific to the module feature
  ├── utils/           # (Optional) Domain-specific utilities
  └── index.js         # (Optional) Public API exports for exposing pages to the top-level Router gracefully
```

### When to use Feature Architecture?
- When a domain (e.g., `notebook`, `auth`, `practice`) expands to involve 2+ sub-components, standalone API service wrappers, and structurally bounded states.
- To permanently prevent standard `/components` or `/pages` global folders from degrading into a massive unreadable directory.

### Structural Boundaries (CRITICAL)
1. **Internally Reference Relatively**: A file deep inside `features/notebook/components` MUST import its associated local API routing via `../api/my.api.js` rather than relying on external cross-domain global configurations.
2. **Accessing common global utilities**: To import universally scoped utilities, overarching security authentication mapping, or globally shared buttons, reach *outward* selectively into `/src/utils` or `/src/services/api/privateApi`.
3. **Never allow cross-feature tangling**: `features/notebook` should NEVER structurally straight-import a component natively built inside `features/practice/components`. Module clusters only communicate upwards through global Router navigation state or unified context providers.
