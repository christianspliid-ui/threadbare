import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import type { MemberOfEdgeProperties } from '../types/disposition';
import type { FactionDefinition } from '../types/faction';
import { FACTION_DEFINITIONS } from '../data/faction-definitions';
import { computeRankFromReputation } from '../types/faction';
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';

export interface FactionNetworkLocation {
  id: string;
  name: string;
  subtype: string | null;
  isGovernanceSeat: boolean;
}

export interface FactionNetworkRelation {
  factionId: string;
  name: string;
  sentiment: number;
  label: string;
}

export interface FactionNetworkAmbition {
  id: string;
  name: string;
  priority: number;
  status: string;
}

export interface FactionNetworkMember {
  id: string;
  name: string;
  role: string;
  rankValue: number;
  rankLabel: string;
  reputation: number;
  locationId: string | null;
  locationName: string | null;
  locationSubtype: string | null;
  spotlightTier: string | null;
  npcRole: string | null;
  isArmy: boolean;
  isLeader: boolean;
  isOfficer: boolean;
}

export interface FactionNetworkSummary {
  factionId: string;
  name: string;
  factionType: string | null;
  definition: FactionDefinition | null;
  domainCapabilities: Record<ReachDomain, number>;
  reachPreferences: Record<ReachDomain, number>;
  dominantReaches: ReachDomain[];
  memberCount: number;
  armyCount: number;
  hallCount: number;
  controlledCount: number;
  leader: FactionNetworkMember | null;
  officers: FactionNetworkMember[];
  members: FactionNetworkMember[];
  armies: FactionNetworkMember[];
  halls: FactionNetworkLocation[];
  controlledLocations: FactionNetworkLocation[];
  governingSeats: FactionNetworkLocation[];
  relations: FactionNetworkRelation[];
  activeAmbition: FactionNetworkAmbition | null;
}

const GOVERNANCE_LOCATION_TYPES = new Set([
  'capital',
  'castle',
  'fort',
  'citadel',
  'palace',
]);

const LEADER_ROLE_HINTS = [
  'leader',
  'guild master',
  'guild_master',
  'marshal',
  'underking',
  'war chief',
  'war_chief',
  'captain',
  'commander',
  'noble',
  'steward',
  'herald',
  'high priest',
  'underboss',
];

const OFFICER_ROLE_HINTS = [
  'sergeant',
  'lieutenant',
  'captain',
  'commander',
  'guard_captain',
  'quartermaster',
  'steward',
  'herald',
  'priest',
  'underboss',
  'enforcer',
];

export function getFactionNodes(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('actor')
    .filter(node => node.properties.actorType === 'faction');
}

export function getFactionDefinitionForNode(node: GraphNode): FactionDefinition | null {
  const defId = node.properties.factionDefId as string | undefined;
  return defId ? (FACTION_DEFINITIONS.get(defId) ?? null) : null;
}

export function getFactionNetworkSummary(
  graph: WorldGraph,
  factionId: string,
): FactionNetworkSummary | null {
  const factionNode = graph.getNode(factionId);
  if (!factionNode || factionNode.type !== 'actor' || factionNode.properties.actorType !== 'faction') {
    return null;
  }

  const definition = getFactionDefinitionForNode(factionNode);
  const members = graph.getIncomingEdges(factionId, 'member_of')
    .map(edge => buildMemberEntry(graph, edge.source, edge.properties as Partial<MemberOfEdgeProperties>, definition))
    .filter((entry): entry is FactionNetworkMember => entry != null);

  const sortedMembers = [...members].sort((a, b) => leadershipScore(b) - leadershipScore(a));
  const leaderId = sortedMembers.find(member => !member.isArmy)?.id ?? null;

  const normalizedMembers = sortedMembers.map(member => ({
    ...member,
    isLeader: leaderId === member.id,
    isOfficer: false,
  }));

  const officers = normalizedMembers
    .filter(member => !member.isArmy && member.id !== leaderId)
    .filter(member => isOfficerLike(member) || member.reputation >= 0.35)
    .slice(0, 4)
    .map(member => ({ ...member, isOfficer: true }));

  const officerIds = new Set(officers.map(member => member.id));
  const decoratedMembers = normalizedMembers.map(member => ({
    ...member,
    isOfficer: officerIds.has(member.id),
  }));

  const halls = collectFactionLocations(graph, factionId, true);
  const controlledLocations = collectFactionLocations(graph, factionId, false);
  const governingSeats = uniqueLocations([...halls, ...controlledLocations])
    .filter(location => location.isGovernanceSeat);

  const relations = graph.getOutgoingEdges(factionId, 'relates_to')
    .map(edge => buildRelationEntry(graph, edge.target, edge.properties.sentiment as number | undefined))
    .filter((entry): entry is FactionNetworkRelation => entry != null)
    .sort((a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment));

  const activeAmbition = graph.getOutgoingEdges(factionId, 'pursues')
    .map(edge => {
      const ambitionNode = graph.getNode(edge.target);
      if (!ambitionNode) return null;
      return {
        id: ambitionNode.id,
        name: ambitionNode.name,
        priority: (edge.properties.priority as number) ?? 0,
        status: (edge.properties.status as string) ?? 'active',
      } satisfies FactionNetworkAmbition;
    })
    .filter((entry): entry is FactionNetworkAmbition => entry != null)
    .sort((a, b) => b.priority - a.priority)[0] ?? null;

  const domainCapabilities = normalizeDomainValues(
    factionNode.properties.domainCapabilities as Partial<Record<ReachDomain, number>> | undefined,
  );
  const reachPreferences = normalizeDomainValues(
    factionNode.properties.reachPreferences as Partial<Record<ReachDomain, number>> | undefined,
  );
  const dominantReaches = [...REACH_DOMAINS]
    .sort((a, b) => (domainCapabilities[b] ?? 0) - (domainCapabilities[a] ?? 0))
    .filter(domain => (domainCapabilities[domain] ?? 0) > 0)
    .slice(0, 4);

  return {
    factionId,
    name: factionNode.name,
    factionType: (factionNode.properties.factionType as string | undefined) ?? definition?.factionType ?? null,
    definition,
    domainCapabilities,
    reachPreferences,
    dominantReaches,
    memberCount: decoratedMembers.filter(member => !member.isArmy).length,
    armyCount: decoratedMembers.filter(member => member.isArmy).length,
    hallCount: halls.length,
    controlledCount: controlledLocations.length,
    leader: decoratedMembers.find(member => member.isLeader && !member.isArmy) ?? null,
    officers,
    members: decoratedMembers.filter(member => !member.isArmy),
    armies: decoratedMembers.filter(member => member.isArmy),
    halls,
    controlledLocations,
    governingSeats,
    relations,
    activeAmbition,
  };
}

function normalizeDomainValues(
  values: Partial<Record<ReachDomain, number>> | undefined,
): Record<ReachDomain, number> {
  const normalized = {} as Record<ReachDomain, number>;
  for (const domain of REACH_DOMAINS) {
    normalized[domain] = values?.[domain] ?? 0;
  }
  return normalized;
}

function buildMemberEntry(
  graph: WorldGraph,
  memberId: string,
  props: Partial<MemberOfEdgeProperties>,
  definition: FactionDefinition | null,
): FactionNetworkMember | null {
  const node = graph.getNode(memberId);
  if (!node || node.type !== 'actor') return null;

  const locationEdge = graph.getOutgoingEdges(memberId, 'located_at')[0];
  const locationNode = locationEdge ? graph.getNode(locationEdge.target) : undefined;
  const reputation = props.reputation ?? 0;
  const rank = definition
    ? computeRankFromReputation(reputation, definition)
    : null;

  return {
    id: memberId,
    name: node.name,
    role: ((props.role as string | undefined) ?? 'member').replace(/_/g, ' '),
    rankValue: typeof props.rank === 'number' ? props.rank : 0,
    rankLabel: rank?.name ?? ((props.role as string | undefined) ?? 'Member'),
    reputation,
    locationId: locationNode?.id ?? null,
    locationName: locationNode?.name ?? null,
    locationSubtype: (locationNode?.properties.locationSubtype as string | undefined)
      ?? (locationNode?.properties.locationType as string | undefined)
      ?? null,
    spotlightTier: (node.properties.spotlightTier as string | undefined) ?? null,
    npcRole: (node.properties.npcRole as string | undefined) ?? null,
    isArmy: node.properties.armyState != null || node.properties.actorType === 'group',
    isLeader: false,
    isOfficer: false,
  };
}

function collectFactionLocations(
  graph: WorldGraph,
  factionId: string,
  hallsOnly: boolean,
): FactionNetworkLocation[] {
  const locationEntries: FactionNetworkLocation[] = [];

  if (hallsOnly) {
    for (const edge of graph.getOutgoingEdges(factionId, 'located_at')) {
      if ((edge.properties.role as string | undefined) !== 'guild_hall') continue;
      const node = graph.getNode(edge.target);
      const entry = node ? toFactionLocation(node) : null;
      if (entry) locationEntries.push(entry);
    }

    for (const node of graph.getNodesByType('location')) {
      const nodeFactionId = node.properties.factionId as string | undefined;
      if (nodeFactionId !== factionId) continue;
      if (!node.properties.parentLocationId) continue;
      const parentId = node.properties.parentLocationId as string;
      const parentNode = graph.getNode(parentId);
      const entry = parentNode ? toFactionLocation(parentNode) : null;
      if (entry) locationEntries.push(entry);
    }
  } else {
    for (const edge of graph.getOutgoingEdges(factionId, 'controls')) {
      const node = graph.getNode(edge.target);
      if (!node || node.type !== 'location') continue;
      const entry = toFactionLocation(node);
      if (entry) locationEntries.push(entry);
    }
  }

  return uniqueLocations(locationEntries);
}

function uniqueLocations(entries: FactionNetworkLocation[]): FactionNetworkLocation[] {
  const seen = new Map<string, FactionNetworkLocation>();
  for (const entry of entries) {
    if (!seen.has(entry.id)) {
      seen.set(entry.id, entry);
    }
  }
  return [...seen.values()];
}

function toFactionLocation(node: GraphNode): FactionNetworkLocation | null {
  if (node.type !== 'location') return null;
  const subtype = (node.properties.locationSubtype as string | undefined)
    ?? (node.properties.locationType as string | undefined)
    ?? null;
  return {
    id: node.id,
    name: node.name,
    subtype,
    isGovernanceSeat: subtype != null && GOVERNANCE_LOCATION_TYPES.has(subtype),
  };
}

function buildRelationEntry(
  graph: WorldGraph,
  factionId: string,
  sentiment?: number,
): FactionNetworkRelation | null {
  const node = graph.getNode(factionId);
  if (!node || node.type !== 'actor' || node.properties.actorType !== 'faction') return null;
  const value = sentiment ?? 0;
  return {
    factionId,
    name: node.name,
    sentiment: value,
    label: relationLabel(value),
  };
}

function relationLabel(sentiment: number): string {
  if (sentiment >= 0.6) return 'Allied';
  if (sentiment >= 0.2) return 'Friendly';
  if (sentiment > -0.2) return 'Wary';
  if (sentiment > -0.6) return 'Hostile';
  return 'Enemy';
}

function leadershipScore(member: FactionNetworkMember): number {
  let score = member.reputation + member.rankValue;
  const roleText = `${member.role} ${member.rankLabel} ${member.npcRole ?? ''}`.toLowerCase();
  if (LEADER_ROLE_HINTS.some(hint => roleText.includes(hint))) score += 1.5;
  else if (OFFICER_ROLE_HINTS.some(hint => roleText.includes(hint))) score += 0.75;
  if (member.spotlightTier === 'spotlight') score += 0.2;
  if (member.spotlightTier === 'notable') score += 0.1;
  if (member.isArmy) score -= 1.5;
  return score;
}

function isOfficerLike(member: FactionNetworkMember): boolean {
  const roleText = `${member.role} ${member.rankLabel} ${member.npcRole ?? ''}`.toLowerCase();
  return OFFICER_ROLE_HINTS.some(hint => roleText.includes(hint))
    || LEADER_ROLE_HINTS.some(hint => roleText.includes(hint));
}
