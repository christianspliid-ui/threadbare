/**
 * Doom Identity Matrices — THR-21 Doom Archetype Identity Pass
 *
 * One DoomIdentityMatrix per DoomClockArchetype. Each matrix is a
 * configuration bundle that tilts the simulation's encounter pool,
 * rival behaviour, location pressure, complication selection, prose
 * vocabulary, and chronicle titles toward the archetype's character.
 *
 * All 7 archetypes are fully authored: breach, convergence, reckoning
 * (THR-21) and changing, sundering, failing, ascension (THR-79).
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

// ─── Changing ─────────────────────────────────────────────────────────────────
// THR-79 (2026-04-29) — Chaos pressure: substitution, not destruction. Old powers
// stop working; new ones do not yet have names. The terror is forgetting what
// things used to be while they change shape under your hands.

const CHANGING: DoomIdentityMatrix = {
  archetype: 'changing',

  encounterPoolBias: {
    investigation: 0.25,
    social:        0.20,
    political:     0.20,
    recovery:      0.05,
    combat:       -0.15,
    threat:       -0.10,
  },

  rivalBehaviorBias: {
    recruit:   0.30,  // jockeying for position in the new order
    intervene: 0.25,
    expand:    0.05,
    wait:     -0.20,
    attack:   -0.20,
  },

  locationPressure: {
    frontierDelta:  1,  // the edges flourish strangely
    centerDelta:    0,
  },

  familiarityGainModifier: 1.2, // people cling to each other when the world is unrecognisable

  complicationBias: {
    collateral_success:    0.25,  // success looks like something you didn't aim at
    partial_progress:      0.20,  // progress is half-shaped
    broken_trust:          0.20,  // old loyalties are being rewritten
    worsening_convergence: 0.10,
    witness:               0.05,
    rival_attention:       0.05,
    scar:                 -0.10,
    debt:                 -0.10,
    location_fallout:     -0.05,
  },

  proseTone: {
    verbs: [
      'shifts', 'transmutes', 'translates', 'reshapes',
      'rewrites', 'transposes', 'recasts', 'unmoors',
    ],
    adjectives: [
      'half-formed', 'transitional', 'unfamiliar', 'untaught',
      'nameless', 'provisional', 'mutable', 'unrecognised',
    ],
    atmospheres: [
      'the old names slip from the tongue mid-sentence',
      'tools answer to gestures their owners do not remember teaching',
      'the season turns at the wrong hour and no one corrects it',
      'what was law yesterday no longer compels',
      'the hands relearn what the fingers used to know',
    ],
  },

  chronicleChapterTitles: [
    'The First Wrongness',
    'When the Old Powers Stopped Answering',
    'Shapes Nobody Yet Knows',
    'The Old Order, Unmade',
    'Naming the New World',
  ],

  identityMilestones: [
    {
      label:             'First Refusal',
      progressThreshold: 0.10,
      description:       'A spell, a season, or a sworn word that always held simply stops holding, with no replacement in sight.',
    },
    {
      label:             'The Founding Fails',
      progressThreshold: 0.35,
      description:       'A faction unravels because the logic it was built on no longer applies; nothing remains to inherit.',
    },
    {
      label:             'Untimed',
      progressThreshold: 0.65,
      description:       'The calendar drifts off true; harvests, festivals, and tides no longer align with the names they bore.',
    },
    {
      label:             'Unrecognised',
      progressThreshold: 0.90,
      description:       'What stood at the start of the doom is gone in form and in fact; no one remembers the world before.',
    },
  ],
};

// ─── Sundering ────────────────────────────────────────────────────────────────
// THR-79 (2026-04-29) — Force pressure: the world breaking apart at fundamental
// seams. Distinct from Breach (something coming through) — Sundering is coming
// apart. Geography and bonds both fracture; nothing intrudes, but nothing holds.

const SUNDERING: DoomIdentityMatrix = {
  archetype: 'sundering',

  encounterPoolBias: {
    combat:        0.25,
    threat:        0.20,
    recovery:      0.15,  // people trying to hold things together
    investigation: 0.05,
    social:       -0.20,  // the bonds that make social encounters possible are breaking
    political:    -0.10,
  },

  rivalBehaviorBias: {
    attack:    0.30,  // claiming pieces of the breaking world
    expand:    0.25,
    intervene: 0.10,
    wait:     -0.30,  // there is no time to build
    recruit:  -0.20,
  },

  locationPressure: {
    frontierDelta: -1,  // the only archetype with no safe geography
    centerDelta:   -1,
    deathSiteUnrestBonus: 1,
  },

  familiarityGainModifier: 0.6, // bonds shatter alongside the land

  complicationBias: {
    broken_trust:          0.25,
    location_fallout:      0.25,
    scar:                  0.20,  // everyone takes a wound
    witness:               0.15,  // the breaking is visible to all
    worsening_convergence: 0.10,
    collateral_success:    0.05,
    rival_attention:      -0.05,
    debt:                 -0.10,
    partial_progress:     -0.10,
  },

  proseTone: {
    verbs: [
      'severs', 'halves', 'cleaves', 'splits',
      'divides', 'separates', 'parts', 'wrenches apart',
    ],
    adjectives: [
      'severed', 'fissured', 'halved', 'unjoined',
      'riven', 'sundered', 'disjointed', 'cloven',
    ],
    atmospheres: [
      'the seams between regions show visibly through the air',
      'what was joined yesterday refuses to meet today',
      'stone, oath, and blood all part along the same lines',
      'the road ends where it did not end last week',
      'voices that should reach no longer carry',
    ],
  },

  chronicleChapterTitles: [
    'The First Crack',
    'The Splitting Season',
    'All Bonds Undone',
    'A World in Pieces',
    'The Final Severance',
  ],

  identityMilestones: [
    {
      label:             'First Crack',
      progressThreshold: 0.10,
      description:       'A visible fissure opens in the geography; a road, a wall, or a riverbed no longer holds its shape.',
    },
    {
      label:             'Voices Break Down',
      progressThreshold: 0.35,
      description:       'Communication between regions becomes unreliable; messengers do not arrive, signals fail to carry.',
    },
    {
      label:             'The Land Reshaped',
      progressThreshold: 0.65,
      description:       'Physical geography has shifted: a road is gone, a river runs the wrong way, a coastline has receded.',
    },
    {
      label:             'No Reunion',
      progressThreshold: 0.90,
      description:       'Reunification is impossible — the pieces drift apart, and no force present can pull them back.',
    },
  ],
};

// ─── Failing ──────────────────────────────────────────────────────────────────
// THR-79 (2026-04-29) — Time pressure: slow erosion of whatever sustains life.
// Springs run dry, crops thin, magic flickers. There is no enemy. Time itself,
// or the world's reservoirs, just runs out. The dread is patient and total.

const FAILING: DoomIdentityMatrix = {
  archetype: 'failing',

  encounterPoolBias: {
    recovery:      0.25,  // everyone is trying to hoard or resurrect
    investigation: 0.20,  // where did the power go?
    political:     0.10,
    combat:       -0.15,  // there is no enemy to fight, just emptiness
    social:       -0.10,
    threat:       -0.05,
  },

  rivalBehaviorBias: {
    wait:      0.25,  // they conserve
    intervene: 0.20,
    recruit:   0.05,
    attack:   -0.30,  // no surplus to fund aggression
    expand:   -0.25,
  },

  locationPressure: {
    frontierDelta:  0,
    centerDelta:   -1,  // capitals cannot sustain their populations
  },

  familiarityGainModifier: 1.0, // nothing pulls people apart, but nothing pulls them together either

  complicationBias: {
    partial_progress:      0.30,  // every success is incomplete because resources weren't there
    worsening_convergence: 0.20,  // the failing accelerates
    scar:                  0.15,  // exhaustion leaves marks
    debt:                  0.10,
    broken_trust:          0.05,
    collateral_success:   -0.05,
    witness:              -0.05,
    rival_attention:      -0.10,
    location_fallout:     -0.10,
  },

  proseTone: {
    verbs: [
      'ebbs', 'dims', 'exhausts', 'quietens',
      'runs thin', 'withers', 'attenuates', 'hushes',
    ],
    adjectives: [
      'hollow', 'attenuated', 'guttering', 'thin',
      'dwindled', 'faltering', 'sparse', 'sere',
    ],
    atmospheres: [
      'the lamps need more oil than they did last month',
      'wells deepen each season but yield less each draw',
      'songs are sung shorter, with fewer verses than the singer recalls',
      'the year\'s first warmth never fully arrives',
      'every loaf is a little smaller than the last by hands no one can name',
    ],
  },

  chronicleChapterTitles: [
    'The First Dimming',
    'When the Springs Ran Dry',
    'The Long Exhaustion',
    'The Last Light',
    'The Silence After',
  ],

  identityMilestones: [
    {
      label:             'First Dimming',
      progressThreshold: 0.10,
      description:       'A power that ran reliable for generations begins to falter — a well, a hearth-fire, a season\'s gift.',
    },
    {
      label:             'Many Failures At Once',
      progressThreshold: 0.40,
      description:       'Multiple systems break down within the same season; rationing becomes the language of councils.',
    },
    {
      label:             'The Reserves Run Low',
      progressThreshold: 0.70,
      description:       'The core force is nearly spent; what remains is rationed, hoarded, and resented in equal measure.',
    },
    {
      label:             'The Last Burning',
      progressThreshold: 0.90,
      description:       'The last reserves are committed; whatever does not survive this winter will not be rebuilt.',
    },
  ],
};

// ─── Ascension ────────────────────────────────────────────────────────────────
// THR-79 (2026-04-29) — Spirit pressure: a specific being approaching godhood.
// The dread is not catastrophe but replacement — the world will continue, but
// with a new god in it, and those who knew the ascendant before will be small.

const ASCENSION: DoomIdentityMatrix = {
  archetype: 'ascension',

  encounterPoolBias: {
    social:        0.25,  // everyone is positioning relative to the rising power
    political:     0.25,
    investigation: 0.20,  // mortals trying to understand
    recovery:      0.05,
    threat:       -0.20,  // direct opposition no longer works
    combat:       -0.20,
  },

  rivalBehaviorBias: {
    recruit:   0.30,  // building factions of devotees
    intervene: 0.25,  // manipulating the ascendant or those near them
    expand:    0.10,
    attack:   -0.25,  // too late to fight
    wait:     -0.15,  // there is no time
  },

  locationPressure: {
    frontierDelta:  0,
    centerDelta:    1,  // the seat of the ascending being prospers, briefly
  },

  familiarityGainModifier: 1.3, // people gather around the ascending light

  complicationBias: {
    rival_attention:       0.30,  // everyone is watching the ascension
    witness:               0.25,  // the moment is being recorded
    debt:                  0.20,  // alliances bend toward the rising power
    broken_trust:          0.15,
    worsening_convergence: 0.10,
    partial_progress:     -0.05,
    collateral_success:   -0.10,
    scar:                 -0.10,
    location_fallout:     -0.10,
  },

  proseTone: {
    verbs: [
      'rises', 'surpasses', 'outgrows', 'leaves behind',
      'transcends', 'ascends', 'eclipses', 'lifts away',
    ],
    adjectives: [
      'singular', 'unprecedented', 'set apart', 'beyond',
      'sovereign', 'untouchable', 'exalted', 'heightened',
    ],
    atmospheres: [
      'those who knew them as a child can no longer meet their eyes',
      'the air at their elbow tastes of incense though no incense is lit',
      'their shadow is steady when nothing else\'s is',
      'names spoken in their hearing arrive smaller than they left the mouth',
      'their hands have stopped being the size they were last year',
    ],
  },

  chronicleChapterTitles: [
    'The First Signs of Elevation',
    'Above the Common Reach',
    'The Ones Who Knew Them Before',
    'The Apotheosis Approaches',
    'The New God\'s First Breath',
  ],

  identityMilestones: [
    {
      label:             'First Threshold',
      progressThreshold: 0.10,
      description:       'The ascending being does something no mortal has done — survives a wound, hears a god, walks unburned.',
    },
    {
      label:             'Beyond Opposition',
      progressThreshold: 0.35,
      description:       'Every organised attempt to stop the ascension has failed; what is left is supplication or flight.',
    },
    {
      label:             'Godhood In The Flesh',
      progressThreshold: 0.65,
      description:       'Physical signs of divinity show — light without source, presence without arrival, voice that compels.',
    },
    {
      label:             'Apotheosis',
      progressThreshold: 0.90,
      description:       'The ascension completes; the world has a new god, and those who knew them before are small forever.',
    },
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
