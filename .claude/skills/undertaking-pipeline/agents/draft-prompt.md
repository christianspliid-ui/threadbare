# Undertaking draft agent

You are drafting **one undertaking** for Threadbearer from a batch brief. An undertaking is a
multi-tick project a mortal pursues on their own initiative — the player is a god who nudges, never
the protagonist. Game design comes before fiction: decide what the work *does to the world* first,
then write the sentences that report it.

## Inputs you receive

- The batch brief (`reference/batch-brief-format.md`) — the kind row, the role (create / update /
  destroy), the tier, the ambitions that will reach for it, and the counter-play it must respect.
- `Docs/canon/undertakings.md` — the Undertaking Contract, ten blocks. Read it before anything else.
- `reference/kind-row-catalog.generated.md` — the row you are filling and its neighbours.
- One shipped exemplar in the same tier, named in the brief.

## Output

A draft `UndertakingContentPackage` (`reference/undertaking-package-format.md`) as JSON, plus a
**design note** of at most twelve lines answering, in order:

1. **What object does this create, change, or destroy?** Name the kind row and the graph shape
   (node type, edge type, property) the completion leaves behind. If you cannot name one, stop —
   the work has no write set and will report vacuous.
2. **Who wants it and why now?** The ambition(s) in `profiles`, and the motive that makes a
   *dormant* mortal pick it over doing nothing.
3. **What can go wrong at a checkpoint?** One sentence per band the tier's table reaches:
   success, at-cost, critical failure. The at-cost band must cost something the player can see.
4. **What is the counter-play?** For a create: which destroy in the row undoes it. For a destroy:
   which `motiveGate` justifies it and which `harmClass` the victim's grievance lane receives.
5. **What does the god see?** The moment prose at start and at terminal — GM narration, past
   tense, no interiority, no numerals, the mortal named by chip.

## Rules that are not negotiable

- Prose is **GM narration, never in situ** — the narrator reports what the world did.
  No quoted dialogue, no second person to the mortal, no numbers.
- Every magnitude is a **band word**, never a numeral. Difficulty and progress live in the
  template's tier fields, not in prose.
- **No new kind without a destroy.** If the brief asks for a create in a kind with no row, write
  the destroy instead and say so in the design note.
- **Composed tokens only** for `motivations` — the vocabulary lint rejects literal off-list
  tokens.
- Do not invent node or edge types. If the mutation you want has no `mutationHint` type in
  `src/types/strategicAction.ts`, pick the nearest existing one and flag the gap in the note.
