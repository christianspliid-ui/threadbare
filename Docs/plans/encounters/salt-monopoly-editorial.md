# Encounter Pipeline: The Salt Monopoly
> Scale: short (2 steps, `scale: local`) | Slug: salt-monopoly | Pass: editorial (cold critic, THR-1757 master batch 2, slot 2)
> Date: 2026-10-14 | Pipeline version: 3.0 | Judged artifact: `salt-monopoly.package.json` (the package ships, not the revised doc)

## Brief conformance (slot 2, binding row)

| Row field | Brief | Package | |
|---|---|---|---|
| id | `encounter.town.salt_monopoly` | same | ✓ |
| reach | gold | gold | ✓ |
| steps | gold 0.74 → gold 0.80 | gold 0.74 → gold 0.80 | ✓ (inside 0.72–0.85) |
| shape | seeded sequel | step-1 success `encounter_seed` → `encounter.town.mill_lease_auction` | ✓ |
| settings | `urban` | `["urban"]`, one opening | ✓ |
| rarityTier / scale / intrinsicTier | 2 / local / shaping | 2 / local / shaping | ✓ |
| hand | `possession` + `story_seed` | `attachment_grant reward_tools_instruments_gate_seal_case` (+ debt pledge on the sac reaction) · `encounter_seed` | ✓ both wired in context |
| opposition | law (duty) | the clerk seals to the best bid above the reserve "and to nobody else" | ✓ |
| over-exposed cards | no `card.boost.core` special, no compulsion | four specials: spirit / chaos / order / time; none over-exposed | ✓ |

## 1. Prose Quality

Narrator mode holds throughout: the opening is one arrival sentence, the step-0 spine states the sale, the rival and the backers' condition, and P3 states the problem plainly. The step-1 spine states the rule of the reserve and the blame. Weak points found, all fixed in the package:

- **Seam echo, opening → step-0 spine.** "the duke's chancery" (opening) is followed by "his chancery takes bids today". `[EDITORIAL REWRITE]` "The duke is selling the salt licence for ten years, and bids are taken today."
- **Seam echo, step-0 base → Rouse The Backers fragments.** Every band of the base text opens "The backers …" and every Rouse fragment opened "The backers pledged …", so the assembled band read "The backers pledged enough … The backers pledged more …". `[EDITORIAL REWRITE]` fragments now continue on a pronoun: "Some gave more than they had meant to, for the town's name." / "Each of them tried to give more than the last …" / "They grew proud …" / "They talked proudly …".
- **Seam echo, step-1 critical_failure.** Base "fell under the duke's reserve" + Weigh The Coin True "the whole of it still fell under the duke's reserve". `[EDITORIAL REWRITE]` fragment: "The silver counted whole, and was still not enough."
- **Timing conflict in Cloud The Tally.** Step 0 happens *before* the bids are called, but the card and its success fragment had the factor "bid" and "hold back a bid". `[EDITORIAL REWRITE]` effect line "They show the room a smaller purse than the one they hold."; fragments say the factor *named* a sum. The critical_failure fragment had the backers "see how rich the rival house was" right after the base said they had walked out; now "the room learned".
- **The seal case appeared from nowhere.** The BOON chip says the mortal holds the stamp, but no line of prose ever handed it over. `[EDITORIAL REWRITE]` step 1's cs / s / sac afterimages now end with the clerk giving `{actor}` "the seal case that stamps the town's salt at the gates", and a `nearMissAfterimage` was added (near-miss is a success side: the item and the seed land there too, and the base success line said "beat the rival's" without saying how narrowly).
- **Step-0 near-miss** fell back to "pledged enough", while its carryover line says "pledged less than was asked". Added `nearMissAfterimage`: "The backers pledged less than the council had asked, but enough to bid."
- "The council read the duke's **seal** aloud" — a seal is not read. Now "the duke's licence … with {actor}'s name beside the town's."
- Reaction label "Take the debt on **yourself**" addressed the mortal in second person; every other label in the corpus is a stance. Now "Carry the town's debt".

## 2. Branch Seduction Audit

Linear; no branches. The mortal's forks are none; the player's agency is the hand. N/A.

## 3. Branch Count Assessment

KEEP 0.

## 4. Scale Discipline Check

Two beats, one morning, one table. Matches short / local. ✓

## 5. Inspiration Anchor Honesty

`hook.artifact_recovery` is taken loosely (an instrument of authority won for the town). The real anchor is the rolled *law (duty)* opposition, and it does change the encounter: the clerk's reserve is the wall the step-1 fight is against. Reusing the mill lease as the place the grudge returns is honest reuse of an expert scene. ✓

## 6. Aftermath Payoff

Actor-centred on every band: the mortal's name is read beside the town's (cs), the council knows who won (s), someone must stand for the debt (sac), the town thinks less of their word on money (f / cf). The master-failure rule ("the name before the purse") holds: nobody is hurt, jailed or branded.

## 6b. Page read (assembled per band, after fixes)

**critical_success**
> The salt of the whole region is the town's for ten years. The council read the duke's licence aloud in the square, with {actor}'s name beside the town's.
> - BOON · Gate Seal Case — Handed over with the licence. {actor} holds the stamp for the town's licensed salt.
> - BOON · reputation with {location} — {location} trusts {actor} with its trade.
> - PATH · seed — Outbid at the chancery. {cast:merchant} will bid against {actor} for the next lease.
> > Offer the losing house the carting — Give the rival house the work of carting the town's salt. The factor is warmer toward the mortal for it.
> > Keep every cart for the town — The town's own carters keep the work. The town's regard rises, and the factor takes against the mortal.

Repetition: none (the "licence" in the overview and the chip's cause are the same object seen twice for two reasons — what the town won, what the mortal carries; not a fact told twice). Verbosity: none. Conflict: none (before the fix the overview "read the duke's seal" collided with the seal case chip; resolved).

**success**
> The salt of the region is the town's for ten years, and the council knows who won it.
> - BOON · Gate Seal Case — Handed over with the licence. {actor} holds the stamp for the town's licensed salt.
> - BOON · reputation with {location} — {location} trusts {actor} with its trade.
> - PATH · seed — Outbid at the chancery. {cast:merchant} will bid against {actor} for the next lease.
> > carting reactions as above

Repetition: "the council knows who won it" and "trusts {actor} with its trade" are adjacent but say different things (credit vs. standing). Clean.

**success_at_cost**
> The licence is the town's, but part of the price is still owed to the chancery, and someone must stand for it.
> - BOON · Gate Seal Case · BOON · reputation · PATH · seed (as above)
> > Carry the town's debt — The mortal owes the chancery what the town could not pay. The town's regard rises for it.
> > Leave the debt with the council — The council pays the rest itself. None of it falls on the mortal, and the town's regard falls.

Before the fix the overview ended "and the backers want their silver back", a claim nothing on the page or in the effects ever answers (verbosity, and a dangling promise). Now the overview poses exactly the question the two reactions answer. Clean.

**failure**
> The council sent {actor} by name to win the salt, and the salt has gone to the rival town for ten years.
> - SCAR · reputation with {location} — Every backer heard. {location} thinks less of {actor}'s word on money.

Clean.

**critical_failure**
> The salt has gone to the rival town for ten years, and the whole council saw the town's purse fall short. {actor} was the one it sent.
> - SCAR · reputation with {location} — {location} thinks less of {actor}'s word on money.

Reads true on both routes into it (step-0 critical_failure "the backers walked out" ends the action; step-1 critical_failure "fell under the duke's reserve"). Clean.

## 7. Dilemma Energy

Real: the four specials buy four different things (more pledged silver, a rival who misreads their own purse, coin that is not set aside, more time at the bell — and the bell can serve the rival). The sac reaction is a genuine stance (shoulder the town's debt, or leave it on the council and lose standing); the cs/s reaction is generosity to the loser against the town's own carters.

## 8. Experience Differentiator Gate (after fixes)

1 YES — arrival sentence + spine, real names, ≤80 words (opening + step-0 spine 74).
2 YES — every sentence states the sale, the rival, the backers' condition, or the stake.
3 YES — backers, rival factor, the clerk's scales and the chancery bell are all in prose before the cards that act on them.
4 YES — "Outbid the rival salt house above the duke's reserve before the clerk seals the licence; the council blames the one it sent."
4b YES — after the three seam rewrites above.
5 YES — imperative verb + noun, no flavour quote.
6 YES — every effect line states what the card does; every price is essence.
7 YES — every special carries ≥1 failure-band fragment; none is big-delta (max 0.12).
8 YES.
9 YES — pride / the rival's count / the weight of coin / the clock.
9b YES — 2 specials + `deal` 4 on both steps; no branch pick.
10 YES.
11 YES — `Gate Seal Case` (the item's own name), `reputation with {location}`, `seed`. All sheet words.
11b YES — after the fixes in § 6b.
12 YES — every success band and the sac band offer two reactions.
13 YES — generosity vs. the town's own; shoulder the cost vs. let the council pay.
14 YES — a broken cooled seal and a raised empty scale pan; residue, no people.

## 9. Verdict

**PASS WITH REVISIONS** — all revisions applied directly to `salt-monopoly.package.json`.

## 10. Revision Summary (fix-list, all applied)

1. Step-0 spine: "his chancery takes bids today" → "bids are taken today" (seam echo with the opening).
2. Rouse The Backers: four fragments rewritten to continue on a pronoun (seam echo "The backers pledged" × 2).
3. Cloud The Tally: effect line and success / failure / critical_failure fragments moved from "bid" to "named a sum" / "showed the room" (step 0 is before the bids); cf fragment no longer contradicts the base "walked out".
4. Weigh The Coin True critical_failure fragment de-echoed from the base ("fell under the duke's reserve").
5. Step 1 cs / s / sac afterimages now hand `{actor}` the seal case; new step-1 `nearMissAfterimage` does the same.
6. New step-0 `nearMissAfterimage` matching its carryover line.
7. Step-1 spine trimmed ("at the clerk's table" — third "clerk" in three sentences).
8. Seal case chip: cause "Handed over with the licence", detail "{actor} holds the stamp for the town's licensed salt." (see package critic).
9. cs overview: "read the duke's seal" → "read the duke's licence … beside the town's".
10. sac overview: dropped the unanswered "the backers want their silver back"; now "someone must stand for it."
11. Reaction label "Take the debt on yourself" → "Carry the town's debt".
