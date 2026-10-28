# Action proposal — 2026-10-28-thr-2044-loan-plants-its-collection

**Plan doc:** `Docs/plans/2026-10-28-thr-2044-loan-plants-its-collection.md`

## intent_quote

There is no live user ask. This ticket is a Deferral the shipped debts plan filed under its own kill criterion. The design lane works it under Christian's standing delegation.

> "If `no_debt_owed` is more than 90% of Debt Collection's settles, file a Deferral on drawing Debt Collection toward mortals who are owed — do not tune the draw in this PR." — THR-2023 plan, kill criterion (`Docs/plans/2026-10-24-thr-2023-encounter-debts.md`)

> "Draw Debt Collection toward a mortal who holds a live debt owed to them (`listDebtsOwedTo` in `src/engine/debtSettle.ts` answers the question). Options to weigh: a motivation/desire lean keyed on being owed; a qualifier that boosts the template's weight; or an encounter seed planted on the lender when The Loan resolves. Not decided here. **Done when:** the same census reports `no_debt_owed` at or below 50% of Debt Collection's settles on seeds 42 and 99 over 600 ticks, with no drop in Debt Collection's resolution count of more than half." — THR-2044 description

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations" — Christian, 2026-09-25 (THR-1611, the design lane's mandate)

## scope (what this plan does)

It adds one authored `encounter_seed` row to every band of The Loan's outcome table (`theLoanBand()` in `src/data/encounter-content.ts`). The row plants Debt Collection on the acting lender 24 ticks later. It adds two constants (kill switch, delay) in `src/data/mortal-means-constants.ts`, extends `scripts/debt-census.ts` with seed-fate lines, adds two tests and one rulebook sentence. A runtime prototype measured three arms on seeds 42/99/7.

## scope (what this plan does NOT do — explicit non-goals)

- No engine change. The seed, place-wait, settle and expiry code is untouched.
- No change to Debt Collection's template, steps, prose or its un-seeded draw. No qualifier, no score lean, no desire term.
- No change to The Loan's debt term (48 ticks) or the money amounts.
- No appointment or promise edge.
- No UI component. The seed label shows only where every authored seed's label already shows.
- Does not fix THR-2045 (a bond lost at debt expiry) or THR-2024 (Debt Collection's prose cannot name the debtor).

## impact_class

Reversible — one content row behind a kill switch.

## evidence cited

- **Linear issue:** THR-2044
- **Vision premises invoked:** core loop (the world does not wait for the god); Laws 13, 20, 22, 42 in `Docs/game-design/laws.md`
- **UL terms touched:** Agreement / debt (Agents shard); none new
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/rulebook.md` (money-encounters paragraph), `Docs/game-design/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-24-thr-2023-encounter-debts.md`; `Docs/plans/2026-10-28-thr-2040-hunger-stories-planted.md` (measured that score leans fail, seeds work)
- **Rejected approaches considered and dismissed:** desire lean, qualifier boost or gate, appointment block, seeding at expiry (brainstorm companion)

## load-bearing decisions touched

- "Relationships between entities are graph edges": respected. The debt stays a `relates_to` edge, and no property is added.
- "The world graph is mutated in place": unaffected (no new graph write path).

## high-impact files touched (from Codesight)

None with ≥100 importers: `src/data/encounter-content.ts` is imported by 67 files (grep), `src/data/mortal-means-constants.ts` by 40. The edit is a data row and two new exports; no signature changes.

## kill criteria

- Seed 99 reads above 50 % → raise the delay to 30 once. Still failing → ship nothing, return the ticket to Todo.
- More than a quarter of seeds wither (`place_never_reached`) → ship nothing.

## explicit user sign-off

None needed (Reversible). The decision is recorded on the ticket with a veto invitation, per the design lane.

## author notes for the judge

Measured, not asserted: prototype branch `proto/thr-2044-debt-collection-seed`, raw output in `scripts/_scratch-2044-results.md` there. At delay 24: no-debt share 36 % / 48 % / 39 % (seeds 42/99/7) against 100 % / 92 % / 86 % off; 71 of 72 seeds fired.
