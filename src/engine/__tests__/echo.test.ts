import { describe, it, expect } from 'vitest';
import {
  type EchoType,
  type EchoSource,
  type EchoDefinition,
  type EchoState,
  type EchoInjection,
  type InjectionType,
  ECHO_TYPES,
  ECHO_DEGRADATION_RATE,
  ECHO_FADE_THRESHOLD,
} from '../../types/echo';
import {
  type ChronicleVolume,
  type ChronicleChapter,
  type ChronicleInterlude,
  type EchoThread,
  type GreatChronicle,
} from '../../types/chronicle';

describe('echo types', () => {
  it('exports ECHO_TYPES', () => {
    expect(ECHO_TYPES).toEqual(['legacy', 'monument', 'relic']);
  });

  it('exports ECHO_DEGRADATION_RATE', () => {
    expect(ECHO_DEGRADATION_RATE).toBe(0.15);
  });

  it('exports ECHO_FADE_THRESHOLD', () => {
    expect(ECHO_FADE_THRESHOLD).toBe(0.9);
  });

  it('can construct an EchoDefinition for a legacy echo', () => {
    const echo: EchoDefinition = {
      id: 'echo_hero_001',
      echoType: 'legacy',
      source: 'cosmic',
      originNodeId: 'actor_hero',
      originCycle: 1,
      name: 'The Hero of Velanthos',
      summary: 'A champion who united the garden-priests against the breach.',
      sphereAffinities: ['life', 'spirit'],
      significance: 0.85,
      injection: {
        injectionType: 'cultural_template',
        description: 'Seeds myths of a unifying champion and descendant lineages with inherited devotion traits.',
        sphereBiases: { life: 0.05, spirit: 0.03 },
        traitTendencies: ['devotion_independence', 'courage_prudence'],
      },
    };
    expect(echo.echoType).toBe('legacy');
    expect(echo.injection.injectionType).toBe('cultural_template');
  });

  it('can construct an EchoDefinition for a monument echo', () => {
    const echo: EchoDefinition = {
      id: 'echo_temple_001',
      echoType: 'monument',
      source: 'divine',
      originNodeId: 'loc_temple',
      originCycle: 1,
      name: 'The Shattered Sanctum',
      summary: 'A temple that channeled spirit energy before the breach consumed it.',
      sphereAffinities: ['spirit'],
      significance: 0.7,
      injection: {
        injectionType: 'location_feature',
        description: 'Seeds a sacred ruin with spirit sphere bias and cultural place-memory.',
        sphereBiases: { spirit: 0.04 },
      },
    };
    expect(echo.echoType).toBe('monument');
  });

  it('can construct an EchoDefinition for a relic echo', () => {
    const echo: EchoDefinition = {
      id: 'echo_crown_001',
      echoType: 'relic',
      source: 'cosmic',
      originNodeId: 'artifact_crown',
      originCycle: 2,
      name: 'Griefender',
      summary: 'A blade forged in sorrow that cut through despair.',
      sphereAffinities: ['force', 'entropy'],
      significance: 0.9,
      injection: {
        injectionType: 'quest_seed',
        description: 'Seeds a discoverable artifact with modified trait graph and associated myths.',
        sphereBiases: { force: 0.03, entropy: 0.02 },
        traitTendencies: ['wrath_patience'],
      },
    };
    expect(echo.echoType).toBe('relic');
    expect(echo.injection.injectionType).toBe('quest_seed');
  });

  it('can construct an EchoState', () => {
    const state: EchoState = {
      id: 'echo_hero_001',
      degradation: 0.3,
      cyclesActive: 2,
      faded: false,
    };
    expect(state.faded).toBe(false);
  });
});

describe('chronicle types', () => {
  it('can construct a ChronicleChapter', () => {
    const chapter: ChronicleChapter = {
      id: 'chapter_001',
      title: 'The Siege of the Eastern Gate',
      prose: 'As entropy clawed at the foundations...',
      tick: 45,
      significance: 0.88,
      spheres: ['entropy', 'force'],
      actorIds: ['actor_hero', 'actor_villain'],
    };
    expect(chapter.significance).toBe(0.88);
  });

  it('can construct a ChronicleInterlude', () => {
    const interlude: ChronicleInterlude = {
      id: 'interlude_001',
      summary: 'In the weeks that followed, trade routes reopened and the harvest was bountiful.',
      tickRange: { start: 30, end: 44 },
      eventCount: 12,
    };
    expect(interlude.eventCount).toBe(12);
  });

  it('can construct an EchoThread', () => {
    const thread: EchoThread = {
      echoId: 'echo_crown_001',
      appearances: [
        { cycleNumber: 1, volumeId: 'vol_001', description: 'First forged in the Age of the Breach.' },
        { cycleNumber: 3, volumeId: 'vol_003', description: 'Appeared as a rusted relic in the Cycle of the Failing.' },
      ],
    };
    expect(thread.appearances).toHaveLength(2);
  });

  it('can construct a ChronicleVolume', () => {
    const volume: ChronicleVolume = {
      id: 'vol_001',
      cycleNumber: 1,
      title: 'The Age of the Breach',
      doomArchetype: 'breach',
      chapters: [],
      interludes: [],
      harvestSummary: 'The world ended in fire and chaos.',
    };
    expect(volume.doomArchetype).toBe('breach');
  });

  it('can construct a GreatChronicle', () => {
    const chronicle: GreatChronicle = {
      volumes: [],
      echoThreads: [],
    };
    expect(chronicle.volumes).toHaveLength(0);
  });
});

import type { GraphNode } from '../../types/graph';
import {
  computeSignificanceScore,
  selectCosmicEchoes,
  buildEchoDefinition,
  createEchoState,
  degradeEcho,
  degradeAllEchoes,
  isEchoFaded,
  pruneEchoes,
  collectInjections,
} from '../echo';

describe('Echo selection & scoring', () => {
  it('computeSignificanceScore combines edge count and event participation', () => {
    const score = computeSignificanceScore(10, 5, 'actor');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it('computeSignificanceScore gives higher scores for more edges', () => {
    const low = computeSignificanceScore(2, 3, 'actor');
    const high = computeSignificanceScore(20, 3, 'actor');
    expect(high).toBeGreaterThan(low);
  });

  it('computeSignificanceScore gives higher scores for more event participation', () => {
    const low = computeSignificanceScore(5, 1, 'actor');
    const high = computeSignificanceScore(5, 15, 'actor');
    expect(high).toBeGreaterThan(low);
  });

  it('computeSignificanceScore weights actors higher than locations', () => {
    const actor = computeSignificanceScore(5, 5, 'actor');
    const loc = computeSignificanceScore(5, 5, 'location');
    expect(actor).toBeGreaterThanOrEqual(loc);
  });

  it('selectCosmicEchoes picks top N by significance score', () => {
    const candidates = [
      { nodeId: 'a', score: 0.5 },
      { nodeId: 'b', score: 0.9 },
      { nodeId: 'c', score: 0.3 },
      { nodeId: 'd', score: 0.8 },
      { nodeId: 'e', score: 0.7 },
    ];
    const selected = selectCosmicEchoes(candidates, 3);
    expect(selected).toHaveLength(3);
    expect(selected[0].nodeId).toBe('b');
    expect(selected[1].nodeId).toBe('d');
    expect(selected[2].nodeId).toBe('e');
  });

  it('selectCosmicEchoes returns fewer if not enough candidates', () => {
    const candidates = [{ nodeId: 'a', score: 0.5 }];
    const selected = selectCosmicEchoes(candidates, 5);
    expect(selected).toHaveLength(1);
  });

  it('buildEchoDefinition creates a legacy echo from an actor node', () => {
    const echo = buildEchoDefinition(
      'echo_001',
      { id: 'actor_hero', type: 'actor', name: 'Velanthos', properties: { actorType: 'individual' } },
      'cosmic', 1, 0.85, ['life', 'spirit']
    );
    expect(echo.echoType).toBe('legacy');
    expect(echo.injection.injectionType).toBe('cultural_template');
    expect(echo.source).toBe('cosmic');
  });

  it('buildEchoDefinition creates a monument echo from a location node', () => {
    const echo = buildEchoDefinition(
      'echo_002',
      { id: 'loc_temple', type: 'location', name: 'The Shattered Sanctum', properties: {} },
      'divine', 2, 0.7, ['spirit']
    );
    expect(echo.echoType).toBe('monument');
    expect(echo.injection.injectionType).toBe('location_feature');
  });

  it('buildEchoDefinition creates a relic echo from an artifact node', () => {
    const echo = buildEchoDefinition(
      'echo_003',
      { id: 'artifact_sword', type: 'artifact', name: 'Griefender', properties: {} },
      'cosmic', 1, 0.9, ['force', 'entropy']
    );
    expect(echo.echoType).toBe('relic');
    expect(echo.injection.injectionType).toBe('quest_seed');
  });

  it('createEchoState returns fresh state with zero degradation', () => {
    const state = createEchoState('echo_001');
    expect(state.degradation).toBe(0);
    expect(state.cyclesActive).toBe(0);
    expect(state.faded).toBe(false);
  });
});

describe('Echo degradation & injection', () => {
  it('degradeEcho increases degradation by ECHO_DEGRADATION_RATE', () => {
    const state: EchoState = { id: 'e1', degradation: 0, cyclesActive: 0, faded: false };
    const degraded = degradeEcho(state);
    expect(degraded.degradation).toBeCloseTo(ECHO_DEGRADATION_RATE);
    expect(degraded.cyclesActive).toBe(1);
    expect(degraded.faded).toBe(false);
  });

  it('degradeEcho marks as faded when at threshold', () => {
    const state: EchoState = { id: 'e1', degradation: 0.8, cyclesActive: 5, faded: false };
    const degraded = degradeEcho(state);
    expect(degraded.degradation).toBeCloseTo(0.95);
    expect(degraded.faded).toBe(true);
  });

  it('degradeEcho caps degradation at 1.0', () => {
    const state: EchoState = { id: 'e1', degradation: 0.95, cyclesActive: 6, faded: true };
    const degraded = degradeEcho(state);
    expect(degraded.degradation).toBe(1.0);
  });

  it('degradeAllEchoes applies degradation to all states', () => {
    const states: EchoState[] = [
      { id: 'e1', degradation: 0.0, cyclesActive: 0, faded: false },
      { id: 'e2', degradation: 0.5, cyclesActive: 3, faded: false },
    ];
    const degraded = degradeAllEchoes(states);
    expect(degraded[0].degradation).toBeCloseTo(ECHO_DEGRADATION_RATE);
    expect(degraded[1].degradation).toBeCloseTo(0.65);
  });

  it('isEchoFaded returns true when degradation >= threshold', () => {
    expect(isEchoFaded({ id: 'e1', degradation: 0.9, cyclesActive: 6, faded: true })).toBe(true);
    expect(isEchoFaded({ id: 'e2', degradation: 0.5, cyclesActive: 3, faded: false })).toBe(false);
  });

  it('pruneEchoes removes faded echoes', () => {
    const states: EchoState[] = [
      { id: 'e1', degradation: 0.5, cyclesActive: 3, faded: false },
      { id: 'e2', degradation: 0.95, cyclesActive: 7, faded: true },
      { id: 'e3', degradation: 0.2, cyclesActive: 1, faded: false },
    ];
    const pruned = pruneEchoes(states);
    expect(pruned).toHaveLength(2);
    expect(pruned.find(e => e.id === 'e2')).toBeUndefined();
  });

  it('collectInjections gathers injection data from active (non-faded) echoes', () => {
    const definitions: EchoDefinition[] = [
      {
        id: 'e1', echoType: 'legacy', source: 'cosmic', originNodeId: 'a1',
        originCycle: 1, name: 'Hero', summary: 'A hero', sphereAffinities: ['life'],
        significance: 0.8,
        injection: { injectionType: 'cultural_template', description: 'Seeds hero culture', sphereBiases: { life: 0.05 } },
      },
      {
        id: 'e2', echoType: 'relic', source: 'divine', originNodeId: 'art1',
        originCycle: 1, name: 'Sword', summary: 'A sword', sphereAffinities: ['force'],
        significance: 0.9,
        injection: { injectionType: 'quest_seed', description: 'Seeds sword quest', sphereBiases: { force: 0.04 } },
      },
    ];
    const states: EchoState[] = [
      { id: 'e1', degradation: 0.3, cyclesActive: 2, faded: false },
      { id: 'e2', degradation: 0.95, cyclesActive: 7, faded: true },
    ];
    const injections = collectInjections(definitions, states);
    expect(injections).toHaveLength(1);
    expect(injections[0].echoId).toBe('e1');
    expect(injections[0].injection.injectionType).toBe('cultural_template');
    expect(injections[0].strength).toBeCloseTo(0.7);
  });
});

import {
  createGreatChronicle,
  createVolume,
  addChapter,
  addInterlude,
  closeVolume,
  addEchoThreadAppearance,
} from '../chronicle';

describe('Echo + Chronicle integration: multi-cycle lifecycle', () => {
  it('simulates 3 cycles of echo creation, degradation, injection, and chronicle assembly', () => {
    // ── Setup ────────────────────────────────────────────────
    let echoDefinitions: EchoDefinition[] = [];
    let echoStates: EchoState[] = [];
    let chronicle: GreatChronicle = createGreatChronicle();

    // ── Cycle 1: Create echoes, start chronicle ─────────────
    chronicle = createVolume(chronicle, 1, 'breach');
    chronicle = addChapter(chronicle, {
      id: 'ch_001', title: 'The Fall of Ardenmor', prose: 'Darkness consumed...',
      tick: 30, significance: 0.9, spheres: ['entropy'], actorIds: ['actor_hero'],
    });
    chronicle = addInterlude(chronicle, {
      id: 'int_001', summary: 'Peace reigned briefly.', tickRange: { start: 1, end: 29 }, eventCount: 15,
    });
    chronicle = closeVolume(chronicle, 'The breach was sealed, but at great cost.');

    // Create 3 echoes from cycle 1
    const echoDef1 = buildEchoDefinition(
      'echo_001',
      { id: 'actor_hero', type: 'actor', name: 'Kael the Unbroken', properties: {} },
      'cosmic', 1, 0.92, ['force', 'life']
    );
    const echoDef2 = buildEchoDefinition(
      'echo_002',
      { id: 'loc_fortress', type: 'location', name: 'Ardenmor Keep', properties: {} },
      'cosmic', 1, 0.78, ['matter']
    );
    const echoDef3 = buildEchoDefinition(
      'echo_003',
      { id: 'artifact_shield', type: 'artifact', name: 'The Aegis of Dawn', properties: {} },
      'divine', 1, 0.85, ['spirit', 'force']
    );

    echoDefinitions.push(echoDef1, echoDef2, echoDef3);
    echoStates.push(
      createEchoState('echo_001'),
      createEchoState('echo_002'),
      createEchoState('echo_003')
    );

    // Record echo threads
    chronicle = addEchoThreadAppearance(chronicle, 'echo_001', 1, 'vol_001', 'Kael defended the breach.');
    chronicle = addEchoThreadAppearance(chronicle, 'echo_003', 1, 'vol_001', 'The Aegis was raised against the darkness.');

    expect(echoStates.every(s => s.degradation === 0)).toBe(true);

    // ── Cycle 2: Degrade, collect injections, add new echoes ──
    echoStates = degradeAllEchoes(echoStates);
    expect(echoStates[0].degradation).toBeCloseTo(0.15);
    expect(echoStates[0].faded).toBe(false);

    // Collect active injections
    let injections = collectInjections(echoDefinitions, echoStates);
    expect(injections).toHaveLength(3); // all still active

    // Verify injection strength reflects degradation
    expect(injections[0].strength).toBeCloseTo(0.85);

    // Chronicle cycle 2
    chronicle = createVolume(chronicle, 2, 'convergence');
    chronicle = addChapter(chronicle, {
      id: 'ch_002', title: 'The Gathering', prose: 'Forces aligned...',
      tick: 45, significance: 0.85, spheres: ['mind', 'spirit'], actorIds: ['actor_sage'],
    });
    chronicle = closeVolume(chronicle, 'All paths converged at the nexus.');

    // Echo thread continues
    chronicle = addEchoThreadAppearance(chronicle, 'echo_001', 2, 'vol_002',
      'Myths of Kael inspired a new order of defenders.');

    // Add new echo from cycle 2
    const echoDef4 = buildEchoDefinition(
      'echo_004',
      { id: 'actor_sage', type: 'actor', name: 'Mirael the Seer', properties: {} },
      'cosmic', 2, 0.88, ['mind', 'time']
    );
    echoDefinitions.push(echoDef4);
    echoStates.push(createEchoState('echo_004'));

    // ── Cycle 3: More degradation ───────────────────────────
    echoStates = degradeAllEchoes(echoStates);
    expect(echoStates[0].degradation).toBeCloseTo(0.30); // echo_001: 2 cycles
    expect(echoStates[3].degradation).toBeCloseTo(0.15); // echo_004: 1 cycle

    injections = collectInjections(echoDefinitions, echoStates);
    expect(injections).toHaveLength(4); // all still active at 0.30 max

    // Chronicle cycle 3
    chronicle = createVolume(chronicle, 3, 'failing');
    chronicle = closeVolume(chronicle, 'The world dimmed quietly.');

    // ── Cycle 4-7: Fast-forward degradation ─────────────────
    for (let cycle = 4; cycle <= 7; cycle++) {
      echoStates = degradeAllEchoes(echoStates);
    }
    // echo_001: degradation = 0.15 * 6 = 0.90 → faded!
    expect(echoStates[0].degradation).toBeCloseTo(0.90);
    expect(echoStates[0].faded).toBe(true);

    // echo_002: same age → also faded
    expect(echoStates[1].faded).toBe(true);

    // echo_003: same age → also faded
    expect(echoStates[2].faded).toBe(true);

    // echo_004: degradation = 0.15 * 5 = 0.75 → still active
    expect(echoStates[3].faded).toBe(false);

    // Prune faded echoes
    echoStates = pruneEchoes(echoStates);
    expect(echoStates).toHaveLength(1);
    expect(echoStates[0].id).toBe('echo_004');

    // Only echo_004 produces injections now
    injections = collectInjections(echoDefinitions, echoStates);
    expect(injections).toHaveLength(1);
    expect(injections[0].echoId).toBe('echo_004');
    expect(injections[0].strength).toBeCloseTo(0.25);

    // ── Verify chronicle structure ──────────────────────────
    expect(chronicle.volumes).toHaveLength(3);
    expect(chronicle.volumes[0].title).toBe('Volume I: The Age of the Breach');
    expect(chronicle.volumes[1].title).toBe('Volume II: The Age of the Convergence');
    expect(chronicle.volumes[2].title).toBe('Volume III: The Age of the Failing');

    expect(chronicle.echoThreads).toHaveLength(2); // echo_001 and echo_003
    const kaelThread = chronicle.echoThreads.find(t => t.echoId === 'echo_001');
    expect(kaelThread).toBeDefined();
    expect(kaelThread!.appearances).toHaveLength(2); // cycles 1 and 2

    // Verify chapters and interludes
    expect(chronicle.volumes[0].chapters).toHaveLength(1);
    expect(chronicle.volumes[0].interludes).toHaveLength(1);
    expect(chronicle.volumes[0].harvestSummary).toBe('The breach was sealed, but at great cost.');
  });
});
