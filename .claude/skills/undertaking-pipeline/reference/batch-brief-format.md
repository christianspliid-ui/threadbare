# The batch brief — Stage 0 of the undertaking factory

**Source:** `Docs/plans/2026-09-02-thr-1300-undertaking-factory.md` § Stage 0, mirroring the encounter line's `reference/batch-brief-format.md` (THR-1047) and its two rulings: a batch is six, and briefs are agent-drafted, Christian-approved in chat.

A brief is the one place a human steers **what gets made**. Everything downstream — draft, critics, the gate, live proof, the compiler — steers *how well*. So a brief is short enough to read in two minutes and specific enough that two authoring runs against it produce recognisably the same batch.

## The rule that shapes the whole document

**An undertaking brief names variance across the grid, not content.** The encounter brief names variance across reaches, shapes and settings; this one names which **kind rows** and which **C / U / D cells** the six templates fill, because the kind × CRUD grid is what the substrate is shaped as (`reference/kind-row-catalog.generated.md`). A brief that fills only C cells is a brief for works nobody can take back and is rejected on sight — the grammar's own rule (*until a kind can be undone it is not a kind*) applied at planning time.

**Game design first — all of it.** Every slot's mechanical fix is written before any premise (director ruling 2026-08-24, recorded in the encounter spec § Authoring order). The prose is written *inside* the mechanics; a brief whose fiction came first is rejected on sight.

## Format

Copy this skeleton. Every heading is required; an empty one is a decision nobody made.

```markdown
# Batch brief — <slug> (6 undertakings)

**Drafted:** <agent, date> · **Approved:** <pending | Christian, chat, date>

## Why this batch

One paragraph about the *player*: what a followed mortal can now do or suffer
that they could not before. If this paragraph is about the pipeline rather than
the player, the batch is not ready to run.

## Grid cells

| kind | C | U | D |
|---|---|---|---|
| <kindId> | <slot n> | | <slot m> |
| … | | | |

Six slots placed. Gap-weighted toward empty cells — read the generated catalog
first; today `sublocation` D and `faction` D are empty, which is why those two
rows are not registered. At least two D cells per batch while THR-1388's
zero stands (the factory adds harm supply; THR-1388 decides whether to retune).

## Variance targets

- **Tier spread:** no tier more than three of six.
- **Reach spread:** no reach more than twice as primary.
- **Families:** no behavior family more than twice.
- **Target subtypes:** no subtype more than twice.
- **Harm classes:** ≥ 2 harm-capable templates (`verb: 'destroy'` with a `harmClass`).
- **Motivations:** no value pair more than three times across six.
- **Cast:** ≥ 3 templates declare a `must-persist` slot with an `identityRequirement`.
- **Remote:** ≤ 1.

## The mechanical fix, before any premise

One block per slot, every field decided:

- slot 1 — `<templateId>` · `verb` · `executionMode` · `tier` (from the row) ·
  `checkpointDifficulty` (inside the tier band) · `projectDuration` ·
  `payoffValue` (inside the tier band) · `motivations` · `targetRule` ·
  `requiresLocation` · `canRunBeside` · `remote` · `cast` slots · `creationEffects`
  per band · `mutationHint` or the kind's object · `motiveGate` + `harmClass` (destroys)
- slot 2 — …

## Anchors the batch touches

Which existing economies the works enter — Secrets & Favors, clues, trade,
holdings, the reactive loop — so the package critic has something to judge.

## Out of scope

What this batch deliberately does not attempt, and why.
```

## Approval

Agent-drafted, **Christian-approved in chat before the batch runs** — the one HITL gate on the line. Present it per THR-608: the grid table, the six mechanical fixes in one line each, two links (the brief, the catalog), one yes/no question. A brief he has not approved is a suggestion, not a batch.
