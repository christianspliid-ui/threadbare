---
lane: tb-orchestrator
run: 2026-08-23
promoted: 1
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-08-23 (run a, ~07:24Z)

## Needs Christian

**The board is off zero. There is one job on the shelf again, and the builders can start it without you.**

It is a small one — a bit of character-backstory text that currently reads backwards. A mortal who is *Honest* is described as living in fear that their deception will be discovered; a mortal who is *Cunning* is described as being embarrassingly bad at lying. The two descriptions were written into each other's slots and have been rendering that way to players. It needs no ruling from you, so it went straight to the shelf.

Worth knowing **why it took four days to find**: it was filed in a column this lane never looks at. The hourly sweep reads two of the board's columns and the ticket was sitting in a third, so no run had ever seen it. That is fixed going forward — the wider sweep also turned up a second ticket that is already fixed and just never closed. Six previous runs reported "nothing promotable" in good faith; some of that was blindness, not an empty cupboard.

**None of that changes the real bottleneck, which is still six things sitting with you.** Unchanged since yesterday — restated compactly because the brief reads this section fresh each hour, not because anything moved:

1. **Two clicks, biggest release on the board.** [Are the Grateful Kin and the Unsafe Bridge worth meeting a second time?](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) A yes releases nine more written encounters; a no tells the line what the bar still misses. Waiting since 17 August.
   · [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin)
   · [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
2. **One sentence, and more content work is buildable immediately.** [Does a run's spine come from what your god remembers, or from a named campaign the world hands you?](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) Checked again this run — still no ruling.
3. **A yes/no.** [Should committing a hand of nudge cards carry ~1.6 seconds of held breath?](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) Yes wires the finished sound; no deletes it.
4. **Ten minutes of chat.** [Approve the brief for the Grateful Kin's return visit](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the) — your own rule puts brief approval before prose, so no lane can start it alone.
5. **Three design sessions, in the order you set them** — shared machinery, then the hunger vocabulary, then [making regions and nations real](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to). **Still the bottleneck.** Today's promotion is one small ticket; only a design session refills the shelf properly.
6. **Three sittings on your plate.** [The card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) has held the single design slot since 19 August. [The encounter slice verdict](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and [the type prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) are the other two.

One more that is not a question but does need you specifically: [the pixel-pass sweep](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) is nine batches of screenshots that only an attended session can take — one `npm run dev`, one browser, about twenty captures. It is parked and will stay parked until you sit down with it.

**If you only do one thing:** play the two encounters. Two clicks, and nine encounters are waiting behind the answer.

## T1 — unblock sweep

Scanned 18 `Todo` and 0 `Ready for Dev` state-filtered, then **50 `Idea`** — the state this lane's scan step does not name (finding below). `orderBy:"priority"` not passed (errors at runtime, impediment #49); sorted in memory.

**Promoted 1. Filed 0. Shelf at scan: 0. WIP: zero live claims — all three `In Dev` items are deliberate parks.**

### Promoted

[**THR-1187**](https://linear.app/threadbare/issue/THR-1187/fear-strata-honesty-cunning-poles-read-inverted-the-positive-body) — FEAR strata: `honesty_cunning` poles read inverted. `Idea` → `Ready for Dev`, 07:31:23Z, verified by re-query (`status: Ready for Dev`, no `assignee` key present). [Coordination block posted](https://linear.app/threadbare/issue/THR-1187/fear-strata-honesty-cunning-poles-read-inverted-the-positive-body) 07:32:06Z.

```
[orchestrator] T1 promote THR-1187: blockers none (blockedBy empty; parent THR-625 Done).
  Zero comments — no standing retire verdict. No plan doc named. Defect re-verified live in
  the tree before promoting, not taken on the description's word.
```

**The defect was confirmed in the working tree, not inferred from the ticket:**

```
src/data/strand-content.ts:28    VALUE_LABELS.honesty_cunning = ['Honest', 'Cunning']
src/engine/backstoryResolvers.ts:418   pole = pairValue >= 0 ? 'positive' : 'negative'
src/data/backstory-content.ts:645      honesty_cunning_positive → {value}="Honest",
                                       six bodies about practising deception
src/data/backstory-content.ts:654      honesty_cunning_negative → {value}="Cunning",
                                       six bodies about being bad at deception
```

**Why this promotes when the Todo shelf did not.** It is a bug — text rendering wrongly on a player surface — and bug fixes are inside the agreed remit. Its description says the swap was not made "inside a content-expansion ticket", which is a scoping statement about THR-625, not a referral to Christian: the Scope section asks for a fix plus a pinning assertion, and the deliverable is a repair, not a recorded ruling.

**This is deliberately distinguished from run i's reversed promotion of THR-1195**, because the surface reasoning looks similar and the distinction is what makes one right and the other wrong:

| | THR-1195 (reversed) | THR-1187 (promoted) |
|---|---|---|
| Deliverable | "A recorded **decision** on what a Divine Herald is" | A fix plus an assertion |
| Prior assessment | Deliberately declined by run h four hours earlier, on identical evidence | **Never assessed by any run** — invisible in `Idea` |
| Blast radius | One word puts heralds into the Maslow pipeline, the encounter pool and every agent sweep | Two content files and a resolver; both options enumerated, small, reversible |
| Nature | Unbuilt design | Live player-visible defect |

Reversing a considered decline on unchanged evidence is churn. Assessing a candidate a scan gap had hidden is not the same act, and this run is not re-litigating run h or run i.

### Not promoted — already shipped

[**THR-1088**](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) — Law 13, legacy intervention row prints `+3% success`. Came up as a promotion candidate; the pre-promotion check found **the defect is gone**. THR-1121 ("the encounter veil stops selling odds", PR [#1474](https://github.com/christianspliid-ui/threadbare/pull/1474)) completed 2026-08-15T09:47Z — four days *after* THR-1088 was filed — and retired the stance-purchase mechanic outright:

```
src/components/Game/EncounterVeil.tsx:2493
  // THR-1121 — the `+N% success` branch that stood here is gone with the
  // mechanic it reported. A choice no longer buys odds ... `fate decides` stays
```

Done-when 3 is satisfied twice over (`EncounterVeil.test.tsx:237` and `encounterVeilChoiceLaws.test.tsx`, the latter over a non-empty option set). The two surviving percent formatters in that file feed only the resolution readout, which carries its own *"designer view only (THR-1124)"* header — lawful under Law 13, and **not** this ticket's residue. [Evidence posted to the ticket](https://linear.app/threadbare/issue/THR-1088/legacy-intervention-row-renders-raw-percentages-3percent-success-on-a) recommending closure. This lane does not set terminal states on non-wayfinder issues, so it is left open for whoever holds it.

### Declines

Run i re-derived every `Todo` candidate at 18:26Z yesterday and run h did the same four hours before that. Those declines are **carried, not re-derived** — nothing on the `Todo` shelf has moved since (checked: no `updatedAt` movement on any candidate other than relation bumps). Re-reading eighteen tickets a third time in thirteen hours would be the "dump" this lane is told to avoid.

The two handoffs run i asked this run to check were both discharged:

* **THR-1198 — no ruling.** `updatedAt` is still identical to `createdAt` (2026-08-22T13:14:51Z); the issue has never been commented on. Decline stands. Note it sits in `Idea`, which is *why* it never appeared in a `Todo` scan.
* **THR-1130 — no ruling.** Latest comment remains the 14:03:17Z park restoration by `tb-opus-pickup`, which is a repair note, not a verdict. Decline stands.

Fresh declines from the `Idea` sweep, one line each:

```
[orchestrator] T1 skip THR-1026: wrong destination — the ticket's own words: "a design question
  the ticket did not ask and an executor should not answer alone". The question is game fiction
  ("a merchant_consortium posting an expedition contract is a different fiction"). Christian's.
[orchestrator] T1 skip THR-1053, THR-964, THR-965, THR-879: wrong destination — each asks for a
  settled ruling ("settle which is right") before any code is writable.
[orchestrator] T1 skip THR-871, THR-882, THR-835, THR-984, THR-949, THR-852, THR-752, THR-893:
  process/infrastructure work. Per the 2026-08-10 throttle these are the weekly retro's to
  promote, not a scheduled lane's, and none carries a quotable above-bar loss plus a
  cost/benefit line.
[orchestrator] T1 skip THR-1185, THR-876, THR-1094, THR-1095, THR-854, THR-1024, THR-70,
  THR-1187(promoted), remaining Idea items: doc drift, art regeneration, or design calls.
  Doc drift is explicitly non-qualifying under Rule 0.
```

Skipped without assessment: THR-1043, THR-791, THR-877 (assigned to Christian), THR-870 (parked programme), THR-789, THR-1156 (programme epics), THR-1157, THR-1162, THR-902, THR-907 (wayfinder — T1.5's input, never `Ready for Dev`).

**Promotion ceiling did not apply** — shelf was 0, nowhere near `QUEUE_BACKED_UP_MIN` (15), and 1 promotion is well inside `ORCH_PROMOTE_BATCH_MAX` (5).

### Parks verified intact

All three re-queried directly via `get_issue` rather than read off the list — **each returns no `assignee` key**, carries `Parked`, holds `In Dev`:

| Issue | Labels | Park |
|---|---|---|
| [THR-1130](https://linear.app/threadbare/issue/THR-1130) | `Parked, Content` | intact |
| [THR-1133](https://linear.app/threadbare/issue/THR-1133) | `Parked, Deferral, UI` | intact |
| [THR-1168](https://linear.app/threadbare/issue/THR-1168) | `Parked, Deferral, UI, Improvement` | intact |

Checked directly because THR-1130 and THR-1168 both carry PR attachments — the impediment #607 / #657 hazard where opening or merging a PR naming an issue id restores its nulled assignee. **No decay this run.**

**Stalled-work check.** THR-1130 now shows **3** `Ready for Dev → In Dev` transitions (08-15T21:03, 08-17T18:03, 08-22T14:02), which touches `ORCH_STALLED_PICKUP_THRESHOLD`. **Not surfaced as stalled, and the reason matters:** the threshold exists to catch an issue *failing repeatedly at pickup*. All three of these are the opposite — a claim, then two erroneous releases by other lanes that were repaired back into the park (the 08-22 pair is documented on the ticket as the stale-claim sweep releasing a `Parked` issue). Counting a repair as a failed pickup would make the detector fire on the lane that fixed the problem. THR-1133 and THR-1168 sit at 1 each.

## T1.5 — wayfinder sweep

Two open maps. Both frontiers recomputed live from a `parentId` query this run rather than carried. **AFK tickets resolved: 0** — and not through failure: `ORCH_WAYFINDER_AFK_MAX` (2) was never approached, because both maps have burned down every `wayfinder:research` and agent-doable `wayfinder:task` ticket they had. What remains on each is exactly the human-in-the-loop half this lane must not touch. **Twelfth consecutive run in that state.**

```
[orchestrator] T1.5 map THR-1157 "Typed game-state architecture — machinery + first wave":
  7 children, 6 Done (THR-1158, THR-1159, THR-1160, THR-1161, THR-1163, THR-1176).
  Frontier 1 — THR-1162 (wayfinder:prototype), unassigned, HITL. Surfaced. Unchanged.
[orchestrator] T1.5 map THR-902 "Encounter experience redesign — vertical slice":
  8 children, 7 Done. Frontier 0 by the rule — sole open child THR-907 (wayfinder:prototype)
  carries an assignee (Christian), which drops it from the frontier set. On his plate.
```

**Neither map is cleared.** THR-1157 still needs three wave-1 plan docs that do not exist; THR-902 still needs its verdict sitting. Both are one attended session from clearing — these are not long tails.

## T2 — design staging

**Triggered on the number, blocked by the bound — third consecutive run in that shape.**

Non-`Deferral` items in `Ready for Dev`: **0**, against `ORCH_PROGRAM_WORK_FLOOR` of 2. The trigger fires. Note today's promotion does not change this: THR-1187 carries the `Deferral` label, so the program-work count is still zero. That is the measurement working as designed — a deferral on the shelf is not program supply.

**`ORCH_MAX_IN_DESIGN` (1) blocks staging regardless.** The lane-staged slot is held by [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card), untouched since 2026-08-19T02:31Z — **about four days**, well past the 48h re-surface mark, so it is re-surfaced under Needs Christian rather than re-staged. (`In Design` reads 2 in raw terms; THR-790 is assigned to Christian and was never staged by this lane, so the bound is 1 of 1.)

*Correction to run i, minor and non-load-bearing:* it put THR-1002's age at ~112 hours. Measured from its `updatedAt` of 2026-08-19T02:31Z that would have been ~88 hours at the time. The conclusion — well past 48h, re-surface not re-stage — is unaffected, and today's figure is ~101 hours by the same measure.

**The attended-design queue is six deep against one staging slot**, and zero attended design sessions have run in six days. Staging a seventh item would add to a queue nothing is draining, so the correct action is to say so rather than to stage.

## T3 — architecture health

**Due and run** — first sweep past `ORCH_HEALTH_SWEEP_HOUR` (6 local; this run started 09:24 local). Diffed against [`Docs/ops/orchestrator-2026-08-22.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-22.md) on `ops`, a one-day span.

| Detector | Result | vs. 2026-08-22 run a |
|---|---|---|
| `generate-interface-map:dry` | 72 contracts — **7 LEAKED** | **Identical**, count *and* membership: `attachment-activated-effects` (THR-720), `attachment-edge-modifiers` (THR-997), `branch-decision-writes-archetype-drift`, `compulsion-card-plants-agent-decision-bias`, `nudge-card-cost-channels-detection-and-doom` (THR-883 ×3), `undertow-card-drifts-mortal-values` (THR-1130), `trait-ref-authoring-vocabulary` (THR-800). No decay, no improvement |
| `sweep:rank-reach` | **PASS** — seed 42, medium, 900 ticks. 60 rank-gated templates reachable, 0 blocked, 0 unowned; 13 apex holders at tick 900 | Identical. Took ~9 min to first output — run a's "needs a patient timeout" note held, and was worth having |
| `check:process` | exit 0. `check:authoring-brief` **stale** vs `2026-04-16-systemic-wiring-guide.md`; `check:design-wiki` OK (24 pages); `check:wiki-freshness` OK (24, no stale); three generators up to date | Stale authoring-brief unchanged. **The core lint inspected zero files this run** — see below |
| `check:canon-staleness` | **22 warnings** | **+1 — the only new finding this sweep** |

`__DEBUG.validateTraitRefs()` is browser-only and cannot run headless. **Not run, and not reported as clean.**

### New finding — one new canon-staleness row, and it is a real edit

`Docs/canon/design-governance.md` is now stale against `Docs/plans/wiring-checklist.md` (`last_reviewed: 2026-07-26` vs plan mtime 2026-08-22T13:24:39Z). Yesterday design-governance carried one row; it carries two now. Every other page's count is unchanged, so 21 → 22 is this single row.

**Verified as an authored change, not an mtime artefact.** Two plan files share that exact timestamp, which is the signature of a checkout rather than an edit — so it was checked against git rather than asserted:

```
44182b87  2026-08-22 15:24:39 +0200  feat(thr-1197): the campaign's spine narrates from its authored prose
          touches Docs/plans/wiring-checklist.md AND Docs/plans/2026-04-16-systemic-wiring-guide.md
```

That commit landed at 13:24Z, ~6 hours after yesterday's sweep, which is exactly why the row is new today. **This is documentation drift and does not qualify under Rule 0** — logged, not ticketed.

### `check:process`'s core lint inspected nothing this run — not new, and worth stating plainly

The script exits 0 while its own first line reads:

```
check:process skipped (no candidate files found).
```

So the core process lint measured **zero files**, and the three Linear-backed sub-checks run a flagged as unmeasured (`LINEAR_API_KEY` unset — recent plan references, orphan issues, Ready-for-Dev handoff keywords) were not even reached this run. This is the same class run b recorded, and the same shape as impediment #409 (`lint:plan-doc` with no args lints zero files and always reports a pass). **Not filed** — no loss measured, and these checks do run in CI where they are load-bearing. Recorded so the `check:process` row above is not read as a clean bill of health: what it verified this run was the five chained sub-checks, not the lint the script is named after.

### Redundancy pass

**Not assessed this sweep.** No fresh end-to-end pass over `Docs/canon/interface-map.md` or `Docs/canon/systems-inventory.md` happened, and no carried finding was re-checked. Nothing in this section should be read as a redundancy result.

To keep the categories clean: this run's THR-1088 finding is **duplicated *work*** — a ticket overtaken by a shipped fix — not **redundant *code***, which is what D7 asks about. They are different things and the first does not discharge the second.

### Weekly test-suite health

**Not due.** `ORCH_TESTHEALTH_DOW` is Monday (1); today is Sunday. Last pass: `Docs/ops/test-suite-health-2026-08-17.md`. Nothing about suite health is asserted here. Next pass falls tomorrow.

## Escalations

**A scan-gap finding this lane should own, recorded here rather than ticketed.** The skill's T1 step 1 specifies two state-filtered calls — `Todo` and `Ready for Dev` — while step 2 says to parse blockers "for each `Todo` / `Idea` candidate". `Idea` is named as a candidate class and is never fetched. The consequence is measurable rather than theoretical: THR-1187 sat unassessed for four days and THR-1088 sat open for eight after being fixed, both in `Idea`, across roughly seven consecutive runs that reported the shelf unfillable. Those reports were made in good faith and were wrong about the cupboard.

Adding the `Idea` sweep cost one extra call this run and produced the run's only promotion. **Not filed as a ticket** — the 2026-08-10 throttle makes the weekly retro the single promotion point for process findings, and this one is a skill-text amendment rather than a code defect. Handed to the retro with the two ticket ids as its evidence.

**The "agreed work exhausted" condition did *not* fire this run**, for the first time in several. There was agreed work; it was just in a column nobody was reading.

**No Discord escalation posted.** Channel `1530183488333152287` is `keep-work-flowing-cc`'s doorbell, not an idle escalation channel — posting there would make this lane a second writer on a surface non-negotiable 2 assigns elsewhere, and would duplicate a message Christian already receives. `keep-work-flowing-cc` step 2.6 folds this report's `## Needs Christian` into the next brief at :45, which is the built route over the same channel.

**One note for the next run.** The `Idea` shelf has now been swept once; do not re-derive all fifty. The cheap checks remain THR-1198 and THR-1130 for ruling comments — a ruling on either is immediately filable as an execution ticket, and that is still the only unattended path back to a non-empty *program* shelf. THR-1187 should be claimed by `tb-opus-pickup` at :01; if it is still unclaimed two runs from now, check whether its coordination block satisfies `pull-work` Step 3 rather than assuming the queue is simply idle.
