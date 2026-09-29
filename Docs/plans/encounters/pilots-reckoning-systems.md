# Encounter Pipeline: The Run the Pilot Refused
> Scale: short | Slug: pilots-reckoning | Pass: systems
> Date: 2026-09-29 | Pipeline version: 2.0

## Verdict: READY FOR IMPLEMENTATION (after one fix, applied)

## 1. Support Bundle Honesty
- `factor` (reuse merchant/trader, spawn merchant "Idris Vell", must-persist) and `pilot` (reuse lookout/trader, spawn trader "Maren Holt") are both lazy-materialize and realistic in `urban` settlements. `lookout`, `merchant` and `trader` are live roles (see `default-support-bundles.ts` and `civic-guard-encounter-content.ts`).

## 2. Missing Primitives
None. The encounter uses `ActionStepBranch.decidedBy` (`courage_prudence`), `BranchAwareAftermathConfig`, `intelligence`, `encounter_seed` and `bond_change`, all of which are live.

## 3. Runtime Feasibility
- The encounter has two beats, and the agent decides the fork on step 0. It is `intrinsicTier: 'background'` with step difficulties 0.40, 0.45 and 0.20. That keeps every step within `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45).
- **The fork carries a pole lean without taking the choice.** The two step-0 specials only add `poleLean`, and the mortal's axis decides. The decline arm is a real, cheap exit: difficulty 0.20 and `fail_action`, with a regard loss only.
- **Known measurement note (unchanged, not a defect).** The branch step has no top-level `difficulty`, so `measure:roll-spread` reads the mean as 0.40. That gives a window fit of 0.54, which is still inside the journeyman band. The brief's 0.425 counts the lead arm.

## 4. Aftermath Supportability / later-tense promises (rule 34)

**Finding, fixed.** The draft seeded by query `#consortium_errand`. All five bearers (`mct.quest.*`) are Merchant Consortium faction errands, and they are rank-gated in `FACTION_ENCOUNTER_META` at `minRank: 'apprentice'`. Their base prose asserts membership, for example "{name} is sent to read the market", "in the order the consortium taught" and "under consortium seal". A seeded sequel lands them on a mortal with no consortium membership, and that is a **rule-31 breach carried into the sequel**. The seedLabel "A merchant house wants its next run read by the same hand" was also untrue: no consortium errand is this house coming back.

**Fix:** a literal seed, `templateId: 'encounter.caravan_deal'`. This is The Caravan Deal: gold/star, ungated, `background`, everyday trade, and a star step about reading a route for a caravan master. A literal seed skips the eligibility filter, so it always lands, and the checker's liveness arm confirms the id resolves (a probe with a bogus id failed by name). The seedLabel now reads "Word of the run reaches a caravan master who needs a route read." That is true: a new party finds the mortal, and no place is promised. The chip "Merchant work will come looking for {actor} again." is backed by that seed. The systems quota drops from five to four (cast, rewards, seeds, reputation), still at least 3.

I considered the alternative query `#trade` (+`#gold`). It was rejected because it draws a grab-bag that includes Dead Drop, Smuggler Pact and Take Stock of Freeholds (which asserts holdings), and Exchange Guild Intelligence (guild-gated) under bare `#trade`.

Other promises check out:
- The crit-success line "told every house in {location}" is a past fact. It promises nothing.
- There are no appointments or placed promises.
- Every chip is backed on its band. On the lead path, successMetadata carries intelligence, the seed and a +bond; failureMetadata carries a −bond. On the decline path, success carries −0.05 and failure −0.12.

## 5. Chip referents
- `$cast:factor` is `reputation_with` and anchored.
- The knowledge chip is an intelligence record on `$actor`, which surfaces in `AgentIntelligencePanel`. The precedent is `the-drowned-archive`.
- The seed chip anchors through its carrier, `{actor}`.

## 6. New Hooks Needed
None.

## 7. Implementation File Map
Compiled set only (`npm run compile:encounter`). No extra files.

## 8. Primitive Disposition
No missing primitives identified.

Scratch `check:encounter`: clean, 0 warnings. Compile `--dry-run`: clean.
