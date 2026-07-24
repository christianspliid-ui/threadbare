# Brainstorm companion — Player-cast outcome variance (THR-728)

Companion to `Docs/plans/2026-07-24-thr-728-player-cast-variance.md`. Written alongside, same pass.

## Originating ask

Christian, 2026-07-23 (chat): "make sure to create a linear ticket for later design of the outcome variance." Then 2026-07-24 (chat): "check linear, anything we can get ready for dev from this plan?" — followed by the structured verdict: **"Yes, with a safety floor (Recommended)"** — casts roll on the mortal ladder, but a paid cast never outright fails; worst case is success-at-cost. The two alternatives ("full ladder incl. failure", "keep guaranteed success") were declined.

## Alternatives considered

**1. Full ladder including hard failure.** Offered and declined by Christian. Would have required refund/compensation design (a failed cast that eats essence punishes twice) and made `setback`/`catastrophe` receipts reachable. The frame lines for those bands stay authored — flipping to this variant later is `PLAYER_CAST_OUTCOME_FLOOR` + refund design, not a rewrite.

**2. Keep guaranteed success.** Declined — it leaves the receipt with nothing to reveal and keeps 82 authored difficulty values dead.

**3. New ascendant-specific resolution curve** (bespoke probability model, thread-tier or familiarity inputs). Rejected: "Ascendants use the same prerequisite system as agents" is a load-bearing decision; the same capability-vs-difficulty sigmoid with the same shapers is both cheaper and doctrinally correct. Familiarity/thread inputs can become *shapers* later without touching the frame.

**4. Variance via a new post-resolution "miracle quality" system** separate from the ladder. Rejected as a parallel-vocabulary duplicate of the outcome ladder — the exact drift the UL exists to prevent, and the receipt already speaks band.

**5. Player push/resist access.** Considered and excluded for v1: push spends actor quintessence pre-roll; the ascendant's Q economy is a different design surface, and with an unconditional floor resist is redundant. Excluding both keeps the diff one predicate wide. A future "divine exertion" mechanic can revisit.

## Tensions surfaced

- **Certainty as theme vs. drama as fuel.** Resolved by the difficulty-0 line: soul-verbs (`divine.*`) stay certain — a god whispering into a mortal mind does not fumble — while workings on the world (hex/loc/artifact/sub) carry authored risk. The 54/82 split already encodes this; the plan makes it legible rather than inventing it.
- **Informed consent.** A rules change the player discovers only via a "strained" receipt reads as a bug. Hence the focused-card risk line (steady/uncertain/perilous) — prose words, no percentages, per THR-609 register rules.
- **Determinism across the change.** Player casts consuming rng draws they previously skipped shifts downstream draw order within a tick. Same-build determinism holds; replay divergence across the build boundary is accepted and noted (NFP #3 note).
- **Trace ambiguity.** Two floors now exist (scale floor, player floor). Kept as two distinct trace markers so tuning sessions can tell "incapable actor scraped through" from "player guarantee fired."

## Vision premises invoked

- **North star / "want to see what happens next":** the receipt becomes a reveal with real variance behind it.
- **Non-negotiable "mechanics surface through prose":** qualitative risk words on the card; band frame lines in the receipt; no numeric odds anywhere player-facing.
- **Taste profile / no key:value UX:** the risk hint is one prose line inside the existing effect block.

## Scope refusals (recorded so they aren't re-litigated)

- No refunds or compensation on degraded outcomes (the floor is the compensation).
- No re-pricing of the 54 zero-difficulty templates.
- No push/resist for player casts.
- No receipt or band-content changes.
- No new probability model, no new outcome vocabulary.
