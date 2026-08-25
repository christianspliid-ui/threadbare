/**
 * The Packet Draw — one roll for a whole batch of encounter slots. THR-1245.
 *
 * Director ruling (Christian, chat, 2026-08-25), after an investigation of the
 * factory's rolled tables: *"just build it all directly."*
 *
 * Contract for the existing rolls:
 * `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`
 * § *The Plot-Hook Draw*, § *The Seed Dice*, § *The Consequence Draw*; for the
 * four new dice, `Docs/canon/encounter-catalogs.md` §§ 1, 2, 7 and the spec's
 * shape catalog. Where this file and those disagree, they are the contract and
 * this file is the bug.
 *
 * ─── What this is for ────────────────────────────────────────────────
 * The factory grew its tables one at a time, each with its own command and its
 * own seed discipline, and the cost landed on the author: to brief a batch of
 * six you had to know five tables existed, roll each by hand, and then eyeball
 * whether the six slots together honoured caps that were written down in three
 * different documents and enforced by nobody. The predictable outcome is the
 * one the tables exist to prevent — the axes nobody rolled converge.
 *
 * So this rolls the packet. One command, N slots, every axis, plus the four
 * axes the spec's enforcement-tier table already listed as *capped* while
 * nothing anywhere rolled them: **reach, decision shape, setting class, and the
 * system the encounter exercises.**
 *
 * ─── Caps are enforced by construction, not by retry ─────────────────
 * A cap-hit face is removed from later slots' tables. That is the whole
 * mechanism, and it is chosen over the obvious alternative — roll the batch,
 * check the spread, re-roll if it busts — for two reasons. Re-rolling makes the
 * packet a function of how many attempts it took, which is not recomputable
 * from the brief slug (NFP #3); and it can loop forever on a batch whose caps
 * are unsatisfiable, where exclusion simply runs the table dry and reports it.
 *
 * The floors are the same idea pointed the other way: when the only remaining
 * slots are exactly as many as the floor still needs, the faces that would miss
 * it are excluded instead. A floor enforced at the last chance costs the batch
 * one roll of freedom; a floor enforced at slot 1 would cost it all of them.
 *
 * ─── Tier discipline is unchanged ────────────────────────────────────
 * Nothing here promotes an axis. The consequence hand stays **binding** (the
 * gate recomputes it), the dice stay **capped** (the brief records the spread),
 * the hooks stay **advisory** (recorded, never checked). No template field is
 * added and nothing recomputes a finished encounter against a rolled shape,
 * setting or system — doing so would make an advisory axis binding by the back
 * door, which is the failure {@link ../../..//Docs/canon/encounter-catalogs.md}
 * § Coverage defers on purpose.
 *
 * ─── Pure and authoring-time ─────────────────────────────────────────
 * No graph, no fs, no runtime, no clock. The corpus counts the setting die is
 * gap-weighted against are an **input**, so this module stays free of the
 * template corpus and the caller (`scripts/draw-packet.ts`) owns the read.
 * Nothing under `src/engine/**` or `src/components/**` may import it.
 */

import type { ReachDomain } from '../../types/traits';
import { REACH_DOMAINS } from '../../types/traits';
import type { RarityTier } from '../../types/rarity';
import { SETTING_CLASSES, type SettingClass } from '../settingClasses';
import { drawFromTable } from './drawTable';
import {
  drawConsequenceHand,
  type ConsequenceFamily,
} from './consequenceDraw';
import {
  PLOT_HOOK_DRAW_COUNT,
  drawPlotHooks,
  plotHookCatalogViolations,
  type PlotHook,
} from './plotHooks';
import {
  SCALE_FACES,
  SEED_DICE_BATCH_BOUNDS,
  rollSeedDice,
  seedDiceCatalogViolations,
  type AgentRoleId,
  type Disposition,
  type OppositionId,
  type ScaleId,
  type SeedDiceExclusions,
  type SeedDiceRoll,
  type StakeShape,
} from './seedDice';

// ─── Table ids (independent seeds per die) ───────────────────────────

export const REACH_TABLE_ID = 'packet_dice_reach';
export const DECISION_SHAPE_TABLE_ID = 'packet_dice_decision_shape';
export const SETTING_CLASS_TABLE_ID = 'packet_dice_setting_class';
export const SYSTEM_TARGET_TABLE_ID = 'packet_dice_system_target';

// ─── Constants (NFP #1) ──────────────────────────────────────────────

/**
 * Slots in a batch when `--slots` is not given.
 *
 * Six, because that is the batch size the pipeline's brief format and batch
 * report are both written around.
 */
export const PACKET_DEFAULT_SLOTS = 6;

/** Hard ceiling on slots, so a fat-fingered `--slots 600` is refused, not run. */
export const PACKET_MAX_SLOTS = 24;

/**
 * Per-batch caps for the four new dice.
 *
 * Two rather than one on the first three: a cap of one would make a six-slot
 * batch a near-exhaustive sweep of an eight-face table, which is variance
 * imposed rather than variance encouraged, and it leaves no room for the
 * deliberate pairing — two `urban` scenes that answer each other — that a good
 * batch sometimes wants. Two is the same number the Seed Dice already use, and
 * matching them is worth more than tuning each axis separately.
 */
export const PACKET_BATCH_BOUNDS = {
  /** At most this many slots in a batch may share a reach. */
  reachCap: 2,
  /** At most this many slots in a batch may share a decision shape. */
  decisionShapeCap: 2,
  /** At most this many slots in a batch may share a setting class. */
  settingClassCap: 2,
  /**
   * At most this many slots in a batch may target a *middling*-maturity system,
   * counted across the whole tier rather than per system.
   *
   * Per `Docs/canon/encounter-catalogs.md` § 7: "Middling — use sparingly, one
   * per batch at most". The tier-wide reading is the one the catalog's own
   * sentence carries, and it is the stricter of the two, which is the right way
   * to resolve an ambiguity about a system that is not ready to be load-bearing.
   */
  middlingSystemCap: 1,
} as const;

/** Weight of a setting class the corpus already covers most densely. */
export const SETTING_BASE_WEIGHT = 1;

/**
 * Extra weight a completely uncovered setting class carries.
 *
 * Six-to-one against the densest class, tapering linearly with coverage. Big
 * enough that `stronghold` — zero hooks and, at time of writing, the thinnest
 * column of the THR-884 coverage matrix — actually surfaces in a six-slot
 * batch; small enough that a covered class is still reachable, because a die
 * that only ever rolls the gap is a quota with extra steps, and the corpus
 * needs second scenes in good settings as much as first scenes in empty ones.
 */
export const SETTING_GAP_BONUS_WEIGHT = 5;

/** Relative weight per maturity tier for the system-target die. */
export const SYSTEM_MATURITY_WEIGHTS = {
  /** The traveling-agent core — target freely. */
  mature: 6,
  /** Live but unproven; the batch cap does the limiting, the weight only damps. */
  middling: 2,
  /**
   * Zero, which `drawFromTable` treats as absent from the table entirely.
   *
   * Not a small number: "do not build encounters on these yet" is a statement
   * that the face should be unreachable, and a weight of 1 would surface a
   * deferred system roughly once every few batches — rarely enough that nobody
   * would notice the rule had quietly stopped holding.
   */
  deferred: 0,
} as const satisfies Record<SystemMaturity, number>;

/** Rarity tier assumed for a slot's consequence hand when the id is new. */
export const PACKET_DEFAULT_RARITY_TIER: RarityTier = 2;

// ─── Die A — reach, 8 faces · batch cap ≤2 ───────────────────────────
//
// The reach is the one axis a briefing author has always chosen by hand, and
// the corpus records what that produces: the THR-884 matrix has whole reaches
// sitting at one or two drawable templates while `iron` and `heart` carry the
// bulk. Rolling it costs nothing and `--reaches` still overrides, so a batch
// deliberately aimed at a starving column is one flag away.

export const REACH_FACES: readonly ReachDomain[] = REACH_DOMAINS;

// ─── Die B — decision shape, 7 faces · batch cap ≤2 ──────────────────

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
  /** Label as the spec's shape catalog prints it. */
  readonly label: string;
  /** Step count, as the catalog's `Steps` column states it. */
  readonly steps: string;
  /** The catalog's `Use when` line, so the roll arrives with its own guidance. */
  readonly useWhen: string;
}

/**
 * The spec's shape catalog, transcribed. Closed by design.
 *
 * The die exists because the catalog was closed and still nobody rolled on it:
 * picking the structure by hand at design time is exactly where the spec says
 * "structure quality leaks", and an author under time pressure picks Single
 * Test. Extending this list is a design-session decision with Christian, never
 * an authoring-session judgement — same rule as the catalog it copies.
 */
export const DECISION_SHAPE_FACES: readonly DecisionShapeFace[] = [
  {
    id: 'single_test',
    label: 'Single Test',
    steps: '1',
    useWhen: 'One complication, one skill answers it. The smallest honest encounter.',
  },
  {
    id: 'test_and_consequence',
    label: 'Test & Consequence',
    steps: '2, carryover',
    useWhen: 'The second step inherits how the first went (read the water → cross the river).',
  },
  {
    id: 'puzzle_investigation_resolution',
    label: 'Puzzle – Investigation – Resolution',
    steps: '2–3',
    useWhen:
      'Information is the prize: an Eye-type gate reveals the clues behind the test, and the '
      + 'resolution step uses — or must do without — what was found.',
  },
  {
    id: 'danger_confrontation_aftermath',
    label: 'Danger – Confrontation – Aftermath',
    steps: '2–3',
    useWhen: 'A threat announces itself, then arrives. The watch, then the rush.',
  },
  {
    id: 'personality_fork',
    label: 'Personality Fork',
    steps: '1 + branch',
    useWhen:
      'The mortal makes a choice: a test, then an agent-decided branch on a value axis '
      + '(THR-894), pole-specific continuations.',
  },
  {
    id: 'opt_in_complication',
    label: 'Opt-in Complication',
    steps: 'gate + shape',
    useWhen:
      'The agent can decline: walking away is a cheap, legible exit (a delay, a toll), and '
      + 'engaging opens one of the shapes above.',
  },
  {
    id: 'seeded_sequel',
    label: 'Seeded Sequel',
    steps: 'parent + authored follow-up(s)',
    useWhen:
      'A specific outcome plants a designed future encounter (`encounter_seed`), authored '
      + 'alongside the parent — the sanctioned home for earned history.',
  },
];

// ─── Die C — setting class, 8 faces · batch cap ≤2, gap-weighted ─────

/**
 * Weights for the setting die, biased toward what the corpus has least of.
 *
 * `corpusCounts` is how many drawable templates each class already carries —
 * the THR-884 matrix's row totals. Absent or empty, every class is flat, which
 * is the honest reading of "we do not know the coverage" and keeps the module
 * usable without the corpus (NFP #4).
 *
 * Linear in coverage rather than inverse: `1/count` gives an uncovered class an
 * unbounded weight and makes the second-thinnest class indistinguishable from
 * the densest, which reads as a bug the first time a batch rolls `stronghold`
 * five times out of six.
 */
export function settingClassWeights(
  corpusCounts?: Readonly<Partial<Record<SettingClass, number>>>,
): Record<SettingClass, number> {
  const counts = SETTING_CLASSES.map(cls => Math.max(0, corpusCounts?.[cls] ?? 0));
  const densest = Math.max(...counts, 0);

  const weights = {} as Record<SettingClass, number>;
  SETTING_CLASSES.forEach((cls, index) => {
    // densest === 0 means no coverage data at all — every class is equally
    // uncovered, so every class gets the full bonus and the die is flat.
    const coverage = densest === 0 ? 0 : counts[index] / densest;
    weights[cls] = SETTING_BASE_WEIGHT + SETTING_GAP_BONUS_WEIGHT * (1 - coverage);
  });
  return weights;
}

// ─── Die D — system target, 14 faces · maturity-gated ────────────────

export type SystemMaturity = 'mature' | 'middling' | 'deferred';

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
  | 'agent-magic';

export interface SystemTargetFace {
  readonly id: SystemTargetId;
  readonly maturity: SystemMaturity;
  /** The catalog's own gloss for the entry. */
  readonly note: string;
}

/**
 * `Docs/canon/encounter-catalogs.md` § 7, transcribed with its maturity tiers.
 *
 * The deferred tier is carried here rather than deleted precisely so the die
 * can weight it to zero *and say so*: a vocabulary that silently omits four
 * entries cannot tell an author "not yet" — it can only look like a 10-face
 * table, which is how a deferred system quietly becomes an unknown one.
 */
export const SYSTEM_TARGET_FACES: readonly SystemTargetFace[] = [
  { id: 'movement', maturity: 'mature', note: 'journeys, delays, passage; the tick/move economy' },
  { id: 'cards', maturity: 'mature', note: 'the nudge hand itself (riders, cost channels, pips)' },
  { id: 'traits', maturity: 'mature', note: 'gates, variants, trait-only cards; Core continua' },
  {
    id: 'conditions',
    maturity: 'mature',
    note: 'apply/lift (exhausted, wounded, …); Balm targets',
  },
  {
    id: 'items',
    maturity: 'mature',
    note: 'attachments held, gained, lost; item stat contributions',
  },
  { id: 'forks', maturity: 'mature', note: 'agent-decided branches (THR-894)' },
  { id: 'carryover', maturity: 'mature', note: 'step-to-step consequence (THR-892)' },
  { id: 'omens', maturity: 'middling', note: 'emission + draw bias (path live, few emitters)' },
  {
    id: 'favors',
    maturity: 'middling',
    note: 'favor edges consumed (`requiresFavor`) or minted',
  },
  { id: 'groups', maturity: 'middling', note: 'travel companies, Fellowship cards' },
  { id: 'economy', maturity: 'deferred', note: 'trade, scarcity, prices — system immature' },
  { id: 'war', maturity: 'deferred', note: 'armies, sieges, borders — story side immature' },
  { id: 'factions', maturity: 'deferred', note: 'standing, rank, faction plots — immature' },
  {
    id: 'agent-magic',
    maturity: 'deferred',
    note: 'mortal spellcraft as mechanics — immature (arcane as scene flavor is fine)',
  },
];

/** The system faces a batch may actually draw — the deferred tier is weightless. */
export const TARGETABLE_SYSTEM_FACES: readonly SystemTargetFace[] = SYSTEM_TARGET_FACES.filter(
  face => SYSTEM_MATURITY_WEIGHTS[face.maturity] > 0,
);

// ─── The packet ──────────────────────────────────────────────────────

/**
 * A cap or floor that changed what a slot rolled.
 *
 * Recorded rather than applied silently, because the packet's whole claim is
 * that it is recomputable from the brief slug: an author who re-rolls the seed
 * dice for slot 4 by hand and gets a different opposition needs to be able to
 * see *why* without reading this file (NFP #2).
 */
export interface PacketCorrection {
  /** Which die was corrected, in the name the brief block prints. */
  readonly axis:
    | 'reach'
    | 'decisionShape'
    | 'settingClass'
    | 'systemTarget'
    | 'p3Shape'
    | 'opposition'
    | 'disposition'
    | 'agentRole'
    | 'scale';
  /** What the unconstrained table rolled. */
  readonly rolled: string;
  /** What the batch-constrained table rolled instead. */
  readonly replacedWith: string;
  /** Human-readable cause — the cap or floor that bit. */
  readonly reason: string;
}

export interface PacketSlot {
  /** 1-based, as the brief block numbers them. */
  readonly index: number;
  /** The seed this slot's dice were rolled off — recomputable by hand. */
  readonly slotSeed: string;
  /** The template id when `--ids` supplied one; the slot is unnamed otherwise. */
  readonly templateId: string | undefined;
  readonly reach: ReachDomain;
  readonly hooks: readonly PlotHook[];
  readonly seedDice: SeedDiceRoll;
  readonly decisionShape: DecisionShapeFace;
  readonly settingClass: SettingClass;
  readonly systemTarget: SystemTargetFace;
  /**
   * The binding consequence hand, present only when the slot has a template id.
   *
   * Absent otherwise on purpose: the hand is seeded by the *template* id per
   * THR-1145, so a hand drawn for a slot that has no id yet would be re-drawn —
   * differently — the moment the encounter was named, and an author who had
   * already written to the first hand would fail `check:encounter` for reasons
   * this command handed them.
   */
  readonly consequenceHand: readonly ConsequenceFamily[] | undefined;
  readonly corrections: readonly PacketCorrection[];
}

export interface PacketInput {
  /** The brief slug. Every roll in the packet derives from this and nothing else. */
  readonly briefSlug: string;
  /** Slots to roll. Defaults to {@link PACKET_DEFAULT_SLOTS}; clamped to the max. */
  readonly slots?: number;
  /**
   * Reaches to use instead of rolling, assigned to slots in order and cycled.
   *
   * The override is the escape hatch for a batch aimed at a specific gap — the
   * spread table still prints, and a supplied list that busts the reach cap is
   * reported rather than silently reduced, because an explicit instruction
   * beats a cap the author did not ask for.
   */
  readonly reaches?: readonly ReachDomain[];
  /** Template ids, assigned to slots in order. Shorter lists leave later slots unnamed. */
  readonly ids?: readonly string[];
  /** Hooks offered per slot. Defaults to {@link PLOT_HOOK_DRAW_COUNT}. */
  readonly hookCount?: number;
  /** Live corpus coverage per setting class; see {@link settingClassWeights}. */
  readonly settingCorpusCounts?: Readonly<Partial<Record<SettingClass, number>>>;
  /**
   * Reach and tier for ids that already exist in the corpus.
   *
   * When an id is here, its consequence hand is drawn off the template's own
   * declared reach and tier — the values `check:encounter` recomputes against —
   * rather than off this packet's rolled reach. A retrofit batch names existing
   * templates, and a hand that disagreed with the gate's would be worse than no
   * hand at all.
   */
  readonly knownTemplates?: ReadonlyMap<string, { reach: ReachDomain; rarityTier: RarityTier }>;
  /** Rarity tier assumed for ids the corpus does not know. */
  readonly rarityTier?: RarityTier;
}

export interface PacketSpreadRow {
  readonly axis: string;
  /** Face → slot count, in the axis's canonical order, zero counts omitted. */
  readonly counts: readonly (readonly [string, number])[];
  /** The cap or floor this axis is held to, phrased for the report. */
  readonly bound: string;
  /** False when the packet could not honour the bound — the batch is short a face. */
  readonly satisfied: boolean;
}

export interface EncounterPacket {
  readonly briefSlug: string;
  readonly slots: readonly PacketSlot[];
  readonly spread: readonly PacketSpreadRow[];
  /** Every correction across the batch, in slot order. */
  readonly corrections: readonly PacketCorrection[];
}

/** Uniform weights over a face list. Mirrors the Seed Dice — every die is flat. */
function flatWeights<K extends string>(keys: readonly K[]): Record<K, number> {
  const weights = {} as Record<K, number>;
  for (const key of keys) weights[key] = 1;
  return weights;
}

/**
 * Roll one face, then roll again from the reduced table if the first is capped.
 *
 * The unconstrained roll happens first and unconditionally, so the packet can
 * report what the table *would* have said — and so a slot that busts no cap is
 * byte-identical to a hand roll of the same table at the same seed.
 */
function rollWithCap<K extends string>(
  tableId: string,
  weights: Readonly<Record<K, number>>,
  seedKey: string,
  excluded: ReadonlySet<K>,
): { drawn: K; rolledFirst: K } {
  const [first] = drawFromTable(tableId, weights, seedKey, 1);
  const fallback = (Object.keys(weights) as K[]).sort()[0];
  const rolledFirst = first ?? fallback;
  if (!excluded.has(rolledFirst)) return { drawn: rolledFirst, rolledFirst };

  const reduced = {} as Record<K, number>;
  for (const key of Object.keys(weights) as K[]) {
    if (!excluded.has(key)) reduced[key] = weights[key];
  }
  const [second] = drawFromTable(tableId, reduced, seedKey, 1);

  // No eligible face left: the cap cannot be honoured, so keep the honest roll
  // and let the spread report the bust (NFP #4).
  return { drawn: second ?? rolledFirst, rolledFirst };
}

/** Faces at or over their cap, as a set the tables exclude. */
function cappedFaces<K extends string>(tally: ReadonlyMap<K, number>, cap: number): Set<K> {
  const out = new Set<K>();
  for (const [face, count] of tally) if (count >= cap) out.add(face);
  return out;
}

function bump<K>(tally: Map<K, number>, key: K): void {
  tally.set(key, (tally.get(key) ?? 0) + 1);
}

/** The scales that satisfy the batch's settlement-or-larger floor. */
export const SCALES_MEETING_FLOOR: readonly ScaleId[] = ['settlement', 'region'];

/**
 * The scales excluded at the last chance to meet the floor.
 *
 * Derived from {@link SCALE_FACES} rather than written out, so a fifth scale
 * added to the die is automatically classified — a hand-kept complement is the
 * one that silently stops covering the table it complements.
 */
export const SCALES_BELOW_FLOOR: readonly ScaleId[] = SCALE_FACES.filter(
  scale => !SCALES_MEETING_FLOOR.includes(scale),
);

/**
 * Roll a full authoring packet. Pure, seeded, recomputable from the slug alone.
 *
 * Slot seeds are `<slug>:slot-<n>` and deliberately *not* the template id: a
 * batch's dice must not shift when ids are added, renamed, or dropped, or the
 * packet stops being a stable record of what the brief committed to.
 */
export function rollPacket(input: PacketInput): EncounterPacket {
  const slotCount = Math.min(
    Math.max(1, Math.trunc(input.slots ?? PACKET_DEFAULT_SLOTS)),
    PACKET_MAX_SLOTS,
  );
  const hookCount = input.hookCount ?? PLOT_HOOK_DRAW_COUNT;
  const settingWeights = settingClassWeights(input.settingCorpusCounts);
  const systemWeights = {} as Record<SystemTargetId, number>;
  for (const face of SYSTEM_TARGET_FACES) {
    systemWeights[face.id] = SYSTEM_MATURITY_WEIGHTS[face.maturity];
  }

  const reachTally = new Map<ReachDomain, number>();
  const shapeTally = new Map<DecisionShapeId, number>();
  const settingTally = new Map<SettingClass, number>();
  const systemTally = new Map<SystemTargetId, number>();
  const stakeTally = new Map<StakeShape, number>();
  const oppositionTally = new Map<OppositionId, number>();
  const agentRoleTally = new Map<AgentRoleId, number>();
  const dispositionTally = new Map<Disposition, number>();
  const scaleTally = new Map<ScaleId, number>();

  let middlingTaken = 0;
  let floorMet = 0;

  const slots: PacketSlot[] = [];
  const allCorrections: PacketCorrection[] = [];

  for (let index = 0; index < slotCount; index++) {
    const slotSeed = `${input.briefSlug}:slot-${index + 1}`;
    const templateId = input.ids?.[index];
    const corrections: PacketCorrection[] = [];

    const record = (
      axis: PacketCorrection['axis'],
      rolled: string,
      replacedWith: string,
      reason: string,
    ): void => {
      if (rolled === replacedWith) return;
      const correction: PacketCorrection = { axis, rolled, replacedWith, reason };
      corrections.push(correction);
      allCorrections.push(correction);
    };

    // ── Die A — reach ─────────────────────────────────────────────────
    let reach: ReachDomain;
    if (input.reaches !== undefined && input.reaches.length > 0) {
      reach = input.reaches[index % input.reaches.length];
    } else {
      const rolled = rollWithCap(
        REACH_TABLE_ID,
        flatWeights(REACH_FACES),
        slotSeed,
        cappedFaces(reachTally, PACKET_BATCH_BOUNDS.reachCap),
      );
      record(
        'reach',
        rolled.rolledFirst,
        rolled.drawn,
        `reach cap ${PACKET_BATCH_BOUNDS.reachCap} already reached for '${rolled.rolledFirst}'`,
      );
      reach = rolled.drawn;
    }
    bump(reachTally, reach);

    // ── The existing draws, at this slot's seed ──────────────────────
    const hooks = drawPlotHooks({ briefSeed: slotSeed, reach, count: hookCount });

    // Seed-dice exclusions are computed before the roll, so the constrained and
    // unconstrained rolls come from the one sampler rather than from a copy of
    // its motive/activity derivation living here.
    const remainingIncludingThis = slotCount - index;
    const floorDeficit = SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor - floorMet;
    const forceFloor = floorDeficit > 0 && remainingIncludingThis <= floorDeficit;

    const exclude: SeedDiceExclusions = {
      stakes: [...cappedFaces(stakeTally, SEED_DICE_BATCH_BOUNDS.stakeCap)],
      oppositions: [...cappedFaces(oppositionTally, SEED_DICE_BATCH_BOUNDS.oppositionCap)],
      agentRoles: [...cappedFaces(agentRoleTally, SEED_DICE_BATCH_BOUNDS.agentRoleCap)],
      dispositions:
        (dispositionTally.get('hostile') ?? 0) >= SEED_DICE_BATCH_BOUNDS.hostileCap
          ? ['hostile']
          : [],
      scales: forceFloor ? SCALES_BELOW_FLOOR : [],
    };

    const themes = [...new Set(hooks.flatMap(hook => hook.themes))];
    const unconstrained = rollSeedDice({ briefSeed: slotSeed, themes });
    const seedDice = rollSeedDice({ briefSeed: slotSeed, themes, exclude });

    record(
      'p3Shape',
      unconstrained.stake.id,
      seedDice.stake.id,
      `stake cap ${SEED_DICE_BATCH_BOUNDS.stakeCap} already reached for '${unconstrained.stake.id}'`,
    );
    record(
      'opposition',
      unconstrained.opposition.id,
      seedDice.opposition.id,
      `opposition cap ${SEED_DICE_BATCH_BOUNDS.oppositionCap} already reached for `
        + `'${unconstrained.opposition.id}'`,
    );
    record(
      'agentRole',
      unconstrained.agentRole.id,
      seedDice.agentRole.id,
      `agent-role cap ${SEED_DICE_BATCH_BOUNDS.agentRoleCap} already reached for `
        + `'${unconstrained.agentRole.id}'`,
    );
    record(
      'disposition',
      unconstrained.disposition ?? 'n/a',
      seedDice.disposition ?? 'n/a',
      `hostile cap ${SEED_DICE_BATCH_BOUNDS.hostileCap} already reached`,
    );
    record(
      'scale',
      unconstrained.scale,
      seedDice.scale,
      'last slot that can still meet the settlement-or-larger floor',
    );

    bump(stakeTally, seedDice.stake.id);
    bump(oppositionTally, seedDice.opposition.id);
    bump(agentRoleTally, seedDice.agentRole.id);
    if (seedDice.disposition !== undefined) bump(dispositionTally, seedDice.disposition);
    bump(scaleTally, seedDice.scale);
    if (SCALES_MEETING_FLOOR.includes(seedDice.scale)) floorMet++;

    // ── Die B — decision shape ───────────────────────────────────────
    const shapeRoll = rollWithCap(
      DECISION_SHAPE_TABLE_ID,
      flatWeights(DECISION_SHAPE_FACES.map(face => face.id)),
      slotSeed,
      cappedFaces(shapeTally, PACKET_BATCH_BOUNDS.decisionShapeCap),
    );
    record(
      'decisionShape',
      shapeRoll.rolledFirst,
      shapeRoll.drawn,
      `decision-shape cap ${PACKET_BATCH_BOUNDS.decisionShapeCap} already reached for `
        + `'${shapeRoll.rolledFirst}'`,
    );
    const decisionShape =
      DECISION_SHAPE_FACES.find(face => face.id === shapeRoll.drawn) ?? DECISION_SHAPE_FACES[0];
    bump(shapeTally, decisionShape.id);

    // ── Die C — setting class ────────────────────────────────────────
    const settingRoll = rollWithCap(
      SETTING_CLASS_TABLE_ID,
      settingWeights,
      slotSeed,
      cappedFaces(settingTally, PACKET_BATCH_BOUNDS.settingClassCap),
    );
    record(
      'settingClass',
      settingRoll.rolledFirst,
      settingRoll.drawn,
      `setting cap ${PACKET_BATCH_BOUNDS.settingClassCap} already reached for `
        + `'${settingRoll.rolledFirst}'`,
    );
    const settingClass = settingRoll.drawn;
    bump(settingTally, settingClass);

    // ── Die D — system target ────────────────────────────────────────
    //
    // The middling cap is tier-wide, so the exclusion set is every middling
    // face at once rather than the faces already taken.
    const middlingExhausted = middlingTaken >= PACKET_BATCH_BOUNDS.middlingSystemCap;
    const systemExcluded = new Set<SystemTargetId>(
      middlingExhausted
        ? SYSTEM_TARGET_FACES.filter(face => face.maturity === 'middling').map(face => face.id)
        : [],
    );
    const systemRoll = rollWithCap(
      SYSTEM_TARGET_TABLE_ID,
      systemWeights,
      slotSeed,
      systemExcluded,
    );
    record(
      'systemTarget',
      systemRoll.rolledFirst,
      systemRoll.drawn,
      `middling-system cap ${PACKET_BATCH_BOUNDS.middlingSystemCap} already spent this batch`,
    );
    const systemTarget =
      SYSTEM_TARGET_FACES.find(face => face.id === systemRoll.drawn) ?? SYSTEM_TARGET_FACES[0];
    bump(systemTally, systemTarget.id);
    if (systemTarget.maturity === 'middling') middlingTaken++;

    // ── The binding hand, for named slots only ───────────────────────
    const known = templateId === undefined ? undefined : input.knownTemplates?.get(templateId);
    const consequenceHand =
      templateId === undefined
        ? undefined
        : drawConsequenceHand({
            templateId,
            reach: known?.reach ?? reach,
            rarityTier: known?.rarityTier ?? input.rarityTier ?? PACKET_DEFAULT_RARITY_TIER,
          });

    slots.push({
      index: index + 1,
      slotSeed,
      templateId,
      reach,
      hooks,
      seedDice,
      decisionShape,
      settingClass,
      systemTarget,
      consequenceHand,
      corrections,
    });
  }

  return {
    briefSlug: input.briefSlug,
    slots,
    spread: buildSpread({
      reachTally,
      shapeTally,
      settingTally,
      systemTally,
      stakeTally,
      oppositionTally,
      agentRoleTally,
      dispositionTally,
      scaleTally,
      slotCount,
    }),
    corrections: allCorrections,
  };
}

// ─── The spread ──────────────────────────────────────────────────────

interface SpreadTallies {
  readonly reachTally: ReadonlyMap<ReachDomain, number>;
  readonly shapeTally: ReadonlyMap<DecisionShapeId, number>;
  readonly settingTally: ReadonlyMap<SettingClass, number>;
  readonly systemTally: ReadonlyMap<SystemTargetId, number>;
  readonly stakeTally: ReadonlyMap<StakeShape, number>;
  readonly oppositionTally: ReadonlyMap<OppositionId, number>;
  readonly agentRoleTally: ReadonlyMap<AgentRoleId, number>;
  readonly dispositionTally: ReadonlyMap<Disposition, number>;
  readonly scaleTally: ReadonlyMap<ScaleId, number>;
  readonly slotCount: number;
}

function countsOf<K extends string>(
  tally: ReadonlyMap<K, number>,
): readonly (readonly [string, number])[] {
  return [...tally].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function underCap<K extends string>(tally: ReadonlyMap<K, number>, cap: number): boolean {
  return [...tally.values()].every(count => count <= cap);
}

/**
 * The spread table the batch brief and batch report both print.
 *
 * `satisfied: false` is the honest outcome when a batch is too small or too
 * constrained to honour a bound — the packet reports the bust rather than
 * looping to avoid it, which is the same fail-soft posture the rest of the
 * factory's brief-time tooling takes.
 */
function buildSpread(t: SpreadTallies): readonly PacketSpreadRow[] {
  const hostile = t.dispositionTally.get('hostile') ?? 0;
  const floorMet = SCALES_MEETING_FLOOR.reduce(
    (sum, scale) => sum + (t.scaleTally.get(scale) ?? 0),
    0,
  );

  return [
    {
      axis: 'reach',
      counts: countsOf(t.reachTally),
      bound: `no reach more than ${PACKET_BATCH_BOUNDS.reachCap}×`,
      satisfied: underCap(t.reachTally, PACKET_BATCH_BOUNDS.reachCap),
    },
    {
      axis: 'decision shape',
      counts: countsOf(t.shapeTally),
      bound: `no shape more than ${PACKET_BATCH_BOUNDS.decisionShapeCap}×`,
      satisfied: underCap(t.shapeTally, PACKET_BATCH_BOUNDS.decisionShapeCap),
    },
    {
      axis: 'setting class',
      counts: countsOf(t.settingTally),
      bound: `no class more than ${PACKET_BATCH_BOUNDS.settingClassCap}×`,
      satisfied: underCap(t.settingTally, PACKET_BATCH_BOUNDS.settingClassCap),
    },
    {
      axis: 'system target',
      counts: countsOf(t.systemTally),
      bound: `≤${PACKET_BATCH_BOUNDS.middlingSystemCap} middling, 0 deferred`,
      satisfied: [...t.systemTally].every(([id, count]) => {
        const face = SYSTEM_TARGET_FACES.find(f => f.id === id);
        if (face?.maturity === 'deferred') return false;
        return face?.maturity !== 'middling' || count <= PACKET_BATCH_BOUNDS.middlingSystemCap;
      }),
    },
    {
      axis: 'P3 stake shape',
      counts: countsOf(t.stakeTally),
      bound: `no shape more than ${SEED_DICE_BATCH_BOUNDS.stakeCap}×`,
      satisfied: underCap(t.stakeTally, SEED_DICE_BATCH_BOUNDS.stakeCap),
    },
    {
      axis: 'opposition',
      counts: countsOf(t.oppositionTally),
      bound: `no opposition more than ${SEED_DICE_BATCH_BOUNDS.oppositionCap}×`,
      satisfied: underCap(t.oppositionTally, SEED_DICE_BATCH_BOUNDS.oppositionCap),
    },
    {
      axis: 'disposition',
      counts: countsOf(t.dispositionTally),
      bound: `≤${SEED_DICE_BATCH_BOUNDS.hostileCap} hostile`,
      satisfied: hostile <= SEED_DICE_BATCH_BOUNDS.hostileCap,
    },
    {
      axis: "agent's role",
      counts: countsOf(t.agentRoleTally),
      bound: `no role more than ${SEED_DICE_BATCH_BOUNDS.agentRoleCap}×`,
      satisfied: underCap(t.agentRoleTally, SEED_DICE_BATCH_BOUNDS.agentRoleCap),
    },
    {
      axis: 'scale',
      counts: countsOf(t.scaleTally),
      bound: `≥${SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor} settlement-or-larger`,
      satisfied: floorMet >= SEED_DICE_BATCH_BOUNDS.scaleSettlementOrLargerFloor,
    },
  ];
}

// ─── Catalog health ──────────────────────────────────────────────────

/**
 * Problems with the packet's own tables, plus the tables it composes.
 *
 * The rot class is THR-844's, one level up: a die whose faces have drifted from
 * the canon page it transcribes still rolls, still looks deterministic, and
 * silently makes a shape or a system unreachable forever. Checked before a
 * packet is printed — a roll off a broken catalog is worse than no roll,
 * because it looks like a roll. Returns human-readable violations, never throws
 * (NFP #4).
 */
export function packetDiceCatalogViolations(): readonly string[] {
  const problems: string[] = [...plotHookCatalogViolations(), ...seedDiceCatalogViolations()];

  const expectedCounts: readonly [string, number, number][] = [
    ['reach', REACH_FACES.length, 8],
    ['decision shape', DECISION_SHAPE_FACES.length, 7],
    ['setting class', SETTING_CLASSES.length, 8],
    ['system target', SYSTEM_TARGET_FACES.length, 14],
  ];
  for (const [name, actual, expected] of expectedCounts) {
    if (actual !== expected) {
      problems.push(`${name} die has ${actual} faces, canon says ${expected}`);
    }
  }

  const shapeIds = new Set<string>();
  for (const face of DECISION_SHAPE_FACES) {
    if (shapeIds.has(face.id)) problems.push(`duplicate decision shape '${face.id}'`);
    shapeIds.add(face.id);
    if (!face.useWhen.trim()) problems.push(`decision shape '${face.id}' has no guidance`);
    if (!face.steps.trim()) problems.push(`decision shape '${face.id}' names no step count`);
  }

  const systemIds = new Set<string>();
  for (const face of SYSTEM_TARGET_FACES) {
    if (systemIds.has(face.id)) problems.push(`duplicate system target '${face.id}'`);
    systemIds.add(face.id);
    if (!face.note.trim()) problems.push(`system target '${face.id}' carries no gloss`);
  }

  // A batch that can never satisfy its own caps is a table bug, not a roll
  // outcome: the packet would report an unsatisfiable spread on every run.
  if (TARGETABLE_SYSTEM_FACES.length === 0) {
    problems.push('every system target is deferred — the system die cannot roll');
  }
  if (DECISION_SHAPE_FACES.length * PACKET_BATCH_BOUNDS.decisionShapeCap < PACKET_DEFAULT_SLOTS) {
    problems.push('the decision-shape table is too small for a default batch at its cap');
  }
  if (REACH_FACES.length * PACKET_BATCH_BOUNDS.reachCap < PACKET_DEFAULT_SLOTS) {
    problems.push('the reach table is too small for a default batch at its cap');
  }

  return problems;
}
