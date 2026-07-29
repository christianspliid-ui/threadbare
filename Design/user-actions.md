# User Action Required

**Last updated:** 2026-07-29 03:55 local, by the hourly `keep-work-flowing-cc` CC task.

**NO OPEN CHRISTIAN-OWNED ASKS.** Home tree healthy: on `main`, 0 behind, 0 stranded, autosync fast-forwarding. Deploy `skipped`-benign. Merge gate healthy. All eight enabled scheduled lanes on time.

## This run's measurements (2026-07-29 01:55 UTC)

- **Assignee-invisibility: 18 named of 40.** Sixth consecutive sighting, **logged as a count per the settled-carry rule** (last run: *"further sightings are logged as a count, not narrated"*). The mover is **THR-348**, promoted by `tb-orchestrator` at 01:30Z (commit `fd1015b5`, PR #1047) and landing already stamped — the sixth such row in six consecutive T1 sweeps. No row lost its name; no change in kind, mechanism, or rate. Absent-key guard re-applied. Remedy unchanged and still agent-owned, never Christian's (THR-608).
- **Queue: BACKED UP — 40 ready (1 Urgent / 1 High / 9 Medium / 29 Low), 2 In Dev.** Nothing stale: oldest `updatedAt` is 2026-07-24T07:59Z (THR-715), **~4.75 days**, inside `STALE_ISSUE_DAYS`=7. Depth 39 → 40.
  - **The +1 reconciles exactly against the composition** (finding 6): THR-348 entered as a Low (Low 28 → 29); Urgent, High and Medium all held. One arrival, one bucket, zero departures.
  - **The Encounter-UI post-v1 batch is now fully shelved**: THR-346 (sound, 23:28Z), THR-347 (constants tuning, 00:30Z), THR-348 (TTS/voice, 01:30Z) — H1/H2/H3 promoted one per slot at the shelf-backup ceiling, exactly as the lane declared. **The three-slot prediction resolved as stated**, which is the check worth recording, not the arrival itself.
- **The merge-step stall did NOT clear, and it is the same PR — this is the finding.** PR **#1042** (`feat(thr-661): curse_artifact marks the bearer`) still reads **`MERGEABLE`, all four checks SUCCESS, auto-merge armed, `mergeStateStatus: BEHIND`**, now ~1h45m after it first entered that state at 00:12:29Z. Re-read twice this run: the **first `gh pr view` returned `UNKNOWN`** for both mergeability fields (memory: `automerge_behind_strict_mode` — "first read is UNKNOWN"), and only the second read gave `BEHIND`. **A single read would have produced a false all-clear**, which is the reusable part.
  - **Third instance in three hours, and the first to persist across a full slot.** The prior two (this PR at 00:12Z, orchestrator's #1043 at 00:31Z) were each cleared or observed once; #1043 was hand-merged, #1042 was not — so this is the first measurement of what happens when *nobody* nudges: it does not self-heal, and `main` advanced past it twice more (PRs #1046, #1047) while it waited. **THR-735 already tracks the general form**; the new information is the persistence, not the existence.
  - **No ticket from this read-mostly lane** (finding 23). Remedy is one `git merge origin/main` from any write-remit session.
- **WIP=1 still breached; shape unchanged from last run.** THR-661 In Dev holding a name and a stalled-but-live PR (#1042); **THR-838 In Dev with no assignee** — the parked pattern, unchanged for a second hour, still with no PR in flight since #1039 merged at 23:21Z. **Bookkeeping, not lost work.** Remedy belongs to the pickup lane's Step 0 WIP check.
- **The superseded report PR is unchanged and still wants closing.** PR **#1031** (orchestrator/THR-762) re-read this run: `CONFLICTING`/`DIRTY`, still untouched since 2026-07-28T19:31:25Z, still exactly one file (`Docs/ops/orchestrator-2026-07-28.md`), still `Test · Typecheck · Build` = **SKIPPED** (the billing-window signature from its 19:31Z creation, *not* a live gate hole — the gate probes `healthy` now). **Zero unique content; one `gh pr close`.**
- **Deploy (step 2.5): `skipped`, benign** — `{"verdict":"skipped","deployedSha":"b0798230"}`, same SHA for a third consecutive hour. Commits since are report/briefing-only, so the skip is the correct branch. **No discrimination claimed this hour** — a constant verdict over an unchanging class of commit is the weaker fact (finding 28), and last hour's `skipped` → `deployed` → `skipped` round trip remains the real evidence the classifier discriminates.
- **Merge gate (step 2.5b): `healthy`**, `startupFailureCount: 0`. THR-842's Christian-owned half stays discharged. **No new corroboration** — no build-relevant deploy ran, so this is the ordinary green reading (finding 9).
- **Step 2.7 (heartbeat) clean:** `{"verdict":"ok","checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"]}`. `tb-orchestrator` ran 01:27:11Z — **twelfth consecutive on-time slot**; the THR-837 stall is not recurring.
- **Sibling reports (step 2.6): none folded in, all for the right reason.** `orchestrator-2026-07-29.md` (~5 min old) carries four `### Needs Christian` h3 sections, one per run; the newest reads *"Nothing needs you this run."* — an empty state, skipped per the rule. The h3-vs-registry-`##` mismatch is unchanged, so extraction again ran against the file body rather than a fixed heading level. `backlog-grooming-2026-07-28.md` (**~18.1h**, still in-window) re-read once more and **still falsified in both premises** (WS5 has THR-838; `tb-orchestrator` has run twelve consecutive slots); its own recommendation was *"no action from you today"*. `weekly-hygiene-2026-07-26.md` is **~65h**, outside the 36h window.
  - **The 07-28 grooming report will age out of the 36h window before the next grooming run writes its successor** (next fire 07:15Z). One or two runs will see no in-window grooming report at all — that is the window working, not a gap.
- **Discord: inbox genuinely empty.** The `after=` cursor returned **HTTP 200, 3 bytes** (`[]`) — the measured empty-case size, so this is a real nil and not a silent failure. `access.json` `allowFrom` read from the file first (single entry, `247984978283986954`), preserving fail-closed ordering. **Nothing from Christian; no receipt owed; none sent.** Cursor unchanged at `1531722112186843226`.
- **No ping sent** — `Needs Christian` is empty; the step-6 gate never pings an empty section, and the stored hash was **read and confirmed** equal to the empty-content hash (`e3b0c442…98b7852b855`, verified against `printf '' | sha256sum` this run rather than assumed from the prefix). No state write needed.
- **Home tree** on `main`, **0 stranded**, **0 behind**, **2 tracked-dirty** (`.claude/settings*.json` — settled property, see correction (c) under *Standing asks*), **1 untracked** (Friday's retro draft).
- **Reaper** ran 03:40 local, 15 min before this run: **33** worktrees / **44** branches / **2** stashes / **0** needs-disposition. Worktrees 32 → 33, branches flat. **Band now five readings wide** (33 → 32 → 33 → 32 → 33, `needs-disposition` flat at 0) — the oscillation is confirmed as churn, not accumulation, and no longer needs restating unless it breaks the band.
- **This run's worktree was created outside `.claude/worktrees/`** (session scratchpad, absolute paths on every write; `rev-parse --show-toplevel` asserted after creation, and the home tree re-checked as still on `main` in the same command, per THR-797). **The home tree was touched by `git -C` reads, one `git worktree add`, three read-only `npm run` probes, and nothing else.**
- **Zero Linear writes.** Two board scans, read-only throughout.

## Open agent work (not Christian's)

- **Armed PRs stalling at `BEHIND` remains the highest-value agent item, and PR #1042 has now proven it does not self-heal.** THR-661's PR (green, armed) has held `BEHIND` for **~1h45m across a full slot boundary** while `main` advanced past it twice more (#1046, #1047). The prior two instances were each cleared or observed once — #1043 was hand-merged 40 minutes in — so this is the first measurement of the un-nudged case, and the answer is *indefinitely*. **THR-735 tracks the general form; the new information is the persistence, not the existence.** Immediate remedy: `git merge origin/main` on the branch (one command, any write-remit session). **This lane files nothing** (finding 23).
- **Assignee-invisibility: 18 of 40 rows carry a name**, so the executor's `assignee:null` query cannot see them — including the sole High (THR-655) and the sole Urgent (THR-842). **Two halves, both agent-owned:** (i) one `save_issue(assignee:null)` per existing row, and (ii) a fix in `tb-orchestrator`'s T1 promotion path, now observed stamping a row on **six** consecutive slots (THR-757, THR-756, THR-681, THR-346, THR-347, THR-348 at 01:30Z). Without (ii), (i) is re-accrued once per sweep — a rate measured across six hours, not projected.
  - **THR-842's invisibility is currently cheap, and saying so is part of the report.** Its Christian-owned half (the billing action) is discharged — the gate probe reads `healthy` with `startupFailureCount: 0`, and THR-768 shipped the guard its item 3 asked for. **This hour offers no *new* corroboration** (no build-relevant deploy ran), so the claim rests on last hour's stronger evidence rather than pretending to fresh support. An invisible row is a defect in the lane's reach whether or not this particular row still has work in it.
- **WIP=1 still breached; THR-838 is In Dev with no assignee for a second hour.** THR-661 carries a name and a live (if stalled) PR; THR-838 has neither, and no PR in flight since #1039 merged at 23:21Z. The **parked** pattern step 1 asks about, now with a duration rather than a single sighting. **Bookkeeping, not lost work.** Remedy belongs to the pickup lane (its Step 0 WIP check), not here. **No ticket** (finding 23).
- **A superseded report PR wants closing: #1031** (orchestrator/THR-762, `CONFLICTING`, untouched since 2026-07-28T19:31:25Z). Its only file is `Docs/ops/orchestrator-2026-07-28.md`, rewritten by later merged runs; the promotion it reports already landed. **Verified superseded, not assumed** (memory: `dirty_pr_may_be_regressing_duplicate`). One `gh pr close`, zero content lost.
- **THR-835 is unreachable in `Idea`** — **partially re-derived this run, and the limit is stated rather than papered over:** both column scans (Ready for Dev, In Dev) confirm it is in neither, which is consistent with the carry but does not re-read its `stateHistory`; that full re-read was skipped this run. **The lane that promotes ran five times in the last five hours and promoted five other rows** (THR-757, THR-756, THR-681, THR-346, THR-347), which remains the sharpest available evidence that `Idea` is outside its reach rather than that it is idle. Content is a live merge hazard (the sole required check runs at 80–90% of its 20-minute cap; runner variance turns correct PRs red). **A working promotion lane that never reaches a column is stronger evidence than a broken one** — `Idea` is unreachable by every automated lane (finding 19). Remedy belongs to a write-remit session. No deadline re-armed.
- **The orchestrator lane's stray-write defect is open and agent-owned.** `tb-orchestrator` wrote its 08:29Z report into the home tree as well as its own worktree, blocking a fast-forward. The durable fix is in that lane's write path (absolute paths, or `rev-parse --show-toplevel` asserted before any write — the workaround this task takes hourly). **Worth a ticket from a session with a write remit; this read-mostly lane files nothing** (finding 23).
- **`rescue/2026-07-17-detached-plans` is provably prunable — re-derived again this run** with the correctly-scoped test (finding 25's corollary), not the whole-tree diff that nearly falsified it: branch at `053c867a`, `origin/main..<branch>` still exactly **4**, and all **five** plan-doc blobs `rev-parse`-identical to `origin/main` (checked individually, not inferred from the commit count). One `git branch -D`, zero risk, wants a write-remit session. The branch count holding at 44 this hour is not evidence either way — the reaper deliberately never auto-deletes stale *unmerged* worktree branches, precisely this branch's class.
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

27. **A timestamp is evidence only once its zone is verified, and a `Z` suffix is a claim like any other.** (Earned 2026-07-28: `tb-orchestrator` labels its report headers in *local* time with a `Z` suffix — `"First run — 00:31Z"` for a sweep Linear records at 22:30:28Z. Last run copied the header and published a two-hour error.) Prefer a machine-written field (`stateHistory`, `lastRunAt`, commit metadata) over a prose header; when only prose is available, say which it was. **The failure is silent by construction** — a wrong-but-plausible hour never contradicts anything, so nothing downstream ever flags it.

28. **A classifier observed only in its stable state has not been tested.** (Earned 2026-07-28 on the deploy probe: two hours of `skipped` across a moving tip proved stability; the hour it switched to `deployed` on a build-relevant change is the first evidence it *discriminates*.) Report a constant verdict as the weaker fact it is, and treat the first correct switch as the real confirmation.

29. **"Green and armed" is not "merging" — and the difference is invisible from every signal a lane normally checks.** (Earned 2026-07-29: PR #1042 held `MERGEABLE`, four SUCCESS checks and auto-merge armed while stuck at `mergeStateStatus: BEHIND`, waiting indefinitely.) Checks answer *is this change correct*; `mergeStateStatus` answers *can it go in now*, and a lane that reads only the first concludes "shipping" about work that has stopped. **The tell is throughput, not status** — this hour's brief noticed because a three-hour merge cadence went to zero, not because anything reported an error. Corollary: the failure rate scales with the *repo's* merge rate, so it worsens exactly when the lane is most productive.

  **Two corollaries earned 2026-07-29 by watching the same PR for a second hour.** (a) **It does not self-heal.** #1042 held `BEHIND` across a full slot boundary while `main` advanced past it twice more; the earlier instance only *looked* transient because a human cleared it 40 minutes in. A state that is always repaired before it is re-measured has never actually been observed. (b) **`gh pr view` returns `UNKNOWN` for `mergeable`/`mergeStateStatus` on the first read** and the true value on the second (memory: `automerge_behind_strict_mode`). A single read this run would have reported a false all-clear on the exact defect being tracked — **always read merge state twice**, and treat the first `UNKNOWN` as "not yet computed", never as "nothing to see".

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

## Resolved 2026-07-29

**Nothing yet** — the UTC day is under two hours old, and nothing Christian-owned has been open to close. **The 07-28 closes are pruned this run as announced**, per file policy; `git log -p Design/user-actions.md` holds their prose. The one line worth keeping in view: the GitHub billing block was cleared 2026-07-28 17:02Z and the merge gate has probed `healthy` every run since, which is what makes *"no open Christian-owned asks"* checkable rather than merely asserted.
