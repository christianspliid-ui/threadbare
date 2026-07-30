# User Action Required

**Last updated:** 2026-07-30 05:57 local, by the hourly `keep-work-flowing-cc` CC task.

**ZERO OPEN CHRISTIAN-OWNED ASKS — eighth consecutive run at zero, third consecutive run at a true empty (no standing asks either).** Discord inbox **genuinely empty** for a sixth consecutive hour — the `after=` cursor returned a literal `[]` (2 bytes). Home tree healthy: on `main`, 0 stranded, **0 behind**, 2 tracked-dirty (settled). Deploy `skipped`-benign, publish point **flat** at `bcfbe645` for a **second** consecutive hour. Merge gate `healthy`, `startupFailureCount: 0`. Fleet heartbeat `ok` — all 8 enabled lanes within tolerance. **The hour's event is a methodological one: last run's stated-in-advance test on PR #1085 RESOLVED IN FORM AND FAILED TO DISCRIMINATE — its threshold (1.5h) sits below the only known counter-example (2h07m), so the observation is consistent with both hypotheses.** A carried claim was re-derived and this time it **held**.

## This run's measurements (2026-07-30 03:57 UTC)

Full hour since the previous brief; the lane held its `:45` slot and the deltas below span a true hour.

- **THE STATED TEST RESOLVED IN FORM AND CANNOT DISCRIMINATE — this is the run's finding.** Last run wrote: *"if #1085 is still `OPEN`/`BEHIND` at 03:58Z (~1.5h armed), the branch needs an explicit update and 'armed' is not self-healing at this cadence; if it merged, the retraction generalises."* **Read at 03:57:38Z, twice: `OPEN` / `BEHIND` / `MERGEABLE`, armed `02:29:27Z` — 88 minutes.** So the antecedent is satisfied.
  - **But the consequent does not follow, and the error is in the test's construction, not its execution.** Finding 29(a) was retracted because **#1042 merged ~2h07m after entering `BEHIND`.** A checkpoint at **1h30m** therefore sits *below* the one observed self-heal time: "still `BEHIND` at 90 minutes" is exactly what a self-healing PR **and** a stuck PR both look like at 90 minutes. **The test was under-powered against its own known counter-example.**
  - **Properly-powered restatement for next run:** if #1085 is still `OPEN`/`BEHIND` **after 04:36Z** (>2h07m, exceeding the known self-heal), "armed does not self-heal at this cadence" is supported; if it merges before then, the retraction generalises. **Next brief lands after that boundary.**
  - **Both reads returned real values, not `UNKNOWN`** — so finding 29(b)'s first-read artefact is not in play here.
- **Queue: BACKED UP — 52 ready (0 Urgent / 0 High / 16 Medium / 36 Low), 1 In Dev.** Nothing stale: oldest `updatedAt` is THR-739 at 2026-07-24T20:29:29Z, **~5.31 days**, inside `STALE_ISSUE_DAYS`=7.
  - **Shelf 51 → 52, and this hour it reconciles trivially** — worth stating because last hour's reconciliation was the interesting part and this one is not. **+1 THR-864** (03:29:44Z, orchestrator's nightly batch). **Nothing claimed, nothing completed, nothing else filed.** THR-667 remains the single In-Dev item, unchanged since 02:02Z.
- **A CARRIED CLAIM WAS RE-DERIVED AND HELD — recording it because finding 1's payouts are usually corrections.** The claim: *"the reader no longer filters on assignee (THR-845), so the leak is cosmetic."* **Checked directly against `.claude/skills/pull-work/SKILL.md` rather than carried:** line 27 selects *"**every** queue item, not only the unassigned ones"*; line 176 states the second call *"deliberately does **not** filter on `assignee:null` (THR-845)"*. **The claim is true and is now sourced to a line number rather than to a merge event.**
  - **The skill goes further than the carry did, and this changes the disposition.** Line 181 defines a trace line — `[pull-work] Step 1: Ready for Dev <total>, unassigned <U>, carrying an assignee <A>` — and line 184 rules that **`A > 0` "means the writer-side leak has reopened… Treat those issues as candidates anyway, and clear the stray assignee on the one you pick… a non-zero `A` is a number to report, not a blocker."** **So this run's measurement is not a regression report; it is the documented handled path, and the number it wants is `total 52, unassigned 50, A=2`.**
- **The write-side leak is live at the predicted rate, and the contrast class held for a second filing.** THR-864 (`createdAt` 03:29:44.847Z, orchestrator-filed) carries `assignee: "Christian Spliid"`. **This is the second consecutive orchestrator filing stamped and left uncleared** — THR-863 (02:31Z) is still stamped an hour and a half later.
  - **The lane discriminator from last run survives the new data point.** Orchestrator-filed 02:31Z and 03:29Z: both stamped. Executor-filed 02:22Z (THR-862): clean. **THR-861 (orchestrator, 01:30Z) reads clean but was hand-cleared by the orchestrator's own run, so it is not evidence about the write path** — a distinction worth keeping, because counting it as clean would falsely weaken the contrast.
  - **Accrual rate is exactly what finding 31 demanded be stated: ~1/hour, and two hours have now produced two.** **Consequence remains nil** — re-derived above from the reader's source, not assumed.
- **Deploy (step 2.5): `skipped`, benign, `deployedSha` FLAT at `bcfbe6454c99ea6758426551b1c98ae0d50cb26d` for a SECOND consecutive hour.** Verbatim: *"The live site is up to date. Commits since the last publish (bcfbe645) only touched notes and docs, so the game itself did not need rebuilding."* **Correct: the only merge this hour was PR #1088, an orchestrator report.**
- **Merge gate (step 2.5b): `healthy`, `startupFailureCount: 0`, `standDown: false`.** **Fourteenth consecutive independent confirmation** that Christian's billing action holds.
- **Step 2.7 (heartbeat) returned `ok`.** Verbatim: `{"verdict":"ok","needsChristian":false,"checked":8,"stalled":[],"neverRun":["monthly-rulebook-review"],"summary":"All 8 enabled scheduled tasks are within 2 slots of schedule."}`. **Thirteenth consecutive `ok`**, fourth genuinely-awake overnight — lanes fired 03:01Z / 03:26Z / 03:53Z at **distinct** timestamps, so the wake-boundary defect is untriggered rather than merely quiet.
- **Reaper healthy — ran 05:40:02 local (03:40Z), 17 minutes before this brief.** `SUMMARY:` **37** worktrees / **50** branches / **2** stashes / **0** needs-disposition. **Branches moved 48→50**; worktrees held at 37. A moving count proves the log is live rather than frozen.
- **Home tree** on `main`, **0 stranded**, **0 behind**, **2 tracked-dirty** (`.claude/settings*.json` — settled property, correction (c) below), **1 untracked** (Friday's retro draft).
- **Discord: the cursor returned `[]` — 2 bytes, zero messages, for a sixth consecutive hour.** No receipt owed, none sent; cursor left at `1532100414189867109`. `allowFrom` was read from `access.json` **before** any classification, preserving fail-closed ordering with nothing to authorize. **Silence is not evidence he is away** (finding 8).
- **Ping gate (step 6): no ping sent, correctly.** Stored hash `e3b0c44298fc…b7852b855` = SHA-256 of the empty string; this run's Needs-Christian is also empty, so the hash matches and the doorbell stays silent.
- **Sibling reports (step 2.6): two in-window, no items folded.** `orchestrator-2026-07-30f.md` reads *"Nothing needs you. The Nudge Model WS5 content migration (THR-838) keeps moving one right-sized batch per hour…"* — **empty state, skipped per the rule**, and top-level `##` so the consumer's pattern matched. `backlog-grooming-2026-07-29.md` (~14h) leads with *"Nothing needs you"* — likewise skipped. `weekly-hygiene-2026-07-26.md` is **~92h**, outside the 36h window.
  - **Same-day collision is now SIX files** (`-30` … `-30f`). mtime and lexical order still agree, **so the consumer has been correct-by-luck six consecutive hours.** Collision cause ticketed (THR-849); **consumer-side half still unticketed.**
- **Zero Linear writes.** Four column reads (`Ready for Dev` total, `Ready for Dev` `assignee:null`, `In Dev`, a title query) and one `get_issue` (THR-845). Read-only throughout.
- **This run's worktree was created outside `.claude/worktrees/`** (`Dev/Projects/kwf-wt-20260730-0357`), with `rev-parse --show-toplevel` asserted after creation, **the `.git` file's existence checked (THR-797), and the home tree's branch re-read as `main` in the same command.** **The home tree was touched by `git -C` reads, one `git worktree add`, three read-only `npm run` probes, `gh` reads, and nothing else.**

## Open agent work (not Christian's)

- **PR #1085 (THR-667) is green, armed, and `BEHIND` at 88 minutes — and the discriminating checkpoint has not arrived yet.** Every check `SUCCESS`, `mergeable: MERGEABLE`, auto-merge armed 02:29:27Z. **Next run's properly-powered test is stated above (>04:36Z).** Either way this is agent-side: one branch update lands it immediately.
- **The orchestrator's write sequence remains the narrowed suspect for the assignee leak, now with two consecutive confirming filings and an intact contrast class.** Fix shape unchanged: **instrument the orchestrator's own `create → save_issue(null) → get_issue` sequence on its next filing and record the three responses.** **Wants a ticket from a write-remit session** (finding 23). **Priority is genuinely low** — `pull-work` line 184 already rules the condition non-blocking and instructs inline repair.
- **The step-0 allowlist snippet wants a one-token path fix**: `$HOME` → `$USERPROFILE` or a Windows-resolvable literal, because Windows `python` cannot open the MSYS-style path `$HOME` expands to. **Wants a ticket** (finding 23).
- **Step 2.6's section extraction is keyed on the producer's incidental formatting AND its file naming, and neither is stable. The file-selection axis is now SIX-deep in a single day.** mtime and lexical order still agree (`.` < `b` < … < `f`), **so the consumer has been correct-by-luck six consecutive hours.** Prior derivation unchanged: `orchestrator-2026-07-30.md` uses `## Needs Christian`; `orchestrator-2026-07-29.md` uses `### Needs Christian` — **same lane, two files, one day apart, two different levels.** **Fix shape:** select by explicit mtime (not glob order), match the *text* with a permissive level (`^#{2,6} Needs Christian`), terminate on a same-or-shallower heading. **Wants a ticket** (finding 23).
- **`check:task-heartbeat` mis-fires at a wake boundary — carried, not re-derived this run.** The probe accepts any sibling whose `lastRunAt` falls **inside** the stall window as its liveness witness; after a host sleep the whole fleet's `lastRunAt` clusters at the window's *closing* edge. **Fix shape:** require the witness to have fired strictly inside the window with a margin, or detect the burst directly (≥2 lanes sharing a `lastRunAt` to the second ⇒ host-wake, suppress). **Wants a ticket** (finding 23).
- **Verify-after-write needs a clock — carried; THR-860's self-refuting row remains the best artefact.** Its description asserts a `get_issue` re-query confirmed the assignee absent; the field was present on read. **The claim and its refutation live in the same row.** **Fix shape:** verify after the last side-effect in your own sequence, or on the next run.
- **A superseded report PR wants closing: #1031** (orchestrator/THR-762). `OPEN`, `mergeStateStatus` **`DIRTY`**, `mergeable` `CONFLICTING`, `updatedAt` still `2026-07-28T19:31:25Z` — **~32.4h idle**, and its required check reads `SKIPPED`. Consistent with a superseded report doc, not a regression (memory `dirty_pr_duplicate`). **One `gh pr close`, zero content lost.**
- **THR-835 is unreachable in `Idea`** — carried. The required check has repeatedly run at 80–90% of its 20-minute cap, which is exactly the runner-variance hazard THR-835 describes. **A working promotion lane that never reaches a column is stronger evidence than a broken one** (finding 19). Remedy belongs to a write-remit session.
- **`rescue/2026-07-17-detached-plans` is prunable — carried, not re-derived this run.** A **local branch only**; against `origin/main` it carried **4 unique commits** as of 22:54Z. **Pruning it is `git branch -D` in the home tree, which this lane may not do** — not merely unclaimed, unclaimable from here. **Wants a write-remit session with home-tree authority.**
- **The orchestrator lane's stray-write defect is open and agent-owned.** `tb-orchestrator` wrote its 08:29Z report into the home tree as well as its own worktree, blocking a fast-forward. Durable fix is in that lane's write path (absolute paths, or `rev-parse --show-toplevel` asserted before any write — the workaround this task takes hourly). **Wants a ticket** (finding 23).
- **No gate notices live/mirror prompt divergence.** The two were proven in sync for `tb-orchestrator` on 2026-07-30 02:58Z (diff = one trailing newline), so the general defect stands without a live instance: `~/.claude/scheduled-tasks/<id>/SKILL.md` is what runs, `Docs/ops/scheduled-task-prompts/` is a mirror a merge can update while the live copy stays stale, and **nothing compares them.** THR-850 covers the missing mirror for `tb-opus-pickup`; the divergence *detector* is unticketed. **Wants a ticket** (finding 23).
- **Friday's retro draft** (`Design/retros/retro-2026-07-24-draft.md`) is untracked and wants a `git add` in any docs PR. **Not a carry** — it is THR-798's step 2, with an owner and a Done-when.
- **Impediment #267 is used twice**; **#219 and #228 are duplicate rows for one defect**. Both dispositions: fold at the next retro. **No ticket.**

## Durable findings carried forward

Rules earned by tickets that have since shipped. **Kept as rule sentences; every worked example is in `git log -p Design/user-actions.md`.**

1. **Before carrying an observation into its Nth run, re-derive it once.** **Paid out 2026-07-30 02:58Z as a correction** (three runs blamed a missing `python` interpreter; the real cause was MSYS path expansion, and the remedy changed). **Paid out 2026-07-30 03:57Z in the other direction:** the "reader no longer filters on assignee" carry was checked against `pull-work` SKILL.md lines 27/176/184 and **held** — and the check surfaced a *disposition* the carry had lost (a non-zero count is the documented handled path, not a regression). **A re-derivation that confirms is not a wasted one; it re-sources the claim and often widens it.**
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
15. **When a ticket asks "which of these fixes?", census the pipeline before answering** — the honest answer may be "none, and here is why". Validate the *sample*, not just the stage.
16. **A deliberately-parked issue and a broken auto-close are indistinguishable from the board.** Report a falsifiable test in both directions.
17. **Before carrying an ask into another run, check whether it was answered somewhere other than the channel it was asked on.**
18. **State a falsifiable test against the outcome, never against an activity proxy.** State the test's enabling premise explicitly, or a benign world reads as its own failure case. **Now subsumes finding 37's threshold rule — a test also needs enough *power*, not just the right target.**
19. **A column-scoped queue query reports the lane's reach, not the board's contents — and from inside the query the difference is invisible.**
20. **When an ask names a *mechanism* rather than a decision, expect the answer to arrive on the channel he has, not the one the mechanism needs.** (a) Prefer asks that are pure decisions. (b) State plainly what was *not* done.
21. **Re-derive a carry even when you expect it to hold** — the check has a wider aperture than the claim. Look at what the source shows you, not only the field you came to check.
22. **An item in the lane's column is not an item the lane can take.** The cheap detector: read the comments, not just the fields. *Consequential* and *decidable-by-Christian* are independent axes.
23. **A ticket this task files is unpullable by construction, and the cost lands on someone else's run — so filing is never free.**
24. **A file's *state* is evidence; its *author* is a separate claim needing separate evidence.**
25. **A confirmed test licenses the claim it tested, not the remedy that motivated it — and the gap is widest exactly when the result is most satisfying.** Corollary: **the mirror failure is a test whose aperture is wider than the claim.**
26. **One instance locates a defect; the second instance with the same fingerprint is what turns it into a mechanism — and changes the remedy.**
27. **A timestamp is evidence only once its zone is verified, and a `Z` suffix is a claim like any other.** Prefer a machine-written field (`stateHistory`, `lastRunAt`, commit metadata) over a prose header. **The *wrong field* misdates an event as badly as the wrong zone** — THR-667's `updatedAt` sits 28 minutes after its actual `Ready for Dev`→`In Dev` transition.
28. **A classifier observed only in its stable state has not been tested.** **Satisfied in BOTH directions:** three consecutive `deployedSha` advances, then two correct **flat** hours when only docs merged. **Note what switched: the evidence, not the verdict word** — five runs reported `skipped` throughout.
29. **"Green and armed" is not "merging" — and the difference is invisible from every signal a lane normally checks.** Checks answer *is this change correct*; `mergeStateStatus` answers *can it go in now*. **The tell is throughput, not status.** **Live instance as of 03:57Z: PR #1085, all checks SUCCESS, auto-merge armed, `BEHIND` at 88 minutes.**

  **Two corollaries.** (a) ~~**It does not self-heal.**~~ **RETRACTED 2026-07-29 13:23Z** — #1042 merged ~2h07m after entering `BEHIND`. **The retraction is itself the lesson: "still true at T" is not "true at every T".** **And as of 03:57Z the retraction is load-bearing in a new way — it sets the floor any future test of this must clear (finding 37).** (b) **`gh pr view` returns `UNKNOWN` for `mergeable`/`mergeStateStatus` on the first read** and often the true value on the second — but **not always**. Treat `UNKNOWN` as "not yet computed", never as evidence of mergeability. **Not in play 03:57Z: both reads on #1085 returned real values.**

30. **A liveness witness must fire strictly *inside* the window it witnesses, not merely fall within it.** **The general form: a guard that accepts an endpoint as evidence about an interval passes hardest exactly when the interval is most degenerate.** Corollary: a probe's verdict is evidence, not a verdict — when independent witnesses contradict it, override and say why.

31. **A cleanup and its cause are separate deliverables, and shipping the cleanup is the moment the cause is most likely to be dropped.** State the re-accrual rate and a dated falsifiable test against the next producing event.

  **The honest quantity is not a rate: it is `|rows the sweep handled|`, workload-dependent and unbounded above.** Meta-lesson: **when a number has been wrong once, the reflex is to move it the other way and re-assert it with equal confidence.** Prefer naming the *variable*.

  **Closed out 2026-07-30 01:58Z in a direction the finding did not anticipate.** THR-845 shipped cleanup, cause-side hardening, **and** a third thing: **it removed the consumer that made the cause consequential.** Generalisation: when a defect's cleanup and cause are both expensive, check whether the *reader* can be made indifferent. **Confirmed twice over by 03:57Z — the leak has produced two more rows (THR-863, THR-864) and produced no symptom, and the reader's own source now documents the leak as a reportable number rather than a fault.**

32. **Verify-after-write needs a clock, not just a re-read — an immediate confirmation read can be served stale and is indistinguishable from success.** **Corollary: a count is not a verification.**

  **A `get_issue` check was correct when it ran and false 131 seconds later. An immediate verify cannot distinguish "my write held" from "my write held briefly"** — so the fix is **verify after the last side-effect in your own sequence**, not after the mutation you care about. **Sharpened by a controlled pair:** 9 immediate verifies after unassigns all held an hour later; 2 after creations were both false within the hour. **The verification was never the variable — what wrote next was.**

  **Best artefact: THR-860's description asserts its own verification and the field contradicts it in the same row.**

33. **A claim widens when it is restated, and the widening is invisible because every restatement still cites the original evidence.** **The drift is toward the remedy's framing**, because a report is written to justify acting. **Detector:** state what observation would falsify *today's* wording, then check whether it would also have falsified the wording used when the evidence was gathered. **Corollary: severity claims need their own evidence, separately from mechanism claims.**

34. **N confirming sightings of an effect do not locate its cause — and each sighting makes the unexamined attribution feel better supported.** **The trap is that repetition reads as accumulating evidence.** **Detector, cheap: before reporting a recurrence, name one property the affected rows share that the unaffected rows do not — and check it.** If you cannot state the contrast class, you have an effect, not a cause.

  **Corollary earned 2026-07-30 03:57Z while *maintaining* a contrast class rather than finding one: a row that was repaired after the fact is not evidence about the write path, and counting it as a clean case silently weakens the very contrast you are testing.** THR-861 reads unassigned only because the orchestrator hand-cleared it. **Keep the repair history attached to the data point, or the contrast decays as the cleanup succeeds.**

35. **A query's filter encodes a premise about the world, and nobody audits a premise that has never produced a visible failure.** (Earned 2026-07-29: `pull-work` selected work with `assignee:null` for months, encoding *"an assignee means a person has claimed this row."* Christian, unprompted: *"I do not use linear or github at all. so any issues in linear or PRs in github with my name on them are yours."*) **Detector, cheap: for each predicate in a query you are debugging, say out loud what it assumes about who or what writes that field — then ask whether anyone has ever confirmed it with the writer.** **Corollary:** 34 says N sightings do not locate a cause; **35 says the cause may not be in the mechanism at all, but in the question.** **The reader is usually yours to change even when the writer is not.**

  **SHIPPED 2026-07-30 01:21:50Z as THR-845, OBSERVED WORKING 02:02:22Z, and RE-SOURCED 03:57Z** — the reader's indifference is now confirmed at line level, not inferred from a merge. **What makes this the finding's proof rather than its epilogue: the eight prior runs each produced a correct local measurement and a wrong global conclusion, and no amount of additional write-side measurement would have converged.** The unlock was a question, asked of the one party nobody had asked. **Second-order lesson for this lane: the answer arrived because step 0 existed to hear it.**

36. **A consumer that matches on a heading's *level* rather than its *text* is a channel that silently narrows as producers reformat.** **Detector: for every "no items found" result on a shared channel, confirm the *absence* against the raw file once, not just against your pattern.** Sibling of finding 19: **a scan reports its own pattern's reach, and a narrowed pattern and an empty world are the same observation.**

  **Generalised: "formatting" was too narrow — the near-miss was *file selection*.** So the rule is **every point where a consumer infers structure from a producer's convention is a coupling the producer can change unilaterally, and each one fails silently in the same direction.** Detector: for each such inference, name the producer change that would break it, then check whether anything would tell you.

  **Sixth consecutive correct-by-luck hour, 2026-07-30 03:57Z: the same-day set is now `-30` … `-30f`.** **A coupling that has survived six hours looks progressively more like a design and less like a hazard, and that drift is finding 33's tell turned on itself.** The luck is alphabetical and finite. **Record the streak as accumulating exposure, not accumulating safety.**

37. **A falsifiable test needs enough power to discriminate, and a threshold set below a known counter-example has none — it will "resolve" and license nothing.** **Earned 2026-07-30 03:57Z, cleanly.** Last run set the #1085 checkpoint at **1h30m** armed. Finding 29(a) had been retracted precisely because #1042 self-healed at **~2h07m**. The antecedent was satisfied on schedule and the conclusion was unavailable: at 90 minutes, a stuck PR and a slow-but-self-healing PR are the same observation.

  **This is distinct from finding 18.** 18 governs *what* you measure (outcome, not activity proxy). **37 governs *where you put the line*: a threshold must clear the longest benign case you already know about, or the test cannot separate the hypotheses no matter how faithfully it is run.**

  **Detector, one question, cheap: "what is the longest this has taken while still being fine?" — and set the checkpoint past it.** If no benign case is known, say so and state the test as exploratory rather than decisive. **The failure mode is seductive because an under-powered test still *resolves on time*, and a resolved test reads as a settled question.**

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

**NONE OPEN — third consecutive run at a true empty.**

**A new unexplained multi-hour pause would be a NEW ask with new evidence — never the overnight-wake question reopened** (finding 12). If he ever does want overnight throughput guaranteed: keep the machine awake and **on mains power**, because Windows Task Scheduler refuses the reaper on battery (`-2147020576`, memory `git_cleanup_automation`). Recorded as a fact, not a request.

**Six questions are answered, closed, and must not be re-asked:**

1. **The five empty projects** — Christian, chat 2026-07-25 21:53: *leave them open; they are intake buckets that refill as the game iterates.*
2. **The GitHub Actions payment block** — cleared 2026-07-25 ~17:09Z and again 2026-07-28 17:02Z, both verified by re-run, and corroborated fourteen times since by independent mechanisms. **A recurrence is a new ask with new evidence, never this one reopened** (finding 12).
3. **THR-799 priority ordering** — Christian, quoted in THR-774/775, 2026-07-27: *the new encounter experience is still first priority.*
4. **Release of THR-821/820/777/778** — Christian, Discord 2026-07-27 14:38Z.
5. **The Linear "assign issue to PR author" switch** — Christian, Discord **2026-07-29 18:10:03Z**: *"can't find anything like that. I do not use linear or github at all. so any issues in linear or PRs in github with my name on them are yours."* **Closed by falsification, on the terms the ask itself set.** The second sentence is a **standing fact**: an assignee of "Christian Spliid" carries no information and must never be read as a human claim. **Enforced in code since 2026-07-30 01:21Z, observed working at 02:02Z, and re-sourced to `pull-work` SKILL.md lines 27/176/184 at 03:57Z.** **The highest-leverage answer in this file's history: one sentence retired eight runs of misdirected investigation and unblocked the executor lane.**
6. **Should the host machine stay awake overnight?** — **retired 2026-07-30 01:58Z by observation**, now four consecutive awake nights, never answered directly and no answer needed.

**One standing switch exists but is not an ask:** the orchestrator lane can be disabled on one word from Christian (live 2026-07-27 19:49Z). **Its default state is the intended one**, so silence resolves it.

**Three durable corrections survive closed asks and are kept as rules:**

- (a) A blanket `git stash` was the wrong remedy for home-tree dirt; the single-path form is correct. Parking his tool-permission edits was never necessary.
- (b) `$REATTACH_MAX_TRACKED_DIRTY = 0` governs the detached-HEAD reattach path and never evaluates while HEAD is on `main`. The conclusion held; its stated reason did not.
- (c) **Tracked dirt alone does not stall autosync.** The stalling class is the *intersection* of locally-modified **∩** changed-by-incoming-commits — proven by fast-forwarding cleanly with `.claude/settings*.json` dirty.

---

## Resolved 2026-07-30

**Eighth consecutive run at zero open Christian-owned asks, third at a true empty.** Everything that moved this hour was agent-side, and the hour's substance is methodological:

- **The stated-in-advance test on PR #1085 resolved in form and could not discriminate — finding 37, earned cleanly.** The checkpoint (1h30m armed) sat *below* the only known benign case (#1042 self-healed at ~2h07m), so "still `BEHIND` at 90 minutes" was consistent with both hypotheses. **Read twice at 03:57:38Z: `OPEN`/`BEHIND`/`MERGEABLE`, armed 88 minutes.** **Properly-powered restatement for next run: still `BEHIND` after 04:36Z ⇒ not self-healing; merged before ⇒ the retraction generalises.**
- **A carried claim was re-derived and HELD, which is worth recording because finding 1's payouts are usually corrections.** *"The reader no longer filters on assignee"* is true and now sourced to `pull-work` SKILL.md lines 27 and 176 rather than to a merge event. **The check also recovered a disposition the carry had dropped:** line 184 rules a non-zero assignee count *"a number to report, not a blocker"*, with inline repair by the picking executor. **So this run's `A=2` is the documented handled path, not a regression of THR-845.**
- **The write-side leak accrued at exactly the predicted rate: two hours, two rows.** THR-864 (orchestrator-filed 03:29Z) is stamped, as THR-863 (02:31Z) still is. **The lane contrast class survived the new data point** — and maintaining it produced finding 34's new corollary: **THR-861 reads clean only because it was hand-cleared, so counting it as a clean write would have quietly weakened the contrast.** Repair history must stay attached to the data point.
- **Queue 51 → 52 by a single filing.** Nothing claimed, nothing completed; THR-667 unchanged in In Dev since 02:02Z. **A duller reconciliation than last hour's, and stated as such.**
- **Finding 28 held flat for a second consecutive hour** — `deployedSha` unchanged at `bcfbe645` because only PR #1088 (an orchestrator report) merged. The classifier is now tested in both directions across five runs.
- **The merge gate held for a fourteenth consecutive check.** The fleet heartbeat returned `ok` for a thirteenth across a fourth awake overnight — lanes at 03:01Z / 03:26Z / 03:53Z with distinct timestamps. The reaper ran 03:40Z with branches 48→**50**, a moving count that independently proves the log is live.
- **Discord returned a literal `[]` for a sixth consecutive hour** — nothing to classify, no receipt owed, cursor unmoved at `1532100414189867109`. **The ping gate correctly stayed silent**: stored hash is the SHA-256 of the empty string and this run's Needs-Christian is also empty.
- **Finding 36's file-selection axis went six-deep in one day** (`-30` … `-30f`). mtime and lexical order still agree — **correct-by-luck for a sixth consecutive hour.** Recorded as **accumulating exposure, not accumulating safety.**
