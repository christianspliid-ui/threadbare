// Vocabulary lists for the register-compliance scorer (THR-609).
//
// The `rareWordDensity` metric measures **ornate-diction density**: the fraction
// of content tokens drawn from a curated denylist of archaic / latinate /
// ornamental words that signal drift out of the plainspoken baseline register.
//
// Why a denylist, not a common-word allowlist (the plan's first sketch):
// calibration proved a length-gated *allowlist* of common words is far too
// noisy — plainspoken words like "checking", "probability", "caravan",
// "collapsing" are common but would need a multi-thousand-lemma list to avoid
// being scored as "rare". Inverting to a denylist of genuinely ornate words is
// both smaller and robust: plain prose scores ~0, and stacked ornamental diction
// ("parlous", "freighted", "ineffable") scores high. This is faithful to the
// metric's intent — ornate-vocabulary drift as a measurable signal — and is the
// enforcement floor the register model needs.
//
// Pure data. Add words here that read as ornate/archaic in plainspoken register;
// keep genuinely plain vocabulary out. Membership is lowercased.

/** Archaic / latinate / ornamental diction. A token whose lowercase form is in
 *  this set (and is at least RARE_WORD_MIN_LEN long — see registerRubric.ts)
 *  counts toward `rareWordDensity`. */
export const REGISTER_ORNATE_WORDS: ReadonlySet<string> = new Set([
  // Archaic / high-register abstractions
  'parlous', 'freighted', 'covenant', 'covenants', 'ineffable', 'inexorable',
  'inexorably', 'transcendent', 'transcendence', 'sublime', 'sublimity',
  'eldritch', 'otherworldly', 'primordial', 'ephemeral', 'ephemera',
  'gossamer', 'ethereal', 'numinous', 'liminality', 'ambit', 'purview',
  'sepulchral', 'crepuscular', 'tenebrous', 'stygian', 'empyrean', 'celestial',
  'firmament', 'aether', 'aetheric', 'chthonic', 'palimpsest', 'apotheosis',
  'immanent', 'immanence', 'ontological', 'quiescent', 'quiescence',
  'evanescent', 'evanescence', 'diaphanous', 'luminous', 'luminescence',
  'incandescent', 'iridescent', 'opalescent', 'phosphorescent', 'scintillating',
  'coruscating', 'effulgent', 'refulgent', 'lambent', 'pellucid', 'translucent',
  // Ornamental adjectives / participles
  'shimmering', 'gleaming', 'glistening', 'glittering', 'glimmering',
  'shrouded', 'wreathed', 'garlanded', 'bejeweled', 'gilded', 'gossamered',
  'labyrinthine', 'byzantine', 'cyclopean', 'antediluvian', 'immemorial',
  'timeworn', 'careworn', 'sorrowful', 'mournful', 'plaintive', 'wistful',
  'melancholic', 'melancholy', 'lugubrious', 'doleful', 'forlorn', 'desolate',
  'desolation', 'disconsolate', 'inconsolable', 'unfathomable', 'fathomless',
  'boundless', 'measureless', 'limitless', 'infinite', 'eternal', 'everlasting',
  'undying', 'deathless', 'ageless', 'timeless', 'primeval',
  // Latinate verbs / nominalisations that mark elevated register
  'beseech', 'beseeching', 'besought', 'supplicate', 'supplication',
  'venerate', 'veneration', 'consecrate', 'consecration', 'sanctify',
  'sanctification', 'hallowed', 'ordained', 'anointed', 'exalted', 'exaltation',
  'lamentation', 'lamentations', 'benediction', 'malediction', 'imprecation',
  'invocation', 'incantation', 'evocation', 'conjuration', 'divination',
  'augury', 'auguries', 'auspice', 'auspices', 'portentous', 'ominous',
  'foreboding', 'harbinger', 'harbingers', 'presage', 'presaged', 'betoken',
  'betokened', 'bespoke', 'bespeaks',
  // Ornate nouns
  'reverie', 'reveries', 'requiem', 'threnody', 'elegy', 'elegiac', 'dirge',
  'paean', 'panegyric', 'apotheoses', 'effluvium', 'effluvia', 'miasma',
  'miasmic', 'penumbra', 'penumbral', 'umbra', 'nimbus', 'aureole', 'corona',
  'welter', 'skein', 'skeins', 'filigree', 'tracery', 'arabesque', 'chiaroscuro',
  'vestige', 'vestiges', 'vestigial', 'remnant', 'palimpsests',
  // Ornamental abstractions of feeling
  'yearning', 'longing', 'ardor', 'ardour', 'fervor', 'fervour', 'fervent',
  'rapture', 'rapturous', 'ecstasy', 'ecstatic', 'anguish', 'anguished',
  'torment', 'tormented', 'affliction', 'afflicted', 'travail', 'travails',
  'tribulation', 'tribulations', 'lamented', 'grievous', 'grievously',
  // Elevated connective / manner words
  'wherefore', 'whither', 'thither', 'hither', 'henceforth', 'heretofore',
  'notwithstanding', 'peradventure', 'forsooth', 'verily', 'nary', 'oft',
  'ofttimes', 'evermore', 'nevermore', 'aforetime', 'erstwhile', 'quondam',
  // Purple-prose collocation heads (single-word signals; phrase forms handled
  // by the figurative-marker detector)
  'unspoken', 'unbidden', 'unbroken', 'unyielding', 'unfathomed', 'unhallowed',
  'unnumbered', 'untold', 'untrammeled', 'untrammelled', 'ineluctable',
  'ineluctably', 'implacable', 'implacably', 'inviolate', 'immutable',
  'immutability', 'ineradicable', 'irrevocable', 'irrevocably',
]);

/** Domain terms that must never count toward ornate density even if a variant
 *  looks elevated: Reach/Sphere names, UL terms, recurring game vocabulary,
 *  and proper nouns from the graph. Lowercased.
 *
 *  This is the game-specific override layer over REGISTER_ORNATE_WORDS: a word
 *  that reads as elevated in *generic* prose (so it earns its place in the
 *  denylist) but is domain-standard *here* is listed below and never counts as
 *  ornate drift. The two-layer design is intentional (plan §Engine — the rare
 *  metric is "tokens outside a common list, plus a whitelist for game terms:
 *  reach/sphere names, UL terms, proper nouns from the graph"): keep the denylist
 *  general, and record the game-specific exceptions here. Some entries below
 *  (covenant, consecrate, sanctify, hallowed, apotheosis) deliberately shadow
 *  denylist members — the whitelist wins in `isRareToken` (registerCompliance.ts).
 *  THR-609 Pass A calibration. */
export const REGISTER_GAME_TERM_WHITELIST: ReadonlySet<string> = new Set([
  // Reaches
  'iron', 'gold', 'shadow', 'veil', 'heart', 'eye', 'stone', 'star',
  // Spheres
  'chaos', 'order', 'light', 'darkness', 'force', 'mind', 'matter', 'time',
  'energy', 'spirit', 'life', 'entropy',
  // UL / cosmology terms
  'ascendant', 'ascendants', 'quintessence', 'essence', 'reach', 'reaches',
  'sphere', 'spheres', 'doom', 'twilight', 'unmaking', 'mandate', 'threadbare',
  'thread', 'threads', 'worshipper', 'worshippers', 'investiture', 'retinue',
  'sublocation', 'sublocations', 'hex', 'aftermath', 'encounter', 'encounters',
  'vignette', 'vignettes', 'chronicle', 'chronicler', 'echoes', 'echo',
  // --- THR-609 Pass A calibration (game-term overrides of the ornate denylist) ---
  // Faction proper noun (graph): the Lorekeepers Covenant
  // (src/data/lorekeepers-covenant-encounter-content.ts). "Covenant" reads as the
  // faction's name across ~8 encounters, not as archaic diction.
  'covenant', 'covenants',
  // Star-reach faith-action lexicon — the reach's core, deliberately consistent
  // religious-action vocabulary (Consecrate/Sanctify actions, "hallowed ground").
  // Domain-standard verbs a literate player reads without friction, not drift.
  'consecrate', 'consecration', 'sanctify', 'sanctification', 'hallowed',
  // Named game concept: the Aspect apotheosis / capstone encounter
  // ("The Apotheosis", APOTHEOSIS_ENCOUNTER_TEMPLATE_ID; doom-identity matrices).
  'apotheosis', 'apotheoses',
  // Plain compound words carried by fixed graph entity names ("The Gleaming Vein",
  // "The Undying Flame") — Germanic and comprehensible; ornate only when stacked.
  'gleaming', 'undying',
]);
