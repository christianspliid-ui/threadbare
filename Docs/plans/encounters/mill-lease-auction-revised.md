# Encounter Pipeline: The Mill Lease
> Scale: short | Slug: mill-lease-auction | Pass: revised
> Revisions applied: step-1 spine seam echo removed ("more … than the fellowship") and the rule now says a bidder must *show* honest dealing (grounds the struck bid); Stretch The Morning's effect line now states a time mechanism; Uncover Hidden Tallies finds *older* tallies (effect line and all four fragments) and the step-0 success_at_cost afterimage no longer contradicts it; success_at_cost page made true on both paths (new step-1 afterimage, overview); failure overview no longer says the town sent for the expert; BOND cause no longer retells the overview; kept sequel seam echo removed
> Date: 2026-10-01 | Pipeline version: 2.0
> Batch: expert-everyday-3 (THR-1680), slot 1 — the batch's appointment slot
> Template id: `encounter.town.mill_lease_auction`

## 0. Mechanical design block (designed before the prose)

| Row | Answer |
|---|---|
| Crux | The abbey's water-mill is up for lease, and the millers' fellowship has sent for {actor} to price the lease and bid for it against a grain merchant with more money. |
| Title | *The Mill Lease* — the objective at a glance: a lease on a mill is being let. |
| Shape | **Seeded Sequel — placed/timed variant (appointment, THR-1479)**, two steps, a test and its consequence (Test & Consequence, carryover). Step 0 prices the mill (the abbey's books against the old miller's tallies); step 1 is the bid itself before the cellarer. Step 1 success plants an `encounter_seed` with an `appointment` block: kept → `town.mill_lease_sealed`, missed → `town.mill_lease_forfeit`. |
| Reach per step | Step 0 **gold 0.58** — pricing a lease from two sets of accounts that disagree is Gold's craft. Step 1 **gold 0.66** — winning a bid against deeper pockets under a rule is Gold's harder test. Mean 0.62, window fit 0.76 (expert band). Words the player reads: *steep*, *severe*. |
| Tier | `rarityTier: 2`, `scale: 'local'`, `intrinsicTier: 'shaping'` (brief: the 0.45 open-draw cap binds `background` only). |
| Settings | `rural` and `urban` (the brief's binding row; the rolled `stronghold` is overridden). One P1 opening per class; the spine names an abbey, a water-mill and a market, which every rural market village and every town carries. |
| Whose problem? | The agent's: their price, their bid, their fee, their name as an expert the fellowship sent for. The fellowship and the abbey are where the problem lives. |
| Why here? | `mission` — sent for by the millers' fellowship, because the lease is let today. |
| Plot hook | Rolled `hook.artifact_recovery, hook.succession_crisis, hook.broken_alliance`. **Taken: `hook.succession_crisis`.** The old miller is gone and the lease is the empty seat. Two parties make a real case for it — the fellowship that grinds the town's corn, and a grain merchant with money — and the merchant has assembled more than an argument: he bought the flour the old miller ground off the abbey's books, so he knows the mill earns more than the books say. `hook.artifact_recovery` set aside (nothing powerful is loose in a mill lease). `hook.broken_alliance` set aside (a border scene; this is a market one). |
| Seed dice | p3 **choice** — "If {actor} prices the lease too high, the fellowship cannot pay it. Too low, and the merchant wins it." Two courses, both costly · opposition **faction (doctrine)** — the abbey's letting rule: the mill goes to the highest bidder who has dealt honestly with the abbey, and the cellarer keeps it to the letter · disposition **open** — the cellarer takes every bid and favours nobody · agentRole **client who is owed** — the fellowship owes {actor} a fee, and pays it only when the lease is sealed (the kept sequel pays it) · scale **region** (recorded; the template field stays `local`, per the brief). |
| Expert stakes | Someone with standing across the table: an abbey and a rich merchant. Failure costs standing first: {location} thinks less of the expert who lost the mill. No death, jail or brand. |
| Consequence hand (binding) | `knowledge` + `story_seed`. No swap. **knowledge** — `intelligence` (`trade_route`) on step 1 success: where the mill's missing grain went (the old miller sold the flour to the merchant). `trade_route` over `political_secret` because its matcher (`trade`, `merchant`, `caravan`, `route`) gives the record readers in the corpus. **story_seed** — the appointment itself (below). |
| Appointment | Step 1 success: `encounter_seed` `templateId: 'town.mill_lease_sealed'`, `targetAgentId: '$actor'`, `delayTicks: 36` (three days to quarter day), `inheritContext: true`, `appointment: { locationId: '$here', counterpartyId: '$cast:cellarer', missed: { templateId: 'town.mill_lease_forfeit', seedLabel } }`. The step-1 spine names the place and the time (at the mill on quarter day, in three days) — prose rule 7b's one lawful exception, and only on the success path. |
| Spine effect | `reputation_with` on `$here`: +0.06 on step 1 success, −0.06 on step 1 failure, −0.03 on step 0 failure (a step-0 critical_failure ends the action, so the critical_failure SCAR needs its own backing write — the boundary-survey lesson). |
| Mortal choice | None — this is a test. `motivations: ['asceticism_extravagance', 'honesty_cunning']` — Gold's own axis (the price of a thing) and the honest-dealing rule the bid turns on. |
| Trait hooks | Gate: none (everyday by construction). Variant: none — no live trait reads accounts better than the reach does. Trait-only nudge: none. Trait fragment: none. |
| Systems quota | cast · intelligence · seeds (appointment) · reputation — four (the kept sequel adds a reward pool). |
| Heavy Hand | none authored (the brief allows at most one across the batch; this slot does not need it). |
| Tags | `['#trade']` — "of buying and selling" (family axis, seated: 23 bearers). |
| Promise → payoff | "Nobody will say how a merchant can bid so much for a mill whose books show so little" (step-1 spine) → paid in step 1's success afterimages (he cannot say where his flour came from) and the knowledge chip (the old miller sold it). "The lease is sealed at the mill on quarter day" (step-1 spine, conditional) → the appointment and both sequels. "{actor}'s fee is paid when the lease is sealed" (success overviews) → the kept sequel's `#trade` reward pool. |

## 1. Inspiration Anchors

- **`hook.succession_crisis`** (vault `Archetypes/Event — Succession Crisis`) — "a seat is empty, several people can make a real case for it, and each is assembling more than an argument." Changed the encounter: the empty seat is the lease, and the merchant's "more than an argument" is the off-book flour, which is the knowledge the hand pays out.
- **The Boundary Survey (batch-2 appointment)** — the worked example for the appointment wiring, the step-0 backing write, the sequel file shape and the missed-sequel regard write retargeted off `$here`. Deliberately *not* copied: its Eye craft, its life/chaos/order/mind spheres, its Whisper/Stumble/Signature/Compulsion types.
- **The Last Lot at the Exchange (journeyman gold auction)** — the nearest sibling scene (outbid a house buyer before a bell). Avoided: its time-sphere bell card (Hold The Bell), its mind price-memory card (Remember The Price), its chaos count card (Cloud The Count). This bid is won by a rule, not a clock.
- Anti-patterns avoided: the Dark Lord problem (the abbey is not a villain; its rule is fair, the cellarer is honest, and the merchant's offence is ordinary greed); the helpful passerby (the mortal is sent for and owed a fee); failure as punishment (nobody is hurt; the cost is standing).

## 2. Scale Justification

Short: two beats. The stake is one lease and one expert's name; the long tail lives in the appointment, which carries the story three days forward to quarter day without adding a third beat.

## 3. Pressure Knot

The old miller is gone and the abbey lets the water-mill today. The fellowship wants it; a grain merchant with more money wants it too, and can somehow bid more than the books say the mill earns. The abbey's rule lets the mill to the highest bidder who has dealt honestly with the abbey, and its cellarer keeps the rule to the letter.

## 4. Intervention Fantasy

The god works on the evidence, on the clock, on the rule and on the rival: an old bundle of tallies brought down from the loft, an hour of prayers that runs long so the books lie open, the cellarer moved to recite the letting law aloud, and a rich man's vanity swelled until he talks about his cheap flour.

## 5. Cast and World Objects

| Object | What | Delivery |
|---|---|---|
| `cellarer` | The abbey's cellarer; takes the bids, keeps the rule to the letter, seals the lease; the appointment's counterparty. Named on step 0. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `monk` / `priest` / `steward`; spawn `monk` "Brother Anselm". |
| `merchant` | A grain merchant with more money than the fellowship; bought the old miller's off-book flour. Role-voiced on step 0, named on step 1. | actor spec, lazy-materialize-on-trigger, must-persist; reuse `merchant` / `trader` / `broker`; spawn `merchant` "Hugh Draycott". |
| The town (`$here`) | Carries the reputation and the appointment's place. | resolved location |
| Intelligence record | `trade_route` — where the mill's missing grain went. | step 1 `intelligence` |
| Appointment | The lease sealed at the mill on quarter day, in three days, with the cellarer there. | step 1 `encounter_seed` + `appointment` |

## 6. Beat Structure

1. **Price the mill** (gold 0.58, `continue_weakened`) — read the abbey's books against the old miller's tallies. Success: the gap found (the tallies show far more grain ground than the books). Failure: only the books to price on (continues weakened). Critical failure: the figure said aloud where the merchant could hear it — ends it.
2. **Win the lease** (gold 0.66, `fail_action`) — bid against the merchant under the abbey's letting rule. Success: the merchant cannot say where his flour came from and the cellarer strikes his bid; knowledge, reputation, appointment planted. Failure: outbid; reputation lost. Critical failure: an accusation without proof.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Opening / burden |
|---|---|---|---|
| critical_success | The fellowship's bid stood from the first; the merchant struck | the day | appointment; knowledge; regard |
| success | The merchant struck under the rule's questions | the day | appointment; knowledge; regard |
| success_at_cost | Lease won, but only after the fellowship raised its bid twice (or priced after the bids opened) | the fellowship's coin | appointment; knowledge; regard |
| failure | Outbid | the lease | the town thinks less of them |
| critical_failure | The bid given away (a figure said aloud, or an accusation without proof) | the lease | the town thinks less of them |

## 10. Sample Opening (narrator mode)

**P1 (rural):** {actor} comes into {location} on market day, sent for by the millers' fellowship.

**P1 (urban):** {actor} arrives in {location}, sent for by the millers' fellowship of the town.

**Spine (step 0), P2:** The abbey's water-mill is up for lease. {cast:cellarer}, the abbey's cellarer, takes bids for it today. The fellowship wants it, and so does a grain merchant with more money than the fellowship.

**Spine (step 0), P3:** The abbey's books and the old miller's tallies disagree on what the mill earns. If {actor} prices the lease too high, the fellowship cannot pay it. Too low, and the merchant wins it.

Word count, P1 (rural, the longer) + P2 + P3: 13 + 32 + 33 = **78**.

## 11. The Hand Per Step

### Step 0 — Price the mill (gold 0.58, purpose "Price the mill")

`deal: { count: 3, tags: ['insight', 'labor'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `mill.uncover_hidden_tallies` | Uncover Hidden Tallies | Cache | matter | 2 | 0.12 | generic.matter | Bring a forgotten bundle of older notched sticks down from the mill loft, so the gap can be checked year by year. |
| `mill.stretch_the_morning` | Stretch The Morning | Signature | time | 1 | 0.09 | generic.focus | Make the hour of prayers run long, so the cellarer leaves the abbey's book open to them with nobody waiting. |

Band fragments:

- **Uncover Hidden Tallies** — critical_success: "A bundle of older tallies lay forgotten in the loft, and the gap ran back for years." · success: "A bundle of older tallies lay in the loft, and they showed the same gap year after year." · near_miss: "A bundle of older tallies lay in the loft, but mice had gnawed most of them." · failure: "A bundle of older tallies lay in the loft, but nobody could say which years they counted."
- **Stretch The Morning** — success_at_cost: "The cellarer stayed at prayers an hour past the bell, then came out wanting the book back at once." · failure: "The cellarer stayed at prayers an hour past the bell, and they spent it on the wrong year's accounts." · critical_failure: "The cellarer came out of prayers early and found them reading the abbey's book unasked."

### Step 1 — Win the lease (gold 0.66, purpose "Win the lease")

`deal: { count: 3, tags: ['social', 'presence'] }` + 2 specials → composed 5.

| id | Name | Type (code comment) | Sphere | Cost | Δ | imageTag | effectLine |
|---|---|---|---|---|---|---|---|
| `mill.read_out_the_rule` | Read Out The Rule | Signature | order | 2 | 0.12 | generic.oath | Set the cellarer reciting the abbey's letting law before bids close, so the clause on honest dealing is heard by everyone. |
| `mill.swell_the_rivals_pride` | Swell The Rival's Pride | Kindled Ambition | spirit | 2 | 0.11 | generic.rumor | Kindle the merchant's vanity as the bids climb, so he boasts aloud of how cheap his flour came. |

Band fragments:

- **Read Out The Rule** — success: "The cellarer recited the letting law before the bids, and every bidder heard the clause on honest dealing." · success_at_cost: "The cellarer recited the letting law, and then held the fellowship to every clause of it." · failure: "The cellarer recited the letting law, but {cast:merchant} swore he had always dealt honestly with the abbey."
- **Swell The Rival's Pride** — critical_success: "{cast:merchant} boasted of how cheap his flour came before the bidding had even begun." · near_miss: "{cast:merchant} boasted of cheap flour, but would not say who sold it to him." · failure: "{cast:merchant} boasted only of his money." · critical_failure: "{cast:merchant} boasted of his money until the fellowship's men shouted him down, and the cellarer closed the bidding early."

Spheres across specials: matter, time, order, spirit (4 distinct before the deal). Common option supplied by the deal. No rider authored. No card grants content. Card-type composition: step 0 Cache + Signature (time); step 1 Signature (order) + Kindled Ambition (spirit). Boundary survey: Whisper + Stumble / Signature + Compulsion; bell tower: Whisper + Long Game / Favor + Boost — no repeat.

## 12. Linear continuation (step 1 spine)

{cast:merchant} bids first, and offers a rent the fellowship cannot match. The abbey's rule lets the mill to the highest bidder who can show he has dealt honestly with the abbey, and the cellarer keeps the rule to the letter. Nobody will say how a merchant can bid so much for a mill whose books show so little. If the fellowship wins, the lease is sealed at the mill on quarter day, in three days, with the cellarer there. If it loses, {location} will think less of {actor}.

### Afterimages

Step 0:
- critical_success: By the time bids opened, they knew what the mill earns, and it was far more than the abbey's books show.
- success: They found the gap. The old miller's tallies showed far more grain ground than the abbey's books.
- success_at_cost: They found the gap, but only after the cellarer had opened the bids.
- failure: They could not make the books and the tallies agree, and had only the books to price the lease on.
- critical_failure: They priced the lease on the books alone, and said the figure aloud where the merchant could hear it.

Step 1:
- critical_success: The fellowship's bid stood from the first, and the cellarer struck {cast:merchant}'s bid when he could not say where his flour came from.
- success: Under the rule's questions, {cast:merchant} could not say where his flour came from, and the cellarer struck his bid.
- success_at_cost: The cellarer struck {cast:merchant}'s bid, but only after the fellowship had raised its own twice.
- failure: {cast:merchant} outbid the fellowship, and the cellarer let him the mill.
- critical_failure: {actor} accused {cast:merchant} of cheating the abbey and could not prove it. The cellarer let him the mill.

## 13. Aftermath Paragraph (per band)

- **critical_success:** The cellarer wrote the fellowship's name into the abbey's book with the merchant still in the room. {actor}'s fee is paid when the lease is sealed.
- **success:** The abbey has the fellowship down for the mill. {actor}'s fee is paid when the lease is sealed.
- **success_at_cost:** The fellowship will be short of coin all year to pay its rent. {actor}'s fee is paid when the lease is sealed.
- **failure:** The fellowship has no mill this year, and it sent for an expert so that would not happen.
- **critical_failure:** The merchant has the mill, and {location} remembers an expert's mistake longer than a stranger's.

## 14. Aftermath Reaction Choices

No reaction choices — consequence is clean (short scale; the forward thread is the appointment, which the mortal keeps or misses by their own movement).

## 15. Aftermath Kit Summary

| Band | scar | bond | boon | path |
|---|---|---|---|---|
| critical_success | — | reputation with {location} (gain) | knowledge | appointment |
| success | — | reputation with {location} (gain) | knowledge | appointment |
| success_at_cost | — | reputation with {location} (gain) | knowledge | appointment |
| failure | reputation with {location} (loss) | — | — | — |
| critical_failure | reputation with {location} (loss) | — | — | — |

No PRIZE chip on the parent (no reward pool — the hand is knowledge + story_seed; the fee lands in the kept sequel).

Chip text (cause — detail; word count):
- bond (all success bands): title "A lease won" · cause "The fellowship's word on it" · detail "{location} thinks well of their work." (4 + 6 = 10).
- boon (all success bands): title "Where the grain went" · cause "Sold by the old miller" · detail "{actor} knows where the mill's missing grain went." (5 + 8 = 13). `stateNoun` `knowledge`; concept "where the missing grain went".
- path (all success bands): title "The sealing" · cause "Quarter day at the mill" · detail "{cast:cellarer} seals the lease in {location} in three days." (5 + 9 = 14). `stateNoun` `appointment`, `entityId: '$appointment'`.
- scar (failure): title "A lease lost" · cause "The bid did not stand" · detail "{location} thinks less of their work." (5 + 6 = 11).
- scar (critical_failure): title "A bid given away" · cause "Said out of turn" · detail "{location} thinks less of their work." (4 + 6 = 10).

Page read (assembled, scar · bond · boon · path; afterimage held alongside):
- **critical_success:** "The cellarer wrote the fellowship's name into the abbey's book with the merchant still in the room. {actor}'s fee is paid when the lease is sealed." · BOND "The fellowship's word on it — {location} thinks well of their work." · BOON "Sold by the old miller — {actor} knows where the mill's missing grain went." · PATH "Quarter day at the mill — {cast:cellarer} seals the lease in {location} in three days." Each block adds one fact: the name in the book, the fee, the regard and who spreads it, who sold the grain, the place and date. The afterimage carried the struck bid; nothing retells it.
- **success:** "The abbey has the fellowship down for the mill. {actor}'s fee is paid when the lease is sealed." · same chips. Clean.
- **success_at_cost:** "The fellowship will be short of coin all year to pay its rent. {actor}'s fee is paid when the lease is sealed." · same chips. True on both paths: on the step-1 path the fellowship raised its bid twice; on the step-0 path the gap was found only after the bids opened, so the fellowship bid blind and high. The overview states the consequence, never the raise.
- **failure:** "The fellowship has no mill this year, and it sent for an expert so that would not happen." · SCAR "The bid did not stand — {location} thinks less of their work." The afterimage says who won; the overview says what it cost and why an expert's loss costs more; the chip says the regard.
- **critical_failure:** "The merchant has the mill, and {location} remembers an expert's mistake longer than a stranger's." · SCAR "Said out of turn — {location} thinks less of their work." True on both paths: the step-0 figure said where the merchant could hear it, and the step-1 accusation without proof. The overview says plainly why the extreme costs more for someone this good.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `cellarer` | lazy-materialize-on-trigger | reuse monk/priest/steward, else spawn monk "Brother Anselm" | must-persist | appointment counterparty; both sequels (`inheritContext`); PATH chip | ready |
| `merchant` | lazy-materialize-on-trigger | reuse merchant/trader/broker, else spawn merchant "Hugh Draycott" | must-persist | step 1 prose; knowledge record; missed sequel prose ("the merchant") | ready |

## 17. Concept Art Direction

1. *Emotions:* a fair rule meeting a rich man's money, the weight of a price said aloud, the fellowship's living hanging on a number, the quiet of an abbey's counting room.
2. *Evocative image:* a water-mill's wheel stopped in a millrace at first light, a bundle of notched tally sticks tied with cord lying on a sack of flour on the mill floor, an open ledger beside them with a wax seal and a quill. No people.

## 18. Self-Audit

| Item | Verdict |
|---|---|
| Opening ≤80 words | PASS (78) |
| Hand 4–8 composed, ≤2 specials + deal | PASS |
| ≥4 spheres, ≥1 common | PASS (matter, time, order, spirit; deal supplies a common) |
| Every nudge has a failure fragment; no big-delta | PASS (max Δ 0.12) |
| Six StepOutcomes covered per step | PASS — step 0: CS/S/NM/F (Uncover) + SAC/F/CF (Stretch); step 1: S/SAC/F (Read) + CS/NM/F/CF (Swell) |
| Consequence hand wired | PASS — knowledge (`intelligence` `trade_route`), story_seed (the appointment seed) |
| Appointment has missed branch; both sequels authored | PASS (§ 20) |
| Law 56 per chip | PASS — reputation (step 1 ±, step 0 −), intelligence (step 1 success), appointment seed (step 1 success) |
| Prose rule 7b | PASS — the later-tense promises (sealed on quarter day; the fee paid at the sealing) ride the appointment and its kept sequel |

## 19. The narrator's 12 questions

1. P1 arrival with graph names — `{actor}` comes into `{location}`, sent for by the millers' fellowship (one per class).
2. P2 events with costs paid — the mill's lease is up; the cellarer takes bids today; a richer merchant wants it too.
3. P3 one stake — choice: too high and the fellowship cannot pay, too low and the merchant wins.
4. ≤80 words — 78.
5. Read aloud as a report — yes.
6. Stated, never encoded — "disagree on what the mill earns", "cannot pay it", "wins it".
7. Every sentence works — each is the complication, the opposition or the stake.
8. Nothing unintroduced — the cellarer, the books, the tallies and the merchant precede step 0's cards; the rule, the honest-dealing clause and the merchant's high bid precede step 1's cards.
9. One named person per beat — step 0 `{cast:cellarer}`, step 1 `{cast:merchant}` (the cellarer role-voiced there).
10. Stake in a sentence — "Can the fellowship's expert price the abbey's mill and win it from a richer bidder, and keep their name?"
11. Cards verb+noun, spell-style — Uncover Hidden Tallies, Stretch The Morning, Read Out The Rule, Swell The Rival's Pride (uncover, stretch, read, swell in `IMPERATIVE_VERB_LEXICON`).
12. Opening per class — `rural` and `urban`, written.

## 20. Sequels (seed-only) — draft notes

- `town.mill_lease_sealed` (kept, gold 0.35): the fellowship counts out the first quarter's rent before the cellarer; if it counts out to the bid the lease is sealed and the fellowship pays {name}'s fee (`#trade` reward pool), the town's regard +0.04, the cellarer's bond up. Success afterimage: "The rent was all there. {cast:cellarer} sealed the lease, and the fellowship paid {name}'s fee."
- `town.mill_lease_forfeit` (missed, heart 0.45, placeless): the cellarer comes looking; the abbey's rule lets the mill to the next bidder when a lease is not sealed. Success: the cellarer seals it on {name}'s word. Failure: the mill goes to the merchant; bond and regard with the cellarer fall (`$cast:cellarer`, never `$here`).

## Experience Differentiator Gate

1. YES · 2. YES · 3. YES · 4. YES — "The fellowship's expert must price the abbey's mill and win it from a richer bidder, and keep their name." · 4b. YES after fixes (editorial § 1, § 6b) · 5. YES · 6. YES · 7. YES · 8. YES · 9. YES — the evidence / the clock / the rule / the rival · 9b. YES · 10. YES · 11. YES · 11b. YES after fixes (editorial § 6b) · 12. N/A (short) · 13. N/A (short) · 14. YES.
