# Brainstorm companion — Companion attachments (THR-1096)

What was rejected and why, so the executor and future sessions do not re-litigate.

## The Eldritch Horror reading (source: the Ally wiki page, read live this session)

Four properties carried over: allies are individuals who join you; ally bonuses are *small but always on* (explicitly contrasted with items' situational bonuses — this is why decision 3 bans situational triggers in v1); two tiers exist (generic profession allies with a shop Value vs named Character allies from the stories → our template/unique split); and allies are a currency of loss (Serpent Crown and Blight *sacrifice* allies → our `stealable`/`lured_away` vocabulary and the rule that every departure is a story chip).

What was deliberately **not** carried: EH's shop (allies bought from the reserve by Value). Threadbare mortals do not shop; companions arrive through story (encounters, actions like hire-mercenaries) — the Value column became rarity tier + pool weighting instead.

## Rejected: companion as an `actor` node (the 2026-03-10 retainer model)

The original attachment design's sixth category modeled retainers as "existing actor nodes… independent agents whose presence at the same location enables specific encounter types or provides adjacency bonuses." Christian's 2026-08-12 ruling is the direct opposite ("they are not an agent, just a part of the retinue that gives a bonus"), and the engine agrees with him: an actor/individual node is swept up by agent decisions, movement, encounter awareness, faction seeding, and the spotlight tiers — a "not really an agent" actor would need exclusion flags in every one of those systems, each a standing bug surface. The category was never implemented, so nothing is being torn down; this plan records the supersession.

## Rejected: companion as an `artifact` node riding `possesses`

Tempting — zero engine change (the capability walk already reads `possesses`), the reward pool's artifact case works unmodified, loss conditions exist. Rejected because the node type leaks: entity-visual kind-routing opens the *artifact sheet* for a person (Law 21's wrong-kind link, "a dead link that looks live"); the inventory lists Jorun between a rope and a week's provisions; artifact-targeting actions (steal, appraise) acquire a person arm nobody designed; attachment tier advancement would level people like swords. Every leak is invisible at the schema and embarrassing at the surface — the exact class the THR-1082 session was called to fix.

## Rejected: companion as a per-instance `trait` node on `has_trait`

Conditions prove the machinery (duration, contributions, expiry) — but trait nodes are shared definitions referenced by many bearers, and a named companion is an instance owned by one. Minting per-instance trait nodes pollutes the definition space every trait census, sweep, and producer test enumerates (the THR-800 closed-set pins would all need carve-outs). Cost lands on every future trait tool instead of on this feature.

## Chosen: new `companion` node type + `accompanies` edge

The honest graph model under the load-bearing rules: the bearer↔companion relationship is an edge, not a property; the new node type gets the full design (category, properties, edges, tick participation, traces) the rule demands, in the plan itself. The price — two union members on a 125-importer type and a two-site walk extension — is small, explicit, and compiler-guided.

## Tension held: the cap vs authored intent

`COMPANION_MAX` exists so pool-drawn companions cannot stack into a stat pile, but a hard cap would make an authored rescue scene fail bookkeeping ("your retinue is full, the wanderer shrugs"). Resolution: the *pool* respects the cap, *authored grants* exceed it. If content routinely exceeds it, the kill criteria say retune the number rather than evict — eviction without story is a silent departure, which decision 5 bans outright.

## Tension held: generated names vs authored uniques

All-generated names risk companions blurring together; all-authored libraries cannot scale. The template/unique split holds both: professions mint named instances (the name generator is what makes a pool draw feel like a person), uniques are authored one-offs for story beats. If generated-name companions still read as stat-sticks (kill criterion 1), the fix is richer `goodFor` lines and join sentences — content, not schema.

## Deferred, deliberately

- **Companions as scene cast** — a companion appearing in their bearer's encounter prose is the obvious next step; needs the cast system's placeholder rules and is pure upside later. Nothing in the schema blocks it.
- **Companion opinions/loyalty** — EH allies have none; adding a loyalty dial re-opens the agent door Christian closed. If a companion should ever *act*, that is a story event authored in an encounter, not a simulated stat.
- **Tags widening encounter eligibility** ("knows every ford on the north roads" gating river encounters) — real design work touching the eligibility pipeline; explicitly out of v1 per decision 3.
