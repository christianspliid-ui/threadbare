# Encounter Pipeline: One Body Short
> Scale: short (1 step) | Slug: one-body-short | Pass: systems
> Date: 2026-08-24 | Pipeline version: 3.0 (Encounter Factory)

Audited against `Docs/plans/encounters/one-body-short-revised.md` (the editorially-approved
packet). Every id, constant, and mechanism claim below was checked against the live source in
this worktree, not against the packet's own assertions — the packet's self-audits are correct
almost everywhere they claim to be, and this file records where that was verified and the one
place it was not.

---

## 1. The sequel contract — verified from this end

**Cast key.** `standing-the-line-revised.md:53,179-197` binds the crossing person under `key:
'survivor'` and states explicitly: *"The key is `survivor`, and it is a cross-encounter
contract... `encounter.border.one_body_short` binds the crossing person under exactly that
key."* `one-body-short-revised.md:742` declares `key: 'survivor'`. **Match confirmed — no drift
between the two drafts on this point.**

**`inheritContext` mechanism — read from the engine, not assumed.** `src/engine/
encounterAftermath.ts:1541-1550` (the `encounter_seed` effect handler):

```ts
const inheritedContext = effect.inheritContext && action
  ? { inheritedTargetId: action.targetId, inheritedBindings: action.supportBindings }
  : undefined;
```

So `inheritContext: true` copies **the source action's own `targetId` and `supportBindings`**
onto the seed — nothing more, nothing symbolic. At spawn time, `src/engine/
encounterSeeding.ts`'s `resolveSeedInheritance` re-validates: `inheritedTargetId` becomes the
child action's `targetId` **iff** the node still exists in the graph; otherwise the child falls
back to `seed.targetAgentId`, which itself defaults to the acting agent (self-target) when the
effect declared no explicit `targetAgentId`. `inheritedBindings` are filtered to survivors and
flow into the child's `supportBindings` unconditionally (this is the path that carries
`survivor` across — confirmed correct and independent of the target question).

**This resolves half of § 8.4(b) and leaves the other half open, exactly as the packet
flagged.** Whether `secret_discovery`'s `knows_secret_of` write lands on the crossing person
under the seeded route depends entirely on **what `encounter.border.standing_the_line`'s own
action targets** — and that is not yet declared. Neither `standing-the-line-draft.md` nor
`standing-the-line-revised.md` states an explicit `targetId` for the parent's `Personality Fork`
action; the surrounding prose (bond formed with `$cast:survivor`, `favor_creation` debtor
`$cast:survivor`) is consistent with the pilgrim being the target, but nothing in either draft
commits to it as `action.targetId` specifically. **§ 8.4(a)/(b)'s "reconcile with row 4's draft
before compile" stands as written** — this is not resolved and cannot be resolved from this
side. Recorded as the packet's own caveat, confirmed still live.

**Bare `?spawn=` route — traced end to end, and it does NOT survive.** This is the one place
the packet's own audit was optimistic rather than verified, and Pass 3 exists to catch that.

`GameView.tsx:2244` calls `debugSpawnEncounter('@hero', templateId, { open: true, courtPosition:
'the_first' })`, which calls `prepareDebugEncounterSpawn` (`src/engine/debugEncounterTools.ts:
368-440`). That function unconditionally sets:

```ts
const action = createUnifiedAction({
  actorId: agent.id,
  templateId: unifiedTemplate.id,
  targetId: locationId,   // ← the agent's own location node, always
  ...
```

There is no code path from a bare `?spawn=` URL to a target other than the acting agent's
current location — `DebugSpawnEncounterOptions` has exactly two fields (`courtPosition`,
`open`), neither of which can name a target. So under a bare `?spawn=` firing:

1. `action.targetId` = a **location** node, never an actor.
2. `secret_discovery` (`encounterAftermath.ts:4209-4248`) reads `action?.targetId`, finds the
   location node (it exists, so the "target node missing" trace does not fire), and calls
   `createSecretEdge` → `socialEdgeEndpointsPermit` → `checkSocialEdgeEndpoint`
   (`src/engine/secretGeneration.ts:325-337`), which refuses because `node.type !== 'actor'`.
   The write silently no-ops with a traced `endpoint_refused_not_an_actor` — fail-soft, no
   crash, but **no `knows_secret_of` edge is created.**
3. The `short.the_unsaid` chip's `$target` anchor does **not** fail closed. `resolveAnchorDeclaration`
   (`src/data/content-eval/chipAnchorDeclarations.ts:166-167`) returns `context.targetId`
   unconditionally for the `$target` sentinel, and `buildUnifiedEncounterStageModel.ts:753`
   feeds it `activeAction.targetId` — the same location id. The chip therefore renders,
   anchored to the location, declaring `visualKind: 'agent'` for a node that is not one — a Law
   56 violation (the chip claims a write that did not happen, at an entity that is the wrong
   kind) rather than a graceful hide.
4. The `{target}` enrichment token in the same chip's `detail` (*"They now hold a secret about
   {target}: what {target} watched leave this ground and did not report"*) degrades the same
   way but not the same shape: `resolveSceneTargetContext` (`src/engine/proseEnrichment.ts:
   271-292`) explicitly handles a location-kind target — it does not fail, it substitutes the
   **location's name** for `{target}`. The sentence becomes grammatically well-formed and
   substantively false (*"a secret about Thornwood Camp: what Thornwood Camp watched leave..."*)
   — a place does not watch or fail to report.

**Verdict on this question:** under the seeded route, correctness is contingent on row 4's
still-undeclared target (open, tracked). Under the bare `?spawn=` review route, the
`critical_success`/`success` bands' `short.the_unsaid` chip is **confirmed broken as currently
authored** — not by this encounter's design, but by a gap in `prepareDebugEncounterSpawn`
shared by every encounter whose success-side secret is anchored on `$target` and reviewed via
`?spawn=` rather than fired through its natural seed. This is real, traced, and non-hypothetical
— it is not the encounter's TypeScript that is wrong, it is the review tool's target selection.
See § 5 (Missing Primitives) and § 8 (Primitive Disposition).

**Everything else in the pole-agnostic contract holds.** No line in the packet depends on which
pole the parent took, no line assumes the agent was present at the fight, and the survivor is
never gendered — verified by reading every player-facing string listed in the packet's own
§ 8.3 table against both `standing-the-line-draft.md`'s poles. Nothing there contradicts what
the parent (draft or revised) commits to.

---

## 2. The consequence swap — verified against the gate function and a live draw

Ran the actual draw: `npm run draw:consequences -- encounter.border.one_body_short --reach eye
--rarity 2` returns exactly:

```
▸ secret   [weight 7 in eye]
▸ thread   [weight 3 in eye]
```

This confirms the drawn hand the packet's swap is computed against: `['secret', 'thread']`.
Feeding that through `handAfterSwap` (`src/data/content-eval/consequenceDraw.ts:266-282`) with
`swap: { from: 'thread', to: 'omen' }` produces `['secret', 'omen']`, sorted — which matches
`consequenceDraw: ['secret', 'omen']` exactly. `checkConsequenceDraw`
(`consequenceDraw.ts:348-420`) will therefore report zero violations on this template:

- `swap.from` (`thread`) is in the drawn hand ✓
- `swap.to` (`omen`) is not already in the drawn hand ✓
- `omen`'s weight in `eye` is **4** (`CONSEQUENCE_FAMILY_WEIGHTS.omen.eye`, line 149) — matches
  the packet's claim exactly, and clears `CONSEQUENCE_SWAP_MIN_WEIGHT` (2) ✓
- `swap.reason` is non-empty ✓
- recorded set === expected set ✓

**`emit_omen` is confirmed absent from both `PERSISTENT_EFFECT_KINDS` and
`CHIP_BACKING_EFFECT_KINDS`** (`src/data/content-eval/compositionContract.ts:116-155,199-230`) —
the module's own comment names it explicitly: *"`emit_omen` is the debatable one... but this
module already classifies it as scene dressing."* Nothing in this packet chips it, correctly.

**`allAftermathEffects` confirmed to walk only `variant.reactions`, `band.reactions`, and step
`successMetadata`/`failureMetadata` effects** (`compositionContract.ts:337-353`) — it does not
touch card `grants` anywhere in its walk. So the `omen` family, as the packet argues, can only be
satisfied by the reaction's `emit_omen` (§ 7.3, `short.say_the_count`), never by the Omen card's
grant. **Confirmed correct as designed** — the family is genuinely wired in context, and the
draw gate will pass.

---

## 3. Every declared id, checked against the live union / registry

| Claim | Verified against | Result |
|---|---|---|
| `quintessence_shift` shape `{ kind; delta; targetAgentId?; source?; when? }` | `src/types/unifiedAction.ts:466-474` | **Exact match**, including the THR-1082 doc comment ("Surfaces as a SCAR when negative... Never renders a number") |
| `SUCCESS_BANDS` includes `success_at_cost` | `compositionContract.ts:79-85` | **Confirmed** — `['success', 'contested_won', 'critical_success', 'success_at_cost']` |
| `isStepSuccess` routes `success_at_cost` to `successMetadata`, not `failureMetadata` | `src/types/unifiedAction.ts:2466-2468` (`isStepSuccess` returns true for `critical_success/success/success_at_cost/near_miss`) | **Confirmed** — the packet's § 7.4 rationale for re-declaring reactions on `success_at_cost` is mechanically correct |
| `applyAftermathOutcomeBand` substitutes `reactions`/`changes` wholesale, never merges | `src/types/unifiedAction.ts:1930-1944` — `reactions: band.reactions ?? variant.reactions` | **Confirmed** — the band-level re-declaration of both reaction stances on `success_at_cost` is necessary, not decorative |
| `trait.condition.grieving` live, `domainContributions: { heart: -0.08, eye: -0.05 }` | `src/data/condition-trait-content.ts:244-263` | **Byte-exact match** |
| `trait.core.core_warmth.virtue` live | `src/data/core-trait-content.ts:46-49` (`core_warmth` continuum, `virtue` pole flavor authored) | **Confirmed live** |
| `IntelligenceCategory.military_position` | `src/types/unifiedAction.ts:69-74` | **Valid member** |
| `OmenCategory.cultural` | `src/types/omen.ts:17` | **Valid member** |
| `EmittedOmenScope { kind: 'global' }` | `src/types/omen.ts:137-140` | **Valid shape** |
| `HiddenMarkCategory.secret_knowledge` | `src/types/unifiedAction.ts:106-115` | **Valid member** |
| `resolveTooltip` has no `secret.*` prefix | `src/engine/tooltipResolver.ts` — prefixes are `ui, sphere, reach, terrain, archetype, faction, doom, agent, quintessence, attachment, location, knowledge, mandate` | **Confirmed** — no `secret` prefix exists; the packet's "no tooltipId" decision for the secret chip is correct, not a workaround |
| `classifyAnchorDeclaration` accepts `$actor`, `$target`, and `trait.condition.grieving` (as `attachment_template`) | `src/data/content-eval/chipAnchorDeclarations.ts:86-137` | **All three confirmed** to classify OK |
| `addNudgeIds` on `traitVariants` is a live field | `src/types/unifiedAction.ts:1639` | **Confirmed** |

**Card faces, spot-checked byte-for-byte against `CARD_CONTENT` in `src/data/
nudge-card-library.ts`:**

| `libraryCardId` | Library title / quote | Packet's card | Match |
|---|---|---|---|
| `card.boost.core` | "A Little More" / "Most things fail by a margin." | Card 2 | ✓ exact |
| `card.trait_card.core` | "Who They Are" / "Character is the one resource nobody spends." | Card 6 | ✓ exact |
| `card.whisper.signature.light` | "Plain Sight" / "Nothing was hidden. It was only unlit." | Card 1 | ✓ exact |
| `card.boost.signature.energy` | "A Sudden Surge" / "Bodies hold more than they admit." | Card 3 | ✓ exact |
| `card.omen.signature.time` | "This Has Happened" / "Nothing happens only once." | Card 4 | ✓ exact |

All five confirmed byte-identical. `card.long_game.hunger.sever` ("The Thread Cut") confirmed as
the library's **only** `long_game` member (`nudge-card-library.ts:645-648`), and it is the sole
entry under a hunger-unique key — the packet's claim that `long_game` has "no core and no sphere
signature member" is confirmed by inspection of the same table.

**`imageTag` rows, all six confirmed live** in `src/data/encounter-image-library.ts:612-640`
(`ENCOUNTER_IMAGE_LIBRARY`), and the "row subject" quoted in the packet's § 11 table matches the
library's own inline comment verbatim for all six (`generic.light`, `generic.focus`,
`generic.vigor`, `generic.time-slow`, `generic.dark`, `generic.memory`). One cosmetic
observation, not a defect: `generic.vigor`'s library row tags it sphere `life`, while the card
using it (`A Sudden Surge`) is sphere `energy` — the tag/sphere mismatch is harmless (art tags
are not sphere-locked; the genericity test the packet runs is the actual gate), but noting it so
a future author does not read the tag's row as a sphere-authority.

**`supportBundle` class-honesty, re-verified against the live rosters** (`src/engine/
npcSeeding.ts:49-65` `SUBTYPE_TO_ROSTER_KEY`, `src/types/npc.ts:214-340`
`LOCATION_ROLE_ROSTERS`):

| Class | Subtype → roster key | Roles present |
|---|---|---|
| `wayside` (camp) | `camp` → `military_outpost` | `mercenary` (0.7), `scout` (0.8) ✓ |
| `wayside` (wilderness) | `wilderness` → `wilderness` | `ranger` (0.3), `wanderer` (0.3) ✓ |
| `wayside` (oasis) | not a key in `SUBTYPE_TO_ROSTER_KEY` → unmapped | spawn path ✓ |
| `stronghold` (castle) | `castle` → `capital` roster | `mercenary` (0.6) ✓ |
| `stronghold` (fort) | `fort` → `military_outpost` | `mercenary` (0.7), `scout` (0.8) ✓ |
| `ruin` (all five subtypes) | `ruin` → `null` | spawn path ✓ |
| `battlefield` (`battleground`) | not a key at all → `null` | spawn path ✓ |

**Every cell the packet claims is confirmed exactly**, including the one subtlety that a naive
read would miss: `castle` resolves through the shared **`capital`** roster (which does carry
`mercenary` at 0.6), not the separate `castle` roster entry in `LOCATION_ROLE_ROSTERS` (which
has no `mercenary`) — `SUBTYPE_TO_ROSTER_KEY` maps `castle: 'capital'`, so the `capital` roster
is the one that actually applies. The packet's table already gets this right.

---

## 4. Registration shape — confirmed still current

`ROAD_AMBUSH_TEMPLATE` (the canonical example the pipeline's own prompt names) is imported at
`src/data/unified-action-templates.ts:193` and registered at two array sites:

- **Line 5590** — inside the array literal that becomes `RAW_UNIFIED_ACTION_TEMPLATES` →
  `UNIFIED_ACTION_TEMPLATES` (line 5636), the main action registry every system reads.
- **Line 5678** — inside `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (declared line 5656), the
  second array that "supplements into the [location] cache separately (THR-452)" per its own
  doc comment, because location-subtyped branching templates authored outside
  `encounter-content.ts` are not otherwise picked up by the location encounter cache.

**Both array sites still exist at those line numbers and both patterns are unchanged.** The
implementation agent registers `ONE_BODY_SHORT_TEMPLATE` the same way: one import near line 193,
one entry in the main registry array (~5590 region), one entry in
`LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (~5678 region) because this template declares
`locationSubtypes` via `expandSettings(...)` and is authored outside `encounter-content.ts`.

---

## 5. Missing Primitives

**None that block compile.** Every mechanic the packet declares — `ActionStepBranch`,
`encounter_seed`+`inheritContext`, `hidden_mark`, `intelligence`, `emit_omen`,
`quintessence_shift`, `secret_discovery`, `condition_attachment`, `traitVariants`+`addNudgeIds`,
band-level `reactions` substitution — is live, and every id it names resolves.

**One real gap, corpus-wide, not this-encounter-specific: `prepareDebugEncounterSpawn` (and
therefore the `?spawn=` URL flag) has no way to target anything but the acting agent's current
location.** `DebugSpawnEncounterOptions` carries only `courtPosition` and `open`. Any encounter
whose success-side consequence is anchored on `$target` via `secret_discovery` and whose only
review route is `?spawn=` (rather than firing through a live seed with a real inherited target)
hits the same silent no-op this audit traced for `short.the_unsaid`. This is not new to One Body
Short — it is the first encounter to expose it because it is the corpus's first
sequel-payoff-only-content review case. Scope estimate: adding a `targetQuery?: string` field to
`DebugSpawnEncounterOptions`, threaded through `prepareDebugEncounterSpawn` to resolve via the
same `findAgent`/binding logic the support bundle already uses, and a matching `&target=` URL
param — small, self-contained, `src/engine/debugEncounterTools.ts` and
`src/components/Game/GameView.tsx` only. **BACKLOG**, not a blocker: the seeded route (once row
4's target is settled) and CLI-driven testing via `spawn encounter-context ... --agent <survivor>`
both sidestep it for actual playtesting; `?spawn=` review of the two secret-bearing bands
specifically is what is affected.

---

## 6. Runtime Feasibility

- **Beat count:** 1 plain step, `eye`, `difficulty: 0.40`. Fully within `NUDGE_OFF_REACH_MAX_DIFFICULTY`
  (0.45, `nudgeAuthoringConstants.ts:150`) even though the packet correctly notes the ceiling
  does not bind at this `intrinsicTier`.
- **Branching profile:** none at the mortal level — `aftermathConfig: { branchOnStep: 0,
  variants: {}, fallback: {...} }`, choice-less, as declared. No `ActionStepBranch` authored on
  the step itself (single plain step). Matches a `Single Test` shape exactly.
- **Outcome ladder:** 6 `StepOutcome` bands on the step (5 afterimages authored, `near_miss` has
  none by design — confirmed `ActionStep` types the field as optional and every other
  short-scale template in the corpus follows the same convention). 5 `UnifiedActionOutcome`
  `byOutcome` bands on the aftermath (`critical_success`, `success`, `success_at_cost`,
  `failure`, `critical_failure`) — above the floor of 3, correctly omits `contested_won`/
  `contested_lost` (this template is never contested) and `near_miss` (not a member of
  `UnifiedActionOutcome`).
- **Aftermath wirable:** confirmed end to end in § 1–3 above. `emit_omen`, `secret_discovery`,
  `condition_attachment`, `quintessence_shift` all resolve to real handlers in
  `encounterAftermath.ts` and none throws on a malformed input (fail-soft NFP #4 upheld
  throughout — even the traced `?spawn=` gap degrades to a silent no-op, never a crash).

**Forecast arithmetic, computed:** difficulty `0.40` + summed hand `forecastDelta` `0.41`
(packet's own sum, spot-checked: `0.10 + 0.06 + 0.09 + 0.05 + 0.04 + 0.07 = 0.41` ✓) = `0.81`,
inside `[0, 1]` ✓.

**Dealt-hand count for a mid-game god, after gating:** the hand is 6 authored cards, one of
which (`short.who_they_are`, the trait card) is hidden entirely without `trait.core.core_warmth.virtue`.
No essence gate excludes anything else in this hand — five of six cards cost 1–2 essence and
none carries an essence floor the packet flags as a filter risk, and no other card carries a
`requiredTrait` or a value-axis gate. So the dealt range is **5 (without the trait) to 6 (with
it)** — inside the contract's 4–6 dealt band the packet cites, and not the "decorative-hand"
failure mode the prompt's own reminder warns about (no card in this hand sits behind an essence
floor high enough to be routinely un-dealt).

---

## 7. Aftermath Supportability

- **Reputation channels:** none authored in this template — correctly so; the packet's own
  audit table confirms "no `reputation_tally` chip anywhere," and `check:encounter` would flag
  one if present without a corresponding draw.
- **Conditions creatable:** `trait.condition.grieving` confirmed live and byte-matched (§ 3).
  `condition_attachment` is in `PERSISTENT_EFFECT_KINDS` and `CHIP_BACKING_EFFECT_KINDS`.
- **Follow-on hooks:** the hidden mark (`revealFamilies: ['encounter.border']`) uses prefix
  matching (`familyMatchesTemplate`), confirmed live and matching every template in this batch
  and future `encounter.border.*` content, per the same mechanism the parent packet documents at
  `standing-the-line-draft.md:810-813` for its own hidden mark.

---

## 8. Primitive Disposition

**No missing primitive blocks compile.** One item is **BUILD-ADJACENT / BACKLOG**:

- **`DebugSpawnEncounterOptions.targetQuery`** (or equivalent `&target=` URL support) — see § 5.
  Not required to ship this template; required to make the `?spawn=` review route honestly
  exercise the `critical_success`/`success` bands. File as a Deferral against the batch project,
  labeled `Deferral`, with a comment pointing at this file's § 1 (bare-`?spawn=` trace) and § 5.

**Two items already correctly recorded by the packet as its own open surface, reconfirmed here
rather than re-litigated:**

- § 8.4(a)/(b) — cast-key match is confirmed (not open); the **target binding** is genuinely
  open pending row 4's own declared `action.targetId`, and this file's § 1 traces exactly what
  breaks if row 4 targets a place instead of the survivor (the `secret` family becomes wired at
  the gate and dead at runtime — the identical failure shape the packet already diagnosed for
  the `thread` swap, on a different field).
- § 8.4(c) — no `secret.*` tooltip prefix exists; confirmed, out of scope for this batch.

---

## 9. Composition Contract — walked block by block

| Block | Verdict | Basis |
|---|---|---|
| **Steps** | PASS | 1 plain step, `eye`, `difficulty: 0.40`, `narrativeTemplate` present, `failBehavior: 'fail_action'` valid |
| **Hand** | PASS | 6 cards on the one step; every rule in the packet's own § 4 table independently re-checked in § 3 above (library ids, image tags, grant shapes) — all confirmed live |
| **Setting** | PASS | 4 classes declared and opened (`wayside`, `ruin`, `battlefield`, `stronghold`); `expandSettings(...)` is the live derivation path used corpus-wide |
| **Cast** | PASS | 1 actor binding, class-honest at all four classes (§ 3 table), cast key `survivor` confirmed matching the parent's declared key |
| **Rewards** | PASS | `rewardPool` (possession) + `condition_attachment` + `secret_discovery` — three persistent routes, all in `PERSISTENT_EFFECT_KINDS` |
| **Aftermath** | PASS | `aftermathConfig` present; 5 `byOutcome` bands (floor 3); every variant carries an `overview`; every `change` declares non-empty `concepts`; every declared anchor (`$target`, `$actor`, `trait.condition.grieving`) classifies via `classifyAnchorDeclaration`; every chip backed on its own band, including the `success_at_cost` re-declaration verified mechanically correct in § 3 |
| **Systems** | PASS | `cast`, `rewards`, `conditions` — 3 from the authored manifest, at the floor |
| **Images** | PASS | 6 of 6 `imageTag`s resolve to real `ENCOUNTER_IMAGE_LIBRARY` rows (§ 3); no `illustrationUrl` declared, correctly falls through the documented EntityVisual chain |
| **Consequence draw** | PASS | `['secret', 'omen']` verified against a live run of `npm run draw:consequences` (§ 2); swap satisfies every clause of `checkConsequenceDraw` |

**No block fails.** The one substantive finding of this audit (§ 1, bare-`?spawn=` route) is a
**runtime review-tooling gap**, not a Composition Contract violation — `check:encounter` has no
way to see it, because the contract is a static/build-time gate over the template's declared
shape, and the template's declared shape is correct. The gap only manifests when a specific
debug URL flag is used to review this specific encounter outside its natural seed.

---

## 10. Enrichment — one correction to the packet's own claim

Every `{...}` token actually authored in this packet resolves: `{cast:survivor}` (THR-696, live,
declared key), `{target}` (THR-694, live — and, per § 1, degrades to a location's name rather
than failing under a mis-targeted action; not a token-resolution defect, a target-value defect).

**One imprecision, non-blocking.** § 7.3 and § 10 of the revised packet both describe the
reaction's `narrativeHook` as feeding "`{omen}` enrichment." There is no bare `{omen}` token in
`enrichProse` (`src/engine/proseEnrichment.ts:668-672`) — the live tokens are `{omen_adj}`,
`{omen_verb}`, `{omen_noun}`, and `{omen_atmosphere}`, all populated from active omen tracks.
This does not affect this packet, which authors no `{omen*}` token anywhere in its own prose —
the claim is describing a downstream consumption path (other encounters' prose reading omen
vocabulary once this one is active), not a token this template must resolve. Worth a one-word
fix (`{omen}` → `{omen_*}` vocabulary) if this file is read again, but it blocks nothing.

---

## 11. Implementation File Map

- **`src/data/encounters/one-body-short.ts`** (new) — the `ONE_BODY_SHORT_TEMPLATE`
  `UnifiedActionTemplate`, following the `ROAD_AMBUSH_TEMPLATE` / `road-ambush.ts` shape: one
  plain step, `supportBundle`, `aftermathConfig` with `fallback` + `byOutcome`, `consequenceDraw`
  + `consequenceSwap`, `imageTag`s, `locationSubtypes` via `expandSettings(...)`.
- **`src/data/unified-action-templates.ts`** — one import line near 193; one registration entry
  in the array feeding `UNIFIED_ACTION_TEMPLATES` (~5590 region); one registration entry in
  `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES` (~5678 region). See § 4.
- **No engine changes required.** Every effect kind, sentinel, and mechanism this template uses
  is already live.
- **`src/data/content-eval/plotHooks.ts`** — stamp `usedBy` on `death_and_return` at closeout,
  per the packet's own § 0d note.
- **Test coverage (new or extended):** a template-shape test alongside the corpus convention
  (`src/data/encounters/__tests__/` or wherever `road-ambush` / `flawed-steel` are tested) —
  `check:encounter`, `checkNudgeHand`, `checkConsequenceDraw`, and the Composition Contract all
  run over the full corpus already, so no bespoke test is required beyond registering the
  template; a CLI smoke (`spawn encounter <agent> encounter.border.one_body_short`) is the
  cheapest live-fire check, and doubles as the manual workaround for the `?spawn=` target gap in
  § 5.
- **Deferral to file (Linear):** `DebugSpawnEncounterOptions` target-override gap — see § 5, § 8.
- **Row 4 reconciliation (blocking, not this file's to close):** `standing-the-line-*` must
  declare its own action's `targetId` as the crossing person before this template's seeded route
  can be trusted for the `secret` family. Flag in the batch's coordination, not a code change
  here.

---

## Verdict

**READY WITH CAVEATS**

Caveats, in order of what to attack first:

1. **Row 4 target-binding reconciliation (§ 1, § 8.4(a)/(b)).** `encounter.border.
   standing_the_line` must declare its own action's `targetId` as the crossing person (the
   `survivor`/pilgrim), not a location, or this template's `secret_discovery` write is wired at
   the gate and dead at runtime under the seeded route — the identical failure shape already
   diagnosed and swapped away for the `thread` family, recurring on a different field. Not this
   template's code to fix; a coordination item with row 4's author before either compiles.
2. **The bare `?spawn=` review route does not correctly exercise the `critical_success`/`success`
   bands (§ 1, § 5).** Traced end to end: `action.targetId` resolves to a location under
   `?spawn=`, `secret_discovery` silently refuses to write (correct fail-soft, but no edge), and
   both the `$target` chip anchor and the `{target}` enrichment token degrade to the location
   rather than failing closed — rendering a chip and a sentence that are grammatically fine and
   substantively false. This is a gap in `prepareDebugEncounterSpawn`'s target selection, not in
   this template. Backlog a `targetQuery` option (small, scoped, two files) rather than blocking
   on it; review these two bands via the seeded route or CLI `spawn encounter-context ... --agent
   <survivor>` in the meantime.

Everything else audited clean: the consequence swap is mechanically verified against a live run
of the draw and against `checkConsequenceDraw`'s exact clauses; every effect kind, category
member, trait id, condition id, library card id, and image tag resolves against the live
runtime; the `success_at_cost` band's reaction re-declaration is confirmed necessary and correct
against `applyAftermathOutcomeBand`'s actual substitution semantics; class-honesty on the support
bundle is confirmed against the live rosters at all four settings; and the registration shape at
`unified-action-templates.ts` is confirmed current at the exact line numbers the pipeline's own
prompt names.
