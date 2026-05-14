/**
 * Dynamic Prose Enrichment — TB-035 Phase 5.
 *
 * System 8 from the Meet The First design doc. Makes every vignette
 * feel specific to THIS person in THIS world by querying the graph
 * at vignette generation time and injecting real world elements.
 *
 * Placeholder syntax:
 *   {name}              → agent name
 *   {artifact:weapon}   → notable weapon name, or fallback
 *   {ally:strongest}    → strongest ally name, or fallback
 *   {them}/{they}/{s}   → gendered pronouns (default: they/them)
 *   {location}          → current location name
 *   {?has_X}...{/has_X} → conditional block (rendered if condition true)
 *   {?no_X}...{/no_X}   → inverse conditional block
 */

import type { WorldGraph } from './graph';
import type { CampbellianPhase } from '../types/influence';
import type { MeetingChoiceRecord } from '../types/meetingEncounter';
import type { BeatOutcome } from '../types/journeyEngine';
import type { ReachDomain } from '../types/traits';
import type { DoomIdentityMatrix } from '../types/doomIdentity';
import type { GameState } from '../types/gameState';
import {
  getActorTraits,
  getAgentBonds,
  getAgentMemberships,
  getAgentLocation,
} from './graphQueries';
import {
  buildIntelligenceView,
  emitIntelligenceReferenced,
  reliabilityDescriptor,
  INTEL_CATEGORIES,
  type IntelligenceView,
} from './intelligence';
import { TICKS_PER_DAY } from '../data/attention-constants';

// ─── Constants ─────────────────────────────────────────────────────

/** Minimum artifact tier for mention in enrichment */
export const ENRICHMENT_ARTIFACT_MIN_TIER = 'storied';

/** Minimum trust for named ally */
export const ENRICHMENT_ALLY_MIN_TRUST = 0.5;

/** Maximum named allies per vignette */
export const ENRICHMENT_MAX_NAMED_ALLIES = 2;

/** Probability that journey vignette includes meeting callback */
export const CALLBACK_PROSE_PROBABILITY = 0.7;

// ─── Narrative Context ─────────────────────────────────────────────

/**
 * Full narrative context for prose enrichment.
 * Gathered from the graph at vignette generation time.
 */
export interface NarrativeContext {
  agentName: string;
  agentId: string;
  archetypeId: string;
  cultureName: string;
  primaryReach: ReachDomain;

  factionRank?: { factionName: string; rank: string };
  rulerOf?: { locationName: string };
  titles: string[];

  notableArtifacts: Array<{ name: string; tier: string; reach?: ReachDomain }>;
  strongAllies: Array<{ name: string; trust: number }>;
  rivals: Array<{ name: string; trust: number }>;

  currentLocationName: string;
  currentHexTerrain?: string;

  completedPhases: CampbellianPhase[];
  meetingChoiceRecord?: MeetingChoiceRecord;
  beatHistory: BeatOutcome[];

  /** Omen vocabulary injected from active omen tracks (THR-19) */
  omenAdj?: string;
  omenVerb?: string;
  omenNoun?: string;
  omenAtmosphere?: string;

  /** Doom identity vocabulary injected from the active doom archetype matrix (THR-21) */
  doomVerb?: string;
  doomAdj?: string;
  doomAtmosphere?: string;

  /** Gendered pronouns. Default: they/them/their */
  pronouns: { they: string; them: string; their: string; s: string };

  /** Intelligence records held by the agent (THR-113).
   * When present, enables `{intel:*}` placeholders and `{?knows_*}` / `{?no_*}`
   * conditional blocks. Omitted when caller doesn't have access to GameState. */
  intelligence?: IntelligenceView;

  /** Current tick — populated alongside `intelligence` for trace emission during
   * `enrichProse`. Silent fallback to 0 if not provided. */
  tick?: number;

  /** Causal predecessor — populated when this encounter was seeded by another (THR-116).
   * Enables `{cause:label}` and `{cause:ticksAgo}` placeholders. */
  cause?: { label: string; ticksAgo: number };
}

/**
 * Gather narrative context from the graph for a given agent.
 */
export function gatherNarrativeContext(
  graph: WorldGraph,
  agentId: string,
  meetingRecord?: MeetingChoiceRecord,
  beatHistory?: BeatOutcome[],
  doomIdentityMatrix?: DoomIdentityMatrix | null,
  state?: GameState,
  tick?: number,
): NarrativeContext {
  const agentNode = graph.getNode(agentId);
  const props = agentNode?.properties ?? {};

  // Culture
  const cultureEdges = graph.getOutgoingEdges(agentId, 'belongs_to');
  const cultureNode = cultureEdges.length > 0 ? graph.getNode(cultureEdges[0].target) : null;
  const cultureName = cultureNode?.name ?? 'unknown culture';

  // Location
  const location = getAgentLocation(graph, agentId);
  const currentLocationName = location?.name ?? 'the wilderness';

  // Artifacts (possesses edges, storied+ tier)
  const tierRanks: Record<string, number> = { common: 0, notable: 1, storied: 2, legendary: 3, mythic: 4 };
  const minTierRank = tierRanks[ENRICHMENT_ARTIFACT_MIN_TIER] ?? 2;
  const possessesEdges = graph.getOutgoingEdges(agentId, 'possesses');
  const notableArtifacts = possessesEdges
    .map(e => graph.getNode(e.target))
    .filter(n => n != null && (tierRanks[(n.properties.tier as string) ?? 'common'] ?? 0) >= minTierRank)
    .map(n => ({
      name: n!.name,
      tier: (n!.properties.tier as string) ?? 'storied',
      reach: n!.properties.reach as ReachDomain | undefined,
    }));

  // Bonds
  const bonds = getAgentBonds(graph, agentId);
  const strongAllies = bonds
    .filter(b => b.sentiment >= ENRICHMENT_ALLY_MIN_TRUST)
    .sort((a, b) => b.sentiment - a.sentiment)
    .slice(0, ENRICHMENT_MAX_NAMED_ALLIES)
    .map(b => ({ name: b.agent.name, trust: b.sentiment }));

  const rivals = bonds
    .filter(b => b.sentiment < -0.3)
    .sort((a, b) => a.sentiment - b.sentiment)
    .slice(0, ENRICHMENT_MAX_NAMED_ALLIES)
    .map(b => ({ name: b.agent.name, trust: b.sentiment }));

  // Faction rank
  const memberships = getAgentMemberships(graph, agentId);
  const leaderMembership = memberships.find(
    m => (m.edge.properties.role as string) === 'leader' || (m.edge.properties.rank as number) >= 3,
  );
  const factionRank = leaderMembership
    ? { factionName: leaderMembership.group.name, rank: (leaderMembership.edge.properties.role as string) ?? 'member' }
    : undefined;

  // Titles from traits
  const traits = getActorTraits(graph, agentId);
  const titles = traits
    .filter(t => t.trait.properties?.category === 'reputation')
    .map(t => t.trait.name)
    .slice(0, 3);

  // Completed phases from beat history
  const completedPhases = [...new Set((beatHistory ?? []).map(b => b.phase))];

  // Pronouns (default: they/them — can be overridden by flavor choices)
  const gender = (props.gender as string) ?? '';
  const pronouns = getPronouns(gender);

  // Doom identity prose vocabulary (THR-21) — deterministic pick per agent
  let doomVerb: string | undefined;
  let doomAdj: string | undefined;
  let doomAtmosphere: string | undefined;
  if (doomIdentityMatrix) {
    // Deterministic index: sum of agentId char codes mod pool length
    const idHash = agentId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const { verbs, adjectives, atmospheres } = doomIdentityMatrix.proseTone;
    if (verbs.length > 0)       doomVerb       = verbs[idHash % verbs.length];
    if (adjectives.length > 0)  doomAdj        = adjectives[idHash % adjectives.length];
    if (atmospheres.length > 0) doomAtmosphere = atmospheres[idHash % atmospheres.length];
  }

  // Intelligence view (THR-113) — only populated when caller passes GameState
  const intelligence = state ? buildIntelligenceView(state, agentId) : undefined;

  return {
    agentName: agentNode?.name ?? 'the mortal',
    agentId,
    archetypeId: meetingRecord?.archetypeId ?? (props.archetypeId as string) ?? '',
    cultureName,
    primaryReach: (props.primaryReach as ReachDomain) ?? 'iron',
    factionRank,
    titles,
    notableArtifacts,
    strongAllies,
    rivals,
    currentLocationName,
    completedPhases,
    meetingChoiceRecord: meetingRecord,
    beatHistory: beatHistory ?? [],
    pronouns,
    doomVerb,
    doomAdj,
    doomAtmosphere,
    intelligence,
    tick,
  };
}

// ─── Placeholder Resolution ────────────────────────────────────────

/**
 * Resolve all placeholders in a prose template using narrative context.
 */
export function enrichProse(template: string, ctx: NarrativeContext): string {
  let result = template;

  // Simple replacements
  result = result.replace(/{name}/g, ctx.agentName);
  result = result.replace(/{location}/g, ctx.currentLocationName);
  result = result.replace(/{culture}/g, ctx.cultureName);
  result = result.replace(/{they}/g, ctx.pronouns.they);
  result = result.replace(/{them}/g, ctx.pronouns.them);
  result = result.replace(/{their}/g, ctx.pronouns.their);
  result = result.replace(/{s}/g, ctx.pronouns.s);
  result = result.replace(/{They}/g, capitalize(ctx.pronouns.they));
  result = result.replace(/{Them}/g, capitalize(ctx.pronouns.them));
  result = result.replace(/{Their}/g, capitalize(ctx.pronouns.their));

  // Artifact references
  result = result.replace(/{artifact:weapon}/g,
    ctx.notableArtifacts.find(a => a.reach === 'iron')?.name ?? 'their weapon');
  result = result.replace(/{artifact:any}/g,
    ctx.notableArtifacts[0]?.name ?? 'a treasured possession');

  // Ally references
  result = result.replace(/{ally:strongest}/g,
    ctx.strongAllies[0]?.name ?? 'a trusted companion');
  result = result.replace(/{rival:strongest}/g,
    ctx.rivals[0]?.name ?? 'a bitter enemy');

  // Faction
  result = result.replace(/{faction}/g,
    ctx.factionRank?.factionName ?? 'their people');

  // Title
  result = result.replace(/{title}/g,
    ctx.titles[0] ?? ctx.agentName);

  // Omen vocabulary (THR-19) — resolve silently to empty string when no omen active
  result = result.replace(/{omen_adj}/g, ctx.omenAdj ?? '');
  result = result.replace(/{omen_verb}/g, ctx.omenVerb ?? '');
  result = result.replace(/{omen_noun}/g, ctx.omenNoun ?? '');
  result = result.replace(/{omen_atmosphere}/g, ctx.omenAtmosphere ?? '');

  // Doom identity vocabulary (THR-21) — resolve silently to empty string when no matrix loaded
  result = result.replace(/{doom_verb}/g, ctx.doomVerb ?? '');
  result = result.replace(/{doom_adj}/g, ctx.doomAdj ?? '');
  result = result.replace(/{doom_atmosphere}/g, ctx.doomAtmosphere ?? '');

  // Intelligence placeholders (THR-113) — silent fallback to '' when no view.
  // Only emit `intelligence_referenced` when a placeholder for that category
  // was actually present in the source — otherwise every enrichProse call on
  // a template with zero {intel:*} tokens would log a false consumption.
  if (ctx.intelligence) {
    const referenced = new Set<string>();
    for (const category of INTEL_CATEGORIES) {
      const record = ctx.intelligence.byCategory[category];
      const detailRe = new RegExp(`\\{intel:${category}\\.detail\\}`, 'g');
      const reliabilityRe = new RegExp(`\\{intel:${category}\\.reliability\\}`, 'g');
      const labelRe = new RegExp(`\\{intel:${category}\\}`, 'g');
      const acquiredTicksAgoRe = new RegExp(`\\{intel:${category}\\.acquiredTicksAgo\\}`, 'g');
      const acquiredDaysAgoRe = new RegExp(`\\{intel:${category}\\.acquiredDaysAgo\\}`, 'g');
      const hadPlaceholder =
        detailRe.test(result) || reliabilityRe.test(result) || labelRe.test(result) ||
        acquiredTicksAgoRe.test(result) || acquiredDaysAgoRe.test(result);
      const label = record?.label ?? '';
      const detail = record?.detail ?? '';
      const reliability = record ? reliabilityDescriptor(record.reliability) : '';
      result = result.replace(new RegExp(`\\{intel:${category}\\.detail\\}`, 'g'), detail);
      result = result.replace(new RegExp(`\\{intel:${category}\\.reliability\\}`, 'g'), reliability);
      result = result.replace(new RegExp(`\\{intel:${category}\\}`, 'g'), label);
      // Age placeholders (THR-385). Silent strip when record absent.
      const ticksAgo = record ? Math.max(0, (ctx.tick ?? 0) - record.acquiredTick) : 0;
      const daysAgo = Math.floor(ticksAgo / TICKS_PER_DAY);
      result = result.replace(
        new RegExp(`\\{intel:${category}\\.acquiredTicksAgo\\}`, 'g'),
        record ? String(ticksAgo) : '',
      );
      result = result.replace(
        new RegExp(`\\{intel:${category}\\.acquiredDaysAgo\\}`, 'g'),
        record ? String(daysAgo) : '',
      );
      if (hadPlaceholder && record && !referenced.has(record.recordId)) {
        emitIntelligenceReferenced(
          ctx.tick ?? 0,
          ctx.agentId,
          record.recordId,
          'prose_enrichment',
          { intelCategory: category },
        );
        referenced.add(record.recordId);
      }
    }
  }
  // Residual strip: any unknown / malformed {intel:*} tokens (including
  // {intel:typo} or calls without an intelligence view) never leak to players.
  result = result.replace(/\{intel:[^}]+\}/g, '');

  // Causal predecessor placeholders (THR-116) — {cause:label}, {cause:ticksAgo}.
  if (ctx.cause) {
    result = result.replace(/\{cause:label\}/g, ctx.cause.label);
    result = result.replace(/\{cause:ticksAgo\}/g, String(ctx.cause.ticksAgo));
  }
  // Residual strip: {cause:*} tokens when no cause context — never leak raw tokens.
  result = result.replace(/\{cause:[^}]+\}/g, '');

  // Conditional blocks: {?has_X}...{/has_X} and {?no_X}...{/no_X}
  result = resolveConditionals(result, ctx);

  return result;
}

/**
 * Resolve conditional blocks in prose.
 */
function resolveConditionals(prose: string, ctx: NarrativeContext): string {
  let result = prose;

  // Build condition map
  const conditions: Record<string, boolean> = {
    has_artifact: ctx.notableArtifacts.length > 0,
    no_artifact: ctx.notableArtifacts.length === 0,
    has_ally: ctx.strongAllies.length > 0,
    no_ally: ctx.strongAllies.length === 0,
    has_rival: ctx.rivals.length > 0,
    no_rival: ctx.rivals.length === 0,
    has_faction: ctx.factionRank != null,
    no_faction: ctx.factionRank == null,
    has_title: ctx.titles.length > 0,
    no_title: ctx.titles.length === 0,
  };

  // Intelligence conditionals (THR-113) — {?knows_<category>} / {?no_<category>}.
  // When ctx.intelligence is absent, all knows_* evaluate false and no_* evaluate true.
  for (const category of INTEL_CATEGORIES) {
    const has = ctx.intelligence?.flags[category] === true;
    conditions[`knows_${category}`] = has;
    conditions[`no_${category}`] = !has;
  }

  // Resolve {?condition}...{/condition} blocks
  for (const [key, value] of Object.entries(conditions)) {
    const regex = new RegExp(`\\{\\?${key}\\}([\\s\\S]*?)\\{/${key}\\}`, 'g');
    result = result.replace(regex, value ? '$1' : '');
  }

  return result;
}

// ─── Meeting Callback Prose ────────────────────────────────────────

/**
 * Generate a callback reference to the meeting encounter.
 * Returns a prose snippet that echoes a meeting choice in the current context.
 */
export function generateMeetingCallback(
  ctx: NarrativeContext,
  rng: () => number,
): string | null {
  if (!ctx.meetingChoiceRecord) return null;
  if (rng() > CALLBACK_PROSE_PROBABILITY) return null;

  const record = ctx.meetingChoiceRecord;
  const callbacks = MEETING_CALLBACKS[record.intentPrimaryReach];
  if (!callbacks || callbacks.length === 0) return null;

  const index = Math.floor(rng() * callbacks.length);
  return callbacks[index].replace(/{name}/g, ctx.agentName);
}

/**
 * Meeting callback templates by primary reach.
 * Short echoes of the founding moment, used in journey vignettes.
 */
const MEETING_CALLBACKS: Partial<Record<ReachDomain, string[]>> = {
  iron: [
    '{name} grips the hilt the way they gripped that first weapon — tight, certain, like it was always meant to be there.',
    'The same fire that burned in them at the beginning burns now, only bigger.',
    'You remember the blade-smith\'s forge where it all began. {name} has become the blade.',
  ],
  heart: [
    'The same voice that first moved a crowd now commands armies — or whispers to one.',
    '{name} speaks, and you remember the first time those words changed someone\'s mind.',
    'That gift for connection, visible from the very first day, has only deepened.',
  ],
  eye: [
    '{name}\'s gaze is sharper now than when you first opened their eyes to the hidden world.',
    'You remember what they couldn\'t see, once. Now they see everything.',
    'The perception you seeded has grown into something almost frightening in its clarity.',
  ],
  shadow: [
    '{name} moves through the world like a ghost — just as you intended when you first found them.',
    'The subtlety was always there. You just... refined it.',
    'They vanish into shadows the way they vanished from their old life — completely.',
  ],
  veil: [
    'The magic comes easily now, as natural as breathing. You remember when it was a spark.',
    '{name} reaches for power the way they reached for it the first time — but now, it answers.',
    'The hidden world that once terrified them is now their domain.',
  ],
  stone: [
    '{name}\'s hands still bear the calluses from that first act of creation.',
    'You shaped them. They shape the world. The symmetry pleases you.',
    'From raw material to master builder — the transformation is complete.',
  ],
  star: [
    'The divine spark you planted burns brighter than ever.',
    '{name} reaches toward the heavens, and you remember being the first heaven they touched.',
    'Faith became power. Power became purpose. Purpose became destiny.',
  ],
  gold: [
    'The wealth flows like a river now, but you remember the first coin.',
    '{name} counts allies the way they once counted coppers — with careful precision.',
    'From nothing to empire. The golden thread you wove did its work.',
  ],
  flesh: [
    'The body you found has become a weapon.',
    '{name} endures everything now. You remember when they couldn\'t endure anything.',
    'Survival was the first lesson. It remains the deepest.',
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────

function getPronouns(gender: string): { they: string; them: string; their: string; s: string } {
  switch (gender.toLowerCase()) {
    case 'male':
    case 'm':
      return { they: 'he', them: 'him', their: 'his', s: 's' };
    case 'female':
    case 'f':
      return { they: 'she', them: 'her', their: 'her', s: 's' };
    default:
      return { they: 'they', them: 'them', their: 'their', s: '' };
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
