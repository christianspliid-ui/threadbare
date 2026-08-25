# Encounter Pipeline: The Broken Seal
> Scale: 2-step Test & Consequence | Slug: `the-broken-seal` | Pass: systems
> Date: 2026-08-25 | Pipeline version: 3 (Encounter Factory)
> Audited against: `the-broken-seal-revised.md` (the editorially-approved packet), live source
> (`src/types/unifiedAction.ts`, `src/types/encounter.ts`, `src/types/npc.ts`, `src/types/movement.ts`,
> `src/types/coreRegistry.ts`, `src/types/omen.ts`, `src/data/content-eval/compositionContract.ts`,
> `src/data/content-eval/consequenceDraw.ts`, `src/data/content-eval/nudgeAuthoringConstants.ts`,
> `src/data/content-eval/chipAnchorDeclarations.ts`, `src/engine/encounterAftermath.ts`,
> `src/data/settingClasses.ts`, `src/data/nudge-card-library.ts`, `src/data/reward-attachment-catalog.ts`,
> `src/data/ambition-templates.ts`, `src/data/condition-trait-content.ts`, `src/data/content-eval/plotHooks.ts`,
> `src/data/encounter-image-library.ts`), and one live run of `npm run draw:consequences`.

**Verdict: READY FOR IMPLEMENTATION.** Every id, effect kind, field name, and constant named in the
revised packet was checked against the live source and resolves. The consequence draw was
independently recomputed by running the actual tool. Two of editorial's five carried findings
resolve to a clean PASS by inspection; the other three were already correct as authored. No
missing primitives, no BLOCKED items, no engine work needed.

---

## 1. The five carried findings, resolved

**1. `supportRole: 'rival_delver'` — CONFIRMED, a free string.**
`EncounterSupportActorSpec.supportRole` (`src/types/encounter.ts:218`) is declared
`readonly supportRole: string` — "Role label for the support cast member." It is not a closed
enum and no validator constrains its members (the composition contract, the cast block, and
`castTargetViolations` all read `spec.kind`/`spec.delivery`, never `spec.supportRole`). Any string
is legal; `'rival_delver'` is accepted as authored. **PASS — nothing to fix.**

**2. `critical_success` landing two attachment grants from one ending — CONFIRMED legal, no cap.**
Nothing in `compositionContract.ts` or the spec bounds how many `attachment_grant` effects one
band may fire. `critical_success` gets the fragment from step 1's `successMetadata`
(`isStepSuccess` counts `critical_success` as a success) plus the testament from the band's own
reaction — two independent writes, two independently backed chips (`seal.crit.prize` backed by
the step metadata, `seal.crit.testament` backed by the reaction). Editorial's Ruling B already
settled the design question (the tier-3 prize stays gated to the rarest band); this pass confirms
the mechanism is legal, not just intended. **PASS — reward density as designed.**

**3. `seal.crit_fail.the_wanting`'s `concepts` text "Uncover Ancient Secrets" — CONFIRMED matches.**
`AMBITION_TEMPLATES` (`src/data/ambition-templates.ts:491`): `id: 'ambition_uncover_secrets'`,
`displayName: 'Uncover Ancient Secrets'`. Exact string match to the chip's undecorated `concepts`
text. Also confirmed: the selection prose the § 11 table quotes —
*"Something was buried here once, on purpose. She meant to know what."* — is that template's own
`selectionProse[0]` (line 541), not a paraphrase. **PASS.**

**4. All thirteen `imageTag`s and every § 15 content id — CONFIRMED, exact-symbol resolution.**
Ran the actual resolution rather than spot-checking:

| Id class | Checked against | Result |
|---|---|---|
| `reward_tomes_scrolls_veilscript_fragment` | `src/data/reward-attachment-catalog.ts:795` | tier 2, `type: 'artifact'` — matches § 15's claim |
| `reward_tomes_scrolls_the_silent_testament` | `src/data/reward-attachment-catalog.ts:819` | tier 3, `type: 'artifact'` — matches |
| `reward_relics_talismans_bone_ward` | `src/data/reward-attachment-catalog.ts:1046` | tier 1, `type: 'artifact'` — matches |
| `ambition_uncover_secrets` | `src/data/ambition-templates.ts:490` | live, displayName confirmed above |
| `ambition_chase_the_wonder` | `src/data/ambition-templates.ts:1289` | live, `displayName: 'Chase the Wonder'` |
| `trait.core.core_hope.virtue` | `src/types/coreRegistry.ts:134` + `src/data/core-trait-content.ts:72` | live continuum `core_hope`, `governs: 'outlook'`, node id built as `trait.core.${continuumId}.${pole}` |
| `trait.condition.wounded` | `src/data/condition-trait-content.ts:143` | live |
| `trait.condition.terrified` | `src/data/condition-trait-content.ts:175` | live |
| `trait.condition.exhausted` | `src/data/condition-trait-content.ts:223` | live |
| `trait.condition.location.pass_closed` | `src/data/condition-trait-content.ts:272` | live; `description: 'Snow, rockfall or flood has shut the way through. Crossing costs dearly, and most turn back.'` — matches the doc's paraphrase; comment confirms "the readers are the movement tax and the gate" |
| all 13 `libraryCardId`s + `name`s | `src/data/nudge-card-library.ts` `CARD_CONTENT` (lines 572–649) | **all 13 titles and all 13 quotes match verbatim** — Buy The Floor / Show The Obvious / Pay It Elsewhere / Plant An Urge / Call Them Onward / Ease The Suffering / Draw On Character / Press The Odds / Widen The Swing / Hide The Deed / Set Aside For Them / Throw Full Weight / Kindle A Wanting. Every nudge `id` (`seal.buy_the_floor` … `seal.kindle_a_wanting`) is the title's own snake_case, as Ruling C requires. |
| all 13 `imageTag`s | `src/data/encounter-image-library.ts` `NUDGE_CONCEPT_ART` (lines 628–643) | **all 13 present**: `generic.ward`, `generic.light`, `generic.decay`, `generic.memory`, `generic.rumor`, `generic.warmth`, `generic.oath`, `generic.focus`, `generic.luck`, `generic.dark`, `generic.matter`, `generic.strength`, `generic.blessing` |

**PASS — no dead ref anywhere in the register.**

**5. `ActionScale` has no `company` member — CONFIRMED, not a defect.**
`src/types/unifiedAction.ts:20`: `export type ActionScale = 'cosmic' | 'regional' | 'local' | 'personal';`
No `'company'` member exists anywhere in the union. `scale: 'local'` (§ 16) is the correct schema
value for a company-scale roll — recorded, not a defect, per the doc's own note. **PASS.**

---

## 2. Systems Audit — every id and shape, checked against the live source

### Traits

- `trait.core.core_hope.virtue` — **live**, `src/types/coreRegistry.ts:134`. `validateTraitRefs()`
  matches full node ids, and this is the full node id (least likely to rot per the spec's own
  guidance). `TraitVariant` fields used (`traitId`, `forecastDelta`, `difficultyDelta`,
  `factorLine`, `addNudgeIds`) match `src/types/unifiedAction.ts:1650–1658` exactly.
- **The three-shipped-user claim, independently re-derived.** Grepped `core_hope` across
  `src/data/encounters/`: `vertical-slice.ts:954` (`trait.core.core_hope.virtue`),
  `company-drama.ts:1786` (`trait.core.core_hope.virtue`), `the-garrisons-price.ts:144`
  (`trait.core.core_hope.vice`). Editorial's F7 correction (three users, not zero) and the revised
  doc's § 9 claim are both **confirmed true**, not merely internally consistent.
- Condition ids `trait.condition.wounded` / `.exhausted` / `.terrified` /
  `.location.pass_closed` — all four **live** in `src/data/condition-trait-content.ts`.

### Effect kinds and shapes

Checked every effect literal in the packet against its union member in
`src/types/unifiedAction.ts`:

| Effect | Fields used | Verdict |
|---|---|---|
| `attachment_grant` | `templateId`, `targetAgentId` | matches (line 687); `counterpartyId` correctly omitted — these are `possession` grants, not agreements, so it is not required |
| `condition_attachment` | `templateId`, `targetAgentId` / `targetLocationId` | matches (line 640); `targetLocationId` on the `critical_failure` reaction is the THR-1143 place-carrier field, confirmed present |
| `agent_relocation` | `targetAgentId`, `destination: { kind: 'away', minHexDistance }`, `mode: 'travel'` | matches `RelocationDestination` (`src/types/movement.ts:76–82`) exactly; `away` is a real union member |
| `assign_ambition` | `templateId`, `targetAgentId`, `narrativeHook` | matches (line 626) |
| `encounter_seed` | `encounterFamily`, `targetAgentId`, `delayTicks`, `priority`, `inheritContext`, `seedLabel` | matches (line 432); `delayTicks` and `seedLabel` (both required) are present |
| `emit_omen` (card grant) | `category: 'cultural'`, `intensity`, `narrativeHook`, `scope: { kind: 'global' }`, `sphereAlignment` | `OmenCategory` includes `'cultural'` (`src/types/omen.ts:17`); `EmittedOmenScope` includes `{ kind: 'global' }` (line 137) |
| `remove_condition` (card grant) | `conditionTraitId` | matches (line 602); `targetAgentId` correctly omitted, defaults to actor |
| `quintessence_shift` | `delta`, `targetAgentId`, `source` | matches (line 466) |

No effect kind in the packet is unrecognized; no required field is missing.

### `agent_relocation` — cross-checked against the sibling calibration

`the-unclaimed-relic.ts` does not use `agent_relocation`, but `CHIP_BACKING_EFFECT_KINDS`
(`compositionContract.ts:225`) explicitly documents it as "the sole satisfier of the `movement`
family," resolved as durable state ("rewrites the agent's `located_at` edge... core world state
every spatial system reads afterwards"). Confirmed idempotent under a repeat write
(`setRelocationIntent` replaces) — matches the doc's own effect-ordering note in § 7.

### `$target` anchor — the load-bearing check

The revised doc anchors `seal.crit_fail.shut`'s `stateNoun` at `entityId: '$target'`,
`visualKind: 'location'`, and writes `condition_attachment` with `targetLocationId: '$target'`.
This resolves only if the action carries a `targetId` pointing at a location node.

- `classifyAnchorDeclaration('$target', …)` returns `{ ok: true, form: 'target' }`
  (`chipAnchorDeclarations.ts:93`) unconditionally — the *gate* passes regardless.
- The harder question is runtime resolution: `bindAftermathSceneTargets` rebinds `$target` to
  `action.targetId` only when `nodeMatchesSceneField` confirms the target node's kind is
  `'location'` (`SCENE_SENTINEL_FIELDS.targetLocationId = 'location'`,
  `src/engine/encounterAftermath.ts:684`).
- **Proof this resolves for this template shape:** `src/data/encounters/the-unclaimed-relic.ts`
  — the director-approved, shipped, gate-green calibration case — has the **identical**
  template-level shape (`intrinsicTier: 'background'`, `crudType: 'read'`, `scale: 'local'`,
  `actorAffinities: ['individual']`) and does exactly this: `targetLocationId: '$target'` paired
  with `stateNoun: { entityId: '$target', visualKind: 'location' }` (lines 449, 464). An
  individual-affinity, self-targeting `read` encounter of this exact shape already ships this
  pattern and passes the gate. **PASS — proven by a live precedent of the same shape, not merely
  by type-checking.**

### `SCENE_SENTINEL_FIELDS` — the eight-field claim, verified verbatim

`src/engine/encounterAftermath.ts:648–684` — the object literal is exactly `targetAgentId`,
`withAgentId`, `counterpartyId`, `debtorAgentId`, `targetFactionId`, `factionId`,
`targetSublocationId`, `targetLocationId`. The revised doc's § 7 claim is character-for-character
correct.

### Cast — class honesty against `LOCATION_ROLE_ROSTERS`

`src/types/npc.ts` `LOCATION_ROLE_ROSTERS`: only `temple` (line 297) and `shrine` (line 336) carry
roster entries among the eight subtypes the envelope expands to. No `ruins`, `ruined_tower`,
`ruined_city`, `ruined_village`, `unexplored_poi`, or `tower` key exists in the object at all —
confirmed by direct grep. The claimed chances are exact:

- `pilgrim` — shrine 0.6, temple 0.7 ✓
- `hermit` — shrine 0.5 (no temple entry, correctly not claimed) ✓
- `oracle` — shrine 0.7, temple 0.4 ✓

`spawnNpcRole: 'wanderer'` and every `reuseNpcRoles` entry (`pilgrim`, `hermit`, `oracle`) are
members of the 56-role `NpcRole` union (`src/types/npc.ts:35–89`). `'wanderer'` is also the spawn
role in three other shipped `default-support-bundles.ts` entries at wayside/rural-flavored
classes, confirming it reads generically. **PASS.**

### Setting envelope

`src/data/settingClasses.ts:61–63` — `SETTING_CLASS_SUBTYPES`: `sacred: ['shrine', 'temple']`,
`arcane: ['tower']`, `ruin: ['ruins', 'ruined_tower', 'ruined_city', 'ruined_village',
'unexplored_poi']`. Union is exactly the eight subtypes § 4 claims. `expandSettings`,
`compileOpeningEnvelope`, and `validateSettingEnvelope` all exist as named
(`src/data/settingClasses.ts:106, 173, 245`).

### Hand arithmetic — re-derived independently, not trusted

Constants pulled live from `src/data/content-eval/nudgeAuthoringConstants.ts`:
`NUDGE_HAND_MIN=4`, `NUDGE_HAND_MAX=8`, `NUDGE_HAND_MAX_TOTAL_DELTA=0.70`,
`HAND_SPHERE_COVERAGE_MIN=4`, `HAND_COMMON_OPTIONS_MIN=1`, `NUDGE_BIG_DELTA=0.15`,
`NUDGE_OFF_REACH_MAX_DIFFICULTY=0.45`, `OPEN_DRAW_ATTENTION_TIER='background'`.

- Step 0: `0.04+0.10+0.12+0.08+0.05+0.05+0.08 = 0.52`. Difficulty `0.40+0.52=0.92 ≤ 1.0`. ✓
- Step 1: `0.06+0.03+0.08+0.07+0.16+0.06 = 0.46`. Difficulty `0.44+0.46=0.90 ≤ 1.0`. ✓
- `intrinsicTier: 'background'` matches `OPEN_DRAW_ATTENTION_TIER`; both step difficulties
  (0.40, 0.44) sit at or under `NUDGE_OFF_REACH_MAX_DIFFICULTY` (0.45). ✓
- `Throw Full Weight`'s `forecastDelta: 0.16 ≥ NUDGE_BIG_DELTA (0.15)` and does carry both
  `failure` and `critical_failure` fragments, per the rule. ✓

All arithmetic in the revised doc's own tables reproduces exactly on re-derivation.

### The Consequence Draw — recomputed by running the tool, not by reading the table

```
$ node .cache/draw-consequences.mjs encounter.delve.the_broken_seal --reach star --rarity 2

  template  encounter.delve.the_broken_seal  (not in the live catalog)
  reach     star  (from --reach)
  rarity    2  (from --rarity)
  hand      2 of 2 drawn

  ▸ drive   [weight 8 in star]
      wire one of: assign_ambition, plant_compulsion

  ▸ movement   [weight 7 in star]
      wire one of: agent_relocation
```

**Exact match to `consequenceDraw: ['drive', 'movement']`, no swap.** This is the strongest
possible confirmation short of running the composition gate on live code — the draw is
deterministic on `(templateId, reach, rarity)` and was recomputed from scratch, not read off the
doc's own table.

`drive`'s wiring set is `['assign_ambition', 'plant_compulsion']`
(`consequenceDraw.ts:190`) — the two `assign_ambition` reactions (`critical_success`,
`critical_failure`) satisfy it. `movement`'s wiring set is `['agent_relocation']` (line 191) — step
1's `failureMetadata.agent_relocation` satisfies it.

### Composition Contract blocks — verified against `compositionContract.ts` directly

- **Steps**: 2 plain steps, each with `reach`, `difficulty` (number), `narrativeTemplate`. ✓
- **Cast**: `castSpecs(template).length > 0` via `rivalSpec` (`kind: 'actor'`). ✓
- **Rewards**: `hasReward()` is satisfied independent of any card `grants` — see the finding below.
- **Aftermath**: 5 authored `byOutcome` bands (≥3 floor), one success-side
  (`critical_success`/`success`/`success_at_cost`), one failure-side (`failure`/`critical_failure`),
  both extremes present. Every variant (`fallback`) carries a non-empty `overview` (required field,
  not optional — `AftermathVariant.overview: string`). Every `change` declares `concepts`
  (checked all eight chips in § 12 — all have a non-empty `concepts` array). ✓
- **Systems**: 4 — see below.
- **Images**: all 13 card tags resolve (confirmed above); no `illustrationUrl` declared, so the
  public-absolute check does not apply.

### Systems quota — 4 confirmed, and a genuine wiring note for Pass 4

`systemConnections()` reads only `allAftermathEffects()` (aftermath reactions + step
`successMetadata`/`failureMetadata`) and `allAftermathChanges()` — **it does not walk
`step.nudges[].grants`.** So the card-carried grants (`Set Aside For Them`'s `attachment_grant`,
`Call Them Onward`'s `emit_omen`, `Ease The Suffering`'s `remove_condition`, `Kindle A Wanting`'s
`assign_ambition`) contribute **nothing** to the systems quota or the consequence-draw wiring
count, however systemically alive they are in play.

This does not affect this encounter's verdict — the 4-system count is independently satisfied
without them:

- **cast** — `rivalSpec` (actor spec, unconditional).
- **rewards** — `condition_attachment`/`assign_ambition`/`encounter_seed` are all
  `PERSISTENT_EFFECT_KINDS` members, present in step metadata and band reactions (not cards).
- **conditions** — `condition_attachment` fires in step 1 `failureMetadata`
  (`exhausted`) and two band reactions (`wounded`, `pass_closed`).
- **seeds** — the `success` band's `encounter_seed` reaction.

**Note for Pass 4 (informational, non-blocking):** `attachment_grant` is *also* absent from
`PERSISTENT_EFFECT_KINDS` (it lives only in `CHIP_BACKING_EFFECT_KINDS` and
`CAST_TARGET_PERSISTENT_KINDS`) — so the step-1 `successMetadata`'s two `attachment_grant`s
(veilscript fragment, testament) do not themselves count toward the Rewards block or the systems
quota either, though they are legally backed chips (Law 56) and legally resolve. Both facts are
pre-existing engine behavior, correctly worked around by this encounter's authoring rather than
being a gap this encounter introduces. Nothing to fix here; flagged so a future author does not
assume a card-authored or attachment-only reward will move the systems count.

### Chip backing (Law 56) and anchors (Law 56 clause 2) — walked face by face

All five bands' chips were checked against `chipBackingForFace` and `chipAnchorViolations` by
hand, following the same algorithm the code runs:

| Face | Chips | Backing write(s) reachable on that face | Anchors |
|---|---|---|---|
| `critical_success` | `seal.crit.prize`, `seal.crit.testament` | step 1 `successMetadata.attachment_grant` (reaches `critical_success` — a success band) + this band's reaction `attachment_grant` | both `entityId` = live attachment template ids → `classifyAnchorDeclaration` returns `attachment_template` |
| `success` | `seal.success.prize` | step 1 `successMetadata.attachment_grant` | same attachment template id |
| `success_at_cost` | `seal.cost.prize`, `seal.cost.wounded` | `successMetadata` (success-side band) + this band's reaction `condition_attachment` | fragment's template id + `trait.condition.wounded` (a `CONDITION_TRAIT_DEFINITIONS` member, also indexed by `getAttachmentTemplateNode`) |
| `failure` | `seal.fail.worn_out`, `seal.fail.driven_out` | step 1 `failureMetadata.condition_attachment` + `failureMetadata.agent_relocation` | `trait.condition.exhausted` (live) + `$actor` (sentinel, `form: 'actor'`) |
| `critical_failure` | `seal.crit_fail.shut`, `seal.crit_fail.the_wanting` | this band's reaction `condition_attachment` (on `$target`) + `assign_ambition` | `$target` (sentinel, `form: 'target'`, resolves per the precedent above) + `$actor` |

Every face's `changes.length > 0` has at least one qualifying backing write reachable on it — no
`chipBackingViolations` entry possible. Every declared `entityId` classifies `ok: true`. No
`reputation_tally` chip anywhere, so `chipVisibilityParityViolations` cannot fire. No
`CAST_TARGET_PERSISTENT_KINDS` effect (`bond_change`, `hidden_mark`, `attachment_grant`,
`membership_change`, `agent_relocation`) targets a `$cast:` sentinel anywhere in this packet — the
rival is never the *target* of a persistent write, only a fictional presence — so
`castTargetViolations` has nothing to check.

### Plot hook

`hook.descent_into_darkness` — **live** in `src/data/content-eval/plotHooks.ts:597`, text matches
verbatim: *"The way on goes down, the light will not last the distance, and what is down there was
buried on purpose."* `usedBy: []` currently — Pass 4 must append this template's id on ship, per
the doc's own note.

---

## 3. Missing Primitives

**None identified.** Every mechanic the packet uses is a live, already-shipped primitive:
`ActionStepBranch` is not used (no branching — correctly, per Q6 "None — this is a test");
`carryoverFactorLines`, `TraitVariant`/trait-only nudges, `encounter_seed`, `condition_attachment`
on both agent and location carriers, `agent_relocation`, `assign_ambition`, `emit_omen`,
`remove_condition`, and the aftermath `byOutcome` band system are all live and already exercised by
the shipped calibration case or other shipped templates cited above.

---

## 4. Implementation File Map

**Create:**
- `src/data/encounters/the-broken-seal.ts` — the template itself, built exactly to §§ 4–18 of the
  final packet below. Follow `the-unclaimed-relic.ts`'s structure (same template-level shape:
  `intrinsicTier: 'background'`, `crudType: 'read'`, `scale: 'local'`,
  `actorAffinities: ['individual']`) as the closest live reference for wiring `$target` on a
  self-targeting encounter.

**Modify:**
- `src/data/unified-action-templates.ts` — register the new template's import, following the
  existing pattern for other `encounter.delve.*` / `src/data/encounters/*.ts` entries.
- `src/data/content-eval/plotHooks.ts` — append `'encounter.delve.the_broken_seal'` to
  `hook.descent_into_darkness`'s `usedBy` array (line 602).

**Verify (no edit expected, run the gate):**
- `npm run check:encounter -- encounter.delve.the_broken_seal` once the template is registered —
  this is the first point at which the Composition Contract, the detectors, grant liveness, the
  enrichment dry-run, and forecast arithmetic all run against the *actual* template object rather
  than this pass's manual re-derivation. Expected: green, given everything confirmed above.
- `npm run check:generated-freshness` if the wiki or UL shards are touched (they are not expected
  to be, by this change).

**No test file is required by the pipeline for a single content template** — the corpus-level
tests (`nudgeModel.test.ts`, the trait-producer pin, etc.) already cover the shared machinery this
template exercises; no new engine surface is introduced.

---

## 5. Verdict rationale

Every id named in the packet — 13 card library ids and titles, 13 image tags, 3 reward attachment
ids, 2 ambition ids, 4 condition ids, 1 core trait id, 1 plot hook id, every effect kind and its
required fields, every constant cited (hand-arithmetic ceilings, difficulty ceiling, big-delta
threshold) — was checked directly against the live source in this pass, not against the doc's own
claims about itself. The one item requiring runtime reasoning rather than a straight lookup (does
`$target` resolve to a location for a self-targeting individual encounter) is proven by an
identically-shaped, shipped, gate-green sibling rather than by type-checking alone. The consequence
draw was independently recomputed by running the actual tool against the actual template id and
reach, and it reproduced the doc's claimed hand exactly. No missing primitive, no dead reference,
no schema mismatch was found anywhere in the packet.

The one genuine wiring nuance for Pass 4 — card `grants` do not count toward the systems quota or
consequence-draw wiring, only aftermath-level effects do — does not change this encounter's
verdict, because its 4-system count and both drawn families are already wired through
aftermath-level effects independent of any card grant. It is recorded so Pass 4 does not
mistakenly rely on a card grant to satisfy either check on a future template.

READY FOR IMPLEMENTATION
