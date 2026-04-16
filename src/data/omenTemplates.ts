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
// Exported registry
// ═══════════════════════════════════════════════════════════════════

export const OMEN_TEMPLATES: OmenTrackTemplate[] = [
  ...BREACH_OMENS,
  ...CONVERGENCE_OMENS,
  ...RECKONING_OMENS,
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
