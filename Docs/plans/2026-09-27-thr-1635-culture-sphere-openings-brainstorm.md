> **title:** Brainstorm companion — culture and spheres showing through — THR-1635
> **linear_issue:** THR-1635
> **author:** Claude Code (design lane, run 2026-09-27b)
> **created:** 2026-09-27

# Brainstorm companion — culture and spheres showing through

Companion to `Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md`. The *what* was settled by [Culture and spheres showing through](https://linear.app/threadbare/issue/THR-1599). The considered alternatives recorded there (per-template culture openings, word substitution, setting envelopes only, keying on venerated sphere) are not repeated here. This page records the *how* choices the plan made, and what each gave up.

## Vision premises in play

- **The world is lived in, and it is not about you.** A stranger passing through reads the *town's* custom. That is why the key is the place's culture, never the actor's.
- **Narrate, never inhabit** (Doctrine v2). The line states a fact that changes the test: who may act, what it costs, who is watching. It never describes a mood.
- **Tension: variety against sameness.** Ninety-six culture lines across ~500 encounters means a player in one town sees the same culture line for every encounter of one reach. The decision accepted that: within one town, a repeated custom *is* the culture. Its "would change the call" names more variants per cell as the fix if it reads as samey.

## Choice 1 — identity axis or coloration axis

- **Identity axes** (`place`, `counterpartRole`, `setting`) multiply the surface count and feed `computeSurfaceKey`, which the selection engine uses for surface identity and repetition. Making culture an identity axis would make the same encounter in two towns count as two surfaces, which changes selection weighting, a *mechanical* effect of a prose feature.
- **Coloration axes** vary the reading without identity. The fragment module's header already lists sphere and omen vocabulary as this kind.
- **Taken: coloration.** It keeps the feature prose-only, which the decision implied ("the line changes what the test is about", not what fires).

## Choice 2 — compiled token or render-time append

- **Render-time append:** no catalog edits. But every step-0 renderer would need to know it is rendering step 0: four stage adapters and the resolution record, five sites that could drift.
- **Compiled token:** one module-load pass (the `compileOpeningEnvelope` shape), and the existing `enrichProse` path does the rest. Designers can see the slot in the CMS package view.
- **Taken: the token**, with a guard test over a named universe as the contract. The risk is a catalog the pass never reaches; the guard fails loudly on that, as `settingClasses.test.ts` does for openings.

## Choice 3 — sphere table scope

- **Author all 12 spheres:** 192 lines, about 80 of which would never fire. On both seeds, force, mind, spirit, order and chaos never dominate a place.
- **Taken: the seven observed**, plus the four order cells the prototype already wrote. The trace's `sphere_cell_unauthored` reason makes a future miss visible rather than silent.

## Choice 4 — word budget

- The opening budget is 80 words (Doctrine v2, `NUDGE_WORD_BUDGETS.opening`). Counting the added line against it would push the checker's warnings onto every tight opening, for a line the author did not write.
- **Taken: a separate 28-word row.** This keeps Doctrine v2's 80-word opening honest for what an author writes, and bounds the addition independently.
- **Open to veto:** Christian may prefer the whole composed opening to stay under 80+ε. That is a tuning call on a named constant, not a redesign.

## Choice 5 — holding out the slice encounters

- The five slice encounters are the ones Christian is reviewing right now ([THR-1220](https://linear.app/threadbare/issue/THR-1220)). Adding a line to them mid-review changes the thing under review.
- **Taken: hold them out** by prefix, released by one constant change when the checkpoint closes.
- **Cost:** those five are the encounters most players meet first, so the feature is least visible exactly where it would be most visible. The trade favours a clean verdict on the slice.

## Choice 6 — slicing

- **One ticket:** ~170 new prose lines ride with an engine carrier, so the carrier waits on prose, and the prose is authored under a different rule (the corpus writer, not the builder).
- **Taken: two slices.** The carrier ships with the prototype's cells and degrades to no line elsewhere. The prose follows as its own ticket.

## What a playtest should watch

- Whether players read the added sentence at all. The decision's third "would change the call" is a read test that shows players skip it.
- Whether one town's repeated custom reads as texture or as a stuck record after about five encounters.
