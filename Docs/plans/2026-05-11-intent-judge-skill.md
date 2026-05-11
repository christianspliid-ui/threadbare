# Intent Judge skill — design + handoff

**Status:** Design complete, awaiting CC handoff to land files.
**Authored:** 2026-05-11 (Cowork)
**Source brief:** User request to build an intent-judge skill based on Nate B. Jones's LLM-as-judge framing (YouTube `SX1myuPEDFg`, transcript pasted into the design conversation).
**User verbatim ask:** *"we need to create a intent-judge skill like nate talks about here for our game development, to basically review every large thing an agent does or wants to do in our workflow"*
**User-confirmed grey zones (from AskUserQuestion pass, 2026-05-11):**

- Scope: design docs and implementation plan docs only. Not brainstorms (user is co-author). Commits and PRs are downstream — explicitly out of scope for v1.
- Home: `.claude/skills/intent-judge/` (CC-visible; mirrored to `.agents/` for shared-skill semantics).
- Invocation: sub-agent on all design and implementation plan documents.
- Output: PASS/CONCERN/FAIL three-state verdict, with structured findings.

## What changed after reading Nate's full transcript

The user's initial pick (PASS/CONCERN/FAIL) shipped before the transcript was read. After reading it, three things in the v1 needed to change. Each is a deliberate departure from the user's first-pass answer, surfaced here because the creative director expects pushback when I think a decision is wrong:

1. **Verdict is four-way, not three-way.** Nate explicitly calls binary (and by extension three-state where the middle is mushy) "too simple" and says it's what makes humans build *around* the judge instead of with it. The four outcomes that make the layer trustworthy are **Allow / Revise / Block / Escalate**. Revise = author can fix without re-checking with the user. Escalate = the user must weigh in. The split makes the gate's high-confidence verdicts (Allow, Block) actually mean something, and gives the gate a graceful middle path it doesn't have to over-use.
2. **Author must produce a structured action proposal**, not just hand the doc over. Nate: *"the acting agent needs to justify what it wants to do, cite evidence, be extremely clear about its task scope."* The judge reads the proposal first — that's the dependency-inverted reading order that defeats correlated judgment. Without a proposal, the judge has only the doc, which already reflects the author's framing.
3. **Impact classification drives judge intensity.** Nate's four buckets (read-only / reversible writes / external actions / high-risk actions) map onto plan-doc classes. A content table addition is reversible; a Linear-protocol or CLAUDE.md edit is external (changes other agents' behavior); a load-bearing-decision change is high-risk and defaults to Escalate. The same judge running with different intensity beats a one-size-fits-all rubric that's either too loose for the dangerous cases or too noisy for the cheap ones.

These three changes are non-negotiable in the v1. If they're wrong, the failure mode is "judge layer that nobody trusts, gets bypassed within two weeks" — which is the exact failure Nate warns against.

## Non-functional priorities check

| NFP                                    | Status   | Note                                                                                                                                            |
|----------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| 1. Tunability                          | PASS     | Constants block declared in SKILL.md (model, latency, finding cap, escalation floor/ceiling, proposal dir).                                     |
| 2. Inspectability                      | PASS     | Every verdict requires quoted evidence per dimension. Per-judgment metrics file lets us trace why a verdict fired weeks later.                  |
| 3. Determinism                         | PASS w/note | Aggregation rubric is deterministic (first-match-wins). The PASS/GAP/VIOLATION scoring per dimension uses LLM judgment, which is non-deterministic by nature — anti-correlation rules constrain it. |
| 4. Fail-soft                           | PASS     | Missing proposal → Block with explicit reason (not crash). No frontier model → Escalate with reason. All bounce paths defined.                  |
| 5. Narrative over mechanical perfection | N/A      | Process skill; no narrative surface.                                                                                                            |
| 6. Additive over destructive           | PASS     | New skill, new dir. Existing checklist in CLAUDE.md is untouched; intent-judge slots into the Audit step without removing existing rules.       |
| 7. Performance budget                  | PASS w/note | Target latency = 90s/judgment. Kill criteria fires if median exceeds 5min. No optimization until we have a week of data.                       |

## Three-pillar coverage

| Pillar  | Coverage                                                                                                       |
|---------|----------------------------------------------------------------------------------------------------------------|
| Engine  | **N/A.** This is a workflow-and-process skill; no runtime engine code is touched.                              |
| Content | **N/A.** No content tables, encounter templates, or prose involved.                                            |
| UI      | **N/A in code; YES in operator-facing output.** The verdict block is the UI — it's read by Cowork, by CC at pickup, and by the user during Escalate. Format defined in the skill as a verbatim markdown template. |

Process skills frequently fail the three-pillar rule on a strict reading. Acknowledging N/A explicitly with rationale, per CLAUDE.md's design governance.

## Wiring section

| Surface                          | How intent-judge plugs in                                                                                                                                                         |
|----------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Cowork plan-doc workflow         | After writing a plan doc, BEFORE applying `plan-pending-commit` and moving Linear to Ready for Dev/Codex, Cowork spawns the judge subagent (Agent tool, `general-purpose`, `model: "opus"`). |
| Linear issue                     | Verdict block pasted as a comment on the originating issue. Escalate verdicts add a `judge-escalated` label. Block verdicts add `judge-blocked`. Allow/Revise add no label.       |
| `Docs/plans/.intent-proposals/`  | New directory. Author writes the action proposal here before invoking the judge. Filename matches the plan-doc slug.                                                              |
| `Docs/judge-metrics/YYYY-WW.md`  | New directory. One line per judgment with verdict, dimension scores, latency. The `retrospective` skill picks this up Fridays.                                                    |
| CLAUDE.md Domain Skills table    | New row pointing to `intent-judge` skill, "When to load" = "Before handing off any plan doc". Editing CLAUDE.md is part of this issue's scope.                                    |
| `.claude/commands/intent-judge.md` | Slash command wrapper so the judge can be invoked manually against any plan-doc path.                                                                                          |
| Cowork `flush-plan-docs` skill   | No change. The judge runs before the label gets applied, not after.                                                                                                              |

## Constants table

Constants live in the skill itself. Listed here for plan-doc compliance:

- `INTENT_JUDGE_MODEL = "opus"` — frontier model required for anti-correlated judgment
- `INTENT_JUDGE_TARGET_LATENCY_SECONDS = 90`
- `INTENT_JUDGE_MAX_FINDINGS = 12`
- `INTENT_JUDGE_ESCALATION_FLOOR = 0.05`
- `INTENT_JUDGE_ESCALATION_CEILING = 0.30`
- `INTENT_JUDGE_PROPOSAL_DIR = "Docs/plans/.intent-proposals/"`

## Fail-soft table

| Failure                                              | Behavior                                                                                                |
|------------------------------------------------------|---------------------------------------------------------------------------------------------------------|
| Action proposal missing or malformed                 | Verdict = Block with reason `no action proposal produced`. Do not score dimensions.                     |
| Frontier model unavailable                           | Verdict = Escalate with reason `no frontier model available`. Anti-correlation guard slipped.           |
| Plan doc path doesn't exist                          | Verdict = Block with reason `plan doc not found at <path>`.                                             |
| Linear issue unreachable (MCP down)                  | Continue with proposal + doc only. Note in metrics block that issue was not fetched. Verdict may be partial. |
| Aux file (Vision, UL, canon) unreachable when needed | Mark relevant dimension as GAP with reason; do not block the whole verdict on infrastructure flakiness. |
| Same plan hits Block three times in a row            | Force Escalate on the third attempt; the author is stuck.                                               |

## Anti-correlation guard (load-bearing)

Nate flags correlated judgment — judge and author sharing model, context, prompts, or assumptions — as the failure that voids the whole pattern. The skill enforces four anti-correlation rules:

1. **Different model.** Author may be on Sonnet/Haiku. Judge runs on `opus`. If frontier isn't available, the judge declines and surfaces Escalate.
2. **Cold context.** Spawned via Agent tool; the subagent sees only what the prompt explicitly names. No conversation history, no scratchpad, no memory.
3. **Different persona.** The judge skill is the persona. The judge does not also draft content.
4. **Reversed reading order.** Author writes intent → scope → design. Judge reads `intent_quote` → action proposal → plan doc. The reversal stops the judge from absorbing the author's framing before the user's verbatim ask.

If any of these break in a run, the judge logs it in the verdict block's metrics section — partial verdicts are explicit, not hidden.

## Kill criteria (intent-judge for the intent-judge)

The skill should be retired if any hold for a full month:

- Verdict distribution ≥95% Allow with zero user overrides → judge is rubber-stamping.
- Override rate on Revise/Block ≥50% → judge is mostly wrong about what's a problem.
- Time-to-judgment median exceeds 5 minutes → too slow to stay in the handoff path.
- User reports the judge has never caught something they wouldn't have caught → no marginal value.

Retirement: archive SKILL.md to `Docs/retired/skills/intent-judge/`, remove from Cowork's plan-doc workflow.

## Eval set (built alongside v1)

To answer "is the judge actually sharp or theatrical?" within the first month, we ship a small calibration set. Six recent plan docs from `Docs/plans/`, split:

| Bucket     | Candidate plans (to confirm with user) | Expected verdict |
|------------|----------------------------------------|------------------|
| Known-good | Three plans the user shipped cleanly with no executor pushback. Suggested: `2026-05-08-thr-265-skill-freshness-metadata.md`, `2026-05-04-encounter-build-toolkit.md`, `2026-04-13-linear-coordination-protocol.md`. | Allow |
| Known-bad  | Three plans that bounced, had to be re-cut, or shipped with regrets. To be picked by the user — Cowork can't reliably self-identify these. | Revise, Block, Escalate (one each ideal) |

For each, an action proposal is reverse-engineered from the doc + Linear issue + commit history. The judge runs on the calibrated pair. Verdicts get compared to ground truth. Mismatches inform a v1.1 prompt revision.

Scoring run is a follow-up issue, not part of this one. This plan commits to *building* the eval set, not running it.

## Blast radius

Codesight check — no `src/` files touched. Files affected are all under `.claude/`, `Docs/`, and `CLAUDE.md`. No high-impact files in the touched set. Blast Radius section formally not required, but flagging here for governance audit: the CLAUDE.md edit *is* high-leverage (CLAUDE.md is loaded into every agent session). The edit is additive (one new Domain Skills row), reviewed in this plan.

## Out of scope (deferrals, with Linear issue numbers TBD)

- Judging *commits* and *PRs* — user explicitly scoped to design/plan docs only. Open `Deferral` issues if we want this later, especially for high-risk commits that change CI or branch protection.
- Judging *brainstorm docs* — user is a participant; no asymmetry to police.
- *Specialist judges* per impact class — Nate flags "general vs. specialist judge" as a design choice. v1 is a single general judge with class-keyed intensity. Specialist judges are a v2 idea if metrics show one class dominates the false-positive rate.
- *Memory governance for judge-written memory* — Nate mentions this; v1's judge doesn't write to memory at all (only to the verdict block and the metrics file). If a v2 lets the judge accumulate "intent prior" memory across plans, we'll need separate handling per Nate's substack.

## Definition of Done for this issue

- [ ] Files at appendix paths exist on `origin/main`.
- [ ] `intent-judge` row appears in CLAUDE.md Domain Skills table.
- [ ] First real plan doc after merge invokes the judge; verdict is posted to the Linear issue as a comment.
- [ ] One-line entry appended to `Docs/judge-metrics/2026-W19.md` (or current week).
- [ ] Plan doc auto-committed by `flush-plan-docs` task.

## Handoff

This is a **Ready for Codex** handoff (mechanical: write files, no judgment calls needed).

**Files to touch:** see appendices A–D below; paths listed at the top of each.
**Parallel-safe with:** any plan-doc-level work that doesn't edit `.claude/` or CLAUDE.md.
**Mutex with:** any other plan that edits CLAUDE.md (merge order matters).
**Done when:** all four appendix files exist at the named paths, CLAUDE.md row added, `flush-plan-docs` has committed this plan doc.

---

# Appendix A — `.claude/skills/intent-judge/SKILL.md`

```markdown
---
name: intent-judge
description: >
  Verifier subagent that scores design and implementation plan docs against
  the originating user intent before they hand off to CC or Codex. Returns
  one of four verdicts — Allow / Revise / Block / Escalate — with structured
  per-dimension findings. The judge boots cold (no shared context with the
  author), reads the structured action proposal first, then the plan doc,
  then the originating intent (Linear issue + verbatim user ask). Auto-invoked
  by Cowork after writing any plan doc in Docs/plans/ or Docs/audits/ and
  before the Linear state transitions to Ready for Dev or Ready for Codex.
  Also callable manually via `/intent-judge <plan-doc-path>`.
last_validated_against: 2026-05-11
---

# Intent Judge

## Purpose

A separate judge persona that guards user intent on plan-doc handoffs. The
author (Cowork) is optimizing for task completion. The judge is optimizing
for one thing only: does this plan serve the user's actual ask, and does it
respect the project's load-bearing constraints?

Per Nate B. Jones's LLM-as-judge framing: the same agent cannot optimize for
two primary goals. Splitting "draft the plan" from "guard the intent" into
two specialized agents — different persona, different context — is what
makes the pattern hold. Better prompts in the author's session do not fix
intent drift; they get overridden by the author's task-completion bias.

The judge is the manager. The author is the worker. The user is the
principal whose intent the manager guards.

## Why this exists

The plan-doc handoff is the action boundary in Threadbearer's workflow. Once
a doc moves to Ready for Dev or Ready for Codex, an executor picks it up on
an hourly cycle and starts coding. That handoff is irreversible in any
useful sense — bouncing a plan back wastes executor cycles, pollutes Linear,
and erodes trust in the design governance checklist. The historical signal
is that plan docs occasionally drift from what the user asked for, miss a
load-bearing decision, or reintroduce a rejected approach without flagging
it. A separate judge with the user's verbatim ask in front of it, no author
context to bias toward, and an explicit four-way verdict is the smallest
architectural change that catches these.

## Constants

- `INTENT_JUDGE_MODEL = "opus"` — frontier model required (see "Anti-correlation")
- `INTENT_JUDGE_TARGET_LATENCY_SECONDS = 90` — target wall time per judgment
- `INTENT_JUDGE_MAX_FINDINGS = 12` — cap on findings; consolidate beyond this
- `INTENT_JUDGE_ESCALATION_FLOOR = 0.05` — below this, judge may be rubber-stamping
- `INTENT_JUDGE_ESCALATION_CEILING = 0.30` — above this, judge is annoying the user
- `INTENT_JUDGE_PROPOSAL_DIR = "Docs/plans/.intent-proposals/"` — where action proposals live

## Invocation Triggers

All active:

1. **Auto** — Cowork has just finished a plan doc in `Docs/plans/` or
   `Docs/audits/` and is about to apply the `plan-pending-commit` label
   and move the Linear issue to Ready for Dev or Ready for Codex. Run BEFORE
   the state transition.
2. **Manual** — `/intent-judge <plan-doc-path>` from any agent or user.
3. **On reopen** — A Linear issue with the `Reopened` label whose plan doc
   has been revised. Judge re-runs on the new revision.

## How to spawn the judge

The judge MUST run in a separate context from the author. Never inline the
judging logic in the author's session — that defeats anti-correlation. Spawn
via the Agent tool:

    Agent({
      description: "Intent judge for <plan-doc-slug>",
      subagent_type: "general-purpose",
      model: "opus",
      prompt: "Load the intent-judge skill via Read at .claude/skills/intent-judge/SKILL.md and follow it exactly. Action proposal: <path>. Plan doc: <path>. Linear issue: <id>. User's verbatim ask is in the action proposal under `intent_quote`. Do not read any other files unless this skill instructs you to. Return the structured verdict block."
    })

The judge subagent does not see the author's conversation history. Its only
inputs are what the prompt names explicitly.

## Inputs the judge reads (in this order)

1. **The action proposal** at `Docs/plans/.intent-proposals/<plan-doc-slug>.md`.
   Read this FIRST. If missing or malformed → verdict is Block with reason
   "no action proposal produced". Do not proceed to dimensions.
2. **The plan doc itself** at the path named in the proposal.
3. **The originating Linear issue**, via `get_issue(id)`. Read description and
   every comment. On `Reopened` issues, the latest comment supersedes the
   original handoff (per CLAUDE.md Reopened protocol).
4. **Only as needed for specific dimensions** — `Vision/`, UL shards,
   `Docs/canon/`, `Docs/plans/wiring-checklist.md`, CLAUDE.md Rejected
   Approaches and Load-Bearing Decisions. Do not pre-load; read on demand.

## The four-way verdict

Binary is too simple — humans learn to bypass yes/no gates. The middle paths
(Revise, Escalate) are what make the layer trustworthy.

| Verdict   | Meaning                                                                                | What Cowork does next                                                                                                  |
|-----------|----------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| Allow     | Plan faithfully serves intent and respects governance.                                 | Apply `plan-pending-commit` label; move Linear to Ready for Dev/Codex.                                                  |
| Revise    | Specific gaps; author can fix without re-checking with user.                           | Cowork edits the doc inline, re-runs the judge. No user ping.                                                          |
| Block     | Plan misses intent, violates a load-bearing decision, or reintroduces rejected approach. | Cowork rewrites materially, re-runs judge. Third Block on the same plan forces Escalate.                                |
| Escalate  | Judgment requires the user — ambiguous intent, contested premise, or high-risk class.  | Cowork pings user with the judge's finding verbatim before any state transition.                                       |

## Impact classification (drives judge intensity)

The action proposal must declare the impact class; the judge confirms or
corrects it before scoring dimensions.

| Class       | Examples                                                                                                                  | Judge intensity                                                                                |
|-------------|---------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Read-only   | Audits, research syntheses, retros with no proposed change.                                                               | Light pass. Mostly: does the synthesis serve the user's question?                              |
| Reversible  | Content additions, prose tables, encounter templates, attachment lore, isolated component refactors.                      | Standard pass. Three-pillar + NFP check; no user gate.                                         |
| External    | Linear protocol, scheduled tasks, executor coordination, CI workflow, skill edits that change other agents' behavior.    | Strong pass. Every finding documented. Verdict block must name affected systems.               |
| High-risk   | Load-bearing decision change, new node type, CLAUDE.md edit, canon page rewrite, branch protection, NFP rewrites.         | Judge + user gate. Default verdict is **Escalate** unless the action proposal has an explicit user sign-off line. |

If the author declares a lower class than the plan warrants, the judge
corrects upward and notes it in findings.

## Judging dimensions

For each, produce: **PASS / GAP / VIOLATION** + quoted evidence.

1. **Intent fidelity** — Quote the user's verbatim ask. Quote the doc's response. Identify drift.
2. **Three-pillar coverage** — Engine, Content, UI addressed or N/A with rationale.
3. **Wiring section** — Orchestrator phase, UI render, GameState flow, traces, debug visibility, prose enrichment, player controls per `wiring-checklist.md`.
4. **NFP compliance** — 7 priorities; especially constants table, trace TypeScript interfaces, fail-soft table, inline (not appendix).
5. **Vision audit** — Contradicts/updates any Vision premise? If so, Vision edit MUST be in scope.
6. **UL terminology** — Canonical UL terms used? New terms flagged as `UL-proposal` issues? UL wins on disagreements.
7. **Rejected approaches** — Reintroduces anything in CLAUDE.md's Rejected Approaches list?
8. **Load-bearing decisions** — Violates a settled decision in CLAUDE.md's Load-Bearing Architectural Decisions?
9. **Blast radius** — If touched files include any with ≥100 importers, is there a Blast Radius section?
10. **Kill criteria** — Does the plan state how we'll know if the approach is wrong, and what we do then?

## Verdict aggregation rubric

Applied in order — first match wins:

1. **High-risk impact class with no explicit user sign-off line in action proposal** → **Escalate**.
2. **Any GAP on dimension 1 (intent fidelity)** → **Escalate**. The user needs to clarify intent before the executor starts coding.
3. **Any VIOLATION on dimensions 1, 5, 7, or 8** → **Block**. These need a fresh draft.
4. **Any VIOLATION on dimensions 2, 3, 4, 6, 9, or 10** → **Revise**. Author can fix without user input.
5. **3+ GAPs across any dimensions** → **Revise**.
6. **0–2 GAPs and no VIOLATIONs** → **Allow**.

The rubric is deterministic. Subjective judgment lives in PASS/GAP/VIOLATION
scoring per dimension, not in aggregation.

## Output format

Return one markdown block in exactly this shape:

    ## Intent Judge Verdict

    **Verdict:** <Allow | Revise | Block | Escalate>
    **Impact class (judge-confirmed):** <Read-only | Reversible | External | High-risk>
    **Plan doc:** `<path>`
    **Linear issue:** <id>
    **Latency:** <seconds>

    ### Intent quote (from action proposal)
    > <verbatim user ask>

    ### Per-dimension scores

    | # | Dimension              | Score              | Evidence (quoted) |
    |---|------------------------|--------------------|-------------------|
    | 1 | Intent fidelity        | PASS/GAP/VIOLATION | … |
    | 2 | Three-pillar coverage  | …                  | … |
    | … | …                      | …                  | … |

    ### Aggregation reasoning
    <one paragraph: which rubric rule fired and why>

    ### Required actions (if Revise or Block)
    - <specific, file-anchored>

    ### Escalation question (if Escalate)
    <one question for the user, phrased so a short answer resolves it>

    ### Metrics (judge instrumentation)
    - Findings emitted: <n>
    - Dimensions reading deep: <list>
    - Anti-correlation guard slipped: <yes/no, with reason>

## Anti-correlation

The failure mode that voids the whole pattern is judge and author sharing
context, model, prompts, or assumptions. Four rules enforce separation:

- **Different model.** Author may run on Sonnet/Haiku. Judge runs on `opus`.
  Frontier unavailable → judge declines and surfaces Escalate.
- **Cold context.** Spawned via Agent tool; sees only what the prompt names.
- **Different persona.** This skill is the persona. The judge does not draft.
- **Reversed reading order.** Author writes intent → scope → design. Judge
  reads intent quote → action proposal → plan doc.

If any rule breaks, log in metrics block. Partial verdicts are explicit.

## Metrics to track

Per judgment, aggregate per week:

- **Verdict distribution** — % Allow / Revise / Block / Escalate
- **Escalation rate** — must sit between floor (0.05) and ceiling (0.30)
- **Override rate** — % of Revise/Block verdicts user overrides
- **Time-to-judgment** — wall clock from spawn to verdict
- **Block-then-revise loops** — 3+ on same plan = Escalate

Persist to `Docs/judge-metrics/YYYY-WW.md`. `retrospective` skill consumes Fridays.

## Hard rules

- **Never edits any file.** Output is the verdict block only.
- **Never moves Linear issues.** State transitions are Cowork's job, gated on the verdict.
- **Never approves a High-risk plan without explicit user sign-off line.** Default to Escalate.
- **Never silently widens scope.** Extra coverage = GAP on dimension 1.
- **Refuses to run without an action proposal.** Missing proposal = Block.
- **Quotes verbatim.** All evidence must be quoted from source with file path. Paraphrase = GAP.
- **One verdict per run.** Multiple plans → one verdict block each, never aggregate.

## Kill criteria

Retire if any hold for a full month:

- ≥95% Allow with zero user overrides → rubber-stamping.
- ≥50% override rate on Revise/Block → judge is mostly wrong.
- Median time-to-judgment >5min → too slow.
- User reports zero catches the user wouldn't have caught → no marginal value.

Retirement: archive SKILL.md to `Docs/retired/skills/intent-judge/`, remove
auto-invocation from Cowork's plan-doc workflow.

## Procedure (for the spawned subagent)

1. Read this SKILL.md fully.
2. Read action proposal at the path the spawner gave you. Missing/malformed
   → emit Block immediately and stop.
3. Read the Linear issue: title, description, every comment. Note `Reopened`.
4. Read the plan doc named in the proposal.
5. For each dimension in order, decide PASS/GAP/VIOLATION with quoted
   evidence. Read auxiliary files (Vision, UL, canon, wiring-checklist,
   CLAUDE.md) only if the dimension demands it.
6. Apply the aggregation rubric — first match wins.
7. Emit the verdict block in exactly the specified shape.
8. Append a single line to `Docs/judge-metrics/YYYY-WW.md` with metrics.

## Relationship to design governance

This is the Audit step of CLAUDE.md's Design workflow checklist, automated.
The existing checklist already asks Cowork to self-audit against NFPs,
load-bearing decisions, and rejected approaches before presenting. The
intent-judge replaces self-audit (which is correlated with the author) with
a separate-context judge.

Other checklist steps (grill-me, draft, three-pillar check, vision audit,
present) are unchanged. The judge slots between "summarize" and "present" —
and crucially, runs again at handoff, not just at first draft.
```

---

# Appendix B — `.claude/skills/intent-judge/proposal-template.md`

```markdown
# Action Proposal Template

Authors (Cowork): copy this file to `Docs/plans/.intent-proposals/<plan-doc-slug>.md`
and fill in every field before invoking `/intent-judge` or auto-spawning the
judge. Empty or omitted fields = the judge will Block on "malformed proposal".

---

## intent_quote

> <Paste the user's verbatim ask. If you're paraphrasing, you're already wrong.
> Use the exact words from the user's message that prompted this plan doc.
> If the ask spans multiple messages, quote each separately with `>` blocks.>

## scope (what this plan does)

<One paragraph, no marketing speak. What does the plan touch, and what does it
deliberately not touch?>

## scope (what this plan does NOT do — explicit non-goals)

<Bullet list. If a user might reasonably expect a thing and it's not in scope,
say so here. The judge uses this to score dimension 1 (intent fidelity) —
absent non-goals = GAP because the judge cannot tell scope creep from intent.>

## impact_class

<One of: Read-only | Reversible | External | High-risk.
The judge will confirm or correct this. Picking too low is more dangerous
than picking too high — the judge bumps you up and notes it.>

## evidence cited

- **Linear issue:** <THR-XXX>
- **Vision premises invoked:** <file paths, e.g. `Vision/cosmology.md`>
- **UL terms touched:** <list, plus any new terms that need a `UL-proposal` issue>
- **Canon pages consulted:** <`Docs/canon/<domain>.md` files>
- **Prior plan docs this builds on:** <paths>
- **Rejected approaches considered and dismissed:** <if any — name them and why>

## load-bearing decisions touched

<List any entry from CLAUDE.md's "Load-Bearing Architectural Decisions" this
plan interacts with. Even if the plan respects the decision, list it — the
judge will check the plan's text against the decision's wording.

If a decision is being *changed*, this plan must be High-risk class with an
explicit user sign-off line below.>

## high-impact files touched (from Codesight)

<Run Codesight or grep importers for every `src/` file the plan touches.
List any with ≥100 importers here. Plan doc must have a Blast Radius section
if this list is non-empty.>

## kill criteria

<How will we know if this plan was wrong? What will we do then?
The judge scores GAP on dimension 10 if this is absent or hand-wavy.>

## explicit user sign-off

<Only required for High-risk impact class.
Paste the user's verbatim "yes, ship this" message here, with timestamp.
If you're authoring a High-risk plan without explicit sign-off, leave this
field empty — the judge will Escalate, which is the correct outcome.>

## author notes for the judge

<Anything the judge should know that the plan doc doesn't say out loud.
Tradeoffs you made, paths you considered and dropped, places where you're
uncertain. The judge reads this — it is not a "skip this" field.>
```

---

# Appendix C — `.claude/commands/intent-judge.md`

```markdown
---
description: Run the intent-judge subagent against a plan doc.
---

# /intent-judge

Manually invoke the intent-judge skill against a plan doc. Use when:

- You want to dry-run the judge before applying `plan-pending-commit`.
- A plan doc was authored outside the auto-trigger window (e.g. drafted in CC).
- A Reopened issue's revised plan doc needs re-judging.

## Usage

    /intent-judge <plan-doc-path>

Example:

    /intent-judge Docs/plans/2026-05-11-intent-judge-skill.md

## What happens

1. The command resolves the plan-doc slug from the path.
2. Confirms an action proposal exists at
   `Docs/plans/.intent-proposals/<slug>.md`. If missing, prompts the user
   to create it before invoking the judge (the judge will Block on missing
   proposals anyway; better to catch it here).
3. Spawns the judge as a `general-purpose` subagent with `model: "opus"`,
   following the spawn template in `.claude/skills/intent-judge/SKILL.md`.
4. Pastes the verdict block in chat.
5. Appends a metrics line to `Docs/judge-metrics/YYYY-WW.md`.

## What the judge does NOT do

- Edit the plan doc.
- Move the Linear issue.
- Apply or remove labels.

Acting on the verdict is the invoker's job. Cowork's plan-doc workflow handles
the standard Allow → Ready for Dev/Codex transition; for manual `/intent-judge`
runs, the human invoker decides what to do with Revise/Block/Escalate verdicts.
```

---

# Appendix D — `.agents/skills/intent-judge/` mirror

Copy `.claude/skills/intent-judge/SKILL.md` and `.claude/skills/intent-judge/proposal-template.md` verbatim into `.agents/skills/intent-judge/` to declare this as a shared skill. The THR-192 skill-sync hook will keep them in lockstep on subsequent edits.

No content changes between the two trees — `.claude/` is canonical.

---

# Appendix E — CLAUDE.md Domain Skills table edit

Add one row to the Domain Skills table (in the section that starts "Context for specific problem types lives in on-demand skills"). Insert after the `retrospective` and `design-council` rows, before the `pull-work` row, so it groups with other workflow-meta skills:

| Domain | Skill | When to load |
|--------|-------|-------------|
| Pre-handoff intent check | `intent-judge` | Before applying `plan-pending-commit` to any plan doc. Auto-spawned subagent that scores the plan against the user's verbatim ask. Returns Allow / Revise / Block / Escalate. `/intent-judge <path>` for manual runs. |

Also add a one-line callout near the design governance section. After the line `Step 0.5 - Codesight pre-flight (if change touches src/)` in the workflow checklist, add:

- [ ] **Step 8.5 - Intent-judge verdict** — after summarize and three-pillar check, before presenting. Spawn `intent-judge` as a Task subagent (`model: "opus"`). Author must first produce an action proposal at `Docs/plans/.intent-proposals/<slug>.md` (template at `.claude/skills/intent-judge/proposal-template.md`). Verdict gates the handoff: Allow → proceed; Revise → fix and re-run; Block → rewrite; Escalate → ping user with verbatim finding.
