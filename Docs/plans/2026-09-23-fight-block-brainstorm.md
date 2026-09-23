> **title:** Brainstorm companion — the fight block (Physical Conflict plan doc 2)
> **companion_to:** `Docs/plans/2026-09-23-fight-block.md`
> **created:** 2026-09-23

# Brainstorm companion — the fight block

The full route is on the Physical Conflict wayfinder map (THR-1258), which has 19 closed decision tickets. This companion records the alternatives that shaped *this* doc, and why they lost.

## The combat-system survey (THR-1263)
About 20 systems were scored on four questions: does it look good on our surfaces, is it worth watching, does it fit the engine, does it connect to other systems.

| Rejected | Why |
|---|---|
| Round-by-round hit-point drain (D&D, Heroes) | Too long to watch; cost scales badly at ~1000 mortals |
| Tactical grids and real time (Total War, RimWorld) | No surface for it, and the god would get control it shouldn't have |
| Body-part simulation (Dwarf Fortress) | Too granular for a minimal-schema charter. Its log voice survives as the chronicle line |
| A straight Eldritch Horror copy (the first prototype) | The right skeleton, but it connects to nothing. Christian asked for the research that replaced it |

**Kept:**
- the clock on the opponent (Blades in the Dark, Ironsworn, Kingdom Death);
- nerve tied to values (Pendragon, Darkest Dungeon);
- concession (Fate, Mouse Guard);
- edges from the world (Dune, Cosmic Encounter, Pendragon);
- marks that transform (Wildermyth, Crusader Kings III);
- monster morale as temper (old-school D&D).

## Contract alternatives (THR-1269, THR-1260)
| Option | Verdict |
|---|---|
| A new runtime step kind | Rejected (THR-1260): 65 consumers of the step union, and step-index addressing breaks |
| A nested sub-template (call stack on the action) | Rejected: it amounts to a second resolution engine |
| The contested/bandOpposition round resolver | Rejected: binary bands, and it skips the hand and floors. Kept for consequences only |
| Compiled `ActionStepBranch` forks for concession and temper | Rejected: a compiled fork can't depend on "the previous exchange wounded", and temper would multiply the tree by four. The runtime decision reuses the same pure function and the same memory path |
| A mid-list block with skip-to-exit | Deferred to v2: skipping breaks `stepOutcomes` alignment, which `priorStepOutcome` reads. v1 blocks are terminal, and several fights form a sequel chain |

## Numbers (THR-1531)
- **Exchange cap:**
  - 5 raised "struck down" to 23–28% for bold fighters, with little gain in decisiveness;
  - 3 keeps fights short, and the persistent clock turns "broke off" into progress.
- **Flee rule:**
  - fleeing on any nerve failure made the prudent half of the population flee 26–72% of fights, so fights never happened;
  - fleeing only on a rout (critical failure) keeps fights happening. Prudence acts at the concession fork, where the god's lean can hold a wary mortal in.
- **Scale:** at `local`, the 0.65 probability floor made every fight a near-guaranteed scrape. That is the finding behind `FIGHT_STEP_SCALE`.

## Tensions carried forward
- **Deadliness vs. drama.** About 15% of bold fights against strong monsters end with the mortal struck down. Death stays a thin slice of that, set by plan doc 1. The god's cards and wards are the counterweight.
- **Several visits per brute.** This is intentional, and it becomes a community story: many mortals' blows add up on one clock. If play reads it as stalling, the cap and clock sizes are one-number levers.
- **The UI lags the engine by design.** Fights render as plain steps until plan doc 4 lands its header and pips. This is accepted so the core can ship and be verified headlessly first.

## Vision premises touched
- **Living world:** unthreaded mortals fight and leave marks.
- **The god's seat is unchanged:** no new divine verbs.
- **Narrative over mechanics:** named factor lines and result beats.

No Vision text changes.

## Revisions during review (2026-09-23, intent-judge runs 1–2)

**Where the fight writes its memories.** Three shapes were tried:
- *Everything at the block's first index* (THR-1269 §4 as resolved): the aftermath reader takes the first memory at an index, so a recorded fork shadowed the result.
- *Result at the first index, forks at their clash's index*: still collided, because the hand's card record and the agent-decided branch memory replace by step index. A card the god played on the nerve step would be erased, or would erase the result.
- **Chosen:** one result memory at `fightResultIndex(steps) = steps.length` (past the terminal block, which no step owns), with forks kept in `fightState.forks`, out of `choiceHistory`. The terminal-block rule is what makes a free index exist.

**Whose modifiers a fight reads.** Plan draft 1 folded in only the opponent's effect modifiers. The unified road turned out never to read the *fighter's* standing modifiers (items, conditions, effect stacks), while the forecast does. Options weighed:
- fix the whole road first and block the fight on it;
- fix fights only;
- ignore it.

**Chosen:** fights read the fighter's standing term through `resolveFightStepInputs` from FB1, so items and spells matter in fights from day one. The road-wide fix is its own ticket (THR-1535), held for review because it moves every step's odds.

**Forecast parity.** Rather than assign it to the screen plan, one engine function feeds both the roll and the attended forecast. FB7 wires the forecast, since that is when a fight first renders.

**Separation.** THR-1530 §1 routed a separated fighter as fled. `broke_off` / `separated` was kept instead: being carried off by a spell is not breaking in fear.
