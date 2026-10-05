# Package critic (Pass 3b): The Judicial Duel

> Slug: judicial-duel · Batch: master-everyday, slot 4 (THR-1688) · Date: 2026-10-05
> Inputs: `judicial-duel-final.md` (READY WITH CAVEATS), `judicial-duel.package.json`, `master-everyday-brief.md` slot 4, `anchor-catalog.generated.md`, nudge-authoring-spec § Consequences rules 0 and 0b.
> `node .cache/check-encounter.mjs --package Docs/plans/encounters/judicial-duel.package.json` re-run read-only: **clean** (1 checked, 0 failing, 0 warnings; systems cast, rewards, conditions, reputation).

templateId: encounter.town.judicial_duel
packageVerdict: connected
packageLeaves: A won bout leaves Wenna Coldridge owing the mortal a favour, the god's thread to the mortal stronger and the town's regard higher (with an optional Festival on the town); a lost one leaves the town Under Watch for a week, where quiet Shadow work is harder, plus a thinner thread and lower regard, and all of it shows on the mortal's sheet, Wenna's sheet and the town's card.

## Binding design check (brief slot 4)

| Brief requirement | Package | Verdict |
|---|---|---|
| Iron, `urban`, under `encounter.town.*` | `reach: iron`, `settings: ['urban']`, id `encounter.town.judicial_duel` | ✓ |
| Eye watch then Iron bout, nudge-resolved, not the fight system | eye 0.72 → iron 0.80 → iron 0.84; no monster card, fight gate or confront gate | ✓ |
| Hand `thread`: a thread the duel ties to the master | `thread_strengthen` / `thread_weaken` (`$ascendant` ↔ `$actor`) on step 2 success / failure | ✓ |
| Hand `place`: what the verdict leaves true, as a `$here` location condition | `apply_condition trait.condition.location.under_watch` on `$here` (step 2 failure); reaction `trait.condition.location.festival` on `$here` (success side) | ✓ |
| Opposition: the order (faction, orders) | The order is scene fiction. It is never chipped, and its champion is a must-persist cast actor | ✓ (honest: no faction node is claimed) |

## Half A: anchoring

Each chip appears once per band. The three success bands carry identical chips (same ids, prefix changed), so they share one set of rows.

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| **Judged in the Square** (crit / success / s@c), `thread`: "The god's thread to {actor} runs stronger." | The `thread` edge from the player's ascendant to this mortal, written by step 2 `thread_strengthen` | `thread` edge, 📍 named | Yes. It names the god (the player) and `{actor}` (the resolved mortal), which are both endpoints of that particular edge | anchored |
| **A Champion's Due** (crit / success / s@c), `a favour owed`: "{cast:claimant} owes {actor} a favour now." | The `owes_favor` edge, debtor `$cast:claimant` (Wenna Coldridge, must-persist), creditor the actor, from step 2 `favor_creation` | `owes_favor` edge, 📍 named. The debtor concept is `entityId: $cast:claimant`, `visualKind: agent`, 🔗 linked | Yes. It names both the debtor and the creditor, and anchors the debtor end (rule 0c) | anchored |
| **The Town's Regard** (crit / success / s@c), `reputation with {location}`: "{location} thinks well of {actor} now." | The `reputation_with` edge to `$here`, +0.06 from step 2 | `reputation_with` edge, anchored on the counterparty location (`entityId: $here`, `visualKind: location`), 🔗 linked | Yes. `{location}` is the resolved town | anchored |
| **The Order Stays** (failure), `Under Watch`: "The order's men keep watch on {location} now." | The condition `trait.condition.location.under_watch` applied to `$here` by step 2 failure | Attachment · condition, template id with `visualKind: attachment`, 🔗 linked. The template exists in `condition-trait-content.ts` | Yes. The tag names Under Watch and the sentence names the town it sits on. "The order's men" is cause decoration on a real write, not the referent | anchored |
| **Judged and Found Wanting** (failure), `thread`: "The god's thread to {actor} runs thinner." | The same `thread` edge, written by step 2 `thread_weaken` | `thread` edge, 📍 named | Yes | anchored |
| **The Town's Regard** (failure), `reputation with {location}`: "{location} thinks less of {actor} now." | `reputation_with` `$here`, −0.06 | 🔗 linked (location) | Yes | anchored |
| **Lost Before the Valley** (critical_failure), `reputation with {location}`: "{location} thinks less of {actor} now." | `reputation_with` `$here`. On the step-0 and step-1 routes it is backed by −0.02, and on the step-2 route by −0.06 | 🔗 linked (location) | Yes | anchored |

**Half A result: 7 of 7 distinct chips anchored. No chip needs a fold or a bind.**

Rule 0 (backing) holds on every route. The failure and critical_failure split is right. A step-0 or step-1 failure is `continue_weakened`, so only a step-2 failure can produce the action-level `failure` band, and every failure chip's write fires there. `critical_failure` can come from any step, so it carries only the standing chip, which each step's `failureMetadata` backs. The final already records the unchipped `thread_weaken` and Under Watch on the step-2 crit-fail route (caveat 3) as under-reporting, and under-reporting is the honest choice. I agree with it.

### Advisory notes (not blocking, no fix owed)

1. **The thread chip declares only a tooltip.** The catalog's edge rule says to anchor both endpoint nodes by `entityId`. These chips carry `tooltipId: ui.thread` and no endpoint ids, so the referent is named in the prose but not declared in the data. This matches the shipped corpus norm: six live encounters (tithe-barn-raid, levee-breach, overdue-caravan, drowned-mans-testimony, cunning-fair, border-levy) declare thread chips the same way, and `check:encounter` accepts it. If the corpus ever adds `$actor` endpoint concepts to thread chips, this package should get the same retrofit. It is not a fold or bind here.
2. **The "Ask the champion to explain the style" reaction** writes an `intelligence` record (`cultural_knowledge`, "The Order's Style") about scene fiction, an order that has no node. This is a reaction, not a chip, and its label claims no place or object that does not exist. The record is still the weakest thing this encounter leaves, because nothing downstream is known to read a cultural_knowledge record about an unnamed order. It does not change the verdict, since the bond-change sibling reaction and the step-2 writes carry the failure side.
3. **The two Under Watch claims agree.** The chip's fiction is "the order's men keep watch". The condition's mechanics are a Shadow step penalty for 7 game days via `LOCATION_CONDITION_STEP_MODIFIER`, with the description "quiet work here is harder and more likely to be seen". The two say the same thing, so the chip promises nothing the engine cannot do. Bonus: slot 5 (The Coiners, shadow, urban) is exactly the kind of later job that feels this penalty in the same town.

## Half B: what it leaves behind

**What this encounter leaves for later encounters and systems, and whether the player would see it happen:**

- **Success side.**
  - An `owes_favor` edge from Wenna Coldridge (a must-persist cast actor) to the mortal. The favour and leverage systems read it (`socialLeverage`, `phaseSecretsFavors`, `secretsFavorsConsequences`, and `agentDetail` for the sheet), so it can be called in later. The player sees it on both sheets.
  - A stronger thread, which is core god-to-mortal state, visible on the thread row.
  - +0.06 regard with the town, which is read by the reputation gates and shown on the Location Profile standing row.
  - If the player picks the reaction, a 3-day Festival on the town. Its movement-tax reader is "crowds slow the streets", and it shows on the location card.
  - A bond with Corvin Ashe, the order's champion (must-persist), if the player picks the other reaction.
- **Failure side.**
  - Under Watch on the town for 7 game days, with a live Shadow step penalty on any work resolved there.
  - A thinner thread and −0.06 regard.
  - Optionally a bond with Wenna, earned by staying to load the cart.

Every write has a named reader and a surface the player already uses. That is `connected`.

## Fix list

None.

PACKAGE PASS
