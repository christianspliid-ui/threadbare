# Brainstorm companion — THR-637 Entity Visual Header

Companion to `2026-07-05-thr-637-entity-visual-header.md`. Written in the same pass.

## The ask (verbatim, Christian, 2026-07-05 chat)

> "can we make it a recurring UX pattern for all modals that we show images of the location, and any key characters and other nodes that are in the encounter?"

Context: immediately followed the THR-636 portrait addition ("can we also show the characters and name portrait in the encounter model?") — the generalization of that request from one modal to a pattern.

## Alternatives considered

**Missing-art handling** — three options offered to Christian: styled fallbacks now + art batch later (chosen), generate art in the same ticket (rejected: couples a fast pattern landing to slow curated art review), art-backed types only (rejected: pattern with holes isn't a pattern — artless modals would stay text-only indefinitely).

**Retrofit breadth** — core play surfaces first (chosen), everything-at-once (rejected: slower, and codex/CMS/debug surfaces are low-traffic), pattern-doc-only (rejected: a pattern nobody has adopted yet is a suggestion, not a pattern — the four core surfaces prove it and set the precedent).

**Resolver shape** — considered per-surface resolution (each modal picks its own image source, pattern doc only prescribes layout). Rejected: that is exactly the current state (three parallel mechanisms — archetype portraits, `pickConceptArt`, aftermath `portraitUrl`) and the source of the inconsistency. One resolver with a per-kind source list centralizes knowledge-gating and gives THR-638's registries a single integration seam.

**Trace channel for resolver decisions** — considered emitting traces per resolution (NFP #2 orthodoxy). Rejected: modal-render frequency would spam the trace buffer with UI noise; `__DEBUG.resolveEntityVisual` gives on-demand inspection of the same decision. Flagged PASS-with-note in the NFP table rather than hidden.

**Random gradient assignment** — rejected instantly (NFP #3): fallback gradients are picked by `hash(nodeId) % ENTITY_GRADIENT_COUNT`, so an entity keeps its color identity across sessions and saves.

**Encounter-modal visual pair (refined by Christian, same chat, after first handoff)** — original design gave the veil a location chip (hex concept art). Christian rescinded it: "maybe we should not show the location, but at least the character, we could potentially create encounter specific images … so we have a picture of the character, and the encounter, that helps the player understand the context at a glance." Settled: veil shows **character portrait + encounter illustration**; encounter visuals never fall back to location art; location in the veil stays text + "Show on map" link (THR-636). THR-638 gained Batch 0 (encounter illustrations, branching-first) to fill the sparse illustration coverage.

## Tensions surfaced

- **THR-636 file collision:** both tickets edit `EncounterVeil.tsx` and the adapters. Resolved by hard mutex + explicit sequencing (636 first; 637 migrates 636's direct `getPortraitUrl` usage to the primitive). The alternative — folding 637 into 636 — was rejected: 636 is a scoped UX fix ready to ship; a design-system pattern shouldn't ride shotgun in it (design expansively, implement conservatively).
- **Curated-art aesthetic vs. procedural fallbacks:** Threadbare's visual identity is curated (rejected approach: "pure LLM-generated content"). Fallback tiles are therefore *authored* glyphs on a fixed palette — designed states, not generated placeholders. The kill criterion covers the case where they read as broken.
- **Knowledge-gating:** portraits carry a "components must check knowledge" contract (`portrait-assets.ts` doc comment). Centralizing gating in the resolver strengthens the contract but risks over-hiding if a surface forgets to pass knowledge; resolved fail-open (absent `knowledgeLevel` = fully known), matching current surface behavior.

## Vision premises invoked

- Rule 4 (every primitive clickable) — visual chips make the clickable primitives *visible* as things, not text.
- Knowledge/veiling — unknown mortals stay silhouettes; the watched world reveals itself through attention.
- Threadbare aesthetic — one palette, authored glyphs, curated art; the pattern spreads the existing visual language rather than inventing a new one.

## Source notes

- Asset survey (this session): `portrait-assets.ts` (19 archetype portraits, all non-null; bespoke via properties), `concept-art-assets.ts` (`pickConceptArt` terrain/subtype/sphere scorer), `avatar-portrait-assets.ts`, `attachmentGlyphs.ts`, `EncounterStageIllustrationModel`; no registries for factions/artifacts/sublocations/NPC roles.
- Both scope decisions confirmed by Christian in chat 2026-07-05. No open questions parked.
- Related: THR-178 (RightRail redesign, deferred pending component specs) — this pattern is upstream input for that redesign when it revives.
