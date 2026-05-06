import type { EssencePool } from '../../types/influence';
import type { SphereName } from '../../types/index';
import type { TargetCategory } from '../../types/targetContext';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { evaluatePlaceGate, type PlaceGateContext } from './placeGating';

export type HandFilterStage =
  | 'target_match'
  | 'cost_availability'
  | 'sphere_prereq'
  | 'bond_tier'
  | 'place_gating';

export type HandFilterPrereqCode =
  | 'cost_unavailable'
  | 'sphere_prereq_missing'
  | 'bond_tier_too_low'
  | 'place_gated';

export type HandFilterHiddenCode = 'target_mismatch';

export interface HandFilterPrereqReason {
  stage: HandFilterStage;
  code: HandFilterPrereqCode;
  message: string;
}

export interface HandFilterHiddenReason {
  stage: 'target_match';
  code: HandFilterHiddenCode;
}

export interface HandFilterPlayableEntry {
  template: UnifiedActionTemplate;
}

export interface HandFilterDimmedEntry {
  template: UnifiedActionTemplate;
  prereq: HandFilterPrereqReason;
}

export interface HandFilterHiddenEntry {
  template: UnifiedActionTemplate;
  hiddenReason: HandFilterHiddenReason;
}

export interface AscendantHandPartition {
  playable: HandFilterPlayableEntry[];
  dimmed: HandFilterDimmedEntry[];
  hidden: HandFilterHiddenEntry[];
  rarePulses: string[];
}

export interface FilterAscendantHandContext {
  sceneTargetCategories: readonly TargetCategory[];
  essencePool: Partial<EssencePool>;
  accessibleSpheres: readonly SphereName[];
  targetBondTier: number;
  placeContext: PlaceGateContext;
  authorPinnedEligibleTemplateIds?: readonly string[];
  authorPinnedRarePulseTemplateIds?: readonly string[];
}

const DEFAULT_TARGET_CATEGORIES: readonly TargetCategory[] = ['actor'];
const TARGET_MISMATCH_REASON: HandFilterHiddenReason = {
  stage: 'target_match',
  code: 'target_mismatch',
};
const PRESET_REASON_NOT_ENOUGH_ESSENCE = 'not enough essence for this move';
const PRESET_REASON_SPHERE_PREREQ = 'sphere attunement missing';
const PRESET_REASON_BOND_TIER = 'bond tier too low';
const PRESET_REASON_PLACE_GATED = 'available at sphere-aligned places';

interface StageEvaluationResult {
  visible: boolean;
  prereq?: HandFilterPrereqReason;
  hiddenReason?: HandFilterHiddenReason;
}

function toCategories(
  categories: readonly TargetCategory[] | undefined,
): readonly TargetCategory[] {
  return categories && categories.length > 0 ? categories : DEFAULT_TARGET_CATEGORIES;
}

function getRequiredBondTier(template: UnifiedActionTemplate): number {
  const props = template.requiredNodeProperties;
  if (!props) return 0;
  const candidate = props.minBondTier ?? props.minThreadTier ?? props.bondTier;
  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return Math.max(0, Math.floor(candidate));
  }
  return 0;
}

function totalEssence(pool: Partial<EssencePool>): number {
  return Object.values(pool).reduce((sum, raw) => {
    const amount = typeof raw === 'number' && Number.isFinite(raw) ? raw : 0;
    return sum + amount;
  }, 0);
}

function getSphereEssence(
  pool: Partial<EssencePool>,
  sphere: SphereName | undefined,
): number {
  if (!sphere) return totalEssence(pool);
  const amount = pool[sphere];
  return typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;
}

function evaluateTemplateVisibility(
  template: UnifiedActionTemplate,
  context: FilterAscendantHandContext,
): StageEvaluationResult {
  const pinnedEligibleSet = new Set(context.authorPinnedEligibleTemplateIds ?? []);
  const isPinnedEligible = pinnedEligibleSet.has(template.id);

  // Stage 1: target match (hidden when not relevant unless author-pinned)
  if (!isPinnedEligible) {
    const sceneTargets = new Set(context.sceneTargetCategories);
    const targetCategories = toCategories(template.targetCategories);
    const hasTargetMatch = targetCategories.some((category) => sceneTargets.has(category));
    if (!hasTargetMatch) {
      return { visible: false, hiddenReason: TARGET_MISMATCH_REASON };
    }
  }

  // Stage 2: cost availability
  const requiredEssence = Math.max(0, template.essenceCost ?? 0);
  const availableEssence = getSphereEssence(context.essencePool, template.sphereAffinity);
  if (availableEssence + 1e-9 < requiredEssence) {
    return {
      visible: true,
      prereq: {
        stage: 'cost_availability',
        code: 'cost_unavailable',
        message: PRESET_REASON_NOT_ENOUGH_ESSENCE,
      },
    };
  }

  // Stage 3: sphere prereq
  if (template.sphereAffinity) {
    const accessible = new Set(context.accessibleSpheres);
    if (!accessible.has(template.sphereAffinity)) {
      return {
        visible: true,
        prereq: {
          stage: 'sphere_prereq',
          code: 'sphere_prereq_missing',
          message: PRESET_REASON_SPHERE_PREREQ,
        },
      };
    }
  }

  // Stage 4: bond tier
  const requiredBondTier = getRequiredBondTier(template);
  if (context.targetBondTier < requiredBondTier) {
    return {
      visible: true,
      prereq: {
        stage: 'bond_tier',
        code: 'bond_tier_too_low',
        message: PRESET_REASON_BOND_TIER,
      },
    };
  }

  // Stage 5: place gating
  const placeGate = evaluatePlaceGate(template, context.placeContext);
  if (!placeGate.allowed) {
    return {
      visible: true,
      prereq: {
        stage: 'place_gating',
        code: 'place_gated',
        message: placeGate.reason ?? PRESET_REASON_PLACE_GATED,
      },
    };
  }

  return { visible: true };
}

export function filterAscendantHand(
  deck: readonly UnifiedActionTemplate[],
  context: FilterAscendantHandContext,
): AscendantHandPartition {
  const playable: HandFilterPlayableEntry[] = [];
  const dimmed: HandFilterDimmedEntry[] = [];
  const hidden: HandFilterHiddenEntry[] = [];
  const rarePulseSet = new Set(context.authorPinnedRarePulseTemplateIds ?? []);

  for (const template of deck) {
    const evaluation = evaluateTemplateVisibility(template, context);
    if (!evaluation.visible) {
      hidden.push({
        template,
        hiddenReason: evaluation.hiddenReason ?? TARGET_MISMATCH_REASON,
      });
      continue;
    }
    if (evaluation.prereq) {
      dimmed.push({
        template,
        prereq: evaluation.prereq,
      });
      continue;
    }
    playable.push({ template });
  }

  const rarePulses = playable
    .map((entry) => entry.template.id)
    .filter((templateId) => rarePulseSet.has(templateId));

  return { playable, dimmed, hidden, rarePulses };
}

