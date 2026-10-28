> **companion to:** [2026-10-28-thr-2086-energy-cards.md](2026-10-28-thr-2086-energy-cards.md)
> **author:** Claude Code (design lane, run 2026-10-28c, unattended)

# Energy cards: brainstorm companion

## The tension

Energy is "vitality, fire, kinetic power" (`Docs/canon/cosmology.md`, the Creation Spheres table; opposite Spirit). Three Hungers lean on it with three different fantasies. **Kindle** ignites people. **Wander** walks the edges of the map. **Illuminate** drags hidden things into the light, with energy as its *second* sphere. One card cannot serve all three. The ticket asks for the smallest set that lets each of them spend energy at all, and at least one card that targets a place, because places are where the Mandate's points are weighted most (place 1.0, mortal 0.2, `phaseSphereAggregation.ts`).

## Options considered

1. **Tag the four energy-priced "flows" hex cards `sphereAffinity: 'energy'`.** This is the cheapest change: four one-line edits, and the cards already exist at tiers 2–3, priced in energy. *Rejected, for now.* A hex target is `hex_COL_ROW`, which is not a graph node, and `phaseSpherePressure` drops the push. The cards would look energy-tinted and grow nothing (Law 45, a false promise). The underlying bug is filed separately; once it is fixed, this becomes the follow-up.
2. **Re-tag `divine.inspire` (life → energy).** Its fiction is pure energy ("Kindles divine fire… extraordinary energy"). *Rejected.* It is a spine gift every god receives, priced in its sphere. Re-tagging moves the price of a starting card onto energy essence for every Hunger, and takes life's cheapest mortal card away from Kindle's own secondary sphere.
3. **Re-tag `divine.rekindle_thread` (spirit → energy).** *The Lent Fire*, a quintessence restore. *Rejected.* It is a spirit milestone gift; re-tagging moves it from spirit gods (energy's opposite) to energy gods. That is a tuning call about a shipped gift, not a gap fill.
4. **A magical-saturation place card** (an energy Ward). *Rejected.* It duplicates `loc.ward`'s op exactly, so energy would get order's card in a new colour. Saturation reaches mortals only indirectly: through a place trait (`phaseLocationTraits.ts:147`) and the world-generation rarity seed. Its two named thresholds have no reader outside the CMS tunables list.
5. **A speed or road card for Wander.** *Deferred.* It needs movement substrate that this pass did not measure; per the action-catalog skill, a new primitive is its own ticket.
6. **Stoke the Forges + Kindle a Spark (chosen).** Both ride ops already in the catalog. The town card has a real bridge (econ shock seeds) and a real cost (unrest). The mortal card started as Inspire's energy twin. Measuring Inspire showed its card writes no value drift, so it moves no choice (filed as THR-2088). Kindle a Spark therefore carries the THR-1651 `own_lean` drift rule, which Dream also uses, at 0.12 instead of Dream's 0.08. It fans what the mortal already wants. Dream reshapes desire in sleep (mind); Compulsion pushes toward a fixed pole (`first_pole`).

## Why unrest on Stoke

Every prosperity card in the catalog either calms (Open the Markets, −10 unrest) or is pure boon (Bless the Harvest). Energy's opposite is Spirit, and its fiction is heat and motion. A card that brings coin *and* loud streets gives the energy god a choice the order god does not face (Law 36: every card costs), and it feeds the unrest ladder already built for hunger. The delta (+5) is a quarter of Incite Unrest's, so it cannot stand in for a chaos card.

## Vision premises

- *The god influences, never commands* (Law 9): Kindle a Spark is an influence with a decay curve, not a directive.
- *Cards come from the world's offers, in their own sphere* (Law 38): tier-1 market, priced in energy.
- *One vocabulary of effects* (Law 41): no new effect type.

## Open after this ticket

- Energy at tier 4 (the progression check's other hole).
- Wander's own verb (option 5).
- After the hex-pressure bug lands: tag the flows cards (option 1).
