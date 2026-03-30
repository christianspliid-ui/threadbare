/**
 * Chronicler Content Package — Vignette prose, sublocation flavor, artifact lore, and traditions.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change vignette text,
 * sublocation descriptions, artifact lore, location atmospheres, and
 * magic tradition flavor. All prose follows the Threadbare aesthetic:
 * dark world, hidden magic, threads breaking through.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. CHRONICLER_VIGNETTES — 15 context-type vignette templates for inspection flavor
 * 2. SUBLOCATION_FLAVOR — 14 sublocation-type atmospheric descriptions
 * 3. ARTIFACT_LORE — 30 artifacts (5 per sphere) with names, prose, and sphere affinities
 * 4. LOCATION_TYPE_FLAVOR — 15 location-type establishing shots
 * 5. MAGIC_TRADITION_FLAVOR — 34 magic tradition flavor strings
 * 6. Lookup functions for runtime queries
 */

// ═══════════════════════════════════════════════════════════════════
// 1. CHRONICLER_VIGNETTES — Context-type inspection flavor
// ═══════════════════════════════════════════════════════════════════

/**
 * Vignette templates for location/agent/faction inspection overlays.
 * Used by the chronicler panel to provide atmospheric flavor text when
 * a player inspects a location, agent, faction, or point of interest.
 *
 * Each key represents a context type (e.g., 'location', 'agent').
 * Values are template strings with optional {placeholders} for substitution.
 */
export const CHRONICLER_VIGNETTES: Record<string, string> = {
  location:
    'The ancient stones remember. Threads of old magic pool in the shadows, faded but not forgotten. What dwells here now haunts what came before.',
  agent:
    'A thread pulled taut across the loom. Their choices ripple outward, touching those who never knew their name. The world is a web, and they move along it.',
  faction:
    'A knot of threads, bound together by belief or force. They tighten and strain, pulling at the world\'s fabric. How long can they hold before the breaking comes?',
  sphere_dominance:
    'Here the veil wears thin. One sphere bleeds through the cracks, reshaping all it touches. The other forces press back, but the threads are changing.',
  cultural_site:
    'Songs old as stone echo in the foundation of this place. The people who built here are dust, but their customs persist like stubborn roots, breaking through the dark earth.',
  trade_hub:
    'Silver changes hands, and with it, secrets. A crossroads where strangers meet and the balance of power shifts with every bargain. No walls can hold back whispers.',
  military_post:
    'Order carved from chaos by will and steel. The threads are tied tight here, held by discipline and fear. But all threads fray eventually.',
  encounter_site:
    'Something broke here. The ground remembers pain, and the magic tastes of ash and rust. Those who enter seeking trial will find truth, if they survive it.',
  divine_touched:
    'A god\'s hand rests here still. The threads glow faintly where they pass, and mortals feel the weight of attention from beyond the veil. Blessed or cursed — who can say?',
  doom_affected:
    'The unmaking creeps close. The threads unravel here, strand by strand. Time moves strangely, and those with eyes to see know that the end draws breath.',
  contested_territory:
    'Two powers grip this place and will not let go. The ground shivers with invisible conflict. Every act of creation here is defiant, every destruction inevitable.',
  peaceful_settlement:
    'Quiet dwells here. The threads run deep and slow, undisturbed. But quietness is fragile, and the darker currents run beneath the still waters.',
  ancient_ruin:
    'The ghost of empires. Broken stones hold the memory of power — thrones that commanded kingdoms, temples that held the world in thrall. Now only silence and shadow remain.',
  frontier_outpost:
    'The edge of the known world. Threads tangle here, pulled in all directions. Those who settle here are either brave or have nowhere else to go.',
  magical_nexus:
    'The veil tears here, and magic pours through like blood from a wound. The air itself hums with potential. What one does in such a place carries weight far beyond the mortal scale.',
};

// ═══════════════════════════════════════════════════════════════════
// 2. SUBLOCATION_FLAVOR — Sublocation-type atmosphere
// ═══════════════════════════════════════════════════════════════════

/**
 * Flavor prose for sublocations (rooms, districts, buildings within a location).
 * Used to provide quick atmospheric context when zooming into a location's interior.
 *
 * Each key is a sublocation type (e.g., 'market', 'temple').
 * Values are prose fragments that evoke the place without exposition.
 */
export const SUBLOCATION_FLAVOR: Record<string, string> = {
  market:
    'Cloth and wood weathered gray by salt wind. The press of bodies, the murmur of deals struck in half-dark. What is sold here may be found nowhere else — and may not be meant for human hands.',
  temple:
    'Stone worn smooth by generations of kneeling. The air tastes of incense, old and sweet. Threads of prayer hang tangled in the rafters, so faint the living cannot see them. The gods, perhaps, remember.',
  forge:
    'Heat and hammer-song. The metal glows red in the darkness, and for a moment it holds the shape of something more than iron. What the smith makes here carries the weight of will.',
  barracks:
    'Order and oil and the sharp edge of readiness. Every tool has its place. Every soldier knows their death may come before dawn. The tension here is a thread pulled so tight it sings.',
  library:
    'Dust and silence deeper than any tomb. The words written here outlast empires. Those who read too long feel the weight of all that dead knowledge pressing down, demanding to be understood.',
  garden:
    'Green struggling against the dark. Growth here is almost defiant — verdant threads twining through the stone, life refusing to yield. The gardener who tends this place fights the world itself.',
  dock:
    'The sound of water lapping against wood, patient and eternal. Salt and tar and the smell of things brought from far away. The boundary between worlds, where threads of fate are loose and tangled.',
  mine:
    'The earth opened up, bled of stone and metal. Something moves in the dark below — not alive, not dead, just present. The miners work quickly and don\'t look back.',
  tavern:
    'Warmth and the promise of forgetting. Threads of old anger and new hope tangle together here, loosened by drink. What is spoken in dark corners echoes outward, changed by the telling.',
  council_hall:
    'The weight of decision. The threads of power are visible here, almost — the currents of influence, the knots of authority. No words spoken here are merely words.',
  graveyard:
    'The ground holds its dead close. The threads are old and quiet here, resting beneath the stone. Those buried here are not at peace, but at stillness. There is a difference.',
  watchtower:
    'Eyes turned outward, always vigilant. The watcher stands at the boundary between safety and peril. From this height, the threads of the world become visible — all the connections, all the vulnerabilities.',
  workshop:
    'The smell of oil and worn leather, tools arranged with purpose. Here, the maker\'s will touches raw material and transforms it. The work is slow, and the maker must never lose focus, or the thread will break.',
  shrine:
    'A smaller sanctity, worn smooth by private devotion. Those who pray here do so quietly, hoping to be heard by powers that rarely listen. The threads are thin, but they are there.',
};

// ═══════════════════════════════════════════════════════════════════
// 3. ARTIFACT_LORE — 30 artifacts with sphere affinities
// ═══════════════════════════════════════════════════════════════════

/**
 * Artifact lore entries — 30 total, 5 per sphere affinity.
 * Each artifact has a name, atmospheric prose (sphere-infused), and affinity.
 *
 * Used by the agent detail panel and inspection overlays to provide
 * rich flavor when an agent carries or a location contains an artifact.
 */
export const ARTIFACT_LORE: Array<{
  name: string;
  prose: string;
  sphereAffinity: string;
}> = [
  // Force (5)
  {
    name: 'Shattered Thronebreaker',
    prose:
      'A blade that remembers kingdoms falling. Still hungry after centuries of conquest. Those who hold it feel their will sharpen into something cruel.',
    sphereAffinity: 'force',
  },
  {
    name: 'The Concussive Bell',
    prose:
      'Its ring shakes the foundations of stone. In the hands of one who knows its voice, every sound becomes a weapon. It has never been rung twice the same way.',
    sphereAffinity: 'force',
  },
  {
    name: 'Fist of the Fallen Giant',
    prose:
      'An ornate gauntlet, still warm after a thousand years. To wear it is to feel the strength of extinct things flowing through your limbs. Heavy. Always heavy.',
    sphereAffinity: 'force',
  },
  {
    name: 'The Warhammer Reverberation',
    prose:
      'Every blow strikes twice — once in the world, once in the aether. Those who have swung this hammer speak of hearing voices in the echoes, calling them to greater violence.',
    sphereAffinity: 'force',
  },
  {
    name: 'Overwhelming Tide',
    prose:
      'A whip of woven iron that moves with terrible grace. It remembers every creature it has torn apart and hungers for the next. Its wielder\'s dreams are filled with screaming.',
    sphereAffinity: 'force',
  },

  // Matter (5)
  {
    name: 'The Cornerstone of Empires',
    prose:
      'A cubic stone that never weathered. Carved with symbols that hurt to look at for long. Buildings founded upon it stand eternal, but their inhabitants wither faster than they should.',
    sphereAffinity: 'matter',
  },
  {
    name: 'The Crystalline Codex',
    prose:
      'A book bound in stone that never crumbles. Every page is solid, unbreakable. Those who read from it claim the words rewrite themselves depending on what the reader needs to know. Usually, they regret learning it.',
    sphereAffinity: 'matter',
  },
  {
    name: 'Anvil of Eternal Form',
    prose:
      'No flame has ever marked it. What is forged upon it takes a shape that will never change, never rust, never yield. Some say the anvil itself was the first forge, and all others are pale echoes.',
    sphereAffinity: 'matter',
  },
  {
    name: 'Statue of the Unmoved',
    prose:
      'Carved from a single piece of black stone that predates quarries. Its blank face has never worn an expression, and its stillness is so profound that those near it forget how to move.',
    sphereAffinity: 'matter',
  },
  {
    name: 'The Unbreakable Chain',
    prose:
      'Forged in darkness and bound with oaths. It can bind almost anything — though what escapes, when it finally does, is rarely merciful. Its links never wear, and neither do the marks they leave.',
    sphereAffinity: 'matter',
  },

  // Energy (5)
  {
    name: 'The Eternal Pyre',
    prose:
      'A lamp that burns with flame that never consumes. The light it casts shows truths that lesser fires hide. Many have stared into it. Few still have eyes that work properly.',
    sphereAffinity: 'energy',
  },
  {
    name: 'Spark of First Creation',
    prose:
      'A crystal that hums with the song of the world\'s beginning. Held too long, the heat grows unbearable — but those who suffer it speak of visions more real than waking life.',
    sphereAffinity: 'energy',
  },
  {
    name: 'The Scorched Crown',
    prose:
      'Burned into the shape of a diadem by forces that predated human crowns. To wear it is to feel the sun\'s attention upon you — blessing or curse depending on which gods are listening.',
    sphereAffinity: 'energy',
  },
  {
    name: 'Lightning Rod of the Storm God',
    prose:
      'It draws electricity from the air itself, from the dust, from the very ground. Those who hold it can taste copper and ozone. Some say it still remembers being struck by godfire.',
    sphereAffinity: 'energy',
  },
  {
    name: 'Ember Heart',
    prose:
      'A stone that remains warm regardless of season, pulled from the planet\'s deep places. Its heat soothes the dying and keeps the lost from freezing, but prolonged warmth breeds a deep lethargy.',
    sphereAffinity: 'energy',
  },

  // Life (5)
  {
    name: 'The Gardener\'s Green Knife',
    prose:
      'A blade that grows sharper the more living things it touches. In the hands of a healer it mends. In the hands of a killer, it thirsts. The knife knows no master except hunger.',
    sphereAffinity: 'life',
  },
  {
    name: 'Seed of the World Tree',
    prose:
      'Impossible to kill. Held in any hand, it germinates toward sunlight, roots growing through flesh as readily as soil. Those who carry it for years find themselves becoming root-bound to the earth.',
    sphereAffinity: 'life',
  },
  {
    name: 'Crown of Growing Things',
    prose:
      'Woven from vines that bloom with tiny flowers that never fade. It soothes pain and grants resilience. But living things are greedy, and the vine slowly assimilates its wearer into the plant kingdom.',
    sphereAffinity: 'life',
  },
  {
    name: 'The Regeneration Bone',
    prose:
      'A relic of something vast and ancient. To hold it is to feel wounds knit slowly, sickness flee, age rewind. But the healing never stops, and some say those who carry it for too long forget how to die.',
    sphereAffinity: 'life',
  },
  {
    name: 'Bough of Eternal Spring',
    prose:
      'A branch that never withered, pulled from a tree that walked the world before the mountains settled. It blooms when held with hope, withers in despair. Its wielder\'s mood becomes the season for all things nearby.',
    sphereAffinity: 'life',
  },

  // Mind (5)
  {
    name: 'The Omniscient Mirror',
    prose:
      'It shows truth, always truth, but not the truth you expect. Gazing into it is to see your own mind reflected back more clearly than you wished. Some men have gone mad from understanding.',
    sphereAffinity: 'mind',
  },
  {
    name: 'Locus of Perfect Logic',
    prose:
      'A sphere carved with geometric patterns that confound mortal sight. Held long, the mind that grasps it becomes very sharp indeed — but also very cold. Compassion becomes an inefficiency to be excised.',
    sphereAffinity: 'mind',
  },
  {
    name: 'The Unwound Riddle',
    prose:
      'A puzzle that changes based on who looks at it. Those obsessed with solving it find their waking hours consumed. Sleep brings no rest — only more attempts to untangle the knot.',
    sphereAffinity: 'mind',
  },
  {
    name: 'Pages of Infinite Knowing',
    prose:
      'A book that contains every answer — except the ones that matter. Reading grants clarity on unimportant truths. The truly necessary knowledge remains forever just beyond reach, visible but never quite legible.',
    sphereAffinity: 'mind',
  },
  {
    name: 'The Philosopher\'s Stone',
    prose:
      'Not what alchemists sought, but something close. It grants perfect understanding of one specific truth per sunrise. But understanding requires accepting that truth, and some truths poison the soul that grasps them.',
    sphereAffinity: 'mind',
  },

  // Spirit (5)
  {
    name: 'The Communion Bell',
    prose:
      'Its ring opens doorways to places beyond the veil. Those who listen too long forget which side of the door they belong on. The spirits on the other side grow tired of waiting.',
    sphereAffinity: 'spirit',
  },
  {
    name: 'Relic of the Ascended Martyr',
    prose:
      'Bone of one who gave everything in faith. To hold it is to feel the presence of something vast and approving. But the approval demands the same sacrifice. Many saints have been created from such relics.',
    sphereAffinity: 'spirit',
  },
  {
    name: 'The Ghostlight Talisman',
    prose:
      'An amulet that glows with ethereal fire. It grants sight beyond death, and those who wear it begin to perceive the world as the dead do. The living seem increasingly hollow, less real.',
    sphereAffinity: 'spirit',
  },
  {
    name: 'Sacred Ash of the Pyre',
    prose:
      'Burned flesh of something holy, now cooled and rendered into ash. To consume it is to taste divinity for a moment. The brief transcendence creates a hunger that nothing else can satisfy.',
    sphereAffinity: 'spirit',
  },
  {
    name: 'Icon of the Watching God',
    prose:
      'A carving so beautifully rendered that it seems to observe the observer. Those who keep it report feeling known, judged, and strangely comforted by that judgment. Isolation becomes unbearable.',
    sphereAffinity: 'spirit',
  },
];

// ═══════════════════════════════════════════════════════════════════
// 4. LOCATION_TYPE_FLAVOR — Establishing-shot prose for location types
// ═══════════════════════════════════════════════════════════════════

/**
 * Establishing-shot prose for different location types.
 * Used to generate the first paragraph of location inspection flavor,
 * setting the atmospheric tone before listing agents, factions, etc.
 *
 * Each key is a location type (e.g., 'settlement', 'shrine').
 * Values are prose that evoke the place without exposition.
 */
export const LOCATION_TYPE_FLAVOR: Record<string, string> = {
  settlement:
    'Smoke rises from hearths, thin and pale. The town huddles against the dark like a ember slowly cooling. Here, people maintain the fragile pretense that tomorrow will come.',
  shrine:
    'Stone carved with reverence and age. The god who dwells here has been silent for centuries, but the prayer-threads still cling to the walls, faded but persistent.',
  stronghold:
    'Walls of dark stone, thick enough to muffle the world. Inside, order is maintained with iron. Those who dwell here know the cost of weakness in a dangerous age.',
  ruins:
    'What once stood tall now crumbles. The ground remembers glory and will not stop grieving it. Threads of old magic still pulse faintly in the stones, not yet willing to fade.',
  waterway:
    'The river knows no kingdoms. It flows as it must, indifferent to the borders mortals draw. Those who live beside it learn to move with its rhythms, or it will teach them obedience.',
  mountain:
    'The peak touches something the lowlands cannot reach. The air here is thin, the silence deep. Those who climb seeking revelation often find only themselves reflected in stone.',
  forest:
    'Ancient trees hold the dark close. Light struggles here, giving way to shadow leagues before sunset. The forest is older than kingdoms and will outlast them all.',
  coast:
    'Where the land surrenders to water. The salt air carries whispers from beyond the horizon. The people here live with one foot always in departure.',
  desert:
    'Stone and sand under a merciless sky. Life moves in cycles of scarcity and brief bloom. Those born here learn early that beauty is the last thing to fade when everything else is consumed.',
  underground:
    'The earth\'s underside. Light comes from sources never examined too closely. Those who live here do not often venture upward — the sky feels too open, too exposed.',
  archive:
    'Knowledge accumulated and preserved. The stones themselves remember being catalogued. To wander these halls is to feel the weight of understanding pressing down from every direction.',
  craftshall:
    'The air smells of labor and creation. Here, raw things become shaped things, and the shapers take pride in their work. The threads of will run visible through the wood and stone.',
  garrison:
    'Steel and discipline and the constant hum of preparation for violence. Those stationed here know the hour of test may come before dawn. Readiness is its own kind of prayer.',
  harbor:
    'Where the world\'s goods converge and scatter. The press of merchants, sailors, and those seeking fortune. Fortunes are made and lost here at the turning of tide.',
  sanctum:
    'The holiest place in a land that has forgotten most of its holiness. Those who enter feel watched by something that neither judges nor forgives — merely observes.',
};

// ═══════════════════════════════════════════════════════════════════
// 5. MAGIC_TRADITION_FLAVOR — 34 magic tradition flavor strings
// ═══════════════════════════════════════════════════════════════════

/**
 * Flavor prose for magical traditions, practices, and schools.
 * Used in backstory generation, lore flavor, and inspection panels.
 *
 * Each key is a magic tradition name or concept.
 * Values are brief prose describing the tradition's flavor and philosophy.
 */
export const MAGIC_TRADITION_FLAVOR: Record<string, string> = {
  threadweaving:
    'The oldest practice. You do not cast magic — you pull the threads that were already there. The weavers know the names of threads, and those names are power.',
  echomancy:
    'Magic cast backward through time, reflected from the future. Those who practice it speak of actions they will have taken, of decisions not yet made becoming inevitably true.',
  crystallomancy:
    'The study of structure. What is broken can be reassembled. What is scattered can be hardened. Crystallomancers deal in permanence in a world of flux.',
  verdancy:
    'The green magic, never fully dead. It teaches that growth is victory, that life persists, that roots break through stone given time. The verdant know patience.',
  neuretheurgy:
    'The practice of divine speaking. Through meditation and ritual, the practitioner opens a channel to something vast and vast. Not all who speak to such things return unchanged.',
  soulbinding:
    'The craft of binding one thing\'s essence to another. Dangerous, forbidden in most places, practiced in the desperate dark. What is bound cannot easily be unbound.',
  nullcraft:
    'The magic of unmixing, of separation. Nullcrafters can make water forget it held salt, make light forget it reflected. They understand absence as thoroughly as presence.',
  fatewoven:
    'Reading the future in the threads that bind events. Fateweaver see probabilities braiding together. They know that choices matter, but the odds are always written in advance.',
  geomancy:
    'The art of reading the earth\'s bones. Through earth and stone, one can perceive the world\'s structure. Geomancers know that the land remembers what water and wind forget.',
  sidereal_patterning:
    'The navigation of starlight. The stars are not merely lights but doorways. Those who map them correctly can find paths through spaces that have no name.',
  hemomancy:
    'Magic written in blood and seed. The older practitioners shun it. The desperate and devoted embrace it. What is written in blood cannot be easily erased.',
  pneumaturgy:
    'The calling and binding of spirits. Pneumaturges serve as intermediaries between worlds. Some say they are not entirely sure which side of the veil they stand on.',
  vitacraft:
    'The practice of granting or taking vitality. Vitacrafters heal by pulling sickness into themselves. They kill by stealing breath. Both acts carry a cost.',
  monolith_shamanism:
    'The oldest shamanic practice, predating civilization. Standing stones hold memory. Shamans of this tradition dwell in those memories, moving between past and present.',
  alchemical_union:
    'The blending of essence. Alchemists do not transform base lead to gold — they find the gold that was always present but dormant. They teach that fusion is deeper than fire.',
  scythemancy:
    'The magic of harvest. What must be cut to make room for new growth. Scythemanc understand death as part of the cycle. Their practice is necessary and terrible.',
  tidal_witchery:
    'Magic tied to the moon and tide. Tidal witches work with cycles, with flow and ebb. Their power waxes and wanes with the lunar year. Patience is their greatest strength.',
  bonecarving:
    'The reading of bones, the binding of spirits to skeletal forms. Bonecravers walk a thin line between necromancy and natural magic. Their apprentices do not often live long.',
  wardcraft:
    'The craft of protection through symbol and will. Wardcrafters place boundaries that limit harm. But all barriers eventually fail, and some say the wardcrafter feels each failure personally.',
  resonance_singing:
    'The power of harmonics and true-tone. Singers attune to the frequency of existence itself. A perfect note can shatter or heal. It is never clear until the sound has faded.',
  luminomancy:
    'The study of light as substance. Not illumination, but light itself — treated as a tangible thing that can be carved and shaped. Luminomancers are forever followed by subtle shadows.',
  erosion_craft:
    'The patient magic of wearing things away. Erosion-crafters work slowly, over years. They understand that time and tide wear down even mountains. Their patience is inhumane.',
  kinetomancy:
    'The magic of pure motion. Kinetomancers do not stop force — they redirect it, amplify it, perfect it. At their best, they move like thought itself.',
  umbral_dancing:
    'The practice of moving through shadow as if shadow were substance. Umbral dancers speak of cities that exist only in darkness, of a world shadow-walkers know that the sunlit world has forgotten.',
  mnemomancy:
    'The magic of memory and forgetting. Mnemomancers can extract memories, hide them, implant them. They know that history is written by memory, and memory can be rewritten.',
  oath_binding:
    'The ancient magic of spoken promise. Words given with true intent carry weight that cannot be broken without consequences. Oath-binders are contract-keepers, terrible and just.',
  starfall_invocation:
    'The drawing down of stellar force. Starfall-invokers call celestial power to earth through long ritual. When successful, the effect is profound. When it fails, the backlash is often fatal.',
  plague_craft:
    'The magic of contagion and spreading. Plaguecarfters know how to make sickness, blessing, or curse spread from person to person. Feared and sometimes employed by desperate rulers.',
  deepmind_communion:
    'The touching of the great consciousness that dwells in the planet\'s core. Deepmind-communers say it is not alive and dead but both at once. Communion grants knowledge of strange, antediluvian things.',
  ironbound_sealing:
    'The craft of binding and constraint through magical law. What is sealed by ironbound magic cannot break free easily. This magic is used to bind both objects and entities of power.',
  spiraling_meditation:
    'The inward magic of spiral and recursion. Through meditation on spiraling patterns, one can access deeper layers of reality. Each spiral goes inward, and some spirals never end.',
  dustmancy:
    'The magic of dissolution and scattering. Dustmancers understand breaking-apart as thoroughly as builders understand assembly. They know that all things can be reduced to dust.',
  veilpiercing:
    'The practice of looking beyond the boundary between worlds. Veilpiercers can see what is hidden, what dwells on the other side, and sometimes what is not meant to be seen.',
  runecarving:
    'The oldest written magic. Runes are symbols that enforce reality on the world. Once carved, they shape what comes after. Rune-carvers are patient, precise, and dangerous.',
};

// ═══════════════════════════════════════════════════════════════════
// 6. LOOKUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Retrieve a vignette by context type.
 * Returns undefined if context not found.
 */
export function getVignetteByContext(context: string): string | undefined {
  return CHRONICLER_VIGNETTES[context];
}

/**
 * Retrieve sublocation flavor by type.
 * Returns undefined if type not found.
 */
export function getSubLocationFlavor(type: string): string | undefined {
  return SUBLOCATION_FLAVOR[type];
}

/**
 * Filter artifact lore by sphere affinity.
 * Returns all artifacts matching the given sphere.
 */
export function getArtifactLore(
  sphereAffinity: string
): (typeof ARTIFACT_LORE)[number][] {
  return ARTIFACT_LORE.filter((lore) => lore.sphereAffinity === sphereAffinity);
}
