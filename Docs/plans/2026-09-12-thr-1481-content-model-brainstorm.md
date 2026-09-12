# Content model (THR-1481) — Brainstorm Companion

> Companion to `Docs/plans/2026-09-12-thr-1481-content-model.md`. Alternatives considered,
> tensions surfaced, Vision premises invoked. Written alongside the plan.

## How this started

Christian asked (2026-09-12) for an assessment of how easy the content model is for authoring agents to combine across encounters, undertakings and the in-flight appointment primitive, and named the shape he wanted: a standardized tagging system (`#weapon #sword #magical #entropy` on an item; an entropy encounter drawing random `#weapon #entropy` rewards from the content table), used across every content type so the agent skills "just work". The assessment ran three exploration sweeps (tagging schemas per content type, composition paths, content UI) and found the tag-filtered draw already live for attachments and nowhere else, five tag dialects with no vocabulary, no tags on encounters or undertakings, literal-id references that rot, and no content registry beside the world-object one. He answered *"yes, this is it … start the design immediately."*

The grill-me pre-pass was not run separately: the assessment chat *was* the concept extraction, with the director's verdict on the assessment as the synthesis. This companion records the alternatives that were weighed in the assessment and in drafting.

## First-pass framing I considered

"Add a `tags` field everywhere and a `TagRegistry` const." Too narrow: it would have produced a sixth dialect with a lint, and left the referencing rule (how content names content) as literal ids. The assessment's second sweep showed the rot is in the *references*, not only in the tags; the query primitive is the piece that makes tags do work. It also missed that world objects already have a registry with a generator and a contract test — the content registry is that pattern's sibling, not a new idea.

## Alternatives considered

**A. Tags as a free `string[]` with a lint that warns.** Rejected: the repo already has this in five spellings and two documented rot incidents (THR-844's 67/115 dead families; THR-1146's "a filter matching nothing is a silently empty pool"). Warn-level tags are the current state.

**B. One giant `ContentTag` union hand-written in `src/types/`.** Rejected: the reach and sphere axes would restate `REACH_DOMAINS` and `SPHERE_NAMES`, which is exactly the two-vocabularies drift THR-1212 spent a wave removing. Derived axes import the unions; authored axes are the only hand-written part.

**C. Tag the node properties with a narrowed TypeScript type (`tags: ContentTag[]` on `PossessionNodeProperties`).** Rejected for saved worlds: a node bag carrying an old string would fail to type at load and the engine must be fail-soft (NFP #4). The vocabulary is enforced on catalog *literals* by contract test and gate; the entry types tighten when the ratchet empties.

**D. Make `censusTag` the cross-content classifier and wire it to runtime.** Rejected: it carries `reach` and `scale` only, on six of ~20 types, and `reach` is a tag axis while `scale` is a typed enum. Folding it in is cleaner than promoting it; THR-477's open question (derive vs persist reach) closes as "authored on the axis".

**E. Replace `RewardPoolRecipe` with `ContentQuery`.** Rejected for this wave (NFP #6): 840 occurrences across 74 files use the recipe shape and the step route shares one draw with the reaction route. The recipe stays and gains a projection; the resolver sits under both. A later wave may retire the recipe by defect evidence.

**F. Keep `encounterFamily` as an id-prefix family registry.** Rejected: a prefix is a spelling accident, not a game word, and `encounterSeeding.ts` says so in its own header ("no separate family registry"). Family tags are game words; the alias table carries the prefix for one release.

**G. Fold the nudge deal tags (`might`, `finesse`, …) into the reach axis.** Rejected this wave: they are not a spelling of `ReachDomain` (eight words, no bijection), and the nudge dealer scores on them today. Recorded as a known seam on the canon page; unifying is chartered by defect evidence.

**H. A wayfinder map instead of two plan docs.** Considered under the design-session scale gate. Rejected: the assessment put the decisions to Christian with a recommendation and he approved the shape; what remains is execution sequencing, which the slices carry. The one genuine fork (codex as content sheet) is in the sibling plan and invites veto rather than blocking.

## Trade-off Card

- **Path A — projections from typed fields.** Costs: two sources of a tag (authored + projected) that a test must reconcile. Buys: no double-authoring, no drift between `reach: 'iron'` and `#iron`, and a typed field stays the truth for the systems that already read it.
- **Path B — author every tag, retire typed fields.** Costs: rewriting `reach`/`sphereAffinity` readers across the encounter cache and scoring; a wide-blast change on a 476-importer type. Buys: one place to look.
- Vision premise favouring A: additive over destructive; the encounter cache's typed reads are load-bearing.
- Chosen: **A**, with the contradiction test as the price.

## Tensions surfaced

- **Expansive vs tight.** A closed vocabulary is tight by design (the encounter-catalogs preamble: the AI structures better from a short list it must choose from). The tension is real for `form` tags, where authors will want `#dagger` when `#blade` exists. Navigated by making axis extension a design-session decision recorded on the canon page — the same governance the six encounter catalogs already have — and by the DEAD-tag badge, which prunes the other direction.
- **Gate rigor vs authoring velocity.** A fatal empty-query gate can block a batch. Navigated by the ratchet for legacy content and by `__DEBUG.queryContent` / CLI `query`, so an author can ask "does this match anything?" before the gate does.
- **One vocabulary vs one release of aliases.** `encounterFamily` prefixes and bare tags need a bridge. Navigated by named, shrinking alias and ratchet tables that the tests fail in both directions.

## Vision premises this plan leans on

- **Creativity lives in the combination, not in inventing structure per encounter** (encounter-catalogs preamble, 2026-07-31). This plan's version: a prize named by kind and tags is a combination; a prize named by id is a one-off.
- **Types are structure; gates are patches** (THR-1156). This plan's version: the vocabulary and the registry are types and data; the gates prove they are used, they do not substitute for them.
- **A capability is alive only when the harness names it** (THR-1479 / THR-1299). This plan's version: the harness table is Done-whens.

## Taste profile touchpoints

- Strong opinion: **closed vocabularies with generated catalogs** (anchor catalog, setting classes, consequence draw). Followed.
- Strong opinion: **no key:value or raw keys on player surfaces** (Laws 14, 16). The codex filter and attachment chips render tags as game words with tooltips, never as `#weapon` literals.
- Anti-pattern: **a second copy of a predicate** ("gate and engine cannot disagree", THR-1146). Followed: every gate calls the resolver.

## Open decisions deliberately left to the executor

- The exact seed set of `form` and `family` tags, classified from the 118-value census under the stated rule; recorded as a table in the closing comment.
- Family tag names for the eleven faction families (game words, not id spellings).
- Whether the anomaly catalog's "shared via tag matching" claim is made true (wire a `ContentQuery` consumer) or deleted from the header; either is acceptable, the header must be true.
