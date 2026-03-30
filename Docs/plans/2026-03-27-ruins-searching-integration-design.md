# Ruins Searching Integration — Preliminary Design Proposal

**Date:** 2026-03-27
**Status:** Draft — preliminary gap analysis and integration sketch
**Related design:** `2026-03-26-hex-actions-expansion-and-control-mechanic-design.md` (TB-036)
**Brainstorm sources:** `brainstorm-faction-vertical-slice.md`, `brainstorm-location-npcs.md`, `brainstorm-hex-actions-and-control-mechanic.md`
**Related backlog:** TB-036 (hex actions expansion), TB-060 (quest board — "explore ruins" quests)

---

## Problem

Ruins exist on the map. Agents can travel to them. Encounter templates reference ruin location types. Sublocations (dungeon, crypt, library) are seeded — some hidden. Hex action templates for the Ruins narrative layer are authored. The revelation system knows how to reveal the ruins layer and flip hidden sites. The faction quest board generates "explore ruins" quests.

And yet: **none of these pieces are connected into an end-to-end loop that a player can observe and influence.** The individual systems are implemented, but the *wiring* between them — the thing that makes "searching for ruins" a coherent activity — is missing or incomplete.

Specifically:

1. **Agents don't preferentially seek ruins.** The agent decision phase has no concept of "this agent is motivated to explore ruins" — faction quests generate but don't steer movement toward ruin locations specifically.
2. **Ruins layer revelation has no player-facing display.** `hexRevelation` tracks `ruins: true/false` per hex, but no UI shows which hexes have their ruins layer revealed vs unrevealed.
3. **Hidden site discovery is engine-only.** The `resolveHiddenSiteReveals()` function exists and works, but there's no notification, no chronicle entry, no visual feedback when a hidden site is found.
4. **Elder magic is completely absent from runtime.** Foundation spheres (Chaos, Order, Light, Darkness) are documented in cosmology and designed in the hex actions doc, but `ElderSphereName` doesn't exist as a runtime type, no elder essence pool exists, and no content connects ruins discovery to elder magic reward.
5. **The "Ruins narrative layer" hex actions exist as templates but aren't meaningfully different from Land actions** — the Find-gating system that makes you *discover* ruins before you can *manipulate* them isn't connected to the ActionDrawer filter pipeline.
6. **No feedback loop between divine action and agent behavior at ruins.** `hex.mark_ground` (make agents more likely to investigate) and `hex.whisper_intuition` (boost agent's next Find encounter) are authored but have no engine effect — they're templates with no behavioral hook.

---

## What Already Works (Verified in Code)

| System | File(s) | Status | Notes |
|--------|---------|--------|-------|
| Ruin location types | `sublocation.ts` | ✅ Implemented | `ruins`, `ruined_tower`, `ruined_city`, `unexplored_poi` |
| Ruin sublocations | `sublocation.ts` | ✅ Implemented | dungeon, crypt seeded; 60% hidden at ruin locations |
| Hidden site seeding | `sublocation.ts:210-221` | ✅ Implemented | PRNG-seeded `hidden: true` on sublocation properties |
| Hidden site reveal function | `revelationResolver.ts:181+` | ✅ Implemented | `resolveHiddenSiteReveals()` flips hidden flags, emits traces |
| Layer revelation map | `revelationResolver.ts` | ✅ Implemented | `hexRevelation` on GameState, `applyRevelationMutations()` |
| TEMPLATE_REVELATION_MAP | `revelationResolver.ts:28-45` | ✅ Implemented | `hex.read_stones` → ruins, `hex.whisper_intuition` → ruins |
| Revelation gate in action filter | `targetActions.ts` + tests | ✅ Implemented | Gate 7 filters Change/Control/Destroy behind layer revelation |
| Ruins hex action templates | `unified-action-templates.ts` | ✅ Authored | 12 templates across 5 verbs for ruins layer |
| Control effect runtime | `phaseControlEffects.ts` | ✅ Implemented | ControlEffect lifecycle, lapse, income, contestation |
| Control effect spawning | `controlEffectSpawn.ts` | ✅ Implemented | Sustained action → ControlEffect creation |
| Ruin encounter templates | `encounter-content.ts` | ✅ Implemented | "Relic Hunt" (3-step), plus ~10 templates at ruin locations |
| Faction quest: explore ruins | `faction-encounter-content.ts` | ✅ Implemented | "Explore the Ruins" as elite quest, reach=eye/shadow |
| Essence system | `essenceIncome.ts` | ✅ Implemented | Sphere-typed pool with per-tick generation |

---

## What's Missing — The Integration Gaps

### Gap 1: Agent Motivation to Explore Ruins

**Current state:** Agents pick encounters and destinations via `phaseAgentDecision`. Faction quests can generate "explore ruins" encounters. But there's no mechanism for:
- An agent who receives an "explore ruins" quest to preferentially travel to a ruin-type location
- `hex.mark_ground` (divine Create action) to make a hex more attractive to agents
- `hex.whisper_intuition` (divine Find action) to give a specific threaded agent a ruins-seeking hunch

**What's needed:**
- **Quest-driven destination selection:** When an agent has an active faction quest targeting ruins, the decision phase should score ruin-type locations higher for destination selection. This may already partially work if faction quest encounters have `locationTypes` set to ruin types — need to verify the encounter→destination pipeline.
- **Divine nudge behavioral hook:** `hex.mark_ground` needs to write a hex state field (e.g., `explorationAttraction: number`) that the agent decision scoring reads. `hex.whisper_intuition` needs to write to the specific agent's state (e.g., a temporary `divineHunch` on movement or encounter scoring) via GraphOp on the thread edge.
- **Ambition-driven exploration:** `hex.plant_dream` should create or modify an ambition that drives the agent toward ruins exploration — this connects to the existing ambition/pursues system.

**Grey zone:** How strongly should divine nudges override agent autonomy? Is `hex.mark_ground` a gentle bias or a strong override? This needs a design decision — probably a tunable weight constant.

### Gap 2: Ruins Layer Visibility in UI

**Current state:** `hexRevelation` tracks `ruins: boolean` per hex. The ActionDrawer correctly gates ruins-layer actions behind revelation. But the player has no way to *see* which hexes have revealed ruins vs unrevealed.

**What's needed:**
- **HexChronicle integration:** When viewing a hex, show ruins layer status (revealed/unrevealed). If revealed, show known sublocations including formerly-hidden ones.
- **Map overlay or signifier:** Visual indicator on HexMapV2 for hexes with revealed ruins layer. Could be a subtle overlay icon at the appropriate zoom tier.
- **LocationView integration:** Discovered hidden sites should appear in LocationView's sublocation list (they may already — need to verify if `hidden: false` sublocations render correctly after reveal).

### Gap 3: Hidden Site Discovery Feedback

**Current state:** `resolveHiddenSiteReveals()` flips the hidden flag and emits `HiddenSiteRevealedTrace`. But no player-facing notification fires.

**What's needed:**
- **TickEvent emission:** When a hidden site is revealed, emit a TickEvent that the notification system can pick up (toast for discoveries, alert for elder magic finds).
- **Chronicle entry:** Hidden site discovery should appear in the hex chronicle and potentially in the agent's journey chronicle.
- **Notification channel:** Add a `discovery` notification category to the existing notification preferences system (TB-067).

### Gap 4: Elder Magic Connection

**Current state:** Foundation spheres (Chaos, Order, Light, Darkness) exist in cosmology docs and the hex actions design doc defines `ElderSphereName`. But at runtime: no elder essence type, no elder essence pool, no content connects ruins discovery → elder magic reward.

**What's needed (phased — this is the big one):**

**Phase A (minimum viable):** Add `elderMagicPresent: boolean` property to sublocation nodes at ruin locations. When a hidden site with `elderMagicPresent: true` is discovered, emit a special trace + notification. This is *information only* — the player learns "there's elder magic here" but can't do anything with it yet. The `HIDDEN_SITE_ELDER_MAGIC_PROBABILITY = 0.15` constant from the design doc guides seeding.

**Phase B (deferred):** Implement `ElderSphereName` type, extend `EssenceType`, add elder essence to the pool, create `hex.bind_echoes`-style control effects that tap elder magic sources. This is the full economy expansion from the hex actions design doc § System 2.

**Grey zone:** Should Phase A exist as a standalone milestone, or should we skip straight to Phase B when we're ready? Phase A is cheap and gives the player something to see, but it's a dead end until Phase B is built. I'd lean toward including Phase A because it validates the discovery pipeline end-to-end.

### Gap 5: Find-Gating Feedback

**Current state:** The revelation gate (Gate 7) in `targetActions.ts` silently filters out ruins-layer actions when the ruins layer is unrevealed. The player doesn't know *why* certain actions aren't showing up.

**What's needed:**
- **ActionDrawer hint:** When actions are filtered by revelation gate, show a "Reveal the ruins layer first" hint in the ActionDrawer (similar to how affordability filtering shows "Not enough essence").
- **HexSidebar layer indicators:** Show per-layer revelation state (checkmarks/locks) in the hex sidebar so the player understands what's revealed and what isn't.

### Gap 6: Divine Action → Agent Behavior Hooks

**Current state:** Ruins Create/Find actions are authored as templates, and the HexActionBridge can resolve them into hex mutations. But the *behavioral* effects (agent attraction, encounter boosting) have no engine implementation.

**What's needed:**
- **`explorationAttraction` hex state field:** A new mutable hex state field that `hex.mark_ground` writes to. Agent decision scoring reads it as a destination bonus. Decays naturally (like divine influence).
- **`divineHunch` agent state:** A temporary flag or score modifier on the agent (via thread edge properties or a lightweight state field) that `hex.whisper_intuition` sets. Consumed when the agent enters their next ruins encounter, providing a difficulty reduction or success bonus. Single-use.
- **HexActionBridge extensions:** Wire `hex.mark_ground` → `explorationAttraction` mutation, `hex.whisper_intuition` → agent `divineHunch` GraphOp.

---

## Proposed Implementation Ordering

### Phase 1: Discovery Feedback (visibility — the player can *see* ruins being found)

**Scope:** Wire existing hidden site discovery to player-facing notifications and UI.

1. Emit `TickEvent` from `resolveHiddenSiteReveals()` on hidden site discovery
2. Add `discovery` notification channel (toast for sites, alert for elder magic)
3. Show ruins layer revelation state in HexChronicle / hex sidebar
4. Verify LocationView renders previously-hidden sublocations after reveal
5. Add `elderMagicPresent` property to sublocation seeding (Phase A of Gap 4)

**Why first:** This is pure wiring — no new engine systems, no new tick phases. It makes the existing discovery pipeline visible to the player. Every subsequent phase benefits from the player being able to see what's happening.

**Test signal:** Player uses `hex.read_stones` on a ruin hex → notification fires → hex chronicle shows ruins layer revealed → LocationView shows newly-revealed dungeon sublocation → if elder magic present, alert notification fires.

### Phase 2: Agent Ruins Motivation (agency — agents *go to* ruins purposefully)

**Scope:** Connect faction quests and divine nudges to agent destination selection.

1. Verify faction "explore ruins" quests drive agent movement to ruin locations (may already work via encounter `locationTypes` filtering)
2. Implement `explorationAttraction` hex state field + decay
3. Wire `hex.mark_ground` → `explorationAttraction` mutation via HexActionBridge
4. Add `explorationAttraction` to agent destination scoring in decision phase
5. Implement `divineHunch` on thread edge properties
6. Wire `hex.whisper_intuition` → `divineHunch` GraphOp

**Why second:** With discovery feedback in place (Phase 1), the player can now observe agents being drawn to ruins and see the results of their divine nudges.

**Test signal:** Player uses `hex.mark_ground` on a ruin hex → agents with explore-type quests preferentially travel there → `hex.whisper_intuition` on a threaded agent → agent's next ruin encounter gets difficulty reduction → player sees discovery notification.

### Phase 3: Ruins Layer Actions Full Loop (strategy — the player *projects power* through ruins)

**Scope:** Connect remaining ruins-layer actions (Change, Destroy, Control) to the full game loop.

1. Verify Find-gating prevents Change/Control/Destroy on unrevealed ruins (should already work)
2. Add ActionDrawer revelation hints for gated actions
3. Add HexSidebar per-layer revelation indicators
4. Wire `hex.consecrate_past` (Change) → sphere alignment mutation on ruin sublocations
5. Wire `hex.bury_past` (Destroy) → ruin collapse (sublocation removal + terrain change)
6. Wire `hex.bind_echoes` (Control) → ControlEffect establishment (already supported by control runtime)
7. Wire `hex.seal_tomb` (Control) → encounter lockdown at target hex
8. Wire `hex.compel_exploration` (Control) → sustained `explorationAttraction` effect

**Why third:** This is the strategic layer. The player now has a full loop: discover ruins → reveal the layer → project power through Change/Control/Destroy actions. Requires Phase 1 (visibility) and Phase 2 (agent motivation) to be meaningful.

**Test signal:** Player reveals ruins layer → Change/Control/Destroy actions appear in ActionDrawer → `hex.bind_echoes` establishes ControlEffect → HexChronicle shows active effect → rival can contest via encounter.

### Phase 4: Elder Magic Economy (progression — ruins lead to a new resource tier)

**Scope:** Implement foundation sphere essence as a discoverable resource.

1. Add `ElderSphereName` type to `essenceTypes.ts`
2. Extend `EssenceType = SphereName | ElderSphereName`
3. Add elder essence pool to GameState (starts at zero)
4. Create elder magic source nodes at ruins with `elderMagicPresent: true`
5. Wire `hex.bind_echoes` variant for elder magic tapping → `perTickIncome` in elder spheres
6. Add elder essence display to EssencePanel
7. Author elder-magic-specific action templates (the expensive, powerful ones)

**Why last:** This is the big progression payoff but has the most dependencies. Everything else works without it — creation sphere ruins actions are fully functional. Elder magic is the late-game reward for a player who has invested in ruins exploration.

**Deferred beyond Phase 4:** Full elder magic action templates, elder magic encounter modifiers, cross-sphere elder interactions.

---

## Dependencies & Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Agent decision scoring is hard to tune | Agents either ignore ruins or over-prioritize them | `EXPLORATION_ATTRACTION_WEIGHT` constant, start low (0.1), tune via CLI `tick 50` runs |
| Hidden site discovery rate too low for player to notice | Feature feels invisible | `HIDDEN_SITE_RUINS_PROBABILITY` (currently 0.60) is already high; verify with CLI |
| Find-gating confuses players | "Where are my actions?" frustration | Phase 3 adds explicit hints; Phase 1 shows revelation state |
| Elder magic economy unbalances game | Foundation spheres too powerful or too weak | Phase 4 is deferred and independently tunable; creation spheres work without it |
| Existing encounter templates at ruins are thin | Only "Relic Hunt" + faction elite quest specifically target ruins | Can author more encounter templates in parallel — content, not architecture |

---

## Open Questions for Discussion

1. **Encounter depth at ruins:** The current "Relic Hunt" encounter is 3 steps. Should ruins exploration encounters be longer/deeper than typical encounters to convey the sense of *delving*? Or does the existing step count work?

2. **Ruins as recurring content:** Once a ruin is fully explored (all hidden sites found, all encounters resolved), does it become inert? Should ruins regenerate content over time (new encounters spawn, new hidden sites appear)? Or is depletion part of the strategy (you extract value, then move on)?

3. **Agent skill growth from ruins:** Should ruins exploration build specific Domain Capability (Eye reach for perception, Shadow reach for dungeon-delving)? The faction quest system already grants reputation, but direct skill growth from exploration encounters would create a natural "explorer" archetype.

4. **Multi-agent expeditions:** The faction vertical slice brainstorm mentions "coordinated missions" as a faction social encounter. Should ruins exploration support multiple agents exploring together? This connects to the colocation detection system but adds complexity.

5. **Divine danger in ruins:** The hex actions design says "the ascendant does NOT enter ruins directly — too dangerous." What makes ruins dangerous to a god? Is there an engine mechanic for divine risk at ruins (essence cost, attention from rivals, World-Soul reaction), or is this purely narrative framing?

6. **NPC integration:** The location NPCs brainstorm (TB-069) mentions NPCs as knowledge sources who can reveal hidden sublocations through gossip. Should ruins searching connect to the NPC system, or is that a separate integration to wire later?

---

## NFP Compliance Summary

| # | Priority | Verdict | Notes |
|---|----------|---------|-------|
| 1 | Tunability | PASS | All new behaviors use named constants (`EXPLORATION_ATTRACTION_WEIGHT`, `DIVINE_HUNCH_DIFFICULTY_BONUS`, existing `HIDDEN_SITE_*` constants) |
| 2 | Inspectability | PASS | Discovery traces already exist; new TickEvents + notification channel add player visibility; divine hunch traces needed |
| 3 | Determinism | PASS | Hidden site seeding is PRNG; exploration attraction is deterministic arithmetic; divine hunch is applied modifier |
| 4 | Fail-soft | PASS | Missing revelation → no ruins actions shown (safe default); missing explorationAttraction → agents behave normally; missing divineHunch → encounter runs at base difficulty |
| 5 | Narrative > mechanical | PASS | The entire framing is narrative: agents *explore*, gods *nudge and reveal*, ruins *hold ancient secrets*. Elder magic is discovered through story. |
| 6 | Additive | PASS | All phases add new fields/functions. No refactoring of existing systems needed — only new wiring. |
| 7 | Performance | PASS with note | Phase 2 adds destination scoring computation per agent per tick. Profile if agent count exceeds 50. |

---

## Wiring Checklist

### Phase 1 (Discovery Feedback)

| Surface | What | Status |
|---------|------|--------|
| **Orchestrator** | No new phase — hooks into existing `unifiedActionResolution` | Existing |
| **UI rendering** | HexChronicle ruins layer section, LocationView hidden→visible sublocations | New |
| **GameState flow** | `hexRevelation` (existing) → HexChronicle, HexSidebar | New consumers |
| **Traces** | `revelation.hidden_site_revealed` (existing) | Existing |
| **Notifications** | New `discovery` channel → ToastStack/AlertStack | New |
| **Prose pipeline** | Discovery notification text via `enrichProse()` | New |
| **Player controls** | None (passive visibility) | N/A |

### Phase 2 (Agent Motivation)

| Surface | What | Status |
|---------|------|--------|
| **Orchestrator** | Agent decision phase scoring extension | Modify existing |
| **UI rendering** | HexMapV2 exploration attraction overlay (optional) | Optional new |
| **GameState flow** | New `explorationAttraction` on hex state, `divineHunch` on thread edge | New fields |
| **Traces** | `hex_action.mark_ground` applied, `divine_hunch` granted/consumed | New |
| **Notifications** | Agent received divine hunch → toast to player | New |
| **Prose pipeline** | Hunch application prose in encounter resolution | New |
| **Player controls** | `hex.mark_ground` and `hex.whisper_intuition` in ActionDrawer | Existing templates |

### Phase 3 (Ruins Layer Actions)

| Surface | What | Status |
|---------|------|--------|
| **Orchestrator** | Control effects (existing phase), HexActionBridge extensions | Modify existing |
| **UI rendering** | ActionDrawer revelation hints, HexSidebar layer indicators, HexChronicle control effects | New |
| **GameState flow** | `controlEffects[]` (existing), `hexRevelation` (existing) | Existing |
| **Traces** | `control_effect.*` (existing) | Existing |
| **Notifications** | Control effect established/lapsed at ruins → existing channels | Existing |
| **Prose pipeline** | Ruins-specific control effect narrative templates | New content |
| **Player controls** | Change/Control/Destroy actions gated behind ruins revelation | Existing gate |

### Phase 4 (Elder Magic Economy)

| Surface | What | Status |
|---------|------|--------|
| **Orchestrator** | `phaseEssence` extension for elder income | Modify existing |
| **UI rendering** | EssencePanel elder sphere display | New section |
| **GameState flow** | Elder essence pool on GameState | New field |
| **Traces** | `essence.elder_income`, `revelation.elder_magic_discovered` | New |
| **Notifications** | Elder magic discovered → alert, elder income flowing → toast | New |
| **Prose pipeline** | Elder magic prose templates | New content |
| **Player controls** | Elder-magic-cost actions in ActionDrawer | New templates |
