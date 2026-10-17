# 2026-10-17 — CI/CD review: pickup runs keep commands in the foreground

**Lane:** weekly `tb-cicd-review` (`cicd-review` skill). No ticket (harness tweaks ship directly, Christian 2026-10-09). Pipeline freeze (THR-1946): this is a fix to machinery that broke a cited run, not new machinery.

- **Changed:** the `tb-opus-pickup` prompt (live + mirror `Docs/ops/scheduled-task-prompts/tb-opus-pickup.md`, backup `SKILL.md.bak-2026-10-17`) and `pull-work` Step 1.6: a pickup run runs the gate, review gate, CLI smoke and Vite in the foreground (Bash `timeout` 600000), never `run_in_background`.
- **Why:** a turn that ends while a background command runs is marked `succeeded` in the run list. The scheduler starts the next run, and THR-1887's predecessor check sees one active row. On 2026-10-17 the 13:31Z run backgrounded its gate and ended its turn at 13:45:06Z; the 13:45:14Z run committed its live worktree as "stranded" work and built THR-1919 a second time (PR #2459). The overlapped run in each of the four pickup overlaps seen 10-14..10-17 had been resumed by background-task notifications. 78 of 298 pickup gate calls since 10-10 were backgrounded; the 219 timed foreground gate runs took 1.7 min median, 5.8 min max, so the 10-min Bash cap is not a constraint.
- **Unchanged:** the review gate, the WIP gate, every required check, the cadence.
- Ledger entry: `Docs/ops/cicd-tweaks.md` on `ops` (2026-10-17). Report: `Docs/ops/cicd-review-2026-10-17.md` on `ops`.
