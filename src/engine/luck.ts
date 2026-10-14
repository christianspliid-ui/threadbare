/**
 * Luck protection for the player's own mortals — the marble bag and the
 * Legendary deadline.
 *
 * Game Design Laws § I, Randomness and luck (`Docs/game-design/laws.md`).
 * Plan: `Docs/plans/2026-10-14-luck-protection-and-tier-first-loot.md`.
 *
 * **Who is protected.** A mortal with a `thread` edge from the player's ascendant
 * (the First, and any later threaded mortal). Rivals' mortals and the background
 * world roll plain dice — nobody watches those rolls, and real swings are the
 * world's texture (Law 4).
 *
 * **The marble bag.** A protected mortal's d100 is dealt from a bag of
 * {@link LUCK_BAG_SLICES} slices of the range, each slice once per bag, in a
 * seeded order, with a seeded position inside the slice. Over every bag the rolls
 * cover the range evenly, so the mortal's luck evens out to the odds it was shown:
 * at steady odds a bag delivers the forecast exactly, and over a run the success
 * rate tracks it. The long losing streaks plain dice allow are cut. Short bad runs
 * stay — answering those is the nudge cards' job (Law 6).
 *
 * **The Legendary deadline (predetermination).** Each Legendary cycle fixes, up
 * front and in secret, the win by which the next Legendary will have arrived.
 * Luck can bring it sooner; the deadline only ends a long drought.
 *
 * **State is two counters and a cycle number on the mortal (Law 8).** The bag's
 * order and the deadline are re-derived from the world seed, the mortal's id and
 * those counts, so nothing shuffled is stored and a save replays exactly. The bag
 * draws on its own named streams (`drawFromTable` / `rollTableUnit`) and never
 * consumes a value from a shared stream — the caller still spends its own d100
 * draw, so every later consumer of that stream sees the same values (NFP #3).
 *
 * Fail-soft (NFP #4): a missing node or malformed state reads as a fresh start;
 * nothing here throws.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { getThreadTo } from './graphQueries';
import { drawFromTable, rollTableUnit } from '../lib/drawTable';
import { emitTrace } from './traceBuffer';
import {
  LUCK_BAG_ENABLED,
  LUCK_BAG_SLICES,
  LEGENDARY_DEADLINE_ENABLED,
  LEGENDARY_DEADLINE_MIN_WINS,
  LEGENDARY_DEADLINE_MAX_WINS,
} from '../data/luck-constants';

/** The node property the luck counters live under. */
export const LUCK_STATE_PROPERTY = 'luck';

/** A protected mortal's luck memory. Every field is a count; see the module header. */
export interface LuckState {
  /** d100 rolls dealt from the bag so far. Bag number = `floor(bagDraws / LUCK_BAG_SLICES)`. */
  readonly bagDraws: number;
  /** Wins since the last Legendary (or since protection began). */
  readonly winsSinceLegendary: number;
  /** Legendaries received while protected — keys each cycle's hidden deadline. */
  readonly legendaryCycle: number;
}

const FRESH_LUCK: LuckState = { bagDraws: 0, winsSinceLegendary: 0, legendaryCycle: 0 };

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

/** Read a node's luck state; anything missing or malformed reads as zero. */
export function readLuckState(node: GraphNode | undefined): LuckState {
  const raw = node?.properties?.[LUCK_STATE_PROPERTY];
  if (!raw || typeof raw !== 'object') return FRESH_LUCK;
  const r = raw as Record<string, unknown>;
  return {
    bagDraws: count(r.bagDraws),
    winsSinceLegendary: count(r.winsSinceLegendary),
    legendaryCycle: count(r.legendaryCycle),
  };
}

function writeLuckState(node: GraphNode, state: LuckState): void {
  node.properties[LUCK_STATE_PROPERTY] = { ...state };
}

/**
 * True when `agentId` is one of the player's own mortals: it carries a `thread`
 * edge whose source is the player's ascendant.
 */
export function isLuckProtected(
  graph: WorldGraph,
  playerAscendantId: string | undefined,
  agentId: string,
): boolean {
  if (!playerAscendantId) return false;
  const thread = getThreadTo(graph, agentId);
  return thread !== undefined && thread.source === playerAscendantId;
}

// ─── The marble bag ────────────────────────────────────────────────────

const SLICE_KEYS: readonly string[] = Array.from(
  { length: LUCK_BAG_SLICES },
  (_, i) => String(i).padStart(2, '0'),
);
const SLICE_WEIGHTS: Readonly<Record<string, number>> = Object.fromEntries(SLICE_KEYS.map(k => [k, 1]));
const SLICE_WIDTH = 100 / LUCK_BAG_SLICES;

/**
 * Which slice of the d100 (0-based) the `drawIndex`-th bag roll lands in. Pure.
 * A bag is one seeded permutation of the slices, drawn without replacement
 * through the shared sampler, so every slice comes up exactly once per bag.
 */
export function luckBagSlice(worldSeed: number, agentId: string, drawIndex: number): number {
  const bag = Math.floor(drawIndex / LUCK_BAG_SLICES);
  const position = drawIndex % LUCK_BAG_SLICES;
  const order = drawFromTable('luck.bag', SLICE_WEIGHTS, `${worldSeed}:${agentId}:${bag}`, LUCK_BAG_SLICES);
  const key = order[position] ?? SLICE_KEYS[position];
  return parseInt(key, 10);
}

/** The `drawIndex`-th d100 (1–100) from an agent's bag. Pure. */
export function luckBagRoll(worldSeed: number, agentId: string, drawIndex: number): number {
  const slice = luckBagSlice(worldSeed, agentId, drawIndex);
  const inSlice = rollTableUnit('luck.bag.position', `${worldSeed}:${agentId}:${drawIndex}`);
  return Math.min(100, Math.floor(slice * SLICE_WIDTH + inSlice * SLICE_WIDTH) + 1);
}

/**
 * Deal the next d100 from a protected mortal's bag and advance its count, or
 * return `undefined` for anyone else (they roll plain dice). Call this only at a
 * live roll — never in a forecast probe — because it advances the bag.
 */
export function drawLuckRoll(
  graph: WorldGraph,
  worldSeed: number,
  playerAscendantId: string | undefined,
  agentId: string,
  tick: number,
): number | undefined {
  if (!LUCK_BAG_ENABLED) return undefined;
  if (!isLuckProtected(graph, playerAscendantId, agentId)) return undefined;
  const node = graph.getNode(agentId);
  if (!node) return undefined;
  const luck = readLuckState(node);
  const roll = luckBagRoll(worldSeed, agentId, luck.bagDraws);
  writeLuckState(node, { ...luck, bagDraws: luck.bagDraws + 1 });
  emitTrace({
    category: 'luck.bag_roll',
    tick,
    agentId,
    summary: `${node.name ?? agentId} rolled ${roll} from luck bag ${Math.floor(luck.bagDraws / LUCK_BAG_SLICES)} (draw ${luck.bagDraws})`,
    drawIndex: luck.bagDraws,
    bag: Math.floor(luck.bagDraws / LUCK_BAG_SLICES),
    roll,
  });
  return roll;
}

// ─── The Legendary deadline ────────────────────────────────────────────

/** The win (1-based, counted from the cycle's start) by which cycle `cycle`'s Legendary arrives. Pure. */
export function legendaryDeadline(worldSeed: number, agentId: string, cycle: number): number {
  const span = Math.max(0, LEGENDARY_DEADLINE_MAX_WINS - LEGENDARY_DEADLINE_MIN_WINS);
  const u = rollTableUnit('luck.legendary_deadline', `${worldSeed}:${agentId}:${cycle}`);
  return LEGENDARY_DEADLINE_MIN_WINS + Math.min(span, Math.floor(u * (span + 1)));
}

/**
 * True when this win must be a Legendary: the recipient is protected and this
 * win reaches its cycle's hidden deadline (or a later win, when earlier ones
 * offered no Legendary to give). Pure — the caller still decides whether the
 * pool holds a Legendary to force.
 */
export function isLegendaryDue(
  graph: WorldGraph,
  worldSeed: number,
  playerAscendantId: string | undefined,
  agentId: string,
): boolean {
  if (!LEGENDARY_DEADLINE_ENABLED) return false;
  if (!isLuckProtected(graph, playerAscendantId, agentId)) return false;
  const luck = readLuckState(graph.getNode(agentId));
  return luck.winsSinceLegendary + 1 >= legendaryDeadline(worldSeed, agentId, luck.legendaryCycle);
}

/**
 * Count one win for a protected recipient. A Legendary — earned or forced —
 * closes the cycle and starts the next one with a fresh hidden deadline.
 */
export function recordLegendaryWin(
  graph: WorldGraph,
  worldSeed: number,
  playerAscendantId: string | undefined,
  agentId: string,
  tierDrawn: number | null,
  forced: boolean,
  tick: number,
): void {
  if (!LEGENDARY_DEADLINE_ENABLED) return;
  if (!isLuckProtected(graph, playerAscendantId, agentId)) return;
  const node = graph.getNode(agentId);
  if (!node) return;
  const luck = readLuckState(node);
  if (tierDrawn === 4) {
    writeLuckState(node, { ...luck, winsSinceLegendary: 0, legendaryCycle: luck.legendaryCycle + 1 });
    emitTrace({
      category: 'luck.legendary_cycle',
      tick,
      agentId,
      summary: `${node.name ?? agentId} received a Legendary after ${luck.winsSinceLegendary + 1} win(s)${forced ? ' — the hidden deadline forced it' : ''}`,
      wins: luck.winsSinceLegendary + 1,
      deadline: legendaryDeadline(worldSeed, agentId, luck.legendaryCycle),
      forced,
      cycle: luck.legendaryCycle,
    });
    return;
  }
  writeLuckState(node, { ...luck, winsSinceLegendary: luck.winsSinceLegendary + 1 });
}
