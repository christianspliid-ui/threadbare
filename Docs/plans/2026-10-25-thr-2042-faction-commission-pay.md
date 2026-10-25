> **title:** A faction's commission pays the member who takes it up — the coin is held when posted, paid on the job, and returned when it lapses — THR-2042
> **linear_issue:** THR-2042
> **author:** Claude Code (design lane, run 2026-10-25g, unattended)
> **created:** 2026-10-25
> **three_pillars:** Engine done · Content done · UI done (one aftermath change and one tooltip cause, both on existing surfaces — § UI pillar)

# A faction's commission pays the member who takes it up — THR-2042

*A faction that posts an errand now puts its coin where its mouth is: the first of its own people to do its work takes the coin, and an errand nobody takes gives the coin back.*

## Why this is load-bearing

[Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) keeps the primitives the [mortal wealth plan](2026-10-15-thr-1936-mortal-wealth.md) left out. This is its row *"a faction's quest or bounty pays its finisher from the purse — the first faction → mortal write"* (that plan, § Resolution 1 and § Notes: `FACTION_TREASURY_TRIBUTE_RATE` *"belongs to the Deferral's quest-pay item"*).

The [faction purse](2026-10-15-thr-1931-faction-purse.md) made Commission Quest reachable, and its plan says the errands are ones *"mortals already draw"*. **They are not.** On main @ 01cd21b6:

- `executeCommissionQuest` (`src/engine/phaseFactionActions.ts:378-430`) adds an `event` node (`eventType: 'faction_quest'`, `reward: BOUNTY_REWARD`, `claimed: false`) and a `commissions` edge, and takes `COMMISSION_QUEST_COST` (5) from the purse.
- A grep of `src/` outside tests for `faction_quest`, `'commissions'` and `claimed` finds only that writer, the edge schema (`types/edgeSchema.ts:492`), the edge-type union (`types/graph.ts:145`) and the world-object registry (`data/world-objects.ts:203`). **Nothing reads a commission.** Its coin leaves the world, and its `reward: 10` is a promise no system keeps (Game Design Law 45).

A headless census (`scripts/commission-census.ts`, unmerged branch `proto/thr-2042-commission-census`, medium map, 360 ticks = 30 days):

| seed | factions | commissions posted (by) | most open at once | faction jobs finished by mortals who make choices (mortals) | … while their faction had one open | finished unseen (member work) | … with one open | purse median (p10–p90) |
|---|---|---|---|---|---|---|---|---|
| 42 | 85 | 47 (11) | 11 | 30 (11) | 13 | 1803 | 347 | 13.9 (0–47.4) |
| 99 | 93 | 41 (11) | 7 | 92 (14) | 42 | 2179 | 369 | 18.8 (0–69.8) |
| 7 | 76 | 49 (10) | 10 | 49 (9) | 19 | 2081 | 410 | 16.8 (0–50.8) |

Each seed ran in its own process (the census leaks module state across seeds run in one process: seed 7 read 75 factions / 47 postings when run second). A second scratch read (`scripts/commission-overlap.ts`, same branch): **0 of the 188 faction-work templates** in `FACTION_ENCOUNTER_META` pay Means on any band, so a commission's coin is the only coin that work earns.

## Decisions this plan builds on

Decided by the design lane under delegation, 2026-10-25 (process.md rule 4) — the gist is here; the record is on [THR-2042](https://linear.app/threadbare/issue/THR-2042). Veto in chat.

1. **Only a mortal who makes choices takes up a commission.** Unseen members' work keeps paying standing, as today, and never takes a commission. They hold no Means (`giveBirthMeans` skips any actor `isAutonomousDecisionActor` rejects, `mortalMeans.ts:111-116`), and they finish 24 to 60 times as many faction jobs (1803 vs 30 on seed 42, 2179 vs 92 on seed 99), so they would empty every board within hours. Mortals who make choices finish a faction job while it has a posting open 13–42 times a month per seed, against 41–49 postings, so at most a quarter (seed 42) to nearly all (seed 99) of them can be taken. *Veto:* "any member, seen or unseen, can take one".
2. **The coin is held when posted and paid on the job.** Posting still takes `COMMISSION_QUEST_COST` (5) and now holds it on the posting as `escrow`. The finisher's Means rises by `COMMISSION_MEANS_PAY` = `MEANS_STEP` (6): the [border levy](../../src/data/encounters/border-levy.ts) in reverse, which takes `MEANS_STEP` from a mortal and puts `W_PURSE.step` (5) in a purse. The `reward: BOUNTY_REWARD` stamp is retired. *Veto:* "a commission should pay more than that".
3. **An untaken commission lapses and its coin goes home.** At `expiryTick` the escrow returns to the purse through `applyTreasuryDelta`. *Veto:* "a lapsed commission's coin is spent anyway".
4. **Bounties stay on the leftovers list.** Collecting one means hunting a named mortal to a fight's end — the fight-end path, not a payout row. [THR-1954](https://linear.app/threadbare/issue/THR-1954) keeps it with that reason.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Factions & Succession — faction actions, Commission Quest (`phaseFactionActions.ts:378-430`) | 🟢 ACTIVE writer; posting 🟠 DORMANT (written, never read) | **activates** the posting. The writer gains `escrow`/`status`; nothing is rebuilt |
| Faction purse (`factionPurse.ts`, `applyTreasuryDelta`, THR-1931) | 🟢 ACTIVE | **reads/writes** through `applyTreasuryDelta` (the lapse refund) |
| Mortal Means (`mortalMeans.ts` `applyMeansShift`, `buildMeansChange`, THR-1936) | 🟢 ACTIVE | **reuses** the shift and the aftermath change unchanged |
| Faction reputation (`processFactionEncounterReputation`, `factionReputation.ts:355`) | 🟢 ACTIVE | **extends** — returns the faction it credited |
| Faction member work (`factionMemberWork.ts`, THR-815) | 🟢 ACTIVE | untouched (decision 1) |

Population consumed: 41–49 postings by 10–11 factions per 30 days, 9–14 deciders finishing faction work (census above).

## Engine pillar

### Systems design

New module `src/engine/factionCommissions.ts` (pure graph reads and writes, no PRNG):

- `openCommissionsOf(graph, factionId, tick)` — the faction's outgoing `commissions` edges → `faction_quest` nodes with `status` absent or `'open'`, `claimed !== true`, and `expiryTick > tick`; sorted by `createdTick`, then id.
- `takeUpCommission(state, agentId, factionId, tick)` → `CommissionTaken | null`. Requires `isAutonomousDecisionActor(agent)`. Takes the **oldest** open posting and applies `applyMeansShift(agent.properties, COMMISSION_MEANS_PAY, 'commission')`. **Only when that shift lands** (non-null) does it write `claimed: true`, `status: 'taken'`, `takenTick` on the posting, add one `took_up` edge (agent → posting, `{ tick }`), and move `escrow` to `escrowPaid` (`escrow` becomes 0). The coin leaves the world as the finisher's pay, the way a money encounter's coin does: Means and a purse are two scales, so the step is the exchange (decision 2). A Magnate at the 100 clamp, or Means switched off, leaves the posting open for the next member (Law 56: no change for a move that did not happen).
- `lapseCommissions(state, tick)` — for every faction, each posting past `expiryTick` and still open gets `status: 'lapsed'`, and `escrow` goes back through `applyTreasuryDelta`. Iterates the factions' `commissions` edges, so it is O(factions + postings).

Edits:

- `executeCommissionQuest` writes `escrow: COMMISSION_QUEST_COST` and `status: 'open'` in place of `reward: BOUNTY_REWARD`. The purse debit and the gate are unchanged, so the posting rate does not move.
- `processFactionEncounterReputation` (`factionReputation.ts:355`) returns the faction node id it credited (`factionEdge.target`), or `null`, instead of `void`. This is additive: no caller reads the return today. "Which faction did this work count for" then has one answer, the reputation path's (class-scoped rows included, THR-1155).
- `executeStepResult` (`unifiedActionResolution.ts`): when the step completes the encounter (`encounterCompleted`) and the reputation call returned a faction id, call `takeUpCommission`. A hit pushes `buildMeansChange(..., { cause: COMMISSION_CAUSE_LINE })` onto the step's `aftermathChanges` (declared at `:2715`, after the reputation call at `:2681`, so the call sits after the declaration). Its id stem is `${actionId}:commission:${commissionId}`.
- `buildMeansChange` / `meansChangeSentence` (`mortalMeans.ts:253-300`) take an optional `cause` string. When given, the detail's closing full stop becomes ` — <cause>.` Without it the text is unchanged, so every money-encounter caller reads as today.
- `phaseFactionActions` calls `lapseCommissions` every tick, beside `tickFactionGovernance`.
- `resolveFactionMemberWork` is **not** changed (decision 1).

The legacy `orchestrator.ts:637` call walks `state.encounterProgress`, which no production path fills (THR-1069). Leave it alone.

### Graph nodes / edges

No new node type. The existing `event` node (`eventType: 'faction_quest'`) gains `escrow`, `escrowPaid`, `status` (`'open' | 'taken' | 'lapsed'`), `takenTick`. It loses the unread `reward`. The `commissions` edge is unchanged.

**One new edge type, `took_up`: agent → posting, at most one per posting, `requiredProperties: ['tick']`.** Who took a commission is a relationship between two entities, so it is an edge (load-bearing: relationships are edges). `src/types/graph.ts` has no edge to reuse: `commissions` runs faction → posting, and there is no `completed_by` / `claimed_by`. `participated_in` (actor → event, `edgeSchema.ts:375-383`) is not reused: it records an encounter's cast with `role` and `outcome`, and its 15 non-test readers (ambitions, appointments, callbacks, battle and fight records among them) would count a take-up as an encounter the mortal was in. Add the `EdgeType` union member in `src/types/graph.ts` and its `EDGE_SCHEMA` row in `src/types/edgeSchema.ts`, beside `commissions` in the *Faction work orders* block (`sourceNodeType: 'actor'`, `targetNodeType: 'event'`, `direction: 'directed'`). The debug accessor's `takenBy` is derived from the incoming `took_up` edge.

### Tick phases · Resolution logic · PRNG callouts

Posting: the faction-actions interval, as today. Lapse: every tick in `phaseFactionActions`. Take-up: in step resolution. No PRNG: oldest-first and id order.

## Content pillar

N/A for authored content. No encounter, prose table or template changes: any of a faction's existing `FACTION_ENCOUNTER_META` jobs (188 live templates) can take up its commission, and none of them pays Means today (census above), so nothing double-pays.

One phrase, used twice: `COMMISSION_CAUSE_LINE = 'a commission their faction paid for'` (`src/data/mortal-means-constants.ts`). `describeWealthSource` (`agentDetail.ts:1012`) gains `case 'commission': return COMMISSION_CAUSE_LINE;`, and the aftermath change carries the same constant, so the two surfaces cannot drift apart.

## UI pillar

Both surfaces already exist. Neither is new UI. UI Laws engaged: 56 (the change is state-backed: only a landed shift draws it), 13 (words, never an amount), 43 (the Means ladder, no new concept).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Before the job | **none in this slice.** The faction-work encounter's own stakes line is unchanged and names no pay, because none of the 188 templates pays Means (§ Content). | PC-2 (see below) | — |
| Encounter aftermath, `economy` change (existing kind, `buildMeansChange` with `cause`) | inside a band: title "Fortunes turn up", detail "Kael Thornweaver comes away a little richer — a commission their faction paid for." · at a band crossing: "Better off", "Kael Thornweaver is now Comfortable — a commission their faction paid for." | PC-2 (the cause is named where the pay lands) | The faction paid them for the job they just watched. |
| Character sheet, Means tooltip cause (`describeWealthSource`) | "a commission their faction paid for" | PC-6 (word for word the aftermath's cause, one constant) | The same cause, read later on the sheet. |

**PC-2, honestly.** The player is not told before the job that a commission is open, so the pay arrives as a surprise. It is not a contradiction: the job's stakes and result lines are untouched, and nothing the player picked is overruled. The after-line names the cause in full. A before-line would need a place where a faction's open errands are shown. No such surface exists: the faction sheet has no errand line, and there is no errand board. Adding one is filed as [The faction sheet names its open commission](https://linear.app/threadbare/issue/THR-2043) (Deferral), so this slice stays engine plus one phrase.

### Playtest signal

A tester who follows a guild member through a finished guild job, while that guild has a commission open, sees that mortal's Means change named in the aftermath, and the sheet's Means tooltip says a commission paid for it.

- **HexMapV2:** N/A. A commission has no place on the map; the plain map stays quiet (THR-1830).
- **No chronicle line.** One mortal's pay is not world news (the mortal wealth plan's equilibrium-is-silence rule).
- **No faction-sheet line** in this slice (the Deferral above).
- **Debug:** `window.__DEBUG.getFactionCommissions(factionId)` returns `{ id, status, escrow, createdTick, expiryTick, takenBy?, takenTick? }[]`, typed in `src/debug-bridge.d.ts`.
- **Browser-verify:** ≤400 non-test UI lines, so one 1920×1080 screenshot of a resolved faction encounter's aftermath carrying the change (Playwright DOM, `?view=game&seeded&size=medium`), plus the debug assertion.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `factionCommissions.ts` `takeUpCommission` | step resolution (`executeStepResult`) | aftermath `economy` change | posting props; agent `wealth`, `lastWealthReason` | `economy.commission` (`taken`) | `getFactionCommissions` |
| `factionCommissions.ts` `lapseCommissions` | `faction_actions`, every tick | — | posting props; faction `wealth` | `economy.commission` (`lapsed`) | `getFactionCommissions`, Economy debug tab purse |
| `describeWealthSource` + `COMMISSION_CAUSE_LINE` (`agentDetail.ts`) | — (read on sheet open) | character sheet Means tooltip | agent `lastWealthReason` | — | sheet tooltip |
| `executeCommissionQuest` | `faction_actions` interval | — | posting `escrow`, `status` | existing faction-action record | as above |

Wiki: `public/factions-cultures-reference.html` and `public/settlements-economy-reference.html` source these files. Add one sentence each (the wiki-freshness gate names the exact page).

## Interface impact

| Contract | Change | Note |
|---|---|---|
| `faction-purse-pays-faction-holders` | preserve | income untouched |
| Factions → Agents: a faction's commission pays a member's Means (`commission-pays-member`) | **add** (write) | first faction → mortal coin write. Production read: `agentDetail.ts` (Means word + cause) and `readMeansWant` (the want reads `wealth`). Add it to `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` |
| Factions → Economy: a lapsed commission refunds the purse | **add** (write) | read by the purse's own `readWealth` |
| `processFactionEncounterReputation` | extend | returns the credited faction id |

## Constants table

In `src/types/factionAction.ts`, beside the existing quest constants:

| Constant | Default | Purpose |
|---|---|---|
| `COMMISSION_MEANS_PAY` | `MEANS_STEP` (6) | Means a commission pays its finisher |
| `COMMISSION_QUEST_COST` | 5 (existing) | now also the escrow the posting holds |
| `COMMISSION_QUEST_EXPIRY` | 30 (existing) | ticks before an untaken posting lapses |
| `COMMISSION_CAUSE_LINE` | `'a commission their faction paid for'` | the one phrase the aftermath and the sheet tooltip share (`mortal-means-constants.ts`) |
| `FACTION_COMMISSIONS_ENABLED` | `true` | rollback: `false` restores today's behaviour (no take-up, no refund) |

`BOUNTY_REWARD` keeps its bounty use. `FACTION_TREASURY_TRIBUTE_RATE` stays unread: a member pays nothing *back* to the faction in this slice.

## Tracing

New member of the `TraceEntry` union in `src/types/trace.ts`, with `'economy.commission'` added to `TraceCategory` (`trace.ts:82`) and to `TRACE_CATEGORIES` (which seeds the DebugPanel filter, `trace.ts:539`):

```ts
export interface CommissionTrace {
  category: 'economy.commission';
  tick: number;
  action: 'taken' | 'lapsed';
  factionId: string;
  commissionId: string;
  escrow: number;
  agentId?: string;            // taken only
  wealthBefore?: number;       // taken only
  wealthAfter?: number;        // taken only
  summary: string;             // "Kael Thornweaver took up the Civic Guard Commission" / "… lapsed; 5 back to the purse"
}
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| posting missing `escrow` (made before this ships) | reads 0: can still be taken (Means paid), refunds 0 |
| faction node gone at lapse | posting marked `lapsed`, nothing refunded |
| agent not a decider / no membership / no open posting | `null`, nothing written (no edge, no prop) |
| posting already has a `took_up` edge | treated as taken; never a second edge |
| `applyMeansShift` returns null (clamp, Means off) | posting stays open |
| any throw inside take-up or lapse | caught per posting; step resolution and the tick go on |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/trace.ts` | 129 (grep, main @ 01cd21b6) | one new union member; no consumer must change |
| `src/types/graph.ts` | 324 (grep `types/graph'`, main @ 01cd21b6) | one new `EdgeType` member (`took_up`); additive. The only exhaustive consumer is `EDGE_SCHEMA: Record<EdgeType, EdgeSchema>` (`edgeSchema.ts:43`, 12 importers), and this plan adds its row |

`unifiedActionResolution.ts` has 56 importers and `phaseFactionActions.ts` 3. Both are below the threshold.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (N/A authored content, with rationale; one cause phrase)
- [x] UI pillar present (existing aftermath change + tooltip cause; debug accessor)
- [x] Wiring section connects them

## Game Design Laws

Conforms to 45 (the posting's promise becomes one the world keeps), 41 (Means moves through `applyMeansShift`, no parallel pay), 42 (the reputation seam, no per-template case), 43 (the Means words), 36 (purses stay small: the posting rate is unchanged). Breaks none.

## Vision audit

- [x] Does not contradict a Vision premise. Matched by hand: `Vision/02-non-negotiables.md` (mechanics surface through prose, never numbers; the graph is the one substrate), `Vision/01-core-loop.md` (aftermath makes consequences compound), `Vision/03-design-tensions.md` #4 legibility vs mystery (the cause is named after the fact; the before-line is [THR-2043](https://linear.app/threadbare/issue/THR-2043)). ("world at work": factions act on mortals through their own work; the god's hand is untouched).
- [x] No Vision edit needed.

## Rulebook impact

- [x] A rule of play changes: a faction's commission now pays, and a lapsed one refunds.
- [x] The `Docs/canon/rulebook.md` edit is owed in the build PR (below), not as a follow-up.

In the same build PR, add to `Docs/canon/rulebook.md` (after *"Money encounters move the town too"*, ~line 497) and to the quick reference's Means paragraph: *"A faction that posts a commission holds its coin; the first of its members who makes choices to finish its work is paid, and a commission nobody takes gives the coin back."* (`[IMPL — THR-2042]`).

> Brainstorm companion: `Docs/plans/2026-10-25-thr-2042-faction-commission-pay-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | one new constant + a switch; the rest reuse named constants |
| 2. Inspectability | PASS | posting carries its state; `economy.commission` trace; debug accessor |
| 3. Determinism | PASS | no PRNG; oldest-first, id order |
| 4. Fail-soft | PASS | table above |
| 5. Narrative over mechanics | PASS | a faction's errand pays a named person, said in the Means words |
| 6. Additive | PASS | new props, a return value, a module; one dead `reward` stamp retired |
| 7. Performance | PASS | per-tick lapse is O(factions + postings) and skips closed postings on a `status` read (about 50 postings a month per world, so a year-long run walks about 600 edges a tick); take-up is one edge walk per completed faction encounter |

## Done when

- [ ] `factionCommissions.test.ts`: a decider member who completes the faction's work takes the oldest open posting (Means +`COMMISSION_MEANS_PAY`, posting `taken`, exactly one `took_up` edge agent → posting that passes `EDGE_SCHEMA` validation); a non-decider member, a non-member and a completion with no posting take nothing; a Magnate at 100 leaves the posting open; a lapsed posting refunds `escrow` exactly once; the switch off restores today's behaviour.
- [ ] A resolution test through `executeStepResult`: the completed faction encounter's aftermath carries one `economy` change whose detail ends `— a commission their faction paid for.`, and a failed or unfinished one carries none. `meansChangeSentence` without a cause returns today's text exactly (the money-encounter callers are unchanged).
- [ ] `npm run census:commissions` (the proto script, landed under `scripts/`) on seeds 42/99/7 × 360 ticks: on every seed **at least one commission is taken**; `taken + lapsed + open = posted`; and the purse coin balances: escrow posted = escrow refunded + escrow paid out + escrow still open.
- [ ] Rulebook + quick reference lines, interface map + contracts, wiki sentences; `npm run gate` green; one 1920×1080 aftermath screenshot and the `getFactionCommissions` assertion.

## Kill criteria

- On any seed no commission is taken (the Done-when needs one on every seed): double `COMMISSION_QUEST_EXPIRY` once (60) and re-run. Still none → ship with the switch off, set the ticket back to Todo and record the census on it.
- A tick-cost regression above the alarm line traced to `lapseCommissions`: move it to the faction-action interval and re-measure.

## Coordination block

**Suggested model:** sonnet — one small module, a return value, two call sites and tests; no open design.

**Parallel-safe with:** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040) (scoring only) and [the sequel-place bug](https://linear.app/threadbare/issue/THR-1929) (seeding only).

**Mutex with:** [the debts plan](https://linear.app/threadbare/issue/THR-2023), because both edit `unifiedActionResolution.ts` near the outcome table and its aftermath changes. Rebase onto whichever merges first.

**Files to touch:**
- Create: `src/engine/factionCommissions.ts`, `src/engine/__tests__/factionCommissions.test.ts`
- Edit: `src/types/graph.ts` (`took_up`), `src/types/edgeSchema.ts` (its row), `src/engine/phaseFactionActions.ts`, `src/engine/factionReputation.ts`, `src/engine/unifiedActionResolution.ts`, `src/types/factionAction.ts`, `src/types/trace.ts`, `src/engine/agentDetail.ts`, `src/engine/mortalMeans.ts`, `src/data/mortal-means-constants.ts`
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts`
- Create: `scripts/commission-census.ts` + `census:commissions` in `package.json` (from `proto/thr-2042-commission-census`)
- Edit: `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, the two wiki pages

## Notes for the executor

Do not pay unseen members, even "a little" (decision 1). Do not read the retired `reward` prop: the pay is `COMMISSION_MEANS_PAY`, the coin `escrow`.

## Intent-judge verdicts

| Run | Verdict | Findings | Fixed by |
|---|---|---|---|
| 1 | Revise | dim 12 GAP: PC-2 named no cause and quoted no before-line; PC-6 aftermath and tooltip worded differently. dim 8 GAP: `takenBy` undecided in the doc. Unscored: what `escrow` becomes on take-up | `COMMISSION_CAUSE_LINE` on both surfaces; before-line stated absent and filed as [THR-2043](https://linear.app/threadbare/issue/THR-2043); `escrowPaid` |
| 2 | Block | dim 8 VIOLATION: `takenBy` as a property breaks "relationships are edges" | the `took_up` edge with its `EDGE_SCHEMA` row; Blast Radius gains `graph.ts` |
| 3 | **Allow** | dim 8 GAP: say why `participated_in` is not reused; dim 10 GAP: the kill threshold disagreed with the Done-when | both fixed (§ Graph nodes / edges, § Kill criteria) |

## Forked-audit verdicts

### NFP audit
PASS-with-notes. All seven pass. Notes: register the trace category (fixed in § Tracing); the pay arrives unannounced (THR-2043); the dead `reward` stamp is retired (a small removal, covered by "reads 0"); the lapse walk visits closed postings (sized in the NFP table).

### Three-pillar audit
PASS-with-notes. Engine present and substantive, Content N/A with rationale, UI present and substantive, substrate checked against the systems inventory. Notes: HexMapV2 had no N/A line, and the Means tooltip had no wiring row. Both are fixed.

### Vision audit
PASS-with-notes. No contradiction found with north star, core loop, non-negotiables (prose not numbers; `took_up` is an edge), design tensions or taste profile. Soft note on tension #4: no warning before the job (THR-2043). The plan cited no Vision file; it now does (§ Vision audit).
