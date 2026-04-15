/**
 * Social Scene Sphere Coloring — approach × sphere flavor phrases.
 *
 * Social scene templates use the `{sphere_flavor}` placeholder in their
 * narratives. This table maps (approach, sphere) → a short flavor phrase
 * that gets substituted at prose resolution time.
 *
 * Approaches:
 *   persuade, negotiate, intimidate, recruit, confess, accuse,
 *   swear, celebrate, interrogate, mentor, betray, mediate
 *
 * Spheres (8):
 *   life, entropy, mind, force, order, chaos, matter, energy
 *
 * Usage:
 *   import { getSphereFlavorPhrase } from '../data/social-scene-sphere-coloring';
 *   const flavor = getSphereFlavorPhrase('persuade', actorSphere);
 *   // Returns e.g. "Together we can grow stronger"
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to tune the sphere flavor phrases.
 * Add new approach keys as new encounter categories are authored.
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
    life:    'Together we grow stronger',
    entropy: 'Without this, everything decays',
    mind:    'Logic demands cooperation',
    force:   'Join me or be left behind',
    order:   'This is the natural order of things',
    chaos:   'The old rules are dead — make your own',
    matter:  'The foundation we build will endure',
    energy:  'Feel the pull of this opportunity',
  },

  negotiate: {
    life:    'A deal that nurtures both sides',
    entropy: 'Take what you can before it rots',
    mind:    'A calculated exchange — no sentiment needed',
    force:   'Strength recognizes strength in this arrangement',
    order:   'Within the law, within reason',
    chaos:   'No fixed terms — we adapt as we go',
    matter:  'Bricks and coin are honest currency',
    energy:  'The terms pulse with potential',
  },

  intimidate: {
    life:    'All things that breathe can be threatened',
    entropy: 'Everything you have built can be unmade',
    mind:    'I have already thought of every move you could make',
    force:   'I have broken stronger than you',
    order:   'The law will not protect you here',
    chaos:   'There are no rules where I come from',
    matter:  'Your walls, your stores, your name — I can reach them all',
    energy:  'This anger has been building for a long time',
  },

  recruit: {
    life:    'A cause worth dedicating your life to',
    entropy: 'Before the end comes, leave your mark',
    mind:    'Your skills are wasted where you are',
    force:   'We need warriors, not scholars',
    order:   'The structure we build needs your part',
    chaos:   'Forget the path — forge your own',
    matter:  'Steady pay, steady purpose',
    energy:  'Something extraordinary is beginning',
  },

  confess: {
    life:    'This truth has been eating me alive',
    entropy: 'What\'s done cannot be undone, but silence makes it worse',
    mind:    'You deserve to know the facts as they are',
    force:   'I\'m telling you this before someone else does',
    order:   'There are things that must be said to keep things right',
    chaos:   'The truth doesn\'t care what\'s convenient',
    matter:  'I have carried this long enough',
    energy:  'Something has to break — let it be this silence',
  },

  accuse: {
    life:    'What you did has cost lives',
    entropy: 'Your actions have brought rot to the root of this',
    mind:    'The evidence is clear — I have followed every thread',
    force:   'I will not let this stand unanswered',
    order:   'This is a violation of everything we agreed to',
    chaos:   'You thought there were no rules, and you were wrong',
    matter:  'Every piece of proof points to you',
    energy:  'This has been building since the beginning',
  },

  swear: {
    life:    'By every living thing I hold dear',
    entropy: 'Until my last breath and beyond it',
    mind:    'By my reason and my word',
    force:   'By strength and by deed',
    order:   'Before witnesses and in the sight of law',
    chaos:   'Unbound by any force but my own will',
    matter:  'As real as stone, as lasting as iron',
    energy:  'With everything I have and everything I am',
  },

  celebrate: {
    life:    'Let us feast and be renewed',
    entropy: 'What we have now, before it passes',
    mind:    'The plan succeeded — savor what we built',
    force:   'Raise your cup to those who fought beside you',
    order:   'A proper ceremony for a proper triumph',
    chaos:   'No ceremony — just the feeling of being alive',
    matter:  'The work is done; now the reward',
    energy:  'Tonight the world catches fire',
  },

  interrogate: {
    life:    'Tell me, and no one need suffer for it',
    entropy: 'The more you hold back, the worse this gets',
    mind:    'I will piece it together one way or another',
    force:   'You will speak — I have patience',
    order:   'You are obligated to tell what you know',
    chaos:   'Rules don\'t apply in here',
    matter:  'Comfort has been removed to focus your thoughts',
    energy:  'I can feel when you\'re lying',
  },

  mentor: {
    life:    'You have the seed of something great in you',
    entropy: 'What I know won\'t last forever — take it now',
    mind:    'The discipline will be hard, but the understanding will be worth it',
    force:   'Your potential needs shaping before it becomes dangerous',
    order:   'There is a right way to do this, and I will show you',
    chaos:   'Forget what you were taught — let me show you what actually works',
    matter:  'Skill is built stone by stone over time',
    energy:  'You are on the edge of something you can\'t yet see',
  },

  betray: {
    life:    'I did this to protect what I love most',
    entropy: 'Everything falls apart eventually — I just chose my side',
    mind:    'I calculated the odds and made the rational choice',
    force:   'I did what I had to do to survive',
    order:   'The arrangement had a higher loyalty I had to honor',
    chaos:   'Loyalty is a cage — I won\'t apologize for breaking it',
    matter:  'What was offered was too substantial to refuse',
    energy:  'Something in me knew it would come to this',
  },

  mediate: {
    life:    'We all lose if this continues — let something new grow',
    entropy: 'The conflict serves no one; it only consumes',
    mind:    'There is a solution that satisfies both of you if you\'ll listen',
    force:   'Neither of you can afford to lose what a fight would cost',
    order:   'Let us find the terms that hold',
    chaos:   'Forget what you think you know about each other',
    matter:  'The practical path is also the right one here',
    energy:  'There is enough tension here to collapse the whole arrangement',
  },
};

// ─── API ──────────────────────────────────────────────────────────────────

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
