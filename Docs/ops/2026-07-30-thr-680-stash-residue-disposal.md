# THR-680 — stash residue disposal + already-shipped finding (2026-07-30)

## Headline: THR-680's bulk scope shipped nine days ago under its parent's id

THR-680 was split out of THR-674 on 2026-07-21 07:12Z, when an executor stopped a pass
against the 38-deep stack. **Later the same day, a subsequent session completed that exact
work and closed it under THR-674**, not THR-680 — so THR-680 was never moved out of `Todo`
and sat there until the orchestrator promoted it at 2026-07-30 04:31Z.

Evidence on `origin/main`:

| Commit | Date | What |
|---|---|---|
| `b55b0b22` | 2026-07-21 13:12 | `docs(thr-674): dispose 38-stash stack + 6 worktree strays` — body states `stash list 38 -> 0`, `All 38 dropped SHAs recorded in the disposal doc` |
| `67cf352c` | 2026-07-21 | salvage `stash@{36}` — THR-17 closeout WIP (2 plan docs) |
| `1456e639` | 2026-07-21 | salvage `stash@{30}` — thr-316-precheck (detail-page data model) |
| `4271e1c4` | 2026-07-21 | salvage `stash@{15}` — rulebook canon page draft |
| `5b44fde6` | 2026-07-21 | salvage `stash@{12}` — 21 plan + intent-proposal docs |
| `2ff7a0fd` | 2026-07-21 | Merge PR #674 (`docs/stash-salvage`) |

The per-stash verdict record THR-680's Done-when asks for already exists at
**`Docs/ops/2026-07-21-thr-674-stash-worktree-disposal.md`** — a full 38-row SHA table plus
a verdict-count table. Nothing in THR-680's bulk scope remained to do.

**Why the mechanical upstream-shipped check did not catch this.** `pull-work` Step 4.4 greps
`origin/main` for `Fixes|Closes|Resolves THR-680`. The work shipped under `Fixes THR-674`,
so the grep was correctly clean. A split-out child ticket whose scope is then executed under
the parent's id is invisible to that check by construction — logged as **impediment #310**,
with the cheap widening: when a ticket body says "Split from THR-XXX", grep the parent's id
too, and read the parent's state (THR-674 was `Done`, which is itself the signal).

## Residual entries at pickup (2)

The ticket's stated count (38) had rotted to **2** by pickup — both created *after* the
THR-674 disposal by the `home-tree-recovery` recipe in CLAUDE.md § Session Workflow
(`git stash push -m home-tree-recovery`, the sanctioned `parked-at-ancestor` repair).

Classified by **blob reachability against `origin/main`'s full object graph**
(`git rev-list --objects origin/main`, 41,066 objects) — the method THR-674 established,
because a diff against the tip reports false "unique" on superseded files. Both flagged
byte-unique with their path surviving on `main`, so both got the third axis THR-674 used:
compare stashed content against `main`'s current version.

| Ref | SHA | Date | File | Stashed | On `main` | Verdict |
|---|---|---|---|---|---|---|
| `stash@{0}` | `170b1e9a1ebd` | 2026-07-28 13:22 | `Docs/ops/orchestrator-2026-07-28.md` | 51 lines | 641 lines | **Dropped — superseded (truncated race artifact)** |
| `stash@{1}` | `952c51fab9a4` | 2026-07-21 22:53 | `Design/user-actions.md` | 146 lines | 176 lines | **Dropped — superseded (content reached `main` independently)** |

Full parent chains, for recovery by SHA:

- `170b1e9a1ebd4fee4123a2a94cb68cba5ff1e01b` — parents `a783f4453f2a` `1939261cac87`
- `952c51fab9a437708edce8b42c9d509a41716ea0` — parents `5177083ffb6f` `b399c505d6ae`

### `stash@{0}` — truncated orchestrator report

The stashed blob holds **51 lines** where `main` holds **641**: a same-day orchestrator run
overwrote the day's accumulated report with only its own section, and the
`home-tree-recovery` stash captured that truncated intermediate state. `main`'s version is
strictly a superset. This is a live instance of **THR-849** ("Orchestrator's dated report
file is outside the `merge=union` set, so two same-day runs racing produce a permanently
DIRTY armed PR") — the same race, caught in the stash stack rather than in a PR. Recorded
here as corroborating evidence for that open ticket; no fix attempted under this id.

### `stash@{1}` — stale snapshot of an hourly-rewritten inbox

`Design/user-actions.md` is owned and rewritten hourly by `keep-work-flowing-cc`, and its
own header instructs *"When an item resolves: delete it from this file"* — so a 9-day-old
snapshot is stale by design. Its unique text (`DECIDED 2026-07-21 in chat`) reached `main`
independently via `8aa9fae3` / `93c3348e`, and the durable facts it recorded are preserved
in `CLAUDE.md` (upstream report `anthropics/claude-code#79713`),
`Docs/audits/2026-07-20-git-cicd-forensics/upstream-report.md`, `Docs/changelog.md`, and
`Docs/project-history.md`. Nothing unique is lost.

## Containment note — how the drop was run

THR-680's body says "Run from the HOME tree". The orchestrator's promotion comment flagged
that this predates the THR-671/672/797 containment hardening. Both were honored: every
command used the `git -C "$HOME_TREE"` form, so the home tree was **never the CWD**, and
`git stash drop` touches only the stash reflog — it does not move `HEAD` and does not write
the working tree, so it is not one of the forbidden branch-state ops
(`checkout`/`switch`/`commit`/`merge`/`rebase`/`reset`).

Pre-existing home-tree debris, present at pickup and **not** authored by this session, left
untouched: `M .claude/settings.json`, `M .claude/settings.local.json`,
`?? Design/retros/retro-2026-07-24-draft.md`, `?? Docs/ops/orchestrator-2026-07-30g.md`.

## End state

`git -C "$HOME_TREE" stash list` → **empty**. Every entry that existed at pickup carries a
recorded verdict above; no entry was kept, so the "only entries with a keep-reason"
condition holds trivially. Both dropped commits remain reachable by the SHAs above until
`git gc` prunes them.
