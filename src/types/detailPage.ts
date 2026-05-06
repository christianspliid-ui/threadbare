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

/** Default prose tier for authored showcase sections. */
export const DETAIL_AUTHORED_DEFAULT_TIER: ProseTier = 'notable';

/** Sphere accent on the unknown-entity stub. */
export const DETAIL_FAILSOFT_STUB_SPHERE = 'time';

// ─── Discriminated types ──────────────────────────────────────────────────────

/** Five detail page types, one per primitive kind. */
export type DetailPageKind = 'actor' | 'item' | 'faction' | 'place' | 'event';

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
