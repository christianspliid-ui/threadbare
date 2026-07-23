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
import type { OutcomeBand } from './outcomeConsequences';
import type { SimulationRuntime } from './simulationRuntime';
import {
  getActorTraits,
  getAgentBonds,
  getAgentMemberships,
  getAgentLocation,
} from './graphQueries';
import type { EncounterSupportBinding, EncounterSupportBundle } from '../types/encounter';
import type { ContextFragmentSet } from '../types/unifiedAction';
import { resolveFragment, type BoundFragmentAxes } from './fragmentResolution';
import { ALLY_SENTIMENT_THRESHOLD, ENEMY_SENTIMENT_THRESHOLD } from '../data/effect-constants';
import {
  buildIntelligenceView,
  emitIntelligenceReferenced,
  reliabilityDescriptor,
  INTEL_CATEGORIES,
  type IntelligenceView,
} from './intelligence';
import { TICKS_PER_DAY } from '../data/attention-constants';
import {
  OUTCOME_BAND_PROSE,
  OUTCOME_BAND_Q_FLAVOR,
  OUTCOME_BAND_PHRASE_HISTORY_WINDOW,
} from '../data/outcome-band-content';
import { pickWithRepetitionGuard } from './proseSelection';
import { emitTrace } from './traceBuffer';
import { resolveEconomicMood } from './economicContext';

// ─── Constants ─────────────────────────────────────────────────────

/** Minimum artifact tier for mention in enrichment */
export const ENRICHMENT_ARTIFACT_MIN_TIER = 'storied';

/** Minimum trust for named ally */
export const ENRICHMENT_ALLY_MIN_TRUST = 0.5;

/** Maximum named allies per vignette */
export const ENRICHMENT_MAX_NAMED_ALLIES = 2;

/** Probability that journey vignette includes meeting callback */
export const CALLBACK_PROSE_PROBABILITY = 0.7;

/** Maximum cast entries injected into NarrativeContext (THR-696 — enrichment perf) */
export const CAST_CONTEXT_MAX_MEMBERS = 6;

// ─── Narrative Context ─────────────────────────────────────────────

/**
 * Scene target context (THR-694) — the entity an encounter action is *with*: the
 * resolved `action.targetId`, which is another agent or a location. Populated only on
 * the encounter-prose paths; absent for self-targeted actions, missing/deleted targets,
 * and all non-encounter prose — so `{target}` reads as "the other party" and never
 * infers a referent. Enables the `{target}` / `{target:they|them|their|s}` /
 * `{target:faction}` placeholders and the `{?target_is_ally|rival|stranger}` /
 * `{?has_target}` / `{?no_target}` conditionals in `enrichProse`.
 */
export interface SceneTargetContext {
  id: string;
  kind: 'agent' | 'location';
  name: string;
  /** Agent-kind targets only; location-kind targets omit this. */
  pronouns?: { they: string; them: string; their: string; s: string };
  /** Agent-kind targets only. */
  factionName?: string;
  /** Actor→target relation from the outgoing `relates_to` sentiment; agent-kind only. */
  relation?: 'ally' | 'rival' | 'stranger';
}

/**
 * One member of the encounter's support cast (THR-696) — a `supportBundle` spec key
 * resolved for prose. `name` is the *bound* entity's live graph name when the bundle
 * bound one (so reuse-first NPCs are named correctly), and the spec's authored
 * `spawnName`/`fallbackName` when the key is declared but unbound. `reused` mirrors the
 * binding's own flag (false when the key is unbound).
 */
export interface SceneCastMember {
  name: string;
  /** `supportRole` for actor specs, `sublocationTypeId` for location specs. */
  role: string;
  reused: boolean;
}

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

  /** Outcome band for band-flavored phrase injection (THR-460).
   * Enables `{outcome_phrase}` and `{q_flavor}` placeholders.
   * Populated by callers that have a resolved step outcome (UI adapters, engine resolvers). */
  outcomeBand?: OutcomeBand;

  /** Name of a bound subject group injected by the caller (THR-522). Enables the `{group}`
   * placeholder so an Ascendant introduction beat can name the specific generated
   * culture/faction the Director bound at offer time, instead of generic phrasing. Absent →
   * `{group}` resolves to a neutral fallback. Distinct from `{culture}`/`{faction}`, which
   * resolve the *anchor agent's* own culture/faction, not an arbitrary bound group. */
  boundGroupName?: string;

  /** Scene target (THR-694) — the entity the encounter is *with*. Absent → the
   * `{target:*}` placeholders and `{?*_target}` conditionals fall back to "no other
   * party". See {@link SceneTargetContext}. Populated by encounter-path callers that
   * pass `opts.targetId`. */
  target?: SceneTargetContext;

  /** Scene cast (THR-696) — the encounter's support-bundle keys, keyed by spec key.
   * Every key the template *declares* appears here (bound or not), so `{cast:<key>}`
   * always resolves for a declared key. Absent → `{cast:*}` tokens strip and
   * `{?has_cast:<key>}` blocks resolve false. See {@link SceneCastMember}. */
  cast?: Record<string, SceneCastMember>;

  /** Context-fragment tables of the template being rendered (THR-573). Absent →
   * `{frag:*}` tokens strip silently, exactly as `{intel:*}` does without a view.
   * Threaded by encounter-path callers via `opts.contextFragments`. */
  contextFragments?: readonly ContextFragmentSet[];

  /** Template id for fragment warn-once attribution (THR-573). Diagnostics only. */
  contextFragmentTemplateId?: string;

  /** `place` identity axis (THR-573) — the `sublocationTypeId` the scene plays out in.
   * Derived at context build from the agent's location resolution. Absent → `'*'` path. */
  sublocationTypeId?: string;

  /** `counterpartRole` identity axis (THR-573) — the scene target's `npcRole`.
   * Derived at context build from the target node. Absent → `'*'` path. */
  targetRole?: string;

  /** Economic mood vocabulary (THR-725) — boom/bust coloration for the settlement the scene
   * plays out in, enabling `{econ_adj}` / `{econ_noun}` / `{econ_atmosphere}`. Derived at
   * context build from the location this builder already resolved, so no caller threads a
   * new parameter. Absent inside the neutral prosperity band → the tokens strip silently,
   * exactly as `{intel:*}` does without a view. Coloration, not an identity axis: it varies
   * how a scene reads without making it a different surface, so it stays out of
   * `computeSurfaceKey`. */
  econAdj?: string;
  econNoun?: string;
  econAtmosphere?: string;
}

/**
 * Resolve the scene-cast block (THR-696) from a template's support bundle and the
 * action's resolved bindings.
 *
 * Every declared spec key enters the map — bound keys carry the *bound* node's live
 * name (so a reuse-first binding names the real NPC rather than the authored
 * placeholder), unbound keys fall back to the spec's own authored name. That
 * invariant is what lets `{cast:<key>}` always resolve for a key the template
 * declares, so authored prose never has to guard a reference to its own cast.
 * Capped at {@link CAST_CONTEXT_MAX_MEMBERS}. Returns undefined for an empty bundle.
 */
export function resolveSceneCastContext(
  graph: WorldGraph,
  supportBundle: EncounterSupportBundle | undefined,
  bindings: readonly EncounterSupportBinding[] | undefined,
): Record<string, SceneCastMember> | undefined {
  if (!supportBundle || supportBundle.length === 0) return undefined;

  const cast: Record<string, SceneCastMember> = {};
  for (const spec of supportBundle) {
    if (Object.keys(cast).length >= CAST_CONTEXT_MAX_MEMBERS) break;
    if (spec.delivery === 'blocked-primitive') continue;

    const authoredName = spec.kind === 'actor' ? spec.spawnName : spec.fallbackName;
    const role = spec.kind === 'actor' ? spec.supportRole : spec.sublocationTypeId;

    const binding = bindings?.find(b => b.key === spec.key);
    const boundName = binding ? graph.getNode(binding.nodeId)?.name : undefined;

    cast[spec.key] = {
      name: boundName ?? authoredName ?? spec.key,
      role,
      reused: binding?.reused ?? false,
    };
  }

  return Object.keys(cast).length > 0 ? cast : undefined;
}

/**
 * Resolve the scene-target block (THR-694) for an actor→target pair.
 *
 * Returns undefined when there is no distinct other party — a missing or self target
 * (`targetId === actorId`), or a target whose node has been deleted — so `{target}`
 * reads as absence and never invents a referent. Agent-kind targets carry pronouns, a
 * faction name, and an actor→target `relation` classified via the shared
 * ALLY/ENEMY sentiment thresholds (no edge → 'stranger'); location-kind targets carry
 * name only.
 */
export function resolveSceneTargetContext(
  graph: WorldGraph,
  actorId: string,
  targetId: string | undefined,
): SceneTargetContext | undefined {
  if (!targetId || targetId === actorId) return undefined;
  const node = graph.getNode(targetId);
  if (!node) return undefined;

  const kind: 'agent' | 'location' = node.type === 'location' ? 'location' : 'agent';
  if (kind === 'location') {
    return { id: targetId, kind, name: node.name ?? 'that place' };
  }

  const pronouns = getPronouns((node.properties?.gender as string) ?? '');
  const factionName = getAgentMemberships(graph, targetId)[0]?.group.name;

  // Actor→target relation from the outgoing relates_to edge sentiment. Reuses the same
  // ±0.35 thresholds as the alone/outnumbered co-location classifier (no new tunable).
  // Absence of an edge is a neutral acquaintance → 'stranger'.
  const bond = getAgentBonds(graph, actorId).find(b => b.agent.id === targetId);
  let relation: 'ally' | 'rival' | 'stranger' = 'stranger';
  if (bond) {
    if (bond.sentiment >= ALLY_SENTIMENT_THRESHOLD) relation = 'ally';
    else if (bond.sentiment <= ENEMY_SENTIMENT_THRESHOLD) relation = 'rival';
  }

  return { id: targetId, kind, name: node.name ?? 'the other party', pronouns, factionName, relation };
}

/**
 * Gather narrative context from the graph for a given agent.
 *
 * `opts.targetId` (THR-694) populates the scene `target` block when it resolves to a
 * distinct node — omitted for self-targeted actions. `opts.supportBundle` +
 * `opts.supportBindings` (THR-696) populate the scene `cast` block. Callers on the
 * encounter path (`buildUnifiedEncounterStageModel`, `unifiedActionResolution`) pass the
 * active action's `targetId` and its template's bundle plus the action's resolved
 * bindings; all other callers leave them absent and get today's behavior.
 */
export function gatherNarrativeContext(
  graph: WorldGraph,
  agentId: string,
  meetingRecord?: MeetingChoiceRecord,
  beatHistory?: BeatOutcome[],
  doomIdentityMatrix?: DoomIdentityMatrix | null,
  state?: GameState,
  tick?: number,
  opts?: {
    targetId?: string;
    supportBundle?: EncounterSupportBundle;
    supportBindings?: readonly EncounterSupportBinding[];
    /** THR-573 — the rendering template's fragment tables and id, for `{frag:*}`. */
    contextFragments?: readonly ContextFragmentSet[];
    contextFragmentTemplateId?: string;
  },
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

  // Economic mood (THR-725) — null inside the neutral prosperity band.
  const economicMood = resolveEconomicMood(graph, location?.id);

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
    target: resolveSceneTargetContext(graph, agentId, opts?.targetId),
    cast: resolveSceneCastContext(graph, opts?.supportBundle, opts?.supportBindings),
    contextFragments: opts?.contextFragments,
    contextFragmentTemplateId: opts?.contextFragmentTemplateId,
    // Identity axes (THR-573). Both are read from state the context builder already
    // resolved, so no caller threads a new required parameter; absent → the '*' path.
    sublocationTypeId: (location?.properties?.sublocationTypeId as string | undefined) ?? undefined,
    targetRole: opts?.targetId
      ? ((graph.getNode(opts.targetId)?.properties?.npcRole as string | undefined) ?? undefined)
      : undefined,
    // Economic mood (THR-725) — read off the location already resolved above, walking one
    // tier up when the agent stands in a sublocation. Neutral band → all three stay absent.
    ...(economicMood
      ? {
          econAdj: economicMood.adj,
          econNoun: economicMood.noun,
          econAtmosphere: economicMood.atmosphere,
        }
      : {}),
  };
}

// ─── Outcome Band Phrase Helper ────────────────────────────────────

/**
 * Resolve one occurrence of `placeholder` in `result` using a band-keyed phrase pool.
 * Uses pickWithRepetitionGuard when runtime is available; falls back to pool[0] otherwise.
 * Emits an outcome_band_prose_selected trace on each successful pick.
 */
function resolveBandPhrase(
  result: string,
  placeholder: string,
  pool: Record<string, import('../engine/proseSelection').PhraseEntry[]>,
  ctx: NarrativeContext,
  opts?: { runtime?: SimulationRuntime; rng?: () => number },
): string {
  const re = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
  if (!re.test(result)) return result;
  // Re-create the regex because .test() consumed it
  const replaceRe = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');

  const band = ctx.outcomeBand!;
  const entries = pool[band] ?? [];
  if (entries.length === 0) return result.replace(replaceRe, '');

  const phraseTable = placeholder === '{outcome_phrase}' ? 'outcome_phrase' : 'q_flavor';
  const runtime = opts?.runtime;
  const rng = opts?.rng ?? Math.random;

  let picked: import('../engine/proseSelection').PhraseEntry;

  if (runtime) {
    const historyKey = ctx.agentId + (phraseTable === 'q_flavor' ? '__q' : '');
    if (!runtime.outcomeBandPhraseHistory.has(historyKey)) {
      runtime.outcomeBandPhraseHistory.set(historyKey, new Set());
    }
    const usedIds = runtime.outcomeBandPhraseHistory.get(historyKey)!;
    picked = pickWithRepetitionGuard(entries, rng, usedIds);
    if (usedIds.size > OUTCOME_BAND_PHRASE_HISTORY_WINDOW) {
      const oldest = usedIds.values().next().value;
      if (oldest !== undefined) usedIds.delete(oldest);
    }
  } else {
    picked = entries[0];
  }

  emitTrace({
    category: 'outcome_band_prose_selected',
    tick: ctx.tick ?? 0,
    agentId: ctx.agentId,
    band,
    phraseId: picked.phraseId,
    phraseTable,
    summary: `outcome_band_prose[${phraseTable}]: ${band} → ${picked.phraseId}`,
  });

  return result.replace(replaceRe, picked.text);
}

// ─── Placeholder Resolution ────────────────────────────────────────

/**
 * Resolve all placeholders in a prose template using narrative context.
 *
 * opts.runtime — SimulationRuntime holding the per-actor phrase dedup history.
 *   Required for {outcome_phrase} / {q_flavor} repetition guarding; without it,
 *   the first pool entry is used deterministically (fail-soft, never throws).
 * opts.rng — Seeded PRNG for phrase selection. Falls back to Math.random when absent.
 */
export function enrichProse(
  template: string,
  ctx: NarrativeContext,
  opts?: { runtime?: SimulationRuntime; rng?: () => number },
): string {
  let result = template;

  // Context fragments (THR-573) — `{frag:<slot>}` splices an authored variant chosen by
  // the scene's identity axes (place / counterpart role). This runs FIRST, before every
  // other token, so tokens *inside* a fragment ({name}, {target}, {cast:*}) are resolved
  // by the rest of this pipeline exactly as if they had been written inline.
  // A declared slot always resolves (bound variant, else the '*' default), so authored
  // prose can reference its own slots unguarded. An undeclared slot or a table missing
  // its default is an authoring error: strip the token, warn once per template — never
  // per render — and let the rest of the paragraph stand.
  if (/\{frag:/.test(result)) {
    const boundAxes: BoundFragmentAxes = {
      place: ctx.sublocationTypeId ?? null,
      counterpartRole: ctx.targetRole ?? null,
    };
    result = result.replace(/\{frag:([A-Za-z0-9_.-]+)\}/g, (_match, slot: string) => {
      const binding = resolveFragment(
        ctx.contextFragments,
        slot,
        boundAxes,
        ctx.contextFragmentTemplateId,
      );
      return binding?.text ?? '';
    });
    // Residual strip: malformed {frag:*} tokens (e.g. spaces in the slot) never leak.
    result = result.replace(/\{frag:[^}]*\}/g, '');
  }

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

  // Scene target (THR-694) — the entity the encounter is *with*. Every token carries a
  // fallback so absence reads as absence ("the other party") and no raw token leaks.
  // Colon-form tokens are resolved (and residually stripped) before the bare `{target}`,
  // which has no colon and is never matched by the colon patterns.
  const tgt = ctx.target;
  const tgtP = tgt?.pronouns;
  result = result.replace(/\{target:faction\}/g, tgt?.factionName ?? 'their people');
  result = result.replace(/\{target:They\}/g, capitalize(tgtP?.they ?? 'they'));
  result = result.replace(/\{target:Them\}/g, capitalize(tgtP?.them ?? 'them'));
  result = result.replace(/\{target:Their\}/g, capitalize(tgtP?.their ?? 'their'));
  result = result.replace(/\{target:they\}/g, tgtP?.they ?? 'they');
  result = result.replace(/\{target:them\}/g, tgtP?.them ?? 'them');
  result = result.replace(/\{target:their\}/g, tgtP?.their ?? 'their');
  result = result.replace(/\{target:s\}/g, tgtP?.s ?? '');
  // Residual strip: unknown {target:*} tokens never leak (matches only the colon form).
  result = result.replace(/\{target:[^}]+\}/g, '');
  result = result.replace(/\{target\}/g, tgt?.name ?? 'the other party');

  // Scene cast (THR-696) — `{cast:<key>}` names a support-bundle member. A declared key
  // always resolves (bound name, else the spec's authored name), so authored prose can
  // reference its own cast unguarded. An *undeclared* key is an authoring error, not a
  // runtime state: strip the token and warn in dev only.
  // A *missing block* is a caller that did not thread a bundle (every non-encounter path)
  // — strip silently, same as `{intel:*}` without a view. Only a key missing from a block
  // that exists is the authoring error worth warning about.
  result = result.replace(/\{cast:([A-Za-z0-9_.-]+)\}/g, (_match, key: string) => {
    const member = ctx.cast?.[key];
    if (member) return member.name;
    if (ctx.cast && import.meta.env?.DEV) {
      console.warn(`[enrichProse] {cast:${key}} — no such key in this encounter's support bundle.`);
    }
    return '';
  });
  // Residual strip: malformed {cast:*} tokens (e.g. spaces in the key) never leak.
  result = result.replace(/\{cast:[^}]*\}/g, '');

  // Bound subject group (THR-522) — the specific culture/faction an Ascendant introduction
  // beat surfaces. Resolves to the Director-bound name when present, else a neutral fallback
  // so unbound/fail-soft offers never leak a raw token.
  result = result.replace(/{group}/g,
    ctx.boundGroupName ?? 'a people you have not yet named');

  // Title
  result = result.replace(/{title}/g,
    ctx.titles[0] ?? ctx.agentName);

  // Omen vocabulary (THR-19) — resolve silently to empty string when no omen active
  result = result.replace(/{omen_adj}/g, ctx.omenAdj ?? '');
  result = result.replace(/{omen_verb}/g, ctx.omenVerb ?? '');
  result = result.replace(/{omen_noun}/g, ctx.omenNoun ?? '');
  result = result.replace(/{omen_atmosphere}/g, ctx.omenAtmosphere ?? '');

  // Doom identity vocabulary (THR-21) — resolve silently to empty string when no matrix loaded
  // Economic mood (THR-725) — boom/bust coloration. Absent inside the neutral band, so the
  // tokens strip and the sentence stands as authored.
  result = result.replace(/{econ_adj}/g, ctx.econAdj ?? '');
  result = result.replace(/{econ_noun}/g, ctx.econNoun ?? '');
  result = result.replace(/{econ_atmosphere}/g, ctx.econAtmosphere ?? '');

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

  // Outcome band phrases (THR-460) — {outcome_phrase} and {q_flavor}.
  // Requires ctx.outcomeBand; silently strips when absent (fail-soft).
  if (ctx.outcomeBand) {
    result = resolveBandPhrase(result, '{outcome_phrase}', OUTCOME_BAND_PROSE, ctx, opts);
    result = resolveBandPhrase(result, '{q_flavor}', OUTCOME_BAND_Q_FLAVOR, ctx, opts);
  } else {
    result = result.replace(/\{outcome_phrase\}/g, '');
    result = result.replace(/\{q_flavor\}/g, '');
  }

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
    // Scene target (THR-694). A location-kind target is present (has_target true) but
    // carries no relation, so all three relation conditionals resolve false for it.
    has_target: ctx.target != null,
    no_target: ctx.target == null,
    target_is_ally: ctx.target?.relation === 'ally',
    target_is_rival: ctx.target?.relation === 'rival',
    target_is_stranger: ctx.target?.relation === 'stranger',
  };

  // Intelligence conditionals (THR-113) — {?knows_<category>} / {?no_<category>}.
  // When ctx.intelligence is absent, all knows_* evaluate false and no_* evaluate true.
  for (const category of INTEL_CATEGORIES) {
    const has = ctx.intelligence?.flags[category] === true;
    conditions[`knows_${category}`] = has;
    conditions[`no_${category}`] = !has;
  }

  // Scene-cast conditionals (THR-696) — {?has_cast:<key>} / {?no_cast:<key>}. Same
  // dynamic-key shape as the intel conditionals above: one map entry per declared key,
  // resolved by the shared block loop below. Keys the bundle does not declare fall
  // through to the residual pass, which treats them as absent.
  for (const key of Object.keys(ctx.cast ?? {})) {
    conditions[`has_cast:${key}`] = true;
    conditions[`no_cast:${key}`] = false;
  }

  // Resolve {?condition}...{/condition} blocks
  for (const [key, value] of Object.entries(conditions)) {
    const regex = new RegExp(`\\{\\?${escapeRegExp(key)}\\}([\\s\\S]*?)\\{/${escapeRegExp(key)}\\}`, 'g');
    result = result.replace(regex, value ? '$1' : '');
  }

  // Residual pass for cast keys the bundle does not declare: `has_cast` is false (drop
  // the block), `no_cast` is true (keep the body). Without this, an undeclared key would
  // leak its raw markers, since the loop above only knows declared keys.
  result = result.replace(/\{\?has_cast:([A-Za-z0-9_.-]+)\}[\s\S]*?\{\/has_cast:\1\}/g, '');
  result = result.replace(/\{\?no_cast:([A-Za-z0-9_.-]+)\}([\s\S]*?)\{\/no_cast:\1\}/g, '$2');

  return result;
}

/** Escape a string for literal use inside a RegExp. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
