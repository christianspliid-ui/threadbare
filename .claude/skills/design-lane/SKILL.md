---
name: design-lane
description: The unattended design lane (tb-design-lane, four runs a day). Progresses agreed design work without Christian present — decides a wayfinder map's frontier ticket under the 2026-09-11 delegation with outputs attached and a veto invited, closes a cleared map with its carve-up, or authors, gates and hands off one plan doc for agreed-but-undesigned work. Never charts a map, never picks direction, never touches a ticket reserved for Christian. Christian's ruling 2026-09-25 (THR-1611).
last_validated_against: 2026-09-25
---

# Design lane

## Purpose

Threadbare has an executor (`tb-opus-pickup`) that builds, and an orchestrator (`tb-orchestrator`) that
promotes. Until THR-1611 it had **nothing that designed unattended**: every plan doc and every wayfinder
decision waited for Christian to open a chat. Canon had already delegated the decisions (process.md rule 4,
2026-09-11 — *"wayfinder decision tickets are resolved by design sessions"*), but no routine was sanctioned to
be that session. That is how the living-world map (THR-1589) and five plan-doc tickets sat in `Todo` on
2026-09-25 with a healthy build shelf and nobody authorised to move them.

Christian closed the gap in chat, 2026-09-25:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me
> in many situations, for example where we have agreed on a wayfinder map."

The precedent is the 2026-09-07 driver run: one unattended agent worked the Undertakings map for about two
days (research, delegated decisions, plan docs, handoffs) and all four bands shipped. This lane makes that
routine: **one unit of design work per run, done properly, recorded where a veto can find it.**

## The boundary — what this lane decides, and what stays Christian's

**Agreed work is this lane's.** The test is the ways-of-working mandate: *"Agreement means ready for design and
implementation, so authoring the design sits downstream of it."* Work is agreed when it belongs to:

- a **charted wayfinder map** (the destination was named with Christian when the map was charted);
- a **closed map's carve-up** (the plan-doc tickets the closing comment named);
- a ticket **Christian filed or blessed** whose Done-when is a plan doc, or one the orchestrator's T2 staged;
- a **bug**, or a consequence of a shipped design (rule 4).

**Christian keeps four things. The lane never decides them:**

1. **Charting.** Naming a destination picks direction. The lane never creates a map, and never adds a ticket
   that widens a map's destination — fog *toward* the destination graduates normally; anything past it goes to
   the map's Out of scope.
2. **Reserved tickets.** A map's body may carry a `## Reserved for Christian` section listing tickets he wants
   to decide himself (charting sessions ask him, e.g. the Undertakings map's three forks: kill a mortal, curse,
   usurp). A reserved ticket is surfaced, never worked.
3. **Forks with no agreed outcome.** Rule 4's escalation test: *is this a fork in what the game should mean,
   with no agreed outcome to test against?* If the evidence below cannot decide it, the lane reserves the ticket
   itself (adds it to the map's Reserved section with a one-line reason and the options it built), surfaces it,
   and moves on. It does not guess.
4. **"Not fun" calls.** Never nominate a feature as unfun (D6 case 3).

Everything else is decided **as made, with an invitation to veto**, never as a blocking question.

## Non-negotiables

- **Plans, never builds.** No change under `src/` reaches `main` from this lane. Prototype code lives on a
  pushed `proto/thr-XXXX-<slug>` branch that is **never merged**, or in the vault under `Brainstorms/`.
- **One unit per run.** One decision ticket, *or* one map close, *or* one plan doc. A second unit only if the
  first finished well inside the run and the second is a research ticket the orchestrator has not reached.
- **Claim before work, with the lane marker.** `save_issue(id, assignee:"me")` (+ `state:"In Design"` for a
  plan-doc ticket), `get_issue` to verify (impediment #48), then post a comment whose first line is
  `design-lane claim <run-id>`. Every agent acts as the same Linear user, so the marker is the only thing that
  tells this lane's claims from an attended session's. **An assigned ticket without the marker belongs to
  someone else: skip it.**
- **Never write `Design/briefing.md` or `Design/user-actions.md`** — `keep-work-flowing-cc` owns both.
  Christian-facing lines go in this lane's own report (§ Report).
- **Never claim executor work, never set `In Dev`, never write a close keyword** (`Fixes`/`Closes`/`Resolves`)
  before any issue id. Wayfinder tickets close with `save_issue(state:"Done")` under the wayfinder carve-out;
  plan-doc tickets move to `Ready for Dev` at handoff exactly as `design-session` Step 5 does.
- **Measure every substrate claim before writing it.** The intent judge caught false grep claims in *both*
  first drafts of the 2026-09-07 driver run. A decision or plan doc that asserts what the code does quotes the
  command and its output.

## Constants

| Constant | Default | Purpose |
|---|---|---|
| `DESIGN_LANE_CRON` | `14 2,8,14,20 * * *` | Four runs a day, clear of the pickup (`:00`, jitter to ~`:11`) and orchestrator (`:25`) |
| `DESIGN_LANE_SHELF_FLOOR` | `4` | Non-`Deferral` items in `Ready for Dev` below which a plan doc outranks a map decision |
| `DESIGN_LANE_VETO_WINDOW_HOURS` | `24` | A plan doc may not **start** while any decision it draws on was made by this lane less than this long ago |
| `DESIGN_LANE_MAX_CHECKPOINTS` | `3` | Checkpoint comments on one ticket without a finish before the lane recommends a split and releases it |
| `DESIGN_LANE_REPORT_DIR` | `Docs/ops/` | `design-lane-YYYY-MM-DD[letter].md`, published to the `ops` branch, one file per run |

## Run order

### Step 0 — Guards

1. `node --experimental-strip-types scripts/session-precheck.ts`. `linear=noauth|unreachable` → report and exit
   (claims are Linear writes). Work in this run's **own worktree** cut from `origin/main`; never run git state
   ops in the home tree (THR-672). Prefix every Edit/Write path with the worktree root.
2. **Read vetoes first.** `git fetch origin ops --quiet && git show origin/ops:Design/briefing.md` — the
   `## From Christian` section carries his Discord replies. Any line that vetoes or redirects this lane's work
   is applied **before** new work: reopen the ticket (`Todo`, unassigned) with a comment quoting the veto, or
   post the redirect on the plan-doc ticket and move it back to `Todo`. A veto outranks every other step.
3. Load always-on context: `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`.

### Step 1 — Resume your own work

`list_issues(team:"Threadbare", state:"In Design", assignee:"me")` and the open wayfinder children assigned to
`me`. For each, read the latest comments: one carrying a `design-lane claim` or `design-lane checkpoint`
marker is **yours** — resume from the checkpoint (look for its pushed branch and any dirty worktree first,
`pull-work` Step 1.8's stranded-work probe). At `DESIGN_LANE_MAX_CHECKPOINTS` without a finish, post a split
recommendation naming the seams, move it to `Todo`, unassign, verify, and pick fresh work.

### Step 2 — Choose one unit

Build the candidate set, then take the first that applies:

1. **Shelf thin** (fewer than `DESIGN_LANE_SHELF_FLOOR` non-`Deferral` items in `Ready for Dev`) → a
   **plan doc** (Step 3c), because the executor is about to starve.
2. **An open map has a workable frontier ticket** → **decide it** (Step 3a). Open maps:
   `list_issues(team:"Threadbare", label:"wayfinder:map", state:"Todo")`. Frontier = open children, no
   assignee, no open blocker (`get_issue(id, includeRelations:true)`), **not** listed under the map's
   `## Reserved for Christian`. Prefer the map with the most tickets already resolved (finish before you start),
   then map order. Leave `wayfinder:research` tickets to the orchestrator's T1.5 unless it has not reached them
   in 24h.
3. **A map with no open tickets and no fog** → **close it** (Step 3b).
4. **Agreed-but-undesigned tickets exist** → **plan doc** (Step 3c).
5. **Nothing agreed** → exit with no report. Do not pick an un-agreed roadmap item to stay busy.

**Plan-doc candidates**, in this order: tickets named in a closed map's carve-up; items the orchestrator's T2
staged into `In Design` (unassigned, design-request comment); `Todo` tickets whose Done-when is a plan doc in
`Docs/plans/`. Skip a candidate whose inputs include a lane-made decision younger than
`DESIGN_LANE_VETO_WINDOW_HOURS` — Christian gets a day to veto before anything is built on it.

### Step 3a — Decide a map's frontier ticket

Load the map (low-res: body, Decisions so far, Notes) and the Step-0 material its Notes name. Read **every
comment** on the ticket and the map — Christian's prior verdicts live there, and a decision that contradicts
one is a defect, not a judgement call. Then by type:

- **Research / task (AFK):** as the orchestrator does — a subagent gathers the facts; findings become the
  resolution comment, or `Docs/audits/YYYY-MM-DD-<topic>-research.md` via a `docs/plan-*` PR when long.
- **Prototype:** build the cheapest concrete artifact that answers the question — a census or simulation
  sketch on a `proto/*` branch, a mock following the UI Laws (`Docs/design-system/laws.md`), a generated
  sample written up in `Docs/audits/`. Then **judge it** against the map's destination, the Vision notebook
  (`game-design-direction`) and Christian's recorded stances, and decide.
- **Grilling:** run the `grill-me` question tree **against evidence instead of a person** — canon, Vision and
  taste profile, the map's analysis, prior verdicts in comments, measured substrate. Where the evidence decides,
  decide. Where the answer would change what the game *means* and nothing agreed decides it, **reserve** the
  ticket (§ The boundary, item 3) with the options laid out, and stop.

**Record the decision on the ticket** (one comment, plain language first):

```markdown
**Decided by delegation — design lane, <YYYY-MM-DD> (process.md rule 4). Veto in chat.**

**Decision:** <one or two sentences, game terms>
**Why:** <the evidence that decided it — quoted numbers, canon lines, prior verdicts>
**Options weighed:** <the ones not taken, one line each>
**Would change the call:** <what Christian could say or what a measurement could show>
**Outputs:** <links — audit file, proto branch, mock>
```

Close it (`save_issue(state:"Done")`, verify), append the gist line to the map's Decisions so far, then
**graduate** per the wayfinder skill: new specifiable tickets (create → clear assignee → wire `blockedBy`),
clear graduated fog, rule mis-scoped work out of scope.

### Step 3b — Close a cleared map

Per the wayfinder skill § Closing the map: propose the carve-up in the closing comment (how many plan docs,
which decisions each draws on), close the map, and file one ticket per plan doc in the map's project, `Todo`,
unassigned, each naming the decision tickets it draws from. Those tickets are Step 3c's input on a later run.

### Step 3c — Author one plan doc

Run the **`design-session` skill** end to end — it is the specification, and this lane skips none of it:
Step 0 claim + canon loads, Step 1 governance checklist, Step 2 plan doc with all three pillars, Step 3
intent-judge and design-audit, Step 4 `docs/plan-*` PR with auto-merge, Step 5 handoff with the coordination
block after `check:plan-doc-liveness` says `LIVE`. Two lane-specific rules:

- **Where `design-session` says "surface to the user", this lane decides.** An intent-judge `Revise` is fixed
  and re-run; a `Block` is rewritten once, and a second `Block` releases the ticket to `Todo` with the verdict
  quoted. An `Escalate` finding, or an auditor FAIL on the Vision axis, is a fork: reserve it (surface under
  `## Needs Christian`) and release the ticket — do not hand off over it.
- **Link the decisions inline** where each is used (wayfinder § plan docs link their primary sources), and
  state in the plan doc which of them the lane decided under delegation.

Handoff moves the ticket to `Ready for Dev`, unassigned, with the coordination block as the latest comment.
If the run ends first, post a `design-lane checkpoint` comment (done / remaining / branch / next step) and keep
the claim; Step 1 resumes it.

## Report

**A run that did nothing writes nothing.** Otherwise one file per run at
`Docs/ops/design-lane-YYYY-MM-DD[letter].md` (next unused letter from `git ls-tree -r --name-only origin/ops`),
published with `bash scripts/ops-publish.sh -m "docs(ops): design lane <summary>" <path>` from the worktree
root, then the local file deleted. Gate with
`npm run check:substantive --silent -- --lane report --file <path> --json` — `skip` means delete, publish
nothing.

```markdown
---
lane: tb-design-lane
run: YYYY-MM-DD<letter>
promoted: <plan docs handed off to Ready for Dev>
filed: <tickets filed>
resolved: <decision tickets closed + maps closed>
newFindings: 0
needsChristian: <true only when something was reserved>
---
# Design lane — YYYY-MM-DD (run <letter>, ~HH:MMZ)

## Needs Christian
(only reserved forks — one line each, game terms, the options, the link. Otherwise "nothing needs you".)

## Decided for you
(one line per decision this run made — "[<ticket title>](url) — <the decision in game words>".
Not asks: the briefing shows them so a veto is one chat message away.)

## Work
(what was claimed, done, checkpointed or released, each line with its evidence and link)

## Escalations
```

Every reference Christian reads is a clickable link (CLAUDE.md Rule Zero), by title, never a bare id.

## Fail-soft

| Failure | Fallback |
|---|---|
| Linear unreachable / `noauth` | Exit with a one-line report; claim nothing |
| Claim write does not stick | Skip that ticket; the next candidate |
| A subagent (research, judge, auditor) fails or times out | Checkpoint, keep the claim, exit — never post a guessed resolution |
| Plan-doc PR red for a docs gate | Fix it (docs gates are yours); a red code gate on a docs PR is a finding, checkpoint and report |
| `STRANDED` liveness at handoff | Wait within the run; else checkpoint — never hand off around it |
| Nothing agreed to work | Exit with no report — success, not failure |

## What this is not

- Not a charting lane — maps are charted with Christian.
- Not an executor — it never builds, and never holds `In Dev`.
- Not a second orchestrator — it promotes nothing except its own handed-off plan docs.
- Not a way around a veto — a veto applied in chat reverts the lane's work before anything new starts.
