# THR-453 — Template Novelty Pressure: recency penalty + category quotas in encounter scoring

**Status:** Ready for Dev
**Author:** Cowork (keep-work-flowing, 2026-06-11)
**Linear:** [THR-453](https://linear.app/threadbare/issue/THR-453)
**Project:** Agent Success Redesign (Next)
**Suggested model:** sonnet
**Parallel-safe with:** THR-456 (event feed hygiene — disjoint surfaces; chronicle emission vs. scoring), THR-457 (gameplay observability — funnel counters live alongside but don't collide with the multiplicative novelty term).
**Mutex with:** any other concurrent work touching `src/engine/encounterScoring.ts` (the `scoreAndSelect` function body), `src/engine/phaseAgentDecision.ts` (the commit-time bump site at line ~958), or `src/types/gameState.ts` (new optional top-level field). If THR-456 lands first, no rebase needed — surfaces are disjoint.

---

## 1. Problem (from the user, CLI evidence)

Seed 42, 120 ticks, 109 encounters fired. The top 8 templates account for **>50% of all encounters**:

- `commune_with_stars` ×11
- `sharpen_blades` ×10
- `local_tales` ×9
- `confront_the_unknown` ×7
- (plus four more 5–6× templates)

The catalogue has 210+ templates. The player sees the same five mundane beats on loop. The chronicle reads as repetition, not variety, even when underlying agents and locations differ.

**Why repetition wins today:** `scoreAndSelect` (`src/engine/encounterScoring.ts:734`) has *per-agent* `computeFamiliarityPenalty` based on completion count, but **no global recency signal and no category quota**. Two distinct agents who both find `commune_with_stars` attractive in their local hex will both fire it in the same tick because nothing tells either of them "this template just fired across the world." The familiarity penalty is also a *count* (gentle, slow-growing), not a *recency* (sharp, time-decayed) signal — it doesn't distinguish "fired five ticks ago" from "fired fifty ticks ago."

---

## 2. Where the lever lives (verified, not guessed)

| Concern | File / line | What's there today |
|---------|-------------|---------------------|
| Score composition | `src/engine/encounterScoring.ts:929–968` | `finalScore = baseScore * rarityMultiplier * roleAffinityMultiplier * (1 - familiarityPenalty) + explorationBonus + chainBonus + … ` — multiplicative penalty slot already exists; recency joins it. |
| Per-agent familiarity bump | `src/engine/phaseAgentDecision.ts:948–962` | Existing direct-property write on the actor node at commit time. Global recency record bumps at the same site (one extra write). |
| Encounter cache entry shape | `src/engine/encounterCache.ts:79–116` | `EncounterCacheEntry` already exposes `templateId` and `encounterType` (10 values from `EncounterType`). No schema work needed. |
| Scoring trace shape | `src/types/trace.ts:742–780` | `ScoringTrace.topCandidates[]` already accepts optional numeric fields (`familiarityPenalty?`, `chainBonus?`, etc.). Add two more (`recencyPenalty?`, `categoryQuotaMultiplier?`) plus one trace-root flag (`noveltyChangedSelection?`). |
| GameState surface | `src/types/gameState.ts:170+` | Top-level `GameState` is the right home for a world-level record. Add `encounterNoveltyRecord?: EncounterNoveltyRecord` as an *optional* field so existing seeded states and tests keep loading without migration. |

CC: confirm the `phaseAgentDecision.ts` line numbers before editing — the familiarity bump may shift by a few lines once other PRs land.

---

## 3. Goals & non-goals

**Goals**

- No single template accounts for >8% of encounters in a 120-tick CLI run across seeds 42 / 99 / 7 (acceptance from issue).
- Per-category distribution: no single `EncounterType` (of 10) accounts for >25% of fired encounters in the same window. (Soft target, drives the quota constant.)
- Selection remains fully deterministic for a given seed (NFP #3). No PRNG, no clock reads.
- Fail-soft: missing `encounterNoveltyRecord` → zero penalty / multiplier 1.0, never a throw (NFP #4).
- A `ScoringTrace` consumer can see when novelty pressure changed the selection (`noveltyChangedSelection: true`) and which two templates were involved.

**Non-goals**

- Not re-tuning `FAMILIARITY_DECAY_PER_ATTEMPT` or `EXPLORATION_NOVELTY_BONUS`. Those are per-agent signals; novelty is a world-level signal. They coexist.
- Not changing template selection for *seeded / authored* encounters (`questPriority > 1.0`). Authored content has explicit narrative intent and should not be dampened by recency. Gate the penalty behind `entry.questPriority <= 1.0`.
- Not touching branching encounter reachability — that's THR-452, which is blocked on THR-457's eligibility funnel.
- Not adding a player-facing "novelty meter" or any UI element. Distribution is a quality-of-feed concern, not a surface to expose.

---

## 4. Three-pillar design

### 4.1 Engine pillar — the only pillar that moves

**New state shape** (added to `src/types/gameState.ts`):

```ts
export interface EncounterNoveltyRecord {
  /** Per-template last-fired tick. Bumped at commit in phaseAgentDecision. */
  lastFiredTick: Record<string, number>;
  /** Per-category rolling fire count over the last NOVELTY_QUOTA_WINDOW_TICKS ticks. */
  categoryFireCounts: Record<EncounterType, number>;
  /** Tick of last category-counts decay. Used to avoid scanning ticks. */
  lastDecayTick: number;
}

// in GameState:
encounterNoveltyRecord?: EncounterNoveltyRecord;
```

Optionality is deliberate: existing tests / seeded states without the field treat missing as the empty record (all penalties = 0, all multipliers = 1.0). One-time lazy initialisation on first bump.

**New scoring functions** (added to `src/engine/encounterScoring.ts` next to `computeFamiliarityPenalty`):

```ts
/** Recency penalty — global per-template, decays toward 0 with half-life NOVELTY_HALF_LIFE_TICKS. */
export function computeRecencyPenalty(
  record: EncounterNoveltyRecord | undefined,
  templateId: string,
  currentTick: number,
): number {
  if (!record) return 0;
  const lastTick = record.lastFiredTick[templateId];
  if (lastTick === undefined) return 0;
  const ticksSince = currentTick - lastTick;
  if (ticksSince <= 0) return NOVELTY_RECENCY_MAX_PENALTY; // same-tick re-fire ⇒ full penalty
  const decay = Math.pow(0.5, ticksSince / NOVELTY_HALF_LIFE_TICKS);
  return NOVELTY_RECENCY_MAX_PENALTY * decay;
}

/** Category quota multiplier — 1.0 when category share ≤ threshold, dampened otherwise. */
export function computeCategoryQuotaMultiplier(
  record: EncounterNoveltyRecord | undefined,
  encounterType: EncounterType,
): number {
  if (!record) return 1.0;
  const counts = record.categoryFireCounts;
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  if (total < NOVELTY_QUOTA_MIN_SAMPLES) return 1.0; // need a meaningful sample
  const share = (counts[encounterType] ?? 0) / total;
  if (share <= NOVELTY_QUOTA_SHARE_THRESHOLD) return 1.0;
  const overShare = share - NOVELTY_QUOTA_SHARE_THRESHOLD;
  const dampening = 1.0 - NOVELTY_QUOTA_DAMPENING_PER_POINT * overShare;
  return Math.max(NOVELTY_QUOTA_MIN_MULTIPLIER, dampening);
}
```

**Wiring into `scoreAndSelect`** — between current steps 13 (familiarity) and 21 (finalScore):

```ts
const noveltyRecord = state.encounterNoveltyRecord; // threaded through new arg
const isAuthored = (entry.questPriority ?? 1.0) > 1.0;
const recencyPenalty = isAuthored ? 0 : computeRecencyPenalty(noveltyRecord, entry.templateId, tick);
const categoryQuotaMultiplier = isAuthored ? 1.0 : computeCategoryQuotaMultiplier(noveltyRecord, entry.encounterType);

// existing step 21, modified:
const finalScore =
  baseScore * rarityMultiplier * roleAffinityMultiplier
  * (1 - familiarityPenalty)
  * (1 - recencyPenalty)        // ← new
  * categoryQuotaMultiplier      // ← new
  + explorationBonus + chainBonus + ruinsBonus + anomalyBonus + attractionBonus + hunchBonus
  + identityBiasBonus + markRevealBonus + intelBonus;
```

Authored content (`questPriority > 1.0`) bypasses both penalties — preserves narrative intent.

**Bump site** (`src/engine/phaseAgentDecision.ts`, alongside the existing familiarity bump at line ~958):

```ts
// Existing familiarity bump runs first (per-agent, untouched).
// Then bump global novelty record at the GameState level:
const novelty = state.encounterNoveltyRecord ?? {
  lastFiredTick: {},
  categoryFireCounts: emptyCategoryCounts(),
  lastDecayTick: state.tick,
};
// Decay categoryFireCounts if window has elapsed (cheap O(10) per tick at most).
const ticksSinceDecay = state.tick - novelty.lastDecayTick;
let decayedCounts = novelty.categoryFireCounts;
if (ticksSinceDecay >= NOVELTY_QUOTA_DECAY_INTERVAL_TICKS) {
  const decayFactor = Math.pow(NOVELTY_QUOTA_DECAY_PER_INTERVAL, ticksSinceDecay / NOVELTY_QUOTA_DECAY_INTERVAL_TICKS);
  decayedCounts = mapValues(novelty.categoryFireCounts, n => n * decayFactor);
}
state.encounterNoveltyRecord = {
  lastFiredTick: { ...novelty.lastFiredTick, [sel.entry.templateId]: state.tick },
  categoryFireCounts: {
    ...decayedCounts,
    [sel.entry.encounterType]: (decayedCounts[sel.entry.encounterType] ?? 0) + 1,
  },
  lastDecayTick: ticksSinceDecay >= NOVELTY_QUOTA_DECAY_INTERVAL_TICKS ? state.tick : novelty.lastDecayTick,
};
```

Tracking is at *commit*, not *resolve* — selection is what the player perceives; we want to penalise selecting the same template before its outcome lands, not just after.

### 4.2 Content pillar — N/A

No template, prose, or content table is edited. The 210+ templates already in the catalogue stand untouched. Recency and quota are pure runtime scoring signals. Confirmed by reading `encounterCache.ts`: `templateId` and `encounterType` are already part of the cache entry, no template metadata authoring required.

### 4.3 UI pillar — N/A (verify only)

No player-facing surface, no notification, no debug widget. The chronicle feed and encounter detail surfaces are unaffected — they read the *outcome* of selection, not the scoring math. The DebugPanel's existing scoring trace viewer will pick up the new fields automatically because it iterates over `ScoringTrace.topCandidates[]` keys; CC should verify the new fields render correctly in the DebugPanel's encounter scoring tab as part of closeout, but no JSX changes are required.

### 4.4 Wiring section

| Wiring concern | Surface | Action |
|----------------|---------|--------|
| Orchestrator phase | `phaseAgentDecision` | Read `state.encounterNoveltyRecord`, pass into `scoreAndSelect` via new arg; bump at commit alongside familiarity. |
| GameState field | `gameState.ts:170+` | Add optional `encounterNoveltyRecord?: EncounterNoveltyRecord` field + `EncounterNoveltyRecord` interface. |
| Tick loop integration | None new | No new phase needed; bump piggybacks on existing commit code path. |
| Trace emission | `ScoringTrace.topCandidates[]` | Add optional `recencyPenalty?: number`, `categoryQuotaMultiplier?: number`; add optional `noveltyChangedSelection?: boolean` at the trace root. |
| Debug visibility | DebugPanel scoring trace viewer | Verify the existing top-5 candidate table picks up the two new keys; no JSX change required, but include a screenshot at 1920×1080 in closeout. |
| Prose pipeline | None | Novelty has no prose surface. |
| Player controls | None | No player-facing control. |
| Determinism | All paths | No PRNG read. Same inputs → same outputs (NFP #3). |
| Versioning | `worldVersion` | Bumping the global record at commit must `touchWorld()` so UI memos invalidate, matching the existing familiarity bump's behaviour. |

---

## 5. Constants table (NFP #1)

| Constant | Default | Purpose |
|----------|---------|---------|
| `NOVELTY_RECENCY_MAX_PENALTY` | 0.6 | Max multiplicative score reduction when the same template fired this tick. |
| `NOVELTY_HALF_LIFE_TICKS` | 8 | Half-life for recency decay. After 8 ticks penalty is half; after 24 ticks effectively zero. Tuned to "memory of last 1–2 days of in-world time" in a 1 tick = 6h cadence. |
| `NOVELTY_QUOTA_SHARE_THRESHOLD` | 0.15 | A category that crosses 15% of the rolling window starts being dampened. With 10 categories the uniform expectation is 10%; 15% gives normal variance headroom. |
| `NOVELTY_QUOTA_DAMPENING_PER_POINT` | 4.0 | Slope of dampening above threshold. At 25% share the multiplier is 1 − 4·(0.25−0.15) = 0.6. |
| `NOVELTY_QUOTA_MIN_MULTIPLIER` | 0.4 | Floor: even at 100% share, the multiplier never drops below 0.4 (still lets the category fire when nothing else is available). |
| `NOVELTY_QUOTA_MIN_SAMPLES` | 20 | Below 20 cumulative fires, ignore the quota — sample too small for "share" to be meaningful. |
| `NOVELTY_QUOTA_DECAY_INTERVAL_TICKS` | 30 | How often the rolling count decays. Cheap O(10) operation; runs on bump only. |
| `NOVELTY_QUOTA_DECAY_PER_INTERVAL` | 0.5 | Each decay interval halves all category counts. With interval=30, a category that stops firing entirely drops to ~3% relevance over 150 ticks. |

All constants live in `src/data/agent-behavior-constants.ts` next to the existing `FAMILIARITY_*` and `EXPLORATION_*` constants. Naming follows the established pattern (`NOVELTY_*` prefix to disambiguate from per-agent familiarity).

---

## 6. Tracing (NFP #2)

**Extended `ScoringTrace.topCandidates[]` entry** (additive — all fields optional):

```ts
{
  // …existing fields…
  recencyPenalty?: number;          // 0..NOVELTY_RECENCY_MAX_PENALTY
  categoryQuotaMultiplier?: number; // NOVELTY_QUOTA_MIN_MULTIPLIER..1.0
}
```

**New root-level `ScoringTrace` flag** (optional):

```ts
{
  // …existing fields…
  noveltyChangedSelection?: boolean;
  noveltyOverriddenTemplateId?: string; // the would-be winner pre-novelty, when noveltyChangedSelection = true
}
```

**Detection logic** (in `scoreAndSelect`, after the sort):

```ts
const preNoveltyTop = [...scored].sort((a, b) =>
  (b.baseScore * b.rarityMultiplier * b.roleAffinityMultiplier * (1 - b.familiarityPenalty))
  - (a.baseScore * a.rarityMultiplier * a.roleAffinityMultiplier * (1 - a.familiarityPenalty))
)[0];
const noveltyChangedSelection = preNoveltyTop && scored[0] && preNoveltyTop.entry.templateId !== scored[0].entry.templateId;
```

(This recomputes the pre-novelty ranking only for the trace — runtime selection always uses the new ranking.)

---

## 7. Fail-soft table (NFP #4)

| Failure case | Fallback |
|--------------|----------|
| `encounterNoveltyRecord` undefined on GameState (existing seeded state, pre-feature tests) | `computeRecencyPenalty` returns 0; `computeCategoryQuotaMultiplier` returns 1.0. Selection behaves identically to today. |
| `lastFiredTick[templateId]` undefined (template has never fired) | Recency penalty = 0. |
| `categoryFireCounts` total < `NOVELTY_QUOTA_MIN_SAMPLES` | Quota multiplier = 1.0. Avoids overreacting to small samples. |
| `entry.questPriority > 1.0` (authored content) | Both penalties bypassed. Authored content preserved. |
| `entry.encounterType` not in known set (corrupt data) | Quota multiplier = 1.0 (treat as unknown category, no penalty). |
| Same-tick re-fire (currentTick − lastTick = 0, e.g., two agents picking same template in same scoring batch) | Full `NOVELTY_RECENCY_MAX_PENALTY`. Note: this is by design — within a tick, no two agents should both win on the same template if a different option is close. |
| Bump-site write fails (e.g., readonly state in test fixture) | Bump is wrapped in try/catch; failure logs at warn level via `traceBuffer`, scoring continues without the bump (one missed bump is not a correctness failure). |

---

## 8. Blast radius

`src/types/gameState.ts` is in the high-impact list (176 importers). The change is **additive and optional** — no existing GameState shape becomes invalid, no migration required, no test fixture needs updating. The 176 importers continue to type-check unchanged.

`src/engine/encounterScoring.ts` — exports a new function signature for `scoreAndSelect` (new optional `noveltyRecord` arg). All 4 in-tree callers update; external callers (none expected outside test fixtures) get the default `undefined` and behave as today.

`src/engine/phaseAgentDecision.ts` — the one phase that bumps the record. Single insertion point.

`src/types/trace.ts` — additive optional fields on `ScoringTrace`. No existing consumer breaks.

No other file requires editing. Test fixtures that build a synthetic `GameState` literal continue to type-check because the new field is optional.

---

## 9. NFP compliance summary

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | PASS | Eight named constants, all in `agent-behavior-constants.ts`, full table in §5. |
| 2. Inspectability | PASS | New trace fields per-candidate (`recencyPenalty`, `categoryQuotaMultiplier`) + root flag (`noveltyChangedSelection`) — surfaces *when* novelty changed the outcome, not just that the system ran. |
| 3. Determinism | PASS | No PRNG, no clock, no I/O. Pure functions over GameState + currentTick. |
| 4. Fail-soft | PASS | Six failure cases enumerated in §7, all fall back to "behave as today." |
| 5. Narrative over mechanical perfection | PASS | Authored content (`questPriority > 1.0`) bypasses novelty entirely. The novelty system specifically protects rare, authored beats from being damped by the mundane-encounter recency cloud. |
| 6. Additive over destructive | PASS | New optional GameState field, new optional trace fields, new functions, two added multiplicative terms inside an already-multi-term `finalScore`. No removed code. |
| 7. Performance budget | PASS | Per-candidate cost: one record lookup + one exponentiation + one division. Decay runs O(10) every 30 ticks. No measurable hot-path cost. |

---

## 10. Three-pillar check

- Engine: §4.1 covers state shape, scoring functions, wiring into `scoreAndSelect`, bump site.
- Content: §4.2 — N/A with rationale (no template edits).
- UI: §4.3 — N/A with rationale (distribution only; existing DebugPanel scoring trace viewer picks up new fields automatically; closeout requires verification screenshot of that viewer at 1920×1080).

---

## 11. Done when (CC verification checklist)

- [ ] All 8 constants in `src/data/agent-behavior-constants.ts` with the names and defaults from §5.
- [ ] `EncounterNoveltyRecord` interface in `src/types/gameState.ts`, `encounterNoveltyRecord?` field optional on `GameState`.
- [ ] `computeRecencyPenalty` and `computeCategoryQuotaMultiplier` exported from `src/engine/encounterScoring.ts` with the bodies in §4.1.
- [ ] `scoreAndSelect` signature accepts the new state pass-through; pre-novelty top template is recomputed for trace only; runtime selection uses post-novelty ranking.
- [ ] Bump site in `phaseAgentDecision.ts` runs alongside the familiarity bump; calls `touchWorld()` to invalidate UI memos.
- [ ] `ScoringTrace` has new optional fields; existing trace consumers (DebugPanel, traceBuffer dumps) compile and render unchanged.
- [ ] Authored encounters (`questPriority > 1.0`) bypass both penalties — covered by a unit test that sets up an authored entry and asserts recency / quota are zero / 1.0.
- [ ] **30-tick CLI engine smoke** (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) passes — paste last ~10 lines into closing comment.
- [ ] **120-tick distribution check** (3 seeds: 42, 99, 7) — emit the per-template fire count via `eval` (e.g. `eval Object.entries(state.encounterNoveltyRecord?.categoryFireCounts ?? {})`). Assert no single template >8% across all three seeds; per-category share within 10–25% band for actively-firing categories. Paste the three top-templates lists into closing comment.
- [ ] **DebugPanel scoring trace viewer screenshot at 1920×1080** showing the new `recencyPenalty` and `categoryQuotaMultiplier` columns rendering (Playwright preview_resize + screenshot; no Three.js surface involved, DOM-only).
- [ ] **Test:** unit test for `computeRecencyPenalty` covering same-tick re-fire (= max), one half-life elapsed (= half), and beyond decay window (= zero).
- [ ] **Test:** unit test for `computeCategoryQuotaMultiplier` covering sub-threshold (= 1.0), at threshold (= 1.0), 25% share (= 0.6), 100% share (= floor = 0.4), and sub-min-samples (= 1.0).
- [ ] **Test:** integration test that builds a GameState where one template has fired heavily at tick 100, runs `scoreAndSelect` at tick 101 with that template + a fresh alternative both eligible, and asserts the fresh alternative wins.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass — paste raw output or link to green CI run.
- [ ] Closing commit body includes `Fixes THR-453`.

---

## 12. What is *not* in this ticket (explicit deferrals)

- **THR-451 verification gate**: This change improves variety but does not directly address the 89% failure rate. THR-451 lands separately. The two will compose: novelty pressure spreads failures across more templates rather than concentrating them in five, which makes the failure-distribution problem more visible (good) but doesn't fix it.
- **THR-457 KPI harness verification**: The `kpi template-entropy` metric called out in the acceptance criteria depends on THR-457 landing. The 120-tick distribution check in §11 uses a direct `eval` over `encounterNoveltyRecord.categoryFireCounts` as a stop-gap; once THR-457 ships, swap to `kpi`.
- **Per-agent×template recency (in addition to global recency)**: Tempting, but it duplicates `computeFamiliarityPenalty`'s purpose and adds per-agent state without clear additional signal. Revisit only if 120-tick distribution still skews after this lands.
- **Sub-template variant rotation** (e.g., `commune_with_stars` having three flavour variants picked round-robin): Out of scope. If it's needed, it's a content-authoring ticket, not a scoring ticket.
