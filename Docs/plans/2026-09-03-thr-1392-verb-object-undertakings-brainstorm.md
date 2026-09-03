# Undertakings as verb × object type — Brainstorm Companion

> Companion to `Docs/plans/2026-09-03-thr-1392-verb-object-undertakings.md`. Alternatives considered, tensions surfaced, Vision premises invoked, and the pre-design debate's trade-off card. Written alongside the plan.

## How this started

Christian approved the undertaking factory's pilot brief with a condition — *keep the framework systemically simple and scalable; the complexity must come from how it connects to other systems* — and a question about whether the kind × CRUD approach was well mapped. The assessment found the grid half right: content clean, engine bespoke, the D column hollow for five of eight rows, `objectShape` prose nobody reads. Then Christian named the deeper thing: *"'burn the charts' seems a way too specific undertaking, defined by something that doesn't even systemically exist. A chart, if in the game, would be an attachment… the undertaking should be a generic 'destroy attachment' undertaking with flavour from the attachment and the destroyer."* That is a different model, not a refactor of the old one, so the pilot paused and this design pass began.

## First-pass framing I considered

"Typed objectShape plus four generic primitives" — the refactor of the shipped model, keeping the 64 templates and making their mutations generic. It survived exactly until the census: 58 of 64 templates target a settlement rather than the object they act on. The object was never in the model; typing its shape would have typed a word in the prose. The model has to start from the object.

## Alternatives considered

**A. Keep authored kind-row templates; fix the hollow destroys and the bespoke arms (THR-1392 as first filed).** Rejected as the destination, kept as the migration's first step: the object-type registry and the resolver land behind a flag while the templates stay live, so the hollow destroys get real semantics on day one either way.

**B. Verb × object type (chosen).** Six verbs over eight object types; templates are derived cells; flavour from the object and the actor; overrides where a cell earns a beat.

**C. Verb × object, no overrides — fully generated prose.** Rejected on the taste profile's own anti-pattern (*pure template-based prose — voice flattens across instances*) and Tension §2's drift signal. The advocate for A made this the debate's strongest point and it stands; the answer is not to refuse generic prose but to bound the authored layer (`CELL_OVERRIDE_MAX_PER_CELL`) so it flavours cells rather than becoming packs.

**D. Keep both models permanently — packs for "chapters", cells for "ambient".** Rejected: two content models is two of everything (contract, gates, proof, Package View) and the census showed the packs' variety ceiling is the pack file itself. Overrides on cells give the authored beat without a second model.

**E. Object types as a taxonomy over attachments only** (the literal reading of "destroy attachment"). Rejected: a settlement, a route, a company and a faction are not attachments; they are nodes and edges with their own systems. The object registry names all of them; attachment is one type.

## Pre-design debate — trade-off card

Two advocates (Fable, cold context, Vision files and the canon page only), one cross-examination round. Card written by the design session, not the advocates.

- **Path A (authored templates) costs:** a variety ceiling equal to the pack file (28–29 of 64 fire); an engine that grows one arm per object shape (13 hint types + 5 template-id arms today); the object modelled as prose (58/64 target a settlement); hollow writes (15 `no_mutation`); reachability by list position. **Buys:** a place for a designer's judgment on every act (the trade-route row's "a blockade suspends rather than deletes" is taste in a template); the anti-pattern *pure template-based prose* stays out by construction; §6 additive-over-destructive is honoured (nothing refactored).
- **Path B (verb × object) costs:** a substrate migration (registry, resolver, 64 templates to cells or retirement, canon and rulebook rewrites); the flatness risk Tension §2 names, now the central quality risk instead of a marginal one; tier derivation that must be right per object type; a new gate ("every cell with an object fires") to keep honest. **Buys:** an act space that scales with the world (owned locations 112 → 147 and companies 0 → 44 in one seed's 300 ticks become targets); every completion writes through the object's own system so a hollow destroy is impossible by construction; reachability as "an object of this type someone else owns is in range"; one resolver instead of a switch; NN #4 repaired for intelligence records.
- **Vision premises favouring A:** `03-design-tensions.md` §2 ("authorship is the kitchen"); `taste-profile.md` anti-pattern *pure template-based prose*; `02-non-negotiables.md` §6.
- **Vision premises favouring B:** `02-non-negotiables.md` §4 (the graph must actually be a graph — objects, not prose); `00-north-star.md` (choices accumulate into something the player has opinions about — *Hawkgate's* road, not a template's); `03-design-tensions.md` §2 read the other way (emergence is the ingredient — the pack has no ingredient when the world has no chart).
- **Open questions each path must answer:** A — how do 64 fictions stop being the ceiling without becoming 640? B — where exactly does authored taste live so voice does not flatten (answer in the plan: verb line-sets with object-lore slots, cell overrides bounded per cell, the register scorer gating the flip)?

## Decision

B, as the plan's verdict. The debate did not change the destination; it changed the plan in two places: `CELL_OVERRIDE_MAX_PER_CELL` and the register-scorer gate on composed lines before the flag flips both exist because the A advocate's flatness argument is right as a risk even though it is wrong as a verdict. Christian's decision on the plan is recorded on the ticket.

## Tensions surfaced

- **§2 systemic emergence vs. authored moments** — the whole debate. B moves the authored layer from "the act" to "the flavour of the act on this object", which is where the tension says authorship belongs: the kitchen, not the ingredient.
- **§1 expansive ideation vs. tight plans** — the expansive move (a grammar) is committed conservatively: behind a flag, both models live until the census passes on cells, the retirement list reviewed in chat.
- **§4 legibility vs. mystery** — untouched; verbs render as words on the sheet as verbs did.

## Vision premises this plan leans on

- **Everything is a graph node/edge** — *this plan's version:* an undertaking acts on a node or an edge the world has, never on a noun in a sentence.
- **Narrative over mechanical perfection** — *this plan's version:* the flatness risk is the quality bar; the register scorer on composed lines is the measurement, and cell overrides are the release valve.
- **Expansive design, conservative implementation** — *this plan's version:* the grammar is the expansive idea; the flag, the retirement review and the acceptance gate are the conservative implementation.

## Taste profile touchpoints

- **Confirms** *state facts, never encode them* — "Ind_7 blockades the Thornhaven–Hawkgate Road" is a fact the graph can say once the road is an object.
- **Dodges** the anti-pattern *pure template-based prose* by construction, not by hope: slots filled from the object's own lore, per-cell overrides bounded, scorer-gated.
- **New soft pattern proposed:** *flavour comes from the object and the actor, not the act* — the christening machinery was the first instance; verb cells are the second. Promote to a strong opinion if the pilot on cells confirms it.

## Branches not taken

- A seventh verb, *trade/exchange* — the economy already has its own machinery; folding it in would be a second economy.
- Object types for *people* (kidnap, assassinate) — the reactive loop and the encounter pipeline own acts on mortals; an undertaking acts on what mortals *hold*. Named so nobody re-derives it.
- Deleting the packs in slice 1 — never before the cells prove live; the legacy flag exists so the old shape blocks nothing while the new one is measured.

## Open questions

None left for the executor. Two are Christian's, asked in chat with the plan: does the six-verb set read right in game terms (found · improve · use · seize · undo · survey — `hold` was dropped on the critic's finding that control is its own execution mode, and `use` added for the self-spends the kind rows already distinguished), and does he want the retirement list before or after slice 1 lands.

## What the independent critic changed

The critic (Fable, with the code) accepted the direction with changes and found two blocking gaps the debate had not: `hold` was never a completion verb (control never reaches the mutation layer), and possessions and edge objects had no owner seam for the motive gate. Both are resolved in the plan (the object handle, `resolveTargetOwners` reading `possesses` and edge sources). It also caught that the "NN §4 repair" of intelligence records would have moved an unread property into a lossy edge — so intelligence is deferred with its reader rather than migrated — and that the flatness mitigation was a promise until `resolveUndertakingProse` became a deliverable. The full findings are in the plan's § Independent critic review.

## Brainstorm Status

Complete enough to hand off, pending the critic review and the forked audits.

---
*captured 2026-09-03 — design session, Claude Code*
