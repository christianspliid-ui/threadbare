# Action proposal — 2026-10-24-thr-2023-encounter-debts

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (the design lane's mandate, THR-1611)

The agreed work this plan serves is the deferral filed by the shipped mortal wealth plan (`Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`, § Content pillar *Not in this plan*):

> "Not in this plan (filed as one Deferral, § Slices): place-as-holding writes …, removing a debt, a faction's quest or bounty paying its finisher from the purse, …"

and the deferral ticket THR-1954's body and the executor's 2026-10-24 comment on it:

> "Clearing a debt — debt collection's success removes a debt."
> "A debt with no counterparty. The Loan (simple encounter) has no cast, and `attachment_grant` agreements need a bindable counterparty … This needs a cast spec or a place counterparty."
> "Path-only debts. The debt arbitration's promissory note and the toll-gate writ's toll-book debt sit on specific paths whose prose only partly supports them."
> "The cathedral's treasury. The cathedral loan's temple-treasury rows. The research did not say which way the coin moves on each band."

THR-1954's coordination block: "each item is a small design (a new write primitive or a scoring read), best split into its own ticket when picked up." THR-2023 is that split for the four debt rows.

## scope (what this plan does)

Adds one generic aftermath effect, `debt_settle`, that ends a live debt owed to a creditor early (paid: the debtor's Means falls; written off: no coin), plus a `creditorAgentId` sentinel field. Authors band rows on five money encounters: Debt Collection settles a debt owed to the actor; The Loan gains a borrower cast and writes a debt borrower → actor; the debt arbitration's failure writes the master's note; the toll-gate writ's success-at-cost writes the toll-book debt; the cathedral loan's five bands move coin between the dean and the factor or write the chapter's debt. The sheet and the ascendant bar say which way a debt runs ("Owes X" / "Owed by X"); four aftermath chips name the new debts. Rulebook paragraph appended at build.

## scope (what this plan does NOT do — explicit non-goals)

- The other THR-1954 rows (place as a holding, lane-bound writes, oaths from tribute, faction quests that pay, famine/glut draws, the missing salt good, toll writes, threatened lanes).
- No default consequence when a debt's term runs out unpaid (THR-1999 behaviour unchanged).
- No temple-faction purse write for the cathedral; no new faction sentinel.
- No new agreement template, note kind or toll kind.
- No prose edits except Debt Collection's failure narrative and stakes (the debtor hides the coin rather than leaving town, because a written-off debtor stays on the map).
- Naming the settled debtor in Debt Collection's result line — filed as Deferral THR-2024.
- No change to how Debt Collection is drawn (a Deferral is filed only if the census shows it rarely finds a debt).
- No change to Debt-Laden's threshold or to agreement expiry.
- No god card or divine verb touches debts.

## impact_class

Reversible — additive engine effect behind a kill switch (`ENCOUNTER_DEBT_SETTLE_ENABLED`), authored content rows, sheet words. No save-format change (debts are existing edges).

## evidence cited

- **Linear issue:** THR-2023 (split from THR-1954)
- **Vision premises invoked:** Game Design Laws 13, 22, 24, 41, 42, 43, 45 (`Docs/game-design/laws.md`)
- **UL terms touched:** Agreement (`Docs/ubiquitous-language/Agents.md` § Agreement), Means. Player words "Owes" / "Owed by" for a debt agreement — a UL-proposal ticket is filed at handoff.
- **Canon pages consulted:** `Docs/canon/rulebook.md` (money encounters paragraph), `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`; THR-1999 (agreement expiry, built without its own plan doc); THR-1920
- **Rejected approaches considered and dismissed:** none from CLAUDE.md's list applies

## load-bearing decisions touched

- "Everything is a graph node/edge" / "Relationships between entities are graph edges" — respected: a debt stays a `relates_to` edge; settle removes it.
- "The world graph is mutated in place — never key change detection on graph identity" — the remover uses the same `removeEdge` + version touch as expiry.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — 685 importers (additive union member)
- `src/types/trace.ts` — 144 importers (two trace categories)
Plan doc carries a Blast Radius section.

## kill criteria

- If the 600-tick census on seeds 42/99 shows Debt Collection settling a debt in under 10% of its resolutions, the "clear a debt" row is near-inert: file a Deferral on drawing Debt Collection toward creditors (the plan says so in its Done-when).
- If The Loan never creates a debt in the census, or resolves less than half as often as on `main` before the change (the lender now pays to lend), file a Deferral on the lender's Means want; do not tune the draw in the build PR.
- If `$cast:borrower` does not bind before The Loan's band table runs on a generated world, the loan row is dead wiring: stop and fix the delivery, never ship the row unbound.
- If Christian vetoes any [lane] call (oldest-first, dean's Means for the treasury, actor as lender, no note on critical failure), revert that row only.

## explicit user sign-off

N/A — Reversible class.

## author notes for the judge

- Authored unattended by the design lane under the THR-1611 delegation; four calls are marked [lane] in the plan and invite a veto.
- Every code claim was measured at main @ 94e9b402 (file:line in the plan). Not measured live: whether a spawned priest dean belongs to a temple faction with a purse — that is why the plan does not use a faction purse, and it tells the executor to record the measurement.
- Uncertain: the exact player-complaint classes; I mapped PC-1/2/3/6 and quoted what each owes.
