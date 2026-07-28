# User Action Required

**Last updated:** 2026-07-28 21:58 local, by the hourly `keep-work-flowing-cc` CC task.

**NO OPEN CHRISTIAN-OWNED ASKS.** Home tree healthy: on `main`, 0 behind, 0 stranded, autosync fast-forwarding. Deploy healthy (serving `main` tip). Merge gate healthy. All eight enabled scheduled lanes on time.

> **The previous run's hard prune held** — the file did not regrow this hour. The prune notice itself is dropped as history, per this file's own § *How this works* (*"No history retained here"*); `git log -p Design/user-actions.md` has it. Recorded in one line rather than dropped silently, for the same reason the prune was.

## This run's measurements (2026-07-28 19:58 UTC)

- **Assignee-invisibility re-derived: 12 named of 34** (up from last run's corrected 11 of 33). Named: THR-574, THR-621, THR-626, THR-638, THR-655, THR-667, THR-723, THR-762, THR-763, THR-795, THR-836, THR-842. The mover is **THR-762**, which read `null` last run.
  - **Same absent-key hazard, same guard.** `list_issues` omits `assignee` entirely for unassigned rows rather than emitting `null`, so a presence-test written the wrong way inverts the count. This run's extraction coerced missing-key **and** explicit-null to one bucket, and the direction was spot-checked against `get_issue` in **both** senses — THR-842 returns `"assignee":"Christian Spliid"`, THR-838 returns no key. **Confirming a count in one direction only is what produced the number this correction replaced.**
  - **I did not re-derive *why* THR-762 changed hands.** It updated 19:31Z, four minutes after an orchestrator slot, but proximity is not authorship (finding 24). Stated as a limit.
  - **The remedy is unchanged and still not escalated:** one `save_issue(assignee:null)` per named row from any write-remit session. Christian does not touch Linear (THR-608), so this is an invalid ask to raise with him by construction.
- **Queue: BACKED UP — 34 ready (1 Urgent / 1 High / 8 Medium / 24 Low), 0 In Dev.** Nothing stale: oldest `updatedAt` is 2026-07-24 (THR-715), **~4 days**, inside `STALE_ISSUE_DAYS`=7. Depth 33 → 34.
  - **0 In Dev is not a starved lane and must not be reported as one.** `tb-opus-pickup` fires at :00 (next 20:00Z, ~2 min after this run) against a 34-deep shelf. An empty WIP slot measured **between** slots is the expected reading of a WIP=1 lane, not an idle executor — the distinguishing evidence is the shelf depth and the next fire time, both of which say otherwise.
- **THR-768 shipped — the hour's real event.** Done at **19:22:54Z** (`43f88db3`, PR #1026), after 2h47m in Dev. That was the sole in-flight job and the detector this brief's own step 2.5b runs; it closes the vacuous-merge-gate hole that THR-842 opened. **The prior run's refusal to call its 2.4h a stall was correct** — it was a detector build finishing normally.
- **Deploy (step 2.5): `deployed`** — `{"verdict":"deployed","deployedSha":"46d1d345"}`, serving `main` tip. **The verdict moved `skipped` → `deployed` because THR-768 shipped build-relevant code**, which is the transition that proves the probe distinguishes the two rather than defaulting to benign (finding 14).
- **Merge gate (step 2.5b): `healthy`**, `startupFailureCount: 0`. The billing block Christian cleared at 17:02Z has not recurred.
- **Step 2.7 (heartbeat) clean:** `{"verdict":"ok","checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"]}`. `tb-orchestrator` ran 19:27Z — **fifth consecutive on-time slot**; the THR-837 stall is not recurring.
- **Sibling reports (step 2.6): none folded in.** Both in-window reports are empty states (`orchestrator-2026-07-28.md` 19:50 local, `backlog-grooming-2026-07-28.md` 09:50 local); `weekly-hygiene-2026-07-26.md` is ~59h old, outside the 36h window.
- **Discord: inbox genuinely empty.** The `after=` cursor returned **3 bytes** (`[]`) — the measured empty-case size, so this is a real nil and not a silent failure. `access.json` `allowFrom` read from the file first (single entry, `247984978283986954`), preserving fail-closed ordering. **Nothing from Christian; no receipt owed; none sent.** Cursor unchanged at `1531722112186843226`.
- **No ping sent** — `Needs Christian` is empty; the step-6 gate never pings an empty section, and the stored hash already equals the empty-content hash.
- **Home tree** on `main`, **0 stranded**, **0 behind**, **2 tracked-dirty** (`.claude/settings*.json` — retired from reporting as a settled property; see correction (c) under *Standing asks*), **1 untracked** (Friday's retro draft).
- **Reaper** ran 21:40 local, 15 min before this run: **32** worktrees / **44** branches / **2** stashes / **0** needs-disposition. Flat on every count for the second hour.
- **This run's worktree was created outside `.claude/worktrees/`** (session scratchpad, absolute paths on every write; `rev-parse --show-toplevel` asserted after creation, and the home tree re-checked as still on `main` immediately after, per THR-797). **The home tree was touched by `git -C` reads, one `git worktree add`, three read-only `npm run` probes, and nothing else.**
- **Zero Linear writes.** Two board scans plus three targeted reads, read-only throughout.

## Open agent work (not Christian's)

- **Assignee-invisibility: 12 of 34 rows carry a name**, so the executor's `assignee:null` query cannot see them — including the sole High (THR-655) and the sole Urgent (THR-842). One `save_issue(assignee:null)` per row from any write-remit session. **Count re-derived this run and it moved; see measurements above.**
  - **THR-842's invisibility is currently cheap, and saying so is part of the report.** Its Christian-owned half (the billing action) is discharged, and THR-768 shipped the guard its item 3 asked for. An invisible row is a defect in the lane's reach whether or not this particular row still has work in it — but reporting the two as one alarm would overstate it.
- **THR-835 is unreachable in `Idea`** — re-derived this run: still `Idea`, still `updatedAt 2026-07-28T07:10:00Z`, untouched through five further on-time orchestrator slots. Content is a live merge hazard (the sole required check runs at 80–90% of its 20-minute cap; runner variance turns correct PRs red). **A working promotion lane that never reaches a column is stronger evidence than a broken one** — `Idea` is unreachable by every automated lane (finding 19). Remedy belongs to a write-remit session. No deadline re-armed.
- **The orchestrator lane's stray-write defect is open and agent-owned.** `tb-orchestrator` wrote its 08:29Z report into the home tree as well as its own worktree, blocking a fast-forward. The durable fix is in that lane's write path (absolute paths, or `rev-parse --show-toplevel` asserted before any write — the workaround this task takes hourly). **Worth a ticket from a session with a write remit; this read-mostly lane files nothing** (finding 23).
- **`rescue/2026-07-17-detached-plans` is provably prunable — re-derived and CONFIRMED this run.** Four unique commits (`053c867a`, `8fa552c2`, `59ea82df`, `cf2f2dd5`) touching five plan docs; every one of the five blobs is byte-identical to `origin/main` by `rev-parse` comparison. One `git branch -D`, zero risk, wants a write-remit session.
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
