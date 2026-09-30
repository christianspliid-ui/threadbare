# Encounter Pipeline: The Cooper's Pawned Box
> Scale: short | Slug: pawnbrokers-strongroom | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0

Audited: `Docs/plans/encounters/pawnbrokers-strongroom-revised.md` (editorial verdict PASS WITH REVISIONS). Every id below was grepped in `src/`.

**Headline.** The design is implementable as a compiled package with no new engine primitive. The audit found **one live Law 56 defect** (a step-0 critical failure ends the action before step 1's failure writes can fire, so two critical_failure chips were unbacked on that path) and **two over-claiming overviews** (`success_at_cost`, `critical_failure`). All three are fixed in the final file. The editor's `success_at_cost` question has a hard answer: the engine has **no band-keyed step write**, so the band stays prose-only on its unchipped routes, and its one real mechanical cost is the step-0 standing write described in § 4.

---

## 1. Support Bundle Honesty

| Support object | Claimed delivery | Verified | Finding |
|---|---|---|---|
| `rival` (hired thief) | `lazy-materialize-on-trigger`, must-persist, reuse `lookout`/`wanderer`, spawn `lookout` "Wren Hollis" | `findExistingActorSupport` (`src/engine/encounterSupportBundle.ts:167-193`) searches **only the anchor location's actors** for a matching `encounterSupportRole`, then for an `npcRole` in `reuseNpcRoles`. On a miss, `resolveActorSupport` (`:343`) materializes through `materializeWalkOnActor` with `spawnNpcRole`/`spawnName` at the placement, whatever the subtype. | **Honest.** See roster table below. The spawn fallback makes the rival always exist, so `{cast:rival}` and `opposes: 'rival'` always bind. "Wren Hollis" is unique in the repo (2 hits, both slot-4 docs). `lookout` is a valid `NpcRole` (`src/types/npc.ts:58`). |
| The prize | drawn at resolution via step `rewardPool` | `rewardPool.ts:157-162`: `possession` + `tagFilters` projects to `{ kind: 'item_template', tags: ['#stealth'] }`, resolved by `resolveContentQueryDetailed`. `#stealth` is a seated family tag (`content-tags.ts:230`, catalog: item 6, trait 3, power 2). Worn by items in `reward-attachment-catalog.ts` (lines 317, 406, 638, 665, 1182, 3544, 3698) and the `thieves_kit` core (`item-generator-cores.ts:563`). A shipped `#stealth` possession pool already runs (`encounter-content.ts:11027`). | **Honest.** Persists as a possession on `$actor`. Accepted exposure, same as `cunning-fair` / `bell-at-the-exchange`: `BAD_OUTCOME_CHANCE_SUCCESS` = 0.05 swaps the recipe for the harm table on success and success_at_cost, and the PRIZE chip then names what was drawn. The one line that would be wrong on that 5% is the overview "paid {actor} from inside it". The critical_success band is 0%. |
| The buyer's sequel | `encounter_seed` literal → `encounter.black_market_deal`, delay 36 | `encounterSeeding.ts:681-684` resolves a `templateId` directly through `getUnifiedTemplateById` and spawns with **no eligibility or location check** (`:750`). The template is a legacy entry in `encounter-content.ts:5441` (locationTypes hamlet/town/city/capital, sublocationTypes smugglers-den, no faction or guild gate), registered into the unified list through the `...ENCOUNTER_TEMPLATES` spread (`unified-action-templates.ts:5545`). Literal shape matches the shipped `pilots-reckoning.ts:226-232`. | **Honest.** Its opening ("follows directions given twice and written down nowhere, to a back room") is what the seed label's "directions to a back room" promises. It names a *broker*, not "the buyer", so the chip promises only that directions arrive; it does not promise the buyer appears. Accepted. Its `retrofitPending` listing does not block a literal seed. |
| Town standing | written on failure | `reputation_with` with `targetLocationId: '$here'`, the shipped shape (`cunning-fair.ts:151-154`). | **Honest**, with the step-0 addition (§ 4). |
| The compulsion | written on step 1 failure | `plant_compulsion` (`unifiedAction.ts:843-861`); `steal` is a member of the closed `EncounterType` union (`types/encounter.ts:28-30`). `black_market_deal` is itself `encounterType: 'steal'`, so the bias and the sequel agree. | **Honest.** |

**Roster coverage for the rival (editor item 3).** `SETTING_CLASS_MAP` (`settingClasses.ts:57-59`): `rural` = hamlet, farmland, mining; `urban` = town, city, capital.

| Subtype | `lookout` | `wanderer` | Result |
|---|---|---|---|
| hamlet | no | 0.2 | reuse binds an existing wanderer 20% of the time, else spawns |
| farmland, mining | **no roster entry at all** (`LOCATION_ROLE_ROSTERS` has no key for either, `npc.ts:214-344`) | no | reuse can never bind; **spawn fallback always runs** |
| town | 0.35 | no | reuse or spawn |
| city, capital | 0.45 | no | reuse or spawn |

The roster test (`encounterSupportBundle.test.ts:438-455`) asks the default *setting* bundles, not per-template reuse lists, and `rural` has `wanderer` and `urban` has `lookout` in any case. Confirmed: on farmland/mining the stranger is always a fresh spawn, which reads true for "a thief in for the fair". No change needed.

## 2. Missing Primitives

| Check | Result |
|---|---|
| Test shaping | Live: specials + `deal`, with `opposes: 'rival'` on the Heavy Hand (shipped, `drowned-mans-testimony.ts:197`). |
| Flip / reveal state | Not used. |
| Task / progress carriers | Not used. The race is the step's own test. |
| Prevention / interception / recovery | The Heavy Hand *shifts the forecast and supplies band prose*; it does not mechanically block the rival. That is this encounter's model everywhere (cards move odds, fragments tell it), not a gap. |
| Authored choice bundles | None. `authoredChoices` (rejected, THR-772) is not used. |
| Band-keyed step write | **Does not exist** (see § 4). Not a blocker here. Prior passes recorded the same absence (`cunning-fair-systems.md`, `debt-arbitration-systems.md`, `comet-disputation-systems.md`). No new ticket. |
| Appointment | Not needed. The seed is placeless and promises no time (see § 4, rule 7b walk). |

## 3. Runtime Feasibility

- **Beat count.** Two steps, linear, branch count 0. `branchOnStep` was authored as `1`; every shipped encounter uses the deciding step, `0`. Harmless with `variants: {}`, but **changed to 0** to match the convention (see fixes).
- **Step flow.** Step 0 `continue_weakened`, step 1 `fail_action`. `advanceStep` (`unifiedActionLifecycle.ts:204-216`) forces `critical_failure` on any step, whatever its `failBehavior`, and `terminalActionOutcome` (`:175-192`) mirrors it. **A step-0 critical failure ends the action as `critical_failure` and step 1 never runs.** `computeFinalActionOutcome` (`:344-363`): any failed step (continued) or any `near_miss`/`success_at_cost` step → `success_at_cost`; a crit on an otherwise clean run → `critical_success`.
- **Metadata split.** `isStepSuccess` counts `critical_success`, `success`, `success_at_cost` **and `near_miss`** as success (`unifiedAction.ts:2955`); `successMetadata` fires on all of them, `failureMetadata` on `failure`/`critical_failure` only.
- **Hands.** Step 0: 2 specials + `deal: { count: 4, tags: ['shadow', 'wild'] }`. Step 1: 1 special + `deal: { count: 4, tags: ['shadow', 'finesse'] }`. Both deal tags are in the closed `DealContextTag` union (`unifiedAction.ts:1898-1910`). Every special carries a failure-band fragment. No special reaches the big-delta line (Δ ≥ 0.15): Hold is 0.14.
- **Zero-essence Heavy Hand (brief rule 20).** `essenceCost: 0` with `costs: { detectionDelta: 0.15 }` has another cost channel, so it passes. `dispatchNudgeCommitments` (`nudgeDispatch.ts:265-276`) applies `applyRawDetectionDelta` after the step resolves, for the actor's region, one channel. The shipped Heavy Hands use `essenceCost: 2` + `detectionDelta: 0.15` (`the-broken-seal.ts:270-285`, `the-garrisons-price.ts:231-247`, `toll-of-blades.ts:190`). The zero-essence form is the brief's chosen variation (house precedent for an essence-0 card priced on one other channel: `drowned-mans-testimony.ts:206-215`, `the-garrisons-price.ts:200-214`). No `libraryCardId` is authored on any of the three specials, so they are one-offs, never echo-card candidates; legal (`unifiedAction.ts:1655-1662`) and matching the `drowned-mans-testimony` sibling.
- **Card-type composition (editor item 2, trigger 21).** The generated coverage matrix compares the family by structure (`setting-coverage.generated.md:62`: `encounter.town`, 18 templates, 52 cards, `sphere 51, trait 1`). That structure is the family norm, so the check is at library-type level. Result: **no shipped `encounter.town.*` encounter authors a Heavy Hand or any `detectionDelta` card** (every `detectionDelta` in `src/data/encounters` belongs to `border-levy`, `the-broken-seal`, `the-drowned-archive`, `the-garrisons-price`, `toll-of-blades`, `vertical-slice`, none of them town). The sphere triple here (life + matter in step 0, force in step 1) appears in **no** shipped town encounter; the nearest is `counting-house-dispute` (life + matter in step 0, then time/mind), which shares the step-0 pair only. None of the sibling slot 1/2/3/5/6 drafts authors a `detectionDelta`. The "Hold" verb also appears in three shipped town names (`Hold The Bell`, `Hold The Bearing`, `Hold Back The Water`); a verb repeat is lexicon-legal and not a composition match. **PASS.**
- **Quiet The Cellar Stair** is a matter-sphere Boost, which is not the library's signature (`SPHERE_SIGNATURES`: energy signs Boost). With no `libraryCardId` that is a scene-bound one-off, as the draft says.
- **Trait variants are template-level.** `TraitVariant` (`unifiedAction.ts:1828-1838`) has no step field, so both variants apply to **both steps**, not "step 1" as the revised file says. Both factor lines read true in either step (both are in a cellar). Wording corrected in the final file. Both trait ids are live (`mastery-trait-content.ts:125`, `reputation-trait-content.ts:186`).
- **Other ids verified.** `honesty_cunning`, `courage_prudence` (`types/agent.ts`); `hook.descent_into_darkness` is a design-block reference, not runtime; `generic.mercy`/`generic.matter`/`generic.strength` are shipped `imageTag`s (`feud-mediation.ts`, `cunning-fair.ts`, `the-broken-seal.ts`).

## 4. Aftermath Supportability

### 4a. Path table (the per-chip test: name the step whose metadata backs it, and prove that step runs on the band)

| Action band | Paths into it | Backing | Result |
|---|---|---|---|
| `critical_success` | step 0 clean, step 1 crit (a crit on a run with no failure or cost) | step 1 `successMetadata` (prize, seed) | backed |
| `success` | step 0 and step 1 plain successes | step 1 `successMetadata` | backed |
| `success_at_cost` | R1: step 0 **failure** → step 1 any success. R2: step 0 at-cost/near-miss → step 1 any success. R3: step 0 clean → step 1 near-miss or at-cost | step 1 `successMetadata` fires on every route (prize, seed) | seed and prize backed on every route. Standing/compulsion: **see 4c** |
| `failure` | step 0 any non-crit → step 1 `failure` | step 1 `failureMetadata` (−0.08, compulsion) | backed |
| `critical_failure`, path A | **step 0 alone** resolves `critical_failure`; step 1 never runs | step 1 `failureMetadata` never fires | **was unbacked (both chips)** |
| `critical_failure`, path B | step 0 continues (or was clean), step 1 resolves `critical_failure` | step 1 `failureMetadata` | backed |

### 4b. Defect: critical_failure path A, both chips unbacked (fixed)

The revised file put **every** failure write on step 1. On path A, step 0's critical failure ends the action, so neither the `reputation_with` nor the `plant_compulsion` fires, while the critical_failure page shows a SCAR compulsion chip and a BOND reputation chip. The Law 56 machine gate cannot see it: `chipBackingViolations` credits *any* step's failure metadata to every failure face and has no model of which steps a path reaches (the class recorded in `the-sign-over-the-ruin-systems.md` § 1a, `well-sinking-systems.md` § 3, `comet-disputation-systems.md` carry-forward (c)).

**Fix (follows the `comet-disputation` precedent, not the `sign-over-the-ruin` duplicate):**

- **Step 0 gains `failureMetadata.effects: [reputation_with $here −0.04]`.** It fires on `failure` and `critical_failure` only (`near_miss` counts as success). This backs the BOND chip on path A.
- **The SCAR compulsion chip is removed from `critical_failure`.** Duplicating the compulsion onto step 0 would also plant it on route R1 (step 0 fails, step 1 wins), where "beaten to a lock by a hired thief" is false. On path B the compulsion is still planted and is not chipped. That is lawful: Law 56 constrains chips that claim state, not writes that go unchipped, and standing remains inspectable on the sheet (visibility parity holds; world standing passes the test).
- The `failure` band keeps both chips. It is reachable only through step 1 (`step 0` failing plainly continues), so both writes are guaranteed.

### 4c. `success_at_cost` (editor item 1): verdict and honest cost

**There is no lawful band-keyed write for this band.** `successMetadata` is keyed on `isStepSuccess`, not on band; `EffectPredicate` has no outcome/band member; the only band-aware effect kind is `sharpen_clue` (`encounterAftermath.ts:4667`); and the only band-keyed surface, `AftermathOutcomeOverride`, carries `overview`, `changes`, `reactionPrompt`, `reactions` (`unifiedAction.ts:2284-2288`), where `reactions` are player choices the brief keeps out of this short scale. Adding one write there would either put a choice on a choice-free test or fire on the crit and plain-success bands too. The same conclusion stands in three prior passes (see § 2).

What the band carries, honestly:

1. **Prize and seed** on every route (the prize lands; the buyer's interest is the thing the mortal carries forward, for all three success bands).
2. **Route R1 (the house woke) carries a real mechanical cost:** step 0's new failure write, **town standing −0.04**. That is the commonest way into the band. It is unchipped, because R2 and R3 do not write it and a chip must hold on every path into its band.
3. **The prose cost lives in the step afterimages** that tell what happened ("{cast:rival} was in the yard when they came up").

**Over-claim found and fixed.** The revised s_a_c overview said "{cast:rival} knows their face now." That is only true on the step-1 at-cost afterimage; on R1 followed by a step-1 crit the rival was still at the hatch. It is the same aggregation over-claim recorded for `debt-arbitration` (Watcher s_a_c). Replaced with a sentence true on every route: "The cooper has his box and paid {actor} from inside it, but the job was not clean." The face-and-yard fact remains on its one route, in the afterimage.

### 4d. Second over-claim found and fixed: critical_failure overview and failure chronicle line

- Overview "found {actor} at his **open strongroom** with empty hands": on path A the step-0 critical-failure afterimage never says the lock gave. Replaced with "below his house", true on both paths (the stair and the cellar are under the house).
- `narrativeTemplates.failure` said "{cast:rival} took the cooper's box to the buyer", which is true only on path B (and on the `failure` band). On path A the rival never reached the shelf. Replaced with a path-neutral line: "The cooper did not get his box back, and the pawnbroker named {actor} to the town."

### 4e. Rule 7b walk (every later-tense sentence names its effect)

| Sentence | Performing effect |
|---|---|
| Spine: "any theft will be blamed on {actor}" | The blame is resolved inside the scene: `reputation_with $here` on step 0 failure (−0.04) and step 1 failure (−0.08). On success the overview says the pawnbroker cannot cry theft. |
| Spine: "will sell it at the fair tomorrow" | The scene's own clock; resolved by the step outcomes, no mortal-facing promise. |
| Step 1: "Whoever gets the box out … first keeps it." | The step outcome. |
| Seed chip / seedLabel: "The buyer … will send for {actor}" / "sends word, with directions to a back room" | `encounter_seed` → `encounter.black_market_deal`, delay 36. The sequel's opening ("follows directions … to a back room") enacts the directions. |
| Compulsion chip "For a while they look for a lock to prove themselves on." | `plant_compulsion` `steal: 0.5`, 72 ticks. |
| Reputation chip "{location} thinks less of {actor}." | Present tense, state already written. |

**Appointment check (THR-1479).** No sentence binds the mortal to a place *by a time*. The back room is placeless (the seed fires wherever they stand; the sequel's own opening takes them there), so no `appointment` block is required and none is missing a `missed` branch. PASS.

## 5. Chip referents

| Chip | Referent | Resolves? |
|---|---|---|
| PATH seed (all success bands) | `concepts: [{ text: '{actor}', entityId: '$actor', visualKind: 'agent' }]`, the `pilots-reckoning.ts:446-463` form | yes (`$actor` is the carrier) |
| BOND `reputation with {target}` | `entityId: '$here'`, `visualKind: 'location'` | yes (the town, `sceneHere`) |
| SCAR compulsion (`failure` only now) | `shell_state`, `stateNoun: compulsion`, no referent (the `drowned-mans-testimony.ts:493-506` form) | yes |
| Fallback growth change | `concepts: [{ text: 'shadow reach', tooltipId: 'reach.shadow' }]`; `reach.${reach}` is generated (`aftermathWords.ts:113`) | yes |
| PRIZE | engine-rendered from the drawn instance | yes |

No chip points at `{cast:rival}`, the cooper, the pawnbroker, the buyer, the dog or the box; none is a free-text referent.

## 6. New Hooks Needed

None. No new role, sublocation type, state field, node type or content entry. The cooper, pawnbroker, buyer, dog and box are role nouns in prose; the only world object is `{cast:rival}`, materialized through the existing bundle path. No new family tag, no new world object (no `world-objects.ts` row).

## 7. Implementation File Map

Compiled, **not** hand-edits: `Docs/plans/encounters/pawnbrokers-strongroom.package.json` → `src/data/encounters/pawnbrokers-strongroom.ts`, `src/data/encounters/__tests__/pawnbrokers-strongroom.test.ts`, and the `RAW_UNIFIED_ACTION_TEMPLATES` + `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` registrations (`npm run compile:encounter`).

Beyond the compiled set:

| File | Change | Scope |
|---|---|---|
| `Docs/plans/encounters/pawnbrokers-strongroom.package.json` | Author from the final packet (prose byte-identical). `template.id` tail `pawnbrokers_strongroom` matches the slug. | the package |
| Concept art (per the final packet's Concept Art Direction) | one image, residue only (empty hook, snapped chain, candle stub) | art |
| Regenerated artifacts (`generate-setting-coverage`, content/world census, `encounter-batch-report`) | `check:generated-freshness` will flag them; regenerate last | generated |
| `Wiki-freshness-exempt:` commit-body line, if `check:wiki-freshness:blocking` trips | as batch 1 recorded (`394a98c1`) | none |
| Engine, types, `unified-action-templates.ts`, `default-support-bundles.ts` | **none** | |

Machine gates still owed at implementation (not run at editorial or here): `compile:encounter --dry-run`, `check:typecheck`, `npx vitest run …/pawnbrokers-strongroom.test.ts`, `check:encounter -- encounter.town.pawnbrokers_strongroom` (hand rules, detector sweep, composition contract), `check:encounter-live`. A hand read of the merged prose found no evasive term, no second person and no numeral, but it is not the detector run.

## 8. Verdict

**READY FOR IMPLEMENTATION.**

Every defect found is fixed in the final packet, and none needs a pre-task. The limits below are accepted, not blocking.

## 9. Primitive Disposition

No missing primitives identified.

Accepted limitations, recorded and not filed (prior passes hold the same finding, and a scheduled lane may not file process tickets):

- **No band-keyed step write.** `success_at_cost` cannot carry a write the crit and plain-success bands do not. The band's cost is prose on routes R2/R3 and a real −0.04 standing on R1.
- **5% harm-table swap** on the PRIZE for success and success_at_cost (a prior-batch precedent).
- **The buyer is not named in the sequel.** The chip promises directions, not the buyer's appearance.

---

## Fixes merged into the final packet

1. **Step 0 gains `failureMetadata`** (`reputation_with $here −0.04`): backs the critical_failure standing chip on path A (step-0 critical failure ends the action); on route R1 it is the honest mechanical cost of `success_at_cost`.
2. **SCAR compulsion chip removed from `critical_failure`** (unbacked on path A; the write still fires on path B, unchipped). Kept on `failure`.
3. **`success_at_cost` overview made true on every route** ("the job was not clean"); the rival's-face fact stays in the step-1 afterimage.
4. **`critical_failure` overview** "at his open strongroom" → "below his house"; **`narrativeTemplates.failure`** made path-neutral.
5. **`branchOnStep: 1` → `0`** (convention; no variants).
6. **Trait variants recorded as template-level** (both steps), not step 1.
7. Roster, `#stealth`, seed shape, Heavy Hand single channel, and card-type composition verified and recorded; self-audit flags resolved.
