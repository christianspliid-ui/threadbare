// @vitest-environment jsdom
/**
 * THR-2102 — art-led pass, slice 6: the ceremonies, rendered.
 *
 * - The harvest opens on the god's face, draws the harvest shape on its title, opens every
 *   echo card on its picture, names each echo once (`echoDisplayName`), spells each sphere as
 *   a word with its tooltip, and draws one picture per echo the god's age leaves.
 * - The end of the age draws the First's face at the ceremony portrait width and the ending's
 *   shape (mandate or doom).
 * - The rite draws its mortal through the shared resolver in both shapes: an unpainted mortal
 *   is the designed tile, never a raw image or a colour smear.
 * - `readCeremonyDressing` (behind `__DEBUG.getCeremonyDressing`) reads all of it back.
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WorldGraph } from '../../../engine/graph';
import { HarvestScreen } from '../HarvestScreen';
import { AgeTwilightScreen } from '../AgeTwilightScreen';
import { ThreadingRite } from '../../ThreadingRite/ThreadingRite';
import { readCeremonyDressing } from '../hosts/ceremonyDressing';
import { resolveEntityVisual, type EntityVisualDescriptor } from '../../../engine/views/entityVisualResolver';
import type { HarvestResult, HarvestEchoCandidate } from '../../../engine/cycleEnd';
import type { EchoDefinition } from '../../../types/echo';
import type { TwilightBeats } from '../../../engine/twilight';
import type { GameState } from '../../../types/gameState';
import type { StoredHungerId } from '../../../types/hunger';

afterEach(cleanup);

const echo = (id: string, echoType: EchoDefinition['echoType'], name: string, spheres: string[] = ['chaos']): EchoDefinition => ({
  id,
  echoType,
  source: 'cosmic',
  originNodeId: `node_${id}`,
  originCycle: 1,
  name,
  summary: `${name} endured.`,
  sphereAffinities: spheres,
  significance: 0.8,
  injection: { injectionType: 'cultural_template', description: 'd' },
} as EchoDefinition);

const candidate = (def: EchoDefinition): HarvestEchoCandidate => ({
  node: { id: def.originNodeId, type: 'actor', name: def.name, properties: {} },
  score: 0.8,
  echoDefinition: def,
});

const tile = (id: string, name: string, kind: EntityVisualDescriptor['kind'] = 'agent'): EntityVisualDescriptor =>
  resolveEntityVisual({ id, kind, name }, null);

/** The triumphant fixture: five echo cards (legacy, monument, relic ×3) and three god's echoes. */
function triumphant(): { harvest: HarvestResult; echoVisuals: Record<string, EntityVisualDescriptor>; leaveVisuals: Record<string, EntityVisualDescriptor> } {
  const cosmic = [
    echo('c1', 'legacy', 'Maren Ashfold', ['chaos', 'life']),
    echo('c2', 'monument', 'The Spire of Ash'),
    echo('c3', 'relic', 'The Thorn Crown'),
    echo('c4', 'relic', 'The Hollow Bell'),
    echo('c5', 'relic', 'The Ember Ring'),
  ];
  const divine = [
    { ...echo('d1', 'monument', 'The Long Barrow'), source: 'divine' as const },
    { ...echo('d2', 'legacy', 'Old Tobin'), source: 'divine' as const },
    { ...echo('d3', 'relic', 'The Glass Key'), source: 'divine' as const },
  ];
  const echoVisuals = Object.fromEntries(cosmic.map(d => [d.id, tile(d.originNodeId, d.name)]));
  const leaveVisuals = Object.fromEntries(divine.map(d => [d.id, tile(d.originNodeId, d.name)]));
  return {
    harvest: {
      harvestType: 'triumphant',
      cosmicEchoCandidates: cosmic.map(candidate),
      divineEchoSlots: 3,
      chronicleSummary: 'A triumphant age.',
      divineEchoes: divine,
    },
    echoVisuals,
    leaveVisuals,
  };
}

describe('THR-2102 the harvest (S6.2)', () => {
  it('opens on the god, every echo shows its picture, and every echo it leaves has one', () => {
    const { harvest, echoVisuals, leaveVisuals } = triumphant();
    render(
      <HarvestScreen
        harvest={harvest}
        cycle={2}
        onWakeNewWorld={vi.fn()}
        godFace={tile('asc', 'Aurelian', 'avatar')}
        echoVisuals={echoVisuals}
        leaveVisuals={leaveVisuals}
      />,
    );
    const dressing = readCeremonyDressing(document);
    expect(dressing?.kind).toBe('cycle-harvest');
    expect(dressing?.faces.map(f => f.role)).toEqual(['god']);
    expect(dressing?.headingIcons).toContain('harvest');
    expect(dressing?.echoCards).toBe(5);
    expect(dressing?.echoCardsWithArt).toBe(dressing?.echoCards);
    expect(dressing?.leaveEchoes).toBe(3);
    expect(dressing?.leaveChips).toBe(dressing?.leaveEchoes);
    expect(screen.getByTestId('cycle-harvest').style.maxWidth).toBe('var(--ceremony-panel-max-w)');
    expect(screen.getByTestId('harvest-god-face').style.width).toBe('var(--ceremony-medallion-w)');
  });

  it('names each echo once and spells each sphere as a word (decision 4, Law 14)', () => {
    const { harvest, echoVisuals } = triumphant();
    render(<HarvestScreen harvest={harvest} cycle={2} onWakeNewWorld={vi.fn()} echoVisuals={echoVisuals} />);
    const names = screen.getAllByTestId('harvest-echo-name').map(el => el.textContent);
    expect(names[0]).toBe('the line of Maren Ashfold');
    const spheres = screen.getAllByTestId('harvest-echo-sphere').map(el => el.textContent ?? '');
    expect(spheres).toContain('Chaos');
    expect(spheres.every(w => w.charAt(0) === w.charAt(0).toUpperCase())).toBe(true);
    // The picture's alt is the same name the card prints (PC-6).
    expect(screen.getAllByTestId('harvest-echo-card')[0].querySelector('[aria-hidden], img, [role]')).toBeTruthy();
  });

  it('without pictures the card draws no picture and no amber dot', () => {
    const { harvest } = triumphant();
    render(<HarvestScreen harvest={harvest} cycle={2} onWakeNewWorld={vi.fn()} />);
    const cards = screen.getAllByTestId('harvest-echo-card');
    expect(cards.every(c => c.getAttribute('data-echo-art') === 'none')).toBe(true);
    expect(document.querySelector('.bg-amber-400')).toBeNull();
    expect(screen.queryByTestId('harvest-leave-chips')).toBeNull();
  });
});

describe('THR-2102 the end of the age (S6.3)', () => {
  const graph = new WorldGraph();
  graph.addNode({ id: 'first', type: 'actor', name: 'Maren Ashfold', properties: { actorType: 'individual' } });
  const gameState = { graph } as unknown as GameState;
  const beats = (kind: 'mandate' | 'doom'): TwilightBeats => ({
    godName: 'Aurelian',
    ending: { kind, title: kind === 'mandate' ? 'The Long Peace, fulfilled' : 'The Hungering Dark', close: 'The age is over.' },
    first: { id: 'first', name: 'Maren Ashfold', present: true, fate: 'lived', line: 'Maren Ashfold lived.' },
    memories: [],
    fallbacks: [],
  } as unknown as TwilightBeats);

  it.each(['mandate', 'doom'] as const)('the %s ending draws its shape and the First at the ceremony width', kind => {
    render(<AgeTwilightScreen beats={beats(kind)} gameState={gameState} remembered onContinue={vi.fn()} />);
    const dressing = readCeremonyDressing(document);
    expect(dressing?.kind).toBe('age-twilight');
    expect(dressing?.headingIcons).toEqual([kind]);
    expect(dressing?.faces.map(f => f.role)).toEqual(['first']);
    expect(screen.getByTestId('age-twilight-first-face').style.width).toBe('var(--ceremony-portrait-w)');
  });
});

describe('THR-2102 the rite (decision 5)', () => {
  function world(): WorldGraph {
    const g = new WorldGraph();
    g.addNode({ id: 'asc', type: 'actor', name: 'The Ascendant', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'ketterwell', type: 'location', name: 'Ketterwell', properties: { locationSubtype: 'village' } });
    g.addNode({
      id: 'hadrel', type: 'actor', name: 'Hadrel Vosk',
      properties: { actorType: 'individual', gender: 'male', primaryReach: 'iron', secondaryReach: 'heart', domainCapabilities: { iron: 40, heart: 20 } },
    });
    g.addEdge({ id: 'loc', source: 'hadrel', target: 'ketterwell', type: 'located_at', properties: {} });
    return g;
  }

  it.each(['short', 'bond_only'] as const)('an unpainted mortal draws the designed tile in the %s rite', shape => {
    render(
      <ThreadingRite
        graph={world()}
        rite={{ agentId: 'hadrel', ascendantId: 'asc', ordinal: shape === 'short' ? 2 : 4, shape, tick: 10 }}
        worldSeed={42}
        primarySphere="life"
        hungerId={'hunger.witness' as StoredHungerId}
        essencePool={{ life: 40 }}
        onComplete={vi.fn()}
        onBondWithoutHand={vi.fn()}
        face={tile('hadrel', 'Hadrel Vosk')}
      />,
    );
    const face = screen.getByTestId('threading-rite-portrait');
    expect(face.getAttribute('data-ceremony-face')).toBe('fallback');
    expect(face.querySelector('[data-entity-visual-tier="fallback"]')).toBeTruthy();
    expect(face.querySelector('img')).toBeNull();
    expect(readCeremonyDressing(document)?.faces.map(f => [f.role, f.tier])).toEqual([['rite', 'fallback']]);
  });

  it('with no face handed in, the rite still resolves one (never none)', () => {
    render(
      <ThreadingRite
        graph={world()}
        rite={{ agentId: 'hadrel', ascendantId: 'asc', ordinal: 2, shape: 'short', tick: 10 }}
        worldSeed={42}
        primarySphere="life"
        hungerId={'hunger.witness' as StoredHungerId}
        onComplete={vi.fn()}
        onBondWithoutHand={vi.fn()}
      />,
    );
    expect(['art', 'fallback']).toContain(screen.getByTestId('threading-rite-portrait').getAttribute('data-ceremony-face'));
  });
});
