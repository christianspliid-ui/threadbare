/**
 * The icon registry — the one icon list (THR-1885 format; THR-1904 contents, plan
 * `2026-10-14-thr-1879-type-and-icons-rollout.md` § Content pillar, Appendix A).
 *
 * One entry per **idea**, named in kebab-case (`close`, `bargain`; place types prefixed
 * `place-`). Each entry carries:
 *
 * - `meaning` — the one idea the shape stands for (Law 10: one icon, one idea). Never empty.
 * - `shape` — `{ viewBox, paths: { d, opacity? }[] }`. **Path data, never React
 *   components** (THR-1834), so a Unity port can turn the same data into a sprite atlas, and
 *   so the map's texture builder can rasterise the same entry the panels draw. A carved
 *   game-icons shape is one path at opacity 1; a drawing of our own may layer several.
 * - `source` — `{ family: 'game-icons', author, slug }` or `{ family: 'own' }`.
 *
 * **Carved entries** are written `carved('<slug>')`: the shape comes from
 * `carvedShapes.generated.ts`, which `npm run icons:vendor` fills from the game-icons
 * repository at a pinned commit (CC BY 3.0; credited by `ICON_CREDITS` on the start page's
 * Credits). **Adding an icon is one entry plus one command:** write the entry, run
 * `npm run icons:vendor`, commit both files. `carvedShapes.test.ts` names any entry whose slug
 * is not vendored.
 *
 * Which game key draws which idea is the class maps' job (`conceptIcons.ts` and the `icon`
 * fields on data rows), not this file's: several keys may draw one idea when they mean the
 * same thing.
 *
 * Read shapes through `src/components/shared/iconShape.ts` (Law 3: one resolver), never by
 * indexing this object from a component.
 */

import { CARVED_SHAPES } from './carvedShapes.generated';
import { carvedShapeKey, type CarvedOptions } from './gameIconsSource';

/** One path of an icon shape. `opacity` defaults to 1. */
export interface IconPath {
  readonly d: string;
  readonly opacity?: number;
}

/** An icon's geometry: a viewBox and the paths drawn inside it, every one filled `currentColor`. */
export interface IconShape {
  readonly viewBox: string;
  readonly paths: readonly IconPath[];
}

/** Where a shape comes from. A `game-icons` author is credited by `ICON_CREDITS`. */
export type IconSource =
  | { readonly family: 'game-icons'; readonly author: string; readonly slug: string }
  | { readonly family: 'own' };

export interface IconEntry {
  /** The one idea this icon means (Law 10). */
  readonly meaning: string;
  readonly shape: IconShape;
  readonly source: IconSource;
}

/** The game-icons.net grid every vendored shape is drawn on. */
export const GAME_ICON_VIEWBOX = '0 0 512 512';

/** The grid our own drawings use. */
export const OWN_ICON_VIEWBOX = '0 0 24 24';

/** The grid the map's place drawings use (the temporary `own` place entries copy them, § 6). */
export const MAP_DRAWING_VIEWBOX = '0 0 100 100';

/**
 * The unknown-concept mark (plan § 7, Law 58): an empty roundel — a plain ring, outer radius
 * 200 and ring width 48 on the 512 grid, nothing inside. Unlike every carved shape, never an
 * emoji. The outer circle runs clockwise and the inner one counter-clockwise, so the nonzero
 * fill leaves the middle empty.
 */
const FALLBACK_RING_OUTER_RADIUS = 200;
const FALLBACK_RING_WIDTH = 48;
const FALLBACK_RING_INNER_RADIUS = FALLBACK_RING_OUTER_RADIUS - FALLBACK_RING_WIDTH;

function circlePath(radius: number, clockwise: boolean): string {
  const sweep = clockwise ? 1 : 0;
  return `M256 ${256 - radius}a${radius} ${radius} 0 1 ${sweep} 0 ${2 * radius}a${radius} ${radius} 0 1 ${sweep} 0 ${-2 * radius}z`;
}

const FALLBACK_SHAPE: IconShape = {
  viewBox: GAME_ICON_VIEWBOX,
  paths: [{ d: circlePath(FALLBACK_RING_OUTER_RADIUS, true) + circlePath(FALLBACK_RING_INNER_RADIUS, false) }],
};

const warnedSlugs = new Set<string>();

/**
 * A carved entry's shape and source, read from the vendored file. A slug that was never
 * vendored (the script was not re-run) draws the fallback ring and warns once naming the
 * command, so the registry still loads; `carvedShapes.test.ts` fails the build on the same case.
 */
export function carved(slug: string, options: CarvedOptions = {}): Pick<IconEntry, 'shape' | 'source'> {
  const record = CARVED_SHAPES[carvedShapeKey(slug, options.mirror)];
  if (!record) {
    if (!warnedSlugs.has(slug)) {
      warnedSlugs.add(slug);
      console.warn(`[icon] carved shape "${slug}" is not vendored; run \`npm run icons:vendor\` and commit carvedShapes.generated.ts`);
    }
    return { shape: FALLBACK_SHAPE, source: { family: 'own' } };
  }
  return {
    shape: { viewBox: GAME_ICON_VIEWBOX, paths: [{ d: record.d }] },
    source: { family: 'game-icons', author: record.author, slug: record.slug },
  };
}

/** A temporary copy of one of today's map drawings, for an open place class (§ 6). */
function mapDrawing(paths: readonly IconPath[]): Pick<IconEntry, 'shape' | 'source'> {
  return { shape: { viewBox: MAP_DRAWING_VIEWBOX, paths }, source: { family: 'own' } };
}

/**
 * Every icon the game can draw. `satisfies` keeps the literal keys (so `IconName` is the exact
 * set) while checking each entry against `IconEntry`. Order follows Appendix A of the plan.
 */
export const ICON_REGISTRY = {
  fallback: { meaning: 'Not yet drawn', shape: FALLBACK_SHAPE, source: { family: 'own' } },

  // ── Appendix A: the 229 carved ideas ─────────────────────────────────────
  pause: { meaning: 'Pause time', ...carved('pause-button') },
  play: { meaning: 'Let time run', ...carved('play-button') },
  faster: { meaning: 'Run time faster', ...carved('fast-forward-button') },
  slower: { meaning: 'Run time slower', ...carved('fast-backward-button') },
  step: { meaning: 'Step one day while paused', ...carved('next-button') },
  find: { meaning: 'Find a place, person, power or card', ...carved('magnifying-glass') },
  'needs-you': { meaning: 'Something waits on you', ...carved('ringing-bell') },
  doom: { meaning: 'The doom clock', ...carved('sands-of-time') },
  omen: { meaning: 'An omen', ...carved('crystal-ball') },
  rivals: { meaning: 'Rival gods', ...carved('duel') },
  notables: { meaning: 'Notable mortals', ...carved('crown', { author: 'lorc' }) },
  'read-the-threads': { meaning: 'Read the Threads, the divine digest', ...carved('sewing-string') },
  settings: { meaning: 'Settings', ...carved('cog', { author: 'lorc' }) },
  close: { meaning: 'Close', ...carved('cancel') },
  back: { meaning: 'Go back', ...carved('return-arrow') },
  forward: { meaning: 'Go forward (the back arrow, mirrored)', ...carved('return-arrow', { mirror: true }) },
  widen: { meaning: 'Widen the panel', ...carved('expand') },
  pin: { meaning: 'Keep it (pinned)', ...carved('pin') },
  waiting: { meaning: 'Waiting', ...carved('hourglass') },
  'show-on-map': { meaning: 'Show on the map', ...carved('position-marker') },
  codex: { meaning: 'The Codex', ...carved('book-cover', { author: 'lorc' }) },
  chronicle: { meaning: 'The Chronicle', ...carved('open-book') },
  threads: { meaning: 'Your threaded mortals', ...carved('yarn') },
  news: { meaning: 'News', ...carved('trumpet-flag') },
  held: { meaning: 'Held behind the chapter on screen', ...carved('closed-doors') },
  'chapter-ledger': { meaning: 'The Chapter Ledger', ...carved('bookmark') },
  move: { meaning: 'Move', ...carved('walk') },
  investiture: { meaning: 'Investiture', ...carved('kneeling') },
  hooks: { meaning: 'Hooks: a story you can pull on', ...carved('fishing-hook') },
  pact: { meaning: 'A pact or oath', ...carved('shaking-hands') },
  signature: { meaning: 'Signature: the god’s own mark', ...carved('wax-seal') },
  essence: { meaning: 'Essence', ...carved('water-drop') },
  attention: { meaning: 'Attention, the god’s regard', ...carved('candle-flame') },
  detection: { meaning: 'Someone will notice', ...carved('cowled') },
  narrate: { meaning: 'Read the prose aloud', ...carved('lips') },
  music: { meaning: 'Music', ...carved('harp') },
  done: { meaning: 'Done, met', ...carved('check-mark') },
  failed: { meaning: 'Failed', ...carved('cross-mark') },
  locked: { meaning: 'Locked, not yet revealed', ...carved('padlock') },
  new: { meaning: 'New since you last looked', ...carved('sparkles') },
  disclosure: { meaning: 'Open or fold a section (turned by state)', ...carved('triangle-target') },
  person: { meaning: 'A mortal', ...carved('person') },
  faction: { meaning: 'A faction', ...carved('flying-flag') },
  place: { meaning: 'A place', ...carved('house') },
  area: { meaning: 'An area of land', ...carved('hills') },
  'place-within': { meaning: 'A place within a place', ...carved('doorway') },
  hex: { meaning: 'A hex of the map', ...carved('nested-hexagons') },
  artifact: { meaning: 'An artifact', ...carved('glowing-artifact') },
  attachment: { meaning: 'Something granted to a mortal', ...carved('present') },
  companion: { meaning: 'A companion', ...carved('hooded-figure') },
  army: { meaning: 'An army', ...carved('knight-banner') },
  encounter: { meaning: 'An encounter: a mortal’s moment', ...carved('drama-masks') },
  journey: { meaning: 'A journey', ...carved('footprint') },
  receipt: { meaning: 'A divine receipt', ...carved('incense') },
  monster: { meaning: 'A monster', ...carved('dragon-head', { author: 'lorc' }) },
  'place-capital': { meaning: 'Capital', ...carved('tower-flag') },
  'place-city': { meaning: 'City', ...carved('medieval-gate') },
  'place-town': { meaning: 'Town', ...carved('village') },
  'place-hamlet': { meaning: 'Hamlet', ...carved('wood-cabin') },
  'place-castle': { meaning: 'Castle', ...carved('white-tower') },
  'place-temple': { meaning: 'Temple', ...carved('greek-temple') },
  'place-shrine': { meaning: 'Shrine', ...carved('fire-shrine') },
  'place-ruins': { meaning: 'Ruins', ...carved('ancient-ruins') },
  'place-mine': { meaning: 'Mine', ...carved('mine-wagon') },
  'place-camp': { meaning: 'Camp', ...carved('camping-tent') },
  'place-lair': { meaning: 'Lair', ...carved('cave-entrance') },
  'place-fort': { meaning: 'Fort', ...carved('hill-fort') },
  'place-tower': { meaning: 'Tower', ...carved('watchtower') },
  'place-ruined-city': { meaning: 'Ruined city', ...carved('castle-ruins') },
  'place-ruined-tower': { meaning: 'Ruined tower', ...carved('tower-fall') },
  'place-ruined-village': { meaning: 'Ruined village', ...carved('damaged-house') },
  'place-battleground': { meaning: 'Battleground', ...carved('arrows-shield') },
  'place-unexplored': { meaning: 'Unexplored place', ...carved('fog') },
  'place-healing-spring': { meaning: 'Healing spring', ...carved('water-fountain') },
  'place-master-forge': { meaning: 'Master forge', ...carved('sword-smithing') },
  'place-living-archive': { meaning: 'Living archive', ...carved('book-aura') },
  'place-fey-crossing': { meaning: 'Fey crossing', ...carved('fairy', { author: 'lorc' }) },
  'place-sacrifice-site': { meaning: 'Sacrifice site', ...carved('star-altar') },
  'place-standing-stones': { meaning: 'Standing stones', ...carved('stone-stack') },
  'place-cavern': { meaning: 'Cavern', ...carved('underground-cave') },
  'place-grove': { meaning: 'Grove', ...carved('circle-forest') },
  'place-hot-spring': { meaning: 'Hot spring', ...carved('steam') },
  'place-shipwreck': { meaning: 'Shipwreck', ...carved('ship-wreck') },
  road: { meaning: 'A road or route', ...carved('stone-path') },
  'place-monument': { meaning: 'Monument', ...carved('obelisk') },
  'place-gem-deposit': { meaning: 'Gem deposit', ...carved('gems') },
  'place-golden-grove': { meaning: 'Golden grove', ...carved('honey-jar') },
  'place-crystal-cavern': { meaning: 'Crystal cavern', ...carved('crystal-cluster') },
  'place-ancient-vault': { meaning: 'Ancient vault', ...carved('locked-door') },
  'place-sunken-treasury': { meaning: 'Sunken treasury', ...carved('open-treasure-chest') },
  'place-herb-garden': { meaning: 'Herb garden', ...carved('herbs-bundle') },
  'place-fossil-bed': { meaning: 'Fossil bed', ...carved('ammonite-fossil') },
  'place-iron-seep': { meaning: 'Iron seep', ...carved('minerals') },
  'place-pearl-shoal': { meaning: 'Pearl shoal', ...carved('oyster-pearl') },
  'place-glowcap-hollow': { meaning: 'Glowcap hollow', ...carved('mushrooms-cluster') },
  'place-nest': { meaning: 'Nest', ...carved('hive') },
  'place-haunted-ground': { meaning: 'Haunted ground', ...carved('graveyard') },
  'place-farmland': { meaning: 'Farmland', ...carved('wheat') },
  'place-oasis': { meaning: 'Oasis', ...carved('oasis') },
  'place-bridge': { meaning: 'Bridge', ...carved('stone-bridge') },
  'place-wilderness': { meaning: 'Wilderness', ...carved('forest') },
  'place-waypoint': { meaning: 'Waypoint', ...carved('wooden-sign') },
  'place-trade-route': { meaning: 'Trade route', ...carved('old-wagon') },
  'place-market': { meaning: 'Market district', ...carved('shop') },
  'place-temple-quarter': { meaning: 'Temple quarter', ...carved('church') },
  'place-barracks': { meaning: 'Barracks', ...carved('medieval-barracks') },
  'place-throne-room': { meaning: 'Throne room', ...carved('throne-king') },
  'place-garden': { meaning: 'Garden', ...carved('vine-flower') },
  'place-dungeon': { meaning: 'Dungeon', ...carved('dungeon-gate') },
  'place-prison': { meaning: 'Prison', ...carved('window-bars') },
  'place-library': { meaning: 'Library', ...carved('bookshelf') },
  'place-archive': { meaning: 'Archive', ...carved('archive-research') },
  'place-crypt': { meaning: 'Crypt', ...carved('crypt-entrance') },
  'place-forge': { meaning: 'Forge', ...carved('blacksmith') },
  'place-tavern': { meaning: 'Tavern', ...carved('beer-stein') },
  possession: { meaning: 'A possession', ...carved('chest') },
  condition: { meaning: 'A condition', ...carved('bandaged') },
  arms: { meaning: 'Arms: weapons', ...carved('broadsword') },
  mount: { meaning: 'A mount or beast', ...carved('horse-head', { author: 'lorc' }) },
  vestments: { meaning: 'Vestments: clothing and armour', ...carved('robe') },
  tome: { meaning: 'A tome or scroll', ...carved('scroll-unfurled') },
  relic: { meaning: 'A relic or talisman', ...carved('gem-pendant') },
  tools: { meaning: 'Tools and instruments', ...carved('claw-hammer') },
  provisions: { meaning: 'Provisions', ...carved('knapsack') },
  wound: { meaning: 'A wound', ...carved('bleeding-wound') },
  disease: { meaning: 'Disease', ...carved('plague-doctor-profile') },
  poison: { meaning: 'Poison', ...carved('poison-bottle') },
  blessing: { meaning: 'A blessing', ...carved('angel-wings') },
  curse: { meaning: 'A curse', ...carved('cursed-star') },
  'bestowed-power': { meaning: 'A power a god bestowed', ...carved('glowing-hands') },
  'innate-power': { meaning: 'A power the bearer was born with', ...carved('inner-self') },
  bargain: { meaning: 'A debt or bargain', ...carved('scales') },
  favour: { meaning: 'A favour owed', ...carved('ring') },
  treaty: { meaning: 'A treaty', ...carved('rolled-cloth') },
  retainer: { meaning: 'A retainer', ...carved('swordman') },
  holding: { meaning: 'A holding the bearer owns', ...carved('house-keys') },
  spell: { meaning: 'A spell', ...carved('magic-swirl') },
  boost: { meaning: 'Boost: better odds at a fair price', ...carved('clover', { author: 'sbed' }) },
  'heavy-hand': { meaning: 'Heavy hand: a big push that draws notice', ...carved('hand-of-god') },
  insurance: { meaning: 'Insurance: no worse than success', ...carved('checked-shield') },
  mercy: { meaning: 'Mercy: disaster becomes failure', ...carved('dove') },
  gambit: { meaning: 'Gambit: all or nothing', ...carved('coinflip') },
  'side-bet': { meaning: 'Side bet: a small push and a worldly extra', ...carved('rolling-dice-cup') },
  'long-game': { meaning: 'Long game: plants a mark for later', ...carved('acorn') },
  reveal: { meaning: 'Reveal: see the hidden', ...carved('all-seeing-eye') },
  trait: { meaning: 'Trait card: from who the mortal is', ...carved('mirror-mirror') },
  undertow: { meaning: 'Undertow: an ugly method that shifts values', ...carved('big-wave') },
  stumble: { meaning: 'Stumble: weakens the opposition', ...carved('foot-trip') },
  ambition: { meaning: 'An ambition', ...carved('holy-grail') },
  cache: { meaning: 'Cache: leaves something to find', ...carved('spade', { author: 'lorc' }) },
  balm: { meaning: 'Balm: removes a condition', ...carved('cloth-jar') },
  veil: { meaning: 'Veil: help that no one sees', ...carved('cloak') },
  company: { meaning: 'A company: a group travelling together', ...carved('three-friends') },
  compel: { meaning: 'Compel: bend a will', ...carved('puppet') },
  trader: { meaning: 'Trader', ...carved('coins-pile') },
  smuggler: { meaning: 'Smuggler', ...carved('wooden-crate') },
  magnate: { meaning: 'Magnate', ...carved('crown-coin') },
  mason: { meaning: 'Mason', ...carved('brick-wall') },
  founder: { meaning: 'Founder', ...carved('stake-hammer') },
  discovery: { meaning: 'Discovery', ...carved('spyglass') },
  archivist: { meaning: 'Archivist', ...carved('quill-ink') },
  zealot: { meaning: 'Zealot', ...carved('torch') },
  prophet: { meaning: 'Prophet', ...carved('third-eye') },
  spider: { meaning: 'Spider: a court schemer', ...carved('masked-spider') },
  chancellor: { meaning: 'Chancellor', ...carved('gavel') },
  knife: { meaning: 'Knife: an underworld agent', ...carved('plain-dagger') },
  fence: { meaning: 'Fence', ...carved('swap-bag') },
  reaver: { meaning: 'Reaver', ...carved('battle-axe') },
  captain: { meaning: 'Captain', ...carved('crested-helmet') },
  warden: { meaning: 'Warden', ...carved('templar-shield') },
  healing: { meaning: 'Healing and care', ...carved('healing') },
  steward: { meaning: 'Steward', ...carved('watering-can') },
  crafter: { meaning: 'Crafter', ...carved('chisel') },
  maker: { meaning: 'Maker', ...carved('spinning-wheel') },
  wayfarer: { meaning: 'Wayfarer', ...carved('walking-boot') },
  pathfinder: { meaning: 'Pathfinder', ...carved('walking-scout') },
  vengeance: { meaning: 'Vengeance', ...carved('bloody-sword') },
  dominion: { meaning: 'Ambition to rule', ...carved('winged-scepter') },
  mastery: { meaning: 'Ambition to master a craft', ...carved('gauntlet') },
  legacy: { meaning: 'Ambition to leave a legacy', ...carved('oak') },
  survival: { meaning: 'Ambition to survive', ...carved('campfire') },
  devotion: { meaning: 'Devotion to a faith', ...carved('prayer') },
  battle: { meaning: 'A fight or battle', ...carved('crossed-swords') },
  trade: { meaning: 'Trade', ...carved('two-coins') },
  work: { meaning: 'Work, craft or building', ...carved('anvil', { author: 'lorc' }) },
  'source-bound': { meaning: 'Holding a source of power', ...carved('well') },
  claim: { meaning: 'Holding a place under claim', ...carved('flag-objective') },
  siege: { meaning: 'A siege', ...carved('catapult') },
  scheme: { meaning: 'A scheme', ...carved('spider-web') },
  unrest: { meaning: 'Unrest', ...carved('mailed-fist') },
  death: { meaning: 'A death', ...carved('tombstone', { author: 'sbed' }) },
  birth: { meaning: 'A birth', ...carved('stork-delivery') },
  mandate: { meaning: 'The mandate', ...carved('scroll-quill') },
  dilemma: { meaning: 'A dilemma', ...carved('crossroad') },
  harvest: { meaning: 'The harvest', ...carved('sickle') },
  revelation: { meaning: 'A revelation', ...carved('sunbeams') },
  social: { meaning: 'A meeting or friendship', ...carved('beer-horn') },
  trust: { meaning: 'Trust', ...carved('chained-heart') },
  scar: { meaning: 'A scar: what it cost', ...carved('scar-wound') },
  bond: { meaning: 'A bond: who it changed', ...carved('linked-rings') },
  boon: { meaning: 'A boon: what was earned', ...carved('laurels') },
  path: { meaning: 'A path: what it opened', ...carved('open-gate') },
  champion: { meaning: 'The god’s champion', ...carved('winged-sword') },
  aspect: { meaning: 'An Aspect of the god', ...carved('aura') },
  undertaking: { meaning: 'An undertaking', ...carved('compass') },
  'divine-actions': { meaning: 'The god’s own actions', ...carved('sun-radiations') },
  cards: { meaning: 'The repertoire of cards', ...carved('card-pickup') },
  resources: { meaning: 'Resources', ...carved('barrel') },
  pilgrimage: { meaning: 'A pilgrim way', ...carved('pilgrim-hat') },
  network: { meaning: 'A network of contacts', ...carved('cobweb') },
  standing: { meaning: 'Standing: how one is held', ...carved('ribbon-medal') },
  legendary: { meaning: 'A legendary artifact', ...carved('star-medal') },
  hunger: { meaning: 'Hunger cards', ...carved('fangs') },
  earned: { meaning: 'Cards earned in play', ...carved('card-draw') },
  staple: { meaning: 'Staple goods: food and field', ...carved('bread') },
  strategic: { meaning: 'Strategic goods: war and works', ...carved('metal-bar') },
  luxury: { meaning: 'Luxury goods', ...carved('perfume-bottle') },
  arcane: { meaning: 'Arcane goods', ...carved('magic-potion') },
  'season-spring': { meaning: 'Spring', ...carved('sprout') },
  'season-summer': { meaning: 'Summer', ...carved('sun', { author: 'lorc' }) },
  'season-autumn': { meaning: 'Autumn', ...carved('falling-leaf') },
  'season-winter': { meaning: 'Winter', ...carved('snowflake-1') },
  'cultural-omen': { meaning: 'A cultural omen', ...carved('totem') },
  'show-known-land': { meaning: 'Show all the land you know', ...carved('globe') },
  minimap: { meaning: 'The minimap', ...carved('treasure-map') },
  strife: { meaning: 'Strife: tempers drawn, or blows', ...carved('pitchfork') },
  drain: { meaning: 'A drain on a source', ...carved('leeching-worm') },
  'lens-dominion': { meaning: 'Dominion lens: your ground', ...carved('hill-conquest') },
  'lens-trouble': { meaning: 'Trouble lens', ...carved('burning-embers') },

  // ── Open places (Appendix C): temporary copies of the map's drawings (§ 6) ──
  // Each becomes carved by swapping its one entry once Christian picks (THR-1908).
  // `elder_ruin` has no drawing and draws `fallback` through PLACE_ICON.
  'place-convergence': {
    meaning: 'Convergence',
    ...mapDrawing([
      { d: 'M50 18 Q82 18 82 50 Q82 82 50 82 Q18 82 18 50 Q18 18 50 18 Z M50 26 Q74 26 74 50 Q74 74 50 74 Q26 74 26 50 Q26 26 50 26 Z', opacity: 0.25 },
      { d: 'M50 34 Q66 34 66 50 Q66 66 50 66 Q34 66 34 50 Q34 34 50 34 Z M50 42 Q58 42 58 50 Q58 58 50 58 Q42 58 42 50 Q42 42 50 42 Z M50 12 L50 88', opacity: 1.0 },
    ]),
  },
  'place-time-scar': {
    meaning: 'Time scar',
    ...mapDrawing([
      { d: 'M40 20 L34 38 L42 50 L36 64 L44 82 L56 82 L64 64 L58 50 L66 38 L60 20 Z', opacity: 0.2 },
      { d: 'M48 16 L44 30 L52 42 L46 56 L54 68 L48 84 M52 16 L56 30 L48 42 L54 56 L46 68 L52 84', opacity: 1.0 },
    ]),
  },
  'place-shadow-hollow': {
    meaning: 'Shadow hollow',
    ...mapDrawing([
      { d: 'M20 50 Q30 72 50 76 Q70 72 80 50 Q80 82 50 82 Q20 82 20 50 Z', opacity: 0.4 },
      { d: 'M16 48 Q30 70 50 74 Q70 70 84 48 M28 56 L24 64 M72 56 L76 64 M44 68 L40 78 M56 68 L60 78', opacity: 1.0 },
    ]),
  },
  'place-ley-nexus': {
    meaning: 'Ley nexus',
    ...mapDrawing([
      { d: 'M50 30 Q66 30 70 50 Q66 70 50 70 Q34 70 30 50 Q34 30 50 30 Z', opacity: 0.25 },
      { d: 'M50 50 L50 18 M50 50 L50 82 M50 50 L22 34 M50 50 L78 34 M50 50 L22 66 M50 50 L78 66 M44 44 L56 56 M56 44 L44 56', opacity: 1.0 },
    ]),
  },
  'place-corruption': {
    meaning: 'Corruption',
    ...mapDrawing([
      { d: 'M20 40 Q30 30 50 28 Q70 30 80 40 Q84 60 80 72 Q70 82 50 82 Q30 82 20 72 Q16 60 20 40 Z', opacity: 0.3 },
      { d: 'M50 28 L46 42 L52 52 L48 66 L50 82 M34 36 L38 48 L34 60 L36 74 M66 36 L62 48 L66 60 L64 74 M28 50 L38 52 M72 50 L62 52', opacity: 1.0 },
    ]),
  },
  'place-of-power': {
    meaning: 'Place of power',
    ...mapDrawing([
      { d: 'M50 20 Q80 20 80 50 Q80 80 50 80 Q20 80 20 50 Q20 20 50 20 Z', opacity: 0.18 },
      { d: 'M50 26 L52 12 L48 12 Z M74 38 L86 30 L84 34 Z M74 62 L86 70 L84 66 Z M50 74 L52 88 L48 88 Z M26 62 L14 70 L16 66 Z M26 38 L14 30 L16 34 Z', opacity: 0.7 },
      { d: 'M42 66 L42 50 Q42 42 50 42 Q58 42 58 50 L58 66 Z', opacity: 1.0 },
    ]),
  },
} as const satisfies Record<string, IconEntry>;

/** A name the registry draws. An unknown literal is a compile error. */
export type IconName = keyof typeof ICON_REGISTRY;

/** The name `Icon` falls back to (Law 4). */
export const FALLBACK_ICON_NAME: IconName = 'fallback';

/** The temporary own place entries of § 6, which leave as Christian picks their carved shapes. */
export const TEMPORARY_OWN_PLACE_ICONS = [
  'place-convergence',
  'place-time-scar',
  'place-shadow-hollow',
  'place-ley-nexus',
  'place-corruption',
  'place-of-power',
] as const satisfies readonly IconName[];

/**
 * The distinct `game-icons` authors of a registry, sorted — the input to the CC BY 3.0 credits
 * line on the start page's Credits. A function of the registry, never a hand-kept list, so the
 * credits cannot drift from the shipped set.
 */
export function iconCreditsOf(registry: Readonly<Record<string, IconEntry>>): string[] {
  const authors = new Set<string>();
  for (const entry of Object.values(registry)) {
    if (entry.source.family === 'game-icons') authors.add(entry.source.author);
  }
  return [...authors].sort((a, b) => a.localeCompare(b));
}

/** Every game-icons author the shipped registry draws from. */
export const ICON_CREDITS: readonly string[] = iconCreditsOf(ICON_REGISTRY);
