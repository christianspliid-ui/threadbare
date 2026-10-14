# Encounter Pipeline: The Hostage Exchange
> Scale: medium | Slug: hostage-exchange | Pass: editorial (cold critic, master-everyday-2 slot 3)
> Date: 2026-10-14 | Pipeline version: 2.0
> Judged: `hostage-exchange.package.json` (what ships), against `master-everyday-2-brief.md` row 3

## Verdict: PASS WITH REVISIONS

The encounter is the right shape: heart 0.74 → heart 0.80, investigation → resolution, one greedy keeper, no fight gate, `relationship` + `companion` wired. The prose is plain narrator mode throughout and the hand is clean. Four defects needed fixing before it ships. All are applied to the package.

1. **The companion chip promised a lasting companion.** `companion.sellsword-band` carries `durationTicks: 10` (`MERCENARY_COMPANION_DURATION_TICKS`, `src/data/companion-templates.ts`). The engine's own join line is "{name}'s company takes the coin and falls in behind". The chip said "The sergeant's sellsword band travels with {actor} now", which reads as a permanent follower. That is prose rule 7b (trigger 34): a promise the engine will not keep, because the band leaves within the day.
2. **The s@c overview conflicted with its own route.** s@c is reached by step 0 failing or near-missing and step 1 then succeeding cleanly. On that route the step-1 afterimage says "the armed men at both ends stood down", and then the overview said "men from both houses were hurt in the scuffle at the far end". That is trigger 35, conflict.
3. **The crit-fail page conflicted with its step-0 route.** A step-0 critical failure ends the action (`terminalActionOutcome`: a critical failure is terminal under `continue_weakened` too). Its afterimage was only "the captain … called the exchange off", but the overview, the stakes (`risk` / `lostBadly`: "steel drawn on the bridge") and the chip title ("Blamed for the Bridge") all asserted a fight on the bridge that never happened. Trigger 35, conflict.
4. **s@c cost the master nothing.** The brief's band table says s@c is "the prize lands and the master carries something for it: a condition, a debt, an enemy". No write the master carries was keyed to the success side.

## 1. Prose Quality

The openings are one sentence per class and the step-0 spine carries situation and problem. That is the granary-riot model and it stays at 77 words. P3 states the stake as a fact: "{cast:captain} holds one of the heirs and will not release them without a ransom." Nothing is interior and nothing is camera work.

Weak passages, rewritten:

- Step 0 success afterimage, "the captain's men want no part of the ransom": the tense breaks against "named". `[EDITORIAL REWRITE]` "…and the captain's men refused to back the ransom."
- Loosen Guarded Tongues failure, "The captain's men talked freely, and the captain heard every word": on the failure page this tells "the captain heard" twice, next to the afterimage "The captain heard of the questions…" (seam echo, trigger 22). `[EDITORIAL REWRITE]` "The captain's men talked as freely as anyone, and carried every word back to their captain." The card's payoff is now the cause: it loosened the wrong tongues.
- Reveal The Price s@c, "along with an insult to the held heir's house": whose insult is unclear (trigger 29). `[EDITORIAL REWRITE]` "The captain's price came out, and the captain insulted the held heir's house in naming it."
- Reveal The Price success, "it was less than the first demand": this implies a ransom was haggled down and paid, and that conflicts with "will not let {cast:heir} cross unpaid" and the new grudge chip. `[EDITORIAL REWRITE]` "The captain named the sum out loud, and both houses refused it on the spot."
- Failure overview, "The captain's greed outweighed them": "them" points at nothing. `[EDITORIAL REWRITE]` "…They sent for a master so the haggling would end, and the captain outlasted {actor}." That states plainly why it costs more for a master.
- Crit-fail overview, "…the peace … is broken … both now say {actor} lost them the peace": this tells the broken peace twice. `[EDITORIAL REWRITE]` "…both now blame {actor} for it."

## 2. Branch Seduction Audit

Linear, branch count 0. There is no fork for the player to pick. The mortal's stance lives in the aftermath reactions only.

## 3. Branch Count Assessment

KEEP 0. A medium two-beat handover needs no fork. The step-0 band reaches step 1 through `carryoverFactorLines`, and that is enough path dependence.

## 4. Scale Discipline Check

Medium with two beats and reaction choices: correct.

## 5. Inspiration Anchor Honesty

`hook.rebuilding_trust` really shapes the scene: the peace is agreed, and the risk is one walk across a bridge. The oath-breaking scandal survives as the captain's last-hour move. Honest.

## 6. Aftermath Payoff

Each band is actor-centred and names faces: {cast:heir}, {cast:captain}, the town. After the fixes, every success band leaves the master a short-contract band and an enemy in the captain. Every failure band leaves a doubting heir and a cooler town. The success side still ends warm, as the brief asks for slot 3: both heirs home, the peace held, the honest men gone from the greedy one.

## 6b. Page read (after fixes)

**critical_success**
> The two houses renewed their peace in front of the town that evening, with {actor} standing between them.
- The Town's Thanks: {location} thinks better of {actor} now.
- The Heir's Trust: {cast:heir} trusts {actor} now.
- The Sergeant's Band: The sergeant's men quit the captain for a short contract with {actor}.
- The Captain's Grudge: {cast:captain} blames {actor} for the lost ransom.
> Let the captain go quietly: keeps the demand out of the town's talk. · Tell the town what the captain asked: the town will think better of the mortal.

Repetition: none. The old overview, "The captain left {location} alone the next morning", paraphrased the sergeant chip, so it was cut. Conflict: none.

**success**
> Both heirs are home, and the peace between the two houses holds.
- the same four chips · the same reactions

Clean.

**success_at_cost**
> Both heirs are home, but the exchange came close to blows before it was done.
- the same four chips · the same reactions

Before the fix this band was a conflict (fix 2). The new overview is true on every s@c route: step-0 s@c, failure or near-miss followed by step-1 success, and step-1 s@c or near-miss.

**failure**
> Both heirs are still hostages, and the two houses are counting the days again. They sent for a master so the haggling would end, and the captain outlasted {actor}.
- Terms Refused: {location} thinks less of {actor} now.
- The Heir's Doubt: {cast:heir} trusts {actor} less now.
> Stand by the held heir · Blame the captain openly

Clean.

**critical_failure**
> The peace between the two houses is broken, and both heirs are still hostages. Both houses sent for {actor}, and both now blame {actor} for it.
- Blamed for the Peace: {location} thinks less of {actor} now.
- The Heir's Blame: {cast:heir} trusts {actor} less now.
> Stand by the held heir · Blame the captain openly

The step-0 route's afterimage now reads "…called the exchange off, and both houses took it as the peace broken". The page is true on both routes.

## 7. Dilemma Energy

The hand gives four honest questions: what people will say (mind), what the captain hides (light), whether the blades stay down (order), and whether the mortal's word is trusted (True). The reactions put real stances in front of the player. Discretion toward a man who now holds a grudge stands against open truth for the town. Comfort for the heir stands against accusing the captain. The grudge chip gives "Let the captain go quietly" a reason it lacked before.

## 8. Experience Differentiator Gate

| # | Question | Answer | Evidence |
|---|---|---|---|
| 1 | Narrator-mode skeleton ≤80 words | YES | 77, both classes |
| 2 | Every sentence works | YES | no atmosphere-only lines |
| 3 | Scene names what the hand acts on | YES | questioned people, the captain's demand, armed men, the terms |
| 4 | Retellable after one read | YES | |
| 4b | No seam echoes | YES (after fix) | the Loosen Guarded Tongues failure fragment was rewritten |
| 5 | Spell-style faces, no flavor quote | YES | |
| 6 | Mechanism effect lines; real prices | YES | essence 2 ×3; trait card cost 0 |
| 7 | Every card pays off in failure | YES | each special has ≥1 failure band; no big-delta card |
| 8 | Card targets established in prose | YES | the sergeant is named in the step-1 spine |
| 9 | Different questions | YES | |
| 9b | 4–8 composed hand, 2 specials + deal 3 | YES | |
| 10 | Reflective aftermath | YES | |
| 11 | Actor-centred, sheet-word nouns | YES | `reputation with {location}`, `reputation` + cast concept, `companion` |
| 11b | Every page clean | YES (after fixes 2, 3) | § 6b |
| 12 | Reaction choices | YES | |
| 13 | Philosophical stances | YES | |
| 14 | Evocative art direction | YES | an empty bridge, a cloak on the parapet, furled banners, no people |

## 9. Fix-list (all applied to `hostage-exchange.package.json`)

1. The companion chip detail (×3) is now "The sergeant's men quit the captain for a short contract with {actor}." It is truthful about the 10-tick contract and gives the cause in 12 words.
2. The s@c overview is now "Both heirs are home, but the exchange came close to blows before it was done." It is true on every s@c route.
3. The step-0 crit-fail afterimage adds "…and both houses took it as the peace broken". Stakes `risk` / `lostBadly` are now "the peace between the two houses broken". The crit-fail town chip is retitled "Blamed for the Peace".
4. The master's s@c cost: step-1 `successMetadata` adds `bond_change $cast:captain` −0.08 / −0.06, chipped "The Captain's Grudge" on all three success bands, so every route that writes it shows it.
5. The crit overview rewrite drops the line that paraphrased the sergeant chip.
6. Step-0 success afterimage tense fixed.
7. Loosen Guarded Tongues failure fragment de-echoed.
8. Reveal The Price success and s@c fragments rewritten (no paid ransom, clear insult).
9. Failure and crit-fail overviews rewritten (clear referent, no fact told twice).
10. The "Tell the town" intent now names the effect it backs (+0.03 town standing) and drops "who refused to pay it".

**Consider (not applied):** the companion is an iron +3 sellsword band on a heart encounter. That is honest to the fiction (soldiers), and no heart-flavoured profession template fits a captain's sergeant.
