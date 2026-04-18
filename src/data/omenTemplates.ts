/**
 * Omen Track Templates — THR-19
 *
 * Content for the Omen Agenda System. Templates authored per:
 * - Doom-echo: 3 implemented archetypes (breach, convergence, reckoning) × 4 tracks each
 * - Sphere-surge: 12 (one per sphere) — 6 implemented, 6 stubbed
 * - Cultural: 6 tracks
 * - Seasonal: 4 tracks (primary fallback only)
 *
 * Remaining 4 doom archetypes (changing, sundering, failing, ascension) are
 * tracked in THR-79 and deferred to a content pass.
 */

import type { OmenTrackTemplate } from '../types/omen';

// ═══════════════════════════════════════════════════════════════════
// DOOM-ECHO OMENS — The Breach (Force/Chaos/Entropy)
// ═══════════════════════════════════════════════════════════════════

const BREACH_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.breach.thin_places',
    name: 'Thin Places',
    category: 'doom_echo',
    tagline: 'The horizon shimmers where it shouldn\'t.',
    doomArchetypes: ['breach'],
    doomStageRange: [0, 1],
    durationRange: [8, 12],
    encounterBias: { explore: 0.2 },
    vocabulary: {
      adjectives: ['cold', 'wrong', 'absent', 'hollow', 'still'],
      verbs: ['shivers', 'bends', 'fades', 'whispers', 'vanishes'],
      nouns: ['threshold', 'shimmer', 'silence', 'gap', 'breach'],
      atmosphere: [
        'Something watches from the wrong side of the world.',
        'The air tastes of distance and iron.',
        'Shadows fall at angles that do not match the sun.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Travelers on the road near {location} report the horizon flickering — a shimmer like heat haze, but cold.',
          'A child in {location} drew a door in the air with her finger. Her mother swears the air shivered where she traced.',
          'The well water in {location} tastes of iron and distance. No one drinks after dark anymore.',
          'Dogs in {location} bark at walls, at empty corners, at something no one else can see.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.breach.borrowed_voices',
    name: 'Borrowed Voices',
    category: 'doom_echo',
    tagline: 'Whispers without source. Trust crumbles.',
    doomArchetypes: ['breach'],
    doomStageRange: [1, 2],
    durationRange: [6, 10],
    encounterBias: { duel: 0.15, social: -0.1 },
    vocabulary: {
      adjectives: ['suspicious', 'fractured', 'hollow', 'deceived', 'paranoid'],
      verbs: ['hisses', 'accuses', 'echoes', 'misleads', 'unravels'],
      nouns: ['rumor', 'doubt', 'voice', 'suspicion', 'fracture'],
      atmosphere: [
        'Words arrive before the speaker opens their mouth.',
        'No one trusts what they heard yesterday.',
        'Something speaks in voices that are not its own.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'A merchant in {location} swears they heard their name called in a voice that has been dead for years.',
          'Fistfights have broken out in {location} over claims that words were never spoken.',
          'The local leader of {location} has ordered all written messages burned after reading. Trust no one.',
        ],
        significance: 0.55,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.breach.fissure_winds',
    name: 'Fissure Winds',
    category: 'doom_echo',
    tagline: 'What was sealed is opening. Exposure is everything.',
    doomArchetypes: ['breach'],
    doomStageRange: [2, 3],
    durationRange: [6, 8],
    encounterBias: { duel: 0.3, trade: -0.2 },
    vocabulary: {
      adjectives: ['raw', 'torn', 'violent', 'exposed', 'bleeding'],
      verbs: ['tears', 'rips', 'howls', 'splits', 'bleeds'],
      nouns: ['wound', 'gale', 'rend', 'scar', 'fissure'],
      atmosphere: [
        'The world tears where it was already thin.',
        'Everything exposed. Everything raw. No shelter.',
        'The wind carries things that should not travel.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'Stonework in {location} develops hairline cracks overnight — precise, purposeful-looking.',
          'A trader caravan near {location} was found scattered across the road. No violence. Just... dispersed.',
          'The wind in {location} sounds like breath through a wound. Locals sleep with doors barred.',
        ],
        significance: 0.6,
      },
    ],
    chronicleSignificance: 0.7,
  },
  {
    id: 'omen.breach.the_hemorrhage',
    name: 'The Hemorrhage',
    category: 'doom_echo',
    tagline: 'It pours through. The boundary is gone.',
    doomArchetypes: ['breach'],
    doomStageRange: [3, 4],
    durationRange: [5, 7],
    encounterBias: { duel: 0.4, explore: -0.2 },
    vocabulary: {
      adjectives: ['overwhelming', 'dissolving', 'drowning', 'pouring', 'lost'],
      verbs: ['pours', 'floods', 'dissolves', 'overwhelms', 'erases'],
      nouns: ['flood', 'dissolution', 'breach', 'overflow', 'erasure'],
      atmosphere: [
        'The boundary held for centuries. It holds no longer.',
        'Too much, all at once, with no end in sight.',
        'What comes through does not come back.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'Three locations near {location} have been abandoned in a single day. No one will say what they saw.',
          'The river running through {location} runs uphill for an hour each evening. No one investigates anymore.',
          'Something pours through the seams of the world near {location}. The seams are widening.',
        ],
        significance: 0.75,
      },
    ],
    chronicleSignificance: 0.8,
  },
];

// ═══════════════════════════════════════════════════════════════════
// DOOM-ECHO OMENS — The Convergence (Order/Mind/Energy)
// ═══════════════════════════════════════════════════════════════════

const CONVERGENCE_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.convergence.geometric_dreams',
    name: 'Geometric Dreams',
    category: 'doom_echo',
    tagline: 'Perfect patterns. Déjà vu. The design reveals itself.',
    doomArchetypes: ['convergence'],
    doomStageRange: [0, 1],
    durationRange: [10, 15],
    encounterBias: { social: 0.2 },
    vocabulary: {
      adjectives: ['crystalline', 'inevitable', 'perfect', 'recursive', 'clear'],
      verbs: ['aligns', 'clicks', 'repeats', 'crystallizes', 'unfolds'],
      nouns: ['pattern', 'symmetry', 'design', 'lattice', 'order'],
      atmosphere: [
        'Everything is beginning to fit together.',
        'The pattern was always there. Now it is visible.',
        'Coincidence is not coincidence. Nothing is.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'People in {location} have begun finishing each other\'s sentences. Spontaneously. Correctly.',
          'The birds of {location} flock in precise geometric formations before dawn. Children draw the shapes from memory.',
          'A cartographer in {location} mapped three roads she had never walked. They existed exactly as drawn.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.6,
  },
  {
    id: 'omen.convergence.the_humming',
    name: 'The Humming',
    category: 'doom_echo',
    tagline: 'A resonance that pulls everything toward itself.',
    doomArchetypes: ['convergence'],
    doomStageRange: [1, 2],
    durationRange: [8, 12],
    encounterBias: { social: 0.15, duel: -0.15 },
    vocabulary: {
      adjectives: ['resonant', 'drowsy', 'harmonious', 'inevitable', 'warm'],
      verbs: ['hums', 'resonates', 'pulls', 'lulls', 'draws'],
      nouns: ['resonance', 'harmony', 'hum', 'pull', 'current'],
      atmosphere: [
        'Something below the threshold of hearing, drawing everything toward a center.',
        'It would be so easy to simply let go and drift with it.',
        'Resistance grows heavier by the hour.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Travelers approaching {location} from the east report feeling pulled, like a current in still water.',
          'Arguments in {location} resolve themselves mid-sentence. No one remembers what the disagreement was.',
          'The elders of {location} have begun singing the same tuneless hum. None of them know why.',
        ],
        significance: 0.55,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.convergence.gravity_wells',
    name: 'Gravity Wells',
    category: 'doom_echo',
    tagline: 'Compression. Everything pressed together. No more space.',
    doomArchetypes: ['convergence'],
    doomStageRange: [2, 3],
    durationRange: [6, 10],
    encounterBias: { social: 0.3, explore: -0.2 },
    vocabulary: {
      adjectives: ['compressed', 'close', 'inescapable', 'crushing', 'dense'],
      verbs: ['presses', 'compresses', 'closes', 'gathers', 'tightens'],
      nouns: ['pressure', 'mass', 'density', 'weight', 'collapse'],
      atmosphere: [
        'There is no distance anymore. Everyone is too close.',
        'The space between things is being consumed.',
        'Escape requires more effort than most can summon.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The roads to {location} have become crowded beyond reason. People drift inward without knowing why.',
          'Individuals in {location} report feeling watched from all directions simultaneously. They are not wrong.',
          'The outer settlements near {location} empty gradually. Not by flight — by drift, toward the center.',
        ],
        significance: 0.65,
      },
    ],
    chronicleSignificance: 0.7,
  },
  {
    id: 'omen.convergence.the_singularity_approaches',
    name: 'The Singularity Approaches',
    category: 'doom_echo',
    tagline: 'The individual is becoming a memory.',
    doomArchetypes: ['convergence'],
    doomStageRange: [3, 4],
    durationRange: [5, 7],
    encounterBias: { social: 0.4, duel: -0.3 },
    vocabulary: {
      adjectives: ['unified', 'transcendent', 'erased', 'merged', 'complete'],
      verbs: ['merges', 'unifies', 'absorbs', 'transcends', 'erases'],
      nouns: ['unity', 'dissolution', 'wholeness', 'end', 'completion'],
      atmosphere: [
        'The self is a problem almost solved.',
        'Unity is offered as mercy. Most accept.',
        'What remains after the last boundary falls?',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'People in {location} have stopped using personal names. It feels unnecessary.',
          'A traveler who left {location} a week ago returned claiming she had been there the entire time. She seems sincere.',
          'The voices of {location}\'s inhabitants arrive before their bodies. The bodies are catching up.',
        ],
        significance: 0.8,
      },
    ],
    chronicleSignificance: 0.85,
  },
];

// ═══════════════════════════════════════════════════════════════════
// DOOM-ECHO OMENS — The Reckoning (Time/Spirit/Darkness)
// ═══════════════════════════════════════════════════════════════════

const RECKONING_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.reckoning.old_debts',
    name: 'Old Debts',
    category: 'doom_echo',
    tagline: 'Half-remembered faces. The past has not forgotten.',
    doomArchetypes: ['reckoning'],
    doomStageRange: [0, 1],
    durationRange: [10, 15],
    encounterBias: { social: 0.2, explore: 0.1 },
    vocabulary: {
      adjectives: ['remembered', 'guilty', 'owed', 'past', 'heavy'],
      verbs: ['returns', 'weighs', 'reminds', 'haunts', 'recalls'],
      nouns: ['debt', 'memory', 'return', 'past', 'account'],
      atmosphere: [
        'The past is arriving, whether invited or not.',
        'Something long unpaid is calling the balance due.',
        'Old faces appear in new places. Old names surface on strange tongues.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'Travelers passing through {location} recognize no one, yet are greeted by name by strangers.',
          'A family in {location} found a letter in their fireplace — sealed, addressed to someone three generations dead.',
          'The elders of {location} speak of people long absent as if they were expected any day.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.6,
  },
  {
    id: 'omen.reckoning.the_witnesses',
    name: 'The Witnesses',
    category: 'doom_echo',
    tagline: 'Being watched. Every act observed. Judgment accumulates.',
    doomArchetypes: ['reckoning'],
    doomStageRange: [1, 2],
    durationRange: [8, 12],
    encounterBias: { social: 0.25 },
    vocabulary: {
      adjectives: ['observed', 'seen', 'judged', 'watched', 'accountable'],
      verbs: ['watches', 'records', 'judges', 'tallies', 'marks'],
      nouns: ['witness', 'judgment', 'record', 'accounting', 'verdict'],
      atmosphere: [
        'Nothing goes unseen. Nothing goes unrecorded.',
        'The weight of observation is a physical sensation now.',
        'Whatever is watching has been watching for a very long time.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Residents of {location} have begun confessing old wrongs to anyone who will listen. Unprompted.',
          'The shadows in {location} face the wrong direction — toward the observer, not away from the light.',
          'Every minor transaction in {location} is documented twice, thrice. Everyone feels the need to be recorded.',
        ],
        significance: 0.55,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.reckoning.echo_walk',
    name: 'Echo Walk',
    category: 'doom_echo',
    tagline: 'Past and present overlap. Time is confused.',
    doomArchetypes: ['reckoning'],
    doomStageRange: [2, 3],
    durationRange: [6, 10],
    encounterBias: { social: 0.2, duel: 0.2 },
    vocabulary: {
      adjectives: ['overlapping', 'doubled', 'echoed', 'confused', 'layered'],
      verbs: ['echoes', 'overlaps', 'doubles', 'repeats', 'layers'],
      nouns: ['echo', 'double', 'layer', 'repetition', 'loop'],
      atmosphere: [
        'Events that happened before are happening again.',
        'The present is a thin film over the past.',
        'It is becoming difficult to tell which moment is now.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'A fire that burned {location} a generation ago recurs for exactly one hour before dawn — without damage.',
          'People in {location} apologize for things they have not yet done. They seem sincere.',
          'The streets of {location} are walked by people who match descriptions of those long buried.',
        ],
        significance: 0.65,
      },
    ],
    chronicleSignificance: 0.7,
  },
  {
    id: 'omen.reckoning.the_accounting',
    name: 'The Accounting',
    category: 'doom_echo',
    tagline: 'Debts called in. Final chances. No more extensions.',
    doomArchetypes: ['reckoning'],
    doomStageRange: [3, 4],
    durationRange: [5, 7],
    encounterBias: { social: 0.3, trade: 0.2 },
    vocabulary: {
      adjectives: ['final', 'owed', 'settled', 'absolute', 'concluded'],
      verbs: ['settles', 'closes', 'concludes', 'absolves', 'condemns'],
      nouns: ['reckoning', 'settlement', 'conclusion', 'closure', 'verdict'],
      atmosphere: [
        'The ledger closes. All debts come due at once.',
        'There are no more extensions. Only resolution.',
        'Absolution or damnation — both offered. Both accepted.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'Feuds of decades in {location} end overnight — through reconciliation, or through blood.',
          'A creditor arrived in {location} who no one remembers lending to. Everyone owes.',
          'Those who wronged others in {location} find their victims at their doors. Not all visits end well.',
        ],
        significance: 0.8,
      },
    ],
    chronicleSignificance: 0.85,
  },
];

// ═══════════════════════════════════════════════════════════════════
// SPHERE-SURGE OMENS
// ═══════════════════════════════════════════════════════════════════

const SPHERE_SURGE_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.sphere.verdant_surge',
    name: 'Verdant Surge',
    category: 'sphere_surge',
    tagline: 'Growth without boundary. Life presses through every crack.',
    sphereTrigger: { sphere: 'life', minDominance: 0.25 },
    durationRange: [8, 12],
    encounterBias: { assist: 0.2 },
    spherePressure: { sphere: 'life', magnitude: 0.01 },
    vocabulary: {
      adjectives: ['lush', 'verdant', 'overgrown', 'fertile', 'bursting'],
      verbs: ['grows', 'spreads', 'blooms', 'bursts', 'climbs'],
      nouns: ['growth', 'bloom', 'vine', 'proliferation', 'abundance'],
      atmosphere: [
        'Life crowds every surface. Every crack. Every wound.',
        'The world is hungry to grow.',
        'Fecundity beyond blessing — almost beyond bearing.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'The fields around {location} yield twice what was planted. Farmers are uneasy, not grateful.',
          'Wounds in {location} close overnight with strange new scars — green-veined, alive.',
          'A sealed room in {location} was opened to find it full of flowering vines. The door had been locked for years.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
  {
    id: 'omen.sphere.entropic_tide',
    name: 'Entropic Tide',
    category: 'sphere_surge',
    tagline: 'Decay finds what time forgot. Beautiful ruin.',
    sphereTrigger: { sphere: 'entropy', minDominance: 0.25 },
    durationRange: [8, 12],
    encounterBias: { explore: 0.2 },
    spherePressure: { sphere: 'entropy', magnitude: 0.01 },
    vocabulary: {
      adjectives: ['decayed', 'ruined', 'crumbling', 'weathered', 'hollow'],
      verbs: ['crumbles', 'decays', 'dissolves', 'unravels', 'fades'],
      nouns: ['ruin', 'decay', 'dissolution', 'rust', 'weathering'],
      atmosphere: [
        'Things that should have crumbled long ago finally let go.',
        'Beautiful in the way of things that will not be seen again.',
        'Entropy does not destroy — it reveals what was always temporary.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'Old structures in {location} that survived centuries begin to settle, to loosen, to sigh.',
          'Written records near {location} are found crumbling even under preservation. The words still legible, just barely.',
          'Scars that had long since faded on the people of {location} return, briefly, before vanishing again.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
  {
    id: 'omen.sphere.iron_season',
    name: 'Iron Season',
    category: 'sphere_surge',
    tagline: 'Martial energy saturates the air. Everyone is ready.',
    sphereTrigger: { sphere: 'force', minDominance: 0.25 },
    durationRange: [6, 10],
    encounterBias: { duel: 0.3 },
    spherePressure: { sphere: 'force', magnitude: 0.01 },
    vocabulary: {
      adjectives: ['tense', 'martial', 'ready', 'charged', 'coiled'],
      verbs: ['sharpens', 'braces', 'hardens', 'readies', 'clenches'],
      nouns: ['tension', 'readiness', 'sharpening', 'coil', 'edge'],
      atmosphere: [
        'The air is tight with readiness. Something is about to break.',
        'Every hand moves toward a weapon it has not yet drawn.',
        'This is the breath before the blow.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Smiths in {location} work through the night. The ringing carries for miles.',
          'Old soldiers in {location} have taken to sitting by the gates again, watching the road.',
          'Training yards in {location} are full past midnight. No one can say exactly why.',
        ],
        significance: 0.55,
      },
    ],
    chronicleSignificance: 0.6,
  },
  {
    id: 'omen.sphere.crystal_clarity',
    name: 'Crystal Clarity',
    category: 'sphere_surge',
    tagline: 'Insight without mercy. Uncomfortable truth, perfectly legible.',
    sphereTrigger: { sphere: 'mind', minDominance: 0.25 },
    durationRange: [8, 12],
    encounterBias: { explore: 0.2, social: 0.1 },
    spherePressure: { sphere: 'mind', magnitude: 0.01 },
    vocabulary: {
      adjectives: ['clear', 'revealed', 'transparent', 'unambiguous', 'sharp'],
      verbs: ['reveals', 'clarifies', 'exposes', 'illuminates', 'strips'],
      nouns: ['clarity', 'revelation', 'truth', 'transparency', 'insight'],
      atmosphere: [
        'Everything is obvious. That is the problem.',
        'Truth without kindness. Clarity without mercy.',
        'Those who looked away now find they cannot.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Lies in {location} collapse mid-sentence. The speaker is as surprised as anyone.',
          'Plans that seemed reasonable yesterday look reckless in the clear light this omen brings.',
          'A scholar in {location} published a work that was received as revelation and catastrophe simultaneously.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
  {
    id: 'omen.sphere.the_veil_thins',
    name: 'The Veil Thins',
    category: 'sphere_surge',
    tagline: 'Ancestor presence. The boundary between living and dead softens.',
    sphereTrigger: { sphere: 'spirit', minDominance: 0.25 },
    durationRange: [8, 12],
    encounterBias: { assist: 0.15, explore: 0.15 },
    spherePressure: { sphere: 'spirit', magnitude: 0.01 },
    vocabulary: {
      adjectives: ['thin', 'permeable', 'ancestral', 'haunted', 'present'],
      verbs: ['speaks', 'visits', 'reaches', 'crosses', 'lingers'],
      nouns: ['veil', 'ancestor', 'presence', 'crossing', 'remnant'],
      atmosphere: [
        'The dead have things left to say.',
        'Something crosses over, is seen, and crosses back.',
        'Grief and reunion are indistinguishable at this distance.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'Shrines in {location} are found freshly cleaned — no one admits doing it.',
          'Children in {location} play with companions no adult can see. They seem content.',
          'The dreams of {location}\'s residents are full of instructions. Most of them sound urgent.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
  {
    id: 'omen.sphere.temporal_drift',
    name: 'Temporal Drift',
    category: 'sphere_surge',
    tagline: 'Echoes, repetition, fragments of prophecy.',
    sphereTrigger: { sphere: 'time', minDominance: 0.25 },
    durationRange: [6, 10],
    encounterBias: { social: 0.15 },
    spherePressure: { sphere: 'time', magnitude: 0.01 },
    vocabulary: {
      adjectives: ['repeated', 'prophetic', 'drifting', 'cyclical', 'blurred'],
      verbs: ['repeats', 'drifts', 'predicts', 'cycles', 'blurs'],
      nouns: ['echo', 'prophecy', 'repetition', 'drift', 'cycle'],
      atmosphere: [
        'The same moments keep arriving, slightly changed.',
        'Prophecy and memory become indistinguishable.',
        'Time moves, but not quite forward.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Residents of {location} describe strong feelings of having been here before, in this exact conversation.',
          'A young seer in {location} began predicting minor events — correctly — three days in advance.',
          'Yesterday\'s weather returns today in {location}. Not similar — identical.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
];

// ═══════════════════════════════════════════════════════════════════
// CULTURAL OMENS
// ═══════════════════════════════════════════════════════════════════

const CULTURAL_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.cultural.war_drums',
    name: 'War Drums',
    category: 'cultural',
    tagline: 'Smiths work through the night. Everyone is choosing sides.',
    culturalTrigger: { type: 'faction_conflict', threshold: 2 },
    durationRange: [6, 10],
    encounterBias: { duel: 0.3, trade: -0.2 },
    vocabulary: {
      adjectives: ['martial', 'tense', 'divided', 'armed', 'chosen'],
      verbs: ['mobilizes', 'divides', 'sharpens', 'chooses', 'marches'],
      nouns: ['war', 'division', 'drum', 'march', 'faction'],
      atmosphere: [
        'The world has chosen its sides. The choosing is almost done.',
        'Neutrality requires more courage than allegiance right now.',
        'The drums are not yet beating, but everyone can hear them.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Smiths in {location} work through the night. The ringing carries for miles.',
          'A merchant fleeing {location} claims the faction banners have changed — the old colors, the war colors.',
          'Old soldiers in {location} have taken to sitting by the gates again, watching the road.',
        ],
        significance: 0.6,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.cultural.lean_harvest',
    name: 'Lean Harvest',
    category: 'cultural',
    tagline: 'Scarcity. Hard choices. The desperate are dangerous.',
    culturalTrigger: { type: 'low_prosperity', threshold: 30 },
    durationRange: [8, 12],
    encounterBias: { trade: 0.3, assist: -0.1 },
    vocabulary: {
      adjectives: ['scarce', 'desperate', 'lean', 'hungry', 'diminished'],
      verbs: ['empties', 'hungers', 'diminishes', 'pleads', 'takes'],
      nouns: ['scarcity', 'hunger', 'want', 'desperation', 'loss'],
      atmosphere: [
        'There is not enough. Everyone knows it. No one says it yet.',
        'Desperation sharpens what patience once softened.',
        'Hard choices breed harder people.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'The market stalls of {location} are half-empty. The vendors\' smiles don\'t reach their eyes.',
          'Travelers are turned away from {location}\'s inns. The hospitality ran out with the stores.',
          'Children in {location} are quieter than they should be. Hunger teaches silence early.',
        ],
        significance: 0.55,
      },
    ],
    chronicleSignificance: 0.6,
  },
  {
    id: 'omen.cultural.festival_season',
    name: 'Festival Season',
    category: 'cultural',
    tagline: 'Abundance. Celebration. Dangerous complacency.',
    culturalTrigger: { type: 'high_prosperity', threshold: 70 },
    durationRange: [8, 12],
    encounterBias: { social: 0.3, duel: -0.2 },
    vocabulary: {
      adjectives: ['abundant', 'festive', 'complacent', 'generous', 'merry'],
      verbs: ['celebrates', 'feasts', 'ignores', 'laughs', 'relaxes'],
      nouns: ['feast', 'celebration', 'abundance', 'festival', 'comfort'],
      atmosphere: [
        'The world is easy right now. That is worth being worried about.',
        'Comfort makes people slow to notice what is coming.',
        'Laughter is real. The threat is also real.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'The markets of {location} overflow. Merchants are turning away buyers for the first time in memory.',
          'Music plays in {location} past midnight — spontaneous, unorganized, joyful.',
          'Even the guards of {location} are relaxed. This is worth noting.',
        ],
        significance: 0.45,
      },
    ],
    chronicleSignificance: 0.5,
  },
  {
    id: 'omen.cultural.the_unquiet',
    name: 'The Unquiet',
    category: 'cultural',
    tagline: 'Restlessness. Anger. Mob energy crackles at the edges.',
    culturalTrigger: { type: 'high_unrest', threshold: 60 },
    durationRange: [6, 10],
    encounterBias: { duel: 0.2, social: 0.2 },
    vocabulary: {
      adjectives: ['restless', 'angry', 'volatile', 'agitated', 'unquiet'],
      verbs: ['seethes', 'agitates', 'churns', 'spills', 'boils'],
      nouns: ['unrest', 'anger', 'mob', 'agitation', 'volatility'],
      atmosphere: [
        'The crowd is not quite a mob yet. Almost.',
        'Anger without direction is the most dangerous kind.',
        'The spark is missing. For now.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'A crowd gathered in {location} today for no reason anyone can name. They dispersed uneasily.',
          'The guards of {location} have doubled their patrols. They look as uneasy as the crowd.',
          'Someone painted a grievance on the main gate of {location}. It was cleaned. It reappeared.',
        ],
        significance: 0.6,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.cultural.season_of_grief',
    name: 'Season of Grief',
    category: 'cultural',
    tagline: 'Mourning has weight. The community feels its losses.',
    culturalTrigger: { type: 'mass_death', threshold: 3 },
    durationRange: [6, 8],
    encounterBias: { assist: 0.3, duel: -0.2 },
    vocabulary: {
      adjectives: ['mourning', 'fragile', 'grieving', 'tender', 'raw'],
      verbs: ['mourns', 'tends', 'grieves', 'remembers', 'buries'],
      nouns: ['grief', 'mourning', 'loss', 'memory', 'memorial'],
      atmosphere: [
        'The living tend to the living. The dead are remembered.',
        'Grief creates a strange tenderness between strangers.',
        'No one is fighting. Everyone is tired.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Candles burn in windows across {location}. No one organized this. Everyone understood.',
          'The arguments that filled {location}\'s taverns last week have stopped. It doesn\'t feel like peace.',
          'A memorial gathering in {location} drew more people than any celebration in recent memory.',
        ],
        significance: 0.6,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.cultural.age_of_discovery',
    name: 'Age of Discovery',
    category: 'cultural',
    tagline: 'Wonder and ambition. Recklessness follows close behind.',
    culturalTrigger: { type: 'discovery_surge', threshold: 3 },
    durationRange: [8, 12],
    encounterBias: { explore: 0.3 },
    vocabulary: {
      adjectives: ['curious', 'ambitious', 'reckless', 'wondering', 'bold'],
      verbs: ['discovers', 'explores', 'risks', 'ventures', 'uncovers'],
      nouns: ['discovery', 'wonder', 'ambition', 'exploration', 'risk'],
      atmosphere: [
        'What was hidden is being found. What was found is changing everything.',
        'Ambition needs no encouragement right now.',
        'The recklessness that follows wonder is arriving on schedule.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'Three expeditions left {location} this week. Only one filed the required paperwork.',
          'A cartographer in {location} has been working for six days without sleep. She says she is almost done.',
          'Arguments in {location} taverns have shifted from the mundane to the cosmological. Everyone has a theory.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
];

// ═══════════════════════════════════════════════════════════════════
// SEASONAL OMENS — Primary slot fallback when no doom-echo qualifies
// ═══════════════════════════════════════════════════════════════════

const SEASONAL_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.seasonal.the_quiet_before',
    name: 'The Quiet Before',
    category: 'seasonal',
    tagline: 'Potential. Watchfulness. Fragile calm.',
    durationRange: [10, 15],
    encounterBias: { explore: 0.2 },
    vocabulary: {
      adjectives: ['quiet', 'watchful', 'potential', 'fragile', 'still'],
      verbs: ['watches', 'waits', 'holds', 'stills', 'breathes'],
      nouns: ['quiet', 'stillness', 'potential', 'waiting', 'calm'],
      atmosphere: [
        'The world inhales. It has not yet exhaled.',
        'Something waits in the careful silence.',
        'This calm is genuine. It will not last.',
      ],
    },
    beats: [
      {
        interval: 5,
        prose: [
          'The roads near {location} are unusually clear. Travelers move without incident, almost nervously.',
          'The week has been uneventful in {location}. The elders say this is when to be most careful.',
          'The animals of {location}\'s surrounding lands are unnaturally calm. Predators and prey, grazing together.',
        ],
        significance: 0.4,
      },
    ],
    chronicleSignificance: 0.5,
  },
  {
    id: 'omen.seasonal.the_turning',
    name: 'The Turning',
    category: 'seasonal',
    tagline: 'Change accelerates. Choices harden.',
    durationRange: [8, 12],
    encounterBias: { duel: 0.1, social: 0.1 },
    vocabulary: {
      adjectives: ['turning', 'shifting', 'hardening', 'pivoting', 'decisive'],
      verbs: ['shifts', 'turns', 'pivots', 'hardens', 'decides'],
      nouns: ['turning', 'shift', 'pivot', 'momentum', 'change'],
      atmosphere: [
        'Things that were soft are becoming fixed.',
        'The time for uncertainty is passing.',
        'Choices made now will prove difficult to unmake.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'Alliances that had been tentative in {location} are solidifying — or dissolving. Nothing remains middling.',
          'The pace of life in {location} has quickened perceptibly. Everyone seems to be finishing something.',
          'Conversations in {location} end in decisions where before they ended in discussion.',
        ],
        significance: 0.45,
      },
    ],
    chronicleSignificance: 0.5,
  },
  {
    id: 'omen.seasonal.the_long_dark',
    name: 'The Long Dark',
    category: 'seasonal',
    tagline: 'Endurance. Attrition. Grim resolve.',
    durationRange: [8, 12],
    encounterBias: { duel: 0.2 },
    vocabulary: {
      adjectives: ['grim', 'enduring', 'weathered', 'resolved', 'tired'],
      verbs: ['endures', 'persists', 'weathers', 'grinds', 'holds'],
      nouns: ['endurance', 'attrition', 'resolve', 'grinding', 'persistence'],
      atmosphere: [
        'This is not the worst. But it is long.',
        'The world is tired but has not given up.',
        'Endurance is its own form of victory.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'The people of {location} look worn. They also look like they intend to keep going.',
          'Resources in {location} are being rationed carefully. Not desperately — carefully. There is a difference.',
          'Old hymns are being sung in {location} again — the endurance ones, not the celebratory ones.',
        ],
        significance: 0.45,
      },
    ],
    chronicleSignificance: 0.5,
  },
  {
    id: 'omen.seasonal.the_reckoning_hour',
    name: 'The Reckoning Hour',
    category: 'seasonal',
    tagline: 'Urgency. Last chances. No more delays.',
    durationRange: [5, 8],
    encounterBias: { duel: 0.2, social: 0.2 },
    vocabulary: {
      adjectives: ['urgent', 'final', 'last', 'pressing', 'decisive'],
      verbs: ['demands', 'presses', 'rushes', 'concludes', 'forces'],
      nouns: ['urgency', 'deadline', 'finality', 'conclusion', 'last chance'],
      atmosphere: [
        'There is no more time. There never was.',
        'What remains undone must be done now.',
        'The window closes. The moment arrives.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'People in {location} are rushing — finishing old business, making overdue amends, sending long-delayed letters.',
          'A sense of pressure pervades {location} that no one can attribute to any cause.',
          'The light in {location} seems different — more angled, more final, more aware of its own passage.',
        ],
        significance: 0.55,
      },
    ],
    chronicleSignificance: 0.6,
  },
];

// ═══════════════════════════════════════════════════════════════════
// DOOM-ECHO OMENS — The Changing (Chaos/Flux/Identity)
// ═══════════════════════════════════════════════════════════════════

const CHANGING_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.changing.restless_forms',
    name: 'Restless Forms',
    category: 'doom_echo',
    tagline: 'Nothing holds its shape quite right anymore.',
    doomArchetypes: ['changing'],
    doomStageRange: [0, 1],
    durationRange: [10, 15],
    encounterBias: { explore: 0.2 },
    vocabulary: {
      adjectives: ['shifting', 'restless', 'uncertain', 'fluid', 'wrong'],
      verbs: ['shifts', 'flickers', 'blurs', 'changes', 'wavers'],
      nouns: ['flux', 'edge', 'shimmer', 'form', 'drift'],
      atmosphere: [
        'Things are not quite what they were this morning.',
        'The familiar grows strange at the corners of vision.',
        'Stability is a courtesy the world is withdrawing.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'Livestock in {location} give birth to healthy young that look subtly, inexplicably different from their parents. The farmers cannot say how.',
          'A portrait in the great hall of {location} has been changing slowly for weeks. No one agrees on what it used to look like.',
          'Children in {location} play games they claim to have always known. No adult recognizes the rules.',
          'The accent of {location} is drifting. Longtime residents find themselves mispronouncing their own names.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
  {
    id: 'omen.changing.the_slipping',
    name: 'The Slipping',
    category: 'doom_echo',
    tagline: 'Identities blur. The edges that define a self are softening.',
    doomArchetypes: ['changing'],
    doomStageRange: [1, 2],
    durationRange: [8, 12],
    encounterBias: { social: 0.2, duel: -0.1 },
    vocabulary: {
      adjectives: ['blurred', 'uncertain', 'porous', 'borrowed', 'lost'],
      verbs: ['slips', 'bleeds', 'borrows', 'forgets', 'becomes'],
      nouns: ['mask', 'identity', 'self', 'boundary', 'seam'],
      atmosphere: [
        'Who was I before this? The question arrives without warning.',
        'The line between self and other grows difficult to trace.',
        'Borrowed habits. Borrowed faces. Borrowed names.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Two merchants in {location} have been completing each other\'s transactions. Neither has noticed yet.',
          'A soldier returning to {location} found her family greeting her with the wrong name. They insist it has always been so.',
          'The mirror-maker\'s shop in {location} has been closed for days. Locals say they could not bear what the mirrors showed.',
        ],
        significance: 0.6,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.changing.cascade_of_forms',
    name: 'Cascade of Forms',
    category: 'doom_echo',
    tagline: 'Everything is becoming something else. No shape holds.',
    doomArchetypes: ['changing'],
    doomStageRange: [2, 3],
    durationRange: [6, 9],
    encounterBias: { explore: 0.2, trade: -0.2 },
    vocabulary: {
      adjectives: ['cascading', 'unbound', 'transforming', 'volatile', 'raw'],
      verbs: ['transforms', 'cascades', 'erupts', 'unmakes', 'pours'],
      nouns: ['cascade', 'transformation', 'torrent', 'unbinding', 'chaos'],
      atmosphere: [
        'The world cannot hold its own shape. Neither can anything within it.',
        'Change without direction. Transformation without end.',
        'By the time you name it, it is already something else.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The main road into {location} has rerouted itself overnight. The old path is meadow. The new path always was.',
          'Scribes in {location} find their records rewriting themselves between readings. The earlier versions feel more true.',
          'A temple in {location} has changed its dedication three times this week. The priests serve each new god with equal sincerity.',
        ],
        significance: 0.7,
      },
    ],
    chronicleSignificance: 0.75,
  },
  {
    id: 'omen.changing.the_great_unmaking',
    name: 'The Great Unmaking',
    category: 'doom_echo',
    tagline: 'All categories collapse. What was fixed is fluid. What was certain is gone.',
    doomArchetypes: ['changing'],
    doomStageRange: [3, 4],
    durationRange: [5, 7],
    encounterBias: { explore: 0.3, duel: -0.3 },
    vocabulary: {
      adjectives: ['formless', 'dissolved', 'unmoored', 'absolute', 'total'],
      verbs: ['dissolves', 'unmakes', 'abolishes', 'releases', 'ends'],
      nouns: ['dissolution', 'flux', 'formlessness', 'freedom', 'void'],
      atmosphere: [
        'Nothing holds. This is the truth at the center of things.',
        'Was anything ever fixed? The question answers itself.',
        'Formlessness is not destruction. It is the original condition, remembered.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The name of {location} has changed twice today. Residents use both, neither, or a third name that no one introduced.',
          'Laws in {location} no longer bind. Not because they are broken — because the concept has become difficult to hold.',
          'A delegation arrived in {location} seeking someone who no longer exists. They match the description exactly. So does everyone else.',
        ],
        significance: 0.85,
      },
    ],
    chronicleSignificance: 0.9,
  },
];

// ═══════════════════════════════════════════════════════════════════
// DOOM-ECHO OMENS — The Sundering (Force/Division/Severance)
// ═══════════════════════════════════════════════════════════════════

const SUNDERING_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.sundering.hairline_fractures',
    name: 'Hairline Fractures',
    category: 'doom_echo',
    tagline: 'The first cracks. So thin you must lean close to see them.',
    doomArchetypes: ['sundering'],
    doomStageRange: [0, 1],
    durationRange: [10, 14],
    encounterBias: { explore: 0.15 },
    vocabulary: {
      adjectives: ['cracked', 'thin', 'brittle', 'stressed', 'strained'],
      verbs: ['cracks', 'strains', 'splits', 'separates', 'divides'],
      nouns: ['crack', 'fracture', 'seam', 'gap', 'fissure'],
      atmosphere: [
        'Things that have held for years are showing their first flaws.',
        'Small failures. Insignificant, separately.',
        'A map of cracks is a map of what will break next.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'The oldest bridge in {location} has developed a hairline crack down its center. Masons say it is nothing. Masons are worried.',
          'Old friends in {location} find conversation suddenly difficult. They know each other too well to bridge the silence.',
          'Ceramics in {location} fracture along lines that were always there, invisible. Potters cannot explain why now.',
          'A partnership that built {location}\'s market has dissolved quietly. Both parties cite nothing in particular.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
  {
    id: 'omen.sundering.the_severance',
    name: 'The Severance',
    category: 'doom_echo',
    tagline: 'Bonds break. What was joined refuses to hold.',
    doomArchetypes: ['sundering'],
    doomStageRange: [1, 2],
    durationRange: [7, 11],
    encounterBias: { duel: 0.2, social: -0.15 },
    vocabulary: {
      adjectives: ['severed', 'broken', 'cut', 'isolated', 'divided'],
      verbs: ['severs', 'breaks', 'cuts', 'isolates', 'divides'],
      nouns: ['severance', 'break', 'cut', 'isolation', 'division'],
      atmosphere: [
        'Alliances that seemed permanent prove otherwise.',
        'The cut is clean. That is somehow worse.',
        'What bound them is simply gone. No argument, no cause. Simply gone.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'Three families in {location} that have shared a feast-table for generations ate in silence this season. None could say why.',
          'The joint governing council of {location} split overnight — not in argument, but in quiet, mutual incomprehension.',
          'Married couples in {location} report waking beside strangers. The person is unchanged. The recognition is gone.',
        ],
        significance: 0.6,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.sundering.violent_partition',
    name: 'Violent Partition',
    category: 'doom_echo',
    tagline: 'Force does what fracture merely hinted at.',
    doomArchetypes: ['sundering'],
    doomStageRange: [2, 3],
    durationRange: [5, 8],
    encounterBias: { duel: 0.35, trade: -0.25 },
    vocabulary: {
      adjectives: ['violent', 'irreversible', 'forced', 'brutal', 'absolute'],
      verbs: ['shatters', 'rends', 'forces', 'sunders', 'cleaves'],
      nouns: ['shatter', 'rending', 'violence', 'cleavage', 'ruin'],
      atmosphere: [
        'What was merely cracked can no longer pretend to wholeness.',
        'The force is not anger. It is something older than anger.',
        'Every sundering makes the next easier.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The central square of {location} cracked along its length last night. No earthquake was felt. The crack is a yard wide by morning.',
          'Three trade contracts in {location} dissolved simultaneously — the ink, witnesses claim, simply vanished from the parchment.',
          'A war that had been at peace for forty years resumes near {location}. No provocation was offered. None was needed.',
        ],
        significance: 0.7,
      },
    ],
    chronicleSignificance: 0.75,
  },
  {
    id: 'omen.sundering.the_final_division',
    name: 'The Final Division',
    category: 'doom_echo',
    tagline: 'The world splits. No bridge will span what remains.',
    doomArchetypes: ['sundering'],
    doomStageRange: [3, 4],
    durationRange: [4, 6],
    encounterBias: { duel: 0.45, social: -0.35 },
    vocabulary: {
      adjectives: ['final', 'absolute', 'unbridgeable', 'complete', 'permanent'],
      verbs: ['splits', 'divides', 'severs', 'ends', 'completes'],
      nouns: ['chasm', 'abyss', 'finality', 'division', 'end'],
      atmosphere: [
        'Nothing binds. Nothing joins. This is the conclusion of a very long argument.',
        'The world discovers it was always two things, not one.',
        'What separated things is not empty. It is where they were always going.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The road between {location} and its nearest neighbor has disappeared. Not destroyed — simply absent, as if it never was.',
          'Debts owed to {location}\'s creditors are forgiven wholesale — not from mercy, but because the creditors cannot remember why they were owed.',
          'The governing authority of {location} has divided into two factions that cannot perceive each other. Both continue to govern.',
        ],
        significance: 0.85,
      },
    ],
    chronicleSignificance: 0.9,
  },
];

// ═══════════════════════════════════════════════════════════════════
// DOOM-ECHO OMENS — The Failing (Time/Entropy/Exhaustion)
// ═══════════════════════════════════════════════════════════════════

const FAILING_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.failing.rust_and_forgetting',
    name: 'Rust and Forgetting',
    category: 'doom_echo',
    tagline: 'Things deteriorate faster than they should. Memories are the first to go.',
    doomArchetypes: ['failing'],
    doomStageRange: [0, 1],
    durationRange: [10, 15],
    encounterBias: { explore: 0.1 },
    vocabulary: {
      adjectives: ['faded', 'worn', 'rusted', 'forgotten', 'dim'],
      verbs: ['fades', 'rusts', 'wears', 'forgets', 'dims'],
      nouns: ['rust', 'decay', 'forgetting', 'wear', 'fade'],
      atmosphere: [
        'Things age faster when no one is watching.',
        'The past is losing its texture. History grows smooth and featureless.',
        'What was sharp is dulled. What was vivid is grey.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'Tools in {location} rust between one morning and the next. Kept oiled, kept dry — it makes no difference.',
          'A chronicler in {location} found her records from last year indistinct. Not damaged. Simply... less.',
          'Elders of {location} tell stories that grow shorter each telling. They cannot recall why they mattered.',
          'Dyes in {location} fade within days of application. Colors are becoming a memory.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
  {
    id: 'omen.failing.the_forgetting',
    name: 'The Forgetting',
    category: 'doom_echo',
    tagline: 'Skills learned over years vanish in days. Memory is not reliable.',
    doomArchetypes: ['failing'],
    doomStageRange: [1, 2],
    durationRange: [8, 12],
    encounterBias: { social: 0.1, trade: -0.2 },
    vocabulary: {
      adjectives: ['lost', 'blank', 'absent', 'empty', 'eroded'],
      verbs: ['forgets', 'erodes', 'loses', 'empties', 'blanks'],
      nouns: ['forgetting', 'loss', 'absence', 'void', 'erosion'],
      atmosphere: [
        'You reach for a memory and find the shelf bare.',
        'Expertise is not permanent. It is a loan with hidden terms.',
        'The elders do not know what they have forgotten. That is the cruelest part.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'A master craftsman in {location} woke unable to perform work she has done for thirty years. Her hands remember nothing.',
          'The written laws of {location} have become illegible — not damaged, but as if the meaning has drained out of the symbols.',
          'Healers in {location} find themselves unable to recall remedies they knew yesterday. Patients wait in silence.',
        ],
        significance: 0.6,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.failing.things_fall_apart',
    name: 'Things Fall Apart',
    category: 'doom_echo',
    tagline: 'Systems stop. Structures fail. The maintenance is losing.',
    doomArchetypes: ['failing'],
    doomStageRange: [2, 3],
    durationRange: [5, 9],
    encounterBias: { trade: -0.3, explore: 0.15 },
    vocabulary: {
      adjectives: ['collapsed', 'broken', 'exhausted', 'spent', 'failed'],
      verbs: ['collapses', 'fails', 'stops', 'breaks', 'exhausts'],
      nouns: ['collapse', 'failure', 'halt', 'ruin', 'end'],
      atmosphere: [
        'The effort of maintenance is greater than the system can bear.',
        'Not destroyed. Simply done.',
        'There was always an endpoint. This is it, arriving early.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The granary mechanisms of {location} have seized. Engineers sent to repair them cannot determine how they ever functioned.',
          'Fires in {location} require more wood than they produce heat. The math has stopped working.',
          'A mill that has ground grain for two centuries in {location} ground to a halt mid-rotation and refuses to move. The water still flows.',
        ],
        significance: 0.7,
      },
    ],
    chronicleSignificance: 0.75,
  },
  {
    id: 'omen.failing.exhaustion_of_the_age',
    name: 'Exhaustion of the Age',
    category: 'doom_echo',
    tagline: 'The world is tired. It has held on long enough.',
    doomArchetypes: ['failing'],
    doomStageRange: [3, 4],
    durationRange: [5, 7],
    encounterBias: { explore: -0.2, social: -0.2 },
    vocabulary: {
      adjectives: ['exhausted', 'spent', 'ending', 'final', 'done'],
      verbs: ['ends', 'stops', 'yields', 'ceases', 'releases'],
      nouns: ['end', 'exhaustion', 'cessation', 'release', 'conclusion'],
      atmosphere: [
        'Something very old is finally allowed to rest.',
        'Resistance requires effort no one has left.',
        'This is not defeat. It is permission, long overdue.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The oldest person in {location} has stopped eating. Not in despair — in completion. She says the work is done.',
          'Fields near {location} that have produced for generations produce nothing this season. The soil is not dead. It is simply finished.',
          'Every clock and sundial in {location} stopped at the same moment yesterday. No one moved to restart them.',
        ],
        significance: 0.85,
      },
    ],
    chronicleSignificance: 0.9,
  },
];

// ═══════════════════════════════════════════════════════════════════
// DOOM-ECHO OMENS — The Ascension (Spirit/Transcendence/Departure)
// ═══════════════════════════════════════════════════════════════════

const ASCENSION_OMENS: OmenTrackTemplate[] = [
  {
    id: 'omen.ascension.luminous_hunger',
    name: 'Luminous Hunger',
    category: 'doom_echo',
    tagline: 'A longing without object. Something in everyone reaching upward.',
    doomArchetypes: ['ascension'],
    doomStageRange: [0, 1],
    durationRange: [10, 15],
    encounterBias: { social: 0.15, explore: 0.1 },
    vocabulary: {
      adjectives: ['yearning', 'reaching', 'luminous', 'restless', 'hungry'],
      verbs: ['reaches', 'yearns', 'rises', 'hungers', 'longs'],
      nouns: ['longing', 'yearning', 'light', 'height', 'beyond'],
      atmosphere: [
        'Something above the visible is calling.',
        'The ordinary feels unbearably small.',
        'What they want cannot be named. That does not stop the wanting.',
      ],
    },
    beats: [
      {
        interval: 4,
        prose: [
          'Residents of {location} have begun sleeping on their rooftops. They cannot explain the habit, only that the floor feels wrong.',
          'Children in {location} have stopped looking at each other when they speak. They address the sky instead.',
          'A temple in {location} reports its congregation doubling in a week. None of the new attendants know why they came.',
          'The birds over {location} fly in slow ascending spirals until they vanish. None descend.',
        ],
        significance: 0.5,
      },
    ],
    chronicleSignificance: 0.55,
  },
  {
    id: 'omen.ascension.the_rising',
    name: 'The Rising',
    category: 'doom_echo',
    tagline: 'Gravity loosens. Things and people rise beyond their station.',
    doomArchetypes: ['ascension'],
    doomStageRange: [1, 2],
    durationRange: [8, 12],
    encounterBias: { social: 0.25, trade: -0.1 },
    vocabulary: {
      adjectives: ['elevated', 'rising', 'untethered', 'ascending', 'light'],
      verbs: ['rises', 'ascends', 'lifts', 'floats', 'transcends'],
      nouns: ['ascent', 'rise', 'height', 'transcendence', 'departure'],
      atmosphere: [
        'The tether between here and elsewhere is stretching.',
        'Some things are becoming too good for the world they are in.',
        'Gravity is a preference. Some have stopped preferring it.',
      ],
    },
    beats: [
      {
        interval: 3,
        prose: [
          'A monk in {location} has not touched the ground in three days. She is not distressed.',
          'The market prices in {location} have become untenable — not from greed, but because the sellers have lost interest in ordinary value.',
          'Fires in {location} burn upward more steeply than physics allows. Smoke does not dissipate. It ascends with purpose.',
        ],
        significance: 0.6,
      },
    ],
    chronicleSignificance: 0.65,
  },
  {
    id: 'omen.ascension.departure',
    name: 'Departure',
    category: 'doom_echo',
    tagline: 'People leave. Things become unreachable. The worthy are no longer here.',
    doomArchetypes: ['ascension'],
    doomStageRange: [2, 3],
    durationRange: [5, 9],
    encounterBias: { social: -0.2, explore: 0.2 },
    vocabulary: {
      adjectives: ['departed', 'absent', 'gone', 'lost', 'beyond'],
      verbs: ['departs', 'vanishes', 'ascends', 'leaves', 'transcends'],
      nouns: ['departure', 'absence', 'beyond', 'distance', 'void'],
      atmosphere: [
        'They did not die. They simply became unreachable.',
        'The best ones are gone. This is not metaphor.',
        'What remains is not what was. What was has moved on.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The wisest elder of {location} left without explanation three days ago. Her tracks end at a hillside. The hillside is unchanged.',
          'Skilled artisans in {location} are vanishing — two or three per week. Their work remains. They do not.',
          'A delegation seeking the leaders of {location} found only their former offices, still warm, still tidy. Gone.',
        ],
        significance: 0.7,
      },
    ],
    chronicleSignificance: 0.75,
  },
  {
    id: 'omen.ascension.the_hollow_world',
    name: 'The Hollow World',
    category: 'doom_echo',
    tagline: 'Everything worth having has ascended. Only the shell remains.',
    doomArchetypes: ['ascension'],
    doomStageRange: [3, 4],
    durationRange: [5, 7],
    encounterBias: { social: -0.3, explore: 0.3 },
    vocabulary: {
      adjectives: ['hollow', 'empty', 'abandoned', 'remaining', 'left'],
      verbs: ['empties', 'hollows', 'remains', 'persists', 'stays'],
      nouns: ['hollow', 'shell', 'remainder', 'emptiness', 'husk'],
      atmosphere: [
        'This world is an aftermath.',
        'What matters has gone. The rest has been left to sort itself out.',
        'The sky is not empty. It is full — just not of anything still here.',
      ],
    },
    beats: [
      {
        interval: 2,
        prose: [
          'The institutions of {location} continue to operate. No one inside them can explain why, or toward what.',
          'Travelers passing through {location} report a light above the settlement — bright, unreachable, not descending.',
          'The remaining population of {location} seem content in a way that unsettles visitors. They are not waiting for anything anymore.',
        ],
        significance: 0.85,
      },
    ],
    chronicleSignificance: 0.9,
  },
];

// ═══════════════════════════════════════════════════════════════════
// Exported registry
// ═══════════════════════════════════════════════════════════════════

export const OMEN_TEMPLATES: OmenTrackTemplate[] = [
  ...BREACH_OMENS,
  ...CONVERGENCE_OMENS,
  ...RECKONING_OMENS,
  ...CHANGING_OMENS,
  ...SUNDERING_OMENS,
  ...FAILING_OMENS,
  ...ASCENSION_OMENS,
  ...SPHERE_SURGE_OMENS,
  ...CULTURAL_OMENS,
  ...SEASONAL_OMENS,
];

/** Look up a template by its id. Returns undefined if not found. */
export function getOmenTemplateById(id: string): OmenTrackTemplate | undefined {
  return OMEN_TEMPLATES.find(t => t.id === id);
}

/** Get doom-echo templates for a given archetype and doom stage index (0-based). */
export function getDoomEchoTemplates(
  archetype: string,
  stage: number,
): OmenTrackTemplate[] {
  return OMEN_TEMPLATES.filter(
    t =>
      t.category === 'doom_echo' &&
      t.doomArchetypes?.includes(archetype as never) &&
      t.doomStageRange != null &&
      stage >= t.doomStageRange[0] &&
      stage <= t.doomStageRange[1],
  );
}

/** Get sphere-surge templates where sphere dominance meets the trigger threshold. */
export function getEligibleSphereSurgeTemplates(
  sphereDominance: Partial<Record<string, number>>,
): OmenTrackTemplate[] {
  return OMEN_TEMPLATES.filter(t => {
    if (t.category !== 'sphere_surge' || !t.sphereTrigger) return false;
    const dom = sphereDominance[t.sphereTrigger.sphere] ?? 0;
    return dom >= t.sphereTrigger.minDominance;
  });
}

/** Get seasonal templates — used as primary slot fallback. */
export function getSeasonalTemplates(): OmenTrackTemplate[] {
  return OMEN_TEMPLATES.filter(t => t.category === 'seasonal');
}
