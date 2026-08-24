# Encounter Pipeline: The Sign Over the Ruin
> Scale: medium (2 steps, 0 branches) | Slug: `the-sign-over-the-ruin` | Pass: systems
> templateId: `encounter.border.the_sign_over_the_ruin` · Batch: border-perils (THR-1221), row **2 of 6**
> Date: 2026-08-24 | Pipeline version: 2.0

**Audited against:** `Docs/plans/encounters/the-sign-over-the-ruin-revised.md` (primary input),
`the-sign-over-the-ruin-editorial.md` (context), `border-perils-batch-design.md` § *2 · The Sign
Over the Ruin*, `src/data/content-eval/compositionContract.ts` (the gate this must pass).

**Verification method.** Every declared id, field name, gate constant and mechanism below was
checked against live source, not against the packet's own claims — per the honesty standard, the
draft's factual claims (three of them, per editorial) did not all survive checking, so this pass
inherited nothing. Line references are current as of this audit.

**Coordination note.** The orchestrator relayed an independent finding from encounter 3's
(`the-unclaimed-relic`) systems critic on the `under_watch` question, arrived at from the other
end of the same grep. This pass had already run the same check independently (see § 1) before
that message arrived; the two converge exactly, and one additional player-visibility fact
(`LocationProfileModal.tsx:91–111` renders the condition with its remaining term) is folded in
below. The ruling that follows is adopted batch-wide, as the orchestrator directed.

---

## 1. The `under_watch` finding, run down and ruled on

**Independently verified: there is no reader.**

```
$ grep -rn "under_watch" src/ --include="*.ts" | grep -v __tests__
src/data/condition-trait-content.ts:323   (the definition)
src/data/condition-trait-content.ts:368   (a comment referencing it, for a different condition)
src/data/condition-trait-content.ts:414   (its duration-map entry)
src/data/condition-trait-content.ts:446   (comment: "deliberately carries no tax")
```

- `LOCATION_CONDITION_MOVEMENT_TAX` (`src/data/condition-trait-content.ts:434-446`) **deliberately
  excludes it** — the comment says so in terms: *"`under_watch` deliberately carries no tax: being
  observed changes what you can do in a place, not how long it takes to walk in. Its reader is the
  gate."*
- **The gate never materialised.** A corpus-wide grep for `requiredTargetTraits` gating on any
  `trait.condition.location.*` id returns nothing. The one precedent that could have been cited —
  `slice.kin.the_roof_opens` gating on `trait.condition.location.standing_welcome` — was itself
  retired by THR-1206 (reputation unification) and the file's own comment records **zero writers**
  on that condition today.
- It **is** player-visible by a different route than "gates something": `LocationProfileModal.tsx`
  renders active location conditions with their remaining term off the same `has_trait` edge every
  condition uses (confirmed by the orchestrator's relay; not independently re-read line-by-line in
  this pass, and not load-bearing for the ruling below — visibility of the *fact* is not the same
  question as the game *acting* on it).

The honest characterisation, matching the editorial pass's finding exactly: **state changes, the
player can read it on the location's own sheet, and no system acts on it.**

### The ruling

The write is real. `condition_attachment` is in `CHIP_BACKING_EFFECT_KINDS`
(`compositionContract.ts:213` — folded into the persistent set alongside `apply_condition` /
`remove_condition`), so Law 56 rule 0 ("did a write fire") is satisfied and this is **not** a
missing-backing violation.

But the packet's `critical_success` chip (`sign.the_place_is_watched`, § 9.3) declares
`category: 'path'`, `direction: 'opens'`. `EncounterAftermathCategory`'s own doc comment
(`src/types/unifiedAction.ts:242-264`) states the bar for that category in almost the exact words
the orchestrator relayed, and names this packet's precise failure shape as the canonical example:

> *"`path` was the category that invited the breach, because a way opening reads as atmosphere:
> the Unsafe Bridge shipped `PATH · THE RIVER CROSSING` on a band whose only reaction had
> `effects: []`... A `path` is a route learned (an `intelligence` record), an offer that will come
> round again (an `encounter_seed`), or a door a later system can open — **never the sentence
> alone.**"*

`under_watch`'s write is real, but it is not a route learned, not a follow-on offer, and not a door
any later system opens — nothing reads it. A `PATH` chip on it would be exactly the Unsafe Bridge
shape wearing a real write as a disguise: correct about the write firing, wrong about what kind of
claim `PATH` makes. `SCAR`/`BOON`/`BOND` make a factual claim about state (something happened to
someone/someplace); `PATH` makes a forward-looking claim about mechanical consequence. Only the
first kind of claim is true here.

**Verdict: re-categorise, not fold.** Folding would cost the batch its stated location-anchor
target for this row (`border-perils-batch-design.md`: *"location/sublocation anchor #1 of 2 — a
chip anchors the ruin itself, not a person"*), and folding is the wrong remedy anyway — the write
is real and durable (a duration edge, `visibility: 'discoverable'`), so there is a true, inspectable
consequence to report. The defect is the category, not the chip's existence.

**Precedent, found independently rather than assumed.** `the-unclaimed-relic-revised.md` §
*(the `success` band, `relic.success.watched_ground`)* authors the **identical write**
(`condition_attachment` on `trait.condition.location.under_watch`, `targetLocationId: '$target'`)
and categorises it `scar` · `loss` · `loss` — already the correct call, arrived at independently in
that packet. This pass adopts the same category for the same reason, rather than inventing a
different resolution for an identical write.

**Applied in the final doc (§ 9.3, `critical_success` band):**

| Field | Revised (wrong) | Final (this pass) |
|---|---|---|
| `category` | `'path'` | `'scar'` |
| `direction` | `'opens'` | `'loss'` |
| `polarity` | `'info'` | `'loss'` |

No prose changed — `stateNoun.text: 'a watched place'` and the `detail`/`causeClause` sentences
read exactly as correctly under `SCAR` as they were misclassified under `PATH`; the rule-0c check
in the revised file ("the `stateNoun` names the mechanic ... the fiction comes last") holds
unchanged. The italicised "Systems-pass gate" callout in the revised file's § 9.3 is superseded by
this ruling — see the final doc for its replacement.

**Correction to a claim made about this same write in § 9.4.** `familiesWiredByEffects`
(`consequenceDraw.ts:307-329`) special-cases exactly this shape: *"A condition on a place is a
`place` consequence, not a `condition` one"* — a `condition_attachment` carrying a non-empty
`targetLocationId` is excluded from the `condition` family and counted toward `place` instead. So
§ 9.4's table, which lists the `under_watch` write as the *"second carrier"* satisfying the drawn
`condition` family, is not what `check:encounter` will actually compute: the drawn `condition`
family is satisfied solely by the `terrified` write (agent-targeted, not `onAPlace`); the
`under_watch` write wires the **undrawn** `place` family instead, which is harmless (the gate only
requires every *drawn* family to be wired — an extra wired family is not a violation
(`checkConsequenceDraw`, `consequenceDraw.ts:388-407` only iterates `expected`)) but the packet's
stated reason is wrong. Corrected in the final doc's § 9.4; the recorded `consequenceDraw` and the
"no swap taken" conclusion are both still correct, just for a narrower reason than stated.

**Batch-wide note.** The orchestrator directed this ruling be applied batch-wide, and it already
has been in encounter 3's own packet (arrived at independently there, and unedited by this pass per
scope). One correction is owed back to that packet, out of scope to fix here: `the-unclaimed-relic-revised.md`
line ~671 states *"The condition has real readers, so this is a state change the simulation acts
on"* — that sentence is factually wrong by this pass's independent verification (no reader exists
anywhere in the corpus). It does not change that packet's verdict (its category, `SCAR`, is already
correct — the ruling above is what makes it correct, not the false "real readers" claim), but the
stated *reason* should be corrected before that packet's own Pass 3 closes, or the next author who
reads it inherits the wrong justification for a right answer.

---

## 2. Support Bundle Honesty

| Support object | Delivery mode | Realistic? | Persistence | Verdict |
|---|---|---|---|---|
| `witness` (pilgrim) | `lazy-materialize-on-trigger`, `must-persist` | Yes — real field values (`src/types/encounter.ts:201,204`) | `must-persist` on a `lazy-materialize-on-trigger` spec spawns a real durable actor node when reuse fails (`encounterSupportBundle.ts:166-198`); this is not the `withDefaultSupportBundle` bind-only default shape (`castTargetViolations`' failure mode, `compositionContract.ts:781-788`), so `$cast:witness` always resolves | ✅ sound |
| Reward-pool draw | `successMetadata.rewardPool`, no `tagFilters` | Yes | resolves through the attachment library at commit | ✅ sound |
| Cultural omen | `emit_omen` grant + reaction | Yes | scene-to-world, correctly never chip-backed (`emit_omen` is deliberately absent from `CHIP_BACKING_EFFECT_KINDS`) | ✅ sound |
| Clue edge | `spawn_clue` → `findAnyRuinId` | Fail-soft by design, correctly unchipped | see § 4 | ✅ sound, honestly scoped |

**Cast-roster claim, checked against `LOCATION_ROLE_ROSTERS` (`src/types/npc.ts:214-344`) and
`SETTING_CLASS_MAP` (`src/data/settingClasses.ts:60-65`):**

- `stronghold → ['castle', 'fort']`, `ruin → ['ruins', 'ruined_tower', 'ruined_city',
  'ruined_village', 'unexplored_poi']`, `wayside → ['camp', 'oasis', 'wilderness']`,
  `battlefield → ['battleground']`. Confirmed exactly as declared.
- `wilderness`'s roster is `hermit, ranger, wanderer, hunter, hexer, pilgrim` — confirmed, includes
  all three `reuseNpcRoles` (`pilgrim`, `wanderer`, `hermit`).
- `ruins`, `ruined_tower`, `ruined_city`, `ruined_village`, `unexplored_poi`, `battleground` have
  **no entry** in `LOCATION_ROLE_ROSTERS` at all — confirmed, matches the packet's claim.
- `castle`'s roster is `noble, marshal, guard_captain, guard, steward, herald, spy, attendant` —
  confirmed, matches the packet's characterisation ("a garrison establishment ... placeless on a
  wayside or a battlefield").
- **One imprecision, harmless.** `camp` and `oasis` — the other two `wayside` subtypes alongside
  `wilderness` — also have **no** roster entry. The packet's § 8 reads *"reuse fires at wayside"*
  as if true of the whole class; it is only true at the `wilderness` subtype specifically. This
  does not break anything: `findExistingActorSupport` (`encounterSupportBundle.ts:141-161`) simply
  finds no matching live actor at `camp`/`oasis` and falls through to `materializeActorSupport`
  (spawn), which reads exactly as correctly ("a pilgrim who was camped when it happened") as reuse
  would have. Worth a one-line correction in the final doc's § 8 prose, not a blocker.

---

## 3. Every effect kind, verified against `src/types/unifiedAction.ts`

| Effect kind | Field names the packet uses | Live? | Notes |
|---|---|---|---|
| `condition_attachment` | `templateId`, `targetAgentId`, `targetLocationId` | ✅ (`:640-655`) | `targetLocationId` is the THR-1143 place surface; both fields real |
| `agent_relocation` | `targetAgentId`, `destination: { kind: 'nearest_settlement' \| 'away', minHexDistance }`, `mode: 'travel'` | ✅ (`:1280-1303`, `movement.ts:76-82`) | `RelocationDestination` union confirmed to carry both members exactly as spelled; chip-backable since THR-1221's `agent_relocation` addition to `CHIP_BACKING_EFFECT_KINDS` (`compositionContract.ts:224-225`) — packet correctly does not "work around" the former absence |
| `spawn_clue` | `source: 'encounter_outcome'`, `precision: 'vague'`, `targetRuinId: '$nearest_ruin'` | ✅ (`:983-994`) | see § 4 |
| `emit_omen` | `category`, `intensity`, `scope`, `sphereAlignment`, `narrativeHook` | ✅ (`:737-748`) | correctly never chip-backed (absent from `CHIP_BACKING_EFFECT_KINDS`; the module comment names `emit_omen` explicitly as the one deliberately-excluded kind) — the packet chips nothing off A3's grant or the third reaction, confirmed |

No effect kind, field name, or literal enum value in the packet is invented or stale.

---

## 4. `spawn_clue` — confirmed unchipped for the right reason

`findAnyRuinId` (`src/engine/ruins/clueLifecycle.ts:555-566`) reads exactly as the packet describes:
filters every `location` node for a numeric `ruinMagnitude`, returns `null` on an empty result, and
otherwise a uniformly-random pick (weighted only by array order absent an `rng`, uniform with one).
Confirmed:

- Returns `null` when the world holds no ruin — matches the packet's fail-soft claim exactly.
- The picked ruin is unrelated to the encounter's own broken structure — confirmed, there is no
  binding between the encounter's location and the ruin `spawn_clue` names.
- **`knowledge` family credit is unaffected by the null case.** `CONSEQUENCE_FAMILY_EFFECT_KINDS.knowledge
  = ['intelligence', 'spawn_clue']` (`consequenceDraw.ts:186`) and `familiesWiredByEffects` counts
  an effect toward its family by `kind` alone — it does not (and cannot) inspect whether
  `findAnyRuinId` will resolve at runtime, because the gate is authoring-time and pure. So `knowledge`
  is satisfied whether or not the write lands in any given playthrough, exactly as every other
  presence-only consequence-draw check works. The packet's own claim ("the effect still counts
  toward the `knowledge` consequence family even unchipped") is correct.

---

## 5. `libraryCardId`s — nine unique ids, all live, faces verified verbatim

Checked against `NUDGE_CARD_LIBRARY` (`src/data/nudge-card-library.ts`) and `CARD_CONTENT`
(`:555-712`):

| `libraryCardId` | Member present | `title`/`quote` match packet's `name`/`fiction` |
|---|---|---|
| `card.boost.core` | ✅ | "A Little More" / "Most things fail by a margin." ✅ |
| `card.whisper.signature.light` | ✅ | "Plain Sight" / "Nothing was hidden. It was only unlit." ✅ |
| `card.omen.signature.time` | ✅ | "This Has Happened" / "Nothing happens only once." ✅ |
| `card.veil.attunement.darkness` | ✅ (`:502-506`, threshold **20**) | "Nothing To Find" / "A practiced hand leaves less than a careful one." ✅ |
| `card.boost.signature.energy` | ✅ | "A Sudden Surge" / "Bodies hold more than they admit." ✅ |
| `card.mercy.core` | ✅ | "Not The Worst" / "Failing is survivable. Some failures are not." ✅ |
| `card.whisper.attunement.light` | ✅ (`:508-512`, threshold **60**) | "The Whole Shape" / "Long looking shows what one glance cannot." ✅ |
| `card.veil.signature.darkness` | ✅ | "No One Saw" / "The kindest help leaves no fingerprints." ✅ |
| `card.trait_card.core` | ✅ | "Who They Are" / "Character is the one resource nobody spends." ✅ |

**Post-swap thresholds independently confirmed:** `card.veil.attunement.darkness` unlocks at 20
lifetime essence through darkness; `card.whisper.attunement.light` unlocks at 60 through light —
exactly as the editorial pass's swap rationale states. Hand A now deals the deeper (20-threshold)
Veil member; Hand B deals the shallower (starting) one — confirmed against source, not re-derived.

No dead ids, no misquoted faces.

---

## 6. Card gating and the dealt-hand floor — recomputed from the actual runtime filter, not re-derived from the packet's own framing

The packet's (and editorial's) arithmetic lands on the right answer but names the wrong mechanism,
and it is worth being precise here because the next author will copy this packet's reasoning.
Traced through `buildNudgeHand` (`src/engine/encounters/nudges.ts:245-334`):

**Only three gate kinds *hide* a card** (it never reaches the player):
`requiredTrait` unmet (`:277-282`), `requiresGroup` unmet (`:286-290`), `requiresFavor` unmet
(`:292-296`). Every other block — `requiredUnlock` missing, sphere not held (`accessibleSpheres`),
the repertoire gate (sphere-attunement threshold not met), essence unavailable — **dims** the card
(`:298-330`): the code comment states the reasoning explicitly, *"Every other block reason dims, so
the player can see the price of the option."* A dimmed card is still part of the "dealt" hand the
authoring doctrine describes (nudge-authoring-spec.md:524: *"gated cards (trait, group, favor) hide
when unmet, so the dealt hand lands at the 4–6..."* — the parenthetical names exactly the three hide
kinds, not sphere/essence gates).

Applying that to both hands:

- **Hand A (5 cards).** None carry `requiredTrait`/`requiresGroup`/`requiresFavor`. **Zero cards can
  ever hide.** Dealt size is a constant **5**, for every god, regardless of which spheres they hold
  — A4's attunement threshold only ever dims it, never hides it. This is a tighter and more useful
  floor than the packet's own "the ungated floor is four" framing (which was counting *playable*
  cards for a specific low-access god, not the *dealt/visible* hand).
- **Hand B (6 cards).** Only B6 (`requiredTrait: 'trait.core.core_humility.virtue'`) can hide. Dealt
  size is **5** for a non-Humble agent, **6** for a Humble one. B2's attunement threshold (60,
  post-swap) dims, never hides.

**Both hands sit inside the 4–6 dealt-size doctrine on every run, by construction — not merely for
a "mid-game god" but for every god at every essence level and every sphere pairing.** The packet's
conclusion ("the ungated floor is now four in both hands") is not wrong as a lower bound on
*playable* cards for an unlucky god, but it is not the *dealt-hand* claim the doctrine is actually
making, and the true dealt-hand floor here is a full point higher (5, not 4) because sphere/essence
gates never hide anything in this game. Recorded here so the next packet does not repeat the
conflation.

---

## 7. `imageTag`s — eight unique tags, all resolve to a live `ENCOUNTER_IMAGE_LIBRARY` row

Checked against `NUDGE_CONCEPT_ART` (`src/data/encounter-image-library.ts:628-643`) and
`SITUATIONAL_NUDGE_ART` (`:675-690`):

| Tag | Row found | Genericity claim checked |
|---|---|---|
| `generic.focus` | ✅ mind/focus | matches |
| `generic.light` | ✅ light/illumination | matches |
| `generic.time-slow` | ✅ time/time | matches |
| `generic.dark` | ✅ darkness/concealment | matches; B4 sharing A4's row is documented, not silent |
| `generic.energy` | ✅ energy/energy | matches |
| `generic.mercy` | ✅ situational/appeal (`SITUATIONAL_NUDGE_ART`) | matches |
| `generic.crowd` | ✅ situational/witness (`SITUATIONAL_NUDGE_ART`) | matches |
| `generic.oath` | ✅ order/oath | matches |

No dead tags, no silent category-generic fallbacks.

---

## 8. `$target` binding for `targetLocationId` — the batch's open Pass-3 question, resolved

**Independently confirmed, by a second code path from the one the orchestrator's relay cited.**

`generateUnifiedCandidates` (`src/engine/unifiedCandidates.ts:39-172`) is the candidate builder that
filters `UNIFIED_ACTION_TEMPLATES` by `template.locationSubtypes` against the current location's
subtype (`:141-145`) — exactly the filter `encounter.border.the_sign_over_the_ruin`'s
`locationSubtypes: expandSettings([...])` declaration is gated on. Every candidate this function
produces sets:

```ts
// unifiedCandidates.ts:169-175
candidates.push({
  templateId: template.id,
  targetId: locationId,   // "Create candidate — target is always the location"
  domain: template.reach,
  score: bonus,
  motivations: template.motivations,
});
```

The comment above the push is explicit: *"Create candidate — target is always the location (Social
targeting for encounter-derived templates is deferred to Sprint 5)."* So `action.targetId` resolves
to the location node for this template family by construction, before any sentinel binding runs.

`bindAftermathSceneTargets`'s `nodeMatchesSceneField` (`encounterAftermath.ts:690-716`) then checks
`kind: 'location'` via `isPlaceTierLocation`, which is the residual worth stating precisely: **every**
subtype the encounter's envelope expands to — `castle`, `fort`, `ruins`, `ruined_tower`,
`ruined_city`, `ruined_village`, `unexplored_poi`, `camp`, `oasis`, `wilderness`, `battleground` —
is a `LocationSubtype` from the same top-level worldgen vocabulary `settingClasses.ts` documents
(*"the same list `ALL_LOCATION_SUBTYPES` in `encounter-content.ts` carries"*), never a sublocation
(`parentLocationId`-carrying) shape. `isPlaceTierLocation` excludes sublocations by design
(`sublocationShape.ts`, THR-1183), and none of the eleven expanded subtypes are sublocations, so the
kind check passes for all of them. **Confirmed: the `critical_success` chip's backing write fires as
intended.** Open question #1 from the revised file's § 16 is resolved, not merely "worth
confirming."

**Open question #2 also resolved.** `stateNoun.entityId: '$target'` and `concepts[].entityId`
sentinels are resolved by a *separate* mechanism from `bindAftermathSceneTargets` —
`resolveAnchorDeclaration` (`src/data/content-eval/chipAnchorDeclarations.ts:155-172`), which reads
`context.targetId` directly (no kind check; that is fine, this path is for chip-rendering identity,
not effect dispatch) — and this exact field is what `chipAnchorViolations`
(`compositionContract.ts:664-700`) gates at authoring time, walking `change.stateNoun` and
`change.concepts` through `classifyAnchorDeclaration`. `$target` is a recognised form
(`ANCHOR_SENTINEL_TARGET`), so the gate passes and the runtime resolves it the same way.

**One doc-freshness gap found in passing, not blocking.** `anchor-catalog.generated.md:29` states
the `location` anchor form has *"no `visualKind` member"* — this is stale. `EncounterAftermathConceptRef.visualKind`
(`unifiedAction.ts:237`) explicitly lists `'location'` as a member (THR-1172), with live resolver
arms in `entityVisualResolver.ts:114,164`, `GameView.tsx:4516`, and `useDebugOpenModal.ts:60` — a
`location`-anchored chip **does** carry an entity-visual family and routes through `openEntity`
today. So the packet's own `visualKind: 'location'` declaration on the `critical_success` chip is
legal and *more* featured than the generated doc suggests (it renders the place's tile, not merely
a named-but-unclickable reference). Not a defect in this packet — the reference doc it was checked
against is what has drifted. Worth a regen (`anchor-catalog.generated.md` is a generated artifact;
the source it drifted from was not identified in this pass) — flagged for the batch report, not a
blocker here.

---

## 9. Composition Contract — block by block, against the live gate functions

| Block | Verdict | Reason |
|---|---|---|
| **steps** | PASS | 2 plain steps (within 1–3); both declare `reach`, numeric `difficulty`, non-empty `narrativeTemplate` |
| **hand** | PASS | `checkNudgeHand` (`nudgeHandChecklist.ts`): both hands 4–8 sized (5, 6); totals 0.35/0.39 ≤ 0.70; 4 spheres each ≥ `HAND_SPHERE_COVERAGE_MIN`; ≥1 common option each; all six `StepOutcome`s covered per hand; every card has ≥1 failure fragment; no negative essence; B6's 0-essence trait gate is the one exemption the rule itself carves out; no digits in any `effectLine`; `purposeLine`s 3/4 words ≤ `REACH_PURPOSE_MAX_WORDS` (4); carryover lines all ≤12 words (`NUDGE_WORD_BUDGETS.factorLine`), all magnitudes ≤ `NUDGE_BIG_DELTA` (0.15); step 0 authors no `carryoverFactorLines` (correct — it's the first step); open-draw difficulties 0.40/0.42 ≤ `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45) |
| **setting** | PASS | Four classes declared and expanded via `expandSettings`; four openings authored (§ 3), one per class; setting-neutral spine names no class scenery |
| **cast** | PASS | `supportBundle` declares one `actor` spec (non-empty); the sole `{cast:witness}` token names a declared key |
| **rewards** | PASS | `hasReward` satisfied twice over: a `rewardPool` recipe on step 0, and persistent aftermath effects (`condition_attachment` ×2, `agent_relocation` ×2) |
| **aftermath** | PASS | `aftermathConfig` present; 5 authored bands ≥ floor of 3; success-side (`success`, `critical_success`) and failure-side (`failure`, `critical_failure`) both present; extreme bands present (`critical_success`, `critical_failure`, `success_at_cost`); every variant has a non-empty `overview`; every authored `change` declares non-empty `concepts`; `chipBackingViolations` — every face with non-empty `changes` has a qualifying backing write; `chipAnchorViolations` — every `stateNoun`/`concepts` entityId classifies (`$target`, `$actor`, template ids); `chipVisibilityParityViolations` — no `reputation_tally` kind anywhere; `castTargetViolations` — the one `$cast:witness`-targeted effect (`condition_attachment` in the "Steady the one who stayed" reaction) uses a kind (`condition_attachment`) **not** in `CAST_TARGET_PERSISTENT_KINDS`, so this check does not even apply to it, and the spec's `must-persist` + `lazy-materialize-on-trigger` binding resolves regardless |
| **systems** | PASS | `systemConnections` finds `cast` (bundle present), `rewards` (`hasReward`), `conditions` (`condition_attachment` present) = 3, at the floor of `COMPOSITION_SYSTEMS_QUOTA_MIN` (3) exactly, matching the packet's own count |
| **images** | PASS | All 8 unique `imageTag`s resolve (§ 7); no `illustrationUrl` declared, so the public-absolute check does not fire |
| **draw** | PASS | `consequenceDraw: ['condition', 'knowledge', 'movement']` matches `drawnHandForTemplate` recomputed from the id (per the batch design's own table, row 2: `condition`/`knowledge`/`movement`); every family wired: `condition` by the `terrified` write, `knowledge` by `spawn_clue`, `movement` by `agent_relocation` (both directions); no `consequenceSwap` authored, none needed |

**Every block passes.** The one correction from § 1 (the `PATH`→`SCAR` recategorisation) is applied
in the final doc and does not change any of the above verdicts — the chip was never a *missing*
write, only a mis-typed category, which `checkCompositionContract` does not itself gate (category
choice is Rule 3's authoring discipline, not a machine check the contract runs; `chipBackingViolations`
only asks whether a write fired, not which of the four categories was picked).

---

## 10. Forecast arithmetic — independently summed

**Step 0 (Hand A):** `+0.06 (A1) + 0.08 (A2) + 0.05 (A3) + 0.06 (A4) + 0.10 (A5) = +0.35`. Difficulty
`0.40 + 0.35 = 0.75`. Inside `[0, 1]`. ✅

**Step 1 (Hand B):** `+0.02 (B1) + 0.09 (B2) + 0.05 (B3) + 0.05 (B4) + 0.10 (B5) + 0.08 (B6) = +0.39`.
Difficulty `0.42 + 0.39 (hand) + 0.05 (best carryover, keyed to `critical_success`) + 0.03 (trait
variant) = 0.89`. Inside `[0, 1]`. ✅

Both hand totals (0.35, 0.39) sit well under `NUDGE_HAND_MAX_TOTAL_DELTA` (0.70). No card buys
nothing; no step overflows. Matches the packet's own arithmetic exactly.

---

## 11. Enrichment — every token resolves

- `{actor}` / `{target}` — resolved by `enrichProse` (`proseEnrichment.ts`), universal, no
  declaration needed.
- `{cast:witness}` — appears exactly once (`critical_failure` overview). `witness` is a declared
  `supportBundle` key; `enrichProse`'s `{cast:<key>}` regex (`:647-656`) resolves any declared key
  via `resolveSceneCastContext`, confirmed present.
- No `{frag:*}` tokens are used in this packet (the four openings and the spine are each
  setting-specific/setting-neutral prose written directly, not fragment-composed) — nothing to
  validate there.
- No other `{...}` tokens appear in authored prose.

No dead enrichment tokens.

---

## 12. Carryover mechanism — confirmed wired the way the engine expects

`resolveCarryoverLine` + `priorStepOutcome` (`src/engine/encounters/nudges.ts:401-421`): step 1's
panel reads `action.stepOutcomes[action.currentStep - 1]` — the previous step's resolved
`StepOutcome` band — and looks it up directly in `step.carryoverFactorLines`. This is exactly the
mechanism § 4's `carryoverFactorLines` table assumes (keyed 1:1 on step 0's six possible bands, one
line each, `forecastDelta` applied as a named modifier `carryover:<band>`). Confirmed live, not
aspirational.

---

## 13. Registration shape — confirmed against `ROAD_AMBUSH_TEMPLATE`'s actual shape

- **Import:** `src/data/unified-action-templates.ts:193` — `import { ROAD_AMBUSH_TEMPLATE } from
  './encounters/road-ambush';` — a single-file, single-export pattern.
- **Array 1:** `RAW_UNIFIED_ACTION_TEMPLATES` (declared `:5462`), `ROAD_AMBUSH_TEMPLATE` appears
  `:5590`. This array is `.map()`ped into the exported `UNIFIED_ACTION_TEMPLATES` (`:5636-5642`),
  applying `withDefaultSupportBundle`/`withGroupAffinity` — irrelevant here since this template
  declares its own `supportBundle` (family defaults only apply when none is declared).
- **Array 2:** `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (declared `:5656`), `ROAD_AMBUSH_TEMPLATE`
  appears `:5678`. This is the array the encounter cache reads for location-subtype-gated content
  (`encounterCache.ts` / `deliveryBeatAdapter.ts:29,93`).

**Confirmed: the registration shape is exactly two array insertions plus one import, matching the
task brief exactly.** No third registration point exists for this template family.

---

## 14. Missing Primitives

**None.** Every effect kind, condition id, trait id, library card id, image tag, cast role, and
sentinel form the packet declares is live and correctly used. The gaps found (§ 1's category
mismatch, § 6's dealt-hand framing, § 8's stale generated doc, § 8's cast-reuse over-generalisation)
are documentation/data-field corrections, not capability gaps. Nothing here required inventing a
primitive to make the encounter work.

---

## 15. New Hooks Needed

None. This is a pure content addition against existing runtime capabilities — no new node types,
no new effect kinds, no new engine phases, no new UI surfaces.

One portfolio-level (not this-encounter-level) note, already recorded in the packet's own § 16 and
independently reconfirmed here: `trait.condition.location.under_watch` is a well-authored condition
with zero readers corpus-wide. It is not this encounter's job to fix that (the batch design fixed
it at the *chip* layer, correctly, per § 1's ruling), but it is worth a line in the batch report:
the intended reader (`requiredTargetTraits` gating) was designed but never authored anywhere, and
two encounters in this batch alone (`the_sign_over_the_ruin`, `the_unclaimed_relic`) now write it.

---

## 16. Implementation File Map

| File | Action |
|---|---|
| `src/data/encounters/the-sign-over-the-ruin.ts` | **CREATE** — new encounter file, following the single-export `UnifiedActionTemplate` pattern (`road-ambush.ts`, `flawed-steel.ts`) |
| `src/data/unified-action-templates.ts` | **EDIT** — add `import { THE_SIGN_OVER_THE_RUIN_TEMPLATE } from './encounters/the-sign-over-the-ruin';` near line 193; append the template to `RAW_UNIFIED_ACTION_TEMPLATES` (~5590) and to `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (~5678) |
| `src/data/content-eval/plotHooks.ts` | **EDIT** — stamp `usedBy` on `hook.celestial_sign` per § 1.0d of the packet, at closeout |
| `public/concept-art/encounters/the-sign-over-the-ruin.jpg` (or the pipeline's equivalent path) | **CREATE** (art pipeline) — per § 11's two-question direction: the two offering-heaps plate, no figures, no sign depicted |

No changes required to `src/types/unifiedAction.ts`, `src/types/encounter.ts`,
`src/types/gameState.ts`, `src/engine/unifiedActionLifecycle.ts`, `src/engine/encounterAftermath.ts`,
`src/data/condition-trait-content.ts`, `src/data/nudge-card-library.ts`, or
`src/data/encounter-image-library.ts` — every id and mechanism this encounter needs already exists.

**Implementation note carried into the final doc, not a file-map item:** B6's authored `StepNudge.id`
must literally be `'sign.a_reading_offered'` — that is the id `traitVariants[0].addNudgeIds`
references, and it is self-referential (this packet is the only place either string is used), so
there is no external ref to mismatch, only an internal one the implementer must get right on first
write.

---

## 17. Primitive Disposition

No missing primitives identified. Nothing to BUILD NOW or BACKLOG.

---

## Verdict

**READY FOR IMPLEMENTATION**

Every id, effect kind, gate constant, and mechanism this packet declares is live and correctly
used, confirmed against source rather than against the packet's own claims. The one real defect
found — the `critical_success` chip's `PATH` category on a write nothing reads — is resolved in
this pass (re-categorised to `SCAR`, matching an independently-arrived-at precedent already shipped
in `the-unclaimed-relic-revised.md`) and applied directly in the final merged doc, not left as a
caveat for the implementer to resolve. The two open Pass-3 questions the revised file's § 16 flagged
($target binding, `stateNoun.entityId` sentinel resolution) are both confirmed working by tracing
the actual candidate-generation and anchor-resolution code paths, not assumed. No missing
primitives, no new engine work, no new node types.
