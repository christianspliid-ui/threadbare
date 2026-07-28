# User Action Required

**Last updated:** 2026-07-29 00:55 local, by the hourly `keep-work-flowing-cc` CC task.

**NO OPEN CHRISTIAN-OWNED ASKS.** Home tree healthy: on `main`, 0 behind, 0 stranded, autosync fast-forwarding. Deploy healthy (no build-relevant change since the last publish). Merge gate healthy, and corroborated this run by a second independent signal. All eight enabled scheduled lanes on time.

## This run's measurements (2026-07-28 22:55 UTC)

- **Assignee-invisibility re-derived: 15 named of 36** (up from last run's 14 of 35). Named: THR-574, THR-621, THR-626, THR-638, THR-655, THR-667, **THR-681**, THR-723, THR-756, THR-757, THR-762, THR-763, THR-795, THR-836, THR-842. The mover is **THR-681**, which was not in the column at all last run; no row lost its name.
  - **Third consecutive sighting, same fingerprint — the mechanism holds and the remedy is unchanged.** Commit `38ac78ae`, *"orchestrator T1 sweep — promote THR-681 (2026-07-29 00:31Z)"*, and the row landed in Ready for Dev **already carrying the name**. Three consecutive `tb-orchestrator` T1 promotions (THR-757 20:30Z, THR-756 21:31Z, THR-681 00:31Z), three stamped rows. Finding 26 said the second sighting is what converts a located defect into a mechanism *and changes the remedy*; the third changes neither, and **saying so is the point** — a re-derivation that confirms is reported as confirmation, not re-sold as news.
  - **The per-slot rate is now measured rather than inferred.** Last run predicted re-accrual of "roughly one invisible row per T1 sweep, roughly hourly". Three sweeps, three rows, three consecutive hours — the prediction is corroborated at its own stated cadence, which is the cheapest possible test of it.
  - Absent-key guard unchanged and re-applied: `list_issues` omits `assignee` for unassigned rows rather than emitting `null`, so both forms were coerced to one bucket before counting.
  - **The remedy is unchanged and still not escalated:** one `save_issue(assignee:null)` per named row from any write-remit session, plus the lane-side fix. Christian does not touch Linear (THR-608), so this is an invalid ask to raise with him by construction.
- **Queue: BACKED UP — 36 ready (1 Urgent / 1 High / 8 Medium / 26 Low), 1 In Dev.** Nothing stale: oldest `updatedAt` is 2026-07-24T07:59Z (THR-715), **~4 days**, inside `STALE_ISSUE_DAYS`=7. Depth 35 → 36.
  - **The +1 is again one arrival against zero departures, and this time the composition moved *with* the arrival rather than against it.** THR-681 entered at 00:31Z as a Medium; Medium 7 → 8 and Low held at 26. Last run's Medium 8 → 7 / Low 24 → 26 shift was flagged as a bucket edge rather than a reclassification — this run's clean single-bucket move is what that reading predicted, and is the corroboration for it.
  - **Depth is still not a starvation signal in either direction.** 36 ready against 1 In Dev is planning outrunning execution by design (WIP=1), not a stall.
- **THR-838 remains the hour's event, and it is now landing on a beat rather than in one burst.** PR **#1036** merged (`5e78f92a`) — the `thr-838/ws5-batch-1-camp-night` cluster that was merely *green behind* PR #1033 at last reading. In Dev since 20:23Z, **~2h32m with two merged PRs**, which is delivery cadence, not a stall.
- **Deploy (step 2.5): `skipped`** — `{"verdict":"skipped","deployedSha":"5e78f92a"}`. **The deployed SHA advanced `fbb2c392` → `5e78f92a` while the verdict stayed `skipped`** — the same classifier behaviour as last run, on the same cause (content-data commits move the tip without requiring a rebuild). Two consecutive hours of a constant verdict across a moving tip is the classifier being *stable*, which is weaker news than a verdict change and is reported as such.
- **Merge gate (step 2.5b): `healthy`**, `startupFailureCount: 0` — **corroborated independently again rather than taken on the probe's word.** `gh run list --workflow=ci.yml` shows `success` on `main` at **22:32:25Z** (merge of #1040), and `linear-autoclose.yml` shows four consecutive `success` runs, i.e. **both** workflows the outage killed are executing steps. Two signals of different kinds beat one repeated signal (finding 9). The block Christian cleared at 17:02Z has not recurred.
  - Two `cancelled` `ci.yml` runs appear in the same window (`5e78f92a` 22:17Z, `fbb2c392` 21:21Z). **These are superseded-by-newer-push cancellations, not failures** — the distinguishing evidence is that each is followed by a `success` on a later commit, and a billing block concludes `failure` in ~3s rather than cancelling. Named here so a future run does not read them as a regression.
- **Step 2.7 (heartbeat) clean:** `{"verdict":"ok","checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"]}`. `tb-orchestrator` ran 22:27:10Z — **eighth consecutive on-time slot**; the THR-837 stall is not recurring.
- **Sibling reports (step 2.6): none folded in.** `orchestrator-2026-07-29.md` (written 00:50 local, 5 min before this run) is an empty state — *"Nothing needs you this run."* `backlog-grooming-2026-07-28.md` is in-window (~15h) but its only content is a **now-falsified** risk: it warned that WS5 had no batch children and that `tb-orchestrator` had not run since 20:27 the previous day. Both are resolved — THR-838 exists and is In Dev with two merged PRs, and the orchestrator has now run eight consecutive slots. **A stale in-window warning is pruned, not propagated**; folding it in would have put a resolved alarm in Christian's inbox. `weekly-hygiene-2026-07-26.md` is ~62h old, outside the 36h window.
- **Discord: inbox genuinely empty.** The `after=` cursor returned **3 bytes** (`[]`) — the measured empty-case size, so this is a real nil and not a silent failure. `access.json` `allowFrom` read from the file first (single entry, `247984978283986954`), preserving fail-closed ordering. **Nothing from Christian; no receipt owed; none sent.** Cursor unchanged at `1531722112186843226`.
- **No ping sent** — `Needs Christian` is empty; the step-6 gate never pings an empty section, and the stored hash already equals the empty-content hash.
- **Home tree** on `main`, **0 stranded**, **0 behind**, **2 tracked-dirty** (`.claude/settings*.json` — settled property, see correction (c) under *Standing asks*), **1 untracked** (Friday's retro draft).
- **Reaper** ran 00:40 local, 15 min before this run: **32** worktrees / **43** branches / **2** stashes / **0** needs-disposition. **Worktrees 33 → 32 and branches 44 → 43 — both back *down* one, exactly reversing last hour's rise.** Last run called that rise "growth from this hour's own sessions, not a reaper failure" and declined to alarm; a count that rises and then falls across two healthy runs is that call corroborated at the next reading, which is the cheapest available test of it.
- **This run's worktree was created outside `.claude/worktrees/`** (session scratchpad, absolute paths on every write; `rev-parse --show-toplevel` asserted after creation, and the home tree re-checked as still on `main` immediately after, per THR-797). **The home tree was touched by `git -C` reads, one `git worktree add`, three read-only `npm run` probes, two `gh run list` calls, and nothing else.**
- **Zero Linear writes.** Two board scans plus three targeted reads (THR-842, THR-822, THR-835), read-only throughout.

## Open agent work (not Christian's)

- **Assignee-invisibility: 15 of 36 rows carry a name**, so the executor's `assignee:null` query cannot see them — including the sole High (THR-655) and the sole Urgent (THR-842). **Two halves, both agent-owned:** (i) one `save_issue(assignee:null)` per existing row, and (ii) a fix in `tb-orchestrator`'s T1 promotion path, now observed stamping a row on **three** consecutive slots (THR-757 at 20:30Z, THR-756 at 21:31Z, THR-681 at 00:31Z). Without (ii), (i) is re-accrued once per sweep — a rate now measured across three hours rather than projected from one.
  - **THR-842's invisibility is currently cheap, and saying so is part of the report.** Its Christian-owned half (the billing action) is discharged — re-verified this run by a green `ci.yml` on `main` at 22:32Z **and** four successive `linear-autoclose.yml` successes — and THR-768 shipped the guard its item 3 asked for. An invisible row is a defect in the lane's reach whether or not this particular row still has work in it, but reporting the two as one alarm would overstate it.
- **THR-835 is unreachable in `Idea`** — re-derived this run: still `Idea`, still `updatedAt 2026-07-28T07:10:00Z`, `stateHistory` still a single `Idea` entry with `endedAt: null`, untouched through **eight** on-time orchestrator slots. **The lane that promotes ran three times in the last three hours and promoted three other rows** (THR-757, THR-756, THR-681), which is the sharpest available evidence that `Idea` is outside its reach rather than that it is idle. Content is a live merge hazard (the sole required check runs at 80–90% of its 20-minute cap; runner variance turns correct PRs red) — **and this run saw two `cancelled` CI runs in one hour**, which is not that failure mode but is the same neighbourhood of runner variance. **A working promotion lane that never reaches a column is stronger evidence than a broken one** — `Idea` is unreachable by every automated lane (finding 19). Remedy belongs to a write-remit session. No deadline re-armed.
- **The orchestrator lane's stray-write defect is open and agent-owned.** `tb-orchestrator` wrote its 08:29Z report into the home tree as well as its own worktree, blocking a fast-forward. The durable fix is in that lane's write path (absolute paths, or `rev-parse --show-toplevel` asserted before any write — the workaround this task takes hourly). **Worth a ticket from a session with a write remit; this read-mostly lane files nothing** (finding 23).
- **`rescue/2026-07-17-detached-plans` is provably prunable — still present, re-derived again this run.** Four unique commits (`053c867a`, `8fa552c2`, `59ea82df`, `cf2f2dd5`) touching five plan docs; every one of the five blobs is byte-identical to `origin/main` by `rev-parse` comparison. Branch present (`053c867a`) and `origin/main..HEAD` still exactly **4** at this reading. One `git branch -D`, zero risk, wants a write-remit session. **The branch count falling 44 → 43 this hour is likewise not this branch changing** — the reaper deliberately never auto-deletes stale *unmerged* worktree branches, which is precisely the class this one is in. Last hour the count rose and the same sentence applied; a carry that survives the count moving in *both* directions is insulated from that signal, which is worth stating once rather than re-arguing each hour.
  - **The re-derivation's first test was wrong and nearly falsified a true carry** — `git diff --stat origin/main <branch>` reported *1223 files, 45597 insertions, 110530 deletions*, which looks like a branch wildly out of step. That number measures the branch being **11 days stale**, not its unique commits being unmerged. The claim was about five blobs; the test has to be scoped to those five. See the corollary added to finding 25.
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
25. **A confirmed test licenses the claim it tested, not the remedy that motivated it — and the gap is widest exactly when the result is most satisfying.** Corollary (earned 2026-07-28 on the `rescue/` carry): **the mirror failure is a test whose aperture is wider than the claim, which can disconfirm something the claim never asserted.** Scope the test to the assertion — a whole-tree diff against a stale branch measures staleness, not whether its unique commits are merged.
26. **One instance locates a defect; the second instance with the same fingerprint is what turns it into a mechanism — and changes the remedy.** (Earned 2026-07-28 on assignee-invisibility: THR-757 at 20:30Z looked like one lane leaving one row stamped; THR-756 at 21:31Z, same lane, same T1 sweep, same signature, made it a per-slot behaviour.) The consequence is not rhetorical: a one-off wants a cleanup, a recurring one wants a fix *plus* a cleanup, and reporting the second sighting as merely "still true" would have carried the wrong remedy forward. **Re-derivation earns its keep here** (finding 1) — the check that confirms a carry is the same check that catches it changing kind.

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

**None open.**

**Four questions are answered, closed, and must not be re-asked:**

1. **The five empty projects** — Christian, chat 2026-07-25 21:53: *leave them open; they are intake buckets that refill as the game iterates.*
2. **The GitHub Actions payment block** — cleared 2026-07-25 ~17:09Z and again 2026-07-28 17:02Z, both verified by re-run. **A recurrence is a new ask with new evidence, never this one reopened** (finding 12).
3. **THR-799 priority ordering** — Christian, quoted in THR-774/775, 2026-07-27: *the new encounter experience is still first priority.*
4. **Release of THR-821/820/777/778** — Christian, Discord 2026-07-27 14:38Z.

**One standing switch exists but is not an ask:** the orchestrator lane can be disabled on one word from Christian (live 2026-07-27 19:49Z). **Its default state is the intended one**, so silence resolves it. The lane's eleven-hour silence on 2026-07-27/28 did **not** re-open it — the switch's subject is whether he wants the lane at all, not whether it ran last night (finding 12).

**Three durable corrections survive closed asks and are kept as rules:**

- (a) A blanket `git stash` was the wrong remedy for home-tree dirt; the single-path form is correct. Parking his tool-permission edits was never necessary.
- (b) `$REATTACH_MAX_TRACKED_DIRTY = 0` governs the detached-HEAD reattach path and never evaluates while HEAD is on `main`. The conclusion held; its stated reason did not.
- (c) **Tracked dirt alone does not stall autosync.** The stalling class is the *intersection* of locally-modified **∩** changed-by-incoming-commits — proven by fast-forwarding cleanly with `.claude/settings*.json` dirty.

---

## Resolved 2026-07-28

- **19:22 — THR-768 shipped** (`43f88db3`, PR #1026): the billing-failure detector, closing the vacuous-merge-gate hole and giving this brief its step-2.5b probe. **Urgent, and it was the sole in-flight job.** Its second-order proof arrived immediately — the deploy verdict moved `skipped` → `deployed` on the same commit, which is a build-relevant change classified correctly rather than waved through. Impediment **#136 proposed this detector in May 2026 and it was never built**; the interval is the finding, not the fix.
- **17:02 — Christian cleared the GitHub billing block, ~5 minutes after the doorbell**, the shortest ask-to-action on record here. CI green at 17:03:31Z and unbroken since; **THR-822 reached Done at 17:15:43Z unaided**, which is the stronger proof — the ask's stated harm was never "CI is red" but "two robots are off and work is landing unwatched". Residues, none of them asks: THR-768 (detector) **closed at 19:22Z, see above**; THR-842 (incident) stays open as crew work, its Christian-owned half discharged; impediment **#278** logged.
- **11:55 — Christian resolved the home-tree fast-forward block** (opened 09:00Z, ~2h55m ask-to-action), evidenced by stash + reflog rather than inferred from the behind-count. `stash@{0}` holds a 42-line diff whose content is already on `origin/main` via PR #1002 — droppable whenever, **not** a new ask.
- **~13:22 — THR-837 shipped** (`bbe61805`), the scheduled-task heartbeat probe this brief now runs hourly. The five-run disposition (*a ticket whose present tense has expired is not thereby void; record the staleness where the next reader looks and leave the ticket to its owner*) is vindicated: neither tempting repair — closing it, or rewriting its prose — was destructive-in-hindsight, because neither was done.
- **Earlier closes** (THR-778 unpullability after twelve runs, the orchestrator standing test, the no-High gap, THR-618 + THR-840, the assignee-invisibility standing test) are pruned to this line per file policy; `git log -p` holds the prose.
