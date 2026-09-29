/**
 * Innate Powers — what a monster is born able to do (THR-1671, power runtime S3;
 * plan doc `Docs/plans/2026-09-29-thr-1571-power-runtime.md` § Content, "Eight innate
 * powers").
 *
 * The Power kind's third class, beside the bestowal a god gives and the spell a mortal
 * learns: a power that is **anatomy**. Nothing taught it and nothing granted it — the
 * creature is simply the kind of thing that can do this. One shared definition node per
 * monster family (`power.innate.<family>`), never one per bearer (THR-1395); a lair's
 * elite is minted with its family's power as a `has_trait` edge (`source: 'innate'`) in
 * `createNamedElite` (`stampInnatePower`, `src/engine/monsters/innatePower.ts`).
 *
 * **Fate-woven only.** An innate power is never cast: its effects ride the shared node,
 * and the effect walker applies them to the bearer through the `has_trait` edge it
 * already walks. Because the node is shared by every elite of the family, only the
 * stateless primitives a carried spell may hold are allowed here
 * (`isCarriedEffectStateless`, THR-1571 lane decision 6) — `innatePowers.test.ts`
 * holds the rule at build time, and every primitive is a `live` row in the honest
 * vocabulary.
 *
 * **Where they are read.**
 * - `passive` — the fight block folds an opponent's own modifiers for the step's reach
 *   into the step's difficulty (`resolveFightStepInputs`, `opponentModifierDelta`), so
 *   a monster's passive on its clash or nerve reach makes it harder to beat. Its own
 *   rolls (an elite still resolves encounters at its lair) read it too.
 * - `aura` — read at resolution for every mortal standing on the monster's hex
 *   (`collectAuraContributions`). Authored `target: 'all'`, not `'enemies'`: an
 *   `'enemies'` aura needs two hostile *factions* (`areFactionsHostile`), and a lair's
 *   elite has none, so an `'enemies'` aura on it would never apply. Radius 0 keeps it
 *   to the ground the creature stands on — in practice, whoever came to fight it.
 * - `test_shaper` — rescues the bearer's *own* rolls, so it works when the monster
 *   itself rolls (its lair encounters). A monster fought as a card does not roll, so
 *   these two shape no fighter's step; they are anatomy the creature uses, not a price
 *   laid on its challenger.
 *
 * **Thick Hide.** The plan's table reads `passive { iron, +0.05 }, in_combat`. It is
 * authored as a plain passive: `conditional { in_combat }` on Iron is a passive in
 * disguise (`ITEM_HONEST_CONDITION_OWN_REACHES` — `in_combat` *is* an Iron step or a
 * fight exchange), and the honest vocabulary refuses that shape.
 */

import type { GraphNode } from '../types/graph';
import type { AttachmentEffect } from '../types/effects';
import type { MonsterFamilyId } from '../types/monster';
import type { SphereName } from '../types/index';

/** The id namespace of the Power kind's innate class. */
export const INNATE_POWER_ID_PREFIX = 'power.innate.';

/** The `has_trait` edge `source` an innate power is stamped with. */
export const INNATE_POWER_SOURCE = 'innate';

/** The id of a family's innate power definition node. */
export function innatePowerId(family: MonsterFamilyId): string {
  return `${INNATE_POWER_ID_PREFIX}${family}`;
}

interface InnatePowerSpec {
  readonly family: MonsterFamilyId;
  readonly sphere: SphereName;
  readonly name: string;
  /** One sentence for the sheet: what the creature is, said as what it does. */
  readonly description: string;
  /** What the power does, in game words — the sheet's summary line. */
  readonly mechanicalSummary: string;
  readonly flavorText: string;
  readonly effects: readonly AttachmentEffect[];
}

/** The eight, one per family, in `MONSTER_FAMILIES` order. */
const INNATE_POWER_SPECS: readonly InnatePowerSpec[] = [
  {
    family: 'beast', sphere: 'force', name: 'Thick Hide',
    description: 'Its hide turns blades that would open a man.',
    mechanicalSummary: 'Harder to beat at Iron.',
    flavorText: 'The first blow glances off, and so does the second.',
    effects: [{ type: 'passive', reach: 'iron', value: 0.05 }],
  },
  {
    family: 'golem', sphere: 'matter', name: 'Stone Body',
    description: 'It is made of the ground itself, and the ground does not yield.',
    mechanicalSummary: 'Harder to beat at Stone.',
    flavorText: 'You cannot tire a hillside.',
    effects: [{ type: 'passive', reach: 'stone', value: 0.06 }],
  },
  {
    family: 'stormkin', sphere: 'energy', name: 'Crackling Air',
    description: 'The air around it snaps and stings, and every hand near it shakes.',
    mechanicalSummary: 'Anyone standing on its ground is a little worse at Iron.',
    flavorText: 'Hair stands up, teeth ache, and a grip on a sword goes loose.',
    effects: [{ type: 'aura', radius: 0, target: 'all', reach: 'iron', value: -0.03 }],
  },
  {
    family: 'behemoth', sphere: 'life', name: 'Deep Vigour',
    description: 'It has more life in it than any wound can find.',
    mechanicalSummary: 'In a fight, what it nearly manages, it manages.',
    flavorText: 'It bleeds, and keeps coming, and bleeds, and keeps coming.',
    effects: [{ type: 'test_shaper', trigger: 'near_miss', steps: 1, condition: 'in_combat' }],
  },
  {
    family: 'mindthing', sphere: 'mind', name: 'Wrong Thoughts',
    description: 'Near it, a person\'s own thoughts start to sound like someone else\'s.',
    mechanicalSummary: 'Anyone standing on its ground is a little worse at Heart.',
    flavorText: 'Courage is a thought too, and it can be reached.',
    effects: [{ type: 'aura', radius: 0, target: 'all', reach: 'heart', value: -0.04 }],
  },
  {
    family: 'wraith', sphere: 'spirit', name: 'Half There',
    description: 'It is only partly in the world, and the rest of it is hard to find.',
    mechanicalSummary: 'Harder to beat at Shadow.',
    flavorText: 'It stands where you are looking, and also where you are not.',
    effects: [{ type: 'passive', reach: 'shadow', value: 0.06 }],
  },
  {
    family: 'echo', sphere: 'time', name: 'Already Moving',
    description: 'It has done this before, and it knows what you are about to do.',
    mechanicalSummary: 'In a fight, what it barely fails at becomes a near miss.',
    flavorText: 'It steps aside from the strike before the strike begins.',
    effects: [{ type: 'test_shaper', trigger: 'failure', steps: 1, condition: 'in_combat', maxMargin: 0.05 }],
  },
  {
    family: 'blight', sphere: 'entropy', name: 'Rot Breath',
    description: 'Its breath softens whatever it touches, stone and nerve alike.',
    mechanicalSummary: 'Anyone standing on its ground is a little worse at Stone.',
    flavorText: 'Mortar crumbles, leather sags, and resolve goes soft at the edges.',
    effects: [{ type: 'aura', radius: 0, target: 'all', reach: 'stone', value: -0.04 }],
  },
];

function innatePowerDef(spec: InnatePowerSpec): GraphNode {
  return {
    id: innatePowerId(spec.family),
    type: 'trait',
    name: spec.name,
    properties: {
      subcategory: 'innate_power',
      family: spec.family,
      sphereAffinity: spec.sphere,
      tier: 2,
      description: spec.description,
      mechanicalSummary: spec.mechanicalSummary,
      flavorText: spec.flavorText,
      importance: 0.5,
      maxLevel: 1,
      visibility: 'public',
      domainContributions: {},
      tags: ['#flesh', '#supernatural', '#combat'],
      agency: 'fate_woven',
      effects: spec.effects.map(e => ({ ...e })),
    },
  };
}

/**
 * The eight definitions. Seeded at world init beside the spell definitions
 * (`seedAttachments`), and minted on demand by `stampInnatePower` for a world seeded
 * before this class existed.
 */
export const INNATE_POWER_DEFINITIONS: readonly GraphNode[] = INNATE_POWER_SPECS.map(innatePowerDef);

/** The definition for one family, or undefined for an unknown family. */
export function innatePowerDefinition(family: string): GraphNode | undefined {
  return INNATE_POWER_DEFINITIONS.find(n => n.id === `${INNATE_POWER_ID_PREFIX}${family}`);
}
