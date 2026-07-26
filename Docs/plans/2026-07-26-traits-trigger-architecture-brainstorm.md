# Brainstorm companion — Traits trigger architecture

## Co-design session record (2026-07-26, Christian live in chat)

The design was built in dialogue, not extracted from a doc: Christian rejected pure execution of the prior investigation ("take over the design work … design it with me, dont just execute"). Decisions made live: game-wide scope confirmed ("a system you can use for all game objects … that allow these systems to react in particular ways if they connect with another object with a certain trait"); visibility canon expanded to *all* object traits in the interface; god-earned traits confirmed with the roguelike framing; relationship traits ("a very cool variant") and destiny-as-forward-contract approved; Eldritch Horror wiki research commissioned and performed in-session (Assets + Conditions pages; his #relic draw example verified as EH's core selector verb). The variant-shape question from the prior investigation was closed by mapping it onto the already-gated WS0 design rather than inventing a parallel mechanism.

**Plan:** `2026-07-26-traits-trigger-architecture.md` (THR-786/787/788). The investigation was run by an independent session (pasted verbatim into the design session 2026-07-26); its claims were re-verified against source before any design decision. Grill-me skipped with rationale: the pasted investigation + the live Nudge Model program context served as the extraction pass.

## Alternatives considered

- **A new unified predicate DSL** (replace `has_trait:` strings with structured objects everywhere) — rejected: four production content files already speak the string sugar; breaking authored content to achieve purity inverts the additive doctrine. Chosen: keep the sugar, unify the *resolution*.
- **Runtime tag→id resolution per evaluation** — rejected: per-tick string matching over trait names is avoidable work and hides dead refs. Chosen: load-time `TraitRefIndex` + warn-once + `validateTraitRefs()` so dead triggers are *visible*, not just tolerated.
- **Declaring the template gate fields in this ticket** — rejected: `unifiedAction.ts` has 278 importers and THR-773 (WS0) is already Ready for Dev editing the same type. Two concurrent editors on the highest-impact type file is the collision the mutex system exists to prevent. Chosen: the field declaration rides the WS0 PR (addendum), this ticket lands the resolver the fields consume.
- **Injected-steps variants** — rejected for now (see plan table): the Nudge Model derives variance from hands/forecast/prose; structural step injection multiplies authoring and testing surface for a story need nobody has documented. Explicit revisit-trigger recorded instead of a vague "later".
- **Fixing the category/subcategory drift inside the unification ticket** — rejected: the defect fix is mechanical, parallel-safe, and shippable today by a sonnet-class run; bundling it behind an engine design delays a live prose defect (titles never rendering) for no reason. Split to THR-787.
- **Renaming `subcategory` → `category`** (the other direction) — rejected: definitions are the canonical store and there are more definition sites than read sites; also `category` on the node level is used by other node families differently.

## Tensions surfaced

- **Trigger richness vs authoring honesty.** The trigger layer is only "the main flexible trigger" if content actually references mintable traits. Resolution: the kill criterion makes dead triggers measurable (`validateTraitRefs()` after WS5 wave 1), and WS1's authoring step requires hooks to name producer-minted traits.
- **Program coupling vs general substrate.** Traits serve the whole game, not just encounters — but staging them under the THR-772 epic risks reading as encounter-only. Resolution: the resolver lives in `engine/traits.ts` (neutral home); the epic parenting is coordination, not ownership; the wiki page (THR-788) documents the full producer/consumer map, not just encounter hooks.

## Vision premises invoked

The two-way thread (the world reacting to who a mortal *is*), replayability ruling (different trait × different god = different encounter), failure-is-plot (scar/condition traits as story residue feeding future triggers).
