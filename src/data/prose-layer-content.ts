/**
 * Prose Layer Content — pre-authored prose fragments for entity description.
 *
 * Each resolver in the prose generator framework picks from these tables.
 * Templates use {placeholder} syntax resolved at generation time.
 * All prose follows the Threadbare aesthetic: dark world, hidden magic, threads that break through.
 *
 * Design doc: Docs/plans/2026-03-09-prose-generator-framework-design.md
 */

// ─── Biome Prose ────────────────────────────────────────────────────────────
// Each terrain type has multiple descriptive fragments for establishing location mood.
// These are short cinematic descriptions suitable for prose layer composition.

export const BIOME_PROSE: Record<string, string[]> = {
  grassland: [
    'The grasslands stretch empty and honest beneath a low sky, each blade worn grey by wind. No shelter here, only the rhythm of seasons turning to dust.',
    'Grasses sway in patterns that suggest meaning — a language the wind speaks and the earth forgets. The horizon bleeds into overcast without border or mercy.',
    'Open country where the eye finds no rest. The grass is pale and brittle, marked by hoofprints that fill with shadow.',
    'The grassland is a page on which nothing has been written long enough to last. Fire and grazing erase all signatures, leaving only the land\'s own hand.',
    'Distance here is not measured in leagues but in the time it takes to stop feeling watched. The grassland offers nowhere to hide and makes no apologies for it.',
  ],
  farmland: [
    'Tilled earth in neat desperation — rows where survivors once fought the soil for bread. The fields lie half-fallow now, memory of labor soaked into furrowed ground.',
    'Scattered stone walls divide the farmland into claims and counter-claims. What grows here grows despite the world\'s indifference.',
    'The soil is worked but worn thin. Fences lean at angles that suggest they have forgotten what they were meant to keep in or out.',
    'The farmland is a negotiation between people and dirt, neither side winning. Irrigation ditches carry water to fields that drink it without gratitude.',
    'Crows patrol the furrows like tax collectors. The scarecrows have given up pretending — they lean into the wind, resigned to being decorative.',
  ],
  savanna: [
    'The golden grass rolls shallow like a living thing, sparse enough to show the scored red earth beneath. Heat seems to press down from above rather than rise from the ground.',
    'Low trees stand like survivors of a long siege, their shapes tortured into wind-pattern testimony. The savanna forgets quickly what it witnesses.',
    'Scattered acacia reach skyward with the desperation of prayer. The grass between them speaks in whispers only the dust understands.',
    'The savanna is a theatre where predators and prey perform their ancient choreography in golden light. Beauty and violence share the same stage without contradiction.',
    'Heat shimmers turn the middle distance into hallucination. The savanna is most dangerous when it looks most peaceful.',
  ],
  steppe: [
    'A vast monotony of low scrub and stone beneath a sky that offers no mercy. The wind carries the same song across a hundred leagues without change.',
    'Wind-carved earth where nothing stands tall. The steppe teaches that survival means becoming small, becoming patient, becoming indifferent to suffering.',
    'Sparse grass clings to stony ground as if through sheer stubbornness. The horizon vanishes into wind-driven haze at the distance where sky and earth forget they are separate.',
    'The steppe is old enough to have worn down its own features. What remains is elemental — stone, wind, the low scrub that has learned to grow sideways.',
    'Travelers cross the steppe and emerge changed by the silence. There is nothing to distract from one\'s own thoughts, and the steppe is merciless about that.',
  ],
  temperate_forest: [
    'A forest of leafless grey boughs standing in November light — limbs skeletal against dark sky. The forest floor is ankle-deep in rot that smells of time.',
    'Birches and oaks lean together as if sharing secrets the world need not hear. Light falls in rays through the canopy, illuminating nothing but the emptiness between.',
    'The forest stands in permanent dusk, its understory thick with shadow and fallen wood. Here, growth and decay pulse in the same breath.',
    'Mushrooms colonize the fallen trunks in rings that suggest ritual. The deciduous forest is a place of constant renewal — the death of each leaf feeds the next season\'s gamble.',
    'In autumn the forest burns without fire, gold and copper and rust cascading to a floor that softens footsteps and muffles intention.',
  ],
  dense_forest: [
    'The forest closes in with the weight of a tomb, ancient trees pressed shoulder to shoulder. Sunlight struggles to reach the floor where ferns uncoil in perpetual twilight.',
    'Darkness pools between the trunks like water. The air tastes of mold and deep time, of cycles that continue with or without witness.',
    'In the dense green maze, the trees become less individual and more a single breathing organism. A stranger here is swallowed very gently.',
    'The canopy is so thick that rain arrives late, filtered through leaves into a secondary drizzle that smells of chlorophyll and patience.',
    'Sound behaves differently in the deep forest — voices carry strangely, footfalls vanish, and the silence between bird calls is thick enough to lean against.',
  ],
  boreal_forest: [
    'Conifers stand in grey-green ranks under a low sky that has forgotten how to brighten. The earth beneath is half-frozen, neither truly solid nor entirely yielding.',
    'Sparse spruce and larch cling to granite, their branches laden with ice even in mild seasons. The silence here is profound and intentional.',
    'The boreal forest is patient and unforgiving. Moss and lichen cover all wounds, slowly erasing the scars of any intrusion.',
    'The taiga smells of resin and cold stone. The trees grow slowly and remember everything — a cut in the bark will still be visible in a century.',
    'Snow lingers between the dark trunks well into warmer months, refusing to acknowledge the season. The taiga operates on its own calendar.',
  ],
  jungle: [
    'The jungle is violent in its indifference — life strangling life in the dripping green darkness. Every leaf hides teeth, every shadow contains moisture and hunger.',
    'Vines hang like nooses from canopy to canopy. The air is thick enough to drink. Life here consumes itself in endless green fury.',
    'Ancient trees rise from tangle and shadow, their roots seeking purchase in mud that remembers nothing. The jungle teaches that survival requires becoming part of the rot.',
    'The canopy filters sunlight into a green twilight where butterflies the size of hands navigate paths invisible to anything walking below.',
    'Everything in the jungle is either growing or being consumed by something that is. The distinction between the two is less clear than outsiders assume.',
  ],
  swamp: [
    'Water and earth cannot decide which is dominant, so the swamp exists in neither state. Mist rises in coils as if the ground itself is breathing in shallow gasps.',
    'The swamp is patient. It absorbs what falls into it without judgment or mercy, slowly converting all things into the dark water and darker earth.',
    'Cypress and mangrove stand knee-deep in water that reflects no sky. The air is thick with spore and decay, with the exhalation of a thousand slow deaths.',
    'The swamp moves when you\'re not watching. Channels shift, islands drift, and what was solid ground yesterday is brown water today.',
    'Insects own the swamp in numbers that make human settlement feel like a polite request. The buzzing is constant — a hymn to moisture and decay.',
  ],
  marsh: [
    'The bog is a place of slow surrender. Sphagnum moss covers everything in a pale shroud, soft and deceptive as a liar\'s promise.',
    'Water dark as peat stains everything that touches it. The bog preserves the dead for centuries, keeping them fresh for a remembering that will never come.',
    'Stunted plants cling to the acidic soil in shapes twisted by hopelessness. Nothing thrives here — only endures in diminished form.',
    'The bog makes no distinction between path and pit. Each step is a negotiation with ground that may or may not exist beneath the moss.',
    'Ancient things surface in the bog after centuries of submersion, tanned and preserved — leather, wood, occasionally a face with an expression of surprise.',
  ],
  hills: [
    'The hills roll in patient waves of stone and grass, old enough to have forgotten they were mountains. Each ridge holds shadow like a secret.',
    'Slopes fold back on themselves in ridges that suggest intention long forgotten. The hilltops offer no triumph, only the hollow certainty of coming down.',
    'Worn and weathered to stumps of their former grandeur, the hills persist in quiet degradation. Each season steals something small they cannot miss.',
    'The hills create their own weather — fog pooling in the valleys, wind singing along the ridgelines, rain arriving from directions the lowlands never suspect.',
    'Paths wind along contour lines carved by generations of feet and hooves. The hills are a landscape of revealed choices — each ridge offers a different view of the same problem.',
  ],
  mountains: [
    'The mountains tower in stone indifference, their peaks hidden in clouds that never fully break. They have stood longer than kingdoms rise and fall like breath.',
    'Rock faces scarred by avalanche and ice. The mountains are ancient and patient, grinding down all ambition into fine sediment.',
    'Peaks cloaked in perpetual shadow, their slopes a labyrinth of crag and scree. The mountains ask nothing and care for nothing.',
    'The air thins with altitude until breathing becomes a conscious act. The mountains do not accommodate — they simply exist, and smaller things adjust or don\'t.',
    'Echoes travel for miles in the mountain passes, turning a single shout into a conversation with stone. The mountains remember every sound and return them at odd moments.',
  ],
  plateau: [
    'The flat-topped expanse rises abruptly from lower lands, a table set for gods who never come to dine. The edges drop into shadow so complete it seems to contain sound.',
    'Wind screams across the open plateau, unbroken and relentless. The land here is honest — no pretense, no shelter, only exposure.',
    'The plateau surface is scarred stone and sparse scrub, with horizons that extend beyond the eye\'s ability to track. Here the sky dominates.',
    'The plateau\'s edges are decisive — the land simply ends, and the drop below belongs to a different country. Everything up here exists in bright, wind-scoured clarity.',
    'At night the plateau is closer to the stars than any other land. The constellations feel personal here, as if the sky had contracted to fit the flat horizon.',
  ],
  badlands: [
    'The earth has been tortured into fantastic shapes — ridges and gorges carved by water that has long since fled. The stone is painted in layers of rust and ash.',
    'A maze of canyons where the earth reveals its secret strata, each layer telling of older worlds. The badlands are broken country that teaches its own lessons.',
    'Color without life — rust and orange and purple shadows in formations that suggest anguish given form. The badlands are beautiful and utterly hostile.',
    'The badlands are a museum of geological violence, each spire and hoodoo a monument to forces that shaped the land and left. Nothing here was built; everything was carved away.',
    'Shadow pools in the canyons like dark water. The badlands change character with the angle of the sun — dawn is gentle, noon is blinding, dusk is theatrical.',
  ],
  desert: [
    'Sand stretches without mercy or marker, the horizon a suggestion that may be illusion. Heat and silence are the only constants.',
    'The desert is honest — it offers nothing, demands everything, and forgets both giver and taker with equal indifference.',
    'Dunes shift like living things under a merciless sun that seems closer here. The desert teaches that survival requires becoming empty inside.',
    'At night the desert surrenders its heat and the stars arrive in numbers that mock the emptiness below. The cold comes as sharply as the heat departed.',
    'Wind sculpts the sand into ripples that mimic water — the desert\'s cruelest joke, offering the shape of relief without the substance.',
  ],
  tundra: [
    'Permafrost underlies a thin skin of struggling moss and sedge. The tundra is vast and empty, a place where the earth and sky have made peace through mutual abandonment.',
    'Wind hammers across flat, treeless country where nothing stands tall enough to cast shadow. The cold is not just temperature — it is the absence of warmth translated into physical force.',
    'The tundra is patient and eternal, waiting for the brief season of chaos before returning to perfect, empty silence.',
    'In the brief summer, wildflowers erupt across the tundra in defiant color — a few weeks of furious beauty before the white returns and erases everything.',
    'The permafrost holds bones and seeds and the compressed memory of warmer ages. The tundra is a palimpsest of climates, each written over the last.',
  ],
  glacier: [
    'Ice fields stretch toward horizons that exist in perpetual white. The glacier is time made visible — compressed snow and trapped air from eons past.',
    'Crevasses split the smooth ice in patterns that change with the grinding seasons. The glacier moves with the patience of geology.',
    'Here in the depths of ice, the world is simplified to cold, silence, and the slow crush of accumulated time.',
    'The glacier groans in the night — deep, structural sounds that could be the earth protesting or the ice settling into more comfortable positions.',
    'Light refracts through the ice in blues so deep they seem to contain their own darkness. The glacier is beautiful in the way that things which can kill you slowly tend to be.',
  ],
  volcano: [
    'The volcanic plain is studded with cones both fresh and ancient, their slopes dark with basalt and ash. Steam rises from cracks in the earth like the world\'s breath.',
    'The ground here remembers violence and promises it may repeat. Lava formations twist into shapes that suggest rage given physical form.',
    'The volcanic land is bare and mineral — stone in its rawest states, colored by ancient fire. Life struggles to find purchase on ground so recently unmade.',
    'Hot springs pool in the craters of spent cones, their mineral colors garish against the black basalt. The water smells of sulphur and deep earth.',
    'The volcanic soil, where it has cooled long enough, is remarkably fertile. Gardens grow in the footprints of destruction — the land\'s way of apologizing.',
  ],
  broken_lands: [
    'The landscape is shattered as if by cosmic violence — stone torn into jagged formations, earth split into chasms that hold their own weather.',
    'Reality seems fractured here, ground and sky not quite trusting each other. The broken lands are where the world went wrong and never quite healed.',
    'Terrain folds in impossible angles, creating labyrinths of stone and shadow. Navigation is less about direction and more about survival.',
    'The broken lands shift. Not quickly enough to watch, but camps left overnight are found at different elevations come morning. The ground here has not finished settling.',
    'Gravity behaves strangely near the deepest fractures, as if the earth\'s own confidence has been shaken. Water runs uphill in places, and compasses spin.',
  ],
  great_home_trees: [
    'Titanic trees rise beyond the scope of mortal comprehension, their trunks wider than towers, their canopy lost in eternal cloud. The world beneath is always twilight.',
    'The ancient trees are their own forests, each trunk a landscape unto itself. Soil and moss accumulate on branches thicker than any normal tree.',
    'In the shadow of the great home trees, scale becomes meaningless. Individual lives are less than insects on the bark of infinitely old wood.',
    'The roots of the great trees have created their own terrain — ridges and valleys of wood and earth intertwined, where streams flow through tunnels of living bark.',
    'Communities build entire settlements on the lower branches, never touching the ground. The trees tolerate this the way cathedrals tolerate mice.',
  ],
  forested_hills: [
    'The forest rolls in hills that rise and fall like waves, dark against grey sky. The canopy is thick enough to turn afternoon into dusk.',
    'Trees climb the slopes in dense ranks, their darkness suggesting depth that swallows light. The forest floor is soft with decay.',
    'The forested hills stand in permanent twilight, where growth and rot happen simultaneously in the deep shade.',
    'Streams cut through the forested hills in silver threads, their courses marked by the greener growth along their banks. The water knows the way; everything else follows.',
    'The forest-covered slopes suggest shelter that the deeper you venture, proves illusory. Within the trees, the horizon closes in quickly.',
  ],
  deep_ocean: [
    'The deep ocean is a darkness with weight — pressure and cold conspiring against anything that breathes. Light dies within the first hundred fathoms, leaving only what thrives on absence.',
    'Nothing returns unchanged from the deep ocean. The pressure remakes flesh and memory alike, pressing both into shapes the surface world would not recognize.',
  ],
  tropical_ocean: [
    'The tropical ocean is warm enough to feel alive, its currents carrying the illusion of benevolence. Beneath the sun-bright surface, predators patrol in patient silence.',
    'Coral and colour deceive the eye into thinking beauty means safety. The tropical ocean is as indifferent as any other — it simply wears a prettier mask.',
  ],
  coast: [
    'The coast is where certainty ends. Land frays into rock and sand, battered by a sea that never stops arguing. Nothing permanent is built here without being tested.',
    'Salt wind and spray have bleached everything along the coast to a uniform grey-white. What stands has survived not by strength but by knowing when to bend.',
  ],
  reef: [
    'The reef is a city built by creatures too small to see, a labyrinth of living stone beneath shallow water. Navigation here is a negotiation between hull and coral.',
    'Sharp coral ridges lie in wait just below the surface, patient as any predator. The reef does not hunt — it simply occupies the space where accidents happen.',
  ],
  floodplain: [
    'The floodplain remembers every drowning. Rich silt marks the high-water line like a scar, and the soil beneath is fat with the deposits of seasonal violence.',
    'Settlers build here because the soil is generous, then curse the generosity when the river returns to collect. The floodplain is a loan, not a gift.',
  ],
  tropical_forest: [
    'The tropical forest is a green machinery of growth and decay operating at a pace that mocks temperate patience. Everything rots and regenerates in the same breath.',
    'Canopy so thick it creates its own weather — rain above, rain below, and between them a humidity that dissolves will and intention.',
  ],
  evergreen_forest: [
    'The evergreen forest holds its needles through every season, a stubbornness the deciduous cannot match. The floor is a carpet of brown needles that muffles all sound.',
    'Pine resin scents the air with something between sweetness and medicine. The evergreen forest is a pharmacy and a cathedral — both equally indifferent to visitors.',
  ],
  light_forest: [
    'The light forest is almost generous — trees spaced wide enough for sun to reach the understory, wildflowers claiming the gaps between trunks.',
    'Open woodland where the canopy politely declines to block the sky entirely. Pleasant, almost inviting — which makes the rare darkness between the trees more unsettling.',
  ],
  dead_forest: [
    'The dead forest stands as testimony to what was. Grey trunks stripped of bark point skyward like accusations, and nothing grows in their shadow.',
    'Whatever killed this forest left it standing — a cruelty beyond simple destruction. The dead wood creaks in wind that carries no seeds, no pollen, no promise.',
  ],
  moor_bog: [
    'The moor stretches in waterlogged desolation, heather and peat offering nothing to the eye but endurance. Pools of dark water reflect a sky that never fully commits to clearing.',
    'Bog ground gives way without warning — solid-seeming turf that opens onto black water and the slow pull of ancient peat. The moor keeps what it takes.',
  ],
  high_mountains: [
    'The high mountains exist above the treeline, above mercy, above the altitude where breath comes easily. Stone and ice are the only residents that do not struggle.',
    'Thin air and killing exposure rule the high peaks. Those who climb here do so knowing the mountains offer nothing in return — not shelter, not wisdom, not safe passage.',
  ],
  mountain_pass: [
    'The pass is a compromise the mountains make reluctantly — a gap narrow enough to funnel wind into a weapon, but wide enough for the desperate to attempt crossing.',
    'Carved by water and widened by travellers over centuries, the mountain pass is a scar in the rock that both sides of the range share without acknowledgment.',
  ],
  oasis: [
    'The oasis is a green wound in the desert\'s monotony — water and shade where neither has any right to exist. Those who find it drink first and ask questions after.',
    'Palm shade and still water, surrounded by a waste that watches and waits. The oasis is not generous — it simply marks where the water table breaches the surface.',
  ],
  rocky_desert: [
    'The rocky desert is stone baked beyond mercy — a pavement of fractured rock where nothing grows except in the cracks between. Shade is a rumour here.',
    'Heat radiates upward from stone that has been cooking since before memory. The rocky desert does not kill quickly — it prefers erosion, the slow grinding of resolve.',
  ],
  sand_dunes: [
    'The dunes shift with a patience that outlasts every footprint. Sand moves in slow waves driven by wind, erasing paths, burying landmarks, rewriting the landscape overnight.',
    'Sand dunes are the desert in motion — a terrain that refuses to be mapped because it cannot hold still. What was a valley yesterday is a ridge by morning.',
  ],
  arctic: [
    'The arctic is darkness and ice sharing dominion over a world that has forgotten warmth exists. Survival here is measured in hours, not days.',
    'Frozen waste stretching to horizons that offer nothing but more of the same. The arctic is not hostile — hostility implies interest. It is simply, thoroughly, indifferent.',
  ],
  snow_fields: [
    'Unbroken snow reflects a sky that cannot decide between grey and white. The snow fields muffle everything — sound, movement, the distinction between ground and air.',
    'The snow is deep enough to bury standing. What lies beneath it is anyone\'s guess, and guessing wrong means disappearing without witness.',
  ],
};

// ─── Culture Location Prose ──────────────────────────────────────────────────
// How foundation pairs shape the character of a settlement or region.

export const CULTURE_LOCATION_PROSE: Record<string, string[]> = {
  order_light: [
    'The location bears the marks of Order-and-Light cosmology — straight-lined architecture, deliberate organization, and careful planning made visible in stone and geometry. Light sources are placed to illuminate purpose, not hide shadow.',
    'Here, chaos is organized into systems. The Light tempers Order\'s rigidity — there is beauty in the geometry, warmth in the golden hour illumination on careful angles.',
    'Every structure speaks of intention and forward planning. Laws are written in the arrangement of buildings. The Light brings safety but also exposure — nothing is hidden.',
    'Lampposts line the streets at measured intervals, each flame tended by appointed hands. The settlement runs on schedules posted in public squares — even grief has its allotted hours.',
    'Glass windows face outward in every dwelling, a custom enforced by tradition rather than law. In an Order-Light settlement, privacy is a luxury permitted only to the dead.',
  ],
  order_darkness: [
    'The settlement speaks of Order in service to Darkness — structures are deliberate and contained, designed to hide as much as reveal. Beauty exists in hidden symmetries.',
    'Darkness is imposed through careful architecture. Gates and walls frame and compartmentalize space. Order provides stability but the Darkness ensures that order hides rather than reveals.',
    'The streets follow rational patterns but lead toward shadows rather than light. Hierarchy is made architectural — the higher and inner one goes, the deeper the shadows pool.',
    'Locked doors outnumber open ones. The settlement is organized with precision — not for convenience, but to ensure that what is hidden stays hidden and what is revealed is only what serves the hierarchy.',
    'The architecture here is beautiful in the way a lockbox is beautiful — every surface polished, every joint tight, every interior forbidden to casual inspection.',
  ],
  chaos_light: [
    'Chaos channeled through Light creates a settlement that is organic and sprawling, yet suffused with vitality and sudden illumination. The architecture seems to grow rather than be built.',
    'The Light breaks through Chaos into moments of brilliant clarity. The settlement has no fixed form — it changes, adapts, and grows in unexpected directions.',
    'Here, rules are suggestions. The Light reveals the constant flux beneath, the endless rearrangement of pieces into new patterns. It is vibrant, exhausting, and dangerous.',
    'Murals appear overnight on blank walls, replaced by newer murals before the paint dries. The settlement remakes itself in daylight, loudly and without apology.',
    'Festivals erupt without planning, dissolve without conclusion. The Light here is generous — it shows everything, even the exhaustion of people who have forgotten how to be still.',
  ],
  chaos_darkness: [
    'The settlement is pure chaos given form through Darkness — structures are unstable, purposes shift like shadows, and the Darkness hides the consequences of disorder.',
    'Nothing is fixed here except the understanding that nothing will be fixed. The Darkness provides cover for the chaos to operate without judgment.',
    'The location is volatile and unpredictable. Safety means staying near what you know, because the Darkness and Chaos together make the next street a foreign country.',
    'Sounds carry strangely through the settlement — laughter from a direction that held only empty buildings an hour ago. The Darkness and the Chaos conspire to make maps meaningless.',
    'Residents navigate by instinct and relationship rather than landmark. Streets rearrange themselves not literally but functionally — what a passage connects today it may not connect tomorrow.',
  ],
};

// ─── Sphere Location Prose ───────────────────────────────────────────────────
// How each Creation Sphere\'s dominant influence manifests at a location.

export const SPHERE_LOCATION_PROSE: Record<string, string[]> = {
  force: [
    'The location carries the mark of Force — impact points visible in shattered structures, violence made architecture. Conflict shapes the settlement itself.',
    'Scars of impact and explosion mar the landscape. Force speaks through destruction and the terrible clarity that comes after things break.',
    'The walls here are not built for beauty but for impact. Every surface shows the memory of collision — dents, cracks, the specific scarring of stone that has been struck and has held.',
    'Tension sits in the air like heat before a storm. The settlement is a coiled spring, and Force ensures it stays wound tight.',
  ],
  matter: [
    'Matter dominates the region — stone is solid and dependable, mineral wealth draws inhabitants, and the earth itself seems more present and less yielding.',
    'The settlement is built deep into stone, walls are impossibly thick, and resources are fought for with geometric precision. Matter provides but demands respect.',
    'Everything here has weight. The buildings press into the ground with the authority of permanence, and the people walk with the heaviness of those who work in stone and ore.',
    'The soil is rich with mineral veins that surface in glittering seams along cliff faces. The settlement exists because the earth here offered something worth digging for.',
  ],
  energy: [
    'The location thrums with radiant Energy — patterns of activity, brightness, and ceaseless motion. Even the quiet moments feel like a held breath.',
    'Energy manifests as cycles and rhythms — the settlement pulses with life, activity, and cycles of exhaustion and renewal. Nothing here is still.',
    'Heat radiates from the ground in faint shimmers. Fires catch easily, tempers run hot, and the settlement burns through resources and patience at equal speed.',
    'The air crackles with potential — static builds on metal surfaces, sparks jump between iron fittings, and the settlement hums with a frequency just below hearing.',
  ],
  life: [
    'Life is dominant here — growth is visible in the decay of old structures under vine and moss, in the way nature claims back human works. The boundary between tended and wild is blurred.',
    'The settlement is part of the ecosystem rather than separate from it. Life flows through it, and death feeds new life in visible cycles.',
    'Green things push through every crack with the insistence of the living. The buildings are not abandoned — they are colonized, repurposed by root and tendril into something the builders did not intend.',
    'Birth and rot happen in the same breath here. Mushrooms crown fallen timbers, songbirds nest in skulls, and the settlement smells of both blossom and compost.',
  ],
  mind: [
    'Mind shapes the location into patterns of thought made manifest — libraries, schools, spaces for gathering and contemplation. The architecture reflects intellectual organization.',
    'The settlement is built around centers of learning and memory. Every structure speaks to the value of knowledge and the organization of understanding.',
    'Inscriptions cover the walls — equations, theorems, fragments of debate carved into doorframes. Knowledge here is not stored but displayed, as if thinking were a public act.',
    'The silence in this settlement is not emptiness but concentration. People here speak in measured phrases, and the pauses between words carry as much meaning as the words themselves.',
  ],
  spirit: [
    'Spirit manifests as transcendence — the settlement is oriented toward the sky, built in imitation of other worlds, and contains spaces meant for purposes beyond the physical.',
    'The location is thin — the boundary between worlds is permeable here, and the settlement\'s architecture acknowledges realities beyond the material.',
    'Candles burn in windows at all hours, tended by those who believe the flames anchor something unseen. The settlement exists in two planes — the physical one merely the visible half.',
    'The air carries a faint resonance, as if a bell struck long ago is still fading. People here speak of what they feel more than what they see, and the difference matters.',
  ],
  time: [
    'Time marks the location visibly — layers of construction on construction, ruins of older settlements visible beneath newer ones. The past is present here.',
    'The settlement exists in multiple temporal states simultaneously — echoes of older cities, prophecies of future ones, all visible in how it is built and rebuilt.',
    'Clocks and sundials mark every public square, but none agree. The settlement measures time obsessively because time here does not behave — seasons arrive late, days stretch, nights compress.',
    'Old and new sit side by side without transition. A wall of mortared brick meets a wall of rough-hewn stone from a century earlier, joined so tightly that the seam seems intentional.',
  ],
  entropy: [
    'Entropy is the dominant force — decay visible in every structure, entropy eroding stability, and the slow dissolution of all things the only certainty.',
    'The settlement crumbles slowly and steadily. Nothing is permanent here, and the entropy that claims it does so with patient inevitability.',
    'Rust blooms on every iron surface like an orange flower. Wood softens, stone powders, and the people here have learned to build with the expectation of loss rather than against it.',
    'The settlement does not fight its own dissolution. Roofs sag, foundations shift, and the inhabitants patch what they can with the calm resignation of people who understand that mending is temporary.',
  ],
  chaos: [
    'Chaos reigns here — nothing stays in its place for long. Streets shift, buildings lean at improbable angles, and the locals have stopped trying to impose order on a place that refuses it.',
    'The settlement thrums with restless, unpredictable energy. Markets erupt and vanish overnight, alliances shift with the wind, and the only constant is constant change.',
    'Disorder is not a failing here but a philosophy. The people have learned to thrive in turbulence, reading opportunity in confusion the way farmers read weather.',
    'Wild magic saturates the air — doors open onto different rooms each morning, and the townspeople navigate by instinct rather than habit.',
  ],
  order: [
    'Everything here has its place, its schedule, its regulation. The settlement runs with mechanical precision, and deviation from routine draws sharp attention.',
    'Perfect symmetry governs the layout — streets at right angles, buildings of uniform height, gardens trimmed to geometric exactness. The order is beautiful and slightly unnerving.',
    'Law is not merely enforced here but woven into the fabric of daily life. Even the market stalls are arranged by an ancient and exacting protocol that no one questions.',
    'The settlement operates like a single organism. Each person knows their role, each structure serves its purpose, and the whole hums with quiet, coordinated efficiency.',
  ],
  light: [
    'Light lingers here longer than it should — dawn comes early, dusk arrives late, and even moonless nights carry a faint luminance that seems to rise from the earth itself.',
    'The settlement glows with an inner warmth. Kindness is currency here, honesty is reflex, and strangers are greeted with a trust that borders on recklessness.',
    'Truth is inescapable in this place. Lies wither on the tongue, shadows refuse to hide what they contain, and every secret eventually finds its way into the open.',
    'Radiance suffuses the architecture — pale stone that catches and holds sunlight, windows designed to flood every room with clarity. There are no dark corners here.',
  ],
  darkness: [
    'Shadow clings to this place like a second skin. Even at midday the light feels muted, filtered through something that turns warmth to coolness and brightness to grey.',
    'Secrets are the true currency here. Everyone carries them, everyone trades in them, and the settlement thrives on what remains unspoken and unseen.',
    'The darkness here is not hostile — it is sheltering. It hides those who need hiding, obscures what should not be seen, and offers a velvet silence that some find more honest than light.',
    'Night is the natural state. The inhabitants have adapted — they see clearly in dimness, speak softly, and understand that some truths are better discovered by touch than by sight.',
  ],
};

// ─── Subtype Establishing Prose ──────────────────────────────────────────────
// Location type establishing prose, can include {name} placeholder.

export const SUBTYPE_ESTABLISHING_PROSE: Record<string, string[]> = {
  hamlet: [
    '{name} is barely a place — a handful of structures that claim the land more through habit than permanence. It exists because leaving is harder than staying.',
    'A scatter of buildings around a well or crossing, {name} is the sort of place travelers barely notice they\'ve passed through.',
    'Smoke rises from three or four chimneys at {name}, and on clear days that is enough to mark it on the horizon. The people here know each other\'s silences better than their words.',
    'The hamlet of {name} clings to the land like lichen — slowly, stubbornly, without ambition beyond the next season. Its history is counted in harvests, not years.',
  ],
  town: [
    '{name} has accumulated enough structure to claim a market and a watch, though its stone looks perpetually temporary, as if it might scatter back to component parts without notice.',
    'The town sprawls in practical grids and circles, buildings close-packed in the way of places where safety is found in proximity rather than walls.',
    '{name} is large enough to have strangers and small enough to notice them. The market draws people in; the walls suggest they should think twice about when they leave.',
    'At {name}, the buildings lean toward each other across narrow streets like conspirators. There is a rhythm here — market days, watch bells, the particular silence that falls after dark.',
  ],
  city: [
    '{name} is a sprawl of districts and hierarchies, walls that claim more than they contain, and the kind of chaos that comes from many people making their own decisions simultaneously.',
    'The city is so complex it seems to operate despite rather than because of the people within it. Scale makes individuals irrelevant and paradoxically gives them freedom.',
    'Layers of construction at {name} sit one atop another like geological strata — each era leaving its mark in stone and the grudges of displaced residents.',
    '{name} breathes with the heat of ten thousand cooking fires and the noise of a hundred competing interests. The city does not sleep so much as rotate which parts of it are dreaming.',
  ],
  capital: [
    '{name} is the location where the weight of political will becomes visible in stone and ceremony. It is built to last, to impress, and to remind everyone of its own importance.',
    'The capital dominates its region not just through strength but through the symbolic weight of all the nation has been and claims to be.',
    'At {name}, every avenue is a statement and every monument a argument. The capital is a city that has been told it matters so often it has come to believe it.',
    'The grandeur of {name} sits uneasily on a foundation of taxed labor and requisitioned stone. Capitals are built by the hands of people who will never walk their finest halls.',
  ],
  camp: [
    '{name} is temporary by design — structures that can be struck and rebuilt elsewhere, organized for rapid movement and reorganization.',
    'The camp is sparse and functional, lacking the permanence of even the humblest village. It exists only for the duration of necessity.',
    'At {name}, nothing is nailed down that wasn\'t meant to be carried. The fires burn hot and brief, the tents face the wind like a question asked and not yet answered.',
    'The ground at {name} is churned by boots and hooves into a map of purpose — supply lines, patrol routes, the worn paths between command tents.',
  ],
  farmland: [
    '{name} is primarily productive — fields dominate, structures are secondary. This is a location that defines itself through what it grows.',
    'The land here is organized for yield, with buildings placed to minimize interference with cultivation. The rhythm is set by seasons rather than schedules.',
    'At {name}, the earth is the architecture. Furrow rows extend to the horizon, punctuated by scarecrows that watch the fields with more patience than any living guard.',
    'The farmland at {name} feeds people it will never meet. The laborers here measure wealth in soil depth and rainfall, currencies more honest than gold.',
  ],
  castle: [
    '{name} is domination made stone — a fortress designed to project power down on the lands around it, imposing hierarchy visible in its vertical arrangement.',
    'The castle rises to claim the highest point and the right to watch all approaches. Its walls speak of violence and the determination to maintain control.',
    'The walls of {name} are thick enough to absorb screams and old enough to have absorbed many. The castle is a machine for converting fear into obedience.',
    '{name} stands as the kind of place that makes you understand why people invented siege weapons — the arrogance of its permanence invites challenge.',
  ],
  fort: [
    '{name} is built for conflict — walls first, comfort much later. Every design choice serves the singular purpose of making the location defensible.',
    'The fort is built to survive siege, made compact and angular for maximum defensive advantage. Its architecture is aggressive in its anticipation of attack.',
    'At {name}, the garrison sleeps in shifts and the walls are worn smooth by the hands of sentries. The fort\'s entire vocabulary consists of a single word: hold.',
    '{name} has the grim utility of a clenched fist. There is nothing here that doesn\'t serve the purpose of making attack expensive.',
  ],
  tower: [
    '{name} rises in vertical challenge to the sky, its height suggesting significance or desperation or both. A location defines itself by vertical reach.',
    'The tower claims space not through area but through height, making it visible from great distances. What purpose it served, it served primarily through presence.',
    'From the base of {name}, the stairs spiral upward into a dimness that smells of stone dust and ambition. Whoever built it wanted to see further than ground-dwellers.',
    '{name} is a finger pointed at the sky — an accusation, a prayer, or simply the insistence that something here mattered enough to build upward instead of outward.',
  ],
  shrine: [
    '{name} is small and focused, built around a single thing — a relic, a natural feature, a believed-in power. The space is designed for contemplation rather than trade.',
    'The shrine marks a location made holy or significant through belief and repetition of visits. Its smallness paradoxically makes it sacred.',
    'At {name}, the offerings accumulate in layers — coins, cloth strips, carved tokens. Each one represents a prayer the shrine cannot answer but faithfully collects.',
    'The shrine of {name} is the kind of place where even skeptics lower their voices. Something in the arrangement of stone and silence demands it.',
  ],
  temple: [
    '{name} is built to impress — a structure that dedicates significant resources to housing divine presence (or its claimed opposite). Scale and beauty are the primary arguments.',
    'The temple is community made visible in architecture — the structure demonstrates collective commitment to something beyond immediate survival.',
    'At {name}, the incense-thickened air carries prayers upward into vaulted ceilings designed to make the faithful feel small. The architecture is the first sermon.',
    'The temple of {name} holds its secrets in the spaces between the public rituals — the locked rooms, the restricted archives, the whispered conversations between priests at dawn.',
  ],
  mining: [
    '{name} exists because the earth beneath contains something valuable enough to justify the violation. Buildings cluster around holes in the ground.',
    'The mining location is a scar in the landscape, dug deep and reorganized for extraction. Tailing heaps and worked-over earth are the defining features.',
    'At {name}, the ground has been opened like a wound and the people who live here are the ones keeping it from healing. Dust coats everything — lungs, dreams, the water.',
    '{name} smells of crushed rock and lamp oil. The miners descend before dawn and surface after dark, pale as the ore they carry.',
  ],
  ruins: [
    '{name} is evidence that this location was once claimed and then abandoned. The ruins sit like broken teeth, speaking of failure and time.',
    'The ruins are a monument to impermanence — structures that tried to last and found lasting impossible. The decay is the primary point.',
    'At {name}, walls end mid-sentence and doorways open onto sky. The ruins preserve the shape of intention while erasing its substance.',
    'The ruins of {name} are most eloquent at dusk, when the light falls at angles the builders once calculated for and the shadows remember rooms that no longer exist.',
  ],
  ruined_tower: [
    '{name} stands half-collapsed, still reaching upward in stubborn defiance despite structural failure. Its height is now primarily its vulnerability.',
    'The ruined tower is a statement in decline — it still asserts itself vertically even as it crumbles, a monument to ambition and entropy.',
    'Birds nest in the upper floors of {name} where wizards or watchers once kept vigil. The stairs end abruptly where the wall gave way, opening onto a view the builder never intended.',
    '{name} leans at an angle that suggests it has been falling for a very long time and intends to take its time about finishing.',
  ],
  ruined_city: [
    '{name} sprawls in vast broken patterns — whole districts now wilderness, streets where trees grow through stone, buildings tumbled into each other like bones.',
    'The ruined city is a labyrinth of what-was — streets still map old boundaries, the organization still speaks of planning now overruled by decay.',
    'At {name}, you can walk through a market square where weeds sell silence to the wind. The scale of the ruin makes the original ambition feel both impressive and absurd.',
    'The plazas of {name} are amphitheaters for birds now. Somewhere under the rubble, tile floors preserve mosaics that depicted a future this city never reached.',
  ],
  ruined_village: [
    '{name} is abandonment crystallized into architecture — a handful of structures collapsing back into their component landscape, claiming less space with each season.',
    'The ruined village is intimate in its decay — you can read the specific failures of specific places, understand why they were given up.',
    'At {name}, a child\'s toy sits in the ash of a hearth that last burned years ago. The village is small enough that each ruin was someone\'s particular home.',
    'Roof beams at {name} sag into rooms where rain has been the only visitor for seasons. The village is returning to the earth with the quiet dignity of the genuinely forgotten.',
  ],
  battleground: [
    '{name} is marked by violence — broken ground, the scattered remnants of conflict, and the specific aridity that comes from ground heavily bloodied.',
    'The battleground is a location that has been contested, claimed, and reclaimed. Its topography speaks of suffering rendered into physical form.',
    'At {name}, the earth is scored and compressed in ways that suggest many feet and heavy equipment. Rusted metal surfaces after rain, like the ground is trying to return what was forced into it.',
    'Nothing grows well at {name}. The soil has been poisoned by what soaked into it, and the grass that manages to return comes back pale and thin, as if afraid.',
  ],
  oasis: [
    '{name} is an interruption of plenty in desolate country — water that draws survivors, greenery that shouldn\'t exist, and the intense crowding that abundance paradoxically creates.',
    'The oasis is where scarcity ends temporarily and the crowd that gathers around that fact creates its own pressures and economies.',
    'At {name}, palm shade and clear water create a small world that denies the desert\'s authority. The relief is so profound it feels like a lie.',
    'The oasis of {name} is jealously guarded not because water is precious — everyone knows that — but because the memory of thirst makes sharing feel like self-destruction.',
  ],
  unexplored_poi: [
    '{name} is unmapped and unknown — a location that appears on no reliable charts, inhabited by guesses and rumors rather than knowledge.',
    'The unexplored place draws those who seek what cannot be found in known lands. Its significance exists primarily in possibility.',
    '{name} exists at the edge of reliable description. Those who claim to have been there disagree on fundamental details — the terrain, the sky, the direction home.',
    'The stories about {name} multiply in the telling. Some say it is empty; others say it is full of something that resists naming.',
  ],
  wilderness: [
    '{name} is unmarked by human intention — land that has been passed through but not claimed, made into a location only by temporary presence.',
    'The wilderness is indifferent to categorization. It exists prior to and beyond human naming.',
    '{name} has the quiet hostility of a place that does not require visitors. The land is sufficient unto itself, and the silence says so.',
    'At {name}, the only paths are those worn by creatures that were here before and will be here after. The wilderness tolerates passage but does not encourage it.',
  ],
};

// ─── Faction Control Prose ───────────────────────────────────────────────────
// Generic templates for how a faction controls or shapes a location.

export const FACTION_CONTROL_PROSE: string[] = [
  '{faction} has pressed its mark into the location through repeated assertion of control — governors imposed, structures rebuilt in their image, economy organized to their benefit.',
  'The location bears {faction}\'s fingerprints not through single dramatic action but through years of accumulated adjustment and minor coercions.',
  '{faction} holds the location through force carefully applied in just sufficient amounts — the threat of greater violence keeping actual violence minimal.',
  'The location exists in {faction}\'s shadow, organized around the assumption that {faction}\'s authority is both inevitable and subject to change at arbitrary moment.',
  '{faction}\'s control is visible in the way resources move through the location — what stays, what flows elsewhere, what never arrives at all.',
  'The location is {faction}\'s now, the previous authority erased or sublimated into the new order, existing only as memory and resentment.',
  '{faction}\'s banners hang from the gateposts — not for celebration, but as a reminder. The location pays its taxes on time and keeps its complaints behind closed doors.',
  'The locals have adopted {faction}\'s customs with the surface compliance of people who know the difference between obedience and loyalty.',
  '{faction} does not garrison the location so much as inhabit it — their agents walk the markets, drink in the taverns, and listen with the patience of people who are paid to remember.',
  'Old symbols have been chiseled off the public buildings and replaced with {faction}\'s sigil. The stonework shows the scars where the old names were.',
  '{faction}\'s presence here is felt in what is absent — the missing traders, the closed guild hall, the silence where a bell tower used to ring.',
  'The location functions under {faction}\'s authority the way a river functions under a dam — efficiently, productively, and with the constant implicit threat of what happens if the structure breaks.',
];

// ─── Archetype Prose ─────────────────────────────────────────────────────────
// Core character description by archetype, can include {name} placeholder.

export const ARCHETYPE_PROSE: Record<string, string[]> = {
  tragic_hero: [
    '{name} carries the weight of fallen grandeur — a figure built for something larger than what they face, now diminished by time or choice into smaller suffering.',
    '{name} is defined by what they were and what they\'ve become — the distance between is their tragedy.',
  ],
  trickster: [
    '{name} operates in the gaps between rules, making their living in the contradiction between what\'s claimed and what\'s true.',
    '{name} is a master of useful lies and selective truths — whether it\'s wisdom or mere survival is the question hanging around them.',
  ],
  coming_of_age: [
    '{name} carries the awkwardness of being between states — not yet formed, but old enough to suspect they\'re forming into something they didn\'t choose.',
    '{name} is learning that the world is less fair than advertised and more complicated than the stories suggested.',
  ],
  brooding_warrior: [
    '{name} exists in a state of coiled violence — muscles tight with the knowledge of their own capacity to cause harm, burdened by the history of times they\'ve used it.',
    '{name} speaks in short sentences and long silences, as if words might trigger something they\'ve worked hard to keep restrained.',
  ],
  fallen_noble: [
    '{name} carries the specific resentment of someone dispossessed — the knowledge of higher stations lost cuts deeper than the knowledge of stations never held.',
    '{name} bears the contradictory marks of privilege and circumstance — refined in manner but rough in necessity.',
  ],
  true_believer: [
    '{name} possesses the certainty of absolute conviction — the kind that makes compromise appear as betrayal and doubt a kind of blasphemy.',
    '{name} is organized around a single principle, the way a blade is organized around its edge.',
  ],
  schemer: [
    '{name} thinks three moves ahead while appearing to think only of the immediate. Their patience is a weapon as real as any blade.',
    '{name} operates in layers — what they show is only the surface, calculated to guide attention away from deeper designs.',
  ],
  wanderer: [
    '{name} has been on the road long enough that staying still feels like injury. The landscape is more familiar than any fixed location.',
    '{name} travels for reasons they may or may not share — the motion itself is the point, whether it\'s running toward or away.',
  ],
  monster: [
    '{name} carries the specific isolation of being fundamentally other — shaped by circumstance or birth into something that refuses easy categories.',
    '{name} is both more and less than human — the excess and the deficit make them dangerous in opposite directions.',
  ],
  folk_hero: [
    '{name} is known to common people in the way heroes become legend — the specific details are less important than what they represent to those who tell the stories.',
    '{name} carries the burden of being larger than their actual self, existing partly in the imaginations of those who believe in them.',
  ],
  reluctant_king: [
    '{name} holds power as if it\'s a burden carried until they can hand it to someone more willing — but such someone never arrives.',
    '{name} is burdened by authority they didn\'t seek and can\'t quite refuse, leading with reluctance mistaken for wisdom.',
  ],
  oathkeeper: [
    '{name} is bound by words spoken and commitments made — the oath defines them more completely than any personal ambition could.',
    '{name} will pursue their given word into ruin rather than abandon it, making them both reliable and potentially tragic.',
  ],
  poisoned_court: [
    '{name} navigates intrigue as naturally as breathing — they know that every word is a move in a game that never ends.',
    '{name} is shaped by layers of deception and counter-deception, so practiced in lies that truth becomes merely another tool.',
  ],
  doomed_innocent: [
    '{name} is innocence colliding with reality, and the collision is not resolved — they remain innocent even as circumstances prove innocence is no defense.',
    '{name} suffers from their own goodness, and there\'s something tragic in their refusal to become hardened by it.',
  ],
  old_power: [
    '{name} carries the weight of long years — power accumulated through survival, wisdom, and the specific authority that comes from being older than the problems facing younger people.',
    '{name} speaks with the certainty of someone who has seen cycles repeat and knows the current moment to be temporary.',
  ],
  kingmaker: [
    '{name} shapes thrones and the people who sit in them, preferring power that doesn\'t require sitting still and bearing crown-weight.',
    '{name} is the voice that whispers in ears that wear crowns, and the distance gives them freedom those crowned ones don\'t possess.',
  ],
  seeker: [
    '{name} is driven by the search for something — knowledge, redemption, answer, or even the search itself. The destination is less important than the motion toward it.',
    '{name} questions everything and trusts only what they can verify themselves, making them both reliable and perpetually unsatisfied.',
  ],
  maker: [
    '{name} is defined by what they create — objects, art, organization, or even meaning. Creation is the expression of their authority over circumstance.',
    '{name} sees the world as material to be shaped, imposing intention and form on the raw stuff of reality.',
  ],
  noble_savage: [
    '{name} exists between civilization and wilderness, belonging fully to neither and drawing strength from both. They are neither noble nor savage, but both.',
    '{name} carries the knowledge of two worlds and the belonging that comes from being at home in either, which is almost like being at home in neither.',
  ],
};

// ─── Disposition Prose ───────────────────────────────────────────────────────
// CRITICAL: Cooperation strategies use HYPHENS, not underscores.

export const DISPOSITION_PROSE: Record<string, string[]> = {
  'tit-for-tat': [
    '{name} operates on clear reciprocity — what they receive, they return in kind. Kindness breeds cooperation, and betrayal breeds immediate retaliation.',
    '{name}\'s strategy is readable and fair: they trust until trust is broken, then match the breaking with precision.',
  ],
  grudger: [
    '{name} is slow to anger but impossible to forget — a single betrayal places someone permanently in the category of the untrustworthy.',
    '{name} operates on long memory. They cooperate with those who have proven reliability and exclude those who have not, permanently.',
  ],
  pavlov: [
    '{name} adapts based on whether previous interactions were rewarding or painful. They are flexible but reactive, shifting strategy based on what feels good in the moment.',
    '{name}\'s cooperation follows the pleasure principle — they\'ll work with those whose presence brings positive outcomes, flee those who bring pain.',
  ],
  'always-cooperate': [
    '{name} is fundamentally trusting, extending benefit of doubt and cooperation even when it might not be reciprocated. They believe good behavior breeds good outcomes.',
    '{name}\'s optimism is almost a form of naïveté, but it creates a kind of grace that more cynical people find difficult to exploit without feeling guilty.',
  ],
  'always-defect': [
    '{name} assumes defection in others and preempts it with their own. Trust is foreign to them — they expect betrayal and act accordingly.',
    '{name} operates on the principle that everyone is looking for advantage, so they take it first. Cooperation is impossible because cooperation would be vulnerability.',
  ],
};

// ─── Population Prose Templates ──────────────────────────────────────────────
// Describe notable inhabitants. Can use {agent} and {archetype} placeholders.

export const POPULATION_PROSE_TEMPLATES: string[] = [
  '{agent} is known to frequent the location regularly, their presence marking the place as significant in ways both visible and hidden.',
  'The people speak of {agent} with the mixture of respect and wariness reserved for those who are both necessary and dangerous.',
  '{agent} is {archetype} in the way {archetype} happens in small places — the archetype compressed and concentrated, lacking room to fully express itself.',
  'Among the inhabitants of the location, {agent} stands somewhat apart — not quite fitting the patterns, maintaining their own gravity.',
  '{agent} is the person everyone knows and no one fully understands, the kind of fixture that makes the location itself seem intentional.',
  'The local stories all include {agent} in some capacity — not always heroically, but always as the figure whose presence changed what happened.',
  '{agent} keeps their own counsel and their own hours. The neighbors have learned to read the smoke from their chimney the way sailors read clouds.',
  'Children point at {agent} in the street and are hushed by their parents — not from fear, exactly, but from the specific caution reserved for those who carry consequence.',
  '{agent} arrived seasons ago and has not left. The location has adjusted around them the way water adjusts around a stone — the flow changed but the river continuing.',
  'When {agent} is absent, the location feels lighter — not better, but thinner, as if a weight that gave the place its particular shape has been temporarily removed.',
  '{agent} trades in the market like anyone else, but the stall-keepers give them slightly better cuts and slightly quicker service. No one discusses why.',
  'The older residents remember when {agent} first came and how the location was different before. They speak of the change without judgment, the way one speaks of weather.',
];

// ─── Historical Culture Prose ───────────────────────────────────────────────
// Describes ruins and remnants of civilizations that preceded current inhabitants.
// Uses foundation bias to modulate tone: order = precision, chaos = ambition, etc.

export const HISTORICAL_CULTURE_PROSE: Record<string, string[]> = {
  order: [
    'Before the current inhabitants, this land was shaped by {histCulture} — builders of precision and devotion whose {ruinDescriptor} still stand in silent testimony to an age of meticulous craft.',
    'The {histCulture} once held this territory, their ordered ways visible in the {ruinDescriptor} that dot the landscape — remnants too well-made to crumble entirely.',
  ],
  chaos: [
    'Before the current people came, {histCulture} claimed this land — a people of restless ambition whose {ruinDescriptor} remain as monuments to brilliance that could not sustain itself.',
    'This was once the domain of {histCulture}, whose chaotic genius left behind {ruinDescriptor} — structures that even in ruin seem to defy expectation.',
  ],
  light: [
    '{histCulture} once illuminated this region, their open ways preserved in the {ruinDescriptor} that remain — built to be seen, to welcome, to endure as testament.',
    'The land remembers {histCulture}, whose devotion to revelation left behind {ruinDescriptor} — places that still seem to wait for congregations that will never return.',
  ],
  darkness: [
    '{histCulture} once held this territory in secret, their hidden ways preserved in the {ruinDescriptor} that lie half-buried — places designed to conceal as much as they sheltered.',
    'Before the current age, {histCulture} claimed this land. Their {ruinDescriptor} endure in shadowed hollows, built to keep their mysteries even in abandonment.',
  ],
  unknown: [
    'A vanished people once shaped this land. Their {ruinDescriptor} endure — monuments to a civilization that left no name the current inhabitants remember.',
  ],
};

// ─── Prosperity Prose ────────────────────────────────────────────────────────
// Prose fragments keyed by prosperity tier label.
// Used by prosperityResolver to inject economic flavor into settlement descriptions.

export const PROSPERITY_PROSE: Record<string, string[]> = {
  Flourishing: [
    'The streets overflow with merchants hawking silks no one needs, and the coins change hands so fast they never cool.',
    'Wealth here is an ambient pressure — it presses in through every door, perfumes the air with spice and ambition.',
    'The markets never fully close. Someone is always selling, always buying, always arguing the price into the small hours.',
    'A place gorged on its own success. The granaries are full, the warehouses creak, and the guilds have started arguing over precedence.',
  ],
  Prosperous: [
    'Honest trade keeps the granaries full and the taverns loud. People here have enough, which is rarer than it sounds.',
    'The market square hums with the low-level argument of commerce — not urgent, not desperate, just the daily negotiation of getting and giving.',
    'Carts come and carts go. The tolls are paid without too much complaint. Life here runs on the reliable machinery of exchange.',
    'A settlement that knows what it has and trades it shrewdly. No one is getting rich overnight, but no one is going hungry either.',
  ],
  Modest: [
    'People get by. The market has what you need, rarely what you want, and the prices have been the same since before anyone can remember.',
    'There is enough commerce to keep things moving, and not enough to cause trouble. The stalls are plain, the goods are basic, the deals are small.',
    'A careful place that watches its stores and haggles over every coin. Prosperity is possible here, with patience.',
    'The economy breathes — shallow but steady. The market square is thin but functional, the trade routes infrequent but reliable.',
  ],
  Struggling: [
    'Half the stalls stand empty. Children eye travelers\' packs with the flat assessment of hunger.',
    'The market has contracted to a core of necessities. Luxury goods left with the merchants who sold them; what remains is survival commerce.',
    'There is a smell of abandonment here — not yet ruin, but the precursor. Shops that were not shuttered have been stripped down to essentials.',
    'Debts are owed everywhere, to everyone. The currency of the struggling settlement is not coin but obligation.',
  ],
  Destitute: [
    'The settlement is a husk. Those who can leave, have. What remains is need wearing the shape of a community.',
    'Trade collapsed here and left a silence. The market square is an empty gesture — the stalls gone, the merchants long since moved on.',
    'People scavenge what the departure left behind. The economy is not in recession; it has ceased to exist.',
    'Even hope is rationed here. The settlement endures because enduring is what people do when they have nowhere else to go.',
  ],
};

// ─── Terrain-Specific Prosperity Prose ──────────────────────────────────────
// Terrain-keyed variants for prosperity descriptions. The prosperityResolver
// prefers these when the settlement's terrain matches a known category,
// falling back to generic PROSPERITY_PROSE for unknown or unmapped terrains.
// Outer key: terrain category. Inner key: prosperity tier.

/** Maps individual TerrainType values to broad terrain categories for prose lookup. */
export const TERRAIN_PROSPERITY_CATEGORY: Record<string, string> = {
  // Coastal
  coast: 'coastal',
  coastal_shallows: 'coastal',
  reef: 'coastal',
  // Mountain
  mountains: 'mountain',
  high_mountains: 'mountain',
  mountain_pass: 'mountain',
  hills: 'mountain',
  plateau: 'mountain',
  badlands: 'mountain',
  // Farmland
  farmland: 'farmland',
  grassland: 'farmland',
  floodplain: 'farmland',
  savanna: 'farmland',
  steppe: 'farmland',
  // Forest
  temperate_forest: 'forest',
  dense_forest: 'forest',
  boreal_forest: 'forest',
  jungle: 'forest',
  tropical_forest: 'forest',
  evergreen_forest: 'forest',
  light_forest: 'forest',
  dead_forest: 'forest',
  forested_hills: 'forest',
  great_home_trees: 'forest',
};

export const PROSPERITY_TERRAIN_PROSE: Record<string, Record<string, string[]>> = {
  // ── Coastal ───────────────────────────────────────────────────────────────
  coastal: {
    Flourishing: [
      'Ships crowd the harbour three-deep, their flags from ports no one here can name. The dockworkers have stopped counting cargoes and started counting coins.',
      'The harbour never sleeps. Lanterns bob on the water all night, and the tide brings in wealth with the regularity of breathing.',
      'Salt air and money — the two scents that define this place. Warehouses line the quay like teeth, and every one is full.',
    ],
    Prosperous: [
      'The fishing fleet comes in heavy most mornings, and the chandlers do brisk trade in rope and tar. A harbour town that knows the sea is generous to those who respect it.',
      'Trade ships call here on the regular routes. The harbour master keeps a clean ledger, the pilots know the shoals, and the merchants complain about tariffs — which means the tariffs are working.',
      'Nets dry in the sun alongside bolts of traded cloth. The sea provides, and the harbour converts that provision into a comfortable living.',
    ],
    Modest: [
      'A few boats go out each morning and come back with enough. The harbour is too small for the big trading vessels, so what commerce exists is local and careful.',
      'The salt trade keeps things moving, barely. Fishermen mend nets with the patience of people who have learned not to expect windfalls from the water.',
      'The quay handles what it can. Smaller vessels dock here between the real ports, and the settlement skims what trade it can from their passing.',
    ],
    Struggling: [
      'The harbour silts up a little more each season. The boats that remain are patched beyond dignity, and the catch shrinks with the shoals.',
      'Half the moorings stand empty, ropes fraying in the salt wind. The fishermen who remain eye the horizon with the flat patience of people waiting for something that may not come.',
      'Trade ships pass this port now. The lighthouse still burns, but it marks a place merchants have learned to avoid.',
    ],
    Destitute: [
      'The fishing boats rot at their moorings. The sea gives, and the sea has stopped giving.',
      'The harbour is a graveyard of keels and ambition. What the storms did not take, the creditors did. The tide comes in over bare sand where warehouses stood.',
      'Salt crusts everything — the boats, the docks, the faces of the people who sit watching the water as though it owes them something. It does.',
    ],
  },

  // ── Mountain ──────────────────────────────────────────────────────────────
  mountain: {
    Flourishing: [
      'The mines run day and night; lantern light leaks from every shaft like veins of gold in the dark rock. The smelters have not cooled in living memory.',
      'Ore carts rattle down the switchbacks in an endless procession. The settlement has grown fat on what the mountain yields, and the mountain has not yet grown tired of yielding.',
      'Stone wealth built this place — carved it right into the cliff face, terrace upon terrace, each one richer than the last. The masons here work in marble the way lowlanders work in wood.',
    ],
    Prosperous: [
      'The mines produce steadily, and the smiths keep the forges lit. Mountain trade is slow but heavy — what comes down the pass is worth the climb.',
      'Goat herds and mineral veins sustain the place in equal measure. The passes are kept clear because the merchants pay to keep them clear, and that says enough.',
      'The settlement clings to the mountainside with the tenacity of something that has earned its purchase. The stone is good, the seams are deep, and the people are careful with both.',
    ],
    Modest: [
      'The mines still produce, but the easy seams are worked through. What comes out now requires more effort for less reward, and the settlement has adjusted its expectations accordingly.',
      'Thin soil, thin herds, thin trade. The mountain gives just enough to justify staying, and the people here have made an art of sufficiency.',
      'The pass brings through a trickle of trade — enough to supplement what the goats and the shallow mines provide. Life at altitude is a negotiation with scarcity.',
    ],
    Struggling: [
      'The best seams are exhausted. Miners probe deeper into stone that gives back dust and disappointment, and the settlement shrinks with each family that descends to the lowlands.',
      'Rockfalls have closed two of the three passes, and the merchants who used to come this way have found other routes. The mountain is keeping its wealth now.',
      'The terraces are crumbling. Repairs cost more than the settlement can spare, and each winter takes a little more of what the summers built.',
    ],
    Destitute: [
      'The mountain swallowed their fortune. Now it swallows their hope. Empty shafts gape like mouths that have said everything they had to say.',
      'Stone and silence. The settlement is a series of abandoned ledges, the forges cold, the passes unmaintained. Those who remain do so because the descent is harder than the enduring.',
      'The wind through the empty mine shafts makes a sound like breathing. The mountain is alive; the settlement on its face is not.',
    ],
  },

  // ── Farmland ──────────────────────────────────────────────────────────────
  farmland: {
    Flourishing: [
      'Granaries overflow and children grow fat on butter and idleness. The harvest came in so heavy this year that the carts broke under the weight of it.',
      'The fields stretch to the horizon in ordered abundance — wheat, barley, flax, each in its season, each in surplus. This soil has never betrayed the people who work it.',
      'Fat cattle, full barns, and the particular smugness of a community that knows it feeds the cities. The grain merchants come to them now, not the other way around.',
    ],
    Prosperous: [
      'The harvest is reliable and the rotation well-managed. Farmers here have the weathered contentment of people whose gamble with the seasons has paid off more often than not.',
      'Good soil, good water, good planning. The fields are not spectacular, but they produce with a consistency that the flashier settlements envy quietly.',
      'Market day brings in buyers from three directions. The surplus is modest but real, and the root cellars are deep enough to ride out a bad year.',
    ],
    Modest: [
      'The fields produce what they must. No surplus to speak of, but no famine either — a balance maintained through labour and the careful hoarding of seed.',
      'Subsistence with dignity. The farmers here know every inch of their soil and coax from it exactly what it can give, which is enough and no more.',
      'The irrigation ditches are maintained with religious discipline. In country like this, water is the difference between getting by and going under.',
    ],
    Struggling: [
      'The fields lie half-fallow — not by choice but by exhaustion. The soil gives diminishing returns, and the farmers\' faces mirror the land.',
      'Blight took the last good harvest, and the one before that was thin. The seed stores are low, and the conversations in the evening have turned to where else one might go.',
      'The scarecrows outnumber the crows now. The fields that still produce are tended with the desperate attention of people who know what happens when the last crop fails.',
    ],
    Destitute: [
      'The fields lie fallow. Even the crows have moved on.',
      'Cracked earth and dead furrows. The farmers who remain scratch at the ground out of habit, not hope. What the drought did not kill, the locusts finished.',
      'The granaries echo. Children pick through stubble for fallen grain, and the adults watch them with the particular stillness of people who have stopped making plans.',
    ],
  },

  // ── Forest ────────────────────────────────────────────────────────────────
  forest: {
    Flourishing: [
      'Timber wealth has built this place twice over; the sawmills never rest. The river runs brown with bark dust, and the lumber yards stretch wider than the settlement itself.',
      'The forest gives and gives — charcoal, timber, game, truffles, pelts. The settlement has learned to harvest without killing, and the canopy repays that patience with abundance.',
      'Woodsmoke and prosperity. The carpenters here build from green wood that sings under the adze, and the furniture trade alone could sustain a place twice this size.',
    ],
    Prosperous: [
      'The foresters manage their stands with care, and the timber comes down the log-roads in a steady, sustainable flow. The settlement smells of sawdust and contentment.',
      'Charcoal, game, and a modest timber trade keep the place comfortable. The forest is generous to those who take from it thoughtfully, and these people are thoughtful.',
      'Mushroom harvests, coppiced wood, and the occasional trapper bringing in pelts — the forest economy is diverse enough to weather a bad season in any one trade.',
    ],
    Modest: [
      'The forest provides, but grudgingly. Firewood is plentiful, game is thin, and the timber worth hauling out requires going deeper each year.',
      'A settlement that lives in the forest\'s margins — taking what the canopy allows, building from what falls, hunting what strays close enough. Enough to survive on, carefully.',
      'The charcoal burners work their clearings in rotation, and the smoke rises from the canopy in thin columns. The economy is measured in cords and carcasses.',
    ],
    Struggling: [
      'The good timber is gone — cut too fast, hauled out too greedily. What remains is scrub and second growth, and the sawmill stands idle more days than it runs.',
      'The game has thinned. Trappers come back empty-handed with increasing frequency, and the forest that once felt generous now feels indifferent.',
      'They cut deeper into the old growth each season, and each season the forest closes in behind them as though reclaiming what was taken. The settlement is losing a slow negotiation.',
    ],
    Destitute: [
      'They cut the last good tree a season ago. Now they burn green wood and cough.',
      'The stumps outnumber the standing trees. The settlement sits in a clearing it made by consuming its own future, and the mud where the canopy used to hold the rain is ankle-deep.',
      'The forest has withdrawn. Where there were game trails there is bracken; where there was timber there is rot. The settlement persists in a landscape that has finished with it.',
    ],
  },
};

// ─── Agent Wealth Prose ─────────────────────────────────────────────────────
// Economic standing descriptions keyed by WealthTier. Fires for any actor
// with a wealth property. Threadbare aesthetic: wealth is visible, poverty is felt.

export const WEALTH_PROSE: Record<string, string[]> = {
  Magnate: [
    '{name} wears wealth the way others wear skin — it is not decoration but architecture, load-bearing and impossible to remove.',
    'Gold follows {name} like a scent. The silk is obvious; the real currency is the silence that falls when they enter a room.',
    'There is a gravity to {name} that has nothing to do with mass. Merchants orbit, debts align, and even the local lord measures their words carefully.',
    'Every thread on {name} was chosen by someone paid to choose threads. The opulence is not vulgar — it is structural, woven into posture and expectation.',
  ],
  Wealthy: [
    '{name} eats well and sleeps warm, which in this age passes for triumph. The retinue is fed, the cloak is lined, and there is always a second horse.',
    'Comfort sits on {name} like good tailoring — not ostentatious, but unmistakable to anyone who has gone without.',
    '{name} has the particular ease of someone who does not count coins at the end of the day. Not rich enough to forget money exists, but rich enough not to think about it before breakfast.',
  ],
  Comfortable: [
    '{name} keeps clean hands and a clean ledger, which is more than most can manage. The merchant class recognizes its own.',
    'There is a careful solidity to {name} — bills paid, stores counted, one eye always on the margins. Comfort here is a verb, not a state.',
    '{name} is neither hungry nor sated. The cloak is serviceable, the boots are resoled but not worn through, and the purse has weight enough to negotiate.',
  ],
  'Getting by': [
    '{name} has the watchful look of someone who knows exactly how many coins are left and what each one must buy.',
    'The cloak is patched, the boots are thin, and {name} walks with the careful economy of a person one bad season from real trouble.',
    '{name} counts in copper. Every purchase is a negotiation with tomorrow — what can be deferred, what cannot, and what might not matter if the winter is hard enough.',
    'There is a thinness to {name} that is not quite hunger but remembers its shape. Meals are planned, luxuries are stories, and charity is received with the stiff dignity of the almost-poor.',
  ],
  Destitute: [
    '{name} is threadbare in the literal sense — the economy chewed them up and left the fibers. What remains is need wearing a name.',
    'Hollow-eyed and careful, {name} moves through the market like a ghost through a feast. Everything is for sale because nothing is left to keep.',
    'Poverty has stripped {name} to function. The gaze is flat, the hands are quick, and dignity is a luxury that was sold three seasons ago.',
    '{name} carries the particular desperation of someone who once had more. The fall is written in their posture — shoulders that remember standing straight.',
  ],
};

// ─── Region Etymology Prose ─────────────────────────────────────────────────
// Explains why a region has its current name, linking it to historical culture.

export const REGION_ETYMOLOGY_PROSE: string[] = [
  'The locals call this expanse {regionName} — a name that echoes {histCulture} speech, though few remember the original tongue.',
  'This territory is known as {regionName}, a name that has outlived the {histCulture} who first spoke it, worn smooth by generations of mispronunciation.',
  '{regionName} — the name itself is a fossil, a {histCulture} phrase that survived the culture that coined it.',
  "The region's name, {regionName}, derives from {histCulture} cartography — their maps outlasted their mapmakers.",
];
