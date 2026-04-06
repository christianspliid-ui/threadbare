import type { SphereName } from '../types/index';

export interface MeetingSceneAsset {
  id: string;
  path: string;
  placeholderGradient: string;
  emotionalTags: string[];
  dilemmaCategories: string[];
}

/** 16:9 scene backdrops for dilemma beats. Placeholder gradients until art is generated. */
export const DILEMMA_SCENE_ART: readonly MeetingSceneAsset[] = [
  { id: 'scene.crossroads', path: '/assets/meeting/scenes/crossroads.jpg', placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #2a1a0a, #1a2a1a)', emotionalTags: ['choice', 'journey'], dilemmaCategories: ['general'] },
  { id: 'scene.burning-village', path: '/assets/meeting/scenes/burning-village.jpg', placeholderGradient: 'linear-gradient(135deg, #3a0a0a, #2a0a0a, #1a0a0a)', emotionalTags: ['destruction', 'loss', 'urgency'], dilemmaCategories: ['axiological', 'reach_specific'] },
  { id: 'scene.throne-room', path: '/assets/meeting/scenes/throne-room.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a2a1a, #1a1a0a)', emotionalTags: ['power', 'politics', 'betrayal'], dilemmaCategories: ['axiological', 'domain_specific'] },
  { id: 'scene.prison-cell', path: '/assets/meeting/scenes/prison-cell.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #0a0a0a)', emotionalTags: ['confinement', 'mercy', 'justice'], dilemmaCategories: ['axiological'] },
  { id: 'scene.market-riot', path: '/assets/meeting/scenes/market-riot.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a1a0a, #1a0a0a)', emotionalTags: ['chaos', 'courage', 'crowd'], dilemmaCategories: ['general', 'reach_specific'] },
  { id: 'scene.forest-shrine', path: '/assets/meeting/scenes/forest-shrine.jpg', placeholderGradient: 'linear-gradient(135deg, #0a1a0a, #1a2a1a, #0a1a0a)', emotionalTags: ['sacred', 'nature', 'revelation'], dilemmaCategories: ['domain_specific'] },
  { id: 'scene.harbor-storm', path: '/assets/meeting/scenes/harbor-storm.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #0a1a1a)', emotionalTags: ['danger', 'choice', 'nature'], dilemmaCategories: ['general'] },
  { id: 'scene.plague-ward', path: '/assets/meeting/scenes/plague-ward.jpg', placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #0a1a0a, #1a0a0a)', emotionalTags: ['suffering', 'compassion', 'sacrifice'], dilemmaCategories: ['axiological', 'reach_specific'] },
];

/**
 * Select a scene asset matching emotional tags from a dilemma.
 * Falls back to first scene if no tags match.
 */
export function selectDilemmaScene(
  emotionalTags: string[],
  seed: number,
): MeetingSceneAsset {
  if (DILEMMA_SCENE_ART.length === 0) {
    return { id: 'scene.fallback', path: '', placeholderGradient: 'linear-gradient(135deg, #0a0a0f, #1a1a1a)', emotionalTags: [], dilemmaCategories: [] };
  }
  const scored = DILEMMA_SCENE_ART.map(scene => {
    const overlap = scene.emotionalTags.filter(t => emotionalTags.includes(t)).length;
    return { scene, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  // If top scores are tied, use seed to pick deterministically
  const topScore = scored[0].score;
  const tied = scored.filter(s => s.score === topScore);
  return tied[Math.abs(seed) % tied.length].scene;
}

// Satisfy the SphereName import — used by consumers of this module for sphere-specific art selection.
export type { SphereName };
