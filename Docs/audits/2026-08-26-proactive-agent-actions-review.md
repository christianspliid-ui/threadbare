# Proactive Agent Actions — steel-man & red-team review

**Date:** 2026-08-26 · **Requested by:** Christian, live in chat, before blessing the map's carve-up.
**Method:** three independent Fable agents, each booting cold from the Linear record of the
[Proactive Agent Actions wayfinder map](https://linear.app/threadbare/issue/THR-1276/proactive-agent-actions-wayfinder-map)
(THR-1276) — one steel-man (strongest coherent case + fact-check), one engineering red team
(feasibility, grounded in code), one game-design red team (played experience). Their full reports are
Appendices A–C, verbatim. §1–§3 are the synthesis and the rulings made on it, all ratified in chat
2026-08-26.

This document is the citation target for the six plan docs named in the map's closing carve-up.
Executors and design sessions: the **rulings in §2 and the obligations in §3 are binding**; the
appendices are evidence.

---

## 1. Overall verdict

The map's core survived. Every factual claim the decisions rest on was re-verified against code and
**none failed** (Appendix A §D). The binding, naming, and reactive-loop verdicts survived direct
attack from both red teams; the interrupt architecture (registry, cause-named pauses, badge
recovery, tier gating) is the right chassis. The recon tickets (THR-1277/1278/1289) were accurate
where spot-checked.

The findings cluster in one seam — **the moment surface** — plus one contradiction between two of
the map's own verdicts, three engineering defects that would have shipped, and a set of plan-doc
obligations. Nothing reopened the grammar, the kind catalog, ownership, naming, or the reactive
loop's shape.

## 2. Rulings (Christian, chat, 2026-08-26)

### 2.1 The moment surface — attention is player-conferred (amends THR-1279 verdict 5)

Both red teams converged here: (a) for all of v1 an interrupting moment is a modal with nothing to
do in it — encounter chrome, dismiss button — which trains dismiss-spam before nudge cards exist and
teaches that the encounter interface sometimes means "act" and sometimes "acknowledge"; (b) the
interrupting *population* was never pinned, and neither pole works (all-spotlight ≈ an interrupt
every tick or two; First-only starves the "follow any agent" north star, whose only remaining
surface would be badges ruled recovery-only).

**Ruling:** a **follow** affordance confers interrupt attention. Following an agent is the act that
upgrades their moments from badge to interrupt; The First and retinue are followed by default.
For followed agents: completions, destructions, and named-death complications always interrupt;
only the **first** advance-at-cost per undertaking interrupts (repeats badge); foundings badge until
nudge cards ship, so no interrupt is ever card-less. **The follow affordance appears on the
encounter UI as well as the arc panel** (Christian's extension) — one piece of state, two surfaces.
The interrupt-for-tension intent stands: every interrupt is one the player asked for.

### 2.2 Failure residue follows visibility (reconciles THR-1280 §2 with THR-1281 Q5)

The substrate verdict said failed projects leave half-built objects; the grammar verdict (Christian's
"simpler system" correction) said failure ends clean. **Ruling:** residue follows visibility. An
undertaking that produced an interrupting moment (the player watched it) fails **visible** — the
half-built scar persists under its working possessive, the *failure-name register* ("Vorn's
unfinished ring", "Hesk's folly"), distinct from earned names. An undertaking that lived entirely
below the badge line fails **clean** — chronicle line only, no graph litter, which is the case the
grammar verdict was rightly guarding against.

### 2.3 Technical verdicts (agent authority, veto open)

1. **Undertakings live in the strategic runtime** and adopt the encounter step/outcome machinery as
   a **shared resolution library** — they do not become unified actions (resolves Appendix B C2).
   The one-unresolved-action-per-agent busy-gate stands untouched; `can-run-beside` is native;
   drift between the two callers is guarded by contract tests.
2. **`groupKind` ships now**, not "when a fourth sibling appears" (resolves Appendix B C1): the
   faction-membership predicate is exclusion-shaped and would classify every network contact as a
   faction member. Amend `isCompanyMembershipTarget`/the predicate family and audit all raw
   `member_of` readers in the same pass; also amend the `commanded_by` schema description
   (Appendix A §D — its "physically committed" semantics contradict the network use).
3. **Mentorship folds into undertakings** (resolves Appendix B C3): train-apprentice is an
   undertaking by nature; the initiative retirement's blast radius includes `phaseMentorship`, its
   divine actions, and `InitiativeProgress` — the substrate plan doc carries the full inventory
   (~424 initiative references / 32 files).
4. **Grievance replacement-by-magnitude** (amends THR-1282 §2/§4, resolves Appendix C S4): a new
   harm to a living owner that outweighs the active grievance replaces it (the displaced grievance
   demotes to its grudge edge immediately; the moment names the turn). Succession fires only past
   the dead and the Broken.

## 3. Plan-doc obligations from the review

Binding on the doc named; the carve-up (map closing comment) maps docs 1–6.

| Doc | Obligation | Source |
|---|---|---|
| 1 — substrate | Shared step-resolution library architecture (ruling 2.3.1); initiative retirement blast-radius inventory incl. mentorship fold (2.3.3); **halt ratchet** — N halts on one undertaking force a fork: abandon (chronicle + §2.2 residue rule + candidate mint event) or escalate (re-bind with complication machinery) | B C2/C3, C S3 |
| 1 — substrate | **One-board convergence plan**: shadow-score both boards with trace comparison before cutover — the two scorers are incommensurate (multiplicative value-economy vs 7-weight additive sum bridged by one constant); name the common currency; grievance heat and temperament weights land on the same rewrite | A strain 1, B S3 |
| 1 — substrate | **Decision-mix floor gates upkeep deletion**: removing the control family deletes ~40% of strategic candidate supply; deletion is gated on measured replacement supply, not tier count (THR-1286 stays minimal interim relief) | B S2 |
| 2 — action library | **`controls` disposition table**, consumer by consumer (132 occurrences / 72 files — faction territory, essence income, army supply, battle seizure, threat, rivals, retinue are NOT the upkeep loop); decide ownership-edge identity explicitly | B S1 |
| 2 — action library | **Wilderness**: point chart/expedition undertakings at lair-anchored agents (the idle third, 700/798 at lairs) — in-catalog, closes the north-star hole | C S2 |
| 2 — action library | Holdings: **single-writer module** for the three-object mirror (object node + ownership edge + bearer attachment); seize is atomic; `holding` category exempt from possession slot caps; sweep exhaustive `AttachmentCategory` maps | B S6, M4 |
| 3 — binder | Resize honestly: the promotion is a **new system** (scored candidate enumeration, modify path, per-step anchoring — none exist). Mint path runs the full birth pipeline (today's bundle mints carry no capabilities/personality — identity-fit needs the data); **mint budget** as a tunable, routed through the lifecycle valve (unbudgeted ≈ +1 permanent agent/tick; medium-map population doubles by ~tick 500; large maps stall at ~1010 — THR-162) | B S4/S7, A strain 3, C M2 |
| 3 — binder | **Reaper inventory** for persistence enforcement, each marked loud-or-lazy: sublocation dissolution, lifecycle death (edge wipe — bindings are bare nodeIds, needs an index or scan), seed-inheritance drop, transit-hex GC (THR-669 precedent), battle deaths; inherit the THR-1286 lesson (dead records poison scorers) | B S5 |
| 3 — binder | Scarcity weight needs a maintained role census (no O(all-actors) scan per role per step); new mint-ID scheme stays seed-deterministic while instance-unique | B S7 |
| 4 — reactive loop | Replacement-by-magnitude rule (2.3.4); value-pole data has **two coexisting scales** (legacy ±1 storage vs 0–1 canonical registry) — the new selector term routes through the mapping or poles invert | C S4, A §D |
| 5 — calling & surfaces | Follow affordance per ruling 2.1, **on both the arc panel and the encounter UI**; moment-card action slot hosts Inspire/Sabotage when the moment's undertaking is a legal target (the god's v1 on-ramp); scapegoat-mint provenance chip names the divine act in the chain; interrupt collation order (encounter first, never two modals); calling derivation weights the ambition term (the volatile input) and is verified against telemetry for a narratable change rate | C C1/S5/M1/M4 |
| 5 — calling & surfaces | Naming: possessive fallback also fires on lexicon-miss *quality*, not only coverage; failure-name register per §2.2 | C M3 |
| 6 — undertaking factory | Gates encode the review: schema completeness (destroy verb, cast declarations with scarcity + identity requirements), band tables, register scoring at the encounter standard, Law 56 chip state-backing | — |
| fog / future | Works generate no divine economy (essence/worship) — the hook that makes the god *want* the world to build; recorded for a future charter, not T1 | C M5 |

## 4. Attacks the design survived (abridged — full lists in appendices)

Three-effect checkpoint flattening (presentation collapse, ladder intact underneath); self-driving
protagonists upstaging the god (structure holds; the v1 gap was the surface, fixed by 2.1 + the
moment-card action slot); control-upkeep removal (data-damning, right call); one-board intent
(pure NFP #2 win — the risk is the migration, not the destination); the binding verdicts (called
"the strongest game-design material in the map"); names-outlive-owners; anti-vendetta damping;
THR-726 lane proven real and wired; no rejected approach reintroduced; determinism under per-step
re-anchoring (NFP #3 holds); eight reaches confirmed.

---

## Appendix A — Steel-man report (Fable agent 1, verbatim)

### A. The strongest case

The design's core insight is **consolidation onto proven winners, justified by measurement**. Before any decision was taken, two recon passes (THR-1277 field survey, THR-1289 binding recon) established with numbers what actually fires: strategic actions demonstrably run (55 projects by tick 60) but 40% of decisions are control churn and projects never fail; initiatives are dead by construction (wealth-floor 0/30); the reactive pool is unassigned; encounter stages always bind real nodes (38/38) but cast almost never does (~11%). Every subsequent verdict retires a measured-dead mechanism (initiative pipeline, control upkeep, behavior families, reactive pool) and promotes a measured-live one (strategic skeleton, encounter step/outcome shape, support bundle, THR-726 mint lane, worldgen namer). Nothing green-fields; the design is almost entirely re-plumbing between systems that already exist — which is precisely what the systems-inventory discipline (the THR-614 lesson) demands.

**North star #1, link by link** ("follow any spotlight agent for a season and narrate their arc without a debug panel"):

1. *Ambition* → exists today (`pursues` edges), now repointed to **name the kinds it wants built** (grammar §7), closing the profile-less-ambition gap.
2. *Ambition → visible choice* → the **one prioritization board** (substrate §3) makes the undertaking a legible chosen act; temperament weights make the mix characterful; the **derived calling** renders the pattern as a player-visible title, with hysteresis so a calling change is itself a chronicle beat.
3. *Choice → witnessed drama* → undertakings adopt the **encounter step/outcome shape** with checkpoint dice (substrate §2), and moments **interrupt the sim in the same register and interface family as encounters** (mock verdict 4–5) — the player experiences the arc through the surface they already know, with Law 56 state-backed chips.
4. *Drama → real world contact* → the **promoted binder** (THR-1290): per-step anchoring, scored find/modify/mint, minted cast born as real inhabitants, enforced must-persist with honest deaths as named complications. Binding quality *is* moment quality — "the generic moment is the boring moment."
5. *Contact → durable named legacy* → checkpoint successes create real graph objects (works/holdings, one `holding` attachment category as bearer-side face of an ownership edge); the **naming recipe consumes the binder's output** — the anchor part of "The Saltway Ring" comes from the bound coast road. This is the single most elegant coupling in the map: binding quality was worth two tickets *because names are downstream of bindings*.
6. *Legacy → who it affected* → harms carry a **culprit** into the event-minted lane; grievances carry **provenance** ("AMBITION: Seek revenge · because of the Saltway blockade", clickable); the chronicle renders the chain.

Every link is grounded in something that exists or a decided mechanism. The chain is **complete on paper for Tier 1 spotlight agents**.

**North star #2** ("revisit a region and it has visibly changed hands, and the chronicle names who"): kind-first grammar with schema-refused destroy-less kinds gives counter-play by construction; **seize-as-transfer** is literally "changed hands"; **names outlive owners** (seizure keeps the name, renaming costs a rededication, destruction leaves echoes) means the chronicle's toponymy accumulates history rather than resetting; **motive-gated destroys** guarantee the "who and why" is always narratable; the reactive loop converts each change into the next drive, so regional change self-propagates. The **network kind as remote-anchor transport layer** ("you can only reach where your works reach") makes counter-play spatial — severing a network un-foots what it anchored — which turns T1 marks-and-networks into load-bearing infrastructure for T2/T3 rather than a warm-up tier. The tier sequencing is therefore not arbitrary scoping; each tier is the next tier's substrate.

The design also honors the repo's constitution unusually well: networks bind to existing node/edge types (no-new-node-types rule, verified against `edgeSchema.ts`); ownership is an edge with an attachment face, not a property bag; five binding weights max and every constant tunable (NFP #1); every binding decision traced (NFP #2); naming deterministic per seed (NFP #3); possessive fallback fail-soft (NFP #4); motive-gated destroys and earned-at-completion names are NFP #5 made mechanical.

### B. Load-bearing dependencies — top 3

**1. The one-board prioritization rework (substrate §3).** Everything routes through it: undertaking frequency, grievance heat (a decaying weight *on this board*), temperament mix, the calling (derived from realized behavior, i.e. from what the board picks), and the unticketed tuning question "how often proactive beats encounters." If it fails, the reactive loop starves (grievances never win), the calling reads noise, and arcs pace wrongly. The precedent is adverse: the 2026-04-09 doc *already* intended one board and the implementation drifted into today's bolt-on (verified — `phaseAgentDecision.ts:720-740, 896-922` are sequential winner-take comparisons). The design bets the drift won't recur.

**2. The promoted binder (THR-1290).** Naming (anchor part), moment quality, works-as-real-objects, remote anchoring, and grievance provenance (the harmed work must be a bound real thing with a real owner) all consume its output. Measured baseline is the worst in the map: ~11% cast coverage, self-reuse masquerading as world-reuse, one binding pass per action, persistence written but read by nothing (verified). Five subsystems must land together — per-step anchoring, the scored board, enforced persistence, banded creation, remote anchoring. If it underdelivers, everything downstream still *runs* but degrades to costume: possessive-fallback names everywhere, generic moments, north star #1 failing silently while all gates stay green.

**3. Checkpoint stakes (substrate §2).** "Projects can stall and fail" is the sentence that makes arcs narratable, feeds the reactive loop (harms mint drives), and gives the naming rule its teeth (failures stay nameless). Today's baseline: zero failures in ~400 project records. If difficulty tuning replicates that, there is no drama and nothing mints; if it overcorrects, the world drowns in halts and grievance heat. Both failure modes are quiet, and the map's tuning question is explicitly deferred fog.

### C. Strain points

1. **Commensurability on the one board (substrate §3).** The verdict says "same matrix, all tunable constants," but encounter candidates and undertaking candidates measure different things — immediate scene value vs. multi-season payoff — and grievance heat joins as a third species. Temperament weights adjust a mix; they cannot make incomparable units comparable. No decision names the common currency the one scorer scores in. The field survey itself documents what naive score comparison produces (47–49% strategic wins plus churn). This is the strain with the strongest historical precedent for going wrong, and the verdict resolves it by assertion.

2. **The binder's coverage cliff is answered with mechanism, not resourcing (THR-1289 area 4 → THR-1290).** The recon names the cliff — binding fires only for templates that author a supportBundle, measured 4/38. The algorithm verdict answers *how* binding decides, not *who authors* cast/stage specs for every step of every undertaking across ten kinds × reaches plus 43 converting templates. "Undertakings are the forcing function; encounters migrate opportunistically" defers the identical cliff for encounters. Three vertical slices are a proof, not a coverage plan.

3. **Identity-fit's three-way test presumes readable identity that candidates mostly lack (THR-1290 §2).** The match/blank/contradiction logic needs machine-readable personality on candidate NPCs. Verified reality: bundle-minted actors carry `importance: 0, sphereAffinity: null`, a role, and a name — nothing a "greedy mage" contradiction check can read. Structurally, most candidates present as *blank*, so the elegant three-way collapses to two in practice and the veto rarely fires. That is data poverty, not a tunable constant.

4. **The reactive loop's carriers are mostly agents who cannot act (THR-1282 vs THR-814).** Only ~17 of ~370 agents run the decision loop. Grievances mint on the *direct owner* of a harmed work — but as works accumulate and spotlight rotates, most owners will be ambient, and an ambient owner's grievance enters `pursues` on an agent that never consults the board. The verdict limits *chains* to spotlight, but even the first link needs an acting owner. The loop's general truth quietly leans on the batched-ambient future (Q5), which the map itself marks "not yet specified." Similarly, north star #2's regional churn at ~17 proactive agents is a thin engine for a whole map's "visibly changed hands."

5. **Naming quality is circularly dependent on world richness (THR-1291 + THR-1290).** The anchor part needs a resonant bound entity; "Saltway" worked because the coast road pre-existed with a name. But the binder trends fresh-mint for commodity roles, and fresh mints are born generic. Early in a run — exactly when the player is learning whether works feel real — touched entities will skew minted, and the recipe degrades to the possessive fallback. Fail-soft covers legibility, not the quality the north star trades on. Good names need a rich world; the rich world is what undertakings are supposed to build.

6. **Interrupt volume is undesigned (THR-1279 verdict 5).** Moments interrupt like encounters, badges are recovery-only, and the flag `can-run-beside` explicitly enables parallel undertakings — plus grievance moments, calling changes, and checkpoint turnings across all spotlight agents. No decision budgets the interrupt rate; the pressure valve (badge-first) was deliberately closed for tension reasons. Attention tiers are the implied answer, but the pacing math is nowhere.

### D. Factual verification

| Claim | Verdict | Evidence |
|---|---|---|
| Today's prioritization is a bolt-on comparison, not one board | **Checks out** | `src/engine/phaseAgentDecision.ts:720-740` (`bestStrategicScore > bestEncounterScore`), `:896-945` (initiative comparison gated on `decisionFamily !== 'strategic_action'`) — three sequential winner-take contests, separate scorers |
| Support bundle reuse policy as the recon describes | **Checks out** | `src/engine/encounterSupportBundle.ts:79-140` (find sublocation else deterministic-id mint → self-reuse), `:150-163` (actor order: `encounterSupportRole` match → unclaimed `npcRole` in `reuseNpcRoles` → mint), `:118` (minted sublocations stamped `PERMANENT_SUBLOCATION_PERSISTENCE`) |
| `persistence` declared but unenforced | **Checks out** | `'must-persist'`/`'scene-only'` written throughout `src/data/default-support-bundles.ts` and typed in `src/types/encounter.ts:201`; no engine consumer branches on the binding's value |
| Value-pole standings readable per agent; today's ambition selector doesn't use them | **Checks out, one wrinkle** | `AxiologicalProfile = Record<ValuePair, number>` at `src/types/agent.ts:22`; canonical per-reach axes in `src/types/axisRegistry.ts`; `src/engine/ambitionSelection.ts` uses only reach floors, traits, sphere affinity, bonds. **Wrinkle:** two coexisting scales — legacy storage is ±1 (virtue +1/vice −1), the canonical registry is 0–1 with 0.5 neutral and describes itself as labels-only over legacy storage. The new selector weight must route through that mapping; a plan doc that reads the raw profile on the wrong scale inverts the poles. |
| Initiatives dead via wealth floor | **Checks out** | `src/engine/initiativeCandidates.ts:94-98` (global `INITIATIVE_MIN_WEALTH_FLOOR` early-return) plus per-template `minWealth` gate at `:197-201` |
| Network mapping needs no new node/edge types | **Checks out, one flag** | `member_of`: actor→actor, many-to-many (`src/types/edgeSchema.ts:136-144`); `commanded_by`: actor→actor, many-to-one (`:415-423`). **Flag:** `commanded_by`'s schema description reads "Army is commanded by this agent. **Commander is physically committed to the army**" — semantics the network use directly contradicts (a network owner is by definition *not* co-located with a dispersed web). The THR-1288 resolution requires updating the `groupQueries.ts` header but not this schema description; it should be amended in the same pass. |
| Eight reaches canonical | **Checks out** | `Docs/canon/rulebook-quick-reference.md:34` ("Eight Reaches"); `axisRegistry.ts` module doc ("each of the 8 Reaches") |

**No verified claim failed.** The strains in section C are all forward-looking (coverage, commensurability, data poverty, ambient reach, pacing), not misstatements of the present.

## Appendix B — Engineering red-team report (Fable agent 2, verbatim)

### CRITICAL — design decision needs revisiting before plan docs

**C1. The network's `member_of` edges leak into the faction-membership predicate — THR-1288's "free by construction" claim is refuted.** THR-1288's resolution claims a node carrying only `networkState` is "invisible to both by construction — no company sweep needs re-teaching," having checked only `src\engine\groups\groupQueries.ts` (`isCompanyNode`, armies via `armyState`). It did not check the *other* discriminator: `src\engine\graphQueries.ts:89-104`. `isFactionMembershipEdge` is implemented as `!isCompanyMembershipTarget(...)`, and its doc comment states its load-bearing premise verbatim: *"Companies are the only non-faction `member_of` target that exists, so excluding them is both sufficient and safe."* A network node carries `actorType: 'group'` with **no** `groupType` and **no** `armyState`, so `isCompanyMembershipTarget` returns false and the predicate classifies a contact's `member_of → network` edge as **faction membership**. Consequences flow straight into `getFactionMembershipEdges` and `getAgentFaction` (graphQueries.ts:111-132) and everything downstream the module names as its consumers (faction reputation, socialLeverage, agentDetail): every network contact would read as belonging to a faction named "The Saltway Ring". Note the predicate is deliberately exclusion-shaped because "faction nodes are not uniformly tagged across worldgen and fixtures" — so the obvious fix (require `actorType === 'faction'`) is documented as unsafe. **Fix:** pull the resolution's own `groupKind` flag forward to now; at minimum extend `isCompanyMembershipTarget` to exclude `networkState` and audit every raw `getOutgoingEdges(id, 'member_of')` reader (the overload is now four-way).

**C2. "Projects adopt the encounter step/outcome shape" collides with the one-unresolved-action-per-agent invariant, and the verdicts never say which runtime undertakings live in.** Two runtimes exist today: `state.unifiedActions` (encounter steps, outcome bands, forecast, veil, aftermath) and `state.strategicState.projects` (`src\types\strategicAction.ts:171-201`, advanced passively by `src\engine\phaseStrategicProjects.ts` with no dice). The decision loop enforces one in-flight unified action per agent: `src\engine\phaseAgentDecision.ts:302-304` builds `busyAgentIds` from every unresolved unified action and line 349 skips busy agents entirely. If undertakings **become** unified actions, a season-long undertaking freezes its agent out of all encounters — `can-run-beside` requires breaking a structural invariant — and undertakings inherit unified-action semantics never designed for multi-week lifetimes (`phaseAgentLifecycle` silently filters a dead actor's actions with no residue, `src\engine\agentLifecycle.ts:444-447`; `currentStep`-freeze; interrupt-surface assumptions). If undertakings **stay** in `strategicState` with a duplicated dice implementation, the "one board / one register / one interface family" rulings are undermined by two step-resolution engines drifting apart. Neither branch is chosen anywhere in the eight resolutions. **Fix:** the substrate plan doc must pick the runtime explicitly and cost the busy-gate change; `can-run-beside` is a ticket-sized engine change, not "decided, not ticketed."

**C3. Initiative retirement silently breaks Mentorship, which no decision mentions.** `src\engine\phaseMentorship.ts` is a full phase coupled by contract to the initiative runtime: it bootstraps from `initiative.train-apprentice` via `actor.properties.activeInitiative` (`InitiativeProgress`), syncs `mentors`-edge progress from `phaseInitiativeProgress`, fails initiatives on mentor/apprentice separation, and runs its terminal arc off initiative completed/failed status (phaseMentorship.ts:4-20, 73-93, 246-296). `src\data\mentorship-templates\divine-actions.ts` (Inspire/Sever mentorship) points at the same machinery, distinct from the two initiative divine actions the verdict does retarget (`src\data\action-technical-effects.ts:366-374` shows both pairs). Deleting `phaseInitiativeProgress`, `activeInitiative`, and `InitiativeProgress` orphans all of it. The wealth-floor deadness means mentorship is *also* mostly dead today — an argument for folding it into undertakings, but the design must say so; the retirement's stated blast radius (7 templates, 2 divine actions, 2 UI fields) is materially incomplete. ~424 initiative references across 32 files; the migration ticket needs the full list.

### SERIOUS — plan docs must explicitly address

**S1. The `controls` migration is entangled with faction territory — 132 occurrences across 72 files, most of them not the upkeep loop.** The `controls` edge type is shared infrastructure: faction territorial control seeded at worldgen (`src\engine\worldSeed.ts`, 4 uses), essence-source income (`src\engine\essenceSources.ts`, 4; `essenceIncome.ts`), influence, army supply, battle aftermath seizure, threat rating, rival source contestation, lair escalation, retinue (5), route events, graph conditions/effect predicates, prose resolvers. Only a minority is the agent-upkeep stance being retired (`strategicActionLifecycle.ts:330-367`, `StrategicControlState`). The verdicts never say whether the new one-ownership-edge-type **is** `controls` (then agent holdings become visible to every faction-territory consumer — essence income for holding a warehouse?) or a **new** edge type (then 72 files are blind to ownership by default and each consumer needs an explicit decision). Plan doc needs the consumer-by-consumer disposition table.

**S2. Control-family removal opens a decision-mix vacuum during tier sequencing.** Removing control deletes ~40% of the strategic candidate supply in one stroke, while its replacement supply (T1–T3 kind libraries) arrives tier-by-tier by design. If upkeep removal lands with T1 only, the interim world has *less* proactive behavior than today's broken one — the north-star metric regresses during exactly the window Christian will be looking. Plan docs should gate the deletion on a measured decision-mix floor, not on tier count.

**S3. "One board" is a rewrite of two incommensurate scoring philosophies, and the design underprices it.** Today's encounter scorer is a multiplicative value-economy: `finalScore = valuePerTick * desireMultiplier + resonance`, then novelty × capability-ceiling × EMA-ceiling × global-share multipliers (`src\engine\encounterScoring.ts:6, 1321`, 1462 lines). The strategic scorer is a 7-weight additive sum normalized to 0–1 and bridged with a single constant `STRATEGIC_ENCOUNTER_SCORE_BRIDGE = 0.85` (`src\engine\strategicActionScoring.ts:72-87`, `src\data\strategic-action-constants.ts:95`). A genuine one-board must give undertakings a value-per-tick semantics or invent a third currency — either way, every existing tuned constant is re-tuned from scratch, and grievance heat plus temperament weights land on the same rewrite. Plan docs need a convergence plan (shadow-scoring both boards with trace comparison before cutover), not just the destination.

**S4. Real-mint population growth is monotone and uncapped; the lifecycle valve is bypassed.** Minted inhabitants start at `DEFAULT_REPUTATION = 0.5` (`src\types\disposition.ts:165`); death only fires below 0.1 (`agentLifecycle.ts:50-53`), and reputation decays toward baseline — commodity mints effectively never die. Births are throttled by a deliberate global valve — at most one per tick, none on a death tick (`agentLifecycle.ts:239, 439`) — which the binder's mint path bypasses entirely. Rate bound: 55 projects by tick 60 (~0.9/tick); at 1–2 commodity cast per undertaking that is ~1 permanent agent per tick — on a medium map (~414 agents) population doubles by tick ~500, and the large map already stalls at ~1010 agents (THR-162/163/164/165). Encounters migrating onto the same binder widens the faucet. **Fix:** a mint budget per agent/undertaking, routing commodity mints through the lifecycle valve, or a recycle policy — as a tunable constant (NFP #1), not a hope.

**S5. "Never silently reaped" needs a named list of reapers.** (1) sublocation dissolution — `src\engine\sublocation.ts:598-706` `removeNode`s temporal/conditional sublocations with no binding check; (2) lifecycle death removes the node **and all its edges** (`agentLifecycle.ts:213-218`) while `supportBindings` are bare `nodeId` strings (`src\types\unifiedAction.ts:2729`) with no graph edge — nothing marks "bound by an undertaking," so any reverse lookup is a scan or a new index; (3) seed-inheritance's contractual silent drop (`encounterSeeding.ts:122-127`); (4) the THR-669 transit-hex GC that already evaporated trade routes once (`strategicAction.ts:180-186`); (5) battle/siege deaths. Inherit the THR-1286 lesson: a dead record is not inert — `computeControlPressure` reading a collapsed stance's frozen `neglectTicks` pinned re-claim scores at maximum (`strategicActionLifecycle.ts:333-337`); an undertaking runtime holding dead `nodeId`s can poison the five-weight scorer the same way. Enumerate the list, mark each reaper loud-or-lazy.

**S6. Holdings are a three-object mirror; seize-as-transfer is a multi-write atomic operation with a known drift precedent.** Attachments are graph *nodes* held via possession edges (`src\types\attachments.ts:76-123`). A holding is: the world object node + the ownership edge + the bearer's attachment node/edge. Seize must atomically retarget the edge, destroy the loser's attachment, mint the winner's — under mutation-in-place with `touchWorld()` discipline. The codebase's precedent says mirrors drift: `roster`/`bandFactionId` needed `reconcileLostMembers` machinery and a hard edges-stay-authoritative rule (`groupQueries.ts:73-77, 113-114`). Also: `phaseSlotCaps` enforces attachment slot caps — the `holding` category needs an explicit cap exemption. Single-writer module named in the plan doc.

**S7. The binder "promotion" is a euphemism — it is a new system, with unbudgeted query costs.** Today's bundle (349 lines) is find-first with deterministic IDs and zero scoring; no candidate enumeration, no modify path, no per-step anchoring. Unpriced costs: **scarcity** needs a world-wide role census (O(all actors) per role without a maintained index); **story-ties** needs relationship-edge queries per candidate; the existing helper already does a full linear actor scan just to find a faction node (`encounterSupportBundle.ts:59-70`). At spotlight scale likely affordable, but "encounters migrate opportunistically" multiplies it toward every draw. Identity-fit presumes identity data today's minted cast lacks — `materializeActorSupport` (lines 177-193) creates actors with **no** `domainCapabilities`, no `axiologicalProfile`, no ambitions: "born real" means rebuilding the mint path to the full ~90-line birth pipeline (`agentLifecycle.ts:306-424`). One more loss: fresh-minting for commodity roles abandons the deterministic-ID dedup that bounds `enc_support_*` accumulation (`makeSupportNodeId`, line 15) — the new ID scheme must stay seed-deterministic (NFP #3) while instance-unique.

### MINOR — executor-level care

- **M1. BehaviorFamily retirement is wide but shallow — with a sequencing trap.** 121 occurrences / 24 files, but mechanically pass-through labeling (`strategicActionCandidates.ts:205` just copies it; no gate reads it). However it is rendered by `ThreadsPanel`, `ThreadDetailView`, `AgentInfoCard`, `StrategicMarkerMesh` and persisted in `StrategicHistoryEntry`/traces: the calling must land in the same PR-window or those surfaces render nothing / break on old history records.
- **M2. Distance matrix cap.** Runtime place-founding (T2) grows location count toward `MAX_DISTANCE_MATRIX_SIZE` (1200; epic already ~805). The T2 plan doc should note the ceiling.
- **M3. Moment-interrupt volume.** The interrupt registry and attention tiers exist, so the surface is feasible — but ~0.9 undertakings/tick × checkpoints interrupting "as encounters do" is a pause-storm at pause-tier attention. Flag for the moments plan doc.
- **M4. `holding` category addition** — sweep exhaustive `Record<AttachmentCategory, …>` maps and codex/UI category switches; `categoryWeights` is `Partial`, so reward pools are safe.
- **M5. `member_of` now carries a fifth semantics** (faction, company, army, band, network) — beyond the C1 predicate fix, every raw `getOutgoingEdges(_, 'member_of')` reader deserves a one-time audit row in the T1 plan doc.

### Survived attacks (tried and failed)

1. **THR-726 "proven lane" claim** — verified real and wired: `mintAmbitionsFromEvents` runs inside the ambition tick with a cross-agent per-event cap and a measured dedup fix (`src\engine\ambitionTick.ts:244-322, 494-498`).
2. **Ambition-selector recon accuracy** — `ambitionSelection.ts` uses only reach floors, traits, sphere affinity, bonds; the value-pole term is genuinely additive.
3. **No new node/edge types for networks** — honors the load-bearing decision; `phaseGroups`/army sweeps genuinely won't touch a `networkState`-only node; faction-member iteration already skips group-typed members. The leak is only the C1 predicate.
4. **Eight reaches** — code confirms 8; CLAUDE.md's "Nine Reaches" is stale prose exactly as the grammar verdict says.
5. **Determinism under per-step re-anchoring** — no NFP #3 violation: fully seeded sim, deterministic graph inputs; per-step binding changes *when* the world is read, not reproducibility.
6. **Rejected-approaches sweep** — nothing reintroduced; kind-first open registry is consistent with the open-ended template-pool decision; ownership-as-edge honors "relationships are edges" (with the S6 mirror caveat).
7. **Initiative deadness** — wealth floor confirmed; retiring the scorer loses nothing live (the mentorship coupling, C3, is the exception).
8. **Save-size attack withdrawn** — no gameState serialization exists; real-mint growth costs memory and tick time (S4), not save files.

### Overall feasibility verdict

The map's individual verdicts are mostly well-grounded in real code. The design's weakness is not any single decision but the **combined diff**: five destructive changes (initiative retirement, family retirement, upkeep removal, binder rewrite, one-board rewrite) whose "additive, tier-by-tier" framing genuinely covers template *content* but is nominal for the scorer, the busy-gate invariant, and the type-level retirements, which are all-at-once by nature. C1–C3 are the three places a plan doc written from the resolutions as they stand would ship a defect or discover mid-implementation that a decision is missing.

## Appendix C — Game-design red-team report (Fable agent 3, verbatim)

**Scope note on the numbers used.** The map header says ~17 spotlight agents; the field survey measured 46 (seed 42) / 39 (seed 99) spotlight agents running ~15 decisions per tick, so this report models with the survey's measured range. 12 ticks = one in-game day, so a run day carries ~180 spotlight decisions.

### CRITICAL — revisit the decision before plan docs

**C1. The interrupt-for-tension decision and the ship-at-notified-moments decision contradict each other, and the collision lands on the player.** The director's verdict (THR-1279 §5) is that moments interrupt *"so the god can eventually nudge and the player experiences the tension."* But the standing preference is *ship at notified-moments, architect for nudgeable checkpoints* — so for the entire v1 lifetime, every interrupting moment is a modal the player can do exactly nothing about. The encounter interrupt this is modeled on carries a hand of cards; the undertaking interrupt carries a dismiss button. "Tension" requires the possibility of action — the rulebook's own Three-Beat doctrine says *scan means you chose to look; encounter is the chapter*. An unactionable interrupt is a toast wearing a chapter's clothes. Players calibrate on the first hour: interrupts that never want anything train dismiss-spam, muscle memory that survives the patch adding nudge cards — the design poisons the well for its own end-state. Worse, the moment card is mandated to share *the same register and interface family* as encounters, so the unactionable modal looks exactly like the actionable one, teaching that this interface sometimes means "act" and sometimes "acknowledge" — the one lesson an interrupt surface must never teach. **Smallest fix:** gate interrupt *classes* on agency until agency exists — completions, destructions, named-death complications interrupt (reading them IS the action); at-cost checkpoints and foundings badge until the nudge hand ships, then graduate to interrupts *with cards in them*. Or ship one degenerate nudge in v1 so no interrupt is ever card-less.

**C2. The interrupt population dial has no good setting — the volume model and the north star pull in opposite directions.** Post-redesign, the control family (37–40% of all decisions) is deleted and project decisions (8.5% today, 210 starts/run) plausibly grow 2–4×: conservatively ~300–500 undertakings per run × 3–5 checkpoint dice ≈ **~1,200–2,000 checkpoint resolutions per ~165-tick run ≈ 90–150 per in-game day** across the spotlight population. The game's own texture doctrine makes *advance-at-cost the dominant outcome* — and the moment-class list makes it an interrupting class: **the design maps the game's most common outcome to its most intrusive surface.** The tier dial has two positions and both fail: narrow (First + retinue) → the north star (*"follow ANY spotlight agent"*) is served entirely by badges ruled recovery-only; wide (all spotlight) → at ~46 spotlight agents an interrupt every tick or two, Play becomes decorative, and undertaking noise drowns the encounter interrupts that carry actual cards. The map's phrasing does not pin which population — the ambiguity is itself the hazard. Interrupt fatigue is not recoverable by tuning; players quit the pause model, not the constant. **Smallest fix:** make attention *player-conferred* (already the game's doctrine — threads, court positions, "scan means you chose to look"): an agent's moments interrupt iff at a pause-tier court position (First/retinue) **or the player has explicitly followed their arc** (a follow toggle on the arc panel — one bit of state, and it makes the north star literal). Two dampers: only the *first* at-cost per undertaking interrupts (novelty gating); completions/destructions always interrupt for followed agents.

### SERIOUS — plan docs must address

**S1. The substrate verdict and the grammar verdict contradict each other on what failure leaves behind.** Substrate §2: *"failed projects leave half-built objects in the world."* Grammar §5: *"failure default is a clean end — no graph litter"*; binding §4: *"halt creates nothing"*; naming §2: failures stay nameless. These cannot all be true — and the nameless-failure rule grinds against the north star's own *"scarred"* clause, because the scar class (failed works-in-progress) is exactly the class denied names and existence. A player who watched a season of interrupting at-cost moments, then gets one chronicle line and an unmarked world, has been shown drama with the ending amputated. NFP #5 argues *for* the half-built ruin. **Smallest fix:** failure residue follows *visibility* — an undertaking that ever produced an interrupting moment fails visible (half-built object or scar entry, referenced by the working possessive, canonized as the *failure-name* register — "Hesk's folly"); undertakings that lived below the badge line fail clean.

**S2. By the map's own data, the north star is unreachable for a third of the spotlight population, and the fix is deferred.** A third of all spotlight decisions are idle, 700/798 at wilderness lairs, where neither encounters nor undertakings-as-drafted fire; "the wilderness verb" sits in Not-yet-specified. The acceptance test fails on day one for every lair-parked agent — and an empty arc panel is worse than none: it converts a sim gap into a visible broken promise. **Smallest fix:** T1's catalog already contains the wilderness verb — **chart/expedition find** — point lair-anchored agents' scorer at it; the lair is the stage, the wilderness the subject. Converts the largest wasted decision bucket into the explorer arcs T1 claims to activate.

**S3. Halt has no exit, so the design risks rebuilding the churn treadmill it just killed.** Capability-poor world + sigmoid saturation + 5% floor ⇒ halts will be common; halt "creates nothing"; nothing says what happens next. If the one-board scorer re-offers the halted undertaking (story-ties says it should), the metronome of completions becomes a metronome of halts — attempt/halt/re-attempt, the same treadmill with better prose; the player following an arc sees Sisyphus. **Smallest fix:** a halt ratchet, three tunable constants — N halts on the same undertaking → forced fork at the next checkpoint between *abandon* (chronicle line + S1's residue rule + candidate mint event; abandonment as grievance fuel is free drama) or *escalate* (re-bind with the complication machinery, raising stakes instead of repeating them).

**S4. The one-grievance-slot + succession rule produces an on-screen absurdity: the living victim shrugs while his friend takes up the cause.** One active grievance per agent; succession fires when the owner "cannot carry it (dead, Broken, **or grievance slot consumed**)." Scenario the player will see: Vorn nurses a grievance over a stolen cache; Hesk razes Vorn's home; the razed-home grievance passes to Serra while Vorn stands alive in the ruins, officially aggrieved about the cache. Succession-past-the-dead is dignified; succession-past-the-*distracted* is slot arithmetic leaking into fiction. **Smallest fix:** replacement by magnitude — a new harm to a living owner that outweighs the active grievance *replaces* it (displaced grievance demotes to its grudge edge immediately; the moment names the turn: "the cache is forgotten; the ruin is not"); succession fires only past the dead and the Broken.

**S5. Pre-checkpoint-nudge, the god's only verbs into undertakings are off-surface, and the scapegoat-mint rule can make the blame illegible.** The undertaking loop closes end-to-end without the god; the stated v1 touchpoints are pole-drift (real but invisible-by-construction) and Inspire/Sabotage retargeted to projects — but those live in the ActionDrawer, *not on the moment card*: at the precise second the sim pauses to show the god a mortal's undertaking, the interface offers the god nothing. Separately, the scapegoat rule (divine harms mint against the visible mortal beneficiary) is thematically superb but has no stated legibility surface — a grievance lands on the player's own First and reads as persecution, not consequence. **Smallest fix:** (1) the moment card's action slot hosts Inspire/Sabotage when the moment's undertaking is a legal target — the interrupt becomes the god's on-ramp a full tier before nudgeable checkpoints; (2) the scapegoat mint's provenance chip names the divine act in the chain, clickable ("because of the blighted fields — a blessing his neighbors did not share").

### MINOR — executor care

- **M1. Callings may be readable but inert.** Capability sigmoids saturate and reach profiles go near-static while hysteresis suppresses recomputation — "a calling change is a chronicle moment" risks being vacuously rare, the title lagging deeds (the sheet says Mender while he razes his third route; deeds don't feed the formula). Executor: weight the ambition term (the volatile input); verify against telemetry that callings change at a narratable rate before shipping the chronicle-moment claim.
- **M2. Born-real mint inflation.** Hundreds of undertakings per run on a ~414-agent map; untuned, population becomes majority undertaking-exhaust. Scarcity weight should scale with regional population; plan docs name a mint budget as a tunable (NFP #1).
- **M3. Mid-build naming texture.** Working possessives are honestly readable and the christening is a genuine payoff — survives. Two care items: the assembled recipe will produce clunkers ("The Dunmar Warehouse Brotherhood") — the possessive fallback should also fire on *quality* (lexicon-miss), not only coverage; and "Hesk's folly" needs disambiguating as a register, not a name (see S1).
- **M4. Interrupt collation.** `can-run-beside` means one agent can legally produce an encounter interrupt and a checkpoint interrupt in the same tick. Define collation order (encounter first — it has cards); never stack two modals.
- **M5. Undertakings touch no divine economy.** A completed Work by a devoted agent generates no essence, no worship, no portfolio depth. Fine to defer past T1, but it's the obvious hook that makes the god *want* the world to build — worth a recorded line so it isn't lost.

### Attacks the design survived

- **"Three-effect flattening drains drama" — survived.** The full five-band ladder still rolls underneath; advance/at-cost/halt is a presentation collapse for mid-arc beats, crits as intensifiers. Checkpoints are chapters, not climaxes; three legible effects at chapter scale is the right altitude. Only the residue contradiction (S1) leaks.
- **"Self-driving protagonists upstage the god" — survived as architecture.** The two-way-thread doctrine, pole-drift into drive selection, the settlement door, and the charted nudgeable end-state make the god structurally present; the failure is only the v1 window and surface placement (C1/S5), not the shape.
- **Control-upkeep removal** — unambiguously right; the survey data is damning and ownership-as-attachment reuses proven surfaces.
- **One scorer, one board** — restores the original inspectable-board intent; pure win for NFP #2.
- **The binding verdicts** (born-real cast, per-step anchoring, honest deaths as named complications, "you can only reach where your works reach") — the strongest game-design material in the map; severing a network un-footing remote works is elegant, spatial, legible counter-play.
- **Names outlive owners / seizure keeps the name / echo names** — genuinely great; "the Second Saltway" is the chronicle doing worldbuilding for free.
- **Anti-vendetta damping** (spotlight-only chains, three closure doors, satisfaction suppressing re-mints) — deliberate and correct. Only the living-owner slot case (S4) leaks.
- **The interrupt architecture itself** (registry, cause named, badges as recovery, tier-gated) — the right chassis; every critical finding is about what rides in it and for whom, not the chassis.

**Bottom line.** The map's world-simulation layer is in excellent shape — binding, naming, and the reactive loop are better game design than most shipped god-games. Both CRITICAL findings live in the same seam: the moment surface, where the sequencing plan (notify now, nudge later) quietly breaks the director's stated rationale for interrupting at all, and where the interrupting population was never pinned. Resolve C1/C2 as one decision — *whose moments interrupt, and what can the player do inside one, at each ship stage* — before the surfacing plan doc is drafted; everything SERIOUS below it is addressable inside the plan docs as written.
