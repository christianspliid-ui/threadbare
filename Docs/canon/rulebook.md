---
domain: rulebook
last_reviewed: 2026-06-23
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

**Curated moment.** You enter a mortal's situation. The game opens a framed encounter — concrete, particular, sourced from this mortal's specific entanglements. You read prose, you weigh options, and at the critical step you choose a divine intervention from a contextual menu [IMPL — `UnifiedActionTemplate` resolution in `src/engine/orchestrator.ts`; ActionDrawer in `src/components/ActionDrawer/`]. *Do nothing* is always valid. The moment is *the chapter*, not just a roll. Encounter density is **player-authored** — more threads woven and more interventions made produce more chapters — with a gentle world-pressure lean toward more as the doom clock climbs; the game never rations chapters [DESIGN→IMPL — density stance settled 2026-07-04, THR-603; `CURATION_PHASE_MULTIPLIERS` in [src/engine/encounter/branchingConstants.ts](../../src/engine/encounter/branchingConstants.ts)]. The load-management answer to many concurrent chapters is the **Chapter Ledger**, a persistent always-readable archive of every encounter running or finished [IMPL — `chapterArchive` in [src/engine/chapterArchive.ts](../../src/engine/chapterArchive.ts); `ChapterLedger` UI].

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

**You can't Update what you haven't Read.** Find gates Change/Control. The natural chain is Find → Change/Create → Control [DESIGN — kept deliberately **soft**: per-template prerequisites + layer-revelation gating (tunable), with an advisory content-lint to catch Change/Control templates that aren't Find-gated; **not** a hard runtime invariant (verdict 2026-06-23, THR-414). Lint: THR-476].

Every node you focus on in a detail view — actor, location, sublocation, hex, artifact — becomes an **action target**. The ActionDrawer fills with templates filtered for that target through the **Generalized Action Targeting** cascade: node-type → subtype → traits → sphere → essence → range [IMPL — `getTargetActionSlots()` in [src/engine/](../../src/engine/) (search for the function); 119+ unified templates across CRUD, encounters, divine, location, attachment, sublocation, hex categories]. No fixed slot count. No capped action list. The space of "what is doable here" is data-driven and open-ended [IMPL — rejected approach: AgentWheel and fixed action slots, see [CLAUDE.md](../../CLAUDE.md) Rejected Approaches].

Most templates require two orthogonal checks before they appear:

- **Reach prerequisite** — your **Domain Capability** in the relevant Reach must meet a tier ("can you do this kind of thing?") [IMPL — Domain Capability tiers in `src/engine/capability*`; 10-tier narrative lexicon in `NARRATIVE_LEXICON`].
- **Sphere prerequisite** — your sphere alignment must match the template's required sphere ("does your cosmic energy resonate?") [IMPL — sphere alignment checks in template prerequisites].

Both are optional per template. Some actions require only competence; some only alignment; the interesting ones require both. Prerequisites also gate **visibility** — you do not see what you cannot attempt [IMPL — filter cascade in `getTargetActionSlots()`].

**Your two reach signatures.** Beyond the shared verbs, each run grants you exactly two **reach signatures** — one headline divine power for each of your two domains (Warhost for Iron, Rend the Gate for Veil, the Great Work for Stone, and so on for all eight Reaches) [IMPL — the eight `invest.<reach>.<name>` templates in `src/data/reach-signature-content.ts`, catalogued `reach-gated` in `ASCENDANT_ACTION_BUCKETS`]. A signature is **permanently reach-gated**: a card requiring a Reach outside your two domains never appears, not even as aspiration [IMPL — `requiresReach` gate in `getTargetActionSlots()`, THR-503]. You acquire them as story moments, not from a menu: your **primary** signature arrives at the culmination of the opening spine (Beat 4, "A Path Opens"), alongside your choice of god-path; your **secondary** arrives later, when the living world next calls on your deeper domain [IMPL — `BeatDefinition.grantsReachSignature`, resolved per-run from your ranked domain affinities in `resolvePendingBeat`; Beat 4 + the `beat.pool.invest.reach_signature` pool beat, THR-523]. How hard a signature hits scales with your **sphere power** — the same power that fuels the rest of your expression [IMPL — `spherePowerMultiplier`, `src/data/reach-signature-content.ts`, THR-548].

### How your power grows within a run

The five verbs and your two signatures are fixed at the start, but your *reach into them* deepens as you play. Power grows along **three axes**, all surfaced through the shipped Ascendant Beat cadence — there is no separate "level-up" screen [DESIGN — three-axis progression spine, [Docs/plans/2026-07-05-player-action-progression-v1.md](../plans/2026-07-05-player-action-progression-v1.md) §2, THR-613].

- **Depth (Axis A)** — divine activity in one of your two Reaches accrues **reach practice**, which feeds the same Domain Capability sigmoid the agents use (one source of truth, no parallel XP number). When your capability crosses a tier boundary a **Deepening beat** fires — a prose vignette addressed to you that narrates the growth. A Deepening grants **no new card**: the reward is that deeper tier-gated templates in that Reach become newly reachable [IMPL — `reachPractice` accrual + tier-crossing detection in [src/engine/phaseAscendantProgression.ts](../../src/engine/phaseAscendantProgression.ts); eight beats, one per Reach, in [src/data/ascendant-deepening-beats.ts](../../src/data/ascendant-deepening-beats.ts); tunables in [src/data/player-progression.ts](../../src/data/player-progression.ts); THR-613 Slices 1–2].
- **Breadth (Axis B)** — new named cards arrive as one-off unlocks. A **milestone beat** fires once you hold `MILESTONE_SOURCES_FOR_BEAT` controlled essence sources (or your first *flowering* source) and grants an economy-flavored breadth card no other beat dispenses; **discovery** (Ruins → Delve) is the third breadth path [IMPL — `beat.milestone.the_wellspring_flows` in [src/data/ascendant-milestone-beats.ts](../../src/data/ascendant-milestone-beats.ts), fired from the same progression phase; THR-613 Slice 2b].
- **Sustained commitment (Axis C)** — your **Control-slot cap scales with tier**, so a deeper god can hold more covenants at once [IMPL — cap derived from tier]. A dedicated **Covenants** surface in the ascendant bar lists every sustained control you hold — its target, its plain upkeep, whether a rival contests it — and lets you **voluntarily release** one: the hold ends, its upkeep stops, and (if contested) it is abandoned to the rival [IMPL — Covenants panel + `release_control` via `pendingControlReleases`, plan §5.A / §3.4, THR-613 Slice 4].

**The locked-state grammar.** So that "I can't do this" is never ambiguous, a card sits in one of three states:

- **Available** — prerequisites met; the card is in your drawer.
- **Acquirable this run** — inside your two Reaches but gated by a tier you can still cross or a card you can still earn: *not yet*.
- **Locked this incarnation** — a Reach outside your two permanent domains: *not this run*, ever [IMPL — the reach gate permanently hides identity-locked cards, THR-503].

Your two Reaches and their current depth are always visible in the ascendant bar's **Reaches** readout (prose tier words, not numbers), and all eight reach **Signatures** are partitioned into the three states above so the permanence is legible rather than invisible [IMPL — Reaches + Signatures readouts in [src/components/Game/ascendant-bar/](../../src/components/Game/ascendant-bar/), THR-613 Slices 3a–3b]. Extending the three-state grammar to *every* card in the live ActionDrawer is designed but deferred [DESIGN — per-card drawer grammar, plan §5.B, THR-613 Slice 3b tail].

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Cosmology.md (Reach, Sphere, Domain Capability, Prerequisite), Docs/ubiquitous-language/Encounters.md (UnifiedActionTemplate)
Spec: Docs/canon/cosmology.md (eight Reaches, twelve Spheres), Docs/canon/engine.md, Docs/plans/2026-07-05-player-action-progression-v1.md (in-run progression — Axis A/B/C spine)
Why: TheFantasyWorldSimulator/Vision/02-non-negotiables.md (§1 — divine remove, not direct control)
```

---

## 5. The Cosmology

Two orthogonal axes govern every divine action — neither subsumes the other [IMPL — load-bearing decision, see [CLAUDE.md](../../CLAUDE.md) Load-Bearing Architectural Decisions; full spec in [Docs/canon/cosmology.md](cosmology.md)].

**Eight Reaches** — *what you do*, the activity domains: Iron, Gold, Shadow, Veil, Heart, Eye, Stone, Star [IMPL — `ReachDomain` in [src/types/traits.ts](../../src/types/traits.ts); the eight-Reach roster is settled canon — see [Docs/canon/cosmology.md](cosmology.md) for the authoritative names].

**Twelve Spheres** — *what fuels it*, the cosmic energies, in six opposed pairs [IMPL — `SphereName` in [src/types/influence.ts](../../src/types/influence.ts)]:

- *Foundation:* Chaos ↔ Order, Light ↔ Darkness — "elder magic," discovered through ruins, not chosen at chargen.
- *Creation:* Force ↔ Mind, Matter ↔ Time, Energy ↔ Spirit, Life ↔ Entropy.

Reaches and Spheres combine freely: the same Reach at different Sphere alignments produces different narrative textures — the combinatorial core of the action system [IMPL — load-bearing decision, [CLAUDE.md](../../CLAUDE.md)]. **Quintessence** is a separate meta-property (narrative centrality / threadbare-ness), **not** a ninth Reach [IMPL — see [Docs/canon/cosmology.md](cosmology.md)].

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Cosmology.md (Reach, Sphere, Sphere Alignment, Quintessence)
Spec: Docs/canon/cosmology.md
Why: TheFantasyWorldSimulator/Vision/02-non-negotiables.md (§1 — divine domains and cosmic energies)
```

---

## 6. Your Resources

You have three currencies, all sphere-coloured, all limited, all visible:

**Influence Essence** is the divine fuel. Every Sphere has its own pool [IMPL — `EssencePool` is `Record<SphereName, number>` in [src/types/influence.ts](../../src/types/influence.ts)]. Essence regenerates from worshippers, places of power, and your portfolio's investment depth; it is *spent* on actions, sustained on Control effects, and lost to detection [IMPL — `EssenceDistribution` (primary/secondary split) and per-tick generation in `src/engine/essenceIncome.ts`; precise generation rate distribution [IMPL — primary 0.35, secondary 0.25 in identity defaults; remaining 6 spheres split the rest]]. The economy is tight on purpose. Most turns you cannot afford every intervention you want, and the choice of *which one* is the texture of play.

**Control slots** cap how many sustained effects you can hold at once. The cap scales with your Domain Capability tier [DESIGN — Control mechanic in [Docs/plans/2026-03-17-world-state-and-hex-actions-design.md](../plans/2026-03-17-world-state-and-hex-actions-design.md); slot cap formula not yet finalised in code]. Each active Control effect spawns a visible encounter node that rival gods with the prerequisites can **usurp** (take over) or **destroy** (shatter) [DESIGN — contestation reactions specified, not all wired].

**Influence Tiers** measure how deeply a mortal is connected to you. The implementation uses a 0–4 numeric tier — investment depth — measured on each `thread` edge [IMPL — `InfluenceTier = 0 | 1 | 2 | 3 | 4` in [src/types/influence.ts:35](../../src/types/influence.ts)]. Five narrative tier names — Unaware → Curious → Recognized → Devoted → Enthralled — map one-to-one onto the five integer tiers; **'Aspect' is a separate apex milestone** (the mortal becomes an aspect of the god), not a sixth influence rung [IMPL — five integer tiers; narrative-name mapping + Aspect-as-apex resolved 2026-06-23 (THR-414). A small code ticket for the name-map + Aspect flag is a follow-up]. The thread also tracks the mortal's *experience* of the connection, separately from your investment: `unaware | intuition | faith | communion` [IMPL — `awareness` field on `ThreadEdgeProperties` in [src/types/influence.ts](../../src/types/influence.ts)]. The mortal's response is the other half of the thread, and the game refuses to let you forget that there *is* another half [DESIGN — Agent Feedback System in [Docs/plans/2026-05-11-agent-feedback-system.md](../plans/2026-05-11-agent-feedback-system.md), THR-402].

**Court positions** organise your portfolio: `the_first` (the bonded mortal who anchors your divine presence), `retinue` (close-held), `watched`, `dormant` [IMPL — `CourtPosition` in [src/types/influence.ts:40](../../src/types/influence.ts)]. The First is the protagonist of your first arc — a Campbellian hero journey playing out through five phases (call → road of trials → crisis → ordeal → return) [IMPL — `CampbellianPhase` in [src/types/influence.ts:43](../../src/types/influence.ts); journey wiring partially implemented].

**Stealth** is your detection profile, computed against two audiences simultaneously: mortals (whose disbelief turns to faith with repeated meddling) and **rival gods** (who scan for divine signatures in their domain) [IMPL — `src/engine/stealth.ts` and `src/types/stealth.ts`]. Higher Influence Tiers make aligned nudges *cheaper*, but they raise your detection bar with rivals. This is the trade.

```
Owns: synthesis only.
Definitions: Docs/ubiquitous-language/Cosmology.md (Sphere, Sphere Alignment), Docs/ubiquitous-language/Agents.md (Thread, Avatar, Portfolio Pin)
Spec: Docs/canon/cosmology.md, Docs/canon/agents.md
Why: TheFantasyWorldSimulator/Vision/00-north-star.md (the player hesitates and spends), TheFantasyWorldSimulator/Vision/02-non-negotiables.md (§1 — sovereignty as a kind of being)
```

---

## 7. Encounters and Aftermath

An encounter is not a flat success/fail roll. It is a **framed chapter** — a curated moment where one threaded mortal's situation crystallises and the game pulls the camera onto it [IMPL — `UnifiedActionTemplate` is the single format since THR-108; full pipeline in `src/engine/encounter*` and aftermath in `phaseEncounterAftermath.ts`]. Encounters come in two shapes that share a format but split on pipeline:

- **Branching encounters** are authored, multi-step, with `ActionStepBranch` arms that produce genuinely different paths [IMPL — branching encounters in `src/data/encounters/`, exemplars `rival-shrine-betrayal.ts` and `flawed-steel.ts`].
- **Linear template encounters** (guild, social, tavern, combat, borderland) are systemic — they fire repeatedly across the world, instantiated from templates that share structure but vary in particulars [IMPL — templates compiled via `template-encounter-rewrite` skill pipeline].

**Encounter awareness is hex-granular** [IMPL — `encounterAwareness.ts`]. If you can see a hex, you see everything on it — every location, sublocation, and encounter. Cross-hex visibility is computed as hex coordinate distance vs. per-reach awareness hops. The distance matrix between locations is *not* used for encounter awareness; we resolve to the hex level [IMPL — rejected approach: location-hop awareness, see [CLAUDE.md](../../CLAUDE.md) Rejected Approaches].

**Resolution is unified: sigmoid → d100** [IMPL — `src/engine/resolution.ts`]. Domain Capability scores feed a sigmoid that produces a probability; a seeded d100 roll resolves against it. No alternative dice systems, no special-case resolution. The same curve governs a peasant attempting to overthrow a kingdom and an Ascendant attempting to bind an entropy well [IMPL — load-bearing decision in [CLAUDE.md](../../CLAUDE.md)].

**Every action resolves onto a five-band outcome ladder** [IMPL — THR-571, `src/engine/kpi/`, `unifiedActionResolution.ts`]: *clean success · success-at-cost · failure · critical success · critical failure*. The acting population is **capability-poor by design** — most mortals are not skilled, so most successes are *scraped through*, not clean. **`success_at_cost` is therefore the dominant, expected texture of the world** ("won, at a price"), not a failure state — the world resolves at-cost roughly 45–60% of the time [IMPL — measured baseline seeds 42/99/7]. **Clean success and critical success are rare and special** — the outcomes a god *notices*: clean runs ~5–8%, critical success under ~2% [IMPL]. A low-capability actor pushed over the probability floor scrapes through *at a cost*; only a genuinely capable actor (or a fluke of the dice) lands a clean or critical win. **Critical failure is un-gated at every scale** — its classification always survives to prose and aftermath; only the *severity* of the consequence scales with the action's reach (a personal fumble is a humiliation, a cosmic one a catastrophe) [IMPL — `CRIT_FAILURE_SEVERITY_BY_SCALE`, THR-571]. And **every failure leaves a story artifact** — a complication, a planted mark, or an encounter seed — so no outcome reads as dead air [IMPL — `guaranteeFailureStoryArtifact`, THR-571 C1]. This is the mechanical form of the cool-failure rule below.

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

## 8. The Clocks

Two clocks pressure the run from opposite directions.

**The Doom Clock** ticks toward an Unmaking that *will* arrive. Every run starts with one of seven archetypes — Breach, Convergence, Changing, Sundering, Failing, Ascension, Reckoning — each named for the shape of its catastrophe [IMPL — `DOOM_CLOCK_ARCHETYPES` in [src/types/doomClock.ts:13](../../src/types/doomClock.ts)]. The archetype escalates through five thematic stages: **Whispers, Signs, Tremors, Crisis, Culmination** [IMPL — `DOOM_STAGE_NAMES` in [src/types/doomClock.ts:19](../../src/types/doomClock.ts)]. Each stage transition fires `DoomEscalationEvent`s — sphere-flavoured, sometimes systemic (`hex_corruption`, `prosperity_shock`, `agent_pressure`) [IMPL — `DoomCardEffectType` in [src/types/doomClock.ts](../../src/types/doomClock.ts)]. Your interventions can decelerate the clock; the rivals' interventions accelerate it. Either way, it lands.

**Rival schemes** are how the generated rivals oppose you as an active antagonist, not just ambient sphere pressure. On a rival's action tick it may launch a **scheme** — a four-phase arc (**rumor → materialization → response → crack**) that unfolds over many ticks, riding the same phase runner as authored compositions [IMPL — `phaseRivalActions` in `src/engine/orchestrator.ts`, families in `src/data/rival-schemes/`]. The rival **invests** each tick to arm the next phase; how many schemes it runs at once, how fast they advance, and how ambitious they get are gated by an **escalation tier** blended from the Doom stage and your own advancement (highest thread Influence Tier) [IMPL — `computeRivalEscalationTier`] — so late-game rivals hit harder without any bespoke meter. Every phase does a concrete, **attributed** move (souring a shrine's faith, mustering a warband, contesting a hold) surfaced in the Rival panel (scheme cards with phase chips), the Chronicle, and a sphere-tinted marker on the map. You **counter** a scheme by pushing back at its target through the normal encounter/action play: presence there **stalls** the scheme, and a second push **fails** it — but its already-run phases stay real, so a half-thwarted scheme is canonically a half-thwarted scheme, and failure leaves a cool-failure Chronicle beat [IMPL — counter-play + cool-failure in `phaseRivalActions`]. Two families ship now (corruptive, territorial); an economic family is designed and blocked on the resource web [DESIGN — economic family THR-620, blocked-by THR-615].

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

## 9. Winning and Losing

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

The Phase 1 review pass (THR-414) verdicted all six on **2026-06-23**. Resolved items are folded into the sections above with upgraded inline flags; deferred items remain here with rationale and a `last_considered` date; spawned items link their follow-up issue. New questions surfaced by future drafting append below.

**Resolved (2026-06-23):**

1. **Influence Tier — six-name ladder vs. five-integer code → RESOLVED.** Engine keeps the five integer tiers; the names Unaware → Curious → Recognized → Devoted → Enthralled map onto them one-to-one; **'Aspect' is a separate apex milestone, not a sixth rung.** Folded into §6. Follow-up: a small code ticket for the name-map + Aspect flag.
2. **Five verbs vs. CRUD-ish surface → RESOLVED.** The five verbs stay **implicit substrate** — taught through encounter prose, **not** surfaced as ActionDrawer filter chips (prose-first UI). No code change. Folded into §4.

**Spawned (tracked as issues):**

3. **Find gates Change/Control → soft + lint.** Kept soft (per-template prerequisites + layer-revelation gating), with an advisory content-lint to catch violations — **not** a hard runtime invariant. Lint: **THR-476** (Ready for Codex). Surfaced in §4.
6. **Twilight authorship vs. emergence → specify a lightweight split.** Verdict: define authored closing beats + a procedural echo-selection rule (which emergent threads get harvested into the finale). Spec task to be filed as a follow-up. Surfaced in §8.

**Deferred to KPI data (revisit post-THR-457 harness):**

4. **Session length / density → density RESOLVED; stopping-point signal still open.** The *density* half is settled `[DESIGN→IMPL, THR-603]`: encounter density is player-authored with a gentle doom lean, never rationed; "three to six per session" is retired as doctrine (kept only as an untuned texture observation). The Chapter Ledger is the load-management answer. The *stopping-point signal* half remains open — whether the game should nudge a good place to stop is still deferred to KPI/playtest data. Surfaced in §3. `last_considered: 2026-07-04`.
5. **Doom + Mandate dual-clock interplay.** No tuned exchange-rate formula before playtest data — design discipline for now. Surfaced in §8. `last_considered: 2026-06-23`.

When the next quarterly architecture-assessment runs, the deferred items (4, 5) are the candidates to revisit. New questions surfaced by future drafting append below.

---

## Last-reviewed

2026-07-17 by Claude Code (THR-613 Slice 4 — flipped the Axis C Covenants line in §4 from [DESIGN] to [IMPL]: the Covenants panel + voluntary `release_control` shipped, so the rules-of-play now describe releasing a sustained control as a real player move). Earlier same day: THR-613 progression-legibility slice — added §4 subsection "How your power grows within a run": the three-axis progression spine (Depth/Breadth/Sustained-commitment), Deepening + milestone beats, and the Available / Acquirable-this-run / Locked-this-incarnation grammar; honest [IMPL] vs [DESIGN] flags for the still-pending Slice 3b-tail drawer grammar and (then-pending) Slice 4 Covenants panel. Previous: 2026-06-23 by Cowork (THR-414 Phase 1 review pass — verdicted all 6 open questions + the manual↔card Cosmology drift; added §5 The Cosmology, renumbered former §5–§8 to §6–§9, folded resolved verdicts inline, spawned THR-476). Earlier: 2026-05-11 by Cowork (Opus 4.6 executor pass on THR-403 Phase 1). Review trigger: monthly (or when [`monthly-rulebook-review`](https://linear.app/threadbare/issue/THR-405) lands and runs), and whenever a plan touches rules of play and updates a section.
