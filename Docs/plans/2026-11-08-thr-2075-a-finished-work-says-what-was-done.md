> **title:** A finished work says what was done, not that something stands — THR-2075
> **linear_issue:** THR-2075
> **author:** Claude Code (tb-design-lane, run dl-20261107T2318Z)
> **created:** 2026-11-08
> **three_pillars:** Engine done (the card's view model picks the line) · Content done (one named fallback line; the per-cell lines already exist) · UI done (no component change; `MomentCard` renders the fixed model)

# A finished work says what was done, not that something stands — THR-2075

*When a mortal finishes a work that made nothing, the "A Work Finished" card says what they actually did.*

## Why this is load-bearing

The completion card has one consequence line for every undertaking: *"It stands in the world now. Whoever it
was aimed at will remember whose work it was."* That is true for a work that builds something. It is false for
a relic taken up, an item seized, a power destroyed, a place surveyed or a thing used up. Seen in the browser
(ticket description): *"Kael Thornweaver has completed The Hollow Bell. It stands in the world now."* Kael
picked the bell up. He did not make it.

That breaks UI Laws 17 and 21 (the words say what happened) and Law 56 (a line is backed by the write), and is
complaint class PC-6, one fact told two ways (the ticket cites PC-4, which is "the game acts for the player
without saying so" and does not fit). It is a bug, so it is agreed (ways-of-working D2). The orchestrator staged it
2026-11-07 ~21:30Z.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Card content (`src/data/moment-card-content.ts`) | 🟢 ACTIVE | **extends** — one named fallback line |
| Card view model (`src/engine/views/stage/momentCardModel.ts`, `buildMomentCardModel`) | 🟢 ACTIVE | **extends** — picks the consequence for a completion |
| Cell completion prose (`cellCompletionProse`, `src/engine/undertakingProse.ts:287`) | 🟢 ACTIVE | unchanged — already writes the line onto the moment |
| Lifecycle (`src/engine/strategicActionLifecycle.ts:1228-1235`) | 🟢 ACTIVE | unchanged |
| `MomentCard` (`src/components/Game/MomentCard.tsx:268-277`) | 🟢 ACTIVE | unchanged — renders `model.consequence` |

### Measured — the line already reaches the moment

On `origin/main` `04ab1fb2`, `strategicActionLifecycle.ts` builds the completion moment like this:

```
1228:      const completionMessage = completedCell?.cellVariant && project.objectTypeId
1229:        ? cellCompletionProse(graph, project, completedCell.cellVariant, outcomeOp && {
1230:          line: outcomeOp.completionLine, objectId: outcomeOp.proseObjectId, ownerId: outcomeOp.proseOwnerId,
1231:        }).text
1232:        : `${actorNode?.name ?? project.actorId} completes: ${finishedName}`;
1233:      if (completionMoment) {
1234:        moments.push({ ...completionMoment, label: completionMessage, undertakingName: finishedName });
```

So every cell completion record already carries its cell's resolved line in `record.label`, including
THR-1937's outcome lines (claim × Item's echo line, `undertaking-verb-prose.ts:653`: *"{Actor} takes up
{object}, left by a god of the last age, and carries it out of {place}."*). A non-cell (legacy pack) work
carries `"<name> completes: <work>"`, which is a log line, not card prose.

### Measured — the card ignores it

`buildMomentCardModel` (`momentCardModel.ts:233-279`) sets
`consequence: renderMomentLine(template.consequence, vars)` from `MOMENT_CARD_CONTENT.completion` for every
completion. `record.label` is never read there. (The moment badge already reads it: `momentBadgeModel.ts:135`
uses `primary.label` as the tooltip text.)

## Decision

**The card's consequence for a finished cell work is that cell's own line, except for `create`.** In
`buildMomentCardModel`, when `record.momentClass === 'completion'`:

1. Look the cell up: `getCellTemplate(record.templateId)?.cellVariant` (`src/data/undertaking-cells.ts:387`).
   Only cells carry `cellVariant` (`undertaking-cells.ts:339` is its one writer; no file under
   `src/data/strategic-packs/` sets it), so this is exact, and it avoids importing the heavy candidates module.
2. Variant is `create`, or the work is not a cell → keep today's line, *"It stands in the world now…"*. It was
   written for works that make something, and it is true for them.
3. Any other variant (`change:raise`, `change:lower`, `use`, `control:claim`, `control:seize`, `destroy`,
   `observe`) → `record.label`, trimmed.
4. That label is empty, or is the lifecycle's log form `"<name> completes: <work>"` → 
   `MOMENT_COMPLETION_UNMADE_CONSEQUENCE`, a verb-neutral line that claims nothing was built.

The opening line (*"{actor} has completed {undertaking}."*) and the title stay as they are.

Rejected: a new verb-keyed consequence table on the card. It would duplicate 30+ authored completion lines
that are already resolved per cell (systems-inventory: extend before green-field). Rejected: writing a
`cellVerb` field onto the moment record in the engine. The template lookup at view time is pure and needs no
schema change.

## Engine pillar

### Systems design

1. `src/engine/views/stage/momentCardModel.ts` — import `getCellTemplate` from
   `../../../data/undertaking-cells`, and `MOMENT_COMPLETION_UNMADE_CONSEQUENCE` and `MOMENT_LOG_COMPLETION_MARKER`
   from the card content. Add:
   ```ts
   /** THR-2075 — a finished work that made nothing says what was done, in its own cell's words. */
   export function completionConsequence(record: UndertakingMomentRecord, fallback: string): string {
     const variant = getCellTemplate(record.templateId)?.cellVariant;
     if (!variant || variant === 'create') return fallback;
     const own = record.label?.trim();
     // The lifecycle writes the log form "<name> completes: <work>" when a cell has no
     // objectTypeId (strategicActionLifecycle.ts:1228-1232) — never card prose.
     if (!own || own.includes(MOMENT_LOG_COMPLETION_MARKER)) return MOMENT_COMPLETION_UNMADE_CONSEQUENCE;
     return own;
   }
   ```
   In `buildMomentCardModel`, compute the rendered consequence as today, then for
   `record.momentClass === 'completion'` pass it through `completionConsequence(record, rendered)`.
2. No other engine file changes.

### Graph nodes / edges, tick phases, resolution, PRNG

None. The view model is read-only. `record.label` was picked deterministically at write time
(`pickUndertakingLine` keyed on `${projectId}:completion`), so the card shows the same line every time.

## Content pillar

One new line in `src/data/moment-card-content.ts`, beside `MOMENT_CARD_CONTENT`:

```ts
/** THR-2075 — the finished-work fallback when a cell that made nothing has no line of its own. */
export const MOMENT_COMPLETION_UNMADE_CONSEQUENCE = 'The work is done. Whoever it was aimed at will remember whose work it was.';
```

Register: plain narrator, no numerals, no second person (`Docs/canon/prose.md` § Narrator mode). It keeps the
second sentence of today's line, which is true for every verb, and drops the false first one. No per-cell prose
is authored; the cell lines already exist in `undertaking-verb-prose.ts`.

## UI pillar

No component change. `MomentCard.tsx:268-277` renders `model.consequence` in
`data-testid="moment-card-consequence"`.

### Player-facing text

The Hollow Bell, after `__DEBUG.startUndertaking('@first','cell.control_claim.item',{band:'success'})` on
`?view=game&seeded&size=medium`:

- Before: *"Kael Thornweaver has completed The Hollow Bell."* / *"It stands in the world now. Whoever it was
  aimed at will remember whose work it was."*
- After: *"Kael Thornweaver has completed The Hollow Bell."* / *"Kael Thornweaver takes up The Hollow Bell,
  left by a god of the last age, and carries it out of <place>."* (the echo line, resolved).
- A `create` cell (for example raising a storehouse): unchanged, *"It stands in the world now…"*.
- A non-create cell whose label is empty or the log form: *"The work is done. Whoever it was aimed at will
  remember whose work it was."*

| Surface | Complaint class | What the player now reads |
|---|---|---|
| "A Work Finished" card, consequence line | PC-6 (the chronicle line and the badge tooltip already show the cell's line; the card said something else) | the same words as the chronicle line: what the mortal did — took up, seized, broke, learned, used, bettered or wore down the thing — never that a made thing stands |

### UI Laws engaged

Laws 17 and 21 (the words say what happened: the fix), Law 56 (the line is the one the lifecycle wrote with the
ops), Law 13/14 (no numerals, no keys: the cell lines are already resolved and token-scrubbed,
`undertakingProse.ts:236`). Laws 1, 33 and 37 are untouched (no layout, type or colour change). The consequence
line may now run longer than before. The card's consequence block already wraps prose, so this changes no box.
Browser-verify tool: Playwright DOM read of `[data-testid="moment-card-consequence"]`.

### Playtest signal

On any "A Work Finished" card whose work was not a `create` cell, the consequence text does not start with
*"It stands in the world now"*. A cold tester's DOM snapshot can confirm or refute it.

### Event notifications / Visual presence (HexMapV2) / Debug inspection

None / none / none new. The chronicle line and the badge tooltip already show `record.label`.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

- Orchestrator phase: none (view-time only).
- UI component: `MomentCard` via the Stage host, unchanged.
- GameState flow: reads `state.strategicState` records as today; no new state.
- Traces / prose pipeline / player controls: none.
- Debug visibility: the model's `consequence` and `record.label` are both plain fields; which branch fired is
  re-derivable from `record.templateId` (a unit test pins each branch). No trace, deliberately: this is a view string.
- Prerequisite health: the writer is live on every cell completion (Substrate inventory, measured).

## Interface impact

| Contract | Change |
|---|---|
| Lifecycle → moment record `label` | **preserve**, now also read by the card model (already read by the badge and chronicle) |
| Cell registry → `views/stage` (new import of `getCellTemplate`) | **add**, a read-only lookup |
| Card model `consequence` → `MomentCard` | **preserve**, same field and type |

No cross-system write. `Docs/canon/interface-map.md` needs a row only if `check:interface-contracts` asks for
the new import.

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| `MOMENT_COMPLETION_UNMADE_CONSEQUENCE` | see Content pillar | finished-work fallback for a non-create cell with no line | `moment-card-content.ts` |
| `MOMENT_LOG_COMPLETION_MARKER` | `' completes: '` | recognises the lifecycle's log-form label, which must never reach the card (the lifecycle's literal is left as it is) | `moment-card-content.ts` |

## Tracing

N/A — a view-model string read at card open; nothing in the tick changes, so no trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `record.templateId` resolves to no template | today's line (treated as non-cell) |
| Template has no `cellVariant` (legacy pack) | today's line |
| Non-create cell, `record.label` empty or whitespace | `MOMENT_COMPLETION_UNMADE_CONSEQUENCE` |
| `record.label` is the log form `"… completes: …"` on a cell (lifecycle line 1228 needs both `cellVariant` and `objectTypeId`; `objectTypeId` is optional) | `MOMENT_COMPLETION_UNMADE_CONSEQUENCE` |

## Done when

- [ ] `completionConsequence` is exported from `momentCardModel.ts`, and `MOMENT_COMPLETION_UNMADE_CONSEQUENCE` and `MOMENT_LOG_COMPLETION_MARKER` from `moment-card-content.ts`. `buildMomentCardModel` routes completion records through it.
- [ ] Unit tests in `src/components/Game/__tests__/momentCardModel.test.ts`: a `cell.control_claim.item` completion whose label is the echo line → `consequence` equals that line. A `create` cell completion → `consequence` equals today's line. A non-create cell with an empty label → the fallback. A non-create cell whose label is `"Kael completes: The Hollow Bell"` → the fallback. An unknown template id → today's line.
- [ ] jsdom render test in `src/components/Game/__tests__/MomentCard.test.tsx`: the `claim × Item` card shows the echo line in `moment-card-consequence` and no *"It stands in the world now"*. A `create` cell card is unchanged.
- [ ] `npm run gate` green (code track) and the 30-tick CLI smoke (an engine file is touched).
- [ ] One 1920×1080 screenshot of the Hollow Bell card from § Player-facing text, plus the DOM text of `[data-testid="moment-card-consequence"]` quoted in the commit (small visible fix, ≤400 UI lines).
- [ ] The closing commit and PR body carry the line-anchored closer for this ticket.

## Kill criteria

- `getCellTemplate` imported into `views/stage` closes an import cycle → put the variant on the record at
  write time instead (additive optional `cellVariant` field on `UndertakingMomentRecord`, set beside `label` at
  `strategicActionLifecycle.ts:1234`), and read that.
- The seeded world's First cannot start `cell.control_claim.item` → use any non-create cell the debug lever
  accepts and name it in the commit.

## Coordination block

**Suggested model:** sonnet. One helper, one constant, tests. The shape is fully specified.

**Parallel-safe with:** THR-2189 (lean/draw code, different files).

**Mutex with:** any ticket editing `src/engine/views/stage/momentCardModel.ts` or
`src/data/moment-card-content.ts`. None is open today.

**Files to touch:**
- Edit: `src/engine/views/stage/momentCardModel.ts`
- Edit: `src/data/moment-card-content.ts`
- Edit: `src/components/Game/__tests__/momentCardModel.test.ts`
- Edit: `src/components/Game/__tests__/MomentCard.test.tsx`

## Notes for the executor

- `src/engine/` is touched, so the `review-gate` skill runs before auto-merge and the 30-tick smoke is owed.
- Do not edit the opening line or the per-cell prose. Do not change the lifecycle.
- Line numbers above are from `origin/main` `04ab1fb2`.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (one fallback line, rationale for no per-cell authoring)
- [x] UI pillar present (no component change, surface named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. The god reads what the mortal really did.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-08-thr-2075-a-finished-work-says-what-was-done-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | the fallback is a named constant; the cell lines live in their table |
| 2. Inspectability | PASS | `consequence` is a plain field on the model, unit-tested; same text as the chronicle line |
| 3. Determinism | PASS | the line was picked by a seeded key at write time; the view only reads |
| 4. Fail-soft | PASS | every lookup miss falls back to a line; no throw |
| 5. Narrative over mechanics | PASS | the card tells what happened |
| 6. Additive | PASS | one new export each in two files |
| 7. Performance | N/A | one map lookup per card open |

## Intent-judge verdict

Pass 1 (cold): **Allow** — Reversible; 1 GAP (dimension 4: the fail-soft row said the log-form label "cannot
happen", but lifecycle line 1228 also needs `objectTypeId`), 0 VIOLATIONs. Advisory: PC-4 was mis-cited. Both
folded in: the helper now treats the log form as empty (`MOMENT_LOG_COMPLETION_MARKER`), with a unit case, and
the class is PC-6.

## Forked-audit verdicts

### NFP audit

NFP AUDIT: PASS-with-notes. Tunability, Determinism, Narrative, Additive, Performance PASS. Inspectability
PASS-with-note: no trace says which branch fired (accepted for a view string; a unit test pins each branch).
Fail-soft PASS-with-note: the same log-form gap the judge found, now fixed.

### Three-pillar audit

PILLAR AUDIT: PASS-with-notes. Engine, Content and UI present-and-substantive. Notes: no complaint-class table
(added), no debug-visibility or prerequisite-health line in Wiring (added). Blast Radius correctly absent.

### Vision audit

VISION AUDIT: PASS. No contradictions; the card now reports what the mortal really did, which helps the
god read the world.
