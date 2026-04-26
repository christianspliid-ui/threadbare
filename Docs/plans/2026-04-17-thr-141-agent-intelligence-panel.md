# THR-141 — Agent-detail intelligence panel UI

**Status:** Ready for Dev
**Project:** Encounter Format Migration (Now / Urgent)
**Parent:** THR-113 (Intelligence consumption pathway — Done)
**Priority:** Medium
**Size:** M (one component + view-model helper + wiring + tests)

## Problem

After THR-113, `IntelligenceRecord[]` drives encounter scoring, prose enrichment, and passive resolution-match observation. The records themselves remain **invisible** to the player — only the `intelligence_referenced` traces in the DebugPanel feed hint that intel exists. Players cannot answer the obvious question: *what does this agent know?*

Without a surface, intel reads as a phantom mechanic: scoring shifts and prose murmurs about "a patrol schedule" or "a shrine" with no way to trace them back to the record that produced them.

## Goal

Surface `GameState.intelligenceRecords` filtered by agent on the agent-detail panel (`ThreadDetailView`). Make it read as a compact in-world "what they know" section: category → target → reliability → how recently acquired. Close the player-facing half of the intel loop.

## Scope

In scope:

* New `AgentIntelligencePanel` component rendered inside the agent body of `ThreadDetailView`.
* New pure helper `buildIntelligenceDisplay()` in `src/engine/intelligence.ts` that resolves each record's `targetEntityId` / `targetRegion` to a human-readable label via `WorldGraph`, computes a "N days ago" string from `acquiredTick`, and applies sort order.
* Wiring: `GameView.tsx` passes `gameState.intelligenceRecords` and `gameState.tick` into `ThreadDetailView`; `ThreadDetailView` forwards them into the agent body only.
* Fog-of-war gate (v1): show the panel only for agents with `node.tier >= 1` (retinue / bonded). Strangers (tier 0) render no panel.
* Empty state: the agent is bonded but holds zero records — render "Knows nothing of consequence." in muted italics.
* Tests: grouping, sort order, empty state, graph-resolution fallback, fog-of-war gating, "N days ago" formatting.

Out of scope (tracked elsewhere):

* Reliability decay — tracked in THR-137.
* Candidate visibility gating — tracked in THR-138.
* Authored reaction prose surfacing used intel in the chronicle — tracked in THR-139.
* Difficulty attenuation from intel — tracked in THR-140.
* Cross-agent/shared intel — tracked in THR-142.
* Rendering for non-bonded agents beyond fog-of-war gating (could be a later "you sense they know something" tease; deferred to v2).

## Three-pillar coverage

### Engine (small addition; existing consumption pathway untouched)

Existing machinery (`getAgentIntelligence`, `reliabilityDescriptor`, `RELIABILITY_THRESHOLD_*`, `IntelligenceCategory`) is sufficient on its own — the UI could construct display entries inline. We still introduce one thin helper so that display concerns (graph resolution, sort order, "N days ago") live next to the existing query helpers and get the same unit-test coverage they already have.

**New helper** in `src/engine/intelligence.ts`:

```ts
export interface IntelligenceDisplayEntry {
  readonly recordId: string;
  readonly category: IntelligenceCategory;
  readonly categoryLabel: string;           // human-readable (e.g. "Shrine Location")
  readonly label: string;                   // from record.label
  readonly detail: string;                  // from record.detail
  readonly targetDisplayName: string | null;// resolved via graph; null if unresolved
  readonly targetKind: 'agent' | 'location' | 'region' | 'unknown';
  readonly reliabilityDescriptor: 'reliable' | 'uncertain' | 'dubious';
  readonly reliabilityRank: 0 | 1 | 2;      // for stable sort (0 = reliable)
  readonly acquiredTick: number;
  readonly acquiredDaysAgo: number;         // max(0, currentTick - acquiredTick)
  readonly acquiredLabel: string;           // "today", "1 day ago", "N days ago"
}

export function buildIntelligenceDisplay(
  state: GameState,
  agentId: string,
  graph: WorldGraph | undefined,
  currentTick: number,
): readonly IntelligenceDisplayEntry[];
```

Sort: primary by `reliabilityRank` ascending (reliable first); secondary by `acquiredTick` descending (most recent first).

**Graph resolution** (fail-soft per NFP #4):

1. If `record.targetEntityId` is set: `graph.getNode(targetEntityId)`.
   Node type `actor` → `targetKind = 'agent'`, use `node.name`.
   Node type `location` → `targetKind = 'location'`, use `node.name`.
   Missing node or graph undefined → `targetDisplayName = null`, `targetKind = 'unknown'`.
2. Else if `record.targetRegion` is set: `targetKind = 'region'`, `targetDisplayName = record.targetRegion` (regions are string identifiers, not graph nodes). Title-case via helper if desired.
3. Else: `targetKind = 'unknown'`, `targetDisplayName = null`.

**"Days ago" formatting** (tick = day in simulation):

```
delta = max(0, currentTick - acquiredTick)
delta === 0 → "today"
delta === 1 → "1 day ago"
delta > 1   → "N days ago"
```

Clamp negatives to 0 so out-of-order inputs never produce "-3 days ago".

**Category labels** (the 6 existing categories mapped to display strings):

| Category | Label |
|---|---|
| `shrine_location` | Shrine Location |
| `agent_network` | Agent Network |
| `trade_route` | Trade Route |
| `military_position` | Military Position |
| `political_secret` | Political Secret |
| `cultural_knowledge` | Cultural Knowledge |

Stored as a `const` object keyed on `IntelligenceCategory`. Exported so tests can assert full coverage and so the panel can reuse it.

**Constants (named per NFP #1):**

| Constant | Default | Purpose |
|---|---|---|
| `INTEL_PANEL_MAX_RECORDS` | `24` | Max records rendered before truncation message ("+N more"). Prevents 200-record agent from blowing up the panel height. |
| `INTEL_PANEL_FOG_MIN_TIER` | `1` | Minimum `InfluenceTier` at which intel panel is rendered. Tier 0 = Stranger (hidden); Tier 1+ = Bonded (visible). |
| `RELIABILITY_RANK_RELIABLE` | `0` | Sort rank for reliable records. |
| `RELIABILITY_RANK_UNCERTAIN` | `1` | Sort rank for uncertain. |
| `RELIABILITY_RANK_DUBIOUS` | `2` | Sort rank for dubious. |

All live in `src/engine/intelligence.ts` alongside the existing `RELIABILITY_THRESHOLD_*` constants.

**Tracing:** none added. This is a read-side display surface; no new traces. Existing `intelligence_referenced` / `intelligence_granted` traces remain the audit trail. Avoids NFP #2 regressions.

**Fail-soft table (NFP #4):**

| Failure | Fallback |
|---|---|
| `state.intelligenceRecords` undefined | Treat as empty `[]`; panel renders empty-state copy (if bonded) or nothing (if stranger). |
| `graph` undefined in props | All entries resolve with `targetDisplayName = null`, `targetKind = 'unknown'`. Record still renders using its own `label`. |
| `graph.getNode(targetEntityId)` throws | Caught; treated as missing node. |
| `record.reliability` NaN or < 0 | Falls through `reliabilityDescriptor` to `'dubious'`, rank `2`. |
| `currentTick` undefined | Default to `record.acquiredTick` (days-ago = 0 → "today"). |
| Record count > `INTEL_PANEL_MAX_RECORDS` | Render first N (post-sort); append "+K more" muted footer row. |

### Content (minor — display strings)

* Category labels: the 6 strings above, stored in `intelligence.ts` as exported const.
* Empty-state copy: `"Knows nothing of consequence."` (italic, muted).
* Truncation footer: `"+N more intelligence records"`.
* Section header: `"Intelligence"` (matches existing `"Designs"`, `"Domains"` section headers in `ThreadDetailView`).
* Reliability descriptor already exists (`reliable` / `uncertain` / `dubious`); capitalize for display.

No encounter templates, prose tables, or attachment content are touched.

### UI (primary pillar — main work)

**New component:** `src/components/Game/AgentIntelligencePanel.tsx`

Props:

```ts
interface AgentIntelligencePanelProps {
  entries: readonly IntelligenceDisplayEntry[];
  isStranger: boolean;   // true iff node.tier < INTEL_PANEL_FOG_MIN_TIER
  maxRecords?: number;   // default INTEL_PANEL_MAX_RECORDS
}
```

Rendering rules:

* If `isStranger` → return `null`. The section is simply absent for non-bonded agents (v1). Do not render an "Intel hidden" placeholder — avoids implying a mechanic we haven't built yet.
* If `entries.length === 0` → render section header + empty-state copy (italic, muted).
* Else → render section header + one row per entry. Truncate at `maxRecords`; show footer if truncated.

Row layout (matches existing `ThreadDetailView` primitives — no new design tokens):

```
┌──────────────────────────────────────────────────────────────┐
│ [reliable] Shrine Location                        3 days ago │
│ The Weeping Altar at Thornwall — a veiled shrine whose...    │
│ about: Thornwall (location)                                  │
└──────────────────────────────────────────────────────────────┘
```

* Reliability chip at top-left: small colored pill. Colors:
  `reliable` → `--color-success` / green-tinted
  `uncertain` → `--color-warning` / amber-tinted
  `dubious` → `--text-muted` / neutral-dim
* Category label follows chip, `var(--font-display)` small-caps to match existing "Domains" / "Designs" headers (size `--text-xs`).
* Acquired label right-aligned, muted text.
* Record `label` (one line, ellipsis overflow) and `detail` (two-line clamp via `-webkit-line-clamp: 2`) in `--text-base`.
* Target line — shown only when `targetDisplayName` is non-null:
  `about: <targetDisplayName> (<targetKind>)` in muted text.

**Styling:** reuse existing CSS custom properties from `index.css` (`--font-display`, `--font-body`, `--text-xs`, `--text-base`, `--bg-deep`, `--bg-surface`, `--border-gold`, `--text-muted`, `--text-secondary`, `--text-primary`, `--space-1`, `--space-2`, `--space-4`). No new tokens. This matches the `DetailSection` / `DetailField` idiom used elsewhere in `ThreadDetailView`.

**Placement in ThreadDetailView.tsx:**

Add after the "Designs" section in the `AgentDetailBody` component (ThreadDetailView.tsx:541). The panel is part of both the `agentInfoCard`-present branch and the fallback branch (so it shows even when the info card is null — intel matters regardless of knowledge level; fog-of-war is handled by tier, not knowledge).

```tsx
<AgentIntelligencePanel
  entries={intelligenceEntries}
  isStranger={node.tier < INTEL_PANEL_FOG_MIN_TIER}
/>
```

`intelligenceEntries` is `useMemo`'d from `(intelligenceRecords, node.id, graph, currentTick)` — mirrors the `recentEntries` / `strategicSummary` memo pattern already in `AgentDetailBody`.

**Prop surface for ThreadDetailView** (new, additive):

```ts
intelligenceRecords?: readonly IntelligenceRecord[];
```

Added to `ThreadDetailViewProps` and threaded into `AgentDetailBody`. Default undefined → treated as empty. Non-agent categories ignore it. This matches the existing `digestBuffer?` / `strategicState?` optional pattern.

**GameView wiring** (`src/components/Game/GameView.tsx:3055` area):

Add alongside the existing `digestBuffer` prop:

```tsx
intelligenceRecords={
  selectedThreadNode.category === 'agent' ? (gameState.intelligenceRecords ?? []) : undefined
}
currentTick={selectedThreadNode.category === 'agent' ? gameState.tick : undefined}
```

(Note: `currentTick` is already being passed — only `intelligenceRecords` is the new prop here.)

**Notifications:** none. This is a passive read surface. Players discover intel via the existing `intelligence_granted` trace + encounter aftermath card, not via the panel. Avoids a "You've learned something" toast that would conflict with the prose-first, notification-lean aesthetic.

**Debug inspection:** the existing `intelligence_granted` / `intelligence_referenced` traces in the DebugPanel feed tab already cover debug visibility — the panel is the player-facing surface, the trace feed is the developer-facing surface. No new DebugPanel tab needed.

**Hex map signifiers:** N/A. This is agent-detail UI only; nothing on the hex map changes.

**Viewport contract:** the panel lives inside the already-scrolling agent body (`flex: 1; overflow-y: auto` on the outer detail container at `ThreadDetailView.tsx:162`). No new full-screen or modal surface. The truncation at `INTEL_PANEL_MAX_RECORDS` bounds worst-case height inside that scroller so the sidebar can't be overwhelmed.

**Accessibility:**

* Section header is a real `<h3>` / uses the same heading idiom as "Designs".
* Reliability chips have `title` attribute and a `<span class="sr-only">` equivalent (reuse the pattern from existing tier badge).
* Color is never the only signal for reliability — the descriptor word is always present next to the chip.
* Empty state is rendered as text (not hidden with display:none), so screen readers announce "Knows nothing of consequence."

## Wiring section

| Module | Hook | Component |
|---|---|---|
| `src/engine/intelligence.ts` — new `buildIntelligenceDisplay`, `INTEL_CATEGORY_LABELS` const, `INTEL_PANEL_MAX_RECORDS`, `INTEL_PANEL_FOG_MIN_TIER`, `RELIABILITY_RANK_*` constants | Pure function; called from `AgentIntelligencePanel` memo in `ThreadDetailView` | n/a (engine module) |
| `src/components/Game/AgentIntelligencePanel.tsx` — new file | Stateless component; receives resolved entries + stranger flag | Rendered inside `AgentDetailBody` in `ThreadDetailView.tsx` |
| `src/components/Game/ThreadDetailView.tsx` — add `intelligenceRecords?` prop, forward into `AgentDetailBody`, memo → `AgentIntelligencePanel` | `useMemo` on `(intelligenceRecords, node.id, graph, currentTick)` | Integrated into existing agent body column |
| `src/components/Game/GameView.tsx` — pass `gameState.intelligenceRecords ?? []` when selected thread is an agent | Existing detail-panel render path (alongside `digestBuffer`) | n/a (wire-through) |
| `Docs/plans/wiring-checklist.md` — add a row under the Intelligence consumption section for "Player-facing display: AgentIntelligencePanel" (column: Debug visibility → resolved in THR-141) | Documentation update | n/a |

**Trace emission:** none added.
**GameState fields consumed:** `state.intelligenceRecords`, `state.tick` (both already exist).
**Player controls connected:** none — read-only surface.

## Testing strategy

New unit tests (co-located where existing tests live):

* `src/engine/__tests__/intelligenceDisplay.test.ts` (new file):
  * Sort: reliable before uncertain before dubious; within tier, most recent first.
  * `acquiredLabel`: `0 → "today"`, `1 → "1 day ago"`, `5 → "5 days ago"`.
  * Negative `currentTick - acquiredTick` clamps to `"today"`.
  * Unknown category (if union ever grows) defaults safely — enforced by `INTEL_CATEGORY_LABELS` exhaustiveness test (satisfies `Record<IntelligenceCategory, string>`).
  * Graph resolution: actor node → `agent` kind; location node → `location` kind; missing node → `unknown` kind.
  * `targetRegion`-only record → `region` kind, `targetDisplayName === record.targetRegion`.
  * `state.intelligenceRecords` undefined → returns `[]`.
  * `reliability = NaN` → ranked as dubious.
  * Truncation is the caller's concern (helper returns full list); asserted here only that the full list is sorted.

* `src/components/Game/__tests__/AgentIntelligencePanel.test.tsx` (new file):
  * Renders nothing when `isStranger === true`.
  * Renders empty-state copy when bonded + zero entries.
  * Renders one row per entry; reliability chip text = descriptor.
  * Truncation: 30 entries + `maxRecords = 24` → renders 24 rows + "+6 more" footer.
  * `targetDisplayName === null` → omits the "about: ..." line.
  * Target line text matches `about: <name> (<kind>)` format.

* Extend `src/components/Game/__tests__/ThreadDetailView.test.tsx`:
  * New test: agent body includes Intelligence section when `intelligenceRecords` is non-empty and `node.tier >= 1`.
  * New test: agent body omits Intelligence section entirely when `node.tier === 0`.
  * New test: agent body shows empty-state copy when `intelligenceRecords === []` and `node.tier >= 1`.

No contract tests needed — this is pure UI + a pure helper over existing state.

**Pre-commit minimum:** `npm test`, `npx tsc --noEmit`, `npx vite build`.

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | `INTEL_PANEL_MAX_RECORDS`, `INTEL_PANEL_FOG_MIN_TIER`, `RELIABILITY_RANK_*` all named constants. |
| 2. Inspectability | PASS | Reuses existing `intelligence_granted` / `intelligence_referenced` traces; no new traces needed because nothing new happens in the engine. |
| 3. Determinism | PASS | `buildIntelligenceDisplay` is pure (inputs: state slice, agentId, graph, tick). Sort is total (tick tiebreaker on recordId in the rare case of equal ticks). |
| 4. Fail-soft | PASS | Graph lookup, undefined state, NaN reliability, undefined currentTick, tick underflow — all caught per the fail-soft table above. |
| 5. Narrative over mechanical perfection | PASS | Category labels are human-readable; descriptors (reliable/uncertain/dubious) are in-fiction vocabulary; empty-state copy ("Knows nothing of consequence.") is voice-consistent. |
| 6. Additive over destructive | PASS | New file + new optional prop + new exports. Zero existing surfaces deleted. |
| 7. Performance budget | PASS | Rendered only on agent detail panel open. `useMemo`'d so it recomputes only when `intelligenceRecords` / `node.id` / `graph` / `currentTick` change. `INTEL_PANEL_MAX_RECORDS = 24` bounds DOM size. |

## Open questions / decisions that don't need the human

* **Do we group by category or flat-sort?** Flat sort, grouped by reliability rank. Rationale: reliability is the player's decision axis ("is this worth acting on?") more than category. Category is visible on every row via the small-caps label. Revisit if playtest shows player wants to scan by type.
* **Do we show `targetRegion` as a distinct row type?** Yes — `targetKind: 'region'` renders as `about: <region> (region)`. Regions aren't graph nodes so we show the string as-is. Revisit when regions become graph nodes.
* **Does the fallback (`agentInfoCard === null`) branch also get the panel?** Yes. Intel is tier-gated, not knowledge-gated. An agent can be bonded (tier >= 1) without a full info card rendered (e.g. graph mid-tick mutation; the info card has its own builder that can fail). We want intel to survive those mismatches.
* **Stranger cap: v1 hides entirely.** A v2 could show a tease row per category the agent holds ("They keep a shrine secret.") without labels. Tracked informally; not a separate Linear issue until we decide the surface is worth the design work.

## Out of scope (recap)

* Reliability decay over time — THR-137.
* Candidate-visibility gating from intel — THR-138.
* Reaction-variant prose when intel is consumed — THR-139.
* Difficulty reduction from intel — THR-140.
* Cross-agent intel sharing — THR-142.

## Acceptance

* New `buildIntelligenceDisplay` helper exported and covered by unit tests.
* `AgentIntelligencePanel` renders inside agent detail when `node.tier >= 1`; hidden when `node.tier === 0`.
* Empty state reads "Knows nothing of consequence." for bonded agents with zero records.
* Records grouped/sorted reliable → uncertain → dubious; within-tier most recent first.
* Target names resolve through `WorldGraph`; missing nodes degrade gracefully.
* Truncation at 24 entries with "+N more" footer.
* Tests: engine helper (≥8 cases), panel component (≥6 cases), ThreadDetailView integration (≥3 cases).
* `npm test`, `npx tsc --noEmit`, `npx vite build` all clean.
* `Docs/plans/wiring-checklist.md` updated to note the display surface for intel is now live.
* `Docs/changelog.md`, `Docs/project-status.md`, `Docs/project-history.md` updated per Definition of Done.
