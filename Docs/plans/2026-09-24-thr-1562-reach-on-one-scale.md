> **title:** Reach on one scale — every capability check reads the same number, so ambitions, spells and guild joins gate as written — THR-1562
> **linear_issue:** THR-1562
> **author:** Claude Code
> **created:** 2026-09-24
> **three_pillars:** Engine `done` · Content `done — 25 milestone thresholds raised by a quarter; five guild join requirements rewritten on the shared scale` · UI `N/A — no component change; the character sheet's saturation is a dice-curve question, filed separately`

# Reach on one scale — THR-1562

*Every check of "is this mortal good enough at X" reads a different number today, and most of them always pass or never pass. After this, they all read one number, on the scale the content was written in.*

## Why this is load-bearing

Content authors wrote every capability threshold as a share of a 0–1 scale: ambition floors 0.1–0.4, milestones 0.3–0.8, spell requirements 0.15–0.4. The engine reads them against four different numbers (the design research, 2026-09-24, verified on main):

| Check | What it reads | Result today |
|---|---|---|
| Ambition floors (`passesEligibility`, `ambitionSelection.ts:66-87`) | the **raw** base, about 10–86 for protagonists | every mortal passes every floor |
| Ambition milestones and abandonment (`graphConditions.ts:182-198`) | the raw base | milestones pass on first check; abandonment never fires. 26 `forge_legend` holders completed milestone 3 by tick 150 on seed 42 |
| Ambition choice (`scoreDesirability`, `ambitionSelection.ts:119-127`) | raw × weight | the reach term is 99.7% of the winning score, drowning the pole, sphere and trait terms |
| Spell requirements (`minReach`, `spellActivation.ts:105`), the `reach_drain` check (`:172`), the `reach_above:` item predicate (`effectPredicates.ts:277-285`) | `domainCapability` (singular), **which nothing writes** | no shipped spell can pass its requirements; the one item effect never pays |
| Guild joins (`encounterFilterPipeline.ts:381-392`) | the dice curve (0–1) against thresholds **authored raw** (15–25) | every guild join with requirements is never offered |
| Strategic-pack floors (`checkReachFloors`, `strategicActionCandidates.ts:824-835`) | the raw base | always pass (dormant while `UNDERTAKING_MODEL = 'cells'`) |
| Divine premonition's reach bias (`phaseDivinePremonition.ts:206-208`) | the raw base against a 0.1–0.8 window | the window is never entered |

**Why the dice curve is not the answer.** The dice read `computeCapability`, a sigmoid with midpoint 10 (`domainCapability.ts:15-23`). A protagonist's raw score starts at 10, so the curve is already at 0.5 there and above 0.97 by 20. Measured: normalizing every check to the dice curve leaves every protagonist passing every floor, while ordinary mortals fail nearly all of them. The curve resolves raw 0–20; protagonists live at 10–86. How the dice themselves should read that range is a separate balance question, filed separately (§ Filed separately).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Domain capability (`domainCapability.ts`): `computeRawScore` (effective: base + traits + conditions + items + companions + controlled resources), `computeCapability` (the dice's sigmoid) | 🟢 ACTIVE | **extends:** one new function, `computeReachShare`, beside them |
| Ambitions (`ambitionSelection.ts`, `ambitionTick.ts` snapshot `:144-186`, `ambitionLifecycle.ts`, `graphConditions.ts`) | 🟢 ACTIVE | **extends:** the snapshot and the two conditions read the share |
| Spells (`spellActivation.ts`) and effect predicates (`effects/effectPredicates.ts`) | 🟢 ACTIVE (spells dormant in play) | **extends:** the three reads move to the share |
| Faction joins (`encounterFilterPipeline.ts:381-392`, `joinPrerequisites` in five faction definitions) | 🟢 ACTIVE | **extends:** read the share; the five requirements are rewritten on it |
| Strategic packs, divine premonition | 🟢 ACTIVE / dormant | **extends:** their reads move to the share |
| Fights (`fights/opponentCard.ts:159`, `FIGHT_DERIVED_MIGHT_BANDS`) | 🟢 ACTIVE | **unchanged.** They read the raw score on purpose, with thresholds authored raw |
| The dice (`computeCapability`, every resolver and forecast) | 🟢 ACTIVE | **unchanged.** Recalibrating the dice is a separate decision |

## Engine pillar

### Systems design

**1. The reach share.** `computeReachShare(graph, nodeId, reach): number` in `domainCapability.ts`:
- **Formula:** `min(1, computeRawScore(graph, nodeId, reach) / REACH_SHARE_FULL_RAW)`.
- **The full point is `REACH_SHARE_FULL_RAW` = 40**: the top of an unboosted protagonist's worldgen roll (`10 + rand(31)`, `worldSeed.ts:500-512`). So 1.0 means "as good as the best ordinary protagonist starts".
- **It reads the effective score, not the base.** Items, traits and conditions count, as they do at the dice.
- **It is linear**, so it resolves the whole population: ordinary mortals (raw 1–15) and protagonists (10–86) read differently.
- **Game word, code word.** Nothing player-facing shows it. It is the scale every authored threshold is written on.

**2. Every threshold check reads it.** One scale, no exceptions outside fights and the dice:

| Site | Change |
|---|---|
| `buildAmbitionAgentSnapshot` (`ambitionTick.ts:144-186`) | the snapshot's per-reach values become shares, so `passesEligibility` and `scoreDesirability` read shares with no edit of their own |
| `agent_reach_above` / `agent_reach_below` (`graphConditions.ts:182-198`) | compare the share. `evaluateGraphCondition` takes the structural `ConditionGraph` (`:25-37`), so it gains an optional reach-share reader (production passes `computeReachShare`); test mocks supply their own |
| `minReach` and the `reach_drain` check (`spellActivation.ts:105-113`, `:172-179`) | read the share instead of the dead singular property |
| `reach_above:` (`effectPredicates.ts:277-285`) | the predicate context carries shares |
| guild joins (`encounterFilterPipeline.ts:381-392`) | compare the share against rewritten requirements (§ Content) |
| `checkReachFloors` (`strategicActionCandidates.ts:824-835`) | read the share (dormant; kept consistent) |
| the premonition reach bias (`phaseDivinePremonition.ts:176`, `:206-208`) | read the share, so its 0.1–0.8 window can be entered |

**3. What this deliberately leaves on the raw scale.**
- **Fights**, which chose raw because the dice curve saturates (`fight-constants.ts:52-59`).
- **Sieges and journeys**, whose thresholds are authored raw and read raw (`SIEGE_REGIONAL_CAPABILITY_MIN = 40`, `types/battle.ts:135`; `journey-content.ts:19`, `:24`).
- **Army spawning**, which reads the dice curve's tier (`armySpawning.ts:73-75`, `:108-110`, against `ARMY_SPAWN_GOLD_TIER_MIN` 3 and `IRON` 4). It moves with the dice, if at all, under THR-1575.
- **Two formula sites** that multiply raw by a weight (`computeRoleFit`, `strategicActionCandidates.ts:809-822`, dormant; colocation chance, `phaseColocationDetection.ts:90-97`) are *formulas*, not thresholds. Moving them needs their weights re-tuned, and they are filed as THR-1576.

**4. The `reach_drain` payment is not this plan.** It writes the dead singular property (`spellActivation.ts:237-244`). What a spell's price should *do* is the power runtime's design (THR-1571, whose preconditions already list the capability reads). After this plan, `reach_drain` spells pass their affordability check and pay nothing real, on a cast path that also drops spell effects today. So the gap is invisible until THR-1571 designs both halves.

### Graph nodes / edges

None.

### Tick phases

None added. The share is computed where each check already runs.

### Resolution logic

Unchanged. The dice keep `computeCapability`.

### PRNG callouts

None.

## Content pillar

### Data tables

Two authored changes, both mechanical and pinned by tests:
- **Milestones raised by a quarter.** The 25 `agent_reach_above` thresholds in `ambition-templates.ts` are multiplied by 1.25 and capped at 1.0 (0.3 → 0.375, 0.6 → 0.75, 0.8 → 1.0).
  - **Measured at share scale 40:** 66% of protagonist milestones would already be met on first check. At 1.25× that drops to about half, so the rest are paced by the capability growth that completing work brings (`growCapabilityOnCompletion`).
  - **Floors and abandonment triggers keep their values.** The authoring idiom "a trigger sits below its floor" (`ambition-templates.ts:48-56`) still guarantees no immediate abandonment. Measured: 0 immediate fires at every scale tried.
- **Guild join requirements rewritten on the share.** `joinPrerequisites` in the five faction definitions (`arcane-circle-definition.ts:116`, `holy-order-dawn-definition.ts:127`, `temple-of-spheres-definition.ts:126`, `thieves-guild-definition.ts:116`, `underking-court-definition.ts:128`) are divided by 40: 25 → 0.625, 20 → 0.5, 15 → 0.375. At scale 40 this is exactly "the effective raw score reaches the old number", so the authored intent is kept and becomes reachable. Measured at the share scale of 40: 47–100% of protagonists qualify on seed 42 and 36–91% on seed 99, where today none do.

### Encounter templates, prose tables, attachment content

N/A. No templates or prose change. Spell and item thresholds keep their values; only the scale they are read on changes.

## UI pillar

UI: N/A. No component changes.
- **Player-visible effects** are in the world, not on a panel: who takes up which ambition, milestones that take time, guilds that can now be joined, spells whose requirements can be met.
- **The character sheet** shows the top skill word in every reach for every protagonist. It reads the raw base through a 0–10 tier function (`agentDetail.ts:693`, `domain-words.ts:58-61`). That is a real defect, but the honest fix is to show the dice's number, which is itself saturated for protagonists. So it belongs with the dice calibration, filed separately.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `computeReachShare` (`domainCapability.ts`) | wherever a check runs: `ambition_progress`, encounter filtering, spell activation, premonition | — (no surface) | reads node properties and edges | none new; the existing ambition-selection and eligibility traces carry the values they compare | `getReachShares(agentId)` on the debug bridge; CLI `agent <name>` prints shares beside raw scores |
| the seven read sites (§ 2) | their existing phases | — | — | — | — |

**Player controls:** none.
**Prose:** none.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `REACH_SHARE_FULL_RAW` | `40` | The effective raw score that reads as a full share (1.0): the top of an unboosted protagonist's roll |
| `AMBITION_MILESTONE_RESCALE` | `1.25` | Documented multiplier applied once to the authored milestone thresholds (a content change, recorded so the reason survives) |

## Tracing

N/A — no new trace type. The ambition selection and eligibility paths already trace the scores they compare, and after this they carry shares. The debug accessor `getReachShares` gives the per-reach share and raw score side by side, so a surprising gate can be read directly.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| A node has no `domainCapabilities` (most ambient mortals) | Raw score 0, share 0: fails every floor, as today, and as intended. Minted and grievance ambitions still reach them (below) |
| `computeRawScore` throws on a malformed edge | The share reads 0 for that reach; the check fails closed |
| A test mock `ConditionGraph` without the reader | `agent_reach_*` computes a base-only share from the mock's own node: `min(1, (domainCapabilities[reach] ?? 0) / REACH_SHARE_FULL_RAW)`, with no edge walk. An un-updated mock fails **closed** on the same scale, so a migrated fixture cannot pass by accident |

## Interface impact

| Contract | Change |
|---|---|
| **add** `capability-thresholds-read-the-reach-share` | Writer: `computeReachShare`. Readers: the seven sites in § 2. Asserting tests: the corpus test below (every authored threshold kind is read on the share) |
| `undertaking-completion-grows-capability` (the "one writer" of the raw base, `scripts/interface-contracts.ts:2839`) | **preserve:** nothing here writes the base |

## Blast Radius

N/A — no file with 100 or more importers changes. `domainCapability.ts` has 47 importers, `ambitionSelection.ts` 9, `graphConditions.ts` 6; all changes are additive or local.

## Three-pillar check

- [x] Engine: one function, seven read sites, the drain payment deferred to its owner.
- [x] Content: 25 milestones rescaled, five guild requirements rewritten.
- [x] UI: N/A with rationale (the sheet belongs with the dice calibration).
- [x] Wiring connects them.

## Vision audit

- [x] **No Vision premise is contradicted.**
  - `00-north-star.md:15`, *"a handful of mortals they know by name"*: builders' ambitions now go to the mortals capable of building, as the ticket's own premise asks (*"an ambition's reach is meant to decide who can take it up"*), and those are the mortals the spotlight pull then brings into view.
  - `02-non-negotiables.md:23`, narrative over mechanical perfection: a milestone met on the day it was set tells no story; one earned over weeks does.
- [x] **Design tension** `03-design-tensions.md:23` (systemic vs authored): the authored thresholds finally mean what their authors wrote.

## Rulebook impact

- [x] **A rule is clarified where the requirements live.** The sentence goes in the rulebook's ambitions paragraph and beside the guild-joining and spell rules it describes, not on `:113`: that bullet is the player's action-targeting cascade, which has no live tier gate. The sentence: *"Requirements measure a mortal's full standing in a Reach (training, traits, items and company) against the best an ordinary protagonist starts with."*
- [x] **The ambitions paragraph** gains: *"An ambition asks for some skill before it can be taken up, and its milestones ask for more; the capable take up great works, and everyone else wants what their own life offers."*
- [x] **UL Domain Capability and Prerequisite** (`Docs/ubiquitous-language/Cosmology.md:65-71`, `:98-103`) state the two scales: the dice read the curve; every requirement reads the share. This is a delegated seating (`process.md` § UL-proposal flow), and the design session records it on THR-1562 at handoff.

> Brainstorm companion: `Docs/plans/2026-09-24-thr-1562-reach-on-one-scale-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | One scale constant, one documented content multiplier |
| 2. Inspectability | PASS | `getReachShares` and the CLI show share beside raw; existing selection traces carry the compared values |
| 3. Determinism | PASS | Pure arithmetic over graph state |
| 4. Fail-soft | PASS | Missing data reads 0 and fails closed; old test mocks fall back to today's read |
| 5. Narrative over mechanical perfection | PASS | Milestones take time; guilds become joinable; spells become castable |
| 6. Additive over destructive | PASS | New function; read sites switch; authored values rescaled once with the reason recorded |
| 7. Performance budget | PASS-with-note | `computeRawScore` walks a node's edges. The ambition snapshot computes eight shares per candidate once per evaluation, not per template; measured as a Done-when |

## Kill criteria

- **Ordinary mortals starve.** Measured today: with minted and grievance ambitions counted, 97–100% of mortals with capabilities keep at least one eligible ambition (seed 42's ambient tier sits at 97%, a two-point margin). This measures *eligibility if offered*: minted and grievance wants still need their event to happen. If eligibility falls below 95% on seed 42 or 99 at tick 150, lower `REACH_SHARE_FULL_RAW` toward 30 and re-measure.
- **The spotlight re-baseline is expected, not a regression.** Newborns will now mostly fail every standard floor, so fewer draw a strategic want, and THR-1523's pull population shrinks. Re-measure its census after this lands. Only its own kill criteria decide whether that is a problem.
- **Undertakings stall.** If `census:undertakings` fails on starts per mortal or variety, turn back to the ticket with the numbers. Do not re-author individual floors.
- **Milestones still instant.** If more than 60% of protagonist milestones are met on first check at tick 0, revisit the multiplier, not individual values.
- **Tick cost.** If it rises more than 3% at medium, cache the shares per ambition evaluation.

## Done when

- [ ] **Tests:**
  - **`computeReachShare`:** base only; with a trait and an item contribution; capped at 1; 0 for a node with no capabilities.
  - **Each site reads the share:**
    - floors (eligible above, ineligible below);
    - milestones and abandonment;
    - `minReach` and the `reach_drain` check (a shipped spell passes for a capable caster);
    - `reach_above:` (the shipped trickle pays for a capable bearer);
    - a guild join is offered to a qualifying mortal;
    - the premonition window can be entered.
  - **A corpus test:** every authored threshold kind (`reachFloors`, `agent_reach_above/below`, `minReach`, `reach_above:`, `joinPrerequisites`, strategic `reachFloor`) is 0 < t ≤ 1, so a raw-scale number cannot be authored again.
  - **The abandonment idiom:** every `agent_reach_below` trigger sits below its template's floor for that reach.
  - **Fixtures:**
    - Only the fixtures feeding the seven sites this plan moves are converted to raw values (× 40), for example `ambitionLifecycle.test.ts`, `graphConditions.test.ts`, `grievanceClosure.test.ts` and `grantedTraitConsumers.test.ts`.
    - **Left for THR-1576:** `phaseColocationDetection.test.ts` and the `computeRoleFit` cases in `strategicActionCandidates.test.ts`. Their sites do not move here.
    - The tests that set the singular property (`phaseAgentDecision-forced-travel.test.ts:296`, `eligibilityFunnel.test.ts:44`, `fightHarm.test.ts:456`) drop it.
  - **A failing case with the reader supplied:** at least one `agent_reach_above` test asserts a **fail** for a share below its threshold, so the migration cannot pass vacuously.
- [ ] **Measurement** (a new `scripts/reach-gate-census.ts`; the research scripts are kept in the vault at `Brainstorms/2026-09-24-reach-scale-research/`): seeds 42 and 99, medium, ticks 0 and 150, before and after. Report:
  - floor pass rates by population;
  - mortals with at least one eligible ambition;
  - milestones met on first check;
  - the spread of top ambition picks;
  - guild join and spell requirement pass rates.

  Read them against § Kill criteria.
- [ ] `npm run census:undertakings` passes on 42 and 99. `census:reachability -- --seeds 42,99,7` keeps merchant-expansion reachable on at least 2 of 3. The spotlight numbers are re-baselined against THR-1523, now merged.
- [ ] **Docs:**
  - the rulebook: the requirement sentence sits beside §2 `:60` (mortals pursuing their own goals), §10.6 `:479` (faction rank) and §7 `:427` (casting costs). There is no ambitions or guild-joining paragraph to amend, so the sentence is added there;
  - UL *Domain Capability* and *Prerequisite*;
  - the interface-map row;
  - wiki pages the blocking gate owes: `agents-reference` (`ambitionSelection.ts`, `ambitionTick.ts`), `encounters-manual-reference` (`encounterFilterPipeline.ts`, `domainCapability.ts`), `factions-cultures-reference` (the five faction definitions) and `system-interface-map` (regenerated by `prebuild` and committed).
- [ ] **Every gate:** `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build`, a 30-tick CLI smoke, `npm run measure:tick-cost` at medium. `Browser-verify exempt: engine and content data only`.
- [ ] The close keyword for this issue, alone on its own line, in the closing commit body and the PR body.

## Filed separately

- **THR-1575, the dice curve saturates for every protagonist.** Christian's call: it changes the odds everywhere, like THR-1535. The sigmoid's midpoint (10) sits at the bottom of the protagonist range, so the dice read nearly every protagonist as a master in every reach, and the sheet and the encounter skill line show the top word.
- **THR-1576** (Deferral, blocked by this issue): the raw-times-weight formula sites (colocation chance pinned at its bounds; `computeRoleFit`, dormant).
- **THR-1571** (power runtime) owns the `reach_drain` payment; its description says so.

## Coordination block

**Suggested model:** opus. Seven read sites, a structural interface change in `graphConditions`, 21 fixture files, and a measurement the kill criteria read.

**Parallel-safe with:**
- THR-1526, THR-1528, THR-1564, THR-1568 and THR-1569: no shared logic.
- The append-only files they share with this issue (`scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`, `Docs/canon/rulebook.md`) resolve by keeping both sides.

**Mutex with:**
- **THR-1523** (unwatched builders, merged as a plan; its executor edits `ambitionTick.ts` and the spotlight census): both change who holds strategic wants. Run in sequence, and re-baseline whichever census runs second.
- Any slice editing `src/engine/ambitionTick.ts`, `ambitionSelection.ts`, `graphConditions.ts`, `domainCapability.ts` or `encounterFilterPipeline.ts`.

**Files to touch:**
- Edit:
  - `src/engine/domainCapability.ts` (`computeReachShare`)
  - `src/engine/ambitionTick.ts` (the snapshot)
  - `src/engine/graphConditions.ts` (the reader)
  - `src/engine/ambitionLifecycle.ts` (pass the reader)
  - `src/engine/spellActivation.ts`
  - `src/engine/effects/effectPredicates.ts`
  - `src/engine/encounterFilterPipeline.ts`
  - `src/engine/strategicActionCandidates.ts`
  - `src/engine/phaseDivinePremonition.ts`
  - `src/data/ambition-templates.ts` (milestones)
  - the five faction definitions (`src/data/*-definition.ts`)
  - `src/data/ambition-selection-constants.ts` or a new constants home for `REACH_SHARE_FULL_RAW`
  - `src/debug-bridge.ts`/`.d.ts`, `scripts/cli.ts`
  - new `scripts/reach-gate-census.ts` (+ `package.json` script)
- Tests: the fixture files above, plus new share and corpus tests.
- Docs:
  - `Docs/canon/rulebook.md`
  - `Docs/ubiquitous-language/Cosmology.md`
  - `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts`

## Notes for the executor

- **Normalize in the snapshot, not in `passesEligibility`.** `ambitionSelection.test.ts` builds snapshots directly with raw integers and survives as long as the conversion lives in `buildAmbitionAgentSnapshot`.
- **Fixtures that stored 0.5 as "comfortably above every floor"** now mean raw 0.5, share 0.0125. Convert them to raw (× 40), don't loosen the assertions.
- **Don't touch the dice.** `computeCapability` and every resolver stay as they are; the calibration is its own ticket.
- **The ascendant's `domainAffinities` stay outside the share.** They are deliberately kept out of `computeRawScore` by the THR-728 contract (`scripts/interface-contracts.ts:1599`), so a god's share reads practice and items only. Don't "fix" that here.
- **Tune `REACH_SHARE_FULL_RAW` first, never individual thresholds.** If a kill criterion fires, the scale moves, not the content.

## Intent-judge verdict

*Two passes, 2026-09-24.*

1. **Revise.** Three GAPs, all applied:
   - the test-mock fallback failed open; it now computes a base-only share and fails closed;
   - the fixture migration reached into formula sites left for THR-1576;
   - the UL amendment had no seating record, and the rulebook sentence sat on the action-targeting bullet (`:113`).

   Also applied: army spawning is excluded for the right reason (it reads the dice curve), the consequence is grounded in the ticket's own premise, the THR-1523 re-baseline is named, and the ascendant affinities are noted.
2. **Allow.** Impact class Reversible, zero GAPs. Two advisories were applied before commit: the rulebook host paragraphs, and the guild-join range across both seeds.

   **Carried to the executor:** the reach term still dominates ambition choice after the change (about 77%, from 99.7%). The before-and-after report prints the number; desirability weighting is out of scope.

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-09-24.*

### NFP audit

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | `REACH_SHARE_FULL_RAW`=40 and `AMBITION_MILESTONE_RESCALE`=1.25 are named constants; no magic numbers inlined at the seven read sites. |
| 2. Inspectability | PASS | `getReachShares(agentId)` debug-bridge accessor + CLI `agent <name>` print share beside raw; existing ambition-selection/eligibility traces already carry the compared values — no new trace type needed, and the doc states why. |
| 3. Determinism | PASS | "Pure arithmetic over graph state"; no PRNG; `computeReachShare` is a deterministic function of existing node/edge data. |
| 4. Fail-soft | PASS | Missing `domainCapabilities` → share 0 (fails closed); malformed edge → share 0; un-migrated test mock → closed-scale fallback that cannot pass vacuously. |
| 5. Narrative over mechanical perfection | PASS | Milestones now take real time instead of firing on first check (~66%→~50% instant-pass at 1.25×); guild joins and spell requirements become reachable. |
| 6. Additive over destructive | PASS-with-note | `computeReachShare` is additive, but seven existing read sites are rewired in place and 25 milestone + 5 guild thresholds are rescaled. Justified: the old reads were dead/always-pass-or-fail, so this restores intended behavior — but it is a genuine modification footprint, not pure addition. |
| 7. Performance budget | PASS-with-note | Snapshot computes 8 shares once per candidate evaluation (not per template); tick-cost delta is a Done-when measurement with a kill criterion (>3% at medium → cache shares). |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | `computeReachShare` fully specified with formula/constant; all 7 read sites named with exact file:line, current vs. new behavior; explicit scope boundary (fights/sieges/armies stay out) with rationale. |
| Content | present-and-substantive | 25 milestone thresholds and 5 guild `joinPrerequisites` rewritten with concrete before/after numbers and measured pass-rate deltas; N/A subsections with reason. |
| UI | N/A-with-rationale | No component change; names the one real display defect (the character sheet's tier function) and why it is deferred to the dice-calibration ticket. |

No missing required sections.

Wiring: the table names orchestrator phases, graph reads and debug visibility (`getReachShares`, CLI `agent <name>`); UI component and trace columns are em-dash for every row, consistent with the UI-N/A and no-new-trace claims — honestly represented, though thin on the trace column.

Substrate-existence check (THR-658): `## Substrate inventory` present, extend-only; Ambitions & Undertakings, Strategic Projects & Control, Effects & Conditions (spell) and Divine Premonition (`2a.9`) all exist as ACTIVE — no green-field duplication.

PILLAR AUDIT: PASS

### Vision audit

1. **Vision premises touched:**
   - `00-north-star.md` → "a handful of mortals they know by name" — confirmed.
   - `02-non-negotiables.md` → item 2, narrative over mechanical perfection — confirmed.
   - `03-design-tensions.md` → tension 2, systemic vs authored — confirmed.
   - `taste-profile.md` → Numbers in UI — silent but compliant (the share is debug-only).
   - `01-core-loop.md`, non-negotiable 1 — not referenced.
   - `Docs/design-brief.md` — no inline Vision summary. `[design-brief-stale]`
2. **Vision contradictions:** No contradictions found.
3. **Five qualitative checks:** north star consistent; core loop unaffected; non-negotiables untouched; design tensions land on tension 2 in the authored-intent direction; taste profile compliant.

**VISION AUDIT: PASS**

**Author's response to the notes:**
- **NFP #6:** the rewiring is the fix. The old reads were dead or trivially passing, so there was no working behaviour to preserve.
- **NFP #7:** the cost is measured as a Done-when, with a caching fallback named.
