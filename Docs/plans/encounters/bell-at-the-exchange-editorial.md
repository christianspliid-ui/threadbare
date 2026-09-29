# Encounter Pipeline: The Last Lot at the Exchange
> Scale: local (short) | Slug: bell-at-the-exchange | Pass: editorial
> Date: 2026-09-29 | Pipeline version: 2.0
> Critic: independent (batch journeyman-everyday-1, slot 5, THR-1676). Edits applied directly to `bell-at-the-exchange.package.json`.

## 1. Prose Quality

The draft is plain narrator-mode game prose throughout: no interiority, no camera work. A merchant house and its buyer sit across the table, which is the journeyman register the brief asks for. It had four defects.

- **The P3 stake named the win condition, not what is at risk.** "Whoever holds the last bid when the bell rings takes the lot" says how the scene is won. It does not say what the mortal stands to lose. The brief wants money or standing stated plainly. `[EDITORIAL REWRITE]` appended: *"…takes the lot, and a house outbid on its own floor remembers who did it."* The `reputation_with $cast:buyer` write backs this on both the success and the failure side, so it satisfies rule 34.
- **Invented state (rule 31).** "knows every bidder in the room except {actor}" asserts that no relationship exists between the mortal and a *reused* merchant/trader/noble, who may well already know them. Changed to "knows every regular bidder". The trespass reading is carried by "The merchant houses treat the exchange as their own."
- **Word repetition.** "floor" appeared four times in about 80 words. Cut to two. The opening now comes to 78 words, under the budget; it had been at 82 after the stake was added.
- Step 1 spine: "and never looks at the lot" was an encoded character tell. Cut, so the spine now states facts only.
- Step 0 `successAtCostAfterimage` "the house buyer watched them do it" did not say what the cost was. Rewrote it as "{cast:buyer} saw the figure they settled on".
- Fragment "this season the floor is thinner" needed two readings (trigger 29). Rewrote it as "in a thin season it was far too low", which ties back to the scarcity premise.
- `Hold The Bell` critical_failure "long enough for the house to win it twice over" was ambiguous. Rewrote it as "the house raised twice more before the bell."

## 2–4. Branch seduction / count / scale

Linear, test-and-consequence with a query-prize face. There are no branches: `KEEP 0`. Two beats at local/short is the right size.

## 5. Inspiration anchor honesty

`hook.scarcity_crisis` shapes the scene: a thin season and one lot left. The hook does real work, because it is why the house wants the lot and why the price runs past last season's.

## 6. Aftermath payoff / 6b Page read

I assembled each band as overview → chips (scar · bond · boon), with the engine's PRIZE chip on the success side.

- **critical_success**: the overview's "bowed to the stranger who beat the house" and the chip's "Outbid a merchant house on its own floor" told the same fact twice (trigger 35). The overview now reads "bowed to them in front of the whole floor", and the chip keeps the cause. I also dropped "stranger", which was an invented relationship.
- **success**: the chip's "Held the last bid" was a paraphrase of "The bell rang on their bid" (repetition). I dropped the causeClause, so the detail alone carries the change.
- **success_at_cost**: "paid well past its worth to beat the house" and "Kept raising after the house stopped" were near-duplicates. The overview now says "bought well past its worth…", and the chip says "Outlasted the house".
- **failure**: the scar's "Lost at the bell" repeated the overview, and the bond's "Bid a house up and dropped out" paraphrased "the house paid more … because of {actor}". I dropped both causeClauses. The bond now reads "{cast:buyer} holds the cost against them."
- **critical_failure**: "The floor now knows the stranger who bid it up" promised a town-wide standing that nothing writes (rules 31/34). Cut. The bond detail "Made a house pay dear for its own lot" repeated the overview, so the causeClause was dropped. The scar keeps "One raise short", which is new information.
- **Item chips removed on the three success bands.** A step `rewardPool` draw already renders as an engine `item` PRIZE chip that names the actual drawn item (spec § Rewards route 1). The authored `BOON · trade goods` chip would have told the prize twice. It also anchored nothing (Law 56 clause 2: gate failure).

After these fixes the pages read clean. One weakness is carried forward, not a stop: the success_at_cost cost ("well past its worth") exists in prose only. No write carries it unless step 0 failed, in which case the compulsion is already on the sheet.

## 7. Dilemma energy

There is real tension. `Hold The Bell` cuts both ways: time given to the mortal is also time given to the house. Its fragments pay that off only on the cost and failure bands. The three specials answer three different questions: the price, the rival, and the clock.

## 8. Experience Differentiator Gate

1 YES (arrival · thin season / one lot · stake) · 2 YES · 3 YES (the price, the buyer's count, and the bell rope all appear in the prose before the cards act on them) · 4 YES · 4b YES (fixed the "floor" echo) · 5 YES: card names fixed to lexicon verbs, "Recall The Price" → **Remember The Price** and "Jumble The Count" → **Cloud The Count** (the check had been warning on both) · 6 YES · 7 YES · 8 YES · 9 YES · 9b YES (both steps compose 6: 1+5 deal, 2+4 deal) · 10 YES · 11 YES (`reputation with {target}`, `compulsion`) · 11b YES after the fixes · 12 N/A (local) · 13 N/A · 14 YES (an empty block and a swinging bell rope: residue, not illustration).

Title: "The Bell at the Exchange" failed the glance test (trigger 27), because nothing in it says auction. Renamed to **The Last Lot at the Exchange**. The id is unchanged.

## 9. Verdict

**PASS WITH REVISIONS**: every revision was applied to the package. No REVISE trigger remains.

## 10. Revision summary

Must fix (applied): P3 stake, invented stranger/standing state, band repetitions (critical_success, success, success_at_cost, failure, critical_failure), removal of the duplicate item chips, title.
Should fix (applied): card names, "floor" echo, unclear fragments.
Consider: a band-keyed cost write for success_at_cost when step 0 succeeded.
