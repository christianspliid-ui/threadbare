# Brainstorm companion: readable on hover (THR-1713)

Companion to `Docs/plans/2026-10-05-thr-1713-readable-on-hover.md`. It records the alternatives the design lane weighed, the tensions with earlier rulings, and the Vision premises the calls lean on.

## The puzzle

THR-1607 shipped tooltips five days before round 2. Round 2's testers still said "almost nothing has a tooltip". Either the testers were wrong or the tooltips were somewhere they never pointed. The measurement settled it:

- The essence tooltip sits on a 13px numeral, not on the bar.
- The card-mark tooltips render only for cast cards. The `markTooltips` flag has one production producer, the cast-card model, and the dilemma's nudge cards, where the testers spent their minutes, never set it.
- The keyword icons have no registry family at all.
- The sheet's Reach word has none.

So the round-1 answer was right in kind and wrong in placement. That shapes the whole plan: **attach, don't author**. New copy is written only where the registry has a genuine hole.

## Alternatives weighed

### For the drift cause (D2/D3)

| Option | Says why? | Cost | Verdict |
|---|---|---|---|
| A. Leave drift unexplained, tooltip gives the role only | No | Zero | Fails the ticket's explicit "incl. drift cause" |
| B. Use `computeEssenceIncome` (exists, computed at `GameView.tsx:1831`, never read) | Predicts income only; blind to spends, upkeep, sustained effects | Low | A forecast is not an explanation. "Matter 50 → 42" was upkeep and spend, which B cannot see |
| C. Read traces (`influence_maintenance`, `control_effect`) | Partial; both trace only on status flips, by design (trace budget) | Low | Would require tracing every tick on the hottest seam, which is a trace storm |
| **D. A bounded per-sphere movement record at the existing phase-merge seam (chosen)** | Yes, for every in-tick cause by phase, plus three tagged spends | One optional field, one pure module | Honest, deterministic, bounded, and the seam already diffs the pool for attunement |
| E. A full per-event essence ledger (every grant/spend as a row) | Yes, in detail | Unbounded growth; save bloat | Over-built; the player needs "what fed it, what drew it", not an audit trail |

### For the "stars"

The veteran's ★ is the *Fated* odds pip, not a cost. Law 10 split price (framed ✦ badge) from odds (pips) after Christian could not tell them apart (THR-972). The fix is therefore two different hovers, one per vocabulary, not one "card marks" tooltip that would re-merge what THR-972 separated.

### For the red/green lines (D6)

- **Restore the per-line hover** (pre-THR-1478). Rejected: THR-1478 removed it on purpose, because it was a rulebook entry firing on every sentence.
- **Re-show the legend every encounter.** Rejected: Law 51 (preferences persist), and the legend was already in front of the testers on their first encounter.
- **Glyph prefix (▲/▼).** Rejected: ▼ is already the penalty pip (Law 10, one vocabulary per meaning).
- **Kind tag word (chosen).** Law 31 already demands a word with every polarity colour, and Law 16's chip anatomy is exactly a kind tag plus a sentence. It also answers the tester's real confusion. "Could stop a war" *sounds* good; the tag says it *hinders this attempt*.

### For Quintessence (D8)

- **Explain it with a better tooltip.** Rejected as insufficient: a readout that never changes in the first session teaches nothing and spends HUD budget (Law 53).
- **Remove it everywhere.** Rejected: it breaks Law 13's visibility parity. The sheet keeps it.
- **Hide on the strip until it falls below the top word (chosen).** This is the ticket's direction.

## Tensions with earlier rulings

1. **THR-868 verdict 10 (Meet The First teaches in-fiction only, "no tooltips").** The meeting shares card and header components with the dilemma screen. Reading the verdict as "teaching", not "any hover", keeps THR-1607's status quo; THR-1714 recorded the same reading on 2026-10-03. Recorded for veto with a one-prop fallback.
2. **THR-1478 item 5 (per-line factor hover removed).** Honoured. D6 hovers a two-word tag, not the sentence.
3. **Law 13 (no rates).** The drift cause could easily become "−3/tick". It is phrases only; the balance numeral is the one ratified essence number.
4. **Reaches ⟂ Spheres (load-bearing).** One tester read them as one axis. The fix states the separation; it does not soften it into "Reaches use Spheres".

## Vision premises leaned on

- *"You spend sphere-typed essence"*: the spend must be readable, or the god's central verb is a guess.
- *"You nudge; fate rolls"*: each forecast word explains itself as pre-roll, never as a promise.
- *Words, never numerals* (Ruling 6 / Law 13): the depth the veteran wants to read is delivered as words on hover, not as a stat sheet.

## Out of scope, noted

- The round-2 "first ten minutes" and arrival findings: THR-1715, THR-1716.
- The `computeEssenceIncome` dead computation at `GameView.tsx:1831`. Harmless; a cleanup for another day.
- The god-vs-mortal quintessence lexicon duplication (`selectQuintessenceView`'s hard-coded ladder vs `quintessenceToWord`). Real, but not a legibility issue.
