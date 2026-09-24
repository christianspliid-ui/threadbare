/**
 * Temper Trait Content Package — how a creature breaks when a fight turns
 * (THR-1544, plan doc `Docs/plans/2026-09-23-monsters-as-opponents.md` § Content).
 *
 * Four trait definitions, one per `FightTemper`. A lair's elite is minted with its
 * family's temper as a `has_trait` edge (`createNamedElite`); the fight block's
 * `readTemper` reads it back by id prefix (`FIGHT_TEMPER_TRAIT_PREFIX`) at the
 * fight's temper checkpoint.
 *
 * **Why a Trait, not a property.** Temper is part of what a creature *is*, and a
 * trait edge is what spells, items and cards can later change through the existing
 * `trait_grant` vocabulary — calm a berserk beast, enrage a skittish one — with no
 * new writer (THR-1268 §2, THR-1530 §5).
 *
 * **Not an Innate Power, and not the `innate` class.** An Innate Power is something a
 * creature can *do*; temper is how it *breaks*. `innate` is a worldgen-minted
 * permanent class. Temper traits carry their own class, `subcategory: 'temper'`.
 *
 * **Lifecycle.** Minted at `createNamedElite`; permanent; changed only by
 * `trait_grant` or removal; read at the fight's temper checkpoint.
 *
 * No capability contributions: a temper moves no reach. Each entry carries its class
 * word `#temper` on the family axis, the way conditions carry `#condition`.
 */

import type { GraphNode } from '../types/graph';
import type { FightTemper } from '../types/fight';
import type { TraitDefinitionProperties } from '../types/traits';
import { FIGHT_TEMPER_TRAIT_PREFIX } from './fight-constants';

/** The id namespace that declares a temper trait. Same string the fight reads. */
export const TEMPER_TRAIT_ID_PREFIX = FIGHT_TEMPER_TRAIT_PREFIX;

/** The trait id for a temper. */
export function temperTraitId(temper: FightTemper): string {
  return `${TEMPER_TRAIT_ID_PREFIX}${temper}`;
}

/** The one word a surface shows for each temper (the tooltip word). */
export const TEMPER_WORDS: Readonly<Record<FightTemper, string>> = {
  stubborn: 'stubborn',
  berserk: 'berserk',
  skittish: 'skittish',
  bargainer: 'bargains',
};

function temperDef(
  temper: FightTemper,
  name: string,
  description: string,
  flavorText: string,
): GraphNode {
  return {
    id: temperTraitId(temper),
    type: 'trait',
    name,
    properties: {
      subcategory: 'temper',
      description,
      importance: 0.4,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: {},
      tags: ['#temper'],
      flavorText,
    } satisfies TraitDefinitionProperties,
  };
}

/**
 * The four definitions. Seeded at world init through `seedEncounterTraitDefinitions`
 * (they join `ENCOUNTER_TRAIT_DEFINITIONS`).
 */
export const TEMPER_TRAIT_DEFINITIONS: readonly GraphNode[] = [
  temperDef(
    'stubborn',
    'Stubborn',
    'When the fight turns against it, this creature digs in and will not give ground.',
    'Wounded, it only plants its feet harder.',
  ),
  temperDef(
    'berserk',
    'Berserk',
    'When the fight turns against it, this creature goes wild and hits harder for the rest of the fight.',
    'Pain does not slow it. Pain makes it worse.',
  ),
  temperDef(
    'skittish',
    'Skittish',
    'When the fight turns against it, this creature looks for a way out and may flee.',
    'Hurt it badly enough and it remembers it has somewhere else to be.',
  ),
  temperDef(
    'bargainer',
    'Bargains',
    'When the fight turns against it, this creature offers terms instead of dying.',
    'It would rather make a deal than make a last stand.',
  ),
];

/** Every temper trait id, derived from the definitions. */
export const TEMPER_TRAIT_IDS: readonly string[] = TEMPER_TRAIT_DEFINITIONS.map(n => n.id);
