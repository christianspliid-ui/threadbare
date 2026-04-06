/**
 * Meeting Encounter Content Package — archetype names, dilemma templates,
 * and action template for "Meet The First".
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: Edit this file to add dilemma templates, change
 * archetype names, or modify the meeting encounter experience.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { ReachDomain } from '../types/traits';
import type { DilemmaTemplate } from '../types/meetingEncounter';
import type { SparkInvestmentOption } from '../types/meetingEncounter';

// ─── Archetype Name Map (64 combinations: primary × secondary reach) ──

/**
 * One archetype name per primary×secondary reach combination.
 * Key format: `${primaryReach}_${secondaryReach}`
 * Source pool: breadth of fantasy and sci-fi literature.
 */
export const ARCHETYPE_NAME_MAP: Record<string, string> = {
  // ── Iron primary ──
  iron_iron:     'Warlord',
  iron_gold:     'Mercenary Captain',
  iron_shadow:   'Assassin',
  iron_veil:     'Battle Mage',
  iron_heart:    'Champion',
  iron_eye:      'Tactician',
  iron_stone:    'Sentinel',
  iron_star:     'Crusader',

  // ── Gold primary ──
  gold_iron:     'Arms Dealer',
  gold_gold:     'Merchant Prince',
  gold_shadow:   'Smuggler',
  gold_veil:     'Artificer',
  gold_heart:    'Patron',
  gold_eye:      'Spymaster',
  gold_stone:    'Architect',
  gold_star:     'Benefactor',

  // ── Shadow primary ──
  shadow_iron:   'Saboteur',
  shadow_gold:   'Fence',
  shadow_shadow: 'Phantom',
  shadow_veil:   'Illusionist',
  shadow_heart:  'Manipulator',
  shadow_eye:    'Infiltrator',
  shadow_stone:  'Tunneler',
  shadow_star:   'Heretic',

  // ── Veil primary ──
  veil_iron:     'Warlock',
  veil_gold:     'Enchanter',
  veil_shadow:   'Hexer',
  veil_veil:     'Archmage',
  veil_heart:    'Empath',
  veil_eye:      'Diviner',
  veil_stone:    'Runecaster',
  veil_star:     'Mystic',

  // ── Heart primary ──
  heart_iron:    'War Chief',
  heart_gold:    'Demagogue',
  heart_shadow:  'Agitator',
  heart_veil:    'Prophet',
  heart_heart:   'Paragon',
  heart_eye:     'Counselor',
  heart_stone:   'Elder',
  heart_star:    'Martyr',

  // ── Eye primary ──
  eye_iron:      'Scout',
  eye_gold:      'Appraiser',
  eye_shadow:    'Shadow Seer',
  eye_veil:      'Oracle',
  eye_heart:     'Emissary',
  eye_eye:       'Watcher',
  eye_stone:     'Cartographer',
  eye_star:      'Astrologer',

  // ── Stone primary ──
  stone_iron:    'Siegemaster',
  stone_gold:    'Mason',
  stone_shadow:  'Underminer',
  stone_veil:    'Wardsmith',
  stone_heart:   'Builder',
  stone_eye:     'Geomancer',
  stone_stone:   'Monolith',
  stone_star:    'Monument Keeper',

  // ── Star primary ──
  star_iron:     'Templar',
  star_gold:     'Almsgiver',
  star_shadow:   'Penitent',
  star_veil:     'Hierophant',
  star_heart:    'Apostle',
  star_eye:      'Seer',
  star_stone:    'Anchorite',
  star_star:     'Saint',
};

// ─── Starter Dilemma Templates ────────────────────────────────────

/**
 * Initial dilemma template set for Phase 1.
 * ~20 templates covering all 4 categories.
 * Full content target is ~150+ (future phases).
 */
export const DILEMMA_TEMPLATES: DilemmaTemplate[] = [
  // ── Axiological: Mercy vs Ruthlessness (Iron) ──
  {
    id: 'dilemma.axio.mercy_1',
    category: 'axiological',
    targetValuePair: 'mercy_ruthlessness',
    setup: 'A wounded soldier crawls from the wreckage of a border skirmish, dragging himself toward the village gates. He wears the colors of an enemy warband — the same warband that burned the eastern farmsteads last season. The villagers gather, stones in hand.',
    godVoice: 'You see the thread of this mortal\'s fate trembling. What you do now will echo.',
    choices: [
      {
        id: 'mercy_1_spare',
        text: 'She steps forward, placing herself between the mob and the dying man. "He bleeds the same color we do."',
        godAction: 'You still the hands of the mob with a breath of calm.',
        axiologicalShifts: { mercy_ruthlessness: 0.2 },
        gateTags: ['mercy_shown', 'heroic_origin'],
        traitSeeds: ['compassionate'],
      },
      {
        id: 'mercy_1_stone',
        text: 'She picks up the first stone. The mob follows. The dying soldier never reaches the gate.',
        godAction: 'You let the rage flow. This is what survival looks like.',
        axiologicalShifts: { mercy_ruthlessness: -0.2 },
        gateTags: ['ruthless_origin', 'blood_on_hands'],
        traitSeeds: ['hardened'],
      },
      {
        id: 'mercy_1_question',
        text: 'She kneels beside him and asks a single question: "Where are the others?" Information first. Then mercy — or not.',
        godAction: 'You whisper pragmatism into her ear. Knowledge before judgment.',
        axiologicalShifts: { mercy_ruthlessness: -0.05, honesty_cunning: -0.1 },
        gateTags: ['cunning_origin'],
        traitSeeds: ['calculating'],
      },
    ],
  },

  // ── Axiological: Loyalty vs Ambition (Heart) ──
  {
    id: 'dilemma.axio.loyalty_1',
    category: 'axiological',
    targetValuePair: 'loyalty_ambition',
    setup: 'The old mentor who raised her is failing. His mind wanders; his forge grows cold. A letter arrives from a distant city — a master craftsman offers an apprenticeship that would change everything. But leaving now means leaving him to die alone.',
    godVoice: 'Two paths branch from this moment. Neither is kind.',
    choices: [
      {
        id: 'loyalty_1_stay',
        text: 'She tears the letter in half without reading the second page. Some debts outweigh any opportunity.',
        godAction: 'You weave loyalty deeper into the thread. This one knows duty.',
        axiologicalShifts: { loyalty_ambition: 0.2 },
        gateTags: ['duty_over_desire', 'devotion_seed'],
        traitSeeds: ['devoted'],
      },
      {
        id: 'loyalty_1_leave',
        text: 'She packs at dawn, leaving a purse of coins and a note. She doesn\'t look back. She can\'t afford to.',
        godAction: 'You open the road ahead. Greatness demands sacrifice.',
        axiologicalShifts: { loyalty_ambition: -0.2 },
        gateTags: ['ambition_seed', 'sacrifice_seed'],
        traitSeeds: ['driven'],
      },
    ],
  },

  // ── Axiological: Honesty vs Cunning (Shadow) ──
  {
    id: 'dilemma.axio.honesty_1',
    category: 'axiological',
    targetValuePair: 'honesty_cunning',
    setup: 'The merchant shows her the ledger — every name, every debt, every hidden transaction in the region. "Guard this with your life," he says. "And never, ever open it." He leaves for the coast. The ledger sits on the table, unlocked.',
    godVoice: 'Knowledge is power. The question is whether power corrupts or liberates.',
    choices: [
      {
        id: 'honesty_1_honor',
        text: 'She wraps the ledger in oilcloth and locks it in the strongbox. A promise is a promise.',
        godAction: 'You strengthen the seal. Integrity has its own kind of power.',
        axiologicalShifts: { honesty_cunning: 0.2 },
        gateTags: ['honorable_origin'],
        traitSeeds: ['trustworthy'],
      },
      {
        id: 'honesty_1_read',
        text: 'She opens it before midnight. By morning, she knows who really controls this town.',
        godAction: 'You turn the page for her. Secrets are your currency.',
        axiologicalShifts: { honesty_cunning: -0.2 },
        gateTags: ['cunning_origin', 'knowledge_seeker'],
        traitSeeds: ['shrewd'],
      },
    ],
  },

  // ── Axiological: Courage vs Prudence (Meta) ──
  {
    id: 'dilemma.axio.courage_1',
    category: 'axiological',
    targetValuePair: 'courage_prudence',
    setup: 'The beast has been taking livestock for weeks. Now it\'s taken a child. The hunters say wait for reinforcements from the garrison — three days\' ride. The child\'s mother screams at the gate. Three days is too long.',
    godVoice: 'The beast is real. The danger is real. What kind of story begins here?',
    choices: [
      {
        id: 'courage_1_hunt',
        text: 'She takes a torch and a borrowed sword and walks into the dark alone. Some things can\'t wait.',
        godAction: 'You light the way. This one burns bright.',
        axiologicalShifts: { courage_prudence: 0.25 },
        gateTags: ['heroic_origin', 'bold_beginning'],
        traitSeeds: ['fearless'],
      },
      {
        id: 'courage_1_wait',
        text: 'She comforts the mother and organizes a watch. When the garrison arrives, she leads them to the lair — prepared, armored, and overwhelming.',
        godAction: 'You teach patience. The wise survive to fight again.',
        axiologicalShifts: { courage_prudence: -0.2 },
        gateTags: ['strategic_origin'],
        traitSeeds: ['methodical'],
      },
    ],
  },

  // ── Axiological: Sacrifice vs Survival (Star) ──
  {
    id: 'dilemma.axio.sacrifice_1',
    category: 'axiological',
    targetValuePair: 'sacrifice_survival',
    setup: 'The plague has reached the outer village. The healers have enough cure-root for the village or for the city beyond — not both. The city has ten thousand souls. The village has forty, including her family.',
    godVoice: 'Numbers or names. The scales of fate demand an answer.',
    choices: [
      {
        id: 'sacrifice_1_village',
        text: 'She loads the cart for the city. Her mother watches from the porch, understanding everything.',
        godAction: 'You harden her heart against the weight of what she\'s done.',
        axiologicalShifts: { sacrifice_survival: 0.2 },
        gateTags: ['sacrifice_seed', 'greater_good'],
        traitSeeds: ['burdened'],
      },
      {
        id: 'sacrifice_1_family',
        text: 'She distributes every vial in the village. The city will find its own salvation.',
        godAction: 'You anchor her to the people she loves. The world can burn, but not these forty.',
        axiologicalShifts: { sacrifice_survival: -0.2 },
        gateTags: ['survival_instinct', 'devotion_seed'],
        traitSeeds: ['protective'],
      },
    ],
  },

  // ── Reach-specific: Iron (warfare/combat) ──
  {
    id: 'dilemma.reach.iron_1',
    category: 'reach_specific',
    targetReach: 'iron',
    setup: 'The old swordmaster offers a final lesson. "I can teach you the clean form — precise, disciplined, predictable. Or I can teach you the ugly truth of killing." He draws two different blades.',
    godVoice: 'The weapon shapes the wielder. Choose the blade that serves your design.',
    choices: [
      {
        id: 'iron_1_discipline',
        text: 'She takes the straight blade. War is an art, and she will be its master.',
        godAction: 'You guide her hand. Precision is divine.',
        axiologicalShifts: { tradition_novelty: 0.1 },
        reachChanges: { iron: 0.05 },
        gateTags: ['martial_discipline'],
        traitSeeds: ['disciplined'],
      },
      {
        id: 'iron_1_savage',
        text: 'She takes the jagged blade. The ugly truth is: the dead don\'t care about form.',
        godAction: 'You flood her with the raw instinct of survival.',
        axiologicalShifts: { mercy_ruthlessness: -0.1 },
        reachChanges: { iron: 0.05 },
        gateTags: ['ruthless_origin', 'blood_on_hands'],
        traitSeeds: ['savage'],
      },
    ],
  },

  // ── Reach-specific: Heart (leadership/charisma) ──
  {
    id: 'dilemma.reach.heart_1',
    category: 'reach_specific',
    targetReach: 'heart',
    setup: 'Two factions in the village are ready to fight — the fishers blame the farmers for damming the upstream creek. She\'s asked to mediate. Both sides trust her, but any compromise will anger one of them.',
    godVoice: 'Power over others begins at this moment. How she wields it defines everything.',
    choices: [
      {
        id: 'heart_1_inspire',
        text: 'She stands on the bridge and speaks of the flood that nearly drowned them all — how both sides rescued each other. Unity through shared memory.',
        godAction: 'You fill her voice with an echo of the divine. They listen.',
        axiologicalShifts: { loyalty_ambition: 0.1 },
        reachChanges: { heart: 0.05 },
        gateTags: ['leader_born', 'heroic_origin'],
        traitSeeds: ['inspiring'],
      },
      {
        id: 'heart_1_play',
        text: 'She meets each faction leader privately. By dawn, each believes they got the better deal. Neither realizes she\'s taken a cut.',
        godAction: 'You whisper calculations into her ear. Every peace has a price.',
        axiologicalShifts: { honesty_cunning: -0.1 },
        reachChanges: { heart: 0.03, shadow: 0.03 },
        gateTags: ['cunning_origin', 'manipulator_seed'],
        traitSeeds: ['silver-tongued'],
      },
    ],
  },

  // ── Reach-specific: Eye (perception/knowledge) ──
  {
    id: 'dilemma.reach.eye_1',
    category: 'reach_specific',
    targetReach: 'eye',
    setup: 'In the old library, she finds a text that contradicts everything the village priest teaches. The truth is clear: the founding myth is a lie. The priest is beloved. The lie keeps the peace.',
    godVoice: 'Truth is a blade. Who it cuts depends on who holds it.',
    choices: [
      {
        id: 'eye_1_reveal',
        text: 'She brings the text to the village square. Let them see. Let them decide.',
        godAction: 'You blow the dust from the pages. Truth serves your design.',
        axiologicalShifts: { revelation_discretion: 0.15 },
        reachChanges: { eye: 0.05 },
        gateTags: ['truth_seeker', 'iconoclast'],
        traitSeeds: ['truth-seeker'],
      },
      {
        id: 'eye_1_keep',
        text: 'She hides the text behind a loose stone. Some truths are too expensive to share. But she remembers.',
        godAction: 'You seal the knowledge in her memory. A secret held is power stored.',
        axiologicalShifts: { revelation_discretion: -0.1, honesty_cunning: -0.1 },
        reachChanges: { eye: 0.03, shadow: 0.02 },
        gateTags: ['secret_keeper'],
        traitSeeds: ['perceptive'],
      },
    ],
  },

  // ── Domain-specific: Spirit ──
  {
    id: 'dilemma.domain.spirit_1',
    category: 'domain_specific',
    targetSphere: 'spirit',
    setup: 'She wakes from a dream where a voice offered her power in exchange for something she can\'t name. The dream left a mark on her palm — a sigil that glows faintly in moonlight. The village healer says she\'s been touched by something beyond mortal understanding.',
    godVoice: 'My mark. My choice. She carries a fragment of the divine now, whether she knows it or not.',
    choices: [
      {
        id: 'spirit_1_embrace',
        text: 'She holds her palm to the moon and whispers "yes." The mark brightens. Something inside her shifts.',
        godAction: 'You deepen the connection. This one is willing.',
        axiologicalShifts: { sacrifice_survival: 0.1, courage_prudence: 0.1 },
        gateTags: ['cosmic_touch', 'devotion_seed', 'transcendence_seed'],
        traitSeeds: ['god-touched'],
      },
      {
        id: 'spirit_1_resist',
        text: 'She wraps her hand in cloth and ignores the glow. Whatever it is, she won\'t be owned.',
        godAction: 'You feel the resistance. Interesting. A thread that fights back.',
        axiologicalShifts: { preservation_transformation: -0.15 },
        gateTags: ['defiant_spirit'],
        traitSeeds: ['strong-willed'],
      },
    ],
  },

  // ── Domain-specific: Force ──
  {
    id: 'dilemma.domain.force_1',
    category: 'domain_specific',
    targetSphere: 'force',
    setup: 'Lightning strikes the old oak in the village square, splitting it in two. Where the heartwood cracked, something metallic gleams — an ancient weapon, fused with the wood, thrumming with energy. Nobody dares touch it.',
    godVoice: 'Force made manifest. The weapon chooses, or is chosen.',
    choices: [
      {
        id: 'force_1_take',
        text: 'She reaches into the smoking wood with bare hands and pulls the weapon free. It burns. She holds it anyway.',
        godAction: 'You channel the lightning\'s echo through her grip. She endures.',
        axiologicalShifts: { courage_prudence: 0.15 },
        reachChanges: { iron: 0.03 },
        gateTags: ['bold_beginning', 'artifact_claimed'],
        traitSeeds: ['lightning-touched'],
        graphAdditions: [{ type: 'equipment', templateId: 'artifact_storm_weapon', name: 'Storm-Split Blade', properties: { sphere: 'force' } }],
      },
      {
        id: 'force_1_study',
        text: 'She doesn\'t touch it. Instead, she spends three days studying the sigils on the blade, learning what it wants before deciding if she wants it back.',
        godAction: 'You admire the patience. Knowledge before power.',
        axiologicalShifts: { courage_prudence: -0.1 },
        reachChanges: { eye: 0.03, veil: 0.02 },
        gateTags: ['knowledge_seeker', 'cautious_power'],
        traitSeeds: ['studied'],
      },
    ],
  },

  // ── General/graph: Ally ──
  {
    id: 'dilemma.general.ally_1',
    category: 'general',
    setup: 'A stranger saves her life on the road — a traveling sellsword who happened to be in the right place. He asks nothing in return but campfire and conversation. Over three nights of travel, she learns he has enemies, debts, and a code of honor that\'s gotten him in trouble before.',
    godVoice: 'A thread brushes against another thread. Do you weave them together?',
    choices: [
      {
        id: 'ally_1_bond',
        text: 'When his enemies find them at the crossroads, she draws her weapon without being asked. Some debts are paid forward.',
        godAction: 'You knot the threads together. This bond will matter.',
        axiologicalShifts: { loyalty_ambition: 0.1 },
        gateTags: ['alliance_forged', 'heroic_origin'],
        traitSeeds: ['oath-keeper'],
        graphAdditions: [{ type: 'ally', templateId: 'npc_sellsword', name: 'Traveling Sellsword', properties: { bond: 'life_debt' } }],
      },
      {
        id: 'ally_1_part',
        text: 'At the crossroads, she takes the other path. A life saved is enough. Entanglements are expensive.',
        godAction: 'You sever the loose thread. She walks alone, for now.',
        axiologicalShifts: { loyalty_ambition: -0.05, sacrifice_survival: -0.1 },
        gateTags: ['lone_path'],
        traitSeeds: ['self-reliant'],
      },
    ],
  },

  // ── General/graph: Faction ──
  {
    id: 'dilemma.general.faction_1',
    category: 'general',
    setup: 'The guild offers membership. Protection, trade rights, access to the northern routes. The price: a tithe on every transaction, loyalty oaths, and silence about what happens in the guild hall basement.',
    godVoice: 'Power through belonging, or freedom through solitude. Both have their costs.',
    choices: [
      {
        id: 'faction_1_join',
        text: 'She signs the ledger and takes the guild pin. The basement is someone else\'s problem — for now.',
        godAction: 'You embed her in the web of mortal power. Connections multiply.',
        axiologicalShifts: { loyalty_ambition: -0.1, asceticism_extravagance: -0.1 },
        gateTags: ['faction_aligned', 'pragmatic_choice'],
        traitSeeds: ['networked'],
        graphAdditions: [{ type: 'faction_membership', templateId: 'faction_merchant_guild', name: 'Merchant Guild', properties: { rank: 'initiate' } }],
      },
      {
        id: 'faction_1_refuse',
        text: 'She walks out. Whatever\'s in the basement is reason enough to stay clear.',
        godAction: 'You strengthen her independence. The unaligned have their own power.',
        axiologicalShifts: { honesty_cunning: 0.1 },
        gateTags: ['independent_spirit'],
        traitSeeds: ['independent'],
      },
    ],
  },

  // ── Axiological: Preservation vs Transformation (Stone) ──
  {
    id: 'dilemma.axio.preservation_1',
    category: 'axiological',
    targetValuePair: 'preservation_transformation',
    setup: 'The old bridge has held the village\'s weight for three generations — cracked, patched, beloved. The flood season has weakened its foundations. The choice before her: shore up the old stones at enormous cost, maintaining what the village knows, or let the damaged span fall and raise something stronger in its place.',
    godVoice: 'Every stone remembers the hands that placed it. Some things are worth preserving. Some must be torn down to build what endures.',
    choices: [
      {
        id: 'preservation_1_keep',
        text: 'She mortars the cracks herself, working through winter. The old bridge stands for another generation.',
        godAction: 'You steady her hands. What has endured has earned the right to endure further.',
        axiologicalShifts: { preservation_transformation: 0.2 },
        gateTags: ['fortress_posture', 'tradition_keeper'],
        traitSeeds: ['steadfast'],
      },
      {
        id: 'preservation_1_rebuild',
        text: 'She marks where the new bridge will stand. The old stones become foundations for something that will outlast them all.',
        godAction: 'You clear the rubble. The forge consumes what the fortress could not hold.',
        axiologicalShifts: { preservation_transformation: -0.2 },
        gateTags: ['forge_posture', 'builder_born'],
        traitSeeds: ['visionary'],
      },
      {
        id: 'preservation_1_salvage',
        text: 'She salvages the keystones — each carved with names — and sets them into the new crossing. The memory survives even if the structure does not.',
        godAction: 'You weave the old into the new. Change need not erase what came before.',
        axiologicalShifts: { preservation_transformation: -0.1, tradition_novelty: 0.1 },
        gateTags: ['bridge_keeper', 'synthesis_seeker'],
        traitSeeds: ['thoughtful'],
      },
    ],
  },

  // ── Axiological: Tradition vs Novelty (Veil) ──
  {
    id: 'dilemma.axio.tradition_1',
    category: 'axiological',
    targetValuePair: 'tradition_novelty',
    setup: 'The harvest ritual has been performed the same way for seven generations. This year, she\'s noticed the old words are wrong — a transcription error from two generations back. The corrected ritual might work better. Or it might anger the spirits the village believes in.',
    godVoice: 'The old ways carried power. But were they ever correct?',
    choices: [
      {
        id: 'tradition_1_keep',
        text: 'She performs the ritual exactly as written. Seven generations can\'t all be wrong.',
        godAction: 'You reinforce the weight of history. Continuity has its own strength.',
        axiologicalShifts: { tradition_novelty: 0.2 },
        gateTags: ['tradition_keeper'],
        traitSeeds: ['traditional'],
      },
      {
        id: 'tradition_1_change',
        text: 'She corrects the words. The harvest is the best in living memory.',
        godAction: 'You reward the courage to question. Innovation begins here.',
        axiologicalShifts: { tradition_novelty: -0.2 },
        gateTags: ['innovator', 'iconoclast'],
        traitSeeds: ['innovative'],
      },
    ],
  },

  // ── Reach-specific: Gold (wealth/trade) ──
  {
    id: 'dilemma.reach.gold_1',
    category: 'reach_specific',
    targetReach: 'gold',
    setup: 'The drought has made water worth more than silver. She has the only functional well in the district. The neighboring village sends children with empty buckets and nothing to trade.',
    godVoice: 'Scarcity creates power. What she does with it defines everything.',
    choices: [
      {
        id: 'gold_1_share',
        text: 'She opens the well to all. When winter comes and she has nothing left, the neighbors remember. The debts are paid in a hundred small kindnesses.',
        godAction: 'You sow generosity. Some investments pay in ways gold cannot measure.',
        axiologicalShifts: { asceticism_extravagance: 0.15, mercy_ruthlessness: 0.1 },
        reachChanges: { gold: 0.03, heart: 0.03 },
        gateTags: ['generosity', 'community_builder'],
        traitSeeds: ['generous'],
      },
      {
        id: 'gold_1_trade',
        text: 'She rations the water carefully, trading access for labor, goods, and future favors. By harvest, she controls the district\'s economy.',
        godAction: 'You sharpen her instincts. Resources are the language of power.',
        axiologicalShifts: { asceticism_extravagance: -0.15 },
        reachChanges: { gold: 0.05 },
        gateTags: ['pragmatic_choice', 'ambitious_seed'],
        traitSeeds: ['merchant-minded'],
      },
    ],
  },

  // ── Reach-specific: Veil (magic/arcane) ──
  {
    id: 'dilemma.reach.veil_1',
    category: 'reach_specific',
    targetReach: 'veil',
    setup: 'The old grimoire she found in the collapsed cellar responds to her touch — pages turning on their own, ink rearranging to match her questions. The more she reads, the more the candles flicker. Something watches from the other side of the veil.',
    godVoice: 'The veil thins where curiosity pushes. She is close to seeing what I see.',
    choices: [
      {
        id: 'veil_1_push',
        text: 'She reads until dawn, letting the words reshape her understanding. When she finally looks up, the room is different. She is different.',
        godAction: 'You thin the veil further. Let her see.',
        axiologicalShifts: { tradition_novelty: -0.1 },
        reachChanges: { veil: 0.06 },
        gateTags: ['arcane_awakening', 'transcendence_seed'],
        traitSeeds: ['veil-touched'],
      },
      {
        id: 'veil_1_close',
        text: 'She closes the book and burns it. Some doors should stay shut.',
        godAction: 'You respect the choice, even as you feel the potential dim.',
        axiologicalShifts: { courage_prudence: -0.15, tradition_novelty: 0.1 },
        reachChanges: { veil: 0.02 },
        gateTags: ['cautious_power'],
        traitSeeds: ['wary'],
      },
    ],
  },

];

// ─── Spark Investment Options ─────────────────────────────────────

/**
 * Generate spark investment options based on the candidate's reaches.
 * Returns 3 options: primary reach, secondary reach, and a third reach.
 */
export function getSparkInvestmentOptions(
  primaryReach: ReachDomain,
  secondaryReach: ReachDomain,
  thirdReach: ReachDomain,
): SparkInvestmentOption[] {
  const REACH_INVESTMENT_TEXT: Record<ReachDomain, string> = {
    iron:   'You steer them toward the blade-smiths',
    gold:   'You open the doors of the merchant houses',
    shadow: 'You teach them to walk unseen',
    veil:   'You open their mind to the hidden world',
    heart:  'You plant the seed of command',
    eye:    'You sharpen their sight beyond mortal limits',
    stone:  'You root them in the deep places of the earth',
    star:   'You kindle the divine spark within them',
  };

  return [
    {
      id: `spark_invest_${primaryReach}`,
      text: REACH_INVESTMENT_TEXT[primaryReach],
      reach: primaryReach,
      traitSeed: `${primaryReach}_invested`,
    },
    {
      id: `spark_invest_${secondaryReach}`,
      text: REACH_INVESTMENT_TEXT[secondaryReach],
      reach: secondaryReach,
      traitSeed: `${secondaryReach}_invested`,
    },
    {
      id: `spark_invest_${thirdReach}`,
      text: REACH_INVESTMENT_TEXT[thirdReach],
      reach: thirdReach,
      traitSeed: `${thirdReach}_invested`,
    },
  ];
}

// ─── God-Given Trait Options (Step 3) ─────────────────────────────

/**
 * Trait options the god can bestow on The First at Step 3.
 * Filtered by primary reach, secondary reach, primary sphere.
 */
export interface GodGivenTraitOption {
  id: string;
  name: string;
  description: string;
  reach: ReachDomain;
}

export const GOD_GIVEN_TRAITS: GodGivenTraitOption[] = [
  // One per reach — divine blessings
  { id: 'trait.god.iron_will',       name: 'Iron Will',        description: 'An unbreakable resolve in battle',      reach: 'iron' },
  { id: 'trait.god.golden_tongue',   name: 'Golden Tongue',    description: 'Words that turn enemies into allies',   reach: 'gold' },
  { id: 'trait.god.shadow_step',     name: 'Shadow Step',      description: 'The ability to pass unseen',            reach: 'shadow' },
  { id: 'trait.god.veil_sight',      name: 'Veil Sight',       description: 'Perception beyond the mortal veil',     reach: 'veil' },
  { id: 'trait.god.heartfire',       name: 'Heartfire',        description: 'A presence that commands devotion',     reach: 'heart' },
  { id: 'trait.god.all_seeing',      name: 'All-Seeing',       description: 'Nothing escapes their gaze',            reach: 'eye' },
  { id: 'trait.god.stone_blood',     name: 'Stone Blood',      description: 'Endurance beyond mortal limits',        reach: 'stone' },
  { id: 'trait.god.star_touched',    name: 'Star-Touched',     description: 'A connection to the cosmic order',      reach: 'star' },
];

/**
 * Get god-given trait options filtered by the candidate's reaches and sphere.
 * Returns traits matching primary or secondary reach.
 */
export function getGodGivenTraitOptions(
  primaryReach: ReachDomain,
  secondaryReach: ReachDomain,
): GodGivenTraitOption[] {
  return GOD_GIVEN_TRAITS.filter(t =>
    t.reach === primaryReach || t.reach === secondaryReach
  );
}

// ─── Candidate Vignette Templates ──────────────────────────────────

/**
 * Short prose vignettes shown for each meeting candidate.
 * Keyed by reach domain — candidates get a vignette matching their
 * primary reach. Each reach has multiple templates to avoid repetition.
 *
 * Templates use {name} for the candidate's generated name and
 * {location} for the meeting location.
 */
export const CANDIDATE_VIGNETTE_TEMPLATES: Record<ReachDomain, readonly string[]> = {
  iron: [
    '{name} stands at the edge of the sparring ring, watching the others with the calm patience of someone who has already decided how each of them would fall.',
    '{name} sharpens a blade in the shadow of the wall, the strokes rhythmic and unhurried. The weapon is already sharp. The sharpening is for the mind.',
    '{name} carries scars the way some people carry titles — as credentials, not complaints.',
  ],
  gold: [
    '{name} counts the market stalls from the rooftop, lips moving, calculating margins that no one else has noticed exist.',
    '{name} trades a copper ring for a meal, a meal for a favor, and a favor for a seat at the merchant council. All before noon.',
    '{name} watches the caravan arrive and sees not goods but leverage.',
  ],
  shadow: [
    '{name} sits in the corner where two walls meet, a position from which every entrance is visible and no one can approach unseen.',
    '{name} arrived in {location} three days ago. No one noticed until today.',
    '{name} listens at the edge of conversations the way a fisherman reads water — for what moves beneath the surface.',
  ],
  veil: [
    '{name} traces a glyph in the dust, erases it, traces it again. The air tastes different the second time.',
    '{name} stares at a candle flame and the flame leans toward them, like a plant toward light.',
    '{name} speaks to the wind in {location} and the wind answers, though not in any language the others understand.',
  ],
  heart: [
    '{name} sits among the children of {location}, teaching them a game from a place they have never been. The children are laughing. The parents are watching. Something is being built here, in the space between the game and the laughter.',
    '{name} stands between two arguing farmers, hands raised, not to command but to hold the space open. The argument does not resolve, but it does not become a fight. That is the work.',
    '{name} carries water to the elder who cannot walk to the well. It is not their duty. No one asked. But the elder drinks, and {name} sits beside them for a while, because the water was not the point.',
    '{name} kneels in the common garden of {location}, pulling weeds from between someone else\'s rows. The garden belongs to everyone and no one, which means it belongs to whoever tends it.',
    '{name} gathers the frayed edges of {location} — the widow, the orphan, the stranger — and seats them at the same fire. Not charity. Architecture.',
  ],
  eye: [
    '{name} stands on the high ground above {location}, sketching the terrain in a journal that is already half full of observations no one asked for.',
    '{name} reads the old records in the settlement hall, cross-referencing dates and harvests, finding the pattern that everyone else mistook for coincidence.',
    '{name} watches the stars above {location} and marks the ones that have shifted since the last season.',
  ],
  stone: [
    '{name} runs a hand along the retaining wall, feeling for the crack that the rain will find before the spring. The wall was built by someone who knew what they were doing. {name} intends to be worthy of the work.',
    '{name} stacks stones at the edge of {location}, testing weight and balance, building nothing yet — just learning the language of the material.',
    '{name} repairs the gate hinge that everyone walks past. The gate has been sagging for months. It will not sag tomorrow.',
    '{name} rebuilds the broken section of the common well wall, stone by stone, in the quiet hour before dawn when no one is watching. The well serves everyone. The wall will outlast {name}.',
    '{name} studies the foundation of the oldest building in {location}, pressing an ear to the stone the way a healer presses an ear to a chest — listening for what holds and what is about to give.',
  ],
  star: [
    '{name} kneels at the crossroads outside {location} and whispers a prayer that is not for any god the settlement knows.',
    '{name} gave away the last of the bread and sits hungry at the edge of the road, watching the person who received it walk away without looking back.',
    '{name} tends the shrine that no one else remembers — sweeping the steps, replacing the candle, speaking the words.',
  ],
};
