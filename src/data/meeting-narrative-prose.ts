/**
 * Hunger-variant god-voice prose for all Meeting beats.
 * Each template has a shared structure with Hunger-specific phrase slots.
 */

/** Beat 1 opening prose — the god reaches out through fate. */
export const SENSING_OPENING_PROSE: Record<string, string> = {
  'hunger.gather':   'You reach out through the web of fates, feeling for a thread that hums with longing. Three lives flicker at the edge of your sight.',
  'hunger.witness':  'You reach out through the web of fates, feeling for a thread that glints with hidden truth. Three lives flicker at the edge of your sight.',
  'hunger.preserve': 'You reach out through the web of fates, feeling for a thread that holds against the wind. Three lives flicker at the edge of your sight.',
  'hunger.reshape':  'You reach out through the web of fates, feeling for a thread that strains to become something new. Three lives flicker at the edge of your sight.',
  'hunger.reclaim':  'You reach out through the web of fates, feeling for a thread that trembles with loss. Three lives flicker at the edge of your sight.',
  'hunger.consume':  'You reach out through the web of fates, feeling for a thread that burns with hunger. Three lives flicker at the edge of your sight.',
  'hunger.sever':    'You reach out through the web of fates, feeling for a thread that cuts against the weave. Three lives flicker at the edge of your sight.',
  'hunger.kindle':   'You reach out through the web of fates, feeling for a thread that sparks with unspent fire. Three lives flicker at the edge of your sight.',
  'hunger.bind':     'You reach out through the web of fates, feeling for a thread that reaches for others. Three lives flicker at the edge of your sight.',
  'hunger.wander':   'You reach out through the web of fates, feeling for a thread that pulls toward the horizon. Three lives flicker at the edge of your sight.',
  'hunger.haunt':    'You reach out through the web of fates, feeling for a thread that echoes with the past. Three lives flicker at the edge of your sight.',
  'hunger.illuminate': 'You reach out through the web of fates, feeling for a thread that shines with clarity. Three lives flicker at the edge of your sight.',
};

/** Fallback if Hunger not found. */
export const SENSING_OPENING_FALLBACK = 'You reach out through the web of fates, feeling for a thread that hums with purpose. Three lives flicker at the edge of your sight.';

/** Beat 1 focus prompt. */
export const SENSING_FOCUS_PROMPT = 'Click again to choose. Or reach for another.';
export const SENSING_REST_PROMPT = 'Something stirs in the web of fate. Who calls to you?';

/** Beat 2 transition prose. */
export const TESTING_TRANSITION_IN = 'The thread tightens. You look closer...';
export const TESTING_BETWEEN_DILEMMAS = 'Another moment surfaces...';

/** Beat 3 transition prose. */
export const SPARK_TRANSITION_IN = 'Something has changed in them. You can feel it — a crack where the light gets in. What will you pour through it?';

/** Beat 4 bond prose — Hunger-specific. */
export const BOND_PROSE: Record<string, string> = {
  'hunger.gather':   'You will shelter them. They will be the first gathered under your wing.',
  'hunger.witness':  'You will watch over them. Their truth will be the first you guard.',
  'hunger.preserve': 'You will hold them against the tide. They will be the first you keep from fading.',
  'hunger.reshape':  'You will push them toward what they could be. They will be the first you reshape.',
  'hunger.reclaim':  'You will restore what was taken from them. They will be the first you reclaim.',
  'hunger.consume':  'You will feed on their fire. They will be the first to burn for you.',
  'hunger.sever':    'You will cut them free from what holds them. They will be the first you liberate.',
  'hunger.kindle':   'You will fan the flame within them. They will be the first you set alight.',
  'hunger.bind':     'You will weave them into your design. They will be the first thread in your tapestry.',
  'hunger.wander':   'You will set them on the road. They will be the first to walk your uncharted path.',
  'hunger.haunt':    'You will echo through their dreams. They will be the first to hear your voice in the dark.',
  'hunger.illuminate': 'You will show them what others cannot see. They will be the first to carry your light.',
};

export const BOND_PROSE_FALLBACK = 'The thread is woven. They are the first.';

/** Beat 4 release button text. */
export const BOND_RELEASE_TEXT = 'Let them walk.';
