# Brainstorm companion — A lean waits for its road (THR-2188)

Companion to [`2026-11-07-thr-2188-a-lean-waits-for-its-road.md`](2026-11-07-thr-2188-a-lean-waits-for-its-road.md). Design lane, 2026-11-07, decided under delegation (process.md rule 4).

## The question the ticket asked

A Crossroads lean that says "likely" is followed on 43% of all leans in the ticket's own census, because about a third lapse with "Your lean finds nothing to hold". The ticket offered three options: discount the forecast word by a road's chance to survive; carry the lean to the road more readily; or say in the confirm line that the road may close.

## What the measurement found

Census instrument: `scripts/crossroads-lean-census.ts` on the never-merged branch `proto/thr-2188-lean-waits-for-its-road`. Seeds 42 and 7, 600 ticks, medium map, six threaded mortals per seed (the first six living individuals by id; one mortal alone gave too few decisions), a lean at every fresh reading, rotating toward road 2 / away from road 1 / toward the last road.

1. **The lapses are the cap, not the world.** 855 of 890 lapses were encounters whose template was on *no* list at the next decision, a median of 4 ticks after placement. In 224 of them the mortal stood at the road's own place. 591 of the 855 came back onto a reading within 72 ticks. The encounter cap (`capWithDiversity`) re-cuts ~1,700 eligible entries to 40 by position at every decision, and it cut the leaned road.
2. **God's Will had this fixed; the Crossroads lost it.** THR-1781 measured the same symptom on the paid compulsion and gave it cap Phase 1e-bis (`compelledTarget`). The Crossroads replaced God's Will (THR-1928) without carrying that reserve over.
3. **A reserve alone is not enough.** With the cap keeping the road (arm R), lapses fell from 890 to 257 and `likely` rose to 48% of all leans. The rest are roads truly off the board for a decision or two (the mortal moved on, the story breath, a work that ended).
4. **Waiting closes the rest.** Letting a lean whose road is off the board wait for the next decision, inside its existing six-day hold (arm R+W), cut lapses to 17 expiries in ~1,080 leans and lifted `likely` to 65% of all leans.
5. **The toward words were close to flat.** Under R+W, toward leans by lead at placement: below 1× 14% followed, 1–1.25× 39%, 1.25–1.5× 40%, 1.5–2× 57%. The 1.25 margin put two 40% bands under "likely". 1.5 separates them.
6. **The away words are not honest, and that is a different problem.** Away leans are followed 77–98% whatever the word, including 48 of 62 that said "Kael will hold to it anyway". The favourite the mortal did not take rarely comes up first twice. It is not a lapse problem, and fixing it raises a value question (is a lean that almost always "works" because the mortal would not have repeated anyway worth its price?). Filed as its own ticket rather than folded in.

## Options weighed

| Option | Verdict |
|---|---|
| Discount the forecast by a survival rate | Rejected. It would make "likely" almost never appear (58% of leans lapsed at baseline) and bake a cap artefact into the words instead of removing it. |
| Say in the confirm line that the road may close | Rejected as the primary fix. True at baseline, but it describes a bug as a rule. After the fix only 1.6% of leans expire, and the held line already says the lean can fade. |
| Reserve the leaned road at the cap (R) | Taken. The THR-1781 shape, one entry, scoring still decides. |
| Wait instead of lapse while the road is off the board (W) | Taken. Inside the existing `CROSSROADS_HOLD_MAX_TICKS`; nothing new to tune but a revert flag. |
| Let the leaned road bypass the story breath, as God's Will does | Rejected. During the breath only routine roads stand, so a leaned road there would win almost by default: a command, not a lean (Law 9). The lean waits out the breath instead. |
| Carry a work (undertaking) lean to the same work at another target | Rejected for now. 35 of 890 lapses were works, 32 of them because the work itself was gone; another target would be a different road. |

## Vision premises touched

- Law 9 (influence, never command): the reserve only keeps the road in view; the board still scores it, and the breath still binds.
- Law 18 (the forecast is the roll) and Law 45 (never promise what the world will not do): the fix makes the board the forecast read more like the board that decides.
- Rulebook §4, *You can stand at a threaded mortal's crossroads*: "It waits for their next free choice" becomes "it waits until that road is in front of them again".
