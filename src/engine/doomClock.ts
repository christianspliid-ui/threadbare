/**
 * Doom Clock Engine — thematic run timer with escalation stages and authored doom cards.
 *
 * The doom clock provides time pressure, world-shaping escalations, and a final climax window.
 */
import type {
  DoomClockArchetype,
  DoomClockDefinition,
  DoomClockStage,
  DoomClockState,
  DoomEscalationEvent,
} from '../types/doomClock';
import type { SphereName } from '../types/index';
import { DEFAULT_THRESHOLDS, ARCHETYPE_STAGE_NAMES } from '../data/doom-content';
import {
  DOOM_CARD_AGENT_TARGET_COUNT,
  DOOM_CARD_HEX_DELTA,
  DOOM_CARD_HEX_TARGET_COUNT,
  DOOM_CARD_LOCATION_TARGET_COUNT,
  DOOM_CARD_PRESSURE_MAGNITUDE,
  DOOM_CARD_PROSPERITY_DELTA,
  DOOM_CARD_UNREST_DELTA,
} from '../data/game-config';

// ─── PRNG ───────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Doom Card Authoring ────────────────────────────────────────

type CardBlueprint = Omit<DoomEscalationEvent, 'id' | 'narrativeHook'> & {
  key: string;
};

const ARCHETYPE_CARD_SPHERES: Record<DoomClockArchetype, SphereName> = {
  breach: 'entropy',
  convergence: 'force',
  changing: 'chaos',
  sundering: 'force',
  failing: 'time',
  ascension: 'spirit',
  reckoning: 'mind',
};

const DOOM_CARD_BLUEPRINTS: Record<
  DoomClockArchetype,
  [
    CardBlueprint,
    CardBlueprint,
    CardBlueprint,
    CardBlueprint,
    CardBlueprint[],
  ]
> = {
  breach: [
    {
      key: 'hairline_rifts',
      title: 'Hairline Rifts',
      description: 'Thin places open in the horizon; a few hexes begin to rot from the edge inward.',
      effectType: 'hex_corruption',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Corruption spreads across the frontier.',
    },
    {
      key: 'borrowed_voices',
      title: 'Borrowed Voices',
      description: 'Settlements hear impossible whispers from beyond the veil and turn on one another.',
      effectType: 'location_unrest',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_UNREST_DELTA,
      effectSummary: 'Unrest spikes in exposed settlements.',
    },
    {
      key: 'barrier_thinning',
      title: 'Barrier Thinning',
      description: 'Old wards dim and the world forgets how to keep the outside out.',
      effectType: 'hex_divine_drain',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Divine influence drains from vulnerable hexes.',
    },
    {
      key: 'incursion_lines',
      title: 'Incursion Lines',
      description: 'The breach stops being local. Entire districts shudder under repeated incursions.',
      effectType: 'prosperity_shock',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_PROSPERITY_DELTA,
      effectSummary: 'Prosperity falters where the breach takes hold.',
    },
    [
      {
        key: 'open_gate',
        title: 'The Gate Opens',
        description: 'Reality tears wide enough for the outside to lean through.',
        effectType: 'hex_corruption',
        targetKind: 'random_hexes',
        targetCount: DOOM_CARD_HEX_TARGET_COUNT + 2,
        magnitude: DOOM_CARD_HEX_DELTA,
        effectSummary: 'Corruption erupts across multiple fronts.',
      },
      {
        key: 'panic_of_realms',
        title: 'Panic of Realms',
        description: 'Cities panic as the impossible becomes ordinary.',
        effectType: 'location_unrest',
        targetKind: 'settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_UNREST_DELTA,
        effectSummary: 'Settlements descend into panic.',
      },
      {
        key: 'shattered_warding',
        title: 'Shattered Warding',
        description: 'Every old protection becomes a memory instead of a shield.',
        effectType: 'hex_divine_drain',
        targetKind: 'random_hexes',
        targetCount: DOOM_CARD_HEX_TARGET_COUNT + 2,
        magnitude: DOOM_CARD_HEX_DELTA,
        effectSummary: 'Protective influence collapses in key regions.',
      },
    ],
  ],
  convergence: [
    {
      key: 'drawn_inward',
      title: 'Drawn Inward',
      description: 'Trade, armies, and pilgrims all begin drifting toward the same impossible center.',
      effectType: 'prosperity_shock',
      targetKind: 'prosperous_settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_PROSPERITY_DELTA,
      effectSummary: 'Outlying prosperity thins as everything is pulled inward.',
    },
    {
      key: 'pressure_front',
      title: 'Pressure Front',
      description: 'Gathering force warps roads, plans, and alliances into a single fatal line.',
      effectType: 'location_pressure',
      targetKind: 'all_locations',
      targetCount: 0,
      magnitude: DOOM_CARD_PRESSURE_MAGNITUDE,
      sphere: 'force',
      effectSummary: 'Force pressure rises across the world.',
    },
    {
      key: 'crowding_of_fates',
      title: 'Crowding of Fates',
      description: 'Settlements near the center choke on refugees, prophets, and rivals.',
      effectType: 'location_unrest',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_UNREST_DELTA,
      effectSummary: 'Gathering crowds turn brittle and unstable.',
    },
    {
      key: 'narrowing_world',
      title: 'Narrowing World',
      description: 'The world seems smaller now; there are fewer safe edges to stand on.',
      effectType: 'hex_divine_drain',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Peripheral wards and sanctuaries lose their hold.',
    },
    [
      {
        key: 'singularity',
        title: 'Singularity',
        description: 'The center calls loudly enough that whole provinces answer at once.',
        effectType: 'location_unrest',
        targetKind: 'settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_UNREST_DELTA,
        effectSummary: 'Crowding and fanaticism trigger open unrest.',
      },
      {
        key: 'crushing_pull',
        title: 'Crushing Pull',
        description: 'Everything not anchored begins to slide toward ruin.',
        effectType: 'prosperity_shock',
        targetKind: 'prosperous_settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_PROSPERITY_DELTA,
        effectSummary: 'Once-thriving settlements hollow out under the pull.',
      },
      {
        key: 'world_knot',
        title: 'World Knot',
        description: 'Power bunches into violent nodes and leaves the rest of the land starved.',
        effectType: 'location_pressure',
        targetKind: 'all_locations',
        targetCount: 0,
        magnitude: DOOM_CARD_PRESSURE_MAGNITUDE + 1,
        sphere: 'force',
        effectSummary: 'Force pressure crescendos everywhere at once.',
      },
    ],
  ],
  changing: [
    {
      key: 'new_pattern',
      title: 'New Pattern',
      description: 'Customs and instincts no longer fit the shape of the world being born.',
      effectType: 'location_pressure',
      targetKind: 'all_locations',
      targetCount: 0,
      magnitude: DOOM_CARD_PRESSURE_MAGNITUDE,
      sphere: 'chaos',
      effectSummary: 'Chaos pressure rises as the old order slips.',
    },
    {
      key: 'civic_dissonance',
      title: 'Civic Dissonance',
      description: 'Settlements argue over which future is real and which is treason.',
      effectType: 'location_unrest',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_UNREST_DELTA,
      effectSummary: 'Communities fracture under incompatible futures.',
    },
    {
      key: 'shed_skin',
      title: 'The World Sheds Its Skin',
      description: 'Some lands adapt. Others crack under the strain of becoming something else.',
      effectType: 'hex_corruption',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Adaptation and ruin race across the landscape.',
    },
    {
      key: 'dislocated_labor',
      title: 'Dislocated Labor',
      description: 'What mattered yesterday no longer feeds anyone today.',
      effectType: 'prosperity_shock',
      targetKind: 'prosperous_settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_PROSPERITY_DELTA,
      effectSummary: 'Prosperity breaks where the old world was strongest.',
    },
    [
      {
        key: 'the_replacement',
        title: 'The Replacement',
        description: 'The new order stops asking permission.',
        effectType: 'location_pressure',
        targetKind: 'all_locations',
        targetCount: 0,
        magnitude: DOOM_CARD_PRESSURE_MAGNITUDE + 1,
        sphere: 'chaos',
        effectSummary: 'A new cosmic pattern asserts itself across the map.',
      },
      {
        key: 'mass_unmaking_of_custom',
        title: 'Mass Unmaking of Custom',
        description: 'Old loyalties and habits become liabilities overnight.',
        effectType: 'location_unrest',
        targetKind: 'settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_UNREST_DELTA,
        effectSummary: 'The social order tears in public.',
      },
      {
        key: 'broken_economies',
        title: 'Broken Economies',
        description: 'The markets of the old world collapse before the new ones exist.',
        effectType: 'prosperity_shock',
        targetKind: 'prosperous_settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_PROSPERITY_DELTA,
        effectSummary: 'Wealth and confidence vanish in a single swing.',
      },
    ],
  ],
  sundering: [
    {
      key: 'fault_lines',
      title: 'Fault Lines',
      description: 'Hairline fractures spread beneath roads, walls, and fields.',
      effectType: 'hex_corruption',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'The land itself begins to break apart.',
    },
    {
      key: 'route_collapse',
      title: 'Route Collapse',
      description: 'Travel grows dangerous as the world’s seams pull away from one another.',
      effectType: 'prosperity_shock',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_PROSPERITY_DELTA,
      effectSummary: 'Trade and supply chains start failing outright.',
    },
    {
      key: 'splintering_will',
      title: 'Splintering Will',
      description: 'Leaders promise stability while the ground moves under their feet.',
      effectType: 'location_unrest',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_UNREST_DELTA,
      effectSummary: 'Settlements turn brittle under constant fracture.',
    },
    {
      key: 'severed_wardpaths',
      title: 'Severed Wardpaths',
      description: 'Holy and civic protections fail wherever the world tears too fast to follow.',
      effectType: 'hex_divine_drain',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Divine protections are cut off from the land.',
    },
    [
      {
        key: 'great_break',
        title: 'The Great Break',
        description: 'Every fracture widens at once.',
        effectType: 'hex_corruption',
        targetKind: 'random_hexes',
        targetCount: DOOM_CARD_HEX_TARGET_COUNT + 2,
        magnitude: DOOM_CARD_HEX_DELTA,
        effectSummary: 'The terrain enters open collapse.',
      },
      {
        key: 'shattered_supply',
        title: 'Shattered Supply',
        description: 'Settlement wealth can no longer outrun the broken roads beneath it.',
        effectType: 'prosperity_shock',
        targetKind: 'settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_PROSPERITY_DELTA,
        effectSummary: 'Prosperity fails wherever the break reaches.',
      },
      {
        key: 'falling_citadels',
        title: 'Falling Citadels',
        description: 'Even the strongest walls cannot negotiate with a broken world.',
        effectType: 'location_unrest',
        targetKind: 'settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_UNREST_DELTA,
        effectSummary: 'Public order collapses with the terrain.',
      },
    ],
  ],
  failing: [
    {
      key: 'waning_core',
      title: 'Waning Core',
      description: 'A foundational force of the world flickers and everything built atop it loses confidence.',
      effectType: 'hex_divine_drain',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Vital wards and blessings begin to gutter out.',
    },
    {
      key: 'slow_hunger',
      title: 'Slow Hunger',
      description: 'Work continues, but nothing seems to hold together long enough to bear fruit.',
      effectType: 'prosperity_shock',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_PROSPERITY_DELTA,
      effectSummary: 'Settlements lose prosperity to creeping systemic failure.',
    },
    {
      key: 'weariness_of_peoples',
      title: 'Weariness of Peoples',
      description: 'Communities quarrel because they can feel the world getting weaker.',
      effectType: 'location_unrest',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_UNREST_DELTA,
      effectSummary: 'Weariness turns into civic instability.',
    },
    {
      key: 'unheld_edges',
      title: 'Unheld Edges',
      description: 'The places once easiest to keep whole now fray first.',
      effectType: 'hex_corruption',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Corruption enters where the world has grown weakest.',
    },
    [
      {
        key: 'systemic_collapse',
        title: 'Systemic Collapse',
        description: 'The failing force takes whole regions down with it.',
        effectType: 'prosperity_shock',
        targetKind: 'settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_PROSPERITY_DELTA,
        effectSummary: 'Economic collapse spreads rapidly.',
      },
      {
        key: 'dying_wards',
        title: 'Dying Wards',
        description: 'What once sustained the world can no longer even defend itself.',
        effectType: 'hex_divine_drain',
        targetKind: 'random_hexes',
        targetCount: DOOM_CARD_HEX_TARGET_COUNT + 2,
        magnitude: DOOM_CARD_HEX_DELTA,
        effectSummary: 'Protective influence gutters out across the map.',
      },
      {
        key: 'slow_riot',
        title: 'Slow Riot',
        description: 'A long failing finally becomes a public emergency.',
        effectType: 'location_unrest',
        targetKind: 'settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_UNREST_DELTA,
        effectSummary: 'Panic and resentment spill into the streets.',
      },
    ],
  ],
  ascension: [
    {
      key: 'distant_radiance',
      title: 'Distant Radiance',
      description: 'Something immense begins climbing toward godhood, and nearby souls feel the pull.',
      effectType: 'agent_pressure',
      targetKind: 'threaded_agents',
      targetCount: DOOM_CARD_AGENT_TARGET_COUNT,
      magnitude: DOOM_CARD_PRESSURE_MAGNITUDE,
      sphere: 'spirit',
      effectSummary: 'Threaded agents are strained by reflected apotheosis.',
    },
    {
      key: 'courts_tremble',
      title: 'Courts Tremble',
      description: 'Mortal institutions cannot agree whether to worship, resist, or flee.',
      effectType: 'location_unrest',
      targetKind: 'settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_UNREST_DELTA,
      effectSummary: 'Cities split around the rising power.',
    },
    {
      key: 'pilgrim_drain',
      title: 'Pilgrim Drain',
      description: 'Power concentrates around the rising figure and leaves distant sanctuaries hollow.',
      effectType: 'hex_divine_drain',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Remote divine protections fade as power concentrates.',
    },
    {
      key: 'tribute_and_fear',
      title: 'Tribute and Fear',
      description: 'Wealth pools toward the coming ascendant while ordinary life becomes precarious.',
      effectType: 'prosperity_shock',
      targetKind: 'prosperous_settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_PROSPERITY_DELTA,
      effectSummary: 'Prosperity is siphoned into the ascent.',
    },
    [
      {
        key: 'false_sunrise',
        title: 'False Sunrise',
        description: 'The almost-god reaches high enough to cast a shadow across the whole world.',
        effectType: 'agent_pressure',
        targetKind: 'threaded_agents',
        targetCount: DOOM_CARD_AGENT_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_PRESSURE_MAGNITUDE + 1,
        sphere: 'spirit',
        effectSummary: 'Personal loyalties are overwhelmed by the ascent.',
      },
      {
        key: 'mass_submission',
        title: 'Mass Submission',
        description: 'Communities break under the choice between devotion and annihilation.',
        effectType: 'location_unrest',
        targetKind: 'settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_UNREST_DELTA,
        effectSummary: 'Settlements crack under the near-divine presence.',
      },
      {
        key: 'hollowed_altars',
        title: 'Hollowed Altars',
        description: 'Every lesser shrine dims as the new power reaches for the sky.',
        effectType: 'hex_divine_drain',
        targetKind: 'random_hexes',
        targetCount: DOOM_CARD_HEX_TARGET_COUNT + 2,
        magnitude: DOOM_CARD_HEX_DELTA,
        effectSummary: 'The world’s existing sacred places are hollowed out.',
      },
    ],
  ],
  reckoning: [
    {
      key: 'old_ledgers',
      title: 'Old Ledgers',
      description: 'Hidden debts and buried crimes begin surfacing in the places that profited most from silence.',
      effectType: 'location_unrest',
      targetKind: 'prosperous_settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_UNREST_DELTA,
      effectSummary: 'Old crimes produce immediate unrest.',
    },
    {
      key: 'collected_interest',
      title: 'Collected Interest',
      description: 'Prosperity turns brittle when yesterday’s gains demand payment.',
      effectType: 'prosperity_shock',
      targetKind: 'prosperous_settlements',
      targetCount: DOOM_CARD_LOCATION_TARGET_COUNT,
      magnitude: DOOM_CARD_PROSPERITY_DELTA,
      effectSummary: 'The past begins collecting from wealthy settlements.',
    },
    {
      key: 'memory_sharpens',
      title: 'Memory Sharpens',
      description: 'No oath remains vague forever. No betrayal stays quiet forever.',
      effectType: 'location_pressure',
      targetKind: 'all_locations',
      targetCount: 0,
      magnitude: DOOM_CARD_PRESSURE_MAGNITUDE,
      sphere: 'mind',
      effectSummary: 'Mind pressure rises as hidden truths resurface.',
    },
    {
      key: 'sites_of_blame',
      title: 'Sites of Blame',
      description: 'The land itself begins naming where the worst debts were incurred.',
      effectType: 'hex_corruption',
      targetKind: 'random_hexes',
      targetCount: DOOM_CARD_HEX_TARGET_COUNT,
      magnitude: DOOM_CARD_HEX_DELTA,
      effectSummary: 'Corruption marks the geography of old guilt.',
    },
    [
      {
        key: 'debts_collected',
        title: 'Debts Collected',
        description: 'The bill comes due in public and all at once.',
        effectType: 'location_unrest',
        targetKind: 'prosperous_settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_UNREST_DELTA,
        effectSummary: 'The reckoning arrives in full view.',
      },
      {
        key: 'confiscation_of_comfort',
        title: 'Confiscation of Comfort',
        description: 'Comfort, rank, and wealth prove to be the easiest things to repossess.',
        effectType: 'prosperity_shock',
        targetKind: 'prosperous_settlements',
        targetCount: DOOM_CARD_LOCATION_TARGET_COUNT + 1,
        magnitude: DOOM_CARD_PROSPERITY_DELTA,
        effectSummary: 'Prosperity is seized by the reckoning.',
      },
      {
        key: 'names_remembered',
        title: 'Names Remembered',
        description: 'The world remembers too clearly to keep going as before.',
        effectType: 'location_pressure',
        targetKind: 'all_locations',
        targetCount: 0,
        magnitude: DOOM_CARD_PRESSURE_MAGNITUDE + 1,
        sphere: 'mind',
        effectSummary: 'Memory itself becomes an active pressure on the world.',
      },
    ],
  ],
};

function blueprintToEvent(
  archetype: DoomClockArchetype,
  stage: number,
  blueprint: CardBlueprint,
  suffix: string,
): DoomEscalationEvent {
  const sphere = blueprint.sphere ?? ARCHETYPE_CARD_SPHERES[archetype];
  return {
    id: `doom_${archetype}_stage_${stage}_${suffix}`,
    title: blueprint.title,
    description: blueprint.description,
    narrativeHook: blueprint.key,
    sphere,
    effectType: blueprint.effectType,
    targetKind: blueprint.targetKind,
    targetCount: blueprint.targetCount,
    magnitude: blueprint.magnitude,
    effectSummary: blueprint.effectSummary,
  };
}

function buildStageEvents(
  archetype: DoomClockArchetype,
  stage: number,
  seed: number,
): DoomEscalationEvent[] {
  const blueprintSet = DOOM_CARD_BLUEPRINTS[archetype][stage - 1];

  if (stage < 5) {
    const blueprint = blueprintSet as CardBlueprint;
    return [blueprintToEvent(archetype, stage, blueprint, blueprint.key)];
  }

  const climaxPool = blueprintSet as CardBlueprint[];
  const rng = mulberry32(seed + stage * 104729);
  const picks = new Set<number>();
  while (picks.size < Math.min(2, climaxPool.length)) {
    picks.add(Math.floor(rng() * climaxPool.length));
  }
  return [...picks].map((index) => {
    const blueprint = climaxPool[index];
    return blueprintToEvent(archetype, stage, blueprint, blueprint.key);
  });
}

// ─── Generator ───────────────────────────────────────────────────

export function generateDoomClock(
  archetype: DoomClockArchetype,
  totalTicks: number,
  seed: number,
): DoomClockDefinition {
  const stageNames = ARCHETYPE_STAGE_NAMES[archetype];

  const stages = DEFAULT_THRESHOLDS.map((threshold, i) => ({
    stage: i + 1,
    name: stageNames[i],
    tickThreshold: threshold,
    events: buildStageEvents(archetype, i + 1, seed),
  })) as [DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage, DoomClockStage];

  return {
    archetype,
    totalTicks,
    stages,
  };
}

// ─── State Machine ───────────────────────────────────────────────

export function createDoomClockState(
  archetype: DoomClockArchetype,
  totalTicks: number,
): DoomClockState {
  return {
    definitionArchetype: archetype,
    currentTick: 0,
    totalTicks,
    currentStage: 1,
    progress: 0,
    stageTransitions: [0],
    expired: false,
    tickModifier: 1.0,
    nextEscalationSeverityModifier: 0,
    counterOmens: 0,
    resolvedEvents: [],
  };
}

export function getDoomClockStage(progress: number): number {
  for (let i = 0; i < DEFAULT_THRESHOLDS.length; i++) {
    if (progress < DEFAULT_THRESHOLDS[i]) return i + 1;
  }
  return 5;
}

export function advanceDoomClock(state: DoomClockState): DoomClockState {
  if (state.expired) return state;

  const newTick = state.currentTick + state.tickModifier;
  const clampedTick = Math.min(newTick, state.totalTicks);
  const newProgress = clampedTick / state.totalTicks;
  const newStage = getDoomClockStage(newProgress);
  const expired = clampedTick >= state.totalTicks;

  const transitions = [...state.stageTransitions];
  if (newStage > state.currentStage) {
    transitions.push(clampedTick);
  }

  return {
    ...state,
    currentTick: clampedTick,
    progress: newProgress,
    currentStage: newStage,
    stageTransitions: transitions,
    expired,
  };
}

export function accelerateDoomClock(state: DoomClockState, amount: number): DoomClockState {
  return {
    ...state,
    tickModifier: state.tickModifier + amount,
  };
}

export function decelerateDoomClock(state: DoomClockState, amount: number): DoomClockState {
  return {
    ...state,
    tickModifier: Math.max(0.1, state.tickModifier - amount),
  };
}
