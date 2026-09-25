// THR-1599 prototype — the reusable culture/sphere layer (proto branch only, never merged).
//
// Shape under test: an encounter opening stays authored once. Two short, stated-fact lines
// are appended to its second beat (situation & complication), chosen by keys the graph
// already carries:
//
//   CULTURE_CUSTOMS[foundationBias][reachPrimary]  — how these people handle this kind of
//     trouble. foundationBias is the culture's social contract (chaos = honour and challenge,
//     order = written law, light = open witness, darkness = closed circles; culture-content.ts
//     :70-95), so four foundations × eight reaches covers every encounter in the corpus.
//   SPHERE_FACTS[dominantSphere][reachPrimary]     — what the place's power does to this
//     kind of trouble. Fires only when the place's dominant sphere clears
//     SPHERE_FACT_MIN_AFFINITY, so ordinary places stay plain.
//
// Each line must do a job (Doctrine v2: narrate, state facts, no atmosphere without a job):
// it names a custom, a cost or a pressure that bears on the test. No word substitution into
// authored sentences — THR-1101 removed the `{adj}`/`{verb}` mad-lib shape on purpose.
//
// Placeholders: {actor} {demonym} {culture} {place}. Only the three reaches the sample's
// templates use are written here (iron, stone, eye); the full table is 4 × 8 × 3 variants.

export type Foundation = 'chaos' | 'order' | 'light' | 'darkness';

/** Dominant sphere's share of the place's total sphere score (scores are integer, triangle
 *  scale) at or above which the sphere fact is stated. Set from the measured distribution. */
export const SPHERE_FACT_MIN_SHARE = 0.55;

export const CULTURE_CUSTOMS: Record<Foundation, Partial<Record<string, string[]>>> = {
  chaos: {
    iron: [
      'Among the {demonym}, whoever names a danger first has the right to face it, and three people in {place} have already claimed that right out loud.',
      'The {demonym} settle fear by challenge; if {actor} backs away now, someone else will call it cowardice by nightfall.',
    ],
    stone: [
      'The {demonym} teach a craft by making the student beat the master at it once; the master here has not lost in eleven years.',
      'A {demonym} workshop keeps nothing secret from anyone willing to fight for it, and two rivals are already waiting at the door.',
    ],
    eye: [
      'The {demonym} have no healers\' guild; the loudest remedy wins, and three are being sold in the square this morning.',
      'Among the {demonym}, whoever brings the answer first takes the credit, and a rival is already asking the same questions.',
    ],
  },
  order: {
    iron: [
      '{place} keeps a written ordinance for this: no one approaches until the reeve signs a warrant, and the reeve is two days away.',
      'The {demonym} record every danger in the ward ledger; this one has an entry, a date, and no name beside it.',
    ],
    stone: [
      'The {demonym} guild rolls list who may learn which technique; {actor} is not on it, and the clerk will not bend.',
      'In {place} a craft passes by indenture only; learning it outside the contract carries a fine the guild collects.',
    ],
    eye: [
      'The {demonym} close a sick quarter by ordinance; the order goes out at dusk whether the illness is named or not.',
      'The reeve of {place} wants a written finding, signed and witnessed, before anyone may act on what {actor} learns.',
    ],
  },
  light: {
    iron: [
      'The {demonym} hold that a danger faced in secret is a danger lied about; half of {place} has turned out to watch.',
      'Among the {demonym}, whoever goes in must report everything to the assembly, including what they got wrong.',
    ],
    stone: [
      'The {demonym} teach every craft in the open square; the master will teach {actor}, with the whole town watching every mistake.',
      'A {demonym} craft belongs to everyone, so the secret is no secret; the trouble is that nobody agrees on which version is right.',
    ],
    eye: [
      'The {demonym} name the sick in public; the families on that list have stopped opening their doors.',
      'The assembly of {place} meets tomorrow and will hear whatever {actor} has found, true or not.',
    ],
  },
  darkness: {
    iron: [
      'The {demonym} do not speak of this thing outside the circle; the circle knows what it is and has chosen not to say.',
      'In {place}, whoever learns what lives here is bound to silence by an oath older than the town.',
    ],
    stone: [
      'The {demonym} pass a craft by initiation; the last step is taught only to those the circle has tested, and {actor} has not been tested.',
      'The {demonym} master will teach the method but not the reason for it, and the reason is the part that matters.',
    ],
    eye: [
      'The {demonym} tend their sick behind closed doors, and the circle will not say how many there are.',
      'A tribunal of {place} already knows the cause of this and has decided the answer is not for outsiders.',
    ],
  },
};

export const SPHERE_FACTS: Partial<Record<string, Partial<Record<string, string[]>>>> = {
  life: {
    iron: ['{place} sits on a life-heavy ground; whatever this is, it heals faster than it can be hurt.'],
    stone: ['Life runs strong in {place}; the local craft works in living material, and a mistake kills the stock.'],
    eye: ['Life runs strong in {place}; the sickness grows faster here, and so does the recovery.'],
  },
  matter: {
    iron: ['{place} stands on matter-heavy ground; the thing is bound into the stone itself and cannot be driven out, only broken with it.'],
    stone: ['Matter is strong in {place}; the local stone and ore take a shape once and will not take another.'],
    eye: ['Matter is strong in {place}; the illness lives in the wells and the cellars, not in the air.'],
  },
  darkness: {
    iron: ['Darkness holds {place}; the thing cannot be seen in daylight, only in what it leaves behind.'],
    stone: ['Darkness holds {place}; the local craft is worked at night, and nobody who has watched it done will describe it.'],
    eye: ['Darkness holds {place}; the sick hide their symptoms, and the count everyone quotes is too low.'],
  },
  order: {
    iron: ['Order holds {place}; the thing keeps a schedule, and it has missed none in living memory.'],
    stone: ['Order holds {place}; the craft has one correct method, and the master can tell at a glance when it is broken.'],
    eye: ['Order holds {place}; the illness spreads along the trade roads in a pattern that someone could map.'],
  },
};

// The four spheres SPHERE_VOCABULARY (src/data/narrative-content.ts:35) lacks. Same shape as
// its eight entries (10 adjectives, 10 past-tense verbs, 10 nouns), because the narrative
// engine's routine event prose reads them and falls back to ['unknown'] (narrative.ts:67).
// CULTURAL_PROSE_PALETTES (culture-content.ts:2274) already covers all 12 with present-tense
// verbs and no nouns; these are consistent with it.
export const MISSING_SPHERE_VOCABULARY = {
  chaos: {
    adjectives: ['unbound', 'reckless', 'shifting', 'lawless', 'feral', 'jagged', 'roiling', 'wayward', 'restless', 'unruly'],
    verbs: ['broke loose', 'scattered', 'upended', 'unravelled', 'splintered', 'overturned', 'ran wild', 'tore free', 'spilled', 'defied'],
    nouns: ['upheaval', 'riot', 'breach', 'storm', 'whim', 'rupture', 'uproar', 'wildness', 'fracture', 'tumult'],
  },
  order: {
    adjectives: ['lawful', 'measured', 'exact', 'ranked', 'sworn', 'orderly', 'fixed', 'binding', 'ruled', 'unbending'],
    verbs: ['decreed', 'ranked', 'bound', 'codified', 'ruled', 'aligned', 'sealed', 'ordained', 'arranged', 'enforced'],
    nouns: ['law', 'ledger', 'oath', 'decree', 'rank', 'pattern', 'charter', 'statute', 'measure', 'hierarchy'],
  },
  light: {
    adjectives: ['bright', 'revealing', 'open', 'radiant', 'plain', 'clear', 'searing', 'unhidden', 'dawnlit', 'witnessed'],
    verbs: ['revealed', 'exposed', 'lit', 'uncovered', 'proclaimed', 'dawned', 'illuminated', 'showed', 'witnessed', 'laid bare'],
    nouns: ['dawn', 'witness', 'beacon', 'truth', 'glare', 'lantern', 'daylight', 'proof', 'testimony', 'signal'],
  },
  darkness: {
    adjectives: ['hidden', 'veiled', 'secret', 'sworn-silent', 'shrouded', 'closed', 'lightless', 'unspoken', 'buried', 'guarded'],
    verbs: ['concealed', 'buried', 'hid', 'veiled', 'silenced', 'shrouded', 'withheld', 'swallowed', 'masked', 'kept'],
    nouns: ['secret', 'shadow', 'silence', 'vault', 'oath', 'cellar', 'mask', 'night', 'hiding place', 'confidence'],
  },
} as const;

export function pick<T>(arr: readonly T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

export function fill(line: string, vars: Record<string, string>): string {
  return line.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
