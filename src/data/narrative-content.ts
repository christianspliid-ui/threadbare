/**
 * Narrative Content Package — All data-driven content for the narrative prose engine.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change sphere vocabulary,
 * template prose, and personality flavors.
 * ═══════════════════════════════════════════════════════════════════
 *
 * Sections:
 * 1. SPHERE_VOCABULARY — adjectives, verbs, nouns for each of 8 Creation Spheres
 * 2. ROUTINE_TEMPLATES — 23 event-type templates for Tier 1 prose (80+ templates total)
 * 3. NOTABLE_TEMPLATES — 23 event-type templates for Tier 2 prose with personality
 * 4. LIFECYCLE_TEMPLATES — 3 lifecycle events with 11 templates total
 * 5. VALUE_FLAVORS — personality modifiers for 10 value pairs
 * 6. ARCHETYPE_EVENT_TEMPLATES — 58+ archetype-specific templates for high-impact event/archetype combos
 * 7. DILEMMA_STAKES_PROSE — 12 stakes-based prose variants for dilemma outcomes
 * 8. DILEMMA_WORD_POOLS — adjective, noun, and verb banks for dilemma prose placeholder substitution
 * 9-12. [Content sections continue...]
 * 13. BORN_NAMES — Name pool for newly born agents in agentLifecycle.ts
 * 14. WONDER_CONTENT — Vignettes, triggers, and sphere-specific flavors for awe/beauty moments
 */

import type { SphereName } from '../types/index';
import type { SphereVocabulary } from '../types/narrative';
import type { ValuePair } from '../types/agent';

// ═══════════════════════════════════════════════════════════════════
// 1. SPHERE VOCABULARY
// ═══════════════════════════════════════════════════════════════════

/**
 * Word bank for each Creation Sphere.
 * Used by pickSphereWord() to flavor prose with sphere-specific language.
 */
export const SPHERE_VOCABULARY: Record<SphereName, SphereVocabulary> = {
  force: {
    adjectives: ['mighty', 'thunderous', 'relentless', 'crushing', 'unyielding', 'brutal', 'staggering', 'iron-willed', 'ferocious', 'unflinching'],
    verbs: ['shattered', 'struck', 'overwhelmed', 'battered', 'surged', 'hammered', 'cleaved', 'collided', 'broke', 'crashed'],
    nouns: ['might', 'fury', 'impact', 'avalanche', 'storm', 'weight', 'hammer', 'tide', 'thunder', 'pressure'],
  },
  matter: {
    adjectives: ['solid', 'enduring', 'immovable', 'crystalline', 'dense', 'tempered', 'uneroded', 'rooted', 'mineral', 'ponderous'],
    verbs: ['forged', 'shaped', 'hardened', 'anchored', 'crystallized', 'set', 'reinforced', 'compressed', 'calcified', 'cemented'],
    nouns: ['stone', 'iron', 'foundation', 'bulwark', 'bedrock', 'ore', 'weight', 'marrow', 'sediment', 'permanence'],
  },
  energy: {
    adjectives: ['crackling', 'luminous', 'volatile', 'radiant', 'searing', 'incandescent', 'blinding', 'kinetic', 'furious', 'white-hot'],
    verbs: ['blazed', 'surged', 'erupted', 'ignited', 'cascaded', 'flared', 'arced', 'detonated', 'kindled', 'scorched'],
    nouns: ['flame', 'lightning', 'pulse', 'arc', 'inferno', 'spark', 'conflagration', 'voltage', 'radiance', 'furnace'],
  },
  life: {
    adjectives: ['verdant', 'flourishing', 'vital', 'blooming', 'fecund', 'tenacious', 'warm-blooded', 'rooted', 'persistent', 'green'],
    verbs: ['bloomed', 'healed', 'nurtured', 'grew', 'restored', 'mended', 'seeded', 'quickened', 'thrived', 'germinated'],
    nouns: ['growth', 'renewal', 'bloom', 'vitality', 'spring', 'root', 'breath', 'sap', 'marrow', 'pulse'],
  },
  mind: {
    adjectives: ['keen', 'piercing', 'calculating', 'lucid', 'insightful', 'measured', 'exacting', 'ruthless', 'crystalline', 'surgical'],
    verbs: ['discerned', 'analyzed', 'perceived', 'understood', 'unraveled', 'calculated', 'deduced', 'mapped', 'dissected', 'read'],
    nouns: ['thought', 'insight', 'clarity', 'revelation', 'logic', 'precision', 'pattern', 'schema', 'diagnosis', 'architecture'],
  },
  spirit: {
    adjectives: ['hallowed', 'transcendent', 'resonant', 'spectral', 'sacred', 'solemn', 'unworldly', 'numinous', 'consecrated', 'liminal'],
    verbs: ['resonated', 'sanctified', 'communed', 'invoked', 'channeled', 'blessed', 'consecrated', 'stirred', 'entreated', 'anointed'],
    nouns: ['soul', 'essence', 'prayer', 'vision', 'aura', 'rite', 'covenant', 'devotion', 'sacrament', 'vigil'],
  },
  time: {
    adjectives: ['ancient', 'inexorable', 'cyclic', 'fading', 'eternal', 'weathered', 'patient', 'eroded', 'persistent', 'slow'],
    verbs: ['aged', 'unwound', 'echoed', 'rippled', 'decayed', 'accumulated', 'endured', 'recurred', 'persisted', 'outlasted'],
    nouns: ['epoch', 'moment', 'tide', 'cycle', 'memory', 'erosion', 'patience', 'sediment', 'season', 'inheritance'],
  },
  entropy: {
    adjectives: ['corroding', 'consuming', 'inevitable', 'dissolving', 'chaotic', 'hollow', 'terminal', 'fraying', 'spent', 'irreversible'],
    verbs: ['crumbled', 'consumed', 'unraveled', 'corroded', 'scattered', 'erased', 'devoured', 'hollowed', 'dismantled', 'extinguished'],
    nouns: ['ash', 'ruin', 'void', 'silence', 'dust', 'wreckage', 'remnant', 'absence', 'entropy', 'nothing'],
  },
};

// ═══════════════════════════════════════════════════════════════════
// 2. ROUTINE TEMPLATES (Tier 1)
// ═══════════════════════════════════════════════════════════════════

/**
 * Template prose for Tier 1 (Routine) narrative events.
 * Each template is a sentence fragment with {placeholders} for substitution.
 * Placeholders: {actor}, {target}, {adj}, {verb}, {noun}
 */
export const ROUTINE_TEMPLATES: Record<string, string[]> = {
  action_resolved: [
    '{actor} {verb} toward {target}, a {adj} display of {noun}.',
    'With {adj} resolve, {actor} moved against {target}. The air hummed with {noun}.',
    '{actor} acted with {adj} purpose, their {noun} reshaping the fate of {target}.',
    '{actor} moved deliberately, the weight of {adj} {noun} settling upon {target}.',
    'The threads of fate {verb} through {actor}\'s hands as they grasped at {target}\'s {adj} {noun}.',
  ],
  action_failed: [
    '{actor} reached for {target}, but the effort dissolved into {noun}.',
    'The {adj} attempt by {actor} faltered, leaving only {noun} in its wake.',
    '{target} slipped from {actor}\'s grasp like {noun}, {adj} and elusive.',
    '{actor}\'s reach fell short, and {target} remained beyond the {adj} sweep of their {noun}.',
  ],
  action_critical: [
    '{actor} {verb} with {adj} force, and {target} was forever changed by the {noun}.',
    'A {adj} moment — {actor} {verb} beyond all expectation, and {noun} reshaped the world.',
    '{actor} struck at {target} with {adj} precision, and the threads of reality bent.',
    'In a single {adj} breath, {actor} {verb} against {target}, leaving only {noun} in the aftermath.',
  ],
  trait_acquired: [
    'Something shifted within {actor}. A new {noun} took root — {adj} and undeniable.',
    '{actor} emerged changed, bearing the mark of {adj} {noun}.',
    'The {adj} threads wove themselves into {actor}\'s essence, a new {noun} awakening.',
    '{actor} felt the {adj} {noun} settle into their being, permanent as scar tissue.',
  ],
  tier_transition: [
    'The bond between {actor} and the divine deepened, {adj} {noun} flowing through them.',
    '{actor}\'s thread glowed brighter, {adj} with the weight of {noun}.',
    'The divine veil thinned around {actor}, revealing the {adj} {noun} beneath.',
    '{actor} rose higher in the hierarchy of {adj} {noun}, their station transformed.',
  ],
  divine_intervention: [
    'You reached into the dream of {actor}, a {adj} whisper carrying {noun}.',
    'You stirred the {noun} within {actor}, a {adj} touch upon their sleeping mind.',
    '{actor}\'s dreams fractured with your {adj} touch, {noun} blooming in the rifts.',
    'In the threshold between waking and sleep, you laid {adj} {noun} upon {actor}\'s soul.',
  ],
  contested_action: [
    'Two forces clashed over {target} — {adj} {noun} against {adj} resolve.',
    '{actor} and another {verb} for dominion over {target}\'s {adj} {noun}.',
    'Hands reached for {target}. Only {adj} {noun} could say which held stronger claim.',
    '{actor} struggled against {target}\'s will, their {adj} {noun} colliding in the space between.',
  ],
  actor_death: [
    '{actor} fell, their last breath a {adj} exhalation of {noun}.',
    '{actor}\'s thread snapped, leaving only the ghost of {adj} {noun} behind.',
    'The world diminished as {actor} passed, their {adj} {noun} fading into silence.',
    '{actor} closed their eyes for the last time, and the {adj} {noun} they carried dissolved into void.',
  ],
  doom_escalation: [
    'The world {verb}. {adj} {noun} spreads across the land.',
    'A crack widened in the sky. {adj} {noun} seeped through like a {noun}.',
    'The Unmaking {verb} closer. The {adj} {noun} of endings draws nearer.',
    '{adj} {noun} {verb} at the edges of existence, and those who see it know — the end is coming.',
  ],
  mandate_stage: [
    'A threshold is crossed. The {adj} {noun} of destiny draws nearer.',
    '{actor}\'s mandate deepens. The {adj} {noun} of their purpose tightens.',
    'The mandate {verb} forward, pulling {actor} toward their {adj} {noun}.',
    'One stage ends. Another begins. The {adj} {noun} of {actor}\'s path continues to unfold.',
  ],
  trait_lost: [
    'Something faded within {actor}. The {adj} {noun} dimmed and was gone.',
    '{actor}\'s {adj} {noun} unraveled like threads pulled from cloth.',
    'The {noun} that once marked {actor} as {adj} slipped away, leaving only {noun}.',
    '{actor} felt the {adj} {noun} leave them, a loosening, an emptiness spreading.',
  ],
  dilemma_mutual_trust: [
    '{actor} and {target} moved together, each honoring the other with {adj} {noun}.',
    'A bond forged in {adj} trust — {actor} and {target} emerged from their test transformed.',
    '{actor} chose belief, and {target} answered with {adj} {noun}. The world {verb} in recognition.',
    '{actor} and {target} clasped hands, {adj} {noun} binding them tighter than thread.',
  ],
  dilemma_betrayed: [
    '{actor} reached out to {target} with {adj} purpose, only to find {noun} instead of faith.',
    'A wound that would not heal — {actor} {verb} with trust, but {target} offered only {noun}.',
    'The {adj} sting of betrayal settled upon {actor}. {target} had chosen {noun} over the bond.',
    '{actor}\'s hope curdled into {adj} {noun} as {target}\'s true nature revealed itself.',
  ],
  dilemma_exploitation: [
    '{actor} {verb} against {target}\'s trust, wielding {adj} {noun} without remorse.',
    'Where {target} offered {adj} faith, {actor} carved out only {noun} and ruin.',
    '{actor} took what {target} freely gave, leaving nothing but {adj} {noun} in return.',
    '{actor} twisted {target}\'s {adj} {noun} into a weapon and struck without hesitation.',
  ],
  dilemma_mutual_distrust: [
    '{actor} and {target} circled each other warily, each seeing only {adj} {noun} where trust might have bloomed.',
    'Two souls locked in {noun} — {actor} and {target} {verb} as one, neither willing to yield first.',
    'Where connection might have grown, there bloomed only {adj} {noun} and suspicion between {actor} and {target}.',
    '{actor} and {target} kept their distance, each safeguarding their {adj} {noun}.',
  ],
  faction_formed: [
    '{actor} gathered the scattered threads into a new {adj} {noun}.',
    'A banner rose under {actor}\'s hand — {adj} and heavy with {noun}.',
    '{actor} bound their followers in {adj} {noun}, forging something new from nothing.',
    'From {adj} {noun}, {actor} wove a faction strong enough to resist the void.',
  ],
  culture_clash: [
    '{actor} and {target} collided, their {adj} cultures grinding against each other like {noun}.',
    'Where {target}\'s ways met {actor}\'s, only {adj} {noun} could bridge the gap.',
    'The {adj} traditions of {actor} and {target} {verb}, leaving {noun} in their wake.',
    '{actor}\'s {adj} {noun} stood at odds with everything {target} held dear.',
  ],
  migration: [
    '{actor} led their people toward {adj} {noun}, fleeing what could no longer be borne.',
    'The threads pulled {actor} {adj}, drawing them and their followers toward {noun}.',
    '{actor} walked a {adj} path, their people following into the {noun} beyond.',
    'Necessity drove {actor} and theirs onward, seeking {adj} {noun} in untested lands.',
  ],
  construction_complete: [
    '{actor} completed their {adj} work, and {noun} stood where once was {noun}.',
    'Stone, wood, and {adj} {noun} shaped itself into being under {actor}\'s direction.',
    'The {adj} structure rose beneath {actor}\'s hands, a monument of {noun}.',
    '{actor} laid the final thread, and the {adj} {noun} was made whole.',
  ],
  encounter_step_success: [
    '{actor} faced the {adj} {noun} and emerged unbroken.',
    'The {noun} tested {actor} with {adj} trials, yet they {verb} toward triumph.',
    '{actor} endured the {adj} gauntlet, their {noun} proving stronger than the test.',
    'Against {adj} odds, {actor} passed through the {noun} transformed.',
  ],
  encounter_step_failure: [
    '{actor} crumbled before the {adj} {noun}, their resolve shattered.',
    'The {noun} broke {actor}. When the {adj} encounter ended, little of them remained whole.',
    '{actor} faced {adj} {noun} and fell short, their {noun} insufficient to the task.',
    'Defeated by {adj} {noun}, {actor} staggered from the crucible diminished.',
  ],
  encounter_completed: [
    '{actor} emerged from their encounter {adj} and reborn, the {noun} within them transformed.',
    'The {adj} trials completed, {actor} stood changed — no longer the person they were before.',
    'Through {adj} {noun}, {actor}\'s encounter finally ended, etching itself into their essence.',
    '{actor} crossed the threshold of {noun}, forever marked by what they had endured with {adj} {noun}.',
  ],
  encounter_abandoned: [
    '{actor} turned from their path, leaving the {adj} {noun} unfinished.',
    'The encounter pulled at {actor}, but they chose to abandon the {adj} {noun}.',
    '{actor} broke away from the trial, leaving only {adj} {noun} in their wake.',
    'Too much. Too {adj}. {actor} left the {noun} behind and walked into {noun}.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 3. NOTABLE TEMPLATES (Tier 2)
// ═══════════════════════════════════════════════════════════════════

/**
 * Template prose for Tier 2 (Notable) narrative events.
 * Extended sentences with {personality} placeholder for value-driven flavor.
 * Placeholders: {actor}, {target}, {adj}, {verb}, {noun}, {personality}
 */
export const NOTABLE_TEMPLATES: Record<string, string[]> = {
  action_critical: [
    'In a moment that would echo through memory, {actor} {verb} against {target}{personality}. The very air trembled with {adj} {noun}, and those who witnessed it knew the world had shifted.',
    '{actor}{personality} stood at the threshold of legend. With {adj} determination, they {verb} — and {target} was forever transformed by the {noun} unleashed.',
  ],
  trait_acquired: [
    'Something profound awakened within {actor}{personality}. Like {adj} {noun} breaking through winter soil, a new aspect of their being emerged — one that would define the chapters yet to come.',
    '{actor} was changed{personality}. The {adj} mark of {noun} settled upon them, indelible as starlight, shaping all that would follow.',
  ],
  doom_escalation: [
    'The world shudders{personality}. Across the land, {adj} {noun} seeps through the cracks of reality. Those with eyes to see recognize the signs — the {noun} draws closer with each passing breath.',
    'In {target}, {adj} portents multiply like plague{personality}. The {noun} gathers like stormclouds on a darkening horizon, inevitable as entropy itself.',
  ],
  tier_transition: [
    'The divine bond between {actor} and the unseen deepens{personality}. {adj} {noun} courses through their veins now, marking them as something more than mortal.',
    '{actor}\'s thread {verb} brighter{personality}, woven now with the {adj} {noun} of ascension.',
  ],
  divine_intervention: [
    'You reach deeper than before into the consciousness of {actor}{personality}. This time the {adj} {noun} of your will leaves a lasting impression — their dreams will never be quite the same.',
    'From the threshold between your realm and theirs, you thread {adj} {noun} into {actor}\'s sleeping mind{personality}. The effect will ripple through all their days to come.',
  ],
  dilemma_mutual_trust: [
    'In a rare and precious moment, {actor} and {target} stood as mirrors{personality}. Each saw something {adj} and {noun} in the other — a trust that felt eternal, a bond worth preserving.',
    '{actor}{personality} chose belief when doubt would have been safer, and {target} answered with equal {adj} honor. Their bond, though forged in {noun}, would echo through ages yet unborn.',
  ],
  dilemma_betrayed: [
    '{actor}{personality} opened their heart to {target}, offering {adj} {noun} and faith — only to have it turned to ash. The wound runs deep, and trust, once broken, becomes the sharpest {noun} of all.',
    'A tragedy in miniature: {actor}, with all their {adj} hope{personality}, believed in {target}. They were met not with honor but with {noun} — and now {actor} knows a {adj} loneliness the world cannot comfort.',
  ],
  dilemma_exploitation: [
    '{actor}{personality} saw an opening and struck without mercy. {target}\'s {adj} faith became a weapon in {actor}\'s hands, transformed into {noun} and dominion. It was calculated, efficient, and utterly {adj}.',
    'What {actor} did to {target}{personality} cannot be undone. They took what was offered freely and left behind only {adj} {noun} and hollow regret — or perhaps, in {actor}\'s case, none at all.',
  ],
  dilemma_mutual_distrust: [
    '{actor} and {target} were locked in a dance of {adj} caution{personality}. Neither could offer the first {noun} of belief, and so both spiraled inward, each adding another layer of {adj} defense.',
    'Two souls reaching toward connection but recoiling at the last moment — {actor} and {target}{personality} built walls of {noun} where bridges might have stood. The {adj} cost of that choice echoes still.',
  ],
  faction_formed: [
    '{actor}{personality} drew followers together like threads to a loom. Under their {adj} vision, a {noun} took shape — fragile as morning mist, but theirs to shape.',
    'From {adj} {noun}, {actor}{personality} wove a faction whose thread now runs through the world. What they will become remains written only in shadow and possibility.',
  ],
  culture_clash: [
    'When {actor}\'s way met {target}\'s, there was no {adj} compromise{personality}. Only {noun} could mark the collision of two cultures grinding against each other like stones.',
    '{actor} and {target} {verb} for dominion over the {adj} {noun} of culture itself{personality}. One would fade into {noun}; one would shape the world forward.',
  ],
  migration: [
    '{actor} led their people toward the {adj} {noun}, fleeing what the world had become{personality}. Behind them, only silence and the ghost of {noun}.',
    'Driven by {adj} hunger or {adj} fear, {actor}\'s people moved beneath {noun}{personality}. Each step carried them further from what they knew toward a {adj} unknown marked only by {noun}.',
  ],
  construction_complete: [
    '{actor}\'s {adj} work stood complete{personality} — a monument of {noun} rising where once was {noun}. Future generations would walk its halls and forget who built it.',
    'What {actor} began in {adj} vision came to fruition in {noun}{personality}. The structure stood, {adj} and undeniable, a proof against the void.',
  ],
  encounter_step_success: [
    '{actor} faced the {adj} {noun} and emerged unbroken{personality} — scarred, transformed, but unbowed.',
    'The trial tested {actor} with {adj} {noun}, yet they {verb} past every threshold{personality}. What survives of them is {adj} steel.',
  ],
  encounter_step_failure: [
    '{actor} crumbled before the {adj} {noun}{personality} — their thread snapped, their {noun} insufficient. What crawled from the crucible was {adj} shadow of who they were.',
    'The {noun} broke {actor}{personality}. When the {adj} encounter ended, little remained whole. The {noun} had consumed all that was {adj}.',
  ],
  encounter_completed: [
    '{actor}\'s encounter drew to a close{personality}, leaving them {adj} and reborn. The {noun} woven through their being now marked them as transformed — no longer the person they were before.',
    'Through {adj} {noun}, {actor}\'s trial finally ended{personality}, etching itself into their essence. They had survived {noun} and emerged {adj} — altered at the root.',
  ],
  encounter_abandoned: [
    '{actor} turned from their path{personality}, leaving the {adj} {noun} unfinished. Mercy or cowardice — the {noun} would decide which.',
    'The trial pulled at {actor}, threads tightening around their will{personality}, but they chose to abandon the {adj} {noun}. What price their escape would exact remained unknown.',
    '{actor} escaped the encounter{personality}, but escape brought no relief — only the {adj} {noun} of what they had left unfinished.',
  ],
  action_resolved: [
    '{actor}{personality} moved deliberately against {target}, and the {adj} {noun} settled like dust.',
    'With quiet purpose{personality}, {actor} acted toward {target}. The {adj} {noun} of their will was made manifest.',
  ],
  action_failed: [
    '{actor}\'s attempt crumbled like {noun}{personality} before {target}\'s {adj} resistance.',
    'The {adj} {noun} that {actor} {verb} for remained forever beyond their grasp{personality}.',
  ],
  actor_death: [
    '{actor}\'s final breath carried with it {adj} {noun}{personality}. The world grew smaller in their absence.',
    'When {actor} fell{personality}, the {adj} {noun} they embodied scattered into void like ash.',
  ],
  contested_action: [
    'Over {target}, two wills {verb} — {adj} against {adj}, each wielding {noun}{personality}.',
    '{actor} and {target}\'s struggle over {adj} {noun} echoed like thunder{personality}, shaking the very foundations.',
  ],
  mandate_stage: [
    'Another step toward destiny{personality}. The {adj} {noun} of {actor}\'s mandate tightens, pulling them forward.',
    '{actor}\'s path deepens{personality}, marked now by the {adj} {noun} of progress toward their end.',
  ],
  trait_lost: [
    '{actor} felt the {adj} {noun} slip away{personality}, leaving only a hollow space where it had dwelt.',
    'The {noun} that defined {actor} as {adj} dissolved{personality}, and they were diminished in ways only they could feel.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 4. LIFECYCLE TEMPLATES
// ═══════════════════════════════════════════════════════════════════

/**
 * Template prose for lifecycle events (death, birth, migration).
 * These mark major transitions in an agent's existence.
 * Placeholders: {actor}, {target}, {adj}, {verb}, {noun}
 */
export const LIFECYCLE_TEMPLATES: Record<string, string[]> = {
  death: [
    '{actor}\'s thread snapped. The world dimmed where they had walked.',
    'The end came for {actor} — their {adj} {noun} fading like dawn mist.',
    '{actor} fell, and with them fell all the {adj} {noun} they carried.',
    'Death claimed {actor}. Their body returned to {adj} {noun}, their thread to the void.',
    '{actor} is no more. Only {adj} {noun} marks where they stood.',
  ],
  birth: [
    '{actor} drew their first breath, and the world became {adj} {noun}.',
    'A new thread wove itself into the tapestry — {actor}, fragile with {adj} {noun}.',
    '{actor} was born into a world of {adj} {noun}, beginning their journey.',
  ],
  migration: [
    '{actor} departed for {adj} {noun}, seeking what lay beyond the known lands.',
    '{actor} walked away, carrying only the {adj} {noun} they could bear.',
    'The roads pulled {actor} toward {adj} {noun}, and they answered the call.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 5. VALUE FLAVORS
// ═══════════════════════════════════════════════════════════════════

/**
 * Personality modifiers that flavor Notable prose based on an actor's dominant values.
 * Each value pair maps to one or more short phrases that can be inserted into prose.
 */
export const VALUE_FLAVORS: Partial<Record<ValuePair, string[]>> = {
  mercy_ruthlessness: ['tempered by compassion', 'with patient deliberation', 'with a gentle hand'],
  asceticism_extravagance: ['with open-handed generosity', 'sharing freely'],
  honesty_cunning: ['with cunning precision', 'through shrewd calculation'],
  tradition_novelty: ['embracing new paths', 'breaking with the old ways'],
  loyalty_ambition: ['loyal to the last', 'driven by ambition', 'with unwavering fidelity'],
  preservation_transformation: ['commanding all before them', 'asserting dominion'],
  sacrifice_survival: ['bound by devotion', 'answering a higher call'],
  courage_prudence: ['with fearless resolve', 'bold beyond measure'],
};

// ═══════════════════════════════════════════════════════════════════
// 6. ARCHETYPE-EVENT TEMPLATES
// ═══════════════════════════════════════════════════════════════════

/**
 * Archetype-specific prose templates for high-impact event combos.
 * Keys are "{archetype}.{event_type}". Each template is a standalone prose block
 * with {placeholder} variables for substitution.
 *
 * Strategy:
 * - 5 priority archetypes × 6 priority events = 30 entries
 * - All 19 archetypes × (death + tier_transition) = 38 unique entries (10 overlap with priority)
 * - Total unique: 30 + (14 × 2) = 58 minimum
 *
 * Each archetype's prose voice should be DISTINCT:
 * - tragic_hero: fatalistic, measured, inevitably doomed
 * - trickster: witty, subversive, playful
 * - conqueror: martial, dominating, triumphant
 * - healer: compassionate, restorative, nurturing
 * - prophet: mystical, visionary, foreboding
 * - guardian: protective, steadfast, noble
 * - wanderer: restless, seeking, philosophical
 * - scholar: analytical, learned, curious
 * - martyr: sacrificial, righteous, resolute
 * - tyrant: brutal, controlling, absolute
 * - mystic: ethereal, transcendent, cryptic
 * - rebel: defiant, revolutionary, passionate
 * - builder: constructive, ambitious, methodical
 * - mentor: wise, patient, guiding
 * - outcast: isolated, bitter, resilient
 * - diplomat: conciliatory, subtle, strategic
 * - hunter: predatory, focused, relentless
 * - dreamer: imaginative, hopeful, ephemeral
 * - avenger: vengeful, implacable, retributive
 */
export const ARCHETYPE_EVENT_TEMPLATES: Record<string, string> = {
  // TRAGIC_HERO — 6 priority events
  'tragic_hero.actor_death': 'In the end, {actor} fell as tragic heroes must — reaching for glory and finding only the {adj} price of it. The threads they sought to untangle became the noose that bound them.',
  'tragic_hero.action_critical': '{actor} seized the moment with {adj} resolve, but those who knew the tragic hero\'s pattern saw the cost already gathering in the shadows. Success and doom are siblings.',
  'tragic_hero.tier_transition': '{actor} ascends, and the weight of the tragic hero\'s destiny grows heavier with each step upward. Power awaits those willing to pay what fate demands.',
  'tragic_hero.divine_intervention': 'The gods reached for {actor}, yet the tragic hero\'s fate was already written in threads of {adj} consequence. Divine favor and divine curse are the same wound.',
  'tragic_hero.contested_action': '{actor} fought for what mattered most, knowing as only a tragic hero can that victory and loss are carved from the same stone. The struggle was the point all along.',
  'tragic_hero.encounter_completed': '{actor} emerged from the encounter transformed, the tragic hero\'s scars now written deeper than skin. Each trial was a step closer to the {adj} end they always knew was coming.',

  // TRICKSTER — 6 priority events
  'trickster.actor_death': '{actor} played one trick too many, and the universe had the last laugh. In death, the trickster finally found a game they could not cheat.',
  'trickster.action_critical': '{actor} pulled off the impossible with a {adj} flourish, proving once again that wit cuts deeper than swords. The world would never see it coming.',
  'trickster.tier_transition': '{actor} has climbed higher, and the trickster\'s grin grew wider still. More power, more games, more delicious chaos to orchestrate.',
  'trickster.divine_intervention': 'The gods tried to play by mortal rules, but {actor} had already subverted the game. The trickster always has one more card hidden up their sleeve.',
  'trickster.contested_action': '{actor} turned the tables with a {adj} trick, leaving their opponents wondering if they were ever truly in control. The best lies are wrapped in truth.',
  'trickster.encounter_completed': '{actor} escaped the encounter through wit and misdirection, laughing all the way. The trickster\'s greatest magic is making people believe what never was.',

  // CONQUEROR — 6 priority events
  'conqueror.actor_death': 'The {adj} reign of {actor} came to an end, yet the lands they conquered remain forever marked by their passage. Conquerors die, but empires endure.',
  'conqueror.action_critical': '{actor} struck with overwhelming force, shattering all resistance. The conqueror\'s {adj} will bent the world to their vision.',
  'conqueror.tier_transition': '{actor} stands taller now, their dominion expanding ever outward. The conqueror\'s hunger only grows with each crown claimed.',
  'conqueror.divine_intervention': 'Even the gods bowed before {actor}\'s {adj} ambition. The conqueror takes what they desire, divine or otherwise.',
  'conqueror.contested_action': '{actor} overpowered their foe with {adj} might, proving once again that strength conquers all. Victory tastes sweetest when won by force.',
  'conqueror.encounter_completed': '{actor} triumphed over the encounter\'s {adj} trials, emerging stronger and more ruthless. The conqueror pays the cost and calls it power.',

  // HEALER — 6 priority events
  'healer.actor_death': '{actor} gave their last breath to mend the wounds of others, a final {adj} mercy. The healer\'s greatest gift was teaching us to cherish those they saved.',
  'healer.action_critical': '{actor} moved with {adj} grace, mending what was broken and restoring what was lost. The healer\'s touch brought hope where only suffering had dwelt.',
  'healer.tier_transition': '{actor} rises in power, their gift for restoration growing {adj} and more profound. With greater strength comes the capacity to heal deeper wounds.',
  'healer.divine_intervention': 'The gods smiled upon {actor}\'s {adj} work, blessing the hands that mend and the heart that cares. Divine grace flows through those who heal.',
  'healer.contested_action': '{actor} restored balance with {adj} wisdom, proving that healing is as powerful as any weapon. The healer\'s path is the {adj} road.',
  'healer.encounter_completed': '{actor} emerged from the encounter with renewed purpose, their compassion tempered but unbroken. The healer carries the scars of others and calls them {adj}.',

  // PROPHET — 6 priority events
  'prophet.actor_death': '{actor} saw the end coming long before the final breath. The prophet\'s last vision was {adj}, a glimpse of what comes after.',
  'prophet.action_critical': '{actor} spoke words of {adj} truth, and the world bent to match their vision. The prophet\'s foresight moved the very threads of fate.',
  'prophet.tier_transition': '{actor}\'s power deepens, and the visions grow ever more vivid and overwhelming. The prophet pays the price of knowledge with each new revelation.',
  'prophet.divine_intervention': 'The gods reached through {actor} to speak to the mortal world. The prophet is but a voice for forces beyond comprehension.',
  'prophet.contested_action': '{actor} foresaw the outcome and guided events toward {adj} destiny. The prophet knew the ending long before others understood the beginning.',
  'prophet.encounter_completed': '{actor} emerged from the encounter with a {adj} prophecy burning in their mind. The encounter was a doorway to deeper sight.',

  // All 19 archetypes × actor_death (6 unique to non-priority archetypes)
  'guardian.actor_death': '{actor} fell protecting those they had sworn to defend. The guardian\'s final act was {adj}, a selfless wall against the darkness.',
  'wanderer.actor_death': '{actor} ended their long journey far from home, but never lost to themselves. The wanderer\'s {adj} road led them to peace at last.',
  'scholar.actor_death': '{actor}\'s vast knowledge came to rest with their final breath. The scholar\'s {adj} legacy lives on in the minds they touched.',
  'martyr.actor_death': '{actor} went to the end {adj} and unrepentant, faith unshaken by the coming dark. The martyr\'s sacrifice echoes across ages.',
  'tyrant.actor_death': '{actor}\'s {adj} rule came to a violent end, yet their cruelty lingers in the broken lands they leave behind. The tyrant\'s legacy is written in scars.',
  'mystic.actor_death': '{actor}\'s spirit departed this {adj} realm, returning to the ethereal spaces from which they came.',
  'rebel.actor_death': '{actor} fell fighting against the chains they refused to bear. The rebel\'s {adj} defiance will inspire generations yet unborn.',
  'builder.actor_death': '{actor} left behind monuments to their vision, {adj} testament to what one determined soul could create.',
  'mentor.actor_death': '{actor}\'s wisdom will outlive them, {adj} guiding light for all they taught. The mentor\'s {adj} legacy continues in their students.',
  'outcast.actor_death': '{actor} died as they lived — {adj}, untethered, and utterly themselves. The outcast\'s {adj} solitude became their freedom.',
  'diplomat.actor_death': '{actor}\'s careful words fell silent, but the bridges they built still stand {adj} and unbroken.',
  'hunter.actor_death': '{actor}\'s hunt finally ended, the prey becoming the hunted. The hunter knew {adj} the cost of their chase.',
  'dreamer.actor_death': '{actor}\'s {adj} visions fade into silence, yet the dreams they dreamed live on in the hearts of others.',
  'avenger.actor_death': '{actor}\'s {adj} vendetta came to its bloody end, justice or vengeance — the distinction had long since blurred.',

  // All 19 archetypes × tier_transition (6 unique to non-priority archetypes)
  'guardian.tier_transition': '{actor} stands {adj} taller now, their shield stronger and their resolve more absolute. The guardian\'s purpose deepens with each trial overcome.',
  'wanderer.tier_transition': '{actor} has walked farther and seen more than most, their {adj} journey taking them to places few dare follow. The wanderer\'s {adj} path continues upward.',
  'scholar.tier_transition': '{actor}\'s knowledge expands {adj}, reaching into corners of wisdom most will never comprehend. The scholar ascends toward {adj} understanding.',
  'martyr.tier_transition': '{actor}\'s faith has been tested and strengthened, their {adj} commitment becoming {adj} still. The martyr\'s sacrifice grows ever more profound.',
  'tyrant.tier_transition': '{actor} claims {adj} dominion now, their {adj} rule spreading like shadow across the land. The tyrant\'s power knows no {adj} bounds.',
  'mystic.tier_transition': '{actor} ventures deeper into the {adj} mysteries that sustain the world. The mystic\'s communion with unseen forces grows {adj} and more consuming.',
  'rebel.tier_transition': '{actor} stands {adj} against the old order, their {adj} revolution gathering momentum. The rebel\'s defiance echoes {adj} across the battlefields.',
  'builder.tier_transition': '{actor}\'s visions grow {adj} and more ambitious, their {adj} constructions reshaping the very landscape. The builder\'s legacy rises ever {adj}.',
  'mentor.tier_transition': '{actor}\'s wisdom deepens with the seasons, their {adj} guidance becoming {adj} precious. The mentor\'s influence expands in {adj} circles.',
  'outcast.tier_transition': '{actor}\'s {adj} isolation has become {adj} strength, their rejection of society now their greatest asset. The outcast rises {adj}, unburdened by connection.',
  'diplomat.tier_transition': '{actor}\'s influence grows {adj} through {adj} negotiation and {adj} grace. The diplomat\'s {adj} networks expand in all directions.',
  'hunter.tier_transition': '{actor} has proven themselves the apex predator, their {adj} instincts {adj} honed. The hunter ascends to {adj} ranks of legend.',
  'dreamer.tier_transition': '{actor}\'s visions grow {adj} and more vivid, their {adj} imagination reshaping reality itself. The dreamer\'s {adj} reality bends to their will.',
  'avenger.tier_transition': '{actor}\'s {adj} rage grows {adj} potent, their {adj} vendetta becoming an inferno. The avenger ascends into {adj} legend and {adj} terror.',
};

// ═══════════════════════════════════════════════════════════════════
// 7. DILEMMA STAKES PROSE
// ═══════════════════════════════════════════════════════════════════

/**
 * Stakes-based prose variants for dilemma outcomes.
 * Keys: {outcome}.{stakes} where outcomes are mutual_trust, betrayed, exploitation, mutual_distrust
 * and stakes are low, medium, high. High stakes prose is darker, more dramatic, more consequential.
 * Low stakes prose is lighter, more casual, with smaller emotional weight.
 */
export const DILEMMA_STAKES_PROSE: Record<string, string[]> = {
  // MUTUAL TRUST outcomes
  'mutual_trust.low': [
    '{actor} and {target} found common ground — nothing grand, but {noun} enough to build on.',
    '{actor} nodded to {target} across the distance. A small thing. But small things are how trust begins.',
  ],
  'mutual_trust.medium': [
    '{actor} and {target} forged a bond of {adj} trust, their {noun} intertwining in ways both knew would matter.',
    'Something shifted between {actor} and {target} — a {adj} recognition, like two stones settling into the same foundation.',
  ],
  'mutual_trust.high': [
    '{actor} and {target}\'s covenant blazed eternal — {adj} and transcendent, a {noun} that would echo through ages unborn.',
    'What {actor} and {target} built together was {adj} beyond reckoning — a {noun} so complete it frightened those who witnessed it.',
  ],

  // BETRAYED outcomes
  'betrayed.low': [
    '{actor} felt a {adj} pang when {target} slipped away, leaving a small wound of {noun}.',
    '{target} was gone before {actor} understood what had happened. A {adj} absence, nothing more — but absences have weight.',
  ],
  'betrayed.medium': [
    '{actor}\'s heart shattered as {target}\'s {adj} betrayal revealed itself — the {noun} of trust unmade.',
    'The look on {actor}\'s face when {target}\'s {adj} deception surfaced — that look would haunt everyone who saw it. {noun} made visible.',
  ],
  'betrayed.high': [
    '{actor} plunged into profound {noun} as {target}\'s {adj} treachery laid bare the abyss within. A wound this {adj} would never truly heal.',
    '{actor} stood in the wreckage of everything {target} had promised. The {noun} was {adj} and absolute — the kind that remakes a person entirely.',
  ],

  // EXPLOITATION outcomes
  'exploitation.low': [
    '{actor} took what {target} offered without thought — a {noun} gesture of {adj} self-interest.',
    '{actor} barely noticed the cost to {target}. That was the {adj} part — how easy it was, how little {noun} it required.',
  ],
  'exploitation.medium': [
    '{actor} wielded {target}\'s {adj} faith like a {noun}, twisting their generosity into {noun} and {adj} dominion.',
    '{target}\'s trust became {actor}\'s instrument — shaped with {adj} precision into a tool of {noun} that served only one master.',
  ],
  'exploitation.high': [
    '{actor}\'s {adj} cruelty consumed {target}\'s very essence, leaving behind only {noun} and the {adj} ghost of who they once were.',
    'What {actor} did to {target} went beyond betrayal into something {adj} and systematic — a dismantling of {noun} so thorough it became its own kind of monument.',
  ],

  // MUTUAL DISTRUST outcomes
  'mutual_distrust.low': [
    '{actor} and {target} kept their distance — {adj}, wary, cautious in ways neither could name.',
    '{actor} and {target} passed each other like strangers. The {adj} space between them was its own kind of {noun}.',
  ],
  'mutual_distrust.medium': [
    '{actor} and {target} {verb} as one, locked in {adj} {noun}, each seeing only the other\'s {adj} potential for {noun}.',
    'Neither {actor} nor {target} would move first. The {adj} standoff hardened into something that resembled {noun} but was only fear.',
  ],
  'mutual_distrust.high': [
    '{actor} and {target} spiraled into {adj} {noun}, neither able to bridge the chasm. The distance between them grew {adj}, absolute, legendary in its {noun}.',
    '{actor} and {target} became a parable — two forces locked in {adj} opposition, their {noun} so complete it warped everything around them.',
  ],
};

// ═══════════════════════════════════════════════════════════════════
// 8. SPHERE INFLUENCE EVENTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Atmospheric prose for sphere influence changes at locations.
 * Keys: {sphere}.{direction} where direction is 'gaining' or 'losing'.
 * Used when a location\'s sphere influence shifts (8 spheres × 2 directions = 16 entries).
 * Values contain {location} placeholder.
 */
export const SPHERE_INFLUENCE_EVENTS: Record<string, string> = {
  'force.gaining': '{location} trembles with newfound {adj} power — the threads of fate grow taut, resonant with {noun}.',
  'force.losing': 'The {adj} grip on {location} falters. Its {noun} drains like water through breaking stone.',

  'matter.gaining': '{location} anchors itself deeper, its foundations growing {adj}, immovable. The world\'s {noun} settles into stone.',
  'matter.losing': '{location} grows {adj}, insubstantial — walls crack, earth shifts. The {noun} that held it steady slips away.',

  'energy.gaining': '{location} blazes with {adj} vitality, fire dancing across every surface. The {noun} here burns bright and dangerous.',
  'energy.losing': '{location} dims, the {noun} draining from its streets and spires. Darkness settles in, {adj} and absolute.',

  'life.gaining': '{location} blooms in impossible ways — growth erupts where none should flourish, {adj} and unstoppable. The {noun} here multiplies.',
  'life.losing': 'Death creeps through {location}. Plants wither, animals flee, and the {adj} pulse of {noun} fades to silence.',

  'mind.gaining': '{location} sharpens, its people growing {adj} and perceptive. Secrets cannot hide here anymore. The {noun} cuts like glass.',
  'mind.losing': 'Fog rolls across {location}, {adj} and suffocating. The {noun} of wisdom scatters, leaving only confusion and numbness.',

  'spirit.gaining': '{location} hums with {adj} presence — the veil thins, and other worlds press close. The {noun} of the sacred grows tangible.',
  'spirit.losing': 'The {adj} aura around {location} fades. Its spiritual {noun} withdraws, leaving the place hollow and mortal.',

  'time.gaining': '{location} resonates with ancient {noun} — the past and future draw close here, {adj} and inescapable. Chronology bends.',
  'time.losing': '{location} slips free from history\'s grip. Its {noun} scatters into the eternal now, {adj} and untethered.',

  'entropy.gaining': '{location} crumbles imperceptibly, its {adj} decay accelerating. The {noun} of dissolution spreads like rust through stone.',
  'entropy.losing': '{location} stabilizes, held fast against the end. The {noun} that threatened to unmake it retreats, {adj} and distant.',
};

// ═══════════════════════════════════════════════════════════════════
// 9. SEASONAL VOCABULARY
// ═══════════════════════════════════════════════════════════════════

/**
 * Seasonal word banks and atmosphere descriptions.
 * Used to flavor prose based on the current season.
 * Each season has adjectives, verbs, and an atmosphere string.
 */
export const SEASONAL_VOCABULARY: Record<string, {
  adjectives: string[];
  verbs: string[];
  atmosphere: string;
}> = {
  spring: {
    adjectives: ['verdant', 'fragile', 'awakening', 'tender', 'hopeful', 'violent'],
    verbs: ['bloomed', 'burst', 'stirred', 'trembled', 'rushed', 'thawed'],
    atmosphere: 'The world wakes with {adj} urgency. Life demands attention, impossible to ignore — growth breaking through dark soil.',
  },
  summer: {
    adjectives: ['golden', 'blazing', 'abundant', 'relentless', 'ripe', 'oppressive'],
    verbs: ['flourished', 'burned', 'ripened', 'seared', 'sweltered', 'consumed'],
    atmosphere: 'Heat bears down {adj} and inescapable. Everything reaches peak — power and excess press upon the land like a hand upon the heart.',
  },
  autumn: {
    adjectives: ['dying', 'crimson', 'bittersweet', 'waning', 'beautiful', 'fading'],
    verbs: ['withered', 'scattered', 'darkened', 'withdrew', 'transformed', 'descended'],
    atmosphere: 'The world exhales its last {adj} breath. Splendor and death dance together — seasons turn, and nothing stays.',
  },
  winter: {
    adjectives: ['frozen', 'merciless', 'eternal', 'stark', 'dead', 'silent'],
    verbs: ['froze', 'crystallized', 'entombed', 'stilled', 'shattered', 'numbed'],
    atmosphere: 'Ice locks all motion. The land sleeps {adj} and deeply, waiting for the world\'s next awakening — or else remaining frozen in shadow.',
  },
};

// ═══════════════════════════════════════════════════════════════════
// 10. ECHO FLAVOR TEXTS
// ═══════════════════════════════════════════════════════════════════

/**
 * Brief flavor text for echo revelations in the Ascendant interface.
 * 12 templates with {archetype}, {sphere}, {outcome} placeholders.
 * Used to add texture to the echo selection moment when choosing which echo to pursue.
 */
export const ECHO_FLAVOR_TEXTS: string[] = [
  'A fragment of {archetype}, forever changed by {sphere}. The memory {outcome} in eternal darkness.',
  'The {archetype}\'s final choice: surrender to {sphere} or transcend it? The answer waits in {outcome}.',
  '{sphere} marked this {archetype} in ways few could fathom. What {outcome} when the echo reveals the truth?',
  'This {archetype} walked a path {sphere} had paved. The ending {outcome} beyond mortal understanding.',
  '{outcome} — the only word for what {sphere} did to the {archetype}\'s soul.',
  'The {archetype} knew what {sphere} demanded. In the end, they {outcome} to its weight.',
  'A {archetype} consumed by their devotion to {sphere}. The chronicle {outcome} this in darkness and awe.',
  'When {sphere} finally spoke to this {archetype}, everything {outcome} in a single breath.',
  'The {archetype}\'s story is written in {sphere}\'s language. Each echo {outcome} a different verse.',
  'What would the {archetype} have chosen, if {sphere} had not chosen first? This echo {outcome} the question.',
  'The {archetype} became a thread in {sphere}\'s tapestry. The pattern {outcome} long ago.',
  'Some echoes speak of triumph. Others of {outcome} — when {sphere} and {archetype} became one.',
];

// ═══════════════════════════════════════════════════════════════════
// 11. STEALTH DETECTION PROSE
// ═══════════════════════════════════════════════════════════════════

/**
 * Prose for stealth & detection state transitions.
 * Keys: {observer_type}.{transition} where observer_type is 'mortal' or 'rival'.
 * Transitions: unaware_to_suspicion, suspicion_to_realization, realization_to_worship, worship_to_fanaticism (mortal)
 *              unaware_to_suspicion, suspicion_to_investigation, investigation_to_confirmation, confirmation_to_opposition (rival).
 * Values contain {location} and {sphere} placeholders.
 * Used when detection level changes due to player actions or agent witness events.
 */
export const STEALTH_DETECTION_PROSE: Record<string, string> = {
  // Mortal detection chain
  'mortal.unaware_to_suspicion': '{location}\'s people whisper of strange {adj} occurrences — a sign of {sphere}\'s touch, perhaps. Or mere coincidence? The threads are too {noun} to be certain.',
  'mortal.suspicion_to_realization': 'It is no longer whispers. {location} has seen the {adj} work of {sphere} with their own eyes. The proof hangs in the air like {noun}, undeniable.',
  'mortal.realization_to_worship': '{location} transforms. The people kneel before what they now understand — {sphere} walks among them, {adj} and real. Their devotion becomes {noun} and all-consuming.',
  'mortal.worship_to_fanaticism': 'Reason fails in {location}. The faithful burn with {adj} fervor, their love of {sphere} becoming {noun} and terrible. They would burn the world to please their god.',

  // Rival detection chain
  'rival.unaware_to_suspicion': 'Another god\'s fingerprints appear in {location} — {sphere}\'s markings, {adj} and deliberate. A rival\'s intelligence network stirs with {noun} concern.',
  'rival.suspicion_to_investigation': '{sphere}\'s presence in {location} is too {adj} to ignore. A rival god deploys their finest agents, the {noun} of conflict growing thick.',
  'rival.investigation_to_confirmation': 'Confirmation arrives with {adj} certainty — {sphere} is active, reshaping {location} and laying claim to what a rival believed was theirs. The {noun} of ambition ignites.',
  'rival.confirmation_to_opposition': 'War becomes inevitable. {location} is a prize no longer — it is a battlefield. Two gods claim {sphere}\'s domain, and the {adj} conflict spreads like {noun} across the land.',
};

// ═══════════════════════════════════════════════════════════════════
// 8. DILEMMA WORD POOLS
// ═══════════════════════════════════════════════════════════════════

/**
 * Word banks for dilemma prose template placeholder substitution.
 * Used in orchestrator.ts phaseDilemmaDetection to fill {adj}, {noun}, {verb} slots.
 * Keeping these in the content package makes them testable and expandable.
 */
export const DILEMMA_ADJ_POOL = [
  'quiet', 'fierce', 'solemn', 'bitter', 'fragile', 'burning', 'ancient', 'hollow',
  'trembling', 'cold', 'desperate', 'measured', 'ragged', 'luminous', 'unspoken',
];

export const DILEMMA_NOUN_POOL = [
  'purpose', 'strength', 'resolve', 'shadow', 'faith', 'devotion', 'reckoning', 'silence',
  'hunger', 'grief', 'defiance', 'memory', 'weight', 'obligation', 'ruin',
];

export const DILEMMA_VERB_POOL = [
  'circled', 'retreated', 'watched', 'bristled',
  'faltered', 'steadied', 'stiffened', 'glanced away', 'held still',
  'narrowed their gaze', 'drew breath', 'said nothing', 'turned cold',
  'weighed the silence', 'chose their words',
];

// ═══════════════════════════════════════════════════════════════════
// 13. BORN NAMES
// ═══════════════════════════════════════════════════════════════════

/**
 * Name pool for newly born agents in agentLifecycle.ts.
 * Selected via seeded PRNG. Names are placeholder identities —
 * agents may acquire proper names through narrative events later.
 *
 * Mix of sphere-tinted, culture-neutral, and poetic names.
 */
export const BORN_NAMES = [
  // Original pool
  'Newborn of the Weave', 'Child of Embers', 'Seedling of the Veil',
  'Heir of the Forge', 'Wanderer Reborn', 'Whisper of Dawn',
  'Thread of Fate', 'Echo of the Past', 'Spark of the New',
  'Voice of the Unwritten',
  // Sphere-tinted
  'Ember of Force', 'Clay-Born', 'Shard of Light',
  'Thorn of Life', 'Thought-Touched', 'Spirit-Kissed',
  'Daughter of Hours', 'Son of Entropy',
  // Poetic / culture-neutral
  'The Unnamed', 'A Quiet Arrival', 'Born Between Tides',
  'First Breath of Morning', 'Child of Broken Ground',
  'Stranger on the Threshold', 'The One Who Came After',
  'Dream-Woken', 'Ash and Promise', 'The Unlooked-For',
  // Wonder-tinted
  'Gift of the Season', 'Laughter in the Ruins',
  'Small Miracle', 'Hope Against Hope',
  // Foundation-tinted (Chaos)
  'Storm Without Warning', 'The Unplanned', 'Crack in the Pattern',
  // Foundation-tinted (Order)
  'The Expected', 'Measure of the Day', 'Child of the Sequence',
  // Foundation-tinted (Light)
  'Born in Full View', 'Morning\'s Witness', 'The Clearly Seen',
  // Foundation-tinted (Darkness)
  'Shadow\'s New Thread', 'The Hidden Arrival', 'Dusk-Cradled',
];

// ═══════════════════════════════════════════════════════════════════
// 14. WONDER CONTENT
// ═══════════════════════════════════════════════════════════════════

/**
 * WONDER_VIGNETTES — Short prose fragments describing moments of unexpected beauty,
 * awe, or transcendence in the game world. These are sphere-neutral and always set
 * against a backdrop of decay or struggle, making the wonder feel earned and meaningful.
 *
 * Used to punctuate the narrative with moments of light breaking through darkness —
 * the "Threadbare" aesthetic: rare beauty, fleeting grace, wonder layered over grief.
 */
export const WONDER_VIGNETTES: string[] = [
  'For a single breath, the clouds parted and light fell on the ruins like a benediction.',
  'A child\'s laughter echoed through the market — the first anyone could remember in weeks.',
  'The old tower, forgotten for centuries, suddenly caught the sunset. For a moment, it burned gold.',
  'In the mud and ash, a flower bloomed — small, defiant, impossible.',
  'The refugee gave the last of their bread to a stranger. In that gesture, the world felt less broken.',
  'An enemy laid down their weapon without a word. In the silence that followed, something shifted.',
  'The bells rang again. No one could remember the sound. It felt like forgiveness.',
  'Two rivals stood together against the storm. For the first time, neither raised a hand.',
  'The plague-marked child smiled. It was the first time the healer had seen them without pain.',
  'The song rose from a hundred throats — a memory of what the world used to be, kept alive by voice alone.',
  'The prisoner was released. They stood in sunlight for the first time in years and wept.',
  'The scholar found the lost text, its pages yellowed but whole. Knowledge survived the fire.',
  'The stranger said "thank you" — three words that made the exhausted listener remember why they persisted.',
  'The war-torn field fell silent. For one heartbeat, the whole world held its breath.',
  'A hand reached out in the darkness and found another. Neither would be alone tonight.',
  'The ocean, which had seemed barren, suddenly glowed with bioluminescence — beauty hiding beneath despair.',
];

/**
 * WONDER_TRIGGERS — Conditions under which a wonder moment might manifest.
 * Each trigger has an id, a descriptive condition string, and a weight (0.1-1.0).
 * Weights reflect how often the trigger should fire relative to others.
 *
 * Conditions are descriptive (not executable code). The engine will evaluate these
 * contextually based on game state during CB-012 implementation.
 */
export const WONDER_TRIGGERS: Array<{ id: string; condition: string; weight: number }> = [
  { id: 'high_sphere_influence', condition: 'A sphere has achieved high influence in a location', weight: 0.6 },
  { id: 'after_dilemma_resolution', condition: 'A dilemma was resolved through cooperation or sacrifice', weight: 0.7 },
  { id: 'birth_event', condition: 'A new agent is born into the world', weight: 0.8 },
  { id: 'low_doom', condition: 'Doom clock is below 25% and world feels hopeful', weight: 0.4 },
  { id: 'cultural_celebration', condition: 'A culture achieves a major milestone or celebration', weight: 0.5 },
  { id: 'agent_bond_formed', condition: 'Two agents form a strong bond or alliance', weight: 0.6 },
  { id: 'first_visit_location', condition: 'The avatar discovers a new location', weight: 0.5 },
  { id: 'intervention_success', condition: 'A divine intervention produces unexpected positive outcomes', weight: 0.7 },
  { id: 'mandate_progress', condition: 'A mandate reaches a major milestone or completion', weight: 0.5 },
  { id: 'peaceful_tick', condition: 'A tick passes with no deaths, no conflict, no escalation', weight: 0.3 },
];

/**
 * SPHERE_WONDER_FLAVORS — Sphere-specific wonder phrases. Each Creation Sphere has
 * 3 unique wonder-related flavor descriptors that can be woven into wonder vignettes
 * or serve as modifiers for wonder moments when a particular sphere is dominant.
 *
 * Used to add narrative texture: a Force-flavored wonder feels different from
 * a Mind-flavored wonder, even if they're describing the same moment.
 */
export const SPHERE_WONDER_FLAVORS: Record<string, string[]> = {
  force: [
    'a blade singing in the wind',
    'the clean ring of iron on iron',
    'strength given freely',
  ],
  matter: [
    'stone that remembers its shape',
    'earth breaking open to reveal growth',
    'something solid and real you can hold',
  ],
  energy: [
    'light spilling through broken windows',
    'a spark that refuses to die',
    'warmth spreading through cold hands',
  ],
  life: [
    'a heartbeat where silence had reigned',
    'green pushing through ash',
    'breath returning to the broken',
  ],
  mind: [
    'a truth suddenly, crystalline and clear',
    'understanding blooming between strangers',
    'knowledge passed like a precious gift',
  ],
  spirit: [
    'a presence felt but not named',
    'grace descending without warning',
    'connection across the void',
  ],
  time: [
    'a moment stretched into eternity',
    'the past and future aligned as one',
    'a second chance, against all odds',
  ],
  entropy: [
    'beauty in decay, pattern in chaos',
    'the phoenix-moment of necessary ending',
    'transformation through dissolution',
  ],
};

