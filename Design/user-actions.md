# User Action Required

**Last updated:** 2026-07-29 19:53 local, by the hourly `keep-work-flowing-cc` CC task.

**ONE NEW CHRISTIAN-OWNED ASK — the first in six runs, and it relocates a defect this file has mis-attributed for eight.** Home tree healthy: on `main`, 0 stranded, **0 behind**, 2 tracked-dirty (settled). Deploy `skipped`-benign. Merge gate `healthy`, `startupFailureCount: 0`. Fleet heartbeat `ok` — all 8 enabled lanes within tolerance. **Last run's falsifiable test resolved exactly as stated for a second consecutive run**: predicted `7 + N` named rows for a sweep handling N; the 17:26Z sweep handled 1 and the discriminator now reads **38 of 46 unassigned — 8 named**, the new row (THR-582) stamped **17:31:00.384Z**. **But this run also ran the test nobody had run before, and the cause is not where every prior run put it** — see the finding below.

## This run's measurements (2026-07-29 17:53 UTC)

Full hour since the previous brief; the lane held its `:45` slot and the deltas below span a true hour.

- **THE FINDING — the stamping is almost certainly Linear's GitHub integration auto-assigning the PR author, NOT the orchestrator's `save_issue`. Eight runs recorded the effect; none had tested what distinguishes a stamped row from an unstamped one.**
  - **The control case is decisive and was produced by the orchestrator itself, unprompted.** Its 17:29Z run applied THR-845's recommended workaround — passed `assignee: null` **explicitly** rather than omitting the field — and **verified via `get_issue` that no assignee was present**. Its report says so in as many words. THR-582 nonetheless reads `assignee: Christian Spliid` now, `updatedAt` **17:31:00.384Z**, against `startedAt` **17:28:49.925Z**. **A verified-clean write, then a stamp ~2 minutes later, with nothing in between but the PR attachment landing.**
  - **Five rows checked, correlation perfect in BOTH directions.** Stamped ∧ carries a linked GitHub PR/commit: **THR-582** (PR #1064), **THR-848** (PR #1053 + commit), **THR-851** (PR #1061). Unstamped ∧ zero attachments: **THR-825**, **THR-715**. THR-825 is the falsification test and it *passed* — a lane wrote to it at **17:10:48Z this same hour**, so the lanes demonstrably touch it; it has no PR attachment and no assignee.
  - **Second independent timing witness:** THR-851 promoted **16:28:32Z**, stamped by **16:30:04Z** — same ~1.5-minute lag, same attachment window. Two observations, not one.
  - **Mechanism, stated at the strength the evidence supports:** every lane pushes under Christian's GitHub identity, so if Linear's GitHub integration is configured to assign the PR author on link, every row a lane opens a PR against acquires his name — regardless of what `save_issue` sent. **This is inference from a 5/5 two-directional correlation plus two timing witnesses, NOT a reading of the setting** — Linear workspace settings are not exposed to this lane, so the toggle's existence and state are unconfirmed. Recorded at that strength deliberately (finding 33).
  - **Practical consequence, and it is the reason this is worth a brief:** **THR-845's stated root cause is probably wrong**, and its remedy (fix the T1 promotion's write path) **has already been tried and failed** — that is exactly what the orchestrator did this run. Shipping it as written would spend an executor pass on a fix that cannot work. **Wants a write-remit session to correct the ticket** (finding 23); this lane files and comments nothing.
  - **Recorded as new finding 34.** The lesson is about method, not about Linear.
- **The stamping path is live for a third consecutive forward observation.** `Ready for Dev` reads **38 of 46 unassigned**; the eighth named row is **THR-582**, `updatedAt` **17:31:00.384Z**, after the 17:26Z `tb-orchestrator` sweep and after last run's 16:57Z write.
  - **Named set: THR-582, THR-836, THR-845, THR-846, THR-848, THR-849, THR-850, THR-851.** Seven carried, one new; **no row left the named set**.
  - **Still no rate quoted** (finding 31, twice-amended). Three consecutive sweeps have each handled 1 row; asserting "1 per sweep" now would repeat the recorded error a third time. The durable quantity remains `|rows the sweep handled|`.
  - **Falsifiable test for next run, and it now discriminates between the two candidate causes.** If THR-845 has not shipped and the 18:26Z sweep promotes a row **and opens a PR against it**, that row must be stamped within ~3 minutes of the PR attachment, not at the state write. **A promotion that opens no PR must stay unstamped** — that is the observation that would confirm the attachment mechanism outright, and its absence would weaken it. A *decrease* in the named count means a write-remit session intervened, or a named row completed (finding 33's third exit).
- **Queue: BACKED UP — 46 ready (0 Urgent / 1 High / 12 Medium / 33 Low), 0 In Dev.** Depth 45 → 46. Nothing stale: oldest `updatedAt` is THR-715 at 2026-07-24T07:59Z, **~5.4 days**, inside `STALE_ISSUE_DAYS`=7.
  - **The visible count held exactly flat at 38 across a promotion.** One arrival (THR-582, promoted 17:28:49Z) stamped 17:31:00Z, so the shelf grew 45 → 46 while the picker's reach stayed 38 → 38. **A promotion sweep that nets the picker zero is a sharper statement of the defect than any count of named rows**, and it is this run's cleanest single fact.
  - **THR-845 remains the only High and remains stamped** — second consecutive hour with no picker-visible High.
  - **`In Dev` is empty — fifth consecutive hour with this shape, with a closure inside the window.** `tb-opus-pickup` fired 17:01Z, next 18:00Z. No row sits `In Dev` with a null assignee (the parked signature).
- **Merge gate (step 2.5b): `healthy`, `startupFailureCount: 0`, `standDown: false`.** Verbatim: `{"verdict":"healthy","summary":"Automated checks are running normally.","needsChristian":false,"standDown":false,"startupFailureCount":0}`. **Sixth consecutive independent confirmation** that Christian's billing action holds.
- **Deploy (step 2.5): `skipped`, benign — SHA held at `22c69004` for a third hour.** Verbatim summary: *"The live site is up to date. Commits since the last publish (22c69004) only touched notes and docs, so the game itself did not need rebuilding."* Correct for a docs-only window, and still the weaker evidence a never-switching classifier always is (finding 28).
- **Step 2.7 (heartbeat) returned `ok`.** Verbatim: `{"verdict":"ok","needsChristian":false,"checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"],"summary":"All 8 enabled scheduled tasks are within 2 slots of schedule."}`. Fifth consecutive `ok`; the wake-boundary defect (below) remains unexercised rather than fixed.
- **Reaper healthy — ran 19:40:01 local (17:40Z), 13 minutes before this brief.** `SUMMARY:` **33** worktrees / **45** branches / **2** stashes / **0** needs-disposition (was 34/47/2/0). Worktrees −1, branches −2 — ordinary churn plus this hour's merges; this run's own worktree lives outside the reaper's tree (below) and is in neither count.
- **Home tree** on `main`, **0 stranded**, **0 behind**, **2 tracked-dirty** (`.claude/settings*.json` — settled property, correction (c) under *Standing asks*), **1 untracked** (Friday's retro draft).
- **Discord: empty inbox, 3-byte `[]`.** The `after=` cursor (`1532018215184764988`) returned a literal empty array — genuinely nothing new, not a filtered-to-nothing history fetch. **`access.json` was read from the file before any author check**, preserving fail-closed ordering. **No receipt owed and none sent**; the cursor is unchanged. Christian has not written since 2026-07-27.
- **Sibling reports (step 2.6): one in-window with a `## Needs Christian` section, no items folded.** `backlog-grooming-2026-07-29.md` leads with *"Nothing needs you"* plus two explicitly-non-actionable notes — **empty state, skipped per the rule**. `orchestrator-2026-07-29.md` (in-window) uses a `### Needs Christian` sub-heading per run, newest reading *"Nothing needs you this run"* — also empty. `weekly-hygiene-2026-07-26.md` is **~105h**, outside the 36h window.
  - **The sibling's "Fixed by hand this run" claim is falsified a fourth time and remains uncorrected at source** — and per this run's finding, the *repair* was never the weak link; the attribution was.
- **Zero Linear writes.** Two column reads plus five single-issue reads (the discriminator). Read-only throughout.
- **This run's worktree was created outside `.claude/worktrees/`** (session scratchpad), with `rev-parse --show-toplevel` asserted after creation and the home tree re-checked as still on `main` **in the same command**, per THR-797. **The home tree was touched by `git -C` reads, one `git worktree add`/`prune`, three read-only `npm run` probes, and nothing else.**

## Open agent work (not Christian's)

- **THR-845's root cause needs correcting before anyone implements it — new this run, and it supersedes the framing of the three items below it.** The ticket blames the orchestrator's T1 write path; the orchestrator applied that fix this run (explicit `assignee: null`, verified clean) and the row was stamped 2 minutes later anyway. **Implementing THR-845 as written spends a pass on a fix already falsified.** Wants: a comment correcting the cause to the GitHub-integration hypothesis, the 5/5 discriminator table, and a re-scope toward the Linear setting. **This lane comments nothing** (finding 23).
- **THR-845 is filed, unshipped, AND name-stamped — and it is still the queue's only High.** The discriminator reads **8 named of 46**. Remedy (i) unassign the eight rows still buys one sweep of relief; remedy (ii) — now understood as *flip the Linear setting*, not *patch the orchestrator* — is the durable one and is Christian-owned (standing ask 2). **Urgency remains DOWN per finding 33**: stamping blocks `pull-work`'s pickup query, not progress as such.
- **`check:task-heartbeat` mis-fires at a wake boundary — carried, not re-derived this run.** `scripts/check-scheduled-task-heartbeat.ts` accepts any sibling whose `lastRunAt` falls **inside** the stall window as its liveness witness; after a host sleep the whole fleet's `lastRunAt` clusters at the window's *closing* edge, so the clause is satisfied by the very timestamps proving a shutdown. **Fix shape:** require the witness to have fired strictly inside the window with a margin (`witness.lastRunAt < windowEnd − oneCadence`), or detect the burst directly (≥2 lanes sharing a `lastRunAt` to the second ⇒ host-wake, suppress). **Wants a ticket from a write-remit session** (finding 23).
- **The verification pattern is the deeper defect, and this run sharpened its timing.** Finding 32 was earned on an hour-scale contradiction; this run has a **2-minute** one — the orchestrator's `get_issue` confirmation at 17:28:49Z was *correct at the time* and falsified by 17:31:00Z. **That is a different failure from a stale index: the write succeeded and something else wrote after it.** An immediate verify cannot distinguish "my write held" from "my write held for 90 seconds". **Fix shape:** verify on the next run, or verify after the last side-effect in the sequence (PR link, comment) rather than after the state write. **Wants a ticket** (finding 23).
- **A superseded report PR wants closing: #1031** (orchestrator/THR-762). **NOT re-derived this run** — carried on the 16:57Z check (`OPEN`, 1 file, idle since 2026-07-28T19:31:25Z, now ~22.4h by arithmetic rather than observation). **Re-derive before carrying it again** (finding 1). **One `gh pr close`, zero content lost.**
- **`rescue/2026-07-17-detached-plans` is provably prunable — carried, NOT re-derived this run.** The 15:56Z check stands (branch tip `053c867a`, 4 unique commits, all five plan-doc blobs `rev-parse`-identical to `origin/main`, zero unique content); now two runs old, **at the edge of tolerance — re-derive next run** (finding 1). **One `git branch -D`, zero risk.**
- **THR-835 is unreachable in `Idea`** — carried. Both column scans confirm it is in neither `Ready for Dev` nor `In Dev`; `stateHistory` again not re-read. Content is a live merge hazard (the sole required check runs at 80–90% of its 20-minute cap; runner variance turns correct PRs red). **A working promotion lane that never reaches a column is stronger evidence than a broken one** (finding 19). Remedy belongs to a write-remit session.
- **The orchestrator lane's stray-write defect is open and agent-owned.** `tb-orchestrator` wrote its 08:29Z report into the home tree as well as its own worktree, blocking a fast-forward. Durable fix is in that lane's write path (absolute paths, or `rev-parse --show-toplevel` asserted before any write — the workaround this task takes hourly). **Wants a ticket** (finding 23).
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
26. **One instance locates a defect; the second instance with the same fingerprint is what turns it into a mechanism — and changes the remedy.** A one-off wants a cleanup, a recurring one wants a fix *plus* a cleanup. **Re-derivation earns its keep here** (finding 1) — the check that confirms a carry is the same check that catches it changing kind.
27. **A timestamp is evidence only once its zone is verified, and a `Z` suffix is a claim like any other.** Prefer a machine-written field (`stateHistory`, `lastRunAt`, commit metadata) over a prose header; when only prose is available, say which it was. **The failure is silent by construction** — a wrong-but-plausible hour never contradicts anything.
28. **A classifier observed only in its stable state has not been tested.** Report a constant verdict as the weaker fact it is, and treat the first correct switch as the real confirmation.
29. **"Green and armed" is not "merging" — and the difference is invisible from every signal a lane normally checks.** Checks answer *is this change correct*; `mergeStateStatus` answers *can it go in now*, and a lane that reads only the first concludes "shipping" about work that has stopped. **The tell is throughput, not status.**

  **Two corollaries.** (a) ~~**It does not self-heal.**~~ **RETRACTED 2026-07-29 13:23Z** — #1042 merged ~2h07m after entering `BEHIND`, falsifying a bound extrapolated from a 1h45m observation. **The retraction is itself the lesson: "still true at T" is not "true at every T".** (b) **`gh pr view` returns `UNKNOWN` for `mergeable`/`mergeStateStatus` on the first read** and often the true value on the second — but **not always**. Treat `UNKNOWN` as "not yet computed", never as evidence of mergeability.

30. **A liveness witness must fire strictly *inside* the window it witnesses, not merely fall within it.** **The general form: a guard that accepts an endpoint as evidence about an interval passes hardest exactly when the interval is most degenerate.** Corollary for consumers: a probe's verdict is evidence, not a verdict — when independent witnesses contradict it, override and say why. A genuinely stalled lane does not recover by waiting; that asymmetry is the cheapest available discriminator.

31. **A cleanup and its cause are separate deliverables, and shipping the cleanup is the moment the cause is most likely to be dropped.** **A row-level repair with the mechanism unshipped buys one sweep of relief, not a fix.** State the re-accrual rate and a dated falsifiable test against the next producing event.

  **Amended twice (2026-07-29 14:55Z, 15:56Z), in opposite directions** — "1 per sweep" under-fit, "at least 4" over-fit one batch. **The honest quantity is not a rate at all: it is `|rows the sweep handled|`, workload-dependent and unbounded above.** The meta-lesson: **when a number has been wrong once, the reflex is to move it the other way and re-assert it with equal confidence — replacing a wrong point estimate with another.** Prefer naming the *variable*. **A mechanism claim survives new data; a point estimate has to be retracted every time the data moves.**

32. **Verify-after-write needs a clock, not just a re-read — an immediate confirmation read can be served stale and is indistinguishable from success.** Impediment #48 and memory `linear_save_issue_field_drops` establish *that* writes drop silently; this adds *when* to look. **Corollary: a count is not a verification.**

  **Amended 2026-07-29 17:53Z — there is a second, distinct failure with the same shape.** The orchestrator's `get_issue` check at 17:28:49Z was **correct when it ran** and false 131 seconds later. That is not a stale index: the write held, and *something else wrote afterwards*. **An immediate verify cannot distinguish "my write held" from "my write held briefly"** — so the fix is not only *verify later*, it is **verify after the last side-effect in your own sequence** (PR link, comment, attachment), not after the mutation you happen to care about.

33. **A claim widens when it is restated, and the widening is invisible because every restatement still cites the original evidence.** **The drift is toward the remedy's framing**, because a report is written to justify acting, and the wider claim justifies acting harder. **The tell is a claim that has grown more emphatic across runs while its citation stayed identical.** **Detector:** state what observation would falsify *today's* wording, then check whether it would also have falsified the wording used when the evidence was gathered. If the answers differ, the claim has drifted. **Corollary: severity claims need their own evidence, separately from mechanism claims.**

34. **N confirming sightings of an effect do not locate its cause — and each sighting makes the unexamined attribution feel better supported.** (Earned 2026-07-29: eight consecutive runs recorded rows acquiring an assignee, each citing the previous run's framing that the orchestrator's `save_issue` was responsible. **Nobody had asked what else differed between a stamped row and an unstamped one.** One two-directional check — 5 rows, 3 stamped-with-PR-attachment, 2 unstamped-without, including a row a lane demonstrably wrote to that same hour and left clean — relocated the cause in a single pass, and it points at a Linear workspace setting no amount of repo-side work could have fixed.) **The trap is that repetition reads as accumulating evidence**: run 8 felt far more certain than run 2 while resting on exactly the same untested attribution. **Detector, cheap: before reporting a recurrence, name one property the affected rows share that the unaffected rows do not — and check it.** If you cannot state the contrast class, you have an effect, not a cause. **Corollary, and the reason this outranks a tidier lesson: a remedy that fails while correctly applied is the highest-value evidence available about the cause** — the orchestrator's failed workaround this run was worth more than the seven prior sightings combined, and it was free.

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

**Two open: one raised 2026-07-29 13:23Z standing on its safe default (not re-rung), one NEW this run.**

### 1. Should the host machine stay awake overnight? (informational ask — a safe default exists)

- **What happened:** the machine slept ~04:40 → 15:22 local (02:40Z → 13:22Z). Every scheduled lane stopped and restarted together; roughly eleven hourly planning sweeps and eleven pickup attempts did not happen.
- **Evidence it is a host sleep, not a lane failure — and it is complete.** Four witnesses: three lanes sharing `lastRunAt` to the second at 13:22:16Z; the reaper, on a *different* scheduler entirely, stopping in the same eight minutes; zero commits in the window; and the reaper firing at 15:40:01 local exactly as predicted, so it was never refused on battery — it was simply not running. **The diagnosis is closed; only the preference question remains.**
- **Fix, if he wants overnight throughput:** keep the machine awake and **on mains power** — Windows Task Scheduler refuses the reaper on battery (`-2147020576`, memory `git_cleanup_automation`).
- **Safe default (finding 12):** if the pause was deliberate, silence closes this. **Nothing was lost or corrupted.** **Do not re-ring this doorbell**; a *second* unexplained multi-hour pause is a new ask with new evidence.
- **Not Christian's to fix, and not conflated with it:** the heartbeat probe's false `stalled` verdict on this same event is an agent-owned code defect, listed under *Open agent work*.

### 2. Turn off Linear's "assign issue to PR author" on the GitHub integration (NEW 2026-07-29 17:53Z)

- **What breaks:** every issue a lane opens a PR against acquires Christian as assignee, which removes it from `pull-work`'s `assignee:null` pickup query. **8 of 46 Ready-for-Dev rows are currently hidden this way, including the board's only High** (THR-845, which is itself the ticket about this).
- **Why it is his and not an executor's:** the evidence points at a **Linear workspace setting**, not repo code. **The orchestrator already tried the repo-side fix this run** — explicit `assignee: null`, verified clean via `get_issue` at 17:28:49Z — and the row was stamped at 17:31:00Z regardless. No amount of executor work on our side reaches this.
- **Fix:** Linear → Settings → Integrations → GitHub → disable the option that assigns issues to the linked PR's author. **Same class of switch as the auto-close setting already recorded in CLAUDE.md § Definition of Done for THR-738**, which is precedent that this family of toggle exists and is his to flip.
- **Confidence, stated honestly:** the correlation is 5/5 in both directions with two independent timing witnesses and a passing falsification case, but **the setting itself has not been read** — workspace settings are not exposed to this lane. If the toggle does not exist or is already off, that falsifies the hypothesis and the cause returns to open. **Say so rather than hunting for a different switch.**
- **Safe default:** work continues either way — 38 rows remain pickable and stamped rows can still be finished by hand (THR-842 completed while stamped). **This is throughput, not a block.** Silence costs roughly one more hidden row per hour.

**Four questions are answered, closed, and must not be re-asked:**

1. **The five empty projects** — Christian, chat 2026-07-25 21:53: *leave them open; they are intake buckets that refill as the game iterates.*
2. **The GitHub Actions payment block** — cleared 2026-07-25 ~17:09Z and again 2026-07-28 17:02Z, both verified by re-run, and corroborated six times since by independent mechanisms. **A recurrence is a new ask with new evidence, never this one reopened** (finding 12).
3. **THR-799 priority ordering** — Christian, quoted in THR-774/775, 2026-07-27: *the new encounter experience is still first priority.*
4. **Release of THR-821/820/777/778** — Christian, Discord 2026-07-27 14:38Z.

**One standing switch exists but is not an ask:** the orchestrator lane can be disabled on one word from Christian (live 2026-07-27 19:49Z). **Its default state is the intended one**, so silence resolves it.

**Three durable corrections survive closed asks and are kept as rules:**

- (a) A blanket `git stash` was the wrong remedy for home-tree dirt; the single-path form is correct. Parking his tool-permission edits was never necessary.
- (b) `$REATTACH_MAX_TRACKED_DIRTY = 0` governs the detached-HEAD reattach path and never evaluates while HEAD is on `main`. The conclusion held; its stated reason did not.
- (c) **Tracked dirt alone does not stall autosync.** The stalling class is the *intersection* of locally-modified **∩** changed-by-incoming-commits — proven by fast-forwarding cleanly with `.claude/settings*.json` dirty.

---

## Resolved 2026-07-29

**One new Christian-owned ask opened this run** (standing ask 2); the ask from 13:23Z stands on its safe default, un-rung for a fifth consecutive run. What else moved was agent-side:

- **An eight-run misattribution was caught and relocated, at the cost of four extra `get_issue` calls.** Every prior run blamed the orchestrator's write path for the assignee stamping; a two-directional discriminator (5 rows, both polarities, one passing falsification case) points instead at Linear's GitHub integration auto-assigning the PR author. **The decisive evidence was produced by the orchestrator itself** — it applied the recommended fix, verified it, and was overwritten 131 seconds later. **Recorded as finding 34**, whose lesson is that repeated sightings feel like accumulating evidence while testing nothing.
- **Last run's falsifiable test resolved as predicted for a second consecutive run.** Prediction was `7 + N` for a sweep handling N; the 17:26Z sweep handled 1 and the count reads **8**, with THR-582 stamped at 17:31:00.384Z. **The prediction was right and the explanation behind it was wrong** — which is itself the sharpest illustration of finding 34 available.
- **Finding 32 gained a second failure mode** distinct from the stale-index one it was earned on: a write that held, verified true, and was overwritten by a later side-effect in the same sequence.
- **The queue's visible depth held at exactly 38 across a promotion** — 45 → 46 on the shelf, 38 → 38 for the picker. A promotion sweep netting the picker zero is the crispest statement of the defect this file has managed.
- **THR-574 (stale-backlog triage sweep, 34 dormant ideas) completed at 17:18:53Z** — 32 issues decided. Real backlog debt cleared rather than deferred.
- **Deploy's publish point held at `22c69004` for a third hour while the verdict stayed `skipped`** — correct for a docs-only window, still weak evidence (finding 28).
- **The merge gate held for a sixth consecutive independent check** (`startupFailureCount: 0`).
