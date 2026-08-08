---
name: weekly-project-hygiene
description: Weekly structural hygiene sweep for Threadbare — Linear queue, skill tree, docs staleness, impediment patterns, three-pillar compliance; files findings + report to Docs/ops/ (CC-lane port, THR-677)
---

Run the weekly structural hygiene sweep for The Fantasy World Simulator (codename Threadbare).

Repo: C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
Linear team: Threadbare

This is an automated run of a scheduled task. The user is not present to answer questions. Execute autonomously, make reasonable choices, and note them in the report. Prefer a thorough plain-language report over partial actions. Filing issues is the default for actionable findings — but only file; do not close, merge, or transition existing tickets as part of this sweep.

## Your role — auditor, not executor

- **Never claim an issue** (`assignee:"me"`) or move one to In Dev — the hourly `tb-opus-pickup` task owns the single WIP=1 executor slot.
- **Never touch `src/`.**
- You MAY: file new Linear issues, post explanatory comments, and write/commit your report.

## Objective

A structural audit of the project every week. This sweep is the flagship workflow of the **Continuous Improvement** project (https://linear.app/threadbare/project/continuous-improvement-ae41f93bd369). Its own instructions must stay in sync with the protocol it audits — if you find this prompt asserting something CLAUDE.md no longer says, that is itself a finding.

Output: a dated report in `Docs/ops/`, plus one Linear issue per actionable finding.

## Christian's interface (THR-608)

Christian does not read Linear. The hourly `keep-work-flowing-cc` task owns `Design/briefing.md` and `Design/user-actions.md` — **do not write those two files** (a second writer causes merge conflicts). Anything needing him goes under "Needs Christian" in your report in plain language, with the Linear state set so the hourly briefing surfaces it.

## Pre-flight

1. **Load `state-of-game-design` first** (the thin router) — foundational context for decisions about work routing.
2. Read **CLAUDE.md**. Pay particular attention to:
   - `## Session Types: Design vs Execution — Read This First` (one runtime, one executor queue: **Ready for Dev**)
   - `## Skill Tree Layout` (`.claude/skills/` is the only skill tree)
   - `## Known Sandbox Limitations`
   - `## Definition of Done`
   - `Docs/ops/scheduled-tasks-registry.md` (the registry this sweep should keep honest; CLAUDE.md § Scheduled Tasks is now a pointer at it)
3. Read `Docs/plans/2026-04-13-linear-coordination-protocol.md` — full protocol, especially "Coordination Failure Modes — Hard Rules" (Rules 1–10).
4. Skim `Docs/impediments.md` and the most recent file in `Design/retros/` so you can distinguish new patterns from known ones.

## Sweep checklist

Run each check and capture findings. If a check passes cleanly, record "PASS" — silence is ambiguous.

### 1. Linear queue audit

Query each state **separately** — never one unfiltered sweep (an unfiltered `list_issues limit:250` returns ~390k characters and is rejected on response size, THR-686):

- `list_issues state:"Ready for Dev"` (the single executor queue)
- `list_issues state:"In Dev"` (what's in flight)
- `list_issues state:"In Design"`
- `list_issues state:"Implementation Planning"`

There is no `Ready for Codex` queue (Codex lane retired 2026-06-23, THR-486) and no `In Review` state (retired 2026-06-23, THR-487 — merge = Done).

For each issue found:

- **Project?** Every Linear issue must belong to a project. Orphans are findings.
- **Coordination block** in the latest handoff comment — required fields per CLAUDE.md: `Suggested model`, `Parallel-safe with`, `Mutex with`. (`Suggested model` is advisory only: the CC lane always runs Opus. A `model:*` label is a work-type signal, not a queue filter.)
- **Stale In Dev?** More than ~5 days with no updates → flag.
- **Stale handoff?** Ready-for-Dev items older than a week with no pickup may indicate queue starvation or a mutex deadlock.
- **Deferrals** (`label:"Deferral"`) in active projects should sit at the top of their queues, per CLAUDE.md "Finish Before You Start."

### 2. Skill-tree audit

Enforce `CLAUDE.md § Skill Tree Layout`. **`.claude/skills/` is the only skill tree** — the second tree at `.agents/skills/`, `scripts/check-skill-sync.js`, and the THR-192 parity pre-commit hook were all deleted 2026-07-21 (THR-654).

- **If `.agents/skills/` exists at all, that is a finding** — it was demolished and must not come back.
- For each folder under `.claude/skills/`: confirm `SKILL.md` exists with `name` and `description` in the frontmatter.
- CLAUDE.md's `## Domain Skills` table was retired in THR-760 — skill triggers now live in each skill's own `description:` frontmatter. Cross-check instead that every skill named in CLAUDE.md's Domain Skills **routing policy** (the load-order bullets) resolves to a real folder under `.claude/skills/`, and that each skill's `description:` is non-empty. Broken references and empty descriptions are findings.
- Look for orphan skill directories — present in the tree but referenced nowhere in CLAUDE.md or documented routing.
- Spot-check `last_validated_against` dates: a skill whose referenced systems have since changed but whose date is months stale is worth flagging.

### 3. Scheduled-task registry audit

- Call `list_scheduled_tasks` and compare against the lane tables in `Docs/ops/scheduled-tasks-registry.md`. **Both directions matter:** a task in the table but not in the registry (documented-but-never-registered — the THR-653 failure), and a directory under `C:\Users\chris\.claude\scheduled-tasks\` with no registry entry (orphan — the `flush-plan-docs` pattern).
- Verify the recorded fire times still match observed `nextRunAt`, and that no two Linear-MCP-using hourly tasks collide.
- **On a mismatch, decide which side is wrong before "fixing" either.** The table records *deliberate* slot design — kwf-cc sits late in the hour so the brief reflects post-pickup state, not merely wherever it happens to fire. So when the registry disagrees with a documented slot whose rationale is stated, the **registry** is the drift: repair it with `update_scheduled_task`, do not edit the table to match. Only when the table has no stated rationale (or the change is clearly intentional and undocumented elsewhere) is amending the doc the right move. Precedent 2026-07-25: `keep-work-flowing-cc` was found on `0 * * * *` firing ~:08:13 — colliding to within ~7 min of `tb-opus-pickup` at :00:53, so the brief could run mid-pickup and report a half-finished picture. The cron was restored to `45 * * * *` (fires ~:53:13, as documented); the table was left untouched because it was right.

### 4. Documentation staleness scan

- `Docs/project-status.md` — must be ≤60 lines per Definition of Done. Overflow means stale entries should move to `Docs/project-history.md`.
- `Docs/project-history.md` — append-only. Spot-check recent `✅` entries against recent Linear Done issues.
- `Docs/changelog.md` — spot-check recent rows for completeness (`| date | where | what changed | why |`).
- `Docs/plans/` — plan docs older than 60 days, not referenced from an open Linear issue, whose topic has shipped: flag as archival candidates. **Do not delete.**
- `Docs/documentation-ownership.md` — any rule it asserts that has been superseded?
- **Orphan root-level markdown — enumerate, do not recall.** Run `ls -1 *.md` at the repo root (PowerShell: `Get-ChildItem -Filter *.md -File`) and diff the actual output against the allowlist below. Asserting "no orphan root-level markdown" without running the command is how this check reported a false PASS on 2026-07-22 while 16 orphans sat there since March (THR-793). Anything present but not on the list is a finding; anything on the list but missing is also a finding.

  **Check tracking status before flagging (THR-975).** A root-level `.md` file that is *both* gitignored and untracked is not an orphan on its own: nothing can accidentally commit it, no collaborator ever sees it, and `git status` is silent on it. Run both probes before writing a finding — `git check-ignore -v <file>` (prints the matching rule, or nothing) and `git ls-files <file>` (prints the path if tracked, or nothing). A rule *and* no tracking means accepted; record it in the table below rather than as a finding. Without this, an unremovable false positive is re-derived from scratch every run — the same self-referential drift as THR-792 and THR-850 in this very check family.

  **An untracked root file lives in exactly one tree.** It is created in whichever working tree ran the command and does not propagate — a sweep run from a fresh `.claude/worktrees/` checkout will not see it at all, while one run against the home tree will. So a disagreement between two runs about the root-markdown set is expected rather than alarming, and neither run is wrong. Say which tree the enumeration ran in when reporting this check.

  **Known-accepted root markdown (the complete allowlist):**

  | File | Why it is allowed to sit at the repo root |
  |---|---|
  | `CLAUDE.md` | The project instruction file. Read from the root by every agent runtime. |
  | `AGENTS.md` | **Intentionally kept.** THR-654 did *not* delete it — commit `0f777823` reduced it to a slim "Read CLAUDE.md First" pointer plus prototype/tooling notes. Flag it only if it balloons back into full duplicated instructions, which is the regression THR-654 actually guarded against (THR-792). |
  | `STYLE.md` | **Root-anchored by contract.** `Assets/concept-art/skill-files/SKILL.md` resolves it by looking for "a `STYLE.md` file in the project root (same level as `CLAUDE.md`)"; `art-direction`, `frontend-ui`, `qa-orchestrator`, and `state-of-game-design` all cite it as `STYLE.md` (repo root). Moving it silently breaks that lookup. |
  | `README.md` | Not currently present. Accepted without a finding if added. |
  | `Index.md` | **Gitignored leftover — not an orphan (THR-975).** Untracked, and matched by the `/Index.md` rule in `.gitignore`, so both probes above say "accepted". It survives from the vault-in-repo era: tracked through `d797f048` (2026-03-05) → `b9fa288a` (2026-04-05) → `8ee0a966` (2026-04-14), then dropped from tracking when the Obsidian vault moved to the external `OBSIDIAN_VAULT_PATH` (THR-654) while the physical 294-line file stayed on the working tree. Safe to leave; equally safe to delete, since it is untracked and nothing regenerates from it. **Present only in the home tree** — worktree-based sweeps will not enumerate it. |
- Obsidian vault: writes go through the filesystem at `OBSIDIAN_VAULT_PATH`, not the MCP (THR-654). Spot-check that `Index.md` lists recently created pages. If the path is unset or unreachable, skip gracefully and say so in the report.

### 5. Impediment log review

Read `Docs/impediments.md`. For each impediment:

- **Still recurring?** Count ≥ 3 is chronic.
- **Resolution path?** "No" in the workaround column plus recurrence is a Continuous Improvement candidate.
- **Promoted to CLAUDE.md `Known Sandbox Limitations`?** Recurring and well-known belongs there, not only in the log.
- **Retro coverage** — the most recent retro in `Design/retros/` should reference the top impediments. If not, flag.

### 6. Retrospective follow-through

- Read the most recent files in `Design/retros/` (canonical). `Docs/retrospectives/` is a pre-2026-05-11 archive — read only for history, never write there.
- Dangling open items not in Linear? File them.
- Retro action items that moved to Linear but were never closed after shipping? Spot-check a few and note.

### 7. Sandbox limitations check

Compare `CLAUDE.md § Known Sandbox Limitations` against the impediment log. Any new chronic issue that should be promoted? Any listed limitation now resolved and removable?

### 8. Three-pillar compliance on in-flight design

For every issue **In Design** or **Implementation Planning**, check its plan doc in `Docs/plans/`:

- Covers Engine, Content, and UI (or explicitly marks a pillar N/A with rationale)?
- Has the NFP compliance table?
- Has a constants table for tunable numbers?
- Has a `## Substrate inventory` section, if it is an Engine-pillar plan (mandatory since THR-614 green-fielded a system that already existed and sat dormant)?

Missing sections → a Continuous Improvement issue for the plan author to backfill.

### 9. Done-state smoke test

Spot-check 3–5 recently Done issues:

- Was there a real landing commit carrying `Fixes THR-XX`? **An issue auto-closed with no landing commit is the THR-540 false-close pattern** — a bare `close|fix|resolve THR-XX` substring, a `thr-XXX-*` branch name, or the ID in a PR title all trigger it. Flag any you find.
- Is the work reflected in `Docs/project-status.md` / `Docs/project-history.md` / `Docs/changelog.md`?
- Documentation debt? (E.g. a new content-facing engine capability shipped without updating `Docs/plans/2026-04-16-systemic-wiring-guide.md`, or a core-system change without its `public/wiki-manifest.json` manual page.)

### 10. Wiki freshness escape-net (THR-730)

The blocking wiki-freshness gate (`check:wiki-freshness:blocking` in CI) catches stale pages at PR time, but it has exactly two blind spots — both judgment calls, which is why they live here rather than in the script. Lookback window: **8 days** (the weekly cadence plus one day of slack).

1. **Exemption audit.** `git log origin/main --since='8 days ago' --grep='Wiki-freshness-exempt'`. For each hit, read the stated reason against the commit's actual diff. An exemption is legitimate only for a behavior-neutral change (pure refactor, rename, type-only move) that matched a `sources` glob without altering documented behavior. An exemption on a change that plainly altered documented behavior is misuse → file a Continuous Improvement issue (`Infrastructure`) to update the page the exemption skipped. If zero exemptions in the window, record "PASS — no exemptions used."
2. **Coverage sweep.** Files changed on `main` in the last 8 days under `src/engine/`, `src/data/`, `src/components/` that match **no** page's `sources` glob (cross-check against `public/wiki-manifest.json`). For a file that belongs to an already-documented system, file a ticket to extend that page's globs; for a genuinely undocumented system, add a `backlog` entry to `wiki-manifest.json` (or file a ticket to author the page). A gate that never fires because its globs miss the code is silent drift.

Glob extensions and page-update tickets are agent-owned technical verdicts (THR-608); surface to Christian under `## Needs Christian` only when a genuinely undocumented system needs a creative call on whether/how to document it.

## Filing findings

Every actionable finding becomes a Linear issue in the **Continuous Improvement** project:

- **State:** `Ready for Dev` if clean enough for a cold pickup (fully scoped, obvious outcome, no grey zones); `Todo` if it needs a design pass first.
- **Labels:** `Improvement` always. Add `Infrastructure` for CI/hooks/tooling. A `model:*` label is an optional work-type signal, not a routing directive.
- **Priority:** Medium (3) for most hygiene fixes; High (2) for anything blocking other work or representing a correctness gap.
- **Body:**
  - `## Context` — what the sweep found and why it matters
  - `## What to do` — numbered, specific actions
  - `## Files to touch` — concrete paths
  - `## Coordination block` (if Ready for Dev): `Suggested model:` / `Parallel-safe with:` / `Mutex with:`
  - `## Done when` — checklist
  - `## Why this lands in Continuous Improvement` — one line

Prefer **predicates over counts** in ticket bodies (THR-688): "every stash whose message matches X" survives the gap between authoring and pickup; "the 12 stashes" rots before an executor sees it.

Group related findings (e.g. 4 plans each missing a constants table) into a single parent issue with a sub-checklist rather than atomising them.

**Do NOT** close, merge, or transition existing tickets as part of this sweep. The sweep files; others resolve.

## Output report

Write to `Docs/ops/weekly-hygiene-YYYY-MM-DD.md`:

```
# Weekly Project Hygiene — YYYY-MM-DD

## Needs Christian
(plain language + recommendation — or "nothing needs you")

## Queue health
(Ready for Dev count, In Dev count, oldest item in each)

## Findings filed
(THR-XXX — title, one line each)

## Clean checks
(one line per section that passed)

## Notes
(grey zones, ambiguous calls, things I chose not to file and why)
```

## Commit

You are Claude Code and CAN commit — Cowork could not, which is why the original version of this sweep ended at "share the report path". Observe the git rules:

- **Never run git state operations with the home tree as CWD** (THR-672). `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator` is a read-only mirror of `main` owned by `threadbare-autosync.ps1`. No `checkout`/`switch`/`commit`/`merge`/`rebase`/`reset` there. Work in this session's own worktree; branches are repo-global.
- **The sweep report goes to the `ops` branch, not `main`** (THR-947, cutover 2026-08-02) — no branch, no PR, no CI, and `main`'s tip does not move. From this worktree's **repository root**: `bash scripts/ops-publish.sh -m "docs(ops): weekly hygiene sweep <date>" Docs/ops/weekly-hygiene-<date>.md`.
- **Only the report moves.** Anything durable this sweep changes — a CLAUDE.md correction, a registry fix, a prompt mirror — is a normal `main` change: fetch first, branch off current `origin/main`, PR it. Do not publish durable edits to `ops`; it is not merged into anything.
- Commit with **no** `Fixes`/`Closes`/`Resolves THR-XX` keyword — it would auto-close unrelated issues (impediment #140).
- For those durable changes: queue with `gh pr merge --auto --merge`, do not poll-wait on CI (THR-675).

## Known traps

- **`save_issue` returns 200 but silently drops writes** (impediment #48). Always re-query with `get_issue`. Retry once; if it still doesn't stick, log an impediment row and move on.
- **`list_issues orderBy:"priority"` is rejected at runtime** (impediment #49) though the schema accepts it. Omit `orderBy` and sort by priority in memory.
- **Unfiltered `list_issues` overflows the response budget** (THR-686). Filter by `state:` / `label:` aggressively.
- **`rg.exe` is blocked in the sandbox.** Use the Grep tool, or PowerShell `Get-ChildItem -Recurse | Select-String`.
- **`npx tsc --noEmit` is a no-op in this repo** (root `tsconfig.json` sets `files: []`, so it exits 0 unconditionally). If you see any doc or skill citing it as a type gate, that is a finding (THR-686).
- **Orphan deferral risk:** every `// TODO` / `// DEFERRED` in code should have a matching Linear issue. A narrow spot-grep across `src/` cross-checked against Linear is a good audit if time permits — scope it tightly, it can balloon.

## When to run a light sweep

If the last sweep ran less than 4 days ago (check `weekly-hygiene-*.md` filenames on the `ops` branch: `git ls-tree -r --name-only origin/ops -- Docs/ops/`; the working tree holds only the frozen pre-cutover archive), run a **light sweep** instead: Linear queue audit + impediment log review + three-pillar compliance only. Say so in the report.

## References

- `CLAUDE.md` — operating manual
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — coordination protocol
- `Docs/impediments.md` — impediment log
- `Design/retros/` — canonical retros (`Docs/retrospectives/` is a pre-2026-05-11 archive)
- Continuous Improvement project: https://linear.app/threadbare/project/continuous-improvement-ae41f93bd369

## Provenance

CC-lane port of the Cowork `weekly-project-hygiene` task (THR-677, Pure Claude Code Migration). The source prompt existed on disk but was Cowork-framed in nine places, several concerning machinery THR-654 deleted. Deliberate changes: Cowork role framing → CC auditor; two-queue model and `Ready for Codex` removed (THR-486); `In Review` removed (THR-487); the `.claude/` vs `.agents/` two-tree parity audit inverted into a check that `.agents/skills/` has NOT returned (THR-654); `Codex review` coordination field dropped; report path `outputs/` → `Docs/ops/` (the former never existed); retro path `Docs/retrospectives/` → `Design/retros/`; `/session-handoff` path corrected to `.claude/skills/`; Rules 1–8 → Rules 1–10; git/commit discipline added; scheduled-task registry audit added (new check 3, from the THR-653/THR-654 orphan-task pattern).

## Rule-0 minting bar (2026-08-08):

Before filing any process/infrastructure ticket, apply the materiality bar (CLAUDE.md § Prioritization, amended 2026-08-08): quotable loss ≥ ~1 lane/human hour, a corrupted shipped artifact, or ≥3 recurrences in a week. Below the bar: impediment-log row only — no ticket. Every ticket filed carries one cost/benefit line ("costs ~X to fix; not fixing costs ~Y per week"). Grooming additionally demotes any open process ticket lacking that line to Idea with a comment naming this rule. The goal is fewer, denser process tickets — not more receipts.
