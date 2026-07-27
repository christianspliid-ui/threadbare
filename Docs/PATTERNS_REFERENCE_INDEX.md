# Implementation Patterns Reference Index

Quick navigation guide for code patterns extracted from The Fantasy World Simulator.

---

## Documents in This Collection

1. **IMPLEMENTATION_PATTERNS.md** (1,291 lines)
   - Comprehensive reference with full code examples
   - 11 major sections covering all implementation areas
   - Source code excerpts from working files
   - Detailed inline comments explaining each pattern

2. **TOOLTIP_CHECKLIST.md** (200+ lines)
   - Task checklist for implementing a new component
   - Ready-to-use test template
   - References to IMPLEMENTATION_PATTERNS sections
   - Integration & documentation guidelines

---

## Pattern Categories Quick Links

### Components
- **Section 1.1:** Shared Component Pattern (ProgressBar example)
- **Section 1.2:** Icon Component Pattern (SphereIcon example)
- **Section 5.1:** Simple HUD Component (DoomBar example)
- **Section 5.2:** Complex HUD with State (AvatarHUD example)
- **Section 5.3:** HUD with Internal State (MandateTracker example)
- **Section 6.1:** Agent List Rendering (RetinuePanel example)

### Data & Content
- **Section 2.1:** Simple Content Export (Doom Content)
- **Section 2.2:** Economy Constants (Influence Content)
- **Section 4.1:** Asset Maps (Hex Tile Assets)
- **Section 9.1:** Graph Node Structure (World Model)

### Engine & Logic
- **Section 3.1:** Resolver/Aggregator Pattern (Agent Detail)
- **Section 7.1:** SVG Rendering (Hex Tile Component)
- **Section 8.1:** Narrative Context Types

### Testing
- **Section 10.1:** Component Unit Test Pattern
- **Section 10.2:** Component Test with Mocks
- **Testing Framework Reference:** vitest, @testing-library/react, jest-dom

### Styling
- **Threadbare Theme:** Dark backgrounds, Cinzel serif, amber/gold accents
- **Dynamic Styles:** useMemo for computed styles
- **Transitions:** duration-500 ease-out patterns

---

## File References by Source

### Components (src/components/)

**Shared Components:**
- `shared/ProgressBar.tsx` — Simple progress bar with glow effect (Section 1.1)
- `shared/SphereIcon.tsx` — Icon with color lookup (Section 1.2)
- `shared/__tests__/ProgressBar.test.tsx` — Component unit tests (Section 10.1)
- `shared/__tests__/SphereIcon.test.tsx` — Icon tests (Section 10.2)

**Game Components:**
- `Game/DoomBar.tsx` — Simple HUD with definition + state props (Section 5.1)
- `Game/DoomBar.test.tsx` — HUD test with mocks (Section 10.2)
- `Game/AvatarHUD.tsx` — Complex HUD with style constants (Section 5.2)
- `Game/MandateTracker.tsx` — HUD with internal state + popover (Section 5.3)
- `Game/RetinuePanel.tsx` — Agent list rendering (Section 6.1)

**Hex Map Components:**
- `HexMap/HexTile.tsx` — SVG hex rendering with visibility (Section 7.1)

### Data (src/data/)

- `doom-content.ts` — Simple content export (Section 2.1)
- `influence-content.ts` — Economy constants (Section 2.2)
- `hex-tile-assets.ts` — Asset maps with getters (Section 4.1)
- `world-model.json` — Graph nodes (Section 9.1)

### Engine (src/engine/)

- `agentDetail.ts` — Resolver/aggregator pattern (Section 3.1)

### Types (src/types/)

- `narrative.ts` — Prose context types (Section 8.1)

---

## Quick Implementation Path

If you're building a new component or feature:

1. **Start here:**
   - Read IMPLEMENTATION_PATTERNS.md Section 1 (Component patterns)
   - Look at src/components/shared/ProgressBar.tsx

2. **For HUD components:**
   - Read Section 5.1 (simple) or 5.3 (with state)
   - Copy style constants pattern from Section 5.2
   - Use useEffect pattern from Section 5.3 for keyboard handling

3. **For content/data:**
   - Read Section 2 (content packages)
   - Copy structure from src/data/influence-content.ts
   - Add lookup functions (Section 4.1 pattern)

4. **For testing:**
   - Use TOOLTIP_CHECKLIST.md as template
   - Reference Section 10 for assertion patterns
   - Copy beforeEach/afterEach from example tests

5. **For styling:**
   - Import color constants from src/data/uiColorPalette
   - Follow Threadbare section patterns
   - Use module-level style constants (Section 5.2)

---

## Code Snippet Index

### Props Interface with JSDoc
```
IMPLEMENTATION_PATTERNS.md Section 1.1, lines 13-29
```

### React.memo Wrapper
```
IMPLEMENTATION_PATTERNS.md Section 1.1, lines 31-40
```

### Style Constants
```
IMPLEMENTATION_PATTERNS.md Section 5.2, lines 14-27
```

### useMemo for Dynamic Styles
```
IMPLEMENTATION_PATTERNS.md Section 5.2, lines 92-101
```

### useState + useEffect for Keyboard
```
IMPLEMENTATION_PATTERNS.md Section 5.3, lines 49-71
```

### Backdrop Pattern
```
IMPLEMENTATION_PATTERNS.md Section 5.3, lines 171-177
```

### Test Structure with Mocks
```
IMPLEMENTATION_PATTERNS.md Section 10.2, lines 7-54
```

### Asset Map Pattern
```
IMPLEMENTATION_PATTERNS.md Section 4.1, lines 1-36
```

### Aggregator Function
```
IMPLEMENTATION_PATTERNS.md Section 3.1, lines 65-170
```

---

## Testing Framework Reference

**Framework:** vitest with @testing-library/react and jest-dom

**Environment:** jsdom (browser-like DOM in Node)

**Commands:**
```bash
npm test          # Run tests once
npm run test:watch # Run tests in watch mode
```

**Test File Pattern:**
```
src/components/<category>/__tests__/<ComponentName>.test.tsx
```

**Required Header:**
```typescript
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
```

**Common Assertions:**
```
.toHaveStyle()
.toHaveClass()
.toBeInTheDocument()
.toContain()
.toMatch()
```

---

## Threadbare Visual Style Reference

**Color Palette:**
- Dark background: `#1e1b2e`, `#0a0a0e` (12% brightness)
- Accent (gold): `#fbbf24`, `#eab308` (amber-200, amber-300)
- Text: `#fef3c7`, `#fbbf24` (amber-100, amber-400)
- Borders: `rgba(217, 119, 6, 0.2)` (amber/600 with low opacity)
- Glow: `0 0 8px #color{80}` (color with 50% opacity)

**Typography:**
- Headers/buttons: Cinzel (serif)
- Body: system default
- Sizes: text-xs, text-sm, text-base

**Spacing:**
- Gap: 0.5rem, 1rem
- Padding: 0.5rem, 0.75rem, 1rem
- Borders: 1px, 1.5px
- Radius: 0.25rem, 0.375rem

**Effects:**
- Transitions: transition-all duration-500 ease-out
- Opacity layers: /30, /60, /80, /90
- Hover states: bg-opacity increase + text-color shift
- Active states: darker opacity + slight scale

---

## Common Patterns by Task

### "I need to add a hover tooltip"
→ See Section 1.2 (SphereIcon with title), Section 5.3 (MandateTracker popover)

### "I need to render an agent list"
→ See Section 6.1 (RetinuePanel with map + selection)

### "I need to implement a progress bar"
→ See Section 1.1 (ProgressBar with glow)

### "I need state-dependent UI"
→ See Section 5.3 (MandateTracker with useState + conditional render)

### "I need to lookup asset URLs"
→ See Section 4.1 (Hex tile assets with Record<> maps)

### "I need to aggregate game data for display"
→ See Section 3.1 (Agent detail resolver with multi-stage processing)

### "I need to add tests"
→ See Section 10 (test patterns + example templates)

### "I need SVG rendering"
→ See Section 7.1 (Hex tile with clipPath + visibility states)

---

## File Sizes

- IMPLEMENTATION_PATTERNS.md: 40 KB (1,291 lines)
- TOOLTIP_CHECKLIST.md: 7.2 KB (200+ lines)
- This index: ~3 KB (150+ lines)

**Total reference material: ~50 KB, 1,600+ lines of patterns, code, and guidance**

---

## Next Steps

1. **For new feature planning:** Use TOOLTIP_CHECKLIST.md as a template
2. **For code review:** Reference IMPLEMENTATION_PATTERNS.md sections
3. **For debugging:** Check pattern sections for common mistakes
4. **For onboarding:** Start with Section 1 (components) then follow quick path above

---

*Last updated: 2026-03-08*
*Source: Working production codebase*
*Codebase: The Fantasy World Simulator (React + TypeScript + Vite)*
