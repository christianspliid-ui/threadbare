> **title:** Every Hunger sphere gets a cheap place card — brainstorm companion (THR-2089)
> **linear_issue:** THR-2089
> **author:** Claude Code (design lane, run 2026-10-30a, unattended)
> **created:** 2026-10-30

# Brainstorm companion — cheap place cards per sphere

Companion to [the plan](2026-10-30-thr-2089-cheap-place-cards.md). It records the options weighed, the tensions, and the measurements that settled them.

## The question the ticket asked

THR-2081's Hunger sweep showed that only Mind has a cheap place card. Under the god-caused Mandate, 10 of 12 Hungers' scripted all-in gods reach less than half of their first sphere by doom 0.75. The ticket offered two fixes: give each sphere a cheap place or sublocation card (the THR-2086 shape), or price the Mandate per Hunger.

## Option A — price the Mandate per Hunger (rejected)

Fit `MANDATE_PRIMARY_TARGET_POINTS` / `…SECONDARY…` per Hunger so that each scripted god finishes between doom 0.5 and 0.75.

- **For:** one data table, no new content, and it closes the census gap at once.
- **Against:** it bakes today's card catalogue into the win condition. Each new card would then quietly unbalance the Hungers whose spheres it carries, and the table would need refitting every time. THR-2081's own kill criterion rules it out in advance ("A constant cannot fix a missing card, so file that sphere's card gap … instead of refitting"). It also leaves a Reshape god with nothing to cast on its first sphere. A smaller target does not give the god a verb. Law 38 says a god's powers come from the cards on offer, so a missing card is a hole in the offers, not in the clock.

## Option B — re-price the existing cards (rejected)

Drop Fortify, Bless the Harvest, Blight and Consecrate to 2 essence.

- **For:** no new content.
- **Against:** Bless the Harvest, Blight and Reveal the Vein are milestone *gifts*, not market offers, so price does not put them in a god's hand. Consecrate is tier 2 and gated to temples and shrines (8 on the seeded world). Fortify accepts `keep / fortress / stronghold / watchtower / garrison`, and the seeded medium world has none of those subtypes (it has 1 `fort` and 3 `tower`). So Fortify has **zero legal targets** (measured below). Re-pricing these cards also moves the economy of cards other gods already hold.

## Option C — one cheap tier-1 market place card per sphere (chosen)

The THR-2086 shape: a new card on an existing op, offered by the market at tier 1, priced at 2 essence, and aimed at settlements, which every world has.

- **For:** each Hunger gets a verb for each of its spheres. That is Law 38 made true, and it is what the THR-2081 kill criterion asked for. The census then measures card supply, which is the real gap.
- **Against:** six spheres need a card. That is too much for one slice under the 250-line cap, so the work is split in two.
- **Price, 2 not 1:** Mind's 1-essence Vision is a look-only scry (`crudType: 'read'`). A card that changes the world sits at Dream / Inspire / Kindle a Spark's 2. Law 36 (the purse is small) keeps the floor above the scry band.

## The split

- **Slice 1 (this plan): force, matter, time.** On a settlement, these spheres have no castable place card at all. Force's Fortify has no legal targets. Matter's only place card at tier 1 or 2 is a gift. Time has none.
- **Slice 2 (filed): spirit, life, entropy.** Each has a place card, but it costs 4 and is gift-only or temple-gated. The slice also takes the doom-wears-life finding (below) if the slice-1 census confirms it.

## Card fictions considered

| Sphere | Chosen | Considered and dropped |
|---|---|---|
| Force (physical power) | **Steel the Walls**, a settlement's `fortificationMultiplier` via `fortify_location` | a muster that raises recruits (no recruit substrate); a show of strength that lowers unrest (that is Order's calm) |
| Matter (substance, crafting) | **Lay the Footings**, `buildProgress` toward the town's next building | ore in the ground (Reveal the Vein already exists, as a gift); hardening goods (no goods-quality substrate) |
| Time (duration, memory) | **Keep the Stores**, `foodStore` (the grain keeps) | slowing the doom (that is the clock itself, off-limits to a card); remembering the dead (a spirit fiction) |

## Measurement notes

- The census picks place targets with `getPlaceNodes`, which returns the 844 sublocation-tier Places, not the 235 locations. It also ignores `targetSubtypes`. So the ticket's table credited Fortify, Bless the Harvest and Blight with casts a player could never make. The plan promotes a legal-target filter into the census.
- A synthetic arm (a Vision clone retagged to each sphere at 2 essence, pushed into the catalogue in-process) isolates *price and supply* from fiction. It is the "would a cheap card close it" test.
- Gather's life half rose to 15 points by tick 150 and then fell back to 0.2. Doom's stage escalation pushes entropy onto every location (`phaseDoom.ts:417-423`). Entropy is life's opposite, so under the THR-2081 ledger doom takes back what a life god built. This is by design (THR-2081 Decision 3), but it falls hardest on life. It is recorded for slice 2, not decided here.
