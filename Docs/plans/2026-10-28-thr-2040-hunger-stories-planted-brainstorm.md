> **title:** Hunger's stories are planted — brainstorm companion — THR-2040
> **linear_issue:** THR-2040
> **author:** Claude Code (design lane, run 2026-10-27e, unattended)
> **created:** 2026-10-28
> **companion_of:** `Docs/plans/2026-10-28-thr-2040-hunger-stories-planted.md`

# Hunger's stories are planted — brainstorm companion

These are the alternatives weighed and the measurements behind the re-plan. The plan doc carries the decision. This file carries why the others lost.

## What failed first

The [first plan](2026-10-25-thr-2040-famine-and-glut-draws.md) added an additive `larderContextBonus` to `baseScore`, the THR-725 shape. The pickup built it and ran its census at weight 0.15, at 0.3, and at 0.3 with a separate board pull. Each time, the famine rows' share of firings in hungry towns stayed below their share elsewhere (pooled: 4.7 % on vs 4.0 % off, against 5.2 % in all towns). The kill criterion tripped and nothing shipped ([pickup comment, 2026-10-26](https://linear.app/threadbare/issue/THR-2040)). The pickup's finding 2 asked whether the famine scenes are even in the pool.

## What this run measured (proto branch `proto/thr-2040-pool-presence`, never merged)

A probe in `phaseAgentDecision.ts` and `encounterFilterPipeline.ts` records, for every encounter decision a mortal makes in a settlement, the template ids at each stage. The stages are: merged regional entries, each filter stage, the performance cap, the drawable pool, the top-5 shortlist and the board winner. The scripts are `_scratch-2040-pool.ts`, `_scratch-2040-stages.ts`, `_scratch-2040-depth.ts`, `_scratch-2040-scene.ts` and `_scratch-2040-seed.ts`.

- **Pool presence is a small loss.** Every filter stage before the cap keeps some famine row on 100 % of hungry-town decisions. The 40-slot cap (of about 220 templates) keeps one on 79 %, and the drawable pool holds one on 75 %.
- **The shortlist and the board are the big losses**: 75 % → 25 % → 8 %. The best famine row ranks 8th (median) and needs ×1.46 to reach 5th, though the p75 gap is ×3.8.
- **Depth is not the problem.** The median hungry run is 4 days (p90 7), a mean famine depth of 0.69. The median glut depth is 1.0 on 13,438 glutted town-days. The pickup's worry that glut is shallow does not hold on these seeds.
- An early single-seed run suggested the forecast window damped famine rows from *below*. The six-seed run refuted it. Most famine rows in hungry towns sit *above* the window (161 of 261), as scenes do everywhere.
- **A strong lean is flat.** A multiplicative pull at weight 0.75 (up to ×1.75) moved the famine share of shortlisted scenes in hungry towns from 5.0 % to 5.3 %, and its share of winners from 8.9 % to 5.4 %. The pull reached 99.7 % of famine rows there. Scores spread over orders of magnitude, so a lean small enough to leave other reasons standing reorders nothing.

## Options weighed

1. **A louder additive `baseScore` term.** *Rejected.* It never reaches the board on its own, and every multiplier before the shortlist scales its reach differently. Through [THR-2071](https://linear.app/threadbare/issue/THR-2071)'s context pull, `(base + C) / base` with a median base of 0.125, a term large enough to matter would pin famine rows at the ×2 cap.
2. **A multiplicative pull** (the THR-2068 `firstPathPull` / THR-1781 `whisperPull` shape, gate and board). *Prototyped, rejected on measurement* (above). A pull large enough to move the census (×3 or more) would override every other reason a mortal has for a choice, against Law 20's spirit that who the mortal is decides.
3. **A reserved shortlist slot.** *Rejected.* It would be a bespoke case inside scoring (Law 42), and nothing else reserves slots.
4. **Bypassing the forecast window for larder rows.** *Rejected.* Law 20. Hunger is not fate, a promise or a forced arrival.
5. **Seed the scene** when the town turns: one resident, one fitting scene, a cooldown. This is the granary riot's mechanism (THR-1934). **Taken.** It is the existing "a condition causes a story" seam, with one live user. It puts the story in the right town at the right moment instead of nudging odds the scorer swamps. The mortal still plays it at their own odds. The measured effect is in the plan doc § Why.
6. **Do nothing; famine scenes already win more often in hungry towns** (8.2 % vs 4.8 % of winners by the mortal's location). *Rejected.* Classified by the scene's own town, the gap disappears (8.9 % vs 5.2 % on 225 winners, too few to trust). The pickup's firing census showed the opposite on its seeds. The ticket's ask is that a hungry town *tells* hunger's stories, which today it does by accident at best.

## Tension with earlier lane decisions

- The 2026-10-25 decision record stands: famine is the town's hunger, and glut is a sustained surplus. Only the mechanism changes.
- [THR-2071](https://linear.app/threadbare/issue/THR-2071)'s decision 1 named the larder as a `baseScore` term that would ride its context pull. With seeding, the larder is not in scoring at all, so that plan needs no change and there is nothing to double count.

## Vision premises

- The north star's "watch what the world does next": a starving town's people live its hunger.
- Law 42: a second user of the riot's seed seam.
- Law 45: the seed label names a state the world really has.
- Rulebook § The World at Work: Bless the Harvest and Blight the Fields push staples toward glut and famine, so they now also plant stories in the towns they tip. That follows from the design and is not promised to the player.
