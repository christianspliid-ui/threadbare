# Encounter Pipeline: The Drowned Archive
> Scale: medium (3 steps) | Slug: `the-drowned-archive` | Pass: systems
> Date: 2026-08-25 | Pipeline version: 3 (Encounter Factory)

---

## 0. Priority ruling — the handless step is a hole, and it is fixable

**Verdict: editorial's "cannot be built" conclusion is wrong. The blocker was a self-imposed
batch-brief policy mistaken for a code/spec floor. A valid third hand exists and is built into
the final packet below.**

### What the code actually enforces

`checkNudgeHand` (`src/data/content-eval/nudgeHandChecklist.ts:73-267`) is the only place
`HAND_SPHERE_COVERAGE_MIN` and `HAND_COMMON_OPTIONS_MIN` are evaluated. Read line by line:

```ts
const spheres = new Set(hand.map(n => n.sphere).filter(Boolean));
if (spheres.size < HAND_SPHERE_COVERAGE_MIN) { ... }          // line 99-104
const common = hand.filter(n => n.sphere === undefined);
if (common.length < HAND_COMMON_OPTIONS_MIN) { ... }           // line 106-111
```

`hand` is `step.nudges` — **one step's own array, nothing else.** The function is called once
per nudge-bearing step of one template (`nudgeBearingSteps`, line 56-58) and carries no
cross-step, cross-encounter, or cross-batch state. Spheres or members dealt in step 0's hand or
step 2's hand of *this same encounter* — let alone another encounter's hand — are invisible to
this check. A candidate step-1 hand is free to reuse `darkness`, `chaos`, `matter`, `light`
(step 0's spheres) or `darkness`, `chaos`, `time`, `entropy` (step 2's spheres), or any sphere
used anywhere else in the batch. Nothing in `compositionContract.ts` aggregates hands either —
its `hand` block (line 28-31) just delegates to `checkNudgeHand` per template.

The spec's stated rule (`nudge-authoring-spec.md:538`) is *"No two encounters in a family repeat
a **type composition**"* — the multiset of card *types* dealt in a hand (Boost, Veil, Stumble,
…), audited by the coverage matrix. It is not a rule about reusing a *member* (`libraryCardId`)
or a *sphere*. The revised packet's own § 9 states the opposite premise correctly: "post-THR-1178
every member has an authored face… the pivot's rule is one face per library card **shared by
every hand that deals it**" — the corpus is *built* on repeated member deals across encounters.
Nothing forbids dealing `card.mercy.core` a second time in this encounter, or a third.

### What the "spent" claim actually was

Editorial's Ruling A treats two things as hard walls with the same force as the coded floors:

1. **"Every universal-core member is spent."** True only within the scope of *this batch's own
   over-exposure table* — `Docs/plans/encounters/deep-places-brief.md` § *Over-exposed cards*,
   which caps eight specific members "at most once across the batch." That table is the batch
   brief's **own authored policy**, drafted by an attended session and stamped "Approved:
   pending." It is not read by `checkNudgeHand`, not read by `compositionContract.ts`, and not
   named anywhere in `nudge-authoring-spec.md` as a hard rule — grep confirms "over-exposure"
   appears nowhere in the spec. It is exactly the kind of documented, reasoned deviation the brief
   itself already overrides twice (the opposition-die override and the consequence-swap override,
   both § *Two recorded deviations, both with their reason*). A third override, recorded the same
   way, is not a rule violation — it is the brief's own established mechanism.
2. **"Only the `order` signature sphere remains unspent."** This is also scoped to *members
   already dealt somewhere in the batch* — not to spheres this specific encounter has any
   obligation to avoid. Re-deriving the actual availability (§ 1 below) finds **three** spheres
   never touched anywhere in the batch (`order`, `force`, `spirit`), not one.

### The corrected availability count

Cross-referencing every card dealt in slot 1 (`the-broken-seal`, per editorial finding 26's
table) and this encounter's two existing hands (§ 9 below) against `SPHERE_SIGNATURES`
(`nudge-card-library.ts:291-304`):

| Sphere | Slot 1 | This encounter (steps 0, 2) | Batch-wide status |
|---|---|---|---|
| `life` | `balm.signature.life` | — | 1 use, **not** on the over-exposure table |
| `force` | — | — | **zero uses anywhere in the batch** |
| `spirit` | — | — | **zero uses anywhere in the batch** |
| `mind` | `compulsion.signature.mind` | — | 1 use, capped "at most once" per brief |
| `light` | `whisper.signature.light` | `whisper.attunement.light` (step 0) | both light members spent |
| `darkness` | — | `veil.attunement.darkness`, `undertow.signature.darkness` | both darkness members spent |
| `chaos` | — | `stumble.signature.chaos`, `gambit.signature.chaos` | both signature-tier members spent; `gambit.attunement.chaos` (variation tier) still unused |
| `matter` | — | `cache.signature.matter` | the one matter signature member spent |
| `energy` | — | — | banned outright by the brief (`card.boost.signature.energy`) |
| `time` | — | `omen.signature.time` (step 2) | 1 use, capped "at most once" per brief |
| `entropy` | `bargain.signature.entropy` | `bargain.signature.entropy` (step 2) | the library's only entropy member, shared by design |
| `order` | — | — | **zero uses anywhere in the batch** |

**Three spheres — `order`, `force`, `spirit` — have never been dealt anywhere in this
two-encounter batch.** Each signs exactly one type (`favor`/`insurance` for order, `heavy_hand`
for force, `kindled_ambition` for spirit), so three fresh signature-tier members are available
with zero deviation from any stated policy, brief or code. A fourth distinct sphere for the hand
requires either a genuinely fresh combination (none remain) or one documented reuse; `mind` via
`card.compulsion.signature.mind` is the cleanest, matching the brief's own precedent for
documented overrides. `life` via `card.balm.signature.life` is available with **zero** policy
deviation at all — it is not on the over-exposure table and has been dealt only once, by a
different encounter.

**Conclusion:** four distinct spheres for a step-1 hand are assemblable using between zero and
one documented deviation from the brief's self-imposed (non-code, non-spec) over-exposure table
— nowhere close to "unbuildable." The final packet below uses `order`, `force`, `spirit`, `mind`
— three genuinely fresh to the batch, one documented reuse (mirroring the brief's own recorded-
deviation pattern) — which also, incidentally, *satisfies* rather than breaks the brief's own
policy for two of the three (`heavy_hand.signature.force` and `kindled_ambition.signature.spirit`
are both on the over-exposure table at "at most once each," and this is their first use anywhere
in the batch).

### The ungated common option

`HAND_COMMON_OPTIONS_MIN` (1) is satisfied by any card with `sphere === undefined` in the code's
own check — it does not distinguish gated from ungated at that predicate (a discrepancy from the
spec's stricter prose "ungated common option," noted below as a NOTE finding). The final hand
uses `card.whisper.hunger.witness` — sphere-less by construction (hunger-unique members carry no
`sphere` field, `nudge-card-library.ts:441-444`), unlock `{ kind: 'starting' }` (genuinely
ungated), and on the brief's own "unspent members" list. It authors *"Read The Architecture"* —
the library's own title for this member, and a title that could not be a better fit for a step
whose purpose line is "Read the shelves."

### The two open questions from editorial

- **(a) Does binding a `libraryCardId` subject a `StepNudge` to its member's `unlock` gate at
  deal time?** **Yes.** `src/engine/encounters/nudges.ts:315-316`: `nudge.libraryCardId &&
  !context.repertoireCardIds.has(nudge.libraryCardId)` withholds the card. `repertoireCardIds`
  comes from `buildRepertoire`, which resolves each member's `unlock` (`starting` /
  `sphere_attunement` / `milestone` / `god_trait`) against the acting god's progression. This
  confirms editorial's concern about `card.whisper.attunement.light` (threshold 60) reaching few
  gods was correctly reasoned — it just should not have carried the design conclusion it was
  asked to carry.
- **(b) Does `card.favor.signature.order` carry a `requiresFavor` gate?** **No, and it cannot by
  construction.** `requiresFavor` is a field on `StepNudge` itself (`unifiedAction.ts:1485`,
  author-declared per instance), never on a `NudgeCardMember`. `NudgeCardUnlock`
  (`nudge-card-library.ts:320-339`) has exactly four kinds — `starting`, `milestone`,
  `god_trait`, `sphere_attunement` — none named `favor`. The library's `order` signature members
  are `unlock: { kind: 'starting' }` (`signatureMember`, line 383-390): the *only* gate on them
  is holding `order` sphere access, the same as any other signature member. `card.favor.signature
  .order` reads *"Creates or calls in a favor owed"* (`NUDGE_CARD_TYPES`, line 232-238) — its
  **create** direction needs no favor to already exist, so the final hand's use of it (minting a
  debt, not calling one in) correctly omits `requiresFavor`.

---

## 1. Support Bundle Honesty

`keeperSpec` (§ 5 of the revised packet) declares `kind: 'actor'`, `delivery:
'lazy-materialize-on-trigger'`, `persistence: 'must-persist'`. This is the only realistic shape
for a cast member who receives `bond_change` on three bands and a `condition_attachment` on
`critical_failure`: `castTargetViolations` (`compositionContract.ts:802-858`) specifically rejects
a `pre-seeded` (bind-only) spec carrying a persistent-consequence write, because a bind-only spec
attaches ambient scenery rather than materializing the scene's subject. `keeperSpec` avoids that
failure mode by construction. `reuseNpcRoles: ['acolyte', 'monk', 'chaplain']` is checked against
`LOCATION_ROLE_ROSTERS` (`src/types/npc.ts:299-301`) — confirmed live: `acolyte` at shrine 0.6 /
temple 0.9, `monk` at temple 0.8, `chaplain` at temple 0.7. Persistence claim: honest.

## 2. Missing Primitives

None. Every mechanic the packet leans on — `condition_attachment`, `intelligence`, `spawn_clue`,
`bond_change`, `encounter_seed`, `attachment_grant`, `plant_compulsion`, `emit_omen`,
`favor_creation`, `assign_ambition`, `remove_condition`, `NudgeRevealKind: 'next_step_demand'`,
`ActionStepBranch`-free linear steps, `TraitVariant` — is a live, shipped primitive. No stub, no
invented effect kind, no invented card type.

## 3. Runtime Feasibility

Three plain `ActionStep`s (`COMPOSITION_STEPS_MAX` is 3 — at the ceiling, not over it). No
branching. Outcome ladder: full six-band `StepOutcome` domain used throughout (§ 9's arithmetic
tables). Aftermath: five `byOutcome` bands on `fallback`, floor is three
(`COMPOSITION_BYOUTCOME_MIN_BANDS`). All wirable with mature, already-shipped systems.

## 4. Aftermath Supportability

Reputation channels: deliberately untouched (brief instruction). Conditions: four
`condition_attachment` writes, all four target ids (`cursed`, `terrified`, `grieving`,
`trait.condition.location.under_watch`) confirmed live in `src/data/condition-trait-content.ts`
(lines 143, 175, 207, 244, 323). Follow-on hooks: one `encounter_seed` on `failure`, `encounterFamily:
'encounter.delve'` — a live family prefix.

## 5. New Hooks Needed

None. Every id, effect kind, and node type used already exists in the live catalogs (§ 8 below).

## 6. Implementation File Map

Pass 4 creates exactly one new content file and touches no engine code:

- **Create:** `src/data/encounters/the-drowned-archive.ts` — the full `UnifiedActionTemplate`
  literal, wrapped in `compileOpeningEnvelope({...})` per § 4 of the packet.
- **Modify:** `src/data/unified-action-templates.ts` — import and register the new template,
  following the existing import + registration pattern (`the-unclaimed-relic.ts` is the reference).
- **Modify:** `src/data/content-eval/plotHooks.ts` — stamp `usedBy` on `hook.dangerous_truth`
  (packet § 1 row `0d` instruction, carried forward unchanged from the revised file).
- **No engine changes.** No new effect kind, no new card type, no new `NudgeCardUnlock` kind, no
  schema change of any sort is required by this packet.
- **Verification, not creation:** run `check:encounter` (or the equivalent gate script) once the
  template compiles, to confirm the `consequenceDraw` recomputation at reach `shadow` rarity 2
  matches the declared `['relationship', 'knowledge']` with the declared swap — this is a
  deterministic hash-keyed draw that this audit did not re-derive by hand; the weight table
  (`consequenceDraw.ts:141`) does confirm `knowledge: shadow → 7`, comfortably over the ≥2 floor,
  and `relationship: shadow → 4`, both plausible members of a two-family draw at that reach.

## 7. Verdict

**READY WITH CAVEATS.** See § 9 caveats below — none are blocking; all are either resolved inline
in the final packet or are pre-existing corpus/engine findings already filed for the batch report
(unchanged from the revised file's § 17).

## 8. Id and shape verification

Every id below was re-checked against live source independently of the draft's and editorial's
own (already thorough) passes. All hold.

| Id / shape | File : line | Status |
|---|---|---|
| `trait.core.core_integrity.virtue` | `src/data/core-trait-content.ts` (seeded via `CORE_TRAIT_DEFINITIONS`) | ✓ confirmed (also referenced `src/data/encounter-content.ts:7546` etc.) |
| `trait.condition.wounded` | `src/data/condition-trait-content.ts:143` | ✓ |
| `trait.condition.terrified` | `src/data/condition-trait-content.ts:175` | ✓ |
| `trait.condition.cursed` | `src/data/condition-trait-content.ts:207` | ✓ |
| `trait.condition.grieving` | `src/data/condition-trait-content.ts:244` | ✓ |
| `trait.condition.location.under_watch` | `src/data/condition-trait-content.ts:323`, duration table `:414` | ✓ |
| `reward_tools_instruments_scroll_case` | `src/data/reward-attachment-catalog.ts:2305` | ✓ |
| `acolyte` / `monk` / `chaplain` at shrine/temple | `src/types/npc.ts:299-301` (temple: 0.9/0.8/0.7), `:341` (shrine acolyte 0.6) | ✓ matches packet's claimed chances exactly |
| `scribe` NPC role | `src/types/npc.ts:62` | ✓ member of the role union |
| 13 `libraryCardId`s (existing hands) | `src/data/nudge-card-library.ts` `CARD_CONTENT` | ✓ spot-checked `card.favor.signature.order` → "Open The Ledger", `card.heavy_hand.signature.force` → "Throw Full Weight", `card.kindled_ambition.signature.spirit` → "Kindle A Wanting", `card.compulsion.signature.mind` → "Plant An Urge", `card.whisper.hunger.witness` → "Read The Architecture" — all used verbatim in the new hand |
| `SCENE_SENTINEL_FIELDS` — full set | `src/engine/encounterAftermath.ts:651-685` | ✓ exactly `targetAgentId, withAgentId, counterpartyId, debtorAgentId, targetFactionId, factionId, targetSublocationId, targetLocationId` — confirms `IntelligenceEffect.targetEntityId` is **not** a member; every `intelligence` effect in the packet correctly omits it |
| `IntelligenceEffect` shape | `src/types/unifiedAction.ts:488-500` | ✓ `targetEntityId?` present on the type but unusable as a sentinel target — matches the packet's finding 3 exactly |
| `ActionScale` union | `src/types/unifiedAction.ts:20` | ✓ `'cosmic' \| 'regional' \| 'local' \| 'personal'` — confirms no `settlement` member, packet's finding 4 exactly |
| `classifyAnchorDeclaration` — `$target`, `$cast:keeper` | `src/data/content-eval/chipAnchorDeclarations.ts:86-107` | ✓ `$target` → `{ok:true, form:'target'}`; `$cast:keeper` → `{ok:true, form:'cast'}` since `keeper` is a declared `supportBundle` key |
| `favor_creation` effect shape | `src/types/unifiedAction.ts:1035-1044` | ✓ `magnitudeRange: [number,number]`, `context: string`, `debtorAgentId?: string` — used correctly in the new hand's Favor grant |
| `assign_ambition` effect shape | `src/types/unifiedAction.ts:626-637` | ✓ `templateId: string` required; `ambition_uncover_secrets` confirmed live (`src/data/ambition-templates.ts:490`) |
| `knowledge` weight at `shadow` | `src/data/content-eval/consequenceDraw.ts:141` | ✓ weight 7, well over the ≥2 swap floor |
| `NudgeCardUnlock` kinds | `src/data/nudge-card-library.ts:320-339` | ✓ exactly `starting`/`milestone`/`god_trait`/`sphere_attunement` — no `favor` kind exists, resolving open question (b) |
| `requiresFavor` field location | `src/types/unifiedAction.ts:1485` | ✓ on `StepNudge`, never on a library member |
| `NudgeRevealKind` | `src/types/unifiedAction.ts:1622` | ✓ single member `'next_step_demand'` — used correctly by the new hand's Whisper card, targeting step 2 |
| Six new `imageTag`s | `src/data/encounter-image-library.ts:628-694` | ✓ `generic.ward`, `generic.energy`, `generic.warmth`, `generic.time-slow`, `generic.crowd` all resolve (five used; see § 9 caveat on tag-count parity below) |

## 9. Caveats (READY WITH CAVEATS, not BLOCKED)

1. **`TraitVariant` is template-scoped, not step-scoped — a real, previously-uncaught finding.**
   `template.traitVariants` (`unifiedAction.ts:2140`) carries no step index. `resolveTraitVariants`
   (`src/engine/encounters/nudges.ts:171-178`) filters purely by held trait id and is invoked by
   `unifiedActionResolution.ts:443` on **every** step resolution, regardless of which step is
   current. `buildNudgePhaseModel` — the function that surfaces `variant.factorLine` in the test
   panel (`buildNudgePhaseModel.ts:632-648`) — is called unconditionally for every non-aftermath
   step (`buildUnifiedEncounterStageModel.ts:862-880`, `allowEmptyHand: choices.length === 0`
   covers step 1's handless case, it does not gate the traitVariant loop). **The consequence:**
   the factor line *"Being True, they will not read it to suit anyone"* and its ±0.05/−0.02
   modifiers apply on **all three steps**, not only step 1 as § 7 of the revised packet claims
   ("this is the step it belongs to"). This is fail-soft (no crash, no invalid state) but is a
   documentation/prose-fit gap: the line reads oddly on step 0 ("Go down unheard") and is at best
   a stretch on step 2 ("Answer the warden," where "read" can be charitably reinterpreted as
   "interpret," but that reading is not obviously available to a player). **FIX-BEFORE-
   IMPLEMENTATION recommendation, applied in the final packet:** either accept the line as a
   template-wide "honesty" statement (drop the § 7 claim that it is step-1-exclusive, since that
   claim is not literally true of the engine), or — cleaner — rephrase the line to read correctly
   across all three steps. The final packet takes the first option and corrects the prose claim,
   since the line's content ("they will not shade what they find/say to please anyone") is a fair
   general statement of the trait and does not need rewriting.
2. **`HAND_COMMON_OPTIONS_MIN`'s code check is looser than the spec's prose.** The spec
   (`nudge-authoring-spec.md:538-540`) says "ungated **common** (sphere-less) option"; the code
   (`nudgeHandChecklist.ts:106-111`) only checks `n.sphere === undefined`, not whether the card is
   also free of `requiredTrait`/`requiredUnlock`/`requiresGroup`/`requiresFavor`. Not a defect in
   this packet — the final hand's common option (`card.whisper.hunger.witness`) is genuinely
   ungated (`unlock: { kind: 'starting' }`) — but worth flagging as a drift surface: a future
   author could satisfy the letter of the code with a trait-gated sphere-less card and miss the
   spec's actual intent. NOTE, not a blocker for this packet.
3. **Image-tag count parity.** The revised packet's § 15 states "No tag repeats across the
   fourteen cards" as a quality property, not a contract requirement (`compositionContract.ts`'s
   Images block only checks resolution, not uniqueness). The final packet's five new tags
   (`generic.ward`, `generic.energy`, `generic.warmth`, `generic.time-slow`, `generic.crowd`) are
   all previously-unused within this encounter, so the zero-repeat property is preserved across
   all nineteen cards. `generic.energy`'s sphere pairing in the situational-art table is `energy`
   — the brief bans the *card member* `card.boost.signature.energy`, not the art asset; using the
   tag on a `force`-signed card is a deliberate, defensible choice, recorded here rather than
   silently made.
4. **`consequenceDraw` arithmetic not re-run by hand.** Confirmed the weight table supports the
   claim (`knowledge: shadow → 7`); did not re-derive the actual seeded hash draw, since that
   requires executing `check:encounter` against a compiled template, which does not exist yet.
   Pass 4 should paste the gate's output as closeout evidence per the packet's own implementation
   note.

All four caveats are either resolved inline in the final packet (1) or are non-blocking
observations (2-4). None require new engine work.

## 10. Primitive Disposition

No missing primitives identified.

---

Priority ruling in one paragraph: editorial correctly identified that the draft's original
justification for the handless step ("an Eye gate must be unbuyable") was wrong, and correctly
struck it — but then built a replacement argument that was *also* wrong, by treating a batch
brief's self-imposed, non-code, non-spec over-exposure table as if it had the same force as the
coded `HAND_SPHERE_COVERAGE_MIN`/`HAND_COMMON_OPTIONS_MIN` floors. `checkNudgeHand` computes both
of those floors strictly **per hand** (`step.nudges` for one step), with zero cross-step or
cross-batch accounting, and nothing in the composition contract, the spec, or the runtime forbids
reusing a sphere or a library member across an encounter's own hands or across encounters in a
family — the spec's actual anti-repetition rule targets a hand's *type composition*, not member
or sphere reuse, and the corpus is explicitly built on repeated member deals. Re-deriving sphere
availability from the actual batch (not the brief's summary of it) found three spheres — `order`,
`force`, `spirit` — dealt **zero** times anywhere in this two-encounter batch, enough on their own
for three of the four required distinct spheres with no policy deviation at all. A fourth
(`mind`, reusing `card.compulsion.signature.mind`) requires one documented override, exactly
mirroring the two overrides the brief itself already recorded for its rolled dice. The third hand
is built into the final packet below: 5 cards, spheres `order`/`force`/`spirit`/`mind`, one
genuinely ungated common option (`card.whisper.hunger.witness` — "Read The Architecture," the
library's own title, and a near-perfect thematic fit for "Read the shelves"), all six
`StepOutcome` bands covered, every card carrying a failure-band fragment, zero digits, and every
named card face pulled verbatim from `CARD_CONTENT`. The one thing Pass 4 must watch: the trait
variant's factor line is template-wide at the engine level, not step-1-exclusive as the prose
claimed — the final packet corrects that claim rather than the (harmless) line itself.

READY WITH CAVEATS
