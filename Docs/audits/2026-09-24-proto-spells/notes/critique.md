## Self-critique: where composition broke

### The five weakest spells, and why

1. **Sour Barb (#15): three ideas bolted together.** It carries three unrelated effects:
   - it curses anyone who trades blows with the bearer;
   - it makes nearby enemies worse at Gold, which does nothing in a fight;
   - it counts the opponents the bearer overcomes.

   There is no single idea, and the name covers only the first. Luck magic does not obviously teach any of it, and two of its three parts wait on the fight block. This is how free composition fails once it goes past two building blocks. The appendix spell *Kindling Run* is the same failure, worse: a sprint, a patch of Volcanic ground that nothing reads, and a wound on an opponent.
2. **Green Chart (#1): a price that does not characterize.** The effect is good: wherever the bearer arrives, the land around them goes onto their map. The price is nonsense. Shamanism's death theme pushed the spell to transgression. The "it changes them" drift is then taken from the spell's own Reach (Star). So a mapping spell makes its bearer steadily more *Misleading* and thins their quintessence. The drift should come from the tradition's own vice, not from the effect's Reach.
3. **Second Sight (#16): a generic core, and a tier that overrides character.** It is a Necromancy cantrip that makes the bearer "a little better at Veil when dealing with magic or fate". It is free, "the kind of magic a village keeps". Two things went wrong:
   - The situational-bonus core has no intent of its own. The whole spell comes from table draws, so it could belong to any tradition.
   - The cantrip tier allows only free or strain. That overrides Necromancy's lean toward transgression, so death-magic arrives priced like a hedge-witch's charm.

   The generator flags it.
4. **Late Tipping (#11): sound mechanics, engine-speak prose.** It works: a near miss at Stone becomes a success at a price. But it was freely composed, so it says "the result is lifted a step". Stone is an arbitrary draw for Chronomancy, and the name is noun salad. Prose is free composition's weakest layer: without an authored sentence, even a sound spell reads like a rules table.
5. **Search the Distance (#18): the tier forces a soul price on a gentle spell.** A Light divination spell that lets the caster see a long way costs "a great deal of their quintessence" and is "the kind of magic people notice". The signature tier allows only gamble or transgression, so a gentle tradition's best spell has to eat its caster. Uncover the Hidden (#8) has the same shape. And half of the price, the notice, has no engine home.

**One more pattern that is not a single spell.** Height Anchor (#12) and Brace of Loam (#13) share the same sentence word for word: two traditions, one core. Variation never reaches the prose. Either each core needs a tradition-flavoured phrase slot, or the library needs at least two cores for every combination of arena, agency and tier.

### What the run says about the three questions

**Coherence bar.** A proposed bar: a spell passes when a player could guess its sphere and tradition from its name and effect, and its price from its tradition.
- **Core-built spells:** about ten of the fourteen pass. The failures are prices (#1, #16, #18) and loose tradition fits (#12 Ascension, #17 Summoning).
- **Free spells:** two or three of the six pass. Break the Brave (#9, terror plus fighting from the dark) and Horn Silence (#2, a hush plus a blinding fog) cohere by luck. Even these read like rule lists.

**Missing envelope constraints.** The rulings name five axes: agency, arena, price, tier and sphere/tradition. Building the tables needed these additions:
1. **What a tradition teaches.** The world model gives each tradition sphere weights and nothing else. The first draft drew traditions by sphere alone. It produced a Warding mage whose signature spell was a sprint, and a Poison mage under a healer's vow never to use Iron. Giving each tradition a few themes fixed this, and the fit had to be a hard rule: at a soft 8% weight, a misfit still got through in twenty spells.
2. **Price leans by tradition, with tier windows that do not override them.** Pricing by tier alone produced a holy blessing on the land priced as a transgression. The lean fixed most cases. The tier windows still force #16 and #18.
3. **A price table split by agency.** A fate-woven spell is never cast, so it can never pay a cast cost. Its price has to be something it carries: a standing weakness, a vow, a toll after success, or a slow thinning.
4. **Shelves for the four Foundation spheres.** No tradition has one.
5. **Word banks per tradition, not only per sphere.** An earlier run named an Ice spell "Burning Hunger". In this run, Bright Blow (#7) is a crushing wave of water.
6. **A home for notice.** See gap 3.
7. **"It changes them" keyed to the tradition's vice, not the effect's Reach.** See Green Chart.
8. **A flavour slot per core**, so the variation reaches the sentence.

**Where the dial should sit.** My recommendation is authored cores plus variation, with free composition limited to one rider slot at most.
- One building block deep, free composition holds up.
- Two deep, it mostly holds when both blocks come from the same arena.
- Three deep, it breaks (Sour Barb, Kindling Run).
- Its prose always reads like a rules table.

The cores are cheap: about ten lines each, thirty-seven in this sketch. The bigger lesson is where the coherence came from. Most of it came from tables no ruling names: tradition themes, price leans and the agency split. Those belong in the plan doc as envelopes in their own right.

### What changed during the build

The first draft followed the rulings literally: shelves by sphere, and price by tier. It produced these:
- a Warding mage whose signature spell made them sprint;
- a Poison mage travelling fast under a healer's vow never to use Iron;
- a holy blessing of the land priced as a transgression;
- a Light spell that handed out a Shadow bonus.

Each fix became an envelope rule listed above. That is the strongest evidence that tradition has to be a real envelope, not a flavour label.

### What I did not do

- There is no pure-random baseline, drawing straight from the whole effect union. It would include primitives that do nothing yet (teleport, compel), and its garbage would prove nothing.
- Balance at population scale is not tested. The numbers sit inside the engine's caps, but nothing here runs a thousand agents.
- The names are the roughest layer: roughly half read well ("Close the Way", "Last Coin", "Take the Road", "Break the Brave") and the rest are serviceable or noun salad ("Horn Lure", "The Nod Survey").
