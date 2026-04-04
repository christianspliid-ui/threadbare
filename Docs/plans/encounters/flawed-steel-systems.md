# Encounter Pipeline: Flawed Steel
> Scale: medium | Slug: flawed-steel | Pass: systems
> Date: 2026-04-04 | Pipeline version: 1.0

---

## 1. Support Bundle Honesty

The draft declares 12 support bundle entries. Assessment of each delivery mode follows.

| Support Object | Declared Delivery | Realistic? | Notes |
|---|---|---|---|
| Maren Ironhewn (forge-master NPC) | `lazy-materialize-on-trigger` | YES | `EncounterSupportActorSpec` with `reuseNpcRoles` and `spawnNpcRole` is the same pattern used by `rival-shrine-betrayal` (Tessaly, Carin Harken). The `encounterSupportBundle.ts` resolver handles actor reuse-first materialization. She needs `must-persist` — the system writes a real graph node. |
| Dalla (apprentice NPC) | `lazy-materialize-on-trigger` | YES | Same actor support pattern. Needs a `preferredLocationKey` pointing to the forge sublocation so she spawns in the right place. Standard actor materialization. |
| Torve Ashgrip (mercenary captain) | `lazy-materialize-on-trigger` | YES | Same pattern. Her NPC role (`mercenary_captain` or similar) must exist in the NPC role taxonomy or be authored in this pass. |
| Greycloaks (mercenary faction) | `lazy-materialize-on-trigger` | PARTIAL | The support bundle system resolves actors and locations, not factions. `EncounterSupportSpec` is a union of `EncounterSupportActorSpec | EncounterSupportLocationSpec` — there is no `EncounterSupportFactionSpec`. A faction node would need to be created through a custom graph op or pre-seeded, not through the standard support bundle resolver. The draft should either (a) treat the Greycloaks as a pre-seeded faction (if mercenary factions already generate in settlements) or (b) create Torve as an actor node and attach faction membership through the encounter's graph ops. Option (b) is more honest. |
| Maren's forge (sublocation) | `pre-seeded` | YES | Settlement sublocation generation produces forge/smithy sublocations at craft-capable settlements. Standard `EncounterSupportLocationSpec` with `sublocationTypeId: 'forge'` or `'smithy'`. The resolver finds existing sublocations before creating. |
| Eastern gate (sublocation) | `pre-seeded` | PARTIAL | Settlement sublocation generation needs to include gates at walled settlements. Verify that a `gate` or `gatehouse` sublocation type exists in the sublocation taxonomy. If not, this is `author-now`, not `pre-seeded`. |
| Guild hall (sublocation) | `pre-seeded` | PARTIAL | Same concern. Guild halls may or may not exist as a sublocation type. If the draft only references it in prose (not as a mechanically visited location), this can be narrative-only and does not need a support spec. The draft says "referenced, not directly visited" — so this is actually fine as a prose reference. Downgrade from support bundle entry to prose-only reference. |
| Settlement trust (reputation channel) | `pre-seeded` | YES | The reputation system uses `reputationScore` on actor nodes and `reputationTallies` for keyed channels. Settlement-level trust can be modeled as a `reputation_tally` key on the settlement actor node. The `reputation_tally` aftermath effect kind is live. |
| Mercenary reputation (reputation channel) | `pre-seeded` | YES | Same mechanism — `reputation_tally` on the Greycloak faction/actor node, or `reputationScore` delta on Torve. Both are live effect kinds. |
| Hidden mark: concealed fraud (Branch B) | `lazy-materialize-on-trigger` | YES | The `hidden_mark` effect kind is live. `hiddenMarks.ts` provides `getAgentHiddenMarks()`, `checkMarkReveals()`, `hasHiddenMark()`. The mark would be placed on Maren (the forge-master) via aftermath reaction, with `revealFamilies: ['investigation', 'guild_audit', 'flawed_steel']`. Fully supported. |
| Encounter seed: guild reform (Branch A) | `lazy-materialize-on-trigger` | YES | The `encounter_seed` effect kind is live. `encounterSeeding.ts` evaluates seeds per tick. Seeds with `encounterFamily` emit narrative events (v1 — full family matching is future work). Seeds with `templateId` spawn unified actions directly. For v1, `encounterFamily: 'guild_reform'` is sufficient as a narrative thread marker. |
| Encounter seed: truth surfaces (Branch B "Prepare" reaction) | `lazy-materialize-on-trigger` | YES | Same mechanism as above. Could use `encounterFamily: 'flawed_steel_revelation'` or a direct `templateId` if a follow-on encounter template is authored. |

### Summary

10 of 12 support entries are realistic as declared. Two require adjustment:
- **Greycloaks faction**: No `EncounterSupportFactionSpec` exists. Must be handled as a pre-seeded faction (if region-appropriate mercenary factions generate) or created via graph ops on Torve's actor node.
- **Eastern gate sublocation**: Verify sublocation taxonomy includes gate types at walled settlements. If missing, author the sublocation type in this pass.
- **Guild hall**: Downgrade to prose-only reference — the draft explicitly says it is not visited.

---

## 2. Missing Primitives

Checking every primitive family from the encounter building checklist:

### Test Shaping
**Not needed.** The encounter does not require shaping the resolution test beyond standard difficulty and reach. The two branches use different reaches (Heart/Iron for Branch A, Shadow for Branch B) which is supported by `ActionStepBranch` — the step definition itself changes per branch, including its `reach` and `difficulty` fields. No test-shaping primitive required.

### Flip / Reveal State
**Not needed.** Branch B's hidden mark uses the existing `hidden_mark` primitive, which is a store-and-query mechanism, not a flip/reveal state machine. The concealed fraud does not need to mechanically "flip" from hidden to revealed — that would be the job of a future investigation encounter that calls `checkMarkReveals()`. This is the correct v1 pattern.

### Task / Progress Carriers
**Not needed.** The replacement weapon schedule (forty-seven swords, sixteen polearms, twelve knives) is narrative flavor, not a tracked progress task. The encounter resolves in 2-3 beats. There is no multi-tick crafting progress bar. If future encounters want to track the replacement schedule as a task, that would be a separate encounter, not a primitive gap here.

### Prevention / Interception / Recovery
**Not needed.** No NPC or system needs to prevent, intercept, or recover from the encounter's actions. The militia's nervousness and the guild elders' debate are narrative atmosphere, not mechanical prevention checks.

### Authored Choice Bundles
**LIVE PRIMITIVE — not a gap.** `ActionStepBranch` with `branchOnStep` + `variants` keyed by `choiceId` is the exact mechanism. The encounter's Beat 1 presents a choice between "Forge the Truth" and "Temper the Narrative". Beat 2 is an `ActionStepBranch` with `branchOnStep: 0` and two variants. `BranchAwareAftermathConfig` handles divergent aftermath per branch. `resolveStepDefinition()` in `unifiedActionLifecycle.ts` resolves the correct variant at tick time. This is the same pattern used by `rival-shrine-betrayal`.

### Branch-Aware Scene History / Afterimages
**Noted but not blocking.** The encounter building checklist flags that the prose pipeline does not yet interpolate choice-history into afterimage text. The draft authors explicit variant prose for each branch (Section 11), which is the correct workaround — author explicit variants instead of relying on dynamic interpolation. No primitive gap blocks implementation.

### Faction Support Bundle Spec
**Gap identified but not blocking.** As noted in Section 1, there is no `EncounterSupportFactionSpec` in the support bundle type union. The Greycloaks faction can be handled through Torve's actor node (faction membership as an edge) or through pre-seeded faction content. This is a convenience gap, not a blocking primitive gap.

**Verdict: No missing primitives block this encounter.**

---

## 3. Runtime Feasibility

### Can the Unified Action System Carry This Encounter?

**Yes.** The encounter maps to a 3-step `UnifiedActionTemplate`:

- **Step 0 (Beat 1: The Reckoning):** Difficulty 0 (choice-only, no resolution roll). The player perceives the situation and makes a choice. Duration 2-3 ticks.
- **Step 1 (Beat 2: The Intervention):** An `ActionStepBranch` with `branchOnStep: 0`. Branch A variant uses Heart/Iron reach with moderate difficulty. Branch B variant uses Shadow reach with lower immediate difficulty. Duration 2-3 ticks.
- **Step 2 (Beat 3: The Aftermath):** Either a direct `ActionStep` (same for both branches, since aftermath divergence is handled by `BranchAwareAftermathConfig`) or another `ActionStepBranch` if the final resolution roll needs different reach/difficulty per branch. The draft's outcome ladder suggests different difficulty textures per branch — Branch A has a harder negotiation, Branch B has a Shadow-reach concealment check — so this should be a second `ActionStepBranch`.

### Tick Lifecycle

The template would be authored as a `UnifiedActionTemplate` in a new file `src/data/encounters/flawed-steel.ts`, imported and added to the `UNIFIED_ACTION_TEMPLATES` array in `unified-action-templates.ts`. This is the same registration pattern as `rival-shrine-betrayal`.

Tick progression:
1. Action created via `createUnifiedAction()` — step 0 begins, stepDuration computed from `{ min: 2, max: 3 }`.
2. `progressAllActions()` increments each tick.
3. When step 0 completes, the encounter pauses at `awaiting_choice` (the encounter visibility system presents intervention choices).
4. Player selects "Forge the Truth" or "Temper the Narrative" — choice recorded via `recordUnifiedActionChoiceMemory()`.
5. Step 1 advances. `resolveStepDefinition()` reads `branchOnStep: 0` and selects the variant matching the player's `choiceId`.
6. Step 1 resolves via `resolveUncontestedStep()` with the branch-appropriate reach and difficulty.
7. Step 2 resolves (potentially also branched).
8. Action marked resolved. Aftermath assembled via `resolveAftermathVariant()` using the `BranchAwareAftermathConfig`.
9. Aftermath modal presented to player with curated changes and reaction choices.
10. Player selects a reaction — `applyEncounterAftermathReaction()` processes effects (reputation, seeds, marks, intelligence).

**All of these steps use live primitives.** The pipeline is identical to what `rival-shrine-betrayal` exercises.

### Encounter Choice UI

The encounter visibility system presents intervention choices at each step. The draft's two-choice structure at Beat 1 maps directly to `EncounterInterventionChoice` objects. The encounter's step 0 (difficulty 0) guarantees the choice is always presented — no resolution roll can prevent the player from seeing the options.

**Feasibility verdict: FULLY FEASIBLE on current runtime.**

---

## 4. Aftermath Supportability

### Can the Declared Consequences Wire to Live Systems?

| Consequence | System | Wirable? | Notes |
|---|---|---|---|
| Maren's reputation damaged/preserved | `reputation_tally` effect on actor node | YES | Key: `forge_trust` or `craft_reputation`. `reputation_tally` effect kind is live in `encounterAftermath.ts`. |
| Dalla's fate (exile, service, disappearance) | `recent_event` effect + NPC property mutation | PARTIAL | The narrative event is trivially emitted. But mechanically changing Dalla's status (relocated, serving Greycloaks, expelled) requires either a graph op that mutates her node properties or a manual property write. Graph ops on aftermath reactions are not yet supported — aftermath effects are typed to `EncounterAftermathReactionEffect`, which does not include a `graph_op` kind. Dalla's fate can be communicated narratively but not mechanically enforced via aftermath reactions alone. **Workaround:** Author Dalla's fate as a property set in the step's `onSuccess`/`onFailure` graph ops (per-branch), not in the aftermath reaction. |
| Torve Ashgrip disposition | `reputation_score` effect on Torve's actor node | YES | Standard `reputation_score` delta. Live in `encounterAftermath.ts`. |
| Guild suspicion / audit condition | `reputation_tally` effect on settlement | YES | Key: `guild_trust` with negative delta. Or a `recent_event` for narrative pressure. |
| Mercenary reputation toward settlement | `reputation_tally` on Greycloak actor/faction | YES | Standard reputation mechanism. |
| Hidden mark: concealed fraud (Branch B) | `hidden_mark` effect | YES | Category: `'concealed_action'`. Severity: 0.6-0.8. Label: descriptive. `revealFamilies`: `['investigation', 'guild_audit']`. Fully supported. |
| Encounter seed: guild reform (Branch A) | `encounter_seed` effect | YES | `encounterFamily: 'guild_reform'`, `delayTicks: 15-30`. V1 emits narrative event when eligible. |
| Encounter seed: truth surfaces (Branch B, "Prepare") | `encounter_seed` effect | YES | `encounterFamily: 'flawed_steel_revelation'`, `delayTicks: 20-40`. Same mechanism. |
| Intelligence: mercenary contracts (potential) | `intelligence` effect | YES | Category: `'military_position'` or `'trade_route'`. Standard intelligence record. |

### Aftermath Reaction Choices

The draft defines 2 reaction choices per branch (4 total). Each maps to an `EncounterAftermathReaction` with effects:

**Branch A reactions:**
1. "Let the guild carry it forward" — `encounter_seed` (guild reform family) + `recent_event` (institutional response narrative).
2. "Stay close to Maren" — `reputation_score` boost on Maren + `encounter_seed` (forge-master thread) + `recent_event`.

**Branch B reactions:**
1. "Let the silence hold" — `hidden_mark` on Maren + `recent_event` (latent pressure narrative).
2. "Prepare for the reckoning" — `encounter_seed` (controlled revelation) + `intelligence` record (Maren's preparation) + `recent_event`.

All effect kinds are live. The `BranchAwareAftermathConfig` selects the correct reaction set based on the Beat 1 choice.

**Aftermath verdict: FULLY SUPPORTABLE.** One minor workaround needed for Dalla's mechanical fate (use step graph ops instead of aftermath reactions for NPC state changes).

---

## 5. New Hooks Needed

### Required (zero new hooks for core functionality)

No new runtime hooks are needed. Every mechanism this encounter requires already exists:
- `ActionStepBranch` for branching
- `BranchAwareAftermathConfig` for divergent aftermath
- `EncounterSupportBundle` for NPC/location materialization
- `hidden_mark` for concealed consequences
- `encounter_seed` for follow-on threading
- `intelligence` for structured knowledge
- `reputation_tally` and `reputation_score` for social consequences
- `EncounterChoiceMemory` for remembered player choices

### Desired But Not Blocking

1. **`EncounterSupportFactionSpec`** — a support bundle spec for faction nodes, allowing lazy-materialize-on-trigger for factions. Currently, factions must be pre-seeded or created via graph ops attached to actor support specs. Not blocking — Torve's actor node can carry faction membership as an edge.

2. **`graph_op` aftermath reaction effect kind** — the ability to execute arbitrary graph ops from aftermath reactions would allow NPC state changes (Dalla's relocation/expulsion) to be handled cleanly in the aftermath phase rather than requiring them in step-level `onSuccess`/`onFailure` ops. Not blocking — the workaround (step-level ops) is standard.

3. **NPC role taxonomy entries** — `forge_master`, `apprentice`, `mercenary_captain` roles may need to be added to the NPC role taxonomy if they do not already exist. This is content authoring, not a runtime hook.

---

## 6. Implementation File Map

### Files to Create

| File | Purpose |
|---|---|
| `src/data/encounters/flawed-steel.ts` | The `UnifiedActionTemplate` definition with support bundle, step definitions (including `ActionStepBranch`), `BranchAwareAftermathConfig`, and all authored prose. Follows the exact pattern of `src/data/encounters/rival-shrine-betrayal.ts`. |

### Files to Modify

| File | Change |
|---|---|
| `src/data/unified-action-templates.ts` | Import `FLAWED_STEEL_TEMPLATE` and add it to the `UNIFIED_ACTION_TEMPLATES` array (one import line, one array entry — same as the rival-shrine-betrayal registration). |

### Files to Verify / Potentially Modify

| File | Reason |
|---|---|
| NPC role taxonomy (location in `src/data/` or `world-model.json`) | Verify `forge_master`, `apprentice`, `mercenary_captain` roles exist. Add if missing. |
| Sublocation type taxonomy | Verify `forge`/`smithy` and `gate`/`gatehouse` sublocation types exist and generate at appropriate settlement types. Add `gate` if missing. |
| `src/data/encounter-content.ts` or content tables | If the encounter needs to appear in legacy encounter lookups (for `getAnyEncounterById` compatibility), it may need a legacy shim. However, since this is a natively authored `UnifiedActionTemplate`, it should NOT need a legacy entry — the unified registry is the canonical source. |

### Files That Do Not Need Changes

| File | Why |
|---|---|
| `src/engine/unifiedActionLifecycle.ts` | No new lifecycle behavior needed. `resolveStepDefinition`, `advanceStep`, `createUnifiedAction` all handle branching encounters already. |
| `src/engine/unifiedActionResolution.ts` | No new resolution behavior needed. `resolveUncontestedStep`, aftermath assembly, and `resolveAftermathVariant` all handle branch-aware encounters. |
| `src/engine/encounterAftermath.ts` | No new effect kinds needed. All aftermath effects (`reputation_score`, `reputation_tally`, `hidden_mark`, `encounter_seed`, `intelligence`, `recent_event`) are already implemented. |
| `src/engine/encounterSupportBundle.ts` | No new support spec types needed (unless `EncounterSupportFactionSpec` is added, which is not blocking). |
| `src/engine/encounterSeeding.ts` | No changes needed. Seeds planted by aftermath reactions are evaluated by the existing per-tick loop. |
| `src/engine/hiddenMarks.ts` | No changes needed. Marks placed by aftermath reactions are queryable by the existing API. |
| `src/engine/intelligence.ts` | No changes needed. Intelligence records are stored and queryable by existing API. |

---

## 7. Verdict

**READY FOR IMPLEMENTATION**

The encounter design maps cleanly onto live runtime primitives. The branching structure (2 branches via `ActionStepBranch`), the aftermath divergence (`BranchAwareAftermathConfig`), the consequence primitives (`hidden_mark`, `encounter_seed`, `intelligence`, `reputation_tally`), and the support bundle materialization (`EncounterSupportActorSpec`, `EncounterSupportLocationSpec`) are all exercised by the existing `rival-shrine-betrayal` encounter and verified as live in the current codebase.

No blocked primitives. No exotic runtime requirements. Two minor caveats:

1. **Faction materialization** — the Greycloaks must be handled through Torve's actor node (faction membership as an edge) rather than through a dedicated faction support spec, because `EncounterSupportFactionSpec` does not exist. This is a design adjustment, not a blocker.

2. **Dalla's mechanical fate** — NPC state changes (relocation, expulsion, service) must be authored in step-level `onSuccess`/`onFailure` graph ops per branch, not in aftermath reactions, because aftermath reactions do not support `graph_op` effects. This is a known authoring pattern, not a gap.

3. **Sublocation taxonomy verification** — confirm `gate`/`gatehouse` sublocation type generates at walled settlements. If missing, author in the same pass.

---

## 8. Primitive Disposition

### No Primitives Need BUILD NOW

All required primitives are live. No new runtime code is needed to implement this encounter.

### BACKLOG Items (convenience improvements, not blocking)

| Primitive | Spec | Suggested Home |
|---|---|---|
| `EncounterSupportFactionSpec` | A support bundle spec for faction nodes. Union: `EncounterSupportSpec = ... \| EncounterSupportFactionSpec`. Fields: `kind: 'faction'`, `key`, `delivery`, `persistence`, `factionDefId` (to search for existing faction), `spawnFactionDefId` (to create if missing), `spawnName`. Resolver: search for existing faction by `factionDefId` in region; if not found and delivery is `lazy-materialize-on-trigger`, create a faction actor node with the given definition. | TB-104 (Procedural Content Component Library) — exposed by `flawed-steel` and likely to recur in any encounter featuring a named faction. |
| `graph_op` aftermath reaction effect kind | An effect kind that executes a `GraphOp[]` from an aftermath reaction. This allows NPC state mutations (property changes, edge creation/removal) to be authored in aftermath reactions rather than requiring them in step-level ops. Fields: `kind: 'graph_op'`, `ops: readonly GraphOp[]`. Executor: calls `executeGraphOps()` from the aftermath reaction handler. | TB-104 — exposed by `flawed-steel` (Dalla's fate) and likely to recur in any encounter that changes NPC state based on player reaction choice. |
| `gate`/`gatehouse` sublocation type | If not already in the sublocation taxonomy: a sublocation type that generates at walled/fortified settlements. Properties: defensive relevance, arrival/departure scenes, siege encounter eligibility. | Content authoring pass — verify and add if missing. Not a runtime primitive. |
