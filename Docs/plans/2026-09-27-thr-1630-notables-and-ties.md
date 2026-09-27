> **title:** Someone who wants something in every settlement, and people tied to each other at game start — THR-1630
> **linear_issue:** THR-1630
> **author:** Claude Code (design lane, run 2026-09-27d)
> **created:** 2026-09-27
> **three_pillars:** Engine `done` · Content `done — no new encounter prose; one bond-word vocabulary, tooltip copy for three bond words and the notable marker, and a kin row in the backstory tables` · UI `done — the sheet's Relationships section names the bond, the settlement page names its notable and what they hold and quarrel over, the Notables panel shows local agendas`

# Someone who wants something in every settlement, and people tied to each other — THR-1630

*A new world opens with 42 of 47 settlements (seed 42) holding nobody who wants anything, and with no two people who live in the same place tied to each other. This plan seeds one notable per settlement with a holding, an old quarrel and a secret or favour, and gives every named hero a kin, a friend and a rival among their neighbours, all on edges that systems already read, inside the tick budget.*

## Why this is load-bearing

The living-world map ([A world that starts alive](https://linear.app/threadbare/issue/THR-1589)) found that the world *warms up*. By tick 150 most settlements have a story, but **the first minutes, the ones a new player judges the game by, are the emptiest** (audit § 1.2). The two biggest gaps it ranked (§ 1.6, gaps 1 and 2) are this plan: settlements with no story, and no social web. The map's tick-budget research ruled out the obvious fix, adding more deciding mortals. So liveness has to come from **notables and edges**, which cost nothing per tick unless something new reads them every tick.

This is carve-up plan 1 of 7. It unblocks [a world with a past](https://linear.app/threadbare/issue/THR-1631), whose dead notables and past wars want living kin to grieve them (`routeGriefToBonds` passes a killing to a tied heir only if the tie exists).

**Settled input, not reopened here.** Each item was resolved by `tb-orchestrator` T1.5 on 2026-09-25, more than 48 hours before this plan, and none was vetoed.

- [Story in every settlement](https://linear.app/threadbare/issue/THR-1593): promote one *existing* resident per settlement to notable. The t0 package is a holding, an `old_quarrel`, and one secret or favour tied to a decider. No ambition at t0. A local slot in notable agendas. One per settlement is free; two breaks the budget.
- [The people web](https://linear.app/threadbare/issue/THR-1594): each named hero gets one kin, one friend and one rival among co-residents, both directions, replacing the random worldwide pass. Also a favour inside their faction, secrets at 0.33 per protagonist, and 0.2 home-Realm standing. Seeded ties are stamped `origin:'worldgen'` and never count toward graduation.
- [What liveness costs](https://linear.app/threadbare/issue/THR-1592): the budget line is +10% steady-state tick cost against a same-session baseline, with deciders at t200 within +10%.
- Standing rulings from the map: counts are named constants; same seed, same world; starting quarrels are `old_quarrel` rivalry, never grudge ([THR-1383](https://linear.app/threadbare/issue/THR-1383)); no new deciding protagonists ([THR-1437](https://linear.app/threadbare/issue/THR-1437)); attention follows ambition and the deciding headcount is not widened ([THR-1348](https://linear.app/threadbare/issue/THR-1348)).

**Decided in this plan by the design lane under delegation** (process.md rule 4: the *how* of an agreed outcome). Each is marked *Lane decision* where it appears, and each can be vetoed in chat:

1. **The bond words settle on `kin`** (§ S1c). `lineage`, `heir` and `exile_kin` read as kin, and `enemy` reads as rivalry, through one alias table.
2. **Graduation into the deciding tier goes through the THR-1348 budget** (§ S3). It closes the bypass rather than bounding it with a second cap.
3. **The home-Realm standing re-points the membership THR-1620 already writes**, in a post-pass (§ S1d).
4. **The random tie pass keeps its dice rolls and stops writing** (§ S1a), so the rest of the seeded world does not shift.
5. **Local agendas target the notable's own quarrel, holding and settlement** (§ S2c).
6. **Master and apprentice are deferred** (§ Out of scope).
7. **Seeded ties reach ambitions at the first re-evaluation, not at t0** (§ S1e).

**Words.** A *decider* is a spotlight mortal, one that runs the decision loop (`isAutonomousDecisionActor`). A *protagonist* is a named hero seeded at worldgen (`ind_*`), a subset of the deciders. A *notable* is a mortal at `spotlightTier: 'notable'` (UL § Spotlight tier). The notable-agenda system's own word "notable" today means *faction leader* (`listNotables` reads leaders only). This plan keeps that meaning for the existing families and calls the new ones **local agendas**.

## Re-measured on current `main` (2026-09-27, `2bebc045`)

The decisions are two days old and the ticket names code that has moved since, so every code claim was re-read and a tick-0 census taken. Medium map, seeds 42 and 99, `initializeGameState` as the CLI runs it.

| Measure | seed 42 | seed 99 |
|---|---|---|
| Settlements (capital / city / town / hamlet / camp / farmland) | 47 (4/8/9/17/8/1) | 67 (3/7/16/28/12/1) |
| Deciders · protagonists | 20 · 14 | 23 · 17 |
| Deciders living in a settlement · settlements with a decider | **10 · 8** | **14 · 13** |
| Notables | **0** | **0** |
| Person-to-person `relates_to` (friendship / rivalry) | 21 (9/12) | 37 (15/22) |
| …of which mutual (both directions) · between co-residents | **0 · 0** | **0 · 0** |
| `hostile_to` (all `old_quarrel`) | 10 (5 pairs) | 18 (9 pairs) |
| `knows_secret_of` · `owes_favor` · `owns` | 1 · 0 · 5 | 3 · 0 · 8 |
| Ambient residents per settlement (min / median / max) | 3 / 6 / 20 | 3 / 6 / 20 |
| Protagonists with a faction membership | 11 of 14 | 15 of 17 |

**What this corrects in the settled input** (not a reopening: each is a fact about the code, and the decisions stand):

1. **`MAX_ACTIVE_LOCAL_AGENDAS` does not exist.** It was the research's proposed name. The only cap is the worldwide `MAX_ACTIVE_NOTABLE_AGENDAS = 7` (`notable-agenda-config.ts`). This plan adds it.
2. **There are five agenda families, not three:** `campaign`, `claim`, `feud`, `rite`, `succession` (`src/data/notable-agendas/`). The decision already restricted local agendas to three of them.
3. **THR-1620 shipped, but to a random Realm.** Protagonists' `member_of` now carries `reputation = SEEDED_PROTAGONIST_MEMBERSHIP_REPUTATION` (0.2, `strategic-action-constants.ts:269`) and a `factionDefId`. The Realm is still `pickRandom(rng, factionIds)` (`worldSeed.ts:1671-1699`), not the protagonist's home. The "home Realm" half of THR-1594 is therefore still open (§ S1d).
4. **Only half the deciders live in a settlement** (10 of 20 · 14 of 23). The rest sit at towers, ruins and roadside places, because protagonists are placed over every Location (`worldSeed.ts:1629`). THR-1594's fallback (nearest settlement of the same culture, within 6 hexes) is load-bearing, not an edge case.
5. **No production writer writes `kin`, `lineage`, `heir`, `spouse` or `romantic`**, and the worldgen ambition snapshot passes `bonds: []` (`worldSeed.ts:1771`), so even the ties that exist never reach ambition selection at t0.
6. **The graduation bypass is large.** Over 200 ticks on seed 42, spotlight grew 19 → 47 and notable 0 → 63 (births contribute; not attributed). `phaseNpcGraduation`'s notable→spotlight arm (`npcGraduation.ts:405-428`) promotes on importance ≥ 25 and ≥ 3 `relates_to` edges of any kind, with no budget check.
7. **`pullHolderIntoSpotlight` cannot be reused as-is.** It exits without a strategic ambition template id (`spotlightPull.ts:537-538`). Its budget pieces (`rankedDemotionCandidates`, `countOverflowPulls`, `overflowAllowance`) are exported and compose.

## Substrate inventory

Grepped `Docs/canon/systems-inventory.md` for worldgen, notable, agenda, graduation, spotlight, relationship, secret, favour, holding and grievance. Every system this plan touches exists. Nothing here is green-field.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Worldgen: living-world seeding**: `seedLivingWorld.ts` (W1–W7 passes, `WORLDGEN_LIVING_PRIMES`) | 🟢 ACTIVE | **extends** with three passes (ties, home standing, notables), inserted in order (§ Tick phases) |
| **Worldgen: seed world**: `worldSeed.ts` inter-actor block (`:1823-1842`), membership block (`:1671-1699`), ambition snapshot (`:1771`) | 🟢 ACTIVE | **extends**: the random tie block keeps its dice and skips its write under a flag; the snapshot reads real bonds |
| **Agent Lifecycle / NPC tiers**: `npcGraduation.ts` (`hydrateToTier`, `phaseNpcGraduation`) | 🟢 ACTIVE | **extends**: seeded ties are excluded from the edge count, and notable→spotlight goes through the budget |
| **Attention: spotlight pull**: `spotlightPull.ts` (THR-1348, THR-1523) | 🟢 ACTIVE | **extends**: a second caller of the same budget, recorded in the same ledger |
| **Notable agendas**: `notableAgendas.ts`, `NotablesPanel.tsx` | 🟢 ACTIVE | **extends**: a local roster under its own cap |
| **Secrets & Favors**: `strategicGraphOps.mintLeverageMark`, `secretGeneration.createFavorEdge`, `phaseSecretsFavors` | 🟠 DORMANT per the interface map (writers live, t0 supply ~0) | **activates** by seeding supply; no new mechanism |
| **Holdings**: `holdings.ts grantHolding` | 🟢 ACTIVE | **extends**: a new caller; single-writer rule kept |
| **Grievance**: `grudgeEdge.writeGrudge` (`'old_quarrel'`) | 🟢 ACTIVE | **extends**: a new caller; `old_quarrel` stays outside `GRUDGE_PROVENANCE` |
| **Ambitions**: `ambitionSelection.ts` bondModifiers, `graphConditions.ts` `agent_has_bonds` | 🟢 ACTIVE | **extends**: one bond-basis reader with an alias table |
| **Factions**: `factionMembership.joinFaction`, `controls` edges | 🟢 ACTIVE | **extends**: home-Realm re-point; notables join the holder of their settlement |

**Population counts consumed (runtime, above):** 47 · 67 settlements, each with ≥ 3 ambient residents; 14 · 17 protagonists; 11 · 15 protagonist memberships; 20 · 23 deciders.

## Interface impact

Worldgen and Agent Lifecycle are ⚪ UNAUDITED in `Docs/canon/interface-map.md`. This plan touches them, so it writes their rows (protocol § 4). The executor registers each `add` row in `scripts/interface-contracts.ts` in the slice that ships it.

| Contract | Action | Producer → consumer (production read site) |
|---|---|---|
| `worldgen-seeds-the-living-world` | **extend** | adds the ties, home-standing and notables passes to the existing row's `writeSites` |
| `strategic-ambition-pulls-holder-into-spotlight` | **extend** | graduation becomes a second, budgeted caller; `readSpotlightLedger` counts it |
| `worldgen-ties-reach-ambition-and-grief` (**add**) | add | `seedLivingWorld.seedTies` → `ambitionSelection` bondModifiers via `bondBasis`, `grievanceLifecycle.findHeir`, `undertakingOutcomeNode.routeGriefToBonds`, `binder.computeStoryTies`, `BondsTab` Relationships |
| `seeded-ties-never-graduate` (**add**) | add | `origin:'worldgen'` on `relates_to` → `npcGraduation.phaseNpcGraduation` edge count |
| `seeded-notable-holds-a-local-agenda` (**add**) | add | `seedLivingWorld.seedNotables` → `notableAgendas.listLocalNotables` → `NotablesPanel`, chronicle beats |
| `seeded-notable-reaches-the-settlement-page` (**add**) | add | `seedNotables` writes → `settlementNotable.getSettlementNotable` → `LocationView` Inhabitants |
| `agent-grudge-reaches-the-mortal-sheet`, `holdings-single-writer-owns-edge`, `secrets-generation` | **preserve** | new callers of unchanged writers |

## Engine pillar

Four slices (§ Slicing). S1 is this ticket. The others are filed as their own tickets.

### S1 — The people web (named heroes) and one word for kin

**(a) Stop the random worldwide pass without moving the world.** The block at `worldSeed.ts:1823-1842` draws from the shared worldgen stream `rng = mulberry32(seed + 7919)`, which every later worldgen step also draws from. Deleting it would shift every later draw and change the whole seeded world, not just its ties. *Lane decision:* behind `WORLDGEN_RANDOM_PROTAGONIST_TIES_ENABLED` (default `false`), the block **keeps consuming exactly the same draws** (the `< 0.3` test, the sentiment draw and the strength draw) and **skips `graph.addEdge`**. The rest of worldgen stays byte-identical, so every before/after difference in S1's census is caused by S1. Name its three inline numbers while there (`WORLDGEN_RANDOM_TIE_CHANCE = 0.3`, and so on); NFP #1.

**(b) `seedTies`: a new pass in `seedLivingWorld`,** run **before** `quarrels` so that deep seeded rivalries still become `old_quarrel` pairs through the existing `seedQuarrels` (sentiment ≤ `WORLDGEN_QUARREL_SENTIMENT_MAX`, −0.6).

For each protagonist, in id order:

1. **Home.** `homeLocationOf` (already in the file), resolved up to its settlement. If the protagonist does not live in a settlement, the **tie pool** is the nearest settlement of the same culture within `WORLDGEN_TIE_FALLBACK_MAX_HEXES` (6), by hex distance, ties broken by id. No such settlement → the protagonist gets no ties, and the trace says so.
2. **Candidates.** Individuals resident in the pool (`located_at` the settlement or any of its Places), excluding the protagonist, other protagonists already tied to them, and monsters. Protagonists count as candidates, so two heroes who share a home tie to each other first.
3. **Picks.** One kin, one friend, one rival, each drawn from the remaining candidates with the pass's reserved stream (`WORLDGEN_LIVING_PRIMES`, the next unused prime, `mulberry32(seed + prime)`). A draw over a candidate list sorted by id is deterministic (NFP #3). A pool too small for all three fills kin, then rival, then friend (a rival is the tie most systems read).
4. **Write.** `relates_to` in **both directions** (most readers read outgoing edges only), each with `origin: 'worldgen'`:

   | Tie | `basis` | `sentiment` | `strength` | `trust` |
   |---|---|---|---|---|
   | kin | `kin` | `WORLDGEN_KIN_SENTIMENT` (0.5) | `WORLDGEN_KIN_STRENGTH` (0.8) | sentiment × 0.5, as today |
   | friend | `friendship` | draw in `WORLDGEN_FRIEND_SENTIMENT_RANGE` [0.3, 0.8] | 0.3 + draw × 0.5, as today | sentiment × 0.5 |
   | rival | `rivalry` | draw in `WORLDGEN_RIVAL_SENTIMENT_RANGE` [−0.8, −0.3] | 0.3 + draw × 0.5 | sentiment × 0.5 |

   Both directions carry the same values. Edge ids are `edge_tie_<a>_<b>_<basis>`, deterministic and unique.

**Expected:** about 2.6× today's person-to-person edges (THR-1594: ~76 · 88 against 29 · 35 measured then). It is inside THR-1592's ≤ 4% envelope *because* of (c) below.

**(c) Seeded ties never make a decider.** In `phaseNpcGraduation`'s notable→spotlight arm, count only `relates_to` edges whose `properties.origin !== 'worldgen'`. This is THR-1592's condition: dense ties crossing `SPOTLIGHT_MIN_EDGES` cost +87–115%. `complicationEffects` already writes `origin: 'complication'` (precedent). Earned ties still count.

**(d) One word for kin.** *Lane decision:* `kin` is canonical. It is the word the ambition modifiers already use (`bondModifiers`, `ambition-templates.ts:1523`), it is plain English, and "lineage" reads as a descent line rather than a person. A new `src/data/bond-basis.ts` holds:

- `CANONICAL_BOND_BASES`: the words a writer may stamp, starting with the ones written today plus `kin`.
- `BOND_BASIS_ALIASES`: `lineage → kin`, `heir → kin`, `exile_kin → kin`, `enemy → rivalry`, `mentor → mentorship`, `trade_partner → trade`, `spouse → romantic`.
- `bondBasisMatches(written, wanted)`: both sides normalised through the aliases.

Every reader that matches `basis` by string goes through it: `graphConditions.ts:291-294` (`agent_has_bonds`), `ambitionSelection.ts:106-107` (bondModifiers), `returnEngine.ts:325` (`romantic`), and the backstory prose tables' basis lookup. No authored template changes: `lineage` in `ambition-templates.ts:554` now matches seeded `kin`. `romantic` stays unwritten. Lovers are not seeded (THR-1594, § Out of scope), and the alias table only guarantees that when a writer arrives, `spouse` and `romantic` mean the same thing.

**(e) Ties reach ambitions at the first re-evaluation, not at t0.** `worldSeed.ts:1771` passes `bonds: []` to the initial-ambition snapshot, and `seedTies` runs after that snapshot (`seedLivingWorld` is the tail of `seedWorld`, `:2068`), so there is nothing to pass at that moment. *Lane decision:* leave the t0 assignment alone. The runtime path already reads bonds: `ambitionTick.ts:177-179` builds `bonds` from `relates_to.basis` at every ambition re-evaluation, and (d) makes those words match. Re-scoring at worldgen would mean removing ambitions `assignAmbitionToActor` has already written and firing the THR-1348 pull hook twice. That buys a few dozen ticks of earlier effect at the cost of a destructive path (NFP #6). The S1 gate checks that bond modifiers fire by t200.

**(f) Home-Realm standing, and favours and secrets.**

- **Home standing.** *Lane decision:* a post-pass (`seedHomeStanding`) re-points each protagonist's existing worldgen `member_of`, rather than editing the draw at `:1671-1699`, which would shift the shared stream. If the protagonist's home settlement (or tie-pool settlement) is held by a Realm through `controls`, **and** that Realm differs from the one drawn, the pass moves the membership to the home Realm: remove the drawn edge, `joinFaction` the home Realm, and write `reputation = SEEDED_PROTAGONIST_MEMBERSHIP_REPUTATION` (0.2, rank *subject*, THR-1448's seed) and its `factionDefId`. An unheld home keeps the drawn membership. The trace names every move.
- **Favours.** `WORLDGEN_FAVORS_PER_FACTION_PROTAGONIST` (1). Each protagonist with a membership owes a favour to the fellow member of that faction with the highest `member_of.reputation`, nearest home as the tiebreak, then id. It is written with `createFavorEdge(debtor, creditor, WORLDGEN_FAVOR_MAGNITUDE 0.5, 'worldgen', 0, graph)`, plus a friendship `relates_to` pair with `origin: 'worldgen'` if none exists, because `phaseSecretsFavors` tension drift needs a positive tie. An unpaid favour starts souring after 30 ticks and is forgiven at tick 81 (`FAVOR_MAX_AGE_TICKS`). It is an early-game hook, as THR-1594 says.
- **Secrets.** `seedMarks` changes from per culture to per protagonist: `WORLDGEN_MARKS_PER_PROTAGONIST` (0.33), floored, at least 1 when any culture has two protagonists. Selection is unchanged (highest Shadow holds, highest Eye is the subject), taken in rounds per culture until the count is met. Magnitude stays at or above `SECRET_DECAY_THRESHOLD`. `WORLDGEN_SEEDED_MARKS_PER_CULTURE` is kept as the per-culture ceiling.

**S1 gate (after), seeds 42 and 99, medium, t0:**

- co-resident tied pairs ≥ `WORLDGEN_TIES_MIN_PER_PROTAGONIST` (2) × protagonists with a pool;
- every seeded tie is mutual and carries `origin:'worldgen'`;
- `owes_favor` ≥ 1 per protagonist with a membership;
- `knows_secret_of` ≥ floor(0.33 × protagonists);
- no protagonist membership points at a Realm other than its home, where the home is held.

Over 200 ticks: steady-state ms/tick t21–200 within +10% of a same-session baseline, deciders at t200 within +10%, and at least one ambition re-evaluation on each seed scores a non-empty `bonds` list containing a seeded basis (read from the ambition re-evaluation trace the executor finds at `ambitionTick.ts`; if that trace does not carry bonds, add a `bondsMatched` count to it).

### S2 — One notable in every settlement

**(a) `seedNotables`, a new pass in `seedLivingWorld`, after `marks` and before `garrisons`.** For each settlement (`getLocationNodes`, settlement classes only), in id order, `NOTABLES_PER_SETTLEMENT` (1) per class. The per-class constants THR-1593 named (`NOTABLES_PER_HAMLET` and the rest) are kept as a table defaulting to 1 everywhere. City and capital stay at 1 until re-measured (two per settlement cost +12–13%).

1. **Pick the resident.** Ambient individuals resident in the settlement or its Places, non-monster, not garrison, sorted by `ROLE_WEALTH` of their `npcRole` (descending), then id. Take the first. There is no draw, following `seedLivingWorld`'s sort-not-draw convention. The wealthiest role is the one most plausibly *holding* something.
2. **Promote.** `hydrateToTier(graph, id, 'notable', rng)` with the pass's reserved stream, and stamp `notableOrigin: 'worldgen'` (the local-agenda roster reads it).
3. **Holding.** `grantHolding` on a Place in the settlement that has no owner, preferring commerce, then authority, then any. No free Place → no holding; the trace says so.
4. **Quarrel.** `writeGrudge(graph, notable, partner, 0, 'old_quarrel')`. The partner is the nearest decider within `WORLDGEN_NOTABLE_QUARREL_MAX_HEXES` (8). Failing that, it is the notable of the nearest other settlement already seeded (so a hamlet far from any hero quarrels with its neighbour's notable). Failing both, there is no quarrel. `old_quarrel` stays outside `GRUDGE_PROVENANCE`, so the motive gate reads rivalry, never grudge (THR-1383).
5. **Secret or favour with a decider.** The nearest decider (by hex, then id) within `WORLDGEN_NOTABLE_TIE_MAX_HEXES` (12), preferring a decider other than the quarrel partner. Settlements alternate by their sorted index: even-indexed ones get `mintLeverageMark(graph, notable, decider, 'worldgen', 0.5, 0)` (the notable knows something about the hero), odd-indexed ones get `createFavorEdge(decider, notable, 0.5, 'worldgen', 0, graph)` (the hero owes the notable). The binder's story-tie term (+0.25) then casts the notable in that decider's scenes.
6. **Faction.** If the settlement is held (`controls`) by a faction, `joinFaction(notable, holder)`.
7. **No ambition** at t0. 0 of 10 ambition templates pass eligibility for a hydrated notable (THR-1593 § 2).
8. **No `relates_to`** in the package. Importance stays 0 and graduation is not triggered by seeding.

**(b) Graduation stays honest:** S3 below.

**(c) Local agendas.** *Lane decision on targets.* `notableAgendas.ts` gains `listLocalNotables(graph)`: individuals at `spotlightTier: 'notable'` with `notableOrigin: 'worldgen'`, alive, not faction leaders (who are already in `listNotables`). They are ranked by the existing proximity weight to the watched avatar, like the leader roster. They launch under their own cap, `MAX_ACTIVE_LOCAL_AGENDAS` (3), counted separately from `MAX_ACTIVE_NOTABLE_AGENDAS` (7), on the same roster cadence (`NOTABLE_AGENDA_ROSTER_INTERVAL_TICKS`, 12) and cooldown. Only three families apply, and each targets the notable's own seeded story, never the nearest faction's:

| Family | Local target | If the target is missing |
|---|---|---|
| `feud` | the quarrel partner (the `hostile_to` `old_quarrel` edge) | family skipped for this notable |
| `claim` | a Place owned by the quarrel partner, else an unowned Place in a neighbouring settlement | skipped |
| `rite` | the notable's own settlement | always resolves |

The family is still picked by the existing `rng()` over the families whose target resolves, on the existing stream. Phases, counters, stall and failure run through the unchanged state machine. `campaign` and `succession` stay leader-only.

**S2 gate, seeds 42 and 99:**

- settlements with no resident holding an ambition, quarrel, secret or favour at t0 = **0** (from 42/47 · 58/67; the audit's reader);
- notables at t0 = settlement count;
- by t150, ≥ 1 local agenda has launched on each seed;
- 200-tick ms/tick within +10% of a same-session baseline;
- deciders at t200 within +10%.

### S3 — Graduation into the deciding tier goes through the attention budget

**Before:** `phaseNpcGraduation`'s notable→spotlight arm promotes with no budget. On seed 42, spotlight grew 19 → 47 in 200 ticks. S2 makes the notable tier dense from t0 (47 · 67 notables), so without this slice every seeded notable is a latent decider.

*Lane decision: close, do not bound.* Christian's THR-1348 ruling is that the deciding headcount "is the intended attention budget and is not widened" (UL § Spotlight tier). A second, separate cap for graduation would widen it by a different door. So graduation joins the one budget:

1. When a notable qualifies (importance ≥ `SPOTLIGHT_THRESHOLD`, earned edges ≥ `SPOTLIGHT_MIN_EDGES` per S1c), extract a helper from `pullHolderIntoSpotlight` into `spotlightPull.ts`, `admitToSpotlight(graph, actorId, tick, reason)`. It runs the same three steps without the strategic-template precondition:
   - swap with `rankedDemotionCandidates(...)[0]` if one exists (the same protections: threaded, avatar, commanders, mid-encounter, pulled);
   - otherwise admit as overflow if `countOverflowPulls < overflowAllowance`;
   - otherwise refuse with `'budget'`.
2. `pullHolderIntoSpotlight` calls the helper after its own template check, so there is one budget path with two callers.
3. A refused graduate stays notable and is re-tested at the next graduation check. Nothing is lost.
4. Behind `NOTABLE_GRADUATION_BUDGETED` (default `true`). `false` restores today's behaviour for comparison runs.

**Interaction to measure, not guess.** Holding the deciding population flat will lower late-game decider counts (47 → about 20 on seed 42 by t200). That lowers tick cost, but it also lowers encounter firings. [Let written encounters land](https://linear.app/threadbare/issue/THR-1633)'s gates were measured with the growth in place. S3's PR re-runs `readers/reach.ts` and `readers/attended.ts` on seeds 42 and 99 and reports both. If drawable templates fired falls below THR-1633's floor (121), or The First's longest encounter gap exceeds 30 ticks, the executor ships S3 with the flag `false`, files the numbers on this ticket, and the lane re-decides.

**S3 gate:**

- spotlight count at t200 ≤ t0 count + `overflowAllowance` + threaded + pulled (the THR-1348 invariant, now measurable);
- graduations refused with `'budget'` appear in the ledger;
- `window.__DEBUG.getSpotlightLedger()` names graduation admissions as `reason: 'graduation'`.

### Tick phases

Worldgen order inside `seedLivingWorld` becomes: territory → routes → freeholds → possessions → **ties** → **home standing** → quarrels → marks (per protagonist) → **notables** → garrisons. Ties must precede quarrels, because seeded rivalries become quarrels. Notables must follow marks and quarrels, because their quarrel partner may be a hero. Each new pass runs inside the existing per-pass `run()` try/catch.

Per tick: nothing new every tick. Local agendas ride the existing 12-tick roster scan. Graduation's budget check runs only when a notable qualifies (rare).

### PRNG callouts

- `seedTies` and `seedNotables` (hydration) each take the next unused prime in `WORLDGEN_LIVING_PRIMES` (append primes; never reuse or reorder existing ones).
- `seedHomeStanding`, the favours pass and `seedMarks` draw nothing; they sort.
- The random tie block keeps its draws on `mulberry32(seed + 7919)` (S1a).
- Local agendas use the existing `mulberry32(seed + tick*53)` stream. Graduation's per-actor `rng` is unchanged. No `Math.random()` anywhere.

## Content pillar

No encounter prose is written. The plan's content is vocabulary and one table row:

1. **`src/data/bond-basis.ts`**: the canonical words and the alias table (S1d). It is data, not logic.
2. **Backstory tables** (`backstory-content.ts:298` and its negative twin): add a `kin` row to each by **copying the existing `lineage` lines** under the new key. Keep the `lineage` row, and let the reader resolve through `bondBasisMatches`, so either key finds the lines. Proof: `backstoryResolvers:bondHistoryResolver` renders a line for a seeded kin pair on seed 42.
3. **Display words for bonds** (a new `BOND_BASIS_WORDS` in the same file): `kin → "kin"`, `friendship → "friend"`, `rivalry → "rival"`, `mentorship → "mentor"`, `sworn_ally → "sworn ally"`, and the rest to plain English. A basis with no word renders as no word and warns once (Law 14).
4. **Tooltips** (Law 17, ≤ 200 characters, plain register), registered under the existing `agent.*` prefix:
   - `agent.bond.kin`: "Family. Kin grieve each other's deaths and inherit each other's grudges."
   - `agent.bond.friendship`: "Someone this person trusts. Friends are drawn into each other's troubles."
   - `agent.bond.rivalry`: "Someone this person resents. A deep rivalry can become an old quarrel."
   - `agent.notable`: "A local figure who holds something here, has an old quarrel, and wants something. They act on it now and then."
5. **Local agenda beats** reuse the existing family prose (`src/data/notable-agendas/`). The target sentence names the quarrel partner or Place through the existing enrichment. No new lines.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces). No WebGL change.*

Law checks for every surface below: 1 (image, tooltip, link), 8 (person imagery gated), 13/14 (no numerals, no keys), 16 (sentences, not key:value), 17 (tooltip registry), 21 (every name routes through `useRefRouter`), 33 (one viewport), 36 (long lists grouped), 42 (plain register).

### Player-facing display

1. **The sheet: Relationships names the bond** (`AgentProfileModal` → `tabs/BondsTab.tsx:211`). Today it shows a name and a trust word, and `topBonds` drops the basis (`agentDetail.ts:1658`). Carry `basis` through `topBonds` and render the bond word before the name as a chip with its `agent.bond.*` tooltip, for example **kin** · Maren Dusk · *trusts deeply*. The name stays clickable. The existing `known`-familiarity gate is unchanged: fog still hides a stranger's family. Seeded and earned ties render the same way (the player does not care where a tie came from).
2. **The settlement page names its notable** (`LocationView.tsx`, Inhabitants, `:1553`). The notable, if alive and resident, is lifted to the top of Inhabitants with a **notable** marker chip (tooltip `agent.notable`) and one sentence built from state, never prose:

   > *Holds* the Tanner's Yard. *At odds with* Kael Thornweaver. *Knows something about* Ysolde Vane.

   Each noun is a link (Place → place card, person → agent surface). A clause whose edge is gone is dropped, and if every clause is gone the sentence is omitted. The sentence reads the graph at render (`owns`, `hostile_to` `old_quarrel`, `knows_secret_of` or `owes_favor`) through one pure selector in a new `src/engine/settlementNotable.ts`, `getSettlementNotable(graph, locationId)`, which returns the notable id and the structured clauses (`{ kind, targetId }[]`, Law 2: the producer declares the concepts). The same selector backs `window.__DEBUG.getSettlementNotable(locationId)`, so the surface cannot drift from state (Law 56's spirit on a non-chip surface). The secret clause shows only if the player could know it: it renders when the player's knowledge of the notable is at `known` or above, otherwise the clause is omitted. The rest of Inhabitants is unchanged.
3. **The Notables panel shows local agendas** (`NotablesPanel.tsx`, `buildNotableAgendaRows`). Rows gain a group split. Two `Section`s, **Rulers** (the existing leader agendas) and **Local** (the new ones), each with its count in the header (Law 36). Row anatomy is unchanged.

### Event notifications

None new. Local agendas emit the existing agenda chronicle beats and crack toast. Seeding writes no chronicle line (the past is [a world with a past](https://linear.app/threadbare/issue/THR-1631)'s job).

### Debug inspection

- The living-world summary is built by `seedLivingWorld` and today only printed (`worldSeed.ts:2081`, `formatLivingWorldSummary`). It gains `ties`, `homeStandingMoves`, `favors`, `notables`, `notablesWithoutHolding`, `notablesWithoutQuarrel`, and its console line prints the counts. The census reader (§ Done when) is the reproducible check. No new state field: the summary is a worldgen report, not game state.
- `window.__DEBUG.getSettlementNotable(locationId)` (S4) returns the selector's output, and is the state assertion for S4's browser evidence.
- `getSpotlightLedger()` gains graduation admissions and refusals (S3).
- The CLI `spotlight` command prints the same.

### Visual presence (HexMapV2)

None new. A promoted notable already gets its map icon from `hexMapAgentVisibility.ts` (THR-1593 § 1). That existing reader is how the player first sees one on the map, and nothing is added.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `seedLivingWorld.seedTies` / `seedHomeStanding` | worldgen (`seedWorld` tail) | `BondsTab` Relationships | graph edges only | living-world summary line (extended) | census reader; `getAgentDetail` bonds |
| `seedLivingWorld.seedNotables` | worldgen | `LocationView` Inhabitants, map icon (existing) | graph (`spotlightTier`, `notableOrigin`) | same summary line | census reader |
| `settlementNotable.getSettlementNotable` | read at render | `LocationView` Inhabitants | — | — | `__DEBUG.getSettlementNotable` |
| `bond-basis.ts` | read by ambition selection (per ambition re-eval), `agent_has_bonds`, backstory | `BondsTab` (words + tooltips) | — | — | — |
| `notableAgendas.listLocalNotables` | notable-agenda phase (every 12 ticks) | `NotablesPanel` Local section | `notableAgendas` state (existing) | existing agenda traces + `local: true` | `NotablesPanel`, `getNotableAgendas` if present |
| `spotlightPull.admitToSpotlight` | `phaseNpcGraduation` + ambition pull | — | spotlight ledger | `spotlight_pull` with `reason` | `getSpotlightLedger`, CLI `spotlight` |

Verify each new module against `Docs/plans/wiring-checklist.md`.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `WORLDGEN_RANDOM_PROTAGONIST_TIES_ENABLED` | `false` | legacy random worldwide tie pass writes edges (its draws are always consumed) |
| `WORLDGEN_RANDOM_TIE_CHANCE` | 0.3 | the legacy pass's pair chance, named |
| `WORLDGEN_KIN_PER_PROTAGONIST` | 1 | kin ties per named hero |
| `WORLDGEN_FRIENDS_PER_PROTAGONIST` | 1 | friend ties per named hero |
| `WORLDGEN_RIVALS_PER_PROTAGONIST` | 1 | rival ties per named hero |
| `WORLDGEN_KIN_SENTIMENT` / `WORLDGEN_KIN_STRENGTH` | 0.5 / 0.8 | a kin tie's warmth and weight |
| `WORLDGEN_FRIEND_SENTIMENT_RANGE` | [0.3, 0.8] | friend warmth |
| `WORLDGEN_RIVAL_SENTIMENT_RANGE` | [−0.8, −0.3] | rival coldness; ≤ −0.6 becomes an old quarrel |
| `WORLDGEN_TIE_FALLBACK_MAX_HEXES` | 6 | how far a hero with no settlement home looks for neighbours |
| `WORLDGEN_TIES_MIN_PER_PROTAGONIST` | 2 | S1 gate floor (test constant) |
| `WORLDGEN_FAVORS_PER_FACTION_PROTAGONIST` | 1 | favours owed inside a hero's faction |
| `WORLDGEN_FAVOR_MAGNITUDE` | 0.5 | seeded favour size |
| `WORLDGEN_MARKS_PER_PROTAGONIST` | 0.33 | seeded secrets per hero (replaces per-culture as the driver) |
| `NOTABLES_PER_SETTLEMENT` (per class: hamlet, camp, farmland, town, city, capital) | 1 each | seeded notables per settlement |
| `WORLDGEN_NOTABLE_QUARREL_MAX_HEXES` | 8 | how far a notable's quarrel reaches for a decider |
| `WORLDGEN_NOTABLE_TIE_MAX_HEXES` | 12 | how far a notable's secret or favour reaches for a decider |
| `WORLDGEN_NOTABLE_MARK_MAGNITUDE` | 0.5 | seeded secret size, ≥ `SECRET_DECAY_THRESHOLD` |
| `MAX_ACTIVE_LOCAL_AGENDAS` | 3 | worldwide cap on live local agendas, separate from the leader cap |
| `NOTABLE_GRADUATION_BUDGETED` | `true` | notable→spotlight goes through the THR-1348 budget |

All worldgen constants live in `worldgen-living-constants.ts` (the `LivingWorldConstants` override bag, so tests can dial them). The agenda cap lives in `notable-agenda-config.ts`, the graduation flag in `agent-behavior-constants.ts`, and the vocabulary in `bond-basis.ts`.

## Tracing

```ts
// Extends the living-world summary seedLivingWorld already builds and logs.
interface LivingWorldSummaryAdditions {
  ties: { kin: number; friendship: number; rivalry: number; protagonistsWithoutPool: string[] };
  homeStandingMoves: Array<{ actorId: string; fromFactionId: string; toFactionId: string }>;
  favors: number;
  notables: number;
  notablesWithoutHolding: string[];   // settlement ids
  notablesWithoutQuarrel: string[];   // settlement ids
}

// spotlight_pull — existing trace, one new reason and one new outcome source.
interface SpotlightPullTraceAdditions {
  reason: 'strategic_ambition' | 'graduation';
  outcome: 'swapped' | 'overflow' | 'refused_budget';
}

// Existing notable-agenda launch trace gains:
interface NotableAgendaLaunchTraceAdditions {
  local: boolean;          // true for the local roster
  targetSource?: 'quarrel' | 'quarrel_holding' | 'neighbour_place' | 'home';
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Hero has no settlement home and none of their culture within 6 hexes | no ties for them; id listed in `protagonistsWithoutPool` |
| Tie pool smaller than three candidates | fill kin, then rival, then friend; fewer ties, no error |
| Home Realm cannot be resolved (unheld, or `controls` missing) | keep the drawn membership |
| Favour creditor missing (sole member of a faction) | no favour for that hero |
| `createFavorEdge` refuses (`MAX_FAVORS_PER_AGENT`) | skip, count not incremented |
| Settlement has no ambient resident | no notable there; listed in the summary (census: min 3, so not expected) |
| No unowned Place for the holding | notable without holding; listed |
| No decider within range and no neighbour notable for the quarrel | notable without quarrel; listed |
| A new pass throws | the existing per-pass `run()` try/catch logs one warning and worldgen continues |
| Local agenda target gone mid-run (partner dead, Place razed) | the existing stall/fail path; `rite` always resolves |
| A basis with no alias and no display word | the matcher compares it literally; the sheet shows no bond word and warns once |
| Budget helper throws during graduation | graduation for that actor skipped this check; retried next check |

## Blast Radius

`src/engine/graph.ts`, `src/types/gameState.ts` and the other ≥ 100-importer files are **not edited**. The plan adds functions, constants and one data file, and edits `worldSeed.ts`, `seedLivingWorld.ts`, `npcGraduation.ts`, `spotlightPull.ts`, `notableAgendas.ts`, `graphConditions.ts`, `ambitionSelection.ts`, `returnEngine.ts`, `agentDetail.ts`, `BondsTab.tsx`, `LocationView.tsx` and `NotablesPanel.tsx`. The executor checks `.codesight/graph.md` for any of these crossing 100 importers at pickup. None did at `2bebc045`.

**Seed-world shift:** S1a keeps the shared stream intact. S1b–f and S2 add edges and tiers, so every seed's t0 graph grows but no existing node moves. Tests pinned to exact t0 relationship counts will need their numbers updated. A test failing on anything else is a real regression.

## Slicing

| Slice | Ticket | Depends on | Scope |
|---|---|---|---|
| S1: the people web and the kin word | **this ticket** | nothing | S1a–f, bond-basis vocabulary, backstory `kin` row, graduation origin filter |
| S2: one notable in every settlement | filed at handoff | S1 (shares `seedLivingWorld` and the origin filter), S3 | `seedNotables`, local agendas |
| S3: graduation joins the attention budget | filed at handoff | S1 (same function in `npcGraduation.ts`) | `admitToSpotlight`, flag, ledger |
| S4: the player sees it | filed at handoff | S1, S2 | sheet bond words, settlement notable line, Notables panel split, tooltips |

S3 must land before S2, because S2 fills the notable tier and S3 is what keeps it from flooding the deciding tier.

## Out of scope

- **Master and apprentice** (THR-1594 proposed a `graduated` `mentors` edge at worldgen). *Lane decision:* deferred. The only `mentors` writer is `bootstrapMentorship`, which writes `'offered'` and hands off to an undertaking. A finished apprenticeship at t0 needs a worldgen writer that the mentorship lane should own, and the map's summary line for this plan does not include it. It can be a follow-on if wanted.
- **Kin among ordinary townsfolk** (`WORLDGEN_AMBIENT_KIN_SHARE`, THR-1594 stage 2): 0 until re-measured, as decided.
- **Lovers, spouses, sworn oaths:** not seeded (THR-1594). The alias table makes `spouse`/`romantic` one word for when a writer comes.
- **Faith fellows:** deferred (THR-1594).
- **Ambitions at t0 for notables:** none, by decision.
- **Rumours:** out of the map's scope.
- **The past** (dead kin, old wars): [a world with a past](https://linear.app/threadbare/issue/THR-1631).

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (vocabulary, one backstory row, tooltips; no encounter prose)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] **The player is a god, not a protagonist.** Nothing here gives the player a verb. It gives the world people who want things and who are tied to one another, which is what the north star's "a handful of mortals they know by name … because they have watched these people *choose* things" needs to exist from minute one rather than hour one.
- [x] **Narrative over mechanics.** A quarrel is `old_quarrel` rivalry, never an unseen grudge (THR-1383). The notable's want is shown as an agenda the player can watch, not a number.
- [x] **All mechanics surface through prose, never numbers.** Bond words, tooltips and a state-built sentence; no magnitudes.
- [x] **Everything is a graph edge.** Every tie, holding, quarrel, secret, favour and membership is an existing edge type. No new node or edge type.
- [x] **Additive over destructive.** The legacy tie pass is flagged off, not deleted; `lineage` keeps working through the alias.

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss).
- [x] No rulebook edit is needed. It changes what the world holds at t0 and enforces an existing attention rule (THR-1348) on a second path. `Docs/canon/rulebook.md` is unchanged. The UL gains one term, **Kin** (a `relates_to` bond of family; aliases `lineage`, `heir`), added to `Docs/ubiquitous-language/Agents.md` in S1's PR through the `ubiquitous-language` skill's proposal workflow (a missing definition for a `relates_to` basis that ambition templates already read, not a contested term). "Local" is a section label in the Notables panel, not a new term.

> Brainstorm companion: `Docs/plans/2026-09-27-thr-1630-notables-and-ties-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every count, range and cap is a named constant (§ Constants); the legacy pass's inline numbers get names |
| 2. Inspectability | PASS | the living-world summary lists every miss by id; `spotlight_pull` names graduation outcomes; agenda traces carry `local` and `targetSource` |
| 3. Determinism | PASS with note | the new passes use reserved primes; the legacy block keeps its draws so the shared stream is unchanged; sorts break ties by id. Seeded worlds gain edges (expected); no existing node moves |
| 4. Fail-soft | PASS | § Fail-soft; each pass sits in the existing per-pass try/catch |
| 5. Narrative over mechanical perfection | PASS | notables' wants come from their own quarrel and holding, not the nearest faction; secrets are fog-gated on the settlement page |
| 6. Additive over destructive | PASS | flags, aliases and new passes; nothing deleted |
| 7. Performance budget | PASS with note | measured budget line (+10% steady-state, deciders ±10%) gates S1 and S2; S3 lowers late-game decider count, and its encounter-reach interaction is measured, with a flag fallback |

## Kill criteria

- **S1 or S2 fails the budget line on both seeds** (+10% steady-state ms/tick against a same-session baseline, or deciders at t200 +10%) → set `NOTABLES_PER_SETTLEMENT` to 0 for hamlets and camps first and re-measure. If ties alone fail it, a seeded `relates_to` without `origin:'worldgen'` is leaking into graduation: find the unstamped writer before tuning anything.
- **S3 regresses reach** (drawable templates fired < 121, or The First's longest encounter gap > 30 ticks) → ship with `NOTABLE_GRADUATION_BUDGETED=false`, post the numbers on this ticket, and the lane re-decides.
- **Settlements with no story at t0 stay above 0 after S2** → the pick or holding step is failing; the summary names the settlements by id.

## Done when

S1 (this ticket):

- [ ] the S1 gate (§ S1) holds on seeds 42 and 99, measured by the living-world summary plus a census reader committed under `Docs/audits/2026-09-25-living-world-data/readers/` (extend `dying.ts`'s pattern), with before/after in the PR body;
- [ ] a test on a **generated** world (heavy lane) proves a seeded kin tie reaches `bondModifiers` (`protect_the_home` scored with a kin bond) and `findHeir`;
- [ ] a test proves seeded ties do not count toward `SPOTLIGHT_MIN_EDGES` and earned ones still do;
- [ ] a test proves `lineage` in `agent_has_bonds` matches a seeded `kin` edge;
- [ ] a test proves the rest of worldgen is unchanged by S1a: with the flag `false`, a node census excluding `relates_to` equals the flag-`true` census on the same seed;
- [ ] the UL gains **Kin**; the interface-map rows `worldgen-ties-reach-ambition-and-grief` and `seeded-ties-never-graduate` are registered;
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build` pass; 30-tick CLI engine smoke;
- [ ] the closing commit body has a line-anchored close keyword for this ticket;
- [ ] `Browser-verify exempt: engine and data only; S1 changes no surface (the bond word ships in S4)`.

## Coordination block

**Suggested model:** opus. Worldgen stream discipline and several readers across ambition, grief and graduation make this a careful-reading slice.

**Parallel-safe with:** [THR-1649](https://linear.app/threadbare/issue/THR-1649) (camera and avatar sight; UI and map only), [THR-1651](https://linear.app/threadbare/issue/THR-1651) (influence pipeline, not worldgen), [THR-1652](https://linear.app/threadbare/issue/THR-1652) (essence upkeep), [THR-1633](https://linear.app/threadbare/issue/THR-1633) (the encounter shortlist, `encounterFilterPipeline.ts`).

**Mutex with:** [THR-1631](https://linear.app/threadbare/issue/THR-1631) and [THR-1632](https://linear.app/threadbare/issue/THR-1632) once they are handed off (both add passes to `seedLivingWorld.ts` and primes to `WORLDGEN_LIVING_PRIMES`), and [THR-1640](https://linear.app/threadbare/issue/THR-1640) (deciders joining guilds; both touch `factionMembership` callers and the decider budget line).

**Files to touch:** (S1)

- Create: `src/data/bond-basis.ts`
- Edit: `src/engine/worldSeed.ts` (flag the legacy tie block, name its numbers)
- Edit: `src/engine/seedLivingWorld.ts` (`seedTies`, `seedHomeStanding`, favours, `seedMarks` per protagonist, pass order)
- Edit: `src/data/worldgen-living-constants.ts` (constants, primes)
- Edit: `src/engine/npcGraduation.ts` (origin filter)
- Edit: `src/engine/graphConditions.ts`, `src/engine/ambitionSelection.ts`, `src/engine/returnEngine.ts`, the backstory resolver (read through `bondBasisMatches`)
- Edit: `src/data/backstory-content.ts` (`kin` row)
- Edit: `Docs/ubiquitous-language/Agents.md`, `scripts/interface-contracts.ts`

## Notes for the executor

- **Do not delete the legacy tie block's draws.** Removing the `rng()` calls shifts every later worldgen draw and turns a ties change into a whole-world change that no census can attribute.
- **Write both directions.** Most readers read outgoing `relates_to` only (`agent_has_bonds`, the bondModifier read).
- **`origin: 'worldgen'` goes on every seeded `relates_to`,** including the friendship pair a favour adds. An unstamped seeded tie is a latent decider.
- **The notable package has no `relates_to` on purpose** (S2). Do not "enrich" it with ties, which would count toward graduation once S1c's filter is bypassed by an unstamped write.
- **`findHeir` ignores basis and reads strength > 0.** Kin at 0.8 wins heirship by strength, which is the intent.
- **Re-baseline in the same session.** The machine's ms/tick swings (the briefing reports 76–114 on unchanged `main`), so compare against a baseline taken in the same session.

## Forked-audit verdicts

**Intent judge (fable), 2026-09-27: Allow.** Class confirmed Reversible. Two advisory GAPs, both closed before merge: UL route for **Kin** (now stated in § Rulebook impact), and kill criteria copied into the plan (§ Kill criteria).

### NFP audit

PASS-with-notes. Tunability, Inspectability, Fail-soft, Narrative, Additive: PASS. Determinism: PASS-with-note (seeded worlds gain edges, so t0 relationship-count tests need updating, stated in the plan). Performance: PASS-with-note (S3 lowers late-game decider count and may lower encounter firing below THR-1633's floor; the plan re-measures and keeps a flag-`false` fallback rather than asserting no impact).

### Three-pillar audit

PASS. Engine, Content and UI are present and substantive; there are no missing required sections. The wiring table fills all six checklist columns. The substrate inventory names 9 existing subsystems, each extended or activated (Secrets & Favors marked DORMANT → activates). No green-field duplication.

### Vision audit

PASS. North star is confirmed: the texture of mortals the player "watched choose things" arrives from minute one. The core loop is preserved (substrate only). Non-negotiables are respected: no player verb, everything on existing edges, prose not numbers. Design tensions lean toward systemic emergence, and S3's budget closure keeps the deciding portfolio narrow. The taste profile is respected. No contradictions.
