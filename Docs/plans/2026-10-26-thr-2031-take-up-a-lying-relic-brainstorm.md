> **title:** Brainstorm companion — take up a relic that lies unclaimed — THR-2031
> **linear_issue:** THR-2031
> **author:** Claude Code (design lane, run 2026-10-26a, unattended)
> **created:** 2026-10-26

# Brainstorm companion — take up a relic that lies unclaimed

Companion to [the plan](2026-10-26-thr-2031-take-up-a-lying-relic.md). This page records the paths weighed and the tensions behind the decisions.

## The three candidate paths the ticket named

1. **The Unclaimed Relic encounter binds an existing `lies_at` artifact before it spawns a new one.** The scene's title fits. But the scene's spine describes one object: *"a magic relic lying in the open: black iron, freezing cold"*, and its chronicle line names *The Cold Reliquary*. A past god's relic named *The Hollow Bell*, of Life and Spirit, would be told as cold iron. That is the prose-says-one-thing, world-does-another failure the Prose Doctrine forbids. Rewriting the calibration-case scene's prose is out of reach of a lane decision (it was approved in chat as the calibration case, 2026-08-25). The scene is also a rarity-1 open draw at four setting classes. A relic site is a ruin **or a wild place** (`seedEchoes.ts:62`), and the scene declares no wild class. Getting it to fire at one specific ruin would need a draw lever that fights the cap stage. Rejected.
2. **An undertaking target.** The Undertaking Grid already has the cell: **Claim × Item**, ruled *wanted* by Christian on 2026-09-03 with exactly this purpose in its note. The cells model is live, item cells complete in ordinary worlds, and two ambitions are natural homes for it. Chosen.
3. **A seed or draw drawn to the relic.** It would work, through a personal-offer entry for mortals near the relic, but it is a second door to an act the grid already owns. It would also need an authored scene, which means a full encounter-pipeline run for one object. Rejected for this slice. If a playtest shows the take-up is invisible because no one watches an undertaking, a scene that *frames* the cell's completion is a later, separate idea.

## Tensions

- **Remote work vs. "picking something up".** Picking up an object reads as a physical act. Every undertaking in the game is worked remotely, though: a town is founded, a place claimed, a monster hunted, all as projects whose duration stands for the travel. Making this one cell need presence would put a new movement rule on one verb. The prose carries the journey instead: *"has set out for {place}"*, *"came out of {place} carrying {object}"*. It is a veto line.
- **Who should want it.** The god's own First might seem the natural taker, since the player wants the relic back in friendly hands. But undertakings are mortal-chosen. The god does not direct them. The two ambitions picked are the seeker and the wanderer, because the grid's note puts claim × Item at the end of the treasure hunt (observe a ruin → clue → map → delve → claim). Rivals racing for a past god's relic is good drama. The Dominion read then follows whoever won, which gives the player a reason to care who that is.
- **How fast it goes.** With 20 seekers and 13 wanderers alive at day 20 on seed 42, a relic might be taken in the first days of a run and never be seen lying. The kill criterion covers that: keep the seekers, drop the wanderers, then drop both.
- **The `contains` branch of `spawn_artifact`.** Its place branch writes `contains` location → artifact, which is the shape THR-2030 rejected. No content uses it (one test does), and it shares a file with [a road's encounters](https://linear.app/threadbare/issue/THR-2046). It stays out of this slice so the two builds do not collide. Moving it to `lies_at` is a one-line follow-up for whoever first authors a location-targeted spawn.
- **What the dead leave behind.** A dead mortal keeps their `possesses` edges. Nothing drops a relic where its bearer fell. That would be the second source of things lying about. It is out of scope: inheritance is its own design.

## Vision premises leaned on

- What one age leaves becomes play in the next (The world remembers, Decided 7).
- The relationship is the edge (non-negotiable 4): the take-up moves one edge for another, and no property records "who has it".
