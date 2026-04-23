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

// TODO(THR-253): prose polish pass — these are placeholder-plus quality (sufficient to render dual-voice)
export const CHAIN_WEAKENS_STORY_BEAT_TEMPLATES: CompositionStoryBeatTemplate[] = [
  {
    id: 'story-beat.chain-weakens-rumor',
    title: 'The Chain Weakens — Whispers',
    poetProse:
      'A note in the weave goes slack. Not a sound, not yet — a looseness where a bond used to hold. The air in three settlements turns wrong before anyone remembers why.',
    witnessFacts: [
      'Rumors surface in settlements with no shared road.',
      'A warden\u2019s charm cracks in its stone box.',
      'No one yet says the word \u201cchain.\u201d They think it.',
    ],
    defaultVoice: 'divine',
    sphere: 'entropy',
    mood: 'uneasy',
  },
  {
    id: 'story-beat.chain-weakens-plague-bringer',
    title: 'The Chain Weakens — The Herald Arrives',
    poetProse:
      'Something walks the night roads that is not of the night. Grass withers where it passes; the warden, old and certain, names it by the oldest name \u2014 plague-bringer \u2014 and the air admits the word.',
    witnessFacts: [
      'A lone figure sighted on three roads in one watch.',
      'Vegetation along the route dies in a precise band.',
      'Warden publicly names the threat: \u201cplague-bringer.\u201d',
      'The rumor is no longer rumor.',
    ],
    defaultVoice: 'divine',
    sphere: 'entropy',
    mood: 'dread',
  },
  {
    id: 'story-beat.chain-weakens-shield-anvil',
    title: 'The Chain Weakens — A Counter-Force Rises',
    poetProse:
      'An oath older than most of the kingdoms wakes in one living throat. The Shield-Anvil begins \u2014 slowly, because absorption is always slow \u2014 to take the weight of what is coming.',
    witnessFacts: [
      'A champion of a forgotten order takes the field.',
      'They assume the Shield-Anvil burden: absorb the herald\u2019s harm into themselves.',
      'Local aid begins to organise behind them.',
      'The chain still weakens. There is now something between it and the world.',
    ],
    defaultVoice: 'mortal',
    sphere: 'order',
    mood: 'resolute',
  },
  {
    id: 'story-beat.chain-weakens-azath-cracks',
    title: 'The Chain Weakens — The Structure Cracks',
    poetProse:
      'A sound like a mountain\u2019s heartbeat, felt in the bones. The Azath glyph \u2014 the prison-sigil itself \u2014 fractures along a line no tool could have cut. Whatever was held within is no longer fully contained.',
    witnessFacts: [
      'The Azath glyph visibly cracks along a single line.',
      'Containment is no longer complete.',
      'Some of what was held inside is now out. Not all. Yet.',
      'This moment will not be undone.',
    ],
    defaultVoice: 'divine',
    sphere: 'entropy',
    mood: 'catastrophic',
  },
  {
    // TODO(THR-253): prose polish
    id: 'story-beat.chain-weakens-reckoning',
    title: 'The Chain Weakens — The Reckoning',
    poetProse:
      'The order has not looked away. They have watched the crack open and they remember what oath meant \u2014 before it meant nothing. They speak the name of what has happened, and in the speaking, begin.',
    witnessFacts: [
      'The divine-champion order witnesses the glyph-crack directly.',
      'They publicly name the event: \u201cThe Chain has broken.\u201d',
      'Mandates change; old doctrines wake.',
      'A reckoning has begun.',
    ],
    defaultVoice: 'mortal',
    sphere: 'order',
    mood: 'determined',
  },
];

export const CHAIN_WEAKENS_STORY_BEAT_MAP = new Map(
  CHAIN_WEAKENS_STORY_BEAT_TEMPLATES.map((t) => [t.id, t])
);
