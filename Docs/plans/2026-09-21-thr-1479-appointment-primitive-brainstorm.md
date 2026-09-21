# Brainstorm companion — Appointment primitive (THR-1479)

*Companion to `2026-09-21-thr-1479-appointment-primitive.md`. Considered alternatives, tensions, and Vision premises. The exploratory record is the vault draft `Brainstorms/2026-09-12-appointment-primitive.md` (status: complete); this file carries what the promotion decided and why.*

## Alternatives considered

**A. Intent-like state on the mortal plus a placed seed (the vault draft's shape).** Two records of one fact. The relocation intent already showed what a lean-only record buys (THR-1142: aimed at an empty place it barely steers) and what two writers cost (drift between the intent's expiry and the seed's due tick). Rejected: the seed is persisted, evaluated, carries the cast and is the thing that fires — it is the appointment. The promise is a separate *thing* (a favour), which is why it is a separate edge.

**B. A new `appointment` node type.** Would give the chip a page to link and the grid an object. Rejected under the load-bearing rule (no new node type without full design) and because nothing it would hold is missing from the seed plus the favour edge; the chip links the *place*, which has a page.

**C. A new Agreement class `appointment` in the world-object registry.** The ticket's table says so. The registry's classes key on edge type and each edge type sits in exactly one class, so an appointment favour on `owes_favor` cannot be a second class without a property-discriminated extension. Rejected as unnecessary: a favour of a particular shape, read by `isAppointmentFavour`, gives the sheet and the grid everything; the handoff amends the ticket's row.

**D. Hard movement — set `MovementState.destinationId` directly at departure.** Certain arrival. Rejected: it is the second movement path THR-1142 forbade, and it removes the fork the ruling requires (a mortal who *cannot* be outvoted by a burning village cannot choose to miss). The journey candidate through `scoreMovementCandidate` keeps the walk watchable and the choice real.

**E. Breach machinery on the attachment-layer agreement (`AgreementProperties`).** The vault draft's "agreement gains an on-broken consequence". Two agreement layers exist (attachment-category agreements with `ticksRemaining`; world-object Agreement edges). Building breach on the attachment layer would leave the grid's Agreement kind unable to see it. Chosen: the world-object edge, which the grid, the sheet's favours row and `isLiveAgreement` already address. The attachment-layer catalog entry survives for other users.

**F. Pull always on, from plant.** Simplest. Rejected: a mortal leaning toward a crossroads eleven days early is a mortal who does nothing else; the horizon constant is what lets life continue.

**G. `use × Agreement:appointment` as the keeping cell.** Rejected: keeping is a journey the decision phase makes, not a work at a site with checkpoints. A cell that "keeps" would double the mechanism.

## Tensions surfaced

- **Certainty vs. the fork.** Every constant that makes keeping more certain (`JOURNEY_PULL`, `PULL_WEIGHT`) makes missing rarer, and the ruling wants missing *possible and personality-driven*. The margin formula's negative range is the guarantee; the kill criteria watch the keep rate from both sides.
- **Halts as price.** A long journey can halt a running undertaking out. The plan accepts it (the checkpoint machinery already prices absence) and names it in the chronicle rather than protecting the work — a mortal who chose the meeting over the work is a story.
- **Two "agreements".** Named plainly in the substrate table so nobody builds breach twice. UL seats **Appointment** beside Seed and says the promise is a favour owed.
- **Quota arithmetic.** An appointment seed earning `seeds` + `appointments` + `content_query` would reach the composition quota with one effect. Capped at two by having `appointments` replace `seeds`.
- **The last die floor.** THR-1489's comment measured that a third floor on die B turns the die into a checklist. Appointments take the second; the plan says no third.
- **Reachability is not connectivity.** `catalystQuery` passed every hook and no player will meet it. The census row is the plan's answer, and it is the one row the ticket's table lacked.

## Vision premises invoked

- `00-north-star.md` — witnessing, not steering: the god sees the mortal lean, go, wait, or choose to miss; the nudge is the existing card.
- `02-non-negotiables.md` #1 — forks are the mortal's: the leave margin reads their axes; the engine never forces the walk.
- `02-non-negotiables.md` #3 — prose never numbers: the due date is *"in four days"*; slack lives on the trace.
- Failure is plot — a missed meeting is a sequel with the broken promise on the sheet, never dead air.
- Prose rule 7b (THR-1476) — kept as law; the appointment block is its single lawful exception, enforced by the systems audit question.
