---
domain: process
last_reviewed: 2026-10-04
reviewer: claude-code
ul_shards: [Process, Coordination]
status: live
---

# Canon — Session protocol (authoritative, THR-1718)

> **Relocated verbatim from `CLAUDE.md` by THR-1718 (2026-10-04).** This page is now the authoritative home of the session-type split, prioritization (Rule 0 and the finish-before-you-start order), the session-start workflow (precheck `freshness=` / `linear=` tables), scheduled-task rules, the skill-tree layout, domain-skill load order, and the continuous-improvement / process-work throttle rules. The text below is unchanged; paths in it are repo-root relative, and "this file" / "this section" mean their original place in `CLAUDE.md`. `CLAUDE.md` now carries a short card pointing here.

## Session Types: Design vs Execution — Read This First

**One runtime, one executor queue.** All Threadbare agent work runs in **Claude Code**. The design/execution split is a *session type*, not a runtime: a **design session** (`/design-session`) authors plan docs and hands off; an **execution session** (`/pull-work`) implements, commits with `Fixes THR-XX`, and lets the merge-to-main auto-close fire. One queue: **Ready for Dev**. (Codex and the `Ready for Codex` queue were retired 2026-06-23, THR-486; Cowork was retired from the Threadbare workflow 2026-07-21, THR-654.)

This is the reference card. The full protocol — and why each rule is non-negotiable — lives in three authoritative places; read them, don't re-derive from this card:

- **`Docs/canon/process.md`** — session Step 0; the pointer surface for every rule below.
- **`Docs/plans/2026-04-13-linear-coordination-protocol.md`** — canonical detail. The "Coordination Failure Modes — Hard Rules" section (Rules 1–10) explains why each rule exists.
- **`.claude/skills/pull-work/SKILL.md`** — the `/pull-work` pickup flow as an executable checklist.

**In a design session:** Track everything in **Linear** (Threadbare team). Write plan docs into `Docs/plans/` or `Docs/audits/` and commit them directly via a `docs/plan-*` PR — CI-gated, merged immediately. Put the `**Plan doc:** \`Docs/plans/…md\`` path in the issue **description** *and* the handoff comment. Hand off by moving the issue to **Ready for Dev** with a **coordination block** in the handoff comment — `Suggested model` (advisory; the `model:*` label is a work-type signal, not a queue filter — CC always runs Opus), `Parallel-safe with`, `Mutex with`. The Linear state transition *is* the handoff — there is no out-of-band signal. See `.claude/skills/design-session/SKILL.md`.

**Ticket-authoring rules (THR-688)** — three rules bind every ticket you write, full text + motivating examples in the protocol doc § *Ticket-authoring rules*: (A) **predicates, not counts** — a sweep ticket states its membership predicate, never a snapshot count that rots before pickup; (B) **mutex lines carry their reason** — `Mutex with: THR-XXX (both edit <file>)`, and an executor may reverse a mutex only when the stated reason is verifiably inapplicable, recorded in a comment; (C) **Done-whens match the pillar** — browser evidence for UI-pillar surfaces only, engine/content accepted via CLI/headless sweeps. A Done-when may require running N ticks in an automated browser tab **only via `window.__DEBUG.tick(n)`** (THR-689, shipped 2026-07-21): `document.hidden` throttles the interval loop to 1 tick/click, so a Done-when that depends on Play-button ticking is still unreachable by construction.

**In an execution session:** Start with `/pull-work`. Pull the top **Ready for Dev** / `assignee:null` issue (sort by priority in memory — `orderBy:priority` errors, impediment #49). **Claim before you read:** `save_issue(id, assignee:"me", state:"In Dev")`, then `get_issue(id)` to confirm the write stuck (silent drops, impediment #48); only then read the plan doc. **Read the latest comment first** — the `Reopened` label means read all comments back to the original handoff. **WIP = 1** In Dev across all sessions and worktrees — parallel work happens on *different* issues. **Never `save_issue(state:"Done")` from CC** — put `Fixes THR-XX` in the commit body *and* the PR body (impediment #140) and let the merge auto-close fire straight to Done. Check `Docs/plans/` for the design doc before writing code.

**User review interface — Christian is chat-only, plain-language-only (THR-608).** He does not review code diffs, PRs, or Linear. A Done-when like "diff-reviewed by Christian" is invalid. When a change genuinely needs human sign-off, present a plain-language chat summary (what changed, why, what could be lost, your recommendation) and ask one yes/no question; chat approval satisfies the gate — record `human gate satisfied via chat review <date>` as a Linear comment so the executor may merge. Christian's attention is surfaced in `Design/briefing.md` and `Design/user-actions.md` (refreshed hourly by `keep-work-flowing-cc`) and reviewed in an interactive chat session, never a Linear comment addressed to him. **Both files live on the `ops` branch, not `main`** (THR-947) — read them with `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md`; the `main` copies are pointer stubs. Technical verdicts — CI/CD state, git forensics, merge mechanics, not-a-defect calls — are the agent's to make; **so are gate/test calibration and the *how* of implementing an already-agreed design** (Christian, 2026-08-12 — full rule: `Docs/canon/process.md` § User review interface, rule 4). Only genuine creative forks — what the game should *mean*, with no agreed outcome to test against — go to Christian, framed in game terms; when unsure, decide and invite a veto rather than block. **A gameplay-review ask reaches him only when the system under review is level — data, logic, content, and UI all shipped to the surface he will open** (rule 5, Christian 2026-08-13); a partially-landed system gets a status line naming the missing pieces, never a review invitation. See `Docs/plans/2026-07-04-user-review-interface.md`.

### Prioritization: Finish Before You Start

**Rule 0 — a flow impediment with demonstrated cost outranks everything below, including Urgent feature work** (director decision, 2026-08-02). Rules 1–3 order *feature* delivery; Rule 0 sits above all of them and is checked first.

**The membership predicate** (THR-688 rule A): a ticket qualifies when its body or comments record that the delivery machine **already lost work** — and the evidence must be in the ticket and quotable (a count, a duration, a commit SHA, a log line), else it sorts at rule 3. **Materiality bar** (Christian, 2026-08-08): the loss must clear ≥ ~1 hour lost, a shipped artifact corrupted, or ≥3 recurrences in a week — below the bar it is an **impediment-log row, not a ticket**, batched by the weekly retro; every process ticket carries one cost/benefit line (*"costs ~X to fix; not fixing costs ~Y per week"*). **Budget:** product work first; at most **one process ticket per three runs**; a process-only queue is a **starved shelf, not a license to binge** — the headline finding is "feature pipeline needs supply", never more tidying. **Explicitly not qualifying:** dead-code pruning, doc drift, naming/test tidying, and hardening against failures that have not happened — prevention sorts by priority, it does not jump the queue, and `Infrastructure`/`Improvement` labels are not qualifying signals. The incidents behind each clause (the 88-failure pileup THR-834, the April TB-120 stall, the 2026-08-08 measurement): `Docs/plans/2026-04-13-linear-coordination-protocol.md` and the director rulings recorded there.

Then, choose work in this order — finish projects before starting new ones:

1. **Deferrals in active projects** — `Deferral`-labeled issues belonging to a project with active work (`list_issues label:"Deferral" state:"Ready for Dev"`).
2. **Remaining issues in active projects** — clear a project's Ready-for-Dev backlog before pulling from a different project.
3. **New work by priority** — only start a fresh project once active ones have no remaining items.

**Every Linear issue belongs to a project** — no orphans. Deferrals inherit their parent issue's project.


## Session Workflow

- [ ] Read this file for orientation
- [ ] **Read the Ubiquitous Language index** — `Docs/ubiquitous-language/README.md` (always-load, ~3k tokens). Load individual shard files on demand when the task touches their domain. **UL wins on terminology disagreements** — when this file, Obsidian, plan docs, or code comments conflict with the UL, the UL definition is correct and the conflicting source needs reconciliation (open a `UL-proposal` Linear issue).
- [ ] **First tool call of any coding session:** run `node --experimental-strip-types scripts/session-precheck.ts` and compare its `fingerprint ...` line against expected sandbox capabilities before starting feature work
- [ ] **Read the freshness signal.** The precheck output line `fingerprint ... freshness=<value>` reports working-tree state vs `origin/main`. The value is one of seven keys, each with its own action:

  | `freshness=` | Meaning | Action |
  |---|---|---|
  | `current` | On a branch, up to date | Proceed |
  | `ahead:N` | Local commits not pushed | Proceed; push at closeout |
  | `behind:N` | Branch genuinely trails `origin/main` | Surface first; `git fetch && git pull` on main, `git fetch && git rebase origin/main` elsewhere |
  | `stale-branch:Xh` | Old closeout branch still checked out | Surface first; close it out or switch to main |
  | `parked-at-ancestor` | Detached at an older snapshot, **nothing unique stranded** | **Run the repair yourself, then continue** (see below) |
  | `parked-with-unique-commits:N` | Detached with commits that exist nowhere else | **Stop.** Do not reset. Run `git log origin/main..HEAD --oneline` and surface the SHAs |
  | `unknown` | Probe could not determine state | Surface it; ask the user to confirm the tree is current |

  For `behind:*` / `stale-branch:*` / `unknown`, surface it as the **first thing in the response** and do not begin design work until the user has resolved or explicitly acknowledged it.

  **`parked-at-ancestor` is the one case an agent may fix without asking.** The precheck has already proven `git rev-list --count origin/main..HEAD == 0`, so nothing authored can be lost — untracked files survive and the stash is recoverable. Run the repair, note it in one line, and carry on:

  ```bash
  git stash push -m home-tree-recovery   # harmless no-op if the tree is clean
  git switch main
  git pull --ff-only origin main
  ```

  Never read a behind-count off a detached HEAD. `HEAD..origin/main` on a parked HEAD is arithmetically true and semantically false; treating it as decay is what turned a two-command repair into a multi-day escalation (THR-671).
- [ ] **Read the `linear=` signal** (THR-1443). Same fingerprint line. Every pickup invariant is Linear-mediated — `save_issue(assignee, state:"In Dev")` *is* the claim — so a lane whose board is dark must report, not work. The token exists because **from the board's side an outage looks exactly like a quiet queue**: on 2026-09-06 four lanes across three hours each rediscovered the same outage at their first mutation (impediment rows 973 ×5, 974).

  | `linear=` | Meaning | Action |
  |---|---|---|
  | `ok` | Authenticated board read succeeded | Proceed |
  | `nokey` | Endpoint answered; this *script* has no `LINEAR_API_KEY` | **Proceed** — says nothing about the MCP connector, which is how CC lanes actually reach the board. The normal state on the home machine |
  | `noauth` | Endpoint answered and rejected the credential | Expect the connector to be dark too. Confirm with one board read; if it fails, report and do not claim |
  | `unreachable` | No answer within the timeout, or a 5xx | The 2026-09-06 shape. Report the outage as the run's output; **do not claim** |
  | `unknown` | The probe could not classify what it got | Carry on; confirm at your first board read |

  **`nokey` is not a failure and never gates a run.** The probe is credential-free by design — it must be able to report that `LINEAR_API_KEY` is missing without needing it — so what it proves without one is *reachability*, which is the half that matters. A lane that treats `nokey` as red hard-stops itself on a perfectly healthy board; the session that built this probe was in exactly that state while claiming its own ticket. Only `noauth` and `unreachable` are report-don't-work signals.
- [ ] **Check Linear for work** — query issues by state per the protocol in `Docs/plans/2026-04-13-linear-coordination-protocol.md`:
  - **Design session:** Run the board scan from `Docs/plans/2026-04-13-linear-coordination-protocol.md` § Design Session Start — a state-filtered fan-out across In Design, Implementation Planning, Ready for Dev, In Dev, and Todo, bucketed in memory by `status` (never an unfiltered `list_issues` — it overflows the response budget; see Limitations §).
  - **Execution session:** `list_issues state:"Ready for Dev" assignee:null` (pick up handoffs), `list_issues state:"In Dev" assignee:"me"` (resume active work)
- [ ] **Design session — plan doc authoring:** After writing a plan doc to `Docs/plans/` or `Docs/audits/`, commit it directly via its own `docs/plan-*` PR (CI-gated, merged immediately). **Put the `Plan doc:` path in the issue *description* as well as the handoff comment** — a `**Plan doc:** \`Docs/plans/…md\`` line in both, so neither is a single point of failure. Then move the issue to the appropriate state (e.g. Ready for Dev) with the coordination block.
- [ ] Read the vault's `Index.md` (filesystem via `OBSIDIAN_VAULT_PATH`) → follow links to the relevant system. Index.md is the comprehensive catalog — use it as the LLM's navigation system.
- [ ] **For design work**, load the rulebook synthesis first: `Docs/canon/rulebook-quick-reference.md` is always-load; `Docs/canon/rulebook.md` for any work touching rules of play (turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss). Then load `state-of-game-design` (mechanical foundation) and `game-design-direction` (experiential foundation), then descend into Vision/ (vault filesystem via `OBSIDIAN_VAULT_PATH`) and the relevant per-domain canon page.
- [ ] **Check Linear Projects for milestone context** — `list_projects` to see which milestones are in Now/Discovery/Research. Issues belong to projects; projects show the big picture.
- [ ] Check `.planning/ROADMAP.md` for legacy milestone overview
- [ ] Read relevant design doc in `Docs/plans/` before writing code
- [ ] **For content authoring tasks (encounters, attachments, prose, faction content):** load `Docs/canon/<domain>.md` **before any other reference material**. The Canon page is the agent's Step 0 entrypoint — it lists the current spec, canonical pointers, and stale sources to avoid. Start with `Docs/canon/encounters.md` for encounter work, `Docs/canon/cosmology.md` for anything that references Reaches or Spheres.
- [ ] **Upstream health check** — if the feature depends on upstream pipeline throughput, verify the pipeline is producing output before coding. A feature wired to a dead pipeline is wasted work.
- [ ] **Terminology authority check** — if sources disagree on term definitions, UL wins (`Docs/ubiquitous-language/README.md` + shard entries)
- [ ] After completing work, follow the **Definition of Done** above
- [ ] **Update Linear** — move issue to appropriate state, add completion comment
- [ ] **Update vault log** — Append what changed this session to `log.md` via the `vault-log` skill (filesystem write)

### Scheduled Tasks

**Registry: [`Docs/ops/scheduled-tasks-registry.md`](Docs/ops/scheduled-tasks-registry.md)** — all three lanes (CC automation, GitHub Actions, Windows Task Scheduler; the Cowork lane retired with THR-654), their cron *and observed fire time*, the reaper's guardrails, and the weekly continuous-improvement cycle. Slot name ≠ cron minute ≠ fire time; the registry's `Fires` column is the operational one.

Two rules stay here because they gate live session behavior:

- **Operational exhaust lives on the `ops` branch, not `main`** (THR-947, cutover 2026-08-02). The hourly briefing, the user-action list, and every scheduled lane's dated run report are published to an unprotected branch, so they cost no PR and no CI run. (The original third reason — that advancing `main`'s tip knocked every in-flight PR to `BEHIND` — died with strict mode on 2026-08-02, THR-983. The first two still hold, and the cutover stands on them.) **Read:** `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md`. **Write:** `bash scripts/ops-publish.sh -m "<msg>" <paths>` from a worktree's repo root. The membership predicate, what deliberately stayed on `main`, and where the frozen pre-cutover archive sits: [`Docs/ops/README.md`](Docs/ops/README.md).
- **`keep-work-flowing-cc` owns `Design/briefing.md` and `Design/user-actions.md`.** No other scheduled task writes either file — a second writer produces lost updates, since publishing to `ops` is last-writer-wins rather than a merge. Christian-facing items from any other task go in that task's own report under a `## Needs Christian` heading and reach him via the hourly briefing.
- **Registering a new task means recording it.** Pick a cron minute whose *jittered* fire time is clear of the existing ones, then record both the cron and the observed fire time in the registry file **in the same commit**. A live prompt lives outside version control at `C:\Users\chris\.claude\scheduled-tasks\<id>\SKILL.md` — when you edit one, update its mirror under `Docs/ops/scheduled-task-prompts/` in the same PR. The registry and the prompt mirrors are durable and stay on `main`; only the task's *output* goes to `ops`.

## Skill Tree Layout

**`.claude/skills/` is the only skill tree.** Claude Code reads it from a hardcoded path in the CC binary; every skill any Threadbare session can invoke lives there.

A second tree (`.agents/skills/`, with its `check:skill-sync` mirror) was deleted 2026-07-21 with the Cowork lane it served (THR-654) — **do not reintroduce a second skill tree**. Six vault skills retired with it (vault work is filesystem-only now); recover any from git history if wanted.

**When you edit a skill, bump `last_validated_against` to today's date** if you changed instructions, examples, or referenced systems. Skip bumps for typo-only/format-only edits. This field records an explicit correctness affirmation, not a file-modified timestamp. If you review a skill and confirm it is still accurate without content edits, you may still bump the date in a small one-line commit.

## Domain Skills

Every skill's own `description:` frontmatter carries its triggers, and the harness lists all of them each session — so there is no table here. Ask "which skill covers this?" and read that listing. What the listing cannot tell you is **load order**, which is what this section owns:

- **`state-of-game-design` router first**, before any other domain skill. It is a thin (~3 KB) orientation file that routes you to the one or two reference shards your task needs (`reference/cosmology.md` for content/cosmology, `reference/verbs-resolution.md` for engine, `reference/architectural-decisions.md` for plan/audit, `reference/deprecated.md` when proposing a pattern that might be rejected). Load the shards you need, not all four.
- **Prose/content work:** read the **systemic wiring guide** (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) *before* picking a prose skill — it names the 7 engine capabilities (enrichment placeholders, encounter seeding, hidden marks, reputation flow, graph ops, intelligence, divine intervention). Skip it and you will write hardcoded fiction instead of systemic content. Then choose: `prose-pipeline` (resolver architecture), `prose-content-systems` (encounter templates, day-to-day content), `prose-vignettes-and-enrichment` (placeholders, vignettes).
- **Hex-map work:** `hexmap-core` before any layer work; `hexmap-layers` alongside it for signifiers/agents/fog/labels/trails.
- **Content authoring:** the relevant `Docs/canon/<domain>.md` is Step 0 — before any other reference material.
- **Always active:** `ubiquitous-language` (UL wins on every terminology disagreement; propose new terms via a Linear `UL-proposal`) and `impediment-reporter` (log friction as it happens — part of the Definition of Done). `Docs/canon/rulebook-quick-reference.md` is always-load; `Docs/canon/rulebook.md` for anything touching rules of play.
- **Pure narrative fiction unrelated to the game engine** uses the platform skills `anthropic-skills:cw-brainstorming` / `cw-prose-writing` / `cw-official-docs` / `cw-story-critique` *instead of* the prose skills above. These live on the platform, not in `.claude/skills/`, so they carry no repo-side description.

## Continuous Improvement

Two skills form a feedback loop:

1. **`impediment-reporter`** — Every agent logs friction as it happens → `Docs/impediments.md`
2. **`retrospective`** — Periodically analyze the log, implement quick wins, backlog bigger fixes → `Design/retros/`

Repetitive workflows → propose a skill. Use `anthropic-skills:skill-creator` to build and eval

### Process-work throttle (Christian's direction, 2026-08-10)

Measured 2026-08-10: 32 of 35 Ready-for-Dev items were Low-priority process cleanup, zero were feature or content work, and the lanes were still filing more. The materiality bar (2026-08-08, § Prioritization) governed what *qualified*; nothing governed *who files*. Two rules close that:

- **Scheduled lanes do not file process/infrastructure tickets.** A lane that finds a defect in the delivery machinery logs it — an impediment-log row or a line in its own run report — and moves on. The **weekly retro is the single promotion point**: it batches the log and files the few tickets that clear the materiality bar, with the accumulated cost quoted. Sole exception: a loss actively corrupting work *right now* (a gate passing while broken, data being lost as it runs) may be filed immediately. A lane prompt that still says "file findings as tickets" is superseded by this rule.
- **Probes, gates, and standing rules sunset by default.** Anything that has not caught a real defect in **six weeks** is presumed deletable; the weekly retro either renews it by citing the catch or deletes it. Keeping a dead rule requires evidence, not caution — the delivery machine's failure mode is accretion, not gaps (this file is the proof), so the burden of proof sits on *keeping*, never on removing.
