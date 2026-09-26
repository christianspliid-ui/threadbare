# Brainstorm companion — the seeded item generator (THR-1570)

Companion to [`2026-09-26-thr-1570-seeded-item-generator.md`](2026-09-26-thr-1570-seeded-item-generator.md). Written by the design lane (run 2026-09-26b) in the same pass as the plan. The map's rulings (THR-1236, THR-1227 carve-up) are settled and not relitigated here; this records the alternatives weighed for the decisions the plan itself had to make.

## Vision premises invoked

- **Systemic over scripted.** The world makes its own remarkable things; the author writes the *ideas*, the world supplies the who, where and when.
- **Narrative over mechanical perfection (NFP #5).** An item is an idea with a price. The prototype's strongest items all carry a catch you would hesitate over.
- **Honesty of the surface** (UI Law 56's spirit, the THR-1236 ruling). An item never promises what the engine does not do — the validator and read-back make this a machine property rather than an authoring virtue.

## Decisions weighed

### 1. How is a masterwork's band decided?

- **Chosen — the work's own final checkpoint band.** A critical success makes a Mythic thing; anything else that completes makes a Storied one. Diegetic (a great day at the forge shows in the thing), uses dice the world already rolled, adds no randomness, and cannot shift another roll.
- *Flat roll* (`MASTERWORK_MYTHIC_CHANCE`) — simpler, but disconnected from what happened and consumes a random draw.
- *Maker's reach capability* — the most "skill matters" option, but capability's curve is mid-refit (THR-1575/THR-1581, parked on Christian's at-cost ruling); building on it now would couple this plan to an unsettled number.
- *Always Storied* — the authored hint's `tier: 2`. Safe, but a masterwork could then never be remarkable.

### 2. What does "pool share per band" mean when the only minting point is masterworks?

- **Chosen — rule the value now, ship the constant with its reader (THR-1626).** A constant nothing reads is a tunable that tunes nothing.
- *Ship it now at the ruled value with no reader* — satisfies the ticket's wording, fails its purpose; a later executor would reasonably delete it as dead.
- *Reinterpret for masterworks* (share of masterworks generated vs drawn from the authored catalog) — gives the constant a reader, but a mortal "making" *Hollowfang* (a named authored item) is incoherent.

### 3. Should generated items be drawable as reward templates?

- **Chosen — no; minted instances (generated or `craftedBy`) are excluded from the template carve.** A generated item is unique and named; cloning "The Unquiet Blade" onto a stranger breaks the fiction. The same exclusion fixes the existing leak where every empty masterwork is a reward template today.
- *Leave the carve alone* — THR-1234's "drawable with no engine change" was framed for the reward-draw point, where the draw *itself* mints; for a masterwork it is a bug.

### 4. The *Storied* word

- **Chosen — one meaning ("has a history"), made consistent by rule:** Storied-and-up generated items are born with the trait; band = the promise, trait = where the history lives.
- *Rename the trait* (e.g. *Seasoned*) — cheap, but loses the resonance, touches shipped UI (the Fight Advantage *Storied arms*, rulebook §122) and the words are genuinely about the same thing.
- *Rename the band* — `rarity.ts` is shared by actors, locations and actions; far wider blast.

### 5. Where do the words for "what it does" live?

- **Chosen — derived at render from `effects[]` by a pure describer.** Tier advancement scales `stat_contribution`, so stored words would go stale.
- *Stored at mint* (the prototype's approach) — fine for a one-shot document, wrong for a living item.
- *Extend to authored catalog items now* — valuable, but 26 of 41 authored conditionals are passives in disguise and would read oddly; a separate call.

### 6. Masterwork-eligible cores

- **Chosen — a core is masterwork-eligible when it authors a `made` provenance line naming the maker.** The maker is alive; the prototype's lines assume a dead owner. Eleven cores qualify; the found-only nine wait for THR-1626.
- *All cores at masterworks* — a mortal cannot "make" a saint's relic or salvage from a disaster.

### 7. Anti-repetition in a world without batches

- **Chosen — per-world decay counted off the graph**, on the core and on core+signature. The prototype's "max two per batch" has no batch to count in a live world.

## Tensions surfaced

- **Rarity of the payoff.** ~3–4 masterworks per 150 ticks means most players will meet few generated items in a session until THR-1626 lands. Accepted: the masterwork is the natural first point (it is empty today), and rarity suits a remarkable object.
- **Vocabulary drift.** Three shapes have shipped since the prototype. The plan makes the read-back — not the prototype's table — the authority, so drift is caught at CI either way.
- **Seizure.** Masterworks are seized by rivals (census). A cursed or bargaining masterwork changing hands is good story; nothing here needs to special-case it.

## Rejected outright

- A new `generated_item` node type — CLAUDE.md's no-invented-node-types rule; an `artifact` with a property bag suffices.
- Free composition as the default — the THR-1236 ruling.
- Generating Mundane items — the THR-1236 ruling.
