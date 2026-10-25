/**
 * What the place page says about a settlement's economy (THR-1923; plan
 * `Docs/plans/2026-10-14-thr-1923-settlement-economy.md` § Player-facing text).
 *
 * Words only, never a number (UI Law 13), no raw keys (Law 14). `{name}` is the
 * settlement; `{buyer}` / `{seller}` the far end of a surplus route; `{building}` a
 * building's card name in lower case; `{where}` a hex's place from the town. A line whose
 * slot cannot be filled is dropped, never printed with a hole.
 */

/** The size line's tier word. */
export const SIZE_TIER_WORDS: Readonly<Record<string, string>> = {
  hamlet: 'A hamlet',
  town: 'A town',
  city: 'A city',
  capital: 'A capital',
};

export type SizeTrend = 'growing' | 'steady' | 'shrinking' | 'hungry' | 'court_left';

/** The size line's trend, after the tier word: "A town, growing." */
export const SIZE_TREND_WORDS: Readonly<Record<SizeTrend, string>> = {
  growing: 'growing',
  steady: 'steady',
  shrinking: 'shrinking',
  hungry: 'going hungry',
  court_left: 'shrinking since its court left',
};

/** How long "shrinking since its court left" is told after the seat stopped pulling. */
export const COURT_LEFT_TELL_DAYS = 30;

/** The livelihood line, as sentences built from the economy's own numbers. */
export const LIVELIHOOD_FOOD_LINES = {
  plenty: "{name}'s fields feed it with grain to spare.",
  fed: "{name}'s fields feed its people.",
  short: "{name}'s fields fall short, and it eats from its stores.",
  hungry: "{name}'s fields cannot feed its people. Its stores are running out.",
} as const;

/** What a surplus route carries, from each end. */
export const LIVELIHOOD_ROUTE_LINES = {
  foodOut: 'The spare grain goes to {buyer}.',
  goodsOut: 'Its spare wares are sold to {buyer}.',
  foodIn: 'Grain comes in from {seller}.',
  goodsIn: 'Wares come in from {seller}.',
} as const;

/** A land shock while it lasts (it fades to nothing, then the clause goes). */
export const LIVELIHOOD_SHOCK_LINES: Readonly<Record<'blight' | 'bless_harvest' | 'sour_mine' | 'reveal_vein' | 'siege', string>> = {
  blight: "{name}'s fields {where} are blighted and give little this season.",
  bless_harvest: "{name}'s fields {where} are blessed this season.",
  sour_mine: "{name}'s quarry {where} has run to rubble this season.",
  reveal_vein: '{name} works a rich new seam in the hills {where} this season.',
  siege: "{name}'s fields lie outside its walls and give little while the siege lasts.",
};

/** `{where}` in the livelihood shock line, by the hex's direction; absent reads the fallback. */
export const LIVELIHOOD_WHERE_WORDS: Readonly<Record<string, string>> = {
  north: 'to the north',
  'north-east': 'to the north-east',
  east: 'to the east',
  'south-east': 'to the south-east',
  south: 'to the south',
  'south-west': 'to the south-west',
  west: 'to the west',
  'north-west': 'to the north-west',
  river: 'by the river',
};
export const LIVELIHOOD_WHERE_FALLBACK = 'nearby';

/** A building lost, told for `SHOCK_DAYS` after it went. */
export const LIVELIHOOD_BUILDING_LOST_LINE = "{name}'s {building} has gone cold, and its people have left it.";

/** The Connections fact on a building Place (the card's kind tag). */
export const BUILDING_FACT_WORDS = {
  built: 'built by the town',
  /** THR-1966 — a building a mortal raised; they hold it as a freehold. */
  builtBy: 'built by {builder}',
  idleUpkeep: 'idle — the town cannot spare the {material} to keep it',
} as const;

/** The idle-for-want-of-input fact, by the special good its building works. */
export const BUILDING_IDLE_INPUT_WORDS: Readonly<Record<string, string>> = {
  ore: 'idle — no ore has reached it this month',
  gems: 'idle — no rough stones have reached it this month',
  herbs: 'idle — no herbs have reached it this month',
  crystal: 'idle — no crystal has reached it this month',
  amber: 'idle — no amber has reached it this month',
  curios: 'idle — nothing new has been dug up for it this month',
  springs: 'idle — the spring has gone cold this month',
};
