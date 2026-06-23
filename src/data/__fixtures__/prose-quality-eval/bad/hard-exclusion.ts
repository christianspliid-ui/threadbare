import type { EvalInput } from '../../../../engine/content-eval/proseQualityScore';

// Bad: hard exclusion gate trigger — should clamp to band='fail', score=0
export const BAD_PROSE_HARD_EXCLUSION: EvalInput[] = [
  {
    entryId: 'encounter.disallowed-content',
    contentType: 'encounter',
    fields: {
      prose: 'Guards dragged the prisoners into the courtyard. They began torturing the helpless captive at dusk.',
    },
  },
];
