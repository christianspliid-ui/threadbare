---
lane: tb-weekly-review
run: 2026-10-25
filed: 1
canceled: 0
tweaksShipped: 2
needsChristian: false
---
# Weekly review — 2026-10-25

First run of the folded lane (THR-1950), fired Sunday at registration. Inputs: [cicd-review-2026-10-23](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-review-2026-10-23.md), [weekly-hygiene-2026-10-25](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-hygiene-2026-10-25.md) (this morning; not re-derived), [retro-2026-10-23](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/retro-2026-10-23.md).

## Needs Christian
Nothing needs you. This morning's hygiene ask (an attended session for [THR-1947](https://linear.app/threadbare/issue/THR-1947)) looks moot: its ledger half shipped with [#2535](https://github.com/christianspliid-ui/threadbare/pull/2535), its sibling [THR-1949](https://linear.app/threadbare/issue/THR-1949) built unattended ([#2573](https://github.com/christianspliid-ui/threadbare/pull/2573)), and this run edited `scripts/gate.ts` unattended. Agents can un-park it and let the builder retry the wiki-warning half.

## Headline numbers
Window 10-18 → 10-25 (row on [cicd-metrics.tsv](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-metrics.tsv)), vs 10-16 → 10-23:
- Merges/day **10.4** (8.4). Ticket PRs 74 opened, 73 merged.
- Catch-up **29.7 %** (6.7): an artefact. Pipelining's pre-PR `git merge origin/main` counts as a catch-up: 2 of 56 PRs before the 10-24 cutover, 19 of 34 after. DIRTY 0, peak open 1.
- Slow > 60 min **2.7 %** (5.1). p90 open → merge 39 min (44).
- CI PR median **4.7 min** (14). The 4-way fan-out landed. CI PR failures 7.8 % (7.9).
- Heavy tests red on main **10.2 %** (1.7). Product-side; handed off below.
- Pickup lane (50 runs, 10-24 20:42Z → 10-25 18:13Z): 23 idle, median 7.2 min, 0 failed, longest 153 min. Claim-to-claim on a run of ships ~27 min median (50 on 10-21).

## Impediments and drift
15 rows / 23 occurrences since 10-23, ~2.3 h lost. Drift-scan: [THR-915](https://linear.app/threadbare/issue/THR-915), [THR-1799](https://linear.app/threadbare/issue/THR-1799), [THR-747](https://linear.app/threadbare/issue/THR-747), [THR-911](https://linear.app/threadbare/issue/THR-911), all standing `Idea` refreshes with nothing new that clears the bar. Doctrine versions unchanged (prose@2, encounter-authoring@1, identity-vision@2, cosmology@1, rules-of-play@1, ui-laws@1, architecture@1, coordination-process@1), so no guidance audit.
- **Overlapping pickup runs built three tickets twice** (THR-1948, THR-1843, THR-1966; #743 ×3, #1215, #1217, #1220): fixed as a tweak.
- **Gate false reds from test timeouts** (≥ 6 in two days; #1210 ×3, #1221, #1222): fixed as a tweak.
- **Long measurement runs pass the 600 s command cap** (9 occurrences in 2 days; #1211 ×3, #1212 ×2, #1213, #1214 ×2, #1219), ~10 min of re-planning each: **filed** (link below). Cost: ~20 min of usage text and per-seed defaults; not fixing costs ~1.5 h a week on economy tickets.
- **Worktree leak 600** (+47 a week, fifth week): agent-owned harness fix, not a ticket. It is next week's first tweak (reaper treats kwf output paths as noise).
- Stays a log row: #1218 (a Done-when the CLI cannot run), #1222's Playwright scroll paint.

Filed: _added on republish_.

## Tweaks
Ledger: [cicd-tweaks.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-tweaks.md).
- 10-17 foreground commands: **kept, closed**. No gate hit the cap; the overlaps come from subagent waits.
- 10-23 Process lint removal: **kept, closed**. No miss.
- 10-24 CI fan-out: **improved** (14 → 4.7 min). Week 1 of 2.
- 10-24 pipelined pickup: **improved** (cycle 50 → ~27 min). Week 1 of 2. Judge on slow % / DIRTY, not catch-up. [THR-1951](https://linear.app/threadbare/issue/THR-1951) (Todo) describes this change and is satisfied upstream; it needs a closer, not a rebuild.
- **Shipped [#2580](https://github.com/christianspliid-ui/threadbare/pull/2580)** (armed): the gate's `test` run uses 15 s / 60 s vitest timeouts (a loosening), and pull-work Step 1.6 on the resume path treats a `succeeded` run active in the last 15 min as alive. `npm run gate` PASS, `--final` PASS.

## Queue
- Ready for Dev **5**, all product, all behind veto windows ([THR-2023](https://linear.app/threadbare/issue/THR-2023) opens 19:45Z tonight, [THR-2030](https://linear.app/threadbare/issue/THR-2030) and [THR-2009](https://linear.app/threadbare/issue/THR-2009) by 05:22Z; [THR-2040](https://linear.app/threadbare/issue/THR-2040), [THR-1929](https://linear.app/threadbare/issue/THR-1929) new). The builder has idled since 12:43Z. That is a held shelf, not an empty one, and it reopens overnight.
- In Dev 2: [THR-1950](https://linear.app/threadbare/issue/THR-1950) (attended, live today) and [THR-1947](https://linear.app/threadbare/issue/THR-1947) (`Parked`). Nothing silent 24 h+ without a reason.
- [THR-1926](https://linear.app/threadbare/issue/THR-1926) (The Crossroads) has sat in Implementation Planning for 11 days with a passed gate. Owner: the design lane should move it to Ready for Dev on its next run.
- Materiality sweep: 2 process tickets in Todo. [THR-1938](https://linear.app/threadbare/issue/THR-1938) is kept (a real false-fail). THR-1951 is upstream-shipped, not below the bar. **0 canceled.** No orphans.

## Blocking hygiene
- Scheduler: all crons match the [registry](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-tasks-registry.md). The five folded lanes are disabled with crons kept; `tb-weekly-review` is enabled Fri `0 17 * * 5`.
- One for next week: `npm run retro-draft` dates its window from the newest `Design/retros/retro-*.md` on main, and the fold now publishes to `ops`. Next Friday's draft will start at 10-23 again. Read the window from this report's date instead.
