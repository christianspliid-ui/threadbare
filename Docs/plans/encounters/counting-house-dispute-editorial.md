# Encounter Pipeline: The Counting-House Dispute
> Scale: local | Slug: counting-house-dispute | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0 (Factory v3 critic, batch journeyman-everyday-1 slot 4)

Reviewed against the package (`counting-house-dispute.package.json`) — the package is the
authoritative artifact on this line; edits were applied to it directly.

## 1. Prose quality

Narrator mode holds throughout: arrival, events with costs paid, stake stated. The draft's
weak points were structural rather than register:

- **Step 0 had no named person on stage** (narrator's checklist Q9 — the drafter's own flag).
  Only "the two houses" were present; the founder was an unnamed "her".
  `[EDITORIAL REWRITE — applied]` The founder is now a bound cast member (`$cast:founder`,
  smith role, seeded at town/city/capital) and is the one who asked for the ruling:
  > Houses Aldane and Corrow bought the town's new weighing scales together. {cast:founder},
  > the founder who cast them, finished the work last week. The balance is still unpaid, and
  > each house's books say the other owes it.
  >
  > {cast:founder} has asked {actor} to read both books and rule, and both houses have
  > agreed. The house that wins will pay the arbiter and owe a favour besides.

  "Who cast them" also glosses *founder* for a reader who does not know the trade word
  (trigger 29, clarity). Opening now 74 words (≤80). Every gendered pronoun on the founder
  ("her balance", "her money" ×3) removed — a bound cast member may be reused and must not
  be gendered.
- Fork-arm afterimages repeated their band overviews nearly verbatim (seam echo, trigger 22):
  "called the ruling fair in front of the counting house" / "thanked the arbiter for reading
  the contract plainly" / "told the market the arbiter had been bought". Afterimages now carry
  the step result only ("Aldane signed without being asked twice", "walked out before the
  ruling was read to the end"); the overview carries the public fallout.

## 2. Branch seduction audit

The fork is mortal-decided (`decidedBy: asceticism_extravagance`). Mender arm (Corrow, the
small house the debt would break) against Magnate arm (Aldane, the contract's letter and the
bigger purse). Both defensible: mercy against the written term. The god's fantasy is
*leaning a judge*, not judging. Each arm pays differently (letters of introduction vs an
assessor's weighted scales) and leaves the favour with a different factor — real asymmetry.

**Player never picks the ruling — verified.** The only levers are the two step-0 specials with
opposite `poleLean`s. Their effect lines previously read "They will weigh the debt by who can
bear it" — a certainty that edged toward the god authoring the verdict. `[applied]` Both now
read as a lean: "Their reading tilts toward who can bear the debt" / "…toward the house that
pays best afterwards." No card, band fragment or reaction names a ruling as a player choice;
aftermath reactions are publicity vs secrecy, taken after the ruling stands.

## 3. Branch count — KEEP 2 (fork arms) + fallback.
## 4. Scale discipline — local, two steps, personal stake. Matches.
## 5. Inspiration anchors — hook.masterwork_completion is carried by the founder's finished scales and unpaid balance; now embodied by a named person rather than a pronoun. Honest.
## 6. Aftermath payoff — actor-centred; every success band pays an item and a favour to a named factor.

## 6b. Page read (per band, assembled)

| Band | Finding | Fix |
|---|---|---|
| pos crit_success | Overview "paid the arbiter in letters to every house it trades with" + boon chip "carries Corrow's seals to its trading partners" — same fact twice (trigger 35) | Overview now "paid the arbiter in kind"; the chip carries the letters |
| pos crit_success reaction | Intent "The next quarrel in {location} will come to the same door" — promises world behaviour the engine never performs (trigger 34); `{location}` also renders the raw `located_at` node (possibly a Place) while `$here` on `targetLocationId` walks up to the town | Intent now "The town thinks better of the arbiter who made it." — exactly what `reputation_with` on `$here` writes |
| pos success | Same letters repetition | Same fix |
| pos success_at_cost | Overview "given up part of the fee" conflicted with the boon chip granting the full item, and "letters and thanks" re-told both chips | Cost reframed as time (a long afternoon of argument); chip cause "The arbiter's fee" |
| neg crit_success | Overview described the brass scales the boon chip names | Overview now "paid the arbiter's fee from its own counting room" |
| neg success | Overview described the scales again | Same fix; overview now "The debt is off both houses' books." |
| neg success_at_cost | "her money" | De-gendered |
| both crit_failure | "Nobody in the counting house will ask them to read a book again this season" — a later-world constraint nothing enforces (trigger 34), and the encounter can re-fire in the same town | Sentence cut |
| failures | Chip cause clauses ("A ruling Aldane refused") paraphrase the overview's cause — accepted as the cause→change form, change not repeated | — |

## 7. Dilemma energy — genuine: mercy vs the letter, argued by the god, decided by the mortal.

## 8. Experience Differentiator Gate

1 YES (skeleton, 74 words) · 2 YES · 3 YES (books, wage list, order book, carter, factors) ·
4 YES · 4b YES after afterimage rewrites · 5 YES · 6 YES · 7 YES (every special has a failure
fragment) · 8 YES · 9 YES (lean-Mender / lean-Magnate / memory / calm) · 9b YES · 10 YES ·
11 YES (`Letters of Introduction`, `Assessor's Weighted Scales`, `a favour owed`,
`reputation with {target}`) · 11b YES after the fixes above · 12 YES (crit reactions) ·
13 YES (publicity vs keeping the secret) · 14 N/A on this line (no art in package scope).

## 9. Verdict — PASS WITH REVISIONS (applied to the package).

## 10. Revision summary
- Must fix (done): Q9 named person; poleLean lines as lean not verdict; trigger 34 ×3; trigger 35 ×5; de-gendered founder.
- Consider: brief rolled `system: conditions` for slot 4; the success_at_cost cost is prose-only (no write). Acceptable under the brief's "avoid defaulting to a personal condition" line.
