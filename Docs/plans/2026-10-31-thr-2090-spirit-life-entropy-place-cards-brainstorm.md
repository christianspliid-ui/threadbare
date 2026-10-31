> **title:** Spirit, life and entropy cheap place cards, and doom's tide — brainstorm companion (THR-2090)
> **linear_issue:** THR-2090
> **author:** Claude Code (design lane, run 2026-10-31a, unattended)
> **created:** 2026-10-31

# Brainstorm companion — slice 2 cards and the doom tide

Companion to [the plan](2026-10-31-thr-2090-spirit-life-entropy-place-cards.md). It records the options weighed and the measurements that settled them.

## The question the ticket asked

Two things. First, three cheap place cards (spirit, life, entropy), the shape slice 1 set. Second, slice 1's finding that a cheap life card does not rescue Gather: life rose to 25 by t150 and fell to 1.2 by doom 0.75. The ticket asked the lane to decide from evidence, or reserve the question for Christian with the options laid out. The evidence it named: is the cause the stage push only, and how do other spheres fare against their opposite's doom pressure?

## The measurement

Proto branch `proto/thr-2090-doom-wears-life`, two env switches in `phaseDoom.ts`, census `SYNTH=1` on seeded medium 42. All raw output is in `scripts/_scratch-2090-results/`.

- **Is it the stage push?** Yes. Gather's life is 1.2 with the push, 38.2 without it, and 30.2 with the push landing but not counted against the Mandate. Kindle's life half goes from 2.2 to 62.7 the same way.
- **Do other spheres suffer the same?** No. Haunt's spirit is 57.2 with the push and 56.2 without it. Sever's and Consume's entropy halves reach 49.2 and 50.9 with the push in place. Doom's archetype cards push their own spheres (force, chaos, spirit, mind…), but none of them hits a Hunger's half the way the flat entropy push hits life.
- **What still limits Gather at 30?** After t150 the god's life essence pool sits near 1 and its casts slow (43 by t150, 65 by t642). That is supply, the same plateau slice 1 filed as THR-2094.

## Options for the tide

1. **Keep it: life against the clock is the point.** Thematically clean (cosmology: entropy is decay, life is growth). Rejected: it leaves two of twelve Hungers with an unreachable half, and nothing in the Hunger catalogue or the Mandate plans says a life god should play a harder game. THR-2081 rejected full wear for producing exactly this kind of spread (−69 to −772 by Hunger).
2. **Drop the stage push.** It changes doom for every world, every UI that reads the world's entropy score, and every system that reads location sphere scores, to fix a question that lives in the Mandate ledger. Rejected as the wrong layer.
3. **Push the archetype's sphere instead of entropy.** It moves the hole to whichever Hunger opposes that world's doom, so the spread varies by world. Rejected: Decision 4 wants one unit everywhere.
4. **Raise the life card's delta or price it at 1.** The push erases whatever was built. Rejected: the measured no-stage arm shows the card is not the limit.
5. **Not counting the tide as opposition (chosen).** The push keeps landing, so the world darkens as doom climbs. Doom's archetype cards and rivals still take back. Only the ledger changes, behind a switch.
6. **Reserve for Christian.** The ticket allowed it. Rejected, because two agreed decisions answer it. THR-2081 Decision 3 makes the contest a raid on the god's ground, and the tide is not aimed at anything. Decision 4 says one unit for every Hunger. The decision stays vetoable in one chat line.

## The cards

- **Life: Tend the Sick (`populationHealth` +10).** Considered: a second harvest card (Bless already does that, as a gift); a population card (no `population` writer is cheap or safe). Health has three readers: prosperity, unrest and promotion.
- **Entropy: Let the Damp In (`populationHealth` −8).** Considered: *Spoil the Stores* (`foodStore` −). Rejected, because `update_node` does not clamp and `growth.ts:63` reads a negative store as a negative take, a fail-soft hole. Health readers use thresholds, so a negative reads as sick. The card also pairs with Tend on the same rope, as the cosmology pairs the two spheres. Re-pricing Sicken the Wells (tier 2, 6 essence, health −25, unrest +15) to 2 was also considered. Rejected, because it is the strong, fast form a god grows into, and Damp is its cheap, slow cousin.
- **Spirit: Keep the Vigil (`unrest` −4).** Considered: `divinePresence` +0.10. Rejected: the presence label is computed in `retinue.ts` but nothing renders it, and the prosperity bonus waits until 0.5 while presence decays 0.01 a tick. The card would do nothing a player can see. Unrest is on the place page and the unrest ladder, and spirit calming mirrors energy's Stoke heating (energy ↔ spirit).
- **Energy: Stoke the Forges 3 → 2.** It keeps slice 1's Decision 1 true for every Hunger sphere. Its +5 unrest is already its cost.

## Tensions

- *Legibility vs mystery:* Tend and Bless both raise health. Bless is a harvest gift that also raises prosperity and stocks. Tend is the cheap market card that only heals. Their effect lines name different ground (the harvest, the people).
- *A dominant loop:* Let the Damp In cast on a rival's town for many turns. Recovery of +1 a tick and the 2-essence price bound it. The kill criterion watches it.
