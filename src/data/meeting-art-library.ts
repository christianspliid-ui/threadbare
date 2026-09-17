import type { SphereName } from '../types/index';

export interface MeetingSceneAsset {
  id: string;
  path: string;
  placeholderGradient: string;
  emotionalTags: string[];
  dilemmaCategories: string[];
}

/**
 * Scene assets that exist on disk but must NOT be registered below (THR-868 audit,
 * 2026-07-30).
 *
 * Image doctrine ruling 10: a meeting scene omits or silhouettes the agent, because the
 * candidate portrait chosen at Sensing is the only human likeness shown across the flow.
 * A scene carrying its own individuated face competes with it; a scene carrying baked-in
 * text or UI is worse than that.
 *
 * Each entry is a defect found by inspecting all 32 files in
 * `public/assets/meeting/scenes/`, not a stylistic preference. Pinned by
 * `src/data/__tests__/meetingSceneDoctrine.test.ts` so a later author cannot
 * re-register one by reaching for a plausible-sounding filename.
 *
 * **Currently empty (THR-876, 2026-09-17).** The five files the audit quarantined —
 * `prison-cell` (two UI buttons painted in), `plague-ward` (an individuated child's
 * face), `healing-tent` and `burning-palace` (baked-in caption / title text) and
 * `great-hall-feast` (a dozen front-lit faces) — were regenerated under the same
 * filenames as unpeopled scenes, passed the contact-sheet and top/bottom-strip text
 * audit (`Docs/evidence/thr-876/`), and are registered below. The mechanism stays: the
 * next audit finding goes here as `'<basename>': '<the defect, stated>'`, and the file
 * must remain on disk for as long as its entry does.
 */
export const QUARANTINED_SCENE_ASSETS: Readonly<Record<string, string>> = {};

/**
 * 16:9 scene backdrops for formative-test beats.
 *
 * Selection is by emotional-tag overlap only (`selectDilemmaScene`); nothing outside
 * this file references a scene id, so entries may be re-pointed freely.
 *
 * **Tag coverage is load-bearing, not decorative.** Only 30 tag values are authored
 * across the dilemma library's 167 templates, so many draws arrive with a thin or empty
 * tag list, every scene ties at score 0, and the seed picks off the head of the array.
 * The `emotionalTags` below therefore cover the authored dilemma vocabulary
 * (belonging · protection · sacrifice · loss · devotion · nurturing · compassion ·
 * desperation · loyalty · duty · shelter · community · endurance) rather than whatever
 * each picture happens to evoke.
 */
export const DILEMMA_SCENE_ART: readonly MeetingSceneAsset[] = [
  { id: 'scene.crossroads', path: '/assets/meeting/scenes/crossroads.jpg', placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #2a1a0a, #1a2a1a)', emotionalTags: ['choice', 'journey', 'loss'], dilemmaCategories: ['general'] },
  { id: 'scene.burning-village', path: '/assets/meeting/scenes/burning-village.jpg', placeholderGradient: 'linear-gradient(135deg, #3a0a0a, #2a0a0a, #1a0a0a)', emotionalTags: ['destruction', 'loss', 'urgency', 'desperation'], dilemmaCategories: ['axiological', 'reach_specific'] },
  { id: 'scene.throne-room', path: '/assets/meeting/scenes/throne-room.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a2a1a, #1a1a0a)', emotionalTags: ['power', 'politics', 'betrayal', 'duty'], dilemmaCategories: ['axiological', 'domain_specific'] },
  // Replaces the quarantined `scene.prison-cell`: an empty judgment hall carries the
  // same mercy/justice weight with no choice buttons painted into it.
  { id: 'scene.justice-hall', path: '/assets/meeting/scenes/justice-hall.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #0a0a0a)', emotionalTags: ['confinement', 'mercy', 'justice', 'duty'], dilemmaCategories: ['axiological'] },
  { id: 'scene.market-riot', path: '/assets/meeting/scenes/market-riot.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a1a0a, #1a0a0a)', emotionalTags: ['chaos', 'courage', 'crowd', 'community'], dilemmaCategories: ['general', 'reach_specific'] },
  { id: 'scene.forest-shrine', path: '/assets/meeting/scenes/forest-shrine.jpg', placeholderGradient: 'linear-gradient(135deg, #0a1a0a, #1a2a1a, #0a1a0a)', emotionalTags: ['sacred', 'nature', 'revelation', 'devotion'], dilemmaCategories: ['domain_specific'] },
  { id: 'scene.harbor-storm', path: '/assets/meeting/scenes/harbor-storm.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #0a1a1a)', emotionalTags: ['danger', 'choice', 'nature', 'endurance'], dilemmaCategories: ['general'] },
  // Replaces the quarantined `scene.plague-ward` — the reachable one. Any dilemma tagged
  // 'sacrifice' or 'compassion' scored it top and rendered that child's face.
  { id: 'scene.lantern-vigil', path: '/assets/meeting/scenes/lantern-vigil.jpg', placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #0a1a0a, #1a0a0a)', emotionalTags: ['suffering', 'compassion', 'sacrifice', 'nurturing'], dilemmaCategories: ['axiological', 'reach_specific'] },
  // Widening the pool is the audit's byproduct: 24 of the 32 scene files on disk were
  // unregistered, so thin-tag draws cycled through the same two backdrops. Every
  // addition below was inspected for likeness and for baked-in text, top and bottom.
  { id: 'scene.village-gate-night', path: '/assets/meeting/scenes/village-gate-night.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a0a, #1a1a0a, #0a0a1a)', emotionalTags: ['shelter', 'protection', 'belonging'], dilemmaCategories: ['general', 'axiological'] },
  { id: 'scene.battlefield-dawn', path: '/assets/meeting/scenes/battlefield-dawn.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a1a, #2a2a2a, #1a1a1a)', emotionalTags: ['sacrifice', 'loss', 'duty'], dilemmaCategories: ['axiological', 'reach_specific'] },
  { id: 'scene.moonlit-courtyard', path: '/assets/meeting/scenes/moonlit-courtyard.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #0a1a1a)', emotionalTags: ['belonging', 'community', 'loyalty'], dilemmaCategories: ['general', 'domain_specific'] },
  { id: 'scene.misty-graveyard', path: '/assets/meeting/scenes/misty-graveyard.jpg', placeholderGradient: 'linear-gradient(135deg, #0a1a1a, #1a1a1a, #0a0a0a)', emotionalTags: ['loss', 'grief', 'devotion'], dilemmaCategories: ['axiological', 'domain_specific'] },
  { id: 'scene.candlelit-study', path: '/assets/meeting/scenes/candlelit-study.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #1a1a0a, #0a0a0a)', emotionalTags: ['knowledge', 'secrecy', 'patience'], dilemmaCategories: ['domain_specific', 'reach_specific'] },
  { id: 'scene.mountain-pass', path: '/assets/meeting/scenes/mountain-pass.jpg', placeholderGradient: 'linear-gradient(135deg, #1a1a2a, #2a2a2a, #0a0a1a)', emotionalTags: ['journey', 'endurance', 'isolation'], dilemmaCategories: ['general', 'reach_specific'] },
  { id: 'scene.warded-city-walls', path: '/assets/meeting/scenes/warded-city-walls.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a1a, #1a1a1a, #0a0a0a)', emotionalTags: ['protection', 'shelter', 'endurance'], dilemmaCategories: ['general', 'reach_specific'] },
  { id: 'scene.desert-sermon', path: '/assets/meeting/scenes/desert-sermon.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a2a0a, #1a1a0a)', emotionalTags: ['devotion', 'belonging', 'crowd'], dilemmaCategories: ['domain_specific', 'axiological'] },
  // The five formerly-quarantined slots, regenerated as unpeopled scenes (THR-876). Same
  // filenames, new pictures: an empty cell, empty cots, an empty healer's tent, a palace
  // burning over a deserted forecourt, a feast laid with every chair empty. Appended, so
  // the empty-tag path (seed picks off the head of the array) is unchanged. The
  // substitutes that stood in for them (`justice-hall`, `lantern-vigil`) stay registered.
  { id: 'scene.prison-cell', path: '/assets/meeting/scenes/prison-cell.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a0f, #1a1a2a, #0a0a0a)', emotionalTags: ['confinement', 'duty', 'loyalty', 'endurance'], dilemmaCategories: ['axiological'] },
  { id: 'scene.plague-ward', path: '/assets/meeting/scenes/plague-ward.jpg', placeholderGradient: 'linear-gradient(135deg, #0a1a0a, #1a1a0a, #0a0a0a)', emotionalTags: ['suffering', 'compassion', 'nurturing', 'desperation'], dilemmaCategories: ['axiological', 'reach_specific'] },
  { id: 'scene.healing-tent', path: '/assets/meeting/scenes/healing-tent.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #1a1a0a, #0a0a1a)', emotionalTags: ['nurturing', 'compassion', 'shelter', 'protection'], dilemmaCategories: ['general', 'reach_specific'] },
  { id: 'scene.burning-palace', path: '/assets/meeting/scenes/burning-palace.jpg', placeholderGradient: 'linear-gradient(135deg, #3a1a0a, #1a0a0a, #0a0a0a)', emotionalTags: ['destruction', 'loss', 'desperation', 'sacrifice'], dilemmaCategories: ['axiological', 'domain_specific'] },
  { id: 'scene.great-hall-feast', path: '/assets/meeting/scenes/great-hall-feast.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a2a0a, #0a0a0a)', emotionalTags: ['community', 'belonging', 'loyalty', 'devotion'], dilemmaCategories: ['general', 'domain_specific'] },
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
