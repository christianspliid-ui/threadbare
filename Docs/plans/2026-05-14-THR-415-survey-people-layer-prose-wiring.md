# THR-415 — Survey people-layer: wire enrichProse placeholders into hex action resolution prose

**Date:** 2026-05-14
**Linear:** [THR-415](https://linear.app/threadbare/issue/THR-415) — *Survey people-layer: wire enrichProse placeholders into hex action resolution prose*
**Project:** Content Architecture (Now / High)
**Parent:** [THR-398](https://linear.app/threadbare/issue/THR-398) — Hex-Recon Verb Collapse (Survey). Label: `Deferral`.
**Brainstorm companion:** inline §2 / §13 — this is a wiring deferral inside a settled direction (THR-398 shipped; the creative shape was decided there). No new vision call. The §2 alternatives analysis is the brainstorm record.

## 0. Reading the issue forward

THR-398 collapsed six hex-recon verbs into a unified **Survey** and shipped `src/data/survey-prose-tables.ts` — `POPULACE_MOOD_PHRASES`, `FACTION_PRESENCE_VERBS`, named bucket thresholds and caps. **Those tables have zero importers today** (verified: `grep -rln "survey-prose-tables" src` returns nothing). THR-398's plan §5.1 described a Survey output that reads populace mood and faction presence as prose; what actually shipped was the *data* and the *layer-reveal flag*, not the *generation path*. THR-415 is the deferral that closes that gap.

The issue names the hard part precisely: `enrichProse` in `src/engine/proseEnrichment.ts` is **agent-centric** — its `NarrativeContext` is built around `agentName`, `agentId`, bonds, archetype, faction *rank*. There is no hook for hex-level data (`hexCol`, `hexRow`, aggregate unrest, faction presence) and no call site in the hex action resolution pipeline. "Wiring enrichProse" is therefore a slight misnomer — the real ask, in the issue's own words, is *"a hex-level prose function **(or** extended NarrativeContext)"*. This plan settles that fork.

**The fork, settled (see §2):** build a **separate, small, hex-scoped prose composer** — do **not** extend `NarrativeContext`. Surface its output as a **`survey_completed` TickEvent** emitted at Survey resolution success. This satisfies all three of the issue's "Done when" bullets without touching the agent-centric pipeline.

## 1. Substrate check — every claim verified before authoring

| Claim | Where it lives | Verified |
|------|----------------|----------|
| `survey-prose-tables.ts` exists with `POPULACE_MOOD_PHRASES`, `FACTION_PRESENCE_VERBS`, `SURVEY_LOCATION_DESCRIPTORS`, bucket thresholds + caps | `src/data/survey-prose-tables.ts:1–117` | ✅ |
| `survey-prose-tables.ts` has **zero importers** — tables unconsumed | `grep -rln "survey-prose-tables" src` → empty | ✅ |
| `hex.survey` reveals `['land','people']` (multi-layer) on success | `src/engine/revelationResolver.ts:33` | ✅ |
| `hex.survey` performs **no graph mutation** — pure observation | `src/engine/hexActionBridge.ts:89` ("hex.survey has no mutation — it's an observation action") | ✅ |
| Hex action resolution routes through `resolveHexActionFull` and already has a TickEvent emission pattern (hidden-site discovery) | `src/engine/unifiedActionResolution.ts:1997–2052` | ✅ |
| The resolution path has access to `state.graph`, `coords.col/row`, `state.tick`, and a seeded `rng` | `src/engine/unifiedActionResolution.ts:1847` (`rng` param), `1991`, `2010` | ✅ |
| Location `unrest` is stored on a **0–100** scale, clamped `[0,100]` | `src/engine/phaseUnrest.ts:67`, `phaseDoom.ts:144`, `complicationEffects.ts:146` | ✅ |
| `survey-prose-tables.ts` mood-bucket thresholds are on a **0–1** scale (`CALM_MAX = 0.30`) | `src/data/survey-prose-tables.ts:33–39` | ✅ — **scale mismatch, see §3.4** |
| `getHexFactions(graph, col, row)` returns `{factionName, factionId, locationCount}[]` sorted desc | `src/engine/hexZoom.ts:199–230` | ✅ |
| `getLocationsInHex(graph, col, row)` exists | `src/engine/hexZoom.ts` (used by `getHexFactions`/`getHexCultures`) | ✅ |
| `TickEvent.type` is a string union; `recentEvents` (cap 100) drives the UI event feed | `src/types/gameState.ts:61–`, `:200–201`, `MAX_RECENT_EVENTS` | ✅ |
| `NotificationDirective` channels are `toast | popup | alert` — **no `chronicle` channel** | `src/types/notification.ts:4` | ✅ |
| `NavigationTarget` includes `{ kind: 'hex'; col; row }` | `src/types/notification.ts:17` | ✅ |
| `notificationRouter.ts` routes by event `type` and classifies a feed category; has a `hexCoords`-aware nav block | `src/engine/notificationRouter.ts:34–35, 49–63` | ✅ |
| `EventLog.tsx` renders feed entries; TickEvents are mapped to `LogEntry` upstream | `src/components/Game/EventLog.tsx`, `GameView.tsx` | ✅ |

**Substrate that does NOT exist and IS built here:** the hex-level prose composer (`surveyProseComposer.ts`), the `survey_completed` TickEvent type, the `survey_prose_composed` trace, and the faction-presence tiering + unrest-normalization constants.

**No high-impact file from the CLAUDE.md list is touched destructively.** `src/types/gameState.ts` (176 importers) gains exactly one additive union member on `TickEvent.type`. Additive-only — no Blast Radius escalation section required.

## 2. The design fork — settled (brainstorm record)

The issue offers "a hex-level prose function **(or** extended NarrativeContext)". Three candidate shapes were considered:

**Option A — Extend `NarrativeContext` with hex fields.** Rejected. `NarrativeContext` is 40+ agent-scoped fields (`agentName`, bonds, `archetypeId`, `meetingChoiceRecord`, `beatHistory`, intelligence view…). A hex has none of those. Bolting `hexCol`/`factionPresence`/`unrest` onto it makes every `enrichProse` caller carry dead weight and invites future hex/agent confusion. Category error.

**Option B — Hex-scoped prose composer + TickEvent surface.** *Chosen.* A small pure function `composeSurveyPeopleProse(graph, col, row, rng)` that reads hex-level graph data, buckets it, and assembles a Threadbare-voice band from `survey-prose-tables.ts`. Surfaced as a `survey_completed` TickEvent at resolution success — the cast *produces a narrative result*, which is exactly THR-398 §3.1's "prose surface, not numbers" framing. Engine-side, deterministic, CLI-smoke-testable.

**Option C — Generate inside HexChronicle at render time.** Rejected as the *primary* surface. HexChronicle already renders a people-layer section every frame from live graph data (`cultureProse`, `factionProse` from static content tables). Making it the home of the *dynamic Survey* composer creates a staleness ambiguity: is the band "what Survey showed you at tick 40" or "what the hex is right now"? Those diverge. The composer is a **point-in-time cast snapshot**; HexChronicle is a **live reference view**. Keeping them separate is the honest model. (HexChronicle swapping its static people-layer tables for the dynamic composer is logged as a clean follow-up deferral — §12.1 — not this issue.)

This is consistent with THR-398's own §9.2: "the player-facing chronicle band flows through the existing chronicle path (one chronicle entry per cast)."

## 3. Engine pillar

### 3.1 New module — `src/engine/surveyProseComposer.ts`

A pure, hex-scoped composer. **Does not import or touch `proseEnrichment.ts`.**

```ts
import type { WorldGraph } from './graph';
import {
  POPULACE_MOOD_PHRASES, FACTION_PRESENCE_VERBS, SURVEY_LOCATION_DESCRIPTORS,
  SURVEY_PEOPLE_CONNECTIVES,            // new — §4
  POPULACE_MOOD_BUCKET_CALM_MAX, POPULACE_MOOD_BUCKET_RESTLESS_MAX, POPULACE_MOOD_BUCKET_AGITATED_MAX,
  UNREST_SCALE_MAX,                     // new — §4
  FACTION_PRESENCE_DOMINANT_MIN, FACTION_PRESENCE_ACTIVE_MIN, // new — §4
  SURVEY_FACTION_PRESENCE_MIN,
  type MoodBucket,
} from '../data/survey-prose-tables';
import { getHexFactions, getLocationsInHex } from './hexZoom';
import { emitTrace } from './traceBuffer';

/** Aggregate the hex's populace mood from per-location unrest (0–100), normalised to 0–1. */
export function deriveMoodBucket(graph: WorldGraph, col: number, row: number): MoodBucket | null { /* … */ }

/** Map a faction's locationCount on the hex to a presence tier. */
export function deriveFactionPresenceTier(locationCount: number): 'dominant' | 'active' | 'minor' { /* … */ }

/**
 * Compose the Survey people-layer prose band for a hex.
 * Pure: same (graph snapshot, col, row, rng-sequence) → same string.
 * Returns '' if the hex has no people-layer signal at all (fail-soft, §3.5).
 */
export function composeSurveyPeopleProse(
  graph: WorldGraph, col: number, row: number, rng: () => number, tick: number,
): string { /* … */ }
```

**`deriveMoodBucket`:** collect `unrest` from each location in the hex (`getLocationsInHex`), average it, normalise `avg / UNREST_SCALE_MAX` → 0–1, bucket against `CALM_MAX / RESTLESS_MAX / AGITATED_MAX` (above → `boiling`). If the hex has no locations, or none carry an `unrest` property, return `null` (the mood sentence is then omitted — §3.5).

**`deriveFactionPresenceTier`:** `locationCount >= FACTION_PRESENCE_DOMINANT_MIN` → `dominant`; `>= FACTION_PRESENCE_ACTIVE_MIN` → `active`; else → `minor`.

**`composeSurveyPeopleProse`:** assembles up to two sentences —
1. *Mood sentence* — `rng`-pick a phrase from `POPULACE_MOOD_PHRASES[bucket]`. Omitted if `bucket` is `null`.
2. *Faction sentence* — for each `getHexFactions` entry with `locationCount >= SURVEY_FACTION_PRESENCE_MIN` (cap the list — reuse the existing `SURVEY_NAMED_MORTALS_CAP`-style cap; add `SURVEY_FACTIONS_LISTED_CAP` — §4), build `{factionName} {presenceVerb} {locationDescriptor}` where `presenceVerb` is an `rng`-pick from `FACTION_PRESENCE_VERBS[tier]` and `locationDescriptor` an `rng`-pick from `SURVEY_LOCATION_DESCRIPTORS`. Join faction clauses with `SURVEY_PEOPLE_CONNECTIVES`. Omitted entirely if no factions clear the threshold.

If **both** sentences are empty, return `''` — the caller then skips the TickEvent (§3.5). Numbers never appear in output (NFP #3 / Vision §3.1). Emits one `survey_prose_composed` trace per call (§6).

### 3.2 Wiring — `unifiedActionResolution.ts`

The hex-resolution block already emits TickEvents (hidden-site discovery, `unifiedActionResolution.ts:2021–2052`). Add a sibling block immediately after it, inside the same `if (coords)` scope:

```ts
// THR-415: Survey people-layer prose band — emit a narrative TickEvent on Survey success.
if (
  completing_action.templateId === 'hex.survey' &&
  finalOutcome === 'success'
) {
  const band = composeSurveyPeopleProse(state.graph, coords.col, coords.row, rng, state.tick);
  if (band) {
    events.push(buildSurveyCompletedTickEvent(band, coords.col, coords.row, state.tick));
  }
}
```

`rng` is the seeded resolution RNG already in scope (`unifiedActionResolution.ts:1847`, `:1991`, `:2010`) — passing it keeps the prose pick on the deterministic seeded path (NFP #3). No new tick phase, no new orchestrator hook — this rides the existing hex-action resolution path exactly as hidden-site discovery does.

`buildSurveyCompletedTickEvent` is a small builder (co-located in `surveyProseComposer.ts` or `revelationResolver.ts` next to `buildDiscoveryTickEvent` — executor's call; `revelationResolver.ts` is the better neighbour). It returns:

```ts
{
  id: `evt_survey_${col}_${row}_${tick}`,
  tick,
  type: 'survey_completed',
  message: band,                       // the composed prose — this IS the chronicle band
  significance: SURVEY_EVENT_SIGNIFICANCE, // §4
  hexCoords: { col, row },
  notification: { channel: 'toast', icon: 'revelation' },
}
```

### 3.3 New TickEvent type — `src/types/gameState.ts`

Add one union member to `TickEvent['type']`:

```ts
  // Revelation events
  | 'domain_revealed'
  | 'survey_completed'   // THR-415 — Survey people-layer prose band
```

Additive only. Existing consumers that switch on `type` fall through to their default rendering (generic `message` display) — verified safe because `EventLog`/`GameView` render unknown types by `message` + `significance`.

### 3.4 The unrest scale mismatch — explicit

Location `unrest` is **0–100** (`phaseUnrest.ts`, `phaseDoom.ts`, `complicationEffects.ts` all clamp `[0,100]`). The `survey-prose-tables.ts` bucket thresholds shipped on a **0–1** scale (`CALM_MAX = 0.30`). The composer **must normalise** (`avg / UNREST_SCALE_MAX`) before bucketing. `UNREST_SCALE_MAX = 100` is added as a named constant in `survey-prose-tables.ts` (§4) so the scale assumption is tunable and documented, not a magic `/ 100` buried in the composer. **Do not** change the table thresholds — they are the canonical 0–1 design surface; the engine normalises *to* them.

### 3.5 Fail-soft posture (NFP #4)

| Failure surface | Behaviour | Why |
|-----------------|-----------|-----|
| Hex has no locations | `deriveMoodBucket` → `null`; mood sentence omitted | Don't invent a populace where there are no people |
| Locations exist but none carry `unrest` | treat as `0` → `calm` bucket *only if at least one location exists*; if zero locations, `null` | A settled hex with no unrest data reads calm, which is correct |
| Hex has no factions (or none clear `SURVEY_FACTION_PRESENCE_MIN`) | faction sentence omitted entirely | THR-398 §5.1 fail-soft: "omit the line entirely" |
| Both sentences empty | composer returns `''`; caller skips the TickEvent | No empty/garbage event in the feed |
| `getHexFactions` / `getLocationsInHex` throws | wrap the composer call in try/catch in `unifiedActionResolution.ts`; on throw, log `console.warn` and skip the event | Tick loop must never crash (NFP #4) — same posture as the `revelationAction` catch at `:2100` |
| `POPULACE_MOOD_PHRASES[bucket]` empty array (table edited badly) | `rng`-pick guards `length === 0` → omit sentence | Defensive against future table edits |

### 3.6 Determinism (NFP #3)

The composer takes `rng: () => number` and is otherwise pure over the graph snapshot. Same hex state + same seeded `rng` draw sequence → identical prose. The `rng` passed is the resolution RNG, already seeded per the engine's PRNG discipline. No `Math.random`, no `Date.now`. CLI smoke with a fixed seed produces reproducible Survey bands.

### 3.7 Performance budget (NFP #7)

Per Survey cast: one `getLocationsInHex` (already computed for the land layer — executor may thread the existing result through rather than re-query), one `getHexFactions`, one average over locations, ≤ `SURVEY_FACTIONS_LISTED_CAP` string assembles, a handful of `rng` draws. O(locations + factions on hex) — small constant. Survey is a player-initiated action (≤1/tick across all ascendants), not a per-agent per-tick path. Negligible.

## 4. Constants table (NFP #1) — all in `src/data/survey-prose-tables.ts`

The issue requires "all tuning constants come from `survey-prose-tables.ts`." Existing constants are reused; these are **added** to the same file:

| Constant | Default | Purpose |
|----------|--------:|---------|
| `UNREST_SCALE_MAX` | `100` | Divisor to normalise location `unrest` (0–100) into the 0–1 bucket scale (§3.4) |
| `FACTION_PRESENCE_DOMINANT_MIN` | `3` | `locationCount ≥` this → `dominant` presence tier |
| `FACTION_PRESENCE_ACTIVE_MIN` | `2` | `locationCount ≥` this → `active` presence tier (below → `minor`) |
| `SURVEY_FACTIONS_LISTED_CAP` | `3` | Max factions named in the faction sentence (mirrors `SURVEY_LOCATIONS_LISTED_CAP`) |
| `SURVEY_EVENT_SIGNIFICANCE` | `0.4` | `significance` on the `survey_completed` TickEvent (below discovery's `0.6`; it's a routine recon result) |
| `SURVEY_PEOPLE_CONNECTIVES` | data table (≥4 entries) | Connective phrases joining faction clauses, e.g. `'; '`, `', while '`, `'. Nearby, '` — Threadbare voice, picked by `rng` |

Reused as-is: `POPULACE_MOOD_BUCKET_CALM_MAX/RESTLESS_MAX/AGITATED_MAX`, `SURVEY_FACTION_PRESENCE_MIN`, `SURVEY_LOCATION_DESCRIPTORS`, `POPULACE_MOOD_PHRASES`, `FACTION_PRESENCE_VERBS`. No magic numbers in the composer.

## 5. Content pillar

THR-415 is primarily a **consumption** issue — the content (`POPULACE_MOOD_PHRASES`, `FACTION_PRESENCE_VERBS`) shipped with THR-398. Content work here is bounded:

1. **`SURVEY_PEOPLE_CONNECTIVES`** — a new ≥4-entry table in `survey-prose-tables.ts` for joining faction clauses into one flowing sentence. Threadbare voice, lowercase-continuation style (the existing phrases are mid-sentence fragments — connectives must grammatically bridge them). Authoring reference: the existing phrases in the file + `Docs/canon/prose.md` voice rules.
2. **Voice QA on assembly** — the existing phrases are written as mid-sentence fragments (`'the people go about their days with quiet purpose'`, `'holds sway over'`). The composer's job is to assemble them into grammatical sentences. The executor must verify the assembled band reads as Threadbare prose, not as concatenated fragments — capitalise the band's first letter, ensure terminal punctuation, ensure the faction grammar (`{factionName} {verb} {descriptor}`) produces a real clause. A 2–3 example assembled-band check belongs in the test (§8).
3. **No new mood/faction phrases** — the shipped tables are sufficient. If the executor finds a bucket reads thin in assembly, adding 1–2 phrases is in-scope (same file, same voice); a wholesale rewrite is not.

What we are NOT writing: numeric output, a layer label in the prose, per-faction stats. (THR-398 §8.3, carried forward.)

## 6. Tracing (NFP #2)

One new trace, emitted once per `composeSurveyPeopleProse` call:

```ts
// src/types/trace.ts — extend the trace union (additive)
export interface SurveyProseComposedTrace extends BaseTrace {
  readonly category: 'revelation';        // reuse the existing revelation category
  readonly type: 'survey_prose_composed';
  readonly hexCol: number;
  readonly hexRow: number;
  readonly moodBucket: MoodBucket | 'none';
  readonly factionCount: number;          // factions that cleared the threshold
  readonly composedLength: number;        // chars in the band — 0 means the event was skipped
}
```

This makes the hidden derivation inspectable: a designer tuning the unrest scale or the faction thresholds can see, per cast, which bucket fired and how many factions surfaced — without reading the prose itself. The `layer_revealed` trace from `resolveRevelation` already covers the reveal; this trace covers the *prose generation* specifically.

## 7. UI pillar

The `survey_completed` TickEvent is the player-facing surface. Three concrete UI touchpoints — none are "it flows through the pipeline" hand-waves:

1. **Event feed render.** The TickEvent lands in `state.tickEvents` → rolls into `state.recentEvents` (cap 100) → `EventLog.tsx` / the `GameView` event feed renders it. The `message` field carries the full prose band. **Executor must verify** the feed renders a `survey_completed` entry legibly (it should — feed entries render by `message` + `significance` + category colour). If `EventLog`'s `LogEntry.type` mapping needs `survey_completed` → `'narrative'`, add it (`src/components/Game/EventLog.tsx` + wherever TickEvent→LogEntry mapping lives in `GameView.tsx`).
2. **Notification routing.** `notificationRouter.ts` classifies feed category and builds the click-to-navigate target. Add `survey_completed` to:
   - the `hexCoords`-aware nav block (`notificationRouter.ts:34–35`) so clicking the toast navigates to `{ kind: 'hex', col, row }`;
   - the feed-category classifier (`:49–63`) → category `'discovery'` (it's a recon result; reuses the existing discovery lane, no new category needed).
3. **Debug inspection.** Two surfaces, both already exist: the `survey_prose_composed` trace shows in the DebugPanel trace log (filter `category: 'revelation'`); the `survey_completed` TickEvent shows in the DebugPanel event log. No new DebugPanel code — but the closeout must *demonstrate* both (§9).

**Not in scope (UI):** HexChronicle's static people-layer rendering (`cultureProse`, `factionProse`) is unchanged — see §2 Option C and §12.1. No new modal, no new HexMap signifier (Survey already triggers the layer-reveal visuals via `hexRevelation.people`).

## 8. Wiring section

| Wiring point | How this issue connects |
|--------------|-------------------------|
| Orchestrator phase | None new — composer is invoked from the existing hex-action resolution path in `unifiedActionResolution.ts`, same as hidden-site discovery |
| Engine module → resolution | `surveyProseComposer.ts` (new) called from `unifiedActionResolution.ts` hex-resolution block (§3.2) |
| GameState flow | `survey_completed` TickEvent → `events[]` → `tickEvents` → `recentEvents` → UI feed (existing flow) |
| TickEvent type | `src/types/gameState.ts` — one additive union member (§3.3) |
| Notification | `notificationRouter.ts` — additive type routing for nav target + feed category (§7.2) |
| Event feed UI | `EventLog.tsx` / `GameView.tsx` — verify generic render; add type mapping only if required (§7.1) |
| Traces | `src/types/trace.ts` — `SurveyProseComposedTrace` added to the trace union; emitted from the composer (§6) |
| Debug visibility | DebugPanel trace log + event log — both already render the new trace/event by category; no new DebugPanel code (§7.3) |
| Prose pipeline | **Deliberately NOT wired into `enrichProse()`** — §2 Option A rejected. The composer is a parallel, hex-scoped prose path. |
| Player controls | None new — Survey is already in the action drawer (shipped by THR-398) |
| Content tables | `survey-prose-tables.ts` — consumed for the first time; gains the §4 constants + `SURVEY_PEOPLE_CONNECTIVES` |

**Update `Docs/plans/wiring-checklist.md`** — add "hex-scoped prose composer → `survey_completed` TickEvent" as a covered pattern under the revelation/recon surface.
**Update `Docs/plans/2026-04-16-systemic-wiring-guide.md`** — add a one-line note under Capability 1 (enrichment placeholders): hex-level prose uses a *separate composer*, not `enrichProse` — `enrichProse`/`NarrativeContext` remain agent-scoped. This prevents the next content agent from trying to shoehorn hex data into `NarrativeContext`.

## 9. Closeout evidence required

This change touches the UI pillar (`EventLog.tsx`, `notificationRouter.ts`, the event feed). Per Definition of Done §Browser-verify, the closing commit body or Linear completion comment **must** include:

1. **Screenshot at 1920×1080** of the event feed showing a `survey_completed` entry — Threadbare-voice prose band, no numbers, after firing Survey on a populated hex. Playwright `preview_resize(1920,1080)` → `preview_screenshot` (the feed is DOM, not WebGL).
2. **Console output** via `mcp__playwright__browser_console_messages` (errors + warnings) — fenced block; `(no errors or warnings)` if clean.
3. **`__DEBUG` state assertion** — fire Survey via `window.__DEBUG.fireAction(...)` on a hex target (or cast through the drawer), then confirm a `survey_completed` event is present in `recentEvents` and a `survey_prose_composed` trace was emitted (`window.__DEBUG.getTraces()`).
4. **30-tick CLI smoke** (engine change — `unifiedActionResolution.ts` is under `src/engine/`): `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium` reaches tick 30, non-zero agent count, no thrown exceptions. Paste the last ~10 lines.

## 10. NFP compliance summary

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | **PASS** | 6 new named constants + `SURVEY_PEOPLE_CONNECTIVES` table, all in `survey-prose-tables.ts`; no magic numbers in the composer; `UNREST_SCALE_MAX` makes the scale assumption explicit |
| 2 | Inspectability | **PASS** | `survey_prose_composed` trace exposes bucket + faction count + length per cast; `survey_completed` TickEvent visible in event log |
| 3 | Determinism | **PASS** | Composer is pure over graph snapshot + seeded `rng`; no `Math.random`/`Date.now`; resolution RNG threaded through |
| 4 | Fail-soft | **PASS** | §3.5 table — missing locations/factions/unrest all degrade to omitted sentences or skipped event; composer call try/caught at the resolution site |
| 5 | Narrative over mechanical | **PASS** | The whole issue is "prose surface, not numbers" — the band reads as Threadbare prose; numbers never reach the player (Vision §3.1, THR-398 §3.1) |
| 6 | Additive over destructive | **PASS** | New module, additive TickEvent union member, additive trace, additive constants. No file rewritten, no behaviour removed. HexChronicle untouched. |
| 7 | Performance budget | **PASS** | O(locations + factions on hex) per player-initiated cast; ≤1/tick; land-layer `getLocationsInHex` result can be reused |

## 11. Vision audit

- **`Vision/02-non-negotiables.md` §3 (prose-first UI):** directly served — this issue *is* the prose surface for Survey's people layer. No drift.
- **`Vision/00-north-star.md` (mortal-loop bridge):** THR-398 §3.2 named Survey's people-layer fold as the mortal-loop on-ramp. This plan delivers the *populace mood + faction presence* half of that band. The *named-mortals* half (`{namedMortalsList}` from THR-398 §5.1) is **not** in `survey-prose-tables.ts` and not in THR-415's "Done when" — it was a separate part of THR-398's vision that either shipped elsewhere or remains deferred. **Flagged in §12.2** as an open follow-up to confirm, not silently absorbed.
- No Vision premise is contradicted or updated by this plan. No Vision edit required in this ticket's scope.

## 12. Deferrals — separate Linear tickets

1. **HexChronicle dynamic people-layer swap.** Replace HexChronicle's static `factionProse`/`cultureProse` people-layer rendering with the `composeSurveyPeopleProse` output (or a render-time sibling). Deferred per §2 Option C — the staleness model needs its own small design pass (live view vs. cast snapshot). Label `Deferral`, project Content Architecture.
2. **Named-mortals band (`{namedMortalsList}`).** THR-398 §5.1 specified Survey surfacing named mortals (most-bonded first) as the mortal-loop bridge. `survey-prose-tables.ts` has no mortal-name table and THR-415's "Done when" doesn't mention it. Confirm with Christian whether this shipped under another THR-398 child or is still owed; if owed, file as a `Deferral` in Content Architecture. **Surfaced for a user call — see §13.**
3. **`read_currents` / Sphere Cartography prose band (`{sphereCurrentsLine}`).** THR-398 §5.2 specified a soul-layer prose band for the promoted `read_currents` verb. Same gap pattern as THR-415 but for the soul layer. If unshipped, it's a parallel deferral. Out of scope here; flag if confirmed missing.

## 13. Open item for the user (non-blocking)

This plan ships cleanly without a verdict. One item is surfaced for awareness, not as a gate:

**Named-mortals band.** THR-398's vision for Survey's people layer had two halves — *populace mood + faction presence* (this issue) and *named mortals, most-bonded first* (the mortal-loop bridge, THR-398 §3.2 / §5.1). Only the first half has data tables in `survey-prose-tables.ts`, and only the first half is in THR-415's "Done when." If the named-mortals half was meant to ride THR-415, scope expands (a new mortal-ranking table + composer branch). This plan implements **exactly what THR-415's "Done when" specifies** and files the named-mortals half as deferral §12.2 for Christian to confirm or redirect. If you want it folded into THR-415 instead, say so before the executor starts and the plan grows one section.

## 14. Coordination block

- **Suggested model:** `model:sonnet` — engine + content wiring with bounded judgment (the composer API shape, the scale-normalisation, faction tiering, voice QA on assembly). Not prose-volume-heavy enough for opus; not mechanical enough for haiku.
- **Parallel-safe with:** [THR-13](https://linear.app/threadbare/issue/THR-13) (HexMap/WebGL — no file overlap), [THR-425](https://linear.app/threadbare/issue/THR-425) (Linear infra — no file overlap).
- **Mutex with:** [THR-433](https://linear.app/threadbare/issue/THR-433) (Kindle a Calling — a faction divine action; likely adds an executor branch in `unifiedActionResolution.ts` and may touch faction resolution paths). Both edit `unifiedActionResolution.ts`; the THR-415 change is a small additive block in the hex-resolution path and the THR-433 change is in the action-executor path, so they *probably* don't collide — but confirm before claiming both in parallel. Land whichever is claimed first; rebase the second.
- **Codex review:** yes — three-pillar wiring, a new TickEvent type on a 176-importer types file (additive), a touch on the 2214-line `unifiedActionResolution.ts`, and a new engine module. The PR-gated review Action will pick it up.
- **Files to touch:** `src/engine/surveyProseComposer.ts` (new), `src/data/survey-prose-tables.ts` (add §4 constants + `SURVEY_PEOPLE_CONNECTIVES`), `src/engine/unifiedActionResolution.ts` (additive block in hex-resolution, §3.2), `src/engine/revelationResolver.ts` (or `surveyProseComposer.ts` — `buildSurveyCompletedTickEvent` builder), `src/types/gameState.ts` (one `TickEvent.type` union member), `src/types/trace.ts` (`SurveyProseComposedTrace`), `src/engine/notificationRouter.ts` (additive type routing), `src/components/Game/EventLog.tsx` + `src/components/Game/GameView.tsx` (verify generic render; add type→LogEntry mapping only if needed), `src/engine/__tests__/surveyProseComposer.test.ts` (new — see §15 / §8), `Docs/plans/wiring-checklist.md`, `Docs/plans/2026-04-16-systemic-wiring-guide.md` (one-line note).
- **Done when:** §15 checklist passes.

## 15. Done when

- [ ] `src/engine/surveyProseComposer.ts` created — `composeSurveyPeopleProse`, `deriveMoodBucket`, `deriveFactionPresenceTier`, pure, no `proseEnrichment.ts` import
- [ ] `survey-prose-tables.ts` gains `UNREST_SCALE_MAX`, `FACTION_PRESENCE_DOMINANT_MIN`, `FACTION_PRESENCE_ACTIVE_MIN`, `SURVEY_FACTIONS_LISTED_CAP`, `SURVEY_EVENT_SIGNIFICANCE`, `SURVEY_PEOPLE_CONNECTIVES`
- [ ] Composer normalises location unrest (0–100) → 0–1 via `UNREST_SCALE_MAX` before bucketing
- [ ] Composer consumes `POPULACE_MOOD_PHRASES` + `FACTION_PRESENCE_VERBS` + `SURVEY_LOCATION_DESCRIPTORS` — no hardcoded prose strings
- [ ] `survey_completed` added to `TickEvent['type']` union
- [ ] `buildSurveyCompletedTickEvent` builder emits the event with `message` = composed band, `hexCoords`, `toast`/`revelation` notification
- [ ] `unifiedActionResolution.ts` hex-resolution block emits `survey_completed` on `hex.survey` success, composer call try/caught (fail-soft)
- [ ] `SurveyProseComposedTrace` added to `src/types/trace.ts`; emitted once per composer call
- [ ] `notificationRouter.ts` routes `survey_completed` — hex nav target + `discovery` feed category
- [ ] Event feed (`EventLog.tsx` / `GameView.tsx`) renders a `survey_completed` entry legibly
- [ ] `src/engine/__tests__/surveyProseComposer.test.ts` — covers: each mood bucket from normalised unrest; faction tier thresholds; empty-hex → `''`; no-factions → mood-only band; no-unrest → faction-only band; determinism (same seed → same band); assembled band is grammatical (capitalised, terminal punctuation, no raw fragment concatenation)
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green
- [ ] 30-tick CLI smoke passes (§9.4)
- [ ] Browser screenshot + console + `__DEBUG` assertion per §9
- [ ] `Docs/plans/wiring-checklist.md` + `Docs/plans/2026-04-16-systemic-wiring-guide.md` updated
- [ ] `Fixes THR-415` in the closing commit body

---

*Filed by Cowork (`keep-work-flowing`), 2026-05-14. Deferral child of [THR-398](https://linear.app/threadbare/issue/THR-398), project Content Architecture. Wiring deferral inside a settled direction — no new vision call; §13 surfaces one scope-confirmation item for the user, non-blocking. Vision audit run inline (§11).*
