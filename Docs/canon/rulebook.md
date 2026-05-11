---
domain: rulebook
last_reviewed: 2026-05-11
reviewer: cowork
ul_shards: [Cosmology, Agents, Encounters, Prose, Graph, Process]
status: live
---

# Canon — Rulebook (Threadbearer Rules of Play)

> What the game does to the player on a turn, and what the player does back. Written from the player's seat. Synthesis only — terms live in UL, current spec lives in the per-domain canon pages, the *why* lives in Vision. The status flag on every rule answers "is this real yet?"

## How to read this page

**Status flags.** Every rule statement is tagged inline:

- `[IMPL]` — implemented in current code; behaviour matches the description. Where a number is cited, the constant name + path is given so the drift check can verify it.
- `[DESIGN]` — designed in a plan doc; not yet implemented, partially implemented, or implemented under a different name. The plan is cited inline.
- `[OPEN]` — open question. The rule is not yet decided. Tracked in the Open Questions section at the bottom of this page.

**Stale-source warning.** The rulebook is the *synthesis* of the rules of play, not a definition. When this page disagrees with the [Ubiquitous Language](../ubiquitous-language/README.md), UL wins on terms. When this page disagrees with a per-domain canon page (`cosmology.md`, `encounters.md`, etc.), that canon page wins on current spec. When this page disagrees with code, the code wins on `[IMPL]` claims — but it is also a drift signal, surfaced by the Phase 2 lint scan. The rulebook is meant to *invite* such disagreement; that is its job.

**Authority-boundary footer.** Every section ends with an explicit footer telling the reader where to read next.

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/<Shard>.md
Spec: Docs/canon/<domain>.md
Why: TheFantasyWorldSimulator/Vision/<file>.md
```

---

## 1. What You Are

You are an **Ascendant** — a mortal who climbed the long ladder, transcended, and now looks down at a world full of mortals still on it [IMPL — `ActorType` includes `'ascendant'` in [src/types/agent.ts](../../src/types/agent.ts)]. You are not the protagonist. You will never be. The protagonists are the mortals below you, and the entire game is built on the gap between what they choose and what you can nudge them toward.

You arrive carrying a remembered identity — a hunger that defines you (Witness, Maker, Sovereign, others), a domain you favour, a sphere that fuels you [IMPL — `AscendantIdentity` in [src/types/remembrance.ts](../../src/types/remembrance.ts)]. That identity is the kind of god this run will discover you to be. It is not a class. It is a starting taste; the world will reveal whether you keep it.

You see the world from a height. You do not move on the hex map — your avatar does, if you have one, and you can manifest into the world locally, but your primary instrument is influence at a distance [DESIGN — Avatar manifestation in [Docs/plans/2026-03-17-world-state-and-hex-actions-design.md](../plans/2026-03-17-world-state-and-hex-actions-design.md)]. You watch threaded mortals, you spend sphere-typed essence, you make small interventions that shift probabilities, and you live with the outcomes.

You are not omniscient. You are not omnipotent. You are not a chess player and the mortals are not pieces. You are a god — and the question every run asks is *what kind*.

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Agents.md (Ascendant, Avatar, Thread)
Spec: Docs/canon/agents.md, Docs/canon/cosmology.md
Why: TheFantasyWorldSimulator/Vision/00-north-star.md, TheFantasyWorldSimulator/Vision/02-non-negotiables.md (§1 — The player is a god, not a protagonist)
```

---

## 2. What the World Is

The world is a **hex map** of procedurally generated terrain — biomes, settlements, ruins, leylines, places of power [IMPL — `HexTile` in [src/types/gameState.ts](../../src/types/gameState.ts), generation in `src/engine/worldGeneration.ts`]. Hexes are *not* graph nodes; they live in `GameState.tiles[]` and mutate via `HexMutation` [IMPL — load-bearing decision, see [CLAUDE.md](../../CLAUDE.md) Load-Bearing Architectural Decisions]. Everything else — actors, locations, sublocations, factions, cultures, artifacts, traits — is a node in the world graph, connected by typed edges [IMPL — [src/types/graph.ts](../../src/types/graph.ts), 244 nodes / 371 edges in `world-model.json` at world bootstrap].

The world is populated by **mortals who pursue their own goals**. Agents wake each tick, look at their needs through a six-layer Maslow pipeline (survival → safety → belonging → esteem → self-actualization → transcendence), and pick an action through seeded probabilistic scoring [IMPL — Maslow pipeline in `src/engine/agentDecision.ts`; rejected approaches were utility-function AI and behaviour trees]. They are organised into **factions**, **cultures**, and ad-hoc **groups**, each layer mutating the kinds of choices its members make [IMPL — actor types in [src/types/agent.ts](../../src/types/agent.ts)].

The world remembers. Beneath every cycle is the **World-Soul** — a persistent ledger of Fundament (coefficients tuned by prior runs) and Resonance (memory fragments) that seeds the next world's generation [DESIGN — [src/types/worldSoul.ts](../../src/types/worldSoul.ts) and the Echo System in [Docs/plans/](../plans/) (search: world-soul); Twilight Phase and echo selection partially implemented]. Above every cycle is the **Doom Clock**, ticking toward an Unmaking that *will* arrive [IMPL — `DoomClockState` in [src/types/doomClock.ts](../../src/types/doomClock.ts)]. Between them, this run plays out.

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Graph.md (HexTile, Node, Edge), Docs/ubiquitous-language/Agents.md (Faction, Culture, ActorType)
Spec: Docs/canon/agents.md, Docs/canon/engine.md
Why: TheFantasyWorldSimulator/Vision/00-north-star.md (the texture of a good run), TheFantasyWorldSimulator/Vision/03-design-tensions.md (§2 — systemic emergence vs. authored moments)
```

---

## 3. The Three-Beat Turn

The world is **turn-based**. The clock does not advance until you say so [IMPL — tick orchestration in `src/engine/orchestrator.ts`, single-step per player command]. One tick of world time is two in-world hours; twelve ticks make one in-world day [IMPL — `TICKS_PER_DAY = 12` in [src/data/attention-constants.ts:14](../../src/data/attention-constants.ts)]. Each turn is a rhythm of three beats:

**Scan.** You look across your portfolio of threaded mortals. The game surfaces signals — a thread under stress, an encounter cresting, an attention tug — but the *choice* of whose story to watch is yours [DESIGN — Attention Pool and Thread Tugs partially implemented; portfolio surface in design — `ATTENTION_BASE_CAPACITY = 6` in [src/data/attention-constants.ts](../../src/data/attention-constants.ts), full portfolio UI [DESIGN — Attention Tier Model project]]. The scan exists so you have a portfolio at all. Without it you are a visual novel; with it, you are a god looking down.

**Curated moment.** You enter a mortal's situation. The game opens a framed encounter — concrete, particular, sourced from this mortal's specific entanglements. You read prose, you weigh options, and at the critical step you choose a divine intervention from a contextual menu [IMPL — `UnifiedActionTemplate` resolution in `src/engine/orchestrator.ts`; ActionDrawer in `src/components/ActionDrawer/`]. *Do nothing* is always valid. The moment is *the chapter*, not just a roll — three to six per session, not three to six per tick [DESIGN — encounter pacing target in [Docs/plans/2026-05-04-encounter-experience-design-plan.md](../plans/2026-05-04-encounter-experience-design-plan.md)].

**Aftermath.** Resolution lands. The world graph mutates. Threads thicken or fray. Aftermath prose closes the chapter. You sit with what happened *before* you scan again — this beat has the lowest action load and the highest narrative weight [IMPL — aftermath phase in encounter pipeline; reaction selection in `src/engine/encounter*`]. Time advances. Then the next scan.

Order matters. Scan before encounter means you *chose* to look. Encounter before aftermath means consequences are anchored in a moment you witnessed. Aftermath before the next scan means the world has moved before you look again — you do not get to freeze it.

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Encounters.md (Encounter, Aftermath, Reaction)
Spec: Docs/canon/encounters.md
Why: TheFantasyWorldSimulator/Vision/01-core-loop.md (the entire page)
```

---

## 4. What You Can Do

Every action you take is one of **five verbs**: Create, Find, Change, Destroy, Control [IMPL — CRUD verbs throughout `UnifiedActionTemplate`, see [src/types/unifiedActions.ts](../../src/types/unifiedActions.ts)].

- **Create** brings something into existence (an artifact, a settlement, a bond).
- **Find** perceives or reveals — search the world, lift fog, surface what was hidden.
- **Change** is a one-shot modification for a one-time cost. Fire and forget.
- **Destroy** removes, corrupts, scatters, or erases.
- **Control** is the god-game signature — a *sustained* commitment, with ongoing essence drain or upkeep, contestable by rival gods who meet the prerequisites [DESIGN — Control sustain models (essence drain, state threshold, ritual investment) in [Docs/plans/2026-03-17-world-state-and-hex-actions-design.md](../plans/2026-03-17-world-state-and-hex-actions-design.md); contestation via `usurp`/`destroy` reactions partially specified].

**You can't Update what you haven't Read.** Find gates Change/Control. The natural chain is Find → Change/Create → Control [DESIGN — gating partially enforced via template prerequisites; not yet a hard runtime invariant].

Every node you focus on in a detail view — actor, location, sublocation, hex, artifact — becomes an **action target**. The ActionDrawer fills with templates filtered for that target through the **Generalized Action Targeting** cascade: node-type → subtype → traits → sphere → essence → range [IMPL — `getTargetActionSlots()` in [src/engine/](../../src/engine/) (search for the function); 119+ unified templates across CRUD, encounters, divine, location, attachment, sublocation, hex categories]. No fixed slot count. No capped action list. The space of "what is doable here" is data-driven and open-ended [IMPL — rejected approach: AgentWheel and fixed action slots, see [CLAUDE.md](../../CLAUDE.md) Rejected Approaches].

Most templates require two orthogonal checks before they appear:

- **Reach prerequisite** — your **Domain Capability** in the relevant Reach must meet a tier ("can you do this kind of thing?") [IMPL — Domain Capability tiers in `src/engine/capability*`; 10-tier narrative lexicon in `NARRATIVE_LEXICON`].
- **Sphere prerequisite** — your sphere alignment must match the template's required sphere ("does your cosmic energy resonate?") [IMPL — sphere alignment checks in template prerequisites].

Both are optional per template. Some actions require only competence; some only alignment; the interesting ones require both. Prerequisites also gate **visibility** — you do not see what you cannot attempt [IMPL — filter cascade in `getTargetActionSlots()`].

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Cosmology.md (Reach, Sphere, Domain Capability, Prerequisite), Docs/ubiquitous-language/Encounters.md (UnifiedActionTemplate)
Spec: Docs/canon/cosmology.md (eight Reaches, twelve Spheres), Docs/canon/engine.md
Why: TheFantasyWorldSimulator/Vision/02-non-negotiables.md (§1 — divine remove, not direct control)
```

---

## 5. Your Resources

You have three currencies, all sphere-coloured, all limited, all visible:

**Influence Essence** is the divine fuel. Every Sphere has its own pool [IMPL — `EssencePool` is `Record<SphereName, number>` in [src/types/influence.ts](../../src/types/influence.ts)]. Essence regenerates from worshippers, places of power, and your portfolio's investment depth; it is *spent* on actions, sustained on Control effects, and lost to detection [IMPL — `EssenceDistribution` (primary/secondary split) and per-tick generation in `src/engine/essenceIncome.ts`; precise generation rate distribution [IMPL — primary 0.35, secondary 0.25 in identity defaults; remaining 6 spheres split the rest]]. The economy is tight on purpose. Most turns you cannot afford every intervention you want, and the choice of *which one* is the texture of play.

**Control slots** cap how many sustained effects you can hold at once. The cap scales with your Domain Capability tier [DESIGN — Control mechanic in [Docs/plans/2026-03-17-world-state-and-hex-actions-design.md](../plans/2026-03-17-world-state-and-hex-actions-design.md); slot cap formula not yet finalised in code]. Each active Control effect spawns a visible encounter node that rival gods with the prerequisites can **usurp** (take over) or **destroy** (shatter) [DESIGN — contestation reactions specified, not all wired].

**Influence Tiers** measure how deeply a mortal is connected to you. The implementation uses a 0–4 numeric tier — investment depth — measured on each `thread` edge [IMPL — `InfluenceTier = 0 | 1 | 2 | 3 | 4` in [src/types/influence.ts:35](../../src/types/influence.ts)]. The design target is a six-step ladder of *narrative* tier names — Unaware → Curious → Recognized → Devoted → Enthralled → Aspect — that maps to and refines the integer tier [DESIGN — six-tier ladder named in `state-of-game-design` SKILL Part 2; not yet a code enum]. The thread also tracks the mortal's *experience* of the connection, separately from your investment: `unaware | intuition | faith | communion` [IMPL — `awareness` field on `ThreadEdgeProperties` in [src/types/influence.ts](../../src/types/influence.ts)]. The mortal's response is the other half of the thread, and the game refuses to let you forget that there *is* another half [DESIGN — Agent Feedback System in [Docs/plans/2026-05-11-agent-feedback-system.md](../plans/2026-05-11-agent-feedback-system.md), THR-402].

**Court positions** organise your portfolio: `the_first` (the bonded mortal who anchors your divine presence), `retinue` (close-held), `watched`, `dormant` [IMPL — `CourtPosition` in [src/types/influence.ts:40](../../src/types/influence.ts)]. The First is the protagonist of your first arc — a Campbellian hero journey playing out through five phases (call → road of trials → crisis → ordeal → return) [IMPL — `CampbellianPhase` in [src/types/influence.ts:43](../../src/types/influence.ts); journey wiring partially implemented].

**Stealth** is your detection profile, computed against two audiences simultaneously: mortals (whose disbelief turns to faith with repeated meddling) and **rival gods** (who scan for divine signatures in their domain) [IMPL — `src/engine/stealth.ts` and `src/types/stealth.ts`]. Higher Influence Tiers make aligned nudges *cheaper*, but they raise your detection bar with rivals. This is the trade.

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Cosmology.md (Sphere, Sphere Alignment), Docs/ubiquitous-language/Agents.md (Thread, Avatar, Portfolio Pin)
Spec: Docs/canon/cosmology.md, Docs/canon/agents.md
Why: TheFantasyWorldSimulator/Vision/00-north-star.md (the player hesitates and spends), TheFantasyWorldSimulator/Vision/02-non-negotiables.md (§1 — sovereignty as a kind of being)
```

---

## 6. Encounters and Aftermath

An encounter is not a flat success/fail roll. It is a **framed chapter** — a curated moment where one threaded mortal's situation crystallises and the game pulls the camera onto it [IMPL — `UnifiedActionTemplate` is the single format since THR-108; full pipeline in `src/engine/encounter*` and aftermath in `phaseEncounterAftermath.ts`]. Encounters come in two shapes that share a format but split on pipeline:

- **Branching encounters** are authored, multi-step, with `ActionStepBranch` arms that produce genuinely different paths [IMPL — branching encounters in `src/data/encounters/`, exemplars `rival-shrine-betrayal.ts` and `flawed-steel.ts`].
- **Linear template encounters** (guild, social, tavern, combat, borderland) are systemic — they fire repeatedly across the world, instantiated from templates that share structure but vary in particulars [IMPL — templates compiled via `template-encounter-rewrite` skill pipeline].

**Encounter awareness is hex-granular** [IMPL — `encounterAwareness.ts`]. If you can see a hex, you see everything on it — every location, sublocation, and encounter. Cross-hex visibility is computed as hex coordinate distance vs. per-reach awareness hops. The distance matrix between locations is *not* used for encounter awareness; we resolve to the hex level [IMPL — rejected approach: location-hop awareness, see [CLAUDE.md](../../CLAUDE.md) Rejected Approaches].

**Resolution is unified: sigmoid → d100** [IMPL — `src/engine/resolution.ts`]. Domain Capability scores feed a sigmoid that produces a probability; a seeded d100 roll resolves against it. No alternative dice systems, no special-case resolution. The same curve governs a peasant attempting to overthrow a kingdom and an Ascendant attempting to bind an entropy well [IMPL — load-bearing decision in [CLAUDE.md](../../CLAUDE.md)].

The four encounter design rules — the executor's contract from the encounter experience design — apply across both pipelines [DESIGN — [Docs/plans/2026-05-04-encounter-experience-design-plan.md](../plans/2026-05-04-encounter-experience-design-plan.md) §1, four-rule list quoted in [Docs/canon/encounters.md](encounters.md)]:

1. **Path over adjective.** Every branch must change the path, not the colour of the path.
2. **The moral axis is structural.** Each encounter's primary Reach maps to an archetype-pair axis (Iron: Protector ↔ Conqueror; Heart: Sworn ↔ Renegade; the full eight in [Docs/canon/cosmology.md](cosmology.md)). Each choice tilts the agent toward one pole.
3. **Verbs are encounter-specific and soft-power flavoured.** "Stir her resolve," not "Force her to fight."
4. **Every primitive is clickable.** Every node referenced in the encounter — tile, item, clue, place, faction, Ascendant — has a detail page.

**Aftermath reshapes the protagonist's trajectory**, not yours. The reactions you pick (or fall into, when you let the encounter run unattended) write traits, modify reputation, mutate edges, and produce chronicle entries the mortal lives with for the rest of the run [IMPL — aftermath reactions touch the world graph via `GraphOp`; chronicle entries persist in agent history].

The cool-failure rule is binding: **failure is plot, not punishment** [DESIGN — Vision premise, [TheFantasyWorldSimulator/Vision/00-north-star.md](../../TheFantasyWorldSimulator/Vision/00-north-star.md)]. If a roll goes against you, the aftermath must produce narrative texture that makes the next chapter more interesting — a scar, a grudge, a thread under tension. A flat "you failed, nothing happened" is a content bug, not a balance issue.

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Encounters.md (Encounter, EncounterTemplate, UnifiedActionTemplate, Aftermath, Reaction, Hidden Mark, Encounter Awareness)
Spec: Docs/canon/encounters.md
Why: TheFantasyWorldSimulator/Vision/00-north-star.md (the unfolding is why they are playing), TheFantasyWorldSimulator/Vision/01-core-loop.md (encounter as chapter)
```

---

## 7. The Clocks

Two clocks pressure the run from opposite directions.

**The Doom Clock** ticks toward an Unmaking that *will* arrive. Every run starts with one of seven archetypes — Breach, Convergence, Changing, Sundering, Failing, Ascension, Reckoning — each named for the shape of its catastrophe [IMPL — `DOOM_CLOCK_ARCHETYPES` in [src/types/doomClock.ts:13](../../src/types/doomClock.ts)]. The archetype escalates through five thematic stages: **Whispers, Signs, Tremors, Crisis, Culmination** [IMPL — `DOOM_STAGE_NAMES` in [src/types/doomClock.ts:19](../../src/types/doomClock.ts)]. Each stage transition fires `DoomEscalationEvent`s — sphere-flavoured, sometimes systemic (`hex_corruption`, `prosperity_shock`, `agent_pressure`) [IMPL — `DoomCardEffectType` in [src/types/doomClock.ts](../../src/types/doomClock.ts)]. Your interventions can decelerate the clock; the rivals' interventions accelerate it. Either way, it lands.

**The Victory Mandate** is the win path. You declare (or have declared for you) a graph-state goal — dominance, cultural transformation, completion — and the clock toward *that* runs in parallel to Doom [DESIGN — Victory Mandate framework in `state-of-game-design` SKILL Part 2; 3-stage structure named but not all stages wired]. Each mandate has three stages from declaration through fulfilment.

The two clocks pressure each other. Pushing the Mandate harder consumes essence that could have decelerated Doom. Defending against Doom escalation eats turns you would have spent on Mandate progress. The run is the space between them.

**The Twilight Phase** is the run's ending sequence — triggered either by the Doom Clock culminating *or* the Mandate completing [DESIGN — Twilight Phase partially specified; Unmaking, echo selection, resonance capture, fundament update in [src/types/worldSoul.ts](../../src/types/worldSoul.ts) and adjacent plans]. In Twilight you do not act; you witness. The world collapses or transforms. The threads you held resolve. Echoes are harvested from what mattered most: **Legacy** echoes from mortals whose arcs completed, **Monument** echoes from places where the world changed, **Relic** echoes from artifacts you bound deeply [DESIGN — Echo System in plans; harvest pipeline partially implemented].

The World-Soul updates. The Fundament (coefficient ledger) shifts. The Resonance (memory fragments) absorbs what was vivid. The next run draws from the soul — thematic content, biased generation, a world subtly shaped by every prior cycle [DESIGN — World-Soul persistence; next-cycle seeding [DESIGN — partial wiring].

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Cosmology.md (Sphere — clocks are sphere-flavoured), Docs/ubiquitous-language/Encounters.md (Encounter Seed — escalation events seed encounters)
Spec: Docs/canon/cosmology.md (Sphere taxonomy), Docs/canon/engine.md (clock systems)
Why: TheFantasyWorldSimulator/Vision/00-north-star.md (cosmic melancholy as baseline), TheFantasyWorldSimulator/Vision/03-design-tensions.md (§3 — divine remove vs. player attachment)
```

---

## 8. Winning and Losing

A run ends one of two ways. **The Mandate completes** — your declared win-state is satisfied. The Doom Clock had not yet culminated, so the world survives and *you* shaped what survives. **The Doom Clock culminates** — the Unmaking arrives before the Mandate is satisfied. The world is remade or unmade, depending on the archetype.

Both endings produce content for the next cycle. There is no soft-loss or hard-loss [DESIGN — endings always produce echoes; pipeline partially implemented]. A Mandate completion fills the World-Soul with Legacy and Monument echoes weighted toward the values you embodied. A Doom culmination fills it with Resonance fragments — what mattered, what was lost, what *the world* still grieves. The next cycle will be subtly shaped by both [DESIGN — fundament shifts and resonance injection in next-cycle generation, [src/types/worldSoul.ts](../../src/types/worldSoul.ts); thematic content injection [DESIGN — partial wiring].

This is the **metaprogression promise**: you are not playing for a high score. You are playing for the *kind of god you were this run* to become an ingredient in the next one. A pacifist Witness run that ended in Doom seeds the next world with grief; a triumphal Sovereign run that completed a Mandate seeds the next world with order. The next world is not a sequel — it is a *response* [DESIGN — Vision premise reflected in [TheFantasyWorldSimulator/Vision/00-north-star.md](../../TheFantasyWorldSimulator/Vision/00-north-star.md); echo→thematic-content pipeline partially in code].

The game is not, structurally, about winning. The game is about *what kind of being you chose to be toward a world you could not save unconditionally* [DESIGN — Vision premise; emotional register from [TheFantasyWorldSimulator/Vision/00-north-star.md](../../TheFantasyWorldSimulator/Vision/00-north-star.md) "What a good run is NOT"]. Mandate completion and Doom culmination are both *kinds of endings*, not *kinds of wins*. The run that produced a story you can tell in prose was a good run, whichever clock ran out first.

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Agents.md (Ascendant), Docs/ubiquitous-language/Cosmology.md (Sphere), Docs/ubiquitous-language/Prose.md (Chronicle Entry, Narrative Event)
Spec: Docs/canon/agents.md, Docs/canon/engine.md
Why: TheFantasyWorldSimulator/Vision/00-north-star.md (a story the player can tell in prose), TheFantasyWorldSimulator/Vision/02-non-negotiables.md (§2 — narrative over mechanical perfection)
```

---

## Open questions

These are rules the rulebook surfaced during drafting that do not yet have a clean verdict. They live here so the quarterly architecture-assessment pass can see them and the user can verdict them in batch. Each entry is referenced inline above with `[OPEN]` or `[DESIGN]` and a brief note. None of these is currently considered a *blocker* on Phase 1 — they are the natural surface area of synthesising eight sections from scattered sources. Per the THR-403 refinement (2026-05-11), only blocking `[OPEN]`s warrant separate Linear issues; non-blocking ones live here.

1. **Influence Tier — six-name ladder vs. five-integer code.** State-of-game-design names a six-step narrative ladder (Unaware → Curious → Recognized → Devoted → Enthralled → Aspect). Code stores `InfluenceTier = 0 | 1 | 2 | 3 | 4` (five integers). Whether the ladder is a planned refinement of the integer scale, a deliberate divergence, or an aspirational shorthand is undecided. *Surfaced in §5.*
2. **Five verbs vs. CRUD-ish surface.** The rulebook teaches Create / Find / Change / Destroy / Control as the five player verbs. The code's `UnifiedActionTemplate` uses CRUD-ish verb fields but does not consistently expose a `verb: 'find' | 'change' | …` discriminator the player ever sees by that name. Whether to surface the five verbs explicitly in the ActionDrawer (e.g. as filter chips) is an open UX question. *Surfaced in §4.*
3. **Find gates Change/Control — hard or soft?** The "you can't Update what you haven't Read" rule appears in design docs as foundational. In code, gating is enforced via template prerequisites case-by-case rather than as a runtime invariant. Whether the gate should be hardened (engine-level refusal) or kept soft (per-template design discipline) is undecided. *Surfaced in §4.*
4. **Session length.** Vision §`01-core-loop` keeps "three to six encounters per session" alive as a *suspicion*. The number is not yet tuned, the game does not signal a stopping point, and the relationship between encounters and ticks is intentionally flexible. *Surfaced in §3.*
5. **Doom + Mandate dual-clock interplay.** The two clocks pressure each other in design, but the specific exchange rate — how much Mandate progress decelerates Doom, how much Doom escalation can be deflected by an active intervention — is not yet a tuned formula. *Surfaced in §7.*
6. **Twilight authorship vs. emergence.** Twilight Phase is the most authored beat of the loop (the run's closing chapter) but harvests echoes from emergent play. The split between authored Twilight beats and procedural echo selection is not fully specified. *Surfaced in §7.*

When the next quarterly architecture-assessment runs, these are the candidates to verdict, harden into rules, or move to per-domain canon pages. New questions surfaced by future drafting should append below.

---

## Last-reviewed

2026-05-11 by Cowork (Opus 4.6 executor pass on THR-403 Phase 1). Review trigger: monthly (or when [`monthly-rulebook-review`](https://linear.app/threadbare/issue/THR-405) lands and runs), and whenever a plan touches rules of play and updates a section.
