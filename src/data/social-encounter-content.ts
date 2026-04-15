/**
 * Social Encounter Content Package — 14 social encounter templates.
 *
 * These templates model agent-to-agent interactions: alliances, espionage,
 * trade, intimidation, and faction formation. They use the same
 * EncounterTemplate shape as exploration encounters but target settlements
 * and social contexts.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to change social encounter templates,
 * step sequences, difficulty curves, and narrative prose.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Difficulty Progression ──────────────────────────────────

const SOCIAL_DIFFICULTY_BASE = 30;
const SOCIAL_DIFFICULTY_STEP = 10;

// ─── Settlement Location Types ───────────────────────────────

const SETTLEMENT_LOCATIONS = ['hamlet', 'town', 'city', 'capital'] as const;

// ─── 14 Social Encounter Templates ──────────────────────────

export const SOCIAL_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [
  // 1. Forge Alliance
  {
    id: 'social.forge_alliance',
    name: 'Forge Alliance',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'forge_alliance.overture',
        name: 'The Overture',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} extends a hand of fellowship, words measured with {adj} care.',
        onSuccess: {
          narrative: 'A spark of mutual respect kindles between them. The {adj} accord takes root.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The overture falls flat; {actor}\'s {adj} intentions read as hollow.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'forge_alliance.pact',
        name: 'Sealing the Pact',
        reach: 'eye',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'Terms must be set. {actor} {verb} the details, seeking a bond that will endure.',
        onSuccess: {
          narrative: 'The alliance is forged — a pact sworn beneath {adj} skies, binding both to common cause.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'Negotiations collapse. The terms prove too {adj} for either side to stomach.',
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#heart'],
          },
        },
      },
    ],
  },

  // 2. Recruit to Faction
  {
    id: 'social.recruit_faction',
    name: 'Recruit to Faction',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'hire',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'recruit_faction.approach',
        name: 'The Approach',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} seeks out the prospect, reading their {adj} temperament for signs of willingness.',
        onSuccess: {
          narrative: 'Interest is piqued — the prospect leans in, willing to hear more.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The prospect turns away, unmoved by {actor}\'s {adj} pitch.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'recruit_faction.induction',
        name: 'The Induction',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 3,
        narrative: 'Oaths are administered in {adj} ceremony. {actor} {verb} the new member into the fold.',
        onSuccess: {
          narrative: 'A new voice joins the faction — bound by oath and shared {adj} purpose.',
          reputationDelta: 0.07,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The prospect balks at the final oath, their {adj} doubts winning out.',
          reputationDelta: -0.04,
        },
      },
    ],
  },

  // 3. Investigate Reputation
  {
    id: 'social.investigate_reputation',
    name: 'Investigate Reputation',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'trivial',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        id: 'investigate_reputation.inquire',
        name: 'Quiet Inquiries',
        reach: 'eye',
        difficulty: SOCIAL_DIFFICULTY_BASE - 10,
        duration: 1,
        narrative: '{actor} asks careful questions in the market square, piecing together a {adj} portrait of the subject.',
        onSuccess: {
          narrative: 'Fragments of truth emerge — a clearer picture forms behind {adj} whispers.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The locals prove {adj} and tight-lipped. Little of value is learned.',
          reputationDelta: -0.01,
        },
      },
      {
        id: 'investigate_reputation.verify',
        name: 'Cross-Reference',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} {verb} the stories against one another, sifting truth from {adj} rumor.',
        onSuccess: {
          narrative: 'The reputation is confirmed — {actor} now sees the subject clearly.',
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 1.0 },
            tagFilters: ['#knowledge'],
          },
        },
        onFailure: {
          narrative: 'Contradictions pile up. The {adj} truth remains elusive.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // 4. Spy On
  {
    id: 'social.spy_on',
    name: 'Spy On',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'spy_on.shadow',
        name: 'Shadow the Target',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} slips into the crowd, {adj} eyes fixed on the unsuspecting mark.',
        onSuccess: {
          narrative: 'Movements, habits, contacts — all catalogued with {adj} precision.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'A careless step draws attention. {actor} must withdraw before the {adj} ruse unravels.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'spy_on.extract',
        name: 'Extract Intelligence',
        reach: 'eye',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} {verb} meaning from the observed patterns, constructing a {adj} dossier.',
        onSuccess: {
          narrative: 'Secrets are laid bare — {actor} departs with knowledge that could reshape alliances.',
          reputationDelta: 0.04,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The intelligence proves {adj} and unreliable. Key details slip through the cracks.',
          reputationDelta: -0.02,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#shadow'],
          },
        },
      },
    ],
  },

  // 5. Negotiate Deal
  {
    id: 'social.negotiate_deal',
    name: 'Negotiate Deal',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'negotiate_deal.terms',
        name: 'Setting Terms',
        reach: 'gold',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} lays out the terms, coin and contract weighed with {adj} deliberation.',
        onSuccess: {
          narrative: 'The initial terms are accepted — both parties see {adj} profit on the horizon.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The counterparty scoffs at the {adj} proposal. Back to the drawing board.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'negotiate_deal.close',
        name: 'Closing the Deal',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: 'The final handshake looms. {actor} {verb} the last reservations with {adj} charm.',
        onSuccess: {
          narrative: 'A deal is struck — goods and gold flow in a {adj} compact of mutual benefit.',
          reputationDelta: 0.06,
          rewardPool: {
            categoryWeights: { possession: 0.70, condition: 0.20, bestowed_power: 0.10 },
            tagFilters: ['#gold'],
          },
        },
        onFailure: {
          narrative: 'Last-minute doubts shatter the agreement. The deal dissolves into {adj} recriminations.',
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#gold'],
          },
        },
      },
    ],
  },

  // 6. Persuade
  {
    id: 'social.persuade',
    name: 'Persuade',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'persuade.appeal',
        name: 'The Appeal',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 1,
        narrative: '{actor} speaks with {adj} conviction, seeking to turn a resistant heart.',
        onSuccess: {
          narrative: 'A crack appears in the wall of resistance — the target listens.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The words land without purchase. The target\'s {adj} resolve holds firm.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'persuade.convince',
        name: 'Sealing Conviction',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} {verb} the final argument, weaving logic and emotion into a {adj} tapestry.',
        onSuccess: {
          narrative: 'Conviction takes hold — the target is persuaded, their course altered.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#heart'],
          },
        },
        onFailure: {
          narrative: 'The argument collapses under its own {adj} weight. The target remains unmoved.',
          reputationDelta: -0.03,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#heart'],
          },
        },
      },
    ],
  },

  // 7. Intimidate
  {
    id: 'social.intimidate',
    name: 'Intimidate',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'intimidate.display',
        name: 'Show of Force',
        reach: 'iron',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} steps forward, presence {adj} and unmistakable. The message needs no words.',
        onSuccess: {
          narrative: 'Fear takes root. The target yields to {actor}\'s {adj} dominance.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The target stands their ground, unbroken by {actor}\'s {adj} threat.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'intimidate.submit',
        name: 'Forced Submission',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} {verb} the demand home, leaving no room for {adj} defiance.',
        onSuccess: {
          narrative: 'Submission is total — the target bends, cowed by an {adj} will they cannot match.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'Defiance flares. The target finds {adj} courage that {actor} did not expect.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // 8. Deceive
  {
    id: 'social.deceive',
    name: 'Deceive',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'shadow',
    reachSecondary: 'heart',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'deceive.setup',
        name: 'The Setup',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} weaves a {adj} web of half-truths, laying the groundwork for the ruse.',
        onSuccess: {
          narrative: 'The false narrative takes hold, each detail clicking into {adj} place.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'A slip of the tongue. The target catches a {adj} inconsistency.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'deceive.payoff',
        name: 'The Payoff',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} {verb} the con to its conclusion, maintaining {adj} composure throughout.',
        onSuccess: {
          narrative: 'The deception succeeds — the target acts on false belief, none the wiser.',
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'The facade crumbles. Trust shatters as the {adj} lie is exposed.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#shadow'],
          },
        },
      },
    ],
  },

  // 9. Challenge to Duel
  {
    id: 'social.challenge_duel',
    name: 'Challenge to Duel',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'duel',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.duel,
    steps: [
      {
        id: 'challenge_duel.declaration',
        name: 'The Declaration',
        reach: 'iron',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} throws down the gauntlet with {adj} ceremony, demanding satisfaction.',
        onSuccess: {
          narrative: 'The challenge is accepted — honor demands it. Blades will be drawn.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The challenge is refused with {adj} contempt. {actor}\'s honor is publicly questioned.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'challenge_duel.combat',
        name: 'The Crossing of Blades',
        reach: 'gold',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: 'Steel meets steel. {actor} {verb} with {adj} precision against a worthy opponent.',
        onSuccess: {
          narrative: 'Blood is drawn — {actor} prevails, standing {adj} and victorious.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The opponent\'s blade finds its mark. {actor} falls, bested in {adj} combat.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'challenge_duel.aftermath',
        name: 'The Aftermath',
        reach: 'iron',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 3,
        duration: 1,
        narrative: 'The duel concluded, {actor} must face its {adj} consequences.',
        onSuccess: {
          narrative: 'Honor is restored. The {adj} victory echoes through the settlement.',
          reputationDelta: 0.10,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'The aftermath proves {adj} and bitter. The duel has cost more than it gained.',
          reputationDelta: -0.05,
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // 10. Sabotage
  {
    id: 'social.sabotage',
    name: 'Sabotage',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'shadow',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'sabotage.infiltrate',
        name: 'Infiltration',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} slips past wards and watchmen, moving with {adj} intent.',
        onSuccess: {
          narrative: 'Access achieved — {actor} moves unseen among the target\'s {adj} defenses.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'An alert is raised. {actor}\'s {adj} approach is compromised.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'sabotage.tamper',
        name: 'The Tampering',
        reach: 'gold',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: '{actor} {verb} the critical mechanism, ensuring {adj} damage will follow.',
        onSuccess: {
          narrative: 'The sabotage is set — a {adj} wound that will bleed slowly and surely.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The mechanism resists tampering. {actor}\'s {adj} efforts leave no lasting mark.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'sabotage.escape',
        name: 'Clean Escape',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 3,
        duration: 1,
        narrative: 'The deed done, {actor} must vanish before the {adj} trap springs.',
        onSuccess: {
          narrative: 'No trace remains. The sabotage is discovered only when {adj} damage is done.',
          reputationDelta: 0.08,
          rewardPool: {
            categoryWeights: { possession: 0.30, condition: 0.30, bestowed_power: 0.40 },
            tagFilters: ['#shadow'],
          },
        },
        onFailure: {
          narrative: 'Caught in the act — {actor}\'s identity is exposed, their {adj} scheme laid bare.',
          reputationDelta: -0.08,
          rewardPool: {
            categoryWeights: { condition: 0.70, possession: 0.30 },
            tagFilters: ['#shadow'],
          },
        },
      },
    ],
  },

  // 11. Rob
  {
    id: 'social.rob',
    name: 'Rob',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
    steps: [
      {
        id: 'rob.confront',
        name: 'The Confrontation',
        reach: 'iron',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 1,
        narrative: '{actor} blocks the path, {adj} intent written plain across their features.',
        onSuccess: {
          narrative: 'The mark freezes — {actor}\'s {adj} presence brooks no resistance.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The mark fights back with {adj} desperation. The ambush goes sideways.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'rob.take',
        name: 'Claim the Prize',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 2,
        duration: 1,
        narrative: '{actor} {verb} the valuables with {adj} efficiency, leaving nothing behind.',
        onSuccess: {
          narrative: 'The robbery succeeds — {actor} vanishes with the spoils, a {adj} ghost in the crowd.',
          reputationDelta: 0.05,
          rewardPool: {
            categoryWeights: { possession: 0.50, condition: 0.30, bestowed_power: 0.20 },
            tagFilters: ['#combat'],
          },
        },
        onFailure: {
          narrative: 'Guards arrive. {actor}\'s {adj} greed has left them exposed.',
          reputationDelta: -0.06,
          rewardPool: {
            categoryWeights: { condition: 0.80, possession: 0.20 },
            tagFilters: ['#combat'],
          },
        },
      },
    ],
  },

  // 12. Establish Patronage
  {
    id: 'social.establish_patronage',
    name: 'Establish Patronage',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'establish_patronage.offer',
        name: 'The Offer',
        reach: 'gold',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 2,
        narrative: '{actor} presents an offer of patronage, coin and influence laid out with {adj} generosity.',
        onSuccess: {
          narrative: 'The offer is well-received — a {adj} patron is a rare and welcome thing.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The offer is seen as {adj} manipulation, not genuine support.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'establish_patronage.terms',
        name: 'Negotiating Terms',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} {verb} the boundaries of the arrangement, ensuring {adj} mutual benefit.',
        onSuccess: {
          narrative: 'A compact of patronage is formed — power flows downward, loyalty upward.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'Terms cannot be agreed upon. The {adj} power imbalance proves too great.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'establish_patronage.invest',
        name: 'First Investment',
        reach: 'gold',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'The first fruits of patronage flow. {actor} delivers on the {adj} promise.',
        onSuccess: {
          narrative: 'The investment pays off. A {adj} network of influence begins to crystallize.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The investment is squandered. The patron-client bond strains under {adj} disappointment.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // 13. Political Leverage
  {
    id: 'social.political_leverage',
    name: 'Political Leverage',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'shadow',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'political_leverage.gather',
        name: 'Gathering Leverage',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} collects {adj} favors, debts, and secrets — the currency of power.',
        onSuccess: {
          narrative: 'A web of obligations coalesces. {actor} holds the {adj} strings.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The targets prove too {adj} and guarded. Little leverage is gained.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'political_leverage.apply',
        name: 'Applying Pressure',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: '{actor} {verb} the leverage at the critical moment, reshaping {adj} loyalties.',
        onSuccess: {
          narrative: 'The political landscape shifts — {actor}\'s influence grows in {adj} silence.',
          reputationDelta: 0.07,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The target calls the bluff. {actor}\'s {adj} position weakens.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'political_leverage.consolidate',
        name: 'Consolidation',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 3,
        duration: 1,
        narrative: 'The new order must be secured. {actor} works to make the {adj} shift permanent.',
        onSuccess: {
          narrative: 'Power is consolidated. The new arrangement becomes the {adj} status quo.',
          reputationDelta: 0.09,
        },
        onFailure: {
          narrative: 'Rivals counterattack. The {adj} gains begin to erode.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  // 14. Found a Group
  {
    id: 'social.found_group',
    name: 'Found a Group',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'build',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.build,
    remoteAttempt: true,
    steps: [
      {
        id: 'found_group.vision',
        name: 'Articulate the Vision',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE,
        duration: 3,
        narrative: '{actor} speaks of a {adj} future — a purpose that demands collective action.',
        onSuccess: {
          narrative: 'The vision resonates. Kindred spirits gather, drawn by {adj} conviction.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The vision falters. The {adj} dream finds no purchase in skeptical hearts.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'found_group.recruit',
        name: 'Gather Founding Members',
        reach: 'shadow',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP,
        duration: 2,
        narrative: '{actor} {verb} through the community, identifying those of {adj} resolve.',
        onSuccess: {
          narrative: 'A core of dedicated members emerges — the nucleus of something {adj} and new.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'Few step forward. The {adj} movement lacks critical mass.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'found_group.charter',
        name: 'Draft the Charter',
        reach: 'heart',
        difficulty: SOCIAL_DIFFICULTY_BASE + SOCIAL_DIFFICULTY_STEP * 2,
        duration: 2,
        narrative: 'Rules, roles, and purpose must be codified. {actor} shapes a {adj} charter.',
        onSuccess: {
          narrative: 'The group is founded — a new faction enters the world, forged in {adj} purpose.',
          reputationDelta: 0.10,
        },
        onFailure: {
          narrative: 'Internal disagreements fracture the nascent group. The {adj} charter goes unsigned.',
          reputationDelta: -0.05,
        },
      },
    ],
  },
];

// ─── Lookup Functions ───────────────────────────────────────

import { SOCIAL_SCENE_TEMPLATES } from './social-scene-templates';

/** Combined pool: legacy 14 templates + 30 new deep social scene templates. */
export const ALL_SOCIAL_TEMPLATES: EncounterTemplate[] = [
  ...SOCIAL_ENCOUNTER_TEMPLATES,
  ...SOCIAL_SCENE_TEMPLATES,
];

/**
 * Return all social encounters available at a given location type.
 */
export function getSocialEncountersByLocationType(locationType: string): EncounterTemplate[] {
  return ALL_SOCIAL_TEMPLATES.filter(encounter =>
    encounter.locationTypes.includes(locationType),
  );
}

/**
 * Get a social encounter template by ID.
 * Checks legacy templates first, then deep social scene templates.
 */
export function getSocialEncounterById(id: string): EncounterTemplate | undefined {
  return SOCIAL_ENCOUNTER_TEMPLATES.find(t => t.id === id)
    ?? SOCIAL_SCENE_TEMPLATES.find(t => t.id === id);
}
