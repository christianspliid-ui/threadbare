# Encounter Vignette Modal — Click-to-Open from Sidebar

**Date:** 2026-03-18
**Status:** Design — ready for implementation
**Scope:** New EncounterVignetteModal component + RetinuePanel encounter rows + wiring in GameView

---

## Problem

Players cannot inspect active encounters in detail. Encounter progress is only visible as a one-line status in LocationView's AgentRow ("encounter name · step N") and as read-only EncounterLog cards inside SublocationDetailView. There is no way to open a dedicated encounter narrative view, and the right sidebar (RetinuePanel) shows only generic activity labels ("Idling", "Journeying") — never specific encounters.

## Design

Two changes working together:

1. **RetinuePanel shows active encounters** — each agent's row gains a clickable encounter badge when they have an active encounter.
2. **EncounterVignetteModal** — a new modal that renders the full narrative vignette for any active encounter, using the existing `vignetteProse.ts` engine and `EncounterLog` display.

### Player flow

```
RetinuePanel (right sidebar)
  └─ Agent row shows: "⚔ Facing: Ambush at the Crossing"
     └─ Click → opens EncounterVignetteModal
        ├─ Scene prose (from vignetteProse.generateVignette)
        ├─ Lens (sphere-flavored)
        ├─ Stakes
        ├─ Forecast tier
        ├─ Step progress (EncounterLog inline)
        └─ Close button / Escape / backdrop click
```

The same modal can also be opened from LocationView's AgentRow and EncounterLog, giving two entry points.

---

## Part 1 — EncounterVignetteModal

New file: `src/components/Game/EncounterVignetteModal.tsx`

### Props

```typescript
interface EncounterVignetteModalProps {
  open: boolean;
  onClose: () => void;
  progress: EncounterProgress;       // active encounter state
  template: EncounterTemplate;       // encounter definition
  agentName: string;                 // resolved agent display name
  graph: WorldGraph;                 // for vignette generation
  agentId: string;                   // for vignette seed
  ascendantSphere: SphereName;       // player's primary sphere
  seed: number;                      // world seed (for PRNG)
}
```

### Layout

Uses the existing `Modal` primitive (Modal.Header / Modal.Body / Modal.Footer).

```
┌──────────────────────────────────────────┐
│  Modal.Header: "{agentName} — {name}"    │
│  [Threat badge]                    [✕]   │
├──────────────────────────────────────────┤
│  Modal.Body (scrollable):                │
│                                          │
│  ┌─ Step Progress ─────────────────────┐ │
│  │  ● ● ○ ○  Step 2 of 4              │ │
│  │  "Navigate the Ruins"               │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─ Scene ─────────────────────────────┐ │
│  │  (vignette.scene prose)             │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─ Lens ──────────────────────────────┐ │
│  │  (sphere-flavored perception)       │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─ Stakes ────────────────────────────┐ │
│  │  (what's at risk)                   │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─ Forecast ──────────────────────────┐ │
│  │  [forecast tier badge] prose        │ │
│  └─────────────────────────────────────┘ │
│                                          │
│  ┌─ Step Narrative ────────────────────┐ │
│  │  (resolveEncounterNarrative for     │ │
│  │   the current step)                 │ │
│  └─────────────────────────────────────┘ │
├──────────────────────────────────────────┤
│  Modal.Footer: [Close]                   │
└──────────────────────────────────────────┘
```

### Vignette generation

Call `generateVignette(graph, agentId, encounterId, currentStep.id, ascendantSphere, probability)` from `vignetteProse.ts`. This is the first time this engine gets wired to the UI.

**Probability:** Currently there's no pre-computed success probability stored on `EncounterProgress`. For now, use a placeholder derived from threat rating:

| Threat Rating | Placeholder Probability |
|---|---|
| trivial | 0.90 |
| easy | 0.75 |
| moderate | 0.50 |
| hard | 0.30 |
| deadly | 0.10 |

| Name | Default | Purpose |
|---|---|---|
| THREAT_PROBABILITY_TRIVIAL | 0.90 | Placeholder success prob for trivial encounters |
| THREAT_PROBABILITY_EASY | 0.75 | Placeholder success prob for easy encounters |
| THREAT_PROBABILITY_MODERATE | 0.50 | Placeholder success prob for moderate encounters |
| THREAT_PROBABILITY_HARD | 0.30 | Placeholder success prob for hard encounters |
| THREAT_PROBABILITY_DEADLY | 0.10 | Placeholder success prob for deadly encounters |

These live in the modal file as named constants. When real probability calculation lands (from the encounter resolution system), swap to that.

### Forecast tier badge styling

| Tier | Color | Label |
|---|---|---|
| doomed | `var(--status-error)` / `#ef4444` | Doomed |
| perilous | `#f97316` (orange) | Perilous |
| uncertain | `var(--accent-gold)` | Uncertain |
| favorable | `#4ade80` (green) | Favorable |
| fated | `#a78bfa` (violet) | Fated |

### Tracing

The modal is read-only UI — no new trace types needed. The vignette content is deterministic (seeded PRNG), so the same encounter viewed twice produces identical text.

### Fail-soft

| Failure | Fallback |
|---|---|
| `progress.currentEncounterIndex` out of bounds | Clamp to last valid step, show "Encounter concluding" |
| `generateVignette` throws | Show EncounterLog only (skip vignette sections), log warning |
| Template not found for encounterId | Don't open modal (guard at call site) |
| Agent node missing from graph | Use `agentName` prop as-is (already resolved by caller) |

### PRNG

All randomness is inside `generateVignette` which already uses seeded PRNG. No new PRNG calls needed in the modal.

---

## Part 2 — RetinuePanel Encounter Badges

Modify: `src/components/Game/RetinuePanel.tsx`

### New props needed

RetinuePanel currently receives `agents: RetinuePanelAgent[]`. Extend it with:

```typescript
interface RetinuePanelProps {
  agents: RetinuePanelAgent[];
  selectedAgentId: string | null;
  onAgentSelect: (id: string) => void;
  onZoomToLocation: (locationId: string) => void;
  // NEW:
  activeEncounters: Map<string, { progress: EncounterProgress; template: EncounterTemplate }>;
  onEncounterClick: (agentId: string, progress: EncounterProgress, template: EncounterTemplate) => void;
}
```

`activeEncounters` is a map from agentId → their active encounter data (first active encounter, since agents do one at a time). Built in GameView from `gameState.encounterProgress`.

### UI change per agent row

Below the existing activity label, when an encounter is active for this agent:

```
┌────────────────────────────────────┐
│  [Pip] Kaelen the Bold        [👁] │
│  at: Thornwatch Hollow             │
│  Journeying                        │
│  ⚔ Ambush at the Crossing  ● ● ○  │  ← NEW: clickable, shows step dots
└────────────────────────────────────┘
```

- The encounter line is a `<button>` styled as inline text.
- Shows encounter name + StepDots (reuse from LocationView, or extract to shared).
- `cursor: pointer`, subtle hover highlight.
- On click: calls `onEncounterClick(agentId, progress, template)`.

### Constants

| Name | Default | Purpose |
|---|---|---|
| ENCOUNTER_BADGE_ICON | "⚔" | Prefix icon for encounter row |

### Fail-soft

| Failure | Fallback |
|---|---|
| Agent has no entry in activeEncounters map | Don't render encounter badge (show activity label only) |
| Template lookup fails | Don't render encounter badge |

---

## Part 3 — GameView Wiring

Modify: `src/components/Game/GameView.tsx`

### New state

```typescript
const [vignetteEncounter, setVignetteEncounter] = useState<{
  progress: EncounterProgress;
  template: EncounterTemplate;
  agentId: string;
  agentName: string;
} | null>(null);
```

### Build activeEncounters map for RetinuePanel

```typescript
const retinueActiveEncounters = useMemo(() => {
  const map = new Map<string, { progress: EncounterProgress; template: EncounterTemplate }>();
  for (const p of gameState.encounterProgress) {
    if (p.status !== 'active') continue;
    const tmpl = getEncounterTemplate(p.encounterId);
    if (tmpl) map.set(p.actorId, { progress: p, template: tmpl });
  }
  return map;
}, [gameState.encounterProgress]);
```

### Handlers

```typescript
const handleEncounterClick = useCallback((
  agentId: string,
  progress: EncounterProgress,
  template: EncounterTemplate,
) => {
  const agentName = gameState.graph.getNode(agentId)?.name ?? 'Unknown';
  setVignetteEncounter({ progress, template, agentId, agentName });
}, [gameState.graph]);

const handleVignetteClose = useCallback(() => {
  setVignetteEncounter(null);
}, []);
```

### Pass to RetinuePanel

Add `activeEncounters={retinueActiveEncounters}` and `onEncounterClick={handleEncounterClick}` to the RetinuePanel render site.

### Render the modal

After the existing overlay stack (StrandView, Scry, etc.):

```tsx
{vignetteEncounter && (
  <EncounterVignetteModal
    open={true}
    onClose={handleVignetteClose}
    progress={vignetteEncounter.progress}
    template={vignetteEncounter.template}
    agentName={vignetteEncounter.agentName}
    agentId={vignetteEncounter.agentId}
    graph={gameState.graph}
    ascendantSphere={archetype.sphereAlignment.primary}
    seed={gameState.seed}
  />
)}
```

### Also wire from LocationView

Add an `onEncounterClick` prop to LocationView. In AgentRow's encounter label and in EncounterLog, make the encounter name/card clickable. On click, call `onEncounterClick` which flows up to GameView's `handleEncounterClick`.

---

## Part 4 — Extract StepDots to Shared

The StepDots sub-component currently lives inside LocationView. Extract it to `src/components/shared/StepDots.tsx` so both RetinuePanel and EncounterVignetteModal can reuse it.

```typescript
interface StepDotsProps {
  totalSteps: number;
  currentStepIndex: number;
  size?: number;  // dot diameter in px, default 6
}
```

---

## Implementation Order

1. **Extract StepDots** to shared — zero risk, pure refactor
2. **EncounterVignetteModal** — new file, no existing code modified
3. **RetinuePanel encounter badges** — extend existing component
4. **GameView wiring** — state + handlers + pass props
5. **LocationView click-through** — make AgentRow encounter labels and EncounterLog clickable
6. **Tests** — modal render, RetinuePanel with encounters, click handlers

---

## NFP Compliance Summary

| Priority | NFP | Verdict |
|---|---|---|
| 1 | Tunability | PASS — threat probabilities, badge icon, forecast colors all named constants |
| 2 | Inspectability | PASS — vignette content is deterministic (seeded), no new trace types needed (read-only UI) |
| 3 | Determinism | PASS — generateVignette uses seeded PRNG, same encounter always shows same prose |
| 4 | Fail-soft | PASS — all failure cases have fallbacks, modal guards against missing data |
| 5 | Narrative over mechanical | PASS — this entire feature exists to surface narrative |
| 6 | Additive over destructive | PASS — new component, RetinuePanel extension, StepDots extraction. No destructive changes. |
| 7 | Performance budget | PASS — vignette generation is O(1) string lookups, memoized encounter map |

---

## Bug Found During Research

`LocationView.tsx` lines 268 and 299 reference `currentStepIndex` but `EncounterProgress` defines `currentEncounterIndex`. This is a property access bug — the step display in AgentRow is likely showing `undefined`. Fix alongside this work.
