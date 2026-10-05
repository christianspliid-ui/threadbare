# Encounter Pipeline: The Cathedral Loan
> Scale: short | Slug: cathedral-loan | Pass: draft
> Date: 2026-10-05 | Pipeline version: 3.0 (factory line, master-everyday slot 2, THR-1688)

## 0. Mechanical design block (designed before the prose)

Binding row (brief `master-everyday-brief.md` slot 2): `encounter.town.cathedral_loan` · reach gold ·
steps gold 0.74 → gold 0.80 (mean 0.77, window fit 0.91) · shape Danger – Confrontation – Aftermath ·
settings `urban` · consequence hand `relationship` + `possession` (recomputed: relationship → `bond_change`;
possession → `spawn_artifact` / `attachment_grant` / `reward_draw` / step `rewardPool`) · `rarityTier 2`,
`intrinsicTier 'shaping'`, `scale 'local'`.

Rolled constraints (packet, slot 2): p3Shape **threat** · opposition **law (duty)** · disposition **hostile** ·
agentRole **competitor** · scale **company** · setting rolled `battlefield` → overridden to `urban` (brief: the
cathedral steps where the bailiffs stand) · system target `movement` (advisory; not taken — the appointment in
slot 1 carries the batch's movement).

plotHookRolled: hook.political_labyrinth, hook.death_and_return, hook.rebuilding_trust
plotHookTaken:  hook.political_labyrinth — nothing here can be taken back by force; the plate leaves unless
                the lenders *grant* other terms, and the factor wants something first (a security worth
                more than the silver). death_and_return set aside (no dead in a debt scene);
                rebuilding_trust set aside (would assert a prior failure the graph does not hold).

| Row | Answer |
|---|---|
| Crux | A cathedral has defaulted on its loan, and bailiffs with a lawful writ are taking its altar plate unless {actor} finds the lenders a better security. |
| Title | *The Cathedral Loan* — a loan, a cathedral, and it has gone wrong. |
| Shape | Danger – Confrontation – Aftermath: the bailiffs are already weighing the plate (danger), then the lenders' factor across a table (confrontation). Linear, branch count 0. |
| Whose problem? | The agent's: they were sent for by the chapter, by name, as a master of money. Scene-local (the reason they arrived); no prior tie to any graph agent is asserted (prose rule 7). Role *competitor*: {actor} bids against the plate itself — the chapter's tithes offered as a rival security. |
| Reach = theme? | Step 0 Gold 0.74: price the plate against the debt and put a better security on the table before the carts are loaded. Step 1 Gold 0.80: make the tithes worth more to the lenders than melted silver, across the table from their factor. Both steps are about worth. |
| Why here? | `mission` — the chapter sent for a master of money. |
| Mechanics in play | Carryover (step 1 keyed on step 0's band). Trait variant (Generous). Cast: dean (step 0), factor (step 1). Reward pool. Bonds. Reputation with the town. |
| Opposition | The law doing its duty: the writ is lawful, the bailiffs are only doing their work. Disposition hostile — the lenders want their money. |
| Stake (P3, threat) | "The bailiffs will stop only for a better security than the plate. The dean asks {actor} to find one before the carts are loaded." |
| Consequence hand | **relationship** — `bond_change` with `$cast:dean` (step 1 success up; step 0 and step 1 failure down); reactions move the bond with `$cast:factor` either way. **possession** — step 1 `successMetadata.rewardPool { possession: 1, tagFilters: ['#divine'] }`: the dean gives {actor} a piece from the cathedral treasury; tier by band; engine-rendered PRIZE chip. success_at_cost reaction: `attachment_grant agreement.debt.minor`, counterparty `$cast:factor` (the master stands surety — a debt carried). No swap. |
| Extras | `reputation_with $here` +0.08 (step 1 success) / −0.10 (step 1 failure): the town's lenders hear who saved or lost the plate. |
| Cool failure | Nobody is hurt, jailed or branded. A master's failure costs the name before the purse: the dean's trust and the town's regard for {actor}'s word on money. The overview says plainly why it costs more for someone sent for by name. |
| Trait hooks | Gate: none. Variant: Generous (`trait.personality.gold.virtue`) +0.04, "Being Generous, they would sooner pay than see the plate melted." Trait-only nudge: none. Trait fragment: none. |
| Systems | cast + rewards + reputation (bond_change and reputation_with) — three. |
| Cost channels | Essence only. No Heavy Hand. |
| Specials | Step 0: Hold To Procedure (Favor, order), Dull The Silver (Cache, matter). Step 1: Plant The Fear (Compulsion, mind — the batch's one use, brief permits slot 2), Open The Ledger (Whisper, light). No `card.boost.core` special. |
| Every promise pays off | "before the carts are loaded" → paid in step 0's bands and step 1's carryover; "every lender in town will hear" → paid by `reputation_with $here` on step 1 failure and the failure overview. |

### The narrator's 12 questions, answered
1. P1 arrival? `{actor} arrives in {location} at midday, sent for by the cathedral chapter.` Graph names.
2. P2 events? The chapter defaulted; the lenders went to law and won; the bailiffs are weighing the plate. Costs already paid.
3. P3 one stake? Threat: the bailiffs stop only for a better security, and the carts are being loaded.
4. ≤80 words? Opening + step-0 spine: 74.
5. Read aloud? Every sentence is a report.
6. Stated? The writ, the default and the clock are stated, never encoded.
7. Every sentence works? Challenge, test or outcome.
8. Nothing unintroduced? Chapter, loan, lenders, bailiffs, plate, writ, dean before any card names them; the factor and the tithes introduced in step 1's spine before its cards act on them.
9. One named person? Step 0 {cast:dean}; step 1 {cast:factor}.
10. Stake in a sentence? "Find the lenders a better security than the altar plate before the bailiffs' carts are loaded."
11. Cards verb+noun? Yes; no name word repeated in its effect line; no digits.
12. Opening per class? `urban`, the only class, written.

## 1. Inspiration Anchors

- **Ordeal — The Political Labyrinth** (the rolled hook): everything here must be *granted*. The writ cannot be
  fought; the factor must be brought to accept other terms. It gave the encounter its two-step spine: first stop
  the lawful thing happening, then win the grant.
- Anti-patterns avoided: the agent as bystander (the master is the one bidding against the plate); a villain
  where the opposition is the law doing its duty (the bailiffs are not cruel, only lawful); failure as
  punishment (a lost plate costs the master's name, which a master trades on).
- Not colliding with the gold experts: `debt_arbitration` is a creditor *calling a ruling* and
  `mill_lease_auction` is *a bid against a rival*. This one is *defending a debtor from a lawful seizure* by
  substituting the security.

## 2. Scale Justification

Short: two beats, the master band's 0.74 → 0.80. A master is sent for to settle one sharp problem in an
afternoon, and the danger → confrontation shape is the whole of it. Rarity 2 and a treasury prize make it a
weighty everyday scene, not an epic.

## 3. Pressure Knot

The chapter borrowed to build its nave and cannot repay. The lenders sued and won a writ. The bailiffs are
already on the cathedral steps weighing the altar plate onto carts, and by nightfall it goes to the melting pot.

## 4. Intervention Fantasy

The god watches a master of money do the thing masters do — make a lawful machine stop and listen — and leans
on the minds and matter around the table: a writ read to its letter, silver that weighs light, a factor who
starts to doubt what melted plate will fetch, a ledger whose hidden charges come to light.

## 5. Cast and World Objects

| Object | What it is | Binding |
|---|---|---|
| {cast:dean} | The cathedral's dean; sent for {actor}; step 0's named person | `supportBundle` actor `dean` — reuse `priest`, spawn `priest`, "Anselm Hale", must-persist |
| {cast:factor} | The lenders' factor; across the table in step 1 | `supportBundle` actor `factor` — reuse `merchant`, `broker`, spawn `merchant`, "Odile Marrow", must-persist |
| The bailiffs | Scene-only, unnamed | — |
| The altar plate | Scene fiction (never chipped) | — |
| The tithes | The chapter's income offered as security; scene fiction | — |
| Treasury gift | step 1 `rewardPool { possession: 1, #divine }` | engine PRIZE chip |
| The town | `reputation_with $here` | chip `reputation with {location}` |
| A debt to the factor | `agreement.debt.minor` (success_at_cost reaction) | reaction only |

## 6. Beat Structure

1. **Danger — the weighing (Gold 0.74, "Offer a better security", `continue_weakened`).** The bailiffs are
   loading the plate. {actor} must put the tithes on the table as a better security so the bailiffs stop and
   send for the factor.
2. **Confrontation — the factor (Gold 0.80, "Win the factor's terms", `fail_action`).** {cast:factor} wants the
   full debt and the plate is the surest way to it. {actor} must make the tithes worth more to the lenders than
   the silver. Carryover keyed on step 0.
3. **Aftermath** — banded, `fallback.byOutcome`, five bands.

## 7. Branching Profile

Linear — no branching. Branch count 0.

## 8. Branching Map

N/A — linear encounter.

## 9. Outcome Ladder

| Band | Progress | Spent | Burden / opening |
|---|---|---|---|
| critical_success | Plate back on the altar; tithes stand as security; treasury gift (best tier) | — | dean's trust, town's regard; reaction: friend of the lenders or champion of the chapter |
| success | Plate back inside; treasury gift | — | dean's trust, town's regard; same reaction |
| success_at_cost | Plate back, but the chapter pays a harder rate for a generation; treasury gift | the chapter's terms | reaction: stand surety (a debt to the factor) or leave the chapter its terms |
| failure | Plate goes to be melted | the master's name in town | dean's trust lost; town's regard lost |
| critical_failure | Plate gone before the factor was even won | the dean's trust | dean's trust lost |

## 10. Sample Opening (urban)

> {actor} arrives in {location} at midday, sent for by the cathedral chapter.
>
> The chapter has defaulted on the loan that built the cathedral's nave. The lenders went to law and won. Their
> bailiffs are on the cathedral steps, weighing the altar plate for their carts.
>
> The writ is lawful. The bailiffs will stop only for a better security than the plate. {cast:dean}, the dean,
> asks {actor} to find one before the carts are loaded.

## 11. The Hand Per Step

### Step 0 — "Offer a better security" (gold 0.74)

`deal: { count: 4, tags: ['social', 'peril'] }` — composed hand 6.

**Hold To Procedure** — *Favor (order signature)* · order · 2 essence · Δ 0.10 · `generic.oath` · opposes `bailiffs`
- effectLine: "Press the letter of their own writ on the bailiffs. They stop and hear any lawful offer before loading more."
- critical_success: "The bailiffs stopped mid-count and read the writ again, and it said what {actor} said it did."
- success: "The bailiffs stopped to hear the offer, because their writ told them to."
- near_miss: "The bailiffs stopped to hear the offer, and went on loading while they heard it."
- failure: "The bailiffs read their writ again, and read it as leave to keep loading."

**Dull The Silver** — *Cache (matter signature)* · matter · 1 essence · Δ 0.08 · `generic.matter`
- effectLine: "Tarnish the plate as it is weighed. It reads lighter and cheaper on the scales than it is."
- success: "The plate weighed light on the bailiffs' scales, and their clerk stopped writing."
- success_at_cost: "The plate weighed light, and {cast:dean} saw the tarnish on it."
- failure: "The plate weighed light, and the bailiffs loaded more of it to make up the sum."
- critical_failure: "The plate weighed light, so the bailiffs took every last piece to make up the sum."

### Step 1 — "Win the factor's terms" (gold 0.80)

`deal: { count: 4, tags: ['social', 'presence'] }` — composed hand 6.

**Plant The Fear** — *Compulsion (mind signature)* · mind · 2 essence · Δ 0.12 · `generic.rumor` · opposes `factor`
- effectLine: "Set a cold worry in the factor's mind that melted silver sells for less than the loan is owed. They lean toward other security."
- critical_success: "The factor worked out the melting-pot price aloud, and did not like the figure."
- success: "The factor began to doubt what the silver would fetch, and listened to the offer of tithes."
- near_miss: "The factor doubted the silver, but not enough to let the plate go cheaply."
- failure: "The factor worried about the silver's price, and asked for more of the plate to cover it."

**Open The Ledger** — *Whisper (light signature)* · light · 1 essence · Δ 0.08 · `generic.light`
- effectLine: "Bring every hidden charge in the lenders' accounts into plain view. Nobody at the table can hide a figure."
- critical_success: "A charge the lenders had added twice came to light, and the factor struck it out."
- success_at_cost: "Every charge came to light, including one the chapter had hidden from {actor}."
- failure: "Every charge came to light, and every one of them was lawful."
- critical_failure: "Every charge came to light, and the largest was the chapter's own unpaid interest."

## 12. Linear continuation (step 1 spine)

> {cast:factor}, the lenders' factor, comes to the chapter house and sits across the table from {actor}. The
> factor wants the whole debt, and the plate is the surest way to get it. {actor} has to make the chapter's
> tithes worth more to the lenders than the silver. If the factor says no, the plate goes to the melting pot,
> and every lender in town will hear who failed to stop it.

Carryover (keyed on step 0):
- critical_success · for +0.06 · "The bailiffs have already stopped for their offer."
- success · for +0.04 · "The plate is still inside the cathedral."
- success_at_cost · against −0.02 · "Part of the plate is already on the carts."
- near_miss · for +0.02 · "The bailiffs listened, but kept loading."
- failure · against −0.04 · "The plate is already on the lenders' carts."

### Afterimages

Step 0:
- critical_success: "They showed the bailiffs that the chapter's tithes are worth more than the plate, and the weighing stopped."
- success: "They offered the chapter's tithes in place of the plate, and the bailiffs sent for the lenders' factor."
- success_at_cost: "The bailiffs stopped, but kept on the carts the plate they had already weighed."
- failure: "The bailiffs kept weighing, and the plate went onto the carts to wait for the factor's word."
- critical_failure: "The bailiffs would not hear the offer, and the loaded carts left before the factor ever came."

Step 1:
- critical_success: "The factor took the tithes for the whole debt and gave back every piece of plate."
- success: "The factor took the tithes in place of the plate, and the plate went back inside."
- success_at_cost: "The factor took the tithes, but at a harder rate the chapter will pay for a generation."
- failure: "The factor refused the tithes, and the bailiffs drove the plate away to be melted."
- critical_failure: "The factor refused, and told the whole chapter that {actor} had offered the lenders nothing they could use."

## 13. Aftermath Paragraph (fallback, success)

> The plate is back inside the cathedral, and the tithes now stand as the lenders' security. {cast:dean} sent
> {actor} away with a piece from the cathedral treasury.

## 14. Aftermath Reaction Choices

- **critical_success / success** — *Keep the lenders' goodwill* ("Tell the factor the tithes are sound and the lenders were fair. The factor thinks well of the mortal for it." → `bond_change $cast:factor +0.10`) vs *Stand with the chapter* ("Tell the dean the lenders pressed too hard. The dean trusts the mortal more, and the factor less." → `bond_change $cast:dean +0.06`, `bond_change $cast:factor −0.10`). Stances: the master as a friend of money, or a friend of the church.
- **success_at_cost** — *Stand surety for the chapter* ("Put the mortal's own name to the chapter's bond. The mortal owes the factor a debt, and the dean will not forget it." → `attachment_grant agreement.debt.minor` counterparty `$cast:factor`; `bond_change $cast:dean +0.06`) vs *Leave the chapter its terms* ("The chapter pays its own harder rate. The mortal walks away owing nothing." → no effect). Stances: carry the cost yourself, or let the debtor carry its own.
- failure / critical_failure — no reaction choices; the consequence is clean.

## 15. Aftermath Kit Summary

| Band | Overview | Chips (scar · bond · boon) |
|---|---|---|
| critical_success | "The altar plate is back on the altar, and the chapter will pay the loan from its tithes. {cast:dean} gave {actor} a gift from the cathedral treasury in front of the whole chapter." | BOND · reputation with {target} (dean, gain) · BOON · reputation with {location} (gain) · PRIZE (engine) |
| success | "The plate is back inside the cathedral, and the tithes now stand as the lenders' security. {cast:dean} sent {actor} away with a piece from the cathedral treasury." | same |
| success_at_cost | "The plate is back inside, but the chapter will pay the lenders a harder rate for a generation. {cast:dean} paid {actor} from the treasury all the same." | same |
| failure | "The factor would not take the tithes, and the altar plate went to the lenders to be melted down. A master sent for by name is judged by what they save, and every lender in {location} now knows {actor} saved nothing." | SCAR · reputation with {location} (loss) · BOND · reputation with {target} (dean, loss) |
| critical_failure | "The plate is gone to the lenders' melting pot. {cast:dean} told the chapter that the master they sent for had made it worse." | BOND · reputation with {target} (dean, loss) |

Chip captions: dean gain "{cast:dean} trusts {actor} now." · town gain "{location} thinks better of {actor}'s word on money." · town loss "{location} thinks less of {actor}'s word on money." · dean loss "{cast:dean} trusts {actor} less."

Backing (Law 56): dean gain ← step 1 `successMetadata.bond_change`; town gain ← step 1 `successMetadata.reputation_with`; town loss ← step 1 `failureMetadata.reputation_with`; dean loss ← step 0 `failureMetadata.bond_change` (critical_failure via step 0) and step 1 `failureMetadata.bond_change` (failure / critical_failure via step 1).

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| dean | lazy-materialize-on-trigger | reuse `priest` (town 0.7, city 1.0), else spawn | must-persist | bond_change target; reaction target | ok |
| factor | lazy-materialize-on-trigger | reuse `merchant` / `broker`, else spawn | must-persist | bond_change target; agreement counterparty | ok |
| treasury gift | step reward pool | attachment library, `#divine` possessions | persistent item | PRIZE chip | ok |

## 17. Self-Audit

| Item | Verdict |
|---|---|
| Envelope + opening per class | PASS (urban) |
| Purpose lines ≤4 words | PASS |
| No static factor lines; carryover only | PASS |
| Hands 4–8 composed, ≤2 specials, deal declared | PASS (2 + 4) |
| Every special has a failure fragment | PASS |
| Six bands covered per step | PASS (step 0: cs, s, sac, nm, f, cf · step 1: cs, s, sac, nm, f, cf) |
| No big-delta card (all < 0.15) | PASS |
| Trait hooks four questions | PASS |
| Consequence hand wired | PASS (bond_change; rewardPool) |
| Chips backed and anchored | PASS (see §15) |
| No numerals / no second person | PASS |
| Prose rule 7 / 7b | PASS — no prior tie asserted; no later place or time promised |
| Systems ≥3 | PASS (cast, rewards, reputation) |

### Experience Differentiator Gate
1 YES · 2 YES · 3 YES · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (stop the count / lighten the plate / doubt the silver / expose the charges) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES (success-side bands) · 13 YES · 14 YES.

## Concept Art Direction

Emotions: lawful loss, the quiet weight of a debt on a holy place, a bargain still being weighed. Image: an
empty altar cloth with the clean outlines where candlesticks and a chalice stood, a bailiff's brass scale on
the step below, one tarnished paten left on the scale pan. No people.
