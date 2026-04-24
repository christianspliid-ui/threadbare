import type { SphereName } from '../../types';

export interface CompositionStoryBeatTemplate {
  id: string;
  title: string;
  /** Legacy single-voice prose. Migration shim: runner treats as witnessFacts[0] when poetProse/witnessFacts absent. */
  prose?: string;
  /** Poet voice — cosmic/emotional register. Divine-voice beats populate this. */
  poetProse?: string;
  /** Witness voice — factual bullets. Mortal-voice beats populate this. */
  witnessFacts?: string[];
  /** Default voice if PhaseStoryBeatSpec doesn't override. Author guidance only. */
  defaultVoice?: 'divine' | 'mortal';
  sphere: SphereName;
  /** Optional mood override; if omitted, runner uses STORY_BEAT_DEFAULT_MOOD. */
  mood?: string;
}

export const CHAIN_WEAKENS_STORY_BEAT_TEMPLATES: CompositionStoryBeatTemplate[] = [
  {
    id: 'story-beat.chain-weakens-rumor',
    title: 'The Chain Weakens \u2014 A Loose Thread',
    poetProse:
      'A bond in the weave goes slack, and four villages that share no road wake with the wrong air in their lungs.',
    witnessFacts: [
      'Unease is reported from settlements with no common road between them.',
      'The warden of Halvern finds her ward-stone split along its seam.',
      'No one says the word. Everyone thinks it.',
    ],
    defaultVoice: 'divine',
    sphere: 'entropy',
    mood: 'uneasy',
  },
  {
    id: 'story-beat.chain-weakens-plague-bringer',
    title: 'The Chain Weakens \u2014 The Herald',
    poetProse:
      'A figure walks the night roads and the grass withers behind it in a precise band, and a warden names it and the air admits the word.',
    witnessFacts: [
      'Scouts sight the same lone figure on three roads within one watch.',
      'Vegetation dies along its path in a band exactly one stride wide.',
      'Warden Halvern speaks the old name aloud: \u201cplague-bringer.\u201d',
      'Nothing has yet turned the herald back.',
    ],
    defaultVoice: 'divine',
    sphere: 'entropy',
    mood: 'dread',
  },
  {
    id: 'story-beat.chain-weakens-shield-anvil',
    title: 'The Chain Weakens \u2014 Oath Wakes',
    poetProse:
      'An oath older than the kingdoms wakes in one living throat, slow because the oath was always slow, certain because it was always certain.',
    witnessFacts: [
      'A sworn of the Order of the Grey Watch takes the field before the herald.',
      'They assume the Shield-Anvil burden: the herald\u2019s harm is drawn into their own body.',
      'Smiths, healers, and farmhands of three villages organise behind them.',
      'The bond still slackens. There is now a body between it and the world.',
    ],
    defaultVoice: 'mortal',
    sphere: 'order',
    mood: 'resolute',
  },
  {
    id: 'story-beat.chain-weakens-azath-cracks',
    title: 'The Chain Weakens \u2014 The Seal Fails',
    poetProse:
      'A sound like a mountain\u2019s heartbeat passes through bone, and the Azath glyph splits along a single line no tool could have cut.',
    witnessFacts: [
      'The Azath glyph fractures along one clean line from apex to base.',
      'Containment of the prison-sigil is no longer complete.',
      'Some of what was held within is now out. Not all. Not yet.',
      'This moment will not be undone.',
    ],
    defaultVoice: 'divine',
    sphere: 'entropy',
    mood: 'catastrophic',
  },
  {
    id: 'story-beat.chain-weakens-reckoning',
    title: 'The Chain Weakens \u2014 The Reckoning',
    poetProse:
      'The order remembers what their oath meant before it meant nothing, and they speak the name of it, and in the speaking, begin.',
    witnessFacts: [
      'The Order of the Grey Watch witnesses the glyph-crack with their own eyes.',
      'Their First Sworn names the event aloud: \u201cThe Chain has broken.\u201d',
      'Standing mandates are revoked. Older doctrines wake in their place.',
      'Riders go out before dawn to every road the herald has touched.',
    ],
    defaultVoice: 'mortal',
    sphere: 'order',
    mood: 'determined',
  },
];

export const CHAIN_WEAKENS_STORY_BEAT_MAP = new Map(
  CHAIN_WEAKENS_STORY_BEAT_TEMPLATES.map((t) => [t.id, t])
);
