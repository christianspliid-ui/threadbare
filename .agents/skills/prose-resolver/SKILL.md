---
name: prose-resolver
description: >
  SPLIT: This skill has been split into prose-pipeline, prose-content-systems,
  and prose-vignettes-and-enrichment. Load prose-pipeline for resolver
  architecture and implementing new resolvers. Load prose-content-systems for
  adding encounter templates, faction content, spell flavor, narrative event
  prose. Load prose-vignettes-and-enrichment for enrichment placeholders,
  vignettes, backstory, encounter history. Triggers on "write prose",
  "new resolver", "prose content", "entity description", "location flavor",
  "agent biography", "vignette", "encounter content", "narrative template",
  "enrichment", "prose pipeline", "backstory".
model: opus
---

# Prose Resolver — Redirected

This skill has been split into three focused skills:

- **`prose-pipeline`** — Resolver architecture, `ProseLayer` interface, resolver registry tables (10 location + 6 actor + 1 faction), composition constants, prose cache, how to write a new resolver, Threadbare writing aesthetic, content authoring checklist, PRNG seed offsets. Load when implementing new resolvers or modifying the prose pipeline.

- **`prose-content-systems`** — Narrative engine (sphere vocabulary, cultural prose), generic effect system (spell `flavorText`/`narrativeTemplate`), encounter content packages (115 templates + 10 faction files), faction reputation system, movement content. Load for day-to-day content addition.

- **`prose-vignettes-and-enrichment`** — Vignette prose (four-part structure, forecast tiers), prose enrichment placeholders (`{name}`, `{artifact}`, conditional blocks, `NarrativeContext`), encounter event nodes (history persistence), backstory strata. Load when working on dynamic prose systems.
