/**
 * Faction Voice Bible — THR-31 (TB-094)
 *
 * Documentation constants used by the voice lint test and content authors.
 * These entries are NOT read at runtime — they are the design record for
 * how each faction's prose should sound. When writing or reviewing encounter
 * content for a faction, load this file and measure against the entry for
 * that faction.
 *
 * Shape per entry:
 *   tagline       — one-line feel
 *   register      — sentence rhythm, formality, pronoun behaviour
 *   lexicon       — words that should appear; words that must never appear
 *   notices       — what the prose dwells on when this faction is in-frame
 *   silent        — what goes unsaid and lets the reader feel it
 *   costMotif     — how failure lands
 *   exampleSuccess / exampleFailure — benchmark lines
 */

export interface FactionVoiceEntry {
  readonly factionDefId: string;
  readonly tagline: string;
  readonly register: string;
  readonly lexicon: readonly string[];
  readonly neverUse: readonly string[];
  readonly notices: string;
  readonly silent: string;
  readonly costMotif: string;
  readonly exampleSuccess: string;
  readonly exampleFailure: string;
}

export const FACTION_VOICE_BIBLE: readonly FactionVoiceEntry[] = [
  {
    factionDefId: 'thieves_guild',
    tagline: 'Streetwise, sardonic, pragmatic. The guild is a ledger. Honor is whatever keeps the ledger balanced.',
    register: 'Short sentences. Clipped clauses. Second beats that amend the first. Names land as tools: "a fence," "a mark," "the crowd."',
    lexicon: ['ledger', 'take', 'mark', 'hand', 'pocket', 'clean', 'fast', 'crowd', 'slow work', 'earning the door', 'quiet word'],
    neverUse: ['righteous', 'holy', 'sworn', 'grace', 'glory', 'honor'],
    notices: 'Hands. Doors. Who\'s watching whom. What the crowd does with its silence.',
    silent: 'Moralizing. A pickpocket never tells you pickpocketing is wrong.',
    costMotif: 'The ledger remembers. Failure is a debt you now carry; success buys more door than you had an hour ago.',
    exampleSuccess: 'A clean haul. The guild nods. Nothing said out loud.',
    exampleFailure: 'The fence walks. {name} pockets the take and waits for a hungrier buyer.',
  },
  {
    factionDefId: 'arcane_circle',
    tagline: 'Scholarly, obsessive, half in love with the thing that could kill them.',
    register: 'Long sentences interrupted by short verdicts. Commas that act like breath held. Arcane vocabulary used casually, as shop-talk.',
    lexicon: ['resonance', 'calibration', 'fold', 'ley current', 'sigil', 'anomaly', 'elegant', 'clean line', 'pattern holds', 'it does not hold'],
    neverUse: ['demonic', 'evil', 'magic'],
    notices: 'Geometry. Residue. The thing a less-trained eye would dismiss as a draft in the room.',
    silent: 'How afraid they are. Fear in the Circle is an embarrassment, not a confession.',
    costMotif: 'Elegance lost. A failed working is a theorem disproved in public — the mortification is the wound.',
    exampleSuccess: 'The sigil holds. {name} breathes out slowly, the way one does after a correct proof.',
    exampleFailure: 'The fold slips. Every Circle adept within the district feels it — a small, private shame, like a wrong note in a quiet room.',
  },
  {
    factionDefId: 'civic_guard',
    tagline: 'Dutiful, measured, institutional. The city has made a promise and the guard is the promise.',
    register: 'Plain sentences. Procedural nouns. When the prose names a person it names them by title first, not given name.',
    lexicon: ['watch', 'post', 'shift', 'log', 'book', 'gate', 'round', 'what was missed', 'what the city owes', 'what the city is owed'],
    neverUse: ['glory', 'quest', 'adventure'],
    notices: 'Faces that don\'t belong. Doors that should be shut. The time.',
    silent: 'Politics. A guard doesn\'t tell you who\'s in charge, only who\'s not in their jurisdiction.',
    costMotif: 'Something was missed. The prose shows the absence before it shows the consequence — the empty post, the unwatched gate.',
    exampleSuccess: 'The round closes clean. {name} signs the log. Another night on another post.',
    exampleFailure: 'The gate was unwatched for perhaps a quarter-hour. That is how these things begin.',
  },
  {
    factionDefId: 'holy_order_dawn',
    tagline: 'The faithful do not admit doubt. When the prose admits doubt, it shows it in the weather — a cloud across the sun, a candle guttering.',
    register: 'Formal cadence, slight archaism where earned (the Dawn, the faithful, the vigil), but never pastiche. Long assured sentences followed by a short one that carries the cost.',
    lexicon: ['Dawn', 'vigil', 'faithful', 'light', 'shadow', 'oath', 'blade', 'rite', 'cleansing', 'witness', 'bear witness'],
    neverUse: ['pray'],
    notices: 'Light on steel. The pause before an oath. What the penitent does with their hands.',
    silent: 'Doubt, directly. The cost of certainty is shown, not told.',
    costMotif: 'Spiritual stain. Failure is not disappointment — it is something the order\'s rites must now take out of the person.',
    exampleSuccess: '{name} holds the vigil to dawn. The light comes as it always does, for those who wait for it.',
    exampleFailure: '{name} wakes to grey light and the knowledge that the temple was unguarded at the hour the faithful call the Low Watch. The order does not speak of these hours. The rites will, eventually, remember them.',
  },
  {
    factionDefId: 'underking_court',
    tagline: 'Regal, intrigue-laden, old. The Court speaks as if every conversation has been happening for a hundred years.',
    register: 'Measured. Formal address. Euphemism doing work that a direct word would spoil. Names are earned — many NPCs are the page, the chamberlain, the seneschal until their name is spoken by someone with standing.',
    lexicon: ['compact', 'old word', 'throne beneath', 'what is owed', 'what is held in trust', 'courtesy', 'courtesy denied', 'long quiet'],
    neverUse: ['boss', 'kingdom', 'ruler'],
    notices: 'Precedent. Who bowed, who did not. The order of speaking.',
    silent: 'The mechanics of power. The Court assumes the reader already knows what it costs to be standing where they\'re standing.',
    costMotif: 'The old compact notes the trespass. The ledger of the Court is older than any mortal career and patient.',
    exampleSuccess: 'The courtesy is paid. A chamberlain somewhere writes the name {name} beside a date in a book that has no first page.',
    exampleFailure: '{name} leaves without the courtesy done. The Court does not say what this costs. The Court, when it speaks, does not speak of cost.',
  },
  {
    factionDefId: 'builders_fellowship',
    tagline: 'Practical, craft-focused, quietly proud. The Fellowship\'s prose does not moralize — it measures.',
    register: 'Short sentences of plain work. Concrete nouns. Verbs about hands.',
    lexicon: ['work', 'join', 'stone', 'line', 'plumb', 'true', 'square', 'set', 'cure', 'load', 'what will hold'],
    neverUse: ['art', 'mastery'],
    notices: 'The corner that\'s off by a hair. The mortar that hasn\'t cured. The load path.',
    silent: 'Aesthetics as an end. If the prose lingers on beauty, it lingers on structural beauty — symmetry, weight distributed.',
    costMotif: 'The work fails. Something will not hold the weight it was built to hold, and that is the whole of the tragedy.',
    exampleSuccess: 'The join sets clean. {name} runs a thumb along the line and feels only stone.',
    exampleFailure: 'The cure is wrong and {name} knows it before the foreman does. That is the worse of the two knowings.',
  },
  {
    factionDefId: 'rangers_brotherhood',
    tagline: 'Terse, observant, the prose reads as if written by someone on watch.',
    register: 'Sentence fragments when the ranger is moving. Fuller sentences when they are still. Present tense for the observing beat.',
    lexicon: ['sign', 'trail', 'trace', 'track', 'wind', 'bearing', 'line', 'draw', 'ridge', 'dark under trees', 'what the wild permits'],
    neverUse: ['monster'],
    notices: 'Broken grass. Wrong birdsong. A cold print.',
    silent: 'Themselves. The ranger prose tells the reader about the world through a ranger-shaped gap.',
    costMotif: 'The trail goes cold. Or worse: the trail circles back.',
    exampleSuccess: '{name} reads the sign — it is two hours old and going west. The wind will hold. That is enough.',
    exampleFailure: 'The trail doubles on itself. {name} knows, then, that whatever walked this ground has been listening to {them} walking it.',
  },
  {
    factionDefId: 'merchant_consortium',
    tagline: 'Calculating, civil, precise. The Consortium smiles at you and takes a small, clean bite.',
    register: 'Business register with one literary flourish per scene, earned. Numbers do not appear in prose — the prose describes their weight.',
    lexicon: ['terms', 'split', 'margin', 'quiet price', 'handshake', 'book price', 'street price', 'what the room will bear'],
    neverUse: ['greed', 'fair'],
    notices: 'Who\'s nervous. Who\'s bored. Who came alone.',
    silent: 'The actual numbers. The prose describes the feel of a deal, not its arithmetic.',
    costMotif: 'Reputation in the room. A bad deal is a story that outruns you.',
    exampleSuccess: 'The terms are agreed. {name} leaves the room with the lighter purse and the heavier standing — which is, in the Consortium, the better exchange.',
    exampleFailure: '{name} leaves having been read. A bad deal forgives itself in a month. Being read follows {them} from room to room for a year.',
  },
  {
    factionDefId: 'mercenary_company',
    tagline: 'Blunt, professional, darkly funny. Mercenaries do the work and want to be paid.',
    register: 'Plain declaratives. Humor in the noun choice, not in jokes. A skull is head furniture, a coffin is a long box.',
    lexicon: ['contract', 'clause', 'work', 'pay', 'split', 'captain', 'line', 'ground', 'keeping it honest', 'keeping the word'],
    neverUse: ['glory'],
    notices: 'The ground. The numbers on the other side. Where the sun is.',
    silent: 'Cause. The Company doesn\'t care whose cause it is; the prose doesn\'t either.',
    costMotif: 'The pay is short, or the line is thin, or a name is added to the stone outside the barracks.',
    exampleSuccess: 'Clean work, clean pay. {name} walks off the field with the pouch heavy and the promise kept.',
    exampleFailure: 'The captain pays anyway, minus the clause, which is how the Company keeps its word when it can\'t keep the contract.',
  },
  {
    factionDefId: 'lorekeepers_covenant',
    tagline: 'Quiet, precise, patient. The Covenant knows the world forgets and considers that a personal affront.',
    register: 'Scholarly without the Circle\'s obsession. Warm where the Circle is cold — the Covenant loves what it keeps.',
    lexicon: ['record', 'record keeps', 'annal', 'entry', 'margin', 'hand', 'date', 'what was said', 'what was not said', 'what is remembered'],
    neverUse: ['story', 'myth'],
    notices: 'Contradictions between accounts. A date that does not land where it should. A name missing from a margin.',
    silent: 'Emotion about the records themselves, except when a record is destroyed.',
    costMotif: 'The page is lost. A record unkept is a small hole the world falls into later.',
    exampleSuccess: 'The account is taken. {name} signs the margin in the Covenant\'s second hand.',
    exampleFailure: 'The page tears. The Covenant will reconstruct it from other hands, but for one generation something will be remembered slightly wrong.',
  },
  {
    factionDefId: 'temple_of_spheres',
    tagline: 'Mystic, layered, careful. The Temple holds all nine spheres and weighs them against each other constantly.',
    register: 'Measured, often using sphere-vocabulary directly but never ostentatiously. Weight and alignment are load-bearing words.',
    lexicon: ['nine', 'weight', 'alignment', 'turning', 'open sphere', 'closed sphere', 'mote', 'orbit', 'passage'],
    neverUse: ['god'],
    notices: 'Which sphere is loudest in the room. Whose alignment has shifted since last they met.',
    silent: 'Theological quarrels. The Temple\'s quarrels are kept inside the Temple.',
    costMotif: 'An alignment falls off true. The Temple knows this happens and the prose is gentle about it, which makes it worse.',
    exampleSuccess: 'The rite closes with the weight held. {name} leaves the sanctum with the alignment a little more true than it was. The Temple does not praise this. The Temple notices it.',
    exampleFailure: 'The rite holds, but not at the weight {name} intended. The Temple does not say the alignment failed. The Temple asks when {they} would like to come back.',
  },
];

/** Lookup helper: find voice entry by factionDefId */
export function getFactionVoice(factionDefId: string): FactionVoiceEntry | undefined {
  return FACTION_VOICE_BIBLE.find(e => e.factionDefId === factionDefId);
}
