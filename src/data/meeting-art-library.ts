import type { SphereName } from '../types/index';

export interface MeetingSceneAsset {
  id: string;
  path: string;
  placeholderGradient: string;
  emotionalTags: string[];
  dilemmaCategories: string[];
  /**
   * Literal imagery the picture shows — fire, a storm at sea, a riot (THR-1712).
   * A scene that carries any is eligible only when the dilemma's own prose
   * names one of them ({@link deriveDilemmaContentTags}), so a story about
   * storm-forecasting and seeds can never draw the burning village. Absent ⇒
   * the scene is a mood backdrop that fits any prose.
   */
  contentTags?: readonly SceneContentTag[];
}

/** The literal-imagery vocabulary {@link MeetingSceneAsset.contentTags} draws from. */
export type SceneContentTag = 'fire' | 'storm' | 'sea' | 'riot' | 'battle' | 'plague';

/**
 * Words in a dilemma's prose that mean its scene literally contains the tag
 * (THR-1712). Matched whole-word, case-insensitive, with an optional plural /
 * verb ending. Tunable (NFP #1): widening a tag's reach is a word added here.
 */
export const SCENE_CONTENT_KEYWORDS: Readonly<Record<SceneContentTag, readonly string[]>> = {
  fire: ['fire', 'flame', 'burn', 'burned', 'burnt', 'burning', 'blaze', 'smoke', 'ember', 'torch', 'alight', 'pyre', 'arson'],
  storm: ['storm', 'tempest', 'gale', 'squall', 'thunder', 'lightning', 'flood', 'hurricane'],
  sea: ['sea', 'ship', 'harbor', 'harbour', 'boat', 'tide', 'sail', 'dock', 'shore', 'fleet'],
  riot: ['riot', 'mob', 'uprising', 'rioter'],
  battle: ['battle', 'war', 'army', 'soldier', 'siege', 'warband', 'battlefield', 'legion'],
  plague: ['plague', 'fever', 'sickness', 'disease', 'contagion', 'pox', 'pestilence'],
};

/**
 * Score for each content tag a scene shares with the dilemma's prose, on top of
 * one point per emotional-tag overlap. Larger than any plausible emotional
 * overlap, so a scene that literally pictures the story beats a mood match.
 */
export const SCENE_CONTENT_MATCH_WEIGHT = 5;

const CONTENT_PATTERNS: ReadonlyArray<readonly [SceneContentTag, RegExp]> = (
  Object.entries(SCENE_CONTENT_KEYWORDS) as [SceneContentTag, readonly string[]][]
).map(([tag, words]) => [tag, new RegExp(`\\b(?:${words.join('|')})(?:s|es|ed|ing)?\\b`, 'i')] as const);

/** The literal-imagery tags a dilemma's prose names (THR-1712). Pure. */
export function deriveDilemmaContentTags(text: string): SceneContentTag[] {
  if (!text) return [];
  return CONTENT_PATTERNS.filter(([, re]) => re.test(text)).map(([tag]) => tag);
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
  { id: 'scene.burning-village', path: '/assets/meeting/scenes/burning-village.jpg', placeholderGradient: 'linear-gradient(135deg, #3a0a0a, #2a0a0a, #1a0a0a)', emotionalTags: ['destruction', 'loss', 'urgency', 'desperation'], dilemmaCategories: ['axiological', 'reach_specific'], contentTags: ['fire'] },
  { id: 'scene.throne-room', path: '/assets/meeting/scenes/throne-room.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a2a1a, #1a1a0a)', emotionalTags: ['power', 'politics', 'betrayal', 'duty'], dilemmaCategories: ['axiological', 'domain_specific'] },
  // Replaces the quarantined `scene.prison-cell`: an empty judgment hall carries the
  // same mercy/justice weight with no choice buttons painted into it.
  { id: 'scene.justice-hall', path: '/assets/meeting/scenes/justice-hall.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a0a, #1a1a1a, #0a0a0a)', emotionalTags: ['confinement', 'mercy', 'justice', 'duty'], dilemmaCategories: ['axiological'] },
  { id: 'scene.market-riot', path: '/assets/meeting/scenes/market-riot.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a1a0a, #1a0a0a)', emotionalTags: ['chaos', 'courage', 'crowd', 'community'], dilemmaCategories: ['general', 'reach_specific'], contentTags: ['riot'] },
  { id: 'scene.forest-shrine', path: '/assets/meeting/scenes/forest-shrine.jpg', placeholderGradient: 'linear-gradient(135deg, #0a1a0a, #1a2a1a, #0a1a0a)', emotionalTags: ['sacred', 'nature', 'revelation', 'devotion'], dilemmaCategories: ['domain_specific'] },
  { id: 'scene.harbor-storm', path: '/assets/meeting/scenes/harbor-storm.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #0a1a1a)', emotionalTags: ['danger', 'choice', 'nature', 'endurance'], dilemmaCategories: ['general'], contentTags: ['storm', 'sea'] },
  // Replaces the quarantined `scene.plague-ward` — the reachable one. Any dilemma tagged
  // 'sacrifice' or 'compassion' scored it top and rendered that child's face.
  { id: 'scene.lantern-vigil', path: '/assets/meeting/scenes/lantern-vigil.jpg', placeholderGradient: 'linear-gradient(135deg, #1a1a0a, #0a1a0a, #1a0a0a)', emotionalTags: ['suffering', 'compassion', 'sacrifice', 'nurturing'], dilemmaCategories: ['axiological', 'reach_specific'] },
  // Widening the pool is the audit's byproduct: 24 of the 32 scene files on disk were
  // unregistered, so thin-tag draws cycled through the same two backdrops. Every
  // addition below was inspected for likeness and for baked-in text, top and bottom.
  { id: 'scene.village-gate-night', path: '/assets/meeting/scenes/village-gate-night.jpg', placeholderGradient: 'linear-gradient(135deg, #0a0a0a, #1a1a0a, #0a0a1a)', emotionalTags: ['shelter', 'protection', 'belonging'], dilemmaCategories: ['general', 'axiological'] },
  { id: 'scene.battlefield-dawn', path: '/assets/meeting/scenes/battlefield-dawn.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a1a, #2a2a2a, #1a1a1a)', emotionalTags: ['sacrifice', 'loss', 'duty'], dilemmaCategories: ['axiological', 'reach_specific'], contentTags: ['battle'] },
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
  { id: 'scene.plague-ward', path: '/assets/meeting/scenes/plague-ward.jpg', placeholderGradient: 'linear-gradient(135deg, #0a1a0a, #1a1a0a, #0a0a0a)', emotionalTags: ['suffering', 'compassion', 'nurturing', 'desperation'], dilemmaCategories: ['axiological', 'reach_specific'], contentTags: ['plague'] },
  { id: 'scene.healing-tent', path: '/assets/meeting/scenes/healing-tent.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #1a1a0a, #0a0a1a)', emotionalTags: ['nurturing', 'compassion', 'shelter', 'protection'], dilemmaCategories: ['general', 'reach_specific'] },
  { id: 'scene.burning-palace', path: '/assets/meeting/scenes/burning-palace.jpg', placeholderGradient: 'linear-gradient(135deg, #3a1a0a, #1a0a0a, #0a0a0a)', emotionalTags: ['destruction', 'loss', 'desperation', 'sacrifice'], dilemmaCategories: ['axiological', 'domain_specific'], contentTags: ['fire'] },
  { id: 'scene.great-hall-feast', path: '/assets/meeting/scenes/great-hall-feast.jpg', placeholderGradient: 'linear-gradient(135deg, #2a1a0a, #3a2a0a, #0a0a0a)', emotionalTags: ['community', 'belonging', 'loyalty', 'devotion'], dilemmaCategories: ['general', 'domain_specific'] },
];

/**
 * Select a scene asset matching emotional tags from a dilemma.
 *
 * A scene carrying `contentTags` is skipped unless `contentTags` here names one
 * of them (THR-1712); a shared content tag scores {@link SCENE_CONTENT_MATCH_WEIGHT}.
 * Ties break on `seed`. Falls back to the whole library if gating empties it.
 */
export function selectDilemmaScene(
  emotionalTags: readonly string[],
  seed: number,
  contentTags: readonly SceneContentTag[] = [],
): MeetingSceneAsset {
  if (DILEMMA_SCENE_ART.length === 0) {
    return { id: 'scene.fallback', path: '', placeholderGradient: 'linear-gradient(135deg, #0a0a0f, #1a1a1a)', emotionalTags: [], dilemmaCategories: [] };
  }
  const eligible = DILEMMA_SCENE_ART.filter(
    scene => !scene.contentTags?.length || scene.contentTags.some(t => contentTags.includes(t)),
  );
  const pool = eligible.length > 0 ? eligible : DILEMMA_SCENE_ART;
  const scored = pool.map(scene => {
    const overlap = scene.emotionalTags.filter(t => emotionalTags.includes(t)).length;
    const content = (scene.contentTags ?? []).filter(t => contentTags.includes(t)).length;
    return { scene, score: overlap + content * SCENE_CONTENT_MATCH_WEIGHT };
  });
  scored.sort((a, b) => b.score - a.score);
  // If top scores are tied, use seed to pick deterministically
  const topScore = scored[0].score;
  const tied = scored.filter(s => s.score === topScore);
  return tied[Math.abs(seed) % tied.length].scene;
}

/** The subset of a dilemma instance the scene picker reads. */
export interface SceneSelectableDilemma {
  templateId: string;
  setup?: string;
  godVoice?: string;
  resonance?: { emotionalRegister?: readonly string[] };
  test?: { purposeLine?: string; factorLines?: readonly { text: string }[] };
}

/** Stable 32-bit hash of a string (FNV-1a) — seeds a tie-break by template, not by position. */
function hashTemplateId(id: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Pick the backdrop for one dilemma from what the dilemma actually is (THR-1712):
 * its emotional register, plus the literal imagery its prose names. The
 * tie-break seed mixes in the template id, so two tests at the same position in
 * different runs do not share a backdrop just because they share an index.
 */
export function selectSceneForDilemma(
  dilemma: SceneSelectableDilemma,
  seed: number,
): MeetingSceneAsset {
  const text = [
    dilemma.setup,
    dilemma.godVoice,
    dilemma.test?.purposeLine,
    ...(dilemma.test?.factorLines ?? []).map(l => l.text),
  ].filter(Boolean).join(' ');
  return selectDilemmaScene(
    dilemma.resonance?.emotionalRegister ?? [],
    (hashTemplateId(dilemma.templateId) + seed) >>> 0,
    deriveDilemmaContentTags(text),
  );
}

// Satisfy the SphereName import — used by consumers of this module for sphere-specific art selection.
export type { SphereName };
