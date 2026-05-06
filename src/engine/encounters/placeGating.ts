import type { SphereName } from '../../types/index';
import type { TargetCategory } from '../../types/targetContext';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';

export interface PlaceGateContext {
  placeSphere: SphereName | null;
}

export interface PlaceGateResult {
  allowed: boolean;
  reason?: string;
}

const PLACE_TARGET_CATEGORIES: readonly TargetCategory[] = ['location', 'sublocation', 'hex'];
const PLACE_GATE_REASON_SPHERE_ALIGNMENT = 'available at sphere-aligned places';
const CONSECRATION_TEMPLATE_HINTS = ['consecrate', 'sanctify'];

function toTargetCategories(
  categories: readonly TargetCategory[] | undefined,
): readonly TargetCategory[] {
  return categories && categories.length > 0 ? categories : ['actor'];
}

function isPlaceTargeted(template: UnifiedActionTemplate): boolean {
  const categories = toTargetCategories(template.targetCategories);
  return categories.some((category) => PLACE_TARGET_CATEGORIES.includes(category));
}

function readsRequiredPlaceSphere(template: UnifiedActionTemplate): SphereName | null {
  const raw = template.requiredNodeProperties?.requiredPlaceSphere;
  if (typeof raw !== 'string') return null;
  return raw as SphereName;
}

function requiresSphereAlignedPlace(template: UnifiedActionTemplate): boolean {
  const id = template.id.toLowerCase();
  return CONSECRATION_TEMPLATE_HINTS.some((hint) => id.includes(hint));
}

export function evaluatePlaceGate(
  template: UnifiedActionTemplate,
  context: PlaceGateContext,
): PlaceGateResult {
  if (!isPlaceTargeted(template)) return { allowed: true };

  const requiredPlaceSphere = readsRequiredPlaceSphere(template);
  if (requiredPlaceSphere) {
    return context.placeSphere === requiredPlaceSphere
      ? { allowed: true }
      : { allowed: false, reason: PLACE_GATE_REASON_SPHERE_ALIGNMENT };
  }

  if (!requiresSphereAlignedPlace(template)) return { allowed: true };

  if (!template.sphereAffinity) return { allowed: true };
  if (!context.placeSphere) return { allowed: false, reason: PLACE_GATE_REASON_SPHERE_ALIGNMENT };
  if (context.placeSphere !== template.sphereAffinity) {
    return { allowed: false, reason: PLACE_GATE_REASON_SPHERE_ALIGNMENT };
  }

  return { allowed: true };
}

