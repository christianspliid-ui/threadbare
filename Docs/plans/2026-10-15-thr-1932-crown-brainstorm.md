> **title:** Brainstorm companion — the crown (THR-1932)
> **linear_issue:** THR-1932
> **author:** Claude Code (design lane, unattended, run 2026-10-15d)
> **created:** 2026-10-15

# Brainstorm companion — the crown

This file holds the alternatives weighed and the reasons for the how-level choices in [the crown plan](2026-10-15-thr-1932-crown.md). The *what* is settled by [the crown decision](https://linear.app/threadbare/issue/THR-1917), which was decided with Christian present. Every choice here sits inside that decision and is recorded so it can be vetoed.

## Vision premises in play

1. *"the crown goes to those who can convince other factions of fealty and tax rights"* (Christian, 2026-10-14). The crown is **earned**, it is not a starting title.
2. **Force is allowed; one layer only** (Christian's rulings on THR-1917).
3. *Mechanics surface through prose, never numbers.* Loyalty is a word and a reason.
4. The map's test: *does this give factions something worth fighting over?* (THR-1863).
5. **Equilibrium is silence.** A world where twenty guilds quietly pay a crown should not chatter.

## Choices

### 1. Only realms court

- **Taken:** a liege must be a realm that holds at least one town. This is the prototype's rule. Its 20 oaths in 90 days all went to realms, and the predicates were measured on it.
- **Weighed:** letting any faction court (a rich merchant guild buying temples).
  - It would make "crown" mean a guild cartel too.
  - The decision's border rule ("the crown's border is the union of its sworn realms' borders") only makes sense for a landed liege.
  - Christian's words were *"the king of a country"*.
- **Would change it:** Christian wanting merchant princes to hold oaths.

### 2. `seek_fealty` is a faction action; loyalty is a phase

- **Taken:** the decision says *"a new faction action, `seek_fealty`, on the faction-action cadence"*. So the action joins the existing table (`phaseFactionActions.ts:85-135`) and competes in `selectWeighted` like every other action (Law 42: the generic seam).
- Loyalty and tax need a daily heartbeat that does not depend on a weighted draw. The decision puts them *"in the holding-income cadence"*, so they get a small `crown` phase right after the purse.
- **Calibration risk:** the prototype courted once a day; a weighted pick is not guaranteed. The plan adds a cooldown of 12 ticks and a weight, plus a Done-when predicate (70–100% of days) to tune them.

### 3. A vassal pays its soldiers before the crown

- **Taken:** the tax is taken in the `crown` phase, after `faction_purse` has paid upkeep. It is capped by what is left, and it never goes into debt.
- **Weighed:** taking the tax off the top, before upkeep.
  - It would make every vassal's army desert faster, and a crown's growth would bleed its vassals' defences.
  - It would also have to edit the purse's settle step.
- Paying soldiers first reads true ("a lord feeds his own spears first") and keeps the purse plan untouched.

### 4. A refusal cools; a break wounds

- **The decision says** *"every break and refusal leaves a chronicle line and a rival tie"*. The prototype logged **250 refusals in 90 days**, and its caveat notes rival ties growing from 4 to 136 (churn like [THR-1918](https://linear.app/threadbare/issue/THR-1918)).
- A declared rivalry plus a chronicle line on every refusal would:
  - flood the Chronicle;
  - turn most factions into rivals of every realm within a season.
- **Taken:**
  - **A refusal** nudges `relates_to.sentiment` by −0.02, floored at −0.25, just above the rivalry threshold of −0.3. It writes a trace and no chronicle line. Refusals seed bad feeling, and the existing rivalry action turns that into a rivalry when other pressure adds up.
  - **A break** takes −0.3 sentiment, records the break on `relates_to`, and gets a chronicle line inside attention.
- **Would change it:** Christian wanting refusals to be loud ("every snub should be news").

### 5. The cooldown lives on `relates_to`

- A broken pair waits 20 days. That is a fact about two factions, so under *relationships are edges, not properties* it belongs on their edge.
- The pair's `relates_to` edge already exists or is minted, and it gains `oathBrokenTick`.
- **Rejected:** a `cooldowns` map on the faction node.

### 6. "A town just taken" is read off the conquest edge

- `applyConquestOrVacuum` moves the `controls` edge to the victor (`battleAftermath.ts:357-363`), so the previous holder is lost.
- **Taken:** write `takenFrom` on the moved edge. It is one property, written at the one conquest site, and read by both coercion and the `holding_lost` loyalty fall.
- **Rejected:** reading traces, because tracing can be off and the engine must not depend on it.

### 7. Loyalty uses the reputation words, and breaks at *Distrusted*

- The decision: loyalty is *"the sworn faction's reputation with its liege … worded with the existing reputation words"* (Law 43).
- `REPUTATION_WORDS` bands at 0.2 (`domain-words.ts:197-203`). The decision's break threshold, 0.2, is **exactly** the *Distrusted* boundary, so the player rule is one sentence: *at Distrusted, the oath breaks*.
- Starting words:
  - coerced 0.35 → *Unknown*;
  - bought 0.6 → *Respected*;
  - persuaded 0.7 → *Respected*.
- **Tension, resolved in words:** *Unknown* on a coerced vassal reads oddly on its own. It is the ladder's own neutral word, and inventing a loyalty ladder would break Law 43. So the standing line always carries how the oath was won, and in the *Unknown* band it adds "one step from breaking": "*Its standing with its liege: Unknown, one step from breaking — it swore under siege, and its loyalty is falling because its liege cannot pay its soldiers.*" (intent judge, pass 1).
- **Weighed:** the faction relations labels (Allied … Enemy, `factionNetwork.ts:463-469`) on `2×loyalty−1`. They read better on a vassal, but they contradict the decision's explicit "reputation words", and that decision was made with Christian present.
- **Would change it:** Christian preferring "Wary / Friendly" for oaths.

### 8. *Fealty* and *Crown*, never *sworn*, *king* or *kingdom*

- **Sworn:** the realm court ladder already has a *sworn* rung (`realm-content.ts:230`: stranger · subject · yeoman · **sworn** · thane · counsel). "The Scarlet Company is sworn to Skyfield" next to "Aldo is sworn in Skyfield's court" would be one word for two things (Law 43). So the player word is **fealty**, and `sworn_to` stays a code identifier.
- **Kingdom:** retired on player surfaces (UL Realm). A Crown is a title on a Realm, not a second object.
- **King / queen:** the ruler may be any agent, and guessing gender is wrong. Instead: *"<name> wears the crown"*.
- Filed as [UL-proposal: Crown and Fealty](https://linear.app/threadbare/issue/THR-1943).

### 9. The outline appears only when a realm is sworn

- The decision: *"the crown's border is the union of its own and its sworn realms' border projections, drawn as an outer line."*
- Guild vassals hold no hexes, so a crown of guilds has the same border as its realm. A second line there would be pure decoration.
- The prototype saw **no realm swear in 90 days** (pride and rivalry stopped it). So the outline will be rare, and it means something when it appears.

### 10. No royal charter in v1

- [THR-1868](https://linear.app/threadbare/issue/THR-1868) left *"royal charter is the crown's to grant"* to this plan.
- A charter would grant a guild a monopoly or a lane, but nothing yet reads such a grant: mortal wealth ([THR-1936](https://linear.app/threadbare/issue/THR-1936)) and regional monopolies (war aims) are not built.
- Saying "chartered" with no system behind it breaks Law 45. **Ruled out of v1;** revisit with mortal wealth.

### 11. The purse's tax-holder rule stays

- The purse plan expected the crown to *"change who the tax holder is"*. The decision instead puts fealty **on top of** the 20% landholder cut.
- So `taxHolderOf` stays. Fealty is a second, separate flow from vassal to liege, and the purse plan's note is corrected in the build PR.

### 12. Defence is war aims' code, behind a guard

- Defence-first is decided in [THR-1868](https://linear.app/threadbare/issue/THR-1868) and planned in [THR-1933](https://linear.app/threadbare/issue/THR-1933). Writing army objectives here would collide with that plan's `selectArmyObjective` rewrite.
- **Taken:** the crown exports `protectedHoldingsOf`, and no surface promises defence until war aims is on main (Law 45).
- The loss of a holding still costs loyalty, so a crown that fails to defend is already punished.

## Tensions

- **Legibility vs mystery** (Vision design tension 4): an oath list on every faction sheet could pull toward a 4X ledger. The sheet shows names and words, with no numbers. The watch item goes to the next warm playtest.
- **Rebellion is specified but untested:** no realm swore in the prototype's 90 days, so rebellion never fired. The fixture tests cover it; a real run may not see one for a long while. That is acceptable: a rebellion should be rare.
