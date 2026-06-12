# THR-455 — Story-so-far digest for threaded agents

**Date:** 2026-06-11
**Linear:** [THR-455](https://linear.app/threadbare/issue/THR-455/story-so-far-digest-for-threaded-agents-complete-the-read-the-threads)
**Project:** Attention Tier Model
**Parent design:** `Docs/plans/2026-04-05-attention-tier-model-design.md`
**Priority:** High
**Status:** Ready for Dev (plan-pending-commit)

---

## 1. Context

The core-loop promise is "one complex story at a time." The Attention Tier Model shipped its substrate (digest buffer, attention pool, thread tugs, story-beat queue, `ReadTheThreadsPanel`, `ThreadsPanel`, `ThreadDetailView`). What is **missing** is the per-thread narrative composition: when the player clicks an agent in the right-bar `ThreadsPanel`, the resulting `ThreadDetailView` currently shows `RecentActivityLog` — a chronological list of digest entries with capability deltas and outcome words.

A list of events is not a story. The promise of "follow one threaded agent like a continuing story" is not delivered by a flat log of "Sparred at Ironhold. Success. (+0.3 Iron)" lines. Today's CLI run (seed 42, t120) confirmed the symptom from another angle: 11 near-identical `agent_encounter` lines in a single tick — high noise, zero accumulation, no current-tension readout, nothing for the player to come back to.

THR-455 completes the Read-the-Threads vision **at the per-thread level**: each agent thread surfaces a composed **story-so-far** (narrative beats stitched into prose) plus a single **current-tension line** ("Kael circles the warlord's camp; the tribute is three days overdue").

The cross-court `ReadTheThreadsPanel` (divine action, modal, grouped-by-reach) is **out of scope** — it already exists and the per-thread digest is a separate surface accessed by clicking a thread row in the right bar. This plan only touches the agent branch of `ThreadDetailView`; location/faction/army/artifact branches remain as-is.

---

## 2. What ships in this ticket

A composed narrative digest, per threaded agent, that reads as a continuing story:

```
═══ KAEL THORNWEAVER ═══
Current — circling the warlord's camp. The tribute is three days overdue.

So far —
  Two days ago, Kael was wounded at the Ashen Pass. The cut runs deep.
  Since then, the Weavers' Circle has sent word twice; the answer is silence.
  Last morning, Kael drilled the guard at Ironhold. They begin to listen.
  The merchant's debt comes due tomorrow. Kael has not decided what to bring.
```

Three pieces:

1. **Current-tension line** (1 sentence) — composed from the agent's *open* state at the current tick: active encounter, unresolved obligation, present threat. Uses `enrichProse()` placeholders. Updates every tick the agent's state changes.
2. **Story-so-far digest** (3–6 sentences) — composed from selected significant beats over the digest-buffer window. Each beat is one sentence of prose, written with transition phrases that imply continuity ("Two days ago…", "Since then…", "Last morning…").
3. **Empty state** — when a thread is new or quiet, the digest reads as an opening line ("The thread is fresh. Nothing has yet happened along it.") rather than blank.

---

## 3. Engine pillar

### 3.1 Beat selection — what goes in the story

Beat selection runs **lazily**, on read, from the existing `digestBuffer`. No new tick phase. The selector takes an `agentId`, the buffer, the current tick, and a lookback window, and returns an ordered list of `SelectedBeat` records.

```typescript
// src/engine/threadDigest.ts (new)

export interface SelectedBeat {
  entry: DigestEntry;
  significance: number;     // composite score, 0–1
  role: BeatRole;            // 'opener' | 'pivot' | 'compound' | 'closer'
  ticksAgo: number;          // currentTick - entry.tick
}

export type BeatRole = 'opener' | 'pivot' | 'compound' | 'closer';
```

**Significance score** combines five signals — every weight is a named constant in `attention-constants.ts`:

| Signal | Source | Weight constant |
|---|---|---|
| Notable flag | `entry.isNotable` (already on DigestEntry) | `BEAT_SIG_NOTABLE` (0.40) |
| Capability delta magnitude | `max(abs(capabilityChanges))` | `BEAT_SIG_CAPABILITY` (0.15) |
| Attachment churn | `attachmentsGained.length + attachmentsLost.length > 0` | `BEAT_SIG_ATTACHMENT` (0.15) |
| Quintessence delta magnitude | `abs(quintessenceDelta)` | `BEAT_SIG_QUINTESSENCE` (0.15) |
| Recency boost | `1 - (ticksAgo / lookback)` | `BEAT_SIG_RECENCY` (0.15) |

Sort descending by significance, take top `STORY_DIGEST_MAX_BEATS` (default 5), then re-sort the kept set ascending by tick so the narrative reads forward in time.

**Beat role classification** drives prose template selection (Section 4):

- `opener` — oldest beat in the kept set; gets "Days ago…" / "It began with…" transitions
- `pivot` — single beat with the highest significance score in the set; gets a heavier transition ("Then…" / "Everything changed when…")
- `closer` — most recent beat in the kept set; gets "Last morning…" / "By yesterday…"
- `compound` — everything else; gets connective phrases ("Since then…", "Soon after…")

If the buffer holds fewer than `STORY_DIGEST_MIN_BEATS` (default 2) eligible entries, the selector returns `[]` and the UI renders the empty state instead. Single-beat digests look like incident reports, not stories — the threshold is deliberate.

### 3.2 Current-tension state

A pure function over the agent's current world state — no buffering, no new state field:

```typescript
// src/engine/threadDigest.ts

export interface CurrentTension {
  kind: TensionKind;
  // Resolved fields for the prose template:
  agentId: string;
  reachDomain?: ReachDomain;
  factionName?: string;
  attachmentLabel?: string;
  locationName?: string;
  ticksUntilDue?: number;
}

export type TensionKind =
  | 'active_encounter'      // in unifiedActions / encounterProgress
  | 'open_wound'             // condition attachment present
  | 'faction_debt'           // owedTo edge + age threshold
  | 'pending_obligation'    // encounter_seed scheduled for this agent
  | 'doom_pressure'          // doom clock crossed near-tier boundary for relevant reach
  | 'idle';                  // none of the above
```

Resolution order is the union enumeration above — `active_encounter` wins over `open_wound` wins over `faction_debt` etc. `idle` is the only fallback; the prose template for `idle` is the rest-state line.

Selection logic is a thin read pass over existing graph queries — no new edges, no new node types, no new versioning. It runs on render in the UI hook (Section 5.3), memoized on `worldVersion` so the line doesn't recompute every frame.

### 3.3 Story composition

`composeThreadStory(graph, agent, beats, tension, currentTick)` returns a `ThreadStoryComposition`:

```typescript
export interface ThreadStoryComposition {
  agentId: string;
  agentName: string;
  currentTickWhenComposed: number;
  tensionLine: string;          // already-enriched prose
  beatLines: string[];           // already-enriched prose, ordered oldest → newest
  lookbackTicks: number;
  beatCount: number;
  isEmpty: boolean;              // true when both tensionLine === idle line AND beatLines.length === 0
}
```

Composition pipeline per beat:

1. Look up prose template via `(beat.role, beat.entry.reachPrimary, beat.entry.success)` tuple (Section 4.1).
2. Build `NarrativeContext` for the agent via existing `proseEnrichment` helpers, augmented with `ticksAgo`, `encounterName`, `locationName`, `attachmentsGained[0]?`, `attachmentsLost[0]?`.
3. Run `enrichProse(template, context)` to resolve placeholders + conditionals.
4. Apply transition-phrase prefix from a small per-role pool (Section 4.2) seeded by `(agentId, tick, beatIndex)` for deterministic variety.

The tension line follows the same enrichment pipeline using a template keyed by `(TensionKind, reachDomain?)`.

### 3.4 Trace

```typescript
// src/types/attention.ts (extend)

export interface ThreadStoryComposedTrace extends TraceBase {
  category: 'thread_story_composed';
  agentId: string;
  tensionKind: TensionKind;
  beatCount: number;
  lookbackTicks: number;
  emptyState: boolean;
}
```

Emitted once per UI render of a non-empty digest (rate-limited per `(agentId, currentTick)` so opening and closing the panel does not spam). Lets the agent-analyser skill see which threads compose vs which fall through to empty state, and surfaces "every threaded agent fell to empty state" as a content-coverage red flag.

### 3.5 No new GameState fields

The plan deliberately keeps composition lazy and stateless. The digest buffer already accumulates everything needed; adding a `threadStoryCache` map invites cache-invalidation bugs (THR-282 land-mine: graph mutates in place, identity-based caches go stale). The session `SimulationRuntime` may hold a memoization keyed on `(agentId, worldVersion)` to avoid recomputing within a tick — that is the only caching layer.

---

## 4. Content pillar

### 4.1 Beat prose templates

A new file `src/data/thread-digest-content.ts` exports a `BEAT_TEMPLATES` table indexed by `(role, reach, success)`. Coverage matrix:

- 4 roles × 8 reaches × 2 success states = 64 cells
- v1 ships **3 variants per cell** (192 templates) so the same beat reads differently across re-opens of the same thread

Authoring rules — every template:

- Uses the systemic placeholders from `proseEnrichment.ts` (`{name}`, `{they}/{them}/{their}/{s}`, `{location}`, `{faction}`, `{artifact:any}`, `{ally:strongest}`, `{rival:strongest}`)
- Uses at least one conditional block (`{?has_faction}…{/has_faction}`, etc.) so the line *uses* the agent's relationship state instead of decorating around it
- Reads as one sentence (target 12–28 words); no list items, no stats, no parentheses with numbers
- Names the reach implicitly through verb + object, not by saying "Iron" or "+0.3 Iron"

Example cell — `(opener, iron, success)`:

```typescript
[
  "It began at {location}, where {name} took the measure of the guard and was not turned away.",
  "{Name}'s name first reached the watch{?has_faction} of {faction}{/has_faction} after the drill at {location} — a clean line of blades, no blood spilled.",
  "Days ago, {name} drew steel at {location}{?has_rival} where {rival:strongest} had warned {them} not to{/has_rival}. The strike held.",
],
```

Example cell — `(pivot, heart, failure)`:

```typescript
[
  "Then the bond broke at {location}. {?has_ally}{Ally:strongest} watched, said nothing.{/has_ally}{?no_ally}There was no one to witness the breaking, which {name} will tell {them}selves was the mercy.{/no_ally}",
  "Everything turned at {location}. {Name} spoke and was not believed{?has_faction} — not even by {faction}{/has_faction}.",
  "It was at {location} that {name}'s tongue failed {them}. The word went out anyway, sharper for being mangled.",
],
```

### 4.2 Transition phrases

`TRANSITION_PHRASES` — pools per `BeatRole`, seeded by PRNG. Per role:

- `opener`: `["Days ago,", "It began with,", "Once,", "Before all this,"]`
- `compound`: `["Since then,", "Soon after,", "Then,", "Not long after,"]`
- `pivot`: `["Then everything turned —", "And then,", "What followed was —", "From there,"]`
- `closer`: `["Last morning,", "By yesterday,", "And just now,", "As of this morning,"]`

The selector picks one per beat using `seededPick(transitionPool, agentId, beatIndex, currentTick / 12)` — same agent on the same game day gets the same phrasing, so reopening the panel doesn't reshuffle the prose under the player.

### 4.3 Current-tension templates

`TENSION_TEMPLATES` — one cell per `TensionKind`, with 3 variants each. Examples:

```typescript
active_encounter: [
  "{Name} is at {location}, {?has_ally}with {ally:strongest},{/has_ally} working an opening in the {reach} of things.",
  "Right now, {name}'s hand is on the matter at {location}. {?has_rival}{Rival:strongest} knows.{/has_rival}",
  "{Name} circles the {location} hold; the outcome is not yet written.",
],
open_wound: [
  "The cut from {location} still runs in {them}. {Name} does not move easily.",
  "{Name} carries the wound from {location} like a debt — owed inward.",
  "Days since the bleeding at {location}, and the dressing is fresh again.",
],
faction_debt: [
  "{?has_faction}{Faction} has sent word twice; {name} has answered neither time.{/has_faction}{?no_faction}A guild that does not yet exist will remember this.{/no_faction}",
  "The promise to {faction} comes due. {Name} has not chosen what to bring.",
  "{Name} owes {faction} an answer. The silence is louder by the day.",
],
pending_obligation: [
  "Tomorrow brings a thing {name} has not chosen to face.",
  "{Name} has an unkept appointment. It will keep itself, with or without {them}.",
  "Something is moving toward {name} along a thread {they} cannot see.",
],
doom_pressure: [
  "The sky above {location} reads wrong to anyone who knows {reach}. {Name} feels it as a weight at the back of the neck.",
  "Something larger than {name} presses on the {reach} of things. {They} cannot name it yet.",
  "{Reach} bends out of true near {name}. The world is asking something of {them}.",
],
idle: [
  "{Name} rests. The thread is quiet.",
  "Nothing moves along {name}'s thread this hour.",
  "{Name} is at peace, for now — peace being the absence of demands one has noticed.",
],
```

### 4.4 Empty-state lines

`EMPTY_THREAD_LINES` — when there are <`STORY_DIGEST_MIN_BEATS` beats AND tension is `idle`:

```typescript
EMPTY_THREAD_LINES: [
  "The thread is fresh. Nothing has yet been written along it.",
  "{Name}'s story has not yet begun in any way worth telling.",
  "The thread hums faintly. {Name} has done nothing yet that the world will remember.",
],
```

### 4.5 Content acceptance bar

- Every line passes the **Threadbare voice check** (per `prose-content-systems` skill): present tense for tension, past for beats, no statistics in prose, no IPK code-style names ("the warlord", not "warlord-7")
- Every line uses at least one enrichment placeholder
- Every cell has 3 variants (no single-variant cells)
- A test in `src/engine/__tests__/threadDigest-content.test.ts` asserts: 192 beat templates exist, 18 tension templates exist (6 kinds × 3), all templates pass a literal-placeholder-leak regex (`/\bWanderer-\d+\b|\bElite of\b|\{[a-z_]+\}/` on enriched output must yield zero matches across a synthetic 50-agent sweep)

---

## 5. UI pillar

### 5.1 New component

`src/components/Game/StorySoFarPanel.tsx`:

```typescript
interface StorySoFarPanelProps {
  composition: ThreadStoryComposition;
  lastViewedTick: number;          // for new-content indicator
}
```

Rendering:

```
┌──────────────────────────────────────┐
│ Current                              │  ← uppercase, --text-xs, --text-tertiary, label
│ Kael circles the warlord's camp; the │  ← --text-base, --text-primary, body font
│ tribute is three days overdue.       │
│                                      │
│ ──── Story so far ────                │  ← gold divider with small-caps label
│ Days ago, Kael took the measure of   │  ← each beat its own row,
│ the guard at Ironhold and was not    │     reach colour dot on the left,
│ turned away.                          │     muted tick number on the right
│ Since then, the Weavers' Circle has  │
│ sent word twice; the answer is        │
│ silence.                              │
│ Then everything turned — Kael spoke  │  ← pivot row gets a subtle gold
│ at the council and was not believed.  │     left border (--accent-gold/30%)
│ Last morning, Kael drilled the       │  ← most recent beat
│ guard at Ironhold.                    │
└──────────────────────────────────────┘
```

Layout rules:

- Tension block: small "Current" label, then prose at body size; no icon, no badge — the prose carries the weight
- Beat block: `── Story so far ──` divider header (existing `SectionHeading` primitive), then one prose row per beat
- Each beat row: 6px reach colour dot (existing `REACH_DOT_COLORS` map in `RecentActivityLog`), prose body, faint right-justified `t{tick}` tertiary text
- Pivot beat: 2px solid `--accent-gold` left border at 30% opacity, no other styling change
- New-content indicator: any beat where `entry.tick > lastViewedTick` gets a small `•` glyph at the very left (existing pattern from `RecentActivityLog`)
- Empty state: single italic line, `--text-secondary`, no divider, no beats

All measurements through CSS variables in `src/styles/`. No hex colors hardcoded in component (reach palette comes from the shared `REACH_DOT_COLORS` constant; if it doesn't already live in a shared file, extract during implementation — small, in-scope refactor).

### 5.2 ThreadDetailView wiring

In `src/components/Game/ThreadDetailView.tsx::AgentDetailBody`:

1. Add a `useThreadStorySoFar(graph, node.id, currentTick, digestBuffer, runtime)` hook (Section 5.3).
2. Replace the two existing `<RecentActivityLog entries={recentEntries} lastViewedTick={lastViewedTick} />` mounts (lines 599–602 and 671–674) with `<StorySoFarPanel composition={composition} lastViewedTick={lastViewedTick} />`.
3. Behind a feature flag `STORY_SO_FAR_DIGEST_ENABLED` (default `true`, exposed in `?view=cms` constants). When disabled, fall back to `RecentActivityLog` so the change is reversible without code.

`RecentActivityLog` is **not** deleted in this ticket — it remains accessible behind the flag and as the data source for the `AgentProfileModal` "Background Record" tab (Section 7.5 of the parent design), which is not a narrative surface.

### 5.3 Hook

`src/components/Game/hooks/useThreadStorySoFar.ts`:

```typescript
export function useThreadStorySoFar(
  graph: WorldGraph,
  agentId: string,
  currentTick: number,
  digestBuffer: DigestEntry[],
  runtime?: SimulationRuntime,
): ThreadStoryComposition {
  const worldVersion = useWorldVersion();
  return useMemo(
    () => runtime?.threadStoryCache.getOrCompute(
      agentId, worldVersion,
      () => composeThreadStory(graph, agentId, digestBuffer, currentTick),
    ) ?? composeThreadStory(graph, agentId, digestBuffer, currentTick),
    [agentId, worldVersion, currentTick],
  );
}
```

The runtime cache is bounded (LRU, size = `STORY_DIGEST_CACHE_SIZE` = 32). Eviction is per-session — the cache lives on the `SimulationRuntime`, not at module scope. This follows the load-bearing rule from CLAUDE.md ("Engine caches must be owned per session").

### 5.4 Debug bridge extension

Add to `window.__DEBUG`:

```typescript
__DEBUG.getThreadStory(agentRef: string): ThreadStoryComposition | null
```

Resolves agent by exact id / partial id / partial name, runs `composeThreadStory`, returns the composition. Logs to console + returns. Lets the agent-analyser skill and CC sweep "does every threaded agent compose a non-empty digest after N ticks?" headlessly.

### 5.5 Empty-state behaviour

When `composition.isEmpty === true`:

- Tension block renders an empty-state line (Section 4.4) in italic, `--text-secondary`
- Story-so-far divider and beat list do **not** render
- The panel does not collapse — the empty-state line is shown at the same vertical position the tension line would occupy, so re-renders don't reflow the panel

---

## 6. Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | This ticket |
|---|---|
| Orchestrator phase | **None added.** Composition is lazy/on-read; the digest buffer already accumulates via `phaseAttention` |
| New GameState fields | **None.** Composition is a pure function over `graph` + `digestBuffer` + `currentTick` |
| New runtime cache | `SimulationRuntime.threadStoryCache` — bounded LRU, session-scoped (CLAUDE.md load-bearing rule) |
| New tracing | `ThreadStoryComposedTrace` emitted at most once per `(agentId, currentTick)` from the UI hook |
| New UI components | `StorySoFarPanel` (component), `useThreadStorySoFar` (hook) |
| Existing UI modified | `ThreadDetailView::AgentDetailBody` — two `RecentActivityLog` mounts swapped for `StorySoFarPanel` behind feature flag |
| Debug bridge | `__DEBUG.getThreadStory(agentRef)` added; documented in `debug-bridge.d.ts` and CLAUDE.md §Debug Bridge |
| Prose pipeline | `composeThreadStory` calls `enrichProse()` per beat — uses the existing systemic pipeline, no new resolver layer |
| Player controls | None added — this is a read surface; intervention still flows through ActionDrawer |
| CMS / constants | New `attention-constants.ts` entries (Section 8) registered in `tunableConstants.ts` |
| IA manifest | `ThreadsPanel` → `ThreadDetailView` is already registered; add `reads[]` entry for `digestBuffer` + `threadStoryCache` |

---

## 7. Constants (NFP #1 — Tunability)

All exported from `src/data/attention-constants.ts` and registered in `src/components/CMS/tunableConstants.ts` under the existing **"Attention & Notification Tiers"** group.

| Constant | Default | Purpose |
|---|---|---|
| `STORY_DIGEST_LOOKBACK_TICKS` | 36 | Window of digest buffer to compose from (3 game days) |
| `STORY_DIGEST_MAX_BEATS` | 5 | Max beats included in a composed story |
| `STORY_DIGEST_MIN_BEATS` | 2 | Below this, render empty state instead |
| `STORY_DIGEST_CACHE_SIZE` | 32 | Max cached compositions per runtime |
| `BEAT_SIG_NOTABLE` | 0.40 | Weight: `isNotable` flag |
| `BEAT_SIG_CAPABILITY` | 0.15 | Weight: capability delta magnitude |
| `BEAT_SIG_ATTACHMENT` | 0.15 | Weight: attachment gained/lost |
| `BEAT_SIG_QUINTESSENCE` | 0.15 | Weight: quintessence delta magnitude |
| `BEAT_SIG_RECENCY` | 0.15 | Weight: recency boost |
| `BEAT_SIG_PIVOT_MIN` | 0.55 | Min score to flag a beat as `pivot` (else compound) |
| `TENSION_DEBT_AGE_TICKS` | 24 | Faction obligation older than this becomes a `faction_debt` tension |
| `STORY_SO_FAR_DIGEST_ENABLED` | true | Master flag; false reverts to `RecentActivityLog` |

---

## 8. Tracing (NFP #2 — Inspectability)

| Trace | When emitted | Fields |
|---|---|---|
| `ThreadStoryComposedTrace` | UI hook fires `composeThreadStory` and the result is non-cached | `category, agentId, tensionKind, beatCount, lookbackTicks, emptyState` |

Composition is a pure function — when debugging "wrong beat selected for Kael," inspect the trace, replay `composeThreadStory(graph, "kael-id", buffer, tick)` in the CLI (`eval`), and walk the significance scores. No mutable state to chase.

The trace is **rate-limited** per `(agentId, currentTick)` — opening and closing the panel emits one trace, not two.

---

## 9. Fail-soft (NFP #4)

| Failure | Fallback |
|---|---|
| Digest buffer empty for agent | Empty-state composition (no beats, tension is `idle` or computed) |
| Beat prose template missing for a `(role, reach, success)` cell | Falls back to `(compound, reach, success)`; if that's also missing, `("It happened at {location}.", success)` |
| `enrichProse()` returns empty string | Skip the beat (don't emit a blank line); log a `prose_enrichment_failed` trace |
| Agent has no graph node (deleted mid-encounter) | Hook returns empty composition; component renders empty state; never throws |
| `runtime.threadStoryCache` missing | Hook falls through to inline computation (no caching, no break) |
| Current-tension resolution throws | Caught at hook boundary; tension defaults to `idle` empty-state line |
| Composition exceeds `STORY_DIGEST_MAX_BEATS` after a buffer rebuild | Truncated to max; never resizes UI |
| Feature flag disabled | `RecentActivityLog` renders as before; no behaviour change |

---

## 10. NFP Compliance

| Priority | NFP | Status | Notes |
|---|---|---|---|
| 1 | Tunability | PASS | 12 named constants, all CMS-registered. Significance weights, lookback, cache size, pivot threshold, debt age threshold all tunable. |
| 2 | Inspectability | PASS | `ThreadStoryComposedTrace`. Composition is a pure function — replayable via `__DEBUG.getThreadStory()` or CLI `eval`. No hidden state. |
| 3 | Determinism | PASS | Transition phrases use `seededPick` keyed on `(agentId, tick / TICKS_PER_DAY, beatIndex)`. Beat ordering by significance is stable (ties broken by tick ascending). Same buffer + same tick → same composition. |
| 4 | Fail-soft | PASS | Eight fallback paths enumerated above. Composition never throws; missing templates degrade gracefully. |
| 5 | Narrative over mechanical | PASS | Stats are not in prose. The score is internal; the player sees prose. Tension is a present-tense reading of the agent's situation, not a list of conditions. |
| 6 | Additive over destructive | PASS | No GameState fields added. `RecentActivityLog` preserved behind flag. New file, new component, new hook — no modification of existing engine signatures. |
| 7 | Performance budget | PASS with note | Composition is O(buffer_size_per_agent) — bounded by `STORY_DIGEST_LOOKBACK_TICKS`. LRU cache amortizes panel reopens. Profile target: <2ms per agent compose on a `large` map mid-game. Add a cheap timing trace if profiling shows >5ms. |

---

## 11. Three-pillar check

- **Engine** — beat selection, current-tension resolution, composition function, runtime cache, trace, debug bridge extension. New file `src/engine/threadDigest.ts`. No tick phase changes.
- **Content** — 192 beat templates (4 roles × 8 reaches × 2 outcomes × 3 variants), 18 tension templates (6 kinds × 3 variants), 16 transition phrases (4 roles × 4 variants), 3 empty-state lines, in `src/data/thread-digest-content.ts`. All use `enrichProse` placeholders + conditionals.
- **UI** — `StorySoFarPanel` component, `useThreadStorySoFar` hook, `ThreadDetailView::AgentDetailBody` wiring change, feature-flag fallback to `RecentActivityLog`. No layout reflow on render. Empty state has a non-blank line.

Wiring section ties them together (Section 6).

---

## 12. Blast radius

Codesight files-with-importers check (Section "Codesight" of CLAUDE.md):

- `src/engine/digestBuffer.ts` — 18 importers; this plan **does not modify** existing exports, only reads
- `src/types/attention.ts` — read-only; this plan **adds** `ThreadStoryComposedTrace` and `TensionKind` exports
- `src/components/Game/ThreadDetailView.tsx` — modified, but only the `AgentDetailBody` internal helper; public props unchanged

No high-impact files (>=100 importers) are touched in a way that ripples — schema additions only, no removals or renames. No Blast Radius section escalation needed.

---

## 13. Acceptance / Done When

- [ ] `composeThreadStory` returns a non-empty composition for a bonded First agent after 60 ticks in `?view=game&seeded`
- [ ] `__DEBUG.getThreadStory('@hero')` returns a composition with `beatCount >= 2` and `tensionKind !== 'idle'` for a played-in seeded game at tick >=60
- [ ] All 192 beat templates and 18 tension templates exist with 3 variants each; placeholder-leak regex test passes across a 50-agent synthetic sweep
- [ ] Browser-verify per Definition of Done: screenshot of `ThreadsPanel` → click bonded First → `StorySoFarPanel` at 1920×1080, console (errors+warnings filter), `__DEBUG.getThreadStory('@hero')` state assertion in the commit body
- [ ] Feature flag `STORY_SO_FAR_DIGEST_ENABLED=false` cleanly reverts to `RecentActivityLog` (smoke check: open panel both ways, no crash, no console error)
- [ ] Empty-state line renders correctly when buffer has <2 eligible beats AND tension is `idle` (test in `StorySoFarPanel.test.tsx`)
- [ ] CLI smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) reaches tick 30 cleanly — engine module added but no tick-phase behavior changed, so the lift is small
- [ ] Pre-commit minimum (CLAUDE.md §Testing): `npm test`, `npx tsc --noEmit`, `npx vite build` all green; output pasted in closing commit / completion comment

---

## 14. Coordination block

**Suggested model:** sonnet (required label: `model:sonnet`)
**Parallel-safe with:** THR-457 (gameplay observability — orthogonal harness work), THR-456 (event feed hygiene — different surface), THR-406 (Codex queue), THR-453 (template novelty pressure — engine scoring layer, no surface overlap)
**Mutex with:** none — this is a self-contained plan; `ThreadDetailView::AgentDetailBody` is not in any other Ready-for-Dev coordination block
**Codex review:** no

**Files to touch (CC reference):**
- `src/engine/threadDigest.ts` (new)
- `src/data/thread-digest-content.ts` (new)
- `src/data/attention-constants.ts` (add 12 constants)
- `src/components/CMS/tunableConstants.ts` (register new constants)
- `src/components/Game/StorySoFarPanel.tsx` (new)
- `src/components/Game/hooks/useThreadStorySoFar.ts` (new)
- `src/components/Game/ThreadDetailView.tsx` (swap two `RecentActivityLog` mounts behind feature flag)
- `src/engine/simulationRuntime.ts` (add `threadStoryCache` field)
- `src/types/attention.ts` (extend with `ThreadStoryComposedTrace`, `TensionKind`)
- `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (add `getThreadStory`)
- `src/engine/__tests__/threadDigest.test.ts` (new)
- `src/engine/__tests__/threadDigest-content.test.ts` (new — placeholder-leak sweep)
- `src/components/Game/__tests__/StorySoFarPanel.test.tsx` (new)
- `CLAUDE.md` (extend §Debug Bridge with `getThreadStory`)
- `Docs/plans/wiring-checklist.md` (note the new component + hook + cache)
- `src/data/ia-manifest.ts` (extend `ThreadDetailView` reads[] with `digestBuffer`, `threadStoryCache`)
