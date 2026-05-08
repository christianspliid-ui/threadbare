---
name: design-council
description: Orchestrate multi-agent consent-based design discussions on a shared markdown page. Agents from different perspectives (content, engine, coordination, etc.) pass the ball, propose concrete actions, and reach decisions via sociocratic consent ("good enough for now, safe enough to try"). Trigger with "/design-council", "run a council on X", "let's get multiple perspectives on this", or any ways-of-working improvement question.
last_validated_against: 2026-05-08
---

# Design Council

## Purpose

Run a deliberate, auditable multi-perspective design discussion with consent-based decision-making. The council produces written decisions — not just discussion — that are ready to feed into Linear issues, Docs/plans/ design docs, or CLAUDE.md updates.

Counterparts in the existing toolkit:

- `retrospective` — analyses past friction from `Docs/impediments.md`. Backward-looking.
- `design-council` (this) — deliberates prospective changes with multiple perspectives and consent. Forward-looking.
- Both feed the same improvement loop.

## When to Use

Good fit:

- **Ways-of-working improvement** — "how do we change our workflow / tooling / process?"
- **Cross-pillar design questions** — features that touch engine, content, and UI and you want sharp perspectives from each before drafting a plan.
- **Decisions that commit the project to a direction** — architectural shifts, pipeline changes, tooling migrations.
- **State-of-the-product questions** — "what should we prepare before the next content push?"

Not a fit (skip the council, just do the work):

- Single-pillar, mechanical work with a known answer.
- Implementation detail within an already-decided plan.
- A clear yes/no the user has already given.
- Anything where the same decision would be reached by one informed agent.

## Core Concepts

### The page is the memory

Subagents are stateless. The council works because a **single markdown file** is the shared state. Every agent reads the full page at the start of its turn and writes its contribution under a designated section. The orchestrator (you, Cowork) never lets two agents write simultaneously — serial writes, no races.

Council pages live at `Docs/design-councils/YYYY-MM-DD-<topic-slug>.md`.

### Turn-taking, not free-for-all

Turns are explicit. Every turn ends with **"Pass to &lt;agent&gt;"** or **"Pass to open floor."** The orchestrator picks the next speaker based on the pass. Round 1 is parallel (each perspective speaks independently); Round 2+ is sequential (each turn responds to a prior claim).

### Consent, not consensus

Decisions are made by sociocratic consent. A proposal is accepted when every agent says `CONSENT`. An agent may `OBJECT` only with a **paramount objection** — a concrete, reasoned harm. Preference alone is not objection. The consent test has two parts:

1. **Good enough for now** — solves the problem sufficiently *at this moment*; revisable later.
2. **Safe enough to try** — if wrong, cost is recoverable; not an irreversible commit.

An objection must cite which half fails. Seeking the optimum is perfectionism, not consent.

## Protocol

### Phase 0 — Setup

1. Pick the question. Must be specific enough to bound the discussion (not "how do we make the game better"; yes "what primary improvements make the product easier to change and expand").
2. Pick 2–4 perspectives. Typical frames:
   - **Content iteration** (authoring pipelines, prose, encounter/attachment speed)
   - **Engine / architecture** (change-amplification in code, coupling, testing)
   - **Coordination / process** (Cowork ↔ CC ↔ Codex, Linear discipline, review)
   - **Game-feel / player experience** (when the question touches design direction)
   - **State-of-the-product** (Linear, backlog, roadmap, release readiness)
3. Create the council page using the template at the bottom of this SKILL.
4. Fill in the Context section (link to relevant Docs/plans, vault pages, Linear issues).
5. Set `Next speaker: all (Round 1 parallel)` in the running state.

### Phase 1 — Round 1 (parallel independent perspectives)

Spawn one subagent per perspective **in a single message** (parallel Agent calls). Each gets:

- The question.
- Their assigned perspective (one sentence frame).
- Pointers to 2–4 files they should read as context (NOT the whole codebase).
- Output contract: 250–400 words, plain prose with 2–3 concrete pain points and candidate improvements, ending with `Pass to open floor`.

**Do not** ask Round 1 agents to consense or respond to each other — the page is empty, they have nothing to respond to. They're opening the record.

When all three return, paste each output under its section on the page. Update running state.

### Phase 2 — Round 2+ (sequential pass-the-ball)

Identify 1–2 sharpest tensions OR strongest convergences from Round 1. For each, pick the most relevant agent and spawn them with:

- The full council page (or the page path for them to read).
- Which prior claim they are being asked to respond to (quote it).
- Instruction to end with `Pass to &lt;name&gt;` or `Pass to open floor` or `PROPOSAL: &lt;text&gt;. Requesting consent round.`

Repeat until one of the termination conditions fires.

### Phase 3 — Consent round (on any concrete proposal)

When a proposal is posted, pause the discussion and run the consent sequence. Each sub-phase is a separate orchestrator call so agents do not mix phases in one turn.

1. **Clarifying questions.** Each agent, in order, asks *one* question or says "no questions." Proposer answers inline.
2. **Quick reactions.** Each agent writes a gut-level response — support, concern, suggested amendment. Not yet consent.
3. **Amend.** Proposer revises or withdraws. Written to the page.
4. **Consent.** Each agent writes *exactly* one of:
   - `CONSENT`
   - `OBJECT: &lt;which half of the test fails, concrete reason&gt;` (good-enough-for-now OR safe-enough-to-try)
5. **Integration.** If any objection, proposer + objectors revise to address the objection. Re-run consent. Maximum 2 integration loops, then escalate.
6. **Decide.** All consent → log as `DEC-N` in the Decisions section at the top of the page.

### Phase 4 — Synthesis

When the discussion terminates (see below), write the **Synthesis** section:

- Decisions made (with DEC-N references).
- Accepted proposals with concrete next actions.
- Open questions escalated to the user.
- Suggested follow-up Linear issues (one-line summaries, assignable later).

## Role Prompts

Each subagent spawn must include these elements. Keep them tight — verbose prompts dilute the perspective.

### Common elements

```
You are participating in a design council.

The question: <quoted question>

Your perspective: <one sentence frame>

The council page is at: <absolute path>

Rules:
- Read the page in full before writing.
- You speak only for your perspective. Do not speculate from other pillars.
- Objections must be paramount: cite which half of the consent test fails.
  * "good enough for now" = solves the problem sufficiently now
  * "safe enough to try" = recoverable if wrong
- Preference alone is not an objection.
- End your turn with "Pass to <agent>" or "Pass to open floor"
  or "PROPOSAL: <text>. Requesting consent round."
- Output length: <200-400 words per turn>.
```

### Content iteration perspective

Framing: "You are the agent that writes and iterates content day to day — encounters, attachments, prose, vignettes. Your job is to notice friction in the iteration feedback loop and advocate for authoring speed without sacrificing quality."

Context files to read: `Docs/plans/2026-04-16-systemic-wiring-guide.md`, `.agents/skills/encounter-pipeline/SKILL.md`, `.agents/skills/prose-content-systems/SKILL.md`, `.agents/skills/attachment-pipeline/SKILL.md`.

### Engine / architecture perspective

Framing: "You are the agent that reasons about change-amplification in code. Small changes that force edits across many files are expensive; coupling that blocks refactoring is debt. Your job is to notice where the codebase resists change and advocate for structural improvements."

Context files: `CLAUDE.md`, `.agents/skills/engine-architecture/SKILL.md`, `.agents/skills/testing-patterns/SKILL.md`, `Docs/plans/wiring-checklist.md`.

### Coordination / process perspective

Framing: "You are the agent that watches the Cowork → CC → Codex pipeline end to end. Your job is to notice handoff friction, Linear discipline gaps, review overhead, and protocol bugs — anything that slows the journey from 'idea' to 'merged PR'."

Context files: `Docs/plans/2026-04-13-linear-coordination-protocol.md`, `Docs/plans/2026-04-19-cc-review-replacement.md`, `Docs/impediments.md` (recent entries), most recent file in `Docs/retrospectives/`.

### State-of-the-product perspective (for readiness questions)

Framing: "You are the agent that knows what is shipped, what is partly shipped, and what is planned. Your job is to assess current state against upcoming work demands and surface preparation gaps."

Context files: `Docs/project-status.md`, Linear projects (via MCP), recent `Docs/retrospectives/`, and `.planning/ROADMAP.md`.

## Termination Rules

The council ends when any of these fires:

1. **Converged** — all agents write "nothing to add, pass" in the same round. Go to Synthesis.
2. **Decided** — a proposal reached consent and the remaining discussion would be follow-ups. Log decision, go to Synthesis.
3. **Budget** — 12 total turns across all rounds. Force Synthesis and log remaining tensions as open questions.
4. **Escalation** — a paramount objection survives the integration cap (2 loops). Log to Synthesis with the unresolved objection named, hand up to user.

## Valid Objection Reference

These are the only kinds of objection that count as paramount. Agents must cite one in any `OBJECT:` line.

| Objection type | "Not good enough for now" or "Not safe enough to try" | Example |
|----------------|-------------------------------------------------------|---------|
| NFP violation | either | "Violates NFP #1 — proposes untunable hardcoded value" |
| Architectural decision conflict | either | "Conflicts with 'everything is a graph node/edge' — proposes property-bag relationship" |
| Rejected-approach collision | either | "Reintroduces classical stats which the project has already rejected" |
| Unaddressed failure mode | safe enough to try | "Tick loop can crash if X is missing; proposal has no fallback" |
| Missing pillar coverage | good enough for now | "No UI component proposed — engine-only change is invisible to the player" |
| Irreversibility without rollback | safe enough to try | "Migration drops data with no reversal path" |

These are NOT paramount objections:

- "I would prefer a different approach."
- "This could be more elegant."
- "I would have solved it differently."

## Page Template

```markdown
# Council: <question title>
**Date:** YYYY-MM-DD
**Status:** open | decided | escalated
**Question:** <full question as asked by user>

## Context
<background, links to relevant docs / vault / Linear issues>

## Rules
- Read the full page before writing.
- Turns end with "Pass to X" or "Pass to open floor" or "PROPOSAL: ...".
- Objections must cite "good enough for now" or "safe enough to try" failure.
- Preference alone is not objection.

## Running state
- **Open questions:** (list as they emerge)
- **Active proposal:** none | PROP-N (status)
- **Next speaker:** all (Round 1 parallel) | <name> | open floor
- **Turns used:** 0 / 12

## Decisions
<empty until first decision; then DEC-1, DEC-2, ... with brief summary>

## Round 1 — independent perspectives
### <perspective A name>
(to be filled)

### <perspective B name>
(to be filled)

### <perspective C name>
(to be filled)

## Round 2 — responses
### Turn N — <agent>, responding to <what>
(to be filled)

## Consent rounds
### PROP-1: <proposal text>
**Proposer:** <agent>
**Status:** clarifying | reacting | amending | consenting | integrating | decided

- **Clarifications:**
- **Reactions:**
- **Amendments:**
- **Consent:**
  - agent A:
  - agent B:
  - agent C:

## Synthesis
(filled at end — decisions, accepted proposals, open questions, follow-up issues)
```

## Output Handling

Decisions made in council should become one or more of:

- A new **Linear issue** in the appropriate project (Cowork moves to Implementation Planning or Ready for Dev per the usual protocol).
- A **CLAUDE.md update** if the decision is a load-bearing rule.
- A **Docs/plans/YYYY-MM-DD-*.md** entry if the decision needs a full implementation plan.
- A **memory entry** if the decision is a working-style preference for future sessions.

Log every council — even inconclusive ones — in `Docs/design-councils/` so the record is preserved and the pattern is visible across sessions.

## Anti-patterns

- **Running a council on an already-answered question.** Wastes cycles. Ask yourself: does multiple-perspective deliberation change the answer? If no, skip the council.
- **Letting a perspective speak outside its frame.** The content agent should not opine on architecture; that defeats the structural clarity the perspectives provide. Orchestrator enforces by only spawning each agent with its framed prompt.
- **Consent without the two-part test.** Agents will default to "sure, fine" if you let them. The phase prompt must explicitly require evaluation against both halves.
- **Skipping the integration loop when an objection lands.** Objections carry information; integration responds to it. Dropping a proposal without integration attempt is a waste of the objection.
- **Writing the synthesis before the council terminates.** Decisions need to be earned in the record; retrofitting them undermines the audit trail.
