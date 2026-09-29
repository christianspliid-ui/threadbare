# Encounter Pipeline: The Well Sinking
> Scale: short (local) | Slug: well-sinking | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0

Critic loop 1 of 2, independent of the author. Fixes applied directly to `well-sinking.package.json` and recorded under "Critic revisions" in the draft. No `-revised.md` file: under this batch's critic contract the package is the revised artefact.

**Orchestrator decision applied first:** the sequel ids are now `town.well_first_water` (kept) and `town.well_gone_foul` (missed), outside the `encounter.` prefix (the `hunt.trail_cold` precedent). No prose named the old ids, so the rename touched only the appointment block, the package doc block and the draft doc.

## 1. Prose Quality

The draft is plain narrator prose with a clear craft stake and a readable race (two shafts, one spring, rain tonight). It had eight defects, all fixed:

- **Seam echo, opening→spine (trigger 22).** Rural P1 "to sink the new well the village has paid for" ran straight into "Half the fee has been paid in advance". [EDITORIAL REWRITE] P1: "{actor} comes into {location} to sink a new well for the village." This mirrors urban P1 ("…for one of its streets"). The payment is stated once, in the spine.
- **Stake over-claimed (a trigger 25/26 edge).** "If the new shaft breaks into one, it caves in and the advance is lost." Step 0 is `continue_weakened`, so a plain step-0 failure breaks into a shaft and the job still goes on to a lined well. The sentence was false on that path. [EDITORIAL REWRITE] "If the new shaft breaks into one, it can cave in and waste the advance."
- **"Old" three times in one paragraph.** "old well… old digger… old workings". [EDITORIAL REWRITE] "For years, a digger sank shafts under this plot and marked none of them."
- **Afterimage contradicted the band (conflict, trigger 35 class).** The step 0 critical_failure afterimage said "half the day went to starting again". But a step-0 critical_failure ends the action (`advanceStep`: critical_failure forces `fail_action` whatever the step's failBehavior), so nobody starts again. [EDITORIAL REWRITE] "They broke into an old shaft, and the sides caved in and filled everything they had dug."
- **Fragment echoed the afterimage.** Bind The Sand's critical_success fragment ended "by noon", and the step-0 critical_success afterimage also ends "down by noon". Both render on that band. [EDITORIAL REWRITE] "The walls held like packed clay, and not a spadeful slid back in."
- **Band overviews retold the step-1 afterimage.** On success the afterimage "…it stood when the rain came" was followed by the overview "The lining stood through the rain." On failure "…the sides slumped in the night" was followed by "The sides slumped in the night and filled the shaft." Each overview now carries only what the lining *led to* (the spring, the lord's well, the advance). See § 6b.
- **Band overviews not true on every path into the band.** The critical_success overview said "The lining went in to the top before dark", but critical_success is also reached by a step-0 critical plus a plain step-1 success. The success_at_cost overview said "the extra stone that finished it came out of the advance", but most at-cost runs come from a step-0 failure, where no extra stone was bought. The critical_failure overview described the *lining* collapsing and "the lord's well", but a step-0 critical_failure never reaches the lining, and on that path the lord's well was never introduced. All three were rewritten to hold on every path (§ 6b).
- **Omen hooks said "the village" on urban runs.** Both `emit_omen.narrativeHook`s now say "the people who paid for it". The failure chronicle line (`narrativeTemplates.failure`) dropped "overnight" and "the lord's well" for the same path reason: "The shaft fell in, and the new well was never finished."

Opening plus spine is now 77 words (rural) and 79 (urban).

## 2–5. Branch / scale / anchors

The encounter is linear, with 0 branches: dig the shaft, then line it before the rain. That is the right fit for the Appointment shape at `local` scale. Both steps test Stone and are about Stone work. `hook.mad_artificer` (the old digger's unmarked shafts) really does shape step 0 and its memory card, and the friendly-rival die really does produce a card (Sway The Neighbour). KEEP 0.

## 6. Aftermath Payoff

The aftermath centres on the actor and names its people: the reeve pays, the wright vouches, and the village judges the work. A win gives the place's regard, a Fellowship membership, and a real appointment where the fee is paid. A loss costs standing and the advance. Cool failure: money and standing only, and nobody is hurt.

## 6b. Page read (assembled per band, scar · bond · boon · path; no reactions authored)

- **critical_success**: "The spring came to {actor}'s shaft first, and the lord's well on the next plot stands dry. {cast:wright} came over in the morning to look down it." · BOND reputation with {location}: "A clean job — {location} thinks well of their work." · BOND a guild membership: "Vouched for by {cast:wright} — {actor} is on the rolls of the Builders Fellowship now." · PATH appointment: "The shaft stands — {cast:reeve} pays the rest at the well when its water runs clear." Clean. The wright's morning visit sets up the vouch. *Fixed:* the old cause "Lined before dark" was false on the step-0-critical path.
- **success**: "The spring came into {actor}'s shaft, and the lord's well on the next plot stands dry." · BOND "Lined in time — …" · BOND membership · PATH. Clean.
- **success_at_cost**: "The spring came into {actor}'s shaft, but the work went wrong in places and used up most of the advance." · BOND "Lined in time — …" · BOND membership · PATH. Clean. *Fixed:* the old BOND cause "Paid for the last courses" paraphrased the old overview's "extra stone… came out of the advance" (repetition). The old closing clause "starts the wait… short of money" asserted a money state that nothing writes (rule 31 class), so it was cut.
- **failure**: "The spring went to the lord's well, and the advance went into the ground with the shaft." · SCAR "Unlined at nightfall — {location} thinks less of their work." Clean. The failure band is reached only through a step-1 failure, so the lord's well is always introduced.
- **critical_failure**: "{location} counts the advance it paid as thrown away." · SCAR "A shaft that fell in — {location} thinks less of their work." Clean, and true on both paths: the shaft caving while digging, or the lining collapsing in the rain. The overview carries the money and the chip carries the regard, so neither repeats the other.

No `[page]` warning remains in the scratch `check:encounter` run (0 warnings).

## 7. Dilemma Energy

This is a craft race, not a moral fork, which is the right weight for everyday journeyman content. The god's posture shows in *where* it pushes: on memory (the reeve), ground (the walls), weather (the rain) or a neighbour's goodwill. The last one has a real cost that the fiction shows: the lord's well goes unlined an hour longer.

## 8. Experience Differentiator Gate

1 YES (P1 arrival · P2 the foul well, the advance, the reeve · P3 the unmarked shafts; ≤80 words) · 2 YES · 3 YES (reeve, old shafts, walls, wright, lord's well, spring, rain: each is acted on by a card or a chip) · 4 YES: "sink a paid-for well through bad ground and line it before the rain beats a rival to the spring" · 4b YES (after fixes: opening→spine "paid", fragment→afterimage "by noon", afterimage→overview on success and failure) · 5 YES: renamed onto the verb lexicon: *Wake The Memory* (was Recall The Workings), *Hold Off The Rain* (was Delay The Storm; "storm" was never introduced, since the scene has rain), *Sway The Neighbour* (was Borrow The Stone). No effect line repeats a word from its name. · 6 YES (all essence-priced; each line states the mechanism) · 7 YES (every card has a failure fragment; none reaches Δ0.15) · 8 YES · 9 YES (four questions: memory, ground, weather, goodwill) · 9b YES (2 specials + deal on each step; no step asks for a branch or an ending) · 10 YES · 11 YES: the nouns are `reputation with {location}`, `a guild membership` (the toll-of-blades precedent), and `appointment` · 11b YES (§ 6b) · 12 N/A (local) · 13 N/A · 14 YES (a lone new well-head beside a dry half-lined shaft, rope coiled on its lip: residue of a race, not the race).

Automatic REVISE triggers 1–35 were walked. Triggers 22, 25, 33 and 35 fired on the draft, and all four are fixed above. Trigger 34: the spine's "The rest will be paid at the well on the day its water runs clear" and the PATH chips are place-and-time promises. Both are lawful, because they sit on the appointment's path: the promise is conditional on a lined well, and every lined-well band plants the appointment (with a missed branch). No other later-tense sentence remains unbacked. Trigger 31: the reeve holding the fee is scene-local fiction, not asserted world standing. The vouch is scene fiction that motivates a real write (the join), which is precedented.

## 9. Verdict

**PASS WITH REVISIONS** (applied). The scratch `check:encounter` run over the package shows 0 warnings. Its only failures are the two `[liveness]` rows for the unauthored sequels `town.well_first_water` and `town.well_gone_foul`, which the orchestrator owns. The dry-run compile is clean.

## 10. Revision Summary

Must fix, all done: three seam echoes, three band overviews that were false on some path into their band, one afterimage that contradicted its band, an over-certain P3 stake, three card names off the verb lexicon (one naming an unintroduced "storm"), and "village" on urban omens. Consider later: nothing at the editorial level.
