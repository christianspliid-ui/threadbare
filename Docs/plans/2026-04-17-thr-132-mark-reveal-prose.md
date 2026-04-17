# THR-132 — Authored Revelation Prose for Hidden Mark Reveal Events

**Linear issue:** THR-132
**Parent:** THR-112 (Hidden mark revelation pathway — shipped 2026-04-17)
**Project:** Encounter Format Migration
**Labels:** Deferral, Content, Engine
**Priority:** Low (P4) — content-quality polish on a shipped loop
**Effort size:** S (half-day)
**Status:** Implementation Planning → Ready for Dev

## Problem

THR-112 closed the hidden mark reveal loop end-to-end — scoring, probabilistic consumption, and decay are all wired, and `hidden_mark_revealed` traces fire reliably. **But the player-facing chronicle event is still a debug string.**

Today, when `consumeMatchingMarks()` reveals a mark, it appends a `TickEvent` of type `ripple_consequence` with this message:

```
A buried truth surfaces: {mark.label}
```

That string is identical regardless of:
- **Category** — a revealed `betrayal` reads exactly the same as a revealed `debt` or `mystical_contract`.
- **Reveal path** — an encounter-consumed mark reads the same as a decay-dropped mark (actually, decay currently emits **no chronicle event at all** — only a trace — so the player sees nothing).
- **Protagonist context** — no name, no location, no pronoun, no enrichment. It's a template variable embedded in what looks like a debug log.

THR-112 explicitly deferred authored revelation prose (design doc `2026-04-17-thr-112-hidden-mark-revelation.md`, Deferrals section) and left a `// TODO(THR-132)` hook at `src/engine/hiddenMarks.ts:204`. This issue cashes that deferral.

The scope in THR-132's Linear description calls for "per-category prose tables (betrayal, debt, secret_knowledge, contamination) with enrichProse() placeholder support." Two corrections inline before we start:
- The `HiddenMarkCategory` union has **seven** values (`src/types/unifiedAction.ts:86`), not four: `betrayal`, `debt`, `secret_knowledge`, `concealed_action`, `forbidden_contact`, `soul_diminishment`, `mystical_contract`. "Contamination" in the Linear description is a loose paraphrase of `soul_diminishment`; we cover all seven.
- The current message is *not* emitted from `phaseHiddenMarkDecay.ts` (decay emits no chronicle event). THR-132 must add one for the decay path on top of rewriting the encounter path.

## Goal

Make mark revelation read like Threadbare fiction, not a template variable. Two reveal paths (encounter-consumed, decay-dropped) × seven categories = fourteen prose tables, each driving a `{name}`/`{location}`/`{their}`/`{mark_label}`-enriched `TickEvent.message`.

**Non-goals:**
- No new placeholder syntax added to the global `enrichProse()`. One narrow in-module substitution for `{mark_label}` (the mark's `label` field) stays local to the new helper so we don't pollute `proseEnrichment.ts` with a token that only applies to mark reveals.
- No per-mark authored prose. The author's per-mark `label` is all the per-mark text we use; everything else comes from category-keyed tables.
- No new modal or toast component. Reveal events already flow through `NarrativeLog` + `ToastStack`; the change is the string, not the surface.
- No rebalance of `REVEAL_EVENT_SIGNIFICANCE` (stays `0.7`). Decay gets a new lower significance so it logs without toasting.

## Design decisions

### D1. Category tables live in a new content file, not in the engine module.

`hiddenMarks.ts` stays engine logic; prose lives in `src/data/hidden-mark-prose.ts`. Same split the repo uses everywhere else (prose-layer-content.ts vs proseResolvers.ts, encounter-content.ts vs encounter code). Content agents can edit the tables without touching engine code — and that is the whole point of the THR-132 rewrite.

### D2. Two tables per category, not one table with a discriminator.

```ts
HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE: Record<HiddenMarkCategory, readonly string[]>
HIDDEN_MARK_DECAY_PROSE:            Record<HiddenMarkCategory, readonly string[]>
```

Rejected: a single table with a `{reveal_path}` placeholder. The prose voices are different enough (encounter reveal is dramatic and present-tense; decay is elegiac and past-tense-leaning) that a single table forces awkward hedging templates. Two tables keeps each set tonally coherent.

### D3. Template choice is deterministic per reveal, matching the existing consumption seed.

`consumeMatchingMarks()` already derives a per-mark seed (`state.seed ^ tick * 97 ^ markId char-hash`) and uses `mulberry32` to roll the reveal probability. The template pick reuses the **same seed** — so for a given (seed, tick, markId) the chosen string is reproducible. Determinism (NFP #3) is preserved without adding a new PRNG surface.

The decay path does **not** currently use PRNG — it's pure arithmetic. Template pick there derives the seed from `state.seed ^ markId char-hash ^ tick` explicitly (no new global PRNG state, no cross-phase coupling).

### D4. Placeholder substitution chain: `{mark_label}` first, then `enrichProse()`.

```
template → substituteMarkLabel(template, mark) → enrichProse(result, ctx) → final message
```

`{mark_label}` is the *only* placeholder specific to mark reveals and is substituted inside `hiddenMarkProse.ts` before delegation to the shared `enrichProse()` path. All other placeholders (`{name}`, `{location}`, `{their}`, `{they}`, `{artifact:any}`, `{ally:strongest}`, conditionals) use the existing enrichment vocabulary — no new tokens leak into `proseEnrichment.ts`.

### D5. Fail-soft: three fallback rungs.

If any of the following fails, we do **not** throw and do **not** drop the chronicle event. We degrade toward the v1 string:

1. `gatherNarrativeContext()` throws or returns null → use an inline minimal context (`{ agentName: 'The marked one', currentLocationName: 'the world', pronouns: default }`), still run enrichment.
2. Category table missing for `mark.category` → fall back to a single cross-category default template (defined in the same file): `"Something long buried rises up: {mark_label}. {name} cannot look away."`.
3. Both fail → the current literal `"A buried truth surfaces: ${mark.label}"`. Never emit an empty string.

This respects NFP #4 — the tick loop never crashes on prose failure.

### D6. Decay gets a chronicle event *and* a new significance constant.

Currently decay is silent to the player. This issue adds a `ripple_consequence` TickEvent at significance `DECAY_EVENT_SIGNIFICANCE = 0.3` (below the `0.5` toast threshold — logs to `NarrativeLog` but does not raise a toast). Encounter-reveal stays at `REVEAL_EVENT_SIGNIFICANCE = 0.7` as before.

Rationale: decay is a gentler beat ("the thing everyone once whispered about has faded") — it should leave a trace in the chronicle but not interrupt the moment. Encounter reveals are dramatic and continue to toast.

---

## Engine pillar

### E1. New module: `src/engine/hiddenMarkProse.ts`

Pure, additive, no new global state. Exports one public function:

```ts
export function generateMarkRevealMessage(
  state: GameState,
  mark: HiddenMark,
  revealedBy: string,        // templateId or 'decay:severity_floor'
  tick: number,
): string;
```

Internal flow:

1. Derive `isDecay = revealedBy.startsWith('decay:')`.
2. Pick table: `HIDDEN_MARK_DECAY_PROSE[mark.category]` if decay, else `HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE[mark.category]`.
3. If table missing/empty → use the cross-category default template (D5 rung 2).
4. Derive template seed: `seed = (state.seed ^ (tick * 97) ^ charHash(mark.markId)) >>> 0`. Same shape as `consumeMatchingMarks` for consistency.
5. `template = pickTemplate(table, seed)` (mulberry32 → index).
6. `stage1 = substituteMarkLabel(template, mark)` — a single regex pass replacing `{mark_label}` with `mark.label`.
7. `ctx = gatherNarrativeContext(state.graph, mark.targetAgentId)` — wrapped in try/catch; on throw, construct a minimal inline context (D5 rung 1).
8. Return `enrichProse(stage1, ctx)`.

Wrap 7–8 in a top-level try/catch; on any uncaught error, return the v1 literal string (D5 rung 3).

### E2. Wire into `hiddenMarks.ts::consumeMatchingMarks()`

Replace lines 206–213 (the `revealEvent` construction) with:

```ts
const revealMessage = generateMarkRevealMessage(s, mark, templateId, tick);
const revealEvent: TickEvent = {
  id: `mark_reveal_${mark.markId}_${tick}`,
  tick,
  type: 'ripple_consequence',
  message: revealMessage,
  significance: REVEAL_EVENT_SIGNIFICANCE,
  actorId: mark.targetAgentId,
};
```

Remove the `// TODO(THR-132)` line. Leave the `// TODO(THR-133)` line alone — that's a separate deferral.

### E3. Add chronicle event to `phaseHiddenMarkDecay.ts`

Inside the `if (decayedSeverity < MARK_DECAY_FLOOR)` branch (currently lines 39–52), after the trace emission and before dropping the mark, append a `TickEvent` to a new local list and return it alongside `hiddenMarks` in the `Partial<GameState>`.

```ts
const decayEvent: TickEvent = {
  id: `mark_decay_${mark.markId}_${tick}`,
  tick,
  type: 'ripple_consequence',
  message: generateMarkRevealMessage(state, mark, 'decay:severity_floor', tick),
  significance: DECAY_EVENT_SIGNIFICANCE,
  actorId: mark.targetAgentId,
};
newTickEvents.push(decayEvent);
```

Return shape becomes:

```ts
return {
  hiddenMarks: nextMarks,
  tickEvents: [...state.tickEvents, ...newTickEvents],
  recentEvents: [...state.recentEvents, ...newTickEvents].slice(-MAX_RECENT_EVENTS),
};
```

(Only include `tickEvents` / `recentEvents` in the return if `newTickEvents.length > 0`, to preserve the existing fast-path when nothing decayed.)

### E4. Constants table

All new constants live in `src/engine/hiddenMarks.ts` next to the existing `REVEAL_EVENT_SIGNIFICANCE` (NFP #1 — every tunable number is named).

| Constant | Value | Range | Purpose |
|----------|-------|-------|---------|
| `DECAY_EVENT_SIGNIFICANCE` (new) | `0.3` | 0.1–0.5 | Chronicle significance for mark decay events. Below `0.5` toast threshold — logs only. |
| `REVEAL_EVENT_SIGNIFICANCE` (existing) | `0.7` | 0.5–1.0 | Chronicle significance for mark-consumed events. Toasts and logs. |
| `MARK_PROSE_DEFAULT_TEMPLATE` (new, in `hiddenMarkProse.ts`) | `"Something long buried rises up: {mark_label}. {name} cannot look away."` | — | Fallback template when category table is missing/empty. |

### E5. Tracing

No new trace category. The existing `hidden_mark_revealed` trace (defined in `src/types/trace.ts:894`) continues to carry `revealedBy`, `markId`, `ticksSincePlacement`. Adding a chronicle event does not require a new trace — the trace is for observability of *why*, the chronicle event is for player-facing *what*.

### E6. Fail-soft table

| Failure case | Fallback behavior |
|--------------|-------------------|
| `gatherNarrativeContext` throws (graph mutation during read, missing agent node) | Inline minimal context (generic name, generic location, they/them); enrichment still runs. |
| Category table missing or empty | Cross-category default template `MARK_PROSE_DEFAULT_TEMPLATE` from `hiddenMarkProse.ts`. |
| `pickTemplate` returns `undefined` (empty table after default fallback) | v1 literal: `"A buried truth surfaces: " + mark.label` — never empty string. |
| `enrichProse` throws (new token mishap) | Wrap in try/catch inside `generateMarkRevealMessage`; fallback to literal string. |
| `mark.label` is empty string or null | Substitute `{mark_label}` → `"a buried thing"`. |
| Trace emission throws (existing pattern) | Already handled by outer try/catch in `consumeMatchingMarks`; no change needed. |

NFP #4 compliance: tick loop continues unconditionally.

---

## Content pillar

### C1. New content file: `src/data/hidden-mark-prose.ts`

Two exports:

```ts
import type { HiddenMarkCategory } from '../types/unifiedAction';

export const HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE:
  Record<HiddenMarkCategory, readonly string[]> = { ... };

export const HIDDEN_MARK_DECAY_PROSE:
  Record<HiddenMarkCategory, readonly string[]> = { ... };
```

Each category gets **5–7 templates per table** (70–98 lines total once you include all seven categories and both tables). Below is the authoring bar with one seed template per category per table; full authoring is CC's content task using the patterns established here.

### C2. Authoring bar

Every template must:
- Use `{mark_label}` once (the author's per-mark label IS the anchor of the line).
- Use `{name}` at least once.
- Use at least one of `{location}`, `{their}`, `{they}`, `{them}` for enrichment surface.
- Be 1–2 sentences. No paragraph prose — this is a chronicle event, not a scene.
- Avoid literal category names in the prose (a `betrayal` template should evoke betrayal without saying the word "betrayal").
- Respect tone split: encounter-reveal is **present-tense, dramatic**; decay is **past-tense-leaning, elegiac**.

### C3. Seed templates (one per cell — full table is CC's authoring work)

**Encounter-reveal table (dramatic, present-tense):**

| Category | Seed template |
|----------|---------------|
| `betrayal` | `"The moment breaks open. {name} sees {their} own face in what {mark_label} exposes — and so does everyone else at {location}."` |
| `debt` | `"A ledger {name} thought long-closed is reopened at {location}: {mark_label}. The tally waits."` |
| `secret_knowledge` | `"What {name} knew, {they} now know {they} know. {mark_label} — and the silence that held it cracks."` |
| `concealed_action` | `"The door {name} closed years ago swings open at {location}. Behind it: {mark_label}, still wet, still warm."` |
| `forbidden_contact` | `"{name} cannot pretend anymore. The thread leads from {their} hand to {mark_label}, and it is visible now."` |
| `soul_diminishment` | `"The hollow {name} has been carrying is suddenly weighed. {mark_label} surfaces, and {their} shadow is thinner than it should be."` |
| `mystical_contract` | `"The signature {name} made in the dark becomes legible at {location}. {mark_label} — and the counterparty is listening."` |

**Decay table (elegiac, past-tense-leaning):**

| Category | Seed template |
|----------|---------------|
| `betrayal` | `"Time did what accusation could not. {mark_label} has blurred into story, and {name} is the one telling it now."` |
| `debt` | `"The creditor has died or forgotten. {mark_label} fades from {name}'s ledger, unreturned and uncollected."` |
| `secret_knowledge` | `"No one asks anymore. {mark_label} has slipped beneath more recent weights, and {name} lets it go."` |
| `concealed_action` | `"The witnesses are dead or departed. {mark_label} survives only in {name}'s sleep, and less and less even there."` |
| `forbidden_contact` | `"The thread frays. {mark_label} is no longer a rope {name} can be pulled by — only a memory of having once been tied."` |
| `soul_diminishment` | `"{name}'s shadow is no thicker, but the world has forgotten to notice. {mark_label} fades into the common weight."` |
| `mystical_contract` | `"The counterparty has found someone easier. {mark_label} lapses, and {name} is released — quietly, without ceremony."` |

### C4. Placeholder inventory the content author may use

All placeholders defined in `src/engine/proseEnrichment.ts` (`enrichProse`) are available, **plus** `{mark_label}` (substituted in `hiddenMarkProse.ts` before delegation). Notably useful:

- `{name}`, `{They}`/`{they}`, `{Them}`/`{them}`, `{Their}`/`{their}`, `{s}`
- `{location}`, `{culture}`
- `{artifact:any}`, `{artifact:weapon}`, `{ally:strongest}`, `{rival:strongest}`, `{faction}`, `{title}`
- `{?has_artifact}...{/has_artifact}`, `{?has_ally}...{/has_ally}`, `{?has_rival}...{/has_rival}`, `{?has_faction}...{/has_faction}` and `{?no_*}` inverses
- `{omen_adj}`, `{omen_verb}`, `{omen_noun}`, `{omen_atmosphere}` (silently empty when no omen active — safe in any template)
- `{doom_adj}`, `{doom_verb}`, `{doom_atmosphere}`

Use of omen/doom vocabulary is **encouraged** for mystical_contract and soul_diminishment especially — those categories benefit most from the cosmological register.

### C5. No new attachment templates, no new encounter templates.

This issue is pure prose-table authoring plus two engine wire-in spots. No changes to `src/data/unified-action-templates.ts`, no changes to attachment files, no changes to encounter-content files.

---

## UI pillar

### U1. Existing chronicle/log surfaces — no component changes

The `TickEvent` shape (`message`, `significance`, `actorId`, `type: 'ripple_consequence'`) is already rendered by:

- `NarrativeLog` — chronicle panel. Renders `message` verbatim; no change needed.
- `ToastStack` — shows events above significance threshold (~0.5). The encounter-reveal event (0.7) continues to toast; the new decay event (0.3) is below threshold and logs only. This is intentional (D6).
- `HexChronicle` — per-hex digest. Already consumes `recentEvents`; picks up new messages automatically.

**No edits** to `NarrativeLog.tsx`, `ToastStack.tsx`, `HexChronicle.tsx`, `GameView.tsx`, or any other component.

### U2. DebugPanel — no new view, existing trace view suffices

`hidden_mark_revealed` traces already render in the DebugPanel trace list under the standard category filter. Since this issue emits the same trace with the same payload (no new fields), no DebugPanel work.

### U3. Visual verification

After CC implements, a manual visual check at `?view=game&seeded` should:

1. Open Debug Panel → CLI → run a batch that places a hidden mark and immediately fires the reveal-family encounter:
   ```
   eval state.hiddenMarks.push({ markId: 'test_1', category: 'betrayal', severity: 1, label: 'the letter {name} burned', sourceEncounterId: 'test', placedTick: state.tick - 5, targetAgentId: '@hero', revealFamilies: ['social.'] })
   ```
   (Use an actual `social.*` templateId present in the seeded game to trigger consumption.)
2. Observe the NarrativeLog — the revealed mark should now read like one of the category templates (not "A buried truth surfaces: ..."), with `{name}` resolved to the hero's name and `{location}` resolved to their current location.
3. Fast-forward ticks until `MARK_DECAY_GRACE_TICKS + ~100` ticks and observe a decay event in the log — same enrichment, elegiac tone.

### U4. No visual signifiers on HexMapV2

Hidden marks remain invisible on the hex map. Player-visible surface is the chronicle only. (If this changes, it's out-of-scope — file a follow-up.)

---

## Wiring

Per `Docs/plans/wiring-checklist.md`:

| Checklist item | Status for THR-132 |
|----------------|--------------------|
| Orchestrator phase | No new phase. `phaseHiddenMarkDecay` (phase 6.7) gets a wider return shape but same slot. |
| Engine module called from orchestrator | Existing wire-in preserved. |
| Modal rendered in GameView JSX | N/A — no modal. |
| GameState field consumed by UI | Existing `state.tickEvents` / `state.recentEvents` — consumed by `NarrativeLog`/`ToastStack`/`HexChronicle`. |
| Traces emitted | Existing `hidden_mark_revealed` trace — no new category, no new shape. |
| DebugPanel visibility | Existing trace view suffices. |
| Prose enrichment integration | `generateMarkRevealMessage()` calls `enrichProse()` via `gatherNarrativeContext(state.graph, targetAgentId)`. |
| Player controls | N/A — passive event surface. |
| Update wiring-checklist.md | **No update needed** — no new surface types. |
| Update systemic-wiring-guide.md | **Optional micro-update** — add `{mark_label}` to the "placeholders available to content authors" list under section on enrichment. One line. CC's call whether to do it in the same PR. |

---

## NFP compliance

| Priority | Status | Note |
|----------|--------|------|
| 1. Tunability | PASS | `DECAY_EVENT_SIGNIFICANCE`, `MARK_PROSE_DEFAULT_TEMPLATE` are named constants; table sizes are tunable by content. |
| 2. Inspectability | PASS | Existing `hidden_mark_revealed` trace carries `markId`, `revealedBy`, `ticksSincePlacement`. Chronicle event carries `actorId` for agent-scoped filtering. |
| 3. Determinism | PASS | Template choice seeded from `(state.seed, tick, markId)` — same reveal → same prose. |
| 4. Fail-soft | PASS | Three-rung fallback chain (D5); tick loop never crashes on prose failure. |
| 5. Narrative over mechanical | PASS-with-note | This is *the* issue where narrative wins — the mechanical path works fine with the v1 string; we're adding prose purely for the story. |
| 6. Additive over destructive | PASS | New file `hiddenMarkProse.ts`, new file `hidden-mark-prose.ts`, new constant `DECAY_EVENT_SIGNIFICANCE`. Two existing functions edited (`consumeMatchingMarks`, `phaseHiddenMarkDecay`) — internal logic only, signatures unchanged. |
| 7. Performance budget | PASS | One lookup + one template pick + one enrichProse pass per mark reveal. Mark reveals are rare (seconds-between at typical play pace). No hot-loop impact. |

---

## Tests

### T1. New: `src/engine/__tests__/hiddenMarkProse.test.ts`

- `generateMarkRevealMessage` returns a non-empty string for every (category × reveal-path) combination — 14 cases.
- Encounter-reveal and decay paths produce **different** strings for the same mark (regression guard against table collision).
- Determinism: same (seed, tick, markId) → same template index.
- Fail-soft rung 1: when graph is `undefined`, function does not throw; result contains `mark.label` substring (label always preserved).
- Fail-soft rung 2: when a category table is mocked empty, result contains `mark.label` substring and is non-empty.
- Fail-soft rung 3: when `enrichProse` is mocked to throw, result equals the v1 literal `"A buried truth surfaces: " + mark.label`.
- All 7 categories covered in both tables (authoring guard: no empty arrays).

### T2. Update: `src/engine/__tests__/hiddenMarkReveal.test.ts`

- Existing assertions on trace emission and mark consumption stay unchanged.
- Add assertion: the `revealEvent.message` added to `state.tickEvents` does **not** start with `"A buried truth surfaces:"` (regression guard: confirms we went through the prose pipeline, not the fallback).
- Add assertion: the message contains the agent name (confirms enrichment ran).

### T3. Update: `src/engine/__tests__/phaseHiddenMarkDecay.test.ts`

- Existing assertions on trace emission stay unchanged.
- Add assertion: when decay drops a mark, `state.tickEvents` gains an event with `significance === DECAY_EVENT_SIGNIFICANCE` and `type === 'ripple_consequence'`.
- Add assertion: decay event message differs from encounter-reveal event message for the same category (table-split regression guard).

### T4. Content coverage test (in `hiddenMarkProse.test.ts` or a new data test)

- Every category has ≥5 templates in each table.
- Every template contains `{mark_label}` and `{name}` (authoring bar enforcement).
- Every template is ≤200 chars (guards against prose blocks that don't fit a toast).

---

## Files changed

### New
- `src/data/hidden-mark-prose.ts` — two prose tables, ~90 lines
- `src/engine/hiddenMarkProse.ts` — `generateMarkRevealMessage`, ~60 lines
- `src/engine/__tests__/hiddenMarkProse.test.ts` — ~80 lines

### Edited
- `src/engine/hiddenMarks.ts` — add `DECAY_EVENT_SIGNIFICANCE` constant; replace the `revealEvent` message in `consumeMatchingMarks`; remove `// TODO(THR-132)`.
- `src/engine/phaseHiddenMarkDecay.ts` — import `generateMarkRevealMessage` and `DECAY_EVENT_SIGNIFICANCE`; append chronicle event in the decay-drop branch; widen return shape.
- `src/engine/__tests__/hiddenMarkReveal.test.ts` — two new assertions (see T2).
- `src/engine/__tests__/phaseHiddenMarkDecay.test.ts` — two new assertions (see T3).
- *(optional)* `Docs/plans/2026-04-16-systemic-wiring-guide.md` — one-line addition of `{mark_label}` to the placeholder inventory.

### Not edited
- `src/engine/proseEnrichment.ts` — no new global placeholders.
- `src/types/unifiedAction.ts` — `HiddenMark` shape unchanged.
- `src/types/trace.ts` — no new trace category.
- `src/types/gameState.ts` — no new field.
- `src/engine/orchestrator.ts` — no new phase, no phase order change.
- Any UI component — rendering path unchanged.

---

## Grey zones / CC decisions

- **Placeholder tokens in specific templates** — the seed templates in C3 use a subset. CC authoring the remaining 4–6 templates per cell can vary which enrichment tokens each template pulls in (e.g., some templates lean on `{ally:strongest}`, others on `{artifact:any}`). Use judgment: one ally-reference every third template is plenty; don't force every template to have every token.
- **Whether to edit `systemic-wiring-guide.md`** — optional. If CC is batching doc updates, add the `{mark_label}` line. If scope creep concern, skip and file a micro-TODO in the Code Hygiene project. Not required for merge.
- **Decay message toast vs log** — spec is "log only, no toast" (`DECAY_EVENT_SIGNIFICANCE = 0.3`). If a later preference surfaces to *also* toast decay events, change the constant only (no code change). No decision required now.

---

## Deferrals / follow-ups

- **THR-132 does not cover per-mark authored prose.** The mark's `label` is still the only per-mark text. A future issue (not filed yet — would go in `Encounter Format Migration` or a new "Prose" project) could introduce `mark.revealProse?: string` allowing individual marks to override the category table. That's a `0.2`-scale change and intentionally out-of-scope here.
- **THR-133 stays separate.** The StrictMode emitTrace-inside-setGameState issue is orthogonal to this one and keeps its own issue.
