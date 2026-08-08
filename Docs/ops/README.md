# `Docs/ops/` — and the `ops` branch

Two homes, one boundary. This page is the boundary.

## The split (THR-947, cutover 2026-08-02)

Operational exhaust — the hourly and daily status artifacts the coordination
lanes write — **no longer lives on `main`**. It is published to the unprotected
**`ops` branch** instead.

The reason is merge traffic, not disk. Branch protection on `main` is strict, so
every file written there arrives via branch → PR → CI → merge, and every such
merge advances `main`'s tip and knocks every in-flight PR to `BEHIND`
(THR-920/THR-945/THR-735). Measured 2026-08-01 10:24–14:24Z: **8 merges to
`main`, only 3 of them product code**; each paperwork merge cost an in-flight
code PR an ~18-minute gate re-run. Publishing exhaust to `ops` removes the
collision at its source — no PR, no CI, no auto-merge, and `main`'s tip does not
move.

Christian's verdict that authorised it (2026-08-01, chat review): *"I don't see a
need for having all the building documents as part of the source code. It is
just scaffolding."*

## Membership predicate (THR-688 rule A)

A document is published to `ops` iff **all three** hold:

1. It is machine-written on a schedule and overwritten or appended wholesale —
   not accumulated human knowledge.
2. No CI gate validates it, and no committed artifact is generated *from* it.
3. Nothing durable (canon, CLAUDE.md, plan docs) cites it as a knowledge source.

This is a predicate, not a list: a new lane's report is a member the day it is
written, without anyone amending this page. When in doubt, durable stays.

### Published to `ops`

| Artifact | Lane |
|---|---|
| `Design/briefing.md` | `keep-work-flowing-cc` (hourly) |
| `Design/user-actions.md` | `keep-work-flowing-cc` (hourly) |
| `Docs/ops/orchestrator-<date>.md` | `tb-orchestrator` (hourly) |
| `Docs/ops/backlog-grooming-<date>.md` | `daily-backlog-grooming` |
| `Docs/ops/weekly-hygiene-<date>.md` | `weekly-project-hygiene` |
| `Docs/ops/test-suite-health-<date>.md` | `tb-orchestrator` T3 (weekly) |

### Stays on `main` (and why)

- **`Docs/ops/scheduled-tasks-registry.md`** and **`Docs/ops/scheduled-task-prompts/`** —
  they document lane *behaviour* durably; the registry is the operational
  authority on fire times, and the prompt mirrors are the versioned copy of
  prompts that otherwise live unversioned on one disk.
- **`Docs/ops/clean-stale-git.sh.md`**, **`threadbare-autosync.ps1.md`**,
  **`threadbare-autosync.test.ps1`** — repo mirrors of containment scripts.
  The registry's § *Unversioned sources are mirrored into the repo* requires
  *more* of these, not fewer, and carries the inventory of what is mirrored
  and what is deliberately not (THR-824).
- **`Docs/ops/repo-automation-log.md`** — appended knowledge, not a scheduled
  overwrite.
- **Dated one-off investigation reports** (`2026-07-21-thr-674-…`,
  `2026-07-25-autoclose-vector-verification`, `2026-07-27-thr-793-…`,
  `2026-07-30-thr-680-…`, `retired-global-claude-md-2026-07-25`) — session-authored
  forensics, so predicate rule 1 fails. `pull-work` cites the THR-680 one.
- **`Design/impediment-dashboard.html`** and its template — a generated artifact
  under `check:generated-freshness`, so predicate rule 2 fails.
- **`Design/retros/`**, `Docs/plans/`, `Docs/audits/`, `Docs/canon/`,
  `Docs/impediments.md`, changelog / project-status / project-history.

## History stays here, frozen

Everything published before the cutover remains on `main` at its original path.
It is not deleted and not stubbed — a dated archive is not a stale "current"
copy, so there is nothing to mistake. Reports dated **after 2026-08-02** live on
`ops`; anything older than that is right here.

The two always-current files are the exception: `Design/briefing.md` and
`Design/user-actions.md` *are* mistakable for current, so their `main` copies are
one-line pointer stubs.

## Reading the live copy

No checkout, no working-tree change — a read-only query, which is what the
home-tree rules (THR-672) permit against the home tree:

```bash
git fetch origin ops --quiet && git show origin/ops:Design/briefing.md
```

Any path from the table above substitutes for the last argument. To browse:
`git ls-tree -r --name-only origin/ops`.

## Writing to it

One entry point, `scripts/ops-publish.sh` — every lane uses it, so the git
mechanics live in one reviewed place instead of being re-derived in five prompts:

```bash
bash scripts/ops-publish.sh -m "<message>" <repo-relative-path>...
```

It commits via plumbing against a throwaway index and pushes directly. It checks
nothing out, so it touches no working tree, creates no worktree for the reaper to
reap, and leaves the caller's branch and HEAD alone. Read the header comment in
that file before changing how a lane publishes.
