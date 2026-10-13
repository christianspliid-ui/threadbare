> **title:** `Master work reaches masters — the content route, in measured batches — THR-1757`
> **linear_issue:** THR-1757
> **author:** Claude Code (design lane, run `dl-20261013-1918`)
> **created:** 2026-10-13
> **three_pillars:** Engine `N/A — no engine change; the cap, the scorer and the KPI are preserved (§ Engine pillar)` · Content `done` · UI `N/A — new encounters render through the existing encounter surfaces (§ UI pillar)`

# Master work reaches masters — the content route, in measured batches (THR-1757)

*The best mortals in a craft should sometimes take on work only they can do; today the shortlist cuts that work before they ever weigh it, because there is so little of it.*

## Why this is load-bearing

[THR-1742](https://linear.app/threadbare/issue/THR-1742) measured why masters rarely attempt master work (audit [`Docs/audits/2026-10-06-thr-1742-master-band.md`](../audits/2026-10-06-thr-1742-master-band.md)). The work is near every master and passes every gate. Then the cap's fair own-hex draw ([THR-1687](https://linear.app/threadbare/issue/THR-1687)) gives each template about the same small chance of a slot, and each reach has exactly one master template ([THR-1688](https://linear.app/threadbare/issue/THR-1688)). The invariant rung *masters attempt harder content than experts* (`src/engine/__tests__/engagementWindow.invariant.test.ts`) stays skipped with `TODO(THR-1757)`.

The ticket asked the design lane to choose between authoring more master content and a cap reserve for the decider's own band, and to rule whether the reserve counts as "tuning to make the rung pass". **This plan chooses the content route** (D1), stages it in measured batches with a stop rule (D2), and puts a design checkpoint after the third batch (D3) because the measured gap has grown since the audit.

**Lane decisions in this plan** (made under `Docs/canon/process.md` § User review interface rule 4; each open to veto): D1 the route, D2 the batches and stop rule, D3 the checkpoint. None rests on a lane decision younger than 24 hours. The ruling D1 leans on, [THR-1687](https://linear.app/threadbare/issue/THR-1687) plan D2 (*preference lives in scoring, never in the cap*), was made 2026-10-01 and has not been vetoed.

## The measurement, re-taken on today's `main`

The audit's numbers are a week old and the catalogue has grown since, so the reader was re-run before deciding. Base: `origin/main` @ `bbe2a6c9`, seeds 42 / 99 / 7, 120 ticks, the audit's construction.

```
node Docs/audits/2026-09-25-living-world-data/readers/master-band.build.mjs
node .cache/master-band.mjs 42,99,7 120
node .cache/master-band-keep.mjs 42,99,7 120
```

| | 6 Oct audit (`f23f37e4`) | **today (`bbe2a6c9`)** |
|---|---|---|
| own-master template survives the cap (q) | 0.215 | **0.157** |
| master commits with own-master work on the board | 19.5% | **13.9%** |
| masters choose master-band work | 8.6% | **6.0%** |
| masters choose novice work | ~60% | 60.2% |
| last own-master entry removed by the cap | 136 of 185 | 129 of 166 |
| master mean attempted (42 / 99 / 7) | 0.241 / 0.295 / 0.252 | **0.208 / 0.279 / 0.290** |
| expert mean attempted (42 / 99 / 7) | 0.290 / 0.282 / 0.264 | **0.274 / 0.280 / 0.282** |
| rung (master > expert on 42 and 99) | fails 42 | **fails 42 and 99** (99 by 0.001) |

Keep-all probe (the cap keeps every own-master entry, never shipped), today: own-master work on **53.4%** of master boards; masters choose master-band work 20.2% of the time; master mean attempted 0.339 / 0.337 / 0.355 against expert 0.323 / 0.280 / 0.263, so the rung passes on all three seeds (margin 0.016 on 42). That is the ceiling any route reaches with today's eight templates. (The probe arm logged one caught, fail-soft warning at world start, `[UndertakingOutcomeNode] Failed to add victim edge … Source node not found`, in the strategic-projects phase; it does not touch the encounter funnel the reader measures, and the run completed on all three seeds.) Once master work is plentiful, cooldown (19.2%) and the top-five board (23.8%) become the next cuts; distinct new templates ease the first, which the probe's eight repeated templates cannot.

**What changed.** No cap code moved; other bands' new content diluted the fair draw. Under a fair draw a band's reach scales with its share of the catalogue, so a thin band loses ground every time any other band grows. That is the price of the THR-1687 design, and this plan states it in canon (S1, item 5) so the next brief sizes itself against it.

**Projected on-board share by master templates per reach (K)**, from the reader's own model `1 − (1 − q_K)^K × t` with today's q and t = 0.885:

| K per reach | new encounters | on the board |
|---|---|---|
| 1 (today) | 0 | 0.14 |
| 2 | 8 | 0.25 |
| 3 | 16 | 0.33 |
| 4 | 24 | 0.40 |
| 5 | 32 | 0.45 |
| 7 | 48 | 0.54 |
| 8 | 56 | 0.57 |

The audit found the rung flips on noise between ~34% and ~46% on the board and passes with margin near the keep-all ceiling. The projections are a model and run conservative (distinct templates also ease the cooldown cut, which the probe could not show); the stop rule treats every count as a ceiling.

## D1 — The route: more master content, not a cap reserve

**Decision.** Author more master everyday encounters, eight per batch (one per reach), through the factory line. No change to `capWithDiversity`, its reserves or its constants.

**Why.**
- **The cause is volume, and content answers volume.** Nothing in the cap misbehaves; the fair draw does what THR-1687 designed it to do. The audit's word is *volume*, and one template per reach against ~190 is thin for the people the realm sends for by name. More of them is more game.
- **The reserve is the THR-1687 D2 rejection, re-asked.** That plan rejected *"a band-aware reserve (keep N slots for content that fits the decider's window)"* because *"it puts a difficulty preference into the cap, which is supposed to be a performance bound. Preference is scoring's job."* The existing reserves (branching, personal offer, social, journey goal, anomaly) keep *kinds* of content reachable. A band reserve keeps a *difficulty* chosen by the decider's capability. The forecast window already owns that preference, at scoring, where it is traced.
- **It answers the sub-question.** The reserve would exist only because the rung fails, and its size would be picked by watching the rung. That is tuning the cap to make the rung pass, which the ticket's Done-when forbids. A content batch is not: the stop rule decides only when to stop adding game.
- **It keeps the texture.** A master who sometimes weighs the commission only they can do, and sometimes takes the easy coin because it pays, is more alive than one whose shortlist is guaranteed to hold their band (THR-1687 brainstorm).
- **It is affordable.** THR-1688's batch of eight ran in one executor run of about two hours (claimed 02:29, done 04:41 UTC on 5 Oct).

**Options weighed** (full reasoning in the [brainstorm companion](2026-10-13-thr-1757-master-work-reaches-masters-brainstorm.md)):
- *Cap reserve for the decider's own band.* Rejected above.
- *Weight the fair draw by rarity or instance count.* A band preference by proxy (master templates are `rarityTier 2` by construction), and it would move every band at once.
- *Widen the scorer's top-five board.* Not the binding cut today (t = 0.885); it moves every mortal's choices, which is the agreed decision board's business (THR-1292).
- *Raise the cap's size (`CAP_FILL_LOCAL_SLOTS` 30, `MAX_SCORED_CANDIDATES` 40).* Band-neutral, so it is not a preference, but it is a performance bound on every mortal's every decision and was not measured here. It is D3's fallback lever, not this plan's.

**Would change the call.** Christian saying masters should *always* find work worthy of them (that standing should pull it to them). That is a fiction claim and belongs in the world (a summons, a commission that seeks the master out), as a new content design, not in the cap. Or D3's checkpoint finding that batches cannot keep pace with dilution.

## D2 — Batches and the stop rule

| Slice | Ticket | Batch | K after | Blocked by |
|---|---|---|---|---|
| S1 | [THR-1757](https://linear.app/threadbare/issue/THR-1757) (this ticket) | gauge alias, canon note, **master batch 2** (8, one per reach) | 2 | — |
| S2 | [THR-1840](https://linear.app/threadbare/issue/THR-1840) | master batch 3 (8, one per reach) | 3 | THR-1757 |
| S3 | [THR-1841](https://linear.app/threadbare/issue/THR-1841) | master batch 4 (8, one per reach) | 4 | S2 |
| S4 | [THR-1842](https://linear.app/threadbare/issue/THR-1842) | design checkpoint (D3) | — | S3 |

- **Each slice's first step is the gauge:** `npm run measure:master-band` (S1 adds it) and `npm run measure:roll-spread -- --coverage-only`. **Stop rule:** if the rung's condition holds on seeds 42 and 99 (master mean attempted difficulty above expert's, the reader's `meanDiff`), the slice closes as not needed with the numbers in its comment, and every later batch slice closes the same way. Counts are ceilings, never quotas.
- **Each slice's last step is the re-measure and the re-arm.** Run the gauge again with the batch in. If the condition holds, un-skip `masters attempt harder content than experts` with its condition unchanged and remove its `TODO(THR-1757)` (re-point the TODO at the next open slice otherwise).
- **Guard rails, every batch** (a breach stops the series and is reported, never tuned away):
  1. Every live clause in `engagementWindow.invariant.test.ts` stays green, including *journeymen attempt harder content than novices*, *experts attempt harder content than journeymen* and *the master band succeeds level*. More master content can dilute the other bands and can pull master success down; either is a finding for the D3 checkpoint.
  2. `npm run measure:roll-spread -- --coverage-only` shows no reach under any band's floor.
- **The binding rows** come from the master brief that THR-1688 ran on ([`Docs/plans/encounters/master-everyday-brief.md`](encounters/master-everyday-brief.md)): every step 0.72–0.85 (mean in the master band, window fit ≥ 0.85), `rarityTier 2`, `scale 'local'`, `intrinsicTier 'shaping'`, `urban` and/or `rural` settings, ids under `encounter.town.*`, no guild-rank, army, monster, fight or confront gate. **Put the master stakes in who sits across the table, never in a rule gate.**
- **No repeated verbs.** Each new slot reads the master and the two expert encounters already on its reach and does not repeat their verb or premise.
- **Each batch writes its own brief** under the 2026-09-11 blanket approval of batch briefs (as THR-1688 did), named `master-everyday-<n>-brief.md`, and runs the factory line (`encounter-pipeline`, `draw:packet`, `compile:encounter`, `check:encounter`, `check:encounter-live`) with its batch report.
- **Floor.** Each batch raises `EVERYDAY_FLOOR_BY_BAND.master` (`src/engine/kpi/kpiConstants.ts`) in the same PR to the **lowest master count any reach actually landed** (K when all eight land), so the coverage scoreboard keeps every reach's master count honest and a dropped slot never trips guard rail 2. The next batch backfills the short reach first.

## D3 — The checkpoint after batch 4

The gap grew between the audit and today (q 0.215 → 0.157 in a week, with no cap change). If it keeps growing, batches may not outrun dilution. So the series pauses at K = 4 for a design decision, with numbers, instead of committing now to 48–56 encounters.

**The checkpoint ticket (S4) is for the design lane, not the executor.** It reads the four gauge runs (today, K = 2, 3, 4) and decides one of:
- **Continue content** to K = 5…8, if the measured on-board share is rising at least as fast as the projection.
- **Measure the band-neutral cap size**, if dilution is eating the batches: a probe of `CAP_FILL_LOCAL_SLOTS` / `MAX_SCORED_CANDIDATES` with whole-tick cost, because a bigger shortlist lifts every thin band at once without a preference.
- **Stop**, if the rung has passed (S2 or S3 will already have closed it).

It never chooses a band reserve; D1 rules that out.

## Kill criteria

- **The route is wrong** if, after a batch, the measured on-board share rises by less than half the projected step (for example K = 2 lands under 0.20 against a projected 0.25). Then dilution is outrunning content; the series stops at that slice and S4 runs early.
- **The content is wrong** if a guard-rail rung goes red, or master success leaves its band. Masters taking on work they fail more often is fine within the band; outside it, the brief's step range is reconsidered at S4, never a constant.
- **The game is wrong** if a cold or warm playtest that follows masters reads the new commissions as grind. That is Christian's call to make, and it stops the series.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `encounter` — `encounterFilterPipeline.ts` `capWithDiversity` (reserves 1a–1f, fair own-hex draw) | 🟢 ACTIVE | **preserve** — untouched; the batches only add templates to its draw |
| `encounter` — `encounterScoring.ts` (top-five board) | 🟢 ACTIVE | **preserve** |
| `engagement` — `engagementWindow.ts` (the 0.50–0.65 choice window) | 🟢 ACTIVE | **preserve** |
| `kpi` — `kpiConstants.ts` `EVERYDAY_FLOOR_BY_BAND` | 🟢 ACTIVE | **extends** — `master` rises with each batch (1 → K) |
| Encounter factory line (`encounter-pipeline` skill, `check:encounter`, `check:encounter-live`) | 🟢 ACTIVE | **consumed** — runs each batch unchanged |
| Master-band reader (`Docs/audits/2026-09-25-living-world-data/readers/master-band.ts`) | 🟢 ACTIVE (audit tool) | **extends** — gains an npm alias as the gauge |

Runtime count of the population consumed: 8 master everyday templates today, 187 / 242 / 242 instances on seeds 42 / 99 / 7 at first decision; 166 master free-choice commits across the three seeds in 120 ticks.

## Interface impact

| Contract | Disposition |
|---|---|
| cache → filter pipeline → scoring (≤ 40 candidates) | **preserve** — same stages, same reserves, same sizes |
| `EVERYDAY_FLOOR_BY_BAND` → `measure:roll-spread` coverage scoreboard | **preserve** — same producer and reader; one value rises |
| encounter template catalogue → `encounterCache` | **preserve** — new templates register through the existing registry |

No cross-system read or write is added or retired, so `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` are unchanged.

## Engine pillar

Engine: N/A — no engine code changes. The decision (D1) is precisely to leave the cap, the scorer and the choice window alone. The one `src/engine/` edit is a constant value (`EVERYDAY_FLOOR_BY_BAND.master`), read only by the coverage scoreboard.

## Content pillar

### Encounter templates

Up to 24 new master everyday encounters across three batches of eight, one per reach per batch, in `src/data/encounters/` and registered as THR-1688's were. Binding rows per D2. Stop rule per D2.

### Prose tables · Attachment content

N/A — each encounter carries its own prose through the factory package format; no shared table changes.

### Data tables

`EVERYDAY_FLOOR_BY_BAND.master`: 1 → 2 (S1) → 3 (S2) → 4 (S3).

### Canon edit (S1)

`Docs/canon/encounters.md`, after the coverage-scoreboard paragraph (§ Picking a step's `difficulty`): add that **under the cap's fair own-hex draw a band reaches the board in proportion to its share of the catalogue**, so a thin band loses reach whenever any other band grows. Size a band's brief with `npm run measure:master-band` (masters) or the coverage scoreboard, and re-measure after other bands' batches land. Cite this plan.

## UI pillar

UI: N/A — no component, hook, context or style changes. New encounters render through the existing encounter surfaces, and the factory's live proof (`check:encounter-live`) carries each batch's browser step, as THR-1688's batch report did.

*Screenshot tool:* none required by this plan; each batch's factory live proof follows the factory line's own contract.

### Playtest signal

A tester who follows a master mortal for a few seasons can name a commission that only someone of that standing would have been sent for.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| New master encounter templates | agent decision (existing encounter draw) | existing encounter surfaces | none new | existing `encounter_filter` / scoring traces | `?spawn=<templateId>` |
| `measure:master-band` gauge | offline (script) | — | — | reader output | console |

Checked against `Docs/plans/wiring-checklist.md`: no new module, phase, field or trace.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `EVERYDAY_FLOOR_BY_BAND.master` | 1 → K per batch (max 4 in this plan) | Per-reach master floor the coverage scoreboard and stop rule read |
| Batch size | 8 (one per reach) | Plan constant, not code: the unit each re-measure gauges |
| Checkpoint K | 4 | Plan constant: where the series pauses for D3 |

## Tracing

N/A — no new trace types. The gauge reads existing hooks; the reader's `--no-trace` arm proves its hooks are behaviour-neutral (ledger sha1 equal across arms, audit § Method).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| The gauge's build patch no longer applies (an engine line it hooks moved) | The build throws `patch did not apply`; the slice re-anchors the patch string, it does not skip the gauge |
| A batch encounter fails `check:encounter` or `check:encounter-live` | The factory line's own rule: fix or drop that slot. A batch of seven still counts; the floor rises only to the lowest landed count (D2 § Floor), and the next batch backfills that reach first |
| A guard-rail rung goes red | Stop the series, report the numbers on the slice and on S4; never tune |
| The rung passes on 42 and 99 but not on 7 | Pass: the rung's condition names 42 and 99; record 7 |

## Three-pillar check

- [x] Engine pillar N/A with rationale (D1 is a decision to not change the engine)
- [x] Content pillar present: up to 24 encounters in three gauged batches, a floor constant, a canon edit
- [x] UI pillar N/A with rationale (existing surfaces; factory live proof)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. *Narrative over mechanical perfection*: the master stakes are fiction (who is across the table), not rule gates, and nothing is tuned to a KPI. The living-world north star: masters keep both the easy coin and the commission only they can do.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss).
- [x] No `Docs/canon/rulebook.md` update is owed. The rulebook's `[IMPL — THR-1581; the journeyman-and-up half waits on content, THR-1627]` tag (`Docs/canon/rulebook-quick-reference.md` § Resolution) is untouched.

> Brainstorm companion: [`2026-10-13-thr-1757-master-work-reaches-masters-brainstorm.md`](2026-10-13-thr-1757-master-work-reaches-masters-brainstorm.md)

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | The only number that moves is a named constant (`EVERYDAY_FLOOR_BY_BAND.master`); batch size and checkpoint K are named here |
| 2. Inspectability | PASS | The gauge is one command whose output names the stage that cut master work; preference stays in one place (scoring) |
| 3. Determinism | PASS | No random code; the fair draw's hash key is unchanged |
| 4. Fail-soft | PASS | See table; content-only change |
| 5. Narrative over mechanical perfection | PASS | Stakes live in the fiction; the rung is a gauge, the goal is masters who sometimes do master work |
| 6. Additive over destructive | PASS | New templates only; nothing removed |
| 7. Performance budget | PASS with note | ~24 templates on ~190 in the draw; the cap bounds candidates at 40, so per-decision scoring cost is unchanged; the heavy suite's tick-cost check covers it |

## Done when

### S1 — this ticket

- [ ] `npm run measure:master-band` exists (builds the reader, runs seeds 42, 99, 7 at 120 ticks) and its baseline output is quoted in the closing comment.
- [ ] Stop rule checked first (D2). If it trips, skip the batch (and the floor raise), close S2 and S3 as not needed with the numbers, and still ship the gauge alias, the canon note and the un-skip in this PR.
- [ ] Master batch 2 brief written (`Docs/plans/encounters/master-everyday-2-brief.md`); eight encounters, one per reach, through the factory line; batch report committed.
- [ ] `EVERYDAY_FLOOR_BY_BAND.master` = 2; coverage scoreboard shows no reach under any floor.
- [ ] Re-measure quoted (seeds 42 / 99 / 7: master vs expert mean attempted, on-board share). If the rung's condition holds on 42 and 99, `masters attempt harder content than experts` is un-skipped with its condition unchanged; otherwise its TODO points at S2.
- [ ] Every other live clause in `engagementWindow.invariant.test.ts` is green.
- [ ] Canon edit in `Docs/canon/encounters.md` (Content pillar § Canon edit).
- [ ] `npm run gate` verdict pasted; `Browser-verify exempt: no file under src/components, src/hooks, src/contexts or index.css` (the factory's live proof covers each encounter).
- [ ] Nothing in `capWithDiversity`, the cap constants, the scorer or the choice window changes.

## Coordination block

**Suggested model:** opus — eight factory encounters with a brief, plus a measurement whose reading decides whether the series continues.

**Parallel-safe with:** [THR-1750](https://linear.app/threadbare/issue/THR-1750) (Dominion on screen; UI and pricing, no encounter catalogue), [THR-1811](https://linear.app/threadbare/issue/THR-1811) (god cards; action templates, not encounters), [THR-1793](https://linear.app/threadbare/issue/THR-1793) (culture edges; world generation).

**Mutex with:** any ticket that edits `capWithDiversity` or the cap constants in `src/data/agent-behavior-constants.ts`, encounter scoring, or the choice window, and any other everyday-content batch landing at the same time. Each moves the master band's on-board share this ticket gauges, so a concurrent change would make the re-measure unreadable.

**Files to touch:**
- Edit: `package.json` (add `measure:master-band`)
- Create: `Docs/plans/encounters/master-everyday-2-brief.md`, the eight encounter files under `src/data/encounters/` and their tests, the batch report
- Edit: the encounter registry the THR-1688 batch registered through
- Edit: `src/engine/kpi/kpiConstants.ts` (`EVERYDAY_FLOOR_BY_BAND.master` → 2)
- Edit: `src/engine/__tests__/engagementWindow.invariant.test.ts` (un-skip or re-point the TODO)
- Edit: `Docs/canon/encounters.md` (canon note)

## Notes for the executor

- Do not add a cap reserve, change the hash draw, raise a cap constant or touch scoring to help the rung. D1 rules them out; D3 owns the cap-size question.
- The reader's `meanDiff` is the gauge's reading of mean attempted difficulty; the invariant test computes the same KPI on the same world construction. If they disagree, trust the test and report the difference.
- Seed 99 sits 0.001 under the line today. A batch that tips it but leaves 42 failing does not satisfy the stop rule.
- The audit's projection model is a ceiling, not a promise. Report the measured on-board share next to the projected one; S4 reads the gap.

## Intent-judge verdict

**Allow** (2026-10-13, opus, cold context; impact class Reversible confirmed). Ten dimensions PASS, dimension 12 N/A, two GAPs, both fixed before commit:
- *Dimension 3:* the slice table held placeholders for the batch tickets. Fixed: S2–S4 were filed (THR-1840, THR-1841, THR-1842) with `Blocked by` relations and coordination blocks, and the table links them.
- *Dimension 4:* the fail-soft row ("a batch of seven still counts") contradicted raising the floor to K in the same PR. Fixed: the floor rises to the lowest landed per-reach count and the next batch backfills (D2 § Floor). The S1 Done-when now says the gauge alias, canon note and un-skip still ship if the stop rule trips.
- *Observation:* the keep-all probe's evidence file starts with a caught warning stack. Now noted under the keep-all paragraph as a fail-soft strategic-projects warning outside the measured funnel.

The judge confirmed the reading that `EVERYDAY_FLOOR_BY_BAND` is a per-reach content-count floor, not the difficulty floor the ticket's "no floors" forbids.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-13*

### NFP audit

**PASS-with-notes.** Tunability, inspectability, determinism, fail-soft, narrative and additive all PASS: only `EVERYDAY_FLOOR_BY_BAND.master` moves; the gauge names the stage that cut master work; no random code and the hash key is unchanged; the fail-soft table covers patch drift, failed slots, red guard rails and a 42/99-but-not-7 pass; nothing in the cap, scorer or window changes. **Performance, the note:** the plan relies on the cap's 40-candidate bound and the heavy suite's tick-cost check for ~24 extra templates; no tick-cost measurement is quoted. (The auditor could not read the 509 KB wiring checklist in full.)

### Three-pillar audit

**PASS-with-notes.** Engine N/A with rationale (D1 is a decision not to change the engine; the one edit is a constant value). Content present and substantive (up to 24 encounters, binding rows, floor constant, canon edit, stop rule). UI N/A with rationale (existing surfaces, factory live proof, playtest signal). No missing required sections; wiring table present. Substrate inventory present with preserve / extends / consumed dispositions and a runtime population count. Notes: the cap and scorer rows sit under the inventory's `encounter` group (`encounterFilterPipeline.ts`, `encounterScoring.ts`), which the auditor's grep for the function names did not find; the wiring checklist was too large to read in full.

### Vision audit

**PASS-with-notes.** No contradictions. `02-non-negotiables.md` "Narrative over mechanical perfection" extended: master stakes live in who sits across the table, not in rule gates. Taste profile confirmed. North star, core loop and design tensions compatible. Note: the series is gated on a statistical rung, which sits close to the narrative-over-mechanics premise; the plan's safeguards are the playtest signal and the "game is wrong" kill criterion, which are Christian's.
