# Encounter Pipeline: The Vault Before the Rains
> Scale: medium | Slug: cathedral-vault | Pass: systems
> Date: 2026-10-05 | Pipeline version: 2.0 (Factory v3, batch master-everyday slot 7, THR-1688)

**Verdict: READY WITH CAVEATS.** Every id, field and sentinel the revised packet names
exists in `src/` and is wired the way the packet uses it, and the consequence hand
(relationship + place) lands through live writes on both arms. Two prose fixes are
forced by aggregation (both `success_at_cost` overviews claimed a step-1 crack / course
that the band also shows when step 1 was clean), and the aftermath fallback is
re-authored so it tells the step-0 critical-failure path truthfully once the corpus
engine fix lands. The one engine gap is the known, corpus-wide debt-arbitration caveat:
a step-0 `critical_failure` ends the action after the fork pole is recorded. BACKLOG,
not BLOCK.

## Id and field verification

| Id / field the packet uses | Verdict | Evidence |
|---|---|---|
| `bond_change { withAgentId, sentimentDelta, trustDelta?, reciprocal? }` | verified | `src/types/unifiedAction.ts:1359`–`:1373`; `$cast:<key>` resolved by `bindAftermathSceneTargets`; trust clamps [0,1], sentiment [-1,1]; `reciprocal` defaults true, which is what makes the chip "{cast:abbot} trusts {actor}" true (the abbot→actor edge moves too). Precedent: `bell-tower-sequels.ts:81`, `masons-commission.package.json:186` |
| `apply_condition { conditionTraitId, targetLocationId: '$here', intensity, durationTicks }` | verified | `src/types/unifiedAction.ts:631`–`:651` (`targetLocationId`, THR-1143); precedent shape identical in `bell-tower-sequels.ts:82`–`:88` and `masons-commission.package.json:191`–`:197` (0.5, 36 ticks) |
| `trait.condition.location.festival` ("Festival") | verified, live | `src/data/condition-trait-content.ts:454`–`:469` ("For three days…"); default duration row `:715`; movement reader `:779` (crowded) |
| `reputation_with { targetLocationId: '$here', delta }` | verified | `$here` walks `located_at` up to the settlement tier (`src/engine/sceneHere.ts`); cap ±0.15 (`reputation.ts`) — all deltas 0.03–0.08 fit |
| `isStepSuccess` includes `near_miss` | verified | `src/types/unifiedAction.ts:2996`–`:2998` |
| Aggregate band from step history | verified | `computeFinalActionOutcome` `src/engine/unifiedActionLifecycle.ts:344`–`:363`: any step-0 failure / at-cost / near-miss aggregates a winning step 1 to `success_at_cost`; a step-1 `near_miss` also aggregates to `success_at_cost` |
| Step-0 `critical_failure` terminates | **finding** (caveat 1) | `advanceStep` `unifiedActionLifecycle.ts:204`–`:216`; fork decided unconditionally before it, `unifiedActionResolution.ts:2411` (`applyAgentDecidedBranches`) — still unfixed on this branch |
| `ActionStepBranch.decidedBy { axis: 'courage_prudence' }`, `branchOnStep: 0`, `positive`/`negative`/`fallback` | verified | `src/engine/encounters/branchDecision.ts:363`–`:413` (pole mode); shipped precedent `debt-arbitration.package.json` |
| `StepNudge.poleLean` on both step-0 specials | verified | precedent `debt-arbitration.package.json:145`, `:164` |
| `carryoverFactorLines` keyed on step 0, `critical_failure` omitted | verified | rows ≤12 words (longest 9); the omission is correct (row unreachable) |
| Card-name verbs hasten / reveal / bind / steady / stretch / draw | verified | `IMPERATIVE_VERB_LEXICON` `src/data/content-eval/doctrineV2Checks.ts:94`–`:116`; all names ≤ `NUDGE_NAME_MAX_WORDS` 4 (`nudgeAuthoringConstants.ts:346`) |
| imageTags `generic.memory` / `.light` / `.matter` / `.oath` / `.strength` / `.warmth` | verified exist | `src/data/encounter-image-library.ts:629`–`:642`. **Finding (applied):** Stretch The Dry Spells is a Time card on `generic.warmth` (a Life plate, "hearth-warmth on flagstones"); `generic.time-slow` (`:635`, Time, "a water drop hanging") is the honest plate. Not a gate rule — a fit fix, no prose touched. `generic.memory` (Mind) on Hasten The Strike is kept: the card works in the mortal's thoughts |
| Deal tags `craft` / `insight` / `peril` / `labor` | verified | `DealContextTag` `src/types/unifiedAction.ts:1921`–`:1933` |
| Trait variant `trait.core.core_humility.virtue` (Humble) | verified | id format `src/data/core-trait-content.ts:70`–`:72`; Humble pole `src/types/coreRegistry.ts:18`; precedent `comet-disputation.ts:73` (vice pole) |
| NPC roles `monk` / `priest` / `mason` | verified | `src/types/npc.ts:40`, `:66`, `:87`. Reuse odds: town priest 0.7, mason 0.7; city/capital priest 1.0, no mason row; hamlet monk 0.3, no priest/mason; farmland/mining no rows (`settingClasses.ts:58`). So in rural settings and cities the foreman is nearly always a minted walk-on mason, and in rural settings the abbot usually is a minted monk. Class-honest: the abbey sent for the master and has its own works foreman |
| stateNoun `reputation with {target}` on `$cast:abbot` | verified | THR-1685 shipped (`Docs/status/2026-09-30-thr-1685.md`): a person anchor makes `{target}` read the person. Precedent pairing kind `reputation` / category `bond` on a `bond_change` write: `masons-commission.package.json:389`–`:403` |
| stateNoun `reputation with {target}` on `$here` | verified | `$here` keeps the scene reading (board draw targets the settlement); precedent `debt-arbitration.package.json:498`–`:503` |
| stateNoun `Festival` → `trait.condition.location.festival`, `visualKind: attachment` | verified | precedent `masons-commission.package.json:352`–`:356`; machine gate passed the anchor |
| `EncounterAftermathChange.title` required, `causeClause` optional | verified | `src/types/unifiedAction.ts:328`–`:387`. The revised packet authored no titles; supplied in the final (two to three words each) |

## 1. Support Bundle Honesty

| Object | Claim | Honest? |
|---|---|---|
| `abbot` | lazy-materialize, reuse `monk`/`priest`, spawn `monk` "Anselm Hale", must-persist | Yes. Reuse binds a standing priest in most towns and every city; otherwise a minted monk. "Abbot {cast:abbot}" reads correctly with either. |
| `foreman` | lazy-materialize, reuse `mason`, spawn `mason` "Wat Durran", must-persist | Yes. Reuse only in towns (0.7); elsewhere minted. Must-persist is required: the "Credit The Crew" reaction writes a bond to them. |
| Festival on `$here` | aftermath write, 36 ticks | Yes. Same effect, intensity and duration as two shipped stone encounters. |
| reputation with `$here` | aftermath write | Yes. Binds to the settlement even when the mortal stands at a Place. |

## 2. Missing Primitives

- **Pre-fork terminal routing (gap, BACKLOG — the debt-arbitration caveat, confirmed).**
  A step-0 `critical_failure` ends the action (`advanceStep`), but
  `applyAgentDecidedBranches` has already recorded the pole, so the aftermath layers the
  chosen arm's `critical_failure` band. On that path the Vanguard page says the vault
  fell and the Watcher page says half of it came down, and both show a SCAR (town) and a
  BOND (abbot's blame) whose writes live in step 1's `failureMetadata` and never ran.
  Law 56 hollow on that path. No content-only fix: a step-0 `failureMetadata` would also
  fire on plain step-0 failures that continue into step 1, and `AftermathOutcomeOverride`
  carries no effects. Rare: step 0 is 0.76 for a mortal in the master window, so a
  critical failure is a small tail. The final packet carries an aftermath `fallback`
  whose `critical_failure` band tells the step-0 path truthfully, so the page becomes
  correct the moment the engine fix lands.
- Everything else is live: `decidedBy`, `poleLean`, `carryoverFactorLines`,
  `bond_change`, `apply_condition` on a place, `reputation_with`,
  `BranchAwareAftermathConfig`. No `authoredChoices`. No `encounter_seed`, no
  appointment, no place-and-time promise.

## 3. Runtime Feasibility

- Two steps, one `decidedBy` fork on `courage_prudence` keyed on step 0: supported
  (`debt-arbitration`, `fair-bout`, `counting-house-dispute`).
- Step fallback = the Watcher arm verbatim (precedent shape). Required.
- All five aggregate bands authored on both arms.
- **Durations, purpose lines, `narrativeTemplates` and `description` were not in the
  revised packet** and are supplied in the final: step 0 `{1,2}`, Vanguard `{1,2}`,
  Watcher `{2,3}` (the long arm takes longer; the season is still compressed — caveat 3).
- Measurement: the fork carries no top-level difficulty, so `measure:roll-spread` reads
  step 0 only (stone 0.76, inside 0.72–0.85). The brief's mean 0.79 / fit 0.93 is the
  designed Vanguard path, not what the gauge will print.
- Forecast sums ≤ 1 (0.88 / 1.00 / 0.98) as the editorial fixed them.

## 4. Aftermath Supportability

**Success-side vs failure-side split — confirmed.** Step effects split only by
`isStepSuccess`: `critical_success`, `success`, `success_at_cost`, `near_miss` fire
`successMetadata`; `failure`, `critical_failure` fire `failureMetadata`. Every
success-side band therefore shares the bond-gain + Festival writes, and every
failure-side band shares the town-loss + bond-loss writes. The chips match that exactly.

**Ruling on the editorial's near_miss question: keep near_miss on the success side.**
It is engine law (no authoring lever moves it), and it is honest here: a step-1
near_miss aggregates to the `success_at_cost` band, the success writes fire, and that
band shows the success chips. A near-miss strike is a vault that stood with a flaw —
the church opens, the town feasts, the abbot trusts the master. Chip and write agree on
every path.

**Ruling on reaction keys.** `byOutcome` keys are the five-value `UnifiedActionOutcome`;
`near_miss` is never an aggregate band. Success reactions on `critical_success`,
`success`, `success_at_cost` and failure reactions on `failure`, `critical_failure`
cover every reachable page.

**Aggregation over-claim (finding, prose changed).** The aggregate `success_at_cost` band
also renders when step 1 was a clean success and the cost came from step 0 (its
`success_at_cost` / `near_miss` / `failure`, all `continue_weakened`). On that page:
- Vanguard overview "The crew spent the last dry days filling the crack with fresh
  mortar. The church opened late, in the first rain." contradicts step 1's own afterimage
  "They struck the frame, and the vault took its own weight." **Fix:** "The last dry days
  went on the vault, and the church opened late, in the first rain." — true whether the
  dry days went on the test or on a crack.
- Watcher overview "The crew rebuilt the course over the door in spring, and the church
  opened at midsummer." contradicts "They kept the frame sound until spring." **Fix:**
  "The church opened late in spring, once the last work on the vault was done." The
  rebuilt course is still told by the step-1 at-cost afterimage when it happened.
The outcome-ladder cells (§ 9) are annotated, not rewritten (design summary).

**Prose rule 7b (later-tense promises) — walked.**
- Spine "The winter rains come next week" / "can crack the vault": the scene's premise,
  settled inside the encounter. Lawful.
- Step-1 narratives ("the vault will split and fall", "All winter the rain will soak the
  frame… must loosen the wedges"): in-scene stakes resolved by step 1 itself. Lawful.
- Overviews "must be repaired before it opens", "must come down and be built again",
  "must clear the broken stone and build its vault again": present-tense states of
  scene-local objects (the church, the vault), never chipped, binding the mortal to
  nothing. Lawful, same class as debt-arbitration's "The deed goes to the noble."
- Watcher `critical_failure` "{cast:abbot} has sent for another master": past, scene-local,
  no state written, no cast key, no chip. Ruled lawful; nothing in the kit seeds a rival.
- Reaction intents: "{cast:foreman} remembers it" = `bond_change $cast:foreman +0.12`;
  "The town thinks better" = `reputation_with $here +0.04`; "offers to rebuild" is an
  offer, not a promise of later work, and "{cast:abbot} thinks a little better" =
  `bond_change +0.06/+0.04`; "The town hears them out" = `reputation_with +0.03`;
  "{cast:abbot} does not forgive it" = `bond_change −0.06`. Every clause names a write.
- Chips: "trusts", "keeps a feast", "no longer trusts", "blames" — each backed on its band.
- No place-and-time promise anywhere; no appointment needed.

## 5. Chip referents

| Chip | Referent | Resolves? |
|---|---|---|
| BOND gain/loss `reputation with {target}` | `$cast:abbot` (must-persist actor, `visualKind: agent`) | yes; THR-1685 names the abbot |
| BOON `Festival` | `trait.condition.location.festival` (catalog trait, `attachment`) | yes; the write puts it on `$here` |
| SCAR `reputation with {target}` | `$here` → settlement (`location`) | yes |

No chip points at fiction. The vault, centering, wedges and mortar stay scene-local and
are never chipped. The foreman has no chip (the reaction is the only write to them).

## 6. New Hooks Needed

None.

## 7. Implementation File Map

Compiled set (not hand-edits): `Docs/plans/encounters/cathedral-vault.package.json` →
`npm run compile:encounter` produces the module, its structural test and both
registrations. Run `check:encounter` on the package too (the dry-run misses its gates).

Beyond the compiled set:
- `src/data/content-eval/plotHooks.ts` — stamp `usedBy` for `hook.long_road` at closeout
  (brief).
- No engine, type or art file.

## 8. Verdict

**READY WITH CAVEATS.**

1. **Pre-fork critical failure** (corpus-wide, BACKLOG § 9): a step-0 `critical_failure`
   renders the chosen arm's `critical_failure` page with two hollow chips. Rare at 0.76
   in the master window. Not a pre-task; the fallback band makes it correct once fixed.
2. **`{location}` may name a Place** (raw `located_at`), in the openings, the Festival
   and SCAR chip details and the Vanguard critical_success overview, while `$here` writes
   to the settlement. Precedent-consistent (masons-commission, debt-arbitration
   openings); "the town" is not a safe substitute because the encounter also runs in
   hamlets. Left as is.
3. **The Watcher arm compresses a season.** Its overviews narrate spring and midsummer,
   but the step lasts 2–3 ticks and the Festival is written at resolution, so the town
   "feasts for the new church" now while the prose says it opened in spring. Narrative
   over mechanical perfection (NFP 5); no write promises a later date. Accepted.
4. In rural settings and cities the foreman (and in rural settings usually the abbot) is a
   minted walk-on.
5. Do not bind `libraryCardId` on the step-0 specials (Whisper / Omen are descriptive
   types here; the library cards promise effects these cards do not perform).

## 9. Primitive Disposition

**BACKLOG — pre-fork terminal must not select a forked aftermath arm.** Same spec as
`debt-arbitration-systems.md` § 9: in `src/engine/unifiedActionResolution.ts` (call site
`:2411`), skip `applyAgentDecidedBranches` when `terminalActionOutcome(action, outcome,
template)` (`unifiedActionLifecycle.ts:175`) is terminal and the fork keyed on
`action.currentStep` has not run; `resolveAftermathVariant` then layers `fallback`. This
packet authors the truthful fallback `critical_failure` band. Per the process-work
throttle, it goes to the run report / impediment log for the weekly retro, not straight
to a ticket. This is now the fourth forked encounter carrying it.
