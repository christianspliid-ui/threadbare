> **title:** `A held town is a faction position — holding opens the Realm's encounters and steers the holder's work — THR-1448`
> **linear_issue:** THR-1448
> **author:** `Claude Code`
> **created:** 2026-09-21
> **three_pillars:** Engine `done` · Content `done — two town-keeper encounters through the factory, one gate field, the UL hold entry corrected` · UI `done — a hold line in the sheet's Faction strand with the grip in words; Playwright DOM evidence`

# A held town is a faction position — THR-1448

*A mortal who keeps a town keeps it for someone. Today the hold is a private clock: no faction knows the keeper, no encounter turns to them, and the board weighs their work on a held town like any other. This plan makes the hold a standing with the Realm whose ground the town sits on.*

## Why this is load-bearing

Christian's ruling on THR-1287 (attended chat, 2026-09-10) had two clauses: *"it is a commitment and probably also a faction position?. it could open up specific encounters within that factions and influence what undertakings are prioritized."* The first clause shipped as THR-1287 (Done 2026-09-10; `renewControlStance` at `strategicActionLifecycle.ts:1476`). This plan is the second. Every substrate it needs is on `main` `df1cf66c`: THR-1155 shipped Realms through slice 3 (PR #1898, `b2f7ba35`), with per-culture Realm definitions (`realm.<cultureId>`, `realm-content.ts:366`), a six-rung court ladder (`stranger · subject · yeoman · sworn · thane · counsel`, `:229`), three authored court encounters (`encounter.realm.court_summons | border_levy | tithe_demanded`, `:426-429`), and the class-scoped resolver `resolveMetaFactionDefId` (`factionMetaScope.ts:60-96`) that answers *which Realm* standing-first, ground-second.

Three facts shape the design. **A claimable town is one no faction holds** — `control:claim` requires `unowned` (`OWNERSHIP_BY_VERB`, `strategic-action-constants.ts:1042-1044`), and `getLocationHolder` (`realmHolder.ts:53-76`) filters to faction sources and *excludes a mortal's stance by name, citing this ticket* (`:43-46`). So the faction is never on the town; it has to be read off the ground. **`rank` is a cache, not an authority** — `getDerivedMembershipRank` (`factionReputation.ts:203-240`) derives it from `reputation`, and the docblock records writers that disagree, one of them writing the string `'army'` into the numeric field; a position expressed by writing `rank` re-opens THR-1211. **The board is live and the model is cells** (`UNIFIED_DECISION_BOARD_MODE = 'live'`, `:558`; `UNDERTAKING_MODEL = 'cells'`, `:1023`), so a scoring term decides real behaviour this tick, and THR-1301's lesson binds: a term whose population is every candidate tunes nothing (`computeAmbitionCentralityBoost` measured `0.354` at p25 / p50 / p75 on both seeds, `decisionBoard.ts:337-359`).

## Substrate inventory

Grep evidence 2026-09-21. `StrategicControlState` (`strategicAction.ts:976-993`) carries no faction field. No `position`, `office`, `steward`, `seat` engine symbol exists for a mortal's hold; **`Court Position` in the UL means the divine court** (`'the_first' | 'retinue' | 'watched' | 'dormant'`, `Encounters.md:163`), so *position* unqualified collides and is not used as a player word here.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Strategic Projects & Control** — `StrategicControlState` (`strategicAction.ts:976-993`), `claimControl` (`strategicGraphOps.ts:228-269`, mints `controls` with `controlType: 'strategic'`), `renewControlStance` (`:1476`), `retireControl` collapse (`:1353`), `applySeizeRetirement` (`:1413-1430`) | 🟢 ACTIVE | **reads** — the stance is the seam THR-1287 left; nothing on it changes. The standing ends exactly where the stance does |
| **Factions & Succession** — `MemberOfEdgeProperties` (`disposition.ts:83-119`), `joinFaction` (`factionMembership.ts:252`, starting role, one id shape), `meetsFactionRankRequirement` (`factionReputation.ts:180-201`, **`false` when not a member**, `:200`), `resolveMetaFactionDefId` / `standingRealmDefId` / `groundRealmDefId` (`factionMetaScope.ts:60-96`), `REALM_RANK_LADDER`, `REALM_REPUTATION_DECAY_MULTIPLIER = 0.6` (`realm-content.ts:360`), `FACTION_ENCOUNTER_META` (`faction-encounter-content.ts:92`) | 🟢 ACTIVE | **extends** — a hold opens a `member_of` edge with the ground's Realm through `joinFaction`, seeded by writing `reputation` (never `rank`); the Realm's class-scoped `FACTION_ENCOUNTER_META` rows then reach the keeper through the existing supply path, at the rank's `encounterAccess` |
| **Realms** — `buildRealmProjection` (`realmProjection.ts:98`: `hexRealmId: Map<"col,row", factionNodeId>`, `heldLocationIds`), `getLocationHolder` (`realmHolder.ts:53`), `HeldByLine` (`components/shared/HeldByLine.tsx`) | 🟢 ACTIVE | **reads** — the ground's Realm is the projection entry for the town's hex; `getLocationHolder` is *not* used (it answers a different question and says so) |
| **Encounters & Dilemmas** — the filter pipeline's prerequisite stage: `.join` gates (`encounterFilterPipeline.ts:365-387`), the reputation-with gate (`:398-406`, fails open on an unresolvable template — *this gate can only ever hide content*), the rank gate (`:441-448`, senior/elite only); the supply side `generateFactionQuestCandidates` (`factionQuestGeneration.ts:78-133`, walks `member_of` only, `:87`) | 🟢 ACTIVE | **extends** — one template field `requiresHold` read beside `requiredReputationWith` with the same fail-open convention; the supply path gains the `requiresHold` arm (Q3) |
| **Ambitions & Undertakings** — `scoreUnifiedBoard` (`decisionBoard.ts:446-535`), `computeTemperamentWeight` (`:400-416`: `1 + 0.3·prefersVerb + 0.2·reachAffinity + 0.4·grievanceHeat`), candidates carry `targetNodeId` / `objectHandle` / `objectTypeId` (`strategicAction.ts:712-723`); `LOCATION` cells (`undertaking-objects.ts:1150-1220`, `ownedVia: ['controls','owns']`); `divisionRule.ts:36` (which cells a mortal sees at all) | 🟢 ACTIVE | **extends** — one additive term on `computeTemperamentWeight`, keyed on the *candidate's object*, so it discriminates by construction; `divisionRule` untouched |
| **Attention, Chronicle & Narrative** — `agentDetail.ts:1505-1531` (the sheet's faction card: `factionNodeId`, `factionRank` via `computeRankFromReputation`, `factionReputation`), `OverviewTab.tsx:441-478` (the Faction strand), `strategicPresentation.getAgentStrategicSummary` (`:200-215`, the doing-line) | 🟢 ACTIVE | **extends** — the card gains the hold fields; the strand gains one line. **Today a mortal's hold has no words on any player surface** — `degradation` is a debug label and a marker opacity (`StrategicMarkerMesh.ts:134,230`) — which the visibility-parity rule makes this plan's UI work |
| Traces — `strategic_control_lifecycle` (`trace.ts:122,563,2664-2681`, members `collapsed | reclaim_refused | already_held | renewed | seized`), `decision_board_comparison.boardTop[]` (`:2557-2597`) | 🟢 ACTIVE | **extends** — two event members, one optional board field |

Runtime counts (THR-1439 handoff census, 150 ticks): `claim × Location` started 8 · 0 on seeds 42 · 99. A hold is organically rare on 99; the generated-world test, not the census, is the acceptance.

## Engine pillar

### Systems design

**Which faction (Q1).** The Realm whose ground the town sits on, read from the realm projection: `hexRealmId.get(hex of the held Location)` — **ground only**. A keeper who already holds standing with that Realm is simply the `already_member` case (`membershipMinted: false`); a keeper with standing in some *other* Realm keeps this town for the ground's Realm all the same, and their other standing is untouched — a town's business is the crown that claims the ground, whoever else the keeper knows. (`resolveMetaFactionDefId`'s standing-first order answers a different question — which Realm a meta row is *about* for an agent — and is not mirrored here.) A town in unclaimed wilds (no projection entry) opens no standing — a hold in the wilds is just a hold. Neither the holder's guild (a guild is not landed) nor a minted faction (one-member factions flood every `member_of` reader and succession) is an answer. `getLocationHolder` is not called: a claimable town has no faction `controls` edge by rule, and the reader excludes stances by design.

**What the standing is (Q2).** A **reading, not a record**: `holdStanding(graph, strategicState, projection, agentId) → { realmNodeId, realmDefId, heldLocationIds, grip } | null`, pure, computed on demand from active stances plus the projection. The one write is the membership: when a hold opens a standing with a Realm the holder is not yet a member of, `joinFaction(graph, holderId, realmNodeId, tick)` mints the `member_of` edge at the ladder's entry rung and the plan seeds `reputation = HOLD_STANDING_REPUTATION_SEED` on it — enough that `meetsFactionRankRequirement` opens (it returns `false` for a non-member, `:200`) and the keeper reads *subject*, the ladder's own second rung. **Never write `rank`.** No new node, edge type, class, or field on the stance. The player word is the ladder's: *a hold makes you a subject of the Realm*; the line reads *keeps Ashford for the Realm of the Vael*.

**How encounters gate (Q3).** Two moves. *Supply:* a member receives the Realm's content through `generateFactionQuestCandidates`, which walks the class-scoped `FACTION_ENCOUNTER_META` rows matched by `metaBelongsToDefinitionId` (the definition's `questTemplateIds` field is declared and read by nobody) — but **only the ids their rank's `encounterAccess` prefixes admit** (`factionQuestGeneration.ts:100-104` → `getAccessibleTemplates`, `:206-212`; `REALM_RANK_ACCESS` in `realm-content.ts:290-296` is `stranger: []`, `subject: ['encounter.realm.']`). So the three court encounters reach the keeper the day the membership lands at *subject*, and stop the day the keeper fades to *stranger*. The town-keeper content must not stop with them — the town's troubles arrive at the keeper's door *because they keep the town*, not because the court likes them — so `generateFactionQuestCandidates` gains a **`requiresHold` supply arm**: for a member whose `holdStanding` names this Realm, every `FACTION_ENCOUNTER_META` row of this Realm's class whose template carries `requiresHold` is offered **regardless of `encounterAccess`**; everything else keeps the allowlist. One added branch beside the existing rank filter, the same `visibleTo` / `personallyOffered` shape, a fourth interface contract below. (The `realm-content.ts:275-276` docblock says `encounterAccess` is *"declared, and read by nobody"*; that is false — `getAccessibleTemplates` reads it on the live path `phaseAgentDecision.ts:568` — and the executor logs an impediment row and corrects the docblock rather than trusting it.) *Gate:* `UnifiedActionTemplate` gains `requiresHold?: { ofRealm: true }` beside `requiredReputationWith` (`unifiedAction.ts:2415`), read in the same loop of `encounterFilterPipeline.ts` with the same convention — guarded on `template`, **failing open** on an unresolvable lookup, because a gate that can only hide content must not silently empty a pool. A template carrying it is offered only to a mortal whose `holdStanding` names the encounter's Realm (the ground's Realm, by Q1) and whose held town is the encounter's location or on that Realm's ground. It is a template field, not a `FACTION_ENCOUNTER_META` column — `minRank` is required on every one of ~150 rows and an optional sibling there is silently absent everywhere. **The town-keeper rows carry `minRank: 'stranger'`** (the ladder's floor): the keeper's own content gates on the hold, never on the rank, so it cannot fade while the town is kept.

**How the board reads it (Q4).** One term on `computeTemperamentWeight`: `+ HELD_TOWN_AFFINITY_WEIGHT × heldTownAffinity(candidate)`, where `heldTownAffinity` is `1` when the candidate's object is a Location the actor holds through an active stance, `HELD_REALM_AFFINITY_SHARE` when it is a Location the actor's Realm holds or the Realm itself, else `0`. Most candidates are on neither, so the term discriminates by construction — the opposite of the THR-1301 shape. It goes on the temperament weight, not `desireMultiplier` (axiological, shared with the encounter path) and never as a bridge constant between families. The Done-when **measures the spread** (p25 ≠ p75 across candidates on seeds 42 / 99), because asserting a term exists is how the last one went vacuous. `divisionRule.ts` is left alone: a holding exception would be its first non-derived input.

**What ends it (Q5).** The standing ends exactly where the stance does — collapse (`retireControl`) or seize (`applySeizeRetirement`) — and `holdStanding` returns `null` the tick `active` flips. **The membership survives** at whatever reputation it earned: standing with a court is a social fact, and `REALM_REPUTATION_DECAY_MULTIPLIER` is the existing mechanism that lets it fade. Retiring the edge on collapse would be a second, bespoke expulsion path. The reactive loop already mints the grievance on seize (THR-1298); nothing here adds one.

**Fading while the hold is live is intended.** The seeded reputation decays like any other membership's (phase `6.55`, slowed by the realm multiplier). A keeper who never answers the court's business slides from *subject* toward *stranger* while still keeping the town — and the court's *general* content (`court_summons`, `border_levy`, `tithe_demanded`, whatever `minRank` those rows carry) fades with it. That is the story: a keeper the crown has stopped asking. What never fades is the keeper's *own* content — the town-keeper rows reach the keeper through the `requiresHold` supply arm (Q3) whatever the rank, and gate on `requiresHold` at `minRank: 'stranger'` in the filter — and the seeded reputation is written **once**, at the standing's opening, never floored or topped up by renewal. Doing the court's work is how the rank climbs; keeping the town is only what opens the door, and what keeps the town's own business coming.

**Where the write runs.** The membership write and its trace run at the two sites where a stance is created: `claimControl`'s caller in the `claim_control` completion arm, and — for saved worlds and worlds seeded with stances — a one-time reconciliation on the first `2a.55` pass (idempotent: `joinFaction` returns `already_member`).

**What does not change.** The stance record, the neglect loop, renewal, collapse, seize, the projection, `getLocationHolder`, `resolveMetaFactionDefId`, `FACTION_ENCOUNTER_META`, the rank gate, the supply path, `divisionRule`, every constant THR-1287 set.

### Graph nodes / edges

No new type. One `member_of` edge per (holder, Realm) minted through `joinFaction` with `reputation` seeded; the edge is shared with every other membership path (same id shape, `factionMembership.ts:280-282`).

### Tick phases

None new. The write runs in `2a.55` (stance creation / completion); the gate in the encounter filter; the board term in `2a` decision.

### Resolution logic

Deterministic: the projection is a pure function of `controls` edges and tiles; the standing is a pure read; the board term is a threshold on object identity.

### PRNG callouts

None. `joinFaction` draws nothing.

## Content pillar

### Encounter templates

Two town-keeper encounters through the Encounter Factory line — `encounter.realm.keepers_petition` and `encounter.realm.crowns_reckoning`, the `encounter.realm.` prefix so the *subject* rung's `encounterAccess` admits them beside the three court encounters — tagged `#town_keeper`, both carrying `requiresHold: { ofRealm: true }` and a class-scoped `FACTION_ENCOUNTER_META` row (`factionClass: 'realm'`, `minRank: 'stranger'` — the hold is the gate, not the rank), and both spending `$realm` (THR-1454's sentinel):

- **The Keeper's Petition** — the town's troubles arrive at the keeper's door as the crown's business: a levy the town cannot meet, a road the Realm wants opened, a quarrel the court expects the keeper to settle. Outcomes move standing with the Realm through `faction_reputation_gain` on `$realm` keyed to the side, the THR-1454 pattern; a failed petition costs standing.
- **The Crown's Reckoning** — the Realm turns to its keeper for something it would not ask a stranger: hold the border, host the court, surrender the town's surplus. The at-cost band is the keeper keeping the town and losing the court's favour, or the reverse.

Brief: the factory's anchors are `location` + `faction` (no `hold` anchor is needed — the predicate is a template field, not a brief concept); the batch report prints the two as the first `requiresHold` users. Both are gated by `check:encounter`; the systems-prompt "Live primitives" list gains `requiresHold`.

### Prose tables

One chronicle line when a standing opens (`HOLD_STANDING_EVENT_SIGNIFICANCE`): *`${name} keeps ${town} for ${realm}`*. None when it closes — the collapse line THR-1287 already emits covers it. The grip renders in words: `HOLD_GRIP_WORDS` bands `degradation` to *firm · slipping · failing* (Law 13; the number stays on the trace and the debug tab).

### Attachment content

N/A.

### Data tables

Constants below. **UL** (`Agents.md` § hold): the stale paragraph *"Upkeep is the live gap"* is corrected (THR-1287 shipped renewal) and a paragraph is added: *a hold on a Realm's ground opens a standing with that Realm at* subject*; from there the rank climbs or fades by the court's own work while the town's business keeps coming to the keeper; the standing is read from the hold and ends with it; the membership it opened outlives it.* No new headword — *subject* is the ladder's word; *position* is not used (it names the divine court). **Rulebook** (§ The World at Work, beside the hold sentence): one `[IMPL]` sentence. **Canon** `Docs/canon/undertakings.md`: one paragraph. **Wiki** *Essence, Control & Sustained Power*: the mortal-hold paragraph gains the standing.

## UI pillar

*Screenshot tool: **Playwright (DOM)** — the mortal sheet. Route: `?view=game&seeded&size=medium`, claim a town on a threaded mortal through the review lever THR-1287's Done-when names (`__DEBUG` / CLI `spawn` → `control:claim`), `window.__DEBUG.tick(n)` past the standing write, open the sheet; capture the Faction strand's hold line at 1920×1080; console; a `getHoldStanding` assertion; Laws 13/14, 21, 33, 56.*

### Player-facing display

- **The sheet's Faction strand** (`OverviewTab.tsx:441-478`) gains one line beneath the rank: *keeps Ashford for the Realm of the Vael · grip firm*, the town and the Realm as links through the one router (THR-1482), the grip a word. The card (`agentDetail.ts:1505-1531`) gains `holdTownName`, `holdTownId`, `holdRealmName`, `holdRealmNodeId`, `holdGripWord`. A mortal with a hold but no Realm on the ground reads *keeps Ashford · grip firm* with no Realm.
- **The doing-line** (`ThreadsPanel.tsx:349-356`) is unchanged — it reports the active work; the hold is a standing, not a doing.
- **The town's own page** — `HeldByLine` keeps saying which Realm holds the ground; a mortal's hold does not move it (`realm-holdings-to-political-map`, `interface-contracts.ts:258`, pins that a stance never moves the border).

### Event notifications

The chronicle line on opening. No toast.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getHoldStanding(agent?)` → the reading; CLI `hold [agent|@hero]`.
- The strategic debug tab's control rows gain the Realm name beside `degradation`.
- `position_opened` / `position_closed` in the trace viewer; `heldTownAffinity` on `boardTop[]`.

### Visual presence (HexMapV2)

N/A — the strategic marker (`StrategicMarkerMesh.ts`) already renders the stance; the standing adds no signifier.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `engine/holdStanding.ts` (new: `holdStanding`, `heldTownAffinity`, `gripWord`) | read in `2a`, the filter, the sheet | `OverviewTab` (via `agentDetail`) | reads `strategicState.controls` + graph + projection | — | `__DEBUG.getHoldStanding`, CLI `hold` |
| `engine/strategicActionLifecycle.ts` (standing write at stance creation + first-pass reconciliation, via `joinFaction`) | `2a.55` | — | graph `member_of` (+ `reputation`) | `strategic_control_lifecycle` (`position_opened` / `position_closed`) | strategic debug tab |
| `engine/encounterFilterPipeline.ts` (`requiresHold` read) | encounter filter | — | — | existing filter traces | — |
| `engine/factionQuestGeneration.ts` (`requiresHold` supply arm beside the `encounterAccess` filter) | `2a` decision (`phaseAgentDecision.ts:568`) | — | — | existing faction-candidate traces | — |
| `engine/decisionBoard.ts` (`computeTemperamentWeight` term) | `2a` | — | — | `decision_board_comparison.boardTop[].heldTownAffinity` | trace viewer, census |
| `engine/agentDetail.ts` + `components/Game/tabs/OverviewTab.tsx` | — | Faction strand | reads | — | Playwright capture |
| `types/unifiedAction.ts` (`requiresHold`) · `types/trace.ts` (+ three sites) | — | — | — | — | — |

Prose pipeline: the chronicle line and the grip words through the existing words tables. Player controls: none — the god does not appoint keepers.

## Constants table

In `src/data/strategic-action-constants.ts` beside the THR-1287 renewal constants (NFP #1):

| Constant | Default | Purpose |
|----------|---------|---------|
| `HOLD_STANDING_REPUTATION_SEED` | `0.2` | reputation written once on the membership a hold opens — inside *subject* on the realm ladder (`REALM_RANK_THRESHOLDS`: subject `0.15`, yeoman `0.30`), never a `rank` write, never topped up |
| `HELD_TOWN_AFFINITY_WEIGHT` | `0.3` | the board term's weight, same order as `UNDERTAKING_TEMPERAMENT_AMBITION_WEIGHT` |
| `HELD_REALM_AFFINITY_SHARE` | `0.5` | the term's value for the Realm's other holdings, as a share of the held town's `1` |
| `HOLD_GRIP_WORDS` | `[[0.33, 'firm'], [0.66, 'slipping'], [1, 'failing']]` | `degradation` → word bands for the sheet |
| `HOLD_STANDING_EVENT_SIGNIFICANCE` | `0.4` | the opening chronicle line |

## Tracing

Extend the registered interfaces; register, never duck-type.

```ts
// StrategicControlLifecycleTrace (extended) — two members
event: 'collapsed' | 'reclaim_refused' | 'already_held' | 'renewed' | 'seized' | 'position_opened' | 'position_closed';
realmNodeId?: string;      // position_*: the Realm the standing names
membershipMinted?: boolean; // position_opened: false when the holder was already a member

// DecisionBoardComparisonTrace.boardTop[] (extended) — one optional field
heldTownAffinity?: number; // 0 | share | 1, so the census can measure the term's spread
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Held town's hex has no projection entry (wilds) | no standing; no membership; nothing traced beyond the stance's own |
| Keeper already holds standing with a *different* Realm | irrelevant to Q1 — the ground's Realm opens the standing; the other membership is untouched; a keeper may be a subject of two courts |
| Seeded reputation has decayed below *subject* while the hold is live | `encounterAccess` is `[]` at *stranger*, so the court's general rows stop being supplied; the town-keeper rows are still supplied through the `requiresHold` arm and pass the filter at `minRank: 'stranger'`; nothing is floored — intended (Q5) |
| The Realm node is gone (a Realm dissolved) | `holdStanding` returns `null`; the membership edge stays and decays as any other |
| `joinFaction` returns `already_member` | standing opens on the existing membership; `membershipMinted: false` |
| `joinFaction` returns `faction_not_found` | no membership; standing still reads from the ground; trace carries the reason |
| Two active stances by one actor (should be impossible) | first by id; the THR-1287 invariant test catches it |
| `requiresHold` on a template with no resolvable lookup | fails open (the reputation-gate convention) |
| Candidate has no `targetNodeId` | affinity `0` |
| Projection stale for the tick | the projection is rebuilt on `fingerprintFactionControls` change (existing); a stance never changes the fingerprint, so a stale read can only lag a *faction's* conquest by one rebuild |

## Interface impact

| Contract | Action | Producer → Consumer |
|----------|--------|---------------------|
| `held-town-opens-realm-standing` | **add** | `strategicActionLifecycle` (stance creation) → `joinFaction` → `member_of` read by `factionQuestGeneration`, `meetsFactionRankRequirement`, `agentDetail`; registered 🟢 on landing with the generated-world test |
| `held-town-affinity-on-the-board` | **add** | `holdStanding` → `computeTemperamentWeight` → `boardTop[].heldTownAffinity`; evidence: the spread measurement |
| `requires-hold-gates-town-keeper-content` | **add** | template field → `encounterFilterPipeline`; readers named |
| `held-town-supplies-keeper-content-past-rank-access` | **add** | `holdStanding` → `generateFactionQuestCandidates`'s `requiresHold` arm → faction candidates; evidence: the decayed-*stranger* generated-world arm |
| `realm-holdings-to-political-map` (`:197`, evidence `:258`) | **preserve** | a stance still never moves the border — the plan reads the projection and writes nothing to `controls` |
| `guild-rank-gates-senior-content` (`:1780`) | **preserve** | unchanged |
| `cell-completion-renews-control-stance`, `seize-retires-losers-control-stance` | **preserve** | the standing reads the stance these write |

`Docs/canon/interface-map.md:294` lists *Factions & Succession* among the subsystems with no contract rows; the four `add` rows above begin that table.

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 125 (`.codesight/graph.md`, 2026-09-21) | two union members, two optional fields; ratchet covers it |
| `src/types/strategicAction.ts` | 99 (below the cutoff; listed because every strategic plan names it) | **not edited** — the standing is a reading, not a field on the stance |
| `src/types/unifiedAction.ts` | 494 | one optional template field beside `requiredReputationWith`; ratchet must report unchanged |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. A mortal's hold becoming a standing with a court is sovereignty exercised (`02-non-negotiables.md` #1's two-way premise); the court turning to its keeper is the world reacting to what a mortal built, which is the north-star's witnessed consequence. The god appoints nobody and can only nudge the keeper's encounters.
- [x] No Vision edit required.

## Rulebook impact

- [x] **Changes a rule of play** (holds): *A hold on a Realm's ground opens a standing with that Realm — the keeper starts as a subject and climbs or fades by the court's own work; the town's business comes to their door for as long as they keep it, and their work leans toward what they hold.* Lands in `Docs/canon/rulebook.md` in the same PR, `[IMPL]` on ship.
- [x] `Docs/canon/rulebook.md` is updated in the same PR as the code — the executor re-verdicts the holds sentences when the tag flips to `[IMPL]`.

> Brainstorm companion: `Docs/plans/2026-09-21-thr-1448-held-town-faction-position-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | five constants; the grip bands are a table |
| 2. Inspectability | PASS | two trace members with the Realm, a board field the census can measure, `getHoldStanding`, CLI |
| 3. Determinism | PASS | pure reading over projection + stances; no draw |
| 4. Fail-soft | PASS | eight rows; wilds and dissolved Realms degrade to "just a hold" |
| 5. Narrative over mechanical perfection | PASS | the membership outlives the hold — a court remembers its keeper |
| 6. Additive over destructive | PASS | one reading module, one term, one template field, one optional card field set; nothing on the stance changes; `rank` never written |
| 7. Performance budget | PASS | the projection is already built and cached; the reading is two edge scans per mortal; the term is an id comparison per candidate |

## Done when

- [ ] Unit, on fixtures that falsify: a stance on a town inside a Realm's projection opens a standing and mints `member_of` with `reputation = HOLD_STANDING_REPUTATION_SEED` (rank derives to *subject*; `rank` is never written); a stance in the wilds opens nothing; an existing member gets `membershipMinted: false`; collapse and seize close the standing and leave the edge; `heldTownAffinity` is `1` / `share` / `0` on the three candidate shapes; `requiresHold` hides the template from a non-keeper and fails open on an unresolvable template
- [ ] Generated small world on `cells`: claim through the review lever → `position_opened` with the Realm → the keeper receives a Realm faction candidate (a class-scoped `FACTION_ENCOUNTER_META` row) within `N` ticks → the Keeper's Petition is offered to the keeper and not to a stranger in the same town → collapse the hold → `position_closed`, membership present at its earned reputation
- [ ] **The decayed-*stranger* arm, falsified not asserted:** set the keeper's realm `reputation` below `REALM_RANK_THRESHOLDS.subject` with the hold still live → the court's general rows (`court_summons` etc.) are **not** supplied, the two town-keeper rows **are** (through the `requiresHold` arm), and a non-keeper at *stranger* receives neither
- [ ] **The term is not vacuous:** on seeds 42 and 99, 150 ticks, the census reports `heldTownAffinity`'s distribution across board candidates with p25 ≠ p75 for keepers, and `0` for every non-keeper
- [ ] Two town-keeper encounters through the factory line, `check:encounter` green, live proof reaching both, `#town_keeper` seated
- [ ] Sheet hold line — Playwright four-part evidence at 1920×1080; Laws 13/14, 21, 33, 56 cited
- [ ] UL hold entry corrected and extended; rulebook sentence; canon paragraph; wiki paragraph; `check:wiki-freshness:blocking` green; four interface contracts registered
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`; 30-tick CLI smoke; `npm run test:heavy` locally
- [ ] Closing commit body and PR body include `Fixes THR-1448`

## Kill criteria

- The affinity term's p25 equals its p75 for keepers on both seeds → the term is vacuous; check that candidates carry `targetNodeId` for Location cells before touching the weight.
- Keepers stop doing anything but hold-work → `HELD_TOWN_AFFINITY_WEIGHT` halves before the share moves.
- A stance ever moves the political border → the plan wrote to `controls` or the projection reads stances; revert that, never the projection's filter.
- `rank` appears in a write from this plan → wrong authority; write `reputation`.

## Coordination block

**Suggested model:** opus — the board term and the fail-open gate are judgment seams; the sheet line is mechanical.
**Parallel-safe with:** [THR-1479](https://linear.app/threadbare/issue/THR-1479) (appointments — its filter runs before `scoreUnifiedBoard` and it does not edit `computeTemperamentWeight`, `encounterFilterPipeline.ts` or `strategicActionLifecycle.ts`), [THR-1348](https://linear.app/threadbare/issue/THR-1348) (tier pull — `ambitionAssignment.ts`, `ambitionTick.ts`, `npcGraduation.ts`; disjoint), [THR-790](https://linear.app/threadbare/issue/THR-790) (traits — disjoint).
**Mutex with:** any ticket editing `src/engine/decisionBoard.ts` (`computeTemperamentWeight`) or `src/engine/strategicActionLifecycle.ts` — none queued at handoff; THR-1348 only if its executor lands `forge_legend`'s cell edit in the same ambition template this plan's town-keeper content touches (it does not — no ambition template is edited here).
**Files to touch:** `src/engine/holdStanding.ts` (new), `src/engine/strategicActionLifecycle.ts` (standing write + reconciliation), `src/engine/decisionBoard.ts` (`computeTemperamentWeight` term), `src/engine/encounterFilterPipeline.ts` (`requiresHold`), `src/engine/factionQuestGeneration.ts` (the `requiresHold` supply arm), `src/data/realm-content.ts` (the `encounterAccess` docblock correction), `src/engine/agentDetail.ts` (card fields), `src/components/Game/tabs/OverviewTab.tsx` (hold line), `src/types/unifiedAction.ts` (`requiresHold`), `src/types/trace.ts` (+ three sites), `src/data/strategic-action-constants.ts` (five constants), `src/data/faction-encounter-content.ts` (two meta rows), `src/data/encounters/<two town-keeper files>` (factory output), `src/data/content-tags.ts` (`#town_keeper`), `src/debug-bridge.ts` + `.d.ts`, `scripts/cli.ts`, `scripts/interface-contracts.ts`, `.claude/skills/encounter-pipeline/agents/systems-prompt.md`, `Docs/ubiquitous-language/Agents.md`, `Docs/canon/{rulebook.md,undertakings.md}`, wiki page per manifest; tests: `src/engine/__tests__/holdStanding.test.ts` (new), a generated-world test beside `controlRenewal.test.ts`, `decisionBoard.test.ts` (the spread), `encounterFilterPipeline` gate test, `OverviewTab` hold-line test.

## Notes for the executor

- **The standing is a reading.** Do not add a field to `StrategicControlState` or a property to the `controls` edge. Two sources of truth for "whose keeper is this" is the THR-1211 shape.
- **Write `reputation`, never `rank`.** `rank` is a derived cache with disagreeing writers; `getDerivedMembershipRank` is the reader everyone uses.
- **Use the projection, not `getLocationHolder`.** The point reader filters to faction sources and excludes stances by name; a claimed town has no faction edge. `hexRealmId` answers the ground.
- **The term goes on `computeTemperamentWeight`.** Not on `desireMultiplier`, not as a bridge constant. Measure its spread in the same PR — the Done-when says p25 ≠ p75, and it means it.
- **Supply and gate are two different doors.** `FACTION_ENCOUNTER_META.minRank` reaches only the filter's rank gate (senior/elite quest types); *what a member is offered at all* is `getAccessibleTemplates`' `encounterAccess` prefix allowlist, and at *stranger* that list is empty. The `requiresHold` supply arm is what makes keeper content reach a faded keeper; without it the plan's Q5 story dead-ends. Do not trust the `realm-content.ts:275` docblock that says `encounterAccess` is read by nobody — log the impediment, fix the docblock.
- **`computeTemperamentWeight` takes no candidate today** (`decisionBoard.ts:400-404`: template, reach, `ambitionNamesThisKind`, `grievanceHeat01 = 0`). Add `heldTownAffinity = 0` as a defaulted parameter on the `grievanceHeat01` pattern and compute it at the call site (`:506-508`), where the candidate is in scope — do not reach for the candidate inside the function.
- **The gate fails open.** Copy the `requiredReputationWith` block's convention (`encounterFilterPipeline.ts:396-407`) including its reason comment. A gate that hides content must never empty a pool on a lookup miss.
- **`position` is the divine court's word.** The player reads *subject* and *keeps X for Y*; the trace member is `position_opened` because it is agent-facing. Do not put *position* on a surface.
- **The membership outlives the hold.** Do not retire it on collapse or seize; the reactive loop already handles the seize's grievance.
- **The wiki gate will fire** (`strategicActionLifecycle.ts`, `decisionBoard.ts` are in page sources). Update; do not exempt.
- **Do not build the tier pull.** THR-1348 is a sibling plan; a hold may become a reason to pull a keeper into the spotlight later, and that is its ticket, not this one.

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-21): Revise** — impact class corrected upward to **External** (the systems-prompt edit changes what the factory's agents author; the board term changes every keeper's live behaviour). One VIOLATION (NFP): the seed `0.35` derived to *yeoman* against its own *subject* purpose line; and the standing-first resolution order contradicted the ground thesis. Fixed: seed `0.2`; Q1 ground-only with the standing≠ground fail-soft row; the decay-while-live behaviour stated; counts refreshed; proposal impact class recorded.

**Run 2 (fable, cold, 2026-09-21): Revise** — one VIOLATION (wiring): the plan claimed town-keeper content "never fades", but `generateFactionQuestCandidates` → `getAccessibleTemplates` filters by `REALM_RANK_ACCESS` prefixes and `stranger: []` supplies nothing. Fixed by option (b): the `requiresHold` supply arm (wiring row, Files-to-touch, a fourth contract, "supply needs no change" retracted), the two template ids named with the `encounter.realm.` prefix, a decayed-*stranger* falsification arm in the Done-when, UL / rulebook sentences softened to *opens a standing at subject; climbs or fades by the court's work*, executor notes on the `encounterAccess` docblock lie and the `computeTemperamentWeight` parameter pattern.

**Run 3 (fable, cold, 2026-09-21): Allow** — nine dimensions PASS, two GAPs (a residual "supply needs no change" in one substrate row; `questTemplateIds` named where the live supply walks `FACTION_ENCOUNTER_META`; three→four contract count), all fixed in this revision. The run-2 VIOLATION confirmed closed against source.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-21 (sonnet, three auditors spawned in one message, on the run-2 revision). The run-3 revision added the supply-arm wiring row and a fourth contract, which strengthens the pillar audit's wiring finding rather than altering it; no NFP or Vision premise moved.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | five named constants; grip bands are a table, not inline literals |
| 2. Inspectability | PASS | `position_opened` / `position_closed` with `realmNodeId` / `membershipMinted`; `boardTop[].heldTownAffinity`; `__DEBUG.getHoldStanding()`; CLI `hold`; wiring table maps every module to a debug-visibility column |
| 3. Determinism | PASS | "PRNG callouts: None. `joinFaction` draws nothing"; the standing is a pure read; the board term is a threshold on object identity |
| 4. Fail-soft | PASS | ten-row table (wilds, dissolved Realm, decayed reputation, stale projection, unresolvable `requiresHold` fails open, missing `targetNodeId` → affinity 0) |
| 5. Narrative over mechanical | PASS | "the membership outlives the hold — a court remembers its keeper"; fading reputation framed as story |
| 6. Additive over destructive | PASS | no field on `StrategicControlState`, no property on `controls`, `rank` never written; "What does not change" names every untouched subsystem |
| 7. Performance budget | PASS | reuses the cached realm projection; two edge scans per mortal; an id comparison per candidate |

**NFP AUDIT: PASS.**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design (Q1–Q5), graph nodes/edges, tick phases, resolution logic, PRNG callouts with concrete module/line references |
| Content | present-and-substantive | two factory-line templates, prose table entry, constants + UL/rulebook/canon/wiki; Attachment content correctly N/A |
| UI | present-and-substantive | player-facing display, notifications, debug, visual presence (N/A with rationale), Playwright DOM named |

No missing required sections. Wiring table maps every module to phase / component / field / trace / debug. Substrate check: five subsystems, all 🟢 ACTIVE; every row *reads* or *extends*; no green-field duplication. **PILLAR AUDIT: PASS.**

### Vision audit

`00-north-star.md` → witnessed consequence — confirmed: the god "appoints nobody and can only nudge the keeper's encounters". `02-non-negotiables.md` #1 (no direct control), #3 (words not numbers: *firm / slipping / failing*), #4 (graph edges: reuses `member_of`, refuses a new type or property-bag field), #6 (additive), #7 (three pillars) — all confirmed. `03-design-tensions.md` Tension 2 (emergence vs authored moments) — extended: a systemic board term paired with two factory-authored encounters. `taste-profile.md` — graph edges not property bags; numbers kept off the UI; *position* kept off surfaces. No contradictions. **VISION AUDIT: PASS.**
