/**
 * Social Scene Sphere Coloring — approach × sphere flavor phrases.
 *
 * Social scene templates use the `{sphere_flavor}` placeholder in their
 * narratives. This table maps (approach, sphere) → a short flavor phrase
 * that `enrichProse()` substitutes at prose resolution time (THR-1516 —
 * the table was authored 2026-04 and had no caller until then; the raw
 * token reached the player for ~50 days after the `{actor}` half shipped).
 *
 * Approaches:
 *   persuade, negotiate, intimidate, recruit, confess, accuse,
 *   swear, celebrate, interrogate, mentor, betray, mediate
 *
 * Spheres (12 — all of `SPHERE_NAMES`, foundation and creation):
 *   chaos, order, light, darkness, force, matter, energy, life, mind, spirit, time, entropy
 *
 * Which approach a template speaks in comes from `SOCIAL_SCENE_APPROACHES` —
 * a `templateId → SocialApproach` map kept here beside the phrases, because
 * the approach is a property of the *coloring*, not of the step (steps carry
 * `reach`, and nothing on `UnifiedActionTemplate` carries an approach).
 *
 * Usage:
 *   import { getSocialApproachForTemplate, getSphereFlavorPhrase } from '../data/social-scene-sphere-coloring';
 *   const approach = getSocialApproachForTemplate(template.id);
 *   const flavor = approach && getSphereFlavorPhrase(approach, actorSphere);
 *   // Returns e.g. "Together we grow stronger"
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to tune the sphere flavor phrases.
 * Add new approach keys as new encounter categories are authored, and
 * add every new `social_scene.*` template to SOCIAL_SCENE_APPROACHES —
 * the regression lock (`socialScenePlaceholders.test.ts`) fails on a
 * template the map does not name.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { SphereName } from '../types/index';

// ─── Types ─────────────────────────────────────────────────────────────────

export type SocialApproach =
  | 'persuade'
  | 'negotiate'
  | 'intimidate'
  | 'recruit'
  | 'confess'
  | 'accuse'
  | 'swear'
  | 'celebrate'
  | 'interrogate'
  | 'mentor'
  | 'betray'
  | 'mediate';

export type SphereFlavors = Record<SphereName, string>;
export type SphereColoringTable = Record<SocialApproach, SphereFlavors>;

// ─── Sphere Coloring Table ─────────────────────────────────────────────────

export const SPHERE_COLORING: SphereColoringTable = {

  persuade: {
    life:     'Together we grow stronger',
    entropy:  'Without this, everything decays',
    mind:     'Logic demands cooperation',
    force:    'Join me or be left behind',
    order:    'This is the natural order of things',
    chaos:    'The old rules are dead — make your own',
    matter:   'The foundation we build will endure',
    energy:   'Feel the pull of this opportunity',
    light:    'See it clearly and you will agree',
    darkness: 'What you do not know is already deciding for you',
    spirit:   'Something in you already knows this is right',
    time:     'This moment will not come around again',
  },

  negotiate: {
    life:     'A deal that nurtures both sides',
    entropy:  'Take what you can before it rots',
    mind:     'A calculated exchange — no sentiment needed',
    force:    'Strength recognizes strength in this arrangement',
    order:    'Within the law, within reason',
    chaos:    'No fixed terms — we adapt as we go',
    matter:   'Bricks and coin are honest currency',
    energy:   'The terms pulse with potential',
    light:    'Every term on the table, nothing hidden',
    darkness: 'What we agree here stays between us',
    spirit:   'A bargain kept is a bond made',
    time:     'Terms that hold this year and the next',
  },

  intimidate: {
    life:     'All things that breathe can be threatened',
    entropy:  'Everything you have built can be unmade',
    mind:     'I have already thought of every move you could make',
    force:    'I have broken stronger than you',
    order:    'The law will not protect you here',
    chaos:    'There are no rules where I come from',
    matter:   'Your walls, your stores, your name — I can reach them all',
    energy:   'This anger has been building for a long time',
    light:    'I know exactly what you did',
    darkness: 'You will not see it coming',
    spirit:   'Whatever you pray to has already left this room',
    time:     'I can wait longer than you can',
  },

  recruit: {
    life:     'A cause worth dedicating your life to',
    entropy:  'Before the end comes, leave your mark',
    mind:     'Your skills are wasted where you are',
    force:    'We need warriors, not scholars',
    order:    'The structure we build needs your part',
    chaos:    'Forget the path — forge your own',
    matter:   'Steady pay, steady purpose',
    energy:   'Something extraordinary is beginning',
    light:    'Come where the work is seen and named',
    darkness: 'Some work is done where no one looks',
    spirit:   'This is a calling, not a job',
    time:     'Join now, before the moment passes',
  },

  confess: {
    life:     'This truth has been eating me alive',
    entropy:  'What\'s done cannot be undone, but silence makes it worse',
    mind:     'You deserve to know the facts as they are',
    force:    'I\'m telling you this before someone else does',
    order:    'There are things that must be said to keep things right',
    chaos:    'The truth doesn\'t care what\'s convenient',
    matter:   'I have carried this long enough',
    energy:   'Something has to break — let it be this silence',
    light:    'It has to be said in the open',
    darkness: 'I kept it hidden, and the hiding was worse',
    spirit:   'My conscience will not carry it another day',
    time:     'I have waited too long already',
  },

  accuse: {
    life:     'What you did has cost lives',
    entropy:  'Your actions have brought rot to the root of this',
    mind:     'The evidence is clear — I have followed every thread',
    force:    'I will not let this stand unanswered',
    order:    'This is a violation of everything we agreed to',
    chaos:    'You thought there were no rules, and you were wrong',
    matter:   'Every piece of proof points to you',
    energy:   'This has been building since the beginning',
    light:    'The truth is plain to anyone who looks',
    darkness: 'You hid it well, but not well enough',
    spirit:   'You broke something that cannot be mended with coin',
    time:     'It has taken years, but the reckoning is here',
  },

  swear: {
    life:     'By every living thing I hold dear',
    entropy:  'Until my last breath and beyond it',
    mind:     'By my reason and my word',
    force:    'By strength and by deed',
    order:    'Before witnesses and in the sight of law',
    chaos:    'Unbound by any force but my own will',
    matter:   'As real as stone, as lasting as iron',
    energy:   'With everything I have and everything I am',
    light:    'Spoken in the open, for all to hear',
    darkness: 'Sworn in shadow, kept in shadow',
    spirit:   'On my soul and on all I hold sacred',
    time:     'Now and for every year that follows',
  },

  celebrate: {
    life:     'Let us feast and be renewed',
    entropy:  'What we have now, before it passes',
    mind:     'The plan succeeded — savor what we built',
    force:    'Raise your cup to those who fought beside you',
    order:    'A proper ceremony for a proper triumph',
    chaos:    'No ceremony — just the feeling of being alive',
    matter:   'The work is done; now the reward',
    energy:   'Tonight the world catches fire',
    light:    'Let everything be seen and shared tonight',
    darkness: 'What we did in the dark, we toast in the dark',
    spirit:   'Give thanks to whatever carried us here',
    time:     'A night to remember when the rest is forgotten',
  },

  interrogate: {
    life:     'Tell me, and no one need suffer for it',
    entropy:  'The more you hold back, the worse this gets',
    mind:     'I will piece it together one way or another',
    force:    'You will speak — I have patience',
    order:    'You are obligated to tell what you know',
    chaos:    'Rules don\'t apply in here',
    matter:   'Comfort has been removed to focus your thoughts',
    energy:   'I can feel when you\'re lying',
    light:    'Bring it into the open, and we can be done',
    darkness: 'No one knows you are here',
    spirit:   'Your silence weighs on you — I can see it',
    time:     'We have all night, and I have nowhere else to be',
  },

  mentor: {
    life:     'You have the seed of something great in you',
    entropy:  'What I know won\'t last forever — take it now',
    mind:     'The discipline will be hard, but the understanding will be worth it',
    force:    'Your potential needs shaping before it becomes dangerous',
    order:    'There is a right way to do this, and I will show you',
    chaos:    'Forget what you were taught — let me show you what actually works',
    matter:   'Skill is built stone by stone over time',
    energy:   'You are on the edge of something you can\'t yet see',
    light:    'Watch closely — I will show you plainly',
    darkness: 'Some lessons are learned where no one is watching',
    spirit:   'Skill is nothing without something to serve',
    time:     'It will take years, so we start today',
  },

  betray: {
    life:     'I did this to protect what I love most',
    entropy:  'Everything falls apart eventually — I just chose my side',
    mind:     'I calculated the odds and made the rational choice',
    force:    'I did what I had to do to survive',
    order:    'The arrangement had a higher loyalty I had to honor',
    chaos:    'Loyalty is a cage — I won\'t apologize for breaking it',
    matter:   'What was offered was too substantial to refuse',
    energy:   'Something in me knew it would come to this',
    light:    'I saw clearly what was coming, and chose',
    darkness: 'It was easier in the dark than you would think',
    spirit:   'My oath was to something greater than you',
    time:     'It was always going to end this way',
  },

  mediate: {
    life:     'We all lose if this continues — let something new grow',
    entropy:  'The conflict serves no one; it only consumes',
    mind:     'There is a solution that satisfies both of you if you\'ll listen',
    force:    'Neither of you can afford to lose what a fight would cost',
    order:    'Let us find the terms that hold',
    chaos:    'Forget what you think you know about each other',
    matter:   'The practical path is also the right one here',
    energy:   'There is enough tension here to collapse the whole arrangement',
    light:    'Lay everything out where both can see it',
    darkness: 'What is said here does not leave this room',
    spirit:   'You share more than you have forgotten',
    time:     'This feud will outlive you both if it is not settled now',
  },
};

// ─── Template → Approach Binding ───────────────────────────────────────────

/**
 * Which approach each social-scene template speaks in (THR-1516).
 *
 * Keyed by `UnifiedActionTemplate.id`. Steps carry `reach`, not approach, and
 * the template shape has no approach field, so the binding lives here with the
 * phrases it selects — one file to edit when a scene's voice changes. A map
 * rather than a per-template field so the coloring stays a content-manager
 * concern and the converter's field allowlist stays untouched.
 *
 * The regression lock asserts every `SOCIAL_SCENE_TEMPLATES` id appears here;
 * a template this map does not name renders its `{sphere_flavor}` stripped
 * (fail-soft) and warns once.
 */
export const SOCIAL_SCENE_APPROACHES: Readonly<Record<string, SocialApproach>> = {
  // Persuasion
  'social_scene.political_audience':    'persuade',
  'social_scene.recruitment_pitch':     'recruit',
  'social_scene.mentorship_offer':      'mentor',
  'social_scene.romantic_pursuit':      'persuade',
  'social_scene.religious_conversion':  'persuade',
  // Negotiation
  'social_scene.tavern_negotiation':    'negotiate',
  'social_scene.peace_negotiation':     'mediate',
  'social_scene.contract_dispute':      'negotiate',
  'social_scene.trade_fair':            'negotiate',
  'social_scene.territorial_accord':    'negotiate',
  // Intrigue
  'social_scene.betrayal_reveal':       'accuse',
  'social_scene.extortion':             'intimidate',
  'social_scene.court_whispers':        'persuade',
  'social_scene.spy_debrief':           'interrogate',
  'social_scene.double_agent':          'recruit',
  // Intimidation
  'social_scene.confrontation':         'intimidate',
  'social_scene.protection_racket':     'intimidate',
  'social_scene.warlords_demand':       'intimidate',
  'social_scene.the_challenge':         'intimidate',
  // Ceremony
  'social_scene.oath_swearing':         'swear',
  'social_scene.trial_judgment':        'accuse',
  'social_scene.coronation_speech':     'persuade',
  'social_scene.eulogy_memorial':       'celebrate',
  // Community
  'social_scene.festival_gathering':    'celebrate',
  'social_scene.war_council':           'persuade',
  'social_scene.tavern_confession':     'confess',
  'social_scene.town_assembly':         'persuade',
  // Investigation
  'social_scene.the_interrogation':     'interrogate',
  'social_scene.reputation_assessment': 'persuade',
  'social_scene.the_accusation':        'accuse',
};

// ─── API ──────────────────────────────────────────────────────────────────

/**
 * The approach a template speaks in, or undefined when the map does not name
 * it (fail-soft — the caller strips the placeholder).
 */
export function getSocialApproachForTemplate(
  templateId: string | undefined,
): SocialApproach | undefined {
  if (!templateId) return undefined;
  return SOCIAL_SCENE_APPROACHES[templateId];
}

/**
 * Get the sphere flavor phrase for a given social approach and sphere.
 * Returns undefined if the approach or sphere isn't in the table —
 * caller should substitute a generic phrase or omit the placeholder.
 */
export function getSphereFlavorPhrase(
  approach: SocialApproach,
  sphere: SphereName | undefined,
): string | undefined {
  if (!sphere) return undefined;
  return SPHERE_COLORING[approach]?.[sphere];
}
