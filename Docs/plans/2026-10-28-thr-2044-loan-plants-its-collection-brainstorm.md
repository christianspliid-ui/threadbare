> **title:** A loan plants its own collection — brainstorm companion — THR-2044
> **linear_issue:** THR-2044
> **author:** Claude Code (design lane, run 2026-10-28a, unattended)
> **created:** 2026-10-28
> **companion_of:** `Docs/plans/2026-10-28-thr-2044-loan-plants-its-collection.md`

# A loan plants its own collection — brainstorm companion

The plan doc carries the decision. This file records the options weighed and why the others lost.

## The question

Debt Collection settles a debt owed to whoever plays it. It is drawn by mortals at the counting house, and almost none of them are owed anything, so 93 % of its settles found no debt (THR-2023 census). The ticket named three ways to draw it toward creditors: a desire lean, a qualifier boost, or a seed planted on the lender.

## Options

**A. A motivation or desire lean keyed on being owed.** A mortal who holds a debt would score Debt Collection higher. *Lost:* the [THR-2040 re-plan](2026-10-28-thr-2040-hunger-stories-planted.md) measured exactly this shape on the famine scenes. Scene scores spread over orders of magnitude, so a lean of ×1.4–1.75 reordered almost nothing on the board. A lean big enough to matter would override every other reason a mortal has. It would also need a new reader ("how much is this mortal owed") inside scoring.

**B. A qualifier that boosts or gates the template.** Gate Debt Collection to mortals with a live debt owed to them, or boost its weight for them. *Lost as the main fix:* a boost is option A again. A gate alone would cut the no-debt settles but also cut Debt Collection to almost nothing, since creditors are rarely at the counting house when the board draws. That would break the ticket's guard against a drop of more than half. A gate on top of the seed was also weighed. It would push the no-debt share near zero, but it needs a new prerequisite reader for one template (Law 42). It would also remove the "collecting for the house" reading the `hire` type gives the un-seeded draw. The seed alone already meets the predicate.

**C. A seed planted on the lender when The Loan resolves.** *Taken.* The authored `encounter_seed` effect exists, the outcome table runs it, and sequels already use it. The scene goes to the one mortal who is owed, at a time when the debt still stands. Measured: 71 of 72 seeds fired at delay 24, and the no-debt share fell from 86–100 % to 36–48 %.

**C′. Seed timing.** Delay 12 fires sooner (p50 13 ticks) but missed seed 99 at 51 %. Delay 24 (half the 48-tick term) passed on all three seeds with p90 29 ticks, well inside the term. Seeding at the term's end was rejected: the debt has expired by then, and the scene would no-op.

**D. An appointment block** (a place and a time, "be at the counting house when the loan falls due"). *Lost:* an appointment writes a favour edge as the promise, so the pair would hold a favour and a debt for one loan. It also adds a missed-appointment branch that this scene does not need. A plain seed already waits for the counting house (the THR-1929 place wait).

**E. Make the debt's expiry itself the collection** (when the term ends, fire the scene). *Lost:* it fires after the debt is gone. It would also need the expiry pass to plant seeds, a new cross-system write.

## Tensions noted

- **More collections overall.** Debt Collection roughly triples. It is gated to the counting house, which only The Loan shares, so it displaces little. The ticket's guard is about a drop, not a rise.
- **Every loan comes back.** The seed is planted on every band, so it is deterministic per loan. That suits the fiction: a lender always means to collect. Whether the collection succeeds is still the dice. The veto line in the plan names "only sometimes" for Christian.
- **The organic draw still no-ops about 40 % of the time.** Accepted (plan Decision 2). Its success row pays, so it is not dead air (Law 22).
