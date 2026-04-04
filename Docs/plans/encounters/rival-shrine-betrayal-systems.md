# Encounter Pipeline: The Broker's Ledger
> Scale: medium | Slug: rival-shrine-betrayal | Pass: systems (re-audit)
> Date: 2026-04-04 | Pipeline version: 1.0
> Note: Re-audit after ActionStepBranch and BranchAwareAftermathConfig primitives were implemented.

---

## 1. Support Bundle Honesty

The revised encounter declares nine support objects in Section 15. Re-audit of each against the current runtime (post-branching-primitive implementation):

| Support Object | Declared Delivery | Realistic? | Notes |
|---|---|---|---|
| **Tessaly (broker NPC)** | `lazy-materialize-on-trigger` | **Yes.** `EncounterSupportActorSpec` can spawn an NPC with `spawnNpcRole: 'broker'`. The `'broker'` NPC role is now live in `NpcRole` union and `NPC_ROLES` array. The support bundle resolver (`encounterSupportBundle.ts`) handles spawn, reuse via `reuseNpcRoles`, location placement, faction membership via `factionDefId`, and cultural assignment. Persistence `must-persist` is supported. | Clean fit. `reuseNpcRoles: ['informant', 'trader', 'fence']` provides reuse-first binding to existing NPCs; `spawnNpcRole: 'broker'` for clean spawn. |
| **Brinewall (settlement)** | `pre-seeded` | **Partially realistic.** The encounter assumes a coastal fishing settlement with specific properties. The location generation system creates settlements, but "Brinewall" with fishing/trade profile is not guaranteed. The encounter must bind to any suitable coastal settlement with trade activity, or the implementation must handle settlement selection via `requiredNodeProperties` on the template's `targetSubtypes` / `locationSubtypes` fields. | Pre-seeded binding to "any coastal settlement" is realistic; binding to a named entity requires encounter-specific content or a flexible binding query on location properties. |
| **Elder Carin Harken** | `lazy-materialize-on-trigger` | **Yes.** Same mechanism as Tessaly. `reuseNpcRoles: ['elder']` with `spawnNpcRole: 'elder'` at the bound settlement. The `'elder'` role exists in `NpcRole`. `preferredLocationKey` on the actor spec can chain to the settlement location binding. | Clean fit. |
| **Rival shrine** | `lazy-materialize-on-trigger` | **Yes.** `EncounterSupportLocationSpec` can materialize a sublocation with `sublocationTypeId: 'shrine'`. The sublocation type `shrine` exists in the sublocation concept art registry (`sublocation-concept-art.ts`) and is referenced by multiple encounter templates. The shrine would be materialized at a different location than the encounter anchor (the rival god's territory), so the encounter must either specify the target area or create the sublocation as a standalone location node. The current support bundle system places sublocations relative to the anchor location (the agent's location or target), which means the rival shrine would need its own location resolution -- either a separate support location spec for "Vessen uplands area" or a property-based placement. | Sublocation type is live. Placement logic needs care: the shrine is NOT at the encounter's anchor location. May require the shrine to be materialized as a location node rather than a sublocation, or the support bundle resolution to accept explicit hex placement. See New Hooks Needed. |
| **Neutral meeting point** | `pre-seeded` | **Yes.** Binding to an existing trade waystation or caravanserai sublocation. `scene-only` persistence is supported. Standard pre-seeded binding. | Clean fit. |
| **Intelligence attachment (shrine map)** | `lazy-materialize-on-trigger` | **No -- missing primitive.** The reward catalog (`reward-attachment-catalog.ts`) contains artifact/possession nodes with reach bonuses. An "intelligence attachment" with structured data that future encounters can query does not exist as a reward type. No `subcategory: 'intelligence'` exists in the catalog. | See Missing Primitives MP-1. Degradable to flavor-text artifact for v1. |
| **Betrayal mark** | `lazy-materialize-on-trigger` | **No -- missing primitive.** A persistent hidden-state attachment with a reveal-on-investigation condition does not exist. No `HiddenMark` type, no `hiddenMarks` property convention, no query/reveal system. | See Missing Primitives MP-2. Degradable to property flag + reputation tally for v1. |
| **Saltern Compact (faction)** | `pre-seeded` | **Partially realistic.** Same issue as Brinewall. The faction generation system creates merchant guilds, but a specific named faction is not guaranteed. The encounter must bind to any suitable mercantile faction in the area. | Binding to "any mercantile faction" is realistic. |
| **Greywater Guild (faction)** | `pre-seeded` | **Same as Saltern Compact.** Needs binding to any suitable trading house faction. | Same caveats. |

**Summary:** 5 of 9 support objects are fully deliverable with current systems (Tessaly, Carin Harken, neutral meeting point, and the core NPC/location mechanisms). 2 are partially realistic (Brinewall, faction bindings -- require flexible binding to existing world content rather than named entities). The rival shrine sublocation type exists but placement logic needs attention. 2 require genuinely new primitives (intelligence attachment, betrayal mark).

Compared to the previous audit: Tessaly is now a clean fit (broker role is live). The rival shrine sublocation type is confirmed live. The two genuinely missing primitives (intelligence attachment, betrayal mark) remain unchanged.

---

## 2. Missing Primitives

**Removed from this section (now live):**
- ~~MP-3: Branch-Aware Step Resolution~~ -- Now `ActionStepBranch` in `src/types/unifiedAction.ts`, resolved by `resolveStepDefinition()` in `unifiedActionLifecycle.ts`. All downstream consumers (resolution, duration, narrative) receive a resolved `ActionStep` transparently.
- ~~MP-4: Branch-Aware Aftermath Builder~~ -- Now `BranchAwareAftermathConfig` on `UnifiedActionTemplate`, resolved by `resolveAftermathVariant()` in `unifiedActionResolution.ts` (line 388). Aftermath summary assembly at line 1208 uses the variant's overview, changes, reactions, and reactionPrompt.
- ~~MP-6: NPC Role "broker"~~ -- Now in `NpcRole` union and `NPC_ROLES` array in `src/types/npc.ts`.

### MP-1: Structured Intelligence Attachment (unchanged)

**What the encounter needs:** A persistent world object representing the rival shrine's location, with structured data (map fragment, route notes, guardian schedules) that future encounters and agent decision-making can query. Not just a reach bonus -- a queryable intelligence object.

**What exists today:** `RewardPoolRecipe` + `REWARD_POSSESSIONS` catalog delivers artifact nodes with `reachBonus` properties and flavor text. There is no `subcategory: 'intelligence'` in the catalog. No system queries artifacts for structured intelligence data.

**Gap severity:** Medium. The encounter can deliver a flavor-text artifact with a reach bonus as a v1 approximation, but the design intent -- that future encounters reference the shrine's guardian schedules, that agent decisions factor in known shrine locations -- is lost.

### MP-2: Delayed-Reveal Hidden Mark (unchanged)

**What the encounter needs:** A persistent attachment on the player's agent that is initially hidden, becomes discoverable when a future "investigation" encounter fires, and increases the chance of the betrayal being traced back. A ticking social consequence with a reveal condition.

**What exists today:** No `HiddenMark` type exists anywhere in the codebase. No `hiddenMarks` property convention. `ClearanceGateRuntimeState` is scoped to individual encounter flows, not cross-encounter persistent marks. `reputationTallies` on actor nodes are numeric counters, not conditional reveal markers.

**Gap severity:** Medium. A v1 approximation can set a property flag on the actor node and a `reputationTally` entry. Future investigation encounters manually query for it. But the "ticking social bomb" with automatic reveal-on-investigation is a new behavioral primitive.

### MP-5: Follow-On Encounter Seeding Effect (unchanged)

**What the encounter needs:** All four reaction choices seed future encounters (shrine confrontation, Brinewall investigation, Tessaly's next attempt, counter-intelligence arc). The aftermath system needs to register these as encounter triggers.

**What exists today:** No `encounter_seed` effect kind on `EncounterAftermathReactionEffect`. No `pendingEncounterSeeds` on `GameState`. No system queries for pending seeds or auto-spawns encounters.

**Gap severity:** Medium. The `recent_event` effect kind with high significance can serve as a narrative marker. Follow-on encounters must be manually authored and triggered through standard encounter pool selection. The promise of automatic seeding remains undeliverable.

---

## 3. Runtime Feasibility

### Can the engine carry a 2-beat branching encounter?

**Yes.** This is the critical change since the previous audit. The `ActionStepBranch` primitive resolves this completely:

1. **Step 0 (The Offer):** A concrete `ActionStep` with a choice point. The player chooses "accept" or "refuse" via `EncounterInterventionChoice`. The choice is recorded in `choiceHistory` with a `choiceId` (e.g., `'accept_trade'` or `'refuse_trade'`).

2. **Step 1 (The Extraction / The Refusal):** An `ActionStepBranch` with `branchOnStep: 0` and `variants: { 'accept_trade': <extraction step>, 'refuse_trade': <refusal step> }`. Each variant is a complete `ActionStep` with its own reach, difficulty, duration, onSuccess/onFailure GraphOps, and narrativeTemplate. A `fallback` step handles the disregarded case.

3. **Step progression:** `resolveStepDefinition(template, 1, action.choiceHistory)` at line 41 of `unifiedActionLifecycle.ts` finds the `ActionStepBranch`, reads `choiceHistory` for step 0's `choiceId`, and returns the matching variant. `advanceStep` at line 147 uses the same resolution. All downstream consumers (resolution in `resolveUncontestedStep`, duration in `computeStepDuration`, aftermath in `resolveAftermathVariant`) receive a resolved `ActionStep` transparently.

4. **Branch-dependent aftermath:** The template declares `aftermathConfig: BranchAwareAftermathConfig` with `branchOnStep: 0` and two variants keyed to `'accept_trade'` and `'refuse_trade'`. Each variant has its own `overview`, `changes`, `reactionPrompt`, and `reactions`. The aftermath assembly at line 1208 of `unifiedActionResolution.ts` calls `resolveAftermathVariant(template, finalAction.choiceHistory)` and uses the matched variant's content.

### Branch-dependent prose

**Current state:** `narrativeTemplate` on `ActionStep` is `string | undefined`. Each variant in an `ActionStepBranch` carries its own `narrativeTemplate`. The accept path variant can have extraction prose; the refuse path variant can have refusal prose. The encounter stage adapter reads the resolved step's `narrativeTemplate` for display. This is sufficient for branch-dependent step-level prose.

**Template-level narrativeTemplates:** The `UnifiedActionTemplate.narrativeTemplates` object (`initiation`, `success`, `failure`) is template-wide, not step-specific or branch-specific. For the opening beat (step 0), `narrativeTemplates.initiation` works. For the branch-dependent beat 2 and the branch-dependent aftermath prose, the per-step `narrativeTemplate` on each variant step and the `BranchAwareAftermathConfig.overview` carry the branch-specific content. This is sufficient.

### Encounter visibility and choice presentation

The encounter notification/visibility system (`encounterVisibility.ts`) presents `EncounterInterventionChoice` objects to the player at each step. The player selects a choice, which is recorded in `choiceHistory` via `recordUnifiedActionChoiceMemory` in `encounterChoiceMemory.ts`. The choice's `id` becomes the `choiceId` that branch resolution reads.

The encounter stage adapter (in `src/components/Game/encounter-stage/`) must present the two choices at step 0 -- "accept the trade" and "refuse the trade" -- as `EncounterInterventionChoice` objects. This is the existing pattern used by gate duty encounters. The adapter may need encounter-specific customization for the broker encounter's prose and presentation, but the choice recording and branch resolution pipeline is fully wired.

**Assessment:** The engine can carry this encounter cleanly. No runtime feasibility blockers remain.

---

## 4. Aftermath Supportability

### Accept path aftermath

| Consequence | System | Wirable? |
|---|---|---|
| Intelligence attachment (shrine map) | Reward pool | **Partial.** Can deliver an artifact node with flavor text and `reachBonus: { shadow: 0.03 }`. Cannot deliver structured queryable intelligence. Degraded v1 uses custom properties in node bag: `{ intelligenceType: 'shrine_location', targetRegion: 'vessen_uplands' }`. |
| Brinewall trust reduced | `reputation_score` or `reputation_tally` effect | **Yes.** `reputation_score` effect with negative delta on Brinewall community node, or `reputation_tally` with `{ betrayal_brinewall: 1 }`. Both effect kinds are live in `applyEncounterAftermathReaction`. |
| Tessaly debt cleared / contact available | Node property mutation via `reputation_tally` | **Yes.** Set `reputation_tally: { broker_tessaly_debt_cleared: 1 }` and a `recent_event`. No "recurring contact" system, but the property persists for future encounter queries. |
| Economic countdown (Greywater begins replication) | `recent_event` effect | **Partial.** Can emit a narrative event with high significance. Cannot create a ticking countdown that automatically fires a future encounter in N ticks. The countdown is a narrative promise, not a system-level timer. |
| Betrayal mark | Property flag + `reputation_tally` | **Partial.** Can set `reputation_tally: { betrayal_exposure_risk: 1 }` on the actor node. No reveal-on-investigation system. See MP-2. |

### Refuse path aftermath

| Consequence | System | Wirable? |
|---|---|---|
| Brinewall trust increased | `reputation_score` / `reputation_tally` | **Yes.** |
| No intelligence gained | (absence) | **Yes.** Nothing to wire. |
| Tessaly neutral-to-hostile | `reputation_tally` + `recent_event` | **Partial.** `reputation_tally: { broker_tessaly_hostile: 1 }` plus narrative event. No behavioral consequence system (Tessaly does not automatically pursue the technique). |
| Threat seeded (Tessaly pursues technique) | `recent_event` | **Partial.** Can emit event. Cannot auto-spawn future encounter. See MP-5. |
| Principle established | `reputation_tally` | **Yes.** `reputation_tally: { principled_patron: 1 }`. |

### Reaction choices

| Reaction | Required Effects | Wirable? |
|---|---|---|
| Accept A: "Prepare Brinewall" | `reputation_score` boost to Brinewall community, `recent_event`, `reputation_tally: { brinewall_preparation: 1 }` | **Yes.** All existing effect types. |
| Accept B: "Spend the intelligence" | `recent_event` seeding shrine confrontation, `reputation_tally: { shrine_intelligence_deployed: 1 }` | **Partial.** Event emission and tally yes; auto-spawning shrine confrontation encounter no. |
| Refuse A: "Find the shrine another way" | `recent_event` seeding intelligence arc, `reputation_tally: { independent_intelligence_pursuit: 1 }` | **Partial.** Same limitation. |
| Refuse B: "Watch Tessaly" | `recent_event` seeding counter-intelligence arc, `reputation_tally: { tessaly_monitored: 1 }` | **Partial.** Same limitation. |

**Summary:** Basic reputation and event consequences are fully wirable through the live `EncounterAftermathReactionEffect` system (kinds: `reputation_score`, `reputation_tally`, `clearance_gate_tag`, `recent_event`). Structured intelligence delivery, delayed-reveal marks, and auto-spawned follow-on encounters remain undeliverable. All four reaction choices can produce meaningful persistent world state through reputation tallies and narrative events, even though automatic encounter seeding is not available.

Compared to previous audit: No change in aftermath supportability. The improvement is in the branch-dependent aftermath assembly -- `BranchAwareAftermathConfig` now cleanly selects between accept-path and refuse-path aftermath content, reactions, and reaction prompts.

---

## 5. New Hooks Needed

| Hook | What It Does | Scope | Blocking? |
|---|---|---|---|
| **Encounter template authoring** | Write the `UnifiedActionTemplate` with `ActionStepBranch` for step 1, `BranchAwareAftermathConfig` for aftermath, `EncounterSupportBundle` for cast/locations, intervention choices for step 0 | Medium -- standard encounter authoring using live primitives | Required for implementation |
| **Encounter stage adapter** | Present the broker encounter's prose, choices, and aftermath in the encounter stage UI. May need encounter-specific customization or a generalized encounter stage adapter. Currently `buildGateDutyEncounterStageModel.ts` is gate-duty-specific. | Medium -- new adapter or generalization of existing adapter | Required for UI presentation |
| **Rival shrine remote placement** | The support bundle system places sublocations relative to the anchor location (agent's location or target). The rival shrine needs to be placed in a different region. Either (a) the shrine is a location node rather than a sublocation, (b) a second anchor location is resolved for the rival's territory, or (c) the shrine is created as a standalone sublocation with explicit hex placement. | Small -- support bundle resolver enhancement or manual graph node creation in aftermath | Not blocking; can be handled via aftermath GraphOps or manual node creation |
| **Intelligence attachment v1** | New entries in `reward-attachment-catalog.ts` with `subcategory: 'intelligence'`, custom properties for shrine location data, reach bonus for shadow domain | Small -- catalog entries only; no new system code | Degraded but usable |
| **Betrayal mark v1** | Convention for `hiddenMarks` property on actor nodes + `reputationTally` entry. No automatic reveal system -- manual query in future encounters. | Small -- property convention documentation; no new system code | Degraded but usable |

**Removed from this section (now live):**
- ~~Branch-aware step definition~~ -- `ActionStepBranch` is live
- ~~Branch-aware aftermath builder~~ -- `BranchAwareAftermathConfig` is live
- ~~NPC role: broker~~ -- live in `NpcRole`

---

## 6. Implementation File Map

### Files to Create

| File | Purpose |
|---|---|
| `src/data/encounters/rival-shrine-betrayal.ts` | `UnifiedActionTemplate` definition: 2 steps (step 0 concrete, step 1 `ActionStepBranch`), support bundle with Tessaly/Carin/shrine/meeting-point specs, `BranchAwareAftermathConfig` with accept/refuse variants, intervention choices for step 0, clearance gates if applicable |
| `src/data/encounters/__tests__/rival-shrine-betrayal.test.ts` | Template validation: branch resolution for both paths, aftermath variant selection, support bundle contract verification, step duration ranges, choice ID consistency |
| `src/components/Game/encounter-stage/BrokerEncounterStageAdapter.ts` (or generalized adapter) | Encounter stage model builder for broker encounter prose, choice presentation, and aftermath display. May be a generalized adapter if the pattern is reusable beyond gate duty. |

### Files to Modify

| File | Change |
|---|---|
| `src/data/unified-action-templates.ts` | Register `rival-shrine-betrayal` template in canonical unified template registry (import and add to template collection) |
| `src/data/reward-attachment-catalog.ts` | Add intelligence attachment reward entries with `subcategory: 'intelligence'` and shrine-specific properties |
| `src/engine/encounterSupportBundle.ts` | Potentially: support for explicit hex/region placement of support sublocations (for rival shrine). May not be needed if shrine is handled via aftermath GraphOps instead. |
| `src/components/Game/encounter-stage/` | Wire the broker encounter adapter into the encounter stage component routing |

### Files Unchanged (previously listed as needing modification)

| File | Why no change needed |
|---|---|
| `src/types/unifiedAction.ts` | `ActionStepBranch`, `ActionStepOrBranch`, `BranchAwareAftermathConfig`, `AftermathVariant` all already defined |
| `src/engine/unifiedActionLifecycle.ts` | `resolveStepDefinition()` already resolves branches; `advanceStep` already calls it |
| `src/engine/unifiedActionResolution.ts` | `resolveAftermathVariant()` already wired into aftermath assembly at line 1208 |
| `src/types/npc.ts` | `'broker'` already in union and array |

---

## 7. Verdict

**READY WITH CAVEATS**

The encounter's core structural requirements -- branch-dependent step resolution, branch-dependent aftermath, and broker NPC role -- are now fully supported by live runtime primitives. This is a significant improvement from the previous audit where the encounter was blocked on its most fundamental capability (MP-3).

**What works today:**
- Branch-dependent step resolution via `ActionStepBranch` (the encounter's defining feature)
- Branch-dependent aftermath via `BranchAwareAftermathConfig` (accept vs. refuse aftermath, reactions)
- Support bundle resolution for NPCs and sublocations (Tessaly, Carin Harken, meeting point, shrine type)
- Broker NPC role for clean Tessaly spawn
- Choice memory recording and branch resolution pipeline
- Multi-step action progression with branching
- Aftermath summary with branch-selected reaction choices
- Reputation score and tally effects for social consequences
- Recent event effects for narrative markers

**What requires v1 degradation:**
- Intelligence attachment (MP-1): Deliver as flavor-text artifact with custom properties in the node bag. Future encounters must manually query properties. No typed intelligence API. Explicit upgrade path documented.
- Betrayal mark (MP-2): Deliver as actor property flag + reputation tally. No automatic reveal-on-investigation. Future investigation encounters manually query. Explicit upgrade path documented.
- Follow-on encounter seeding (MP-5): Deliver as high-significance `recent_event` effects + reputation tallies. No automatic encounter spawning. Follow-on encounters authored manually and triggered through standard pool selection.

**What requires implementation work (not new primitives):**
- Encounter template authoring (the actual `UnifiedActionTemplate` data definition)
- Encounter stage adapter for UI presentation
- Rival shrine placement logic (either via support bundle enhancement or aftermath GraphOps)
- Intelligence attachment catalog entries

**Caveats:**
1. The rival shrine's placement in a remote region (not at the encounter's anchor location) is an edge case for the support bundle system. The simplest solution is to create the shrine via aftermath `GraphOps` on the accept path's `onSuccess` rather than through the support bundle's location resolution. This sidesteps the anchor-relative placement limitation.
2. The encounter stage adapter is currently gate-duty-specific (`buildGateDutyEncounterStageModel.ts`). The broker encounter needs either a generalized adapter or its own specific adapter. This is implementation work, not a missing primitive -- the data pipeline is ready.
3. Pre-seeded dependencies (Brinewall settlement, Saltern Compact, Greywater Guild) depend on worldgen producing suitable entities in the target area. If the encounter template's `locationSubtypes` and targeting filters are set broadly enough, binding will work. Named entities require either worldgen guarantees or flexible binding.

**Recommendation:** Implement the encounter using the live branching primitives as its first branching-encounter consumer beyond gate duty. Accept v1 degradations for intelligence attachment, betrayal mark, and encounter seeding with documented upgrade paths. The encounter is the strongest candidate for validating the branching primitives in a morally complex, narratively rich context.

---

## 8. Primitive Disposition

### MP-1: Structured Intelligence Attachment -- BACKLOG

**Primitive name:** Structured Intelligence Attachment (family: reward/attachment)

**Source encounters:** rival-shrine-betrayal (accept path primary reward). Will be needed by any future espionage, scouting, investigation, or rival intelligence encounter.

**V1 approximation:** Deliver the shrine location as a standard artifact reward node in `reward-attachment-catalog.ts`:
- `subcategory: 'intelligence'`
- `tags: ['#shadow', '#intelligence', '#shrine_location', '#rival_god']`
- `flavorText` containing the narrative description of the map and route notes
- `reachBonus: { shadow: 0.03 }` for minor mechanical benefit
- Custom properties: `{ intelligenceType: 'shrine_location', targetRegion: 'vessen_uplands', rivalGodId: '<dynamic>', detailLevel: 'full' }`

**What it loses:** Future encounters cannot programmatically query "does this agent have intelligence about rival shrines?" without manually checking the node properties bag. No typed intelligence API. No automatic agent decision weighting based on known intelligence. No system that makes the shrine "visible" on the map after intelligence is gained. The intelligence is a narrative token, not a system-level data object.

**Target architecture:**
- A new node type or subcategory: `intelligence` with typed properties (target entity, region, detail level, expiry, source encounter)
- An intelligence query API: `getAgentIntelligence(graph, agentId, category?)` returning typed intelligence records
- Integration with encounter visibility: intelligence about a location/entity makes related encounters visible or higher-priority
- Integration with agent decision-making: agents with intelligence about threats factor it into movement and encounter selection
- Potential hex map overlay: known shrine locations visible as markers

**Routing:** New TB item. This is a system-level primitive that multiple encounter families need: espionage, scouting, investigation, rival intelligence, trade route mapping.

---

### MP-2: Delayed-Reveal Hidden Mark -- BACKLOG

**Primitive name:** Hidden Mark / Delayed-Reveal Attachment (family: consequence/attachment)

**Source encounters:** rival-shrine-betrayal (accept path betrayal mark). Will be needed by any encounter involving concealed actions, delayed consequences, espionage, or hidden social debts.

**V1 approximation:** Set properties on the actor node:
- `reputation_tally` effect: `{ betrayal_exposure_risk: 1 }` (numeric, queryable)
- Actor property: `hiddenMarks: ['betrayal:brinewall_technique']` (array of string tags)
- Future investigation encounters manually query both surfaces

**What it loses:** No automatic reveal trigger. No escalation curve (the mark does not become more likely to be discovered over time). No system-level "investigation" event that queries hidden marks across all agents. No UI indicator (even in debug) that a hidden mark exists. The "ticking social bomb" behavior must be entirely manually authored in every future encounter that might trigger investigation.

**Target architecture:**
- `HiddenMark` type: `markId`, `category`, `severity`, `revealConditions`, `placedTick`, `placedByEncounterId`
- Per-agent hidden mark storage (either `GameState.hiddenMarks` or actor node property)
- Query/reveal system: `checkMarkReveals(state, agentId, encounterContext)`
- Integration with encounter spawning: investigation encounters more likely when hidden marks exist
- Debug panel visibility for hidden marks

**Routing:** TB-104 (Procedural Content Component Library Foundation) initially. Promote to dedicated TB item if multiple encounter families need it within the next milestone.

---

### MP-5: Follow-On Encounter Seeding Effect -- BACKLOG

**Primitive name:** Encounter Seed Effect (family: aftermath/reaction effect)

**Source encounters:** rival-shrine-betrayal (all four reaction choices seed future encounters). Will be needed by every encounter that creates follow-on narrative threads -- this is the most broadly needed missing primitive.

**V1 approximation:** Use `recent_event` effect kind with high significance (0.7+) and descriptive messages. Complement with `reputation_tally` entries that future encounter authoring can query:
- Accept A: `reputation_tally: { brinewall_preparation: 1 }` -- future Brinewall encounters check this
- Accept B: `reputation_tally: { shrine_intelligence_deployed: 1 }` -- future shrine encounters check this
- Refuse A: `reputation_tally: { independent_intelligence_pursuit: 1 }` -- future intel encounters check this
- Refuse B: `reputation_tally: { tessaly_monitored: 1 }` -- future Tessaly encounters check this

**What it loses:** No automatic encounter spawning. Follow-on encounters must be manually triggered or rely on standard encounter pool selection. The narrative promises ("Tessaly's next attempt", "shrine confrontation", "Brinewall investigation") exist only as reputation tallies and event feed entries, not as queued encounter triggers. The player has no visibility into what seeds are planted.

**Target architecture:**
- New `EncounterAftermathReactionEffect` kind: `'encounter_seed'`
- Properties: `encounterTemplateId` (or `encounterFamily`), `delayTicks`, `targetAgentId`, `targetLocationId`, `priority`
- `pendingEncounterSeeds` array on `GameState`
- Orchestrator phase that evaluates pending seeds and spawns encounters when conditions are met
- UI surface showing planted seeds (optional, could be debug-only initially)

**Routing:** New TB item. This is core narrative infrastructure. Every medium+ encounter with follow-on hooks will benefit. The absence of this primitive means every branching encounter's aftermath promises are narrative-only, with no system backing for delivery.
