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
