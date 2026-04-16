/**
 * Complication Templates — THR-20
 *
 * ~72 templates across 9 categories × 3 severities.
 * Each template has 3–4 prose variants in Threadbare voice:
 * present tense, close third-person, sensory and specific,
 * with forward-hook implications.
 *
 * Placeholder tokens: {name} {possessive} {witness} {location} {faction} {omen_atmosphere}
 */

import type { ComplicationTemplate } from '../types/complication';

export const COMPLICATION_TEMPLATES: ComplicationTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // WITNESS — someone saw the failure
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.witness.quiet_note',
    category: 'witness',
    name: 'Noted in Passing',
    reachAffinity: ['heart', 'shadow', 'gold'],
    severity: 'minor',
    requires: { witnessesPresent: true },
    effects: [{ type: 'trust_decay', magnitude: 0.02, target: 'random_present' }],
    proseTemplates: [
      'Someone noticed. {witness} looked away too quickly — the kind of discretion that remembers.',
      '{witness} said nothing. But {witness} saw, and silence in {location} has its own language.',
      'A glance from {witness}, unreadable. {name} files it away as something to address.',
      'The moment passed unmarked, or seemed to. {witness} has a long memory in this town.',
    ],
    significanceBoost: 0.0,
  },

  {
    id: 'complication.witness.agent_leverage',
    category: 'witness',
    name: 'Witnessed Failure',
    reachAffinity: ['heart', 'shadow', 'gold'],
    severity: 'standard',
    requires: { witnessesPresent: true },
    effects: [{ type: 'trust_decay', magnitude: 0.06, target: 'random_present' }],
    proseTemplates: [
      '{witness} was watching. {name} could see it in the set of {possessive} shoulders — filing it away, or worse, already composing the telling. The failure will travel.',
      'The fumble didn\'t go unnoticed. {witness} saw everything — the pitch too eager, the moment that collapsed — and something behind {possessive} eyes said: useful.',
      '{name} looked up too late. {witness} stood at the edge of things, close enough to hear it all. The silence afterward was heavier than it should have been.',
      'There are no private failures in {location}. {witness} had a perfect angle on it, and {possessive} expression said clearly: this is information.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.witness.faction_notes',
    category: 'witness',
    name: 'Faction Takes Notice',
    reachAffinity: ['heart', 'shadow', 'gold'],
    severity: 'standard',
    requires: { factionRelationship: true },
    effects: [{ type: 'reputation_delta', factionScope: 'local', delta: -0.05 }],
    proseTemplates: [
      'Word reaches {faction} — another fumble under their banner. The report will be dry and accurate, which is worse than contempt.',
      'Someone in {faction} keeps a record of these things. Today adds a line. The line won\'t be forgotten.',
      '{name} can already picture the {faction} report: concise, accurate, unflattering. These things circulate.',
      'The {faction} intelligence is thorough. They noticed, and noticing is the beginning of consequences.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.witness.public_shame',
    category: 'witness',
    name: 'Public Humiliation',
    reachAffinity: ['heart', 'shadow', 'gold'],
    severity: 'severe',
    requires: { witnessesPresent: true, atSettlement: true },
    effects: [
      { type: 'attachment', templateId: 'condition.humiliated', duration: 8 },
      { type: 'reputation_delta', factionScope: 'all_present', delta: -0.10 },
    ],
    proseTemplates: [
      '{name} is still standing in {location}, but something has changed. The settlement saw. Faces that were neutral are now calculating — some with sympathy, most with the particular appetite of people who witnessed something they\'ll describe for weeks.',
      'It happens in front of everyone. The market doesn\'t stop — it only quiets, the way crowds quiet when something worth watching occurs. {name} will carry this into every conversation in {location} from now on.',
      'There is no recovering this in front of {location}. The people here remember. They\'ll mention it — casually, in the way that isn\'t casual at all.',
      'The gathering made it official. {name} failed in front of witnesses who have names, and names talk.',
    ],
    significanceBoost: 0.3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCAR — the agent carries a mark
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.scar.humbled',
    category: 'scar',
    name: 'Stung Pride',
    reachAffinity: ['heart', 'shadow', 'iron'],
    severity: 'minor',
    effects: [{ type: 'quintessence_delta', delta: -0.01 }],
    proseTemplates: [
      'A small humiliation, quickly buried. The sting lingers past the moment — a persistent awareness that the world noticed.',
      '{name} walks away with the particular weight of failure that doesn\'t look like failure from the outside.',
      'It wasn\'t dramatic. Nothing to point at. Just the quiet internal knowledge that something didn\'t work, and the cost of pretending otherwise.',
      'The error is past, but {name}\'s attention turns inward. A brief, uncomfortable accounting.',
    ],
    significanceBoost: 0.0,
  },

  {
    id: 'complication.scar.shaken',
    category: 'scar',
    name: 'Shaken',
    reachAffinity: ['iron', 'heart', 'veil'],
    severity: 'standard',
    effects: [{ type: 'attachment', templateId: 'condition.shaken', duration: 5 }],
    proseTemplates: [
      '{name} walks away from it unsteady. Not visibly, not to anyone watching — but {possessive} hands aren\'t quite still, and {possessive} attention keeps catching on nothing.',
      'The path back through {location} is familiar, but something about the night feels wrong-edged. {name} checks twice where once was enough.',
      'It was just a failure. But failure has texture — this one pressed on something that doesn\'t let go easily. {possessive} next action will start from this.',
      '{name} is intact. But intact is not the same as steady, and steady matters more than it seems until suddenly it doesn\'t.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.scar.wounded',
    category: 'scar',
    name: 'Wounded',
    reachAffinity: ['iron', 'stone'],
    severity: 'severe',
    requires: { reachIn: ['iron', 'stone'] },
    effects: [
      { type: 'attachment', templateId: 'condition.wounded', duration: 10 },
      { type: 'quintessence_delta', delta: -0.03 },
    ],
    proseTemplates: [
      'Blood on {possessive} hands — {possessive} own this time. The wound isn\'t fatal. It\'s the kind of injury that announces itself every time {name} needs to move.',
      '{name} gets it wrong at the critical moment. The cost is physical: {possessive} body disagrees with the outcome, and will continue to disagree for some time.',
      'The failure wrote itself onto {possessive} body. {name} will carry this for days — a constant reminder that effort and outcome aren\'t the same thing.',
      '{possessive} shoulder. Or ribs. Somewhere specific, somewhere that matters. The wound is mundane and the timing is not.',
    ],
    significanceBoost: 0.3,
  },

  {
    id: 'complication.scar.haunted',
    category: 'scar',
    name: 'Haunted Thought',
    reachAffinity: ['veil', 'eye', 'heart'],
    severity: 'standard',
    effects: [{ type: 'attachment', templateId: 'condition.haunted', duration: 6 }],
    proseTemplates: [
      'It doesn\'t sit right. {name} turns the failure over — in the walk back from {location}, in the silence before sleep. Something was wrong that they can\'t name.',
      'The moment keeps returning. Not as regret exactly, but as a puzzle: what was the thing that {name} almost saw?',
      '{possessive} mind catches on it like cloth on a nail. There\'s something there — in what happened, in what didn\'t — that demands to be understood.',
      'The failure had the quality of a symptom. {name} isn\'t sure of what.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.scar.exhausted',
    category: 'scar',
    name: 'Spent',
    reachAffinity: ['iron', 'veil', 'star'],
    severity: 'severe',
    effects: [
      { type: 'attachment', templateId: 'condition.exhausted', duration: 8 },
      { type: 'quintessence_delta', delta: -0.02 },
    ],
    proseTemplates: [
      '{name} gave everything. It wasn\'t enough, and now there\'s nothing left. {possessive} capability didn\'t fail — it emptied.',
      'The failure cost more than the attempt warranted. {name} is standing, but only barely, and the next few days will require conservation.',
      '{possessive} resources aren\'t depleted — they\'re gone. Not the comfortable tiredness of honest work, but the hollow kind that comes from expenditure without return.',
      'Every failed working costs something that doesn\'t come back quickly. {name} measures the gap between effort and outcome.',
    ],
    significanceBoost: 0.2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RIVAL ATTENTION — a rival or faction takes notice
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.rival_attention.circling',
    category: 'rival_attention',
    name: 'Something Noticed',
    reachAffinity: ['shadow', 'iron', 'star'],
    severity: 'minor',
    effects: [{ type: 'rival_awareness', delta: 0.05 }],
    proseTemplates: [
      'Somewhere, something turns its attention. The failure made a sound that traveled.',
      'The failure is visible to those who track these things. Which is to say: it is visible.',
      'A ripple in the wrong direction. Someone with interests opposite to {name}\'s took note.',
      'Unseen by {name}, something catalogues the failure. The accounting begins.',
    ],
    significanceBoost: 0.0,
  },

  {
    id: 'complication.rival_attention.hostile_interest',
    category: 'rival_attention',
    name: 'Hostile Interest',
    reachAffinity: ['shadow', 'iron', 'star'],
    severity: 'standard',
    effects: [{ type: 'rival_awareness', delta: 0.15 }],
    proseTemplates: [
      'The failure is useful to someone. {name} can feel the shape of it — the way an exposed position becomes a target. Something with interests contrary to theirs has noticed.',
      'Rival intelligence is thorough. The stumble in {location} entered their ledger. The ledger produces consequences.',
      'Somewhere in the faction networks {name} navigates, this will be read as opportunity. Which side of the opportunity they stand on depends on what comes next.',
      'There are watchers everywhere. Today, the watchers had something worth watching.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.rival_attention.attention_arrives',
    category: 'rival_attention',
    name: 'Targeted',
    reachAffinity: ['shadow', 'iron', 'star'],
    severity: 'severe',
    effects: [
      { type: 'rival_awareness', delta: 0.30 },
      { type: 'reputation_delta', factionScope: 'local', delta: -0.05 },
    ],
    proseTemplates: [
      'The failure was demonstrable enough to change assessments. Someone who was watching with mild interest is now watching with active attention. The quality of their interest is not friendly.',
      '{name} has moved from background noise to specific concern. Rival factions update their plans accordingly. This has consequences.',
      'Precision attention arrives. The failure was large enough to shift someone from indifference to action. {name} will feel this in the coming encounters — a pressure that wasn\'t there before.',
      'Something that was dormant woke up. The failure was exactly the kind of signal it had been waiting for.',
    ],
    significanceBoost: 0.3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DEBT — a cost deferred, not avoided
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.debt.small_obligation',
    category: 'debt',
    name: 'Owing',
    reachAffinity: ['gold', 'heart', 'veil'],
    severity: 'minor',
    effects: [{ type: 'quintessence_delta', delta: -0.01 }],
    proseTemplates: [
      '{name} owes something — small, unspecified, the kind of debt that accumulates in favors.',
      'The failure extracted a price. Not obvious, not large — but present. Something is owed.',
      'Someone helped without being asked. That kind of help always carries a note.',
      '{name} got out of it, technically. The getting-out cost something unspoken.',
    ],
    significanceBoost: 0.0,
  },

  {
    id: 'complication.debt.obligation',
    category: 'debt',
    name: 'Obligation Created',
    reachAffinity: ['gold', 'heart', 'veil'],
    severity: 'standard',
    requires: { witnessesPresent: true },
    effects: [
      { type: 'relates_to_create', basis: 'debt', targetSelection: 'random_present' },
      { type: 'quintessence_delta', delta: -0.02 },
    ],
    proseTemplates: [
      '{name} owes {witness}. It\'s clear even if nothing was said — the debt was established in the silence, in the moment {witness} chose not to make things worse.',
      'The failure put {name} in debt to {witness}. Not in a way that\'s been named. That makes it harder, not easier.',
      '{witness} was present when the failure happened. That creates an accounting that doesn\'t appear in any ledger but both parties know is open.',
      'Obligations form in the negative space of failure. {witness} saw and didn\'t speak. The silence cost {name} something.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.debt.costly_bailout',
    category: 'debt',
    name: 'Costly Rescue',
    reachAffinity: ['gold', 'heart', 'veil'],
    severity: 'severe',
    requires: { factionRelationship: true },
    effects: [
      { type: 'relates_to_create', basis: 'debt', targetSelection: 'faction' },
      { type: 'quintessence_delta', delta: -0.04 },
      { type: 'reputation_delta', factionScope: 'local', delta: -0.03 },
    ],
    proseTemplates: [
      '{faction} cleaned it up. {name} didn\'t ask them to — which is either the story of someone with allies, or someone who has just taken on a debt that will be called at the worst possible moment.',
      'The failure required intervention. {faction} provided it, with the efficiency of organizations that keep track of what they\'ve done for you.',
      '{faction} absorbs the cost. Their accounting is thorough. This will not be forgotten — not as punishment, but as a fact that becomes leverage at the right moment.',
      'Someone from {faction} was there. Handled it. Smiled. {name} understood, without needing to be told, that they now owe something.',
    ],
    significanceBoost: 0.3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COLLATERAL SUCCESS — something else happened instead
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.collateral_success.unintended_gift',
    category: 'collateral_success',
    name: 'Unintended Benefit',
    reachAffinity: ['eye', 'gold', 'shadow'],
    severity: 'minor',
    effects: [{ type: 'partial_progress', fraction: 0.3 }],
    proseTemplates: [
      'Not what {name} intended, but not nothing either. Something that wasn\'t the goal became briefly useful.',
      'The failure produced something sideways. {name} files it: imprecise, but potentially valuable.',
      'Wrong answer, right direction. The attempt failed, but the attempt revealed something.',
      'The path forked wrong, but the fork wasn\'t entirely wasted.',
    ],
    significanceBoost: 0.0,
  },

  {
    id: 'complication.collateral_success.accidental_bond',
    category: 'collateral_success',
    name: 'Accidental Kinship',
    reachAffinity: ['eye', 'gold', 'shadow'],
    severity: 'standard',
    requires: { witnessesPresent: true },
    effects: [
      { type: 'relates_to_create', basis: 'bond', targetSelection: 'random_present' },
    ],
    proseTemplates: [
      'In failing together, {name} and {witness} found unexpected common ground. Failure has a way of stripping pretense.',
      'The miscalculation was shared. {witness} had been in this position too — {name} could see it in how they reacted, with recognition rather than distance.',
      'It went wrong in front of {witness}. But the way it went wrong, and the way {witness} responded, cleared something between them.',
      '{name} expected distance after the failure. Instead, {witness} nodded as if to say: I know this particular experience. It was oddly steadying.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.collateral_success.wrong_discovery',
    category: 'collateral_success',
    name: 'Wrong Discovery',
    reachAffinity: ['eye', 'star', 'shadow'],
    severity: 'standard',
    effects: [{ type: 'discovery', discoveryType: 'information' }],
    proseTemplates: [
      'The search failed — but {name} found something else entirely. The thing being hunted wasn\'t here. The thing found instead might matter more.',
      '{name} came looking for one thing and left knowing something that wasn\'t on the agenda. The failure reoriented the search.',
      'Wrong answer to the wrong question, which turns out to be the right question. {name} didn\'t find what {possessive} was looking for. {possessive} found something the absence was pointing at.',
      'The objective was clear and wrong. What {name} turned up instead has implications that the original goal lacked.',
    ],
    significanceBoost: 0.2,
  },

  {
    id: 'complication.collateral_success.accidental_reputation',
    category: 'collateral_success',
    name: 'Accidental Renown',
    reachAffinity: ['gold', 'heart', 'star'],
    severity: 'severe',
    effects: [
      { type: 'discovery', discoveryType: 'information' },
      { type: 'reputation_delta', factionScope: 'local', delta: 0.05 },
    ],
    proseTemplates: [
      'The failure was spectacular enough to become a story. {name} didn\'t intend it. But in {location}, spectacle has its own value, and being the subject of a story — even a failure story — means people know the name.',
      'It went wrong so specifically, so completely, that it became interesting. {name} is now known in {location} for something they didn\'t plan. That isn\'t necessarily bad.',
      'The attempt failed. The failure demonstrated something about the nature of the attempt that made people curious rather than dismissive.',
      'There\'s a kind of reputation that can only come from visible failure. {name} has acquired some of it.',
    ],
    significanceBoost: 0.2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCATION FALLOUT — the place is changed
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.location_fallout.ripple',
    category: 'location_fallout',
    name: 'Local Tension',
    reachAffinity: ['stone', 'iron', 'gold'],
    severity: 'minor',
    effects: [{ type: 'unrest_delta', delta: 2 }],
    proseTemplates: [
      'The failure leaves a residue. {location} feels slightly different — a tension that wasn\'t there before.',
      'People in {location} are more careful now, the way they get careful after something goes visibly wrong.',
      'Small adjustments: the way the market stalls close a little earlier, the way people route slightly wider around certain corners.',
      '{location} absorbed the consequence. It will process it slowly, the way places do.',
    ],
    significanceBoost: 0.0,
  },

  {
    id: 'complication.location_fallout.disruption',
    category: 'location_fallout',
    name: 'Settlement Disruption',
    reachAffinity: ['stone', 'iron', 'gold'],
    severity: 'standard',
    requires: { atSettlement: true },
    effects: [
      { type: 'unrest_delta', delta: 6 },
      { type: 'prosperity_delta', delta: -3 },
    ],
    proseTemplates: [
      '{location} is worse for this. The failure wasn\'t contained — it bled into the settlement\'s daily workings. Some disruptions recover quickly. This one will take time.',
      'The damage runs through {location} like a crack. Commerce slows. People argue about causes. The failure, in becoming a local event, magnified.',
      '{name} didn\'t intend for {location} to bear the cost. But the failure happened here, and here bears the cost.',
      'Settlements process failure at the community level. {location} is processing this one visibly: tighter faces, shorter conversations, more closed doors.',
    ],
    significanceBoost: 0.2,
  },

  {
    id: 'complication.location_fallout.lasting_damage',
    category: 'location_fallout',
    name: 'Lasting Damage',
    reachAffinity: ['stone', 'iron', 'gold'],
    severity: 'severe',
    effects: [
      { type: 'unrest_delta', delta: 12 },
      { type: 'prosperity_delta', delta: -8 },
    ],
    proseTemplates: [
      '{location} took the hit for this. The failure wasn\'t a thing that happened and passed — it restructured something. People will remember the before and the after.',
      'The consequence of the failure falls on {location}, which didn\'t deserve it and can\'t avoid it. The settlement absorbs what it must. It does not forget.',
      '{name}\'s failure became {location}\'s problem. The relationship between actor and place — between what one person does and what a hundred people experience — runs in directions that aren\'t always visible until they aren\'t.',
      'What happened here will change {location} for some time. Not catastrophically. But measurably, stubbornly, in ways that accumulate.',
    ],
    significanceBoost: 0.3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BROKEN TRUST — a relationship is damaged
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.broken_trust.distance',
    category: 'broken_trust',
    name: 'Growing Distance',
    reachAffinity: ['heart', 'shadow', 'gold'],
    severity: 'minor',
    requires: { witnessesPresent: true },
    effects: [{ type: 'trust_decay', magnitude: 0.03, target: 'random_present' }],
    proseTemplates: [
      'Something shifted. {witness} didn\'t say anything, but {name} felt the small recalibration — a fraction of openness, quietly removed.',
      'The failure cost a degree of warmth. {witness} will still exchange words with {name}. But the exchange will be different.',
      'Not a rupture. A cooling. {witness} stores this, not as a grudge exactly, but as updated information about {name}.',
      'Trust adjusts by small amounts in both directions. This was a small amount downward.',
    ],
    significanceBoost: 0.0,
  },

  {
    id: 'complication.broken_trust.disappointment',
    category: 'broken_trust',
    name: 'Disappointed Trust',
    reachAffinity: ['heart', 'shadow', 'gold'],
    severity: 'standard',
    requires: { witnessesPresent: true },
    effects: [{ type: 'trust_decay', magnitude: 0.08, target: 'random_present' }],
    proseTemplates: [
      '{witness} had expectations. They were specific, they were reasonable, and the failure didn\'t meet them. The aftermath is the particular quiet of someone reassessing.',
      'The failure cost {name} something with {witness} that won\'t rebuild quickly. Disappointment is more durable than anger.',
      '{witness} is still there. But the version of {witness} that was fully in {name}\'s corner has taken a step back. Not permanent. Not nothing.',
      'There was trust, and then there was a moment, and now there\'s slightly less trust. That\'s the accounting of it.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.broken_trust.faction_rupture',
    category: 'broken_trust',
    name: 'Alliance Strained',
    reachAffinity: ['heart', 'shadow', 'gold'],
    severity: 'severe',
    requires: { factionRelationship: true },
    effects: [
      { type: 'trust_decay', magnitude: 0.12, target: 'faction_leader' },
      { type: 'reputation_delta', factionScope: 'local', delta: -0.06 },
    ],
    proseTemplates: [
      '{faction} made an investment. Today was a return on that investment, and the return was negative. The relationship between {name} and {faction} is operating now from a weaker position.',
      'The {faction} alliance isn\'t broken. It\'s strained. There\'s a difference, but it\'s a distinction that requires maintenance to preserve.',
      'The failure happened in front of the {faction} relationship, which means it happened inside it. They are recalculating.',
      '{name} could feel it in the way the {faction} representative ended the meeting — not coldly, but with the visible effort of someone managing disappointment professionally.',
    ],
    significanceBoost: 0.3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PARTIAL PROGRESS — the goal advanced, but wrong
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.partial_progress.incomplete',
    category: 'partial_progress',
    name: 'Close, Not Enough',
    reachAffinity: ['eye', 'gold', 'star'],
    severity: 'minor',
    effects: [{ type: 'partial_progress', fraction: 0.2 }],
    proseTemplates: [
      'Not what was needed. But not nothing. {name} moved part of the way toward the objective, and part of the way is somewhere.',
      'The attempt found the edge of the goal without reaching it. That edge will be easier to find next time.',
      'Close isn\'t success. It\'s also not the same as empty-handed. {name} files the partial result.',
      'The failure preserved something: a direction, a starting point that\'s closer than before.',
    ],
    significanceBoost: 0.0,
  },

  {
    id: 'complication.partial_progress.wrong_direction',
    category: 'partial_progress',
    name: 'Misdirected Effort',
    reachAffinity: ['eye', 'gold', 'star'],
    severity: 'standard',
    effects: [{ type: 'partial_progress', fraction: 0.15 }],
    proseTemplates: [
      '{name} advanced, but sideways. The objective shifted; the effort followed the wrong signal.',
      'Progress happened in the wrong direction. The destination is no closer; the path is now different.',
      'The attempt made inroads into something adjacent to the goal. That adjacency might be meaningful or might complicate things further.',
      '{name} was moving. It was the wrong movement. That distinction matters, but it isn\'t the same as no movement at all.',
    ],
    significanceBoost: 0.1,
  },

  {
    id: 'complication.partial_progress.redirected_ambition',
    category: 'partial_progress',
    name: 'Redirected Purpose',
    reachAffinity: ['eye', 'star', 'veil'],
    severity: 'severe',
    effects: [
      { type: 'partial_progress', fraction: 0.1 },
      { type: 'quintessence_delta', delta: -0.02 },
    ],
    proseTemplates: [
      'The failure revealed that the objective was the wrong one. {name} pursued the goal with full commitment; the failure showed them where that commitment had been aimed.',
      'What {name} was trying to do didn\'t work. What {name} discovered in the process is that the trying was pointed at something that wasn\'t the actual problem.',
      'The attempt collapsed, but the collapse was diagnostic. {name} now has information about what wasn\'t going to work, which — in the right framing — is information about what might.',
      'Severe failure has a clarifying quality. {name} has less than before. They also understand something they didn\'t understand before the loss.',
    ],
    significanceBoost: 0.2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WORSENING CONVERGENCE — the doom clock noticed
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'complication.worsening_convergence.thread_fray',
    category: 'worsening_convergence',
    name: 'Thread Frays',
    reachAffinity: ['veil', 'star'],
    severity: 'minor',
    requires: { minDoomStage: 1 },
    effects: [{ type: 'quintessence_delta', delta: -0.02 }],
    proseTemplates: [
      'Another thread frays. The weave grows thinner. The failure wasn\'t large, but the accumulation is.',
      'The doom doesn\'t rush. It waits for exactly this kind of moment — small failures, one by one.',
      'Not a crisis. Just the pressure that comes from {omen_atmosphere} applying itself to a moment of weakness.',
      'The failure aligned with something already moving. It accelerated the direction that was already established.',
    ],
    significanceBoost: 0.05,
  },

  {
    id: 'complication.worsening_convergence.doom_echo',
    category: 'worsening_convergence',
    name: 'Doom Noticing',
    reachAffinity: ['veil', 'star'],
    severity: 'standard',
    requires: { minDoomStage: 2 },
    effects: [
      { type: 'doom_micro_tick', magnitude: 0.3 },
      { type: 'sphere_pressure', sphere: 'veil', magnitude: 0.1 },
    ],
    proseTemplates: [
      'The failure ripples outward, and something in the deep dark answers. The doom clock didn\'t accelerate dramatically — it just... moved. {name} felt it, though they couldn\'t say how.',
      'The convergence is not indifferent. {name}\'s failure was exactly the kind of signal it was waiting for: a weak moment, an opening. The pressure increases.',
      '{omen_atmosphere} intensified in the moment of failure. {name} felt the texture of the world change — briefly, specifically, in a direction they didn\'t choose.',
      'Doom doesn\'t need dramatic moments. It builds through accumulation. Today\'s failure added its weight to the accumulation.',
    ],
    significanceBoost: 0.2,
  },

  {
    id: 'complication.worsening_convergence.breach_advances',
    category: 'worsening_convergence',
    name: 'Breach Advances',
    reachAffinity: ['veil', 'star', 'iron'],
    severity: 'severe',
    requires: { minDoomStage: 2 },
    effects: [
      { type: 'doom_micro_tick', magnitude: 0.5 },
      { type: 'sphere_pressure', sphere: 'veil', magnitude: 0.2 },
      { type: 'unrest_delta', delta: 5 },
    ],
    proseTemplates: [
      'The failure opened a channel that wasn\'t there before. {name} tried to push back; the push created exactly the opening that needed to be avoided. The doom clock didn\'t just move — it found the failure and used it.',
      'What was meant as resistance became traction for what it was resisting. The ritual, the attempt, the reach for control — each of these, in failing, fed something that runs the other way. The convergence advances.',
      '{omen_atmosphere} arrives in the room where the failure happened. Not literally — but {name} feels it: the characteristic quality of something that has been growing in the dark and has just decided this place is interesting.',
      'The ward didn\'t hold. The attempt to hold it created a new weakness. The breach is learning the shape of {location}\'s vulnerabilities in real time.',
    ],
    significanceBoost: 0.4,
  },

  {
    id: 'complication.worsening_convergence.omen_resonance',
    category: 'worsening_convergence',
    name: 'Omen Resonance',
    reachAffinity: ['veil', 'star'],
    severity: 'standard',
    requires: { activeOmenCategory: 'doom_echo' },
    effects: [
      { type: 'doom_micro_tick', magnitude: 0.25 },
      { type: 'quintessence_delta', delta: -0.02 },
    ],
    proseTemplates: [
      'The active omen found the failure like a key finding a lock. {omen_atmosphere} and this specific stumble were well-matched.',
      '{name} failed under {omen_atmosphere}. These things resonate when they align. The resonance is costly.',
      'The doom agenda doesn\'t wait for climax — it takes these small offerings too. A failure under an active omen is weighted differently.',
      'The omen amplified the failure\'s signal. Something heard it. Something always hears when the signal is strong enough.',
    ],
    significanceBoost: 0.2,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // Additional templates to reach target density
  // ═══════════════════════════════════════════════════════════════════════════

  // Witness — minor additional
  {
    id: 'complication.witness.recorded',
    category: 'witness',
    name: 'On Record',
    reachAffinity: ['shadow', 'gold', 'star'],
    severity: 'minor',
    effects: [{ type: 'trust_decay', magnitude: 0.01, target: 'random_present' }],
    proseTemplates: [
      'Someone filed this. It exists now in whatever system they maintain.',
      'The failure is on record somewhere. Records are consulted.',
      '{name} has been noted. The nature of the notation isn\'t yet clear.',
      'Intelligence systems are patient. This has been added to them.',
    ],
    significanceBoost: 0.0,
  },

  // Scar — minor additional
  {
    id: 'complication.scar.hesitation',
    category: 'scar',
    name: 'Learned Hesitation',
    reachAffinity: ['heart', 'iron', 'shadow'],
    severity: 'minor',
    effects: [{ type: 'quintessence_delta', delta: -0.01 }],
    proseTemplates: [
      'The failure installed a hesitation. Next time the same situation arrives, {name} will pause where they didn\'t before.',
      'A small edit to how {name} moves through the world. The moment was instructive.',
      'Not fear. Caution. The updated kind that comes from a specific lesson.',
      '{name} won\'t make this mistake again. The cost of that guarantee was the current mistake.',
    ],
    significanceBoost: 0.0,
  },

  // Rival attention — minor additional
  {
    id: 'complication.rival_attention.whispers',
    category: 'rival_attention',
    name: 'Whisper Network',
    reachAffinity: ['shadow', 'heart'],
    severity: 'minor',
    effects: [{ type: 'rival_awareness', delta: 0.03 }],
    proseTemplates: [
      'The failure made the whisper network. Not prominently — just a mention.',
      '{name}\'s name has entered a conversation it wasn\'t in before.',
      'Someone heard this and passed it along to someone who finds it useful.',
      'These things travel faster than people expect, and further than they intend.',
    ],
    significanceBoost: 0.0,
  },

  // Debt — minor additional
  {
    id: 'complication.debt.informal',
    category: 'debt',
    name: 'Informal Debt',
    reachAffinity: ['heart', 'gold'],
    severity: 'minor',
    effects: [{ type: 'quintessence_delta', delta: -0.01 }],
    proseTemplates: [
      'The kind of debt that doesn\'t have a name, but both parties recognize.',
      'An informal obligation. Not binding. Not nothing.',
      '{name} accepted help that wasn\'t offered — received it silently, as these things go.',
      'A small accounting, kept by someone other than {name}.',
    ],
    significanceBoost: 0.0,
  },

  // Collateral success — minor additional
  {
    id: 'complication.collateral_success.side_effect',
    category: 'collateral_success',
    name: 'Side Effect',
    reachAffinity: ['eye', 'shadow'],
    severity: 'minor',
    effects: [{ type: 'partial_progress', fraction: 0.25 }],
    proseTemplates: [
      'The attempt missed its target and hit something adjacent. The adjacent thing is worth noting.',
      'Wrong result, useful residue.',
      'The failure had a side effect that isn\'t useless.',
      '{name} didn\'t accomplish what was intended. {name} accomplished something else.',
    ],
    significanceBoost: 0.0,
  },

  // Broken trust — minor additional
  {
    id: 'complication.broken_trust.cooled',
    category: 'broken_trust',
    name: 'Cooled',
    reachAffinity: ['heart', 'gold'],
    severity: 'minor',
    effects: [{ type: 'trust_decay', magnitude: 0.02, target: 'random_present' }],
    proseTemplates: [
      'The temperature between {name} and the situation dropped a degree.',
      'Something small eroded. The erosion is subtle; the accumulation is not.',
      'Not a break. A cooling. These have different repair requirements.',
      'Trust doesn\'t shatter at this scale. It retreats.',
    ],
    significanceBoost: 0.0,
  },

  // Partial progress — minor additional
  {
    id: 'complication.partial_progress.false_start',
    category: 'partial_progress',
    name: 'False Start',
    reachAffinity: ['star', 'eye'],
    severity: 'minor',
    effects: [{ type: 'partial_progress', fraction: 0.1 }],
    proseTemplates: [
      'The approach was wrong. The need behind it wasn\'t. {name} begins from a different angle.',
      'First attempts tell you what doesn\'t work. This was a first attempt.',
      'The failure is information. {name} is slightly better oriented than before.',
      'Wrong path. The destination is still valid.',
    ],
    significanceBoost: 0.0,
  },

  // Location fallout — minor
  {
    id: 'complication.location_fallout.mood',
    category: 'location_fallout',
    name: 'Shifted Mood',
    reachAffinity: ['stone', 'gold', 'heart'],
    severity: 'minor',
    effects: [{ type: 'unrest_delta', delta: 1 }],
    proseTemplates: [
      '{location} is slightly less comfortable than before.',
      'The mood of {location} absorbed the failure and shifted accordingly.',
      'Something went wrong here, and places remember.',
      '{location} has a different quality now. Minor. Noticeable to {name}.',
    ],
    significanceBoost: 0.0,
  },

  // Additional severe templates for variety

  {
    id: 'complication.scar.marked',
    category: 'scar',
    name: 'Marked',
    reachAffinity: ['shadow', 'veil', 'iron'],
    severity: 'severe',
    effects: [
      { type: 'attachment', templateId: 'condition.marked', duration: 12 },
      { type: 'rival_awareness', delta: 0.10 },
    ],
    proseTemplates: [
      'Something about the failure left a mark that isn\'t visible but is present. {name} carries it forward.',
      'The world noticed. Not people — or not only people. Something older and less specific registered the failure, and {name} is now distinct in its attention.',
      'The failure crossed a threshold. {name} is different now in some way that will matter.',
      '{omen_atmosphere} pressed itself into the failure\'s negative space. {name} came out of it carrying something.',
    ],
    significanceBoost: 0.3,
  },

  {
    id: 'complication.rival_attention.hunting',
    category: 'rival_attention',
    name: 'Being Hunted',
    reachAffinity: ['shadow', 'iron'],
    severity: 'severe',
    requires: { minDoomStage: 1 },
    effects: [
      { type: 'rival_awareness', delta: 0.25 },
      { type: 'attachment', templateId: 'condition.hunted', duration: 10 },
    ],
    proseTemplates: [
      'The failure gave them something to track. {name} has gone from ambient concern to active objective in the faction calculations of someone with resources and patience.',
      'Someone has decided that the failure represents opportunity. They are going to pursue that opportunity. {name} is the opportunity.',
      'The quality of attention changed. It\'s no longer general surveillance; it\'s specific, named, organized.',
      'There are factions that wait for exactly this kind of moment. One of them has identified it.',
    ],
    significanceBoost: 0.4,
  },

  {
    id: 'complication.debt.ruinous',
    category: 'debt',
    name: 'Ruinous Debt',
    reachAffinity: ['gold', 'heart'],
    severity: 'severe',
    effects: [
      { type: 'quintessence_delta', delta: -0.05 },
      { type: 'relates_to_create', basis: 'debt', targetSelection: 'random_present' },
      { type: 'reputation_delta', factionScope: 'all_present', delta: -0.05 },
    ],
    proseTemplates: [
      'The failure extracted a price that will be difficult to pay. {name} owes something real now — not a favor, not an understanding, but a specific obligation with a specific cost.',
      'The cost of the failure wasn\'t immediate. It was structured. {name} understands, with the particular clarity of someone counting what they have left, that this will take time to clear.',
      'Debts at this scale don\'t remain quiet. They accumulate pressure. {name} has acquired one.',
      'The failure cost {name} something they\'ll need later. The need will arrive at a moment that isn\'t convenient.',
    ],
    significanceBoost: 0.4,
  },

  {
    id: 'complication.location_fallout.ruin',
    category: 'location_fallout',
    name: 'Place Scarred',
    reachAffinity: ['stone', 'iron', 'veil'],
    severity: 'severe',
    effects: [
      { type: 'unrest_delta', delta: 15 },
      { type: 'prosperity_delta', delta: -12 },
      { type: 'discovery', discoveryType: 'location' },
    ],
    proseTemplates: [
      '{location} is scarred. The failure wasn\'t contained to the person who made it — it wrote itself into the place, and now everyone who comes here will enter through what happened.',
      'The consequence of the failure fell entirely on {location}, which had nothing to do with the reason for the attempt. This is the quality of catastrophic failure: its distribution is rarely fair.',
      'What happened here will define {location} for longer than anyone intends. Not permanently — places recover. But not quickly.',
      '{name} caused damage to something they cannot repair alone. {location} will process this without them.',
    ],
    significanceBoost: 0.5,
  },
];
