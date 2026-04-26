# Design Councils

Design councils are multi-agent deliberations on design questions — usually ways-of-working or cross-pillar decisions. Each council lives as one markdown file here and is the durable record of the discussion, decisions made, and open questions escalated.

## How it works

A council is orchestrated by Cowork (or CC) using the `design-council` skill at `.agents/skills/design-council/SKILL.md`. The skill contains the full protocol; the short version:

1. **Setup** — pick the question, pick 2–4 perspectives (content, engine, coordination, etc.), create a council page here.
2. **Round 1** — parallel subagents open the record with independent perspectives.
3. **Round 2+** — sequential pass-the-ball, responding to specific prior claims.
4. **Consent round** — when a concrete proposal is on the table, run the full sociocratic sequence (clarifying → reactions → amend → consent → integrate). Consent uses the two-part test: *good enough for now, safe enough to try*.
5. **Synthesis** — decisions, accepted proposals, open questions for the user, follow-up Linear issues.

## How to start one

Invoke the skill from Cowork:

```
run a design council on <question>
```

Or implicitly by triggering phrases ("let's get multiple perspectives on X", "how do we improve our workflow on Y", etc.).

## File naming

`YYYY-MM-DD-<topic-slug>.md` — e.g. `2026-04-22-workflow-easier-to-change.md`.

## Status values at top of page

- **open** — discussion in progress
- **decided** — at least one decision reached; may still have open follow-ups
- **escalated** — an irreducible objection was raised; user input needed

## Relationship to other surfaces

- Councils are **prospective** — they deliberate changes before they're made.
- `Docs/retrospectives/` is **retrospective** — it processes past friction from `Docs/impediments.md`.
- Together, the two surfaces form the continuous-improvement loop: retros surface friction, councils decide how to address it.

## What counts as a council-worthy question

Good:
- Ways-of-working / process / tooling changes
- Cross-pillar design questions (engine + content + UI) needing sharp per-pillar perspectives
- Architectural shifts that commit the project to a direction
- State-of-the-product readiness assessments

Not good (skip the council, just do the work):
- Single-pillar, mechanical work
- Implementation detail within a decided plan
- A clear yes/no the user has already given
- Anything one informed agent would reach the same answer on
