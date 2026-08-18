### THR-733 — company drama, subject 2 of 4: Two Roads Named (the leadership dispute)

Resumed from the checkpoint left by the subject-1 pass. That pass established the scoping
fact and it still holds: a new `encounter.*` id cannot join `RETROFIT_PENDING` (the ratchet
only shrinks), so every subject owes the **full Composition Contract** on the day it lands.
`check:encounter --all` on entry to this pass read **`checked 192 · clean 7 · on ratchet 185`**;
on exit it reads **`checked 193 · clean 8`**. One subject complete per pass is the cadence the
evidence supports, not a shortfall against it.

**Subject shipped — Two Roads Named.** A company at a fork with an hour of light left, and
two of its members have named different roads and neither has moved. One **Gold** step
("Settle the road"), a five-card hand spanning order/mind/spirit/light plus one common
option, and five authored outcome bands. Verdict: **clean, systems
`cast, rewards, seeds, conditions, reputation`** — five connections against a quota of three.
The corpus's eighth composition-complete template.

**Why Gold and not Heart, recorded because it is the reusable half.** The subject is *who the
company will follow*, which is standing and influence — the Patron ↔ Extractor axis, where
winning the road either leads the company or takes it. Heart is the bond itself and stays
reserved for this file's romance subject. The checkpoint flagged that call; this is the answer.

**The settings are disjoint from subject 1 on purpose, and the suite enforces it.** The Gate
Held is `ruin + stronghold`; this is `wayside + rural`. Both templates are group-exclusive
with identical member gates, so a copied `settings` block would make them interchangeable and
the corpus would draw the same company scene twice at every location. A new test asserts the
two register at disjoint places — and it was **falsified before being trusted**: giving the
dispute a `ruin` setting *with an opening supplied* turns that one assertion red by name
(`1 failed | 16 passed`), and reverting restores 17 green. The first falsification attempt
tripped the opening-per-class guard instead, which proved a different rule and not this one;
the arm was re-run properly rather than counted.

**Three gate iterations on one chip, and the trap is worth stating.** The `critical_failure`
ending's honest write is a standing move plus a planted seed. The chip cannot report either
directly:

1. **`reputation_tally` is barred as a chip kind** (Law 13 visibility parity, THR-1136 §5) —
   the tally keeps running and keeps minting its threshold traits, but the number renders only
   in the designer's `TalliesDebugTab`, so a chip reporting it claims a quantity the player
   cannot inspect. The standing sentence moved into the band `overview`, which claims nothing.
2. **A seed cannot be its own referent.** Reporting the seed as a PATH is correct under Law 56
   — an offer that comes round again is exactly what PATH is for — but a seed has no node to
   open until it fires, so the concept naming it anchored nothing (clause 2).
3. **Dropping `concepts` is not the escape hatch**, because Law 2 requires them. A chip with
   neither `stateNoun` nor `concepts` is outside clause 2 by design; a chip with `concepts`
   and no anchor is a live-looking link that goes nowhere.

The resolution is the one honest anchor available: the band's reaction writes a `hidden_mark`
**onto the wayside witness**, a declared cast member, so the concept points at
`$cast:wayside_witness` — the object the ending actually wrote and the one thing on the chip a
player can open. Logged as impediment **#669**, because the three rules are individually
documented and their interaction is not.

**Cast exists to carry a write, not to decorate.** The wayside witness is
`lazy-materialize-on-trigger` / `must-persist` with `reuseNpcRoles: ['wanderer', 'merchant']`,
for the THR-1165 reason the subject-1 pass recorded: an inherited bind-only default lands the
mark on whichever ambient figure happens to exist, and on nobody at all otherwise.

**The seed is what makes "movement dissent" systemic rather than asserted.** Three of the five
bands re-plant this template at `COMPANY_DISPUTE_RETURN_DELAY_TICKS` (60, ~5 game days —
deliberately much shorter than the gate's 156, because a dispute closed rather than settled
does not need time to travel, it needs the next fork). A question carried is a question that
arrives again.

**Evidence.** 1033 files / **16,799 tests green** (exit 0, redirected not piped — never through
`tail`). Typecheck ratchet **OK — 3160, unchanged from baseline**, so no baseline refresh and
no re-run owed at the end. `npx vite build` ✓ in 13.22s. CLI smoke `tick 30` → tick 30, **384
agents, 46 events**, no exceptions (Done-when item 2). `check:encounter --all` →
`checked 193 · clean 8 · failing 0`. No browser evidence owed and **no exemption claimed**: the
diff is two files under `src/data/`, and nothing under `src/components/`, `src/hooks/`,
`src/contexts/` or `src/index.css` is touched.

**One defect found and filed rather than fixed here.** `src/data/encounters/apotheosis-ascension.ts`
attaches `trait.condition.grieving` on two bands, and that id is **not** in
`CONDITION_TRAIT_DEFINITIONS` — the only source that seeds condition trait nodes. The
`condition_attachment` arm in `encounterAftermath.ts` fails soft with a `template_missing`
trace and writes nothing, so a chip there reports a state no write produced. Filed as a
Deferral; it is a Law 56 breach introduced by the ticket that was fixing Law 56 breaches, and
it is out of THR-733's scope.

**Remaining on THR-733:** romance, the slow-burn betrayal. The file is built to take them —
append to `COMPANY_DRAMA_TEMPLATES` (already mapped through `compileOpeningEnvelope`) and add
the id to the suite's reachability block; the content-integrity block iterates the export and
picks a new subject up on its own. Two judgement calls stand: **romance is Heart-reach** and
must earn a company frame rather than being a two-person moment with an audience, and **the
slow-burn betrayal** is the subject most likely to want a threshold-fired pool — if it only
works that way, split it into its own Deferral rather than growing an engine change into this
content sweep.
