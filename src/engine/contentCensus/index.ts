export {
  resolveAll,
  resolveEncounters,
  resolveActions,
  resolveAttachments,
  resolveSpells,
  resolveArtifacts,
  resolveConditions,
  resolveOmens,
  resolveSublocations,
} from './adapters';
export { buildReport, buildMatrices, buildResolvabilityReport } from './matrix';
export type { CensusReport, CensusMatrix, CensusEntry, ContentType } from './types';
export type { ResolvabilityRow } from './matrix';
