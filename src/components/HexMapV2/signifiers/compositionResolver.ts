/**
 * Hex composition resolver — pure function that assigns visual entities to hex slots.
 *
 * Algorithm:
 *   1. Sort entities by priority descending (higher priority gets preferred slot)
 *   2. Track occupied slots as a Set<HexSlot> (RING slot is exempt — unlimited capacity)
 *   3. For each entity: try preferredSlot → try fallbackSlots in order → mark hidden
 *      Exception: RING slot entities are always assigned RING and always visible
 *   4. Evaluate suppression rules: any suppressor may override visible=false on its targets
 *   5. Return CompositionResult[] in priority order
 *
 * COMP-05: RING slot supports unlimited occupants. RING entities get sequential ringIndex
 * (0-based) for caller use in distributing agents around the hex perimeter.
 *
 * NFP #2 (inspectability): Pure function — same input always produces same output, no side effects.
 * NFP #4 (fail-soft): Empty input returns []. Unknown entityTypes pass through without error.
 */

import type {
  HexVisualManifest,
  HexSlot,
  CompositionResult,
} from './compositionTypes';

/**
 * Resolve slot assignments and suppression for all entities on a single hex.
 *
 * @param entities - All visual entities that want to render on this hex (any order)
 * @returns CompositionResult[] in priority-descending order
 */
export function resolveHexComposition(
  entities: HexVisualManifest[],
): CompositionResult[] {
  if (entities.length === 0) return [];

  // Step 1: Sort by priority descending
  const sorted = [...entities].sort((a, b) => b.priority - a.priority);

  // Step 2 & 3: Assign slots in priority order
  // Note: RING slot is NOT added to occupiedSlots — it has unlimited capacity (COMP-05)
  const occupiedSlots = new Set<HexSlot>();
  const results: Array<CompositionResult & { manifest: HexVisualManifest }> = [];
  let ringCounter = 0;

  for (const entity of sorted) {
    // COMP-05: RING slot has unlimited capacity — always assign, always visible
    if (entity.preferredSlot === 'RING') {
      results.push({
        entity: entity.entityType,
        slot: 'RING',
        visible: true,
        ringIndex: ringCounter++,
        manifest: entity,
      });
      continue;
    }

    let assignedSlot: HexSlot | null = null;

    // Try preferred slot first
    if (!occupiedSlots.has(entity.preferredSlot)) {
      assignedSlot = entity.preferredSlot;
    } else {
      // Try fallback slots in order
      for (const fallback of entity.fallbackSlots ?? []) {
        if (!occupiedSlots.has(fallback)) {
          assignedSlot = fallback;
          break;
        }
      }
    }

    if (assignedSlot !== null) {
      occupiedSlots.add(assignedSlot);
      results.push({
        entity: entity.entityType,
        slot: assignedSlot,
        visible: true,
        manifest: entity,
      });
    } else {
      // No slot available — entity is hidden
      results.push({
        entity: entity.entityType,
        slot: entity.preferredSlot, // record preferred even though hidden
        visible: false,
        manifest: entity,
      });
    }
  }

  // Step 4: Evaluate suppression rules
  // For each entity that has suppresses rules, check if any other result matches target+when
  for (const suppressor of results) {
    for (const rule of suppressor.manifest.suppresses) {
      for (const target of results) {
        if (target.entity !== rule.target) continue;

        const shouldSuppress =
          rule.when === 'always' ||
          (rule.when === 'same-slot' && suppressor.slot === target.slot) ||
          (rule.when === 'footprint-overlap' && suppressor.slot === target.slot); // Phase 6: use footprint geometry

        if (shouldSuppress) {
          target.visible = false;
        }
      }
    }
  }

  // Step 5: Return results without internal manifest reference
  return results.map(({ entity, slot, visible, ringIndex }) => ({
    entity,
    slot,
    visible,
    ...(ringIndex !== undefined ? { ringIndex } : {}),
  }));
}
