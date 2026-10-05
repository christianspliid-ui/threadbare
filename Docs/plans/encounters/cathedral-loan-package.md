# Package critic (Pass 3b, THR-1154): The Cathedral Loan

> Slug: cathedral-loan | Pass: package | Date: 2026-10-05 | Batch: master-everyday slot 2 (THR-1688)
> Inputs: `Docs/plans/encounters/cathedral-loan-final.md`, `Docs/plans/encounters/cathedral-loan.package.json`
> Binding brief: `Docs/plans/encounters/master-everyday-brief.md` slot 2
> Machine gate: `node .cache/check-encounter.mjs --package Docs/plans/encounters/cathedral-loan.package.json`, checked 1, clean 1, warnings 0, systems cast / rewards / reputation

templateId: encounter.town.cathedral_loan
packageVerdict: connected
packageLeaves: The mortal walks away with a changed bond with the dean (and, by their choice, with the lenders' factor), a changed standing in the town on money, and on a win a holy item from the cathedral treasury (plus a debt to the factor if they stood surety), all of which show on their sheet and the town's standing row and get read when either person is cast again.

---

## Package vs final doc

The package carries every field-level systems row in the final packet:

- S1: step 0 `failureMetadata.effects` now includes `reputation_with $here -0.05`.
- S2: the critical_failure overview is the route-neutral line.
- S3: the success_at_cost overview reads "a harder rate".
- S4: step 1 `carryoverFactorLines.near_miss` is `against` / -0.03.
- S5: the nudge is `cathedral.slow_the_loading` with no `opposes`.
- S6: the leave_terms intent is the new line.

The new `cathedral.cf.town` scar comes before `cathedral.cf.dean`, and the failure scar's `causeClause` is "Every lender heard". I found no disagreement between the package and the final doc.

## Half A: anchoring

Ten authored chips across five bands. The engine-rendered PRIZE chip from step 1's `rewardPool` (`possession: 1`, `#divine`, 13 items carry the tag) is not authored. It anchors the drawn item itself, so it is not judged here.

| Chip | Referent | In the catalog? | Prose names it? | Backing write | Verdict |
|---|---|---|---|---|---|
| `cathedral.cs.dean` (BOND, gain) | The mortal's bond with the dean | `agent` (individual actor, `$cast:dean`, must-persist) · 🔗 linked | Yes: `{cast:dean} trusts {actor} now.` | step 1 `successMetadata` `bond_change $cast:dean` +0.12/+0.15 | anchored |
| `cathedral.cs.town` (BOON, gain) | The mortal's standing in this settlement | `location` (`$here`, `visualKind: location`) · 🔗 linked; `reputation_with` edge | Yes: `{location} thinks better of…` | step 1 `successMetadata` `reputation_with $here` +0.08 | anchored |
| `cathedral.s.dean` (BOND, gain) | Same as cs.dean | agent · 🔗 | Yes | same | anchored |
| `cathedral.s.town` (BOON, gain) | Same as cs.town | location · 🔗 | Yes | same | anchored |
| `cathedral.sac.dean` (BOND, gain) | Same as cs.dean | agent · 🔗 | Yes | same (sac counts as success in `isStepSuccess`) | anchored |
| `cathedral.sac.town` (BOON, gain) | Same as cs.town | location · 🔗 | Yes | same. On the step-0-failure route the net is -0.05 + 0.08 = +0.03, still a gain | anchored |
| `cathedral.f.town` (SCAR, loss) | The mortal's standing in this settlement | location · 🔗 | Yes: `Every lender heard` + `{location} thinks less of…` | step 1 `failureMetadata` `reputation_with $here` -0.10 (+ step 0 -0.05 if it also failed) | anchored |
| `cathedral.f.dean` (BOND, loss) | The mortal's bond with the dean | agent · 🔗 | Yes: `{cast:dean} trusts {actor} less.` | step 1 `failureMetadata` `bond_change $cast:dean` -0.12/-0.15 | anchored |
| `cathedral.cf.town` (SCAR, loss) | Same as f.town | location · 🔗 | Yes | Step-1 route: step 1 `failureMetadata` -0.10. Step-0 route (the action ends): step 0 `failureMetadata` -0.05 (S1) | anchored |
| `cathedral.cf.dean` (BOND, loss) | Same as f.dean | agent · 🔗 | Yes | Step-1 route: -0.12/-0.15. Step-0 route: step 0 `failureMetadata` -0.05/-0.08 | anchored |

Nothing folds and nothing binds. Both referents always exist wherever the encounter can spawn. The dean and the factor are `supportBundle` actors (`lazy-materialize-on-trigger`, `must-persist`): an existing priest or merchant/broker is reused, or one is spawned. `$here` is the urban settlement the encounter runs in. The scene fiction (the plate, the tithes, the bailiffs, the writ) is never chipped. It lives in the overviews and afterimages, which is where it belongs.

Notes on the declarations (none blocks):

- **Dean noun is `reputation with {target}` on `$cast:dean`, but the backing write is `bond_change`** (a `relates_to` edge carrying sentiment and trust), not a `reputation_with` edge. The rest of the corpus does the same thing: The Mason's Commission inspector chip and cathedral-vault's abbot chip. THR-1685's test `reputationChipNamesPerson.test.tsx` is in this tree and pins that the tag renders the cast person's name, never the settlement's. So the brief's THR-1685 warning ("do not interpolate `{target}` for a person") has been fixed in the renderer and does not bite here.
- Every chip is ≤ 15 words including its cause clause (rule 1b), and no chip repeats its overview (the machine `[page]` check is clean, and I confirmed it by reading).

### Page read (rule 1c): each band assembled

**critical_success**
> {cast:dean} thanked {actor} before the whole chapter, and gave them a gift from the cathedral treasury.
- BOND · REPUTATION WITH *dean*: {cast:dean} trusts {actor} now.
- BOON · REPUTATION WITH *town*: {location} thinks better of {actor}'s word on money.
- (PRIZE: the drawn `#divine` possession)
> **Keep the lenders' goodwill**: Tell the factor the tithes are sound and the lenders were fair. The factor thinks well of the mortal for it.
> **Stand with the chapter**: Tell the dean the lenders pressed too hard. The dean trusts the mortal more, and the factor takes against them.

Reads as one page. The overview names the gift and the PRIZE chip names the item. The two stances are a genuine fork (friend of money or friend of the church), and each moves a different bond. "Stand with the chapter" adds to the trust the bond chip already reports. That is a deepening, not a restatement, because its real price is the factor's bond.

**success**
> The chapter will pay off its loan from the tithes in the years ahead. {cast:dean} sent {actor} away with a piece from the cathedral treasury.
- BOND · dean trusts now · BOON · town thinks better · (PRIZE)
> Same two reactions.

Clean. The overview gives the meaning and the step-1 afterimage gives the moment. No echo.

**success_at_cost**
> The plate is back inside, but the chapter will pay the lenders a harder rate for a generation. {cast:dean} paid {actor} from the treasury, and called the terms a fair price for the plate.
- BOND · dean trusts now · BOON · town thinks better · (PRIZE)
> **Stand surety for the chapter**: Take part of the chapter's debt in the mortal's own name. The mortal owes the factor, and the dean trusts them more for it. (`agreement.debt.minor`, counterparty `$cast:factor`, must-persist)
> **Leave the chapter its terms**: The chapter carries its terms alone. None of its debt falls on the mortal.

Coherent, and the cost in the overview is stated plainly. See advisory A1.

**failure**
> A master is judged by what they save. The chapter sent for {actor} by name to save its plate, and the plate is lost.
- SCAR · REPUTATION WITH *town*: Every lender heard. {location} thinks less of {actor}'s word on money.
- BOND · REPUTATION WITH *dean*: {cast:dean} trusts {actor} less.

The order is scar, then bond. The cause clause pays off step 1's "every lender in town will hear". The page says why a master's failure costs more, which meets the brief's cool-failure row.

**critical_failure**
> The plate is gone to be melted down, and the whole chapter watched it go. {cast:dean} had sent for {actor} to save it.
- SCAR · town thinks less · BOND · dean trusts less

The overview is route-neutral and fits both critical_failure routes. On the step-0 route, step 0's afterimage leaves the plate "loaded onto the carts", and "gone to be melted down" follows from that without contradiction.

## Half B: what it leaves behind

The encounter leaves four kinds of state, and all four sit on surfaces other systems read and the player can see:

1. **Bonds with two persistent named people.** The dean always gets one. The factor gets one through the cs/s reactions, and the sac debt is held against the factor. Both are `must-persist` reused or spawned priests and merchants, and `relates_to` sentiment/trust is read by `relationshipResolver`, `disposition` and the agent detail page. The next encounter that casts either of them meets an ally or someone with a grudge, and the player can click through to the person.
2. **Standing with the settlement** (`reputation_with $here`), shown on the Location Profile standing row. The reputation gate reads it.
3. **A `#divine` possession** on every success-side band, held on the mortal's sheet.
4. **On success_at_cost, an optional `agreement.debt.minor`** to the factor, shown on the Attachments tab.

Every one of these shows on a surface the player already uses, and every chip clicks through to its referent. Verdict: **connected**.

## Advisories (not fold/bind; they do not block)

- **A1. On success_at_cost, the mortal carries a cost only if they choose to.** The brief's payoff table says the master "carries something for it: a condition, a debt, an enemy". Here the harder rate falls on the chapter. If the player picks "Leave the chapter its terms", the band is mechanically the same as success for the mortal (the same chips, the same prize). It is a defensible design, since the stance is the cost choice, but it is a soft reading of the brief row. If the director wants the row met strictly, the smallest change is a small `bond_change $cast:dean` loss on `leave_terms`, so the dean holds the refusal against the mortal. That would also give the second stance a mechanical edge.
- **A2. The prize can flip to a bad outcome** (engine-wide, systems caveat 1). About 5% of step-1 non-critical successes draw from the harm table, while the overview names a treasury gift. The PRIZE chip shows the truth. This is not this package's to fix.
- **A3. The `agreement.debt.minor` template's mechanical effect is a +0.05 `cooperationBias` for 48 ticks**, which reads as a small social plus rather than a burden. That is a catalog-content matter (`src/data/agreement-reward-catalog.ts`), not this package's.
- **A4. On the step-0 critical_failure route, nothing on the page explains why the town heard.** The cf town scar has no cause clause, and the factor's "every lender will hear" line never renders on that route. It is a minor point because the chip is backed and named, but adding `causeClause` "Every lender heard" to `cathedral.cf.town` would match the failure band. It is optional.

PACKAGE PASS
