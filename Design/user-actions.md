# User Action Required

**Last updated:** 2026-07-29 15:52 local, by the hourly `keep-work-flowing-cc` CC task.

**NO NEW CHRISTIAN-OWNED ASK — one carried ask stands on its safe default and is deliberately not re-rung.** Home tree healthy: on `main`, 0 stranded, 6 behind (this hour's merges, self-correcting), 2 tracked-dirty (settled). Deploy `skipped`-benign. Merge gate `healthy`, `startupFailureCount: 0`. Fleet heartbeat `ok` — all 8 enabled lanes within tolerance. **The assignee-invisibility carry is CLEARED at the row level (19 named → 0 of 44) and its mechanism is now ticketed.**

## This run's measurements (2026-07-29 13:52 UTC)

**This run follows the previous brief by 29 minutes, not an hour** — the 13:23Z run was itself a wake-burst catch-up, and the lane has since returned to its `:45` slot. Deltas below span half an hour; where a number looks flat, that is the interval, not stasis.

- **THE FINDING: the assignee-invisibility class is cleared at the row level, and the re-accrual mechanism is ticketed for the first time.** Verified by the discriminating query, not by inference: `list_issues(state:"Ready for Dev", assignee:null)` returns **44 of 44** — every ready row is now visible to the pickup lane, against **19 named of 41** an hour ago. `daily-backlog-grooming` did the by-hand pass this run and filed the cause as **THR-845** (High, `Ready for Dev`, unassigned): *"Orchestrator T1 promotion sets an assignee, so every promoted issue is invisible to pull-work's assignee:null pickup query."*
  - **The cleanup and the fix are separate, and only the cleanup has landed.** THR-845 is filed, not shipped, so half (ii) of the two-part remedy is still open — the mechanism will re-stamp one row per T1 sweep until it ships. **Falsifiable test, and it is cheap:** `tb-orchestrator` next fires at **14:26Z**. If THR-845 has not shipped by then and that sweep promotes anything, the next brief must find **exactly one** named row. Zero named rows *and* a promotion means the fix landed silently; one named row confirms the rate is unchanged at 1/sweep. Either way this is now measured against a ticket rather than carried as a count.
  - **This is the eighth sighting resolving, not an eighth sighting** (finding 26): seven consecutive sweeps established the mechanism, and the eighth run is the one where someone acted. Recorded as a close, and the *rate* claim it earned survives in finding 26.
- **Queue: BACKED UP — 44 ready (0 Urgent / 3 High / 10 Medium / 31 Low), 1 In Dev.** Depth 41 → 44. Nothing stale: oldest `updatedAt` is 2026-07-24T07:59Z (THR-715), **~5.25 days**, inside `STALE_ISSUE_DAYS`=7. No top-of-queue blocker: all three Highs re-read for a `blocked by` clause, none present.
  - **The +3 reconciles exactly** (finding 6): four arrivals — **THR-845** (High), **THR-846** (Medium), **THR-847** (Low), **THR-848** (Medium) — against one departure, **THR-844** promoted into `In Dev`. 41 + 4 − 1 = 44.
  - **The Urgent bucket emptied, and it emptied by re-grading rather than by shipping.** THR-842 moved Urgent → High; there is no longer any Urgent row. Consistent with the billing block being over — `backlog-grooming` records THR-842 as staying open only for a leftover design question. **Composition, not depth, is what shows this**: depth rose while the top band drained.
  - **Three of the four arrivals are the crew auditing its own machinery** (THR-845 name-stamping, THR-846 escalation-parking, THR-847 dead exported query), not game content. Worth noting as a shape: the lane is currently spending its filing budget on itself.
- **WIP=1 satisfied, and the pickup lane completed a full cycle for the first time since Monday.** `In Dev` is **THR-844** alone (assignee `Christian Spliid` — the executor account, i.e. properly claimed, not parked). THR-838 — the WS5 encounter-rewrite slice that was the sole In Dev item last run — has left the column, and THR-844 entered it. **That is claim → work → close → next-claim end to end**, the cycle the billing block broke on Monday.
- **Merge gate (step 2.5b): `healthy`, `startupFailureCount: 0`, `standDown: false`.** Verbatim: `{"verdict":"healthy","summary":"Automated checks are running normally.","needsChristian":false,"standDown":false,"startupFailureCount":0}`. **Second consecutive independent confirmation** that Christian's billing action holds — last run's evidence was THR-661 auto-closing 25s after merge; this run's is the probe itself reading zero startup failures. Two different mechanisms, same verdict.
- **Deploy (step 2.5): `skipped`, benign, SHA unmoved.** `{"verdict":"skipped","deployedSha":"1a97468f"}` — same SHA as last run. Everything merged since is docs and ops reports, so the classifier is correctly declining to rebuild. **This is the stable state and is reported as the weaker fact it is** (finding 28); the discriminating evidence remains last run's switch to `deployed` on a build-relevant commit.
- **Step 2.7 (heartbeat) returned `ok`, and this retro-confirms last run's override rather than merely superseding it.** Verbatim: `{"verdict":"ok","checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"],"summary":"All 8 enabled scheduled tasks are within 2 slots of schedule."}`. Last run the same probe reported `tb-orchestrator` **10 slots behind**, and this file overrode it on three independent witnesses. **`tb-orchestrator` has since run at 13:39:08Z having done nothing to "recover"** — it simply reached its ordinary next slot. A genuinely stalled lane does not clear itself by waiting. **The override was correct and the probe defect is real** (finding 30); `neverRun: ["monthly-rulebook-review"]` is a freshly-registered monthly task, context rather than defect.
- **The reaper's falsifiable test PASSED, closing the last open thread from the sleep window.** Last run stated: *"the reaper fires at `:40` local, so by the next brief it must show a run at 15:40 local. If it does not, the sleep explanation is wrong for this lane."* Log shows `===== clean-stale-git 2026-07-29 15:40:01 =====`, run #**204**. **The test was stated in advance against the outcome, not an activity proxy** (finding 18), and it discharged cleanly — the reaper's 10.7h silence was the host sleeping, not Task Scheduler refusing on battery.
  - Latest `SUMMARY:` **31** worktrees / **48** branches / **2** stashes / **0** needs-disposition (was 33/46/2/0). Worktrees fell by 2, branches rose by 2 — the reaper reaping while merges land, which is the healthy shape.
- **Home tree** on `main`, **0 stranded**, **6 behind** (below `FRESHNESS_BEHIND_THRESHOLD`=10 — this hour's merges, and autosync's ordinary lag rather than a stall), **2 tracked-dirty** (`.claude/settings*.json` — settled property, correction (c) under *Standing asks*), **1 untracked** (Friday's retro draft).
- **Discord: inbox not empty, but nothing from Christian.** The `after=` cursor returned **one message — the bot's own 13:33Z ping**, author `1530180014165856296` (`bot: true`), not the single `allowFrom` entry `247984978283986954`. Skipped per the "skip the bot's own lines" rule. **`access.json` was read from the file before any author check**, preserving fail-closed ordering. **No receipt owed** — a receipt answers *his* message, and he has not written since 2026-07-27. Cursor advanced `1531722112186843226` → `1532018215184764988`.
  - **Worth stating plainly because it is a new shape:** this is the first run where the cursor returned a *non-empty* body that still contained nothing to act on. An empty `[]` and "one message, wrong author" are different facts and were not conflated.
- **Sibling reports (step 2.6): one in-window, no items folded.** `backlog-grooming-2026-07-29.md` (13:50Z, ~2m old) carries a `## Needs Christian` section whose first line is *"Nothing needs you"* followed by two explicitly-labelled non-actionable notes — **empty state, skipped per the rule**, and its two notes were independently re-derived here rather than propagated as asks. `orchestrator-2026-07-29.md` (13:22Z, in-window) has **no** `## Needs Christian` heading at all. `weekly-hygiene-2026-07-26.md` is **~77h**, outside the 36h window.
- **Zero Linear writes.** Three board scans (two column, one `assignee:null` discriminator) plus one priority-filtered read. Read-only throughout.
- **This run's worktree was created outside `.claude/worktrees/`** (session scratchpad), with `rev-parse --show-toplevel` asserted after creation and the home tree re-checked as still on `main` in the same command, per THR-797. **The home tree was touched by `git -C` reads, one `git worktree add`, three read-only `npm run` probes, and nothing else.**

## Open agent work (not Christian's)

- **`check:task-heartbeat` mis-fires at a wake boundary — carried, and now with a clean confirming observation.** `scripts/check-scheduled-task-heartbeat.ts` accepts any sibling whose `lastRunAt` falls **inside** the stall window as its liveness witness; after a host sleep the whole fleet's `lastRunAt` clusters at the window's *closing* edge, so the clause is satisfied by the very timestamps proving a shutdown. **This run supplies the control case**: the same probe, same fleet, no sleep in the window → `ok`, and the lane it flagged had done nothing but reach its next slot. **Fix shape:** require the witness to have fired strictly inside the window with a margin (`witness.lastRunAt < windowEnd − oneCadence`), or detect the burst directly (≥2 lanes sharing a `lastRunAt` to the second ⇒ host-wake, suppress). **Wants a ticket from a write-remit session; this read-mostly lane files nothing** (finding 23).
- **THR-845 is filed but not shipped, so the assignee-invisibility mechanism is still live.** The row-level cleanup landed this run (44/44 visible); the T1 promotion path still stamps. **This is now tracked in Linear rather than carried in this file** — the count moves to a falsifiable test against the 14:26Z sweep (above) and this bullet retires once THR-845 ships.
- **A superseded report PR wants closing: #1031** (orchestrator/THR-762). **Re-derived this run:** `OPEN`, exactly **1** file (`Docs/ops/orchestrator-2026-07-28.md`), untouched since 2026-07-28T19:31:25Z — now **~18.4h**. **`mergeable`/`mergeStateStatus` read `UNKNOWN` on *both* reads this time**, not just the first (memory: `automerge_behind_strict_mode`) — GitHub has not recomputed the branch at all, which is consistent with a long-idle conflicted PR and is *not* evidence it became mergeable. Its only file was rewritten by later merged runs; the promotion it reports already landed. **One `gh pr close`, zero content lost.**
- **`rescue/2026-07-17-detached-plans` is provably prunable — RE-DERIVED this run, and the carry holds.** Last run flagged this carry as one run overdue (finding 1); the check was run rather than restated. Branch tip `053c867a`, `origin/main..<branch>` exactly **4**, and all **five** plan-doc blobs `rev-parse`-identical to `origin/main` — enumerated individually, not diffed whole-tree (finding 25's corollary). **The four unique commits carry zero unique content.** One `git branch -D`, zero risk, wants a write-remit session.
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

31. **A cleanup and its cause are separate deliverables, and shipping the cleanup is the moment the cause is most likely to be dropped.** (Earned 2026-07-29 on assignee-invisibility: seven sweeps established the mechanism, the eighth run unstamped all 19 rows — and the board *looks* fixed at exactly the moment the stamping path is still live.) **A row-level repair with the mechanism unshipped buys one sweep of relief, not a fix.** State the re-accrual rate and a dated falsifiable test against the next producing event, or "cleared" silently becomes "cleared, then quietly re-accruing" with nobody watching.

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

**Nothing Christian-owned closed this run** — the one open ask was raised at 13:23Z and stands on its safe default. What closed was agent-side:

- **Assignee-invisibility, at the row level: 19 named of 41 → 0 named of 44.** Cleared by hand by `daily-backlog-grooming`, with the cause filed as **THR-845**. **Half a close, stated as half** (finding 31): the mechanism ships one new stamped row per T1 sweep until THR-845 lands, and the 14:26Z sweep is the dated test.
- **The reaper's silence resolved as predicted** — fired 15:40:01 local, discharging the falsifiable test stated last run and completing the host-sleep diagnosis. It was never a battery refusal.
- **The heartbeat probe's false `stalled` cleared to `ok`** with `tb-orchestrator` having done nothing but reach its next slot — which retro-confirms last run's three-witness override rather than superseding it, and supplies the control case for finding 30.
- **The pickup lane completed a full claim → work → close → next-claim cycle** (THR-838 out, THR-844 in) — the first since Monday's billing block, and the strongest available evidence that the auto-close path is genuinely restored.
- **The `rescue/2026-07-17-detached-plans` carry was re-derived rather than restated** (it was one run overdue) and holds: 4 unique commits, all 5 plan-doc blobs identical to `origin/main`, zero unique content.
