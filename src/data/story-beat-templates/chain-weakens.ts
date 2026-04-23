/** Placeholder story-beat prose for The Chain Weakens event phases. Polish deferred (TODO(THR-253)). */

export interface CompositionStoryBeatTemplate {
  id: string;
  title: string;
  prose: string;
  sphere: string;
}

export const CHAIN_WEAKENS_STORY_BEAT_TEMPLATES: CompositionStoryBeatTemplate[] = [
  {
    id: 'story-beat.chain-weakens-rumor',
    title: 'The Chain Weakens — Whispers',
    prose:
      'Rumors drift through the settlements like smoke before a fire: the ancient prison-chain that binds the Azath is strained. Few believe it. Those who do say nothing aloud.',
    sphere: 'void',
  },
  {
    id: 'story-beat.chain-weakens-plague-bringer',
    title: 'The Chain Weakens — The Herald Arrives',
    prose:
      'A figure walks the roads at night, leaving withered grass in its wake. The warden names it: a plague-bringer, drawn from the other side by the loosening of the chain. The event is no longer rumor.',
    sphere: 'void',
  },
  {
    id: 'story-beat.chain-weakens-shield-anvil',
    title: 'The Chain Weakens — A Counter-Force Rises',
    prose:
      'Word has reached those with old oaths. A champion stirs — the Shield-Anvil, last of a forgotten order — and begins the slow work of absorption. The chain still weakens. Now there is something to push back.',
    sphere: 'order',
  },
  {
    id: 'story-beat.chain-weakens-azath-cracks',
    title: 'The Chain Weakens — The Structure Cracks',
    prose:
      'A sound like a mountain's heartbeat, felt in the bones: the Azath glyph has fractured. Whatever was held within is no longer fully contained. This moment will not be undone.',
    sphere: 'void',
  },
];

export const CHAIN_WEAKENS_STORY_BEAT_MAP = new Map(
  CHAIN_WEAKENS_STORY_BEAT_TEMPLATES.map((t) => [t.id, t])
);
