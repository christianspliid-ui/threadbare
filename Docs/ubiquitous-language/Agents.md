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

**Aliases:** The Ascendant, Player Character, God-Self
**Also see:** `[[The First]]`, `[[Thread]]`, `[[Actor]]`
**Status:** canonical

The player-character: a powerful former mortal who has transcended to divine status. Stored as an actor node with `actorType: 'ascendant'`. Uses the same Domain Capability prerequisite system as mortal agents — no special-cased entity logic. Power level is tunable via constants, not architecturally different.

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

### Faction

**Aliases:** Organization, Group (formal)
**Also see:** `[[Actor]]`, `[[ActorType]]`, `[[Member Of]]`
**Status:** canonical

A structured social entity modeled as an actor node with `actorType: 'faction'`. Agents join factions via `member_of` edges. Factions have agency, goals, and can be created or dissolved dynamically during simulation. Faction behavior is simulation-driven, not hand-scripted.

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

### Group Cohesion

**Aliases:** Cohesion (group-scoped)
**Also see:** `[[Group]]`, `[[Company]]`, `[[Bless this Company]]`
**Status:** canonical

The event-driven 0–1 aggregate on a group node measuring how well a company holds together — its health bar. Starts at `GROUP_COHESION_START_BASE` (currently 0.55, adjusted by formation quality) and moves on events rather than per-tick drift: shared encounter success `+0.06`, failure `−0.08`, a positive member-to-member social `+0.03`, a member's death `−0.15`, each registered dissent `−0.04`.

UI renders a **prose state**, never the number (`getCohesionState`): `bound` at or above `GROUP_COHESION_BOUND_THRESHOLD` (0.75), which also earns the resolution bonus; `holding` at or above `GROUP_FRAY_THRESHOLD` (0.4); `frayed` at or above `GROUP_DISSOLUTION_THRESHOLD` (0.15), where the fray drama pool activates; and `breaking` below that, where dissolution triggers. The DebugPanel is the one surface that shows the raw value.

This is the group-scoped sense only. Army cohesion is a separate quantity on the sibling army system — do not conflate the two.

Code anchors: `src/engine/groups/groupQueries.ts` (`getCohesionState`, `CohesionState`), `src/data/group-constants.ts`.

---

### Draw Together

**Aliases:** company.draw_together, The Gathering Thread
**Also see:** `[[Group]]`, `[[Company]]`, `[[Thread]]`, `[[Bless this Company]]`, `[[Ascendant]]`
**Status:** canonical

The Ascendant action (`company.draw_together`, Heart reach, 4 essence) that spends essence to make scattered threaded mortals converge until a company forms among them. It targets one threaded mortal — the convergence *anchor* — and stamps a convergence pull on the anchor plus every living, ungrouped, threaded mortal within `DRAW_TOGETHER_RADIUS_HEXES` (currently 8).

While the window holds (`DRAW_TOGETHER_DURATION_TICKS`, currently 36), each pulled mortal's own encounter candidates are boosted by up to `DRAW_TOGETHER_PULL_WEIGHT` in inverse proportion to hex distance from the anchor. It is a **tilt on their own choices, never a command**: the mortals bend their roads without quite knowing why, and a company that then forms among them records `cause: 'draw_together'`. Fail-soft on a missing, non-mortal, or unthreaded anchor; it fires without refund even when no companions are in range.

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
