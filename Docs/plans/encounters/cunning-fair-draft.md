# Encounter Pipeline: The Cunning Fair
> Scale: local (short) | Slug: cunning-fair | Pass: draft
> Date: 2026-09-29 | Pipeline version: 2.0
> Template: `encounter.town.cunning_fair` · Batch: journeyman-everyday-2, slot 6 (THR-1677) · Package: `Docs/plans/encounters/cunning-fair.package.json`

## 1. Inspiration Anchors

- **Brief row (binding):** veil 0.45, one step, `urban` + `rural`, query-prize shape, hand `secret` + `thread`, rarity 2, scale local, intrinsic tier background. Rolled: p3 unmitigated risk, opposition terrain (indifference), disposition n/a, role competitor, scale company.
- **Plot hook taken:** `hook.grief_absorption`. A widow's house has had no luck since her husband was buried, and grief is the only cause anyone at the fair can think of. The rival reads it as a restless ghost; the truth is plainer and kinder. The other two rolls (`hook.monster_eradication`, `hook.heresy_hunt`) pull toward arms or a trial; the brief keeps this slot at everyday folk-magic scale.
- **Opposition read:** terrain (indifference) is the truth itself. The dead man's savings sit up the chimney in a cloth bag, blocking the flue. It does not care which reader finds it. The rival reader is the competitor the agent's role names, not the thing that resists.
- **Structural models:** `assize-letter.package.json` (one-step shape, success/failure-half effects), `bell-at-the-exchange.package.json` (the tag-drawn step `rewardPool`), `overdue-caravan.package.json` (the `thread` chip form), `one-body-short.ts` (the `hidden mark` chip form).
- **Anti-patterns avoided:** no personal condition on the mortal as the failure penalty; no rule gate; no fiction-named prize (the keepsake is drawn, so the prose never names what it is); no arcane spectacle.

## 2. Scale Justification

Local, as the brief fixes. One house, one rival reader, one fair, settled in an afternoon. The journeyman weight is the audience: a reading given in front of the whole town either builds a trade or loses one.

## 3. Pressure Knot

Since the burial, the widow's hearth will not draw and she dreams of her husband every night. She has offered a keepsake of his at the fair to whoever reads the trouble truly. A rival reader from the next parish has already given an answer and is selling a charm on the strength of it.

## 4. Intervention Fantasy

The god gives the reader two things a reader never gets: the widow's own dream, seen from inside her sleep, and a sign dropped in the right place at the right moment (soot from the chimney while they stand at the hearth). The mortal still has to read it; fate still rolls whether they read it right.

## 5. Cast and World Objects

| Object | What it is | Wiring |
|---|---|---|
| `{cast:rival}` — Tamsin Carrow (spawn name) | A reader of charms from the next parish, already selling a charm to the widow | `supportBundle` actor, `lazy-materialize-on-trigger`, `must-persist`; reuse `healer` (seeded at hamlet, town, city, capital), spawn `healer`. Never gendered in prose. |
| The widow | The one who offers the prize | Role noun only. Not cast, so the one-named-person rule holds. |
| The keepsake | Drawn from the `#talisman` item family | Step `rewardPool` `{ categoryWeights: { possession: 1 }, tagFilters: ['#talisman'] }` projects onto `{ kind: 'item_template', tags: ['#talisman'] }`. Live members: five catalog entries (Wayfarer's Charm, Bone Ward, Duelist's Luck Token, The Hush Stone, Gambler's Last Copper) plus the generator's `relics_talismans` cores (ring, signet, amulet, locket, charm, coin, stone). |
| The town's trust | `reputation_with` `targetLocationId: '$here'` | +0.06 on success, −0.05 on failure. |
| The widow's coin (secret) | `hidden_mark` `secret_knowledge` on `$actor` | Success half. |
| The thread | `thread_strengthen` / `thread_weaken` `$ascendant` ↔ `$actor` | Success half / failure half. |

## 6. Beat Structure

1. **Read the widow's dream**: veil 0.45, `fail_action`. The dream shows the dead man at the cold hearth, pointing up. A true reading sends someone up the chimney, and the savings come down in a cloth bag. A false one agrees with the rival or names the wrong cause.

## 7. Branching Profile

Linear, no branching. Single Test, composed with the `query_prize` face.

## 8. Branching Map

N/A (linear encounter).

## 9. Outcome Ladder

| Band | Progress | Spent | New burden / opening |
|---|---|---|---|
| critical_success | The savings come down in front of the fair; best draw of the tier curve | An afternoon | Town trust +, thread +, knows the widow's coin |
| success | The widow finds the savings; the hearth draws | An afternoon | Same |
| success_at_cost | Right at the second try, after a public wrong start | Face in front of the fair; the rival calls it luck | Same chips; the cost lives in the overview |
| failure | None: the widow buys the rival's charm; the hearth stays cold | Their word at the fair | Town trust −, thread − |
| critical_failure | None: they named the wrong cause loudly | The fair's laughter; the rival sells a charm to every house on the square | Town trust −, thread − |

Cool failure: nobody is hurt, held or branded. Standing and trade.

## 10. Sample Opening

> {actor} is in {location} on fair day when a widow asks for cunning-folk.
>
> Her house has had no luck since her husband was buried. The hearth will not draw, and she dreams of him each night. She offers a keepsake of his to whoever reads the trouble truly.
>
> {cast:rival}, from the next parish, says the dead man is restless and sells a charm to lay him. Whoever reads it wrong in front of the fair loses the town's trade.

(78 words urban; the rural opening is *{actor} comes into {location} on fair day and hears a widow asking for cunning-folk.*, 79 words. Everything under P1 is the step's `narrativeTemplate`.)

## 11. The Hand Per Step

**Step 0: Read the widow's dream** · `deal: { count: 4, tags: ['lore', 'social'] }` + 2 specials (composed hand 6)

| Card | Type | Sphere | Cost | Δ | Effect line |
|---|---|---|---|---|---|
| Borrow Her Sleep | Whisper | mind | 2 essence | 0.12 | Show them what the widow sees each night, so they read where the dead man is pointing. |
| Rattle The Flue | Omen | matter | 2 essence | 0.11 | Knock soot down the widow's chimney while they stand at her hearth, so the sign falls in front of them. |

Fragments: Borrow: success · near_miss · failure. Rattle: critical_success · success_at_cost · failure · critical_failure. Between them the specials cover all six `StepOutcome`s. `Rattle The Flue` cuts both ways: the sign falls in public, so the rival can read it too.

The two specials answer different questions (what the dream shows, and where the sign is). Both act on objects the scene established (the widow's dream, the hearth). No core Boost special and no rider special, since the deal supplies both. No over-exposed signature card.

## 12. Linear continuation

One-step encounter: the step's `narrativeTemplate` is the whole spine (§10). The resolution lands in the afterimages:

- critical_success: *They read the dream to the hearth, and the dead man's savings came down the chimney in a cloth bag.*
- success: *They read the dream as pointing at the hearth, and the widow found his savings up the chimney.*
- success_at_cost: *They read the dream right at the second try, after the fair had watched the first one fail.*
- failure: *They read the dream as plain grief, and the widow bought the charm from {cast:rival}.*
- critical_failure: *They told the fair the dead man was angry with his widow, and the crowd laughed them off the square.*

## 13. Aftermath Paragraph

Fallback overview: *The fair has moved on from the square. The widow's house has its answer, right or wrong.* Each band overrides it (see `byOutcome` in the package). The critical success is the scene's warm beat: the savings come down the chimney in front of the whole fair, and the rival packs away the charms and leaves early.

## 14. Aftermath Reaction Choices

No reaction choices; the consequence is clean. Local scale, every write fires from step metadata, and the player's decisions were the cards.

## 15. Aftermath Kit Summary

| Band | Chips (scar · bond · boon · path) | Backing write |
|---|---|---|
| critical_success | BOND · reputation with {location} (gain) · BOND · thread (gain) · PATH · hidden mark · (engine) PRIZE | success half: `reputation_with $here`, `thread_strengthen`, `hidden_mark`, `rewardPool` |
| success | same | same |
| success_at_cost | same | same |
| failure | SCAR · thread (loss) · BOND · reputation with {location} (loss) | failure half: `thread_weaken`, `reputation_with $here` |
| critical_failure | same | same |

Fallback carries the uncategorised veil-reach growth line. Every chip sentence (`causeClause` + `detail`) is 15 words or fewer.

## 16. Support Bundle Contract

| Support object | Delivery | Source | Persistence | Future references | Status |
|---|---|---|---|---|---|
| `rival` (rival reader) | lazy-materialize-on-trigger | reuse `healer`, else spawn `healer` "Tamsin Carrow" | must-persist | named in prose and overviews; no edge written onto them | ready |
| The keepsake | drawn at resolution | `#talisman` item_template query | persists as a possession on `$actor` | sheet | ready (5 catalog bearers + generator cores) |

## 17. Self-Audit

| Item | Verdict | Note |
|---|---|---|
| Steps / difficulty exactly as brief | PASS | veil 0.45, one step, ≤ 0.45 background cap |
| Setting envelope + one opening per class | PASS | `urban`, `rural` |
| Cast bound, token keys declared | PASS | `rival`, materializing delivery |
| Hand rules (specials ≤2, deal declared, failure fragments) | PASS | 2 specials + deal 4; each special has a failure fragment; no Δ ≥ 0.15 |
| Consequence hand wired | PASS | secret → `hidden_mark`; thread → `thread_strengthen` / `thread_weaken`; no swap |
| Query prize | PASS | step `rewardPool` tag-filtered `#talisman` (the bell-at-the-exchange shape). Same caveat as batch 1: the census counts `content_query` only off a seed query, so this slot is a query prize by recipe, not by the census key |
| Rewards persist | PASS | `rewardPool` + `hidden_mark` |
| Systems quota | PASS | cast + rewards + reputation = 3 (checked against `checkCompositionContract` on the package: 0 violations) |
| byOutcome floor | PASS | five bands |
| Chip nouns = sheet words, ≤15 words | PASS | `reputation with {location}`, `thread`, `hidden mark`; no `$actor`-anchored noun |
| Law 56 backing per band | PASS | see kit table |
| No personal condition, no rule gate | PASS | |
| Prose rule 7 / 7b | PASS | no agent history asserted; no promise about later |
| Word budgets | PASS | opening 78/79; overviews ≤ 60; fragments ≤ 25; effect lines ≤ 25 |
| Machine gates | PENDING | `compile:encounter --dry-run` exits 0; `check:encounter` runs after the real compile |

### Experience Differentiator Gate

1 YES · 2 YES · 3 YES (dream, hearth, keepsake, rival all established) · 4 YES · 5 YES · 6 YES · 7 YES · 8 YES (delete the dream or the hearth and each card is senseless) · 9 YES (the dream vs the sign) · 9b YES · 10 YES · 11 YES (`{cast:rival}` and `{location}` named on the chips and overviews) · 11b YES (page-read: no overview fact repeated in a chip) · 12 N/A (local scale, no reactions) · 13 N/A · 14 YES. Concept art: a hearth with a small cloth bag resting in the soot, a charm of knotted string hanging from the mantel beside it. Grief that turned out to be a hidden kindness. Residue, no people.

## Critic revisions

Independent critic loop (Passes 2, 3, 3b), 2026-09-29, applied directly to `cunning-fair.package.json`. Verdicts: editorial **PASS WITH REVISIONS** · systems **READY WITH CAVEATS** · package **connected / PACKAGE PASS**. Detail: `cunning-fair-editorial.md`, `cunning-fair-systems.md`, `cunning-fair-package.md`.

- **Title** "The Cunning Fair" → **The Widow's Dream** (glance test, trigger 27). The id and slug are unchanged.
- **Opening / spine:** "cunning-folk" → "a dream reader"; "The hearth will not draw" → "Her fire smokes" (idiom, trigger 29); "truly" ×3 removed (intensifier); "lay him" → "calm him"; "from the next parish" → "a rival reader"; the P3 stake now names the place: "loses trade in {location}". 77/78 words.
- **Cards:** "Borrow Her Sleep" → **Open Her Dream** and "Rattle The Flue" → **Stir The Chimney** (lexicon verbs). Open's effect line no longer leaks the unintroduced answer ("where the dead man is pointing", gate 8): *"Put them inside the widow's sleep, so they read what she sees and not her telling of it."* Stir: *"Knock soot down onto the widow's hearth while they stand at it, so a sign falls where they can read it."*
- **Afterimages** rewritten on all five bands to remove seam echoes with the overviews (trigger 22). The afterimages now say how the reading went, and the overviews say what came of it.
- **Hidden mark:** the label is now "the coin in the widow's house", a spoken noun phrase for the `secret_knowledge` reveal table. `revealFamilies: ['shadow', 'settlement']` was added, since without it the mark was read by nothing and only decayed. The chip detail changed from "knows what coin the widow keeps" (an overclaim) to "knows there is coin in the widow's house now".
- **Chips:** the crit path cause "Saw the bag come down" was dropped (it repeated the overview, trigger 35). The crit reputation cause was dropped (two "Read the…" causes on one page). The reputation wording is uniform per polarity ("thinks better of" / "trusts … less"), because the write is one fixed ±delta on every band. The critical_failure thread cause is now "Blamed the dead man's anger with the god watching".
- **Concept art:** "a cold hearth" → "a hearth" (the fire smokes; it is not cold).
