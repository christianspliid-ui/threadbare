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

export type StructuredBlock =
  | { type: 'member_list'; members: MemberEntry[] }
  | { type: 'trait_grid'; traits: TraitEntry[] }
  | { type: 'territory_summary'; locations: LocationEntry[] }
  | { type: 'keyword_cloud'; keywords: string[]; accent: string }
  | { type: 'bond_list'; bonds: { name: string; sentiment: string; strength: string }[] }
  | { type: 'domain_grid'; domains: { domain: string; word: string }[] }
  | { type: 'timeline'; events: TimelineEntry[] };

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
