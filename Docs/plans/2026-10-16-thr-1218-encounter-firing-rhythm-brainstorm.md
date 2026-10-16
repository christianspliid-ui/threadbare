# Brainstorm companion — Encounter firing rhythm (THR-1218)

Companion to [`2026-10-16-thr-1218-encounter-firing-rhythm.md`](2026-10-16-thr-1218-encounter-firing-rhythm.md). Design lane, unattended, run 2026-10-16c.

## The question as chartered, and how it turned

The ticket was chartered on 2026-08-24 from Christian's firing verdict (*"Rhythm works — prune later"*, 2026-08-10): narrow encounter firing down from "everything fires for every threaded agent" once the Encounter Factory had raised content density. The 2026-10-02 design request named four levers to design: per-agent spacing, per-family cooldown, a density cap per attended tier, and suppression.

Three things happened between charter and this pass:

1. **THR-1715 (2026-10-03, shipped) already did the pruning the verdict asked for**, without calling it that. Chores (authored `threatRating: 'trivial'`) never notify; a paused mortal's story chapter is followed by a two-day breath; The First is born asking. In the baseline, 67% of her encounters are chores, and every gap between her story chapters sits at or above the breath.
2. **The game design laws were collated (2026-10-14).** Law 29 [E] says the game never rations chapters. The density settlement of 2026-07-04 already said it ("no system caps or rations encounters per run or per sitting"), and the laws made it binding and checkable.
3. **The Stage plan (THR-1877, 2026-10-14) settled concurrency**: one moment in front, the rest held and named in Needs you.

So the levers the request listed are mostly already present (spacing, suppression), forbidden (a density cap), or measured unnecessary (per-family cooldown). The free-play baseline the ticket demanded shows what is actually wrong: retold stories and droughts.

## Premises from the Vision and Christian's recorded stances

- *"The pleasure is witnessing, not steering"* (Vision `00-north-star.md`). A followed mortal's life should read as a life, not a loop.
- Encounter design goal (Christian, recorded in project memory 2026-04): agents move from encounter to encounter, a nomadic life; *the same encounter twice should be very rare*; generic encounters are filler, not the main diet. The baseline breaks the second point for the one mortal the player watches most.
- Core loop: *"quiet simmer punctuated by emphasis"*; cadence is texture between emphases, *not a count ceiling* (2026-07-04 settlement).
- Law 15: interrupts belong to mortals the player asked to follow. Nothing here adds one.

## Alternatives considered

### Spacing
- **A cross-thread world breath** (after any halt, no new halt for N ticks). Rejected: the action does not wait while the clock runs (`progressAllActions` advances every action; THR-1715 decision 5), so a held chapter would play out without the player, which is exactly the THR-1715 quit point. It also behaves as a cap once several mortals are followed (Law 29).
- **A breath that scales with the number of paused mortals.** Rejected: a cap in disguise.
- **Keep spacing as is (per-mortal breath).** Taken (D2).

### Repetition
- **Per-family cooldown** keyed on `encounterType`. Measured unnecessary: 1 family repeat in 43 story pairs. Keyed on reach, it would also fight the forecast window (a mortal grows in one reach and its challenges come from that reach). Rejected (D3), with a census tripwire.
- **A stronger novelty weight.** Rejected: a weight lets a high-scoring retelling through; `NOVELTY_EMA_DECAY` is that weight today and still allowed five tellings.
- **One telling per run.** Rejected: with 6–7 story templates reachable at home, one telling each runs dry in about two weeks of game time, and droughts are already a problem.
- **Two tellings per run while another story is within reach, relaxed after a long drought.** Taken (D5). "Rare, not never", which matches the stated goal.
- **Shorten `MAX_COMPLETIONS_PER_TEMPLATE` for everyone.** Rejected: unthreaded spotlight agents are the world's texture (Law 4's reasoning: nobody watches those rolls), and their pool is the same cache; capping them would starve background life for no visible gain.

### Droughts
- **A reserved cap slot for story** (like `PERSONAL_OFFER_CAP_RESERVE`). Rejected: the drought happens when the eligible story pool is *empty*, not when it is crowded out.
- **Seed a story at her location.** Rejected: it invents pressure (seeds are authored pressure, not drift) and bypasses eligibility by design.
- **Let her travel** (the restless road). Taken (D6). It is the nomadic goal itself, the engine already has the move (forced travel), and a mortal setting out is a small story the Chronicle can tell.

### The aftermath-only half
The baseline counted 24 of 48 story chapters halting and 24 producing only an aftermath notice. Templates appear on both sides, so it is not content. The most likely cause is the headless harness: nobody closes a veil, and the auto-open scan allows one at a time. A design pass should not build on a guess, so S1 traces it and files a bug if it is real (D8).

## Tensions

- **Tellings cap vs drought.** Cutting retellings removes stories, and droughts are already a problem. The restless road is the counterweight, and the relax window is the floor: after twelve days with no story, retelling beats silence. The census checks that story chapters do not fall below the baseline.
- **Nomadic vs settled.** A mortal with a residence (THR-822, observed) may leave home. The restless road sets out, but does not move her residence: residence is observed from where she lives over time, so a mortal who keeps returning stays rooted.
- **Following many mortals.** Per-mortal breaths sum. Law 29 says that is the player's doing. If it plays badly, that is a law amendment for Christian (fork F1), raised after he has played it.

## What would change the calls

- Christian saying retold stories are fine (he likes the familiar beat): raise `PAUSED_STORY_MAX_TELLINGS`; one number.
- A tester saying The First "keeps wandering off": raise `STORY_DROUGHT_TICKS` or `RESTLESS_ROAD_COOLDOWN_TICKS`.
- The census showing story chapters per run *falling* after S1: the cap is too tight for the content pool; lower the relax window first.
- The Encounter Factory filling local pools (more stories per place): droughts shrink on their own, and the restless road fires less, as intended.
