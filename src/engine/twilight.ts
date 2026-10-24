/**
 * THR-1381 — the end of the age (plan `Docs/plans/2026-10-17-thr-1381-the-end-of-the-age.md`
 * § Engine pillar E1). Pure: no graph writes, no randomness.
 *
 * The authored/emergent split, stated once: the words live in
 * `src/data/twilight-content.ts`; who and what they name is read here from the run's
 * state — the clock that ended the age, the First and their fate, the sphere the world
 * leaned to, and the god's first harvested echo. Called twice on the same state, every
 * function here returns the same answer (the ceremony builds its beats when it opens,
 * `concludeRun` captures the memories at the harvest; time is stopped in between).
 */
import type { GameState } from '../types/gameState';
import type { DoomClockArchetype } from '../types/doomClock';
import { DOOM_CLOCK_ARCHETYPES } from '../types/doomClock';
import type { MemoryType, ResonanceMemory } from '../types/worldSoul';
import type { SphereName } from '../types/index';
import type { HarvestResult } from './cycleEnd';
import { completeTwilight, computeHarvest } from './cycleEnd';
import { emitTrace } from './traceBuffer';
import { ARCHETYPE_STAGE_NAMES } from '../data/doom-content';
import {
  DOOM_ENDING_FALLBACK_TITLE,
  DOOM_ENDING_LINES,
  MANDATE_FALLBACK_NAME,
  TWILIGHT_GOD_FALLBACK,
  TWILIGHT_WORDS,
} from '../data/twilight-content';
import { echoDisplayName } from '../data/account-content';
import {
  RESONANCE_SIGNIFICANCE_DIVINE,
  RESONANCE_SIGNIFICANCE_DOMINANCE,
  RESONANCE_SIGNIFICANCE_DOOM,
  RESONANCE_SIGNIFICANCE_MANDATE,
  TWILIGHT_MEMORIES_SHOWN,
} from '../data/game-config';
import { getFirstId } from './meetingEncounter';
import { isAspect } from './aspects';
import { readStoredCalling } from './calling';
import { getSpherePoints, rankSpherePoints } from './spherePoints';

export type AgeEnding =
  | { kind: 'mandate'; mandateName: string; title: string; line: string; close: string }
  | { kind: 'doom'; archetype: DoomClockArchetype | null; finalStageName: string; title: string; line?: string; close: string };

export type FirstFate = 'aspect' | 'lived' | 'died';

export interface TwilightFirst {
  id: string;
  name: string;
  fate: FirstFate;
  /** The stored calling label, lower case, when the First has one. */
  calling?: string;
  /** The rendered beat-2 line. */
  line: string;
}

export interface TwilightBeats {
  godName: string;
  ending: AgeEnding;
  first?: TwilightFirst;
  /** This age's memories, in capture order, at most `TWILIGHT_MEMORIES_SHOWN`. */
  memories: ResonanceMemory[];
  /** Fail-soft rows that applied (`twilight.beats_built.fallbacks`). */
  fallbacks: string[];
}

/** The god's name, as every age-end line names it. */
export function godName(state: GameState): string {
  const fromIdentity = state.ascendantIdentity?.divineName?.trim();
  if (fromIdentity) return fromIdentity;
  const node = state.graph.getNode(state.ascendantId);
  return node?.name?.trim() || TWILIGHT_GOD_FALLBACK;
}

function isDoomArchetype(v: unknown): v is DoomClockArchetype {
  return typeof v === 'string' && (DOOM_CLOCK_ARCHETYPES as readonly string[]).includes(v);
}

/** The doom kind's last stage name, or null when its data is missing. */
export function finalStageName(archetype: unknown): string | null {
  if (!isDoomArchetype(archetype)) return null;
  const name = ARCHETYPE_STAGE_NAMES[archetype]?.[4];
  return typeof name === 'string' && name.trim() ? name : null;
}

/** The fulfilled Mandate's name, or the fallback when its definition is missing. */
function mandateName(state: GameState): { name: string; missing: boolean } {
  const name = state.mandateDefinition?.name?.trim();
  return name ? { name, missing: false } : { name: MANDATE_FALLBACK_NAME, missing: true };
}

/** Which clock ended the age (Decided 1, 3). Mandate completed → 'mandate'; otherwise the doom kind. */
export function ageEnding(state: GameState, fallbacks: string[] = []): AgeEnding {
  const god = godName(state);
  if (state.mandateState?.completed) {
    const m = mandateName(state);
    if (m.missing) fallbacks.push('mandate_definition_missing');
    return {
      kind: 'mandate',
      mandateName: m.name,
      title: m.missing ? 'The Mandate, fulfilled' : TWILIGHT_WORDS.mandateTitle(m.name),
      line: TWILIGHT_WORDS.mandateLine(god),
      close: TWILIGHT_WORDS.mandateClose(god),
    };
  }
  const archetype = state.doomDefinition?.archetype;
  const stage = finalStageName(archetype);
  if (stage === null || !isDoomArchetype(archetype)) {
    fallbacks.push('doom_data_missing');
    return {
      kind: 'doom',
      archetype: isDoomArchetype(archetype) ? archetype : null,
      finalStageName: DOOM_ENDING_FALLBACK_TITLE,
      title: DOOM_ENDING_FALLBACK_TITLE,
      close: TWILIGHT_WORDS.doomClose(god),
    };
  }
  return {
    kind: 'doom',
    archetype,
    finalStageName: stage,
    title: stage,
    line: DOOM_ENDING_LINES[archetype],
    close: TWILIGHT_WORDS.doomClose(god),
  };
}

/**
 * The First the god remembers after a death swept its `thread` edge
 * (`markMortalDead` writes it on the god's node). Null when nothing was noted.
 */
function rememberedFirst(state: GameState): { id: string; name: string } | null {
  const raw = state.graph.getNode(state.ascendantId)?.properties?.firstRemembered as { id?: unknown; name?: unknown } | undefined;
  return raw && typeof raw.id === 'string' ? { id: raw.id, name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Your First' } : null;
}

/** The First and their fate (Decided 4), or undefined when no First was bonded. */
export function firstFate(state: GameState): TwilightFirst | undefined {
  const graph = state.graph;
  const id = getFirstId(graph, state.ascendantId);
  if (!id || !graph.getNode(id)) {
    // The thread is gone: a death swept it. An Aspect stays an Aspect (its echo keeps
    // `aspect_of`); anyone else died before the age ended.
    const remembered = rememberedFirst(state);
    if (!remembered) return undefined;
    const fate: FirstFate = graph.getNode(remembered.id) && isAspect(graph, remembered.id) ? 'aspect' : 'died';
    return {
      id: remembered.id,
      name: remembered.name,
      fate,
      line: fate === 'aspect' ? TWILIGHT_WORDS.firstAspect(remembered.name) : TWILIGHT_WORDS.firstDied(remembered.name),
    };
  }
  const node = graph.getNode(id)!;
  const name = node.name?.trim() || 'Your First';
  const fate: FirstFate = isAspect(graph, id)
    ? 'aspect'
    : node.properties?.deceased === true ? 'died' : 'lived';
  const callingTitle = readStoredCalling(node)?.title?.trim();
  const calling = callingTitle ? callingTitle.toLowerCase() : undefined;
  const line = fate === 'aspect'
    ? TWILIGHT_WORDS.firstAspect(name)
    : fate === 'died'
    ? TWILIGHT_WORDS.firstDied(name)
    : TWILIGHT_WORDS.firstLived(name, calling);
  return { id, name, fate, ...(calling ? { calling } : {}), line };
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/** The god's bought primary and secondary, the spheres a Mandate ending carries. */
function godSpheres(state: GameState): SphereName[] {
  try {
    return rankSpherePoints(getSpherePoints(state.graph.getNode(state.ascendantId)?.properties)).slice(0, 2);
  } catch {
    return [];
  }
}

function memory(cycle: number, memoryType: MemoryType, spheres: SphereName[], summary: string, significance: number): ResonanceMemory {
  return { id: `mem-${cycle}-${memoryType}`, cycleOrigin: cycle, memoryType, spheres, summary, significance, degradation: 0 };
}

/**
 * Up to three memories of this age, by rule (Decided 5), in a fixed order: the ending
 * (always), the sphere the world leaned to (when the aggregate names one), the god's
 * mark (its first harvested echo, when there is one). `summary` is stored rendered —
 * the next world has no graph to fill a template from.
 */
export function captureAgeMemories(state: GameState, harvest: HarvestResult, cycle: number): ResonanceMemory[] {
  const god = godName(state);
  const out: ResonanceMemory[] = [];

  const ending = ageEnding(state);
  if (ending.kind === 'mandate') {
    out.push(memory(cycle, 'mandate_triumph', godSpheres(state),
      TWILIGHT_WORDS.memoryMandateTriumph(god, ending.mandateName), RESONANCE_SIGNIFICANCE_MANDATE));
  } else {
    out.push(memory(cycle, 'doom_scar', [],
      TWILIGHT_WORDS.memoryDoomScar(ending.finalStageName, god), RESONANCE_SIGNIFICANCE_DOOM));
  }

  const dominant = state.worldSoul?.aggregate?.dominantSphere;
  if (dominant) {
    out.push(memory(cycle, 'sphere_dominance', [dominant],
      TWILIGHT_WORDS.memorySphereDominance(god, capitalize(dominant)), RESONANCE_SIGNIFICANCE_DOMINANCE));
  }

  const mark = harvest.divineEchoes?.[0];
  if (mark) {
    out.push(memory(cycle, 'divine_intervention', [...(mark.sphereAffinities ?? [])],
      TWILIGHT_WORDS.memoryDivine(god, mark.echoType, echoDisplayName(mark)), RESONANCE_SIGNIFICANCE_DIVINE));
  }

  return out;
}

/** Why each memory was captured — `resonance.memory_captured.reason`. */
export function memoryCaptureReason(m: ResonanceMemory): string {
  switch (m.memoryType) {
    case 'mandate_triumph': return 'the Mandate was fulfilled';
    case 'doom_scar': return 'doom ended the age';
    case 'sphere_dominance': return `the world leaned most to ${m.spheres[0] ?? 'a sphere'}`;
    case 'divine_intervention': return "the god's first harvested echo";
    default: return m.memoryType;
  }
}

/** Everything the ceremony shows (§ UI pillar). */
export function buildTwilightBeats(state: GameState, harvest: HarvestResult, cycle: number): TwilightBeats {
  const fallbacks: string[] = [];
  const ending = ageEnding(state, fallbacks);
  const first = firstFate(state);
  const memories = captureAgeMemories(state, harvest, cycle).slice(0, TWILIGHT_MEMORIES_SHOWN);
  return {
    godName: godName(state),
    ending,
    ...(first ? { first } : {}),
    memories,
    fallbacks,
  };
}

export type TwilightOpen =
  | { ok: true; beats: TwilightBeats }
  | { ok: false; state: GameState };

/**
 * Open the ceremony for a state in `'twilight'`: build the beats once and trace them, or —
 * when building throws — complete the Twilight at once so the harvest still opens
 * (fail-soft table, `twilight.fallback { cause: 'beats_threw' }`). `build` is a seam for
 * that test; production passes nothing.
 */
export function openTwilight(
  state: GameState,
  build: (s: GameState) => TwilightBeats = s => buildTwilightBeats(s, computeHarvest(s), s.cycle),
): TwilightOpen {
  try {
    const beats = build(state);
    emitTrace({
      tick: state.tick,
      category: 'twilight.beats_built',
      ending: beats.ending.kind,
      firstFate: beats.first?.fate ?? 'none',
      memoryTypes: beats.memories.map(m => m.memoryType),
      ...(beats.fallbacks.length > 0 ? { fallbacks: [...beats.fallbacks] } : {}),
      summary: `twilight: "${beats.ending.title}" — First ${beats.first?.fate ?? 'none'}, ${beats.memories.length} memories`,
    });
    return { ok: true, beats };
  } catch {
    return { ok: false, state: failTwilight(state, 'beats_threw') };
  }
}

/** The ceremony could not show: trace why and complete the Twilight, so the harvest opens. */
export function failTwilight(state: GameState, cause: 'beats_threw' | 'mount_failed'): GameState {
  emitTrace({
    tick: state.tick,
    category: 'twilight.fallback',
    cause,
    summary: `twilight.fallback: ${cause} — the age goes straight to the harvest`,
  });
  return completeTwilight(state);
}
