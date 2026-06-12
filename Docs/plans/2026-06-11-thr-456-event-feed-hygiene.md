# THR-456 — Event Feed Hygiene: dedupe spam, fix placeholder name leaks, vary prose seams

**Status:** Ready for Dev
**Author:** Cowork (keep-work-flowing, 2026-06-11)
**Linear:** [THR-456](https://linear.app/threadbare/issue/THR-456)
**Project:** Content Architecture (Now)
**Suggested model:** sonnet
**Parallel-safe with:** THR-457 (gameplay observability) — different surfaces; THR-455 (story-so-far digest) — different file surfaces.
**Mutex with:** none. THR-453 (novelty pressure) lands later in encounter scoring, not in chronicle emission; safe to interleave but if both PRs open simultaneously, land THR-456 first because it touches the event emission seam THR-453 will read from.
**Codex review:** yes — aggregation determinism + name-generator constraint regression risk both benefit from independent review.

---

## 1. Problem (from the user, observed at seed 42, t=120, CLI)

1. **Spam:** 11 near-identical `agent_encounter` events in a single tick ("X encounters Y at Golden Wraith Fields" / "…at Frost Clearing"). Same-hex co-location storms produce N² events; the feed reads as a wall of redundant lines.
2. **Placeholder names leak into player prose:** `Elite of Lair 7`, `Wanderer-345`, `Wanderer-342` appear inside `dilemma_resolved` narrative bodies. These are internal IDs, not names.
3. **Unpronounceable procedural names:** `Saawhaiahaiiawhuiel`, `Muwiaaimaiuea`, `Ghurgrukroek` — vowel/consonant clusters the phonetic generator should never have produced.
4. **Template seams visible:** the same `dilemma_resolved` phrasing ("…like two stones settling into the same foundation") appears 4× on one screen. One line has a casing bug after a sentence-ending period ("…that look would haunt everyone who saw it. grief made visible.").

The cumulative effect is the feed reading like a debug log, not a story. This is the single largest player-facing hygiene blocker on the chronicle surface.

---

## 2. Where the bugs live (verified, not guessed)

| Bug | File / line | Mechanism |
|-----|-------------|-----------|
| 11× `agent_encounter` spam | `src/engine/phaseColocationDetection.ts:104` | Inside an observer × target double-loop; each detected pair pushes one event. No per-hex aggregation step exists. |
| `Wanderer-N` last-resort fallback in player prose | `src/data/culture-name-pools.ts:238–240` | `pickCulturalName` fall-through after pool exhaustion + phonetic generator failure. The fallback is *intentional* as a non-crash path; the bug is that the fallback name then flows into `{agent.name}` placeholders without ever being upgraded. |
| `Elite of Lair N` in player prose | (search confirms it is *not* in `culture-name-pools.ts`; needs CC to grep `Elite of Lair` in `src/data/` and `src/engine/` — likely in a monster/wandering-faction spawn path) | Monster/Elite-class agents are spawned with a role-label as their `name` property; that label leaks anywhere `{agent.name}` is substituted. |
| Unpronounceable names | `src/engine/culturePhonetics.ts` → `generatePhoneticName` | No syllable count cap, no consonant-cluster guard, no vowel-run guard. The signature picker can choose runs that compose into `Saawhaiahaiiawhuiel`. |
| Repeated dilemma phrasing | `src/data/narrative-content.ts:816` (and the surrounding pool) | The dilemma_resolved phrase pool is small; the picker has no per-render repetition guard. |
| Casing after `. ` boundary | `src/data/narrative-content.ts` (search needed for the offending entry) | A phrase fragment is concatenated after a sentence-ending period without re-capitalising its first letter. Likely a hand-authored entry that begins lowercase because it was written to follow a comma. |

CC must `grep "Elite of Lair"` and `grep "grief made visible"` to confirm exact files before editing — the user has not specified them and the bug surface may sit in more than one place.

---

## 3. Goals & non-goals

**Goals**

- Same-hex same-tick `agent_encounter` events are aggregated into one synthesized event when group size ≥ `EVENT_AGGREGATE_MIN_GROUP_SIZE` (default 3).
- `Wanderer-N` and `Elite of Lair N` strings never appear in any player-facing chronicle, dilemma, or encounter prose body in a 120-tick CLI smoke.
- Generated phonetic names satisfy syllable and cluster constraints (no >4 syllables, no consonant cluster >2, no vowel run >2).
- No phrasing appears more than twice in any 25-event window of the rendered feed.
- The "grief made visible." style casing bug is fixed at source (capitalise after `. `) and a lint guard prevents recurrence.

**Non-goals**

- Not rewriting the encounter pipeline; not changing what `agent_encounter` *means*. Aggregation is a presentation-time concern.
- Not changing the name generator's culture identity; tone/flavour of names is preserved, only legibility is constrained.
- Not redesigning chronicle UI rendering — feed shape unchanged; aggregated events still render as a single `ChronicleEntryCard`.
- Not solving novelty pressure for *encounter selection* — that is THR-453.

---

## 4. Three-pillar design

### 4.1 Engine

#### 4.1.1 Same-tick co-location aggregation

A new pure aggregator runs **after** `phaseColocationDetection` produces its raw `agent_encounter` events for the tick and **before** chronicle/notification routing.

Module: `src/engine/eventAggregation.ts` (new). Function:

```
aggregateColocationEvents(
  events: TickEvent[],
  rng: () => number,
  state: GameState,
): TickEvent[]
```

Behavior:

1. Partition events by `(type === 'agent_encounter') && (sameHexCoords) && (sameTick)`.
2. For each partition of size `n`:
   - If `n < EVENT_AGGREGATE_MIN_GROUP_SIZE` → pass through unchanged.
   - Else → emit one synthesized event with `actorId` = lexicographically-first observer id (deterministic), `message` from `AGGREGATE_PHRASE_POOL` (e.g. "Seven travellers cross paths at {location}", "A throng gathers at {location}", "Roads converge at {location}: {n} witnesses cross"). Group size is substituted via `{n}` or the closest cardinal word from a small table. Original events are *not* preserved in the visible stream; their ids are attached to the synthesized event's `aggregatedFromIds: string[]` so the debug panel can drill in.
3. Significance of the aggregated event = `max(originalSignificances) + AGGREGATE_SIGNIFICANCE_BUMP` (default +1), capped at the platform max.

Wiring point: `src/engine/orchestrator.ts` — between the colocation phase and the notification router phase. Existing tests on `phaseColocationDetection` continue to pass (raw events still produced); a new contract test on the aggregator covers the merge.

Determinism: the aggregator takes a seeded `rng()` from the existing tick RNG so the picked aggregate phrase is replayable.

Fail-soft: wrap the aggregator body in `try/catch`. On throw, return the input array unmodified and emit `trace: 'chronicle.aggregate_failed'` with the error message.

#### 4.1.2 Name constraints in the phonetic generator

Module: `src/engine/culturePhonetics.ts`. Add inside `generatePhoneticName` after a candidate name is composed:

```
if (
  countSyllables(candidate) > NAME_MAX_SYLLABLES ||
  hasConsonantClusterLongerThan(candidate, NAME_MAX_CONSONANT_CLUSTER) ||
  hasVowelRunLongerThan(candidate, NAME_MAX_VOWEL_RUN)
) {
  // emit `naming.constrained_reject` trace, retry up to NAME_RETRY_BUDGET times
}
```

After `NAME_RETRY_BUDGET` rejections (default 6), fall through to the existing curated pool path — never return an unpronounceable name. Helpers (`countSyllables`, `hasConsonantClusterLongerThan`, `hasVowelRunLongerThan`) live next to the generator and ship with unit tests against a fixture of the known-bad outputs from §1.

#### 4.1.3 Upgrade the `Wanderer-N` fallback

In `src/data/culture-name-pools.ts`'s `pickCulturalName` last-resort branch, replace the `Wanderer-${suffix}` string with a call to `synthesizeFallbackName(rng, signature)` — which composes a name from the *generic* pool plus a deterministic syllable suffix when the generic pool is also exhausted. The synthesized fallback must satisfy the §4.1.2 constraints. If even that fails, emit `naming.fatal_fallback` trace and use a fixed canon list (`"Stranger of the Eastern Road"`, etc.). The constant `WANDERER_FALLBACK_BANNED_PATTERNS` (default: `/^Wanderer-\d+$/`, `/^Elite of Lair \d+$/`) gates the function so the bad strings can never leak even if a different call-site bypasses the proper path.

#### 4.1.4 Spawn-time naming for monster/Elite agents

CC must locate the spawn path that assigns `Elite of Lair N` as `node.properties.name` (likely `src/engine/monsterFactionSeed.ts` based on file scan). The fix: at spawn, call `pickCulturalName` (or a `pickMonsterName` variant if culture lookup is wrong for monsters — accept a `'monstrous'` signature) so monster/Elite agents get a proper name, while preserving their role label as `node.properties.roleLabel` for non-prose contexts (debug panel, faction inspector). Any code that reads `node.name` for player-facing prose is unchanged.

### 4.2 Content

#### 4.2.1 Aggregate phrase pool (new)

Location: `src/data/event-aggregation-content.ts` (new).

A minimum of `AGGREGATE_PHRASE_POOL_MIN` (default 12) distinct phrasings categorised by `crowdSize: 'small' | 'medium' | 'large'`:

- small (3–4): "Three travellers' paths cross at {location}", "A small group gathers at {location}", "Four wanderers converge at {location}"
- medium (5–9): "Seven travellers cross paths at {location}", "A throng gathers at {location}", "Roads converge at {location}: {n} witnesses cross"
- large (10+): "A crowd swells at {location}", "{location} draws {n} souls into its orbit", "The trails of many converge at {location}"

Tone: matches existing chronicle voice (specific, restrained, no exclamation). Each entry is keyed for the content-lint coverage test.

#### 4.2.2 Dilemma_resolved phrase pool expansion + repetition guard

The offending entry at `src/data/narrative-content.ts:816` is one of a small pool. CC must:

1. **Audit the surrounding pool** (the section containing the "two stones settling" line) and confirm the pool size. The user-stated quality bar is `DILEMMA_PHRASE_POOL_MIN_SIZE` (default 12) per resonance category.
2. **Expand** any sub-pool below the minimum to at least 12 entries, written to match existing tone. Authoring constraint: each new entry must pass the meeting-encounter-prose voice eval (see prose-content-systems skill).
3. **Add a per-render repetition guard.** Picker accepts a `recentlyUsedPhraseIds: string[]` argument; weights against the last `DILEMMA_PHRASE_REPETITION_GUARD_WINDOW` (default 4) used phrasing ids. Implementation: a small `pickWithRepetitionGuard(pool, rng, recentlyUsedIds, guardWindow)` helper in `src/engine/proseSelection.ts` (new) that returns the lowest-recently-used candidate with deterministic tie-break. Add `phraseId` to every pool entry.

#### 4.2.3 Casing bug fix

CC greps for `grief made visible` (and any other obvious lowercase-after-period candidates) and:

1. Fixes the offending content entries at source (capitalise after `. `).
2. Adds a content-lint test `narrativeContent.casing.test.ts` that fails if any string in the published narrative pools contains the regex `/\.\s+[a-z]/` (after stripping template placeholders). Pattern extends THR-345.

### 4.3 UI

- **Feed rendering unchanged in shape** — aggregated `agent_encounter` events render in the existing `ChronicleEntryCard` with no new component. The aggregated event uses the same fields any other event uses; the aggregation is invisible to the renderer.
- **Debug visibility** — the Debug Panel's chronicle tab gets a small "(N members)" suffix on aggregated entries, expanding to show the original member ids on click. This is the only UI delta; gated behind the existing debug-mode flag, no impact on player UI.
- **Browser-verify artefact at 1920×1080:** screenshot of the chronicle/event feed after a 120-tick `?view=game&seeded&size=medium` run; console output via `mcp__playwright__browser_console_messages`; one `window.__DEBUG.exportDiagnostics()` snippet showing the new `aggregatedFromIds` field present in at least one entry.

---

## 5. Constants table (NFP #1: Tunability)

| Constant | Default | File | Purpose |
|----------|---------|------|---------|
| `EVENT_AGGREGATE_MIN_GROUP_SIZE` | 3 | `eventAggregation.ts` | Smallest same-hex same-tick group that triggers collapse |
| `EVENT_AGGREGATE_GROUP_WINDOW_TICKS` | 1 | `eventAggregation.ts` | Tick window for grouping (1 = same tick only) |
| `AGGREGATE_PHRASE_POOL_MIN` | 12 | `event-aggregation-content.ts` | Min total aggregate phrases (lint enforced) |
| `AGGREGATE_SIGNIFICANCE_BUMP` | 1 | `eventAggregation.ts` | Significance increment for synthesised events |
| `NAME_MAX_SYLLABLES` | 4 | `culturePhonetics.ts` | Hard cap for generated names |
| `NAME_MAX_CONSONANT_CLUSTER` | 2 | `culturePhonetics.ts` | Max consecutive consonants |
| `NAME_MAX_VOWEL_RUN` | 2 | `culturePhonetics.ts` | Max consecutive vowels |
| `NAME_RETRY_BUDGET` | 6 | `culturePhonetics.ts` | Retries before falling back to curated pool |
| `DILEMMA_PHRASE_POOL_MIN_SIZE` | 12 | `narrative-content.ts` lint | Per-category minimum pool size |
| `DILEMMA_PHRASE_REPETITION_GUARD_WINDOW` | 4 | `proseSelection.ts` | Last-K phrase ids weighted against |
| `WANDERER_FALLBACK_BANNED_PATTERNS` | `[/^Wanderer-\d+$/, /^Elite of Lair \d+$/]` | `culture-name-pools.ts` | Hard block on legacy fallback strings leaking |

---

## 6. Tracing (NFP #2: Inspectability)

New trace types (add to the existing trace registry):

```ts
interface ChronicleAggregatedTrace {
  kind: 'chronicle.aggregated';
  tick: number;
  hexCoords: { col: number; row: number };
  memberCount: number;
  memberIds: string[];
  phraseId: string;
}

interface NamingConstrainedRejectTrace {
  kind: 'naming.constrained_reject';
  tick: number;
  cultureId: string;
  rejectedCandidate: string;
  reason: 'syllables' | 'consonants' | 'vowels';
  attempt: number;
}

interface NamingFatalFallbackTrace {
  kind: 'naming.fatal_fallback';
  tick: number;
  cultureId: string;
  fallbackName: string;
}

interface ProseRepetitionSkipTrace {
  kind: 'prose.repetition_skip';
  tick: number;
  phraseId: string;
  lastUseTick: number;
}

interface ChronicleAggregateFailedTrace {
  kind: 'chronicle.aggregate_failed';
  tick: number;
  errorMessage: string;
}
```

All traces flow through the existing `traceBuffer` and are visible in the Debug Panel.

---

## 7. Fail-soft table (NFP #4)

| Failure | Fallback | Trace emitted |
|---------|----------|---------------|
| `aggregateColocationEvents` throws | Return input unchanged | `chronicle.aggregate_failed` |
| Phonetic generator exhausts retry budget | Fall through to curated pool path | `naming.constrained_reject` (one per attempt) |
| Curated pool + generic pool + synthesised fallback all fail | Use fixed canon list (`STRANGER_OF_THE_EASTERN_ROAD` etc.) | `naming.fatal_fallback` |
| Repetition-guard picker can't find any phrase outside the recent window | Pick the least-recently-used; never return null | none (expected branch) |
| Aggregate phrase pool below `AGGREGATE_PHRASE_POOL_MIN` | Lint test fails at CI; runtime still picks from whatever exists | none (CI gate) |
| Casing-lint regex misfires | Test fails locally; CI gate | none (test gate) |

---

## 8. Wiring section (against `Docs/plans/wiring-checklist.md`)

| Surface | Hook |
|---------|------|
| Orchestrator phase order | `eventAggregation` runs after `phaseColocationDetection`, before `notificationRouter` |
| GameState consumption | No new GameState fields; aggregated events flow through the existing `tickEvents` array. `aggregatedFromIds` is an optional event field. |
| UI component | `ChronicleEntryCard` reads `aggregatedFromIds` only for the debug "(N members)" affordance; player render path unchanged |
| Trace registry | Five new kinds (§6) added to `src/engine/traceBuffer.ts` and `src/types/trace.ts` |
| Debug panel | Chronicle tab shows aggregated badge when `aggregatedFromIds?.length > 0`; click-expand lists member ids |
| Prose pipeline | `pickWithRepetitionGuard` is the new picker entrypoint for any pool that needs the guard; existing `pickFromPool` callers are *not* migrated en masse — only the dilemma_resolved path and the aggregate-phrase path use the new helper in this ticket. Broader migration is deferred. |
| Player controls | None — no new player-facing toggle |

---

## 9. Definition of done

- [ ] All seven content/engine changes shipped behind the constants in §5
- [ ] New unit tests:
  - `eventAggregation.test.ts` — group size, tie-break determinism, fail-soft passthrough
  - `culturePhonetics.constraints.test.ts` — every known-bad output (§1) is rejected; constraint helpers covered
  - `culture-name-pools.fallback.test.ts` — `Wanderer-N` / `Elite of Lair N` strings never leak via `pickCulturalName`; the banned-pattern guard fires
  - `proseSelection.test.ts` — repetition guard behavior over a fixed pool and rng
  - `narrativeContent.casing.test.ts` — content-lint regex over all published pools (extends THR-345 pattern)
  - `event-aggregation-content.lint.test.ts` — `AGGREGATE_PHRASE_POOL_MIN` enforced
- [ ] 120-tick CLI smoke (`printf "tick 120\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) shows:
  - No `Wanderer-\d+` or `Elite of Lair \d+` strings in any emitted event message body (grep the exported events)
  - No same-hex same-tick `agent_encounter` cluster of size ≥3 in the visible stream (must be aggregated)
  - The phrase "like two stones settling into the same foundation" appears at most once per 25-event window
- [ ] Browser screenshot at 1920×1080 of `?view=game&seeded&size=medium` chronicle/event feed after 120 ticks
- [ ] Console output via `mcp__playwright__browser_console_messages` pasted as evidence
- [ ] `window.__DEBUG` snippet showing at least one aggregated event with non-empty `aggregatedFromIds`
- [ ] All standard pre-commit checks pass (`npm test`, `npx tsc --noEmit`, `npx vite build`, `npm run check:process`)
- [ ] Commit body includes `Fixes THR-456`
- [ ] Update `Docs/plans/wiring-checklist.md` with the new aggregation phase entry
- [ ] Update `Docs/plans/2026-04-16-systemic-wiring-guide.md` if `pickWithRepetitionGuard` becomes a recommended content-author helper (probably yes — note it as the canonical pattern for any pool that should not repeat in a render window)

---

## 10. NFP Compliance summary

| NFP | Verdict |
|-----|---------|
| 1. Tunability | PASS — eleven named constants in §5 |
| 2. Inspectability | PASS — five trace kinds in §6, debug-panel surfacing |
| 3. Determinism | PASS — aggregator and picker both consume the existing seeded RNG; no `Math.random` use |
| 4. Fail-soft | PASS — every new path has an explicit fallback (§7) |
| 5. Narrative over mechanical perfection | PASS — aggregation favors flavor over information completeness (debug retains the full member list) |
| 6. Additive over destructive | PASS — `aggregatedFromIds` is an *optional* event field; raw events remain available pre-aggregation; existing picker callers unchanged |
| 7. Performance budget | PASS — aggregation is O(n) per tick, n bounded by ~hundreds of events; constraint regex on names runs at spawn only |

---

## 11. Three-pillar verdict

- **Engine** — addressed in §4.1
- **Content** — addressed in §4.2
- **UI** — addressed in §4.3 (debug-panel-only; player feed shape unchanged, verification required per §9)

---

## 12. Acceptance criteria (mirrors Linear issue)

1. 120-tick CLI run shows no placeholder names in any event body
2. No >2 identical phrasings per 25-event window
3. No same-hex same-tick `agent_encounter` cluster left un-aggregated when group size ≥ 3
4. Feed-quality lint tests added (extends THR-345 pattern)

---

## Coordination block

- **Suggested model:** sonnet
- **Parallel-safe with:** THR-457 (different files: KPI/funnel vs aggregation/naming/pools)
- **Mutex with:** none
- **Codex review:** yes
