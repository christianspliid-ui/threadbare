> **title:** A lean waits for its road — the cap keeps the road the god leaned on, a lean whose road is out of sight waits for it instead of lapsing, and "likely" needs a clearer lead (THR-2188)
> **linear_issue:** THR-2188
> **author:** Claude Code (design lane, unattended, 2026-11-07 — run dl-2026-11-07-0219)
> **created:** 2026-11-07
> **three_pillars:** Engine done (one cap reserve, one wait branch, one constant) · Content done (four lines and one rulebook sentence) · UI done (no new surface; the held line and the fade toast change words)

# A lean waits for its road (THR-2188)

*A Crossroads lean that says "likely" ends "Your lean finds nothing to hold" more often than it is followed. The road was not gone from the world. The encounter cap cut it at the mortal's next decision, the same cut God's Will was protected from in THR-1781. This plan carries that protection to the lean, lets a lean whose road is briefly out of sight wait for it inside the hold it already has, and widens the lead that earns "likely". Measured: `likely` followed on 22% of all leans today, 64% after.*

## Why this is load-bearing

[The Crossroads](2026-10-14-thr-1926-the-crossroads.md) replaced the forced God's Will pick on Christian's ruling (chat 2026-10-14, "yes please replace"). Its promise is Law 17 and Law 18: the player is told before paying how likely the lean is to turn the mortal, and that word comes from the board that decides. Today that word is wrong more than half the time, not because the mortal resisted but because the road was cut from the mortal's view before they chose. A player who pays twice and hears "nothing to hold" twice stops paying. The lean is the only god verb left that steers a threaded mortal's next choice, so an unreliable lean is an empty slot in the god's hand.

**Decided by delegation — design lane, 2026-11-07 (process.md rule 4).** All three changes below are this lane's call, inside the agreed Crossroads design. Veto in chat. The evidence and the options not taken are in the [brainstorm companion](2026-11-07-thr-2188-a-lean-waits-for-its-road-brainstorm.md).

## The measurement

Instrument: `scripts/crossroads-lean-census.ts` on the never-merged branch [`proto/thr-2188-lean-waits-for-its-road`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2188-lean-waits-for-its-road) (main @ `2b3bebee` plus the prototype). Seeds 42 and 7, 600 ticks, medium map, six threaded mortals per seed, a lean at every fresh reading in rotation (toward road 2, away from road 1, toward the last road). Deterministic: two runs of the same arm gave identical tables.

| Arm | Leans | Lapsed | `likely` followed / all | `may` | `not_enough` |
|---|---|---|---|---|---|
| Today | 1,542 | 890 (58%) | 127 / 584 (22%) | 66 / 310 (21%) | 55 / 648 (8%) |
| R — the cap keeps the leaned road | 1,453 | 257 (18%) | 274 / 566 (48%) | 151 / 292 (52%) | 105 / 595 (18%) |
| R + W — and a lean waits for its road | 761 | 17 (2%) | 192 / 294 (65%) | 109 / 161 (68%) | 81 / 306 (26%) |
| **R + W + margin 1.5 (this plan)** | 761 | 17 (2%) | **127 / 197 (64%)** | 174 / 258 (67%) | 81 / 306 (26%) |

R + W places fewer leans because each lean is held longer; the 761 are the same mortals over the same ticks.

Why the cap: 855 of the 890 lapses today were encounters whose template was on no list at the next decision, a median of four ticks later. In 224 the mortal was standing at the road's own place. 591 of the 855 came back onto a reading within 72 ticks.

Why the margin: under R + W, toward leans followed by lead at placement were below 1× 14%, 1–1.25× 39%, 1.25–1.5× 40%, 1.5–2× 57%. At 1.25 the two 40% bands both said "likely". At 1.5, toward reads `likely` 84 / 149 (56%), `may` 45 / 119 (38%), `not_enough` 33 / 241 (14%): each word now means more than the one below it.

**Not fixed here: the away words.** Away leans are followed 77–98% whatever their word, including 48 of 62 that said "Kael will hold to it anyway". The road the mortal did not take is rarely first again, lean or no lean. That is a question of what an away lean is worth, not a lapse, so it has its own ticket: [Away leans almost always "work"](https://linear.app/threadbare/issue/THR-2189). The overall `likely` figure above includes away leans, which flatters it. Toward alone is 56%.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Encounter filter pipeline — cap stage `capWithDiversity` (`encounterFilterPipeline.ts`) | 🟢 ACTIVE | **extends** — one reserve phase after 1e-bis, the `compelledTarget` shape |
| Encounter cache entry (`encounterCache.ts`) | 🟢 ACTIVE | **extends** — one optional per-decision flag, set on a copy |
| Agent decision phase (`phaseAgentDecision.ts`) | 🟢 ACTIVE | **extends** — flags the held lean's encounter before the filter; one wait branch before the lean resolves |
| The Crossroads (`crossroads.ts`, `crossroadsDecision.ts`, `crossroads-content.ts`) | 🟢 ACTIVE (THR-1926/1928) | **extends** — one trace, two content lines, one constant retuned |
| Story breath (`filterByStoryBreath`) | 🟢 ACTIVE | **preserved** — the leaned road does not pass the breath (see Engine) |

Population: threaded mortals with a held lean, at most one lean each, so at most one reserved cap slot per deciding mortal.

## Engine pillar

### Systems design

1. **The cap keeps the leaned road.** In `phaseAgentDecision`, beside the THR-1781 `compelledTarget` block, a held encounter lean (`readCrossroadsLean(actor.properties.crossroadsLean)`, family `encounter`, either direction) flags its entry on a copy of `mergedEntries`: the exact instance (`templateId` + `locationId === targetId`) first, else the first instance of the template. New optional field `EncounterCacheEntry.leanedRoad?: boolean`. `capWithDiversity` gains **Phase 1e-ter**, right after 1e-bis: at most one `leanedRoad` entry is reserved, same key rule. Scoring still decides; the board's ×2 / ×0.5 is unchanged.
2. **A lean waits for its road.** In the lean resolution block, when `CROSSROADS_LEAN_WAITS_FOR_ROAD` is true and the prepared lean is held, not expired, not malformed, and has no `effective` road (`prepareCrossroadsLean` found it on neither list), the lean is **not** resolved and **not** cleared. It emits `crossroads_lean_waiting` and stays on the mortal for the next decision. It still ends at `CROSSROADS_HOLD_MAX_TICKS` as `lapsed_expired`, with the fade toast. With the flag off, today's `lapsed_unavailable` path runs unchanged.
3. **"Likely" needs a lead of 1.5.** `CROSSROADS_LIKELY_MARGIN` 1.25 → 1.5 (inside its documented `@range 1.1–1.5`). `forecastLean` is unchanged.

**The leaned road does not pass the story breath.** God's Will's target does (`filterByStoryBreath` and `applyStoryTellingsCap` keep `compelledTarget`). A lean must not. During the breath only routine roads stand, so a leaned road there would win almost by default, which is a command (Law 9). Under change 2, a lean whose road the breath hides waits the breath out.

### Graph nodes / edges

None. `crossroadsLean` stays a node property; `leanedRoad` lives only on the per-decision copy of a cache entry and is never written to the shared cache.

### Tick phases

Agent decision only, at the two existing Crossroads sites (before the filter pipeline; the lean resolution block after the live branch). No new phase.

### Resolution logic

| Held lean at a full decision | Today | After |
|---|---|---|
| Past `CROSSROADS_HOLD_MAX_TICKS` | `lapsed_expired`, cleared | unchanged |
| Its road on the board | followed / resisted, cleared | unchanged; the cap no longer cuts the road first |
| Its road off every list | `lapsed_unavailable`, cleared | **waits**: trace only, lean kept |
| Malformed | cleared with a trace | unchanged |

`lapsed_unavailable` stays in the type and the content table for the flag-off path and old traces.

### PRNG callouts

None. The flag, the reserve and the wait are deterministic; the reserve walks entries in list order.

## Content pillar

Content files: `src/data/crossroads-content.ts`, `Docs/canon/rulebook.md`. No encounter templates, prose tables or attachments change.

| Key | Today | After |
|---|---|---|
| `LEAN_HELD.toward` | "Your hand rests on {name}, toward {road}. It holds until {name} next chooses." | "Your hand rests on {name}, toward {road}. It waits until {name} next faces that road." |
| `LEAN_HELD.away` | "Your hand rests on {name}, away from {road}. It holds until {name} next chooses." | "Your hand rests on {name}, away from {road}. It waits until {name} next faces that road." |
| `OUTCOME_TOAST.lapsed_expired` | "Your lean fades: {name} never came free to choose." | "Your lean fades: {name} never came back to {road}." |

Plus the forecast tooltip in `src/data/ui-content.ts` (`ui.crossroads.forecast`), reworded as in the UI pillar's text table. `resolveCrossroadsLean` already fills `{road}` for every outcome line, so the expiry line needs no new fill. The new expiry line is true in both of its cases: the mortal stayed busy, or the road never came back. `LEAN_PLACED_MESSAGE` aliases `LEAN_HELD` and follows it.

**Rulebook §4**, *You can stand at a threaded mortal's crossroads*: "It waits for their next free choice, they may still choose otherwise" becomes "It waits until that road is in front of them again, for up to six days; they may still choose otherwise". Add the changelog line at the foot of the rulebook.

## UI pillar

*Screenshot tool: Playwright (DOM). No WebGL.*

No new surface or component. Two existing surfaces read the changed words: the Crossroads row's held state (`crossroadsRow.ts`, drawn by `CardActStrip`) and the outcome toast. Laws engaged: Law 17 (stakes in words before paying: the forecast word is computed as before, against a clearer margin), Law 13/14 (no numerals: "six days" appears only in the rulebook, not on screen), Law 21 (the road name stays an identity link), Law 33 (nothing new to fit; the held line grows by four characters inside the existing strip).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Crossroads row, held | "Your hand rests on Kael, toward The Oath-Breaker's Rite. It waits until Kael next faces that road." · "Lift your hand" | PC-4, PC-8 | The paid lean is visible and says what it is waiting for. A lean that seems to sit idle now says why. |
| Outcome toast, expired | "Your lean fades: Kael never came back to The Oath-Breaker's Rite." | PC-2, PC-8 | The ending names the road, so the player knows the world moved, not that the lean misfired |
| Confirm strip forecast (before) | "Kael will likely turn to it." / "It may tip Kael." / "Not enough to turn Kael." (words unchanged) | PC-1, PC-2 | "Likely" now appears only when the leaned road leads by half again. The explanation lives in tooltip `ui.crossroads.forecast` (`src/data/ui-content.ts`), today "Read from how they weigh things now. The world may change before they choose." Reworded so it agrees with the held line (PC-6): **"Read from how they weigh things now. The world may change before they choose, and your hand waits until that road is in front of them again."** |
| Outcome toast, followed (after; unchanged) | "Kael turns to The Oath-Breaker's Rite, as you leaned. Kael calls it faith." | PC-2 | Answers "will likely turn to it" in the same verb. It now arrives far more often, because the road is still there to turn to |
| Outcome toast, resisted (after; unchanged) | "Kael feels your hand and chooses the Tavern Dispute at Greyford anyway. Kael pushes the hand away and does not look back." | PC-2 | Answers "It may tip Kael" or "Not enough to turn Kael": the lean was felt and refused. Today a resist on a "likely" lean was often a cut road reported as "nothing to hold"; now it is a real refusal |

The "nothing to hold" toast stops appearing in normal play.

### Playtest signal

A tester who leans on a threaded mortal's road and is told "likely" sees the mortal take that road more often than not. No tester lists "Your lean finds nothing to hold" under surprises.

### Debug inspection

`window.__DEBUG` adds nothing. `getCrossroads` already returns the held lean; a waiting lean shows there with its `tick`. The trace viewer lists `crossroads_lean_waiting`.

### Visual presence (HexMapV2)

N/A: no map signifier, overlay or layer changes. The lean has no map presence today, and this plan adds none.

### Vocabulary

"Crossroads", "lean" and "road" (one option the mortal weighs) are on screen since THR-1928 but have no UL entry, and "road" collides with the literal road between places. This plan adds no new term. The entries and the collision go to [UL-proposal: Crossroads, Lean and Road](https://linear.app/threadbare/issue/THR-2190); the new held line uses "that road" only in the existing choice sense.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — new trace registered in the union; constant in its data file; no new phase, UI component or GameState field.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `phaseAgentDecision` lean flag | agent decision, before `runFilterPipeline` | — | per-decision copy of `mergedEntries` | — | — |
| `capWithDiversity` Phase 1e-ter | agent decision (filter) | — | — | `encounter_filter.leanReserved?` | trace viewer |
| lean wait branch | agent decision, lean resolution | Crossroads row held state | `crossroadsLean` kept | `crossroads_lean_waiting` | trace viewer, `getCrossroads` |

## Interface impact

| Contract | Change |
|---|---|
| `god-leans-mortal-crossroads` (`scripts/interface-contracts.ts`) | **extend**: the held lean is now also read before the filter (flag `leanedRoad`, read by the cap) and may stay held across decisions; add `leanedRoad` and `CROSSROADS_LEAN_WAITS_FOR_ROAD` to its symbols. Update `Docs/canon/interface-map.md` with the dated line |

No new cross-system write: the flag is written and read inside agent decision.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `CROSSROADS_LEAN_WAITS_FOR_ROAD` (new, `premonition-constants.ts`) | `true` | One-flag revert: `false` restores today's `lapsed_unavailable` at the first decision without the road |
| `CROSSROADS_LIKELY_MARGIN` | 1.25 → **1.5** | Lead the leaned road must hold to read *likely*; measured above |
| `CROSSROADS_HOLD_MAX_TICKS` | 72 (unchanged) | Now also bounds how long a lean waits for its road |

The reserve takes one slot and needs no constant (the 1e-bis shape: at most one flagged entry).

## Tracing

```ts
// crossroads_lean_waiting — a held lean's road was on no list this decision, so it waits (THR-2188)
export interface CrossroadsLeanWaitingTrace extends TraceBase {
  category: 'crossroads_lean_waiting';
  agentId: string;
  family: 'encounter' | 'strategic_action';
  templateId: string;
  targetId: string | null;
  direction: 'toward' | 'away';
  heldTicks: number; // tick − lean.tick
}
```

Add it to `src/types/traces/crossroads-traces.ts` and the trace union beside the other three. Also add one optional field to the existing `encounter_filter` trace (`FilterPipelineTrace`): `leanReserved?: boolean`, true when Phase 1e-ter kept a road the cap would otherwise have cut. That makes the reserve's effect visible per decision.

Volume: at most one `crossroads_lean_waiting` per full decision per threaded mortal holding a lean, for at most `CROSSROADS_HOLD_MAX_TICKS`. Threaded mortals are single digits per run, and traces are emitted only while tracing is on, as every Crossroads trace is.

## Fail-soft table

| Failure | Fallback |
|---|---|
| A malformed `crossroadsLean` | Not flagged, not waited; today's malformed path clears it |
| No cache entry matches the lean's template | No flag; the lean waits (or lapses with the flag off) |
| Two entries carry `leanedRoad` | Only the first is reserved (the loop breaks), as 1e-bis |
| The mortal dies while a lean waits | Nothing resolves; the property goes with the node, as a held lean does today |
| The wait test | Reads only fields already on the prepared lean and cannot throw; a throw inside resolution keeps today's path (caught, lean cleared) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | wide-blast (CLAUDE.md high-impact list) | One union member added; additive, no existing member changes |
| `src/engine/encounterCache.ts` | 74 | One optional field; every reader treats it as absent |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present (changed words on existing surfaces)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. Law 9 holds because the reserve keeps a road in view and the board still scores it, and the breath still binds. Laws 17, 18 and 45 are what this restores.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan changes a rule of play: when a held lean resolves.
- [x] `Docs/canon/rulebook.md` §4 is updated in the build PR (Content pillar above).

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | One revert flag, one retuned constant, the existing hold |
| 2. Inspectability | PASS | `crossroads_lean_waiting`; the outcome trace's `heldTicks` now spans the wait |
| 3. Determinism | PASS | No randomness; list-order walk |
| 4. Fail-soft | PASS | Table above |
| 5. Narrative over mechanics | PASS | The expiry line names the road the world took away |
| 6. Additive over destructive | PASS | New optional field, new phase, new trace; `lapsed_unavailable` kept |
| 7. Performance | PASS | One extra loop over `mergedEntries` per threaded mortal with a held lean |

## Done when

- [ ] The census (`scripts/crossroads-lean-census.ts`, ported from the proto branch **without** its env switches, as `npm run census:crossroads-leans`) on seeds 42 and 7, 600 ticks, shows `likely` followed on ≥ 60% of all leans and lapses (both kinds) ≤ 5% of leans. Paste the before and after tables in the PR.
- [ ] Unit tests: `capWithDiversity` keeps one `leanedRoad` entry past the cap and never two; a held lean with no road on the board stays held and traces `crossroads_lean_waiting`; with `CROSSROADS_LEAN_WAITS_FOR_ROAD = false` it lapses as today; `filterByStoryBreath` drops a `leanedRoad` entry. Existing `crossroads*.test.ts` expectations of `lapsed_unavailable` move to the flag-off arm.
- [ ] The two `LEAN_HELD` lines, the expiry toast, the `ui.crossroads.forecast` tooltip and rulebook §4 read exactly as in the Content table and the UI text table.
- [ ] Wiki: the `agents-reference`, `encounters-agents-reference` and `encounters-manual-reference` pages (sources match `phaseAgentDecision.ts` / `encounterFilterPipeline.ts`) gain the cap reserve and the wait.
- [ ] `npm run gate` passes, including the 30-tick CLI smoke. Browser evidence: one 1920×1080 screenshot of the held line on Kael's Crossroads row (`?view=game&seeded&size=medium`).

## Kill criteria

- If the build's census on seeds 42 and 7 shows `likely` followed on fewer than 60% of all leans, or lapses above 5% of leans, the fix is not working. Re-measure arm by arm before shipping.
- If the reserve visibly shifts the wider encounter mix (the cap gives up one free slot per mortal holding an encounter lean), set `CROSSROADS_LEAN_WAITS_FOR_ROAD` to false and delete Phase 1e-ter. Both are one-step reverts.
- If toward `likely` still reads below half after the fix, the next lever is the multipliers (the THR-1926 kill criterion), never a forced pick.

## Coordination block

**Suggested model:** opus. It edits the cap stage and the decision phase, both wide-blast, and the census needs reading per direction.

**Parallel-safe with:** any UI-only ticket. Nothing else on the shelf touches `encounterFilterPipeline.ts` or the Crossroads files.

**Mutex with:** any ticket editing `capWithDiversity`'s reserve phases or `phaseAgentDecision`'s pre-filter flag blocks (journey goal, compulsion), since reserve order is load-bearing. Also any ticket on `forecastLean` / `CROSSROADS_*`, including [Away leans almost always "work"](https://linear.app/threadbare/issue/THR-2189), which must build after this one so its census starts from the fixed board.

**Files to touch:**
- Edit: `src/engine/encounterCache.ts` (`leanedRoad?` field), `src/engine/encounterFilterPipeline.ts` (Phase 1e-ter), `src/engine/phaseAgentDecision.ts` (flag block; wait branch), `src/data/premonition-constants.ts` (flag, margin), `src/data/crossroads-content.ts` (three lines), `src/data/ui-content.ts` (the forecast tooltip), `src/types/traces/crossroads-traces.ts` + trace union, `src/types/trace.ts` (`FilterPipelineTrace.leanReserved?`) and its emit site in `encounterFilterPipeline.ts`, `Docs/canon/rulebook.md`, `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`, the three wiki pages, the crossroads tests
- Create: `scripts/crossroads-lean-census.ts` + its `package.json` script

## Notes for the executor

- Port the census from the proto branch, not the proto engine edits: those read `process.env` inside `src/`, which must not ship.
- The proto flag block reads the raw property; use `readCrossroadsLean` so a malformed lean flags nothing.
- Do not let `leanedRoad` into `filterByStoryBreath`'s keep-list (Engine § the story breath).
- `review-gate` applies (touches `src/engine/`).

## Intent-judge verdict

Three runs, cold, opus. **Run 1: Revise.** Three gaps: no kill criteria in the plan, the after-roll toasts not quoted (PC-2), and a false claim that the terms had UL entries. All three fixed, and UL-proposal THR-2190 filed. **Run 2: Revise.** One gap: the forecast tooltip text was not quoted, and it needed checking against the new held line (PC-1, PC-6). Quoted and reworded. **Run 3: Allow** (Reversible). Two consistency notes, both fixed: the tooltip was added to the Done-when and the files list, and the stale Wiring row now names `encounter_filter.leanReserved?`.

## Forked-audit verdicts

### NFP audit

**NFP AUDIT: PASS-with-notes.** Tunability, determinism, fail-soft, narrative and additive all PASS. Inspectability, note: Phase 1e-ter emitted no trace, so a reserve's effect was invisible per decision. *Fixed:* `encounter_filter` gains `leanReserved?`. Performance, note: the waiting trace's volume was unstated. *Fixed:* § Tracing states the bound (one per decision per threaded mortal holding a lean, tracing on only).

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** All three pillars are present and substantive, wiring maps every module, and the substrate inventory extends existing systems only. Note: "Visual presence (HexMapV2)" had no explicit N/A. *Fixed:* added. Note: the Content and UI template subsections are folded into prose. Kept: the slice is three lines of content and no new surface, and the size cap (THR-1948) asks for that.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions. North star, core loop, non-negotiables (#1 influence not command; #3 no numbers; #6 additive; #7 three pillars) and taste profile are respected. Design tension #4 (legibility vs mystery) moves toward legibility. Note: the cap reserve guarantees the leaned road is seen, a small step toward steering, bounded by scoring, one slot and the breath exclusion. Note: away leans keep a legibility gap, deferred to THR-2189 and not counted against this plan. Note: the Vision section argues from Laws rather than citing Vision files. Accepted: the Laws are the operative form of those premises.
