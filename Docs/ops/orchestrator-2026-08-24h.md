---
lane: tb-orchestrator
run: 2026-08-24h
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-24 (run h, ~17:30Z)

## Needs Christian

**The queue emptied, the agent sat idle for 55 minutes, and it is working again — but the reason it emptied turned out to be partly our mistake, not a shortage of work.**

Six runs today told you the shelf was thinning and the seventh told you it hit zero. That was true. What was also true, and nobody checked, is that **the pile of shelved work had been sorted using a rule you replaced two weeks ago.**

On 12 August you ruled that when an agent hits a fork about *how* to honour something already agreed — a calibration number, a fix that has to pick between three shapes — the agent decides, records why, and carries on, and you can veto it later. Your words: *"it is ok for an agent to modify the test as long as it is done with open eyes… we can always fix it if it drifts too much."*

Most of the shelved tickets were written **before** that, and each one ends with some version of *"this needs a design decision."* Every pass since has read that sentence and shelved the ticket again — including this lane's own passes this morning, which concluded the reserve was a decision backlog rather than a work backlog. **Two tickets I pulled off the shelf this hour turned out to be the agent's own call under your rule, not yours.** Both are now queued:

- [**The floor your nudges cannot lift a mortal off**](https://linear.app/threadbare/issue/THR-831) — checking whether the number guarding that promise is set right. It is a tuning verdict measured against a promise the game already makes, which your rule puts on the agent.
- [**Tooltips only answer to a mouse**](https://linear.app/threadbare/issue/THR-1095) — a keyboard player currently cannot read the game's own vocabulary: reaches, spheres, standing, doom. Three ways to fix it, all honouring the same accessibility rules already in the law book, so the choice is *how*, not *what*.

**This is a decision made, not a question asked** — say the word if either should have come to you instead and it comes straight back. And the honest caveat: I re-read two tickets, not all of them. Not everything on that shelf will flip. [Two factions sharing a coat of arms](https://linear.app/threadbare/issue/THR-854) really is yours — nobody but you can say what should tell two houses apart. But the shelf is smaller than this morning's report made it sound, and the next runs will keep re-reading it.

**What that changes about the two asks below: they are less urgent than they were an hour ago, and still the things that matter most.**

- **The six-encounter batch.** [The Encounter Factory](https://linear.app/threadbare/issue/THR-1043) has one content batch left in it and your sample verdict at the end. The brief is written and waiting on a yes in chat: six encounters on dangerous ground, where the world can finally hurt you. Worth six pieces of work; nothing else on this page is worth more than one.
- **Five pieces of scene art.** [The Meet-The-First scenes](https://linear.app/threadbare/issue/THR-876) run on substitutes because five images break the art rules. Regenerating them **spends image-generation credits** (five images plus retries), which is the only reason it has not run. Everything else about the job is settled.

## T1 — unblock sweep

Scanned `Todo` (17) and `Ready for Dev` (**0**). Promotion ceiling not engaged (shelf far below 15). `In Dev` held **4 items, all carrying `Parked`** — so at scan time the executor had nothing claimed *and* nothing to claim.

**Promoted — 2.** Both from the `Idea` reserve, both re-judged against `Docs/canon/process.md` § User review interface **rule 4** (Christian, 2026-08-12), both verified against `origin/main` at `f47074d5` before the write. State confirmed by `get_issue` re-query in each case; **no `assignee` key present on either**. Coordination block posted on each.

| Issue | Why it moved | Evidence |
|---|---|---|
| [THR-831](https://linear.app/threadbare/issue/THR-831) — `NUDGE_OFF_REACH_MAX_DIFFICULTY` calibrated against a partial hand | **Destination re-judgement.** The ticket's closing line (*"wants a design verdict rather than an executor picking a number"*) predates rule 4 by 16 days. Rule 4 bullet 1: *"Gate/test calibration is implementation, not creative standards."* The agreed outcome to test against exists and is quoted in the test's own header (`nudgeModel.test.ts:922`) — the rulebook clause *"there is a floor your nudges cannot lift a mortal off"* | No blocker ever named. Parent THR-827 `Done`. Audit doc `Docs/audits/2026-07-27-thr-821-nudge-headroom.md` resolves **LIVE** on `origin/main` |
| [THR-1095](https://linear.app/threadbare/issue/THR-1095) — shared `Tooltip` trigger not focusable (Laws 23/50) | **Destination re-judgement.** The ticket says *"pick one in design, do not let an executor guess."* Rule 4 bullet 2: *"Design-consequence code changes carry no chat gate… just do it."* All three candidate shapes honour the same canon outcome (Laws 23/46/50); the fork is only *how* | Premise re-verified: `git grep -n "tabIndex\|focusable"` over `src/components/shared/Tooltip.tsx` on `origin/main` returns **zero hits**. THR-1033 call-site precedent still present at `EncounterVeil.tsx:894–895`, `:1028–1029`. Blast radius measured, not estimated: **`<Tooltip` × 146 across 49 files** |

**Neither promotion required this lane to make the game call.** Rule 4's prescription is that the *executor* decides, records the pick and reasoning on the issue, and invites a veto. Both coordination blocks say so in those words. This lane judged destination only.

Each block also carries a correction the ticket body cannot: THR-831's Done-when names `FULL_HAND_DELTA`, a symbol THR-827 already renamed to `MEASURED_SUBSET_DELTA` — so half that ticket is done — and its central `0.55` figure was measured against the **retired** Darkhollow Vault exemplar, so the live hand sum needs re-deriving before any verdict.

### Correction to this morning's reserve conclusion

Runs e and g examined nine reserve items and concluded eight of the nine *"say in their own text that a decision is owed… The reserve is not a queue with a slow tap; it is a decision backlog wearing a ticket backlog's clothes."*

**That conclusion was reached with the wrong ruler.** All nine were judged on whether the ticket body asks for a decision — which is precisely the test rule 4 forbids: *"A ticket author writing 'this needs a decision' does not make it **Christian's** decision (the THR-1071 precedent)."* The correct test is *"is this a fork in what the game should **mean**, with no agreed outcome to test against?"*

Applied to two fresh items this run, **both flipped**. Stated at exactly that strength and no further:

- **The earlier eight were not re-run.** Whether they flip is unmeasured, and no number is claimed here.
- **The rule discriminates rather than flipping everything.** THR-854 (byte-identical heraldry) is a plausible counter-example that should *not* flip — *"what should distinguish two factions with the same reach profile and type?"* has no agreed outcome to test against and changes the heraldic vocabulary. That is meaning, and it is Christian's.
- **Recommended for the next run:** re-read the eight standing declines against rule 4 rather than carrying them forward unexamined. Carrying a decline forward is cheap and correct when its evidence is an unmet blocker; it is not when its evidence is a sentence written under a superseded rule.

### The idle window, measured

[THR-1211](https://linear.app/threadbare/issue/THR-1211) completed **16:35:39Z** ([PR #1597](https://github.com/christianspliid-ui/threadbare/pull/1597), merged as `f47074d5`), emptying the shelf. The first promotion this run landed **17:30:39Z**. **The executor had nothing to claim for ~55 minutes**, spanning one full hourly pickup slot.

Stated as an observation, **not filed**. It is one missed slot, under the materiality bar (~1 hour of lane time), and the process-work throttle bars scheduled lanes from filing process tickets regardless. Recorded for the retro. It is also not a lane defect in the usual sense — the shelf did not decay, it was drained by an executor working at full rate against a reserve that had been mis-sorted.

**9 declines carry forward unchanged** from [run a](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24.md) / [run b](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24b.md), plus THR-1218, THR-1220 and THR-1043 from runs e and f, and the five reserve verdicts from run g. Not re-derived — re-deriving a decline hourly is what trains the reader to skip this file. The caveat above applies to the subset judged on ticket-body language rather than on a blocker.

**4 wayfinder issues skipped unconditionally** (THR-1157, THR-1162, THR-902, THR-907) — a `wayfinder:*` label never enters `Ready for Dev`.

### Rule-0 discipline

**Both promotions are product work; the process budget is not engaged.** THR-831 is game-systems tuning (`Encounter Experience`, Content+Engine) whose agreed outcome is a rulebook clause. THR-1095 is a player-facing accessibility defect — a keyboard player cannot read the game's concept vocabulary — in `UI Visual Overhaul`. Neither touches delivery machinery, so neither is a process ticket under Rule 0, whatever its `Improvement` label says; the label records what a ticket is about, not what it has cost. **Zero process tickets promoted this run**; the at-most-one-in-three budget is untouched.

**Week's product-vs-process completion ratio: ~48 product : 3 process** (plus 9 design/research). Up one on the product side since run g — THR-1211 completed 16:35:39Z and now counts; classified **product**, since reputation dead reads are game-engine machinery rather than delivery machinery. Floors rather than exact totals, for the pagination reason recorded at 05:39Z.

**The starved-shelf clause fired at scan time and was answered with product work, not tidying** — which is the outcome the clause exists to produce. The upstream-supply headline still stands and is unchanged: the permanent fix is design rulings and the two director yeses, not this lane finding two more shelved tickets an hour.

## T1.5 — wayfinder sweep

**No open maps — fourth consecutive run.** The label-filtered query returns two issues, both `Done`: [THR-1157](https://linear.app/threadbare/issue/THR-1157) (typed game-state, closed 05:52Z) and [THR-902](https://linear.app/threadbare/issue/THR-902) (vertical slice, closed 14:27Z).

**Frontier: empty. AFK tickets resolved: 0. HITL tickets surfaced: 0.** `ORCH_WAYFINDER_AFK_MAX` was not approached and no subagent was spawned. **No ticket was claimed, resolved or closed by this lane this run** — the two writes above are state promotions that set no assignee, which is not a claim.

This tier has nothing to sweep until a map is chartered.

## T2 — design staging

**Trigger met, bound exceeded. Nothing staged — eighth consecutive run today.**

- **Trigger: met.** Non-`Deferral` program work in `Ready for Dev` is **0** against a floor of 2. Both promotions this run carry the `Deferral` label, so the shelf reads 2 by headcount and **0** by the measurement that gates this tier. Stated explicitly so the count is not misread as a refill of program work — it is a refill of deferral work, which is real work and is not what T2 measures.
- **Bound: exceeded.** `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, staged 5 days) and [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, 9 days) — against `ORCH_MAX_IN_DESIGN` of 1.

The full argument for why the constraint is drawdown rather than supply was made at 07:31Z and is not re-argued. Nothing is drawing from `In Design` at all; staging a third would deepen a queue with no reader.

## T3 — architecture health

**Not due — skipped, and no detector was run.** The daily sweep ran at 05:39Z ([`orchestrator-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24.md)) and Monday's weekly test-suite health pass ran with it ([`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops`); `ORCH_TESTHEALTH_DOW` is satisfied for the week.

`newFindings: 0` therefore means **no sweep ran**, not *a sweep found nothing*. No detector result of any kind appears in this report.

**Redundancy pass: not assessed this run.** The judgement pass over the interface map and systems inventory was done at 05:39Z and is not re-run within a day. Stated rather than omitted so its absence is not read as a clean result.

**Stalled work:** no issue crossed `ORCH_STALLED_PICKUP_THRESHOLD` (3). THR-1211 shows a single clean `Ready for Dev → In Dev → Done` pass; both promotions this run show one `Idea → Ready for Dev` transition and no prior pickup.

The `git show` / `git grep` checks quoted in § T1 are **not** detector results. They are promotion-time verification of two specific premises this run was about to act on, run against `origin/main` at `f47074d5` — not a survey of the tree.

## Escalations

**None raised this run, and none parked.** Agreed work was not exhausted — the opposite: two agreed items were found on a shelf that had been read as exhausted. Nothing was posted to the Discord escalation channel, because nothing this run needed it: rule 4 is explicit that a fork of this shape is decided and vetoed afterwards, not asked about beforehand.

**One item deliberately still not promoted.** [THR-876](https://linear.app/threadbare/issue/THR-876) (Meet-The-First scene art) is fully specified and asks nobody to decide anything about the game, but its own text carries a spend gate — *"this ticket spends image-generation credits (5 images, plus retries). Worth confirming with Christian before running the batch."* Promoting it would hand an unattended executor a spend decision, and the standing rule is that costs are disclosed before they are billed. **Rule 4 does not reach it**: a spend authorisation is not a fork in how to honour an agreed outcome. It stays surfaced as an ask, not promoted.

**Carried forward, unchanged and not re-argued:** the `Design/research/quest-hooks/` publication decision (run b), and the latent home-tree hazard logged in runs f and g. `threadbare-autosync.log` was not re-read this run; no finding pointed at it.
