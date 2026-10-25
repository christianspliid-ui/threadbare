> **Brainstorm companion** for [`2026-10-25-thr-2040-famine-and-glut-draws.md`](2026-10-25-thr-2040-famine-and-glut-draws.md) — THR-2040. Design lane, run 2026-10-25f.

# Famine and glut draws — brainstorm

## The question

The money-encounter outcome table (THR-1872) asked which economic condition should make each money scene likelier. Boom and bust were already wired through prosperity (THR-725). Famine and glut were not. What should "famine" and "glut" mean to encounter scoring, and which scenes should lean on them?

## What the census settled

Seeds 42 / 99 / 7, medium map, 360 ticks each (`scripts/larder-census.ts`, branch `proto/thr-2040-larder-census`):

- A town is hungry on about 4 % of its days. **76 % of hungry town-days are not in the prosperity bust band.** Prosperity is a slow composite of stock balance, routes and unrest, so a sharp food shortage rarely drags it under 30 before it ends. A famine draw therefore cannot be expressed as "more bust weight". It needs its own reading.
- A *surplus day* (store full, town at its size cap, food left over) happens on 42–67 % of town-days. That is a settled town's resting state, not a glut. Raising the bar to a food balance of 0.75 on top of a three-day run leaves 13–37 % of town-days, and the term grades from zero at the floor. So a town only reads strongly as glutted where yield is near double its need.

## Options weighed

**Famine.**
- *A scarce staple at the stock tier* (the research's literal wording). Rejected: with the settlement economy live, hunger is read from the food store, and the stock tier is the fallback (`isHungryToday`). Two hunger tests would disagree on the same town on the same day, and the Fortunes sentence would contradict the scenes.
- *The scarcity arc's phase* (shortage → flashpoint). Rejected as the main reading: the arc is capped world-wide (`SCARCITY_ARC_MAX_ACTIVE`), so most hungry towns carry no arc (seed 7 had none at all over 360 ticks while 7 towns went hungry).
- **Chosen: `isHungryToday` graded by `hungerDays`.** It is one hunger, the same one the unrest, Restless and Fortunes systems read (Law 43: one concept per thing the player learns).

**Glut.**
- *`foodSurplusDays ≥ 1`.* Rejected: true on most days of most towns.
- *A surplus staple at the stock tier.* 23–32 % of town-days. Kept as the fallback only, for the same one-reading reason as famine.
- **Chosen: a three-day surplus run at a food balance of at least 0.75, graded.** That is "grain with nowhere to go", which is what the settlement economy's surplus routes also answer.

**Where the term lives.**
- *Fold it into the prosperity term.* Rejected: the debug readout could no longer say whether poverty or hunger moved a pick (NFP 2).
- *Per-template tags plus a new filter.* Rejected: a hard gate would hide scenes (Law 44's spirit: conditions enrich, they do not decide what exists), and the affinity table is the existing generic seam (Law 42).
- **Chosen: two optional weights on the existing affinity row, and a second additive term.**

**The granary riot.** It is famine's most obvious scene, and that is why it stays out. Hunger and unrest seeds it from the arc and from Lawless-while-hungry. A board weight on top would make one town's hunger riot twice.

## Tensions noted

- **Scale.** The term rides at THR-725's 0.15 weight. That is a lean, not a takeover: a famine scene in a starving town gains up to +0.15 (or +0.30 with the bust term), against base scores that are typically several times that. If the census shows the lean too faint to move the shares, the dial is `LARDER_SCORING_WEIGHT`, not the code.
- **Dead mood tokens.** `{econ_adj}` / `{econ_noun}` / `{econ_atmosphere}` are resolved by `proseEnrichment.ts:970-972`, but no template in `src/data` authors them. That is a separate finding, not this plan's. Adding famine vocabulary to a dead seam would be the "written, never read" pathology.
- **The god's hand.** The rulebook says Bless the Harvest swells staples "toward glut" and Blight "toward famine". Whether those verbs move the settlement economy's food meters was not measured in this run, so the plan makes no claim that blessing a town now draws plenty scenes.

## Vision premises touched

- *The world at work* (rulebook quick reference): a hungry world should tell hunger's stories. Strengthened.
- *Knowledge enriches; it never hides* (Law 44): no scene is hidden. A festival in a famine is rarer, never impossible.
