/**
 * Detail page type system — settles the contract for THR-301 Phase E implementation.
 * Design: Docs/plans/2026-05-06-detail-page-data-model.md
 */
import type { ProseLayer } from './prose';
import type { AnyRef } from './contentRef';
import type { WorldRef } from './worldRef';
import type { IconName } from '../data/icons/iconRegistry';

// ─── Constants (NFP #1) ───────────────────────────────────────────────────────

// THR-1912: the DetailModal stack retired with its depth, dim, duck and per-kind size
// constants (`MAX_DETAIL_STACK_DEPTH`, `DETAIL_*_W/_H`, …); the Inspector owns its sizes.

/** Hover-card dwell before the card opens. Below it, only the tooltip (Law 20 Tier 1). */
export const HOVER_CARD_DELAY_MS = 350;

/** Sections shown in the hover variant beyond the header. */
export const HOVER_CARD_MAX_SECTIONS = 1;

/* The hover card's width is a rem token since THR-1819 — `--hovercard-w` (26.25rem:
   420px at 1080p, 472.5px at 1440p), narrower than a card because it is a glance, not
   a read. Its one TS copy is `TEXT_TOKENS_REM.hovercardW` in layoutContract.ts. */

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
 * `'content'` joined in THR-1491, and is the one member that is **not** about a thing in
 * the world at all: it renders a piece of authored content — a template, a definition, a
 * rule someone wrote — which is a `ContentRef`, never a `WorldRef`.
 *
 * A note the intent-judge recorded and this file inherits rather than originates: the
 * value `'place'` here overloads the UL game word *Place* (the inner tier). On this page
 * kind it means the place tier *and* the outer Location tier *and* the Area *and* the
 * hex — every kind of ground.
 */
export type DetailPageKind = 'actor' | 'item' | 'faction' | 'place' | 'event' | 'group' | 'content';

/**
 * The page kinds {@link DetailPage} can be built for **from the world graph**.
 *
 * Every kind but `'content'`. A content object is a catalog entry rather than a node, so
 * `generateDetailPage` — which begins by asking the graph for a node and gives up when
 * there is none — cannot build its page and must not be asked to: `generateContentPage`
 * does, from `CONTENT_RESOLVERS`.
 *
 * This exclusion is why `DETAIL_PAGE_REGISTRY` and `KIND_LABELS` key on this narrower
 * union. The alternative — a `content: []` row in the schema registry — would compile, and
 * would mean "this page kind has no sections", which is false and reads like a bug. The
 * type saying *the graph generator cannot be asked for this* is the honest shape.
 */
export type GraphPageKind = Exclude<DetailPageKind, 'content'>;

/**
 * Section type discriminator. UI dispatches on `kind`.
 *
 * `'triggers'` joined in THR-1492, when `EntityCard` — the older section model, whose one
 * consumer was the attachment sheet — retired into this one. A trigger is the one thing
 * that model could say and this one could not: a condition, a *firing chance*, and what
 * fires. Law 15 gives a probability pips, so rendering it as a `panel` row would have
 * dropped the pips and the authored line with them. The canonical model has to be able to
 * say everything the model it replaces could say, or the replacement is a regression.
 */
export type SectionKind = 'prose' | 'chips' | 'event-card' | 'panel' | 'portrait' | 'triggers' | 'links' | 'cards';

/**
 * Where a section shows (THR-1876 § D6). The hover card is the fourth width; the
 * Inspector's three sizes are the other three. A section with no `visibleAt`
 * shows on every surface — today's behaviour, the hover card included.
 */
export type PageSurface = 'hover' | 'docked' | 'wide' | 'full';

/** Every surface, in widening order. */
export const PAGE_SURFACES: readonly PageSurface[] = ['hover', 'docked', 'wide', 'full'];

/**
 * The one page-layout table's key (THR-1876 § D6, UI Law 58): the graph page kinds,
 * plus content cards and the three page kinds that have no single node — the land
 * page (a hex), the god's own sheet and a record (an encounter, journey or receipt,
 * or a graph event). `DETAIL_PAGE_REGISTRY` is a `Record` over this union, so a kind
 * without rows is a type error.
 */
export type PageLayoutKind = GraphPageKind | 'content' | 'land' | 'god' | 'record';

/** The Inspector's body tabs (THR-1876 § D6). A closed union: `INSPECTOR_TAB_LABELS` is total over it. */
export type InspectorTabId =
  | 'overview'
  | 'prowess'
  | 'attachments'
  | 'bonds'
  | 'journey'
  | 'chronicle'
  | 'chapters'
  | 'here_now'
  | 'story'
  | 'reaches';

/** Prose tier per Narrative Engine canon. */
export type ProseTier = 'routine' | 'notable' | 'chronicle';

// ─── Sub-descriptors ──────────────────────────────────────────────────────────

/**
 * Reference to a graph node for click-to-open behaviour.
 *
 * `GraphPageKind`, not `DetailPageKind`: a `NodeRef` is by definition a node, and a
 * content card has no node to point at. Content chips carry a `tooltipId` instead — a tag
 * explains itself (Law 17 Tier 1) rather than opening a page of its own.
 */
export interface NodeRef {
  nodeId: string;
  /** The page type to open. Computed at resolve time so UI doesn't dispatch. */
  pageKind: GraphPageKind;
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
  /**
   * Optional concept explanation (`tooltipResolver` id), Law 17 Tier 1.
   *
   * THR-1491: what a content card's tag chips carry. A tag is a *concept* — `#weapon`
   * names a family, not a thing — so it explains itself on hover and opens nothing, which
   * is the distinction Law 20's ladder draws between a tooltip and a card. A chip may
   * carry both this and a `clickRef`; nothing today does.
   */
  tooltipId?: string;
  /**
   * @deprecated Not drawn since THR-1906 (plan THR-1879 § 9): the chip's word is the axis.
   * `ArtifactSheet` still sets it and retires with the Inspector (THR-1876); then this goes.
   */
  glyph?: string;
  /**
   * Optional stable key for the thing this chip names, emitted as `data-<attr>` for tests
   * and for surfaces that need to find a specific chip in the DOM. Never rendered as text
   * — the label is the word the player reads (Law 14).
   */
  dataKey?: { attribute: string; value: string };
  /**
   * THR-2097 (additive, rule R7): the trait that leads — drawn in primary text with a heavier
   * border. The resolver words it ("Loyal above all"); at most one per section.
   */
  lead?: boolean;
}

/** One row of a `triggers` section: what fires, how likely, and what it does. */
export interface TriggerRow {
  /** Player-facing event name, e.g. "Critical failure" — never the raw event key (Law 14). */
  condition: string;
  /** Firing chance, 0–1. Rendered as pips (Law 15), never as a numeral. */
  probability: number;
  /** Optional authored line the trigger narrates when it fires. */
  narrativeTemplate?: string;
  /** What the trigger does, in words. */
  effectSummary: string;
}

// ─── Section base + variants ──────────────────────────────────────────────────

export interface SectionBase {
  /** Sentence-case label (THR-1879 label rule), e.g. "Disposition toward her". */
  label: string;
  /** Gold-coloured label = primary section. Default false (tertiary). */
  gold: boolean;
  /** Prose tier this section was rendered at. Drives debug + telemetry. */
  tier: ProseTier;
  /** Section type id from per-page schema (e.g. 'disposition_toward_her'). */
  typeId: string;
  /** Resolver that produced this section, for debug tracing. */
  source: string;
  /**
   * Where this section shows (THR-1876 § D6), copied from its registry row by the
   * generator. Absent = every surface. The producer never drops a section by width;
   * each surface filters with `sectionVisibleAt`.
   */
  visibleAt?: readonly PageSurface[];
  /** Which Inspector tab it sits in, copied from its registry row. Absent = 'overview'. */
  tab?: InspectorTabId;
  /**
   * THR-1909 (additive): the section's label explains itself on hover (Law 17) — the
   * `tooltipResolver` id a retiring sheet put on the same heading (`ui.arc_strip`,
   * `ui.intention.*`). Absent = a plain label.
   */
  labelTooltipId?: string;
  /**
   * THR-2097 (additive, rule R2): the concept the heading names, drawn before the label.
   * Copied from the registry row's `icon` (Law 58) unless the resolver set a more specific
   * one (`leading_ambition` reads `ICON_FOR_AMBITION`).
   */
  icon?: IconName;
  /**
   * THR-2097 (additive, rule R3): `'aside'` = at wide and Full the Inspector draws this
   * section in its aside, under the Act row, not in its tab. Docked keeps it in its tab.
   */
  placement?: 'aside';
}

/**
 * THR-2097 (rule R6) — one run of a composed sentence: plain text, or a fact drawn as a term
 * that links (`ref`, Law 21) or explains itself on hover (`tooltipId`, Law 17).
 */
export type SentencePart = string | { text: string; ref?: WorldRef; tooltipId?: string };

/** THR-2097 — a drawn tie (rule R4): the god's face, the bond mark, the person's face. */
export interface BondStripVM {
  /** The god: its name and its face (`ascendantPortraitSrc`; null → the words only). */
  left: { name: string; src: string | null };
  /**
   * The person: their face as `resolveEntityVisual` gave it at the god's knowledge level, so
   * the gate holds (Law 8). Null = no art, or not yet known: the strip draws the person mark.
   */
  right: { name: string; id: string; src: string | null };
}

export interface ProseSection extends SectionBase {
  kind: 'prose';
  /** Final composed prose text. May contain `<span class="term">` markup. */
  prose: string;
  /** Optional supporting layers (used for debug/inspection, not render). */
  layers?: ProseLayer[];
  /** Keyword-tooltip wiring data: each placeholder name → resolved nodeRef. */
  termRefs?: Record<string, NodeRef>;
  /**
   * How the prose sits (THR-1876 § D6, additive). Absent = `'body'`. `'quote'` is a
   * spoken line; `'lede'` is a page's one-line opener. Paragraphs are separated by a
   * blank line (`\n\n`) and render as one `<p>` each.
   */
  variant?: 'body' | 'quote' | 'lede';
  /**
   * THR-2097 (additive, rule R5): the surface's one highlighted line — an icon and a
   * display-font headline over the prose. At most one per page (Law 31's one gold).
   */
  highlight?: { icon: IconName; headline: string };
  /** THR-2097 (additive, rule R4): drawn only while the engine holds the thread to the god. */
  bond?: BondStripVM;
  /**
   * THR-2097 (additive, rule R6): the sentence as parts, so each fact keeps its link and its
   * tooltip. Present = the renderer draws the parts; `prose` then holds the same words as
   * plain text for every reader that wants a string (the hover card, tests).
   */
  parts?: SentencePart[];
}

export interface ChipsSection extends SectionBase {
  kind: 'chips';
  chips: ChipDescriptor[];
}

export interface EventCardSection extends SectionBase {
  kind: 'event-card';
  /** "Three days ago · The Iron Market" style header. */
  whenLabel: string;
  /** Italic prose body. */
  prose: string;
  /**
   * Click target: opens the Event detail modal for this event. THR-1909 made it
   * optional — a story *list* (`entries`) is many happenings, and a store record with
   * no graph node has nothing to open; the card then draws as plain text.
   */
  eventRef?: NodeRef;
  /**
   * THR-1909 (additive): a story told as a list — a person's timeline, arc, chapters.
   * Each entry is a when-word and one line, newest or oldest first as the resolver
   * orders them. Present = the card renders the list; `whenLabel`/`prose` then hold
   * the empty-list line (`''` when there is none).
   */
  entries?: EventEntry[];
}

/** One line of a story list (THR-1909). `whenLabel` is words — `elapsedLabel`, never "N turns ago". */
export interface EventEntry {
  whenLabel: string;
  prose: string;
}

/** One row of a `panel` (facts) section. */
export interface PanelRow {
  left: string;
  right: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  /** THR-1876 (additive): the row's value names a world thing — it renders as a link (Law 21). */
  ref?: WorldRef;
  /** THR-1876 (additive): the row explains itself on hover (Law 17). */
  tooltipId?: string;
  /**
   * THR-1876 (additive): a 0–1 proportion drawn as a bar beside the word — the word is
   * always present, never a numeral (Law 13's unitless-proportion ruling, THR-1424).
   * Only where a retiring surface draws that bar today; never on a new field.
   */
  meter?: number;
  /**
   * THR-2097 (additive, rule R7): the scale's two words, left and right. With `meter` the
   * row draws as a two-pole bar — both words, a marker, and the leaning word kept visible
   * after it (THR-1876 § D6). Never a numeral (Law 13).
   */
  poles?: [string, string];
}

export interface PanelSection extends SectionBase {
  kind: 'panel';
  /** Free-form rows for layouts like Faction reputations table. */
  rows: PanelRow[];
}

/** One named world thing in a `links` section (THR-1876 § D6). */
export interface LinkRow {
  ref: WorldRef;
  name: string;
  /** One plain fact: "Priest · Congregation of the Spheres". Empty when there is none. */
  fact: string;
}

/**
 * A list of named world things (THR-1876 § D6, new shape). Each row renders as an
 * identity chip, its one fact and the eye. Not a relation list on a body — relations
 * live in Connections (§ D6 "a relation lives in one place"); this shape is what the
 * Connections block and *In this land* render through, and what a body uses for
 * things the subject *contains as facts* (none in S1).
 */
export interface LinksSection extends SectionBase {
  kind: 'links';
  rows: LinkRow[];
  /** Optional grouping; each group carries its full row list and its total. */
  groups?: Array<{ label: string; rows: LinkRow[]; total: number }>;
  /** Rows a docked page keeps before "Show all N", when it must fold to fit. */
  foldAfter?: number;
}

/** One tile of a `cards` section. */
export interface CardTile {
  ref?: WorldRef;
  title: string;
  kindWord: string;
  /** THR-2023 (additive): a tooltip on the kind word — the debt tile's "what a debt is". */
  kindWordTooltipId?: string;
  lines: string[];
  /** A 0–1 proportion drawn as a bar (same rule as `PanelRow.meter`). */
  meter?: number;
  durationWord?: string;
  /**
   * THR-1992 (additive): a fight clock — square magnitude pips beside the clock-state
   * word (Law 13: never a digit). The lair's monster card is the only writer.
   */
  clock?: { size: number; filled: number; word: string; wordTooltipId?: string; ariaLabel: string };
  /** THR-1992 (additive): a closing "{lead}{name}" whose name links (Law 21) — "slain by Vara". */
  byLine?: { lead: string; name: string; ref: WorldRef };
  /**
   * THR-2097 (additive, rule R3): the thing's own art, drawn as a 16:9 band over its name.
   * Absent = the words-only tile.
   */
  image?: { src: string; alt: string };
}

/** A row of small cards — conditions, works, powers (THR-1876 § D6, new shape). */
export interface CardsSection extends SectionBase {
  kind: 'cards';
  tiles: CardTile[];
}

export interface PortraitSection extends SectionBase {
  kind: 'portrait';
  /**
   * `url` absent → the section renders its prose with no frame (THR-2079). The
   * inspector's header already shows the subject through `EntityVisual`, so a
   * second, empty frame here is a broken state, not a fallback (UI Laws 3, 4).
   */
  portraitRef: { url?: string; subject: string; sphere: string };
  /** Prose body rendered alongside the portrait. */
  bodyProse?: string;
}

export interface TriggersSection extends SectionBase {
  kind: 'triggers';
  triggers: TriggerRow[];
}

/** The discriminated union the UI renders. */
export type Section =
  | ProseSection
  | ChipsSection
  | EventCardSection
  | PanelSection
  | PortraitSection
  | TriggersSection
  | LinksSection
  | CardsSection;

/**
 * Whether a section shows on a surface (THR-1876 § D6). The one filter every surface
 * uses — the hover card, the Inspector's three sizes and the lab — so "which width
 * shows this" is the registry row's `visibleAt` and nothing else.
 */
export function sectionVisibleAt(section: Pick<SectionBase, 'visibleAt'>, surface: PageSurface): boolean {
  return !section.visibleAt || section.visibleAt.includes(surface);
}

// ─── Full detail page payload ─────────────────────────────────────────────────

/** The full detail page payload the UI consumes. */
export interface DetailPage {
  kind: DetailPageKind;
  nodeId: string;
  /** Breadcrumb trail, last entry = current page. */
  trail: string[];
  /** Sentence-case kind label, e.g. "Actor" or "Item · in her possession". */
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
  /** Whether the "open the full sheet ↗" footer CTA is applicable. */
  hasFullSheet: boolean;
  /**
   * The address the footer CTA opens through the ref router (THR-1851). Set exactly when
   * `hasFullSheet` is; a page without one draws no button, so the CTA is never a dead
   * click (Law 25).
   */
  sheetRef?: AnyRef;
}
