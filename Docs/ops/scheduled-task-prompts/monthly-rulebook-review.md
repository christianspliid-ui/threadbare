---
name: monthly-rulebook-review
description: Monthly review of Docs/canon/rulebook.md — [OPEN]/[DESIGN] drift check, open questions >60 days, quick-reference sync; files one Linear issue with findings (THR-405/417, registered by THR-704)
---

Run the monthly rulebook review for The Fantasy World Simulator (codename Threadbare).

Repo: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
Linear team: Threadbare

This is an automated run of a scheduled task. The user is not present. Execute autonomously; note judgment calls in the filed issue.

## Your role — reviewer, not editor

You review and file; you do not rewrite the rulebook in this run. Never claim an issue or move one to In Dev (`tb-opus-pickup` owns the WIP=1 slot). Never touch `src/`.

## Scope

`Docs/canon/rulebook.md` (full synthesis) and `Docs/canon/rulebook-quick-reference.md` (the ~80-line card). The weekly drift-scan Action already lints rulebook-vs-UL/canon/code/vision mechanically — do NOT duplicate those signals. This review is the judgment layer on top:

1. **[OPEN] questions >60 days old.** For each `[OPEN]` marker, find when it was introduced (`git log -S` on the marker text). Anything older than 60 days is a finding: it should either be answered (name who can answer it — design decision → Christian via the briefing; technical → an executor ticket) or demoted to a tracked Linear issue and removed from the rulebook.
2. **[DESIGN] markers that shipped.** A rule tagged `[DESIGN]` whose implementation has since landed (grep the named system in `src/` + `Docs/canon/systems-inventory.md`) should read `[IMPL]` — stale tags are drift. List them with evidence.
3. **Quick-reference sync.** Every rule of play stated in the quick-reference must appear (and agree) in the full rulebook. Divergences are findings.
4. **Recent rules-of-play changes without rulebook rows.** Skim the last month of `Docs/changelog.md` for entries touching turn structure, action verbs, prerequisites, resources, encounters, clocks, or win/loss; confirm each has its rulebook update (the Definition-of-Done requires same-PR updates — a miss is a process finding, not just a content one).

## Output

File ONE Linear issue in the **Content Architecture** project, state `Todo`, labels `["Improvement"]`, titled `Rulebook review <YYYY-MM> — <n> findings`, with a per-finding checklist (marker/section, evidence, suggested disposition). If there are zero findings, file nothing — post no issue and end; the task's lastRunAt is the heartbeat. Do not write report files; the issue IS the report.

## Known traps

- `save_issue` returns 200 but can silently drop writes (impediment #48) — verify with `get_issue`.
- Unfiltered `list_issues` overflows the response budget (THR-686) — filter by state/label.
- `rg.exe` is blocked in the sandbox — use the Grep tool or PowerShell `Select-String`.

## Provenance

Spec from THR-405 Phase 3 / THR-417 (cron `0 9 1 * *`, 1st of the month 09:00 local — clear of all other slots). THR-417 closed 2026-06-12 without the registration actually happening (phantom-Done found by the 2026-07-22 hygiene sweep); registered for real by THR-704. The prompt was authored fresh from the THR-405/417 spec — the "full prompt documented in CLAUDE.md" that THR-417 referenced no longer existed in any CLAUDE.md revision on main.
