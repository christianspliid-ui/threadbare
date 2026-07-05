/**
 * Corruptive scheme family (THR-66) — subtle/expansionist rivals.
 *
 * Arc: whisper campaign → seed heresy → shrine pressure → shrine betrayal.
 * The rival works through doubt and suborned faith, not force. Baseline
 * plainspoken register (THR-609); the crack beat is allowed a little lift.
 */
import type { RivalSchemeFamily } from './types';

export const CORRUPTIVE_FAMILY: RivalSchemeFamily = {
  id: 'corruptive',
  label: 'Corruptive Scheme',
  eligibleBehaviors: ['subtle', 'expansionist'],
  sphereLean: ['darkness', 'mind'],
  minTier: 0,
  requiresTarget: true,
  beats: [
    {
      phaseId: 'rumor',
      move: 'rumor',
      voice: 'mortal',
      proseVariants: [
        'Word moves through {location} faster than any rider. {rival} did not send it, but {rival} gave it its shape.',
        'A rumor takes hold in {location}. Small, at first. The kind {rival} likes, because no one remembers who said it first.',
        'People in {location} start repeating a thing none of them checked. {rival} counts on that.',
      ],
    },
    {
      phaseId: 'materialize',
      move: 'materialize',
      voice: 'mortal',
      proseVariants: [
        "{rival}'s hand shows in {location} now: a preacher no one hired, saying things no one taught.",
        'A stranger settles in {location} and starts drawing a crowd. {rival} paid for the room and the certainty both.',
        'The heresy has a face in {location} at last. {rival} keeps it well fed and pointed the right way.',
      ],
    },
    {
      phaseId: 'respond',
      move: 'escalate',
      voice: 'mortal',
      proseVariants: [
        'The shrine at {location} draws a thinner crowd each dusk. {rival} feeds on the empty benches.',
        'Doubt spreads through {location} like damp. {rival} keeps the doors just cracked enough for the cold to get in.',
        'Fewer prayers rise from {location} this week than last. {rival} has been patient, and patience pays.',
      ],
    },
    {
      phaseId: 'crack',
      move: 'crack',
      voice: 'divine',
      proseVariants: [
        'The shrine at {location} answers a new name tonight. {rival} kept the walls and gutted the meaning.',
        'What stood for you in {location} now bows the other way. {rival} did not break the shrine — it hollowed it and moved in.',
        'The faithful of {location} still kneel at the same stone. They just no longer kneel to you. {rival} made the swap so quietly no one grieved.',
      ],
    },
  ],
};
