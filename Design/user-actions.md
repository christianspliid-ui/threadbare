# User Action Required

**Last updated:** 2026-07-28 20:58 local, by the hourly `keep-work-flowing-cc` CC task.

**NO OPEN CHRISTIAN-OWNED ASKS.** Home tree healthy: on `main`, 0 behind, 0 stranded, autosync fast-forwarding. Deploy healthy. All eight enabled scheduled lanes on time.

> **PRUNED HARD AT THIS RUN — 344 lines / 120 KB → this file.** The previous run's own header announced a prune and then grew the file instead: two full per-run measurement essays, plus multi-paragraph elaborations under most findings. That is the shape this file's own § *How this works* forbids — *"No history retained here — `git log` + the retros are the audit trail"* — and the skill forbids separately (*"Do not turn this into a retro"*). **Nothing is destroyed:** `git log -p Design/user-actions.md` holds every pruned word. The 25 durable findings are kept **as their rule sentences**, which is the form that transfers; their worked examples are in git. **Recorded rather than done quietly**, because a file that silently loses a section is indistinguishable from one nobody re-read.

## This run's measurements (2026-07-28 18:58 UTC)

- **CORRECTION — the assignee-invisibility count is 11 named of 33, not 20 of 32.** The previous run reported *"20 of 32 invisible, 12 genuinely `assignee:null`"*. Measured fresh this run: **22 rows are `assignee:null`, 11 carry a name** (THR-842, THR-655, THR-836, THR-638, THR-621, THR-667, THR-763, THR-795, THR-574, THR-626, THR-723). Ten rows the last run listed as named — THR-818, THR-781, THR-806, THR-771, THR-770, THR-769, THR-740, THR-739, THR-661, THR-715 — read `null` today.
  - **The likely mechanism is a serialisation detail, and it is worth naming because it will recur.** `list_issues` **omits the `assignee` key entirely** for unassigned issues rather than emitting `null` — this run's first extraction script crashed on `KeyError: 'assignee'`, which is how it surfaced. A presence-test written one way counts absent-key rows as named; written the other way it counts them as null. **The prior number was not a miscount of a set, it was a field that does not exist being read as a value** — finding 2's shape at the serialisation layer.
  - **I did not re-derive whether the ten rows were cleared in the last hour or were never named.** Either is consistent with what I measured, and distinguishing them costs a history read this run did not take. **Stated as a limit rather than resolved by the flattering assumption** (finding 25).
  - **The remedy is unchanged and still not escalated:** one `save_issue(assignee:null)` per named row from any write-remit session. Christian does not touch Linear (THR-608), so this is an invalid ask to raise with him by construction.
- **Queue: BACKED UP — 33 ready (1 Urgent / 1 High / 8 Medium / 23 Low), 1 In Dev.** Nothing stale: oldest `updatedAt` is 2026-07-24 (THR-715 / THR-661 / THR-739), **~4.0 days**, inside `STALE_ISSUE_DAYS`=7. Depth 32 → 33.
  - **Composition, not depth (finding 6): the arrival is the priority programme unjamming.** THR-838 (Nudge Model WS5 Batch 1, 48 templates) is on the shelf — the split that `daily-backlog-grooming` flagged this morning as the programme's one blocker. Three Low findings (THR-839/840/841) filed underneath.
- **Nothing shipped this hour.** The only commit on `origin/main` since the last brief is this task's own briefing refresh (`4565ba4f`, PR #1028). THR-768 has held the single WIP slot since **16:35Z (~2.4h)**. **Not reported as a stall** — it is a detector build, and 2.4h is unremarkable for one.
- **Deploy (step 2.5): `skipped`, healthy** — `{"verdict":"skipped","needsChristian":false,"deployedSha":"6534a3d8"}`, unchanged. Correctly not reported as a stoppage (finding 14).
- **Step 2.7 (heartbeat) clean:** `{"verdict":"ok","checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"]}`. `tb-orchestrator` ran 18:27Z — **fourth consecutive on-time slot**; the THR-837 stall is not recurring.
- **Sibling reports (step 2.6): none folded in.** Both in-window reports are empty states (`orchestrator-2026-07-28.md`, `backlog-grooming-2026-07-28.md`); `weekly-hygiene-2026-07-26.md` is ~59h old, outside the 36h window. **The grooming report's WS5 conditional is now discharged by the event it named** — it asked for attention *"if WS5 still has no children by tomorrow's grooming run"*; THR-838 exists.
- **Discord: one new message, and it was this task's own receipt.** The `after=` cursor returned 2447 bytes / one message, author `1530180014165856296` (**bot**), skipped by author as step 0 requires. **`access.json` `allowFrom` read from the file first** (single entry, `247984978283986954`), preserving the fail-closed ordering. **Nothing from Christian; no receipt owed; none sent.** Cursor advanced to `1531722112186843226`.
- **No ping sent** — `Needs Christian` is empty and the step-6 gate never pings an empty section.
- **Home tree** on `main`, **0 stranded**, **0 behind**, **2 tracked-dirty** (`.claude/settings*.json` — retired from reporting as a settled property; see correction (c) under *Standing asks*), **1 untracked** (Friday's retro draft).
- **Reaper** ran 20:40 local, 18 min before this run: **32** worktrees / **44** branches / **2** stashes / **0** needs-disposition. Flat on every count.
- **This run's worktree was created outside `.claude/worktrees/`** (session scratchpad, absolute paths on every write; `rev-parse --show-toplevel` asserted after creation, per THR-797). **The home tree was touched by `git -C` reads, one `git worktree add`, two read-only `npm run` probes, and nothing else.**
- **Zero Linear writes.** Two board scans, read-only throughout.

## Open agent work (not Christian's)

- **Assignee-invisibility: 11 of 33 rows carry a name**, so the executor's `assignee:null` query cannot see them — including the sole High (THR-655) and the sole Urgent (THR-842). One `save_issue(assignee:null)` per row from any write-remit session. **Count corrected this run; see measurements above.**
- **THR-835 is unreachable in `Idea`** — untouched since 2026-07-27 07:10Z through many on-time orchestrator slots. Content is a live merge hazard (the sole required check runs at 80–90% of its 20-minute cap; runner variance turns correct PRs red). **A working promotion lane that never reaches a column is stronger evidence than a broken one** — `Idea` is unreachable by every automated lane (finding 19). Remedy belongs to a write-remit session. No deadline re-armed.
- **The orchestrator lane's stray-write defect is open and agent-owned.** `tb-orchestrator` wrote its 08:29Z report into the home tree as well as its own worktree, blocking a fast-forward. The durable fix is in that lane's write path (absolute paths, or `rev-parse --show-toplevel` asserted before any write — the workaround this task takes hourly). **Worth a ticket from a session with a write remit; this read-mostly lane files nothing** (finding 23).
- **`rescue/2026-07-17-detached-plans` is provably prunable** — four unique commits, all five blobs byte-identical to `origin/main`. One `git branch -D`, zero risk, wants a write-remit session.
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
25. **A confirmed test licenses the claim it tested, not the remedy that motivated it — and the gap is widest exactly when the result is most satisfying.**

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

- **17:02 — Christian cleared the GitHub billing block, ~5 minutes after the doorbell**, the shortest ask-to-action on record here. CI green at 17:03:31Z and unbroken since; **THR-822 reached Done at 17:15:43Z unaided**, which is the stronger proof — the ask's stated harm was never "CI is red" but "two robots are off and work is landing unwatched". Residues, none of them asks: THR-842 (incident) and THR-768 (detector) stay open as crew work; impediment **#278** logged.
- **11:55 — Christian resolved the home-tree fast-forward block** (opened 09:00Z, ~2h55m ask-to-action), evidenced by stash + reflog rather than inferred from the behind-count. `stash@{0}` holds a 42-line diff whose content is already on `origin/main` via PR #1002 — droppable whenever, **not** a new ask.
- **~13:22 — THR-837 shipped** (`bbe61805`), the scheduled-task heartbeat probe this brief now runs hourly. The five-run disposition (*a ticket whose present tense has expired is not thereby void; record the staleness where the next reader looks and leave the ticket to its owner*) is vindicated: neither tempting repair — closing it, or rewriting its prose — was destructive-in-hindsight, because neither was done.
- **Earlier closes** (THR-778 unpullability after twelve runs, the orchestrator standing test, the no-High gap, THR-618 + THR-840, the assignee-invisibility standing test) are pruned to this line per file policy; `git log -p` holds the prose.
