import { describe, it, expect } from 'vitest';
import type {
  ProseVoice,
  EntitySection,
  StructuredBlock,
  EntityHeader,
  EntityDetail,
  EntityDetailConfig,
  MemberEntry,
  TraitEntry,
  LocationEntry,
  TimelineEntry,
} from '../entityDetail';
import { KNOWLEDGE_LEVELS } from '../familiarity';

describe('entityDetail types', () => {
  it('EntitySection has required fields', () => {
    const section: EntitySection = {
      id: 'origins',
      title: 'Origins',
      insightTier: 'stranger',
      proseVoice: 'chronicle',
      prose: 'Test prose text',
    };
    expect(section.id).toBe('origins');
    expect(section.insightTier).toBe('stranger');
    expect(section.proseVoice).toBe('chronicle');
    expect(section.structuredData).toBeUndefined();
  });

  it('StructuredBlock discriminated union covers all types', () => {
    const memberList: StructuredBlock = {
      type: 'member_list',
      members: [{ id: 'a1', name: 'Kael', role: 'leader', tier: 3 }],
    };
    const traitGrid: StructuredBlock = {
      type: 'trait_grid',
      traits: [{ name: 'Resilient', category: 'behavioral' }],
    };
    const territorySummary: StructuredBlock = {
      type: 'territory_summary',
      locations: [{ id: 'loc1', name: 'Ashen Peak', biome: 'mountain' }],
    };
    const keywordCloud: StructuredBlock = {
      type: 'keyword_cloud',
      keywords: ['bone', 'ash', 'iron'],
      accent: '#d4a040',
    };
    const bondList: StructuredBlock = {
      type: 'bond_list',
      bonds: [{ name: 'Kael', sentiment: 'positive', strength: 'strong' }],
    };
    const domainGrid: StructuredBlock = {
      type: 'domain_grid',
      domains: [{ domain: 'iron', word: 'Warlord' }],
    };
    const timeline: StructuredBlock = {
      type: 'timeline',
      events: [{ tick: 10, label: 'Founded the outpost', significance: 0.8 }],
    };
    expect(memberList.type).toBe('member_list');
    expect(traitGrid.type).toBe('trait_grid');
    expect(territorySummary.type).toBe('territory_summary');
    expect(keywordCloud.type).toBe('keyword_cloud');
    expect(bondList.type).toBe('bond_list');
    expect(domainGrid.type).toBe('domain_grid');
    expect(timeline.type).toBe('timeline');
  });

  it('EntityHeader has required and optional fields', () => {
    const header: EntityHeader = {
      name: 'The Keepers of Ashen Lore',
      accentColor: '#d4a040',
    };
    expect(header.name).toBe('The Keepers of Ashen Lore');
    expect(header.iconSvg).toBeUndefined();
    expect(header.badges).toBeUndefined();
  });

  it('EntityDetail has card and codex sections', () => {
    const detail: EntityDetail = {
      header: { name: 'Test', accentColor: '#fff' },
      cardSections: [],
      codexSections: [],
    };
    expect(detail.cardSections).toEqual([]);
    expect(detail.heroImageUrl).toBeUndefined();
  });

  it('EntityDetailConfig maps data to EntityDetail', () => {
    type TestData = { label: string };
    const config: EntityDetailConfig<TestData> = {
      getDetail: (data, insightLevel) => ({
        header: { name: data.label, accentColor: '#000' },
        cardSections: [],
        codexSections: [],
      }),
    };
    const result = config.getDetail({ label: 'X' }, 'stranger');
    expect(result.header.name).toBe('X');
  });

  it('all 5 knowledge levels are valid insightTier values', () => {
    for (const level of KNOWLEDGE_LEVELS) {
      const section: EntitySection = {
        id: 'test',
        title: 'Test',
        insightTier: level,
        proseVoice: 'chronicle',
        prose: '',
      };
      expect(section.insightTier).toBe(level);
    }
  });
});
