# Brainstorm companion — every run draws its doom (THR-1774)

Companion to `Docs/plans/2026-10-08-thr-1774-doom-archetype-draw.md`. Records the alternatives weighed, the tensions, and the Vision premises the plan leans on. Authored by the design lane, run 2026-10-08b, under the 2026-09-11 delegation.

## The question

Every world plays Breach because the archetype default has no caller. The ticket asked the plan to pick how the archetype is chosen: **derive it from the god's identity**, or **draw it seeded** as rulebook §8 implies. The showcase stays pinned to Breach.

## Alternatives considered

### 1. Fixed by identity: a hunger → doom table (rejected)

Twelve hungers map onto seven dooms. The appeal is that the catastrophe would *answer* the god: a god who hungers to Preserve faces the Failing, one who Consumes faces the Reckoning.

Rejected for three measured reasons:

- **Three of the seven have nothing to key on.** Only Convergence (Force), Changing (Chaos), Ascension (Spirit) and Reckoning (Mind) carry a sphere in the engine (`doomClock.ts` card blueprints). Breach, Sundering and Failing are systemic. Any table placing them is invented meaning with no canon anchor. Choosing what a god's nature *means* for the end of the world is exactly the kind of fork the lane must not invent.
- **Sameness.** A Witness god would meet one doom forever. The Dominion map's buy-system prototype ([THR-1770](https://linear.app/threadbare/issue/THR-1770)) treated measured sameness between gods (3.8 of 5 shared first powers) as the defect to remove. A fixed doom table is the same defect along a different axis.
- **The ticket's premise was partly false.** It said `doom-identity-matrices.ts` "already maps archetype × sphere". That file has zero `sphere` fields (`grep -n sphere` = 0 hits). The matrices map archetype → encounter, rival, complication and prose tilts, not spheres.

### 2. Identity-tilted draw (deferred, not rejected)

A seeded draw whose weights lean toward dooms that *oppose* the god's home spheres under `SPHERE_OPPOSITES`, so the world's catastrophe pushes against your turf. This is attractive and fits the Dominion map's "opposition follows the designed cosmology" ruling.

Deferred for now:

- Only four archetypes have a sphere to oppose, so the tilt would be lopsided: three dooms always at base weight.
- Whether a doom *should* oppose, mirror or ignore the god is a meaning question that belongs with the Dominion map's opposing-dominion ticket ([THR-1763](https://linear.app/threadbare/issue/THR-1763)), which is still blocked on the formula.
- The plan leaves `DOOM_ARCHETYPE_DRAW_WEIGHTS` as the seam. A tilt is a weights function later, with no change to the draw.

### 3. Uniform seeded draw keyed on seed + hunger (chosen)

- Even odds; measured at 13.9–14.8% per archetype over 12,000 draws.
- Deterministic per (seed, god).
- The hunger only reshuffles; it gives no doom an edge.
- Six distinct dooms across the twelve hungers at seed 42.
- Matches §8's *"every run starts with one of seven"* and the March vertical-slice intent (*"new archetype from world-soul state"*), at the simplest level that ships today.

### 4. Pure seed draw, no hunger key (rejected)

It would be simpler, but then every god on the same seed meets the same doom. The ticket's Done-when (four distinct across the twelve hungers at a fixed seed) could only pass by luck of the seed, not by design.

### 5. Player chooses the doom at Remembrance (not considered in scope)

Picking your own apocalypse is a direction call about agency (rulebook §1 frames the doom as something that *"will arrive"*, not something you pick). It is not decidable from evidence. If Christian wants it, it is a new ask.

## Tensions

- **Showcase stability vs variety.** Every evidence route, the warm playtest and two weeks of screenshots assume Breach. Pinning `?seeded` keeps all of them comparable. The `?doom=` lever gives review access to the other six. The cost: the default dev view never shows variety. The pin is a named constant, so it can be flipped in one edit.
- **Heavy-test baselines.** Six matrices now tilt encounters, rivals and prosperity on worlds built without an explicit doom. Any heavy test that measured "a world" was measuring a Breach world. The plan tells the executor to pin such worlds to Breach rather than loosen thresholds.
- **Breach loses its Order sigil.** The doom bar shows Order over Breach today, but Breach presses no sphere. Following the engine, it now shows its own ◈ glyph. The only player-visible regression risk is "the icon changed". It is the honest one.
- **Naming the doom vs mystery.** The authored wake lines deliberately evoke rather than name. The plan keeps each line whole and *appends* the name, *"The Age of the Breach has begun."*, matching the Chronicle's existing volume title. One plain naming beat lets the player learn the word the doom bar and tooltips use (PC-1). Mystery still lives in the stage cards and omens.

## Vision premises leaned on

- **"The next world is a response"** (rulebook §8, North Star). Untouched. The plan explicitly does not redraw on a new cycle and does not read the World-Soul. That stays a cross-run question, next to the Dominion map's cross-run ticket ([THR-1773](https://linear.app/threadbare/issue/THR-1773)).
- **"Prose carries mechanics, numbers never reach the player."** The doom is a word with a tooltip. Its weights stay in the debug trace.
- **GM narration, never in situ.** The appended naming sentence is narrator voice addressed to the god, like the authored wake lines.

## What would change the call

- Christian says *"the doom should be about the god"*. Then option 2 or a curated table, reserved for him because it decides what a god's nature means for the world's end.
- Christian says *"let the player pick the doom"*. Then option 5, a new ask.
- A playtest finds the doom indistinguishable between runs. Then the matrices need sharper tilts. That is a content ticket, not a selection change.
