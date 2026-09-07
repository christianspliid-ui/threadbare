> **title:** `The owed readers — Brainstorm Companion`
> **linear_issue:** THR-1428
> **author:** `Claude Code`
> **created:** 2026-09-07
> **status:** complete

# The owed readers — Brainstorm Companion

Companion to `Docs/plans/2026-09-07-thr-1428-owed-readers.md`. The plan compresses; this records what was weighed and where the tension sits. The decisions themselves live on the wayfinder map [THR-1396](https://linear.app/threadbare/issue/THR-1396) and its tickets — this file does not re-decide them.

## Where the plan came from

Not from a grilling. The map decided the readers on 2026-09-03 ([THR-1397](https://linear.app/threadbare/issue/THR-1397): nine live cells "record the reader they owe"), and on 2026-09-07 the callings × cells prototype ([THR-1399](https://linear.app/threadbare/issue/THR-1399)) measured that the readers band opens three subsystems for 22 callings while the yield band opens none. Christian's two rulings that day — spread across systems, do not overcrowd; a living world is hyperconnectivity — flipped the band order and made this the first plan doc. The plan therefore cites decisions rather than making them; its own contribution is the *how*: which seam each reader lands at, and the one rule it writes into canon.

## Vision premises invoked

- **The living world / hyperconnectivity** (Christian, 2026-09-07, verbatim on THR-1399): the reason readers precede new cells. The plan's sharpening — a connection is a write *and* a read; a write nobody reads is a wire with one end loose — becomes the canon rule R6.
- **Mortal sovereignty** (non-negotiable): every reader here is a consequence of a mortal's own work landing on the mortal's own world. Nothing acts for the god. The THR-1400 flag about mortal surveillance feeding the god's detection pressure was decided *no* on THR-1397 and the plan keeps to it: `use × Network` is not in scope, and observe writes familiarity, never detection.
- **Balance is not symmetry** (2026-09-03): the readers do not equalise callings; they make the explorer's work *count*, which is a different thing from making it as productive as a magnate's.

## Alternatives considered

**A dedicated intelligence reader vs repointing at familiarity.** THR-1400 offered both: give `strategicIntelligence` an engine consumer, or write the `knows_of` edge the intelligence subsystem already consumes. The plan takes the second and keeps the first write for compatibility. Reason: `knows_of` has three live readers today (`clueLifecycle`, `strategicActionLifecycle`, the encounter side's familiarity terms) and a schema row; a new consumer of the private record would be a second familiarity system by accretion — the THR-614 failure shape.

**Clue precision: always located, or by band.** Always-located turns observe → delve into a free door: one survey, one dungeon. By-band makes it a climb (vague → narrowed → located over repeated or lucky surveys), which the delve layer's own decay (`CLUE_MAX_AGE`) already assumes. The plan takes by-band and names the table as a constant so the climb's steepness is a number.

**The toll: a share of volume, or a flat trickle.** THR-1397 named the operation as "a cut of route volume each trade tick". A pure percentage on a `volume` that decays to zero produces a toll that reads as noise; a flat trickle ignores the route's worth. The plan takes flat × `max(1, round(volume × taxRate))` — a busy route pays more, a dead one pays the floor — with every term a constant. Rejected: paying per *trade event* (would require hooking `executeConductTrade`, which fires for the route's own holder, not the tolling seizer).

**Tithe to factions too.** Rejected: faction treasuries already move in `phaseFactionActions`; paying factions from this pass would double-count and the rider says *mortal* holdings yield. `controls` edges from faction nodes are skipped explicitly, and the army-supply fix (R5) is the mirror: a mortal's control edge must not read as a faction's either.

**Ruin → delve: through a clue, or directly.** Directly admitting any mortal-ruined settlement as a delve target would make every warlord a dungeon architect within the hour. The plan keeps the delve layer's located-clue requirement and only widens *which locations qualify*, after a decay window — so a wanderer still has to find the ruin (R1 on the ruin class) before delving it. The window is a constant; three days is a guess the census can move.

**Spell price: quintessence directly on the node, or through the pending events.** Writing `quintessence` from `payCosts` would bypass `phaseQuintessence`'s accumulation, clamp and threshold logic — the exact machinery the reader exists to reach. The plan returns the price from `activateSpell` and lets the cell push a `QuintessenceEvent`. Cost: the templates-model path (pre-flip) loses the doom charge with no replacement for the flag's remaining life; recorded as an executor note and a TODO tied to the flip ticket.

**Move or add on the doom charge.** NFP #6 says add; the map's decision says *move it there*. The plan moves the `doom_increase` cost and leaves `health_sacrifice` on `doom` — the split is by what each cost *means* (spirit vs body), which is the narrative reading, and NFP #5 outranks #6 when they pull apart.

**Wealth on the sheet: this ticket or its own.** The rider says wealth must be inspectable before any yield ships; R3 moves wealth. Splitting the sheet line into its own ticket would either block R3 on it (a dependency for a two-component change) or ship R3 in breach of the rider. The plan carries the sheet line. It is the smallest UI pillar that satisfies the rider: one word, one tooltip, two components.

## Tensions surfaced

- **The crowded settlement gets one more reader (the tithe).** R3's Location tithe is an economy write on the most-touched kind. Accepted because it is the passive half of a decided cell (claim × Location) and because it adds no *cell* — the crowding measure is callings-per-cell, and the tithe adds none. The band order still puts the active yield cell last.
- **Precision by band leans on `ctx.outcome`, which the resolver does not carry today.** If the lifecycle cannot hand the band over cleanly, every reader falls to the plain-success row and the plan still ships; the executor note says exactly that so the gap is a closeout line, not a stall.
- **Two wiki pages will trip the freshness gate** (`undertaking-grid`, `armies-battles-reference`) and probably two more. Listed in Done-when so the executor plans for it rather than meets it at push.

## What the census should watch

- Whether `narrowed` clues ever mature into delves without a second survey (if never, the by-band table is too steep).
- Whether holding income moves any mortal across a wealth tier inside 150 ticks (if never, the constants are decorative; if every magnate hits *Magnate* by tick 60, they are loud).
- Whether the Seeker under discovery now reaches ≥ 3 systems through built work (the gate this band exists to pass).
