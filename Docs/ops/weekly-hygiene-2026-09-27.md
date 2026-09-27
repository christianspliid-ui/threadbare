# Weekly Project Hygiene — 2026-09-27

Full sweep. The last one ran 2026-09-13; no report exists for 2026-09-20, so that Sunday was missed. Run from the home tree, with durable edits made in worktree `hyg-wt-20260927`.

## Needs Christian

Nothing here needs a decision from you. Two things you'll see in the game:

- **Three finished features are waiting to reach the game.** The item generator ([THR-1570](https://linear.app/threadbare/issue/THR-1570), [PR #2088](https://github.com/christianspliid-ui/threadbare/pull/2088)), culture and spheres in encounter openings ([THR-1635](https://linear.app/threadbare/issue/THR-1635), [PR #2091](https://github.com/christianspliid-ui/threadbare/pull/2091)), and the double-knockout duel fix ([THR-1629](https://linear.app/threadbare/issue/THR-1629), [PR #2087](https://github.com/christianspliid-ui/threadbare/pull/2087)) are all built. None of them has merged: the same slow test failed each one's automated check, and two of them now conflict with newer work. The agents will fix this. It is here so the delay doesn't surprise you. Details in F1.
- **The build shelf is empty.** Nothing is ready to build. The design lane is writing plans as fast as it can. The urgent "a new player never meets The First" finding ([THR-1605](https://linear.app/threadbare/issue/THR-1605)) is waiting behind the living-world plan tickets. Details in F2.

## Queue health

| State | Count | Oldest / notes |
|---|---|---|
| Ready for Dev | **0** | Empty shelf. The design lane's 06:19Z claim already recorded it. |
| In Dev | **3** | THR-1570 (claimed 04:13Z), THR-1629, THR-1635 (claimed 07:12Z). All three say "shipped, auto-merge armed", but every PR is red (F1). |
| In Design | 1 | [THR-1605](https://linear.app/threadbare/issue/THR-1605), Urgent, staged by the orchestrator at 04:30Z. No plan doc yet. |
| Implementation Planning | 0 | — |
| Todo | 29 | Eight `Design:` carve-up tickets from the living-world and powers maps. Deferrals: THR-1627 (High), THR-1626, THR-1637, THR-1580, THR-1522, THR-1393, THR-175. |

Every issue belongs to a project; there are no orphans. Every In Dev issue has a coordination block in its handoff comment with all three lines, and each mutex line states its reason (rule B). There is no stale In Dev: all three were claimed today.

## Findings

### F1 — Every code PR opened today failed on one CI flake, and no lane is watching armed-red PRs

**Evidence.** Required-check runs [36291016816](https://github.com/christianspliid-ui/threadbare/actions/runs/36291016816) (PR #2087, 03:18Z), [36295798947](https://github.com/christianspliid-ui/threadbare/actions/runs/36295798947) (PR #2088, 04:57Z) and [36304138307](https://github.com/christianspliid-ui/threadbare/actions/runs/36304138307) (PR #2091, 07:46Z) all fail on one case:

```
FAIL node src/testing/__tests__/fightCalibration.test.ts > fight calibration against THR-1531 (Major elite × bold guard)
Error: Hook timed out in 10000ms.
Test Files  1 failed | 1356 passed (1357)
```

All other files passed in all three runs. PR #2089 (05:21Z) passed the same file in between, so this is a timing flake, not a defect. The heavy `beforeAll` sits at the 10 s hook limit on a CI runner. The file was last touched by `0d89a181` (THR-1581, 2026-09-26). No impediment row names `fightCalibration`.

**Why it compounds.** Each pickup run posts "Shipped — auto-merge armed" and moves on. WIP is then counted as free and the next ticket is claimed, so three In Dev tickets pile up behind red PRs. Two of the PRs (#2087, #2088) are now `DIRTY` against `main`, so a plain rerun can no longer land them. A merge from `origin/main` is needed first, which is the executor's job.

- **Cost:** 3 shipped slices held for 1–5 h and counting. Each costs a lane run to unstick (merge `origin/main`, re-push, which also re-runs CI). Costs ~15 min to fix: raise the hook timeout on `fightCalibration.test.ts`'s `beforeAll`, or move the file to `// @vitest-lane heavy` as THR-1384 did for world-simulation tests. Not fixing costs roughly one re-run per code PR at a ~3-in-8 failure rate. Today that is ~1 lane-hour.
- **Clears the materiality bar:** 3 recurrences in 5 hours, and ≥1 lane-hour lost.
- **Predicate:** every open PR whose latest `Test · Typecheck · Build` run failed only on `fightCalibration.test.ts` with `Hook timed out`.
- **Second, structural half for the retro:** the pickup lane treats "armed" as done. A red armed PR has no owner until the hourly briefing's health probe notices it. The retro should check whether `pull-work` Step 1.5 (resume) catches its own red armed PRs before claiming new work.

### F2 — Build shelf starved; the Urgent onboarding finding sits behind the carve-up order

Ready for Dev is 0. The design lane (run 2026-09-27b, 06:19Z) chose [THR-1635](https://linear.app/threadbare/issue/THR-1635) over [THR-1605](https://linear.app/threadbare/issue/THR-1605), and its candidate order puts the THR-1589 carve-up tickets (THR-1630–1636) first. The orchestrator's T2 comment on THR-1605 says outright that it "does not jump that order". THR-1605 is the one Urgent item on the board: 0 of 3 cold testers met a mortal.

- This is the "feature pipeline needs supply" headline, not a process defect. Today's throughput is healthy: ~40 Done in 7 days, and the design lane shipped two plan docs in 24 h. The one question for the retro: should Urgent staged work outrank map carve-up order in `design-lane` Step 2? It is a how-question for the agents, not a fork for Christian.
- **Below the materiality bar** as a process item; it is a priority call. No cost line owed.

### F3 — Heavy-lane `peopleThingsCells` timeout: 4th recurrence in 3 days

Impediment rows #1073 (09-25), #1081 (09-26) and #1084 (09-27), plus #1086 (09-27, in unmerged PR #2091), all record "a company whose commander dies is offered to a living member as a claim" hitting the 5000 ms default under full `test:heavy` load. #1086 measured it at 4.4 s of 5 s on a clean `main` arm. The 2026-09-25 retro put it under *Patterns to Watch* at tally 1.

- **Cost:** ~10–15 min per executor run that has to rerun `test:heavy` and prove the failure is pre-existing. That is 4 runs in 3 days, ~1 h per week. Costs ~5 min to fix: a per-case timeout, or split the fixture.
- **Clears the materiality bar** (≥3 recurrences in a week). This is F1's sibling (a test at its timeout margin), and #1076 (`duelE2` 10k draws) is a third member. The retro can batch all three as one "tests at the timeout margin" item under the predicate: *every test whose recorded wall time is above 80% of its timeout.*

### F4 — `keep-work-flowing-cc` leaves a ~600 MB worktree behind every few runs, ~50 of them now

`git worktree list` shows **51** `C:/Users/chris/Dev/Projects/kwf-wt-*` worktrees, all detached. Per day: 4 on 09-18, 4 on 09-19, 3 on 09-21, 4 on 09-22, 7 on 09-23, 9 on 09-24, 9 on 09-25, 5 on 09-26, 5 on 09-27. One measures **599 MB**, so the total is ~30 GB. Nothing in the kwf skill, its live prompt, `scripts/` or `clean-stale-git.sh` mentions `kwf-wt`. The lane creates them on its own, outside `.claude/worktrees/`, so the hourly reaper's scope never sees them. Six more detached worktrees sit under `C:/Users/chris/.codex/worktrees/`, left over from the Codex lane retired 2026-06-23.

- **Cost:** ~30 GB of disk now, growing ~3 GB/day. Each is also a full working tree that `git worktree list` and every git operation must walk. Costs ~20 min to fix: have the lane `git worktree remove` its own worktree after a successful publish, the THR-1056 pattern, and widen the reaper to `kwf-wt-*` for loss-free detached trees.
- **Clears the materiality bar** as a growing artifact. It has not corrupted anything yet, so it is not filed now.
- **Predicate:** every worktree whose path matches `*/kwf-wt-*` or `*/.codex/worktrees/*`, is detached, and has no commits outside `origin/main`.

### F5 — Scheduled-task registry: fire-time column drifted; `tb-cold-playtest` still unregistered

Both directions were checked against `list_scheduled_tasks`.

- **Crons all match the table.** No task has been reset.
- **`Fires` column drift.** The observed `nextRunAt` values no longer match the column. `tb-opus-pickup` fires at **~:10:53** (jitter 653 s), not the documented ~:00:53. `tb-orchestrator` fires at ~:28:16, not ~:26:16. `daily-backlog-grooming` fires at ~09:08, not ~09:16. `weekly-workflow-retro` fires at ~Wed 11:21, not ~11:13. The spacing still holds (pickup :11 → orchestrator :28 → kwf :53), so nothing collides and no slot rationale is broken. This is documentation drift only. It is below the bar; update the column the next time the registry is touched.
- **Documented-but-never-registered:** the `tb-cold-playtest` row (THR-1610, added 2026-09-25) is still marked "awaiting attended registration". This is the THR-653 shape, but the row says so openly, so it is a pending Christian UI action rather than silent drift. `keep-work-flowing-cc` owns surfacing it in `Design/user-actions.md`. Not duplicated here.
- **Orphan directories:** `check-slack-for-new-dev-work`, `daily-standup` and `keep-website-up-to-date` are all dispositioned in `Docs/ops/scheduled-task-prompts/retired/README.md`. PASS.

### F6 — Wiki-freshness: exemptions halved, but the gate's globs cover only a quarter of changed code

- **Exemption audit (8 days).** 15 exemption lines, down from 29 at the last sweep. I read each one against its diff and found **no misuse**. Two structural shapes remain:
  1. `divine-actions-reference` matches `src/types/unifiedAction.ts`. Every optional field added to that type needs a waiver (`c48f872a`, `6321d6bd`, `be872db9`/`11acaf79`): 4 in 8 days. Proposal: narrow that page's glob to the divine-card cascade files.
  2. **Generated pages** listed as gate targets force a waiver because they cannot be hand-edited: `world-objects-reference` (`d92ee10f`) and `undertaking-grid-reference` (`e79ffb16`). This is the same class as 2026-09-13 F2 / impediment #1038 (`system-interface-map-reference`). If that fix shipped, it covered only one page. Proposal: exclude every `generated-artifact-sources` output from the wiki gate's stale set.
  - **Cost:** ~5–10 min per waiver, 6 in 8 days, ~45 min per week. Costs ~20 min for both glob fixes. This is at the materiality bar on recurrence (6 in a week).
- **Coverage sweep.** Of **295** non-test files changed under `src/engine`, `src/data` and `src/components` in 8 days, **220 match no page's `sources` glob** (27 pages, 207 globs). The largest uncovered clusters: `src/components/Game/` (42 files), `src/engine/fights/` (16), `src/data/encounters/` (15), `src/data/content-eval/` (9), `src/engine/effects/` (8), `src/engine/monsters/` (8), plus core files like `graph.ts`, `contentQuery.ts`, `unifiedActionResolution.ts` and `strategicGraphOps.ts`. Physical Conflict (fights, monsters, hunts, duels) shipped ~20 tickets this fortnight, and its code matches no page glob. The blocking gate therefore cannot fire on it.
  - **Recommendation:** extend `sources` globs for the fight system. It has a documented manual page, so check whether `encounters-manual-reference` or a fight page should own `src/engine/fights/**`, `src/engine/monsters/**` and `src/data/fight*`. Add a `backlog` manifest entry for a Physical Conflict reference page if none exists. The other clusters need a glob-by-glob pass that is out of scope here. Glob extensions are an agent-owned verdict (THR-608), so nothing goes to Christian.
  - **Cost:** ~1 h to extend globs for the top five clusters. Not fixing lets core-system changes ship with no page update and no signal, which is the drift the gate exists to stop. It clears the bar as silent drift across ~20 shipped tickets.
  - *Method note:* coverage came from `picomatch` over `public/wiki-manifest.json` `pages[].sources`, not the gate's own `globToRegExp`. Minor semantic differences are possible. Re-derive with the gate's matcher before editing globs.

### F7 — Census: the census run surfaced an engine error, `UndertakingOutcomeNode` victim edge to a missing node

```
[UndertakingOutcomeNode] Failed to add victim edge for ind_12: Error: Source node not found: ind_12
    at createUndertakingOutcomeNode … at advanceStrategicProjects … at phaseStrategicProjects
```

Seed 42, medium, within 200 ticks. The writer fails soft (NFP #4 holds), but the victim node is gone before its outcome node is written. That is the same writer ([`src/engine/grievance/undertakingOutcomeNode.ts`](https://github.com/christianspliid-ui/threadbare/blob/main/src/engine/grievance/undertakingOutcomeNode.ts)) that THR-1629 / PR #2087 touches, but a different defect: a missing node, not a duplicate id. Its evidence is 1 occurrence, one log line, on one seed.

- **Below the bar.** Record it as an impediment-log row for the retro, and let THR-1629's executor check it when PR #2087 is merged up. Possibly the same "grief reaches the retained dead" path as THR-1536.

## Content model census

```
Seed 42, 200 ticks. 158 live tag(s), 1 DEAD.

### DEAD tags
- `#light`

| Site | Resolved | Empty | Source | Verdict |
|---|---|---|---|---|
| `reward_draw` | 0 | 0 | ring | ⚠️ no hits |
| `step_reward_pool` | 596 | 0 | ring | live |
| `encounter_seed` | 50 | 22 | state (ring saw 136 / 22) | live |
| `undertaking_catalyst` | 4 | 0 | state (ring saw 10 / 0) | live |
| `undertaking_appointment` | 0 | 0 | ring | ⚠️ no hits |
| `condition_pool` | 0 | 0 | ring | ⚠️ no hits |
| `fight_trophy` | 0 | 0 | ring | ⚠️ no hits |
| `debug` | 0 | 0 | ring | ⚠️ no hits |

Harvested 64538 trace(s); 0 emitted-and-evicted before any tick-end read.

Seed consumption (state): 151 pending seeds observed: 115 spawned, 22 withered, 0 expired, 1 orphaned, 13 still pending.

Appointments (state): 1 template authors one (`encounter.slice.bargain_at_crossroads`); parents fired 3×, 3 planted, 0 kept, 0 missed.
Reachability: HIT.
```

**Movement against the 2026-09-13 baseline** (106 live, 7 DEAD, `step_reward_pool` 8, four non-debug sites silent):

- **Live tags 106 → 158 (+52). DEAD 7 → 1.** `#blackmail_evidence`, `#community`, `#contraband`, `#military`, `#stewardship` and `#supply` all gained bearers. Only `#light` is left. That is a strong content-model reach signal.
- **`step_reward_pool` 8 → 596.** The site went from barely reached to the dominant resolver. This is consistent with THR-1614 / THR-1612 / THR-1613 unblocking social, faction and seed-family draws this fortnight.
- **`undertaking_catalyst` is now live (4 resolved, off state).** THR-1497's reachability fix is confirmed on the live board. At `--ticks 50` it reads 0, so it is alive but late-firing, not dead.
- **Appointments: HIT.** The two THR-1479 interface contracts stand. 0 kept / 0 missed of 3 planted within 200 ticks, so none has come due yet.
- **Four `ring` sites silent:** `reward_draw`, `undertaking_appointment`, `condition_pool` and `fight_trophy`. They are silent at both `--ticks 200` and `--ticks 50`, and **0 traces were evicted in either run**, so these are genuine "not seen" results, not ring losses. Per THR-1514 a `ring` silence is never filed on its own. `fight_trophy` is new since the baseline (Physical Conflict), so the question for the retro is whether any fight in 200 ticks on seed 42 ends in a trophy draw. Check reachability before calling it a content gap. There is 1 orphaned seed, flagged but not yet evidence of a defect.

## Clean checks

- **Linear queue:** PASS on hygiene. Every issue has a project, every coordination block has all three lines, every mutex line states its reason, and nothing is stale. The flow problem is F1/F2.
- **Skill tree:** PASS. 47 folders under `.claude/skills/`; 46 have a `SKILL.md` with `name` and a non-empty `description`. The 47th is `image-manipulation-workspace`, gitignored eval output that is now named in the prompt as accepted. All 11 skills named in CLAUDE.md's routing policy resolve. No skill's `last_validated_against` predates 2026-07-01. No orphan skill. Every `tsc --noEmit` mention in skills and canon warns *against* it.
- **Stray published reports:** PASS. `git ls-files --others --ignored --exclude-standard -- Docs/ops/ Design/retros/` in the home tree is empty.
- **Root markdown:** PASS. Enumerated in the **home tree**: `AGENTS.md`, `CLAUDE.md`, `Index.md`, `STYLE.md`. `Index.md` is gitignored (`.gitignore:198`) and untracked, which is accepted per THR-975. The other three are tracked and on the allowlist.
- **Done-state smoke test:** PASS, 10 of 10. THR-1620, 1616, 1574, 1565, 1623, 1622, 1625, 1624, 1581 and 1628 each have a line-anchored `Fixes THR-XX` landing commit on `main` (e.g. THR-1620 → `f9102ed4`), a `Docs/status/` fragment, a `project-history.md` line and changelog rows. There is no THR-540 false-close.
- **Three-pillar compliance:** PASS. The one In Design item (THR-1605) has no plan doc yet. All 20 plan docs added to `main` in 8 days carry Engine, Content and UI sections, an NFP table, a constants table and `## Substrate inventory`.
- **Orphan deferrals:** PASS. No `// TODO`, `// DEFERRED` or `// PHASE-*-DEFERRED` in `src/` lacks a `THR-` reference.
- **Retro follow-through:** PASS. `Design/retros/retro-2026-09-25.md` is current, all three of the prior retro's tickets shipped, and it covers the lanes-dying cluster (#1059, #1063) and the Vite-stale cluster.
- **Sandbox limitations:** PASS with a watch item. The worktree-Vite-serves-stale-edits family (#1027, #1070, #1078, #1079 root cause, **#1085 recurred after the root cause**) is 5 rows. If #1086-era rows add more, it belongs in `Docs/ops/sandbox-limitations.md`. Not promoted yet: #1079's root cause suggests a fix, not a standing limitation.
- **Plan-doc archival:** not run in depth this week (time went to F1/F4/F6). No candidates are named.

## Notes

- **Missed week.** No `weekly-hygiene-2026-09-20.md` exists on `ops`. `lastRunAt` for this task is only today's run, so the cause of the missed run can't be seen from here. It is recorded, not diagnosed.
- **`.agents/skills/` still exists in the home tree.** `ls -la` shows no entries, yet `rmdir` reports it non-empty. My attempt to list its hidden contents was refused by the session's permission classifier as a follow-on to the delete, so I stopped. **Nothing was deleted.** It is untracked and invisible to git. The prompt's check 2 now keys on a `SKILL.md` under that path rather than the directory's existence ([PR #2093](https://github.com/christianspliid-ui/threadbare/pull/2093), applying the 2026-09-13 F3 recommendation that the retro had not picked up). Whether to remove the directory is left to an attended session.
- **Durable change this run:** [PR #2093](https://github.com/christianspliid-ui/threadbare/pull/2093), auto-merge armed. It is docs-only: the mirror `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md` plus an identical edit to the live prompt. It has no close keyword.
- **Not commented on the three In Dev tickets.** Their red PRs are the claiming lane's to resume (pull-work Step 1.5). A comment from an auditor lane adds noise, and per the memory rule it can confuse dead-claim recovery. F1 records it for the retro and the hourly brief.
- **No tickets filed.** F1 came closest to the "actively corrupting" exception. It is blocking, not corrupting: nothing wrong landed on `main`, and every red PR is recoverable. It waits for Friday's retro, but the hourly brief and the next pickup run will likely unstick it sooner.
