# Icon System Wiring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all Unicode sphere glyphs and reach text labels across the UI with the new SVG-based `SphereIcon` and `ReachIcon` components from `src/components/icons/`.

**Architecture:** Migrate consumers of the old `shared/SphereIcon` (Unicode glyph wrapper) and raw Unicode glyphs to the new SVG icon system. Consolidate the two SphereIcon implementations — the old `shared/SphereIcon` becomes a thin adapter delegating to `icons/SphereIcon`, preserving the `useImage` path for generated sphere images.

**Tech Stack:** React, SVG, TypeScript

**Spec:** `Docs/plans/2026-04-04-coat-of-arms-and-icon-system-design.md` — Section 5.2 (UI Components)

---

## Migration Strategy

Two SphereIcon components exist:
- **`src/components/shared/SphereIcon.tsx`** — old, renders Unicode glyphs via `getSphereSymbol()`, also supports `useImage` for generated PNGs. Used by EssencePanel, AscendantSheet, IdentityChip.
- **`src/components/icons/SphereIcon.tsx`** — new, renders procedural SVG geometric symbols.

**Approach:** Rewrite `shared/SphereIcon` to delegate to `icons/SphereIcon` for the default path, preserving the `useImage` prop for backward compat. This way all existing consumers automatically get the new SVG icons without changing their imports.

---

### Task 1: Consolidate SphereIcon — Shared Delegates to Icons

**Files:**
- Modify: `src/components/shared/SphereIcon.tsx`
- Test: `src/components/icons/__tests__/SphereIcon.test.tsx` (verify no regressions)

- [ ] **Step 1: Read current shared/SphereIcon.tsx**

Read the file to confirm exact interface. Current props:
```typescript
interface SphereIconProps {
  sphereName: string;
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
  monochrome?: boolean;
  title?: string;
  useImage?: boolean;
}
```

- [ ] **Step 2: Rewrite to delegate to icons/SphereIcon**

```typescript
// src/components/shared/SphereIcon.tsx
import React from 'react';
import { SphereIcon as SvgSphereIcon } from '../icons/SphereIcon';
import { getSphereImagePath } from '../../data/sphereIcons';
import { SPHERE_NAMES } from '../../types/index';

export interface SphereIconProps {
  sphereName: string;
  size?: string | number;
  className?: string;
  style?: React.CSSProperties;
  monochrome?: boolean;
  title?: string;
  useImage?: boolean;
}

const VALID_SPHERES = new Set<string>(SPHERE_NAMES);

export const SphereIcon = React.memo(function SphereIcon({
  sphereName,
  size = '1rem',
  className,
  style,
  title,
  useImage = false,
}: SphereIconProps) {
  // Image path — preserve existing behavior
  if (useImage) {
    const imagePath = getSphereImagePath(sphereName);
    if (imagePath) {
      const imgSize = typeof size === 'number' ? size : parseInt(size, 10) || 24;
      return (
        <img
          src={imagePath}
          alt={title || sphereName}
          className={className}
          width={imgSize}
          height={imgSize}
          style={{ display: 'inline-block', objectFit: 'contain', ...style }}
        />
      );
    }
  }

  // SVG icon — delegate to new system
  const pxSize = typeof size === 'number' ? size : parseInt(size, 10) || 16;

  if (VALID_SPHERES.has(sphereName)) {
    return (
      <SvgSphereIcon
        sphere={sphereName as any}
        size={pxSize}
        className={className}
      />
    );
  }

  // Unknown sphere fallback — gray circle
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: pxSize, color: '#888', lineHeight: 1, ...style }}
      title={title || sphereName}
    >●</span>
  );
});
```

- [ ] **Step 3: Verify existing consumers still work**

Run: `npx tsc --noEmit`
Expected: Clean — EssencePanel, AscendantSheet, IdentityChip still import from `shared/SphereIcon` with the same interface.

- [ ] **Step 4: Run icon tests**

Run: `npx vitest run src/components/icons/`
Expected: All 82 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/SphereIcon.tsx
git commit -m "refactor(icons): shared/SphereIcon now delegates to SVG icons/SphereIcon"
```

---

### Task 2: ActionCard — Replace Sphere Glyphs

**Files:**
- Modify: `src/components/Game/ActionCard.tsx`

- [ ] **Step 1: Read ActionCard.tsx**

Read the file to find all `getWheelSlotGlyph` usages and sphere glyph rendering locations (around lines 87, 218, 378, 406).

- [ ] **Step 2: Add SphereIcon import and replace glyphs**

Add import:
```typescript
import { SphereIcon } from '../icons';
```

Replace each `getWheelSlotGlyph(slot.id)` usage with a `<SphereIcon>` component. The `slot.id` maps to a sphere name — extract it and pass to `SphereIcon`.

For each rendering location:
- **Line ~218 (hand layout background glyph):** Replace Unicode text with `<SphereIcon sphere={sphereName} size={24} />`
- **Line ~378 (focused art placeholder):** Replace with `<SphereIcon sphere={sphereName} size={36} />`
- **Line ~406 (type line):** Replace with `<SphereIcon sphere={sphereName} size={14} />` inline

If the `slot.id` isn't directly a SphereName, find the mapping function (likely in `sphereIcons.ts` or the slot definition) and derive the sphere name.

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 4: Commit**

```bash
git add src/components/Game/ActionCard.tsx
git commit -m "feat(icons): replace Unicode glyphs with SphereIcon in ActionCard"
```

---

### Task 3: InterventionConfirm — Replace Hard-Coded Glyph

**Files:**
- Modify: `src/components/Game/InterventionConfirm.tsx`

- [ ] **Step 1: Read InterventionConfirm.tsx**

Find the hard-coded `✦` at line ~98 and the `getSphereColor(sphere)` usage.

- [ ] **Step 2: Replace with SphereIcon**

Add import:
```typescript
import { SphereIcon } from '../icons';
```

Replace the `✦` span with:
```typescript
<SphereIcon sphere={sphere} size={32} />
```

Remove the `getSphereColor` import if no longer needed (the SVG icon carries its own color).

- [ ] **Step 3: Type check and commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/Game/InterventionConfirm.tsx
git commit -m "feat(icons): replace hard-coded glyph with SphereIcon in InterventionConfirm"
```

---

### Task 4: DoomBar — Replace Archetype Glyphs

**Files:**
- Modify: `src/components/Game/DoomBar.tsx`

- [ ] **Step 1: Read DoomBar.tsx**

Find `DOOM_ARCHETYPE_GLYPHS` (lines 12-20) and the glyph rendering at line ~61.

- [ ] **Step 2: Map archetypes to spheres and replace**

The doom archetypes map to spheres conceptually. Read the archetype-to-glyph mapping to determine which sphere each maps to. Create a `DOOM_ARCHETYPE_SPHERE` mapping:

```typescript
import { SphereIcon } from '../icons';
import type { SphereName } from '../../types/index';

const DOOM_ARCHETYPE_SPHERE: Record<string, SphereName> = {
  // Map each archetype to its closest sphere based on the current glyph assignment
  // e.g., if archetype uses ✦ (force glyph) → 'force'
};
```

Replace the Unicode glyph rendering with `<SphereIcon>`. If an archetype doesn't map cleanly to a single sphere, keep the Unicode glyph as a fallback.

- [ ] **Step 3: Type check and commit**

```bash
git add src/components/Game/DoomBar.tsx
git commit -m "feat(icons): replace archetype glyphs with SphereIcon in DoomBar"
```

---

### Task 5: Domain Capability Bars — Add ReachIcon to AgentDetailPanel

**Files:**
- Modify: `src/components/Game/AgentDetailPanel.tsx`

- [ ] **Step 1: Read the domain grid section (lines ~195-228)**

Find where `DOMAIN_NAMES` is defined and how domain labels are rendered next to capability bars.

- [ ] **Step 2: Add ReachIcon inline before each domain label**

Add import:
```typescript
import { ReachIcon } from '../icons';
```

In the domain grid loop, prefix each domain label with a ReachIcon:
```typescript
<ReachIcon reach={domain} size={14} />
<span style={{ marginLeft: 4 }}>{DOMAIN_NAMES[domain]}</span>
```

Also replace the hard-coded `✦` at line ~464 (high-stakes indicator) with a small SphereIcon if appropriate, or keep it as a generic indicator.

- [ ] **Step 3: Type check and commit**

```bash
git add src/components/Game/AgentDetailPanel.tsx
git commit -m "feat(icons): add ReachIcon to domain capability bars in AgentDetailPanel"
```

---

### Task 6: FactionSheet — Add ReachIcon to Domain Focus

**Files:**
- Modify: `src/components/Game/FactionSheet.tsx`

- [ ] **Step 1: Read the domain focus section (lines ~88-108)**

Find where domain names are rendered next to weight bars.

- [ ] **Step 2: Add ReachIcon inline before each domain label**

```typescript
import { ReachIcon } from '../icons';
```

Prefix each domain label:
```typescript
<ReachIcon reach={domain} size={14} />
<span style={{ marginLeft: 4, textTransform: 'capitalize' }}>{domain}</span>
```

- [ ] **Step 3: Type check and commit**

```bash
git add src/components/Game/FactionSheet.tsx
git commit -m "feat(icons): add ReachIcon to domain focus bars in FactionSheet"
```

---

### Task 7: Remaining Reach Label Components

**Files:**
- Modify: `src/components/Game/AscendantSheet.tsx`
- Modify: `src/components/Game/AgentInfoCard.tsx`
- Modify: `src/components/Game/tabs/ProwessTab.tsx`
- Modify: `src/components/Game/MeetingEncounterModal.tsx`

- [ ] **Step 1: Read each file to find DOMAIN_NAMES usage and REACH_ICONS**

- [ ] **Step 2: AscendantSheet — add ReachIcon before domain labels**

Import `ReachIcon` from `../icons`. Prefix each domain name in the domain display sections.

- [ ] **Step 3: AgentInfoCard — add ReachIcon before domain labels**

Same pattern — import and prefix.

- [ ] **Step 4: ProwessTab — add ReachIcon before domain labels**

Import from `../../icons`. Prefix in the domain grid.

- [ ] **Step 5: MeetingEncounterModal — replace REACH_ICONS Unicode with ReachIcon**

Replace the `REACH_ICONS` object (lines 43-46) with `ReachIcon` component usage. Where the Unicode glyph was rendered, use `<ReachIcon reach={reach} size={16} />`.

- [ ] **Step 6: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 7: Commit**

```bash
git add src/components/Game/AscendantSheet.tsx src/components/Game/AgentInfoCard.tsx src/components/Game/tabs/ProwessTab.tsx src/components/Game/MeetingEncounterModal.tsx
git commit -m "feat(icons): add ReachIcon to AscendantSheet, AgentInfoCard, ProwessTab, MeetingEncounterModal"
```

---

### Task 8: Cosmology Bar — Replace Sphere Glyphs in Top HUD

**Files:**
- Modify: The top HUD bar that displays sphere values (the row of ◆ 50, ◈ 50, ❋ 50, etc.)

- [ ] **Step 1: Find the cosmology bar component**

Search for the component rendering the top bar with sphere glyphs and values. It's visible in the game UI as the row: `◆ 50 −2 | ◈ 50 | ❋ 50 | ...`

- [ ] **Step 2: Replace each sphere glyph with SphereIcon**

Replace each Unicode glyph span with:
```typescript
<SphereIcon sphere={sphereName} size={14} />
```

- [ ] **Step 3: Type check and commit**

```bash
git commit -m "feat(icons): replace sphere glyphs with SphereIcon in cosmology HUD bar"
```

---

### Task 9: Full Build Verification

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All pass (82 icon tests + existing tests)

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: Clean

- [ ] **Step 3: Production build**

Run: `npx vite build`
Expected: Build succeeds

- [ ] **Step 4: Visual verification**

Start dev server at `?view=game` and verify:
- Top HUD bar shows SVG sphere icons instead of Unicode glyphs
- FactionSheet domain focus section has ReachIcon badges
- AgentDetailPanel domain grid has ReachIcon badges
- ActionCard shows SVG sphere icon instead of Unicode glyph
- EssencePanel still works (shared/SphereIcon adapter)

- [ ] **Step 5: Push**

```bash
git push
```
