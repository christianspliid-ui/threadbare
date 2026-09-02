# Systems Inventory

> **GENERATED FILE — do not edit by hand.** Regenerate with `npm run generate-systems-inventory`.
> Ground truth: the subsystem registry in `scripts/generate-systems-inventory.ts` + `orchestrator.ts` phase comments + the `ENGINE_PHASES` registry + every module under `src/engine/**` + a headless run.

This is the **substrate-existence surface** for the design workflow (THR-658). Before drafting any plan
with an Engine pillar, grep this file (and `src/engine/`) for the domain nouns of your premise. If a
subsystem already exists here, your plan must say whether it **extends / activates / replaces** it —
never propose a green-field build of something already listed. A 🟠 DORMANT badge means *wired but no
matching output was observed* in the standard run — it exists; it is not missing.

**Run inputs:** seed `42`, `120` ticks, `medium` map.

**Badge:** 🟢 ACTIVE = produced matching runtime output · 🟠 DORMANT = wired, no matching output observed · ⚪ UNKNOWN = run unavailable.
DORMANT is a keyword-match heuristic against one seed — a strong signal, but a phase that emits under a shared category name can read DORMANT while still doing work; verify before assuming truly unused.

## ⚠️ Built-but-dormant subsystems

Registered but producing no matching output in the standard run. **The highest-risk substrate for a
design agent** — they exist, are easy to miss (no playtest or screenshot reveals them), and a
green-field plan will silently duplicate them. This is the exact failure THR-614 hit.

| Subsystem | Aliases | Domains | Note |
|---|---|---|---|
| Companies & Group Travel | company, companies, group, party, band, fellowship, companion, cohesion | `groups` | Small named companies of unique agents (THR-74): formation from colocated compatible agents, shared movement with dissent, event-driven cohesion, dissolution that persists as history. Distinct from War & Armies — armies are faction-scale with an abstract headcount, companies are <=10 named individuals who keep their own decision loops. |

## Subsystem registry

One row per player-meaningful subsystem, with the engine domains + tick phases that implement it and a
generated activity badge. **Search here first** — the aliases column carries the nouns (incl. legacy
names like `TB-073`) a premise might use.

| Subsystem | Status | Aliases (search keys) | Domains | Tick phases |
|---|---|---|---|---|
| **War, Armies & Battles** | 🟢 ACTIVE | war, warfare, army, armies, battle, siege, warband, conflict, invasion, cohesion, campaign | `army`, `battle` | `2.352`, `2.355`, `2.356`, `2.357`, `2.358` |
| **Factions & Succession** | 🟢 ACTIVE | faction, guild, order, succession, rank, schism | `faction`, `chosenfactionpowers`, `schism` | `6.55`, `6.56` |
| **Rival Gods & Schemes** | 🟢 ACTIVE | rival, rivals, scheme, pantheon, antagonist | `rival` | `3` |
| **Doom Clock & Journey** | 🟢 ACTIVE | doom, journey, apocalypse, end-times, clock | `doom`, `journey` | `1.5`, `1.8`, `8`, `doom` |
| **Mandate** | 🟢 ACTIVE | mandate, divine mandate, objective | `mandate` | `mandate` |
| **Essence & Divine Economy** | 🟢 ACTIVE | essence, divine economy, income, wellspring, essence source | `essence`, `essencesource`, `control` | `2a.9`, `5.9`, `6`, `6.1`, `6.6`, `6.715` |
| **Encounters & Dilemmas** | 🟢 ACTIVE | encounter, dilemma, aftermath, chapter, reaction | `encounter`, `encounters`, `dilemma` | `2`, `2a.5`, `2a.7`, `2a.6`, `2a.62`, `2a.8`, `2b`, `2.361`, `2.5`, `2.55` |
| **Culture** | 🟢 ACTIVE | culture, cultural, mores, tradition, phonetics | `culture`, `cultural` | — |
| **Personality & Emergent Traits** | 🟢 ACTIVE | personality, trait, traits, becoming, axiological, temperament | `personality`, `core` | `6.626` |
| **Mortal Economy & Prosperity** | 🟢 ACTIVE | economy, trade, resource, resources, prosperity, gold, market, settlement, cargo | `resource`, `settlement`, `economic`, `trade`, `gold`, `prosperity` | `6.62`, `6.63`, `6.632`, `6.635`, `6.636`, `6.65`, `6.66` |
| **Ambitions & Undertakings** | 🟢 ACTIVE | ambition, undertaking, initiative, goal, mentorship, apprentice | `ambition`, `undertaking`, `mentorship` | — |
| **Attachments, Items & Possessions** | 🟢 ACTIVE | attachment, attachments, item, items, possession, possessions, artifact, equipment, blessing, retainer, agreement | `attachment`, `seed` | `2a.85` |
| **Ruins, Clues & Delves** | 🟢 ACTIVE | ruins, delve, dungeon, clue, lair, anomaly, quest | `ruins`, `delve`, `lair`, `anomaly` | `2.3575` |
| **Stealth, Detection & Hidden Marks** | 🟢 ACTIVE | stealth, detection, hidden, mark, disbelief, faith, signature | `stealth`, `detection`, `hidden` | `1.7`, `2a.605`, `2.356`, `2.36`, `2.5`, `4`, `6.7` |
| **Attention, Chronicle & Narrative** | 🟢 ACTIVE | attention, chronicle, digest, narrative, story, feed | `attention`, `chronicle`, `narrative` | `2a.65`, `6.66`, `5` |
| **Omens & Atmospheric Pressure** | 🟢 ACTIVE | omen, pressure, atmosphere, portent, foreshadowing | `omen`, `foreshadowing`, `emittedomen` | `1.7`, `2a.605`, `6.639` |
| **Strategic Projects & Control** | 🟢 ACTIVE | strategic, project, control, contestation, territory | `strategic`, `contestation`, `control` | `2a.55`, `6.1` |
| **Ascendant Beats & Progression** | 🟢 ACTIVE | beat, spine, director, ascendant progression, milestone | `ascendantbeat`, `ascendant` | `1.5`, `1.7`, `1.75` |
| **Companies & Group Travel** | 🟠 DORMANT | company, companies, group, party, band, fellowship, companion, cohesion | `groups` | — |
| **Movement & Colocation** | 🟢 ACTIVE | movement, travel, pathfinding, colocation, sublocation | `avatarmove`, `movement` | `2.35`, `2.352`, `2.36`, `2.361`, `2.37`, `2.4` |
| **Reputation & Influence** | 🟢 ACTIVE | reputation, influence, renown, standing | `reputation`, `influence` | `6.55`, `6.6`, `6.634`, `6.64` |
| **Secrets & Favors** | 🟢 ACTIVE | secret, secrets, favor, blackmail, leverage | `secrets`, `favor` | — |
| **Effects & Conditions** | 🟢 ACTIVE | effect, condition, buff, debuff, status, possession, slot | `effect`, `effects`, `condition`, `conditiondecay`, `conditionoverflow` | `2a.4`, `2a.52`, `2a.85`, `6.625` |
| **Agent Lifecycle** | 🟢 ACTIVE | lifecycle, birth, death, migration, graduation, apotheosis, npc | `agentlifecycle`, `agent`, `apotheosis`, `anointsuccessor` | `2a.78`, `2.38`, `6.75` |
| **Intelligence, Knowledge & Familiarity** | 🟢 ACTIVE | intelligence, knowledge, familiarity, interaction, revelation, facet | `intelligence`, `interaction`, `familiarity`, `knowledge` | `2a.1`, `2.75`, `2.76`, `6.71` |
| **Spheres & Quintessence** | 🟢 ACTIVE | sphere, quintessence, foundation, creation, saturation, world-soul | `sphere`, `quintessence`, `saturation`, `cosmology` | `2`, `6.638`, `6.639`, `6.6396`, `6.6395` |

- **War, Armies & Battles** — Built March 2026 as "Phase 12: Conflict & Destruction" / TB-073; activated + reconciled by THR-614. **Do not design a green-field war system** — extend or tune this one.
- **Factions & Succession** — Faction actions, ambitions, reputation, rank changes, succession, schism resolution.
- **Rival Gods & Schemes** — Generated rivals from the World-Soul (NOT a fixed pantheon). 4-phase schemes = THR-66; economic family = THR-620.
- **Doom Clock & Journey** — The run's master clock; journey beats fire at thresholds.
- **Mandate** — The god's standing objective and its checkpoints.
- **Essence & Divine Economy** — Essence pool + sources (THR-611). Typed sources yield own-sphere income.
- **Encounters & Dilemmas** — The core narrative engine — scoring, eligibility, resolution, aftermath reactions, chapter archive.
- **Culture** — Culture generation, gravity, tension, mores, phonetic naming.
- **Personality & Emergent Traits** — Layered: worldgen baseline → core → emergent traits (THR-527/542/561).
- **Mortal Economy & Prosperity** — Resource web, stock tiers, prosperity pulse, settlement tiers, trade routes. M3: Dynamic Economy.
- **Ambitions & Undertakings** — Agent-level drives and the multi-tick undertakings that serve them; mentorship rides the undertaking checkpoint pass (THR-1292 §3 retired the separate initiative pipeline).
- **Attachments, Items & Possessions** — Items, conditions, blessings, agreements, retainers on `possesses` edges. Effects flow via `effects[]` → `collectTestShapers` (2026-03-31 generic effect system). Contract liveness audited 2026-07-23 (THR-717) — five leaked contracts, see `Docs/canon/interface-map.md`.
- **Ruins, Clues & Delves** — Ruin density seeding, clue discovery/decay, delve admission→progression→emergence, lair escalation.
- **Stealth, Detection & Hidden Marks** — Two audiences watch the god: mortals (disbelief→faith) and rivals (signature scans). Hidden-mark decay.
- **Attention, Chronicle & Narrative** — The attention pool (can't watch everything), the digest, and the run's chronicle/narrative feed.
- **Omens & Atmospheric Pressure** — Atmospheric pressure tracks and emitted omens (THR-19); motive-receipt foreshadowing (THR-631).
- **Strategic Projects & Control** — Multi-tick strategic projects, control degradation, contestation resolution.
- **Ascendant Beats & Progression** — Ascendant beat director offers beats at doom/tier thresholds (THR-613). Deepening vs milestone beats.
- **Companies & Group Travel** — Small named companies of unique agents (THR-74): formation from colocated compatible agents, shared movement with dissent, event-driven cohesion, dissolution that persists as history. Distinct from War & Armies — armies are faction-scale with an abstract headcount, companies are <=10 named individuals who keep their own decision loops.
- **Movement & Colocation** — Goal-directed agent movement, same-hex colocation detection, sublocation dissolution.
- **Reputation & Influence** — Reach-polarity reputation traits and divine influence decay + tier promotion.
- **Secrets & Favors** — Secret/favor economy. If shown DORMANT, it produced no distinctly-named output this run — verify before assuming unused.
- **Effects & Conditions** — Per-agent effect bookkeeping (duration/cooldown/decay/stacking), effect shells, condition decay + overflow, slot caps.
- **Agent Lifecycle** — Agent death, birth, migration; NPC graduation to individuals; apotheosis capstone seeding on tier-4 mortals.
- **Intelligence, Knowledge & Familiarity** — Knowledge-facet accumulation from encounters/observations, interaction depth, intelligence reliability decay.
- **Spheres & Quintessence** — Sphere pressure resolution, quintessence tick, global World-Soul aggregation, magical saturation.

## Unclassified tick phases

Wired phases that **no subsystem registry entry claims**. When this list is non-empty a new system has
landed without a registry row — add it to `SUBSYSTEMS` in the generator so the subsystem search stays
complete. (These phases still appear in the full wiring table below; they just lack a curated home.)

| Phase | Name | Tags |
|---|---|---|
| `2a` | Progress + resolve existing unified actions | — |
| `2a.61` | Choice Resolution — process pending player choice commits | `THR-323` |
| `2.34` | Companies | `THR-74` |
| `3b` | Notable Agendas | `THR-630` |
| `6.625b` | Companion expiry | `THR-1096` |
| `6.637` | Unrest | — |
| `end` | Drift Decay — passive per-tick decay toward zero | `THR-323` |

## Tick-loop phases (full wiring)

Every phase the orchestrator runs each tick — inline `orchestrator.ts` comments then the `ENGINE_PHASES`
registry. The wiring ground truth: if it is on the tick path, it is here.

| Phase | Name | Legacy tags | Source |
|---|---|---|---|
| `2` | Balance telemetry for encounter failure quintessence erosion | — | orchestrator |
| `1.5` | Journey Beat — check if doom clock crossed a beat threshold for The First | — | orchestrator |
| `1.7` | Omen Agenda — select/rotate atmospheric pressure tracks, emit beats | `THR-19` | orchestrator |
| `1.7` | Ascendant Progression — god-side tier-crossing detection | `THR-613` | orchestrator |
| `1.75` | Ascendant Beat Director — decide which beat | — | orchestrator |
| `1.8` | Composition phase runner — advance phased event recipes tied to doom clock | `THR-225` | orchestrator |
| `2a` | Progress + resolve existing unified actions | — | orchestrator |
| `2a.1` | Thread-bind familiarity grant — when a bind_thread_* action resolves | — | orchestrator |
| `2a.4` | Effect Tick — per-agent effect bookkeeping | — | orchestrator |
| `2a.5` | Encounter Progression — advance active encounters whose current step has elapsed | — | orchestrator |
| `2a.52` | Effect Shells — process non-step-outcome flip_table triggers | `THR-53` | orchestrator |
| `2a.55` | Strategic Projects — advance multi-tick projects and tick control degradation | — | orchestrator |
| `2a.7` | Encounter Revelations | — | orchestrator |
| `2a.6` | Encounter Visibility — generate notifications for threaded agents in encounters | — | orchestrator |
| `2a.605` | Detection Pressure — regional escalation from committed choices + passive decay | — | orchestrator |
| `2a.61` | Choice Resolution — process pending player choice commits | `THR-323` | orchestrator |
| `2a.62` | Ascendant Hand Filter — encounter-scoped hand partitioning | — | orchestrator |
| `2a.65` | Attention Pool — regen pool, expire tugs, generate new tugs for shaping encounters | — | orchestrator |
| `2a.78` | Apotheosis Eligibility — seed the capstone onto tier-4 mortals | — | orchestrator |
| `2a.8` | Evaluate encounter seeds planted by aftermath reactions | — | orchestrator |
| `2a.85` | Slot Cap Enforcement — deactivate overflow possessions, handle condition overflow | — | orchestrator |
| `2a.9` | Divine Premonition | — | orchestrator |
| `2b` | Agent Decision — unified encounter-driven decision pipeline | — | orchestrator |
| `2.34` | Companies | `THR-74` | orchestrator |
| `2.35` | Agent Movement | — | orchestrator |
| `2.352` | Army Movement | `TB-073` | orchestrator |
| `2.355` | Army Attrition | `TB-073` | orchestrator |
| `2.356` | Battle Detection | `TB-073` | orchestrator |
| `2.357` | Battle Tick | `TB-073` | orchestrator |
| `2.3575` | Lair Escalation | `M2.5` | orchestrator |
| `2.358` | Army Notifications | `TB-073` | orchestrator |
| `2.36` | Colocation Detection | — | orchestrator |
| `2.361` | Colocation Aggregation — collapse same-hex same-tick encounter storms | `THR-456` | orchestrator |
| `2.37` | Colocation Revelations | — | orchestrator |
| `2.38` | NPC Graduation ── | — | orchestrator |
| `2.4` | Sublocation Dissolution | — | orchestrator |
| `2.5` | Dilemma Detection | — | orchestrator |
| `2.55` | Dilemma Revelations | — | orchestrator |
| `2.75` | Familiarity Gain | — | orchestrator |
| `2.76` | Interaction Depth | — | orchestrator |
| `3` | Rival Actions | — | orchestrator |
| `3b` | Notable Agendas | `THR-630` | orchestrator |
| `4` | Stealth | — | orchestrator |
| `5.9` | Essence Sources | `THR-611` | orchestrator |
| `6` | Essence | — | orchestrator |
| `6.1` | Control Effects | — | orchestrator |
| `6.55` | Faction Reputation Decay | `TB-060` | orchestrator |
| `6.56` | Chosen Faction Powers | `THR-513` | orchestrator |
| `6.6` | Divine Influence Decay | — | orchestrator |
| `6.7` | Hidden Mark Decay | `THR-112` | orchestrator |
| `6.71` | Intelligence Reliability Decay | `THR-137` | orchestrator |
| `6.715` | Divine Proximity Importance | `THR-25` | orchestrator |
| `6.62` | Trade Route Decay | — | orchestrator |
| `6.625` | Condition Decay | — | orchestrator |
| `6.625b` | Companion expiry | `THR-1096` | orchestrator |
| `6.626` | Mastery Trait Decay | — | orchestrator |
| `6.63` | Settlement Prosperity | — | orchestrator |
| `6.632` | Economic Traits | — | orchestrator |
| `6.634` | Reputation Traits | — | orchestrator |
| `6.635` | Settlement Tier Promotion/Demotion | — | orchestrator |
| `6.636` | Settlement Genome Reassessment | — | orchestrator |
| `6.637` | Unrest | — | orchestrator |
| `6.638` | Magical Saturation | — | orchestrator |
| `6.639` | Sphere Pressure Resolution | — | orchestrator |
| `6.6396` | Quintessence Tick | — | orchestrator |
| `6.6395` | Sphere Aggregation | — | orchestrator |
| `6.64` | Influence Tier Promotion | — | orchestrator |
| `6.65` | Gold Sublocations | — | orchestrator |
| `6.66` | Economic Chronicle | — | orchestrator |
| `6.75` | Agent Lifecycle | — | orchestrator |
| `5` | Narrative | — | orchestrator |
| `8` | Doom Expiry | — | orchestrator |
| `end` | Drift Decay — passive per-tick decay toward zero | `THR-323` | orchestrator |
| `doom` | doom | — | registry |
| `autonomous_aftermath` | autonomous_aftermath | — | registry |
| `player_receipts` | player_receipts | — | registry |
| `emitted_omen_decay` | emitted_omen_decay | — | registry |
| `planted_compulsion_decay` | planted_compulsion_decay | — | registry |
| `reputation_decay` | reputation_decay | — | registry |
| `resource_stock_tiers` | resource_stock_tiers | — | registry |
| `route_events` | route_events | — | registry |
| `army_supply` | army_supply | — | registry |
| `economic_power` | economic_power | — | registry |
| `ambition_progress` | ambition_progress | — | registry |
| `faction_ambitions` | faction_ambitions | — | registry |
| `faction_actions` | faction_actions | — | registry |
| `schism_resolution` | schism_resolution | — | registry |
| `secrets_favors` | secrets_favors | — | registry |
| `clue_decay` | clue_decay | — | registry |
| `ruin_quest_hooks` | ruin_quest_hooks | — | registry |
| `delve_admission` | delve_admission | — | registry |
| `delve_progression` | delve_progression | — | registry |
| `delve_emergence` | delve_emergence | — | registry |
| `pop_streams` | pop_streams | — | registry |
| `personality_origin_seed` | personality_origin_seed | — | registry |
| `personality_trait_emerge` | personality_trait_emerge | — | registry |
| `core_personality` | core_personality | — | registry |
| `mandate` | mandate | — | registry |
| `faction_succession` | faction_succession | — | registry |

## Engine modules by domain (full)

Every module under `src/engine/**` (excluding tests), clustered by sub-directory or leading token. The
completeness guarantee — if a system is coded, it is in this table. Sorted alphabetically for grep.

| Domain | Files | Tags |
|---|---|---|
| `action` (3) | `actionCandidates.ts`, `actionLifecycle.ts`, `actionUnlock.ts` | `THR-501` |
| `activity` (1) | `activitySummary.ts` | — |
| `aftermath` (1) | `aftermathWords.ts` | `THR-1004` |
| `agenda` (1) | `agendaGenerator.ts` | — |
| `agent` (8) | `agentActivity.ts`, `agentAttachments.ts`, `agentDetail.ts`, `agentGeneration.ts`, `agentLifecycle.ts`, `agentResidence.ts`, `agentSelection.ts`, `agentValidation.ts` | `THR-1289`, `THR-1296`, `THR-719`, `THR-822` |
| `ambition` (6) | `ambitionAssignment.ts`, `ambitionBoost.ts`, `ambitionLifecycle.ts`, `ambitionSelection.ts`, `ambitionShape.ts`, `ambitionTick.ts` | `THR-1277`, `THR-1285`, `THR-1298`, `THR-885` |
| `anoint` (1) | `anointSuccessor.ts` | `THR-432`, `THR-74` |
| `archetype` (1) | `archetypeEpithet.ts` | `Phase 12`, `TB-075` |
| `army` (5) | `armyAttrition.ts`, `armyMovement.ts`, `armyNotifications.ts`, `armySpawning.ts`, `armySupply.ts` | `Phase 1`, `Phase 2`, `Phase 7`, `TB-073`, `THR-626` |
| `ascendant` (9) | `ascendant.ts`, `ascendantBeat.ts`, `ascendantBeatSeeding.ts`, `ascendantBuffs.ts`, `ascendantExpression.ts`, `ascendantFeedback.ts`, `ascendantLens.ts`, `ascendantPrimitives.ts`, `ascendantTray.ts` | `THR-184`, `THR-416`, `THR-500`, `THR-503`, `THR-508`, `THR-509`, `THR-517`, `THR-520` |
| `aspects` (1) | `aspects.ts` | `THR-479` |
| `attachment` (5) | `attachmentSlotResolver.ts`, `attachmentTemplateDetail.ts`, `attachmentTemplateIndex.ts`, `attachmentTierAdvancement.ts`, `attachmentTooltip.ts` | `THR-1120`, `THR-1122`, `THR-718`, `THR-719`, `THR-723`, `THR-784`, `THR-974`, `THR-996`, `THR-997` |
| `attention` (2) | `attentionPool.ts`, `attentionTier.ts` | — |
| `avatar` (1) | `avatarMove.ts` | — |
| `backstory` (2) | `backstoryGenerator.ts`, `backstoryResolvers.ts` | — |
| `balance` (4) | `balanceEvaluator.ts`, `balanceSummary.ts`, `balanceTargets.ts`, `balanceTelemetry.ts` | `Phase 1` |
| `battle` (3) | `battleAftermath.ts`, `battleResolution.ts`, `battleSpotlights.ts` | `Phase 3`, `Phase 4`, `Phase 5`, `TB-073` |
| `binding` (9) | `binding/applyBinding.ts`, `binding/binder.ts`, `binding/bindingRegistry.ts`, `binding/creationEffects.ts`, `binding/encounterBinderContext.ts`, `binding/mintInhabitant.ts`, `binding/remoteAnchor.ts`, `binding/roleCensus.ts`, `binding/undertakingBindPass.ts` | `THR-1289`, `THR-1290`, `THR-1292`, `THR-1296`, `THR-1305` |
| `broken` (1) | `brokenState.ts` | `THR-773` |
| `callback` (1) | `callbackEligibility.ts` | — |
| `capability` (1) | `capabilityGrowth.ts` | — |
| `chapter` (1) | `chapterArchive.ts` | `THR-603` |
| `chosen` (1) | `chosenFactionPowers.ts` | `THR-509`, `THR-513` |
| `chronicle` (1) | `chronicle.ts` | `THR-21` |
| `clearance` (1) | `clearanceGate.ts` | — |
| `coastline` (1) | `coastline.ts` | — |
| `companions` (1) | `companions.ts` | `THR-1096` |
| `complication` (2) | `complicationEffects.ts`, `complicationSelection.ts` | `THR-20` |
| `condition` (2) | `conditionDecay.ts`, `conditionOverflow.ts` | `THR-1143`, `THR-761` |
| `content-eval` (6) | `content-eval/collectAuthoredProse.ts`, `content-eval/detectors.ts`, `content-eval/proseQualityScore.ts`, `content-eval/registerCompliance.ts`, `content-eval/surfaceFragmentReport.ts`, `content-eval/unreachableActions.ts` | `THR-472`, `THR-490`, `THR-501`, `THR-523`, `THR-573`, `THR-609`, `THR-659` |
| `contentcensus` (5) | `contentCensus/adapters.ts`, `contentCensus/constants.ts`, `contentCensus/index.ts`, `contentCensus/matrix.ts`, `contentCensus/types.ts` | — |
| `contestation` (1) | `contestation.ts` | `Phase 3`, `THR-731` |
| `context` (1) | `contextBuilder.ts` | — |
| `control` (2) | `controlContestationResolver.ts`, `controlEffectSpawn.ts` | `Phase 1`, `Phase 2`, `TB-045`, `THR-518` |
| `core` (2) | `core/coreConstants.ts`, `core/coreMechanics.ts` | `THR-542`, `THR-544` |
| `cosmology` (1) | `cosmology.ts` | — |
| `cultural` (4) | `culturalGravity.ts`, `culturalProse.ts`, `culturalTension.ts`, `culturalTraits.ts` | — |
| `culture` (5) | `cultureDetail.ts`, `cultureFlag.ts`, `cultureGenerator.ts`, `cultureMores.ts`, `culturePhonetics.ts` | `M20`, `M30`, `M50`, `M70`, `THR-15` |
| `curator` (1) | `curator.ts` | — |
| `cycle` (1) | `cycleEnd.ts` | — |
| `debug` (7) | `debugAgentResolver.ts`, `debugCommands.ts`, `debugEncounterTools.ts`, `debugOutcomePin.ts`, `debugTickBatch.ts`, `debugVisibilityOverride.ts`, `debugWorldSpawnTools.ts` | `THR-1030`, `THR-1032`, `THR-689`, `THR-878` |
| `decay` (1) | `decayCurve.ts` | — |
| `decision` (1) | `decisionBoard.ts` | `THR-1292`, `THR-1349` |
| `delivery` (2) | `delivery.ts`, `deliveryBeatAdapter.ts` | `THR-452`, `THR-506`, `THR-514` |
| `depression` (2) | `depressionFilling.ts`, `depressionLakes.ts` | — |
| `derive` (1) | `deriveLocationActivities.ts` | — |
| `detail` (2) | `detailPageGenerator.ts`, `detailPageResolvers.ts` | `THR-577` |
| `digest` (1) | `digestBuffer.ts` | — |
| `disposition` (1) | `disposition.ts` | — |
| `distance` (1) | `distanceMatrix.ts` | `THR-1183`, `THR-1346` |
| `divine` (1) | `divineAttention.ts` | — |
| `domain` (1) | `domainCapability.ts` | — |
| `doom` (2) | `doomClock.ts`, `doomIdentityMilestones.ts` | — |
| `dream` (1) | `dream.ts` | — |
| `echo` (1) | `echo.ts` | — |
| `economic` (2) | `economicChronicle.ts`, `economicContext.ts` | `THR-725` |
| `effect` (6) | `effectAura.ts`, `effectExecutors.ts`, `effectResolver.ts`, `effectScope.ts`, `effectShellRuntime.ts`, `effectTick.ts` | `Phase 2`, `THR-53` |
| `effects` (15) | `effects/actionTrigger.ts`, `effects/actionTriggerPayloads.ts`, `effects/actorClassification.ts`, `effects/conditionProxyEvents.ts`, `effects/consumableCharges.ts`, `effects/effectEventDispatch.ts`, `effects/effectEvents.ts`, `effects/effectOverlayStore.ts`, `effects/effectPredicates.ts`, `effects/effectQueries.ts`, `effects/effectSuppression.ts`, `effects/effectWalker.ts`, `effects/index.ts`, `effects/resourceDelta.ts`, `effects/ruleOverrideConsumers.ts` | `Phase 3`, `Phase 5`, `TB-104`, `THR-1239`, `THR-1240`, `THR-1241`, `THR-1242`, `THR-1244`, `THR-1257`, `THR-719`, `THR-761` |
| `elder` (1) | `elderEssenceReward.ts` | `TB-043`, `THR-153` |
| `encounter` (19) | `encounter-contract-adapter.ts`, `encounter.ts`, `encounter/branchingConstants.ts`, `encounter/branchingCurator.ts`, `encounterAftermath.ts`, `encounterAwareness.ts`, `encounterCache.ts`, `encounterChains.ts`, `encounterChoiceMemory.ts`, `encounterEventNode.ts`, `encounterFilterPipeline.ts`, `encounterLogExporter.ts`, `encounterRuntime.ts`, `encounterScoring.ts`, `encounterSeeding.ts`, `encounterSupportBundle.ts`, `encounterSurface.ts`, `encounterTimeline.ts`, `encounterVisibility.ts` | `Phase 4`, `TB-035`, `TB-077`, `THR-1123`, `THR-452`, `THR-465`, `THR-475`, `THR-697`, `THR-924` |
| `encounters` (18) | `encounters/branchDecision.ts`, `encounters/choiceResolution.ts`, `encounters/dealHand.ts`, `encounters/detectionPressure.ts`, `encounters/driftAccumulator.ts`, `encounters/encounterTemplateGraph.ts`, `encounters/generateEncounterCandidates.ts`, `encounters/handFilter.ts`, `encounters/itemConsumption.ts`, `encounters/motiveClassifier.ts`, `encounters/nudgeDispatch.ts`, `encounters/nudges.ts`, `encounters/outcomeForecast.ts`, `encounters/placeGating.ts`, `encounters/poleLean.ts`, `encounters/reactionChooser.ts`, `encounters/relationshipResolver.ts`, `encounters/stepFactorLines.ts` | `THR-1247`, `THR-327`, `THR-528`, `THR-530`, `THR-631`, `THR-773`, `THR-883`, `THR-885`, `THR-887`, `THR-892`, `THR-894`, `THR-898`, `THR-963` |
| `engine` (1) | `engineEffectRegistry.ts` | `THR-604`, `THR-996` |
| `essence` (5) | `essenceEarned.ts`, `essenceEconomyBridge.ts`, `essenceIncome.ts`, `essenceSourceSeeding.ts`, `essenceSources.ts` | `THR-1180`, `THR-611`, `THR-615`, `THR-618` |
| `event` (1) | `eventAggregation.ts` | `THR-456` |
| `faction` (12) | `factionAmbitions.ts`, `factionAwareness.ts`, `factionGovernanceVerbs.ts`, `factionMemberWork.ts`, `factionMembership.ts`, `factionNetwork.ts`, `factionOutcome.ts`, `factionQuestGeneration.ts`, `factionRankBonus.ts`, `factionReputation.ts`, `factionSeeding.ts`, `factionTopology.ts` | `Phase 0`, `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`, `TB-061`, `TB-073`, `THR-1144`, `THR-1211`, `THR-400`, `THR-430`, `THR-711`, `THR-810`, `THR-814` |
| `failure` (1) | `failureStoryArtifact.ts` | `THR-470`, `THR-571` |
| `familiarity` (1) | `familiarity.ts` | — |
| `followed` (1) | `followedAgents.ts` | `THR-1292`, `THR-1299` |
| `force` (1) | `forceField.ts` | — |
| `foreshadowing` (10) | `foreshadowing/attributeRecentInterventions.ts`, `foreshadowing/composeGeneric.ts`, `foreshadowing/composeReceipt.ts`, `foreshadowing/constants.ts`, `foreshadowing/encounterForeshadowing.ts`, `foreshadowing/genericFallback.ts`, `foreshadowing/motiveReceipt.ts`, `foreshadowing/realizer.ts`, `foreshadowing/receiptRead.ts`, `foreshadowing/types.ts` | `Phase 1`, `Phase 3`, `THR-389`, `THR-631`, `THR-640`, `THR-642` |
| `fragment` (1) | `fragmentResolution.ts` | `THR-475`, `THR-573`, `THR-884` |
| `game` (1) | `gameInit.ts` | — |
| `graph` (5) | `graph.ts`, `graphConditions.ts`, `graphOpExecutor.ts`, `graphQueries.ts`, `graphUtils.ts` | `THR-1296`, `THR-1297`, `THR-786`, `THR-822`, `THR-841` |
| `grievance` (3) | `grievance/grievanceLifecycle.ts`, `grievance/grudgeEdge.ts`, `grievance/undertakingOutcomeNode.ts` | `THR-1298`, `THR-1348`, `THR-731` |
| `group` (1) | `groupShape.ts` | `THR-1297` |
| `groups` (15) | `groups/bandOpposition.ts`, `groups/bandSpawner.ts`, `groups/groupCohesion.ts`, `groups/groupDissolution.ts`, `groups/groupEligibility.ts`, `groups/groupFormation.ts`, `groups/groupFray.ts`, `groups/groupMovement.ts`, `groups/groupNames.ts`, `groups/groupParting.ts`, `groups/groupQueries.ts`, `groups/groupResolution.ts`, `groups/groupReunion.ts`, `groups/groupSeeking.ts`, `groups/phaseGroups.ts` | `TB-044`, `THR-1174`, `THR-1297`, `THR-731`, `THR-732`, `THR-74` |
| `guild` (1) | `guildSeeding.ts` | — |
| `hex` (7) | `hexActionBridge.ts`, `hexActorIndex.ts`, `hexGrid.ts`, `hexMovementPath.ts`, `hexRegion.ts`, `hexVignette.ts`, `hexZoom.ts` | `TB-046`, `THR-188` |
| `hidden` (2) | `hiddenMarkProse.ts`, `hiddenMarks.ts` | `THR-132` |
| `historical` (1) | `historicalCulture.ts` | — |
| `holdings` (1) | `holdings.ts` | `THR-1297` |
| `idle` (1) | `idleBehavior.ts` | — |
| `influence` (1) | `influence.ts` | — |
| `insider` (1) | `insiderBeatDetection.ts` | — |
| `intelligence` (1) | `intelligence.ts` | `THR-113`, `THR-140` |
| `intervention` (4) | `interventionCost.ts`, `interventionEffects.ts`, `interventionStanceWords.ts`, `interventionTracking.ts` | `THR-1048`, `THR-772` |
| `journey` (1) | `journeyEngine.ts` | `Phase 2`, `TB-035` |
| `kpi` (3) | `kpi/branchingDistance.ts`, `kpi/gameplayKpi.ts`, `kpi/kpiConstants.ts` | `THR-452`, `THR-457`, `THR-571` |
| `lair` (3) | `lairClearing.ts`, `lairEscalation.ts`, `lairSeeding.ts` | `M2.5`, `Phase 2`, `THR-1319` |
| `lake` (2) | `lakeGeneration.ts`, `lakeOutflow.ts` | — |
| `magic` (1) | `magicPower.ts` | — |
| `mandate` (3) | `mandate.ts`, `mandateGenerator.ts`, `mandateMilestoneProse.ts` | `THR-1197`, `THR-1198` |
| `meeting` (1) | `meetingEncounter.ts` | `THR-1213` |
| `mentorship` (2) | `mentorshipOutcomes.ts`, `mentorshipUndertaking.ts` | `THR-1292`, `THR-75` |
| `modifiers` (1) | `modifiers.ts` | — |
| `monster` (1) | `monsterFactionSeed.ts` | — |
| `movement` (3) | `movementCandidates.ts`, `movementCost.ts`, `movementExecution.ts` | `THR-1143` |
| `naming` (2) | `naming/lairNames.ts`, `naming/workNames.ts` | `THR-1291`, `THR-1297`, `THR-1312` |
| `narrative` (2) | `narrative-constants.ts`, `narrative.ts` | — |
| `notable` (1) | `notableAgendas.ts` | `THR-225`, `THR-630`, `THR-66` |
| `notification` (3) | `notificationRouter.ts`, `notificationThreadingGate.ts`, `notificationVisibilityFilter.ts` | `THR-666`, `THR-667`, `THR-727` |
| `npc` (2) | `npcGraduation.ts`, `npcSeeding.ts` | — |
| `nudge` (2) | `nudgeCardRepertoire.ts`, `nudgeGrantLiveness.ts` | `THR-1248`, `THR-791`, `THR-844`, `THR-885`, `THR-887` |
| `orchestrator` (5) | `orchestrator.ts`, `orchestrator/phaseAscendantHandFilter.ts`, `orchestrator/phaseChoiceResolution.ts`, `orchestrator/phaseDetectionPressure.ts`, `orchestrator/phaseDriftDecay.ts` | `THR-1183`, `THR-528` |
| `outcome` (1) | `outcomeConsequences.ts` | `Phase 6` |
| `pacing` (1) | `pacingGovernor.ts` | — |
| `pathfinding` (1) | `pathfinding.ts` | — |
| `personality` (2) | `personality/originBaseline.ts`, `personality/originConstants.ts` | `THR-539`, `THR-561` |
| `phase` (39) | `phaseAgentDecision.ts`, `phaseAscendantProgression.ts`, `phaseAttention.ts`, `phaseColocationDetection.ts`, `phaseComposition.ts`, `phaseControlEffects.ts`, `phaseDivinePremonition.ts`, `phaseDoom.ts`, `phaseEconomicChronicle.ts`, `phaseEconomicTraits.ts`, `phaseEffectShells.ts`, `phaseEncounterTraits.ts`, `phaseEssenceSources.ts`, `phaseFactionActions.ts`, `phaseFactionSuccession.ts`, `phaseHexState.ts`, `phaseHiddenMarkDecay.ts`, `phaseIntelligenceDecay.ts`, `phaseInteractionDepth.ts`, `phaseMagicalSaturation.ts`, `phaseMandate.ts`, `phaseMovement.ts`, `phaseOmenAgenda.ts`, `phaseProsperity.ts`, `phaseQuintessence.ts`, `phaseRegistry.ts`, `phaseReputationDecay.ts`, `phaseReputationTraits.ts`, `phaseSchismResolution.ts`, `phaseSecretsFavors.ts`, `phaseSettlementPromotion.ts`, `phaseSettlementReassessment.ts`, `phaseSlotCaps.ts`, `phaseSphereAggregation.ts`, `phaseSpherePressure.ts`, `phaseStrategicProjects.ts`, `phaseSublocations.ts`, `phaseTradeRouteDecay.ts`, `phaseUnrest.ts` | `Phase 1`, `Phase 12`, `Phase 2`, `Phase 4`, `Phase 6`, `Phase 7`, `TB-045`, `TB-075`, `THR-1206`, `THR-1292`, `THR-132`, `THR-1320`, `THR-137`, `THR-19`, `THR-238`, `THR-30`, `THR-430`, `THR-432`, `THR-469`, `THR-481`, `THR-53`, `THR-611`, `THR-613`, `THR-618` |
| `phases` (26) | `phases/ambitionProgress.ts`, `phases/armySupply.ts`, `phases/clueDecay.ts`, `phases/corePersonality.ts`, `phases/delveAdmission.ts`, `phases/delveEmergence.ts`, `phases/delveProgression.ts`, `phases/doom.ts`, `phases/economicPower.ts`, `phases/emittedOmenDecay.ts`, `phases/factionActions.ts`, `phases/factionAmbitions.ts`, `phases/factionSuccession.ts`, `phases/index.ts`, `phases/mandate.ts`, `phases/personalityOriginSeed.ts`, `phases/personalityTraitEmerge.ts`, `phases/phaseAutonomousAftermath.ts`, `phases/plantedCompulsionDecay.ts`, `phases/popStreams.ts`, `phases/reputationDecay.ts`, `phases/resourceStockTiers.ts`, `phases/routeEvents.ts`, `phases/ruinQuestHooks.ts`, `phases/schismResolution.ts`, `phases/secretsFavors.ts` | `THR-238`, `THR-430`, `THR-432`, `THR-527`, `THR-530`, `THR-539`, `THR-542`, `THR-544`, `THR-559`, `THR-561`, `THR-615`, `THR-617`, `THR-626`, `THR-669`, `THR-686`, `THR-815`, `THR-886` |
| `planner` (1) | `plannerForecast.ts` | `Phase 4` |
| `planted` (1) | `plantedCompulsion.ts` | `THR-886` |
| `player` (3) | `playerCastDispatch.ts`, `playerCastReadout.ts`, `playerReceipts.ts` | `THR-727`, `THR-739`, `THR-998` |
| `portfolio` (1) | `portfolioManager.ts` | — |
| `premonition` (2) | `premonitionActions.ts`, `premonitionCompulsion.ts` | — |
| `profile` (1) | `profileGenerator.ts` | `THR-872` |
| `prose` (5) | `proseComposer.ts`, `proseEnrichment.ts`, `proseGenerator.ts`, `proseResolvers.ts`, `proseSelection.ts` | `Phase 5`, `TB-035`, `THR-456` |
| `quest` (1) | `questVisibility.ts` | `TB-061` |
| `quintessence` (1) | `quintessenceActions.ts` | `Phase 2`, `Phase 3` |
| `rarity` (2) | `rarity.ts`, `raritySeeding.ts` | — |
| `reach` (1) | `reachSignatureMarkers.ts` | `THR-550`, `THR-551`, `THR-552`, `THR-554` |
| `region` (5) | `regionDetection.ts`, `regionLabels.ts`, `regionNaming.ts`, `regionPolitical.ts`, `regionTypes.ts` | — |
| `rekindle` (1) | `rekindleThread.ts` | `THR-605`, `THR-773` |
| `relocation` (1) | `relocationIntent.ts` | `THR-1141`, `THR-1142`, `THR-74` |
| `remembrance` (1) | `remembrance.ts` | — |
| `reputation` (2) | `reputation.ts`, `reputationWalk.ts` | `THR-1206` |
| `resolution` (4) | `resolution.ts`, `resolutionModifiers.ts`, `resolutionScaleAdjust.ts`, `resolutionService.ts` | `Phase 2`, `THR-451`, `THR-571`, `THR-827` |
| `resource` (2) | `resourceEconomy.ts`, `resourceSeeding.ts` | `THR-615` |
| `retinue` (1) | `retinue.ts` | — |
| `return` (1) | `returnEngine.ts` | `Phase 3`, `TB-035` |
| `revelation` (3) | `revelationEmitter.ts`, `revelationHooks.ts`, `revelationResolver.ts` | `TB-043`, `THR-398`, `THR-853` |
| `reward` (2) | `rewardHistory.ts`, `rewardPool.ts` | `THR-1096`, `THR-1241` |
| `rival` (3) | `rival.ts`, `rivalInfluenceMarkers.ts`, `rivalSourceContestation.ts` | `THR-611`, `THR-621`, `THR-66` |
| `river` (1) | `riverGeneration.ts` | — |
| `road` (1) | `roadNetwork.ts` | — |
| `ruins` (9) | `ruins/clueLifecycle.ts`, `ruins/constants.ts`, `ruins/delveTypes.ts`, `ruins/delveVariant.ts`, `ruins/elderRuinSeeding.ts`, `ruins/perceiveRelay.ts`, `ruins/placeOfPowerStreams.ts`, `ruins/questHooks.ts`, `ruins/ruinTransformation.ts` | `THR-148`, `THR-149`, `THR-150`, `THR-151`, `THR-152`, `THR-153`, `THR-156` |
| `schism` (1) | `schismPlant.ts` | `THR-430` |
| `scry` (1) | `scry.ts` | — |
| `secret` (1) | `secretGeneration.ts` | `THR-30` |
| `secrets` (2) | `secretsFavorsConsequences.ts`, `secretsFromResolution.ts` | `THR-30`, `THR-724` |
| `seed` (1) | `seedAttachments.ts` | — |
| `settlementgenome` (11) | `settlementGenome/archetypes.ts`, `settlementGenome/constants.ts`, `settlementGenome/cultureBaseline.ts`, `settlementGenome/index.ts`, `settlementGenome/infrastructure.ts`, `settlementGenome/materialize.ts`, `settlementGenome/reachMenu.ts`, `settlementGenome/runGenome.ts`, `settlementGenome/sphereMenu.ts`, `settlementGenome/types.ts`, `settlementGenome/vitality.ts` | `THR-1344` |
| `siege` (1) | `siegeResolution.ts` | `Phase 4`, `TB-073` |
| `simulation` (2) | `simulation.ts`, `simulationRuntime.ts` | `TB-086`, `TB-087` |
| `social` (4) | `socialCounterArgument.ts`, `socialEncounterGeneration.ts`, `socialLeverage.ts`, `socialOutcome.ts` | — |
| `spell` (1) | `spellActivation.ts` | — |
| `sphere` (2) | `sphereAffinity.ts`, `sphereScaling.ts` | — |
| `stealth` (1) | `stealth.ts` | — |
| `step` (1) | `stepResolutionCore.ts` | `THR-1292` |
| `strands` (1) | `strands.ts` | — |
| `strategic` (7) | `strategicActionCandidates.ts`, `strategicActionLifecycle.ts`, `strategicActionScoring.ts`, `strategicGraphOps.ts`, `strategicKindReachability.ts`, `strategicPresentation.ts`, `strategicTelemetry.ts` | `THR-1309`, `THR-1329` |
| `sublocation` (2) | `sublocation.ts`, `sublocationShape.ts` | `THR-1177`, `THR-1183`, `THR-1193` |
| `support` (1) | `supportRoleWords.ts` | `THR-1041` |
| `survey` (1) | `surveyProseComposer.ts` | `THR-415` |
| `target` (3) | `targetActions.ts`, `targetContextBuilders.ts`, `targetTierScaling.ts` | `THR-1073`, `THR-1100`, `THR-996` |
| `taxonomy` (1) | `taxonomy.ts` | — |
| `temporal` (1) | `temporal.ts` | — |
| `terrain` (1) | `terrain.ts` | — |
| `terrainpipeline` (1) | `terrainPipeline/types.ts` | — |
| `thread` (1) | `threadDigest.ts` | — |
| `threat` (1) | `threatRating.ts` | — |
| `tick` (1) | `tickHealthMonitor.ts` | — |
| `tier` (1) | `tierPromotion.ts` | — |
| `tooltip` (1) | `tooltipResolver.ts` | `THR-1094`, `THR-1159`, `THR-1172` |
| `trace` (1) | `traceBuffer.ts` | — |
| `trade` (3) | `tradeRoute.ts`, `tradeRouteMarkers.ts`, `tradeRouteOps.ts` | `Phase 1`, `THR-1188`, `THR-611`, `THR-616`, `THR-670`, `THR-830` |
| `trait` (3) | `traitDefinitionSeeding.ts`, `traitRefIndex.ts`, `traitRefValidation.ts` | `THR-786`, `THR-809` |
| `traits` (1) | `traits.ts` | `THR-786` |
| `treasure` (1) | `treasureMapConsumption.ts` | — |
| `trust` (1) | `trustMechanics.ts` | — |
| `undertaking` (3) | `undertakingCheckpoints.ts`, `undertakingMoments.ts`, `undertakingMotive.ts` | `THR-1281`, `THR-1292`, `THR-1297`, `THR-1299` |
| `unified` (4) | `unifiedActionLifecycle.ts`, `unifiedActionPhases.ts`, `unifiedActionResolution.ts`, `unifiedCandidates.ts` | `Phase 1`, `Phase 2`, `Phase 3`, `Phase 4`, `Phase 6`, `Phase 7` |
| `view` (1) | `viewLevel.ts` | — |
| `vignette` (2) | `vignetteNotification.ts`, `vignetteProse.ts` | — |
| `visibility` (1) | `visibility.ts` | — |
| `wealth` (1) | `wealth.ts` | — |
| `wheel` (1) | `wheel.ts` | — |
| `world` (4) | `worldGenData.ts`, `worldRefResolver.ts`, `worldSeed.ts`, `worldSoul.ts` | `THR-1160`, `THR-1164`, `THR-1165`, `THR-1212` |
| `worldgen` (15) | `worldgen/WorldGenPipeline.ts`, `worldgen/constants.ts`, `worldgen/passes/pass00-grid.ts`, `worldgen/passes/pass01-provinces.ts`, `worldgen/passes/pass02-elevation.ts`, `worldgen/passes/pass03-coastline.ts`, `worldgen/passes/pass04-climate.ts`, `worldgen/passes/pass05-hydrology.ts`, `worldgen/passes/pass06-tempReassess.ts`, `worldgen/passes/pass07-biome.ts`, `worldgen/passes/pass07b-cultureTerrainNudge.ts`, `worldgen/passes/pass08-smoothing.ts`, `worldgen/passes/pass09-validation.ts`, `worldgen/passes/pass10-fantasyOverlay.ts`, `worldgen/types.ts` | `Phase 3` |

---

_Counts: 26 registered subsystems (1 dormant) · 99 tick phases · 179 engine domains · 529 modules._
