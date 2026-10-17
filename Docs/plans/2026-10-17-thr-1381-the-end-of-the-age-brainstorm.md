# Brainstorm companion — The end of the age (THR-1381)

Companion to [`2026-10-17-thr-1381-the-end-of-the-age.md`](2026-10-17-thr-1381-the-end-of-the-age.md). The plan says what to build; this file keeps what was weighed and dropped, so a later session does not re-argue it.

## Vision premises leaned on

- **A run ends in a story the player can tell** (`Vision/02-non-negotiables.md`: "the player finishes a run with a *story they can tell in prose*"). The end of a run is where that story is summed up; today it is a popup.
- **Witnessing, not steering** (`Vision/00-north-star.md`; Law 13). The rulebook carries it into the ending: *"In Twilight you do not act; you witness."*
- **A run is not about winning** (Law 32). Both clocks get an ending with its own words; neither screen reads as a loss.
- **The world remembers; the god does not grow** (Law 39). Memories are words in the World-Soul, never a bonus.

## How-level choices and the alternatives

### 1. A playable Twilight or a watched one

- **Playable (dropped).** The March 2026 vault note (`Systems/The Unmaking.md`) and the 2026-03-04 plan imagined 5–10 ticks of final interventions with free essence and failing odds, and `TwilightState` / `computeSuccessPenalty` were typed for it. Dropped: the rulebook, written later and canon, says the player witnesses; a last free-essence turn would also make the end a farming window (spend everything on the doom-proof thing), which Law 36 (the purse is small on purpose) argues against.
- **Watched (taken).** Three beats, time stopped, one button.

### 2. One ceremony or a beat per moment on the Stage

- **Several Stage beats (dropped).** The Stage plan (THR-1877) plays story beats over the dimmed map one at a time. Three separate beats would mean three openings, three closes and three chances for PC-5 (piled-up surfaces), at the one moment the player cannot do anything anyway.
- **One ceremony (taken).** One registry entry, the same home as the harvest, which follows it.

### 3. Merging the beats into the harvest screen

Considered: put the ending line and the First's fate at the top of `HarvestScreen`. Dropped because the harvest screen already carries *what the age leaves* (echoes, cards, the wake button), and the Twilight's job is *how it ended*. Two short screens in order read better than one long one that must fit 1920×1080 (Law 33). The echo list stays on the harvest screen only, so nothing is told twice (PC-6).

### 4. When memories are captured

- **During play, at each big event (dropped).** The 2026-03-28 World-Soul plan specified a `phaseWorldSoul` capturing memories as things happen. That needs a producer for every memory type (wars, betrayals, sacrifices), and measured: the game keeps no run-level record of wars or betrayals to read. Building those records is a new system for a line of text.
- **Once, at the end of the age (taken).** Reads three facts the game already holds: which clock ended it, the sphere the world leans to, the god's first harvested echo. Cheaper, deterministic, and every line is backed by state (Law 45).

### 5. Which memory kinds

Kept: `doom_scar` / `mandate_triumph` (the ending — always one), `sphere_dominance`, `divine_intervention` (the first divine echo). Not captured: `great_conflict`, `betrayal`, `sacrifice` — the type allows them, but no record exists to read. They remain in the type for a later writer; this plan promises nothing about them.

### 6. The First's fate: how many fates

Three (Aspect, lived, died) is what state can tell apart without inference. Considered adding *Broken* and *defiant*: Broken consequences ship disabled (rulebook *Broken* is `[DESIGN]`), and a defiant bond is a reception, not a fate. Each can become a fourth row later by adding one line to the table.

### 7. The Mandate ending the age

The one call here that changes how long some runs last. Canon is unambiguous (rulebook §8, quick reference, Law 32), and measured code contradicts it (only doom expiry starts the Twilight; after the Mandate completes, play goes on until doom and the harvest reads *somber* if doom ran past 0.9). Taken under delegation with a veto line, because the agreed outcome decides it.

### 8. Keeping `endAge()` as is

`endAge()` goes straight to the harvest and THR-1813's browser test depends on that. A new `beginTwilight()` reaches the ceremony. Two levers, two meanings, nothing broken.

## Smaller calls

- **Stored summaries are rendered text**, not templates: the next world has no graph to fill `{first}` from.
- **Memory ids are `mem-<cycle>-<type>`**: deterministic, and unique because each type is captured at most once per age.
- **The fade reuses 0.15 per age** (the value `buildHarvestOutcome` already used), so a memory lasts seven ages.
- **No new player word.** *Twilight* and *Resonance* stay engine names; the screen says *the age ends* and *the World-Soul remembers* (UL `Run`: the run-end is *the end of an age* in prose).

## Fog left for later (not this plan)

- Showing carried memories in the next world: [THR-1971](https://linear.app/threadbare/issue/THR-1971) (Deferral), on THR-1844's step.
- Memories shaping world generation (the vault's "typed memories inject thematic content into generation"): no plan; nothing reads memories for worldgen today, and this plan does not promise it.
- A player concession ending (`player_concession` in `UnmakingTrigger`): not in canon's current rules; no UI to concede exists.
