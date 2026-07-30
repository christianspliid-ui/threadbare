/**
 * Hunger-variant god-voice prose for all Meeting beats.
 * Each template has a shared structure with Hunger-specific phrase slots.
 *
 * Register (THR-868 WS6): plain and descriptive — events, people, motivations. The
 * "web of fates / thread that hums / lives flicker at the edge of your sight" register
 * this file used to be written in is retired game-wide (Christian, 2026-07-30). The
 * hunger variants differ in the *motivation* they name, because naming what a mortal
 * wants is what the sensing beat is for. Enforced by
 * `src/data/__tests__/meetingProseRegister.test.ts` — zero vagueness-lexicon words.
 */

/** Beat 1 opening prose — what the god is looking for, per hunger. */
export const SENSING_OPENING_PROSE: Record<string, string> = {
  'hunger.gather':   'You look for the one who keeps taking people in. Three mortals come into focus.',
  'hunger.witness':  'You look for the one who has seen what the others walked past. Three mortals come into focus.',
  'hunger.preserve': 'You look for the one holding a line that is about to give. Three mortals come into focus.',
  'hunger.reshape':  'You look for the one who wants to be other than they are. Three mortals come into focus.',
  'hunger.reclaim':  'You look for the one carrying a loss they have not put down. Three mortals come into focus.',
  'hunger.consume':  'You look for the one who wants past all reason. Three mortals come into focus.',
  'hunger.sever':    'You look for the one with a tie they mean to cut. Three mortals come into focus.',
  'hunger.kindle':   'You look for the one with more fire in them than they have use for. Three mortals come into focus.',
  'hunger.bind':     'You look for the one who keeps reaching for other people. Three mortals come into focus.',
  'hunger.wander':   'You look for the one who cannot stay where they were born. Three mortals come into focus.',
  'hunger.haunt':    'You look for the one the dead have not finished with. Three mortals come into focus.',
  'hunger.illuminate': 'You look for the one who says out loud what the rest will not. Three mortals come into focus.',
};

/** Fallback if Hunger not found. */
export const SENSING_OPENING_FALLBACK = 'You look for the one worth your attention. Three mortals come into focus.';

/** Beat 1 focus prompt. */
export const SENSING_FOCUS_PROMPT = 'Click again to choose. Or look at another.';
export const SENSING_REST_PROMPT = 'Three lives are open to you. Which one do you watch?';

/** Beat 2 transition prose. */
export const TESTING_TRANSITION_IN = 'You keep your attention on them. A moment arrives that will settle part of who they become.';
export const TESTING_BETWEEN_DILEMMAS = 'Another moment comes.';

/**
 * Button that closes a formative test's fate reveal (THR-868).
 *
 * Deliberately not "Continue": the player is acknowledging what fate did, not
 * approving it. The register is plain and descriptive per the WS6 mandate.
 */
export const MEETING_FATE_REVEAL_CONTINUE = 'Let it stand';

/** Beat 3 transition prose. */
export const SPARK_TRANSITION_IN = 'They have changed, and they are open to you now. What do you give them?';

/** Beat 4 bond prose — Hunger-specific. */
export const BOND_PROSE: Record<string, string> = {
  'hunger.gather':   'You will shelter them. They are the first you take in.',
  'hunger.witness':  'You will watch over them. Their truth is the first you guard.',
  'hunger.preserve': 'You will hold them against what is coming. They are the first you keep.',
  'hunger.reshape':  'You will push them toward what they could be. They are the first you remake.',
  'hunger.reclaim':  'You will give back what was taken from them. They are the first you restore.',
  'hunger.consume':  'You will feed on their fire. They are the first to burn for you.',
  'hunger.sever':    'You will cut them loose from what holds them. They are the first you free.',
  'hunger.kindle':   'You will feed the fire in them. They are the first you set alight.',
  'hunger.bind':     'You will tie them to your design. They are the first bound to you.',
  'hunger.wander':   'You will set them on the road. They are the first to walk it for you.',
  'hunger.haunt':    'You will speak in their dreams. They are the first to hear you in the dark.',
  'hunger.illuminate': 'You will show them what the others cannot see. They are the first to carry your light.',
};

export const BOND_PROSE_FALLBACK = 'The bond holds. They are the first.';

/** Beat 4 release button text. */
export const BOND_RELEASE_TEXT = 'Let them walk.';
