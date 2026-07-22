/**
 * Rite/Work agenda family (THR-630) — the "good news" family. A notable
 * raises a monument, calls a festival, or drives a reform at one of their own
 * holdings. Intention → groundbreaking → the work grows → consecration.
 *
 * Baseline register (THR-609); the consecration beat may warm slightly.
 */
import type { NotableAgendaFamily } from './types';

export const RITE_FAMILY: NotableAgendaFamily = {
  id: 'rite',
  label: 'Great Work',
  sphereLean: ['light'],
  targetKind: 'own-location',
  beats: [
    {
      phaseId: 'intention',
      move: 'rumor',
      proseVariants: [
        '{notable} has been walking the grounds at {target} with builders and priests. Something is being planned.',
        'Quarry orders, grain contracts, a summons for masons — {notable} is preparing something at {target}.',
        'Word goes around that {notable} means to leave a mark on {target} that will outlast them.',
      ],
    },
    {
      phaseId: 'groundbreaking',
      move: 'materialize',
      proseVariants: [
        '{notable} breaks ground at {target}. A monument, they say. A promise in stone.',
        'The work begins at {target}. {notable} pays fair wages and asks for haste, which surprises people on both counts.',
        '{notable} declares a great work at {target} — and for once the talk in the taverns is not of war.',
      ],
    },
    {
      phaseId: 'the-work-grows',
      move: 'escalate',
      proseVariants: [
        'The work at {target} rises. Travelers detour to see it. {notable} visits weekly and pretends not to be pleased.',
        'Scaffolding climbs at {target}. The workers have started singing again, which the old ones say is a good omen.',
        '{target} is changing shape around {notable}\'s work. Even the skeptics have stopped calling it folly.',
      ],
    },
    {
      phaseId: 'consecration',
      move: 'crack',
      proseVariants: [
        'The work at {target} is finished. {notable} says a few words, badly, and nobody minds. It will stand a long time.',
        '{target} holds its festival. For one day the ledgers close, the grievances rest, and {notable} is simply thanked.',
        'The consecration at {target} draws crowds from three days\' walk. Whatever else {notable} has done, there is this.',
      ],
    },
  ],
};
