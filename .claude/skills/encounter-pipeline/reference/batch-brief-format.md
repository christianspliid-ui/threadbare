# The batch brief — Stage 0 of the Encounter Factory

**Source:** `Docs/plans/2026-08-08-encounter-factory-workflow.md` §2 Stage 0, plus ruling 1 (batch of 6) and ruling 2 (briefs are agent-drafted, Christian-approved in chat). Shipped by THR-1047.

A brief is the one place a human steers **what gets made**. Everything downstream of it — draft, critics, gates, live proof — steers *how well*. So a brief is short enough to read in two minutes and specific enough that two different authoring runs against it produce recognisably the same batch.

## The rule that shapes the whole document

**A brief names variance, not content.** It does not describe six encounters; it describes the *spread* the six must cover — reaches, shapes, tones, settings — and lets the draft agent find the fiction inside that spread. A brief that specifies the encounters has moved the authoring into the brief, where none of the gates can see it, and the batch report's variance table then reports a variance the brief already fixed.

## Format

Copy this skeleton. Every heading is required; an empty one is a decision nobody made.

```markdown
# Batch brief — <slug> (<N> encounters)

**Drafted:** <agent, date> · **Approved:** <pending | Christian, chat, date>

## Why this batch

One paragraph: what gap in the corpus this fills, and what the player gets that
they do not get today. If this paragraph is about the pipeline rather than the
player, the batch is not ready to run.

## Family and setting envelope

- **Family:** `encounter.<family>.*`
- **Setting classes:** <the envelope classes each encounter must author an opening for>
- **Excluded:** <settings this batch deliberately does not enter, and why>

## Variance targets

| Axis | Target across the batch |
|---|---|
| Reach spread | <e.g. no reach more than twice across 6> |
| Decision shapes | <from the roster: single test / consequence chain / fork / opt-in / sequel> |
| Tone | <e.g. at most two that resolve grim> |
| Step counts | <e.g. two 1-step, three 2-step, one 3-step> |

## Systems quota targets

Contract floor is 3 (`COMPOSITION_SYSTEMS_QUOTA_MIN`). Name which systems this
batch should reach for, and which it should *avoid* leaning on so the corpus does
not converge:

- **Reach for:** <e.g. seeds, factions — under-represented today>
- **Avoid defaulting to:** <e.g. conditions — already on most of the corpus>

## Over-exposed cards

Read `cardPlayTally` telemetry and list the library cards the corpus already
leans on. New hands must diversify away from these — this is the whole reason the
brief reads telemetry rather than guessing.

| Card | Times authored | Instruction |
|---|---|---|
| `<cardId>` | <n> | avoid / at most once across the batch |

## Out of scope

What this batch is explicitly not doing, so a critic does not ask for it.
```

## How the brief is used

1. **Drafted by an agent**, from `cardPlayTally`, the corpus census, and the ticket that asked for a batch.
2. **Approved by Christian in chat** (ruling 2), in plain language, with the brief itself linked (Rule Zero). Approval is the gate — a batch does not run on an unapproved brief.
3. **Injected verbatim** into Stage 1's draft prompt, as the constraint set. The draft agent fills the spread; it does not renegotiate it.
4. **Named in the batch report** (`--brief <path>`), so a reviewer reading the report can see what the batch was *asked* for before judging what it produced.

## Where briefs live

`Docs/plans/encounters/<slug>-brief.md`, beside that batch's other pipeline artifacts. They are committed — a brief is the record of what was asked for, and a batch whose brief was never written down cannot be reviewed against its own intent.
