/**
 * Hunger and unrest S2 — Great Chronicle lines (THR-1957; plan
 * `Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md` § Prose tables S2).
 *
 * Game register (prose doctrine v2: GM narration). Resolved through the economic
 * chronicle resolver. `{settlement}` is the town; `{target}` the lord it turns from (the
 * old holder); `{actor}` the lord it turns to, or the faction it raised.
 *
 * `town_on_the_edge` picks its line by the town's largest unrest input and whether it
 * has a holder (tables below) and hands it to the resolver as `{flavor}`, so a besieged
 * town never talks of grain (Law 22). Told for full-detail settlements only.
 *
 * Frequency: On the edge on entry only; defects and rises at most once per town per
 * `TOWN_TURN_COOLDOWN_DAYS`; empties once per town.
 */

export const UNREST_CHRONICLE_TEMPLATES = {
  town_on_the_edge: ['{flavor}'],
  town_defects: [
    '{settlement} has turned from {target} and opened its gates to {actor}.',
    'Tired of hunger under {target}, {settlement} has given its keys to {actor}.',
    '{settlement} no longer answers to {target}; its people have sworn to {actor} instead.',
  ],
  town_rises: [
    '{settlement} has risen. Its people burned the reeve\'s hall and named their own captains.',
    '{settlement} has thrown off {target}. Its own people hold the gates now, under {actor}.',
    'The people of {settlement} have risen against {target} and raised the banner of {actor}.',
  ],
  town_empties: [
    'The last carts have left {settlement}. No one tends its fields now.',
    '{settlement} stands empty. Its people have gone to find bread elsewhere.',
    'Nobody is left in {settlement} to light a hearth. The road out is the only road it has.',
  ],
} as const;

export const UNREST_CHRONICLE_SIGNIFICANCE = {
  town_on_the_edge: 0.6,
  town_defects: 0.8,
  town_rises: 0.85,
  town_empties: 0.75,
} as const;

export const UNREST_CHRONICLE_TITLES = {
  town_on_the_edge: 'A Town on the Edge',
  town_defects: 'A Town Turns',
  town_rises: 'A Town Rises',
  town_empties: 'A Town Empties',
} as const;

/** The cause a town on the edge mutters about: its largest unrest input, folded to three lines. */
export type OnTheEdgeCause = 'hunger' | 'siege' | 'general';

/** `town_on_the_edge` for a held town. `{settlement}` the town, `{target}` its holder. */
export const ON_THE_EDGE_HELD_LINES: Readonly<Record<OnTheEdgeCause, readonly string[]>> = {
  hunger: [
    '{settlement} mutters against {target}; men count the days since the last cart of grain.',
    'Hungry and angry, {settlement} has stopped bowing to the reeve of {target}.',
    'In {settlement} they ask why {target} lets them starve, and who else might feed them.',
  ],
  siege: [
    '{settlement} mutters against {target}, who has left an army camped at its walls.',
    'With soldiers at its gates and no help from {target}, {settlement} talks of another lord.',
    '{settlement} has watched {target} fail to lift the siege, and its patience is gone.',
  ],
  general: [
    '{settlement} mutters against {target}; nobody there defends their lord any more.',
    'In {settlement} the talk is all of {target}, and none of it is kind.',
    '{settlement} has had enough of {target}, and says so in the open.',
  ],
};

/** `town_on_the_edge` for an unheld town: no lord to turn from, so its people talk of leaving. */
export const ON_THE_EDGE_UNHELD_LINES: Readonly<Record<OnTheEdgeCause, readonly string[]>> = {
  hunger: [
    'There is no bread in {settlement}, and its people talk of packing their carts.',
    '{settlement} is hungry and lordless; families are already looking down the road.',
    'Nobody feeds {settlement}, and its people are on the edge of leaving it.',
  ],
  siege: [
    'With an army at its walls and no lord to call on, {settlement} talks of leaving.',
    '{settlement} has no one to lift the siege, and its people eye the back roads.',
    'Soldiers camp outside {settlement}; inside, people pack what they can carry.',
  ],
  general: [
    '{settlement} has had enough, and its people are on the edge of leaving.',
    'In {settlement} the talk is of the road out, and of who will go first.',
    'Nobody holds {settlement} together any more; its people talk of leaving.',
  ],
};
