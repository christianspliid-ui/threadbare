/**
 * Succession agenda family (THR-630) — a dynastic maneuver. The notable
 * quietly settles who follows them; the naming creates a real `will_succeed`
 * edge that the shipped succession system (phaseFactionSuccession, THR-76
 * lineage) consumes when the seat next empties.
 *
 * Counsel → naming → jockeying → the matter settles.
 */
import type { NotableAgendaFamily } from './types';

export const SUCCESSION_FAMILY: NotableAgendaFamily = {
  id: 'succession',
  label: 'Succession Settled',
  sphereLean: ['time'],
  targetKind: 'none',
  beats: [
    {
      phaseId: 'counsel',
      move: 'rumor',
      proseVariants: [
        '{notable} has been taking long counsel behind closed doors. The question of who follows them is finally being asked.',
        'Physicians, lawyers, and one old friend have all visited {notable} this season. People draw the obvious conclusion.',
        '{notable} is said to be weighing names. In {faction}, that weighing moves more coin than a war.',
      ],
    },
    {
      phaseId: 'naming',
      move: 'materialize',
      proseVariants: [
        '{notable} names an heir before witnesses. The matter is settled — which is to say, the fighting over it can now begin properly.',
        'The naming is done. {notable}\'s chosen successor stands a little straighter; several others stand very still.',
        '{notable} settles the succession in writing, sealed and witnessed. Paper has stopped fewer knives than people hope, but it is something.',
      ],
    },
    {
      phaseId: 'jockeying',
      move: 'escalate',
      proseVariants: [
        'The passed-over make their displeasure known in the usual ways: slow obedience, sudden piety, new friends in odd places.',
        'Around {notable}\'s chosen heir, alliances rearrange themselves like furniture before a storm.',
        'Half of {faction} courts the named heir. The other half courts whoever might unseat them. {notable} watches both halves and says nothing.',
      ],
    },
    {
      phaseId: 'the-matter-settles',
      move: 'crack',
      proseVariants: [
        'The succession holds. Whatever was tried against it — and something was tried — the heir {notable} named still stands named.',
        'The jockeying burns itself out. {notable}\'s arrangement survives its first winter, which is the only test that counts.',
        'In the end the matter settles the way {notable} intended. Later generations will call it orderly. Those present know better.',
      ],
    },
  ],
};
