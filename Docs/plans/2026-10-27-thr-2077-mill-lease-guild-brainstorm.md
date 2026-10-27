> **title:** Brainstorm — a sealed mill lease gives the town's mill to a guild — THR-2077
> **linear_issue:** THR-2077
> **companion_of:** `Docs/plans/2026-10-27-thr-2077-mill-lease-guild.md`
> **created:** 2026-10-27

# Brainstorm — who holds the mill after the lease is sealed

## The question

*The Mill Lease* is won *"for the fellowship"*. [A place held after success](2026-10-26-thr-2048-place-held-after-success.md) Decision 4 ruled the mortal is the hired expert, not the holder. So who holds the mill, and what does holding it do?

## Holders considered

- **A guild present in the town (chosen).** This fits the kingdom ruling on [the mortal economy map](https://linear.app/threadbare/issue/THR-1863): *"each faction type ties to the resource places that fit it"*. It uses the purse's existing presence index and its existing `controls` collection. The cost is that about half of towns have no guild present, so those sealings hold nothing.
- **The abbey (the temple faction) keeps it.** That is true to the letter of a lease, but nothing changes in the world. The scene would then stay a fee-and-reputation scene, which is what the row exists to fix.
- **The town's tax holder (realm).** A realm `controls` edge moves borders (`realmProjection.ts:110-140`), so a scene about a mill would redraw the map. Rejected.
- **The actor's own faction.** The mortal works *for* the fellowship, not as one of them, and the actor's faction may sit in another town. Rejected as a mismatch with the fiction.
- **Mint a "millers' fellowship" faction.** That is a new faction from one scene, and Law 43 says use what exists. Rejected.

## Which guilds

Artisans and builders come first: craft fellowships, and the closest to millers. Merchants and traders come next: grain trade. Miners and bankers come last. Temples are out because the abbey is the landlord. Thieves are out because the abbey's rule would not let them bid. The order is a constant, so tuning it is changing data.

## What the mill pays

- **Resource yield.** A mill has no resource bag, so it would pay 0. That would be a dead write.
- **Guild work units.** Adding `mill` to an affinity's `sublocationTypes` would pay every guild in every mill town, whether or not a lease was sealed. That is too wide.
- **Held-building dues (chosen).** A table keyed by building id, paid only to the faction that controls the Place, scaled by prosperity like town tax. It is small (0.2 a cycle against a middling town's 0.8), and it extends to other buildings without code (Law 42).

## Raise or not

Mills stood in only 1–2 towns per seed, so "take up the standing mill" alone would almost never fire. Raising one as a town building uses the existing `raiseBuilding` / `markMortalBuilding` path (THR-1966) and keeps the slot cap. Its food effect is a fair consequence: the sealing feeds the town. With no free slot, nothing is raised. That keeps the building economy the owner of how many buildings a town has.

## Tensions

- **Law 45 in no-guild towns.** The prose says the lease is the fellowship's, and with no guild nobody holds the mill. The prose never names a holder, and the lease *is* sealed (the cellarer seals, the fee is paid), so the promise in the words is kept. The kill criterion widens the guild list if `no_fellowship` dominates.
- **War aims.** A guild-held mill becomes something the guild defends. That is the kingdom ruling working as intended, not a side effect.
