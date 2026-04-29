# Integration Wiring Checklist

> **Living document.** Every design plan must include a wiring section that maps new modules to entries on this checklist. Every implementation must verify all listed connections before marking work complete. Maintaining this checklist is part of the Definition of Done for both design and implementation phases.
>
> **Last updated:** 2026-04-19 (THR-174 — Viewport contract audit complete; see [Docs/viewport-audit-2026-04-18.md](../viewport-audit-2026-04-18.md). All 5 primary views pass at 1920×1080.)

---

## How to Use This Checklist

**During design (Cowork):** For each new engine module or UI component in your plan, list which integration surfaces it must connect to. Reference the specific checklist items below. If a surface doesn't exist yet, note that the surface itself must be created.

**During implementation (Claude Code):** Before marking a feature complete, verify every connection listed in the plan's wiring section. Use this checklist as the canonical list of integration surfaces. If you discover a new surface, add it here.

**Rule:** An engine module that is only imported by test files is not integrated. A UI component that is imported but not rendered in JSX is not integrated. Both count as incomplete work.

---

## Integration Surfaces

### 1. Orchestrator Tick Loop (`src/engine/orchestrator.ts`)

Every engine module that produces per-tick state changes must be called from a phase in the orchestrator. Current phases in order:

| Phase | Function | What it does |
|-------|----------|-------------|
| 0 | `phaseDoom` | Doom clock escalation |
| 1.5 | `phaseJourneyBeat` | Journey beat progression |
| 2a | `phaseUnifiedActionProgress` | Action execution & resolution |
| 2a.3 | `phaseEncounterProgressionV2` | Encounter step advancement |
| 2a.52 | `phaseEffectShells` | Non-step-outcome flip_table triggers (attachment_gained, manual); step_outcome triggers fire inline in executeStepResult (THR-53) |
| 2a.4 | `tickEffects` (inline orchestrator block) | Generic effect runtime bookkeeping: duration, cooldown, decay, stacking, attachment removal |
| 2a.6 | `phaseEncounterVisibility` | Encounter notifications |
| 2a.55 | `phaseStrategicProjects` | Strategic project progression + control degradation |
| 2a.85 | `phaseSlotCaps` + `phaseDisposalTimeout` | Attachment slot cap enforcement + disposal timeout |
| 2b | `phaseAgentDecision` | Goal selection & movement initiation (+ strategic candidate merge) |
| 3 | `phaseMovement` | Pathfinding & hex traversal |
| 3.5 | `phaseColocationDetection` | Agent proximity events |
| 4 | `phaseDilemmaDetection` | Moral choice generation |
| 4.5 | `phaseFamiliarityGain` | Proximity-based familiarity |
| 5 | `phaseRivalActions` | Rival behavior |
| 5.5 | `phaseStealth` | Exposure detection |
| 6 | `phaseNarrative` | Vignette & prose generation |
| 7 | `phaseEssence` | Pool regeneration & decay |
| 7.1 | `phaseReputationDecay` | Reputation time-decay |
| 6.7 | `phaseHiddenMarkDecay` | Hidden mark severity decay + floor-drop trace |
| 6.71 | `phaseIntelligenceDecay` | Intelligence reliability decay + threshold-cross chronicle event (THR-137) |
| 6.715 | `runDivineProximityPhase` | Divine proximity importance accumulation around ascendant hex (THR-25) |
| 1.7a | `phaseEmittedOmenDecay` | Expire aftermath-spawned `EmittedOmen` entries where `tick > expiresTick` (THR-115) |
| 7.2 | `phaseDivineInfluenceDecay` | Divine presence fade |
| 7.5 | `phaseTradeRouteDecay` | Route dissolution |
| 8 | `phaseProsperity` | Settlement economic pulse |
| 8.1 | `phaseEconomicTraits` | Traits from economic activity |
| 8.15 | `phaseReputationTraits` | Reach-polarity reputation tally decay + trait assignment |
| 8.2 | `phaseSettlementPromotion` | Hamlet/town/city tier changes |
| 9 | `phaseHexState` | Corruption/influence decay, terrain mutations |
| 9.1 | `phaseUnrest` | Social stability |
| 9.2 | `phaseMagicalSaturation` | Magical energy decay |
| 10 | `phaseInfluenceTierPromotion` | Backstory unlocks |
| 10.1 | `phaseSublocations` | Sublocation spawn/dissolve |
| 10.5 | `phaseEconomicChronicle` | Economic state records |
| 11 | `phaseAmbitionProgress` | Ambition milestone/completion |
| 12 | `phaseAgentLifecycle` | Birth, death, migration |
| 12.1 | `phaseMandate` | Player mandate progress, checkpoint feedback, doom debt, counter-omens |
| 13 | `phaseDoomExpiry` | Doom conclusion |

| 6.6396 | `phaseQuintessence` | Quintessence event processing, regen, dissolution |
| 6.655 | `phaseRuinQuestHooks` | Ruin quest hook issuance — evidence ≥ threshold + Guild within radius → toast + priority boost (THR-156) |
| 6.656 | `phaseDelveAdmission` | Delve admission + queue retry (THR-152) |
| 6.657 | `phaseDelveProgression` | Delve beat resolution (THR-152) |
| 6.658 | `phaseDelveEmergence` | Consequence roll + auto-fire `transformRuinConsequence('let')` on expiry (THR-152/153) |
| 6.659 | `phasePlaceOfPowerStreams` | PoP holder-presence credit + decay countdown + corrupt siphon (THR-153) |

**Phase 2 resolution wiring (2026-04-02):**

| Caller | Uses shared resolver? | Difficulty normalization |
|--------|----------------------|------------------------|
| `unifiedActionResolution.ts` | ✅ `resolveActionShared()` | Already `0..1` — pass through |
| `encounter.ts` | ✅ `resolveActionShared()` | `normalizeLegacyDifficulty()` at boundary |
| `encounterScoring.ts` | ✅ `computeResolutionThreshold()` | `normalizeLegacyDifficulty()` at boundary |
| `contestation.ts` | ⚠️ Still uses `resolution.ts` directly | Legacy — port in future cleanup |

**Phase 2 quintessence telemetry wiring (2026-04-02):**

| Source | Event kind | Threat band? |
|--------|-----------|-------------|
| `phaseQuintessence` (pending events) | `quintessence_changed` / `reason: pending_event` | No |
| `phaseQuintessence` (passive regen) | `quintessence_changed` / `reason: passive_regen` | No |
| `phaseQuintessence` (threshold crossing) | `state_transition` / `threshold_X_to_Y` | No |
| `orchestrator` (encounter failure) | `quintessence_changed` / `reason: encounter_failure_by_band` | ✅ Yes |

**Hidden mark reveal wiring (THR-112, 2026-04-17):**

| Source | Trace category | revealedBy value | Triggered by |
|--------|---------------|-----------------|-------------|
| `phaseHiddenMarkDecay` (floor drop) | `hidden_mark_revealed` | `decay:severity_floor` | Phase 6.7 per tick |
| `consumeMatchingMarks` (encounter resolution) | `hidden_mark_revealed` | templateId | `GameView.tsx` aftermath call |
| `revealHiddenMark` (direct) | `hidden_mark_revealed` | caller-supplied | Any explicit reveal |
| `scoreAndSelect` (scoring boost) | — (no trace; scoring signal only) | — | `phaseAgentDecision` |

Mark reveal scoring: `MARK_REVEAL_SCORING_BONUS=0.3`, cap `MARK_REVEAL_SCORING_CAP=0.9` in `agent-behavior-constants.ts`. Decay constants in `hiddenMarks.ts`.

**Authored aftermath surfaces — hidden_mark + encounter_seed (THR-135, 2026-04-17):**

Per-surface coverage for the two authored aftermath effect kinds introduced by the unified encounter template format. Both kinds are **planted** from `applyEncounterAftermathReaction()` in `src/engine/encounterAftermath.ts` — called from `GameView.tsx:1920` on player-side encounter resolution (not from an orchestrator phase). Their **runtime** lives in the tick loop.

| Surface | Orchestrator phase | GameState field | Trace category | Debug visibility | UI surfacing |
|---------|-------------------|-----------------|----------------|-----------------|-------------|
| `hidden_mark` effect | Plant: `applyEncounterAftermathReaction` (called from `GameView.tsx:1920`, not a phase). Decay: Phase 6.7 `phaseHiddenMarkDecay`. Consume at resolution: `consumeMatchingMarks` (`GameView.tsx:1921`). Scoring boost: Phase 2b `phaseAgentDecision` via `scoreAndSelect` (`MARK_REVEAL_SCORING_BONUS`). | `state.hiddenMarks?: HiddenMark[]` (`src/types/gameState.ts:208`) | `hidden_mark_placed` (on aftermath), `hidden_mark_revealed` (on consume / decay floor drop) | DebugPanel → Marks tab (filtered by followed agent when set). Source: `HiddenMarksTab.tsx`. | `ripple_consequence` `TickEvent` (`"A buried truth surfaces: {label}"`, significance 0.7) → `NarrativeLog` + `ToastStack`. Low-significance place event (0.3) also filed to chronicle. Prose upgrade tracked in THR-132. |
| `encounter_seed` effect | Plant: `applyEncounterAftermathReaction` (called from `GameView.tsx:1920`). Evaluate: Phase 2a.8 `evaluateEncounterSeeds` (`orchestrator.ts:1802`) — templateId spawn, family-only narrative, or fail-soft expire. | `state.pendingEncounterSeeds?: PendingEncounterSeed[]` (`src/types/gameState.ts:205`) | `encounter_seed_planted` (on aftermath), `encounter_seed_triggered` (on evaluation; `outcome: 'fired' \| 'discarded'`, `discardReason` when discarded) | DebugPanel → Seeds tab (full queue with ready/waiting filter). Source: `EncounterSeedsTab.tsx`. | `narrative` `TickEvent`s → `NarrativeLog`: planted ("A thread has been planted", sig 0.5), spawned ("A planted thread bears fruit", sig 0.65), family-ready ("may surface soon", sig 0.55), expired ("withered before it could take root", sig 0.3). Spawned template enters the agent's `unifiedActions` queue and surfaces through the normal encounter notification pipeline. |

**Verification pointers:**

* Placement + trace emission: `src/engine/encounterAftermath.ts` (hidden_mark at ~line 242; encounter_seed at ~line 180)
* Hidden mark reveal / decay: `src/engine/hiddenMarks.ts`, `src/engine/phaseHiddenMarkDecay.ts`
* Seed evaluation: `src/engine/encounterSeeding.ts`
* Trace type definitions: `src/types/trace.ts` (categories `hidden_mark_placed`, `hidden_mark_revealed`, `encounter_seed_planted`, `encounter_seed_triggered`)

**Secrets & Favors graph layer (THR-30, 2026-04-18):**

`knows_secret_of` (discoverer→subject) and `owes_favor` (debtor→creditor) edges form a persistent social leverage layer. Both feed `computeInitialLeverage()` which is called at the start of every social encounter resolution.

| Surface | Orchestrator phase | Data / Graph surface | Trace categories | Debug visibility | Player visibility |
|---------|-------------------|---------------------|-----------------|-----------------|------------------|
| Secret accumulation | Phase 2a encounter resolution — `secretDiscovery` metadata in template step; `secret_discovery` aftermath effect kind | `knows_secret_of` edges (source=discoverer, target=subject, props: secretType/magnitude/revealed/source/discoveredTick) | `secret_discovered` | DebugPanel → Secrets & Favors tab | AgentDetailPanel → LeverageSection ("Secrets held / Exposed") |
| Favor accumulation | Phase 2a encounter resolution — `favorGeneration` metadata in template; `favor_creation` aftermath effect kind | `owes_favor` edges (source=debtor, target=creditor, props: magnitude/context/redeemed/broken/grantedTick) | `favor_created` | DebugPanel → Secrets & Favors tab | AgentDetailPanel → LeverageSection ("Favors owed / Owes favors") |
| Phase maintenance | Phase 6.653 `phaseSecretsFavors` | Both edge types; reads graph, writes `revealed`/`broken` flags | `secret_tension_escalated`, `secret_expired`, `favor_expired` | Trace feed | None (background) |
| Leverage calculation | `computeInitialLeverage()` (called at social encounter start, from `socialLeverage.ts`) | Reads outgoing `knows_secret_of` + incoming `owes_favor` edges | (returns LeverageResult, no trace) | AgentDetailPanel LeverageSection | LeverageSection (with magnitude labels) |
| Divine ops | GraphOpExecutor: `reveal_secret`, `call_in_favor`, `plant_secret` | Mutates `revealed`/`redeemed` flags or creates new edge | (inline in op result) | DebugPanel trace feed | ActionDrawer (3 divine templates) |

**Tunables:** `SECRET_LEVERAGE_MULTIPLIER` (0.30), `FAVOR_LEVERAGE_MULTIPLIER` (0.25), `MAX_SECRETS_PER_AGENT` (8), `MAX_FAVORS_PER_AGENT` (6) — all in `src/types/secretsFavors.ts`.

**Verification pointers:**
* Graph edge types: `src/types/edgeSchema.ts` (`knows_secret_of`, `owes_favor`)
* Generation helpers: `src/engine/secretGeneration.ts` (`generateSecret`, `createSecretEdge`, `createFavorEdge`)
* Phase: `src/engine/phaseSecretsFavors.ts` — Phase 6.653 in orchestrator
* Aftermath cases: `src/engine/encounterAftermath.ts` (`case 'secret_discovery'`, `case 'favor_creation'`)
* Template wiring: `src/engine/orchestrator.ts` (~line 552: `secretDiscovery`; ~line 595: `favorGeneration`)
* Leverage: `src/engine/socialLeverage.ts` — `secret_bonus` + `favor_bonus` in `computeInitialLeverage()`
* UI: `src/engine/agentDetail.ts` (`LeverageSummary`), `src/components/Game/AgentDetailPanel.tsx` (`LeverageSection`)
* Debug: `src/components/Game/debug/DebugTabContent.tsx` (`SecretsFavorsDebugTab`)
* Divine ops: `src/engine/graphOpExecutor.ts` + `src/data/unified-action-templates.ts`
* Tests: `src/engine/__tests__/secretsFavors.test.ts` (17 tests)

**Perceive/Relay divine action resolution hook (THR-151, 2026-04-19):**

7 divine action templates that bypass the standard `apply_influence` GraphOp path and instead dispatch to a dedicated resolver after action success. Hook is wired in `unifiedActionResolution.ts` alongside the `revelationAction` hook.

| Template | Handler | Clue/Edge created | Adjacency gate |
|----------|---------|------------------|---------------|
| `divine.perceive.cast_attention` | `resolveCastAttention` | `knows_clue_of` (precision:vague, source:divine_whisper) via `produceClueConsequence` | ✅ bonded agent within 1 hex |
| `divine.perceive.refine_the_hush` | `resolveRefineTheHush` | Upgrades existing vague→narrowed, or spawns new narrowed | ✅ bonded agent within 1 hex |
| `divine.perceive.listen_for_a_name` | `resolveListenForAName` | `knows_clue_of` (narrowed + originCultureId detail) | ✅ bonded agent within 1 hex |
| `divine.perceive.read_the_threads` | `resolveReadTheThreads` | `knows_clue_of` (vague) for PoP nodes at hex | ❌ no gate — uses all threaded agents |
| `divine.perceive.taste_the_wake` | `resolveTasteTheWake` | Emits `ruins.divine_mark_discovered` traces for `knows_secret_of` (divine_mark) edges | ✅ bonded agent within 1 hex |
| `divine.relay.compose_a_clue` | `resolveComposeAClue` | Direct `knows_clue_of` + `knows_secret_of` (divine_mark on agent) | Agent must be bonded |
| `divine.relay.whisper_the_direction` | `resolveWhisperTheDirection` | Sets `movementState.destinationId` to nearest ruin | Agent must be bonded |

**Verification pointers:**
* Resolver: `src/engine/ruins/perceiveRelay.ts` — `resolvePerceiveRelayAction`, `PERCEIVE_RELAY_TEMPLATE_IDS`
* Hook: `src/engine/unifiedActionResolution.ts` (after `revelationAction` hook)
* Templates: `src/data/unified-action-templates.ts` (`divine.perceive.*`, `divine.relay.*`)
* Constants: `src/engine/ruins/constants.ts` (`PERCEIVE_*`, `RELAY_*`, `ADJACENCY_GATE_HEX_RADIUS`)
* Traces: `ruins.divine_mark_discovered` (category in `src/types/trace.ts`)
* Tests: `src/engine/ruins/__tests__/perceiveRelay.test.ts` (20 tests)

**Ruins Quest Hooks — Phase 6.655 (THR-156):**

Channel 6 of Narrative Gravity: when a ruin accumulates `evidenceStrength ≥ CLUE_QUEST_THRESHOLD` (sum of non-consumed `knows_clue_of` edge magnitudes) AND an Adventurer's Guild hall is within `GUILD_QUEST_RADIUS` hexes, the Guild issues a quest hook toast and boosts matching encounter template priority for eligible members.

| Surface | Wiring |
|---------|--------|
| Orchestrator phase | Phase 6.655 `phaseRuinQuestHooks` — runs every `RUIN_QUEST_GENERATION_INTERVAL_TICKS` ticks (every 12 ticks by default) |
| Graph mutations | `graph.updateNode(ruinId, { properties: { ...props, questHookPostedTick: tick, questHookTemplateId } })` — stamped directly on the ruin location node |
| Priority boost consumer | `generateFactionQuestCandidates` in `factionQuestGeneration.ts` — `getActiveRuinQuestTemplateIds()` reads `questHookPostedTick` within cooldown window and adds `QUEST_HOOK_PRIORITY_BOOST = 4.0` for Adventurer's Guild members |
| Player UI | `quest_hook_issued` `TickEvent` with `notification: { channel: 'toast' }` → `ToastStack` (prose from `buildQuestHookMessage`, 5 sphere archetypes). No Guild quest panel — deferred to THR-180. |
| Trace categories | `ruins.quest_hook_issued` (on successful issue), `ruins.quest_hook_suppressed` (on no-guild-in-radius skip) |
| Debug visibility | Trace feed; ruin node properties `questHookPostedTick` + `questHookTemplateId` visible in RuinsDebugTab |
| Duplicate prevention | `QUEST_HOOK_COOLDOWN_TICKS = 60` — ruin skipped if `tick - questHookPostedTick < 60` |

**Constants** (all in `src/engine/ruins/constants.ts`): `CLUE_QUEST_THRESHOLD` (0.5), `GUILD_QUEST_RADIUS` (5 hexes), `QUEST_HOOK_COOLDOWN_TICKS` (60), `QUEST_HOOK_PRIORITY_BOOST` (4.0).

**Verification pointers:**
* Phase: `src/engine/ruins/questHooks.ts` — `phaseRuinQuestHooks`, `getEvidenceStrength`, `selectQuestTemplateForRuin`, `buildQuestHookMessage`
* Priority boost: `src/engine/factionQuestGeneration.ts` — `getActiveRuinQuestTemplateIds`, `questHookBoost` in `generateFactionQuestCandidates`
* Traces: `ruins.quest_hook_issued`, `ruins.quest_hook_suppressed` in `src/types/trace.ts`
* Tests: `src/engine/ruins/__tests__/questHooks.test.ts` (20 tests)
* Deferral: THR-180 (Guild quest panel in LocationDetail view)

---

## Faction Agency — Phase 6.652 (THR-29)

> **Last updated:** 2026-04-19 (THR-29 — Faction Agency complete)

| Capability | Orchestrator wiring | Graph mutations | Traces emitted | Debug visibility | Player-facing UI |
|---|---|---|---|---|---|
| Action evaluation | Phase 6.652 `phaseFactionActions` — runs every `FACTION_ACTION_INTERVAL=8` ticks | `factionActionHistory` + `lastActionTick` on faction node | `faction_action` category per action + `skipped_no_eligible` | Trace feed | None (background) |
| Commission Quest | `executeCommissionQuest` | Creates `event` node (nodeSubtype:`faction_quest`) + `commissions` edge | `faction_action` (executed) | Trace feed | FactionSheet → Recent Actions |
| Declare Rivalry | `executeDeclareRivalry` | Creates/updates `relates_to` edge (isRival:true, sentiment:-0.8) | `faction_action` (executed) | Trace feed | FactionSheet → Relations (Rival badge) |
| Propose Alliance | `executeProposeAlliance` | Creates/updates `relates_to` edge (isAlliance:true, sentiment:0.8) | `faction_action` (executed) | Trace feed | FactionSheet → Relations (Allied badge) |
| Excommunicate | `executeExcommunicate` | Removes `member_of` edge; creates `hostile_to` edge; adds `cast_out` condition; splashes reputation to other memberships | `faction_action` (executed) | Trace feed | FactionSheet → Recent Actions |
| Hold Conclave | `executeHoldConclave` | Sets `activeConclave` property on faction node; resolves after 3 ticks → `dissenting`/`vindicated` conditions on participants | `faction_action` (executed) + conclave resolution | Trace feed | FactionSheet → Current Agenda (conclave block) |
| Issue Bounty | `executeIssueBounty` | Creates `event` node (nodeSubtype:`bounty`) + `issues` edge; adds `hunted` condition to target | `faction_action` (executed) | Trace feed | FactionSheet → Recent Actions |
| Conclave advancement | Every tick (off-interval) via `advanceAllConclaves` | Decrements `ticksRemaining`; clears on resolution | `faction_action` on resolution | Trace feed | FactionSheet → Current Agenda |
| Divine Edict | `action.divine-edict` — ascendant targets faction node | Sets `conclaveLeverageShift: 0.3` on faction | None (via GraphOp) | ActionDrawer | ActionDrawer (star reach, 18 essence) |
| Anoint Champion | `action.anoint-champion` — ascendant targets agent | Sets `championBlessing` property (15 ticks, 2× rep multiplier, 0.2 score boost) | None (via GraphOp) | ActionDrawer | ActionDrawer (iron reach, 14 essence) |

**Tunables** (all in `src/types/factionAction.ts`): `FACTION_ACTION_INTERVAL` (8), `FACTION_ACTION_COOLDOWN` (5), `COMMISSION_QUEST_COST` (5), `RIVALRY_SENTIMENT_THRESHOLD` (-0.3), `ALLIANCE_SENTIMENT_THRESHOLD` (0.3), `BOUNTY_COST` (12), `CONCLAVE_BASE_FREQUENCY_TICKS` (180), `EXCOMMUNICATION_REPUTATION_SPLASH` (0.1), `DIVINE_EDICT_ESSENCE_COST` (18), `ANOINT_CHAMPION_ESSENCE_COST` (14).

**Verification pointers:**
* Types + constants: `src/types/factionAction.ts`
* Phase: `src/engine/phaseFactionActions.ts` — Phase 6.652 in orchestrator
* Encounter templates: `src/data/faction-action-encounters.ts` (8 templates registered in `unified-action-templates.ts`)
* Divine actions: `src/data/unified-action-templates.ts` — `action.divine-edict`, `action.anoint-champion`
* UI: `src/components/Game/FactionSheet.tsx` — Recent Actions, conclave indicator, rival/alliance badges
* `factionNetwork.ts` — `FactionNetworkRelation.isRival/isAlliance`
* Tests: `src/engine/__tests__/phaseFactionActions.test.ts` (10 tests)

**Intelligence consumption pathway (THR-113, 2026-04-17):**

Intelligence records are **granted** by aftermath reactions (`kind: 'intelligence'`, trace: `intelligence_granted`). THR-113 closes the loop by **consuming** them in three sites. All three emit `intelligence_referenced` with a `referencedBy` discriminator.

| Consumption hook | Module | Fires from | `referencedBy` | Effect on state |
|------------------|--------|-----------|---------------|-----------------|
| Scoring boost | `findActionableIntelligence` + `emitIntelligenceReferenced` | `scoreAndSelect` in `encounterScoring.ts`; called from Phase 2b `phaseAgentDecision` | `scoring_boost` | `finalScore` += `INTEL_SCORING_BONUS` (0.25); exposed as `ScoredCandidate.intelBonus` |
| Prose enrichment | `enrichProse` (intel placeholder loop) | `proseEnrichment.ts`; called from encounter stage adapters | `prose_enrichment` | None — prose text only; dedup Set ensures one trace per unique recordId per call |
| Resolution match | `observeResolutionIntelligence` | `GameView.tsx:1935` — after `consumeMatchingMarks` on encounter/action resolution | `resolution_match` | None — passive observation; audit trace only |

**Placeholder vocabulary:** `{intel:<category>}` (label), `{intel:<category>.detail}`, `{intel:<category>.reliability}` (descriptor: reliable/uncertain/dubious), `{?knows_<category>}…{/knows_<category>}`, `{?no_<category>}…{/no_<category>}`. Silent strip on missing record (NFP #4).

**Tunables:** `INTEL_SCORING_BONUS` (`agent-behavior-constants.ts`, default 0.25); `RELIABILITY_THRESHOLD_RELIABLE` (0.7), `RELIABILITY_THRESHOLD_UNCERTAIN` (0.4), `INTEL_RESOLUTION_MATCH_REGIONS` (true), `INTEL_CATEGORIES`, `TEMPLATE_CATEGORY_MATCHERS` (all in `intelligence.ts`); decay: `INTEL_RELIABILITY_DECAY_PER_TICK` (0.001, ~12%/game day), `INTEL_RELIABILITY_FLOOR` (0.0), `INTEL_RELIABILITY_GRACE_TICKS` (20), `INTEL_DECAY_EVENT_SIGNIFICANCE` (0.25) (all in `intelligence.ts`, THR-137).

**Intelligence decay (THR-137, 2026-04-18):** Records persist indefinitely but `reliability` decays linearly after `INTEL_RELIABILITY_GRACE_TICKS` ticks. Floor is `INTEL_RELIABILITY_FLOOR` (0.0) — records remain queryable at floor (dubious-band intel is still knowledge). When reliability crosses a descriptor threshold (`reliable→uncertain` or `uncertain→dubious`), a low-significance `intelligence_decay` `TickEvent` is emitted with prose from `src/data/intelligence-staleness-prose.ts`. Trace: `intelligence_decayed` with before/after/delta/crossedThreshold fields. Decay prose references `{agent.name}` and `{intel.label}` resolved at emission. Shared `reliabilityBand()` helper exported from `intelligence.ts` — used by decay phase, `reliabilityDescriptor()`, and any UI component displaying per-record bands.

**Player-facing display (THR-141, 2026-04-17):**

`AgentIntelligencePanel` surfaces `IntelligenceRecord[]` inside the agent detail view (`ThreadDetailView`). Fog-of-war gate: only renders for `node.tier >= INTEL_PANEL_FOG_MIN_TIER` (1). Sort: reliable → uncertain → dubious; within tier, most recent first. Truncates at `INTEL_PANEL_MAX_RECORDS = 24`. Empty state: "Knows nothing of consequence."

| Surface | Module | Data source | Gate | Debug visibility |
|---------|--------|------------|------|-----------------|
| `AgentIntelligencePanel` | `src/components/Game/AgentIntelligencePanel.tsx` | `gameState.intelligenceRecords` via `ThreadDetailView.intelligenceRecords?` | `node.tier >= 1` | Developer trace feed (`intelligence_granted` / `intelligence_referenced`) is the parallel debug surface |
| `buildIntelligenceDisplay` helper | `src/engine/intelligence.ts` | `readonly IntelligenceRecord[]` + `WorldGraph` + `currentTick` | — | Pure function; tested in `intelligenceDisplay.test.ts` |
| GameView wire | `src/components/Game/GameView.tsx:3061` | `gameState.intelligenceRecords ?? []` | `selectedThreadNode.category === 'agent'` | — |

**Verification pointers:**

* Consumption helpers: `src/engine/intelligence.ts` (`buildIntelligenceView`, `findActionableIntelligence`, `reliabilityDescriptor`, `emitIntelligenceReferenced`, `observeResolutionIntelligence`, `buildIntelligenceDisplay`)
* Scoring site: `src/engine/encounterScoring.ts` — `intelligenceRecords` as 11th arg; `ScoredCandidate.intelBonus`
* Prose site: `src/engine/proseEnrichment.ts` — `NarrativeContext.intelligence?: IntelligenceView`, intel placeholder loop, `{?knows_*}` / `{?no_*}` conditionals in `resolveConditionals`
* Resolution site: `src/components/Game/GameView.tsx` — `observeResolutionIntelligence(afterMarks, activeAction, reaction, prev.tick)` after `consumeMatchingMarks`
* Player display site: `src/components/Game/AgentIntelligencePanel.tsx` — rendered inside `ThreadDetailView` agent body; fog-gated by `node.tier`
* Adapter wiring: `buildUnifiedEncounterStageModel.ts` and `buildSimpleEncounterStageModel.ts` both thread `gameState` and `tick` into `gatherNarrativeContext` so enrichment has access to the agent's records
* Tests: `src/engine/__tests__/intelligenceView.test.ts` (18), `src/engine/__tests__/intelligenceConsumption.test.ts` (5), `src/engine/__tests__/contracts/intel-consumption-liveness.contract.test.ts` (4), `src/engine/__tests__/intelligenceDisplay.test.ts` (22), `src/components/Game/__tests__/AgentIntelligencePanel.test.tsx` (9), 3 new cases in `ThreadDetailView.test.tsx`, plus 9 new cases in `proseEnrichment.test.ts`; decay: `src/engine/__tests__/phaseIntelligenceDecay.test.ts` (8 unit), `src/engine/__tests__/contracts/intel-decay-band-agreement.contract.test.ts` (1 contract), + integration extension to `intelligenceConsumption.test.ts` (THR-137)

**Multi-target aftermath effects (THR-114, 2026-04-17):**

`applyEncounterAftermathReaction` now accepts effects directed at agents, factions, or sublocations (not just the action actor). Called from `GameView.tsx` on player-side encounter resolution — same call site as before.

| New effect kind | Target kinds | Graph mutation | `mutationSummary` flag |
|----------------|-------------|---------------|----------------------|
| `reputation_set` | `agent`, `faction` | `node.properties.reputationScore = clamped(value)` | `touchedWorld` |
| `apply_condition` | `agent`, `faction`, `sublocation` | `graph.addEdge(has_trait)` with appliedAt/durationTicks/intensity | `touchedStructure` |
| `remove_condition` | `agent`, `faction`, `sublocation` | `graph.removeEdge(has_trait)` oldest or all | `touchedStructure` |
| `recent_event` + `witnessAgentIds` | — (fan-out) | `TickEvent.witnessAgentIds` set | — |

**Condition attachment + wound promotion (THR-117, 2026-04-17):**

`condition_attachment` aftermath effect kind — applies any condition trait (wound, disease, curse, blessing, bestowed) by template ID with automatic default-duration lookup. When the template is `trait.condition.wounded` and the target is the action actor, surfaces a `woundApplied` signal that drives mid-encounter tier promotion.

| Effect kind | Orchestrator phase | UI surface | GameState field | Traces | Debug visibility | Prose pipeline |
|---|---|---|---|---|---|---|
| `condition_attachment` | Plant: `applyEncounterAftermathReaction` (called from `GameView.tsx` on player-side resolution). Overflow: Phase 2a.85 `phaseSlotCaps`. Promotion: `checkMidEncounterPromotion` in `GameView.tsx` (same tick). | ProwessTab, AttachmentsTab, AgentDetailPanel — existing views; no new UI. | `state.graph` `has_trait` edges (same as `apply_condition`) | `encounter_aftermath_effect` (`effectKind: 'condition_attachment'`); `condition_applied` (downstream per stack). Overflow pipeline: `condition_overflow`. | Existing DebugPanel trace feed — `encounter_aftermath_effect` + `condition_applied` visible. | N/A — prose authors compose `recent_event` aftermath effects for narrative; the condition itself surfaces via ProwessTab/AttachmentsTab, not inline prose. |

**Verification pointers:**
* Effect executor: `src/engine/encounterAftermath.ts` — `condition_attachment` case in `applyEncounterAftermathReaction`
* Promotion wiring: `src/components/Game/GameView.tsx` — `reactionMutations.woundApplied` → `checkMidEncounterPromotion`
* Overflow pipeline: `src/engine/conditionOverflow.ts` → `phaseSlotCaps` in `orchestrator.ts`
* Tests: `src/engine/__tests__/conditionAttachment.test.ts` (11 tests: fail-soft, woundApplied signal, edge creation, traces)

**StrictMode-safe mutation pattern:** `applyEncounterAftermathReaction` returns `{ state, mutationSummary }`. Caller (`GameView.tsx`) calls `touchStructure(runtime)` / `touchWorld(runtime)` AFTER `setGameState` resolves — never inside the updater — to avoid double-increment in React StrictMode.

**World-shaping aftermath effects (THR-115, 2026-04-17):**

Eight new `EncounterAftermathReactionEffect` kinds that change world topology from encounter aftermath. All handled in `applyEncounterAftermathReaction` (`src/engine/encounterAftermath.ts`). All fail-soft: missing nodes/edges emit a failure trace and break without throwing.

| Effect kind | What it mutates | `touchWorld` | `touchStructure` | Trace category |
|---|---|---|---|---|
| `spawn_artifact` | Creates `artifact` graph node; adds `possesses`, `bonded_to`, and/or `contains` edges; chronicles creation event | ✅ | ✅ | `artifact_spawned` |
| `emit_omen` | Appends `EmittedOmen` to `GameState.emittedOmens`; enforces `MAX_EMITTED_OMENS_CAP=10` (oldest evicted) | — | — | `omen_emitted` |
| `faction_splinter` | Creates new faction node; migrates selected members (6 strategies); adds `resentful` edge | ✅ | ✅ | `faction_splintered` |
| `faction_absorb` | Migrates members to absorbing faction (3 rep-merge strategies); marks source faction dissolved | ✅ | ✅ | `faction_absorbed` |
| `faction_dissolve` | Marks faction node dissolved; disperses members to independent or `drift_to_rival` | ✅ | ✅ | `faction_dissolved` |
| `faction_declare_war` | Creates bidirectional `war_sentiment` edges between two factions | ✅ | ✅ | `faction_war_declared` |
| `faction_force_peace` | Creates bidirectional `treaty` edges (sentiment clamped above floor) | ✅ | ✅ | `faction_peace_forced` |

**Emitted omen lifecycle:**
- **Plant:** `emit_omen` effect in `applyEncounterAftermathReaction` → appended to `state.emittedOmens`
- **Consume (bias):** `deriveEmittedOmenEncounterBias(state.emittedOmens, hexCol, hexRow)` called from Phase 2b `phaseAgentDecision` — adds to `combinedBias[encounterType]`
- **Decay:** Phase 1.7a `phaseEmittedOmenDecay` — removes omens where `tick > expiresTick`, emits `omen_decayed` trace

**EmittedOmen scope kinds:** `global` (all hexes), `regional` (named region, currently treated as global pending THR-116), `local` (radius in hex distance — uses canonical `hexDistance()` from `src/lib/hexMath.ts`).

**Member selection strategies (faction_splinter / faction_absorb):** `all_matching_trait`, `within_radius`, `by_reputation_below`, `by_reputation_above`, `explicit_ids`, `random_sample`. All use `mulberry32` seeded from `state.seed + tick * 31337 + encounterId.charCodeAt(0)`.

**Reputation merge strategies (faction_absorb):** `max`, `sum_clamped`, `weighted_avg`.

**Key constants** (all in `src/engine/encounterAftermath.ts` or `src/engine/phaseOmenAgenda.ts`):
- `EMITTED_OMEN_DEFAULT_DURATION_TICKS = 48` (4 game days)
- `MAX_EMITTED_OMENS_CAP = 10` (oldest evicted when cap exceeded)
- `EMITTED_OMEN_ENCOUNTER_BIAS_MAX = 0.4` (per-type bias cap)

**No dedicated player UI** — emitted omens are engine-only. DebugPanel feed shows `omen_emitted` / `omen_decayed` traces. Faction topology changes are visible in FactionSheet. Spawned artifacts appear in agent attachment views.

**Tests:** `src/engine/__tests__/encounterAftermath.worldShaping.test.ts` (40 tests across all 8 effects + decay + bias + fail-soft).

**Verification pointers:**
* Target resolution: `src/engine/encounterAftermath.ts` — `resolveAftermathTarget()`
* New effect handlers: `apply_condition` (~line 606), `remove_condition` (~line 702), `reputation_set` (~line 262)
* Call site: `src/components/Game/GameView.tsx` — `pendingAftermathMutations` + post-`setGameState` touch calls
* Trace definitions: `src/types/trace.ts` — `aftermath_target_resolved`, `aftermath_target_invalid`, `faction_reputation_changed`, `reputation_set_applied`, `condition_applied`, `condition_removed`
* Example content: `src/data/encounters/examples/` — `example.betrayal_multi_target.ts`, `example.council_disowns.ts`, `example.shrine_consecration.ts`
* Tests: `src/engine/__tests__/encounterAftermath-multi-target.test.ts` (35+ tests)

**Causation edges + conditional aftermath (THR-116, 2026-04-18):**

| Surface | Wiring |
|---------|--------|
| `when` gate | `encounterAftermath.ts` evaluates `effect.when` via `evaluatePredicate(buildPredicateContext(...))` before every effect dispatch. Emits `aftermath_effect_skipped_by_when` / `aftermath_effect_when_passed` traces. |
| Thread mutations | `thread_strengthen/weaken/break/branch` cases in `applyEncounterAftermathReaction`. Strength clamped [0,1] via `THREAD_STRENGTH_MAX/MIN`. `thread_break` emits `TickEvent`. `thread_branch` wraps `addEdge` in try/catch for duplicate-edge safety. |
| ThreadsPanel UI | `threadStrength` field on `ThreadedNodeBase` (from `edge.properties.strength`). CSS-transitioned bar renders when `threadStrength < 1.0`. |
| Causation edges | THR-143: `createUnifiedActionEventNode()` in `encounterEventNode.ts` creates `event` nodes for unified-action steps. `executeStepResult` in `unifiedActionResolution.ts` emits `caused_by` edge on first step when `pendingCausationSourceEventId` is set. `applyEncounterAftermathReaction` threads `action.eventNodeId` into seeds as `sourceEventNodeId`. `evaluateEncounterSeeds` propagates to spawned action as `pendingCausationSourceEventId`. |
| Prose placeholders | `{cause:label}` / `{cause:ticksAgo}` resolved in `enrichProse` from `ctx.cause`. |
| Trace categories | `causation_edge_created`, `causation_edge_creation_skipped`, `aftermath_effect_skipped_by_when`, `aftermath_effect_when_passed`, `thread_mutation_applied`, `thread_mutation_skipped` |
| Tests | `encounterAftermath.test.ts` (tests 3-10), `encounterSeeding.test.ts` (THR-143 causation contract tests 1-4), `encounterEventNode.test.ts` (`createUnifiedActionEventNode` tests 1-4) |

**Component-library foundation seams (2026-04-03):**

| Primitive / shell | Runtime seam | Current callers |
|------------------|-------------|-----------------|
| `test_shaper` | `effectResolver.collectTestShapers()` → `ResolutionInput.testShapers` → `resolutionService.resolveAction()` | `encounter.ts`, `unifiedActionResolution.ts` |
| `prevent_loss` (`quintessence`) | `effectResolver.collectPreventLossEffects()` → quintessence delta adjustment before clamp/regen | `phaseQuintessence.ts` |
| `content_grant` | reward-time template grant selection and recursive instantiation | `rewardPool.ts` |
| immediate `service` reward shell | `rewardMode: 'service'` resolves authored effects on acquisition instead of persisting a shell item | `rewardPool.ts`, `orchestrator.ts`, `unifiedActionResolution.ts` |

**Verification:** `grep -c 'phase[A-Z]' src/engine/orchestrator.ts` — count should match this table.

**Ambient sound wiring (2026-04-06):**

| Module | Integration surface | Notes |
|--------|-------------------|-------|
| `BackgroundChannel` | `useAmbientContext` hook mounted in `GameView.tsx` | Not orchestrator-driven; driven by React state (camera hex, active encounter, active location) |
| `MusicChannel` | `useAmbientContext` hook mounted in `GameView.tsx` | Encounter track swap triggered by encounter notification state |
| `UiChannel` | Fire-and-forget; called at SFX trigger sites | No persistent state; no orchestrator phase |
| `AudioMaster` | `useAmbientContext` — exposes global mute/unmute | Consumed by SettingsPanel master mute toggle |
| `useAmbientContext` | Mounted in `GameView.tsx`; receives `centerHex`, `activeEncounter`, `activeLocation` | Drives all three channel instances |

---

### 2. GameView Modal & Overlay Rendering (`src/components/Game/GameView.tsx`)

Every player-facing modal or overlay must appear in the GameView JSX return block. An import without a `<Component />` element means the feature is invisible.

**Currently rendered:**

| Component | Purpose |
|-----------|---------|
| `NarrativeLog` | Event feed overlay |
| `ToastStack` | Transient notifications |
| `HexMapV2` | Main Three.js hex canvas |
| `AscendantBar` | Persistent 360px left rail — identity+quintessence, essence, actions, mandate, hooks (THR-184). Supersedes IdentityChip, AvatarHUD, EssencePanel, MandateTracker. |
| `AvatarHUD` | Move/action/scry buttons — superseded by AscendantBar (THR-184) |
| `AgendaPicker` | Action selection overlay |
| `InterventionConfirm` | Intervention confirmation popover |
| `HexBreadcrumb` | Hex zoom breadcrumb |
| `HexSidebar` | Hex detail sidebar |
| `HexChronicle` | Hex event chronicle |
| `ChroniclePanel` | Dual-voice chronicle display with Poet/Witness/Both toggle; wired in right sidebar when `chronicleEntries.length > 0` (THR-155) |
| `ChronicleEntryCard` | Per-entry render of `poetProse` + `witnessFacts`; migration shim treats legacy `prose` as witness bullet (THR-155) |
| `LocationView` | Location detail view |
| `FactionSheet` | Faction network, leadership, holdings, and faction-targeted action surface |
| `ActionDrawer` (×2) | Agent & non-agent intervention |
| `DoomClockDetail` | Doom chapter timeline and resolved doom-card fallout |
| `MandateDetail` | Mandate sphere-growth detail and omen checkpoints |
| `DebugPanel` | Debug trace sidebar |

**All modals connected (TB-040, 2026-03-26):**

| Component | Status |
|-----------|--------|
| `MeetingEncounterModal` | ✅ Rendered in JSX (TB-035 Phase 1) |
| `JourneyVignetteModal` | ✅ Rendered in JSX (TB-035 Phase 2) |
| `EncounterVignetteModal` | ✅ Rendered in JSX (TB-035 Phase 4) |

**Verification:** For each modal/overlay in your feature, confirm `<ComponentName` appears in the JSX return block of GameView (not just in the imports).

### 3. GameState Consumption (`src/types/gameState.ts` → UI components)

Engine phases write to GameState fields. UI components must read them. An engine output that no component reads is invisible to the player.

**Fields requiring UI consumers:**

| GameState field | Producing phase | Current UI consumer | Status |
|----------------|----------------|-------------------|--------|
| `recentEvents` | Multiple phases | `NarrativeLog` | ✅ Connected |
| `pendingVignettes` | `phaseJourneyBeat` | `JourneyVignetteModal` | ✅ Connected |
| `encounterNotifications` | `phaseEncounterVisibility` | `useEncounterNotifications` → `ToastStack` | ✅ Connected (TB-040) |
| `doomClock.resolvedEvents` | `phaseDoom` | `DoomClockDetail` | ✅ Connected |
| `doomClock.counterOmens` / `doomClock.nextEscalationSeverityModifier` | `phaseMandate` + `phaseDoom` | `DoomBar`, `DoomClockDetail`, `MandateTracker`, `MandateDetail` | ✅ Connected |
| `doomIdentityMatrix` | `gameInit` (once) | `DebugTabContent` (milestone display), `buildUnifiedEncounterStageModel` (prose), `GameView` (pass-through) | ✅ Connected (THR-21) |
| `mandateState.primaryDelta` / `secondaryDelta` / `checkpointResults` / `secondaryObjectiveCurrent` | `phaseMandate` | `MandateTracker`, `MandateDetail` | ✅ Connected |
| `pendingHexMutations` | `phaseHexState` | Cleared after use (internal) | ✅ Internal |
| `prosperityShocks` | `phaseProsperity` | Cleared after use (internal) | ✅ Internal |
| `effectStates` | Orchestrator Phase 2a.4 (`tickEffects`) | No dedicated player UI; currently engine/runtime only | ⚠️ Debug visibility should improve before shell-heavy effect features land |
| `UnifiedActionTemplate.narrativeTemplates` / `aftermathConfig` / `illustrationUrl` / `backgroundTrack` / `musicTrack` | Authored encounter templates (single unified format) | Encounter stage adapters + `useAmbientContext` consume unified template fields for prose, aftermath, concept-art, and audio overrides | ✅ (2026-04-29, THR-109 format baseline) |
| `emittedOmens?: EmittedOmen[]` | `applyEncounterAftermathReaction` (`emit_omen` effect) + Phase 1.7a `phaseEmittedOmenDecay` | No dedicated player UI — omens influence encounter bias in `phaseAgentDecision` (invisible to player) + decay trace visible in DebugPanel feed. ⚠️ No UI readout for active emitted omens (tracked as THR-136 scope). | ⚠️ Engine-only (THR-115) |

**Verification:** For each new GameState field in your feature, name the component that reads it and how the data reaches the player.

**Location activity derivation (THR-22, 2026-04-17):**

| Surface | Integration | Notes |
|---------|-------------|-------|
| `deriveLocationActivities()` | NOT an orchestrator phase — pure UI-side derivation. Called from `useLocationActivities` hook in GameView. | O(edges) one-pass index; pure function; no game-state writes |
| `useLocationActivities` | Mounted in `GameView.tsx`; provides `locationActivitySummaries` + `hexPulses` | worldVersion-gated useMemo; fog-aware visible hex set (Proxy sentinel when fog disabled) |
| `locationActivityByHex: Map<string, LocationActivitySummary>` | Derived in GameView from `locationActivitySummaries`; keyed by `"col,row"` | Passed as `locationActivityMap` prop to HexMapV2 |
| `HexMapV2.locationActivityMap` | Prop consumed in HexMapV2 render block; read by inline tooltip IIFE | No Three.js layer — data flows to HTML overlay only |
| `HexTooltip` | Rendered in HexMapV2 JSX when `hoveredHex` is set; receives `locationActivity` prop | Tooltip positioned via `hexToWorld → worldToScreen` (anchors to hex center, not cursor) |

**Telemetry-fed thread inspection (2026-04-09):**

| Source | Producer | UI consumer | Status |
|--------|----------|-------------|--------|
| Latest `encounter_decision.rankedEncounterPool` in `runtime.balanceTelemetry.recentEvents` | `phaseAgentDecision` via `recordBalanceEvent()` | `GameView` → `getLatestEncounterDecisionsByAgent()` → `ThreadsPanel` pool button → `EncounterPoolModal` | ✅ Connected |

### 4. Trace Emission & Debug Visibility (`src/types/trace.ts` → `src/engine/traceBuffer.ts` → DebugPanel)

Every system should emit traces for inspectability (NFP #2). A trace category that exists in the type system but is never emitted is dead code.

**Current trace categories (85):** action_selection, narrative_generation, context_harvest, dilemma_resolution, tick_summary, encounter_resolution, familiarity_change, movement, intervention_effect, action_execution, modifier_resolution, prosperity_tick, wealth_delta, trade_route_volume_change, trade_route_dissolved, settlement_tier_change, target_action_filter, hex_state, unrest_tick, saturation_tick, economic_chronicle, encounter_awareness, faction_awareness, encounter_cache, encounter_filter, idle_decision, encounter_scoring, road_hex_transition, agent_reroute, return_resolution, ripple_consequence, control_effect, doom_card, mandate_checkpoint, revelation, tick_health, tick_crash, agent_revelation, interaction_depth, faction_ambition, reputation_trait, rarity_graduation, rarity_importance, encounter_promotion, curator_decision, attention_pool, story_beat_queue, slot_overflow, slot_disposal, condition_overflow, slot_expansion, meeting_sensing, meeting_testing, meeting_spark, meeting_bond, settlement_genome, settlement_reassessment, culture_generation, culture_sublocation, graph_op_execution, choice_set_player_resolved, choice_set_player_dismissed, authored_attachment_created, **cli_auto_aftermath** (THR-257), encounter_aftermath_applied, encounter_aftermath_effect, encounter_seed_planted, encounter_seed_triggered, hidden_mark_placed, hidden_mark_revealed, intelligence_granted, **intelligence_referenced** (THR-113), **complication_selection** (THR-20), **aftermath_target_resolved**, **aftermath_target_invalid**, **faction_reputation_changed**, **reputation_set_applied**, **condition_applied**, **condition_removed** (all THR-114), **artifact_spawned**, **omen_emitted**, **omen_decayed**, **faction_splintered**, **faction_absorbed**, **faction_dissolved**, **faction_war_declared**, **faction_peace_forced** (all THR-115), **tick_phase_profile** (THR-186), **encounter_cache_rebuild** (THR-187)

**THR-16 (2026-04-18):** `curator_decision` trace extended — `CuratorDecisionTrace` now carries `isChainStage: boolean`, `isFinalChainStage: boolean`, `factionThreadCount: number`, `matchesAmbition: boolean`. These fields are computed in `phaseAttention.ts` and flow through to every `curator_decision` emission (both `kept` and `curated_out`). Not new categories — extensions to the existing interface.

**All categories emitted (TB-057, 2026-03-26).** `tick_health` and `tick_crash` emitted from `orchestrator.ts` (health check failures and unhandled exceptions respectively). `control_effect` emitted from `phaseControlEffects.ts`. `revelation` emitted from `revelationResolver.ts`.

**Review wrapper traces (THR-182, 2026-04-19):** Two new trace shapes written by the CC review surface — *not* engine traces, but structured logs persisted under `.cowork/review-traces/`:

| Trace type | Written by | Location | Consumed by |
|---|---|---|---|
| `review-wrapper` (`ReviewWrapperTrace`) | `scripts/review/wrapper.ts` on every wrapper exit | `.cowork/review-traces/<timestamp>.json` | CC session reads the trace JSON line on wrapper stdout; commit trailer (`review:ok` / `review:skipped:*`) written to closing commit body |
| `review-action` (`ReviewActionTrace`) | `.github/workflows/claude-review.yml` Action | GitHub Actions artifact (90-day retention) | GitHub PR check run + PR review comment |

These are not `TraceCategory` entries in `src/types/trace.ts` — they are out-of-band infrastructure logs. No DebugPanel tab needed.

**Verification:** For each trace category your feature defines, `grep 'category: "your_category"' src/engine/` must have at least one non-test hit.

### 5. DebugPanel Tabs (`src/components/Game/DebugPanel.tsx`)

Current ViewMode values: `feed`, `agent-follow`, `tick-inspector`, `social`, `encounters`, `encounter-seeds`, `hidden-marks`, `journey`, `webgl`, `factions`, `spheres`, `revelation-log`, `knowledge-gaps`, `armies`, `cli`, `strategic`, `omens`, `cultures`, `secrets-favors`, `clues`, `ruins`

Sub-components: `DecisionBreakdown`, `RelationshipGraph`, `EncounterCacheView`, `WebGLDebugTab`, `HiddenMarksTab`, `EncounterSeedsTab`, `CulturePhoneticsInspector`, `CluesDebugTab` (THR-150), `RuinsDebugTab` (THR-154)

**Debug bridge aftermath surface (THR-257):**

| Surface | Registration point | Consumer API | Trace coupling |
|--------|---------------------|--------------|----------------|
| Headless aftermath bridge | `window.__DEBUG._registerAftermathBridge(...)` in `GameView.tsx` | `window.__DEBUG.listAftermathReactions()` + `window.__DEBUG.pickAftermathReaction()` | `cli_auto_aftermath` (source=`debug-bridge`) + existing `encounter_aftermath_applied` |

**Verification:** If your feature adds significant inspectable state (journey progress, encounter notifications, prose enrichment context), decide whether it warrants a new DebugPanel tab or extension to an existing one.

### 6. Prose Enrichment Pipeline (`src/engine/proseEnrichment.ts`)

Any system that displays narrative text to the player should call `enrichProse()` with a `NarrativeContext` before rendering. Without enrichment, prose templates display raw placeholders.

**Current callers:** `returnEngine.ts` (Return prose + ripple consequence prose, TB-040); `buildUnifiedEncounterStageModel.ts` + `buildSimpleEncounterStageModel.ts` (encounter stage narrative context, now threads `gameState` + `tick` for intelligence enrichment — THR-113).

**Should be called by:** MeetingEncounterModal, JourneyVignetteModal, EncounterVignetteModal, any future vignette/prose display component.

**Verification:** If your feature displays prose from templates with `{placeholders}`, verify `enrichProse` is called in the rendering path.

### 7. Player Controls for Engine Features

Engine capabilities that are player-toggleable need UI controls. An engine function with no UI entry point is inaccessible.

| Engine capability | UI control | Status |
|------------------|-----------|--------|
| Fog of war toggle | URL param `?fog` | ✅ |
| Organic shore toggle | DebugPanel checkbox | ✅ |
| Bond overlay | DebugPanel checkbox | ✅ |
| Decision vector overlay | DebugPanel checkbox | ✅ |
| Attention mode toggle | `toggleAttentionMode()` in encounterVisibility.ts | ✅ RetinuePanel per-agent toggle (TB-040) |
| Faction-targeted ascendant actions | `FactionSheet` "Ascendant Actions" button → non-agent `ActionDrawer` | ✅ (2026-04-08) |
| Meet The First action | `handleStartMeeting()` in GameView | ✅ Rendered in JSX (TB-035 Phase 1) |
| Music volume | SettingsPanel Music slider | ✅ (2026-04-06) |
| Background/ambient volume | SettingsPanel Ambient slider | ✅ (2026-04-06) |
| UI SFX volume | SettingsPanel UI slider | ✅ (2026-04-06) |
| Master mute | SettingsPanel master mute toggle | ✅ (2026-04-06) |

**Verification:** For each player-facing toggle or action in your feature, name the UI element that triggers it.

---

## Checklist for Design Documents

Every design document in `Docs/plans/` must include a **Wiring** section that answers:

1. **Orchestrator:** Which existing phase(s) call this module? Or does it need a new phase? At what position in the loop?
2. **UI rendering:** Which component(s) display this feature's output? Are they already rendered in GameView, or do they need to be added?
3. **GameState flow:** What fields does this feature write to GameState? What component reads each field?
4. **Traces:** What trace categories does this feature emit? From which functions?
5. **Debug visibility:** How does a developer inspect this feature's state? Existing DebugPanel tab or new one?
6. **Prose pipeline:** Does this feature display narrative text? If yes, does it go through `enrichProse()`?
7. **Player controls:** Does the player need to trigger, toggle, or configure anything? What UI element provides that?
8. **Prerequisite health:** What upstream systems must be producing output for this feature to fire? List each dependency and how to verify it's alive (e.g., "encounters must complete → check encounterProgress has status:'completed' entries within 50 ticks"). If the upstream is known to be broken or untested at scale, flag it as a blocker.

### Throughput Gate

Features that depend on upstream pipeline throughput (not just correct wiring) must declare a **throughput expectation** in their design doc:

| What to declare | Example |
|-----------------|---------|
| **Upstream dependency** | "Requires agents to arrive at locations with encounter cache entries" |
| **Expected throughput** | "At least 1 encounter completion per 50 ticks on a seeded world" |
| **Verification method** | "Pipeline liveness integration test (`encounter-liveness.contract.test.ts`)" |

A feature that is correctly wired but receives zero upstream input is functionally dead. The throughput gate catches this before implementation is marked complete.

---

## Checklist for Implementation (Pre-Commit)

Before marking implementation complete, verify:

- [ ] Every new engine module is imported and called from the orchestrator (not just from tests)
- [ ] Every new modal/overlay component has a `<Component />` element in GameView JSX (not just an import)
- [ ] Every new GameState field has at least one UI component that reads and displays it
- [ ] Every new trace category is emitted by at least one non-test function (`grep` verification)
- [ ] Every new player-facing action has a UI trigger (button, menu item, click handler)
- [ ] Every prose display path calls `enrichProse()` if using templates with placeholders
- [ ] DebugPanel can inspect new feature state (existing tab or new tab)
