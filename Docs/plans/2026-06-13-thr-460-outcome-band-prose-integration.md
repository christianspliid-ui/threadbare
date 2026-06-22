> **title:** THR-460 — Outcome-band prose integration (Phase 6 Slice B)
> **linear_issue:** THR-460
> **author:** Cowork (keep-work-flowing scheduled run)
> **created:** 2026-06-13
> **three_pillars:** Engine `done` · Content `done` · UI `N/A — verify-only (Slice C owns card face)`

# THR-460 — Outcome-band prose integration (Phase 6 Slice B)

Wire `OutcomeConsequence.narrativeTag` into the prose pipeline so the six-band outcome ladder produces visibly differentiated prose for the player, with a content pool large enough to read as varied rather than canned.

## Why this is load-bearing

THR-63 Slice A (shipped 2026-06-12) split outcomes into six bands and attached a `narrativeTag` (`'surge' | 'strained' | 'setback' | 'catastrophe' | 'fortunate' | 'neutral'`) to every `OutcomeConsequence`. **But nothing reads it.** `outcomeConsequences.ts:93` still carries the deferred-comment `@deferred — No live prose consumer in Phase 3. Scaffolded for Phase 4+ enrichProse() integration` — and grep confirms `OUTCOME_BAND_PROSE` and `OUTCOME_BAND_Q_FLAVOR` do **not** exist anywhere in `src/`. The THR-460 description claims Slice A shipped those tables; the codebase says otherwise. Slice B's first job is to build the missing tables and the consumer; the second is to author enough entries that the bands read as distinct.

Without this hookup, exit criterion 3 from THR-63 ("loot tier prose reads distinctively by band — human QA review") cannot be met, the six-band split THR-451 + Slice A worked toward is invisible to the player, and the recent gameplay-fun sprint (THR-451 / THR-453 / THR-455 / THR-456 — all shipped 2026-06-11/12) loses its prose-side payoff.

### Codebase reality (verified 2026-06-13 via grep)

| Claim in THR-460 description | Actual state on `main` |
|---|---|
| "Slice A shipped `OUTCOME_BAND_PROSE` in `src/data/narrative-content.ts`" | ❌ Table absent. `grep -rn "OUTCOME_BAND" src/` returns hits only in `effect-shell-proof-templates.ts`, `choiceResolution.ts`, etc. — unrelated `outcomeBand` step-resolution field. |
| `OUTCOME_BAND_Q_FLAVOR` in `quintessence-content.ts` | ❌ Absent. `quintessence-content.ts` defines `QUINTESSENCE_LEXICON` + `QUINTESSENCE_TOOLTIPS`; no band-keyed prose. |
| `narrativeTag` reaches `enrichProse()` | ❌ `proseEnrichment.ts:229` `enrichProse()` knows `omenAdj` / `doomVerb` / `intelligence` / `cause` but has no narrativeTag awareness. `NarrativeContext` (`proseEnrichment.ts:80–110`) has no band field. |
| `phraseId` repetition guard already used for band prose | ❌ Only consumed by `eventAggregation.ts` (THR-456) and the orchestrator's dilemma prose pool. Reusable surface exists (`pickWithRepetitionGuard` in `src/engine/proseSelection.ts`) but no caller wires it to band prose. |

So Slice B is not "expand an existing pool" — it is **build the pool, build the consumer, wire it through `NarrativeContext`, then seed three-to-five entries per band**. The original THR-460 description under-scoped the work by one engine hook and one content-table creation. This plan corrects the scope honestly.

## Engine pillar

### Systems design

Two changes, both additive:

1. **Extend `NarrativeContext`** with an optional `outcomeBand?: OutcomeBand` field (type alias for `'surge' | 'strained' | 'setback' | 'catastrophe' | 'fortunate' | 'neutral'`). Callers that have a resolved outcome populate it; callers that don't (idle prose, narrative-tier templates) leave it undefined.
2. **Add a placeholder block to `enrichProse`** that, when `ctx.outcomeBand` is set, resolves the new placeholders `{outcome_phrase}` and `{q_flavor}` via the new content tables — using `pickWithRepetitionGuard` and a per-actor `usedOutcomeBandPhraseIds: Set<string>` cache stored on `SimulationRuntime`. When `ctx.outcomeBand` is unset, both placeholders resolve to the empty string (silent fallback, same pattern as `{omen_adj}` / `{doom_verb}`).

The selection is a thin pure function — no orchestrator phase changes, no graph mutations.

### Graph nodes / edges

None new. Read-only consumer of `OutcomeConsequence.narrativeTag` produced by the existing resolution phase.

### Tick phases

None new. The hookup site is the existing prose-enrichment call inside `unifiedActionResolution` (and `returnEngine` for return-leg prose, and `threadDigest` for digest beats) — wherever `gatherNarrativeContext` → `enrichProse` runs after a step resolves.

### Resolution logic

`pickWithRepetitionGuard(pool, rng, usedIds)` already exists and already mutates `usedIds`. Wire it with:

- `pool = OUTCOME_BAND_PROSE[ctx.outcomeBand]` (returns `PhraseEntry[]`)
- `rng = SimulationRuntime.rng` (existing seeded PRNG)
- `usedIds = runtime.outcomeBandPhraseHistory.get(actorId) ?? new Set()` (lazy-init)

Eviction window is the same constant as `eventAggregation` uses for dilemma prose (12 entries). One named constant: `OUTCOME_BAND_PHRASE_HISTORY_WINDOW = 12`.

### PRNG callouts

Single call site: `pickWithRepetitionGuard` reads `rng.nextFloat()`. No `Math.random()` introduced. `enrichProse` itself stays pure — the random call lives in the helper invoked from the regex substitution closure (mirrors how `eventAggregation` already does it; see `eventAggregation.ts:149`).

## Content pillar

### Prose tables

New file `src/data/outcome-band-content.ts` exporting two tables of `PhraseEntry[]` keyed by `OutcomeBand`. Minimum **3 entries per band, target 5 entries per band** so the dedup guard has slack. Slice A's intent ("3–5 varied entries with phraseId for dedup guard") is the floor.

```ts
import type { PhraseEntry } from '../engine/proseSelection';
import type { OutcomeBand } from '../engine/outcomeConsequences';

export const OUTCOME_BAND_PROSE: Record<OutcomeBand, PhraseEntry[]> = {
  surge: [
    { phraseId: 'surge.exceeds_grasp',
      text: 'The work outpaces what {they} had thought possible — clean, finished, unflinching.' },
    { phraseId: 'surge.thread_holds',
      text: 'Some line beneath the action holds steady, and {they} feel{s} the world widen for a breath.' },
    // ... +3 more entries
  ],
  fortunate: [ /* near_miss prose — "progress, not arrival" */ ],
  strained: [ /* success_at_cost — "got it, paid for it" */ ],
  neutral: [ /* baseline success — quiet competence */ ],
  setback: [ /* failure — "did not land; the world notes nothing" */ ],
  catastrophe: [ /* critical_failure — visible recoil */ ],
};

export const OUTCOME_BAND_Q_FLAVOR: Record<OutcomeBand, PhraseEntry[]> = {
  /* Q delta flavor — one short clause apiece, used to qualify the chronicle row's
   * Q annotation rather than replace it: "a surge through the seams" / "a thin drain" */
};
```

### Authoring rubric (Threadbare aesthetic, per `Docs/canon/prose.md`)

Every entry must:

1. **Open with sensory or scene detail** — not a label ("success", "failure", "critical"). The band IS the label; the prose carries the feel.
2. **Player-as-god framing** — second-person of *the agent*, not of the player. The player is reading, not acting.
3. **Concrete nouns** — "the thread", "the blade", "the seam" — not "the action", "the attempt".
4. **No mechanical leakage** — never reference Q numerically, never reference `success_at_cost` or `near_miss` as terms.
5. **Carry a phraseId** of form `<band>.<short_slug>` (e.g. `surge.thread_holds`, `setback.silence_after`).
6. **Differentiate visibly across bands** — a `surge` line and a `fortunate` line should not be swappable. Tag the cosmic flavor: surge = "exceeds", fortunate = "approaches", neutral = "completes", strained = "barely", setback = "misses", catastrophe = "recoils".

Per-band starter sets are sketched in §"Authoring stubs" at the bottom of this plan; CC may expand them, but the rubric above is non-negotiable.

### Encounter templates

No template edits in this slice. Encounter authors continue writing per-template prose; the band layer renders alongside, via the new `{outcome_phrase}` placeholder which authors can drop into their prose blocks if they want band-flavored continuations. Slice B is the infrastructure landing; per-template adoption is opportunistic and lives in Slice B-followups (one per encounter family).

### Replace hardcoded outcome-band strings (cleanup pass)

Grep for hardcoded outcome-tier strings in encounter prose. The only known site that hardcodes outcome flavor in player-facing copy is the Quintessence chronicle annotation in `useEncounterToast` — replace its inline ternary with a `pickFromBandPool('quintessence_flavor', ctx.outcomeBand)` call. If grep surfaces additional sites, route through the same helper.

## UI pillar

**UI: N/A — verify-only.** No new surface. Existing toast (from THR-63 Slice A) and chronicle row (from THR-63 Slice A) already render band-differentiated content; this slice changes what *text* renders inside them, not the surface itself. Browser-verify artifact below confirms the rendered text differs visibly across bands at 1920×1080.

The MTG-style card outcome face redesign is Slice C (THR-461) — explicitly out of scope.

### Browser-verify artifact

Required per Definition of Done § Browser-verify UI changes:

1. **Screenshot at 1920×1080** of (a) the chronicle panel with three consecutive entries spanning at least two distinct bands, (b) the encounter resolution toast for a near_miss / `fortunate` outcome. Use Playwright `preview_resize(1920, 1080)` → `preview_screenshot` (DOM surfaces).
2. **Console output** via `mcp__playwright__browser_console_messages` (errors + warnings filter) pasted as a fenced block — empty result rendered as `(no errors or warnings)`.
3. **`__DEBUG` state assertion** — `window.__DEBUG.consequencesFor(actorId, 5)` returning the last five consequences with non-empty `narrativeTag` and `dropIntent`, plus a second assertion via a new debug helper `window.__DEBUG.bandPhraseUsage(actorId)` returning the `Set<string>` of phraseIds used for that actor in this session (proves the dedup guard is wired).

## Constants table (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `OUTCOME_BAND_PHRASE_HISTORY_WINDOW` | `12` | Number of recently-used phraseIds retained per actor before eviction; mirrors `eventAggregation`'s window for consistency. |
| `OUTCOME_BAND_PROSE_MIN_POOL_SIZE` | `3` | Hard minimum pool size per band; lint test fails if any band's pool drops below this. Floor below which dedup guard cannot do useful work. |
| `OUTCOME_BAND_PROSE_TARGET_POOL_SIZE` | `5` | Authoring target; lint test warns (not fails) if below target. |
| `OUTCOME_BAND_Q_FLAVOR_MIN_POOL_SIZE` | `3` | Same floor for Q flavor pool. |

All four exported from `src/data/outcome-band-content.ts`. Tunable in one place.

## Trace types (NFP #2)

Add one trace category to `src/types/trace.ts` (and re-export from `traceBuffer.ts`):

```ts
export interface OutcomeBandProseSelectedTrace {
  category: 'outcome_band_prose_selected';
  tick: number;
  actorId: string;
  band: OutcomeBand;
  phraseId: string;
  poolSize: number;
  rejectedDueToHistory: number;  // how many entries the guard skipped
  source: 'prose' | 'q_flavor';
}
```

Emitted from inside the `pickWithRepetitionGuard` wrapper that the new placeholder substitution calls. Surfaces in `__DEBUG.getTraces()` and the DebugPanel trace tab. Lets us answer "why did the player just see the same line twice?" without instrumenting per-call.

## Fail-soft table (NFP #4)

| Failure case | Fallback |
|---|---|
| `ctx.outcomeBand` is undefined | `{outcome_phrase}` and `{q_flavor}` resolve to `''` (silent — same as omen / doom placeholders when not set). |
| `OUTCOME_BAND_PROSE[band]` returns empty array | Resolve placeholders to `''`; emit a `prose_pool_empty` warn trace; never throw. |
| All entries in the pool are in `usedIds` | `pickWithRepetitionGuard` already handles this (re-picks from full pool, evicts oldest). Trace records `rejectedDueToHistory` to surface saturation. |
| Actor lacks `usedOutcomeBandPhraseIds` cache | Lazy-init an empty Set on first read; cache lives on `SimulationRuntime`, scoped to session per the runtime-cache-ownership load-bearing decision in CLAUDE.md. |
| Trace buffer full | Drop trace silently — never block tick. |

The tick loop must never crash on this path. Every exit is a return.

## Wiring section

Cross-reference: `Docs/plans/wiring-checklist.md`.

| Surface | Wired by |
|---|---|
| Orchestrator phase | None new. Existing prose-enrichment site in `unifiedActionResolution` and `returnEngine` continues to call `enrichProse(template, ctx)`; ctx now carries `outcomeBand`. |
| GameState fields | None new on `GameState`. New transient state on `SimulationRuntime`: `outcomeBandPhraseHistory: Map<string, Set<string>>` (per-actor → recently-used phraseIds). |
| Traces | New `outcome_band_prose_selected` category in `src/types/trace.ts`. Re-export from `traceBuffer.ts`. |
| Debug bridge | Add `window.__DEBUG.bandPhraseUsage(actorId)` returning the Set for that actor. Document in `src/debug-bridge.d.ts`. |
| UI components | None new. Existing toast and chronicle row pick up the changed prose text. |
| Prose enrichment | `enrichProse` extended with `{outcome_phrase}` and `{q_flavor}` substitutions. `NarrativeContext` gains optional `outcomeBand` field. Callers in `unifiedActionResolution`, `returnEngine`, `threadDigest` populate `outcomeBand` from the resolved consequence. |
| Player controls | None new. |
| Systemic wiring guide | Update `Docs/plans/2026-04-16-systemic-wiring-guide.md` with the new placeholder vocabulary so future content authors discover it. |

Update `Docs/plans/wiring-checklist.md` in the same PR with the new trace category, the `bandPhraseUsage` debug bridge entry, and the new placeholders.

## Tests

Extend the test suite (add, don't reorganize):

1. `outcomeBandProse.test.ts` (new) —
   - Each of the six bands has ≥ `OUTCOME_BAND_PROSE_MIN_POOL_SIZE` entries.
   - Each phraseId is unique across all six pools.
   - Every entry's `text` contains at least one of `{they}`, `{them}`, `{their}`, or `{name}` (rubric #2: agent-framed).
   - Same checks for `OUTCOME_BAND_Q_FLAVOR`.
2. `proseEnrichment.test.ts` (extend) —
   - `{outcome_phrase}` and `{q_flavor}` resolve to non-empty string when `ctx.outcomeBand` is set.
   - Both resolve to `''` when `ctx.outcomeBand` is undefined.
   - Repetition guard rejects a recently-used phraseId for the same actor on a re-run with the same seed.
3. `outcomeBandProseTrace.test.ts` (new) —
   - `outcome_band_prose_selected` trace fires when the placeholder is resolved.
   - Trace contents include `band`, `phraseId`, `poolSize`, `rejectedDueToHistory`.
4. **Lint pass** (extend the existing content-lint suite from THR-345 / THR-386) — fail the build if any band's prose pool drops below the floor constant; warn (don't fail) if below target.

## NFP compliance summary

| NFP | Status | Note |
|---|---|---|
| 1 — Tunability | PASS | 4 named constants in `outcome-band-content.ts`; no inline magic numbers. |
| 2 — Inspectability | PASS | New `outcome_band_prose_selected` trace + `__DEBUG.bandPhraseUsage` surface. |
| 3 — Determinism | PASS | Single PRNG call via `pickWithRepetitionGuard`; same seed + same usedIds → same phraseId. |
| 4 — Fail-soft | PASS | 5 failure cases enumerated, all return-only. Silent-fallback pattern mirrors omen/doom precedent. |
| 5 — Narrative over mechanical | PASS | Whole slice exists to make the six-band mechanical split readable as story; rubric forbids mechanical leakage in prose entries. |
| 6 — Additive over destructive | PASS | New file, new context field, new placeholders, new trace. No existing prose entry is rewritten. The `{outcome_phrase}` placeholder is opt-in per encounter author. |
| 7 — Performance budget | PASS | One regex substitution + one `pickWithRepetitionGuard` call per `enrichProse` invocation when `outcomeBand` is set. No new allocations in the tick hot path beyond the per-actor `Set<string>` (bounded by `OUTCOME_BAND_PHRASE_HISTORY_WINDOW`). |

## Vision audit

This slice continues the through-line of the 2026-06-11/12 sprint: "make following threaded agents feel like a story, not a log." The Vision premise at stake is **"prose-first per design memory: no numbers, IPK keywords where relevant"** (Vision/01-core-loop) — currently the outcome band is encoded mechanically but read as nothing. Slice B is the conversion of mechanical state into the prose surface the Vision specifies. No Vision edit required; this is the implementation catching up to a settled premise.

## Rulebook impact

None. Slice B does not change a rule of play. No turn structure, action verb, prerequisite, resource, encounter, or clock changes. `Docs/canon/rulebook.md` does not need editing.

## Done when

- [ ] `src/data/outcome-band-content.ts` exists with `OUTCOME_BAND_PROSE` and `OUTCOME_BAND_Q_FLAVOR` tables
- [ ] Every band has ≥ 3 entries (target: 5) — content-lint test enforces the floor
- [ ] `NarrativeContext.outcomeBand?: OutcomeBand` added; type exported from `outcomeConsequences.ts`
- [ ] `enrichProse` resolves `{outcome_phrase}` and `{q_flavor}` via `pickWithRepetitionGuard`
- [ ] `unifiedActionResolution`, `returnEngine`, and `threadDigest` populate `ctx.outcomeBand` from the resolved consequence
- [ ] `SimulationRuntime.outcomeBandPhraseHistory: Map<string, Set<string>>` lazily initialized
- [ ] `outcome_band_prose_selected` trace defined in `src/types/trace.ts`, emitted from the selection helper, visible in DebugPanel
- [ ] `window.__DEBUG.bandPhraseUsage(actorId)` returns the Set
- [ ] `outcomeConsequences.ts:93` deferred-comment removed (or updated to reference the live consumer)
- [ ] `Docs/plans/wiring-checklist.md` updated with new trace category, `bandPhraseUsage`, and the two new placeholders
- [ ] `Docs/plans/2026-04-16-systemic-wiring-guide.md` updated with the new placeholder vocabulary in the enrichment-placeholders section
- [ ] `npm test` green, `npx tsc --noEmit` clean, `npx vite build` succeeds — raw output pasted into closing commit body or Linear closeout comment
- [ ] Engine smoke: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` runs without exceptions, status block shows non-zero agent count, at least one `outcome_band_prose_selected` trace appears
- [ ] Browser-verify artifact: 1920×1080 screenshot of chronicle + toast across two distinct bands, console output captured, `__DEBUG.bandPhraseUsage` assertion paste
- [ ] Closing commit body includes `Fixes THR-460` for the auto-close workflow

## Coordination block

- **Suggested model:** sonnet (pattern-following content + thin engine wiring; matches the Slice A `model:sonnet` precedent)
- **Parallel-safe with:** THR-461 (Slice C — UI card face; touches different files), any Continuous Improvement / Coordination Protocol work not in `src/engine/proseEnrichment.ts` or `src/data/narrative-content.ts`
- **Mutex with:** any in-flight work touching `src/engine/proseEnrichment.ts`, `src/data/narrative-content.ts`, `src/types/trace.ts`, or `src/engine/outcomeConsequences.ts`. None in flight as of 2026-06-13 11:45 UTC (all queues empty).
- **Codex review:** no — judgment-light pattern-following content + a single small engine hook; the structural review GitHub Action on the PR is sufficient.

## Files to touch

**New:**
- `src/data/outcome-band-content.ts`
- `src/engine/__tests__/outcomeBandProse.test.ts`
- `src/engine/__tests__/outcomeBandProseTrace.test.ts`

**Modified:**
- `src/engine/proseEnrichment.ts` — extend `NarrativeContext`, add two placeholders
- `src/engine/outcomeConsequences.ts` — export `OutcomeBand` type union; remove the deferred-comment on `narrativeTag`
- `src/engine/unifiedActionResolution.ts` — populate `ctx.outcomeBand` from the resolved consequence
- `src/engine/returnEngine.ts` — same population for return-leg prose
- `src/engine/threadDigest.ts` — same population for digest beats
- `src/engine/orchestrator.ts` (or wherever `SimulationRuntime` is constructed) — initialize `outcomeBandPhraseHistory` Map
- `src/types/trace.ts` — new trace category
- `src/engine/traceBuffer.ts` — re-export
- `src/debug-bridge.ts` + `src/debug-bridge.d.ts` — `bandPhraseUsage`
- `Docs/plans/wiring-checklist.md` — checklist updates
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — placeholder vocabulary section

## Authoring stubs (starter prose; CC may expand)

CC should treat these as starter entries to extend — each band needs to reach the target of 5 entries. The phraseIds below are stable; new entries follow the `<band>.<short_slug>` convention.

**surge** (`critical_success` — exceeds grasp):
- `surge.exceeds_grasp` — "The work outpaces what {they} had thought possible — clean, finished, unflinching."
- `surge.thread_holds` — "Some line beneath the action holds steady, and {they} feel{s} the world widen for a breath."
- `surge.seam_opens` — "A seam opens in the resistance, and {they} pass{s} through without a word."

**fortunate** (`near_miss` — almost arrived):
- `fortunate.no_arrival` — "Not yet — but {they} feel{s} the shape of it now, closer than before."
- `fortunate.path_marked` — "The thing recedes, but it leaves a path marked for next time."
- `fortunate.next_breath` — "Another breath and {they} would have had it. The breath does not come."

**neutral** (`success` — quiet competence):
- `neutral.done_clean` — "The work resolves. Nothing dramatic; nothing wasted."
- `neutral.seam_closes` — "The seam closes behind {them}, and {they} move{s} on."

**strained** (`success_at_cost` — got it, paid for it):
- `strained.thread_holds_one_breaks` — "{They} get{s} what {they} came for. Something else gives way."
- `strained.bought_with` — "It is done — and bought with a coin {they} did not mean to spend."

**setback** (`failure` — missed):
- `setback.silence_after` — "Nothing changes. The silence afterwards is the answer."
- `setback.thread_goes_slack` — "The thread {they} were pulling on goes slack in {their} hand."

**catastrophe** (`critical_failure` — visible recoil):
- `catastrophe.thread_snaps_back` — "The thread snaps back, and the world notices."
- `catastrophe.something_loosed` — "Something is loosed by the failure that {they} cannot put back."

`OUTCOME_BAND_Q_FLAVOR` follows the same pattern but each entry is a clause, not a sentence — joined as `+0.02Q (a surge through the seams)` in chronicle annotations.

## Open questions (none blocking)

1. Should the `{outcome_phrase}` placeholder live in `proseEnrichment.ts` directly (matches omen/doom precedent), or in a sibling module `outcomeBandProse.ts` for tidiness? Recommendation: sibling module, imported and called from `enrichProse`. Keeps `proseEnrichment.ts` from growing unbounded as more context-injected tag families land.
2. Should `narrativeTag === 'neutral'` populate `outcomeBand`, or be treated as "no band" for prose purposes? Recommendation: populate it (a quiet `neutral` line is still a band-specific beat) — easier to author than to reason about an absent state.

Neither blocks Slice B. CC may verdict both inline or punt to Slice B-followups.
