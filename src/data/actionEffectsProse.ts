/**
 * actionEffectsProse — the plain-prose "effects line" for an action (THR-639).
 *
 * One plain-register sentence stating what an action does, what it touches, and
 * what it costs — the line the player reads on a focused ActionCard face (both the
 * Action Drawer and the Ascendant Beat unlock modal share it). Distinct from
 * `template.technicalEffect`, which is the wiki-facing mechanical "Effect" block
 * (THR-610); this is player prose, second person, addressed to the god.
 *
 * Voice: plainspoken Malazan baseline, no peak lyricism — these are instructional
 * lines the player reads while deciding (THR-609: interactive text is always plain).
 *
 * Resolution order (composition-first with authored overrides, mirroring the
 * Motive Receipt pattern, THR-631):
 *   1. ACTION_EFFECTS_PROSE[template.id] — authored override body.
 *   2. Composed fallback from crudType + targetCategories (what it does + what it
 *      touches), degrading to a reach-generic when it cannot classify.
 * The essence-cost clause is appended uniformly at the end so the cost is always
 * interpolated from the template, never hardcoded in an authored string.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';

// ─── Constants (NFP #1) ──────────────────────────────────────────────────────

/**
 * Soft cap for authored effects-line bodies (the sentence before the cost clause).
 * Advisory — enforced by review discipline, not at runtime.
 */
export const EFFECTS_LINE_MAX_CHARS = 140;

// ─── Authored overrides ──────────────────────────────────────────────────────

/**
 * Authored effect bodies for every grantable action (all spine + pool beat
 * `grantsActionIds`, enumerated from `ascendant-beat-content.ts`). Bodies carry NO
 * cost — the cost clause is appended by `actionEffectsProse`. Keep each ≤
 * EFFECTS_LINE_MAX_CHARS, plainspoken, second person addressing the god.
 */
export const ACTION_EFFECTS_PROSE: Record<string, string> = {
  // — First Thread + starter pool: attention & sight —
  bind_thread_agent:
    'Draws a thread of your attention to a mortal, opening your divine actions upon them.',
  bind_thread_location:
    'Draws a thread to a place, letting you watch it and act upon it from afar.',
  observe_agent:
    'Turns your sight on a mortal, laying bare what they can do and what weighs on them.',

  // — Interventions granted by the introduction beat —
  'divine.persuade':
    "Presses a conviction into a mortal's mind, pulling their choices toward the virtue your reach names first.",
  'divine.dream':
    'Sends a dream to a sleeping mortal: whichever way they already lean on the question your reach asks, they lean harder.',
  'divine.omen':
    'Sets a sign in the world for mortals to read, pulling those who heed it toward your intent.',
  'divine.inspire':
    'Kindles sudden purpose in a mortal, driving them to pursue a calling with fierce resolve.',

  // — Per-graph expression verbs (imbue / consecrate / bestow / anoint) —
  'action.imbue':
    'Presses a sliver of your nature into an artifact, waking a power shaped by your sphere.',
  'action.consecrate':
    'Hallows a holy place so the faithful gathered there are drawn toward your design, while you sustain it.',
  'action.consecrate-relic':
    'Enshrines a relic that keeps a holy place hallowed on its own — until the relic is destroyed.',
  'action.bestow':
    'Leaves a portion of your strength in a faithful mortal, quickening them in your art.',
  'action.teach_spell':
    'Puts a working of your own into a faithful mortal’s hands. Dark magic taught is dark magic answered for.',
  'action.anoint':
    'Marks a whole faction as chosen, lifting every hand that serves under it while your regard holds.',

  // — Divine-economy source loop (THR-611) —
  'loc.find_source':
    'Casts your sight across the land to reveal hidden wellsprings of essence you might claim.',
  'loc.claim_source':
    'Takes an uncontrolled wellspring for your own, and it begins to feed you the essence of its nature.',
  'loc.consecrate_source':
    'Dedicates a place to your foremost sphere as a wellspring that feeds you — dormant at first, but yours to raise.',
  'loc.sanctify_source':
    'Pours devotion into a wellspring you hold, drawing it toward its flowering and far greater yield.',
  'loc.defend_source':
    'Drives off whatever bleeds a wellspring of yours and mends it, holding it against rival gods.',

  // — First divine economic verbs (THR-616 P2) —
  'loc.bless_harvest':
    'Swells a settlement\'s harvest and stores toward plenty; the fields yield more than the season should allow, and its best fields yield more for a season.',
  'loc.blight':
    'Turns a settlement\'s harvest against itself, drawing its fields and stores down toward famine, and its best fields yield little for a season.',

  // ─── THR-1002: the rest of the two predicates ─────────────────────────────
  //
  // Every id `collectGrantedActionIds()` returns, and every actor-targeted member
  // of `AGENT_INTERVENTION_TEMPLATES` — the two decks a player can actually hold.
  // Before this, 32 of them fell through to the composed fallback, which prints
  // *"Works your will upon a mortal, reshaping it toward your intent."* for every
  // `update`-on-agent card in the game: eleven cards, one sentence, no way to tell
  // Embolden from Intimidate on the face. `actionEffectsProse.test.ts` pins the two
  // predicates so the gap cannot silently reopen.
  //
  // Register (unchanged): plainspoken, present tense, second person addressing the
  // god, naming the core concept the effect touches. No numerals — the price is
  // pips and the odds are a word (Law 13).

  // — Divine influence: the four remaining intervention verbs —
  'divine.deceive':
    'Drapes an illusion over a mortal\'s senses, so they act on a world that is not there.',
  'divine.intimidate':
    'Presses terrible authority onto a mortal\'s will, until resistance feels pointless.',
  'divine.coincidence':
    'Arranges chance around a mortal so the opening they need is simply there.',
  'divine.afflict_bless':
    'Reaches into a mortal\'s flesh and remakes their condition — to their good or their ruin.',
  'divine.rekindle_thread':
    'Pours your own fire back into a mortal worn past answering, and lets them rise again.',
  // THR-1969 — the god's stake S3 (plan § Content S3, card text).
  'action.means.fortunes_favour':
    'Fortune smiles on a mortal: they rise one step in the world\'s eyes.',
  'action.means.ruin':
    'Ruin finds a mortal: they fall one step.',

  // — Relay: acting through a bonded mortal —
  'divine.relay.compose_a_clue':
    'Sets a certainty about a ruin into a bonded mortal\'s mind, whole and unearned.',
  'divine.relay.whisper_the_direction':
    'Turns a bonded mortal\'s next steps toward the nearest ruin, without their knowing why.',

  // — The god acting on itself —
  'divine.self.stillness':
    'Draws your attention inward and lets essence pool in the space of that letting-go.',
  'divine.self.recede':
    'Gathers your power inward, so the next working you attempt asks less of you.',
  'divine.self.focus':
    'Narrows your intent to one point, lifting the next working you attempt above its station.',
  'divine.self.reveal':
    'Strips the veil from your avatar and stands openly in the world, for mortals to see.',

  // — Sight: the revelation verbs —
  'scry_agent':
    'Holds your gaze on a mortal until every concealment gives way and their whole nature shows.',
  'whisper_insight':
    'Reaches into a mortal\'s inner world and returns with what they truly want.',
  'dream_sending':
    'Visits a mortal\'s sleep and reads the ambitions and fears that drive their waking life.',

  // — Thread: the bonds you cast —
  'bind_thread_faction':
    'Draws a thread to a faction, opening their collective ambitions to your sight and your hand.',
  'bind_thread_army':
    'Draws a thread to a marching host, following where it goes and what it does on the way.',
  'bind_thread_agent_strong':
    'Forces a deep thread through the veil to a mortal, bound at devotion from the first moment.',

  // — Social contest —
  'action.social.tip_scales':
    'Breathes a word into a mortal\'s argument, tilting the contest toward the side you favour.',
  'action.social.embolden':
    'Fills a mortal with the certainty that they are not alone, and hardens them against the answer.',

  // — Secrets and debts —
  'action.secrets.reveal_secret':
    'Speaks a held secret about a mortal into the world, where it becomes currency.',
  'action.secrets.plant_secret':
    'Seeds a false secret about a mortal, believed because it is what others already suspect.',
  'action.secrets.call_in_favor':
    'Stirs the memory of a debt in a mortal chest, and lets the favour owed come due.',

  // — Standing and succession —
  'action.anoint-champion':
    'Lays an unseen mantle on a mortal, so their deeds in a faction weigh far heavier for a time.',
  'action.faction.anoint_successor':
    'Weaves a thread of inheritance around a mortal, to catch when the crown they serve falls.',

  // — Company: the fellowship verbs —
  'company.bless':
    'Lays a grace over a travelling company, drawing frayed loyalties back toward one another.',
  'company.draw_together':
    'Lets every kindred soul you have touched feel the pull of one wanderer, and turn toward them.',
  'company.reunite':
    'Reminds the survivors of a broken fellowship what they were, and calls them back to it.',
  'company.sunder':
    'Works a wedge into the small spaces between companions, until every grievance cuts deeper.',

  // — Place: the settlement verbs —
  'loc.open_markets':
    'Draws trade through a settlement\'s square, lifting its prosperity and easing its unrest.',
  'loc.bless_holding':
    'For a year, whoever holds this place draws half again from it.',
  'loc.reveal_vein':
    'Draws divine sight through soil and stone until a seam worth digging answers back, and its richest stone runs fuller for a season.',
  'loc.guide_caravan':
    'Walks unseen beside a settlement\'s wagons, so every road that feeds it runs safer and fuller.',
  'loc.sour_mine':
    'Closes the hand of the land beneath a settlement, and its diggings pinch to nothing; its best quarry yields little for a season.',

  // — Held ground: the four cards of the held-ground milestone (THR-1747) —
  'hex.tap_source':
    'Draws a steady siphon of spirit from a source on the land, and it gives back more than it takes.',
  'hex.claim_resource':
    'Claims a good of the land: it feeds you in its own sphere while you hold it, more when the land has plenty.',
  'hex.claim_dominion':
    'Sinks a claim into the land and holds it as yours, deepening your sway there while it lasts.',
  'loc.place_of_power':
    'Wakes the deep lines under a place, and the magic gathering there grows thick.',

  // ─── The market: every card the offering can deal (THR-1855) ───────────────
  // Before THR-1855 these fell to the composed line, so cards like Amplify the Flow
  // and Ward Against the Deep read the same sentence side by side in one offering.

  // — Faction verbs —
  'action.divine-edict':
    'Speaks one word into a faction\'s conclave, and the side you favour carries the vote.',
  'action.faction.stir_dissent':
    'Breathes old grievances into a faction\'s councils, and quiet dissent gathers among its members.',
  'action.faction.whisper_leader':
    'Leans close to a faction\'s leader, tilting their next great decision the way you name.',
  'action.faction.recover_doctrine':
    'Returns a teaching you found in the ruins to the faction that lost it, and its members remember.',
  'action.faction.surface_doubter':
    'Lets the faction member who agrees with it least feel your gaze, and they must choose a side.',
  'action.faction.kindle_a_calling':
    'Fans a faction\'s hidden want into a new purpose, though you cannot choose which want rises.',
  'action.faction.schism':
    'Plants a split in a faction\'s faith; before long it breaks in two.',

  // — Perception: ruins and the weave —
  'divine.perceive.cast_attention':
    'Searches a ruined hex for a buried site, and a nearby bonded mortal gains a faint lead to it.',
  'divine.perceive.refine_the_hush':
    'Sharpens a bonded mortal\'s faint lead to a ruin into a clear one, or plants a clear lead outright.',
  'divine.perceive.listen_for_a_name':
    'Draws from a ruin\'s stones the name of the people who built it, and a bonded mortal nearby learns it.',
  'divine.perceive.read_the_threads':
    'Reads the weave over a hex for a sleeping Place of Power, and a threaded mortal gains a lead to it.',
  'divine.perceive.taste_the_wake':
    'Tastes the marks other gods have left on the mortals of a hex, exposing whoever else is watching.',

  // — Great works: one per sphere —
  'invest.gold.patronage_network':
    'Threads your patronage through a settlement\'s trade, and every deal there pays you a tithe of essence.',
  'invest.shadow.brokers_web':
    'Spins a web of informants through a faction, so its secrets and its levers come quietly to you.',
  'invest.star.beacon_of_fate':
    'Sets a light in a far mortal\'s path, and a calling takes shape around them beyond your usual reach.',
  'invest.eye.deep_eye':
    'Sees beneath a place into what the age buried there, and opens a path toward the lost work.',
  'invest.heart.sworn_oath':
    'Binds a place with an oath, and the faithful who gather there are drawn ever deeper into your service.',
  'invest.iron.warhost':
    'Wakes a faction\'s hunger for war, and an army musters under banners that fight for you.',
  'invest.veil.rend_the_gate':
    'Tears the world open at a place, and your sphere floods through the wound for as long as you hold it.',
  'invest.stone.great_work':
    'Raises a wonder from the land\'s deep bones at a place, with a relic set within it.',

  // — Places —
  'loc.ward':
    'Weaves protective runes into a place\'s foundations, and the magic there gathers thicker.',
  'loc.incite_unrest':
    'Stirs grievance through a settlement until its people turn on those who rule them.',
  'loc.fortify':
    'Hardens a fortification\'s walls and the will of its garrison, so it holds longer under siege.',
  'loc.sanctify_square':
    'Consecrates a settlement\'s public square, and faith and your presence take root there.',
  'loc.awaken_spirit':
    'Wakes the spirit of a settlement to its founders and old laws, and your presence settles into its streets.',
  'loc.sicken_wells':
    'Sickens a settlement\'s wells for a time; its people weaken and grow restless.',
  'loc.curse_roads':
    'Curses the roads into a settlement for a time; caravans turn back and its people grow restless.',

  // — Artifacts —
  'artifact.enchant':
    'Carves runes of power into an artifact, raising it one step toward legend and strengthening what it grants.',
  'artifact.empower':
    'Drives martial strength into an artifact\'s grain, raising it one step toward legend.',
  'artifact.attune':
    'Tunes an artifact to your sphere, so whoever bears it carries that sphere\'s gift.',
  'artifact.nullify':
    'Strips every enchantment and curse from an artifact, leaving only the object itself.',
  'artifact.curse':
    'Hides a curse in an artifact, and whoever carries it is slowly drained without knowing why.',

  // — Places within places —
  'sub.sanctify':
    'Consecrates a place for as long as you hold it, and the threaded mortals who stand there grow devoted.',
  'sub.trap':
    'Lays an unseen snare in a place, and the mortal it waits for walks into danger there.',
  'sub.vision':
    'Reads the hidden history of a place, revealing the secrets held by everyone gathered there.',
  'sub.sanctify_tavern':
    'Warms a tavern\'s hearth for as long as you hold it, and those gathered there meet and mingle readily.',

  // — The land: blessing and blight —
  'hex.bless_land':
    'Spreads your favour over the land, and your sway there deepens.',
  'hex.corrupt_land':
    'Seeds a slow blight in the land that sours it for everyone who lives there.',
  'hex.seed_life':
    'Pours life into barren ground, and your sway over the land grows.',
  'hex.raise_landmark':
    'Raises a landmark from the earth by your will, and your sway over the land grows.',
  'hex.shift_season':
    'Hastens the land\'s seasons of growth and rest, and your sway there grows.',
  'hex.scorch_earth':
    'Scorches the land and its stores, leaving a scar everyone who passes can see.',
  'hex.rend_earth':
    'Tears the ground apart into broken wreckage, the deepest wound you can deal the land at a stroke.',
  'hex.attune_leyline':
    'Weaves a new leyline through the land, and your sway there grows along it.',
  'hex.dispel_wild':
    'Drives wild magic out of the land, and your own sway settles in its place.',
  'hex.cultivate':
    'Tends the land for as long as you hold it, and its settlements prosper faster.',

  // — The land: sight —
  'hex.survey':
    'Surveys the land and its people, laying bare the terrain, the mood and any hidden places there.',
  'hex.dowse_resources':
    'Seeks ore, water and buried wealth beneath the land, uncovering what is hidden under it.',
  'hex.read_currents':
    'Reads the currents of magic through the land, laying bare its soul and any hidden sites.',
  'hex.read_stones':
    'Reads the memory in a ruin\'s stones, laying bare what stood there and every hidden chamber.',

  // — The land: the flow of magic —
  'hex.shift_dominion':
    'Breaks what stands against you in a place, so your hold can take root there.',
  'hex.amplify_flow':
    'Swells the magic already flowing through the land, and every place on it grows richer in power.',
  'hex.sever_flow':
    'Cuts the lines of magic running through the land, and the land sours.',
  'hex.anchor_sphere':
    'Pins the land\'s ruling sphere in place for as long as you hold it; rivals cannot shift its dominion.',
  'hex.channel_current':
    'Draws magic from the land around into this one for as long as you hold it, and your sway there swells.',

  // — The land: makings —
  'hex.forge_seer_token':
    'Forges a seer\'s token that lets its bearer sense the currents of magic wherever they go.',
  'hex.forge_instrument':
    'Forges a divine instrument that lifts its bearer\'s craft in one reach beyond its natural limit.',
  'hex.send_herald':
    'Shapes a herald from your will at a place on the land, already threaded to you and acting in your name.',
  'hex.spark_encounter':
    'Twists fate so mortals on the land meet where they never would have, and something comes of it.',

  // — The land: its people —
  'hex.stir_people':
    'Stirs the dreams of everyone on the land, turning their hearts toward novelty and away from cruelty.',
  'hex.summon_congregation':
    'Calls the mortals of the land to gather, and those who answer feel it as their own choice.',
  'hex.bestow_vision':
    'Plants a vision of purpose in a mortal on the land, and they wake with fresh courage and a clear aim.',
  'hex.scatter':
    'Hurls martial force across the land to break its gatherings, and the ground sours where it lands.',
  'hex.smite':
    'Calls your wrath down on the land for all to see, and the ground sours beneath it.',
  'hex.incite_exodus':
    'Seeds dread in the mortals of the land until leaving for something more feels like their only choice.',
  'hex.shepherd_flock':
    'Presses the mortals of the land toward your worship for as long as you hold it.',
  'hex.install_champion':
    'Raises a mortal to lead their faction under your mandate; let it lapse and they may turn or fall.',
  'hex.impose_decree':
    'Lays a law on the land that most mortals there obey for as long as you hold it.',

  // — The land: ruins —
  'hex.mark_ground':
    'Marks a ruin\'s ground with a pull that wandering mortals cannot ignore.',
  'hex.plant_dream':
    'Sends a mortal on the land dreams of buried places, and for a time they set out to find them.',
  'hex.whisper_intuition':
    'Gives a threaded mortal on the land a hunch for a nearby ruin\'s dangers and rewards.',
  'hex.consecrate_past':
    'Recasts a ruin\'s legacy in your sphere, and your sway over the land grows.',
  'hex.restore_fragment':
    'Rebuilds a fragment of a ruin into a lasting place that mortals can enter.',
  'hex.rewrite_history':
    'Rewrites the story a ruin\'s stones remember, so mortals find the past you choose.',
  'hex.bury_past':
    'Closes the ground over a ruin, and the land around it sours.',
  'hex.desecrate':
    'Pours corruption into a ruin\'s stones, and the land around it turns dark.',
  'hex.bind_echoes':
    'Binds a ruin\'s echoes to your will for as long as you hold it, and rivals find them hard to wrest away.',
  'hex.compel_exploration':
    'Drives your threaded mortals to seek out the ruins nearby for as long as you hold it.',
  'hex.seal_tomb':
    'Seals a ruin against everyone for as long as you hold it, your own mortals included.',
  'hex.ward_against_deep':
    'Wraps a mortal delving a ruin in your protection for as long as you hold it, easing its dangers.',

  // — Threads —
  'hex.attune_thread':
    'Tunes a thread so its mortal senses the currents of magic wherever they walk, for as long as you hold it.',
  'hex.strengthen_thread':
    'Pours power through a thread, lifting its mortal\'s craft in one reach for as long as you hold it.',
  bind_thread_artifact:
    'Draws a thread to an artifact, so you always know where it is and who carries it.',
  'thread.dormant':
    'Lets a thread go slack; its mortal acts on but no longer calls for your attention.',
  'thread.reactivate':
    'Pulls a slack thread taut again, and its mortal calls for your attention once more.',

  // — Undertakings —
  'action.undertaking.inspire':
    'Lends a mortal at work your conviction, and the next test of their undertaking goes easier.',
  'action.undertaking.sabotage':
    'Whispers doubt into an undertaking, and its next test goes harder.',
};

// ─── Composed fallback ───────────────────────────────────────────────────────

/** Category → the phrase naming what an action touches. First declared category wins. */
const TARGET_PHRASE: Record<string, string> = {
  actor: 'a mortal',
  agent: 'a mortal',
  location: 'a place',
  sublocation: 'a place',
  hex: 'the land',
  artifact: 'an artifact',
  artifact_legendary: 'a legendary artifact',
  faction: 'a faction',
  resource: 'a wellspring',
};

/** crudType → a verb frame that takes a target phrase. */
const CRUD_FRAME: Record<UnifiedActionTemplate['crudType'], (target: string) => string> = {
  create: (t) => `Reaches out to ${t}, drawing it into your design.`,
  read: (t) => `Turns your sight on ${t}, revealing what is hidden there.`,
  update: (t) => `Works your will upon ${t}, reshaping it toward your intent.`,
  delete: (t) => `Unmakes ${t}, undoing what it was.`,
};

function targetPhrase(categories: UnifiedActionTemplate['targetCategories']): string | null {
  // Omitted/empty defaults to ['actor'] per the template contract.
  const first = categories && categories.length > 0 ? categories[0] : 'actor';
  return TARGET_PHRASE[first as string] ?? null;
}

function capitalize(word: string): string {
  return word.length ? word[0].toUpperCase() + word.slice(1) : word;
}

/** Assemble a body from crudType + target, degrading to a reach-generic line. */
function composedFallback(template: UnifiedActionTemplate): string {
  const target = targetPhrase(template.targetCategories);
  const frame = CRUD_FRAME[template.crudType];
  if (frame && target) return frame(target);
  return `A new power of the ${capitalize(String(template.reach))} reach.`;
}

// ─── Public entry ────────────────────────────────────────────────────────────

/**
 * The plain-prose effects line for a template: an authored override, else the
 * composed fallback. Deterministic — depends only on the template. Never throws.
 *
 * **The cost clause was removed by THR-1002.** Every line used to end with an
 * interpolated *" Costs 3 essence."*, which was two defects in one sentence: a
 * numeral on a player surface (Law 13), and a second statement of a price the card
 * already draws as framed pips right above it. Two renderings of one fact is how
 * they come to disagree — and the pips are the one the whole game reads.
 *
 * The interpolation had a good reason behind it (never hardcode a price into an
 * authored string) and that reason is honoured better by not writing the price
 * here at all. `template.essenceCost` reaches the player through `CostPips`.
 */
export function actionEffectsProse(template: UnifiedActionTemplate): string {
  return ACTION_EFFECTS_PROSE[template.id] ?? composedFallback(template);
}
