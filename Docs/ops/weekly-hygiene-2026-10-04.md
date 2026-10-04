# Weekly Project Hygiene — 2026-10-04

This is a full sweep. The last one ran 2026-09-27, seven days ago. It ran from the home tree. The one durable change is a scheduler repair (F1); no file on `main` was edited.

## Needs Christian

Nothing needs a decision from you. Two things you might notice:

- **The build lane now runs every 20 minutes, not once an hour.** Yesterday's speed-up ([THR-1717](https://linear.app/threadbare/issue/THR-1717)) said the builder should start a new job every 20 minutes. The schedule was never switched, so it kept starting once an hour and sat idle about 40 minutes of each hour while 8 jobs waited. I switched it this morning. If the builder now starts hitting usage limits, the plan's fallback is every 30 minutes. Details in F1.
- **Two finished pieces of work are stuck on a review rule, not on bugs.** The spell generator ([THR-1572](https://linear.app/threadbare/issue/THR-1572), [PR #2178](https://github.com/christianspliid-ui/threadbare/pull/2178)) and the ruin-visit fix ([THR-1696](https://linear.app/threadbare/issue/THR-1696), [PR #2199](https://github.com/christianspliid-ui/threadbare/pull/2199)) each hit the new automatic code review's two-round limit. They were then put somewhere no lane looks. The agents will fix the routing, and this is here so the delay doesn't surprise you. Details in F2.

## Queue health

| State | Count | Oldest / notes |
|---|---|---|
| Ready for Dev | **11** | Oldest: [THR-984](https://linear.app/threadbare/issue/THR-984) (process tidy, Low, since 10-02) and [THR-912](https://linear.app/threadbare/issue/THR-912) (drift scan). Two are held by `Claimable from`: [THR-1715](https://linear.app/threadbare/issue/THR-1715) (Urgent) until 10-04 12:50Z and [THR-1687](https://linear.app/threadbare/issue/THR-1687) until 10-05 00:45Z. Last week's shelf was empty, so supply has recovered. |
| In Dev | **2** | [THR-1572](https://linear.app/threadbare/issue/THR-1572): resumed 07:53Z, armed, and red (F2). [THR-1696](https://linear.app/threadbare/issue/THR-1696): an **unassigned** review-gate park since 2026-10-03 18:31Z (F2). |
| In Design | 0 | — |
| Implementation Planning | 0 | — |

Every issue I listed belongs to a project. Coordination blocks were spot-checked on THR-984, THR-912, THR-1725, THR-1715 and THR-1696. All carry `Suggested model`, `Parallel-safe with` and `Mutex with`, and each mutex states its reason (rule B). THR-1715's mutex line still names THR-1708 and THR-1711, which are now Done. That is harmless, because pull-work reads partner state. Deferrals in active projects ([THR-1672](https://linear.app/threadbare/issue/THR-1672), [THR-1687](https://linear.app/threadbare/issue/THR-1687)) are on the shelf.

## Findings

### F1 — `tb-opus-pickup` never got THR-1717's `*/20` cron; repaired this run

**Evidence.** `Docs/ops/scheduled-tasks-registry.md` gives the pickup cron as `*/20 * * * *`. So does the THR-1717 plan (`Docs/plans/2026-10-03-delivery-velocity.md` § 1e: *"`tb-opus-pickup` cron `0 * * * *` → `*/20 * * * *`"*, Done-when *"cron re-listed after the update and matching the registry"*). Both shipped in `e787c02c` (2026-10-03 11:02 +0200). But `list_scheduled_tasks` this morning returned `cronExpression: "0 * * * *"`, and `list_task_runs` shows strictly hourly starts from 10-03 18:11Z through 10-04 08:11Z. Most runs finish in 5–20 min, so the lane sat idle ~40 min per hour with 8–11 items in Ready for Dev. The plan's usage-limit fallback (`*/30`, "recorded in the registry") was never invoked, and the registry records no revert. So the table was right and the scheduler was the drift. Either the change was never applied, or a toggle dropped it (impediment #359, the fourth time).

**Repair.** `update_scheduled_task(tb-opus-pickup, cronExpression: "*/20 * * * *")`. I re-listed afterwards: pickup reads `*/20`, next run 09:50:53Z. The other 12 crons are unchanged.

- **Cost:** about 16 h × 2 lost pickup slots per hour, roughly 30 slot-opportunities since the change shipped. Fixing it took 1 min (done). The retro half: THR-1717's Done-when *"cron re-listed … matching the registry"* was ticked without the cron matching. A lane cannot set scheduler config, the same constraint as #1133 (`tb-cold-playtest` unregistered for 8 days). So any ticket that ships a cron change from the pickup lane will repeat this.
- **Clears the bar:** ≥1 lane-hour lost.
- **Predicate:** every registry row whose `Cron` differs from `list_scheduled_tasks`' `cronExpression` for the same task.

### F2 — Review-gate parks go to a state no lane reads (2 parks + 1 cascade in 2 days)

**Evidence.** `.claude/skills/review-gate/SKILL.md` step 8 says: findings still open after round 2 → *"take pull-work's park disposition (unassign, state stays In Dev). `keep-work-flowing-cc` surfaces the park."* `pull-work` resumes only `assignee:"me"` In Dev items, and kwf only surfaces. That breaks pull-work's own standing rule (`pull-work/SKILL.md` ~L421, THR-846): *"every park must name the lane that reads the destination."*

- [THR-1572](https://linear.app/threadbare/issue/THR-1572) was parked 10-03 02:25Z and sat ~29 h until `daily-backlog-grooming` re-routed it by hand to Ready for Dev (10-04 07:10Z). Pickup then resumed it at 07:11Z.
- [THR-1696](https://linear.app/threadbare/issue/THR-1696) has been parked since 10-03 18:31Z, still unassigned In Dev, with [PR #2199](https://github.com/christianspliid-ui/threadbare/pull/2199) unarmed and now `DIRTY`.
- Cascade: impediment #1131. THR-1683's mutex with the parked THR-1572 was re-offered twice before a run read the partner's state.
- Secondary: THR-1572's resumed PR [#2178](https://github.com/christianspliid-ui/threadbare/pull/2178) is armed but red. CI run [37187126796](https://github.com/christianspliid-ui/threadbare/actions/runs/37187126796) fails only `check:impediment-ids`: *"#1129 claimed by 2 rows — lines 1531, 1532"*. A merge from main collided two rows numbered #1129. `main` itself passes (1140 rows unique). The fix is `npm run check:impediment-ids -- --fix` on the branch. That is the claiming lane's job (it is assigned and In Dev, so pull-work Step 1.5 sees it).

- **Cost:** ~29 h + ~14 h (and counting) of finished work held, plus 2 wasted pickup offers. Costs ~15 min to fix: make review-gate step 8 park to **Ready for Dev with a "RESUME, do not re-implement" comment**, which is exactly what grooming did by hand and what pull-work's own rule requires. Alternatively, pull-work Step 1.5 could also scan unassigned In Dev items whose latest comment is a review-gate park. Not fixing costs ~1 park/day at the current rate, each held until a human or grooming notices.
- **Clears the bar:** ≥1 lane-hour, and 3 occurrences in 2 days.
- **Predicate:** every In Dev issue with no assignee whose latest comment contains "review gate" and "not armed".

### F3 — Worktree leak is now ~390 trees, and the reaper can never see them (repeat of 2026-09-27 F4, root cause found)

Last week: 51 `kwf-wt-*` worktrees. Now `git worktree list` shows **461 worktrees**, and **441 of the 454 non-home ones are merged into `origin/main` but dirty**. Grouped by name: `kwf` 206, `kwf-wt` 94, `kwf-cc` 43, `kwf-brief` 31, `tfws-kwf` 7, `kwf-briefing` 6, `tfws-wt-kwf` 2, so **~390 are `keep-work-flowing-cc` runs**. The dirty files across all worktrees:

```
384 Design/briefing.md       (tracked stub on main; kwf overwrites it, publishes to ops, never reverts)
383 Design/user-actions.md   (same)
235 Docs/ops/tick-cost-trend.tsv (THR-1385 trend row, untracked — also present in the home tree)
128 .claude/settings.local.json
```

**Root cause.** `clean-stale-git.sh` pass 1 skips any worktree with "real" uncommitted work, and does it **silently**: `[ -n "$real" ] && continue`. Pass 2.5 escalates only *unmerged* trees. So a merged worktree carrying a modified tracked stub is invisible to both passes forever. The reaper's summary line has grown with it (`worktrees: 458 … 460` in today's log), while `needs-disposition` stays at 6. One sampled `kwf-wt` measured **584 MB**. The total was not measured, and could reach ~200 GB if they are alike (C: has 512 GB free). The 2026-10-02 retro did not pick up last week's F4.

- **Cost:** ~30 min to fix on both ends. (a) kwf ends each run with `git -C <wt> checkout -- Design/ && git worktree remove`, after a successful publish (the THR-1056 pattern). (b) The reaper adds `Design/briefing.md`, `Design/user-actions.md` and `Docs/ops/tick-cost-trend.tsv` to its `$noise` pattern, and logs a count of skipped-dirty trees so the next leak is visible. Not fixing costs ~24 worktrees/day of disk, and every `git worktree` / reaper pass walks all of them.
- **Clears the bar** as a growing artifact; second week running. Not "actively corrupting", so not filed now.
- **Predicate:** every worktree that is an ancestor of `origin/main` and whose only dirty paths are in `{Design/briefing.md, Design/user-actions.md, Docs/ops/tick-cost-trend.tsv, .claude/settings.local.json}`.

### F4 — Wiki-freshness gate covers 17% of changed code; one generated page drives most waivers (repeat of 2026-09-27 F6)

- **Coverage.** Using the gate's own `globToRegExp` (`scripts/check-wiki-freshness.ts`) over `public/wiki-manifest.json` (27 pages, 207 globs): of **420** non-test files changed under `src/engine`, `src/data` and `src/components` in 8 days, **349 match no page's `sources`**. Last week's count, made with picomatch, was 220 of 295. The largest gaps: `src/components/Game` 82, `src/data/encounters` 39, `src/components/HexMapV2` 13, `src/engine/itemGenerator` 10 (new system, THR-1570/1626/1637), `src/engine/effects` 9, `src/data/content-eval` 8, `src/data/strategic-packs` 7, `src/engine/fights` 5. The retro has not picked this up.
- **Exemption audit.** 18 commits carry `Wiki-freshness-exempt` in 8 days. I read every stated reason and found no misuse. Each is generated-page byte-identity, a constants-only edit or a doc-restoring bug fix. About **10 of the 18 name `action-catalog`** ("lists ascendant-facing templates only; regenerating … byte-identical"). That is the same structural shape as last week's generated-page waivers: a generated page listed as a gate target forces a waiver because it can't be hand-edited.
- **Cost:** ~1 h for the globs (item generator, fights, effects first) plus ~20 min to drop generated pages from the gate's stale set. Not fixing costs ~10 waivers/week × ~5 min, plus core-system changes shipping with no signal.
- **Clears the bar** (≥3 recurrences/week, silent drift). This is agent-owned (THR-608), so nothing goes to Christian.

### F5 — This sweep's own prompt cites CLAUDE.md sections that THR-1718 removed today

[THR-1718](https://linear.app/threadbare/issue/THR-1718) (`35084177`, 2026-10-04) slimmed CLAUDE.md to a pointer card. This prompt's pre-flight and checks still cite `## Session Types: Design vs Execution — Read This First`, `## Skill Tree Layout`, `## Known Sandbox Limitations`, the "Domain Skills **routing policy**" and "CLAUDE.md § Continuous Improvement". None of those headings exists on `main`. The current headings are `## Session types — one runtime, one queue` and `## Sandbox — the five that bite first`. Skill tree, load order and continuous improvement now live in `Docs/canon/session-protocol.md`, per the card's routing table. Per the prompt's own rule, that is a finding.

- **Not repaired this run.** Reading the live prompt file was refused by the session's permission classifier, so I left both copies (live and `Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md`) untouched rather than edit blind. The same drift probably exists in the other lane prompts that cite CLAUDE.md sections. That makes it a `guidance-audit` sweep after THR-1718, which the retro should run.
- **Cost:** ~20 min. Below the bar on its own, since a lane can still find the content via the routing table. Batch it with the post-THR-1718 guidance audit.

### F6 — Weekly lanes miss alternate weeks with no failed run on record

`list_task_runs`: `weekly-project-hygiene` ran 09-06, 09-13, *(no 09-20)*, 09-27, 10-04. `weekly-workflow-retro` ran 09-02, 09-09, *(no 09-16)*, 09-23, *(no 09-30)*; its `lastRunAt` is still 09-23 and `Design/retros/` has no `workflow-retro-2026-09-30.md`. Neither task records a failed or skipped run, and the crons are intact. Hourly and daily lanes do not show the gap. A likely cause is the desktop app not running at the weekly slot, but that is unverified.

- **Cost:** one missed workflow retro and one missed hygiene sweep in three weeks. Below the bar. This is an impediment-log row. Watch whether the 10-07 workflow retro fires.

## Content model census

```
Seed 42, 200 ticks. 170 live tag(s), 1 DEAD.

### DEAD tags
- `#light`

| Site | Resolved | Empty | Source | Verdict |
|---|---|---|---|---|
| `reward_draw` | 0 | 0 | ring | ⚠️ no hits |
| `step_reward_pool` | 585 | 0 | ring | live |
| `encounter_seed` | 53 | 13 | state (ring saw 142 / 13) | live |
| `undertaking_catalyst` | 3 | 1 | state (ring saw 24 / 1) | live |
| `undertaking_appointment` | 2 | 0 | ring | live |
| `condition_pool` | 0 | 0 | ring | ⚠️ no hits |
| `fight_trophy` | 0 | 0 | ring | ⚠️ no hits |
| `debug` | 0 | 0 | ring | ⚠️ no hits |

Harvested 77544 trace(s); 0 emitted-and-evicted before any tick-end read.

Seed consumption (state): 132 pending seeds observed: 100 spawned, 15 withered, 0 expired, 2 orphaned, 15 still pending.

Appointments (state): 5 templates author one (`encounter.slice.bargain_at_crossroads`, `encounter.town.bell_tower_shoring`,
`encounter.town.boundary_survey`, `encounter.town.mill_lease_auction`, `encounter.town.well_sinking`);
parents fired 5×, 7 planted, 1 kept, 2 missed (absent 2).
Reachability: HIT.
```

**Movement against the 2026-09-13 baseline** (106 live, 7 DEAD, `step_reward_pool` 8, four non-debug sites silent):

- **Live tags 106 → 158 (09-27) → 170.** DEAD is still 1 (`#light`).
- **`undertaking_appointment` is live for the first time** (2 resolved). There are now 5 appointment-authoring templates, up from 1. **The first kept appointment (1) and the first misses (2, reason `absent`)** both show up on state. That is the THR-1479 primitive completing its full loop on a seeded run, not just being planted.
- `step_reward_pool` holds at ~590. `undertaking_catalyst` is live off state (3/1).
- **Three `ring` sites are still silent:** `reward_draw`, `condition_pool` and `fight_trophy`. 0 traces were evicted, so these are real "not seen" results, but per THR-1514 they are not filed on their own. `fight_trophy` is silent for the second week running. The retro should check whether any seed-42 fight in 200 ticks ends in a trophy draw before calling it a content gap.
- **Orphaned seeds 1 → 2.** They are flagged but are not evidence of a defect.
- Last week's `[UndertakingOutcomeNode] … Source node not found` log line **did not recur** (no errors in this run's output).

## Clean checks

- **Skill tree:** PASS. 49 folders under `.claude/skills/`; 48 have `SKILL.md` with `name` and non-empty `description`. The 49th is `image-manipulation-workspace`, which is accepted. No `SKILL.md` under `.agents/`. The oldest `last_validated_against` is `design-audit-pipeline` at 2026-07-27, which is fine because none is pre-July.
- **Stray published reports:** PASS. `git ls-files --others --ignored --exclude-standard -- Docs/ops/ Design/retros/` in the home tree is empty.
- **Root markdown:** PASS. Enumerated in the **home tree**: `AGENTS.md`, `CLAUDE.md`, `Index.md`, `STYLE.md`, all on the allowlist.
- **Scheduled-task orphans:** PASS. Task directories match the registered set. `check-slack-for-new-dev-work`, `daily-standup` and `keep-website-up-to-date` are dispositioned in `retired/README.md`. `tb-cold-playtest` is now registered (2026-10-03) and its registry row says so, which closes last week's F5 open item. Apart from F1, every cron matches the table.
- **Done-state smoke test:** PASS, 12 of 12. THR-1718, 1701, 1720, 893, 1658, 1722, 1698, 1703, 1697, 1626, 1711 and 1704 each have a line-anchored `Fixes THR-XX` landing commit on `origin/main`, a `Docs/status/` fragment, a `project-history.md` line and changelog rows. No THR-540 false-close.
- **Three-pillar compliance:** PASS. In Design and Implementation Planning are empty. All 25 non-brainstorm plan docs added in 8 days carry Engine, Content and UI sections, NFP, constants and `## Substrate inventory`. The `-brainstorm` companions are grill-me syntheses, not plan docs.
- **Retro follow-through:** PASS. `Design/retros/retro-2026-10-02.md` is current. It closed last week's F1 (`fightCalibration` timeout) and F3 (`peopleThingsCells`) with named per-case ceilings, and filed THR-1693, THR-1695 and THR-1694 (the last of which is shipped and visible in pull-work). It did **not** cover last week's F4 (worktrees) or F6 (wiki), so both are repeated above.
- **Impediment log:** 19 rows since the retro (#1122–#1140). The chronic cluster is **concurrent-session contention**: #1128 and #1136 (vitest suites timing each other out, fixed for a single session by THR-1717's staged gate) plus #1130 and #1140 (worktree Vite ports 5191 and 5197 held by other sessions, and a Playwright navigate silently loading a *foreign* tree). Both THR-1572 and THR-1696 closeouts also record heavy-suite timeouts "while two heavy runs overlapped". That makes 4 rows in 2 days, at the bar. The Vite-port half extends #257 (wrong-tree hazard) and belongs in `Docs/ops/sandbox-limitations.md` next to the worktree-Vite entry. **Recommended for the retro; not promoted by this lane.**
- **Sandbox limitations:** the watch item from last week (worktree Vite stale edits) was closed at its root by THR-1670. The new candidate is the port-collision pair above.

## Notes

- **Durable change:** one scheduler write, `tb-opus-pickup` → `*/20 * * * *` (F1). I re-listed afterwards: all 13 tasks are present and every other cron is unchanged. No `main` edits and no PRs.
- **Not done:** F5's prompt correction, because reading the live prompt file was refused. I did not route around it. There was no orphan-deferral grep this week, since time went to F3's root cause. There was no plan-doc archival pass.
- **No tickets filed and no comments posted.** F2's THR-1696 park is the case that came closest to filing: finished work held with no reader. But it is held, not corrupted, and `daily-backlog-grooming` already did the hand re-route once (10-04 07:10Z) and will see it again at its next run. The pickup lane (now on `*/20`) will resume THR-1572's red PR by itself, because it is assigned.
- **The F3 disk figure is an estimate.** One worktree measured 584 MB. Many `kwf` trees may share a junctioned `node_modules`, so the real total could be well under the ~200 GB upper bound.
- **Coverage method (F4)** uses the gate's own matcher this week, so it is not directly comparable with last week's picomatch number. The direction (most changed code is unglobbed) holds either way.
