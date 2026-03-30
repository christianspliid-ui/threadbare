import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getCultureDetail,
  getCultureInfoCard,
  getCultureCodexData,
  type CultureDetailData,
  type CultureInfoCardData,
  type CultureCodexData,
} from '../cultureDetail';

function buildGraphWithCulture(): { graph: WorldGraph; cultureId: string } {
  const graph = new WorldGraph();

  const cultureId = 'culture-keepers';
  graph.addNode({
    id: cultureId,
    type: 'actor',
    name: 'Keepers of Ashen Lore',
    properties: {
      actorType: 'culture',
      cultureIdentity: {
        foundationBias: 'order',
        veneratedSpheres: ['mind', 'time'],
        primaryBiome: 'mountain',
        socialStructure: 'council of elders',
        accountability: 'public shaming',
        behavioralKeywords: ['stoic', 'scholarly', 'patient'],
        materialVocabulary: ['stone tablets', 'ink', 'brass instruments'],
        metaphorPalette: ['mountain that remembers', 'ink that never fades'],
        formativeTraitSeedIds: ['resilient', 'cautious'],
        behavioralTraitSeedIds: ['scholarly', 'traditional'],
      },
      flagSvg: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>',
    },
  });

  const locId = 'loc-peak';
  graph.addNode({ id: locId, type: 'location', name: 'Ashen Peak', properties: { terrain: 'mountain' } });
  graph.addEdge({ id: 'edge-loc-culture', source: locId, target: cultureId, type: 'belongs_to', properties: { culturalStrength: 0.8 } });

  const agentId = 'agent-kael';
  graph.addNode({ id: agentId, type: 'actor', name: 'Kael the Inscriber', properties: { actorType: 'individual', locationId: locId } });
  graph.addEdge({ id: 'edge-agent-culture', source: agentId, target: cultureId, type: 'belongs_to', properties: { culturalStrength: 0.7 } });

  return { graph, cultureId };
}

describe('getCultureDetail', () => {
  it('returns CultureDetailData for a valid culture', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const detail = getCultureDetail(graph, cultureId);
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe('Keepers of Ashen Lore');
    expect(detail!.identity.foundationBias).toBe('order');
    expect(detail!.flagSvg).toContain('<svg');
    expect(detail!.members.length).toBe(1);
    expect(detail!.territoryLocations.length).toBe(1);
  });

  it('returns null for non-existent culture', () => {
    const graph = new WorldGraph();
    expect(getCultureDetail(graph, 'nope')).toBeNull();
  });
});

describe('getCultureInfoCard', () => {
  it('returns header + flag at stranger tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const card = getCultureInfoCard(graph, cultureId, 'stranger');
    expect(card).not.toBeNull();
    expect(card!.name).toBe('Keepers of Ashen Lore');
    expect(card!.flagSvg).toContain('<svg');
    expect(card!.knowledgeLevel).toBe('stranger');
    expect(card!.socialStructure).toBeUndefined();
  });

  it('reveals social structure at recognised tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const card = getCultureInfoCard(graph, cultureId, 'recognised');
    expect(card!.socialStructure).toBe('council of elders');
  });

  it('reveals material vocabulary at known tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const card = getCultureInfoCard(graph, cultureId, 'known');
    expect(card!.materialVocabulary).toBeDefined();
    expect(card!.materialVocabulary!.length).toBeGreaterThan(0);
  });
});

describe('getCultureCodexData', () => {
  it('returns codex sections gated by insight tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const codex = getCultureCodexData(graph, cultureId, 'transparent');
    expect(codex).not.toBeNull();
    expect(codex!.sections.length).toBeGreaterThan(0);
    for (const section of codex!.sections) {
      expect(section.prose).toBeTruthy();
    }
  });

  it('stranger tier only sees origins section', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const codex = getCultureCodexData(graph, cultureId, 'stranger');
    expect(codex).not.toBeNull();
    const visibleSections = codex!.sections;
    expect(visibleSections.length).toBeLessThanOrEqual(2);
  });

  it('intimate tier has oral tradition voice', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const codex = getCultureCodexData(graph, cultureId, 'transparent');
    const oralSections = codex!.sections.filter(s => s.proseVoice === 'oral');
    expect(oralSections.length).toBeGreaterThan(0);
  });

  it('includes members at known+ tier', () => {
    const { graph, cultureId } = buildGraphWithCulture();
    const codex = getCultureCodexData(graph, cultureId, 'known');
    const memberSection = codex!.sections.find(s => s.id === 'figures_of_note');
    expect(memberSection).toBeDefined();
  });
});
