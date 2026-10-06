# Brainstorm companion — Divine economy shared prerequisites (THR-1747)

Companion to [`2026-10-06-thr-1747-divine-economy-shared-prerequisites.md`](2026-10-06-thr-1747-divine-economy-shared-prerequisites.md). The thinking behind the five calls, the alternatives that lost, and the Vision premises they lean on. Authored by the design lane (unattended), 2026-10-06.

## Vision premises in play

- **Attention is a spend, not a browse.** A thread should cost something — but a cost the god can carry. Today's cost is not a choice, it is a wall: one Devoted thread pins the primary sphere at zero for the whole run (THR-1745 Model 0). The retune keeps threads a net cost (0.1 yield vs 0.1–0.5 upkeep) and makes that cost affordable.
- **Dominion (Christian, 2026-10-05).** Home turf should pay; spending through a sphere should build infrastructure that pays back. The ledger in the plan is the loop in miniature: base plus seat carries one deep thread or two Champions; a deeper retinue needs held ground.
- **Story over spreadsheet.** Every number the player feels must reach them as words (UI Law 13; PC-1). The source row says "costs a little … gives back more", never "−0.15/tick".

## Alternatives considered

### Thread upkeep
- **Keep 0.5 / 1 / 2 / 4, raise thread yield instead.** Rejected: THR-1745 B's per-tier yield is Model B's thesis and belongs to the Dominion core (a Held mortal yields more), not to a shared prerequisite.
- **Flat upkeep (0.2 at every tier).** Rejected: removes the reason deeper threads draw rival attention *and* essence; the ladder should still bite at the top.
- **The filed numbers (chosen).** Measured in the ledger: positive margin at one thread through tier 4 and at two through tier 3, negative at two tier-4 threads without ground. The negative row is a feature — it is the first place the player needs a source.

### The Wellspring
- **Keep it in the pool but raise its weight.** Rejected: still a lottery, still a long tail.
- **Grant the source verbs in the spine.** Rejected: the spine is the onboarding arc and THR-1608 already found it overloaded.
- **Milestone at bond + 48 (chosen).** Same beat as the rival wake: the moment the world turns hostile is the moment the god learns to hold ground. Uses the existing milestone slot discipline, so it never interrupts the spine and takes the slot a cadence beat would otherwise have used.

### Retirement
- **Retire every beat kind once grants are held.** Rejected for now: selection beats offer a choice whose meaning may survive held cards; introduction beats bind a culture/faction subject. Investment beats are grant-only (verified: no `aftermathConfig` on any pool template), so retiring them is lossless.

### Source upkeep consequence
- **Unpaid source loses income.** Rejected: a source consecrated to the primary sphere would starve the pool that pays for it — a death spiral the player cannot read.
- **Unpaid source lapses control.** Rejected: the ticket says "never lapses a source in one tick", and lapsing over several ticks adds a timer the player cannot see.
- **Unpaid source stops growing (chosen).** The thread rule's analogue; readable on the row; recoverable the moment income returns.
- **Charge in its own phase instead of `phaseEssenceSources`.** Considered. Not needed: the earned counter only banks positive net movement per phase, and `phaseEssenceSources` grants nothing, so a debit there is a pure spend.

### The orphaned cards
- **Fold them into the existing source milestone.** Rejected: ten cards in one modal.
- **Spread them across thread-tier milestones (Model B).** Rejected here: that is the Dominion core's shape to decide.
- **One held-ground milestone at two flowering sources (chosen).** Thematic (you have made ground flower; now you can hold it outright), mid-run under the retuned economy, and leaves Model A's 3/6 ladder unspent.
- **Fix Place of Power's missing writer in this ticket.** Rejected: three honest options, each with a different meaning for the card; filed as THR-1751 so the Dominion core can weigh it.

### Timing comments
- The ticket assumed 1,080 ticks = 90 days. The season calendar the player reads says 1,080 ticks = three years (90 ticks a season). The two clocks are both real (`TICKS_PER_DAY` paces attention and prose day-counts). Only the doom comment's "at 12 ticks a day" is wrong. Correcting the promotion comments to "days" would have introduced the error, not removed it.

## Tensions left open

- **The two clocks.** 12 ticks a day × 30 days ≠ 90 ticks a season. Whether a calendar day should mean 3 ticks or 12 is a separate question, not raised as a ticket because nothing player-facing has been seen to contradict itself yet; noted here so the Dominion UI work does not pick a side by accident.
- **Wellspring before the player has a source in reach.** The six latent sources per map may be far from the god's ground; THR-1745 Model A's per-Area seeding answers that and belongs to the Dominion core.
