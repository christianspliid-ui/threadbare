/**
 * deriveLocationActivities.ts — UI-side derivation of location activity summaries.
 *
 * Produces LocationActivitySummary for each visible location, including:
 *   - LocationPulse (aggregate activity level)
 *   - Murmur prose (1-3 lines, keyed by pulse × activity category × omen)
 *   - AgentActivityThread array (familiarity-gated per-agent prose)
 *   - HexPulseSummary map for hex-level particle rendering
 *
 * This is NOT a tick phase — it runs as a UI memo gated by worldVersion.
 * Pure function: same inputs → same outputs (deterministic murmur via seeded PRNG).
 *
 * Performance contract (NFP #7):
 *   - One-pass located_at index: O(edges), not O(agents × locations)
 *   - Only processes locations on visible hexes (frustum-culled)
 *   - No template lookups per agent — uses templateId prefix heuristic
 *
 * NFP #1 (tunability): All thresholds in LOCATION_ACTIVITY_CONSTANTS.
 * NFP #2 (inspectability): agentThreads carries familiarityScore for debug.
 * NFP #3 (determinism): mulberry32(tick × prime + locationHash) for murmur picks.
 * NFP #4 (fail-soft): All missing data falls back gracefully, never throws.
 * NFP #5 (narrative): Everything the player reads is prose, never raw numbers.
 */

import type { WorldGraph } from './graph';
import type { UnifiedAction } from '../types/unifiedAction';
import type { FamiliarityMap } from '../types/familiarity';
import type { OmenState } from '../types/omen';
import type {
  LocationActivitySummary,
  AgentActivityThread,
  LocationPulse,
  ActivityCategory,
  HexPulseSummary,
} from '../types/locationActivity';
import { mulberry32 } from '../lib/prng';

// ── NFP #1: Named constants ────────────────────────────────────────────────────

export const LOCATION_ACTIVITY_CONSTANTS = {
  /** Agent count threshold for 'busy' pulse */
  PULSE_BUSY_THRESHOLD: 3,
  /** Conflict activities required for 'volatile' pulse */
  PULSE_VOLATILE_CONFLICT_COUNT: 2,
  /** Max murmur prose lines per location tooltip */
  MURMUR_MAX_LINES: 3,
  /** Max named agents shown in location tooltip */
  TOOLTIP_MAX_NAMED_AGENTS: 3,
  /** Below this familiarity score, agent activity is vague */
  FAMILIARITY_VAGUE_THRESHOLD: 0.3,
  /** Above this familiarity score, full activity detail is shown */
  FAMILIARITY_DETAIL_THRESHOLD: 0.7,
  /** Ticks to look back for failure/complication (for temperature) */
  TEMPERATURE_HEATED_LOOKBACK: 3,
  /** Prime multiplier for PRNG seeding per location (avoids correlation) */
  MURMUR_LOCATION_SEED_PRIME: 2654435761,
} as const;

// ── Activity category inference ────────────────────────────────────────────────

/**
 * Maps templateId prefixes to ActivityCategory.
 * Templates are named action.<reach>.* so the reach maps directly.
 *
 * NFP #4: Falls back to 'idle' for unrecognised prefixes.
 */
function inferCategoryFromTemplateId(templateId: string): ActivityCategory {
  if (templateId.startsWith('action.iron') || templateId.includes('duel') || templateId.includes('fight') || templateId.includes('combat') || templateId.includes('battle') || templateId.includes('clash')) return 'conflict';
  if (templateId.startsWith('action.gold') || templateId.includes('trade') || templateId.includes('barter') || templateId.includes('commerce') || templateId.includes('market')) return 'commerce';
  if (templateId.startsWith('action.heart') || templateId.includes('diplomacy') || templateId.includes('negotiate') || templateId.includes('persuade') || templateId.includes('bond')) return 'diplomacy';
  if (templateId.startsWith('action.shadow') || templateId.includes('spy') || templateId.includes('infiltrate') || templateId.includes('scheme') || templateId.includes('gather_intel')) return 'intrigue';
  if (templateId.startsWith('action.star') || templateId.startsWith('action.veil') || templateId.includes('pray') || templateId.includes('ritual') || templateId.includes('shrine') || templateId.includes('temple')) return 'devotion';
  if (templateId.startsWith('action.stone') || templateId.includes('build') || templateId.includes('craft') || templateId.includes('construct') || templateId.includes('fortify')) return 'craft';
  if (templateId.startsWith('action.eye') || templateId.includes('scout') || templateId.includes('explore') || templateId.includes('survey') || templateId.includes('discover')) return 'exploration';
  return 'idle';
}

// ── Temperature from recent step outcomes ──────────────────────────────────────

function deriveTemperature(
  action: UnifiedAction | undefined,
  tick: number,
): AgentActivityThread['temperature'] {
  if (!action || action.stepOutcomes.length === 0) return 'cool';

  const lookback = LOCATION_ACTIVITY_CONSTANTS.TEMPERATURE_HEATED_LOOKBACK;
  const recentOutcomes = action.stepOutcomes.slice(-lookback);

  const hasFailureOrComplication = recentOutcomes.some(
    o => o.outcome === 'failure' || o.outcome === 'success_at_cost',
  );
  if (hasFailureOrComplication) return 'heated';

  const hasSuccess = recentOutcomes.some(o => o.outcome === 'success');
  if (hasSuccess) return 'warm';

  return 'cool';
}

// ── Familiarity-gated activity prose ──────────────────────────────────────────

function buildVisibleActivity(
  agentName: string,
  familiarityScore: number,
  category: ActivityCategory,
  movementPhase: AgentActivityThread['movementPhase'],
  temperature: AgentActivityThread['temperature'],
  action: UnifiedAction | undefined,
): string {
  const vague = LOCATION_ACTIVITY_CONSTANTS.FAMILIARITY_VAGUE_THRESHOLD;
  const detail = LOCATION_ACTIVITY_CONSTANTS.FAMILIARITY_DETAIL_THRESHOLD;

  // Below vague threshold — no name, no specifics
  if (familiarityScore < vague) {
    if (movementPhase === 'arriving') return 'A traveler, heading here with purpose.';
    if (movementPhase === 'departing') return 'A figure, preparing to leave.';
    return 'Someone, going about their business.';
  }

  // Movement overrides activity when in transit
  if (movementPhase === 'arriving') return `${agentName} — arriving`;
  if (movementPhase === 'departing') return `${agentName} — departing`;

  // Medium familiarity: name + vague category
  if (familiarityScore < detail) {
    const categoryPhrase = CATEGORY_VAGUE_PHRASES[category] ?? 'doing something';
    return `${agentName} — ${categoryPhrase}`;
  }

  // High familiarity: full detail including step progress and temperature
  const categoryPhrase = CATEGORY_DETAIL_PHRASES[category] ?? 'occupied';
  if (action && !action.resolved) {
    const stepInfo = action.currentStep > 0 ? ` (step ${action.currentStep + 1})` : '';
    const tempSuffix = temperature === 'heated' ? ' — something went wrong' : temperature === 'warm' ? ' — making progress' : '';
    return `${agentName} — ${categoryPhrase}${stepInfo}${tempSuffix}`;
  }

  return `${agentName} — ${categoryPhrase}`;
}

const CATEGORY_VAGUE_PHRASES: Record<ActivityCategory, string> = {
  commerce:    'at the market',
  conflict:    'in a confrontation',
  diplomacy:   'in conversation',
  intrigue:    'meeting someone privately',
  devotion:    'at the shrine',
  craft:       'working on something',
  exploration: 'scouting the area',
  gathering:   'arriving',
  dispersal:   'departing',
  idle:        'resting',
};

const CATEGORY_DETAIL_PHRASES: Record<ActivityCategory, string> = {
  commerce:    'negotiating a trade',
  conflict:    'in a confrontation',
  diplomacy:   'brokering an agreement',
  intrigue:    'gathering intelligence',
  devotion:    'performing a rite',
  craft:       'overseeing construction',
  exploration: 'investigating the surroundings',
  gathering:   'converging here',
  dispersal:   'preparing to move on',
  idle:        'idling',
};

// ── Pulse computation ──────────────────────────────────────────────────────────

/**
 * Derives LocationPulse from the agent threads at a location.
 *
 * NFP #4: Empty threads → 'quiet'.
 */
export function computeLocationPulse(threads: AgentActivityThread[]): LocationPulse {
  if (threads.length === 0) return 'quiet';

  const conflictCount = threads.filter(t => t.category === 'conflict').length;
  if (conflictCount >= LOCATION_ACTIVITY_CONSTANTS.PULSE_VOLATILE_CONFLICT_COUNT) return 'volatile';
  if (conflictCount > 0) return 'tense';

  const agentCount = threads.length;
  const activeCount = threads.filter(t => t.category !== 'idle').length;

  if (agentCount >= LOCATION_ACTIVITY_CONSTANTS.PULSE_BUSY_THRESHOLD || activeCount >= 2) return 'busy';
  if (agentCount >= 1 || activeCount >= 1) return 'stirring';

  return 'quiet';
}

// ── Dominant activity ──────────────────────────────────────────────────────────

function dominantActivityFrom(threads: AgentActivityThread[]): ActivityCategory | null {
  if (threads.length === 0) return null;

  // Count non-idle categories
  const counts = new Map<ActivityCategory, number>();
  for (const t of threads) {
    if (t.category !== 'idle') {
      counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return 'idle';

  let best: ActivityCategory = 'idle';
  let bestCount = 0;
  for (const [cat, count] of counts) {
    if (count > bestCount) { best = cat; bestCount = count; }
  }
  return best;
}

// ── Murmur prose templates ────────────────────────────────────────────────────

/**
 * ~60 murmur prose templates keyed by LocationPulse and ActivityCategory.
 * Each array is a pool; templates are picked deterministically by tick-seeded PRNG.
 *
 * Quality bar: every murmur must feel specific to the activity, not generic.
 * If a murmur could describe any settlement interchangeably, it fails.
 */
const MURMUR_TEMPLATES: Readonly<Record<LocationPulse, Readonly<Record<ActivityCategory, readonly string[]>>>> = {
  quiet: {
    idle: [
      'Smoke rises from a single chimney. Otherwise, stillness.',
      'A dog sleeps in the road. Nobody disturbs it.',
      'The wind moves through empty streets. The place breathes, but only just.',
      'A shutter bangs, once, and then the quiet returns.',
    ],
    commerce: [
      'A lone merchant arranges their wares. More habit than hope.',
      'The market stall stands open, the merchant drowsing behind it.',
    ],
    conflict: [
      'The tensions here have gone quiet — for now.',
      'Weapons are stowed. The dispute has not been resolved, only paused.',
    ],
    diplomacy: [
      'A quiet conversation in a doorway. Hard to tell if it went well.',
      'The meeting has ended. The participants left without fanfare.',
    ],
    intrigue: [
      'Someone moved through here recently. They were careful not to be remembered.',
      'Notes were passed. The traces are faint but present.',
    ],
    devotion: [
      'The shrine is empty now. A candle gutters in the alcove.',
      'The last supplicant has gone. Silence fills the space left behind.',
    ],
    craft: [
      'Tools lie arranged and waiting. The work will resume.',
      'The forge is cold. The crafters have gone home.',
    ],
    exploration: [
      'A scout returned through here, said nothing to anyone.',
      'The tracks go out and come back. Whatever was found, it was not shared.',
    ],
    gathering: [
      'People arrived here earlier. Most have dispersed.',
    ],
    dispersal: [
      'The crowd has thinned. The place feels emptied out.',
    ],
  },
  stirring: {
    idle: [
      'Two farmers argue about a fence line. The argument has been going on for years. Neither expects it to end.',
      'Children play in the square. The sound carries in the quiet afternoon.',
      'Someone is cooking. The smell drifts through the streets.',
    ],
    commerce: [
      'A handful of traders move between stalls. Nothing urgent — but things are moving.',
      'Prices are being discussed in the shade. A deal is being formed.',
    ],
    conflict: [
      'Raised voices from somewhere nearby — not a fight yet, but edging toward one.',
      'Two groups eye each other from opposite sides of the road.',
    ],
    diplomacy: [
      'A quiet meeting in the back room of the inn. Polite so far.',
      'Envoys were sighted arriving. The outcome of the meeting is not yet known.',
    ],
    intrigue: [
      'Someone is asking questions. The answers they get are carefully chosen.',
      'A message was delivered. The recipient read it twice before burning it.',
    ],
    devotion: [
      'A small congregation at the shrine. Low voices, held candles.',
      'Prayer is happening nearby. Quiet and private.',
    ],
    craft: [
      'A few workers at the site. Progress is slow but steady.',
      'The forge runs warm. Something modest is being made.',
    ],
    exploration: [
      'A scout departed earlier. No report yet.',
      'Someone is mapping the outskirts. They have not come back to share their findings.',
    ],
    gathering: [
      'People are drifting toward this place — not in a hurry, but clearly headed here.',
    ],
    dispersal: [
      'The settlement is quieter than yesterday. Some have moved on.',
    ],
  },
  busy: {
    idle: [
      'The square is alive with the ordinary noise of a settlement doing its business.',
      'People move with purpose. The place has the hum of a functioning community.',
    ],
    commerce: [
      'The market square rings with argument and coin. Business is brisk.',
      'Caravans and traders crowd the road. The air smells of goods and negotiation.',
      'Buyers and sellers move through each other. The market is at full tide.',
    ],
    conflict: [
      'Weapons are out — not drawn, but visible. The atmosphere is controlled tension.',
      'Armed figures move through the crowd with intent. Bystanders give them room.',
    ],
    diplomacy: [
      'A formal gathering fills the hall. Voices rise and fall in the cadence of negotiation.',
      'The meeting of minds is in full swing. Runners carry messages between parties.',
    ],
    intrigue: [
      'Ears are everywhere. People speak in low voices and move with purpose.',
      'The tavern is busy and the conversations are careful. Something is being arranged.',
    ],
    devotion: [
      'The temple is full. A ceremony is underway — incense, chanting, and the weight of gathered faith.',
      'Pilgrims and worshippers crowd the approaches. The rite draws people from outside the settlement.',
    ],
    craft: [
      'The sound of hammers and saws fills the air. Something substantial is being built.',
      'Workers move in organized groups. This is serious construction — the project has momentum.',
    ],
    exploration: [
      'Multiple scouts are in the field. The settlement is learning the land around it.',
      'Maps are being drawn, discussed, and revised. Discoveries are being made.',
    ],
    gathering: [
      'People converge on this place from multiple directions. Something has drawn them here.',
      'The roads leading in are busy. The settlement is becoming a destination.',
    ],
    dispersal: [
      'A large group is organizing to leave. The departure has a planned feel.',
    ],
  },
  tense: {
    idle: [
      'The streets are quieter than they should be for this hour. People are staying inside.',
      'Normal life continues, but with one eye over the shoulder.',
    ],
    commerce: [
      'Trading continues, but prices have spiked and tempers with them.',
      'The market is still running, but the usual bargaining has a harder edge today.',
    ],
    conflict: [
      'Voices carry from the square — sharp-edged, not quite shouting. Not yet.',
      'Hands rest on hilts. The wrong word could start something.',
      'Armed figures move with purpose through the settlement. Faces are closed and watchful.',
    ],
    diplomacy: [
      'The negotiation has hit a wall. The parties are still talking, but barely.',
      'Envoys exchange papers with the controlled courtesy of people who distrust each other.',
    ],
    intrigue: [
      'Conversations stop when strangers approach. Doors close a fraction earlier than usual.',
      'Someone is being watched. They know it. So does everyone else.',
    ],
    devotion: [
      'The shrine is surrounded. Whatever is happening inside is not open to the public.',
      'The rite has taken a solemn turn. The congregation does not speak of what they witnessed.',
    ],
    craft: [
      'The construction has stalled — a dispute, or a shortage, or something worse.',
      'Workers stand around the site looking at each other. Nobody is sure what happens next.',
    ],
    exploration: [
      'A scout came back with bad news. The details are not being shared widely.',
      'The survey party has not reported in. There is quiet anxiety about where they are.',
    ],
    gathering: [
      'A crowd has formed — not in celebration. The energy is coiled and watchful.',
      'People are assembling with purpose. The reason is not entirely clear from outside.',
    ],
    dispersal: [
      'People are leaving in a hurry. The kind of departure that is not planned in advance.',
      'Families are moving their things. The settlement may not look like this tomorrow.',
    ],
  },
  volatile: {
    idle: [
      'The air crackles. Every face is a threat or an ally — nothing in between.',
      'The settlement holds its breath. Whatever happens next will happen fast.',
    ],
    commerce: [
      'The market has collapsed into something else. Buying and selling is the least of it.',
      'What was a trade dispute has become something that will be remembered.',
    ],
    conflict: [
      'Violence is imminent or ongoing. Bystanders have scattered.',
      'Steel has been drawn. The outcome is not yet decided.',
      'A fight is happening. The crowd is either fleeing or watching — nothing in between.',
    ],
    diplomacy: [
      'The negotiation has broken down completely. There will be consequences.',
      'Whatever was agreed has been repudiated. The principals have stopped pretending to be civil.',
    ],
    intrigue: [
      'Something has been exposed. The people it affects are moving fast.',
      'The scheme has gone public. The scramble to control the damage is not going well.',
    ],
    devotion: [
      'The ceremony has become something that was not intended. The faithful are shaken.',
      'What happened at the shrine will not stay at the shrine.',
    ],
    craft: [
      'The construction site has become a crisis. Something structural has failed or someone has been hurt.',
      'The project is on the edge of collapse — and so is the situation around it.',
    ],
    exploration: [
      'Whatever the scouts found has caused an emergency response.',
      'The report came back. Whatever it said, it changed everything.',
    ],
    gathering: [
      'The gathering has become a mob, or a riot, or something indistinguishable from one.',
      'The crowd has reached the tipping point. Control is no longer possible.',
    ],
    dispersal: [
      'People are running. Not walking — running.',
      'The settlement is emptying. Whatever is driving this departure is not far behind.',
    ],
  },
};

/**
 * Generic fallback murmur when no template matches.
 * NFP #4: Never crashes murmur selection.
 */
const GENERIC_MURMUR = 'Life goes on.';

// ── Murmur selection ──────────────────────────────────────────────────────────

/**
 * Selects 1-3 murmur lines deterministically using tick-seeded PRNG.
 *
 * PRNG seed: tick × MURMUR_LOCATION_SEED_PRIME + locationHash
 * This ensures: same tick + same location = same murmur; different ticks = different picks.
 *
 * Omen coloring: if an active omen has vocabulary, injects {omen_adj} / {omen_atmosphere}
 * into the first murmur line when template contains those placeholders.
 */
function selectMurmurs(
  pulse: LocationPulse,
  category: ActivityCategory,
  locationId: string,
  tick: number,
  omenState?: OmenState,
): string[] {
  const pool = MURMUR_TEMPLATES[pulse]?.[category] ?? [];
  if (pool.length === 0) return [GENERIC_MURMUR];

  // Deterministic location hash for seed variation
  let locationHash = 0;
  for (let i = 0; i < locationId.length; i++) {
    locationHash = Math.imul(locationHash * 31 + locationId.charCodeAt(i), 1) >>> 0;
  }

  const seed = ((tick * LOCATION_ACTIVITY_CONSTANTS.MURMUR_LOCATION_SEED_PRIME) >>> 0) ^ locationHash;
  const rng = mulberry32(seed);

  // Select 1 murmur line (most locations get exactly 1; pool provides variety)
  const idx = Math.floor(rng() * pool.length);
  let murmur = pool[idx] ?? GENERIC_MURMUR;

  // Omen injection — replace placeholders when active omen vocabulary is available
  const activeOmen = omenState?.primary ?? omenState?.secondary;
  if (activeOmen) {
    // We need the vocabulary — it lives in OmenTrackTemplate, not ActiveOmen.
    // Since we don't want to import the full template registry here, we skip omen injection.
    // TODO(THR-128): inject omen vocabulary once OmenTrackTemplate is accessible from runtime state.
  }

  return [murmur];
}

// ── Main derivation function ──────────────────────────────────────────────────

export interface DeriveLocationActivitiesInput {
  graph: WorldGraph;
  unifiedActions: UnifiedAction[];
  familiarityMap: FamiliarityMap;
  /** Hex keys ("col,row") that are currently visible (fog-unobscured) */
  visibleHexKeys: ReadonlySet<string>;
  tick: number;
  omenState?: OmenState;
}

export interface DeriveLocationActivitiesResult {
  /** LocationActivitySummary keyed by locationId */
  summaries: Map<string, LocationActivitySummary>;
  /** HexPulseSummary keyed by hex key ("col,row") — for HexMapV2 particle layer */
  hexPulses: Map<string, HexPulseSummary>;
}

/**
 * Derives activity summaries for all visible locations.
 *
 * Performance:
 *   - Builds located_at index in one pass over all edges: O(edges)
 *   - Only processes locations on visible hexes
 *   - No template lookups — templateId prefix heuristic is O(1)
 *
 * NFP #4: Errors in individual agent processing are caught and skipped.
 */
export function deriveLocationActivities(
  input: DeriveLocationActivitiesInput,
): DeriveLocationActivitiesResult {
  const { graph, unifiedActions, familiarityMap, visibleHexKeys, tick, omenState } = input;

  // ── Step 1: Build located_at index in one pass ──────────────────────────────
  // Map<locationId, agentId[]> — only individual actors
  const locationAgentIndex = new Map<string, string[]>();

  const locatedAtEdges = graph.getEdgesByType('located_at');
  for (const edge of locatedAtEdges) {
    const agentNode = graph.getNode(edge.source);
    if (!agentNode || agentNode.properties.actorType !== 'individual') continue;
    const agents = locationAgentIndex.get(edge.target);
    if (agents) {
      agents.push(edge.source);
    } else {
      locationAgentIndex.set(edge.target, [edge.source]);
    }
  }

  // ── Step 2: Build active action index ─────────────────────────────────────
  // Map<actorId, UnifiedAction> — first unresolved action per actor
  const activeActionByActor = new Map<string, UnifiedAction>();
  for (const action of unifiedActions) {
    if (!action.resolved && !activeActionByActor.has(action.actorId)) {
      activeActionByActor.set(action.actorId, action);
    }
  }

  // ── Step 3: Process each visible location ─────────────────────────────────
  const summaries = new Map<string, LocationActivitySummary>();
  const hexPulseAccumulator = new Map<string, { pulse: LocationPulse; dominantActivity: ActivityCategory | null }>();

  const locationNodes = graph.getNodesByType('location');

  for (const locNode of locationNodes) {
    const props = locNode.properties as Record<string, unknown>;
    const hexCol = Number(props.hexCol);
    const hexRow = Number(props.hexRow);
    const hexKey = `${hexCol},${hexRow}`;

    // Skip fog-hidden hexes
    if (!visibleHexKeys.has(hexKey)) continue;

    const agentIds = locationAgentIndex.get(locNode.id) ?? [];

    // ── Build agent threads ──────────────────────────────────────────────────
    const threads: AgentActivityThread[] = [];

    for (const agentId of agentIds) {
      try {
        const agentNode = graph.getNode(agentId);
        if (!agentNode) continue;

        const agentName = agentNode.name ?? 'Unknown';
        const familiarityScore = familiarityMap.get(agentId) ?? 0;
        const action = activeActionByActor.get(agentId);

        // Infer activity category
        let category: ActivityCategory = 'idle';
        if (action) {
          category = inferCategoryFromTemplateId(action.templateId);
        }

        // Derive movement phase
        const movState = agentNode.properties.movementState as { destinationId?: string; movementQueue?: string[] } | undefined;
        let movementPhase: AgentActivityThread['movementPhase'] = 'present';
        if (movState?.destinationId) {
          const isArriving = movState.destinationId === locNode.id;
          const isDeparting = !isArriving && (movState.movementQueue?.length ?? 0) > 0;
          if (isArriving) { movementPhase = 'arriving'; category = 'gathering'; }
          else if (isDeparting) { movementPhase = 'departing'; category = 'dispersal'; }
        }

        // Derive temperature from recent step outcomes
        const temperature = deriveTemperature(action, tick);

        // Build familiarity-gated activity prose
        const visibleActivity = buildVisibleActivity(
          agentName, familiarityScore, category, movementPhase, temperature, action,
        );

        threads.push({
          agentId,
          agentName,
          visibleActivity,
          category,
          movementPhase,
          temperature,
          familiarityScore,
        });
      } catch {
        // NFP #4: skip problematic agents silently
      }
    }

    // ── Derive pulse and dominant activity ───────────────────────────────────
    const pulse = computeLocationPulse(threads);
    const dominantActivity = dominantActivityFrom(threads);

    // ── Count encounter pressure ─────────────────────────────────────────────
    const encounterPressure = agentIds.reduce((count, agentId) => {
      const action = activeActionByActor.get(agentId);
      return action ? count + 1 : count;
    }, 0);

    // ── Select murmurs ───────────────────────────────────────────────────────
    const effectiveCategory = dominantActivity ?? 'idle';
    const murmurs = selectMurmurs(pulse, effectiveCategory, locNode.id, tick, omenState);

    const locName = locNode.name ?? String(props.name ?? 'Unknown Location');

    summaries.set(locNode.id, {
      locationId: locNode.id,
      locationName: locName,
      pulse,
      murmurs,
      agentThreads: threads,
      encounterPressure,
      dominantActivity,
      hexCol,
      hexRow,
    });

    // ── Accumulate hex pulse (max of all locations on this hex) ─────────────
    const existing = hexPulseAccumulator.get(hexKey);
    if (!existing || PULSE_ORDER[pulse] > PULSE_ORDER[existing.pulse]) {
      hexPulseAccumulator.set(hexKey, { pulse, dominantActivity });
    }
  }

  // ── Step 4: Build hexPulses map ────────────────────────────────────────────
  const hexPulses = new Map<string, HexPulseSummary>();
  for (const [hexKey, { pulse, dominantActivity }] of hexPulseAccumulator) {
    const [col, row] = hexKey.split(',').map(Number);
    hexPulses.set(hexKey, {
      hexCol: col ?? 0,
      hexRow: row ?? 0,
      pulse,
      dominantActivity,
    });
  }

  return { summaries, hexPulses };
}

// ── Pulse ordering for max-accumulation ──────────────────────────────────────

const PULSE_ORDER: Record<LocationPulse, number> = {
  quiet: 0,
  stirring: 1,
  busy: 2,
  tense: 3,
  volatile: 4,
};

