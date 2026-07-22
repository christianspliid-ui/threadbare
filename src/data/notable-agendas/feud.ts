/**
 * Feud agenda family (THR-630) — a grievance between two notables curdles
 * into open enmity. Slight → grievance → retaliation → settling.
 *
 * Baseline register (THR-609). The settling beat is allowed one step up.
 */
import type { NotableAgendaFamily } from './types';

export const FEUD_FAMILY: NotableAgendaFamily = {
  id: 'feud',
  label: 'Open Feud',
  sphereLean: ['darkness'],
  targetKind: 'notable',
  beats: [
    {
      phaseId: 'slight',
      move: 'rumor',
      proseVariants: [
        'Something passed between {notable} and {target} at the last gathering. Neither will say what. Both remember it.',
        '{notable} has stopped saying {target}\'s name. People who know both of them have started counting silverware.',
        'A gift from {target} was returned to {notable} unopened. In certain families, that is a declaration.',
      ],
    },
    {
      phaseId: 'grievance',
      move: 'materialize',
      proseVariants: [
        '{notable} names the grievance aloud: {target} has wronged them, and the wrong will be answered.',
        'The feud between {notable} and {target} is open now. Retainers on both sides start traveling armed.',
        '{notable} lays the whole account of {target}\'s offenses before anyone who will listen. The list is long. Some of it is even true.',
      ],
    },
    {
      phaseId: 'retaliation',
      move: 'escalate',
      proseVariants: [
        'A warehouse burns. A betrothal collapses. Nothing traces back to {notable}, and everything does.',
        '{target}\'s people find doors closed that were open last season. {notable}\'s reach is longer than their arm.',
        'The feud costs both houses now — trade soured, friends forced to choose. {notable} counts it worth the price.',
      ],
    },
    {
      phaseId: 'settling',
      move: 'crack',
      proseVariants: [
        'The feud between {notable} and {target} is settled the old way — one of them yields, and the yielding is remembered longer than the cause.',
        'It ends without witnesses, the way these things end. Afterward {notable} and {target} speak politely at gatherings, and everyone watches their hands.',
        'The accounts between {notable} and {target} are balanced at last. What the balancing cost is written nowhere, and everyone knows it.',
      ],
    },
  ],
};
