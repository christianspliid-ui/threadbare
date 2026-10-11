# Weekly Project Hygiene — 2026-10-11

This is a full sweep. The last one ran 2026-10-04, seven days ago. Linear, the scheduler and the census were read from the home tree. Durable edits were made in `.claude/worktrees/hyg-1011` and shipped as [PR #2325](https://github.com/christianspliid-ui/threadbare/pull/2325), which is docs-only, auto-merge armed and has no close keyword. The live prompts for `tb-opus-pickup` and `weekly-project-hygiene` were edited in step with their mirrors.

## Needs Christian

Nothing needs you. One thing you might notice: the builder kept trying to open a preview window it is never allowed to open on its own. It did this nine times in three days, five of them after Friday's retro wrote down the right way. Each attempt cost a minute or two, not the work. The instruction is now in the builder's own checklist, at the exact step where it went wrong ([PR #2325](https://github.com/christianspliid-ui/threadbare/pull/2325)). Details are in F1.

## Queue health

| State | Count | Oldest / notes |
|---|---|---|
| Ready for Dev | **2** | [THR-1810](https://linear.app/threadbare/issue/THR-1810) (prose `{are}` leak, Medium, promoted 10-11 05:30Z). [THR-1812](https://linear.app/threadbare/issue/THR-1812) (chapter step on a paused clock, High) is held until `2026-10-12T08:05Z` by its 24 h veto window. Both are fresh. The design lane's 07:56Z claim calls the shelf "starved (floor 4)". |
| In Dev | **1** | [THR-1580](https://linear.app/threadbare/issue/THR-1580) (capability-reader refit, Deferral). It is live: slices 8 and 9 shipped today ([PR #2321](https://github.com/christianspliid-ui/threadbare/pull/2321) and [PR #2324](https://github.com/christianspliid-ui/threadbare/pull/2324), both armed with no close keyword). Three families remain, one per PR. |
| In Design | 1 | [THR-1807](https://linear.app/threadbare/issue/THR-1807) (round-3 "can't read what they spend or risk"). The design lane claimed it 07:56Z and its plan doc is being written now. |
| Implementation Planning | 0 | — |

Every listed issue belongs to a project. Both Ready-for-Dev handoffs carry `Suggested model`, `Parallel-safe with` and `Mutex with`, each with a reason (rule B). THR-1812's mutex names THR-1807/1808 "once they are planned", which is correct and forward-looking. The only open Deferral (THR-1580) is the one in flight. Nothing is stale: the oldest In Dev update is from today.

Last week's F1 holds: `tb-opus-pickup` still reads `*/20 * * * *`. Last week's F2 (review-gate parks with no reader) is **resolved**. THR-1735 (`efddde52`) made a stuck PR whose newest receipt marker has `open > 0` the pickup lane's Step 0.8 unstick duty, and `review-gate/SKILL.md` step 8 now names that reader.

## Findings

### F1 — Unattended pickups kept calling `preview_start`; repaired at the call site this run

**Evidence.** Impediments #1160, #1162, #1164, #1165, #1168, #1169, #1170, #1172 and #1173 are nine `preview_start` refusals in unattended pickups, 2026-10-08 → 10-10. The 2026-10-09 retro's quick win 1 fixed `Docs/canon/verification-gates.md`. **#1168, #1169, #1170, #1172 and #1173 all came after it.** #1170 names the cause itself: *"The pickup prompt's step-4 browser-verify bullet still names only the browser route, so each run tries `preview_start` first."* `pull-work/SKILL.md:581` does say to decide the route at claim, but the scheduled prompt's own bullet said only *"Use Claude-in-Chrome for any WebGL/canvas surface"*. This is the retro's own pattern: *"rules that bind at a tool call need to sit next to that call."*

**Repair.** The `tb-opus-pickup` live prompt and its mirror (`Docs/ops/scheduled-task-prompts/tb-opus-pickup.md` L62) now add: in an unattended run, never call `preview_start`; pick the route at claim and name it; use bash-vite on an unused port (never 5191, wait for Vite's `Local:` line) or jsdom-render for text- or structure-shaped Done-whens. Shipped in [PR #2325](https://github.com/christianspliid-ui/threadbare/pull/2325).

- **Cost:** each refusal cost ~1–5 min, and #1169/#1172 also staged on the wrong mortal. That is ~30 min across 9 rows. The fix took ~10 min and is done.
- **Clears the bar:** ≥3 recurrences in a week. No ticket is owed because it is repaired. **Retro:** check next week that the count is 0. If a refusal recurs, it belongs in `Docs/ops/sandbox-limitations.md` beside the existing "Browser pane's page is unavailable in unattended runs" row (L19), which today covers the page but not the refusal.
- **Predicate:** every impediment row dated after the PR #2325 merge whose text contains `preview_start` and "refused".

### F2 — Worktree leak: 461 → 503; and the reaper now deletes the *wrong* trees (third week; the 2026-10-09 retro did not pick it up)

**Evidence.** `git worktree list` shows **503** entries, up from 461 on 10-04 and 51 on 09-27. Grouped by name: `kwf` 222, `kwf-wt` 109, `kwf-cc` 45, `kwf-brief` 32, `tfws-kwf` 10, `orchestrator-run` 12, so **~418 are `keep-work-flowing-cc` runs**. Growth slowed from ~59/day to ~6/day this week. The root cause from 2026-10-04 F3 is unchanged: the reaper's pass 1 silently skips a merged tree whose only dirt is `Design/briefing.md` / `Design/user-actions.md` / `Docs/ops/tick-cost-trend.tsv`. `clean-stale-git.sh`, `keep-work-flowing-cc` and its mirror have no commits in 8 days.

**New, and the inverse of the leak: #1174 (2026-10-11).** The design lane's **clean, live** worktree `../wt-dl-1806` disappeared mid-run, branch included, ~15 min after creation, because it had not yet written anything. So the reaper judges trees by "merged and clean", not by liveness: it removes the clean live tree and keeps the dirty dead ones. No work was lost this time. A lane that writes into a tree after a long read phase would lose it.

- **Cost:** ~30 min, the same fix as 2026-10-04 F3. (a) kwf runs `git -C <wt> checkout -- Design/ && git worktree remove` after a successful publish. (b) The reaper adds those three paths to `$noise` and logs the skipped-dirty count. (c) The reaper also gives a minimum age before it reaps any tree (e.g. no reap within 2 h of the tree's creation), which closes #1174. Not fixing costs disk (one sampled tree measured 584 MB last week) and walk time on every `git worktree` call, and a small but non-zero chance of reaping live work.
- **Clears the bar:** a growing artifact in its third week, plus a reaped live tree. Not filed by this lane. **This is the highest-value item for the Friday retro.**
- **Predicate:** every worktree that is an ancestor of `origin/main` whose only dirty paths are in `{Design/briefing.md, Design/user-actions.md, Docs/ops/tick-cost-trend.tsv, .claude/settings.local.json}`. Plus every impediment row reporting a worktree removed while its lane was running.

### F3 — Wiki-freshness gate still covers ~14% of changed code; waivers up 18 → 25 (third week; not picked up)

- **Coverage.** Using the gate's own `globToRegExp` over `public/wiki-manifest.json` (27 pages): of **414** non-test files changed under `src/engine`, `src/data` and `src/components` in 8 days, **355 match no page's `sources`** (last week 349 of 420). The largest gaps are `src/data/encounters` 92, `src/components/Game` 60, `src/components/Remembrance` 10, `src/engine/spellGenerator` 10 (new system, THR-1572), `src/components/MeetTheFirst` 8, `src/engine/itemGenerator` 6 and `src/engine/ruins` 6.
- **Exemption audit.** 25 commits carry `Wiki-freshness-exempt` in 8 days. Reasons sampled in full: `87d8f413`, `5c5e6aa1`, `5f9ce445`, `3a246349` and `f5703921`, with the rest by stated reason. **No misuse found.** Each is a generated page's byte-identity, a constants-only or layout-only edit, a merge resolution, or a type field that does not change a page's subject. Two (`f5703921` and one other) say "no wiki page sources these files", which is the coverage gap seen from the other side.
- **Cost:** ~1 h for globs (spell generator, item generator, ruins, Remembrance first) plus ~20 min to drop generated pages from the stale set. Not fixing costs ~25 waivers a week × ~5 min (~2 h/week), and new systems ship with no signal.
- **Clears the bar** (≥3/week). It is agent-owned (THR-608).

### F4 — This sweep's prompt cited CLAUDE.md sections THR-1718 moved; repaired this run (2026-10-04 F5)

The live prompt and mirror now point the Continuous Improvement, Prioritization, Skill Tree Layout, Domain Skills, Scheduled Tasks and Finish-Before-You-Start citations at `Docs/canon/session-protocol.md`, where those headings survive verbatim. The sandbox summary now points at `## Sandbox — the five that bite first`. Shipped in [PR #2325](https://github.com/christianspliid-ui/threadbare/pull/2325). Below the bar. Other lane prompts probably have the same drift. The retro's 10-09 guidance audit already lists `session-protocol.md` as a missing coordination-process authority, and that is the place to sweep it.

### F5 — Registry orphan: `korselsfradrag-monthly` (repaired)

The direction-3 audit (task directory with no row) found `korselsfradrag-monthly`, a personal bookkeeping task (`0 9 1 * *`, enabled). It now has an out-of-scope row beside `website-code-work` ([PR #2325](https://github.com/christianspliid-ui/threadbare/pull/2325)). It shares the 1st-09:00 slot with `monthly-rulebook-review` but uses no Linear MCP, so there is no collision. Below the bar.

### F6 — Weekly lanes still miss their slot (repeat of 2026-10-04 F6)

`weekly-workflow-retro` (`9 11 * * 3`) did not fire on Wed 10-07. It ran Thu **10-08 04:43Z**, ~17 h late, and produced `workflow-retro-2026-10-08.md`, so this week it was late, not lost. `list_task_runs` also shows a run that started 2026-08-05 with `last_activity_at` 2026-10-03, which looks like a long-lived unarchived session. This sweep and `weekly-retro` fired on time. The retro separately reports no 2026-10-09 drift-scan output an hour after its 14:00 UTC slot. Below the bar. This is an impediment-log row. Watch whether 10-14 fires on time.

## Content model census

```
Seed 42, 200 ticks. 170 live tag(s), 1 DEAD.

### DEAD tags
- `#light`

| Site | Resolved | Empty | Source | Verdict |
|---|---|---|---|---|
| `reward_draw` | 0 | 0 | ring | ⚠️ no hits |
| `step_reward_pool` | 678 | 3 | ring | live |
| `encounter_seed` | 29 | 0 | state (ring saw 53 / 0) | live |
| `undertaking_catalyst` | 5 | 2 | state (ring saw 8 / 2) | live |
| `undertaking_appointment` | 14 | 0 | ring | live |
| `condition_pool` | 0 | 0 | ring | ⚠️ no hits |
| `fight_trophy` | 0 | 0 | ring | ⚠️ no hits |
| `debug` | 0 | 0 | ring | ⚠️ no hits |

Harvested 74066 trace(s); 0 emitted-and-evicted before any tick-end read.

Seed consumption (state): 87 pending seeds observed: 71 spawned, 2 withered, 0 expired, 1 orphaned, 13 still pending.
> 4 consumption events named a seed the ledger never saw pending.

Appointments (state): 6 templates author one (adds `encounter.town.forged_charter_inquest`);
parents fired 20×, 17 planted, 11 kept, 3 missed (absent 3). Reachability: HIT.
```

**Movement against the 2026-09-13 baseline** (106 live, 7 DEAD, `step_reward_pool` 8, four non-debug sites silent) and against last week:

- **Live tags 106 → 170** (flat on the week). DEAD is still 1 (`#light`).
- **The appointment loop is now routine, not a first sighting:** planted 7 → 17, kept 1 → 11, `undertaking_appointment` 2 → 14. There are six authoring templates (+1).
- **`encounter_seed` fell 53 → 29 resolved** and pending seeds fell 132 → 87 on the same seed and ticks. That is a real drop on an exact (`state`) row. A likely cause is this week's capability re-fit (THR-1580 slices, THR-1775 god cast constants) moving who qualifies, but that is unverified. The retro should re-run at a second seed before reading it as a regression. Withered fell 15 → 2, so seeds are not dying more; fewer are being planted.
- **`fight_trophy` is silent for the third week**, along with `reward_draw` and `condition_pool`. These are `ring` zeros with 0 evicted, so "not seen". Per THR-1514 they are not filed on their own. The retro should check whether any seed-42 fight in 200 ticks reaches a trophy draw.
- Orphaned seeds 2 → 1.

## Clean checks

- **Skill tree:** PASS. 50 folders: 49 with `SKILL.md`, `name` and a non-empty `description`, plus the accepted `image-manipulation-workspace`. No `SKILL.md` under `.agents/`. The oldest `last_validated_against` is 2026-07-27.
- **Scheduled-task registry:** PASS apart from F5. All 13 Threadbare crons match the table, including pickup `*/20` and kwf `45 * * * *` firing ~:53. `tb-cicd-review` is registered (10-09) and has not yet reached its first Thursday. Retired directories (`check-slack-for-new-dev-work`, `daily-standup`, `keep-website-up-to-date`) are dispositioned.
- **Stray published reports:** PASS. The home-tree `ls-files --others --ignored --exclude-standard -- Docs/ops/ Design/retros/` is empty.
- **Root markdown:** PASS. Enumerated in the **home tree**: `AGENTS.md`, `CLAUDE.md`, `Index.md` and `STYLE.md`, all on the allowlist.
- **Done-state smoke test:** PASS, 12 of 12. THR-1744, 1747, 1749, 1753, 1754, 1755, 1756, 1768, 1771, 1774, 1775 and 1776 each have a line-anchored `Fixes THR-XX` landing commit, a `Docs/status/` fragment, a `project-history.md` line and changelog rows.
- **Three-pillar compliance:** N/A this week. Implementation Planning is empty, and the one In Design item (THR-1807) has no plan doc yet; it is being authored now. THR-1812's plan (`Docs/plans/2026-10-11-thr-1806-chapter-answers-on-screen.md`) marks Engine N/A with a reason in its handoff.
- **Retro follow-through:** PARTIAL. `retro-2026-10-09.md` shipped all three of the prior week's tickets and filed THR-1795 and THR-1796. It did **not** cover last week's F3 (worktrees) or F4 (wiki coverage). Both repeat above, as F2 and F3.
- **Impediment log:** 9 rows since the retro (#1166–#1174). The chronic cluster is F1 (repaired). #1167 is another heavy-lane timeout under the parallel gate (`doomIdentityMilestones`, twice), the same family as last week's #1128/#1136. #1171 means `?warm=` cannot finish in a hidden tab. Both are below the bar.
- **Sandbox limitations:** no promotion by this lane. The candidate is the `preview_start` refusal (F1) as a sibling of the existing L19 row, if it recurs after PR #2325.

## Notes

- **Durable changes:** [PR #2325](https://github.com/christianspliid-ui/threadbare/pull/2325) (3 docs files; `npm run gate` and `--final` PASS on the docs-only track; auto-merge armed). It also includes the matching edits to the live `tb-opus-pickup` and `weekly-project-hygiene` prompts outside the repo. No scheduler writes.
- **No tickets filed and no comments posted.** F2 came closest, because #1174 is a live tree removed. It lost nothing, and the recovery (create under `.claude/worktrees/` and write at once) is already in the row, so it is not "actively corrupting".
- **Not done:** the orphan-deferral grep and the plan-doc archival pass (time went to F1's repair). The Obsidian `Index.md` spot-check was also not done.
- **Census `encounter_seed` drop:** recorded as movement, not as a finding. One seed and one run are not enough to call a regression.
