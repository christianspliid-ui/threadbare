# Impediment Log — parser fixture

**This is a hand-authored fixture, not a snapshot of `Docs/impediments.md` (THR-922).**

`scripts/__tests__/impediment-log.test.ts` used to read the live log at test time, which
made `npm test`'s outcome a function of documentation content: an impediment append could
redden the suite, and — because CI skips tests on the docs-only PR that carries the append
(THR-491) — it reddened the *next unrelated code PR* instead of its own.

This file exists so the parser's **behaviour** can be pinned by code alone. It is
deliberately small and deliberately *not* copied from the live log: a copied snapshot rots,
and re-importing the live corpus here would re-import the coupling in a new costume.

Every row and paragraph below exercises a specific parse path. If you add a case, say which
one in a comment beside it. The live log's own **population** invariants (how many entries
exist, that none are dropped, that no `#` repeats) are asserted against the real file by
`npm run check:impediment-ids`, which runs on the docs track where doc changes are gated.

## Log Format

| # | Count | Date | Category | Description | Consequence | Impact | Workaround Found? | Workaround Description | Session Context |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | 2026-07-01 | tooling | ripgrep is blocked in the sandbox | shell searches fail outright | M | Yes | use the Grep tool instead | fixture row: the canonical 10-column shape |
| 2 | 1 | 2026-07-03 | process | claim write dropped silently | state reverted with no error | L | Yes | verify-after-write | fixture row: second full row, distinct number |
| 7 | 1 | 2026-07-09 | tooling | a row missing its trailing columns |
| 12 | 3 | 2026-07-11 | config | impact column carries prose | aggregation reads Unknown | Blocked (workaround available) | No | none | fixture row: impactRaw kept verbatim, bucket normalises to Unknown |
| 13 | 1 | 2026-07-12 | environment | a description with an escaped \| pipe | column alignment survives | S | Yes | escape it | fixture row: `\|` escape must not split the cell |

## Trailing entries

**New 2026-07-02 (fixture-legacy-session) — a legacy headline with no category or impact:** trailing prose with no field tail at all.

**New 2026-07-05 (fixture-session, hourly pickup) — process (M): a modern headline.** body text | the consequence | M | Yes | the workaround | session context.

**New 2026-07-06 (fixture-session) — tooling (L): a headline whose body carries a stray pipe.** body with a | stray pipe | the consequence | L | No | none | ctx

**New 2026-07-08 (fixture-session) — environment (S): a headline whose tail declares no impact.** just a prose body, no pipe-separated fields.
