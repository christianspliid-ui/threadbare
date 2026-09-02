# Ubiquitous Language — Agents

Content-adjacent shard. Terms covering entities in the simulation: agents, actors, Ascendant, factions, and their relationships.

---

### Agent

**Aliases:** Individual, Mortal Agent
**Also see:** `[[Actor]]`, `[[ActorType]]`, `[[NPC]]`
**Status:** canonical

An individual entity (actor node with `actorType: 'individual'`) in the world simulation. Agents have spatial position, traits, domain capability, relationships, and ambitions. They move, encounter each other, form factions, and develop through tick-driven behavior. "Agent" means a living individual — not all actors are agents.

---

### Actor

**Aliases:** Actor Node
**Also see:** `[[Agent]]`, `[[ActorType]]`, `[[Node]]`
**Status:** canonical

The graph node type (`type: 'actor'`) representing any simulated entity: individual, faction, culture, group, god, or ascendant. The `actorType` property on the node distinguishes the subtype. "Actor" is the graph-level term; "agent" is the semantic term for individuals.

---

### ActorType

**Aliases:** Actor Subtype
**Also see:** `[[Actor]]`, `[[Agent]]`, `[[Faction]]`
**Status:** canonical

The taxonomy of actor subtypes stored in `actor.properties.actorType`: `god`, `ascendant`, `faction`, `culture`, `group`, `individual`. Drives behavior routing, action availability, and encounter scoring. Do not add new actor types without verifying they don't already exist under a different name.

---

### Ascendant

**Aliases:** The Ascendant, God-Self
**Also see:** `[[The First]]`, `[[Thread]]`, `[[Actor]]`
**Status:** canonical

The player's seat in the world: a powerful former mortal who has transcended to divine status. The player is a god, never a protagonist — the Ascendant is not a directly-controlled player character ("Player Character" was retired as an alias 2026-08-28, THR-1338; the rejected framing). Stored as an actor node with `actorType: 'ascendant'`. Uses the same Domain Capability prerequisite system as mortal agents — no special-cased entity logic. Power level is tunable via constants, not architecturally different.

---

### The First

**Aliases:** Bonded First, First Agent
**Also see:** `[[Ascendant]]`, `[[Thread]]`
**Status:** canonical

The bonded mortal agent who anchors the Ascendant's divine presence in the world. The First is a regular individual agent who has been formally bonded via a `thread` edge. They are the Ascendant's narrative anchor and the primary interface to mortal affairs. Seeded automatically in `?view=game&seeded` — use that URL for all standard testing.

---

### Thread

**Aliases:** Divine Thread
**Also see:** `[[Ascendant]]`, `[[The First]]`, `[[EdgeType]]`
**Status:** canonical

A `thread` edge type connecting an Ascendant to a mortal agent. Threads are the mechanism by which divine influence flows into the world. Thread stress produces Thread Tugs in the attention system. The Ascendant can maintain multiple threads but the First thread is the anchor.

---

### Retinue

**Aliases:** the ascendant's retinue, the `'retinue'` `[[Court Position]]`
**Also see:** `[[Thread]]`, `[[Court Position]]`, `[[Ascendant]]`, `[[Portfolio Pin]]`, `[[Companion]]`
**Status:** canonical

The mortals an Ascendant holds close — the agents on the far end of a `[[Thread]]` whose `[[Court Position]]` is `'retinue'` — and, by extension, the panel listing everyone the god currently influences. It is a **divine-court** word: it names a god's hold on people it does not own, and it never names anyone travelling alongside a mortal.

**Arbitrated 2026-08-13 (THR-1099): the word means this and only this.** A second candidate sense arrived with `[[Companion]]` — the companion direction used "retinue" colloquially for the people who walk beside one mortal ("just a part of the retinue that gives a bonus"). That sense is **rejected for the word, not for the mechanic**; the mechanic ships as `[[Companion]]`. The court sense keeps the word on three counts: it is already what the player reads (the `Retinue` section heading in `RetinuePanel`), it is already a schema value (`CourtPosition`), and it is already documented in the rulebook — while the companion sense had a better word available and no surface committed to this one. Either assignment was display-vocabulary only, so the tie broke on incumbency, not on schema risk.

Prose therefore never says "retinue" for a mortal's companions, and never says "companions" for the god's threaded mortals.

Code anchors: `src/engine/retinue.ts` (`getRetinueAgents`, `RetinueAgent`), `src/types/influence.ts` (`CourtPosition`), `src/components/Game/RetinuePanel.tsx`.

---

### Faction

**Aliases:** Organization, Group (formal)
**Also see:** `[[Actor]]`, `[[ActorType]]`, `[[Member Of]]`
**Status:** canonical

A structured social entity modeled as an actor node with `actorType: 'faction'`. Agents join factions via `member_of` edges. Factions have agency, goals, and can be created or dissolved dynamically during simulation. Faction behavior is simulation-driven, not hand-scripted.

---

### Reputation

**Aliases:** Standing, Reputation With
**Also see:** `[[Reputation Tally]]`, `[[Reputation Score]]`, `[[Faction]]`, `[[BOND]]`, `[[standing_welcome]]`, `[[reputation_set]]`
**Status:** canonical

**The social score that modifies interactions between a and b.** (Director's wording, verbatim, 2026-08-23.)

Reputation is **directional**: a's reputation with b is not b's reputation with a. Every leg reads outgoing edges from a only. It is always displayed as a **band word**, never a number — `Distrusted / Unknown / Accepted / Respected / Revered` (`REPUTATION_WORDS`). Note the neutral default `REPUTATION_WITH_DEFAULT` (0.5) already bands as **`Accepted`**, so a gate that means "this person has earned something" must test `Respected` or above; gating at `Accepted` admits everyone who has never met you.

Four legs answer it, read through the single API `getReputationWith(graph, aId, bId)` in strict priority order — the first leg that matches wins, and the reading carries which one did as `source`:

| Leg | Store | Covers |
|---|---|---|
| `membership` | `member_of.reputation` | a faction a belongs to — the only leg carrying rank, access, and expulsion |
| `edge` | `reputation_with` edge (THR-1206) | a place, a person, or a faction a does **not** belong to |
| `bond` | `relates_to.trust`, remapped `[-1,1]` → `[0,1]` | a personal relationship |
| `default` | — | nothing has happened between a and b |

Only the **edge** leg is written through this module (`adjustReputationWith`); membership and bond keep their own writers, so a write against a faction a belongs to does not silently mint a second, competing standing.

Until 2026-08-23 the UL defined **none** of the six mechanisms that wore this word, which is how they were able to disagree for as long as they did. Three of the six are separate concepts that keep the word and must not be conflated with this one — `[[Reputation Tally]]`, `[[Reputation Score]]`, and the deprecated `[[reputation_set]]`.

Code anchors: `src/engine/reputation.ts` (`getReputationWith`, `adjustReputationWith`, `REPUTATION_WITH_DEFAULT`), `src/data/domain-words.ts` (`REPUTATION_WORDS`).

---

### Reputation Tally

**Aliases:** reputation_tally, reputationTallies
**Also see:** `[[Reputation]]`, `[[Trait Category]]`, `[[Reputation Score]]`
**Status:** canonical

**What a mortal is becoming known for** — not reputation with anyone. Stored as `reputationTallies` on the actor node, a partial map keyed `<reach>.<polarity>` (`ReputationTallyKey` = `` `${ReachDomain}.${'positive' | 'negative'}` ``, e.g. `heart.positive`, `iron.negative`). Encounter completions increment the key their outcome earned; `phaseReputationTraits` decays every tally by `REPUTATION_TALLY_DECAY_PER_TICK` and mints or removes `reputation`-category traits at the `REPUTATION_LEVEL_*` thresholds, which in turn feed the agent's `{title}`.

The distinction is load-bearing, not pedantic: a tally is one-sided and *about a subject*, where `[[Reputation]]` is directional and *about a pair*. Conflating the two is what produced 171 dead tally writes on keys nothing reads (THR-1207) — a write to an off-axis key is discarded silently, so the fiction reads as if it landed.

Code anchors: `src/types/agent.ts` (`ReputationTallyKey`, `ReputationTallies`), `src/engine/phaseReputationTraits.ts`, `src/data/reputation-trait-content.ts`.

---

### Reputation Score

**Aliases:** reputationScore, world renown
**Also see:** `[[Reputation]]`, `[[Reputation Tally]]`
**Status:** canonical

**How the world at large regards X** — one-sided renown, with no second party in it. A `0–1` number on the actor node's `reputationScore` property, defaulting to `DEFAULT_REPUTATION`, moved by aftermath and complication effects. Retained as a distinct concept, and it **shares the band vocabulary** (`REPUTATION_WORDS`), which is exactly why it reads as the same thing on screen and is not.

Choosing between the three: ask *who is regarding whom*. A pair → `[[Reputation]]`. Everyone, about one subject → Reputation Score. What that subject is becoming known **for** → `[[Reputation Tally]]`.

Code anchors: `src/engine/agentLifecycle.ts`, `src/engine/complicationEffects.ts`, `src/engine/encounterAftermath.ts`.

---

### reputation_set

**Aliases:** reputation_set effect kind
**Also see:** `[[Reputation]]`, `[[Reputation Score]]`
**Status:** deprecated

An aftermath effect kind that **set** a reputation surface to an absolute value. Retired from the authoring vocabulary by THR-1206 — new content expresses a standing move as a *delta* against the pairwise leg instead, so two encounters can no longer overwrite each other's outcome. The handler in `src/engine/encounterAftermath.ts` is deliberately **retained** so saved worlds and already-authored templates keep resolving; do not author new uses, and do not delete the handler.

---

### standing_welcome

**Aliases:** trait.condition.location.standing_welcome
**Also see:** `[[Reputation]]`, `[[Trait Category]]`
**Status:** deprecated

A location-scoped condition marking a person as welcome at a place — the bespoke predecessor of reputation-with-a-place. **Superseded by `[[Reputation]]`'s `edge` leg**, which expresses the same fiction as a directional standing rather than a timed condition. THR-1206 left it with **zero writers**; the definition and its duration constant survive only so saved worlds resolve. A returning-welcome beat is authored as a `reputation_with` move on the place, never by applying this condition.

---

### Rival

**Aliases:** Rival God, Rival Ascendant
**Also see:** `[[Ascendant]]`, `[[Actor]]`
**Status:** canonical

A competing divine entity generated from the World-Soul at world creation. Rivals are not hand-authored — they emerge from the seeded cosmological configuration. The fixed rival pantheon design was rejected; rivals are always procedurally generated. Stored as actor nodes with `actorType: 'god'`.

---

### Portfolio Pin

**Aliases:** Pinned Agent, Portfolio Agent
**Also see:** `[[Agent]]`, `[[Ascendant]]`
**Status:** canonical

A player-marked agent (`isPortfolioPinned: true` on the actor node properties) designated for elevated attention in the UI. Pinned agents receive higher narrative prominence in the digest and thread panel. The Ascendant chooses which agents to pin; unpinned agents still receive full simulation treatment.

---

### Avatar

**Aliases:** Divine Avatar
**Also see:** `[[Ascendant]]`, `[[EdgeType]]`
**Status:** canonical

An agent created as a physical manifestation of the Ascendant's divine presence. Connected to the Ascendant via an `avatar_of` edge. Avatars are rare and structurally distinct from the Ascendant's normal thread-based influence.

---

### AxiologicalProfile

**Aliases:** Axiological Profile, Value Profile, Agent Values
**Also see:** `[[ValuePair]]`, `[[Reach]]`, `[[Agent]]`
**Status:** canonical

An actor's signed score across every `ValuePair` — `Record<ValuePair, number>` ranging from −1.0 (flaw pole) to +1.0 (virtue pole). Drives epithet generation, social-encounter responses, ambition selection, and cross-agent compatibility scoring. The eight Reach-bound pairs plus the meta pair `courage_prudence` make nine slots per profile. Definition: `src/types/agent.ts`.

---

### ValuePair

**Aliases:** Axiological Pair, Virtue/Flaw Axis
**Also see:** `[[AxiologicalProfile]]`, `[[Reach]]`
**Status:** canonical

A single virtue-flaw axis composing an `AxiologicalProfile`. The eight Reach-bound pairs are: `mercy_ruthlessness` (Iron), `asceticism_extravagance` (Gold), `honesty_cunning` (Shadow), `tradition_novelty` (Veil), `loyalty_ambition` (Heart), `revelation_discretion` (Eye), `preservation_transformation` (Stone), `sacrifice_survival` (Star). Plus one meta pair: `courage_prudence`. Convention: +1.0 = first pole (virtue), −1.0 = second pole (flaw). The pre-TB-075 pairs `frankness_propriety`, `humility_pride`, and `stoicism_passion` are deprecated; do not reintroduce them.

---

### mentor

**Aliases:** Mentor Agent
**Also see:** `[[apprentice]]`, `[[mentors (edge)]]`, `[[Train Apprentice]]`, `[[Domain Capability]]`
**Status:** canonical

An agent at Domain Capability tier ≥ `MENTOR_MIN_TIER` (currently 6) in any Reach, on the source end of an active `mentors` graph edge. A mentor actively teaches an apprentice through the Train Apprentice initiative. The minimum tier ensures the mentor has genuine mastery to pass on rather than shallow familiarity.

Code anchor: `src/data/mentorship-constants.ts:17`.

---

### apprentice

**Aliases:** Apprentice Agent
**Also see:** `[[mentor]]`, `[[mentors (edge)]]`, `[[Train Apprentice]]`, `[[Domain Capability]]`
**Status:** canonical

An agent at Domain Capability tier between `APPRENTICE_MIN_TIER` and `APPRENTICE_MAX_TIER` (currently 2–4) in the taught Reach, on the target end of a `mentors` edge in `offered` or `training` phase. The tier window ensures the apprentice has enough foundation to learn but still needs a mentor's guidance.

Code anchor: `src/data/mentorship-constants.ts:21,25`.

---

### mentors (edge)

**Aliases:** Mentors Edge, MentorsEdgeProperties
**Also see:** `[[mentor]]`, `[[apprentice]]`, `[[bondQuality]]`, `[[Train Apprentice]]`
**Status:** canonical

Directed graph edge from `mentor → apprentice` carrying the persistent mentorship relationship. Required properties: `domain` (ReachDomain), `progress` (0–1), `phase` (`offered` | `training` | `graduated` | `estranged`), `startedTick`, `lessonsCompleted` (0–4), `bondQuality` (−1..+1). Optional: `initiativeId`, `severedByDivineWill`. The edge persists even after the backing initiative ends — a `graduated` or `estranged` phase is the lasting record of the relationship.

Code anchors: `src/types/graph.ts` `MentorsEdgeProperties`, `src/types/edgeSchema.ts`.

---

### bondQuality

**Aliases:** Bond Quality, Bond Health
**Also see:** `[[mentors (edge)]]`, `[[Train Apprentice]]`, `[[Falling Out]]`, `[[The Surpassing]]`, `[[Quiet Parting]]`
**Status:** canonical

The narrative-derived health of a mentor↔apprentice bond, clamped to `[−1, +1]`. Initial value `BOND_QUALITY_INITIAL` (currently 0.0). Drifts on backing-initiative checkpoints: `BOND_DRIFT_ON_SUCCESS` (currently +0.15) on pass, `BOND_DRIFT_ON_FAILURE` (currently −0.20) on fail. Failures cut deeper than successes heal, reflecting the asymmetry of trust. Decides the terminal arc at graduation: ≥ `GRADUATION_BOND_THRESHOLD` → Graduation or The Surpassing; < `FALLING_OUT_BOND_THRESHOLD` → Falling Out; between the thresholds → Quiet Parting. Force-floored to `SEVER_BOND_QUALITY_FLOOR` (currently −1.0) by the Sever the Bond divine action.

Code anchor: `src/data/mentorship-constants.ts:47–55,59,63,94`.

---

### Train Apprentice

**Aliases:** initiative.train-apprentice, Apprenticeship Initiative
**Also see:** `[[mentor]]`, `[[apprentice]]`, `[[mentors (edge)]]`, `[[bondQuality]]`
**Status:** canonical

A multi-tick `social`-category initiative of type `initiative.train-apprentice` that wraps the mentorship relationship. The `mentors` edge is the persistent relationship; the initiative is the occupation wrapper that drives `progress` toward 1.0 over `MENTORSHIP_BASE_DURATION ± MENTORSHIP_DURATION_VARIANCE` (currently 8 ± 3) ticks, with `MENTORSHIP_CHECK_INTERVAL`-tick (currently 2) checkpoints. An apprentice straying beyond `MENTORSHIP_MAX_SEPARATION_HEXES` hexes (currently 3) fails the initiative.

Code anchor: `src/data/mentorship-constants.ts:29–41`.

---

### The Surpassing

**Aliases:** Surpassing Arc, mentorship.the-surpassing
**Also see:** `[[bondQuality]]`, `[[Train Apprentice]]`, `[[Falling Out]]`, `[[Quiet Parting]]`, `[[Dissolution]]`
**Status:** canonical

Terminal mentorship arc reached when the apprentice's Domain Capability tier in the trained Reach meets or exceeds the mentor's (by `SURPASSING_TIER_DELTA`, currently 0 — equal-or-greater triggers) AND `bondQuality ≥ GRADUATION_BOND_THRESHOLD`. Bittersweet: pride and loss in the same breath. Resolved via `mentorship.graduation` encounter seed with the `mentorship_surpassing` flavor in Phase 1; promoted to its own template `mentorship.the-surpassing` in Phase 2.

Code anchor: `src/engine/mentorshipOutcomes.ts:82–88`.

---

### Falling Out

**Aliases:** Falling Out Arc, mentorship.the-falling-out
**Also see:** `[[bondQuality]]`, `[[Train Apprentice]]`, `[[The Surpassing]]`, `[[Quiet Parting]]`, `[[Dissolution]]`
**Status:** canonical

Terminal mentorship arc reached when `bondQuality < FALLING_OUT_BOND_THRESHOLD` (currently −0.3) at resolution time. Cool failure: seeds the `mentorship.the-falling-out` encounter and creates a `hostile_to` edge if sentiment is below `HOSTILE_THRESHOLD` (currently −0.6), or a negative `relates_to` edge otherwise. The apprentice retains `FALLING_OUT_TRANSFER_FRACTION` (currently 0.5) of the partial Mastery gain — the learning was real even when the relationship wasn't.

Code anchor: `src/engine/mentorshipOutcomes.ts:89–90, 182–204`.

---

### Quiet Parting

**Aliases:** Quiet Parting Arc
**Also see:** `[[bondQuality]]`, `[[Train Apprentice]]`, `[[The Surpassing]]`, `[[Falling Out]]`, `[[Dissolution]]`
**Status:** canonical

Terminal mentorship arc reached when the Train Apprentice initiative completes (`progress ≥ 1.0`) AND `bondQuality` falls between `FALLING_OUT_BOND_THRESHOLD` and `GRADUATION_BOND_THRESHOLD` — neither a proud graduation nor a dramatic rupture. The default "neither great nor terrible" outcome: a competent professional relationship that simply ran its course. The apprentice graduates with partial Mastery gain.

Code anchor: `src/engine/mentorshipOutcomes.ts:92, 218`.

---

### Dissolution

**Aliases:** Dissolution Arc
**Also see:** `[[bondQuality]]`, `[[Train Apprentice]]`, `[[The Surpassing]]`, `[[Falling Out]]`, `[[Quiet Parting]]`
**Status:** canonical

Terminal mentorship arc reached when the backing `train-apprentice` initiative status is `failed`. Bond dissolved by external cause — death, exile, or separation beyond `MENTORSHIP_MAX_SEPARATION_HEXES` tolerance — rather than a natural completion. Unlike Falling Out, Dissolution carries no hostility; both parties were willing but circumstance intervened.

Code anchor: `src/engine/mentorshipOutcomes.ts:79–80, 241`.

---

### Group

**Aliases:** Group Node, Company (player-facing)
**Also see:** `[[Company]]`, `[[Group Cohesion]]`, `[[Actor]]`, `[[ActorType]]`, `[[Faction]]`
**Status:** canonical

The engine-layer collective of `GROUP_MIN_MEMBERS`–`GROUP_MAX_MEMBERS` (currently 2–10) uniquely-named agents who travel and act together. Stored as an actor node with `actorType: 'group'` carrying a `groupType` property. It reuses existing edges only — no new node or edge types: members attach via `member_of`, the leader via `commanded_by`, a shared goal via `pursues`.

`groupType` selects the decision mode: `party` (consensus vote), `squad` (leader decides), `faction_band` (faction objective directs). A group carries **no `located_at` edge** — its position is derived from its leader via `getGroupPosition`, so members' own `located_at` edges remain the sole spatial authority. Do not add `located_at` to a group node; it would create a second, silently-diverging position authority.

Armies also occupy `actorType: 'group'`, so a group is discriminated by `groupType` being present *and* `armyState` being absent (`isCompanyNode`). Never widen a group query to "all `actorType: 'group'` nodes". Distinct from a `[[Faction]]` — a structured, persistent organization — and from an army, which is faction-scale war machinery with an abstract headcount rather than named members.

Code anchors: `src/engine/groups/groupQueries.ts` (`GroupNodeProperties`, `GroupType`, `isCompanyNode`), `src/data/group-constants.ts`.

---

### Company

**Aliases:** the company, Party (internal `groupType` value only)
**Also see:** `[[Group]]`, `[[Group Cohesion]]`, `[[Bless this Company]]`, `[[Draw Together]]`
**Status:** canonical

The player-facing word for a `[[Group]]`. Prose and UI say **company** — or the group's generated proper name — and never "party" (user default, 2026-07-23). "Party" survives only as the internal `groupType: 'party'` value and must not reach player-visible text.

"Group" is the engine term and "company" the narrative one, the same relationship `[[Actor]]` has to `[[Agent]]`.

Code anchors: `src/data/group-constants.ts` (header note), `src/engine/groups/groupNames.ts` (`generateGroupName`).

---

### Companion

**Aliases:** companion attachment, the `'companion'` `AttachmentCategory`
**Also see:** `[[Company]]`, `[[Retinue]]`, `[[BOND]]`, `[[Group]]`, `[[Agent]]`
**Status:** canonical

A person-shaped attachment: a named individual who travels with **one** mortal and grants small, always-on bonuses. A companion is explicitly **not** an `[[Agent]]` — no actor node, no decisions, no movement, no encounter participation. They are gained and lost only through story, and surface as a `[[BOND]]` consequence when an encounter grants or removes one.

The reference frame is Eldritch Horror's Ally cards: a face and a name that travel with you and quietly change what you can do, never a second character to run. Bonuses reach the roll through the ordinary attachment stat-contribution path, so a companion appears as a factor line like any other modifier.

**Not a `[[Company]]`, despite the shared root — this pair is the one to keep straight.** A Company is 2–10 *simulated* agents travelling together, each deciding for themselves; a Companion is one *unsimulated* person riding on a single mortal's sheet. A mortal in a company may also carry companions, and the two never merge into one another. Player surfaces say **"Companions"** for this and never `[[Retinue]]` — see that entry for the 2026-08-13 arbitration that settled the word.

Design: `Docs/plans/2026-08-12-thr-1096-companion-attachments.md`. Code anchors land with the implementation (THR-1096): `NodeType` `companion`, `EdgeType` `accompanies`, `src/engine/companions.ts`.

---

### Group Cohesion

**Aliases:** Cohesion (group-scoped)
**Also see:** `[[Group]]`, `[[Company]]`, `[[Bless this Company]]`, `[[Freehold]]`
**Status:** canonical

The event-driven 0–1 aggregate on a group node measuring how well a company holds together — its health bar. Starts at `GROUP_COHESION_START_BASE` (currently 0.55, adjusted by formation quality) and moves on events rather than per-tick drift: shared encounter success `+0.06`, failure `−0.08`, a positive member-to-member social `+0.03`, a member's death `−0.15`, each registered dissent `−0.04`.

UI renders a **prose state**, never the number (`getCohesionState`): `bound` at or above `GROUP_COHESION_BOUND_THRESHOLD` (0.75), which also earns the resolution bonus; `holding` at or above `GROUP_FRAY_THRESHOLD` (0.4); `frayed` at or above `GROUP_DISSOLUTION_THRESHOLD` (0.15), where the fray drama pool activates; and `breaking` below that, where dissolution triggers. The DebugPanel is the one surface that shows the raw value.

This is the group-scoped sense only. Army cohesion is a separate quantity on the sibling army system — do not conflate the two.

The `holding` band is a **participle** — the company *is holding*, one notch below `bound`. It is not the count noun "a holding"; that ownership sense is player-facing as `[[Freehold]]`, which see for the full disambiguation (THR-1314).

Code anchors: `src/engine/groups/groupQueries.ts` (`getCohesionState`, `CohesionState`), `src/data/group-constants.ts`.

---

### Draw Together

**Aliases:** company.draw_together, The Gathering Thread
**Also see:** `[[Group]]`, `[[Company]]`, `[[Thread]]`, `[[Bless this Company]]`, `[[Ascendant]]`
**Status:** canonical

The Ascendant action (`company.draw_together`, Heart reach, 4 essence) that spends essence to make scattered threaded mortals converge until a company forms among them. It targets one threaded mortal — the convergence *anchor* — and stamps a convergence pull on the anchor plus every living, ungrouped, threaded mortal within `DRAW_TOGETHER_RADIUS_HEXES` (currently 8).

While the window holds (`DRAW_TOGETHER_DURATION_TICKS`, currently 36), each pulled mortal's own encounter candidates are boosted by up to `DRAW_TOGETHER_PULL_WEIGHT` in inverse proportion to hex distance from the anchor. It is a **tilt on their own choices, never a command**: the mortals bend their roads without quite knowing why, and a company that then forms among them records `cause: 'draw_together'`. Fail-soft on a missing, non-mortal, or unthreaded anchor; it fires without refund even when no eligible mortals are in range. (That clause said "no companions are in range" until THR-1099 seated `[[Companion]]`; it always meant *other threaded mortals to form a company with*, never companion attachments.)

Code anchors: `src/data/unified-action-templates.ts` (`company.draw_together`), `src/engine/graphOpExecutor.ts` (`draw_together` op), `src/engine/encounterScoring.ts` (`computeConvergenceBonus`).

---

### Bless this Company

**Aliases:** company.bless, Blessing of the Bound Road
**Also see:** `[[Group Cohesion]]`, `[[Company]]`, `[[Group]]`, `[[Ascendant]]`
**Status:** canonical

The Ascendant action (`company.bless`, Heart reach, 4 essence) that spends essence to steady a company: an immediate `BLESS_COMPANY_COHESION_DELTA` (currently +0.2) cohesion boost plus a dispute-suppression window of `BLESS_COMPANY_DURATION_TICKS` (currently 24 ticks, two in-game days), stamped as `blessedUntilTick` on the group node.

While the window is open, `isGroupBlessed` suppresses negative dissent, fray-driven dissolution, and movement dissent — the small resentments that pull a band apart lose their teeth. It targets a group actor; because armies share `actorType: 'group'`, the graph-op gates on `isCompanyNode` and fails soft on an army.

Code anchors: `src/data/unified-action-templates.ts` (`company.bless`), `src/engine/graphOpExecutor.ts` (`bless_company` op), `src/data/group-constants.ts`.

---

### Broken

**Aliases:** Broken mortal state, broken agent
**Also see:** `[[Rebuild Road]]`, `[[Dissolution Threshold]]`, `[[Agent]]`
**Status:** canonical

The behavioural state of a mortal whose quintessence has fallen into `BROKEN_ENTER_STATE` (`'critical'`). A Broken mortal is **out of the story**: they decline encounter candidacy except for `[[Rebuild Road]]`s, and they drift homeward toward tended ground.

Not dead and not wounded — worn out of the narrative for a while. The state is **mendable and common by design**; death stays rare and stays owned by the existing zero-state paths. Erosion alone can never reach zero (`QUINTESSENCE_RATIO_FLOOR`).

Release has **hysteresis**: a Broken mortal must climb past `BROKEN_EXIT_STATE` (`'strained'`), which is deliberately above the entry threshold, so an agent cannot flicker in and out tick by tick.

**Read it through `isBrokenMortal()`, never by comparing against the threshold enum literal.** The literal `'broken'` is a different concept — see `[[Dissolution Threshold]]`.

The *consequences* ship behind `BROKEN_GATE_ENABLED = false`. Erosion scaling, the `brokenSince` bookkeeping, and every trace stay live regardless, so telemetry accrues before the gate opens. Code: `src/engine/brokenState.ts`, `src/data/nudge-constants.ts`.

---

### Dissolution Threshold

**Aliases:** the `'broken'` QuintessenceThresholdState literal
**Also see:** `[[Broken]]`
**Status:** canonical

The existing `QuintessenceThresholdState` literal `'broken'` — quintessence ratio zero, the zero-state.

**This is a naming-collision fix, not a new mechanic.** The code literal predates the `[[Broken]]` mortal state and is untouched; the UL says "Dissolution threshold" in prose so the two never get conflated. They are genuinely different: the Dissolution Threshold is a *ratio band* at zero, while `[[Broken]]` is a *behavioural state* entered at `'critical'` and released at `'strained'`. An agent can be Broken without being anywhere near dissolution.

When you read `'broken'` in a `QuintessenceThresholdState` comparison, that is this term. When you read "broken mortal", that is the other one.

---

### Undertaking

**Aliases:** strategic project, the `StrategicProjectRuntime` (engine)
**Also see:** `[[Work]]`, `[[Kind Row]]`, `[[Christening]]`, `[[Failure-Name Register]]`, `[[Freehold]]`
**Status:** canonical

A multi-tick project an agent takes on of its own motion — the proactive counterpart to an `[[Encounter]]`, which the world offers *to* an agent. An undertaking runs to completion or failure across ticks and, on completion, leaves a `[[Work]]` behind.

The word was settled by THR-1281's grammar verdict and used throughout THR-1297's six slices, but was never filed here; this entry closes that gap (THR-1314) rather than proposing anything new. Each undertaking is declared by a `[[Kind Row]]` and its verbs come from the strategic packs — a row declares what a verb *builds* and how the world can take it back, never whether the verb is offerable.

Code anchors: `src/engine/strategicActionLifecycle.ts`, `src/types/strategicAction.ts` (`UndertakingKindId`, `UndertakingKindRow`), `src/data/undertaking-kinds.ts`.

---

### Kind Row

**Aliases:** undertaking kind row, a `UndertakingKindRow`
**Also see:** `[[Undertaking]]`, `[[Work]]`, `[[Freehold]]`
**Status:** canonical

A registry entry declaring one kind of `[[Undertaking]]`: the CRUD closure for one kind of `[[Work]]` — what builds it, what changes it, and, non-negotiably, what can undo it.

**A row must name at least one reachable, motive-gated destroy.** This is the rule the registry exists to enforce, stated in THR-1297 §1 as *"until a kind can be undone, it is not a kind"* — the registry shipped deliberately **empty** in slice 2 rather than register rows against create verbs, and the rows arrived only in slice 5 alongside the destroy verbs that undo them. Registering a row whose destroy does not exist, or exists ungated, is the vacuous satisfaction the plan names as a kill criterion.

Adding a kind is a row, not a code path (NFP #1). A malformed row is a build-time failure via the schema test, never a runtime throw; `validateKindRegistry` returns named problems rather than a boolean.

Code anchors: `src/data/undertaking-kinds.ts` (`UNDERTAKING_KIND_ROWS`, `validateKindRegistry`, `getUndertakingKindRow`), `src/data/strategic-action-constants.ts` (`MOTIVE_GATE_KINDS`).

---

### Work

**Aliases:** the work, a completed undertaking's object
**Also see:** `[[Undertaking]]`, `[[Christening]]`, `[[Kind Row]]`, `[[Freehold]]`, `[[Failure-Name Register]]`
**Status:** canonical

The named object a completed `[[Undertaking]]` leaves behind — the thing that outlives both its maker and its owner. A road, a hall, a mine, a network, a masterwork.

A work is not a new node type: it is an ordinary world node (location, sublocation, resource, artifact) that has been through `[[Christening]]`. What makes it a work is that it carries an earned proper name and, usually, an `owns` edge naming whoever holds it — see `[[Freehold]]`.

Names are a pure function of the named node's id (NFP #3), with phonetic flavour drawn from a *separately salted* stream so that whether a culture signature is available cannot shift the main sequence. The namer never throws, never returns blank, and never lets a raw template or kind id reach a player surface: the ladder is anchored name → flavoured name → possessive → terminal family noun.

**One set of naming primitives, two grammars.** `generateWorkName` generalises the primitives the company namer already had (possessive, seed rule, fallback discipline); the company namer's own pattern set and draw sequence are deliberately untouched, since folding companies onto the work grammar would have re-rolled every company name in every existing world.

Code anchors: `src/engine/naming/workNames.ts` (`generateWorkName`, `workingName`, `possessive`, `WorkNameContext`), `src/engine/naming/__tests__/groupNameStability.test.ts`.

---

### Christening

**Aliases:** the christening, naming-at-completion
**Also see:** `[[Work]]`, `[[Undertaking]]`, `[[Freehold]]`, `[[Failure-Name Register]]`
**Status:** canonical

The moment a `[[Work]]` earns its proper name: **at completion, and only at completion.**

Until then the work carries a **working possessive** — `workingName` renders "Corran's Road", the maker's name plus a family noun — because an undertaking in progress belongs to whoever is doing it, while a finished one belongs to the world and takes a proper name (THR-1291 §2). **Failures are never christened**; what a visible failure leaves is a register entry, not a name — see `[[Failure-Name Register]]`.

Fail-soft (NFP #4): a christening that cannot resolve leaves the created node's minted name untouched and returns `undefined`. **A christening that cannot happen is not an error.** Where the same mutation already granted the work as a `[[Freehold]]`, the bearer-side face is refreshed in the same pass rather than at the next reconcile, so the character sheet and the world never disagree about what a thing is called even for one tick.

Code anchors: `src/engine/strategicActionLifecycle.ts` (`christenCompletedWork`, `nounForCreatedNode`), `src/engine/naming/workNames.ts` (`workingName`).

---

### Failure-Name Register

**Aliases:** failure scar, the register, `failureScars`
**Also see:** `[[Christening]]`, `[[Work]]`, `[[Undertaking]]`
**Status:** canonical

Where a **visible** failed `[[Undertaking]]` is recorded on the ground it failed on, so that failure leaves a story artifact rather than dead air — "Corran's Folly".

**A register, not a name.** The distinction is deliberate (THR-1297 review ruling 2.2): the work earned nothing, but the ground remembers that someone tried here and it went badly. That is a fact about the place, not a name the work earned — which is why it is never a `[[Christening]]`.

**Clean failures write nothing.** The caller gates on the residue class (`undertaking_failed_visible`), not the namer, so an undertaking that fails without visible residue leaves the site untouched.

Additive by construction (NFP #6): entries are a property array on an existing location node, so nothing is minted and no reader that does not know about scars is affected.

Code anchors: `src/engine/strategicActionLifecycle.ts` (`recordFailureScar`), `src/engine/naming/workNames.ts` (`generateFailureScarName`, `FAILURE_SCAR_LEXICON`).

---

### Freehold

**Aliases:** the `'holding'` `AttachmentCategory` (engine literal only)
**Also see:** `[[Work]]`, `[[Undertaking]]`, `[[Group Cohesion]]`, `[[Companion]]`, `[[Attachment]]`
**Status:** canonical

The attachment category for a place or resource an actor owns — a mine, a road, a hall. Seize-transferable and exempt from slot caps, and earned through an `[[Undertaking]]` rather than looted.

**The `owns` edge is the authority; the freehold attachment is a face.** A freehold is three objects that must agree: the world object node (an existing type — the module never mints it), the `owns` edge actor → object, and the bearer-side attachment held via `possesses`, which is pure bookkeeping. Where edge and face disagree the edge wins and the face is re-minted — never the reverse. **Nothing downstream may decide ownership by reading the face.**

Deliberately **not** a `PossessionSubcategory`: a freehold is a different *kind* of thing from an item in a bag, so `categoryWeights` stays freehold-free and `rewardCategoryNodeQuery` answers `null` for it on purpose. It is uncapped by construction — an absent `SLOT_CAPS` row reads as uncapped, so freeholds need no exemption logic anywhere.

**This is a naming-collision fix, not a new mechanic (THR-1314).** The engine literal is `'holding'` and is **untouched**; the UL and every player surface say *freehold*, so the two never get conflated — the same engine-term/narrative-term split `[[Group]]`/`[[Company]]` and `[[Dissolution Threshold]]`/`[[Broken]]` already use. The word "holding" was measured as a **six-way** player-facing collision, not the two-way one the proposal assumed: it renders as the `[[Group Cohesion]]` band, the mandate trend, an army's defensive stance, the ascendant bar's steady state, a Fury tier word, and a `hunger.preserve` remembrance word. Every one of those is a **participle** meaning *steady, enduring*; the ownership sense was the lone count noun, so it is the sense that moved. Renaming the engine literal instead was measured at ~30 identifiers, five strategic verbs and ~500 sites — a destructive sweep (against NFP #6) that would still have left the other five senses colliding.

When you read `'holding'` as an `AttachmentCategory`, that is this term. When you read "the company is holding", that is `[[Group Cohesion]]`.

Code anchors: `src/engine/holdings.ts` (`grantHolding`, `reconcileHoldingFaces`, `refreshHoldingFaceNames`), `src/types/attachments.ts` (`AttachmentCategory`, `ATTACHMENT_CATEGORY_NAMES`), `src/data/attachment-slot-constants.ts` (`SLOT_TAG_DISPLAY_NAMES`).

---

### Calling

**Aliases:** the `calling` / `callingTitleKey` / `callingSinceTick` node properties (engine); "what the world calls them"
**Also see:** `[[Undertaking]]`, `[[Ambition]]`, `[[AxiologicalProfile]]`, `[[Moment]]`, `[[Chronicle Entry]]`
**Status:** canonical (seated by THR-1380 with the THR-1299 implementation)

The player-visible identity title a mortal carries for what they do — *Trader*, *Reaver*, *Mender*, *Spider*. **Derived, never stored as a stat**: a deterministic argmax over the naming table (`src/data/calling-content.ts`) from the mortal's leading reach pair, their active `[[Ambition]]` (its category and the undertaking kinds its templates build — the volatile input, weighted heaviest), and their personality lean. It replaces the retired `BehaviorFamily` as the readable pattern (THR-1281 §7b): the family enum survives as mechanics for the docs 4/6 conversion, but no player surface renders a family word.

A calling **recomputes only on a life-change** — an ambition taken up, completed or abandoned; an undertaking finished; a reach tier crossed — never per tick, and a challenger replaces the incumbent only past both hysteresis gates (`CALLING_MIN_HOLD_TICKS`, `CALLING_SCORE_MARGIN`). A change on a spotlight mortal is a `[[Chronicle Entry]]` (`calling_changed`); every derivation traces `calling_change` with both scores. A mortal the scorer cannot place — no capabilities, no ambition — stays unnamed and renders the fallback title.

**Disambiguation.** The faction verb *Kindle a Calling* (`factionGovernanceVerbs.ts`, THR-433) biases a faction's latent ambition candidates and is unrelated to this term; the agent sense is the primary UL entry, and the verb keeps its authored name as a fixed phrase.

Code anchors: `src/engine/calling.ts` (`deriveCalling`, `recomputeCalling`, `getCallingPresentation`), `src/data/calling-content.ts` (`CALLING_ROWS`, `BEHAVIOR_FAMILY_TO_CALLING`), `src/data/strategic-action-constants.ts` (`CALLING_*`), `window.__DEBUG.getCalling`.

---

### Moment

**Aliases:** undertaking moment, `UndertakingMomentRecord` (engine), moment card / moment badge (surfaces)
**Also see:** `[[Undertaking]]`, `[[Follow]]`, `[[Chronicle Entry]]`, `[[Encounter]]`
**Status:** canonical (seated by THR-1380 with the THR-1299 implementation)

What a long work says to the player — one of six turns of an `[[Undertaking]]`: `started` (its founding), `at_cost` (a step dearly bought), `complication` (serious trouble, naming the lost cast member where the binder lost one), `fork` (doubling down after repeated halts), `abandoned`, and `completion`. Every moment lands as a `TickEvent` **and** as a record in `state.pendingUndertakingMoments`, a capped queue with one writer, and traces `moment_surface` as it is queued, opened, acknowledged or dropped.

A moment has a **presentation** stamped at emission and never recomputed — *interrupt*, *badge* or *none* (THR-1279 ruling 2.1). An interrupt stops the world and opens the moment card; a badge waits on the mortal's thread row as the recovery route and opens the same card; acknowledging never destroys the record, the badge counts it until it ages out. Only a `[[Follow]]`ed mortal's moments interrupt, and only the first at-cost step per work does; foundings always badge.

**Disambiguation.** Not the retired encounter concept *Defining Moment* (a rejected authored-choice scene, see Encounters.md): a moment is reported, never chosen.

Code anchors: `src/engine/undertakingCheckpoints.ts` (`buildMoment`, `resolveMomentPresentation`), `src/engine/undertakingMoments.ts` (the queue's writer), `src/components/Game/MomentCard.tsx`, `src/components/Game/momentBadgeModel.ts`, `src/data/moment-card-content.ts`.

---

### Follow

**Aliases:** followed / following, `followedAgentIds` + `mutedAgentIds` (engine), the follow toggle (surfaces); **mute** is its negative
**Also see:** `[[Thread]]`, `[[Court Position]]`, `[[Retinue]]`, `[[Moment]]`, `[[Ascendant]]`
**Status:** canonical (seated by THR-1380 with the THR-1299 implementation)

The attention the player confers on a mortal, which upgrades that mortal's `[[Moment]]`s from badge to interrupt. One predicate, three terms: a mortal is followed when they are on the explicit list *or* the Ascendant's `[[Thread]]` to them sits at the `the_first` or `retinue` `[[Court Position]]` — and in both cases not muted. A `dormant` or `watched` thread does **not** follow, so `thread.dormant` means what its text says on both channels. **Mute** is the un-follow of a bond-followed mortal: it drops the interrupt upgrade and nothing else — the thread stays, the moments still queue and badge. Follow state is game state, per save, never a preference.

The affordance renders the three-way read honestly — *Following*, *Followed by bond*, *Muted* — on the arc panel and on the encounter that concerns the mortal, and the single writer decides mute-versus-unfollow from the state of the world, never the surface. Copy on the affordance keeps *retinue* in its court sense only (THR-1099 arbitration); it never means travelling companions.

Code anchors: `src/engine/followedAgents.ts` (`isFollowed`, `followAgent`, `unfollowAgent`, `getFollowState`), `src/components/Game/FollowToggle.tsx`, `window.__DEBUG.followAgent` / `unfollowAgent` / `getFollowedAgents`.

---

### Grievance

**Aliases:** vendetta (prose), the `grievance` block on a `pursues` edge (engine)
**Also see:** `[[Grudge]]`, `[[Heat]]`, `[[Undertaking]]`, `[[Broken]]`, `[[AxiologicalProfile]]`
**Status:** canonical

A drive minted from a harm — an ambition that names *who it is against*. Where an ordinary ambition says what an agent wants, a grievance says what they want **and because of whom**.

**Not a node type and not a new ambition.** A grievance is the optional `grievance` block on an ordinary `pursues` edge: `grievance: true`, `culpritAgentId`, `harmMagnitude`, `heat`, `chainDepth`. It is therefore **per-instance, not per-ambition** — two mortals avenging two different harms pursue the same ambition, and only their own edge knows whose harm it was. Milestone conditions read the culprit off the edge they are being evaluated for (`grievance_culprit_eliminated` carries no fields for exactly this reason), which is what makes a vengeance beat authorable without an author naming a target nobody can know at authoring time.

**One slot per agent.** A repeat harm from the same hand *feeds* the standing grievance's heat (`GRIEVANCE_HEAT_FEED`, below 1.0 so a second injury reignites rather than stacks); only a decisively heavier harm takes the slot (`GRIEVANCE_REPLACE_RATIO`, above 1.0 so ties and near-ties never displace and the agent never trades the slot back and forth pursuing neither). Nobody queues vendettas.

**A vendetta may take an ordinary want's slot** (THR-1383). A mortal whose two ambition slots are full is offered only grievance-class drives, and only for a harm at or above `GRIEVANCE_DISPLACE_MIN_MAGNITUDE`; the drive **displaces** the *secondary* want, which closes as `abandoned` with `abandonedReason: 'displaced_by_grievance'`, traced as `ambition_displaced` and told to the chronicle. The primary is never displaced. A harm done to a faction reaches its **leader** through a second `participated_in` target edge tagged `viaFactionId`; the mint window `MINT_LOOKBACK_TICKS` is derived from the two pass cadences so every harm is offered to exactly one pass.

**Who can hold one.** A victim who cannot carry it — dead, or `[[Broken]]` — passes it to kin or closest sworn bond. An **ambient** victim gets a `[[Grudge]]` instead of a drive: an agent who never consults the decision board would otherwise carry a promise the world cannot keep. Chains stay shallow — past `GRIEVANCE_CHAIN_DEPTH_MAX` (2), further victims get grudge edges only, whatever their tier, so one razed village does not end with every agent in the region pursuing somebody. **The god is never a party:** no mortal holds a grievance against the Ascendant.

**Four ways an account closes**, and the asymmetry between them is why the loop terminates rather than compounding. *Satisfaction* (the grievance's own ambition completes, or the culprit dies) and *settlement* (somebody buys the quarrel off) deliberately write **no** grudge edge; *cooling* (see `[[Heat]]`) and replacement both do. A grudge is what remembers an account that was never closed — writing one after a successful revenge would leave the pair *more* hostile than the harm did, and no chain could ever end. *Suppression* is the fourth: a **proportionate** reprisal mints nothing back, and only an answer overshooting `GRIEVANCE_OVERSHOOT_RATIO` re-opens the account, which is what ends most feuds at one round by construction rather than by a cap.

Code anchors: `src/engine/grievance/grievanceLifecycle.ts` (`GrievanceSeed`, `resolveGrievanceDisposition`, `findActiveGrievanceEdge`, `satisfyGrievance`, `settleGrievance`, `demoteGrievanceToGrudge`), `src/engine/ambitionTick.ts` (`MINT_LOOKBACK_TICKS`, the displacement block at the mint gate), `src/engine/grievance/undertakingOutcomeNode.ts` (the leader edge), `src/types/ambition.ts` (the `grievance` block, `abandonedReason`, `grievance_culprit_eliminated`), `src/data/grievance-constants.ts`, `src/data/ambition-minting-rules.ts`.

---

### Grudge

**Aliases:** standing blood, a `hostile_to` edge with provenance
**Also see:** `[[Grievance]]`, `[[Heat]]`, `[[Falling Out]]`, `[[Company]]`, `[[Group]]`
**Status:** canonical

The standing hostility between two actors: a **bidirectional** `hostile_to` edge stamped with the tick it began and a `cause`. Relationship colour, **not a driver** — a grudge never puts anything on the decision board. Bidirectional because a grudge is a state of the relationship rather than of one party: having razed someone's home puts you at odds with them whether or not you feel wronged in return.

**One edge with a provenance field, not two senses.** The word already appeared in canon prose for band contests — *"There is blood between them and …"* — before the reactive loop existed, and the two uses are the same mechanism, not a collision. Band opposition has written this edge since THR-731 with `cause: 'group_engagement'`; a cooled grievance writes the *same* edge with `cause: 'grievance_cooled'`, through the *same* single writer. The mortal sheet renders both through one clause map, so the sentence a player reads is identical in shape and differs only in why. Reconciled, not forked (THR-1379).

**Actors of any kind.** Bands write grudges between `[[Group]]` nodes; grievances write them between individuals. The edge does not care which.

**It never fades, and it makes the next harm worse.** A fresh harm from a culprit who already holds a grudge edge with the victim opens hotter (`GRIEVANCE_REIGNITION_BOOST`) — this is what makes the second betrayal worse than the first. Writing is idempotent and leaves an existing edge exactly as it is: refreshing `since` on every pass would make an old grudge indistinguishable from a fresh one, and the re-ignition rule reads the edge's *existence*, not its age.

**Provenance is a closed set, and its key diverges by writer.** `GrudgeCause` is an enum rather than a free string because motive gates classify it to decide whether a destroy verb is licensed, and a typo in a free-form cause would silently read as "no grudge" — a gate that fails open on a misspelling is worse than one that fails closed on an unknown enum. Three older writers stamp provenance under three *different* keys (band opposition `cause`, excommunication `reason`, mentorship severance `basis`); the grievance writer joined the `cause` camp rather than widening a documented divergence, and readers must still handle all three. A feud declared by a notable writes the edge with no provenance key at all, which the prose reports honestly as *"something neither of them speaks of"* rather than guessing.

Code anchors: `src/engine/grievance/grudgeEdge.ts` (`writeGrudge`, `hasGrudge`, `GrudgeCause`), `src/engine/groups/bandOpposition.ts`, `src/data/grievance-prose.ts` (`GRUDGE_CAUSE_CLAUSES`, `getGrudgeCauseClause`), `src/engine/undertakingMotive.ts` (`GRUDGE_PROVENANCE`).

---

### Heat

**Aliases:** grievance heat
**Also see:** `[[Grievance]]`, `[[Grudge]]`
**Status:** canonical

A `[[Grievance]]`'s decaying urgency. It opens at the founding harm's magnitude scaled by `GRIEVANCE_HEAT_INITIAL_SCALE` and clamped to `GRIEVANCE_HEAT_INITIAL_MAX`, loses `GRIEVANCE_HEAT_DECAY_PER_CHECK` on each 15-tick milestone pass, and at or below `GRIEVANCE_COOL_THRESHOLD` the drive demotes to a `[[Grudge]]` and leaves the board.

**Heat *is* the urgency mechanism — there is no revenge scheduler.** It contributes `GRIEVANCE_URGENCY_WEIGHT` scaled by `heat / GRIEVANCE_HEAT_INITIAL_MAX` to the strategic candidate's weight on the one shared decision board, so a fresh vendetta outranks ordinary ambitions, competes fairly as it cools, and eventually leaves on its own. Urgency is the decay curve rather than a scheduling special case.

**The demotion floor sits above zero deliberately.** A drive decaying to exactly nothing would sit at the bottom of the board forever — technically active, never chosen, the starved-shelf shape. Demoting at a floor means a cold grievance leaves the board outright and keeps existing as relationship colour instead.

**Player-facing as three words, never a numeral:** *burning* (≥ `GRIEVANCE_HEAT_BAND_BURNING`) · *hot* (≥ `GRIEVANCE_HEAT_BAND_HOT`) · *cooling* (below it, down to the demotion threshold — a real window an agent lives in, not a floor label nobody sees). Heat is a real quantity in the engine and the player has no instrument that reads it. The thresholds live in tuning and the words in content, so moving a threshold moves which word is on screen without either file learning the other's job. The band function fails soft over the whole real line rather than the 0–1 band alone: an over-ceiling heat reads `burning`, a negative or non-finite one reads `cooling` — a grievance rendering no word at all would be worse than one rendering the mildest, since the drive is on the board either way.

Code anchors: `src/data/grievance-constants.ts` (the tuning constants plus the two band thresholds), `src/data/grievance-prose.ts` (`getGrievanceHeatWord`, `GrievanceHeatWord`), `src/engine/grievance/grievanceLifecycle.ts` (`decayGrievance`, `grievanceHeat01`, `demoteGrievanceToGrudge`).
