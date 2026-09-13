# Weekly Project Hygiene — 2026-09-13

Full sweep (last one 2026-09-06, 7 days ago). Enumeration ran against the **home tree**.

Two live lane prompts were found running stale text and were repaired during this run; details in F1. Everything else is a record, not an action.

## Needs Christian

**One question, one line to answer.**

The lanes went completely silent for **18.6 hours** — 2026-09-07 21:59Z to 2026-09-08 16:36Z (Monday into Tuesday) — and no pause marker covered that window. `check:lane-silence` reports `recovered`. This is the THR-1001 detector doing exactly its job: a fleet-wide silence has no sibling witness, so only this retrospective probe can see it.

It is one of two things, and only you know which:

- **A deliberate pause** (token/usage limits, machine off) — in which case nothing is wrong, and the lesson is that the marker at `C:\Users\chris\.claude\threadbare-pause.json` wasn't set. Nothing to do.
- **An outage** — in which case ~18 hourly slots were lost silently and it may recur.

No action needed either way unless you want it investigated. The marker currently on disk correctly covers only the older 09-04 → 09-06 window and is suppressing nothing.

## Queue health

| Column | Count | Oldest |
|---|---|---|
| Ready for Dev | **11** (all unassigned) | THR-1460 / THR-1468 — 2 days |
| In Dev | **1** (THR-876) | WIP=1 respected |
| In Design | **2** (THR-1479 High, THR-1448 Medium) | 1–3 days |
| Implementation Planning | **1** (THR-1482 High) | 1 day |

Healthy, and notably better than the state that prompted the 2026-08-10 throttle. **Every Ready-for-Dev item belongs to a project, every one carries a coordination block, and none is stale** — the oldest handoff is two days old. No mutex deadlock, no starvation.

**The process-work throttle is working.** On 2026-08-10 the measurement was 32 of 35 Ready-for-Dev items being Low-priority process cleanup with zero feature or content work. Today the inverse holds: of 11 items, **zero carry `Infrastructure`** and exactly one carries `Improvement` (THR-1470). The other ten are product work — `Content`, `UI`, `Engine`, `Bug` — and eight are `Deferral`s thrown off by recent shipped slices, which is the "Finish Before You Start" queue behaving as designed.

The one thing worth watching: **all 11 are Low priority.** The design column (2 In Design + 1 Implementation Planning, all High/Medium) is what will refill the queue above Low, and it is supplying.

## Findings

### F1 — The lane-prompt mirror rule has no verifier, and two of nine lanes were running stale prompts *(repaired this run)*

The registry states the obligation — *"When you edit the live file, update its mirror in the same PR"* — and **verifies nothing**. Host *scripts* have a stated fidelity check (*"checkable in one pass"*; both verified byte-identical 2026-08-08). CC *prompts* have no equivalent. A byte-for-byte diff of all nine pairs found two real divergences:

- **`weekly-project-hygiene` (this lane).** The live prompt named `npm run check:content-census` — a script that **has never existed**. The working name is `check:content-model-census`. THR-1489's commit `df9e9b96` wrote the correct name into the repo mirror and the wrong one into the live prompt *in the same ship*. Check 11 was therefore void from the moment it was added, and today was its first scheduled fire — caught at occurrence 1.
  - **Amplifier worth recording:** the failing command still exits 0 when piped (`npm run … | tail`), so a lane following the prompt's own instruction to *"paste its rendered block into the report"* would have pasted npm's `Missing script` error as the census result. This is the documented piped-exit-code trap arriving inside a prompt that tells you to paste the output.
- **`tb-orchestrator`.** The live prompt still carried the **pre-THR-1382 occupancy bound**, 11 days after THR-1382 shipped (PR [#1770](https://github.com/christianspliid-ui/threadbare/pull/1770), commit `b8c01eef`, Done 2026-09-02). THR-1382 is the ticket whose own evidence reads *"twenty-one consecutive runs"* barred and *"the build shelf reached zero on 2026-08-30."*
  - **Severity is bounded, and the bound matters.** The live prompt's line 15 declares `.claude/skills/orchestrator/SKILL.md` to be the specification (*"This prompt is the entry point; the skill is the specification"*), and that skill **does** carry the fix (`ORCH_IN_DESIGN_STALE_DAYS`, lines 40/215/220/221), as does `scripts/stale-claim-sweep/index.ts`. So the repair **was** in effect; what drifted was a stale condensed restatement in the entry point. Not a dead repair — a contradictory second copy.

**Why the gate could pass.** THR-1382's "Files to touch" explicitly flagged that the live prompt *"is the copy that actually runs"* — and its Done-when checklist then pinned only `mirror ≡ skill`, never `mirror ≡ live`. The ticket knew the hazard and the checklist still couldn't catch it.

**Repair applied this run:** the repo mirror was copied over the live file for both lanes (loss-free — the diffs showed no live-only content in either). All nine lanes are now byte-identical to their mirrors, modulo a trailing newline on three.

- **Cost:** ~1 lane-run of a void check, plus an 11-day window in which two copies of the staging rule disagreed. Costs **~30 min** to add a `check:prompt-mirrors` script diffing the nine pairs (the loop used for this finding is four lines and is in the run log); not fixing it costs an **undetectable** stale-prompt window after every lane-behaviour ship, with no upper bound on duration — the orchestrator one would still be open had this sweep not diffed bytes.
- **Clears the materiality bar** — a shipped artifact (this lane's census check) was void on delivery, and the defect class is silent by construction.

### F2 — 6 of 29 wiki-freshness exemptions in 8 days are one generated-page collision

Exemption audit over the 8-day window: **29 commits** carried `Wiki-freshness-exempt:`. I read every reason against its diff. **No misuse found** — the ones I checked were properly behaviour-neutral (an optional `tags` field that no divine verb carries; a nav-only regeneration; a `TickEvent` id format the page never names). Several commits went the *other* way and updated pages rather than exempting past them (`9a4d16b6`, `43a6085f`, `ecce6d80`), which is the gate working.

But **6 of the 29** are the same structural collision, and it is impediment **#1038**, logged today: `public/system-interface-map-reference.html` has a `sources` glob naming its **generator's input**, so any edit to `scripts/interface-contracts.ts` marks it stale — while `check:generated-freshness` certifies the same page current in the same run. The two gates ask opposite questions of one page by construction, and the escape has to be re-derived from scratch each time because nothing on either gate says the page is generated.

It is the **only** generated entry in `public/wiki-manifest.json`, and it is already listed at `scripts/generated-artifact-sources.ts:308` — so the exclusion predicate is available to the wiki gate today.

- **Cost:** ~10 min per affected session, 6 occurrences in 8 days ≈ **1 hour lost per week**, recurring for every session that touches a contract row. Costs ~20 min to exclude `generated-artifact-sources` outputs from the wiki gate's stale set.
- **Clears the materiality bar** on recurrence (6 in a week against a threshold of 3).

### F3 — Two 320-file eval workspaces, one a guaranteed weekly false positive in this very sweep

`.agents/skills/image-manipulation-workspace/` and `.claude/skills/image-manipulation-workspace/` each hold **320 files, all `.png`**, untracked, no `SKILL.md`, mtimes **2026-03-28** — eval outputs from the `image-manipulation` skill's hex-clipping eval, predating the THR-654 demolition by four months. **Neither is a skill tree.**

The problem is that this prompt's check 2 says *"If `.agents/skills/` exists at all, that is a finding"* — so it fires every week on a directory of PNGs, and the next bullet's orphan-directory rule fires on the `.claude/` twin. A sweep that obeys its instructions literally reports a demolished skill tree as resurrected.

This is the **fourth instance** of the same self-referential drift this prompt already documents three times — THR-792 (AGENTS.md), THR-850 (unmirrored `website-code-work`), THR-975 (`Index.md`) — each closed by naming the accepted case in the prompt so it stops being re-derived.

- **Recommended wording**, for the retro to apply to check 2 (mirrors the THR-975 fix): *"A directory under either skills path containing no `SKILL.md` and no `.md` files at all is an eval-output workspace, not a skill tree — `image-manipulation-workspace` (320 PNGs, untracked, 2026-03-28) exists under both paths and is known-accepted. Check for `SKILL.md`, not for the directory."*
- **Cost:** a few minutes of re-derivation per sweep, indefinitely. **Below the materiality bar** — an impediment-log row and a one-line prompt amendment, not a ticket. Deleting the 640 files is a separate, optional call and is **not** recommended as agent work.

## Content model census

First successful run of this check (see F1 — it has never executed before today).

```
Seed 42, 200 ticks. 107 live tag(s), 7 DEAD.

### DEAD tags
- #blackmail_evidence
- #community
- #contraband
- #light
- #military
- #stewardship
- #supply

### Query sites
| Site                   | Resolved | Empty | Verdict   |
|------------------------|----------|-------|-----------|
| reward_draw            | 0        | 0     | no hits   |
| step_reward_pool       | 6        | 0     | live      |
| encounter_seed         | 0        | 0     | no hits   |
| undertaking_catalyst   | 0        | 0     | no hits   |
| condition_pool         | 0        | 0     | no hits   |
| debug                  | 0        | 0     | no hits   |
```

**Movement against the 2026-09-13 baseline: essentially none, which is the expected result** — the baseline was taken from the same commit range a day earlier.

- **Live tags 106 → 107** (+1).
- **DEAD set unchanged** — the same seven, no additions, none retired.
- **`step_reward_pool` 8 → 6 resolutions.** Not a regression signal at this resolution: the site is live either way, and the trace buffer is a 2000-entry ring, so run-to-run counts at tick 200 are noisy by construction.
- **The same four non-debug sites are silent.** `undertaking_catalyst` is the known-unreachable one under `UNDERTAKING_MODEL: 'cells'` — **THR-1497 stands and it was correctly not re-filed.** The other three were not re-run at lower `--ticks` to separate *alive-but-early* from *genuinely silent*, since with zero movement against a one-day-old baseline there is nothing yet to distinguish.

Two consecutive encounter batches authoring zero queries is the retro's "dead primitive" call to make with this in hand. This run is the first data point on that series, not evidence for it.

## Clean checks

- **Linear queue** — PASS. 11 Ready for Dev / 1 In Dev / 2 In Design / 1 Implementation Planning. Every issue has a project; no orphans. WIP=1 respected. No stale In Dev (>5d), no stale handoff (>1w).
- **Coordination blocks** — PASS, and exemplary. THR-1502 was filed directly into the queue, `tb-orchestrator` T1 wrote its block per THR-836, the block named a **self-clearing mutex with the exact test for clearing it**, and `daily-backlog-grooming` then ran that test and recorded the clearance per THR-688 rule B. The whole protocol executing end to end without a human.
- **Skill tree** — PASS. `.claude/skills/` is the only tree (45 skills); every one has `SKILL.md` with a non-empty `description`. All eight skills named in CLAUDE.md's Domain Skills routing policy resolve to real folders. `.agents/skills/` holds no skill and no `SKILL.md` — see F3.
- **Scheduled-task registry** — PASS, all three directions. 10 registered tasks = 10 registry rows (9 live + `website-code-work`). All nine crons match the table exactly; **no reset since the 2026-09-06 verification**, so the pause/resume hazard (#359) has not recurred. Direction 3: 13 directories vs 10 registrations = the 3 known THR-851 orphans (`check-slack-for-new-dev-work`, `daily-standup`, `keep-website-up-to-date`), all three archived under `scheduled-task-prompts/retired/` with recorded dispositions. Mirror *existence* complete (9 of 9, `website-code-work` unmirrored by design); mirror *fidelity* is F1.
- **Stray published reports** — PASS. `git ls-files --others --ignored --exclude-standard -- Docs/ops/ Design/retros/` returns empty. Every lane is deleting its report post-publish; the THR-1056 regression has not returned.
- **Root-level markdown** — PASS. Enumerated in the home tree: `AGENTS.md`, `CLAUDE.md`, `Index.md`, `STYLE.md`. All four on the allowlist; `AGENTS.md` is still a slim pointer, not a re-ballooned duplicate. `Index.md` re-confirmed known-accepted (`git check-ignore` matches `/Index.md`; `git ls-files` returns nothing).
- **Three-pillar compliance** — PASS. THR-1482 (Implementation Planning) is the only in-flight item with a plan doc, and it is a model one: `## Substrate inventory`, all three pillar sections, `## Constants table`, `## NFP-compliance table`, `## Three-pillar check`, `## Vision audit`, `## Kill criteria`, `## Coordination block`, plus recorded intent-judge and forked-audit verdicts. THR-1479 and THR-1448 are `In Design` with no plan doc yet, which is what that column means.
- **Done-state smoke test** — PASS on 5 of 5 checked. THR-1462, THR-1474, THR-1026, THR-1472, THR-1480 each have a real landing commit (e.g. THR-1026 → `fb17a0c6 fix(thr-1026)`) and a `Docs/status/` fragment. No THR-540 false-close pattern found. `changelog.md` rows are complete and well-formed.
- **Orphan deferrals** — PASS. No `// TODO` or `// DEFERRED` in `src/` lacking a `THR-` reference.
- **Impediment log** — PASS on discipline. 1046 rows; **12 logged today alone** (#1035–#1046), and **every one is explicitly routed to "row for the weekly retro, not a ticket"** with a materiality verdict stated in the row. This is the 2026-08-10 throttle working precisely as intended. The 2026-09-12 retro covers #1000–#1020 plus #946/#974/#975; #1035–#1046 postdate it and are Friday's batch.
- **Sandbox limitations** — PASS. No listed limitation is resolved-and-removable; no new chronic issue is missing from the catalog. The `tsc --noEmit` no-op is correctly documented everywhere it appears in live docs; the only surviving citations-as-gate are in `Docs/.versions/` archives and a 2026-07-20 forensics patch file, both historical records.
- **Retro follow-through** — PASS. `Design/retros/retro-2026-09-12.md` is current and carries Drift-Scan Signals, Impediment Analytics, Guidance Audit, and Improvements Backlogged sections.

## Notes

- **On the two prompt repairs.** Both were copies of the repo mirror over the live file — restoring already-shipped, already-reviewed text, not authoring anything. Neither needs a PR: the mirrors were already correct, so the repo is unchanged. This is the narrowest possible reading of the lane's "may make durable corrections to lane prompts" permission, and I would not have made a judgment-bearing edit to a live prompt unasked.
- **I corrected myself mid-sweep on F1's severity.** The `tb-orchestrator` drift initially read as "THR-1382's repair is not in effect," which would have been a serious finding. Checking whether the live prompt delegates to the skill — it does, and the skill carries the fix — bounded it to a contradictory second copy. Worth recording because the check that resolved it is cheap and generalisable: **before calling a drifted prompt broken, check whether it points at a skill that is correct.**
- **F3 recommends a prompt amendment I deliberately did not make.** Applying it means editing the mirror, which means a PR to `main` for a below-materiality cosmetic. Given the process-work throttle and "the report is the deliverable," the exact wording is recorded above for the retro to batch rather than spent as a PR now. If the retro disagrees it is a two-minute change.
- **The `--ticks 200` census and impediment #1045.** #1045 (logged today) records that a CLI `tick 200` on seed 42/medium stops early at the twilight phase boundary at tick 175. The census script is a separate harness and printed no such warning, but if a future run needs certainty about the tick its evidence was taken at, that is the thing to check.
- **Unaudited by choice:** `Docs/plans/` holds 554 files older than 60 days. Identifying which are shipped-and-unreferenced is a real archival pass, not a spot-check, and the standing instruction is "do not delete." Left for a dedicated ticket if anyone wants the directory pruned.
