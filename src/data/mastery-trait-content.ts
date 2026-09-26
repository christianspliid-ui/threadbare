/**
 * Mastery Trait Content Package — mastery traits earned through repeated
 * success in non-economic encounter domains.
 *
 * Each trait is a graph node (type: 'trait') with TraitDefinitionProperties.
 * Acquisition is handled by mentorshipOutcomes (apprentice graduation); these are
 * just definitions. The encounter-outcome success counter that once minted them
 * (phaseEncounterTraits) was dead — called only from the empty legacy
 * encounterProgress loop — and was deleted by THR-1503.
 *
 * Mastery is permanent: decay is retired behind `MASTERY_DECAY_ENABLED` (THR-1584).
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                              | Default | Purpose                               |
 * |-----------------------------------|---------|---------------------------------------|
 * | MASTERY_IRON_MIN_SUCCESSES        | 4       | Combat successes needed for level 1   |
 * | MASTERY_HEART_MIN_SUCCESSES       | 4       | Social successes needed for level 1   |
 * | MASTERY_SHADOW_MIN_SUCCESSES      | 4       | Stealth successes needed for level 1  |
 * | MASTERY_VEIL_MIN_SUCCESSES        | 4       | Mystical successes needed for level 1 |
 * | MASTERY_EYE_MIN_SUCCESSES         | 4       | Perception successes needed for level 1|
 * | MASTERY_STONE_MIN_SUCCESSES       | 4       | Stability successes needed for level 1|
 * | MASTERY_STAR_MIN_SUCCESSES        | 5       | Divine successes needed for level 1   |
 * | MASTERY_DECAY_ENABLED             | false   | Mastery decay switch — retired (THR-1584) |
 * | MASTERY_DECAY_PERIOD              | 48      | Retired: ticks before level loss      |
 * | MASTERY_RAW_PER_LEVEL             | 5       | Raw reach score per mastery level     |
 * | MASTERY_STAR_RAW_PER_LEVEL        | 6       | Raw star score per Anointed level     |
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties } from '../types/traits';

// ─── Acquisition Threshold Constants ────────────────────────────────────────

/** Minimum combat encounter successes for battle-hardened */
export const MASTERY_IRON_MIN_SUCCESSES = 4;

/** Minimum social encounter successes for silver tongue */
export const MASTERY_HEART_MIN_SUCCESSES = 4;

/** Minimum stealth/shadow encounter successes for shadow walker */
export const MASTERY_SHADOW_MIN_SUCCESSES = 4;

/** Minimum mystical encounter successes for spell-weaver */
export const MASTERY_VEIL_MIN_SUCCESSES = 4;

/** Minimum perception/eye encounter successes for keen-eyed */
export const MASTERY_EYE_MIN_SUCCESSES = 4;

/** Minimum stability/stone encounter successes for steadfast */
export const MASTERY_STONE_MIN_SUCCESSES = 4;

/** Minimum divine/star encounter successes for anointed */
export const MASTERY_STAR_MIN_SUCCESSES = 5;

/**
 * Mastery is permanent (THR-1584). The decay this period once drove never fired:
 * `mentorshipOutcomes.grantMasteryTrait` — the only minter — writes `appliedAt`, not
 * `lastReinforcedTick`, so `processTraitDecay` computed `tick − undefined = NaN` and
 * skipped every trait. It stays off on purpose: "fixing" the timestamp would make
 * mortals lose skill with time, which the forecast-window ruling rules out ("failure
 * never costs skill", THR-1575). Flip to `true` only with a new ruling.
 * Scope: the seven reach-mastery definitions below. The economic mastery traits
 * (`economic-trait-content.ts`) are status marks re-judged each tick and keep their own
 * `decayPeriod`.
 */
export const MASTERY_DECAY_ENABLED = false;

/** Retired period (4 game days) — read only when `MASTERY_DECAY_ENABLED` is true. */
export const MASTERY_DECAY_PERIOD = 48;

/** What each definition carries as `decayPeriod`: undefined while decay is retired,
 *  which `processTraitDecay` reads as "never decays". */
const MASTERY_DECAY_PERIOD_IF_ENABLED: number | undefined =
  MASTERY_DECAY_ENABLED ? MASTERY_DECAY_PERIOD : undefined;

/**
 * Raw reach score each mastery level adds (THR-1584). A graduate
 * (`GRADUATION_TRAIT_LEVEL` 2) gains +10 raw on the trained reach: on the THR-1581
 * dice curve (midpoint 30, k 0.08) that is 0.50 → 0.69 at the midpoint and
 * 0.17 → 0.31 at raw 10 — a visible step that moves which challenges the mortal takes
 * on. The old 0.10 per level added +0.2 raw, under half a percentage point.
 */
export const MASTERY_RAW_PER_LEVEL = 5;

/** Anointed (star) keeps its old 1.2× premium over the other reaches (0.12 vs 0.10);
 *  star mastery was the hardest to earn (`MASTERY_STAR_MIN_SUCCESSES`). */
export const MASTERY_STAR_RAW_PER_LEVEL = 6;

// ─── Trait Definition Nodes ─────────────────────────────────────────────────

export const MASTERY_TRAIT_DEFINITIONS: GraphNode[] = [
  {
    id: 'trait.mastery.battle-hardened',
    type: 'trait',
    name: 'Battle-Hardened',
    properties: {
      subcategory: 'mastery',
      description: 'Forged in repeated combat, their reflexes are honed to a deadly edge.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { iron: MASTERY_RAW_PER_LEVEL },
      decayPeriod: MASTERY_DECAY_PERIOD_IF_ENABLED,
      tags: ['#iron', '#combat', '#mastery'],
      flavorText: 'Every scar is a lesson written in flesh.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.silver-tongue',
    type: 'trait',
    name: 'Silver Tongue',
    properties: {
      subcategory: 'mastery',
      description: 'Words flow like water — persuading, inspiring, and disarming in equal measure.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { heart: MASTERY_RAW_PER_LEVEL },
      decayPeriod: MASTERY_DECAY_PERIOD_IF_ENABLED,
      tags: ['#heart', '#social', '#mastery'],
      flavorText: 'They could talk a dragon into lending its hoard.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.shadow-walker',
    type: 'trait',
    name: 'Shadow Walker',
    properties: {
      subcategory: 'mastery',
      description: 'Moves unseen and unheard, a ghost in the margins of the world.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'discoverable',
      domainContributions: { shadow: MASTERY_RAW_PER_LEVEL },
      decayPeriod: MASTERY_DECAY_PERIOD_IF_ENABLED,
      tags: ['#shadow', '#stealth', '#mastery'],
      flavorText: 'Even their footsteps forget where they walked.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.spell-weaver',
    type: 'trait',
    name: 'Spell-Weaver',
    properties: {
      subcategory: 'mastery',
      description: 'The arcane answers their call with growing familiarity.',
      importance: 0.8,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { veil: MASTERY_RAW_PER_LEVEL },
      decayPeriod: MASTERY_DECAY_PERIOD_IF_ENABLED,
      tags: ['#veil', '#mystical', '#mastery'],
      flavorText: 'Magic clings to them like morning dew.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.keen-eyed',
    type: 'trait',
    name: 'Keen-Eyed',
    properties: {
      subcategory: 'mastery',
      description: 'Nothing escapes their notice — patterns, lies, and hidden things alike.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { eye: MASTERY_RAW_PER_LEVEL },
      decayPeriod: MASTERY_DECAY_PERIOD_IF_ENABLED,
      tags: ['#eye', '#perception', '#mastery'],
      flavorText: 'They see the threads that bind cause to consequence.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.steadfast',
    type: 'trait',
    name: 'Steadfast',
    properties: {
      subcategory: 'mastery',
      description: 'An anchor in storms — unyielding through labor, siege, and upheaval.',
      importance: 0.7,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { stone: MASTERY_RAW_PER_LEVEL },
      decayPeriod: MASTERY_DECAY_PERIOD_IF_ENABLED,
      tags: ['#stone', '#stability', '#mastery'],
      flavorText: 'The mountain does not flinch when the wind howls.',
    } as TraitDefinitionProperties,
  },
  {
    id: 'trait.mastery.anointed',
    type: 'trait',
    name: 'Anointed',
    properties: {
      subcategory: 'mastery',
      description: 'Touched by the divine through repeated acts of faith and sacrifice.',
      importance: 0.9,
      maxLevel: 3,
      visibility: 'public',
      domainContributions: { star: MASTERY_STAR_RAW_PER_LEVEL },
      decayPeriod: MASTERY_DECAY_PERIOD_IF_ENABLED,
      tags: ['#star', '#divine', '#mastery'],
      flavorText: 'The light remembers those who serve it.',
    } as TraitDefinitionProperties,
  },
];

/** Map from reach domain to the mastery trait ID for that domain */
export const MASTERY_TRAIT_BY_REACH: Record<string, string> = {
  iron: 'trait.mastery.battle-hardened',
  heart: 'trait.mastery.silver-tongue',
  shadow: 'trait.mastery.shadow-walker',
  veil: 'trait.mastery.spell-weaver',
  eye: 'trait.mastery.keen-eyed',
  stone: 'trait.mastery.steadfast',
  star: 'trait.mastery.anointed',
};

/** Map from reach domain to the minimum successes required */
export const MASTERY_THRESHOLDS: Record<string, number> = {
  iron: MASTERY_IRON_MIN_SUCCESSES,
  heart: MASTERY_HEART_MIN_SUCCESSES,
  shadow: MASTERY_SHADOW_MIN_SUCCESSES,
  veil: MASTERY_VEIL_MIN_SUCCESSES,
  eye: MASTERY_EYE_MIN_SUCCESSES,
  stone: MASTERY_STONE_MIN_SUCCESSES,
  star: MASTERY_STAR_MIN_SUCCESSES,
};
