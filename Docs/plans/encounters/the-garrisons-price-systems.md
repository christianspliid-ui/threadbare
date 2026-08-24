# Encounter Pipeline: The Garrison's Price
> Scale: medium | Slug: the-garrisons-price | Pass: systems
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)
> templateId: `encounter.border.the_garrisons_price` | Batch: border-perils (THR-1221), row 6

---

## 0. The one thing this pass exists to verify

Editorial's repair claim is: *step 1 declares `failBehavior: 'fail_action'`, so a step-1
failure resolves the action directly and step 2 never runs; the draft authored every
failure-side write on step 2 only, so `byOutcome.failure` rendered chips backed by writes
the step-1 path can never reach — and `chipBackingViolations` cannot see this, because it
asks whether a band has a backing effect *declared*, not whether that effect's *step* is
reachable.* Editorial's fix: author step 1's own `failureMetadata` with the same three
effects step 2 carries, so every failure-side chip is backed on **every** path that can
render it.

This was traced against source, not taken on the packet's word.

**`advanceStep` (`src/engine/unifiedActionLifecycle.ts:167-211`).** Confirmed: when
`isStepFailure(outcome)` and (`currentStepDef.failBehavior === 'fail_action'` or
`outcome === 'critical_failure'`), the function returns the action `resolved: true` with
`outcome` set to `'failure'`/`'critical_failure'` immediately — the loop never reaches the
"advance to next step" branch. Step 2 is not entered.

**`applyStepOutcomeEffects` is called per-step, before `advanceStep`
(`src/engine/unifiedActionResolution.ts:1855-1860`).** The dispatch order is: resolve the
current step's outcome → `getStepOutcomeMetadata` (picks `successMetadata` or
`failureMetadata` by `isStepSuccess`) → `applyStepOutcomeEffects` (fires the effects,
dispatched through `applyEncounterAftermathReaction` wrapped in a synthetic reaction,
THR-783) → *then* `advanceStep`. **This is the load-bearing fact**: a step's own
`failureMetadata.effects` fire at the moment *that step* resolves, independent of whether
the action then continues or terminates. So step 1's `failureMetadata.effects` DO fire on
the `fail_action` short-circuit path — they are not skipped by the early return, because
they already ran before `advanceStep` was called.

**`chipBackingViolations` → `stepBackingForFace` → `allRunnableSteps`
(`src/data/content-eval/compositionContract.ts:497-518`).** Confirmed exactly as editorial
described: the walk iterates **every** step in `allRunnableSteps(template)` regardless of
`failBehavior`, and asks only `stepWritesReachFace(face, half)` — a question about which
*half* of the ladder (success/failure) the face sits on, never whether the step itself can
be reached given the template's `failBehavior` graph. A chip on `byOutcome.failure` backed
only by step 2's `failureMetadata` would pass this gate even though step 2 never runs on
the direct step-1-fails path. The draft shipped exactly that shape; editorial's fix
(step 1 also carries the three effects) is what makes the gate's pass correct rather than
lucky.

### The reachability table (traced by hand against `computeFinalActionOutcome` and
`advanceStep`, not asserted)

| Band | Steps actually executed | Chip(s) | Backing step + metadata | Reachable? |
|---|---|---|---|---|
| `critical_success` | Step 1 (any non-failure outcome, incl. `critical_success`) **then** Step 2 (must resolve to a non-failure outcome for the action to reach this band at all) | `gp.company_standing`, `gp.quartermaster_bond` | Step 2 `successMetadata.effects` — fires whenever step 2's own outcome is `isStepSuccess` (true for `critical_success`, `success`, `success_at_cost`, `near_miss` alike) | **YES.** Step 2 always runs before this band can be reached (step 1 must have succeeded to advance), and `successMetadata` fires on every step-2 outcome that keeps the run alive. |
| `success` | Step 1 + Step 2, both plain `success` (no cost, no crit on either step — the specific condition `computeFinalActionOutcome` requires for a *plain* `success`) | `gp.quartermaster_bond` | Step 2 `successMetadata.effects` (`bond_change`) | **YES**, same mechanism. |
| `success_at_cost` | Step 1 + Step 2; final band triggers when either step's outcome was `near_miss`/`success_at_cost` (`hasAnyCost` in `computeFinalActionOutcome`) while neither step failed | `gp.company_standing` | Step 2 `successMetadata.effects` (`reputation_with`) — fires regardless of *which* step supplied the cost, because it keys on step 2's own outcome being `isStepSuccess` | **YES.** |
| `failure` | **Two distinct paths reach this band:** (a) Step 1 alone, `failure` outcome, `fail_action` ends the action there; (b) Step 1 succeeds (any success-shaped outcome) → Step 2 runs → Step 2 resolves `failure`, `fail_action` ends the action there | `gp.company_standing_lost`, `gp.quartermaster_cooled`, `gp.the_figure_follows` | Path (a): Step 1 `failureMetadata.effects`. Path (b): Step 2 `failureMetadata.effects`. Both author the identical three effects (`reputation_with -0.06`, `bond_change -0.15`, `plant_compulsion`). | **YES on both paths** — this is the exact defect editorial's fix closes: had step 1 not carried its own `failureMetadata`, path (a) would render the chips with nothing backing them. |
| `critical_failure` | Same two paths as `failure`, substituting `critical_failure` for the terminal step's outcome (critical failure always short-circuits regardless of `failBehavior`, so this band is reachable identically from either step) | Same three chips | Same as `failure` — both steps' `failureMetadata` carry identical effects | **YES on both paths.** |

**The unchipped exhaustion write, checked against the same table.** `condition_attachment`
(`trait.condition.exhausted`) is authored **only** on step 2's `failureMetadata`, so it
fires exclusively on path (b) of `failure`/`critical_failure` — never on path (a), where
the mortal never reached the wall. It correctly carries **no chip**: a chip on that write
would render identically on both paths, falsely claiming the day's labour on the path
where no labour happened. This is the one write in the packet whose reachability is
genuinely conditional, and it is the one write the packet declines to chip. Verified
correct.

---

## 1. Support Bundle Honesty

**`officer` (quartermaster), `supportBundle` key `officer`, `must-persist`,
`lazy-materialize-on-trigger`.** Delivery mechanism traced in
`src/engine/encounterSupportBundle.ts`:

- `findExistingActorSupport` reuses an existing NPC **strictly by location**
  (`getAllActorsAtLocation(state.graph, placementId)`, filtered to
  `actorType === 'individual'` and `npcRole` present in `reuseNpcRoles`). It does **not**
  consult faction membership, `FACTION_ROLE_ROSTERS`, or anything faction-scoped.
- `materializeActorSupport` is the guaranteed fallback: if no reuse candidate is found, it
  unconditionally spawns a new actor node with `name: spec.spawnName`,
  `npcRole: spec.spawnNpcRole`. This path cannot fail to produce an `officer`.

**Two claims in § 18 of the revised packet do not hold up against source, though neither
changes the bundle's honesty:**

1. **"Seeded ... by the `military_order` faction roster (0.7)."** `FACTION_ROLE_ROSTERS`
   (`src/types/npc.ts:348`) is real data — `military_order.quartermaster = 0.7` is
   correctly quoted — but it is consumed **only** by `src/components/CMS/registry.ts`
   (the codex browser). No engine seeding or reuse path reads it; reuse is
   location-scoped only (see above). This roster describes what the codex *displays*
   about the role, not a live reuse mechanism this encounter can lean on. Not load-bearing
   for the audit's verdict — the location-scoped reuse and the guaranteed spawn fallback
   are sufficient on their own — but the packet's own reasoning here is not accurate and
   should not be repeated in the final doc's design rationale without correction.
2. **"The `ruin`, `battlefield` and `camp`/`oasis` subtypes carry no location roster at
   all."** True for `ruin`'s five subtypes (`ruins`, `ruined_tower`, `ruined_city`,
   `ruined_village`, `unexplored_poi` — none is a key in `SUBTYPE_TO_ROSTER_KEY`,
   `src/engine/npcSeeding.ts:49-65`) and for `battlefield`'s one subtype (`battleground`,
   also absent). **False for `camp`**: `camp: 'military_outpost'` in
   `SUBTYPE_TO_ROSTER_KEY`, and the `military_outpost` roster
   (`src/types/npc.ts:268-276`) carries `quartermaster` at chance `0.9` — identical to
   `fort`. Reuse **can** fire at a `camp` opening. Only `oasis` (absent from the map
   entirely) and `wilderness` (mapped, but its roster carries none of
   `quartermaster`/`commander`/`guard_captain`) are genuinely roster-dark within the
   `wayside` class. This is a documentation-accuracy defect in the packet, not a runtime
   one: the conclusion the packet draws from it — `spawnNpcRole` must read at every class
   because reuse cannot be guaranteed everywhere — still holds, it just holds for a
   narrower and differently-shaped set of subtypes (`ruin`'s five, `battleground`,
   `oasis`, `wilderness`) than claimed.

**`{cast:agent}` claimed but never authored.** § 0 and § 18 both assert personalized
address is delivered via `{cast:agent}` ("the quartermaster reads the traveler's name out
of the book... `{cast:agent}` on the attributed line"). Grepped the full packet: this
token appears **only** in those two design-rationale sentences, never inside an actual
`narrativeTemplate`, opening, spine, `bandProse`, `overview`, or chip `detail`. Checked
against `enrichProse` (`src/engine/proseEnrichment.ts:242-260, 647-656`): `{cast:<key>}`
resolves only against keys the template's own `supportBundle` declares — this template
declares exactly one key, `officer`. `{cast:agent}` names no declared key, so had it been
placed anywhere it would silently strip to empty text (the documented behavior for an
undeclared `{cast:*}` token). The live token for "the traveler's own name, supplied by the
engine" is `{actor}` (THR-933 alias of `{name}`), which **is** correctly used in
`gp.the_figure_follows.detail`. Net effect: no defect ships, because the broken token is
never placed in shipped prose — but the packet's own claim about how personalization is
delivered is wrong on the specific mechanism, and the "attributed line at the table" it
describes does not exist in the authored fields. Flag for whoever implements: do not add
`{cast:agent}` anywhere; use `{actor}`.

**Persistence.** `must-persist` is correctly required: two `attachment_grant` effects name
`$cast:officer` as `counterpartyId`, and the `favor_creation` grant names it as
`debtorAgentId`. All three resolve through `SCENE_SENTINEL_FIELDS`
(`src/engine/encounterAftermath.ts:651-665`), which registers `counterpartyId` (THR-1110)
and `debtorAgentId` (THR-1175) as `'agent'` sentinels — both bind `$cast:officer` to the
scene's persistent person. Verified live.

---

## 2. Missing Primitives

**None.** Checked against the live-primitive list (`ActionStepBranch`,
`BranchAwareAftermathConfig`, `encounter_seed`, `hidden_mark`, `intelligence`,
`AuthoredChoiceCard`) and this template's own manifest: no test shaping, flip/reveal
state, task/progress carrier, or prevention/interception/recovery primitive is invoked
that the runtime does not already support. The encounter is linear (`ActionStepBranch` is
correctly absent — confirmed no branch node in the packet), and its one gate (engage vs.
decline) is resolved entirely outside the template by ordinary encounter selection, which
needs no new primitive.

---

## 3. Runtime Feasibility

- **Beat count.** Two steps, both plain (`ActionStep`, no `ActionStepBranch`). Supported —
  `resolveStepDefinition` and `advanceStep` handle a 2-step linear template identically to
  every other shipped 2-step encounter (`one-body-short.ts`, `the-unclaimed-relic.ts` for
  the 1-step case; `flawed-steel.ts` for branching comparison).
- **`failBehavior: 'fail_action'` on both steps.** Confirmed the correct, supported
  setting for "a failed step ends the encounter" — traced above. No engine gap.
- **`carryoverFactorLines`.** `StepCarryoverFactorLine`
  (`src/types/unifiedAction.ts:1750`) is a real, keyed-on-`StepOutcome` field, read by
  `resolveCarryoverLine` (`src/engine/encounters/nudges.ts:401-410`) via
  `step.carryoverFactorLines?.[priorOutcome]`. The packet authors exactly the four bands
  step 2 can actually receive from step 1 (`critical_success`, `success`,
  `success_at_cost`, `near_miss`) and correctly omits `failure`/`critical_failure`, which
  can never reach step 2 under `fail_action`. Verified correct.
- **Outcome ladder.** `UnifiedActionOutcome` has no action-level `near_miss` — confirmed
  in `src/types/unifiedAction.ts:2456-2462` — so the packet's own note that a draft
  `near_miss` row would have been a domain error is correct, and the revised packet
  carries no such row.
- **`isStepSuccess`/`isStepFailure`** (`src/types/unifiedAction.ts:2466-2474`): confirmed
  `isStepSuccess` includes `near_miss`, `success`, `success_at_cost`, `critical_success`;
  `isStepFailure` is exactly `failure`/`critical_failure`. This is the switch the whole
  reachability table above turns on, and it matches the packet's understanding exactly.
- **`SUCCESS_BANDS`** (`compositionContract.ts:80-85`) includes `success_at_cost` at the
  *action* level — confirmed, and distinct from `isStepSuccess`'s step-level inclusion of
  `near_miss`. The packet does not conflate the two; correct.

**Aftermath wirable.** Choice-less `branchOnStep: 0`, bands hung off `fallback`. Confirmed
`applyAftermathOutcomeBand` (`src/types/unifiedAction.ts:1930-1944`) does a field-by-field
`??` substitution — a band that declares `reactions` fully replaces the fallback's
`reactions` array (not a union), matching the packet's "wholesale" characterization. The
`failure` and `critical_failure` bands each declare their own two-reaction pairs, correctly
overriding `R1`/`R2`, which would otherwise be dishonest on those bands ("let the road hear
it" when nothing was paid).

---

## 4. Aftermath Supportability

**Consequence draw, re-derived, not trusted.**

```
$ npm run draw:consequences -- encounter.border.the_garrisons_price --reach gold --rarity 2

  template  encounter.border.the_garrisons_price  (not in the live catalog)
  reach     gold  (from --reach)
  rarity    2  (from --rarity)
  hand      2 of 2 drawn

  ▸ relationship   [weight 4 in gold]
      wire one of: bond_change

  ▸ thread   [weight 2 in gold]
      wire one of: thread_strengthen, thread_weaken, thread_break, thread_branch
```

Gate re-derives `['relationship', 'thread']` from the template id, reach and rarity —
exactly the pre-swap hand the packet claims. `consequenceSwap: { from: 'thread', to:
'drive' }` checked against `checkConsequenceDraw`
(`src/data/content-eval/consequenceDraw.ts:348-397`):

- `swap.from` (`'thread'`) is in the drawn hand — ✓ (confirmed above).
- `swap.to` (`'drive'`) is **not** in the drawn hand — ✓ (a swap that traded into an
  already-drawn family would shrink the hand rather than vary it; `drive` is not drawn).
- `isConsequenceFamily('drive')` — ✓, `drive` is a member of the 15-family
  `ConsequenceFamily` union (`consequenceDraw.ts:74-93`).
- `CONSEQUENCE_FAMILY_WEIGHTS.drive.gold = 4` (`consequenceDraw.ts:145`) — ✓, clears
  `CONSEQUENCE_SWAP_MIN_WEIGHT = 2` with headroom.
- `swap.reason` is a non-empty, mechanism-naming string — ✓.

All five `checkConsequenceDraw` swap checks pass. **`drive` wiring, checked against
`CONSEQUENCE_FAMILY_EFFECT_KINDS`** (`consequenceDraw.ts:190`): `drive: ['assign_ambition',
'plant_compulsion']` — `plant_compulsion` is what the packet wires, on both steps'
`failureMetadata`, and it is a `drive`-family member. ✓.

**`allAftermathEffects`, checked against its own implementation**
(`compositionContract.ts:337-353`): walks `variant.reactions`, every `band.reactions`
inside `variant.byOutcome`, and both steps' `successMetadata.effects` /
`failureMetadata.effects` (via `plainSteps`). It does **not** iterate card `grants`
anywhere in this function — confirmed by reading the full body, there is no code path that
touches a `NudgeCardInstance.grants` field. The packet's claim that `favor_creation`
(Favor card grant) and `intelligence` (Side-bet card grant) are invisible to this walk,
and therefore cannot be what the Rewards-block quota rests on, is correct. The packet
correctly rests its `rewards` connection on `bond_change` (step metadata,
`PERSISTENT_EFFECT_KINDS`) instead.

**`PERSISTENT_EFFECT_KINDS`** (`compositionContract.ts:114-137`): `bond_change` and
`favor_creation` both present. **`CHIP_BACKING_EFFECT_KINDS`**
(`compositionContract.ts:199-227`): `plant_compulsion` present (confirmed, with its own
doc comment explaining exactly why it was added — matches the packet's framing). Both
checked directly against source, not inferred from the packet's own tables.

**`reputation_with` / `REPUTATION_WITH_MAX_DELTA_PER_OUTCOME`.** Confirmed
`= 0.15` (`src/engine/reputation.ts:66`). Every authored delta in this packet (−0.06,
+0.10, −0.08, +0.06, +0.05, +0.10 across the reactions) is inside that bound. Confirmed
`applyFactionReputationGain` no-ops with `reason: 'not_a_member'`
(`src/engine/factionReputation.ts:58`) for a non-member — matches the packet's stated
reasoning for using `reputation_with` over `faction_reputation_gain`.

**Agreement / condition / faction ids — all checked against their defining tables, not
the packet's citation:**

| Id | Table | Line | Status |
|---|---|---|---|
| `agreement.debt.minor` | `AGREEMENT_REWARD_TEMPLATES` | `agreement-reward-catalog.ts:37` | ✅ live, line matches packet |
| `agreement.favour.earned` | `AGREEMENT_REWARD_TEMPLATES` | `agreement-reward-catalog.ts:49` | ✅ live |
| `trait.condition.exhausted` | `CONDITION_TRAIT_DEFINITIONS` | `condition-trait-content.ts:223` | ✅ live, line matches packet |
| `mercenary_company` | `FACTION_DEFINITIONS` (via `MERCENARY_COMPANY_DEFINITION`) | `mercenary-company-definition.ts:35` | ✅ live, line matches packet, `factionType: 'military'` |
| `trait.core.core_hope.vice` | `core-trait-content.ts` FLAVOR table | `core-trait-content.ts:50-52` | ✅ live — vice flavor is **verbatim** *"Reads each good turn as the bait before the trap."*, matching the packet's quote exactly |
| `debtorAgentId` sentinel (`favor_creation`) | `SCENE_SENTINEL_FIELDS` | `encounterAftermath.ts:659-665` | ✅ registered `'agent'`, THR-1175 comment matches packet's citation verbatim |
| `military_position` (intelligence category) | `INTELLIGENCE_CATEGORIES` | `intelligence.ts:60,71,247` | ✅ live |

---

## 5. New Hooks Needed

**None.** No new roles, sublocation types, state fields, or content-table entries. The
`officer` support-bundle key, `mercenary_company` faction, and all agreement/condition ids
are pre-existing. `spawnNpcRole: 'quartermaster'` and `reuseNpcRoles: ['quartermaster',
'commander', 'guard_captain']` are all pre-existing `NpcRole` members
(`src/types/npc.ts`), so no roster or role vocabulary addition is required — the § 1
finding above only corrects *which* rosters actually gate reuse, not whether the roles
themselves exist.

---

## 6. The hand — card and image verification

**All 6 distinct `libraryCardId`s verified live and their `title`/`quote` checked
character-for-character against `CARD_CONTENT`** (`src/data/nudge-card-library.ts`):

| `libraryCardId` | Source line | Packet's `name`/`fiction` | Verbatim match |
|---|---|---|---|
| `card.boost.core` | 557 | "A Little More" / "Most things fail by a margin." | ✅ |
| `card.favor.signature.order` | 583 | "The Ledger Opens" / "Order is only debt everyone agreed to honor." | ✅ |
| `card.bargain.signature.entropy` | 631 | "Pay It Elsewhere" / "Nothing is free. Some prices are only slower." | ✅ |
| `card.gambit.signature.chaos` | 575 | "No Middle Ground" / "Chaos has no use for the adequate." | ✅ |
| `card.heavy_hand.signature.force` | 603 | "Full Weight" / "Subtlety is a choice. This is not it." | ✅ |
| `card.boost.signature.energy` | 611 | "A Sudden Surge" / "Bodies hold more than they admit." | ✅ |

`card.favor.hunger.bind` (mentioned in prose as the second existing Favor member, not
dealt) also checked: "A Debt Written" / "Every civilization runs on who owes whom." — ✅
verbatim.

**`side_bet` has zero `NUDGE_CARD_LIBRARY` members** — confirmed: `'side_bet'` appears as
a type-id string (`nudge-card-library.ts:47,128`) but never as a `card.side_bet.*` key in
the assembled library. The one-off is forced, not chosen, as claimed.

**`imageTag`s — all 7 confirmed present in `ENCOUNTER_IMAGE_LIBRARY`**
(`src/data/encounter-image-library.ts`): `generic.focus`, `generic.oath`, `generic.decay`,
`generic.luck`, `generic.strength`, `generic.matter`, `generic.energy` — one hit each,
verified by grep against source rather than the packet's table.

**Card-type authoring vs. dealing — a distinction worth naming for the implementer.**
`buildNudgeHand` (`src/engine/encounters/nudges.ts:245-329`) splits the *authored* hand
into `playable` / `dimmed` / `hidden`. `requiredTrait`, `requiresGroup`, and
`requiresFavor` **hide** a card outright (not merely dim it); sphere-lock, unlock-missing
and essence-unavailable **dim** it (still shown, not playable).

- **Step 1 (6 authored):** none of the six cards declares `requiredTrait`,
  `requiresGroup`, or `requiresFavor` — checked against the hand table in § 12 of the
  revised packet. **Dealt (visible) count: 6 of 6**, every run, regardless of essence or
  sphere state (essence/sphere gates only dim, never hide).
- **Step 2 (5 authored):** card 4, the Favor *call*, declares `requiresFavor: true`. It
  hides whenever `context.hasCallableFavor` is false — i.e., on the majority of runs,
  where the step-1 Favor card was not played or its `owes_favor` edge has since expired.
  **Dealt count: 4 of 5** on a run with no callable favor, **5 of 5** on a run where the
  favor is live. Both figures sit inside the pipeline's 4–6 dealt band named in this
  pass's brief.

---

## 7. `?spawn=` debug-tool exposure

Checked `prepareDebugEncounterSpawn` (`src/engine/debugEncounterTools.ts:368-458`):
`createUnifiedAction` is always called with `targetId: locationId` (the agent's own
location) — confirmed at the call site (`...targetId: locationId,` inside the
`createUnifiedAction` params block). `$target` and `{target}` are known not to fail
closed on this tool: they resolve to the location and render, whether or not that
reference is fictionally correct for the template.

**This encounter is not affected.** Grepped the full revised packet for `$target` and
`{target}`: the only two hits are inside prose *discussing* the engine finding about
`thread_*` effects (which take literal `mortalId`, not a sentinel) — neither is an authored
field in this template. Every actor-facing effect in this packet targets `$actor`
(defaults to `action.actorId`) or `$cast:officer` (resolves through `supportBindings`, a
path independent of `action.targetId` entirely). Every faction-facing effect targets
`targetFactionId: 'mercenary_company'` — a literal def id, rewritten by
`bindFactionDefinitionIds`, again independent of `action.targetId`. A reviewer following a
`?spawn=encounter.border.the_garrisons_price` link would see chips and sentences that are
all correctly bound; nothing renders wrongly because nothing in this packet reads the
debug tool's `targetId`/`$target` surface.

---

## 8. Implementation File Map

**New file:**
- `src/data/encounters/the-garrisons-price.ts` — the template itself (following the
  shape of `src/data/encounters/one-body-short.ts` / `the-unclaimed-relic.ts` for a
  linear, settings-envelope, support-bundle-carrying template; NOT `flawed-steel.ts`,
  which is the branching exemplar and is the wrong shape reference for this encounter).

**Modified:**
- `src/data/unified-action-templates.ts`:
  - Import added near line 193, alongside the other `./encounters/*` imports (pattern:
    `import { THE_GARRISONS_PRICE_TEMPLATE } from './encounters/the-garrisons-price';`).
  - Added to `RAW_UNIFIED_ACTION_TEMPLATES` (the array beginning at line 5464, entries
    around line 5590 in the current file).
  - Added to `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (array beginning at line 5660,
    entries around line 5670-5690). **Despite the array's name, this is required**: its
    own doc comment states membership is "templates [that] have `locationSubtypes` and
    belong in the encounter cache" — not branching specifically. This template declares
    `locationSubtypes` via `expandSettings`, so it needs the cache registration this array
    feeds, independent of being linear.
- `src/data/content-eval/plotHooks.ts` — stamp `usedBy` on `hook.impossible_bargain`
  (closeout action per § 0d of the revised packet).

**Tests (per `testing-patterns` skill, cross-boundary conventions):**
- A template-shape unit test (mirrors existing per-encounter test files under
  `src/data/encounters/__tests__/`) is standard practice for shipped encounters in this
  corpus but is not authored by this pass — flagged for the implementer, not a gap in this
  audit.

**Not required:** no engine file changes, no new type additions, no new `NpcRole`,
sublocation type, or effect kind. Everything this template needs is already live.

---

## 9. Self-audit against the Composition Contract — verified block by block

| Block | Verdict | Independent verification |
|---|---|---|
| **Steps** | ✅ PASS | 2 plain `ActionStep`s, confirmed no `ActionStepBranch` present. |
| **Hand** | ✅ PASS | 6 and 5 cards, both inside `[NUDGE_HAND_MIN=4, NUDGE_HAND_MAX=8]`. Arithmetic re-summed by hand: step 1 Δ = 0.06+0.10+0.12+0.03+0.16+0.07 = **0.54** ✓; step 2 Δ = 0.08+0.15+0.12+0.10+0.08 = **0.53** ✓. Both ≤ `NUDGE_HAND_MAX_TOTAL_DELTA=0.70`. `difficulty+hand`: 0.40+0.54=0.94, 0.38+0.53=0.91 — both inside [0,1]. |
| **Setting** | ✅ PASS | `settings: ['stronghold','ruin','wayside','battlefield']`, all four members of `SETTING_CLASSES` (`settingClasses.ts:34-39`); `locationSubtypes` derived via `expandSettings`, confirmed the function exists and is used identically elsewhere in the corpus. |
| **Cast** | ✅ PASS with 2 documentation corrections (§ 1 above) | Reuse and spawn paths both confirmed live; the officer resolves at every one of the four classes either way. |
| **Rewards** | ✅ PASS | `bond_change` and `favor_creation` both confirmed `PERSISTENT_EFFECT_KINDS`. |
| **Aftermath** | ✅ PASS | 5 `byOutcome` bands ≥ `COMPOSITION_BYOUTCOME_MIN_BANDS=3`; every chip's `concepts` non-empty with `entityId` or `tooltipId` (checked all 5 by hand — see below). |
| **Systems** | ✅ PASS | 5 connections ≥ `COMPOSITION_SYSTEMS_QUOTA_MIN=3`. |
| **Images** | ✅ PASS | All 7 `imageTag`s confirmed live rows. |
| **Consequence draw** | ✅ PASS | Independently re-derived via `draw:consequences`; swap validated against all 5 of `checkConsequenceDraw`'s own checks. |
| **Law 56 (chip backing)** | ✅ PASS, verified by hand-tracing the reachability table in § 0 | This is the one claim worth the most scrutiny in the whole packet, and it holds. |
| **Forecast arithmetic** | ✅ PASS | Re-summed independently, matches packet's own numbers. |
| **`?spawn=` exposure** | ✅ Not applicable to this encounter | No `$target`/`{target}` authored anywhere. |

**`concepts` non-empty, checked per chip:**
- `gp.company_standing` → `[{ text: 'standing', tooltipId: 'ui.standing' }]` — ✓ tooltipId present, `ui.standing` confirmed a real key in `src/data/ui-content.ts:351`.
- `gp.quartermaster_bond` → `tooltipId: 'ui.standing'` — ✓.
- `gp.company_standing_lost` → `tooltipId: 'ui.standing'` — ✓.
- `gp.quartermaster_cooled` → `tooltipId: 'ui.standing'` — ✓.
- `gp.the_figure_follows` → `entityId: '$actor', visualKind: 'agent'` — ✓ entityId present, `visualKind: 'agent'` a legal member per the anchor catalog (`anchor-catalog.generated.md:28,62-68`).

**Anchors, checked against `anchor-catalog.generated.md`:** `visualKind: 'faction'`
(`$faction:mercenary_company`) and `visualKind: 'agent'` (`$cast:officer`, `$actor`) both
confirmed legal, linked anchor kinds (lines 64, 62-68 of the catalog).

---

## 10. Findings to carry forward (none block this encounter)

**F1 (carried from the revised packet, re-verified).** `thread_*` effects cannot bind
`ascendantId`/`mortalId` — confirmed neither field is in `SCENE_SENTINEL_FIELDS`. This
encounter does not depend on the fix; the consequence swap discharges it entirely for this
packet. Filed as an engine finding elsewhere, not repeated as a blocker here.

**F2 (carried).** `side_bet` and the Favor *call* variant have zero library members —
confirmed by grep. Legal, recorded one-offs.

**F3 (new, this pass).** The support-bundle rationale in revised § 18 cites a dead
faction-roster reuse path (`FACTION_ROLE_ROSTERS` is CMS-display-only, not consumed by
`npcSeeding.ts` or `encounterSupportBundle.ts`) and mis-groups `camp` with `oasis` as
roster-dark when `camp` in fact shares `fort`'s `military_outpost` roster
(`quartermaster` at 0.9). Recommend correcting the prose in the shipped template's
comments/docs if this rationale is carried into the implementation file — the encounter's
mechanics are unaffected either way, since the guaranteed spawn fallback covers every
class regardless of which rosters are live.

**F4 (new, this pass).** `{cast:agent}` is asserted twice as the delivery mechanism for
personalized address but is never placed in any authored field. Not a shipped defect (the
token never appears where it would strip silently), but the implementer should not add it
under the assumption it is already wired — use `{actor}`, the token that is actually
live and actually used (`gp.the_figure_follows.detail`).

---

## 11. Verdict

**READY FOR IMPLEMENTATION**

Every primitive this encounter depends on is live and was checked against source, not
against the packet's own citations. The one substantive repair claim this pass exists to
verify — that step 1's own `failureMetadata` closes the Law 56 backing hole on the
`fail_action` short-circuit path — traces correctly against `advanceStep`,
`applyStepOutcomeEffects`'s call order, and `chipBackingViolations`'s blind spot. The two
documentation-accuracy findings (F3, F4) affect design-rationale prose only; neither
changes what the template must contain to be correct, and neither is a missing primitive.

## 12. Primitive Disposition

No missing primitives identified.
