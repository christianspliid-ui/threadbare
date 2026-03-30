/**
 * Monster Encounter Content — m2.5 Monster Encounters
 *
 * Templates for monster-related encounters: lair hunts, wilderness ambushes,
 * lair defense, and horde raids. These templates fire at lair and wilderness
 * hexes and are discoverable via getAnyEncounterById.
 *
 * Registered into the encounter pool via encounter-content.ts getAnyEncounterById.
 * Wired into Adventuring Guild questTemplateIds in faction-definitions.ts.
 *
 * NFP: All difficulty numbers are named constants (Tunability).
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Tunable Constants ──────────────────────────────────────────────────────

/** Base difficulty for a minor monster hunt — easy tier */
const MINOR_HUNT_DIFFICULTY_BASE = 25;

/** Difficulty escalation per step in minor hunt */
const MINOR_HUNT_DIFFICULTY_STEP = 10;

/** Base difficulty for a named elite confrontation — hard tier */
const ELITE_HUNT_DIFFICULTY_BASE = 45;

/** Difficulty escalation per step in elite hunt */
const ELITE_HUNT_DIFFICULTY_STEP = 15;

/** Base difficulty for wilderness ambush — moderate tier */
const AMBUSH_DIFFICULTY_BASE = 35;

/** Difficulty escalation per step in ambush */
const AMBUSH_DIFFICULTY_STEP = 10;

/** Base difficulty for lair defense encounter — hard tier */
const LAIR_DEFENSE_DIFFICULTY_BASE = 40;

/** Difficulty escalation per step in lair defense */
const LAIR_DEFENSE_DIFFICULTY_STEP = 15;

/** Base difficulty for horde raid on settlement — deadly tier */
const HORDE_RAID_DIFFICULTY_BASE = 55;

/** Difficulty escalation per step in horde raid */
const HORDE_RAID_DIFFICULTY_STEP = 15;

// ─── Monster Encounter Templates ────────────────────────────────────────────

/**
 * All monster encounter templates. Discoverable via getAnyEncounterById.
 *
 * Templates:
 * - monster.hunt.minor       — Agent clears a minor lair. Adventuring Guild quest.
 * - monster.hunt.named_elite — Agent confronts a named elite monster. Requires senior tier.
 * - monster.encounter.ambush — Generic wilderness ambush. No lair required.
 * - monster.encounter.lair_defense — Army enters lair hex, triggers defenders.
 * - monster.encounter.horde_raid   — Monster army attacks settlement.
 */
export const MONSTER_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // ── monster.hunt.minor ───────────────────────────────────────────────────
  {
    id: 'monster.hunt.minor',
    name: 'Clear the Minor Lair',
    locationTypes: ['lair', 'wilderness'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'easy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 3.0,
    steps: [
      {
        id: 'monster.hunt.minor.1',
        name: 'Scout the Lair',
        narrative: 'Tracks and claw marks mark the approaches. {actor} studies the entrances and gauges the beast inside.',
        reach: 'eye',
        difficulty: MINOR_HUNT_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: '{actor} finds a narrow approach that avoids the creature\'s favored paths.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The entrance is more maze-like than expected. {actor} must press forward with less certainty.',
        },
      },
      {
        id: 'monster.hunt.minor.2',
        name: 'Drive Out the Creature',
        narrative: 'Steel glints in the dim hollow. The beast turns to face {actor}, teeth bared.',
        reach: 'iron',
        difficulty: MINOR_HUNT_DIFFICULTY_BASE + MINOR_HUNT_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: 'The creature falls. {actor} drives it from the lair and ensures it will not return.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The beast is stronger than the reports suggested. {actor} retreats, wounded and empty-handed.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // ── monster.hunt.named_elite ─────────────────────────────────────────────
  {
    id: 'monster.hunt.named_elite',
    name: 'The Named Beast',
    locationTypes: ['lair'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    questPriority: 5.0,
    steps: [
      {
        id: 'monster.hunt.named_elite.1',
        name: 'Approach the Lair',
        narrative: 'This creature has a name whispered in the taverns — and a history of broken hunters. {actor} prepares carefully.',
        reach: 'eye',
        difficulty: ELITE_HUNT_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: {
          narrative: '{actor} locates the creature\'s resting chamber and prepares an ambush position.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The lair is labyrinthine. {actor} reaches the inner sanctum exposed and breathless.',
        },
      },
      {
        id: 'monster.hunt.named_elite.2',
        name: 'The Confrontation',
        narrative: 'The named beast roars — a sound that has ended lesser careers. {actor} holds ground.',
        reach: 'iron',
        difficulty: ELITE_HUNT_DIFFICULTY_BASE + ELITE_HUNT_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'Blow by blow, {actor} wears down the creature\'s defenses and lands the killing strike.',
          reputationDelta: 0.08,
        },
        onFailure: {
          narrative: 'The elite creature overpowers {actor}. A costly retreat is the only option today.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'monster.hunt.named_elite.3',
        name: 'The Final Reckoning',
        narrative: 'Cornered and enraged, the named beast makes its last stand.',
        reach: 'iron',
        difficulty: ELITE_HUNT_DIFFICULTY_BASE + ELITE_HUNT_DIFFICULTY_STEP * 2,
        duration: 2,
        onSuccess: {
          narrative: 'The named beast falls. Its name will be spoken in reverence now — attached to {actor}\'s own legend.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The beast escapes deeper into the lair. It will be stronger next time.',
          reputationDelta: -0.03,
        },
      },
    ],
  },

  // ── monster.encounter.ambush ─────────────────────────────────────────────
  {
    id: 'monster.encounter.ambush',
    name: 'Wilderness Ambush',
    locationTypes: ['wilderness'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'moderate',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'monster.encounter.ambush.1',
        name: 'Sense the Danger',
        narrative: 'Something stirs in the bracken ahead. {actor}\'s instincts fire a warning.',
        reach: 'eye',
        difficulty: AMBUSH_DIFFICULTY_BASE,
        duration: 1,
        onSuccess: {
          narrative: '{actor} spots movement before the attack lands — a precious half-second of advantage.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The creature erupts from cover. {actor} is caught flat-footed.',
        },
      },
      {
        id: 'monster.encounter.ambush.2',
        name: 'Repel the Attacker',
        narrative: 'The wilderness predator presses its advantage. {actor} must turn the tide.',
        reach: 'iron',
        difficulty: AMBUSH_DIFFICULTY_BASE + AMBUSH_DIFFICULTY_STEP,
        duration: 2,
        onSuccess: {
          narrative: '{actor} drives the creature off. The wilds are a little quieter for now.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The creature withdraws on its own terms, leaving {actor} shaken and bloodied.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // ── monster.encounter.lair_defense ──────────────────────────────────────
  {
    id: 'monster.encounter.lair_defense',
    name: 'Lair Defenders',
    locationTypes: ['lair'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'lead',
    threatRating: 'hard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'monster.encounter.lair_defense.1',
        name: 'Formation Under Fire',
        narrative: 'The lair\'s denizens swarm the army\'s vanguard. {actor} must hold the line.',
        reach: 'stone',
        difficulty: LAIR_DEFENSE_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: {
          narrative: '{actor} keeps the formation intact. The first wave breaks against disciplined shields.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'Confusion ripples through the ranks as the creatures scatter the vanguard.',
        },
      },
      {
        id: 'monster.encounter.lair_defense.2',
        name: 'Drive Through the Horde',
        narrative: 'The main body of defenders pours out. Every step forward costs.',
        reach: 'iron',
        difficulty: LAIR_DEFENSE_DIFFICULTY_BASE + LAIR_DEFENSE_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The army cuts through the resistance and secures the lair. A costly victory.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The defenders hold. The army is forced to withdraw with significant Quintessence loss.',
          reputationDelta: -0.04,
        },
      },
    ],
  },

  // ── monster.encounter.horde_raid ─────────────────────────────────────────
  {
    id: 'monster.encounter.horde_raid',
    name: 'The Horde at the Gates',
    locationTypes: ['hamlet', 'town', 'city', 'capital'],
    reachPrimary: 'iron',
    reachSecondary: 'stone',
    encounterType: 'lead',
    threatRating: 'deadly',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'monster.encounter.horde_raid.1',
        name: 'Organize the Defense',
        narrative: 'Horns echo in the distance. The horde is hours away. {actor} must rally the settlement.',
        reach: 'stone',
        difficulty: HORDE_RAID_DIFFICULTY_BASE,
        duration: 2,
        onSuccess: {
          narrative: 'Barricades rise and defenders take their positions. The settlement has a fighting chance.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'Panic spreads faster than orders. The defense is ragged when the horde arrives.',
        },
      },
      {
        id: 'monster.encounter.horde_raid.2',
        name: 'Repel the First Wave',
        narrative: 'The horde crashes against the walls. {actor} fights at the breach.',
        reach: 'iron',
        difficulty: HORDE_RAID_DIFFICULTY_BASE + HORDE_RAID_DIFFICULTY_STEP,
        duration: 3,
        onSuccess: {
          narrative: 'The first wave falters. The horde\'s momentum is broken against {actor}\'s resolve.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The breach widens. {actor} falls back to the inner defenses.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'monster.encounter.horde_raid.3',
        name: 'Drive the Horde Back',
        narrative: 'The settlement\'s fate rests on this final push.',
        reach: 'iron',
        difficulty: HORDE_RAID_DIFFICULTY_BASE + HORDE_RAID_DIFFICULTY_STEP * 2,
        duration: 3,
        onSuccess: {
          narrative: 'The horde breaks and scatters into the wilderness. The settlement survives.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The settlement falls. Survivors scatter into the night as the horde claims the ruins.',
          reputationDelta: -0.06,
        },
      },
    ],
  },
];

// ─── Lookup ──────────────────────────────────────────────────────────────────

/**
 * Look up a monster encounter template by ID.
 * Returns undefined if not found — callers should use getAnyEncounterById instead.
 */
export function getMonsterEncounterById(id: string): EncounterTemplate | undefined {
  return MONSTER_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}
