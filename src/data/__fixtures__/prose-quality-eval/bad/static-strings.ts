import type { EvalInput } from '../../../../engine/content-eval/proseQualityScore';

// Bad: dynamic field with no enrichment placeholders — should flag 'static-string'
export const BAD_PROSE_STATIC_STRINGS: EvalInput[] = [
  {
    entryId: 'encounter.static-opening',
    contentType: 'encounter',
    fields: {
      prose: 'The merchant studies you from across the stall, fingers resting on a rusted scale.',
    },
  },
  {
    entryId: 'attachment.flat-description',
    contentType: 'attachment',
    fields: {
      description: 'A mark left by a choice made too quickly and a price paid too slowly.',
      flavor: 'The wound closed. The debt did not.',
    },
  },
];
