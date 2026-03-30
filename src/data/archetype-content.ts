/**
 * Archetype Content Package — 19 narrative archetypes from the content strategy.
 *
 * Each agent is assigned one archetype during world generation. The archetype
 * influences prose tone, story shape, reach affinities, beat patterns, and
 * narrative context.
 *
 * Source: Docs/plans/2026-03-06-content-strategy.md
 */

import type { ReachDomain } from '../types/traits';
import type { NarrativeEventType, NarrativeTier } from '../types/narrative';

// ─── Supporting Interfaces ───────────────────────────────────────

export interface ToneKeywords {
  adjectives: string[];
  verbs: string[];
  sentenceRhythm: string;
}

export interface NarrativeRequirement {
  category: 'artifact' | 'location' | 'character' | 'faction';
  tags: string[];
  required: boolean;
  culturallyShape: boolean;
}

export interface BeatPattern {
  eventTypes: NarrativeEventType[];
  minimumTier: NarrativeTier;
  promoteTo?: NarrativeTier;
  narrativeRequirements: NarrativeRequirement[];
  contextPreferences: string[];
}

// ─── Main Archetype Interface ───────────────────────────────────

export interface NarrativeArchetype {
  id: string;
  name: string;
  storyShape: string;
  proseTone: string;
  reachAffinities: ReachDomain[];
  toneKeywords: ToneKeywords;
  beatPatterns: BeatPattern[];
  vignetteSeeds: string[];
  narrativeRequirements: NarrativeRequirement[];
}

// ─── Archetype Definitions ──────────────────────────────────────

export const NARRATIVE_ARCHETYPES: NarrativeArchetype[] = [
  {
    id: 'tragic_hero',
    name: 'Tragic Hero',
    storyShape: 'Rise, hubris, fall',
    proseTone: 'Grand, foreboding, inevitable',
    reachAffinities: ['iron', 'veil', 'heart'],
    toneKeywords: {
      adjectives: ['grand', 'doomed', 'magnificent', 'fatal', 'towering', 'inexorable'],
      verbs: ['rose', 'defied', 'shattered', 'overreached', 'blazed', 'consumed'],
      sentenceRhythm: 'Long opening clause, short devastating conclusion. Let grandeur build before the fall.',
    },
    beatPatterns: [
      {
        eventTypes: ['actor_death'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'artifact', tags: ['legendary', 'cursed'], required: false, culturallyShape: false },
          { category: 'character', tags: ['heir', 'witness'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['at peak power', 'surrounded by witnesses', 'in sacred location'],
      },
      {
        eventTypes: ['action_critical', 'trait_lost'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['symbol of power', 'keepsake'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['prideful action', 'irreversible choice', 'moment of blindness'],
      },
    ],
    vignetteSeeds: [
      'The histories remember {name} as a colossus of their age, one whose reach exceeded even the gods. They say {name} defied the very laws that bound mortals, and for that defiance the world itself rose up. The ending was written before the beginning.',
      '{name} stood at the apex, glory-crowned and terrible. In that moment, all things seemed possible. But the seeds of ruin were already sown in the soil of their triumph.',
      'None sing of {name} now without a dirge in their voice. Even victory tasted of ashes in the end. They reached for immortality and found only stone.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['legendary weapon', 'cursed relic', 'symbol of power'], required: true, culturallyShape: false },
      { category: 'location', tags: ['monument', 'battlefield', 'throne'], required: true, culturallyShape: true },
      { category: 'character', tags: ['rival', 'heir', 'witness to fall'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'trickster',
    name: 'Trickster',
    storyShape: 'Schemes, reversals, ironic justice',
    proseTone: 'Wry, quick, darkly comic',
    reachAffinities: ['shadow', 'gold', 'heart'],
    toneKeywords: {
      adjectives: ['sly', 'quicksilver', 'impudent', 'sardonic', 'mercurial', 'sharp'],
      verbs: ['slipped', 'twisted', 'upended', 'deceived', 'improvised', 'dodged'],
      sentenceRhythm: 'Quick, clipped sentences. Wry asides. The punchline lands dry.',
    },
    beatPatterns: [
      {
        eventTypes: ['contested_action', 'action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['disguise', 'tool of deception'], required: false, culturallyShape: false },
          { category: 'location', tags: ['hidden passage', 'market', 'den'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['against a stronger foe', 'for personal gain', 'with audience watching'],
      },
      {
        eventTypes: ['action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['mark', 'rival trickster', 'victim'], required: false, culturallyShape: false },
        ],
        contextPreferences: ['elaborate setup payoff', 'reversal of fortunes', 'ironic consequence'],
      },
    ],
    vignetteSeeds: [
      'The ballads about {name} change with each telling. Perhaps that is fitting. {name} made a living in the spaces between truth and lies, and never once looked back.',
      '{name}\'s schemes were legendary among those who knew the stories worth stealing. The cleverest were those nobody even realized had happened until the coin was already spent.',
      'They say {name} could sell a gravedigger a resurrection. Whether {name} ever used that power for anything noble depends entirely on who\'s telling the tale.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['disguise', 'hidden tool', 'forgery'], required: true, culturallyShape: false },
      { category: 'location', tags: ['hidden passage', 'den', 'marketplace'], required: false, culturallyShape: true },
      { category: 'character', tags: ['mark', 'rival', 'fence'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'coming_of_age',
    name: 'Coming of Age',
    storyShape: 'Innocence, hardening, transformation',
    proseTone: 'Wonder fading to resolve',
    reachAffinities: ['star', 'veil', 'eye'],
    toneKeywords: {
      adjectives: ['wide-eyed', 'trembling', 'untested', 'bright', 'determined', 'raw'],
      verbs: ['stumbled', 'reached', 'awakened', 'hardened', 'stepped', 'learned'],
      sentenceRhythm: 'Start soft and wondering. Let sentences grow blunter as innocence fades.',
    },
    beatPatterns: [
      {
        eventTypes: ['trait_acquired'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['first weapon', 'rite token'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['from mentor', 'under fire', 'through sacrifice'],
      },
      {
        eventTypes: ['tier_transition'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['mentor', 'peer', 'threat'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['step into adulthood', 'prove their worth', 'cross threshold'],
      },
    ],
    vignetteSeeds: [
      '{name} entered the world wide-eyed and full of hope. The world, in its turn, had harder lessons to teach. By the time {name} learned them all, there was almost nothing left of that wonder—almost, but not quite.',
      'The child {name} once was seems a stranger to the person {name} became. Some nights, {name} can still hear that child\'s voice, asking questions with answers nobody wants to give.',
      '{name} learned fast: that kindness can be a liability, that strength is earned in blood, that growing up means accepting losses you can never undo.',
    ],
    narrativeRequirements: [
      { category: 'character', tags: ['mentor', 'older rival', 'guide'], required: true, culturallyShape: true },
      { category: 'artifact', tags: ['first weapon', 'rite token', 'family keepsake'], required: false, culturallyShape: true },
      { category: 'location', tags: ['threshold', 'school', 'battlefield'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'brooding_warrior',
    name: 'Brooding Warrior',
    storyShape: 'Burden, endurance, reluctant action',
    proseTone: 'Terse, heavy, physical',
    reachAffinities: ['iron', 'stone', 'star'],
    toneKeywords: {
      adjectives: ['heavy', 'scarred', 'weary', 'silent', 'relentless', 'grim'],
      verbs: ['endured', 'bore', 'struck', 'shouldered', 'ground', 'persisted'],
      sentenceRhythm: 'Short. Blunt. Physical. The body carries what the words won\'t say.',
    },
    beatPatterns: [
      {
        eventTypes: ['actor_death'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'artifact', tags: ['scarred weapon', 'battle-worn armor'], required: false, culturallyShape: false },
          { category: 'location', tags: ['battlefield', 'last stand'], required: true, culturallyShape: false },
        ],
        contextPreferences: ['in combat', 'protecting others', 'against overwhelming odds'],
      },
      {
        eventTypes: ['action_critical', 'contested_action'],
        minimumTier: 'notable',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['rival', 'comrade', 'enemy'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['grinding struggle', 'no choice left', 'final defiance'],
      },
    ],
    vignetteSeeds: [
      '{name} moved through the world like a man carrying stones in both pockets. The world had cut deep, and {name} had learned not to flinch. Flinching never changed anything.',
      'They called {name} strong. {name} did not consider strength a virtue. Strength was simply what remained after everything soft had been worn away.',
      '{name}\'s hands had killed and built and held the dying. If there was a soul beneath all that scar tissue, only {name} knew where to look.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['scarred weapon', 'war-worn armor', 'grave marker'], required: true, culturallyShape: false },
      { category: 'location', tags: ['battlefield', 'grave', 'memorial'], required: false, culturallyShape: true },
      { category: 'character', tags: ['fallen comrade', 'rival warrior', 'dependent'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'fallen_noble',
    name: 'Fallen Noble',
    storyShape: 'Lost glory, bitter wisdom, possible redemption',
    proseTone: 'Weary, sharp-edged, proud',
    reachAffinities: ['gold', 'heart', 'shadow'],
    toneKeywords: {
      adjectives: ['faded', 'bitter', 'proud', 'threadbare', 'sharp-eyed', 'wistful'],
      verbs: ['remembered', 'endured', 'condescended', 'clung', 'surveyed', 'sneered'],
      sentenceRhythm: 'Sentences that start with dignity and end with loss. A faint echo of past grandeur in every clause.',
    },
    beatPatterns: [
      {
        eventTypes: ['trait_lost', 'tier_transition'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['faded insignia', 'lost heirloom', 'portrait'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['loss of status', 'final echo of power', 'moment of truth'],
      },
      {
        eventTypes: ['contested_action'],
        minimumTier: 'notable',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['old enemy', 'former peer', 'aspirant'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['pride versus necessity', 'guarding secrets', 'impossible choice'],
      },
    ],
    vignetteSeeds: [
      'The great houses have better things to discuss than {name} now. Once, {name}\'s name opened every door. Now it merely closes them faster. {name} remembers both clearly.',
      '{name} could still recite the lineage backward and forward, all those branches of power that had withered on their particular tree. Knowledge that served no purpose except to hollow the days.',
      'There was a time {name} wore the weight of expectation like a crown. Now {name} wore it like a curse. The difference was a matter of perspective and very little else.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['faded insignia', 'lost heirloom', 'family seal'], required: true, culturallyShape: true },
      { category: 'location', tags: ['ruined estate', 'empty manor', 'memorial'], required: false, culturallyShape: true },
      { category: 'character', tags: ['loyal retainer', 'old rival', 'ambitious heir'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'true_believer',
    name: 'True Believer',
    storyShape: 'Faith tested, vindicated or shattered',
    proseTone: 'Fervent, intense, certain',
    reachAffinities: ['veil', 'star', 'heart'],
    toneKeywords: {
      adjectives: ['fervent', 'burning', 'absolute', 'righteous', 'unwavering', 'zealous'],
      verbs: ['proclaimed', 'knelt', 'defied', 'sanctified', 'condemned', 'sacrificed'],
      sentenceRhythm: 'Declarative. Certain. Sentences that brook no doubt, until doubt arrives.',
    },
    beatPatterns: [
      {
        eventTypes: ['doom_escalation'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'artifact', tags: ['holy relic', 'sacred text'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['faith tested utterly', 'moment of revelation', 'sacrifice demanded'],
      },
      {
        eventTypes: ['trait_lost', 'actor_death'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'location', tags: ['shrine', 'heretical place', 'sacred ground'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['defending the faith', 'divine punishment', 'martyrdom'],
      },
    ],
    vignetteSeeds: [
      '{name} knew the truth with a certainty that made doubt seem like a foreign language. This absolute conviction was {name}\'s greatest strength and, perhaps, their final blindness.',
      'When {name} spoke of the divine, the heavens themselves seemed to listen. Or so {name} believed. The gap between belief and truth was a chasm only {name} could not see.',
      '{name} burned with the light of conviction so bright it threw harsh shadows everywhere else. Those shadows held secrets {name} would never find in that eternal glare.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['holy relic', 'sacred text', 'shrine artifact'], required: true, culturallyShape: true },
      { category: 'location', tags: ['shrine', 'sacred ground', 'heretical place'], required: false, culturallyShape: true },
      { category: 'character', tags: ['coreligionist', 'heretic', 'divine messenger'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'schemer',
    name: 'Schemer',
    storyShape: 'Webs of manipulation, delayed payoffs',
    proseTone: 'Cold, precise, calculating',
    reachAffinities: ['shadow', 'gold', 'heart'],
    toneKeywords: {
      adjectives: ['cold', 'precise', 'patient', 'hidden', 'calculating', 'methodical'],
      verbs: ['maneuvered', 'positioned', 'leveraged', 'betrayed', 'anticipated', 'arranged'],
      sentenceRhythm: 'Measured. Each sentence places a piece. The reader sees the trap close only in the final clause.',
    },
    beatPatterns: [
      {
        eventTypes: ['contested_action', 'action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['mark', 'partner', 'dupe'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['elaborate setup', 'perfect timing', 'invisible hand'],
      },
      {
        eventTypes: ['action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['secret document', 'leverage', 'key'], required: false, culturallyShape: false },
        ],
        contextPreferences: ['years in planning', 'multiple contingencies', 'flawless execution'],
      },
    ],
    vignetteSeeds: [
      '{name} had learned long ago that patience was a weapon sharper than steel. Every piece in place. Every move anticipated. Every outcome inevitable.',
      'Those who underestimated {name} learned quickly that {name} had been five steps ahead, with escape routes planned for contingencies that hadn\'t even occurred to them yet.',
      'The beautiful thing about {name}\'s schemes was their invisibility. When the trap closed, the mark never saw {name} at all. By then, {name} was already three schemes deeper into the future.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['secret document', 'leverage', 'poison'], required: false, culturallyShape: false },
      { category: 'location', tags: ['hidden meeting place', 'spy network', 'den'], required: false, culturallyShape: true },
      { category: 'character', tags: ['mark', 'partner', 'rival schemer'], required: true, culturallyShape: true },
    ],
  },

  {
    id: 'wanderer',
    name: 'Wanderer',
    storyShape: 'Rootless, observing, stumbling into consequence',
    proseTone: 'Detached, laconic, then suddenly urgent',
    reachAffinities: ['star', 'eye', 'shadow'],
    toneKeywords: {
      adjectives: ['distant', 'road-worn', 'laconic', 'watchful', 'rootless', 'wary'],
      verbs: ['drifted', 'observed', 'stumbled', 'departed', 'wandered', 'arrived'],
      sentenceRhythm: 'Loose, drifting cadence. Then a sudden short sentence when consequence arrives.',
    },
    beatPatterns: [
      {
        eventTypes: ['action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'location', tags: ['crossroads', 'foreign land', 'threshold'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['by chance', 'in passing', 'unexpected encounter'],
      },
      {
        eventTypes: ['trait_acquired'],
        minimumTier: 'notable',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['stranger', 'fellow drifter', 'local'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['lesson learned on the road', 'gift from a stranger', 'knowledge acquired'],
      },
    ],
    vignetteSeeds: [
      '{name} had walked so many roads that the road had become {name}. To stay in one place was to cease being {name} entirely. The world made sense only when seen from outside it.',
      'Few people remembered {name} after {name} left. {name} preferred it that way. Memory was another form of chains, and {name} had never worn chains willingly.',
      '{name} had learned every continent\'s secrets simply by passing through. {name} carried those secrets lightly, knowing they belonged to no one, least of all to {name}.',
    ],
    narrativeRequirements: [
      { category: 'location', tags: ['crossroads', 'foreign land', 'forgotten path'], required: false, culturallyShape: true },
      { category: 'artifact', tags: ['foreign trinket', 'travel-worn item', 'stranger\'s gift'], required: false, culturallyShape: true },
      { category: 'character', tags: ['fellow wanderer', 'local guide', 'stranger with debt'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'monster',
    name: 'Monster',
    storyShape: 'Inhuman acts, possibly with buried humanity',
    proseTone: 'Brutal, unflinching, occasionally tender',
    reachAffinities: ['iron', 'star', 'shadow'],
    toneKeywords: {
      adjectives: ['brutal', 'unflinching', 'massive', 'pitiless', 'raw', 'terrible'],
      verbs: ['crushed', 'tore', 'devoured', 'loomed', 'destroyed', 'consumed'],
      sentenceRhythm: 'Flat and heavy. No flourish. Violence described with the plainness of weather.',
    },
    beatPatterns: [
      {
        eventTypes: ['actor_death'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'character', tags: ['witness', 'victim', 'adversary'], required: false, culturallyShape: false },
        ],
        contextPreferences: ['at the peak of power', 'surrounded by devastation', 'defiant to the end'],
      },
      {
        eventTypes: ['action_critical', 'contested_action'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'location', tags: ['devastated land', 'scar', 'graveyard'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['overwhelming force', 'unstoppable advance', 'primal fury'],
      },
    ],
    vignetteSeeds: [
      '{name} was not a person in the way others understood the word. {name} was a force, a tide of destruction that wore flesh like an old coat. What lived beneath that meat was not human.',
      'The lands {name} walked through were marked by {name}\'s passage as surely as if they had been seared by flame. Centuries would pass before the grass grew tall again in those places.',
      'Some whispered that {name} had once been mortal. Those whispers died when {name} tore the tongues from their mouths. Some things are better left unknown.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['trophy of conquest', 'remnant of victim'], required: false, culturallyShape: false },
      { category: 'location', tags: ['scar', 'devastated land', 'graveyard'], required: true, culturallyShape: true },
      { category: 'character', tags: ['fearful witness', 'sole survivor', 'desperate hunter'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'folk_hero',
    name: 'Folk Hero',
    storyShape: 'Unlikely champion, beloved by common people',
    proseTone: 'Warm, earthy, darkly funny',
    reachAffinities: ['heart', 'stone', 'gold'],
    toneKeywords: {
      adjectives: ['stubborn', 'calloused', 'warm', 'unlikely', 'plain-spoken', 'generous'],
      verbs: ['stood', 'laughed', 'shared', 'rallied', 'persisted', 'endured'],
      sentenceRhythm: 'Earthy and warm. Humor arrives naturally. Gallows comedy earns its place through the character.',
    },
    beatPatterns: [
      {
        eventTypes: ['action_critical', 'contested_action'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['community', 'common folk', 'witness'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['against the powerful', 'for the helpless', 'with others watching'],
      },
      {
        eventTypes: ['tier_transition'],
        minimumTier: 'notable',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'location', tags: ['marketplace', 'gathering place', 'common ground'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['reluctant elevation', 'popular will', 'unexpected destiny'],
      },
    ],
    vignetteSeeds: [
      '{name} came from nothing and made a difference anyway. The common folk remember {name} because {name} never forgot where {name} came from. That memory was worth more than any crown.',
      'They sing about {name} in taverns where common folk drink. The songs are true, though the singers add humor to soften the edges. {name} would appreciate that.',
      '{name} had calluses on their hands from real work and a heart that refused to harden all the way. It was this combination that made {name} dangerous to those in power.',
    ],
    narrativeRequirements: [
      { category: 'character', tags: ['common folk', 'friend', 'dependent'], required: true, culturallyShape: true },
      { category: 'artifact', tags: ['common tool', 'humble gift', 'token of gratitude'], required: false, culturallyShape: true },
      { category: 'location', tags: ['marketplace', 'gathering place', 'humble home'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'reluctant_king',
    name: 'Reluctant King',
    storyShape: 'Refuses power, forced to accept, transformed by burden',
    proseTone: 'Quiet dignity, weight of duty, melancholy',
    reachAffinities: ['heart', 'iron', 'stone'],
    toneKeywords: {
      adjectives: ['burdened', 'quiet', 'reluctant', 'dignified', 'melancholic', 'steadfast'],
      verbs: ['accepted', 'bore', 'decided', 'sighed', 'ruled', 'endured'],
      sentenceRhythm: 'Weight in every sentence. Duty named plainly. Melancholy underneath, never self-pitying.',
    },
    beatPatterns: [
      {
        eventTypes: ['tier_transition'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['crown', 'throne', 'seal of office'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['forced upon them', 'reluctant ascension', 'burden accepted'],
      },
      {
        eventTypes: ['actor_death', 'mandate_stage'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'character', tags: ['successor', 'counselor', 'heir'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['in service to kingdom', 'tired but unbending', 'duty to the end'],
      },
    ],
    vignetteSeeds: [
      '{name} never wanted the crown. {name} accepted it anyway, and that acceptance was the final proof of {name}\'s fitness for it. The best rulers are those who would refuse it if they could.',
      'The weight of the crown bent {name}\'s shoulders. It never straightened them again. But {name} did not set it down. That refusal was {name}\'s truest nobility.',
      '{name} ruled not with passion but with patience. {name} carried the kingdom\'s problems like a parent carries a sick child through the night—weary, but never faltering.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['crown', 'throne', 'royal seal'], required: true, culturallyShape: true },
      { category: 'location', tags: ['throne room', 'royal seat', 'seat of power'], required: false, culturallyShape: true },
      { category: 'character', tags: ['counselor', 'heir', 'loyal subject'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'oathkeeper',
    name: 'Oathkeeper',
    storyShape: 'Bound by a vow that costs everything',
    proseTone: 'Stubborn, grinding, the vow becomes the whole person',
    reachAffinities: ['iron', 'star', 'heart'],
    toneKeywords: {
      adjectives: ['stubborn', 'grinding', 'iron-willed', 'unbending', 'devoted', 'relentless'],
      verbs: ['swore', 'held', 'endured', 'refused', 'kept', 'clung'],
      sentenceRhythm: 'Repetitive structure mirrors the oath\'s grip. The same word or phrase echoes, tightening.',
    },
    beatPatterns: [
      {
        eventTypes: ['actor_death'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'artifact', tags: ['oath-token', 'symbol of vow'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['oath finally released', 'vow fulfilled in death', 'final loyalty'],
      },
      {
        eventTypes: ['contested_action', 'trait_lost'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['oath-witness', 'oath-bound other', 'oath-breaker'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['oath tested', 'cost of keeping the vow', 'sacrifice demanded'],
      },
    ],
    vignetteSeeds: [
      '{name} had sworn an oath, and that oath had swallowed {name} whole. There was nothing left of {name} but the vow, worn down to essential bone by years of unflinching adherence.',
      'The oath that bound {name} was {name}\'s purpose and {name}\'s prison both. {name} could not say which was heavier. Perhaps it didn\'t matter anymore.',
      '{name} would keep the oath if it killed {name}. And it very well might. {name} had accepted this fact long ago and found a terrible peace in it.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['oath-token', 'symbol of vow', 'binding object'], required: true, culturallyShape: true },
      { category: 'character', tags: ['oath-witness', 'oath-bound ally', 'oath-breaker'], required: true, culturallyShape: true },
      { category: 'location', tags: ['place of oath-taking', 'sacred ground', 'binding place'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'poisoned_court',
    name: 'Poisoned Court',
    storyShape: 'Power corrupts, alliances shift, trust is a weapon',
    proseTone: 'Silken, venomous, every word has a second meaning',
    reachAffinities: ['gold', 'heart', 'shadow'],
    toneKeywords: {
      adjectives: ['silken', 'venomous', 'perfumed', 'treacherous', 'gleaming', 'poisoned'],
      verbs: ['smiled', 'poisoned', 'insinuated', 'maneuvered', 'struck', 'embraced'],
      sentenceRhythm: 'Every sentence has a second meaning. Civility is the weapon. Subtext does the killing.',
    },
    beatPatterns: [
      {
        eventTypes: ['contested_action', 'action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['courtier', 'ally', 'rival'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['elegant betrayal', 'poisoned gift', 'fatal alliance'],
      },
      {
        eventTypes: ['action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['poisoned gift', 'forged letter', 'spy network'], required: false, culturallyShape: false },
        ],
        contextPreferences: ['beneath civility', 'with audience watching', 'wrapped in courtesy'],
      },
    ],
    vignetteSeeds: [
      '{name} moved through the court like a dancer, each step calculated, each smile a blade. In the poisoned gardens of power, {name} had learned to bloom among the thorns.',
      'The court that bred {name} was as poisoned as {name} was beautiful. {name} had learned its lessons well: that kindness is foolishness, that trust is a noose, that alliance is just betrayal waiting for the right moment.',
      '{name}\'s courtesy was exquisite precisely because it was hollow. Every pleasant word concealed a second blade. The ones who understood this rule were already dead.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['poisoned gift', 'forged letter', 'spy network'], required: false, culturallyShape: false },
      { category: 'location', tags: ['throne room', 'court', 'palace'], required: true, culturallyShape: true },
      { category: 'character', tags: ['courtier', 'rival', 'ally-in-name'], required: true, culturallyShape: true },
    ],
  },

  {
    id: 'doomed_innocent',
    name: 'Doomed Innocent',
    storyShape: 'Good person in a world that will break them',
    proseTone: 'Tender at first, darkening steadily, no rescue coming',
    reachAffinities: ['star', 'veil', 'heart'],
    toneKeywords: {
      adjectives: ['tender', 'small', 'bright', 'doomed', 'fading', 'fragile'],
      verbs: ['hoped', 'trusted', 'reached', 'lost', 'dimmed', 'broke'],
      sentenceRhythm: 'Start gentle and bright. Let the prose darken one degree at a time. Never rescue them.',
    },
    beatPatterns: [
      {
        eventTypes: ['actor_death'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'character', tags: ['witness', 'loved one', 'killer'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['no salvation', 'inevitable end', 'world too cruel'],
      },
      {
        eventTypes: ['trait_lost', 'doom_escalation'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['keepsake', 'protection charm', 'memento'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['hope crushed', 'faith broken', 'light fading'],
      },
    ],
    vignetteSeeds: [
      '{name} was good in a world that had no use for goodness. This was {name}\'s tragedy and also, perhaps, their nobility. {name} remained kind even as the world stripped away every kindness in return.',
      'The worst part was not that {name} fell, but that {name} never saw it coming. {name} believed in rescue until the very end. The world proved {name} wrong with terrible finality.',
      '{name} had the tender heart of a dove born into a nest of hawks. The outcome was written before {name}\'s eyes ever opened. {name} was doomed from the beginning, though {name} never understood why.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['keepsake', 'protection charm', 'memento'], required: false, culturallyShape: true },
      { category: 'character', tags: ['protector', 'witness', 'loved one'], required: false, culturallyShape: true },
      { category: 'location', tags: ['place of safety lost', 'refuge destroyed', 'threshold'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'old_power',
    name: 'Old Power',
    storyShape: 'Ancient, vast, fading or awakening',
    proseTone: 'Slow, heavy, elemental — weight not speed',
    reachAffinities: ['veil', 'eye', 'star'],
    toneKeywords: {
      adjectives: ['ancient', 'vast', 'slow', 'elemental', 'immeasurable', 'deep'],
      verbs: ['stirred', 'remembered', 'woke', 'endured', 'crumbled', 'persisted'],
      sentenceRhythm: 'Geological pace. Sentences heavy with deep time. Weight, not speed.',
    },
    beatPatterns: [
      {
        eventTypes: ['doom_escalation'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'artifact', tags: ['ancient artifact', 'primordial relic'], required: true, culturallyShape: false },
        ],
        contextPreferences: ['awakening after ages', 'world-shaking consequence', 'cosmic force'],
      },
      {
        eventTypes: ['tier_transition', 'action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'location', tags: ['ancient site', 'geological feature', 'primordial place'], required: true, culturallyShape: false },
        ],
        contextPreferences: ['from deep time', 'slow awakening', 'primordial force stirring'],
      },
    ],
    vignetteSeeds: [
      '{name} remembered times when the mountains were young. {name} had walked beneath suns that no longer burned. And {name} endured still, patient as stone, vast as continents.',
      'The world moved so quickly now. Little mayflies of mortals, fluttering their days away. But {name} moved at the pace of ice ages, and {name}\'s patience was absolute.',
      '{name} had been old when the first kingdoms were young dreams in humans\' minds. {name} would be old still when empires had returned to dust. What were a few more centuries?',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['ancient artifact', 'primordial relic', 'sleeping ward'], required: true, culturallyShape: false },
      { category: 'location', tags: ['ancient site', 'geological feature', 'primordial place'], required: true, culturallyShape: false },
      { category: 'character', tags: ['worshipper', 'scholar', 'awakener'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'kingmaker',
    name: 'Kingmaker',
    storyShape: 'Never rules, always decides who does',
    proseTone: 'Shrewd, understated, power through others',
    reachAffinities: ['gold', 'heart', 'shadow'],
    toneKeywords: {
      adjectives: ['shrewd', 'quiet', 'understated', 'watchful', 'influential', 'invisible'],
      verbs: ['arranged', 'whispered', 'chose', 'positioned', 'withdrew', 'suggested'],
      sentenceRhythm: 'Understatement. The biggest moves described in the smallest words. Power exercised through others.',
    },
    beatPatterns: [
      {
        eventTypes: ['contested_action', 'action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'character', tags: ['candidate', 'puppet', 'successor'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['subtle influence', 'from the shadows', 'invisible hand'],
      },
      {
        eventTypes: ['action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['leverage', 'secret', 'debt owed'], required: false, culturallyShape: false },
        ],
        contextPreferences: ['behind the throne', 'without taking power', 'from the margins'],
      },
    ],
    vignetteSeeds: [
      '{name} had crowned more kings than anyone would ever know. {name}\'s name did not appear in histories, but the names of {name}\'s chosen did. {name} preferred it that way.',
      'The power that {name} wielded was the most invisible kind—the kind exercised through whispered suggestions and carefully placed information. By the time anyone realized the depth of {name}\'s influence, {name} had already moved on.',
      '{name} had learned the ultimate lesson of power: that ruling was exhausting and pointless. Much better to choose the ruler and retire to the margins, where one\'s words still shaped empires.',
    ],
    narrativeRequirements: [
      { category: 'character', tags: ['candidate', 'puppet', 'rival kingmaker'], required: true, culturallyShape: true },
      { category: 'artifact', tags: ['leverage', 'secret', 'debt owed'], required: false, culturallyShape: false },
      { category: 'location', tags: ['seat of power', 'intelligence network', 'safe house'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'seeker',
    name: 'Seeker',
    storyShape: 'Pursues forbidden knowledge, pays the price of knowing',
    proseTone: 'Obsessive, precise, progressively unhinged',
    reachAffinities: ['eye', 'veil', 'star'],
    toneKeywords: {
      adjectives: ['obsessive', 'precise', 'fevered', 'brilliant', 'unraveling', 'intense'],
      verbs: ['searched', 'decoded', 'uncovered', 'pierced', 'paid', 'unraveled'],
      sentenceRhythm: 'Precise at first, growing fragmented. Clarity of mind giving way to compulsion.',
    },
    beatPatterns: [
      {
        eventTypes: ['trait_acquired'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['forbidden text', 'cryptic artifact'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['forbidden knowledge gained', 'secret uncovered', 'truth discovered'],
      },
      {
        eventTypes: ['action_critical', 'doom_escalation'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'location', tags: ['ancient ruin', 'forbidden library', 'sealed place'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['final discovery', 'knowledge destroys', 'price of knowing'],
      },
    ],
    vignetteSeeds: [
      '{name} pursued knowledge the way other people pursued air. Each truth only spawned ten new questions. {name} chased them all, deeper and deeper into obsession, until the boundary between knowledge and madness blurred completely.',
      'The knowledge that {name} had uncovered had cost {name} everything. But {name} would do it again, because now {name} knew, and not-knowing was no longer possible. The curse had become {name}\'s nature.',
      '{name}\'s eyes had seen things that human minds were not meant to comprehend. What remained of {name} after that seeing was something brilliant and broken in equal measure.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['forbidden text', 'cryptic artifact', 'ancient scroll'], required: true, culturallyShape: true },
      { category: 'location', tags: ['ancient ruin', 'forbidden library', 'sealed place'], required: false, culturallyShape: true },
      { category: 'character', tags: ['fellow seeker', 'guardian of secrets', 'victim of knowledge'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'maker',
    name: 'Maker',
    storyShape: 'Creates something that outlasts them — or destroys them',
    proseTone: 'Patient, hands-on, proud — the craft is sacred',
    reachAffinities: ['stone', 'gold', 'eye'],
    toneKeywords: {
      adjectives: ['patient', 'meticulous', 'proud', 'calloused', 'devoted', 'precise'],
      verbs: ['shaped', 'forged', 'measured', 'perfected', 'finished', 'created'],
      sentenceRhythm: 'Hands-on specificity. Name the materials, describe the process. The craft is sacred.',
    },
    beatPatterns: [
      {
        eventTypes: ['action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'artifact', tags: ['masterwork', 'creation'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['completing magnum opus', 'perfecting craft', 'pouring self into creation'],
      },
      {
        eventTypes: ['actor_death'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'character', tags: ['apprentice', 'successor', 'beneficiary'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['work outlasts creator', 'death in the workshop', 'legacy endures'],
      },
    ],
    vignetteSeeds: [
      '{name} believed in the sacred geometry of creation. Every line had meaning. Every measure was intentional. The objects that {name} shaped carried {name}\'s soul more surely than {name}\'s own body ever could.',
      'In the workshop, with hands deep in material, {name} was whole. The world fell away. There was only the work, the transformation, the act of bringing the impossible form into being.',
      '{name}\'s masterwork would outlast nations. Long after {name}\'s name was forgotten, what {name} had made would remain, speaking {name}\'s truth to generations who had never heard {name}\'s voice.',
    ],
    narrativeRequirements: [
      { category: 'artifact', tags: ['masterwork', 'unfinished creation', 'tool of craft'], required: true, culturallyShape: true },
      { category: 'location', tags: ['workshop', 'forge', 'studio'], required: false, culturallyShape: true },
      { category: 'character', tags: ['apprentice', 'patron', 'successor'], required: false, culturallyShape: true },
    ],
  },

  {
    id: 'noble_savage',
    name: 'Noble Savage',
    storyShape: 'Primal strength meets civilization, transforms it or is broken',
    proseTone: 'Raw, physical, elemental — contempt for complexity',
    reachAffinities: ['iron', 'star', 'stone'],
    toneKeywords: {
      adjectives: ['raw', 'primal', 'towering', 'contemptuous', 'elemental', 'fierce'],
      verbs: ['charged', 'roared', 'broke', 'scorned', 'endured', 'crushed'],
      sentenceRhythm: 'Direct. Physical. Contempt for abstraction. The body is the argument.',
    },
    beatPatterns: [
      {
        eventTypes: ['contested_action', 'action_critical'],
        minimumTier: 'routine',
        promoteTo: 'notable',
        narrativeRequirements: [
          { category: 'location', tags: ['wilderness', 'sacred natural site', 'untamed land'], required: true, culturallyShape: true },
        ],
        contextPreferences: ['raw strength', 'primal power', 'against civilization'],
      },
      {
        eventTypes: ['actor_death'],
        minimumTier: 'notable',
        promoteTo: 'chronicle',
        narrativeRequirements: [
          { category: 'character', tags: ['civilized opponent', 'tribal member', 'destroyer'], required: false, culturallyShape: true },
        ],
        contextPreferences: ['defiant to end', 'will not bend', 'breaks rather than breaks'],
      },
    ],
    vignetteSeeds: [
      '{name} was the wild made manifest. Civilization tried to cage it, tried to tame it, tried to explain it in terms its own mind could grasp. {name} would have none of it.',
      'The contempt in {name}\'s eyes for the elaborate games of the civilized was absolute. What use was politeness when you could speak plainly? What was courtesy but cowardice wrapped in silk?',
      '{name} moved through the world like an animal, direct and terrible and unashamed. The very ground seemed to shake differently beneath {name}\'s feet, as though the earth recognized its own.',
    ],
    narrativeRequirements: [
      { category: 'location', tags: ['wilderness', 'sacred natural site', 'tribal territory'], required: true, culturallyShape: true },
      { category: 'artifact', tags: ['tribal token', 'sacred object', 'totemic item'], required: false, culturallyShape: true },
      { category: 'character', tags: ['tribe member', 'civilized opponent', 'corrupted kinsman'], required: false, culturallyShape: true },
    ],
  },
];

// ─── Lookup Functions ────────────────────────────────────────────

export function getArchetype(id: string): NarrativeArchetype | undefined {
  return NARRATIVE_ARCHETYPES.find(a => a.id === id);
}

export function getArchetypeTone(id: string): ToneKeywords | undefined {
  return NARRATIVE_ARCHETYPES.find(a => a.id === id)?.toneKeywords;
}

export function getArchetypeBeatPatterns(id: string): BeatPattern[] {
  return NARRATIVE_ARCHETYPES.find(a => a.id === id)?.beatPatterns ?? [];
}

export function getArchetypeVignette(id: string, seed: number): string | undefined {
  const arch = NARRATIVE_ARCHETYPES.find(a => a.id === id);
  if (!arch || arch.vignetteSeeds.length === 0) return undefined;
  const index = ((seed % arch.vignetteSeeds.length) + arch.vignetteSeeds.length) % arch.vignetteSeeds.length;
  return arch.vignetteSeeds[index];
}
