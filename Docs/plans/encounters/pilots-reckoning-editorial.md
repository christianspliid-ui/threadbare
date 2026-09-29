# Encounter Pipeline: The Run the Pilot Refused
> Scale: short | Slug: pilots-reckoning | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0
> Critic: independent (batch journeyman-everyday-1, slot 1, THR-1676). Fixes applied directly to `pilots-reckoning.package.json`; the package is the revised artifact.

## Verdict: PASS WITH REVISIONS (applied)

## 1. Prose Quality

Narrator mode holds throughout. Every sentence reports a fact, with no interiority and no sky-lyric. Three defects were found and fixed.

- **The opt-in was never put to the mortal in the scene.** The step-0 spine ended on "asks {actor} to check the house's star tables". The fork then opened with "{actor} takes the run" or "{actor} will not lead the run", but no sentence had offered the run. That is a trigger-26 breach, because the declared mortal choice had no setup. `[EDITORIAL REWRITE]` spine: "The house steers its wagons across open country by the stars. Its last two night runs came in two days late, though the drivers swear they held the course. Its own pilot will not lead the next run until the fault is found. {cast:factor} has a season's goods loaded and a buyer waiting, and asks {actor} to check the star tables and lead tonight's run." The opening plus spine is now 80 words, exactly at budget.
- "checked clean against **the heavens**" was the one lyric word, and it is now "the night sky".
- **Afterimage→overview seam echo (trigger 22) on all five lead-path bands.** For example, the success afterimage read "The wagons came in on the morning they were due." and the overview then read "The wagons reached the buyer on the morning they were due." The player met the same sentence twice in a row. Each overview now opens on what the afterimage did *not* carry: the named fault, the money, and what the factor or pilot did. The same fix was applied to the decline critical failure ("called the reckoning a guess in front of the drivers" appeared in both).

## 2. Branch Seduction Audit

- **Lead (Vanguard, star 0.45).** The fantasy is that the god backs a mortal who puts their name on a stranger's run. The value at stake is courage. Its asymmetry pays: the knowledge record, the sequel and the factor's trust, against a scar in the factor's regard.
- **Decline (Watcher, star 0.20).** The fantasy is that the god lets prudence win. This is the cheap, legible exit: an easy roll and a small `bond_change` (-0.05, or -0.12 on failure). No knowledge and no seed come with it, because declining forfeits the drawn prize. That cost is readable in the page ("still has no pilot for tonight"). Both branches earn their place.
- **Player cards only lean.** `Sharpen Memory` carries `poleLean → negative`, and `Clear The Sky` carries `poleLean → positive`. The mortal's `courage_prudence` axis decides the fork. No card and no step picks the branch.

## 3. Branch Count — KEEP 2

## 4. Scale Discipline

Short scale with two beats and no reactions is correct. Difficulties are 0.40, 0.45 and 0.20, all within the 0.45 open-draw cap, and `intrinsicTier: 'background'` is set. Both match the binding brief row (star 0.40 → star 0.45).

## 5. Inspiration Anchor Honesty

`hook.mentors_test` survives as the silent pilot on the last wagon, and `Loosen A Tongue` makes that silence a lever the god can pull. The hook is honest.

## 6. Aftermath Payoff / 6b Page read

Each page below was assembled in this order: overview, then scar · bond · boon · path.

- **Before the fix, every lead-path chip's `causeClause` retold the overview** (trigger 35, repetition):
  - "Kept the buyer's date" sat under "reached the buyer on the morning they were due".
  - "Beat the buyer's date" sat under "a day early".
  - "Brought the wagons through the bad stretch" sat under "{actor} steered around it".
  - The decline chips did the same: "Read the tables, then refused the wagons" sat under "kept out of the wagons", and "Handed back a reckoning the factor would not use" sat under "did not trust the margin notes".

  Per spec rule 1b, the cause earns a clause only when the page does not already say which beat produced the state. The fix dropped those causes. Two failure-band causes were rewritten to add new facts: "The run bore their name", and "Called a guesser in public" (the overview no longer carries the guess line).
- The knowledge chip's "on that route" pointed back into the overview. It now reads "on the house's night route".
- **No conflict found.** The decline critical success keeps a small regard loss while its afterimage has the factor forwarding the tables to the pilot. I read that as consistent, because the factor valued the reading but still lost his pilot for the night.
- **Resulting pages, lead success:** "The fault was one star copied wrong in the house's tables, and {actor} steered around it. The season's goods sold at the agreed price." / BOND · reputation with {factor}: "{factor} trusts {actor}'s reckoning now." / BOON · knowledge: "{actor} holds an intelligence record on the house's night route." / PATH · seed: "Merchant work will come looking for {actor} again." The page is clean.

## 7. Dilemma Energy

The dilemma is real: a good reading still leaves the question of whether to stake your name on it. The god's levers push both ways (memory toward caution, a bright sky toward going), so the posture the god takes is visible.

## 8. Experience Differentiator Gate

1 YES (80 words) · 2 YES · 3 YES (tables, late runs, pilot, lead wagon) · 4 YES · 4b YES (after the fix) · 5 YES (after the fix, below) · 6 YES · 7 YES (every special has a failure or critical_failure fragment) · 8 YES · 9 YES · 9b YES · 10 YES · 11 YES (`knowledge`, `seed` and `reputation with {target}` are sheet words) · 11b YES (after the fix) · 12 N/A · 13 N/A · 14 YES (the star table with one line scored through, and a cold lantern: doubt about an old certainty).

**Card faces (trigger 16).** Two titles only read in this scene: "Recall The Late Runs" (also a lexicon warning) and "Loosen The Pilot's Tongue". Two effect lines were scene-bespoke ("the lead wagon", "the house's tables"). They were renamed and rewritten as generic spells:
- **Sharpen Memory**: "Bring past attempts back to mind at once, so the pattern in their failures stands out. It argues for caution."
- **Clear The Sky**: "Thin the cloud overhead tonight, so every star can be checked by eye. A bright night argues for going."
- **Hold The Bearing**: "Keep the traveller true to the chosen heading through dark country, where a small drift grows large."
- **Loosen A Tongue**: "Tempt a silent watcher to speak once, at the moment a warning is needed."

The scene-specific wording stays in the `bandProse`, where it belongs.

## 9. Verdict

PASS WITH REVISIONS, applied.

## 10. Revision Summary

- **Must fix (done):** put the opt-in in the spine; fix the seam echoes; fix the chip retelling; make the card faces generic; swap the sequel (see the systems file).
- **Consider:** none.
