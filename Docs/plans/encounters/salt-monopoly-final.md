# Encounter Pipeline: The Salt Monopoly
> Scale: short (`scale: local`) | Slug: salt-monopoly | Pass: final
> Date: 2026-10-14 | Pipeline version: 3.0 | THR-1757 master batch 2, slot 2
> Status: **READY WITH CAVEATS** · Package: **connected** (PACKAGE PASS)

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | Author's draft + self-edited revised doc + package |
| Editorial (cold) | PASS WITH REVISIONS | Three seam echoes, a timing conflict in Cloud The Tally, two missing near-miss lines, an unanswered sac promise, and the seal case never handed over in prose — all fixed in the package |
| Systems (cold) | READY WITH CAVEATS | Every id resolves; the inherited `merchant` binding seats the factor in the mill lease's `merchant` slot (traced in code); spawnName changed to male-coded to match the sequel's he/his |
| Package (cold) | PACKAGE PASS · connected | Leaves a Gate Seal Case, town reputation, and the same factor as the rival bidder in The Mill Lease |

### Caveats

1. Live proof needs a pinned band or a seed sweep — success-side claims (item, seed, +0.08) read *not exercised* on a failed run at gold 0.80.
2. Pre-existing on the seed path, not this package: a seeded mill lease gets only inherited bindings, so its own `cellarer` is unbound (prose falls back to "Brother Anselm"; its `$cast:cellarer` appointment counterparty fails soft), and the inherited `clerk` rides along unused.
3. The mill lease calls its merchant "a grain merchant"; a salt factor bidding on a mill reads as a trading house diversifying — acceptable, not seamless.

### Editorial Notes Summary

See `salt-monopoly-editorial.md` § 10 (11 fixes, all applied). In brief: de-echoed the opening → spine seam, the Rouse The Backers fragments and the Weigh The Coin True critical_failure fragment; moved Cloud The Tally from "bid" to "named a sum" (step 0 is before the bids); handed the seal case over in step 1's success-side afterimages; added near-miss afterimages on both steps; "read the duke's seal" → "read the duke's licence"; dropped the sac overview's unanswered "the backers want their silver back"; "Take the debt on yourself" → "Carry the town's debt".

### Implementation File Map

Compiler-owned: `npm run compile:encounter -- Docs/plans/encounters/salt-monopoly.package.json` → `src/data/encounters/salt-monopoly.ts`, its structural test, both registrations. Beyond that: optional concept art `public/concept-art/encounters/salt-monopoly.jpg`; at closeout stamp `encounter.town.salt_monopoly` into `hook.artifact_recovery.usedBy` in `src/data/content-eval/plotHooks.ts`.

---

## Encounter Packet (matches `salt-monopoly.package.json`)

### Design block

- **Crux.** The duke's chancery is selling the region's salt licence for ten years, and {actor} must win it for the town against a rival town's salt house.
- **Whose problem.** The agent's: sent by name by the town council, which will blame them if the salt goes to the rival. Scene-local; no prior tie asserted.
- **Shape.** Seeded Sequel on a Test & Consequence spine, linear. Step 0 gold 0.74 `continue_weakened` (its critical_failure ends the action); step 1 gold 0.80 `fail_action`, carryover lines keyed on step 0.
- **Consequence hand (binding).** `possession` — step 1 success `attachment_grant reward_tools_instruments_gate_seal_case` on `$actor` (the town holds the licence; the clerk hands the mortal its gate seal case), plus the sac pledge `agreement.debt.minor` with counterparty `$cast:clerk`. `story_seed` — step 1 success `encounter_seed` → `encounter.town.mill_lease_auction`, `delayTicks 72`, `inheritContext`, placeless; the factor's cast key `merchant` matches the mill lease's rival-bidder key.
- **Extras.** `reputation_with $here` +0.08 (step 1 success) / −0.10 (step 1 failure) / −0.05 (step 0 failure).
- **Trait hooks.** Variant: Monopolist (`trait.reputation.monopolist`) +0.04. No gate, no trait-only nudge, no trait fragment.
- **Systems.** cast + rewards + seeds + reputation (four; floor 3).
- **Cast.** `merchant` — the rival salt house's factor (reuse merchant / trader / broker; spawn "Edric Varne"). `clerk` — the duke's chancery clerk who holds the sealed reserve (reuse clerk / scribe / steward; spawn "Matthias Penrose").
- **Stakes.** goal "win the duke's salt licence for the town" · risk "see the town's purse fall short before the council" · won / lost / lostBadly as in the package.
- **Plot hook.** rolled `hook.underground_city, hook.artifact_recovery, hook.deck_reading_gone_wrong`; taken `hook.artifact_recovery`.

### Opening (urban)

> {actor} arrives at the duke's chancery in the cathedral close of {location}, sent by the town council.

### Step 0 — "Build the town's purse" (gold 0.74) · continue_weakened · deal { count 4, tags social, insight }

Spine:

> The duke is selling the salt licence for ten years, and bids are taken today. A rival town's salt house has sent {cast:merchant}, its factor, with a heavy purse.
>
> The council's backers will pledge only what they think can win. {actor} has to read the room and build a purse big enough before the bids are called.

Afterimages:

- criticalSuccess: The backers saw the room clearly, and pledged more than the council had asked.
- success: The backers pledged enough to bid against the rival house.
- nearMiss: The backers pledged less than the council had asked, but enough to bid.
- successAtCost: The backers pledged enough, but the rival factor saw exactly how much.
- failure: The backers held back, and the town's purse came up thin.
- criticalFailure: The backers walked out, and the rival factor heard how little the town had.

Specials:

- **Rouse The Backers** (spirit, 2 essence, +0.1, generic.crowd) — Fill the council's moneyed men with civic pride. They pledge more of their own silver to the purse.
  - critical_success: Each of them tried to give more than the last, for the town's name.
  - success: Some gave more than they had meant to, for the town's name.
  - near_miss: They grew proud of the town, but gave little more than before.
  - failure: They talked proudly of the town, and kept their silver in their purses.
- **Cloud The Tally** (chaos, 1 essence, +0.08, opposes merchant, generic.luck) — Tangle the rival factor's reckoning of their own coin. They show the room a smaller purse than the one they hold.
  - success: {cast:merchant} counted the rival purse twice, and named a sum short of what it held.
  - success_at_cost: {cast:merchant} lost the count for a while, and found it again before the bids were called.
  - failure: {cast:merchant} lost the count once, found the error, and named the full purse anyway.
  - critical_failure: {cast:merchant} found the error aloud, and the room learned how rich the rival house was.

### Step 1 — "Close at the table" (gold 0.8) · fail_action · deal { count 4, tags social, presence }

Spine:

> {cast:clerk}, the chancery clerk, holds the duke's sealed reserve, the lowest price the duke will take. The clerk will seal the licence to the best bid at or above it, and to nobody else.
>
> {actor} has to close above both the reserve and the rival's bid. If the salt goes to the rival town, the council will blame the one it sent.

Afterimages:

- criticalSuccess: The town's bid cleared the reserve and the rival's by a wide margin. The clerk sealed the licence at once, and gave {actor} the seal case that stamps the town's salt at the gates.
- success: The town's bid beat the rival's, and the clerk sealed the licence to the town. {actor} took the seal case that stamps the town's salt at the gates.
- nearMiss: The town's bid cleared the reserve by a few coins. The clerk sealed the licence to the town, and gave {actor} its seal case.
- successAtCost: The town's bid cleared the reserve only with part of the price left owing to the chancery. The clerk sealed the licence and handed {actor} its seal case.
- failure: The rival's bid stood highest, and the clerk sealed the licence to the rival town.
- criticalFailure: The town's bid fell under the duke's reserve, and the clerk sealed the licence to the rival at once.

Carryover factor lines (from step 0):

- critical_success (for, 0.06): The council's backers pledged more than was asked.
- success (for, 0.04): The town's purse is big enough to bid.
- success_at_cost (against, -0.02): The rival factor knows what the town has pledged.
- near_miss (against, -0.03): The backers pledged less than was asked.
- failure (against, -0.04): The town's purse is thin.

Specials:

- **Weigh The Coin True** (order, 2 essence, +0.12, generic.focus) — Make every piece in the town's purse ring full on the clerk's scales. None of it is set aside as clipped or light.
  - critical_success: Every piece rang full on the scales, and the clerk counted the town's purse at its whole worth.
  - success: None of the town's silver was set aside, and the purse counted whole.
  - near_miss: The silver rang full, but the clerk still set a few worn pieces aside.
  - failure: The town's silver counted whole, and the rival's purse still counted more.
  - critical_failure: The silver counted whole, and was still not enough.
- **Stretch The Hour** (time, 1 essence, +0.08, generic.memory) — Hold back the chancery bell while the last bids are read. The clerk hears every offer before the seal is set.
  - success: The bell rang late, and the clerk heard the town's last offer before the seal was set.
  - success_at_cost: The bell rang late, and the rival used the time to raise as well.
  - failure: The bell rang late, and the extra time served the rival's purse better than the town's.

### Aftermath (fallback.byOutcome, branchOnStep 1)

**critical_success** — The salt of the whole region is the town's for ten years. The council read the duke's licence aloud in the square, with {actor}'s name beside the town's.

- BOON · Gate Seal Case — Handed over with the licence. {actor} holds the stamp for the town's licensed salt.
- BOON · reputation with {location} — {location} trusts {actor} with its trade.
- PATH · seed — Outbid at the chancery. {cast:merchant} will bid against {actor} for the next lease.
> Offer the losing house the carting — Give the rival house the work of carting the town's salt. The factor is warmer toward the mortal for it.
> Keep every cart for the town — The town's own carters keep the work. The town's regard rises, and the factor takes against the mortal.

**success** — The salt of the region is the town's for ten years, and the council knows who won it.

- BOON · Gate Seal Case — Handed over with the licence. {actor} holds the stamp for the town's licensed salt.
- BOON · reputation with {location} — {location} trusts {actor} with its trade.
- PATH · seed — Outbid at the chancery. {cast:merchant} will bid against {actor} for the next lease.
> Offer the losing house the carting — Give the rival house the work of carting the town's salt. The factor is warmer toward the mortal for it.
> Keep every cart for the town — The town's own carters keep the work. The town's regard rises, and the factor takes against the mortal.

**success_at_cost** — The licence is the town's, but part of the price is still owed to the chancery, and someone must stand for it.

- BOON · Gate Seal Case — Handed over with the licence. {actor} holds the stamp for the town's licensed salt.
- BOON · reputation with {location} — {location} trusts {actor} with its trade.
- PATH · seed — Outbid at the chancery. {cast:merchant} will bid against {actor} for the next lease.
> Carry the town's debt — The mortal owes the chancery what the town could not pay. The town's regard rises for it.
> Leave the debt with the council — The council pays the rest itself. None of it falls on the mortal, and the town's regard falls.

**failure** — The council sent {actor} by name to win the salt, and the salt has gone to the rival town for ten years.

- SCAR · reputation with {location} — Every backer heard. {location} thinks less of {actor}'s word on money.

**critical_failure** — The salt has gone to the rival town for ten years, and the whole council saw the town's purse fall short. {actor} was the one it sent.

- SCAR · reputation with {location} — {location} thinks less of {actor}'s word on money.

### Narrative templates

- initiation: The duke's chancery is selling the region's salt licence for ten years. {actor} has been sent by the town council to win it.
- success: {actor} won the duke's salt licence for the town.
- failure: The salt licence went to a rival town, and {actor} could not stop it.

### Description

> The duke's chancery is selling the licence to the region's salt for ten years, and a rival town's salt house has come with a heavy purse. The licence goes to the best bid above the duke's sealed reserve.

### Experience Differentiator Gate

All 14 (plus 4b, 9b, 11b) YES after the editorial fixes — evidence in `salt-monopoly-editorial.md` § 8.

### Concept Art Direction

Emotions: a whole town's living staked on one sealed number; a rival who lost and will remember. Image: a cooled red wax seal broken in two on a bare chancery table, a few grains of salt spilled beside it, an empty scale pan raised. No people.
