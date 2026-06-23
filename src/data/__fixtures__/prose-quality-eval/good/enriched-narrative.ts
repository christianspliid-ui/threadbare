import type { EvalInput } from '../../../../engine/content-eval/proseQualityScore';

export const GOOD_PROSE_FIXTURES: EvalInput[] = [
  {
    entryId: 'encounter.tavern-debt-reckoning',
    contentType: 'encounter',
    fields: {
      prose: '{name} slides a coin across the table without meeting {their} eyes. The barkeep pockets it and says nothing.',
    },
  },
  {
    entryId: 'attachment.burden-of-command',
    contentType: 'attachment',
    marquee: true,
    fields: {
      description: "A weight {name} carries now — the ghost of a decision {they} can't take back.",
      flavor: "{name}'s ring still fits. It just sits differently.",
    },
  },
  {
    entryId: 'encounter.river-crossing',
    contentType: 'encounter',
    fields: {
      prose: 'The ferry is three coins and a wait. {name} counts what {they} have left.',
    },
  },
  {
    entryId: 'condition.hunted',
    contentType: 'condition',
    fields: {
      description: 'Someone in the city knows {name}\'s face. {?has_alias}The alias {they} use here may buy time.{/?has_alias}',
    },
  },
];
