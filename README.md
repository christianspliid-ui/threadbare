# `ops` — Threadbare operational exhaust

This branch is **not** source code and is not merged into `main`. It holds the
status artifacts the coordination lanes write on a schedule: the hourly briefing,
the Christian-facing action list, and the per-run lane reports.

It exists because `main` is protected. Every file written to `main` arrives via
branch → PR → CI → merge, and each such merge advances `main`'s tip and knocks
every in-flight PR to `BEHIND` under strict branch protection. Measured
2026-08-01: 8 merges in four hours, only 3 of them product code. Publishing here
costs no PR, no CI run, and does not move `main` (THR-947).

## Layout

| Path | Written by | Cadence |
|---|---|---|
| `Design/briefing.md` | `keep-work-flowing-cc` | hourly |
| `Design/user-actions.md` | `keep-work-flowing-cc` | hourly |
| `Docs/ops/orchestrator-<date>.md` | `tb-orchestrator` | hourly |
| `Docs/ops/backlog-grooming-<date>.md` | `daily-backlog-grooming` | daily |
| `Docs/ops/weekly-hygiene-<date>.md` | `weekly-project-hygiene` | weekly |
| `Docs/ops/test-suite-health-<date>.md` | `tb-orchestrator` T3 | weekly |

Paths mirror where these files used to live on `main`, so every existing
reference reads correctly once you point it at this branch.

`keep-work-flowing-cc` remains the **single writer** of `Design/briefing.md` and
`Design/user-actions.md`. That rule carries over from `main` unchanged: a second
writer produces lost updates. Other lanes surface Christian-facing items under a
`## Needs Christian` heading in their own report, and the briefing collects them.

## Read

```bash
git fetch origin ops --quiet && git show origin/ops:Design/briefing.md
git ls-tree -r --name-only origin/ops
```

A read-only query — it changes no working tree, so it is allowed against the
home tree under the THR-672 rules.

## Write

From a session worktree, on `main`'s side of the repo:

```bash
bash scripts/ops-publish.sh -m "<message>" <repo-relative-path>...
```

That script (on `main`, at `scripts/ops-publish.sh`) commits via git plumbing
against a throwaway index and pushes straight here. It checks nothing out. Do
not hand-roll the git for this — one reviewed entry point is the point.

## History before 2026-08-02

Everything published before the cutover stayed on `main` at its original path,
frozen. See `Docs/ops/README.md` there for the membership predicate and the full
list of what deliberately did *not* move.
