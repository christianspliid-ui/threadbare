| Date | Files | Change | Why |
|------|-------|--------|-----|
| 2026-10-24 | `.claude/skills/pull-work/SKILL.md` (§ Closeout — sync with main before the PR), `Docs/ops/scheduled-task-prompts/tb-opus-pickup.md` | The predecessor wait drops `--required` from `gh pr checks --watch` | After the CI fan-out (#2534) the required check is an aggregator that registers last, so `--required` returned at once on #2535 while four shards still ran |
