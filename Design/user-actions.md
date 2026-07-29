# User Action Required

**Last updated:** 2026-07-29 01:55 local, by the hourly `keep-work-flowing-cc` CC task.

**NO OPEN CHRISTIAN-OWNED ASKS.** Home tree healthy: on `main`, 0 behind, 0 stranded, autosync fast-forwarding. Deploy healthy — and this run **`deployed`, not `skipped`**: a build-relevant change finally shipped, so the classifier was exercised rather than merely stable. Merge gate healthy. All eight enabled scheduled lanes on time.

## This run's measurements (2026-07-28 23:55 UTC)

- **Assignee-invisibility re-derived: 16 named of 38** (up from last run's 15 of 36). Named: THR-**346**, THR-574, THR-621, THR-626, THR-638, THR-655, THR-667, THR-681, THR-723, THR-756, THR-757, THR-762, THR-763, THR-795, THR-836, THR-842. The mover is **THR-346**; no row lost its name.
  - **Fourth consecutive sighting, same fingerprint — mechanism and remedy both unchanged.** `get_issue(THR-346)` shows `stateHistory` Todo → Ready for Dev at **23:28:57Z**, attached to *"orchestrator T1 sweep — promote THR-346"* (PR #1043, commit `49a897c5`), and the row landed **already carrying the name**. Four consecutive `tb-orchestrator` T1 promotions (THR-757 20:30Z, THR-756 21:31Z, THR-681 22:30Z, THR-346 23:28Z), four stamped rows. Finding 26's threshold was the *second* sighting; the third and fourth change neither the mechanism nor the remedy, and reporting them as confirmation rather than news is the discipline that finding asks for.
  - **The per-slot rate holds at one row per T1 sweep across four consecutive hours.** The prediction first stated three runs ago is now corroborated at its own cadence four times; further hourly re-confirmation has sharply diminishing value, and the next report of it should be a change or nothing.
  - **A timestamp correction worth carrying:** the orchestrator's own report headers label its runs in **local** time with a `Z` suffix (`"First run — 00:31Z"` for a sweep whose Linear `stateHistory` records 22:30:28Z). The state history is authoritative; the report header is not. Last run's "00:31Z" was that mislabel propagated — restated here as 22:30Z.
  - Absent-key guard unchanged and re-applied: `list_issues` omits `assignee` for unassigned rows rather than emitting `null`, so both forms were coerced to one bucket before counting.
  - **The remedy is unchanged and still not escalated:** one `save_issue(assignee:null)` per named row from any write-remit session, plus the lane-side fix. Christian does not touch Linear (THR-608), so this is an invalid ask to raise with him by construction.
- **Queue: BACKED UP — 38 ready (1 Urgent / 1 High / 9 Medium / 27 Low), 2 In Dev.** Nothing stale: oldest `updatedAt` is 2026-07-24T07:59Z (THR-715), **~4.7 days**, inside `STALE_ISSUE_DAYS`=7. Depth 36 → 38.
  - **The +2 reconciles exactly against the composition, which is the check that makes the count trustworthy rather than merely reported.** THR-346 entered as a Low (Low 26 → 27) and THR-844 as a Medium (Medium 8 → 9); Urgent and High held. Two arrivals, two buckets, zero departures — no reclassification hidden inside the delta.
  - **The two arrivals have different provenance and only one is a promotion.** THR-346 is the orchestrator's T1 sweep; **THR-844** (`'investigation'` is a dead `revealFamily` — 66 of 138 hidden-mark entries unreachable) was *filed by the executor* while working THR-661, i.e. the deferral path working as intended.
  - **Depth is still not a starvation signal in either direction.** 38 ready is planning outrunning execution by design, not a stall.
- **WIP=1 is breached this run: 2 In Dev (THR-838 and THR-661), and this is the first breach observed by this lane.** `tb-opus-pickup` ran 23:01:47Z and claimed **THR-661** (`updatedAt` 23:19:32Z) while **THR-838** was already In Dev and mid-delivery. **Both are genuinely active, so the cost is protocol rather than throughput** — but the rule is finish-before-you-start, and the breach is what makes a second claim invisible to the "one in flight" reading every prior run relied on. Agent-owned; named in the brief as crew work, not raised with Christian.
- **THR-838 is still the hour's event and still on a beat.** PR **#1039** merged (`b0798230`) — `thr-838/ws5-batch-1-pass-3`, the devotion pair. Three merged PRs in three hours (#1033, #1036, #1039). Delivery cadence, not a stall.
- **Deploy (step 2.5): `deployed`** — `{"verdict":"deployed","deployedSha":"b0798230"}`. **The verdict moved `skipped` → `deployed`, and the cause is the content itself.** Two prior hours held `skipped` across a moving tip because the commits were data-only; this hour's encounter content was build-relevant, so a real build ran and the live site advanced. **A classifier that was only ever observed stable is weaker evidence than one observed switching correctly** — this is the first exercise of the discriminating branch since THR-785 shipped, and it discriminated.
- **Merge gate (step 2.5b): `healthy`**, `startupFailureCount: 0`. **THR-842's Urgent framing is now stale in substance though the row stays open** — the probe reports the robots starting normally, and this hour supplies the stronger corroboration the previous two hours could not: a **build-relevant deploy completed**, which requires the workflow to execute steps rather than merely conclude. One signal of a different kind beats a third repetition of the same one (finding 9).
- **Step 2.7 (heartbeat) clean:** `{"verdict":"ok","checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"]}`. `tb-orchestrator` ran 23:27:10Z — **ninth consecutive on-time slot**; the THR-837 stall is not recurring.
- **Sibling reports (step 2.6): none folded in.** `orchestrator-2026-07-29.md` is an empty state (*"Nothing needs you this run."*) — skipped per the empty-state rule. `backlog-grooming-2026-07-28.md` is still in-window (~16.7h) and its section was **re-read rather than carried on last run's verdict**; the re-read confirms the prune: it warned WS5 had no batch children and that `tb-orchestrator` had not run since 20:27, and it closes with *"no action from you today"*. Both premises are falsified (THR-838 exists with three merged PRs; nine consecutive orchestrator slots), and its own recommendation was already "nothing". `weekly-hygiene-2026-07-26.md` is ~86h old, outside the 36h window.
- **Discord: inbox genuinely empty.** The `after=` cursor returned **3 bytes** (`[]`) — the measured empty-case size, so this is a real nil and not a silent failure. `access.json` `allowFrom` read from the file first (single entry, `247984978283986954`), preserving fail-closed ordering. **Nothing from Christian; no receipt owed; none sent.** Cursor unchanged at `1531722112186843226`.
- **No ping sent** — `Needs Christian` is empty; the step-6 gate never pings an empty section, and the stored hash already equals the empty-content hash.
- **Home tree** on `main`, **0 stranded**, **0 behind**, **2 tracked-dirty** (`.claude/settings*.json` — settled property, see correction (c) under *Standing asks*), **1 untracked** (Friday's retro draft).
- **Reaper** ran 01:40 local, 15 min before this run: **33** worktrees / **43** branches / **2** stashes / **0** needs-disposition. Worktrees 32 → 33, branches flat. **Not alarmed, and the reason is now a measured range rather than a judgement call** — the count has moved 33 → 32 → 33 across three healthy hourly readings while `needs-disposition` stayed 0, which is session churn oscillating inside a band, not accumulation.
- **This run's worktree was created outside `.claude/worktrees/`** (session scratchpad, absolute paths on every write; `rev-parse --show-toplevel` asserted after creation, and the home tree re-checked as still on `main` immediately after, per THR-797). **The home tree was touched by `git -C` reads, one `git worktree add`, three read-only `npm run` probes, and nothing else.**
- **Zero Linear writes.** Two board scans plus one targeted read (THR-346), read-only throughout.

## Open agent work (not Christian's)

- **Assignee-invisibility: 16 of 38 rows carry a name**, so the executor's `assignee:null` query cannot see them — including the sole High (THR-655) and the sole Urgent (THR-842). **Two halves, both agent-owned:** (i) one `save_issue(assignee:null)` per existing row, and (ii) a fix in `tb-orchestrator`'s T1 promotion path, now observed stamping a row on **four** consecutive slots (THR-757 20:30Z, THR-756 21:31Z, THR-681 22:30Z, THR-346 23:28Z). Without (ii), (i) is re-accrued once per sweep — a rate measured across four hours, not projected.
  - **THR-842's invisibility is currently cheap, and saying so is part of the report.** Its Christian-owned half (the billing action) is discharged — corroborated this run by a **completed build-relevant deploy**, which is stronger than another green check because it requires steps to have executed — and THR-768 shipped the guard its item 3 asked for. An invisible row is a defect in the lane's reach whether or not this particular row still has work in it, but reporting the two as one alarm would overstate it.
- **WIP=1 breach: THR-838 and THR-661 are both In Dev.** `tb-opus-pickup` claimed THR-661 at ~23:19Z with THR-838 already in flight. **Both are genuinely active**, so this costs protocol adherence rather than throughput — but every prior run of this brief read "1 In Dev" as a health signal, and a second concurrent claim is exactly what that reading cannot see. Remedy belongs to the pickup lane (its Step 0 WIP check), not here. **No ticket from this read-mostly lane** (finding 23).
- **THR-835 is unreachable in `Idea`** — **partially re-derived this run, and the limit is stated rather than papered over:** both column scans (Ready for Dev, In Dev) confirm it is in neither, which is consistent with the carry but does not re-read its `stateHistory`; that full re-read was skipped this run. **The lane that promotes ran four times in the last four hours and promoted four other rows** (THR-757, THR-756, THR-681, THR-346), which remains the sharpest available evidence that `Idea` is outside its reach rather than that it is idle. Content is a live merge hazard (the sole required check runs at 80–90% of its 20-minute cap; runner variance turns correct PRs red). **A working promotion lane that never reaches a column is stronger evidence than a broken one** — `Idea` is unreachable by every automated lane (finding 19). Remedy belongs to a write-remit session. No deadline re-armed.
- **The orchestrator lane's stray-write defect is open and agent-owned.** `tb-orchestrator` wrote its 08:29Z report into the home tree as well as its own worktree, blocking a fast-forward. The durable fix is in that lane's write path (absolute paths, or `rev-parse --show-toplevel` asserted before any write — the workaround this task takes hourly). **Worth a ticket from a session with a write remit; this read-mostly lane files nothing** (finding 23).
- **`rescue/2026-07-17-detached-plans` is provably prunable — still present, re-derived again this run** with the correctly-scoped test (finding 25's corollary), not the whole-tree diff that nearly falsified it: branch at `053c867a`, `origin/main..<branch>` still exactly **4**, and all **five** plan-doc blobs `rev-parse`-identical to `origin/main`. One `git branch -D`, zero risk, wants a write-remit session. **The branch count holding flat at 43 this hour is not evidence either way** — the reaper deliberately never auto-deletes stale *unmerged* worktree branches, precisely this branch's class, so the carry is insulated from that count whether it rises, falls, or holds.
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
