/**
 * The Packet Dice — the batch authoring packet's four dice and its roller. THR-1245.
 *
 * Director ruling (Christian, chat, 2026-08-25): the factory should hand an
 * authoring agent *a set of rolled values plus the guidance to use them*, so
 * nobody has to learn every table and roll by hand per slot. The spec's
 * enforcement-tier table (`nudge-authoring-spec.md` § The Seed Dice) already
 * names **reach / setting / structure** as capped axes with batch-brief variance
 * rows — but nothing rolled them. These dice are that missing half, plus the
 * system-target die the encounter catalogs' maturity tiers imply.
 *
 * **What rolls where.** One slot of a batch packet is:
 *
 *   - reach            — rolled here (flat, capped), or overridden per slot;
 *   - plot hooks       — `drawPlotHooks` (THR-1147), advisory;
 *   - the 5 Seed Dice  — `rollSeedDice` (THR-1224), capped, with the batch's
 *                        exclusion sets passed through so caps hold by
 *                        construction rather than by a reviewer's eyeball;
 *   - decision shape   — rolled here from the spec's 7-shape structure catalog;
 *   - setting class    — rolled here, **gap-weighted against the live corpus**;
 *   - system target    — rolled here, maturity-gated per the encounter catalogs;
 *   - consequence hand — `drawConsequenceHand` (THR-1145, binding) when the
 *                        slot's planned template id is known; pending otherwise,
 *                        because that draw is seeded by the *template id* and
 *                        the gate recomputes it from the id — a packet that
 *                        rolled it off anything else would hand the author a
 *                        hand `check:encounter` then rejects.
 *
 * **Caps hold by construction.** Per axis, a face that earlier slots have
 * already rolled to its cap is excluded from later slots' tables (same
 * eligible-pool mechanics as zero-weighting — see `drawFromTable`). The scale
 * floor works the same way in reverse: when the final slot arrives and no slot
 * has rolled settlement-or-larger, the sub-settlement faces are excluded. An
 * unconstrained slot draws bit-identically to the single-slot commands, which
 * is what keeps this from being a second sampler that drifts (the drawTable
 * module's own warning).
 *
 * **Enforcement tier: capped, not binding** — same as the Seed Dice. The rolls
 * land on the brief; a slot may override one with a stated reason; nothing
 * recomputes a finished encounter against them. The one binding member of the
 * packet is the consequence hand, whose discipline is unchanged from THR-1145.
 *
 * **Pure and authoring-time.** No graph, no fs, no runtime. Nothing under
 * `src/engine/**` imports it, exactly as with the rest of `content-eval/`.
 * Corpus-dependent weights (the setting gap weighting) take the corpus as an
 * *input* so the module stays pure — the CLI computes the census and passes it.
 */

import { REACH_DOMAINS, type ReachDomain } from '../../types/traits';
import type { RarityTier } from '../../types/rarity';
import { SETTING_CLASSES, type SettingClass } from '../settingClasses';
import { drawFromTable } from './drawTable';
import { drawPlotHooks, PLOT_HOOK_DRAW_COUNT, type PlotHook } from './plotHooks';
import {
  SEED_DICE_BATCH_BOUNDS,
  rollSeedDice,
  type SeedDiceExclusions,
  type SeedDiceRoll,
  type StakeShape,
  type OppositionId,
  type Disposition,
  type AgentRoleId,
  type ScaleId,
} from './seedDice';
import { drawConsequenceHand, type ConsequenceFamily } from './consequenceDraw';

// ─── Table ids (independent seeds per die) ───────────────────────────

export const PACKET_REACH_TABLE_ID = 'packet_reach';
export const PACKET_SHAPE_TABLE_ID = 'packet_decision_shape';
export const PACKET_SETTING_TABLE_ID = 'packet_setting_class';
export const PACKET_SYSTEM_TABLE_ID = 'packet_system_target';

// ─── Constants (NFP #1 — every magic number is named) ────────────────

/** Batch size the factory reviews at (ruling 1, THR-1047). */
export const PACKET_DEFAULT_SLOTS = 6;

/**
 * Slot count past which caps provably exhaust their tables (reach: 8 faces ×
 * cap 2 = 16; shape: 7 × 2 = 14 — the binding one). Above it the roller still
 * rolls (fail-soft, NFP #4) but reports the exhaustion as a violation instead
 * of pretending the caps held.
 */
export const PACKET_MAX_CAPPED_SLOTS = 12;

/** Rarity assumed for a slot whose template does not exist yet. */
export const PACKET_DEFAULT_RARITY: RarityTier = 1;

/**
 * Per-batch caps for the packet's own dice, mirroring the batch brief's
 * variance rows ("no reach more than twice across 6"). The Seed Dice's caps
 * live in {@link SEED_DICE_BATCH_BOUNDS}; these are the four axes that had
 * variance rows but no dice until THR-1245.
 */
export const PACKET_DICE_BATCH_BOUNDS = {
  /** At most this many slots in a batch may share a reach. */
  reachCap: 2,
  /** At most this many slots in a batch may share a decision shape. */
  decisionShapeCap: 2,
  /** At most this many slots in a batch may share a setting class. */
  settingClassCap: 2,
  /** At most this many slots in a batch may share a system target. */
  systemCap: 2,
  /**
   * At most this many slots in a batch may target a *middling*-tier system in
   * total — the encounter catalogs' own rule ("use sparingly, one per batch at
   * most"), enforced across the tier rather than per face.
   */
  middlingSystemTotalCap: 1,
} as const;

/**
 * Setting gap weighting: `base + emphasis / (1 + coverage)`.
 *
 * An uncovered class (stronghold, at the time of writing) rolls at weight 6;
 * a class with five shipped templates sits near 1.8. The floor is deliberately
 * non-zero on the same law as every other table here: any class can surface in
 * any batch — the weighting corrects the corpus's skew, it does not build a
 * quota system. Corpus-dependence is the same property the plot-hook table
 * already has via `usedBy` damping: the roll is deterministic in
 * (seed, corpus), and shifts as encounters ship, which is the point.
 */
export const SETTING_GAP_BASE_WEIGHT = 1;
export const SETTING_GAP_EMPHASIS = 5;

/** Weight of a mature-tier system face. */
export const SYSTEM_MATURE_WEIGHT = 4;
/** Weight of a middling-tier system face ("use sparingly"). */
export const SYSTEM_MIDDLING_WEIGHT = 1;
/** Weight of a deferred-tier system face — ineligible, and visibly so. */
export const SYSTEM_DEFERRED_WEIGHT = 0;

// ─── The decision-shape die (the spec's 7-shape structure catalog) ───

export type DecisionShapeId =
  | 'single_test'
  | 'test_and_consequence'
  | 'puzzle_investigation_resolution'
  | 'danger_confrontation_aftermath'
  | 'personality_fork'
  | 'opt_in_complication'
  | 'seeded_sequel';

export interface DecisionShapeFace {
  readonly id: DecisionShapeId;
  readonly label: string;
  /** The spec table's step-structure contract, verbatim in spirit. */
  readonly steps: string;
  /** When this shape is the right one — the guidance the packet hands over. */
  readonly useWhen: string;
}

/**
 * The shape catalog, transcribed from `nudge-authoring-spec.md` § the shape
 * catalog. Where the two disagree, the spec is the contract and this table is
 * the bug — same rule the Seed Dice module states for its own faces. Extending
 * the catalog is a design-session decision with Christian, never an edit here
 * alone.
 */
export const DECISION_SHAPE_FACES: readonly DecisionShapeFace[] = [
  {
    id: 'single_test',
    label: 'Single Test',
    steps: '1 step',
    useWhen: 'One complication, one skill answers it. The smallest honest encounter.',
  },
  {
    id: 'test_and_consequence',
    label: 'Test & Consequence',
    steps: '2 steps, carryover',
    useWhen: 'The second step inherits how the first went (read the water → cross the river).',
  },
  {
    id: 'puzzle_investigation_resolution',
    label: 'Puzzle – Investigation – Resolution',
    steps: '2–3 steps',
    useWhen:
      'Information is the prize: an Eye-type gate reveals the clues (behind the test, '
      + 'never front-loaded in the opening), and the resolution step uses — or must do '
      + 'without — what was found.',
  },
  {
    id: 'danger_confrontation_aftermath',
    label: 'Danger – Confrontation – Aftermath',
    steps: '2–3 steps',
    useWhen:
      'A threat announces itself, then arrives. The watch, then the rush; the reading, '
      + 'then the meeting.',
  },
  {
    id: 'personality_fork',
    label: 'Personality Fork',
    steps: '1 step + branch',
    useWhen:
      'The mortal makes a choice: a test, then an agent-decided branch on a value axis '
      + '(THR-894), pole-specific continuations.',
  },
  {
    id: 'opt_in_complication',
    label: 'Opt-in Complication',
    steps: 'gate + shape',
    useWhen:
      'The agent can decline: waiting/walking away is a cheap, legible exit (a delay, a '
      + 'toll), and engaging opens one of the other shapes. The engage/decline gate is '
      + 'itself agent-decided (personality).',
  },
  {
    id: 'seeded_sequel',
    label: 'Seeded Sequel',
    steps: 'parent + authored follow-up(s)',
    useWhen:
      'A specific outcome plants a designed future encounter (`encounter_seed`: '
      + 'templateId + delayTicks + inheritContext). The sequel is authored WITH the '
      + 'parent — a seed naming an unbuilt template is the THR-844 rot — and is where '
      + 'earned history legitimately appears in prose.',
  },
];

// ─── The system-target die (the encounter catalogs' §7, maturity-gated) ──

export type SystemTargetId =
  | 'movement'
  | 'cards'
  | 'traits'
  | 'conditions'
  | 'items'
  | 'forks'
  | 'carryover'
  | 'omens'
  | 'favors'
  | 'groups'
  | 'economy'
  | 'war'
  | 'factions'
  | 'agent_magic';

export type SystemMaturityTier = 'mature' | 'middling' | 'deferred';

export interface SystemTargetFace {
  readonly id: SystemTargetId;
  readonly label: string;
  readonly tier: SystemMaturityTier;
  /** What targeting this system means for the author — the catalogs' own line. */
  readonly guidance: string;
}

/**
 * `Docs/canon/encounter-catalogs.md` §7 transcribed. Tier moves only by
 * design-session decision as systems mature — never by an authoring session,
 * and never by an edit here alone. Deferred faces stay in the table at weight
 * {@link SYSTEM_DEFERRED_WEIGHT} so the exclusion is visible rather than the
 * vocabulary quietly shrinking (the THR-844 rot class in reverse).
 */
export const SYSTEM_TARGET_FACES: readonly SystemTargetFace[] = [
  {
    id: 'movement',
    label: 'movement',
    tier: 'mature',
    guidance: 'Journeys, delays, passage; the tick/move economy.',
  },
  {
    id: 'cards',
    label: 'cards',
    tier: 'mature',
    guidance: 'The nudge hand itself — riders, cost channels, pips.',
  },
  {
    id: 'traits',
    label: 'traits',
    tier: 'mature',
    guidance: 'Gates, variants, trait-only cards; Core continua.',
  },
  {
    id: 'conditions',
    label: 'conditions',
    tier: 'mature',
    guidance: 'Apply/lift (exhausted, wounded, …); Balm targets.',
  },
  {
    id: 'items',
    label: 'items',
    tier: 'mature',
    guidance: 'Attachments held, gained, lost; item stat contributions.',
  },
  {
    id: 'forks',
    label: 'forks',
    tier: 'mature',
    guidance: 'Agent-decided branches (THR-894; N-route pending THR-898).',
  },
  {
    id: 'carryover',
    label: 'carryover',
    tier: 'mature',
    guidance: 'Step-to-step consequence (THR-892).',
  },
  {
    id: 'omens',
    label: 'omens',
    tier: 'middling',
    guidance: 'Emission + draw bias (path live, few emitters). Sparingly — one per batch.',
  },
  {
    id: 'favors',
    label: 'favors',
    tier: 'middling',
    guidance:
      'Favor edges consumed (`requiresFavor`) or minted. Sparingly — one per batch.',
  },
  {
    id: 'groups',
    label: 'groups',
    tier: 'middling',
    guidance: 'Travel companies, Fellowship cards (`requiresGroup`). Sparingly — one per batch.',
  },
  {
    id: 'economy',
    label: 'economy',
    tier: 'deferred',
    guidance: 'Trade, scarcity, prices — system immature; flavor only, never mechanics.',
  },
  {
    id: 'war',
    label: 'war',
    tier: 'deferred',
    guidance: 'Armies, sieges, borders as mechanics — story side immature.',
  },
  {
    id: 'factions',
    label: 'factions',
    tier: 'deferred',
    guidance: 'Standing, rank, faction plots — immature; `standing` stakes wait too.',
  },
  {
    id: 'agent_magic',
    label: 'agent-magic',
    tier: 'deferred',
    guidance: 'Mortal spellcraft as mechanics — immature; arcane as scene flavor is fine.',
  },
];

// ─── Setting gap weighting ───────────────────────────────────────────

/** The corpus-census input: shipped templates per setting class. */
export type SettingCoverage = Readonly<Record<SettingClass, number>>;

/** Minimal template view the census needs, so callers pass the live catalog directly. */
export interface SettingsDeclaringTemplate {
  readonly settings?: readonly string[];
}

/** Count shipped templates per setting class — the gap the setting die leans against. */
export function settingCoverageFromTemplates(
  templates: readonly SettingsDeclaringTemplate[],
): SettingCoverage {
  const coverage = Object.fromEntries(SETTING_CLASSES.map(cls => [cls, 0])) as Record<
    SettingClass,
    number
  >;
  for (const template of templates) {
    for (const cls of SETTING_CLASSES) {
      if (template.settings?.includes(cls)) coverage[cls] += 1;
    }
  }
  return coverage;
}

/** The gap-weighting formula, named so a test can pin its monotonicity. */
export function settingClassWeight(coverageCount: number): number {
  return SETTING_GAP_BASE_WEIGHT + SETTING_GAP_EMPHASIS / (1 + Math.max(0, coverageCount));
}

// ─── The packet ──────────────────────────────────────────────────────

export interface SlotConsequence {
  readonly templateId: string;
  readonly rarityTier: RarityTier;
  /** Binding — recomputed by `check:encounter` from the template id (THR-1145). */
  readonly hand: readonly ConsequenceFamily[];
}

export interface SlotPacket {
  /** 1-based, matching the brief's `slot N:` blocks. */
  readonly slot: number;
  /** The seed every roll in this slot recomputes from. */
  readonly slotSeed: string;
  readonly reach: ReachDomain;
  /** True when the reach came from the caller rather than the die. */
  readonly reachOverridden: boolean;
  /** Advisory offers — take one or blend two, record the roll (THR-1147). */
  readonly hooks: readonly PlotHook[];
  /** The five Seed Dice (THR-1224), cap-constrained by earlier slots. */
  readonly seedDice: SeedDiceRoll;
  readonly decisionShape: DecisionShapeFace;
  readonly settingClass: SettingClass;
  /** The weight the setting die held for the rolled class, for the printout. */
  readonly settingWeight: number;
  readonly systemTarget: SystemTargetFace;
  /** Present only when the caller supplied this slot's planned template id. */
  readonly consequence?: SlotConsequence;
}

export interface BatchPacketSpread {
  readonly reach: Readonly<Partial<Record<ReachDomain, number>>>;
  readonly stake: Readonly<Partial<Record<StakeShape, number>>>;
  readonly opposition: Readonly<Partial<Record<OppositionId, number>>>;
  readonly disposition: Readonly<Partial<Record<Disposition, number>>>;
  readonly agentRole: Readonly<Partial<Record<AgentRoleId, number>>>;
  readonly scale: Readonly<Partial<Record<ScaleId, number>>>;
  readonly decisionShape: Readonly<Partial<Record<DecisionShapeId, number>>>;
  readonly settingClass: Readonly<Partial<Record<SettingClass, number>>>;
  readonly systemTarget: Readonly<Partial<Record<SystemTargetId, number>>>;
  /** Hook ids offered to more than one slot — advisory, worth a glance. */
  readonly hooksOfferedTwice: readonly string[];
}

export interface BatchPacket {
  readonly briefSlug: string;
  readonly slots: readonly SlotPacket[];
  readonly spread: BatchPacketSpread;
  /**
   * Cap/floor breaches in the finished batch. Empty by construction for a
   * fully-rolled batch within {@link PACKET_MAX_CAPPED_SLOTS}; a human override
   * or an oversized batch can populate it, and the printout leads with it.
   */
  readonly violations: readonly string[];
}

export interface BatchPacketInput {
  readonly briefSlug: string;
  /** Slot count. Defaults to {@link PACKET_DEFAULT_SLOTS}. */
  readonly slots?: number;
  /**
   * Per-slot reach overrides ("slot 3 must be iron"). `undefined` entries roll.
   * Overrides count toward the reach cap for *later* slots but are never
   * themselves re-rolled — a human call outranks the die, and a cap the human
   * broke is reported rather than silently fixed.
   */
  readonly reaches?: readonly (ReachDomain | undefined)[];
  /**
   * Per-slot planned template ids. Where present, the binding consequence hand
   * is rolled and included; where absent, the slot's packet says how to roll it
   * once the id exists.
   */
  readonly templateIds?: readonly (string | undefined)[];
  /** Rarity for consequence hand sizing, per slot. Defaults to {@link PACKET_DEFAULT_RARITY}. */
  readonly rarities?: readonly (RarityTier | undefined)[];
  /** Live-corpus census for the setting die. Pass `settingCoverageFromTemplates(...)`. */
  readonly settingCoverage: SettingCoverage;
  /** Hook offers per slot. Defaults to {@link PLOT_HOOK_DRAW_COUNT}. */
  readonly hookCount?: number;
}

/** The seed one slot's rolls recompute from. Exported so tests can pin it. */
export function packetSlotSeed(briefSlug: string, slot: number): string {
  return `${briefSlug}:slot-${slot}`;
}

function tally<K extends string>(counts: Partial<Record<K, number>>, key: K): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function cappedSet<K extends string>(
  counts: Readonly<Partial<Record<K, number>>>,
  cap: number,
): ReadonlySet<K> {
  return new Set(
    (Object.keys(counts) as K[]).filter(key => (counts[key] ?? 0) >= cap),
  );
}

/**
 * Roll one face from a weighted table with capped faces excluded, falling back
 * to the unconstrained table if exclusion empties it (fail-soft, NFP #4 — the
 * violation report is the honest surface for that case, not a crash).
 */
function rollCapped<K extends string>(
  tableId: string,
  weights: Readonly<Record<K, number>>,
  seedKey: string,
  excluded: ReadonlySet<K>,
): K {
  const constrained: Partial<Record<K, number>> = {};
  for (const key of Object.keys(weights) as K[]) {
    if (!excluded.has(key)) constrained[key] = weights[key];
  }
  const eligible = Object.values(constrained).some(weight => (weight as number) > 0);
  const [drawn] = drawFromTable(tableId, eligible ? constrained : weights, seedKey, 1);
  return drawn ?? (Object.keys(weights) as K[])[0];
}

/**
 * Roll the whole batch. Pure, deterministic in (input, corpus census), and
 * cap-enforcing by construction: each slot's tables exclude the faces earlier
 * slots have already rolled to their cap, and the scale floor is forced on the
 * last slot if still unmet.
 *
 * Slots are rolled in order and each slot's exclusions depend only on earlier
 * slots — with one exception: the scale floor fires on the *last* slot, so the
 * final slot of a batch is a function of the batch size. A brief that grows
 * from 4 slots to 6 keeps slots 1–3 byte-identical; slot 4 keeps its roll
 * unless it was the floor-forced last slot of the smaller batch.
 */
export function rollBatchPacket(input: BatchPacketInput): BatchPacket {
  const slotCount = input.slots ?? PACKET_DEFAULT_SLOTS;
  const hookCount = input.hookCount ?? PLOT_HOOK_DRAW_COUNT;
  const violations: string[] = [];

  if (slotCount > PACKET_MAX_CAPPED_SLOTS) {
    violations.push(
      `batch of ${slotCount} slots exceeds ${PACKET_MAX_CAPPED_SLOTS} — the caps `
        + 'provably exhaust their tables, so later slots roll unconstrained',
    );
  }

  const reachCounts: Partial<Record<ReachDomain, number>> = {};
  const stakeCounts: Partial<Record<StakeShape, number>> = {};
  const oppositionCounts: Partial<Record<OppositionId, number>> = {};
  const dispositionCounts: Partial<Record<Disposition, number>> = {};
  const agentRoleCounts: Partial<Record<AgentRoleId, number>> = {};
  const scaleCounts: Partial<Record<ScaleId, number>> = {};
  const shapeCounts: Partial<Record<DecisionShapeId, number>> = {};
  const settingCounts: Partial<Record<SettingClass, number>> = {};
  const systemCounts: Partial<Record<SystemTargetId, number>> = {};
  const hookOffers = new Map<string, number>();
  let middlingSystemsRolled = 0;
  let settlementOrLargerRolled = 0;

  const reachWeights = Object.fromEntries(REACH_DOMAINS.map(reach => [reach, 1])) as Record<
    ReachDomain,
    number
  >;
  const shapeWeights = Object.fromEntries(
    DECISION_SHAPE_FACES.map(face => [face.id, 1]),
  ) as Record<DecisionShapeId, number>;
  const settingWeights = Object.fromEntries(
    SETTING_CLASSES.map(cls => [cls, settingClassWeight(input.settingCoverage[cls] ?? 0)]),
  ) as Record<SettingClass, number>;
  const systemWeights = Object.fromEntries(
    SYSTEM_TARGET_FACES.map(face => [
      face.id,
      face.tier === 'mature'
        ? SYSTEM_MATURE_WEIGHT
        : face.tier === 'middling'
          ? SYSTEM_MIDDLING_WEIGHT
          : SYSTEM_DEFERRED_WEIGHT,
    ]),
  ) as Record<SystemTargetId, number>;

  const slots: SlotPacket[] = [];

  for (let index = 0; index < slotCount; index++) {
    const slot = index + 1;
    const slotSeed = packetSlotSeed(input.briefSlug, slot);

    // ── Reach ────────────────────────────────────────────────────────
    const override = input.reaches?.[index];
    const reach =
      override
      ?? rollCapped(
        PACKET_REACH_TABLE_ID,
        reachWeights,
        slotSeed,
        cappedSet(reachCounts, PACKET_DICE_BATCH_BOUNDS.reachCap),
      );
    tally(reachCounts, reach);

    // ── Hooks (advisory) ─────────────────────────────────────────────
    const hooks = drawPlotHooks({ briefSeed: slotSeed, reach, count: hookCount });
    for (const hook of hooks) hookOffers.set(hook.id, (hookOffers.get(hook.id) ?? 0) + 1);

    // ── The five Seed Dice, cap-constrained ──────────────────────────
    const lastChanceForScaleFloor =
      slot === slotCount
      && settlementOrLargerRolled < SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor;
    const exclusions: SeedDiceExclusions = {
      stake: cappedSet(stakeCounts, SEED_DICE_BATCH_BOUNDS.stakeCap),
      opposition: cappedSet(oppositionCounts, SEED_DICE_BATCH_BOUNDS.oppositionCap),
      disposition:
        (dispositionCounts.hostile ?? 0) >= SEED_DICE_BATCH_BOUNDS.hostileCap
          ? new Set<Disposition>(['hostile'])
          : new Set<Disposition>(),
      agentRole: cappedSet(agentRoleCounts, SEED_DICE_BATCH_BOUNDS.agentRoleCap),
      scale: lastChanceForScaleFloor
        ? new Set<ScaleId>(['personal', 'company'])
        : new Set<ScaleId>(),
    };
    const seedDice = rollSeedDice(
      { briefSeed: slotSeed, themes: [...new Set(hooks.flatMap(hook => hook.themes))] },
      exclusions,
    );
    tally(stakeCounts, seedDice.stake.id);
    tally(oppositionCounts, seedDice.opposition.id);
    if (seedDice.disposition !== undefined) tally(dispositionCounts, seedDice.disposition);
    tally(agentRoleCounts, seedDice.agentRole.id);
    tally(scaleCounts, seedDice.scale);
    if (seedDice.scale === 'settlement' || seedDice.scale === 'region') {
      settlementOrLargerRolled += 1;
    }

    // ── Decision shape ───────────────────────────────────────────────
    const shapeId = rollCapped(
      PACKET_SHAPE_TABLE_ID,
      shapeWeights,
      slotSeed,
      cappedSet(shapeCounts, PACKET_DICE_BATCH_BOUNDS.decisionShapeCap),
    );
    tally(shapeCounts, shapeId);
    const decisionShape =
      DECISION_SHAPE_FACES.find(face => face.id === shapeId) ?? DECISION_SHAPE_FACES[0];

    // ── Setting class (gap-weighted) ─────────────────────────────────
    const settingClass = rollCapped(
      PACKET_SETTING_TABLE_ID,
      settingWeights,
      slotSeed,
      cappedSet(settingCounts, PACKET_DICE_BATCH_BOUNDS.settingClassCap),
    );
    tally(settingCounts, settingClass);

    // ── System target (maturity-gated) ───────────────────────────────
    const middlingExhausted =
      middlingSystemsRolled >= PACKET_DICE_BATCH_BOUNDS.middlingSystemTotalCap;
    const systemExcluded = new Set<SystemTargetId>([
      ...cappedSet(systemCounts, PACKET_DICE_BATCH_BOUNDS.systemCap),
      ...(middlingExhausted
        ? SYSTEM_TARGET_FACES.filter(face => face.tier === 'middling').map(face => face.id)
        : []),
    ]);
    const systemId = rollCapped(
      PACKET_SYSTEM_TABLE_ID,
      systemWeights,
      slotSeed,
      systemExcluded,
    );
    tally(systemCounts, systemId);
    const systemTarget =
      SYSTEM_TARGET_FACES.find(face => face.id === systemId) ?? SYSTEM_TARGET_FACES[0];
    if (systemTarget.tier === 'middling') middlingSystemsRolled += 1;

    // ── Consequence hand (binding; only when the id is real) ─────────
    const templateId = input.templateIds?.[index];
    const rarityTier = input.rarities?.[index] ?? PACKET_DEFAULT_RARITY;
    const consequence: SlotConsequence | undefined = templateId
      ? { templateId, rarityTier, hand: drawConsequenceHand({ templateId, reach, rarityTier }) }
      : undefined;

    slots.push({
      slot,
      slotSeed,
      reach,
      reachOverridden: override !== undefined,
      hooks,
      seedDice,
      decisionShape,
      settingClass,
      settingWeight: settingWeights[settingClass],
      systemTarget,
      consequence,
    });
  }

  // ── Self-check: report any cap/floor the finished batch breaches ────
  const capChecks: readonly [string, Readonly<Record<string, number | undefined>>, number][] = [
    ['reach', reachCounts as Record<string, number | undefined>, PACKET_DICE_BATCH_BOUNDS.reachCap],
    ['stake', stakeCounts as Record<string, number | undefined>, SEED_DICE_BATCH_BOUNDS.stakeCap],
    ['opposition', oppositionCounts as Record<string, number | undefined>, SEED_DICE_BATCH_BOUNDS.oppositionCap],
    ['agent role', agentRoleCounts as Record<string, number | undefined>, SEED_DICE_BATCH_BOUNDS.agentRoleCap],
    ['decision shape', shapeCounts as Record<string, number | undefined>, PACKET_DICE_BATCH_BOUNDS.decisionShapeCap],
    ['setting class', settingCounts as Record<string, number | undefined>, PACKET_DICE_BATCH_BOUNDS.settingClassCap],
    ['system target', systemCounts as Record<string, number | undefined>, PACKET_DICE_BATCH_BOUNDS.systemCap],
  ];
  for (const [axis, counts, cap] of capChecks) {
    for (const [face, count] of Object.entries(counts)) {
      if ((count ?? 0) > cap) {
        violations.push(`${axis} '${face}' appears ${count}× — cap is ${cap}`);
      }
    }
  }
  if ((dispositionCounts.hostile ?? 0) > SEED_DICE_BATCH_BOUNDS.hostileCap) {
    violations.push(
      `disposition 'hostile' appears ${dispositionCounts.hostile}× — cap is `
        + `${SEED_DICE_BATCH_BOUNDS.hostileCap}`,
    );
  }
  if (
    slotCount >= SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor
    && settlementOrLargerRolled < SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor
  ) {
    violations.push(
      `only ${settlementOrLargerRolled} slot(s) rolled settlement-or-larger — floor is `
        + `${SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor}`,
    );
  }
  if (middlingSystemsRolled > PACKET_DICE_BATCH_BOUNDS.middlingSystemTotalCap) {
    violations.push(
      `${middlingSystemsRolled} slots target middling-tier systems — cap is `
        + `${PACKET_DICE_BATCH_BOUNDS.middlingSystemTotalCap} across the batch`,
    );
  }

  return {
    briefSlug: input.briefSlug,
    slots,
    spread: {
      reach: reachCounts,
      stake: stakeCounts,
      opposition: oppositionCounts,
      disposition: dispositionCounts,
      agentRole: agentRoleCounts,
      scale: scaleCounts,
      decisionShape: shapeCounts,
      settingClass: settingCounts,
      systemTarget: systemCounts,
      hooksOfferedTwice: [...hookOffers.entries()]
        .filter(([, count]) => count > 1)
        .map(([id]) => id),
    },
    violations,
  };
}

// ─── Catalog health ──────────────────────────────────────────────────

/**
 * Problems with the packet dice themselves — face counts drifted from their
 * source documents, duplicate ids, empty guidance, a deferred face that grew a
 * weight. Same rot class the Seed Dice health check names: a table quietly
 * losing a face still rolls and silently makes one option unreachable forever.
 */
export function packetDiceCatalogViolations(): readonly string[] {
  const problems: string[] = [];

  if (DECISION_SHAPE_FACES.length !== 7) {
    problems.push(
      `decision-shape die has ${DECISION_SHAPE_FACES.length} faces, the spec's shape catalog has 7`,
    );
  }
  const shapeIds = new Set<string>();
  for (const face of DECISION_SHAPE_FACES) {
    if (shapeIds.has(face.id)) problems.push(`duplicate decision-shape face '${face.id}'`);
    shapeIds.add(face.id);
    if (!face.useWhen.trim()) problems.push(`decision shape '${face.id}' has no guidance`);
    if (!face.steps.trim()) problems.push(`decision shape '${face.id}' names no step structure`);
  }

  if (SYSTEM_TARGET_FACES.length !== 14) {
    problems.push(
      `system-target die has ${SYSTEM_TARGET_FACES.length} faces, the catalogs' §7 has 14`,
    );
  }
  const tierCounts: Record<SystemMaturityTier, number> = { mature: 0, middling: 0, deferred: 0 };
  const systemIds = new Set<string>();
  for (const face of SYSTEM_TARGET_FACES) {
    if (systemIds.has(face.id)) problems.push(`duplicate system-target face '${face.id}'`);
    systemIds.add(face.id);
    tierCounts[face.tier] += 1;
    if (!face.guidance.trim()) problems.push(`system target '${face.id}' has no guidance`);
  }
  if (tierCounts.mature !== 7) problems.push(`${tierCounts.mature} mature systems, catalogs say 7`);
  if (tierCounts.middling !== 3) {
    problems.push(`${tierCounts.middling} middling systems, catalogs say 3`);
  }
  if (tierCounts.deferred !== 4) {
    problems.push(`${tierCounts.deferred} deferred systems, catalogs say 4`);
  }
  if (SYSTEM_DEFERRED_WEIGHT !== 0) {
    problems.push('deferred systems must stay at weight 0 — tier moves are design decisions');
  }

  if (settingClassWeight(0) <= settingClassWeight(1)) {
    problems.push('setting gap weighting is not monotone — an uncovered class must roll likelier');
  }

  return problems;
}
