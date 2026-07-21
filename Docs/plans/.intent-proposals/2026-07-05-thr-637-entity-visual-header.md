# Action Proposal — THR-637 Entity Visual Header

## intent_quote

> "can we make it a recurring UX pattern for all modals that we show images of the location, and any key characters and other nodes that are in the encounter?"

Preceding message (context — the request this generalizes):

> "can we also show the characters and name portrait in the encounter model ?"

Follow-up scope decisions (Christian, same chat, via structured questions): styled fallbacks now for artless node types with art batches as a separate follow-up issue (THR-638); first-pass retrofit limited to core play surfaces (encounter veil, agent profile, location view, aftermath), everything else adopts the pattern in later tickets.

## scope (what this plan does)

Defines a design-system pattern (Entity Visual Header: subject image + name + type on every detail modal; secondary entities as clickable visual chips) and builds its infrastructure: one shared component (`EntityVisual`, sizes hero/portrait/chip), one resolver (`resolveEntityVisual`) with a per-kind source list and tiered fallbacks (bespoke → registry art → authored glyph-on-seeded-gradient), centralized knowledge-gating, authored fallback tables, styleguide entries, a design-system doc page, and a `__DEBUG.resolveEntityVisual` inspection hook. Retrofits exactly four core play surfaces and migrates the two existing ad-hoc portrait paths (veil post-THR-636, aftermath) onto the primitive.

## scope (what this plan does NOT do — explicit non-goals)

- No art generation — faction/artifact/sublocation/NPC-role art is THR-638 (blocked on this issue), per Christian's explicit choice.
- No retrofit of codex, CMS, debug, reference, or notification surfaces in this pass — they adopt later.
- No engine changes: no tick phases, no graph node/edge types, no resolution logic, no GameState writes.
- No changes to what THR-636 ships — this migrates its plumbing afterward, visual result unchanged.
- No new visual language: existing palette, existing glyph sets, existing art registries.
- No trace-buffer channel for resolver decisions (deliberate — UI-frequency spam; `__DEBUG` hook instead). Flagged PASS-with-note under NFP #2.

## impact_class

Reversible — new UI primitive + presentation retrofits; each retrofit is independently revertible; no persistent state, no engine surface.

## evidence cited

- **Linear issue:** THR-637 (project: UI Visual Overhaul — Design System v1); follow-up THR-638 created and blocked on it; related THR-636 (hard mutex, must land first)
- **Vision premises invoked:** Rule 4 clickability (`Docs/canon/encounters.md`), knowledge-gating contract (`portrait-assets.ts` doc comment), Threadbare curated-art aesthetic, "design expansively, implement conservatively"
- **UL terms touched:** existing only (archetype, thread, knowledge). "Entity Visual Header" is a design-system pattern name (docs-layer), not a game-domain noun — no UL-proposal opened; judge may disagree.
- **Canon pages consulted:** `Docs/canon/encounters.md`; CLAUDE.md load-bearing decisions + rejected approaches; design-system docs directory (pattern page will live there)
- **Prior plan docs this builds on:** `2026-07-05-thr-636-encounter-context-ux.md` (the generalization source), `2026-05-04-encounter-experience-design-plan.md` (Rule 4)
- **Rejected approaches considered and dismissed:** per-surface resolution (is the current broken state); art generation in-ticket (couples pattern to art review); pattern-doc-only (unadopted pattern is a suggestion); random gradient assignment (NFP #3); per-render trace channel (buffer spam)

## load-bearing decisions touched

- "Everything is a graph node/edge" — resolver reads nodes via the graph's public API; no new storage.
- "World graph mutated in place / version counters" — resolver is called at modal render with current state; it does not memoize on graph identity (no stale-cache risk). If implementation adds memoization it must key on `worldVersion`.
- "No inventing node types" — none invented.
- Rejected approach "Pure LLM-generated content" — respected: fallbacks are authored, art batches are curated (THR-638).

## high-impact files touched (from Codesight)

None edited. `src/engine/graph.ts` (531 importers) is read-only via public API. Plan doc retains a Blast Radius section stating this explicitly.

## kill criteria

If the fallback tiles read as broken/placeholder states in playtest (the "gray box problem"), the glyph/gradient set gets an art-direction pass before any further retrofit — and if that fails, artless kinds drop to name-only headers (option Christian rejected as the *default*, acceptable as the *failure mode*). If resolver centralization turns out to fight a surface's needs (e.g., LocationView wants time-of-day variants), extend the resolver's `opts` rather than reverting to per-surface plumbing; if two such extensions conflict, that's the signal the pattern is wrong — escalate to Christian before a third.

## explicit user sign-off

Not required (Reversible). Direction confirmed in chat 2026-07-05: pattern requested verbatim by Christian; both scope decisions (fallbacks-now/art-later, core-surfaces-first) chosen by him from explicit options.

## author notes for the judge

- The strongest scope-creep risk is the retrofit list. "All modals" is the user's verbatim ask; the *confirmed* first pass is four surfaces. The plan makes the pattern the default for future modal work via the design-system page — that's how "all modals" is honored without a big-bang sweep. Judge should check this framing is honest (I believe it is; the user chose "core play surfaces first" explicitly).
- THR-636/637 file collision is handled by hard mutex + sequencing rather than merging tickets; the alternative was considered and documented in the brainstorm.
- Same sandbox caveat as THR-636's proposal: git freshness unverifiable this session (mount corruption, impediment #167); all reads via direct file tools, current on disk.
