# Debug Trace Panel — Design Document

**Date:** 2026-03-07
**Status:** Approved
**Relates to:** Inspectability (non-functional priority #2), Narrative Quality Inspection

## Problem

As content grows and agents become autonomous, we need visibility into:
- Whether agents make interesting choices (and why — rolls, modifiers, pipeline stages)
- Whether generated narratives make sense in the world context
- What happens during each tick behind the interface

Currently zero logging infrastructure exists. We need a domain-specific trace system that fits the existing architecture (flat state objects, pure functions, seeded PRNG, 10-phase tick loop).

## Decision 1: Approach — Structured Event Bus + Debug Panel

**Chosen over:** npm debug package (generic, no game-domain awareness), Browser Performance API (wrong abstraction — measures time, not decisions).

**Rationale:** A domain-specific trace system where each trace category maps to a game subsystem. Trace types become self-documenting — the type definition *is* the documentation of what data each pipeline stage produces. Fits the flat-state + pure-function architecture with zero external dependencies.

## Decision 2: Five Initial Trace Categories

| Category | Fires when | Key data |
|----------|-----------|----------|
| `action_selection` | Agent picks an action | All candidates + scores at each of 5 pipeline stages, disposition eval, probability distribution, roll, final pick |
| `narrative_generation` | Prose generated | Tier routing, template chosen, sphere words, personality clause, final prose text |
| `context_harvest` | Narrative context built | Harvested objects, relevance scores, opposition tension, selected objects with category caps |
| `dilemma_resolution` | 2×2 dilemma resolves | Strategies, history lookup, moves chosen, outcome matrix cell, bond/reputation deltas |
| `tick_summary` | Tick completes | Per-phase event counts, agents processed, doom stage, essence balance, mandate progress |

Ring buffer holds ~500 entries. New categories added over time as systems grow.

## Decision 3: TraceEntry Discriminated Union — The Expandability Pattern

Each trace category is a separate TypeScript interface extending `TraceBase`. All combined into a `TraceEntry` discriminated union on the `category` field. TypeScript enforces that every trace has a summary and tick number.

**Adding a new category (the "3-step recipe"):**
1. Define `NewSystemTrace extends TraceBase` with `category: 'new_system'` and system-specific fields
2. Add `NewSystemTrace` to the `TraceEntry` union type
3. Call `emitTrace(...)` from the engine function with the data already in local variables

The debug panel auto-discovers categories from buffer contents — no UI changes needed.

### TraceBase shape

```typescript
interface TraceBase {
  id: number;             // auto-increment from ring buffer
  tick: number;           // current game tick
  timestamp: number;      // Date.now() for wall-clock ordering
  category: string;       // discriminant field
  agentId?: string;       // if agent-scoped
  summary: string;        // one-line human-readable, always present
}
```

### Category-specific interfaces

Each extends TraceBase with structured data for that subsystem. For example, `ActionSelectionTrace` includes the 5-stage pipeline with candidates, scores, modifiers, distribution, roll, and final pick at each stage.

## Decision 4: `emitTrace` — Zero-Cost Toggle

A module-level boolean `enabled` (default `false`) gates all trace emission. When off: single branch, zero allocation. When on: push to ring buffer with auto-eviction.

```typescript
export function emitTrace(entry: Omit<TraceEntry, 'id' | 'timestamp'>): void {
  if (!enabled) return;
  buffer.push({ ...entry, id: nextId++, timestamp: Date.now() });
  if (buffer.length > BUFFER_SIZE) buffer.shift();
}
```

Query functions: `getTraces()`, `getTracesForAgent(id)`, `clearTraces()`.

No configuration, no registration, no dependency injection. Engine functions call `emitTrace()` with data they already have in local variables — typically 3-5 lines of code per instrumentation point.

## Decision 5: Debug Panel UI — Right-Side Drawer

### Layout: Right-Side Drawer (not centered modal)

The debug panel is a **480px-wide drawer** that slides in from the right edge of the screen. It replaces the right sidebar (retinue/agent detail) when open, extending into the main content area. The hex map remains partially visible and playable on the left — you can step ticks and watch traces appear in real-time.

```
┌──────────────────────────────────────────────────────────────┐
│ DoomBar            MandateTracker               [Debug ON]  │
├────────┬─────────────────────────┬──────────────────────────┤
│ Left   │                         │   DEBUG PANEL (480px)    │
│ sidebar│   Hex Map               │ ┌────────────────────── ┐│
│ (320px)│   (visible, dimmed)     │ │ Feed │ Agent │ Tick   ││
│        │                         │ ├────────────────────── ┤│
│ Sim    │                         │ │ [✓] Actions [✓] Narr ││
│ Controls                         │ │ [✓] Context [✓] Dile ││
│ Essence│                         │ ├────────────────────── ┤│
│ Rivals │                         │ │ t47 [action]          ││
│        │                         │ │ Kael chose RAID →Mira ││
│        │                         │ │ score 0.82, prob 40%  ││
│        │                         │ │ ▸ Pipeline Detail     ││
│        │                         │ │                       ││
│        │                         │ │ t47 [narrative]       ││
│        │                         │ │ "Kael's blade sang    ││
│        │                         │ │  against the dawn"    ││
│        │                         │ │ tier: notable         ││
│        │   NarrativeFeed         │ │ ▸ Template Detail     ││
│        │   (still visible)       │ │                       ││
│        │                         │ │ t47 [tick]            ││
│        │                         │ │ 3 events, doom stg 2  ││
└────────┴─────────────────────────┴──────────────────────────┘
```

### Toggle: Top-Bar Button + Keyboard Shortcut

A small pill button in the top bar (next to MandateTracker): "Debug" with a glowing dot when active. Keyboard shortcut: backtick (`` ` ``). Toggling off returns the right sidebar to its normal retinue/agent detail view.

### Three Viewing Modes (tab bar at top of panel)

| Mode | Shows | Use case |
|------|-------|----------|
| **Feed** | All traces reverse-chronological, category checkbox filters | "What just happened this tick?" |
| **Agent Follow** | Header with agent name/archetype/strategy, then their traces only | "Why did this agent do that?" |
| **Tick Inspector** | Pick a tick number, see all traces for that tick grouped by phase | "Walk me through tick 47" |

When an agent is selected on the map and the debug panel is open, it auto-switches to Agent Follow mode for that agent.

### Human-Readable Summaries (Not Code Jargon)

Every trace `summary` is written in plain English with the actor's **name** (not ID), the **action name** (not template ID), and meaningful qualifiers:

| Instead of | Write |
|-----------|-------|
| `action_selection: agent a1 selected templateId raid_01 score 0.82` | `Kael chose RAID targeting Mira (score: 0.82, probability: 40%)` |
| `context_harvest: 12 harvested, 3 selected, tension 0.65` | `Context built: 12 nearby objects → 3 selected (tension: high)` |
| `dilemma_resolution: mutual_trust actorMove cooperate` | `Dilemma: Kael (tit-for-tat) cooperated with Mira (grudger) → mutual trust (+sentiment)` |
| `narrative_generation: tier notable templateId conflict_02` | `Notable prose: "Kael's blade sang..." (template: conflict_02, sphere: force)` |

### Expandable Detail Sections (Structured, Not Raw JSON)

Click the ▸ chevron on any trace to expand. Each category has a **purpose-built renderer** (not a JSON dump):

**action_selection expanded — Pipeline Breakdown:**
```
┌ Pipeline Breakdown ──────────────────────────┐
│ Stage 1: Goal Alignment                      │
│   RAID     ████████░░  0.82                  │
│   TRADE    ███░░░░░░░  0.31                  │
│   PATROL   ██░░░░░░░░  0.18                  │
│                                              │
│ Stage 2: Disposition Modifier                │
│   Strategy: tit-for-tat → cooperate          │
│   Target reputation: 0.72 → +0.09 boost     │
│   RAID  0.82 → 0.91 (cooperative)           │
│                                              │
│ Stage 3: Top-N Selection                     │
│   3 survivors (cut score: 0.15)              │
│                                              │
│ Stage 4: Final Probabilities                 │
│   RAID   58%  ▓▓▓▓▓▓░░░░                    │
│   TRADE  28%  ▓▓▓░░░░░░░                    │
│   PATROL 14%  ▓░░░░░░░░░                    │
│   Roll: 0.42 → RAID  ✓                      │
└──────────────────────────────────────────────┘
```

**narrative_generation expanded:**
```
┌ Prose Generation ────────────────────────────┐
│ Tier: notable (significance: 0.85)           │
│ Template: "notable_conflict_02"              │
│ Sphere words: blazing, struck, blade         │
│ Personality clause: "driven by fierce        │
│   loyalty"                                   │
│                                              │
│ Final prose:                                 │
│ "Kael's blade sang against the dawn,         │
│  struck by a loyalty fiercer than iron."     │
└──────────────────────────────────────────────┘
```

**dilemma_resolution expanded:**
```
┌ Dilemma Outcome ─────────────────────────────┐
│ Kael (tit-for-tat) vs Mira (grudger)         │
│ Stakes: 0.70 (high — Gold reach + faction)   │
│                                              │
│        │ Mira cooperates │ Mira defects      │
│ ───────┼─────────────────┼────────────       │
│ Kael C │ mutual trust ★  │ betrayed          │
│ Kael D │ exploitation    │ mutual distrust   │
│                                              │
│ Result: mutual trust                         │
│ Sentiment: +0.15  Strength: +0.10            │
│ Kael rep: +0.05   Mira rep: +0.05            │
└──────────────────────────────────────────────┘
```

Any **new/unknown category** falls back to formatted key-value pairs (not raw JSON.stringify, but structured `key: value` lines with indentation). This ensures new categories are always readable even before a custom renderer is built.

### Category Badge Colors

| Category | Badge color | Rationale |
|----------|------------|-----------|
| `action_selection` | `#d4a574` (tan) | Matches agent action dot in NarrativeFeed |
| `narrative_generation` | `#aa44dd` (violet/Spirit) | Creative, story-related |
| `context_harvest` | `#2288ff` (blue/Mind) | Knowledge, awareness |
| `dilemma_resolution` | `#ff4444` (crimson/Force) | Conflict, tension |
| `tick_summary` | `#ca8a04` (amber) | Neutral system information |

### Typography & Sizing

- **Summary lines:** `text-sm` (14px), system sans-serif — readable at a glance
- **Detail sections:** `text-xs font-mono` (12px monospace) — compact structured data
- **Category badges:** `text-[10px] uppercase tracking-wider` — small colored pills
- **Tick numbers:** `font-mono text-amber-200/30` — subtle, matches NarrativeFeed pattern
- **Bar charts in detail:** Unicode block characters (`▓░`) in monospace, proportional to scores

### Scroll & Auto-Follow

New traces appear at the **top** (reverse-chronological). If you're at the top, new traces push in automatically. If you've scrolled down to inspect something, auto-scroll pauses and a floating "↑ New traces" pill appears to jump back to the top.

### Threadbare Styling

- Background: `#0d0b14` (darker than game's `stone-900` — the panel reads as a "deeper" layer)
- Border: `border-l border-amber-900/30` (same pattern as existing sidebars)
- Text: `#c8c0d8` (light lavender-grey, slightly cooler than amber-100 to distinguish from game text)
- Expanded detail boxes: `bg-stone-800/40 rounded border border-amber-900/15 p-3`
- z-index: 45 (below ScryOverlay/StrandView at 50, above the game at 0)

## Decision 6: Definition of Done — Tracing as Mandatory

Three documentation touchpoints ensure all future engine work includes tracing:

1. **CLAUDE.md Session Workflow:** "Verify new engine functions emit appropriate TraceEntry types — if a function makes decisions, resolves outcomes, or generates content, it must call `emitTrace()` with a descriptive summary and relevant structured data."

2. **CLAUDE.md Non-Functional Priorities (§2 Inspectability):** "All engine modules must emit structured traces via `emitTrace()`. The debug panel is the primary inspectability tool — if you can't see it in the panel, it's not inspectable."

3. **Obsidian vault — `Debug Trace System.md`:** System note documenting trace categories, the `emitTrace` pattern, and the 3-step "add a category" recipe.

## Key Properties

- **Zero-cost when off:** Single boolean check, no allocations
- **Expandable:** New category = 1 interface + 1 union member + 1 `emitTrace()` call; panel auto-discovers
- **Self-documenting:** Type definitions document what each pipeline stage produces
- **No dependencies:** Pure TypeScript, fits existing architecture
- **Deterministic-compatible:** Traces are side-channel output only — never fed back into game state, cannot affect PRNG sequences
