// src/engine/orchestrator.ts

/**
 * Game Loop Orchestrator — runs one tick of the simulation.
 *
 * Each tick phase is a pure function: takes GameState pieces in,
 * returns partial updates out. The orchestrator merges updates.
 */
import type { GameState, TickEvent } from '../types/gameState';
import { STEALTH_DECAY_PER_TICK } from '../types/gameState';
import type { SphereName } from '../types/index';
import { SPHERE_NAMES } from '../types/index';
import { advanceDoomClock } from './doomClock';
import {
  computeEssenceGeneration,
  generateEssence,
  computeMaxEssence,
} from './influence';
import { evaluateMandate, advanceMandateStage } from './mandate';
import { recalcVisibility, collectLOSSources } from './visibility';

// ─── Seeded PRNG ──────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── ID Generator ─────────────────────────────────────────────────

let eventCounter = 0;
function nextEventId(): string {
  return `evt_${++eventCounter}`;
}

// Reset for testing
export function resetEventCounter(): void {
  eventCounter = 0;
}

// ─── Phase 1: Advance Doom Clock ──────────────────────────────────

export function phaseDoom(state: GameState): Partial<GameState> {
  const oldStage = state.doomClock.currentStage;
  const newDoom = advanceDoomClock(state.doomClock);
  const newStage = newDoom.currentStage;
  const events: TickEvent[] = [];

  if (newStage > oldStage) {
    const stageName = state.doomDefinition.stages[newStage - 1]?.name ?? `Stage ${newStage}`;
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'doom_escalation',
      message: `The ${state.doomDefinition.archetype} intensifies — ${stageName}`,
      significance: 0.9,
    });
  }

  return { doomClock: newDoom, tickEvents: [...state.tickEvents, ...events] };
}

// ─── Phase 2: Agent Actions (simplified for vertical slice) ───────

export function phaseAgentActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 31);
  const events: TickEvent[] = [];

  // Get all individual actors
  const actors = state.graph.getNodesByType('actor').filter(
    n => n.properties.actorType === 'individual'
  );

  // Each actor has a chance to do something notable per tick
  for (const actor of actors) {
    if (rng() < 0.15) { // 15% chance per tick of a notable action
      const spheres: SphereName[] = [...SPHERE_NAMES];
      const sphere = spheres[Math.floor(rng() * spheres.length)];
      const significance = 0.3 + rng() * 0.5;

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'agent_action_resolved',
        message: `${actor.name} acted in the realm of ${sphere}.`,
        sphere,
        significance,
      });
    }
  }

  return { tickEvents: [...state.tickEvents, ...events] };
}

// ─── Phase 3: Rival Actions (simplified for vertical slice) ───────

export function phaseRivalActions(state: GameState): Partial<GameState> {
  const rng = mulberry32(state.seed + state.tick * 37);
  const events: TickEvent[] = [];
  const newRivalStates = [...state.rivalStates];

  for (let i = 0; i < state.rivalDefinitions.length; i++) {
    const rival = state.rivalDefinitions[i];
    const rivalState = newRivalStates[i];

    // Rivals act every ~10 ticks
    const ticksSince = (rivalState.ticksSinceAction ?? 0) + 1;
    newRivalStates[i] = { ...rivalState, ticksSinceAction: ticksSince };

    if (ticksSince >= 8 + Math.floor(rng() * 5)) {
      newRivalStates[i] = {
        ...newRivalStates[i],
        ticksSinceAction: 0,
        interventionCount: rivalState.interventionCount + 1,
      };

      const actionDesc = rival.behavior === 'aggressive'
        ? `${rival.name} strikes against your influence`
        : rival.behavior === 'subtle'
        ? `${rival.name} whispers doubt among your followers`
        : rival.behavior === 'territorial'
        ? `${rival.name} fortifies their domain`
        : `${rival.name} extends their reach into new territory`;

      events.push({
        id: nextEventId(),
        tick: state.tick,
        type: 'rival_action',
        message: actionDesc,
        significance: 0.7,
      });
    }
  }

  return {
    rivalStates: newRivalStates,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 4: Stealth Decay ───────────────────────────────────────

export function phaseStealth(state: GameState): Partial<GameState> {
  const newExposure = Math.max(0, state.stealthExposure - STEALTH_DECAY_PER_TICK);
  return { stealthExposure: newExposure };
}

// ─── Phase 5: Narrative (assign tier, generate prose) ─────────────

export function phaseNarrative(state: GameState): Partial<GameState> {
  const newChronicleEntries = [...state.chronicleEntries];

  for (const event of state.tickEvents) {
    if (event.significance >= 0.8) {
      newChronicleEntries.push({
        id: event.id,
        tier: 'chronicle',
        title: event.message.slice(0, 50),
        prose: event.message,
        promptContext: {
          actors: [],
          location: '',
          sphere: event.sphere ?? 'force',
          mood: 'dramatic',
        },
        tick: event.tick,
      });
    }
  }

  return { chronicleEntries: newChronicleEntries };
}

// ─── Phase 6: Essence Generation ──────────────────────────────────

export function phaseEssence(state: GameState): Partial<GameState> {
  const ascNode = state.graph.getNode(state.ascendantId);
  if (!ascNode) return {};

  const pool = { ...state.essencePool };
  const max = computeMaxEssence(state.graph, state.ascendantId);
  const gen = computeEssenceGeneration(state.graph, state.ascendantId);
  generateEssence(pool, gen, max);

  const events: TickEvent[] = [];
  const totalGen = SPHERE_NAMES.reduce((s, sp) => s + gen[sp], 0);
  if (state.tick % 10 === 0 && totalGen > 0) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'essence_gain',
      message: `+${totalGen.toFixed(1)} essence flows from the cosmos`,
      significance: 0.1,
    });
  }

  return {
    essencePool: pool,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 7: Mandate Check ───────────────────────────────────────

export function phaseMandate(state: GameState): Partial<GameState> {
  if (!state.mandateState || !state.mandateDefinition || state.mandateState.completed || state.mandateState.failed) {
    return {};
  }

  const evaluated = evaluateMandate(
    state.graph,
    state.mandateDefinition as any,
    state.mandateState,
    state.ascendantId,
    state.tick,
  );

  const advanced = evaluated.progress >= 1.0
    ? advanceMandateStage(evaluated, state.tick)
    : evaluated;

  const events: TickEvent[] = [];

  if (advanced.currentStage !== state.mandateState.currentStage) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Mandate "${state.mandateDefinition.name}" advances to ${advanced.currentStage}`,
      significance: 0.8,
    });
  }

  if (advanced.completed && !state.mandateState.completed) {
    events.push({
      id: nextEventId(),
      tick: state.tick,
      type: 'mandate_progress',
      message: `Victory! Mandate "${state.mandateDefinition.name}" fulfilled!`,
      significance: 1.0,
    });
  }

  return {
    mandateState: advanced,
    tickEvents: [...state.tickEvents, ...events],
  };
}

// ─── Phase 8: Doom Expiry Check ───────────────────────────────────

export function phaseDoomExpiry(state: GameState): Partial<GameState> {
  if (state.doomClock.expired && state.phase === 'playing') {
    return {
      phase: 'twilight' as const,
      tickEvents: [...state.tickEvents, {
        id: nextEventId(),
        tick: state.tick,
        type: 'phase_change',
        message: 'The Unmaking begins. The world trembles.',
        significance: 1.0,
      }],
    };
  }
  return {};
}

// ─── Master Tick ──────────────────────────────────────────────────

export function runTick(state: GameState): GameState {
  // Start with clean tick events
  let s: GameState = { ...state, tick: state.tick + 1, tickEvents: [] };

  // Advance clock
  const newSeason = Math.floor(s.tick / 90) % 4;
  const newYear = Math.floor(s.tick / 360);
  s = { ...s, clock: { ...s.clock, currentTick: s.tick, season: newSeason, year: newYear } };

  // Run phases in order
  s = { ...s, ...phaseDoom(s) };
  s = { ...s, ...phaseAgentActions(s) };
  s = { ...s, ...phaseRivalActions(s) };
  s = { ...s, ...phaseStealth(s) };
  s = { ...s, ...phaseNarrative(s) };
  s = { ...s, ...phaseEssence(s) };
  s = { ...s, ...phaseMandate(s) };
  s = { ...s, ...phaseDoomExpiry(s) };

  // Recalculate visibility
  const losSources = collectLOSSources(s.graph, s.ascendantId, []);
  const gridSize = {
    cols: Math.max(...s.tiles.map(t => t.coord.col)) + 1,
    rows: Math.max(...s.tiles.map(t => t.coord.row)) + 1,
  };
  const visibilityMap = recalcVisibility(s.visibilityMap, losSources, s.graph, s.tick, gridSize.cols, gridSize.rows);
  s = { ...s, visibilityMap };

  // Merge tick events into recent events (ring buffer)
  const MAX = 100;
  const combined = [...s.recentEvents, ...s.tickEvents];
  s = { ...s, recentEvents: combined.slice(-MAX) };

  return s;
}
