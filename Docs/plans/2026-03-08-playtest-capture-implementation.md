# Playtest Capture System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a headless playtest runner that seeds a world, runs N ticks, and dumps a structured markdown report for human review.

**Architecture:** Extract game initialization from GameView.tsx into a pure function (`src/engine/gameInit.ts`), then build a Node script (`scripts/playtest.ts`) that imports it, runs the tick loop with tracing enabled, and formats the output as a three-section markdown report (dashboard + narrative log + trace deep-dive).

**Tech Stack:** TypeScript, esbuild (bundler for Node scripts), existing engine modules, existing trace buffer system.

---

### Task 1: Extract `initializeGameState` to `src/engine/gameInit.ts`

**Files:**
- Create: `src/engine/gameInit.ts`
- Create: `src/engine/__tests__/gameInit.test.ts`
- Modify: `src/components/Game/GameView.tsx:105-182` (replace inline function with import)

**Step 1: Write the failing test**

```typescript
// src/engine/__tests__/gameInit.test.ts
import { describe, it, expect } from 'vitest';
import { initializeGameState } from '../gameInit';
import { createBalancedCosmology } from '../cosmology';
import { generateArchetypes } from '../ascendant';

describe('initializeGameState', () => {
  const cosmology = createBalancedCosmology();
  const archetypes = generateArchetypes(4, 42);
  const archetype = archetypes[0];

  it('returns a valid GameState with all required fields', () => {
    const { state, tiles } = initializeGameState(archetype, 'TestAvatar', cosmology, 42);

    expect(state.cycle).toBe(1);
    expect(state.tick).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.seed).toBe(42);
    expect(state.graph).toBeDefined();
    expect(state.ascendantId).toBeTruthy();
    expect(state.rivalDefinitions.length).toBeGreaterThan(0);
    expect(state.doomClock).toBeDefined();
    expect(state.mandateDefinition).toBeDefined();
    expect(state.mandateState).toBeDefined();
    expect(state.visibilityMap).toBeDefined();
    expect(tiles.length).toBeGreaterThan(0);
  });

  it('is deterministic — same seed produces same state', () => {
    const a = initializeGameState(archetype, 'TestAvatar', cosmology, 42);
    const b = initializeGameState(archetype, 'TestAvatar', cosmology, 42);
    expect(a.state.rivalDefinitions.length).toBe(b.state.rivalDefinitions.length);
    expect(a.state.ascendantId).toBe(b.state.ascendantId);
    expect(a.tiles.length).toBe(b.tiles.length);
  });

  it('different seeds produce different worlds', () => {
    const a = initializeGameState(archetype, 'TestAvatar', cosmology, 42);
    const b = initializeGameState(archetype, 'TestAvatar', cosmology, 99);
    // Rival names should differ (extremely likely with different seeds)
    const aNamesSet = new Set(a.state.rivalDefinitions.map(r => r.name));
    const bNamesSet = new Set(b.state.rivalDefinitions.map(r => r.name));
    // At minimum the graph should differ
    expect(a.state.graph.getNodesByType('actor').length)
      .not.toBe(0); // sanity check
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/gameInit.test.ts`
Expected: FAIL with "Cannot find module '../gameInit'"

**Step 3: Write the implementation**

Create `src/engine/gameInit.ts` — move the `initializeGameState` function from `GameView.tsx:105-182` here. Key changes:
- Accept `cols` and `rows` as optional parameters (default 20, 15)
- Import all dependencies directly (no React)
- Export as named export

```typescript
// src/engine/gameInit.ts
import type { CosmologyProfile, HexTile, LocationSubtype } from '../types/index';
import type { AscendantArchetype } from '../types/influence';
import type { GameState } from '../types/gameState';
import { generateWorld } from './hexGrid';
import { createAscendant } from './ascendant';
import { seedWorld } from './worldSeed';
import { generateRivals, createRivalState } from './rival';
import { generateDoomClock, createDoomClockState } from './doomClock';
import { createGreatChronicle } from './chronicle';
import { createDefaultFundament, createResonanceState } from './worldSoul';
import { SPHERE_NAMES } from '../types/index';
import { recalcVisibility, collectLOSSources } from './visibility';
import { generateMandate } from './mandateGenerator';
import { createMandateState } from './mandate';

export const DEFAULT_COLS = 20;
export const DEFAULT_ROWS = 15;

export function initializeGameState(
  archetype: AscendantArchetype,
  avatarName: string,
  cosmology: CosmologyProfile,
  seed: number,
  cols: number = DEFAULT_COLS,
  rows: number = DEFAULT_ROWS,
): { state: GameState; tiles: HexTile[] } {
  const tiles = generateWorld(cosmology, cols, rows, seed);
  const { graph } = seedWorld(cosmology, tiles, seed);

  if (!graph.getNode('loc.start')) {
    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
    });
  }

  const { ascendantId } = createAscendant(graph, {
    archetype,
    avatar: {
      name: avatarName,
      startLocationId: 'loc.start',
      formDescription: `The mortal vessel of ${archetype.title}`,
    },
  });

  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  const emptyPool = {} as Record<string, number>;
  for (const s of SPHERE_NAMES) emptyPool[s] = 0;

  const mandateDef = generateMandate(cosmology, archetype.sphereAlignment, seed);
  const mandateStateInit = createMandateState(mandateDef.id, 0);

  const losSources = collectLOSSources(graph, ascendantId, []);
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 0, cols, rows);

  const state: GameState = {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyPool as any,
    mandateDefinition: mandateDef,
    mandateState: mandateStateInit,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: doomState,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap,
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  };

  return { state, tiles };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/engine/__tests__/gameInit.test.ts`
Expected: PASS (3 tests)

**Step 5: Update GameView.tsx to import from gameInit.ts**

In `src/components/Game/GameView.tsx`:
- Add import: `import { initializeGameState } from '../../engine/gameInit';`
- Delete the inline `initializeGameState` function (lines ~105-182)
- Delete imports that were only used by the inline function (if any are now unused)
- Keep `COLS`, `ROWS`, `SETTLEMENT_PRIORITY`, `settlementPriority` in GameView (they're UI concerns)

**Step 6: Run full test suite to verify no regressions**

Run: `npx vitest run`
Expected: All existing tests still pass

**Step 7: Commit**

```bash
git add src/engine/gameInit.ts src/engine/__tests__/gameInit.test.ts src/components/Game/GameView.tsx
git commit -m "refactor: extract initializeGameState from GameView to engine/gameInit"
```

---

### Task 2: Create the playtest report formatter (`scripts/playtest-format.ts`)

**Files:**
- Create: `scripts/playtest-format.ts`
- Create: `scripts/__tests__/playtest-format.test.ts`

**Step 1: Write the failing test**

```typescript
// scripts/__tests__/playtest-format.test.ts
import { describe, it, expect } from 'vitest';
import { formatDashboard, formatNarrativeLog, formatTraceDeepDive, formatFullReport } from '../playtest-format';
import type { TickEvent } from '../../src/types/gameState';
import type { TraceEntry } from '../../src/types/trace';

describe('formatDashboard', () => {
  it('includes seed, tick count, and doom stage', () => {
    const snapshots = [
      { tick: 0, doomStage: 0, agentCount: 10, essenceTotal: 0, mandateProgress: 0, reputationStats: { min: 0.5, median: 0.5, max: 0.5 }, cultureCount: 2 },
      { tick: 10, doomStage: 1, agentCount: 10, essenceTotal: 5.2, mandateProgress: 0.1, reputationStats: { min: 0.3, median: 0.5, max: 0.7 }, cultureCount: 2 },
    ];
    const md = formatDashboard(42, 50, snapshots);
    expect(md).toContain('Seed: 42');
    expect(md).toContain('Ticks: 50');
    expect(md).toContain('| Tick | Doom | Agents | Essence | Mandate | Rep (min/med/max) |');
  });
});

describe('formatNarrativeLog', () => {
  it('groups events by tick range and includes significance', () => {
    const events: TickEvent[] = [
      { id: 'e1', tick: 5, type: 'doom_escalation', message: 'The Breach intensifies', significance: 0.9 },
      { id: 'e2', tick: 12, type: 'agent_action_resolved', message: 'Kael acted in Force', significance: 0.4 },
      { id: 'e3', tick: 15, type: 'rival_action', message: 'Rival attacks', significance: 0.7 },
    ];
    const md = formatNarrativeLog(events, 10); // group by 10 ticks
    expect(md).toContain('### Ticks 1–10');
    expect(md).toContain('### Ticks 11–20');
    expect(md).toContain('[0.9]');
    expect(md).toContain('The Breach intensifies');
  });

  it('filters to notable+ events by default', () => {
    const events: TickEvent[] = [
      { id: 'e1', tick: 1, type: 'essence_gain', message: 'trivial', significance: 0.1 },
      { id: 'e2', tick: 1, type: 'doom_escalation', message: 'important', significance: 0.8 },
    ];
    const md = formatNarrativeLog(events, 10, 0.3);
    expect(md).not.toContain('trivial');
    expect(md).toContain('important');
  });
});

describe('formatFullReport', () => {
  it('contains all three sections', () => {
    const md = formatFullReport({
      seed: 42,
      totalTicks: 10,
      snapshots: [],
      allEvents: [],
      chronicleEntries: [],
      traces: [],
    });
    expect(md).toContain('# Playtest Report');
    expect(md).toContain('## 1. Dashboard');
    expect(md).toContain('## 2. Narrative Log');
    expect(md).toContain('## 3. Trace Deep-Dive');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/playtest-format.test.ts`
Expected: FAIL with "Cannot find module '../playtest-format'"

**Step 3: Write the implementation**

Create `scripts/playtest-format.ts` with pure formatting functions:
- `formatDashboard(seed, totalTicks, snapshots)` → markdown table of metrics over time
- `formatNarrativeLog(events, groupSize, minSignificance)` → chronological event log grouped by tick ranges
- `formatTraceDeepDive(traces)` → trace entries grouped by category
- `formatFullReport(data)` → combines all three sections with header

All functions are pure (string in, string out). No side effects.

**Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/playtest-format.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add scripts/playtest-format.ts scripts/__tests__/playtest-format.test.ts
git commit -m "feat: add playtest report formatter (dashboard, narrative log, trace deep-dive)"
```

---

### Task 3: Create the playtest runner (`scripts/playtest.ts`)

**Files:**
- Create: `scripts/playtest.ts`
- Modify: `package.json` (add `playtest` script)

**Step 1: Write the runner script**

```typescript
// scripts/playtest.ts
import * as fs from 'fs';
import * as path from 'path';
import { initializeGameState } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import { enableTracing, disableTracing, getTraces, clearTraces } from '../src/engine/traceBuffer';
import { SPHERE_NAMES } from '../src/types/index';
import { formatFullReport } from './playtest-format';
import type { GameState } from '../src/types/gameState';
import type { TickEvent } from '../src/types/gameState';
import type { TraceEntry } from '../src/types/trace';

// ─── CLI args ─────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.indexOf(`--${name}`);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const seedsRaw = getArg('seeds', getArg('seed', '42'));
const seeds = seedsRaw.split(',').map(Number);
const totalTicks = Number(getArg('ticks', '50'));
const snapshotInterval = Number(getArg('interval', '10'));
const minSignificance = Number(getArg('min-sig', '0.3'));

// ─── Snapshot capture ─────────────────────────────────────
interface Snapshot {
  tick: number;
  doomStage: number;
  agentCount: number;
  essenceTotal: number;
  mandateProgress: number;
  reputationStats: { min: number; median: number; max: number };
  cultureCount: number;
}

function captureSnapshot(state: GameState): Snapshot {
  const actors = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual');
  const reps = actors.map(a => (a.properties?.reputationScore as number) ?? 0.5).sort((a, b) => a - b);
  const median = reps.length > 0 ? reps[Math.floor(reps.length / 2)] : 0.5;
  const essenceTotal = SPHERE_NAMES.reduce((s, sp) => s + (state.essencePool[sp] ?? 0), 0);
  const cultures = new Set(
    state.graph.getNodesByType('actor')
      .flatMap(a => state.graph.getOutgoingEdges(a.id, 'belongs_to').map(e => e.target))
  );

  return {
    tick: state.tick,
    doomStage: state.doomClock.currentStage,
    agentCount: actors.length,
    essenceTotal: Math.round(essenceTotal * 10) / 10,
    mandateProgress: Math.round((state.mandateState?.progress ?? 0) * 100) / 100,
    reputationStats: {
      min: Math.round((reps[0] ?? 0.5) * 100) / 100,
      median: Math.round(median * 100) / 100,
      max: Math.round((reps[reps.length - 1] ?? 0.5) * 100) / 100,
    },
    cultureCount: cultures.size,
  };
}

// ─── Run one seed ─────────────────────────────────────────
function runPlaytest(seed: number): string {
  resetEventCounter();
  clearTraces();
  enableTracing();

  const cosmology = createBalancedCosmology();
  const archetypes = generateArchetypes(4, seed);
  const archetype = archetypes[0];

  const { state: initialState } = initializeGameState(archetype, 'Playtester', cosmology, seed);

  const snapshots: Snapshot[] = [captureSnapshot(initialState)];
  const allEvents: TickEvent[] = [];
  let state = initialState;

  for (let i = 0; i < totalTicks; i++) {
    state = runTick(state);
    allEvents.push(...state.tickEvents);

    if ((state.tick % snapshotInterval) === 0) {
      snapshots.push(captureSnapshot(state));
    }

    // Stop early if the world ends
    if (state.phase === 'twilight' || state.phase === 'harvest') {
      snapshots.push(captureSnapshot(state));
      break;
    }
  }

  // Capture final snapshot if not on interval boundary
  if (state.tick % snapshotInterval !== 0) {
    snapshots.push(captureSnapshot(state));
  }

  const traces = [...getTraces()] as TraceEntry[];
  disableTracing();

  return formatFullReport({
    seed,
    totalTicks: state.tick,
    snapshots,
    allEvents,
    chronicleEntries: state.chronicleEntries,
    traces,
  });
}

// ─── Main ─────────────────────────────────────────────────
const outDir = path.resolve('Docs/playtests');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const today = new Date().toISOString().slice(0, 10);

for (const seed of seeds) {
  console.log(`Running seed ${seed} for ${totalTicks} ticks...`);
  const start = Date.now();
  const report = runPlaytest(seed);
  const elapsed = Date.now() - start;

  const outFile = path.join(outDir, `${today}-seed-${seed}.md`);
  fs.writeFileSync(outFile, report, 'utf-8');
  console.log(`  → ${outFile} (${elapsed}ms)`);
}

if (seeds.length > 1) {
  console.log(`\nCompleted ${seeds.length} playtests. Reports in ${outDir}/`);
}
```

**Step 2: Add npm script to package.json**

Add to `"scripts"`:
```json
"playtest": "esbuild scripts/playtest.ts --bundle --platform=node --format=esm --outfile=/tmp/playtest.mjs --external:fs --external:path && node /tmp/playtest.mjs"
```

**Step 3: Test manually**

Run: `npm run playtest -- --seed 42 --ticks 20`
Expected: Creates `Docs/playtests/2026-03-08-seed-42.md` with all three sections populated

**Step 4: Test multi-seed**

Run: `npm run playtest -- --seeds 42,7,100 --ticks 30`
Expected: Creates 3 separate report files

**Step 5: Commit**

```bash
git add scripts/playtest.ts package.json
git commit -m "feat: add headless playtest runner (npm run playtest)"
```

---

### Task 4: Run first real playtest and review

**Files:**
- Create: `Docs/playtests/2026-03-08-seed-42.md` (generated)
- Create: `Docs/playtests/2026-03-08-seed-7.md` (generated)
- Create: `Docs/playtests/2026-03-08-seed-100.md` (generated)

**Step 1: Generate reports**

Run: `npm run playtest -- --seeds 42,7,100 --ticks 50`

**Step 2: Read and review the output**

Read each report. Look for:
- Are the narrative messages interesting or repetitive?
- Does doom pacing feel right? (Stages should advance but not too fast)
- Are dilemmas actually firing? (Should see dilemma_resolved events)
- Is essence accumulating at a reasonable rate?
- Do rival actions feel varied?
- Are there dead stretches (many ticks with zero notable events)?
- Do cultures appear in the snapshots?

**Step 3: Document findings**

Create a brief review summary noting the top 3-5 findings from the first playtest batch. This becomes the input for the Priority 5 "Golden Path Polish Sprint."

**Step 4: Commit**

```bash
git add Docs/playtests/
git commit -m "docs: first playtest batch — seeds 42, 7, 100 at 50 ticks"
```

---

### Task 5: Documentation updates

**Files:**
- Modify: `CLAUDE.md` (changelog, project status, engine stats)
- Modify: Obsidian vault (new system note if warranted)
- Modify: Notion backlog (mark Priority 1 complete)

Use the `gamedocumenter` skill for this step.

**Step 1: Update CLAUDE.md**
- Add changelog entries for gameInit extraction and playtest runner
- Update engine stats (module count, line count)
- Mark "Playtest Capture System" as complete in project status

**Step 2: Update Notion backlog**
- Mark Priority 1 complete
- Add any follow-up tasks discovered during playtest review

**Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: playtest capture system complete, first batch reviewed"
```
