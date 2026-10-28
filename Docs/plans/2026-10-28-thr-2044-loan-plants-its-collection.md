> **title:** A loan plants its own collection — the lender comes back for what they are owed — THR-2044
> **linear_issue:** THR-2044
> **author:** Claude Code (design lane, run 2026-10-28a, unattended)
> **created:** 2026-10-28
> **three_pillars:** Engine N/A (an existing authored effect; no engine change) · Content done (one seed row on The Loan's outcome table, one constant) · UI N/A (no component changes; the seed label shows only in the debug Encounter Seeds tab and the recent-events list)

# A loan plants its own collection — THR-2044

*When a mortal lends coin at the counting house, that loan comes back to them as a Debt Collection scene two days later.*

## Why this is load-bearing

[The debts plan](2026-10-24-thr-2023-encounter-debts.md) made Debt Collection actually clear a debt. Its kill criterion fired: on a 600-tick census, Debt Collection found no debt to collect in 26 of 28 settles (93%). The Loan makes about 20 debts a world, so lenders exist. But Debt Collection is drawn by whoever stands in the counting house, and the mortal drawn is almost never one who is owed anything. So the debt from a loan almost never gets collected. It runs out silently after its 48-tick term, and the lender's coin is simply gone.

**Measured** on [`proto/thr-2044-debt-collection-seed`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2044-debt-collection-seed) (`scripts/_scratch-2044.ts`, never merged; `main` @ 4f165a9f, medium, 600 ticks). Every band of The Loan's outcome table gains one authored `encounter_seed` row at runtime: Debt Collection, aimed at the acting lender, ripening N ticks later. Raw output: `scripts/_scratch-2044-results.md` on that branch.

| arm | seed | Loans | Collections resolved | settles: paid · written off · **no debt owed** | seeds planted → fired · place never reached | plant→fire p50 / p90 |
|---|---|---|---|---|---|---|
| off (`main`) | 42 | 26 | 12 | 0 · 0 · **12 (100 %)** | — | — |
| off | 99 | 22 | 13 | 0 · 1 · **12 (92 %)** | — | — |
| off | 7 | 17 | 7 | 1 · 0 · **6 (86 %)** | — | — |
| delay 12 | 42 | 22 | 41 | 19 · 3 · **19 (46 %)** | 22 → 22 · 0 | 13 / 17 |
| delay 12 | 99 | 22 | 37 | 13 · 5 · **19 (51 %)** | 22 → 19 · 2 | 13 / 20 |
| delay 12 | 7 | 19 | 30 | 16 · 3 · **11 (37 %)** | 19 → 19 · 0 | 13 / 26 |
| **delay 24** | 42 | 28 | 42 | 22 · 5 · **15 (36 %)** | 28 → 27 · 1 | 25 / 27 |
| **delay 24** | 99 | 21 | 40 | 17 · 4 · **19 (48 %)** | 21 → 21 · 0 | 25 / 29 |
| **delay 24** | 7 | 23 | 36 | 14 · 8 · **14 (39 %)** | 23 → 23 · 0 | 25 / 29 |

What the numbers say:
- **The planted scene finds its debt.** Of 72 seeds at delay 24, 71 fired. In each arm, the collections beyond the seeded ones roughly match the unseeded count, and they carry almost all the remaining no-debt settles. A lender who lends at a counting house is still at one when the seed ripens: only 3 of 135 seeds in both arms waited out `SEQUEL_PLACE_WAIT_TICKS`.
- **Delay 24 meets the ticket's predicate on every seed; delay 12 misses seed 99 (51 %).** At delay 24 the scene still lands well inside the debt's 48-tick term (p90 29 ticks), so the debt is there to collect.
- **Collections roughly triple** (12 → 42 on seed 42). The ticket's guard is only "no drop of more than half". Debt Collection is gated to the counting house, which two templates share, so the rise does not crowd any other scene's ground.

## Decisions this plan builds on

**Decided by delegation in this plan (design lane, 2026-10-28; veto in chat):**

1. **The Loan plants Debt Collection on its own lender, 24 ticks later.** Every band of The Loan writes a debt, so every band plants the collection. The scene is the lender's own errand: going back for what they are owed. This is the ticket's third option ("an encounter seed planted on the lender when The Loan resolves"), and it uses the authored `encounter_seed` effect that already plants sequels (Law 42: an existing seam, no new mechanism). *Veto:* "a lender shouldn't always come back, only sometimes", or "the collection should come at the end of the term, not halfway".
2. **The un-seeded draw stays as it is.** A mortal at the counting house may still draw Debt Collection with nobody owing them. The template is `encounterType: 'hire'`, so it reads as collecting for the house, and the THR-2023 fallback still pays the success row. Gating it to creditors would need a new "is owed a debt" qualifier. The seed already meets the predicate, so that gate is not worth a new reader.

Rejected, one line each ([brainstorm](2026-10-28-thr-2044-loan-plants-its-collection-brainstorm.md)):
- a desire lean on being owed (the [THR-2040 re-plan](2026-10-28-thr-2040-hunger-stories-planted.md) measured that scene-score leans barely move the board);
- a qualifier boosting the template's weight (the same lean problem, plus a new reader);
- an appointment (`appointment` block) (it writes a favour edge as the promise, which would put a second obligation beside the debt);
- seeding at the end of the term (the debt has gone by then).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Authored `encounter_seed` effect: `encounterAftermath.ts` `case 'encounter_seed'` | 🟢 ACTIVE | **reads**. The outcome-table path (`unifiedActionResolution.ts` `applyOutcomeEffectsTable` → `applyEncounterAftermathReaction`) already runs every effect kind, and the prototype shows it planting |
| Seed firing: `encounterSeeding.ts` `evaluateEncounterSeeds`, place wait (THR-1929, `SEQUEL_PLACE_WAIT_TICKS` 48) | 🟢 ACTIVE | **reads**. A `templateId` seed holds until the lender stands where Debt Collection is allowed (a counting house) |
| Debt settle: `debtSettle.ts` `settleDebt` / `listDebtsOwedTo` (THR-2023) | 🟢 ACTIVE | **reads**. The seeded scene's `debt_settle` (creditor `$actor`) clears the oldest live debt owed to the lender |
| Agreement expiry: `agreementExpiry.ts` (THR-1999), term `agreement.debt.minor` 48 ticks | 🟢 ACTIVE | **unchanged**. The seed is timed inside the term |
| Debt census: `scripts/debt-census.ts`, `npm run census:debts` | 🟢 ACTIVE | **extends** with seed-fate counts |

## Engine pillar

N/A — no engine file changes. The planting, ripening, place wait, firing and settle all exist and were exercised unchanged by the prototype. No new graph node, edge, phase or PRNG draw. Seed timing is a fixed delay, so determinism is unchanged (NFP #3).

## Content pillar

### Encounter templates
`src/data/encounter-content.ts`, `theLoanBand()`: append one row, so all five bands carry it:

```ts
...(LOAN_COLLECTION_SEED_ENABLED ? [{
  kind: 'encounter_seed' as const,
  templateId: 'encounter.debt_collection',
  delayTicks: LOAN_COLLECTION_SEED_DELAY_TICKS,
  seedLabel: 'The loan falls due',
}] : []),
```

No `targetAgentId` (it defaults to the acting lender) and no `inheritContext`: Debt Collection has no cast, and its `debt_settle` finds the debt by creditor. The template, its steps and its prose do not change. The prose already opens "The agreement is past due".

### Prose tables · Attachment content
N/A. There are no new lines. The seed label is a short in-world line in the register of the existing authored seeds ("The same day, come back around again").

### Data tables
Two constants in `src/data/mortal-means-constants.ts`, beside the THR-2023 block (§ Constants).

## UI pillar

N/A — no component changes, and no new player surface. The player meets the change as the scene itself: a lender's Debt Collection, which now usually finds the borrower and settles the debt. The settle's existing aftermath changes say so. The seed label reaches the debug Encounter Seeds tab (`EncounterSeedsTab.tsx`) and the recent-events narrative line `A thread has been planted: The loan falls due`, as every authored seed's does. UI Laws engaged: none by a new surface. **Browser-verify exempt:** no file under `src/components/`, `src/hooks/` or `src/contexts/` changes.

**Playtest signal:** a mortal who lends at the counting house is seen, about two days later, collecting what they are owed. The settle clears the lender's oldest live debt, so a lender with two loans out collects the older one first.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| The Loan's outcome-table row | resolution (outcome table) | none | `pendingEncounterSeeds` (existing) | `encounter_aftermath_effect` (`effectKind: 'encounter_seed'`), `encounter_seed_planted` (existing) | Encounter Seeds tab, trace viewer |
| `scripts/debt-census.ts` | — | — | — | — | the Done-when |

Wiki: if a Design Reference Wiki page sources `encounter-content.ts` money templates or `debtSettle.ts`, add one sentence ("a loan plants its lender's collection two days on"). Otherwise record `Wiki-freshness-exempt: content row on an existing effect`.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Encounter outcome table → `pendingEncounterSeeds` | preserve | an existing write by an existing effect kind; one more template uses it |
| `debt_settle` → `relates_to` debt edges (THR-2023) | preserve | unchanged reader, more often reached |

No new cross-system read or write, so no `interface-map.md` or `interface-contracts.ts` edit is owed.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `LOAN_COLLECTION_SEED_ENABLED` | `true` | kill switch; `false` is today exactly |
| `LOAN_COLLECTION_SEED_DELAY_TICKS` | 24 | ticks from loan to the lender's collection: half the `agreement.debt.minor` term (48), so the debt is still live when the scene fires (prototype p90 fire latency 29) |

## Tracing

N/A — no new trace type. The existing `encounter_seed_planted`, `encounter_seed_triggered` (with `ticksBetweenPlantAndTrigger` and discard reasons), `agreement_settled` and `debt_settle_noop` traces cover the whole path. The census reads them.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| the lender never returns to a counting house | the seed withers after `SEQUEL_PLACE_WAIT_TICKS` (`place_never_reached`); the debt expires as today |
| the lender dies before the seed ripens | the seed is discarded (`target_agent_missing`) |
| the debt is gone when the scene fires (borrower dead, already settled) | `debt_settle` no-ops `no_debt_owed`; the scene still pays its success row (THR-2023 fallback) |
| The Loan's borrower failed to bind | THR-2023 already treats that as a defect; the seed plants anyway and no-ops as above |

## Blast Radius

N/A. The plan touches no file with 100 or more importers beyond a content row in `encounter-content.ts` (data; no signature change) and two constants.

## Three-pillar check

- [x] Engine pillar: N/A with rationale (existing effect, unchanged path)
- [x] Content pillar present (one seed row, two constants)
- [x] UI pillar: N/A with rationale (no component changes)
- [x] Wiring section connects them

## Vision audit

- [x] Does not contradict a Vision premise. "The world does not wait for the god" (Law 13): a lender chases their own coin. Law 22: a loan now leads somewhere instead of lapsing. Law 42: an existing seam with one more user. Law 20: a seed is a forced arrival and bypasses the forecast window by design, like every sequel.
- [x] No Vision edit needed.

## Rulebook impact

- [x] One rule of play gains a consequence: a loan now brings its lender back to collect.
- [x] One sentence in `Docs/canon/rulebook.md` § money encounters (the THR-2023 paragraph), added by the build: "A lender comes back to collect about two days after the loan [IMPL — THR-2044, the seed row in The Loan's outcome table]." The quick reference needs no edit; its money-encounters lines do not list debts.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | two named constants |
| 2. Inspectability | PASS | existing seed and settle traces; the census reports seed fates |
| 3. Determinism | PASS | fixed delay, no PRNG |
| 4. Fail-soft | PASS | table above; the kill switch restores today |
| 5. Narrative over mechanics | PASS | a lender pursuing a debt, in the template's own words |
| 6. Additive | PASS | one row, two constants |
| 7. Performance | PASS | about 25–30 extra scenes per 600-tick world (12 → 42 Collections on seed 42), through an existing seam; the census's per-seed wall time is the check |

## Done when

- [ ] `outcomeEffects.test.ts`: every band of `encounter.the_loan` carries one `encounter_seed` row naming `encounter.debt_collection` with `delayTicks === LOAN_COLLECTION_SEED_DELAY_TICKS` and no `targetAgentId`; `LOAN_COLLECTION_SEED_DELAY_TICKS` is below `agreement.debt.minor`'s `ticksRemaining`.
- [ ] A unit test through the outcome table: a resolved Loan plants one seed for its lender at `tick + 24`, and with `LOAN_COLLECTION_SEED_ENABLED` false it plants none.
- [ ] `npm run census:debts` (seeds 42, 99; 600 ticks, medium) reports, per seed: Debt Collection's `no_debt_owed` at or below 50 % of its settles (prototype 36 % / 48 %), and Debt Collection resolved at least as often as on `main` (baseline 12 / 13). The census also prints seeds planted / fired / withered from The Loan. Record the output in the closeout.
- [ ] The rulebook sentence (§ Rulebook impact) lands. `npm run gate` is green.

## Kill criteria

- Seed 99 reads above 50 %: raise `LOAN_COLLECTION_SEED_DELAY_TICKS` to 30 once and re-run (it must stay below 48). If it still fails, ship nothing, record both runs, and return the ticket to Todo.
- More than a quarter of planted seeds wither (`place_never_reached`): lenders are leaving the counting house. Ship nothing and record it.

## Coordination block

**Suggested model:** sonnet. One content row, two constants, a census extension and two tests, with no open design.
**Parallel-safe with:** [famine and glut draws](https://linear.app/threadbare/issue/THR-2040) and [Attention's price](https://linear.app/threadbare/issue/THR-2062). Neither touches The Loan, debts or `mortal-means-constants.ts`.
**Mutex with:** anything editing `encounter.the_loan` / `encounter.debt_collection` in `src/data/encounter-content.ts`, or the THR-2023 block of `src/data/mortal-means-constants.ts`.

**Files to touch:**
- Edit `src/data/encounter-content.ts` (`theLoanBand`), `src/data/mortal-means-constants.ts`
- Edit `scripts/debt-census.ts` (seed-fate lines, from the proto's `_scratch-2044.ts`)
- Edit `Docs/canon/rulebook.md` (one sentence)
- Tests: `src/data/__tests__/outcomeEffects.test.ts`; the outcome-table seed test beside `src/engine/__tests__/debtSettle.test.ts`

## Notes for the executor

- The prototype patched the template at runtime and did not touch `theLoanBand`'s signature. Keep the row inside `theLoanBand()` so all five bands stay identical.
- Do not add a debt qualifier or a score lean to Debt Collection (Decision 2).
- [THR-2045](https://linear.app/threadbare/issue/THR-2045) (a bond lost when a debt expires) touches `agreementExpiry.ts`, not these files.

## Intent-judge verdicts

**Run 1 (2026-10-28, opus, cold): Allow** (Reversible, confirmed). Dimensions 1–11 PASS; 12 N/A (no player surface). The judge re-checked the prototype numbers on the proto branch, and they match. Two advisories:
- the settle clears the lender's oldest debt, so the playtest signal now says "collecting what they are owed", not "from that borrower" (fixed in this revision);
- seed 99 at 48 % leaves little margin; the kill criterion's delay-30 retry may well fire (kept as written).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-28*

### NFP audit

**NFP AUDIT: PASS-with-notes.** NFPs 1–6 pass. **7 (note):** the extra load is about 30 scenes per world (12 → 42 Collections on seed 42), not 25. The NFP table now says so. It runs through an existing seam and is unprofiled, so the census's per-seed wall time is the check.

### Three-pillar audit

**PILLAR AUDIT: PASS.** Engine N/A with rationale, Content present and substantive, UI N/A with rationale (browser-verify exemption and playtest signal present). No required section is missing. Wiring ties the content row to the outcome-table phase, `pendingEncounterSeeds`, the existing seed traces and the Encounter Seeds tab. The substrate inventory reuses `encounter_seed` and `debtSettle` with no duplication.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions. It extends the north star (a decision echoes, the world moves on) and design tension 2 (an emergent debt resolves as a legible chapter). Non-negotiables 1–4 and 6 are confirmed. **Note:** Debt Collection roughly triples, and one counting-house template absorbs all of it, which leans toward a drumbeat. *Lane response:* it is one scene per loan, and a loan is itself about 20 a world. The census line on Debt Collection's resolution count is how a future reviewer can see it. If a cold playtest names the repetition, a second collection template is the fix, not a lower rate.
