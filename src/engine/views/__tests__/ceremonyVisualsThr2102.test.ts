/**
 * THR-2102 — art-led pass, slice 6: the pictures the ceremony host builds.
 *
 * - Every echo the harvest names resolves to a picture of what it is of: a legacy's face
 *   (knowledge-gated), a monument's place picture, a relic's painting; a card echo has none,
 *   and an origin gone from the graph keeps the designed tile under the echo's name.
 * - The god's face is its origin portrait, else the designed tile, never null.
 * - The rite's mortal goes through the shared resolver, ungated, so an unpainted mortal gets
 *   the designed tile.
 * - The ceremony heading rows: every shape is a registry idea, every `null` row is one of the
 *   three headings waiting on the icon pick (decision 7).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import { echoVisual, echoVisuals, godFaceVisual, riteFaceVisual } from '../ceremonyVisuals';
import { CEREMONY_HEADING_ICONS, CEREMONY_NO_IDEA_HEADINGS, ceremonyHeadingIcon } from '../../../data/view-content';
import { ICON_REGISTRY } from '../../../data/icons/iconRegistry';
import type { GameState } from '../../../types/gameState';
import type { EchoDefinition } from '../../../types/echo';
import type { FamiliarityMap } from '../../../types/familiarity';

const PORTRAIT = '/portraits/maren.png';

function state(familiar = true): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc-1', type: 'actor', name: 'Aurelian', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'maren', type: 'actor', name: 'Maren Ashfold', properties: { actorType: 'individual', portraitAssetPath: PORTRAIT } });
  graph.addNode({ id: 'spire', type: 'location', name: 'The Spire of Ash', properties: { locationSubtype: 'town' } });
  graph.addNode({ id: 'crown', type: 'artifact', name: 'The Thorn Crown', properties: { subcategory: 'relics_talismans' } });
  const familiarityMap = (familiar ? new Map([['maren', 1]]) : new Map()) as unknown as FamiliarityMap;
  return {
    graph,
    familiarityMap,
    ascendantId: 'asc-1',
    ascendantIdentity: { divineName: 'Aurelian' },
    seed: 1,
    tick: 0,
  } as unknown as GameState;
}

const echo = (over: Partial<EchoDefinition>): EchoDefinition => ({
  id: 'e1',
  echoType: 'legacy',
  source: 'cosmic',
  originNodeId: 'maren',
  originCycle: 1,
  name: 'Maren Ashfold',
  summary: 's',
  sphereAffinities: ['chaos'],
  significance: 0.8,
  injection: { injectionType: 'cultural_template', description: 'd' },
  ...over,
} as EchoDefinition);

describe('THR-2102 echo pictures (decision 3)', () => {
  it('a legacy shows the face the god knows, named as the harvest names it', () => {
    const v = echoVisual(state(true), echo({}));
    expect(v?.tier).toBe('art');
    expect(v?.src).toBe(PORTRAIT);
    expect(v?.alt).toBe('the line of Maren Ashfold');
  });

  it('a legacy the god never came to know is the silhouette (Law 8)', () => {
    expect(echoVisual(state(false), echo({}))?.tier).toBe('fallback');
  });

  it('a monument shows a place picture, a relic its painting', () => {
    const monument = echoVisual(state(), echo({ echoType: 'monument', originNodeId: 'spire', name: 'The Spire of Ash' }));
    expect(monument?.kind).toBe('location');
    expect(monument?.tier === 'art' || monument?.tier === 'fallback').toBe(true);
    const relic = echoVisual(state(), echo({ echoType: 'relic', originNodeId: 'crown', name: 'The Thorn Crown' }));
    expect(relic?.kind).toBe('artifact');
    expect(relic?.tier).toBe('art');
  });

  it('a card echo has no picture; a lost origin keeps the designed tile under its name', () => {
    expect(echoVisual(state(), echo({ echoType: 'card', originNodeId: 'card.ward' }))).toBeNull();
    const lost = echoVisual(state(), echo({ originNodeId: 'gone', name: 'Old Tobin' }));
    expect(lost?.tier).toBe('fallback');
    expect(lost?.alt).toBe('the line of Old Tobin');
  });

  it('echoVisuals keys every picture by echo id and skips an echo with none', () => {
    const out = echoVisuals(state(), [echo({ id: 'a' }), echo({ id: 'b', echoType: 'card', originNodeId: 'c' })]);
    expect(Object.keys(out)).toEqual(['a']);
  });
});

describe('THR-2102 the god and the rite (decisions 1, 5)', () => {
  it('the god has a face, never null, named by its divine name', () => {
    const face = godFaceVisual(state());
    expect(face.kind).toBe('avatar');
    expect(face.alt).toBe('Aurelian');
    expect(face.tier === 'art' || face.tier === 'fallback').toBe(true);
  });

  it('the rite face is ungated and goes through the shared resolver', () => {
    const s = state(false);
    expect(riteFaceVisual(s, 'maren', 'x').tier).toBe('art');
    const unpainted = riteFaceVisual(s, 'nobody', 'Hadrel Vosk');
    expect(unpainted.tier).toBe('fallback');
    expect(unpainted.alt).toBe('Hadrel Vosk');
  });
});

describe('THR-2102 ceremony heading shapes (decision 7)', () => {
  it('every shape is a registry idea; every empty row waits on the icon pick', () => {
    const rows = Object.entries(CEREMONY_HEADING_ICONS);
    expect(rows.filter(([, v]) => v === null).map(([k]) => k).sort()).toEqual([...CEREMONY_NO_IDEA_HEADINGS].sort());
    for (const [, v] of rows) if (v) expect(ICON_REGISTRY[v]).toBeDefined();
    expect(ceremonyHeadingIcon('harvestTitle')).toBe('harvest');
    expect(ceremonyHeadingIcon('endingMandate')).toBe('mandate');
    expect(ceremonyHeadingIcon('endingDoom')).toBe('doom');
  });
});
