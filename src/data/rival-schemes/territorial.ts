/**
 * Territorial scheme family (THR-66) — aggressive/territorial rivals.
 *
 * Arc: warband musters → raid the marches → contest the hold → siege the
 * stronghold. The rival takes ground and makes the taking legible. Baseline
 * plainspoken register (THR-609); the crack beat is allowed a little lift.
 *
 * The "contest the hold" beat degrades to sphere-pressure + attribution when
 * Control contestation is not exposed to scheme moves (plan Step 0.2 fallback).
 */
import type { RivalSchemeFamily } from './types';

export const TERRITORIAL_FAMILY: RivalSchemeFamily = {
  id: 'territorial',
  label: 'Territorial Scheme',
  eligibleBehaviors: ['aggressive', 'territorial'],
  sphereLean: ['force', 'energy'],
  minTier: 1,
  requiresTarget: true,
  beats: [
    {
      phaseId: 'rumor',
      move: 'rumor',
      voice: 'mortal',
      proseVariants: [
        'Riders gather past the treeline near {location}. No banner yet. {rival} is counting spears.',
        'The roads into {location} carry more armed men than trade. {rival} is not hiding it well, and does not need to.',
        'Something is mustering upwind of {location}. {rival} lets the smoke be seen — fear does half the work.',
      ],
    },
    {
      phaseId: 'materialize',
      move: 'materialize',
      voice: 'mortal',
      proseVariants: [
        'The outlying farms of {location} burned last night. {rival} calls it a warning. It was a census.',
        "A raiding band hit the edge of {location} and left as fast. {rival} wanted to know how quickly the walls answer.",
        'They took the herds and one granary from {location} and nothing else. {rival} is measuring, not looting.',
      ],
    },
    {
      phaseId: 'respond',
      move: 'escalate',
      voice: 'mortal',
      proseVariants: [
        "{rival}'s people hold the low road into {location} now. Trade pays a toll it never agreed to.",
        'The hold at {location} is ringed a little tighter each day. {rival} tightens it the way a snare tightens — slowly.',
        'No caravan reaches {location} unwatched anymore. {rival} owns the approaches in all but name.',
      ],
    },
    {
      phaseId: 'crack',
      move: 'crack',
      voice: 'divine',
      proseVariants: [
        '{rival} sits the field before {location} and does not move. Walls are only a slower way to starve.',
        'The siege lines close at {location} tonight. {rival} has all the time in the world and the town has none of it.',
        '{rival} plants a standard in sight of {location} and waits. The waiting is the weapon now.',
      ],
    },
  ],
};
