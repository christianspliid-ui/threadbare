# Encounter Pipeline: The Debt Arbitration
> Scale: short | Slug: debt-arbitration | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0 (Factory v3, batch expert-everyday-1 slot 1, THR-1678)

**Verdict: READY WITH CAVEATS.** Every id and field the revised packet names exists in
`src/` and is wired the way the packet uses it. Six fixes are applied in
`debt-arbitration-final.md` (rulings on the editorial's four Pass-3 items, one rule-7b
tense fix, one aggregation over-claim, and dead carryover rows). One engine gap is
real and shared with the shipped fork corpus: a **critical failure on step 0 ends the
action before the fork runs, but the fork's pole is already recorded**, so the
aftermath renders the chosen arm's `critical_failure` band, whose prose and chips
describe a step that never ran. It is rare at this difficulty, not unique to this
encounter, and BACKLOG, not BLOCK.

## Id and field verification

| Id / field the packet uses | Verdict | Evidence (file:line) |
|---|---|---|
| `StepNudge.poleLean` `{ axis, toward }` | verified | `src/types/unifiedAction.ts:1615` (union), `:1698` (field) |
| `StepNudge.opposes` (bare cast key `claimant`) | verified | `src/types/unifiedAction.ts:1758`; bare key or `$cast:` both accepted (doc at `:1745`–`:1757`); precedent `the-unfinished-rite.package.json` `"opposes": "rival"` |
| `ActionStepBranch.decidedBy: { axis }`, variants `positive`/`negative` | verified | `src/types/unifiedAction.ts:2100`, `:2109` (BranchPoleDecision), `BranchPoleKey` at `:1637`; precedents `fair-bout`, `counting-house-dispute` (`branchOnStep: 0` on the step at index 1) |
| `ActionStep.carryoverFactorLines` keyed on step-0 `StepOutcome` | verified | `src/types/unifiedAction.ts:2051`; `StepCarryoverFactorLine` = `{ text, polarity, forecastDelta? }` at `:1859`, `:1880`; budget 12 words `nudgeAuthoringConstants.ts:265` |
| `successMetadata.rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#gold'] }` | verified | `src/types/unifiedAction.ts:50`; `RewardPoolRecipe` `src/types/attachments.ts:232`; drawn by `resolveUnifiedReward` → `drawSeededReward` `src/engine/unifiedActionResolution.ts:1538`–`:1560` |
| `#gold` yields possessions | verified | tag in closed catalog (`reference/content-tag-catalog.generated.md:28`, item ×12); possessions carrying it e.g. `reward_vestments_merchant_silks` (`attachmentCategory: 'possession'`, `src/data/reward-attachment-catalog.ts:564`–`:571`), `reward_tomes_scrolls_merchants_ledger` (`:760`), `reward_arms_assessors_weighted_scales` (`:516`), mounts `:1353`/`:1433`, tools `:2437`/`:2488` |
| Prize tier by band | **finding** (see ruling b) | `mapStepOutcomeToRewardOutcome` `src/engine/unifiedActionResolution.ts:1510`–`:1521`: `success_at_cost` and `near_miss` draw on the `success` curve. No lesser prize exists at at-cost |
| `intelligence` effect (`category`, `label`, `detail`, `reliability?`, `targetAgentId?`) | verified | `src/types/unifiedAction.ts:562`–`:573`; `political_secret` at `:78` |
| `reputation_with` `targetLocationId: '$here'` | verified | `src/types/unifiedAction.ts:1176`–`:1186`; `$here` → actor's `located_at` walked up to the **settlement** tier `src/engine/sceneHere.ts:42`–`:66`; field kind `location` `src/engine/sceneSentinels.ts:132`; cap ±0.15 `src/engine/reputation.ts:66` (all deltas 0.05–0.12 fit) |
| `reputation_with` `targetAgentId: '$cast:claimant'` | verified, **semantics finding** (ruling c) | same type; it moves **the actor's** standing with the noble (doc `:1150`–`:1174`), not the noble's name in town |
| `favor_creation` `{ magnitudeRange, context, debtorAgentId }` | verified | `src/types/unifiedAction.ts:1124`–`:1133`; `debtorAgentId` is an agent sentinel field `src/engine/sceneSentinels.ts:120` |
| successMetadata fires on `success_at_cost` / `near_miss` | verified | `isStepSuccess` `src/types/unifiedAction.ts:2955`–`:2957`; doc at `:60` |
| Aftermath band = aggregated action outcome | verified | `computeFinalActionOutcome` `src/engine/unifiedActionLifecycle.ts:344`–`:360`: any step-0 failure/near-miss/at-cost aggregates a winning step 1 to `success_at_cost` |
| Step-0 `critical_failure` terminates | **finding** (caveat 1) | `advanceStep` `src/engine/unifiedActionLifecycle.ts:204`–`:216` ("critical_failure always triggers fail_action"); decision recorded unconditionally first `src/engine/unifiedActionResolution.ts:2336` |
| `AftermathOutcomeOverride` carries no effects | verified (limits the fix) | `src/types/unifiedAction.ts:2284`–`:2288` |
| Trait `trait.personality.gold.vice` (Greedy) | verified | id built `src/data/personality-trait-content.ts:111`, `:136`, `:146`; gold axis vice word "Greedy" `src/types/axisRegistry.ts:96`–`:100`; nodes seeded `src/engine/phases/personalityTraitEmerge.ts:67`; `traitVariants[].traitId` swept as `template_gate` `src/engine/traitRefValidation.ts:179`–`:182`. Note: the editorial's "in live use (`fair-bout.ts`)" is wrong — fair-bout uses `trait.personality.iron.virtue` (`fair-bout.ts:365`); no shipped template references `gold.vice` yet. The id is valid regardless |
| `TraitVariant.factorLine` (required) | **missing in revised** — supplied | `src/types/unifiedAction.ts:1828`–`:1837` |
| imageTags `generic.energy` / `generic.focus` / `generic.luck` / `generic.oath` | verified | `src/data/encounter-image-library.ts:643`, `:628`, `:631`, `:632` |
| Tooltips `ui.reputation_with` / `ui.standing` / `ui.favour_owed` / `ui.knowledge` | verified | `src/data/ui-content.ts:423`, `:384`, `:404`, `:446` |
| stateNoun `reputation with {target}` | verified | the one lawful multi-word noun `src/data/content-eval/nudgeAuthoringConstants.ts:464` |
| Deal tags `insight` / `social` / `presence` / `craft` | verified | `DealContextTag` `src/types/unifiedAction.ts:1898`–`:1910` |
| NPC role `merchant` (master) | verified, class-honest | `src/types/npc.ts:38`; town `:227`, city `:245`, capital `:270`, all chance 1.0 |
| NPC role `noble` (claimant) | verified; reuse only in city (0.7, `:253`) / capital (0.9, `:278`); **town has no noble row** (`:225`–`:242`) | spawn path `mintRole: spec.spawnNpcRole` `src/engine/encounterSupportBundle.ts:516` mints a walk-on noble in a town. Ruled class-honest: a landed creditor come to town for a failing bank is the fiction |
| `{location}` token | **finding** (ruling d) | `currentLocationName = getAgentLocation(...)?.name` `src/engine/proseEnrichment.ts:490`, `:805` — the raw `located_at` node, which can be a Place |
| `crudType`, `intrinsicTier: 'shaping'` | verified | `src/types/unifiedAction.ts:2400`, `:2397` |

## 1. Support Bundle Honesty

| Object | Delivery claim | Honest? |
|---|---|---|
| `master` (merchant) | lazy-materialize, reuse `merchant` else spawn "Aurel Vance" | Yes. `merchant` is at chance 1.0 in every urban subtype, so reuse will nearly always bind a standing merchant. |
| `claimant` (noble) | lazy-materialize, reuse `noble` else spawn "Ysolde Carrow" | Yes, with a note. Towns have no native noble, so in a town the binder mints a walk-on noble at the stage. The fiction supports it (the noble came for the deed). |
| possession prize | step `rewardPool` `#gold` | Yes. The prize is tag-drawn; the engine renders the PRIZE chip from the instantiated node (THR-1004). Tier follows the **step-1** outcome, not the aggregate band. |
| intelligence record | step `successMetadata` + `failureMetadata` effect | Yes. Both halves carry it, so the knowledge BOON is backed on every band step 1 reaches. |
| favours (`master`, `claimant`) | `favor_creation` debtor `$cast:<key>` | Yes. Both keys are `must-persist` actors. |
| town standing | `reputation_with` `$here` | Yes. Binds to the settlement even when the mortal stands at a Place. |

## 2. Missing Primitives

- **Pre-fork terminal routing (gap, BACKLOG).** A step-0 `critical_failure` ends the action
  (`advanceStep`), but `applyAgentDecidedBranches` has already written the pole into
  choice history, so `resolveAftermathVariant` layers the chosen arm's
  `critical_failure` band. On that path the Vanguard band claims an arbitration was
  called and lost and shows a SCAR (town) and a BOON (knowledge) whose writes never ran;
  the Watcher band claims paper was taken and shows a SCAR with no write. Law 56 hollow
  on that path. No content-only fix exists: `AftermathOutcomeOverride` carries no
  effects, and a step-0 `failureMetadata` would also fire on plain step-0 failures that
  continue into step 1. Shared by every shipped `decidedBy` fork whose step 0 is
  `continue_weakened` (`fair-bout`, `counting-house-dispute`).
- Everything else is live: `decidedBy`, `poleLean`, `opposes`, `carryoverFactorLines`,
  step `rewardPool`, `intelligence`, `reputation_with`, `favor_creation`,
  `BranchAwareAftermathConfig`. No `authoredChoices`. No appointment or place promise.

## 3. Runtime Feasibility

- Two steps, one `decidedBy` fork on `courage_prudence` keyed on step 0: supported
  (compiles in two shipped precedents).
- `aftermathConfig.branchOnStep: 0` with variants `positive` / `negative` and a
  required `fallback`: supported. The revised packet authored no fallback. The final
  packet adds a step fallback (a copy of the Watcher arm, the precedent shape) and an
  aftermath fallback whose `critical_failure` band tells the step-0 path truthfully. It
  becomes reachable once the BACKLOG fix below lands.
- Outcome ladder: all five aggregate bands authored on both arms.
- **Carryover `critical_failure` rows are unreachable.** A step-0 critical failure ends
  the action, so step 1 never reads the row. Dropped from both arms.
- Measurement is unchanged: step 0 at 0.58 is the only top-level difficulty.

## 4. Aftermath Supportability — rulings on the editorial's open items

**(a) success_at_cost town standing.** `successMetadata` fires on every
`isStepSuccess` outcome of step 1 (`success_at_cost` and `near_miss` included). The
aggregate `success_at_cost` band is reached when step 1 wins and step 0 or step 1 carried
a cost. On every path into that band, `reputation_with $here +0.10` has fired. **Ruling:**
the rep BOON stays on `success_at_cost` (a chip where a write fires, and the write gets
its chip). The ladder row is corrected to say so. No band-scoped write exists that could
withhold it, and none is needed.

**(b) "less the elders' fees".** Over-claims. `success_at_cost` and `near_miss` draw the
prize on the **success** curve (`unifiedActionResolution.ts:1510`), and the aggregate
at-cost band also shows when step 1 was clean and step 0 carried the cost. Nothing draws
a lesser prize and nothing deducts a fee. **Fix:** "…paid in goods from the warehouses,
less the elders' fees." → "…paid in goods from the warehouses, though only after a long
hearing." The ladder's "Spent" cell now says what is really spent. The step-1 at-cost
*afterimage* ("the elders charged the costs of the arbitration to them") is in-scene
narration of step 1's own band. It is left verbatim but noted for the editorial lane,
because no write backs a charge.

**(c) THR-1685.** No chip in the kit anchors `$cast:claimant`. The claimant's
`reputation_with` lives only in the "Tell the town" reaction, which authors no chip, so
the renderer defect cannot fire. The finding is the reaction's **intent**:
`reputation_with targetAgentId: $cast:claimant, delta -0.12` lowers *the mortal's*
standing with the noble (the noble thinks worse of them). It does not make "the noble's
name fall in town", which no write performs. **Fix:** intent → "Let every counting
house hear whose household borrowed the money. The town thinks better of the mortal
for it, and the noble thinks far worse." Both clauses now name a write that fires.

**(d) `{location}` in overviews.** `{location}` renders the raw `located_at` node's
name, which can be a Place (a market, a hall), while `$here` resolves up to the
settlement. **Fix:** "every counting house in {location}" → "every counting house in
town", in the Vanguard `critical_failure` overview, the Watcher `critical_failure`
overview, and the Vanguard spine ("every counting house in {location} will hear who
lost"), where the same phrase means the settlement. The opening's arrival sentence keeps
`{location}`, following the counting-house and cunning-fair precedent.

**Prose rule 7b (later-tense promises).** Every later-tense promise was walked:
- Opening "a creditor who loses it forfeits the bill": scene-local, settled inside the
  encounter. Lawful.
- Vanguard spine "every counting house in town will hear who lost": performed by the
  `reputation_with $here` write on both halves. Lawful.
- Reaction intents: "The noble owes the mortal" is `favor_creation`. "Town thinks
  better / noble thinks far worse" are the two `reputation_with` writes. Lawful after fix (c).
- Watcher overviews "The noble **will have** the deed." (×3): a future claim about a
  scene-local object with no effect. **Fix:** "The deed goes to the noble." This is the
  present-tense form the Vanguard failure band already uses.
- No place-and-time promise anywhere. No appointment needed.

**Aggregation over-claim (Watcher `success_at_cost`).** "The clipped coins in {actor}'s
third weigh less than their face." also renders when step 1 was a clean success and the
cost came from step 0. On that page it contradicts step 1's own afterimage "They left
with a full third in good coin." **Fix:** "{actor} has their third. The house is left
to its other creditors." This is true on every path into the band, and the clipped coin
is still told by the step-1 at-cost afterimage when it happened.

## 5. Chip referents

| Chip | Referent | Resolves? |
|---|---|---|
| rep BOON/SCAR `reputation with {target}` | `$here` → settlement node (`visualKind: location`) | yes (`sceneHere.ts:64`) |
| knowledge BOON | concept tooltip `ui.knowledge`, the minted intelligence record | yes (write on both arbitration halves) |
| favour BOND `a favour owed` | concept `$cast:master` (`visualKind: agent`) | yes (must-persist cast) |
| PRIZE | engine-rendered from the drawn instance | yes |

No chip points at fiction. No chip anchors `$cast:claimant`.

## 6. New Hooks Needed

None for this encounter. One BACKLOG engine item (below).

## 7. Implementation File Map

Compiled set (not hand-edits): `Docs/plans/encounters/debt-arbitration.package.json` →
`npm run compile:encounter` produces the module, its structural test and both
registrations. Run `check:encounter` as well; the dry-run misses its gates (#1114).

Beyond the compiled set:
- `src/data/content-eval/plotHooks.ts` — stamp `usedBy` for `hook.puzzle_gauntlet` and
  `hook.unlikely_alliance` at closeout (brief).
- No engine, type or art file for this encounter.

## 8. Verdict

**READY WITH CAVEATS.**

1. Pre-fork critical failure renders the chosen arm's `critical_failure` band with
   hollow chips (corpus-wide, BACKLOG below). Rare at step-0 difficulty 0.58 for a mortal
   in the expert window. Not a pre-task: the packet carries the fallback band that makes
   it correct the moment the engine fix lands.
2. THR-1685: avoided by construction (no `$cast:` rep chip).
3. The step-1 at-cost afterimage asserts a charge no write performs (editorial lane,
   in-scene narration, left verbatim).
4. `{location}` in the opening may name a Place (precedent-consistent).
5. In a town, the claimant is a minted walk-on noble (no native noble role).
6. Do not bind `libraryCardId` on the step-0 specials. `card.kindled_ambition.*` promises
   "the mortal wakes wanting something lasting" (an ambition grant) and `card.whisper.*`
   promises a reveal (`nudge-card-library.ts:151`–`:157`, `:198`–`:205`). Neither
   special does that; both only lean the fork. Leaving them unbound also spends none of
   the batch's over-exposed-card budget. Binding `card.stumble.signature.chaos` on
   Scatter The Figures is lawful but optional.

## 9. Primitive Disposition

**BACKLOG — pre-fork terminal must not select a forked aftermath arm.**
Spec: in `src/engine/unifiedActionResolution.ts` (call site `:2336`), skip
`applyAgentDecidedBranches` when `terminalActionOutcome(action, outcome, template)`
(`src/engine/unifiedActionLifecycle.ts:175`) returns a terminal outcome *and* the step
that forks on this index has not run, i.e. the action ends before any `decidedBy`
branch keyed on `action.currentStep` is resolved. The choice history then holds no key,
so `resolveAftermathVariant` layers `fallback`, which authors a truthful band. Test: a
two-step `decidedBy` fixture whose step 0 is pinned `critical_failure` resolves with an
empty choice history and renders `fallback.byOutcome.critical_failure`, and no axis
drift is applied for a fork the mortal never reached. Corpus knock-on: audit every
shipped `decidedBy` template's aftermath `fallback` for a `critical_failure` band
(`fair-bout` authors none).
Cost/benefit: ~1–2 hours to build; not fixing it costs one hollow page per step-0
critical failure on every forked encounter, a Law-56 violation the page-read gates
cannot see.
Per the process-work throttle, this goes to the impediment log / run report for the
weekly retro, not straight to a ticket.
