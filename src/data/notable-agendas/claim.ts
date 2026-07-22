/**
 * Claim agenda family (THR-630) — a notable presses a claim on a neighbor's
 * holding. Whisper → declaration → pressure → reckoning.
 *
 * Baseline register (THR-609): plain, concrete, no ornament. The reckoning
 * beat is allowed one step up.
 */
import type { NotableAgendaFamily } from './types';

export const CLAIM_FAMILY: NotableAgendaFamily = {
  id: 'claim',
  label: 'Pressed Claim',
  sphereLean: ['order'],
  requiresTargetLocation: true,
  beats: [
    {
      phaseId: 'whisper',
      move: 'rumor',
      proseVariants: [
        '{notable} has been asking old questions about {target} — who held it before, and on what paper.',
        'Talk in {faction} halls keeps circling back to {target}. {notable} lets it circle.',
        'A genealogist was paid well this season. The line they traced runs from {notable} toward {target}.',
      ],
    },
    {
      phaseId: 'declaration',
      move: 'materialize',
      proseVariants: [
        '{notable} declares the claim openly: {target} is theirs by right, and the right will be tested.',
        'Heralds carry it to every market: {notable} names {target} as {faction} land, held wrongly.',
        'The claim is posted at {target} itself. {notable} signs it without hedging.',
      ],
    },
    {
      phaseId: 'pressure',
      move: 'escalate',
      proseVariants: [
        'Levies drill within sight of {target}. Merchants who trade there start paying {faction} tolls.',
        '{notable} leans on {target}: envoys with narrow smiles, ledgers audited, roads suddenly inspected.',
        'The pressure on {target} tightens. Nothing illegal. Nothing kind.',
      ],
    },
    {
      phaseId: 'reckoning',
      move: 'crack',
      proseVariants: [
        'The claim on {target} comes due. What {notable} could not win by paper, they now take by weight.',
        '{target} yields to the claim — or breaks under it. Either way, {notable} calls it settled.',
        'The old right {notable} pressed against {target} is settled the way old rights usually are: by whoever is still standing at it.',
      ],
    },
  ],
};
