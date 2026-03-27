/**
 * Interactive CLI — headless game REPL for testing.
 *
 * Usage:
 *   npm run cli [--seed N] [--map small|medium|large|epic]
 *
 * Once running, type commands at the prompt:
 *   tick [N]       — advance N ticks (default 1)
 *   run [N]        — auto-run at speed N ticks/sec (default 2), prints a summary every 10 ticks
 *   pause          — stop auto-run
 *   speed N        — set auto-run speed to N ticks/sec
 *   status         — print game state summary
 *   agents         — list all agents with location and tier
 *   agent <id>     — inspect a single agent (partial id match)
 *   events [N]     — show last N tick events (default 10)
 *   graph          — print graph node counts by type
 *   locations      — list all location nodes
 *   doom           — print doom clock status
 *   mandate        — print mandate status
 *   essence        — print essence pool
 *   encounters     — list active encounters / unified actions
 *   factions       — list factions
 *   traces [N]     — show last N trace entries (default 10)
 *   seed           — print the current seed
 *   eval <expr>    — evaluate a JS expression with `state` in scope
 *   help           — print this help
 *   quit / exit    — exit
 */

import * as readline from 'readline';

// Game engine imports
import { initializeGameState, MAP_SIZE_PRESETS } from '../src/engine/gameInit';
import type { MapSizePreset } from '../src/engine/gameInit';
import { runTick, resetEventCounter } from '../src/engine/orchestrator';
import { createBalancedCosmology } from '../src/engine/cosmology';
import { generateArchetypes } from '../src/engine/ascendant';
import {
  enableTracing,
  getTraces,
  clearTraces,
} from '../src/engine/traceBuffer';

import type { GameState, TickEvent } from '../src/types/gameState';
import { SPHERE_NAMES } from '../src/types/index';

// ─── CLI Argument Parsing ─────────────────────────────────────────

interface CliArgs {
  seed: number;
  mapSize: MapSizePreset;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { seed: 42, mapSize: 'medium' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && i + 1 < args.length) {
      const s = parseInt(args[i + 1], 10);
      if (!isNaN(s)) result.seed = s;
      i++;
    } else if (args[i] === '--map' && i + 1 < args.length) {
      const m = args[i + 1] as MapSizePreset;
      if (m in MAP_SIZE_PRESETS) result.mapSize = m;
      i++;
    }
  }
  return result;
}

// ─── Formatting Helpers ───────────────────────────────────────────

const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

function header(text: string): string {
  return `\n${BOLD}${CYAN}═══ ${text} ═══${RESET}`;
}

function dim(text: string): string {
  return `${DIM}${text}${RESET}`;
}

function significanceColor(sig: number): string {
  if (sig >= 0.7) return RED;
  if (sig >= 0.4) return YELLOW;
  return DIM;
}

// ─── State ────────────────────────────────────────────────────────

let state: GameState;
let autoRunTimer: ReturnType<typeof setInterval> | null = null;
let autoRunSpeed = 2; // ticks per second
let ticksSinceLastSummary = 0;

// ─── Commands ─────────────────────────────────────────────────────

function doTick(n: number = 1): void {
  for (let i = 0; i < n; i++) {
    state = runTick(state);
    if (state.phase === 'twilight' || state.phase === 'harvest') {
      console.log(`${YELLOW}⚠ Phase changed to '${state.phase}' at tick ${state.tick}. Stopping.${RESET}`);
      return;
    }
  }
  console.log(`${GREEN}✓${RESET} Tick ${state.tick}  |  ${state.tickEvents.length} events  |  phase: ${state.phase}`);
}

function printStatus(): void {
  console.log(header('Game Status'));
  console.log(`  Cycle:    ${state.cycle}`);
  console.log(`  Tick:     ${state.tick}`);
  console.log(`  Phase:    ${state.phase}`);
  console.log(`  Seed:     ${state.seed}`);
  console.log(`  Season:   ${state.clock.season}  |  Year: ${state.clock.year}`);

  const actors = state.graph.getNodesByType('actor');
  const agents = actors.filter(n => n.properties.actorType === 'individual');
  const locations = state.graph.getNodesByType('location');
  console.log(`  Agents:   ${agents.length}`);
  console.log(`  Locations: ${locations.length}`);
  console.log(`  Events this tick: ${state.tickEvents.length}`);
  console.log(`  Recent events:    ${state.recentEvents.length}`);
  console.log(`  Chronicle:        ${state.chronicleEntries.length}`);
  console.log(`  Unified actions:  ${state.unifiedActions.length}`);
  console.log(`  Doom stage:       ${state.doomClock.currentStage}`);
  console.log(`  Stealth:          ${(state.stealthExposure * 100).toFixed(1)}%`);
}

function printAgents(): void {
  const actors = state.graph.getNodesByType('actor');
  const agents = actors
    .filter(n => n.properties.actorType === 'individual')
    .sort((a, b) => (a.properties.name ?? a.id).localeCompare(b.properties.name ?? b.id));

  console.log(header(`Agents (${agents.length})`));
  for (const a of agents) {
    const loc = state.graph.getOutgoingEdges(a.id, 'located_at');
    const locName = loc.length > 0
      ? (state.graph.getNode(loc[0].target)?.properties.name ?? loc[0].target)
      : '???';
    const tier = a.properties.tier ?? 0;
    const isAscendant = a.id === state.ascendantId ? ` ${CYAN}(YOU)${RESET}` : '';
    console.log(`  ${dim(a.id.slice(0, 8))}  ${BOLD}${a.properties.name ?? 'unnamed'}${RESET}  tier:${tier}  at:${locName}${isAscendant}`);
  }
}

function printAgent(partialId: string): void {
  const actors = state.graph.getNodesByType('actor');
  const match = actors.find(n =>
    n.id.startsWith(partialId) ||
    (n.properties.name ?? '').toLowerCase().includes(partialId.toLowerCase())
  );

  if (!match) {
    console.log(`${RED}No agent matching '${partialId}'${RESET}`);
    return;
  }

  console.log(header(`Agent: ${match.properties.name ?? match.id}`));
  console.log(`  ID:        ${match.id}`);
  console.log(`  Type:      ${match.properties.actorType}`);
  console.log(`  Tier:      ${match.properties.tier ?? 0}`);
  console.log(`  Culture:   ${match.properties.cultureName ?? '—'}`);

  const loc = state.graph.getOutgoingEdges(match.id, 'located_at');
  if (loc.length > 0) {
    const locNode = state.graph.getNode(loc[0].target);
    console.log(`  Location:  ${locNode?.properties.name ?? loc[0].target}`);
  }

  // Capabilities
  if (match.properties.domainCapabilities) {
    const caps = match.properties.domainCapabilities as Record<string, number>;
    const entries = Object.entries(caps).filter(([, v]) => v > 0);
    if (entries.length > 0) {
      console.log(`  Capabilities:`);
      for (const [k, v] of entries.sort((a, b) => b[1] - a[1])) {
        console.log(`    ${k}: ${v}`);
      }
    }
  }

  // Reputation
  if (match.properties.reputationScore !== undefined) {
    console.log(`  Reputation: ${(match.properties.reputationScore as number).toFixed(2)}`);
  }

  // Sphere alignment
  if (match.properties.sphereAlignment) {
    console.log(`  Sphere:    ${JSON.stringify(match.properties.sphereAlignment)}`);
  }
}

function printEvents(n: number = 10): void {
  const events = state.recentEvents.slice(-n);
  console.log(header(`Recent Events (last ${events.length})`));
  for (const e of events) {
    const col = significanceColor(e.significance);
    const sigLabel = e.significance >= 0.7 ? '!!!' : e.significance >= 0.4 ? '! ' : '  ';
    console.log(`  ${dim(`t${e.tick}`)} ${col}${sigLabel} [${e.type}]${RESET} ${e.message}`);
  }
}

function printGraph(): void {
  console.log(header('Graph Summary'));
  const types = new Map<string, number>();
  for (const node of state.graph.getAllNodes()) {
    const t = node.type;
    types.set(t, (types.get(t) ?? 0) + 1);
  }
  const sorted = [...types.entries()].sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    console.log(`  ${type}: ${count}`);
  }

  let edgeCount = 0;
  for (const node of state.graph.getAllNodes()) {
    edgeCount += state.graph.getOutgoingEdges(node.id).length;
  }
  console.log(`  ${dim(`Total edges: ${edgeCount}`)}`);
}

function printLocations(): void {
  const locations = state.graph.getNodesByType('location');
  console.log(header(`Locations (${locations.length})`));
  for (const loc of locations.slice(0, 30)) {
    const pop = state.graph.getIncomingEdges(loc.id, 'located_at').length;
    const tier = loc.properties.settlementTier ?? '—';
    console.log(`  ${dim(loc.id.slice(0, 8))}  ${BOLD}${loc.properties.name ?? 'unnamed'}${RESET}  tier:${tier}  pop:${pop}`);
  }
  if (locations.length > 30) {
    console.log(dim(`  ... and ${locations.length - 30} more`));
  }
}

function printDoom(): void {
  console.log(header('Doom Clock'));
  console.log(`  Archetype:  ${state.doomDefinition.archetype}`);
  console.log(`  Stage:      ${state.doomClock.currentStage} / ${state.doomDefinition.stages.length - 1}`);
  console.log(`  Ticks left: ${state.doomClock.ticksRemaining}`);
  console.log(`  Total doom: ${state.doomDefinition.totalDoomTicks}`);

  for (let i = 0; i < state.doomDefinition.stages.length; i++) {
    const s = state.doomDefinition.stages[i];
    const marker = i === state.doomClock.currentStage ? ` ${YELLOW}← current${RESET}` : '';
    console.log(`  [${i}] ${s.name}${marker}`);
  }
}

function printMandate(): void {
  console.log(header('Mandate'));
  if (!state.mandateDefinition || !state.mandateState) {
    console.log('  No active mandate.');
    return;
  }
  console.log(`  Name:     ${state.mandateDefinition.name}`);
  console.log(`  Stage:    ${state.mandateState.currentStage}`);
  console.log(`  Progress: ${(state.mandateState.progress * 100).toFixed(1)}%`);
}

function printEssence(): void {
  console.log(header('Essence Pool'));
  let total = 0;
  for (const sphere of SPHERE_NAMES) {
    const val = state.essencePool[sphere] ?? 0;
    total += val;
    if (val > 0) {
      console.log(`  ${sphere}: ${val.toFixed(1)}`);
    }
  }
  console.log(`  ${BOLD}Total: ${total.toFixed(1)}${RESET}`);
}

function printEncounters(): void {
  const actions = state.unifiedActions;
  console.log(header(`Unified Actions (${actions.length})`));
  for (const a of actions.slice(0, 20)) {
    console.log(`  ${dim(a.id.slice(0, 8))}  ${a.templateId}  progress:${a.currentStep}/${a.totalSteps}  status:${a.status ?? 'active'}`);
  }
  if (actions.length > 20) {
    console.log(dim(`  ... and ${actions.length - 20} more`));
  }
}

function printFactions(): void {
  const factions = state.graph.getNodesByType('faction');
  console.log(header(`Factions (${factions.length})`));
  if (factions.length === 0) {
    console.log('  No factions yet.');
    return;
  }
  for (const f of factions) {
    const members = state.graph.getIncomingEdges(f.id, 'belongs_to').length;
    console.log(`  ${dim(f.id.slice(0, 8))}  ${BOLD}${f.properties.name ?? 'unnamed'}${RESET}  members:${members}`);
  }
}

function printTraces(n: number = 10): void {
  const traces = getTraces();
  const last = traces.slice(-n);
  console.log(header(`Traces (last ${last.length} of ${traces.length})`));
  for (const t of last) {
    console.log(`  ${dim(`t${t.tick}`)} [${t.category}] ${t.summary}`);
  }
}

function startAutoRun(speed?: number): void {
  if (speed !== undefined && speed > 0) autoRunSpeed = speed;
  stopAutoRun();
  ticksSinceLastSummary = 0;

  const interval = Math.max(50, 1000 / autoRunSpeed);
  console.log(`${GREEN}▶ Running at ${autoRunSpeed} ticks/sec${RESET} (Ctrl+C or type 'pause' to stop)`);

  autoRunTimer = setInterval(() => {
    state = runTick(state);
    ticksSinceLastSummary++;

    if (ticksSinceLastSummary % 10 === 0) {
      const evtCount = state.recentEvents.slice(-10).length;
      console.log(`  ${dim(`tick ${state.tick}`)}  events:${evtCount}  doom:${state.doomClock.currentStage}  phase:${state.phase}`);
    }

    if (state.phase === 'twilight' || state.phase === 'harvest') {
      console.log(`${YELLOW}⚠ Phase changed to '${state.phase}' at tick ${state.tick}. Paused.${RESET}`);
      stopAutoRun();
    }
  }, interval);
}

function stopAutoRun(): void {
  if (autoRunTimer) {
    clearInterval(autoRunTimer);
    autoRunTimer = null;
    console.log(`${YELLOW}⏸ Paused at tick ${state.tick}${RESET}`);
  }
}

function printHelp(): void {
  console.log(header('Commands'));
  console.log(`  ${BOLD}tick${RESET} [N]         Advance N ticks (default 1)`);
  console.log(`  ${BOLD}run${RESET} [N]          Auto-run at N ticks/sec (default 2)`);
  console.log(`  ${BOLD}pause${RESET}            Stop auto-run`);
  console.log(`  ${BOLD}speed${RESET} N           Set auto-run speed`);
  console.log(`  ${BOLD}status${RESET}           Game state overview`);
  console.log(`  ${BOLD}agents${RESET}           List all agents`);
  console.log(`  ${BOLD}agent${RESET} <id|name>  Inspect a single agent`);
  console.log(`  ${BOLD}events${RESET} [N]       Show last N events (default 10)`);
  console.log(`  ${BOLD}graph${RESET}            Node counts by type`);
  console.log(`  ${BOLD}locations${RESET}        List locations`);
  console.log(`  ${BOLD}doom${RESET}             Doom clock status`);
  console.log(`  ${BOLD}mandate${RESET}          Mandate status`);
  console.log(`  ${BOLD}essence${RESET}          Essence pool`);
  console.log(`  ${BOLD}encounters${RESET}       Active unified actions`);
  console.log(`  ${BOLD}factions${RESET}         List factions`);
  console.log(`  ${BOLD}traces${RESET} [N]       Show last N traces (default 10)`);
  console.log(`  ${BOLD}seed${RESET}             Print current seed`);
  console.log(`  ${BOLD}eval${RESET} <expr>      Evaluate JS with 'state' in scope`);
  console.log(`  ${BOLD}help${RESET}             This help`);
  console.log(`  ${BOLD}quit${RESET} / ${BOLD}exit${RESET}     Exit`);
}

// ─── REPL ─────────────────────────────────────────────────────────

function handleCommand(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;

  const [cmd, ...rest] = trimmed.split(/\s+/);
  const arg = rest.join(' ');

  switch (cmd.toLowerCase()) {
    case 'tick':
    case 't': {
      const n = parseInt(arg, 10);
      doTick(isNaN(n) || n < 1 ? 1 : n);
      break;
    }
    case 'run':
    case 'start': {
      const n = parseFloat(arg);
      startAutoRun(isNaN(n) ? undefined : n);
      break;
    }
    case 'pause':
    case 'stop':
      stopAutoRun();
      break;
    case 'speed': {
      const n = parseFloat(arg);
      if (isNaN(n) || n <= 0) {
        console.log(`Current speed: ${autoRunSpeed} ticks/sec`);
      } else {
        autoRunSpeed = n;
        console.log(`Speed set to ${autoRunSpeed} ticks/sec`);
        if (autoRunTimer) startAutoRun(); // restart with new speed
      }
      break;
    }
    case 'status':
    case 's':
      printStatus();
      break;
    case 'agents':
      printAgents();
      break;
    case 'agent': {
      if (!arg) {
        console.log(`${RED}Usage: agent <id or name>${RESET}`);
      } else {
        printAgent(arg);
      }
      break;
    }
    case 'events':
    case 'e': {
      const n = parseInt(arg, 10);
      printEvents(isNaN(n) ? 10 : n);
      break;
    }
    case 'graph':
    case 'g':
      printGraph();
      break;
    case 'locations':
    case 'locs':
      printLocations();
      break;
    case 'doom':
      printDoom();
      break;
    case 'mandate':
      printMandate();
      break;
    case 'essence':
      printEssence();
      break;
    case 'encounters':
    case 'actions':
      printEncounters();
      break;
    case 'factions':
      printFactions();
      break;
    case 'traces':
    case 'tr': {
      const n = parseInt(arg, 10);
      printTraces(isNaN(n) ? 10 : n);
      break;
    }
    case 'seed':
      console.log(`Seed: ${state.seed}`);
      break;
    case 'eval': {
      if (!arg) {
        console.log(`${RED}Usage: eval <expression>${RESET}`);
      } else {
        try {
          // Make 'state' available to the eval
          const fn = new Function('state', `return (${arg})`);
          const result = fn(state);
          console.log(result);
        } catch (err) {
          console.log(`${RED}${err instanceof Error ? err.message : String(err)}${RESET}`);
        }
      }
      break;
    }
    case 'help':
    case 'h':
    case '?':
      printHelp();
      break;
    case 'quit':
    case 'exit':
    case 'q':
      return false;
    default:
      console.log(`${RED}Unknown command: ${cmd}${RESET}. Type 'help' for commands.`);
  }

  return true;
}

// ─── Main ─────────────────────────────────────────────────────────

function main(): void {
  const args = parseArgs();

  console.log(`${BOLD}${CYAN}`);
  console.log(`  ╔══════════════════════════════════════╗`);
  console.log(`  ║   The Fantasy World Simulator  CLI   ║`);
  console.log(`  ╚══════════════════════════════════════╝${RESET}`);
  console.log('');

  // Initialize
  console.log(`Initializing... seed:${args.seed}  map:${args.mapSize}`);
  resetEventCounter();
  clearTraces();
  enableTracing();

  const archetypes = generateArchetypes(4, args.seed);
  const archetype = archetypes[0];
  const cosmology = createBalancedCosmology();
  const preset = MAP_SIZE_PRESETS[args.mapSize];

  const { state: initialState } = initializeGameState(
    archetype,
    'CLI-Tester',
    cosmology,
    args.seed,
    preset.cols,
    preset.rows,
  );

  state = initialState;

  const agents = state.graph.getNodesByType('actor').filter(n => n.properties.actorType === 'individual');
  const locations = state.graph.getNodesByType('location');
  console.log(`${GREEN}✓${RESET} Ready. ${agents.length} agents, ${locations.length} locations, tick 0.`);
  console.log(`Type ${BOLD}help${RESET} for commands.\n`);

  // REPL
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${DIM}fws>${RESET} `,
  });

  rl.prompt();

  rl.on('line', (line) => {
    const keepGoing = handleCommand(line);
    if (!keepGoing) {
      stopAutoRun();
      console.log('Goodbye.');
      rl.close();
      process.exit(0);
    }
    rl.prompt();
  });

  rl.on('close', () => {
    stopAutoRun();
    process.exit(0);
  });
}

main();
