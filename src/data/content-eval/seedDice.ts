/**
 * The Seed Dice — the five brief-time rolls between the Plot-Hook Draw and the
 * Consequence Draw. THR-1224.
 *
 * Contract: `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`
 * § *The Seed Dice* (director ruling 2026-08-25). The tables here are that
 * section transcribed; where the two disagree, the spec is the contract and
 * this file is the bug.
 *
 * ─── What the dice are for ───────────────────────────────────────────
 * **Every axis where an unconstrained author would default gets a die; rolls
 * propose, design disposes.** The hook fixes the premise and the consequence
 * hand fixes the back end. Left alone, everything in between converges: every
 * problem a plea, every agent a helpful passerby, every opposition a bandit,
 * everything personal-scale, everything hostile. Five rolls cost nothing and
 * break all five defaults at once.
 *
 * The dice stop at the brief. Everything inside the constraints — the fiction,
 * the cards, the specific people — the author owns. A fully rolled encounter
 * would be mad-libs; an unrolled one is the same encounter forever.
 *
 * ─── Enforcement tier: capped, not binding ───────────────────────────
 * Per the spec's tier table these are **capped** axes: the batch brief carries
 * variance rows and the batch report prints the spread. Nothing recomputes a
 * finished encounter against its roll the way `check:encounter` recomputes the
 * consequence hand — there is no template field holding a stake shape, and
 * adding one would make an advisory axis binding by the back door. Drifting off
 * the roll is allowed; not recording it is not.
 *
 * ─── Determinism ─────────────────────────────────────────────────────
 * Every die is a `drawFromTable` call under its own table id, seeded by the
 * brief slug — so a recorded roll is recomputable by anyone who doubts it, and
 * two dice rolled for the same brief are independent rather than correlated.
 * Same slug in, same five faces out, forever.
 *
 * ─── Placement ───────────────────────────────────────────────────────
 * Authoring-time only, beside the other draw tables. Nothing under
 * `src/components/**`, `src/engine/**` (outside tests), or the tick loop may
 * import it.
 */

import { drawFromTable } from './drawTable';
import type { PlotHookTheme } from './plotHooks';

// ─── Table ids (independent seeds per die) ───────────────────────────

export const STAKE_TABLE_ID = 'seed_dice_stake';
export const OPPOSITION_TABLE_ID = 'seed_dice_opposition';
export const MOTIVE_TABLE_ID = 'seed_dice_motive';
export const ACTIVITY_TABLE_ID = 'seed_dice_activity';
export const DISPOSITION_TABLE_ID = 'seed_dice_disposition';
export const AGENT_ROLE_TABLE_ID = 'seed_dice_agent_role';
export const SCALE_TABLE_ID = 'seed_dice_scale';

// ─── Die 1 — the stake (the P3 shape), 8 faces ───────────────────────

export type StakeShape =
  | 'plea'
  | 'obstruction'
  | 'threat'
  | 'opportunity'
  | 'contest'
  | 'choice'
  | 'unmitigated_risk'
  | 'mystery';

export interface StakeFace {
  readonly id: StakeShape;
  /** Player-facing label, as the spec's table prints it. */
  readonly label: string;
  /** What P2 has to have established for this shape to land in P3. */
  readonly p2Must: string;
  /** The spec's worked closing line, as a format to write against. */
  readonly closingFormat: string;
  /**
   * Whether the shape needs a named NPC to own the problem.
   *
   * Only Plea and Contest do. The cast binding still exists for the others —
   * that person just isn't the problem, which is the whole reason the spec
   * spells this out: "not every problem has a *who*" is the default the die
   * exists to break.
   */
  readonly needsNamedOwner: boolean;
}

export const STAKE_FACES: readonly StakeFace[] = [
  {
    id: 'plea',
    label: 'Plea',
    p2Must: 'a named person in trouble',
    closingFormat: '"Guard Captain <name> is at his wits\' end and asks for help."',
    needsNamedOwner: true,
  },
  {
    id: 'obstruction',
    label: 'Obstruction',
    p2Must: 'a barrier between the agent and where they\'re going',
    closingFormat: '"The bridge is down. The ford is the only crossing before nightfall."',
    needsNamedOwner: false,
  },
  {
    id: 'threat',
    label: 'Threat',
    p2Must: 'danger approaching on a clock',
    closingFormat: '"The riders will reach the camp by dusk."',
    needsNamedOwner: false,
  },
  {
    id: 'opportunity',
    label: 'Opportunity',
    p2Must: 'something valuable, takeable, at a cost',
    closingFormat: '"The relic is unclaimed. Whoever carries it out owns it."',
    needsNamedOwner: false,
  },
  {
    id: 'contest',
    label: 'Contest',
    p2Must: 'a rival present, wanting the same thing',
    closingFormat: '"Another claimant is already waiting beside it."',
    needsNamedOwner: true,
  },
  {
    id: 'choice',
    label: 'Choice',
    p2Must: 'two courses, both costly',
    closingFormat: '"Sharing the water saves the strangers and leaves the company short."',
    needsNamedOwner: false,
  },
  {
    id: 'unmitigated_risk',
    label: 'Unmitigated risk',
    p2Must: 'nothing attacking yet — continuing without acting invites it',
    closingFormat: '"The pass is open, but the snow above is loaded and the light is going."',
    needsNamedOwner: false,
  },
  {
    id: 'mystery',
    label: 'Mystery',
    p2Must: 'something wrong and unexplained',
    closingFormat: '"No one in the village will say where the miller went."',
    needsNamedOwner: false,
  },
];

/**
 * Hook theme → the stake shapes that theme naturally suggests.
 *
 * **Advisory, per the spec's enforcement tiers** — printed beside the roll so an
 * author can see when the die and the hook are pulling the same way, and never
 * enforced. A themed suggestion that disagrees with the rolled shape is
 * information, not a conflict: the roll is the one that breaks the default.
 */
export const THEME_NATURAL_SHAPES: Readonly<Record<PlotHookTheme, readonly StakeShape[]>> = {
  protection: ['threat', 'plea'],
  scarcity: ['choice', 'opportunity'],
  journey: ['obstruction', 'unmitigated_risk'],
  conflict: ['threat', 'contest'],
  discovery: ['opportunity', 'mystery'],
  power: ['contest', 'threat'],
  bargain: ['choice', 'contest'],
  betrayal: ['mystery', 'choice'],
  faith: ['plea', 'choice'],
  craft: ['obstruction', 'opportunity'],
  justice: ['plea', 'mystery'],
  transformation: ['unmitigated_risk', 'choice'],
};

// ─── Die 2 — the opposition (what resists), 8 faces ──────────────────

export type OppositionId =
  | 'rival_agent'
  | 'faction'
  | 'beast'
  | 'terrain'
  | 'uncanny'
  | 'law'
  | 'time'
  | 'own_trait';

export interface OppositionFace {
  readonly id: OppositionId;
  readonly label: string;
  /** The motive column for this opposition — one is rolled from it. */
  readonly motives: readonly string[];
  /**
   * Whether the opposition has a stance toward the agent when they arrive.
   *
   * Terrain and time do not — the spec has them roll `n/a` on the reaction die,
   * because indifference is not a disposition and a clock cannot be friendly.
   * Everything else, including the mortal's own trait, has one.
   */
  readonly willed: boolean;
}

export const OPPOSITION_FACES: readonly OppositionFace[] = [
  {
    id: 'rival_agent',
    label: 'rival agent',
    motives: ['greed', 'fear', 'orders', 'pride'],
    willed: true,
  },
  {
    id: 'faction',
    label: 'faction / institution',
    motives: ['orders', 'doctrine', 'territory'],
    willed: true,
  },
  { id: 'beast', label: 'beast', motives: ['hunger', 'territory', 'panic'], willed: true },
  {
    id: 'terrain',
    label: 'terrain / the elements',
    motives: ['indifference'],
    willed: false,
  },
  {
    id: 'uncanny',
    label: 'the uncanny (threads, relics, spirits)',
    motives: ['its own law'],
    willed: true,
  },
  {
    id: 'law',
    label: 'the law / custom of the place',
    motives: ['duty', 'precedent'],
    willed: true,
  },
  { id: 'time', label: 'time itself', motives: ['the clock is the enemy'], willed: false },
  {
    id: 'own_trait',
    label: "the mortal's own trait",
    motives: ["read from the graph — their `stubborn`, their `oathbound`"],
    willed: true,
  },
];

/** Optional sub-roll: what the opposition is doing when found. Texture for P2. */
export const OPPOSITION_ACTIVITIES: readonly string[] = [
  'eating',
  'fighting something else',
  'wounded',
  'working',
  'sleeping',
  'arguing',
  'fleeing',
  'waiting',
];

// ─── Die 3 — disposition (the reaction roll), 5 faces ────────────────

export type Disposition = 'hostile' | 'wary' | 'neutral' | 'open' | 'friendly';

/**
 * The oldest die in the hobby, and it was missing.
 *
 * One opposition × five dispositions is five different encounters — the wary
 * beast and the friendly rival are not the same scene twice. Disposition is a
 * **pre-test state of the world**: nudges may sway it, fate resolves it, which
 * is exactly the model the whole encounter system runs on.
 */
export const DISPOSITIONS: readonly Disposition[] = [
  'hostile',
  'wary',
  'neutral',
  'open',
  'friendly',
];

/** What an unwilled opposition rolls instead. */
export const DISPOSITION_NOT_APPLICABLE = 'n/a';

// ─── Die 4 — the agent's role, 7 faces ───────────────────────────────

export type AgentRoleId =
  | 'bystander_pulled_in'
  | 'the_target'
  | 'suspect_or_cause'
  | 'judge_asked_to_rule'
  | 'competitor'
  | 'client_who_is_owed'
  | 'trespasser';

export interface AgentRoleFace {
  readonly id: AgentRoleId;
  readonly label: string;
  /** Present where the spec gives one; the suspect face is the worked example. */
  readonly note?: string;
}

/**
 * The corpus's strongest default is "helpful passerby". One roll here changes an
 * encounter more than any other die, for free.
 */
export const AGENT_ROLE_FACES: readonly AgentRoleFace[] = [
  { id: 'bystander_pulled_in', label: 'bystander pulled in' },
  { id: 'the_target', label: 'the target' },
  {
    id: 'suspect_or_cause',
    label: 'the suspect or cause',
    note: 'the garrison thinks the relic followed *her* here',
  },
  { id: 'judge_asked_to_rule', label: 'the judge asked to rule' },
  { id: 'competitor', label: 'the competitor' },
  { id: 'client_who_is_owed', label: 'the client who is owed' },
  { id: 'trespasser', label: 'the trespasser' },
];

// ─── Die 5 — scale (who the outcome touches), 4 faces ────────────────

export type ScaleId = 'personal' | 'company' | 'settlement' | 'region';

/**
 * The standing director note is that this is epic fantasy, not slice-of-life.
 * The portfolio census measures the skew; this die pushes against it per
 * encounter. Batch floor: at least one settlement-or-larger per batch.
 */
export const SCALE_FACES: readonly ScaleId[] = ['personal', 'company', 'settlement', 'region'];

// ─── Batch variance bounds (the spec's "capped" tier) ────────────────

/**
 * Per-batch caps and floors from the spec's die headings.
 *
 * Recorded as constants so a batch report can assert the spread instead of a
 * reviewer eyeballing it (NFP #1). Nothing in this module enforces them — a
 * single roll cannot violate a batch cap, and the batch brief is where the
 * spread lives.
 */
export const SEED_DICE_BATCH_BOUNDS = {
  /** At most this many slots in a batch may share a stake shape. */
  stakeCap: 2,
  /** At most this many slots in a batch may share an opposition. */
  oppositionCap: 2,
  /** At most this many slots in a batch may share an agent role. */
  agentRoleCap: 2,
  /** At least this many slots must roll settlement-or-larger. */
  scaleSettlementOrLargerFloor: 1,
  /** At most this many slots in a batch may roll `hostile`. */
  hostileCap: 2,
} as const;

// ─── The roll ────────────────────────────────────────────────────────

export interface SeedDiceRoll {
  readonly briefSeed: string;
  readonly stake: StakeFace;
  /** Shapes the hook's themes suggest — advisory, may disagree with {@link stake}. */
  readonly suggestedShapes: readonly StakeShape[];
  readonly opposition: OppositionFace;
  readonly motive: string;
  /**
   * What the opposition is doing when found, or `undefined` for an opposition
   * the list cannot describe.
   *
   * Terrain and time get no activity: "sleeping" is not a thing a ford does, and
   * printing one would be the mad-libs failure the spec warns about. The author
   * writes the activity for those — the spec's own worked example ("blocking the
   * only ford") is authored, not rolled.
   */
  readonly activity: string | undefined;
  /** `undefined` where the opposition is unwilled — printed as `n/a`. */
  readonly disposition: Disposition | undefined;
  readonly agentRole: AgentRoleFace;
  readonly scale: ScaleId;
}

export interface SeedDiceInput {
  /**
   * Stable per-brief string — the same slug the Plot-Hook Draw is seeded with,
   * so a brief's whole roll set recomputes from one recorded value.
   */
  readonly briefSeed: string;
  /**
   * Hook themes, when the slot has already taken a hook.
   *
   * Only ever used to compute {@link SeedDiceRoll.suggestedShapes}. It does not
   * weight the stake die: the suggestion is advisory by ruling, and letting it
   * bias the roll would quietly make the advisory tier binding — the corpus
   * would reconverge on exactly the shapes the themes already favour, which is
   * the failure the die exists to prevent.
   */
  readonly themes?: readonly PlotHookTheme[];
}

/** Uniform weights over a face list — every die is flat by design. */
function flatWeights<K extends string>(keys: readonly K[]): Record<K, number> {
  const weights = {} as Record<K, number>;
  for (const key of keys) weights[key] = 1;
  return weights;
}

/**
 * Draw exactly one face, falling back to the first face if the table is empty.
 *
 * Never throws (NFP #4): a die that cannot roll returns a usable face rather
 * than taking down a brief-time script, and an empty table is a catalog bug the
 * health check names.
 */
function rollOne<K extends string>(
  tableId: string,
  keys: readonly K[],
  briefSeed: string,
): K {
  const [drawn] = drawFromTable(tableId, flatWeights(keys), briefSeed, 1);
  return drawn ?? keys[0];
}

/**
 * Roll all five dice for one brief slot. Pure, seeded, recomputable.
 *
 * The motive and activity sub-rolls are seeded off the *opposition* as well as
 * the brief, so two briefs that happen to roll the same opposition still get
 * independent motives rather than the motive being a function of the slug alone.
 */
export function rollSeedDice(input: SeedDiceInput): SeedDiceRoll {
  const { briefSeed } = input;

  const stakeId = rollOne(
    STAKE_TABLE_ID,
    STAKE_FACES.map(face => face.id),
    briefSeed,
  );
  const stake = STAKE_FACES.find(face => face.id === stakeId) ?? STAKE_FACES[0];

  const oppositionId = rollOne(
    OPPOSITION_TABLE_ID,
    OPPOSITION_FACES.map(face => face.id),
    briefSeed,
  );
  const opposition = OPPOSITION_FACES.find(face => face.id === oppositionId) ?? OPPOSITION_FACES[0];

  const motive = rollOne(MOTIVE_TABLE_ID, opposition.motives, `${briefSeed}:${opposition.id}`);

  const activity = opposition.willed
    ? rollOne(ACTIVITY_TABLE_ID, OPPOSITION_ACTIVITIES, `${briefSeed}:${opposition.id}`)
    : undefined;

  const disposition = opposition.willed
    ? rollOne(DISPOSITION_TABLE_ID, DISPOSITIONS, briefSeed)
    : undefined;

  const agentRoleId = rollOne(
    AGENT_ROLE_TABLE_ID,
    AGENT_ROLE_FACES.map(face => face.id),
    briefSeed,
  );
  const agentRole = AGENT_ROLE_FACES.find(face => face.id === agentRoleId) ?? AGENT_ROLE_FACES[0];

  const scale = rollOne(SCALE_TABLE_ID, SCALE_FACES, briefSeed);

  const suggested = new Set<StakeShape>();
  for (const theme of input.themes ?? []) {
    for (const shape of THEME_NATURAL_SHAPES[theme] ?? []) suggested.add(shape);
  }

  return {
    briefSeed,
    stake,
    suggestedShapes: [...suggested],
    opposition,
    motive,
    activity,
    disposition,
    agentRole,
    scale,
  };
}

// ─── Catalog health ──────────────────────────────────────────────────

/**
 * Problems with the dice themselves — face counts that have drifted from the
 * spec, duplicate ids, empty motive columns, themes with no shapes.
 *
 * The rot class this catches is a table quietly losing a face: a die with seven
 * faces still rolls, still looks deterministic, and silently makes one shape
 * unreachable forever. Returns human-readable violations, never throws (NFP #4).
 */
export function seedDiceCatalogViolations(): readonly string[] {
  const problems: string[] = [];

  const expectedCounts: readonly [string, number, number][] = [
    ['stake', STAKE_FACES.length, 8],
    ['opposition', OPPOSITION_FACES.length, 8],
    ['disposition', DISPOSITIONS.length, 5],
    ['agent role', AGENT_ROLE_FACES.length, 7],
    ['scale', SCALE_FACES.length, 4],
  ];
  for (const [name, actual, expected] of expectedCounts) {
    if (actual !== expected) {
      problems.push(`${name} die has ${actual} faces, spec says ${expected}`);
    }
  }

  const stakeIds = new Set<string>();
  for (const face of STAKE_FACES) {
    if (stakeIds.has(face.id)) problems.push(`duplicate stake face '${face.id}'`);
    stakeIds.add(face.id);
    if (!face.p2Must.trim()) problems.push(`stake '${face.id}' says nothing about P2`);
    if (!face.closingFormat.trim()) problems.push(`stake '${face.id}' has no closing format`);
  }

  const oppositionIds = new Set<string>();
  for (const face of OPPOSITION_FACES) {
    if (oppositionIds.has(face.id)) problems.push(`duplicate opposition face '${face.id}'`);
    oppositionIds.add(face.id);
    if (face.motives.length === 0) problems.push(`opposition '${face.id}' has an empty motive column`);
  }

  for (const [theme, shapes] of Object.entries(THEME_NATURAL_SHAPES)) {
    if (shapes.length === 0) {
      problems.push(`theme '${theme}' suggests no shapes`);
      continue;
    }
    for (const shape of shapes) {
      if (!stakeIds.has(shape)) {
        problems.push(`theme '${theme}' suggests unknown shape '${shape}'`);
      }
    }
  }

  if (OPPOSITION_ACTIVITIES.length === 0) problems.push('the activity sub-roll has no faces');

  return problems;
}
