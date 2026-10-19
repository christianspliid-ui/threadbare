> **title:** Brainstorm companion — hiring a free company — THR-1974
> **linear_issue:** THR-1974
> **author:** Claude Code (design lane, unattended, run 2026-10-19)
> **created:** 2026-10-19

# Brainstorm companion — hiring a free company

Companion to [`2026-10-19-thr-1974-hiring-a-free-company.md`](2026-10-19-thr-1974-hiring-a-free-company.md). The what was decided on [Mercenary hire](https://linear.app/threadbare/issue/THR-1939) (design lane, 2026-10-18, veto day closed 2026-10-19T01:35Z with no veto). This file records the how-level choices the plan made, the alternatives, and the tensions.

## Vision premises in play

- **Factions need something worth fighting over** (the [Mortal economy map](https://linear.app/threadbare/issue/THR-1863)'s test). Coin that becomes swords is the plainest form of that.
- **Mechanics surface through prose, never numbers.** A wage is a sentence on the sheet ("its liege pays its soldiers"), never an amount.
- **Law 42 (simple frameworks) and Law 43 (one concept).** The decision already chose: a hire *is* the crown's bought oath. Every choice below is judged first on whether it adds a second concept.
- **Law 45 (never promise what the world will not do).** The free company's definition text promises contracts. Today nothing honours that promise.

## Choices

### 1. "What it fields" applies to every faction; "would raise" only to standing-army factions

The decision says the price is "30 days of the larger of the faction's income and the upkeep of what it fields, or would raise if it fields nothing". Any faction that fields an army (a guild with a military ambition can raise one, `armySpawning.ts:108`) is priced on that army's upkeep when it exceeds its income. Only the fallback is narrowed: read literally, a town guild with no army would be priced on an army it will never raise, so "would raise" applies only to factions `keepsStandingArmy` names (realms and free companies, `armySpawning.ts:82`). The intent judge ruled this split faithful to the decision (pass 1, dim 11). It stays one general rule, with no mercenary special case: the same line prices a realm candidate that fields a host.

*Considered:* pricing every faction on the would-raise army (rejected: it inflates guild gifts with no army behind them, Law 45 in reverse); and, in the first draft, limiting the fielded-upkeep half to standing-army factions too (rejected by the intent judge: it contradicts "the upkeep of what it fields").

### 2. The liege pays wages inside the `crown` phase, after loyalty and before the tax

The decision's order is "after a vassal pays its own armies … before the fealty tax is taken". The purse already settles each faction's own armies in `faction_purse`. The crown phase runs right after it on the same tick. The wage step sits between the loyalty pass and the tax there. An oath that breaks today pays no wage today, because loyalty runs first.

*Considered:* paying wages inside the purse, as a second pass after every faction's own upkeep. Rejected: it puts crown knowledge into the purse, and the crown phase already owns every other `sworn_to` read.

### 3. The vassal's own purse record is not rewritten

`purseLastDay.armiesUnpaid` stays the purse's own verdict. The wage is recorded beside it (`armiesPaidByLiege`, `wagesFromLiege`). Rewriting `armiesUnpaid` to `[]` looked tidier, but the purse's "went broke" chronicle compares today's unpaid list with yesterday's. A rewritten yesterday would make it fire every day. The vassal's Means word also stays honest: a company whose liege pays its soldiers is still broke on its own.

### 4. The liege keeps two days of its own soldiers' pay back before paying wages

The crown plan already ruled that "a lord feeds his own spears before the crown takes its share" (crown how-level 3). The mirror for wages is that a liege does not starve its own host to pay a hired one. `LIEGE_WAGE_RESERVE_DAYS` (2) is that reserve. It is also the plan's guard against the ticket's kill case (a crown bankrupted by wages alone). A liege below the reserve leaves the vassal's armies unpaid, and the existing desertion path and the crown's own loyalty falls do the rest.

*Considered:* no reserve, with the kill criterion alone. Rejected: the measured wage for one free company is a quarter to a third of a realm's income (plan § Measurements). Two hires with no reserve would drain a Comfortable realm in about two weeks.

### 5. The liege's Means counts the wages it paid yesterday

A realm paying two hosts' wages burns coin faster than its own armies show. The purse bands a faction by days of upkeep in hand. Adding yesterday's wages to that upkeep keeps the word honest, and the word is what vassal loyalty reads. It is one additive term in `meansBand`'s caller, not a new band rule.

### 6. Command replaces the army's banner; it is not a union of enemies

Rule 4 says an army the liege paid today "takes the liege's enemies as its own". There are two readings:

- **Union:** the army fights its own faction's enemies *and* the liege's.
- **Replacement:** the army fights under its paymaster's banner. For targeting, siege and battle, it reads its commander's enemies.

The plan takes **replacement**. A company on a lord's wage does the lord's fighting. Its own grudges wait until the coin stops. One faction id flows through every enemy check (`commanderFactionOf`), so no call site has to merge two sets. It also gives a clean guarantee that a paid company never marches on its liege or on a fellow vassal. The decision's guard still holds: "a vassal that pays its own armies keeps its own wars". Replacement applies only to an army whose wage the liege paid in the last pay day.

*Considered:* union. Rejected: a company could besiege a town of its liege's ally, dragging the liege into a quarrel it never chose.

### 7. Command includes defence

War aims' defence-first rule reads `protectedHoldingsOf(faction)`. A commanded army reads it for its commander. So a hired host rides to defend its liege's towns and its fellow vassals' towns. That is the plainest form of "commands them", and it is what makes the crown chip's promise ("must keep them safe") easier to keep.

### 8. Supply: the liege's towns are added, not substituted

For feeding, the army may eat from its own faction's towns *or* its paying liege's. A company that holds a town (rare, through conquest) does not lose it as a granary when hired.

### 9. No liege-funded raise in v1

The census shows a further gap the decision did not name. A free company starts with a host, goes broke by about day 20 paying for it (it earns well under a host's upkeep), loses it, and cannot raise again: its purse sits at 1–30 coin against the 53.5 a host costs to raise. A *bought* oath fixes this on its own once rule 1 prices the gift on the host's upkeep: the gift lands in the company's purse and pays for the raise. A *persuaded* or *forced* oath with no army stays armyless.

The plan does not add a fifth rule ("the liege pays for the raise"). That would widen the decision, and the four rules may be enough once wages stop the bleeding at the source: a company sworn before its money runs out never loses its host. The plan measures it (§ Done when, *companies field armies*) and names the fifth rule as the first lever in its kill criteria.

### 10. Two hired companies keep counting toward a Crown

The decision kept them counting and asked the plan to state the measured effect (§ Measurements: how often one hire tips a realm into a Crown). The plan leaves it as decided. *Would change it:* Christian saying "two hired companies should not make a realm a Crown", which is a one-row exclusion in `isCrown`.

### 11. The pay stamp is a tick, not an id

The first draft stamped `{ liegeId, tick }` on the army. Every reader re-checked the live `sworn_to` edge anyway, so the id was redundant and sat against the load-bearing rule that relationships are edges, not property fields. The stamp is now `liegePaidTick` alone. If a vassal changes liege inside one pay day, the new liege commands the army until the next pay day re-stamps or lets the stamp lapse; that is accepted.

## Tensions

1. **Emergence vs authorship.** Who wins a company is left to the existing offer score. No company is ever placed with a realm by hand.
2. **Story vs number.** The wage is never shown as an amount. The sheet says who pays and whether they still can.
3. **Simplicity vs completeness.** Choice 9 deliberately leaves an armyless persuaded company possible. The kill criterion watches it.
