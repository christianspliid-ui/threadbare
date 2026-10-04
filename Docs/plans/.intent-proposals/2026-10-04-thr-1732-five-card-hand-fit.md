# Action proposal — 2026-10-04-thr-1732-five-card-hand-fit

## intent_quote

Christian's approved layout pass, THR-1724 (human gate satisfied via chat review 2026-10-04), change 1 and change 8:

> **Card picture band at 16:9** (Law 5 hero ratio). Drop the `aspectRatio: 'auto'` override and the 78px band; the band's height follows the card width. It must still fit the 1920×1080 viewport contract with two card rows — verify with 5 cards.

> **Replace the horizontal-scroll card row with wrapping rows of at most 4 cards** (named constant `CARDS_PER_ROW = 4`).

The ticket under design (THR-1732), filed by the THR-1724 executor:

> One card is 322px tall … The content column comes to **1279px against 1080px**, so it scrolls internally by about 200–250px … But the commit button sits below the fold until the player scrolls the column.
> Options (a design call): A — five per row when there is room … B — a tighter card body … C — accept the column scroll.

Lane mandate (Christian, 2026-09-25):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations"

## scope (what this plan does)

It moves the nudge stage's essence counter, glyph legend and commit button into one `position: sticky; bottom: 0` bar at the end of `NudgePhaseShell`, so the commit is always on screen inside the veil's existing scroll column. It removes the essence-and-legend row above the cards. Two constants are added. The same bar applies to the shell's standalone placement (Meet The First).

## scope (what this plan does NOT do — explicit non-goals)

- It does not change `CARDS_PER_ROW` (4), `CARD_WIDTH_PX` (210), the 16:9 band, or the card body: Christian-approved, Law 33 / THR-890.
- It does not make two full card rows fit above the fold. The plan shows by measurement that this is impossible under the approved constraints.
- It does not move the step dots, restyle the title row, or touch the stakes line, the scene prose or the cast column.
- It does not amend any UI law.
- No engine, content, trace or GameState change.
- It does not touch the legacy (non-nudge) veil footer.

## impact_class

Reversible: a UI layout change in one component, no state.

## evidence cited

- **Linear issue:** THR-1732 (and THR-1724, THR-890, THR-1410, THR-1714)
- **Vision premises invoked:** the nudge model's two-beat deliberate act (Law 48); narrative over mechanical perfection (NFP 5)
- **UL terms touched:** Dealt Hand, Forecast tier: used, not changed. No new term.
- **Canon pages consulted:** `Docs/design-system/laws.md` (Laws 1, 5, 7, 10, 12, 13, 23, 25, 30, 33, 35, 37, 46, 47, 48, 52); `Docs/canon/verification-gates.md` (browser-verify)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-03-thr-1714-show-the-roll.md` (the commit label it ships; mutex)
- **Rejected approaches considered and dismissed:** five per row (bends Law 33, only helps 5-card hands, does not fit as specified); tighter card (bends THR-890); accept scroll (commit below fold); one row with a wider veil (reverses Christian's same-day choice); step dots into the title row (changes his title row).

## load-bearing decisions touched

None. No graph, engine cache or position change.

## high-impact files touched (from Codesight)

None ≥100 importers. `NudgePhaseShell.tsx` is mounted by `EncounterVeil.tsx`, `FormativeTestBeat.tsx`, `BondBeat.tsx` and tests (corrected after intent-judge pass 1).

## kill criteria

- If sticky positioning fails inside the veil column on the shipped browser (the commit is not within the fold on the five-card bridge), fall back to the THR-1410 absolutely positioned footer pattern with an exact column reservation.
- If Christian vetoes with "five across" or "one row", that is a Law 33 amendment. The bar stays, because neither option handles 6–8 card hands, and the row rule changes in a follow-up ticket.
- If round-3 cold testers report not noticing a second row of cards under the bar, add a "more below" cue in a follow-up. Nothing in this plan forecloses it.

## explicit user sign-off

Not required (Reversible). The decision is recorded for veto in the design-lane report and on the ticket.

## author notes for the judge

The ticket framed this as a choice among A/B/C. The measurement changed the frame: hands deal 4–8 cards (`nudge-constants.ts:575-576`), and art scenes hold only three per row, so A fixes almost nothing and two-row fit is arithmetically impossible under the locked card. The real defect is an off-screen commit, which is Law 48's beat, and THR-1410 already treated that as a bug on the legacy veil. The chosen design bends none of Christian's approved rules, which matters because law amendments are joint decisions he makes. The bending options are offered as one-phrase vetoes. The live-build numbers in the plan were measured with Playwright at 1920×1080 on `cb58a9d6` (deployed).
