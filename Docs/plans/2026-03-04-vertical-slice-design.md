# Vertical Slice Design — One Complete Cycle

**Date:** 2026-03-04
**Status:** Approved
**Goal:** Wire all 25 engine modules into a playable game loop that demonstrates one complete cycle: world generates → agents act → doom ticks → narrative fires → cycle ends → echoes persist → next cycle begins. Functional prototype UI — not pretty, but informative and playable.

---

## Design Principles

See CLAUDE.md "Non-Functional Priorities" for the full ranked list. The key ones driving this design:

- **Tunability** — all timing, counts, and thresholds are named constants
- **Inspectability** — single `GameState` object you can log/diff, causal event trail
- **Determinism** — seeded PRNG flows from world seed through every subsystem
- **Fail-soft** — tick loop never crashes; missing data → graceful fallback

---

## 1. GameState — Single Source of Truth

All game state lives in one flat TypeScript interface. No classes with hidden state, no manager singletons. Every engine function takes pieces of this state in and returns updated pieces out.

```typescript
interface GameState {
  // Meta
  cycle: number;
  tick: number;
  phase: 'playing' | 'twilight' | 'harvest' | 'transition';
  seed: number;
  rng: () => number;  // seeded PRNG derived from seed + cycle + tick

  // World
  graph: WorldGraph;
  cosmology: CosmologyProfile;
  tiles: HexTile[];

  // Clock
  clock: SimulationClock;

  // Player
  ascendantId: string;
  essencePool: EssencePool;
  mandateState: MandateState | null;

  // Adversarial
  rivals: RivalState[];
  doomClock: DoomClockState;
  doomDefinition: DoomClockDefinition;

  // Narrative
  narrativeLog: NarrativeEvent[];       // recent events for UI display (ring buffer, ~100 max)
  chronicleEntries: ChronicleEntry[];   // tier-3 events accumulated for end-of-cycle chronicle

  // Stealth
  stealthExposure: number;  // simplified: 0.0 (hidden) to 1.0 (fully detected)

  // Metaprogression (persists across cycles)
  worldSoul: WorldSoulState;
  echoDefinitions: EchoDefinition[];
  echoStates: EchoState[];
  chronicle: GreatChronicle;
}
```

### Why a single bag?

- **Inspectable:** `console.log(gameState)` shows everything
- **Serializable:** trivial to save/load later (just `JSON.stringify`)
- **Diffable:** snapshot before tick, snapshot after, diff shows exactly what changed
- **Testable:** construct a GameState in a test, run a tick function, assert on output

The `WorldGraph` is the one exception — it's a class with methods for node/edge manipulation. Everything else is plain data.

---

## 2. Tick Loop — Ordered Phases

Each game tick runs these phases sequentially. Each phase is a pure function: `(gameState, tickInput) → partial GameState updates`. The orchestrator merges updates after each phase.

### Phase order per tick:

1. **`advanceDoom`** — Tick the doom clock, detect stage transitions, generate escalation narrative if stage changed.
2. **`runAgentActions`** — For each actor with free AP: run Maslow pipeline → pick action → start action in temporal controller. For completed actions: run resolution (sigmoid → d100), apply graph mutations, generate narrative.
3. **`runRivalActions`** — Each rival god takes one action based on behavior type (aggressive/subtle/territorial/expansionist). Apply graph effects, generate narrative.
4. **`checkStealth`** — Any divine interventions this tick accumulate detection risk. Simplified for vertical slice: single exposure number that rises with interventions and decays over time.
5. **`generateNarrative`** — Tier assignment (routine/notable/chronicle) for all resolved events this tick. Generate prose via template engine. Accumulate tier-3 events for chronicle.
6. **`generateEssence`** — Player accumulates sphere-typed influence essence from connections.
7. **`checkMandate`** — If mandate is active, check stage progression against graph state.
8. **`checkDoomExpiry`** — If doom clock expired → transition to Twilight Phase.

### Twilight Phase ticks:

Same loop but with success penalty applied to all resolutions (per `computeSuccessPenalty()` in worldSoul.ts). Runs for 5-10 ticks (from `initiateTwilight()`). When twilight ticks complete → transition to Harvest.

### Phase transitions:

```
playing → (doom expires) → twilight → (ticks complete) → harvest → transition → playing (new cycle)
```

Each transition is a distinct function, not a mode within the tick loop. This keeps the tick loop simple and makes transitions easy to test independently.

---

## 3. World Seeding — Populating the Graph

Current state: hex map generates terrain tiles but the graph is nearly empty (just the ascendant + one location). For agents to act, we need a populated world.

### `seedWorld(cosmology, seed, echoInjections?) → WorldGraph`

Creates:
- **8-12 individual actors** with axiological profiles, domain capabilities, and trait sets. Biased by cosmology (high-entropy worlds breed more chaotic individuals).
- **2-3 factions** as group actors, with member edges to individuals.
- **4-6 location nodes** linked to hex tiles (pick significant terrain features — mountains, rivers, forests).
- **1-2 artifact nodes** with sphere affinities.
- **Relationship edges** — loyalty, rivalry, trade, adjacency between locations.

All generated from seeded PRNG. Echo injections from previous cycles bias generation:
- `cultural_template` echoes influence actor trait tendencies
- `location_feature` echoes add sphere biases to locations
- `quest_seed` echoes place discoverable artifacts

### Actor generation detail:

Each actor gets:
- Name (from themed name tables, sphere-biased)
- Axiological profile (10 value pairs, randomized with cosmology bias)
- Domain capabilities across Nine Reaches (randomized with archetype bias — warriors high in Iron, traders high in Gold)
- 2-4 starting traits (innate + mastery)
- Location assignment (random from available locations)

---

## 4. Cycle End — Unmaking → Harvest → Transition

### Trigger: Doom clock expires OR mandate completes OR player concedes

**Step 1: Twilight Phase** (already built in worldSoul.ts)
- `initiateTwilight()` → 5-10 ticks with success penalties
- Player can still act but at reduced effectiveness
- Runs through normal tick loop with penalty applied

**Step 2: Harvest**
- `computeHarvestType()` → triumphant / somber / bittersweet
- `buildHarvestOutcome()` → determines echo counts (cosmic + divine)
- Score all graph nodes by significance
- `selectCosmicEchoes()` → auto-select top cosmic echoes
- Present echo candidates to player for divine echo selection (UI)

**Step 3: Chronicle Assembly**
- Build volume from accumulated tier-3 chronicle entries
- `createVolume()` → `addChapter()` for each significant event → `closeVolume()`
- Record echo thread appearances

**Step 4: World-Soul Transition**
- `executeCycleTransition()` from worldSoul.ts handles:
  - Degrade existing resonance memories
  - Capture new memories from this cycle
  - Select echoes (cosmic auto + divine player-chosen)
  - Blend fundaments (old + new weighted average)

**Step 5: New Cycle**
- Increment cycle counter
- `seedWorld()` with echo injections from selected echoes
- Reset doom clock (new archetype from world-soul state)
- Generate new rivals
- Resume playing phase

---

## 5. UI — Functional Prototype

Extend the existing GameView. No new routes or major component restructuring — just add panels and replace the basic event log.

### Layout:

```
┌─────────────────────────────────────────────────────┐
│  DOOM BAR  [Stage 2: Reality Cracks]  ████░░░ 42%   │
├──────────┬──────────────────────────────────────────┤
│ LEFT     │                                          │
│ SIDEBAR  │           HEX MAP                        │
│          │         (existing)                       │
│ Ascendant│                                          │
│ Essence  │                                          │
│ Mandate  ├──────────────────────────────────────────┤
│ Rivals   │  NARRATIVE FEED                          │
│ Sim Ctrl │  [tick 142] Kael the Unbroken marched... │
│          │  [tick 143] The doom-breach widened...    │
│          │  [tick 144] +2.3 essence flows...        │
└──────────┴──────────────────────────────────────────┘
```

### Components:

- **DoomBar** (new) — horizontal bar at top. Shows archetype, stage name, progress %, colored by archetype.
- **NarrativeFeed** (replace EventLog) — scrolling feed of narrative prose with tick numbers. Color-coded by type (agent action, doom escalation, divine intervention, essence gain). Shows tier-2+ events prominently, tier-1 dimmed.
- **RivalPanel** (new, sidebar) — compact list of rival gods with name, behavior icon, and a one-line "last action" summary.
- **MandateTracker** (new, sidebar) — if mandate active, shows 3-stage progress bar with stage names.
- **HarvestScreen** (new, overlay) — full-screen overlay when cycle ends. Shows harvest type, echo candidates as cards, "select your divine echoes" interaction, chronicle volume summary. "Begin Next Cycle" button.

### What stays the same:

- HexMap component (unchanged)
- EssencePanel (unchanged)
- SimulationControls (unchanged, maybe add cycle counter)
- AscendantSelection screen (unchanged)
- CosmologyPanel / world gen screen (unchanged)

---

## 6. What We're NOT Building

To keep the slice tight:

- ❌ Divine Toolkit UI (player can't intervene yet — just observe the simulation)
- ❌ Dream Interface UI (motivation manipulation)
- ❌ Spatial movement on the hex map (actors exist in graph, not animated on map)
- ❌ Content Feedback Agent
- ❌ Divine Awareness labels
- ❌ Save/load
- ❌ Sound
- ❌ Polish, animations, transitions

These are all future iterations. The vertical slice proves the loop works. Once the loop feels right, we layer in player agency and polish.

---

## 7. File Structure

New files:
```
src/engine/gameState.ts        — GameState type + factory functions
src/engine/orchestrator.ts     — runTick(), runTwilight(), runHarvest(), runTransition()
src/engine/worldSeed.ts        — seedWorld() — populate graph with actors/locations/artifacts
src/components/Game/DoomBar.tsx
src/components/Game/NarrativeFeed.tsx
src/components/Game/RivalPanel.tsx
src/components/Game/MandateTracker.tsx
src/components/Game/HarvestScreen.tsx
```

Modified files:
```
src/components/Game/GameView.tsx — rewire to use orchestrator + new components
src/engine/simulation.ts       — may be replaced or simplified by orchestrator
```

---

## 8. Success Criteria

The vertical slice is complete when:

1. You can click "Generate World" → "Shape Your Divinity" → enter the game view
2. Agents visibly act each tick (narrative feed shows their actions and outcomes)
3. Doom clock advances and stage transitions produce visible escalation events
4. Rival gods take actions that appear in the narrative feed
5. Essence accumulates in the sidebar
6. When doom expires, the Twilight Phase plays out with weakened actions
7. Harvest screen appears with echo candidates
8. Player can select divine echoes
9. New cycle begins with echo injections biasing world generation
10. Chronicle accumulates across cycles (visible in harvest screen)
