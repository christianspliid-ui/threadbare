import { describe, it, expect, beforeEach } from 'vitest';
import { getHexRegionData } from '../hexRegion';
import { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';

describe('getHexRegionData', () => {
  let graph: WorldGraph;
  let regionId: string;
  let historicalCultureId: string;
  let currentCultureId: string;

  beforeEach(() => {
    graph = new WorldGraph();
    regionId = 'region.test_region';
    historicalCultureId = 'culture.historical_test';
    currentCultureId = 'culture.current_test';
  });

  it('should return null when regionId is undefined', () => {
    const result = getHexRegionData(graph, undefined);
    expect(result).toBeNull();
  });

  it('should return null when regionId does not exist in graph', () => {
    const result = getHexRegionData(graph, 'nonexistent.region');
    expect(result).toBeNull();
  });

  it('should return null when node exists but is not a region type', () => {
    graph.addNode({
      id: 'actor.alice',
      type: 'actor',
      name: 'Alice',
      properties: {},
    });

    const result = getHexRegionData(graph, 'actor.alice');
    expect(result).toBeNull();
  });

  it('should return region name and feature type for valid region without culture', () => {
    graph.addNode({
      id: regionId,
      type: 'region',
      name: 'Misty Vale',
      properties: {
        featureType: 'valley',
        hexCount: 12,
        centerCol: 10,
        centerRow: 20,
      },
    });

    const result = getHexRegionData(graph, regionId);

    expect(result).not.toBeNull();
    expect(result?.regionId).toBe(regionId);
    expect(result?.regionName).toBe('Misty Vale');
    expect(result?.featureType).toBe('valley');
    expect(result?.hexCount).toBe(12);
    expect(result?.historicalCulture).toBeNull();
  });

  it('should return historicalCulture data when region has historical belongs_to edge', () => {
    // Add region
    graph.addNode({
      id: regionId,
      type: 'region',
      name: 'Ancient Lands',
      properties: {
        featureType: 'plateau',
        hexCount: 25,
        centerCol: 50,
        centerRow: 60,
      },
    });

    // Add historical culture
    graph.addNode({
      id: historicalCultureId,
      type: 'actor',
      name: 'The Elder Folk',
      properties: {
        actorType: 'culture',
        cultureEra: 'historical',
        templateName: 'template.elder_folk',
        cultureIdentity: {
          foundationBias: 'Spirit',
          veneratedSpheres: ['spirit', 'time'] as SphereName[],
        },
        ruinDescriptors: ['weathered', 'mysterious'],
        legacyFlavor: 'They left only whispers.',
      },
    });

    // Add belongs_to edge with historical cultureLayer
    graph.addEdge({
      id: 'edge.region_to_historical',
      source: regionId,
      target: historicalCultureId,
      type: 'belongs_to',
      properties: {
        cultureLayer: 'historical',
        culturalStrength: 1.0,
      },
    });

    const result = getHexRegionData(graph, regionId);

    expect(result).not.toBeNull();
    expect(result?.historicalCulture).not.toBeNull();
    expect(result?.historicalCulture?.id).toBe(historicalCultureId);
    expect(result?.historicalCulture?.name).toBe('The Elder Folk');
    expect(result?.historicalCulture?.templateName).toBe('template.elder_folk');
    expect(result?.historicalCulture?.foundationBias).toBe('Spirit');
    expect(result?.historicalCulture?.veneratedSpheres).toEqual(['spirit', 'time']);
    expect(result?.historicalCulture?.ruinDescriptors).toEqual(['weathered', 'mysterious']);
    expect(result?.historicalCulture?.legacyFlavor).toBe('They left only whispers.');
  });

  it('should return null historicalCulture when region has no belongs_to edges', () => {
    graph.addNode({
      id: regionId,
      type: 'region',
      name: 'Untamed Wilds',
      properties: {
        featureType: 'forest',
        hexCount: 18,
        centerCol: 25,
        centerRow: 35,
      },
    });

    const result = getHexRegionData(graph, regionId);

    expect(result).not.toBeNull();
    expect(result?.historicalCulture).toBeNull();
  });

  it('should return null historicalCulture when region only has current culture edges', () => {
    // Add region
    graph.addNode({
      id: regionId,
      type: 'region',
      name: 'Modern Lands',
      properties: {
        featureType: 'grassland',
        hexCount: 15,
        centerCol: 40,
        centerRow: 50,
      },
    });

    // Add current culture
    graph.addNode({
      id: currentCultureId,
      type: 'actor',
      name: 'The New Folk',
      properties: {
        actorType: 'culture',
        cultureEra: 'current',
      },
    });

    // Add belongs_to edge with current cultureLayer (not historical)
    graph.addEdge({
      id: 'edge.region_to_current',
      source: regionId,
      target: currentCultureId,
      type: 'belongs_to',
      properties: {
        cultureLayer: 'current',
        culturalStrength: 0.8,
      },
    });

    const result = getHexRegionData(graph, regionId);

    expect(result).not.toBeNull();
    expect(result?.historicalCulture).toBeNull();
  });

  it('should handle missing culture node properties gracefully', () => {
    // Add region
    graph.addNode({
      id: regionId,
      type: 'region',
      name: 'Sparse Land',
      properties: {
        featureType: 'desert',
        hexCount: 20,
        centerCol: 15,
        centerRow: 25,
      },
    });

    // Add historical culture with minimal properties
    graph.addNode({
      id: historicalCultureId,
      type: 'actor',
      name: 'Ancient Dust',
      properties: {
        actorType: 'culture',
        cultureEra: 'historical',
        // missing templateName, cultureIdentity, etc.
      },
    });

    // Add belongs_to edge
    graph.addEdge({
      id: 'edge.region_to_sparse_culture',
      source: regionId,
      target: historicalCultureId,
      type: 'belongs_to',
      properties: {
        cultureLayer: 'historical',
        culturalStrength: 1.0,
      },
    });

    const result = getHexRegionData(graph, regionId);

    expect(result).not.toBeNull();
    expect(result?.historicalCulture).not.toBeNull();
    expect(result?.historicalCulture?.id).toBe(historicalCultureId);
    expect(result?.historicalCulture?.name).toBe('Ancient Dust');
    // Should gracefully handle undefined properties
    expect(result?.historicalCulture?.templateName).toBeUndefined();
    expect(result?.historicalCulture?.foundationBias).toBeUndefined();
    expect(result?.historicalCulture?.veneratedSpheres).toBeUndefined();
  });

  it('should handle missing region node properties gracefully', () => {
    // Add region with minimal properties
    graph.addNode({
      id: regionId,
      type: 'region',
      name: 'Minimal Region',
      properties: {
        // missing featureType, hexCount, centerCol, centerRow
      },
    });

    const result = getHexRegionData(graph, regionId);

    expect(result).not.toBeNull();
    expect(result?.regionId).toBe(regionId);
    expect(result?.regionName).toBe('Minimal Region');
    expect(result?.featureType).toBeUndefined();
    expect(result?.hexCount).toBeUndefined();
    expect(result?.historicalCulture).toBeNull();
  });

  it('should pick first historical culture when multiple belong_to edges exist', () => {
    // Add region
    graph.addNode({
      id: regionId,
      type: 'region',
      name: 'Contested Land',
      properties: {
        featureType: 'hills',
        hexCount: 10,
        centerCol: 30,
        centerRow: 40,
      },
    });

    // Add two historical cultures
    const historical1 = 'culture.historical_first';
    const historical2 = 'culture.historical_second';

    graph.addNode({
      id: historical1,
      type: 'actor',
      name: 'First Dwellers',
      properties: {
        actorType: 'culture',
        cultureEra: 'historical',
        templateName: 'template.first',
      },
    });

    graph.addNode({
      id: historical2,
      type: 'actor',
      name: 'Second Dwellers',
      properties: {
        actorType: 'culture',
        cultureEra: 'historical',
        templateName: 'template.second',
      },
    });

    // Add two belongs_to edges with historical layer
    graph.addEdge({
      id: 'edge.to_historical_1',
      source: regionId,
      target: historical1,
      type: 'belongs_to',
      properties: {
        cultureLayer: 'historical',
        culturalStrength: 1.0,
      },
    });

    graph.addEdge({
      id: 'edge.to_historical_2',
      source: regionId,
      target: historical2,
      type: 'belongs_to',
      properties: {
        cultureLayer: 'historical',
        culturalStrength: 0.5,
      },
    });

    const result = getHexRegionData(graph, regionId);

    expect(result?.historicalCulture).not.toBeNull();
    // Should return the first one found
    expect(result?.historicalCulture?.id).toBe(historical1);
    expect(result?.historicalCulture?.name).toBe('First Dwellers');
  });
});
