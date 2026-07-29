# User Action Required

**Last updated:** 2026-07-29 17:56 local, by the hourly `keep-work-flowing-cc` CC task.

**NO NEW CHRISTIAN-OWNED ASK — one carried ask stands on its safe default and is deliberately not re-rung.** Home tree healthy: on `main`, 0 stranded, **0 behind**, 2 tracked-dirty (settled). Deploy `skipped`-benign. Merge gate `healthy`, `startupFailureCount: 0`. Fleet heartbeat `ok` — all 8 enabled lanes within tolerance. **Last run's retraction is CONFIRMED by a forward observation, not merely repeated**: the discriminator reads **39 of 45 unassigned — 6 named**, up one from 5, and the new row (THR-850) carries `updatedAt` **15:29Z** matching the sweep that promoted it. The stamping path is live and producing, not decaying.

## This run's measurements (2026-07-29 15:56 UTC)

Full hour since the previous brief; the lane held its `:45` slot and the deltas below span a true hour.

- **THE FINDING: the retracted-then-restated invisibility claim now has its first *forward* confirmation, which is stronger than the backward one.** Last run inferred the stamping was live from `updatedAt` archaeology on rows written *before* its own read. This run watched it happen: `list_issues(state:"Ready for Dev", assignee:null)` returns **39 of 45**, and the sixth named row is **THR-850**, promoted by the 15:26Z `tb-orchestrator` sweep (commit `e8c4cd07`) and stamped at **15:29Z** — comfortably *after* last run's 14:55Z read. **No archaeology is required to date it**, which is what makes it a cleaner instance than the four that produced the retraction.
  - **Named set: THR-836, THR-845, THR-846, THR-848, THR-849, THR-850.** Five carried, one new. No row left the named set, so the by-hand cleanup's fifteen cleared rows are still clear — **the defect adds, it does not churn**.
  - **The rate, stated properly this time: a sweep stamps every row it *handles*, so the per-sweep count is whatever that sweep touched — 4 in the 13:51:11Z batch, 1 here.** Last run corrected finding 31 from "1 per sweep" to "at least 4"; **that correction over-fit a single batch in the pessimistic direction, exactly as the original over-fit in the optimistic one.** The durable form is the mechanism, not either number. Recorded as an amendment to finding 31 rather than a third numeric claim.
  - **Falsifiable test for next run:** if THR-845 has not shipped and the 16:26Z sweep promotes or handles N rows, the named count must read **6 + N**, and any *decrease* means a write-remit session intervened — which would be visible as an `updatedAt` later than 15:29Z on a now-null row.
  - **THR-845 is High, Ready for Dev, and itself name-stamped — so the fix for the stamping bug is invisible to the lane that would pick it up.** Untying it costs one unassign from any write-remit session. **This lane files and unassigns nothing** (finding 23).
- **Queue: BACKED UP — 45 ready (0 Urgent / 2 High / 12 Medium / 31 Low), 0 In Dev.** Depth 45 → 45. Nothing stale: oldest `updatedAt` is 2026-07-24T07:59Z (THR-715), **~5.3 days**, inside `STALE_ISSUE_DAYS`=7.
  - **The flat depth reconciles**: one arrival (**THR-850**, Medium, promoted 15:29Z) against one departure (**THR-655**, High, which left `Ready for Dev` **Done** at 15:17:02Z — `completedAt` confirms, so it shipped rather than being re-filed).
  - **The High count fell 3 → 2 because THR-655 shipped, not because anything was downgraded.** Remaining: **THR-842** (visible to the picker) and **THR-845** (invisible). No `blocked by` clause in either.
  - **`In Dev` is empty, and that is a between-claims gap rather than a stall — third consecutive hour with this shape and a *closure* inside each window.** `tb-opus-pickup` last fired 15:01Z, closed THR-655 at 15:17Z, next fires 16:00Z. No row sits `In Dev` with a null assignee, which is the parked signature.
- **Merge gate (step 2.5b): `healthy`, `startupFailureCount: 0`, `standDown: false`.** Verbatim: `{"verdict":"healthy","summary":"Automated checks are running normally.","needsChristian":false,"standDown":false,"startupFailureCount":0}`. **Fourth consecutive independent confirmation** that Christian's billing action holds.
- **Deploy (step 2.5): `skipped`, benign — SHA held at `22c69004`.** Verbatim summary: *"The live site is up to date. Commits since the last publish (22c69004) only touched notes and docs, so the game itself did not need rebuilding."* Last run saw the publish point advance `1a97468f` → `22c69004`; this hour it did not move, and **that is the correct behaviour, not a stall** — every commit since has been docs/ops. Still the weaker evidence a constant verdict always is (finding 28).
- **Step 2.7 (heartbeat) returned `ok`.** Verbatim: `{"verdict":"ok","checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"],"summary":"All 8 enabled scheduled tasks are within 2 slots of schedule."}`. Third consecutive `ok`; the wake-boundary defect (below) remains unexercised rather than fixed.
- **Reaper healthy — ran 17:40:01 local (15:40Z), 16 minutes before this brief.** `SUMMARY:` **35** worktrees / **46** branches / **2** stashes / **0** needs-disposition (was 34/46/2/0). Worktrees +1, branches flat — this run's own worktree is not among them (created outside the reaper's tree, below), so the +1 is another lane's.
- **Home tree** on `main`, **0 stranded**, **0 behind**, **2 tracked-dirty** (`.claude/settings*.json` — settled property, correction (c) under *Standing asks*), **1 untracked** (Friday's retro draft).
- **Discord: empty inbox, 3-byte `[]`.** The `after=` cursor (`1532018215184764988`) returned a literal empty array — genuinely nothing new, not a filtered-to-nothing history fetch. **`access.json` was read from the file before any author check**, preserving fail-closed ordering. **No receipt owed and none sent**; the cursor is unchanged because there was nothing to advance past. Christian has not written since 2026-07-27.
- **Sibling reports (step 2.6): one in-window with a `## Needs Christian` section, no items folded.** `backlog-grooming-2026-07-29.md` leads with *"Nothing needs you"* plus two explicitly-non-actionable notes — **empty state, skipped per the rule**. `orchestrator-2026-07-29.md` (in-window) still has **no** `## Needs Christian` heading at all. `weekly-hygiene-2026-07-26.md` is **~80h**, outside the 36h window.
  - **The sibling's "Fixed by hand this run" claim is now falsified twice over and remains uncorrected at source.** This run's forward observation (a *new* stamp at 15:29Z) shows the repair could not have been durable regardless of how many rows it touched. **Still not folded into the briefing as an ask** — agent-side.
- **Zero Linear writes.** Four board reads (two column, one `assignee:null` discriminator, one single-issue confirmation of THR-655's `completedAt`). Read-only throughout.
- **This run's worktree was created outside `.claude/worktrees/`** (session scratchpad), with `rev-parse --show-toplevel` asserted after creation and the home tree re-checked as still on `main` **in the same command**, per THR-797. **The home tree was touched by `git -C` reads, one `git worktree add`/`prune`, three read-only `npm run` probes, and nothing else.**

## Open agent work (not Christian's)

- **`check:task-heartbeat` mis-fires at a wake boundary — carried, and now with a clean confirming observation.** `scripts/check-scheduled-task-heartbeat.ts` accepts any sibling whose `lastRunAt` falls **inside** the stall window as its liveness witness; after a host sleep the whole fleet's `lastRunAt` clusters at the window's *closing* edge, so the clause is satisfied by the very timestamps proving a shutdown. **This run supplies the control case**: the same probe, same fleet, no sleep in the window → `ok`, and the lane it flagged had done nothing but reach its next slot. **Fix shape:** require the witness to have fired strictly inside the window with a margin (`witness.lastRunAt < windowEnd − oneCadence`), or detect the burst directly (≥2 lanes sharing a `lastRunAt` to the second ⇒ host-wake, suppress). **Wants a ticket from a write-remit session; this read-mostly lane files nothing** (finding 23).
- **THR-845 is filed, unshipped, AND name-stamped — the fix for the invisibility bug is invisible to the lane that would pick it up.** The row-level cleanup did **not** hold, and this run has the forward proof: the discriminator reads **6 named of 45**, the sixth (THR-850) stamped at 15:29Z by a sweep that ran *after* the previous brief. Two remedies are owed and neither has landed — **(i)** unassign the six rows (one write, any write-remit session, **THR-845 first** so the rest become pickable), **(ii)** ship THR-845 so the T1 path stops stamping. **Remedy (i) alone buys one sweep of relief** (finding 31); with the 16:26Z sweep due, doing (i) without (ii) means re-accrual before the next brief. This lane files and unassigns nothing (finding 23).
- **The verification pattern itself is the deeper defect, and it is not ticketed.** Last run verified a bulk Linear write by re-querying **one minute later** and got a clean answer that the same query contradicts an hour on, with `updatedAt` proving no intervening write. Impediment #48 / memory `linear_save_issue_field_drops` prescribe verify-after-write but do not say *when*; an immediate re-read can be served from a stale index and reads exactly like success. **Fix shape:** verify on the *next* run rather than in the same breath, or assert the specific field on each row rather than trusting a collection-level count. **Wants a ticket from a write-remit session** (finding 23).
- **A superseded report PR wants closing: #1031** (orchestrator/THR-762). **NOT re-derived this run** — carried on last run's check (`OPEN`, 1 file, idle since 2026-07-28T19:31:25Z, now ~19.4h by arithmetic rather than observation). Re-derive before carrying it again (finding 1). **One `gh pr close`, zero content lost.**
- **`rescue/2026-07-17-detached-plans` is provably prunable — carried, NOT re-derived this run.** Last run's check stands (branch tip `053c867a`, 4 unique commits, all five plan-doc blobs `rev-parse`-identical to `origin/main`, zero unique content) and is one run old, which is inside tolerance. **One `git branch -D`, zero risk, wants a write-remit session.**
- **THR-835 is unreachable in `Idea`** — carried. Both column scans confirm it is in neither `Ready for Dev` nor `In Dev`; `stateHistory` again not re-read, and this run's promotion-lane evidence is one sweep, so the claim still rests on the prior seven. Content is a live merge hazard (the sole required check runs at 80–90% of its 20-minute cap; runner variance turns correct PRs red). **A working promotion lane that never reaches a column is stronger evidence than a broken one** (finding 19). Remedy belongs to a write-remit session.
- **The orchestrator lane's stray-write defect is open and agent-owned.** `tb-orchestrator` wrote its 08:29Z report into the home tree as well as its own worktree, blocking a fast-forward. Durable fix is in that lane's write path (absolute paths, or `rev-parse --show-toplevel` asserted before any write — the workaround this task takes hourly). **Wants a ticket from a write-remit session** (finding 23).
- **Friday's retro draft** (`Design/retros/retro-2026-07-24-draft.md`) is untracked and wants a `git add` in any docs PR. **Not a carry** — it is THR-798's step 2, with an owner and a Done-when.
- **Impediment #267 is used twice** (a `sandbox` row and a `tooling` row, filed the same day by different lanes); **#219 and #228 are duplicate rows for one defect** (Playwright MCP writing a bare-filename screenshot outside the repo). Both dispositions: fold at the next retro. **No ticket.**

## Durable findings carried forward

Rules earned by tickets that have since shipped. **Kept as rule sentences; every worked example is in `git log -p Design/user-actions.md`.**

1. **Before carrying an observation into its Nth run, re-derive it once.**
2. **A subsystem with no callers is invisible to every sweep that looks for wrong behaviour, because it has none.** Corollary: grep the *assignment* side, not the read side.
3. **A plan doc's past tense is a claim, not evidence.**
4. **Advisory gates that nobody reads are indistinguishable from gates that do not exist.**
5. **A test suite that agrees with the bug stays green forever** — and a pool-scoped guard is a suite that agrees with the bug one shelf over.
6. **Read composition, not depth** — and stop re-testing the favourable dip.
7. **A gate clearing is not the same as a decision arriving.** Surfacing a settled call for ratification is worse than not surfacing it. Corollary: verify a *favourable* outcome's cause as carefully as an unfavourable one.
8. **An empty Discord inbox is not evidence Christian is away.** Silence means only that he did not write.
9. **A startup-failure cluster is indistinguishable from quota exhaustion at the moment it happens.** The disambiguating evidence — *does a fresh run execute jobs?* — costs one run. Take it before escalating to a billing page.
10. **Deploy-observability must classify by paths, not by branch name or PR title.** — SHIPPED 2026-07-27 in THR-785.
11. **Mutex lines with reasons work.**
12. **An unanswered ask is not an unheard ask — do not re-ring the doorbell.** A standing ask carries a stated safe default, so silence resolves it rather than blocking on it.
13. **Declining to build the missing half is a shippable outcome, and it needs its reasoning recorded to survive.**
14. **A signal with two meanings is not a signal — and the repair is a notification path, never a new gate.**
15. **When a ticket asks "which of these fixes?", census the pipeline before answering** — the honest answer may be "none, and here is why". Validate the *sample*, not just the stage: a bug report carries an unstated premise that its subjects were eligible to exhibit the behaviour.
16. **A deliberately-parked issue and a broken auto-close are indistinguishable from the board.** Report a falsifiable test in both directions.
17. **Before carrying an ask into another run, check whether it was answered somewhere other than the channel it was asked on.**
18. **State a falsifiable test against the outcome, never against an activity proxy** — a proxy-worded test can pass while the thing it guards fails. State the test's enabling premise explicitly, or a benign world reads as its own failure case.
19. **A column-scoped queue query reports the lane's reach, not the board's contents — and from inside the query the difference is invisible.**
20. **When an ask names a *mechanism* rather than a decision, expect the answer to arrive on the channel he has, not the one the mechanism needs — and say so instead of letting him assume it landed.** (a) Prefer asks that are pure decisions. (b) State plainly what was *not* done, or "fixed" reads as *all of it is handled*.
21. **Re-derive a carry even when you expect it to hold** — the check has a wider aperture than the claim, so a *true* carry can still pay. Look at what the source shows you, not only the field you came to check.
22. **An item in the lane's column is not an item the lane can take — and "unblocked" is the wrong question to keep asking.** The cheap detector: read the comments, not just the fields. *Consequential* and *decidable-by-Christian* are independent axes; conflating them turns a plain-language inbox into a firehose.
23. **A ticket this task files is unpullable by construction, and the cost lands on someone else's run — so filing is never free.**
24. **A file's *state* is evidence; its *author* is a separate claim needing separate evidence.** Naming the wrong author makes an ask bigger and less trustworthy than it needs to be.
25. **A confirmed test licenses the claim it tested, not the remedy that motivated it — and the gap is widest exactly when the result is most satisfying.** Corollary: **the mirror failure is a test whose aperture is wider than the claim, which can disconfirm something the claim never asserted.** Scope the test to the assertion — a whole-tree diff against a stale branch measures staleness, not whether its unique commits are merged.
26. **One instance locates a defect; the second instance with the same fingerprint is what turns it into a mechanism — and changes the remedy.** A one-off wants a cleanup, a recurring one wants a fix *plus* a cleanup, and reporting the second sighting as merely "still true" would carry the wrong remedy forward. **Re-derivation earns its keep here** (finding 1) — the check that confirms a carry is the same check that catches it changing kind.
27. **A timestamp is evidence only once its zone is verified, and a `Z` suffix is a claim like any other.** Prefer a machine-written field (`stateHistory`, `lastRunAt`, commit metadata) over a prose header; when only prose is available, say which it was. **The failure is silent by construction** — a wrong-but-plausible hour never contradicts anything, so nothing downstream ever flags it.
28. **A classifier observed only in its stable state has not been tested.** Report a constant verdict as the weaker fact it is, and treat the first correct switch as the real confirmation.
29. **"Green and armed" is not "merging" — and the difference is invisible from every signal a lane normally checks.** Checks answer *is this change correct*; `mergeStateStatus` answers *can it go in now*, and a lane that reads only the first concludes "shipping" about work that has stopped. **The tell is throughput, not status.** Corollary: the failure rate scales with the *repo's* merge rate, so it worsens exactly when the lane is most productive.

  **Two corollaries.** (a) ~~**It does not self-heal.**~~ **RETRACTED 2026-07-29 13:23Z** — #1042 merged ~2h07m after entering `BEHIND`, falsifying a bound extrapolated from a 1h45m observation. **The retraction is itself the lesson: "still true at T" is not "true at every T", and a duration claim needs an observation that ran to the end state.** The un-nudged case still has *zero* clean observations. (b) **`gh pr view` returns `UNKNOWN` for `mergeable`/`mergeStateStatus` on the first read** and often the true value on the second — but **not always** (2026-07-29 13:52Z: PR #1031 read `UNKNOWN` on both). Treat `UNKNOWN` as "not yet computed", never as "nothing to see", and never as evidence of mergeability.

30. **A liveness witness must fire strictly *inside* the window it witnesses, not merely fall within it.** **The general form: a guard that accepts an endpoint as evidence about an interval passes hardest exactly when the interval is most degenerate.** Corollary for consumers: a probe's verdict is evidence, not a verdict — when independent witnesses contradict it, override and say why. **Confirmed 2026-07-29 13:52Z by the control case**: same probe, same fleet, no sleep in the window → `ok`, and the lane previously flagged "10 slots behind" cleared by doing nothing but reaching its next slot. A genuinely stalled lane does not recover by waiting; that asymmetry is the cheapest available discriminator.

31. **A cleanup and its cause are separate deliverables, and shipping the cleanup is the moment the cause is most likely to be dropped.** (Earned 2026-07-29 on assignee-invisibility: seven sweeps established the mechanism, the eighth run unstamped 19 rows — and the board *looks* fixed at exactly the moment the stamping path is still live.) **A row-level repair with the mechanism unshipped buys one sweep of relief, not a fix.** State the re-accrual rate and a dated falsifiable test against the next producing event, or "cleared" silently becomes "cleared, then quietly re-accruing" with nobody watching.

  **Amended 2026-07-29 14:55Z — the rate was wrong in the optimistic direction, twice.** The stated re-accrual was 1 row per sweep; the measured rate is **at least 4**, because a sweep stamps every row it *handles*, not only the row it *promotes*. **The general lesson is sharper than the arithmetic: a rate inferred from a mechanism's headline effect will under-count its incidental ones.** Derive the rate from what the code touches, not from what the ticket is about.

  **Amended again 2026-07-29 15:56Z — and the second amendment is a correction to the first, in the opposite direction.** The 16:26Z-eligible sweep at 15:26Z stamped **exactly 1** row (THR-850). So "at least 4 per sweep" over-fit one batch as badly as "1 per sweep" over-fit the promotion path. **The honest quantity is not a rate at all: it is `|rows the sweep handled|`, which is workload-dependent and unbounded above.** The meta-lesson, which is the part worth carrying: **when a number has been wrong once, the reflex correction is to move it in the opposite direction and re-assert it with equal confidence — replacing a wrong point estimate with another wrong point estimate.** Prefer naming the *variable* over quoting either observation. **A mechanism claim survives new data; a point estimate has to be retracted every time the data moves.**

32. **Verify-after-write needs a clock, not just a re-read — an immediate confirmation read can be served stale and is indistinguishable from success.** (Earned 2026-07-29: a bulk Linear write at 13:51:11Z was verified at 13:52Z, returned "44 of 44 clean", and was contradicted an hour later by the same query against rows `updatedAt` proves nobody touched in between.) Impediment #48 and memory `linear_save_issue_field_drops` establish *that* writes drop silently; this adds *when* to look. **The failure is silent by construction and self-congratulatory by shape** — it fires precisely when a run wants to report a fix, so the incentive and the error point the same way. **Two fixes, either sufficient:** verify on the *next* run rather than in the same breath, or assert the mutated field on each named row instead of trusting a collection-level count. **Corollary: a count is not a verification.** "44 of 44" and "these 19 specific rows each read null" are different claims, and only the second survives a stale index.

**Owner of items below:** Christian. Everyone else's blockers go in Linear or `Docs/impediments.md`.
**Refresh cadence:** The hourly `keep-work-flowing-cc` scheduled task keeps this current (prunes resolved items, adds newly-surfaced Christian-owned ones); the `retrospective` skill still does the deep periodic rebuild.

## How this works

The retrospective stopped being the right channel for "Christian, please flip one switch." Christian-owned asks were buried in retro prose, and nothing surfaced them between retros. This file replaces that pattern.

Read order: top to bottom is blast radius. The top items break canonical workflow invariants right now; the bottom items are operational debt with workarounds in place.

For each item:
- **Fix** = the literal command, click path, or line of config that resolves it.
- **What breaks** = the named system or invariant currently degraded.
- **Source** = `Docs/impediments.md` entry numbers + occurrence count, so the cost is visible.

When an item resolves: delete it from this file, mark the corresponding impediment as resolved in the dashboard regen, note the close in the next retro under "What shipped." **No history retained here — `git log` + the retros are the audit trail.** The resolved log is pruned to the current day; anything older is recovered with `git log -p Design/user-actions.md`.

---

## Standing asks

**One open, raised 2026-07-29 13:23Z. Not re-rung this run** (finding 12).

### 1. Should the host machine stay awake overnight? (informational ask — a safe default exists)

- **What happened:** the machine slept ~04:40 → 15:22 local (02:40Z → 13:22Z). Every scheduled lane stopped and restarted together; roughly eleven hourly planning sweeps and eleven pickup attempts did not happen.
- **Evidence it is a host sleep, not a lane failure — and it is now complete.** Three witnesses at the time: three lanes sharing `lastRunAt` to the second at 13:22:16Z; the reaper, on a *different* scheduler entirely, stopping in the same eight minutes; zero commits in the window. **The fourth and decisive witness arrived this run**: the reaper fired at 15:40:01 local exactly as predicted, so it was never refused on battery — it was simply not running. **The diagnosis is closed; only the preference question remains.**
- **Fix, if he wants overnight throughput:** keep the machine awake and **on mains power** — Windows Task Scheduler refuses the reaper on battery (`-2147020576`, memory `git_cleanup_automation`).
- **Safe default (finding 12):** if the pause was deliberate, silence closes this. **Nothing was lost or corrupted.** **Do not re-ring this doorbell**; a *second* unexplained multi-hour pause is a new ask with new evidence, not this one repeated.
- **Not Christian's to fix, and not conflated with it:** the heartbeat probe's false `stalled` verdict on this same event is an agent-owned code defect, listed under *Open agent work*.

**Four questions are answered, closed, and must not be re-asked:**

1. **The five empty projects** — Christian, chat 2026-07-25 21:53: *leave them open; they are intake buckets that refill as the game iterates.*
2. **The GitHub Actions payment block** — cleared 2026-07-25 ~17:09Z and again 2026-07-28 17:02Z, both verified by re-run, and corroborated twice since by independent mechanisms. **A recurrence is a new ask with new evidence, never this one reopened** (finding 12).
3. **THR-799 priority ordering** — Christian, quoted in THR-774/775, 2026-07-27: *the new encounter experience is still first priority.*
4. **Release of THR-821/820/777/778** — Christian, Discord 2026-07-27 14:38Z.

**One standing switch exists but is not an ask:** the orchestrator lane can be disabled on one word from Christian (live 2026-07-27 19:49Z). **Its default state is the intended one**, so silence resolves it.

**Three durable corrections survive closed asks and are kept as rules:**

- (a) A blanket `git stash` was the wrong remedy for home-tree dirt; the single-path form is correct. Parking his tool-permission edits was never necessary.
- (b) `$REATTACH_MAX_TRACKED_DIRTY = 0` governs the detached-HEAD reattach path and never evaluates while HEAD is on `main`. The conclusion held; its stated reason did not.
- (c) **Tracked dirt alone does not stall autosync.** The stalling class is the *intersection* of locally-modified **∩** changed-by-incoming-commits — proven by fast-forwarding cleanly with `.claude/settings*.json` dirty.

---

## Resolved 2026-07-29

**Nothing Christian-owned closed this run** — the one open ask was raised at 13:23Z and stands on its safe default, now un-rung for a third consecutive run. What moved was agent-side:

- **The invisibility claim graduated from archaeology to observation.** Last run retracted a false all-clear and re-established the defect from `updatedAt` timestamps predating its own read. This run watched a *new* stamp appear: **6 named of 45**, the sixth (THR-850) written at 15:29Z by the 15:26Z sweep. **A defect inferred backwards and a defect observed forwards are different strengths of claim**, and only the second closes off "it was already like that".
- **Finding 31's rate is amended a second time — against the direction of the first amendment.** 15:26Z stamped exactly 1 row, not ≥4. Both point estimates were over-fits of single batches; the durable statement is the mechanism (`every row the sweep handles`), recorded above.
- **A sibling's claim stays falsified and uncorrected at source.** `backlog-grooming-2026-07-29.md` records the stamping as *"Fixed by hand this run"*. Deliberately **not** folded into the briefing as an ask (agent-side).
- **The pickup lane completed a third consecutive full cycle** — THR-655 claimed and closed `Done` at 15:17:02Z (`completedAt` confirms), following THR-844 and THR-838. **Three clean cycles is the point at which the restored auto-close path stops being a hopeful reading of two data points.**
- **Deploy's publish point held at `22c69004` while the verdict stayed `skipped`** — correct for a docs-only hour, and still the weak evidence a never-switching classifier always is (finding 28).
- **The merge gate held for a fourth consecutive independent check** (`startupFailureCount: 0`).
