---
lane: tb-orchestrator
run: 2026-09-10o
promoted: 1
filed: 0
resolved: 0
newFindings: 1
needsChristian: true
---
# Orchestrator — 2026-09-10 (run o, ~19:33Z)

## Needs Christian

**The build queue emptied this hour, and then refilled — with a piece of work that has been sitting one comment away from ready for 26 days.**

Here is what happened, and the one judgement call in it you may want to overrule.

There is a quality check that every encounter must pass before it ships. One of its rules demands that authors hand-label every game concept mentioned in an aftermath — the little "here's what changed in the world" panel at the end of an encounter. **That one rule fails all 191 encounters in the game**, and it is the single reason two written encounters — *Snow on the Pass* and *Riders Behind the Caravan* — have been thrown out of two consecutive content batches over about three weeks. The authors kept writing them and kept binning them, because nobody had ruled on whether the rule was right.

**It probably is not right.** Back on 15 August someone checked the actual code and found the game *already* does that labelling automatically — the rule is asking authors to hand-write something the machine does for free. They wrote that finding on the ticket, with the exact file and line numbers, and then stopped, because changing the rule brushes up against a ruling you made and they did not want to overstep.

**And there it sat.** Every lane that looked at it since — including this one, repeatedly, and the tidy-up lane again this morning — said "this needs a design session" without noticing that the question the ticket was waiting on **had already been answered on the ticket itself.** The waiting was for nothing.

**What I did:** re-checked that finding against the current code myself (it holds — the automatic labelling is right there in the shipped file), and put the ticket into the build queue with the evidence attached, rather than sending it to a design session that would have re-derived a conclusion already written down.

**The call you may want to veto:** I treated "is this quality rule calibrated correctly?" as a *tuning* question the agents can settle from evidence, not a *creative* question about what the game should be. That matches what you told us on 12 August — calibration is ours, decide and invite a veto rather than block. But it does touch your earlier "no exemptions" ruling, so you should know I made it. **If you would rather rule on this one yourself, say so and it comes straight back out of the queue.** Nothing is lost either way — the ticket is not claimed yet.

[The ticket, with the full reasoning](https://linear.app/threadbare/issue/THR-1053/the-composition-contract-requires-concepts-on-every-aftermath-change) · [the batch that keeps binning the two encounters](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**One thing needs a single click from you.** [The three new words](https://linear.app/threadbare/issue/THR-1380/ul-proposal-calling-moment-follow-the-undertaking-surface-vocabulary) — *calling, moment, follow* — that you approved at 18:13Z turned out to have already shipped eight days ago under another ticket. An executor picked it up at 19:05Z, verified every line of it against the live code, and left it waiting on a **Done** click, because no automated lane here is allowed to close a ticket. There is no work left in it.

**Your three design maps are unchanged** — nine questions, all needing you, all named in [run k](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10k.md). Not re-listed; nothing moved. Best ways in remain the two fight loops — [fighting a monster](https://linear.app/threadbare/issue/THR-1263) and [two people fighting](https://linear.app/threadbare/issue/THR-1264). Open a chat and say "work the map".

*[Traits wave 2](https://linear.app/threadbare/issue/THR-790) — run n asked whether you still intend to run that design pass yourself. That question stands and is deliberately **not** re-asked this hour; asking hourly is how a standing question stops being read.*

## T1 — unblock sweep

Scanned `Todo` (31) and `Ready for Dev` (**0**) — two state-filtered calls, sorted in memory. Board read confirmed live (precheck reported `linear=nokey`, which is reachability-only and never gates a run; the MCP connector answered).

**Board delta since [run n](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10n.md) (18:30Z).**

| Issue | Moved | By |
|---|---|---|
| [THR-1452](https://linear.app/threadbare/issue/THR-1452) | `In Dev` → `Done`, shipped as `222ef12c` under [PR #1884](https://github.com/christianspliid-ui/threadbare/pull/1884) | the executor |
| [THR-1380](https://linear.app/threadbare/issue/THR-1380) | `Ready for Dev` → `In Dev` 19:05Z, verified-shipped, **assignee cleared and parked** | the executor |
| — | **shelf 1 → 0** | consequence of the above |

Run n's THR-1380 finding did exactly its job: the executor claimed it, re-verified the eight rows against `origin/main` @ `4d0b3bee` independently, wrote no diff, and parked it for a one-click close. That is the correct outcome for a shipped-under-a-sibling ticket, and it emptied the shelf.

### Promoted — 1

`[orchestrator] T1 promote THR-1053: blockedBy empty (verified includeRelations); stated precondition "verify the linker's coverage of detail" discharged on-ticket 2026-08-15, re-verified by construct on origin/main@4d0b3bee → Ready for Dev (program: Encounter Experience)`

**[THR-1053](https://linear.app/threadbare/issue/THR-1053) — the Composition Contract's `concepts` rule.** This reverses two prior routings (this lane's own repeated decline, and the grooming lane's at 07:19Z today), so the reasoning is recorded on the ticket in full rather than asserted here.

**The finding — new, and the reason this run is not another "barred" report.** The ticket sets its own precondition in its body: *"Verify the linker's actual coverage of `detail` before deciding — that fact settles most of it."* **That verification was posted to the ticket on 2026-08-15, with file-and-line citations.** Every subsequent read declined it as *"needs a design pass"* without engaging the comment that had already discharged the precondition. The ticket has been promotable for 26 days; the routing never noticed, because each pass read the *description's* framing (*"a design call and not a technical verdict"*) and inherited the previous decline instead of reading the thread.

**Re-verified this run, by construct rather than by line number** — the 08-15 citations had drifted, so trusting them would have been the exact defect being corrected:

| Fact | Today, on `origin/main` |
|---|---|
| `body` **is** the change's `detail` | `buildAftermathConsequences.ts:660` — `const body = causeClause ? \`${causeClause} — ${change.detail}\` : change.detail;` |
| `link()` runs on it **unconditionally** | `:666` — `applyConceptDecorations(link(id, enrich(body)), concepts)`; the link is inside the argument, never gated on `concepts` |
| decorations are a **no-op** when absent | `:537` — `if (!concepts \|\| concepts.length === 0) return paragraph;` |
| the module says so itself | `:78-82`, `:667-668` — *"Both are fail-open"* · *"`concepts` merely decorates the sentence"* |

So Law 2 reachability on `detail` is already delivered by the linker, independent of `concepts` — the rule's own stated justification does not hold. The rule is nonetheless **still live and still real work**: `compositionContract.ts:1496`, carrying `TODO(THR-1053)`. Not an already-resolved ticket.

**Why promote rather than route to T2.** The decline reason *wrong destination* fires when a ticket needs its own design finalization. This one does not: its Done-when enumerates two arms, the deciding measurement is made and on record, and what remains is a three-part mechanical edit. The 08-15 author's one reservation — that amending plan §1 touches ruling 3 (*no exemptions*) — does not survive inspection: **ruling 3 forbids an exemption *mechanism*** (a per-template opt-out), whereas narrowing the rule's scope uniformly grants no template an escape hatch. That makes this **gate calibration on a measured fact**, delegated to agents by Christian on 2026-08-12 (CLAUDE.md § User review interface rule 4), with *decide and invite a veto rather than block* as the stated disposition. The veto is invited under `## Needs Christian` above.

**Direction was not chosen.** The ruling itself stays with the picking session — the comment presents the evidence, says it points at Done-when option (b), and explicitly leaves option (a) open. This lane unblocked a decision; it did not make one.

**Coordination block posted** ([comment](https://linear.app/threadbare/issue/THR-1053)), carrying the promotion evidence, the three lines, `Blocked by: nothing`, and the evidence shape (engine/content tier, CLI-verifiable; **no browser evidence owed** — no `src/components/` file is edited, only read).

Two corrections folded into that block rather than left for pickup:
- **`Mutex with` reversed to `nothing`, with its reason.** The description's mutex names [THR-1051](https://linear.app/threadbare/issue/THR-1051), which went `Done` 2026-08-11 under [PR #1397](https://github.com/christianspliid-ui/threadbare/pull/1397) — a month before this promotion. THR-688 rule B permits reversal only where the *stated reason* is verifiably inapplicable; it is, and it is recorded rather than decided silently at pickup.
- **The ratchet trap named.** Narrowing the rule makes templates start passing, and `RETROFIT_PENDING` only ever shrinks — `check:encounter` exits `1` on a *stale* entry. So `retrofitPending.ts` must shrink in the same commit or the gate fails on the ticket's own success. That is the non-obvious half of the work and it is now written down.

**Plan-doc liveness: LIVE.** Both docs the ticket names resolve on `origin/main` (`2026-08-08-encounter-factory-workflow.md`, `encounters/2026-08-15-retrofit-batch-1-brief.md`).

**Rule-0 / materiality, quotable:** two named encounters excluded from batch 1 **and again** from batch 2 on this single rule — ~3 weeks across two batches, in the batch-2 brief's own words *"if that ruling goes the other way, the work is thrown away"*; fails **14 of 14** nudge-era templates and is the only aftermath violation on six of the eight slice encounters; **sole blocker on [THR-1130](https://linear.app/threadbare/issue/THR-1130)'s Done-when**, which sits `Parked` in `In Dev` behind it. This is product work, not process work — the throttle rule's budget is untouched.

### Declined — 5, each re-derived this run, not carried

- [THR-1393](https://linear.app/threadbare/issue/THR-1393) — **wrong destination → T2.** Read in full this run. Its body requires naming an engine reader and designing a `knows_of`-successor graph shape, and says so: *"a design decision, not an executor's call."* Genuinely needs design; the load-bearing rule on new node types binds.
- [THR-1348](https://linear.app/threadbare/issue/THR-1348) — **wrong destination → T2.** Has its 18:12Z ruling; the ruling itself says *"it stays in Todo until a plan doc exists."*
- [THR-1448](https://linear.app/threadbare/issue/THR-1448) — **wrong destination → T2.** Director direction dated today; no design artifact yet.
- [THR-1274](https://linear.app/threadbare/issue/THR-1274) — **wrong destination → T2.** A new cast primitive; the load-bearing rule requires full design before code.
- [THR-1133](https://linear.app/threadbare/issue/THR-1133) — needs an attended dev-server session; unclaimable by this queue.
- [THR-1024](https://linear.app/threadbare/issue/THR-1024) — **unmet blocker** [THR-966](https://linear.app/threadbare/issue/THR-966), unchanged.

**Skipped unconditionally — 15** `wayfinder:*` issues (3 maps + 12 decision tickets). Never enter `Ready for Dev`; T1.5's input.

**Promotion ceiling: not reached.** Shelf held **0** at scan, far below `QUEUE_BACKED_UP_MIN` (15); 1 of `ORCH_PROMOTE_BATCH_MAX` (5) used. **No candidate was held back** — every non-promotion above is a stated decline, not a throttle.

**Shelf after this run: 1**, and unlike the last several hours it is a build rather than a close.

## T1.5 — wayfinder sweep

**Three open maps.** [Physical Conflict](https://linear.app/threadbare/issue/THR-1258) · [Powers & Spellcraft](https://linear.app/threadbare/issue/THR-1226) · [Item Generator](https://linear.app/threadbare/issue/THR-1227).

**AFK burn-down: 0 resolved, 0 available — re-verified this run by label, not carried.** Two label queries across all states: **all 21 `wayfinder:research` and all 5 `wayfinder:task` issues in the team are `Done`.** `ORCH_WAYFINDER_AFK_MAX` (2) is not the constraint; supply is, and has been for several runs. There is no agent-doable wayfinder work anywhere on the board.

**Frontier: 9, all HITL, unchanged.** The twelve decision tickets in `Todo` carry the same `grilling` / `prototype` labels as at run n, with no new arrivals — verified against this run's own `Todo` scan. The per-child relation verification (`get_issue(includeRelations:true)` on every Physical Conflict child) was done by run l and is **not** re-spent here: with AFK supply at zero, the tier's action is identical whatever the exact frontier count, and re-deriving it would be spend without a decision attached. Saying so rather than implying a fresh measurement.

**None was touched.** Resolving a `grilling` / `prototype` ticket is the broken-HITL failure mode the wayfinder skill names. Two entry points surfaced under `## Needs Christian`; the nine are not re-listed by name, per this lane's own reporting rule.

## T2 — design authoring

**Triggered, and barred — and this hour the bar cost nothing, because T1 filled the shelf instead.**

- **Trigger:** non-`Deferral` items in `Ready for Dev` = **0** at scan, below `ORCH_PROGRAM_WORK_FLOOR` (2).
- **Bound:** `In Design` holds **2 live, 0 excluded** — above `ORCH_MAX_IN_DESIGN` (1). Nothing may be staged.

| Occupant | Classification (THR-1382 predicate) | Age |
|---|---|---|
| [THR-1155](https://linear.app/threadbare/issue/THR-1155) — nations and named areas | assigned, fresh → **counts** | staged 18:13Z yesterday-hour; last touched **19:25Z, two minutes before this scan** — actively worked right now |
| [THR-790](https://linear.app/threadbare/issue/THR-790) — Traits wave 2 | assigned, stale → **counts, warn only**; exit is `Parked`, never demotion | `startedAt` 2026-08-15T20:29Z = **26 days** |

**Nothing was mutated.** Excluding an item from a count is not a state change, and applying `Parked` or unassigning is Christian's call and the grooming lane's remit. THR-790's `updatedAt` reads today 08:34:46Z, but that timestamp is shared to the second with [THR-1448](https://linear.app/threadbare/issue/THR-1448) — a bulk write, not activity — so the `startedAt`-based staleness reading stands.

**The framing that matters, stated once.** Runs l and m told Christian a single yes/no would unblock design; run n corrected that. This run adds the harder fact: **the T2 bar was never the binding constraint on the shelf.** The shelf was empty because a promotable ticket was being mis-routed, not because design was starved. That is a defect in this lane's own reading, found and fixed this run — and it is worth more than another hour of asking Christian to free a design slot.

**What the bar still defers.** [THR-1348](https://linear.app/threadbare/issue/THR-1348) remains the strongest staging candidate the moment the bound clears (director ruling as of 18:12Z, remaining unknowns enumerated in it, and the ruling explicitly invites this lane's T2), ahead of [THR-1448](https://linear.app/threadbare/issue/THR-1448) and [THR-1274](https://linear.app/threadbare/issue/THR-1274).

**Agreed work is not exhausted — it is budget-bound.** No Discord escalation on that basis; the prescribed interface is `## Needs Christian` → the hourly briefing.

## T3 — architecture health

**Not due. No detector ran this hour, and nothing below is reported as clean on an unrun check.**

- **The daily sweep already ran today** at 06:27 local by [run c](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10c.md); the duty is once per day. Run c's findings stand unchanged and are deliberately not restated.
- **`__DEBUG.validateTraitRefs()`: browser-only, cannot run headless. Not run, not reported as clean.**
- **Weekly test-suite health: not due.** `ORCH_TESTHEALTH_DOW` is Monday; today is Thursday UTC. Last pass: [`test-suite-health-2026-09-07.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/test-suite-health-2026-09-07.md).
- **Redundancy: not assessed this sweep.** No judgement pass over the interface map or systems inventory was performed, and none is claimed.

The frontmatter's `newFindings: 1` is the **T1** finding above (a ticket promotable for 26 days behind a discharged precondition). It is counted where it was found and is explicitly **not** a T3 detector result — saying so rather than letting a T1 finding imply T3 coverage.

### Standing sub-duties

- **`In Design`: 2 live, 0 excluded** — THR-1155 (assigned, actively worked → counts) and THR-790 (assigned, 26d → warned, still counted). Worked in § T2. Printed rather than skipped: a tier that did not run is indistinguishable from a tier with nothing to say.
- **Hand-created `In Dev` tickets / stalled work: not re-measured** (T3 not due). [Run j](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-09-10j.md) did both and found the stalled-work detector's own scoping defect; that finding stands.
- **`In Dev` slice observed in passing** (for the shelf reading, not as a sub-duty measurement): **2** — [THR-1380](https://linear.app/threadbare/issue/THR-1380), parked 19:05Z by the executor with the assignee cleared and one click of work left, and [THR-1130](https://linear.app/threadbare/issue/THR-1130), `Parked` since 2026-08-15 and — per this run's T1 — blocked by the ticket just promoted. **This lane still does not lift either park** (impediment #755).

### Product vs process — the week

This run promoted **one product ticket and zero process tickets**. Nothing was filed; the finding was recorded on its ticket rather than converted into a process ticket, per the throttle rule that scheduled lanes do not file process work. The process-ticket budget (at most one per three runs) remains untouched.

**Headline: the feature pipeline's constraint this hour was not supply — it was this lane's own reading of the board.** Fourteen runs today reported a thin or empty shelf and a barred design tier. At least one of those hours had a promotable ticket sitting in `Todo` with its blocking question already answered on the ticket. The supply story was true in general and wrong in this specific, and the specific is what the executor eats.

## Escalations

- **Nothing asked on Discord this run.** The one judgement made (treating the `concepts` rule as gate calibration rather than a design fork) is Christian-facing and goes via `## Needs Christian` → the hourly briefing as a **veto invitation**, not a blocking question — which is the disposition his 2026-08-12 ruling prescribes.
- **One prior routing reversed, with its reasoning on the ticket.** Two lanes had routed THR-1053 to a design pass. Reversing another lane's routing is not something to do quietly, so the full argument — including the ground the 08-15 author held back on, and why it does not survive — is written into the promotion comment where a reviewer can judge it, not only summarised here.
- **THR-790's standing question deliberately not re-asked** this hour. Run n put it to Christian ninety minutes ago; repeating it hourly is how a standing ask stops being read.
- **No Linear errors this run.** Both writes (`save_issue` state, `save_comment`) returned clean and the state change was confirmed by `get_issue` re-query — `Ready for Dev`, **no `assignee` key present**, which is what the executor's pickup filter requires.
