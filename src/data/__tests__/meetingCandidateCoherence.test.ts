/**
 * Meet The First tells one story about one person — THR-1712.
 *
 * Cold playtest round 2: all three testers hit a contradiction in the scene they
 * named as the best part of the game. A woman's portrait named "Aldric"; path and
 * binding cards showing a stock man; test 2's backdrop always a burning village
 * (the art picker scored on a field the dilemma mapper dropped, so every scene
 * tied and the index decided); mortals named "Decay" and "Corrode".
 *
 * Each block below pins one of those four causes at its source.
 */

import { describe, it, expect } from 'vitest';
import { CANDIDATE_VIGNETTES } from '../candidate-vignettes';
import {
  FOUNDATION_NAMES,
  SPHERE_NAMES_POOL,
  GENERIC_NAMES,
  FOUNDATION_NAMES_FEMALE,
  FOUNDATION_NAMES_MALE,
  GENERIC_NAMES_FEMALE,
  GENERIC_NAMES_MALE,
  pickGenderedName,
} from '../culture-name-pools';
import {
  DILEMMA_SCENE_ART,
  deriveDilemmaContentTags,
  selectDilemmaScene,
  selectSceneForDilemma,
} from '../meeting-art-library';
import { ENRICHED_DILEMMA_LIBRARY } from '../meeting-dilemma-library';
import { SPARK_VISION_CATALOG } from '../spark-vision-catalog';
import { WorldGraph } from '../../engine/graph';
import {
  bindSparkVisionsToCandidate,
  buildNarrativeResult,
  createAgentFromMeeting,
  generateNarrativeCandidates,
  generateSparkVisions,
  selectDilemmas,
} from '../../engine/meetingEncounter';
import type { DilemmaTemplate } from '../../types/meetingEncounter';

const FEMALE_PRONOUNS = /\b(she|her|hers|herself)\b/gi;
const MALE_PRONOUNS = /\b(he|him|his|himself)\b/gi;

function dominantPronounGender(prose: string): 'female' | 'male' | 'neutral' {
  const f = (prose.match(FEMALE_PRONOUNS) ?? []).length;
  const m = (prose.match(MALE_PRONOUNS) ?? []).length;
  if (f > m) return 'female';
  if (m > f) return 'male';
  return 'neutral';
}

const ALL_FEMALE_NAMES = new Set([...Object.values(FOUNDATION_NAMES_FEMALE).flat(), ...GENERIC_NAMES_FEMALE]);
const ALL_MALE_NAMES = new Set([...Object.values(FOUNDATION_NAMES_MALE).flat(), ...GENERIC_NAMES_MALE]);

// ─── (1) The name follows the person ─────────────────────────────

describe('candidate gender (cause 1)', () => {
  it('every vignette declares a gender that matches its prose pronouns', () => {
    expect(CANDIDATE_VIGNETTES.length).toBeGreaterThan(0);
    for (const v of CANDIDATE_VIGNETTES) {
      const fromProse = dominantPronounGender(v.prose);
      // A vignette whose prose names no one by pronoun cannot contradict itself.
      if (fromProse === 'neutral') continue;
      expect({ id: v.id, gender: v.gender }).toEqual({ id: v.id, gender: fromProse });
    }
  });

  it('both gender lists are disjoint — no name reads as both', () => {
    const overlap = [...ALL_FEMALE_NAMES].filter(n => ALL_MALE_NAMES.has(n));
    expect(overlap).toEqual([]);
  });

  it('every generated candidate is named from the pool of its vignette gender', () => {
    let checked = 0;
    for (const foundation of ['order', 'chaos', 'light', 'darkness', '']) {
      for (let seed = 1; seed <= 40; seed++) {
        for (const c of generateNarrativeCandidates('hunger.preserve', 'culture_1', seed, foundation, 'entropy')) {
          const vignette = CANDIDATE_VIGNETTES.find(v => v.prose === c.vignetteText)!;
          expect(c.gender).toBe(vignette.gender);
          const pool = c.gender === 'female' ? ALL_FEMALE_NAMES : ALL_MALE_NAMES;
          expect({ name: c.name, gender: c.gender, inPool: pool.has(c.name) })
            .toEqual({ name: c.name, gender: c.gender, inPool: true });
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('pickGenderedName is deterministic and never returns empty, even past exhaustion', () => {
    const rngA = mulberry(7);
    const rngB = mulberry(7);
    expect(pickGenderedName('order', 'female', rngA, new Set())).toBe(pickGenderedName('order', 'female', rngB, new Set()));
    const used = new Set<string>();
    const rng = mulberry(3);
    for (let i = 0; i < 120; i++) expect(pickGenderedName('order', 'male', rng, used)).toBeTruthy();
  });

  it('the created First carries the candidate gender on the node', () => {
    const [candidate] = generateNarrativeCandidates('hunger.preserve', 'culture_1', 11, 'order', 'life');
    const [vision] = generateSparkVisions(candidate.primaryReach, 'life', 11);
    const result = buildNarrativeResult({
      candidate,
      vision,
      dilemmaChoices: [],
      editedName: undefined,
      locationId: 'loc_village',
      ascendantSphere: 'life',
      tick: 5,
    });
    const graph = new WorldGraph();
    graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    graph.addNode({
      id: 'loc_village',
      type: 'location',
      name: 'Ashenmoor',
      properties: { locationType: 'settlement', locationSubtype: 'village', hexCol: 1, hexRow: 1 },
    });
    const id = createAgentFromMeeting(graph, result, 'asc', 5);
    expect(candidate.gender).toBeDefined();
    expect(graph.getNode(id)?.properties.gender).toBe(candidate.gender);
  });
});

// ─── (2) The path cards show the chosen person ───────────────────

describe('path-card portrait (cause 2)', () => {
  it('every bound vision shows the candidate portrait, keeping its own scene and prose', () => {
    const [candidate] = generateNarrativeCandidates('hunger.preserve', 'culture_1', 3);
    const raw = generateSparkVisions(candidate.primaryReach, 'life', 3);
    const bound = bindSparkVisionsToCandidate(raw, candidate);
    expect(bound.length).toBe(raw.length);
    bound.forEach((v, i) => {
      expect(v.portraitAssetPath).toBe(candidate.imageAssetPath);
      expect(v.sceneAssetPath).toBe(raw[i].sceneAssetPath);
      expect(v.prose).toBe(raw[i].prose);
    });
  });

  it('no vision prose genders its subject — it now describes whoever the player chose', () => {
    // A path card's prose describes the candidate's future. Pronouns for a third
    // party ("a general who thinks the strategy is his own") are fine; the
    // subject's own are not. The subject-gendered openers are the tell.
    for (const v of SPARK_VISION_CATALOG) {
      expect({ id: v.id, gendersSubject: /^(A|The) (woman|man)\b|\b(she|her) (has|is|learned|calls|intends)\b/i.test(v.prose) })
        .toEqual({ id: v.id, gendersSubject: false });
    }
  });
});

// ─── (3) The backdrop follows the story, not the index ───────────

describe('formative-test scene art (cause 3)', () => {
  const library = ENRICHED_DILEMMA_LIBRARY as unknown as DilemmaTemplate[];

  it('selected dilemma instances keep their resonance tags through the mapper', () => {
    const dilemmas = selectDilemmas(library, 'iron', 'heart', 'force', 'iron_heart', 'village', 42);
    expect(dilemmas.length).toBeGreaterThan(0);
    for (const d of dilemmas) {
      expect(d.resonance?.emotionalRegister?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it('two distinct registers pick different scenes at the same seed', () => {
    const a = selectDilemmaScene(['knowledge', 'secrecy', 'patience'], 0);
    const b = selectDilemmaScene(['grief', 'devotion', 'loss'], 0);
    expect(a.id).toBe('scene.candlelit-study');
    expect(b.id).toBe('scene.misty-graveyard');
    expect(a.id).not.toBe(b.id);
  });

  it('a storm-and-seeds story never draws a burning backdrop, whatever the seed', () => {
    const storm = {
      templateId: 'test.storm_seeds',
      setup: 'The old philosopher reads the coming storm in the clouds and tells the farmers to hold back their seed.',
      resonance: { emotionalRegister: ['loss', 'desperation', 'destruction'] },
    };
    for (let seed = 0; seed < 50; seed++) {
      const scene = selectSceneForDilemma(storm, seed);
      expect(scene.contentTags ?? []).not.toContain('fire');
    }
  });

  it('a scene with literal imagery is only drawn by prose that names it — across the whole library', () => {
    let withImagery = 0;
    for (const t of ENRICHED_DILEMMA_LIBRARY) {
      for (const seed of [0, 1, 2]) {
        const scene = selectSceneForDilemma({ ...t, templateId: t.id }, seed);
        if (!scene.contentTags?.length) continue;
        withImagery++;
        const text = [t.setup, t.godVoice, t.test?.purposeLine, ...(t.test?.factorLines ?? []).map(l => l.text)].join(' ');
        const named = deriveDilemmaContentTags(text);
        expect({ id: t.id, scene: scene.id, ok: scene.contentTags.some(c => named.includes(c)) })
          .toEqual({ id: t.id, scene: scene.id, ok: true });
      }
    }
    // Anti-vacuity: the gate is only proven if some draws actually land on imagery scenes.
    expect(withImagery).toBeGreaterThan(0);
  });

  it('scene choice varies across the library at a fixed seed — not one backdrop per position', () => {
    const picked = new Set(ENRICHED_DILEMMA_LIBRARY.map(t => selectSceneForDilemma({ ...t, templateId: t.id }, 1).id));
    expect(picked.size).toBeGreaterThanOrEqual(8);
  });

  it('every content tag on a scene is derivable from prose', () => {
    for (const scene of DILEMMA_SCENE_ART) {
      for (const tag of scene.contentTags ?? []) {
        expect(deriveDilemmaContentTags(`there was a ${tag} here`)).toContain(tag);
      }
    }
  });

  it('content words match whole words only', () => {
    expect(deriveDilemmaContentTags('the warm seasonal wind')).toEqual([]);
    expect(deriveDilemmaContentTags('the village burned while ships sailed')).toEqual(expect.arrayContaining(['fire', 'sea']));
  });
});

// ─── (4) People are named like people ────────────────────────────

/**
 * Words that read as a thing, a process or an abstraction rather than a person.
 * Independent of the pools on purpose: a later author re-adding "Decay" to a
 * pool fails here, not in review.
 */
const ABSTRACT_NOUN_STOP_LIST = [
  'Decay', 'Corrode', 'Erode', 'Blight', 'Rust', 'Wither', 'Hollow', 'Cinder', 'Remnant', 'Tatter',
  'Slough', 'Scour', 'Marrow', 'Pallid', 'Wane', 'Moulder', 'Ruin', 'Rot',
  'Cipher', 'Codex', 'Quill', 'Vellum', 'Rune', 'Sage', 'Ponder', 'Glyph',
  'Wraith', 'Whisper', 'Requiem', 'Psalm', 'Litany', 'Vigil', 'Psalter', 'Reverie', 'Hallow', 'Orison',
  'Epoch', 'Hourglass', 'Dial', 'Relic', 'Vestige', 'Memento', 'Antique', 'Solstice', 'Meridian', 'Aeon',
  'Flux', 'Nimbus', 'Coronal', 'Basalt', 'Cobalt', 'Gneiss', 'Flintlock', 'Cleft',
  'Beacon', 'Gallant', 'Halcyon', 'Shade', 'Umbra', 'Threnody', 'Ironhide',
];

describe('person-name pools (cause 4)', () => {
  it('no person-name pool contains an abstract noun', () => {
    const pools: Record<string, readonly string[]> = {
      ...Object.fromEntries(Object.entries(FOUNDATION_NAMES).map(([k, v]) => [`foundation.${k}`, v])),
      ...Object.fromEntries(Object.entries(SPHERE_NAMES_POOL).map(([k, v]) => [`sphere.${k}`, v])),
      generic: GENERIC_NAMES,
      genericFemale: GENERIC_NAMES_FEMALE,
      genericMale: GENERIC_NAMES_MALE,
      ...Object.fromEntries(Object.entries(FOUNDATION_NAMES_FEMALE).map(([k, v]) => [`female.${k}`, v])),
      ...Object.fromEntries(Object.entries(FOUNDATION_NAMES_MALE).map(([k, v]) => [`male.${k}`, v])),
    };
    const stop = new Set(ABSTRACT_NOUN_STOP_LIST);
    const hits = Object.entries(pools).flatMap(([pool, names]) => names.filter(n => stop.has(n)).map(n => `${pool}:${n}`));
    expect(hits).toEqual([]);
  });
});

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
