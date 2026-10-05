# Encounter Pipeline: The Cathedral Loan
> Scale: short | Slug: cathedral-loan | Pass: final
> Date: 2026-10-05 | Pipeline version: 2.0 (factory line v3, master-everyday slot 2, THR-1688)
> Status: **READY WITH CAVEATS**

---

## Pipeline Summary

| Pass | Verdict | Notes |
|------|---------|-------|
| Draft | Complete | A two-step Gold master scene. Bailiffs with a lawful writ weigh a cathedral's altar plate, and the master offers the chapter's tithes as a better security, then wins the lenders' factor. Relationship (dean / factor bonds) + possession (`#divine` treasury prize, a debt by reaction). |
| Editorial | PASS WITH REVISIONS | Tithes and writ grounded in the opening. Five seam echoes and three vague/two-reading lines fixed. Hold To Procedure re-skinned to Slow The Loading (gold-expert collision). Type labels corrected. critical_failure gained the town SCAR its step-1 write fires. |
| Systems | READY WITH CAVEATS | A step-0 critical_failure ends the action (`advanceStep`), so the critical_failure page had an unbacked town SCAR and a line about a factor that route never meets. Both fixed: a step-0 town write and a route-neutral overview. Near_miss carryover polarity fixed. Dead `opposes` removed. One gate page warning fixed. |

### Systems fixes applied (old → new). The package must mirror every field-level row.

| # | Where | Old | New |
|---|---|---|---|
| S1 | step 0 `failureMetadata.effects` (**field**) | `[bond_change $cast:dean −0.05/−0.08]` | append `{ kind: 'reputation_with', targetLocationId: '$here', delta: -0.05 }` |
| S2 | `fallback.byOutcome.critical_failure.overview` | "The plate is gone to the melting pot. The factor told the whole chapter that {actor}'s offer was worthless to the lenders, and said it in front of {cast:dean}." | "The plate is gone to be melted down, and the whole chapter watched it go. {cast:dean} had sent for {actor} to save it." |
| S3 | `fallback.byOutcome.success_at_cost.overview` | "…will pay the lenders that harder rate for a generation…" | "…will pay the lenders a harder rate for a generation…" |
| S4 | step 1 `carryoverFactorLines.near_miss` (**field**) | `polarity: 'for', forecastDelta: 0.02` | `polarity: 'against', forecastDelta: -0.03` (text unchanged) |
| S5 | step 0 nudge Slow The Loading (**field**) | `id: 'cathedral.hold_to_procedure'`, `opposes: 'bailiffs'` | `id: 'cathedral.slow_the_loading'`, no `opposes` (imageTag `generic.oath` kept) |
| S6 | `success_at_cost` reaction `cathedral.sac.leave_terms` intent | "The chapter carries its terms alone. The mortal owes the factor no debt." | "The chapter carries its terms alone. None of its debt falls on the mortal." |
| S7 | Dull The Silver type label (code comment) | Stumble (matter) | Signature (matter) |
| P1 | `success_at_cost` reaction `cathedral.sac.leave_terms` (**field**, package pass advisory A1) | intent "…None of its debt falls on the mortal.", `effects: []` | intent "The chapter carries its terms alone. None of its debt falls on the mortal, and the dean is cooler toward them.", `effects: [bond_change $cast:dean −0.04 / −0.04]` |
| S8 | § 0 / § 9 / § 15 design text | critical_success "(best tier)"; critical_failure row and Law 56 note | tier keys on step 1's outcome; route-neutral critical_failure row; per-route backing |

The package must also carry every editorial revision in this packet: the opening P2/P3, step-0 afterimages (s, sac,
f, cf), step-1 afterimages (sac, cf), carryover cs text, the Slow The Loading face, Dull The Silver s/sac fragments,
the Plant The Fear failure fragment, the fallback overview, the cs/s/sac/failure overviews, the reaction intents, the
failure SCAR `causeClause` "Every lender heard", and the new `cathedral.cf.town` SCAR ordered before
`cathedral.cf.dean`. A scratch copy carrying all of the above is green on `node .cache/check-encounter.mjs --package`
(clean 1, warnings 0, systems cast / rewards / reputation).

### Caveats / Blockers

1. **Bad-outcome flip on the prize** (engine-wide). 5% of step-1 non-crit successes draw from the harm table, while
   the overview says the dean gave a treasury gift. The PRIZE chip shows what was actually drawn.
2. **Route A is the lightest critical_failure.** A step-0 critical_failure writes dean −0.05 / −0.08 and town −0.05,
   lighter than a plain step-1 failure. No band-scoped step effect exists to deepen it without also hitting the
   step-0-failure → success_at_cost route.
3. **Live proof.** Pin critical_failure twice (once from step 0, once from step 1) and success_at_cost via a step-1
   near_miss. At master difficulty, read success-side rows on failed natural runs as *not exercised*.

### Editorial Notes Summary

The editorial pass found the design sound and fixed the words. The tithes and the writ are now named in the opening,
so the offer is grounded before the dice. Five seam echoes are gone: each step-1 afterimage tells the moment and each
band overview its meaning. `nothing` ×2 and `the matter` were removed. The step-0 critical_failure afterimage no longer
contradicts the spine. Hold To Procedure, the order card both shipped gold experts already play, became Slow The
Loading. Four type labels were corrected. The failure SCAR carries "Every lender heard" as its cause. critical_failure
gained the town SCAR. Systems found that SCAR backed on only one of its two routes and completed it (S1).

### Implementation File Map

- `Docs/plans/encounters/cathedral-loan.package.json`: mirror this packet (the rows above). `compile:encounter`
  then owns the module, its structural test and both registrations.
- At closeout, stamp `hook.political_labyrinth` `usedBy` in `src/data/content-eval/plotHooks.ts` (the brief's
  standing duty).
- No engine, type, art or catalog file.

---

## Encounter Packet

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
| Stake (P3, threat) | "The bailiffs will stop only for a better security than the plate. The dean asks {actor} to offer them the chapter's tithes before the carts are loaded." |
| Consequence hand | **relationship** — `bond_change` with `$cast:dean` (step 1 success up; step 0 and step 1 failure down); reactions move the bond with `$cast:factor` either way. **possession** — step 1 `successMetadata.rewardPool { possession: 1, tagFilters: ['#divine'] }`: the dean gives {actor} a piece from the cathedral treasury; tier keyed on step 1's own outcome (crit curve on a step-1 critical_success, else the success curve) [systems S8]; engine-rendered PRIZE chip. success_at_cost reaction: `attachment_grant agreement.debt.minor`, counterparty `$cast:factor` (the master stands surety — a debt carried). No swap. |
| Extras | `reputation_with $here` +0.08 (step 1 success) / −0.10 (step 1 failure and critical_failure) / −0.05 (step 0 failure and critical_failure — systems S1: backs the critical_failure town SCAR on the step-0 route, where step 1 never runs): the town's lenders hear who saved or lost the plate. |
| Cool failure | Nobody is hurt, jailed or branded. A master's failure costs the name before the purse: the dean's trust and the town's regard for {actor}'s word on money. The failure overview says plainly why it costs more for someone sent for by name. |
| Trait hooks | Gate: none. Variant: Generous (`trait.personality.gold.virtue`) +0.04, "Being Generous, they would sooner pay than see the plate melted." Trait-only nudge: none. Trait fragment: none. |
| Systems | cast + rewards + reputation (bond_change and reputation_with) — three. |
| Cost channels | Essence only. No Heavy Hand. |
| Specials | Step 0: Slow The Loading (Signature, order), Dull The Silver (Signature, matter — systems S7). Step 1: Plant The Fear (Signature, mind), Open The Ledger (Signature, light). No `card.boost.core` special; the batch's one Compulsion is not spent here. |
| Every promise pays off | "before the carts are loaded" → paid in step 0's bands and step 1's carryover; "every lender in town will hear" → paid by `reputation_with $here` on step 1 failure / critical_failure and the failure SCAR's cause clause ("Every lender heard"). |

### The narrator's 12 questions, answered
1. P1 arrival? `{actor} arrives in {location} at midday, sent for by the cathedral chapter.` Graph names.
2. P2 events? The chapter defaulted; the lenders went to law and won a writ; the bailiffs are weighing the plate. Costs already paid.
3. P3 one stake? Threat: the bailiffs stop only for a better security, and the carts are being loaded.
4. ≤80 words? Opening + step-0 spine: 79.
5. Read aloud? Every sentence is a report.
6. Stated? The writ, the default and the clock are stated, never encoded.
7. Every sentence works? Challenge, test or outcome.
8. Nothing unintroduced? Chapter, loan, lenders, writ, bailiffs, plate, tithes, dean before any card or afterimage names them; the factor introduced in step 1's spine before its cards act on them.
9. One named person? Step 0 {cast:dean}; step 1 {cast:factor}.
10. Stake in a sentence? "Get the lenders to take the chapter's tithes instead of the altar plate before the bailiffs' carts are loaded."
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
  substituting the security. Both experts already play an order card that holds officials to their own rules
  (*Invoke The Rule*, *Read Out The Rule*); this encounter's order card buys time instead (*Slow The Loading*).

## 2. Scale Justification

Short: two beats, the master band's 0.74 → 0.80. A master is sent for to settle one sharp problem in an
afternoon, and the danger → confrontation shape is the whole of it. Rarity 2 and a treasury prize make it a
weighty everyday scene, not an epic.

## 3. Pressure Knot

The chapter borrowed to build its nave and cannot repay. The lenders sued and won a writ. The bailiffs are
already on the cathedral steps weighing the altar plate onto carts, and by nightfall it goes to the melting pot.

## 4. Intervention Fantasy

The god watches a master of money do the thing masters do — make a lawful machine stop and listen — and leans
on the minds and matter around the table: bailiffs buried in their own paperwork, silver that weighs light, a
factor who starts to doubt what melted plate will fetch, a ledger whose hidden charges come to light.

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
   send word to the lenders.
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
| critical_success | Plate back on the altar; tithes cover the whole debt; dean's thanks before the chapter; treasury gift (crit tier curve when step 1 itself crit) | — | dean's trust, town's regard; reaction: friend of the lenders or champion of the chapter |
| success | Plate back inside; the chapter pays from its tithes for years; treasury gift | — | dean's trust, town's regard; same reaction |
| success_at_cost | Plate back, but the chapter pays a harder rate for a generation; treasury gift | the chapter's terms | reaction: stand surety (a debt to the factor) or leave the chapter its terms |
| failure | Plate goes to be melted | the master's name in town | dean's trust lost; town's regard lost |
| critical_failure | Plate melted, lost before the whole chapter (reached from a step-0 critical_failure, which ends the action before the factor comes, or from a step-1 critical_failure) | the master's name in town and with the dean | dean's trust lost; town's regard lost |

## 10. Sample Opening (urban)

> {actor} arrives in {location} at midday, sent for by the cathedral chapter.
>
> The chapter has defaulted on the loan that built the cathedral's nave. The lenders went to law and won a writ.
> Their bailiffs are on the cathedral steps, weighing the altar plate for their carts.
>
> The writ is lawful. The bailiffs will stop only for a better security than the plate. {cast:dean}, the dean,
> asks {actor} to offer them the chapter's tithes before the carts are loaded.

(`openings.urban` = the P1 line; step 0 `narrativeTemplate` = P2 + P3. Total 79 words.)

## 11. The Hand Per Step

### Step 0 — "Offer a better security" (gold 0.74)

`deal: { count: 4, tags: ['social', 'peril'] }` — composed hand 6.

**Slow The Loading** — *Signature (order)* · order · 2 essence · Δ 0.10 · `generic.oath` · no `opposes` (systems S5: `bailiffs` is not a cast key)
(replaces Hold To Procedure; package id → `cathedral.slow_the_loading`, systems S5)
- effectLine: "Make the bailiffs write down every piece before it moves. The carts wait until the list is signed."
- critical_success: "The bailiffs were still writing their list when {actor} made the offer, and not one piece had moved."
- success: "The bailiffs stopped loading to write the list, and heard the offer while they wrote."
- near_miss: "The bailiffs wrote the list quickly, and went on loading while they heard the offer."
- failure: "The bailiffs loaded first and wrote their list on the carts."

**Dull The Silver** — *Signature (matter)* (systems S7: no cast member to oppose) · matter · 1 essence · Δ 0.08 · `generic.matter`
- effectLine: "Tarnish the plate as it is weighed. It reads lighter and cheaper on the scales than it is."
- success: "The plate weighed light on the bailiffs' scales, and the tithes looked the better security beside it."
- success_at_cost: "The plate weighed light, but the tarnish stayed on it after the weighing."
- failure: "The plate weighed light, and the bailiffs loaded more of it to make up the sum."
- critical_failure: "The plate weighed light, so the bailiffs took every last piece to make up the sum."

### Step 1 — "Win the factor's terms" (gold 0.80)

`deal: { count: 4, tags: ['social', 'presence'] }` — composed hand 6.

**Plant The Fear** — *Signature (mind)* · mind · 2 essence · Δ 0.12 · `generic.rumor` · opposes `factor`
- effectLine: "Set a cold worry in the factor's mind that melted silver sells for less than the loan is owed. They lean toward other security."
- critical_success: "The factor worked out the melting-pot price aloud, and did not like the figure."
- success: "The factor began to doubt what the silver would fetch, and listened to the offer of tithes."
- near_miss: "The factor doubted the silver, but not enough to let the plate go cheaply."
- failure: "The factor worried about the silver's price, and asked for the tithes as well as the plate."

**Open The Ledger** — *Signature (light)* · light · 1 essence · Δ 0.08 · `generic.light`
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
- critical_success · for +0.06 · "The bailiffs have already stopped for the chapter's offer."
- success · for +0.04 · "The plate is still inside the cathedral."
- success_at_cost · against −0.02 · "Part of the plate is already on the carts."
- near_miss · against −0.03 · "The bailiffs listened, but kept loading." (systems S4: was for +0.02; near_miss ranks below success_at_cost)
- failure · against −0.04 · "The plate is already on the lenders' carts."
- (no critical_failure line: a step-0 critical_failure ends the action, so step 1 never renders after it — systems)

### Afterimages

Step 0:
- critical_success: "They showed the bailiffs that the chapter's tithes are worth more than the plate, and the weighing stopped."
- success: "They offered the chapter's tithes in place of the plate, and the bailiffs sent word to the lenders."
- success_at_cost: "The bailiffs stopped, but the plate they had already weighed stayed on the carts."
- failure: "The bailiffs kept weighing, and the plate went onto the carts to wait for the lenders' word."
- critical_failure: "The bailiffs would not hear the offer, and loaded every piece of plate onto the carts."

Step 1:
- critical_success: "The factor took the tithes for the whole debt and gave back every piece of plate."
- success: "The factor took the tithes in place of the plate, and the plate went back inside."
- success_at_cost: "The factor took the tithes only when {actor} agreed to a harder rate."
- failure: "The factor refused the tithes, and the bailiffs drove the plate away to be melted."
- critical_failure: "The factor refused, and called for the bailiffs before {actor} had finished speaking."

### Narrative templates (board / chronicle lines)

- initiation: "Bailiffs are taking a cathedral's altar plate for an unpaid loan. {actor} has been sent for to stop them lawfully."
- success: "{actor} kept the cathedral's altar plate out of the lenders' hands."
- failure: "The lenders took the cathedral's altar plate, and {actor} could not stop them."

## 13. Aftermath Paragraph (fallback, success)

Fallback overview (no band matched): "{actor} left the chapter house once the factor had given an answer."

> The chapter will pay off its loan from the tithes in the years ahead. {cast:dean} sent {actor} away with a
> piece from the cathedral treasury.

## 14. Aftermath Reaction Choices

- **critical_success / success** — *Keep the lenders' goodwill* ("Tell the factor the tithes are sound and the lenders were fair. The factor thinks well of the mortal for it." → `bond_change $cast:factor +0.10`) vs *Stand with the chapter* ("Tell the dean the lenders pressed too hard. The dean trusts the mortal more, and the factor takes against them." → `bond_change $cast:dean +0.06`, `bond_change $cast:factor −0.10`). Stances: the master as a friend of money, or a friend of the church.
- **success_at_cost** — *Stand surety for the chapter* ("Take part of the chapter's debt in the mortal's own name. The mortal owes the factor, and the dean trusts them more for it." → `attachment_grant agreement.debt.minor` counterparty `$cast:factor`; `bond_change $cast:dean +0.06`) vs *Leave the chapter its terms* ("The chapter carries its terms alone. None of its debt falls on the mortal, and the dean is cooler toward them." → `bond_change $cast:dean −0.04/−0.04`; systems S6, then package advisory A1: the band now costs the master something on either reaction). Stances: carry the cost yourself, or let the debtor carry its own.
- failure / critical_failure — no reaction choices; the consequence is clean.

## 15. Aftermath Kit Summary

| Band | Overview | Chips (scar · bond · boon) |
|---|---|---|
| critical_success | "{cast:dean} thanked {actor} before the whole chapter, and gave them a gift from the cathedral treasury." | BOND · reputation with {target} (dean, gain) · BOON · reputation with {location} (gain) · PRIZE (engine) |
| success | "The chapter will pay off its loan from the tithes in the years ahead. {cast:dean} sent {actor} away with a piece from the cathedral treasury." | same |
| success_at_cost | "The plate is back inside, but the chapter will pay the lenders a harder rate for a generation. {cast:dean} paid {actor} from the treasury, and called the terms a fair price for the plate." | same |
| failure | "A master is judged by what they save. The chapter sent for {actor} by name to save its plate, and the plate is lost." | SCAR · reputation with {location} (loss, causeClause "Every lender heard") · BOND · reputation with {target} (dean, loss) |
| critical_failure | "The plate is gone to be melted down, and the whole chapter watched it go. {cast:dean} had sent for {actor} to save it." (systems S2) | SCAR · reputation with {location} (loss — **new chip** `cathedral.cf.town`) · BOND · reputation with {target} (dean, loss) |

Chip captions: dean gain "{cast:dean} trusts {actor} now." · town gain "{location} thinks better of {actor}'s word on money." · town loss (failure) causeClause "Every lender heard" + detail "{location} thinks less of {actor}'s word on money." · town loss (critical_failure) "{location} thinks less of {actor}'s word on money." · dean loss "{cast:dean} trusts {actor} less."

New critical_failure chip, mirroring `cathedral.f.town`: id `cathedral.cf.town`, kind `reputation`, category `scar`, direction / polarity `loss`, title "The Town's Regard", detail "{location} thinks less of {actor}'s word on money.", stateNoun `reputation with {location}` on `$here` (`visualKind location`, `tooltipId ui.reputation_with`), concepts `thinks less of` → `ui.standing`. Ordered before `cathedral.cf.dean`.

Backing (Law 56, per route — systems § 0): dean gain ← step 1 `successMetadata.bond_change` (fires on near_miss too; a step-1 near_miss lands on success_at_cost); town gain ← step 1 `successMetadata.reputation_with` (on the step-0-failure → success_at_cost route the net is −0.05 + 0.08 = +0.03, still a gain); town loss on failure ← step 1 `failureMetadata.reputation_with`; town loss on critical_failure ← step 1 `failureMetadata.reputation_with` (step-1 route) **or** step 0 `failureMetadata.reputation_with` −0.05 (step-0 route, systems S1); dean loss ← step 1 `failureMetadata.bond_change`, or step 0 `failureMetadata.bond_change` alone on the step-0 critical_failure route.

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
| Vagueness (outcome class) | PASS after editorial (`nothing` ×2, `the matter` ×1 removed) |
| Prose rule 7 / 7b | PASS — no prior tie asserted; no later place or time promised |
| Systems ≥3 | PASS (cast, rewards, reputation) |
| Non-collision with gold experts | PASS after editorial (order card re-skinned off *Invoke / Read Out The Rule*) |

### Experience Differentiator Gate
1 YES · 2 YES · 3 YES · 4 YES · 4b YES · 5 YES · 6 YES · 7 YES · 8 YES · 9 YES (keep the plate off the carts / make the plate the worse security / doubt the silver / expose the charges) · 9b YES · 10 YES · 11 YES · 11b YES · 12 YES (success-side bands) · 13 YES · 14 YES. (Editorial answers with evidence: `cathedral-loan-editorial.md` § 8.)

## Concept Art Direction

Emotions: lawful loss, the quiet weight of a debt on a holy place, a bargain still being weighed. Image: an
empty altar cloth with the clean outlines where candlesticks and a chalice stood, a bailiff's brass scale on
the step below, one tarnished paten left on the scale pan. No people.
