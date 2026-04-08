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
 *   genome <name>  — inspect settlement genome result (sublocations, NPCs, archetype)
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
import { createSimulationRuntime } from '../src/engine/simulationRuntime';
import type { SimulationRuntime } from '../src/engine/simulationRuntime';
import { setTrackedAgents, getBalanceEvents, selectDefaultTrackedHero } from '../src/engine/balanceTelemetry';
import { buildBalanceRunSummary, buildBalanceAgentJourneySummary } from '../src/engine/balanceSummary';
import { evaluateBalanceSummary, evaluateAgentJourney, formatEvaluationReport } from '../src/engine/balanceEvaluator';
import { getDefaultBalanceTargets } from '../src/engine/balanceTargets';
import { getAttentionVisualState } from '../src/engine/attentionPool';
import { ATTENTION_BASE_CAPACITY, ATTENTION_BASE_REGEN } from '../src/data/attention-constants';

import type { GameState, TickEvent } from '../src/types/gameState';
import type { GraphNode } from '../src/types/graph';
import { SPHERE_NAMES } from '../src/types/index';
import { getUnifiedTemplateById, UNIFIED_ACTION_TEMPLATES } from '../src/data/unified-action-templates';
import { createUnifiedAction } from '../src/engine/unifiedActionLifecycle';
import { REWARD_POSSESSIONS, REWARD_CONDITIONS, REWARD_BESTOWED_POWERS } from '../src/data/reward-attachment-catalog';
import { STARTER_POSSESSIONS, STARTER_CONDITIONS } from '../src/data/starter-attachments';

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
let runtime: SimulationRuntime;
let autoRunTimer: ReturnType<typeof setInterval> | null = null;
let autoRunSpeed = 2; // ticks per second
let ticksSinceLastSummary = 0;

// ─── Commands ─────────────────────────────────────────────────────

function doTick(n: number = 1): void {
  for (let i = 0; i < n; i++) {
    state = runTick(state, [], runtime);
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
  console.log(`  Ticks left: ${state.doomClock.totalTicks - state.doomClock.currentTick}`);
  console.log(`  Total doom: ${state.doomDefinition.totalTicks}`);

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
    const status = a.resolved ? `resolved:${a.outcome ?? 'unknown'}` : `step:${a.currentStep} progress:${a.stepProgress}/${a.stepDuration}`;
    console.log(`  ${dim(a.actionId.slice(0, 8))}  ${a.templateId}  ${status}`);
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

function formatCountMap(counts: Record<string, number>): string {
  const parts = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => `${key}=${value}`);
  return parts.length > 0 ? parts.join(', ') : 'none';
}

function printEncounterDecisionSummary(summary: NonNullable<ReturnType<typeof buildBalanceRunSummary>>): void {
  const decisions = summary.encounterDecisions;
  if (!decisions) return;

  console.log(`  Decision mix: ${formatCountMap(decisions.countsByType)}`);
  console.log(`  Idle reasons: ${formatCountMap(decisions.idleReasons)}`);

  const hottestSubtype = Object.entries(decisions.byLocationSubtype)
    .sort((a, b) => b[1].idleDecisions - a[1].idleDecisions)[0];
  if (hottestSubtype && hottestSubtype[1].idleDecisions > 0) {
    console.log(
      `  Hottest idle subtype: ${hottestSubtype[0]} (${hottestSubtype[1].idleDecisions} idle, ${hottestSubtype[1].forcedTravelDecisions} forced travel)`,
    );
  }
}

function printBalance(subCmd?: string, subArg?: string): void {
  const tel = runtime.balanceTelemetry;
  if (!tel) {
    console.log(`${RED}Balance telemetry not initialized.${RESET}`);
    return;
  }

  if (!subCmd || subCmd === 'summary') {
    const summary = buildBalanceRunSummary(runtime, state.tick);
    if (!summary) { console.log('No summary available.'); return; }
    console.log(header('Balance Summary'));
    console.log(`  Ticks: ${summary.totalTicks}  |  Target: ${summary.targetVersion}`);
    console.log(`  Steps: ${summary.totals.stepsAttempted} attempted`);
    console.log(`  Encounters: ${summary.totals.encountersAttempted} attempted, ${summary.totals.encountersCompleted} completed, ${summary.totals.encountersAbandoned} abandoned`);
    console.log(`  Fail-forward share: ${(summary.failForwardShare * 100).toFixed(1)}%`);
    console.log(`  Rewards: ${summary.totals.rewardsGranted} granted, ${summary.totals.rewardsMissed} missed`);
    console.log(`  Growth beats: ${summary.totals.growthBeatsApplied}`);
    console.log(`  Dissolutions: ${summary.totals.dissolutions}`);
    console.log(`  First reward tick: ${summary.pacing.firstRewardTick ?? 'none'}`);
    console.log(`  First setback tick: ${summary.pacing.firstSetbackTick ?? 'none'}`);
    console.log(`  First growth beat tick: ${summary.pacing.firstGrowthBeatTick ?? 'none'}`);
    printEncounterDecisionSummary(summary);
    if (Object.keys(summary.stepSuccessRates).length > 0) {
      console.log(`  Step success rates by band:`);
      for (const [band, stats] of Object.entries(summary.stepSuccessRates)) {
        if (stats) {
          console.log(`    ${band.padEnd(10)} ${(stats.rate * 100).toFixed(1)}%  (${stats.successes}/${stats.attempts})`);
        }
      }
    }
    return;
  }

  if (subCmd === 'eval') {
    const summary = buildBalanceRunSummary(runtime, state.tick);
    if (!summary) { console.log('No data to evaluate.'); return; }
    const targets = getDefaultBalanceTargets();
    const result = evaluateBalanceSummary(summary, targets);
    console.log(formatEvaluationReport(result, summary));
    return;
  }

  if (subCmd === 'idle') {
    const summary = buildBalanceRunSummary(runtime, state.tick);
    const decisions = summary?.encounterDecisions;
    if (!decisions) { console.log('No encounter decision data yet.'); return; }
    console.log(header('Encounter Idle Report'));
    console.log(`  Idle reasons: ${formatCountMap(decisions.idleReasons)}`);
    const hotspots = Object.entries(decisions.byLocationSubtype)
      .filter(([, stats]) => stats.idleDecisions > 0 || stats.forcedTravelDecisions > 0)
      .sort((a, b) => {
        const aScore = a[1].idleDecisions * 10 + a[1].forcedTravelDecisions;
        const bScore = b[1].idleDecisions * 10 + b[1].forcedTravelDecisions;
        return bScore - aScore;
      })
      .slice(0, 8);
    if (hotspots.length === 0) {
      console.log('  No idle hotspots recorded.');
      return;
    }
    for (const [subtype, stats] of hotspots) {
      console.log(
        `  ${subtype}: idle=${stats.idleDecisions}, forcedTravel=${stats.forcedTravelDecisions}, selected=${stats.selectedDecisions}, reasons=${formatCountMap(stats.idleReasons)}`,
      );
    }
    return;
  }

  if (subCmd === 'templates') {
    const summary = buildBalanceRunSummary(runtime, state.tick);
    const decisions = summary?.encounterDecisions;
    if (!decisions) { console.log('No encounter decision data yet.'); return; }
    console.log(header('Encounter Templates'));
    const templates = Object.entries(decisions.byTemplate)
      .sort((a, b) => b[1].decisions - a[1].decisions)
      .slice(0, 12);
    if (templates.length === 0) {
      console.log('  No template decisions recorded.');
      return;
    }
    for (const [templateId, stats] of templates) {
      console.log(
        `  ${templateId}: picks=${stats.decisions}, local=${stats.startLocal}, remote=${stats.attemptRemote}, move=${stats.queueMovement}, avgUtil=${stats.averageForecastedUtility.toFixed(3)}, avgProb=${stats.averageCompletionProb.toFixed(3)}, avgTravel=${stats.averageTravelCost.toFixed(2)}`,
      );
    }
    return;
  }

  if (subCmd === 'targets') {
    const targets = getDefaultBalanceTargets();
    console.log(header(`Balance Targets — ${targets.version}`));
    console.log(`  ${dim(targets.description)}`);
    for (const b of targets.bands) {
      const scope = b.scope ? ` [${b.scope}]` : '';
      console.log(`  ${b.metricId}${scope}: [${b.min}, ${b.max}] warn=[${b.warnBelow ?? b.min}, ${b.warnAbove ?? b.max}]`);
    }
    return;
  }

  if (subCmd === 'recent') {
    const n = parseInt(subArg ?? '20', 10);
    const events = getBalanceEvents(runtime, { limit: isNaN(n) ? 20 : n });
    console.log(header(`Balance Events (last ${events.length})`));
    for (const e of events) {
      const decisionInfo = e.kind === 'encounter_decision'
        ? `${e.decisionType ? ` decision:${e.decisionType}` : ''}${e.idleReason ? ` idle:${e.idleReason}` : ''}${e.templateId ? ` tmpl:${e.templateId}` : ''}`
        : '';
      console.log(`  ${dim(`#${e.seq} t${e.tick}`)} [${e.kind}] agent:${e.agentId.slice(-8)} src:${e.sourceSystem}${e.result ? ` res:${e.result}` : ''}${e.threatBand ? ` band:${e.threatBand}` : ''}${decisionInfo}`);
    }
    return;
  }

  if (subCmd === 'agent') {
    const id = subArg;
    if (!id) { console.log(`${RED}Usage: balance agent <id>${RESET}`); return; }
    const actors = state.graph.getNodesByType('actor');
    const match =
      actors.find(n => n.id === id) ??
      actors.find(n => n.id.startsWith(id)) ??
      actors.find(n => typeof n.name === 'string' && n.name.toLowerCase().includes(id.toLowerCase()));
    const agentId = match?.id ?? id;
    const agentName = typeof match?.name === 'string' ? match.name : undefined;
    const j = buildBalanceAgentJourneySummary(runtime, agentId, agentName);
    if (!j) {
      console.log(`${YELLOW}No tracked events for agent '${agentId}'. Is the agent tracked?${RESET}`);
      console.log(`  Tracked agents: ${tel.trackedAgentIds.join(', ') || '(none)'}`);
      return;
    }
    const lines = evaluateAgentJourney(j);
    console.log(header('Agent Journey'));
    for (const l of lines) console.log(l);
    return;
  }

  console.log(`${RED}Usage: balance [summary|idle|templates|eval|targets|recent [N]|agent <id>]${RESET}`);
}

function startAutoRun(speed?: number): void {
  if (speed !== undefined && speed > 0) autoRunSpeed = speed;
  stopAutoRun();
  ticksSinceLastSummary = 0;

  const interval = Math.max(50, 1000 / autoRunSpeed);
  console.log(`${GREEN}▶ Running at ${autoRunSpeed} ticks/sec${RESET} (Ctrl+C or type 'pause' to stop)`);

  autoRunTimer = setInterval(() => {
    state = runTick(state, [], runtime);
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
  console.log(`  ${BOLD}genome${RESET} <name>    Inspect settlement genome result (sublocations, NPCs, archetype)`);
  console.log(`  ${BOLD}traces${RESET} [N]       Show last N traces (default 10)`);
  console.log(`  ${BOLD}attention${RESET}        Ascendant attention pool state (alias: attn)`);
  console.log(`  ${BOLD}digest${RESET} [N]       Last N digest buffer entries (default 10)`);
  console.log(`  ${BOLD}tugs${RESET}             Active thread tugs`);
  console.log(`  ${BOLD}storybeats${RESET}       Story beat queue (alias: beats)`);
  console.log(`  ${BOLD}threads${RESET}          Divine thread edges by court position`);
  console.log(`  ${BOLD}balance${RESET}          Balance summary (alias: bal)`);
  console.log(`  ${BOLD}balance idle${RESET}     Idle reasons + subtype starvation hotspots`);
  console.log(`  ${BOLD}balance templates${RESET} Top encounter templates by decision count`);
  console.log(`  ${BOLD}balance eval${RESET}     Evaluate session vs. targets`);
  console.log(`  ${BOLD}balance targets${RESET}  Show target bands`);
  console.log(`  ${BOLD}balance recent${RESET} [N] Show last N balance events`);
  console.log(`  ${BOLD}balance agent${RESET} <id> Show agent journey`);
  console.log(`  ${BOLD}spawn encounter${RESET} <agent|@hero> <templateId>  Spawn an encounter on an agent`);
  console.log(`  ${BOLD}spawn attachment${RESET} <agent|@hero> <templateId> Attach an item/trait to an agent`);
  console.log(`  ${BOLD}seed${RESET}             Print current seed`);
  console.log(`  ${BOLD}eval${RESET} <expr>      Evaluate JS with 'state' in scope`);
  console.log(`  ${BOLD}help${RESET}             This help`);
  console.log(`  ${BOLD}quit${RESET} / ${BOLD}exit${RESET}     Exit`);
}

// ─── Attention Debug Commands ────────────────────────────────────

function printAttention(): void {
  const ascendant = state.ascendantId ? state.graph.getNode(state.ascendantId) : undefined;
  if (!ascendant) {
    console.log(`${RED}No ascendant node found in graph.${RESET}`);
    return;
  }
  const props = ascendant.properties;
  const pool     = (props.attentionPool     as number) ?? ATTENTION_BASE_CAPACITY;
  const capacity = (props.attentionCapacity as number) ?? ATTENTION_BASE_CAPACITY;
  const regen    = (props.attentionRegen    as number) ?? ATTENTION_BASE_REGEN;
  const visualState = getAttentionVisualState({ attentionPool: pool, attentionCapacity: capacity, attentionRegen: regen });
  const pct = capacity > 0 ? ((pool / capacity) * 100).toFixed(0) : '0';

  console.log(header('Attention Pool'));
  console.log(`  Pool:  ${pool.toFixed(2)} / ${capacity.toFixed(2)} (${pct}%)`);
  console.log(`  Regen: ${regen.toFixed(2)}/tick`);
  console.log(`  State: ${visualState}`);
}

function printDigest(n: number = 10): void {
  const buffer = state.digestBuffer ?? [];
  const total = buffer.length;
  const entries = buffer.slice().reverse().slice(0, n);

  console.log(header(`Digest Buffer (last ${entries.length} of ${total} entries)`));
  if (entries.length === 0) {
    console.log(dim('  (empty — no background encounters resolved yet)'));
    return;
  }

  for (const e of entries) {
    const outcome = e.success ? `${GREEN}Success${RESET}` : `${RED}Failed${RESET}`;
    const notable = e.isNotable ? `  ${YELLOW}*NOTABLE*${RESET}` : '';
    const pos = e.isDormantAgent ? 'Dormant' : e.sourceType === 'location' ? 'Location' : 'Agent';
    // Shorten reach to capitalised first letter of domain for compact display
    const reach = e.reachPrimary ? e.reachPrimary.charAt(0).toUpperCase() + e.reachPrimary.slice(1, 4) : '???';
    const capDeltas = Object.entries(e.capabilityChanges ?? {})
      .filter(([, v]) => v !== 0)
      .map(([k, v]) => `${v > 0 ? '+' : ''}${v.toFixed(1)} ${k}`)
      .join(', ');
    const deltaStr = capDeltas ? `  (${capDeltas})` : '';

    console.log(
      `  ${dim(`t${e.tick}`)}  [${reach}/${pos}]  ${BOLD}${e.agentName}${RESET}: ${e.encounterName}. ${outcome}.${deltaStr}${notable}`
    );
  }
}

function printTugs(): void {
  const tugs = state.activeThreadTugs ?? [];
  console.log(header(`Active Thread Tugs (${tugs.length})`));
  if (tugs.length === 0) {
    console.log(dim('  (no active tugs)'));
    return;
  }

  tugs
    .slice()
    .sort((a, b) => b.curationScore - a.curationScore)
    .forEach((tug, i) => {
      const agentNode = state.graph.getNode(tug.agentId);
      const agentName = (agentNode?.name as string) ?? (agentNode?.properties.name as string) ?? tug.agentId.slice(0, 8);
      console.log(
        `  [${i + 1}] Agent: ${BOLD}${agentName}${RESET}` +
        `  | Reach: ${tug.reachPrimary} (${tug.threatLevel})` +
        `  | Expires: t${tug.expiresTick}` +
        `  | Score: ${tug.curationScore.toFixed(2)}` +
        `  | Court: ${tug.courtPosition}`
      );
    });
}

function printStoryBeats(): void {
  const queue = state.storyBeatQueue ?? [];
  console.log(header('Story Beat Queue'));

  // No active beat tracking in GameState yet — note it
  console.log(`  Active: ${dim('(not yet tracked in GameState)')}`);
  console.log(`  Queue (${queue.length}):`);

  if (queue.length === 0) {
    console.log(dim('    (empty)'));
    return;
  }

  queue.forEach((beat, i) => {
    const agentNode = state.graph.getNode(beat.agentId);
    const agentName = (agentNode?.name as string) ?? (agentNode?.properties.name as string) ?? beat.agentId.slice(0, 8);
    console.log(
      `    [${i + 1}] ${YELLOW}${beat.priority}${RESET}` +
      `  | enc:${beat.encounterId.slice(0, 12)}` +
      `  | agent:${agentName}` +
      `  | at (${beat.hexCol},${beat.hexRow})` +
      `  | queued t${beat.queuedTick}`
    );
  });
}

function printThreads(): void {
  if (!state.ascendantId) {
    console.log(`${RED}No ascendant in current game state.${RESET}`);
    return;
  }

  const threadEdges = state.graph.getOutgoingEdges(state.ascendantId, 'thread');
  console.log(header(`Divine Threads (${threadEdges.length})`));

  if (threadEdges.length === 0) {
    console.log(dim('  (no thread edges from ascendant)'));
    return;
  }

  // Group by court position
  const groups: Record<string, Array<{ name: string; location: string }>> = {
    the_first: [],
    retinue:   [],
    watched:   [],
    dormant:   [],
    unset:     [],
  };

  for (const edge of threadEdges) {
    const target = state.graph.getNode(edge.target);
    if (!target) continue;
    const name = (target.name as string) ?? (target.properties.name as string) ?? edge.target.slice(0, 8);

    // Resolve location
    const locEdges = state.graph.getOutgoingEdges(edge.target, 'located_at');
    let location = '???';
    if (locEdges.length > 0) {
      const locNode = state.graph.getNode(locEdges[0].target);
      location = (locNode?.name as string) ?? (locNode?.properties.name as string) ?? locEdges[0].target.slice(0, 8);
    }

    const courtPos = (edge.properties?.courtPosition as string) ?? 'unset';
    const bucket = courtPos in groups ? courtPos : 'unset';
    groups[bucket].push({ name, location });
  }

  const LABELS: Record<string, string> = {
    the_first: 'THE FIRST',
    retinue:   'RETINUE',
    watched:   'WATCHED',
    dormant:   'DORMANT',
    unset:     '(no position)',
  };

  for (const [key, members] of Object.entries(groups)) {
    if (members.length === 0) continue;
    const label = LABELS[key] ?? key.toUpperCase();
    const formatted = members
      .map(m => `${BOLD}${m.name}${RESET} ${dim(`(at ${m.location})`)}`)
      .join(', ');
    console.log(`  ${CYAN}${label.padEnd(12)}${RESET} ${formatted}`);
  }
}

// ─── Spawn Helpers ───────────────────────────────────────────────

const ALL_ATTACHMENT_TEMPLATES: GraphNode[] = [
  ...REWARD_POSSESSIONS, ...REWARD_CONDITIONS, ...REWARD_BESTOWED_POWERS,
  ...STARTER_POSSESSIONS, ...STARTER_CONDITIONS,
];

function handleSpawnAttachment(agentQuery: string, templateQuery: string): void {
  // Resolve @hero
  let resolvedQuery = agentQuery;
  if (agentQuery === '@hero') {
    const heroNode = state.ascendantId ? state.graph.getNode(state.ascendantId) : undefined;
    if (!heroNode) {
      console.log(`${RED}No hero/ascendant found in current game state${RESET}`);
      return;
    }
    resolvedQuery = heroNode.id;
  }

  // Find agent
  const agents = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' || n.properties.actorType === 'ascendant');
  const agent = agents.find(n =>
    n.id === resolvedQuery || n.id.includes(resolvedQuery) ||
    (n.name ?? '').toLowerCase().includes(resolvedQuery.toLowerCase()),
  );
  if (!agent) {
    console.log(`${RED}Agent not found: ${agentQuery}${RESET}`);
    return;
  }

  // Find attachment template by id or partial name match
  const template = ALL_ATTACHMENT_TEMPLATES.find(t =>
    t.id === templateQuery || t.id.includes(templateQuery) ||
    (t.name ?? '').toLowerCase().includes(templateQuery.toLowerCase()),
  );
  if (!template) {
    console.log(`${RED}Attachment template not found: ${templateQuery}${RESET}`);
    console.log(`${dim}Available: ${ALL_ATTACHMENT_TEMPLATES.length} templates. Try a partial id or name.${RESET}`);
    return;
  }

  // Clone the template node into the graph with a unique id
  const instanceId = `${template.id}_${Date.now()}`;
  state.graph.addNode({
    id: instanceId,
    type: template.type,
    name: template.name,
    properties: { ...template.properties },
  });

  // Create the appropriate edge (possesses for artifacts, has_trait for traits)
  const edgeType = template.type === 'artifact' || template.type === 'artifact_legendary'
    ? 'possesses' : 'has_trait';
  state.graph.addEdge({
    id: `edge_${edgeType}_${instanceId}`,
    source: agent.id,
    target: instanceId,
    type: edgeType,
    properties: {},
  });

  const hasEffects = Array.isArray(template.properties.effects) && template.properties.effects.length > 0;
  const effectInfo = hasEffects
    ? ` (${template.properties.effects.length} effects: ${(template.properties.effects as Array<{type: string}>).map(e => e.type).join(', ')})`
    : ' (legacy reachBonus)';

  console.log(`${GREEN}✓${RESET} Attached ${BOLD}${template.name}${RESET} to ${agent.name ?? agent.id} via ${edgeType}${effectInfo}`);
}

function handleSpawnEncounter(agentQuery: string, templateId: string): void {
  // Resolve @hero to the ascendant
  let resolvedQuery = agentQuery;
  if (agentQuery === '@hero') {
    const heroNode = state.ascendantId ? state.graph.getNode(state.ascendantId) : undefined;
    if (!heroNode) {
      console.log(`${RED}No hero/ascendant found in current game state${RESET}`);
      return;
    }
    resolvedQuery = heroNode.id;
  }

  // Find agent by partial name/id match
  const agents = state.graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'individual' || n.properties.actorType === 'ascendant');

  const match = agents.find(a =>
    a.id === resolvedQuery ||
    a.id.includes(resolvedQuery) ||
    (a.properties.name as string ?? '').toLowerCase().includes(resolvedQuery.toLowerCase())
  );

  if (!match) {
    console.log(`${RED}No agent matching "${agentQuery}"${RESET}`);
    return;
  }

  // Find template by exact ID or partial match
  let template = getUnifiedTemplateById(templateId);
  if (!template) {
    // Try partial match
    const lowerQuery = templateId.toLowerCase();
    template = UNIFIED_ACTION_TEMPLATES.find(t =>
      t.id.toLowerCase().includes(lowerQuery) ||
      t.name.toLowerCase().includes(lowerQuery)
    );
  }

  if (!template) {
    console.log(`${RED}No template matching "${templateId}"${RESET}`);
    const encounterTemplates = UNIFIED_ACTION_TEMPLATES
      .filter(t => t.supportBundle !== undefined)
      .map(t => t.id)
      .slice(0, 10);
    if (encounterTemplates.length > 0) {
      console.log(`Encounter templates: ${encounterTemplates.join(', ')}`);
    }
    return;
  }

  // Create the action
  const action = createUnifiedAction({
    actorId: match.id,
    templateId: template.id,
    targetId: match.id,
    scale: template.scale,
    source: 'system',
    tick: state.tick,
    template,
    rng: () => Math.random(),
  });

  // Add to state
  state = {
    ...state,
    unifiedActions: [...state.unifiedActions, action],
  };

  console.log(`${GREEN}✓${RESET} Spawned "${template.name}" on ${match.properties.name ?? match.id}`);
  console.log(`  template: ${template.id}`);
  console.log(`  action:   ${action.actionId}`);
  console.log(`  steps:    ${template.steps.length}`);
  console.log(`  duration: ${action.stepDuration} ticks`);
  console.log(`  Advance with: tick ${action.stepDuration}`);
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
    case 'attention':
    case 'attn':
      printAttention();
      break;
    case 'digest': {
      const n = parseInt(arg, 10);
      printDigest(isNaN(n) ? 10 : n);
      break;
    }
    case 'tugs':
      printTugs();
      break;
    case 'storybeats':
    case 'beats':
      printStoryBeats();
      break;
    case 'threads':
      printThreads();
      break;
    case 'balance':
    case 'bal': {
      // sub-commands: summary (default), idle, templates, eval, targets, recent [N], agent <id>
      const subParts = arg ? arg.split(/\s+/) : [];
      printBalance(subParts[0], subParts[1]);
      break;
    }
    case 'spawn': {
      const subParts = arg.split(/\s+/);
      if (subParts[0] === 'encounter' && subParts.length >= 3) {
        handleSpawnEncounter(subParts[1], subParts.slice(2).join(' '));
      } else if (subParts[0] === 'attachment' && subParts.length >= 3) {
        handleSpawnAttachment(subParts[1], subParts.slice(2).join(' '));
      } else {
        console.log(`${RED}Usage: spawn encounter|attachment <agent|@hero> <templateId>${RESET}`);
      }
      break;
    }
    case 'genome': {
      const locationName = arg;
      const loc = state.graph.getNodesByType('location')
        .find(n => n.name.toLowerCase().includes(locationName.toLowerCase()));
      if (!loc) { console.log(`${RED}No location matching "${locationName}"${RESET}`); break; }
      const genome = loc.properties.genomeResult as any;
      if (!genome) { console.log(`${YELLOW}${loc.name} has no genome result${RESET}`); break; }
      console.log(`\n${BOLD}${loc.name}${RESET} (${loc.properties.locationSubtype})`);
      if (genome.archetypeName) console.log(`  Archetype: ${CYAN}${genome.archetypeName}${RESET}`);
      console.log(`  Sublocations: ${genome.sublocations?.length ?? 0}`);
      for (const sub of (genome.sublocations ?? [])) {
        console.log(`    [${DIM}${sub.sourcePass}${RESET}] ${sub.id} (${(sub.tags ?? []).join(', ')})`);
      }
      console.log(`  NPCs: ${genome.npcs?.length ?? 0}`);
      for (const npc of (genome.npcs ?? [])) {
        console.log(`    [${DIM}${npc.sourcePass}${RESET}] ${npc.role}`);
      }
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
  runtime = createSimulationRuntime();

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

  // Set up balance telemetry: track the default hero (lexicographically first agent)
  const agentIds = agents.map(n => n.id);
  const heroId = selectDefaultTrackedHero(agentIds);
  if (heroId) {
    setTrackedAgents(runtime, [heroId]);
    const heroName = agents.find(n => n.id === heroId)?.name;
    console.log(`${dim(`Balance tracking: ${heroName ?? heroId}`)}`);
  }

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
