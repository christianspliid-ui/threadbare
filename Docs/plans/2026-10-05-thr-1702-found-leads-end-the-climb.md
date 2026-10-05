> **title:** A lead ends where the site's road ends — a found wonder or plain ruin stops pulling its holder back — THR-1702
> **linear_issue:** THR-1702
> **author:** Claude Code (design lane, run 2026-10-05b)
> **created:** 2026-10-05
> **three_pillars:** Engine `done` · Content `done — one chip line made honest; no new template (rationale in § Content pillar)` · UI `done — no component change; the sheet's known-places selector names a found place "found it"`

# A lead ends where the site's road ends — THR-1702

*The clue climb (hear → survey → visit → delve) has no last rung at a site no delve can enter, and a mortal who reaches the top of it there re-surveys the place for the rest of the run.*

## Why this is load-bearing

[Seeded things stay alive](Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md) § S3 made the visit admit **ruin and wonder** sites (`siteClasses: ['ruin', 'wonder']`), so a kept visit can lift a lead on a wonder to `located` ("knows where it lies"). Delve admission only enters elder ruins and settlements a mortal ruined (`isDelvableRuin`, `src/engine/ruins/delveVariant.ts:250`). A `located` lead on any other site never becomes a delve. Its holder keeps it: the lead pass (`heldLeadRuinIds`, `src/engine/strategicActionCandidates.ts`) offers a survey of it with `leadPull` 2.5 every decision. Since [THR-1686](https://linear.app/threadbare/issue/THR-1686) that survey also skips the forecast window. Each survey refreshes the lead (`sharpenClue` resets `discoveredTick`, `src/data/undertaking-objects.ts:517`), so the lead never ages out. Every visit the survey tries to arrange is refused `lead_visit_not_narrowed`.

The dead end is wider than the ticket's title. It covers every site the visit admits but no delve can enter: all 13 wonder subtypes, and worldgen `ruins` with no `ruinedTick` (`ruined_tower`, `shipwreck`, `ancient_vault` and the rest of the ruin class other than `elder_ruin`).

**Measured (this run, `origin/main` `3dc2947b`)** with a new census reader, `Docs/audits/2026-09-25-living-world-data/readers/lead-dead-ends.ts`. Medium map, 300 ticks, outputs `output/lead-dead-ends-2026-10-05-seed<N>.json`:

| seed | ruin/wonder sites a delve can **never** enter (t0) | elder ruins | visits arranged (never-site) | `located` leads (never-site) | re-surveys of a `located` never-site lead | `not_narrowed` refusals | `located` never-site lead still live at t300 | delves |
|---|---|---|---|---|---|---|---|---|
| 42 | 15 (7 plain ruins, 8 wonders) | 103 | 15 (1) | 3 (0) | 0 | 1 | 0 | 3 |
| 99 | 20 (10, 10) | 88 | 21 (1) | 4 (**1**, a glowcap hollow) | **9** | **9** | **1** | 3 |
| 4 | 24 (11, 13) | 91 | 16 (0) | 0 (0) | 0 | 0 | 0 | 0 |
| 8 | 14 (6, 8) | 93 | 14 (0) | 2 (0) | 0 | 0 | 0 | 2 |

It is rare: 2 of 66 visits went to a never-site. When it does happen it never ends. On seed 99, 9 of that seed's 54 location surveys (17%) were the one holder going back to a wonder they had already found. That trip is spent, and the lead is immortal.

**Lane decisions in this plan** (made under `Docs/canon/process.md` § User review interface rule 4, open to veto): **D1** the fix shape (a found lead on a never-site is the climb's end: the holder remembers the place, and the lead stops pulling); **D2** the chip line stops promising a way down; **D3** what is left alone (the visit keeps admitting wonders; no wonder-specific find or payoff). Every input this plan draws on is human-agreed or shipped: S3's site classes, THR-1686's lead pass, and the ticket's three options. No lane decision younger than 24 h is built on.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Ruins, Clues & Delves** — `delveVariant.ts` (`isDelvableRuin`), `clueLifecycle.ts` (`phaseClueDecay`), `leadVisit.ts` | 🟢 ACTIVE | **extends**: exports the delve rule as a three-way answer; the decay sweep settles a spent lead |
| **Ambitions & Undertakings** — the lead pass (`heldLeadRuinIds`), the survey reader (`maybeSpawnSiteClue`) | 🟢 ACTIVE | **extends**: both skip a spent lead |
| **Intelligence, Knowledge & Familiarity** — `knows_of` edge, `seedKnowsOf` (`strategicGraphOps.ts:596`), the sheet's known places (`agentDetail.ts` ~line 1000) | 🟢 ACTIVE | **extends**: a found place is written as `knows_of` with a new optional `foundTick` property; the selector names it "found it" |
| **Encounters & Dilemmas** — `ruins.lead.visit` (`src/data/encounters/ruin-lead-visit.ts`) | 🟢 ACTIVE | **extends**: one chip `detail` string |
| **Encounters & Dilemmas** (appointment alias) — `UNDERTAKING_CELL_APPOINTMENTS['cell.observe.location']` | 🟢 ACTIVE | **unchanged**: `siteClasses` stays `['ruin', 'wonder']` (D3) |

Population consumed: the never-sites, 14–24 per medium world (table above), and the `located` leads on them. That is 1 in four seeds over 300 ticks, and 2 over twelve seeds per the THR-1686 closeout (4 `located` total, 3 delves).

## D1 — The fix: a found lead on a never-site ends the climb

**Decision.** A lead is **spent** when it is `located` and its site's *delve road* is `never`. The road is `now` for an elder ruin or a settled mortal-ruined settlement, `later` for a mortal-ruined settlement still inside `RUINED_SETTLEMENT_DELVE_DECAY_TICKS`, and `never` otherwise. A spent lead:

1. **is not pulled**: the lead pass leaves it out of `heldLeadRuinIds`, so no `leadPull` and no lead-pass survey candidate;
2. **is not refreshed**: a survey of the site by its holder writes nothing about the lead. The reader trace says `already_found`;
3. **becomes a known place**: the next `phaseClueDecay` sweep (every `CLUE_DECAY_CHECK_INTERVAL` = 10 ticks) writes the holder's `knows_of` edge to the site with `foundTick`, or stamps `foundTick` on an existing one, then removes the lead. A `ruins.lead_found` trace records it. After that, a survey by someone who has found the place writes no new lead either (`already_found`), so the climb does not restart on a place already found.

**Why this one.** It is the ticket's third option, finished so the lead has an end and not only a stop. Each of the other two fails on the evidence:

- **Drop `wonder` from the visit row (option 1)** does not end the loop; it moves it. A survey only ever writes `narrowed` (`OBSERVE_CLUE_PRECISION_BY_BAND`: `success → narrowed`, and a survey always completes at the instant band). A `narrowed` wonder lead with no visit possible would still be pulled and refreshed forever. It would also go back on S3's agreed scope (*"gated to ruin and wonder sites"*) and miss the plain ruins, which have the same dead end.
- **A wonder-specific payoff (option 2)**, such as a boon, attunement or essence for finding a wonder, decides what finding a wonder *means*, and nothing agreed decides that. It is not needed to fix the bug. D3 leaves the door open.

"Found it" as the end is honest to the fiction: the visit's success ending already says the mortal *"knows where it lies now"*. The sweep makes that permanent knowledge instead of an itch. Doing it in the decay sweep, not in each writer, catches every path to `located`: visit, survey critical, divine whisper and rumour (`perceiveRelay.ts`, `clueLifecycle.ts`). That is one write site, not five. Until the sweep runs, (1) and (2) already stop the busy-work.

**Options weighed and not taken.**
- *Consume the lead at the visit, inside `resolveVisitLead`.* Misses the other four paths to `located`.
- *Let the spent lead age out (stop refreshing, nothing else).* The sheet would lose the place 80 ticks later (`CLUE_MAX_AGE_TICKS_LOCATED`), and a mortal would forget a wonder they stood at. Rejected on NFP #5.
- *Key "spent" on site class (`wonder`), not delve road.* Misses the 6–11 plain ruins per world, and would wrongly spend a lead on a fresh mortal-made ruin that becomes delvable in 36 ticks (road `later`).

## D2 — The chip stops promising a way down

`ruin_lead.located` (`ruin-lead-visit.ts:52`) reads *"{actor} knows where this ruin lies, and can go down into it."* At a never-site that is false. At an elder ruin the delve announces itself the next tick. **Decision:** the detail becomes *"{actor} knows where this ruin lies."* Nothing else in the template changes.

## D3 — Left alone, on purpose

- **The visit still admits wonders**, with the ruin-voiced prose (*"broken stone and old cuts"*, *"Find the way in"*). A wonder-voiced visit is the right long-term shape, but it was 1 visit in 66 here and it needs an answer to "what does finding a wonder give?" first. Recorded under *Would change the call* on the ticket; no ticket is filed for it now.
- **No change to the delve rule, the dice, `leadPull`, the forecast-window skip or the visit's site classes.**
- **No change for `narrowed` or `vague` leads.** They can still climb.

## Engine pillar

### Systems design

1. **`delveRoadOf(node, tick): 'now' | 'later' | 'never'`**, exported from `src/engine/ruins/delveVariant.ts`. `isDelvableRuin(props, tick)` becomes `delveRoadOf(...) === 'now'` and keeps its behaviour exactly (pinned by the existing delve tests). `later` = subtype `ruins` with a numeric `ruinedTick` not yet past the decay. Pure, no graph reads beyond the node.
2. **`isLeadSpent(graph, edge, tick): boolean`** in `src/engine/ruins/leadVisit.ts`. It returns true when `CLUE_SPENT_LEAD_ENDS_CLIMB` is on, the edge is an unconsumed `knows_clue_of`, `precision === 'located'`, and the target's road is `never`. A missing target returns false; decay owns that case.
3. **Lead pass.** `heldLeadRuinIds` (`strategicActionCandidates.ts`) adds `!isLeadSpent(...)` to its filter. It needs `tick`; the caller has it.
4. **Survey reader.** `maybeSpawnSiteClue` (`src/data/undertaking-objects.ts`), before `sharpenClue`:
   - the surveyor holds a spent lead on the site → reader trace `refused: 'already_found'`, no write;
   - the surveyor holds no live lead, has a `knows_of` edge to the site carrying `foundTick`, and the site's road is `never` → the same refusal, no `spawnClue`.
5. **The find.** `phaseClueDecay` (`clueLifecycle.ts`), inside its sweep and **before** the pending-visit and age checks: for a spent lead, call a new `recordPlaceFound(graph, actorId, siteId, tick)` in `strategicGraphOps.ts` beside `seedKnowsOf`. It creates `knows_of { fromSurvey: true, convergedTick: tick, foundTick: tick }`, or sets `foundTick` on an existing `knows_of` without touching its other properties. Then remove the lead edge and emit `ruins.lead_found`. `seedKnowsOf` is unchanged.
6. **Known places.** `agentDetail.ts`'s known-places selector gives a `knows_of` carrying `foundTick` the lead text `'found it'`. A live lead on the same place still wins, as today.

### Graph nodes / edges

No new node or edge type. One new optional property, `foundTick?: number`, on the existing `knows_of` edge. Document it in the edge's properties type if one exists, else in `src/types/edgeSchema.ts`'s `knows_of` note. `knows_clue_of` is unchanged: the find removes the edge, as delve consumption and decay already do.

### Tick phases

- `clue_decay` (phase 6.654, every `CLUE_DECAY_CHECK_INTERVAL`): the find.
- Agent decision (candidate generation): the lead pass filter.
- Undertaking completion (the `observe` reader): the survey refusal.

No new phase and no ordering change.

### Resolution logic

None new. A spent lead drops out of the lead pass. A survey of the place can still be proposed by the ordinary Location sweep at plain desire; it simply writes nothing about the lead.

### PRNG callouts

None. Every new branch is a pure read of graph state (NFP #3).

## Content pillar

### Encounter templates

- `src/data/encounters/ruin-lead-visit.ts`: `LOCATED.detail` → `'{actor} knows where this ruin lies.'` (D2). If a content test or snapshot pins the old string, update it.

### Prose tables · Attachment content · Data tables

N/A. No new prose beyond D2. A wonder-voiced visit is deliberately not authored (D3): it was 1 visit in 66 in this census, and its ending depends on an undecided question.

## UI pillar

*Screenshot tool: none owed. No file under `src/components/`, `src/hooks/`, `src/contexts/` or `src/index.css` changes (verification-gates.md § Browser-verify; THR-688 rule C).*

### Player-facing display

On a mortal's sheet, the known-places row for a place they found reads **"found it"** instead of **"knows where it lies"**, about 10 ticks after the find. Elsewhere it is unchanged. The string comes from the engine selector (`agentDetail.ts`) and is pinned by a unit test. The chip line in D2 is the only other visible change. UI Laws engaged: Law 56 (chips are state-backed; the chip now claims only what the state holds) and Law 17 (sheet words). No layout change.

### Event notifications · Visual presence (HexMapV2)

N/A. The find writes no chronicle entry or toast. A mortal finding a place is not news at the god's scale, and the visit's own ending already carried the moment.

### Debug inspection (DebugPanel)

The DebugPanel clue list (`DebugTabContent.tsx:623`) reads `knows_clue_of` and simply stops listing a found lead. `ruins.lead_found` and the reader's `already_found` show in the trace viewer under their categories.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `delveVariant.ts` `delveRoadOf` | read by delve admission, the lead pass, reader, decay | — | — | — | via callers' traces |
| `leadVisit.ts` `isLeadSpent` | read-only helper | — | — | — | — |
| `strategicActionCandidates.ts` `heldLeadRuinIds` | agent decision | — | — | (fewer `leadPull` candidates on `decision_board_comparison`) | board traces |
| `undertaking-objects.ts` `maybeSpawnSiteClue` | undertaking completion | — | graph (`knows_clue_of`, unchanged write path) | `undertaking_reader` `refused: 'already_found'` | trace viewer |
| `clueLifecycle.ts` `phaseClueDecay` | `clue_decay` 6.654 | — | graph (`knows_of.foundTick`, lead removed) | `ruins.lead_found` | trace viewer, DebugPanel clue list |
| `agentDetail.ts` known places | selector | Agent sheet (existing) | — | — | sheet |

Prose pipeline: unchanged (`enrichProse` not touched). Player controls: none.

## Interface impact

Ruins & Delves is ⚪ UNAUDITED (`Docs/canon/interface-map.md` § Unaudited subsystems), so these seams are audited on touch and get rows now.

| Contract | Direction | This plan |
|---|---|---|
| `found-lead-becomes-known-place` (new) | Ruins, Clues & Delves → Intelligence, Knowledge & Familiarity: `phaseClueDecay` writes `knows_of.foundTick` | **add**. Production read site: `agentDetail.ts` known places (sheet), and the survey reader's `already_found` gate |
| `lead-pass-reads-delve-road` (new) | Ambitions & Undertakings reads Ruins: `heldLeadRuinIds` and `maybeSpawnSiteClue` call `delveRoadOf` / `isLeadSpent` | **add** |
| Delve admission reads `isDelvableRuin` | internal to Ruins | **preserve** (now `delveRoadOf === 'now'`) |

Both rows go into `Docs/canon/interface-map.md` **and** `scripts/interface-contracts.ts`, in the same PR (the two-file edit).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `CLUE_SPENT_LEAD_ENDS_CLIMB` (`src/engine/ruins/constants.ts`) | `true` | Kill switch. `false` restores today exactly: no spent leads, no find, no `already_found` |
| `CLUE_DECAY_CHECK_INTERVAL` (existing) | `10` | How often the find runs, and so the longest a found lead waits to become a known place. Unchanged |
| `RUINED_SETTLEMENT_DELVE_DECAY_TICKS` (existing) | `36` | Where road `later` turns into `now`. Unchanged |

## Tracing

```ts
// LeadFoundTrace — emitted by phaseClueDecay when a spent lead becomes a known place
interface LeadFoundTrace {
  category: 'ruins.lead_found';
  tick: number;
  knowerId: string;
  targetRuinId: string;          // same key the other ruins.clue_* traces use
  siteClass: string;             // locationClassOf the site ('wonder' | 'ruin' | …)
  knowsOf: 'created' | 'stamped';
  heldTicks: number;             // tick − the lead's discoveredTick
  summary: string;               // "<knower> found <site>; it is a known place now"
}

// UndertakingReaderTrace.refused gains one member:
//   'already_found' — the surveyor already found this never-site (spent lead, or knows_of.foundTick)
```

Register `ruins.lead_found` wherever the trace category registry requires it (follow `ruins.clue_sharpened`'s registration).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Lead target node missing | `isLeadSpent` → false; decay prunes it by age as today |
| Target is not a Location / has no subtype | road `never` only when the node is a Location; a non-Location target → not spent (decay owns it) |
| `recordPlaceFound` throws or `validateEdgeEndpoints` refuses | Leave the lead in place, emit no trace, and retry next sweep. Inside the existing `phaseClueDecay` try/catch |
| `knows_of` already exists with `foundTick` | Leave it; `knowsOf: 'stamped'`, and the lead is still removed |
| Switch off | Every new branch is skipped; behaviour equals `3dc2947b` |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 114 importers (`from '…types/trace'` across `src/`, measured by the intent judge 2026-10-05) | Additive only: one new `LeadFoundTrace` interface, one new member of the trace category union, one new member `'already_found'` of `UndertakingReaderTrace['refused']`. The risk is an exhaustive `switch` or a `Record<UndertakingReaderTrace['refused'], …>` / `Record<TraceCategory, …>` map that the new members break. Before editing, the executor greps for both shapes and extends any it finds. Guard: `npm run check:typecheck` (the ratchet) and `npm test` |

The other touched files (`strategicActionCandidates.ts`, `undertaking-objects.ts`, `clueLifecycle.ts`, `strategicGraphOps.ts`, `delveVariant.ts`, `leadVisit.ts`, `agentDetail.ts`) are below the wide-blast line and not on CLAUDE.md's high-impact list.

## Glossary (UL)

"Found it" is a fourth sheet phrasing of what a mortal knows about a place. "Spent" is a code-side word for a `located` lead on a never-site. The executor extends `Docs/ubiquitous-language/Encounters.md` § Lead in the same PR. This is seated by delegation (`ubiquitous-language` skill; process.md rule 4), so no `UL-proposal` issue is filed. The edit:

- Aliases: add *found it* (the known-places phrasing once a lead's climb has ended).
- Body, after the "goes stale" sentence: *"A **located** lead on a site no delve can ever enter (a wonder, a plain ruin) has nowhere left to climb: `phaseClueDecay` turns it into a known place (`knows_of` with `foundTick`; sheet: "found it") and removes the lead (THR-1702). Code calls such a lead *spent* (`isLeadSpent`); player surfaces never do."*
- Code anchors: add `src/engine/ruins/leadVisit.ts` (`isLeadSpent`) and `src/engine/ruins/delveVariant.ts` (`delveRoadOf`).

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (one chip line; no new template, with rationale)
- [x] UI pillar present (selector string; no component change, browser evidence not owed)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. A mortal's search ends in knowing the place, not in an endless errand ("the world starts alive", seeded things stay alive). It adds no new reward and takes no stance on what a wonder is for.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss). The clue climb's rungs and the delve rule are unchanged; a dead rung stops looping.
- [x] No `Docs/canon/rulebook.md` edit is owed.

> Brainstorm companion: `Docs/plans/2026-10-05-thr-1702-found-leads-end-the-climb-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | One kill switch; the cadence and the delve rule reuse existing named constants |
| 2. Inspectability | PASS | `ruins.lead_found` carries knower, site, class and held time; the reader's `already_found` names why a survey wrote nothing |
| 3. Determinism | PASS | No PRNG; every branch reads graph state |
| 4. Fail-soft | PASS | See the fail-soft table; the find runs inside `phaseClueDecay`'s existing try/catch |
| 5. Narrative over mechanical perfection | PASS | "Found it" is kept as knowledge, not forgotten by decay; the chip stops promising a door |
| 6. Additive over destructive | PASS | New optional `foundTick` property, new helpers, `isDelvableRuin` kept as a wrapper; the switch restores today |
| 7. Performance budget | PASS | One extra predicate per lead per sweep (every 10 ticks) and per held lead in the lead pass (≤ `CLUE_LEAD_SURVEY_CANDIDATES_MAX` 2) |

## Done when

- [ ] 1. **The loop is gone.** Re-run `readers/lead-dead-ends.ts` on seeds 42 · 99 · 4 · 8, 300 ticks, and paste the four JSON lines:
   - every seed's `resurveys` has no `:never` key;
   - every seed's `liveLocated` has no `:never` key at t300;
   - seed 99's `refused:lead_visit_not_narrowed` is ≤ 1 (today 9).

   Add a `lead_found` tally to the reader. Any seed whose `located` has a `:never` key shows ≥ 1 `ruins.lead_found`. If no seed reaches `located` on a never-site, also run seeds 1, 2, 3 and 5. If none does there either, cover the find with item 3's tests and say so.
- [ ] 2. **Delves are not hurt.** `delve_admitted` summed over the four seeds is ≥ today's 8 (3 · 3 · 0 · 2), and every elder-ruin `located` count is reported beside today's. A drop of 2 or more is a finding to report, not to tune.
- [ ] 3. **Unit tests**:
   - `delveRoadOf` returns `now` / `later` / `never` on an elder ruin, a fresh mortal ruin, a settled mortal ruin, a worldgen `ruins`, a `shipwreck` and a `healing_spring`;
   - `isLeadSpent`;
   - `heldLeadRuinIds` leaves out a spent lead and keeps a `narrowed` lead on the same wonder;
   - the reader refuses `already_found` both ways;
   - `phaseClueDecay` creates or stamps `knows_of.foundTick`, removes the lead and emits `ruins.lead_found`;
   - the known-places selector says `found it`;
   - with `CLUE_SPENT_LEAD_ENDS_CLIMB = false`, a spent lead is pulled and refreshed exactly as today.
- [ ] 4. **The chip.** `ruin_lead.located`'s detail no longer says "can go down into it", and the content gates pass.
- [ ] 5. **Wiring.** The two interface rows are in both `interface-map.md` and `scripts/interface-contracts.ts`. The Design Reference Wiki page whose `sources` include the touched ruins files is updated, or `Wiki-freshness-exempt:` is stated with its reason.
- [ ] 6. **Gates.** `npm run gate` green; engine track, so a 30-tick CLI smoke and `npm run test:heavy`. `Browser-verify exempt: no component, hook, context or stylesheet change; the one visible string is a selector pinned by a unit test`.

## Kill criteria

- If Done-when 2 shows delves down by 2 or more over the four seeds, keep the switch on only if the drop traces to holders who would otherwise have looped. Otherwise set it `false` and report the rung that starved.
- If a holder repeatedly finds the same place, `ruins.lead_found` more than once per (knower, site) in 300 ticks on any seed, the `already_found` gate is leaking. Fix it before merge.

## Coordination block

**Suggested model:** sonnet. A small, cross-module engine change with a fixed shape and a ready census reader. No design judgement is left to the executor.

**Parallel-safe with:** [THR-1713](https://linear.app/threadbare/issue/THR-1713), [THR-1716](https://linear.app/threadbare/issue/THR-1716), [THR-1730](https://linear.app/threadbare/issue/THR-1730) and [THR-1732](https://linear.app/threadbare/issue/THR-1732). These are UI and encounter-surface work, and none of them touches `src/engine/ruins/`, `strategicActionCandidates.ts` or `undertaking-objects.ts`. [THR-1737](https://linear.app/threadbare/issue/THR-1737) (In Dev) edits the departing filter, not these files.

**Mutex with:** any ticket editing the lead lifecycle: `src/engine/ruins/leadVisit.ts`, `clueLifecycle.ts`'s `phaseClueDecay`, `heldLeadRuinIds`, or `maybeSpawnSiteClue`. Both would change when a lead lives or is pulled. None is on the board today; [THR-1696](https://linear.app/threadbare/issue/THR-1696) shipped.

**Files to touch:**
- Edit: `src/engine/ruins/delveVariant.ts` (`delveRoadOf`, `isDelvableRuin` as a wrapper)
- Edit: `src/engine/ruins/leadVisit.ts` (`isLeadSpent`)
- Edit: `src/engine/ruins/constants.ts` (`CLUE_SPENT_LEAD_ENDS_CLIMB`)
- Edit: `src/engine/ruins/clueLifecycle.ts` (the find in `phaseClueDecay`)
- Edit: `src/engine/strategicGraphOps.ts` (`recordPlaceFound`)
- Edit: `src/engine/strategicActionCandidates.ts` (`heldLeadRuinIds` filter)
- Edit: `src/data/undertaking-objects.ts` (`already_found`)
- Edit: `src/engine/agentDetail.ts` (`found it`)
- Edit: `src/types/trace.ts` (`LeadFoundTrace`, `already_found`), edge note for `knows_of.foundTick`
- Edit: `src/data/encounters/ruin-lead-visit.ts` (D2)
- Edit: `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`
- Edit: `Docs/ubiquitous-language/Encounters.md` § Lead (§ Glossary above), then regenerate the UL dashboard if its gate asks
- Edit: `Docs/audits/2026-09-25-living-world-data/readers/lead-dead-ends.ts` (add the `lead_found` tally)
- Tests beside each module

## Notes for the executor

- `isDelvableRuin` is private today; keep its call site in `phaseDelveAdmission` reading exactly as before through the wrapper.
- `heldLeadRuinIds` is exported and tested. Its signature gains `tick`; update its tests rather than defaulting `tick` to 0 (0 would make every mortal-made ruin read `later`).
- Do not drop `wonder` from `siteClasses` and do not touch `leadPull`. D1 and D3 rule both out, and a "simpler" fix there reintroduces the loop at `narrowed`.
- A survey critical can write `located` straight onto a never-site (`OBSERVE_CLUE_PRECISION_BY_BAND`). The sweep covers it; do not add a second write site.
- The ticket lives in the Thematic Pressure & Living World project; the plan it repairs is [`2026-09-28-thr-1636-seeded-things-stay-alive.md`](Docs/plans/2026-09-28-thr-1636-seeded-things-stay-alive.md) § S3. Add one line under its S3 Done-when pointing here.

## Forked-audit verdicts

*Run 2026-10-05 by the design lane (three cold Sonnet auditors, one message).*

### NFP audit

**NFP AUDIT: PASS-with-notes.**

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Named kill switch; existing constants reused for the cadence and the decay |
| 2. Inspectability | PASS | `ruins.lead_found` carries knower, site, class, `knowsOf` and `heldTicks`; `already_found` says why a survey wrote nothing; wiring table complete; two interface rows |
| 3. Determinism | PASS | No PRNG |
| 4. Fail-soft | PASS | Five-row table; runs inside the existing try/catch |
| 5. Narrative | PASS | A found place stays known; the chip stops promising a delve |
| 6. Additive | PASS-with-note | `heldLeadRuinIds` changes signature (gains `tick`); the kill switch restores today |
| 7. Performance | PASS | One predicate per lead per 10-tick sweep, plus at most 2 held leads in the lead pass |

### Three-pillar audit

**PILLAR AUDIT: PASS.**
- Engine: present-and-substantive.
- Content: present-and-substantive (one chip string; the other subsections N/A with reasons).
- UI: N/A-with-rationale (no component change; the selector string, Laws 56 and 17, and debug surfaces are stated).
- No missing required sections.
- Wiring maps every module to its phase, field, trace and debug surface.
- Substrate inventory present, with no green-field duplicate.
- Blast Radius was added after the intent judge measured `trace.ts` at 114 importers.

### Vision audit

**VISION AUDIT: PASS.**
- Premises confirmed: north star (mortals watched choosing), core loop (consequences compound), non-negotiables (narrative over mechanics; graph substrate), taste profile (mortal sovereignty, prose-first).
- Design tension #4 (legibility vs mystery) extended lightly.
- No contradictions.
- D3's refusal to decide what a wonder is worth avoids leaning on any tension.

### Intent judge

- Round 1: **Revise**. Dimension 9 VIOLATION: no Blast Radius for `src/types/trace.ts` (114 importers). Dimension 6 GAP: "found it" and "spent" not in the UL. Dimension 11 note: inventory names. All three fixed in this revision.
- Round 2: **Allow**. 0 GAPs and no VIOLATIONs; the three prior findings were verified closed. Impact class Reversible (judge-confirmed).
