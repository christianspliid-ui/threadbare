/**
 * The place, faction, army, artifact and attachment pages' words (THR-1910, Inspector
 * S2b — plan `Docs/plans/2026-10-14-thr-1876-the-inspector.md` § D7.2, D7.4–D7.7).
 *
 * Words at the source (UI Laws 13/14): every label, sentence and ladder these rows say
 * lives here. Lines a retiring sheet already said are copied word for word, so the
 * Inspector and the sheet say the same thing until S4 deletes the sheet.
 */

/** Section labels, sentence case (THR-1833 label rule). */
export const SUBJECT_ROW_LABELS = {
  // Place (§ D7.2)
  placeProse: 'This place',
  pastLine: 'Before you woke',
  fortunes: 'Fortunes',
  // THR-1923 — the settlement economy's size line.
  size: 'Size',
  // THR-1937 — who founded a mortal-founded town.
  foundedBy: 'Founded',
  prayer: 'Prayer',
  faithful: 'Faithful',
  livelihood: 'Livelihood',
  contested: 'Contested',
  desecrated: 'Desecrated',
  walls: 'Walls',
  conditionsHere: 'Conditions here',
  standing: 'Standing',
  placeOfPower: 'Place of power',
  areaFacts: 'The area',
  guildPostings: 'Guild postings',
  encountersHere: 'Encounters here',
  // THR-1992 — the lair's monster card and the pilgrim way, restored from the retired sheets.
  lairMonster: 'What lairs here',
  pilgrimWays: 'Pilgrim ways',
  // THR-1991 — the settlement's notable, restored from the retired LocationView.
  notable: 'Notable',
  // Faction (§ D7.4)
  description: 'Who they are',
  venerates: 'Venerates',
  agenda: 'Current agenda',
  conclave: 'Conclave',
  means: 'Means',
  purse: 'Purse',
  crown: 'Crown',
  fealty: 'Fealty',
  strongestReaches: 'Strongest reaches',
  customs: 'Customs',
  ranks: 'Ranks',
  recentActions: 'Recent actions',
  // Artifact (§ D7.6)
  madeBy: 'Made by',
  whatItDoes: 'What it does',
  theCatch: 'The catch',
  traits: 'Traits',
  tags: 'Tags',
  // Attachment (§ D7.7)
  effect: 'Effect',
  duration: 'Duration',
  triggers: 'Triggers',
  source: 'Source',
} as const;

/** The facts-row left words (the `panel` shape's `left`). */
export const SUBJECT_FACT_WORDS = {
  yourReputation: 'Your reputation here',
  size: 'Size',
  feature: 'Feature',
  danger: 'Danger',
  means: 'Means',
  status: 'Standing',
  loss: 'Lost when',
  grantedBy: 'Granted by',
  kind: 'Kind',
  lasts: 'Lasts',
  holder: 'Held by',
  stream: 'Its stream',
  origin: 'Rose from',
} as const;

// ─── Place ───────────────────────────────────────────────────────────────────

/** `SourceDrainLine`'s two sentences (THR-621), word for word. `{who}` is the rival. */
export const SOURCE_DRAIN_LINES = {
  desecrated: '{who} has profaned this source. Nothing here reaches you now — it will answer again only when you take it back and cleanse it.',
  contested: '{who} has opened a drain on this source. What it gives you, it gives less of, and less again for every season the wound stays unwarded.',
  unnamedRival: 'Something you cannot yet name',
} as const;

/** `WallsLine`'s two sentences (THR-628), word for word. */
/** THR-1937 — the founded-town line: "Founded by {founder}." The name is a link (Law 21). */
export const FOUNDED_BY_LINE = { lead: 'Founded by ', tail: '.' } as const;

/**
 * THR-1992 — `PilgrimWayLine`'s words, copied word for word: a town names the
 * congregations whose pilgrims come there, a congregation names the towns its ways lead to.
 */
export const PILGRIM_WAY_LINES = { siteLead: 'Pilgrims come here — a way of ', congregationLead: 'Pilgrim ways to ', joiner: ', ', tail: '.' } as const;

/**
 * THR-1991 — `NotableLine`'s words (THR-1655), copied word for word: the notable's name,
 * then one sentence per clause kind — "Holds the Tanner's Yard. At odds with Kael."
 */
export const NOTABLE_LINE_WORDS = {
  clauseLeads: {
    holds: 'Holds',
    at_odds_with: 'At odds with',
    knows_secret_of: 'Knows something about',
    is_owed_by: 'Is owed a favour by',
  },
  nameTail: ' — ',
  joiner: ', ',
  lastJoiner: ' and ',
  tail: '.',
} as const;

/** THR-1992 — the lair card's kind word, and the "by" that follows "slain" when the killer is known (LairMonsterCard's "slain by {name}"). */
export const LAIR_MONSTER_WORDS = { kindLiving: 'Holds this lair', kindSlain: 'Held this lair', slainByLead: 'by' } as const;

export const WALLS_LINES = {
  breached: '**Breached** — the walls are broken, and the advantage they carried went with them.',
  fortified: '**Fortified** — the walls stand, and anyone who wants this place must take them first.',
} as const;

/** `LivelihoodLine`'s staple keywords (THR-615). */
export const LIVELIHOOD_KEYWORDS = { famine: '**Famine** — ', glut: '**Glut** — ' } as const;

/** A place condition with no term (`LocationProfileModal`'s `INDEFINITE_TERM_COPY`). */
export const CONDITION_INDEFINITE_TERM = 'until it lifts';

/** The Place of Power reading (`PlaceOfPowerInspector`, THR-1104), as sentences. */
export const PLACE_OF_POWER_LINES = {
  noOne: 'No one',
  holdsDormant: ' holds this place. Its stream lies dormant.',
  holdsGives: ' holds this place. Its stream gives {yield} of {sphere}, and fades {when}.',
  origin: ' It rose from {origin}.',
  fallenRuin: 'a fallen ruin',
  essence: 'essence',
  corrupt: 'Corrupt',
  corruptLine: 'the god siphons a share',
  bound: 'Bound',
  boundLine: 'the god owes its holder a favor',
} as const;

/** Guild postings (`GuildQuestPanel`, THR-818 / THR-1026), the empty lines word for word. */
export const GUILD_POSTING_LINES = {
  quiet: 'The notice board is quiet. No contracts have been posted since the guild\'s last sweep.',
  notThisBoard: 'This board posts no ruin contracts — delves are {guild}\'s trade.',
  fallbackGuild: 'the adventurers’ guild',
  contract: 'Expedition contract',
  /** "The Sunken Vault, to the north-east, near" — the distance in words, never hexes (Law 13). */
  where: '{ruin}, to the {direction}, {distance}',
} as const;

/** How far a posting's ruin lies, in words (was "N hexes out" — Law 13). Upper bounds in hexes. */
export const POSTING_DISTANCE_WORDS: readonly { readonly max: number; readonly word: string }[] = [
  { max: 1, word: 'close by' },
  { max: 3, word: 'a short way out' },
  { max: Number.POSITIVE_INFINITY, word: 'far out' },
];

export function postingDistanceWord(hexes: number): string {
  return (POSTING_DISTANCE_WORDS.find(b => hexes <= b.max) ?? POSTING_DISTANCE_WORDS[POSTING_DISTANCE_WORDS.length - 1]).word;
}

/** Encounters here (LocationView's Encounters column). */
export const ENCOUNTERS_HERE_WORDS = {
  under: 'Under way',
  open: 'Could happen here',
  none: 'Nothing is under way here, and nothing waits.',
  /** "Kael · The Bridge Toll". */
  activeLine: '{who} · {name}',
  /** "Duel · Iron". */
  availableLine: '{name} — {kind}, {reach}',
} as const;

/** Encounter kind words for a template's `crudType` (LocationView printed the raw key). */
export const ENCOUNTER_KIND_WORDS: Readonly<Record<string, string>> = {
  update: 'help',
  create: 'build',
  delete: 'fight',
  read: 'explore',
};

/** Sphere strength in words — HexSidebar's ladder (`getIntensityLabel`). */
export function sphereStrengthWord(value: number): string {
  if (value >= 0.6) return 'Strong';
  if (value >= 0.3) return 'Faint';
  return 'Trace';
}

/** How many sphere strengths the Area row lists (HexSidebar's four). */
export const AREA_SPHERE_ROWS_MAX = 4;

// ─── Faction ─────────────────────────────────────────────────────────────────

/** A faction agenda's status, worded (the sheet printed the raw `status`). */
export const AGENDA_STATUS_WORDS: Readonly<Record<string, string>> = {
  active: 'Under way',
  pursuing: 'Under way',
  paused: 'Set aside for now',
  dormant: 'Set aside for now',
  completed: 'Achieved',
  fulfilled: 'Achieved',
  failed: 'Failed',
  abandoned: 'Abandoned',
};

export const FACTION_LINES = {
  noAgenda: 'No active faction agenda.',
  kindledLabel: 'Kindled',
  kindled: 'A calling has been kindled — the faction names this want under divine heat.',
  /** "Conclave in session, three days remaining." */
  conclave: 'Conclave in session, {left} remaining.',
  /** A rank tier's band: "Respected and above". */
  rankBand: '{band} and above',
  /** "Owes fealty to X …" is the engine's own sentence; this is the standing line's lead. */
  standingLead: 'Its standing with its liege: ',
  oneStepFromBreaking: ', one step from breaking',
  vassalsLead: 'Holds the fealty of ',
  /** "{ruler} wears the crown; nine factions owe it fealty." */
  crownRuler: ' wears the crown; ',
  noActions: 'No recent actions on record.',
} as const;

/** A faction action's outcome, worded (the sheet printed the raw `outcome`). */
export const FACTION_OUTCOME_WORDS: Readonly<Record<string, string>> = {
  success: 'succeeded',
  succeeded: 'succeeded',
  partial: 'half-succeeded',
  failed: 'failed',
  failure: 'failed',
  pending: 'under way',
};

/** How many recent actions the row lists (the sheet's five). */
export const FACTION_RECENT_ACTIONS_MAX = 5;
/** How many Reaches the row lists (the sheet's five). */
export const FACTION_STRONGEST_REACHES_MAX = 5;

/** A faction Reach score (0–100) as a word — the bar stays, the numeral goes (Law 13). */
export function factionReachWord(score: number): string {
  if (score >= 75) return 'Formidable';
  if (score >= 50) return 'Strong';
  if (score >= 25) return 'Able';
  return 'Slight';
}

// ─── Artifact / attachment ───────────────────────────────────────────────────

export const ITEM_LINES = {
  /** ArtifactSheet's designed absence line. */
  noDetail: 'Nothing further is recorded of this thing yet.',
  /** "Made by Kael at Ashford." — the names are links. */
  madeBy: 'Made by ',
  madeAt: ' at ',
  /** A template's declared term: "Lasts a few days." */
  lasts: 'Lasts {term}.',
  remaining: '{term} remaining',
} as const;

/** Trigger events, worded (`AttachmentDetailView.TRIGGER_EVENT_LABELS`, word for word). */
export const TRIGGER_EVENT_WORDS: Readonly<Record<string, string>> = {
  encounter_critical_success: 'Critical success',
  encounter_success: 'Success',
  encounter_at_cost: 'Success at cost',
  encounter_failure: 'Failure',
  encounter_critical_failure: 'Critical failure',
  action_complete: 'Any use',
  movement_complete: 'Arrival',
  rest: 'Rest',
  spell_cast: 'Spell cast',
};

/** A trigger payload's kind, worded (the sheet printed the raw `payload.kind`). */
export const TRIGGER_PAYLOAD_WORDS: Readonly<Record<string, string>> = {
  resource_delta: 'moves a store of power',
  content_grant: 'grants a gift',
  trace_only: 'leaves a mark in the record',
  condition_grant: 'grants a condition',
  condition_remove: 'lifts a condition',
  self_remove: 'spends itself',
};

/** "(once)" is a word; "(3x)" was a numeral and goes (Law 13). */
export const TRIGGER_ONCE = '(once)';

/** An agreement's raw `agreementType`, worded. */
export const AGREEMENT_TYPE_WORDS: Readonly<Record<string, string>> = {
  debt: 'A debt',
  favor: 'A favour owed',
  favour: 'A favour owed',
  pact: 'A pact',
  oath: 'An oath',
  contract: 'A contract',
  vow: 'A vow',
};
