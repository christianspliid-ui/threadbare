---
status: exploration
issue: THR-618 (Flow Web checkpoint owner); informs THR-611, THR-66, THR-573, THR-614
supersedes: none (companion to 2026-07-04-mortal-economy-resource-web.md §Pattern proposal)
---

# Flow Web Exploration — the primitive, and how the economy reaches the rest of the game

**Charter (Christian, 2026-07-04):** "feel free to explore your proposal more, as well as how we could connect the economy better into the game."

This is an exploration doc, not an implementation handoff — it deepens the Flow Web proposal ahead of the THR-618 extraction checkpoint and inventories economy→game integration hooks for the designs that will consume them (THR-611 essence, THR-66 rivals, THR-573 volume, THR-614 notables). No forked-audit pass; audits fire when any piece of this becomes an implementation plan.

## Part 1 — The Flow Web primitive, properly defined

### The abstraction

A **Flow Web** is one instance of a four-part shape:

1. **Stocks** — scalar quantities keyed by flow-kind, hosted as properties on existing graph nodes (a granary's grain, a shrine's sanctity, a garrison's provisions). Properties, never nodes: a stock is data internal to its host.
2. **Conduits** — existing edges annotated as carrying a flow-kind (`trades_with` carries goods; thread edges carry essence; relationship edges carry rumor). Conduits are relationships and stay edges; annotation is an additive edge property.
3. **Tier functions** — per-kind mappings from the private scalar to a small public vocabulary (`scarce | adequate | surplus`; `starved | fed`; `whispered | known | infamous`). **Tiers are the only read surface** other systems and all prose ever touch.
4. **Anomaly rules** — tier transitions, threshold crossings, and imbalance pairs that emit **materialization candidates**: encounter seeds, chronicle entries, phase-runner arc starts.

### Three commitments that keep it Threadbearer

- **Pull-derived, not token-pushed.** No units move through the graph. Each web's tick phase derives net balances from source/sink/conduit topology — cheap, batched, deterministic, fail-soft. We simulate *consequences*, not logistics. The moment someone proposes pathing individual grain carts, the primitive has failed.
- **The web proposes, the curator disposes.** Materialization candidates flow through the existing curation/attention budget. A famine does not interrupt the player; it becomes eligible to be the next chapter. This is the guard against encounter spam and the load-bearing tie to "emergence is the ingredient, authorship is the kitchen."
- **Anomalies are the content; equilibrium is silence.** A web in balance produces nothing. Only change produces story. This inverts the usual economy-sim failure mode (dashboards of numbers nobody reads) into the Threadbearer mode: you notice the economy exactly when it becomes narratable.

### Candidate consumers, and what each one tests

| Consumer | Stocks | Conduits | Signature anomaly | What it tests about the primitive |
|---|---|---|---|---|
| **Trade goods** (P1–P3, the concrete builder) | location stocks per class | `trades_with` | famine, glut, monopoly, severed route | baseline shape |
| **Essence income** (THR-611) | source sanctity/devotion | thread edges, located_at chains | source flowering, desecration, rival drain | secrecy semantics + per-sphere typing — the extraction test |
| **Information/rumor** | knowledge items at actors/locations | relationship edges **and trade routes** | secret reaches the wrong ears; rumor outruns the truth | non-scalar stocks (discrete items), decay semantics |
| **Army supply** (THR-614 follow-up) | provisions at hosts/camps | routes, roads | starving army → forage/mutiny/siege lifted | coupling two webs (supply rides trade conduits) |
| **Faith/pilgrimage** (speculative) | devotion at communities | pilgrim routes | miracle-hunger, heresy bloom | may just be essence's mortal-side view — fold, don't build |

The rumor row hides the best structural discovery: **trade routes double as information conduits.** Caravans carry news with the salt. The economy becomes the world's nervous system — sever a route and a region goes *dark* as well as hungry, which makes economic warfare an intelligence play. One mechanism, two felt consequences. (Feeds THR-66: a rival cutting your routes is blinding you, not just impoverishing you.)

### Extraction criteria (hard, testable — for the THR-618 checkpoint)

Extract the primitive only if trade (built) and essence (designed in THR-611) agree on all three: (a) the tier-function shape, (b) the anomaly→materialization interface through the curator, (c) spotlight budgeting. If essence needs fundamentally different update cadence or secrecy semantics, **do not force it** — two clean systems beat one leaky abstraction.

**Anti-goals:** no general dataflow engine; no web that bypasses the curator; no raw scalars in any UI or prose surface; no per-entity simulation of things in transit.

## Part 2 — Connecting the economy into the rest of the game

Ten hooks, ordered roughly by leverage-per-effort. The first three are the ones I'd act on soonest.

1. **Economy as encounter-context axis (highest leverage — feeds THR-573).** The same authored encounter reads differently in a famine town, a boomtown, a monopoly port. Stock tiers become context dimensions in the context-multiplication grammar — the economy multiplies encounter surfaces *without new authoring*. A tavern dispute over the last cask in a Famine town is a different scene from the same template in a Glut town. This is the cheapest content multiplier available to us.
2. **Doom's economic signature.** Dread should arrive via livelihoods before it arrives via the sky. Each doom archetype gets an economic tell in its early stages — failing harvests for a withering-type doom, hoarding and price panic for a war-type doom — pushed as global tier pressure. The player's earliest doom-reading instrument becomes the market square, not a meter. (Feeds the Doom Archetype Identity pillar of Thematic Pressure; very cheap once P1 tiers exist.)
3. **Rival economic warfare (feeds THR-66 directly).** A scheme family on the shared arc substrate: sour the mines → corner the grain → break the guild → starve the faithful. Counter-play uses the same web the player already understands, and per the nervous-system coupling above, economic attack degrades player intelligence too. Rivals get a way to hurt the player that isn't combat and isn't instant.
4. **Economic protagonists.** Merchant-prince, guildmaster, smuggler, caravan-master as thread-worthy portfolio picks whose story beats ride web anomalies (route won, monopoly broken, fortune lost). Gives Gold/Shadow-aligned ascendants a native storyline the current combat-and-faith-leaning content underserves. (Content wave after P2.)
5. **Economic victory mandates.** Graph-state win predicates already exist; add economic ones — a prosperity mandate (N regions at surplus for M days), a dominion-of-trade mandate (your faithful control the salt roads). Makes a merchant-god run structurally distinct end-to-end.
6. **Ruins → relic economy → World-Soul loop.** Delve yields feed the Spirit/Mind goods classes; fresh ruin frontiers spawn boomtowns; exhausted frontiers bust. And the cycle closes beautifully: **this cycle's boomtown is next cycle's ruin.** Trade infrastructure (great roads, dead ports) persists as World-Soul echoes seeding the next world's geography — the economy becomes one of the ways a run leaves scars.
7. **Thread tugs from livelihoods.** Your threaded agent's village entering Famine is a portfolio-scan tug (Beat 1 material). Cheap: tug rule keyed on tier transitions at threaded agents' home locations. Makes the economy personal without any new UI surface.
8. **Agent careers riding the web.** Where spotlighted, occupations respond to anomalies — miners drift from exhausted deposits, mercenaries flock to hoarding towns, a smith's fortunes track the iron road. Bounded version of TB-074's "agent careers," scoped to spotlight tier only.
9. **Scarcity as Maslow input.** Famine tiers raise need pressure through the existing decision pipeline — desperate people make desperate choices make encounters. (Already sketched in the plan doc; listed here because it's the hook that makes economy → *agent behavior* legible.)
10. **Economy as onboarding surface.** Livelihood words are the most universally legible vocabulary in the game — Famine needs no glossary while Quintessence does. The economy can quietly teach "this world is alive and reacts" in the first session, before cosmology asks anything of the player. Worth one early Ascendant Beat that points the new player at a livelihood shift. (Feeds THR-499 beat pool.)

### What I'd change in existing plans (proposals, not yet applied)

- **THR-573 (volume grammar):** promote economy tiers to a first-class context axis in the multiplication design. I'll carry this into that design pass.
- **THR-66 (rivals):** include one economic scheme family in the initial rival design, not as a later add — it's the cheapest non-combat threat and exercises the shared substrate.
- **Doom archetypes:** add "economic tell per archetype" to the Thematic Pressure scope when that project's design fires.
- **No new projects.** Everything above lands inside existing projects (M3, Thematic Pressure, Content Architecture, Ascendant Beats) — the economy connects *into* the game precisely by not being its own silo.

## Player-surface rule (added 2026-07-04 after user reminder)

Every hook above must name its **player surface** — what the player sees, does, and feels — before it enters an implementation plan. A hook whose only surface is engine state or DebugPanel is not done being designed. Quick check against the ten: (1) context axis → surfaces *in the encounters themselves*; (2) doom tell → market-square prose + chronicle, readable without any new panel; (3) rival schemes → visible scheme arcs + counter-play encounters; (4) protagonists → thread/portfolio UI; (5) mandates → mandate UI already exists; (6) relic economy → delve encounters + boomtown prose; (7) tugs → existing tug UI; (8) careers → agent detail + chronicle; (9) Maslow → shows up as agent behavior in encounters; (10) onboarding → an Ascendant Beat. None of these is a dashboard; all of them are play.

## Sequencing note

Nothing here jumps the queue. P1 (THR-615) builds tiers; the hooks activate progressively: doom tells and thread tugs need only P1; context-axis needs P1 + THR-573 design; economic warfare needs P1 + THR-66; mandates and protagonists ride P2–P3; the World-Soul loop is Twilight-phase work. The Flow Web extraction decision stays parked at THR-618 where it belongs.
