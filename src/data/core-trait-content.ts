/**
 * Core Trait Content Package (THR-544, content half of the Core layer THR-542).
 *
 * Emergent **Core** traits — the crystallized "who they fundamentally are" of the
 * foundation personality layer (`coreRegistry.ts`), the Core sibling of the
 * reach-axis emergent personality traits (`personality-trait-content.ts`). Each
 * of the 5 Core continuums has a **virtue** pole trait and a **vice** pole trait.
 * The `core_personality` phase grants the virtue trait when an agent's live Core
 * position reaches the virtue threshold and the vice trait when it reaches the
 * vice threshold, releasing them with a hysteresis dead-band so they do not
 * flicker (`coreConstants.ts`).
 *
 * Each trait is a graph node (type: 'trait') with `subcategory: 'core'` —
 * deliberately distinct from `'personality'` (the reach layer) and `'reputation'`
 * (how the *world* sees the agent). These describe the agent's bedrock character.
 *
 * ─── Invariant (load-bearing) ───────────────────────────────────
 * Core traits carry NO `domainContributions` (they are never capability) and NO
 * `scoringModifiers` (they are never a reach-selection bias — that is the reach
 * personality layer's job). The Core *seeds*, *colours*, and *bends* the reaches
 * (see `coreMechanics.ts`); it does not add a parallel reach-scoring axis. A Core
 * trait is a pure character descriptor that surfaces in prose. Keeping
 * `scoringModifiers` empty is what holds the Core ≠ reach separation
 * (`coreRegistry.ts` canon-safe framing) — do not "wire it into scoring".
 *
 * ─── Constants (NFP #1) ─────────────────────────────────────────
 * Emergence thresholds live in `engine/core/coreConstants.ts`, expressed on the
 * canonical 0–1 Core scale (0.5 neutral, virtue 1.0, vice 0.0).
 *
 * Definitions are derived from the canonical Core registry (`coreRegistry.ts`) so
 * the pole labels can never drift from the THR-542 Core vocabulary.
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties } from '../types/traits';
import { CORE_CONTINUA, type CoreContinuum } from '../types/coreRegistry';

type PoleSide = 'virtue' | 'vice';

/**
 * One authored flavor line per (continuum, pole). Plain, concrete, present-tense
 * Threadbare voice — the crystallized character, where the origin vignettes are
 * the pre-history soil. Keyed by continuum id so it tracks the registry.
 */
const FLAVOR: Record<string, { virtue: string; vice: string }> = {
  core_warmth: {
    virtue: 'Moves toward whoever is hurting, without being asked.',
    vice: 'Sees others as weather — useful or in the way, never warm.',
  },
  core_hope: {
    virtue: 'Looks for the door in every wall, and usually finds one.',
    vice: 'Reads each good turn as the bait before the trap.',
  },
  core_forgiveness: {
    virtue: 'Sets a wrong down once it is answered, and does not pick it back up.',
    vice: 'Keeps the ledger of every harm, and the ledger is never closed.',
  },
  core_humility: {
    virtue: 'Holds their own measure lightly, and can be told they are wrong.',
    vice: 'Stands at the center of their own world, and corrects the horizon.',
  },
  core_integrity: {
    virtue: 'Is one person all the way down — the shown self and the real one match.',
    vice: 'Keeps the face and the truth in separate rooms.',
  },
};

// ─── Trait Definition Builder ───────────────────────────────────────────────

/** Stable trait id. Format: `trait.core.<continuumId>.<pole>`. */
function coreTraitId(continuumId: string, pole: PoleSide): string {
  return `trait.core.${continuumId}.${pole}`;
}

function buildCoreTrait(continuum: CoreContinuum, pole: PoleSide): GraphNode {
  const sidePole = pole === 'virtue' ? continuum.virtue : continuum.vice;
  const flavor = FLAVOR[continuum.continuumId]?.[pole] ?? '';

  const properties: TraitDefinitionProperties = {
    subcategory: 'core',
    description:
      `Their character has settled toward ${sidePole.word.toLowerCase()} — ` +
      `${continuum.governs}.`,
    importance: 0.7,
    // Binary present/absent: Core traits crystallize and dissolve, they do not level.
    maxLevel: 1,
    visibility: 'public',
    // Empty by invariant: the Core is never capability.
    domainContributions: {},
    tags: ['#core', `#${continuum.continuumId}`, `#${pole}`],
    flavorText: flavor,
    // No scoringModifiers by invariant: the Core never adds a reach-selection bias.
  };

  return {
    id: coreTraitId(continuum.continuumId, pole),
    type: 'trait',
    name: sidePole.word,
    properties: properties as unknown as Record<string, unknown>,
  };
}

// ─── Exports ────────────────────────────────────────────────────────────────

/** All 10 emergent Core trait definition nodes (5 continuums × virtue/vice). */
export const CORE_TRAIT_DEFINITIONS: GraphNode[] = CORE_CONTINUA.flatMap(
  (continuum) => [buildCoreTrait(continuum, 'virtue'), buildCoreTrait(continuum, 'vice')],
);

/**
 * continuumId → { virtue, vice } trait ids, for the `core_personality` phase to
 * grant/release as the held emergence set changes.
 */
export const CORE_TRAIT_BY_CONTINUUM: Record<string, { virtue: string; vice: string }> =
  CORE_CONTINUA.reduce(
    (acc, continuum) => {
      acc[continuum.continuumId] = {
        virtue: coreTraitId(continuum.continuumId, 'virtue'),
        vice: coreTraitId(continuum.continuumId, 'vice'),
      };
      return acc;
    },
    {} as Record<string, { virtue: string; vice: string }>,
  );
