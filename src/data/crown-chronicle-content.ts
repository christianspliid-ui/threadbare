/**
 * The crown — Great Chronicle lines (THR-1932 § Prose tables).
 *
 * Game register (prose doctrine v2: GM narration). Resolved through the economic
 * chronicle resolver. `{actor}` is the faction the line is about (the vassal, the Crown,
 * the rebel), `{target}` the other side (the liege). A Crown is always its realm's full
 * name, with "a Crown" as a title after it — never "the Crown of X".
 *
 * `oath_sworn` and `oath_broken` pick their line by the oath's kind and the break's
 * reason (tables below) and hand it to the resolver as `{flavor}`, so the reason is in
 * the words (Law 22). Never *sworn*, *king*, *queen* or *kingdom* (plan § UI).
 *
 * `oath_*` lines are told only inside the player's attention; `crown_formed`,
 * `crown_lost` and `rebellion` are world-wide. Refusals are never chronicled.
 */

import type { OathKind, LoyaltyReason } from '../engine/crown/types';

export const CROWN_CHRONICLE_TEMPLATES = {
  crown_formed: [
    'Two lords have bent the knee to {actor}; it is a Crown now.',
    'With the oath of {target}, {actor} becomes a Crown.',
    '{actor} holds two oaths of fealty; a Crown has risen.',
  ],
  crown_lost: [
    'An oath to {actor} is broken, and it is a Crown no more.',
    'Too few now owe fealty to {actor}; it is no longer a Crown.',
    '{actor} has lost an oath, and with it its crown.',
  ],
  oath_sworn: ['{flavor}'],
  oath_broken: ['{flavor}'],
  rebellion: [
    '{actor} has thrown off its oath and raised its banners against {target}.',
    '{actor} has risen against its liege, {target}.',
    'Grown too great to kneel, {actor} rebels against {target}.',
  ],
} as const;

export const CROWN_CHRONICLE_SIGNIFICANCE = {
  crown_formed: 0.85,
  crown_lost: 0.85,
  rebellion: 0.85,
  oath_broken: 0.7,
  oath_sworn: 0.6,
} as const;

export const CROWN_CHRONICLE_TITLES = {
  crown_formed: 'A Crown Rises',
  crown_lost: 'A Crown Falls',
  oath_sworn: 'An Oath of Fealty',
  oath_broken: 'An Oath Broken',
  rebellion: 'Rebellion',
} as const;

/** `oath_sworn` by how the oath was won. `{actor}` vassal, `{target}` liege. */
export const OATH_SWORN_LINES: Readonly<Record<OathKind, readonly string[]>> = {
  coerced: [
    'Under siege, {actor} swore fealty to {target}.',
    'With its town in the hands of {target}, {actor} bent the knee.',
    '{actor} swore fealty to {target} at spearpoint.',
  ],
  bought: [
    'Silver from {target} bought the fealty of {actor}.',
    '{actor} took the silver of {target} and swore it fealty.',
    '{target} paid in coin, and {actor} owes it fealty now.',
  ],
  persuaded: [
    '{actor} swore fealty to {target} for its protection.',
    '{actor} has sought the shelter of {target} and swore it fealty.',
    '{actor} has bound itself to {target} by an oath of fealty.',
  ],
};

/** `oath_broken` by the break's reason (the largest loss in the window). */
export const OATH_BROKEN_LINES: Readonly<Record<LoyaltyReason, readonly string[]>> = {
  liege_destitute: [
    '{actor} renounced {target}: a lord who cannot pay cannot command.',
    '{actor} broke with {target}, whose coffers stand empty.',
    '{actor} will kneel no longer to a liege as poor as {target}.',
  ],
  liege_strained: [
    '{actor} renounced {target}, tired of a liege who barely pays its way.',
    '{actor} broke its oath to {target}, whose purse has grown thin.',
    'A liege scraping by could not hold {actor}; it renounced {target}.',
  ],
  liege_wealthy: [
    '{actor} renounced its fealty to {target}.',
    '{actor} broke its oath to {target}.',
    '{actor} owes {target} nothing now.',
  ],
  holding_lost: [
    '{actor} lost a town while it owed fealty to {target}, and no longer trusts its liege to keep it safe.',
    '{actor} renounced {target}: its liege let its walls fall.',
    'Its town taken, {actor} broke its oath to {target}.',
  ],
  outgrown: [
    'Grown richer than its liege, {actor} renounced {target}.',
    '{actor} has outgrown {target} and broken its oath.',
    '{actor} no longer needs {target}, and has said so.',
  ],
  rival_offer: [
    'Outbid by a richer liege, {target} lost the fealty of {actor}.',
    '{actor} broke its oath to {target}, courted by a better offer.',
    'A better offer turned {actor} from {target}.',
  ],
};
