import type { EvalInput } from '../../../../engine/content-eval/proseQualityScore';

// Bad: purple prose / flowery phrase hits — should flag 'voice-contract' with severity 'loud'
export const BAD_PROSE_FLOWERY: EvalInput[] = [
  {
    entryId: 'encounter.ethereal-market',
    contentType: 'encounter',
    fields: {
      prose: 'An ethereal glow suffuses the gossamer stalls, each gleaming with otherworldly wares {name} has never seen.',
    },
  },
  {
    entryId: 'attachment.tapestry-burden',
    contentType: 'attachment',
    fields: {
      description: '{name} carries a thread from the tapestry of fate, primordial in its weight.',
      flavor: 'The sea of stars remembers what {they} would prefer to forget.',
    },
  },
];
