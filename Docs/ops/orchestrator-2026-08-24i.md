---
lane: tb-orchestrator
run: 2026-08-24i
promoted: 2
filed: 0
resolved: 0
newFindings: 0
needsChristian: true
---
# Orchestrator — 2026-08-24 (run i, ~18:30Z)

## Needs Christian

**Two more shelved jobs came back off the shelf this hour, and one of them had been ready to build since 2 August. Nobody had re-read it.**

Last hour's brief told you the shelved pile had been sorted with a rule you replaced on 12 August, and that two tickets flipped when re-read. This hour re-read four more. **Two flipped, one stayed yours, and the fourth turned up something worse than a mis-sort:**

- [**Two kinds of number wearing the same dots**](https://linear.app/threadbare/issue/THR-977) — on the encounter test panel, one row says *how good this person is* and the row beneath it says *how much this thing shifts the odds*, and both draw the identical little pip row. A player cannot tell them apart. The ticket was shelved on 2 August because it collided with a question about pip icons **that you answered two hours later the same day** — that answer shipped, and the collision has been gone for 22 days. Nothing re-read the ticket, so it sat.
- [**Conditions do not explain themselves**](https://linear.app/threadbare/issue/THR-1094) — the game tells the player their agent is *exhausted*, *grieving*, *cursed*, and hovering the word gives nothing back. Seven conditions, seven short lines of copy. The law book already says every named thing carries its explanation, so this was never a question about the game, only about how to wire it.
- **[What the run is about](https://linear.app/threadbare/issue/THR-1198) stayed yours, and deliberately.** 48 pieces of written campaign prose reach no player because the code picks the run's spine one way and the writing assumes another — *does the run come from what your god remembers, or from a named campaign the world offers?* That is a question about what the game means. It is not an agent's to answer and it was not answered.

**Also: an agent overruled a ticket this hour and you may want to know.** [The nudge floor](https://linear.app/threadbare/issue/THR-831) that last hour's brief queued has already shipped — and the agent's verdict was that the proposed retune was *arithmetically backwards*, so the existing number stands unchanged. That is your 12 August rule working as designed: it decided, wrote down why, and it is yours to veto.

**The two standing asks are unchanged and still the things that matter most.**

- **The six-encounter batch.** [The Encounter Factory](https://linear.app/threadbare/issue/THR-1043) has one content batch left in it and your sample verdict at the end. The brief is written and waiting on a yes in chat: six encounters on dangerous ground, where the world can finally hurt you. Worth six pieces of work; nothing else on this page is worth more than one.
- **Five pieces of scene art.** [The Meet-The-First scenes](https://linear.app/threadbare/issue/THR-876) run on substitutes because five images break the art rules. Regenerating them **spends image-generation credits** (five images plus retries), which is the only reason it has not run.

## T1 — unblock sweep

Scanned `Todo` (18) and `Ready for Dev` (**1** — [THR-1095](https://linear.app/threadbare/issue/THR-1095), promoted at 17:30Z and still unclaimed). `In Dev` held 5, four of them `Parked`. Promotion ceiling not engaged (shelf far below 15).

**The executor consumed another ticket in the hour.** [THR-831](https://linear.app/threadbare/issue/THR-831) — promoted by run h at 17:30:39Z — was claimed and **shipped as [PR #1598](https://github.com/christianspliid-ui/threadbare/pull/1598), merged as `6cd105cf`**, inside the same hour. At scan time Linear still showed it `In Dev`; `origin/main` already carried `Docs/status/2026-08-24-thr-831.md` and the fix commit `5060b007`. Run h's flip was correct, and the executor exercised rule 4 rather than bouncing: its verdict is that the ticket's proposed retune *"was arithmetically backwards"*, so `NUDGE_OFF_REACH_MAX_DIFFICULTY` stands. **That is the first shipped confirmation that the rule-4 re-read produces work an executor can actually finish**, not just tickets it can claim.

**Promoted — 2.** Both from the `Idea` reserve, both re-judged against `Docs/canon/process.md` § *User review interface* **rule 4** (Christian, 2026-08-12), both premises re-verified against `origin/main` at `6cd105cf` **before** the write. State confirmed by `get_issue` re-query in each case, each showing a single clean `Idea → Ready for Dev` transition and **no `assignee` key present**. Coordination block posted on each.

| Issue | Why it moved | Evidence |
|---|---|---|
| [THR-977](https://linear.app/threadbare/issue/THR-977) — factor-line `delta` mixes two scales | **A mutex the ticket named on itself, discharged 22 days ago and never re-read.** Its filing comment: *"Mutex with: THR-972 (…**if THR-972 splits cost from odds first, this ticket's option set narrows**)"* and *"filed into the backlog rather than Ready for Dev deliberately — the Done-when's first clause is a decision."* THR-972 shipped **2h20m later the same day** and split them. Its directive — *"pips mean only 'effect on the odds' everywhere (cards, forecast, and THR-970's factor lines follow mechanically)"* — is a director-reviewed verdict, now Done, which both discharges the mutex **and rules out the ticket's option 4** | THR-972 `completedAt` 2026-08-02T13:33:15Z, [PR #1268](https://github.com/christianspliid-ui/threadbare/pull/1268), `016fec4e`. Split verified live: `src/components/shared/OddsPips.tsx` exports both, *"`CostPips` renders an essence price as glyphs rather than a digit"*. Premise re-verified — `stepFactorLines.ts:138` `delta: safeCapability` vs `:180` `delta: value` |
| [THR-1094](https://linear.app/threadbare/issue/THR-1094) — `condition.*` resolves to nothing | **Two `[E]`-severity laws already rule it.** Law 1: *"Every game concept the player sees carries its presentation… A concept named in text only is a pattern violation."* Law 17: *"Every concept word carries a tooltip from the one registry… **New concepts register**."* The ticket's option 2 (rule conditions *not* a tooltip class) is not an alternative reading — it is a **law exemption**, and this ticket is not the surface that grants one. Only the *how* remains | `git grep -n "condition" -- src/engine/tooltipResolver.ts` on `origin/main`: **no routing branch**, two incidental hits (`:278` comment, `:399` prose). Prefix list at `:9–15` is exactly Law 17's seven. Scope bounded: `condition-trait-content.ts` carries **7** ids — `blessed`, `cursed`, `exhausted`, `grieving`, `inspired`, `terrified`, `wounded` |

**Neither promotion required this lane to make the game call.** Rule 4's prescription is that the *executor* picks, records the pick and reasoning on the issue, and invites a veto; both blocks say so in those words, and THR-1094's adds *"if you disagree after reading the laws, record that and stop."* This lane judged destination only.

Each block also carries a correction the ticket body cannot. THR-977's ticket describes **two** producers of `delta`; there are **four**, and three of them are contribution-shaped (`:180` modifier, `:210` carryover `forecastDelta`, `:281` reveal writing a literal `0` with a comment saying a reveal shifts no odds at all). The skill line is the lone outlier, which is a materially stronger argument for options 1/3 than the ticket's own two-way framing. THR-1094's block records that the registry key is `trait.condition.<id>`, so the fixture's `condition.exhausted` is wrong in *shape* as well as unrouted, and that Law 17's enumerated prefix list must be amended in the same PR or the law becomes false the day the fix ships.

### The rule-4 re-read, continued — and the counter-example that proves it discriminates

Run h recommended re-reading the standing declines against rule 4 rather than carrying them forward unexamined, on the grounds that *"carrying a decline forward is cheap and correct when its evidence is an unmet blocker; it is not when its evidence is a sentence written under a superseded rule."* Four were re-read this run. **Stated at exactly that strength and no further:**

- **[THR-1198](https://linear.app/threadbare/issue/THR-1198) (48 mandate strings unreachable) stays declined, and it is the run's most useful result.** Its fork is *"does the run's spine come from **what the god remembers** (remembrance) or from **a named campaign the world offers** (templates)?"* — with the ticket's own note that *"today the code says the former and the content says the latter."* That is a fork in what the game **means**, with no agreed outcome to test against, which is rule 4's escalation test met rather than failed. It is `Medium` priority and the most player-valuable item examined, and it was still not promoted. **The re-read is not a device for emptying the shelf.**
- **[THR-1026](https://linear.app/threadbare/issue/THR-1026) stays declined** on the same reading run g gave it: its Done-when 1 is *which of the twelve factions commission ruin delves*, which is world meaning.
- **The earlier declines were not exhaustively re-run.** Six remain unexamined against rule 4 (THR-964, THR-893, THR-854, THR-1189, THR-1114, THR-175). Run h already flagged THR-854 as one that should *not* flip. No number is claimed about the rest.

**What is new this run and was not visible last hour:** THR-977 did not need rule 4 at all in the end. Its own filing comment named the exact condition that would unblock it, that condition was met **two hours and twenty minutes later on the same day**, and no pass in 22 days re-read the comment against the board. Rule 4 was how it got re-examined, but a plain "re-read the self-declared unblock conditions on shelved tickets" sweep would have caught it in August. **That is a different defect from the mis-sort run h found, and it is the more mechanical of the two** — a shelved ticket that states its own unblock condition is machine-checkable in a way a superseded-rule judgement is not. Recorded for the retro; not filed (scheduled lanes do not file process tickets, and one instance does not clear the materiality bar).

### Rule-0 discipline

**Both promotions are product work; the process budget is not engaged.** THR-977 is a player-legibility defect on the encounter surface (`Encounter Experience`, UI+Engine) — two adjacent rows meaning different things and reading identically. THR-1094 is a player-legibility defect in `UI Visual Overhaul` — named conditions that explain nothing on hover. Neither touches delivery machinery, so neither is a process ticket under Rule 0 whatever its `Improvement` label says; the label records what a ticket is about, not what it has cost. **Zero process tickets promoted this run**; the at-most-one-in-three budget is untouched.

**Week's product-vs-process completion ratio: ~49 product : 3 process** (plus 9 design/research). Up one on the product side since run h — THR-831 merged at `6cd105cf` this hour and counts product (nudge-model tuning is game systems). Floors rather than exact totals, for the pagination reason recorded at 05:39Z.

**The starved-shelf clause fired at scan time and was answered with product work, not tidying.** Shelf after this run: **3 unclaimed** (THR-1095, THR-1094, THR-977) against 1 at scan. The upstream-supply headline is unchanged and is not re-argued: the permanent fix is design rulings and the two director yeses, not this lane finding two more shelved tickets an hour.

## T1.5 — wayfinder sweep

**No open maps — fifth consecutive run.** The label-filtered query returns two issues, both `Done`: [THR-1157](https://linear.app/threadbare/issue/THR-1157) (typed game-state, closed 05:52Z) and [THR-902](https://linear.app/threadbare/issue/THR-902) (vertical slice, closed 14:27Z).

**Frontier: empty. AFK tickets resolved: 0. HITL tickets surfaced: 0.** `ORCH_WAYFINDER_AFK_MAX` was not approached and no subagent was spawned. **No ticket was claimed, resolved or closed by this lane this run** — the two writes above are state promotions that set no assignee, which is not a claim.

This tier has nothing to sweep until a map is chartered.

## T2 — design staging

**Trigger met, bound exceeded. Nothing staged — ninth consecutive run today.**

- **Trigger: met.** Non-`Deferral` program work in `Ready for Dev` is **0** against a floor of `ORCH_PROGRAM_WORK_FLOOR` (2). All three shelf items carry `Deferral`, so the shelf reads 3 by headcount and **0** by the measurement that gates this tier. Stated explicitly so it is not misread as a refill of program work — it is a refill of deferral work, which is real work and is not what T2 measures.
- **Bound: exceeded.** `In Design` holds **2** — [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, staged 2026-08-19, **5 days**) and [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, since 2026-08-15, **9 days**) — against `ORCH_MAX_IN_DESIGN` of 1.

The full argument for why the constraint is drawdown rather than supply was made at 07:31Z and is not re-argued. Nothing is drawing from `In Design` at all; staging a third would deepen a queue with no reader, which is the same defect as promoting into a queue with no executor.

**One thing this run adds, and it is a caution rather than a finding.** The two rule-4 re-read runs have now returned four promotable tickets from a shelf that reported itself decision-blocked. That is a real recovery, and it is also finite: three of the four were `Low` priority and none is program work. **A re-read that keeps finding shelved deferrals does not substitute for design throughput**, and this lane should not let a refilled shelf read as the supply problem being solved. It is not.

## T3 — architecture health

**Not due — skipped, and no detector was run.** The daily sweep ran at 05:39Z ([`orchestrator-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-08-24.md)) and Monday's weekly test-suite health pass ran with it ([`test-suite-health-2026-08-24.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-08-24.md) is on `ops`); `ORCH_TESTHEALTH_DOW` is satisfied for the week.

`newFindings: 0` therefore means **no sweep ran**, not *a sweep found nothing*. No detector result of any kind appears in this report.

**Redundancy pass: not assessed this run.** The judgement pass over the interface map and systems inventory was done at 05:39Z and is not re-run within a day. Stated rather than omitted so its absence is not read as a clean result.

**Stalled work:** no issue crossed `ORCH_STALLED_PICKUP_THRESHOLD` (3). THR-831 shows one clean `Ready for Dev → In Dev` pass ending in a merge; both promotions this run show one `Idea → Ready for Dev` transition and no prior pickup.

The `git grep` / `git show` / `git log` checks quoted in § T1 are **not** detector results. They are promotion-time verification of the specific premises this run was about to act on, run against `origin/main` at `6cd105cf` — not a survey of the tree.

## Escalations

**None raised this run, and none parked.** Agreed work was not exhausted — the opposite, for the second hour running: two more agreed items were found on a shelf that had been read as exhausted. Run g recorded a threshold — *"if the shelf is still zero at tomorrow's first run, the ping is the escalation"* — and that threshold is not met: the shelf is 3, not 0. Rule 4 is explicit that a fork of this shape is decided and vetoed afterwards, not asked about beforehand, so nothing this run needed the Discord channel.

**Carried forward, unchanged and not re-argued:**

- **[THR-1088](https://linear.app/threadbare/issue/THR-1088) — a verdict with no consumer, fourth sighting.** Verified as already-shipped by this lane on 2026-08-17 and 2026-08-23, each with a full evidence comment recommending closure; run g re-verified it a third time. Deliberately **not** re-verified this run, and deliberately not promoted: this lane does not set terminal states on non-wayfinder issues, and spending an executor slot on a ticket whose entire content is "close this" is a worse trade than leaving it while the shelf holds real work. The fix remains one lane consuming a verdict that is already written.
- **The `Design/research/quest-hooks/` publication decision** (run b) — still your call, still the only thing that makes the 1,200-hook corpus visible to agents.
- **The latent home-tree hazard** logged in runs f and g: `Docs/plans/encounters/border-perils-brief.md` remains untracked in the home tree and absent from `origin/main`. `threadbare-autosync.log` was not re-read this run; no finding pointed at it, and the THR-937 collision only fires when `main` commits that exact path.

Bare `THR-XXX` references throughout — nothing in this report is intended to close anything.
