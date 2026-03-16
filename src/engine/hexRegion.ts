/**
 * Hex Region Query Module — getHexRegionData
 *
 * Queries region and historical culture data given a regionId.
 * Returns region properties and associated historical culture summary.
 * Implements fail-soft semantics — returns null for missing/invalid data.
 */

import type { WorldGraph } from './graph';
import type { SphereName } from '../types/index';

/**
 * Historical culture summary extracted from a culture actor node.
 * Only populated for cultures with cultureLayer: 'historical'.
 */
export interface HistoricalCultureSummary {
  id: string;
  name: string;
  templateName?: string;
  foundationBias?: string;
  veneratedSpheres?: SphereName[];
  ruinDescriptors?: string[];
  legacyFlavor?: string;
}

/**
 * Complete hex region data including culture inheritance.
 * Represents a single region node and its historical cultural legacy.
 */
export interface HexRegionData {
  regionId: string;
  regionName: string;
  featureType?: string;
  hexCount?: number;
  historicalCulture: HistoricalCultureSummary | null;
}

/**
 * Query region and historical culture data given a regionId.
 *
 * Returns a HexRegionData object containing:
 * - Region ID, name, feature type, hex count
 * - Historical culture summary (if region has historical culture via belongs_to edge)
 *
 * Returns null if regionId is undefined or region node doesn't exist in graph.
 * Returns null for historicalCulture if no historical belongs_to edge exists.
 *
 * Fail-soft: missing properties are returned as undefined, never throws.
 *
 * @param graph The world graph containing region and culture nodes
 * @param regionId Region node ID (e.g., 'region.misty_vale')
 * @returns HexRegionData or null if region not found
 */
export function getHexRegionData(
  graph: WorldGraph,
  regionId: string | undefined,
): HexRegionData | null {
  // Fail-soft: return null if regionId is undefined
  if (!regionId) {
    return null;
  }

  // Get the region node
  const regionNode = graph.getNode(regionId);

  // Return null if node doesn't exist or is not a region
  if (!regionNode || regionNode.type !== 'region') {
    return null;
  }

  // Extract region properties (fail-soft: undefined if missing)
  const featureType = regionNode.properties.featureType as string | undefined;
  const hexCount = regionNode.properties.hexCount as number | undefined;

  // Find historical culture via belongs_to edges
  let historicalCulture: HistoricalCultureSummary | null = null;

  const belongsToEdges = graph.getOutgoingEdges(regionId, 'belongs_to');
  const historicalEdge = belongsToEdges.find((edge) => {
    return edge.properties?.cultureLayer === 'historical';
  });

  // If historical edge found, extract culture data
  if (historicalEdge) {
    const cultureNode = graph.getNode(historicalEdge.target);

    if (cultureNode) {
      // Extract culture properties (fail-soft: undefined if missing)
      const cultureIdentity = cultureNode.properties.cultureIdentity as
        | {
            foundationBias?: string;
            veneratedSpheres?: SphereName[];
          }
        | undefined;

      historicalCulture = {
        id: cultureNode.id,
        name: cultureNode.name,
        templateName: cultureNode.properties.templateName as string | undefined,
        foundationBias: cultureIdentity?.foundationBias,
        veneratedSpheres: cultureIdentity?.veneratedSpheres,
        ruinDescriptors: cultureNode.properties.ruinDescriptors as string[] | undefined,
        legacyFlavor: cultureNode.properties.legacyFlavor as string | undefined,
      };
    }
  }

  return {
    regionId: regionNode.id,
    regionName: regionNode.name,
    featureType,
    hexCount,
    historicalCulture,
  };
}
