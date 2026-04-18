/**
 * Secret Discovery Encounter Content — 6 templates (THR-30)
 *
 * These encounters create `knows_secret_of` edges when they succeed.
 * Secret generation (secretType, magnitude, detail) is done by
 * secretGeneration.ts at aftermath time — the templates specify the
 * source and encounter context, not the secret content itself.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit prose, difficulty, and source metadata here.
 * The secretDiscovery field tells the aftermath handler what kind of
 * discovery this is (which feeds into magnitude modifiers).
 * ═══════════════════════════════════════════════════════════════════
 */

import type { EncounterTemplate } from '../types/encounter';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

const SETTLEMENT_LOCATIONS = ['hamlet', 'town', 'city', 'capital'] as const;
const TAVERN_SUBLOCATION = ['sublocation-type.tavern'];

export const SECRET_DISCOVERY_ENCOUNTER_TEMPLATES: EncounterTemplate[] = [

  // ─── 1. Confession Over Drinks (Heart, Tavern) ────────────────────────────
  {
    id: 'secret.confession_over_drinks',
    name: 'Confession Over Drinks',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'standard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.assist,
    secretDiscovery: { onSuccess: true, sourceName: 'confession' },
    steps: [
      {
        id: 'confession.pour',
        name: 'The Quiet Hour',
        reach: 'heart',
        difficulty: 25,
        duration: 2,
        narrative: '{actor} finds {targetAgent} alone at the bar, nursing their third drink. The hour is late and the room is half-empty. Some moments invite honesty.',
        onSuccess: {
          narrative: 'The words come slowly at first, then all at once. {targetAgent} has been carrying something for a long time, and {actor} is the first person to sit still long enough to receive it.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: '{targetAgent} considers {actor} for a long moment, then looks back at their drink. "You seem like a decent sort," they say. "But some things stay in the cup."',
          reputationDelta: -0.01,
        },
      },
    ],
  },

  // ─── 2. Quiet Observation (Eye, Any Settlement) ──────────────────────────
  {
    id: 'secret.quiet_observation',
    name: 'Quiet Observation',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'eye',
    reachSecondary: 'shadow',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'standard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    secretDiscovery: { onSuccess: true, sourceName: 'observation' },
    steps: [
      {
        id: 'observation.watch',
        name: 'Reading the Room',
        reach: 'eye',
        difficulty: 30,
        duration: 1,
        narrative: '{actor} is waiting — for someone, or nothing in particular — when they notice {targetAgent} across the room. Something about their posture, their meeting, the way they glance at the door, is wrong in a way that is hard to name.',
        onSuccess: {
          narrative: '{actor} does not move. They sit very still, because they have just understood something they did not want to know, and they cannot unknow it.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: '{actor} watches, but {targetAgent} gives nothing away. Whatever was there to see, the angle was wrong, or the light was bad, or {actor} was not looking at the right moment.',
          reputationDelta: 0,
        },
      },
    ],
  },

  // ─── 3. Overheard Argument (Eye, Any Settlement) ─────────────────────────
  {
    id: 'secret.overheard_argument',
    name: 'Overheard Argument',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'eye',
    reachSecondary: 'heart',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'standard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    secretDiscovery: { onSuccess: true, sourceName: 'tavern_gossip' },
    steps: [
      {
        id: 'overhear.listen',
        name: 'The Wrong Moment',
        reach: 'eye',
        difficulty: 28,
        duration: 1,
        narrative: '{actor} did not intend to listen. They were simply in the wrong corner of the room when {targetAgent}\'s voice rose above the noise.',
        onSuccess: {
          narrative: 'Enough. Not everything — the voices dropped again — but enough to understand the shape of it. What {actor} heard changes how {targetAgent} looks to them from this point on.',
          reputationDelta: 0.02,
        },
        onFailure: {
          narrative: 'The words were there, but the noise of the room swallowed the parts that would have mattered. {actor} caught tone, not content — and tone proves nothing.',
          reputationDelta: 0,
        },
      },
    ],
  },

  // ─── 4. Drunken Confession (Heart, Tavern) ───────────────────────────────
  {
    id: 'secret.drunken_confession',
    name: 'Drunken Confession',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    sublocationTypes: TAVERN_SUBLOCATION,
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'easy',
    intrinsicTier: 'standard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    secretDiscovery: { onSuccess: true, sourceName: 'confession' },
    steps: [
      {
        id: 'drunk.present',
        name: 'Three Cups In',
        reach: 'heart',
        difficulty: 22,
        duration: 2,
        narrative: '{targetAgent} has had more than was wise. They are still coherent, mostly — enough to know what they\'re saying, not enough to stop themselves from saying it.',
        onSuccess: {
          narrative: 'The thing that comes out is not a boast or a complaint but something older than that — a truth {targetAgent} has not said out loud before, one they will regret sharing come morning.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: '{targetAgent} talks a great deal, as people in this state tend to, but nothing that rises above the level of complaint. {actor} leaves knowing less than they hoped.',
          reputationDelta: 0,
        },
      },
    ],
  },

  // ─── 5. Spy Debrief (Shadow + Eye, Any Settlement) ───────────────────────
  {
    id: 'secret.spy_debrief',
    name: 'Spy Debrief',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'explore',
    threatRating: 'moderate',
    intrinsicTier: 'standard',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    secretDiscovery: { onSuccess: true, sourceName: 'spy_debrief' },
    steps: [
      {
        id: 'debrief.contact',
        name: 'The Meeting',
        reach: 'shadow',
        difficulty: 35,
        duration: 2,
        narrative: '{actor} meets their contact in a place that does not advertise itself. The contact has been watching {targetAgent} for some time and has something to report.',
        onSuccess: {
          narrative: 'The information is dry — dates, locations, names — but it adds up to something when {actor} assembles it. {targetAgent} has been doing something they should not, and now {actor} has the shape of it.',
          reputationDelta: 0.03,
        },
        onFailure: {
          narrative: 'The contact is apologetic. They have pieces, but not enough. Whatever {targetAgent} is concealing, they have been careful, and careful is hard to break from the outside.',
          reputationDelta: 0,
        },
      },
    ],
  },

  // ─── 6. Intercepted Message (Shadow, Any Settlement) ─────────────────────
  {
    id: 'secret.intercepted_message',
    name: 'Intercepted Message',
    locationTypes: [...SETTLEMENT_LOCATIONS],
    reachPrimary: 'shadow',
    reachSecondary: 'eye',
    encounterType: 'threaten',
    threatRating: 'moderate',
    intrinsicTier: 'shaping',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.threaten,
    secretDiscovery: { onSuccess: true, sourceName: 'spy_debrief' },
    steps: [
      {
        id: 'intercept.acquire',
        name: 'The Letter',
        reach: 'shadow',
        difficulty: 40,
        duration: 3,
        narrative: 'Word travels by letter in this city, and letters travel by hand. {actor} knows a courier, or knows someone who knows one. The question is whether the message was worth the risk of reading it.',
        onSuccess: {
          narrative: 'It was. The letter is not addressed to {targetAgent} — it is addressed {i}by{/i} them, which is more useful. What it says about {targetAgent}\'s intentions rewrites {actor}\'s understanding of them entirely.',
          reputationDelta: 0.04,
        },
        onFailure: {
          narrative: 'The letter was coded, or the wrong one, or destroyed before {actor} could read it fully. Whatever truth it contained, it has passed through their hands without transferring.',
          reputationDelta: -0.02,
        },
      },
    ],
  },
];
