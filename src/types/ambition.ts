// src/types/ambition.ts
import type { ReachDomain } from './traits';
import type { SphereName } from './index';
import type { AmbitionStrategicProfile } from './strategicAction';
import type { ValuePair } from './agent';

// ─── Ambition Categories ─────────────────────────────────────────
export type AmbitionCategory =
  | 'dominion'
  | 'mastery'
  | 'vengeance'
  | 'legacy'
  | 'survival'
  | 'discovery'
  | 'devotion';

// ─── Graph Conditions (milestone & abandonment checks) ──────────
export type GraphCondition =
  | { type: 'agent_reach_above'; reach: ReachDomain; threshold: number }
  | { type: 'agent_reach_below'; reach: ReachDomain; threshold: number }
  | { type: 'agent_has_bonds'; minCount: number; basis: string }
  | { type: 'agent_controls_location'; locationType: string }
  | { type: 'agent_has_trait'; trait: string }
  | { type: 'agent_lacks_trait'; trait: string }
  /**
   * The pursuing agent is dead (THR-808).
   *
   * Self-referential twin of `target_agent_eliminated`, and the honest shape for the
   * "abandon when the agent dies" beat that content previously wrote as
   * `agent_lacks_trait: 'living'` — aliveness is engine state, not a trait, and no
   * producer has ever minted a `living` trait, so that gate was permanently false.
   */
  | { type: 'agent_deceased' }
  /**
   * The agent has held one position for `minTicks`, counted from the later of its
   * arrival and the evaluation window's start (THR-822).
   *
   * The window is what makes this safe as an abandonment trigger. Passed the pursuing
   * ambition's `assignedTick`, the condition cannot hold before `assignedTick +
   * minTicks` however long the agent had already been sitting still — so "they set out,
   * and then they stopped" is measured rather than assumed. Without a window (or
   * without a clock in the evaluation context) it fails soft to `false`.
   *
   * Residence is *observed*, not written by movement code — see `agentResidence.ts`.
   */
  | { type: 'agent_settled_since'; minTicks: number }
  /**
   * The agent is settled somewhere that is not where it originated, for `minTicks`
   * under the same window rule as `agent_settled_since` (THR-822).
   *
   * "Rooted, and not at home." Distinct from `agent_not_in_region`, which reads a
   * region literal an author has to know in advance; this reads the agent's own
   * first-observed position, so it works for any agent in any world.
   */
  | { type: 'agent_away_from_origin'; minTicks: number }
  | { type: 'target_agent_eliminated'; targetRef: string }
  /**
   * The agent is currently in the region it originated from — or is not (THR-841).
   *
   * The region-relative twins of `agent_away_from_origin`, and the pair authored
   * content actually needs. `agent_in_region` below takes a region *literal*, and no
   * literal can ever match: region ids are minted per world as `region_0…region_N`
   * (`worldSeed.ts`) with names generated from historical-culture ownership, so an
   * author writing `'homeland'` or `'cursed'` names nothing that will ever exist. Both
   * shipped authorings did exactly that and were permanently false.
   *
   * These read the agent's own first-observed position instead, so they work for any
   * agent in any world with nothing for an author to know in advance — the same move
   * THR-822 made for `agent_away_from_origin`, one tier coarser. Where that condition
   * is location-exact and durational ("rooted, and not at home"), these are
   * region-coarse and instantaneous ("back in my own country" / "over the border").
   *
   * Fail-soft to `false` whenever either side is unresolvable — no origin recorded, no
   * current position, or a location whose region the graph cannot resolve. An
   * unresolvable side is "we do not know", never a measured negative, so a milestone
   * cannot self-complete on missing data.
   */
  | { type: 'agent_in_origin_region' }
  | { type: 'agent_not_in_origin_region' }
  /**
   * Region-literal conditions. **Unusable by authored content** — see the block above:
   * region ids are generated per world, so a literal written into a template can never
   * match one. `contentInvariants` pins that no template authors either.
   *
   * They remain for callers holding a region id captured at *runtime* — omen scopes
   * (`{ kind: 'regional'; regionId }`), effect scopes (`{ scope: 'region'; regionId }`)
   * and stealth all carry real ones.
   */
  | { type: 'agent_in_region'; region: string }
  | { type: 'agent_not_in_region'; region: string };

// ─── Milestone ──────────────────────────────────────────────────
export interface Milestone {
  readonly id: string;
  readonly condition: GraphCondition;
  readonly prose: readonly string[];
}

// ─── Completion & Abandonment ───────────────────────────────────
export interface CompletionRule {
  readonly requires: number;
  readonly of: number;
}

export interface AbandonmentTrigger {
  readonly condition: GraphCondition;
  readonly prose: readonly string[];
}

export interface BondModifier {
  readonly bondType: string;
  readonly modifier: number;
}

/**
 * One value-axis lean an ambition template declares (THR-1298).
 *
 * `pole` names which end of the pair the drive belongs to. `virtue` is the pair's
 * first-named pole (the `+1` end in signed storage), `vice` the second.
 */
export interface PoleAffinity {
  readonly valuePair: ValuePair;
  readonly pole: 'virtue' | 'vice';
  /** Relative pull, multiplied by `POLE_AFFINITY_WEIGHT`. */
  readonly weight: number;
}

// ─── Ambition Template ──────────────────────────────────────────
export interface AmbitionTemplate {
  readonly id: string;
  readonly displayName: string;
  readonly category: AmbitionCategory;

  // Filter 1 — Can I?
  readonly reachFloors: Partial<Record<ReachDomain, number>>;
  readonly requiredTraits: readonly string[];
  readonly blockingTraits: readonly string[];

  // Filter 2 — Should I?
  readonly sphereAffinities: readonly SphereName[];
  readonly bondModifiers: readonly BondModifier[];
  readonly boostingTraits: readonly string[];

  // Behavior — biases action selection
  readonly reachAffinity: Partial<Record<ReachDomain, number>>;

  /**
   * Which end of a value axis this drive speaks to (THR-1298).
   *
   * Revenge leans the vice pole of mercy; protection leans the virtue pole. With this,
   * two agents handed the same harm want different things because of who they *are*
   * rather than only what they can do — the reach terms above answer "can I", this
   * answers "is this me".
   *
   * A consequence named in the ruling and embraced: the god's fork-lean drifts these
   * poles, so pressing a mortal toward ruthlessness changes which drive their next
   * wound mints, with no further wiring.
   *
   * Every `valuePair` must be a member of `VALUE_PAIRS` — a schema test pins it, since
   * an unknown pair contributes 0 forever and reads as mistuning rather than a typo.
   */
  readonly poleAffinities?: readonly PoleAffinity[];

  // Progress
  readonly milestones: readonly Milestone[];
  readonly completion: CompletionRule;
  readonly abandonmentTriggers: readonly AbandonmentTrigger[];
  readonly abandonmentCooldown: number;

  // Strategic profile (optional — ambitions without this skip strategic candidate generation)
  readonly strategicProfile?: AmbitionStrategicProfile;

  // Prose
  readonly selectionProse: readonly string[];
  readonly milestoneProse: Record<string, readonly string[]>;
  readonly completionProse: readonly string[];
  readonly abandonmentProse: readonly string[];
}


// ─── Active Ambition (on an agent) ──────────────────────────────
export type AmbitionPriority = 'primary' | 'secondary';
export type AmbitionStatus = 'active' | 'completed' | 'abandoned';

export interface ActiveAmbition {
  readonly templateId: string;
  readonly priority: AmbitionPriority;
  readonly status: AmbitionStatus;
  readonly assignedTick: number;
  readonly completedMilestones: readonly string[];
  readonly resolvedTick?: number;
}

// ─── Edge properties for 'pursues' edge ─────────────────────────
export interface PursuesEdgeProperties {
  readonly priority: AmbitionPriority;
  readonly status: AmbitionStatus;
  readonly assignedTick: number;
  readonly completedMilestones: string[];
  readonly resolvedTick?: number;
  /** Present when the world minted this ambition from an event node (THR-726). */
  readonly mintedByEventId?: string;
  /** Prose stem naming the minting event, for motive-receipt provenance (THR-726). */
  readonly mintedByLabel?: string;

  // ─── Grievance state (THR-1298) ─────────────────────────────────
  //
  // Per-instance, so it lives on the edge rather than the ambition node: ambition nodes
  // are shared per `templateId`, and two agents avenging two different harms pursue the
  // same node. Every field is optional — a drive without them is an ordinary ambition,
  // which is most of them.

  /** `true` marks this drive as a vendetta rather than a want. */
  readonly grievance?: true;
  /** Who the grievance is held against. */
  readonly culpritAgentId?: string;
  /** How badly the founding harm landed, on the `HARM_MAGNITUDE_BY_CLASS` scale. */
  readonly harmMagnitude?: number;
  /** Current heat; decays on the milestone pass and demotes to a grudge when cold. */
  readonly heat?: number;
  /** How far down a revenge chain this sits — capped so chains stay spotlight-only. */
  readonly chainDepth?: number;
}
