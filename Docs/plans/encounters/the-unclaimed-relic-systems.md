# Encounter Pipeline: The Unclaimed Relic

> Scale: short (Single Test) | Slug: the-unclaimed-relic | Pass: systems
> Date: 2026-08-24 | Pipeline version: 2.0

---

## 0 · Method

I re-verified the packet against live source directly, not against the draft's or the editorial pass's own citations, per the systems-prompt's instruction to re-verify anything load-bearing. Every id, field name, and constant cited below was opened and read in this session (`src/types/unifiedAction.ts`, `src/types/encounter.ts`, `src/types/npc.ts`, `src/types/coreRegistry.ts`, `src/engine/encounterAftermath.ts`, `src/engine/nudgeGrantLiveness.ts`, `src/engine/encounterSupportBundle.ts`, `src/engine/npcSeeding.ts`, `src/engine/attachmentTemplateIndex.ts`, `src/data/artifact-templates.ts`, `src/data/reward-attachment-catalog.ts`, `src/data/condition-trait-content.ts`, `src/data/core-trait-content.ts`, `src/data/nudge-card-library.ts`, `src/data/encounter-image-library.ts`, `src/data/default-support-bundles.ts`, `src/data/settingClasses.ts`, `src/data/content-eval/compositionContract.ts`, `src/data/content-eval/chipAnchorDeclarations.ts`, `src/data/content-eval/consequenceDraw.ts`, `src/data/content-eval/nudgeHandChecklist.ts`, `src/data/content-eval/nudgeAuthoringConstants.ts`, `src/data/unified-action-templates.ts`, `src/data/encounters/vertical-slice.ts`, `src/data/encounters/road-ambush.ts` + its test, `.claude/skills/encounter-pipeline/reference/anchor-catalog.generated.md`). Everything below either confirms or corrects the packet's own citations — nothing is inherited on trust.

I did **not** re-litigate prose, the hook-drift ruling, the one-reaction-per-band ruling, or gate question 13's honesty correction — Pass 2 (editorial) already ruled on all three with reasons I find sound on inspection of the mechanism (`AftermathOutcomeOverride`'s `changes`/`reactions` siblings), and re-arguing them is outside this pass's job.

---

## 1 · Support Bundle Honesty

**Delivery mode: realistic, and correctly chosen.** `lazy-materialize-on-trigger` + `must-persist` is exactly right for a bundle four of five bands write a `bond_change` against. Confirmed in `src/types/encounter.ts:201-206`: `EncounterSupportPersistence = 'must-persist' | 'scene-only'`, `EncounterSupportDelivery` includes `'pre-seeded'` and `'lazy-materialize-on-trigger'` as distinct members — the packet's contrast between the two is not invented vocabulary.

**Materialization is unconditional, which makes the "class-honesty" table academic rather than load-bearing.** `materializeActorSupport` (`src/engine/encounterSupportBundle.ts`) spawns a new actor node whenever `findExistingActorSupport` fails to find a reusable NPC — reuse is attempted first, but the bundle *always* produces a claimant, reused or freshly minted as "Orin Vask". So even at a class where nothing seeded reuses, the encounter still functions; the class-honesty check is a fiction-plausibility audit ("would a scout/ranger/mercenary plausibly be standing here"), not a runtime-correctness one. Worth saying plainly since the packet's prose treats it as though a missing binder would break something — it would not.

**One real citation error found, corrected here.** The packet's § 11 table attributes the stronghold class's reuse capability to `LOCATION_ROLE_ROSTERS.castle` (`src/types/npc.ts`) and an implied `fort:` roster row. Neither is what worldgen actually seeds:

- `LOCATION_ROLE_ROSTERS` has no `fort` key at all. `src/engine/npcSeeding.ts:55` maps location subtype `fort` to roster key **`military_outpost`** (`SUBTYPE_TO_ROSTER_KEY`), whose roster (`src/types/npc.ts:308-317`) is `commander, quartermaster, scout, mercenary, paladin, spellsword, marshal, guard` — this is where `scout`/`mercenary` actually come from at a fort, not a nonexistent `fort` row.
- `castle` locations do **not** seed from `LOCATION_ROLE_ROSTERS.castle` (the `noble/marshal/guard_captain/guard/steward/herald/spy/attendant` row the packet cites) — `npcSeeding.ts:55` maps subtype `castle` → roster key `capital`. The `castle:` roster row in `types/npc.ts` is dead for seeding purposes; nothing in `npcSeeding.ts` ever looks it up by that key. The `capital` roster does carry `mercenary` (0.6) and does **not** carry `steward` or `attendant`.

**The functional conclusion still holds under the correct mapping**, which is why this doesn't move the verdict: `military_outpost` (the real fort roster) carries both `scout` and `mercenary`; `capital` (the real castle roster) carries `mercenary`. So "scout, mercenary" as the stronghold class's binders is still true — just for a different, uncited reason. This is also not a defect original to this packet: `src/data/default-support-bundles.ts:346-347` states its own reuse lists are "drawn from the roles worldgen actually seeds at that class's subtypes (`LOCATION_ROLE_ROSTERS` in `src/types/npc.ts`)" — the same simplification, already shipped as the file's own header comment. The packet inherited an existing house convention rather than introducing a new error. Flagged for precision, not blocking, and not this packet's job to fix upstream.

**Persistence and register.** `must-persist` is correct given the bond writes. Gender-neutral prose was spot-checked against the ten claimant-touching sentences quoted in the packet; none carries a pronoun.

---

## 2 · Missing Primitives

None. Checked against the live-primitives list in the systems prompt and against the packet's own usage:

- No `ActionStepBranch` needed — `Single Test` shape, one plain step, confirmed no branch node in the design.
- `BranchAwareAftermathConfig` not needed — `aftermathConfig.branchOnStep: 0` with `variants: {}` and a single `fallback` carrying `byOutcome`, which is the choice-less shape `AftermathVariant`/`AftermathOutcomeOverride` (`src/types/unifiedAction.ts` ~1895-1913) support directly.
- `encounter_seed` — deliberately unused (brief allocates seeding to row 4). Confirmed live regardless (`nudgeGrantLiveness.ts` and `compositionContract.ts` both list it).
- `hidden_mark` — deliberately unused (brief's avoid list). Confirmed live.
- `intelligence` — not needed; no intelligence record authored.
- `AuthoredChoiceCard` — not needed; `Single Test` has no player choice, confirmed by the design block (§1 q6) and the shape itself (no `authoredChoices` anywhere in the packet).

No new engine primitive, effect kind, or schema field is required to implement this encounter.

---

## 3 · Runtime Feasibility

**Beat count.** One plain step, inside `COMPOSITION_STEPS_MIN`–`COMPOSITION_STEPS_MAX` (1–3), confirmed at `src/data/content-eval/compositionContract.ts:63-64`.

**Branching profile.** None — `Single Test`, zero branches, which is a valid `short`-scale shape (0 or 2 branches; 1 is invalid, per the editorial pass's citation of `SKILL.md` § Scale Enforcement, not independently re-checked here as it is a pipeline-config claim rather than a runtime one).

**Outcome ladder tiers.** Five of six `StepOutcome` bands authored (`critical_success`, `success`, `success_at_cost`, `failure`, `critical_failure`) via `aftermathConfig.fallback.byOutcome`; `near_miss` and the two contested bands correctly fall through to `fallback.overview` with no override, which is the intended behavior for an uncontested single-actor test — `contested_won`/`contested_lost` are structurally unreachable here and the packet is correct not to author them.

**`successMetadata`/`failureMetadata` step-outcome effects.** Confirmed field shapes exact against `src/types/unifiedAction.ts:557-573` (`apply_condition`: `conditionTraitId`, `durationTicks`, `targetAgentId` et al.) and `:717-733` (`spawn_artifact`: `templateId?`, `category?`, `tier?`, `nameOverride?`, `tags?`, `targetAgentId?`, `targetLocationId?`, `messageOverride?`). The packet's usage of both matches the live type exactly, field for field. Confirmed `isStepSuccess` counts `near_miss` as success (`src/types/unifiedAction.ts` ~2490-2506, the afterimage-selector comment says so explicitly and the packet's claim about `successMetadata` firing on `near_miss` matches).

**Aftermath wirability.** All ten authored chips resolve to a live write per Law 56 — see § 6 below (chip-backing walk). Confirmed the sole mechanism the packet leans on: `AftermathOutcomeOverride` (`src/types/unifiedAction.ts`, `overview? / changes? / reactions?`) carries `changes` and `reactions` as independent optional siblings, so a band's `changes` render regardless of which of its (here, exactly one) reactions the player picks. One reaction per band is therefore the only structure under which every chip is unconditionally backed — verified by reading the interface, not by trusting the packet's argument.

---

## 4 · Aftermath Supportability

**Reputation channels.** None authored — correctly N/A; the brief allocates reputation to other rows and the systems quota does not require it.

**Conditions creatable.** All three condition ids resolved live at the packet's own cited lines:
- `trait.condition.terrified` — `src/data/condition-trait-content.ts:175`
- `trait.condition.wounded` — `src/data/condition-trait-content.ts:143`
- `trait.condition.location.under_watch` — `src/data/condition-trait-content.ts:323`, with a duration entry at `:414`, and `condition_attachment.targetLocationId` confirmed to exist on the live effect type for exactly this purpose (THR-1143 comment: "Put the condition on a place instead of a person").

**Follow-on hooks.** `trait.core.core_humility.vice` confirmed built by `CORE_TRAIT_DEFINITIONS` from `src/types/coreRegistry.ts:150-157` (continuum `core_humility`, vice word `Proud`) via the id-builder at `src/data/core-trait-content.ts:72` (`` `trait.core.${continuumId}.${pole}` ``); flavor text verbatim at `core-trait-content.ts:59`. It is a seeded definition (`CORE_TRAIT_DEFINITIONS`, `core-trait-content.ts:106`), so it is not on any dead-ref list.

**Grant liveness (the two `grants` blocks).**
- `attachment_grant.templateId: 'reward_tools_instruments_iron_tongs'` — confirmed live at `src/data/reward-attachment-catalog.ts:870`, tier 1, tags `#stone #tool #craft`, `lossCondition: 'breakable'`, flavor text verbatim. Checked against `nudgeGrantLiveness.ts`'s `attachment` set, which includes `REWARD_POSSESSIONS` — resolves.
- `remove_condition.conditionTraitId: 'trait.condition.terrified'` — resolves against the `condition` set built from `CONDITION_TRAIT_DEFINITIONS` (`nudgeGrantLiveness.ts:84`).

**The artifact spawn — independently re-traced, not re-quoted.**
1. `ARTIFACT_TEMPLATES` (`src/data/artifact-templates.ts:45`) holds exactly three tier-4 entries. Naming one in `templateId` would fail liveness or hand a rarity-1 encounter a cosmic-tier artifact; the packet's dilemma is real.
2. `nudgeGrantLiveness.ts:116-119` is verbatim as quoted: a category-only `spawn_artifact` (no `templateId`) returns no refs to check — "names nothing that can rot" is the gate's own comment, not the packet's spin.
3. `src/engine/encounterAftermath.ts` (`spawn_artifact` handler, ~line 2619): `const saTier: ArtifactTier = effect.tier ?? 'common'` then `const saActorEdgeType = saTier === 'legendary' ? 'bonded_to' : 'possesses'`. With no `tier` authored, this resolves to `common` / `possesses` — traced independently, confirms the packet's claim exactly.
4. Precedent: `src/data/encounters/vertical-slice.ts:2394` mints The Crossroads Gift with `{ kind: 'spawn_artifact', category: 'talisman', targetAgentId: '$actor', messageOverride: … }` — no `templateId` — read directly, matches the packet's citation.
5. `category: 'relic'` is a live `ArtifactCategory` member (`src/types/unifiedAction.ts` ~360: `weapon | talisman | relic | tome | vessel | key | mundane`).

This is fully wirable as authored, with no fabricated field and no dead reference.

---

## 5 · New Hooks Needed

None. Every id, effect kind, field name, and constant the packet authors already exists in the live runtime. No new roles, sublocation types, state fields, or content-catalog entries are required.

---

## 6 · Composition Contract — block by block, re-run against the live gate

Read `src/data/content-eval/compositionContract.ts` directly rather than trusting the packet's self-audit table (§ 17 of the revised file). All nine blocks, using the actual gate logic:

| Block | My verdict | Basis |
|---|---|---|
| **Steps** | PASS | 1 plain step, inside 1–3 (`COMPOSITION_STEPS_MIN/MAX`); `reach`, numeric `difficulty`, and `narrativeTemplate` all present — the three per-step checks the gate runs. |
| **Hand** | PASS | Delegated to `checkNudgeHand`. Hand size 6, inside `NUDGE_HAND_MIN`–`MAX` (4–8, confirmed at `nudgeAuthoringConstants.ts:48-49`). Sum of `forecastDelta` = 0.49, under `NUDGE_HAND_MAX_TOTAL_DELTA` = 0.70 (`:73`). Spheres = 5, ≥ `HAND_SPHERE_COVERAGE_MIN` = 4 (`:80`). Common options = 1, ≥ `HAND_COMMON_OPTIONS_MIN` = 1 (`:86`). All six `ALL_BAND_OUTCOMES` covered across the hand (verified per-card against each card's `bandProse` keys — table in § 8 of the revised packet reproduces correctly). Every card has ≥1 fragment in `FAILURE_BAND_OUTCOMES` (`near_miss`/`failure`/`critical_failure`); the Undertow (`forecastDelta: 0.16` ≥ `NUDGE_BIG_DELTA` = 0.15, `nudgeAuthoringConstants.ts:175`) carries both `failure` and `critical_failure`, which `checkNudgeHand` requires for big-delta cards. No digit or `%` in any `effectLine` (spot-checked all six). `purposeLine` "Hold on to it" = 4 words = `REACH_PURPOSE_MAX_WORDS` (`:221`), not over. **Note:** `checkNudgeHand` itself does not machine-check "≥3 distinct types", "boost ≤2", "≥1 rider ≤1", or "every `libraryCardId` set" — those are `nudge-authoring-spec.md` authoring rules, not part of the automated gate. The packet's self-audit table is honest about this being a spec requirement, and manual inspection confirms all four: 5 distinct types, boost used exactly twice, exactly one rider (`floor_at_cost`, justified in prose), and all six cards set `libraryCardId` to a real `CARD_CONTENT` key (verified below). |
| **Setting** | PASS | Delegated to `validateSettingEnvelope`, plus the gate's own `settings.length > 0` check. Four classes declared, `locationSubtypes` derived via `expandSettings` rather than hand-written. `settingClasses.ts:60-65` confirms the exact expansion: `stronghold → castle, fort`; `ruin → ruins, ruined_tower, ruined_city, ruined_village, unexplored_poi`; `wayside → camp, oasis, wilderness`; `battlefield → battleground` — matches the packet's § 6 table exactly, word for word. |
| **Cast** | PASS | `castSpecs(template)` is non-empty (one actor spec, key `claimant`). Every `{cast:claimant}` token in authored prose names a declared key (checked against `authoredProse` walk — the token appears only in three overviews and two chip details, all cited in the packet, all under the `claimant` key). |
| **Rewards** | PASS | `hasReward` is satisfied twice over: `spawn_artifact` is a `PERSISTENT_EFFECT_KINDS` member (`compositionContract.ts:118`) authored on `successMetadata.effects`, and `bond_change` / `condition_attachment` are also members, authored in band reactions. Both routes are read by `allAftermathEffects`, confirmed below. |
| **Aftermath** | PASS | `aftermathConfig` present; 5 bands ≥ `COMPOSITION_BYOUTCOME_MIN_BANDS` (3); has a success-side band, a failure-side band, and an extreme band (all three requirements independently satisfied — `critical_success`/`success_at_cost` are both success-side and extreme, `critical_failure` is both failure-side and extreme); `fallback.overview` is non-empty. Every authored `change` declares `concepts` (checked all ten rows in §12 of the revised packet — each carries a non-empty `concepts` array). Chip-backing and chip-anchor violations: zero, confirmed in the next two rows. |
| **Systems** | PASS | `systemConnections()` traced by hand against `compositionContract.ts`'s own logic: `castSpecs.length > 0` → `cast` ✓; `hasReward` → `rewards` ✓ (via `spawn_artifact` in step metadata and `bond_change`/`condition_attachment` in band reactions); `CONDITION_EFFECT_KINDS` (`apply_condition`, `remove_condition`, `condition_attachment`) all present → `conditions` ✓. `reputation` and `factions` correctly absent — no `REPUTATION_EFFECT_KINDS` or faction-cast/faction-change authored. **Count: 3**, meeting `COMPOSITION_SYSTEMS_QUOTA_MIN` exactly, matching the packet's own claim. |
| **Images** | PASS | All six card `imageTag`s resolve to real `ENCOUNTER_IMAGE_LIBRARY` rows, confirmed at the packet's own cited lines (628, 630, 637, 639, 642, 643 — all read directly and match description and sphere pairing). No `illustrationUrl` declared, so the `startsWith('/')` check is inert (not a violation — the gate only checks the field when present). |
| **Draw** | PASS | `checkConsequenceDraw` reads `consequenceDraw: ['relationship', 'possession']` against `familiesWiredByEffects`. `relationship` is wired by `bond_change` (`consequenceDraw.ts:181`); `possession` is wired by `spawn_artifact` (`:184`, alongside `attachment_grant`/`reward_draw`). Both families have a qualifying effect authored. No `consequenceSwap`, correctly absent — the gate's rule for the draw is presence-conditional and does not require a swap. |

**Chip-backing (Law 56 clause 1) — re-traced by hand for all five bands, not trusted from the packet's table.** `chipBackingForFace` credits a face's chips from (a) its own reaction's effects if the kind is in `CHIP_BACKING_EFFECT_KINDS`, and (b) step-outcome metadata reachable by that face's success/failure half. `CHIP_BACKING_EFFECT_KINDS` (`compositionContract.ts` ~190-230) includes `spawn_artifact`, `apply_condition`, `condition_attachment`, `bond_change` — all four kinds this packet uses. With exactly one reaction per band and no variant-level `changes`, every band's two chips are backed: the BOON chip by `successMetadata.spawn_artifact` (reachable on every success-side face, since `stepWritesReachFace` credits the base/success half to `critical_success`/`success`/`success_at_cost`), the SCAR/growth chip by that band's own sole reaction. `failure`/`critical_failure` chips are backed by `failureMetadata.apply_condition` plus the band's own `bond_change` reaction. Zero unbacked chips.

**Chip-anchor (Law 56 clause 2) — re-traced against `classifyAnchorDeclaration` directly**, not against the packet's assertion:
- `entityId: '$actor'` → `form: 'actor'`, ok (`chipAnchorDeclarations.ts:87`).
- `entityId: '$cast:claimant'` → `form: 'cast'`, ok, provided `claimant` is a declared `supportKeys` member — it is (the sole `supportBundle` entry).
- `entityId: '$target'` → `form: 'target'`, ok, unconditionally (the static classifier does not ask what `$target` resolves to at runtime — only whether the sentinel form is one the build resolves, which it is). The runtime question — does `$target` actually bind to a location for this template — is a separate, correctly-flagged concern (§ 7 below).
- `entityId: 'trait.condition.terrified'` / `'trait.condition.wounded'` / `'trait.condition.location.under_watch'` → none of these are `$`-prefixed, so they fall to the literal-id branch: `getAttachmentTemplateNode(entityId)`. Traced `src/engine/attachmentTemplateIndex.ts:86`, which spreads `CONDITION_TRAIT_DEFINITIONS` into the same static index `getAttachmentTemplateNode` reads. All three ids are live entries in that array (confirmed above), so all three classify `ok: true, form: 'attachment_template'`.

Every declared `entityId` in the packet resolves. No chip anchors to nothing.

**Cast-target violations (THR-1165) — re-traced.** `bond_change.withAgentId: '$cast:claimant'` is checked against `CAST_TARGET_PERSISTENT_KINDS` (includes `bond_change`) and `CAST_TARGET_FIELDS` (includes `withAgentId`). The spec for key `claimant` is an `actor` kind with `delivery: 'lazy-materialize-on-trigger'` — not `'pre-seeded'`, so `castTargetViolations` does not fire the bind-only warning. This is exactly the reason the packet gives for choosing that delivery mode over `pre-seeded`, and the gate's own logic confirms the reasoning is correct, not merely plausible.

**Verdict on the Composition Contract: all nine blocks pass, independently re-run.**

---

## 7 · Flags carried forward from Pass 2, assessed

1. **`$target` binding for `encounter.border.*`.** Correctly flagged rather than assumed. The static anchor classifier accepts `$target` unconditionally (it only validates sentinel *form*, not runtime binding), so this cannot be caught by any authoring-time gate — it is a live-proof question. Precedent exists (vertical slice targets locations the same way) but is not proof for this template family. **Action for implementation: confirm via CLI (`spawn encounter-context` targeting a location, then `eval state...`) or a unit test on the assembled template that `action.targetId` resolves to a location node before this ships.** If it does not, the packet's own stated remedy is correct: bind the location through the support bundle rather than softening the chip.
2. **`allAftermathEffects` coverage of step metadata.** Resolved, not merely flagged — I read the function. `allAftermathEffects` (`compositionContract.ts` ~275-290) explicitly walks `step.successMetadata?.effects` and `step.failureMetadata?.effects` for every plain step, in addition to variant/band reactions. The Rewards block, the systems quota, and the chip-backing walk all use this same function. **The prize is not invisible to any of the contract's counts.** No implementation-time grep is needed for this — it is already proven by the source in this pass.
3. **Wiring-guide drift on `spawn_artifact`.** Confirmed real and independently verified: the live type (`unifiedAction.ts:717-733`) uses `templateId`, `category`, `tier`, `nameOverride`, `tags`, `targetAgentId`, `targetLocationId`, `messageOverride` — no `artifactName`, `artifactSubtype`, `possessedByAgentId`, or `chronicleEntry` exist on the type. `Docs/plans/2026-04-16-systemic-wiring-guide.md` § *Spawn Artifact* documents the dead field names. This packet correctly follows the type over the guide. Not this packet's fix — flagged for a separate pass, as both prior passes note.

None of the three flags block implementation. #1 is a pre-implementation verification step, not a redesign; #2 is closed by this pass; #3 is out of scope.

---

## 8 · Two batch-wide checks specific to this pass

**`emit_omen` / `CHIP_BACKING_EFFECT_KINDS`.** Not applicable — this packet authors no `emit_omen` effect anywhere. Confirmed by reading every effect block in the revised file (`spawn_artifact`, `apply_condition`, `bond_change` ×4, `condition_attachment` ×2, `attachment_grant`, `remove_condition`). No omen.

**`membership_change` / `agent_relocation` chip-backing (commit `659962a9`).** Not applicable — this packet authors neither effect kind. No workaround for their former absence appears anywhere in the packet; nothing to correct.

---

## 9 · Implementation File Map

**Create:**
- `src/data/encounters/the-unclaimed-relic.ts` — the template file, exporting `THE_UNCLAIMED_RELIC_TEMPLATE: UnifiedActionTemplate` (naming convention matched to `road-ambush.ts` → `ROAD_AMBUSH_TEMPLATE`, `the-brink-rescue.ts` → `BRINK_RESCUE_TEMPLATE`). Transcribes §§ 6–16 of this final packet field-for-field: `openings`, the setting-neutral spine as `steps[0].narrativeTemplate`, `steps[0]` (reach, difficulty, duration, failBehavior, purposeLine, afterimages, `successMetadata`/`failureMetadata`, `nudges` [6 cards], `traitVariants`), `supportBundle`, `aftermathConfig`, and the template-level fields from § 16 (`id`, `name`, `reach`, `rarityTier`, `intrinsicTier`, `crudType`, `scale`, `apCost`, `actorAffinities`, `motivations`, `consequenceDraw`, `description`).
- `src/data/encounters/__tests__/the-unclaimed-relic.test.ts` — structural test in the shape of `road-ambush.test.ts`/`flawed-steel.test.ts`: template shape (1 step, no branch), aftermath variant resolution for all five authored bands, support bundle actor (`claimant`), `traitVariants` resolution, and a direct `checkCompositionContract(THE_UNCLAIMED_RELIC_TEMPLATE)` assertion of zero violations (the corpus's own regression proof, independent of the CI-wide sweep).

**Modify:**
- `src/data/unified-action-templates.ts` — three edits, confirmed against the live file:
  1. Add `import { THE_UNCLAIMED_RELIC_TEMPLATE } from './encounters/the-unclaimed-relic';` near the existing encounter-file import block (confirmed live at line 191, e.g. `import { ROAD_AMBUSH_TEMPLATE } from './encounters/road-ambush';`).
  2. Add `THE_UNCLAIMED_RELIC_TEMPLATE,` to the first array (confirmed live around line 5590, alongside `ROAD_AMBUSH_TEMPLATE`).
  3. Add `THE_UNCLAIMED_RELIC_TEMPLATE,` to the second array (confirmed live around line 5678, alongside `ROAD_AMBUSH_TEMPLATE` again).
- **The two-array wiring shape is confirmed unchanged** — I read both arrays directly rather than trusting the task description's line numbers, and `ROAD_AMBUSH_TEMPLATE` genuinely appears in both, at the positions described.

**Not required:**
- No engine file changes (`src/engine/**`) — every effect kind and resolution path already exists.
- No type changes (`src/types/**`) — every field used is already on the live type.
- No new catalog entries — every referenced id (attachment, condition, artifact category, core trait, card, image tag) is already shipped.
- No Design Reference Wiki page update — this is new content, not a core-system behavior change; nothing in `public/wiki-manifest.json`'s `sources` globs is touched by adding one encounter template file (confirm at implementation time with `npm run check:wiki-freshness`, but no wiki page is expected to need a change).

---

## 10 · Verdict

**READY FOR IMPLEMENTATION**

Every effect kind, field name, catalog id, and constant this packet authors was independently re-verified against live source in this pass and resolves exactly as claimed. The Composition Contract's nine blocks all pass under direct re-execution of the gate's own logic, not the packet's self-audit. One citation imprecision was found and corrected (§ 1 — the stronghold class's reuse-role sourcing names the wrong roster keys, though the conclusion holds and the encounter's correctness does not depend on it, since delivery is materializing rather than bind-only). One flag from Pass 2 is resolved outright (§ 7.2 — step metadata is already counted by every contract block that matters). One flag is correctly carried forward as a pre-implementation verification step rather than a blocker (§ 7.1 — confirm `$target` binds to a location for this template family before merge).

---

## 11 · Primitive Disposition

No missing primitives identified.
