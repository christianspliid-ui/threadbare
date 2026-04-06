import type { WorldGraph } from '../graph';
import type { SphereName } from '../../types/index';
import type { ReachDomain } from '../../types/traits';
import type {
  GenomeResult, SettlementTier, SublocationTag,
} from './types';
import { SETTLEMENT_INFRASTRUCTURE, INFRASTRUCTURE_NPCS } from './infrastructure';
import { SPHERE_SUBLOCATION_MENU, POSITION_MODIFIERS } from './sphereMenu';
import { REACH_SUBLOCATION_MENU } from './reachMenu';
import { SETTLEMENT_ARCHETYPES } from './archetypes';
import {
  SPHERE_CONTRIBUTION_THRESHOLD, SPHERE_STRONG_THRESHOLD,
  REACH_CONTRIBUTION_THRESHOLD, NPC_BUDGET,
  CULTURE_STRENGTH_BASE, CULTURE_STRENGTH_MIN_FOR_ADDITIONS,
} from './constants';
import { CULTURE_BASELINE_MAP } from './cultureBaseline';

export interface GenomeInput {
  tier: SettlementTier;
  sphereInfluence: Partial<Record<SphereName, number>>;
  position: 'heartland' | 'borderland';
  cultureId: string | null;
  seed: number;
  reachOverrides?: Partial<Record<ReachDomain, number>>;
}

const TIER_ORDER: SettlementTier[] = ['hamlet', 'town', 'city', 'capital'];

function tierAtOrBelow(tier: SettlementTier, minTier: SettlementTier): boolean {
  return TIER_ORDER.indexOf(minTier) <= TIER_ORDER.indexOf(tier);
}

export function runSettlementGenome(
  graph: WorldGraph,
  locationId: string,
  input: GenomeInput,
): GenomeResult {
  const { tier, sphereInfluence, position, seed: _seed } = input;
  const accumulated = new Map<string, { sourcePass: string; tags: SublocationTag[] }>();
  const npcList: GenomeResult['npcs'] = [];

  // ── Helper: add sublocation if not already present, merge tags if duplicate ──
  function addSublocation(id: string, sourcePass: string, tags: SublocationTag[]) {
    const existing = accumulated.get(id);
    if (existing) {
      for (const t of tags) {
        if (!existing.tags.includes(t)) existing.tags.push(t);
      }
    } else {
      accumulated.set(id, { sourcePass, tags: [...tags] });
    }
  }

  // ── Pass 1: Infrastructure ──
  for (const entry of SETTLEMENT_INFRASTRUCTURE) {
    if (!tierAtOrBelow(tier, entry.minTier)) continue;
    if (entry.condition) continue; // Condition evaluation deferred
    addSublocation(entry.id, 'infrastructure', entry.tags);
  }
  for (const npc of INFRASTRUCTURE_NPCS) {
    if (tierAtOrBelow(tier, npc.minTier)) {
      npcList.push({ role: npc.role, sourcePass: 'infrastructure' });
    }
  }

  // ── Pass 2: Culture ──
  if (input.cultureId) {
    const cultureEdges = graph.getOutgoingEdges(locationId, 'belongs_to');
    const currentCultureEdge = cultureEdges.find(
      e => e.target === input.cultureId && (e.properties as any)?.cultureLayer === 'current',
    );
    const culturalStrength = (currentCultureEdge?.properties as any)?.culturalStrength ?? CULTURE_STRENGTH_BASE;

    const cultureNode = graph.getNode(input.cultureId);
    const identity = (cultureNode?.properties as any)?.cultureIdentity;
    const foundation = identity?.foundationBias as string | undefined;

    if (foundation) {
      const baseline = CULTURE_BASELINE_MAP[foundation];
      if (baseline) {
        // Substitutions: replace infrastructure slots with cultural variants
        let subsApplied = 0;
        const maxSubs = culturalStrength < CULTURE_STRENGTH_MIN_FOR_ADDITIONS ? 1 : 3;
        for (const sub of baseline.substitutions) {
          if (subsApplied >= maxSubs) break;
          if (!tierAtOrBelow(tier, sub.replacement.minTier)) continue;
          // Remove the generic slot if it was added by infrastructure
          accumulated.delete(sub.replaces);
          addSublocation(sub.replacement.id, 'culture', sub.replacement.tags);
          subsApplied++;
        }

        // Additions: unique cultural sublocations (only if strength >= threshold)
        if (culturalStrength >= CULTURE_STRENGTH_MIN_FOR_ADDITIONS) {
          for (const add of baseline.additions) {
            if (tierAtOrBelow(tier, add.minTier)) {
              addSublocation(add.id, 'culture', add.tags);
            }
          }
        }

        // NPC roles
        for (const npc of baseline.npcRoles) {
          if (tierAtOrBelow(tier, npc.minTier)) {
            npcList.push({ role: npc.role, sourcePass: 'culture' });
          }
        }
      }
    }
  }

  // ── Pass 3: Spheres ──
  for (const [sphereKey, value] of Object.entries(sphereInfluence)) {
    if ((value ?? 0) < SPHERE_CONTRIBUTION_THRESHOLD) continue;
    const menu = SPHERE_SUBLOCATION_MENU[sphereKey as SphereName];
    if (!menu) continue;

    for (const sub of menu.sublocations) {
      if (tierAtOrBelow(tier, sub.minTier)) {
        addSublocation(sub.id, 'sphere', sub.tags);
      }
    }
    for (const npc of menu.npcRoles) {
      if (tierAtOrBelow(tier, npc.minTier)) {
        npcList.push({ role: npc.role, sourcePass: 'sphere' });
      }
    }
    // Strong sphere bonus: extra NPC
    if ((value ?? 0) >= SPHERE_STRONG_THRESHOLD && menu.npcRoles.length > 0) {
      const firstRole = menu.npcRoles[0];
      if (tierAtOrBelow(tier, firstRole.minTier)) {
        npcList.push({ role: firstRole.role, sourcePass: 'sphere' });
      }
    }
  }

  // Position modifier
  const posMod = POSITION_MODIFIERS[position];
  if (posMod) {
    for (const sub of posMod.bonusSublocations) {
      addSublocation(sub.id, 'sphere', sub.tags as SublocationTag[]);
    }
    for (const role of posMod.bonusNpcs) {
      npcList.push({ role, sourcePass: 'sphere' });
    }
  }

  // ── Pass 4: Reaches ──
  const reachProfile = input.reachOverrides
    ? { ...computeSettlementReaches(graph, locationId), ...input.reachOverrides }
    : computeSettlementReaches(graph, locationId);

  for (const [reachKey, value] of Object.entries(reachProfile)) {
    if ((value ?? 0) < REACH_CONTRIBUTION_THRESHOLD) continue;
    const menu = REACH_SUBLOCATION_MENU[reachKey as ReachDomain];
    if (!menu) continue;

    for (const sub of menu.sublocations) {
      if (tierAtOrBelow(tier, sub.minTier)) {
        addSublocation(sub.id, 'reach', sub.tags);
      }
    }
    for (const npc of menu.npcRoles) {
      if (tierAtOrBelow(tier, npc.minTier)) {
        npcList.push({ role: npc.role, sourcePass: 'reach' });
      }
    }
  }

  // ── Pass 5: Archetype Recognition ──
  const tagCounts = new Map<SublocationTag, number>();
  for (const entry of accumulated.values()) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  let matchedArchetype: typeof SETTLEMENT_ARCHETYPES[0] | null = null;
  for (const arch of [...SETTLEMENT_ARCHETYPES].sort((a, b) => b.priority - a.priority)) {
    const meets = arch.requiredTags.every(
      req => (tagCounts.get(req.tag) ?? 0) >= req.count,
    );
    if (meets) {
      matchedArchetype = arch;
      break;
    }
  }

  if (matchedArchetype) {
    for (const capId of matchedArchetype.capstoneSublocations) {
      addSublocation(capId, 'archetype', []);
    }
    for (const role of matchedArchetype.capstoneNpcs) {
      npcList.push({ role, sourcePass: 'archetype' });
    }
  }

  // ── NPC Budget Enforcement ──
  const budget = NPC_BUDGET[tier] ?? NPC_BUDGET.hamlet;
  const maxNpcs = Math.ceil(budget.base + accumulated.size * budget.perSublocation);
  const finalNpcs = npcList.slice(0, maxNpcs);

  // ── Build result ──
  const sublocations = Array.from(accumulated.entries()).map(([id, data]) => ({
    id,
    sourcePass: data.sourcePass as GenomeResult['sublocations'][0]['sourcePass'],
    tags: data.tags,
  }));

  return {
    sublocations,
    npcs: finalNpcs,
    archetypeId: matchedArchetype?.id ?? null,
    archetypeName: matchedArchetype?.name ?? null,
    archetypeProseFlavor: matchedArchetype?.proseFlavor ?? null,
    settlementReachProfile: reachProfile as Record<ReachDomain, number>,
  };
}

/** Compute settlement reach scores by aggregating reachWeights from factions at this location. */
export function computeSettlementReaches(
  graph: WorldGraph,
  locationId: string,
): Partial<Record<ReachDomain, number>> {
  const reaches: Partial<Record<ReachDomain, number>> = {};

  // Faction contributions via located_at edges (faction is located at this settlement)
  const locatedAtEdges = graph.getIncomingEdges(locationId, 'located_at');
  for (const edge of locatedAtEdges) {
    const actor = graph.getNode(edge.source);
    if (!actor || actor.properties.actorType !== 'faction') continue;
    const weights = actor.properties.reachWeights as Partial<Record<ReachDomain, number>> | undefined;
    if (!weights) continue;
    for (const [reach, weight] of Object.entries(weights)) {
      reaches[reach as ReachDomain] = (reaches[reach as ReachDomain] ?? 0) + (weight ?? 0);
    }
  }

  // Faction contributions via member_of edges (faction is a member of this location/group)
  const memberEdges = graph.getIncomingEdges(locationId, 'member_of');
  for (const edge of memberEdges) {
    const actor = graph.getNode(edge.source);
    if (!actor || actor.properties.actorType !== 'faction') continue;
    const weights = actor.properties.reachWeights as Partial<Record<ReachDomain, number>> | undefined;
    if (!weights) continue;
    for (const [reach, weight] of Object.entries(weights)) {
      reaches[reach as ReachDomain] = (reaches[reach as ReachDomain] ?? 0) + (weight ?? 0);
    }
  }

  // Normalize all values to 0–1 range so no single faction dominates absolutely
  const maxVal = Math.max(...Object.values(reaches).map(v => v ?? 0), 1);
  for (const key of Object.keys(reaches)) {
    reaches[key as ReachDomain] = (reaches[key as ReachDomain] ?? 0) / maxVal;
  }

  return reaches;
}
