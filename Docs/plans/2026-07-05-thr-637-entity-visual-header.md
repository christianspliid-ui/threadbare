> **title:** `Entity Visual Header — recurring modal pattern — THR-637`
> **linear_issue:** THR-637
> **author:** Cowork
> **created:** 2026-07-05
> **three_pillars:** Engine `N/A — pure presentation-layer read of existing node properties; no tick/graph/resolution changes` · Content `done` · UI `done`

# Entity Visual Header — THR-637

*Every detail modal opens with the face of the thing it's about — one shared primitive, one resolver, applied everywhere instead of re-invented per surface.*

## Why this is load-bearing

The game already has three separate, inconsistent answers to "show me this entity": archetype portraits (agents), `pickConceptArt` landscapes (hexes), and per-encounter illustrations — each wired ad hoc into whichever surface happened to need it, while factions, artifacts, sublocations, and NPC roles get nothing. THR-636 is about to wire portraits into the encounter veil by hand; without a pattern, the next modal does it by hand again, differently. This plan makes "subject image + name + type" a **design-system pattern** with a single resolver and a single component, so every current and future detail surface inherits visual identity for free — and so the THR-638 art batches light up everywhere at once by editing one registry. Direction settled with Christian 2026-07-05: styled fallbacks now (art batches follow in THR-638), first-pass retrofit limited to core play surfaces.

## Engine pillar

Engine: N/A — pure presentation-layer read of existing node properties. The resolver reads graph nodes; it never mutates, never runs in a tick phase, adds no graph node/edge types, and performs no resolution logic. (PRNG note handled under Determinism in the NFP table: the fallback gradient is seeded by a **hash of the node id** — stable, not random.)

## Content pillar

### Encounter templates

N/A — no template changes; encounter illustrations already exist in the stage model.

### Prose tables

N/A — no prose.

### Attachment content

N/A — attachment glyphs (`attachmentGlyphs.ts`) are consumed as-is by the fallback tier.

### Data tables

Two small authored tables, both in one new file `src/data/entity-visual-fallbacks.ts`:

1. **Category glyph map** — node category → glyph for the fallback tile: faction → sigil-placeholder glyph, artifact/item → category glyph (reuse attachment glyphs where they fit), sublocation → type glyph, npc-role → role glyph, unknown → thread glyph. Authored once, in Threadbare style.
2. **Gradient palette** — small set of named gradient stops (Threadbare palette: void/gold/ember/warm-text family already tokenized in the veil) that the id-hash picks from. No per-entity authoring.

THR-638 (art batch: faction sigils, artifact art, sublocation art, NPC-role portraits) replaces fallbacks with real art by adding registry files shaped like `portrait-assets.ts`; the resolver is written so a new registry is one added lookup branch, zero component changes.

## UI pillar

*Screenshot tool: Playwright (all retrofit surfaces are DOM; no WebGL changes).*

### Player-facing display

**The pattern (design-system rule):** every detail modal/panel opens with an **Entity Visual Header** — the subject's image, name, and type tag; secondary entities referenced by the surface (cast, present factions, items in play, the location) render as **visual chips** (small image/glyph + name), each clickable per encounters-canon Rule 4.

**Shared primitive: `EntityVisual`** (`src/components/shared/EntityVisual.tsx`), three sizes:
- `hero` — 16:9 banner (location landscapes, encounter illustrations)
- `portrait` — 3:4 or square (agents, avatars, NPC roles)
- `chip` — small inline tile (cast lists, faction tags, items)

**Single resolver: `resolveEntityVisual(ref, graph, opts)`** (`src/components/shared/entityVisualResolver.ts`) returning `{ tier: 'art' | 'fallback', src?, glyph?, gradientIndex, alt }`:

| Entity kind | Primary source | Fallback chain |
|-------------|---------------|----------------|
| Agent | bespoke portrait from properties (`getAgentPortraitUrlFromProperties`) | archetype portrait (`getPortraitUrl`) → silhouette-on-gradient |
| Location / hex | `pickConceptArt` (terrain + subtype + sphere scoring, existing) | category glyph-on-gradient |
| Sublocation | *(post-THR-638: sublocation-type registry)* | parent location's concept art at reduced opacity → glyph-on-gradient |
| Encounter | stage-model illustration *(coverage grows via THR-638 encounter-image batch)* | glyph-on-gradient — **never location art** (user decision 2026-07-05: the encounter modal's visual pair is character + encounter; location imagery there dilutes the at-a-glance context) |
| Faction | *(post-THR-638: sigil registry)* | glyph-on-gradient |
| Artifact / item | *(post-THR-638: artifact registry)* | attachment/category glyph-on-gradient |
| NPC role | *(post-THR-638: role portrait registry)* | silhouette-on-gradient |
| Ascendant/avatar | avatar portrait set | silhouette-on-gradient |

Gradient selection: `gradientIndex = hash(nodeId) % ENTITY_GRADIENT_COUNT` — stable per entity forever, no randomness (name the hash fn; any stable string hash). Knowledge-gating: resolver accepts `opts.knowledgeLevel` (`KnowledgeLevel` ordinal, not numeric); when it ranks below `ENTITY_VISUAL_MIN_KNOWLEDGE` the resolver returns the fallback tier even when art exists — centralizing the inline `!== 'stranger'` checks surfaces do today. **Gating applies to agent/NPC portraits only** — never to locations, encounters, or items (intel is additive, never subtractive — THR-138 closed design space).

**First-pass retrofit (core play surfaces, confirmed scope):**
1. **EncounterVeil** — context-strip character + cast chips (THR-636 lands these with direct `getPortraitUrl`; this ticket migrates them to `EntityVisual`). The veil's at-a-glance visual pair is **character portrait + encounter illustration** (the existing `model.illustration` slot, thread-tier opacity preserved). **No location imagery in the veil** — location remains the THR-636 text line + "Show on map" link (user decision 2026-07-05).
2. **AgentProfileModal / OverviewTab** — portrait header (currently text-first).
3. **LocationView** — hero landscape via `pickConceptArt` + chips for present agents/factions/sublocations.
4. **Aftermath (actor moments)** — migrate existing `portraitUrl` usage to the primitive (visual no-op, removes the parallel mechanism).

Codex, CMS, debug, and reference surfaces adopt the primitive in later tickets — the pattern doc makes it the default for all new modal work.

**Pattern documentation:** new page in `Docs/design-system/` ("Entity Visual Header") — when to use each size, resolver contract, fallback tiers, knowledge-gating, do-not (no bespoke per-modal image plumbing). Registered in the styleguide (`?view=styleguide`) with sample data for all three sizes and both tiers.

### Event notifications

N/A — notification cards are THR-636 scope; they may adopt `EntityVisual` chip size later without design change.

### Debug inspection (DebugPanel)

`window.__DEBUG.resolveEntityVisual(ref)` — thin wrapper exposing the resolver's decision (`tier`, chosen source, gradient index) for any node id/name, so "why is this showing a fallback?" is a one-call answer. Documented in CLAUDE.md §Debug Bridge in the closing PR.

### Visual presence (HexMapV2)

N/A — no renderer changes; `pickConceptArt` is read at modal render, not on the map.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `entityVisualResolver.ts` | n/a (pure UI read) | `EntityVisual.tsx` | reads `graph` nodes (no writes) | none (pure fn) | `__DEBUG.resolveEntityVisual()` |
| `entity-visual-fallbacks.ts` | n/a | `EntityVisual.tsx` | n/a | none | same |
| Retrofits (4 surfaces) | n/a | EncounterVeil, AgentProfileModal/OverviewTab, LocationView, aftermath | existing props | none | styleguide entries |

`enrichProse()`: not used — no prose generated. Player controls: chips are clickable via each surface's existing select/open callbacks; no new control types.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ENTITY_GRADIENT_COUNT` | `6` | Number of named fallback gradients the id-hash selects from |
| `ENTITY_VISUAL_HERO_ASPECT` | `16/9` | Hero banner aspect ratio |
| `ENTITY_VISUAL_PORTRAIT_ASPECT` | `3/4` | Portrait aspect ratio |
| `ENTITY_VISUAL_CHIP_PX` | `40` | Chip tile size |
| `ENTITY_VISUAL_MIN_KNOWLEDGE` | `'recognised'` | **New** named constant (`KnowledgeLevel` enum-ordinal via `KNOWLEDGE_LEVELS` order, `src/types/familiarity.ts`) — minimum knowledge at which agent art renders; hoists today's inline `card.knowledgeLevel !== 'stranger'` gate (`AgentProfileModal.tsx`) into the resolver. No numeric knowledge exists or is introduced. (Corrected per NFP audit: the previously cited `PORTRAIT_KNOWLEDGE_THRESHOLD` does not exist.) |

## Tracing

No traces — the resolver is a pure synchronous function with no failure modes worth a trace channel; inspectability is served by `__DEBUG.resolveEntityVisual` returning the full decision. (NFP #2 satisfied via the debug bridge rather than the trace buffer; adding per-render traces would spam the buffer at UI frequency.)

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Asset path 404s at render | `onError` → swap to fallback tier in place; no broken-image icon, no layout shift; one-time `console.warn` per asset path (the swap happens in the component, outside the resolver's debug surface) |
| Node ref not found in graph | Generic thread-glyph fallback tile with the passed display name; never throws |
| Unknown node category | `unknown` glyph-on-gradient |
| `pickConceptArt` returns nothing (unmatched terrain) | Location category glyph-on-gradient |
| `knowledgeLevel` absent in `opts` | Treat as fully known (current behavior of surfaces that don't gate) — no accidental hiding |
| Registry file missing a key (post-THR-638 partial batches) | `null` entry → next tier in the fallback chain (same contract as `ARCHETYPE_PORTRAITS`) |

## Blast Radius

No file in scope has ≥100 importers. New files (`EntityVisual.tsx`, `entityVisualResolver.ts`, `entity-visual-fallbacks.ts`) plus four leaf UI components. `src/engine/graph.ts` (531 importers) is *read* via its public API but not edited. Section retained to state this explicitly rather than omitted.

## Three-pillar check

- [x] Engine pillar N/A with rationale (presentation-only read)
- [x] Content pillar present (fallback tables; art batches split to THR-638 by user decision)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. Strengthens Rule 4 (clickable primitives get faces), knowledge-gating (centralized instead of per-surface), and the Threadbare aesthetic (curated art with styled fallbacks — never procedural mush). Fallback tiles use the established palette; no new visual language invented.
- [x] No Vision edit required.

## Rulebook impact

- [x] No rule of play changes — presentation pattern only.

> Brainstorm companion: `Docs/plans/2026-07-05-thr-637-entity-visual-header-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Five named constants; knowledge threshold reused, not forked |
| 2. Inspectability | PASS with note | No trace channel by design (UI-frequency spam); full decision inspectable via `__DEBUG.resolveEntityVisual` |
| 3. Determinism | PASS | Gradient by id-hash, `pickConceptArt` deterministic scoring (verify stable tie-break by entry order in implementation); zero `Math.random` |
| 4. Fail-soft | PASS | Six-row table; resolver never throws, image errors swap in place |
| 5. Narrative over mechanical perfection | PASS | Faces and places over text lists; knowledge-gating keeps unknown mortals veiled |
| 6. Additive over destructive | PASS | New primitive + resolver; retrofits replace ad-hoc plumbing with calls to it (aftermath migration is a visual no-op) |
| 7. Performance budget | PASS | Pure synchronous lookups at modal-open frequency; images lazy-loaded (`loading="lazy"` on chips) |

## Done when

- [ ] `EntityVisual` + `resolveEntityVisual` + fallback tables exist with unit tests (per-kind resolution + full fallback chain)
- [ ] Four core surfaces retrofitted (veil, agent profile, location view, aftermath); aftermath's direct `portraitUrl` path removed
- [ ] Styleguide (`?view=styleguide`) shows all three sizes, art tier + fallback tier
- [ ] Design-system pattern page written; wiring checklist updated if new modal surfaces added
- [ ] `window.__DEBUG.resolveEntityVisual` works; documented in CLAUDE.md §Debug Bridge
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` pass (no engine files touched → no CLI smoke required)
- [ ] Browser-verify: Playwright screenshots at 1920×1080 of each retrofitted surface + styleguide entry; console block
- [ ] Closing commit body and PR body include `Fixes THR-637`

## Coordination block

**Suggested model:** sonnet — pattern extraction + component work against a settled design (advisory; automation runs Opus regardless)

**Parallel-safe with:** THR-638 (blocked on this anyway); doc-only issues

**Mutex with:** **THR-636 (hard mutex — same files: `EncounterVeil.tsx`, `encounter-stage/types.ts`, adapters, aftermath path). THR-636 must land first**; this ticket then migrates 636's direct `getPortraitUrl` usage to the primitive. Do not pick up while THR-636 is In Dev or unmerged.

**Files to touch:**
- Create: `src/components/shared/EntityVisual.tsx`, `src/components/shared/entityVisualResolver.ts`, `src/data/entity-visual-fallbacks.ts`, `Docs/design-system/entity-visual-header.md`
- Edit: `src/components/Game/EncounterVeil.tsx` (migrate to primitive + location chip)
- Edit: agent profile modal / `OverviewTab` (portrait header)
- Edit: `src/components/Game/LocationView.tsx` (hero landscape + chips)
- Edit: aftermath actor-moment renderer (migrate `portraitUrl` → primitive)
- Edit: styleguide registry, `src/debug-bridge.ts` + `.d.ts`

## Notes for the executor

- **Sequencing is the trap:** THR-636 first, always. If both are Ready for Dev, 636 outranks.
- **Encounter-modal visual pair (user decision 2026-07-05):** character portrait + encounter illustration, side by side or stacked per the veil's existing layout language. Do NOT add location imagery to the veil (the location chip idea is rescinded); LocationView's own hero landscape is unaffected — the rule is "no location *images* inside the encounter modal", not "no location art anywhere".
- Do not fork a second knowledge-gating constant or a second portrait-resolution path — the whole point is one resolver. If a surface needs behavior the resolver lacks, extend the resolver.
- `pickConceptArt` tie-breaking: confirm ties resolve by registry order (deterministic); if it currently uses any unstable sort, fix it there (one-line) rather than in the caller.
- Fallback tiles are designed, not placeholder-gray: Threadbare palette gradients + authored glyphs. If they look like broken states, that's a fail.
- THR-638 registries must be consumable by adding one lookup branch — write the resolver with that seam visible (a per-kind source list, not a hardcoded if-chain).
- The 2026-05-04 encounter experience plan specified "sphere-tinted halo" silhouettes; the id-hash gradient set generalizes that treatment. State the supersession in the design-system pattern page (Vision-audit note) — don't leave two competing silhouette specs.
- Knowledge-gating scope is agents/NPCs only (see UI pillar). Do not gate locations/encounters/items — that would drift into the closed "intel hides content" space (THR-138).

## Forked-audit verdicts

*Run 2026-07-05 (three forked subagents). Intent-judge verdict: **Allow** (10/10 PASS, 0 GAPs, 0 VIOLATIONs, Reversible confirmed; all cited code sites verified to exist). The one REVISE finding below was integrated in the same pass.*

### NFP audit

**REVISE → resolved.** Finding (NFP #1): the plan's constants table cited `PORTRAIT_KNOWLEDGE_THRESHOLD` as an existing constant to reuse — **no such constant exists**; knowledge is an ordinal enum (`KnowledgeLevel`, `src/types/familiarity.ts`) and today's gate is inline `!== 'stranger'` checks. **Fix applied:** replaced with a genuinely new `ENTITY_VISUAL_MIN_KNOWLEDGE: KnowledgeLevel = 'recognised'` constant hoisting the inline gate; "below the threshold" phrasing corrected to enum-ordinal ranking. Determinism verified against source: `pickConceptArt` uses strict `s > bestScore` (first-max wins in fixed registry order, no randomness) — the plan's tie-break caution is already satisfied. No-trace-channel decision judged defensible (pure UI read; `__DEBUG.resolveEntityVisual` covers inspection); non-blocking suggestion (one-time `console.warn` on asset-404 swap) integrated into the fail-soft table. NFPs #2–#7 PASS.

### Three-pillar audit

**PASS.** Engine N/A rationale verified sound (pure read, no mutation/tick/GameState surface). Content substantive (two authored tables + THR-638 seam). UI covers all four required surfaces with N/A rationales where applicable; Playwright correctly named. **All four retrofit targets verified live** (impediment-#164 check): `EncounterVeil` @ GameView.tsx:3858, `LocationView` @ 3450, `AgentProfileModal` @ 3743 (`OverviewTab` @ AgentProfileModal.tsx:219), aftermath actor-moments inside EncounterVeil itself — which reinforces the declared THR-636 hard mutex. No missing required sections.

### Vision audit

**PASS-with-notes** (audited against `Docs/design-brief.md` + canon pages; vault Vision files unreachable from this session). No contradictions: prose-carries-narrative respected (images frame, don't displace, prose); Rule 4 extended; curated-art aesthetic respected (id-hash only *selects among authored* gradients — no procedural identity); THR-609 plain labels respected. Notes integrated: (1) knowledge-gating scoped to agent/NPC portraits only, never locations/encounters/items (THR-138 closed space) — now explicit in UI pillar + executor notes; (2) the 2026-05-04 plan's "sphere-tinted halo" silhouette spec is superseded by the gradient set — supersession must be stated in the pattern page (executor note added); (3) fail-open `knowledgeLevel` caveat acknowledged — call-site discipline unchanged from today.
