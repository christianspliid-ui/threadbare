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
import type { SphereVocabulary, ShapedTemplate } from '../types/narrative';
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
 * Each template carries its structural shape for rotation-aware picking.
 *
 * Shapes: svo (direct), aftermath (consequence-first), inverted (prepositional-first),
 *         compound (em-dash/semicolon join), fragment (staccato)
 *
 * Placeholders:
 *   {name}                 → agent name (enrichProse) or actorName (fallback)
 *   {target}               → target name or location
 *   {location}             → current location name
 *   {adj}/{verb}/{noun}    → sphere vocabulary slots
 *   {they}/{them}/{their}  → gendered pronouns
 *   {?has_faction}…{/has_faction}  → conditional faction block
 *   {?has_ally}…{/has_ally}        → conditional ally block
 *
 * Author's checklist per template:
 *   ✓ {name} used (not {actor})
 *   ✓ {location} used or intentionally omitted
 *   ✓ {target} used where event has an addressee
 *   ✓ Sphere slots ({adj}/{verb}/{noun}) preserved
 *   ✓ Conditional blocks only where state changes the sentence's meaning
 *   ✓ Shape tag matches sentence structure
 *   ✓ Reads well in isolation
 */
export const ROUTINE_TEMPLATES: Record<string, ShapedTemplate[]> = {
  action_resolved: [
    {
      shape: 'svo',
      template: '{name} {verb} against {target} in {location}, a {adj} {noun} taking shape in their wake.',
    },
    {
      shape: 'svo',
      template: '{name} pressed their work on {target} — the {adj} {noun} settled where they stood{?has_faction}, and {faction} will hear of it{/has_faction}.',
    },
    {
      shape: 'aftermath',
      template: 'A {adj} {noun} spreads through {location}; {name} has {verb} {target}, and the moment will not be undone.',
    },
    {
      shape: 'inverted',
      template: 'Through {adj} {noun}, {name} {verb} {target} — nothing grand, but nothing that comes apart.',
    },
    {
      shape: 'compound',
      template: '{name} {verb} {target}; the {adj} {noun} is the record{?has_ally}, and {ally:strongest} is the witness{/has_ally}.',
    },
  ],
  action_failed: [
    {
      shape: 'svo',
      template: '{name} reached for {target}, but the effort dissolved into {noun} — {adj} and gone.',
    },
    {
      shape: 'svo',
      template: '{target} slipped from {name}\'s grasp in {location}, {adj} and elusive as {noun}.',
    },
    {
      shape: 'aftermath',
      template: 'Only {adj} {noun} remains in {location}; {name} fell short of {target}, and the gap does not close.',
    },
    {
      shape: 'fragment',
      template: '{name} reached. {They} fell short. The {adj} {noun} held against them.',
    },
  ],
  action_critical: [
    {
      shape: 'svo',
      template: '{name} {verb} with {adj} force, and {target} was changed by the {noun} that followed.',
    },
    {
      shape: 'svo',
      template: 'A {adj} moment — {name} {verb} beyond all expectation in {location}, and {noun} reshaped what was possible.',
    },
    {
      shape: 'inverted',
      template: 'Through {adj} {noun} and not by chance, {name} {verb} against {target} — the kind of act that is not forgotten.',
    },
    {
      shape: 'compound',
      template: '{name} {verb} against {target} — the {adj} {noun} is what remains{?has_faction}, and {faction} will mark it{/has_faction}.',
    },
  ],
  trait_acquired: [
    {
      shape: 'svo',
      template: '{name} gained something new — a {adj} {noun} settling into {them}{?has_faction}, a mark {faction} will recognize{/has_faction}.',
    },
    {
      shape: 'svo',
      template: 'Something shifted within {name}. The {adj} {noun} took root, and it will not leave.',
    },
    {
      shape: 'aftermath',
      template: 'A {adj} {noun} now walks {location}; {name} has learned what {they} did not know an hour ago.',
    },
    {
      shape: 'inverted',
      template: 'Through {adj} trial, {name} earned the {noun}{?has_ally} — a story for {ally:strongest} to hear{/has_ally}.',
    },
    {
      shape: 'fragment',
      template: '{name} is changed. The {adj} {noun} has settled in. It will not wash out.',
    },
  ],
  tier_transition: [
    {
      shape: 'svo',
      template: '{name}\'s thread glowed brighter in {location}, {adj} with the weight of {noun}.',
    },
    {
      shape: 'svo',
      template: 'The divine veil thinned around {name}, revealing the {adj} {noun} beneath — a step that cannot be taken back.',
    },
    {
      shape: 'aftermath',
      template: 'A new {adj} {noun} settles across {location}; {name} has risen, and the world will feel the difference.',
    },
    {
      shape: 'compound',
      template: '{name} ascended — the {adj} {noun} is their marker now{?has_faction}, and {faction} watches the change{/has_faction}.',
    },
  ],
  divine_intervention: [
    {
      shape: 'svo',
      template: 'You reached into the dream of {name}, a {adj} whisper carrying {noun} to where {they} slept.',
    },
    {
      shape: 'svo',
      template: 'You stirred the {noun} within {name} in {location}, a {adj} touch upon {their} sleeping mind.',
    },
    {
      shape: 'aftermath',
      template: 'A {adj} {noun} blooms in the space you opened; {name} will wake changed, though {they} will not know why.',
    },
    {
      shape: 'inverted',
      template: 'Through {adj} {noun}, you laid your hand on {name}\'s dreaming — the kind of touch that reshapes a life.',
    },
    {
      shape: 'compound',
      template: 'You moved through {name}\'s sleep — the {adj} {noun} is what you left behind{?has_faction}, something {faction} may one day name{/has_faction}.',
    },
  ],
  contested_action: [
    {
      shape: 'svo',
      template: '{name} and another {verb} for dominion over {target}\'s {adj} {noun} — neither willing to yield.',
    },
    {
      shape: 'svo',
      template: 'Two wills clashed over {target} in {location}: {adj} {noun} against {adj} resolve.',
    },
    {
      shape: 'aftermath',
      template: 'The {adj} {noun} is all that survives the clash; {name} and {target} fought for it, and neither walked away whole.',
    },
    {
      shape: 'compound',
      template: '{name} struggled for {target} — the {adj} {noun} is the prize{?has_faction}, and {faction} waits to see who holds it{/has_faction}.',
    },
  ],
  actor_death: [
    {
      shape: 'svo',
      template: '{name} fell as all must, the {adj} {noun} the final word in {location}.',
    },
    {
      shape: 'aftermath',
      template: 'A {adj} {noun} lingers in {location}. {name} is gone.',
    },
    {
      shape: 'fragment',
      template: '{name} is still. The {noun} remains. A {adj} hour{?has_faction}, and {faction} will mourn{/has_faction}.',
    },
    {
      shape: 'compound',
      template: '{name} crossed over — the {adj} {noun} is what {they} leave behind{?has_faction}, and {faction} will carry it{/has_faction}.',
    },
  ],
  doom_escalation: [
    {
      shape: 'svo',
      template: 'The world {verb}. {adj} {noun} spreads across the land, and those who see it know what is coming.',
    },
    {
      shape: 'svo',
      template: 'A crack widens in {location}. {adj} {noun} seeps through, irreversible as time.',
    },
    {
      shape: 'aftermath',
      template: 'The {adj} {noun} has already spread; the Unmaking {verb} closer, and the distance is no longer enough.',
    },
    {
      shape: 'fragment',
      template: '{adj} {noun}. The edge draws near. Those who know do not speak of it.',
    },
  ],
  mandate_stage: [
    {
      shape: 'svo',
      template: '{name}\'s mandate deepens. The {adj} {noun} of their purpose tightens around them.',
    },
    {
      shape: 'svo',
      template: 'One stage ends. Another begins. The {adj} {noun} of {name}\'s path continues to unfold in {location}.',
    },
    {
      shape: 'inverted',
      template: 'Through {adj} {noun}, the mandate {verb} forward — {name} pulled toward what cannot be avoided.',
    },
    {
      shape: 'compound',
      template: '{name} crossed a threshold — the {adj} {noun} marks the step{?has_faction}, and {faction} feels the shift{/has_faction}.',
    },
  ],
  trait_lost: [
    {
      shape: 'svo',
      template: 'Something faded within {name}. The {adj} {noun} dimmed and was gone, leaving only absence.',
    },
    {
      shape: 'svo',
      template: '{name}\'s {adj} {noun} unraveled like threads pulled from cloth in {location}.',
    },
    {
      shape: 'aftermath',
      template: 'The {adj} {noun} is simply gone; {name} reaches for it and finds only {them}self, diminished.',
    },
    {
      shape: 'fragment',
      template: '{name} felt it leave. The {adj} {noun}. Gone. A space where there was weight.',
    },
  ],
  dilemma_mutual_trust: [
    {
      shape: 'svo',
      template: '{name} and {target} moved together in {location}, each honoring the other with {adj} {noun}.',
    },
    {
      shape: 'svo',
      template: '{name} chose belief, and {target} answered with {adj} {noun} — the world {verb} in recognition.',
    },
    {
      shape: 'aftermath',
      template: 'A bond forged in {adj} trust remains in {location}; {name} and {target} emerged from their test transformed.',
    },
    {
      shape: 'compound',
      template: '{name} and {target} clasped hands — {adj} {noun} binding them tighter than thread{?has_faction}, witnessed by {faction}{/has_faction}.',
    },
  ],
  dilemma_betrayed: [
    {
      shape: 'svo',
      template: '{name} reached toward {target} with {adj} purpose, and found {noun} instead of faith.',
    },
    {
      shape: 'svo',
      template: '{name}\'s hope curdled into {adj} {noun} as {target}\'s true nature revealed itself in {location}.',
    },
    {
      shape: 'aftermath',
      template: 'A wound that will not heal — {adj} {noun} where trust once lived; {name} will not offer again what {target} destroyed.',
    },
    {
      shape: 'fragment',
      template: '{name} trusted. The faith was spent. Only {adj} {noun} remains.',
    },
  ],
  dilemma_exploitation: [
    {
      shape: 'svo',
      template: '{name} {verb} against {target}\'s trust in {location}, wielding {adj} {noun} without hesitation.',
    },
    {
      shape: 'svo',
      template: 'Where {target} offered {adj} faith, {name} carved out only {noun} and left nothing behind.',
    },
    {
      shape: 'inverted',
      template: 'Through {target}\'s {adj} {noun}, {name} took what was freely given and called it victory.',
    },
    {
      shape: 'compound',
      template: '{name} twisted {target}\'s {adj} {noun} into a weapon — the kind of act that cannot be unsaid{?has_faction}, and {faction} will remember it{/has_faction}.',
    },
  ],
  dilemma_mutual_distrust: [
    {
      shape: 'svo',
      template: '{name} and {target} circled each other in {location}, each seeing only {adj} {noun} where trust might have bloomed.',
    },
    {
      shape: 'svo',
      template: '{name} and {target} kept their distance, each safeguarding their {adj} {noun} from the other.',
    },
    {
      shape: 'aftermath',
      template: 'Where connection might have grown, there blooms only {adj} {noun}; {name} and {target} chose the wall instead of the door.',
    },
    {
      shape: 'fragment',
      template: '{name} held back. {target} held back. The {adj} {noun} between them had no name.',
    },
  ],
  faction_formed: [
    {
      shape: 'svo',
      template: '{name} gathered the scattered threads into a new {adj} {noun} in {location}.',
    },
    {
      shape: 'svo',
      template: '{name} bound their followers in {adj} {noun}, forging something new from what had been nothing.',
    },
    {
      shape: 'aftermath',
      template: 'A banner rises in {location}; {name} has {verb} the threads together, and the {adj} {noun} stands.',
    },
    {
      shape: 'inverted',
      template: 'From {adj} {noun} and common cause, {name} wove a faction strong enough to resist the void.',
    },
  ],
  culture_clash: [
    {
      shape: 'svo',
      template: '{name} and {target} collided in {location}, their {adj} cultures grinding against each other like {noun}.',
    },
    {
      shape: 'svo',
      template: '{name}\'s {adj} {noun} stood at odds with everything {target} held dear, and neither would yield.',
    },
    {
      shape: 'aftermath',
      template: 'Only {adj} {noun} marks where {name} and {target} met; the traditions {verb}, and neither emerged unchanged.',
    },
    {
      shape: 'compound',
      template: '{name} and {target} {verb} for the shape of {location} — {adj} against {adj}, {noun} the eventual arbiter.',
    },
  ],
  migration: [
    {
      shape: 'svo',
      template: '{name} led their people toward {adj} {noun}, leaving behind what could no longer be borne.',
    },
    {
      shape: 'svo',
      template: '{name} walked a {adj} path from {location}, their people following into the {noun} beyond.',
    },
    {
      shape: 'inverted',
      template: 'Through {adj} necessity, {name} and theirs moved on — seeking {noun} in untested lands.',
    },
    {
      shape: 'fragment',
      template: '{name} walked. Their people walked. The {adj} {noun} led them. What followed is not yet written.',
    },
  ],
  construction_complete: [
    {
      shape: 'svo',
      template: '{name} completed their {adj} work in {location}, and {noun} stood where once was nothing.',
    },
    {
      shape: 'svo',
      template: '{name} laid the final thread, and the {adj} {noun} was made whole.',
    },
    {
      shape: 'aftermath',
      template: 'A {adj} {noun} rises in {location}; {name} has built what {they} set out to build, and it will stand.',
    },
    {
      shape: 'inverted',
      template: 'Through {adj} {noun} and patient labor, {name} raised what the world said could not be raised.',
    },
  ],
  encounter_step_success: [
    {
      shape: 'svo',
      template: '{name} faced the {adj} {noun} in {location} and emerged unbroken.',
    },
    {
      shape: 'svo',
      template: 'The {noun} tested {name} with {adj} trials, yet {they} {verb} toward triumph.',
    },
    {
      shape: 'inverted',
      template: 'Against {adj} odds, {name} passed through the {noun} transformed — the kind of step that cannot be taken back.',
    },
    {
      shape: 'compound',
      template: '{name} endured the {adj} gauntlet — their {noun} proved stronger than the test{?has_ally}, and {ally:strongest} will know it{/has_ally}.',
    },
  ],
  encounter_step_failure: [
    {
      shape: 'svo',
      template: '{name} crumbled before the {adj} {noun} in {location}, their resolve shattered.',
    },
    {
      shape: 'svo',
      template: '{name} faced {adj} {noun} and fell short — {their} {noun} insufficient to the task.',
    },
    {
      shape: 'aftermath',
      template: 'Defeat lingers in {location}; the {adj} {noun} broke {name}, and little of what entered the test came through.',
    },
    {
      shape: 'fragment',
      template: '{name} tried. The {adj} {noun} was too much. {They} staggered from the crucible diminished.',
    },
  ],
  encounter_completed: [
    {
      shape: 'svo',
      template: '{name} emerged from {their} encounter {adj} and reborn, the {noun} within {them} transformed.',
    },
    {
      shape: 'svo',
      template: 'The {adj} trials complete, {name} stood changed in {location} — no longer the person they were before.',
    },
    {
      shape: 'inverted',
      template: 'Through {adj} {noun}, {name}\'s encounter finally ended — etching itself into {their} essence.',
    },
    {
      shape: 'compound',
      template: '{name} crossed the threshold of {noun} — the {adj} mark of it is permanent{?has_faction}, and {faction} will see the change{/has_faction}.',
    },
  ],
  encounter_abandoned: [
    {
      shape: 'svo',
      template: '{name} turned from {their} path in {location}, leaving the {adj} {noun} unfinished.',
    },
    {
      shape: 'svo',
      template: 'Too much. {name} left the {adj} {noun} behind and walked into the open world.',
    },
    {
      shape: 'aftermath',
      template: 'The {adj} {noun} goes unresolved; {name} broke away, and what was left unfinished will wait — or rot.',
    },
    {
      shape: 'fragment',
      template: '{name} turned away. The {adj} {noun} remained. Nothing was resolved.',
    },
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
 *
 * Each entry has a phraseId for repetition-guard deduplication (THR-456).
 */
export type DilemmaProseEntry = { phraseId: string; text: string };
export const DILEMMA_STAKES_PROSE: Record<string, DilemmaProseEntry[]> = {
  // MUTUAL TRUST outcomes
  'mutual_trust.low': [
    { phraseId: 'mutual_trust.low.01', text: '{actor} and {target} found common ground — nothing grand, but {noun} enough to build on.' },
    { phraseId: 'mutual_trust.low.02', text: '{actor} nodded to {target} across the distance. A small thing. But small things are how trust begins.' },
    { phraseId: 'mutual_trust.low.03', text: 'A {adj} silence fell between {actor} and {target} — the comfortable kind, where no words were needed.' },
    { phraseId: 'mutual_trust.low.04', text: '{actor} and {target} shared a {adj} understanding, brief as a glance, sturdy as old stone.' },
    { phraseId: 'mutual_trust.low.05', text: 'Neither {actor} nor {target} spoke of it afterward. But the {adj} accord between them was {noun} enough.' },
    { phraseId: 'mutual_trust.low.06', text: '{target} accepted what {actor} offered without question. A small {noun} given freely — and freely received.' },
    { phraseId: 'mutual_trust.low.07', text: '{actor} found, to their surprise, that {target} was someone worth knowing. A {adj} realization. A good one.' },
    { phraseId: 'mutual_trust.low.08', text: 'They went their separate ways, but something {adj} remained. The {noun} of an understanding, quietly held.' },
    { phraseId: 'mutual_trust.low.09', text: 'For once, the encounter between {actor} and {target} ended without trouble. A {adj} thing, and rare.' },
    { phraseId: 'mutual_trust.low.10', text: '{actor} extended a {adj} gesture; {target} received it. No {noun} was gained, but none was lost either.' },
    { phraseId: 'mutual_trust.low.11', text: '{actor} and {target} built nothing grand today — but the {adj} foundation of {noun} began with moments like this.' },
    { phraseId: 'mutual_trust.low.12', text: 'A glance, a word, a {adj} nod between {actor} and {target}. The seeds of {noun} are often as unremarkable as this.' },
  ],
  'mutual_trust.medium': [
    { phraseId: 'mutual_trust.medium.01', text: '{actor} and {target} forged a bond of {adj} trust, their {noun} intertwining in ways both knew would matter.' },
    { phraseId: 'mutual_trust.medium.02', text: 'Something shifted between {actor} and {target} — a {adj} recognition, like two stones settling into the same foundation.' },
    { phraseId: 'mutual_trust.medium.03', text: 'The accord between {actor} and {target} was {adj}, built on shared {noun} and the willingness to be known.' },
    { phraseId: 'mutual_trust.medium.04', text: '{actor} spoke plainly, and {target} listened. That was enough. The {adj} {noun} between them had substance now.' },
    { phraseId: 'mutual_trust.medium.05', text: '{target} placed faith in {actor}, and {actor} honoured it. The {adj} exchange left both of them changed in small ways.' },
    { phraseId: 'mutual_trust.medium.06', text: 'What passed between {actor} and {target} was {adj} — not easily named, but {noun} that would hold under pressure.' },
    { phraseId: 'mutual_trust.medium.07', text: 'They reached an understanding that felt {adj} and earned. {actor} and {target} both walked away with more than they\'d brought.' },
    { phraseId: 'mutual_trust.medium.08', text: 'The {adj} bond forming between {actor} and {target} was neither sudden nor fragile — it was the kind that grows by doing.' },
    { phraseId: 'mutual_trust.medium.09', text: '{actor} offered trust; {target} returned it in kind. A {adj} exchange that would not soon be forgotten by either.' },
    { phraseId: 'mutual_trust.medium.10', text: 'In the space of the encounter, something {adj} passed between {actor} and {target}: the recognition of shared {noun}.' },
    { phraseId: 'mutual_trust.medium.11', text: '{actor} and {target} moved as if they had always known each other. A {adj} {noun}, as rare as it was welcome.' },
    { phraseId: 'mutual_trust.medium.12', text: 'The {adj} thread between {actor} and {target} held. More than that — it pulled tighter, {noun} and sure.' },
  ],
  'mutual_trust.high': [
    { phraseId: 'mutual_trust.high.01', text: '{actor} and {target}\'s covenant blazed eternal — {adj} and transcendent, a {noun} that would echo through ages unborn.' },
    { phraseId: 'mutual_trust.high.02', text: 'What {actor} and {target} built together was {adj} beyond reckoning — a {noun} so complete it frightened those who witnessed it.' },
    { phraseId: 'mutual_trust.high.03', text: 'The bond forged between {actor} and {target} was {adj} and absolute — a {noun} that would outlast both of them.' },
    { phraseId: 'mutual_trust.high.04', text: '{actor} and {target} swore something {adj} in that moment. Not in words, but in the {noun} that passes between souls who truly see one another.' },
    { phraseId: 'mutual_trust.high.05', text: 'Legends would speak of what {actor} and {target} built. A {adj} {noun} that became the standard by which others measured their own.' },
    { phraseId: 'mutual_trust.high.06', text: 'There are bonds that endure and bonds that define. The {adj} covenant between {actor} and {target} was the latter — a {noun} carved into the world.' },
    { phraseId: 'mutual_trust.high.07', text: 'Nothing could unmake what {actor} and {target} had become to one another. The {adj} {noun} between them was now a fixed point.' },
    { phraseId: 'mutual_trust.high.08', text: 'Those who witnessed {actor} and {target} spoke of it for years. A {adj} accord so profound it seemed to {verb} the very air around them.' },
    { phraseId: 'mutual_trust.high.09', text: '{actor} gave {target} everything they had; {target} returned it doubled. The {adj} {noun} between them was the kind poets write about and statesmen envy.' },
    { phraseId: 'mutual_trust.high.10', text: 'The world bends around {adj} loyalties. What {actor} and {target} built was one of those rare {noun} — a thing the age would remember.' },
    { phraseId: 'mutual_trust.high.11', text: 'It was {adj} and inevitable, the trust between {actor} and {target}. A {noun} so complete that neither could say where one ended and the other began.' },
    { phraseId: 'mutual_trust.high.12', text: 'Their covenant was {adj} and burning — a {noun} that would shape everything each of them touched from that day forward.' },
  ],

  // BETRAYED outcomes
  'betrayed.low': [
    { phraseId: 'betrayed.low.01', text: '{actor} felt a {adj} pang when {target} slipped away, leaving a small wound of {noun}.' },
    { phraseId: 'betrayed.low.02', text: '{target} was gone before {actor} understood what had happened. A {adj} absence, nothing more — but absences have weight.' },
    { phraseId: 'betrayed.low.03', text: 'It was a minor {noun}, as betrayals go. {actor} noted it and filed it away. {target} probably didn\'t think of it at all.' },
    { phraseId: 'betrayed.low.04', text: '{actor} had expected better from {target}. Not much better — but something. A {adj} disappointment, quietly held.' },
    { phraseId: 'betrayed.low.05', text: '{target} took the easier path, and that path led away from {actor}. A {adj} thing. More common than it should be.' },
    { phraseId: 'betrayed.low.06', text: 'What {target} did wasn\'t cruel — just {adj} careless. {actor} told themselves it didn\'t matter. They weren\'t entirely wrong.' },
    { phraseId: 'betrayed.low.07', text: 'A small {noun} passed between {actor} and {target} — too minor to name, too real to ignore. {actor} adjusted their expectations.' },
    { phraseId: 'betrayed.low.08', text: '{actor} offered good faith; {target} offered something {adj} in return. Less than was given. The {noun} registered and was noted.' },
    { phraseId: 'betrayed.low.09', text: '{target} made a choice that cost {actor} something small. Perhaps {target} didn\'t even notice. That was the {adj} part.' },
    { phraseId: 'betrayed.low.10', text: 'The {adj} slight was real, even if {actor} would never say so. {target} had taken something without asking — a small {noun}, but theirs.' },
    { phraseId: 'betrayed.low.11', text: '{actor} and {target} parted on terms that were {adj} but wrong. The {noun} would settle into the space between them, slowly, quietly.' },
    { phraseId: 'betrayed.low.12', text: 'A {adj} wound, easily missed. But {actor} had learned something about {target} today — something worth knowing, even if the knowing hurt.' },
  ],
  'betrayed.medium': [
    { phraseId: 'betrayed.medium.01', text: '{actor}\'s heart shattered as {target}\'s {adj} betrayal revealed itself — the {noun} of trust unmade.' },
    { phraseId: 'betrayed.medium.02', text: 'The look on {actor}\'s face when {target}\'s {adj} deception surfaced — that look would haunt everyone who saw it. The {noun}, made visible at last.' },
    { phraseId: 'betrayed.medium.03', text: '{target} had smiled and lied, and {actor} had believed every word. The {adj} {noun} of it settled in like a cold that wouldn\'t leave.' },
    { phraseId: 'betrayed.medium.04', text: '{actor} understood now why {target} had been so {adj} — the whole of it was scaffolding for a betrayal. The {noun} burned clean.' },
    { phraseId: 'betrayed.medium.05', text: 'What {target} did to {actor} was calculated and {adj}. A blade hidden in {noun}, drawn at precisely the right moment.' },
    { phraseId: 'betrayed.medium.06', text: 'The {adj} weight of what {target} had done settled over {actor} slowly. By the time the full {noun} was clear, the damage was done.' },
    { phraseId: 'betrayed.medium.07', text: '{actor} had given {target} something {adj} — the kind of {noun} that can\'t be returned. {target} discarded it without ceremony.' },
    { phraseId: 'betrayed.medium.08', text: 'Betrayal, when it comes from someone {adj}, leaves a mark that ordinary wounds can\'t. {actor} would carry the {noun} of this for a long time.' },
    { phraseId: 'betrayed.medium.09', text: 'The moment {target} turned against {actor} was {adj} in its clarity — not a drift but a choice. The {noun} of that knowledge was its own kind of wound.' },
    { phraseId: 'betrayed.medium.10', text: '{actor} asked themselves what they had missed, what {adj} signs they had refused to see. The answer came in the shape of {noun}, and it was complete.' },
    { phraseId: 'betrayed.medium.11', text: '{target}\'s {adj} betrayal changed the way {actor} saw the world — not with bitterness, but with the {noun} of hard experience.' },
    { phraseId: 'betrayed.medium.12', text: 'What {target} built with {actor}, they built only to use. The {adj} architecture of false {noun} collapsed all at once, and {actor} was left standing in the rubble.' },
  ],
  'betrayed.high': [
    { phraseId: 'betrayed.high.01', text: '{actor} plunged into profound {noun} as {target}\'s {adj} treachery laid bare the abyss within. A wound this {adj} would never truly heal.' },
    { phraseId: 'betrayed.high.02', text: '{actor} stood in the wreckage of everything {target} had promised. The {noun} was {adj} and absolute — the kind that remakes a person entirely.' },
    { phraseId: 'betrayed.high.03', text: '{target}\'s {adj} betrayal did not merely hurt {actor} — it reshaped them. The {noun} left behind was new territory, unmapped and {adj}.' },
    { phraseId: 'betrayed.high.04', text: 'There are betrayals that wound and betrayals that hollow. What {target} did to {actor} was the second kind — a {adj} evacuation of {noun}.' },
    { phraseId: 'betrayed.high.05', text: '{actor} had believed in {target} with everything. The {adj} reversal of that faith was total: a {noun} that consumed years of {adj} understanding.' },
    { phraseId: 'betrayed.high.06', text: 'The world {actor} knew ended when {target} turned against them. The new world was {adj} and strange — all the familiar {noun} stripped away.' },
    { phraseId: 'betrayed.high.07', text: '{target}\'s {adj} treachery will be remembered. Not for its scale, but for its precision — the way it found exactly the {noun} that {actor} couldn\'t afford to lose.' },
    { phraseId: 'betrayed.high.08', text: '{actor} endured the betrayal with {adj} stillness. Inside, the {noun} was catastrophic — the kind of collapse that takes years to fully understand.' },
    { phraseId: 'betrayed.high.09', text: 'Some betrayals are {adj} and merciful: quick, clean, honest in their cruelty. What {target} inflicted on {actor} was the other kind — slow, thorough, and {noun} in its intention.' },
    { phraseId: 'betrayed.high.10', text: 'Everything {actor} had built with {target} had been {adj} fiction. The recognition of that {noun} came all at once, and it was devastating.' },
    { phraseId: 'betrayed.high.11', text: '{target}\'s {adj} treachery against {actor} became a parable. A lesson in the cost of {noun} given without reservation to someone who saw it only as leverage.' },
    { phraseId: 'betrayed.high.12', text: 'What {target} took from {actor} was not just {noun} — it was the {adj} capacity to extend that {noun} freely again. A cost greater than any single act.' },
  ],

  // EXPLOITATION outcomes
  'exploitation.low': [
    { phraseId: 'exploitation.low.01', text: '{actor} took what {target} offered without thought — a {noun} gesture of {adj} self-interest.' },
    { phraseId: 'exploitation.low.02', text: '{actor} barely noticed the cost to {target}. That was the {adj} part — how easy it was, how little {noun} it required.' },
    { phraseId: 'exploitation.low.03', text: 'A small {adj} advantage, taken without ceremony. {target} would notice the lack; {actor} would not notice taking it.' },
    { phraseId: 'exploitation.low.04', text: '{actor} used {target}\'s openness as opportunity. Nothing {adj} — just the {noun} of the situation, pressed lightly.' },
    { phraseId: 'exploitation.low.05', text: 'It was {adj}, the way {actor} extracted what they needed from {target}. Efficient. Unmemorable. The kind of thing that accumulates.' },
    { phraseId: 'exploitation.low.06', text: '{actor} leaned on {target}\'s goodwill. A small lean — {adj} rather than cruel. But goodwill, leaned on enough, wears thin.' },
    { phraseId: 'exploitation.low.07', text: '{target} gave freely; {actor} accepted freely. The {adj} asymmetry between them passed unnoticed by one and unacknowledged by the other.' },
    { phraseId: 'exploitation.low.08', text: 'A favour rendered, a {noun} taken, a {adj} advantage that cost someone else something they hadn\'t budgeted. {actor} didn\'t look back.' },
    { phraseId: 'exploitation.low.09', text: '{actor}\'s {adj} use of {target} was the kind that leaves no obvious marks. Just a small reduction in {noun}, easy to explain away.' },
    { phraseId: 'exploitation.low.10', text: '{target} assumed good faith; {actor} assumed opportunity. The {adj} difference between them decided the outcome.' },
    { phraseId: 'exploitation.low.11', text: 'The {adj} exploitation was modest — the kind that happens in a dozen places a day without anyone naming it. But {target} would feel the {noun} of it.' },
    { phraseId: 'exploitation.low.12', text: '{actor} had a {noun} and {target} had something that could fill it. The {adj} simplicity of what followed was almost unremarkable.' },
  ],
  'exploitation.medium': [
    { phraseId: 'exploitation.medium.01', text: '{actor} wielded {target}\'s {adj} faith like a {noun}, twisting their generosity into {noun} and {adj} dominion.' },
    { phraseId: 'exploitation.medium.02', text: '{target}\'s trust became {actor}\'s instrument — shaped with {adj} precision into a tool of {noun} that served only one master.' },
    { phraseId: 'exploitation.medium.03', text: '{actor} had understood, long before {target} did, the {adj} geometry of their relationship. The {noun} would be extracted, completely and cleanly.' },
    { phraseId: 'exploitation.medium.04', text: 'What {target} freely gave, {actor} took as tribute. The {adj} inversion of meaning was complete; {noun} had become control.' },
    { phraseId: 'exploitation.medium.05', text: '{actor} was {adj} about the terms from the beginning. It was {target} who failed to read them. The resulting {noun} was theirs to carry.' },
    { phraseId: 'exploitation.medium.06', text: 'Somewhere along the way, {actor} stopped seeing {target} and started seeing a {adj} resource. The {noun} this produced was clean and profitable.' },
    { phraseId: 'exploitation.medium.07', text: '{target}\'s {adj} generosity became a vulnerability, and {actor} had the {noun} — and the willingness — to exploit it.' },
    { phraseId: 'exploitation.medium.08', text: 'The arrangement between {actor} and {target} had seemed {adj} to {target}. To {actor}, it had always been a mechanism for controlled {noun}.' },
    { phraseId: 'exploitation.medium.09', text: '{actor} extracted what was needed with {adj} economy. {target}\'s {noun} was the price; neither party fully understood that at the start.' },
    { phraseId: 'exploitation.medium.10', text: 'A {adj} pattern established itself: {target} gave, {actor} took, the cycle of {noun} tightened. By the time it was visible, reversing it was costly.' },
    { phraseId: 'exploitation.medium.11', text: '{actor}\'s {adj} use of {target} was methodical — not cruel in the way that is remembered, but {noun} in the way that shapes a person permanently.' },
    { phraseId: 'exploitation.medium.12', text: 'The {adj} sophistication of what {actor} did to {target} lay in its invisibility. The {noun} was real; only the mechanism was hidden.' },
  ],
  'exploitation.high': [
    { phraseId: 'exploitation.high.01', text: '{actor}\'s {adj} cruelty consumed {target}\'s very essence, leaving behind only {noun} and the {adj} ghost of who they once were.' },
    { phraseId: 'exploitation.high.02', text: 'What {actor} did to {target} went beyond betrayal into something {adj} and systematic — a dismantling of {noun} so thorough it became its own kind of monument.' },
    { phraseId: 'exploitation.high.03', text: '{actor} did not merely use {target} — they took apart everything {target} was and catalogued it for parts. The {adj} {noun} left behind was permanent.' },
    { phraseId: 'exploitation.high.04', text: 'The scale of {actor}\'s exploitation of {target} was {adj} in its completeness. Nothing was left that had not been used. The {noun} was total.' },
    { phraseId: 'exploitation.high.05', text: '{target} gave everything; {actor} took more. The {adj} arithmetic of their relationship had always guaranteed this outcome. The {noun} was never in doubt.' },
    { phraseId: 'exploitation.high.06', text: 'There are acts of exploitation that are crimes and acts that become {adj} legend. What {actor} did to {target} crossed into the latter — a {noun} so complete historians would argue its ethics.' },
    { phraseId: 'exploitation.high.07', text: '{actor}\'s {adj} consumption of {target}\'s {noun} was the kind that echoes. Others witnessed it, learned from it, carried the lesson forward like a warning.' },
    { phraseId: 'exploitation.high.08', text: 'The relationship between {actor} and {target} ended when {actor} had extracted everything worth taking. The {adj} husk of {noun} that remained told the whole story.' },
    { phraseId: 'exploitation.high.09', text: '{actor} was {adj} in their purpose from the very beginning. {target} never knew they were being taken apart until the last {noun} was gone.' },
    { phraseId: 'exploitation.high.10', text: 'What was done to {target} was a {adj} masterclass in {noun} — not a crime of opportunity, but of architecture. {actor} had designed this.' },
    { phraseId: 'exploitation.high.11', text: 'The {adj} completeness of {actor}\'s exploitation left observers unsettled. Not because it was unique — but because the {noun} was visible, and no one had stopped it.' },
    { phraseId: 'exploitation.high.12', text: '{target} was left with the {adj} understanding that everything they had offered had been calculated, weighed, and taken. The {noun} was permanent, and deliberately so.' },
  ],

  // MUTUAL DISTRUST outcomes
  'mutual_distrust.low': [
    { phraseId: 'mutual_distrust.low.01', text: '{actor} and {target} kept their distance — {adj}, wary, cautious in ways neither could name.' },
    { phraseId: 'mutual_distrust.low.02', text: '{actor} and {target} passed each other like strangers. The {adj} space between them was its own kind of {noun}.' },
    { phraseId: 'mutual_distrust.low.03', text: 'Neither {actor} nor {target} made trouble. They also made no {noun}. The {adj} distance between them was understood, if not discussed.' },
    { phraseId: 'mutual_distrust.low.04', text: '{actor} and {target} circled each other with {adj} caution — not hostility, but the {noun} that comes from knowing too little about someone to trust them.' },
    { phraseId: 'mutual_distrust.low.05', text: 'A {adj} wariness settled between {actor} and {target}. Probably nothing. Probably just the {noun} of unfamiliarity, slowly doing its work.' },
    { phraseId: 'mutual_distrust.low.06', text: '{actor} watched {target}; {target} watched {actor}. Neither {verb} first. The {adj} standoff would resolve eventually, in one direction or another.' },
    { phraseId: 'mutual_distrust.low.07', text: 'Neither {actor} nor {target} trusted the other enough to be honest. The {adj} result was a conversation full of {noun} and nothing of substance.' },
    { phraseId: 'mutual_distrust.low.08', text: '{actor} and {target} exchanged {adj} pleasantries and departed. The {noun} between them was noted by both and mentioned by neither.' },
    { phraseId: 'mutual_distrust.low.09', text: 'The {adj} gap between {actor} and {target} wasn\'t growing, exactly — it was just never getting smaller. A {noun} of perpetual careful distance.' },
    { phraseId: 'mutual_distrust.low.10', text: '{actor} kept one eye on {target}; {target} returned the favour. A {adj} equilibrium of mutual {noun}, too light to break, too heavy to ignore.' },
    { phraseId: 'mutual_distrust.low.11', text: 'Trust would take time here, if it came at all. For now, {actor} and {target} maintained a {adj} separation — polite, watchful, unrevealing.' },
    { phraseId: 'mutual_distrust.low.12', text: 'Nothing was said that couldn\'t be unsaid. {actor} and {target} had learned that much. The {adj} {noun} between them stayed carefully unspoken.' },
  ],
  'mutual_distrust.medium': [
    { phraseId: 'mutual_distrust.medium.01', text: '{actor} and {target} {verb} as one, locked in {adj} {noun}, each seeing only the other\'s {adj} potential for {noun}.' },
    { phraseId: 'mutual_distrust.medium.02', text: 'Neither {actor} nor {target} would move first. The {adj} standoff hardened into something that resembled {noun} but was only fear.' },
    { phraseId: 'mutual_distrust.medium.03', text: 'The {adj} tension between {actor} and {target} was productive only in the sense that it kept both of them alert. The {noun} it created served no one.' },
    { phraseId: 'mutual_distrust.medium.04', text: '{actor} and {target} had built a {adj} architecture of mutual suspicion — each move interpreted as a threat, each {noun} a possible weapon.' },
    { phraseId: 'mutual_distrust.medium.05', text: 'Neither {actor} nor {target} believed what the other said, and both were {adj} right not to. The {noun} between them was a kind of wisdom.' },
    { phraseId: 'mutual_distrust.medium.06', text: 'The {adj} wariness between {actor} and {target} had calcified. What might once have been resolved with {noun} was now a structural feature.' },
    { phraseId: 'mutual_distrust.medium.07', text: '{actor} saw in {target} someone not to be trusted; {target} returned the favour with {adj} certainty. The {noun} between them deepened with every encounter.' },
    { phraseId: 'mutual_distrust.medium.08', text: 'They were {adj} mirrors of each other — each reflecting back exactly the distrust they inspired. The {noun} between them was almost elegant.' },
    { phraseId: 'mutual_distrust.medium.09', text: 'Neither {actor} nor {target} could make the first {adj} move without exposing themselves. The resulting {noun} lasted longer than anyone wanted.' },
    { phraseId: 'mutual_distrust.medium.10', text: 'What {actor} and {target} shared was not hatred — it was {adj} wariness so thorough it left no room for anything else. A {noun} by default.' },
    { phraseId: 'mutual_distrust.medium.11', text: 'The {adj} impasse between {actor} and {target} had become load-bearing. Neither could afford to resolve it without restructuring everything else.' },
    { phraseId: 'mutual_distrust.medium.12', text: '{actor} had reasons not to trust {target}; {target} had reasons not to trust {actor}. All the reasons were {adj}, and all of them were probably right.' },
  ],
  'mutual_distrust.high': [
    { phraseId: 'mutual_distrust.high.01', text: '{actor} and {target} spiraled into {adj} {noun}, neither able to bridge the chasm. The distance between them grew {adj}, absolute, legendary in its {noun}.' },
    { phraseId: 'mutual_distrust.high.02', text: '{actor} and {target} became a parable — two forces locked in {adj} opposition, their {noun} so complete it warped everything around them.' },
    { phraseId: 'mutual_distrust.high.03', text: 'The {adj} hatred between {actor} and {target} was not born in a day. It had been built, stone by stone, from {noun} and perceived {noun}, until it was architecture.' },
    { phraseId: 'mutual_distrust.high.04', text: 'What stood between {actor} and {target} was not just distrust but {adj} certainty — the absolute conviction that the other intended harm. The {noun} was beyond remedy.' },
    { phraseId: 'mutual_distrust.high.05', text: 'Observers gave {actor} and {target} wide berth. The {adj} opposition between them was the kind that spreads, poisoning {noun} wherever the two of them appeared together.' },
    { phraseId: 'mutual_distrust.high.06', text: 'The rift between {actor} and {target} had become {adj} and foundational — a {noun} that defined both of them in the eyes of those who knew them.' },
    { phraseId: 'mutual_distrust.high.07', text: '{actor} and {target} had moved past distrust into something {adj} — a settled, {noun} conviction that the other represented the worst the world had to offer.' },
    { phraseId: 'mutual_distrust.high.08', text: 'There would be no reconciliation between {actor} and {target}. The {adj} {noun} between them was too old, too deep, too thoroughly confirmed by history.' },
    { phraseId: 'mutual_distrust.high.09', text: 'Every encounter between {actor} and {target} added another layer to the {adj} {noun} between them. Neither saw any reason to stop building it.' },
    { phraseId: 'mutual_distrust.high.10', text: 'The world around {actor} and {target} had learned to accommodate their {adj} opposition. The {noun} between them was simply a feature of the landscape now.' },
    { phraseId: 'mutual_distrust.high.11', text: '{actor} and {target} would define one another long after both were gone. Their {adj} conflict had become {noun} — something people would name and study and argue over.' },
    { phraseId: 'mutual_distrust.high.12', text: 'There is {adj} enmity and there is transcendent enmity. What existed between {actor} and {target} had long since crossed into the latter — a {noun} that rewrote everything it touched.' },
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

