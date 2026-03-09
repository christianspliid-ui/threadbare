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
  ],
  farmland: [
    'Tilled earth in neat desperation — rows where survivors once fought the soil for bread. The fields lie half-fallow now, memory of labor soaked into furrowed ground.',
    'Scattered stone walls divide the farmland into claims and counter-claims. What grows here grows despite the world\'s indifference.',
    'The soil is worked but worn thin. Fences lean at angles that suggest they have forgotten what they were meant to keep in or out.',
  ],
  savanna: [
    'The golden grass rolls shallow like a living thing, sparse enough to show the scored red earth beneath. Heat seems to press down from above rather than rise from the ground.',
    'Low trees stand like survivors of a long siege, their shapes tortured into wind-pattern testimony. The savanna forgets quickly what it witnesses.',
    'Scattered acacia reach skyward with the desperation of prayer. The grass between them speaks in whispers only the dust understands.',
  ],
  steppe: [
    'A vast monotony of low scrub and stone beneath a sky that offers no mercy. The wind carries the same song across a hundred leagues without change.',
    'Wind-carved earth where nothing stands tall. The steppe teaches that survival means becoming small, becoming patient, becoming indifferent to suffering.',
    'Sparse grass clings to stony ground as if through sheer stubbornness. The horizon vanishes into wind-driven haze at the distance where sky and earth forget they are separate.',
  ],
  deciduous_forest: [
    'A forest of leafless grey boughs standing in November light — limbs skeletal against dark sky. The forest floor is ankle-deep in rot that smells of time.',
    'Birches and oaks lean together as if sharing secrets the world need not hear. Light falls in rays through the canopy, illuminating nothing but the emptiness between.',
    'The forest stands in permanent dusk, its understory thick with shadow and fallen wood. Here, growth and decay pulse in the same breath.',
  ],
  dense_forest: [
    'The forest closes in with the weight of a tomb, ancient trees pressed shoulder to shoulder. Sunlight struggles to reach the floor where ferns uncoil in perpetual twilight.',
    'Darkness pools between the trunks like water. The air tastes of mold and deep time, of cycles that continue with or without witness.',
    'In the dense green maze, the trees become less individual and more a single breathing organism. A stranger here is swallowed very gently.',
  ],
  taiga: [
    'Conifers stand in grey-green ranks under a low sky that has forgotten how to brighten. The earth beneath is half-frozen, neither truly solid nor entirely yielding.',
    'Sparse spruce and larch cling to granite, their branches laden with ice even in mild seasons. The silence here is profound and intentional.',
    'The boreal forest is patient and unforgiving. Moss and lichen cover all wounds, slowly erasing the scars of any intrusion.',
  ],
  jungle: [
    'The jungle is violent in its indifference — life strangling life in the dripping green darkness. Every leaf hides teeth, every shadow contains moisture and hunger.',
    'Vines hang like nooses from canopy to canopy. The air is thick enough to drink. Life here consumes itself in endless green fury.',
    'Ancient trees rise from tangle and shadow, their roots seeking purchase in mud that remembers nothing. The jungle teaches that survival requires becoming part of the rot.',
  ],
  swamp: [
    'Water and earth cannot decide which is dominant, so the swamp exists in neither state. Mist rises in coils as if the ground itself is breathing in shallow gasps.',
    'The swamp is patient. It absorbs what falls into it without judgment or mercy, slowly converting all things into the dark water and darker earth.',
    'Cypress and mangrove stand knee-deep in water that reflects no sky. The air is thick with spore and decay, with the exhalation of a thousand slow deaths.',
  ],
  bog: [
    'The bog is a place of slow surrender. Sphagnum moss covers everything in a pale shroud, soft and deceptive as a liar\'s promise.',
    'Water dark as peat stains everything that touches it. The bog preserves the dead for centuries, keeping them fresh for a remembering that will never come.',
    'Stunted plants cling to the acidic soil in shapes twisted by hopelessness. Nothing thrives here — only endures in diminished form.',
  ],
  hills: [
    'The hills roll in patient waves of stone and grass, old enough to have forgotten they were mountains. Each ridge holds shadow like a secret.',
    'Slopes fold back on themselves in ridges that suggest intention long forgotten. The hilltops offer no triumph, only the hollow certainty of coming down.',
    'Worn and weathered to stumps of their former grandeur, the hills persist in quiet degradation. Each season steals something small they cannot miss.',
  ],
  mountains: [
    'The mountains tower in stone indifference, their peaks hidden in clouds that never fully break. They have stood longer than kingdoms rise and fall like breath.',
    'Rock faces scarred by avalanche and ice. The mountains are ancient and patient, grinding down all ambition into fine sediment.',
    'Peaks cloaked in perpetual shadow, their slopes a labyrinth of crag and scree. The mountains ask nothing and care for nothing.',
  ],
  plateau: [
    'The flat-topped expanse rises abruptly from lower lands, a table set for gods who never come to dine. The edges drop into shadow so complete it seems to contain sound.',
    'Wind screams across the open plateau, unbroken and relentless. The land here is honest — no pretense, no shelter, only exposure.',
    'The plateau surface is scarred stone and sparse scrub, with horizons that extend beyond the eye\'s ability to track. Here the sky dominates.',
  ],
  badlands: [
    'The earth has been tortured into fantastic shapes — ridges and gorges carved by water that has long since fled. The stone is painted in layers of rust and ash.',
    'A maze of canyons where the earth reveals its secret strata, each layer telling of older worlds. The badlands are broken country that teaches its own lessons.',
    'Color without life — rust and orange and purple shadows in formations that suggest anguish given form. The badlands are beautiful and utterly hostile.',
  ],
  desert: [
    'Sand stretches without mercy or marker, the horizon a suggestion that may be illusion. Heat and silence are the only constants.',
    'The desert is honest — it offers nothing, demands everything, and forgets both giver and taker with equal indifference.',
    'Dunes shift like living things under a merciless sun that seems closer here. The desert teaches that survival requires becoming empty inside.',
  ],
  tundra: [
    'Permafrost underlies a thin skin of struggling moss and sedge. The tundra is vast and empty, a place where the earth and sky have made peace through mutual abandonment.',
    'Wind hammers across flat, treeless country where nothing stands tall enough to cast shadow. The cold is not just temperature — it is the absence of warmth translated into physical force.',
    'The tundra is patient and eternal, waiting for the brief season of chaos before returning to perfect, empty silence.',
  ],
  glacier: [
    'Ice fields stretch toward horizons that exist in perpetual white. The glacier is time made visible — compressed snow and trapped air from eons past.',
    'Crevasses split the smooth ice in patterns that change with the grinding seasons. The glacier moves with the patience of geology.',
    'Here in the depths of ice, the world is simplified to cold, silence, and the slow crush of accumulated time.',
  ],
  volcanic: [
    'The volcanic plain is studded with cones both fresh and ancient, their slopes dark with basalt and ash. Steam rises from cracks in the earth like the world\'s breath.',
    'The ground here remembers violence and promises it may repeat. Lava formations twist into shapes that suggest rage given physical form.',
    'The volcanic land is bare and mineral — stone in its rawest states, colored by ancient fire. Life struggles to find purchase on ground so recently unmade.',
  ],
  broken_lands: [
    'The landscape is shattered as if by cosmic violence — stone torn into jagged formations, earth split into chasms that hold their own weather.',
    'Reality seems fractured here, ground and sky not quite trusting each other. The broken lands are where the world went wrong and never quite healed.',
    'Terrain folds in impossible angles, creating labyrinths of stone and shadow. Navigation is less about direction and more about survival.',
  ],
  great_home_trees: [
    'Titanic trees rise beyond the scope of mortal comprehension, their trunks wider than towers, their canopy lost in eternal cloud. The world beneath is always twilight.',
    'The ancient trees are their own forests, each trunk a landscape unto itself. Soil and moss accumulate on branches thicker than any normal tree.',
    'In the shadow of the great home trees, scale becomes meaningless. Individual lives are less than insects on the bark of infinitely old wood.',
  ],
  forested_hills_evergreen: [
    'The evergreen forest rolls in hills that rise and fall like waves, green-black against grey sky. The canopy is thick enough to turn afternoon into dusk.',
    'Conifers climb the slopes in dense ranks, their darkness suggesting depth that swallows light. The forest floor is soft with needle and decay.',
    'The forested hills stand in permanent twilight, where growth and rot happen simultaneously in the deep shade.',
  ],
  forested_hills_deciduous: [
    'The deciduous forest cloaks the rolling hills in patterns of branch and bare wood. In the seasons between, the landscape is honest about its emptiness.',
    'Hills rise and fall beneath a canopy that changes like breath — full in spring, skeletal in winter, never truly generous. The forest is patient.',
    'The forest-covered slopes suggest shelter that the deeper you venture, proves illusory. Within the trees, the horizon closes in quickly.',
  ],
  forested_hills_jungle: [
    'The jungle clings to the slopes with suffocating intensity — green so vivid it seems to drain color from the sky. The hills become terrain features rather than distinct formations.',
    'Vines and massive trees struggle for dominion, creating a layered landscape where ground level is a different world from canopy. Everywhere is shadow and struggle.',
    'The jungle hills are labyrinthine and hostile, where even the native creatures find the density oppressive. Green is not peace here — it is competition.',
  ],
};

// ─── Culture Location Prose ──────────────────────────────────────────────────
// How foundation pairs shape the character of a settlement or region.

export const CULTURE_LOCATION_PROSE: Record<string, string[]> = {
  order_light: [
    'The location bears the marks of Order-and-Light cosmology — straight-lined architecture, deliberate organization, and careful planning made visible in stone and geometry. Light sources are placed to illuminate purpose, not hide shadow.',
    'Here, chaos is organized into systems. The Light tempers Order\'s rigidity — there is beauty in the geometry, warmth in the golden hour illumination on careful angles.',
    'Every structure speaks of intention and forward planning. Laws are written in the arrangement of buildings. The Light brings safety but also exposure — nothing is hidden.',
  ],
  order_darkness: [
    'The settlement speaks of Order in service to Darkness — structures are deliberate and contained, designed to hide as much as reveal. Beauty exists in hidden symmetries.',
    'Darkness is imposed through careful architecture. Gates and walls frame and compartmentalize space. Order provides stability but the Darkness ensures that order hides rather than reveals.',
    'The streets follow rational patterns but lead toward shadows rather than light. Hierarchy is made architectural — the higher and inner one goes, the deeper the shadows pool.',
  ],
  chaos_light: [
    'Chaos channeled through Light creates a settlement that is organic and sprawling, yet suffused with vitality and sudden illumination. The architecture seems to grow rather than be built.',
    'The Light breaks through Chaos into moments of brilliant clarity. The settlement has no fixed form — it changes, adapts, and grows in unexpected directions.',
    'Here, rules are suggestions. The Light reveals the constant flux beneath, the endless rearrangement of pieces into new patterns. It is vibrant, exhausting, and dangerous.',
  ],
  chaos_darkness: [
    'The settlement is pure chaos given form through Darkness — structures are unstable, purposes shift like shadows, and the Darkness hides the consequences of disorder.',
    'Nothing is fixed here except the understanding that nothing will be fixed. The Darkness provides cover for the chaos to operate without judgment.',
    'The location is volatile and unpredictable. Safety means staying near what you know, because the Darkness and Chaos together make the next street a foreign country.',
  ],
};

// ─── Sphere Location Prose ───────────────────────────────────────────────────
// How each Creation Sphere\'s dominant influence manifests at a location.

export const SPHERE_LOCATION_PROSE: Record<string, string[]> = {
  force: [
    'The location carries the mark of Force — impact points visible in shattered structures, violence made architecture. Conflict shapes the settlement itself.',
    'Scars of impact and explosion mar the landscape. Force speaks through destruction and the terrible clarity that comes after things break.',
  ],
  matter: [
    'Matter dominates the region — stone is solid and dependable, mineral wealth draws inhabitants, and the earth itself seems more present and less yielding.',
    'The settlement is built deep into stone, walls are impossibly thick, and resources are fought for with geometric precision. Matter provides but demands respect.',
  ],
  energy: [
    'The location thrums with radiant Energy — patterns of activity, brightness, and ceaseless motion. Even the quiet moments feel like a held breath.',
    'Energy manifests as cycles and rhythms — the settlement pulses with life, activity, and cycles of exhaustion and renewal. Nothing here is still.',
  ],
  life: [
    'Life is dominant here — growth is visible in the decay of old structures under vine and moss, in the way nature claims back human works. The boundary between tended and wild is blurred.',
    'The settlement is part of the ecosystem rather than separate from it. Life flows through it, and death feeds new life in visible cycles.',
  ],
  mind: [
    'Mind shapes the location into patterns of thought made manifest — libraries, schools, spaces for gathering and contemplation. The architecture reflects intellectual organization.',
    'The settlement is built around centers of learning and memory. Every structure speaks to the value of knowledge and the organization of understanding.',
  ],
  spirit: [
    'Spirit manifests as transcendence — the settlement is oriented toward the sky, built in imitation of other worlds, and contains spaces meant for purposes beyond the physical.',
    'The location is thin — the boundary between worlds is permeable here, and the settlement\'s architecture acknowledges realities beyond the material.',
  ],
  time: [
    'Time marks the location visibly — layers of construction on construction, ruins of older settlements visible beneath newer ones. The past is present here.',
    'The settlement exists in multiple temporal states simultaneously — echoes of older cities, prophecies of future ones, all visible in how it is built and rebuilt.',
  ],
  entropy: [
    'Entropy is the dominant force — decay visible in every structure, entropy eroding stability, and the slow dissolution of all things the only certainty.',
    'The settlement crumbles slowly and steadily. Nothing is permanent here, and the entropy that claims it does so with patient inevitability.',
  ],
};

// ─── Subtype Establishing Prose ──────────────────────────────────────────────
// Location type establishing prose, can include {name} placeholder.

export const SUBTYPE_ESTABLISHING_PROSE: Record<string, string[]> = {
  hamlet: [
    '{name} is barely a place — a handful of structures that claim the land more through habit than permanence. It exists because leaving is harder than staying.',
    'A scatter of buildings around a well or crossing, {name} is the sort of place travelers barely notice they\'ve passed through.',
  ],
  town: [
    '{name} has accumulated enough structure to claim a market and a watch, though its stone looks perpetually temporary, as if it might scatter back to component parts without notice.',
    'The town sprawls in practical grids and circles, buildings close-packed in the way of places where safety is found in proximity rather than walls.',
  ],
  city: [
    '{name} is a sprawl of districts and hierarchies, walls that claim more than they contain, and the kind of chaos that comes from many people making their own decisions simultaneously.',
    'The city is so complex it seems to operate despite rather than because of the people within it. Scale makes individuals irrelevant and paradoxically gives them freedom.',
  ],
  capital: [
    '{name} is the location where the weight of political will becomes visible in stone and ceremony. It is built to last, to impress, and to remind everyone of its own importance.',
    'The capital dominates its region not just through strength but through the symbolic weight of all the nation has been and claims to be.',
  ],
  camp: [
    '{name} is temporary by design — structures that can be struck and rebuilt elsewhere, organized for rapid movement and reorganization.',
    'The camp is sparse and functional, lacking the permanence of even the humblest village. It exists only for the duration of necessity.',
  ],
  farmland: [
    '{name} is primarily productive — fields dominate, structures are secondary. This is a location that defines itself through what it grows.',
    'The land here is organized for yield, with buildings placed to minimize interference with cultivation. The rhythm is set by seasons rather than schedules.',
  ],
  castle: [
    '{name} is domination made stone — a fortress designed to project power down on the lands around it, imposing hierarchy visible in its vertical arrangement.',
    'The castle rises to claim the highest point and the right to watch all approaches. Its walls speak of violence and the determination to maintain control.',
  ],
  fort: [
    '{name} is built for conflict — walls first, comfort much later. Every design choice serves the singular purpose of making the location defensible.',
    'The fort is built to survive siege, made compact and angular for maximum defensive advantage. Its architecture is aggressive in its anticipation of attack.',
  ],
  tower: [
    '{name} rises in vertical challenge to the sky, its height suggesting significance or desperation or both. A location defines itself by vertical reach.',
    'The tower claims space not through area but through height, making it visible from great distances. What purpose it served, it served primarily through presence.',
  ],
  shrine: [
    '{name} is small and focused, built around a single thing — a relic, a natural feature, a believed-in power. The space is designed for contemplation rather than trade.',
    'The shrine marks a location made holy or significant through belief and repetition of visits. Its smallness paradoxically makes it sacred.',
  ],
  temple: [
    '{name} is built to impress — a structure that dedicates significant resources to housing divine presence (or its claimed opposite). Scale and beauty are the primary arguments.',
    'The temple is community made visible in architecture — the structure demonstrates collective commitment to something beyond immediate survival.',
  ],
  mining: [
    '{name} exists because the earth beneath contains something valuable enough to justify the violation. Buildings cluster around holes in the ground.',
    'The mining location is a scar in the landscape, dug deep and reorganized for extraction. Tailing heaps and worked-over earth are the defining features.',
  ],
  ruins: [
    '{name} is evidence that this location was once claimed and then abandoned. The ruins sit like broken teeth, speaking of failure and time.',
    'The ruins are a monument to impermanence — structures that tried to last and found lasting impossible. The decay is the primary point.',
  ],
  ruined_tower: [
    '{name} stands half-collapsed, still reaching upward in stubborn defiance despite structural failure. Its height is now primarily its vulnerability.',
    'The ruined tower is a statement in decline — it still asserts itself vertically even as it crumbles, a monument to ambition and entropy.',
  ],
  ruined_city: [
    '{name} sprawls in vast broken patterns — whole districts now wilderness, streets where trees grow through stone, buildings tumbled into each other like bones.',
    'The ruined city is a labyrinth of what-was — streets still map old boundaries, the organization still speaks of planning now overruled by decay.',
  ],
  ruined_village: [
    '{name} is abandonment crystallized into architecture — a handful of structures collapsing back into their component landscape, claiming less space with each season.',
    'The ruined village is intimate in its decay — you can read the specific failures of specific places, understand why they were given up.',
  ],
  battleground: [
    '{name} is marked by violence — broken ground, the scattered remnants of conflict, and the specific aridity that comes from ground heavily bloodied.',
    'The battleground is a location that has been contested, claimed, and reclaimed. Its topography speaks of suffering rendered into physical form.',
  ],
  oasis: [
    '{name} is an interruption of plenty in desolate country — water that draws survivors, greenery that shouldn\'t exist, and the intense crowding that abundance paradoxically creates.',
    'The oasis is where scarcity ends temporarily and the crowd that gathers around that fact creates its own pressures and economies.',
  ],
  unexplored_poi: [
    '{name} is unmapped and unknown — a location that appears on no reliable charts, inhabited by guesses and rumors rather than knowledge.',
    'The unexplored place draws those who seek what cannot be found in known lands. Its significance exists primarily in possibility.',
  ],
  wilderness: [
    '{name} is unmarked by human intention — land that has been passed through but not claimed, made into a location only by temporary presence.',
    'The wilderness is indifferent to categorization. It exists prior to and beyond human naming.',
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
];
