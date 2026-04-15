/**
 * Social Scene Templates — 30 rich 3-5 step social encounters.
 *
 * All templates follow the 5-step dramatic arc:
 *   Step 1: Opening Gambit   — establish the ask (Eye or reach variant)
 *   Step 2: Reading the Room — Eye reach, reveals counter-argument type
 *   Step 3: The Pitch        — core persuasion step, leverage modifies difficulty
 *   Step 4: The Counter      — conditional (leverage_range < 0.7), personality-driven
 *   Step 5: Resolution       — final outcome, leverage tier determines outcome quality
 *
 * Categories:
 *   Persuasion (5): Political Audience, Recruitment Pitch, Mentorship Offer,
 *                   Romantic Pursuit, Religious Conversion
 *   Negotiation (5): Tavern Negotiation, Trade Fair, Peace Negotiation,
 *                    Contract Dispute, Territorial Accord
 *   Intrigue (5): Spy Debrief, Betrayal Reveal, Extortion, The Double Agent, Court Whispers
 *   Intimidation (4): The Confrontation, The Challenge, Protection Racket, Warlord's Demand
 *   Ceremony (4): Oath Swearing, Trial & Judgment, Coronation Speech, Eulogy & Memorial
 *   Community (4): Festival Gathering, War Council, Tavern Confession, Town Assembly
 *   Investigation (3): The Interrogation, Reputation Assessment, The Accusation
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit step narratives and difficulty curves here.
 * To add a new social scene template, follow the 5-step arc pattern
 * and set leverageOnSuccess/leverageOnFailure on appropriate steps.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// ─── Difficulty Curves ─────────────────────────────────────────────────────

const D_EASY   = 25;
const D_MED    = 38;
const D_HARD   = 52;
const D_VHARD  = 65;

// ─── Location Pools ────────────────────────────────────────────────────────

const SETTLEMENTS = ['hamlet', 'town', 'city', 'capital'] as const;
const URBAN       = ['town', 'city', 'capital'] as const;
const MAJOR       = ['city', 'capital'] as const;

// ─── Persuasion Templates (5) ─────────────────────────────────────────────

const PERSUASION_TEMPLATES: EncounterTemplate[] = [

  // 1. Political Audience
  {
    id: 'social_scene.political_audience',
    name: 'Political Audience',
    locationTypes: [...URBAN],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'political_audience.approach',
        name: 'Approach the Court',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 2,
        narrative: '{actor} seeks an audience at court, reading the mood of the assembled nobles before speaking.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.05,
        onSuccess: {
          narrative: 'The court\'s attention is secured; {actor}\'s timing was impeccable.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The courtiers barely conceal their boredom — {actor}\'s approach fell flat.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'political_audience.read_room',
        name: 'Read the Room',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} studies the assembled faces, mapping alliances and tensions before committing to a line.',
        leverageOnSuccess: 0.15,
        onSuccess: {
          narrative: 'The fault lines of the court are now clear. {actor} knows exactly which strings to pull.',
        },
        onFailure: {
          narrative: 'The court\'s dynamics remain opaque. {actor} will have to improvise.',
        },
      },
      {
        id: 'political_audience.pitch',
        name: 'Make the Appeal',
        reach: 'heart',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: '{actor} delivers the appeal with {sphere_flavor}, invoking shared interests and mutual benefit.',
        onSuccess: {
          narrative: 'The appeal lands with weight. Murmurs of agreement ripple through the court.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The appeal is heard but not heeded. Polite indifference fills the chamber.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'political_audience.counter',
        name: 'Weather the Counter',
        reach: 'heart',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'A dissenting noble rises to challenge the appeal. {actor} must respond.',
        onSuccess: {
          narrative: '{actor}\'s response is measured and persuasive, drawing appreciative nods.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The counter-argument finds purchase. The court\'s support wavers.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'political_audience.resolution',
        name: 'The Judgment',
        reach: 'heart',
        difficulty: D_VHARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The chamber falls silent. Whatever was built in this audience, it comes to judgment now.',
        onSuccess: {
          narrative: 'The court grants what was sought. {actor}\'s words have moved the powerful.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 1.0 }, rarityWeights: { common: 0.6, uncommon: 0.4 } },
        },
        onFailure: {
          narrative: 'The petition is denied. {actor} exits the court with nothing gained and pride somewhat bruised.',
          reputationDelta: -0.04,
        },
      },
    ],
  },

  // 2. Recruitment Pitch
  {
    id: 'social_scene.recruitment_pitch',
    name: 'Recruitment Pitch',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'heart',
    reachSecondary: 'shadow',
    encounterType: 'hire',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.hire,
    steps: [
      {
        id: 'recruitment_pitch.opening',
        name: 'The Opening',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} opens with a warm word and a well-chosen compliment, establishing common ground.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.05,
        onSuccess: {
          narrative: 'The target warms slightly. The door is open.',
        },
        onFailure: {
          narrative: 'The opening is clumsy. Suspicion replaces curiosity.',
        },
      },
      {
        id: 'recruitment_pitch.read',
        name: 'Read Their Ambitions',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} listens more than talks, watching for what the target wants but hasn\'t said.',
        leverageOnSuccess: 0.15,
        onSuccess: {
          narrative: 'The shape of the target\'s ambitions becomes clear. The pitch can be tailored.',
        },
        onFailure: {
          narrative: 'The target reveals little. The pitch will have to be general.',
        },
      },
      {
        id: 'recruitment_pitch.pitch',
        name: 'Make the Offer',
        reach: 'heart',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: 'The offer is laid out plainly: purpose, pay, and place in something larger. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The target leans in. They\'re not just listening now — they\'re considering.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The offer lands without sparking interest. Something is missing.',
        },
      },
      {
        id: 'recruitment_pitch.counter',
        name: 'Address Hesitation',
        reach: 'heart',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.08,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The target raises a concern — something that holds them back. {actor} must address it directly.',
        onSuccess: {
          narrative: 'The concern is met and dissolved. The path to yes is clear.',
        },
        onFailure: {
          narrative: 'The concern festers. The target grows less certain, not more.',
        },
      },
      {
        id: 'recruitment_pitch.close',
        name: 'The Close',
        reach: 'heart',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The moment comes to ask directly. Will they join?',
        onSuccess: {
          narrative: 'They accept. A new bond is forged — fragile yet, but real.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'They decline. Perhaps another time, under different circumstances.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // 3. Mentorship Offer
  {
    id: 'social_scene.mentorship_offer',
    name: 'Mentorship Offer',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    steps: [
      {
        id: 'mentorship_offer.observation',
        name: 'Observe the Prospect',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} watches the prospect at work, noting both talent and the gaps that hold them back.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.05,
        onSuccess: {
          narrative: 'The prospect\'s potential is unmistakable. {actor} knows exactly what to offer.',
        },
        onFailure: {
          narrative: 'The prospect is hard to read. The assessment is incomplete.',
        },
      },
      {
        id: 'mentorship_offer.approach',
        name: 'Open the Conversation',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} approaches with honest words — not flattery, but genuine recognition of what they\'ve seen.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.04,
        onSuccess: {
          narrative: 'The prospect is surprised by the sincerity. They listen.',
        },
        onFailure: {
          narrative: 'The prospect is wary of the attention. Old suspicions surface.',
        },
      },
      {
        id: 'mentorship_offer.offer',
        name: 'Make the Offer',
        reach: 'heart',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.18,
        leverageOnFailure: -0.10,
        narrative: '{actor} offers guidance and knowledge — {sphere_flavor}. The price is only their time.',
        onSuccess: {
          narrative: 'The offer is accepted with cautious gratitude. Something new begins.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The prospect declines. They\'re not ready, or they don\'t trust the offer yet.',
        },
      },
      {
        id: 'mentorship_offer.counter',
        name: 'Address Their Doubt',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.08,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The prospect hesitates, voicing something that holds them back. {actor} meets it honestly.',
        onSuccess: {
          narrative: 'The doubt is addressed with clarity. The prospect\'s resistance softens.',
        },
        onFailure: {
          narrative: 'The doubt remains unresolved. The prospect withdraws further.',
        },
      },
      {
        id: 'mentorship_offer.bond',
        name: 'A Shared Commitment',
        reach: 'heart',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The mentor and the prospect look at each other plainly. This is the moment it either takes root or doesn\'t.',
        onSuccess: {
          narrative: 'A bond forms — not of command but of shared purpose. The teaching can begin.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The moment passes. The prospect turns away and the opportunity dissolves.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // 4. Romantic Pursuit
  {
    id: 'social_scene.romantic_pursuit',
    name: 'Romantic Pursuit',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['loyalty_ambition', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'romantic_pursuit.notice',
        name: 'Be Noticed',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} finds a reason to be in {target}\'s orbit — and makes it feel natural, not forced.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.05,
        onSuccess: {
          narrative: '{target} notices. Their gaze lingers a moment longer than necessity requires.',
        },
        onFailure: {
          narrative: 'The attempt goes unnoticed, or worse — noticed and found awkward.',
        },
      },
      {
        id: 'romantic_pursuit.read_interest',
        name: 'Read Their Interest',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} watches for the small signs — the catch of breath, the choosing of words with care.',
        leverageOnSuccess: 0.15,
        onSuccess: {
          narrative: 'The signals are there, if faint. {actor} knows they\'re not entirely imagining this.',
        },
        onFailure: {
          narrative: 'The signals are unclear or absent. This may be wishful thinking.',
        },
      },
      {
        id: 'romantic_pursuit.approach',
        name: 'Make a Move',
        reach: 'heart',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: '{actor} makes the feeling plain — not with grandeur, but with genuine honesty. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The words land softly. {target}\'s answer is not a refusal.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The feeling is expressed, but {target}\'s response is gentle deflection.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'romantic_pursuit.hesitation',
        name: 'Meet Their Hesitation',
        reach: 'heart',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: '{target} voices something that holds them back — a past hurt, a fear, a duty. {actor} listens.',
        onSuccess: {
          narrative: 'The hesitation is met with patience and understanding. Something softens.',
        },
        onFailure: {
          narrative: 'The hesitation is pressed too hard. {target} draws back.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'romantic_pursuit.answer',
        name: 'The Answer',
        reach: 'heart',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'Everything said between them hangs in the air. Now comes the answer.',
        onSuccess: {
          narrative: '{target}\'s answer is yes — tentative, perhaps, but genuine.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: '{target}\'s answer is no. There\'s kindness in it, but it is still no.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // 5. Religious Conversion
  {
    id: 'social_scene.religious_conversion',
    name: 'Religious Conversion',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['sacrifice_survival', 'tradition_novelty'],
    sphereAffinity: 'order',
    steps: [
      {
        id: 'religious_conversion.testimony',
        name: 'Share the Testimony',
        reach: 'star',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} speaks plainly of what they believe and why — not to persuade, but to witness.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.04,
        onSuccess: {
          narrative: 'The testimony is heard with open curiosity. Something in it reaches the listener.',
        },
        onFailure: {
          narrative: 'The testimony is received with polite discomfort. The listener is not yet moved.',
        },
      },
      {
        id: 'religious_conversion.listen',
        name: 'Listen to Their Doubts',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} invites objections — genuinely, without preparing a counter before the doubt is even spoken.',
        leverageOnSuccess: 0.15,
        onSuccess: {
          narrative: 'The doubts pour out freely. {actor} now knows the shape of what must be addressed.',
        },
        onFailure: {
          narrative: 'The listener guards their doubts. The conversation stays surface-level.',
        },
      },
      {
        id: 'religious_conversion.meaning',
        name: 'Offer Meaning',
        reach: 'star',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: '{actor} speaks to what lies beneath the doubts — the hunger for {sphere_flavor} that no doctrine has satisfied.',
        onSuccess: {
          narrative: 'Something shifts in the listener\'s eyes. This is what they\'d been waiting to hear.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The words carry conviction but not connection. The listener nods but doesn\'t receive.',
        },
      },
      {
        id: 'religious_conversion.resistance',
        name: 'Weather the Resistance',
        reach: 'heart',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The listener pushes back — perhaps from fear, perhaps from genuine conviction elsewhere. {actor} meets it with patience.',
        onSuccess: {
          narrative: 'The resistance is addressed without dismissal. The listener feels heard, and that matters.',
        },
        onFailure: {
          narrative: 'The resistance grows. The more {actor} presses, the further the listener retreats.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'religious_conversion.turning',
        name: 'The Turning',
        reach: 'star',
        difficulty: D_VHARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'Conversion — if it comes — is not a decision but a recognition. Everything has been laid out. Now it either takes root or it doesn\'t.',
        onSuccess: {
          narrative: 'Something in the listener breaks open quietly. This is not theatre — this is real.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.7, condition: 0.3 }, rarityWeights: { common: 0.5, uncommon: 0.5 } },
        },
        onFailure: {
          narrative: 'The listener remains where they are. They are unchanged — and perhaps more certain of it.',
          reputationDelta: -0.03,
        },
      },
    ],
  },
];

// ─── Negotiation Templates (5) ─────────────────────────────────────────────

const NEGOTIATION_TEMPLATES: EncounterTemplate[] = [

  // 6. Tavern Negotiation
  {
    id: 'social_scene.tavern_negotiation',
    name: 'Tavern Negotiation',
    locationTypes: [...SETTLEMENTS],
    sublocationTypes: ['tavern'],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'tavern_negotiation.drinks',
        name: 'Set the Mood',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} calls for drinks and makes small talk — establishing comfort before anything serious is broached.',
        leverageOnSuccess: 0.08,
        leverageOnFailure: -0.04,
        onSuccess: {
          narrative: 'The atmosphere loosens. {target} settles back in their chair, more at ease.',
        },
        onFailure: {
          narrative: 'The small talk lands poorly. Something remains stiff between them.',
        },
      },
      {
        id: 'tavern_negotiation.read',
        name: 'Read Their Position',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} listens between the lines, gauging what {target} actually wants — not just what they say they want.',
        leverageOnSuccess: 0.15,
        onSuccess: {
          narrative: 'The real position becomes clear. {actor} now knows the gap between stated and actual terms.',
        },
        onFailure: {
          narrative: '{target}\'s true position stays hidden. The negotiation will have to proceed blind.',
        },
      },
      {
        id: 'tavern_negotiation.terms',
        name: 'Table the Terms',
        reach: 'gold',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: 'The actual offer is laid on the table — coin, goods, services, or favors. What\'s it worth?',
        onSuccess: {
          narrative: 'The terms land favorably. {target} looks interested, not insulted.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The terms miss the mark — either too low or beside what {target} actually needs.',
        },
      },
      {
        id: 'tavern_negotiation.haggle',
        name: 'The Haggle',
        reach: 'gold',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.08,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: '{target} comes back with a counter-offer. Not a refusal — but not an acceptance either. {sphere_flavor}.',
        onSuccess: {
          narrative: '{actor} finds the adjustment that satisfies. The deal moves closer.',
        },
        onFailure: {
          narrative: 'The adjustment doesn\'t satisfy. {target} remains unconvinced by the revised terms.',
        },
      },
      {
        id: 'tavern_negotiation.close',
        name: 'Seal It',
        reach: 'gold',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The deal comes down to a handshake and a look in the eye. Does it hold?',
        onSuccess: {
          narrative: 'The deal is struck. Both parties leave with something they wanted.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { artifact: 0.5, trait: 0.5 }, rarityWeights: { common: 0.7, uncommon: 0.3 } },
        },
        onFailure: {
          narrative: 'The deal falls apart at the last moment. No harm done — but no progress either.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // 7. Peace Negotiation
  {
    id: 'social_scene.peace_negotiation',
    name: 'Peace Negotiation',
    locationTypes: [...MAJOR],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'peace_negotiation.ceasefire',
        name: 'Establish Ceasefire',
        reach: 'iron',
        difficulty: D_MED,
        duration: 2,
        narrative: '{actor} calls for a pause in hostilities — a moment to breathe before the negotiating begins.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The silence holds. Both sides lower their weapons, if not their guards.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The ceasefire is contested. Skirmishing continues on the margins.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'peace_negotiation.read_grievances',
        name: 'Map the Grievances',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} listens to each side\'s wounds without judgment, understanding what must be acknowledged before anything can be resolved.',
        leverageOnSuccess: 0.15,
        onSuccess: {
          narrative: 'The shape of the conflict becomes clear — not just the surface demands, but the buried hurts.',
        },
        onFailure: {
          narrative: 'The grievances overflow into argument. The mapping is incomplete.',
        },
      },
      {
        id: 'peace_negotiation.framework',
        name: 'Propose a Framework',
        reach: 'gold',
        difficulty: D_HARD,
        duration: 3,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.22,
        leverageOnFailure: -0.12,
        narrative: '{actor} offers a structure for peace — something both sides can call a win. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The framework is heard and, if not embraced, at least considered seriously.',
          reputationDelta: 0.06,
        },
        onFailure: {
          narrative: 'The framework satisfies no one. Each side sees only what they\'re asked to give.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'peace_negotiation.impasse',
        name: 'Break the Impasse',
        reach: 'heart',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The talks hit a wall. {actor} must find the human truth beneath the political position.',
        onSuccess: {
          narrative: 'The wall cracks. A concession emerges — not from weakness, but from exhaustion with war.',
        },
        onFailure: {
          narrative: 'The impasse holds. Both sides harden.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'peace_negotiation.accord',
        name: 'The Accord',
        reach: 'gold',
        difficulty: D_VHARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The final document is drawn up. What has been built here — fragile as it is — must be committed to parchment.',
        onSuccess: {
          narrative: 'The accord is signed. Peace — uneasy, fragile, contested — begins.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.6, artifact: 0.4 }, rarityWeights: { uncommon: 0.6, rare: 0.4 } },
        },
        onFailure: {
          narrative: 'The negotiations collapse at the final moment. The parties leave without an accord.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  // 8. Contract Dispute
  {
    id: 'social_scene.contract_dispute',
    name: 'Contract Dispute',
    locationTypes: [...URBAN],
    reachPrimary: 'gold',
    reachSecondary: 'eye',
    encounterType: 'trade',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'contract_dispute.review',
        name: 'Review the Terms',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} reviews the contract carefully, searching for the clause that caused the dispute.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.06,
        onSuccess: {
          narrative: 'The problematic clause is found. {actor} has a clear legal footing.',
        },
        onFailure: {
          narrative: 'The contract is dense and ambiguous. The footing is uncertain.',
        },
      },
      {
        id: 'contract_dispute.position',
        name: 'State the Position',
        reach: 'gold',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} lays out their interpretation of the terms clearly and without accusation.',
        leverageOnSuccess: 0.15,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The position is stated crisply. The other party acknowledges the argument, even if they disagree.',
        },
        onFailure: {
          narrative: 'The position is muddled or misread. The other party is dismissive.',
        },
      },
      {
        id: 'contract_dispute.negotiate',
        name: 'Negotiate Resolution',
        reach: 'gold',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: 'Both parties know what they want. The question is who blinks first. {sphere_flavor}.',
        onSuccess: {
          narrative: 'A revised arrangement is reached — not perfect, but workable for both parties.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The negotiation stalls. No revised terms can be agreed upon.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'contract_dispute.challenge',
        name: 'Answer the Counterargument',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.08,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The other party raises a legal or factual challenge. {actor} must counter it directly.',
        onSuccess: {
          narrative: 'The challenge is refuted cleanly. The argument holds.',
        },
        onFailure: {
          narrative: 'The challenge finds purchase. The other party grows more confident.',
        },
      },
      {
        id: 'contract_dispute.resolution',
        name: 'Final Settlement',
        reach: 'gold',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The settlement must be reached or the dispute goes to arbitration. What\'s the final word?',
        onSuccess: {
          narrative: 'The dispute is resolved in {actor}\'s favor. The contract is amended and signed.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The dispute is settled against {actor}, or dragged into arbitration. A poor outcome.',
          reputationDelta: -0.04,
        },
      },
    ],
  },

  // 9. Trade Fair Pitch
  {
    id: 'social_scene.trade_fair',
    name: 'Trade Fair Pitch',
    locationTypes: [...URBAN],
    reachPrimary: 'gold',
    reachSecondary: 'heart',
    encounterType: 'trade',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.trade,
    steps: [
      {
        id: 'trade_fair.display',
        name: 'Set Up the Display',
        reach: 'gold',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} arranges their goods to best advantage, making something ordinary look exceptional.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.04,
        onSuccess: {
          narrative: 'The display draws interested eyes. The setup alone does some of the selling.',
        },
        onFailure: {
          narrative: 'The display is unremarkable. Buyers pass by without stopping.',
        },
      },
      {
        id: 'trade_fair.engage',
        name: 'Engage the Buyer',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} reads which buyers are genuinely interested versus just browsing, and focuses their energy.',
        leverageOnSuccess: 0.12,
        onSuccess: {
          narrative: 'A promising buyer is identified and engaged. They stay to listen.',
        },
        onFailure: {
          narrative: 'The promising buyers pass by. Only browsers remain.',
        },
      },
      {
        id: 'trade_fair.value',
        name: 'Sell the Value',
        reach: 'gold',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.18,
        leverageOnFailure: -0.10,
        narrative: '{actor} makes the case for why this is worth the price. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The buyer is convinced of the value. They\'re doing mental accounting now.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The buyer remains skeptical. The price feels too high for what\'s offered.',
        },
      },
      {
        id: 'trade_fair.bargain',
        name: 'Handle the Bargain',
        reach: 'gold',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.08,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The buyer makes a counter-offer — less than the asking price, but not an insult. Time to negotiate.',
        onSuccess: {
          narrative: 'The bargaining concludes in {actor}\'s favor. A fair price is agreed.',
        },
        onFailure: {
          narrative: 'The bargaining tips away from {actor}. The price comes down more than hoped.',
        },
      },
      {
        id: 'trade_fair.sale',
        name: 'Close the Sale',
        reach: 'gold',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'Coin changes hands. The transaction completes — or doesn\'t.',
        onSuccess: {
          narrative: 'The sale is made. {actor} pockets the profit and notes another satisfied buyer.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { artifact: 0.8, trait: 0.2 }, rarityWeights: { common: 0.8, uncommon: 0.2 } },
        },
        onFailure: {
          narrative: 'The sale falls through at the last moment. The buyer walks away.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // 10. Territorial Accord
  {
    id: 'social_scene.territorial_accord',
    name: 'Territorial Accord',
    locationTypes: [...MAJOR],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.lead,
    steps: [
      {
        id: 'territorial_accord.survey',
        name: 'Survey the Claims',
        reach: 'eye',
        difficulty: D_MED,
        duration: 2,
        narrative: '{actor} maps the disputed territories carefully, understanding what each side actually holds versus what they claim.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.06,
        onSuccess: {
          narrative: 'The actual holdings are clarified. {actor} can now see where compromise is possible.',
        },
        onFailure: {
          narrative: 'The survey is incomplete. Both sides inflate their claims in the fog of uncertainty.',
        },
      },
      {
        id: 'territorial_accord.position',
        name: 'Establish Positions',
        reach: 'iron',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} makes clear what is non-negotiable before discussing what is. Strength first.',
        leverageOnSuccess: 0.14,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The position is credible and clearly stated. The other side takes it seriously.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The position is tested and found soft. The other side presses harder.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'territorial_accord.offer',
        name: 'Propose Division',
        reach: 'gold',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: 'The proposed division is tabled — giving each side something, taking something too. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The proposal is greeted with reluctant pragmatism. Not celebrated, but not rejected.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The proposal is rejected outright. Neither side sees enough gain.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'territorial_accord.counter',
        name: 'Meet the Counter',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The other side comes back with revisions that eat into the gains. {actor} must hold the line.',
        onSuccess: {
          narrative: 'The line holds. The revisions are limited to what {actor} can accept.',
        },
        onFailure: {
          narrative: 'The line breaks. Significant concessions are extracted.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'territorial_accord.treaty',
        name: 'Sign the Treaty',
        reach: 'gold',
        difficulty: D_VHARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The treaty is written out. Both sides must commit to words that bind them.',
        onSuccess: {
          narrative: 'The treaty is signed. The borders are settled — for now.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.5, artifact: 0.5 }, rarityWeights: { uncommon: 0.5, rare: 0.5 } },
        },
        onFailure: {
          narrative: 'The treaty fails to materialize. The negotiation collapses and both sides return to their original positions.',
          reputationDelta: -0.06,
        },
      },
    ],
  },
];

// ─── Intrigue Templates (5) ────────────────────────────────────────────────

const INTRIGUE_TEMPLATES: EncounterTemplate[] = [

  // 11. Betrayal Reveal
  {
    id: 'social_scene.betrayal_reveal',
    name: 'Betrayal Reveal',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    steps: [
      {
        id: 'betrayal_reveal.evidence',
        name: 'Gather the Evidence',
        reach: 'eye',
        difficulty: D_MED,
        duration: 2,
        narrative: '{actor} assembles the proof carefully — documents, witnesses, patterns that cannot be explained away.',
        leverageOnSuccess: 0.15,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The evidence is watertight. What {actor} has, they can prove.',
        },
        onFailure: {
          narrative: 'The evidence is incomplete. There are gaps that can be exploited.',
        },
      },
      {
        id: 'betrayal_reveal.read_target',
        name: 'Read the Traitor',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} watches {target} carefully — looking for the guilt beneath the performance of innocence.',
        leverageOnSuccess: 0.12,
        onSuccess: {
          narrative: 'The performance slips. {actor} can see exactly what {target} knows they\'ve done.',
        },
        onFailure: {
          narrative: '{target}\'s composure is impeccable. No tell is visible.',
        },
      },
      {
        id: 'betrayal_reveal.confront',
        name: 'The Confrontation',
        reach: 'shadow',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: 'The evidence is presented without preamble. There is no soft way to say this. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The proof lands like a blow. {target}\'s defenses collapse.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{target} weathers the confrontation, finding holes in the evidence to hide behind.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'betrayal_reveal.denial',
        name: 'Break Through the Denial',
        reach: 'shadow',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: '{target} denies everything — or twists the truth into something unrecognizable. {actor} must push through.',
        onSuccess: {
          narrative: 'The denial is dismantled piece by piece. What remains cannot be denied.',
        },
        onFailure: {
          narrative: 'The denial holds. The confrontation bogs down in a war of interpretations.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'betrayal_reveal.reckoning',
        name: 'The Reckoning',
        reach: 'shadow',
        difficulty: D_VHARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The truth is out. What {target} does with it — and what consequences follow — hangs in the air.',
        onSuccess: {
          narrative: 'The betrayal is acknowledged. The reckoning begins.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.8, condition: 0.2 }, rarityWeights: { uncommon: 0.6, rare: 0.4 } },
        },
        onFailure: {
          narrative: 'The reckoning fails to materialize. {target} escapes the full weight of their actions — for now.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // 12. Extortion
  {
    id: 'social_scene.extortion',
    name: 'Extortion',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'shadow',
    reachSecondary: 'iron',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['honesty_cunning', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'extortion.leverage',
        name: 'Acquire the Leverage',
        reach: 'shadow',
        difficulty: D_MED,
        duration: 2,
        narrative: '{actor} uncovers something {target} would pay to keep hidden — and makes sure they know it.',
        leverageOnSuccess: 0.15,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The leverage is in hand. {target} has been identified and confirmed.',
        },
        onFailure: {
          narrative: 'The information is weaker than hoped. The leverage is uncertain.',
        },
      },
      {
        id: 'extortion.approach',
        name: 'Make the Approach',
        reach: 'shadow',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} makes contact — obliquely, with plausible deniability, but the message is unmistakable.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: '{target} understands. They haven\'t refused yet — which means they\'re calculating.',
        },
        onFailure: {
          narrative: 'The approach is too direct or too indirect. {target} is confused or alarmed.',
        },
      },
      {
        id: 'extortion.demand',
        name: 'State the Demand',
        reach: 'shadow',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: 'The terms are stated plainly. Pay — in coin, silence, or compliance — or the secret walks.',
        onSuccess: {
          narrative: 'The demand is received without outright refusal. {target} is considering.',
          reputationDelta: -0.02,
        },
        onFailure: {
          narrative: '{target} refuses or threatens to expose {actor} in turn. The tables may be turning.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'extortion.resistance',
        name: 'Meet the Resistance',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: '{target} pushes back — challenging the threat, testing whether {actor} will really follow through.',
        onSuccess: {
          narrative: '{actor} holds the line. {target} backs down.',
        },
        onFailure: {
          narrative: '{target} calls the bluff or escalates. The situation destabilizes.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'extortion.compliance',
        name: 'Extract Compliance',
        reach: 'shadow',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The moment of decision. Does {target} comply — or does everything unravel?',
        onSuccess: {
          narrative: '{target} complies. The demand is met.',
          reputationDelta: 0.02,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { artifact: 0.6, trait: 0.4 }, rarityWeights: { common: 0.5, uncommon: 0.5 } },
        },
        onFailure: {
          narrative: '{target} refuses. The extortion has failed — and may have created a dangerous enemy.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  // 13. Court Whispers
  {
    id: 'social_scene.court_whispers',
    name: 'Court Whispers',
    locationTypes: [...MAJOR],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['honesty_cunning', 'revelation_discretion'],
    steps: [
      {
        id: 'court_whispers.position',
        name: 'Find the Right Position',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} navigates the social geography of the court — finding the ear closest to power.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.04,
        onSuccess: {
          narrative: 'The right person is identified and approached on the right terms.',
        },
        onFailure: {
          narrative: 'The wrong person is cultivated. The whisper will travel to the wrong ears.',
        },
      },
      {
        id: 'court_whispers.read',
        name: 'Read the Court',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} maps the alliances and resentments at play — knowing who benefits from the whisper.',
        leverageOnSuccess: 0.14,
        onSuccess: {
          narrative: 'The court\'s hidden architecture is clear. The whisper can be placed precisely.',
        },
        onFailure: {
          narrative: 'The court\'s dynamics remain opaque. The whisper may misfire.',
        },
      },
      {
        id: 'court_whispers.plant',
        name: 'Plant the Whisper',
        reach: 'shadow',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.18,
        leverageOnFailure: -0.10,
        narrative: 'The information — real or embellished — is placed where it will grow. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The whisper takes root. It will spread on its own now.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The whisper falls flat or is met with skepticism.',
        },
      },
      {
        id: 'court_whispers.counter_whisper',
        name: 'Deflect the Counter-Whisper',
        reach: 'shadow',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.08,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'Someone is whispering back. A counter-narrative is already circulating. {actor} must deflect it.',
        onSuccess: {
          narrative: 'The counter-whisper is discredited before it gains traction.',
        },
        onFailure: {
          narrative: 'The counter-whisper spreads faster than anticipated.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'court_whispers.outcome',
        name: 'Witness the Fallout',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The whisper has traveled. {actor} watches to see what it has wrought.',
        onSuccess: {
          narrative: 'The whisper has done its work. The intended target is weakened.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The whisper has been traced back. The plan is exposed.',
          reputationDelta: -0.05,
        },
      },
    ],
  },

  // 14. Spy Debrief
  {
    id: 'social_scene.spy_debrief',
    name: 'Spy Debrief',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['revelation_discretion', 'honesty_cunning'],
    steps: [
      {
        id: 'spy_debrief.meet',
        name: 'Secure the Meeting',
        reach: 'shadow',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} arranges the meeting in a location and manner that won\'t leave traces.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.06,
        onSuccess: {
          narrative: 'The meeting is secured cleanly. No one followed either party.',
        },
        onFailure: {
          narrative: 'The meeting is hurried or compromised. The debrief will be rushed.',
        },
      },
      {
        id: 'spy_debrief.read',
        name: 'Assess Loyalty',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} reads the contact carefully — are they still reliable, or has something shifted?',
        leverageOnSuccess: 0.14,
        onSuccess: {
          narrative: 'The contact\'s loyalty reads as intact. The information will be honest.',
        },
        onFailure: {
          narrative: 'Something is off. The contact is under pressure — or has been turned.',
        },
      },
      {
        id: 'spy_debrief.extract',
        name: 'Extract the Intelligence',
        reach: 'shadow',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.18,
        leverageOnFailure: -0.10,
        narrative: '{actor} extracts the intelligence methodically — verifying, cross-referencing, filling gaps. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The intelligence is solid and actionable. Worth the risk of the meeting.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The intelligence is partial or suspect. Something doesn\'t add up.',
        },
      },
      {
        id: 'spy_debrief.compromised',
        name: 'Handle the Complication',
        reach: 'shadow',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The contact reveals something troubling — a compromise, a doubt, or a counter-agent. {actor} must handle it.',
        onSuccess: {
          narrative: 'The complication is managed cleanly. The debrief continues.',
        },
        onFailure: {
          narrative: 'The complication derails the debrief. Too much time, too many risks.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'spy_debrief.extract_close',
        name: 'Exfiltration',
        reach: 'shadow',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The debrief concludes. Both parties separate cleanly — or don\'t.',
        onSuccess: {
          narrative: 'The exfiltration is clean. The intelligence is secured and the network intact.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.5, artifact: 0.5 }, rarityWeights: { common: 0.4, uncommon: 0.6 } },
        },
        onFailure: {
          narrative: 'The departure is clumsy. There may be complications later.',
          reputationDelta: -0.03,
        },
      },
    ],
  },

  // 15. The Double Agent
  {
    id: 'social_scene.double_agent',
    name: 'The Double Agent',
    locationTypes: [...URBAN],
    reachPrimary: 'shadow',
    reachSecondary: 'heart',
    encounterType: 'steal',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    steps: [
      {
        id: 'double_agent.approach',
        name: 'Make First Contact',
        reach: 'shadow',
        difficulty: D_MED,
        duration: 2,
        narrative: '{actor} approaches a contact with divided loyalties — feeling out their true allegiance before making any offer.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The contact reveals just enough to confirm they can be turned.',
        },
        onFailure: {
          narrative: 'The contact is guarded. First contact was felt, not made.',
        },
      },
      {
        id: 'double_agent.read',
        name: 'Read Their Loyalty',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} probes the contact\'s true motivation — is it greed, principle, or fear that drives them?',
        leverageOnSuccess: 0.15,
        onSuccess: {
          narrative: 'The real motivation is identified. The offer can be tailored to it.',
        },
        onFailure: {
          narrative: 'The motivation remains unclear. The pitch will have to be general.',
        },
      },
      {
        id: 'double_agent.pitch',
        name: 'Make the Offer',
        reach: 'heart',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: '{actor} offers the double agent a new loyalty — with the right justification. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The offer lands. Something shifts in the contact\'s eyes.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The offer is refused or doubted. The contact is not yet ready to switch sides.',
        },
      },
      {
        id: 'double_agent.test',
        name: 'Test the Allegiance',
        reach: 'shadow',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The contact is given a small test — a piece of intelligence, a simple task. Do they deliver?',
        onSuccess: {
          narrative: 'The test passes. The double agent has committed, if only provisionally.',
        },
        onFailure: {
          narrative: 'The test fails. The contact is unreliable or still loyal to the other side.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'double_agent.turn',
        name: 'Complete the Turn',
        reach: 'shadow',
        difficulty: D_VHARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.05,
        leverageOnFailure: -0.05,
        narrative: 'The turning is either complete or it isn\'t. This is the moment that determines it.',
        onSuccess: {
          narrative: 'The double agent is now {actor}\'s. A valuable asset, if a dangerous one.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.6, artifact: 0.4 }, rarityWeights: { uncommon: 0.5, rare: 0.5 } },
        },
        onFailure: {
          narrative: 'The turn fails. The contact remains loyal to their original side — and now knows {actor}\'s intentions.',
          reputationDelta: -0.08,
        },
      },
    ],
  },
];

// ─── Intimidation Templates (4) ───────────────────────────────────────────

const INTIMIDATION_TEMPLATES: EncounterTemplate[] = [

  // 16. The Confrontation
  {
    id: 'social_scene.confrontation',
    name: 'The Confrontation',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'iron',
    reachSecondary: 'shadow',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        id: 'confrontation.position',
        name: 'Take Position',
        reach: 'iron',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} plants themselves in {target}\'s path — deliberately, visibly, impossible to ignore.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.06,
        onSuccess: {
          narrative: '{target} stops. They know what this is.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{target} attempts to walk past. The confrontation starts badly.',
        },
      },
      {
        id: 'confrontation.read',
        name: 'Read Their Fear',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} searches for the break in the composure — the tell that reveals what {target} is afraid of.',
        leverageOnSuccess: 0.14,
        onSuccess: {
          narrative: 'The fear is there — and now {actor} knows exactly where to press.',
        },
        onFailure: {
          narrative: '{target} gives nothing away. The confrontation will have to be blunt.',
        },
      },
      {
        id: 'confrontation.deliver',
        name: 'Deliver the Message',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: 'The message is delivered with the full weight of what {actor} is prepared to do. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The message lands. {target}\'s confidence visibly falters.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{target} stands their ground. The message doesn\'t penetrate.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'confrontation.stand',
        name: 'Hold the Ground',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: '{target} refuses to back down — testing {actor}\'s resolve. One of them will blink.',
        onSuccess: {
          narrative: '{actor} doesn\'t blink. {target} does.',
        },
        onFailure: {
          narrative: 'The standoff breaks in {target}\'s favor. {actor} was tested and found wanting.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'confrontation.outcome',
        name: 'The Outcome',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The confrontation resolves — one way or the other.',
        onSuccess: {
          narrative: '{target} yields. The confrontation is won.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 1.0 }, rarityWeights: { common: 0.6, uncommon: 0.4 } },
        },
        onFailure: {
          narrative: '{target} doesn\'t yield. {actor} retreats or escalates — neither option is good.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  // 17. Protection Racket
  {
    id: 'social_scene.protection_racket',
    name: 'Protection Racket',
    locationTypes: [...URBAN],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['mercy_ruthlessness', 'asceticism_extravagance'],
    steps: [
      {
        id: 'protection_racket.survey',
        name: 'Survey the Mark',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} establishes which businesses or individuals are worth approaching and what they can afford.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.05,
        onSuccess: {
          narrative: 'The mark is well-chosen — worth the effort and unlikely to fight back alone.',
        },
        onFailure: {
          narrative: 'The mark is harder to read. They may be better connected than expected.',
        },
      },
      {
        id: 'protection_racket.approach',
        name: 'Make the Approach',
        reach: 'iron',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} pays a visit — ostensibly friendly, but the message is not ambiguous.',
        leverageOnSuccess: 0.14,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The visit lands as intended. The mark knows exactly what\'s being proposed.',
        },
        onFailure: {
          narrative: 'The approach is misread or dismissed. The mark doesn\'t take it seriously.',
        },
      },
      {
        id: 'protection_racket.demand',
        name: 'State the Terms',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: 'The arrangement is spelled out: regular payment in exchange for — well. Peace.',
        onSuccess: {
          narrative: 'The mark complies, visibly unhappy but calculating the cost of refusal.',
          reputationDelta: -0.02,
        },
        onFailure: {
          narrative: 'The mark refuses or escalates. This is becoming a problem.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'protection_racket.defiance',
        name: 'Crush the Defiance',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The mark has decided to resist — perhaps they have allies {actor} didn\'t account for.',
        onSuccess: {
          narrative: 'The resistance is broken. The mark had nothing behind the defiance.',
        },
        onFailure: {
          narrative: 'The defiance holds. This has become a fight, not a negotiation.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'protection_racket.collect',
        name: 'First Collection',
        reach: 'gold',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The first payment is due. Does it arrive?',
        onSuccess: {
          narrative: 'The payment arrives on time. The arrangement is established.',
          reputationDelta: 0.01,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { artifact: 0.8, trait: 0.2 }, rarityWeights: { common: 0.7, uncommon: 0.3 } },
        },
        onFailure: {
          narrative: 'The payment doesn\'t arrive. The arrangement is being tested.',
          reputationDelta: -0.04,
        },
      },
    ],
  },

  // 18. Warlord's Demand
  {
    id: 'social_scene.warlords_demand',
    name: 'Warlord\'s Demand',
    locationTypes: [...MAJOR],
    reachPrimary: 'iron',
    reachSecondary: 'gold',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        id: 'warlords_demand.arrival',
        name: 'The Arrival',
        reach: 'iron',
        difficulty: D_MED,
        duration: 2,
        narrative: '{actor} arrives at {target}\'s gates with enough force to make the message visible. Not siege — demonstration.',
        leverageOnSuccess: 0.15,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The arrival is unmistakable. {target}\'s leadership is already in emergency council.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The arrival is misjudged — too small to be credible, or too large to feel like negotiation.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'warlords_demand.read',
        name: 'Read Their Resolve',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} sends a messenger, reads the response — gauging whether {target} will fight or fold.',
        leverageOnSuccess: 0.12,
        onSuccess: {
          narrative: 'The resolve reads as brittle. They\'re scared — they\'ll negotiate.',
        },
        onFailure: {
          narrative: 'The resolve is harder to read than expected. There may be more backbone here.',
        },
      },
      {
        id: 'warlords_demand.terms',
        name: 'State the Demands',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: 'The demands are presented plainly: tribute, fealty, or passage. Compliance or blood. {sphere_flavor}.',
        onSuccess: {
          narrative: '{target}\'s response is conciliatory. They want to find a way to comply.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: '{target} refuses outright. They\'ve decided defiance is cheaper.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'warlords_demand.show_of_force',
        name: 'Show of Force',
        reach: 'iron',
        difficulty: D_VHARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'Words have not been enough. A demonstration is needed — something that cannot be ignored.',
        onSuccess: {
          narrative: 'The demonstration of force is decisive. The defiance crumbles.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The show of force is met with an unexpected counter. This is now a real fight.',
          reputationDelta: -0.06,
        },
      },
      {
        id: 'warlords_demand.submission',
        name: 'Extract Submission',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        narrative: 'The final word is demanded. Submit — or face the consequences.',
        onSuccess: {
          narrative: 'Submission is given. Whether it holds is another matter.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.5, artifact: 0.5 }, rarityWeights: { uncommon: 0.5, rare: 0.5 } },
        },
        onFailure: {
          narrative: 'Submission is withheld. The warlord\'s demand has failed.',
          reputationDelta: -0.08,
        },
      },
    ],
  },

  // 19. The Challenge
  {
    id: 'social_scene.the_challenge',
    name: 'The Challenge',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'iron',
    reachSecondary: 'heart',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['courage_prudence', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'the_challenge.throw_down',
        name: 'Throw Down the Gauntlet',
        reach: 'iron',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} issues the challenge publicly, before witnesses — making refusal itself a statement.',
        leverageOnSuccess: 0.14,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The challenge is accepted — there was no other honorable option.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The challenge is laughed off or sidestepped. Public humiliation stings.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'the_challenge.read',
        name: 'Size Up the Opponent',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} watches {target}\'s bearing and movement — reading the tells of how they plan to fight.',
        leverageOnSuccess: 0.14,
        onSuccess: {
          narrative: 'The tells are visible. {actor} has identified the opening.',
        },
        onFailure: {
          narrative: '{target} is unreadable. The fight will be improvised.',
        },
      },
      {
        id: 'the_challenge.face',
        name: 'Face the Opponent',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: 'The challenge is not merely strength — it\'s the force of will behind it. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The pressure is building in {actor}\'s favor. The opponent is being worn down.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The opponent has the edge. {actor} is on the back foot.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'the_challenge.final_exchange',
        name: 'The Final Exchange',
        reach: 'iron',
        difficulty: D_VHARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'Everything narrows to this exchange. One outcome.',
        onSuccess: {
          narrative: 'The challenge is won. {actor} stands over a defeated opponent.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.7, condition: 0.3 }, rarityWeights: { uncommon: 0.6, rare: 0.4 } },
        },
        onFailure: {
          narrative: 'The challenge is lost. Defeat is public and unambiguous.',
          reputationDelta: -0.08,
          appliesWound: true,
        },
      },
    ],
  },
];

// ─── Ceremony Templates (4) ───────────────────────────────────────────────

const CEREMONY_TEMPLATES: EncounterTemplate[] = [

  // 20. Oath Swearing
  {
    id: 'social_scene.oath_swearing',
    name: 'Oath Swearing',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ['sacrifice_survival', 'loyalty_ambition'],
    sphereAffinity: 'order',
    steps: [
      {
        id: 'oath_swearing.preparation',
        name: 'Prepare the Ceremony',
        reach: 'star',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} prepares the ritual elements — the words, the witnesses, the space where the oath will be spoken.',
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.04,
        onSuccess: {
          narrative: 'The ceremony is prepared with proper care. The words will carry weight.',
        },
        onFailure: {
          narrative: 'The preparation is rushed or incomplete. The ceremony will lack ceremony.',
        },
      },
      {
        id: 'oath_swearing.witnesses',
        name: 'Gather Witnesses',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} ensures the right witnesses are present — those whose testimony will make the oath binding in the world.',
        leverageOnSuccess: 0.12,
        onSuccess: {
          narrative: 'The witnesses are gathered and the space is ready.',
        },
        onFailure: {
          narrative: 'The witness pool is sparse or unreliable. The oath\'s weight is diminished.',
        },
      },
      {
        id: 'oath_swearing.speak',
        name: 'Speak the Oath',
        reach: 'star',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: 'The oath is spoken aloud. {sphere_flavor}. The words bind.',
        onSuccess: {
          narrative: 'The words carry conviction and reach. The witnesses feel the weight of it.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.8, condition: 0.2 }, rarityWeights: { common: 0.5, uncommon: 0.5 } },
        },
        onFailure: {
          narrative: 'The oath is spoken, but it lands without ceremony. The words are just words.',
          reputationDelta: -0.02,
        },
      },
    ],
  },

  // 21. Trial & Judgment
  {
    id: 'social_scene.trial_judgment',
    name: 'Trial & Judgment',
    locationTypes: [...URBAN],
    reachPrimary: 'eye',
    reachSecondary: 'star',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['revelation_discretion', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'trial_judgment.opening',
        name: 'Opening Statement',
        reach: 'heart',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} addresses the assembled court — establishing the narrative of the case before evidence is heard.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.06,
        onSuccess: {
          narrative: 'The court is attentive. The narrative is credible.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The court is skeptical from the start. The narrative doesn\'t hold.',
        },
      },
      {
        id: 'trial_judgment.evidence',
        name: 'Present the Evidence',
        reach: 'eye',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.22,
        leverageOnFailure: -0.12,
        narrative: 'The evidence is laid out methodically — each piece building on the last. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The evidence is compelling. The court leans toward conviction.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The evidence is challenged and found wanting. The case is weakening.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'trial_judgment.counter_argument',
        name: 'Counter the Defense',
        reach: 'eye',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The defense mounts a challenge. {actor} must rebut it in front of the court.',
        onSuccess: {
          narrative: 'The rebuttal is crisp. The defense\'s argument collapses.',
        },
        onFailure: {
          narrative: 'The defense finds purchase. The court is now genuinely uncertain.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'trial_judgment.verdict',
        name: 'The Verdict',
        reach: 'star',
        difficulty: D_VHARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The court deliberates. The verdict is rendered.',
        onSuccess: {
          narrative: 'Conviction. Justice — such as it is — has been served.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.6, condition: 0.4 }, rarityWeights: { uncommon: 0.5, rare: 0.5 } },
        },
        onFailure: {
          narrative: 'Acquittal or hung judgment. The accused walks free.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  // 22. Coronation Speech
  {
    id: 'social_scene.coronation_speech',
    name: 'Coronation Speech',
    locationTypes: [...MAJOR],
    reachPrimary: 'star',
    reachSecondary: 'heart',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ['sacrifice_survival', 'preservation_transformation'],
    sphereAffinity: 'order',
    steps: [
      {
        id: 'coronation_speech.prepare',
        name: 'Prepare the Address',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} researches the crowd — what they need to hear, what fears they carry, what hopes must be invoked.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.06,
        onSuccess: {
          narrative: 'The speech is shaped around what the crowd needs. The words will resonate.',
        },
        onFailure: {
          narrative: 'The research is incomplete. The speech will be general where it needed to be specific.',
        },
      },
      {
        id: 'coronation_speech.opening_words',
        name: 'The Opening Words',
        reach: 'heart',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.18,
        leverageOnFailure: -0.10,
        narrative: 'The first words land. They determine whether the crowd opens or closes. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The crowd stirs. Something in the opening found the right note.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The opening is flat or formal. The crowd is polite, not moved.',
        },
      },
      {
        id: 'coronation_speech.dissent',
        name: 'Address Dissent',
        reach: 'heart',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'A visible dissenter in the crowd disrupts the mood. {actor} must address it or lose the room.',
        onSuccess: {
          narrative: 'The dissent is addressed with grace. The crowd is swayed back.',
        },
        onFailure: {
          narrative: 'The dissent is mishandled. Sympathizers in the crowd grow vocal.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'coronation_speech.climax',
        name: 'The Climax',
        reach: 'star',
        difficulty: D_VHARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The speech builds to its highest point. Everything {actor} has prepared converges here.',
        onSuccess: {
          narrative: 'The crowd erupts. The coronation is complete — legitimacy has been granted by the people.',
          reputationDelta: 0.12,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.6, artifact: 0.4 }, rarityWeights: { uncommon: 0.5, rare: 0.5 } },
        },
        onFailure: {
          narrative: 'The speech ends on a weak note. The coronation proceeds, but without the fire it needed.',
          reputationDelta: -0.04,
        },
      },
    ],
  },

  // 23. Eulogy & Memorial
  {
    id: 'social_scene.eulogy_memorial',
    name: 'Eulogy & Memorial',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'heart',
    reachSecondary: 'star',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ['sacrifice_survival', 'loyalty_ambition'],
    steps: [
      {
        id: 'eulogy_memorial.remember',
        name: 'Call Up the Memory',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} speaks of the dead as they actually were — not the sanitized version, but the truth that made them worth mourning.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.05,
        onSuccess: {
          narrative: 'The room recognizes the truth of it. Grief surfaces cleanly.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The words feel rehearsed or generic. The grief is not served.',
        },
      },
      {
        id: 'eulogy_memorial.meaning',
        name: 'Find the Meaning',
        reach: 'star',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: '{actor} moves from memory to meaning — what this life mattered, what it leaves behind. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The meaning lands. Something is named that the mourners had felt but not articulated.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.8, condition: 0.2 }, rarityWeights: { common: 0.6, uncommon: 0.4 } },
        },
        onFailure: {
          narrative: 'The meaning is stated but not felt. The eulogy ends as it began — correctly, but not truly.',
          reputationDelta: -0.01,
        },
      },
    ],
  },
];

// ─── Community Templates (4) ──────────────────────────────────────────────

const COMMUNITY_TEMPLATES: EncounterTemplate[] = [

  // 24. Festival Gathering
  {
    id: 'social_scene.festival_gathering',
    name: 'Festival Gathering',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'trivial',
    intrinsicTier: 'background',
    motivations: ['loyalty_ambition', 'mercy_ruthlessness'],
    steps: [
      {
        id: 'festival_gathering.mingle',
        name: 'Work the Crowd',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 2,
        narrative: '{actor} moves through the festival — not seeking anything specific, just being present and memorable.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.04,
        onSuccess: {
          narrative: 'Connections are made and reinforced. {actor} leaves a good impression.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The effort to mingle falls flat. {actor} drifts through the crowd without connecting.',
        },
      },
      {
        id: 'festival_gathering.moment',
        name: 'Find the Moment',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} finds the right moment in the celebration to say something that will be remembered.',
        leverageOnSuccess: 0.14,
        onSuccess: {
          narrative: 'The moment is found and used. Words spoken here will travel.',
        },
        onFailure: {
          narrative: 'The moment passes unused. The festival will not be memorable for {actor}.',
        },
      },
      {
        id: 'festival_gathering.toast',
        name: 'The Toast',
        reach: 'heart',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.15,
        leverageOnFailure: -0.08,
        narrative: '{actor} raises a cup and speaks. Briefly, but with intent. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The toast is met with genuine warmth. Something has been built here.',
          reputationDelta: 0.05,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The toast is politely received but not felt. A small social disappointment.',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // 25. War Council
  {
    id: 'social_scene.war_council',
    name: 'War Council',
    locationTypes: [...MAJOR],
    reachPrimary: 'iron',
    reachSecondary: 'eye',
    encounterType: 'lead',
    threatRating: 'hard',
    intrinsicTier: 'shaping',
    motivations: ['mercy_ruthlessness', 'courage_prudence'],
    steps: [
      {
        id: 'war_council.intelligence',
        name: 'Present the Intelligence',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} lays out what is known and, more importantly, what is uncertain — reading how the council takes it.',
        leverageOnSuccess: 0.14,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The intelligence is received credibly. The council trusts the assessment.',
        },
        onFailure: {
          narrative: 'The intelligence is doubted or dismissed. The council is not persuaded.',
        },
      },
      {
        id: 'war_council.plan',
        name: 'Argue the Plan',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: '{actor} argues for a specific course of action — with the conviction that comes from genuine belief. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The argument lands. The council is moving toward consensus.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The argument is contested. Rival factions push their own plans.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'war_council.dissent',
        name: 'Silence the Dissent',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'A senior figure objects forcefully. The council is watching to see if {actor} holds.',
        onSuccess: {
          narrative: 'The objection is answered with authority. The dissenter backs down.',
        },
        onFailure: {
          narrative: 'The dissent gains supporters. The plan is in danger.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'war_council.decision',
        name: 'Force the Decision',
        reach: 'iron',
        difficulty: D_VHARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The council must commit. There is no more time for debate.',
        onSuccess: {
          narrative: 'The council commits to the plan. The decision is made.',
          reputationDelta: 0.10,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.5, artifact: 0.5 }, rarityWeights: { uncommon: 0.6, rare: 0.4 } },
        },
        onFailure: {
          narrative: 'The council cannot reach consensus. The decision is delayed — a dangerous outcome.',
          reputationDelta: -0.06,
        },
      },
    ],
  },

  // 26. Tavern Confession
  {
    id: 'social_scene.tavern_confession',
    name: 'Tavern Confession',
    locationTypes: [...SETTLEMENTS],
    sublocationTypes: ['tavern'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    steps: [
      {
        id: 'tavern_confession.listen',
        name: 'Open the Ear',
        reach: 'heart',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} creates the conditions for honesty — drinks, patience, an absence of judgment.',
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.04,
        onSuccess: {
          narrative: '{target} relaxes. Something is building toward the surface.',
        },
        onFailure: {
          narrative: 'The right conditions don\'t materialize. The conversation stays shallow.',
        },
      },
      {
        id: 'tavern_confession.draw_out',
        name: 'Draw Out the Truth',
        reach: 'eye',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: '{actor} listens between the lines, gently pressing on the places where the truth is trying to surface. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The truth emerges — imperfect, halting, but genuine.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The moment passes. The truth stays below the surface.',
        },
      },
      {
        id: 'tavern_confession.receive',
        name: 'Receive It Properly',
        reach: 'heart',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.12,
        leverageOnFailure: -0.08,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'What was said is delicate. How {actor} responds will determine whether the bond holds.',
        onSuccess: {
          narrative: 'The response is exactly right — present without judgment, warm without performance.',
          reputationDelta: 0.04,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The response misses the mark. The moment of vulnerability closes.',
          reputationDelta: -0.03,
        },
      },
    ],
  },

  // 27. Town Assembly
  {
    id: 'social_scene.town_assembly',
    name: 'Town Assembly',
    locationTypes: [...URBAN],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'lead',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['preservation_transformation', 'loyalty_ambition'],
    steps: [
      {
        id: 'town_assembly.read_mood',
        name: 'Read the Room',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 1,
        narrative: '{actor} arrives early and listens — reading the anxiety, the hope, the grievance in the crowd before it begins.',
        leverageOnSuccess: 0.14,
        leverageOnFailure: -0.06,
        onSuccess: {
          narrative: 'The mood is mapped. {actor} knows the fault lines before the meeting starts.',
        },
        onFailure: {
          narrative: 'The mood is harder to read than expected. The assembly will be improvised.',
        },
      },
      {
        id: 'town_assembly.address',
        name: 'Address the Assembly',
        reach: 'heart',
        difficulty: D_MED,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: '{actor} speaks to the assembly — not to the floor but to the people. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The assembly stirs with recognition. {actor} has said what needed to be said.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The address falls into rhetoric. The assembly remains divided.',
          reputationDelta: -0.03,
        },
      },
      {
        id: 'town_assembly.heckler',
        name: 'Handle the Heckler',
        reach: 'heart',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.08,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'Someone from the crowd challenges the argument — loudly, in front of everyone.',
        onSuccess: {
          narrative: 'The challenge is answered with composure and substance. The crowd approves.',
        },
        onFailure: {
          narrative: 'The challenge finds support. The assembly\'s confidence in {actor} wobbles.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'town_assembly.motion',
        name: 'Call the Motion',
        reach: 'heart',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The time for talk is done. {actor} calls for a decision.',
        onSuccess: {
          narrative: 'The motion carries. The assembly has spoken.',
          reputationDelta: 0.07,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.8, condition: 0.2 }, rarityWeights: { common: 0.5, uncommon: 0.5 } },
        },
        onFailure: {
          narrative: 'The motion fails. The assembly remains at an impasse.',
          reputationDelta: -0.05,
        },
      },
    ],
  },
];

// ─── Investigation Templates (3) ─────────────────────────────────────────

const INVESTIGATION_TEMPLATES: EncounterTemplate[] = [

  // 28. The Interrogation
  {
    id: 'social_scene.the_interrogation',
    name: 'The Interrogation',
    locationTypes: [...URBAN],
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'steal',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['revelation_discretion', 'honesty_cunning'],
    steps: [
      {
        id: 'the_interrogation.establish_control',
        name: 'Establish Control',
        reach: 'iron',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} establishes the conditions of the interrogation — making clear who holds the power here.',
        leverageOnSuccess: 0.14,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'Control is established. The subject understands their situation.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The subject doesn\'t feel controlled. They\'re calculating their options.',
          reputationDelta: -0.02,
        },
      },
      {
        id: 'the_interrogation.probe',
        name: 'Probe for Weakness',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} probes — not for information yet, but for the cracks in the subject\'s composure.',
        leverageOnSuccess: 0.16,
        onSuccess: {
          narrative: 'The cracks are found. The subject is more frightened than they\'re showing.',
        },
        onFailure: {
          narrative: 'The subject is composed or genuinely fearless. Harder to break.',
        },
      },
      {
        id: 'the_interrogation.press',
        name: 'Press the Advantage',
        reach: 'shadow',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.12,
        narrative: '{actor} presses on what they know — real and implied — watching the subject\'s defenses fracture. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The defenses crack. Information begins to surface.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The subject holds. The interrogation is losing momentum.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'the_interrogation.resistance',
        name: 'Break the Resistance',
        reach: 'eye',
        difficulty: D_VHARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: 'The subject has found their resolve again. {actor} must break it a second time.',
        onSuccess: {
          narrative: 'The second break is harder but successful. What holds is gone.',
        },
        onFailure: {
          narrative: 'The second break fails. The subject has closed themselves off completely.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'the_interrogation.extract',
        name: 'Extract the Truth',
        reach: 'eye',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The truth is there, beneath the surface. Can {actor} extract it?',
        onSuccess: {
          narrative: 'The truth is out. The interrogation has achieved its purpose.',
          reputationDelta: 0.06,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.6, artifact: 0.4 }, rarityWeights: { uncommon: 0.6, rare: 0.4 } },
        },
        onFailure: {
          narrative: 'The subject gives nothing usable. The interrogation has failed.',
          reputationDelta: -0.04,
        },
      },
    ],
  },

  // 29. Reputation Assessment
  {
    id: 'social_scene.reputation_assessment',
    name: 'Reputation Assessment',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'background',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        id: 'reputation_assessment.gather',
        name: 'Gather Accounts',
        reach: 'eye',
        difficulty: D_EASY,
        duration: 2,
        narrative: '{actor} moves through the settlement, asking about {target} — gathering impressions from different sources.',
        leverageOnSuccess: 0.14,
        leverageOnFailure: -0.06,
        onSuccess: {
          narrative: 'Multiple consistent accounts emerge. A picture is forming.',
        },
        onFailure: {
          narrative: 'The accounts are contradictory or sparse. The picture is unclear.',
        },
      },
      {
        id: 'reputation_assessment.source',
        name: 'Find the Key Source',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        narrative: '{actor} identifies someone who knows {target} directly — and convinces them to speak frankly. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The key source is found and speaks. The reputation assessment is complete.',
          reputationDelta: 0.03,
          tierPromotionEligible: true,
          rewardPool: { categoryWeights: { trait: 0.7, artifact: 0.3 }, rarityWeights: { common: 0.7, uncommon: 0.3 } },
        },
        onFailure: {
          narrative: 'The key source won\'t speak or is unavailable. The assessment remains incomplete.',
        },
      },
    ],
  },

  // 30. The Accusation
  {
    id: 'social_scene.the_accusation',
    name: 'The Accusation',
    locationTypes: [...SETTLEMENTS],
    reachPrimary: 'eye',
    reachSecondary: 'iron',
    encounterType: 'duel',
    threatRating: 'moderate',
    intrinsicTier: 'present',
    motivations: ['revelation_discretion', 'honesty_cunning'],
    steps: [
      {
        id: 'the_accusation.foundation',
        name: 'Lay the Foundation',
        reach: 'eye',
        difficulty: D_MED,
        duration: 1,
        narrative: '{actor} establishes the facts before issuing the accusation — making the charge substantive, not emotional.',
        leverageOnSuccess: 0.14,
        leverageOnFailure: -0.08,
        onSuccess: {
          narrative: 'The foundation is solid. The accusation will have weight behind it.',
        },
        onFailure: {
          narrative: 'The foundation is shaky. The accusation may be dismissed as conjecture.',
        },
      },
      {
        id: 'the_accusation.charge',
        name: 'Issue the Charge',
        reach: 'eye',
        difficulty: D_HARD,
        duration: 2,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.22,
        leverageOnFailure: -0.12,
        narrative: 'The accusation is stated plainly and without qualification. {sphere_flavor}.',
        onSuccess: {
          narrative: 'The charge lands with clarity. Witnesses are shaken by its specificity.',
          reputationDelta: 0.05,
        },
        onFailure: {
          narrative: 'The charge is deflected or disputed. {target} mounts an effective denial.',
          reputationDelta: -0.04,
        },
      },
      {
        id: 'the_accusation.response',
        name: 'Handle the Response',
        reach: 'iron',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        leverageOnSuccess: 0.10,
        leverageOnFailure: -0.10,
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        narrative: '{target} responds — with denial, counter-accusation, or outrage. {actor} must stand firm.',
        onSuccess: {
          narrative: '{actor} holds. The accusation is not withdrawn.',
        },
        onFailure: {
          narrative: 'The response forces a retreat. The accusation is weakened.',
          reputationDelta: -0.05,
        },
      },
      {
        id: 'the_accusation.verdict',
        name: 'The Verdict of the Crowd',
        reach: 'eye',
        difficulty: D_HARD,
        duration: 1,
        leverageModifiesDifficulty: true,
        narrative: 'The witnesses and bystanders will remember this. Was the accusation believed?',
        onSuccess: {
          narrative: 'The accusation is believed. The charge has stuck.',
          reputationDelta: 0.08,
          tierPromotionEligible: true,
        },
        onFailure: {
          narrative: 'The accusation has not been believed. {actor} is seen as wrong — or worse, malicious.',
          reputationDelta: -0.07,
        },
      },
    ],
  },
];

// ─── Combined Export ───────────────────────────────────────────────────────

export const SOCIAL_SCENE_TEMPLATES: EncounterTemplate[] = [
  ...PERSUASION_TEMPLATES,
  ...NEGOTIATION_TEMPLATES,
  ...INTRIGUE_TEMPLATES,
  ...INTIMIDATION_TEMPLATES,
  ...CEREMONY_TEMPLATES,
  ...COMMUNITY_TEMPLATES,
  ...INVESTIGATION_TEMPLATES,
];

export default SOCIAL_SCENE_TEMPLATES;
