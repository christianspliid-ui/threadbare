> **title:** A well-played age can be won — a god who plays the whole game finishes the Mandate before the Unmaking (THR-2245)
> **linear_issue:** THR-2245
> **author:** Claude Code (design lane, runs dl-20261118T2318Z and dl-20261119-0745)
> **created:** 2026-11-19
> **three_pillars:** Engine done (one Mandate credit for a god's place cast, one census arm and predicate) · Content done (two Twilight lines) · UI done (the Twilight renders them)

# A well-played age can be won (THR-2245)

*The rules say finishing the Mandate ends the age in triumph. No measured run has done it. This plan
finds out why, picks the one lever that lets a god who plays the whole game finish it before Doom's last
stage while a god who only watches never does, and gives the census a predicate that says so.*

## Why this is load-bearing

Christian, chat, 2026-11-18: *"assess what can push the game forward then prepare enough for design and
dev that our routines run again."* The attended session that night filed this as ticket 1 of 3 in the
direction "make the ending a game"; [the race on screen](https://linear.app/threadbare/issue/THR-2246) and
Doom's last stage (ticket 3) read this plan's constants for tuning. Today the age ends the same way whatever
the god does: every arm of the [agency census](Docs/plans/2026-11-13-thr-2205-measure-whether-the-player-matters.md)
ends in Doom. Law 32 still holds: the plan makes *which clock ends the age* depend on play. It does not rank
the player.

## What the measurement found (main @ `210bdbec`, 2026-11-19)

Census: [`proto/thr-2245-full-player-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2245-full-player-census)
(never merged), warm 300, seeds 42 / 99 / 7.
`node .cache/agency-census.mjs --all --arms none,greedy,full --out-dir .cache/agency2245b`.
Ledger = points the god's hand raised in the Mandate's first / second sphere; targets are 87 / 23
(`MANDATE_PRIMARY_TARGET_POINTS`, `MANDATE_SECONDARY_TARGET_POINTS`). Doom's last stage begins at 0.80
(`DOOM_CLIMAX_START`).

| Arm | Seed 42 | Seed 99 | Seed 7 |
|---|---|---|---|
| Hands-off (`none`), t800 | Mandate 0.11 · ledger 0.2 / 5 | 0.12 · 6.2 / 4 | 0.06 · 3.2 / 2 |
| Chapters-only (`greedy`), t800 | **0.96** · 80.2 / 63.2 | **0.85** · 60.4 / 44.8 | **0.82** · 54.8 / 57.7 |
| Chapters-only, last snapshot before Doom 0.80 (t600) | 66 / 45 | 51.6 / 34.8 | 51.2 / 55.7 |
| Naive full (chapters + gifts + Stay + Rebuke + a place cast in **both** spheres every tick), t800 | 0.87 · 64.3 / 128.2 | 0.90 · 68.9 / 104.2 | 0.91 · 71.5 / 136.2 |
| Careful full (the same, but casts only in a sphere still short of its target), t800 | 0.92 · 72.4 / 72.7 | **finished at t776**, Doom 0.93 · 87.4 / 89.2 | 0.91 · 71.8 / 76.5 |
| Careful full, last snapshot before Doom 0.80 (t600) | 44.2 / 57.2 | 53.8 / 89.2 | 47.9 / 76.5 |

Four findings:

1. **The shipped census never credited chapter spend.** `scripts/agency-census.ts` commits a held step's
   cards without writing `mandateSphereSpend`, which `GameView` writes (THR-2208). So the 2026-11-16 reading
   "Mandate 0.06 to 0.15 in every arm" was the census's gap, not the game's. Credited as the game credits it,
   chapters-only reaches 0.82 to 0.96 by tick 800.
2. **Nobody finishes.** The first sphere is the bottleneck on every played arm. The second overfills
   (35 to 136 against 23).
3. **Doing more barely fills the Mandate more.** The careful full player finishes once (seed 99, inside Doom's
   last stage) and is *behind* chapters-only on seed 42 (72.4 against 80.2 by t800; 44 against 66 at Doom 0.70). A place cast credits the Mandate only through sphere pressure that levels a score
   (`mandateCreditsFor`, place weight 1.0 × the god's share), so an essence spent on a place returns far less
   than the same essence spent on a chapter card (1.0 point per essence × band, `MANDATE_DEED_POINTS_PER_ESSENCE`).
   The Mandate's own fill line tells the player to spend "on a bound mortal's chapter, or on a place"
   (THR-2236). Half of that line is a weak promise today (Law 56's spirit).
4. **The purse already bites.** The full arms' place casts were turned away by the purse on 86 to 95% of
   attempts, and Stay the Unmaking was held only 21 to 32 ticks: place casts drained the first-sphere purse
   below Stay's upkeep. The god who builds lets Doom run (Law 30).

## Decisions (made by the design lane under delegation, 2026-11-19 — veto in chat)

1. **The three arms.** *Hands-off* = `none`. *Chapters-only* = `greedy` (plays every affordable chapter card,
   nothing else). *Full player* = `full`: the `answer` arm (chapters, gifts, Stay, Rebuke) plus, every tick
   after Stay's turn, the cheapest place card in each Mandate sphere **still short of its target**. That is
   what the fill line tells a player to do.
2. **The census credits chapter spend as the game does.** A build fix, not a design choice; every played
   arm's Mandate reading was low until it lands.
3. **The lever: a god's place cast in a Mandate sphere credits the Mandate by what it cost**, the way a
   chapter deed does: `essence paid × MANDATE_CAST_POINTS_PER_ESSENCE × MANDATE_DEED_BAND_FACTOR[band]`, on
   the target's ledger key (so rival wear can take it back, as today). The pressure-level-up credit stays.
   The targets stay at 87 / 23. Why this lever and not the others:
   - Lowering `MANDATE_PRIMARY_TARGET_POINTS` moves chapters-only as much as the full player. Chapters-only
     already holds 51 to 66 at Doom 0.80, so any target the full player meets first, chapters-only meets
     too, and the two arms end the same way.
   - Raising `MANDATE_DEED_POINTS_PER_ESSENCE` helps chapters-only more than the full player (it plays more
     chapter cards), which is the wrong way round.
   - The place weight is `entityAggregateWeight`, shared with world sphere aggregation; changing it moves
     the world, not only the Mandate.
   - The cast credit moves only an arm that casts on places. Hands-off and chapters-only are untouched by
     construction, so their readings above are already their fitted readings.
4. **The fit.** `MANDATE_CAST_POINTS_PER_ESSENCE = 1.0`, the smallest value at which the careful full
   player finishes before Doom 0.80 on at least two of three seeds (projection below).
5. **What the god gives up.** The purse pays Stay, Rebuke, chapter cards and place casts from one pool. At
   the fit, the full player wins by casting, and casting starves Stay (finding 4). A god who holds Stay all
   age slows Doom by at most about 0.12 of the clock (the 2026-11-16 decision) and pays for it in Mandate
   pace. The predicate checks that the purse still turns the full player away.
6. **What a win is called and shown.** The Mandate ending keeps its words and adds where the god's hand
   raised the most (the entity holding the largest `godHeld` share, a place or a mortal; exact words in
   § Player-facing text). A Doom ending adds how far the Mandate came, in a word, never a number (Law 13).
   Both say what happened (Law 32).

## The fit (projection from run c)

Run c: `node .cache/agency-census-c.mjs --all --arms greedy,full --ticks 900 --snap-every 25 --out-dir .cache/agency2245d`
on the proto branch, which also records the essence the full player paid on places per sphere. The
projection adds `K × 0.75 × place essence` to the measured ledger at each 25-tick snapshot (0.75 is the
`success_at_cost` band factor, the floor of a god cast's landing, THR-728, so the projection is a lower
bound) and reads the first snapshot at or above both targets. Before that crossing the real arm behaved
exactly as it would with the credit (its ledger was below target, so its casting did not change).

| K | Seed 42 | Seed 99 | Seed 7 | Before Doom 0.80 |
|---|---|---|---|---|
| 0 (today) | no finish (age ends t877) | finished t776, Doom 0.93 | no finish (t835) | 0 / 3 |
| 0.5 | t750, 0.88 | t675, 0.82 | t725, 0.89 | 0 / 3 |
| 0.75 | t700, 0.83 | t625, **0.76** | t675, 0.84 | 1 / 3 |
| **1.0** | t675, **0.799** | t575, **0.69** | t650, 0.82 | **2 / 3** |
| 1.5 | t600, 0.70 | t500, 0.58 | t575, 0.71 | 3 / 3 |

Chapters-only, same run, to the age's end: never finishes (0.96 at t881, 0.85 at t842, 0.82 at t836). Its
place essence is zero, so K does not move it.

**Chosen: `MANDATE_CAST_POINTS_PER_ESSENCE = 1.0`.** It is the smallest tested value that meets the
predicate, and it equals `MANDATE_DEED_POINTS_PER_ESSENCE`: an essence spent on a place counts the same as
one spent on a chapter, which is what the fill line already promises. 1.5 would make a place worth more than
the First's chapters, and the First is the game's centre. Seed 42's margin is thin (0.799); the band floor
makes the projection conservative, and the kill criteria say what happens if the shipped census disagrees.

## The predicate

`agencyWinPredicate(arms)` in `scripts/agency-verdict.ts`, over `AGENCY_SEEDS`, read at the age's end
(`--ticks 900`; every age ends by t890):

- hands-off finishes the Mandate on **0** seeds (`AGENCY_HANDSOFF_MAX_WINS`);
- the full player finishes it with Doom below `DOOM_CLIMAX_START` on at least **2** seeds
  (`AGENCY_FULL_MIN_WINS`);
- chapters-only finishes before `DOOM_CLIMAX_START` on **0** seeds (`AGENCY_CHAPTERS_MAX_EARLY_WINS`) and ends
  at least `AGENCY_MANDATE_DELTA` (0.10) above hands-off on at least 2 seeds;
- the purse turns the full player away on at least `AGENCY_PURSE_BITE_MIN_SHARE` (0.25) of its place-cast
  attempts.

**On main today** (run c, proto census, no cast credit): **NOT MET.** Hands-off 0 wins ✓ (Mandate 0.06 to
0.12). Full player 0 of 3 before Doom 0.80 ✗ (one late finish, seed 99 at t776, Doom 0.93). Chapters-only
0 early wins ✓, and 0.82 to 0.96 against hands-off's 0.06 to 0.12 on all three seeds ✓. Purse refused
0.92 / 0.92 / 0.93 of the full player's place casts ✓. H1 differs between hands-off and the full player on
1 of 3 seeds (seed 99). Projected with `K = 1.0`: **HOLDS** (2 of 3 before Doom 0.80).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Mandate god ledger (`mandateLedger.ts`, `phaseMandate.ts`, THR-2081) | 🟢 ACTIVE | **extends**: one more credit source, folded through the existing `mandateDeedCredits` pipe |
| Mandate deeds (`mandateDeedForChapter`, `unifiedActionResolution.ts:3316`, THR-2208) | 🟢 ACTIVE | **reused**: same band factor, same fold, same "last deeds" list |
| Player cast (`preparePlayerCast` / `commitPlayerCast`, `source === 'player'`) | 🟢 ACTIVE | **reads** essence paid and sphere at resolution |
| Twilight (`ageEnding`, `twilight.ts:109`; `AgeTwilightScreen.tsx:126`) | 🟢 ACTIVE | **extends**: one optional line per ending |
| Agency census (`scripts/agency-census.ts`, `agency-verdict.ts`) | 🟢 ACTIVE | **extends**: spend credit fix, `full` arm, win predicate |

## Engine pillar

- `mandateLedger.ts`: `mandateCastCredit({ targetId, sphere, essencePaid, band, primary, secondary })`, pure,
  returns `MandateCredit[]` (empty when the sphere is not a Mandate sphere or nothing was paid).
- `unifiedActionResolution.ts`: when a `source === 'player'` action cast by the ascendant on a place
  resolves, call it and attach the credits to `finalAction.mandateDeedCredits`, exactly where
  `mandateDeedForChapter` attaches its own (once, on the resolving step). Its aftermath row reuses
  `MANDATE_DEED_TITLE` with a place line.
- `game-config.ts`: `MANDATE_CAST_POINTS_PER_ESSENCE`, with its fit comment.
- Twilight: `ageEnding` gains an optional `reckon` string (Decision 6). The top `godHeld` key's entity name is
  read through the graph; a missing node drops the line.
- **PRNG:** none added. The band comes from the cast's existing roll.

## Content pillar

`twilight-content.ts`: `mandateWherePlace(place)`, `mandateWhereMortal(mortal)` and
`doomMandateReckon(mandateName, progress)`, plus the two thresholds. `ascendant-bar-content.ts`:
`MANDATE_CAST_DEED_LINE` and its place fallback. Exact words are in § Player-facing text. Every line stays
under 15 words.

## UI pillar

`AgeTwilightScreen.tsx` renders `ending.reckon` under `ending.line`, same type step, the named entity as an
`EntityLink` (Law 21) with its tooltip (Law 17). No new surface, no layout change (Law 33). Laws engaged:
1, 13, 14, 17, 21, 32, 33, 56.

### Player-facing text

The word thresholds `TWILIGHT_MANDATE_WITHIN_REACH` and `TWILIGHT_MANDATE_HALF_RAISED` live in
`src/data/twilight-content.ts` beside the words. The place-cast deed line lives in `src/data/ascendant-bar-content.ts`
beside `MANDATE_DEED_LINE`.

| Surface | Template | Rendered sample | Empty slot |
|---|---|---|---|
| Mandate ending, top `godHeld` key is a **place** | `Most of it was raised at {place}.` | "Most of it was raised at the Shrine of Ash." | Node gone → line dropped |
| Mandate ending, top key is a **mortal** (a chapter deed's key is the actor) | `Most of it was raised through {mortal}'s chapters.` | "Most of it was raised through Kael Thornweaver's chapters." | Node gone → the deed fallback "a mortal bound to you" |
| Doom ending, progress ≥ 0.75 | `{Mandate} stood within reach.` | "The Hunger for Order stood within reach." | No Mandate name → `MANDATE_FALLBACK_NAME` ("the Mandate") |
| Doom ending, 0.40 ≤ progress < 0.75 | `{Mandate} stood half-raised.` | "The Hunger for Order stood half-raised." | same |
| Doom ending, progress < 0.40 | `{Mandate} had barely begun.` | "The Hunger for Order had barely begun." | same |
| Mandate "last deeds" row and the cast's aftermath, title `MANDATE_DEED_TITLE` | `Your hand on {place} raised your Mandate in {Sphere}.` | "Your hand on the Shrine of Ash raised your Mandate in Order." | No place name → "a place you hold" |

Complaint classes (`Docs/ops/player-complaint-classes.md`):
- **PC-6 (one fact, one telling):** the only other surface showing Mandate progress is the Mandate bar's
  fill in `MandateBlock.tsx` (`mandate.progress`) plus its trend word (Rising / Holding / Slipping). The
  Twilight word reads the same `mandateState.progress`, so a bar three-quarters full is "within reach" by
  construction. The deed line copies `MANDATE_DEED_LINE`'s shape ("…raised your Mandate in {Sphere}"), and
  the fill line already names "or on places".
- **PC-1 (where the explanation lives):** the three phrases are plain English that need no gloss. The Mandate
  name carries its existing `ui.mandate` tooltip (Law 17).
- **PC-3 (rendered samples, no broken slots):** see the table; every slot has a fallback, and a mortal key
  gets the person form, never "at {name}".

### Playtest signal

Predicate for the warm round after tickets 2 and 3 ship: a tester whose run reaches a Mandate ending names,
in their log, a place or a mortal they spent on as the reason it was fulfilled. A tester who reaches a Doom
ending says how close the Mandate came in the Twilight's own word, or a synonym. Refuted if a winner says
"I don't know why it ended".

### Browser-verify

No lever forces an age ending today: `__DEBUG.beginTwilight()` / `getTwilightBeats()`
(`src/debug-bridge.d.ts:3165`) start the Twilight, but neither picks which ending fires. Ticket 3 adds a
debug-only `__DEBUG.setMandateProgress(fraction)` that writes `godLedger` to that share of both targets
(1 completes the Mandate), then calls `beginTwilight()`. Evidence is one 1920×1080 screenshot each at 1.0,
0.8 and 0.2 on `?view=game&seeded&size=medium`, plus `await window.__DEBUG.getTwilightBeats()` showing the
`reckon` string. Playwright DOM is enough (no WebGL).

## Interface impact

| Contract | Disposition |
|---|---|
| Action resolution → Mandate ledger (`mandateDeedCredits`) | **extend**: a second writer, same reader (`phaseMandate`) |
| Twilight read of `mandateState` | **extend**: reads `godHeld` and `progress` |

Update `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` for the new writer.

**Blast radius:** none required. The widest file touched, `unifiedActionResolution.ts`, has 72 importers
(grep of `from '…unifiedActionResolution'` across `src/` and `scripts/`), under the 100 bar; `graph.ts`
and `gameState.ts` are not touched.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — one new writer into an existing fold, one optional Twilight line, one offline census arm.

| Module | Phase | UI | GameState | Traces | Debug | Prose | Controls |
|---|---|---|---|---|---|---|---|
| `mandateCastCredit` | action resolution → `phaseMandate` fold | Mandate "last deeds" | `mandateState.godLedger`, `godHeld` | the existing `mandate.deed_credit` trace | `getMandateDeeds` | deed line | place cards (existing) |
| Twilight `reckon` | end of age | `AgeTwilightScreen` | reads only | none | `setMandateProgress` (new, debug-only) + `getTwilightBeats` | two lines | none |
| Census `full` arm + predicate | offline | none | script copy | none | console + JSON | none | none |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `MANDATE_CAST_POINTS_PER_ESSENCE` | 1.0 | Mandate points per essence a god pays on a place cast in a Mandate sphere |
| `TWILIGHT_MANDATE_WITHIN_REACH` | 0.75 | Progress at or above this reads "within reach" on a Doom ending |
| `TWILIGHT_MANDATE_HALF_RAISED` | 0.40 | At or above this (and below the first) reads "half-raised"; below reads "barely begun" |
| `AGENCY_HANDSOFF_MAX_WINS` | 0 | Seeds on which hands-off may finish the Mandate |
| `AGENCY_FULL_MIN_WINS` | 2 | Seeds on which the full player must finish before Doom's last stage |
| `AGENCY_CHAPTERS_MAX_EARLY_WINS` | 0 | Seeds on which chapters-only may finish before Doom's last stage |
| `AGENCY_PURSE_BITE_MIN_SHARE` | 0.25 | Share of the full player's place-cast attempts the purse must refuse |
| `AGENCY_WIN_TICKS` | 900 | Run length for the win predicate (past every age's end) |

## Tracing

No new trace type. The cast credit is a `MandateCredit` like a deed's (`mandateLedger.ts:233`), told apart
by its `source`, and rides the existing `mandate.deed_credit` trace:

```ts
// mandateLedger.ts — one optional value added to the existing union
source?: 'deed' | 'cast';
```

The census prints one win-predicate line naming each clause.

## Fail-soft table

| Failure | Behaviour |
|---|---|
| No sphere-growth Mandate, or the cast's sphere is not a Mandate sphere | No credit |
| Essence paid missing or not finite | No credit |
| Band missing | `deedBandOf` fallback (as deeds) |
| Top `godHeld` node gone | The "where" line is dropped; the ending still renders |
| Census arm crashes | That seed reads "not measured"; the predicate counts measured seeds only |

## Implementation tickets

1. **Census:** chapter spend credits the Mandate; `full` arm (careful: casts only in a short sphere);
   `--snap-every`; win predicate. Scripts only. Promote from the proto branch.
2. **Engine + content:** a place cast in a Mandate sphere credits the Mandate by what it cost. Blocked by
   ticket 1, because its Done-when reads ticket 1's predicate.
3. **Content + UI:** the Twilight says where the Mandate was raised, or how far it came, plus a debug-only
   `__DEBUG.setMandateProgress(fraction)` to force each ending for evidence. Independent.

## Done when

- [ ] Ticket 1 merged: `npm run census:agency -- --all --arms none,greedy,full --ticks 900` prints the win
  predicate line.
- [ ] Ticket 2 merged, and that line reads **HOLDS** on main.
- [ ] Ticket 3 merged with its screenshots.
- [ ] Each ticket: `npm run gate` green on the code track; ticket 2 passes the review-gate; each PR body
  carries its own `Fixes` line (never this plan ticket's).
- [ ] **Fixed when:** the census reads a different H1 (which clock ended the age) between hands-off and the
  full player on at least two of three seeds.

## Kill criteria

- If ticket 2's census reads NOT MET at 1.0 (seed 42's margin is 0.001 of the clock), ticket 2 tries 1.25,
  then 1.5 (projected 3 of 3), and ships the first that holds, with its reading in the constant's comment.
  If 1.5 does not hold, the place route is not the lever: release ticket 2 and the lane decides again.
- If chapters-only starts finishing before Doom's last stage (a later change to deeds), the separation is
  gone: refit before quoting the predicate.
- If warm testers win without noticing what won it, ticket 3's words are wrong, not the fit.

## Coordination block

**Suggested model:** opus for ticket 2 (engine resolution path, review-gate), sonnet for 1 and 3.
**Parallel-safe with:** [the race on screen](https://linear.app/threadbare/issue/THR-2246): it reads these
constants, touches HUD files, not these.
**Mutex with:** `scripts/agency-census.ts` (ticket 1 only); `unifiedActionResolution.ts` near the deed hook
(ticket 2).

**Files to touch:** ticket 1 — `scripts/agency-census.ts`, `scripts/agency-verdict.ts`, their tests. Ticket 2 —
`src/engine/mandateLedger.ts`, `src/engine/unifiedActionResolution.ts`, `src/data/game-config.ts`, the deed-line
content file, tests, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/canon/rulebook.md`
§8. Ticket 3 — `src/engine/twilight.ts`, `src/data/twilight-content.ts`, `src/components/Game/AgeTwilightScreen.tsx`, `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, tests. The place-cast deed line has no strong form: a place cast is one fixed-cost act, and the strong form marks a large chapter.

## Notes for the executor

- The proto branch already has the arm, the spend fix and `--snap-every`; promote it, drop `--place-all`.
- An `--all` census is about 40 minutes: launch it detached and poll in foreground calls (impediment #1257).
- Ticket 2's review-gate applies (`src/engine/`).

## Three-pillar check

- [x] Engine: one Mandate credit writer, one constant, one census arm and predicate
- [x] Content: two Twilight lines and one deed line
- [x] UI: the Twilight renders one optional line with an entity link
- [x] Wiring: table above; one new writer into the existing `mandateDeedCredits` fold

## Rulebook impact

- [x] §8 gains one sentence: a god's cast on a place in a Mandate sphere fills the Mandate by its cost.
  Part of ticket 2.
- [x] No other rule of play changes; the targets and both clocks' pace stay as they are.

## Vision audit

- [x] Two clocks, one purse (Law 30) is made *more* true: the purse now forces the build-or-hold choice.
- [x] Law 32: endings stay "different, never better"; the new lines describe, never rank.
- [x] Vision `00-north-star.md`: the two clocks and one purse are confirmed. "Not a game about winning" holds,
  because the Mandate was already a named ending, and this plan makes it reachable without adding a score or
  a victory word. `02-non-negotiables.md` #3 (prose, never numbers) is confirmed by the Twilight's band words.
  `03-design-tensions.md` #4: the census arms are measurement policies, not advice shown to the player.
- [x] Not decided here: a second journey after the Return (reserved for Christian, THR-2204 plan). The fit
  holds with today's answer.

## Intent-judge verdict

**Allow** on run 2, 2026-11-19, with impact class Reversible confirmed. Run 1 returned **Revise**: dimension 12 (player legibility) had no player-facing text table or playtest signal and no mortal form for the "where" line, and dimension 3 (wiring) pointed browser-verify at `?outcome`, which does not pick an age ending. Both were fixed in § UI pillar. Run 2 found one small GAP: the debug lever was missing from ticket 3's scope and file list. Fixed above.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-11-19. Condensed; all three ran on the draft before the
player-text revision.*

**NFP audit: PASS-with-notes.** 1, 2, 4, 5, 6, 7 PASS. 3 PASS-with-note: no PRNG added and the census seeds
are fixed, but the fit is a projection from measured runs, not a shipped measurement. Ticket 2's kill
criterion re-measures it.

**Three-pillar audit: PASS-with-notes.** Engine and Content are present and substantive. The substrate
inventory extends the Mandate ledger and Twilight, with no green-field duplication. UI was thin: it lacked
the player-facing text table, the playtest signal and the standard gate lines in Done-when. Fixed: § UI
pillar now has its three subsections, and Done-when has the gate line.

**Vision audit: PASS-with-notes.** No contradictions. Two clocks and one purse are confirmed; prose, never
numbers, is confirmed. Notes: "a well-played age can be won" sits near "endgame is reflection, not victory".
This is soft, since the Mandate was already a named ending. The fitted "careful" arm could invite
optimal-strategy talk (tension 4). Fixed: § Vision audit now cites the Vision files and says the arms are
measurement policies, not advice to the player.

> Brainstorm companion: `Docs/plans/2026-11-19-thr-2245-a-well-played-age-can-be-won-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | One new credit constant; every threshold above is named |
| 2. Inspectability | PASS | Credits carry `source: 'cast'`; the predicate names each clause |
| 3. Determinism | PASS | No new randomness; fixed census seeds |
| 4. Fail-soft | PASS | See the table; a missing input credits nothing |
| 5. Narrative over mechanics | PASS | The Twilight says where the god's hand mattered |
| 6. Additive | PASS | A second writer to an existing pipe; targets unchanged |
| 7. Performance | PASS | One pure call per resolved player cast |
