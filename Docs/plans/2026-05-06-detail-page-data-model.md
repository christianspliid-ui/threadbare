# Detail Page Data Model — design (2026-05-06)

**Status:** Plan doc. Settles the contract that THR-301 Phase E child tickets implement against.

**Linear:** THR-319 (sibling of THR-317 phasing exploration and THR-318 content authoring epic)

**Inputs read for this design:**
- `Docs/plans/2026-05-04-encounter-ui-canonical.md` §5 (detail page pattern, modal stacking, section anatomy, prose discipline)
- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §2.5, §8 (THR-319 brief — referenced via THR-317 ticket body; doc itself pending flush-plan-docs commit)
- `Docs/plans/v7-design-pass/parts/moment3-detail.jsx` (visual + behavioural reference for all 5 detail page types and the stacking diagram)
- `src/engine/proseResolvers.ts` (existing graph-walking resolver architecture to extend, 17 resolvers across location/actor/faction)
- `src/engine/proseGenerator.ts` (resolver registry pattern, prose cache, public API)
- `src/types/prose.ts` (`ProseLayer`, `ProseResolver`, `ResolverRegistry`, `BackstoryStratumBlock` patterns to mirror)
- `Systems/Narrative Engine.md` (Routine / Notable / Chronicle three-tier canon)
- THR-319 ticket body (settled direction, Done-when checklist)
- Memory anchors: `feedback_prose_quality_bar` (Meeting-encounter prose is the floor); `project_long_prose_is_a_feature`

**Direction settled on THR-317 verdict (2026-05-05):** Hybrid pattern with componentized sections. Detail pages are stacks of typed `Section` blocks. Default resolver = graph-walking (extends existing `proseResolvers.ts`). Authored override gated by `node.showcase: true`. Some sections always graph-derived. Prose tier mapping per section type. Fallback templates exist for un-authored long-tail entities.

This plan turns that direction into an executable contract.

---

## 1. The shape of a detail page

A detail page is a **`DetailPage`**: a typed header plus an ordered array of **`Section`** blocks, scrolling vertically inside a `DetailModal` shell.

The shell (header + footer + breadcrumb + close affordances) is shared across all five page types. The body is a stack of sections. The number, order, and content of sections is determined by the page **type** (Actor / Item / Faction / Place / Event), the underlying graph node, and whether the node is `showcase`.

```
DetailModal shell
├─ Header (breadcrumb + ALLCAPS kind + Cinzel display name + sphere-coloured subtitle)
├─ Body (vertical stack of Section blocks, scrolls)
│  ├─ Section { kind: 'prose', label, gold, prose }
│  ├─ Section { kind: 'chips', label, chips: ChipDescriptor[] }
│  ├─ Section { kind: 'event-card', label, eventRef }
│  ├─ Section { kind: 'panel', label, body }
│  └─ ... (page-type-specific sections)
└─ Footer (ESC/← help text + "open her sheet ↗" CTA when applicable)
```

The `DetailPage` value is what the engine produces for the UI. The UI never queries the graph directly — it consumes a fully resolved `DetailPage` and renders it.

---

## 2. TypeScript schema

New types live in `src/types/detailPage.ts`. The shape:

```ts
import type { ProseLayer } from './prose';

/** Five detail page types, one per primitive kind. */
export type DetailPageKind = 'actor' | 'item' | 'faction' | 'place' | 'event';

/** Section type discriminator. UI dispatches on `kind`. */
export type SectionKind = 'prose' | 'chips' | 'event-card' | 'panel' | 'portrait';

/** Prose tier per Narrative Engine canon. */
export type ProseTier = 'routine' | 'notable' | 'chronicle';

/** A single chip rendered in a `chips` section. */
export interface ChipDescriptor {
  /** Short label, e.g., "authority taut". */
  label: string;
  /** Sphere or token-name controlling the chip's accent colour. */
  sphere?: string;
  /** Optional sentiment colouring (allied/opposed/neutral). */
  sentiment?: 'positive' | 'negative' | 'neutral';
  /** Optional italic descriptor under the label. */
  flavour?: string;
  /** Optional click target — opens another DetailModal. */
  clickRef?: NodeRef;
}

/** Reference to a graph node for click-to-open behaviour. */
export interface NodeRef {
  nodeId: string;
  /** The page type to open. Computed at resolve time so UI doesn't dispatch. */
  pageKind: DetailPageKind;
}

/** A single Section block. The discriminated union the UI renders. */
export type Section =
  | ProseSection
  | ChipsSection
  | EventCardSection
  | PanelSection
  | PortraitSection;

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
  /** Prose body rendered in a 2-column grid alongside the portrait. */
  bodyProse?: string;
}

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
```

**Notes on the shape:**
- `Section` is a discriminated union so the UI dispatches on `kind` without runtime introspection. Adding a new section kind requires touching the union (Engine pillar) AND the `Section` component switch (UI pillar) — that intentional friction prevents drive-by UI complexity.
- `ProseSection.termRefs` carries the keyword-tooltip wiring inline. The UI doesn't re-resolve at render time — it reads `termRefs[placeholder]` and opens the right detail modal on click.
- `tier` on every section means every render is traceable. Telemetry can ask "what fraction of sections rendered at Routine vs Notable?" without a separate trace stream.
- `isShowcase` lives on the page (not just per-section) so the UI can apply different default footer copy or affordances if useful later. Per-section showcase is implicit: if a section's `source` starts with `authored.`, it came from showcase prose; otherwise it's graph-derived.

---

## 3. Per-type detail page templates

Each `DetailPageKind` has a fixed **schema**: which sections it can have, in which order, which are mandatory, which are graph-derived only, which are authored-overridable. A page **template** is the schema instantiated against a specific node — sections that resolve empty are dropped.

The schema lives in `src/data/detailPageTemplates.ts` as a typed table. Adding/removing a section type per page requires editing this table.

### 3.1 Actor

| Order | Section typeId | Mandatory | Source | Showcase-overridable | Tier when graph-derived | Notes |
|---|---|---|---|---|---|---|
| 1 | `portrait_with_disposition` | yes | hybrid | yes (the portrait stays from graph) | routine | PortraitSection. Body prose = "DISPOSITION TOWARD HER" — gold label. The single most important thing about this actor. |
| 2 | `what_she_is_to_him` | optional | hybrid | yes | routine | ProseSection. Backstory link between this actor and the protagonist. |
| 3 | `threads_between_them` | optional | graph-only | no | n/a | ChipsSection. Active relationships from `relationship` node edges. |
| 4 | `recent_encounters` | optional | graph-only | no | routine→notable | EventCardSection. Most recent prose-impact event involving both actor and protagonist (`getAgentEncounterHistory`). Tier escalates if the event is callback-eligible for the current beat. |
| 5 | `faction_allegiances` | optional | graph-only | no | routine | ChipsSection. From `member_of` edges. |
| 6 | `notable_capabilities` | optional | graph-only | no | routine | ChipsSection. Tags the agent's strongest reaches above a threshold. |

**Mandatory minimum:** sections 1 + at least one of 4/5 (so the page is never just a portrait).

### 3.2 Item

| Order | Section typeId | Mandatory | Source | Showcase-overridable | Tier | Notes |
|---|---|---|---|---|---|---|
| 1 | `icon_with_meaning` | yes | hybrid | yes | routine | PortraitSection. Icon panel + "WHAT IT MEANS HERE" gold prose. |
| 2 | `who_gave_it` | optional | hybrid | yes | routine | ProseSection. Backstory of the item's arrival in the protagonist's hands. Falls back to graph data on `acquired_from` edge. |
| 3 | `how_it_tilts_this_scene` | optional | graph-only | no | routine→notable | ProseSection. How this item modifies leans in the active scene (computed against current encounter). Tier escalates to notable if the modifier is decisive (>0.3 sigmoid impact). |
| 4 | `previous_uses` | optional | graph-only | no | routine | ChipsSection. Past `used_in` event refs. |

**Mandatory minimum:** section 1 only.

### 3.3 Faction

| Order | Section typeId | Mandatory | Source | Showcase-overridable | Tier | Notes |
|---|---|---|---|---|---|---|
| 1 | `how_they_hold_her` | yes | hybrid | yes | routine | ProseSection. Gold label. Faction's current reputation toward the protagonist as a single sentence. |
| 2 | `allied_with` | optional | graph-only | no | n/a | ChipsSection. From faction `allied_with` edges. |
| 3 | `opposed` | optional | graph-only | no | n/a | ChipsSection. From faction `opposed_by` / inverse edges. |
| 4 | `reputations_they_hold` | optional | graph-only | no | n/a | PanelSection. Table of (target name, disposition phrase) for the faction's notable reputations. Includes the protagonist if listed. |
| 5 | `recent_actions` | optional | graph-only | no | routine→notable | EventCardSection. Most recent prose-impact event the faction is a participant in. |

**Mandatory minimum:** section 1 + section 4.

### 3.4 Place

| Order | Section typeId | Mandatory | Source | Showcase-overridable | Tier | Notes |
|---|---|---|---|---|---|---|
| 1 | `place_painting` | yes | hybrid | yes (via place painting registry) | n/a | PortraitSection variant — wide painting. Pulls from existing `PlacePainting` component. |
| 2 | `what_this_place_wants` | yes | hybrid | yes | routine | ProseSection. Gold label. The room's pull on this scene — biased reach, lighting, social pressure. |
| 3 | `conditions_here` | optional | graph-only | no | routine | ChipsSection or short prose. Active place conditions (choke-point, lanterns lit, etc). |
| 4 | `memory` | optional | hybrid | yes | routine→notable | ProseSection. Italic. The protagonist's memory of this place. Tier escalates if a callback-eligible event happened here. |

**Mandatory minimum:** sections 1 + 2.

### 3.5 Event

| Order | Section typeId | Mandatory | Source | Showcase-overridable | Tier | Notes |
|---|---|---|---|---|---|---|
| 1 | `what_happened` | yes | hybrid | yes (most events) | routine→notable→chronicle | ProseSection. Gold label. The narrative of this event. Tier driven by event's stored `proseTier` (default routine; tier-3 events are chronicle). |
| 2 | `who_was_there` | optional | graph-only | no | n/a | ChipsSection or panel. Participants list with thumbnail portraits + relationship-to-protagonist phrase. |
| 3 | `what_it_became` | optional | hybrid | yes | routine | ProseSection. Single-line trail of what came out of this event (vows, items, reputations, marks). |
| 4 | `how_it_invokes_now` | optional | graph-only | no | notable | PanelSection. Gold-bordered. Only present when this event is a callback for the current beat. The line that connects past to present. |

**Mandatory minimum:** section 1.

---

## 4. Resolver registry contract

The graph-walking pattern in `proseResolvers.ts` produces `ProseLayer[]` fragments. Detail page sections need a different signature — they produce **whole sections**, not layered fragments. A new resolver category handles this.

### 4.1 Resolver signatures

```ts
import type { Section, DetailPageKind, NodeRef } from '../types/detailPage';
import type { WorldGraph } from './graph';

/** Context shared across all section resolvers for a single detail page resolve. */
export interface SectionResolverContext {
  /** The node being detailed. */
  nodeId: string;
  /** Page type (so multi-purpose resolvers can branch). */
  pageKind: DetailPageKind;
  /** World graph. */
  graph: WorldGraph;
  /** Seeded PRNG seed for deterministic prose pick. */
  seed: number;
  /** Current tick for cache + tier escalation. */
  tick: number;
  /** Active encounter context, if any (drives "tilts this scene" / callbacks). */
  encounterContext?: {
    encounterId: string;
    beatIndex: number;
    protagonistId: string;
  };
  /** Protagonist's nodeId — drives all "to her" / "toward him" framings. */
  protagonistId: string;
}

/** A section resolver returns 0 or 1 section. Returning null = "skip this section". */
export type SectionResolver = (ctx: SectionResolverContext) => Section | null;

/** Per-page schema entry — one row per section in a page template. */
export interface SectionSchemaEntry {
  /** Section type id, matches Section.typeId. */
  typeId: string;
  /** Section ordering (lower = earlier). */
  order: number;
  /** True = page renders empty if this section returns null. */
  mandatory: boolean;
  /** Default resolver — graph-walks. Always present. */
  defaultResolver: SectionResolver;
  /** True = section is overridable by authored showcase prose. */
  showcaseOverridable: boolean;
  /** Optional fallback when defaultResolver returns null. */
  fallbackResolver?: SectionResolver;
}

/** Registry: page kind → ordered list of section schema entries. */
export type DetailPageRegistry = Record<DetailPageKind, SectionSchemaEntry[]>;
```

### 4.2 Resolution algorithm

The single entrypoint is `generateDetailPage(nodeId, pageKind, ctx) → DetailPage`:

1. Look up `node = graph.getNode(nodeId)`. If missing, return a stub `DetailPage` with the fail-soft "this entity is unknown" template (see §6).
2. Read `isShowcase = node.properties?.showcase === true`.
3. Look up the schema for `pageKind` from `DETAIL_PAGE_REGISTRY`.
4. For each `SectionSchemaEntry` in order:
   a. If `isShowcase && entry.showcaseOverridable`: try `authoredShowcaseResolver(entry.typeId, node)` → if it returns a Section, use it (mark `source: 'authored.{typeId}'`). Otherwise fall through.
   b. Call `entry.defaultResolver(ctx)`. If non-null, use it.
   c. If null and `entry.fallbackResolver` exists, call it.
   d. If still null and `entry.mandatory`, escalate: see §6 fail-soft.
   e. If still null and not mandatory, skip the section.
5. Compose header (`displayName`, `subtitle`, `sphere`, `kindLabel`) from node properties + a per-page header resolver.
6. Compute `trail` from caller-supplied breadcrumb + this entity's display name.
7. Set `hasFullSheet` based on per-page rule (Actor: only for protagonists/co-protagonists; Item: always; Faction/Place/Event: always).
8. Return the assembled `DetailPage`.

### 4.3 Reusing existing resolvers

A section resolver can call into existing `proseResolvers.ts` graph walks for primitive content. Example for `actor_what_she_is_to_him`:

```ts
const whatSheIsToHimResolver: SectionResolver = (ctx) => {
  const protagonistRel = findRelationshipNode(ctx.graph, ctx.protagonistId, ctx.nodeId);
  if (!protagonistRel) return null;
  const layers = [
    ...archetypeResolver(ctx.nodeId, ctx.graph, ctx.seed),
    ...dispositionResolver(ctx.nodeId, ctx.graph, ctx.seed + 1),
  ];
  if (layers.length === 0) return null;
  const prose = composeSectionProse(layers, { maxParagraphs: 2 });
  return {
    kind: 'prose',
    typeId: 'what_she_is_to_him',
    label: 'WHAT SHE IS TO HIM',
    gold: false,
    tier: 'routine',
    source: 'whatSheIsToHimResolver',
    prose,
    layers,
  };
};
```

`composeSectionProse` is a section-scoped variant of `composeProse` (already in `proseComposer.ts`). It takes max paragraphs, preserves the `<span class="term">` wrapping for placeholders, and returns the final string.

### 4.4 Showcase authoring contract

When `node.properties.showcase === true`, the engine looks up authored sections from `src/data/detail-page-showcase.ts` keyed by `nodeId` (or, for templated showcases, a `node.properties.showcaseTemplate` id).

```ts
export interface ShowcaseAuthoring {
  /** Per-typeId authored sections for this node. */
  sections: Partial<Record<string /* typeId */, AuthoredSection>>;
}

export interface AuthoredSection {
  /** Static prose for ProseSection. May include {placeholder} that runs through enrichProse. */
  prose?: string;
  /** Hand-authored chip set for ChipsSection. */
  chips?: ChipDescriptor[];
  /** Tier override; default 'notable' for authored sections. */
  tier?: ProseTier;
  /** Override the default label. */
  label?: string;
}

export const SHOWCASE_AUTHORING: Record<string /* nodeId or templateId */, ShowcaseAuthoring> = {
  /* authored entries land here from THR-318 content epic */
};
```

The authored prose runs through the existing `enrichProse()` placeholder resolver (`{name}`, `{artifact}`, `{ally}`, etc. — see Systemic Wiring Guide §1) before being written into `ProseSection.prose`. This guarantees authored prose dynamically picks up the protagonist's name, the encounter's antagonist, the captain's token, etc.

`node.showcase: true` is a **page-level flag**, but per-section showcase is supported via the schema's `showcaseOverridable` column. A node can be `showcase: true` and still graph-derive `RecentEncounters` because that schema row is `showcaseOverridable: false` — the truth about recent events lives in the event log, not in authored prose.

---

## 5. Prose tier mapping

Per Narrative Engine canon: Routine (template-stitched, fast), Notable (enhanced, escalations), Chronicle (LLM-generated, rare, literary).

### 5.1 Defaults per section schema

The schemas in §3 already record default tier per section. The summary:
- **Routine** is the default for all graph-derived sections.
- **Notable** triggers when section content is "loud": a callback-eligible event reference, a decisive item modifier, a cross-faction reputation shift bigger than the routine band.
- **Chronicle** triggers only when the source event has stored `proseTier: 'chronicle'` (set at event-creation time for tier-3 events: doom escalations, mandate milestones, legendary action resolutions).

### 5.2 Authored sections

Authored showcase sections default to **Notable** tier (since the act of authoring implies the entity is loud enough to bother). Authoring can override to `chronicle` for the protagonist's defining backstory beats; **never** to `routine` (authoring something that renders as routine is wasted effort — graph-derive it instead).

### 5.3 Escalation rules — explicit

```ts
function computeSectionTier(
  schemaEntry: SectionSchemaEntry,
  resolved: Section,
  ctx: SectionResolverContext,
): ProseTier {
  // Authored sections honour their authored tier.
  if (resolved.source.startsWith('authored.')) return resolved.tier;

  // Event-card sections inherit from the referenced event.
  if (resolved.kind === 'event-card') {
    const eventNode = ctx.graph.getNode(resolved.eventRef.nodeId);
    const stored = (eventNode?.properties?.proseTier as ProseTier | undefined) ?? 'routine';
    if (stored === 'chronicle') return 'chronicle';
    if (isCallbackEligibleNow(eventNode, ctx)) return 'notable';
    return 'routine';
  }

  // Item "tilts this scene" escalates to notable when the modifier is decisive.
  if (schemaEntry.typeId === 'how_it_tilts_this_scene') {
    if ((resolved as ProseSection).prose.includes('decisive')) return 'notable';
    // Better: pass the modifier strength into the resolver and check it here.
  }

  return 'routine';
}
```

The constants for "decisive modifier", "callback eligibility window", etc. live in §10 and are tunable.

### 5.4 What the tier does at render time

- **Routine** → renders the prose as-is, no decoration.
- **Notable** → adds a thin gold underline to the section label; otherwise unchanged. (No new keyframe; reuse existing label hover state.)
- **Chronicle** → adds the gold underline AND a faint `pulseGoldFlare` ring on the section panel border on first reveal (one shot, then settled). For backwards compatibility with existing `pulseGoldFlare` reuse rules in the encounter UI canonical doc §6.2, this animation fires only on first open of the modal, not on stack-restore.

The tier is also read by debug telemetry ("section tier histogram") and by the eventual prose quality eval skill (`prose-content-systems`) so authors can see what their notable/chronicle ratio looks like in practice.

---

## 6. Fallback templates

The 5 detail page types must render **something** for any node of the right kind, even if the entity has no showcase prose, no recent encounters, no relationships, no faction membership. The fallback policy is graceful, not hidden.

### 6.1 Per-page fallback strategy

For each page kind, the **mandatory minimum** in §3 is the fallback floor. The fallback resolvers fill those mandatory sections from the most basic graph data available:

| Page | Mandatory floor | Fallback content |
|---|---|---|
| Actor | portrait + (recent_encounters OR faction_allegiances) | Portrait from agent thumbnail. Disposition prose: "you have not crossed paths" if no recent encounters AND no relationship. |
| Item | icon_with_meaning | Icon from item's iconRef. "What it means here" defaults to a single sentence built from item category + sphere alignment. |
| Faction | how_they_hold_her + reputations_they_hold | "They have not yet noticed her" if no reputation toward protagonist. Reputation table always rendered, even if empty (with a single-row "no reputations recorded" entry). |
| Place | place_painting + what_this_place_wants | Painting from place's existing painting registry. "What this place wants" defaults to a sphere-influence-derived single sentence. |
| Event | what_happened | If no authored prose AND the event has structured data only (participants, location, sphere): a one-sentence template stitched from those fields. |

### 6.2 The fail-soft template registry

Lives in `src/data/detail-page-fallback-templates.ts`:

```ts
export const FALLBACK_TEMPLATES = {
  actor: {
    disposition_no_history: ['{Name} has not yet crossed paths with you.', '{Name} does not know your face — yet.'],
    disposition_known_no_recent: ['{Name} remembers your name and little else.'],
  },
  item: {
    meaning_basic: ['A {category} of {sphere}. It does not yet speak.', '{Name}. Mundane to anyone who does not look closely.'],
  },
  faction: {
    no_reputation: ['They have not yet noticed her.', 'No name yet, no quarrel.'],
  },
  place: {
    wants_basic: ['The room leans toward {sphere}.'],
  },
  event: {
    skeletal: ['{Date}, at {place}. {Participants} were present.'],
  },
};
```

Each template runs through `enrichProse()` so `{Name}`, `{sphere}`, `{place}`, etc. are dynamically replaced.

### 6.3 The unknown-entity stub

If the node itself is missing or its `type` doesn't match the requested `pageKind`, the engine returns a stub `DetailPage`:

```ts
{
  kind: pageKind,
  nodeId,
  trail: ['ENCOUNTER', 'UNKNOWN'],
  kindLabel: pageKind.toUpperCase(),
  displayName: 'Unknown',
  subtitle: 'this entity is no longer in the world',
  sphere: 'time',
  isShowcase: false,
  sections: [{
    kind: 'prose',
    typeId: 'unknown_stub',
    label: 'WHAT WE KNOW',
    gold: false,
    tier: 'routine',
    source: 'unknownStubResolver',
    prose: 'This entity is no longer reachable. The thread that named it has slackened.',
  }],
  hasFullSheet: false,
}
```

This guarantees the modal opens — never throws, never blanks — even for stale event references after a save/load round-trip.

---

## 7. Integration with existing prose pipeline

### 7.1 What this design adds

| Thing | New or extends | File |
|---|---|---|
| `DetailPage` types + schemas | new | `src/types/detailPage.ts` |
| Section resolvers | new file, mirrors existing pattern | `src/engine/detailPageResolvers.ts` |
| Detail page registry | new | `src/data/detailPageTemplates.ts` |
| Showcase authoring data | new | `src/data/detail-page-showcase.ts` (populated by THR-318) |
| Fallback templates | new | `src/data/detail-page-fallback-templates.ts` |
| `generateDetailPage()` entry point | new | `src/engine/detailPageGenerator.ts` |
| Section composer | new (thin wrapper over `composeProse`) | `src/engine/detailPageGenerator.ts` |
| Prose cache for detail pages | new (parallel to `_proseCache`) | `src/engine/detailPageGenerator.ts` |

### 7.2 What this design reuses

- `proseResolvers.ts` resolvers — section resolvers call them for layered fragments.
- `composeProse` / `composeSummary` from `proseComposer.ts` — used inside section composers.
- `enrichProse()` — runs over authored prose for placeholder replacement (see Systemic Wiring Guide §1).
- `getLocationEncounterHistory` / `getAgentEncounterHistory` from `encounterEventNode.ts` — drives `recent_encounters` and `recent_actions` sections.
- `BackstoryStratumBlock` typing pattern — `Section` is its conceptual sibling.
- `mulberry32` PRNG seeding — every section resolver derives its seed from `(nodeId hash + tick + sectionTypeId hash)` to keep variant pick deterministic across resolves while allowing variation between sections of the same page.
- `PlacePainting` component — referenced in `place_painting` PortraitSection.
- `DetailModal` (extends existing `Modal` shell — see UI pillar below).

### 7.3 What this design does NOT change

- The existing `generateEntityProse()` API for hover tooltips and panel summaries — unchanged. Detail pages are a **new** consumer; existing consumers keep working.
- The existing `proseResolvers.ts` resolver list — no edits to existing resolvers, only additions.
- The existing prose cache — `_proseCache` and `_lastCachedTick` keep their semantics. The detail page cache is a parallel structure with the same eviction discipline.

### 7.4 Relationship to `enrichProse()`

`enrichProse()` (the placeholder resolver — Systemic Wiring Guide §1) runs at the end of the section composition pipeline, after all resolvers and tier escalation. Order:

1. Resolver returns `Section` with prose containing literal `{name}`, `{artifact}`, etc.
2. `composeSectionProse` joins layers if needed.
3. `enrichProse(text, ctx)` resolves placeholders against the encounter context.
4. Final string is written to `ProseSection.prose`.
5. `termRefs` is populated by parsing `<span class="term">…</span>` markers and resolving each term to a `NodeRef`.

Authored showcase prose runs through the same pipeline — authors write `{name}` and the engine fills it.

---

## 8. UI pillar — the Section component

The UI side gets a single `<Section>` primitive that switches on `Section.kind` and renders the right inner shape.

### 8.1 Components to build

| Component | Purpose | Source ref |
|---|---|---|
| `DetailModal` | Modal shell with breadcrumb + header + body + footer. Extends `shared/Modal.tsx`. | `parts/moment3-detail.jsx` `ModalShell` |
| `Section` | Discriminated-union dispatcher — picks ProseSection / ChipsSection / EventCardSection / PanelSection / PortraitSection sub-renderer. | `parts/moment3-detail.jsx` `Section` |
| `SectionLabel` | ALLCAPS Cinzel label, gold or tertiary, with notable/chronicle decoration. | new |
| `Chip` | Single chip with sphere-coloured border + optional click-through. | `parts/moment3-detail.jsx` chip pattern |
| `EventCard` | Italic prose panel with `47 TURNS AGO · …` header. | `parts/moment3-detail.jsx` event card pattern |
| `DetailFooter` | "ESC closes · ← steps back" + "open her sheet ↗" CTA. | `parts/moment3-detail.jsx` footer |
| `DetailBreadcrumb` | Trail with collapsing `…` at depth 4+. | `parts/moment3-detail.jsx` `Crumbs` |

### 8.2 Modal stacking

Per Encounter UI canonical §5.3:
- Each modal tints the layer beneath by 28% black.
- Up to 4 deep.
- Beyond depth 4, breadcrumb collapses into `…`.
- ESC closes topmost; ← walks one level back.
- Encounter underneath paused; ambient ducks 6dB; beat indicator dims to 50%.

The stacking state lives in a `DetailModalStack` context near the top of the encounter shell. `useDetailStack()` hook gives child components `push(detailPage)`, `pop()`, `replace(detailPage)`, and the active stack.

### 8.3 Click-through wiring

Each `Section` that contains `<span class="term">…</span>` markup parses the span markers at render time and wraps them in click handlers. Click → look up `termRefs[placeholder]` → `pushDetail({ nodeId, pageKind })`.

For chips, faction allegiance rows, and event cards, `clickRef` is on the descriptor; the renderer wires the click directly.

### 8.4 Data fetching

The UI calls `generateDetailPage(nodeId, pageKind, ctx)` synchronously when the modal opens. The function is pure + cached, so opens are instant after the first call. There is no async loading state — if the engine can't produce a `DetailPage`, it returns the unknown-entity stub (§6.3) and the modal renders that.

### 8.5 TTS

Per canonical §5.5: a TTS button per detail page reads the body aloud in Kokomoro voice. The button assembles the script by walking the resolved `Section[]` and concatenating prose fields with section labels as headers — the existing TTS service consumes plain text. TTS integration point will be specified by the THR-317 sound/TTS decision (item c).

---

## 9. Three-pillar coverage

### 9.1 Engine pillar

- **New types:** `src/types/detailPage.ts` — `DetailPage`, `Section` discriminated union, `SectionResolver`, `DetailPageRegistry`, `ChipDescriptor`, `NodeRef`, etc.
- **New resolver module:** `src/engine/detailPageResolvers.ts` — one section resolver per `(pageKind, typeId)` row in §3. ~30 resolvers total.
- **New registry data:** `src/data/detailPageTemplates.ts` — wires schemas to resolvers.
- **New entry point:** `src/engine/detailPageGenerator.ts` — `generateDetailPage(nodeId, pageKind, ctx) → DetailPage`. Includes per-page header resolution, fallback escalation, prose cache, fail-soft stub.
- **Graph reads only:** no graph mutations. Detail page generation is a pure read of the graph + encounter context. Safe to call from React render path.
- **Determinism:** all PRNG seeded as `(world seed XOR nodeId hash XOR sectionTypeId hash XOR tick)`.
- **Tracing:** new trace category `detail_page_generation` — see §11.
- **Caching:** parallel cache to `_proseCache`, keyed by `(nodeId, pageKind, tick)`. Same auto-evict-on-tick-advance discipline.

### 9.2 Content pillar

- **Authoring contract:** `src/data/detail-page-showcase.ts` is the destination for THR-318's authored prose. The shape (`ShowcaseAuthoring`, `AuthoredSection`) is fixed by this plan; the content lives downstream.
- **Reference examples:** `parts/moment3-detail.jsx` is the **floor for craft**, per canonical §5.5. THR-318 produces 1–2 authored examples per page kind in this voice.
- **Fallback templates:** `src/data/detail-page-fallback-templates.ts` — templated single-line prose for sparse-graph long-tail entities. ~5 templates per page kind, total ~25 templates. Authored as part of this design's implementation, not THR-318.
- **Showcase flag plumbing:** worldgen and content authors set `node.properties.showcase = true` on entities they've written authored sections for. THR-318 is responsible for keeping flag-and-content in sync.

### 9.3 UI pillar

- **New components:** see §8.1 — `DetailModal`, `Section` dispatcher + 5 section sub-renderers, `Chip`, `EventCard`, `DetailFooter`, `DetailBreadcrumb`.
- **New context:** `DetailModalStack` — manages the up-to-4 stack with breadcrumb collapse.
- **Animation:** stack push uses existing `fadeSlideUpIn`. Tier escalation decoration uses existing `pulseGoldFlare` (one-shot, first open only).
- **Player controls:** ESC closes topmost; ← walks back; clicking a `term` / chip / event card pushes another modal.
- **Debug visibility:** Debug Panel gets a "Detail Page" tab that lets the dev key in a nodeId + pageKind and inspect the resolved `DetailPage` JSON. Drives content authoring iteration. Wired through `__DEBUG.openDetailPage(nodeId, pageKind)`.
- **Visible presence on hex map:** none — detail pages are modal-only.

### 9.4 Wiring section — per the wiring checklist

| Concern | Implementation |
|---|---|
| Orchestrator phase | None. Detail pages are pull, not push. |
| GameState field | None. The active stack lives in React state, not gameState. |
| UI component | `DetailModal` rendered inside `EncounterShell`. The stack context wraps the encounter. |
| Traces | `detail_page_generation` (per §11). |
| Debug visibility | `DebugPanel` "Detail Page" tab + `__DEBUG.openDetailPage()`. |
| Prose pipeline | `enrichProse()` runs on authored sections. Existing `composeProse` reused inside section composers. |
| Player controls | ESC, ←, click-through on terms / chips / event cards. |
| Wiring checklist update | `Docs/plans/wiring-checklist.md` gets a new "Detail Pages" entry covering the section resolver registry, section schema table, fallback templates, and the new debug bridge methods. Update is part of THR-301 Phase E1 implementation. |

---

## 10. Constants table (NFP #1)

Every magic number named, defaulted, and documented.

| Constant | Default | Purpose | Where |
|---|---|---|---|
| `MAX_DETAIL_STACK_DEPTH` | 4 | Max nested DetailModal depth before breadcrumb collapses to `…`. | `src/types/detailPage.ts` |
| `DETAIL_BREADCRUMB_COLLAPSE_AT` | 4 | Stack depth at which breadcrumb starts collapsing. Same as MAX for now; split if we ever want collapse before max. | `src/types/detailPage.ts` |
| `DETAIL_DIM_BENEATH_PCT` | 0.28 | How dark the layer beneath each modal becomes. | `src/types/detailPage.ts` |
| `DETAIL_AMBIENT_DUCK_DB` | -6 | Audio duck applied when any detail modal is open. | `src/types/detailPage.ts` |
| `DETAIL_BEAT_INDICATOR_OPACITY_PAUSED` | 0.5 | Beat indicator opacity while detail modal open. | `src/types/detailPage.ts` |
| `DETAIL_DEFAULT_W` / `DETAIL_DEFAULT_H` | 720 / 620 | Default modal size in px. | `src/types/detailPage.ts` |
| `DETAIL_PLACE_W` / `DETAIL_PLACE_H` | 800 / 720 | Place detail size — accommodates painting. | `src/types/detailPage.ts` |
| `DETAIL_PROSE_CACHE_TTL_TICKS` | 1 | Detail page cache lifetime (auto-evicts on tick advance). | `src/engine/detailPageGenerator.ts` |
| `DETAIL_NOTABLE_CALLBACK_WINDOW_TICKS` | 12 | A past event becomes callback-eligible for tier escalation if within this many ticks. | `src/data/detailPageTemplates.ts` |
| `DETAIL_NOTABLE_DECISIVE_THRESHOLD` | 0.3 | Sigmoid-impact magnitude that promotes "tilts this scene" prose to notable. | `src/data/detailPageTemplates.ts` |
| `DETAIL_FALLBACK_PROSE_VARIANTS` | 5 | Number of fallback templates authored per (pageKind, sectionTypeId). | `src/data/detail-page-fallback-templates.ts` |
| `DETAIL_AUTHORED_DEFAULT_TIER` | `'notable'` | Default prose tier for authored showcase sections. | `src/types/detailPage.ts` |
| `DETAIL_FAILSOFT_STUB_SPHERE` | `'time'` | Sphere accent on the unknown-entity stub. | `src/engine/detailPageGenerator.ts` |

---

## 11. Tracing (NFP #2)

New trace category `detail_page_generation`. One trace per `generateDetailPage` call. TS interface:

```ts
export interface DetailPageGenerationTrace {
  category: 'detail_page_generation';
  nodeId: string;
  pageKind: DetailPageKind;
  tick: number;
  isShowcase: boolean;
  isCacheHit: boolean;
  failsoftStub: boolean;
  sections: Array<{
    typeId: string;
    source: string; // resolver name or 'authored.{typeId}' or 'fallback.{typeId}'
    tier: ProseTier;
    rendered: boolean; // false = resolver returned null, section dropped
  }>;
  durationMs: number;
}
```

Section-level resolver decisions are visible in this single trace, so the Debug Panel can show "for this Captain Veiren detail page open: 3 graph-derived sections at routine, 1 callback escalated to notable, 1 authored at notable, 1 fallback for missing recent encounters."

Click-through events fire a separate trace category `detail_page_navigation` capturing `(fromNodeId, fromKind, toNodeId, toKind, depth)` so the eventual interface playtest skill can audit how often players actually drill in.

---

## 12. Fail-soft table (NFP #4)

| Failure | Fallback |
|---|---|
| `nodeId` not in graph | Return unknown-entity stub (§6.3). Modal opens with "this entity is no longer reachable." |
| Node exists but `type` mismatches `pageKind` | Same unknown-entity stub; trace warns once per tick. |
| `node.showcase: true` but no `SHOWCASE_AUTHORING[nodeId]` entry | Treat as `showcase: false` for resolution; trace warns once per nodeId per session. Page renders graph-derived. |
| Mandatory section's defaultResolver returns null AND no fallbackResolver | Run the per-page fallback template (§6.1). If still null, emit the section with a `prose: '…'` ellipsis and `tier: 'routine'`; flag in trace. Page never blank. |
| `enrichProse()` fails on a placeholder | Existing `enrichProse()` fail-soft applies — leaves the literal `{placeholder}` string visible. Trace records the failure. |
| Missing icon, portrait, painting | PortraitSection renders with existing placeholder-art fallback (already in use elsewhere). |
| Click-through `NodeRef.nodeId` no longer resolves | Modal opens with unknown-entity stub. Breadcrumb still works. |
| Cache returns stale value across save/load | Cache is module-scoped to the current `SimulationRuntime` (per Load-Bearing Decisions). Save/load instantiates a new runtime; stale cache impossible. |
| Stack pushes a 5th modal | Renders normally; breadcrumb collapse hides depth 1. ESC still walks the stack one at a time. |

---

## 13. Vision audit

Walked `Vision/00-north-star.md`, `01-core-loop.md`, `02-non-negotiables.md`, `03-design-tensions.md`, `taste-profile.md` against this plan.

- **No premise contradictions.** Detail pages are a click-through pattern that lives inside the encounter; they preserve the turn-based, no-time-passes invariant (§5.3 of canonical, restated here).
- **`project_long_prose_is_a_feature` honoured.** Detail pages are explicitly where lore lives; long prose is intended.
- **Three-tier prose canon honoured.** Section tiers map directly to Routine / Notable / Chronicle without redefining them. The 5.4 "what tier does at render time" treatment is additive — it doesn't change what each tier *is*, only how the detail page surface flags it visually.
- **Taste profile §"Three intervention verbs" softened in THR-301 §17.** This plan assumes that softening is in place and uses Hand cards as a filter surface, never as a fixed verb roster. No further Vision edits needed for THR-319.
- **Showcase flag is a content-authoring tool, not a Vision premise.** It does not appear in any Vision doc. No Vision edit required.

No Vision doc edits ride along with this ticket. If THR-318's authored examples surface a Vision-level question (e.g. "showcase nodes get more screen presence — does that contradict the egalitarian world principle?"), that's escalated as a `UL-proposal` or Vision edit then, not now.

---

## 14. NFP compliance summary

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Constants table §10 covers every magic number including stack depth, dim percentages, audio duck, callback window, notable thresholds. |
| 2. Inspectability | PASS | New `detail_page_generation` and `detail_page_navigation` trace categories §11; per-section source + tier visible in trace. Debug Panel "Detail Page" tab + `__DEBUG.openDetailPage()`. |
| 3. Determinism | PASS | All PRNG seeded; section resolvers derive their seed from `(world seed XOR nodeId XOR sectionTypeId XOR tick)`. Cache deterministic. |
| 4. Fail-soft | PASS | Fail-soft table §12 covers every failure mode. Modal never throws, never blanks. |
| 5. Narrative over mechanical perfection | PASS | The detail page surface explicitly serves story (long prose, callback panels, "open her sheet" affordance). Mechanical signals (sigmoid impact for "decisive") drive tier escalation but the prose is what the player reads. |
| 6. Additive over destructive | PASS | New types, new resolver module, new data files, new components. Existing `proseResolvers.ts`, `proseGenerator.ts`, `proseComposer.ts`, `Modal.tsx`, `enrichProse()` are reused unchanged. |
| 7. Performance budget | PASS | Pure-read generation + per-tick cache means modal opens are O(sections × resolvers) on first call, O(1) on subsequent same-tick opens. No budget hot path. The 4-deep stack uses CSS opacity/filter for dimming (per canonical §6.5), not re-rendered React subtrees. |

---

## 15. Done when

- [x] Plan doc written at `Docs/plans/2026-05-06-detail-page-data-model.md`.
- [ ] `plan-pending-commit` label applied to THR-319.
- [x] Section schema enumerated for all 5 detail page types (§3.1–3.5).
- [x] Resolver registry contract specified with TS interfaces (§4).
- [x] Showcase-flag pattern specified end-to-end — graph mutation `node.properties.showcase: true` → resolver dispatch via `showcaseOverridable` schema column → authored prose lookup keyed by nodeId or showcaseTemplate → enrichProse → final ProseSection (§4.4).
- [x] Prose tier mapping specified per section (§3 + §5).
- [x] NFP audit complete (§14).
- [x] Vision audit pass (§13).
- [ ] THR-319 moved to its terminal state with handoff comment pointing here.
- [ ] Phase E child tickets in THR-301 unblocked — they reference this plan as the contract for the detail page implementation work.

---

## 16. Out of scope

- **The implementation itself.** Phase E1 (DetailModal shell + section dispatcher + the registry) and Phase E2 (resolver authoring + fallback template authoring) are separate executor tickets in THR-301.
- **Authored detail page content.** That is THR-318. This plan defines the contract THR-318 writes against; it does not write the content.
- **Modal stacking implementation.** Already specified in canonical §5.3; this plan only restates the stacking constants in §10.
- **TTS endpoint shape.** Specified in `Docs/plans/2026-05-05-tts-encounter-ui-spec.md` (already on disk). This plan only references the surface — "TTS button per detail page reads the body aloud."
- **Hover tooltip prose.** Existing `generateEntityProse()` API serves hover tooltips for the encounter prose body. This plan only handles the click-through detail page.
- **Save/load mid-encounter.** Detail page cache is per-runtime, so save/load works correctly. The mid-encounter save/load surface itself is post-v1 polish (THR-301 §11 deferred items).

---

## 17. Open questions / contested decisions

None left unresolved. The direction-settled inputs (THR-317 verdict on hybrid pattern + showcase flag + per-type templates + tier mapping) plus the canonical UI spec leave no contested decisions for this plan to escalate.

If THR-318 surfaces a content-authoring friction with the schema (e.g., "I need a section type that's not in §3"), that's a new ticket — not a rework of this contract.

---

## 18. Handoff

This plan is the contract. THR-301 Phase E child tickets reference it. Implementation order:

1. **E1a — types + registry skeleton.** `src/types/detailPage.ts`, `src/data/detailPageTemplates.ts` (schema rows with placeholder resolvers), `src/engine/detailPageGenerator.ts` (entry point + cache + fail-soft stub). No real resolvers yet; everything returns null and the unknown-entity stub renders. **Codex-friendly** (mechanical scaffolding).
2. **E1b — DetailModal + Section component.** UI shell, stack context, breadcrumb. Renders a stub `DetailPage` correctly. **CC-friendly** (judgment on layout + animation polish).
3. **E2a — section resolvers, page kind 1 (Actor).** Wire all Actor section resolvers. Includes fallback template authoring for Actor's mandatory floor.
4. **E2b–E2e — Item, Faction, Place, Event resolvers + fallbacks.** Parallel-safe with each other once Actor lands.
5. **E2f — showcase authoring data load + `enrichProse()` integration.** Hook for THR-318 content to land.
6. **E3 — debug bridge + trace integration.** `__DEBUG.openDetailPage()`, `detail_page_generation` traces, Debug Panel tab.

Phase E1 is the gate for THR-318 to start authoring against a real surface. Phase E2 is the gate for the encounter UI to render production-quality detail pages.
