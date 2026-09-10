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
    "Presses a conviction into a mortal's mind, bending them toward the course you choose.",
  'divine.dream':
    'Sends a dream to a sleeping mortal, reshaping what they want beneath waking thought.',
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
    'Swells a settlement\'s harvest and stores toward plenty; the fields yield more than the season should allow.',
  'loc.blight':
    'Turns a settlement\'s harvest against itself, drawing its fields and stores down toward famine.',

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
  'loc.reveal_vein':
    'Draws divine sight through soil and stone until a seam worth digging answers back.',
  'loc.guide_caravan':
    'Walks unseen beside a settlement\'s wagons, so every road that feeds it runs safer and fuller.',
  'loc.sour_mine':
    'Closes the hand of the land beneath a settlement, and its diggings pinch to nothing.',
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
