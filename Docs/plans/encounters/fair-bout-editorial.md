# Encounter Pipeline: Called to the Ring
> Scale: short | Slug: fair-bout | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0
> Critic: independent (batch journeyman-everyday-2, slot 1, THR-1677). Fixes applied directly to `fair-bout.package.json`; the package is the revised artifact, and the draft carries a "Critic revisions" section.

## Verdict: PASS WITH REVISIONS (applied)

## 1. Prose Quality

Narrator mode holds. Every sentence reports a fact, with no interiority, no camera and no lyric. The fair is plain and legible, and the stake is stated outright in P3. Four defects were found and fixed.

- **The opening contradicted the spine (a conflict, found by reading).** The urban opening put the mortal in town "for the first day of the town fair". The spine then said the champion "has held the fair's ring for three days". A fair's first day cannot have three days behind it. `[EDITORIAL REWRITE]` urban: "{actor} is in {location} on the last day of the town fair." Rural: "{actor} comes into {location} on the last morning of the village fair." The rural opening also dropped "harvest", because `rural` expands to hamlet, farmland *and* mining, and a harvest fair at a mine reads wrong.
- **"Calls {actor} out by name".** The design block says the corner picks a stranger. A stranger's name is not known to the corner, so the sentence asserted a fact the scene never set up (trigger 29, a sentence needing a second reading). `[EDITORIAL REWRITE]` spine: "The champion's corner picks {actor} out of the onlookers as the next challenger and shoves {actor} against the rope." The custom sentence now reads "a challenger who refuses is named a coward at the ring", so the refusal and the stake match the call. Opening plus spine is 72 words.
- **Spine → bout seam echo (trigger 22).** The bout step retold "has fought here three days running", which the spine had just said. That sentence now does work instead: "The champion is heavier, fights by rushing in, and likes to play to the crowd." This also grounds both bout specials in the scene (trigger 8): the rushes for the stance card and the vanity for the goad card.
- **The crier was told twice on the walk-away path.** The walk-away step prose said "The fair's crier calls the refusal at the ring", and every walk-away overview said it again. The crier now lives in the aftermath only.

## 2. Branch Seduction Audit

- **Bout (Vanguard, iron 0.45).** The fantasy is that the god backs a stranger who answers a public dare. The value at stake is courage. It pays well: a companion, a favour owed and the purse, against the beaten champion's resentment. A loss costs the backer's regard.
- **Walk away (Watcher, iron 0.20).** The fantasy is that the god lets prudence win and keeps the mortal's temper in hand. It is cheap and legible: an easy roll, and a small loss of the champion's regard (-0.05, or -0.12 if they swing). No companion or favour comes with it, because declining forfeits the drawn prize. The overview says so in the fair's own terms: the crier names the refusal, and the champion keeps the purse without a bout.
- **The cards only lean.** `Rouse The Crowd` leans `positive` and `Cool The Blood` leans `negative`. The mortal's `courage_prudence` axis decides the fork. No card picks the branch.

Both branches earn their place.

## 3. Branch Count — KEEP 2

## 4. Scale Discipline

Short scale, two beats, no reactions: correct. Difficulties are 0.42 → 0.45 / 0.20, all within the 0.45 open-draw cap, and `intrinsicTier: 'background'` is set. That matches the binding brief row (iron 0.42 → iron 0.45).

## 5. Inspiration Anchor Honesty

`hook.trial_by_combat` survives as the fair's custom: a question settled by a bout, where the stranger is not the favourite. The other two rolled hooks were refused for tone, as the brief's "at least one is a pleasure" row asks. The hook is honest.

## 6. Aftermath Payoff

The encounter is actor-centred and lands on named people: Bram Tallow (champion), Oda Brisk (backer) and a hedge-healer who walks away with the winner. The win is generous and the loss is money and standing, as the brief's cool-failure row asks.

## 6b. Page read

Each band was assembled in this order: afterimage, then overview, then chips in scar · bond · boon · path order. The afterimage is the last thing the step shows, so the overview beneath it must not retell it.

**Before the fix, every band on both paths had an afterimage → overview echo (triggers 22 and 35).** Four examples:
- Bout success: "The champion yielded, and the purse was theirs." was followed by "{actor} wore the champion down and took the purse when the champion yielded."
- Bout critical failure: "The champion put them down in the first exchange, and the crowd jeered them out." was followed by "{cast:champion} put {actor} down in the first exchange … and the crowd jeered {actor} out of the ring."
- Walk-away success: "They walked out through the jeers without turning round." was followed by "{actor} walked out through the jeers without turning round."
- The walk-away failure, walk-away critical failure, bout critical success, bout success_at_cost and bout failure bands had the same shape.

A later reading found three more echoes inside the first rewrite:
- The critical-success line "most of the crowd had bet on the champion and lost" paraphrased the afterimage "the crowd paid out".
- The at-cost line "and still yielded" repeated "The champion yielded", which both of that band's reachable afterimages carry.
- Both walk-away failure overviews retold "the scuffle".

Each overview now opens on a fact the afterimage did not carry.

**A conflict the engine creates, now fixed.** `computeFinalActionOutcome` lands the action on `critical_success` when *step 0* crits and the bout is a plain success. It lands on `success_at_cost` when step 0 fails, or the bout rolls `near_miss`. So a band overview cannot assume which afterimage sits above it. The old critical-success overview said "put {cast:champion} down in the first exchange", and it would have contradicted a plain-success afterimage ("The champion yielded…"). The new overviews assert nothing about how the bout went. They say only what followed it.

**Resulting pages:**

- **Bout · critical_success.**
  - Overview: "By dusk, every stall at the fair was talking about the stranger who beat {cast:champion}."
  - SCAR · reputation with {target}: "{cast:champion} thinks less of {actor} now."
  - BOND · companion: "Left the beaten corner — A hedge-healer travels with {actor} now."
  - BOND · a favour owed: "Paid out on a quiet bet — {cast:backer} owes {actor} a favour."
  - The page is clean.
- **Bout · success.**
  - Overview: "{cast:backer} had laid a quiet bet on {actor} against the whole fair, and collected on it without a word to anyone."
  - Chips: the champion scar; the companion (cause: "Left the beaten corner"); "{cast:backer} owes {actor} a favour." The favour chip carries no cause, because the overview has just told the bet.
  - The page is clean.
- **Bout · success_at_cost.**
  - Overview: "{actor} came out of the last round with one eye swelling shut, and {cast:champion} walked off without a word."
  - Chips: the champion scar; the companion with the cause "Stitched their split brow" (the cutman's work, told once); the favour with the cause "Paid out on a quiet bet".
  - The page is clean. The walk-off shows the resentment, and the chip states it.
- **Bout · failure.**
  - Overview: "{cast:backer} lost the quiet bet laid on {actor}, and the champion's backers collected from the whole crowd."
  - SCAR · reputation with {target}: "{cast:backer} thinks less of {actor} now."
  - The page is clean.
- **Bout · critical_failure.**
  - Overview: "{cast:backer} lost every coin laid on {actor}, and the crier called the result round the fair before {actor} was back on their feet."
  - SCAR: the same backer chip.
  - The page says plainly what the extreme band cost. The chip does not claim "hard", because the write is the same -0.15 (see §10).
- **Walk away, base** (critical_success, success_at_cost).
  - Overview: "The crier named the refusal at the ring, as the fair's custom says, and {cast:champion} kept the purse without a bout."
  - SCAR · reputation with {target}: "{cast:champion} thinks a little less of {actor}."
  - The page is clean.
- **Walk away · success.** The overview now reads "…the fair moved on to the next bout", and the base chip is kept.
- **Walk away · failure.**
  - Overview: "The crier named the refusal at the ring, and the stewards watched {actor} out of the fair."
  - Chip: "{cast:champion}'s regard for {actor} fell."
  - The page is clean.
- **Walk away · critical_failure.**
  - Overview: "The crier named {actor} a coward at the ring, loud enough for the whole fair to hear."
  - The same chip as failure.
  - The page is clean.
- **Fallback.** The fallback *step* is the walk-away arm, but the fallback *aftermath* read "The call was met without trouble". That contradicts the step, and the fallback carried no chips for the step's two `bond_change` writes. The fallback aftermath is now the walk-away aftermath (ids re-keyed).

## 7. Dilemma Energy

The dilemma is real: a public dare with money behind it, against a heavier fighter. The god's levers pull both ways (a roaring crowd toward the ring, a cool head toward the gate), so the god's posture shows in which card it plays. It is a pleasure scene with an edge under it, which is what the batch asked of this slot.

## 8. Experience Differentiator Gate

1 YES (72 words, arrival · situation · stake, real names) · 2 YES · 3 YES (the rope, the corner, the rushes, the crowd, the cutman, the bet) · 4 YES · 4b YES (after the fixes) · 5 YES (after the fix below) · 6 YES · 7 YES (every special has a `failure` fragment; the two with `critical_failure` fragments also cover it) · 8 YES (after the bout-prose rewrite) · 9 YES (a crowd's confidence / a cool judgment / footing / the opponent's vanity) · 9b YES (both special-bearing steps cover all six bands; the walk-away arm is deal-only) · 10 YES · 11 YES (`reputation with {target}`, `companion` and `a favour owed` are sheet words) · 11b YES (after §6b) · 12 N/A (short) · 13 N/A · 14 YES (an empty roped ring, a sagging rope, a cutman's stool with pink water, chalked tallies: residue and absence, no people).

**Card faces (trigger 16).** Two faces could only be read in this scene, and one title named the scene's cast:
- **Rouse The Crowd**: "…so the ring feels like theirs" became "Raise a roar from the onlookers at their back, so the ground feels like their own. A cheering audience argues for boldness."
- **Cool The Blood**: "…the fighter across the rope" became "Settle their temper under provocation, so they size up the danger plainly. A clear head argues for caution."
- **Harden The Stance**: "Root their feet, so a heavier opponent's rushes cannot move them."
- **Goad The Champion** became **Stir Vanity** (id `bout.stir_vanity`): "Tempt a proud opponent to play to the onlookers, so their guard drops for a cheer."

No effect line repeats a word of its card's name. The champion survives in the `bandProse`, where scene words belong.

## 9. Verdict

PASS WITH REVISIONS, applied. The scratch `check:encounter` (the package assembled and checked unregistered) is clean with 0 warnings after the fixes.

## 10. Revision Summary

- **Must fix (done):**
  - The opening conflicted with the spine (first day vs three days).
  - A stranger was called "by name".
  - The spine → bout seam echo.
  - The crier was told twice.
  - Afterimage → overview echoes on every band.
  - The fallback aftermath contradicted the fallback step.
  - Scene-bespoke card faces.
- **Settled (author's doubts):**
  - *Identical backer chip on failure and critical_failure.* This is correct, not a defect. Both bands fire the same `failureMetadata` write (-0.15), and a chip that said "hard" on the extreme band would claim a larger write than the engine made. The critical_failure *overview* carries the extra cost in plain words, as the brief's band table asks.
  - *Champion regard chipped only on at-cost.* See the systems file. It is now chipped on all three success bands.
- **Consider:** none.
