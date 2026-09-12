import type { KnowledgeLevel } from './familiarity';

// ─── Prose Voice ──────────────────────────────────────────────────

/** Prose voice for entity sections */
export type ProseVoice = 'chronicle' | 'oral' | 'rumor' | 'divine';

// ─── Structured Block Entries ─────────────────────────────────────

export interface MemberEntry {
  id: string;
  name: string;
  role?: string;
  tier?: number;
}

export interface TraitEntry {
  name: string;
  category?: string;
}

export interface LocationEntry {
  id: string;
  name: string;
  biome?: string;
}

export interface TimelineEntry {
  tick: number;
  label: string;
  significance?: number;
}

export interface EntityBadge {
  label: string;
  color: string;
  tooltip?: string;
}

// ─── Structured Block (discriminated union) ───────────────────────

export interface TriggerEntry {
  condition: string;
  probability: number;
  narrativeTemplate?: string;
  effectSummary: string;
}

export type StructuredBlock =
  | { type: 'member_list'; members: MemberEntry[] }
  | { type: 'trait_grid'; traits: TraitEntry[] }
  | { type: 'territory_summary'; locations: LocationEntry[] }
  | { type: 'keyword_cloud'; keywords: string[]; accent: string }
  /**
   * Content tags as chips (THR-1486). Replaces `keyword_cloud` wherever the words come
   * from the closed tag vocabulary: a raw `#iron` on a sheet is a key, not a word
   * (Law 14), and a word the player cannot ask about is not a concept (Law 17). The
   * caller resolves `label` and `tooltipId` from the vocabulary so this block stays
   * presentational; `tooltipId: null` is the honest rendering of a spelling the
   * vocabulary no longer knows, which a saved world may still carry.
   */
  | {
      type: 'content_tag_chips';
      chips: ReadonlyArray<{ tag: string; label: string; tooltipId: string | null; glyph: string }>;
      accent: string;
    }
  | { type: 'bond_list'; bonds: { name: string; sentiment: string; strength: string }[] }
  | { type: 'domain_grid'; domains: { domain: string; word: string }[] }
  | { type: 'timeline'; events: TimelineEntry[] }
  | { type: 'trigger'; triggers: TriggerEntry[] };

// ─── Entity Section ───────────────────────────────────────────────

/** A single section in an entity detail view */
export interface EntitySection {
  id: string;
  title: string;
  insightTier: KnowledgeLevel;
  proseVoice: ProseVoice;
  prose: string;
  structuredData?: StructuredBlock;
}

// ─── Entity Header ────────────────────────────────────────────────

/** Entity header data — common across all entity types */
export interface EntityHeader {
  name: string;
  subtitle?: string;
  iconSvg?: string;
  accentColor: string;
  badges?: EntityBadge[];
}

// ─── Entity Detail ────────────────────────────────────────────────

/** Full entity detail descriptor — what the generic components render */
export interface EntityDetail {
  header: EntityHeader;
  cardSections: EntitySection[];
  codexSections: EntitySection[];
  heroImageUrl?: string;
  heroImageTier?: KnowledgeLevel;
}

// ─── Entity Detail Config ─────────────────────────────────────────

/** Config that maps raw entity data to EntityDetail */
export interface EntityDetailConfig<TData> {
  getDetail: (data: TData, insightLevel: KnowledgeLevel) => EntityDetail;
}
