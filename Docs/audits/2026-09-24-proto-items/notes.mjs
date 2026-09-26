// notes.mjs — the hand-written sections of the THR-1236 review document.
// Written after reading the seed-42 output; the per-item numbers below refer to that run.

const NUMWORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const times = (n) => (n === 0 ? 'never' : n === 1 ? 'once' : n === 2 ? 'twice' : `${NUMWORD[n] ?? n} times`);

export function makeNotes({ LINKS, main, free, SHAPE_STATUS, TROPES }) {
  const byName = Object.fromEntries(main.map((it, i) => [it.name, i + 1]));
  const ref = (name) => `#${byName[name] ?? '?'} ${name}`;

  // Name shapes that actually fired in this run, with their examples.
  const GRAMMAR_LABEL = {
    material: 'Material + form', role: 'Whose trade it served', person: 'Whose it was (first name)',
    xofy: 'X of the Y', definite: 'The + one word + thing', portmanteau: 'One made-up word',
    proper: 'Thing of a named person or place', house: 'A family name', given: 'A beast\'s own name',
  };
  const grammarRows = Object.entries(GRAMMAR_LABEL).map(([g, label]) => {
    const ex = main.filter(i => i.grammar === g).map(i => i.name);
    return `| ${label} | ${ex.length ? ex.join(' · ') : '—'} |`;
  });

  // How world-flavoured: what the provenance sentences named.
  const uses = { hero: 0, faction: 0, event: 0, monster: 0, culture: 0, place: 0, none: 0 };
  for (const it of main) { if (it.provUses.length === 0) uses.none++; for (const u of it.provUses) uses[u]++; }

  const liveShapes = Object.entries(SHAPE_STATUS).filter(([, [s]]) => s !== 'planned').map(([k]) => k);
  const tropeList = (counts) => TROPES.map(t => `*${t.label}* (${counts[t.id] ? NUMWORD[counts[t.id]] : 'none this run'})`).join(', ');

  const dialIntro = [
    'The same seed, the same tables, the same honesty rules — but no trope core. The machine picks a kind of thing, a reach and a sphere, composes one or two effects from the live vocabulary, adds a sphere touch at Mythic and above, and sometimes a catch. Read these next to the thirty above.',
  ].join('\n');

  const howMade = (counts) => `## How these were made

Each item is a stack of table rolls. Every table is its own seeded stream (the pattern the Encounter Factory already uses in [drawTable.ts](${LINKS.drawTable})), so changing one table never reshuffles another — cut a trope and every other item keeps its dice.

**Rarity band.** The game's own four words from [rarity.ts](${LINKS.rarity}): Mundane, Storied, Mythic, Legendary. The band sets the size of everything else: how strong a bonus may be (matched to the hand catalog's ranges and the capability ceilings in [item-stat-bands.ts](${LINKS.itemBands})), how many effects an item carries, whether a catch is likely, and which name shapes are favoured.

**Trope core (the authored part).** ${TROPES.length} hand-written cores, each a fantasy or world idea with a mechanical signature attached: ${tropeList(counts)}. A core says what the item must do, what it may cost, which kinds of thing it can be, which spheres and people and places fit it, and how its story and name are phrased. Everything else is rolled around it. A core can appear at most twice in one batch.

**World entities.** Real game concepts, partly faked for the sketch. The factions are the game's own (the twelve in [faction-definitions.ts](${LINKS.factionDefs}), with their real reach leanings) and so are the eight monster kinds in [monster-faction-definitions.ts](${LINKS.monsterDefs}), one per creation sphere. The places (Low Harrow, Kel Barrow, Greywater Ford, the Ashfold, Saltmere, Thornwood, Vessa's Rest), the eight past events and the eleven dead heroes are invented for this sketch; a live generator would read them from the world's own graph and chronicle, which [THR-1235](${LINKS.thr1235}) found is all reachable. Each core restricts who and what can appear (a thief's tools come from the Thieves Guild, a trophy from a monster). In this batch the stories named a person (most of them dead) ${times(uses.hero)}, a faction ${times(uses.faction)}, an event ${times(uses.event)}, a monster ${times(uses.monster)}, a culture ${times(uses.culture)} and a place ${times(uses.place)}.

**Provenance.** One sentence or two about where the thing came from, in one of five tones borrowed from the game's unused [artifact lore patterns](${LINKS.cultureContent}) (reverent, martial, mystical, practical, ominous). Those patterns were written in a lyrical register, so only their tones were kept and every sentence was rewritten plainly. Three coherence rules run after the roll: a story that names a hero and a faction names the hero's own faction; one that names a hero and an event names the hero's own event; and an oath-keeper is never the game's known oathbreaker.

**Sphere.** The core decides which spheres are possible; the world decides which of those. A relic of the Plague Year leans to Entropy because the event does, a Civic Guard ring to Order because the Guard does. The sphere colours the name's word stock, the look sentence, the material and a tag.

**Reach.** The core's reaches, leaned by the maker faction's reach weights and by what the thing is (worn things lean to Stone and Star, books to Eye and Veil).

**Kind and material.** The seven kinds of possession the game already has, forty-odd forms (sword, signet ring, war-horn, lantern, almanac, mule…), and around forty materials, each leaning to a sphere and to terrain (bog-iron from the marsh, cinder-glass from the Ashfold). Trophy materials come only from a monster (wolf-fang, storm-feather, wraith grave-cloth).

**Effects — the honest vocabulary.** Only effect shapes with a live reader in the engine are allowed: ${liveShapes.length} shapes, each listed in the generator with the code that reads it. The fight system's two new words (a clock push and a condition inflicted on an opponent) are listed but switched off until they ship. Bonuses, penalties, durations and chances all sit inside the engine's own caps (no single effect over the per-effect cap, no reach over the total cap, no more than eight effects or two triggers on one item). One rule matters more than it looks: a "when…" bonus must name a real situation — alone, outnumbered, out in the wilds, badly worn down, on home ground, in the hands of someone True — or be the fight system's nerve step. The engine decides "in a fight", "with people" and "with magic" from the kind of step being rolled, so a bonus like "better at trade when dealing with people" is simply a trade bonus wearing a condition (see the notes at the end).

**The catch.** Every catch must be a real mechanical downside the engine applies, never flavour: a pull towards fights, a slow drift towards a vice, a penalty elsewhere, a rule it forbids, a hex it sours, a toll on each success, a thinning of the bearer's self, or a chance of coming away Shaken, Grieving, with Nightmares or under Watch Scrutiny. A "breakable" item must carry the trigger that breaks it; a "cursed" one must carry the harm.

**Names.** Eight shapes: the six found in the hand catalog's names (the possessive one in two flavours) and two narrow ones for heirlooms and beasts. A shape is only offered if the story backs it (no "Hesta's Spear" unless the story names Hesta); rarer items lean away from plain material names; no name repeats in a batch.

| Name shape | This batch |
|---|---|
${grammarRows.join('\n')}

**Look.** One concrete detail, drawn from the core, the material or the sphere, never repeated in a batch.

**Plain words.** The cards never print a number. Size is said in four steps (a little, noticeably, much, far); time in days; chances as "about one time in four".

**Checks.** Every item is validated against the game's closed tag vocabulary, its condition catalog and its caps, then minted into a small test world — a bearer, an ally and a rival in a village held by a third faction — and read back by the real engine functions: every bonus in an ordinary step of its reach and in its intended situation (built the way the game builds it), capability, rule overrides, immunities against every real condition, triggers, ticks, auras, suppression, charges. A control batch of seven deliberately dishonest items fails the read-back six times; the seventh (a trigger on a moment the game never raises) is caught by the validator instead. So a clean pass means something.`;

  const dial = `## Where the dial sits

This sketch sits at **authored cores, freely dressed**. The part a player would call the item's idea — the blade that wants blood, the coin that keeps an account, the locket that will not let you die — is hand-written once, with its signature effect and its catch. The part that makes two rolls of the same idea different — who carried it, where it came from, what it is made of, how strong it is, what it is called — is rolled from world tables.

Appendix B is the other end of the dial. Freely composed items are valid and balanced, and all of them read back clean, but they are anonymous: a pewter coin that makes you better with people, a mirror that forbids prying and slows time. Nothing ties the parts together, so nothing is memorable. Coherence comes from the core, not from the dice.

The cost of cores is authoring: each is roughly one table row plus a dozen lines of phrasing. The risk is repetition: a core has one signature, so its second appearance in a batch is a re-skin (see the critique). The fix is not free composition; it is two or three signatures per core, and more cores.

**My recommendation:** keep authored cores; grow them to two or three signatures each; let the world tables do the variation. Leave Mundane gear mostly to the hand catalog and generate from Storied up, where the cores earn their keep.`;

  const critique = `## Honest self-critique — the weakest items

My own read of the thirty, before yours: about fifteen cool, ten fine, five flat. Everything I would call cool is Storied or above and comes from a core with a strong idea and a catch you would hesitate over. The flat ones share causes worth fixing.

1. **${ref("Factor's Coin")}** — the thin, samey pool in miniature. A coin that makes you a bit better at trade and a bit easier to deal with, with no catch and no hook. Its own story says the Consortium hands one to every factor who can count, which tells the player it is not special. The Mundane end of the trader core has two small bonuses and nothing else.
2. **${ref("Quartermaster's Amulet")}** — incoherent at three joints. A Mythic oath named after a quartermaster (the name drew the Free Company's second job title); an oath that forbids "pleading or charming", which I invented to give the Free Company an oath row rather than taking it from anything the faction is; and the strongest Iron bonus in the Mythic band on a thing whose idea is a promise, not a weapon. It works; it means nothing.
3. **${ref('The Black Knife')}** — a re-skin of ${ref('Hollowroot')} two slots earlier: same core, same signature (great power, the land sours), different shape. The core has one signature, so its second roll can only change the dressing. This is the clearest case for several signatures per core.
4. **${ref('The Last Helm')}** — the history does all the work and the mechanics do not carry it. A winter-long siege becomes "a little better at fighting when outnumbered", with no catch. It is not even marked as having a past, though salvage has seen much by definition. A history-touched thing should feel touched.
5. **${ref('The Holed Charm')}** — a real effect nobody would ever see. It takes the next blow to its bearer's sense of self and vanishes, silently, inside the nightly settling of accounts; nothing on screen would tell a player it worked. Some real effects are only as good as their visibility — the "items are invisible" itch this map set aside.

Also noted: ${ref('Stole of Father Gall')} is the second saint's relic and the second stole in a row, and its aura helps allies at "making and enduring" without anything in the saint's story pointing there; ${ref('The Frozen Mantle')}'s catch (every condition lasts longer, good or bad) is a genuinely two-edged rule but a stretch for a warm cloak.

None of the catches in this batch is a fake: every one is applied by the engine (the read-back checks each). The weakest real ones are the social cold shoulder on ${ref('The Oskell Signet')} and the Heart penalty on ${ref('The Blue Glass')} — true, but mild.`;

  const findings = `## Notes for the design session — things the generator had to route around

These are engine facts found while building the honest vocabulary. None is new work for this ticket; each is a sentence the generator's plan doc will need.

1. **A reaction that grants a timed boost still does nothing.** When a \`reactive\` effect fires (on arrival, on being hurt), its nested bonus is handed to the executor, which treats every plain bonus as "applied elsewhere" and applies nothing ([effectEventDispatch.ts](${LINKS.dispatch}), [effectExecutors.ts](${LINKS.executors})). Shipped items promise this shape — "when damaged, a burst of Iron" on Hollowfang, a Heart burst on the Weeping Icon in [the reward catalog](${LINKS.catalog}). The generator emits no \`reactive\` at all.
2. **The game's main conditions lack their family tags.** Terrified carries no \`#fear\`, Wounded no \`#wound\`, Cursed no \`#curse\` ([condition-trait-content.ts](${LINKS.conditions})). So "immune to fear" blocks nothing on a mortal (three shipped items say it), and a salve that heals by the \`#wound\` tag misses the Wounded condition fights apply. One tag each would fix it. The generator only offers immunities that block a real condition, and heals Wounded by its id.
3. **Only two of the eleven terrain overlays are read.** \`warded\` slows movement and \`shrouded\` shortens awareness ([movementCost.ts](${LINKS.movementCost})); the other nine persist and do nothing. The generator never emits them.
4. **Two trigger moments never happen.** Item triggers on \`rest\` and \`spell_cast\` are never raised anywhere; the generator's validator rejects them. (The engine read-back cannot see this one, because it calls the trigger directly.)
5. **A generated heirloom cannot be born with a past.** The Storied trait is stamped only at level one ([artifactTraits.ts](${LINKS.artifactTraitsEngine})); a hero's weapon or a family signet wants to start at "has seen much". A level option on the stamp is a small addition.
6. **"Storied" means two things.** It is the second rarity word and also the artifact trait "has seen a thing or two / much / it all" ([rarity.ts](${LINKS.rarity}), [artifact-trait-content.ts](${LINKS.artifactTraits})). In this batch a Storied-rarity ring has no story and a Mythic sword is Storied-the-trait. Worth one ruling on words.
7. **Masterworks are empty.** The masterwork undertaking mints its item with no effects at all ([strategicGraphOps.ts](${LINKS.strategicOps}), \`mintMasterwork\`). A trope core dressed by the maker and the place is exactly what that object is missing — a natural first minting point.
8. **A shipped curse looks lethal.** The Mark of Debt condition drains the bearer's quintessence by one whole point per tick on a scale that runs from nothing to one ([reward catalog](${LINKS.catalog}), [quintessence.ts](${LINKS.quintessenceTypes})), which would empty it in a single tick. Worth a look.
9. **Most "when…" bonuses in the hand catalog are plain bonuses in disguise.** The engine derives "in a fight", "with people", "with magic" and "exploring" from the reach of the step being rolled: \`in_combat\` is any Iron step (plus, since the fight block, every fight exchange), \`in_social\` any Heart or Gold step, \`in_mystical\` any Veil or Star step ([effectPredicates.ts](${LINKS.predicates}), \`buildPredicateContext\`). A conditional on its own reach therefore fires on every step it could ever touch — it is a passive. Of the 41 conditionals in [the reward catalog](${LINKS.catalog}), 26 are exactly that and 4 sit on a reach their condition almost never meets; 11 are genuinely situational. The one step-type condition that now means something new is \`in_combat\` on Heart — the nerve step at the start of every fight — which is what this batch uses for "its nerve holds better once a fight starts". The generator only allows situational conditions, and the engine read-back fails any bonus that fires in an ordinary step.
10. **Generated items need a name tag of their own.** The content registry recognises items by their id prefix (\`reward_\`, \`starter_\`, \`anomaly_\` in [content-objects.ts](${LINKS.contentObjects})); a \`gen_\` prefix has to be added there so tooltips and checks see generated items.
11. **The fight system is ready for items.** Its plan ([fight block](${LINKS.fightBlock})) already reads an item's "in a fight" bonus (shipped), will read Storied and cursed artifacts (last slice), and adds a clock push and an inflict-condition word "for cursed items" (a middle slice). The generator's table has both words listed and switched off.`;

  const footer = `---

*Built for [THR-1236](${LINKS.thr1236}) from the research on [THR-1234](${LINKS.thr1234}), [THR-1235](${LINKS.thr1235}) and [THR-1237](${LINKS.thr1237}), against the effect vocabulary made live by the [activation program](${LINKS.activation}). Throwaway prototype: the generator, the engine read-back and the raw item data live beside this document and touched nothing in the game's code.*`;

  return { dialIntro, howMade, dial, critique, findings, footer };
}
