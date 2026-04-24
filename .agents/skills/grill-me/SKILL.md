---
name: grill-me
description: >
  Adversarial design-concept extraction pre-pass. Auto-invokes on non-trivial
  or ambiguous work, asks permission before running, and produces a synthesis
  artifact that feeds plan-doc drafting. Conversational by default, async-batch
  on request.
---

# Grill Me

## Purpose

Use this skill to challenge assumptions before drafting non-trivial plans.
Default behavior is to ask more, not less, and force grey zones into the open.

The user decides verdicts. The agent recommends and interrogates.

## Constants

Keep these values explicit and tuneable:

- `GRILL_ME_MIN_QUESTIONS = 8`
- `GRILL_ME_DEFAULT_QUESTIONS = 27`
- `GRILL_ME_MAX_QUESTIONS = 50`

Question budget rule:

- Small scope: target 8-12 questions
- Medium scope: target around 27 questions
- Large scope: target up to 40 questions
- Hard ceiling: 50 questions; above this, split scope before continuing

## Invocation Triggers

All triggers are active:

1. User explicitly asks (`/grill-me`, "grill me", similar)
2. Estimated implementation effort is greater than one executor day
3. Work touches more than one pillar (Engine, Content, UI)
4. Request has high ambiguity or dense grey zones

Behavior by trigger type:

- Explicit trigger: run immediately
- Auto trigger (2-4): ask permission first

Auto-invoke prompt pattern:

`This looks non-trivial and likely has hidden assumptions. Want a grill-me pass before drafting?`

If user declines, skip without friction and continue normal workflow.

## Modes

### Conversational (default)

- Ask one question at a time in chat
- Allow user to interrupt, park, or switch modes at any point
- Support mid-session switch to async mode without restarting

### Async-batch (on request)

- Trigger phrases: "grill me async", "batch grill", or equivalent
- Produce a checklist document in:
  `Docs/plans/YYYY-MM-DD-<topic>-grill-me.md`
- Use the structure from `Docs/plans/2026-04-24-codebase-health-grill-me.md`
- Keep grouped sections and inline answer slots

Both modes end with the same synthesis artifact.

## Question Design Rules

1. Prioritize unknowns and tradeoffs over obvious structure
2. Skip inferable questions when adjacent answers already imply the answer
3. Err on the side of more questions
4. Mark strong recommendations with `⚡`
5. Ask for "why not" alternatives, not only preferred paths

Use `⚡` only when you have a real lean and want pushback.

## "I Don't Know" Handling

Track each question with an attempt counter.

First `I don't know` on a question:

- Park the question
- Continue with questions that can unlock context
- Loop back later in the same session

Second `I don't know` on the revisited question:

- Mark unresolved as a grey zone in synthesis
- Do not retry again in the same session
- Continue without stalling

## Synthesis Artifact

Write synthesis to:

`Docs/plans/YYYY-MM-DD-<topic>-grill-me.md`

Minimum sections:

1. Scope under interrogation
2. Confirmed decisions
3. Agent recommendations (`⚡` items)
4. Parked-then-resolved questions
5. Unresolved grey zones (including second-pass "I don't know")
6. Open risks and assumptions
7. Inputs for the upcoming design doc

This file is an input artifact for plan-doc drafting.

## Procedure

1. Evaluate invocation triggers
2. If auto-triggered, ask permission before grilling
3. Choose mode (default conversational, async on request)
4. Run interrogation using question design rules
5. Handle parked questions and revisit once
6. Generate synthesis artifact in `Docs/plans/`
7. Continue to design workflow step 1 using the synthesis as input

## Relationship to Design Governance

Grill-me is checklist step 0 for non-trivial work.
It does not replace the existing checklist.
It can also be invoked mid-work when new uncertainty appears.
