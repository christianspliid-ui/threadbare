/**
 * Mandate Loader — imports, validates, and re-exports mandate templates from JSON files.
 *
 * Consumers import MANDATE_TEMPLATES and MANDATE_MILESTONE_PROSE from mandate-content.ts,
 * which delegates to this loader. This file is infrastructure, not content.
 */

import type { MandateCondition, MandateStage, MandateStageDefinition, MandateDefinition } from '../types/mandate';
import type { SphereName } from '../types/index';

// ─── JSON Imports ───────────────────────────────────────────────────
import dominionOfStone from './mandates/dominion-of-stone.json';
import buildersLegacy from './mandates/builders-legacy.json';
import webOfAllegiance from './mandates/web-of-allegiance.json';
import tideOfLife from './mandates/tide-of-life.json';
import entropicCascade from './mandates/entropic-cascade.json';
import illumination from './mandates/illumination.json';
import ascendantsChampion from './mandates/ascendants-champion.json';
import devotedCircle from './mandates/devoted-circle.json';
import shadowSovereign from './mandates/shadow-sovereign.json';
import threadsOfFate from './mandates/threads-of-fate.json';
import theGathering from './mandates/the-gathering.json';
import culturalConvergence from './mandates/cultural-convergence.json';

// ─── Types ──────────────────────────────────────────────────────────

/** JSON shape: mandate definition + co-located prose */
export interface MandateJsonShape {
  id: string;
  type: string;
  name: string;
  description: string;
  sphereAffinities: string[];
  targetSphere?: string;
  stages: Array<{
    stage: string;
    description: string;
    conditions: Array<{
      type: string;
      description: string;
      params: Record<string, unknown>;
    }>;
  }>;
  prose: Record<string, string>;
}

/** MandateTemplate = MandateDefinition + sphereAffinities (same shape as before) */
export interface MandateTemplate extends MandateDefinition {
  sphereAffinities: SphereName[];
}

// ─── Constants ──────────────────────────────────────────────────────

const VALID_CONDITION_TYPES = new Set(['node_count', 'edge_count', 'sphere_weight', 'actor_tier']);
const VALID_STAGES: MandateStage[] = ['setup', 'escalation', 'culmination'];
const VALID_TYPES = new Set(['graph_state', 'narrative', 'sphere_dominance', 'simulation_achievable']);
const VALID_SPHERES = new Set<string>(['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy']);
const REQUIRED_PROSE_KEYS = ['setup_to_escalation', 'escalation_to_culmination', 'completed', 'failed'];

// ─── Validation ─────────────────────────────────────────────────────

export function validateMandateJson(raw: unknown, filename: string): MandateTemplate {
  const data = raw as MandateJsonShape;

  // Required string fields
  if (!data.id || typeof data.id !== 'string') throw new Error(`${filename}: missing or invalid 'id'`);
  if (!data.type || !VALID_TYPES.has(data.type)) throw new Error(`${filename}: invalid mandate type '${data.type}'`);
  if (!data.name || typeof data.name !== 'string') throw new Error(`${filename}: missing 'name'`);
  if (!data.description || typeof data.description !== 'string') throw new Error(`${filename}: missing 'description'`);

  // Sphere affinities
  if (!Array.isArray(data.sphereAffinities) || data.sphereAffinities.length === 0) {
    throw new Error(`${filename}: sphereAffinities must be a non-empty array`);
  }
  for (const s of data.sphereAffinities) {
    if (!VALID_SPHERES.has(s)) throw new Error(`${filename}: invalid sphere affinity '${s}'`);
  }

  // Stages
  if (!Array.isArray(data.stages) || data.stages.length !== 3) {
    throw new Error(`${filename}: must have exactly 3 stages, got ${data.stages?.length ?? 0}`);
  }
  for (let i = 0; i < 3; i++) {
    const stage = data.stages[i];
    if (stage.stage !== VALID_STAGES[i]) {
      throw new Error(`${filename}: stage ${i} must be '${VALID_STAGES[i]}', got '${stage.stage}'`);
    }
    if (!stage.description) throw new Error(`${filename}: stage '${stage.stage}' missing description`);
    if (!Array.isArray(stage.conditions)) throw new Error(`${filename}: stage '${stage.stage}' missing conditions array`);
    for (const cond of stage.conditions) {
      if (!VALID_CONDITION_TYPES.has(cond.type)) {
        throw new Error(`${filename}: invalid condition type '${cond.type}' in stage '${stage.stage}'`);
      }
      if (!cond.description) throw new Error(`${filename}: condition in '${stage.stage}' missing description`);
      if (!cond.params || typeof cond.params !== 'object') {
        throw new Error(`${filename}: condition in '${stage.stage}' missing params`);
      }
    }
  }

  // Prose
  if (!data.prose || typeof data.prose !== 'object') throw new Error(`${filename}: missing prose object`);
  for (const key of REQUIRED_PROSE_KEYS) {
    if (!data.prose[key] || typeof data.prose[key] !== 'string') {
      throw new Error(`${filename}: missing prose key '${key}'`);
    }
  }

  // Build typed stages tuple
  const typedStages = data.stages.map((s) => ({
    stage: s.stage as MandateStage,
    description: s.description,
    conditions: s.conditions.map((c) => ({
      type: c.type as MandateCondition['type'],
      description: c.description,
      params: c.params,
    })),
  })) as [MandateStageDefinition, MandateStageDefinition, MandateStageDefinition];

  return {
    id: data.id,
    type: data.type as MandateTemplate['type'],
    name: data.name,
    description: data.description,
    sphereAffinities: data.sphereAffinities as SphereName[],
    targetSphere: data.targetSphere as SphereName | undefined,
    stages: typedStages,
  };
}

// ─── Raw Data Registry ──────────────────────────────────────────────

const RAW_MANDATES: Array<{ data: unknown; filename: string }> = [
  { data: dominionOfStone, filename: 'dominion-of-stone.json' },
  { data: buildersLegacy, filename: 'builders-legacy.json' },
  { data: webOfAllegiance, filename: 'web-of-allegiance.json' },
  { data: tideOfLife, filename: 'tide-of-life.json' },
  { data: entropicCascade, filename: 'entropic-cascade.json' },
  { data: illumination, filename: 'illumination.json' },
  { data: ascendantsChampion, filename: 'ascendants-champion.json' },
  { data: devotedCircle, filename: 'devoted-circle.json' },
  { data: shadowSovereign, filename: 'shadow-sovereign.json' },
  { data: threadsOfFate, filename: 'threads-of-fate.json' },
  { data: theGathering, filename: 'the-gathering.json' },
  { data: culturalConvergence, filename: 'cultural-convergence.json' },
];

// ─── Public Loaders ─────────────────────────────────────────────────

/** Load and validate all 12 mandate templates from JSON files. */
export function loadMandateTemplates(): MandateTemplate[] {
  return RAW_MANDATES.map(({ data, filename }) => validateMandateJson(data, filename));
}

/** Load milestone prose from all mandate JSON files, keyed by mandateId.transition. */
export function loadMandateMilestoneProse(): Record<string, string> {
  const prose: Record<string, string> = {};
  for (const { data, filename } of RAW_MANDATES) {
    // Validate first to ensure JSON is well-formed
    validateMandateJson(data, filename);
    const rawJson = data as MandateJsonShape;
    const mandateKey = rawJson.id.replace('mandate.', '');
    for (const [transition, text] of Object.entries(rawJson.prose)) {
      prose[`${mandateKey}.${transition}`] = text;
    }
  }
  return prose;
}
