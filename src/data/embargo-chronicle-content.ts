/**
 * Embargo — Great Chronicle lines (THR-1955, war aims S2 § Prose tables).
 *
 * Game register (prose doctrine v2: GM narration). Resolved through the economic
 * chronicle resolver. `{actor}` is the holder that shuts the roads, `{target}` the enemy
 * whose towns it starves, `{resource}` the good (its display name, lower case) and
 * `{settlement}` the region's anchor town. Only the embargoed good stops; people and
 * armies still pass, so no line says "nothing moves" (Law 45).
 *
 * Frequency: a holder lays at most one embargo at a time and one per
 * `EMBARGO_COOLDOWN_TICKS`; the lines are told inside the player's attention like every
 * economic chronicle line.
 */

export const EMBARGO_CHRONICLE_TEMPLATES = {
  embargo_laid: [
    '{actor} has shut the roads around {settlement} to the towns of {target}. No {resource} comes through.',
    'No {resource} leaves the country around {settlement} for {target} now. The riders of {actor} turn the carts back.',
    '{actor} holds the {resource} around {settlement}, and has closed it to {target}. Their stores will thin.',
    'The {resource} carts bound for {target} stop at the fords near {settlement}. {actor} has laid an embargo.',
    '{actor} lets no {resource} pass to {target} from the country around {settlement}.',
    'Word goes down the roads from {settlement}: {actor} sells no {resource} to {target}, and lets none through.',
  ],
  embargo_lifted: [
    'The {resource} carts roll again on the roads around {settlement}. The embargo of {actor} on {target} is over.',
    '{actor} opens the roads around {settlement} again. The towns of {target} get their {resource} once more.',
    'The embargo is lifted. The {resource} of the country around {settlement} goes to {target} again.',
    '{actor} no longer turns back the {resource} carts bound for {target}.',
    'Traders from {target} buy {resource} near {settlement} again. The roads of {actor} are open.',
    'The fords near {settlement} are open to {target} again, and the {resource} carts cross.',
  ],
} as const;

export const EMBARGO_CHRONICLE_SIGNIFICANCE = {
  embargo_laid: 0.75,
  embargo_lifted: 0.6,
} as const;

export const EMBARGO_CHRONICLE_TITLES = {
  embargo_laid: 'An Embargo',
  embargo_lifted: 'The Roads Open',
} as const;
