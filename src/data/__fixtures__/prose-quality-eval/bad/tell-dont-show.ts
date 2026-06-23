import type { EvalInput } from '../../../../engine/content-eval/proseQualityScore';

// Bad: tell-don't-show emotion naming — should flag 'voice-contract' with 'tell-don't-show' detail
export const BAD_PROSE_TELL_DONT_SHOW: EvalInput[] = [
  {
    entryId: 'encounter.reunion-aftermath',
    contentType: 'encounter',
    fields: {
      prose: '{name} felt a wave of relief when the gate opened. They had been afraid, truly afraid, but the horror of it was over.',
    },
  },
  {
    entryId: 'encounter.betrayal-scene',
    contentType: 'encounter',
    fields: {
      prose: "The irony of it was that {name} had trusted her. She felt betrayed as the letter burned, overcome with emotion she couldn't hold back.",
    },
  },
];
