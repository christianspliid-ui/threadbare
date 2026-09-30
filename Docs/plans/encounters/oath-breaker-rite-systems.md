# Encounter Pipeline: The Oath-Breaker's Rite
> Scale: short | Slug: oath-breaker-rite | Pass: systems
> Date: 2026-09-30 | Pipeline version: 2.0 (Factory v3, batch expert-everyday-2 slot 6, THR-1679)

**Verdict: READY WITH CAVEATS.** Every id and field the revised packet names exists in `src/`
and is wired the way the packet uses it. Four fixes are merged into
`oath-breaker-rite-final.md`: the required branch `fallback` step (veil 0.62, a copy of the
Heretic arm), the Heretic reputation deltas re-set for a 0.62 arm (+0.06 / −0.08), a
template-level Patient factor line that no longer says "reading" on steps that are not a
reading, and one ladder/ruling clarification on `success_at_cost`. One engine gap is real
and shared with the shipped fork corpus (debt-arbitration, fair-bout, counting-house-dispute):
a **step-0 critical failure ends the action before the fork runs, but the fork's pole is
already recorded**, so the chosen arm's `critical_failure` band renders with chips whose
writes never fired. It is rare at 0.60 for an expert, BACKLOG, not BLOCK.

## Id and field verification

| Id / field the packet uses | Verdict | Evidence (file:line) |
|---|---|---|
| `trait.condition.cursed` | verified live; template-default duration 36 | `src/data/condition-trait-content.ts:337` (def), `:81` `CONDITION_CURSED_DURATION = 36`, `:709` `CONDITION_DURATIONS` row |
| `trait.condition.location.tended_shrine` | verified live; duration row 144 | def `:565` (name "A Tended Shrine"), `:152` `CONDITION_TENDED_SHRINE_DURATION = 144`, row `:719`; Veil reader `LOCATION_CONDITION_STEP_MODIFIER` `:817` (`LOCATION_TENDED_SHRINE_VEIL_BONUS = 0.05`, `:223`) |
| `trait.condition.location.under_watch` | verified live; default 84, authored 48 override | def `:488` (name "Under Watch"), `:132` default 84, row `:717`; Shadow reader `:816` (`−0.06`, `:209`); shipped precedent `ledger-by-lamplight.ts:205` (`apply_condition`, `targetLocationId`) |
| `condition_attachment` `{ templateId, targetAgentId: '$actor' }` | verified | `src/types/unifiedAction.ts:712`–`:733`; precedent `the-garrisons-price.ts:509` |
| `condition_attachment` `{ templateId, targetLocationId: '$here' }` | verified; template-default duration applies to a place too | `unifiedAction.ts:723`–`:727` ("the template-default duration lookup and stacking behave identically; only the carrier changes"); precedent `encounter-content.ts:11768`/`:11805` (`tended_shrine`) |
| `apply_condition` `{ conditionTraitId, targetLocationId: '$here', intensity, durationTicks }` | verified | `unifiedAction.ts:630`–`:648`; `ledger-by-lamplight.ts:205`, `the-unfinished-rite.ts:147` |
| `reputation_with` `targetLocationId: '$here'` | verified; cap ±0.15 per outcome | `unifiedAction.ts:1176`–`:1186`; `src/engine/reputation.ts:66` `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME = 0.15` (all deltas 0.06–0.10 fit) |
| `tradition_novelty` value axis | verified; Veil's bound pair, positive = Archivist, negative = Heretic | `src/types/agent.ts:13`, `:48` (`veil: 'tradition_novelty'`), `:63` |
| `ActionStepBranch.decidedBy: { axis: 'tradition_novelty' }`, variants `positive` / `negative` | verified | `unifiedAction.ts:2100` (`decidedBy?: BranchDecision`), `BranchPoleKey = 'positive' \| 'negative'` `:1636`; same shape as `debt-arbitration.ts:185` |
| `ActionStepBranch.fallback` (required) | verified required; **finding fixed** (see § 3) | `unifiedAction.ts:2077`; debt-arbitration copies its decline arm (`debt-arbitration.ts:382`) |
| `StepNudge.poleLean` `{ axis: 'tradition_novelty', toward }` | verified | `unifiedAction.ts:1615`, `:1698` |
| `StepNudge.opposes: 'priest'` (bare cast key) | verified | `unifiedAction.ts:1745`–`:1758`; precedent `debt-arbitration.ts:290` (`opposes: 'claimant'`) |
| `ActionStep.carryoverFactorLines` keyed on step-0 `StepOutcome` | verified; critical_failure rows correctly omitted | `unifiedAction.ts:2051`, `StepCarryoverFactorLine` `:1859`; `advanceStep` terminates on critical_failure (`unifiedActionLifecycle.ts:204`–`:216`) |
| `traitVariants[{ traitId: 'trait.personality.veil.virtue' }]` (Patient) | verified id shape | id built `personality-trait-content.ts:111`/`:136`; swept by `traitRefValidation.ts:179`–`:182` |
| NPC role `weaver` (spawn-only) | verified valid `NpcRole`; in `artisan_guild` roster only, never an urban roster row | `src/types/npc.ts:65`, `:100`, `:186`, `:393`; spawn via `spawnNpcRole` `encounterSupportBundle.ts:301`/`:516` |
| NPC role `priest` (spawn-only) | verified; `priest` also appears in town rosters (`npc.ts:233`, chance 0.7), so spawn-only is a deliberate no-reuse choice | `npc.ts:40`, `:233`; precedents `the-unfinished-rite.ts:228`, `company-drama.ts:1120` |
| `reuseNpcRoles` omitted | verified optional | `src/types/encounter.ts:216` (`reuseNpcRoles?`); binder reads `spec.reuseNpcRoles ?? []` `encounterSupportBundle.ts:183`. Omit the field (drowned-man precedent) |
| Deal tags `lore` / `insight` / `presence` / `social` | verified | `DealContextTag` `unifiedAction.ts:1898`–`:1910` |
| imageTags `generic.memory` / `generic.focus` / `generic.luck` / `generic.time-slow` | verified | `src/data/encounter-image-library.ts:636`, `:628`, `:631`, `:635` |
| Tooltip `ui.reputation_with` | verified | `src/data/ui-content.ts:423` |
| stateNoun `reputation with {target}` | verified lawful multi-word noun | `nudgeAuthoringConstants.ts:464` (cited by debt-arbitration systems) |
| Specials: 2 per composed step, Δ ≤ 0.12 (< `NUDGE_BIG_DELTA` 0.15) | verified | `DEAL_MAX_AUTHORED_SPECIALS = 2` `nudgeHandChecklist.ts:84`; `NUDGE_BIG_DELTA` `nudgeAuthoringConstants.ts:184` |
| Plot hooks `hook.haunted_relic`, `hook.blame_falls_on_outsiders` | verified ids | `src/data/content-eval/plotHooks.ts:325`, `:471` |

## 1. Support Bundle Honesty

| Object | Delivery claim | Honest? |
|---|---|---|
| `oathbreaker` (weaver, spawn-only) | lazy-materialize, spawn `weaver` "Tobin Marle" | Yes. `weaver` is in no urban roster, so a spawn-only mint is the only honest route; no townsperson is made an oath-breaker. Omit `reuseNpcRoles`. |
| `priest` (hedge-priest, spawn-only) | lazy-materialize, spawn `priest` "Wendel Crane" | Yes. A town has a native `priest` (0.7), so omitting reuse means a walk-on hedge-priest arrives beside the town's own. The fiction supports it: a *hedge*-priest is an itinerant. Declared deliberately. |
| A Tended Shrine | aftermath effect on `$here` | Yes. Live, 144-tick row, real Veil step modifier. |
| Under Watch | aftermath effect on `$here` | Yes. Live; authored 48 ticks overrides the 84 default. |
| Cursed | aftermath effect on `$actor` | Yes. Live, 36 ticks. |
| town standing | `reputation_with $here` | Yes. `$here` resolves up to the settlement tier even when the mortal stands at a Place. |

## 2. Missing Primitives

- **Pre-fork terminal routing (gap, BACKLOG, corpus-wide).** A step-0 `critical_failure` ends
  the action (`advanceStep`), but `applyAgentDecidedBranches` has already recorded the pole, so
  `resolveAftermathVariant` layers the chosen arm's `critical_failure` band. On that path the
  Archivist band claims a rite failed before a crowd and shows CURSED, WATCH, REP− whose writes
  never ran; the Heretic band claims the priest named the strangers and shows WATCH, REP−
  with no write. The overview text is also wrong on that path (it narrates a step-1 event).
  No content-only fix exists (`AftermathOutcomeOverride` carries no effects; a step-0
  `failureMetadata` would also fire on plain step-0 failures that continue into step 1).
  Identical to the debt-arbitration finding; see § 9.
- Everything else is live: `decidedBy`, `poleLean`, `opposes`, `carryoverFactorLines`,
  `BranchAwareAftermathConfig`, location conditions via `targetLocationId`, `reputation_with`.
  No `authoredChoices`. No appointment and no place-and-time promise (see § 4).

## 3. Runtime Feasibility

- Two steps, one `decidedBy` fork on `tradition_novelty` keyed on step 0: supported (compiles
  in shipped precedents `debt-arbitration`, `fair-bout`, `counting-house-dispute`).
- **Branch-level `fallback` step (editor item 1, FIXED).** `fallback` is required. The revised
  packet authored none. The final packet adds one: a copy of the **Heretic arm**, carrying
  **veil 0.62** (never the draft's 0.40), its hand (`deal` 4, no specials), carryover rows and
  metadata with the re-set deltas. Reachable only when no pole is recorded (today: never on a
  live path, because step 0 always records one or terminates; the aftermath `fallback` below
  covers the terminal case once the engine fix lands). Even unreachable, it must not carry a
  softer number: 0.62 keeps every authored path inside the batch's expert band.
- Aftermath: `branchOnStep: 0`, variants `positive` / `negative`, and an authored aftermath
  `fallback` (three bands, no chips): supported. Outcome ladder: five aggregate bands per arm.
- Carryover `critical_failure` rows are unreachable (step-0 critical failure terminates) and
  are correctly omitted from both arms.
- **Heretic arm is deal-only, no specials (editor item 7, CONFIRMED legal).** Composed rules
  are `checkComposedHand` (`nudgeHandChecklist.ts:127`–`:178`): count > 0, specials + count
  inside 4–8 (here 0 + 4 = 4, the floor), specials ≤ 2. The sphere-spread (`HAND_SPHERE_COVERAGE_MIN`
  4) and ungated-common (`HAND_COMMON_OPTIONS_MIN` 1) floors are stood down on any step with
  `deal` (`nudgeHandChecklist.ts:225`–`:266`; same in `encounterPackage.ts:237`–`:266`), because
  they describe the dealt hand, which the dealer builds from the god's Repertoire. The authored
  specials (time/mind on step 0; chaos/time on the Archivist arm) are sphere-gated, so a god
  without those spheres is carried by the dealt fill. Precedent: debt-arbitration's Watcher arm
  is deal-only at count 4. No static sphere/common claim is made for any composed hand.
- Measurement: step 0 at 0.60 is the only top-level difficulty; `measure:roll-spread` reads it.
  Path means unchanged (Archivist 0.64, Heretic 0.61).

## 4. Aftermath Supportability

**Effects, per half (all confirmed live):**

| Half | Effects |
|---|---|
| Archivist success (incl. at-cost, near-miss aggregates) | `condition_attachment` `tended_shrine` `$here` (144), `reputation_with $here` +0.08 |
| Archivist failure | `condition_attachment` `cursed` `$actor` (36), `apply_condition` `under_watch` `$here` 0.6 / 48, `reputation_with $here` −0.10 |
| Heretic success | `reputation_with $here` **+0.06** |
| Heretic failure | `apply_condition` `under_watch` `$here` 0.6 / 48, `reputation_with $here` **−0.08** |

**Heretic deltas (editor item 2, RESOLVED).** +0.05 / −0.06 were set for a 0.40 exit. The arm is
now a 0.62 expert test, so **+0.06 / −0.08** is adopted. The design intent survives: the Heretic
arm is still the cheaper arm to lose (−0.08 against the Archivist's −0.10, and no Cursed) and
the smaller win (+0.06 against +0.08). Both sit well inside the ±0.15 per-outcome cap.

**`success_at_cost` town standing.** `successMetadata` fires on every `isStepSuccess` outcome
(`success_at_cost` and `near_miss` included), so on every path into the aggregate
`success_at_cost` band the full success half has fired. Ruling (same as debt-arbitration §4a):
the SHRINE and REP+ chips stay on that band, each backed by a write. The ladder's cost cell
("the night; the audience") is in-scene narration with no write; no band-scoped write exists
that could withhold the boon, and none is needed. The editor's "lighter REP+ at at-cost" cannot
be authored. Left as is; ladder row wording clarified in the final.

**Step-0 critical failure (editor item 3, CONFIRMED).** The aftermath `fallback` (three bands,
no chips) is the correct shape and is kept. It is selected only when no pole is on record.
Today the pole is recorded before the terminal check, so the chosen arm's critical-failure band
renders (hollow chips, step-1 overview). Shared with the corpus; BACKLOG (§ 9).

**Prose rule 7b (later-tense promises), walked:**
- "A wrong answer will cost {actor} their name in town" (opening P3): enacted by `reputation_with
  $here` negative on both arms' failure halves. Lawful.
- Archivist spine "{actor} must loose the oath before the crowd believes the priest" and Heretic
  spine "must prove to the whole square…": objectives settled inside the encounter, not promises
  to perform later. Lawful.
- Chip details ("Misfortune clings to {actor} for a while", "The town watches every newcomer
  now, and quiet work there is harder", "Rites at the shrine in town take more easily now"):
  each names its condition write, and each claim matches a live reader (Cursed star/gold
  modifiers; Shadow −0.06; Veil +0.05). Lawful.
- "a rite at midnight" (opening) is tonight's scene, not a promise the mortal must keep.
- **No place-and-time promise anywhere.** No `encounter_seed`, no `appointment` block needed.
  Verdict: no 7b violation, no BLOCK.

**Patient factor line (FIXED).** `traitVariants` is template-level and its factor line shows on
every step the trait holder plays (`unifiedActionResolution.ts:484`–`:485`). "Being Patient,
they do not hurry the reading" is wrong on step 1, where the mortal performs a rite or exposes
one. Restated as "Being Patient, they do not hurry the work." (8 words; true on every step).

## 5. Chip referents

| Chip | Referent | Resolves? |
|---|---|---|
| CURSED | `trait.condition.cursed` (`visualKind: attachment`) | yes: condition template, `CONDITION_TRAIT_DEFINITIONS` |
| WATCH | `trait.condition.location.under_watch` | yes |
| SHRINE | `trait.condition.location.tended_shrine` | yes |
| REP± | `$here` → settlement node (`visualKind: location`), tooltip `ui.reputation_with` | yes (`sceneHere.ts`) |

No chip anchors `$cast:` (THR-1685 avoided by construction). No chip anchors `$actor`. No chip
points at fiction; the oath-stone and the strangers are scene-local and unchipped.

## 6. New Hooks Needed

None. No new roles (both are existing `NpcRole`s), no new sublocation type, no state field, no
condition, no content table. One BACKLOG engine item (§ 9), shared with the corpus.

## 7. Implementation File Map

Compiled set (not hand-edits): `Docs/plans/encounters/oath-breaker-rite.package.json` →
`npm run compile:encounter` produces the module (`src/data/encounters/oath-breaker-rite.ts`),
its structural test and both registrations. Run `check:encounter` as well; the dry-run misses
its gates (#1114).

Beyond the compiled set:
- `src/data/content-eval/plotHooks.ts` — stamp `usedBy` for `hook.haunted_relic` and
  `hook.blame_falls_on_outsiders` at closeout (brief).
- No engine, type or art file for this encounter.

Package authoring notes for the compiler lane: omit `reuseNpcRoles` on both cast entries; author
the branch `fallback` as the Heretic arm at 0.62; the Heretic arm carries `deal` and no `nudges`
(like debt-arbitration's Watcher arm); `successMetadata`/`failureMetadata` effects exactly as in
the final packet; do not bind `libraryCardId` on any special (a library Whisper/Compulsion
promises a reveal/compulsion these do not deliver).

## 8. Verdict

**READY WITH CAVEATS.**

1. Pre-fork critical failure renders the chosen arm's `critical_failure` band with hollow chips
   and a step-1 overview (corpus-wide, BACKLOG). Rare at 0.60 for an expert. The packet carries
   the aftermath `fallback` that becomes correct the moment the engine fix lands. Not a pre-task.
2. The Heretic decline arm is priced at expert odds (0.62) under the batch ruling, against the
   catalog's "cheap, legible exit" reading of Opt-in Complication. Recorded, not hidden; the
   batch report should carry one line. Fallback label if read the other way: Personality Fork.
3. The `fallback` step is a copy of the Heretic arm and is unreachable on any live path today.
4. Spawn-only `priest` adds a walk-on hedge-priest beside the town's own (intended).
5. `{location}` in the opening may name a Place (precedent-consistent with the batch).
6. No `libraryCardId` on any special.

## 9. Primitive Disposition

**BACKLOG — pre-fork terminal must not select a forked aftermath arm.** Same item as
debt-arbitration §9; not re-filed here. Spec: in `src/engine/unifiedActionResolution.ts` (call
site near `:2336`), skip `applyAgentDecidedBranches` when the action ends terminally before the
fork step has run, so the choice history holds no key and `resolveAftermathVariant` layers
`fallback`. Test: a two-step `decidedBy` fixture whose step 0 is pinned `critical_failure`
resolves with an empty choice history and renders `fallback.byOutcome.critical_failure`, with no
axis drift for a fork never reached. Cost/benefit: ~1–2 hours to build; not fixing it costs one
hollow page per step-0 critical failure on every forked encounter. Per the process-work throttle
this goes to the impediment log / run report for the weekly retro, not straight to a ticket.

No other missing primitives identified.
