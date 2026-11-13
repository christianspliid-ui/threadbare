> **title:** Make the purse bite — a full hand costs more than the god can afford — THR-2201
> **linear_issue:** THR-2201
> **author:** Claude Code (design lane, run dl-20261113T0747Z)
> **created:** 2026-11-13
> **three_pillars:** Engine done · Content done (one data constant scale, no authored text) · UI done

# Make the purse bite — THR-2201

Law 36 says choosing which card to play *is* the play; today no attended step asks for that choice, because the
god can always pay for every card.

## Why this is load-bearing

The 2026-11-12 expert session found every pool at its cap and "play every card" the best move at every step
(ticket body). This is ticket 1 of 5 in Christian's "make the middle a game" direction (chat, 2026-11-12,
"Yes, file them"). The other four assume a spend that matters: [give both clocks a verb](https://linear.app/threadbare/issue/THR-2202)
prices its Doom and rival answers from these same pools (Law 30), and a free purse makes those prices empty too.

**Census, confirming the playtest (Law 1: the experienced rate, not the authored price).** Census script
`scripts/essence-scarcity-census.ts`, on the never-merged branch `proto/thr-2201-essence-census`; slice A commits
it to `main`. It builds the seeded route headless: `devSeedTheFirst`,
the warm spine beats, `warm=300` unattended, then The First attended. A **greedy god** plays every card it can
still pay for at each held step, through the real `buildNudgePhaseModel` and `spendNudgeEssence`.

| seed (attended window) | attended steps | home (Mind) pool at a step, median of cap | full hand affordable | income ÷ greedy spend |
|---|---|---|---|---|
| 42 (t91–722) | 15 | 0.99 | 15 / 15 | 14.6× |
| 99 (t301–632) | 23 | 0.92 | 23 / 23 | 4.7× |
| 7 (t301–574) | 17 | 0.94 | 17 / 17 | 5.5× |

Hands hold a median of 4 cards costing 8 in all (authored step-card costs: `0:37 1:200 2:365 3:20 5:3`, mean 1.61).
An attended step comes about every 40–48 ticks; the god's two home pools earn about 80 essence in that gap.
On seed 42, 932 essence overflowed the cap after season 1. **The cap is the only thing that binds.**

**Two code paths make prices unable to bind at all** (read in `origin/main`, 2026-11-13):

1. `buildNudgePhaseModel.ts:600`: `accessibleSpheres = SPHERE_NAMES.filter((s) => (pool?.[s] ?? 0) > 0)`. The
   sphere discount in `effectiveNudgeCost` (`encounters/nudges.ts:181`) goes to every sphere with *any* essence,
   and the 4% income floor (`UNBOUGHT_SPHERE_INCOME_SHARE`) keeps all twelve above 0. So almost every signed
   card is discounted. The rulebook (§7) says the discount is for "a sphere you are aligned to".
2. `buildNudgePhaseModel.ts:458` and `nudgeCommit.ts:73-93`: a card with no sphere is priced against, and
   paid from, the **sum of all twelve pools**, about 710 on seed 42 at t541, against a home purse of about 120.
   Cold testers already flagged that sum as hidden pools ("Available: 609 essence", [THR-2142](https://linear.app/threadbare/issue/THR-2142) item 5).

**Price alone is not enough (measured, seed 42, both code paths fixed as below).** Prices ×2: 12/12 full hands
affordable. Prices ×3 and cap 35: 12/12, home pool median 0.58 at a step. Only the refill rate moves it.
Prices ×3, cap 35, base and seat income halved: **5/13 (38%)** on seed 42 and **2/19 (11%)** on seed 99.
Prices ×2, cap 35, income at 0.3: 5/10 (50%). Raw outputs:
the experiment lines in the [brainstorm companion](2026-11-13-thr-2201-make-the-purse-bite-brainstorm.md).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Essence & Divine Economy: income `computeEssenceGeneration`, cap `computeMaxEssence` (`influence.ts`) | 🟢 ACTIVE | **extends**: three constants retuned |
| Thread upkeep `phaseInfluenceMaintenance` (THR-1747/1748) | 🟢 ACTIVE | unchanged; guarded by P3 |
| Nudge hand `buildNudgePhaseModel` + `effectiveNudgeCost` (THR-885 discount) | 🟢 ACTIVE | **extends**: discount list = bought spheres; price scale |
| Commit spend `spendNudgeEssence` (Law 19) | 🟢 ACTIVE | **extends**: sphere-less spill limited to bought spheres |
| Meet The First cost cap `meetingNudgeCostCap` | 🟢 ACTIVE | unchanged; exempt from the scale (P4) |

## Interface impact

| Contract (`Docs/canon/interface-map.md`) | Disposition |
|---|---|
| Essence & Divine Economy → encounter hand (reads `essencePool`) | **preserve**: the same read, now summing only bought spheres for sphere-less cards |
| Encounter commit → Essence (writes `essencePool`) | **preserve**: the same write, fewer source pools |
| Essence → Rival Gods, Doom, divine casts (spend from the same pools) | **preserve**: slower income only; no contract shape changes |

## The scarcity target (the predicate)

Measured by `npm run census:essence-scarcity` on seeds 42, 99 and 7, `--warm 300`, ticks after the first season
(t > 90) through at least t560, greedy god. All four must hold on **each** seed:

- **P1 — the purse bites:** the full hand is affordable at **fewer than half** of attended steps.
- **P2 — never empty-handed:** at least one card in the hand is affordable at **≥ 90%** of attended steps.
  Scarcity means choosing, never watching.
- **P3 — threads still keep:** in the same run with the greedy god switched off (`--no-play`), thread upkeep
  is paid in full on **≥ 95%** of ticks. A god who plays nothing must not lose its threads to the retune.
  (With play on, missed upkeep is the honest Law 30 trade and is reported, not gated.)
- **P4 — Meet The First is untouched:** every meeting card is affordable when offered. The existing
  `meetingNudgeConversion.test.ts` and `meetingNudgeStage.test.ts` stay green.

## Engine pillar

Two rule fixes, then three constants tuned against the predicate, in this order. Stop at the first setting
where P1–P4 hold on all three seeds; prefer the smallest change from today's numbers.

**Rule fix 1 — the discount goes to the god's own spheres.** `accessibleSpheres` becomes the spheres the god
bought points in: `getSpherePoints(ascendant) > 0` (`src/engine/spherePoints.ts`). Holding a little essence
no longer counts. The same list feeds `effectiveNudgeCost`, `totalNudgeCost` and the card models, so the shown
price and the charged price still cannot differ (Law 18's sibling for prices). Law 37 (home ground is cheaper)
now holds as written. **One exported helper** (e.g. `homeSpheresFor(gameState)` beside `essenceReader`) feeds
both the stage and `window.__DEBUG.getEncounterNudges` (`src/debug-bridge.ts` ~L3466-3480). That bridge keeps
its own copy today (`accessibleSpheres: Object.keys(pool)`, a sphere-less sum over every pool) and reports the
authored cost. It must switch to the helper and report the effective cost beside the authored one, with a test
that the bridge and the stage price the same card the same.

**Rule fix 2 — a sphere-less card is paid from the god's own spheres.** `spendNudgeEssence` pays a common card
from the primary sphere first, then the other bought spheres by point weight. It never touches a sphere the god
did not buy. `essenceReader`'s sphere-less branch sums the same bought spheres, so the hand prices what the
commit charges.

**Tuning, in order** (each a named constant; the executor moves them, re-runs the census, records each try):

1. `NUDGE_ESSENCE_COST_SCALE`: **new**, `src/data/nudge-constants.ts`, start **3**, range 1–4. Multiplies
   the authored step-card cost inside `effectiveNudgeCost`, before the discount. **Meeting cards are exempt**:
   their prices are fixed by `meetingNudgeCostCap`, which the teaching encounter depends on. Mechanism:
   `effectiveNudgeCost` and `totalNudgeCost` take a `costScale` parameter, default 1. The encounter-step
   callers (`buildNudgePhaseModel`, the commit, the debug bridge) pass `NUDGE_ESSENCE_COST_SCALE`; the meeting
   path passes nothing. One unit test pins a meeting card as unscaled.
2. `BASE_MAX_ESSENCE` 50 → start **35**, range 35–50 (`influence-content.ts:44`). `INITIAL_ESSENCE_PER_SPHERE`
   (`influence.ts:31`) stays equal to it, as today. At 35 the meeting cap falls from about 8.3 to about 5.8.
   Bond-hand costs run 0–4 (`meeting-bond-test.ts:31`), so P4 holds; update that file's stale "~8" comment. Below 35 the per-thread +5 and the 25-essence divine casts
   crowd the cap.
3. `BASE_ESSENCE_PER_TICK` and `ESSENCE_PER_SEAT`, 1.0 each → start **0.5** each, range 0.3–1.0
   (`influence-content.ts:15,33`). This is the lever that binds. It also slows divine casts, offerings and
   thread climbing, which is the point of one purse (Law 30). P3 guards the floor.

**Expected landing (measured, not promised):** scale 3, cap 35, income 0.5 met P1 on seeds 42 and 99. P2 and
P3 were not yet instrumented in the experiment, and seed 99's 11% may break P2. If it does, step income up
toward 0.7 before cutting the scale.

**Resolution, PRNG, graph:** unchanged. No new node, edge, phase or random draw. Law 19 (price before the dice)
is unchanged: the commit still refuses a hand the pools cannot cover.

## Content pillar

Data only. `NUDGE_ESSENCE_COST_SCALE` scales authored costs, so no step card's `essenceCost` is re-authored.
Authored "free" cards (cost 0) stay free; the scale multiplies zero. No prose changes.

## UI pillar

Screenshot tool: Playwright (DOM, the encounter stage). UI Laws engaged: 13 (words, not numerals, beyond the price
the card already shows), 17 (the stakes before the spend), 21 (one place per fact), 33 and 37 per
the closeout floor. The rulebook's rule stays: an unaffordable card sits greyed with its price and never vanishes.
Card prices already read "N essence" on every price surface (`formatEssenceLabel`, THR-1894). This plan adds no
numeral; every new string is words.

**How the player learns a card is out of reach before committing (PC-1):** a greyed card names the pool that
is short and how fast it refills, in the essence bar's existing words (`ESSENCE_REFILL_WORDS`, Law 43: no new
vocabulary). The commit-refusal toast can then never be the first time the player hears it.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Greyed card reason (`NUDGE_BLOCKED_REASONS.essence_unavailable`, now a template) | "Not enough Mind — refills slowly" | PC-1 | Names the pool the card would draw on and reuses the refill words the essence bar already teaches ("Refills slowly", hover on the Mind row). |
| Greyed sphere-less card | "Not enough in your spheres — Mind refills steadily" | PC-1 | Names the god's primary sphere, which pays first. Unbought pools are never implied. |
| Card price hover, sphere-less card (new line under the price) | "Paid from your own spheres, Mind first." | PC-1 | Says where the price is drawn from, before the commit. |
| Card price hover, discounted card | "One less: Mind is yours." | PC-1 | Explains the cheaper price on home spheres (Law 37) in game words. |
| Commit-refusal toast (`GameView.tsx:2790`) | unchanged: "Not enough Mind essence — the moment passes untouched." | PC-2 | Only reachable if a pool drops between toggle and commit; the greyed reason already named it. |

Rendered sample: The First's Apotheosis step (`encounter.apotheosis.ascension`, step 0, in the seed-42 census
at t361), with the starting values, and Mind assumed down to 4 of 45 at that moment. *Count What It Costs* (Mind, authored 2, now
2 × 3 − 1 = 5) reads greyed **"5 essence"** with **"Not enough Mind — refills slowly"** beneath it.
*Steady Hands* (no sphere, authored 1, now 3) is lit, because Spirit can still pay, and its price hover
reads **"Paid from your own spheres, Mind first."** *Nothing Breaks Tonight* (Order, unbought, authored 3) shows
**"9 essence"**; today the stray discount shows it at 2.

### Playtest signal

A warm-round tester, asked "did you play every card you were offered?", answers no at least once, and names
the pool that stopped them.

### Debug inspection

`window.__DEBUG.getEncounterNudges()` already reports each card's cost and state. It gains `shortSphere` on a
dimmed card (the pool the reason names), so a browser assertion can check that the reason matches the pool.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: no new module, phase or GameState field.

| Module | Phase | UI component | GameState field | Trace | Debug |
|---|---|---|---|---|---|
| `effectiveNudgeCost` (scale + bought-sphere discount) | encounter step render + commit | encounter stage hand | `essencePool` (read) | — (pure) | `getEncounterNudges` |
| `spendNudgeEssence` (bought-sphere spill) | commit handler | `GameView` commit | `essencePool` (write, existing) | existing `nudge.commit` | `getEssenceMovement` |
| Income constants | `phaseEssence` | essence bar | `essencePool` | existing income traces | `getEssenceRefill` |
| Census | offline script | — | — | — | `npm run census:essence-scarcity` |

Interface map: no new cross-system read or write; the commit already writes `essencePool`. Rulebook §6
(the economy paragraph's income numbers) and §7 (the discount sentence, and a new sentence that a sphere-less card is paid from
your own spheres) change **in the same PR**.

## Constants table

| Constant | Today → start | Purpose |
|---|---|---|
| `NUDGE_ESSENCE_COST_SCALE` (new) | — → 3 | Multiplies authored step-card costs; meeting exempt |
| `BASE_MAX_ESSENCE` | 50 → 35 | Per-sphere pool cap before threads; bank size between steps |
| `INITIAL_ESSENCE_PER_SPHERE` | 50 → follows the cap | Starting pool |
| `BASE_ESSENCE_PER_TICK` | 1.0 → 0.5 | Base income, all spheres by points |
| `ESSENCE_PER_SEAT` | 1.0 → 0.5 | Seat income (about 43% of income on the census route) |
| `ESSENCE_SCARCITY_FULL_HAND_MAX_SHARE` (census) | 0.5 | P1 threshold |
| `ESSENCE_SCARCITY_ANY_CARD_MIN_SHARE` (census) | 0.9 | P2 threshold |
| `ESSENCE_SCARCITY_UPKEEP_PAID_MIN_SHARE` (census) | 0.95 | P3 threshold |

## Tracing

N/A — no new trace type; the existing `nudge.commit` and essence income traces cover the writes. The census prints per-step `{tick, pools, cap, hand:[{id, sphere, cost, state}], played}`
lines and a per-seed P1–P4 verdict block. That is the inspectability surface (NFP 2).

## Fail-soft table

| Failure | Fallback |
|---|---|
| Ascendant has no `spherePoints` (old save) | `getSpherePoints` already falls back to the alignment preset; the discount list follows it |
| Bought-sphere list empty | Sphere-less cards pay from the primary only; never throw |
| Scale constant non-finite | Treat as 1 (today's prices) |
| Census seed fails to build | Report that seed as "not measured"; the verdict needs all three |

## Three-pillar check

- [x] Engine: two rule fixes and three tuned constants
- [x] Content: one scale constant, no re-authoring
- [x] UI: greyed reason, price hovers, debug field
- [x] Wiring connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It restores `00-north-star.md`'s "small supply of
  divine essence" (Law 36).
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play. (It does: the discount covers only bought spheres, a
  sphere-less card pays from bought spheres only, and the income and cap numbers drop.)
- [x] `Docs/canon/rulebook.md` §6 and §7 are updated in the executor's PR for slice A.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Every lever is one named constant; predicate thresholds are constants too |
| 2. Inspectability | PASS | The census prints why each step was or was not affordable; debug gains `shortSphere` |
| 3. Determinism | PASS | No random draw added; census seeds fixed |
| 4. Fail-soft | PASS | See the table |
| 5. Narrative over mechanics | PASS with note | The greyed reason is game words; the scarcity serves the god's choice, not a number |
| 6. Additive | PASS with note | Two behaviour changes to existing functions (both bring code in line with the rulebook); one new constant |
| 7. Performance | PASS | Same per-render work; the bought-sphere list is computed once per render |

## Done when

- [ ] Rule fixes 1 and 2 shipped, with unit tests: an unbought sphere with essence gets no discount, and a
      sphere-less card never draws from an unbought pool.
- [ ] `scripts/essence-scarcity-census.ts` committed with `--no-play`, the P1–P4 verdict block and the npm script
      `census:essence-scarcity`. Its output for seeds 42, 99 and 7 is pasted in the PR with **PASS** on P1–P4,
      plus every constant setting tried on the way.
- [ ] Meeting tests (P4) green; `npm test`, `npm run check:typecheck`, `npx vite build` pass.
- [ ] Rulebook §6 and §7 updated in the same PR.
- [ ] The UI slice ([its ticket](#coordination-block)) ships the greyed reason and hovers, with one 1920×1080
      screenshot of a hand with a greyed card and its reason.

## Coordination block

Two slices. **Slice A** is THR-2201 itself: both rule fixes, the census and the tuning. **Slice B** is a new
ticket filed from this plan: the greyed reason, the price hovers and the debug field. It is blocked by A,
because its words name the pools that A's spill rule defines.

**Suggested model:** opus. Tuning against a measured predicate across three seeds is judgment work, not
mechanical.

**Parallel-safe with:** [the thread-row wrap](https://linear.app/threadbare/issue/THR-2193). It touches only
`ThreadsPanel.tsx`.

**Mutex with:** any ticket editing `src/data/influence-content.ts`, `src/engine/encounters/nudges.ts`,
`buildNudgePhaseModel.ts` or `nudgeCommit.ts`, and [give both clocks a verb](https://linear.app/threadbare/issue/THR-2202)
once it prices its answers (it should price after A lands).

**Files to touch:** (A) edit `src/engine/encounters/nudges.ts`, `src/engine/views/stage/buildNudgePhaseModel.ts`,
`src/components/Game/encounter-stage/nudgeCommit.ts`, `src/data/nudge-constants.ts`, `src/data/influence-content.ts`,
`src/engine/influence.ts`, `src/debug-bridge.ts` (+ `.d.ts`), `src/data/meeting-bond-test.ts` (comment),
`Docs/canon/rulebook.md`, `package.json`; create `scripts/essence-scarcity-census.ts` and tests.
**(B):** `src/data/nudge-stage-content.ts`, `buildNudgePhaseModel.ts` (reason + hover fields), the card component,
`src/debug-bridge.ts` and `.d.ts`.

## Notes for the executor

- Decided under delegation by the design lane on 2026-11-13 (process.md rule 4), veto open 12 hours: the two
  rule fixes, the tuning order and the predicate. Christian's ticket fixed the target shape and the levers.
- Do not reprice divine casts or offerings here. They slow through income, and pricing the new between-chapter
  spends belongs to [give both clocks a verb](https://linear.app/threadbare/issue/THR-2202).
- The census bundles with esbuild (`npx esbuild … --bundle --platform=node`); the plain strip-types path fails on
  extensionless imports.
- Rejected: prices alone (measured, never binds); a hard per-step essence budget (a new concept, Law 43);
  dropping the cap below 35 (crowds out 25-essence casts).
</content>
</invoke>

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-11-13. Gates run by the design lane; verdicts condensed, every note addressed inline.*

**Intent judge: Allow.** Dimensions 1–2 and 5–12 PASS; it verified every substrate line cited against the code. Two GAPs, both folded in before the PR: (3) the debug bridge prices hands with its own copy of the rules, now named and moved onto one shared helper; (4) the meeting exemption had no mechanism, now a `costScale` parameter with a test. Its note on the meeting cap at 35 (about 5.8 against bond costs 0–4) is now stated in the plan.

### NFP audit

PASS-with-notes. 1, 3, 4 and 7 PASS. 2: no new trace; the census and `shortSphere` are the inspectability surface. 5: the expected landing was measured on P1 only, and P2/P3 are instrumented by the executor (stated). 6: two behaviour changes to existing functions, justified by measurement; the meeting is exempt.

### Three-pillar audit

PASS-with-notes. Engine and UI present and substantive; Content data-only with rationale. Engine subsections are folded into prose rather than template headings. Slice B's component wiring is itemised by file, not line. Spheres & Quintessence is read (`spherePoints`) only.

### Vision audit

PASS-with-notes. No contradiction. It restores the north star's small supply of essence and "hesitate, then play". Soft edge: numerals on prices. Answered inline: prices already read "N essence" (THR-1894), and this plan adds only words.
