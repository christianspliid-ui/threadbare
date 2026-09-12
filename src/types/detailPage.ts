/**
 * Detail page type system — settles the contract for THR-301 Phase E implementation.
 * Design: Docs/plans/2026-05-06-detail-page-data-model.md
 */
import type { ProseLayer } from './prose';

// ─── Constants (NFP #1) ───────────────────────────────────────────────────────

/** Max nested DetailModal depth before breadcrumb collapses to `…`. */
export const MAX_DETAIL_STACK_DEPTH = 4;

/** Stack depth at which breadcrumb starts collapsing. */
export const DETAIL_BREADCRUMB_COLLAPSE_AT = 4;

/** Fraction of black added to each layer beneath a modal (CSS rgba). */
export const DETAIL_DIM_BENEATH_PCT = 0.28;

/** Audio duck applied (dB) when any detail modal is open. */
export const DETAIL_AMBIENT_DUCK_DB = -6;

/** Beat indicator opacity while any detail modal is open. */
export const DETAIL_BEAT_INDICATOR_OPACITY_PAUSED = 0.5;

/** Default modal width in px. */
export const DETAIL_DEFAULT_W = 720;

/** Default modal height in px. */
export const DETAIL_DEFAULT_H = 620;

/** Place detail width in px — accommodates painting. */
export const DETAIL_PLACE_W = 800;

/** Place detail height in px — accommodates painting. */
export const DETAIL_PLACE_H = 720;

/** Event detail width in px — accommodates richer event prose context. */
export const DETAIL_EVENT_W = 800;

/** Event detail height in px — accommodates richer event prose context. */
export const DETAIL_EVENT_H = 720;

/**
 * Group detail width / height in px.
 *
 * Equal to the default today, and named anyway (NFP #1): a group card that wants more
 * room for its roster should then be a number someone changes, not a branch someone adds.
 */
export const DETAIL_GROUP_W = 720;

/** Group detail height in px. See {@link DETAIL_GROUP_W}. */
export const DETAIL_GROUP_H = 620;

/** Hover-card dwell before the card opens. Below it, only the tooltip (Law 20 Tier 1). */
export const HOVER_CARD_DELAY_MS = 350;

/** Sections shown in the hover variant beyond the header. */
export const HOVER_CARD_MAX_SECTIONS = 1;

/** Hover card width in px — narrower than a card, because it is a glance, not a read. */
export const HOVER_CARD_W = 420;

/** Default prose tier for authored showcase sections. */
export const DETAIL_AUTHORED_DEFAULT_TIER: ProseTier = 'notable';

/** Sphere accent on the unknown-entity stub. */
export const DETAIL_FAILSOFT_STUB_SPHERE = 'time';

// ─── Discriminated types ──────────────────────────────────────────────────────

/**
 * Detail page types, one per primitive kind.
 *
 * `'group'` joined in THR-1490: an Army is the one `WorldRefKind` whose card is neither a
 * person nor a place nor a thing nor a happening — it is a body of people with a
 * commander and a stance, and rendering it as an `actor` page would ask the actor
 * resolvers for a disposition and a portrait that a column of soldiers does not have.
 *
 * A note the intent-judge recorded and this file inherits rather than originates: the
 * value `'place'` here overloads the UL game word *Place* (the inner tier). On this page
 * kind it means the place tier *and* the outer Location tier *and* the Area *and* the
 * hex — every kind of ground.
 */
export type DetailPageKind = 'actor' | 'item' | 'faction' | 'place' | 'event' | 'group';

/** Section type discriminator. UI dispatches on `kind`. */
export type SectionKind = 'prose' | 'chips' | 'event-card' | 'panel' | 'portrait';

/** Prose tier per Narrative Engine canon. */
export type ProseTier = 'routine' | 'notable' | 'chronicle';

// ─── Sub-descriptors ──────────────────────────────────────────────────────────

/** Reference to a graph node for click-to-open behaviour. */
export interface NodeRef {
  nodeId: string;
  /** The page type to open. Computed at resolve time so UI doesn't dispatch. */
  pageKind: DetailPageKind;
}

/** A single chip rendered in a `chips` section. */
export interface ChipDescriptor {
  /** Short label, e.g., "authority taut". */
  label: string;
  /** Sphere or token-name controlling the chip's accent colour. */
  sphere?: string;
  /** Optional sentiment colouring. */
  sentiment?: 'positive' | 'negative' | 'neutral';
  /** Optional italic descriptor under the label. */
  flavour?: string;
  /** Optional click target — opens another DetailModal. */
  clickRef?: NodeRef;
}

// ─── Section base + variants ──────────────────────────────────────────────────

export interface SectionBase {
  /** ALLCAPS Cinzel label, e.g. "DISPOSITION TOWARD HER". */
  label: string;
  /** Gold-coloured label = primary section. Default false (tertiary). */
  gold: boolean;
  /** Prose tier this section was rendered at. Drives debug + telemetry. */
  tier: ProseTier;
  /** Section type id from per-page schema (e.g. 'disposition_toward_her'). */
  typeId: string;
  /** Resolver that produced this section, for debug tracing. */
  source: string;
}

export interface ProseSection extends SectionBase {
  kind: 'prose';
  /** Final composed prose text. May contain `<span class="term">` markup. */
  prose: string;
  /** Optional supporting layers (used for debug/inspection, not render). */
  layers?: ProseLayer[];
  /** Keyword-tooltip wiring data: each placeholder name → resolved nodeRef. */
  termRefs?: Record<string, NodeRef>;
}

export interface ChipsSection extends SectionBase {
  kind: 'chips';
  chips: ChipDescriptor[];
}

export interface EventCardSection extends SectionBase {
  kind: 'event-card';
  /** "47 TURNS AGO · THE IRON MARKET" style header. */
  whenLabel: string;
  /** Italic prose body. */
  prose: string;
  /** Click target: opens the Event detail modal for this event. */
  eventRef: NodeRef;
}

export interface PanelSection extends SectionBase {
  kind: 'panel';
  /** Free-form rows for layouts like Faction reputations table. */
  rows: Array<{ left: string; right: string; sentiment?: 'positive' | 'negative' | 'neutral' }>;
}

export interface PortraitSection extends SectionBase {
  kind: 'portrait';
  portraitRef: { url?: string; subject: string; sphere: string };
  /** Prose body rendered alongside the portrait. */
  bodyProse?: string;
}

/** The discriminated union the UI renders. */
export type Section =
  | ProseSection
  | ChipsSection
  | EventCardSection
  | PanelSection
  | PortraitSection;

// ─── Full detail page payload ─────────────────────────────────────────────────

/** The full detail page payload the UI consumes. */
export interface DetailPage {
  kind: DetailPageKind;
  nodeId: string;
  /** Breadcrumb trail, last entry = current page. */
  trail: string[];
  /** ALLCAPS kind label, e.g. "ACTOR" or "ITEM · IN HER POSSESSION". */
  kindLabel: string;
  /** Cinzel display name, e.g. "Captain Veiren". */
  displayName: string;
  /** Sphere/role/disposition subtitle. */
  subtitle: string;
  /** Sphere driving the header accent colour. */
  sphere: string;
  /** Whether this entity has authored prose available (`node.showcase` flag). */
  isShowcase: boolean;
  /** Ordered section list. */
  sections: Section[];
  /** Whether the "open her sheet ↗" footer CTA is applicable. */
  hasFullSheet: boolean;
}
