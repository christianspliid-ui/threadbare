> **title:** `God cards carry their progression as data, and the world offers them — THR-1811`
> **linear_issue:** THR-1811
> **author:** `Claude Code (design lane, unattended run 2026-10-13a)`
> **created:** 2026-10-13
> **three_pillars:** Engine `done — one pure progression module, a rung read on the shipped attunement marks, an offering in the existing cadence slot, a spend ledger beside the run-long earned counter; no new node, edge or phase` · Content `done — a progression block on all 143 god cards, four rung-opening beats, the offering beat and its words` · UI `done — the offering pill and modal on the existing beat surfaces, the price word ladder, rung-gift prose, debug bridge + DebugPanel readout`

# God cards carry their progression as data, and the world offers them — THR-1811

*Christian ruled that a god takes up its powers "from what the world offers" and paid for them in essence it has earned, and asked that the ladder and the generic verdict be data on the cards. This plan puts the ladder on the cards and builds the offering that reads it.*

## Why this is load-bearing

Today every god receives the same cards on the same schedule. The cadence pool's investment beats hand Consecrate, Bestow and Anoint to everyone, so two different gods share 3.8 of their first five cards after the opening ([A buy system for god actions](https://linear.app/threadbare/issue/THR-1770), 400 seeds). Christian picked the fix in chat on 2026-10-09 (option B, verbatim on that ticket): *"i go with B, and i would like a tier/progression system of actions, aswell as an assessment of which should be generic. this should all be metadata on the actions, as we will have to iterate on the distribution and potential add and remove actions, and create and delete some as we develop a working progression."*

[God-card tiers and the generic set](https://linear.app/threadbare/issue/THR-1794) then decided the ladder, the generic split and the first-pass table (attended, 2026-10-11). The [Dominion core](https://linear.app/threadbare/issue/THR-1748) shipped the attunement marks the rungs read (merged 2026-10-12, [PR #2351](https://github.com/christianspliid-ui/threadbare/pull/2351)). This is plan doc 3 of the closed [Dominion map](https://linear.app/threadbare/issue/THR-1758)'s carve-up. [The world remembers](https://linear.app/threadbare/issue/THR-1813) waits on it, because what carries between runs depends on the tier ladder.

## Settled inputs

None is re-opened here. Each is cited inline where it is used.

| Ticket | Who decided, when | What it settled |
|---|---|---|
| [A buy system for god actions](https://linear.app/threadbare/issue/THR-1770) | Christian, chat, 2026-10-09 (option B); the rest by the design lane 2026-10-08 | The world offers three cards every few days; the god takes up one or lets them pass; the price is essence earned through the card's sphere, never the casting pool; 24 story cards stay gifts; rulebook §4 becomes *from what the world offers* |
| [God-card tiers and the generic set](https://linear.app/threadbare/issue/THR-1794) | attended, 2026-10-11, by delegation | The `progression` schema; four rungs at 0 / 3 / 6 / 8 marks; tier prices 20 / 40 / 80 / 120 with escalation counted per tier; double price from the primary; keys and both signatures gifted; five generic powers sold; the 143-row first-pass table |
| [How the god's own power grows](https://linear.app/threadbare/issue/THR-1765) | design lane, 2026-10-10 | The run-long attunement ladder `DOMINION_ATTUNEMENT_MARKS`, counted on bought spheres only |
| [Dominion core](https://linear.app/threadbare/issue/THR-1748) | shipped 2026-10-12 | `getAttunementMarksCrossed` (`src/engine/dominion.ts:524`), "the one accessor for THR-1811's rungs" |
| [A gift waits its turn](https://linear.app/threadbare/issue/THR-1805) | shipped | Pool beats never open themselves; they wait as the offer pill |

Every input closed more than 24 h before this plan started (youngest: THR-1794, 2026-10-11 07:56Z). The calls this plan adds are under § Decided by delegation and carry their own veto window at handoff.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Unified action templates (`UnifiedActionTemplate`) | 🟢 ACTIVE | **extends** — an optional `progression` block; `rarityTier` untouched |
| Ascendant Beat Director (`phaseAscendantBeatDirector`, cadence pool) | 🟢 ACTIVE | **extends** — the offering joins the cadence draw; the grant-bearing pool beats retire |
| In-run progression (`phaseAscendantProgression`, milestones) | 🟢 ACTIVE | **extends** — rung detection and rung gifts beside the milestones, through the same offer-or-skip path |
| Action unlocks (`unlockedActionIds`, `resolvePendingBeat`) | 🟢 ACTIVE | **extends** — a taken-up card unlocks through the same grant path; one new `via` value |
| Essence earned + attunement marks (`essenceEarned.ts`, `dominion.ts`) | 🟢 ACTIVE | **reads** — the rung counter; a separate spend ledger beside it, so spending never un-attunes |
| Target action slots (reach gate) | 🟢 ACTIVE | **reads** — the reach gate moves into one exported predicate; the offering never offers a card the reach gate hides |
| Codex run state (`codexRunState.ts`) | 🟢 ACTIVE | **preserves** — three states unchanged |

Population consumed: the 143 god cards the THR-1769 and THR-1794 runtime filter counted (`actorAffinities ∋ 'ascendant'`). A static grep agrees: 135 literals in `unified-action-templates.ts` and 8 in `reach-signature-content.ts` (a third hit in `ascendant-pool-beat-templates.ts:23` is a doc comment). The gate counts the runtime catalog, so a card assembled from another file is still checked.

## Measured substrate

Read over `origin/main` @ `f3c397f3`, 2026-10-13.

| Claim | Evidence |
|---|---|
| `rarityTier` exists and its doc names a system that was never built | `src/types/unifiedAction.ts:2417-2418`: `/** Narrative significance tier. Drives visual treatment and TB-100 unlock system. */` |
| The god holds a card through one list | `GameState.unlockedActionIds` (`src/types/gameState.ts:360`), read by `isActionRevealed` (`src/engine/actionUnlock.ts:27-34`); granted in `resolvePendingBeat` (`src/engine/ascendantBeat.ts:1140-1154`), trace `action.unlock.granted` with `via: 'beat' \| 'debug'` (`src/types/trace.ts:5604`) |
| One pending beat at a time, and no beat ever expires | `phaseAscendantBeatDirector` (`ascendantBeat.ts:813`) returns while `beats.pending`; `PendingBeat` (`src/types/ascendantBeat.ts:140`) has no expiry field |
| The cadence slot already fires about every 9 ticks | `BEAT_BASE_INTERVAL = 9`, `BEAT_INTERVAL_JITTER = 2`, `BEAT_MIN_GAP = 4` (`src/data/ascendant-beat-content.ts:32-37`); draw at `ascendantBeat.ts:843-878` over `ASCENDANT_BEAT_POOL` + delivery beats, weights `BEAT_KIND_WEIGHTS` introduction 3 / investment 4 / selection 1 / delivery 2 (`:103-108`) |
| The cookie cutter lives in the pool's grant beats | `beat.pool.invest.the_hallowed_place` grants Consecrate + Consecrate Relic (`:454-461`), `the_favored_soul` Bestow + Teach a Spell (`:464-471`), `the_chosen_banner` Anoint (`:474-479`), `the_unveiled_eye` the two secrets cards (`:500-505`); `beat.pool.invest.reach_signature` grants the secondary signature (`:534-539`) |
| Pool beats wait as a pill; only spine gifts open themselves | `AscendantBeatOfferBanner` (`src/components/Game/AscendantBeatModal.tsx:407`, rendered `GameView.tsx:6558`); a selection beat resolves one chosen card through `onResolve(chosenActionId)` → `handleResolveBeat` (`GameView.tsx:3252`) → `resolvePendingBeat` (`ascendantBeat.ts:1110-1122`) |
| The earned counter only rises | `essenceEarned.ts:6` "Spending never decrements it"; `GameState.essenceEarnedBySphere` (`gameState.ts:249`); no spendable earned balance exists |
| The rung accessor exists per sphere | `getAttunementMarksCrossed(state, sphere)` (`dominion.ts:524`), 0 for an unbought sphere; `godSpherePoints` exported (`dominion.ts:107`); `DOMINION_ATTUNEMENT_MARKS` [20 … 2800] (`src/data/dominion-content.ts:141`) |
| The drawer's sphere gate **counts but does not hide**: a card outside the god's two spheres still shows and is castable from its own sphere's pool | `src/engine/targetActions.ts:458-465`: `if (!sphereAllowed) { counts.bySphere++; // Still show as locked slot rather than hiding entirely }`. Nothing sets `available` or `lockedReason` for it (`:497-520`). The reach gate does hide (`:444-455`, `continue`) |
| A day is 12 ticks, and a tick is a real second | `TICKS_PER_DAY = 12` (`src/data/attention-constants.ts:14`); `ascendant-beat-content.ts:44` "A tick is a real second" |
| Milestones queue through one offer-or-skip helper | `offerOrSkipGrantMilestone` (`src/engine/phaseAscendantProgression.ts:238`), which never offers a held card (THR-647) |
| Template cross-checks are tests today, not scripts | `ascendantBeatPool.test.ts`, `ascendantSpine.test.ts`, `unreachableActions.test.ts`, rarity validation `unified-action-templates.test.ts:384`; gate classifier `scripts/gate.ts:185` |
| "Omen" is taken twice already | UL `Encounters.md:383` (an omen track, "pressure, never a thing a mortal holds"); the card `divine.omen` (`unified-action-templates.ts:635`); the Omens panel and Codex section |

**A finding for tuning, not a decision.** THR-1794's model offers every market card the reach gate allows, whatever its sphere; an off-sphere card is castable today (above), so nothing bought is wasted. Re-running the THR-1794 model with one added filter that offers only cards in the god's two spheres or sphereless (`--sphere-gate`, scratch copy of `proto/thr-1794-card-tiers`, 400 seeds):

| | THR-1794 as decided (built here) | Offer only in-sphere and sphereless cards |
|---|---|---|
| Cards the Shepherd (life/spirit) can be offered | 93 | 49 (tiers 10 / 21 / 15 / 3; 26 sphereless) |
| Cards the showcase god (mind/spirit) can be offered | 93 | 60 (17 / 20 / 18 / 5) |
| Shared in the two gods' first five buys, fit / optimiser | 0.38 / 0.52 | **0.03 / 0.05** |
| Shepherd, fit: held day 90, bought, by tier | 55.0, 24.1, 7.0 / 8.0 / 7.2 / 1.9 | 54.7, 23.7, 5.7 / 8.8 / 7.7 / 1.6 |
| Fifth buy | day 16 | day 16 |

The filter costs the run almost nothing and makes the two gods almost fully distinct, but THR-1794 decided the open offer with Christian present, and 0.38 already clears the bar (3.77 today). This plan builds THR-1794 as decided and ships the filter as one switch, `OFFERING_IN_SPHERE_ONLY` (default `false`), so a playtest that finds two gods' hands too alike is answered by one constant. § Decided 1.

## Decided by delegation (design lane, 2026-10-13 — veto in chat)

1. **The world offers what THR-1794 decided: any market card the reach gate allows, at any sphere.** The reach gate hides a signature outside the god's reaches, so the offering applies it too (one exported predicate from `targetActions.ts:444-455`, which `getTargetActionSlots` also calls; behaviour unchanged). The sphere gate is not applied by default, because the drawer does not hide off-sphere cards and a card bought outside the god's spheres is castable from that sphere's pool. `OFFERING_IN_SPHERE_ONLY` (default `false`) switches the offer to in-sphere and sphereless cards; measured above. *Why not on by default:* THR-1794 settled the open offer with Christian present; this plan does not re-open it.
2. **The offering is a cadence beat, not a new clock, and it rises about once a day.** It joins the existing cadence draw as kind `offering` with weight `OFFERING_BEAT_WEIGHT` 8, beside introductions (3) and deliveries (2). The cadence is ~9 ticks (`BEAT_BASE_INTERVAL`), the interval every price in THR-1770 and THR-1794 was tuned against (`MARKET_EVERY = 9`), so an offering rises about once an in-game day, roughly every 10–15 real seconds of running time. The ticket says "every ~9 ticks"; THR-1770's option text said "every few days", which was loose wording for the same 9-tick model, so the player-facing text says *each day*, which is true. *Cost, stated:* when an introduction or a delivery wins the draw, no offering rises that time. § Kill criteria watches it.
3. **The grant-bearing pool beats retire.** The ten investment and two selection beats leave the pool; their cards now come from the offering, the rung gifts or the spine. `beat.pool.invest.reach_signature` retires; the secondary signature is the first gift of rung 2 (THR-1794). Introduction and delivery beats stay. *Why:* they are the cookie cutter THR-1770 measured; leaving them would hand every god the same cards beside the offering. Their beat ids stay readable in `history` (old saves).
4. **An offering passes when the day turns.** A `PendingBeat` gains an optional `expiresTurn`, set to the first day boundary (a multiple of `TICKS_PER_DAY`) at least `OFFERING_MIN_TTL_TICKS` (6) after the offer. An offering not entered by then is recorded as passed (outcome `passed`) and frees the slot. Entering it pauses the world as every beat does, so it cannot expire while open. *Why:* without an expiry, an ignored pill would block every rung gift, milestone and introduction behind it (`BEAT_MAX_PENDING` 1); a day boundary makes the footer *"They pass when the day turns"* literally true.
4a. **How often the player sees it (PC-5).** At most one pill at a time: the beat slot holds one pending beat, so offerings never stack; a new offering replaces a passed one in the same pill. A player who ignores it sees the pill's three cards change about once a day, with no toast, no chronicle line and no interrupt. A passed offering writes only a trace. *Why:* a daily "you let them pass" line would be the noise PC-5 names.
5. **Spending lives in its own ledger.** `GameState.offeringSpentBySphere` rises when a card is taken up. The spendable balance is earned minus spent, per sphere. `essenceEarnedBySphere` is never written, so taking up a card never lowers the god's attunement or its rung. *Why:* the earned counter feeds the attunement marks (THR-1765); decrementing it would make buying un-grow the god.
6. **The rung reads the sum of marks over the bought spheres.** `rungMarks = Σ getAttunementMarksCrossed(state, s)` over spheres with points in `godSpherePoints`; rung n is open when `rungMarks ≥ PROGRESSION_RUNG_MARKS[n-1]`, and rung 1 opens when the opening spine ends. That is the THR-1794 model's `marks()` (`proto-card-tiers-1794.mjs:156`). The open rung is stored, so it never closes.
7. **Rung gifts queue and wait their turn.** A rung opening is a beat that gives the rung's first key; the rest follow one per `RUNG_GIFT_SPACING` (36 ticks) through the same offer-or-skip helper the milestones use, so a held card is never offered (THR-647). A rung gift outranks an offering for an empty slot (it is checked in the progression phase, before the director). Order inside rung 2: the secondary signature, then Bestow, Shift Dominion, Strengthen Thread, Attune Thread (table order).
8. **The engine word is *offering*, and the screen does not say "omen".** "Omen" already names an omen track (UL `Encounters.md:383`), a card and a panel. The beat's title reads *"Three powers stir"*; the code and the glossary say *offering*. The UL proposal is filed: [UL-proposal: Offering, Rung and Key card](https://linear.app/threadbare/issue/THR-1838/ul-proposal-offering-rung-and-key-card-how-a-god-takes-up-its-cards), with the *Omen* and *Within reach* collisions noted. *Rejected:* "Three omens rise", the THR-1770 mock's title, because a player who has just met the Omens panel would read these as warnings.
9. **The price is a phrase that says who pays.** *Paid from Spirit* = the card's own sphere covers it. *From Life, at double* = only the primary at double price covers it. *Beyond you yet* = neither. No number on screen (Law 13); the sphere words carry their existing `sphere.*` tooltips. *Why:* the THR-1770 mock's *within reach* is already the Codex's word for "you may be offered this" (`codexRunState.ts:35-39`), so a card could read *Within reach* in the Codex and *Beyond you yet* here (PC-6); and its *a stretch* did not say the card costs double.
10. **A small `flags` list rides the block.** THR-1794's table carries review flags (`whispers`, `consecration`, `merge`, `ruins`, `flows`, `faction`, `signature`) that a later deletion pass filters on (audit §5.2). With the table gone, they need a home on the card. `flags` is optional and read by nothing in the game; the gate and the iteration script print it.
11. **Data sits inline on each template.** Christian asked for "metadata on the actions". Each card carries its own `progression` block; there is no side table. The ported iteration script reads the templates directly (THR-1794 §6).

## Engine pillar

### Systems design

**E1 — the schema** (`src/types/unifiedAction.ts`, additive):

```ts
/** THR-1811 (decided THR-1794) — where a god card sits on the run's ladder and how a god comes to hold it. */
export interface CardProgression {
  /** Rung (1–4) from which the card can be offered or gifted. Not rarityTier. */
  readonly tier: 1 | 2 | 3 | 4;
  /** 'market' = the world may offer it for a price; 'gift' = it arrives only by a beat. */
  readonly offer: 'market' | 'gift';
  /** For a gift: the beat that gives it. 'rung' = the rung beats read this field; 'signature' = the grantsReachSignature path. */
  readonly giftBy?: 'spine' | 'milestone' | 'rung' | 'signature';
  /** true = the same card for every god: no identity weighting, priced in the god's primary. */
  readonly generic: boolean;
  /** Sphere whose earned essence pays. Defaults to sphereAffinity. Required on a sphereless, non-generic market card. */
  readonly pricedIn?: SphereName;
  /** Scales how often the card is offered. Default 1. */
  readonly offerWeight?: number;
  /** Review flags for content passes (e.g. 'merge', 'whispers'). Read by no game system. */
  readonly flags?: readonly string[];
}
// on UnifiedActionTemplate:
readonly progression?: CardProgression;
```

`rarityTier`'s doc comment drops "and TB-100 unlock system" (THR-1794 §1).

**E2 — `src/engine/godProgression.ts` (new, pure).** Every function takes state and returns values; none writes.

| Function | Returns |
|---|---|
| `rungMarks(state)` | Σ `getAttunementMarksCrossed(state, s)` over bought spheres |
| `rungForMarks(marks, spineDone)` | 0 before the spine ends; else the count of `PROGRESSION_RUNG_MARKS` entries ≤ marks |
| `offerableCards(state, rung)` | god cards with `progression.offer === 'market'`, `tier ≤ rung`, not in `unlockedActionIds`, passing `isWithinGodReaches(template, state)`, and, only when `OFFERING_IN_SPHERE_ONLY` is on, sphereless or in the god's primary or secondary sphere |
| `isWithinGodReaches(template, state)` | the drawer's reach gate, extracted from `targetActions.ts:444-455` into one exported predicate that `getTargetActionSlots` also calls; drawer behaviour unchanged |
| `offeringWeight(template, state, rung)` | identity weight × `FRESH_RUNG_WEIGHT` if `tier === rung` × `offerWeight` (generic cards take identity weight 1) |
| `priceOf(template, state)` | `round(PRICE_BY_TIER[tier] × (1 + OFFERING_PRICE_ESCALATION × boughtAtTier))` |
| `payment(template, state)` | `{ sphere, amount, word }`: own sphere if its balance covers the price (*Paid from {sphere}*); else the primary at `OFF_SPHERE_PRICE_MULT` × price if that covers it (*From {primary}, at double*); else `null` (*Beyond you yet*). A generic card's own sphere is the primary |
| `spendable(state, sphere)` | `essenceEarnedBySphere[s] − offeringSpentBySphere[s]`, floored at 0 |
| `rungGiftsFor(rung)` | the rung's `giftBy: 'rung'` cards in table order; rung 2 is prefixed by the secondary signature |

Identity weight reuses the Director's bias rule (`computeIdentityBias`, `ascendantBeat.ts:170`): a reach factor from the card's `reach` and a sphere factor from `pricedIn` against the god's primary and secondary. It is applied through a small adapter that builds the `{ reach, sphere }` descriptor from the template, not by changing `computeIdentityBias`.

**E3 — rungs** (`phaseAscendantProgression.ts`). Each tick: compute `rungForMarks`; when it exceeds `godProgression.rung`, record the new rung and its tick, append `rungGiftsFor(n)` to `godProgression.rungGiftQueue`, and emit `progression.rung_opened`. Rung 1 has no gifts; its opening is silent except for the trace, and it is the first offering that shows it. When the slot is free and `turn ≥ nextRungGiftTick`, pop the queue head through `offerOrSkipGrantMilestone`'s sibling `offerOrSkipRungGift` (kind `rung_gift`, beat id `beat.rung.<n>.<cardId>`), set `nextRungGiftTick = turn + RUNG_GIFT_SPACING`. A held card is skipped and the next one taken at once.

**E4 — the offering** (`phaseAscendantBeatDirector`, step 3). The cadence draw's pool gains one synthetic beat, `beat.offering`, kind `offering`, eligible when rung ≥ 1 and `offerableCards` has at least `OFFERING_MIN_CANDIDATES` (1). When drawn, the Director draws up to `OFFERING_SIZE` (3) distinct cards by `offeringWeight` with the cadence `rng`, and offers a `PendingBeat` with `offeredActionIds` (new optional field) and `expiresTurn` = the first multiple of `TICKS_PER_DAY` that is at least `turn + OFFERING_MIN_TTL_TICKS`. Step 1 of the Director gains one check before the pending return: an `offering` pending past `expiresTurn` is recorded as passed and cleared.

**E5 — taking one up** (`resolvePendingBeat`). For an `offering`, `chosenActionId` must be one of `offeredActionIds` and `payment()` must be non-null at resolve time. Then: add `amount` to `offeringSpentBySphere[sphere]`, increment `offeringBoughtByTier[tier]`, add the card to `unlockedActionIds`, record `{ outcome: 'taken', grantedActionIds: [id] }`, emit `action.unlock.granted` with `via: 'offering'` and `offering.taken`. *Let them pass* resolves with no choice: outcome `passed`, `offering.passed`. A choice that fails either check resolves as passed and traces why (never throws).

**E6 — retirements.** Remove the ten investment and two selection beats and `beat.pool.invest.reach_signature` from `ASCENDANT_BEAT_POOL`. Keep their definitions reachable by id for `history` lookups (a `RETIRED_POOL_BEATS` list the debug panel and `getBeatDefinition` still resolve). `collectGrantedActionIds` (`ascendant-beat-content.ts:686`) gains the rung gifts so the bucket and unreachable-action tests still see every card's source.

### Graph nodes / edges

None. Everything is GameState and template data.

### Tick phases

Unchanged order. Rung detection and rung gifts run inside `phaseAscendantProgression` (before the Director, so a rung gift wins an empty slot). Offerings run inside `phaseAscendantBeatDirector`'s cadence step. No new phase.

### Resolution logic

Offer draw: weighted without replacement, `OFFERING_SIZE` picks, weights from `offeringWeight`. Price: `PRICE_BY_TIER[tier] × (1 + 0.1 × boughtAtTier)`, rounded. Payment: own sphere first, primary at ×2 second. No roll at take-up.

### PRNG callouts

The offer draw uses the Director's seeded `rng` (the one the cadence jitter already uses), called a fixed number of times per offering (one per pick). No `Math.random`. Rung detection and pricing use no randomness. Same seed and same player choices give the same offerings.

## Content pillar

### Data tables

- **143 `progression` blocks**, copied from `scripts/proto-card-tiers-1794.tsv` on `proto/thr-1794-card-tiers` (measured distribution: 93 market, 50 gift; gifts 13 spine, 20 milestone, 9 rung, 8 signature; 32 generic; tiers 44 / 60 / 28 / 11). The `flag` column becomes `flags`. The `why` column does not move (the audit appendix keeps it).
- **`src/data/god-progression-content.ts`** (new): every constant below, plus the rung beat words and the offering words.

### Beat content

Four rung beats (rung 2, 3, 4 each open with a gift; rung 1 has none) and one rung-gift beat for each later key. Each rung beat names the god's growth, not a number. Representative rendered text, god primary Life:

| Beat | Title | Body |
|---|---|---|
| Rung 2 opens | *Your hand is felt* | "What you have drawn through Life has changed you. The world answers a hand now, not a touch: it will offer you deeper works, and it gives you this one freely." + the card |
| Rung 3 opens | *Your will is known* | "Peoples and banners turn toward you. The world will offer works that move regions and orders, and it gives you this." |
| Rung 4 opens | *The world braces* | "You have grown into something the world must reckon with. Its greatest works will be offered to you now, and it gives you this." |
| A later key | *A further gift* | "Your growth opens another way to work: {card name}." |

The rung words *touch / hand / will / wonder* stay in prose only; the screen never shows a rung number or a tier number (THR-1794 §8).

### Offering content

One `UnifiedActionTemplate` for the beat surface, `beat.offering`, in `ascendant-pool-beat-templates.ts` (the same no-op shape as the introduction beats there). Its prose is the offering modal's words below.

### Encounter templates / attachment content

N/A — no encounter or attachment changes; the offering is a beat, and cards keep their own content.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces; the pill and the beat modal are DOM).*

### Player-facing display

- **The pill.** An offering waits as the existing `AscendantBeatOfferBanner`, worded *"Three powers stir"*. It never opens itself (THR-1805, pool beats keep their pill).
- **The modal.** The existing `AscendantBeatModal` in its selection layout: three `CardFace`s with their sphere tint and rarity treatment unchanged (Christian's standing preference), each with its price word under it and a *Take it up* button. A card whose price word is *beyond you yet* shows its button disabled with the reason (Law 25). *Let them pass* closes it as passed.
- **Rung beats and rung gifts.** The existing milestone presentation: title, body, the gifted card's face.
- **Codex.** Unchanged. Its *Within reach* badge (`codexRunState.ts:35-39`) keeps meaning "you may yet hold this"; the offering's price phrases avoid that word (§ Decided 9).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Offer pill | "Three powers stir" | PC-5, PC-7 | The pill is the existing "a beat waits" affordance; one at a time, never stacked (§ Decided 4a). Tooltip (`ui.offering`): "Each day the world offers you three works. Take one up with essence you have earned, or let them pass. They pass when the day turns." |
| Modal heading | "Three powers stir. Take up one, or let them pass." | PC-4 | Nothing is taken for the player; the choice is explicit, and passing is a button |
| Price phrase (own sphere) | "Paid from Spirit" | PC-1, PC-6 | Tooltip (`ui.offering.paid_from`): "You have earned enough through this sphere to take it up. Earned essence is what flowed into a sphere when you spent; your casting pool is untouched." The sphere word carries its `sphere.spirit` tooltip |
| Price phrase (primary at double) | "From Life, at double" | PC-1, PC-6 | Tooltip (`ui.offering.at_double`): "You have not earned enough through this card's sphere. You can pay from what you earned through your first sphere, at double the price." |
| Price word (neither) | "Beyond you yet" | PC-1, PC-8 | Disabled button reads "Not yet"; tooltip (`ui.offering.beyond`): "You have not earned enough yet. Spend through your spheres and you will." |
| Expiry footer | "They pass when the day turns." | PC-4 | True to the mechanic: expiry is a day boundary (§ Decided 4). A passed offering writes no chronicle line (§ Decided 4a) |
| Chronicle, taken | "You took up Cultivate." | PC-8 | The paid choice answers at once: the card is in the drawer and in the chronicle |
| Rung beat | e.g. "Your hand is felt" + body above | PC-1 | Growth is named in the god's own terms; no numbers |

### Playtest signal

A tester who has played past day 10 can say where their newest power came from and what they paid for it, and two testers with different gods name different cards among their first five taken up.

### Event notifications

Chronicle lines only (above). No toast, no interrupt: the pill is the affordance (Law 39 at its existing pool-beat tier; PC-5).

### Debug inspection (DebugPanel)

`window.__DEBUG.getGodProgression()` (async, in `src/debug-bridge.d.ts`): `{ rung, rungMarks, rungOpenedTick, rungGiftQueue, nextRungGiftTick, spendableBySphere, spentBySphere, boughtByTier, pendingOffering: { cardIds, prices, words, expiresTurn } | null }`. `window.__DEBUG.forceOffering()` draws an offering now (debug path, `via: 'debug'`). DebugPanel gains a *Progression* readout on its beats tab with the same fields.

### Visual presence (HexMapV2)

N/A — nothing on the map changes.

### UI Laws engaged

1 / 17 (every concept word has a registry tooltip: three new `ui.offering.*` ids plus `ui.offering`), 13 (no number: price and rung are words), 21 (each card name routes to its Codex entry, as on every card face), 25 (a disabled button says why), 26–27 (no new component: the banner, the modal's selection layout and `CardFace`), 30 (sphere tint through tokens), 33 (the modal stays inside 85vh at 1920×1080 with three cards), 37 (not engaged: no multi-step encounter), 39 (pool-beat tier: a pill, no interrupt), 42 (plain register).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `godProgression.ts` (reads) | called by the two below | `AscendantBeatModal` (price words) | reads `essenceEarnedBySphere`, `offeringSpentBySphere`, `unlockedActionIds` | — | `getGodProgression` |
| Rungs | `phaseAscendantProgression` | milestone beat surface | `godProgression` (new) | `progression.rung_opened`, `progression.rung_gift_offered` | DebugPanel beats tab |
| Offering | `phaseAscendantBeatDirector` (cadence) | `AscendantBeatOfferBanner`, `AscendantBeatModal` | `ascendantBeats.pending` (+ `offeredActionIds`, `expiresTurn`) | `offering.offered`, `offering.passed` (`reason: 'expired'`) | `getGodProgression().pendingOffering` |
| Take up / pass | `resolvePendingBeat` (player act) | modal buttons | `offeringSpentBySphere`, `offeringBoughtByTier`, `unlockedActionIds` | `offering.taken`, `offering.passed`, `action.unlock.granted` (`via: 'offering' \| 'rung'`) | traces tab |
| Chronicle line "You took up {card}." | `resolvePendingBeat`, offering branch, pushes one `chronicle`-tier entry (the shape milestone beats push in `phaseAscendantProgression.ts`); passing writes none | Chronicle panel | `chronicle` | `offering.taken` | chronicle |
| Gate | — (content check) | — | — | — | `npm run check:god-card-progression` |

## Interface impact

*Ascendant Beats* is listed under § Unaudited subsystems (audit-on-touch); this plan writes its rows. Producer system name as in `scripts/interface-contracts.ts:137` (`'Ascendant Beats & Progression'`).

| Contract row (new unless stated) | Producer → consumer | Disposition |
|---|---|---|
| `offering-take-up-unlocks-card` | Ascendant Beats & Progression → the drawer (`unlockedActionIds`, read by `isActionRevealed`) | **add** — read site `actionUnlock.ts:27-34`; written through `resolvePendingBeat`, the existing grant path |
| `rung-gift-unlocks-key` | Ascendant Beats & Progression → the drawer | **add** — same read site |
| `rung-reads-attunement-marks` | Spheres & Quintessence (`essenceEarnedBySphere`, `getAttunementMarksCrossed`) → Ascendant Beats & Progression | **add** — read only; spending writes `offeringSpentBySphere`, never the earned counter |
| `offering-respects-reach-gate` | target action slots (`isWithinGodReaches`) → Ascendant Beats & Progression | **add** — one predicate, two readers |
| Pool investment / selection beats → cards | Ascendant Beats & Progression → the drawer | **retire** — the grant-bearing pool beats leave the draw |

`scripts/interface-contracts.ts` and `Docs/canon/interface-map.md` gain the four rows; *Ascendant Beats* leaves the unaudited list.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `PROGRESSION_RUNG_MARKS` | `[0, 3, 6, 8]` | Marks (summed over bought spheres) at which rungs 1–4 open (THR-1794) |
| `PRICE_BY_TIER` | `{1: 20, 2: 40, 3: 80, 4: 120}` | Base price in earned essence (THR-1794) |
| `OFFERING_PRICE_ESCALATION` | `0.1` | Each card already taken up at a tier raises that tier's price by this share (THR-1794: counted per tier) |
| `OFF_SPHERE_PRICE_MULT` | `2` | Paying from the primary instead of the card's sphere (THR-1794) |
| `OFFERING_SIZE` | `3` | Cards per offering (Christian's B) |
| `OFFERING_TAKE_LIMIT` | `1` | Cards that may be taken up per offering (Christian's B) |
| `OFFERING_BEAT_WEIGHT` | `8` | The offering's kind weight in the cadence draw (§ Decided 2) |
| `OFFERING_MIN_CANDIDATES` | `1` | Fewest offerable cards for an offering to be eligible |
| `OFFERING_MIN_TTL_TICKS` | `6` | An offering stands at least this long; it passes at the first day boundary after (§ Decided 4) |
| `OFFERING_IN_SPHERE_ONLY` | `false` | When on, the offering draws only sphereless cards and cards in the god's primary or secondary (measured: 0.03 vs 0.38 shared first-five buys) |
| `FRESH_RUNG_WEIGHT` | `1.5` | The newest open rung's cards are offered a little more often (THR-1794) |
| `RUNG_GIFT_SPACING` | `36` | Ticks between a rung's key gifts (THR-1794) |
| `SECONDARY_SIGNATURE_RUNG` | `2` | Rung whose first gift is the secondary reach signature (THR-1794) |

## Tracing

```ts
// progression.rung_opened — the god's summed marks crossed a rung threshold
interface ProgressionRungOpenedTrace { category: 'progression.rung_opened'; tick: number; rung: 1 | 2 | 3 | 4; rungMarks: number; queuedGiftIds: string[]; }
// progression.rung_gift_offered — a key gift took the slot, or was skipped as held
interface ProgressionRungGiftOfferedTrace { category: 'progression.rung_gift_offered'; tick: number; rung: number; actionId: string; skipped?: 'held'; }
// offering.offered — an offering took the slot
interface OfferingOfferedTrace { category: 'offering.offered'; tick: number; rung: number; candidateCount: number; offered: { actionId: string; tier: number; weight: number; price: number; paySphere: SphereName | null; word: 'paid_from' | 'at_double' | 'beyond' }[]; expiresTurn: number; }
// offering.taken — the player took one up and paid
interface OfferingTakenTrace { category: 'offering.taken'; tick: number; actionId: string; tier: number; price: number; paidFrom: SphereName; offSphere: boolean; spendableAfter: number; }
// offering.passed — let pass by the player, expired, or a choice that failed its checks
interface OfferingPassedTrace { category: 'offering.passed'; tick: number; reason: 'let_pass' | 'expired' | 'not_offered' | 'unaffordable'; offeredIds: string[]; }
```

`ActionUnlockGrantedTrace.via` widens to `'beat' | 'debug' | 'offering' | 'rung'`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A god card has no `progression` block at runtime | Not offered, not gifted; the gate fails the build, so this only reaches a dev build |
| `getAttunementMarksCrossed` throws or the god has no bought spheres | `rungMarks` 0: rung 1 only after the spine; trace once |
| Fewer offerable cards than `OFFERING_SIZE` | Offer what there is (≥ `OFFERING_MIN_CANDIDATES`); none → the offering is ineligible and the draw takes another beat |
| The chosen card is not among the offered ids, or no longer affordable | Resolve as passed with `reason`; no essence moves |
| An old save has a retired pool beat pending | It resolves as before through `RETIRED_POOL_BEATS` |
| An old save has no `godProgression` / `offeringSpentBySphere` | Treated as empty; rungs re-detect from the marks on the next tick (a rung already passed opens at once and its gifts queue; held cards are skipped) |
| A rung-gift card id no longer exists | Skipped with a trace; the queue moves on |
| `essenceEarnedBySphere` missing | Spendable 0; every price word reads *beyond you yet* |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 651 | One optional field and one exported interface; additive, no existing reader changes |
| `src/types/gameState.ts` | 720 | Three optional fields (`godProgression`, `offeringSpentBySphere`, `offeringBoughtByTier`); additive |
| `src/data/unified-action-templates.ts` | 176 | 135 inline `progression` blocks; data only. Merge-conflict risk with any concurrent card edit (§ Coordination) |
| `src/types/trace.ts` | 127 | Five trace types and one widened union member; additive |

Counted with `grep -rl "<module path>'" src scripts | wc -l` on the worktree.

## Deferrals

None filed by this plan. Out of scope and owned elsewhere: merging the flagged cards (a content pass reading `flags`), authoring cards for the sphere × tier holes (the gate warns), whether Dominion bands move the buy price (THR-1794 §10 left it to the core, which did not take it up; it is a fresh question if a playtest asks for it).

## Three-pillar check

- [x] Engine pillar present (E1–E6)
- [x] Content pillar present (143 blocks, rung and offering words)
- [x] UI pillar present (pill, modal, price words, debug)
- [x] Wiring section connects them

## Vision audit

- [x] **Distinct gods.** The offering keeps each god's hand its own: 0.38 / 0.52 shared in the first five buys (THR-1794), against 3.77 today, and 0.03 / 0.05 behind one switch if a playtest wants more.
- [x] **Prose carries mechanics.** Tier and rung never show as numbers; price is a word; growth is named in rung beats.
- [x] **Attention is the spend.** Only essence earned by spending pays; a hoarding god earns nothing to buy with (THR-1770 §1).
- [x] **Sphere-tinted cards are loved.** Card faces unchanged.
- Vision files (vault `Vision/`): `00-north-star.md` (cards dealt from the repertoire their kind of god has earned; attention is the spend), `02-non-negotiables.md` #1–#3 (the god acts through interventions; narrative first; prose, not numbers), `03-design-tensions.md` #4 (legibility vs mystery: the screen never says *buy*, *tier* or *price*; *fit* and *optimiser* are model players only), `taste-profile.md` (prose-first UI, real time that halts). The offering is a god-side beat that never interrupts the simmer (Decided 4a).

## Rulebook impact

- [x] This plan changes a rule of play (how a god acquires powers). `Docs/canon/rulebook.md` is updated in the build PR:
  - §4 *Your two reach signatures*: the secondary signature arrives "when your growth opens the world's deeper works" (rung 2), IMPL tag to `godProgression.ts`.
  - §4 *How your power grows*, Breadth: replace the pool-beat sentence with *"Most of your powers you take up from what the world offers: each day three works stir, drawn to who you are, and you take up one with essence you have earned through its sphere, or let them pass. As your attunement grows, the world offers deeper works and gives you the keys to them."*
  - `rulebook-quick-reference.md` gains the same in one sentence.
- [x] No other rule of play changes: the five verbs, prerequisites, essence pools, encounters and clocks are untouched.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Thirteen named constants; the ladder is data on each card |
| 2. Inspectability | PASS | Five trace types; `getGodProgression`; the DebugPanel readout; offered weights and prices in the trace |
| 3. Determinism | PASS | Seeded Director `rng`, fixed call count per offering; everything else pure |
| 4. Fail-soft | PASS | Table above; every resolve failure becomes *passed* with a reason |
| 5. Narrative over mechanical perfection | PASS with note | The rung words and beat prose carry growth; the offering may lose a cadence draw to a story beat (§ Decided 2), story first |
| 6. Additive over destructive | PASS with note | All fields optional; the retired pool beats stay resolvable by id. The pool draw loses twelve beats, which is the decided change, not a refactor |
| 7. Performance budget | PASS | One filter over ≤143 templates per cadence draw (~every 9 ticks); rung check is a 9-element count per bought sphere per tick |

## Done when

- [ ] Every ascendant-castable template carries a `progression` block matching the THR-1794 table (with `flags`), and `npm run check:god-card-progression` exits 0 with its sphere × tier hole warnings printed.
- [ ] The gate fails when a template loses its block, a spine or milestone grant list disagrees with `giftBy`, or a non-generic market card has no price sphere (a test drives each failure).
- [ ] On `npm run cli -- --seed 42 --map medium`, after the spine, `tick` past the first rung: `getGodProgression().rung >= 1` and an `offering.offered` trace lists three cards, every one of which passes `isWithinGodReaches` and is a `market` card at or below the open rung.
- [ ] A taken-up card appears in `unlockedActionIds` and in the drawer for a valid target; `essenceEarnedBySphere` is unchanged by the purchase and `offeringSpentBySphere` rose by the traced price.
- [ ] An offering left alone is recorded passed at the first day boundary at least `OFFERING_MIN_TTL_TICKS` after it rose, writes no chronicle line, and the next cadence draw can offer again; with `OFFERING_IN_SPHERE_ONLY` on, every offered card is sphereless or in the god's two spheres (a test).
- [ ] Crossing three summed marks opens rung 2: the secondary signature is the next gift, then Bestow, Shift Dominion, Strengthen Thread and Attune Thread, `RUNG_GIFT_SPACING` apart, none offered if held.
- [ ] No grant-bearing pool beat is drawn in a 2,000-tick headless run on seeds 42 / 99 / 7.
- [ ] The ported iteration script reads the templates and reproduces the THR-1794 table's counts (93 market / 50 gift / 32 generic).
- [ ] Browser (Playwright, 1920×1080, `?view=game&seeded&size=medium`): the pill reads "Three powers stir"; the modal shows three tinted card faces with price words; `await window.__DEBUG.getGodProgression()` matches the modal; console clean; UI-Laws line for 1, 13, 17, 21, 25, 33, 37, 39.
- [ ] Rulebook §4 and the quick reference carry the new text; the glossary carries the entries from [UL-proposal: Offering, Rung and Key card](https://linear.app/threadbare/issue/THR-1838/ul-proposal-offering-rung-and-key-card-how-a-god-takes-up-its-cards).
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` and a 30-tick CLI smoke pass.

## Kill criteria

- **Offerings starve.** If, across seeds 42 / 99 / 7 headless to day 45, fewer than 60% of cadence beats after the spine are offerings, raise `OFFERING_BEAT_WEIGHT`; if introductions or deliveries then vanish, the shared cadence (§ Decided 2) was wrong and the offering gets its own interval.
- **The secondary sphere strands.** If the scripted Shepherd ends day 90 holding fewer than 40 cards with `OFFERING_IN_SPHERE_ONLY` off (the default), the off-sphere rule is too narrow and `OFF_SPHERE_PRICE_MULT` is the lever.
- **Players read the offering as a shop.** If a cold playtester describes it as "a shop" or "buying", the beat prose failed and is rewritten; the mechanics stand.

## Coordination block

**Suggested model:** opus — five engine touch points, a data pass over 143 cards across several files, and a content gate.

**Parallel-safe with:** none on the Ready for Dev shelf (both items below collide).

**Mutex with:**
- [The god's screen fills one gift at a time](https://linear.app/threadbare/issue/THR-1837) — both edit `src/data/ascendant-beat-content.ts` (its beat texts; this plan's pool retirements) and the beat surfaces in `GameView.tsx`.
- [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750) — both edit `src/engine/targetActions.ts` (its band on the slot; this plan's extracted reach predicate) and `src/debug-bridge.ts` / `.d.ts`.

**Files to touch:**
- Create: `src/engine/godProgression.ts`, `src/data/god-progression-content.ts`, `scripts/check-god-card-progression.ts`, `scripts/god-card-progression-model.mjs` (the port), tests beside each.
- Edit: `src/types/unifiedAction.ts` (schema), `src/types/gameState.ts` (three fields), `src/types/ascendantBeat.ts` (`offering` and `rung_gift` kinds, two `PendingBeat` fields), `src/types/trace.ts`, `src/data/unified-action-templates.ts` + `reach-signature-content.ts` + the other god-card sources (blocks), `src/data/ascendant-beat-content.ts` (retirements, `collectGrantedActionIds`), `src/data/ascendant-pool-beat-templates.ts` (`beat.offering`), `src/engine/ascendantBeat.ts` (director step, resolve), `src/engine/phaseAscendantProgression.ts` (rungs), `src/engine/targetActions.ts` (extract the predicate), `src/components/Game/AscendantBeatModal.tsx` (price words, buttons), the tooltip registry, `src/debug-bridge.ts` + `.d.ts`, DebugPanel beats tab, `package.json`, `scripts/gate.ts`, `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`.

## Notes for the executor

- **Do not reuse `rarityTier`.** It has 30+ readers (THR-1794 §1).
- **Check the catalog before copying the table:** dump it with the THR-1794 dumper (`scripts/proto-card-catalog-1794.ts` on the proto branch) and diff its ids against the TSV. A card added or removed since 2026-10-11 needs a row decided (or removed) and named in the PR body.
- **The spend ledger is the only new balance.** Never write `essenceEarnedBySphere` from this code.
- **Extract, do not copy, the reach predicate.** Two copies of the reach gate would drift; `getTargetActionSlots` must call the same function, and the drawer's behaviour must not change (its sphere gate keeps counting without hiding).
- **The THR-1794 model has a dead `FIT_PLAYER_SKIPS_BELOW`.** It is a player model, not a rule; the port keeps it as a model flag only.
- **The Beat 4 Dream / Omen / Inspire choice is untouched**, including a Life god choosing Dream (Mind), which the drawer shows and charges from the Mind pool today.

## Intent-judge verdict

**Round 1 — Revise** (opus, cold, ~150 s). Dimension 11 VIOLATION: the first draft said the drawer hides off-sphere cards; `targetActions.ts:458-465` only counts them. Dimension 12 GAPs: the pill's frequency (PC-5) was unanswered, the expiry footer did not match a 12-tick expiry, and *Within reach* collided with the Codex badge (PC-6). Dimension 6 GAP: the UL proposal was not yet filed. All six actions were applied: Decided 1 reverted to THR-1794's open offer with a default-off switch, Decided 2 and 4a, day-boundary expiry, renamed price phrases, [THR-1838](https://linear.app/threadbare/issue/THR-1838/ul-proposal-offering-rung-and-key-card-how-a-god-takes-up-its-cards) filed, and a chronicle wiring row.

**Round 2 — Allow** (~90 s). Every dimension PASS. Four cleanups applied (trace word names, rung 4 wording, proposal UL line, kill-criterion wording). The judge asked that the two departures from the ruling's wording (*offering* for *omen*, *each day* for *every few days*) appear as veto lines in the handoff.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-13 (three sonnet auditors, independent)*

### NFP audit

PASS-with-notes. Tunability PASS (13 constants; the ladder is per-card data; one-switch lever). Inspectability PASS-with-note: the Wiring table named `offering.expired`, while Tracing defines expiry as `offering.passed` with `reason: 'expired'` — **fixed** in the Wiring table. Determinism PASS (seeded Director rng, fixed call count; day-boundary expiry). Fail-soft PASS (8 rows; every resolve failure becomes passed with a reason). Narrative PASS-with-note (an offering may lose a cadence draw to a story beat; story first). Additive PASS-with-note (all fields optional; twelve pool beats retired as the decided change, ids still resolvable). Performance PASS.

### Three-pillar audit

PASS. Engine, Content and UI present and substantive; Wiring maps every module to phase, component, field, trace and debug surface. Substrate inventory present; extends Ascendant Beats & Progression (phases 1.7 and 1.75) and action unlocks; no existing offering or rung subsystem is duplicated. Note: the Dominion marks are read-only here.

### Vision audit

PASS-with-notes. No contradictions. Premises touched: north star (a repertoire earned by the kind of god; attention is the spend), core loop (time stops for moments; the pill never opens itself), non-negotiables #1–#3, design tension #4, taste profile. Notes: (1) the plan cited no Vision file by path — **fixed** in § Vision audit; (2) an offering roughly every 10–15 real seconds could crowd the simmer — answered by Decided 4a (one pill, no toast, no interrupt, no chronicle line on pass) and the kill criteria; (3) model vocabulary (fit / optimiser, buy, tier, price) leans toward legibility — none of it reaches the screen, and the "reads as a shop" kill criterion watches the drift.
