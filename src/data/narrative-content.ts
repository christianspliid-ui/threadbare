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
    adjectives: ['mighty', 'thunderous', 'relentless', 'crushing', 'unyielding'],
    verbs: ['shattered', 'struck', 'overwhelmed', 'battered', 'surged'],
    nouns: ['might', 'fury', 'impact', 'avalanche', 'storm'],
  },
  matter: {
    adjectives: ['solid', 'enduring', 'immovable', 'crystalline', 'dense'],
    verbs: ['forged', 'shaped', 'hardened', 'anchored', 'crystallized'],
    nouns: ['stone', 'iron', 'foundation', 'bulwark', 'bedrock'],
  },
  energy: {
    adjectives: ['crackling', 'luminous', 'volatile', 'radiant', 'searing'],
    verbs: ['blazed', 'surged', 'erupted', 'ignited', 'cascaded'],
    nouns: ['flame', 'lightning', 'pulse', 'arc', 'inferno'],
  },
  life: {
    adjectives: ['verdant', 'flourishing', 'vital', 'blooming', 'fecund'],
    verbs: ['bloomed', 'healed', 'nurtured', 'grew', 'restored'],
    nouns: ['growth', 'renewal', 'bloom', 'vitality', 'spring'],
  },
  mind: {
    adjectives: ['keen', 'piercing', 'calculating', 'lucid', 'insightful'],
    verbs: ['discerned', 'analyzed', 'perceived', 'understood', 'unraveled'],
    nouns: ['thought', 'insight', 'clarity', 'revelation', 'logic'],
  },
  spirit: {
    adjectives: ['ethereal', 'transcendent', 'luminous', 'spectral', 'sacred'],
    verbs: ['resonated', 'sanctified', 'communed', 'invoked', 'channeled'],
    nouns: ['soul', 'essence', 'prayer', 'vision', 'aura'],
  },
  time: {
    adjectives: ['ancient', 'inexorable', 'cyclic', 'fading', 'eternal'],
    verbs: ['aged', 'unwound', 'echoed', 'rippled', 'decayed'],
    nouns: ['epoch', 'moment', 'tide', 'cycle', 'memory'],
  },
  entropy: {
    adjectives: ['decaying', 'consuming', 'inevitable', 'dissolving', 'chaotic'],
    verbs: ['crumbled', 'consumed', 'unraveled', 'corroded', 'scattered'],
    nouns: ['ash', 'ruin', 'void', 'decay', 'dissolution'],
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
  ordeal_encounter_success: [
    '{actor} faced the {adj} {noun} and emerged unbroken.',
    'The {noun} tested {actor} with {adj} trials, yet they {verb} toward triumph.',
    '{actor} endured the {adj} gauntlet, their {noun} proving stronger than the test.',
    'Against {adj} odds, {actor} passed through the {noun} transformed.',
  ],
  ordeal_encounter_failure: [
    '{actor} crumbled before the {adj} {noun}, their resolve shattered.',
    'The {noun} broke {actor}. When the {adj} ordeal ended, little of them remained whole.',
    '{actor} faced {adj} {noun} and fell short, their {noun} insufficient to the task.',
    'Defeated by {adj} {noun}, {actor} staggered from the crucible diminished.',
  ],
  ordeal_completed: [
    '{actor} emerged from their ordeal {adj} and reborn, the {noun} within them transformed.',
    'The {adj} trials completed, {actor} stood changed — no longer the person they were before.',
    'Through {adj} {noun}, {actor}\'s ordeal finally ended, etching itself into their essence.',
    '{actor} crossed the threshold of {noun}, forever marked by what they had endured with {adj} {noun}.',
  ],
  ordeal_abandoned: [
    '{actor} turned from their path, leaving the {adj} {noun} unfinished.',
    'The ordeal pulled at {actor}, but they chose to abandon the {adj} {noun}.',
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
  ordeal_encounter_success: [
    '{actor} faced the {adj} {noun} and emerged unbroken{personality} — scarred, transformed, but unbowed.',
    'The trial tested {actor} with {adj} {noun}, yet they {verb} past every threshold{personality}. What survives of them is {adj} steel.',
  ],
  ordeal_encounter_failure: [
    '{actor} crumbled before the {adj} {noun}{personality} — their thread snapped, their {noun} insufficient. What crawled from the crucible was {adj} shadow of who they were.',
    'The {noun} broke {actor}{personality}. When the {adj} ordeal ended, little remained whole. The {noun} had consumed all that was {adj}.',
  ],
  ordeal_completed: [
    '{actor}\'s ordeal drew to a close{personality}, leaving them {adj} and reborn. The {noun} woven through their being now marked them as transformed — no longer the person they were before.',
    'Through {adj} {noun}, {actor}\'s trial finally ended{personality}, etching itself into their essence. They had survived {noun} and emerged {adj} — altered at the root.',
  ],
  ordeal_abandoned: [
    '{actor} turned from their path{personality}, leaving the {adj} {noun} unfinished. Mercy or cowardice — the {noun} would decide which.',
    'The trial pulled at {actor}, threads tightening around their will{personality}, but they chose to abandon the {adj} {noun}. What price their escape would exact remained unknown.',
    '{actor} escaped the ordeal{personality}, but escape brought no relief — only the {adj} {noun} of what they had left unfinished.',
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
  ambition_contentment: ['driven by ambition', 'fueled by relentless desire'],
  courage_prudence: ['with fearless resolve', 'bold beyond measure'],
  cruelty_compassion: ['tempered by compassion', 'with a gentle hand'],
  cunning_honesty: ['with cunning precision', 'through shrewd calculation'],
  devotion_independence: ['bound by devotion', 'answering a higher call'],
  loyalty_treachery: ['loyal to the last', 'with unwavering fidelity'],
  tradition_innovation: ['embracing new paths', 'breaking with the old ways'],
  dominance_humility: ['commanding all before them', 'asserting dominion'],
  wrath_patience: ['with patient deliberation', 'measured and calm'],
  greed_generosity: ['with open-handed generosity', 'sharing freely'],
};
