> **title:** `Party Formation & Group Mechanics — THR-74`
> **linear_issue:** THR-74
> **author:** `Claude Code`
> **created:** 2026-07-23
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# Party Formation & Group Mechanics — THR-74

*Agents can band together into named companies that travel, fight, and fall apart together — the missing collective layer between lone agents and faction-scale armies.*

**Grill-me synthesis (all 14 user verdicts):** `Docs/plans/2026-07-23-party-formation-group-mechanics-grill-me.md`
**Source design:** `Docs/plans/2026-03-31-social-systems-expansion-design.md` § Expansion D (party section)

## Why this is load-bearing

Threadbare's social simulation currently has two scales: individual agents (rich decision loops, 1v1 encounters) and factions/armies (abstract collectives with a `size` number). Nothing in between exists — yet the game's core fantasy ("nomadic stories", the tavern → party → dungeon → treasure chain from the original social-expansion design) runs straight through small named groups of *unique* agents. Without this layer: taverns are social hubs that never produce fellowships, ruins are delved only by loners, and the drama engine has no stage for betrayal, sacrifice, or bittersweet farewells between companions. This ticket builds the group layer; THR-731 (conflict), THR-732 (Reunite/Sunder), and THR-733 (drama catalog) all stack on top of it.

## Substrate inventory

*(Design-governance Step 0.6 — grep evidence collected 2026-07-23 in this worktree.)*

**What already exists (this plan extends / reuses):**

- `'group'` is already a member of `ActorType` (`src/types/graph.ts:33`) — **no new node type or actor type is invented** (load-bearing rule respected).
- `member_of` edge exists and is *documented* as "individual is member of group/faction" (`src/types/graph.ts:68`) — group membership is its designed purpose. Precedent for non-individual sources: armies already create `member_of` (army → faction) in `armySpawning.ts:246`.
- **Army system (TB-073, activated THR-614)** is the structural sibling: actor node + `commanded_by` + `member_of` + `located_at` + `pursues` edges, cohesion property, shared movement (`armyMovement.ts`), spawning (`armySpawning.ts`). This plan **mirrors its node/edge pattern but is a separate system** — armies are faction-scale war machinery with an abstract `size`; groups are ≤10 *unique named agents* with individual decision loops. No army file is modified.
- **Movement system** (`movementCandidates.ts` / `movementCost.ts` / `movementExecution.ts`): per-agent scored candidates + tick-accumulating `MovementState`. Group movement composes with it (see Engine pillar); it is not replaced.
- `initiative.recruit-party` (`src/data/initiative-templates.ts:49`) exists but creates only `sworn_ally` **bond edges** — it does *not* create group nodes. It becomes a formation-signal input (bonded agents are strong formation candidates), not a duplicate.
- `retinue.ts` is the ascendant's influence roster — unrelated to travelling groups; untouched.
- Tavern substrate (THR-27, Done): tavern sublocations, social-encounter boost, culture-aware tavern name generation (pattern precedent for the group name generator).

**Green-field claim (grep evidence):** searching `src/engine/` for `\b(party|parties|squad|warband)\b` returns only: "third party"/"the other party" prose fallbacks (`proseEnrichment.ts`, `graphQueries.ts`), army size-tier names (`armyMovement.ts:55`, `armySpawning.ts`), and the bond-only `recruit-party` initiative. `Docs/canon/systems-inventory.md` has **no group/party/companion subsystem** — cohesion appears only under War & Armies. There is no existing small-group travel/action system; this plan **adds** one, reusing the graph substrate above.

**Verdict: extends** the graph substrate (`group` actor type, `member_of`/`commanded_by`/`pursues`/`located_at` edges), **adds** a new engine subsystem (groups), **replaces** nothing.

## Engine pillar

### Systems design

New module family `src/engine/groups/`:

| Module | Responsibility |
|---|---|
| `groupQueries.ts` | Pure helpers: `getGroupOf(graph, agentId)`, `getGroupMembers(graph, groupId)`, `getGroupLeader(graph, groupId)`, `getGroupPosition(graph, groupId)` (= leader's `located_at`, resolved through the three-tier model), `isGroupEligibleAgent()` |
| `groupFormation.ts` | Systemic formation: candidate scan + compatibility scoring + formation roll; spotlight escalation to the Seeking Companions encounter when a threaded agent is involved |
| `groupMovement.ts` | Per-`groupType` decision modes over members' existing movement candidates; dissent detection; drives members' `MovementState` in lockstep |
| `groupCohesion.ts` | Event-driven cohesion mutations (named delta constants only); fray/dissolution threshold checks; Bless suppression window |
| `groupDissolution.ts` | Dissolution triggers, member leave-decisions, node inertification (`groupStatus: 'disbanded'` — node persists) |
| `groupNames.ts` | Seeded proper-name generator (inputs: formation context, culture of formation location, goal, notable member epithets, sphere when Draw Together caused it) |
| `groupResolution.ts` | Best-member-per-step substitution + capped assist bonus, exposed to `resolutionModifiers.ts` / `unifiedActionResolution.ts` |

**Group lifecycle:** formed (systemic roll, Seeking Companions outcome, or Draw Together nudge) → active (moves as one, takes group-eligible encounters, accrues/loses cohesion, members join/leave) → disbanded (node persists inert; `member_of` edges get `leftAtTick` — historical record for prose).

**Split agency (grill Q2):** the group owns *movement* and *group-scale encounter selection*; members keep their personal decision loops for social/minor actions (this is where intra-company romance/rivalry/trust emerges for free). Leaving is an individual agent decision evaluated in the group phase, weighted by cohesion, personality (`loyalty_ambition`, `courage_prudence`), and recent events. A member in a group is excluded from *individual* long-range movement execution only — everything else about them still runs.

### Graph nodes / edges

**No new node types. No new edge types. No new ActorType values.** (Blast-radius minimizing; all reuse verified in Substrate inventory.)

- **Group node:** `type: 'actor'`, `actorType: 'group'`. Property bag (documented interface `GroupNodeProperties` in `src/engine/groups/groupQueries.ts`, following the `encounter_template` documented-properties pattern):
  `groupType: 'party' | 'squad' | 'faction_band'`, `cohesion: number` (0–1), `groupStatus: 'active' | 'disbanded'`, `formedAtTick`, `formationContext` (formation cause + location id — name-generator input), `disbandedAtTick?`, `dissolutionReason?`, `blessedUntilTick?`.
- **Edges (all reused):**
  - `member_of` (agent → group; edge properties: `role?: 'leader' | 'member'`, `joinedAtTick`, `leftAtTick?`). Consumers of `member_of` are audited fail-soft (see Interface impact).
  - `commanded_by` (group → leader agent) — mirrors the army pattern; for `party`-type groups the "leader" is the *position anchor and tie-breaker*, not an autocrat (decision mode stays consensus).
  - `pursues` (group → ambition) — the shared goal; goal completion is a dissolution trigger.
  - **The group node gets NO `located_at` edge.** Position is derived (`getGroupPosition` = leader's position). Members' `located_at` edges remain the sole spatial source of truth (grill Q10); every existing consumer of agent position keeps working unmodified.
- **THR-731 seam:** optional `opposingGroupId?: string` field on `PendingEncounterSeed` (typed, documented, written by nothing in v1). Deferred consumer: THR-731 (cited per interface-stewardship rules). Deliberately a property, not an edge, until a traversal consumer exists; THR-731 owns the `opposes` edge decision.

### Tick phases

One new orchestrator phase, `phaseGroups`, running **after** agent decision/social phases and **before** individual movement execution (so group movement decisions can supersede member movement for this tick). Sub-steps in order:

1. **Dissolution & leave checks** (cheap, early exit for most groups)
2. **Cohesion threshold effects** (fray-state drama-seed injection)
3. **Group movement decision + lockstep execution** (writes all members' `MovementState`/`located_at` through the existing `movementExecution` functions and the `touchWorld()` API)
4. **Formation scan** (hex-bucketed candidate pass — only agents at locations with ≥ `GROUP_FORMATION_MIN_COLOCATED` eligible colocated agents are considered; tavern presence multiplies the roll)

Members of active groups are skipped by the individual movement-execution path (single guard: `getGroupOf(agentId) !== undefined`), which is the only touch on existing phase code.

### Resolution logic

- **Group-eligible templates:** a template is group-eligible **iff its `actorAffinities` includes `'group'`** (existing filtering field — `src/types/unifiedAction.ts:880` — no new aggregate, no new pool; sweeps that walk `UNIFIED_ACTION_TEMPLATES` see them natively). Party-exclusive templates additionally carry new optional field `minGroupMembers?: number`.
- **Protagonist model:** the encounter's mechanical actor remains an *individual* (the leader initiates), carrying `groupId` context — no encounter/awareness system ever meets a positionless actor. Per step, `groupResolution.ts` substitutes the **best member** for the step's required Reach and applies the assist bonus: `assist = min(GROUP_ASSIST_CAP, Σ over other members with tier ≥ GROUP_ASSIST_MIN_TIER of GROUP_ASSIST_PER_MEMBER)`. Step outcomes (injury, glory, condition) land on the *acting member for that step* (grill Q3 rider — accepted default).
- **Movement decision modes** (`groupType` → mode): `squad` → leader's top candidate wins; `party` → per-destination sum of member candidate scores, leader-weighted by `GROUP_LEADER_VOTE_WEIGHT`, top sum wins; `faction_band` → the faction's objective destination is injected as a candidate with `GROUP_FACTION_OBJECTIVE_WEIGHT`, then scored as `party`. **Dissent:** any member whose personal top candidate outscored (for them) the chosen destination by ≥ `GROUP_DISSENT_MARGIN` triggers a cohesion delta and a drama-seed candidate.
- **Formation scoring:** pair/set compatibility = shared-ambition-category bonus + existing relationship edge sentiment (incl. `sworn_ally` bonds from `initiative.recruit-party`) + Maslow-need complementarity, thresholded by `GROUP_FORMATION_COMPAT_MIN`, rolled at `GROUP_FORMATION_BASE_CHANCE` (× `GROUP_FORMATION_TAVERN_MULT` at taverns). Threaded-agent involvement escalates to the Seeking Companions spotlight encounter instead of silent formation.

### PRNG callouts

All rolls use the seeded per-system PRNG streams (no `Math.random()`): formation rolls (`groups.formation` stream), leave-decision rolls (`groups.leave`), name generation (`groups.names` — seeded from group node id so regeneration is stable), drama-seed selection (`groups.drama`). Deterministic given seed + state (NFP #3).

## Content pillar

### Encounter templates

**Authored set shipped in THR-74** (grill Q12.2 — minimal loop-proving set; full drama catalog is THR-733):

| Piece | Form | Notes |
|---|---|---|
| **Seeking Companions** | Branching multi-step (5 steps: Announcement/Heart, Sizing Up/Eye, Negotiation/Gold-Heart-Shadow, Handshake/Heart, optional Rejection) | Prose skeleton exists in the Expansion D doc; outcome creates the group node + edges + generated name; resolution quality sets starting cohesion. Rejection creates a negative `relates_to` edge. |
| **The Parting** (dissolution) | Two-variant authored moment (bittersweet farewell / bitter betrayal), fired for threaded groups only; silent resolution otherwise | Variant chosen by dissolution reason + cohesion at death |
| **The Shared Spoils** (trust test) | Linear template, fray-state drama pool | Dilemma: split loot fairly or pocket the gem; outcome mutates pairwise `relates_to` + cohesion |
| **Old Wounds** (rivalry) | Linear template, fray-state drama pool | Two members with negative sentiment; escalation or reconciliation |

**Party-exclusive family** (the signature, 3 templates): "The Delve" style multi-step group encounters with `actorAffinities: ['group']` + `minGroupMembers: 2` — multi-protagonist steps designed so different Reaches shine per step.

**Group-eligible flagging of existing content — predicate, not a list:** every existing template in the ruins/delve, borderland-threat, and monster-combat families whose steps are physical-challenge shaped (no intimate/1v1-social steps) gains `'group'` in `actorAffinities`. The executor applies the predicate and records the resulting count in the closeout comment (count is evidence, predicate is the spec).

### Prose tables

- Group name generator tables in `src/data/group-name-content.ts`: pattern grammars ("The {adjective} {noun}s", "Company of the {landmark}", "{leader-epithet}'s {band-word}", culture-flavored word pools), keyed by formation context. Follows the tavern-name-generation precedent (THR-27).
- Chronicle/prose fragments for formation, dissent, fray, member join/leave, dissolution — wired through `enrichProse()` with existing placeholders (`{name}`, `{target}`, cast slots per THR-696 — declared keys must always resolve).
- Cohesion **prose-state ladder** (UI reads states, never numbers): `bound` / `holding` / `frayed` / `breaking` — thresholds in the constants table.

### Attachment content

N/A — no new attachment templates; companionship history lives in graph edges (`member_of` with `leftAtTick`) and chronicle entries, which prose already reads.

### Data tables

- `src/data/group-constants.ts` — all constants below.
- Two new UAT entries in `src/data/unified-action-templates.ts`: **Bless this Company** (target: group; essence cost; cohesion boost + dispute suppression window) and **Draw Together** (target: 2+ threaded agents; sphere-flavored convergence pressure on their movement candidates for N ticks). **Grant path (mandatory, THR-613/THR-659):** both granted via ascendant Milestone beats (executor wires the beat-grant entries; `window.__DEBUG.listUnreachableActions()` must NOT list them post-implementation). Both drafted under the `action-catalog-design` skill gate.

## UI pillar

*Screenshot tools: **Claude-in-Chrome** for the HexMapV2 cluster (WebGL — Playwright cannot see canvas); **Playwright** for the profile-modal Company section (DOM). Both at 1920×1080.*

### Player-facing display

- **AgentProfileModal** (the live sheet — `AgentDetailPanel.tsx` is orphaned dead code, do not touch it): new "Company" section on grouped agents — generated group name, member list (click-through), member's role, cohesion as prose state woven into a sentence (never `Cohesion: 0.62`). Disbanded former companies appear in the agent's history/chronicle view, not the live section.
- Group-scale encounters read like existing encounters, with per-step protagonists named from the company.

### Event notifications

Chronicle entries: company formed (with generated name + founding context), member joined/left, fray moment fired, company disbanded (variant-specific prose). Threaded-company formation and dissolution also surface as event-feed narrative events; no new notification channel.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getGroups()` → `[{ id, name, groupType, groupStatus, cohesion, leader, members: [{id, name, role}], position, blessedUntilTick, ticksActive }]` — ground-truth graph read, mirroring `getArmies()` (THR-614 seam 3 pattern).
- DebugPanel "Companies" tab rendering the same readout; cohesion shown numerically here (debug is the numbers home).
- Headless CLI: `groups` command in `scripts/cli` listing the same projection (engine smoke evidence for Done-when).

### Visual presence (HexMapV2)

Cluster rendering per the user-approved sketch (grill Q13 follow-up): **enclosing ring + member agent dots + central bond glyph.**

- Center glyph style: gold/thread treatment when ≥1 member is threaded ("yours"); neutral variant otherwise (future NPC bands, THR-731).
- Zoom-adaptive: close zoom = ring + individual dots + glyph; far zoom = ringed glyph only. **No member counts at any zoom** (user verdict) — details via click → AgentProfileModal.
- Fog: normal rules; group renders when its hex is visible. No special reveal.
- Implementation: extension of the existing agent-dot layer (`hexmap-layers` skill Step 0 for the executor) — no new layer type; THREE color writes carry `THREE.SRGBColorSpace` per the settled color rule.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — executor updates it (new phase + new debug surface + new modal section).

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `groupFormation.ts` | `phaseGroups` (sub-step 4) | Chronicle entry | — (graph only) | `group_formed` | `getGroups()` / Companies tab |
| `groupMovement.ts` | `phaseGroups` (sub-step 3) | HexMapV2 cluster | — (members' `MovementState`) | `group_phase` aggregate | Companies tab (destination) |
| `groupCohesion.ts` | `phaseGroups` (sub-step 2) | Company section prose state | — (graph property) | `group_phase` aggregate | Companies tab (numeric) |
| `groupDissolution.ts` | `phaseGroups` (sub-step 1) | The Parting encounter / chronicle | — | `group_dissolved` | `getGroups()` (`disbanded`) |
| `groupResolution.ts` | via `unifiedActionResolution` | encounter step prose | — | existing resolution traces + `groupId` field | Prose QA sweep unaffected |
| `groupNames.ts` | (called at formation) | everywhere the name renders | — | — | `getGroups().name` |
| Bless/Draw Together UATs | UAT resolution path | ActionDrawer cards | essence pools (existing) | existing action traces | `listActions()` |

**GameState:** deliberately **zero new GameState fields** — groups live entirely in the graph (nodes + edges + properties), read via `worldVersion`. This keeps `gameState.ts` (345 importers) untouched.

**Prose pipeline:** formation/dissolution/chronicle prose goes through `enrichProse()`; group name is a graph-node `name` so every existing resolver renders it free.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `GROUP_MAX_MEMBERS` | `10` | Hard cap on members per group (user: "aim below 10") |
| `GROUP_MIN_MEMBERS` | `2` | Below this an active group auto-dissolves |
| `GROUP_FORMATION_BASE_CHANCE` | `0.04` | Per-tick formation roll for an eligible colocated set |
| `GROUP_FORMATION_TAVERN_MULT` | `2.0` | Formation roll multiplier when the set is at a tavern |
| `GROUP_FORMATION_COMPAT_MIN` | `0.35` | Minimum pairwise compatibility score to enter a forming set |
| `GROUP_FORMATION_MIN_COLOCATED` | `3` | Minimum eligible colocated agents before the scan considers a location |
| `GROUP_LEADER_VOTE_WEIGHT` | `1.5` | Leader's weight in party-mode movement aggregation |
| `GROUP_FACTION_OBJECTIVE_WEIGHT` | `2.5` | Injected score weight of the faction objective for faction_band groups |
| `GROUP_DISSENT_MARGIN` | `0.25` | Personal-vs-chosen candidate score gap that registers dissent |
| `GROUP_DISSENT_COHESION_HIT` | `-0.04` | Cohesion delta per registered dissent |
| `GROUP_COHESION_START_BASE` | `0.55` | Starting cohesion before formation-quality adjustment |
| `GROUP_COHESION_SUCCESS_DELTA` | `+0.06` | Group encounter success (clean/crit) |
| `GROUP_COHESION_FAILURE_DELTA` | `-0.08` | Group encounter failure/crit-failure |
| `GROUP_COHESION_SOCIAL_DELTA` | `+0.03` | Positive member-to-member social encounter |
| `GROUP_COHESION_DEATH_DELTA` | `-0.15` | Member death |
| `GROUP_FRAY_THRESHOLD` | `0.4` | Below: fray-state drama pool activates (prose state `frayed`) |
| `GROUP_DISSOLUTION_THRESHOLD` | `0.15` | Below: dissolution triggers (prose state `breaking` above it) |
| `GROUP_COHESION_BOUND_THRESHOLD` | `0.75` | At/above: prose state `bound`; small resolution bonus applies |
| `GROUP_BOUND_RESOLUTION_BONUS` | `+0.03` | Extra additive bonus on group steps at `bound` cohesion |
| `GROUP_ASSIST_PER_MEMBER` | `0.05` | Assist bonus per qualifying non-acting member |
| `GROUP_ASSIST_CAP` | `0.15` | Assist bonus cap per step |
| `GROUP_ASSIST_MIN_TIER` | `2` | Member tier in the step's Reach required to qualify as assist |
| `BLESS_COMPANY_COHESION_DELTA` | `+0.2` | Bless this Company immediate cohesion boost |
| `BLESS_COMPANY_DURATION_TICKS` | `24` | Dispute-suppression window (2 in-game days) |
| `DRAW_TOGETHER_DURATION_TICKS` | `36` | Convergence-pressure window on chosen agents' movement candidates |
| `DRAW_TOGETHER_PULL_WEIGHT` | `2.0` | Injected candidate-score weight toward the convergence point |

*(Essence costs for the two UATs are set by the executor consistent with the divine-economy scale under the `action-catalog-design` gate.)*

## Tracing

Per the one-aggregate-per-tick rule (all-agents phases must never emit per-agent traces):

```ts
// GroupPhaseTrace — ONE per tick from phaseGroups, aggregate
interface GroupPhaseTrace {
  type: 'group_phase';
  tick: number;
  activeGroups: number;
  movesExecuted: number;        // groups that moved this tick
  dissents: number;             // dissent registrations this tick
  cohesionDeltasApplied: number;
  leaveDecisions: number;
  formationCandidateSets: number; // sets scanned in sub-step 4
}

// GroupFormedTrace — one per formation event (rare, event-scale)
interface GroupFormedTrace {
  type: 'group_formed';
  tick: number;
  groupId: string;
  groupType: 'party' | 'squad' | 'faction_band';
  name: string;
  memberIds: string[];
  cause: 'systemic' | 'seeking_companions' | 'draw_together';
  startingCohesion: number;
}

// GroupDissolvedTrace — one per dissolution event (rare, event-scale)
interface GroupDissolvedTrace {
  type: 'group_dissolved';
  tick: number;
  groupId: string;
  reason: 'cohesion_floor' | 'goal_complete' | 'leader_death' | 'betrayal' | 'undersize';
  finalCohesion: number;
  ticksActive: number;
}
```

Executor note: adding these to the trace union will hit the `emitTrace` Omit-collapse quirk — verify with `tsc -b`, not editor squiggles.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Leader dies / leader node missing | Promote highest-cohesion-contributing member to leader (`commanded_by` repointed); if none, dissolve gracefully with reason `leader_death` |
| Member `located_at` desynced from group (edge missing or elsewhere) | Re-snap member on next group move; never throw. Desync is narratable ("she lagged behind") |
| Group drops below `GROUP_MIN_MEMBERS` | Auto-dissolve with reason `undersize`; chronicle entry; no encounter fired |
| `cohesion` missing/NaN on a group node | Treat as `GROUP_COHESION_START_BASE`; log one warn |
| Group-eligible template fires for a disbanded/missing group | Resolve as individual (leader-only, no assist); log one warn |
| Name generation fails (empty pools) | Fallback `"{leaderName}'s Company"` |
| Draw Together targets that are already grouped / dead | Skip invalid targets silently; act on the valid remainder; refund nothing (action fired) |
| `phaseGroups` sub-step throws | Catch per sub-step; skip that sub-step this tick; tick loop never crashes |

## Interface impact

*(Step 0.7 — Movement & Colocation and Encounters (core) are ⚪ UNAUDITED: audit-on-touch applies, so this table IS their first contract rows for the touched contracts. Executor registers each row in `scripts/interface-contracts.ts` in the same change.)*

| Contract | Action | Producer → Consumer | Notes |
|---|---|---|---|
| `member_of` edges (agent → collective) | **extend** | `groupFormation.ts` (new writer) → 30 existing engine consumers | Consumers verified pattern: read faction-specific properties off the target and skip when absent (e.g. `tierPromotion.ts:131-140` `if (!reachPreferences) continue`). Executor action item: sweep the 30 `member_of`-consuming files; add `actorType === 'faction'` guards to any that would misread a group target. Grep key: `member_of` |
| Agent `located_at` writes | **extend** | `groupMovement.ts` (new writer via existing `movementExecution` functions + `touchWorld()`) → all position readers | New writer, existing contract shape — no reader changes. Grep key: `located_at`, `tickMovement` |
| Movement candidate generation | **preserve** | `movementCandidates.ts` → `groupMovement.ts` (new consumer) | Group modes aggregate existing per-member candidates; generator unchanged. Grep key: `generateMovementCandidates` |
| UAT eligibility filtering (`actorAffinities`) | **extend** | template data (new `'group'` values) → existing eligibility filter | Existing field, new value usage; sweeps over `UNIFIED_ACTION_TEMPLATES` see group templates natively (THR-573 lesson: no new invisible aggregate). Grep key: `actorAffinities` |
| Resolution modifiers | **extend** | `groupResolution.ts` (new producer) → `unifiedActionResolution.ts` | Additive assist/best-member modifier when action context carries `groupId`. Grep key: `resolutionModifiers` |
| `PendingEncounterSeed.opposingGroupId` | **add (seam)** | nothing in v1 → **THR-731** (Deferral cited) | Typed optional field, written by nothing until THR-731; documented at the type |
| Cohesion prose states | **add** | `groupCohesion.ts` → AgentProfileModal Company section + chronicle prose | New producer with named production read site (this ticket's UI pillar) |
| Beat grants → UAT availability | **extend** | ascendant beat grant entries (new rows) → action drawer/grant system | Bless this Company + Draw Together; verified via `listUnreachableActions()` |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 278 importers | Additive optional fields only (`minGroupMembers?`, `groupId?` on action context, `opposingGroupId?` on seed) — no existing field changes; compile-safe by construction, verify with `tsc -b` net-new diff |
| `src/engine/traceBuffer.ts` (trace union home) | 232 importers | Three new trace union members — additive; Omit-collapse quirk means only `tsc -b` proves it |

`src/engine/graph.ts` / `src/types/graph.ts` / `src/types/gameState.ts` are **not modified** (no new node types, edge types, or GameState fields) — the largest importers stay untouched by design.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it deepens "nomadic stories" and the mortal social loop; the player remains a probability-shifting god (Bless/Draw Together tilt odds, never command), consistent with the soft-power action rules.
- [x] No Vision edit required.

## Rulebook impact

- [x] This plan **does** change rules of play: adds group-scale encounter resolution (best-member + assist on the sigmoid → d100 ladder), two ascendant action verbs, and the company formation/dissolution loop. **`Docs/canon/rulebook.md` update is in the executor's scope for this ticket** (new subsection under encounters/resolution, `[IMPL]`-flagged once shipped), per the rulebook-impact rule.

> Brainstorm companion: `Docs/plans/2026-07-23-party-formation-group-mechanics-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | 26 named constants in one file; no magic numbers in logic |
| 2. Inspectability | PASS | 3 trace types (1 aggregate + 2 event-scale), `getGroups()` bridge, Companies tab, CLI `groups` |
| 3. Determinism | PASS | Named PRNG streams for formation/leave/names/drama; name gen seeded by node id |
| 4. Fail-soft | PASS | 8-row fail-soft table; per-sub-step catch in `phaseGroups` |
| 5. Narrative over mechanical perfection | PASS | Dissent/desync/failure all narrate; dissolution persists as story; prose states over numbers |
| 6. Additive over destructive | PASS | Zero modified node/edge/GameState schemas; one guard added to individual movement; army system untouched |
| 7. Performance budget | PASS with note | Formation scan is hex-bucketed and threshold-gated; group movement replaces (not adds to) member movement work; verify with 30-tick CLI smoke on medium map |

## Done when

- [ ] 30-tick CLI smoke (`--seed 42 --map medium`) shows ≥1 `group_formed` trace and `groups` CLI command lists an active group with generated name, members, cohesion (predicate: formation fires systemically, no spawn command needed; if base-chance tuning makes 30 ticks flaky, evidence may use `run 60`)
- [ ] A group moves as one: CLI `agents` shows all members sharing position across ≥2 moves; dissent trace observed or explicitly noted absent
- [ ] Group-eligible encounter resolves with best-member substitution + assist visible in resolution trace (`groupId` present)
- [ ] Dissolution observed (natural or via cohesion eval) → node persists with `groupStatus: 'disbanded'`
- [ ] Bless this Company + Draw Together castable in-browser via beat grant; `window.__DEBUG.listUnreachableActions()` does not list them
- [ ] HexMapV2 cluster (ring + dots + bond glyph, gold when threaded) screenshot at 1920×1080 via Claude-in-Chrome; Company section screenshot via Playwright; console output pasted (browser sims advanced only via `window.__DEBUG.tick(n)`)
- [ ] `member_of` consumer sweep completed; guards added where needed; sweep result (files touched/cleared) in closeout comment
- [ ] `Docs/canon/rulebook.md` + wiring checklist + interface contracts (`scripts/interface-contracts.ts`) updated in-PR
- [ ] `npm test` and `npx vite build` pass; types via `npm run check:typecheck` (ratchet); `npm run check:generated-freshness` clean
- [ ] Closing commit body + PR body include `Fixes THR-74`

## Coordination block

**Suggested model:** `opus` — multi-system engine work with a new orchestrator phase and cross-cutting resolution changes.

**Parallel-safe with:** content-only and wiki/docs tickets; THR-733/THR-731/THR-732 are blocked on this, not parallel.

**Mutex with:** any ticket editing `src/engine/orchestrator.ts` / `phases/index.ts` (phase insertion), `src/types/unifiedAction.ts` (optional-field additions), or `src/data/unified-action-templates.ts` (new UATs + affinity flags) — same-file collisions.

**Files to touch:**
- Create: `src/engine/groups/*` (7 modules + tests), `src/data/group-constants.ts`, `src/data/group-name-content.ts`, group encounter template files, DebugPanel Companies tab component
- Edit: orchestrator/phases index (insert `phaseGroups`), `movementExecution` call site guard (grouped members), `unifiedActionResolution.ts` + `resolutionModifiers.ts` (group hook), `src/types/unifiedAction.ts` (optional fields), `src/data/unified-action-templates.ts` (2 UATs + affinity predicate application), beat-grant data, `src/debug-bridge.ts` (+ `.d.ts`), HexMapV2 agent layer (cluster), AgentProfileModal (Company section), CLI (`groups` command), `Docs/canon/rulebook.md`, `Docs/plans/wiring-checklist.md`, `scripts/interface-contracts.ts`

## Notes for the executor

- **Do not modify army files** (`armyMovement.ts`, `armySpawning.ts`, etc.) — groups are a sibling system, not a refactor of armies. Resist any "extract shared group layer" temptation; that was explicitly rejected in the grill (Q1).
- **Do not add `located_at` to group nodes** — position is derived from the leader. This is the single most load-bearing decision in the plan (Q10).
- `AgentDetailPanel.tsx` is orphaned dead code; the live agent sheet is `AgentProfileModal`.
- Phase implementation may live in `phases/index.ts` (grep both it and `orchestrator.ts` when inserting the phase).
- The 4 authored encounter pieces go through `Docs/canon/encounters.md` (Step 0) + the encounter/template skills; keep the Expansion D prose skeleton for Seeking Companions as the draft seed.
- "Party" never appears in player-facing prose or UI — the word is **company** (or the generated proper name). THR-734 tracks the UL entries.
- If implementation reveals the scope is too large for one PR, split PRs but keep one ticket: land engine core first, then content, then UI — each PR gate-green, `Fixes THR-74` only on the final one.

## Intent-judge verdict

**Allow** (2026-07-23, cold-boot Opus judge). All 11 dimensions PASS, 0 GAPs, 0 VIOLATIONs; impact class confirmed Reversible. Substrate claims source-verified (`graph.ts:33/:68`, `armySpawning.ts:245-250`, `tierPromotion.ts:131-140`). One non-blocking note for the executor: "30 `member_of` consumers" is a low estimate (~118 files reference the string incl. tests/comments); the Done-when correctly gates on the sweep *predicate*, so let the sweep define the real read-site count. Proposal: `Docs/plans/.intent-proposals/2026-07-23-party-formation-group-mechanics.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-07-23*

### NFP audit

*(design-brief.md has no § NFPs section and `last_validated_against: 2026-06-11` is 42 days stale — used CLAUDE.md § Non-Functional Priorities instead.)*

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 26 named constants in `group-constants.ts`; no magic numbers found in resolution/formation logic descriptions |
| 2. Inspectability | PASS | `group_phase`/`group_formed`/`group_dissolved` trace interfaces defined; `__DEBUG.getGroups()`; DebugPanel Companies tab; CLI `groups` command — matches wiring-checklist.md conventions for comparable systems (essence sources, resource economy) |
| 3. Determinism | PASS | Named seeded PRNG streams (`groups.formation`/`.leave`/`.names`/`.drama`); name-gen explicitly seeded from group node id for stable regeneration |
| 4. Fail-soft | PASS | 8-row fail-soft table covering leader death, desync, undersize, NaN cohesion, missing group, empty name pools, invalid targets, sub-step throw isolation |
| 5. Narrative over mechanical | PASS | Cohesion exposed only as prose-state ladder (`bound`/`holding`/`frayed`/`breaking`) to UI; "party" banned from player-facing text; dissent/desync/dissolution all narrated |
| 6. Additive over destructive | PASS | Zero new node/edge types, zero GameState fields (groups live entirely in graph); army/movement systems explicitly untouched; single guard added to individual movement execution |
| 7. Performance budget | PASS-with-note | Formation scan hex-bucketed + threshold-gated (`GROUP_FORMATION_MIN_COLOCATED`); group movement stated to *replace* not *add to* per-member work, but this claim is asserted, not measured — plan's own Done-when defers verification to a 30-tick CLI smoke, not yet run |

NFP AUDIT: PASS-with-notes (see rows above) [design-brief-stale]

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Full systems design, graph nodes/edges (explicitly zero new node/edge types — reuse), tick phase (`phaseGroups` sub-steps ordered), resolution logic (best-member+assist formula), PRNG streams named per roll type |
| Content | present-and-substantive | 4 authored templates + party-exclusive family + predicate-based affinity flagging, prose tables (name generator, cohesion ladder), data tables (constants + 2 UATs w/ grant path); Attachment content correctly marked N/A with one-line reason |
| UI | present-and-substantive | Player-facing display (AgentProfileModal Company section), event notifications (chronicle + event-feed), debug inspection (`getGroups()`, Companies tab, CLI), visual presence (HexMapV2 cluster spec with zoom tiers, fog rules, screenshot tooling named) |

No missing required sections.

Wiring check: Yes — the Wiring table maps each of the 7 modules to orchestrator phase (`phaseGroups` sub-step), UI component, GameState field (explicitly none — graph-only, justified), trace emitted, and debug visibility; text below the table states the zero-new-GameState-field rationale and the prose-pipeline hookup.

Substrate-existence check (Engine-pillar plan, THR-658): Present and compliant. The plan opens with `## Substrate inventory` before the Engine pillar, names the premise nouns with grep evidence, acknowledges the one collision risk ("cohesion" exists only under War & Armies) and reconciles it as a sibling property, and states a clear extends/adds/replaces-nothing verdict. Cross-checked against `Docs/canon/systems-inventory.md`: no group/party/companion subsystem row exists. No unacknowledged green-field duplication found.

PILLAR AUDIT: PASS

### Vision audit

Vision premises touched — `00-north-star.md` → not referenced (no citation, mechanically satisfied: companies are a stage for the drama the north-star moment depends on) — [silent]. `01-core-loop.md` → not referenced (portfolio scan → encounter → aftermath preserved; groups add a layer inside the loop, not a bypass) — [silent]. `02-non-negotiables.md` → "player as probability-shifting god, never commander" invoked — [confirmed: Bless/Draw Together tilt odds/pull movement candidates, never issue orders]. `03-design-tensions.md` → not referenced — [silent]. `taste-profile.md` → not referenced — [silent].

Vision contradictions — No contradictions found.

Five qualitative checks:
- North star: Yes — companies create the "tavern → party → dungeon" fellowship stage the plan itself names as currently missing, directly serving nomadic-story generation.
- Core loop: Yes — `phaseGroups` sits inside the existing tick pipeline; group encounters resolve through existing `unifiedActionResolution`.
- Non-negotiables: Yes — Bless this Company and Draw Together are essence-cost, odds-tilting nudges, not direct command; leader role is explicitly "anchor and tie-breaker", decision mode stays consensus for party-type groups.
- Design tensions: Nothing reads as over-leaning on a stated tension; mechanical richness (26 constants) counterbalanced by the content pillar (4 authored pieces + prose ladder).
- Taste profile: Prose-state cohesion ("never `Cohesion: 0.62`" in player UI) and banning "party" for "company"/generated names is consistent with the house aversion to raw key:value display.

VISION AUDIT: PASS
