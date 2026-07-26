# Weekly Project Hygiene — 2026-07-26

Full sweep (last sweep 2026-07-22, 4 days prior — at the light-sweep boundary, ran full per the skill's own tie-break).

## Needs Christian

Nothing needs you directly this week. Two items are worth your peripheral awareness, both already flowing through the hourly briefing rather than needing a fresh ping here:

- **THR-768** (billing-failure detector, Urgent priority) has been recommended four times since April and still sits in "Idea." It's a technical build, not a decision — no action needed from you, just flagging that it keeps costing hourly-run time via recurrence.
- **THR-735** (armed-PR staleness / merge-queue decision) needs a technical remedy chosen among the four candidates it already lists (merge queue, drop strict mode, raise the sweep cap, batch docs traffic). Also a technical call the agent lane can make on its own — noting it here so it doesn't stay invisible.

## Queue health

- **Ready for Dev:** 13 issues. Oldest: THR-661 (`curse_artifact`, 2026-07-19, full coordination block present, mutex-blocked behind THR-728 which has since shipped — worth a re-check at pickup). Newest: THR-787 (this morning).
- **In Dev:** 1 (THR-773, Nudge Model WS0 substrate — started today, not stale).
- **In Design:** 1 (THR-786, trait-predicate unification — plan doc explicitly "incoming this session," too fresh to gate).
- **Implementation Planning:** 0.

## Findings filed

- **THR-792** — weekly-project-hygiene's own task prompt wrongly claims `AGENTS.md` was removed by THR-654 (it was reduced to a pointer, not deleted) — a latent false-positive in this very sweep.
- **THR-793** — ~12 root-level markdown files (STYLE.md, IMPLEMENTATION_PATTERNS.md, three `brainstorm-*`, five `2026-03-17-*`, two Slack backlog dumps) have sat outside `Docs/` since March; the 2026-07-22 sweep reported "no orphan root-level markdown" without apparently checking.
- **THR-794** — `scheduled-tasks-registry.md` is missing two live tasks in both directions: `website-code-work` (registered, undocumented) and `ThreadbareRepoAutoSync` (Windows Task Scheduler, undocumented despite being the mechanism CLAUDE.md's Known Sandbox Limitations describes in prose).
- **THR-795** — 19 skills (`engine-architecture`, `content-worldbuilding`, `hexmap-*`, `testing-patterns`, etc.) last validated 2026-05-08, ~11 weeks stale against substantial shipped changes to the systems they cover.
- **THR-796** — Claude-in-Chrome ignores `resize_window` in this environment (pinned ~1430×989), so the unattended lane has no route to a genuine 1920×1080 WebGL capture — found the same day THR-754 shipped the sanctioned-routes ladder, and not covered by it.
- **THR-797** (High) — new THR-672-family hazard: the hourly reaper can delete a still-live session's worktree post-merge, and because `.claude/worktrees/` sits inside the home tree's working copy, git silently resolves upward and the session's next git command targets the home tree with no error. Zero data lost this occurrence; not yet promoted to Known Sandbox Limitations.
- **THR-798** — the 2026-07-24 `weekly-retro` run filed THR-753 and THR-754 citing `Design/retros/retro-2026-07-24.md` as their source — that file does not exist anywhere in git history. The retrospective loop's own audit trail has a silent gap.

## Clean checks

- **Skill-tree structure:** PASS — `.agents/skills/` confirmed absent; all 41 `.claude/skills/*/SKILL.md` carry valid `name`/`description` frontmatter; all CLAUDE.md routing references resolve (the one apparent miss, `design-audit`, is a slash command at `.claude/commands/design-audit.md`, not a skill folder — correctly separate from `design-audit-pipeline`).
- **Linear queue — coordination blocks:** mostly PASS. 10 of 13 Ready-for-Dev issues carry full `Suggested model` / `Parallel-safe with` / `Mutex with` blocks (inline in description or as a handoff comment). Three same-day deferrals (THR-783, THR-784, THR-785) lack one entirely — noted as a grey zone below, not filed, since precedent (impediment #200) treats a missing block on a self-contained ticket against an empty In-Dev board as workable rather than blocking.
- **Impediment log — chronic classes:** the `node_modules` junction-wipe class (4+ occurrences through 07-22/07-24) is now structurally closed — THR-753 shipped the reaper-side guard 2026-07-25, confirmed present in the current `clean-stale-git.sh` doc mirror.
- **Impediment log — format:** already tracked (THR-764, Todo, fully spec'd) — not re-filed. Recommend prioritizing since it's why several 07-23–07-26 entries above had to be read as raw paragraphs rather than structured rows.
- **Three-pillar compliance:** trivially PASS — the one In Design issue (THR-786) has no plan doc yet ("incoming this session"), nothing to gate.
- **Done-state smoke:** PASS on a 5-issue spot-check (THR-780, THR-754, THR-753, THR-732, THR-731) — each has a real landing commit carrying `Fixes THR-XX` and is reflected in `project-status.md` / `project-history.md`.
- **Wiki-freshness escape net:** PASS — zero `Wiki-freshness-exempt:` commits in the last 8 days on `origin/main`.
- **project-status.md:** PASS — 59 lines, at the 60-line contract cap.
- **project-history.md / changelog.md:** PASS — current through today's ships (THR-780, THR-755, THR-754, THR-753, THR-741 all reflected).
- **Obsidian vault:** PASS — `OBSIDIAN_VAULT_PATH` reachable, `Index.md` present, `log.md` current through THR-780/781.
- **Sandbox Limitations cross-check:** one promotion candidate identified (THR-797, the new reaper-worktree-deletion variant); no listed limitation found resolved/removable this week.

## Notes

- **Grey zone — missing coordination blocks on THR-783/784/785.** All three are same-morning deferrals from THR-761/THR-780 closeout, well-specified with predicates and Done-whens, just missing the `Suggested model`/`Parallel-safe with`/`Mutex with` lines. Left un-filed rather than turned into a ticket — three near-identical "add a coordination block" tickets felt like noise for a five-minute fix an executor can do inline at pickup (as impediment #200 already established is fine when the In-Dev board is empty).
- **THR-661 mutex staleness worth a look at pickup, not a finding here.** Its mutex partner THR-728 (`unifiedActionResolution.ts`) shipped 2026-07-25, so the "rebase over it rather than racing it" instruction is now moot — the next session picking up THR-661 should just note the mutex cleared rather than treat it as still live.
- **Root-markdown and skill-staleness findings (THR-793, THR-795) are both "notice, don't panic"** — long-standing conditions, not new regressions. Given Medium priority accordingly, not folded into a single mega-ticket since the remediation shapes differ (file triage vs. skill content review).
- **THR-768 and THR-735 are both already Ready-for-Dev-quality tickets sitting unactioned with recurring cost** — mentioned under Needs Christian for visibility only; no new tickets filed since the existing ones are already well-scoped.
