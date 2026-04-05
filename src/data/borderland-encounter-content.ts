/**
 * Borderland Encounter Content — Easy & Trivial Combat for Frontier Agents
 *
 * 20 templates covering bandits, outlaws, wild beasts, scavengers, and
 * minor supernatural threats found in borderland terrain: wilderness,
 * camps, ruins, farmland, and frontier settlements.
 *
 * Designed for beginner agents (capability ~0.05–0.25) so they have a
 * varied pool of low-danger encounters to cut their teeth on before
 * graduating to monster hunts, faction work, or mid-game content.
 *
 * Registered into the encounter pool via encounter-content.ts getAnyEncounterById.
 *
 * NFP: All difficulty numbers are named constants (Tunability).
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Tunable Constants ──────────────────────────────────────────────────────

/** Difficulty base for trivial borderland encounters (fresh agents) */
const TRIVIAL_DIFFICULTY_BASE = 5;

/** Difficulty step per stage in trivial encounters */
const TRIVIAL_DIFFICULTY_STEP = 5;

/** Difficulty base for easy borderland encounters (early-career agents) */
const EASY_DIFFICULTY_BASE = 12;

/** Difficulty step per stage in easy encounters */
const EASY_DIFFICULTY_STEP = 6;

// ─── Borderland Encounter Templates ─────────────────────────────────────────

export const BORDERLAND_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  //  BANDITS & OUTLAWS (7 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 1. Roadside Shakedown (trivial) ────────────────────────────────────────
  {
    id: 'borderland.roadside_shakedown',
    name: 'Roadside Shakedown',
    locationTypes: ['wilderness', 'camp', 'farmland'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'roadside_shakedown.confront',
        name: 'Stand Your Ground',
        reach: 'iron',
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A lone figure steps onto the path, blade drawn with {adj} bravado. "Your coin or your blood." {actor} sizes them up.',
        onSuccess: {
          narrative: '{actor} draws steel and the would-be robber\'s courage evaporates. They bolt into the brush.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The outlaw is quicker than expected. {actor} loses a few coins before driving them off.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'roadside_shakedown.pursue',
        name: 'Give Chase',
        reach: 'heart',
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The robber crashes through the undergrowth. {actor} can let them go — or finish this.',
        onSuccess: {
          narrative: '{actor} catches the fleeing outlaw and recovers the stolen goods. A {adj} start to a reputation.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The outlaw knows these paths better. {actor} loses them in the thicket.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── 2. Bandit Scouts (easy) ────────────────────────────────────────────────
  {
    id: 'borderland.bandit_scouts',
    name: 'Bandit Scouts',
    locationTypes: ['wilderness', 'camp', 'ruins'],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'bandit_scouts.spot',
        name: 'Spot the Lookouts',
        reach: 'eye',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Movement in the tree line — a glint of metal, a cough stifled too late. {actor} has company.',
        onSuccess: {
          narrative: '{actor} spots both scouts before they notice {them}. The advantage belongs to the aware.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'One of the scouts whistles a warning. The element of surprise belongs to them now.',
        },
      },
      {
        id: 'bandit_scouts.drive_off',
        name: 'Drive Them Off',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Two against one, but they are scouts — not fighters. {actor} must make them regret choosing this stretch of road.',
        onSuccess: {
          narrative: 'The scouts scatter, {adj} and bleeding. They will report this road is not worth the trouble.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The scouts disengage on their own terms. They have seen enough — and {actor} is now marked.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // ── 3. Toll Bridge Bully (trivial) ─────────────────────────────────────────
  {
    id: 'borderland.toll_bridge_bully',
    name: 'Toll Bridge Bully',
    locationTypes: ['wilderness', 'farmland', 'hamlet'],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'honesty_cunning'],
    steps: [
      {
        id: 'toll_bridge.negotiate',
        name: 'Challenge the Toll',
        reach: 'heart',
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A heavyset brute blocks the crossing, demanding coin for passage. No badge, no authority — just muscle and bluster.',
        onSuccess: {
          narrative: '{actor} stares the bully down. Something in {their} eyes convinces the thug this mark is not worth the bruises.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The bully holds firm. {actor} pays the toll — galling, but the road ahead is long.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'toll_bridge.resolve',
        name: 'Settle the Matter',
        reach: 'iron',
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The bully swings first — a slow, {adj} haymaker that says more about drink than training.',
        onSuccess: {
          narrative: '{actor} sidesteps and puts the bully on the ground. The crossing is open.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The bully is stronger than expected. {actor} retreats across the ford instead.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── 4. Outlaw Camp Raid (easy) ─────────────────────────────────────────────
  {
    id: 'borderland.outlaw_camp',
    name: 'Outlaw Camp',
    locationTypes: ['wilderness', 'camp', 'ruins'],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'steal',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['honesty_cunning', 'courage_prudence'],
    steps: [
      {
        id: 'outlaw_camp.approach',
        name: 'Scout the Camp',
        reach: 'shadow',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Smoke rises from a hidden dell — a bandit camp, poorly hidden. {actor} counts heads and plans {their} approach.',
        onSuccess: {
          narrative: '{actor} maps every sentry post, every escape route. The outlaws are {adj} complacent.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'A snapping branch alerts the nearest sentry. {actor} must improvise.',
        },
      },
      {
        id: 'outlaw_camp.strike',
        name: 'Strike the Camp',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Three outlaws around a fire, weapons within reach. {actor} has seconds before they arm themselves.',
        onSuccess: {
          narrative: '{actor} scatters the camp before the outlaws can form up. They flee into the woods clutching what they can carry.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.7, condition: 0.3 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The outlaws fight back with {adj} desperation. {actor} withdraws before being surrounded.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // ── 5. Desperate Deserter (trivial) ────────────────────────────────────────
  {
    id: 'borderland.desperate_deserter',
    name: 'Desperate Deserter',
    locationTypes: ['wilderness', 'farmland', 'camp', 'ruins'],
    reachPrimary: 'heart',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        id: 'desperate_deserter.encounter',
        name: 'Face the Fugitive',
        reach: 'heart',
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A ragged figure in torn soldier\'s garb lunges from the ditch, knife in hand. Hunger has made {them} reckless.',
        onSuccess: {
          narrative: '{actor} disarms the deserter with {adj} ease. The fight drains from them immediately.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The deserter\'s desperation gives them an edge. {actor} takes a shallow cut before gaining control.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'desperate_deserter.decide',
        name: 'Decide Their Fate',
        reach: 'iron',
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The deserter kneels, weapon dropped. Starving and terrified. {actor} must decide what mercy looks like out here.',
        onSuccess: {
          narrative: '{actor} handles the situation cleanly — the deserter is dealt with and the road is safer for it.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The deserter bolts while {actor} hesitates. Another problem left for the next traveler.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── 6. Caravan Thieves (easy) ──────────────────────────────────────────────
  {
    id: 'borderland.caravan_thieves',
    name: 'Caravan Thieves',
    locationTypes: ['wilderness', 'farmland', 'hamlet'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'caravan_thieves.intercept',
        name: 'Catch Them in the Act',
        reach: 'eye',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Shouts ahead — a merchant\'s wagon tilted in a ditch, two figures rifling through the cargo. {actor} arrives mid-theft.',
        onSuccess: {
          narrative: '{actor} reads the situation instantly — the merchant is pinned, the thieves are distracted.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'By the time {actor} understands what is happening, the thieves have already grabbed the most valuable crate.',
        },
      },
      {
        id: 'caravan_thieves.fight',
        name: 'Drive Off the Thieves',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The thieves draw short blades — they would rather fight than lose their haul.',
        onSuccess: {
          narrative: '{actor} puts both thieves to flight. The grateful merchant offers a reward and a name worth remembering.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The thieves hold their ground long enough to escape with half the goods. The merchant is {adj} unhappy.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // ── 7. Smuggler's Stash (easy) ─────────────────────────────────────────────
  {
    id: 'borderland.smugglers_stash',
    name: 'Smuggler\'s Stash',
    locationTypes: ['ruins', 'camp', 'wilderness'],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['honesty_cunning', 'asceticism_extravagance'],
    steps: [
      {
        id: 'smugglers_stash.find',
        name: 'Discover the Cache',
        reach: 'eye',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Fresh bootprints leading to a collapsed wall. Behind the rubble — crates that do not belong here.',
        onSuccess: {
          narrative: '{actor} finds the hidden cache: goods marked with {adj} false merchant seals. Someone will come back for these.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The cache is better hidden than expected. {actor} finds only a few loose items before the trail goes cold.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'smugglers_stash.claim',
        name: 'Claim or Report',
        reach: 'shadow',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Footsteps approaching — the smugglers are returning. {actor} must decide quickly: confront, hide, or vanish with evidence.',
        onSuccess: {
          narrative: '{actor} slips away with proof of the operation. The smugglers return to find their stash compromised.',
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The smugglers spot {actor} and give chase. Nothing gained but a {adj} lesson about timing.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#shadow'],
          },
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  WILD BEASTS & NATURAL THREATS (7 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 8. Feral Dogs (trivial) ────────────────────────────────────────────────
  {
    id: 'borderland.feral_dogs',
    name: 'Feral Dog Pack',
    locationTypes: ['wilderness', 'farmland', 'ruins', 'ruined_village'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'feral_dogs.face',
        name: 'Face the Pack',
        reach: 'iron',
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Growling from three sides. A pack of gaunt, wild dogs circles {actor}, testing for weakness.',
        onSuccess: {
          narrative: '{actor} stamps forward with a shout. The pack leader flinches, and the rest follow it into retreat.',
          reputationDelta: 0.01,
        },
        onFailure: {
          narrative: 'The dogs sense hesitation. One darts in and snaps at {actor}\'s calf before retreating.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'feral_dogs.scatter',
        name: 'Break the Pack',
        reach: 'eye',
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The dogs regroup, emboldened. {actor} must convince them this prey is too dangerous.',
        onSuccess: {
          narrative: 'A stone strikes the pack leader squarely. The dogs scatter into the brush — hunger will have to wait.',
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'The pack circles once more before losing interest. {actor} passes through, bitten and wary.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── 9. Territorial Boar (easy) ─────────────────────────────────────────────
  {
    id: 'borderland.territorial_boar',
    name: 'Territorial Boar',
    locationTypes: ['wilderness', 'farmland'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'territorial_boar.charge',
        name: 'Weather the Charge',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The undergrowth explodes. A massive boar, tusks scarred from old fights, charges directly at {actor}.',
        onSuccess: {
          narrative: '{actor} sidesteps the charge and the boar plows past, crashing into a thicket.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The boar catches {actor} with a glancing blow. Tusks and momentum are a {adj} combination.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'territorial_boar.finish',
        name: 'Stand or Retreat',
        reach: 'eye',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The boar wheels around, snorting, pawing the earth. It is deciding whether {actor} is worth another charge.',
        onSuccess: {
          narrative: '{actor} holds ground and the boar thinks better of it, retreating into the trees with a final snort.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'The boar charges again. {actor} scrambles up a tree and waits for it to lose interest.',
          reputationDelta: -0.01,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
        },
      },
    ],
  },

  // ── 10. Venomous Serpent (trivial) ─────────────────────────────────────────
  {
    id: 'borderland.venomous_serpent',
    name: 'Venomous Serpent',
    locationTypes: ['wilderness', 'ruins', 'camp'],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'venomous_serpent.spot',
        name: 'Spot the Snake',
        reach: 'eye',
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A dry rattle from the rocks beside the trail. Something coiled and venomous waits where {actor}\'s next step would land.',
        onSuccess: {
          narrative: '{actor} freezes mid-stride. The serpent is right there — seen just in time.',
          reputationDelta: 0.01,
        },
        onFailure: {
          narrative: 'Too late — the serpent strikes. {actor} pulls back but the fangs graze {their} boot.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'venomous_serpent.deal',
        name: 'Deal With It',
        reach: 'iron',
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The serpent rears, hood flared. {actor} needs a steady hand and quick reflexes.',
        onSuccess: {
          narrative: 'A swift strike pins the serpent. {actor} moves on, one {adj} danger crossed off the path.',
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'The serpent slithers into the rocks, and {actor} takes a long detour to avoid the nest.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── 11. Wolves at Dusk (easy) ──────────────────────────────────────────────
  {
    id: 'borderland.wolves_at_dusk',
    name: 'Wolves at Dusk',
    locationTypes: ['wilderness', 'camp', 'farmland'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'wolves_dusk.encircle',
        name: 'Hold Against the Pack',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Eyes catch the firelight — green, then gone. The wolves circle just beyond the edge of {actor}\'s campfire.',
        onSuccess: {
          narrative: '{actor} keeps the fire high and {their} back to a rock. The wolves probe but find no opening.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'A wolf darts in from behind. {actor} turns too slowly and the pack draws blood.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'wolves_dusk.break',
        name: 'Break Their Nerve',
        reach: 'shadow',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The alpha holds the pack together. If it loses conviction, the rest will scatter.',
        onSuccess: {
          narrative: '{actor} hurls a brand at the alpha. It yelps and the pack melts into the darkness.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'The wolves persist until dawn. {actor} survives the night, but barely — no sleep, no rest.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
        },
      },
    ],
  },

  // ── 12. Giant Spider Nest (easy) ───────────────────────────────────────────
  {
    id: 'borderland.spider_nest',
    name: 'Giant Spider Nest',
    locationTypes: ['ruins', 'wilderness', 'ruined_tower'],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'revelation_discretion'],
    steps: [
      {
        id: 'spider_nest.notice',
        name: 'Notice the Webs',
        reach: 'eye',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Gossamer threads catch the light between the crumbled pillars. Too thick for any common spider. {actor} studies the pattern.',
        onSuccess: {
          narrative: '{actor} maps the web pattern and finds the safe path through. The nest is avoidable — barely.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'A strand catches {actor}\'s sleeve. The vibration travels the web. Something stirs in the dark.',
        },
      },
      {
        id: 'spider_nest.escape',
        name: 'Clear the Nest',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'A spider the size of a hunting dog emerges from the shadows, legs tapping stone with {adj} precision.',
        onSuccess: {
          narrative: '{actor} drives the creature back with fire and steel. The web burns and the nest collapses.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The spider retreats deeper into its lair. {actor} backs away — some ruins are best left alone.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // ── 13. Swamp Lurker (easy) ────────────────────────────────────────────────
  {
    id: 'borderland.swamp_lurker',
    name: 'Swamp Lurker',
    locationTypes: ['wilderness', 'oasis'],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'swamp_lurker.detect',
        name: 'Read the Water',
        reach: 'eye',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The water is too still. Bubbles rise where no wind disturbs the surface. Something waits below.',
        onSuccess: {
          narrative: '{actor} catches the faintest ripple — the lurker is there, just beneath the surface, patient and hungry.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The water erupts. The lurker lunges and {actor} stumbles backward into the muck.',
        },
      },
      {
        id: 'swamp_lurker.fight',
        name: 'Fight on Treacherous Ground',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The creature rises — scaled, low-slung, all jaws and tail. The footing is {adj} treacherous.',
        onSuccess: {
          narrative: '{actor} finds solid ground and puts steel where it counts. The lurker thrashes once and sinks back into the murk.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'The swamp fights on the lurker\'s side. {actor} retreats to dry land, bruised and mud-caked.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
        },
      },
    ],
  },

  // ── 14. Carrion Birds (trivial) ────────────────────────────────────────────
  {
    id: 'borderland.carrion_birds',
    name: 'Carrion Bird Flock',
    locationTypes: ['wilderness', 'battleground', 'farmland'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'carrion_birds.defend',
        name: 'Fend Off the Flock',
        reach: 'iron',
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Oversized scavenger birds descend in a shrieking cloud, emboldened by hunger. {actor} swats at beaks and talons.',
        onSuccess: {
          narrative: '{actor} cracks a wing and the flock lifts, screaming. Easy prey they are not.',
          reputationDelta: 0.01,
        },
        onFailure: {
          narrative: 'The birds are relentless. {actor} suffers a dozen scratches before they lose interest.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'carrion_birds.secure',
        name: 'Secure Your Supplies',
        reach: 'eye',
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The birds circle, waiting. {actor} must protect {their} food and gear from another dive.',
        onSuccess: {
          narrative: '{actor} covers the supplies and lights a smoky torch. The flock drifts to easier pickings.',
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'One bird snatches a wrapped parcel. Minor loss, {adj} annoyance.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  //  RUINS SCAVENGERS & MINOR SUPERNATURAL (6 templates)
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 15. Ruins Scavengers (easy) ────────────────────────────────────────────
  {
    id: 'borderland.ruins_scavengers',
    name: 'Ruins Scavengers',
    locationTypes: ['ruins', 'ruined_village', 'ruined_city', 'ruined_tower'],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'honesty_cunning'],
    steps: [
      {
        id: 'ruins_scavengers.confront',
        name: 'Challenge the Looters',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'Figures crouch among the rubble, prying stones from old walls. They see {actor} and reach for weapons.',
        onSuccess: {
          narrative: '{actor} steps forward with blade drawn. The scavengers exchange glances and decide this fight is not worth it.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The scavengers hold their ground — they know these ruins and {actor} does not.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'ruins_scavengers.clear',
        name: 'Clear the Ruins',
        reach: 'shadow',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The deeper chambers may hold more looters — or worse. {actor} pushes further into the dark.',
        onSuccess: {
          narrative: 'The last of the scavengers flee through a collapsed wall. The ruins are clear, and {actor} has first pick of what remains.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.8, condition: 0.2 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The ruins are a maze. {actor} gets turned around and exits with nothing but dust on {their} boots.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  // ── 16. Restless Bones (easy) ──────────────────────────────────────────────
  {
    id: 'borderland.restless_bones',
    name: 'Restless Bones',
    locationTypes: ['ruins', 'battleground', 'ruined_village'],
    reachPrimary: 'iron',
    reachSecondary: 'veil',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'mercy_ruthlessness'],
    sphereAffinity: 'entropy',
    steps: [
      {
        id: 'restless_bones.disturb',
        name: 'Disturb the Dead',
        reach: 'veil',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'The soil shifts. A skeletal hand claws free, then another. Old bones drag themselves upright with {adj} purpose.',
        onSuccess: {
          narrative: '{actor} reads the signs — the binding is weak, the bones barely held together by spite.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The dead rise faster than expected. {actor} is surrounded before drawing steel.',
        },
      },
      {
        id: 'restless_bones.lay_rest',
        name: 'Lay Them to Rest',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Three shambling skeletons close in, rusty weapons raised. They move with {adj} mechanical hatred.',
        onSuccess: {
          narrative: '{actor} shatters the lead skeleton and the others collapse — the animating force too weak to sustain them alone.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#ancient'],
          },
        },
        onFailure: {
          narrative: 'The bones keep coming. {actor} retreats from the cursed ground, leaving the dead to their restless patrol.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#ancient'],
          },
        },
      },
    ],
  },

  // ── 17. Will-o-Wisp Trail (trivial) ────────────────────────────────────────
  {
    id: 'borderland.wisp_trail',
    name: 'Will-o\'-the-Wisp Trail',
    locationTypes: ['wilderness', 'oasis', 'ruins'],
    reachPrimary: 'eye',
    reachSecondary: 'veil',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['revelation_discretion', 'courage_prudence'],
    sphereAffinity: 'spirit',
    steps: [
      {
        id: 'wisp_trail.follow',
        name: 'Follow the Light',
        reach: 'eye',
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A pale light bobs through the trees ahead — too steady for firefly, too cold for torch. It wants to be followed.',
        onSuccess: {
          narrative: '{actor} keeps distance and tracks the wisp\'s path without losing the trail. It leads somewhere interesting.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The light dances away into the bog. {actor} finds {themselves} ankle-deep in muck with no path back.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'wisp_trail.resolve',
        name: 'Reach the Destination',
        reach: 'veil',
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The wisp hovers over a mossy stone, pulsing. Something is buried here — or bound.',
        onSuccess: {
          narrative: '{actor} finds an old offering cache beneath the stone. The wisp fades, its purpose fulfilled.',
          reputationDelta: 0.03,
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.5 },
            tagFilters: ['#divine'],
          },
        },
        onFailure: {
          narrative: 'The wisp blinks out. Whatever it wanted to show remains hidden. {actor} digs but finds only roots.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── 18. Goblin Foragers (trivial) ──────────────────────────────────────────
  {
    id: 'borderland.goblin_foragers',
    name: 'Goblin Foragers',
    locationTypes: ['wilderness', 'farmland', 'camp', 'ruins'],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'goblin_foragers.surprise',
        name: 'Stumble Upon Goblins',
        reach: 'iron',
        difficulty: TRIVIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A cluster of small, green-skinned creatures are stuffing mushrooms into a sack. They freeze when they see {actor}.',
        onSuccess: {
          narrative: '{actor} shouts and the goblins scatter instantly, abandoning their haul in a panic.',
          reputationDelta: 0.01,
        },
        onFailure: {
          narrative: 'One goblin hurls a rock with surprising accuracy. {actor} dodges but the others use the distraction to flee.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'goblin_foragers.chase',
        name: 'Chase Off the Stragglers',
        reach: 'heart',
        difficulty: TRIVIAL_DIFFICULTY_BASE + TRIVIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'Two goblins hide behind a fallen log, chittering and throwing pebbles. Too stubborn to flee, too small to fight.',
        onSuccess: {
          narrative: '{actor} stomps toward the log and the last goblins bolt. The area is clear — for now.',
          reputationDelta: 0.02,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The goblins are surprisingly persistent. {actor} gives up and walks a different path.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ── 19. Plague Rat Swarm (easy) ────────────────────────────────────────────
  {
    id: 'borderland.plague_rats',
    name: 'Plague Rat Swarm',
    locationTypes: ['ruins', 'hamlet', 'camp', 'ruined_village'],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'sacrifice_survival'],
    sphereAffinity: 'entropy',
    steps: [
      {
        id: 'plague_rats.swarm',
        name: 'Face the Swarm',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A carpet of matted fur and glinting eyes boils from the cellar. Rats, dozens of them, and each one diseased.',
        onSuccess: {
          narrative: '{actor} stamps and kicks, scattering the vanguard. Individual rats are nothing — but the swarm has weight.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The rats are everywhere — over boots, up trouser legs. {actor} flails and retreats.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'plague_rats.clear',
        name: 'Burn Out the Nest',
        reach: 'eye',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The nest is below — a crawling mass in the dark. Fire would end it, but the building might catch.',
        onSuccess: {
          narrative: 'A controlled burn clears the nest. {actor} contains the fire and the plague threat with it.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#beast'],
          },
        },
        onFailure: {
          narrative: 'The rats scatter into the walls. The nest survives, and the plague will spread further.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#beast'],
          },
        },
      },
    ],
  },

  // ── 20. Camp Raiders (easy) ────────────────────────────────────────────────
  {
    id: 'borderland.camp_raiders',
    name: 'Camp Raiders',
    locationTypes: ['camp', 'farmland', 'wilderness'],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['courage_prudence', 'loyalty_ambition'],
    steps: [
      {
        id: 'camp_raiders.wake',
        name: 'Night Alarm',
        reach: 'shadow',
        difficulty: EASY_DIFFICULTY_BASE,
        duration: 1,
        narrative: 'A crash in the dark — someone is rummaging through the supplies. {actor} rolls from {their} bedroll, hand on hilt.',
        onSuccess: {
          narrative: '{actor} moves silently into position. Two figures crouched over the supply crates, oblivious.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} kicks a pot in the dark. The raiders hear and grab what they can.',
        },
      },
      {
        id: 'camp_raiders.fight',
        name: 'Defend the Camp',
        reach: 'iron',
        difficulty: EASY_DIFFICULTY_BASE + EASY_DIFFICULTY_STEP,
        duration: 1,
        narrative: 'The raiders draw short blades — they would rather fight for the haul than run empty-handed.',
        onSuccess: {
          narrative: '{actor} puts the first raider down and the second throws their hands up. The camp is secure.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.4 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The raiders are quick and desperate. They escape with half the supplies before {actor} can stop them.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },
];

// ─── Lookup ──────────────────────────────────────────────────────────────────

/**
 * Look up a borderland encounter template by ID.
 * Returns undefined if not found — callers should use getAnyEncounterById instead.
 */
export function getBorderlandEncounterById(id: string): EncounterTemplate | undefined {
  return BORDERLAND_ENCOUNTER_TEMPLATES.find(t => t.id === id);
}
