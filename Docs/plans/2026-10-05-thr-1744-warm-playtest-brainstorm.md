# Brainstorm companion — the warm playtest (THR-1744)

Companion to `Docs/plans/2026-10-05-thr-1744-warm-playtest.md`. The thinking that did not belong in the spec.

## What it is for, in one picture

The cold tester is a stranger at the front door. Two rounds of them have told us a lot about the front door, and nothing about the house. The warm tester is a guest who left the party an hour ago and walks back in. The opening is behind them, the world has moved, and the question is whether what they find reads as a living world with people, powers and a past. If it reads as a wall of panels, we need to know that too.

## Four ways to put a tester an hour in, and why three lost

**1. Let the tester play there.** Start cold, press Play, crank the speed to 20×, wait. It is the most honest route, because the tester lives through every tick. It fails on three counts, all measured:

- The First's important moments stop the clock ("Asks you", `ThreadsPanel.tsx:331`), so a 300-tick run is a series of interruptions.
- Each interruption spends the action budget on setup, not on the mid-game.
- At the 50 ms floor (`useSimulation.ts:210`), with tick cost growing as the population grows, a few hundred ticks is minutes of wall clock.

We would be measuring the opening again, with a long wait inside it.

**2. A saved world, imported.** It is the cleanest idea on paper: play an hour once, save it, and hand every tester the same save. But there is no save ("There is no save", `SettingsPanel.tsx:483`). The only export is the incident snapshot, and it has no import path. A full save/import means serialising the graph, the per-session runtime caches and the UI state, then proving they round-trip. That is a feature in its own right, larger than this ticket, and it would come with save/load expectations a player would then hold us to. It may be worth building one day for players. It is not worth building as a test fixture.

**3. Warm the browser before the tester arrives.** The harness opens the page, fast-forwards with a script, then hands the live browser to the tester over a CDP endpoint. It needs no game code. But the fast-forward script has nothing to call: `window.__DEBUG` is compiled out of production (measured on the live site, `typeof window.__DEBUG === "undefined"`). It would have to click Play and dismiss pop-ups by coordinate, which is fragile. It also breaks the tester's `--isolated` browser, which is part of why cold testers are trustworthy.

**4. A URL lever that warms the world on load (chosen).** The production bundle already contains the batch-tick path (`runTicksSync` → `runTickBatch`); only its debug hookup is dev-gated. The quick-start params already work on the live site by design (`GameView.tsx:449`: "so it also works on the deployed build"). One more param in that family, a small hook and an overlay give a deterministic, reproducible warm world from the URL alone. The tester stays exactly as cold as before.

## The awkward part: who lived the First's hour?

In a real second session, the player made the First's choices. Here nobody did. The plan sets the First to **Lives on** for the warm-up, so the First's moments resolve on their own, and restores **Asks you** on arrival. That is not the same as having played. The tester inherits a mortal whose recent history they did not shape. But it is a state a real player can reach today: they turn on Lives on and walk away. And the overlay says so in the toggle's own words, so the tester is not misled (PC-4, the game acting without saying so). The alternative, scripting choices, would put an agent's taste into the world before the tester arrives, which is worse.

## How much to steer the tester

A warm tester told nothing might well spend their 70 actions on the same first-screen things a cold tester does, and the round would be a cold round with a different date. A tester told "open the faction sheet" is no longer a player. The middle path is a returning player's curiosity in their own words: *who holds power here, what is my mortal working towards, what happened while I was gone*. Real players come back with exactly those questions. If the game cannot answer them on screen, that is the finding.

The coverage bar keeps this honest. If testers given that curiosity still never reach factions, undertakings or ambitions, the round says so per tester, as a coverage failure, not as a pass.

## Why thread history doesn't count toward coverage

Cold testers already reach it: 3 of 3 in round 2 saw "Story so far". If it counted, every warm tester could clear the bar without touching any of the systems the ticket was filed about. The bar is set where the measured gap is.

## Why one lane, not two

A second scheduled lane means a second registry row, a second prompt mirror, a second model setting only Christian can change, and a second login check. The gates are the same shape, and the procedure is the same skill. As a mode, warm shares all of that and adds one rule, one round per fire with cold first, which caps daily spend at one round.

## Things considered and parked

- **More personas for warm** (e.g. "the strategist who wants to grow an empire"). Rounds compare only if personas hold still, and three is the cost envelope we have measured. Revisit after warm round 2.
- **Different warm depths per persona** (100 / 300 / 600 ticks). This tells the depth apart from the persona only if every tester plays every depth, which triples cost. Keep one depth, and tune it in config.
- **A "while you were away" recap screen for real players.** The ticket is a test lever, but returning players are real, and the THR-1715 lesson (the game lived my mortal's life without me) points the same way. This is a product question for the warm round's findings to raise, not something to build into the lever.
- **A production coverage recorder** (the game logs which panels were opened). The snapshot files already carry this, and a recorder would be game code that exists only for testing.
