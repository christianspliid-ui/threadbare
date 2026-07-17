# Entity Visual Header Pattern

**Status:** binding UI pattern (THR-637)
**Source:** `Docs/plans/2026-07-05-thr-637-entity-visual-header.md`
**Generalized by:** `artifact-representation.md` (THR-639 — adds the *information* obligation on top of this *image* pattern)
**Component:** `src/components/shared/EntityVisual.tsx` · **Resolver:** `src/components/shared/entityVisualResolver.ts` · **Fallbacks:** `src/data/entity-visual-fallbacks.ts`
**Styleguide:** `?view=styleguide` → *EntityVisual (THR-637)*

Every detail modal/panel opens with the **face of the thing it is about** — the subject's image, rendered through one shared primitive and one resolver instead of re-invented per surface. When no curated art exists, a *designed* fallback tile stands in (authored glyph on an id-hashed Threadbare gradient), never a broken state or placeholder gray.

## Statement

When an entity is the subject of a surface, open with its **Entity Visual**: the subject's image (or fallback tile) at the right size, resolved by `resolveEntityVisual`. Secondary entities the surface references (cast, factions, items, the location) render as **chip**-sized visuals. Do not hand-plumb `getPortraitUrl` / `pickConceptArt` / illustration slots into a modal — call the primitive.

A surface that shows an entity's name in text only, where an image belongs, is a pattern violation.

## The three sizes

| Size | Aspect | Use for |
|---|---|---|
| `hero` | 16:9 | Location landscapes, encounter illustrations — the banner atop a place/scene surface |
| `portrait` | 3:4 | Agents, avatars, NPC roles — the character header |
| `chip` | 40px square | Cast lists, faction tags, items in play — secondary entities inline |

## Resolver contract

`resolveEntityVisual(ref, graph, opts) → EntityVisualDescriptor`

- **`ref`** — `{ id, kind?, name?, knownSrc? }`. `id` is both the graph lookup key and the gradient hash seed. `kind` is derived from the graph node when omitted. `knownSrc` lets graph-free surfaces (EncounterVeil, aftermath) pass an already-resolved URL — it wins over graph lookup.
- **`graph`** — the world graph, or `null` for graph-free surfaces.
- **`opts`** — `knowledgeLevel` (person gate), `terrain` + `sphereInfluence` (location `pickConceptArt`).
- **Returns** — `{ tier: 'art' | 'fallback', src?, glyph, gradientIndex, alt, kind }`.

Per-kind source chain (THR-638 art registries slot into `resolveSource` as one branch each):

| Kind | Primary source | Fallback |
|---|---|---|
| agent / npc-role | bespoke portrait → archetype portrait | silhouette / initial on gradient |
| avatar | bespoke portrait → origin portrait | silhouette on gradient |
| location | `pickConceptArt` landscape (needs `opts.terrain`) | location glyph on gradient |
| encounter | `ref.knownSrc` illustration (never location art) | glyph on gradient |
| sublocation / faction / artifact | *(THR-638 registries)* | glyph on gradient |

## Fallback tiers

- The fallback tile is a **designed state**: an authored glyph (`⌂` place, `⚜` faction, `◆` artifact, `✦` encounter, or a person's name initial) on one of `ENTITY_GRADIENT_COUNT` (6) Threadbare-palette gradients.
- The gradient is chosen by `gradientIndexForId(id)` — a **stable hash**, so an entity keeps its colour identity across sessions and saves. Never random (NFP #3).
- An art `<img>` that 404s swaps to the fallback tile **in place** (no broken-image icon, no layout shift), with one `console.warn` (NFP #4).

## Knowledge gating

- Applies to **person kinds only** (agent / avatar / npc-role). Below `ENTITY_VISUAL_MIN_KNOWLEDGE` (`'recognised'`) the resolver returns the fallback (silhouette) tier even when art exists — this hoists the old inline `knowledgeLevel !== 'stranger'` checks into one place.
- **Never** gate locations, encounters, or items — intel is additive, never subtractive (THR-138 closed space).
- **Fail-open:** a surface that omits `knowledgeLevel` keeps showing art unchanged.

## Do-not

- ❌ Do not fork a second knowledge-gating constant or a second portrait-resolution path. One resolver. If a surface needs behavior the resolver lacks, extend the resolver.
- ❌ Do not add location imagery to the encounter veil — its visual pair is **character portrait + encounter illustration** (user decision 2026-07-05). The location stays a text line + "Show on map".
- ❌ Do not ship a fallback tile that reads as a broken/placeholder state. If it looks unfinished, that's a bug.

## Supersession note

The 2026-05-04 encounter-experience plan specified "sphere-tinted halo" silhouettes for unknown agents. That treatment is **superseded** by this pattern's id-hashed gradient set — one silhouette spec, not two.

## Retrofitted surfaces (first pass)

EncounterVeil (context-strip character + aftermath actor moments), AgentProfileModal portrait header, LocationView hero landscape. Codex, CMS, debug, and reference surfaces adopt the primitive in later tickets — this pattern is the default for all new modal work.

## Debug

`window.__DEBUG.resolveEntityVisual('<id-or-name>')` returns the resolver's decision (tier, chosen source, gradient index, kind) for any node — the one-call answer to "why is this showing a fallback?"
