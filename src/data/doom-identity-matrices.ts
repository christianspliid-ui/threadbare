/**
 * Doom Identity Matrices — THR-21 Doom Archetype Identity Pass
 *
 * One DoomIdentityMatrix per DoomClockArchetype. Each matrix is a
 * configuration bundle that tilts the simulation's encounter pool,
 * rival behaviour, location pressure, complication selection, prose
 * vocabulary, and chronicle titles toward the archetype's character.
 *
 * All 7 archetypes are present; 3 are fully authored (breach, convergence,
 * reckoning), 4 are stub-authored (changing, sundering, failing, ascension)
 * with placeholder prose vocabulary and neutral biases — sufficient for the
 * engine to function, easy to upgrade with richer content.
 */

import type { DoomIdentityMatrix } from '../types/doomIdentity';
import { RECKONING_DEATH_SITE_SPIRIT_PRESSURE } from '../types/doomIdentity';
import type { DoomClockArchetype } from '../types/doomClock';

// ─── Breach ──────────────────────────────────────────────────────────────────
// Outside force breaking through reality. Frontier hexes suffer. Rivals push
// aggressively. Complications leave scars and collateral damage.

const BREACH: DoomIdentityMatrix = {
  archetype: 'breach',

  encounterPoolBias: {
    combat:          0.25,
    threat:          0.20,
    investigation:   0.10,
    social:         -0.10,
    recovery:       -0.15,
  },

  rivalBehaviorBias: {
    attack:    0.30,
    expand:    0.20,
    intervene: 0.15,
    recruit:  -0.10,
    wait:     -0.30,
  },

  locationPressure: {
    frontierDelta: -1,  // BREACH_FRONTIER_PROSPERITY_PENALTY
    centerDelta:    0,
    deathSiteUnrestBonus: 2,
  },

  familiarityGainModifier: 0.7, // bonds form more slowly under siege conditions

  // NOTE: Plan specified location_fallout +0.3 as primary, scar +0.2 as secondary.
  // Tuned down to scar +0.25 primary / location_fallout +0.15 — heavy location_fallout
  // on every failure produced redundant spatial ping-pong without narrative texture.
  // scar-first means Breach failures leave marks on the agent, not just the map.
  complicationBias: {
    scar:                  0.25,
    collateral_success:    0.20,
    location_fallout:      0.15,
    rival_attention:       0.10,
    worsening_convergence: 0.10,
    witness:              -0.05,
    broken_trust:         -0.05,
    debt:                 -0.10,
    partial_progress:     -0.15,
  },

  proseTone: {
    verbs: [
      'fractures', 'tears', 'bleeds through', 'presses against',
      'forces open', 'splinters', 'ruptures', 'intrudes',
    ],
    adjectives: [
      'fractured', 'raw', 'exposed', 'violated', 'thin',
      'permeable', 'breached', 'scarred',
    ],
    atmospheres: [
      'the boundary thins',
      'something presses from the other side',
      'the veil frays at the edges',
      'a chill that has no origin',
      'the world remembers what it has lost',
    ],
  },

  chronicleChapterTitles: [
    'The First Tremors',
    'Cracks in the Foundation',
    'When the Walls Began to Fail',
    'The Flood Behind the Breach',
    'What Came Through',
  ],

  identityMilestones: [
    {
      label:             'First Breach',
      progressThreshold: 0.10,
      description:       'The outer membrane tears for the first time — something intrudes.',
    },
    {
      label:             'Spreading Fissures',
      progressThreshold: 0.35,
      description:       'Frontier settlements report strange incursions weekly.',
    },
    {
      label:             'The Front Collapses',
      progressThreshold: 0.65,
      description:       'Multiple simultaneous breach points overwhelm local defences.',
    },
    {
      label:             'No Line Holds',
      progressThreshold: 0.85,
      description:       'The interior is no longer safe. The breach is everywhere.',
    },
  ],
};

// ─── Convergence ─────────────────────────────────────────────────────────────
// All forces drawn to a single point. Centre hexes thrive (briefly). Rivals
// manipulate rather than attack. Complications create obligations and watchers.

const CONVERGENCE: DoomIdentityMatrix = {
  archetype: 'convergence',

  encounterPoolBias: {
    social:        0.25,
    political:     0.20,
    investigation: 0.15,
    combat:       -0.10,
    recovery:     -0.05,
    threat:       -0.15,
  },

  rivalBehaviorBias: {
    intervene: 0.35,
    recruit:   0.25,
    wait:      0.10,
    attack:   -0.25,
    expand:   -0.20,
  },

  locationPressure: {
    frontierDelta:  0,
    centerDelta:    1, // CONVERGENCE_CENTER_PROSPERITY_BONUS
    deathSiteUnrestBonus: 0,
  },

  familiarityGainModifier: 1.4, // everyone is drawn together — bonds form faster

  complicationBias: {
    witness:         0.25,
    debt:            0.20,
    rival_attention: 0.20,
    broken_trust:    0.15,
    partial_progress: 0.10,
    scar:            -0.10,
    collateral_success: 0.05,
    location_fallout:  -0.05,
    worsening_convergence: 0.15,
  },

  proseTone: {
    verbs: [
      'pulls toward', 'draws in', 'aligns', 'gathers',
      'orbits', 'converges', 'folds inward', 'accumulates',
    ],
    adjectives: [
      'convergent', 'dense', 'magnetised', 'inevitable',
      'coalescing', 'weighted', 'inescapable', 'taut',
    ],
    atmospheres: [
      'the gravity of the moment is palpable',
      'all roads seem to lead here',
      'coincidences pile up beyond reason',
      'the air hums with unspoken arrangement',
      'silence accumulates between words',
    ],
  },

  chronicleChapterTitles: [
    'The Drawing Begins',
    'Orbits Tighten',
    'The Weight of Gathering',
    'Nothing Escapes the Pull',
    'The Moment of Collapse',
  ],

  identityMilestones: [
    {
      label:             'First Alignment',
      progressThreshold: 0.10,
      description:       'Disparate forces begin moving in the same direction.',
    },
    {
      label:             'Critical Mass',
      progressThreshold: 0.35,
      description:       'The centre population is swollen with refugees and pilgrims.',
    },
    {
      label:             'Inescapable Pull',
      progressThreshold: 0.60,
      description:       'Agents report being unable to leave the region.',
    },
    {
      label:             'The Singularity',
      progressThreshold: 0.85,
      description:       'The convergence point is physically manifest. The end is visible.',
    },
  ],
};

// ─── Reckoning ────────────────────────────────────────────────────────────────
// Past debts coming due. Rivals resurface old wounds. Complications expose
// failures and obligations. Trust decays as secrets emerge.

const RECKONING: DoomIdentityMatrix = {
  archetype: 'reckoning',

  encounterPoolBias: {
    investigation: 0.25,
    social:        0.20,
    political:     0.15,
    recovery:      0.10,
    combat:       -0.10,
    threat:       -0.05,
  },

  rivalBehaviorBias: {
    intervene: 0.30,
    recruit:   0.15,
    attack:   -0.15,
    expand:   -0.20,
  },

  locationPressure: {
    frontierDelta:  0,
    centerDelta:   -1,
    deathSiteUnrestBonus: 3,     // old violence remembered
    deathSiteSpiritPressure: RECKONING_DEATH_SITE_SPIRIT_PRESSURE,
  },

  familiarityGainModifier: 0.9, // wariness tempers openness

  complicationBias: {
    broken_trust:          0.25,
    debt:                  0.25,
    witness:               0.20,
    rival_attention:       0.15,
    worsening_convergence: 0.10,
    scar:                  0.10,
    partial_progress:     -0.10,
    collateral_success:   -0.05,
    location_fallout:     -0.05,
  },

  proseTone: {
    verbs: [
      'resurfaces', 'returns', 'settles', 'demands payment',
      'echoes back', 'catches up', 'arrives at last', 'claims',
    ],
    adjectives: [
      'long-owed', 'overdue', 'remembered', 'inescapable',
      'settling', 'patient', 'accumulated', 'rightful',
    ],
    atmospheres: [
      'the past refuses to stay buried',
      'debts older than memory come due',
      'old wounds reopen without warning',
      'the weight of accumulated choices presses down',
      'justice and vengeance become indistinguishable',
    ],
  },

  chronicleChapterTitles: [
    'When Old Wounds Reopened',
    'The Ledger of Forgotten Sins',
    'Every Debt Remembered',
    'No Mercy for the Unready',
    'The Final Accounting',
  ],

  identityMilestones: [
    {
      label:             'First Reckoning',
      progressThreshold: 0.10,
      description:       'The first buried secret surfaces; someone pays for an old mistake.',
    },
    {
      label:             'The Ledger Opens',
      progressThreshold: 0.35,
      description:       'Old alliances crumble as debts are tallied.',
    },
    {
      label:             'No Hiding',
      progressThreshold: 0.60,
      description:       'Every faction leader\'s past is public. Nothing is hidden.',
    },
    {
      label:             'The Day of Payment',
      progressThreshold: 0.85,
      description:       'Mass reckoning — the powerful face consequences en masse.',
    },
  ],
};

// ─── Stub archetypes ──────────────────────────────────────────────────────────
// Neutral biases; prose vocabulary is placeholder-quality but covers the
// enrichment pipeline. Upgrade in a future content pass.

const CHANGING: DoomIdentityMatrix = {
  archetype: 'changing',

  encounterPoolBias: {
    investigation: 0.15,
    recovery:      0.10,
    social:        0.10,
  },

  rivalBehaviorBias: {
    intervene: 0.20,
    recruit:   0.15,
    wait:     -0.10,
  },

  locationPressure: {
    frontierDelta:  0,
    centerDelta:    0,
  },

  familiarityGainModifier: 1.1,

  complicationBias: {
    collateral_success: 0.20,
    partial_progress:   0.15,
    broken_trust:       0.10,
  },

  proseTone: {
    verbs: ['shifts', 'transforms', 'unmakes', 'reorders', 'dissolves into'],
    adjectives: ['mutable', 'transitional', 'unformed', 'half-remembered', 'becoming'],
    atmospheres: [
      'the old shapes blur at the edges',
      'nothing stays the same shape twice',
      'the new order has not yet named itself',
    ],
  },

  chronicleChapterTitles: [
    'The First Metamorphosis',
    'When the Old Names Failed',
    'The Great Unmaking',
    'New Shapes, New Laws',
    'The World Reborn Unknown',
  ],

  identityMilestones: [
    { label: 'First Shift',         progressThreshold: 0.10, description: 'The old order cracks for the first time.' },
    { label: 'Accelerating Change', progressThreshold: 0.40, description: 'Transformation is now visible week to week.' },
    { label: 'No Return',           progressThreshold: 0.70, description: 'The old world is gone. The new has no name yet.' },
    { label: 'The Final Form',      progressThreshold: 0.90, description: 'The transformation completes. Something new has arrived.' },
  ],
};

const SUNDERING: DoomIdentityMatrix = {
  archetype: 'sundering',

  encounterPoolBias: {
    combat:  0.20,
    threat:  0.15,
    social: -0.15,
  },

  rivalBehaviorBias: {
    attack:   0.25,
    expand:   0.20,
    intervene: 0.15,
    wait:    -0.25,
    recruit: -0.10,
  },

  locationPressure: {
    frontierDelta: -1,
    centerDelta:   -1,
    deathSiteUnrestBonus: 2,
  },

  familiarityGainModifier: 0.6,

  complicationBias: {
    broken_trust:   0.20,
    location_fallout: 0.20,
    scar:           0.15,
    witness:        0.10,
  },

  proseTone: {
    verbs: ['breaks apart', 'sunders', 'severs', 'collapses', 'fragments'],
    adjectives: ['broken', 'severed', 'isolated', 'fractured', 'disconnected'],
    atmospheres: [
      'what was whole is now in pieces',
      'the seams of the world give way',
      'every bond that can break, breaks',
    ],
  },

  chronicleChapterTitles: [
    'When the First Things Broke',
    'The Splitting Season',
    'All Bonds Undone',
    'Pieces of a World',
    'The Final Severance',
  ],

  identityMilestones: [
    { label: 'First Fracture',   progressThreshold: 0.10, description: 'The world\'s first visible crack appears.' },
    { label: 'Widening Rifts',   progressThreshold: 0.35, description: 'Communication between regions breaks down.' },
    { label: 'The Great Split',  progressThreshold: 0.65, description: 'Physical geography changes as the land tears.' },
    { label: 'No Reunion',       progressThreshold: 0.85, description: 'Reunification is impossible. The pieces drift apart.' },
  ],
};

const FAILING: DoomIdentityMatrix = {
  archetype: 'failing',

  encounterPoolBias: {
    recovery:      0.20,
    investigation: 0.15,
    combat:       -0.10,
    social:       -0.05,
  },

  rivalBehaviorBias: {
    wait:      0.20,
    intervene: 0.15,
    recruit:   0.10,
    attack:   -0.20,
    expand:   -0.15,
  },

  locationPressure: {
    frontierDelta:  0,
    centerDelta:   -1,
  },

  familiarityGainModifier: 1.0,

  complicationBias: {
    partial_progress:   0.25,
    scar:               0.15,
    worsening_convergence: 0.15,
    collateral_success: 0.10,
  },

  proseTone: {
    verbs: ['fades', 'diminishes', 'drains away', 'ebbs', 'exhausts itself'],
    adjectives: ['fading', 'hollow', 'depleted', 'dim', 'guttering'],
    atmospheres: [
      'the light is somehow less than it was',
      'creation forgets how to replenish itself',
      'the world grows quieter by degrees',
    ],
  },

  chronicleChapterTitles: [
    'The First Dimming',
    'When the Springs Ran Dry',
    'The Long Exhaustion',
    'Last Light',
    'When Nothing Was Left',
  ],

  identityMilestones: [
    { label: 'First Diminishment', progressThreshold: 0.10, description: 'A power that was reliable begins to fail.' },
    { label: 'Widespread Scarcity', progressThreshold: 0.40, description: 'Multiple systems begin to break down at once.' },
    { label: 'Critical Depletion',  progressThreshold: 0.70, description: 'The core force is nearly spent.' },
    { label: 'Final Flicker',       progressThreshold: 0.90, description: 'The last reserves are burning.' },
  ],
};

const ASCENSION: DoomIdentityMatrix = {
  archetype: 'ascension',

  encounterPoolBias: {
    social:        0.20,
    investigation: 0.15,
    political:     0.15,
    threat:       -0.10,
    combat:       -0.05,
  },

  rivalBehaviorBias: {
    recruit:   0.25,
    intervene: 0.20,
    expand:    0.15,
    attack:   -0.15,
    wait:     -0.10,
  },

  locationPressure: {
    frontierDelta:  0,
    centerDelta:    1,
  },

  familiarityGainModifier: 1.3,

  complicationBias: {
    rival_attention: 0.25,
    witness:         0.20,
    debt:            0.15,
    broken_trust:    0.10,
    scar:           -0.10,
  },

  proseTone: {
    verbs: ['rises', 'ascends', 'transcends', 'elevates', 'surpasses'],
    adjectives: ['transcendent', 'radiant', 'elevated', 'singular', 'apotheosised'],
    atmospheres: [
      'something approaches the threshold of divinity',
      'the gap between mortal and divine narrows dangerously',
      'reverence and terror become the same feeling',
    ],
  },

  chronicleChapterTitles: [
    'The First Signs of Elevation',
    'Above the Common Reach',
    'When One Became More Than One',
    'The Apotheosis Approaches',
    'The New God\'s First Breath',
  ],

  identityMilestones: [
    { label: 'First Ascent',         progressThreshold: 0.10, description: 'The ascending being first crosses a mortal threshold.' },
    { label: 'Beyond Challenge',     progressThreshold: 0.35, description: 'No mortal force can stop the ascension now.' },
    { label: 'The Penultimate Step', progressThreshold: 0.65, description: 'Godhood is palpable — visible in the flesh.' },
    { label: 'Apotheosis',           progressThreshold: 0.90, description: 'The ascension completes. The world has a new god.' },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

const DOOM_IDENTITY_MATRICES: Record<DoomClockArchetype, DoomIdentityMatrix> = {
  breach:      BREACH,
  convergence: CONVERGENCE,
  reckoning:   RECKONING,
  changing:    CHANGING,
  sundering:   SUNDERING,
  failing:     FAILING,
  ascension:   ASCENSION,
};

/**
 * Returns the DoomIdentityMatrix for the given archetype.
 * All 7 archetypes are registered; this never returns undefined.
 */
export function getDoomIdentityMatrix(archetype: DoomClockArchetype): DoomIdentityMatrix {
  return DOOM_IDENTITY_MATRICES[archetype];
}
