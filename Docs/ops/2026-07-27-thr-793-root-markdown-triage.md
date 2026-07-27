# Root-level markdown triage — THR-793

**Date:** 2026-07-27
**Issue:** [THR-793](https://linear.app/threadbare/issue/THR-793/12-orphan-root-level-markdown-files-sitting-since-march-never)
**Scope predicate:** every `.md` file at the repo root other than `CLAUDE.md`.

## Why this record exists

`Docs/ops/weekly-hygiene-2026-07-22.md` reported *"no orphan root-level markdown"* as a clean
check. A plain `ls -1 *.md` at the repo root returned **17 files** — 16 orphans by the predicate
above. The check had been asserting a remembered result rather than enumerating.

The ticket's snapshot listed ~12 files; the predicate caught **16**. `AGENTS.md` was the notable
omission from the snapshot list — a reminder that the predicate governs, not the count
(CLAUDE.md § Ticket-authoring rules, Rule A).

## Verdicts

### De-duplicated (3) — byte-identical twin already at the canonical path

These three were exact duplicates of files already sitting in `Docs/plans/`, verified with
`diff` before removal. Every inbound reference — `engine-architecture/SKILL.md`,
`state-of-game-design/reference/verbs-resolution.md`,
`state-of-game-design/reference/architectural-decisions.md` — already pointed at the
`Docs/plans/` path, not the root copy. The root copies were shadow copies referenced by nothing.

| File | Canonical copy retained |
|---|---|
| `2026-03-17-generalized-action-targeting-design.md` | `Docs/plans/` (identical) |
| `2026-03-17-gold-reach-economic-systems-design.md` | `Docs/plans/` (identical) |
| `2026-03-17-world-state-and-hex-actions-design.md` | `Docs/plans/` (identical) |

> The ticket says *"Do not delete."* No content was deleted: each file's bytes remain at the
> path every reference already used. Relocating them was not available as an option — the
> destination was already occupied by the identical file.

### Relocated to `Docs/plans/` (6) — design-time docs

| File | Note |
|---|---|
| `2026-03-17-claude-code-prompts.md` | Its own body already cited `Docs/plans/2026-03-17-gold-reach-economic-systems-design.md`; the move makes the sibling reference local. |
| `2026-03-17-economy-content-enrichment-prompts.md` | Phase prompts for the economy enrichment pass. |
| `brainstorm-faction-vertical-slice.md` | Referenced from `.planning/BACKLOG_HISTORY.md` and `.planning/HANDOVER_HISTORY.md`; both pointers repaired to the new path. |
| `brainstorm-location-npcs.md` | `.planning/BACKLOG.md:393` cites an Obsidian path, already flagged there as unverified — left as-is. |
| `brainstorm-sphere-affinity-system.md` | — |
| `deprecation-notice-wheel-and-fixed-actions.md` | Its two internal references to `2026-03-17-generalized-action-targeting-design.md` now resolve within the same folder. |

Filenames were preserved exactly rather than renamed to the `YYYY-MM-DD-topic.md` plan-doc
convention: renaming would have broken inbound bare-name references for no gain, and
`Docs/plans/` already carries undated entries (`_template.md`, `cowork-session-start-prompt.md`).

### Relocated to `.planning/` (2) — backlog history

| File | Note |
|---|---|
| `BACKLOG_FROM_SLACK_2026-03-11.md` | Sits beside `BACKLOG_HISTORY.md`, per the ticket's own suggestion. |
| `BACKLOG_ITEMS_FROM_SLACK.md` | Same. |

### Relocated to `Docs/` (3) — implementation-pattern reference trio

| File | Note |
|---|---|
| `IMPLEMENTATION_PATTERNS.md` | 1,291-line pattern extract. |
| `PATTERNS_REFERENCE_INDEX.md` | Navigation index over the other two. |
| `TOOLTIP_CHECKLIST.md` | Checklist template referencing `IMPLEMENTATION_PATTERNS.md` sections. |

Moved together and into the same folder so the trio's bare-name cross-references keep
resolving. Landed at `Docs/` root beside the existing `Docs/ui-patterns.md`.

### Kept at the repo root (2) — with rationale

| File | Rationale |
|---|---|
| `AGENTS.md` | Intentionally kept. THR-654 did *not* delete it — commit `0f777823` reduced it to a slim "Read CLAUDE.md First" pointer plus prototype/tooling notes. The regression to guard against is it ballooning back into duplicated instructions, not its existence. See THR-792. |
| `STYLE.md` | Root-anchored by contract. `Assets/concept-art/skill-files/SKILL.md` resolves it by looking for *"a `STYLE.md` file in the project root (same level as `CLAUDE.md`)"*, and `art-direction`, `frontend-ui`, `qa-orchestrator`, and `state-of-game-design` all cite it as repo-root. Moving it silently breaks that lookup. |

## Closing the verification hole

`weekly-project-hygiene` § 4 previously read:

> Orphan root-level markdown: files at the repo root other than `README.md` and `CLAUDE.md` —
> flag anything new. (`AGENTS.md` went with the THR-654 demolition; if it has reappeared, that
> is a finding.)

Two defects in one line: it invited a from-memory assertion, and its parenthetical was
factually wrong about `AGENTS.md` (the subject of THR-792), which would have produced a false
*positive* on the one file the sweep was most likely to notice.

Replaced with an enumerate-and-diff instruction plus a four-row **known-accepted allowlist**
carrying each file's reason. Applied to both the live prompt
(`C:\Users\chris\.claude\scheduled-tasks\weekly-project-hygiene\SKILL.md`) and its repo mirror
(`Docs/ops/scheduled-task-prompts/weekly-project-hygiene.md`) in the same commit.
