/**
 * The Inspector's words — one data home (THR-1876 § D7, § D8, § Player-facing text).
 *
 * Every string the Inspector, the land page, Connections and *In this land* print that is
 * not a row's own resolved prose lives here, so a reword is one edit and a test can read
 * the whole vocabulary. Tooltip bodies live in `ui-content.ts` (`ui.land.*`).
 */
import type { InspectorTabId } from '../types/detailPage';

/** Tab labels, sentence case (THR-1833). Total over `InspectorTabId` by type. */
export const INSPECTOR_TAB_LABELS: Readonly<Record<InspectorTabId, string>> = {
  overview: 'Overview',
  prowess: 'Prowess',
  attachments: 'Attachments',
  bonds: 'Bonds',
  journey: 'Journey',
  chronicle: 'Chronicle',
  chapters: 'Chapters',
  here_now: 'Here now',
  story: 'Story',
  reaches: 'Reaches',
};

/** The Connections block's six groups, in their fixed order (THR-1827 call 8; THR-1822 § D8). */
export const CONNECTION_GROUP_ORDER = ['where', 'who', 'belongsTo', 'friendsAndFoes', 'holdsKnows', 'story'] as const;
export type ConnectionGroupId = (typeof CONNECTION_GROUP_ORDER)[number];

export const CONNECTION_GROUP_LABELS: Readonly<Record<ConnectionGroupId, string>> = {
  where: 'Where',
  who: 'Who',
  belongsTo: 'Belongs to',
  friendsAndFoes: 'Friends and foes',
  holdsKnows: 'Holds and knows',
  story: 'Story',
};

/** The block's title: "Connections", except on the land page (call 16). */
export const CONNECTIONS_BLOCK_TITLE: Readonly<Record<'default' | 'land', string>> = {
  default: 'Connections',
  land: 'Around it',
};

/** *In this land* (call 17): row labels and the two always-rows' empty lines. */
export const LAND_INDEX_ALWAYS_ROWS = ['people', 'holder'] as const;
export const LAND_INDEX_WHEN_PRESENT_ROWS = ['lair', 'ruins', 'halls', 'resources', 'covenants'] as const;
export type LandIndexRowId = (typeof LAND_INDEX_ALWAYS_ROWS)[number] | (typeof LAND_INDEX_WHEN_PRESENT_ROWS)[number];

export const LAND_INDEX_LABELS: Readonly<Record<LandIndexRowId, string>> = {
  people: 'People',
  holder: 'Holder',
  lair: 'Lair',
  ruins: 'Ruins',
  halls: 'Halls',
  resources: 'Resources',
  covenants: 'Covenants',
};

export const LAND_INDEX_EMPTY_LINES: Readonly<Record<(typeof LAND_INDEX_ALWAYS_ROWS)[number], string>> = {
  people: 'No one lives here.',
  holder: 'No one holds this land.',
};

export const IN_THIS_LAND_TITLE = 'In this land';

/**
 * Positional danger as a word (UI Law 13). One ladder: moved here from `HexSidebar.tsx`
 * (THR-1876 § D7.3), which now imports it, so the land page and the hex sidebar cannot
 * word the same danger two ways.
 */
export const POSITIONAL_DANGER_WORDS: ReadonlyArray<readonly [threshold: number, word: string]> = [
  [0.25, 'Settled country'],
  [0.5, 'Uneasy country'],
  [0.7, 'Dangerous country'],
  [1.01, 'Deadly country'],
];

export function positionalDangerWord(level: number): string {
  for (const [threshold, word] of POSITIONAL_DANGER_WORDS) {
    if (level < threshold) return word;
  }
  return POSITIONAL_DANGER_WORDS[POSITIONAL_DANGER_WORDS.length - 1][1];
}

/** Everything else the Inspector says. */
export const INSPECTOR_WORDS = {
  /** "More when widened: Chronicle · Chapters" */
  moreWhenWidened: 'More when widened',
  /** The fold control: "Show all 15". */
  showAll: 'Show all {n}',
  /** "Act on Shutash" / "Act on this land". */
  actOn: 'Act on {name}',
  actOnLand: 'Act on this land',
  /** The Act row with nothing castable. */
  actOnEmpty: 'None of your cards works on {name}.',
  /** Kind words for headers that have no node subtitle. */
  landKind: 'Land',
  godKind: 'God',
  recordKind: 'Record',
  contentKind: 'Content',
  /** The missing page (§ D7.10) — `unknownStub`'s words. */
  missingName: 'Unknown',
  missingLine: 'this entity is no longer in the world',
  /** Where-line joiners: "At Temple Quarter, in The Bone Coast". */
  whereAt: 'At',
  whereIn: 'in',
  /** Land holder chip with no holder. */
  heldByNoOne: 'Held by no one',
  /** The god's mandate row. */
  mandateTrend: { rising: 'Rising', steady: 'Holding', ebbing: 'Slipping' } as const,
  mandateNow: 'Now',
  /** The Dominion row (dominionSheetVM). */
  dominionHold: 'Your hold',
  dominionMeaning: 'What it means',
  dominionTended: 'Tended',
  /** A record with no stored account. */
  recordUnnamed: 'This happening',
  recordNoAccount: '{name} left no account the god can read.',
  /** Read in the Codex (content cards, only when the Codex holds the entry). */
  readInCodex: 'Read in the Codex',
  /** Land page naming rule (call 18): "The plateau at Oreblack Deep". */
  landNameAt: 'The {terrain} at {place}',
  landNameOpen: 'Open {terrain}',
  /** Connections row facts. */
  factHeir: 'heir',
  factLeader: 'leader',
  factSeat: 'seat',
  factHall: 'hall',
  factHere: 'here',
  factCommander: 'commander',
  factHolder: 'holds it',
  factMaker: 'made it',
  factAvatar: 'your avatar',
  factFirst: 'your First',
  factThreaded: 'threaded to you',
  factRealm: 'realm',
  factCulture: 'culture',
  factMember: 'member',
  factAlly: 'ally',
  factFoe: 'foe',
  factFriend: 'friend',
  factRival: 'rival',
  factKin: 'kin',
  factMentor: 'mentor',
  factCompanion: 'companion',
  factBonded: 'bonded',
  factCarried: 'carried',
  factControls: 'governed',
  factPeople: '{n} people',
  factOnePerson: 'one person',
  factEmpty: 'empty',
  /** THR-1910: the fealty rows (THR-1932). */
  factLiege: 'liege',
  factVassal: 'owes fealty',
} as const;

// ─── Map lenses (THR-1878 plan § D4, § Player-facing text) ──────────────

/** The lens views' shared words: the overflow-free fallback when a lens cannot be built. */
export const LENS_VIEW_WORDS = {
  /** Legend line when a lens's view cannot be built (fail-soft table). */
  unavailable: 'This lens has nothing to show right now.',
  /** The pressed lens button's tooltip addition while a moment or an armed card holds the map (D2). */
  suppressedByStage: 'Hidden while a moment plays',
  suppressedByArming: 'Hidden while a card is armed',
} as const;

/** The Threads lens (2): legend, hover templates, court phrases, name-tag fallbacks. */
export const THREADS_LENS_WORDS = {
  label: 'Threads',
  legendHead: 'Threads',
  legend: [
    'Your people keep their light; the rest is dimmed.',
    'A dashed arrow shows where each is going.',
  ] as readonly string[],
  /** Court position → the phrase after the name. */
  court: {
    the_first: 'your First',
    retinue: 'of your retinue',
    watched: 'whom you watch',
  },
  /** Court position → the name tag when a mortal has no display name. */
  courtTag: {
    the_first: 'Your First',
    retinue: 'Of your retinue',
    watched: 'Whom you watch',
  },
  /** "{name}, {court}, is here." */
  here: '{name}, {court}, is here.',
  /** "{name}, {court}, is here, on {their} way to {place}." */
  hereHeading: '{name}, {court}, is here, on {their} way to {place}.',
  /** "{name}, {court}, is on {their} way here from {place}." */
  arriving: '{name}, {court}, is on {their} way here from {place}.',
  /** The same, when where they set out from has no name the player knows. */
  arrivingNoPlace: '{name}, {court}, is on {their} way here.',
  /** Used for `{their} way` when gender is unknown — "on the way". */
  unknownTheir: 'the',
  overflow: 'and others of your people',
  empty: 'You have no threaded mortals yet.',
} as const;

/**
 * The Trouble lens (3, THR-1898). "Unrest" is the engine's Location value in the hex
 * survey's own mood buckets and the Lawless chip's word; "Strife" is the conflict
 * pulse (plan § D4, PC-6). The strife phrases agree with the plain tooltip's pulse
 * murmurs for the same level; the lens names the level in one fixed phrase.
 */
export const TROUBLE_LENS_WORDS = {
  label: 'Trouble',
  legendHead: 'Trouble',
  /** The legend head's doom part: "Doom: {stage}" — the stage the doom bar shows. */
  doomHead: 'Doom: {stage}',
  legend: ['Lit ground is where something is going wrong.'] as readonly string[],
  unrestLawless: 'Unrest: {place} is lawless.',
  unrestMood: {
    agitated: 'Unrest: the people here are agitated.',
    boiling: 'Unrest: the people here are boiling over.',
  },
  strife: {
    tense: 'Strife: tempers are drawn here.',
    volatile: 'Strife: it has come to blows here.',
  },
  scheme: 'A scheme of {rival}: it is turning {place} away from you.',
  drainContested: 'A drain of {rival}: it is contesting your source at {place}.',
  drainDesecrated: 'A drain of {rival}: it has defiled your source at {place}.',
  /** A rival with no name the player knows. */
  rivalFallback: 'a rival power',
  lair: {
    minor: '{place}: a lair.',
    major: '{place}: a great lair.',
    legendary: '{place}: a legendary lair.',
  },
  omenSphere: 'An omen of {sphere} hangs over this land.',
  omenPlain: 'An omen hangs over this land.',
  overflow: 'and more trouble here',
  empty: 'Nothing is going wrong that you can see.',
} as const;

/**
 * The Trade lens (4, THR-1898). The road words are the ones the plain hex tooltip
 * showed (THR-670), moved here as sentences; prosperity is a word, never a number.
 */
export const TRADE_LENS_WORDS = {
  label: 'Trade',
  legendHead: 'Trade',
  legend: [
    'Lit ground lies on a trade road you know of.',
    'A gold road carries goods; a red road is threatened.',
  ] as readonly string[],
  /** "A road to {place}, carrying {goods}." */
  road: 'A road to {place}, carrying {goods}.',
  /** A road with no manifest. */
  roadLight: 'A road to {place}, carrying light trade.',
  /** Lane traffic (THR-1636): `suspended` and `idle`. */
  blockaded: 'It is blockaded.',
  fading: 'It is fading.',
  threatened: 'Threatened.',
  /** "{place} is {tier}" — joined with "; " for the two ends. */
  endTier: '{place} is {tier}',
  /** Appended to an end with scarce goods: " and short of {goods}". */
  endShort: ' and short of {goods}',
  /** A far end with no name. */
  farMarket: 'a far market',
  overflow: 'and more roads through here',
  empty: 'No trade road you know of yet.',
} as const;
