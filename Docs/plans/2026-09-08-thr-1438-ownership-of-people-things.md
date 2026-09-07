> **title:** `The ownership of people-things — claim and seize a company, an army, a faction; watch an army — THR-1438`
> **linear_issue:** THR-1438
> **author:** `Claude Code`
> **created:** 2026-09-08
> **three_pillars:** Engine `done` · Content `done — seven grid notes, seven lexicon lines; no encounter prose` · UI `done — seven codex cards derive from the registry, the roster's doing-line derives; the war readout gains the scout's mark; browser-verified on the codex and a roster`

# The ownership of people-things — THR-1438

*Seven cells the grid decided on 2026-09-03 and nobody has built: taking command of a company or an army nobody leads, mutinying against a commander, mounting a coup, filing a candidacy for an unseated faction, usurping a sitting leader, and scouting an army. Every one is a verb on a group the world already has, and every one hands its consequence to a phase the world already runs.*

## Why this is load-bearing

The wayfinder map [THR-1396](https://linear.app/threadbare/issue/THR-1396) set the band order on [THR-1399](https://linear.app/threadbare/issue/THR-1399): readers → dormant kinds → **people-things** → yield, by systems opened for the first time. The readers band (THR-1428) and the dormant kinds (THR-1429, THR-1430) are shipped; the flip (THR-1403) walks cells; the seeded world (THR-1437) holds five armies and forty-nine factions at tick 0. What no cell can do today is change **who commands a group of people**: a company whose commander dies is repointed by `promoteNewLeader` in the dissolution sweep — a leak dressed as succession; an army's commander is set once at spawn; a faction's leader is derived from `member_of.rank` or seated by an anointment the god buys. The Warlord and the Captain — iron callings — derive `control × Army` and `control × Company` under the division rule (iron → army, company; dominion → claim, seize) and refuse `no_object_exists` or `no_owned_object` on every seed because the cells are not there.

The decisions are Christian's, recorded on [THR-1397](https://linear.app/threadbare/issue/THR-1397) and on the grid, one line each: **claim × Company / Army** — `take_command`, gated on no living commander, an army claimant belongs to the army's faction; **seize × Company** — a mutiny, motive-gated against the commander, preconditioned on low cohesion; **seize × Army** — a coup, the usurping fork one rank down, resolved by the faction, never by the blade; **claim × Faction** — a candidacy, not a coronation, `nominate_successor`, the succession phase stays the one arbiter; **seize × Faction** — usurping, `force_succession`, three outcomes from what exists (`leads` moves; the usurper loses and takes a quarrel; the faction splits through the live schism op), the deposed leader is never killed; **observe × Army** — scouting, `seedKnowsOf`, the war readout already computes the strength. This plan turns those lines into operations.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Companies & Group Travel — `commanded_by` (`groupFormation.ts:440`), `promoteNewLeader` (`groupDissolution.ts:218`), `getGroupLeader`, `getGroupCohesion` / `getCohesionState` (`groupQueries.ts:335–350`) | 🟠 DORMANT (the inventory's badge — no company exists at seeding; they form in play, 2 on seed 42 by tick 30) | **extends** — one shared `setCommander` that the dissolution sweep and the two command cells both call; the cohesion ladder gates the mutiny |
| War, Armies & Battles — `spawnArmy`, `selectCommander` (`armySpawning.ts:87,185`), `commanded_by` on armies (`:245, :408`), the war readout | 🟢 ACTIVE | **extends** — claim and coup on an army through the same `setCommander`; the readout shows who scouted an army |
| Factions & Succession — `phaseFactionSuccession` (`will_succeed` → `leads`, `:244–268`), `anointSuccessor.ts:86`, `getFactionLeaderId` / `getAnointedLeaderId` | 🟢 ACTIVE | **connects** — a candidacy writes the edge the phase already reads; a usurpation runs the seating the phase already does, early, with the usurper as the winner |
| Factions & Succession — `applyPlantSchism` (`schismPlant.ts:27`) | 🟢 ACTIVE | **connects** — the third outcome of a failed usurpation |
| Reputation & Influence (the `grievance` domain) — `writeGrudge`, `GrudgeCause`, `GRUDGE_PROVENANCE` | 🟢 ACTIVE | **extends** — two causes: a seized command and a failed usurpation are injuries, provenance `grudge` |
| Intelligence, Knowledge & Familiarity — `recordIntelligence`, `seedKnowsOf` (`strategicGraphOps.ts:439, 542`), the shared `observe` semantic (`undertaking-objects.ts:497`) | 🟠 DORMANT (the inventory's badge; the observe readers THR-1428 built are its writers) | **connects** — `observe × Army` through the same semantic and readers |
| Ambitions & Undertakings — the registry, `OWNERSHIP_BY_VERB`, `resolveObjectOwners`, the motive gate, `gateExemption` (THR-1436) | 🟢 ACTIVE | **extends** — a per-verb ownership override and a per-verb eligibility hook on the type, the same shape as `gateExemption` |

**Grep evidence (measured 2026-09-08 on `main` 4c5c59b6).** `COMPANY` and `ARMY` declare `create`, `change:raise`, `destroy` and are held through `commanded_by`; `FACTION` declares `create`, `destroy`, `observe` and is held through `ownersOf` = the derived leader (THR-1436). `commanded_by` is written at four sites (`armySpawning.ts:245,408`, `groupDissolution.ts:231`, `groupFormation.ts:440`, `strategicGraphOps.ts:1643`), each with its own id form and its own `member_of` role bookkeeping. `promoteNewLeader` repoints the edge to the longest-serving survivor with `promoted: true` — silently, in the dissolution sweep. `will_succeed` is written by `anointSuccessor.ts:86` (the god's card) and `notableAgendas.ts:589`; the phase seats the highest-`priority`, most-recent edge when the snapshot leader exits. `getFactionLeaderId` derives a leader from `member_of.rank` whenever a faction has living members, so **a faction with members is never leaderless** — a candidacy cannot be gated on "no living leader" and mean anything; it is gated on **no seated leader** (no `leads` edge) instead, which is the world's usual state (0 · 1 `leads` edges at tick 150). Seeded worlds at tick 0 (THR-1437): armies 5 · 5, companies 0 · 0 (companies form in play — 2 on seed 42 by tick 30), factions with a derived leader 15 · 16, cohesion on companies starts at `GROUP_COHESION_START_BASE` and frays under the existing cohesion phase.

## Engine pillar

### Systems design

**One command writer.** `src/engine/groups/groupCommand.ts` exports `setCommander(state, groupId, actorId, via, tick)` — remove every `commanded_by` out of the group, add one (`e_commanded_by_${groupId}_${tick}`, properties `{ assignedTick, via }` with `via: 'formation' | 'promotion' | 'claim' | 'mutiny' | 'coup'`), add the actor's `member_of` if absent (role `leader`), set every other member's role to `member`. `promoteNewLeader` calls it with `'promotion'` (its `promoted: true` becomes `via: 'promotion'`; the one reader of `promoted` is updated). The two command cells call it with their own `via`. Fail-soft: a missing group or actor returns `{ success: false }` and writes nothing.

**Who holds a company or an army (registry).** `COMPANY.ownersOf` / `ARMY.ownersOf` return the commander **only while they live** (`isAgentGone` false); a dead commander's group reads *unowned* — which is what `control:claim` waits for, and what the dissolution sweep used to paper over. `ownedVia` becomes `[]` on both (a type declares one reader, THR-1436's rule).

**Two hooks on the type, the shape of THR-1436's `gateExemption`.** `ownershipOverride?: Partial<Record<UndertakingVerbVariant, UndertakingOwnership>>` — read by `findValidTargets` in place of `OWNERSHIP_BY_VERB[variant]` when present; and `eligibility?: Partial<Record<UndertakingVerbVariant, (graph, actorId, handle) => string | null>>` — a refusal reason or `null`, consulted after the ownership rule and before the motive gate, refused as `ineligible:<reason>:<targetId>` on the board. Only the cells below declare either.

**claim × Company** — `take_command`. Ownership `unowned` (no living commander). Eligibility: the actor is a living member of the company, or stands where it stands (`getGroupPosition`). Completion: `setCommander(…, 'claim')`. Reader: everything that reads `commanded_by` — group movement, cohesion, the war readout — and the roster's doing-line (*taking command of the Grey Company*).

**claim × Army** — the same op. Eligibility: the actor is a living `member_of` the army's faction (the army's own `member_of` edge names it) and not already commanding another army. Reader: army movement, battle resolution, the `war` readout.

**seize × Company** — a mutiny. Ownership `other`; the motive gate against the commander (existing). Eligibility: `getCohesionState(getGroupCohesion(group))` is `frayed` or `breaking` — refused `ineligible:cohesion_holds` otherwise, so a mutiny is only possible where the cohesion system already reads the company as coming apart; and the actor is a living member. Completion: `setCommander(…, 'mutiny')`; the deposed commander stays a member; `writeGrudge(graph, deposed, actor, tick, 'command_seized')`; `applyCohesionDelta(group, COMMAND_SEIZED_COHESION_DELTA)`. Harm class `HARM_ON_SEIZE` (`holding_seized`) registers with the grievance lane as every seize does.

**seize × Army** — a coup, resolved by the faction, never by the blade. Ownership `other`; motive gate against the commander. Eligibility: a living member of the army's faction. Completion reads the band the work landed on (`ctx.outcome`, the resolver already passes it): `success` / `critical_success` → `setCommander(…, 'coup')`; `near_miss` / `failure` → `writeGrudge(graph, commander, actor, tick, 'usurpation_failed')` and `applyReputationWithDelta(graph, actor, factionId, -USURPATION_STANDING_LOSS, tick, projectId)`; `critical_failure` → the same, and the actor's `member_of` role becomes `outcast` if the union has it, else the standing loss doubles. The blade never enters it: nobody dies, nothing dissolves.

**claim × Faction** — a candidacy, not a coronation. `ownershipOverride['control:claim'] = 'any'` (the derived leader is a stand-in, not a holder for this verb). Eligibility: no `leads` edge stands on the faction (unseated), the actor is a living member, is not the derived leader, and holds no `will_succeed` edge to the faction already. Completion: `nominateSuccessor(state, factionId, actorId, band, tick)` writes `will_succeed` with `{ anointedTick: tick, anointedBy: null, conferredVia: 'candidacy', priority: CANDIDACY_PRIORITY_BY_BAND[band] }` on `success` / `critical_success` and nothing on a lesser band (the work fails). The succession phase stays the one arbiter: it reads the edge at the next leader exit exactly as it reads an anointment, `priority` desc, and seats the winner. Trace `faction_succession` outcome `candidacy_filed`.

**seize × Faction** — usurping, a forced succession. Ownership `other`; motive gate against the derived leader (hostility or a grievance, already how the gate reads `ownersOf`). Eligibility: a living member, not the leader. Completion `forceSuccession(state, runtime, factionId, usurperId, band, tick)`, three outcomes from what exists: `success` / `critical_success` → the seating the phase does at `:244–268`, extracted into `seatLeader(graph, factionId, successorId, tick, conferredVia)` and called with `'usurpation'` (old `leads` removed, new `leads` written, `leaderSnapshotId` updated, the usurper's own `will_succeed` consumed), trace outcome `usurped`; `near_miss` / `failure` → `writeGrudge(graph, leader, usurper, tick, 'usurpation_failed')` and `applyReputationWithDelta(usurper, factionId, -USURPATION_STANDING_LOSS)`, trace `usurpation_failed`; `critical_failure` → the same, and `applyPlantSchism(state, runtime, factionId, usurperId, SCHISM_RESOLUTION_DELAY_TICKS, tick)` with the usurper as the breakaway, trace `usurpation_split`. The deposed leader is never killed here — that is the plot's business (THR-1430). The phase's own `snapshotId === currentLeaderId` early return means a usurpation it did not run is invisible to it until the next exit, which is correct: the seat moved, the phase's book is updated by `seatLeader`.

**observe × Army** — scouting. The shared `observe` semantic (`recordIntelligence` with `intelligenceType: ARMY_SCOUT_INTELLIGENCE_TYPE`) plus `applyObserveReaders` for an army handle: `seedKnowsOf` on the Location the army stands at (`getGroupPosition`), so the scout's work feeds the same familiarity the survey readers write (THR-1428 R1) — read by encounter awareness and the sheet's *Knows the way to* row — and the war readout lists `scouted by` the mortals whose intelligence record names the army. `observeCellId` learns to name `cell.observe.army` for a group node with the army kind.

**The division rule reaches all seven** without a table change: iron → army, company (Captain, Warlord, Reaver); heart → faction, company (Steward, Founder); dominion → claim, seize; vengeance → seize; discovery and legacy → claim; Eye adds `observe × Army` to every Eye-leaning spread. No hand list is edited.

### Graph nodes / edges

No new node or edge type. `commanded_by` gains `via`; `will_succeed` gains `conferredVia: 'candidacy'` and `priority` (already read by the phase); `leads` gains `conferredVia: 'usurpation'` beside `'anointment'`; `GrudgeCause` gains `'command_seized'` and `'usurpation_failed'`, both added to `GRUDGE_PROVENANCE` (an injury, licenses the plot's `grudge` motive — a deposed commander may plot).

**The grudge must land on an edge that already stands.** A mutiny, a coup and a usurpation are motive-gated on hostility, so a `hostile_to` between the two usually exists already — and `writeGrudge` (`grudgeEdge.ts:62–63`) returns without writing when it does, which would leave the injury's provenance unrecorded every time the gate had a reason (the intent-judge's finding). `writeGrudge` gains an `upgradeCause` option: when an edge stands and the new cause carries `grudge` provenance while the standing one does not (a `covets`, an `old_quarrel`), the standing edge's `cause` is rewritten and `causeUpgradedTick` stamped; a standing `grudge`-class cause is left as it is. The three ops call it with `upgradeCause: true`.

**A candidacy yields to the god's anointment.** `pickSuccessor` ranks `will_succeed` edges by `priority` with unset reading as `-Infinity`, and neither anointment writer sets one (`anointSuccessor.ts:86`, `notableAgendas.ts:589`) — so any positive candidacy priority would outrank every divine anointment and every notable heir (the judge's finding). Decided here: **the god's card outranks a notable heir, who outranks a mortal's candidacy, who outranks the derived ladder.** `anointSuccessor` writes `priority: ANOINTMENT_PRIORITY` (10) and `notableAgendas` writes `priority: NOTABLE_HEIR_PRIORITY` (5) — additive, one property each — and `CANDIDACY_PRIORITY_BY_BAND` is `{ critical_success: 2, success: 1 }`. Existing unset edges in a saved world keep reading `-Infinity`, below every written one, which is the same order they had. Veto handle: *"a mortal's bid beats the god's card"* flips the two constants.

### Tick phases

None new. Proposal in the candidate walk (2b), completion through the one resolver (2a.55); the succession phase and the dissolution sweep run when they always did and read what the cells wrote.

### Resolution logic

- Ownership: `ownershipOverride[variant] ?? OWNERSHIP_BY_VERB[variant]`; owners of a group = the living commander or nobody.
- Eligibility after ownership, before the motive gate; a refusal is `ineligible:<reason>:<targetId>` on the board, never silent.
- Band-read completions (`seize × Army`, `claim × Faction`, `seize × Faction`) read `ctx.outcome` and default to the `failure` arm when it is absent (a review-lever start with no pin).

### PRNG callouts

None. Every choice is a lookup or a sort; the bands come from the checkpoint ladder that already rolled.

## Content pillar

### Encounter templates

N/A — no encounter or prose is authored. **Seven grid notes** in `scripts/undertaking-grid-dispositions.ts` move from `wanted` to live, each carrying its op and its **Read by** line (Christian's hyperconnectivity rule — every cell names its reader in the same commit); the grid regenerates and the codex gains seven cards. **Two of the notes are rewritten, not moved**, and the note says why so the recorded decision and the shipped gate do not diverge: `claim × faction` reads *"gated on the faction being unseated — no `leads` edge — because a faction with members always has a derived leader, so 'no living leader' would never be true"*; `observe × army` reads *"writes familiarity with where the army stands and an intelligence record that names the army and its commander, because `knows_of` is a knower → Location edge (`types/graph.ts:126`) and cannot point at an actor"*. The candidacy note also records the ranking: the god's anointment first, a notable heir second, a candidacy third.

### Prose tables

`src/data/undertaking-verb-prose.ts`: the `control:claim` / `control:seize` / `observe` verb line-sets already carry the four slots; the `band` lexicon (company, army) and the `network` lexicon (faction) each gain one cell line where the generic verb line misreads — *seizing* a company is a mutiny and *seizing* a faction is a usurpation, and the GM voice must say so (Prose Doctrine v2, `Docs/canon/prose.md`). At most one line per cell; no packs.

### Attachment content

N/A.

### Data tables

- `src/data/undertaking-objects.ts` — COMPANY, ARMY, FACTION verbs; `ownersOf` on the two groups; `ownershipOverride`, `eligibility`.
- `src/data/strategic-action-constants.ts` — the constants below.
- `src/engine/grievance/grudgeEdge.ts` — two `GrudgeCause` members; `src/engine/undertakingMotive.ts` — `GRUDGE_PROVENANCE`.
- `scripts/undertaking-grid-dispositions.ts` — seven notes.

## UI pillar

### Player-facing display

Seven codex cards derive from the registry and the notes (THR-1434 — a live cell without a phrase, glyph, lexicon line or note fails the build by name); the roster's doing-line derives (*taking command of the Grey Company — going badly*, *mutinying against Hask*); the ledger names the deed (`UNDERTAKING_VERB_DEEDS`: *Took command of*, *Seized*, *Scouted*; a candidacy reads *Stood for*). The war debug readout (`window.__DEBUG.getWarReadout()`) lists `scoutedBy` on each army. UI Laws engaged: 13/14 (game words — *mutiny*, *coup*, *candidacy*, never `take_command`), 17 (verb tooltips), 21 (the group linked where a page exists), 25 (no capability list on a person), 56 (chips read state).

**Browser-verify:** Browser pane, 1920×1080, `?view=codex` with a new card open (*Seize a company*), and `?view=game&seeded&size=medium` with a roster row mid-claim started through `window.__DEBUG.startUndertaking(agent, 'cell.control_claim.company', { target })`; console clean; `getUndertakingCodexCensus()` → 56 entries / 56 live cells / no problems.

### Event notifications

The existing moment classes (founding, trouble, finish) on the followed mortal; no new class.

### Debug inspection (DebugPanel)

The war readout's `scoutedBy`; `census:cells` for the seven; the CLI `objects` readout's owned column for Company and Army (a dead commander's group reads unowned).

### Visual presence (HexMapV2)

None — no signifier changes.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/engine/groups/groupCommand.ts` (`setCommander`) | 2a.55 (completion), dissolution sweep | roster doing-line, war readout | graph | `strategic_world_change` (op `take_command`, `mutiny`, `coup`) | `getWarReadout`, CLI `objects` |
| `src/engine/factionSuccessionOps.ts` (`seatLeader`, `nominateSuccessor`, `forceSuccession`) | 2a.55; the succession phase reads `will_succeed` | sheet header (the leader) | graph | `faction_succession` (`candidacy_filed`, `usurped`, `usurpation_failed`, `usurpation_split`) | CLI `factions` |
| `src/data/undertaking-objects.ts` (seven verbs, two hooks) | 2b, 2a.55 | codex cards | graph | `strategic_candidate_board` (`ineligible:*`) | `census:cells`, `getUndertakingCodexCensus` |
| `src/engine/strategicActionCandidates.ts` (override + eligibility consult) | 2b | — | — | board refusals | board trace |
| `src/engine/undertakingDeed.ts` (three deed words) | 2a.55 | JourneyTab ledger | history | — | — |

Player controls: N/A by design — mortals' work.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `COMPANY_MUTINY_COHESION_MAX` | `GROUP_FRAY_THRESHOLD` | a mutiny is eligible only while the company's cohesion reads *frayed* or below |
| `COMMAND_SEIZED_COHESION_DELTA` | `-0.1` | what a mutiny costs the company's cohesion on top of the deposing |
| `CANDIDACY_PRIORITY_BY_BAND` | `{ critical_success: 2, success: 1 }` | the `will_succeed.priority` a candidacy files with; lesser bands file nothing; below every anointment and heir by construction |
| `ANOINTMENT_PRIORITY` / `NOTABLE_HEIR_PRIORITY` | `10` / `5` | the priority the god's card and a notable's heir write on their `will_succeed` edge, so a mortal's candidacy never outranks them |
| `USURPATION_STANDING_LOSS` | `0.15` | the `reputation_with` the faction docks a failed usurper or coup |
| `ARMY_SCOUT_INTELLIGENCE_TYPE` | `'army'` | the intelligence record a scouting writes, which the war readout reads |
| `SCHISM_RESOLUTION_DELAY_TICKS` | existing (`plant_schism`'s) | the delay a critical-failure usurpation hands `applyPlantSchism` |

## Tracing

No new category. `faction_succession` (existing `FactionSuccessionTrace`) gains four `outcome` values; `strategic_world_change` carries the three op names; the board's refusal list gains the `ineligible:<reason>` prefix.

```ts
// FactionSuccessionTrace.outcome (existing union) — four more members
type SuccessionOutcome = /* existing */ | 'candidacy_filed' | 'usurped' | 'usurpation_failed' | 'usurpation_split';
// commanded_by edge properties
interface CommandedByProps { assignedTick: number; via: 'formation' | 'promotion' | 'claim' | 'mutiny' | 'coup' }
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Group or actor gone at completion | `setCommander` returns `{ success: false, error: 'group_gone' }`; the work fails, nothing written |
| Commander alive again by completion (a claim raced a recovery) | `ownershipOf` reads `other`; the resolver refuses `ownership_changed` |
| Cohesion recovered above the threshold by completion | the mutiny completes anyway — the work was begun while it read frayed; recorded in the trace |
| Army's faction has no `member_of` edge from the actor at completion | the claim / coup fails `ineligible:not_of_the_faction` |
| `ctx.outcome` absent (a lever start with no pin) | the `failure` arm |
| A `leads` edge appears before a candidacy completes (the god anointed) | the candidacy still files; the phase reads both at the next exit, `priority` desc |
| `applyPlantSchism` refuses (already pending, faction dissolved) | the usurpation's failure effects stand; trace `usurpation_failed` |
| `seedKnowsOf` refuses (the army stands nowhere) | the intelligence record stands alone; no throw |
| Eligibility hook throws | treated as `ineligible:error` — fails closed |
| A `hostile_to` already stands between the two (the gate required one) | `writeGrudge(…, { upgradeCause: true })` rewrites the standing edge's cause to the injury; a standing injury cause is kept |
| A saved world's anointment edge has no `priority` | reads `-Infinity` as today — below a written candidacy; the anointment writer stamps `ANOINTMENT_PRIORITY` from now on, and a migration is not owed (the phase re-reads at the next exit) |

## Interface impact

| Contract | Status today | Action |
|---|---|---|
| `undertaking-object-types` | 🟢 LIVE (THR-1403) | **extend** — seven verbs, two hooks, `ownersOf` on the groups |
| `destroy-candidates-gated-on-motive` | 🟢 LIVE | **extend** — two grudge causes with provenance; the eligibility hook sits beside the gate |
| `faction-succession` (whichever row names `will_succeed` → `leads`; audit-on-touch if ⚪) | — | **extend** — two more writers of the edge the phase reads; `seatLeader` extracted from the phase |
| `t1-undertaking-objects-feed-existing-economies` | 🟢 LIVE | **preserve** |
| `undertaking-ownership-agrees-with-writers` (THR-1436) | 🟢 LIVE | **extend** — a group's owner is its living commander |
| `group-command-changes-through-one-writer` | — | **add** — producer `setCommander`; consumers group movement, cohesion, battle resolution, the war readout, the roster. Register in `scripts/interface-contracts.ts` |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (notes and lexicon lines; encounter prose N/A with rationale)
- [x] UI pillar present (derived surfaces named, browser-verify named, Laws named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves the living world (`00-north-star.md`: people who move each other) and mortal sovereignty — every command change here is a mortal's doing, arbitrated by the world's own phases; the god's anointment card keeps its own edge and, from this plan, a written priority above any mortal's candidacy (it had none before, which would have let a candidacy outrank it).
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes rules of play: **a company or army nobody leads can be claimed; a frayed company can be mutinied against; a coup or a usurpation is decided by the faction, never by the blade; a candidacy waits for the seat to fall empty and yields to the god's anointment and to a notable's heir.**
- [x] `Docs/canon/rulebook.md` § the group verbs gains that paragraph, marked `[IMPL]` by the executor in the same PR.

> Brainstorm companion: `Docs/plans/2026-09-08-thr-1438-ownership-of-people-things-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | six named constants; the cohesion threshold reuses the group ladder's |
| 2. Inspectability | PASS | four succession outcomes, `via` on every command edge, `ineligible:*` on the board, `scoutedBy` on the readout |
| 3. Determinism | PASS | no draw; bands come from the ladder that already rolled |
| 4. Fail-soft | PASS | nine rows; hooks fail closed |
| 5. Narrative over mechanical perfection | PASS with note | a mutiny completes even if cohesion recovered mid-work — the story began when it read frayed |
| 6. Additive over destructive | PASS with note | one extraction (`seatLeader` out of the phase, called by the phase); `promoteNewLeader` keeps its behaviour through `setCommander` |
| 7. Performance budget | PASS | eligibility hooks are O(edges of one node); nothing per tick |

## Done when

- [ ] Unit, on fixtures that falsify: `setCommander` replaces the edge and the roles and is what `promoteNewLeader` calls; a dead commander's company reads unowned and a living one's reads `other`; the mutiny is refused `ineligible:cohesion_holds` while cohesion reads `holding` and offered once it reads `frayed`; the coup's three arms by band; the candidacy writes `will_succeed` with the band's priority and nothing on failure, and the phase seats the candidate at the next exit ahead of the derived ladder but **behind** an anointment and a notable heir (three edges, one exit, the anointed seats); the usurpation's three arms, the seat moving on success and the phase's snapshot agreeing; **the mutiny op run on a pair who are already hostile with a `covets` cause** leaves one `hostile_to` whose cause is `command_seized`, and `holdsMotive(deposed, usurper, 'grudge')` is then true — the producer, not a seeded edge
- [ ] Generated small world, model `cells`: a company whose commander is marked dead (`markMortalDead`, retain) is offered `cell.control_claim.company` to a living member under a dominion ambition on the next board; an army is offered `cell.control_claim.army` to a faction member after its commander dies; `cell.observe.army` writes `knows_of` to the army's Location
- [ ] `census:cells`, both seeds, 150 ticks: `no_object_exists` / `no_owned_object` absent for the seven cells' kinds where the world holds one; each of the seven starts at least once across the two seeds **or** its refusal reason is recorded on the ticket (a mutiny waits on a frayed company; a claim waits on a death)
- [ ] The grid regenerates with seven live notes; the codex census reads 56 / 56 / no problems; `Docs/canon/undertakings.md` § The verb × object model gains the band's paragraph; the rulebook paragraph; the interface map with the new row
- [ ] Browser-verify per the UI pillar; 30-tick CLI smoke; `npm run test:heavy`
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass
- [ ] Closing commit body includes `Fixes THR-1438`

## Kill criteria

- If mutinies fire on companies the roster reads as *holding* — the eligibility hook is reading the wrong node (the company carries `cohesion`; a member does not).
- If a usurpation seats a leader the succession phase then unseats at its next pass — `seatLeader` did not update `leaderSnapshotId`, and the phase read the move as an exit. The fix is in the extraction, never in the phase.
- If `claim × Faction` is offered on monster-lair factions (THR-1436's kill criterion, the same shape) — the eligibility hook's "living member" test is reading `member_of` from the wrong end.
- If the coup or the usurpation ever removes a node — the plan is misread; the blade is the plot's, and only `markMortalDead` writes a death.

## Coordination block

**Suggested model:** opus — three operations with band-read arms, an extraction out of a phase that must keep its book, and two registry hooks that must fail closed.
**Parallel-safe with:** the yield band's plan doc (authoring only); THR-1348's graduation fork.
**Mutex with:** any ticket editing `src/data/undertaking-objects.ts`, `src/engine/strategicActionCandidates.ts` or `src/engine/phaseFactionSuccession.ts` (the yield band's executor ticket, once filed, is the one to sequence — this lands first, it is the earlier band).
**Files to touch:** `src/engine/anointSuccessor.ts` + `src/engine/notableAgendas.ts` (one `priority` each), `src/engine/groups/groupCommand.ts` (new), `src/engine/groups/groupDissolution.ts` (calls `setCommander`), `src/engine/factionSuccessionOps.ts` (new: `seatLeader`, `nominateSuccessor`, `forceSuccession`), `src/engine/phaseFactionSuccession.ts` (calls `seatLeader`), `src/data/undertaking-objects.ts`, `src/engine/strategicActionCandidates.ts`, `src/engine/undertakingResolver.ts` (ownership override read), `src/engine/grievance/grudgeEdge.ts`, `src/engine/undertakingMotive.ts` (`GRUDGE_PROVENANCE`), `src/data/strategic-action-constants.ts`, `src/data/undertaking-verb-prose.ts`, `src/engine/undertakingDeed.ts` (deed words), `src/debug-bridge.ts` + `src/engine/warReadout*` (`scoutedBy`), `scripts/undertaking-grid-dispositions.ts`, `scripts/interface-contracts.ts`, `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md`, tests: `src/engine/__tests__/groupCommand.test.ts`, `factionSuccessionOps.test.ts`, `peopleThingsCells.test.ts` (generated world), plus `undertaking-objects.test.ts` and `undertakingCellWalk.test.ts` extensions.

## Notes for the executor

- **`setCommander` is the one writer.** Four sites write `commanded_by` today with four id forms; only `promoteNewLeader` is rehomed by this plan (it is the one that *changes* a command). The spawn-time writers keep their ids; do not chase them.
- **A candidacy is gated on "unseated", not "leaderless"** — `getFactionLeaderId` derives a leader for every faction with members, so "no living leader" would make the cell unreachable by construction. "No `leads` edge" is the world's usual state and is what an anointment or a candidacy changes.
- **`seatLeader` is an extraction of the phase's `:244–268`**, called by the phase with `'anointment'` and by `forceSuccession` with `'usurpation'`; it must update `leaderSnapshotId` or the phase reads the usurpation as an exit and re-seats.
- **The coup and the usurpation read the band.** `ctx.outcome` is on `ObjectVerbContext` since THR-1428; a lever start without a pin takes the `failure` arm — say so in the test.
- **Two grudge causes go into `GRUDGE_PROVENANCE`.** Unlike THR-1437's `old_quarrel`, a seized command and a failed usurpation are injuries: they license the plot. The test asserts `holdsMotive(deposed, usurper, 'grudge')`.
- **Codex cards need lexicon lines.** `validateUndertakingCodex` fails by name on a live cell without one; write the seven lines before regenerating.
- **`observe × Army` names the army's Location** for `seedKnowsOf` (`getGroupPosition`), and the war readout's `scoutedBy` reads the intelligence records typed `ARMY_SCOUT_INTELLIGENCE_TYPE` — the readout is `src/debug-bridge.ts`'s war readout; find its builder by grepping `getWarReadout`.

## Intent-judge verdict

**Run 1 (opus — run on Opus rather than Fable to conserve the Fable budget per Christian's 2026-09-07 note; cold, 2026-09-08): Revise** — impact class Reversible confirmed; eight dimensions PASS, three GAPs, every one author-fixable and applied in this revision: (4) `writeGrudge` returns without writing when a `hostile_to` already stands, and the three ops are gated on exactly that hostility — so the injury's provenance would never have landed; the plan now gives `writeGrudge` an `upgradeCause` option, a fail-soft row, and a Done-when that runs the mutiny op on an already-hostile pair; (5) a positive candidacy priority would have outranked every divine anointment and notable heir, since neither writer sets `priority` and unset reads `-Infinity`; the plan now stamps `ANOINTMENT_PRIORITY` (10) and `NOTABLE_HEIR_PRIORITY` (5) on those writers, keeps the candidacy at 1–2, corrects the Vision sentence and the rulebook line, and names the veto handle; (6) two grid notes narrow Christian's recorded lines ("no living leader" → "unseated"; familiarity "with the army and its commander" → with where it stands) — the Content pillar now says both are rewritten and why. The judge verified every substrate row at source and the division-rule reach of all seven cells.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-08 (sonnet, three auditors spawned in one message, before the intent-judge revision; the substrate corrections below were applied).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | six named constants; the cohesion threshold reuses `GROUP_FRAY_THRESHOLD` rather than a parallel ladder |
| 2. Inspectability | PASS | four `faction_succession` outcomes, `via` on `commanded_by`, `ineligible:<reason>` on the board never silent, `scoutedBy` on the readout |
| 3. Determinism | PASS | no draw; bands from the ladder that already rolled; a missing input takes a fixed arm |
| 4. Fail-soft | PASS | the table covers group/actor gone, ownership races, cohesion recovery, the missing faction edge, absent outcome, a late `leads`, schism refusal, `seedKnowsOf` refusal, a throwing hook (fails closed) |
| 5. Narrative over mechanical | PASS-with-note | a mutiny completes even if cohesion recovered mid-work — the story began when it read frayed |
| 6. Additive over destructive | PASS-with-note | one extraction (`seatLeader`) the phase keeps calling; only the one `commanded_by` writer that *changes* a command is rehomed |
| 7. Performance budget | PASS | hooks are O(edges of one node); nothing per tick |

**NFP AUDIT: PASS-with-notes.**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | systems design, edges, phases, resolution, PRNG with module and line references |
| Content | N/A-with-rationale for templates; prose and data tables substantive | grid notes, lexicon lines, constants |
| UI | present-and-substantive | derived surfaces, debug readout, browser-verify route and Laws named; HexMapV2 explicitly none |

Wiring connects each module to a phase (2a.55 verified as a registered phase), a surface, a trace and a debug view. Substrate: seven rows; two badges corrected to the inventory's 🟠 DORMANT (Companies & Group Travel; Intelligence, Knowledge & Familiarity) and one name corrected (the `grievance` domain lives under Reputation & Influence) — applied. Blast Radius correctly omitted (24 · 41 · 2 importers). **PILLAR AUDIT: PASS-with-notes.**

### Vision audit

`00-north-star.md` → extended as substrate (mortal-on-mortal power struggles a witnessed moment can grow from); `01-core-loop.md` → not referenced (no new surface); `02-non-negotiables.md` → confirmed decisively (the blade never enters; no new node or edge type; the extraction preserves behaviour; Content N/A with rationale); `03-design-tensions.md` → extended on tension 2, with a drift-signal: these verbs need the encounter pipeline to curate them into witnessed chapters eventually, or the emergence goes unseen; `taste-profile.md` → confirmed twice (edges not property bags; narrative over mechanical). No contradictions. **VISION AUDIT: PASS-with-notes.**
