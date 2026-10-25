# Weekly Project Hygiene — 2026-10-25

This is a full sweep. The last one ran 2026-10-18, seven days ago. Linear, the scheduler, the census and the root-markdown enumeration ran against the **home tree**.

The pipeline freeze ([THR-1946](https://linear.app/threadbare/issue/THR-1946), in force to 2026-11-13) still bars new gates, probes, hooks and standing lane rules. So this run made **no durable edits** and wrote **no Linear comments**. It filed no tickets and moved no states. Every F-item below says whether its fix is allowed under the freeze (a removal, or a fix to machinery that broke a cited run).

## Needs Christian

**One thing, and only if you want the paperwork cut to land before 13 November.** The job that trims the per-change paperwork and turns the wiki check into a warning ([THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject-history-rows-and-make-wiki-freshness-a-warning)) has been parked since 20 October. The unattended builder is not allowed to edit the gate and CI files it has to change, and that is the right safety rule. Its sibling ([THR-1949](https://linear.app/threadbare/issue/THR-1949/run-the-review-gate-and-four-part-browser-evidence-only-on-engine-changes-and-large-ui-changes)) is in the builder's queue but will hit the same wall. **Recommendation:** open one attended session and say "build THR-1947, then THR-1949". It takes about an hour, and you approve the file edits as they come up. If you would rather wait, nothing breaks. The builder keeps doing the paperwork it does today.

Everything else is agent-owned.

## Queue health

| State | Count | Oldest / notes |
|---|---|---|
| Ready for Dev | **8** (last week 22) | The builder burned the queue down: ~95 issues reached Done in 8 days. The oldest is [THR-1924](https://linear.app/threadbare/issue/THR-1924) (UL seating, 10-14). Three are held by veto windows: [THR-2023](https://linear.app/threadbare/issue/THR-2023) until **2026-10-25T19:45Z**, [THR-2030](https://linear.app/threadbare/issue/THR-2030) until **2026-10-26T02:25Z** and [THR-2009](https://linear.app/threadbare/issue/THR-2009) until **2026-10-26T05:22Z**. [THR-1949](https://linear.app/threadbare/issue/THR-1949) cannot be built unattended (see Needs Christian). [THR-1950](https://linear.app/threadbare/issue/THR-1950) is process work. That leaves **3 pickable right now** ([THR-2028](https://linear.app/threadbare/issue/THR-2028), [THR-2012](https://linear.app/threadbare/issue/THR-2012), THR-1924), rising to 6 by tomorrow morning. See F5. |
| In Dev | **2**, both unassigned | [THR-1944](https://linear.app/threadbare/issue/THR-1944) (brokered oath): claimed 08:20Z today, built, and parked at 08:58Z on one confirmed review-gate finding. [PR #2570](https://github.com/christianspliid-ui/threadbare/pull/2570) is open and not armed. The finding is that `brokeredOath.ts:69` can bind a local commander as the vassal, which sends the oath to the wrong faction. The run unassigned itself, so the In Dev slot is free (live work, about 1 h old). [THR-1947](https://linear.app/threadbare/issue/THR-1947) is `Parked` since 10-20 (Needs Christian). |
| In Design | 0 | — |
| Implementation Planning | **1** | [THR-1926](https://linear.app/threadbare/issue/THR-1926) (The Crossroads), stranded since 10-14 18:38. **No movement since last week's comment** (F4). |

Every listed issue belongs to a project. Every one carries `Suggested model`, `Parallel-safe with` and `Mutex with`, each with a reason (rule B). One exception: THR-1924's block sits on its 10-14 comment, and its latest comment (10-17) has none. Deferrals: THR-2009 (Low) is the only Ready-for-Dev Deferral. THR-1944 (Deferral) is the in-flight item. Both are in active projects.

**Last week's items.**
- F1 (worktrees): **not routed** by the 10-23 retro. Repeats as F1.
- F2 (parallel gate 5 s timeouts): the 10-23 retro said "re-measure after THR-2003". **Re-measured: it still recurs.** Repeats as F2.
- F3 (wiki coverage): unchanged. Repeats as F3.
- F4 (THR-1926 stranded): unchanged. Repeats as F4.
- F5 (mutex gaps in the economy batch): **resolved by shipping.** THR-1918, 1955, 1961 and 1923 are all Done, with no reported conflict.
- F6 (closers missing from commit bodies): **resolved.** Of 30 code tickets closed since the 10-24 fragment cutover, 26 carry a line-anchored `Fixes THR-XX` in a commit body on main. The 4 that do not (THR-1966, 1923, 2011, 1961) closed through the PR body. No false close.
- F7 (`AGENTS.md`) and F8 (registry/prompt wording): unchanged. They go to the THR-1950 author (Notes).

## Findings

### F1 — Worktree leak 553 → 600, fifth week; two retros have not routed it

**Evidence.** `git worktree list` shows **600** entries. The series is 51 (09-27) → 461 (10-04) → 503 (10-11) → 553 (10-18) → 600. That is +47 this week, ~7/day, the same rate as the last two weeks. The largest name groups are still `keep-work-flowing-cc` runs: `kwf-wt` 132 (was 120), `kwf` 41, `kwf-brief` 22 and `tfws-kwf` 12. The [10-23 retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/retro-2026-10-23.md) does not mention worktrees. The [10-21 workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-21.md) does not either. The root cause (2026-10-04 F3) is unchanged: the reaper's pass 1 skips a merged tree whose only dirt is a kwf output path.

- **Cost:** ~30 min, the same three-part fix as the last two weeks. (a) kwf removes its own tree after a successful publish. (b) The reaper treats `Design/briefing.md`, `Design/user-actions.md`, `Docs/ops/tick-cost-trend.tsv` and `.claude/settings.local.json` as noise. (c) The reaper sets a minimum age before it reaps a tree, which closes #1174. Not fixing costs walk time on every `git worktree` call by every lane, ~0.5 GB of disk per sampled tree, and the reverse risk of reaping a live clean tree.
- **Clears the bar:** a growing artifact five weeks running. **Freeze status:** part (a) is a removal and part (b) fixes machinery that broke a cited run (#1174), so both are allowed. **Ask for the retro:** if it declines to route this, record why, so the sweep stops re-deriving it.
- **Predicate:** every worktree whose HEAD is an ancestor of `origin/main` and whose only dirty paths are in `{Design/briefing.md, Design/user-actions.md, Docs/ops/tick-cost-trend.tsv, .claude/settings.local.json}`.

### F2 — The parallel gate still false-fails on test timeouts after THR-2003; the retro's own re-measure trigger is met

**Evidence.** The 10-23 retro put this under *Patterns to Watch*: "If it still recurs at three or more a week, the fast-lane test budget is the post-freeze fix." It was waiting for [THR-2003](https://linear.app/threadbare/issue/THR-2003) (merged 10-21 10:07Z), which took `test:heavy` out of the gate. Rows since then:
- #1210 (10-24, count **3**): `impediment-id-allocation.test.ts`, "Test timed out".
- #1221 (10-25): two gate runs in a row went red on unrelated timeouts. Run 1 hit `wanderingHealerAftermathProgression` and `mutation-observability.contract` (5 s). Run 2 hit `wip-gate.test.ts` (30 s). The row says the same shape hit THR-2004's run that morning (`worktree-write-guard` `beforeAll`).
- #1222 (10-25): "#1221 recurred". This was `wanderingHealerAftermathProgression` at 5 s under the gate, passing alone in 1.1 s.

That is **≥6 occurrences in 2 days after THR-2003**, each about 5–6 min of re-runs. `wanderingHealerAftermathProgression` is on its fourth row (#1175 ×2, #1221, #1222).

- **Cost:** ~20–30 min. Give the default vitest project a gate-sized `testTimeout`, or run `test` before the other gate tracks instead of beside them. Not fixing costs ~5 min on most code PRs, roughly 2–3 h a week at this week's volume, and it trains lanes to read red as noise.
- **Clears the bar:** ≥3 recurrences in a week. **Freeze status:** a fix to a gate that broke cited runs, so allowed. Otherwise this is the first post-freeze item. If it is not fixed, promote it to [`sandbox-limitations.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/sandbox-limitations.md) L7 as a fourth false-red shape.
- **Predicate:** every impediment row dated after 2026-10-21 whose text contains `npm run gate` and `timed out` (or `timeout`), and whose failing file is outside the diff.

### F3 — Wiki coverage fell to ~10% of changed code; 18 waivers, no misuse (fifth week)

- **Coverage.** Using the gate's own `globToRegExp` over `public/wiki-manifest.json` (27 pages): of **632** non-test files changed under `src/engine`, `src/data` and `src/components` in 8 days, **568 (90%) match no page's `sources`**. Last week it was 86%. The largest gaps are `src/components/Game` 180, **`src/engine/views` 50**, `src/data/encounters` 49, `HexMapV2` 28 and `shared` 20. Then come the systems that shipped this week or last with no page: **`src/engine/settlementEconomy` 9** (THR-1923, new), `unrestPressure` 8, `warAims` 7 and **`crown` 5**.
- **Exemption audit.** 18 commits carry `Wiki-freshness-exempt` (27 last week). `a0d87d4c` (THR-1959, restless road), `3e7aa742` (THR-1979), `b2407fb7` (THR-2005) and `2519f716` (THR-1992) were read against their diffs. The rest were read by stated reason. **No misuse.** Each is prose-only content, a regenerated artifact, harness or CI config, or a narrow change the stated page does not describe. `3e7aa742`'s "no wiki page sources these files' behaviour" means the exemption was not needed. That is harmless.
- **Interaction:** [THR-1947](https://linear.app/threadbare/issue/THR-1947) makes wiki-freshness a warning and is parked (Needs Christian). With 90% of changes outside every glob, the reference wiki is close to untracked whichever way THR-1947 goes. The THR-1947 builder should settle coverage in the same PR: extend the globs for `engine/views`, `settlementEconomy`, `warAims`, `unrestPressure` and `crown`, or retire the pages that no longer track the code.
- **Cost:** ~1 h for the new-system globs. Not fixing: four economy systems ship with no reference page, and the waivers continue (~1.5 h a week). **Clears the bar.** Agent-owned (THR-608). Glob extensions are new gate coverage, so the freeze arguably holds them to 11-13. Say so when routing.

### F4 — THR-1926 still stranded in Implementation Planning (11 days)

[THR-1926](https://linear.app/threadbare/issue/THR-1926/the-crossroads-read-a-threaded-mortals-top-three-choices-encounters) (The Crossroads) has had no update since this sweep's 10-18 comment. It is still assigned to the attended session's account, still in Implementation Planning, and invisible to the orchestrator's T1 and to pickup. Its plan ([`2026-10-14-thr-1926-the-crossroads.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-14-thr-1926-the-crossroads.md)) passes the three-pillar check, and the human gate is recorded. Now that the Ready-for-Dev queue is short (F5), a stranded Medium feature costs throughput, not only visibility.

- **Cost:** one call: move to Ready for Dev and unassign. The design lane or the orchestrator can make it. No second comment was posted, because the first one drew no action. **Below the bar** (one instance), but it is now a week-two repeat. The retro should name an owner.
- **Predicate:** every issue in Implementation Planning whose latest comment carries a coordination block and `human gate satisfied`.

### F5 — The builder is about to outrun the design shelf

Ready for Dev fell 22 → 8 while ~95 issues reached Done in 8 days. Only 3 are pickable right now, and 1 more opens tonight. Two are process items the freeze or the permission layer holds (THR-1949, THR-1950). At the current pickup rate (`*/20` cadence, roughly 10 merges a day) the product shelf runs out in about a day unless the design lane and orchestrator T2 keep up.

- This is an observation, not a defect. The orchestrator's T2 staging and the design lane (now `14 */3`, eight runs a day) exist for exactly this. Freeing THR-1926 (F4) adds one Medium feature at once.
- **Cost:** none to fix here. Idle pickup runs are cheap but not free (a run that finds nothing still boots). **Below the bar.** It is a watch item for the retro: is the ratio of design-lane output to pickup consumption above 1?
- **Mutex gaps seen** (no recurrence pattern, so below the bar):
  - [THR-2023](https://linear.app/threadbare/issue/THR-2023) and THR-1944 both edit `src/engine/encounterAftermath.ts`. Each adds a sentinel field to `SCENE_SENTINEL_FIELDS` and an aftermath kind to `types/unifiedAction.ts`. THR-1944 has a live PR (#2570). Neither names the other. THR-1944 only says "any build editing `encounterAftermath.ts`".
  - [THR-1950](https://linear.app/threadbare/issue/THR-1950) calls THR-1947 "parallel-safe (different files)". But THR-1947's 10-20 survey names `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md` and the `cicd-review` skill as readers it must repoint, and THR-1950 edits both.

### F6 — Long measurement runs pass the 600 s command cap; the retro's third-strike trigger is met

The 10-23 retro said: "If a third measurement run times out on tracing, add the rule to the measure scripts' own usage text." Since then:
- #1211 (×3): `census:rhythm`, ~19 min.
- #1212 (×2): `measure:crown`, 11–22 min per seed.
- #1213: `measure:war-aims` on five seeds.
- #1214 (×2): `measure:founding-starvation`, past the cap on one seed.
- #1219: a heavy test of 150 game days.

That is **9 occurrences in 2 days**, all the same cause: a command longer than the Bash tool's 600 s foreground cap. The workaround (background it and wait) is safe, but the pickup prompt warns against background runs (the THR-1887 overlap risk). Each costs a re-plan.

- **Cost:** ~20 min. Add one usage line and a per-seed default to each `measure:*` and `census:*` script ("one seed per call; ~N min per seed at 600 ticks"). Or set their defaults to fit under the cap. Not fixing: ~10 min per measurement-heavy ticket, and these are now most economy tickets.
- **Clears the bar:** ≥3 recurrences in a week. **Freeze status:** usage text and defaults on existing scripts are not new gates or rules, so this is allowed. The retro pre-approved it.
- **Predicate:** every impediment row dated after 2026-10-23 whose text contains `600 s` (or `foreground cap`) and names an `npm run measure:` or `census:` command.

### F7 — Two pickup runs resumed a ticket another run was still building (new)

#1215 (10-24, THR-2008): an 18:36Z run resumed from the branch of a live 18:11Z run. #1217 (10-25, THR-1843): a 00:48Z run resumed while the 00:24Z claimant was still building. A third row is a sibling. #1220 (THR-1966) left a WIP commit unpushed when its run ended, so only the stranded-work probe saw it. No work was lost in any of the three. This is the THR-1887 overlap risk the pickup prompt guards against, and it now shows up under the `*/20` cadence when a run outlasts 20 min.

- **Cost:** unknown until the pickup lane's resume check is read. The likely fix is the resume path refusing a branch whose last push is less than ~25 min old. Not fixing risks two runs pushing to one branch; so far there has been 0 damage.
- **Below the bar** (2 rows, no loss). It belongs with `tb-cicd-review` on Thursday, which owns the pickup cadence. Watch for a third.
- **Predicate:** every impediment row whose text contains `resumed` and `still` (building/active) for the same THR id.

## Content model census

Seed 42, 200 ticks, medium. This is the required run.

```
Seed 42, 200 ticks. 170 live tag(s), 1 DEAD.

### DEAD tags
- `#light`

| Site | Resolved | Empty | Source | Verdict |
|---|---|---|---|---|
| `reward_draw` | 0 | 0 | ring | ⚠️ no hits |
| `step_reward_pool` | 609 | 4 | ring | live |
| `encounter_seed` | 19 | 2 | state (ring saw 55 / 2) | live |
| `undertaking_catalyst` | 3 | 2 | state (ring saw 57 / 2) | live |
| `undertaking_appointment` | 3 | 0 | ring | live |
| `condition_pool` | 0 | 0 | ring | ⚠️ no hits |
| `fight_trophy` | 0 | 0 | ring | ⚠️ no hits |
| `debug` | 0 | 0 | ring | ⚠️ no hits |

Harvested 75281 trace(s); 0 emitted-and-evicted before any tick-end read.

Seed consumption (state): 90 pending seeds observed: 64 spawned, 5 withered, 0 expired, 1 orphaned, 20 still pending.

Appointments (state): 8 templates author one; parents fired 26×, 19 planted, 9 kept, 2 missed (absent 1, unreachable 1). Reachability: HIT.
```

Seed 99 (the cross-check last week asked for; same build): 170 live / 1 DEAD (`#light`). `encounter_seed` **30 resolved / 6 empty** (state). `undertaking_catalyst` 2 / 1. **`condition_pool` 1 (first hit on any seed)**. `undertaking_appointment` 0 (ring). Seeds: 138 pending, 103 spawned, 8 withered, 2 orphaned. Appointments: 38 parent fires, 24 planted, 16 kept, 1 missed (absent). HIT.

**Movement against the 2026-09-13 baseline** (106 live, 7 DEAD, `step_reward_pool` 8, four non-debug sites silent) and against last week:

- **Tags flat for the third week:** 170 live, 1 DEAD (`#light`).
- **`encounter_seed` on seed 42 fell for the fourth week: 53 → 29 → 21 → 19.** This week the shape changed. Pending seeds **rose** (79 → 90), and withered rose (3 → 5), so the drop is no longer in planting. More seeds are still pending at tick 200 (13 → 20). **Seed 99 also fell this week:** 37 → 30 resolved, and empty went 2 → 6. Two seeds moving down together in the same week is weak but real evidence. The likely suspects are this week's settlement economy (THR-1923), the restless road (THR-1959/2036) and the founding patron (THR-2008), all of which move mortals off the board's encounter hexes. **Still not a finding.** Every row is exact, and nothing is DEAD or unknown. Seed consumption shows no orphan spike (1 and 2). **Ask for the retro:** if seed 42 reads below 19 again next week, run the census at the commit before THR-1923 (`git log --grep='thr-1923' --reverse`) and settle whether the economy is starving the seed pool.
- **Appointments on seed 42:** kept fell 15 → 9 and missed rose 0 → 2 (one absent, one unreachable). Planted held at 19. On seed 99, planted fell 28 → 24. Reachability is HIT on both, so the THR-1479 contracts stand. "Unreachable" is the first miss of that kind seen on seed 42. One instance, so watch it.
- **Silent sites:** `fight_trophy` and `reward_draw` are silent for the fifth week on both seeds. These are ring zeros with 0 evicted, so "not seen", and THR-1514 says not to file them on their own. `condition_pool` finally hit once on seed 99, so it is reachable. That narrows the open question to the two fight/reward draws: does any 200-tick fight reach them?

## Clean checks

- **Skill tree:** PASS. 51 folders: 50 with `SKILL.md`, `name` and a non-empty `description`, plus the accepted `image-manipulation-workspace`. No `SKILL.md` exists under `.agents/`. The oldest `last_validated_against` is 2026-07-27 (`design-audit-pipeline`). It is not flagged, because nothing it reads changed this week.
- **Scheduled-task registry:** PASS. All 12 Threadbare crons match the table in both directions, and every task directory has a row or a retired disposition. There are no Linear-MCP hourly collisions: pickup ~:11/:31/:51, the orchestrator ~:28 and kwf ~:53. Two weekly lanes fired late: `weekly-retro` at Fri 10-23 21:11Z (slot ~15:04Z) and `tb-cicd-review` at Fri 10-23 21:27Z (slot Thu ~13:30Z). Both have the right cron and both published (the retro is on main, and `cicd-review-2026-10-23.md` is on `ops`). This matches the scheduler's catch-up behaviour after the PC slept, not a cron wipe. Not a finding. It is the "PC idle sleep" loss already on record.
- **Stray published reports:** PASS. The home-tree `ls-files --others --ignored --exclude-standard -- Docs/ops/ Design/retros/` is empty.
- **Root markdown:** PASS. Enumerated in the **home tree**: `AGENTS.md`, `CLAUDE.md`, `Index.md` and `STYLE.md`, all on the allowlist. `Index.md` is ignored (`.gitignore:200`) and untracked. `AGENTS.md` is still 295 lines (unchanged; last week's F7 content note stands).
- **Done-state smoke test:** PASS. 36 issues closed 10-24 → 10-25 were checked. Every code ticket closed since the 10-24 cutover has all three fragments (`Docs/status/`, `Docs/history/`, `Docs/changelog/`). The five with none are all legitimate closes with no landing commit. THR-1940 and THR-1994 are design-lane carve-out closes ([THR-1888](https://linear.app/threadbare/issue/THR-1888), Done 10-24). THR-2015 is a grooming upstream-resolved close citing a green heavy run on `c5acdb59`, which the grooming prompt allows. THR-2006 is a design-lane audit. THR-1861 is a warm-playtest coverage ticket. **The frozen archives are untouched:** no commit to `Docs/changelog.md` or `Docs/project-history.md` since 10-24. No THR-540-shaped false close.
- **Wiki exemption audit:** PASS (no misuse). Coverage is in F3.
- **Three-pillar compliance:** PASS. THR-1926's plan (the only one in Implementation Planning) has Engine, Content and UI, a substrate inventory, a constants table and an NFP table. In Design is empty.
- **Retro follow-through:** PARTIAL. [retro-2026-10-23](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/retro-2026-10-23.md) filed THR-2013 (Done 10-24) and demoted THR-1719 correctly. It routed the gate-size cluster to THR-2003, which landed. It did not route last week's F1 (worktrees), F3 (wiki) or F4 (THR-1926). Two of its own watch triggers have now fired (F2, F6).
- **Impediment log:** 18 rows since the last sweep (#1205–#1222). The chronic clusters are F2 (gate timeouts), F6 (600 s cap on measurements) and F7 (overlapping resumes, new). #1205/#1209 (engine gate past the cap, ×13) were closed by THR-2003.
- **Sandbox limitations:** two promotion candidates if they are not fixed: F2 as a fourth false-red shape in L7, and F6's "long measurement runs pass the 600 s cap" as its own row. Nothing listed is resolved enough to remove.
- **Orphan deferrals:** not re-run this week (it was clean on 10-18, and the sweep was out of time). Not a PASS claim.

## Notes

- **No durable edits and no Linear writes this run.** The freeze still holds. The THR-1926 comment from last week drew no action, so a second one would be noise. F4 asks the retro to name an owner instead.
- **For the THR-1950 author** (one combined review lane), still open: last week's F7 (`AGENTS.md` teaches the retired Codex/Cowork modes and a 1920×1080-primary viewport) and F8 (registry L199 says "10 registered CC tasks" but there are 12; this prompt's check 6 still says "File them"; checks 4 and 9 still name the frozen archives). This week adds one more: this prompt's check 4 says `Docs/project-status.md` overflow is normal and to check `Docs/status/` fragments only. Since 10-24, `Docs/history/` and `Docs/changelog/` fragments are owed too, and this run checked all three.
- **Obsidian:** `OBSIDIAN_VAULT_PATH` resolves. The vault's `Index.md` was last written 2026-08-29. 10 pages are newer, all under `Brainstorms/` (for example `2026-09-12-appointment-primitive.md` and the 09-24 proto-items and proto-spells notes). Brainstorms are exploratory by rule, so leaving them out of the Index is defensible. Not a finding.
- **Plan-doc archival:** 648 of 896 plan docs are older than 60 days. Checking each against open issues and shipped topics is a session of its own, not a sweep line. It was skipped for the third week. Predicate for whoever takes it: every `Docs/plans/` file dated before today minus 60 days that no open Linear issue's description or comments name.
- **THR-1944's open review finding** (F5 / queue table) is live work owned by the pickup lane. It is not a hygiene item, and it is noted only so the briefing does not read the unassigned In Dev as stuck.
- The coordination-block read of the 11 queue issues was delegated to a read-only subagent. Its mutex claims (F5) were taken as reported and not re-verified line by line.
