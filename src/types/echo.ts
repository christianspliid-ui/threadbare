import type { SphereName } from './index';
import type { ValuePair } from './agent';

// ── Echo Types ──────────────────────────────────────────────────

/**
 * `card` is the fourth preserved thing (THR-887): the nudge card that defined a
 * run, carried into the next one. It is the only echo type not derived from a
 * graph node — see {@link EchoDefinition.originNodeId}.
 */
export const ECHO_TYPES = ['legacy', 'monument', 'relic', 'card'] as const;
export type EchoType = typeof ECHO_TYPES[number];

/** How the echo was selected */
export type EchoSource = 'cosmic' | 'divine';

/** Per-cycle degradation amount */
export const ECHO_DEGRADATION_RATE = 0.15;

/** Degradation level at which an echo fades permanently */
export const ECHO_FADE_THRESHOLD = 0.9;

// ── Injection ───────────────────────────────────────────────────

/** How an echo injects content into the next world */
export type InjectionType =
  | 'cultural_template'
  | 'location_feature'
  | 'quest_seed';

export interface EchoInjection {
  injectionType: InjectionType;
  /** Human-readable description of what this echo seeds */
  description: string;
  /** Sphere weight biases to apply during world generation */
  sphereBiases?: Partial<Record<SphereName, number>>;
  /** Trait tendencies to seed in descendant actors/cultures */
  traitTendencies?: ValuePair[];
}

// ── Echo Definition ─────────────────────────────────────────────

/** The full definition of an echo, created at harvest time */
export interface EchoDefinition {
  id: string;
  echoType: EchoType;
  source: EchoSource;
  /**
   * What this echo is of. A graph node id for every type except `card`, where
   * it holds the **library card id** — a card is not a node, and giving the
   * field a second meaning was the cheaper honesty than a parallel id field
   * that three of four echo types would leave empty.
   */
  originNodeId: string;
  /** Which cycle this echo was created in */
  originCycle: number;
  name: string;
  summary: string;
  sphereAffinities: SphereName[];
  /** 0.0–1.0 how significant the source event/node was */
  significance: number;
  injection: EchoInjection;
  /**
   * Present only on `echoType: 'card'` (THR-887) — the card carried forward and
   * whether a somber age scarred it. Read by `echoCardsFromDefinitions` when
   * dealing the next run's starting repertoire.
   */
  cardEcho?: { cardId: string; scarred: boolean };
}

// ── Echo Runtime State ──────────────────────────────────────────

/** Per-echo state tracked across cycles */
export interface EchoState {
  id: string;
  /** 0.0–1.0 how degraded this echo is */
  degradation: number;
  /** How many cycles this echo has been active */
  cyclesActive: number;
  /** True when degradation >= ECHO_FADE_THRESHOLD */
  faded: boolean;
}

// ── Seeded echoes (THR-1843) ────────────────────────────────────

export type SeededEchoKind = 'monument' | 'legacy' | 'relic';
export type EchoRelation = 'kin' | 'opposed' | 'unrelated';

/** One echo placed in a new world at creation — what `getSeededEchoes()` reports. */
export interface SeededEcho {
  echoId: string;
  kind: SeededEchoKind;
  /** The echo's name as the player reads it (`echoDisplayName`'s input). */
  name: string;
  /** The node the echo became: the monument sublocation, the heir, the relic. */
  nodeId: string;
  /** Where it stands: the monument's host, the heir's settlement, the relic's site. */
  hostId: string;
  /** Monument only. */
  relation?: EchoRelation;
  /** Monument only: the band the host was lifted toward (`null` = a landmark only). */
  targetBand?: 'hostile' | 'foreign' | 'touched' | 'held' | 'sovereign' | null;
  /** The new god's read of the host after the imprint (monument) or the node (relic). */
  band?: 'hostile' | 'foreign' | 'touched' | 'held' | 'sovereign';
  /** Mean lift per echo sphere on the host (monument) or the heir (legacy). */
  imprint?: number;
  capped?: boolean;
}

export type SeededEchoSkipReason = 'over_cap' | 'no_host' | 'no_heir' | 'no_site' | 'faded' | 'no_origin' | 'error';

export interface SeededEchoesSummary {
  seeded: SeededEcho[];
  skipped: Array<{ echoId: string; reason: SeededEchoSkipReason }>;
}
