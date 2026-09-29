/**
 * Caster identity — who counts as a spellcaster, and which tradition shelf they read.
 *
 * Moved out of `undertaking-objects.ts` by THR-1571 so worldgen's seeded knowing and
 * the `create × Power` cell ask the one predicate (THR-1230 ruling 4, composed as
 * THR-1229 recommended): a spell-weaver mastery trait, **or** a caster role, **or**
 * Veil at the floor. Pure reads; no draws (NFP #3).
 */

import type { WorldGraph } from './graph';
import {
  CASTER_MASTERY_TRAIT_IDS,
  CASTER_NPC_ROLES,
  LEARN_SPELL_CASTER_VEIL_FLOOR,
} from '../data/strategic-action-constants';

/**
 * Is this mortal a caster?
 *
 * Arm (a) matches the mastery trait's id by substring. THR-1571 fixed it: the real
 * trait id is `trait.mastery.spell-weaver` (hyphen), which none of the old
 * underscore/no-separator spellings could match — arm (a) measured 0 on seed 42 at
 * ticks 0 and 30.
 */
export function isCaster(graph: WorldGraph, actorId: string): boolean {
  if (!graph.getNode(actorId)) return false;
  // (b) A caster role. The seeded vocabulary, measured — see CASTER_NPC_ROLES.
  return casterRoleOf(graph, actorId) !== null || isCasterByCraft(graph, actorId);
}

/**
 * The two arms of `isCaster` that are not the role: (a) a mastery trait that names
 * the craft, (c) Veil deep enough to teach oneself. Seeded knowing reads them apart
 * from the role, because its role lever must not un-seed a mortal who is a caster by
 * craft as well.
 */
export function isCasterByCraft(graph: WorldGraph, actorId: string): boolean {
  const node = graph.getNode(actorId);
  if (!node) return false;

  // (a) A mastery trait that names the craft.
  for (const edge of graph.getOutgoingEdges(actorId, 'has_trait')) {
    const id = edge.target.toLowerCase();
    if (CASTER_MASTERY_TRAIT_IDS.some(t => id.includes(t))) return true;
  }

  // (c) Veil deep enough to teach oneself. Raw 0–100 scale (measured), and a field
  // most mortals do not carry — an absent capability block is not a caster, never a
  // zero that accidentally clears a floor of zero.
  const caps = node.properties.domainCapabilities as Record<string, number> | undefined;
  const veil = caps && typeof caps.veil === 'number' ? caps.veil : null;
  return veil !== null && veil >= LEARN_SPELL_CASTER_VEIL_FLOOR;
}

/** The mortal's caster role (lower-cased), or null when their role is not a caster role. */
export function casterRoleOf(graph: WorldGraph, actorId: string): string | null {
  const props = graph.getNode(actorId)?.properties ?? {};
  const raw = typeof props.npcRole === 'string' ? props.npcRole
    : typeof props.role === 'string' ? props.role : '';
  const role = raw.toLowerCase();
  return role && CASTER_NPC_ROLES.includes(role) ? role : null;
}

/** The spheres a mortal is aligned to, sorted, or empty when they have declared none. */
export function alignedSpheres(graph: WorldGraph, actorId: string): string[] {
  const props = graph.getNode(actorId)?.properties ?? {};
  const out = new Set<string>();

  const alignment = props.sphereAlignment as { primary?: string; secondary?: string } | undefined;
  if (alignment?.primary) out.add(alignment.primary);
  if (alignment?.secondary) out.add(alignment.secondary);

  const affinity = props.sphereAffinity as { scores?: Record<string, number> } | undefined;
  for (const [sphere, score] of Object.entries(affinity?.scores ?? {})) {
    if (typeof score === 'number' && score > 0) out.add(sphere);
  }

  return [...out].sort();
}
