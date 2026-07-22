/**
 * Campaign agenda family (THR-630) — the war hand-off. A notable calls the
 * banners against a foreign settlement; the muster beat raises a real army
 * (commanded by the notable, objective: conquer the target) and the shipped
 * army/battle/siege machinery owns everything after that. The agenda itself
 * only narrates the raising — the war does not need it.
 *
 * Banners → muster → the march → war unleashed.
 */
import type { NotableAgendaFamily } from './types';

export const CAMPAIGN_FAMILY: NotableAgendaFamily = {
  id: 'campaign',
  label: 'Campaign',
  sphereLean: ['force'],
  targetKind: 'location',
  beats: [
    {
      phaseId: 'banners-called',
      move: 'rumor',
      proseVariants: [
        '{notable} has stopped talking about {target} in council. Smiths in {faction} lands are working late.',
        'Riders go out from {notable}\'s hall under seal. The old soldiers read the signs and check their gear.',
        'Grain is being bought in quantity and boots in pairs. {notable} means to walk somewhere, with company.',
      ],
    },
    {
      phaseId: 'muster',
      move: 'materialize',
      proseVariants: [
        '{notable} calls the banners. The muster names its object plainly: {target}.',
        'The host gathers under {notable}\'s hand. Nobody pretends anymore about where it is pointed.',
        '{notable} takes command in person. The column that forms behind them is aimed at {target}.',
      ],
    },
    {
      phaseId: 'the-march',
      move: 'escalate',
      proseVariants: [
        'The road to {target} carries an army now. Villages along it count spears and revise their loyalties.',
        '{notable}\'s host moves on {target}. Refugees move the other way, which is how everyone else finds out.',
        'The march grinds toward {target}. What it eats, it pays for or takes, depending on the banner it passes under.',
      ],
    },
    {
      phaseId: 'war-unleashed',
      move: 'crack',
      proseVariants: [
        'The campaign {notable} began has its own weight now. What happens at {target} belongs to the war.',
        'Whatever {notable} intended, the host at {target}\'s gates intends something simpler. It usually does.',
        'The matter of {target} passes out of council chambers and into the field, where {notable}\'s arguments carry sharper edges.',
      ],
    },
  ],
};
