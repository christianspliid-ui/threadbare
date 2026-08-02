# Weekly Project Hygiene — 2026-08-02

Full sweep (last sweep was 2026-07-26, 7 days ago — outside the 4-day light-sweep threshold).

## Needs Christian

Nothing new needs Christian from this sweep. One item already in his queue is worth a status note: **THR-931** ("make Docs gates a required status check") is correctly parked In Dev + unassigned (per its own comment, this doesn't consume the WIP slot) and Christian's own 2026-08-01 comment on the ticket says the underlying settings change is *already done* via GitHub ruleset `15479914` — the only remaining work is a `CLAUDE.md` correction, already filed and Ready for Dev as THR-967. Recommend closing THR-931 once THR-967 ships; no new action needed from this sweep.

## Queue health

- **Ready for Dev:** 60 issues. Dominated by Continuous Improvement self-referential process/tooling findings (many from the daily-backlog-grooming and orchestrator lanes running between sweeps) plus a long tail of `Deferral`-labeled low-priority engine/content cleanup items. Oldest untouched-looking item: THR-582 (2026-07-03, deferred inline-phase migration tail) — low priority, not starving anything.
- **In Dev:** 5 issues, but only 2 are genuinely live executor WIP once assignee semantics are checked: THR-969 (Christian, director-review, not executor WIP), THR-931 (deliberately parked+unassigned per its own comment, doesn't consume the slot), THR-947 (PR #1251 already merged; stays open because its own Done-when requires a multi-hour post-merge observation window — correct, not stale), THR-860 (content, blocked — see Findings), THR-792 (small docs fix, claimed ~6h ago, not yet stale). No WIP=1 violation found once the park/merge states are accounted for.
- **In Design:** 1 issue (THR-883, Christian's Fable-prototype design session, actively producing PRs — not a normal plan-doc flow, three-pillar structural gate N/A).
- **Implementation Planning:** 0 issues.

## Findings filed

- **THR-975** — weekly-project-hygiene's own root-markdown check (§4) has no gitignore awareness, so `Index.md` (a gitignored, untracked leftover from the pre-`OBSIDIAN_VAULT_PATH` vault-in-repo era) will false-positive as an "orphan" on every future run. Same self-referential-drift class as THR-792/THR-850. Ready for Dev, haiku-sized.
- **Comment added to THR-930** (no new ticket — it's the exact mechanism gap that ticket already tracks): PR #1114 (THR-860, WS5 Batch 1b-i content) has sat `DIRTY`/`CONFLICTING` since 2026-07-30T13:02Z (~2.8 days), CI green, unarmed, invisible to the armed-PR sweep. THR-860 has been In Dev the whole time. Recommend whoever picks up THR-930's fix use this as the verification instance; in the meantime PR #1114 needs a manual rebase to unstick THR-860's WS5 batch chain (it mutexes 5 sibling batches).

## Clean checks

- **Skill tree** (check 2): `.claude/skills/` is still the only tracked skill tree — no `.agents/skills/` resurrection in git (a same-named path exists on local disk but is 100% gitignored `*.png` scratch output from image-manipulation-skill testing, invisible to git status, not a repo concern). 44 skill directories, all carry `SKILL.md` except `image-manipulation-workspace/` — which turns out to hold only 320 gitignored PNGs and no skill content, so it's local clutter rather than a broken skill. Domain-skills routing table (via `state-of-game-design` router and CLAUDE.md § Domain Skills) all resolve to real, non-empty `description:` skills. PASS.
- **Scheduled-task registry** (check 3): all 10 entries from `list_scheduled_tasks` (incl. the disabled `website-code-work`) match `Docs/ops/scheduled-tasks-registry.md` row-for-row on cron and observed fire time, both directions. No orphans either way. PASS.
- **Documentation staleness** (check 4): `project-status.md` is 59 lines (≤60 contract). `project-history.md` and `changelog.md` tails match recent Linear Done issues (THR-715, 757, 891, 346, 348) one-for-one. No plan docs in `Docs/plans/` older than 60 days by mtime. Root markdown: `CLAUDE.md`/`AGENTS.md`/`STYLE.md` present as expected; `Index.md` present but gitignored+untracked (see Findings — THR-975 files the check-instruction gap, not a repo defect). `Design/retros/*-draft.md` (the two untracked drafts visible in git status) are expected, documented, regenerable `npm run retro-draft` output per `retro-2026-07-24.md`'s own reconstruction note ("safe to delete at any time") — not orphans.
- **Impediment log** (check 5): no new chronic pattern beyond what's already in CLAUDE.md § Known Sandbox Limitations. Most-cited impediment in prose is #48 (save_issue silent drop, already promoted) at 5 references; nothing else clusters.
- **Retrospective follow-through** (check 6): most recent retro (2026-07-31) is present, cites drift-scan issues consumed, and its footer is logged in `Docs/impediments.md`. No dangling open items found outside Linear.
- **Sandbox limitations** (check 7): no new chronic issue observed this cycle warranting promotion; nothing listed reads as resolved/removable.
- **Three-pillar compliance on in-flight design** (check 8): only one In-Design/Implementation-Planning item (THR-883) — it's Christian's own interactive Fable design session, not a CC-authored plan doc, so the structural plan-doc gate doesn't apply; it's producing real output (a landed vertical-slice PR, `b459ec15`).
- **Done-state smoke test** (check 9): spot-checked the last 10 Done issues via `git log` — all carry proper `thr-XXX` branch/commit naming, land via merge PRs, and are reflected in `project-history.md`. No THR-540-style false-close pattern found in the sample.
- **Wiki freshness escape-net** (check 10, part 1): zero `Wiki-freshness-exempt` commits in the last 8 days — PASS, no exemptions used this cycle, nothing to audit for misuse.

## Notes

- **Wiki freshness coverage sweep (check 10, part 2)** was not run this cycle — cross-referencing 8 days of `src/engine`/`src/data`/`src/components` changes against every wiki-manifest glob is a heavier script-shaped task than fits this pass's budget on a repo this active (dozens of merges/day). Flagging as a gap rather than claiming PASS; a future sweep with more budget, or a dedicated script, should pick this up.
- **Local-disk clutter, not repo findings:** two directories confused this sweep before being ruled out — `.agents/skills/image-manipulation-workspace/` (gitignored `*.png` scratch, git-invisible) and `.claude/skills/image-manipulation-workspace/` (same, 320 gitignored PNGs, no SKILL.md, no tracked content). Neither is a repo hygiene defect since nothing in either is trackable, but both are worth a manual `rm -rf` at some point since they're pure disk noise that could re-confuse a future audit reading raw `ls` output without checking gitignore status first (the same class of trap THR-975 now documents for `Index.md`).
- **Queue composition:** Ready for Dev's 60 items are heavily weighted toward meta-process findings generated by the hourly/daily lanes themselves (THR-756 already exists specifically to address "update open signals instead of filing weekly duplicates" — this sweep tried to honor that by commenting on THR-930 instead of duplicating it). Worth a future retro checking whether the daily/weekly lanes are collectively over-producing low-value Continuous Improvement tickets faster than they drain.
