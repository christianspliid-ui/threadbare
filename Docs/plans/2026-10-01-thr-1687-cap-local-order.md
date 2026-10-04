> **title:** The shortlist's own-hex pass picks templates by a per-decision hash, not by catalogue order — THR-1687
> **linear_issue:** THR-1687
> **author:** Claude Code (design lane, run 2026-10-01b)
> **created:** 2026-10-01
> **three_pillars:** Engine `done — one switch constant and a reordered own-hex pass inside capWithDiversity` · Content `N/A — no authoring; the 16 expert and 8 not-yet-written master everyday encounters are what this unblocks` · UI `N/A — no surface changes; the board a mortal decides from is not shown to the player`

# The shortlist's own-hex pass picks templates by a per-decision hash, not by catalogue order — THR-1687

*An expert standing in a town where expert work is on offer almost never gets to consider it. The shortlist that feeds the decision board fills its local slots in catalogue order, so encounters written recently (which is all the harder content) are cut before anyone weighs them. This plan makes the local slots a fair draw: every encounter on the mortal's own hex gets the same chance, whatever order it was written in, and scoring decides from there.*

## Why this is load-bearing

The content-above-novice program ([plan](2026-09-29-thr-1627-content-above-novice.md)) authored 16 expert everyday encounters across three batches. Its gauge then showed experts still attempt easier work than journeymen (`gameplay-report --seeds 42,99,7`: expert mean attempted difficulty 0.13 / 0.16 / 0.12 against journeyman 0.17 / 0.18 / 0.15), and in-window share stuck at 0.47 / 0.46 / 0.45 under `KPI_IN_WINDOW_MIN` 0.50. That is the plan's kill criterion, *"the window or the board, not content"*. The S7 pickup (THR-1681) measured the board and found the candidate cap cutting expert everyday templates on ~99% of the decisions that could see them, so it shipped without writing the eight master encounters: they would land behind the same cut.

Every further content batch above novice is wasted until this is fixed, and so is the rise clause of the engagement invariant (`engagementWindow.invariant.test.ts`, skipped with `TODO(THR-1687)`). The fix is small. The work in this plan is proving the mechanism and stating a target that is not a KPI.

**Lane decisions in this plan** (made under `Docs/canon/process.md` § User review interface rule 4, open to veto): **D1** the fix shape (a hashed per-template order in the own-hex pass), **D2** the target (cap-stage band neutrality, not a KPI), **D3** what is deliberately left alone (the general fill, the slot counts, scoring). The parent decisions it draws on (THR-1627 D2's window-fit banding and its kill criterion) were made by this lane on 2026-09-29 and are past their veto window.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `encounter` → `encounterFilterPipeline.ts` `capWithDiversity`, Stage 5 (the cap) | 🟢 ACTIVE | **extends** — the THR-1633 own-hex pass keeps its slot count and its position in the fill; only the order it visits templates in changes, behind a new switch |
| `encounter` → `encounterCache.ts` emission order (location by location, templates in registration order, ~:360–410) | 🟢 ACTIVE | **preserve** — untouched. The fix makes the cap independent of this order instead of reordering the cache |
| Cap reserves Phase 1a–1f (diversity, branching, personal offer, social, journey goal, anomaly) | 🟢 ACTIVE | **preserve** — run before the local pass, unchanged |
| `kpi` → `engagementKpi.ts` (`windowFitBandFor`, `proficiencyBandFor`, `demandedDifficultyOf`) | 🟢 ACTIVE | **consumed** — the measurement buckets content and deciders with these, never a parallel classifier |
| `engagementWindow.invariant.test.ts` rise + in-window clause | skipped `TODO(THR-1687)` | **re-arm attempt** — un-skipped only if it passes on its own; see Done-when 4 |
| `readers/reach.ts`, `gameplay-report` | measurement | **consumed** — the guard rails and the KPI re-read |

## The measurement (Done-when 1: the mechanism, confirmed)

Reader: [`readers/cap-band.ts`](../audits/2026-09-25-living-world-data/readers/cap-band.ts), added by this plan. For every deciding mortal every 10 ticks over 120 ticks (medium, `?seeded` identity), it takes the board's nearby cache entries exactly as `phaseAgentDecision` does and runs `runFilterPipeline` twice on the *same* state: once with the shipped own-hex pass (`walk`) and once with the prototype (`hash`, a throwaway arm on an unmerged worktree; nothing reached `main`). An own-hex template *survives* when any of its entries reaches the candidates. Content is banded by `windowFitBandFor(demandedDifficultyOf(steps, scale))`, the decider by `proficiencyBandFor(computeCapability(agent, template.reach))`. Main @ `e5118533`.

**Why the shipped pass is biased.** The own-hex pass (`CAP_FILL_LOCAL_SLOTS` 30) walks the ~10,000-entry list from a hashed start and keeps the first 30 distinct templates that stand on the mortal's hex. A mortal's hex carries a median of **117 · 97 · 87** distinct templates (seeds 42 · 99 · 7; p90 121 · 117 · 119), so the 30 slots cannot hold them all. The hashed start almost always lands outside the mortal's own block (one block in a ~10k list), so the walk enters it at its head, and the head is the catalogue's registration order. The templates registered last never get a slot. New content is registered last.

**Survival by registration quartile** (share of own-hex templates that reach scoring, all deciders):

| Catalogue quarter | seed 42 walk → hash | seed 99 walk → hash | seed 7 walk → hash |
|---|---|---|---|
| 1st (oldest) | 59.0% → 40.2% | 62.2% → 40.7% | 63.3% → 43.1% |
| 2nd | 19.1% → 18.3% | 15.9% → 22.9% | 11.9% → 23.5% |
| 3rd | **0.8%** → 8.4% | **1.4%** → 12.6% | **1.1%** → 12.0% |
| 4th (newest) | 8.4% → 35.2% | 7.8% → 36.2% | 7.0% → 36.8% |

The cliff in the walk arm is the mechanism. (The 2nd and 3rd quarters stay lower in the hash arm for a different reason: they hold the situational templates, which mostly fail the earlier filter stages.)

**Survival by band, expert deciders** (the ticket's table, now in both arms):

| Content ← expert decider | seed 42 walk → hash | seed 99 walk → hash | seed 7 walk → hash |
|---|---|---|---|
| novice | 44.9% → 41.5% | 51.6% → 45.8% | 49.6% → 39.5% |
| journeyman | 15.7% → 30.2% | 18.3% → 32.8% | 17.5% → 33.0% |
| **expert** | **4.4% → 21.4%** | **5.9% → 31.1%** | **4.8% → 30.5%** |

**Separating the cap from the earlier filters.** A template that fails awareness, visibility or prerequisites never reaches the cap, and no fill order can help it. The reader's `FILTER_ONLY` arm runs each own-hex template alone through the pipeline (≤ 40 entries never reaches the cap), which gives the pre-cap pass rate. Dividing survival by it gives the **cap's own keep rate**:

| Expert decider, cap keep rate | seed 42 | seed 99 | seed 7 |
|---|---|---|---|
| novice content — walk / hash | 49.8% / 46.1% | 55.6% / 49.4% | 54.4% / 43.4% |
| expert content — walk / hash | 7.3% / 35.7% | 7.3% / 38.7% | 5.5% / 35.1% |
| **expert ÷ novice — walk / hash** | **0.15 / 0.77** | **0.13 / 0.78** | **0.10 / 0.81** |

(Pre-cap pass rates, expert deciders: novice content 90.1% · 92.8% · 91.1%, expert content 59.9% · 80.3% · 86.9% on seeds 42 · 99 · 7. Seed 42's `hash` columns come from a first prototype form that sorted every own-hex entry; seeds 99 and 7 and the gameplay A/B below come from the one-pass form D1 specifies. Both select templates by the same key and differ only in which entry stands for a template. The ticket's 2.3% / 0.0% were measured at `0599592d` with a different probe; this reader at `e5118533` gives 4.4% / 5.9%, the same conclusion. Raw output: `Docs/audits/2026-09-25-living-world-data/output/cap-band-2026-10-01-thr1687.txt`.)

The remaining gap after the fix is not ordering. Novice everyday templates are registered at more location types, so they also stand on neighbouring hexes inside the awareness range, and the general fill (the slots after the local 30) can pick them up there. That is exposure the world actually has, which is the right thing for the cap to reflect.

## D1 — The fix: a hashed order per template, inside the own-hex pass

**Decision.** The own-hex pass stops walking the list. It collects, in one pass, the first unreserved own-hex entry of every template not already on the shortlist, gives each template the key `hashString(agentId + ':' + tick + ':' + templateId)`, and fills its slots with the templates whose keys are smallest. Ties break by template id. Behind a new switch, `CAP_FILL_LOCAL_ORDER` (`'template_hash'` ships; `'walk'` restores the THR-1633 pass exactly, NFP #6).

**Why this one.** It removes the dependency on catalogue order without introducing any preference of its own: each own-hex template has the same chance of a slot on every decision (about 30 / L, where L is the number of distinct own-hex templates), and a mortal who stays put sees a different 30 each tick, so over a few ticks it sees the whole of its town. The key is a pure hash of `(agent, tick, template)`, the same family as THR-1633's rotating start, so no seeded PRNG stream shifts (NFP #3). Which entry represents a template (when it stands at several places on the hex) stays the first one met from the existing rotated start, so that choice is unchanged in kind.

**Options weighed and not taken.**
- **A band-aware reserve** (keep N slots for content that fits the decider's window). It would work, but it puts a difficulty *preference* into the cap, which is supposed to be a performance bound. Preference is scoring's job (`encounterScoring.ts`, the forecast window). It would also be tuning the cap toward the in-window KPI, which the ticket forbids.
- **Shuffling the cache's emission order per location.** One shuffle at cache build would be static: a mortal who never leaves its town would see the same 30 forever, with a different unlucky set. A per-decision order is needed, and that lives in the cap.
- **Raising `CAP_FILL_LOCAL_SLOTS`.** The median own hex holds 87–117 templates against 40 total slots, so no slot count clears it, and every slot added is scoring cost.
- **Also reordering the general fill.** Its start lands uniformly across the whole list, so its bias is per-location-block, not catalogue-wide, and the cliff above is entirely the local pass's. Left alone (D3).

**Cost.** Whole `runFilterPipeline` per board, same process, the one-pass form above: walk 1.72 ms → hash 1.62 ms (seed 99), 1.72 → 1.64 ms (seed 7). The walk also scans most of the list when it starts outside the mortal's block, so the one-pass form costs no more. (A first, sort-everything prototype measured 1.27 → 1.51 ms on seed 42; the one-pass form replaced it.) These runs shared the CPU with each other, so they are a direction, not a budget; the budget is Done-when 5.

## What the fix does to what mortals attempt (prototype A/B, report only)

`gameplay-report --seeds 42,99,7` (120 ticks, medium), shipped pass vs prototype, same session. Nothing was tuned; these numbers chose nothing in this plan.

| | seed 42 walk → hash | seed 99 walk → hash | seed 7 walk → hash |
|---|---|---|---|
| novice mean attempted difficulty | 0.11 → 0.09 | 0.11 → 0.09 | 0.11 → 0.10 |
| journeyman | 0.17 → 0.20 | 0.18 → 0.21 | 0.15 → 0.19 |
| **expert** | **0.13 → 0.24** | **0.16 → 0.23** | **0.12 → 0.23** |
| master | 0.13 → 0.18 | 0.14 → 0.17 | 0.18 → 0.16 |
| expert engagements (n) | 59 → 93 | 76 → 130 | 87 → 130 |
| in-window share | 0.475 → 0.446 | 0.465 → 0.452 | 0.450 → 0.427 |
| total success | 0.659 → 0.664 | 0.588 → 0.620 | 0.660 → 0.655 |
| resolutions counted | 558 → 581 | 527 → 628 | 635 → 647 |

Read plainly: **the board was the cause for experts.** Once their own content reaches them, experts attempt clearly harder work than journeymen on all three seeds, and they take on more of it. Novice → journeyman → expert now rises everywhere. **Masters sit below experts**, which is expected: there is no master everyday content yet (THR-1681 deferred it to this ticket), so masters draw on expert and journeyman work. **In-window share does not move up**; it dips 1–2 points. So the share below 0.50 is not a board problem. That is the window's question (see Kill criteria), and it is reported here, not chased.

## D2 — The target: the cap is band-neutral, not "the KPI passes"

**Target.** On seeds 42, 99 and 7, for expert deciders at their own location, the cap's keep rate for expert-fit content is **at least 0.7 of** its keep rate for novice-fit content (cap keep rate = survival ÷ pre-cap pass rate, from `readers/cap-band.ts`). Measured with the prototype: 0.77 / 0.78 / 0.81. Measured today: 0.15 / 0.13 / 0.10.

**Why this number and not a KPI.** The cap exists to bound scoring cost; it should not have an opinion on which encounter a mortal attempts. The honest test of that is neutrality: content of every band that reached the cap should leave it at roughly the same rate. Perfect parity is not the target, because novice templates stand on more hexes and the general fill legitimately sees them more (the measurement above). 0.7 leaves room for that exposure and still fails the shipped pass by a factor of four. The in-window share and the rise are *reported* afterwards, never used to choose the order, the slot count or the threshold.

## D3 — Left alone, on purpose

- `MAX_SCORED_CANDIDATES` (40), `CAP_FILL_LOCAL_SLOTS` (30) and every reserve size: unchanged.
- The general fill (`walk(remaining, …)`), the rotated start, distinct-first: unchanged.
- Scoring, the forecast window, the decision board: untouched. If expert content now reaches scoring and experts still do not attempt it, that is the next question, and it belongs to the window (kill criterion).
- The cache's emission order: untouched.

## Engine pillar

### Systems design

`capWithDiversity` (`src/engine/encounterFilterPipeline.ts`), the own-hex block after `const agentHex = …`:

1. If `fill.localOrder !== 'template_hash'` (that is `'walk'`, absent in a caller that passes its own `fill`, or any unknown value), run the existing `walk(localSlots, onHexPredicate, [true])` unchanged.
2. Else (`'template_hash'`): one pass over `entries` from the existing rotated `start`. For each entry whose template is neither in `seenTemplates` nor already collected, resolve its hex through the same per-location memo the walk uses; keep it if it is on the agent's hex and its `templateId:locationId` key is not reserved. This yields `firstByTemplate: Map<templateId, entry>`.
3. Key each collected template with `hashString(\`${agentId}:${tick}:${templateId}\`) >>> 0`; sort ascending, ties by id; take up to `localSlots`, pushing each into `filled`, `reservedKeys`, `seenTemplates` exactly as `walk` does.
4. The general fill runs after, unchanged.

`CapFillOptions` gains `localOrder?: 'walk' | 'template_hash'`, defaulted from the constant. When `tick` is undefined the key salt uses `0` (the rotated start already falls back to index 0 in that case).

A prototype of steps 2–3 (about 20 lines) was measured above. It lived on an unmerged worktree and was reverted; the executor writes it fresh with tests.

### Graph nodes / edges

None.

### Tick phases

None added. Runs inside the existing decision phase (`phaseAgentDecision` → `runFilterPipeline` → Stage 5).

### Resolution logic

Untouched. Only which candidates reach scoring changes.

### PRNG callouts

No PRNG draw. The order is `hashString` of `(agent, tick, template)`: deterministic, and no seeded stream advances, so worlds diverge only through which candidates are scored (NFP #3).

## Content pillar

N/A — no authoring in this ticket. What it unblocks: the 16 expert everyday encounters already written (THR-1678/1679/1680) start reaching their mortals, and the eight master everyday encounters THR-1681 deferred become worth writing. This plan files that batch as its own ticket, blocked by this one.

### Encounter templates · Prose tables · Attachment content · Data tables

N/A — as above.

## UI pillar

N/A — the shortlist is internal to a mortal's decision. Nothing on screen reads it, and no surface changes. The player sees the effect only as mortals taking on harder work. No browser evidence is owed (THR-688 rule C: engine, accepted by CLI/headless sweeps). UI Laws engaged: none.

### Player-facing display · Event notifications · Debug inspection · Visual presence

N/A — as above. The existing `encounter_filter` trace keeps reporting `capCutTemplates`.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: no new module, modal, GameState field or player control; the change lives inside an existing pipeline stage.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `encounterFilterPipeline.ts` `capWithDiversity` own-hex pass | agent decision (`phaseAgentDecision` → `runFilterPipeline`) | none | none | `encounter_filter` (existing; gains `capLocalOrder`) | `window.__DEBUG.getTraces` with tracing on; `runtime.eligibilityFunnel` `cap` bucket |
| `agent-behavior-constants.ts` `CAP_FILL_LOCAL_ORDER` | read at call time | none | none | — | constant |

## Interface impact

| Contract | Change |
|---|---|
| cache → filter pipeline (entries in emission order) | **preserve** — the cap stops depending on the order; the order itself is untouched |
| filter pipeline → scoring (≤ 40 candidates) | **preserve** — same count, same reserves; which own-hex templates fill the local slots changes |

No cross-system read or write is added or retired, so `Docs/canon/interface-map.md` needs no row.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `CAP_FILL_LOCAL_ORDER` (`src/data/agent-behavior-constants.ts`) | `'template_hash'` | Order of the own-hex pass. `'template_hash'` gives every own-hex template the same chance of a slot; `'walk'` restores the THR-1633 catalogue-order walk (NFP #6). Doc-comment carries this plan's measurement |
| `CAP_FILL_LOCAL_SLOTS` | `30` (unchanged) | Slots the own-hex pass may fill |
| `MAX_SCORED_CANDIDATES` | `40` (unchanged) | The cap |

## Tracing

```ts
// encounter_filter — existing trace from runFilterPipeline; one optional field added
interface EncounterFilterTrace {
  type: 'encounter_filter';
  // ...existing fields (stage counts, capCutTemplates)
  capLocalOrder?: 'walk' | 'template_hash'; // which own-hex order produced this shortlist
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No agent location, or it resolves to no hex | No local pass (the existing behaviour) |
| `tick` undefined | Hash salt uses `0`; order is still per-template and deterministic |
| An entry's location resolves to no hex | Treated as not on the agent's hex (the existing predicate) |
| Fewer own-hex templates than `localSlots` | All of them are taken; the general fill takes the rest (unchanged) |
| Unknown `CAP_FILL_LOCAL_ORDER` value | Treated as `'walk'` |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale (unblocks authoring; the follow-up batch is filed)
- [x] UI pillar N/A with rationale (no surface reads the shortlist)
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. *The world runs without you* and *what a mortal attempts grows with them* both need mortals to see the work that suits them; this removes an accident that hid it. No mechanic surfaces as a number to the player.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is owed. Rationale: The shortlist is an implementation bound below the rulebook's level; the rulebook's resolution section already says mortals choose work in their window from what they can see.

> Brainstorm companion: `Docs/plans/2026-10-01-thr-1687-cap-local-order-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | One named switch; slot counts unchanged and named |
| 2. Inspectability | PASS | `encounter_filter` trace names the order; the reader is committed for re-measurement |
| 3. Determinism | PASS | Pure hash of `(agent, tick, template)`; no PRNG draw, no stream shifts |
| 4. Fail-soft | PASS | See table; every missing input falls back to the existing pass |
| 5. Narrative over mechanical perfection | PASS | Mortals meet the work written for them; the target is neutrality, not a KPI |
| 6. Additive over destructive | PASS | `'walk'` restores the shipped pass exactly |
| 7. Performance budget | PASS with note | One extra scan of the nearby list per decision; budget in Done-when 3 |

## Done when

- [ ] 1. `CAP_FILL_LOCAL_ORDER` ships as `'template_hash'`; `'walk'` reproduces the current shortlist byte-for-byte (a unit test pins both).
- [ ] 2. Unit tests in `encounterFilterPipeline.test.ts`: (a) with more own-hex templates than slots, a template registered last is reachable — across 200 ticks for one agent, every own-hex template is offered at least once; (b) the order is independent of the input's template order (the same set in reversed registration order gives the same shortlist for the same agent and tick); (c) the three existing THR-1633 local-pass tests still pass under `'walk'` and their intent holds under `'template_hash'` (own hex first, bounded at `localSlots`, skipped without a location).
- [ ] 3. **Neutrality (D2):** `readers/cap-band.ts 42`, `99`, `7` (120 ticks, every 10, `FILTER_ONLY=1`) on the branch: expert ÷ novice cap keep rate for expert deciders ≥ 0.7 on each seed. Quote the three tables. Remove the reader's `__CAP_LOCAL_ORDER` toggle in favour of passing `fill` explicitly, or keep the toggle reading the constant.
- [ ] 4. **Report, never tune:** `gameplay-report --seeds 42,99,7` before and after, same session. Report each band's mean attempted difficulty, in-window share and total success, next to the prototype table above. Then **split** the skipped clause in `engagementWindow.invariant.test.ts` into three: (a) *experts attempt harder content than journeymen* — un-skip it when it passes on seeds 42 and 99 (the prototype says it will); (b) *masters attempt harder content than experts* — stays skipped, `TODO` retargeted to the master everyday batch ticket filed with this plan; (c) *in-window share ≥ `KPI_IN_WINDOW_MIN`* — stays skipped unless it passes, `TODO` retargeted to the window measurement ticket filed with this plan. Nothing may be tuned to make any clause pass.
- [ ] 5. **Guard rails** (`readers/reach.ts 42,99 200`, before/after, same session): total firings within −10% of before; drawable templates fired not lower; top-10 share not higher by more than 2 points; `start_local` decisions on seed 42 within −10%. Engine smoke (`npm run cli`, 30 ticks) and `npm run test:heavy` green. Whole-tick ms within +5% of before (`readers/alive.ts` timing or `gameplay-report` wall time, same session).
- [ ] 6. Wiki: `public/encounters-manual-reference.html` § the free-slot fill gains this change with its numbers; constants table row for `CAP_FILL_LOCAL_ORDER`.
- [ ] 7. CLI/headless evidence only (THR-688 rule C). `Browser-verify exempt: engine-only, the shortlist has no surface`.

## Kill criteria

- **Expert content reaches scoring but experts still attempt easier work than journeymen** (expert mean attempted difficulty ≤ journeyman's on two of three seeds). The prototype says this will not happen; if it does, the board is not the cause after all. Report on THR-1627's thread with the numbers and do not change the cap further.
- **In-window share stays under 0.50 after the fix** — expected, per the prototype. It is not a failure of this ticket; it is already filed as the window measurement ticket. Do not touch the cap to chase it.
- **The guard rails fail** (firings or `start_local` down more than 10%). Then fair local sampling is costing mortals the work in front of them. Report the numbers; the fallback is `'walk'` plus a separate decision, not a retuned slot count.

## Coordination block

**Suggested model:** opus — engine change to the shortlist with world-wide distribution effects; needs before/after sweeps on three seeds and a judgement on the invariant.

**Parallel-safe with:** THR-1572 (spell generator: `spellCasting.ts`, `worldSeed.ts`; no shared files). THR-1686 edits `decisionBoard.ts`, `phaseAgentDecision.ts` and `encounterScoring.ts`, not `encounterFilterPipeline.ts`. **Ordering note, not a mutex:** both move in-window share; whichever merges second re-measures Done-when 4 on the new main.

**Mutex with:** any ticket editing `src/engine/encounterFilterPipeline.ts` `capWithDiversity` or the cap constants in `src/data/agent-behavior-constants.ts` (`MAX_SCORED_CANDIDATES`, `CAP_FILL_*`, `*_CAP_RESERVE`), because both change which candidates reach scoring. None is on the board today.

**Files to touch:**
- Edit: `src/data/agent-behavior-constants.ts` (add `CAP_FILL_LOCAL_ORDER` with its doc-comment)
- Edit: `src/engine/encounterFilterPipeline.ts` (`CapFillOptions.localOrder`; the own-hex pass's `'template_hash'` branch; trace field)
- Edit: `src/types/trace.ts` (`capLocalOrder?` on the filter trace)
- Edit: `src/engine/__tests__/encounterFilterPipeline.test.ts` (Done-when 1–2)
- Edit: `src/engine/__tests__/engagementWindow.invariant.test.ts` (Done-when 4, conditional)
- Edit: `public/encounters-manual-reference.html` (Done-when 6)
- Edit: `Docs/audits/2026-09-25-living-world-data/README.md` (rows for the after-measurements)

## Notes for the executor

- The reader is `Docs/audits/2026-09-25-living-world-data/readers/cap-band.ts`. It switches arms through `globalThis.__CAP_LOCAL_ORDER`, which only the prototype read. Point it at the shipped switch instead (pass `fill: { …, localOrder }`), or the "walk" and "hash" columns will be identical.
- Do not touch the general fill. Its bias is per location block, not catalogue-wide, and changing it moves every hex's other-hex exposure at once.
- Do not reorder the cache. Several tests and the reserves walk it in emission order on purpose.
- If the rise clause passes but in-window does not (or the reverse), split the clause rather than skipping both.
- The master everyday batch (THR-1627 D3) is filed as its own ticket, blocked by this one. Do not author it here.

## D4 — The flip (design lane, run 2026-10-04a; decided under delegation, open to veto)

*Added 2026-10-04. The pickup built D1 behind the switch and shipped `'walk'` because the `start_local` guard rail (Done-when 5) failed: seed 42 753 → 620 (−17.7%), and strategic decisions fell 44 → 28 (seed 99 104 → 38). This section is the "separate decision" the Kill criteria asked for.*

**Decision.** Flip `CAP_FILL_LOCAL_ORDER` to `'template_hash'`, **after** [THR-1722](https://linear.app/threadbare/issue/THR-1722) lands. The `start_local` failure is a counting artefact, not lost work. The strategic drop is the agreed decision board doing its job, not the cap.

**Why: the `start_local` drop is a crash in the counter, not fewer encounters.** Full evidence: [`Docs/audits/2026-10-04-thr-1687-start-local-drop.md`](../audits/2026-10-04-thr-1687-start-local-drop.md). The planner looks a chosen encounter up in the legacy catalogue and then reads `template.name` (`phaseAgentDecision.ts:1895` on `dac362eb`). For the 86 encounter/reputation templates that exist only in the unified catalogue, that read throws *after* the action is pushed, and the per-agent `catch` swallows it. The encounter runs; its decision record and news line never happen. The fair draw reaches exactly those templates (`encounter.town.*` and `reputation.*` starts 14 → 196 on seed 42, 3 → 225 on seed 99), so more of its starts go uncounted. Measured on the #2180 branch, medium, 200 ticks:

| | seed 42 walk → hash | seed 99 walk → hash |
|---|---|---|
| recorded `start_local` | 753 → 620 | 706 → 645 |
| swallowed throws at that site | 134 → 314 | 123 → 339 |
| **encounters the planner actually began** | **886 → 934 (+5.4%)** | **824 → 980 (+18.9%)** |
| actions attempted (balance counter) | 977 → 1,037 | 912 → 1,099 |
| mortals alive at tick 200 | 653 → 762 | 803 → 964 |

**Why: strategic decisions fall because encounters now win the board, on the board's own terms.** Strategic actions and encounters compete on the unified decision board (THR-1292); the cap never sees strategic candidates. Board contests with a strategic candidate present held steady (952 → 946; 1,094 → 1,000), and strategic candidates won fewer of them (44 → 28, 4.6% → 3.0%; 104 → 38, 9.5% → 3.8%). Nothing about ambitions changed. The walk was hiding encounters the board scores higher, and that inflated their share. D2 already ruled that preference lives in scoring, never in the cap. Holding `'walk'` to protect ambitions would put a preference back into the cap by positional starvation, the THR-814 / THR-1614 failure.

**Options weighed.** *Hold at `'walk'`.* That keeps the expert ÷ novice keep rate at 0.09–0.14 and leaves the 16 expert encounters and the master batch (THR-1688) unreachable, to protect a number that turned out to be a crash. *Explain first in a separate measurement ticket.* That is done now (this section). *Retune the slot count.* The Kill criteria forbid it.

**Would change the call.** If Christian wants ambitions to keep their old share of mortal choices, that is a board-weight question for the strategic family (a new ticket), not a reason to keep the cap biased. Also: if the re-measure after THR-1722 shows *honest* `start_local` down more than 10% on seed 42.

### Revised Done-when for the flip (replaces Done-when 5's `start_local` clause; the rest of Done-when 1–7 stands)

- [ ] 8. **Order:** THR-1722 is merged to `main` first. The flip goes on PR #2180's branch (merge `main` in, set the constant), so one PR ships the switch and the flip and closes this ticket.
- [ ] 9. **Guard rail, honest count:** `start_local` (now recorded for every start) and *planner-begun encounters* on seed 42 and 99 within −10% of `'walk'`, same session, 200 ticks. Firings, drawable-fired and top-10 share as Done-when 5.
- [ ] 10. **Report, not a guard rail:** strategic board wins as a share of contests with a strategic candidate present, walk vs hash, seeds 42 and 99. Quote it in the closeout so the living-world owner can see it.
- [ ] 11. **Invariant:** un-skip *experts attempt harder content than journeymen* (remove its `TODO(THR-1687)`). The master success-rate ceiling (0.76 on seed 42 against 0.70) stays a known failure until the master batch lands: skip **that clause only**, with `TODO(THR-1688)`. Do not raise the ceiling.
- [ ] 12. The constant's doc-comment drops "TODO(THR-1687): flip …" and gains one line pointing at this section.

## Intent-judge verdict

**Allow** (2026-10-01, `fable`, cold context; impact class Reversible confirmed). Ten of eleven dimensions PASS; it re-derived the keep-rate ratios 0.15 / 0.77, 0.13 / 0.78, 0.10 / 0.81 from the raw output. One GAP, fixed before commit: § Systems design sent an unknown `CAP_FILL_LOCAL_ORDER` value to the hashed branch while the fail-soft table sent it to `'walk'`; step 1 now reads `!== 'template_hash'`. Advisory notes folded in: the seed-42 prototype form and the ticket-vs-reader baseline difference are now footnoted under the keep-rate table. It also noted that the 0.7 threshold was set with seed 42's 0.77 in hand and that the exposure explanation for the residual gap is asserted rather than measured; both stand as written, because the shipped pass fails the threshold five- to eightfold and Done-when 3 re-measures on the branch.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-01*

### NFP audit

**PASS-with-notes.** Tunability: the new `CAP_FILL_LOCAL_ORDER` switch and the unchanged `CAP_FILL_LOCAL_SLOTS` (30) and `MAX_SCORED_CANDIDATES` (40) are named. Inspectability: `encounter_filter` gains `capLocalOrder`, and the committed `cap-band.ts` reader allows re-measurement. Determinism: a pure hash of (agent, tick, template), no PRNG draw, ties broken by id. Fail-soft: the table covers no location, undefined tick, no hex, fewer templates than slots, and an unknown switch value. Narrative: the cap stays neutral and preference stays in scoring. Additive: `'walk'` restores the THR-1633 pass byte-for-byte and a unit test pins both. **Performance, the note:** the measured 1.72 → 1.62 ms per board shared the CPU and is "a direction, not a budget"; Done-when 5 holds whole-tick ms within +5%.

### Three-pillar audit

**PASS.** Engine is present and substantive: the file, function and own-hex pass are named, with a step-by-step design, the switch, the tick phase, a PRNG statement and a fail-soft table. Content is N/A with rationale (it unblocks the 16 expert and 8 master encounters; the master batch is filed as its own ticket). UI is N/A with rationale (nothing on screen reads the shortlist; THR-688 rule C; `Browser-verify exempt`). No required section is missing; Blast Radius is conditional and correctly omitted (15 and 70 importers). The Wiring table ties the engine change to the decision phase, the trace and its debug visibility. Substrate: the plan extends the existing Stage 5 cap and the THR-1633 own-hex pass, with no green-field duplication.

### Vision audit

**PASS-with-notes.** North star: experts attempting work that fits them supports a mortal "whose choices accumulate". Core loop: untouched; the cap sits upstream of scan → encounter → aftermath. Non-negotiables: nothing reaches the player as a number, and mortal sovereignty is unchanged. Design tensions: it extends "systemic emergence vs authored moments", since authored expert encounters now reach the mortals the simulation produces. Taste profile: declining to put a difficulty preference into the cap fits "narrative over mechanical perfection". **Note:** Done-when 4's rise clause is the kind of mechanical-neatness pressure the narrative tiebreaker warns about, but the plan explicitly bars tuning to a KPI. No contradictions.
