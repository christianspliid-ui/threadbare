# THR-440 — Survey: named-mortals band in people-layer prose

**Date:** 2026-05-14
**Linear:** [THR-440](https://linear.app/threadbare/issue/THR-440) — *Survey: named-mortals band in people-layer prose*
**Project:** Content Architecture (Now / High)
**Parent:** [THR-398](https://linear.app/threadbare/issue/THR-398) — Hex-Recon Verb Collapse (Survey). Label: `Deferral`.
**Sibling deferral:** [THR-439](https://linear.app/threadbare/issue/THR-439) — HexChronicle dynamic people-layer swap (parallel-safe; see §9).
**Brainstorm companion:** inline §2 — this is a content/wiring deferral inside a settled direction. THR-398 §5.1 envisioned the named-mortals band; THR-415 shipped the mood + faction halves and explicitly deferred this one (THR-415 plan §12.2 / §13). No new vision call. The §2 alternatives analysis is the brainstorm record.

## 0. Reading the issue forward

THR-398 §5.1 envisioned Survey's people-layer as **three bands**: populace mood, faction presence, and *named mortals* — "Kael, the smith's daughter, the priest in the long house" rather than abstract demographics. THR-415 shipped `composeSurveyPeopleProse` with the **mood** and **faction** bands only; its "Done when" did not include named mortals, so THR-415 plan §12.2 deferred it and §13 surfaced it as a non-blocking user item. THR-440 was then filed — the named-mortals band **is owed**, and this plan delivers it.

The hard part the issue names precisely: THR-398 §5.1 specified ranking by "bonded agents first, then top-`leadershipScore` actors, then named NPCs." **There is no stored `leadershipScore` property on agent nodes** — `leadershipScore` is a *computed function over `FactionNetworkMember`* in `src/engine/factionNetwork.ts`, not a graph property. This plan settles that gap (§3.3): the prominence signal is `rarityTier` (a real, stored, tunable property already on every agent node), not a recomputed faction score. The ranking shape stays — bonded first, then prominence, then the rest — but it runs on substrate that actually exists.

## 1. Substrate check — verify before authoring

> **⚠ Stale-tree caveat (read first).** This plan was authored by a Cowork `keep-work-flowing` session whose local working tree was at commit `62146dc0` (~2026-05-12) — **before THR-415 shipped (2026-05-14)**. The THR-415-shipped substrate below (`surveyProseComposer.ts`, the `composeSurveyPeopleProse` signature, the `survey_completed` TickEvent, the THR-415 constants in `survey-prose-tables.ts`, `SurveyProseComposedTrace`) is derived from the THR-415 plan doc (`Docs/plans/2026-05-14-THR-415-survey-people-layer-prose-wiring.md`) and the THR-440 issue body — **not verified against shipped code**. The executor pulls fresh from `origin/main` and **must verify every THR-415-shipped row below before authoring.** If the shipped shape diverges from the THR-415 plan, follow the shipped code and note the divergence in the closing comment.

| Claim | Where it lives | Verified by Cowork |
|------|----------------|--------------------|
| `SURVEY_NAMED_MORTALS_CAP = 4` already exists and is exported | `src/data/survey-prose-tables.ts:13` | ✅ (in stale tree — THR-398 base) |
| `SURVEY_BOND_WEIGHT_FACTOR = 2` already exists and is exported | `src/data/survey-prose-tables.ts:22` | ✅ (in stale tree — THR-398 base) |
| `composeSurveyPeopleProse(graph, col, row, rng, tick)` exists, returns a `string` band (mood + faction sentences), pure over graph snapshot + seeded `rng` | `src/engine/surveyProseComposer.ts` (THR-415) | ⚠ **derived from THR-415 plan §3.1 — executor must verify signature** |
| `survey_completed` TickEvent type exists; `message` carries the composed band; `buildSurveyCompletedTickEvent` builder emits it on `hex.survey` success | `src/types/gameState.ts` union member + `src/engine/revelationResolver.ts` (or `surveyProseComposer.ts`) | ⚠ **derived from THR-415 plan §3.2–§3.3 — executor must verify** |
| `SurveyProseComposedTrace` exists in the trace union with `hexCol`, `hexRow`, `moodBucket`, `factionCount`, `composedLength` | `src/types/trace.ts` (THR-415) | ⚠ **derived from THR-415 plan §6 — executor must verify field names** |
| `getLocationsInHex(graph, col, row)` returns location `GraphNode[]` in the hex | `src/engine/hexZoom.ts:29` | ✅ |
| `getAgentsAtLocation(graph, locationId)` returns `actorType === 'individual'` nodes via incoming `located_at` edges | `src/engine/hexZoom.ts:40–49` | ✅ |
| Ascendant→mortal bond is the `thread` edge — `graph.getIncomingEdges(agentId, 'thread')` non-empty ⇒ the agent is bonded to (an) ascendant; `graph.getOutgoingEdges(ascendantId, 'thread')` lists the ascendant's threads | `src/types/graph.ts:70`; usage `agentDetail.ts:297`, `battleSpotlights.ts:36`, `encounterAftermath.ts:2085` | ✅ |
| `state.ascendantId` is the ascendant node id | `src/engine/debugEncounterTools.ts:236` | ✅ |
| Agent nodes carry `rarityTier` (1–N), `npcRole?`, `name`, `narrativeArchetype?` in `properties` | `src/components/Game/HexChronicle.tsx:884–889` reads all four | ✅ |
| No stored `leadershipScore` on agent nodes — it is a function over `FactionNetworkMember` | `grep "leadershipScore" src` → only `src/engine/factionNetwork.ts:382` | ✅ — **see §3.3** |

**Substrate that does NOT exist and IS built here:** the named-mortals ranking + clause assembly inside `composeSurveyPeopleProse` (or a co-located helper `composeNamedMortalsClause`), the `SURVEY_NAMED_MORTALS_CONNECTIVES` table, the `SURVEY_BONDED_MORTAL_MARKERS` table, the `SURVEY_NO_NAMED_MORTALS_FALLBACK` string, and one additive field on `SurveyProseComposedTrace`.

**No high-impact file from the CLAUDE.md list is touched.** `surveyProseComposer.ts`, `survey-prose-tables.ts`, `trace.ts` are the touch set; `trace.ts` gains one additive interface field. No Blast Radius section required.

## 2. The design fork — settled (brainstorm record)

THR-440's issue body offers "Extend `composeSurveyPeopleProse` (or emit a sibling named-mortals band)." Two shapes considered:

**Option A — Sibling event / second band.** A second composer + a second `survey_completed`-adjacent surface for the named-mortals clause. Rejected. The band is *part of* the people layer, not a separate revelation. Two surfaces means two TickEvents per Survey cast, two feed entries, two things THR-439 has to merge. THR-398 §9.2 said "one chronicle entry per cast." Splitting it fights that.

**Option B — Extend `composeSurveyPeopleProse` with a third sentence.** *Chosen.* The composer already assembles up to two sentences (mood, faction) and returns one `string`. Add a third — the named-mortals clause — appended after the faction sentence. One band, one TickEvent, one feed entry. THR-439 displays whatever the band contains; it does not need to know the band grew a sentence. Clean, additive, and the sentence is independently omittable under fail-soft (§3.5) exactly like the other two.

**Ranking-signal fork — `leadershipScore` vs `rarityTier` (settled, §3.3).** THR-398 §5.1 said "top-`leadershipScore` actors." No such stored property exists. Recomputing `factionNetwork`'s `leadershipScore` per Survey cast would (a) require building `FactionNetworkMember` records for every agent on the hex, (b) couple the composer to the faction-network module, (c) only score faction members at all. `rarityTier` is stored on every agent, already tunable, already drives prose richness elsewhere (HexChronicle SoulCard) — it is the honest "who stands out" signal. The plan uses `rarityTier` and flags the substitution to the user as a non-blocking note (§11).

## 3. Engine pillar

### 3.1 Extend `composeSurveyPeopleProse` — `src/engine/surveyProseComposer.ts`

Add a third assembly step after the faction sentence. Recommended factoring: a co-located pure helper so the composer body stays readable and the helper is unit-testable in isolation.

```ts
import {
  // … existing THR-415 imports …
  SURVEY_NAMED_MORTALS_CAP, SURVEY_BOND_WEIGHT_FACTOR,   // existing — THR-398 base
  SURVEY_NAMED_MORTALS_CONNECTIVES,                       // new — §4
  SURVEY_BONDED_MORTAL_MARKERS,                           // new — §4
  SURVEY_NO_NAMED_MORTALS_FALLBACK,                       // new — §4
} from '../data/survey-prose-tables';
import { getLocationsInHex, getAgentsAtLocation } from './hexZoom';
import type { GraphNode } from '../types/graph';

interface RankedMortal {
  readonly node: GraphNode;
  readonly bonded: boolean;       // has an incoming `thread` edge from any ascendant
  readonly rarityTier: number;    // prominence signal — §3.3
}

/**
 * Collect + rank named mortals on a hex.
 * Order: bonded-to-ascendant first; then by rarityTier desc; then by name asc (stable, deterministic).
 * Pure over the graph snapshot — no rng needed for ranking (rng is for clause *phrasing* only).
 */
export function rankHexMortals(
  graph: WorldGraph, col: number, row: number,
): RankedMortal[] { /* … */ }

/**
 * Compose the named-mortals clause: up to SURVEY_NAMED_MORTALS_CAP names,
 * bonded mortals tagged with an rng-picked SURVEY_BONDED_MORTAL_MARKERS phrase,
 * joined by rng-picked SURVEY_NAMED_MORTALS_CONNECTIVES.
 * Returns SURVEY_NO_NAMED_MORTALS_FALLBACK when no named mortals are present.
 * Returns '' only if the executor decides the fallback should be silent (it should NOT — see §3.5).
 */
export function composeNamedMortalsClause(
  ranked: RankedMortal[], rng: () => number,
): string { /* … */ }
```

`composeSurveyPeopleProse` then calls `rankHexMortals` + `composeNamedMortalsClause` and appends the result to the band:

```ts
// inside composeSurveyPeopleProse, after the faction sentence is assembled:
const ranked = rankHexMortals(graph, col, row);
const namedClause = composeNamedMortalsClause(ranked, rng);
if (namedClause) sentences.push(namedClause);   // always non-empty — fallback is real prose, §3.5
```

### 3.2 Ranking — `rankHexMortals`

1. `getLocationsInHex(graph, col, row)` → for each location, `getAgentsAtLocation(graph, loc.id)`; flatten + de-dupe by node id. **Three-tier note:** `getAgentsAtLocation` resolves location-tier `located_at` edges. Sublocations are themselves location nodes returned by `getLocationsInHex` (THR-415 plan §1 confirms `getLocationsInHex` is the hex's location set), so iterating it covers location *and* sublocation tiers. Agents bonded directly to the hex tier (rare) are out of scope here — note as deferral §10 if the executor finds the count material in CLI smoke.
2. For each agent node: `bonded = graph.getIncomingEdges(agent.id, 'thread').length > 0`. `rarityTier = (agent.properties.rarityTier as number) ?? 1`.
3. Sort: `bonded` desc (true first) → `rarityTier` desc → `name` asc. The `name` tie-break makes the order **fully deterministic** with no rng (NFP #3). `SURVEY_BOND_WEIGHT_FACTOR` is **not** an arithmetic weight here — bonded is a hard partition (bonded mortals always rank above non-bonded). Keep `SURVEY_BOND_WEIGHT_FACTOR` exported (THR-398 shipped it; removing it is destructive — NFP #6) but document at its definition that THR-440 uses a hard partition, not a multiplier. If the executor prefers a weighted score, that is acceptable **only if** it remains deterministic and bonded mortals still always sort first.
4. Return the full ranked list; the cap is applied in `composeNamedMortalsClause` so the trace can report the true total (§6).

### 3.3 The `leadershipScore` substitution — explicit

THR-398 §5.1's "top-`leadershipScore` actors" maps to **`rarityTier` descending**. Rationale recorded here so it is not silently lost: `leadershipScore` is not a graph property (verified §1); `rarityTier` is stored, tunable (NFP #1), already the prose-richness signal for agents, and present on every agent node. This is a faithful read of the intent ("who on this hex stands out") on substrate that exists. Surfaced to the user as a non-blocking note (§11) — if Christian wants a true leadership/reputation signal instead, it is a one-line swap of the sort key, no structural change.

### 3.4 Clause assembly — `composeNamedMortalsClause`

- Take the first `SURVEY_NAMED_MORTALS_CAP` (4) entries of the ranked list.
- For each: the mortal's `name`. If `bonded`, attach an `rng`-picked marker from `SURVEY_BONDED_MORTAL_MARKERS` (e.g. `'bound to you'`, `'a thread of yours'`) so the player sees their own threads called out — this is the mortal-loop bridge THR-398 §3.2 named.
- Join with `rng`-picked `SURVEY_NAMED_MORTALS_CONNECTIVES` and a leading framing fragment so the clause reads as Threadbare prose, not a CSV. Target shape: *"Among them: Kael Thornweaver, bound to you; the smith Doru; old Verena of the long house."* The composer assembles — it does not author per-mortal descriptors; the name (and `npcRole`/`narrativeArchetype` if the executor wants a light touch — optional, in-voice, not required) is the payload.
- **Empty case:** no named mortals on the hex → return `SURVEY_NO_NAMED_MORTALS_FALLBACK` (`'No names rise — only the press of strangers.'`). This is **real prose**, not `''` — see §3.5.
- Numbers never appear (NFP #5 / Vision §3.1). No `rarityTier` value, no count, no tier label in output.

### 3.5 Fail-soft posture (NFP #4)

| Failure surface | Behaviour | Why |
|-----------------|-----------|-----|
| Hex has no locations / no agents | `rankHexMortals` → `[]`; `composeNamedMortalsClause` → `SURVEY_NO_NAMED_MORTALS_FALLBACK` | The issue's "Done when" requires graceful fallback prose, not omission — an empty hex is itself a Survey result worth narrating |
| Agent node missing `name` | skip that node in `rankHexMortals` (cannot name the unnameable) | Defensive against malformed nodes |
| Agent node missing `rarityTier` | default `1` (`?? 1`, matches HexChronicle line 889) | Lowest prominence — safe default |
| `getIncomingEdges(agentId, 'thread')` throws | treat `bonded = false`, continue | Tick-loop must never crash (NFP #4) — the composer call is already try/caught at the THR-415 resolution site (THR-415 plan §3.5) |
| `SURVEY_NAMED_MORTALS_CONNECTIVES` / `SURVEY_BONDED_MORTAL_MARKERS` empty (bad table edit) | `rng`-pick guards `length === 0` → fall back to `'; '` connective / no marker | Defensive against future table edits |
| More than `SURVEY_NAMED_MORTALS_CAP` mortals | take first 4 of the ranked list; the rest are simply not named | The cap is the design — the band is a glance, not a census |

**Note on the fallback vs. THR-415's empty-band rule.** THR-415's `composeSurveyPeopleProse` returns `''` (and the caller skips the TickEvent) only when **both** mood and faction sentences are empty. The named-mortals clause has a *real prose fallback*, so once THR-440 lands, the band is non-empty far more often. That is correct and intended — a surveyed hex with no factions and flat unrest but a fallback "no names rise" line is still a legitimate Survey result. The executor must confirm this does not regress THR-415's "skip empty event" path: the event is skipped only if the *entire band* is empty, which after THR-440 effectively means "composer threw" — acceptable.

### 3.6 Determinism (NFP #3)

Ranking is rng-free (hard partition + numeric sort + name tie-break). Only *phrasing* (marker pick, connective pick) consumes `rng` — the same seeded resolution `rng` THR-415 already threads in. Same hex snapshot + same seed → identical clause. No `Math.random`, no `Date.now`.

### 3.7 Performance budget (NFP #7)

Per Survey cast: one `getLocationsInHex` (THR-415 already calls it — the executor may thread the existing result through rather than re-query), `getAgentsAtLocation` per location, one `getIncomingEdges` per agent, one sort, ≤4 string assembles. O(agents on hex). Survey is player-initiated (≤1/tick). Negligible.

## 4. Constants & content tables (NFP #1) — all in `src/data/survey-prose-tables.ts`

**Reused as-is:** `SURVEY_NAMED_MORTALS_CAP` (4), `SURVEY_BOND_WEIGHT_FACTOR` (2 — kept exported, semantics documented per §3.2).

**Added:**

| Name | Kind | Default / size | Purpose |
|------|------|----------------|---------|
| `SURVEY_NAMED_MORTALS_CONNECTIVES` | data table | ≥4 entries | Connective phrases joining named-mortal clauses (`'; '`, `', '`, `', and '`, `'. Alongside them, '`) — Threadbare voice, rng-picked |
| `SURVEY_BONDED_MORTAL_MARKERS` | data table | ≥4 entries | Short phrases tagging a bonded mortal (`'bound to you'`, `'a thread of yours'`, `'one you have touched'`, `'tied to your hand'`) — rng-picked |
| `SURVEY_NO_NAMED_MORTALS_FALLBACK` | string constant | `'No names rise — only the press of strangers.'` | Graceful fallback when the hex has no named mortals (issue "Done when") |
| `SURVEY_NAMED_MORTALS_FRAMING` | data table | ≥3 entries | Leading fragment that opens the clause (`'Among them: '`, `'Names surface: '`, `'You mark a few: '`) — rng-picked, keeps the band from reading as a bare list |

No magic numbers or hardcoded prose in the composer — every string comes from the table file.

## 5. Content pillar

THR-440 is a **content + consumption** issue. The content work is bounded and lives entirely in `survey-prose-tables.ts`:

1. **Four small tables** (§4) — `SURVEY_NAMED_MORTALS_CONNECTIVES`, `SURVEY_BONDED_MORTAL_MARKERS`, `SURVEY_NAMED_MORTALS_FRAMING`, and the `SURVEY_NO_NAMED_MORTALS_FALLBACK` string. Authoring reference: the existing THR-398 phrase tables in the same file + `Docs/canon/prose.md` voice rules. Voice register: terse, second-person-god-aware, no numbers — match `POPULACE_MOOD_PHRASES`.
2. **Voice QA on assembly** — the executor must verify the assembled clause reads as one grammatical Threadbare sentence: framing fragment + names + bonded markers + connectives must bridge into real prose, not concatenated fragments. Capitalise the clause's first letter; terminal punctuation. A 2–3 example assembled-clause assertion belongs in the test (§7).
3. **No per-mortal authored descriptors** — the band names mortals; it does not write them bios. Light use of an existing `npcRole`/`narrativeArchetype` word ("the smith Doru") is optional and in-scope if it stays in-voice; a descriptor-generation pass is not.

What we are NOT writing: numeric output, a "tier 3" label, a count ("4 souls of note"), a layer label in the prose. (THR-398 §8.3, carried forward.)

## 6. Tracing (NFP #2)

Extend the existing `SurveyProseComposedTrace` (THR-415, `src/types/trace.ts`) with **one additive field**:

```ts
export interface SurveyProseComposedTrace extends BaseTrace {
  // … existing THR-415 fields: category, type, hexCol, hexRow, moodBucket, factionCount, composedLength …
  readonly namedMortalCount: number;   // THR-440 — mortals named in the band (0 ⇒ fallback fired); pre-cap total reported separately if useful
}
```

Set `namedMortalCount` to the number actually named (0 when the fallback fired). This makes the new band inspectable: a designer tuning `SURVEY_NAMED_MORTALS_CAP` or the ranking can see, per cast, how many mortals surfaced — without reading the prose. If the executor wants the pre-cap total too (`rankedMortalTotal`), that is an acceptable second additive field. Additive only — existing `SurveyProseComposedTrace` consumers are unaffected.

## 7. UI pillar

**No new UI in THR-440.** The named-mortals sentence rides the existing `survey_completed` TickEvent `message` field (THR-415 wired the event → `recentEvents` → event feed). The band is simply longer. UI verification required at closeout:

- **Event feed** — the `survey_completed` entry in `EventLog` now shows the third sentence. Verify it renders legibly at 1920×1080 (it should — the feed renders by `message`; THR-415 already proved this path).
- **HexChronicle** — THR-440 does **not** touch HexChronicle. THR-439 (sibling deferral) is the issue that swaps HexChronicle's people-layer to read the `survey_completed` band. THR-440 only enriches the band content; THR-439 displays it. The two are parallel-safe (§9) — THR-440 makes the band richer whether or not THR-439 has landed.
- **Debug** — the `survey_prose_composed` trace (now carrying `namedMortalCount`) shows in the DebugPanel trace log under `category: 'revelation'`. No new DebugPanel code.

**UI pillar status: N/A for new components, but browser-verify is NOT exempt** — THR-440 changes what renders in the event feed, so the closeout still needs the §8 browser evidence.

## 8. Wiring section

| Wiring point | How THR-440 connects |
|--------------|----------------------|
| Orchestrator phase | None new — `composeSurveyPeopleProse` is invoked from the existing THR-415 hex-resolution path in `unifiedActionResolution.ts`; THR-440 only grows the function body |
| Engine module | `surveyProseComposer.ts` — `rankHexMortals` + `composeNamedMortalsClause` added; `composeSurveyPeopleProse` appends the third sentence |
| Graph reads | `getLocationsInHex` + `getAgentsAtLocation` (existing, `hexZoom.ts`); `getIncomingEdges(agentId, 'thread')` for bond detection |
| GameState flow | Unchanged — band still flows `survey_completed` TickEvent → `events[]` → `tickEvents` → `recentEvents` → UI feed |
| TickEvent type | Unchanged — no new event type; `message` field just carries more text |
| Traces | `src/types/trace.ts` — `SurveyProseComposedTrace` gains `namedMortalCount` (additive) |
| Content tables | `survey-prose-tables.ts` — 3 new tables + 1 fallback string (§4) |
| Debug visibility | DebugPanel trace log renders the enriched trace; no new code |
| Prose pipeline | Still NOT wired into `enrichProse()` — the hex-scoped composer remains a parallel path (THR-415 §2 Option A rejected; carried forward) |
| Player controls | None new |

**Update `Docs/plans/wiring-checklist.md`** — note the named-mortals band as part of the "hex-scoped prose composer → `survey_completed` TickEvent" pattern (THR-415 added the pattern; THR-440 extends it — one-line addendum).
**`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — no change needed; THR-415's note ("hex-level prose uses a separate composer, not `enrichProse`") already covers this.

## 9. Coordination with THR-439

THR-439 wires HexChronicle's people layer to read the `survey_completed` band. THR-440 enriches that band's content. **File-level parallel-safe:**

- THR-440 touches: `surveyProseComposer.ts`, `survey-prose-tables.ts`, `trace.ts`, `surveyProseComposer.test.ts`.
- THR-439 touches: `HexChronicle.tsx`, `GameView.tsx`, `HexChronicle.test.tsx`.
- **Zero file overlap** → parallel-safe; no mutex.
- Logical note: THR-439 renders whatever the band contains, so it works whether THR-440 has landed or not. If both are in flight, land order does not matter. If only one is picked up, THR-440 first gives THR-439 a richer band to display; THR-439 first makes THR-415's existing band visible in HexChronicle and THR-440 later enriches it for free.

## 10. Deferrals — separate Linear tickets

1. **Hex-tier bonded mortals.** `rankHexMortals` aggregates via `getLocationsInHex` → `getAgentsAtLocation` (location + sublocation tiers). Agents bonded directly to a hex node (no `located_at` to a location) are not collected. Expected to be rare; if CLI smoke shows a material count, file a `Deferral` in Content Architecture. Out of scope here.
2. **`read_currents` / Sphere Cartography soul-layer band.** THR-398 §5.2 specified a soul-layer prose band for the promoted `read_currents` verb — same gap pattern as THR-415/THR-440 but for the soul layer. Already flagged in THR-415 plan §12.3. Not this issue; confirm-and-file if still unshipped.

## 11. Open item for the user (non-blocking)

This plan ships cleanly without a verdict. One item is surfaced for awareness:

**Prominence signal — `rarityTier` vs a true leadership/reputation score.** THR-398 §5.1 said "top-`leadershipScore` actors." No stored `leadershipScore` exists on agent nodes (§1, §3.3). This plan uses `rarityTier` — a real, stored, tunable property that already drives prose richness. If Christian wants the named-mortals ranking to reflect *social standing* (faction rank, reputation, a leadership role) rather than *narrative rarity*, that is a one-line swap of the `rankHexMortals` sort key — say so before the executor starts. The band's shape (bonded first, then prominence, cap 4, fallback) is unaffected either way.

## 12. Vision audit

- **`Vision/02-non-negotiables.md` §3 (prose-first UI):** directly served — the named-mortals band is prose, no numbers. No drift.
- **`Vision/00-north-star.md` (mortal-loop bridge):** THR-398 §3.2 named the named-mortals band as the mortal-loop on-ramp — Survey turns an abstract hex into "people you could touch." THR-440 delivers exactly that half of the band (THR-415 delivered mood + faction). The bonded-marker phrasing (§3.4) makes the player's own threads legible in the band — reinforcing the loop. No Vision premise contradicted or updated; no Vision edit in this ticket's scope.

## 13. NFP compliance summary

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | **PASS** | 3 new tables + 1 fallback string in `survey-prose-tables.ts`; `SURVEY_NAMED_MORTALS_CAP` reused; no magic numbers in the composer |
| 2 | Inspectability | **PASS** | `SurveyProseComposedTrace.namedMortalCount` exposes the band's mortal count per cast |
| 3 | Determinism | **PASS** | Ranking is rng-free (hard partition + numeric sort + name tie-break); only phrasing consumes the seeded resolution `rng` |
| 4 | Fail-soft | **PASS** | §3.5 table — no locations/agents/names/tiers/edges all degrade to the real-prose fallback or safe defaults; composer call already try/caught at the THR-415 resolution site |
| 5 | Narrative over mechanical | **PASS** | The whole band is prose; numbers, tiers, counts never reach the player |
| 6 | Additive over destructive | **PASS** | New helpers, new tables, one additive trace field. `composeSurveyPeopleProse` grows a third sentence — no existing behaviour removed. `SURVEY_BOND_WEIGHT_FACTOR` kept exported (semantics documented, not deleted) |
| 7 | Performance budget | **PASS** | O(agents on hex) per player-initiated cast; ≤1/tick; THR-415's `getLocationsInHex` result reusable |

## 14. Coordination block

- **Suggested model:** `model:sonnet` — engine + content with bounded judgment (the ranking-signal substitution, graph traversal for bond detection, voice QA on clause assembly). Not prose-volume-heavy enough for opus; the `leadershipScore` gap and the three-tier aggregation are too much judgment for haiku.
- **Parallel-safe with:** [THR-439](https://linear.app/threadbare/issue/THR-439) (sibling deferral — zero file overlap, §9), [THR-425](https://linear.app/threadbare/issue/THR-425) (Linear infra — no file overlap).
- **Mutex with:** none currently on the board. **Executor must check the live board** for any other in-flight issue touching `src/engine/surveyProseComposer.ts`, `src/data/survey-prose-tables.ts`, or `src/types/trace.ts` before claiming — the `trace.ts` union is the most likely collision point.
- **Codex review:** yes — touches the `trace.ts` union (additive), a THR-415 engine module, and a content table file; the PR-gated review Action will pick it up.
- **Files to touch:** `src/engine/surveyProseComposer.ts` (extend — `rankHexMortals`, `composeNamedMortalsClause`, append third sentence), `src/data/survey-prose-tables.ts` (add 3 tables + 1 fallback string per §4; document `SURVEY_BOND_WEIGHT_FACTOR` semantics per §3.2), `src/types/trace.ts` (add `namedMortalCount` to `SurveyProseComposedTrace`), `src/engine/__tests__/surveyProseComposer.test.ts` (extend — see §15), `Docs/plans/wiring-checklist.md` (one-line addendum).
- **Done when:** §15 checklist passes.

## 15. Done when

- [ ] **First step: verify the §1 stale-tree substrate rows** against shipped `origin/main` code — `composeSurveyPeopleProse` signature, `survey_completed` event, `SurveyProseComposedTrace` fields. Note any divergence in the closing comment.
- [ ] `rankHexMortals(graph, col, row)` added to `surveyProseComposer.ts` — aggregates agents across hex locations, partitions bonded (incoming `thread` edge) first, sorts by `rarityTier` desc then `name` asc, rng-free
- [ ] `composeNamedMortalsClause(ranked, rng)` added — caps at `SURVEY_NAMED_MORTALS_CAP`, tags bonded mortals with `SURVEY_BONDED_MORTAL_MARKERS`, joins with `SURVEY_NAMED_MORTALS_CONNECTIVES`, opens with `SURVEY_NAMED_MORTALS_FRAMING`, returns `SURVEY_NO_NAMED_MORTALS_FALLBACK` when empty
- [ ] `composeSurveyPeopleProse` appends the named-mortals clause as a third sentence
- [ ] `survey-prose-tables.ts` gains `SURVEY_NAMED_MORTALS_CONNECTIVES`, `SURVEY_BONDED_MORTAL_MARKERS`, `SURVEY_NAMED_MORTALS_FRAMING`, `SURVEY_NO_NAMED_MORTALS_FALLBACK`; `SURVEY_BOND_WEIGHT_FACTOR` semantics documented at its definition
- [ ] `SurveyProseComposedTrace` gains `namedMortalCount` (additive); composer sets it per call
- [ ] No hardcoded prose strings or magic numbers in the composer — all from `survey-prose-tables.ts`
- [ ] `src/engine/__tests__/surveyProseComposer.test.ts` extended — covers: bonded-first ordering; `rarityTier` desc tie-broken by name; cap enforcement at 4; empty-hex → `SURVEY_NO_NAMED_MORTALS_FALLBACK`; bonded marker appears for a threaded agent; determinism (same seed → same clause); assembled clause is grammatical (capitalised, terminal punctuation, framing + connectives bridge into real prose)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green
- [ ] 30-tick CLI smoke passes (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` — reaches tick 30, non-zero agent count, no thrown exceptions; paste last ~10 lines) — `surveyProseComposer.ts` is under `src/engine/`
- [ ] Browser evidence per §7/§8: 1920×1080 screenshot of the event feed showing a `survey_completed` entry with the named-mortals sentence; console output (errors+warnings) fenced block; `__DEBUG` assertion — fire Survey on a populated hex, confirm a `survey_completed` event in `recentEvents` and a `survey_prose_composed` trace with non-zero `namedMortalCount`
- [ ] `Docs/plans/wiring-checklist.md` updated
- [ ] `Fixes THR-440` in the closing commit body

---

*Filed by Cowork (`keep-work-flowing`), 2026-05-14. Deferral child of [THR-398](https://linear.app/threadbare/issue/THR-398) via [THR-415](https://linear.app/threadbare/issue/THR-415) §12.2, project Content Architecture. Content/wiring deferral inside a settled direction — no new vision call; §11 surfaces one non-blocking signal-choice item for the user. Vision audit run inline (§12). Authored against a stale local tree — see the §1 caveat; executor verifies THR-415-shipped substrate first.*
