/**
 * Personality Trait Content Package (THR-527).
 *
 * Emergent personality traits — the "who they currently are" layer of the
 * layered personality stack (see `Docs/plans/2026-06-29-agent-personality-moral-drift.md`
 * §The model layer 4). Each of the 8 canonical moral axes (one per Reach) has a
 * **virtue** pole trait and a **vice** pole trait. The threshold phase
 * (`phasePersonalityTraitEmerge`) grants the virtue trait when an agent's live
 * axis position reaches the virtue threshold and the vice trait when it reaches
 * the vice threshold, releasing them with a hysteresis dead-band so they don't
 * flicker.
 *
 * Each trait is a graph node (type: 'trait') with `subcategory: 'personality'` —
 * deliberately distinct from `reputation` (how the *world* sees the agent). These
 * describe who the agent *is*.
 *
 * ─── Invariant (load-bearing) ───────────────────────────────────
 * Personality traits carry NO `domainContributions`. Personality steers which
 * encounters an agent reaches for (`scoringModifiers`), never how competent they
 * are at them. Capability lives in a separate field and a separate scoring term.
 *
 * ─── Constants (NFP #1) ─────────────────────────────────────────
 * Thresholds expressed on the canonical 0–1 axis scale (0.5 neutral, virtue 1.0,
 * vice 0.0) so they survive the THR-537/538 scale migration unchanged.
 *
 * Definitions are derived from the canonical axis registry (`axisRegistry.ts`) so
 * the pole labels and reach bindings can never drift from the THR-524 vocabulary.
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties } from '../types/traits';
import { CANONICAL_AXES, type CanonicalAxis } from '../types/axisRegistry';

// ─── Emergence Threshold Constants ──────────────────────────────────────────

/** Live axis position at/above which the virtue-pole trait crystallizes (0–1 scale). */
export const PERSONALITY_TRAIT_VIRTUE_THRESHOLD = 0.8;

/** Live axis position at/below which the vice-pole trait crystallizes (0–1 scale). */
export const PERSONALITY_TRAIT_VICE_THRESHOLD = 0.2;

/**
 * Hysteresis dead-band. A held virtue trait is released only once the position
 * falls back below `VIRTUE_THRESHOLD − RELEASE_BAND`; a held vice trait only once
 * it rises back above `VICE_THRESHOLD + RELEASE_BAND`. Prevents flicker around the
 * grant boundary.
 */
export const PERSONALITY_TRAIT_RELEASE_BAND = 0.15;

/** Release floor for a held virtue trait (0.65 by default). */
export const PERSONALITY_TRAIT_VIRTUE_RELEASE =
  PERSONALITY_TRAIT_VIRTUE_THRESHOLD - PERSONALITY_TRAIT_RELEASE_BAND;

/** Release ceiling for a held vice trait (0.35 by default). */
export const PERSONALITY_TRAIT_VICE_RELEASE =
  PERSONALITY_TRAIT_VICE_THRESHOLD + PERSONALITY_TRAIT_RELEASE_BAND;

/**
 * Per-reach scoring modifier each emergent personality trait carries. A crystallized
 * personality nudges the agent toward encounters in its own Reach — a Brave or a
 * Power-Hungry agent both reach for Iron encounters; the moral flavor differs, the
 * pull does not. Consumed via the encounter scoring-bonus path.
 */
export const PERSONALITY_TRAIT_SCORING_MODIFIER = 0.15;

// ─── Pole-keyed flavor (Threadbare voice) ───────────────────────────────────

type PoleSide = 'virtue' | 'vice';

/** One authored flavor line per (reach, pole). Plain, concrete, present-tense. */
const FLAVOR: Record<string, { virtue: string; vice: string }> = {
  iron: {
    virtue: 'Steps in front of the blow without being asked.',
    vice: 'Counts every weakness in the room, and waits.',
  },
  gold: {
    virtue: 'Splits the last loaf before anyone thinks to ask.',
    vice: 'Weighs a friendship by what it can be made to yield.',
  },
  shadow: {
    virtue: 'Keeps the bargain even when no one is watching.',
    vice: 'Tells each person the version that moves them.',
  },
  veil: {
    virtue: 'Lets the slow work take the time it needs.',
    vice: 'Pulls the thread now, whatever it unravels.',
  },
  heart: {
    virtue: 'Stands by their people past all reason to.',
    vice: 'Leaves the moment the wind turns colder.',
  },
  eye: {
    virtue: 'Sees the shape of a thing before it speaks.',
    vice: 'Has already decided, and is only gathering proof.',
  },
  stone: {
    // Re-anchored THR-1135: the old lean-on-me image was reliability (Heart's
    // domain); Careful points at foresight and inspection instead.
    virtue: 'Checks the beam before trusting weight to it.',
    vice: 'Breaks what stands to see what was holding it up.',
  },
  star: {
    virtue: 'Leaves a room braver than they found it.',
    vice: 'Leaves a room quieter, and unsure why.',
  },
};

// ─── Trait Definition Builder ───────────────────────────────────────────────

function personalityTraitId(reach: string, pole: PoleSide): string {
  return `trait.personality.${reach}.${pole}`;
}

function buildPersonalityTrait(axis: CanonicalAxis, pole: PoleSide): GraphNode {
  const sidePole = pole === 'virtue' ? axis.virtue : axis.vice;
  const reach = axis.reachDomain;
  const flavor = FLAVOR[reach]?.[pole] ?? '';

  const properties: TraitDefinitionProperties = {
    subcategory: 'personality',
    description:
      `Their ${reach} leanings have hardened into the ${sidePole.role}'s way — ` +
      `${sidePole.word.toLowerCase()} in how they choose.`,
    importance: 0.6,
    // Binary present/absent: emergent traits crystallize and dissolve, they do not level.
    maxLevel: 1,
    visibility: 'public',
    // Empty by invariant: personality never feeds Domain Capability.
    domainContributions: {},
    tags: ['#personality', `#${reach}`, `#${pole}`],
    flavorText: flavor,
    scoringModifiers: { [reach]: PERSONALITY_TRAIT_SCORING_MODIFIER },
  };

  return {
    id: personalityTraitId(reach, pole),
    type: 'trait',
    name: sidePole.word,
    properties: properties as unknown as Record<string, unknown>,
  };
}

// ─── Exports ────────────────────────────────────────────────────────────────

/** All 16 emergent personality trait definition nodes (8 axes × virtue/vice). */
export const PERSONALITY_TRAIT_DEFINITIONS: GraphNode[] = CANONICAL_AXES.flatMap(
  (axis) => [buildPersonalityTrait(axis, 'virtue'), buildPersonalityTrait(axis, 'vice')],
);

/** axisId → { virtue, vice } trait ids, for the emergence phase to grant/release. */
export const PERSONALITY_TRAIT_BY_AXIS: Record<string, { virtue: string; vice: string }> =
  CANONICAL_AXES.reduce(
    (acc, axis) => {
      acc[axis.axisId] = {
        virtue: personalityTraitId(axis.reachDomain, 'virtue'),
        vice: personalityTraitId(axis.reachDomain, 'vice'),
      };
      return acc;
    },
    {} as Record<string, { virtue: string; vice: string }>,
  );
