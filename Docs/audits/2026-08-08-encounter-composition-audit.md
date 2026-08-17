# Encounter Composition Audit — THR-1039

**Question (Christian):** are we still composing encounters from multiple content types (steps as templates, rewards/penalties/actors as other templates, sometimes random), or has that regressed? Are all building blocks for cool encounters in place?

**Worktree:** `.claude/worktrees/thr-925-926-encounter-ui` (read-only; src ≈ current main). All paths below relative to repo root.

---

## 1. Composition inventory

One row per content-block type that can participate in a single encounter.

| # | Block | Authored where | Pool vs inline | Resolves live at runtime? | Random / fixed |
|---|-------|----------------|----------------|---------------------------|----------------|
| 1 | **Steps** (`ActionStep`: reach, difficulty, `narrativeTemplate`, `purposeLine`, `factorLines`) | Inline on template (`src/types/unifiedAction.ts:1114-1164`) | Inline | LIVE — `resolveStepDefinition` (`src/engine/unifiedActionLifecycle.ts`), rendered by `buildUnifiedEncounterStageModel.ts:170-220` | Fixed |
| 2 | **Branching steps** (`ActionStepBranch` + `decidedBy` pole/route forks, THR-894/898) | Inline (`unifiedAction.ts:1183-1272`) | Inline | LIVE — agent-decided branch reads live axiology; 3 `decidedBy` uses in `vertical-slice.ts` | Deterministic from agent state |
| 3 | **Afterimages** per outcome band (`successAfterimage`, `successAtCostAfterimage`, `criticalSuccessAfterimage`, `criticalFailureAfterimage`) | Inline (`unifiedAction.ts:1126-1136`) | Inline | LIVE on resolution path (`src/engine/encounter.ts:102-103`) and chapter ledger (`src/engine/chapterArchive.ts:90-92`). **PARTIAL in veil**: the Scene-So-Far history reads only `successAfterimage`/`failureAfterimage` (`buildUnifiedEncounterStageModel.ts:338-340`) — band overrides dropped on that surface | Fixed, band-keyed |
| 4 | **Nudge hands** (`StepNudge`: fiction, effectLine, `bandProse`, riders, poleLean) | Inline per step (`unifiedAction.ts:934-1029`) | Inline; `libraryCardId` links to shared pool | LIVE — `buildNudgeHand` (`src/engine/encounters/nudges.ts`), rendered `NudgePhaseShell.tsx`; `bandProse` appended at resolution (`nudges.ts:485`) | Fixed hand; filters (essence, sphere, trait, group, favor) vary what's dealt |
| 5 | **`NUDGE_CARD_LIBRARY` + Repertoire** (THR-887) | Separate pool `src/data/nudge-card-library.ts` | Separate pool | LIVE as a *gate*: `buildRepertoire` consumed at `buildNudgePhaseModel.ts:449`; withholds authored cards whose `libraryCardId` the god does not own (`nudges.ts:278-285`). The library never deals a card by itself — hands stay authored per step | Deterministic (no PRNG, `nudgeCardRepertoire.ts:14-16`) |
| 6 | **Nudge `grants`** — card world-changes via aftermath-effect vocabulary (THR-885) | Inline on card | Inline, shared vocabulary | LIVE — `collectNudgeGrants` → `applyEncounterAftermathReaction` (`src/engine/encounters/nudgeDispatch.ts:100-113`) | Fixed |
| 7 | **`traitVariants`** (trait-gated forecast/difficulty/factor-line/extra cards) | Inline template-level (`unifiedAction.ts:1057-1067`) | Inline (refs into trait pool) | LIVE — `resolveTraitVariants` at `buildNudgePhaseModel.ts:477`; modifiers in resolution | Deterministic on held traits |
| 8 | **Trait gates** `requiredTraits` / `blockedByTraits` (THR-801) | Inline (`unifiedAction.ts:1478-1488`) | Refs into trait pool | LIVE — stage 3 of encounter filter pipeline | Deterministic |
| 9 | **Setting envelopes** `settings` + `openings` (THR-884) | Inline; compiled by `compileOpeningEnvelope` (`src/data/settingClasses.ts:173`) into a `{frag:opening}` fragment set | Inline table, one opening per class | LIVE — resolves through the `{frag:*}` chain; attended stage threads fragments since THR-932 (`buildUnifiedEncounterStageModel.ts:631-637`) | Deterministic per setting class |
| 10 | **Context fragments** `{frag:*}` (THR-573, place/counterpartRole/setting axes) | Inline `contextFragments` tables | Inline | LIVE — `resolveFragment` (`src/engine/fragmentResolution.ts:131-178`), token splice `proseEnrichment.ts:549-559`. **Authored almost nowhere**: outside compiled openings, only `social-scene-templates.ts` declares any (grep: 4 non-test files total) | Deterministic lookup, no PRNG |
| 11 | **Cast placeholders `{cast:*}` + support bundles** (spawned/reused NPCs & sublocations as scene actors) | `supportBundle` on template; family defaults `src/data/default-support-bundles.ts:318-324` | **Separate blocks**: binds existing NPCs or materializes support nodes (`src/engine/encounterSupportBundle.ts:72-125`, called from `phaseAgentDecision`) | LIVE in prose — `{cast:key}` resolution `proseEnrichment.ts:617-633`, conditional `{?has_cast:}` blocks `:788-789`; names auto-link via `narrativeLinker`. **Cast panel model built but never rendered** (see §3) | Binding depends on world population (reuse-first); pre-seeded defaults never spawn |
| 12 | **Reward pools** `rewardPool` → attachment templates | `successMetadata`/`failureMetadata` (`unifiedAction.ts:44-63`); recipes reference the attachment-template pool | **Separate pool, drawn from** | LIVE — `resolveUnifiedReward` (`src/engine/unifiedActionResolution.ts:1185-1275`), result pushed as an `item` aftermath change (`:2251-2268`) → PRIZE chip | **Randomized** — seeded `mulberry32(seed + tick*41 + hash(actor) + hash(template))` (`:1190-1192`) |
| 13 | **Penalty channels** — `failureMetadata.rewardPool` (equipment loss), `reputationDelta`, step-level `effects` (THR-783) | Inline metadata | Mixed | LIVE — same resolution site; step `effects` dispatch through the aftermath applier (`unifiedAction.ts:48-62`) | Reward-pool half randomized; rest fixed |
| 14 | **`aftermathConfig`** — choice-keyed variants + `byOutcome` bands (THR-969) | Inline (`unifiedAction.ts:1288-1327`) | Inline | Resolver LIVE, single-sourced (`resolveAftermathVariant`, `unifiedAction.ts:1372-1382`; UI at `buildUnifiedEncounterStageModel.ts:409-435`). **`byOutcome` has ZERO authored content** — grep across `src/` matches only the type, its tests, and the KPI reader | Deterministic |
| 15 | **Aftermath reactions + 33-kind effect vocabulary** (incl. `encounter_seed`, `spawn_artifact`, `hidden_mark`, `intelligence`, faction ops, thread ops) | Inline reactions (`unifiedAction.ts:219-826`) | Inline, but effects *reference* separate pools (ambition templates, condition traits, artifact templates, encounter templates) | LIVE — `applyEncounterAftermathReaction`; seeds spawn future encounters (`PendingEncounterSeed`, `unifiedAction.ts:790-818`) | Mostly fixed; `favor_creation` magnitude sampled |
| 16 | **`EncounterAftermathChange.concepts`** (THR-1004 image/tooltip/link declarations) | Engine-derived (`src/engine/aftermathWords.ts`) + optional authored | Inline | LIVE — `applyConceptDecorations` + `resolveIcon` (`buildAftermathConsequences.ts:213-262, 283-292`) | Fixed |
| 17 | **Image library** (`src/data/encounter-image-library.ts`, 800 lines: card/scene/fate/portrait kinds, band-restricted fate rows) | Separate pool | Separate pool | **HALF-DEAD** — sole production consumer is `NudgePhaseShell.tsx:155` (card art via `imageTag`). The `scene` and `fate` kinds — including the outcome-band ladder (`encounter-image-library.ts:580-581`, `bands` filter `encounterImageResolver.ts:91`) — have **no production caller** | Deterministic (tie-break on id) |
| 18 | **`illustrationUrl`** scene art | Inline, authored on the ~28 old branching encounters + 3 mentorship templates only (grep: zero in `vertical-slice.ts`, zero in WS5) | Inline path | LIVE — step-0 only (`buildUnifiedEncounterStageModel.ts:641-650`; veil render `EncounterVeil.tsx:320`) | Fixed |
| 19 | **Enrichment placeholders** `{name}` `{actor}` `{they}` `{target:*}` `{intel:*}` `{cause:*}` `{omen}` `{outcome_phrase}` | Engine vocabulary | Consumes live game state | LIVE — `src/engine/proseEnrichment.ts:605-729` | State-dependent |
| 20 | **`carryoverFactorLines`** (THR-892) | Inline (`unifiedAction.ts:1163`) | Inline | LIVE — `resolveCarryoverLine` (`buildNudgePhaseModel.ts:498`) | Variant by construction (keyed on rolled prior outcome) |
| 21 | **`authoredChoices`** (legacy choice cards, rejected model) | Inline | Inline | LIVE — `buildChoices` (`buildUnifiedEncounterStageModel.ts:275-289`); still the only interaction on all 28 old branching encounters | Fixed |
| 22 | **Foreshadowing** (THR-389 pool previews) | Inline `foreshadowing` | Inline | LIVE — `src/engine/foreshadowing/`, rendered in `ThreadDetailView.tsx` | Fixed |
| 23 | **Clearance gates** (scrutiny shells) | Inline `clearanceGates` | Inline | LIVE — `ClearanceGatePanel.tsx` (gate-duty) | Fixed |

**Bottom line for the inventory:** the multi-pool machinery all still exists and almost all of it resolves live. What has changed is *which blocks new content actually authors* (§2) and *which resolved blocks the player can actually see* (§3).

---

## 2. Composition-vs-era verdict

### (a) The ~28 older branching encounters (`src/data/encounters/*.ts`)

Fully multi-template. Evidence:

- **23 of 28 declare a `supportBundle`** (grep `supportBundle` — every file except vertical-slice and 5 minimal ones); `road-ambush.ts:72-77` composes four specs (`sorayaSpec`, `draganSpec`, `leadDriverSpec`, `tradeRoadSpec`) that bind or **spawn real graph NPCs/sublocations**.
- **Heavy `{cast:*}` use**: `flawed-steel.ts` 83 tokens, `the-brink-rescue.ts` 40, `the-letters-of-introduction.ts` 38, `road-ambush.ts` 18 — including in choice targets (`targetLabel: '{cast:soraya}'`, `road-ambush.ts:548`).
- **All 28 carry `aftermathConfig`** with choice-keyed variants and reaction suites.
- **Scene art** — `illustrationUrl` on ~28 files.
- **Reward pools**: only `the-letters-of-introduction.ts` (2 uses). The rewardPool block's real home is the linear corpus: **522 occurrences across 21 content files** (`encounter-content.ts` 211, `borderland` 32, `faction-encounter-content` 32, guild files, etc.).
- Interaction model: `authoredChoices` (6 uses per file) — the **rejected** "choose for the mortal" model, still what renders for all of them.

### (b) The 7 WS5-converted camp templates (`encounter-content.ts:6966, 7419, 8087, 8520, 8826, 9071, 10163` — THR-838 Batch 1)

Nudge-native but composition-thin: hands (4+ cards/step), `traitVariants` with live trait refs (`:6983-6992`), `purposeLine`/`factorLines`, all-band afterimages — **but** `locationTypes: [...ALL_LOCATION_SUBTYPES]` instead of a setting envelope with per-class openings, **no supportBundle, no `{cast:*}`, no rewardPool, no grants**. Rewards are `reputationDelta: 0.03`-class nudges only (`:6946`).

They also miss the family-default cast net: `withDefaultSupportBundle` keys on the id prefix before the first dot (`default-support-bundles.ts:320`), and these templates are all `encounter.*` — a family with no default bundle. Zero cast, structurally.

### (c) The 8 THR-883 slice encounters (`vertical-slice.ts`)

The full new-era feature set: `nudges` on every test step, `settings` + `openings` per class, `traitVariants`, `decidedBy` forks (3), `carryoverFactorLines`, `imageTag` per card, `aftermathConfig` on all 8, real aftermath effects (`encounter_seed` ×3, `spawn_artifact` at `:1184`, `favor_creation` at `:1873`, one `remove_condition` grant at `:369`).

**And zero of the actor/reward composition layer**: grep in `vertical-slice.ts` — `supportBundle` 0, `{cast:` 0, `rewardPool` 0, `illustrationUrl` 0, `byOutcome` 0. The Unsafe Bridge's keeper, the ferryman's passengers — every scene person is **inline prose**, not a cast-template actor. Same `encounter.*` prefix ⇒ no default bundle either. Many reactions are `effects: []` acknowledgments (`:223, :523, :826, :1085…`).

### What the skill teaches

`.claude/skills/encounter-pipeline/` **still teaches multi-template composition** — the regression is not in the doctrine:

- `agents/draft-prompt.md:83`: *"**Support Bundle Contract** — Table with: support object, delivery mode (pre-seeded / lazy-materialize-on-trigger / blocked-primitive), source, persistence contract…"*
- `agents/systems-prompt.md:40`: *"**Support Bundle Honesty** — For every support object: is delivery mode realistic?"*; `agents/implementation-prompt.md:27`: *"translate every row from the Support Bundle Contract table"*.
- `reference/nudge-authoring-spec.md:262-276` (Christian, 2026-07-31): *"how many systems does this encounter touch? … target ≥3 beyond the core test"* — naming **cast** (*"an NPC who would use the agent's name uses the cast/placeholder surface ('Evening, `{cast:agent}`')"*), **attribute-read rewards** (*"a gift, prize, or offer keyed to who the agent is … resolved from the attachment/content libraries"*), **bespoke supporting content**, and **seeds**.
- But the spec's aftermath section (`:460-468`) says only *"Prizes, tolls, and seeds as object references — ids the modal system resolves"* and names `grants` as the mechanism — **`rewardPool` is never mentioned anywhere in the skill, spec, or agent prompts** (grep: zero hits). The randomized attachment-draw reward system is no longer taught.

### Verdict

**Yes, multi-template composition has regressed in the new era, and the regression is in the authored corpus, not the engine or the skill.** The engine still resolves cast bundles, reward pools, fragments, and seeds; the skill still demands a Support Bundle Contract and ≥3 system touches. But the 15 nudge-era encounters (8 slice + 7 WS5) author **zero cast bindings, zero `{cast:*}` tokens, and zero reward-pool draws** — the two blocks that made older encounters cross-template (scene actors from the NPC system, prizes from the attachment library) are exactly the two the new corpus dropped. What replaced them is richer *within-template* composition (hands, envelopes, forks, carryover) plus a thin aftermath-effect layer. The spec's ≥3-connections rule is warn-level and postdates the slice; nothing enforces it mechanically.

---

## 3. UI coverage matrix

Live player surface = `EncounterVeil` (mounted `GameView.tsx:4335`) fed by `buildUnifiedEncounterStageModel`. Note: `src/components/Game/Encounter/` (EncounterScreen, CastRail, EffectRegistration landings, OutcomeForecastBand) is **mounted only in `StyleGuide.tsx` and tests** — a THR-925/926 prototype, not player-reachable.

> **Disposition recorded 2026-08-17 (THR-1049).** That prototype cluster was **deleted**, not wired. Each named member was displaced by a live surface that had already overtaken it — `EncounterScreen`/`EiraHeroPanel`/`CapabilityStrip` by the veil that `GameView` actually mounts; `CastRail`/`CastTile` by the `CastStrip` THR-1041 built inside `EncounterVeil.tsx`, which borrowed their patterns and rejected their `CastTileData` props for having no producer; `OutcomeForecastBand` by `NudgePhaseShell`'s live forecast readout (`buildNudgePhaseModel` → `useNudgeHand` → `hand.forecast.tier`/`.word`); and the ten `EffectRegistration` landings by the consequence-chip block (THR-971 / THR-1082), which states the same registrations without animation. Per-component evidence is in THR-1049's closeout comment. What survives the cluster is filed as THR-1167.

| Block | Renders where | Status |
|---|---|---|
| Step prose + openings/fragments | Veil narrative (`buildUnifiedEncounterStageModel.ts:184-220`; fragments threaded `:631-637`) | OK |
| purposeLine / factorLines / carryover | Test panel, `NudgePhaseShell.tsx` (polarity colors `:58-62`, pips `:68`) | OK — but only on nudge-bearing steps (`buildNudgePhaseModel.ts:394-395`) |
| Nudge hand + card art | `NudgePhaseShell` cards; art via `resolveEncounterImagePath` (`:155`) | OK |
| Fate/outcome reveal | **No dedicated fate surface.** Outcome reaches the player as afterimage + `bandProse` in step prose/history; the library's band-laddered `fate` images (`encounter-image-library.ts:580`) and `OutcomeForecastBand.tsx` are unreached in production | GAP |
| Afterimages (band-specific) | Chapter ledger OK (`chapterArchive.ts:90-92`); **veil history drops band overrides** (`buildUnifiedEncounterStageModel.ts:338-340` reads only success/failure) | PARTIAL |
| Cast | `buildCast` builds `EncounterStageCastModel[]` (`:222-248`) — **no component renders `model.cast`** (grep `.cast` in components: adapters/tests only; `EncounterVeil` never reads it). Cast reaches the player only as auto-linked names inside prose (`narrativeLinker`). `reused` provenance invisible | NEVER RENDERED |
| falloutPreview / factions / signals | Built (`:578-607`; gate-duty `buildGateDutyEncounterStageModel.ts:521`) — no renderer in the veil | NEVER RENDERED |
| Aftermath chips | `buildAftermathConsequences` → veil `EncounterVeil.tsx:564-576`; concepts get tooltip/link/icon per Law 1 (`Docs/design-system/laws.md:17`) | OK (THR-1004 fixed the bare-text era for *derived* sentences) |
| Aftermath reactions | Veil `:786-811` | OK |
| rewardPool prize | As `item` change → PRIZE chip — **but suppressed whenever the template has `aftermathConfig`**: `displayChanges = authoredVariant?.changes ?? summary.changes` (`buildUnifiedEncounterStageModel.ts:425-435`) replaces engine changes wholesale, so a rolled reward on an aftermathConfig template (e.g. the-letters-of-introduction) never shows in the ending | PARTIAL; also randomness invisible — no surface hints a prize was drawn from a pool |
| encounter_seed | SEED chip (`buildAftermathConsequences.ts:297-315`) | OK |
| hidden_mark / intelligence | Invisible until reveal (by design); intel surfaces via `{intel:*}` prose and `intel_referenced_prose` | OK by design |
| byOutcome endings | Resolver in the veil path (`:414`) — zero content to show | DEAD CONTENT |
| Nudge play history / echo provenance | `RepertoireEntry.source` ("surfaced so the UI can explain a hand", `nudgeCardRepertoire.ts:202`) — the shell shows blocked reasons but not source/echo/scar | PARTIAL |

**Counts:** blocks that resolve at runtime but never reach a player surface: **4** (cast model, falloutPreview, factions/signals, scene/fate image rows). Dead-on-arrival content or content-less mechanisms: **3** (`byOutcome` bands, fate-image band ladder, EncounterScreen prototype tree). Law-1 concern: cast members exist as graph entities with portraits yet render only as prose links, never as image+tooltip tiles (the prototype `CastRail` was built to fix exactly this and is unmounted).

---

## 4. Gap list — ticket candidates

1. **New-era encounters bind no cast** — slice + WS5 author no `supportBundle`, and `withDefaultSupportBundle` keys on id prefix so `encounter.*` gets nothing (`default-support-bundles.ts:320`; grep vertical-slice = 0). Product. Costs ~1 session to add bundles/defaults for the 15 templates; not fixing costs every new encounter shipping with anonymous inline-prose NPCs, the exact "flat encounter" the spec's ≥3-connections rule warns about.
2. **Reward pools absent from the new era and untaught** — zero `rewardPool` in slice/WS5; skill+spec never mention it (grep = 0). Product. Costs ~½ session to add a "prize" step to the spec + recipes to the 15; not fixing means the attachment library (500+ recipe references in old content) stops feeding new encounters and prizes degrade to reputation deltas.
3. **Cast panel and fallout preview built but unrendered** — `model.cast`/`falloutPreview` have no consumer (`buildUnifiedEncounterStageModel.ts:222-248, 578-607`); prototype `CastRail`/`EncounterScreen` styleguide-only. Product (UI pillar; Law 1). Costs ~1 session to mount or delete; not fixing keeps scene actors invisible as entities and leaves dead model code that every adapter change pays for.
4. **`byOutcome` shipped with zero content** — THR-969 resolver + KPI live, no template authors a band (grep = 4 non-content files). Product. Costs ~½ session to band the 8 slice endings; not fixing means every ending reads the same at `critical_success` and `success_at_cost`, the exact gap THR-969 was filed to close.
5. **Scene/fate half of the image library is dead** — only consumer is card art (`NudgePhaseShell.tsx:155`); `scene`/`fate` kinds + band ladder unreachable; new encounters also author no `illustrationUrl`. Product. Costs ~1 session to wire scene-tag art into the veil's step-0 slot and a fate-band image into the reveal; not fixing strands the authored library and keeps new encounters art-less.
6. **Veil history drops band-specific afterimages** — `:338-340` vs `chapterArchive.ts:90-92`. Product (small defect). Costs ~1 hour; not fixing shows a generic line where authors wrote band prose.
7. **28 old encounters still on the rejected `authoredChoices` model** — WS5 conversion stalled at 7 background camp templates; `SKILL.md:41`: "Conversion of the existing 28 is WS5." Product. Costs ~batch sessions; not fixing keeps the deepest-composed content on an interaction model the design explicitly rejected.
8. **`{frag:*}` identity axes authored only in social templates** — the THR-573 multiplication layer has ~4 authoring sites outside compiled openings. Product. Costs incremental authoring; not fixing caps surface variety at the openings axis alone.
9. **rewardPool prize suppressed under `aftermathConfig`** — `:425-435` replaces engine changes wholesale. Process/defect boundary; verify intent, then either merge item changes in or document the suppression. ~2 hours; not fixing silently hides earned rewards on any future aftermathConfig+rewardPool template.
