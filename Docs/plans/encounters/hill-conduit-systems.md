# Encounter Pipeline: The Hill Conduit
> Scale: medium | Slug: hill-conduit | Pass: systems (cold critic, THR-1757 master batch 2, slot 7)
> Date: 2026-10-14 | Pipeline version: 2.0
> Audited: `hill-conduit.package.json` (what ships).

## Verdict: **READY FOR IMPLEMENTATION** (after fixes S1–S2, applied)

## 1. Support Bundle Honesty

| Object | Delivery / persistence | Resolves | |
|---|---|---|---|
| `reeve` (Edith Marlow) | lazy-materialize-on-trigger, must-persist; reuse `elder` / `clerk`, spawn `elder` | `src/types/npc.ts:54,70` (`clerk`, `elder`); `supportRole: 'reeve'` has precedent in `boundary-survey.ts:254` and `well-sinking.ts:317` | ✓ |
| `herdsman` (Hob Fenner) | lazy-materialize-on-trigger, must-persist; spawn `hunter` | `src/types/npc.ts:88` (`hunter`) | ✓ |

Both are prepared at encounter start (`prepareEncounterSupportBundle`, called from `phaseAgentDecision.ts`), so `{cast:herdsman}` is bound on the long arm and on route A too. The cut-arm `critical_failure` reaction that names the herdsman resolves on every route.

## 2. Missing Primitives

None. The live primitives used are `ActionStepBranch.decidedBy` (axis `preservation_transformation`, Stone, `src/types/agent.ts:16,66`: Guardian +, Shaper −), `BranchAwareAftermathConfig` keyed on step 0, and step `carryoverFactorLines`. No `authoredChoices`.

## 3. Runtime Feasibility — the routes

`advanceStep` (`src/engine/unifiedActionLifecycle.ts:218`): a step `critical_failure` ends the action under any `failBehavior`. The fork pole is recorded before that. `computeFinalActionOutcome` (`:367`): a continued step-0 failure aggregates to `success_at_cost`.

| Route | Step 0 | Arm | Band | Writes |
|---|---|---|---|---|
| A | critical_failure | never runs | critical_failure (chosen arm's page) | step 0 failure |
| B | success-side | success-side | crit / success / sac | arm success |
| C | failure | success-side | success_at_cost | step 0 failure + arm success |
| D | any but cf | failure | failure | (step 0 failure) + arm failure |
| J | any but cf | critical_failure | critical_failure | (step 0 failure) + arm failure |

## 4. Aftermath Supportability — Law 56 per band

**S1 (BLOCKING, Law 56) — dead chips on route A.** Before the fix, step 0 wrote nothing, and both arms' `critical_failure` pages showed SCAR reputation, SCAR Plague Scare and SCAR compulsion. On route A none of the three had a write behind it. The author's note called this an inherited corpus gap. It is fixable in content, the way this batch's siblings fixed it (poisoned-feast, salt-monopoly, easter-reckoning: a small step-0 write, and `critical_failure` pages that chip only state written on both routes).

**Fix applied:**
- Step 0 `failureMetadata.effects`: `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.03 }`.
- Both arms' `critical_failure` pages keep **only** the Lost Trust chip (`reputation with {target}`, `$here`). Route A writes −0.03. Route J writes −0.05 / −0.08, plus −0.03 when step 0 also failed.
- Plague Scare and the compulsion still fire on route J from the arm's `failureMetadata`, unchipped there. That is a write with no chip, not a chip with no write. Same accepted pattern as `ducal-nativity.ts:74`.
- Fallback `critical_failure` gains the Lost Trust chip and *Cart The Water*. Backed on every fallback route: step 0 −0.03, or the fallback step's own −0.05.
- Knock-on, route C: step 0's −0.03 lands under a `success_at_cost` page that carries no reputation chip. That is an unchipped −0.03, offset when the player takes *Accept The Thanks* (+0.04). It is fiction-true: the town waited a week more on bad water. Accepted.

**S2 (BLOCKING, truth on a route).** The `critical_failure` overviews and the cut-arm *Blame The Herdsmen* reaction narrated arm events (the long conduit dug out; the bull; the lord's ban; the herdsmen breaking the work) that never happen on route A. Rewritten true on both routes (editorial E3, E4).

**Every chip, after the fixes:**

| Chip | Bands | Backed by | Every route? |
|---|---|---|---|
| BOON Inspired (`trait.condition.inspired`, `condition-trait-content.ts:289`) | crit / success / sac, both arms + fallback | `condition_attachment`, arm `successMetadata` | ✓ (B, C) |
| PATH ambition (`ambition_great_work` "Build a Great Work", `ambition-templates.ts:882`) | same | `assign_ambition`, arm `successMetadata` | ✓ |
| SCAR reputation with {target} (`$here`) | failure, crit fail, fallback crit fail | step 0 + arm `failureMetadata` | ✓ (A, D, J) |
| SCAR Plague Scare (`trait.condition.location.plague_scare`, `condition-trait-content.ts:471`) | failure only | arm `failureMetadata` `apply_condition $here` | ✓ (D) |
| SCAR compulsion (`plant_compulsion { build }`; `build` ∈ `EncounterType`, `encounter.ts:30`) | failure only | arm `failureMetadata` | ✓ (D) |

**Later-tense promises (rule 34 / 7b).** "Travellers now steer clear…" is backed by Plague Scare, 36 ticks. "For a while … drawn to building work" is backed by the compulsion, 72 ticks. "is pursuing Build a Great Work now" is backed by the ambition. *Teach The Upkeep* ("how to clear the conduit each spring") is the reeve's future, not a binding on the mortal. *Cart The Water* said "stays … until the sickness passes", which binds the mortal to a place and a time with no effect behind it. Rewritten as a present act (editorial E5). No seeds, so there are no placed promises.

## 5. Chip referents resolve

`$here` → location (linked). `trait.condition.inspired` and `trait.condition.location.plague_scare` → attachment, both exist. `ui.ambition`, `ui.compulsion`, `ui.reputation_with` → tooltips with corpus precedent (`comet-disputation.ts`, `bell-at-the-exchange.ts`, `assize-letter.ts`). `$actor` concepts → agent. No chip points at fiction.

Other ids: `trait.personality.stone.virtue` (Careful) via `personality-trait-content.ts:111`. Image tags `generic.focus/ward/energy/oath/warmth/matter` are all in `encounter-image-library.ts`. Deal tags `craft`/`wild`/`labor`/`peril` were accepted by the gate's deal check.

## 6. New Hooks Needed — none.

## 7. Implementation File Map — standard compiled set only (`compile:encounter`). No engine or type edits.

## 8. Verdict — **READY FOR IMPLEMENTATION**

## 9. Primitive Disposition — No missing primitives identified. The engine BACKLOG (pre-fork terminal selects a forked arm, `debt-arbitration-systems.md` § 9) stands. This encounter no longer depends on it.

## Gate

`node .cache/cc-hill-conduit.mjs --package Docs/plans/encounters/hill-conduit.package.json` → `checked 1 clean 1 failing 0 … warnings 0 · ✓ encounter.town.hill_conduit [systems: cast, rewards, conditions, reputation] · OK`.
