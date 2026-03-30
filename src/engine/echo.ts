import type { GraphNode, NodeType } from '../types/graph';
import type { SphereName } from '../types/index';
import type {
  EchoType,
  EchoSource,
  EchoDefinition,
  EchoState,
  EchoInjection,
  InjectionType,
} from '../types/echo';
import { ECHO_DEGRADATION_RATE, ECHO_FADE_THRESHOLD } from '../types/echo';

// ── Significance scoring ────────────────────────────────────────

/** Node type weight — actors are slightly more significant than locations/artifacts */
const NODE_TYPE_WEIGHT: Partial<Record<NodeType, number>> = {
  actor: 1.0,
  location: 0.85,
  artifact: 0.95,
  trait: 0.5,
};

/** Compute a 0–1 significance score for a graph node based on its connectivity
 *  and event participation. Uses a sigmoid-like formula. */
export function computeSignificanceScore(
  edgeCount: number,
  eventCount: number,
  nodeType: NodeType | string
): number {
  const typeWeight = NODE_TYPE_WEIGHT[nodeType as NodeType] ?? 0.5;
  const raw = (edgeCount * 0.4 + eventCount * 0.6) * typeWeight;
  const normalized = 2 / (1 + Math.exp(-raw / 5)) - 1;
  return Math.max(0, Math.min(1, normalized));
}

// ── Cosmic echo selection ───────────────────────────────────────

export interface EchoCandidate {
  nodeId: string;
  score: number;
}

/** Select top N candidates by significance score, sorted descending */
export function selectCosmicEchoes(
  candidates: EchoCandidate[],
  count: number
): EchoCandidate[] {
  return [...candidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// ── Echo building ───────────────────────────────────────────────

/** Map node type to echo type */
function nodeTypeToEchoType(nodeType: NodeType | string): EchoType {
  switch (nodeType) {
    case 'actor': return 'legacy';
    case 'location': return 'monument';
    case 'artifact': return 'relic';
    default: return 'legacy';
  }
}

/** Map echo type to injection type */
function echoTypeToInjectionType(echoType: EchoType): InjectionType {
  switch (echoType) {
    case 'legacy': return 'cultural_template';
    case 'monument': return 'location_feature';
    case 'relic': return 'quest_seed';
  }
}

/** Build an EchoDefinition from a graph node */
export function buildEchoDefinition(
  echoId: string,
  node: GraphNode,
  source: EchoSource,
  originCycle: number,
  significance: number,
  sphereAffinities: SphereName[]
): EchoDefinition {
  const echoType = nodeTypeToEchoType(node.type);
  const injectionType = echoTypeToInjectionType(echoType);

  const sphereBiases: Partial<Record<SphereName, number>> = {};
  for (const s of sphereAffinities) {
    sphereBiases[s] = 0.03 + significance * 0.02;
  }

  const injection: EchoInjection = {
    injectionType,
    description: `Seeds ${injectionType.replace('_', ' ')} from ${node.name} (cycle ${originCycle}).`,
    sphereBiases,
  };

  return {
    id: echoId,
    echoType,
    source,
    originNodeId: node.id,
    originCycle,
    name: node.name,
    summary: `Echo of ${node.name} from cycle ${originCycle}.`,
    sphereAffinities,
    significance,
    injection,
  };
}

/** Create a fresh EchoState */
export function createEchoState(echoId: string): EchoState {
  return {
    id: echoId,
    degradation: 0,
    cyclesActive: 0,
    faded: false,
  };
}

// ── Echo degradation ────────────────────────────────────────────

/** Degrade a single echo by one cycle step */
export function degradeEcho(state: EchoState): EchoState {
  const newDegradation = Math.min(1.0, state.degradation + ECHO_DEGRADATION_RATE);
  return {
    ...state,
    degradation: newDegradation,
    cyclesActive: state.cyclesActive + 1,
    faded: newDegradation >= ECHO_FADE_THRESHOLD,
  };
}

/** Degrade all echo states by one cycle */
export function degradeAllEchoes(states: EchoState[]): EchoState[] {
  return states.map(degradeEcho);
}

/** Check if an echo has faded */
export function isEchoFaded(state: EchoState): boolean {
  return state.degradation >= ECHO_FADE_THRESHOLD;
}

/** Remove faded echoes from the list */
export function pruneEchoes(states: EchoState[]): EchoState[] {
  return states.filter(s => !s.faded);
}

// ── Injection collection ────────────────────────────────────────

export interface ActiveInjection {
  echoId: string;
  injection: EchoInjection;
  /** Injection strength: 1.0 - degradation (how much influence this echo has) */
  strength: number;
}

/** Collect injection hooks from all active (non-faded) echoes. */
export function collectInjections(
  definitions: EchoDefinition[],
  states: EchoState[]
): ActiveInjection[] {
  const stateMap = new Map(states.map(s => [s.id, s]));
  const result: ActiveInjection[] = [];

  for (const def of definitions) {
    const state = stateMap.get(def.id);
    if (!state || state.faded) continue;
    result.push({
      echoId: def.id,
      injection: def.injection,
      strength: 1.0 - state.degradation,
    });
  }

  return result;
}
