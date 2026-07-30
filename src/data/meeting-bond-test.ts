/**
 * The bond test — Meet The First's climax. THR-868 (WS6).
 *
 * One universal template, not a pool. This beat happens exactly once per run and
 * closes the meeting, so its variety comes from the sphere-flavored hand and the
 * per-hunger god-voice line rather than from template selection.
 *
 * **The bond always forms** (Christian, grill verdict 5). Fate decides only how
 * the mortal receives it. A defiant First still bonds, and defies you — failure
 * writes the relationship's character, it never denies the relationship.
 *
 * Register: plain and descriptive — events, people, motivations. No lyrical
 * abstraction. The prose says what the person does and why.
 *
 * Plan: `Docs/plans/2026-07-30-thr-868-meet-the-first-nudge-conversion.md`
 * Authoring spec: `.claude/skills/encounter-pipeline/reference/` (nudge authoring)
 */

import type { BondTest } from '../types/meetingEncounter';

/**
 * Hand of 8. Sphere coverage: mind, spirit, light, darkness, life, time — six
 * spheres, above the ≥4 authoring floor — plus two sphere-less common cards so
 * no god can be priced or gated out of the climax.
 *
 * No `poleLean` on any card: the bond resolves a *reception*, not a value pole.
 * A lean here would be inert, and an inert authored field is how dead content
 * starts. Cards move the odds; the band names how the mortal takes it.
 *
 * Costs run 0–4 against a 50-per-sphere starting pool, well under the
 * `meetingNudgeCostCap` ceiling of ~8.
 */
const BOND_NUDGES: BondTest['nudges'] = [
  {
    id: 'bond.steady_the_room',
    name: 'Still the room',
    essenceCost: 0,
    forecastDelta: 0.06,
    fiction: 'The noise outside the door drops away. Nobody comments on it.',
    effectLine: 'A quiet room is easier to be spoken to in.',
    bandProse: {
      critical_success: 'In the quiet they hear you clearly, and do not mistake it for their own thought.',
      failure: 'The quiet only makes them aware that something has arranged it.',
    },
  },
  {
    id: 'bond.name_them',
    name: 'Say their name',
    sphere: 'mind',
    essenceCost: 3,
    forecastDelta: 0.14,
    fiction: 'You use the name their mother used, the one nobody else has said in years.',
    effectLine: 'Being known by name is hard to argue with.',
    bandProse: {
      critical_success: 'They answer the name before they think to be frightened of who used it.',
      success: 'They turn toward the name like it was a hand on their shoulder.',
      critical_failure: 'Hearing that name from nowhere is the worst thing that has happened to them.',
    },
  },
  {
    id: 'bond.show_the_debt',
    name: 'Show the old debt',
    sphere: 'time',
    essenceCost: 4,
    forecastDelta: 0.16,
    fiction: 'You let them remember the night they should not have survived, and who was watching.',
    effectLine: 'They already owe you. This is the reminder.',
    bandProse: {
      critical_success: 'They understand they have been carried before, and that they never asked why.',
      success: 'The old night comes back with a witness in it.',
      failure: 'They resent the debt more than they are grateful for the survival.',
    },
  },
  {
    id: 'bond.warmth',
    name: 'Warm their hands',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.10,
    fiction: 'The cold goes out of their fingers. Their shoulders come down.',
    effectLine: 'A body that is not braced listens better.',
    bandProse: {
      success: 'They notice their hands are warm and decide not to question it yet.',
      near_miss: 'The warmth arrives and they wait for the price of it.',
    },
  },
  {
    id: 'bond.lamp',
    name: 'Light the lamp',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.11,
    fiction: 'The lamp they had given up on catches, and holds.',
    effectLine: 'Something small goes right, in front of them.',
    bandProse: {
      critical_success: 'A lamp lighting itself is a small miracle, and they take it as one.',
      failure: 'They put the lamp out and stand in the dark on purpose.',
    },
  },
  {
    id: 'bond.long_shadow',
    name: 'Stand in the doorway',
    sphere: 'darkness',
    essenceCost: 2,
    forecastDelta: 0.11,
    fiction: 'Your attention falls across the threshold, and they can see the shape of it.',
    effectLine: 'Some people need to be certain something is there.',
    bandProse: {
      success: 'They look at the shape in the doorway and stay where they are.',
      failure: 'They have seen enough of what stands in doorways.',
    },
  },
  {
    id: 'bond.old_prayer',
    name: 'Answer an old prayer',
    sphere: 'spirit',
    essenceCost: 3,
    forecastDelta: 0.15,
    fiction: 'A thing they asked for years ago, and stopped asking for, arrives now.',
    effectLine: 'A late answer still counts as an answer.',
    bandProse: {
      critical_success: 'They had stopped believing anyone was counting. Someone was.',
      success: 'The answer comes late, and they take it anyway.',
      critical_failure: 'The answer comes far too late to be a kindness.',
    },
  },
  {
    id: 'bond.say_nothing',
    name: 'Say nothing',
    essenceCost: 0,
    forecastDelta: 0.04,
    fiction: 'You do not explain yourself. You wait for them to speak first.',
    effectLine: 'Some people decide better without being pushed.',
    bandProse: {
      success: 'They speak first, which means the choice was theirs.',
      near_miss: 'They speak first, and what they say is a question you do not answer.',
    },
  },
];

/**
 * Per-hunger god-voice framing, one line each for all ten hungers.
 *
 * Diegetic teaching only (grill verdict 10): the line frames *why this god is
 * reaching*, in the god's own terms. It never explains the interface.
 */
const GOD_VOICE_BY_HUNGER: Record<string, string> = {
  gather: 'You have collected many things. This is the first one that will collect back.',
  witness: 'You have watched thousands of these. This is the first one you want to be seen by.',
  preserve: 'Everything you have held onto was already finished. This one is not.',
  reshape: 'You have bent stone and weather. A person bends differently, and knows it is happening.',
  reclaim: 'Something was taken from you. This is the hand you get to take back with.',
  consume: 'You are hungry, and this one is offering. Notice that you want them whole.',
  sever: 'You have cut everything loose. Here is the one tie you are choosing to make.',
  kindle: 'You have set fires in dry country. This one will burn on its own once lit.',
  bind: 'You have bound rivers and roads to their courses. This is the first that can refuse.',
  wander: 'You have never stayed anywhere. This is the first thing you would come back for.',
};

/** Used for any hunger with no authored variant — never a blank beat. */
const GOD_VOICE_FALLBACK =
  'You have reached for a great many things. This is the first one that can reach back.';

/**
 * The bond test.
 *
 * Difficulty sits at `fair` — the climax should usually land well, because the
 * lesson is "you shift the odds", not "the game punishes you at the door". The
 * two worst bands stay reachable, which is what makes `awe` mean anything.
 */
export const MEETING_BOND_TEST: BondTest = {
  id: 'meeting.bond_test',
  setup:
    'They are alone, doing something ordinary — and they stop, because they can tell they are being looked at. '
    + 'Not by anyone in the room. They stand very still and wait to find out what is looking.',
  purposeLine: 'How they take you',
  difficulty: 0.35,
  factorLines: [
    { text: 'They have wanted something to be out there for a long time.', polarity: 'for' },
    { text: 'The last person who watched them this closely wanted something.', polarity: 'against' },
    { text: 'Nobody has come looking for them before.', polarity: 'for' },
  ],
  nudges: BOND_NUDGES,
  godVoiceByHunger: GOD_VOICE_BY_HUNGER,
  godVoiceFallback: GOD_VOICE_FALLBACK,
  receptions: {
    awe: {
      prose:
        'They go down on the floor where they stand, not to worship — their legs simply stop holding them. '
        + 'When they can speak, they ask what you want them to do. They mean it as a real question.',
      traitSeed: 'struck_by_the_first_sight',
    },
    devotion: {
      prose:
        'They straighten up and say yes before you have asked anything. '
        + 'They spend the rest of the night deciding what they will have to give up, and are calm about it.',
      traitSeed: 'gave_the_answer_first',
    },
    bargain: {
      prose:
        'They ask what this costs. When you do not answer, they name their own terms out loud, '
        + 'to the empty room, so that both of you have heard them.',
      traitSeed: 'named_their_own_terms',
    },
    doubt: {
      prose:
        'They agree, and do not believe it. They check the room twice for someone playing a trick, '
        + 'and go to work in the morning as if nothing happened, waiting to be proven a fool.',
      traitSeed: 'waiting_to_be_fooled',
    },
    defiance: {
      prose:
        'They tell you no, out loud, to the ceiling. Then they feel the tie hold anyway, '
        + 'and understand that refusing was never one of the options. They will not forgive that.',
      traitSeed: 'bound_against_their_word',
    },
  },
};
