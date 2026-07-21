# Action Proposal — THR-631 Motive-Receipt Foreshadowing

## intent_quote

> "the feature that shows an agents motivation for choosing the encounter they have chosen does not work really well. the prose is not interesting or relevant enough, and breaks in certain situations. help me design a better prose resolving algorithm for his, and in general for our encounters for generating interesting contextually relevant prose"

Follow-up verdicts via AskUserQuestion (2026-07-05): "Full receipt redesign, phased" · "Composition-first" variety · "Keep both [tooltip + panel], one source".

## scope (what this plan does)

Redesigns the agent encounter-motivation (foreshadowing) prose system: unifies the two divergent resolvers, adds a typed-slot surface realizer (fixes the title-in-place-slot and "They believes" bugs), emits a Motive Receipt from `scoreAndSelect`'s existing labeled contribution fields at decision time, and renders tooltip (1 sentence) and panel (2–4 sentences) prose deterministically from the receipt via clause composition, with authored per-encounter variants retained as overrides. Includes clause content tables, DebugPanel receipt inspection, and the tooltip-overlap UI fix.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change encounter *resolution* prose or vignettes (Scene/Lens/Stakes/Forecast untouched).
- Does not change how encounters are scored or selected — read-only consumption of ScoredCandidate; no gameplay behavior change.
- Does not introduce runtime LLM generation.
- Does not backfill authored foreshadowing for all templates (top-3 marquee only, Phase C).
- Does not generalize the clause-composition engine to other prose pipelines yet — "in general for our encounters" is served by the receipt pattern being reusable, but wiring it into other surfaces is future work.
- Does not add new node or edge types.

## impact_class

Reversible — additive types/fields, one stub-resolver internal deletion (public API retained), no rules-of-play changes, no destructive data migration.

## evidence cited

- **Linear issue:** THR-631 (root cause references THR-389, THR-113, THR-609)
- **Vision premises invoked:** player-as-god portfolio Beat 1, prose-first UI, narrative tiebreaker, plainspoken Malazan voice
- **UL terms touched:** Resolver, Enrichment Placeholder, IPK (unchanged); NEW term "Motive Receipt" → `UL-proposal` issue in Phase D
- **Canon pages consulted:** `Docs/canon/prose.md` (pipelines, voice rules, quality bar, rejected approaches)
- **Prior plan docs this builds on:** `Docs/plans/2026-05-09-encounter-foreshadowing.md` (THR-389), `2026-04-16-systemic-wiring-guide.md`
- **Rejected approaches considered and dismissed:** pure template prose (canon-rejected, this replaces the last single-string fallback with a composed pool); pure runtime LLM (canon-rejected); read-time motive reconstruction (see brainstorm companion)

## load-bearing decisions touched

- "Relationships between entities are graph edges, not property fields" — receipt stored as agent-node *property* with explicit justification (decision-internal data, no traversal need; promotion path named).
- "Everything is a graph node/edge" — no new types invented; verified against `src/types/graph.ts`.
- "Engine caches must be owned per session" — foreshadowing cache already on SimulationRuntime; retained.
- "The world graph is mutated in place" — receipt writes happen in the decision phase which already participates in touch semantics; resolver is click-driven read.

## high-impact files touched (from Codesight)

None ≥100 importers. Checked: `encounterScoring.ts` 11 importers, `phaseAgentDecision.ts` 5, `proseEnrichment.ts` 15, foreshadowing modules 1–2. `traceBuffer.ts` (232) is *used* (emitTrace) but not modified structurally — trace payload extension is additive on an existing category. No Blast Radius section required.

## kill criteria

Wrong if: (a) composed prose reads as repetitive or mad-libs within a single session (player sees the seams) — measured by the Prose QA tab scoring the new tables and a 30-tick CLI sample of rendered outputs reviewed at Phase B closeout; (b) receipt contributions don't match player-visible agent behavior (inspectability lie). Then: keep Phase A (bug fixes stand alone), freeze Phase B/C, and revisit with authored-first strategy for the top-frequency encounters instead.
