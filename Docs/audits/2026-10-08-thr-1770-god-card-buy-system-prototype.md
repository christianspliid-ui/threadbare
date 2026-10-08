> **Prototype audit for THR-1770** (wayfinder map THR-1758, project Dominion — Player Power Progression). Design lane run 2026-10-08a, unattended. Inputs: the THR-1769 card inventory (`Docs/audits/2026-10-06-thr-1769-god-card-grant-inventory-research.md`), the THR-1767 power model (`scripts/power-progression-model.mjs`), the THR-1747 economy retune. The model is prototype code on the never-merged branch `proto/thr-1770-card-buy` (`scripts/proto-card-buy-model.mjs`); the mock is `Docs/audits/2026-10-08-thr-1770-buy-mock/market-mock.html`.

# THR-1770 — can a god buy its cards? Six shapes, two gods, one run

Ground truth: `main` @ `b20e5003`, 2026-10-08. Catalog enumerated by an esbuild bundle of `src/data/unified-action-templates.ts` filtered to `actorAffinities ∋ 'ascendant'` (143 cards, same count as THR-1769). Every number below re-runs with:

```
node scripts/proto-card-buy-model.mjs --catalog catalog.json                      # "fit" player
node scripts/proto-card-buy-model.mjs --catalog catalog.json --player optimiser   # "optimiser" player
```

## Verdict in one paragraph

**Today's grants are the cookie cutter, not the buy.** Under the THR-1747 rules the Shepherd and the showcase god share **3.8 of their first five** post-spine cards (400 seeds), because the investment beats hand every god the same consecrate / bestow / anoint set. A **pure shop** fixes that only for a player who shops for identity: an optimising player buys the **same five engine cards in the same order** for both gods (5 of 5 shared). Two shapes give each god its own hand **whatever the player optimises**: **S1**, story grants kept but drawn by the god's identity (0.53 shared, today's pacing, no buy), and **H3**, the cadence pool turned into a three-card market priced in essence earned (0.49–0.61 shared). The **currency question is settled**: priced in the casting pool, a buy empties every starting pool on tick 0 (22–24 cards at once); priced in **essence earned** it cannot starve casting by construction and pays only a god that keeps spending. **The remaining pick — S1 (the world gives, by who you are) or H3 (the world offers, you choose and pay) — is whether the player chooses their powers at all.** That is the rulebook §4 doctrine, *"story moments, not from a menu"*, and nothing agreed decides it, so it is **reserved for Christian**.

## 1. The shop

**Kept as story moments in every shape (24 cards).** Why each stays:

| Cards | Why they stay story-granted |
|---|---|
| Spine: Thread a mortal, Observe, Thread a place, Imbue, Persuade, + one of Dream / Omen / Inspire | The opening teaches the verbs in order; a shop on turn 0 floods the drawer (THR-613 §5.B, superseded but measured) and P1 below shows what a turn-0 shop does |
| Primary reach signature (Beat 4) | Rulebook §4 names it *the culmination of the opening spine* — moving it is the doctrine change itself |
| The Wellspring's five source verbs | THR-1747 made it a milestone at bond + 48 ticks; it is the economy's on-ramp, not a want |
| The eleven world-event milestone cards (markets / harvest / blight / vein / caravan / mine, Draw Together, Bless Company, Reunite / Sunder, Rekindle) | Each is *earned by something the world did* (three sources, two living threads, a company formed or broken, a thread Broken). They are already the story-moment grants at their best; a price would double-charge them |

**The shop is the other 113 cards per god** (143 − 24 kept − the 6 signatures outside the god's three reaches; the secondary signature is in the shop). The other six signatures stay hidden by the reach gate, as the Codex already shows them (*Another life*).

**Price (proposed, all named constants on the proto branch):** `BUY_PRICE_PER_ESSENCE_COST = 10` × the card's cast cost, floor `BUY_PRICE_FLOOR = 20` → 20–250, mean 64; every card already bought raises the next price by `BUY_PRICE_ESCALATION = 0.1` of base (swept 0 / 0.05 / 0.1 / 0.15: 55 / 32 / 29 / 26 cards bought by day 90 for the Shepherd; 0.1 lands on today's 31-card ceiling).

**Currency — three candidates, one survives:**

| Currency | What the model shows | Verdict |
|---|---|---|
| **P1 — the casting pool** (4 × cost, cap 45 so a pool can ever pay) | Every sphere starts at 50 (`INITIAL_ESSENCE_PER_SPHERE`), so the player spends all ten off-sphere starting pools at **tick 0**: Shepherd 24 cards, showcase 22. Casting lost vs no-buy is small (−32 / −111 essence over 90 days) only because the pool cap (55–80) keeps most later prices out of reach. | **Dead.** A turn-0 flood, then a shop the cap mostly locks |
| **P2 — essence earned** (the THR-1180 counter, spent from a separate balance) | `essenceEarned.ts` banks only *positive pool movement*: a sphere sitting at its cap earns nothing. So buying power comes only from casting through a sphere — a hoarding god earns no buys. Casting spend vs no-buy is **0 at every snapshot**, by construction. | **Survives.** Attention is the spend, and the spend is what pays |
| **Holdings as price** (a Held place, a Champion) | Not modelled numerically: Dominion bands do not exist yet (THR-1760 is blocked on the seeding fix). Reserved as a second price on the five biggest cards (strong thread 25, artifact thread 25, faction thread 20, divine edict 18, plant secret 14) once bands land | Deferred to the Dominion core plan doc |

A finding that holds for any earned-essence price: **the secondary sphere earns almost nothing to buy with.** The scripted player casts 2 secondary essence per 24 ticks, so the secondary pool sits at its cap and banks only **118 Spirit in 90 days** (vs 2,802 Life). Under an earned price the 18 Spirit cards are mostly out of reach unless the player casts through Spirit. That is the intended pressure, but it means a sphereless card priced in the *primary* is the default buy — which is what makes the optimiser's pure shop a cookie cutter (§3).

## 2. The economy (Shepherd, THR-1747 upkeep, scripted player of THR-1767)

Earned essence and casting are identical in every earned-price shape (the buy never touches the pool). What changes is what the balance buys:

| Day | Earned Life (cum.) | Earned Spirit (cum.) | Cast spend (cum.) | Cards held — today (S0) | — pure shop (P2) | — market (H3) | — pool shop (P1) |
|---|---|---|---|---|---|---|---|
| 5 | 40 | 9 | 74 | 14 | 13 | 13 | **36** |
| 10 | 104 | 18 | 155 | 16 | 15 | 15 | 40 |
| 20 | 256 | 28 | 337 | 18 | 17 | 19 | 45 |
| 45 | 913 | 69 | 1,006 | 20 | 28 | 27 | 55 |
| 90 | 2,802 | 118 | 2,910 | 20 | 41 | 40 | 68 |

(Seed 1. "Cards held" includes the 12 story cards held by day 5. Over 400 seeds the Shepherd holds 20.0 cards at day 90 today, 41 under H1/H3, 47 under H2.) The kill path the ticket names — *a god that saves for cards and never spends on mortals* — cannot happen under an earned price: saving does not earn.

## 3. The cookie-cutter test — the first five cards after the spine

Two scripted players: **fit** values a card by engine use + reach fit + sphere fit; **optimiser** values engine use and cheapness only. Shared = how many of the showcase god's first five post-spine cards are also in the Shepherd's first five, mean over 400 seeds (seed 1 for P1/P2, which have no lottery).

| Shape | How cards arrive | Shared, fit player | Shared, optimiser | 5th post-spine card (tick, Shepherd) |
|---|---|---|---|---|
| **S0 Today** | Beat Director gift beats, THR-1747 retirement | **3.77** | **3.77** | 136 |
| **S1 Identity-drawn gifts** | Same beats and pacing; each gift beat draws its cards from the shop weighted by the god's reaches and spheres | **0.53** | **0.53** | 136 |
| P1 Pool shop | Buy anything, priced in the casting pool | 1 | 3 | 0 |
| P2 Earned shop | Buy anything, priced in essence earned | 0 | **5** | 207 |
| H1 Family opens, buy picks | A gift beat opens a family (land, places, favour, sight …); essence earned buys within it | 0.60 | 3.23 | 187 |
| H2 Choose one of two | Each gift beat offers its card and the best orphan; the other is bought later | 0.04 | 4.08 | 99 |
| **H3 Market** | Every ~9 ticks three identity-weighted cards are offered; essence earned buys | **0.49** | **0.61** | 193 |

Side by side, seed 1, optimiser player, pure earned shop (P2) — the cookie cutter Christian asked about:

| # | Shepherd | Showcase |
|---|---|---|
| 1 | 48 · Claim Resource | 48 · Claim Resource |
| 2 | 97 · Tap Source | 97 · Tap Source |
| 3 | 144 · Bestow | 144 · Bestow |
| 4 | 195 · Claim Dominion | 195 · Claim Dominion |
| 5 | 251 · Place of Power | 251 · Place of Power |

Same player, market (H3):

| # | Shepherd | Showcase |
|---|---|---|
| 1 | 49 · Survey | 49 · Deceive |
| 2 | 76 · Reactivate a thread | 67 · Whisper Intuition |
| 3 | 112 · Attune (artifact) | 94 · Dowse Resources |
| 4 | 130 · Dowse Resources | 112 · Listen for a Name |
| 5 | 148 · Let a thread go dormant | 139 · Read the Threads |

And today (S0, seed 1): Consecrate, Consecrate Relic and Anoint sit in both gods' first five; the Shepherd adds Great Work and Bestow, the showcase god the two secrets cards its eye bias pulls forward.

**Reading.** A pure shop is a cookie cutter for anyone who plays to win, because the engine cards are sphereless and cost the same for every god. Identity survives only where *the world chooses what is on offer* (S1, H3). H2 and H1 still let the optimiser converge. So the live options are S1 and H3, and they differ on exactly one thing: does the player pick and pay.

## 4. The surface (H3 mock)

[`market-mock.html`](2026-10-08-thr-1770-buy-mock/market-mock.html): the market is a beat — *Three omens rise* — in the Ascendant Bar's existing beat slot, not a new screen. Each card keeps its sphere tint. The price reads as a three-word ladder against what the god has drawn through that sphere — **within reach / a stretch / beyond you yet** — never a number (Law 13). *Let them pass* is the unchosen path; the Codex keeps its three states (*Yours / Within reach / Another life*, `codexRunState.ts`). Under S1 no new surface is needed: the gift beat already exists.

UI-Laws judgement for the mock: **Law 13** (no raw magnitudes) ✓ — the price is a word ladder. **Laws 1 / 17** (every concept carries image, tooltip, link; every concept word a registry tooltip) ✗ in the static mock — the sphere and reach words and the ladder words need `sphere.*` / `reach.*` / `ui.*` tooltips and card art in any build. **Law 21** (named entities clickable) ✗ in the mock — each card name must route to its Codex entry. Laws 33 / 37 are not engaged (no multi-step encounter). Sphere tint kept (Christian's standing preference). The ✗ rows are build obligations for whichever plan doc ships H3, not defects in the direction.

## 5. What the lane decides, and what it reserves

**Decided by delegation (evidence settles it):**
1. **No shape prices cards in the casting pool.** P1 floods 22–24 cards on tick 0.
2. **Any buy is priced in essence earned through the card's sphere** (the THR-1180 counter, spent from its own balance), never the casting pool — it cannot starve casting, and only a spending god earns.
3. **A pure shop and the two "pick one" hybrids (H1, H2) are ruled out**: an optimising player buys the same cards for every god.
4. **The 24 story cards above stay story-granted in any shape.**
5. **Today's gift beats are themselves a cookie cutter** (3.8 of 5 shared) and must change whichever way the fork goes: either S1 or H3 fixes it.

**Reserved for Christian — the fork:**
- **S1 — the world gives, by who you are.** Gift beats keep their timing and stay free; what they give is drawn from the whole catalog, weighted to the god's reaches and spheres. Rulebook §4 stands as written. No new currency, no new screen. Smallest build.
- **H3 — the world offers, you choose and pay.** Every few days three omens rise; take up one with what you have drawn through its sphere, or let them pass. Rulebook §4 changes from *not from a menu* to *from what the world offers*. Roughly twice the cards over a run (41 vs 20), so prices or the offer rate need tuning to match.

The lane's lean is **H3**, because Christian asked for buying and H3 is the only buy shape that keeps each god distinct under optimal play. It is still not the lane's call: it rewrites a rulebook doctrine about what a power *is* to the player.

## 6. What the model does not cover

- The scripted player buys by a fixed value rule; real players will value cards by fun and fiction. The optimiser is the honest worst case for identity.
- The market's offer weighting reuses the Director's bias with affinities normalised to [0..1] (the raw-scale bug THR-1769 found is not reproduced).
- Milestones beyond the Wellspring are not simulated (world-event dependent), so "cards held" undercounts every shape equally.
- Dominion bands do not exist yet, so a holdings price and band-scaled prices wait on the Dominion core (THR-1748).
- Prices are flat per card; a card's value to a god (its own reach) does not change its price.
