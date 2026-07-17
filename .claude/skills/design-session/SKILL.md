---
name: design-session
description: Use when running a Claude Code session that designs or plans rather than implements — authoring a plan doc, running the design-governance checklist, moving a Linear issue toward Ready for Dev, or writing a handoff for the executor lane. The CC replacement for the Cowork design role.
last_validated_against: 2026-07-18
---

# design-session

## Purpose

Run the **design/planning half** of Threadbare's workflow as a Claude Code session type. A design session
produces a compliant plan doc and hands it to the executor lane — it does **not** implement the feature.
This is the CC replacement for the retiring Cowork design role (Pure Claude Code Migration, THR-648–655).

Invoke via the Skill tool: `/design-session` (or when a request is "design X", "plan X", "write a spec for X").

## Two session types, one queue

| Session type | Skill | Does | Linear states it owns |
|---|---|---|---|
| **Design session** | `design-session` (this) | design, research, plan-doc authoring, handoff | Idea → Todo → In Design → Implementation Planning → Ready for Dev |
| **Executor session** | `pull-work` / `tb-opus-pickup` | implement, test, commit, merge | In Dev → Done (via merge keyword) |

**A design session never writes `src/`.** If a design session finds itself editing engine/content/UI code,
it has crossed into execution — stop, finish the plan doc, hand off, and let the executor pick it up. The
role boundary is a session-type discipline, not a runtime one (both are CC now).

## When to use / when NOT to use

**Use when:** the task is to *decide what to build and how* — a new feature, system, or content pipeline that
needs a plan doc before code; grooming an issue from Idea/Todo into Ready for Dev; writing a handoff.

**Do NOT use when:** the task is to *build* something already planned (use `pull-work`); a trivial one-file
fix with no design surface (just do it in an executor session); pure content authoring against an existing
pipeline (use the content/prose/encounter skills directly).

## The one thing that changed from Cowork

Cowork could not commit, so plan docs rode the `plan-pending-commit` label + hourly `flush-plan-docs` pipeline.
**A CC design session commits its own plan doc directly** via a `docs/plan-*` PR (CI-gated, merged immediately).

- **No `plan-pending-commit` label. No hourly flush. No auto-flush fallback.**
- The legacy label+flush path still exists during the migration parallel-run (retires in Phase 3, THR-654) —
  do not use it from a CC design session. Commit directly.

Everything else — design-governance checklist, canon Step 0, intent-judge, design-audit-pipeline, the
three-pillar rule, handoff coordination block, Linear state transitions — is unchanged.

## Workflow

### Step 0 — Session start

1. **Read the freshness signal** (`node --experimental-strip-types scripts/session-precheck.ts`). If the tree
   is behind/stale, surface it and resolve before designing (per CLAUDE.md Session Workflow).
2. **Claim the issue** if working an existing one: `save_issue(id, assignee:"me", state:"In Design")`, then
   `get_issue(id)` to verify the write stuck (impediment #48). New idea with no issue yet → create it under a
   project first (every issue belongs to a project; ask the user if none fits).
3. **Load always-on context:** `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`.
4. **Canon Step 0 (authoring/content tasks):** load `Docs/canon/<domain>.md` **before any other reference
   material** — `encounters.md`, `cosmology.md`, `prose.md`, `hex-map.md`, `rulebook.md` as the task dictates.
   For design work, also load the `state-of-game-design` router and `game-design-direction` (player-facing).

### Step 1 — Design-governance checklist (single internal pass)

Follow the design-governance checklist in **CLAUDE.md § Design Governance** — do not re-derive it here; this is
the spine:

- **Step 0 grill-me** (if scope is large / multi-pillar / ambiguous) — `grill-me`, synthesis to
  `Docs/plans/YYYY-MM-DD-<topic>-grill-me.md`.
- **Step 0.5 Codesight pre-flight** (if the change touches `src/`) — blast radius + dependency chain. Any file
  with **≥100 importers** (see CLAUDE.md high-impact list) forces a **Blast Radius** section up front.
- **Draft** the plan doc — all three pillars — plus its **Brainstorm companion** in the same pass.
- **Audit** against the 7 NFPs, load-bearing decisions, and rejected approaches; **Revise** inline.
- **Summarize** with an NFP-compliance table; **three-pillar check** (Engine / Content / UI / Wiring).
- **Vision audit** and **Rulebook impact** — if the plan changes a Vision premise or a rule of play, the edit
  is part of *this* ticket's scope, not a follow-up.

**Never present a non-compliant design.** Steps happen internally before the user or the executor sees the plan.

### Step 2 — Plan doc

Copy `Docs/plans/_template.md`; name it `Docs/plans/YYYY-MM-DD-<topic>.md`. Required inline sections (not an
appendix), per CLAUDE.md § Per-system required sections:

| Section | Content |
|---|---|
| Engine pillar | systems, graph nodes/edges, tick phases, resolution, PRNG callouts |
| Content pillar | encounter templates, prose tables, attachment content, data tables |
| UI pillar | player-facing display, notifications, DebugPanel, HexMapV2 signifiers — **name the browser-verify tool** (Playwright DOM / Claude-in-Chrome WebGL) |
| Wiring | per module: orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline, player controls |
| Constants table | every tunable number named — default + purpose (NFP #1) |
| Tracing | trace types + TS interface definitions (NFP #2) |
| Fail-soft table | failure cases → fallback behavior (NFP #4) |
| Blast Radius | only when a ≥100-importer file is touched |

A pillar that is genuinely N/A must say so **with rationale** — silence reads as "forgotten", which the
executor rightly defers.

### Step 3 — Gates (before handoff)

1. **Intent-judge (Step 8.5).** Author an action proposal at `Docs/plans/.intent-proposals/<slug>.md`
   (template: `.claude/skills/intent-judge/proposal-template.md`), then spawn `intent-judge` as a Task
   subagent (`model:"opus"`). Verdict gates: Allow → proceed; Revise → fix + re-run; Block → rewrite;
   Escalate → surface the verbatim finding to the user. Record the verdict in the plan-doc tail.
2. **Design-audit-pipeline (Step 8.6).** Spawn the three forked auditors (NFP / three-pillar / Vision) in one
   message via `/design-audit <plan-doc-path>`. Write their ≤300-word verdicts into the plan-doc tail under
   `## Forked-audit verdicts`. Any FAIL/REVISE → surface to the user before transitioning state. (Skip with an
   explicit written rationale only when all three axes are N/A — e.g. a pure process change.)

### Step 4 — Commit the plan doc (direct PR — the key difference)

Commit the plan doc (and its brainstorm companion, grill-me synthesis, intent-proposal) yourself. **Do not
apply `plan-pending-commit`. Do not wait for the flush task.**

```bash
git checkout -b docs/plan-<basename>          # ID-free, e.g. docs/plan-2026-07-18-some-topic
git add Docs/plans/<file>.md Docs/plans/<file>-brainstorm.md   # exact paths, never '.'
git commit -m "docs(plan): <basename>"        # NO issue id in the subject (THR-510)
git push -u origin docs/plan-<basename>
gh pr create --title "docs(plan): <basename>" --body "<one-line: what this plan designs>"
```

**Scrub every closeable reference (THR-510).** The commit subject, branch name, PR title, and PR body MUST NOT
contain `Fixes`/`Closes`/`Resolves`, a bare `THR-XXX` token, or a `linear.app/.../issue/THR-XXX` URL —
committing a plan doc never resolves its issue, and any of those makes GitHub→Linear sweep the issue to Done.
The issue↔PR link lives only in the Linear handoff comment (Step 5). Wait for the required
`Test · Typecheck · Build` check to go green, then merge. A plan doc is docs-only — browser-verify exempt.

### Step 5 — Handoff (Linear)

Only after the plan doc is merged to `main`:

1. Verify the Implementation-Planning → Ready-for-Dev exit criteria (coordination protocol § Exit Criteria):
   every pillar has numbered action items or an explicit N/A.
2. Put the plan-doc path in the issue **description** too: `**Plan doc:** \`Docs/plans/YYYY-MM-DD-topic.md\``.
3. Move the issue: In Design → Implementation Planning → Ready for Dev. Verify each write stuck (`get_issue`).
4. Post the handoff comment (coordination protocol § handoff template). **Every section present**; the
   coordination block is mandatory:

```
## Handoff: [Issue title]

**Plan doc:** `Docs/plans/YYYY-MM-DD-topic.md`  (merged: <PR url or sha>)

### Engine action items
1. …
### Content action items
1. …  (or: N/A — [rationale])
### UI action items
1. …  (or: N/A — [rationale])
### Wiring action items
1. …
### Files changed by the design session
- …
### Grey zones / executor decisions needed
- …

### Claude Code coordination
**Suggested model:** sonnet | haiku | opus — one-line rationale (advisory; the automation runs Opus regardless).
**Parallel-safe with:** THR-XX, THR-YY (file-surface disjoint) — or "none".
**Mutex with:** free-text of the files/surfaces this issue will collide on.
```

**The state transition plus the handoff comment IS the handoff** — no out-of-band notification. The executor
(`tb-opus-pickup`) polls Ready for Dev hourly and pulls the top item.

## Hard rules

- **A design session never writes `src/`.** Design and plan only; hand off to the executor. (Session-type role
  boundary — coordination protocol § Role Boundaries.)
- **Commit plan docs directly via a `docs/plan-*` PR.** Never apply `plan-pending-commit`; never route a CC
  design session through the flush pipeline.
- **Never emit a closeable issue reference on the plan-doc PR** — no `Fixes/Closes/Resolves`, no bare
  `THR-XXX`, no linear-issue URL, in the commit / branch / PR title / PR body (THR-510). The link is the Linear
  handoff comment.
- **Never `save_issue(state:"Done")`.** Design sessions hand off to Ready for Dev; Done is merge-gated and
  belongs to the executor lane (Rule 3).
- **Verify every state/label write** with `get_issue` (Rule 7 / impediment #48).
- **No incomplete handoff.** Every pillar has action items or an explicit N/A rationale; the coordination block
  is present. An incomplete plan produces deferrals — the whole point of the gate is to prevent that.

## Common mistakes

| Mistake | Fix |
|---|---|
| Started implementing the feature in the same session | Stop at the plan doc + handoff; the executor implements. |
| Applied `plan-pending-commit` out of habit | CC commits directly — no label, no flush. |
| Put `Fixes THR-XX` on the plan-doc PR | Scrub it — that closes the issue before any code exists (THR-510). |
| Moved the issue to Ready for Dev before the plan doc merged | Merge the `docs/plan-*` PR first; the executor needs the doc on `main`. |
| Handoff comment missing the coordination block | Add Suggested model / Parallel-safe with / Mutex with — it's mandatory. |
| Skipped intent-judge / design-audit "to save time" | They gate the handoff; a Block/FAIL surfaced late costs an executor cycle. |
