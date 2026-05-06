---
status: current
title: Detail Page Data Model
date: 2026-05-05
linear: THR-319
parent_design: 2026-05-04-encounter-experience-design-plan.md
parent_phasing: 2026-05-05-encounter-ui-implementation-phasing.md
canonical_ui_spec: 2026-05-04-encounter-ui-canonical.md
---

# Detail Page Data Model — Design (2026-05-05)

**Status:** Design plan for the detail page data model. Output of THR-319. Phase E in the encounter UI implementation phasing (THR-337 + THR-338) executes against this plan.

**Audience:** Phase E executors (CC) implementing `DetailModal` shell + 5 typed detail page instances. Content authors writing showcase prose for canonical entities. Future detail page additions outside the encounter UI.

**Inputs (read first):**
- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §2.5 (the verdicted direction: hybrid graph-walking + showcase override, componentized sections)
- `Docs/plans/2026-05-04-encounter-ui-canonical.md` §5 (detail page pattern; 5 typed instances; modal stacking)
- `Docs/plans/v7-design-pass/parts/moment3-detail.jsx` (5 reference mockups; section anatomy per type)
- `src/engine/proseResolvers.ts` (existing graph-walking resolver pattern; extend, don't replace)
- `src/data/prose-layer-content.ts` (existing template tables; reused by section resolvers)
- `Systems/Narrative Engine.md` (Routine / Notable / Chronicle three-tier prose canon)

**Memory:**
- `feedback_prose_quality_bar` — meeting-encounter prose is the floor for craft
- `project_long_prose_is_a_feature` — long prose is intentional; supports readers + Kokomoro TTS audience

---

## 1. Premise

Per Rule 4 of the encounter design (long-form plan §1.4): every primitive in the encounter UI is clickable; every node has a detail page. Five typed detail page instances exist (Actor, Item, Faction, Place, Event) and they all live inside a stack-aware `DetailModal` shell that supports up to depth 4 with breadcrumb collapse.

The question this plan answers: **where does the prose come from?**

Pure authoring is impossible at the scale of a generated world (thousands of agents, hundreds of items, dozens of factions per playthrough). Pure generation risks failing the meeting-encounter prose quality bar for showcase entities (Eira, The First, named NPCs whose biographies the player invests in).

The verdict (THR-317): **hybrid graph-walking with authored overrides, componentized into typed `Section` blocks.** This plan specifies the contract.

---

## 2. The shape of a detail page

A detail page is a `DetailModal` rendering a typed list of `Section` blocks for a single graph node. The blocks render top-to-bottom inside the scrollable modal body. The first block is gold-coloured (primary); subsequent blocks use default tertiary label coloring.

Each section is independently resolved. A section may produce no content (resolver returns null) and is omitted from the render — the detail page is shorter, not broken. Long prose is intentional and supported (per `project_long_prose_is_a_feature` memory) — the modal body scrolls.

**Each detail page type has a canonical section list** (§5). The list is fixed per type. Authors do not invent new section IDs — they author content for the existing section IDs of showcase entities. The section list itself only grows via this plan being amended.

---

## 3. Section schema

### 3.1 The `Section` interface

```typescript
interface Section {
  id: SectionId;                      // canonical ID, e.g. 'disposition-toward-protagonist'
  label: string;                      // ALLCAPS Cinzel label, e.g. "DISPOSITION TOWARD HER"
  primary: boolean;                   // true for gold-coloured primary section (one per type)
  body: SectionBody;                  // typed union of body shapes
  proseTier: ProseTier;               // 'routine' | 'notable' | 'chronicle'
  source: 'graph' | 'showcase' | 'fallback';   // where this body came from at runtime
}

type ProseTier = 'routine' | 'notable' | 'chronicle';
```

The `source` field is set at runtime by the resolver dispatch (§4) and is exposed for tracing and debug visibility — content authors and engine inspectors can see whether a given render came from the graph-walking default, an authored showcase override, or the fallback template.

### 3.2 The `SectionBody` typed union

The body shape varies per section. The five body kinds cover all five detail page types:

```typescript
type SectionBody =
  | ProseBody
  | ChipRowBody
  | EventCardBody
  | ReputationListBody
  | AlliedOpposedBody
  | PlacePaintingBody
  | WitnessListBody;

interface ProseBody {
  kind: 'prose';
  text: string;                       // may include <span class="term"> markup for keyword links
  italicLead?: boolean;               // first sentence renders italic (per v7 mockup pattern)
  paragraphs?: string[];              // optional multi-paragraph; if absent, text is one paragraph
}

interface ChipRowBody {
  kind: 'chip-row';
  chips: Chip[];
}

interface Chip {
  text: string;                       // chip label, e.g. "authority taut"
  sphere?: SphereId;                  // sphere coloring (force-red, spirit-violet, etc.)
  accent?: 'gold';                    // gold-tinted chip for protagonist-relationship marker
}

interface EventCardBody {
  kind: 'event-card';
  whenLabel: string;                  // "47 TURNS AGO · THE IRON MARKET"
  quote: string;                      // italic prose, single paragraph
  eventNodeId?: NodeId;               // click target — opens EventDetail for this event
}

interface ReputationListBody {
  kind: 'reputation-list';
  entries: ReputationEntry[];
}

interface ReputationEntry {
  name: string;                       // person/faction name
  toneWord: string;                   // qualitative descriptor; never numeric
  nodeId?: NodeId;                    // click target — opens that entity's detail page
}

interface AlliedOpposedBody {
  kind: 'allied-opposed';
  allied: AllegianceCard[];
  opposed: AllegianceCard[];
}

interface AllegianceCard {
  name: string;
  flavor: string;                     // sub-prose, italic small font
  factionNodeId?: NodeId;             // click target — opens FactionDetail
}

interface PlacePaintingBody {
  kind: 'place-painting';
  imageRef: string;                   // path or generated prompt key
  caption?: string;                   // optional sub-line
}

interface WitnessListBody {
  kind: 'witness-list';
  witnesses: Witness[];
}

interface Witness {
  actorNodeId: NodeId;
  role: string;                       // "witness · his honour now hers"
}
```

### 3.3 Section IDs (canonical enumeration)

Per detail page type. New IDs require a plan amendment.

| Detail page type | Section IDs (in render order) |
|---|---|
| **Actor** | `disposition-toward-protagonist` (primary), `backstory-to-protagonist`, `threads-between`, `last-thread-pull` |
| **Item** | `what-it-means-here` (primary), `provenance`, `how-it-tilts-scene` |
| **Faction** | `how-they-hold-protagonist` (primary), `alliances`, `reputations-held` |
| **Place** | `place-painting` (visual; no prose), `what-this-place-wants` (primary), `conditions-here`, `place-memory` |
| **Event** | `what-happened` (primary), `who-was-there`, `what-it-became`, `how-it-invokes-now` |

`place-painting` is an unusual section — it has no resolver in the prose sense; it returns a `PlacePaintingBody` referencing the place's image. It exists in the section list for ordering but skips the showcase/fallback resolution path.

---

## 4. Resolver registry contract

### 4.1 The resolver function signature

```typescript
type SectionResolver = (
  nodeId: NodeId,
  graph: WorldGraph,
  sceneContext: SceneContext,
  seed: number,
) => SectionBody | null;

interface SceneContext {
  protagonistId: NodeId;              // current encounter's protagonist (for "to her" framing)
  encounterId?: string;
  currentBeatId?: string;
  currentTick: number;
  // ...other scene-derived context as needed
}
```

The resolver:
- Returns `null` when no content can be derived (fail-soft).
- Is deterministic: same `(nodeId, graph state, seed)` → same output.
- Reads from the graph + scene context only. Never mutates graph state.
- May call existing prose-layer resolvers (`archetypeResolver`, `dispositionResolver`, etc.) as building blocks — see §8.

### 4.2 The registry

```typescript
interface DetailPageTypeConfig {
  nodeType: 'actor' | 'item' | 'faction' | 'place' | 'event';
  sections: SectionConfig[];
}

interface SectionConfig {
  id: SectionId;
  label: string;                      // ALLCAPS display label
  primary: boolean;
  proseTier: ProseTier;
  graphResolver: SectionResolver;     // graph-walking default (always present)
  showcaseResolver?: ShowcaseResolver; // optional authored override path
  fallbackTemplate?: FallbackTemplate; // optional last-resort
}

type ShowcaseResolver = (
  nodeId: NodeId,
  graph: WorldGraph,
  sceneContext: SceneContext,
) => SectionBody | null;

interface FallbackTemplate {
  body: SectionBody;                  // pre-built body with placeholders
  placeholders: string[];             // e.g. ['{name}', '{archetype}', '{culture}']
}
```

Registry surface:

```typescript
// src/data/detail-page-registry.ts
export const DETAIL_PAGE_REGISTRY: Record<DetailPageType, DetailPageTypeConfig> = {
  actor: { /* ... */ },
  item: { /* ... */ },
  faction: { /* ... */ },
  place: { /* ... */ },
  event: { /* ... */ },
};
```

### 4.3 Resolution dispatch

When `<DetailModal>` opens for `nodeId` of type `actor`:

```
For each SectionConfig in DETAIL_PAGE_REGISTRY.actor.sections:
  1. If node.properties.showcase === true AND showcaseResolver exists:
       body = showcaseResolver(nodeId, graph, sceneContext)
       if body: source = 'showcase', return Section
  2. body = graphResolver(nodeId, graph, sceneContext, seed)
     if body: source = 'graph', return Section
  3. If fallbackTemplate exists:
       body = applyTemplate(fallbackTemplate, node)
       source = 'fallback', return Section
  4. Otherwise: omit section from the render
```

The Section list passed to the renderer contains only resolved sections. Empty sections are filtered before the modal body renders. This means a long-tail entity with sparse graph data may render only 1–2 sections out of 4 — and that is fine.

### 4.4 Per-section showcase override

Showcase is per-section, not all-or-nothing. An entity flagged `showcase: true` may have authored prose for `disposition-toward-protagonist` and `backstory-to-protagonist` but rely on the graph resolver for `threads-between` (which is graph-derived from `relates_to` edges) and `last-thread-pull` (graph-derived from event history).

`ShowcaseResolver` returns `null` when authored prose for that specific section is missing — the dispatch then falls through to the graph resolver. This honors the canonical UI spec §5.5 principle: *"The reference examples set the floor for craft, not a ceiling. Authors should aspire to that voice; lower-effort templates exist as fallbacks."*

---

## 5. Per-type detail page templates

### 5.1 Actor

Reference mockup: Captain Veiren (`moment3-detail.jsx` `ActorDetail`).

| Section ID | Label | Primary | Tier | Graph resolver — what it does | Showcase override available? |
|---|---|---|---|---|---|
| `disposition-toward-protagonist` | DISPOSITION TOWARD HER | yes | notable | Reads `relates_to` edge from actor → protagonist; falls back to `relationship` node sentiment if present (per design plan §3.9). Composes italic-lead prose: *"`<sentiment>`, but he remembers her."* + context fragment from disposition resolver. | yes |
| `backstory-to-protagonist` | WHAT SHE IS TO HIM | no | notable | Aggregates `archetypeResolver` + `agentCultureResolver` + recent shared events from `participated_in` history into a paragraph. | yes |
| `threads-between` | THREADS BETWEEN THEM | no | routine | Builds chips from `relates_to` edge tags + `relationship` node `tension_axis` + active vows between actors. Sphere-coloured. | no (always graph-derived) |
| `last-thread-pull` | WHEN THIS THREAD LAST PULLED | no | notable | `EventCardBody`. Walks `participated_in` events between protagonist and actor, picks most recent shared event. Renders quote. | no (graph + event history only) |

### 5.2 Item

Reference mockup: Captain's token (`moment3-detail.jsx` `ItemDetail`).

| Section ID | Label | Primary | Tier | Graph resolver | Showcase override |
|---|---|---|---|---|---|
| `what-it-means-here` | WHAT IT MEANS HERE | yes | notable | Composes scene-context-aware prose: how does this item tilt the current scene? Reads the item's `consumes_item` value if it appears in any active beat's `EncounterChoice`. | yes |
| `provenance` | WHO GAVE IT | no | routine | Walks `possesses` edge history (or attachment `source_actorId` per design plan §2.3) to identify giver. Includes `<span class="term">` for the giver's name (clickable → ActorDetail). | yes |
| `how-it-tilts-scene` | HOW IT TILTS THIS SCENE | no | routine | Reads the item's mechanical effect from the attachment system (e.g., "+0.05 to IRON probability tilt"). Renders qualitatively per taste-profile: *"On any IRON lean, the captain hesitates a half-beat longer."* | no |

### 5.3 Faction

Reference mockup: Civic Guard of Bren (`moment3-detail.jsx` `FactionDetail`).

| Section ID | Label | Primary | Tier | Graph resolver | Showcase override |
|---|---|---|---|---|---|
| `how-they-hold-protagonist` | HOW THEY HOLD HER | yes | notable | Reads protagonist's reputation tone-word with this faction; composes italic-lead prose: *"`<toneWord>`. Not yet useful."* | yes |
| `alliances` | ALLIED WITH / OPPOSED | no | routine | `AlliedOpposedBody`. Walks `allied_with` and `opposed_to` edges from this faction; renders allegiance cards with sub-prose flavor strings. | partial (cards graph-derived; flavor strings overridable) |
| `reputations-held` | REPUTATIONS THEY HOLD | no | routine | `ReputationListBody`. Walks `holds_reputation` edges where this faction is source; renders entries with tone-words. | no (always graph-derived) |

### 5.4 Place

Reference mockup: South Gate of Bren (`moment3-detail.jsx` `PlaceDetail`).

| Section ID | Label | Primary | Tier | Graph resolver | Showcase override |
|---|---|---|---|---|---|
| `place-painting` | (no label — visual) | no | n/a | Returns `PlacePaintingBody` with `imageRef` from place node properties. | no (visual asset; sourced from place graph node) |
| `what-this-place-wants` | WHAT THIS PLACE WANTS | yes | notable | Composes scene-aware prose from place sphere alignment + ambient state + active conditions. Reads existing `sphereResolver` output as building block. | yes |
| `conditions-here` | CONDITIONS HERE | no | routine | Renders place's active condition list as terse phrases ("choke-point · lanterns lit · the queue will not turn back without violence"). Reads `condition_attachment` attachments on the place node. | no |
| `place-memory` | MEMORY | no | notable | Walks `occurred_at` event history for this place, picks one event with sphere overlap to current beat. Italic flavor prose. Reuses `locationEncounterHistoryResolver` as building block. | yes (showcase places get authored memory) |

### 5.5 Event

Reference mockup: The iron market (`moment3-detail.jsx` `EventDetail`).

| Section ID | Label | Primary | Tier | Graph resolver | Showcase override |
|---|---|---|---|---|---|
| `what-happened` | WHAT HAPPENED | yes | notable | Reads event node's `narrative` property (the prose generated when the event was created). For tier-3 events (doom escalation, mandate milestone), `proseTier` escalates to `chronicle`. | yes |
| `who-was-there` | WHO WAS THERE | no | routine | `WitnessListBody`. Walks `participated_in` edges into this event; renders witnesses with their role from edge properties. | no |
| `what-it-became` | WHAT IT BECAME | no | routine | Renders the event's downstream effects as a terse list — vows that emerged, attachments granted, factions disposed. Walks outgoing `caused` edges. | no |
| `how-it-invokes-now` | HOW IT INVOKES NOW | no | notable | Only renders if this event is in the current beat's `callback_candidates[]` (per design plan §4.1). Composes prose: *"The captain stops in front of her. He has not forgotten the iron market. This beat invokes that one."* | yes (showcase events have authored invocation prose) |

---

## 6. Prose tier mapping

Per Narrative Engine canon (Routine / Notable / Chronicle):

- **Routine** sections (most non-primary sections) — template-stitched from `prose-layer-content.ts` tables. Fast, consistent. Examples: `threads-between`, `provenance`, `conditions-here`, `who-was-there`, `what-it-became`.
- **Notable** sections (most primary sections + callback-heavy sections) — enhanced templates with multiple variants and conditional clauses. Examples: `disposition-toward-protagonist`, `what-it-means-here`, `how-they-hold-protagonist`, `what-this-place-wants`, `last-thread-pull`, `how-it-invokes-now`.
- **Chronicle** sections (tier-3 narrative weight only) — LLM-generated literary quality; rare. Auto-escalation conditions:
  - `what-happened` on Event detail when the event is doom-escalation or mandate-milestone (read from event's `narrativeTier` property).
  - Showcase actor's `backstory-to-protagonist` may be Chronicle when the actor is The First or other story-beat-defining entity. Decided by author flag, not auto-escalation.

**Tier is per-section, defined in the registry** (§4.2 `SectionConfig.proseTier`). Showcase override does NOT auto-escalate tier — the registry says what the section's tier is; the showcase swaps the source, not the tier. This keeps tier orthogonal to authoring path: a section is Notable because the section warrants Notable craft, regardless of whether the prose came from author or graph.

The single exception is `what-happened` on Event detail, which auto-escalates from Notable to Chronicle when the event's `narrativeTier === 'chronicle'`. This auto-escalation is encoded in the registry's `proseTier` field as a function rather than a static value:

```typescript
proseTier: (node, scene) => {
  return node.properties?.narrativeTier === 'chronicle' ? 'chronicle' : 'notable';
}
```

A `proseTier` field accepting either a static tier or a function is the smallest extension that supports per-node escalation without breaking the orthogonality of showcase × tier elsewhere.

---

## 7. Fallback templates

When the graph resolver returns null AND no showcase override exists (or showcase returns null too), the section's `fallbackTemplate` produces the body. If `fallbackTemplate` is also missing, the section is omitted from the render.

### 7.1 Discipline rules

- Fallback bodies are **short evocative one-liners** (10–25 words), not longer atmospheric paragraphs. Long-tail entities don't earn long prose; the meeting-encounter quality bar is for showcase content.
- Fallback bodies always **frame the absence of detail as legibility-not-yet-earned**, not as missing data. *"You know little about him."* not *"No backstory available."*
- Fallback bodies are **never numeric or spec-flavored**. Same rule as the rest of the encounter UI.
- Fallback bodies use **placeholder substitution** from node properties: `{name}`, `{archetype}`, `{culture}`, `{factionName}`, `{category}` etc. Substitution failures (missing property) fall back to generic descriptors: `"this one"`, `"some kin"`, etc.

### 7.2 Per-type fallback library

Stored in `src/data/detail-page-fallbacks.ts`.

```typescript
// Actor
'disposition-toward-protagonist': {
  body: { kind: 'prose', text: '{name} has not shown her hand yet.', italicLead: false },
  placeholders: ['{name}'],
}

'backstory-to-protagonist': {
  body: { kind: 'prose', text: 'You know little about {name}. They are {archetype} of {culture}, and that is most of what you can read from the world.' },
  placeholders: ['{name}', '{archetype}', '{culture}'],
}

// Item
'what-it-means-here': {
  body: { kind: 'prose', text: 'A {category}. It came to her hand by some path you have not yet traced.' },
  placeholders: ['{category}'],
}

// Faction
'how-they-hold-protagonist': {
  body: { kind: 'prose', text: 'The {factionName}. Their place in the web is not yet legible.' },
  placeholders: ['{factionName}'],
}

// Event
'what-happened': {
  body: { kind: 'prose', text: 'This happened. You know the shape of it but not its weight.' },
  placeholders: [],
}
```

(Full table with all 17 sections in the implementation phase. This excerpt shows the discipline; executors write the rest.)

### 7.3 Sections without fallback

Some sections **deliberately have no fallback** — they should be omitted entirely when graph data is sparse:

- `last-thread-pull` (Actor) — no shared event history → omit; the section is narratively absent, not stub-filled
- `place-memory` (Place) — no event occurred here → omit
- `how-it-invokes-now` (Event) — event not in current `callback_candidates[]` → omit
- `place-painting` (Place) — if missing, the section is omitted; the detail page renders without the painting (per design plan §9 fail-soft)

This is intentional: the detail page that renders 2–3 sections instead of 4 is *legible*, not broken. The player learns by what is and isn't present.

---

## 8. Integration with `proseResolvers.ts`

The detail page resolvers **extend** the existing prose-resolver architecture; they do not replace it.

### 8.1 Existing layer (untouched)

`src/engine/proseResolvers.ts` continues to power encounter scene composition:
- Place painting prose (subtypeResolver, biomeResolver, sphereResolver, factionResolver, populationResolver, prosperityResolver, etc.) — fires when the encounter's place painting is rendered
- Cast tile prose (archetypeResolver, agentCultureResolver, dispositionResolver, wealthResolver, etc.) — fires when cast tiles are composed

These resolvers produce `ProseLayer[]` outputs that compose into a single paragraph via priority ordering. They are the existing surface; this plan does not touch them.

### 8.2 New layer (this plan)

Detail page section resolvers live in `src/engine/detailPageResolvers.ts` (new file). They produce `SectionBody | null` outputs — one per section per detail page render.

**Reuse existing resolvers as building blocks.** A section resolver may aggregate multiple `ProseLayer[]` outputs into a single section body:

```typescript
// Example: actor backstory section reuses three existing resolvers
function actorBackstoryToProtagonistGraphResolver(
  nodeId: NodeId,
  graph: WorldGraph,
  scene: SceneContext,
  seed: number,
): SectionBody | null {
  const archetypeProse = archetypeResolver(nodeId, graph, seed);
  const cultureProse = agentCultureResolver(nodeId, graph, seed);
  const dispositionProse = dispositionResolver(nodeId, graph, seed);

  const fragments = [archetypeProse, cultureProse, dispositionProse]
    .flat()
    .map(p => p.text)
    .filter(Boolean);

  if (fragments.length === 0) return null;

  return {
    kind: 'prose',
    text: fragments.join(' '),
  };
}
```

This honors the "extend, don't rebuild" rule from canonical UI spec §6.4 and avoids duplicating prose tables.

### 8.3 Showcase content storage

`src/data/detail-page-showcase.ts` (new file):

```typescript
export const ACTOR_SHOWCASE_PROSE: Record<NodeId, ActorShowcaseEntry> = {
  'eira-of-bren': {
    sections: {
      'disposition-toward-protagonist': null,  // n/a — Eira is the protagonist herself
      'backstory-to-protagonist': null,        // n/a
      'threads-between': null,                 // n/a
      'last-thread-pull': null,                // n/a
    },
  },
  'captain-veiren': {
    sections: {
      'disposition-toward-protagonist': {
        kind: 'prose',
        text: '<em>suspicious, but he remembers her.</em> Her name has weight in his mouth. He has not yet decided what to do with that weight.',
        italicLead: false,
      },
      'backstory-to-protagonist': {
        kind: 'prose',
        text: 'A debt and a winter ago. The girl who held a frightened smuggler\'s life in her hand at the iron market and gave it back. He has not forgiven himself for what he asked of her.',
      },
      // 'threads-between' and 'last-thread-pull' fall through to graph resolver
    },
  },
};

export const ITEM_SHOWCASE_PROSE: Record<NodeId, ItemShowcaseEntry> = { /* ... */ };
export const FACTION_SHOWCASE_PROSE: Record<NodeId, FactionShowcaseEntry> = { /* ... */ };
export const PLACE_SHOWCASE_PROSE: Record<NodeId, PlaceShowcaseEntry> = { /* ... */ };
export const EVENT_SHOWCASE_PROSE: Record<NodeId, EventShowcaseEntry> = { /* ... */ };
```

`null` for a section means "fall through to graph resolver" — the showcase entry is partial.

---

## 9. Three-pillar coverage

### 9.1 Engine

- New file `src/engine/detailPageResolvers.ts` — section graph resolvers. ~17 resolver functions (one per section ID across the 5 types).
- New file `src/engine/detailPageDispatch.ts` — `resolveDetailPage(nodeId, type, sceneContext) → Section[]` orchestrator. Reads `DETAIL_PAGE_REGISTRY`, dispatches per §4.3.
- New file `src/data/detail-page-registry.ts` — the registry; one `DetailPageTypeConfig` per type.
- Showcase-flag traversal: `node.properties.showcase: boolean` is a new optional field on actor / item / faction / place / event node properties. Adding it is additive; existing nodes have `showcase: undefined` which is falsy.
- Trace category: `detail_page_resolved` (see §11).

### 9.2 Content

- New file `src/data/detail-page-showcase.ts` — authored prose for showcase entities, keyed per node ID. Empty at v1; content team fills as showcase entities are identified (Eira, The First, named NPCs with biography).
- New file `src/data/detail-page-fallbacks.ts` — fallback template library; ~12 entries (one per section that has a fallback; some sections have none — see §7.3).
- New file `src/data/detail-page-content.ts` — Routine-tier prose tables for graph-walking section resolvers (analogous to existing `prose-layer-content.ts`). Examples: `THREAD_TENSION_AXIS_TEMPLATES`, `REPUTATION_TONE_FRAGMENTS`.

### 9.3 UI

- New component `src/components/Game/Encounter/DetailPage/Section.tsx` — typed `Section` block primitive. Switches on `body.kind` to render the right sub-primitive.
- New sub-primitives (one per `SectionBody.kind`): `ProseSection`, `ChipRowSection`, `EventCardSection`, `ReputationListSection`, `AlliedOpposedSection`, `PlacePaintingSection`, `WitnessListSection`. All in `src/components/Game/Encounter/DetailPage/sections/`.
- Inline `<span class="term">` term wikilinks within `ProseSection` — clickable, opens nested DetailModal. Renders via `ProseKeyword` (existing primitive).
- The five typed detail page instances (`ActorDetail`, `ItemDetail`, etc.) each call `resolveDetailPage(nodeId, type, sceneContext)` on mount and render the resulting `Section[]` inside `DetailModal`.

---

## 10. Constants table (NFP #1 — Tunability)

| Constant | Default | Purpose |
|---|---|---|
| `DETAIL_PAGE_MAX_SECTIONS_RENDERED` | 8 | Cap on section count per detail page (no current type exceeds 4; cap is for future-proofing) |
| `DETAIL_PAGE_PROSE_PARAGRAPH_MAX` | 4 | Max paragraphs per `ProseBody` before scrolling becomes the affordance (no truncation; long prose is intentional) |
| `DETAIL_PAGE_CHIP_ROW_MAX_VISIBLE` | 6 | Cap on chips visible per `ChipRowBody`; over → "+ N more" expander |
| `DETAIL_PAGE_REPUTATION_LIST_MAX_VISIBLE` | 6 | Cap on entries visible per `ReputationListBody`; over → "+ N more" expander |
| `DETAIL_PAGE_WITNESS_LIST_MAX_VISIBLE` | 4 | Cap on witnesses visible per `WitnessListBody` |
| `DETAIL_PAGE_RESOLVE_CACHE_TTL_TICKS` | 1 | How long resolver outputs are cached (invalidated by `worldVersion` bump) |

All constants live in `src/data/detail-page-constants.ts`.

---

## 11. Tracing (NFP #2 — Inspectability)

```typescript
interface DetailPageResolvedTrace {
  category: 'detail_page_resolved';
  tick: number;
  nodeId: NodeId;
  detailPageType: 'actor' | 'item' | 'faction' | 'place' | 'event';
  sectionsRendered: SectionResolutionRecord[];
}

interface SectionResolutionRecord {
  sectionId: SectionId;
  source: 'graph' | 'showcase' | 'fallback' | 'omitted';
  proseTier: ProseTier;
}
```

DebugPanel inspector: `DetailPageResolverInspector` — shows the section list for a given node, source per section, and which sections were omitted.

---

## 12. Fail-soft table (NFP #4)

| Failure | Fallback |
|---|---|
| Graph resolver throws | Caught in dispatch; section omitted; engine logs warning |
| Showcase resolver returns malformed body | Validated by Zod schema in dev; in prod, falls through to graph resolver |
| Fallback template references missing placeholder | Renders literal placeholder unsubstituted (`{archetype}` shown verbatim); engine logs warning |
| Showcase entry exists but section is `null` | Falls through to graph resolver |
| Node not found at dispatch time | DetailModal opens with a single-section "this entity is no longer in the world" body; no crash |
| Section list is empty after dispatch | DetailModal renders header + footer only; body shows italic placeholder *"the world has not yet given this its shape"* |
| `proseTier` function throws | Defaults to `'routine'`; engine logs warning |
| Place painting `imageRef` missing | `PlacePaintingSection` renders a sphere-tinted placeholder rectangle (per design plan §9 — same fallback as encounter active card place painting) |
| Witness `actorNodeId` not in graph | Witness card renders with name only (read from event's witness list) and no portrait |
| Event card `eventNodeId` not in graph | Card renders without click target; no crash |

---

## 13. Vision audit

This plan is downstream of the encounter UI long-form plan (THR-301) and inherits its Vision audit. It does not contradict or update any Vision premise. The decisions inside this plan pull on the following Vision tensions:

- **Tension 4 — Mechanical legibility vs. narrative mystery.** Detail pages are a legibility surface — they show players what is and what is connected. Mitigation against over-legibility: fallback prose deliberately frames sparse data as *not yet earned*, not as numeric absence. Showcase entities get craft prose; long-tail entities get evocative one-liners. The player learns to read what's present and what's silent.
- **Tension 5 — One perfect story vs. portfolio breadth.** Detail pages support the focus on one story (deep clickability into the active encounter's primitives) while also rendering long-tail entities legibly enough to support eventual breadth. Showcase content scales linearly with creative effort; graph content scales free with simulation.

---

## 14. Risks and watchpoints

1. **Showcase prose drift.** Authors write showcase content, the showcase entity later appears in a beat where the prose doesn't fit (e.g., a new vow has emerged that contradicts the authored backstory). Mitigation: showcase prose is per-section, so authors can leave dynamic sections (`threads-between`, `last-thread-pull`) graph-derived. Editorial review when showcase is authored: which sections benefit from authoring? Which should remain dynamic?
2. **Fallback prose feels generic at volume.** A player clicking through 8 long-tail NPCs sees 8 variations of *"You know little about {name}."* Mitigation: the fallback library has 3–5 variants per section that the seeded PRNG selects from. Variant authoring is part of the implementation phase.
3. **Resolver performance.** Detail page open should feel <100ms (canonical UI spec §6.5). Reading 4–8 sections × graph traversal × maybe-showcase-lookup may not hit that budget for densely-connected nodes. Mitigation: per-detail-page resolver cache invalidated by `worldVersion` bump (see §10 `DETAIL_PAGE_RESOLVE_CACHE_TTL_TICKS`); profile the worst-case (faction with 50+ allied/opposed factions) before shipping.
4. **Section omission as legibility, not bug.** The implementation must NOT pad missing sections with placeholders. A detail page that renders 2 of 4 sections is correct behavior, not a render failure. UI snapshot tests in Phase G2 must include sparse-data fixtures explicitly.
5. **Click-through depth without lost context.** Modal stacking handles depth (canonical UI spec §5.3 — up to 4 with breadcrumb collapse). The risk this plan adds: term wikilinks inside `ProseSection` make every detail page potentially the start of a deep stack. Mitigation: breadcrumb collapse at depth 4 is non-negotiable; term wikilinks honor the existing `<span class="term">` styling so visual continuity is preserved.

---

## 15. NFP compliance summary

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | ✅ PASS | Constants table §10, all values named |
| 2. Inspectability | ✅ PASS | Trace `detail_page_resolved` with source per section; DebugPanel inspector specified |
| 3. Determinism | ✅ PASS | All resolvers seeded; same node + scene + seed → same body |
| 4. Fail-soft | ✅ PASS | Failure modes table §12; section omission is legible, not a crash |
| 5. Narrative over mechanical perfection | ✅ PASS | Section omission preferred over stub-padding; fallback prose evocative not numeric |
| 6. Additive over destructive | ✅ PASS | Existing `proseResolvers.ts` untouched; new resolvers extend the pattern; new `showcase` field on graph nodes is additive |
| 7. Performance budget | ✅ PASS with note | Per-render resolver cache covers the typical case; worst-case (densely-connected faction) needs profile before ship — see §14 risk #3 |

---

## 16. Done when (this plan's exit criteria)

- [x] Plan doc written
- [ ] `plan-pending-commit` label applied to THR-319
- [ ] THR-319 moved to *Implementation Planning* with handoff comment
- [ ] Phase E child tickets in THR-301 (THR-337, THR-338) updated to reference this plan as their `blocked-by` source

THR-319 closes when the four items above land. Phase E executors implement against this plan; their tickets close when their done-when criteria are met.

---

## 17. References

- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — long-form design plan (Rule 4: every primitive clickable, every node has a detail page)
- `Docs/plans/2026-05-04-encounter-ui-canonical.md` — canonical UI spec §5 (detail page pattern; modal stacking; section anatomy)
- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` — phasing plan §2.5 (the THR-319 split-out direction)
- `Docs/plans/v7-design-pass/parts/moment3-detail.jsx` — five reference detail page mockups
- `src/engine/proseResolvers.ts` — existing prose-resolver architecture (extend, don't replace)
- `src/data/prose-layer-content.ts` — existing template tables (reused by section resolvers)
- `Systems/Narrative Engine.md` — Routine / Notable / Chronicle prose tier canon
