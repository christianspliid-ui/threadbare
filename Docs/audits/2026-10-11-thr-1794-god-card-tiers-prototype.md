> **Prototype audit for THR-1794** (wayfinder map THR-1758, project Dominion — Player Power Progression). Attended session 2026-10-11, Christian present in chat; decided by delegation (process.md rule 4, 2026-09-11 case) with a veto invited. Inputs: Christian's THR-1770 ruling (option B, the omen market), the THR-1770 prototype (`Docs/audits/2026-10-08-thr-1770-god-card-buy-system-prototype.md`), the THR-1769 inventory, the THR-1765 attunement ladder, the THR-1762 frontier moves and the THR-1764 carriers. Prototype code on the never-merged branch `proto/thr-1794-card-tiers`: the table `scripts/proto-card-tiers-1794.tsv`, the model `scripts/proto-card-tiers-1794.mjs`, the catalog dumper `scripts/proto-card-catalog-1794.ts`, the frozen catalog and the full output `scripts/proto-card-tiers-1794.out.txt`.

# THR-1794 — god-card tiers and the generic set, carried as data

Christian's ask, verbatim: *"i would like a tier/progression system of actions, aswell as an assessment of which should be generic. this should all be metadata on the actions, as we will have to iterate on the distribution and potential add and remove actions, and create and delete some as we develop a working progression."*

Ground truth: `main` @ `1ed28336`, 2026-10-11. The catalog is the same 143 god-castable templates THR-1769 counted (`actorAffinities ∋ 'ascendant'`). Every number below re-runs with:

```
# on proto/thr-1794-card-tiers
node scripts/proto-card-tiers-1794.mjs --catalog scripts/proto-card-tiers-1794.catalog.json             # the report
node scripts/proto-card-tiers-1794.mjs --catalog scripts/proto-card-tiers-1794.catalog.json --check     # the gate in miniature
node scripts/proto-card-tiers-1794.mjs --catalog scripts/proto-card-tiers-1794.catalog.json --tool-reach --generic-sold   # the fork
```

## Verdict in one paragraph

Every god card gets a small `progression` block: a **tier** (1–4), how a god comes to hold it (**market** or **gift**, and for a gift, which beat gives it), whether it is **generic** (the same for every god), and the sphere whose earned essence **pays** for it. Tiers open as the god grows, on four **rungs** that read the THR-1765 attunement marks (for the scripted player about days 3, 10, 35 and 48). The omen market draws only from open rungs. **Generic cards split in two.** The **keys** are gifted as each rung opens: the god's threads to factions, armies, relics and the strong thread; thread care; Shift Dominion; Bestow and Anoint; and both reach signatures. These open whole card families or drive the Dominion loop. Sold, Shift Dominion reaches a god in only 49% of runs and the faction thread in 28% by day 45. Five generic powers (Focus, Teach a Spell, Attune, Scry, Reveal) are sold like any card, paid from the god's primary. Selling generics does **not** bring back the cookie cutter: the market's three identity-weighted omens keep the two sample gods apart either way (0.35–0.52 shared in the first five buys, against 3.77 for today's gifts). So sameness is not what decides the split; dead-ended families are. One finding changes the THR-1770 price rule: the catalog is sphere-lopsided (spirit 20 market cards, life 6, light 0). Priced strictly in the card's own sphere, a Life god can buy almost nothing, so a card may also be paid from the god's **primary at double price**.

## 1. The schema

One optional block on `UnifiedActionTemplate`, required by the gate on every ascendant-castable template:

```ts
/** THR-1794 — where this card sits on a run's progression ladder and how a god comes to hold it. */
readonly progression?: {
  /** Rung of the run ladder (1–4) from which the card can rise among the omens or be gifted. Not rarityTier. */
  readonly tier: 1 | 2 | 3 | 4;
  /** 'market' = can rise among the omens and be taken up for a price; 'gift' = arrives only by a beat. */
  readonly offer: 'market' | 'gift';
  /** For a gift: the beat that gives it. 'rung' = the rung-opening beat reads this field, so no grant list is authored;
   *  'signature' = the existing grantsReachSignature path (primary at Beat 4, secondary when SECONDARY_SIGNATURE_RUNG opens). */
  readonly giftBy?: 'spine' | 'milestone' | 'rung' | 'signature';
  /** true = the same card for every god: no identity weighting in the omen draw, paid from the god's primary if sold. */
  readonly generic: boolean;
  /** The sphere whose earned essence pays. Defaults to sphereAffinity; required on a sphereless, non-generic market card;
   *  never differs from sphereAffinity when both are set. */
  readonly pricedIn?: SphereName;
  /** Scales how often the card rises among the omens. Default 1. (Unused in the first pass; there for tuning.) */
  readonly offerWeight?: number;
};
```

**Extend before green-field — what each existing field does here:**

| Existing field | Verdict | Why |
|---|---|---|
| `rarityTier` (1–4) | **Left alone** | It has 30+ readers: card face treatment, the dice packet, the consequence-draw hand size (`consequenceDraw.ts`), the tray's rare override. Re-reading it as a progression rung would move all of them. The doc comment's "drives TB-100 unlock system" names a system that was never built; the build should drop that clause. |
| `intrinsicTier` | Left alone | Attention routing, orthogonal. |
| `trayTier` | Left alone | Drawer row placement, orthogonal. |
| `starter` | Left alone | The THR-501 empty floor holds; the five free utilities ride the spine beats instead (§3). |
| `sphereAffinity` | **Reused** as the default `pricedIn` | One sphere per card where one exists. A separate `pricedIn` exists only for the 23 sphereless sphere-bound cards, because setting `sphereAffinity` on them would also move cast odds and THR-1761 band discounts. Promoting them is a later content call. |
| `requiresReach` | Reused as is | It still hides the six signatures outside a god's reaches. |
| target `minTier` prerequisites | Left alone | Target eligibility, orthogonal to when a card is held. |
| `ASCENDANT_ACTION_BUCKETS` / spine and milestone grant lists | Kept | They stay the authored source for spine and milestone gifts; the gate cross-checks them against `giftBy` both ways. |
| THR-480 S/E/M/L/X persona tiering | Not adopted | It is a per-account layer (deferred); this ladder is within-run. THR-1773 decides what carries between runs. |

## 2. The ladder

| Rung | Opens when the god has crossed … attunement marks (THR-1765 ladder, bought spheres) | Scripted player | What a rung means in the fiction |
|---|---|---|---|
| 1 | 0 (opens with the first omens after the spine) | day 3 | A touch: cheap, local nudges and sight |
| 2 | 3 | day 10 | A hand: shapes a person or a place for good |
| 3 | 6 | day 35 | A will: regional, factional, sustained |
| 4 | 8 | day 48 | A wonder: world-marking (Smite, Rend the Earth, Rewrite History, Divine Edict) |

Proposed constants, all named on the proto branch: `PROGRESSION_RUNG_MARKS` [0, 3, 6, 8]; `PRICE_BY_TIER` 20 / 40 / 80 / 120 essence earned; `BUY_PRICE_ESCALATION` 0.1 **counted per tier** (a Tier 1 buy no longer makes a wonder dearer; with THR-1770's run-wide count, Tier 3–4 buys fall to 0–4 a run); `OFF_SPHERE_PRICE_MULT` 2; `MARKET_EVERY` 9 ticks, `MARKET_OFFER` 3, one take-up per market (Christian's B); `FRESH_RUNG_WEIGHT` 1.5 (the newest rung's cards rise a little more often); `RUNG_GIFT_SPACING` 36 ticks (a rung's key gifts arrive one per three days, not in a flood); `SECONDARY_SIGNATURE_RUNG` 2.

Why the rung reads the god's growth, not the calendar: a god that spends attention grows faster and sees grander omens sooner, which is the map's standing rule that attention is a spend. It also reuses one counter, the THR-1765 marks, instead of adding a second clock. The price reads a different counter (the per-sphere earned wallet), so the two gates do not double-count.

## 3. Generic or sphere-bound

**Generic** = a card that is the same for every god: no identity weighting, and paid from the primary if sold. 32 of 143. They fall into three groups:

| Group | Cards | How they arrive |
|---|---|---|
| Opening and free utilities | the spine cards, plus Survey Territory, Dormant Thread, Reactivate Thread (ride Beat 0) and Stillness, Recede (ride Beat 4) | Spine. The five free utilities are not powers to shop for: under THR-1770's market the optimiser bought "Reactivate a thread" as its second card |
| Wellspring and held ground | the five source verbs; Claim Dominion, Tap the Source, Claim Resource, Place of Power | Milestones, unchanged from THR-1747 |
| **Keys** | Bestow, Shift Dominion, Strengthen Thread, Attune Thread (rung 2); Anoint, the faction thread, the army thread (rung 3); the relic thread, the strong thread (rung 4) | **Gifted as the rung opens** |
| Sold generics | Focus, Teach a Spell, Attune (rung 2); Scry (rung 3); Reveal (rung 4) | Market, paid from the primary |

Both **reach signatures** are gifted too (sphere-bound, not generic): the primary at Beat 4 as today, the secondary as the first gift of rung 2. Sold, a god holds its own secondary in only 45% of runs.

A **key** opens a family of cards (the faction thread opens the seven faction cards), drives the Dominion loop (Shift Dominion is THR-1762's frontier move; Bestow and Anoint make carriers under THR-1764), or tends the god's threads. **Sphere-bound** = everything else, 93 market cards, offered by identity and paid in their sphere.

**The fork, measured** (`--generic-sold`, fit player, 400 seeds):

| | Keys gifted (chosen) | Every generic sold |
|---|---|---|
| Shared in the two gods' first five buys | 0.38 (optimiser 0.52) | 0.35 (optimiser 0.48) |
| Shift Dominion held by day 90 | 100% | **51%** |
| Faction thread held by day 45 / 90 | 100% / 100% | **28% / 87%** |
| Bestow held by day 90 | 100% | 76% |
| Cards held, day 90 | 55 | 48 |

Sameness does not separate the two, so the ticket's example fork ("generic cards are never sold, only gifted") is not a question of what a power means here; the dead-ended families decide it. Hence **decided, not reserved**.

## 4. The distribution check

Seed 1, fit player (one who plays for the story: values reach and sphere fit and grander tiers, and lets trivia pass once a higher rung is open). Held includes gifts. "Off-sphere" = paid from the primary at double price.

**Shepherd** (life/spirit; heart, stone, star):

| Day | Rung | Held T1/T2/T3/T4 | Bought T1/T2/T3/T4 | Held | Bought | of which off-sphere |
|---|---|---|---|---|---|---|
| 5 | 1 | 16 / 2 / 0 / 0 | 0 / 0 / 0 / 0 | 18 | 0 | 0 |
| 10 | 1 | 18 / 2 / 0 / 0 | 2 / 0 / 0 / 0 | 20 | 2 | 1 |
| 20 | 2 | 20 / 8 / 0 / 0 | 4 / 2 / 0 / 0 | 28 | 6 | 2 |
| 45 | 3 | 24 / 16 / 4 / 0 | 8 / 6 / 1 / 0 | 44 | 15 | 7 |
| 90 | 4 | 24 / 17 / 10 / 4 | 8 / 7 / 7 / 2 | 55 | 24 | 15 |

**Showcase god** (Vara: mind/spirit; eye, veil, shadow):

| Day | Rung | Held T1/T2/T3/T4 | Bought T1/T2/T3/T4 | Held | Bought | of which off-sphere |
|---|---|---|---|---|---|---|
| 5 | 1 | 17 / 2 / 0 / 0 | 1 / 0 / 0 / 0 | 19 | 1 | 0 |
| 10 | 1 | 20 / 2 / 0 / 0 | 4 / 0 / 0 / 0 | 22 | 4 | 0 |
| 20 | 2 | 21 / 9 / 0 / 0 | 5 / 3 / 0 / 0 | 30 | 8 | 0 |
| 45 | 3 | 25 / 17 / 4 / 0 | 9 / 7 / 1 / 0 | 46 | 17 | 4 |
| 90 | 4 | 25 / 17 / 12 / 4 | 9 / 7 / 9 / 2 | 58 | 27 | 9 |

First five buys, side by side (day · card · tier):

| # | Shepherd | Showcase |
|---|---|---|
| 1 | 6 · Whisper the Direction · 1 | 4 · Deceive · 1 |
| 2 | 9 · Bless the Land · 1 | 6 · Whisper of Intuition · 1 |
| 3 | 11 · Sanctify Tavern · 2 | 9 · Read the Threads · 1 |
| 4 | 13 · Compose a Clue · 1 | 9 · Listen for a Name · 1 |
| 5 | 16 · Cultivate · 2 | 12 · Bestow Vision · 1 |

**The cookie-cutter measure** (400 seeds; THR-1770's: shared cards in the two gods' first five): **0.38** fit / **0.52** optimiser, against the THR-1770 H3 baseline 0.49 / 0.61 and today's gifts 3.77. Counting gifts as well as buys: 0.21 / 0.36 (each god's distinct secondary signature is its first gift). Over 400 seeds the fit Shepherd buys 7.0 / 8.0 / 7.2 / 1.9 cards by tier over a run and holds 55 cards at day 90. That is about a third more than THR-1770's H3 (40), because the keys are free; a crowded hand is retuned by price, not by structure.

**Sensitivity** (in the `.out.txt`): strict own-sphere pricing (`--off-sphere-mult 0`) takes overlap to 0.06 but strands the Shepherd: 16 buys a run, 1.8 above Tier 2, with about 2,500 Life essence unspent at day 90. Run-wide escalation (`--escalation-scope all`, THR-1770's rule) leaves the optimiser with no Tier 3–4 buy at all.

## 5. Findings beyond the question

1. **The catalog is sphere-lopsided.** Market cards by price sphere: spirit 20, mind 19, force 13, entropy 8, order 7, time 6, life 6, chaos 6, matter 5, energy 4, darkness 2, light 0. Sphere × tier holes: life has no Tier 3–4; spirit, time, entropy have no Tier 4; energy no Tier 1 or 4; matter no Tier 2; chaos no Tier 3. Light and darkness are Foundation spheres, which THR-1749 keeps out of point-buy, so those holes matter less. The off-sphere price stops the holes stranding a god, but a Life god still has no Life wonder. This is content-authoring input; the gate reports the holes as warnings.
2. **Redundancy flags** (technical, not fun calls). Five *whisper to one mortal* cards overlap (Whisper the Direction, Bestow Vision, Whisper of Intuition, Plant a Dream of the Past, and Dream at spine). Five consecrate-a-place cards overlap. Three merge candidates: **Sanctify Tavern** (a tavern is a sublocation, so Sanctify covers it), and **Anchor the Sphere** and **Channel the Current** (sustained sphere holds that overlap Claim Dominion once THR-1762 re-keys it). The table carries these as `flag` values so a deletion pass can filter on them.
3. **THR-1770 prototype bug:** its sphere list has `void` where canon has `energy`, so energy cards could never be paid for there. Fixed in this model; THR-1770's numbers move little (energy has four market cards).
4. **Dependency:** the rung counter is the THR-1765 attunement ladder on bought spheres, which the Dominion core (THR-1748) builds. The progression build ticket is blocked by it.

## 6. The iteration loop

Christian's *"iterate on the distribution"* happens without code:

- `--set hex.smite=tier:3` (repeatable) changes one field and re-runs everything.
- `--tiers <file.tsv>` swaps in a whole alternative table.
- `--export` prints the merged table for a spreadsheet.
- `--rungs 0,3,6,8`, `--prices 20,40,80,120`, `--off-sphere-mult 2`, `--escalation-scope tier|all` retune the constants.
- `--generic-sold` runs the fork; `--tool-reach` shows how often each key is in hand.

In the build the same loop is one-line edits to the `progression` block on the template. The build ticket owes a port of this model that reads the templates directly, so the table and the code cannot drift.

## 7. The gate owed at build time

A content check (`check:god-card-progression`, wired into the content gates):

- **Fail:** every ascendant-castable template carries `progression`; `tier` ∈ 1..4; `offer` ∈ market | gift; a non-generic market card has a price sphere; `pricedIn` equals `sphereAffinity` when both are set; a gift has a `giftBy`; every spine/milestone grant id is `giftBy` spine/milestone and the reverse; every tier has at least one market card; every `giftBy: 'rung'` card's tier is ≤ 4 and its rung is reachable (`PROGRESSION_RUNG_MARKS` monotone, top ≤ the ladder's length).
- **Warn:** sphere × tier holes among the Creation spheres.

## 8. The surface (UI pillar)

No new screen. A rung opening is a beat in the Ascendant Bar's existing beat slot. It gives its key with prose that names the god's growth, and the omens it brings are the THR-1770 market mock. **The tier is never shown as a number** (Law 13): the player sees grander omens rise, and card faces keep their `rarityTier` treatment and sphere tint (Christian's standing preference). Words for the four rungs need a UL proposal if they ever reach the screen; the first pass does not show them.

## 9. Decided, reserved, veto

**Decided by delegation:**

1. The `progression` schema above; `rarityTier` is not reused.
2. Four rungs opened by the god's attunement marks (0 / 3 / 6 / 8); tier prices 20 / 40 / 80 / 120; escalation counted per tier.
3. A card is paid in its own sphere, or from the primary at double price.
4. Keys and both reach signatures are gifted as rungs open; five generic powers are sold, paid from the primary; everything else is sphere-bound and sold.
5. The first-pass table in the appendix.

**Reserved for Christian:** nothing. The one candidate fork (generic cards never sold) was settled by the dead-ended-family evidence, not by what a power means.

**Veto lines (one each):** *keys should be sold too* · *the second signature should be bought, not given* · *no double-price buying outside a card's sphere* · *rungs should open on the calendar, not the god's growth*.

## 10. What the model does not cover

- The scripted players buy by fixed value rules. The fit player's "skip trivia once a higher rung is open" is a player model, not a game rule.
- World-event milestones (company, guttering thread) are not simulated, as in THR-1770, so held counts undercount every option equally.
- Offer weighting uses the THR-1770 identity weight with normalised affinities.
- Dominion bands do not yet move prices. THR-1761's band discounts apply to cast cost, not buy price, and whether they should touch the buy price is for the Dominion core's plan doc.
- Only two sample gods, and both have Spirit as their secondary, which raises their overlap honestly.

## Appendix — the first-pass table (143 cards)

Source of truth: `scripts/proto-card-tiers-1794.tsv` on `proto/thr-1794-card-tiers`. Flags in brackets.

| Card | Tier | How a god gets it · paid in | Note |
|---|---|---|---|
| Imbue (`action.imbue`) | 1 | gift · spine | Spine Beat 2 |
| Bind Thread — Agent (`bind_thread_agent`) | 1 | gift · spine | Spine Beat 0 |
| Bind Thread — Location (`bind_thread_location`) | 1 | gift · spine | Spine Beat 1 |
| Dream (`divine.dream`) | 1 | gift · spine | Beat 4 choice; teaches the first sphere verb |
| Inspire (`divine.inspire`) | 1 | gift · spine | Beat 4 choice |
| Omen (`divine.omen`) | 1 | gift · spine | Beat 4 choice |
| Persuade (`divine.persuade`) | 1 | gift · spine | Spine Beat 3 |
| Recede (`divine.self.recede`) | 1 | gift · spine | Free self verb; rides with Beat 4 |
| Stillness (`divine.self.stillness`) | 1 | gift · spine | Free self verb; rides with Beat 4 so the drawer opens with it |
| Survey Territory (`hex.survey`) | 1 | gift · spine | Free sight; rides with Beat 0 beside Observe |
| Bless the Harvest (`loc.bless_harvest`) | 1 | gift · milestone | Wellspring-flows milestone |
| Blight the Fields (`loc.blight`) | 1 | gift · milestone | Wellspring-flows milestone |
| Claim a Wellspring (`loc.claim_source`) | 1 | gift · milestone | Wellspring milestone |
| Consecrate a Source (`loc.consecrate_source`) | 1 | gift · milestone | Wellspring milestone |
| Ward the Source (`loc.defend_source`) | 1 | gift · milestone | Wellspring milestone |
| Search for Wellsprings (`loc.find_source`) | 1 | gift · milestone | Wellspring milestone |
| Open the Markets (`loc.open_markets`) | 1 | gift · milestone | Wellspring-flows milestone |
| Deepen the Source (`loc.sanctify_source`) | 1 | gift · milestone | Wellspring milestone |
| Observe (`observe_agent`) | 1 | gift · spine | Spine Beat 0 |
| Dormant Thread (`thread.dormant`) | 1 | gift · spine | Free thread care; rides with Beat 0 (the first thread), not a power to shop for |
| Reactivate Thread (`thread.reactivate`) | 1 | gift · spine | Free thread care; rides with Beat 0 |
| Empower (`artifact.empower`) | 1 | market · force | Cheap relic verb |
| Enchant (`artifact.enchant`) | 1 | market · order | Cheap relic verb |
| Nullify (`artifact.nullify`) | 1 | market · entropy | Cheap relic verb |
| Deceive (`divine.deceive`) | 1 | market · mind | Cheap one-mortal nudge |
| Intimidate (`divine.intimidate`) | 1 | market · force | Cheap one-mortal nudge |
| Cast Attention (`divine.perceive.cast_attention`) | 1 | market · spirit | Ruin-reading family opener [ruins] |
| Listen for a Name (`divine.perceive.listen_for_a_name`) | 1 | market · mind | Ruin-reading [ruins] |
| Read the Threads (`divine.perceive.read_the_threads`) | 1 | market · mind | Ruin-reading [ruins] |
| Refine the Hush (`divine.perceive.refine_the_hush`) | 1 | market · spirit | Ruin-reading [ruins] |
| Compose a Clue (`divine.relay.compose_a_clue`) | 1 | market · mind | One clue into a bond; cheap |
| Whisper the Direction (`divine.relay.whisper_the_direction`) | 1 | market · spirit | Overlaps four other whisper-to-a-mortal cards [whispers] |
| Bestow Vision (`hex.bestow_vision`) | 1 | market · mind | Overlaps four other whisper-to-a-mortal cards [whispers] |
| Bless the Land (`hex.bless_land`) | 1 | market · life | Cheap land blessing |
| Dowse for Resources (`hex.dowse_resources`) | 1 | market · matter | Cheap sight into the ground |
| Mark the Ground (`hex.mark_ground`) | 1 | market · time | Cheap ruin verb [ruins] |
| Read the Currents (`hex.read_currents`) | 1 | market · spirit | Cheap sight into the flows [flows] |
| Whisper of Intuition (`hex.whisper_intuition`) | 1 | market · mind | Overlaps four other whisper-to-a-mortal cards [whispers] |
| Fortify (`loc.fortify`) | 1 | market · force | Cheap place nudge |
| Incite Unrest (`loc.incite_unrest`) | 1 | market · chaos | Cheap place nudge |
| Ward (`loc.ward`) | 1 | market · order | Cheap protective place verb |
| Sanctify (`sub.sanctify`) | 1 | market · spirit | Cheapest consecration [consecration] |
| Trap (`sub.trap`) | 1 | market · chaos | Cheap snare |
| Vision (`sub.vision`) | 1 | market · mind | Cheap sight into a room |
| Bestow Power (`action.bestow`) | 2 | gift · rung | KEY: Dominion carrier (THR-1764: a bestowed mortal carries one thread tier higher) |
| Bless this Company (`company.bless`) | 2 | gift · milestone | First-company milestone |
| Draw Together (`company.draw_together`) | 2 | gift · milestone | Gathering-bonds milestone |
| Reunite (`company.reunite`) | 2 | gift · milestone | Empty-road milestone |
| Sunder (`company.sunder`) | 2 | gift · milestone | Empty-road milestone |
| Rekindle the Thread (`divine.rekindle_thread`) | 2 | gift · milestone | Earned by the first Broken thread |
| Attune Thread (`hex.attune_thread`) | 2 | gift · rung | KEY: thread care, every god's |
| Claim Dominion (`hex.claim_dominion`) | 2 | gift · milestone | Held-ground milestone (THR-1747 E5); the plain Dominion hold |
| Claim Resource (`hex.claim_resource`) | 2 | gift · milestone | Held-ground milestone (THR-1747 E5) |
| Shift Dominion (`hex.shift_dominion`) | 2 | gift · rung | KEY: the frontier move (THR-1762); sold, it rises in only 48% of runs |
| Strengthen Thread (`hex.strengthen_thread`) | 2 | gift · rung | KEY: thread care, every god's |
| Tap the Source (`hex.tap_source`) | 2 | gift · milestone | Held-ground milestone (THR-1747 E5) |
| The Deep Eye (`invest.eye.deep_eye`) | 2 | gift · signature | KEY: reach signature; primary at Beat 4, secondary gifted when rung 2 opens (sold, a god holds its own secondary in only 45% of runs) [signature] |
| Patronage Network (`invest.gold.patronage_network`) | 2 | gift · signature | KEY: reach signature; primary at Beat 4, secondary gifted when rung 2 opens (sold, a god holds its own secondary in only 45% of runs) [signature] |
| Sworn Oath (`invest.heart.sworn_oath`) | 2 | gift · signature | KEY: reach signature; primary at Beat 4, secondary gifted when rung 2 opens (sold, a god holds its own secondary in only 45% of runs) [signature] |
| Warhost (`invest.iron.warhost`) | 2 | gift · signature | KEY: reach signature; primary at Beat 4, secondary gifted when rung 2 opens (sold, a god holds its own secondary in only 45% of runs) [signature] |
| Broker's Web (`invest.shadow.brokers_web`) | 2 | gift · signature | KEY: reach signature; primary at Beat 4, secondary gifted when rung 2 opens (sold, a god holds its own secondary in only 45% of runs) [signature] |
| Beacon of Fate (`invest.star.beacon_of_fate`) | 2 | gift · signature | KEY: reach signature; primary at Beat 4, secondary gifted when rung 2 opens (sold, a god holds its own secondary in only 45% of runs) [signature] |
| The Great Work (`invest.stone.great_work`) | 2 | gift · signature | KEY: reach signature; primary at Beat 4, secondary gifted when rung 2 opens (sold, a god holds its own secondary in only 45% of runs) [signature] |
| Rend the Gate (`invest.veil.rend_the_gate`) | 2 | gift · signature | KEY: reach signature; primary at Beat 4, secondary gifted when rung 2 opens (sold, a god holds its own secondary in only 45% of runs) [signature] |
| Guide the Caravan (`loc.guide_caravan`) | 2 | gift · milestone | Wellspring-flows milestone |
| Place of Power (`loc.place_of_power`) | 2 | gift · milestone | Held-ground milestone (THR-1747 E5) |
| Reveal the Vein (`loc.reveal_vein`) | 2 | gift · milestone | Wellspring-flows milestone |
| Sour the Mine (`loc.sour_mine`) | 2 | gift · milestone | Wellspring-flows milestone |
| Consecrate (`action.consecrate`) | 2 | market · spirit | Sphere-tinted hold on a holy place [consecration] |
| Call in Favor (`action.secrets.call_in_favor`) | 2 | market · force | Secrets family |
| Reveal Secret (`action.secrets.reveal_secret`) | 2 | market · mind | Secrets family opener |
| Embolden (`action.social.embolden`) | 2 | market · force | Personal; needs a mortal mid-scene |
| Tip the Scales (`action.social.tip_scales`) | 2 | market · mind | Costly personal nudge inside a negotiation |
| Teach a Spell (`action.teach_spell`) | 2 | market · generic (primary) | The spell carries the sphere, not the card; sold, paid from the primary |
| Inspire Undertaking (`action.undertaking.inspire`) | 2 | market · spirit | Helps a mortal's undertaking |
| Sabotage Undertaking (`action.undertaking.sabotage`) | 2 | market · entropy | Hinders a mortal's undertaking |
| Attune (`artifact.attune`) | 2 | market · generic (primary) | Tunes a relic to the god's own sphere; sold, paid from the primary |
| Curse (`artifact.curse`) | 2 | market · chaos | Lasting curse on a relic |
| Afflict/Bless (`divine.afflict_bless`) | 2 | market · life | Reshapes a body; larger than a nudge |
| Coincidence (`divine.coincidence`) | 2 | market · time | Bends events around a mortal, not a whisper |
| Taste the Wake (`divine.perceive.taste_the_wake`) | 2 | market · time | Reads other gods' recent work; deeper sight [ruins] |
| Focus (`divine.self.focus`) | 2 | market · generic (primary) | Self verb every god can use; sold, paid from the primary |
| Amplify the Flow (`hex.amplify_flow`) | 2 | market · energy | Leyline family [flows] |
| Attune Leyline (`hex.attune_leyline`) | 2 | market · energy | Leyline family [flows] |
| Compel Exploration (`hex.compel_exploration`) | 2 | market · mind | Sends nearby mortals into a ruin [ruins] |
| Corrupt the Land (`hex.corrupt_land`) | 2 | market · entropy | Lasting land harm |
| Cultivate (`hex.cultivate`) | 2 | market · life | Sustained land growth |
| Desecrate (`hex.desecrate`) | 2 | market · entropy | Twists a ruin's character [ruins] |
| Dispel the Wild (`hex.dispel_wild`) | 2 | market · order | Leyline family [flows] |
| Plant a Dream of the Past (`hex.plant_dream`) | 2 | market · mind | Ruin vision sent along a thread [ruins,whispers] |
| Read the Stones (`hex.read_stones`) | 2 | market · spirit | Deeper ruin-reading [ruins] |
| Scorch Earth (`hex.scorch_earth`) | 2 | market · force | Destroys a hex's yield |
| Seal the Tomb (`hex.seal_tomb`) | 2 | market · order | Wards a ruin shut [ruins] |
| Seed Life (`hex.seed_life`) | 2 | market · life | Restores barren ground |
| Shift Season (`hex.shift_season`) | 2 | market · life | Moves a season across a hex |
| Spark an Encounter (`hex.spark_encounter`) | 2 | market · chaos | Draws mortals together by fate |
| Stir the People (`hex.stir_people`) | 2 | market · mind | Moves a population's mood |
| Summon Congregation (`hex.summon_congregation`) | 2 | market · spirit | Calls the receptive to gather |
| Ward Against the Deep (`hex.ward_against_deep`) | 2 | market · spirit | Guards a mortal going into a ruin [ruins] |
| Curse the Roads (`loc.curse_roads`) | 2 | market · chaos | Regional hex on trade |
| Sanctify the Square (`loc.sanctify_square`) | 2 | market · spirit | One of five consecrate-a-place cards [consecration] |
| Sicken the Wells (`loc.sicken_wells`) | 2 | market · entropy | A settlement-wide affliction |
| Sanctify Tavern (`sub.sanctify_tavern`) | 2 | market · life | A tavern is a sublocation: Sanctify covers it; merge candidate [consecration,merge] |
| Whisper Insight (`whisper_insight`) | 2 | market · spirit | Reads a mortal's values; sphere-tinted sight |
| Anoint (`action.anoint`) | 3 | gift · rung | KEY: Dominion carrier (THR-1764: an anointed faction tends its towns) |
| Bind Thread — Army (`bind_thread_army`) | 3 | gift · rung | KEY: opens the army thread |
| Bind Thread — Faction (`bind_thread_faction`) | 3 | gift · rung | KEY: opens the faction family; sold, 24% hold it by day 45 |
| Anoint Champion (`action.anoint-champion`) | 3 | market · force | Mantles a champion; larger than Bestow |
| Enshrine Relic (`action.consecrate-relic`) | 3 | market · spirit | A relic that feeds a consecration; bigger than Consecrate [consecration] |
| Kindle a Calling (`action.faction.kindle_a_calling`) | 3 | market · force | Faction family [faction] |
| Recover Doctrine (`action.faction.recover_doctrine`) | 3 | market · mind | Faction family [faction] |
| Stir Dissent (`action.faction.stir_dissent`) | 3 | market · mind | Faction family opens with the faction thread at rung 3 [faction] |
| Surface a Doubter (`action.faction.surface_doubter`) | 3 | market · spirit | Faction family [faction] |
| Whisper to the Leader (`action.faction.whisper_leader`) | 3 | market · spirit | Faction family [faction] |
| Plant Secret (`action.secrets.plant_secret`) | 3 | market · darkness | A fabricated truth that spreads; bigger than a reveal |
| Dream Sending (`dream_sending`) | 3 | market · mind | Draws out a mortal's ambitions and fears |
| Anchor the Sphere (`hex.anchor_sphere`) | 3 | market · energy | A sustained sphere hold: overlaps Claim Dominion after THR-1762 [flows,merge] |
| Bind the Echoes (`hex.bind_echoes`) | 3 | market · time | Sustained hold on a ruin's echoes [ruins] |
| Bury the Past (`hex.bury_past`) | 3 | market · entropy | Swallows a ruin [ruins] |
| Channel the Current (`hex.channel_current`) | 3 | market · energy | Sustained redirect of sphere pressure: overlaps Claim Dominion after THR-1762 [flows,merge] |
| Consecrate the Past (`hex.consecrate_past`) | 3 | market · time | Re-spheres a ruin [ruins] |
| Forge Seer's Token (`hex.forge_seer_token`) | 3 | market · spirit | Makes a lasting artifact of sight |
| Impose Decree (`hex.impose_decree`) | 3 | market · order | A law over a territory |
| Incite Exodus (`hex.incite_exodus`) | 3 | market · entropy | Empties a territory |
| Raise Landmark (`hex.raise_landmark`) | 3 | market · matter | Reshapes a hex; lasting |
| Restore a Fragment (`hex.restore_fragment`) | 3 | market · matter | Rebuilds part of a ruin [ruins] |
| Scatter (`hex.scatter`) | 3 | market · force | Breaks a gathering by force |
| Send a Herald (`hex.send_herald`) | 3 | market · spirit | A divine messenger in mortal form |
| Sever the Flow (`hex.sever_flow`) | 3 | market · entropy | Cuts every flow in a hex [flows] |
| Shepherd the Flock (`hex.shepherd_flock`) | 3 | market · spirit | Sustained presence over a people |
| Awaken the Spirit of the Place (`loc.awaken_spirit`) | 3 | market · spirit | Wakes a settlement's spirit; regional and lasting |
| Scry (`scry_agent`) | 3 | market · generic (primary) | Deep sight into one mortal; sold, paid from the primary |
| Bind Strong Thread — Agent (`bind_thread_agent_strong`) | 4 | gift · rung | KEY: the deepest mortal thread |
| Bind Thread — Artifact (`bind_thread_artifact`) | 4 | gift · rung | KEY: opens the relic thread |
| Divine Edict (`action.divine-edict`) | 4 | market · mind | Overrules a faction conclave; most expensive card in the catalog |
| Anoint Successor (`action.faction.anoint_successor`) | 4 | market · force | Decides who rules a faction next [faction] |
| Schism (`action.faction.schism`) | 4 | market · chaos | Splits a faction in two; world-marking [faction] |
| Reveal (`divine.self.reveal`) | 4 | market · generic (primary) | The god shows itself; a late wonder, sold, paid from the primary |
| Forge Divine Instrument (`hex.forge_instrument`) | 4 | market · matter | A divine instrument; world-marking |
| Install a Champion (`hex.install_champion`) | 4 | market · order | Puts a chosen mortal at a faction's head |
| Rend the Earth (`hex.rend_earth`) | 4 | market · force | Catastrophe; world-marking |
| Rewrite History (`hex.rewrite_history`) | 4 | market · mind | Rewrites what a ruin remembers; world-marking [ruins] |
| Smite (`hex.smite`) | 4 | market · force | Kills a mortal outright; world-marking |
