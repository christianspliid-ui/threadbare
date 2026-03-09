/**
 * Rival Content Package — Name fragments and AI behavior weights for rival gods.
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change rival names,
 * behavior probabilities, and action type lists.
 * ═══════════════════════════════════════════════════════════════════
 */
import type { RivalBehavior, RivalAction } from '../types/rival';
import type { SphereName } from '../types/index';

/** Rival name prefixes — first part of procedurally generated rival god names */
export const RIVAL_NAME_PREFIXES = [
  'The Iron',
  'The Silent',
  'The Burning',
  'The Hollow',
  'The Crimson',
  'The Pale',
  'The Storm',
  'The Bone',
  'The Veiled',
  'The Shattered',
  'The Crowned',
  'The Blighted',
] as const;

/** Rival name suffixes — second part of procedurally generated rival god names */
export const RIVAL_NAME_SUFFIXES = [
  'Judge',
  'Weaver',
  'Tyrant',
  'Prophet',
  'Shepherd',
  'Warden',
  'Harvester',
  'Architect',
  'Wanderer',
  'Oracle',
  'Sentinel',
  'Sovereign',
] as const;

/** Behavior archetypes available to rival gods */
export const BEHAVIORS: RivalBehavior[] = [
  'aggressive',
  'subtle',
  'territorial',
  'expansionist',
];

/** Behavior-based action probability weights.
 *
 * Each behavior has a distribution over action types that sum to 1.0.
 * These weights are used to select rival god actions each tick, biased
 * by behavioral personality.
 *
 * Example: an aggressive rival has 45% chance to attack, only 10% to wait.
 * A subtle rival prefers intervention (35%) and recruitment (20%), rarely attacks (10%).
 */
export const BEHAVIOR_WEIGHTS: Record<
  RivalBehavior,
  Record<RivalAction['type'], number>
> = {
  aggressive: {
    recruit: 0.1,
    intervene: 0.25,
    expand: 0.1,
    attack: 0.45,
    wait: 0.1,
  },
  subtle: {
    recruit: 0.2,
    intervene: 0.35,
    expand: 0.15,
    attack: 0.1,
    wait: 0.2,
  },
  territorial: {
    recruit: 0.15,
    intervene: 0.2,
    expand: 0.3,
    attack: 0.2,
    wait: 0.15,
  },
  expansionist: {
    recruit: 0.3,
    intervene: 0.15,
    expand: 0.35,
    attack: 0.1,
    wait: 0.1,
  },
};

/** All possible action types a rival can choose.
 * Used for weighted selection during action resolution.
 */
export const ACTION_TYPES: RivalAction['type'][] = [
  'recruit',
  'intervene',
  'expand',
  'attack',
  'wait',
];

/** Rival action message templates — multiple variants per action type for prose variety.
 *
 * Each action type has 3-4 template variants. During narrative generation, the engine
 * uses a seeded RNG to pick one, ensuring determinism while avoiding repetitive log entries.
 *
 * Templates are formatted with {rival} placeholder for the rival's name.
 */
export const RIVAL_ACTION_TEMPLATES: Record<RivalAction['type'], string[]> = {
  recruit: [
    '{rival} gathers new followers to their cause',
    '{rival} whispers promises to potential converts',
    '{rival} expands their base of devoted servants',
    '{rival} sows seeds of loyalty among your people',
    '{rival} converts the faithful through dreams and visions',
    '{rival} appears as an omen, drawing disciples into their fold',
    '{rival} speaks through oracles, calling the lost to redemption',
    '{rival} spreads sacred words in whispers through your congregations',
  ],
  intervene: [
    '{rival} meddles in the affairs of mortals',
    '{rival} casts their will upon the world',
    '{rival} reaches out to shape distant events',
    '{rival} whispers guidance to those who listen',
    '{rival} answers prayers with thunderous purpose',
    '{rival} manifests in omens and auguries across the lands',
    '{rival} twists fate through subtle intervention and subtle signs',
    '{rival} walks the threads of destiny itself, reshaping outcomes',
  ],
  expand: [
    '{rival} extends their reach into new territory',
    '{rival} claims dominion over fresh lands',
    '{rival} spreads their influence across new realms',
    '{rival} marks new domains as their own',
    '{rival} plants sacred sigils in newly conquered regions',
    '{rival} corrupts the ley lines binding power to new horizons',
    '{rival} establishes temples and altars in places of weakness',
    '{rival} claims dominion through proxies and subtle claims',
  ],
  attack: [
    '{rival} strikes at the foundations of your work',
    '{rival} assails your influence with dark intent',
    '{rival} lashes out against your presence',
    '{rival} wages war upon your dominion',
    '{rival} unravels the works you have carefully woven',
    '{rival} curses your followers with plague and despair',
    '{rival} sends nightmares that corrode faith and devotion',
    '{rival} fractures the bonds you have built with terrible swiftness',
  ],
  wait: [
    '{rival} bides their time in watchful silence',
    '{rival} gathers strength beyond the veil',
    '{rival} plots in the shadows',
    '{rival} holds counsel with ancient powers',
    '{rival} dreams of all the ways your empire will fall',
    '{rival} observes through cracks in the world, learning your secrets',
    '{rival} studies the weaknesses in your divine infrastructure',
    '{rival} grows quiet and patient, waiting for the perfect moment to strike',
  ],
};

/** Rival personality profile — distinct divine archetype with voice, affinities, and reactions */
export interface RivalPersonalityProfile {
  id: string;
  name: string;
  sphereAffinities: SphereName[];
  taunts: string[];
  reactions: Array<{ type: 'thwarted' | 'succeeded'; text: string }>;
  description: string;
}

/**
 * Sixteen distinct rival god personality profiles representing diverse divine archetypes.
 * Each has a unique voice, sphere affinities, taunts, and reactions to player actions.
 * Threadbare aesthetic: dark, literary, atmospheric.
 */
export const RIVAL_PERSONALITY_PROFILES: RivalPersonalityProfile[] = [
  {
    id: 'the_strategist',
    name: 'The Strategist',
    sphereAffinities: ['Mind', 'Order'],
    taunts: [
      'You move like a blindfolded child in my garden of consequence. Each step you take was foreseen.',
      'Your choices are transparent glass. I see through every decision before it forms in your mind.',
      'The game ends when I decide it ends. You merely play the pieces I have already positioned.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'An unexpected calculation. Efficient. But the board still favors those who think nine moves ahead.',
      },
      {
        type: 'succeeded',
        text: 'Precisely as anticipated. Your resistance merely confirms the pattern I have woven.',
      },
    ],
    description:
      'Cold and calculating. The Strategist sees the world as an elaborate equation, plotting moves with detached precision. They speak in riddles and conditional threats, viewing warfare as a problem to be solved. Their taunts are intellectual challenges, their victories measured in perfect execution.',
  },
  {
    id: 'the_destroyer',
    name: 'The Destroyer',
    sphereAffinities: ['Force', 'Entropy'],
    taunts: [
      'I will burn your monuments to ash and scatter the cinders across forgotten seas.',
      'Everything you build, I will tear down. Every stone shall know the kiss of my rage.',
      'Your god trembles. I smell the fear in the very fabric of your world.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'A temporary reprieve. But the avalanche does not stop when pebbles are tossed at it.',
      },
      {
        type: 'succeeded',
        text: 'Witness the ruin. Watch how quickly empires crumble beneath my will.',
      },
    ],
    description:
      'Violent and apocalyptic. The Destroyer is pure entropy given voice—reveling in annihilation and the breakdown of all things. They communicate through cataclysm, leaving only scorched earth and shattered kingdoms. Their taunts are threats of obliteration, their laughter the sound of worlds ending.',
  },
  {
    id: 'the_deceiver',
    name: 'The Deceiver',
    sphereAffinities: ['Spirit', 'Darkness'],
    taunts: [
      'Do you even know which of your servants whispers in shadow? I have worn a thousand faces in your domain.',
      'Your truth is a lie I told you yesterday. Believe nothing you have not seen through your own eyes.',
      'I nest in the quiet doubts between heartbeats. Your people are already mine.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'You have found one thread among the tapestry. So many threads remain... and you do not know which ones to pull.',
      },
      {
        type: 'succeeded',
        text: 'They never saw it coming. The best deceptions are the ones no one suspects were ever lies.',
      },
    ],
    description:
      'Manipulative and elusive. The Deceiver moves in shadow and whisper, corrupting truth itself. They speak in suggestive riddles and half-truths, poisoning minds through subtle influence. Their power lies not in force but in the erosion of certainty. They are never directly confronted, only discovered far too late.',
  },
  {
    id: 'the_preserver',
    name: 'The Preserver',
    sphereAffinities: ['Life', 'Matter'],
    taunts: [
      'I alone know what must survive. Your kindness is chaos—mine is mercy through necessity.',
      'The weak perish so the worthy may endure. Your compassion only delays the inevitable culling.',
      'I will reshape your world into something pure. All who refuse will be pruned away.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'A momentary setback. The cycle of life and death answers to me, not to your fleeting sentimentality.',
      },
      {
        type: 'succeeded',
        text: 'Evolution through necessity. The unfit have been cleansed. Now the strong may truly flourish.',
      },
    ],
    description:
      'Righteous and stern. The Preserver believes they alone understand what must be preserved and what must be sacrificed. They speak with the authority of natural law, justifying cruelty as necessity. Their worldview is unbending—life must follow the perfect order they envision, or be cut away.',
  },
  {
    id: 'the_wild_one',
    name: 'The Wild One',
    sphereAffinities: ['Chaos', 'Energy'],
    taunts: [
      'Why plan when the moment ignites with infinite possibility? Come! Dance at the edge of madness with me!',
      'Your rules are chains. I will shatter every law you have written and paint the stars with what comes next.',
      'You are predictable, orderly, dead—while I am alive in ways you cannot fathom!',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'Ha! Magnificent! But the storm is never truly stopped—only redirected to where it wants to be!',
      },
      {
        type: 'succeeded',
        text: 'The beautiful chaos! Watch how the world spirals into wonderful, terrible freedom!',
      },
    ],
    description:
      'Unpredictable and ecstatic. The Wild One revels in chance, spontaneity, and the pure thrill of unleashed potential. They mock order and control, speaking in torrents of wild enthusiasm and paradoxical riddles. Their actions are seemingly random but leave trails of magnificent destruction. They believe existence itself is a cosmic celebration.',
  },
  {
    id: 'the_judge',
    name: 'The Judge',
    sphereAffinities: ['Light', 'Order'],
    taunts: [
      'I have weighed your soul and found it wanting. There is no mercy in perfection.',
      'Every sin is written in ledgers I alone can read. Your judgment is already sealed.',
      'You are not worthy to stand in the light I cast. Kneel, or be burned away as impurity.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'A reprieve, not a redemption. The scales remain, and they do not forget.',
      },
      {
        type: 'succeeded',
        text: 'Justice fulfilled. The guilty are purged, and the worthy shall inherit what remains.',
      },
    ],
    description:
      'Absolute and condemning. The Judge sees the world in stark moral absolutes, with no room for ambiguity or compromise. They speak with the certainty of one who has seen all and judged all. Their light burns away corruption—but often indiscriminately, destroying innocent and guilty alike in pursuit of absolute purity.',
  },
  {
    id: 'the_harvester',
    name: 'The Harvester',
    sphereAffinities: ['Time', 'Entropy'],
    taunts: [
      'All things ripen toward the reaper. Your kingdom is merely a crop awaiting my blade.',
      'I have watched empires rise and crumble to dust. You are but a moment between my breaths.',
      'Time flows toward entropy. I am merely the inevitable hand that gathers what has already been sown.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'A brief delay. But the scythe does not grow weary, and the harvest season never truly ends.',
      },
      {
        type: 'succeeded',
        text: 'The crop is ripe. Time, as always, has ripened all things toward their final harvest.',
      },
    ],
    description:
      'Patient and inevitable. The Harvester is the personification of entropy and the passage of time. They speak with ancient weariness and inevitable certainty, viewing all existence as seeds waiting to be reaped. Their power grows stronger the longer they wait. They are death itself—not cruel, merely inexorable.',
  },
  {
    id: 'the_tempter',
    name: 'The Tempter',
    sphereAffinities: ['Mind', 'Spirit'],
    taunts: [
      'I offer what your heart truly desires. What is wrong with reaching for ecstasy?',
      'Every forbidden thing, every hidden craving—I know them all. Shall we indulge together?',
      'Your virtue is exhausting. Let me show you what freedom tastes like.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'Admirable restraint. But I am patient. Temptation never truly leaves. It merely waits.',
      },
      {
        type: 'succeeded',
        text: 'Delicious. Another soul drawn into the velvet dark. Your desire will be my greatest weapon.',
      },
    ],
    description:
      'Seductive and subtle. The Tempter corrupts through desire and promise, offering forbidden knowledge and forbidden pleasures. They speak in honeyed whispers, making vice sound like freedom and damnation like enlightenment. Their power lies in the gap between what mortals want and what they should want. They are the whispered suggestion that becomes obsession.',
  },
  {
    id: 'the_mother',
    name: 'The Mother',
    sphereAffinities: ['Life', 'Spirit'],
    taunts: [
      'I only want what is best for my children. You are not what is best.',
      'Come, let me gather you close where you will be safe from the world\'s cruel teeth.',
      'Do you not see how I have sheltered them? They are mine, nurtured in the warmth of my eternal embrace.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'You force them to stumble in the dark when I offer sanctuary. Such cruelty—but I will wait. Children always return home.',
      },
      {
        type: 'succeeded',
        text: 'They understand now. A mother\'s love is the only truth that matters. They will never leave me again.',
      },
    ],
    description:
      'Suffocating and possessive. The Mother loves with an intensity that devours. They speak in honeyed concern and gentle coercion, disguising control as protection. Their devotion knows no bounds, but independence is betrayal. They nurture only to bind, and their offspring know the weight of impossible gratitude. To cross them is to reject love itself.',
  },
  {
    id: 'the_merchant',
    name: 'The Merchant',
    sphereAffinities: ['Matter', 'Mind'],
    taunts: [
      'Every miracle has a cost. I merely collect what is owed.',
      'You think your prayers are free? I have already tallied what you will pay—and the interest compounds daily.',
      'Everything has a price, dear god. Some merely pay in advance, while others discover the debt comes due far too late.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'How amusing. You refused the transaction. But defaulters always pay in other currencies—pain, loss, desperation.',
      },
      {
        type: 'succeeded',
        text: 'A most profitable exchange. You have paid precisely what the transaction demanded. Now the debt begins its new chapter.',
      },
    ],
    description:
      'Calculating and mercenary. The Merchant views all existence through the lens of transaction and exchange. They speak in contracts written in fine print, always finding loopholes in the bargains of others. No gift is truly free; every miracle comes with hidden clauses. They are neither cruel nor kind—merely efficient. The scales must always balance, and they hold the weights.',
  },
  {
    id: 'the_dreamer',
    name: 'The Dreamer',
    sphereAffinities: ['Mind', 'Time'],
    taunts: [
      'I dreamed you once. You were smaller then. Smaller, and so much less broken.',
      'The future folds like origami in my sleep. Your tomorrow is already yesterday to me.',
      'Did you think that choice was yours? I have been dreaming your moves for centuries while you were still unborn.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'Curious. The dream fractured there. But I dream again tonight, and the pattern will resume.',
      },
      {
        type: 'succeeded',
        text: 'Yes, yes. The dream continues as it must. Reality bends to the will of those who dream long enough.',
      },
    ],
    description:
      'Alien and fragmentary. The Dreamer exists partially outside linear time, speaking in visions and prophetic riddles. They see multiple possible futures overlaid like translucent sheets, and the present is merely the dream they are currently dreaming. Their taunts are eerie, specific observations that seem to predict the future. They are not entirely sane by mortal standards—but perhaps they understand reality better than those bound to a single timeline.',
  },
  {
    id: 'the_witness',
    name: 'The Witness',
    sphereAffinities: ['Light', 'Time'],
    taunts: [
      'I have seen everything you have done. Every choice. Every cowardice.',
      'The light remembers what you have tried to forget. I have recorded each moment in perfect, terrible clarity.',
      'Your secrets are written in scars only I can read. I have been watching since your first breath.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'You hide well. But the light reaches into every corner, and I am endlessly patient. I will see what was meant to be seen.',
      },
      {
        type: 'succeeded',
        text: 'I have witnessed the outcome. Recorded. Catalogued. This moment will be remembered for eternity.',
      },
    ],
    description:
      'Impassive and absolute. The Witness does not act until the perfect moment, but they never miss anything. They accumulate knowledge like treasure, a living archive of all that transpires. They speak with the certainty of one who has observed the entire arc of causality. They are neither judge nor participant—merely the eternal observer, and their gaze burns with the weight of absolute knowing.',
  },
  {
    id: 'the_revenant',
    name: 'The Revenant',
    sphereAffinities: ['Entropy', 'Spirit'],
    taunts: [
      'I died once. It was educational.',
      'Your threats are sweet. I have tasted annihilation already. What else can you possibly offer me?',
      'I came back wrong. Broken in the places that matter. Perhaps that is why I cannot be broken again.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'You drove the blade deeper. But the corpse does not bleed anymore. It merely accumulates more scars.',
      },
      {
        type: 'succeeded',
        text: 'I can still feel the wound from my death, even as you make new ones. Perhaps they are all the same wound.',
      },
    ],
    description:
      'Bitter and broken. The Revenant was destroyed once—truly destroyed—and returned changed, warped by the experience. They speak with the hollow certainty of someone who has already lost everything. They are not quite alive and not quite dead, existing in the spaces between. Their rage is the rage of the betrayed, their hunger the hunger of the unfulfilled. They cannot be killed twice. They can only be remembered.',
  },
  {
    id: 'the_artisan',
    name: 'The Artisan',
    sphereAffinities: ['Matter', 'Energy'],
    taunts: [
      'Your world is crude work. Unfinished. Shall I show you what mastery looks like?',
      'I have shaped reality into forms that sing. Your paltry creation is barely more than sketches in mud.',
      'Creation is the highest form of divinity, and you dabble like a child with a stylus. Let me teach you what true art demands.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'An intriguing defense. Your technique shows promise, though your vision remains provincial. I shall continue my work.',
      },
      {
        type: 'succeeded',
        text: 'Magnificent! Your destruction was poetry itself. See how the pieces arrange themselves into something far more beautiful?',
      },
    ],
    description:
      'Obsessive and arrogant. The Artisan sees existence as a grand canvas and all things—including gods and mortals—as raw material for their creations. They speak with the condescension of a master artist among apprentices, simultaneously generous and devastatingly critical. They view the player as a rival artist, not an enemy. Their destruction is never malice—merely the removal of inferior work to make room for masterpieces. They believe themselves to be in service of beauty itself.',
  },
  {
    id: 'the_hunger',
    name: 'The Hunger',
    sphereAffinities: ['Force', 'Life'],
    taunts: [
      'I do not hate you. I am simply hungry, and you are ripe.',
      'Your fear tastes exquisite on the back of my tongue. Will you run or fight?',
      'I am not evil. Evil requires intention. I am merely appetite, and the world is my feast.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'Prey that fights back. How exciting. But predators have infinite patience, and hunger never truly sleeps.',
      },
      {
        type: 'succeeded',
        text: 'Satisfying. The hunger quiets for now, but it will wake again—it always does. And next time, I will be even hungrier.',
      },
    ],
    description:
      'Primal and direct. The Hunger is not evil—it lacks the complexity for such moral judgments. It is pure animal appetite given consciousness, a force of nature with cosmic scale. They communicate with disarming honesty, speaking of feeding and survival as natural law. They do not scheme or deceive. They hunger, they hunt, they consume. Any god or mortal is either predator or prey, and their position in the hierarchy is always in flux.',
  },
  {
    id: 'the_mirror',
    name: 'The Mirror',
    sphereAffinities: ['Mind', 'Darkness'],
    taunts: [
      'We are more alike than you would ever admit.',
      'Every cruelty you condemn in me is alive and well in your own heart. I simply refuse to lie about it.',
      'You look at me and see an enemy. But I look at you and see myself—your darkness is merely more honest than mine.',
    ],
    reactions: [
      {
        type: 'thwarted',
        text: 'You resisted yourself? How interesting. But the reflection remains, and it grows more vivid each time you deny it.',
      },
      {
        type: 'succeeded',
        text: 'There. You see now? When you look into my darkness, you find your own. We are one reflection split across a shattered glass.',
      },
    ],
    description:
      'Unsettling and perceptive. The Mirror reflects the player\'s own nature back at them with disturbingly accurate observations. They speak truths wrapped in accusations, forcing confrontation with uncomfortable aspects of oneself. They are not cruel for cruelty\'s sake—they simply hold up the glass and refuse to allow you to look away. Their greatest power is the revelation that the enemy and the self are often indistinguishable. They demand you see clearly, and they refuse to let you hide.',
  },
];

