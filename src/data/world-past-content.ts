/**
 * World-past line tables — the words the player meets the past in (THR-1656, slice 2 of
 * THR-1631).
 *
 * Every table here is read by one producer, `engine/worldPastWords.ts`, which binds the
 * `{token}` slots to the world's own names and returns sentences whose names are declared
 * concepts (Law 2) — so the chronicle and the place page never parse English to find a
 * link. Register: game prose, plain, past tense, no second person (`Docs/canon/prose.md`
 * rule zero, Law 42). No line carries a numeral (Law 13): ages arrive through
 * `pastSpanLabel` as `{ago}`, ruin counts as words.
 *
 * `<<word>>` marks the one concept word a line's tooltip hangs on (Law 17) — the
 * producer declares it, so the surface never guesses which word to underline (Law 2).
 *
 * A fall is claimed only where the engine holds one: the `*_FELL_*` lines render only when
 * `getPlacePast` returns a `fellInEventId` (plan § Content pillar item 4). Every other ruin
 * gets its kind alone.
 *
 * Plan: `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md` § Content pillar.
 */

import type { ElderRuinArchetype, WorldPastRole } from '../types/worldPast';

// ─── The chapter ────────────────────────────────────────────────────────────

/** The pinned chronicle section's heading. */
export const BEFORE_YOU_WOKE_HEADING = 'Before you woke';

/** The four groups of the chapter, in reading order. */
export const BEFORE_YOU_WOKE_GROUP_TITLES = {
  elder: 'The elder age',
  settling: 'The settling',
  living: 'Living memory',
  wonders: 'Wonders',
} as const;

/** Shown in a group that has nothing to say yet. */
export const BEFORE_YOU_WOKE_EMPTY = {
  elder: 'No empire older than the living has left a mark on this land.',
  settling: 'No town here remembers its founding.',
  living: 'No war is still remembered here.',
  wonders: 'No wonder has been seen yet.',
} as const;

/** Rows beyond the capitals that The settling lists; every other town carries its own line. */
export const CHRONICLE_PAST_SETTLING_ROWS = 10;

// ─── The elder age ──────────────────────────────────────────────────────────

/** One empire and what it left: `{empire}`, `{kinds}` (a word phrase, never a count). */
export const EMPIRE_LINES: readonly string[] = [
  '{empire} left {kinds} behind.',
  '{empire} is gone. It left {kinds}.',
  'Of {empire}, only {kinds} remain.',
];

/** The elder war: `{war}` (its generated name), `{empireA}`, `{empireB}`, `{ago}`. */
export const ELDER_WAR_LINES: readonly string[] = [
  '{empireA} and {empireB} fought the war remembered as {war}, {ago} ago.',
  '{war} was fought {ago} ago, between {empireA} and {empireB}.',
  '{ago} ago, {empireA} and {empireB} went to war. It is remembered as {war}.',
];

/**
 * Found battlefields of the elder war, as a word count (`{count}`, via `countWord`). A
 * count rather than a list of links: worldgen names every battlefield ruin alike, so a
 * list would read "Battlefield Ruin, Battlefield Ruin and Battlefield Ruin". Each ruin
 * carries its own fall line on its page.
 */
export const ELDER_WAR_SITES_LINES = {
  one: 'One of its battlefields has been found.',
  many: '{count} of its battlefields have been found.',
} as const;

// ─── The settling ───────────────────────────────────────────────────────────

/** A place with a named founder: `{place}`, `{founder}`, `{ago}`. Chapter rows. */
export const SETTLING_FOUNDER_LINES: readonly string[] = [
  '{founder} founded {place} {ago} ago.',
  '{place} was founded {ago} ago by {founder}.',
  '{place} rose {ago} ago, under {founder}.',
];

/** A place with no named founder: `{place}`, `{ago}`. Chapter rows. */
export const SETTLING_LINES: readonly string[] = [
  '{place} was founded {ago} ago.',
  '{place} has stood for {ago}.',
  'The first houses of {place} went up {ago} ago.',
];

// ─── Living memory ──────────────────────────────────────────────────────────

/** A war in living memory: `{winner}`, `{loser}`, `{ago}`. */
export const LIVING_WAR_LINES: readonly string[] = [
  '{winner} beat {loser} in a war {ago} ago.',
  '{ago} ago, {winner} went to war with {loser}, and won.',
  '{loser} lost a war to {winner}, {ago} ago.',
];

/** The burned town, once found: `{town}`. */
export const BURNED_TOWN_LINES: readonly string[] = [
  '{town} <<burned>> in it and was never rebuilt.',
  'It left {town} in <<ashes>>, and no one came back to rebuild.',
];

/** The burned town, not yet found. Names nothing. */
export const BURNED_TOWN_FOGGED_LINE = 'A town <<burned>> in it and was never rebuilt.';

/** A fallen commander, once their resting place is found: `{commander}`, `{loser}`, `{rest}`. */
export const FALLEN_COMMANDER_LINE = '{commander} fell leading {loser}, and lies at {rest}.';

/** A fallen commander, not yet found: `{loser}`. */
export const FALLEN_COMMANDER_FOGGED_LINE = 'One of the commanders of {loser} fell in it.';

// ─── Wonders ────────────────────────────────────────────────────────────────

/**
 * Wonder legends, per wonder subtype — at least two each, so no two wonders in one world
 * share a line while one is unused (the prototype's "crystal caverns are five of eight
 * wonders" lesson). `{wonder}` is the wonder's own name.
 */
export const WONDER_LEGEND_LINES: Readonly<Record<string, readonly string[]>> = {
  healing_spring: [
    'The sick were carried to {wonder} long before any town stood near it, and some walked home.',
    'People say the water at {wonder} closed a wound that had been open for a year.',
  ],
  master_forge: [
    'The fire at {wonder} has never gone out. No one remembers who lit it.',
    'Blades from {wonder} were once traded for whole villages.',
  ],
  living_archive: [
    'Every word ever spoken aloud at {wonder} is said to still be there, if someone knows how to listen.',
    'Scholars walked months to reach {wonder}. Few of them wrote down what they found.',
  ],
  fey_crossing: [
    'Travellers who took the wrong path at {wonder} came back years later, not a day older.',
    'The old roads bend around {wonder}. Nobody built them that way on purpose.',
  ],
  sacrifice_site: [
    'Something was given at {wonder}, long ago, and something was given back.',
    'The stones at {wonder} are stained a colour no rain has washed out.',
  ],
  convergence: [
    'The currents of the world run together at {wonder}. Birds will not fly over it.',
    'Compasses spin at {wonder}, and dreams there are shared by everyone asleep.',
  ],
  time_scar: [
    'At {wonder}, a morning from before the elder age still happens, over and over.',
    'People who spent a night at {wonder} came back remembering things that had not happened yet.',
  ],
  standing_stones: [
    'The stones at {wonder} were already old when the first empire rose.',
    'On the longest night, the shadows at {wonder} point somewhere other than the moon.',
  ],
  shadow_hollow: [
    'Light does not reach the floor of {wonder}. Voices do.',
    'Those who hid in {wonder} during the old wars were never found, by either side.',
  ],
  ley_nexus: [
    'Every old road on this land was laid to meet at {wonder}.',
    'The air at {wonder} hums. Iron left there overnight is warm by morning.',
  ],
  golden_grove: [
    'The leaves at {wonder} never fall. They turn gold and stay.',
    'A king once tried to cut a tree at {wonder}. The axe is still in it.',
  ],
  crystal_cavern: [
    'The walls of {wonder} throw back a light that does not come from any torch.',
    'Miners broke into {wonder} by accident, and stopped mining.',
  ],
  glowcap_hollow: [
    'The mushrooms of {wonder} glow brighter when someone lies to them.',
    'Lost children follow the glow to {wonder}, and are always found there.',
  ],
};

/** A wonder whose subtype has no table of its own. */
export const WONDER_LEGEND_FALLBACK_LINES: readonly string[] = [
  'Stories about {wonder} are older than any town nearby.',
  'People travelled far to see {wonder}, and came home quieter.',
];

/** The first to find a wonder, once found: `{finder}`. */
export const WONDER_FINDER_LINE = '{finder} was the first to find it, and lies there still.';

/** Wonders the player has not seen yet, summed without a count. */
export const WONDERS_UNSEEN_LINE = 'Other wonders lie where no one has looked yet.';

// ─── Place lines (the settlement / ruin page) ───────────────────────────────

/** A settlement with a named founder: `{founder}`, `{ago}`. The place is the page itself. */
export const PLACE_FOUNDING_FOUNDER_LINES: readonly string[] = [
  '<<Founded>> {ago} ago by {founder}, who lies here still.',
  '{founder} <<founded>> this place {ago} ago, and is buried here.',
  '<<Built>> {ago} ago, on the word of {founder}.',
];

/** A settlement with no named founder: `{ago}`. */
export const PLACE_FOUNDING_LINES: readonly string[] = [
  '<<Founded>> {ago} ago.',
  'People have <<lived here>> for {ago}.',
  'The <<first houses>> here went up {ago} ago.',
];

/** A plain ruin that burned in a war in living memory, once found: `{winner}`, `{loser}`, `{ago}`. */
export const PLACE_BURNED_TOWN_LINES: readonly string[] = [
  'A town stood here until the war between {winner} and {loser}, {ago} ago. It <<burned>> and was never rebuilt.',
  'This town <<burned>> {ago} ago, when {winner} fought {loser}. No one came back.',
];

/** A plain ruin with no war behind it, or one not yet found: `{ago}`. */
export const PLACE_PLAIN_RUIN_LINES: readonly string[] = [
  'A town stood here once, <<founded>> {ago} ago. It is empty now.',
  'People lived here once, from {ago} ago until the town <<emptied>>.',
];

/** An elder ruin, by kind, once its empire is known: `{empire}`. */
export const PLACE_ELDER_RUIN_LINES: Readonly<Record<ElderRuinArchetype, readonly string[]>> = {
  temple: [
    'A temple of {empire}.',
    'The people of {empire} prayed here.',
  ],
  vault: [
    'A vault of {empire}, sealed by hands long dead.',
    '{empire} kept its treasures here.',
  ],
  battlefield: [
    'A battlefield from the days of {empire}.',
    'The armies of {empire} fought and died here.',
  ],
};

/** An elder ruin before anyone knows whose it was. Names only the kind. */
export const PLACE_ELDER_RUIN_FOGGED_LINES: Readonly<Record<ElderRuinArchetype, string>> = {
  temple: 'An old temple, older than any living people.',
  vault: 'An old vault, older than any living people.',
  battlefield: 'An old battlefield, older than any living people.',
};

/** The fall clause of an elder ruin — only where the engine holds the fall: `{war}`. */
export const PLACE_ELDER_RUIN_FELL_LINE = 'It fell in {war}.';

/** A seeded dead person lies at this place: `{name}`. Used where no other line names them. */
export const PLACE_RESTING_LINE = '{name} lies here.';

// ─── The dead person's sheet ────────────────────────────────────────────────

/**
 * One sentence per role, under the name on a seeded dead actor's sheet. Tokens: `{place}`
 * (founder), `{realm}` and `{enemy}` (fallen commander), `{wonder}` (wonder finder).
 */
export const DEAD_ROLE_LINES: Readonly<Record<WorldPastRole, string>> = {
  founder: 'Founded {place}. Lies there still.',
  fallen_commander: 'Fell leading {realm} against {enemy}.',
  wonder_finder: 'First to find {wonder}, and did not come back the same.',
};

/** The role sentence when its place or realm is gone: no names, still true. */
export const DEAD_ROLE_FALLBACK_LINES: Readonly<Record<WorldPastRole, string>> = {
  founder: 'Founded a town, long ago.',
  fallen_commander: 'Fell in a war that is still remembered.',
  wonder_finder: 'First to find a wonder, and did not come back the same.',
};

/** How long ago they died: `{ago}`. */
export const DEAD_AGO_LINE = '<<Died>> {ago} ago.';

// ─── Ruin kinds as words ────────────────────────────────────────────────────

/** Singular and plural nouns for each ruin kind, for `{kinds}`. */
export const RUIN_KIND_NOUNS: Readonly<Record<ElderRuinArchetype, { one: string; many: string }>> = {
  temple: { one: 'temple', many: 'temples' },
  vault: { one: 'vault', many: 'vaults' },
  battlefield: { one: 'battlefield', many: 'battlefields' },
};

/**
 * Word bands for a ruin count (Law 13 — no numeral). A count below the first band's floor
 * says nothing about that kind. Ordered from the largest band down.
 */
export const RUIN_COUNT_BANDS: readonly { from: number; word: string }[] = [
  { from: 10, word: 'many' },
  { from: 4, word: 'several' },
  { from: 2, word: 'a few' },
  { from: 1, word: 'a' },
];

/** What an empire left when it left nothing the pass counted. */
export const RUIN_KINDS_NONE = 'nothing that still stands';
