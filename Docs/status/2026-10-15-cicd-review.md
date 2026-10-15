# 2026-10-15 — CI/CD review: sunset the inert Stop hook

**Lane:** weekly `tb-cicd-review` (`cicd-review` skill). No ticket (harness tweaks ship directly, Christian 2026-10-09).

- **Removed:** the `Stop` hook registration in `.claude/settings.json` and `.claude/hooks/session-stop-gate.sh`, plus the two files only it and an unwired sibling used: `.claude/hooks/stop-retro.sh` (never registered) and `.claude/hooks/lib/json-get.js`.
- **Why (six-week sunset):** the gate shipped 2026-04-13 and has caught nothing in six months. It writes no log, and no impediment cites it. Its output is `{"hookSpecificOutput":{"continue":true,...}}`, a shape Stop hooks do not read, so it never blocked a stop. It still spawned bash + node at the end of every turn in every session.
- **Unchanged:** the review gate, the WIP gate, the worktree write guard, every required check.
- Ledger entry: `Docs/ops/cicd-tweaks.md` on `ops` (2026-10-15). Report: `Docs/ops/cicd-review-2026-10-15.md` on `ops`.
