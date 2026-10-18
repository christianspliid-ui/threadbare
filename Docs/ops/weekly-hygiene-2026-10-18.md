# Weekly Project Hygiene — 2026-10-18

This is a full sweep. The last one ran 2026-10-11, seven days ago. Linear, the scheduler, the census and the root-markdown enumeration ran against the **home tree**.

The 2026-10-15 pipeline freeze ([THR-1946](https://linear.app/threadbare/issue/THR-1946), Done 10-17, in force to 2026-11-13) bars new gates, probes, hooks and standing lane rules. So this run made **no durable edits**. Every repair below is either a fix to machinery that broke a cited run, which the freeze allows, or input for [THR-1950](https://linear.app/threadbare/issue/THR-1950), which folds this lane into one weekly review lane. The run wrote one Linear comment ([THR-1926](https://linear.app/threadbare/issue/THR-1926), see F4). It filed no tickets and moved no states.

## Needs Christian

Nothing needs you. The builder's queue went from 2 ready jobs to 22 this week, mostly economy and Inspector work, so it will not run dry. One finished design, "The Crossroads", is stuck one step short of the builder's queue. It is agent-owned and has a note on it. You do not need to do anything.

## Queue health

| State | Count | Oldest / notes |
|---|---|---|
| Ready for Dev | **22** (last week 2) | The oldest is [THR-1218](https://linear.app/threadbare/issue/THR-1218/encounter-firing-pruning-pass-select-down-from-everything-fires-once) (created 08-24, Low; its claim window opened 10-17 11:00Z). Then [THR-1381](https://linear.app/threadbare/issue/THR-1381/twilight-authorship-vs-emergence-specify-the-authored-beat-procedural) (09-02, Low), held by a veto window until **2026-10-18T13:50Z**. [THR-1944](https://linear.app/threadbare/issue/THR-1944/encounters-that-broker-an-oath-faction-unification-and-the-warlords) (Deferral) is held until **2026-10-19T07:23Z**. [THR-1911](https://linear.app/threadbare/issue/THR-1911/inspector-s3-the-inspector-in-the-game-every-link-card-and-map-click) is in practice mutex with the in-flight THR-1898. That leaves about 18 pickable. 5 of the 22 are Continuous Improvement: [THR-1888](https://linear.app/threadbare/issue/THR-1888) (from the 10-16 retro) and [THR-1947](https://linear.app/threadbare/issue/THR-1947)–[THR-1950](https://linear.app/threadbare/issue/THR-1950) (Christian-approved cuts, 10-15). |
| In Dev | **1** | [THR-1898](https://linear.app/threadbare/issue/THR-1898/map-lenses-ii-trouble-and-trade-and-the-plain-map-stops-drawing-trade) (map lenses II, High). `tb-opus-pickup` claimed it ~07:52Z today, on branch `claude/thr-1898-lenses-ii`. It is live. |
| In Design | 0 | — |
| Implementation Planning | **1** | [THR-1926](https://linear.app/threadbare/issue/THR-1926/the-crossroads-read-a-threaded-mortals-top-three-choices-encounters) has been stranded since 10-14 18:38 (F4). |

Every listed issue belongs to a project. Every Ready-for-Dev, In Dev and Implementation Planning item carries `Suggested model`, `Parallel-safe with` and `Mutex with` with reasons (rule B). The mutex gaps are in F5. Two Deferrals sit in active projects. THR-1944 is held by its veto window. [THR-1961](https://linear.app/threadbare/issue/THR-1961) is Low, so it sorts below this project's Medium and High bugs. That is "Finish Before You Start" bent by priority, which is allowed, and is noted here only.

**Last week's items.**
- F1 (pickups calling `preview_start`): **resolved.** There are zero refusal rows after PR #2325 merged (2026-10-11T08:18Z). The last were #1172 and #1173 on 10-10.
- F6 (weekly lanes missing their slot): **resolved this week.** `weekly-workflow-retro` fired Wed 10-14 09:21Z and `weekly-retro` fired Fri 10-16 15:04Z, both on time.
- F2 (worktrees) and F3 (wiki coverage) repeat below as F1 and F3.

## Findings

### F1 — Worktree leak 503 → 553, fourth week; the 10-16 retro again did not route it

**Evidence.** `git worktree list` shows **553** entries: 51 (09-27) → 461 (10-04) → 503 (10-11) → 553. That is ~7/day, the same rate as last week. The largest name groups are still `keep-work-flowing-cc` runs (`kwf-wt` 120, `kwf` 28, `kwf-brief` 16, `kwf-2026-08-*` 26+, `tfws-kwf` 10). [retro-2026-10-16](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/retro-2026-10-16.md) mentions only #1174 (live tree reaped), under *Patterns to Watch*. It does not mention the leak. The root cause from 2026-10-04 F3 / 2026-10-11 F2 is unchanged: the reaper's pass 1 skips a merged tree whose only dirt is `Design/briefing.md`, `Design/user-actions.md` or `Docs/ops/tick-cost-trend.tsv`.

- **Cost:** ~30 min, the same three-part fix as last week. (a) kwf removes its own tree after a successful publish. (b) The reaper treats those three paths as noise and logs the skipped-dirty count. (c) The reaper sets a minimum age before reaping any tree, which closes #1174. Not fixing costs walk time on every `git worktree` call by every lane and disk at ~0.5 GB per sampled tree. It also leaves the inverse risk of reaping a live clean tree.
- **Clears the bar:** a growing artifact four weeks running. **Freeze status:** a fix to machinery that broke a cited run (#1174), so allowed. The highest-value item for the Friday retro, or for THR-1950's combined lane if it lands first.
- **Predicate:** every worktree that is an ancestor of `origin/main` whose only dirty paths are in `{Design/briefing.md, Design/user-actions.md, Docs/ops/tick-cost-trend.tsv, .claude/settings.local.json}`.

### F2 — Parallel `npm run gate` reddens `test` on vitest's 5 s default timeout (new chronic cluster)

**Evidence.**
- #1175 (`wanderingHealerAftermathProgression`, 10-16, count 2).
- #1177 (`codexActionArt`, 10-12).
- #1203 (10-17): *"reddened `test` three runs out of three on a single 5000ms default timeout, each time a different file."*
- Last week's #1167 (`doomIdentityMilestones` ×2) is in the same family.

Each file passes alone in under 1 s. So the gate's parallel track starves the suite, and no single test is at fault. This is not in [`Docs/ops/sandbox-limitations.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/sandbox-limitations.md). Its L7 row covers full-suite time-outs at sandbox limits, not the per-test 5 s default under the parallel gate. The heavy project already got CI-sized budgets ([THR-1927](https://linear.app/threadbare/issue/THR-1927), `HEAVY_DEFAULT_TEST_TIMEOUT_MS`). The default project did not.

- **Cost:** ~20–30 min. Give the default vitest project a gate-sized `testTimeout`, or have `gate` run `test` with fewer workers while Vite or the build run beside it. Not fixing costs a re-run of the gate on most code PRs: 3 of 3 in #1203, ~5 min each. Across ~40 code PRs a week that is about 1–3 h a week, and it teaches lanes to dismiss red as flake.
- **Clears the bar:** ≥3 recurrences in a week. **Freeze status:** a fix to a gate that broke cited runs, so allowed. If not fixed, promote it to sandbox-limitations as a sibling of L7.
- **Predicate:** every impediment row whose text contains `timed out` and `5000` (or "5 s default") and `npm run gate`.

### F3 — Wiki-freshness coverage fell to ~14% of changed code; 27 waivers, no misuse (fourth week)

- **Coverage.** Using the gate's own `globToRegExp` over `public/wiki-manifest.json` (27 pages): of **620** non-test files changed under `src/engine`, `src/data` and `src/components` since 2026-10-10, **533 (86%) match no page's `sources`**. Last week it was 355 of 414. The largest gaps are `src/components/Game` 166, `src/components/HexMapV2` 41, `src/data/encounters` 41, `src/components/shared` 39 and **`src/engine/views` 38** (the new view-model seam, THR-1822). Then come `src/components/Codex` 9, `Remembrance` 8, `MeetTheFirst` 7, **`src/engine/warAims` 6** and **`src/engine/unrestPressure` 5**. Those last two are new systems this week with no page.
- **Exemption audit.** 27 commits carry `Wiki-freshness-exempt` in 8 days. Read in full: `1fe75f7e` (THR-1883), `e5de58ad` (THR-1849), `896af217` (THR-1889), `44c00e62` (THR-1810), `65be6511` (THR-1798) and `df2a6a9e` (THR-1886). The rest were read by stated reason. **No misuse found.** Each is a generated page that is already current, a comment-only or plumbing edit, or a fix that makes code match a page that already describes it. `44c00e62` says the prose-engine page "does not describe the placeholder table". The 10-16 retro already moved that table into the systemic wiring guide.
- **Interaction:** [THR-1947](https://linear.app/threadbare/issue/THR-1947) (Ready for Dev) makes wiki-freshness a *warning*. With 86% of changes outside every glob, that leaves the reference wiki with neither a gate nor coverage. The THR-1947 executor should decide coverage in the same PR: extend globs for `engine/views`, `warAims` and `unrestPressure`, or retire the pages that no longer track the code.
- **Cost:** ~1 h for the new-system globs. Not fixing: new systems ship undocumented and ~27 waivers a week (~2 h/week) continue until THR-1947 lands. **Clears the bar.** Agent-owned (THR-608).

### F4 — THR-1926 handoff stranded in Implementation Planning for 4 days

[THR-1926](https://linear.app/threadbare/issue/THR-1926/the-crossroads-read-a-threaded-mortals-top-three-choices-encounters) (The Crossroads) has a merged plan doc ([`2026-10-14-thr-1926-the-crossroads.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1926-the-crossroads.md), PR #2402). The doc passes the three-pillar check. The handoff has a full coordination block and "human gate satisfied via chat review 2026-10-14". The state history stops at Implementation Planning (10-14 18:38), and the issue is still assigned to the attended session's account. The orchestrator's T1 sweep does not scan Implementation Planning (memory `reference_orchestrator_t1_scan_misses_states`), so nothing will move it. Its screen slice THR-1928 is blocked by THR-1911 anyway, so the loss so far is queue visibility, not throughput.

- **Action taken:** an explanatory comment on THR-1926 (2026-10-18 08:17Z). No state change.
- **Cost:** a one-call fix (move to Ready for Dev and unassign) by the design lane or orchestrator. The general fix is for the design-session closeout to verify that the handoff state stuck (#48 pattern). That is a standing rule, so the freeze defers it. **Below the bar** (one instance). Impediment-row grade.
- **Predicate:** every issue in Implementation Planning whose latest comment contains a coordination block and `human gate satisfied`.

### F5 — Mutex lines miss shared-file overlaps in the M3 economy batch

- [THR-1918](https://linear.app/threadbare/issue/THR-1918), [THR-1961](https://linear.app/threadbare/issue/THR-1961) and [THR-1955](https://linear.app/threadbare/issue/THR-1955) all edit `src/engine/phaseFactionActions.ts`, and none names the other two as mutex. THR-1961's only mutex is THR-1933, which is Done.
- [THR-1960](https://linear.app/threadbare/issue/THR-1960) says it is parallel-safe with THR-1898. THR-1898's own block lists THR-1960 as mutex (place-label layer).
- [THR-1923](https://linear.app/threadbare/issue/THR-1923)'s mutex list (THR-1862, 1883, 1876) is 4 days old, and all three are now Done.

With WIP = 1 these cannot run at the same time. The risk is a merge conflict when a fresh claim lands while the previous PR is unmerged, and `scripts/wip-gate.ts` already blocks that. **Below the bar.** This is not a recurrence pattern yet. **Predicate:** every pair of Ready-for-Dev issues whose plan or handoff names the same `src/` file and neither of whose blocks names the other.

### F6 — Landing commits stopped carrying the line-anchored closer; the PR body carries it alone

The definition of done ([`definition-of-done.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/definition-of-done.md) L17) and `pull-work/SKILL.md` L919 and L1034 require `Fixes THR-XX` alone on a line in **both** the commit body and the PR body. Line-anchored closers in non-merge commits per week, against merged PRs:

| Week | Closers in commits | Merged PRs |
|---|---|---|
| 09-20 | 90 | 121 |
| 09-27 | 89 | 123 |
| 10-04 | 66 | 112 |
| 10-11 | 70 | 147 |

This week's sample: THR-1893, 1909, 1935, 1963, 1900, 1903, 1858 and 1850 all closed correctly through `Fixes` in the PR body (checked for #2473, #2447 and #2424). Their commits carry only a bare `THR-1893` line. **Nothing false-closed and nothing failed to close.** The cost is downstream. `pull-work/SKILL.md` L39's "already shipped upstream?" check and this sweep's Done smoke test both grep **commit** bodies, so a PR-body-only ship is invisible to them. A re-picked ticket could re-do shipped work.

- **Cost:** none to fix the reader. Point both checks at `gh pr list --search "THR-XX in:body" --state merged`. Alternatively, THR-1947 (paperwork cut, rewriting the DoD) picks one location and says so. Not fixing: a latent false "not shipped" in pickup's upstream check, so far 0 observed. **Below the bar.** Fold it into THR-1947.

### F7 — `AGENTS.md` still teaches retired modes

`AGENTS.md` is 295 lines. It was 283 at the THR-654 slim (`0f777823`), so it has not ballooned. It does, however, still say:
- the `Ready for Codex` queue exists (L252);
- Cowork hands off to "Ready for Dev"/"Ready for Codex" (L245);
- the viewport contract is 1920×1080 primary (L161). CLAUDE.md says 2560×1440 primary with a 1920×1080 floor (THR-1819);
- WebGL is verified with "Codex in Chrome" (L168).

No live runtime reads it (Codex and Cowork are retired), so the harm is a stale second source. **Below the bar.** It fits the next guidance audit. Cut it to the "Read CLAUDE.md First" pointer, which is a removal and so allowed under the freeze.

### F8 — Small drift in the registry and in this sweep's own prompt (no edits, freeze)

- [`scheduled-tasks-registry.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-tasks-registry.md) L199 says "the 10 registered CC tasks". 12 Threadbare tasks are registered and mirrored under `scheduled-task-prompts/`.
- This prompt's check 6 still says *"Dangling open items not in Linear? File them."* That contradicts its own § Recording findings and session-protocol.md § Continuous Improvement.
- Check 4 and check 9 audit `project-history.md` and `changelog.md` rows, which THR-1947 drops.
- **Route:** all three go to the THR-1950 author, who is rewriting this lane anyway. Editing a lane prompt during the freeze is not worth the argument for a one-word fix. Below the bar.

## Content model census

```
Seed 42, 200 ticks. 170 live tag(s), 1 DEAD.

### DEAD tags
- `#light`

| Site | Resolved | Empty | Source | Verdict |
|---|---|---|---|---|
| `reward_draw` | 0 | 0 | ring | ⚠️ no hits |
| `step_reward_pool` | 707 | 5 | ring | live |
| `encounter_seed` | 21 | 2 | state (ring saw 41 / 2) | live |
| `undertaking_catalyst` | 6 | 0 | state (ring saw 13 / 0) | live |
| `undertaking_appointment` | 5 | 0 | ring | live |
| `condition_pool` | 0 | 0 | ring | ⚠️ no hits |
| `fight_trophy` | 0 | 0 | ring | ⚠️ no hits |
| `debug` | 0 | 0 | ring | ⚠️ no hits |

Harvested 78536 trace(s); 0 emitted-and-evicted before any tick-end read.

Seed consumption (state): 79 pending seeds observed: 62 spawned, 3 withered, 0 expired, 1 orphaned, 13 still pending.

Appointments (state): 8 templates author one; parents fired 26×, 19 planted, 15 kept, 0 missed. Reachability: HIT.
```

**Movement against the 2026-09-13 baseline** (106 live, 7 DEAD, `step_reward_pool` 8, four non-debug sites silent) and against last week:

- **Live tags 170, DEAD 1 (`#light`).** Flat for the second week.
- **Appointments keep growing:** 8 authoring templates (+2: `bell_tower_shoring`, `easter_reckoning` and others), 19 planted (+2), 15 kept (+4), **0 missed** (was 3). `undertaking_appointment` on the ring fell 14 → 5, but the `state` rows are the exact ones.
- **`encounter_seed` fell again: 53 → 29 → 21 resolved** on the same seed and ticks. Pending seeds fell 132 → 87 → 79. Withered stayed low (2 → 3). So the drop is in planting, not in dying. This is the second consecutive drop on an exact row. **A second seed, as last week asked:** seed 99 on the same build gives `encounter_seed` **37 resolved / 2 empty**, 144 pending (115 spawned, 4 orphaned) and 28 appointments planted. So planting is healthy on another world, and seed 42's drop is not a blanket regression. It is most likely this week's economy and capability changes moving who qualifies on that one world. There is no prior seed-99 number to compare against, so this run sets the baseline. **Not a finding.** The retro should run both seeds next week before calling it either way.
- `fight_trophy`, `reward_draw` and `condition_pool` are silent for the fourth week. These are ring zeros with 0 evicted, so "not seen", and THR-1514 says not to file them on their own. The question for the retro is unchanged: does any seed-42 fight in 200 ticks reach a trophy draw?

## Clean checks

- **Skill tree:** PASS. 51 folders: 50 with `SKILL.md`, `name` and a non-empty `description`, including the new `game-design-laws` (THR-1891). The 51st is the accepted `image-manipulation-workspace`. No `SKILL.md` exists under `.agents/`. The empty `.agents` directory is still in the home tree (debris; see Notes). The oldest `last_validated_against` is 2026-07-27 (`design-audit-pipeline`). It is not flagged, because nothing it reads changed this week.
- **Scheduled-task registry:** PASS apart from F8's wording. All 12 Threadbare crons match the table in both directions. That includes `tb-design-lane` on `14 */3 * * *` (the 10-12 change is recorded), pickup on `*/20`, and kwf on `45 * * * *` firing ~:53. Retired directories (`check-slack-for-new-dev-work`, `daily-standup`, `keep-website-up-to-date`) are dispositioned. There are no Linear-MCP hourly collisions: pickup fires ~:11/:31/:51, the orchestrator ~:28 and kwf ~:53. `tb-cicd-review` published reports dated 10-15 and 10-17. The 10-17 run (`lastRunAt` 20:24Z, a Saturday) is off-cron and was presumably started by hand.
- **Stray published reports:** PASS. The home-tree `ls-files --others --ignored --exclude-standard -- Docs/ops/ Design/retros/` is empty.
- **Root markdown:** PASS. Enumerated in the **home tree**: `AGENTS.md`, `CLAUDE.md`, `Index.md` and `STYLE.md`, all on the allowlist. `Index.md` is ignored (`.gitignore:200`) and untracked. F7 concerns `AGENTS.md`'s content, not its presence.
- **Orphan deferrals:** PASS. No `// TODO` or `// DEFERRED` in `src/` (outside tests) lacks a `THR-` id.
- **Three-pillar compliance:** PASS. The only plan in Implementation Planning, [`2026-10-14-thr-1926-the-crossroads.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1926-the-crossroads.md), has Engine, Content and UI pillars, a substrate inventory, a constants table, an NFP table, a three-pillar check and an intent-judge verdict. In Design is empty.
- **Done-state smoke test:** PASS with F6's caveat. 82 issues completed 10-10 → 10-18 were checked for a `Docs/status/` fragment and a `project-history.md` line. Every code ticket has both. The ones with neither are design-lane decision tickets: wayfinder map decisions such as THR-1863, 1865–1873, 1917, 1829 and 1830, plus the THR-1842 checkpoint. Those close by decision with no landing commit, by design ([THR-1888](https://linear.app/threadbare/issue/THR-1888) is aligning the rule to that practice). No THR-540-shaped false close was found.
- **Wiki exemption audit:** PASS (no misuse). Coverage is in F3.
- **Retro follow-through:** PARTIAL. [retro-2026-10-16](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/retro-2026-10-16.md) closed both prior tickets (THR-1795, 1796) and correctly applied the freeze. It routed the visual-evidence cluster to THR-1949. It did **not** route last week's F2 (worktrees) or F3 (wiki coverage) for the second retro running. Both appear above, with the freeze status stated so the retro cannot read them as new machinery.
- **Impediment log:** 30 rows since last sweep (#1175–#1204). The chronic cluster is F2 (gate timeouts). #1200 (heredoc lost regex backslashes, count 5) is already the CLAUDE.md top-five rule and sandbox-limitations L9. It is a "rule the run never loaded" case, which the retro already names. #1181 (Playwright relative path → home tree, count 2) is already sandbox-limitations L20.
- **Sandbox limitations:** one promotion candidate, F2's parallel-gate 5 s timeout, if it is not fixed. Nothing listed has been resolved enough to remove.

## Notes

- **No durable edits this run, on purpose.** THR-1946's freeze covers lane prompts and standing rules. Each F-item states whether its fix is allowed under the freeze (a removal, or a fix to broken machinery) so the retro can act without re-arguing it.
- **One Linear write:** the THR-1926 comment (F4). No claims, no state changes, no tickets.
- **Lane future:** THR-1950 (Ready for Dev) folds this sweep into one weekly review lane. F8 lists what its author should drop or correct from this prompt. Checks 3 (registry), 10 (wiki) and 11 (census) are the ones that found something this month, so they are the ones to keep.
- **`.agents/` debris:** still present and empty in the home tree. It is not a finding (no `SKILL.md`).
- **Not done:** the plan-doc archival pass (>60 days, topic shipped) and the Obsidian `Index.md` spot-check, both skipped for time for the second week. Neither has produced a finding in a month.
- The coordination-block read of all 25 issues was delegated to a read-only subagent. Its F5 mutex claims were taken as reported and not re-verified line by line.
