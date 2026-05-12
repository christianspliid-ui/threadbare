# Sustained Controls in the Right-Bar Thread Display

**Date:** 2026-05-12
**Author:** Cowork
**Parent:** THR-390 (Action System Curation & Unlock Roadmap) — recommendation #5 (Sustained-Control UI)
**Project:** Content Architecture
**Status:** Design complete, ready for executor

---

## Premise

The audit (`Docs/audits/2026-05-09-ascendant-actions-audit.md` §6) called out that **sustained controls aren't actions, they're ongoing claims/covenants** — and that they deserve their own UI surface. Christian's Round 2 verdict (THR-390 comments, 2026-05-11) tightened the direction:

> Sustained UI: extend the existing right-bar thread display to hold all threaded entities (hexes with claims, sources, championed mortals) — *not* a new dedicated Covenants panel. Smaller scope than the audit originally estimated.

The verdict reframes the problem. Sustained controls are *another way the god holds things*, alongside thread bonds. The ThreadsPanel is already the right-bar surface for "what the god is holding right now." It already groups five thread categories (agent, location, faction, army, artifact). Adding sustained controls as additional sections — Hexes (territorial claims), Sources (sustained sublocations) — and a champion badge on agent rows is the cleanest unification.

The engine plumbing exists. `GameState.controlEffects[]` is populated by `spawnControlEffect()` whenever a `durationMode: 'sustained'` action succeeds, ticked by `phaseControlEffects`, contestable, and lapse-aware. It just isn't surfaced. This plan wires it through to the right-bar with no schema migration.

## What gets surfaced

| Source | Today | After this plan |
|---|---|---|
| Threaded agents (incl. anointed champions) | Agents section row | Same row + champion badge if a sustained `install_champion` / `anoint_champion` effect targets the agent |
| Hex claims (`hex.claim_dominion`, `hex.ward_against_deep`, `hex.anchor_sphere`, `hex.cultivate`, `hex.shepherd_flock`, `hex.weave_decree`, etc.) | Hidden in `GameState.controlEffects[]` only | New **Hexes** section in ThreadsPanel — one row per active effect, named by hex label, sustain bar + lapse risk visible |
| Sublocation-targeted effects (`sub.sanctify`, `bind_echoes` on a ruin, `siphon` on a sphere-source) | Hidden | New **Sources** section in ThreadsPanel — one row per active effect, named by sublocation, sustain bar |
| Location-level wards (`loc.ward`, `loc.place_of_power`) | Hidden | Folded into the existing **Locations** section as a "claim status" line; if no thread edge to the location exists, the effect alone is enough to list it |
| Resource claims (`hex.claim_resource`) | Hidden | Hexes section with income-tinted sustain bar (per-tick income > per-tick cost) |

The unifying frame: **if the god is spending essence to hold it, it shows up in the threads panel.**

---

## Three-Pillar Coverage

### Engine pillar

**1. Extend `src/engine/retinue.ts` with `getSustainedControlNodes()`.**

```ts
export type SustainedControlCategory = 'hex' | 'source' | 'location';

export interface SustainedControlNode {
  category: SustainedControlCategory;
  /** ControlEffect.effectId — stable across ticks. */
  effectId: string;
  /** Template ID for prose lookup. */
  templateId: string;
  /** Display name resolved per category (see below). */
  displayName: string;
  /** Hex col/row of the target — always present. */
  hexCol: number;
  hexRow: number;
  /** Sublocation/location nodeId if the effect targets a specific node. */
  targetNodeId?: string;
  /** Sphere(s) consumed per tick, summed across all spheres. */
  perTickCostTotal: number;
  /** Sphere(s) produced per tick, summed. */
  perTickIncomeTotal: number;
  /** Net flow per tick: income − cost. Negative = drain, positive = profit. */
  netFlow: number;
  /** Ticks since established. */
  ticksActive: number;
  /** Lapse risk: 'safe' | 'tightening' | 'critical' — see thresholds below. */
  lapseRisk: 'safe' | 'tightening' | 'critical';
  /** Short status string for the compact row (prose tier — see Content pillar). */
  statusLabel: string;
  /** Sphere name for tinting the row's left border. */
  primarySphere: SphereName | null;
}

export function getSustainedControlNodes(
  graph: WorldGraph,
  ascendantId: string,
  controlEffects: readonly ControlEffect[],
  essenceReserves: Partial<Record<SphereName, number>>,
): SustainedControlNode[];
```

Filter rule: include only effects where `effect.ownerId === ascendantId` AND `effect.active === true`.

Category classification:
* `effect.targetNodeId` resolves to a sublocation node → category `source`
* `effect.targetNodeId` resolves to a location node → category `location` (and the row is folded into the existing Locations section if a thread to that location already exists)
* `effect.targetNodeId` is undefined OR resolves to a non-location/sublocation → category `hex`

Display name resolution:
* Source: name of the sublocation node (e.g. "the Spring of Withered Light")
* Location: name of the location node
* Hex: prefer the dominant settlement name on the hex; fall back to "Hex (col, row)" if none

**2. Lapse-risk thresholds** (`src/engine/retinue.ts`, new constants):

```ts
/** Below this many ticks of essence runway, an effect is "critical". */
export const SUSTAIN_LAPSE_RISK_CRITICAL_TICKS = 3;
/** Below this many ticks, it's "tightening" (yellow band). */
export const SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS = 8;
/** Net positive flow always reports 'safe' regardless of reserves. */
```

Calculation: for each sphere consumed by the effect, `reservesForSphere / perTickCostForSphere = ticks_runway`. Take the minimum across spheres. If `netFlow > 0`, force `'safe'`. If `sustainThreshold` is failing today, force `'critical'` (one-tick warning before phaseControlEffects lapses it).

**3. Champion badge wiring** (`src/engine/retinue.ts`):

Extend `ThreadedAgent` with `championEffectId: string | null`. In `getThreadedNodes`, after assembling each agent row, walk `controlEffects` once to find effects with `targetNodeId === agent.id` whose template id is in a small allowlist (`action.anoint-champion`, `action.install-champion`). First hit wins; populate `championEffectId`. Constant:

```ts
export const CHAMPION_TEMPLATE_IDS: readonly string[] = [
  'action.anoint-champion',
  'action.install-champion',
] as const;
```

**4. Tick phase — no new phase.** Display layer reads existing state. The only mutation is `championEffectId` being populated on the existing agent row.

**5. Determinism.** All pure functions. No PRNG. The order of `getSustainedControlNodes` output is deterministic: sort by `(category, ticksActive desc, displayName asc)`.

**6. Traces.** No new trace types. The existing `ControlEffectTickTrace`, `ControlEffectLapseTrace`, and `ControlEffectEstablishedTrace` carry the data Debug Panel needs.

**Constants table:**

| Constant | Default | Purpose |
|---|---|---|
| `SUSTAIN_LAPSE_RISK_CRITICAL_TICKS` | 3 | Below this runway → critical (red bar) |
| `SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS` | 8 | Below this runway → tightening (amber bar) |
| `CHAMPION_TEMPLATE_IDS` | `['action.anoint-champion', 'action.install-champion']` | Templates whose ControlEffect grants champion status |
| `SUSTAIN_BAR_FULL_FRACTION` | 1.0 | Bar fill at safe state |
| `SUSTAIN_BAR_MIN_VISIBLE_FRACTION` | 0.08 | Floor so the bar is always visible even when nearly lapsed |

**Fail-soft table:**

| Failure case | Behavior |
|---|---|
| `effect.targetNodeId` references a missing node | Skip the effect; emit `console.warn` once per session per effectId; do not throw |
| `essenceReserves` missing a sphere the effect consumes | Treat as 0 reserves → forces `'critical'` |
| `controlEffects` undefined | Return empty array; no error |
| Champion template id present but agent thread edge missing | Champion badge still shows; agent row appears in the agents section regardless because the thread edge from `install_champion`'s aftermath should already have been created — if it wasn't, the badge is the only signal, and that's correct behavior |
| Hex display name fallback when no settlement exists | "Hex (col, row)" — never throw |

### Content pillar

**1. Status label table** (new file: `src/data/sustained-control-status-prose.ts`):

A short status label per category × tier-of-effect. Prose tier (Threadbare voice — see `Docs/canon/prose.md`). 2–6 words. Examples:

```ts
export const SUSTAINED_STATUS_LABELS: Record<string, { active: string; tightening: string; critical: string }> = {
  'hex.claim_dominion': {
    active: 'Your sphere holds.',
    tightening: 'The hold thins.',
    critical: 'The claim is bleeding out.',
  },
  'hex.claim_resource': {
    active: 'A sustained flow of essence.',
    tightening: 'The siphon strains.',
    critical: 'The flow nearly breaks.',
  },
  'hex.cultivate': {
    active: 'The land flourishes under your gaze.',
    tightening: 'The growth wavers.',
    critical: 'Your blessing fades.',
  },
  'hex.shepherd_flock': {
    active: 'The flock drifts toward worship.',
    tightening: 'The pull weakens.',
    critical: 'The flock is slipping.',
  },
  'hex.weave_decree': {
    active: 'Your decree binds the hex.',
    tightening: 'The decree softens.',
    critical: 'The decree is fraying.',
  },
  'sub.sanctify': {
    active: 'Sanctified ground holds.',
    tightening: 'The sanctity thins.',
    critical: 'The ground stirs against you.',
  },
  'loc.place_of_power': {
    active: 'A node of your influence.',
    tightening: 'The node dims.',
    critical: 'The node is failing.',
  },
  // … fallback for templates not yet given hand-written prose:
  '__default__': {
    active: 'Held.',
    tightening: 'Holding.',
    critical: 'Slipping.',
  },
};
```

Phase 1 ships hand-written entries for the 10 most-common sustained templates (the list in §What gets surfaced minus rare ruins effects). Templates without an entry fall back to `__default__`. Followups can enrich.

**2. Champion badge label** — a single string per champion template:

```ts
export const CHAMPION_BADGE_LABELS: Record<string, string> = {
  'action.anoint-champion': 'Anointed',
  'action.install-champion': 'Installed Champion',
};
```

**3. Lapse-warning tooltip prose** (longer, one per category) — shown on hover when `lapseRisk === 'critical'`:

```ts
export const LAPSE_WARNING_TOOLTIPS: Record<SustainedControlCategory, string> = {
  hex: 'The reservoir is nearly empty. Your hold on this territory will break within a few ticks unless essence returns.',
  source: 'The sanctity is bleeding through. Without renewal, this node will fall back to neutral ground.',
  location: 'Your covenant with this place is thinning. The bond will lapse soon if it is not fed.',
};
```

All prose uses the Threadbare voice: present tense, second-person where appropriate, image-first, no numbers in the player-facing string. Numbers appear in the sustain-bar tooltip only.

### UI pillar

**1. `ThreadsPanel` section order, new entries:**

```ts
const SECTION_ORDER: ThreadCategory[] = [
  'agent',
  'location',
  'faction',
  'army',
  'artifact',
  'hex',     // new
  'source',  // new
];

const SECTION_LABELS: Record<ThreadCategory, string> = {
  // … existing …
  hex: 'Hexes',
  source: 'Sources',
};
```

Both new sections default to **expanded** when their group is non-empty AND `lapseRisk !== 'safe'` for any row; otherwise default collapsed (sustained controls are background state when healthy). Section header count badge follows the existing `<SectionHeading ornamental count={group.length}>` pattern.

**2. `SustainedControlRow` compact row component** (new — co-located in `ThreadsPanel.tsx` next to `CompactThreadRow`):

Visual structure (mirrors `CompactThreadRow` for consistency, no portrait):

```
┌─[sphere-tinted left border]──────────────────────────┐
│ [icon]  Display Name                  [zoom-to-hex] │
│         Status label · ⤓ N/tick  ⤒ M/tick           │
│ ▓▓▓▓▓▓▓▓▓░░░░░  (sustain bar — see below)            │
└──────────────────────────────────────────────────────┘
```

* **Left border:** 3px solid, sphere color via `var(--sphere-${primarySphere})`, mirroring CompactThreadRow.
* **Icon:** small glyph per category — Hexes use a hex outline, Sources use a wellspring/spring glyph, Locations folded into existing Locations section use a flag glyph. Use existing `ActivityIcon` infrastructure with new icon kinds `hex-claim`, `source-bound`, `claim-flag`.
* **Display name:** `var(--font-display)`, 15px, white. Same typography as agent rows minus uppercase.
* **Status label:** italic, `var(--text-tertiary)`, 12px. Sourced from `SUSTAINED_STATUS_LABELS[templateId][lapseRisk]`.
* **Per-tick flow chips:** small monospace chips next to the status. `⤓ 2/tick` for cost, `⤒ 3/tick` for income. Colour: cost uses sphere-dimmed; income uses gold. Hidden when zero.
* **Zoom button:** identical to CompactThreadRow zoom button; centers map on `(hexCol, hexRow)`.
* **Sustain bar:** full-width 2px bar at the bottom of the row. Width = `runwayTicks / SUSTAIN_LAPSE_RISK_TIGHTENING_TICKS` clamped to `[SUSTAIN_BAR_MIN_VISIBLE_FRACTION, 1]`. Colour:
  * `lapseRisk === 'safe'` → `var(--sphere-${primarySphere})` or `--accent-gold-dim` if no sphere
  * `lapseRisk === 'tightening'` → `#e0a020` (amber)
  * `lapseRisk === 'critical'` → `#b03030` (red) with `animation: mark-pulse 1.6s ease-in-out infinite` (reuses the existing keyframes used by thread priority pips)
* **Tooltip on hover** (sustain bar):
  ```
  Per tick: −2 spirit, +3 spirit (net +1)
  Established tick 47 · 23 ticks active
  Runway: ~6 ticks at current reserves
  ```

**3. Champion badge on agent rows.**

Add a `championEffectId` check inside `CompactThreadRow` (agent branch). If non-null, render a small "Anointed" or "Installed Champion" chip in Row 2 (after the secondary info line, before the strategic badge):

```
ROW 2: location name
ROW 2.5: [Champion chip — gold border, gold text, italic, 11px]
ROW 3: strategic badge / pool / action chip
```

Chip styling:
```jsx
<span style={{
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '1px 6px',
  border: '1px solid var(--accent-gold)',
  borderRadius: 999,
  fontSize: 11, fontFamily: 'var(--font-body)',
  fontStyle: 'italic', letterSpacing: '0.04em',
  color: 'var(--accent-gold)',
  flexShrink: 0,
}}>
  ✦ {CHAMPION_BADGE_LABELS[templateId]}
</span>
```

Click handler on the chip opens the existing AgentProfileModal at the same tab the bond chip currently opens to (no new modal).

**4. Empty-state copy.**

If `getSustainedControlNodes` returns zero entries AND the agent's threads are zero (the existing empty-state), the existing copy applies. If threads exist but no sustained controls, no sections appear (no empty per-section state — the section is hidden when its group is empty, matching today's behavior).

**5. Debug inspection.**

DebugPanel `Tools` tab gains a new section "Sustained Controls" (or extends the existing one if present): table of effectId, templateId, target, ticksActive, perTickCostTotal, netFlow, lapseRisk. One row per `controlEffects[]` entry. This is read-only inspection.

**6. Chronicle / toasts — no change in this issue.** Establishment, contestation, and lapse already emit traces consumed by chronicle. The right-bar surface is the dashboard; the chronicle is the history.

**7. Viewport contract.** The new sections appear inside the existing right-bar's `flex-1 overflow-y-auto` container. No layout changes outside the existing scroll region. Verified mentally against `## Viewport Contract` in CLAUDE.md — adding two collapsible sections does not change the outer panel height; they push content within the scroll region, which is the contract's expectation.

---

## Wiring (per `Docs/plans/wiring-checklist.md`)

| Wire | Location |
|---|---|
| Engine module | `src/engine/retinue.ts` — `getSustainedControlNodes()`, `SustainedControlNode` type, constants |
| Trace types | None new — reuse `ControlEffectTickTrace` / `Lapse` / `Established` |
| Orchestrator phase | None new — `phaseControlEffects` already runs |
| GameView consumer | `src/components/Game/GameView.tsx` — already imports `controlEffects` (line confirmed by grep). Pass to ThreadsPanel as new prop |
| ThreadsPanel prop | New prop `sustainedControls: SustainedControlNode[]` |
| Empty-state behavior | Existing "No Threads" empty applies only when total of threads + sustained controls is zero |
| Debug Panel | Tools tab — new "Sustained Controls" subsection |
| Player controls | Click-to-zoom button (existing pattern); champion-chip click opens AgentProfileModal (existing modal) |
| Prose pipeline | Status labels are direct lookup, not `enrichProse()` — they are intentionally template-literal short strings, no enrichment placeholders |

---

## NFP Compliance

| NFP | Status | Note |
|---|---|---|
| #1 Tunability | PASS | All thresholds named constants in `retinue.ts`. Status prose in a single content file. |
| #2 Inspectability | PASS | Reuses existing `ControlEffect*` traces. DebugPanel inspection table makes runtime state visible. |
| #3 Determinism | PASS | All pure functions. No PRNG. Sort order deterministic. |
| #4 Fail-soft | PASS | Fail-soft table in Engine pillar lists 5 failure cases, all with fallbacks. |
| #5 Narrative over mechanical | PASS | Status labels are prose-first; numbers appear in tooltip only. |
| #6 Additive | PASS | One new exported function. One new field (`championEffectId?`) on `ThreadedAgent` — optional, doesn't break callers. Two new section ids in ThreadsPanel. Zero schema migrations. |
| #7 Performance | PASS | `getSustainedControlNodes` is O(controlEffects × spheres) per call. With a current ceiling of ~30 active effects × 12 spheres = 360 ops. Recomputed only when `controlEffects` reference changes (memo on `[controlEffects, essenceReserves]`). |

---

## Phasing

This work ships as a single Linear issue. No phased rollout — the engine plumbing already exists and the UI surface is self-contained.

If it must split (e.g. for parallelism with other right-bar work), the natural cut is:

* **Phase 1a:** Engine extension (`getSustainedControlNodes`, `championEffectId` wiring) + DebugPanel display. Behind a feature flag `__DEBUG.showSustainedSections` so the UI integration in 1b can land independently.
* **Phase 1b:** ThreadsPanel sections + champion chip + prose tables.

The single-issue path is preferred unless coordination requires the split.

---

## Test plan (handed off to executor)

* **Unit:** `getSustainedControlNodes` returns the right category for each target-node type, including missing-node fail-soft and missing-sphere-reserves fail-soft. Lapse-risk thresholds correctly classify safe / tightening / critical.
* **Unit:** `championEffectId` populated for agents with matching control effect; null otherwise. CHAMPION_TEMPLATE_IDS allowlist enforced (an `install_champion` targeting a non-allowed agent does not pollute another agent's row).
* **Component:** `ThreadsPanel` renders Hexes and Sources sections when groups non-empty; hidden when empty. Sections default expanded when any row has non-safe risk.
* **Component:** Champion chip renders with correct label per template id and opens AgentProfileModal on click.
* **Component:** Empty-state copy still shows when total = 0.
* **Browser-verify (UI pillar):** screenshot at 1920×1080 with a fully populated state — agents with one champion badge, two hexes (one safe, one critical pulsing), one source, one location with claim status. Use Playwright for DOM, no WebGL involved so Playwright is sufficient. Console output captured. `window.__DEBUG.getHealthReport()` confirms `controlEffects.length > 0`.

---

## Open questions

None requiring Christian's verdict at handoff time. The verdict (THR-390 Round 2 comment, 2026-05-11) is sufficient direction. Two minor implementation choices that the executor can make and document:

1. **Sphere of the row** — for a multi-sphere-cost effect, use the dominant cost sphere as `primarySphere`. If income is also present, prefer the income sphere (it's the "what this effect is *for*" sphere).
2. **Hex display name** — if multiple settlements occupy a hex (rare), use the most-prosperous one. Tiebreak alphabetical.

---

## Dependencies

* **None hard.** This depends only on `controlEffects` (shipped), `getThreadedNodes` (shipped), and design tokens (shipped).
* **Coordination:** mutex with any in-flight work on `src/engine/retinue.ts` or `src/components/Game/ThreadsPanel.tsx`. Today (2026-05-12): no other issue claims either file. Parallel-safe with THR-400 / THR-401 (unified-action-templates.ts only).
* **Soft:** THR-390 Round 2 also locked the **right-bar threads** direction. If a future ticket reorders ThreadsPanel sections wholesale, the `SECTION_ORDER` change here should be merged at the same time.

---

## Definition of done

- [ ] `getSustainedControlNodes` exported from `src/engine/retinue.ts` with the type signature above
- [ ] Constants present and exported
- [ ] `championEffectId` field added to `ThreadedAgent` interface; populated by `getThreadedNodes`
- [ ] `SUSTAINED_STATUS_LABELS` table in new content file, covering at least 10 templates plus `__default__`
- [ ] `CHAMPION_BADGE_LABELS` table covering both champion templates
- [ ] `LAPSE_WARNING_TOOLTIPS` table for three categories
- [ ] ThreadsPanel rendering Hexes and Sources sections with the row layout described
- [ ] Champion chip rendering on agent rows with `championEffectId !== null`
- [ ] DebugPanel inspection table for `controlEffects`
- [ ] Unit + component tests in §Test plan all pass
- [ ] `npm test` clean, `npx tsc --noEmit` clean, `npx vite build` clean
- [ ] 30-tick CLI smoke pass (engine touched via retinue extension)
- [ ] Browser screenshot at 1920×1080 + console capture posted in commit body or completion comment
- [ ] Linear issue body updated with verification evidence; commit message includes `Fixes THR-XXX`

---

## Out of scope (filed separately if appetite confirmed)

* **Release-control action button.** A player-facing "release this claim" action button in the row. Today the only way to end a sustained control is to stop paying for it (lapse) or have it usurped/destroyed. A voluntary release verb is its own design — would need to decide if it's a free action (any cost? cooldown? prose?). Not in this issue.
* **Sustain-bar drill-down modal.** Clicking the sustain bar today does nothing; future work could open a modal with the full per-sphere flow breakdown, contest probability estimate, and lapse-prediction trace. Out of scope.
* **Cross-effect synergy display.** Two effects on the same hex (e.g. `claim_dominion` + `cultivate`) — surfacing the combined behavior. Out of scope; each row stands alone.

— Cowork, 2026-05-12
