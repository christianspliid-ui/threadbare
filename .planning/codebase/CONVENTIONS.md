# Coding Conventions

**Analysis Date:** 2026-03-30

## Naming Patterns

**Files:**
- React components: PascalCase, one component per file (e.g., `ActionCard.tsx`, `AgentDetailPanel.tsx`)
- Utilities and logic: camelCase (e.g., `actionCandidates.ts`, `worldgen.ts`)
- Test files: mirror source name with `__tests__/` directory and `.test.ts` or `.test.tsx` suffix (e.g., `src/components/Game/__tests__/ActionCard.test.tsx`)
- Data and content files: kebab-case (e.g., `action-template-content.ts`, `rival-content.ts`)

**Functions:**
- camelCase everywhere: `generateActionCandidates()`, `parseMapSizeParam()`, `runTempReassessPass()`
- Pure functions with clear side-effect-free names preferred
- Getter functions use `get` prefix: `getWheelSlotGlyph()`, `getAvatarHexPosition()`
- Phase/tick handler functions use `phase` prefix: `phaseMovement()`, `phaseUnifiedActionProgress()`
- Event handlers use `on` prefix: `onClick`, `onSlotClick`, `onClose`

**Variables:**
- camelCase: `mockSlots`, `containerClasses`, `baseSlot`
- Constants at module level: UPPERCASE_SNAKE_CASE only for truly global constants
- React hooks use `use` prefix: `useNotifications`, `useAvatarData`, `useState`, `useCallback`
- Local scoped constants in functions: camelCase (e.g., `const lakeId = 1`, `const tempBefore = 0.1`)

**Types:**
- Interfaces: PascalCase with `I` prefix avoided (just PascalCase) (e.g., `WheelSlot`, `ActionCandidate`, `GameState`)
- Type aliases: PascalCase (e.g., `ValuePair`, `GamePhase`)
- Enums: PascalCase with singular names (e.g., `SphereName`)
- Generic types: PascalCase single letters or descriptive (e.g., `T`, `WorldGraph`)

## Code Style

**Formatting:**
- No Prettier config — ESLint governs formatting via flat config (`eslint.config.js`)
- Indentation: 2 spaces (inferred from existing code)
- Line length: no hard limit enforced, but readable wrapping observed around 80-100 characters in comments/documentation
- Imports: use explicit `type` imports for TypeScript types to enable tree-shaking

**Linting:**
- ESLint 9.39.1 with flat config in `eslint.config.js`
- Extends: `js.configs.recommended`, `tseslint.configs.recommended`, `reactHooks.configs.flat.recommended`, `reactRefresh.configs.vite`
- Key rules enabled:
  - TypeScript: strict type checking, no implicit `any`
  - React: hooks rules of hooks enforced by `react-hooks/rules-of-hooks`
  - React Refresh: components must be default exports or use `useCallback` with dependency arrays
  - No unused locals or parameters (TypeScript compiler level: `noUnusedLocals: true`, `noUnusedParameters: true`)

## Import Organization

**Order:**
1. React and external libraries: `import React`, `import { useState }`, etc.
2. Type imports from external libraries: `import type { ... } from '@types/...'`
3. Internal types: `import type { WheelSlot } from '../../engine/wheel'`
4. Internal modules/functions: `import { ActionCard } from '../ActionCard'`
5. Utilities and helpers: `import { getWheelSlotGlyph } from '../../data/sphereIcons'`
6. Data constants: `import { ACTION_TEMPLATES } from '../data/action-template-content'`
7. Styles (if separate files exist): `import './ActionCard.css'` (not observed in this codebase — styles inline)

**Path Aliases:**
- No path aliases configured in `tsconfig.app.json` — all imports use relative paths with `../` and `../../`
- Pattern: `src/components/` uses `../../` to reach `src/types/`, `src/engine/`, `src/data/`
- Test files use relative paths within their package directory

## Error Handling

**Patterns:**
- **Fail-soft default:** Errors logged to console (via `console.warn()` or `console.error()`) but do NOT throw exceptions
  - Example: `src/engine/encounterEventNode.ts` catches errors in node creation and logs with prefix like `[EncounterEventNode]`
  - Example: `src/engine/graphOpExecutor.ts` skips invalid numeric changes with `console.warn()` and continues
- **Return fallback values on error:** null, empty arrays, or sensible defaults rather than undefined
  - Example: `generateActionCandidates()` returns `[]` if actor or location node missing
  - Example: `getAnyEncounterById()` returns undefined if encounter not found (graceful)
- **No early exits via exceptions:** Tick loop in orchestrator catches any thrown error and logs it, returning previous state to maintain game loop stability
  - See `src/engine/orchestrator.ts` line 1355: `catch (err) { console.error('[Orchestrator] Tick crashed, returning previous state:', err); return state; }`

## Logging

**Framework:** `console` object only (no external logging library)

**Patterns:**
- Use `console.warn()` for recoverable errors and skipped operations
- Use `console.error()` for critical failures (e.g., tick crash)
- Always prefix messages with scope in square brackets: `[ModuleName]` or `[PhaseName]`
  - Examples: `[EncounterEventNode]`, `[graphOpExecutor]`, `[Orchestrator]`, `[revelationEmitter]`
- One-line logs with context, not multi-line dumps (exceptions: stack traces on critical errors)

## Comments

**When to Comment:**
- Complex algorithms or derivations: explain the "why" (see math comments in `actionCandidates.ts` lines 43-50 explaining filter logic)
- Non-obvious business logic: note the rule or constraint being enforced
- Temporary workarounds: mark with `// FIXME` or `// TODO` with context (scan codebase shows some present, e.g., `src/debug-bridge.ts`)
- Intent-clarifying comments: use sparingly; good code is self-documenting

**JSDoc/TSDoc:**
- Function-level JSDoc used for public API functions in engine modules
  - Example: `src/engine/actionCandidates.ts` has multi-line JSDoc on `generateActionCandidates()`
  - Format: `/** multi-line description with steps/details */`
- Inline type comments acceptable (e.g., `// 100px wide × 140px tall (5:7)`)
- No Markdown in JSDoc blocks observed (plain text)

## Function Design

**Size:**
- Prefer small, focused functions (under 50 lines typical)
- Phase functions in orchestrator are longer (100+ lines) but are logically cohesive pipelines
- Pure functions preferred: same inputs → same outputs, no hidden state

**Parameters:**
- Destructure object parameters where beneficial (e.g., `{ graph, actorId, locationId }`)
- Avoid parameter lists over 4-5 items; use objects if more needed
- React components use `Props` interface (e.g., `interface ActionCardProps { slot: WheelSlot; onClick: ... }`)

**Return Values:**
- Explicit return type annotations on exported functions
- Return type inference used for internal helpers
- Async functions return `Promise<T>` with explicit T type

## Module Design

**Exports:**
- Named exports for utilities and data: `export function generateActionCandidates() { ... }`
- Default exports for React components: `export default function ActionCard() { ... }` or `export const ActionCard = React.memo(...)`
- Type-only exports use `export type`: `export type ActionCandidate = { ... }`
- Data constants exported as named exports: `export const ACTION_TEMPLATES: ActionTemplateData[] = [...]`

**Barrel Files:**
- Minimal barrel files observed; most directories export from individual modules
- Example: `src/components/Game/chronicle/__tests__/cards.test.tsx` imports directly from parent, not via index

## Module Organization

**Engine logic layers:**
- **Pure logic (pure functions):** `src/engine/*.ts` files like `actionCandidates.ts`, `influence.ts`, `visibility.ts`
- **Graph operations:** `src/engine/graph.ts` with node/edge CRUD and schema validation
- **Orchestrator:** `src/engine/orchestrator.ts` coordinates all phases
- **Types:** `src/types/*.ts` contain domain types (agent, gameState, trace, etc.)

**Component patterns:**
- Components live in `src/components/` with subdirectories per feature area
- Hooks live co-located: `src/components/Game/hooks/useNotifications.ts`
- Shared UI primitives: `src/components/shared/` (e.g., `Tooltip`, `Button`)
- Data/content constants: `src/data/` (e.g., `action-template-content.ts`, `sphereIcons.ts`)

---

*Convention analysis: 2026-03-30*
