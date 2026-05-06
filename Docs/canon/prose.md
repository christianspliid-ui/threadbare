---
domain: prose
last_reviewed: 2026-05-06
reviewer: cowork
ul_shards: [Prose, Encounters]
status: live
---

# Canon — Prose

> Prose is where systemic state becomes story. The same engine signal — a faction shift, a reach roll, a thread under stress — must read like a moment a god is overhearing, not a row in a database. The prose canon is the navigation layer over four pipelines, three authoring skills, and one aesthetic. It does not define terms (the UL does) or argue for design choices (plans do); it tells you *which surface answers your question right now*.

## How to use this page

Load this page once at session start when authoring prose, encounter narrative, vignettes, or content tables. Every link below is a pointer; the linked target is authoritative. When a pointer disagrees with the target, the target wins and the pointer needs an update — open a `drift-scan`-labeled Linear issue.

**Prose is a broad domain.** Three skills divide the work. Pick one before you write — running the wrong skill fights the right one.

## Authoring entrypoint — pick the skill that matches your task

| If you are doing… | Load skill | Lives at |
|---|---|---|
| Writing encounter templates, narrative event prose, faction content, spell flavor, or any content-table entry (the high-volume daily work) | [`prose-content-systems`](../../.claude/skills/prose-content-systems/SKILL.md) | `src/data/*-content.ts`, encounter and faction content files |
| Authoring or editing vignettes (Scene/Lens/Stakes/Forecast), enrichment placeholders (`{name}`, `{artifact}`, `{ally}`, conditional blocks), backstory strata, or encounter-history → prose wiring | [`prose-vignettes-and-enrichment`](../../.claude/skills/prose-vignettes-and-enrichment/SKILL.md) | `src/engine/vignetteProse.ts`, `src/engine/proseEnrichment.ts`, `src/data/backstory-content.ts` |
| Implementing a *new* graph-walking resolver, modifying the prose pipeline, or shipping a new ProseLayer category | [`prose-pipeline`](../../.claude/skills/prose-pipeline/SKILL.md) | `src/engine/proseGenerator.ts`, `proseResolvers.ts`, `proseComposer.ts`, `src/data/prose-layer-content.ts` |

If your task crosses two skills (e.g. authoring a new resolver *and* its content table), load `prose-pipeline` first — architecture before content.

## Current spec — pipelines

Prose generation runs through four pipelines, each with a clear input → output contract:

- **Graph-walking resolvers** ([`src/engine/proseGenerator.ts`](../../src/engine/proseGenerator.ts), [`proseResolvers.ts`](../../src/engine/proseResolvers.ts), [`proseComposer.ts`](../../src/engine/proseComposer.ts)) — entity descriptions for locations, actors, factions. Resolvers walk graph edges from a target node and emit `ProseLayer[]`; the composer caps per category and joins. Content lives in [`src/data/prose-layer-content.ts`](../../src/data/prose-layer-content.ts). Design: [`Docs/plans/2026-03-09-prose-generator-framework-design.md`](../plans/2026-03-09-prose-generator-framework-design.md).
- **Narrative engine** ([`src/engine/narrative.ts`](../../src/engine/narrative.ts), [`culturalProse.ts`](../../src/engine/culturalProse.ts)) — three-tier event prose (Routine / Notable / Chronicle). Sphere vocabulary (`SPHERE_VOCABULARY`) flavors verbs and adjectives; cultural palettes substitute at 30%. Content: [`src/data/narrative-content.ts`](../../src/data/narrative-content.ts), [`culture-content.ts`](../../src/data/culture-content.ts).
- **Vignette prose** ([`src/engine/vignetteProse.ts`](../../src/engine/vignetteProse.ts)) — encounter step narratives in the four-part Scene / Lens / Stakes / Forecast structure. Forecast tier maps from success probability (`doomed | perilous | uncertain | favorable | fated`).
- **Prose enrichment** ([`src/engine/proseEnrichment.ts`](../../src/engine/proseEnrichment.ts), implemented as `enrichProse()`) — runs at generation time, walks the graph for a `NarrativeContext`, resolves placeholders and conditional blocks. Required reading: [Capability 1 of the systemic wiring guide](../plans/2026-04-16-systemic-wiring-guide.md).

The four pipelines compose: a vignette step calls enrichment; an entity description from resolvers may seed a vignette's Scene; a Notable-tier event reuses the same enrichment context. **Author content for the pipeline that owns it; the others compose without your help.**

## Current spec — pointers

- **UL terms (canonical):** [Docs/ubiquitous-language/Prose.md](../ubiquitous-language/Prose.md) — IPK, Enrichment Placeholder, Resolver, Strata, Narrative Lexicon, Chronicle Entry, Narrative Event, Thread Tug.
- **Engine wiring (required reading before authoring):** [Docs/plans/2026-04-16-systemic-wiring-guide.md](../plans/2026-04-16-systemic-wiring-guide.md). Capability 1 (Enrichment Placeholders) is the prose-author chapter; Capabilities 2–9 explain what aftermath, marks, seeds, intel, and intervention do that prose must respect.
- **Encounters Canon (sibling domain):** [Docs/canon/encounters.md](encounters.md) — encounter format (`UnifiedActionTemplate`), the four load-bearing rules, the reach × archetype-axis table.
- **Cosmology Canon (terminology authority for reach/sphere terms):** [Docs/canon/cosmology.md](cosmology.md) — 8 Reaches, 12 Spheres, Quintessence as meta-property (not a Reach).
- **Compiled brief:** [Docs/authoring-brief.md](../authoring-brief.md) — sha-pinned preamble regenerated via `npm run build-authoring-brief`; staleness check `npm run check:authoring-brief`.
- **Narrative Lexicon (10-tier per-Reach vocabulary):** `NARRATIVE_LEXICON` in [src/types/traits.ts](../../src/types/traits.ts).
- **Exemplars:** [Docs/exemplars.md](../exemplars.md) — encounter-prose exemplars `rival-shrine-betrayal.ts` (10/10), `flawed-steel.ts` (9/10). Standalone prose exemplar row is **TBD** (open question, below).

## Threadbare voice rules (read once, hold throughout)

The aesthetic is a hard constraint, not a stylistic suggestion. Drift is the most common reason editorial passes reject drafts.

- **Dark world, hidden magic, threads that break through.** Magic is uncanny, not pyrotechnic.
- **Short, declarative sentences with one vivid detail.** One image earns its keep; three become noise.
- **No exclamation marks. No breathless enthusiasm.** Cool failure beats bombast.
- **Wear and age over polish and perfection.** Surfaces are worn, weathered, frayed.
- **The uncanny over the fantastic.** Strange is colder than spectacular.
- **Dry wit over comedy. Irony over sentimentality.**

The full voice articulation lives in `Obsidian → Systems/Tonal Bible.md` and `Systems/Narrative Engine.md` (verify freshness — vault Systems pages can lag code; if these pages contradict UL or this Canon page, the UL/Canon wins and the vault page needs a `drift-scan` issue).

## Per-template quality bar (5 questions, ask every time)

Every prose line must answer yes to all five:

1. **Does this create a human condition the player recognizes?** Not "trust_decay -0.02" but "exposed," "indebted," "unexpectedly grateful." Mechanical changes without human texture get rewritten.
2. **Does this make the player want to know what happens next?** Every line opens a question, creates a tension, or implies a consequence. *"The negotiation failed"* is dead. *"The negotiation failed — and the merchant's apprentice heard every word"* is a hook.
3. **Does this work as a moment, not a label?** *"A rival noticed"* is a label. *"A figure at the edge of the market — one of the Thornweave scouts — paused mid-stride. Their eyes met. The scout turned and walked toward the guild quarter"* is a moment.
4. **Would the player sometimes prefer this outcome over success?** (Failure/complication content.) The best complications make the player think *"oh no — oh, that's actually interesting."* If failure is just punishment, it isn't cool failure.
5. **Does this serve the three-beat loop?** Portfolio scan (Beat 1) / curated moments (Beat 2) / aftermath (Beat 3). Which beat does this content serve, and is it pulling its weight?

**When in doubt, write the scene first** — paragraph of prose before template fields. Extract the fields from the scene afterwards. This produces dramatically better content than filling cells in order.

## Player-as-god framing (hard rule)

The player is a god who observes through threads and intervenes indirectly. They never make choices for the character. Every encounter choice, intervention option, or player-facing decision must be a *god action* (whisper, send vision, steady, strengthen, withdraw), never a *mortal action* (say this, go there, fight). The mortal acts according to their personality and the god's influence. **"Let them handle it" is always a valid option.**

If a draft has the player choosing what the mortal does, it is wrong even if the prose is gorgeous. Reframe the choice as god intervention or reject it.

## Active design plans

- [2026-03-09-prose-generator-framework-design.md](../plans/2026-03-09-prose-generator-framework-design.md) — the four-system pipeline architecture. Status: `current` (de-facto; pre-frontmatter convention).
- [2026-04-16-systemic-wiring-guide.md](../plans/2026-04-16-systemic-wiring-guide.md) — Capability 1 (enrichment placeholders + conditional blocks) is the prose-author chapter; the other capabilities define what prose must respect.
- [2026-04-19-rarity-prose-tier-bias.md](../plans/2026-04-19-rarity-prose-tier-bias.md) — rarity-tier bias in prose generation.
- [2026-04-24-thr-253-chain-weakens-prose-polish.md](../plans/2026-04-24-thr-253-chain-weakens-prose-polish.md) — chain-weakening prose polish.
- [2026-04-17-thr-132-mark-reveal-prose.md](../plans/2026-04-17-thr-132-mark-reveal-prose.md) — hidden-mark reveal prose.
- [2026-04-18-faction-encounter-prose-enrichment.md](../plans/2026-04-18-faction-encounter-prose-enrichment.md) — faction-encounter prose enrichment.
- [2026-05-05-canonical-documentation-strategy.md](../plans/2026-05-05-canonical-documentation-strategy.md) — the three-layer model (UL → Canon → Plans) this page is part of.

## Rejected approaches

- ❌ **Pure template-based prose** — replaced by the hybrid layered engine with enrichment placeholders. Static templates without `{placeholder}` syntax produce dead prose; the resolver pipeline exists to make every line graph-aware.
- ❌ **Pure LLM-generated prose at runtime** — replaced by generated-within-constraints with player iteration. Runtime LLM calls violate Determinism (NFP #3) and Tunability (NFP #1).
- ❌ **Hardcoded entity names in templates** — names always come from `{name}` / `{ally:strongest}` / `{rival:strongest}` / `{artifact:weapon}`. A template that bakes in "Kael" is broken.
- ❌ **Single-variant content** — minimum 3–5 variants per key in any content table to avoid repetition. Resolvers use `pickTemplate(templates, seed + offset)` for deterministic selection across variants.
- ❌ **Player chooses what the mortal does** — replaced by player-as-god framing (above). Drafts that put the player inside the character's head must be reframed.
- ❌ **`{actor}` placeholder in routine templates** — replaced by `{name}` (THR-86). All new routine templates use `{name}` for consistency.
- ❌ **Prose without scene-then-fields workflow** — filling template fields before writing the scene produces "label" prose, not "moment" prose. Reverse the order.

## Open questions

- **Prose exemplar TBD** — `Docs/exemplars.md` row for standalone prose is a placeholder ("`<TBD - promote when a clear exemplar ships>`"). Encounter exemplars cover *encounter-embedded* prose, not standalone prose tables. Promote a content-table exemplar (e.g. a single high-quality `BIOME_PROSE` entry, an enrichment-aware vignette) when one ships.
- **Vault Systems freshness** — `Obsidian → Systems/Tonal Bible.md` and `Systems/Narrative Engine.md` may lag code. The first agent who touches them should verify against this page and the UL Prose shard, then either update them or open a `drift-scan` issue.
- **`success_at_cost` outcome wiring** — the outcome ladder includes `success_at_cost`; runtime support is partial (Phase 3). Author content with it in mind; verify before relying on it.
- **Routine prose `ShapedTemplate` coverage** — target is 5 shapes (`svo | aftermath | inverted | compound | fragment`) per event type. Current pool coverage is uneven; new templates should fill the gap.

## Last-reviewed

2026-05-06 by Cowork. Review trigger: monthly, or when any linked plan moves to `superseded`, or when the systemic wiring guide gains a new capability that prose authors must respect.
