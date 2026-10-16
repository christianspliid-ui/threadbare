/**
 * The class maps — which registry idea each game key draws (THR-1904, plan
 * `2026-10-14-thr-1879-type-and-icons-rollout.md` § Content pillar, Appendix B).
 *
 * The registry (`iconRegistry.ts`) names each idea once with its one shape. These maps say which
 * game keys draw which idea; several keys may draw one idea when they mean the same thing
 * (`debt` and `bargain`, the card type `kindled_ambition` and the ambition). That is Law 10 kept.
 *
 * - A map keyed on a live union is a total `Record`, so a member added without an icon is a type
 *   error (the THR-890 pattern).
 * - String-keyed content that can grow at runtime (sublocation types, attachment subcategories)
 *   is walked by `conceptIcons.test.ts`, which names any live key with no entry.
 * - At runtime every map is read through `iconForKey`, which returns the entry or `'fallback'`
 *   and warns once per class and key (§ 7, Law 58). Never a throw, never a blank.
 *
 * **Additive (S2):** no reader has moved onto these maps yet; the glyph tables stay until the
 * sweep slices (THR-1906, THR-1907) move their readers. Other homes of the same layer: the
 * `icon` field on `CALLING_PRESENTATION` rows, `NUDGE_CARD_TYPE_ICON_NAMES` beside the card-type
 * glyphs, and the `icon` on the Codex `catDefs`.
 */

import type { IconName } from './iconRegistry';
import type { WorldRefKind } from '../../types/worldRef';
import type { LocationSubtype } from '../../types/index';
import type { AttachmentCategory, AgreementType, PossessionSubcategory } from '../../types/attachments';
import type { AlertIcon } from '../../types/notification';
import type { AmbitionCategory } from '../../types/ambition';
import type { OmenCategory } from '../../types/omen';
import type { UndertakingObjectTypeId } from '../../types/strategicAction';
import type { EncounterAftermathCategory } from '../../types/unifiedAction';
import type { ActivityKind } from '../../components/shared/ActivityIcon';
import type { ResourceClassCategory } from '../resource-classes';
import type { MapLensId } from '../map-lenses';

/** The idea a key draws when its class has no entry for it (Law 4 / Law 58). */
const FALLBACK: IconName = 'fallback';

// ─── Object kinds ────────────────────────────────────────────────────────────

/** Find results, Connections, toasts, entity fallbacks. `unknown` draws the fallback mark. */
export const ICON_FOR_WORLD_REF_KIND: Readonly<Record<WorldRefKind, IconName>> = {
  agent: 'person',
  faction: 'faction',
  location: 'place',
  area: 'area',
  sublocation: 'place-within',
  hex: 'hex',
  artifact: 'artifact',
  attachment: 'attachment',
  companion: 'companion',
  army: 'army',
  encounter: 'encounter',
  journey: 'journey',
  receipt: 'receipt',
};

// ─── Places ──────────────────────────────────────────────────────────────────

/**
 * Every place type (THR-1834 call 2b). Total over `LocationSubtype`, which contains every map
 * `LocationType`, so the map's texture builder (THR-1878) indexes it with no cast. A cleared lair
 * is the lair's shape (the map mutes its fill). The seven open places (Appendix C) draw their
 * temporary `own` copies of today's map drawings; `elder_ruin` has none and draws the fallback.
 */
export const PLACE_ICON: Readonly<Record<LocationSubtype, IconName>> = {
  capital: 'place-capital',
  city: 'place-city',
  town: 'place-town',
  hamlet: 'place-hamlet',
  castle: 'place-castle',
  temple: 'place-temple',
  shrine: 'place-shrine',
  ruins: 'place-ruins',
  mining: 'place-mine',
  camp: 'place-camp',
  lair: 'place-lair',
  cleared_lair: 'place-lair',
  fort: 'place-fort',
  tower: 'place-tower',
  ruined_city: 'place-ruined-city',
  ruined_tower: 'place-ruined-tower',
  ruined_village: 'place-ruined-village',
  battleground: 'place-battleground',
  unexplored_poi: 'place-unexplored',
  healing_spring: 'place-healing-spring',
  master_forge: 'place-master-forge',
  living_archive: 'place-living-archive',
  fey_crossing: 'place-fey-crossing',
  sacrifice_site: 'place-sacrifice-site',
  standing_stones: 'place-standing-stones',
  cavern: 'place-cavern',
  grove: 'place-grove',
  hot_spring: 'place-hot-spring',
  shipwreck: 'place-shipwreck',
  ancient_road: 'road',
  monument: 'place-monument',
  gem_deposit: 'place-gem-deposit',
  golden_grove: 'place-golden-grove',
  crystal_cavern: 'place-crystal-cavern',
  ancient_vault: 'place-ancient-vault',
  sunken_treasury: 'place-sunken-treasury',
  herb_garden: 'place-herb-garden',
  fossil_bed: 'place-fossil-bed',
  iron_seep: 'place-iron-seep',
  pearl_shoal: 'place-pearl-shoal',
  glowcap_hollow: 'place-glowcap-hollow',
  nest: 'place-nest',
  haunted_ground: 'place-haunted-ground',
  farmland: 'place-farmland',
  oasis: 'place-oasis',
  bridge: 'place-bridge',
  wilderness: 'place-wilderness',
  wilderness_waypoint: 'place-waypoint',
  trade_route: 'place-trade-route',
  // Open places (Appendix C, THR-1908): temporary own entries until Christian picks.
  convergence: 'place-convergence',
  time_scar: 'place-time-scar',
  shadow_hollow: 'place-shadow-hollow',
  ley_nexus: 'place-ley-nexus',
  corruption_zone: 'place-corruption',
  place_of_power: 'place-of-power',
  elder_ruin: 'fallback',
};

/**
 * The sublocation types with art of their own, keyed by the id with its `sublocation-type.`
 * prefix stripped. Every other sublocation takes its parent's place shape (THR-1834 call 2b) —
 * use `iconForSublocation`.
 */
export const ICON_FOR_SUBLOCATION_TYPE: Readonly<Record<string, IconName>> = {
  'market-district': 'place-market',
  'temple-quarter': 'place-temple-quarter',
  barracks: 'place-barracks',
  'throne-room': 'place-throne-room',
  garden: 'place-garden',
  dungeon: 'place-dungeon',
  prison: 'place-prison',
  library: 'place-library',
  archive: 'place-archive',
  crypt: 'place-crypt',
  forge: 'place-forge',
  tavern: 'place-tavern',
};

// ─── Attachments ─────────────────────────────────────────────────────────────

/** What a mortal carries, by category. */
export const ICON_FOR_ATTACHMENT_CATEGORY: Readonly<Record<AttachmentCategory, IconName>> = {
  possession: 'possession',
  condition: 'condition',
  agreement: 'pact',
  blessing: 'blessing',
  curse: 'curse',
  bestowed_power: 'bestowed-power',
  spell: 'spell',
  companion: 'companion',
  holding: 'holding',
};

/** Condition and power subcategories `attachmentGlyphs.ts` names beside the unions. */
type AttachmentSubcategoryExtra =
  | 'wound' | 'injury' | 'disease' | 'poison'
  | 'blessing' | 'curse' | 'bestowed_power' | 'innate_power'
  | 'retainer' | 'companion' | 'holding' | 'spell';

export type AttachmentSubcategoryKey = PossessionSubcategory | AgreementType | AttachmentSubcategoryExtra;

/** What a mortal carries, by subcategory. `oath` is a pact ("A pact or oath"). */
export const ICON_FOR_ATTACHMENT_SUBCATEGORY: Readonly<Record<AttachmentSubcategoryKey, IconName>> = {
  arms: 'arms',
  mounts_beasts: 'mount',
  vestments: 'vestments',
  tomes_scrolls: 'tome',
  relics_talismans: 'relic',
  tools_instruments: 'tools',
  provisions: 'provisions',
  wound: 'wound',
  injury: 'wound',
  disease: 'disease',
  poison: 'poison',
  blessing: 'blessing',
  curse: 'curse',
  bestowed_power: 'bestowed-power',
  innate_power: 'innate-power',
  pact: 'pact',
  oath: 'pact',
  debt: 'bargain',
  bargain: 'bargain',
  favour: 'favour',
  treaty: 'treaty',
  retainer: 'retainer',
  companion: 'companion',
  holding: 'holding',
  spell: 'spell',
};

// ─── Ambitions ───────────────────────────────────────────────────────────────

export const ICON_FOR_AMBITION: Readonly<Record<AmbitionCategory, IconName>> = {
  dominion: 'dominion',
  mastery: 'mastery',
  vengeance: 'vengeance',
  legacy: 'legacy',
  survival: 'survival',
  discovery: 'discovery',
  devotion: 'devotion',
};

// ─── Encounter activity and alerts ───────────────────────────────────────────

export const ICON_FOR_ACTIVITY: Readonly<Record<ActivityKind, IconName>> = {
  boot: 'journey',
  swords: 'battle',
  coin: 'trade',
  hammer: 'work',
  bandage: 'healing',
  hourglass: 'waiting',
  'hex-claim': 'hex',
  'source-bound': 'source-bound',
  'claim-flag': 'claim',
};

/** Encounter-activity marks that are not `ActivityKind` members yet (the Trouble marks share them). */
export const ICON_FOR_ACTIVITY_MARK: Readonly<Record<'siege' | 'scheme' | 'unrest', IconName>> = {
  siege: 'siege',
  scheme: 'scheme',
  unrest: 'unrest',
};

/** Needs-you News (THR-1875): one icon per alert kind. */
export const ICON_FOR_ALERT: Readonly<Record<AlertIcon, IconName>> = {
  death: 'death',
  birth: 'birth',
  doom: 'doom',
  mandate: 'mandate',
  discovery: 'discovery',
  rival: 'rivals',
  dilemma: 'dilemma',
  harvest: 'harvest',
  revelation: 'revelation',
  social: 'social',
  faction: 'faction',
  trust: 'trust',
};

// ─── Consequences and thread-row marks ───────────────────────────────────────

export const ICON_FOR_CONSEQUENCE: Readonly<Record<EncounterAftermathCategory, IconName>> = {
  scar: 'scar',
  bond: 'bond',
  boon: 'boon',
  path: 'path',
};

export type ThreadRowMark =
  | 'badge-encounter' | 'badge-notice' | 'champion' | 'aspect'
  | 'appointment' | 'badge-aftermath' | 'badge-tug' | 'badge-moment';

/** The thread row's badges and extras (ThreadsPanel). */
export const ICON_FOR_THREAD_ROW_MARK: Readonly<Record<ThreadRowMark, IconName>> = {
  'badge-encounter': 'needs-you',
  'badge-notice': 'news',
  champion: 'champion',
  aspect: 'aspect',
  appointment: 'waiting',
  'badge-aftermath': 'new',
  'badge-tug': 'threads',
  'badge-moment': 'undertaking',
};

// ─── Codex: undertaking kinds, card groups, resources ────────────────────────

export const ICON_FOR_UNDERTAKING_OBJECT: Readonly<Record<UndertakingObjectTypeId, IconName>> = {
  area: 'area',
  location: 'place',
  place: 'place-within',
  route: 'road',
  pilgrim_way: 'pilgrimage',
  faction: 'faction',
  company: 'company',
  army: 'army',
  network: 'network',
  companion: 'companion',
  item: 'possession',
  power: 'spell',
  condition: 'condition',
  agreement: 'pact',
  standing: 'standing',
  mortal: 'person',
  monster: 'monster',
};

/**
 * The Codex's chartered rail groups (`charteredKindsCodex.ts`): the Repertoire's card groups and
 * the legendary artifacts. `conceptIcons.test.ts` checks the keys against the ids that file writes.
 */
export type CharteredGroupId = 'card_core' | 'card_signature' | 'card_hunger' | 'card_earned' | 'legendary';

export const ICON_FOR_CHARTERED_GROUP: Readonly<Record<CharteredGroupId, IconName>> = {
  card_core: 'cards',
  card_signature: 'signature',
  card_hunger: 'hunger',
  card_earned: 'earned',
  legendary: 'legendary',
};

export const ICON_FOR_RESOURCE_CLASS: Readonly<Record<ResourceClassCategory, IconName>> = {
  staple: 'staple',
  strategic: 'strategic',
  luxury: 'luxury',
  arcane: 'arcane',
};

// ─── Seasons and omens ───────────────────────────────────────────────────────

/** The four seasons, in order (the top bar's date, THR-1875). */
export const SEASON_IDS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type SeasonId = (typeof SEASON_IDS)[number];

export const ICON_FOR_SEASON: Readonly<Record<SeasonId, IconName>> = {
  spring: 'season-spring',
  summer: 'season-summer',
  autumn: 'season-autumn',
  winter: 'season-winter',
};

/**
 * How an omen kind is drawn: a registry idea, or by another vocabulary — a sphere surge draws its
 * sphere's `SphereIcon` (our drawing), a seasonal omen its season's icon.
 */
export type OmenIconRule =
  | { readonly icon: IconName }
  | { readonly drawnBy: 'sphere' }
  | { readonly drawnBy: 'season' };

export const ICON_FOR_OMEN: Readonly<Record<OmenCategory, OmenIconRule>> = {
  doom_echo: { icon: 'doom' },
  sphere_surge: { drawnBy: 'sphere' },
  cultural: { icon: 'cultural-omen' },
  seasonal: { drawnBy: 'season' },
};

// ─── Map lenses ──────────────────────────────────────────────────────────────

/** Lenses THR-1878's build adds to `MAP_LENSES`; listed here so their icons are settled first. */
export type PlannedMapLensId = 'threads' | 'trouble' | 'trade';

/** The lens bar (THR-1878 reads `ICON_FOR_LENS`). Total over today's `MapLensId` and the planned lenses. */
export const ICON_FOR_LENS: Readonly<Record<MapLensId | PlannedMapLensId, IconName>> = {
  dominion: 'lens-dominion',
  threads: 'threads',
  trouble: 'lens-trouble',
  trade: 'trade',
};

// ─── The one resolver ────────────────────────────────────────────────────────

/** A class map with the words its warning needs. */
export interface IconClass<K extends string = string> {
  /** Stable id, reported by `getIconReport().fallbacksDrawn`. */
  readonly id: string;
  /** The map's exported name, so the warning says where to add the key. */
  readonly mapName: string;
  /** What the class's keys are, in words ("sublocation type"). */
  readonly kindWord: string;
  readonly map: Readonly<Partial<Record<K, IconName>>>;
}

const classOf = <K extends string>(id: string, mapName: string, kindWord: string, map: Readonly<Partial<Record<K, IconName>>>): IconClass<K> =>
  ({ id, mapName, kindWord, map });

/** Every class map, by id. */
export const ICON_CLASSES = {
  'world-ref-kind': classOf('world-ref-kind', 'ICON_FOR_WORLD_REF_KIND', 'object kind', ICON_FOR_WORLD_REF_KIND),
  place: classOf('place', 'PLACE_ICON', 'place type', PLACE_ICON),
  'sublocation-type': classOf('sublocation-type', 'ICON_FOR_SUBLOCATION_TYPE', 'sublocation type', ICON_FOR_SUBLOCATION_TYPE),
  'attachment-category': classOf('attachment-category', 'ICON_FOR_ATTACHMENT_CATEGORY', 'attachment category', ICON_FOR_ATTACHMENT_CATEGORY),
  'attachment-subcategory': classOf('attachment-subcategory', 'ICON_FOR_ATTACHMENT_SUBCATEGORY', 'attachment subcategory', ICON_FOR_ATTACHMENT_SUBCATEGORY),
  ambition: classOf('ambition', 'ICON_FOR_AMBITION', 'ambition category', ICON_FOR_AMBITION),
  activity: classOf('activity', 'ICON_FOR_ACTIVITY', 'activity kind', ICON_FOR_ACTIVITY),
  alert: classOf('alert', 'ICON_FOR_ALERT', 'alert kind', ICON_FOR_ALERT),
  consequence: classOf('consequence', 'ICON_FOR_CONSEQUENCE', 'consequence', ICON_FOR_CONSEQUENCE),
  'thread-row-mark': classOf('thread-row-mark', 'ICON_FOR_THREAD_ROW_MARK', 'thread-row mark', ICON_FOR_THREAD_ROW_MARK),
  'undertaking-object': classOf('undertaking-object', 'ICON_FOR_UNDERTAKING_OBJECT', 'undertaking kind', ICON_FOR_UNDERTAKING_OBJECT),
  'chartered-group': classOf('chartered-group', 'ICON_FOR_CHARTERED_GROUP', 'Codex group', ICON_FOR_CHARTERED_GROUP),
  'resource-class': classOf('resource-class', 'ICON_FOR_RESOURCE_CLASS', 'resource class', ICON_FOR_RESOURCE_CLASS),
  season: classOf('season', 'ICON_FOR_SEASON', 'season', ICON_FOR_SEASON),
  lens: classOf('lens', 'ICON_FOR_LENS', 'map lens', ICON_FOR_LENS),
} as const;

export type IconClassId = keyof typeof ICON_CLASSES;

const warnedKeys = new Set<string>();
const fallbacksDrawn: { classId: string; key: string }[] = [];

/**
 * The idea a key draws, or `'fallback'` (warning once per class and key) when its class has no
 * entry — an off-union string from an old save, or content added without an icon (§ 7).
 */
export function iconForKey<K extends string>(cls: IconClass<K>, key: string): IconName {
  const hit = Object.prototype.hasOwnProperty.call(cls.map, key) ? cls.map[key as K] : undefined;
  if (hit) return hit;
  const seenKey = `${cls.id}\u0000${key}`;
  if (!warnedKeys.has(seenKey)) {
    warnedKeys.add(seenKey);
    fallbacksDrawn.push({ classId: cls.id, key });
    console.warn(`[icon] no icon for ${cls.kindWord} "${key}" — add it to ${cls.mapName} in src/data/icons/conceptIcons.ts`);
  }
  return FALLBACK;
}

/** Strip the `sublocation-type.` prefix content writes inconsistently. */
export function normaliseSublocationType(typeId: string): string {
  return typeId.startsWith('sublocation-type.') ? typeId.slice('sublocation-type.'.length) : typeId;
}

/**
 * A sublocation's idea: its own entry when its type has one, else its parent's place shape
 * (THR-1834 call 2b), else `place-within`.
 */
export function iconForSublocation(typeId: string, parentSubtype?: LocationSubtype): IconName {
  const own = ICON_FOR_SUBLOCATION_TYPE[normaliseSublocationType(typeId)];
  if (own) return own;
  if (parentSubtype) return iconForKey(ICON_CLASSES.place, parentSubtype);
  return 'place-within';
}

/** Keys that drew the fallback since load, in first-seen order (`getIconReport`). */
export function getFallbacksDrawn(): readonly { classId: string; key: string }[] {
  return fallbacksDrawn;
}

/** Test hook: forget which keys already warned. */
export function resetConceptIconWarningsForTest(): void {
  warnedKeys.clear();
  fallbacksDrawn.length = 0;
}
