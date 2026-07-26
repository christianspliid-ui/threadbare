// src/data/ambition-templates.ts
//
// Starter ambition content library — 10 standard templates and 4 reactive templates.

import type { AmbitionTemplate, ReactiveAmbitionTemplate } from '../types/ambition';
import type { AmbitionStrategicProfile } from '../types/strategicAction';

// ─── Standard Ambition Templates ─────────────────────────────────────────────

export const AMBITION_TEMPLATES: readonly AmbitionTemplate[] = [
  // 1. Dominate Regional Trade (dominion) — Gold/Eye
  {
    id: 'ambition_dominate_trade',
    displayName: 'Dominate Regional Trade',
    category: 'dominion',
    reachFloors: { gold: 0.4, eye: 0.3 },
    requiredTraits: [],
    blockingTraits: ['trait.core.core_warmth.vice'],
    sphereAffinities: ['matter', 'mind'],
    bondModifiers: [{ bondType: 'trade_partner', modifier: 0.3 }],
    boostingTraits: ['trait.mastery.trade-baron', '#social'],
    reachAffinity: { gold: 0.8, eye: 0.5, shadow: 0.2, heart: 0.2 },
    strategicProfile: {
      behaviorFamily: 'merchant-expansion',
      preferredVerbs: ['gather_info', 'create', 'control', 'change'],
      templateIds: [
        'strategic_survey_market',
        'strategic_negotiate_storage',
        'strategic_establish_trade_route',
        'strategic_build_warehouse',
        'strategic_found_guild_chapter',
        'strategic_maintain_monopoly',
      ],
      reachEmphasis: { gold: 0.8, eye: 0.5, shadow: 0.2, heart: 0.2 },
    },
    milestones: [
      {
        id: 'trade_bonds',
        condition: { type: 'agent_has_bonds', minCount: 3, basis: 'trade' },
        prose: ['The ledgers thicken. Names multiply.'],
      },
      {
        id: 'trade_location',
        condition: { type: 'agent_controls_location', locationType: 'market' },
        prose: ['A market answers to one voice now.'],
      },
      {
        id: 'trade_gold_mastery',
        condition: { type: 'agent_reach_above', reach: 'gold', threshold: 0.7 },
        prose: ['Coin flows where she wills it.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'gold', threshold: 0.2 },
        prose: ['The coffers emptied. The routes belong to others now.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'She set her eyes on the trade roads, and the trade roads noticed.',
      'Every coin that changed hands whispered a name back to him.',
    ],
    milestoneProse: {
      trade_bonds: ['New partners. New leverage.'],
      trade_location: ['The market square bears a single seal.'],
      trade_gold_mastery: ['Gold answers to gold, and hers answers loudest.'],
    },
    completionProse: [
      'The region trades by her leave. Caravans know no other route.',
    ],
    abandonmentProse: [
      'The markets forgot her name between one season and the next.',
    ],
  },

  // 2. Conquer Territory (dominion) — Iron/Heart
  {
    id: 'ambition_conquer_territory',
    displayName: 'Conquer Territory',
    category: 'dominion',
    reachFloors: { iron: 0.4, heart: 0.3 },
    requiredTraits: [],
    blockingTraits: ['pacifist'],
    sphereAffinities: ['force', 'mind'],
    bondModifiers: [{ bondType: 'vassal', modifier: 0.4 }],
    boostingTraits: ['trait.mastery.battle-hardened', 'trait.personality.iron.vice'],
    reachAffinity: { iron: 0.8, heart: 0.6, eye: 0.3 },
    strategicProfile: {
      behaviorFamily: 'warlord-expansion',
      preferredVerbs: ['gather_info', 'create', 'destroy', 'control'],
      templateIds: [
        'strategic_scout_defenses',
        'strategic_recruit_warband',
        'strategic_fortify_position',
        'strategic_establish_garrison',
        'strategic_raid_supply_lines',
        'strategic_claim_territory',
      ],
      reachEmphasis: { iron: 0.8, heart: 0.6, eye: 0.3 },
    },
    milestones: [
      {
        id: 'conquer_followers',
        condition: { type: 'agent_has_bonds', minCount: 4, basis: 'loyalty' },
        prose: ['Enough swords now to matter.'],
      },
      {
        id: 'conquer_hold',
        condition: { type: 'agent_controls_location', locationType: 'fortress' },
        prose: ['Stone walls. A banner. The beginning of something.'],
      },
      {
        id: 'conquer_iron',
        condition: { type: 'agent_reach_above', reach: 'iron', threshold: 0.7 },
        prose: ['His blade arm speaks for him in every hall.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'iron', threshold: 0.15 },
        prose: ['The sword arm failed. Territory requires strength he no longer has.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'He looked at the map and saw only what was not yet his.',
      'The land stretched wide and undefended. An invitation.',
    ],
    milestoneProse: {
      conquer_followers: ['A warband gathers at the fire.'],
      conquer_hold: ['The fortress gates close behind him. His gates now.'],
      conquer_iron: ['They say his name before drawing steel.'],
    },
    completionProse: [
      'The territory bent its knee. New borders, drawn in old blood.',
    ],
    abandonmentProse: [
      'The campaign withered on the march. Ambition outlived the strength to carry it.',
    ],
  },

  // 3. Forge Legendary Weapon (mastery) — Iron/Veil
  {
    id: 'ambition_forge_legend',
    displayName: 'Forge a Legendary Weapon',
    category: 'mastery',
    reachFloors: { iron: 0.4, veil: 0.3 },
    requiredTraits: ['master_smith'],
    blockingTraits: [],
    sphereAffinities: ['matter', 'energy'],
    bondModifiers: [],
    boostingTraits: ['perfectionist', 'trait.mastery.spell-weaver'],
    reachAffinity: { iron: 0.7, veil: 0.6, stone: 0.3 },
    milestones: [
      {
        id: 'forge_materials',
        condition: { type: 'agent_has_trait', trait: 'rare_ore_secured' },
        prose: ['The metal sang when struck. Not iron. Something older.'],
      },
      {
        id: 'forge_veil',
        condition: { type: 'agent_reach_above', reach: 'veil', threshold: 0.6 },
        prose: ['The runes came unbidden, etching themselves into the blank.'],
      },
      {
        id: 'forge_iron',
        condition: { type: 'agent_reach_above', reach: 'iron', threshold: 0.7 },
        prose: ['Ten thousand hammer-falls, and the shape of it finally true.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_lacks_trait', trait: 'master_smith' },
        prose: ['The forge grew cold. The masterwork would never be.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'The smith stared into the coals and saw a shape waiting.',
      'A weapon that would outlast the hand that forged it — that was the dream.',
    ],
    milestoneProse: {
      forge_materials: ['The right metal, found at last.'],
      forge_veil: ['Runes bloom along the fuller like frost on glass.'],
      forge_iron: ['The blade holds an edge that cuts shadow.'],
    },
    completionProse: [
      'The weapon rests on the anvil, finished. It hums with a name not yet spoken.',
    ],
    abandonmentProse: [
      'The forge grew cold. The masterwork would never be.',
    ],
  },

  // 4. Achieve Arcane Enlightenment (mastery) — Veil/Eye
  {
    id: 'ambition_arcane_enlightenment',
    displayName: 'Achieve Arcane Enlightenment',
    category: 'mastery',
    reachFloors: { veil: 0.4, eye: 0.3 },
    requiredTraits: [],
    blockingTraits: ['veil_blind'],
    sphereAffinities: ['mind', 'spirit'],
    bondModifiers: [{ bondType: 'mentor', modifier: 0.2 }],
    boostingTraits: ['#eye', '#veil'],
    reachAffinity: { veil: 0.9, eye: 0.5, star: 0.3 },
    strategicProfile: {
      behaviorFamily: 'scholar-seeker',
      preferredVerbs: ['gather_info', 'create', 'control'],
      templateIds: [
        'strategic_research_archive',
        'strategic_investigate_anomaly',
        'strategic_write_treatise',
        'strategic_establish_research_circle',
        'strategic_mount_expedition',
        'strategic_guard_knowledge',
      ],
      reachEmphasis: { veil: 0.9, eye: 0.5, star: 0.3 },
    },
    milestones: [
      {
        id: 'arcane_veil_high',
        condition: { type: 'agent_reach_above', reach: 'veil', threshold: 0.8 },
        prose: ['The world thinned. She could see through its seams.'],
      },
      {
        id: 'arcane_mentor',
        condition: { type: 'agent_has_bonds', minCount: 1, basis: 'arcane_tutelage' },
        prose: ['A teacher appeared — or perhaps was always there, waiting.'],
      },
      {
        id: 'arcane_trait',
        condition: { type: 'agent_has_trait', trait: 'trait.mastery.spell-weaver' },
        prose: ['Understanding arrived not as a thought but as a silence.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'veil', threshold: 0.15 },
        prose: ['The veil closed over. The patterns dissolved back into noise.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'She pressed her palm to the world and felt it press back.',
      'The old texts whispered of a threshold. He meant to cross it.',
    ],
    milestoneProse: {
      arcane_veil_high: ['The veil parts like curtain-cloth.'],
      arcane_mentor: ['Knowledge has a voice. It sounds like patience.'],
      arcane_trait: ['Enlightenment: quieter than expected.'],
    },
    completionProse: [
      'The arcane laid itself bare. Not mastered — understood.',
    ],
    abandonmentProse: [
      'The mysteries receded, leaving only the taste of copper and regret.',
    ],
  },

  // 5. Found a Dynasty (legacy) — Gold/Heart/Star
  {
    id: 'ambition_found_dynasty',
    displayName: 'Found a Dynasty',
    category: 'legacy',
    reachFloors: { gold: 0.3, heart: 0.3 },
    requiredTraits: [],
    blockingTraits: ['barren_line'],
    sphereAffinities: ['life', 'time'],
    bondModifiers: [
      { bondType: 'heir', modifier: 0.5 },
      { bondType: 'spouse', modifier: 0.3 },
    ],
    boostingTraits: ['noble_blood', 'trait.mastery.silver-tongue'],
    reachAffinity: { gold: 0.6, heart: 0.7, star: 0.4 },
    strategicProfile: {
      behaviorFamily: 'court-political',
      preferredVerbs: ['create', 'control', 'change', 'gather_info'],
      templateIds: [
        'strategic_assess_politics',
        'strategic_buy_influence',
        'strategic_secure_office',
        'strategic_organize_patronage',
        'strategic_establish_dynasty_seat',
        'strategic_maintain_authority',
      ],
      reachEmphasis: { gold: 0.6, heart: 0.7, star: 0.4 },
    },
    milestones: [
      {
        id: 'dynasty_heir',
        condition: { type: 'agent_has_bonds', minCount: 1, basis: 'lineage' },
        prose: ['A child. A continuation. The line would hold.'],
      },
      {
        id: 'dynasty_seat',
        condition: { type: 'agent_controls_location', locationType: 'estate' },
        prose: ['A seat of power, however modest. Roots need soil.'],
      },
      {
        id: 'dynasty_alliances',
        condition: { type: 'agent_has_bonds', minCount: 3, basis: 'alliance' },
        prose: ['Three houses now bind their word to hers.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        // THR-808: was `agent_lacks_trait: 'living'`. No producer has ever minted a
        // `living` trait, so the gate was permanently false and this ambition had no
        // reachable abandonment path. Aliveness is engine state, not a trait.
        condition: { type: 'agent_deceased' },
        prose: ['The founder fell before the foundation set.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'She planted a name in the earth and dared it to grow.',
      'Not for himself. For the ones who would carry the name after.',
    ],
    milestoneProse: {
      dynasty_heir: ['Blood calls to blood across the years.'],
      dynasty_seat: ['The estate stands. A beginning made of stone.'],
      dynasty_alliances: ['Alliances woven like thread through a loom.'],
    },
    completionProse: [
      'The dynasty breathes. Her name will outlast the century.',
    ],
    abandonmentProse: [
      'The line guttered out. No heir, no seat, no name remembered.',
    ],
  },

  // 6. Escape a Cursed Land (survival) — Stone/Flesh
  {
    id: 'ambition_escape_cursed_land',
    displayName: 'Escape a Cursed Land',
    category: 'survival',
    reachFloors: { stone: 0.2, star: 0.2 },
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: ['entropy', 'life'],
    bondModifiers: [{ bondType: 'fellow_refugee', modifier: 0.3 }],
    boostingTraits: ['trait.mastery.steadfast', 'trait.condition.exhausted'],
    reachAffinity: { stone: 0.6, star: 0.7, shadow: 0.4 },
    milestones: [
      {
        id: 'escape_endurance',
        condition: { type: 'agent_reach_above', reach: 'star', threshold: 0.5 },
        prose: ['The body held. Barely, but it held.'],
      },
      {
        id: 'escape_exit',
        condition: { type: 'agent_not_in_region', region: 'cursed' },
        prose: ['The blighted air thinned. Clean wind. A border crossed.'],
      },
    ],
    completion: { requires: 2, of: 2 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'star', threshold: 0.05 },
        prose: ['The land kept what it was owed.'],
      },
    ],
    abandonmentCooldown: 30,
    selectionProse: [
      'The soil turned black underfoot. Staying meant dying slowly.',
      'They carried the weight of old promises across salt-stained ground.',
    ],
    milestoneProse: {
      escape_endurance: ['Still breathing. That counts for something.'],
      escape_exit: ['Behind them: poison. Ahead: the unknown. Better.'],
    },
    completionProse: [
      'Free. The cursed land released its grip, or perhaps simply lost interest.',
    ],
    abandonmentProse: [
      'The blight took root in bone. There would be no leaving.',
    ],
  },

  // 7. Uncover Ancient Secrets (discovery) — Eye/Veil/Stone
  {
    id: 'ambition_uncover_secrets',
    displayName: 'Uncover Ancient Secrets',
    category: 'discovery',
    reachFloors: { eye: 0.4, veil: 0.3 },
    requiredTraits: [],
    blockingTraits: ['incurious'],
    sphereAffinities: ['time', 'mind'],
    bondModifiers: [{ bondType: 'informant', modifier: 0.2 }],
    boostingTraits: ['#eye', 'ruin_delver'],
    reachAffinity: { eye: 0.8, veil: 0.5, stone: 0.4 },
    strategicProfile: {
      behaviorFamily: 'scholar-seeker',
      preferredVerbs: ['gather_info', 'create', 'control'],
      templateIds: [
        'strategic_research_archive',
        'strategic_investigate_anomaly',
        'strategic_write_treatise',
        'strategic_establish_research_circle',
        'strategic_mount_expedition',
        'strategic_guard_knowledge',
      ],
      reachEmphasis: { eye: 0.8, veil: 0.5, stone: 0.4 },
    },
    milestones: [
      {
        id: 'secrets_ruin',
        condition: { type: 'agent_controls_location', locationType: 'ruin' },
        prose: ['The ruin opened like a wound, and inside — writing.'],
      },
      {
        id: 'secrets_eye',
        condition: { type: 'agent_reach_above', reach: 'eye', threshold: 0.7 },
        prose: ['Patterns emerged from the noise. Connections, old and deliberate.'],
      },
      {
        id: 'secrets_trait',
        condition: { type: 'agent_has_trait', trait: 'trait.reputation.shadow.positive' },
        prose: ['The knowledge settled in, heavy and quiet as silt.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'eye', threshold: 0.15 },
        prose: ['The trail went cold. The secrets kept themselves.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'Something was buried here once, on purpose. She meant to know what.',
      'The past does not stay buried. It only waits for the right question.',
    ],
    milestoneProse: {
      secrets_ruin: ['Dust and dead languages. A promising start.'],
      secrets_eye: ['Seeing clearly now — too clearly, perhaps.'],
      secrets_trait: ['The secret sits inside him like a second heartbeat.'],
    },
    completionProse: [
      'The ancient truth surfaced at last. Whether it was worth the finding remains to be seen.',
    ],
    abandonmentProse: [
      'The question went unanswered. The ruins kept their counsel.',
    ],
  },

  // 8. Spread the Faith (devotion) — Star/Heart
  {
    id: 'ambition_spread_faith',
    displayName: 'Spread the Faith',
    category: 'devotion',
    reachFloors: { star: 0.4, heart: 0.3 },
    requiredTraits: [],
    blockingTraits: ['apostate'],
    sphereAffinities: ['spirit', 'mind'],
    bondModifiers: [{ bondType: 'convert', modifier: 0.3 }],
    boostingTraits: ['trait.reputation.star.negative', 'trait.mastery.silver-tongue'],
    reachAffinity: { star: 0.8, heart: 0.6, eye: 0.2 },
    strategicProfile: {
      behaviorFamily: 'zealot-mission',
      preferredVerbs: ['gather_info', 'change', 'create', 'control'],
      templateIds: [
        'strategic_survey_faithful',
        'strategic_preach_masses',
        'strategic_found_shrine',
        'strategic_consecrate_site',
        'strategic_establish_sacred_route',
        'strategic_police_doctrine',
      ],
      reachEmphasis: { star: 0.8, heart: 0.6, eye: 0.2 },
    },
    milestones: [
      {
        id: 'faith_flock',
        condition: { type: 'agent_has_bonds', minCount: 5, basis: 'faith' },
        prose: ['Five souls who kneel when she speaks the words.'],
      },
      {
        id: 'faith_shrine',
        condition: { type: 'agent_controls_location', locationType: 'shrine' },
        prose: ['A shrine. Small, but the flame inside it is real.'],
      },
      {
        id: 'faith_star',
        condition: { type: 'agent_reach_above', reach: 'star', threshold: 0.7 },
        prose: ['The divine light pours through him like water through cloth.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'trait.core.core_hope.vice' },
        prose: ['The prayers stopped. The silence that followed was answer enough.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'The word burned in her mouth. It demanded to be spoken.',
      'He carried a truth too large for one chest. It needed more vessels.',
    ],
    milestoneProse: {
      faith_flock: ['The congregation grows, candle by candle.'],
      faith_shrine: ['Sacred ground, consecrated in whisper and salt.'],
      faith_star: ['The divine courses through him. He is vessel and voice.'],
    },
    completionProse: [
      'The faith took root. Where there was one voice, now a chorus.',
    ],
    abandonmentProse: [
      'The flock scattered. The shrine stood empty, gathering dust and doubt.',
    ],
  },

  // 9. Build a Great Work (legacy) — Gold/Iron/Stone
  {
    id: 'ambition_great_work',
    displayName: 'Build a Great Work',
    category: 'legacy',
    reachFloors: { gold: 0.3, iron: 0.3, stone: 0.3 },
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: ['matter', 'time'],
    bondModifiers: [{ bondType: 'laborer', modifier: 0.2 }],
    boostingTraits: ['trait.reputation.stone.positive', 'trait.personality.star.virtue'],
    reachAffinity: { gold: 0.5, iron: 0.4, stone: 0.7 },
    strategicProfile: {
      behaviorFamily: 'builder-civic',
      preferredVerbs: ['gather_info', 'create', 'change', 'control'],
      templateIds: [
        'strategic_survey_site',
        'strategic_draft_plans',
        'strategic_civic_construction',
        'strategic_fortify_defenses',
        'strategic_build_granary',
        'strategic_maintain_civic_order',
      ],
      reachEmphasis: { gold: 0.5, iron: 0.4, stone: 0.7 },
    },
    milestones: [
      {
        id: 'work_labor',
        condition: { type: 'agent_has_bonds', minCount: 3, basis: 'labor' },
        prose: ['Hands enough now. The foundation can begin.'],
      },
      {
        id: 'work_site',
        condition: { type: 'agent_controls_location', locationType: 'construction_site' },
        prose: ['The ground is staked. The plans unfurled against the wind.'],
      },
      {
        id: 'work_stone',
        condition: { type: 'agent_reach_above', reach: 'stone', threshold: 0.7 },
        prose: ['He reads the grain of stone the way others read faces.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'gold', threshold: 0.1 },
        prose: ['The funds dried up. The scaffolding stood naked against the sky.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'Something that would stand when everything else had fallen. That was the promise.',
      'She drew the plans on dirt and saw a monument.',
    ],
    milestoneProse: {
      work_labor: ['A workforce assembles. Purpose written on calloused hands.'],
      work_site: ['The site is claimed. Construction begins.'],
      work_stone: ['Stone obeys her. The great work rises.'],
    },
    completionProse: [
      'The great work stands complete. It will outlast its maker, as intended.',
    ],
    abandonmentProse: [
      'The half-built ruin became its own kind of monument. To failure.',
    ],
  },

  // 10. Become the Greatest Healer (mastery) — Heart/Flesh/Star
  {
    id: 'ambition_greatest_healer',
    displayName: 'Become the Greatest Healer',
    category: 'mastery',
    reachFloors: { heart: 0.3, gold: 0.3 },
    requiredTraits: [],
    blockingTraits: ['plague_bearer'],
    sphereAffinities: ['life', 'spirit'],
    bondModifiers: [{ bondType: 'patient', modifier: 0.2 }],
    boostingTraits: ['trait.mastery.anointed', 'trait.core.core_warmth.virtue'],
    reachAffinity: { heart: 0.6, gold: 0.7, star: 0.4 },
    milestones: [
      {
        id: 'healer_bonds',
        condition: { type: 'agent_has_bonds', minCount: 4, basis: 'gratitude' },
        prose: ['Four lives owed. The debt is theirs, not hers.'],
      },
      {
        id: 'healer_flesh',
        condition: { type: 'agent_reach_above', reach: 'gold', threshold: 0.7 },
        prose: ['She reads the body like a map — every vein a road, every bruise a story.'],
      },
      {
        id: 'healer_trait',
        condition: { type: 'agent_has_trait', trait: 'trait.mastery.anointed' },
        prose: ['They brought the dying child. She brought it back.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'gold', threshold: 0.1 },
        prose: ['Physician, heal thyself. She could not.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'Every wound was a question. She intended to learn every answer.',
      'He pressed his hands to the fevered skin and felt the sickness retreat.',
    ],
    milestoneProse: {
      healer_bonds: ['The grateful remember. The healed return with others.'],
      healer_flesh: ['The body has no secrets from her now.'],
      healer_trait: ['Miracle — or mastery pushed past what anyone thought possible.'],
    },
    completionProse: [
      'The greatest healer. They speak her name in sick-rooms like a prayer.',
    ],
    abandonmentProse: [
      'The healing hands stilled. Some wounds, it turned out, were her own.',
    ],
  },
] as const;

// ─── Reactive Ambition Templates ─────────────────────────────────────────────

export const REACTIVE_AMBITION_TEMPLATES: readonly ReactiveAmbitionTemplate[] = [
  // 1. Seek Revenge (vengeance, triggered by betrayal)
  {
    id: 'ambition_seek_revenge',
    displayName: 'Seek Revenge',
    category: 'vengeance',
    triggerEvent: 'betrayal',
    skipFilters: false,
    reachFloors: { iron: 0.3, shadow: 0.3 },
    requiredTraits: [],
    blockingTraits: ['trait.core.core_forgiveness.virtue'],
    sphereAffinities: ['force', 'entropy'],
    bondModifiers: [{ bondType: 'enemy', modifier: 0.5 }],
    boostingTraits: ['trait.core.core_forgiveness.vice', 'trait.personality.iron.vice'],
    reachAffinity: { iron: 0.6, shadow: 0.8, eye: 0.3 },
    milestones: [
      {
        id: 'revenge_track',
        condition: { type: 'agent_reach_above', reach: 'eye', threshold: 0.5 },
        prose: ['The betrayer has a trail. Every trail has an end.'],
      },
      {
        id: 'revenge_shadow',
        condition: { type: 'agent_reach_above', reach: 'shadow', threshold: 0.6 },
        prose: ['Patience. The knife sharpens in the dark.'],
      },
      {
        id: 'revenge_target',
        condition: { type: 'target_agent_eliminated', targetRef: '$betrayer' },
        prose: ['Done. The debt paid in the only coin that mattered.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'trait.core.core_forgiveness.virtue' },
        prose: ['The rage cooled. The hand unclenched. Something like peace.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'Betrayal has a taste. He would make the traitor swallow it.',
      'The wound was still fresh when she began to plan.',
    ],
    milestoneProse: {
      revenge_track: ['Found. Only a matter of time now.'],
      revenge_shadow: ['Silent and sure. The shadow closes.'],
      revenge_target: ['The betrayer fell. The scales balanced.'],
    },
    completionProse: [
      'Revenge, taken. Whether it brought peace — that was another question.',
    ],
    abandonmentProse: [
      'The vengeance went cold. The betrayer walked free, and eventually so did she.',
    ],
  },

  // 2. Reclaim Homeland (dominion, triggered by loss_of_home)
  {
    id: 'ambition_reclaim_homeland',
    displayName: 'Reclaim the Homeland',
    category: 'dominion',
    triggerEvent: 'loss_of_home',
    skipFilters: false,
    reachFloors: { iron: 0.3, heart: 0.3 },
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: ['force', 'spirit'],
    bondModifiers: [{ bondType: 'exile_kin', modifier: 0.4 }],
    boostingTraits: ['exile', 'trait.mastery.steadfast'],
    reachAffinity: { iron: 0.7, heart: 0.6, stone: 0.3 },
    milestones: [
      {
        id: 'reclaim_followers',
        condition: { type: 'agent_has_bonds', minCount: 3, basis: 'loyalty' },
        prose: ['Others remember the homeland. They gather around the promise.'],
      },
      {
        id: 'reclaim_strength',
        condition: { type: 'agent_reach_above', reach: 'iron', threshold: 0.6 },
        prose: ['Strong enough now. The return can begin.'],
      },
      {
        id: 'reclaim_return',
        condition: { type: 'agent_in_region', region: 'homeland' },
        prose: ['The old soil underfoot again. Changed, but still home.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'accepted_exile' },
        prose: ['Home became a memory, and the memory became enough.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'The homeland burned behind him. He swore he would see it rebuilt.',
      'Exile sharpens the memory of home into something like a blade.',
    ],
    milestoneProse: {
      reclaim_followers: ['A warband of the dispossessed, bound by loss.'],
      reclaim_strength: ['The exile has teeth now.'],
      reclaim_return: ['Home. Scarred, but standing.'],
    },
    completionProse: [
      'The homeland reclaimed. The exile ended. The rebuilding begins.',
    ],
    abandonmentProse: [
      'The homeland faded to legend. A place that exists only in old songs.',
    ],
  },

  // 3. Avenge the Fallen (vengeance, triggered by death_of_bond_partner)
  {
    id: 'ambition_avenge_fallen',
    displayName: 'Avenge the Fallen',
    category: 'vengeance',
    triggerEvent: 'death_of_bond_partner',
    skipFilters: true,
    reachFloors: { iron: 0.2 },
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: ['force', 'entropy'],
    bondModifiers: [],
    boostingTraits: ['trait.core.core_hope.vice', 'trait.personality.heart.virtue'],
    reachAffinity: { iron: 0.7, shadow: 0.5, heart: 0.3 },
    milestones: [
      {
        id: 'avenge_culprit',
        condition: { type: 'agent_reach_above', reach: 'eye', threshold: 0.4 },
        prose: ['The killer has a name now.'],
      },
      {
        id: 'avenge_strike',
        condition: { type: 'target_agent_eliminated', targetRef: '$killer' },
        prose: ['The blow landed. For the one who can no longer strike.'],
      },
    ],
    completion: { requires: 2, of: 2 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'trait.core.core_hope.virtue' },
        prose: ['The dead do not ask for blood. Only the living insist on it.'],
      },
    ],
    abandonmentCooldown: 30,
    selectionProse: [
      'The bond-partner fell. The world narrowed to a single purpose.',
      'Grief wore the shape of a blade. She meant to use it.',
    ],
    milestoneProse: {
      avenge_culprit: ['A name. A face. A direction to walk.'],
      avenge_strike: ['The fallen are avenged. The living must find new purpose.'],
    },
    completionProse: [
      'Justice, or something shaped like it. The dead are silent on the matter.',
    ],
    abandonmentProse: [
      'The grief softened. The blade returned to its sheath, unstained.',
    ],
  },

  // 4. Fulfill Destiny (devotion, triggered by destiny_assigned)
  {
    id: 'ambition_fulfill_destiny',
    displayName: 'Fulfill the Destiny',
    category: 'devotion',
    triggerEvent: 'destiny_assigned',
    skipFilters: true,
    reachFloors: { star: 0.2 },
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: ['spirit', 'time'],
    bondModifiers: [{ bondType: 'fated_companion', modifier: 0.3 }],
    boostingTraits: ['destiny_marked', 'trait.mastery.steadfast'],
    reachAffinity: { star: 0.8, heart: 0.4, veil: 0.3 },
    milestones: [
      {
        id: 'destiny_understanding',
        condition: { type: 'agent_reach_above', reach: 'star', threshold: 0.6 },
        prose: ['The shape of the destiny clarified. Terrible and precise.'],
      },
      {
        id: 'destiny_trial',
        condition: { type: 'agent_has_trait', trait: 'destiny_tested' },
        prose: ['The trial came. She did not break.'],
      },
      {
        id: 'destiny_fulfilled',
        condition: { type: 'agent_has_trait', trait: 'destiny_fulfilled' },
        prose: ['The prophecy closed like a book. The last page, written in living.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'destiny_rejected' },
        prose: ['She turned her back on what was written. The stars went silent.'],
      },
    ],
    abandonmentCooldown: 50,
    selectionProse: [
      'The stars named her. She did not ask to be named.',
      'Destiny arrived like weather — unavoidable, impersonal, absolute.',
    ],
    milestoneProse: {
      destiny_understanding: ['The path reveals itself, one impossible step at a time.'],
      destiny_trial: ['Tested and unbroken. The destiny holds.'],
      destiny_fulfilled: ['What was foretold has come to pass.'],
    },
    completionProse: [
      'The destiny fulfilled. Whether it was hers or the world\'s remains unclear.',
    ],
    abandonmentProse: [
      'The destiny hung in the air, unclaimed. The stars found another.',
    ],
  },
] as const;

// ─── Event-Minted Ambition Templates (THR-726) ───────────────────────────────
//
// The world mints these into mortals in response to events they suffered or saw —
// see `AMBITION_MINTING_RULES` (ambition-minting-rules.ts) for which event mints
// which. They are ordinary funnel-gated `AmbitionTemplate`s (NOT reactive/skip-
// filters): the minting pass supplies them as candidates, `selectAmbitions` still
// decides. They are a SEPARATE pool so the spontaneous re-eval loop, which draws
// only from `AMBITION_TEMPLATES`, never assigns them without a triggering event.
//
// Milestones use agent-self predicates only (reach / bonds / controls / trait).
// `target_agent_eliminated` is deliberately avoided — with no per-instance target
// binding it would auto-complete against a missing `$`-ref node (graphConditions).

export const EVENT_MINTED_AMBITION_TEMPLATES: readonly AmbitionTemplate[] = [
  // 1. Avenge the Wrong (vengeance) — the victim of bloodshed or a torn bond
  {
    id: 'ambition_avenge_the_wrong',
    displayName: 'Avenge the Wrong',
    category: 'vengeance',
    reachFloors: { iron: 0.1 },
    requiredTraits: [],
    blockingTraits: ['trait.core.core_forgiveness.virtue'],
    sphereAffinities: ['force', 'entropy'],
    bondModifiers: [{ bondType: 'enemy', modifier: 0.4 }],
    boostingTraits: ['trait.core.core_forgiveness.vice', 'trait.personality.iron.vice', 'trait.core.core_humility.vice'],
    reachAffinity: { iron: 0.7, shadow: 0.6, eye: 0.3 },
    milestones: [
      {
        id: 'avenge_resolve',
        condition: { type: 'agent_reach_above', reach: 'shadow', threshold: 0.45 },
        prose: ['The grief hardened into something with an edge.'],
      },
      {
        id: 'avenge_strength',
        condition: { type: 'agent_reach_above', reach: 'iron', threshold: 0.55 },
        prose: ['Strong enough now to answer what was done.'],
      },
      {
        id: 'avenge_allies',
        condition: { type: 'agent_has_bonds', minCount: 2, basis: 'loyalty' },
        prose: ['Others who remember the wrong stand at their shoulder.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'trait.core.core_hope.virtue' },
        prose: ['The rage cooled. The debt was let go, or simply outlived.'],
      },
    ],
    abandonmentCooldown: 40,
    selectionProse: [
      'What was taken would be answered. That much they promised the dark.',
      'The wound closed over a purpose harder than the flesh around it.',
    ],
    milestoneProse: {
      avenge_resolve: ['No more weeping. Only the long, cold arithmetic of it.'],
      avenge_strength: ['The arm that could not save has learned to strike.'],
      avenge_allies: ['Grief shared is grief armed.'],
    },
    completionProse: [
      'The wrong was answered. Whether it healed anything is another matter.',
    ],
    abandonmentProse: [
      'The vengeance went unspent. Some nights that is its own kind of mercy.',
    ],
  },

  // 2. Protect the Home (survival) — the one who saw violence reach their door
  {
    id: 'ambition_protect_the_home',
    displayName: 'Protect the Home',
    category: 'survival',
    reachFloors: { heart: 0.1 },
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: ['spirit', 'force'],
    bondModifiers: [{ bondType: 'kin', modifier: 0.4 }],
    boostingTraits: ['trait.core.core_warmth.virtue', 'trait.personality.heart.virtue', 'trait.mastery.steadfast'],
    reachAffinity: { heart: 0.6, iron: 0.6, stone: 0.4 },
    milestones: [
      {
        id: 'protect_kin',
        condition: { type: 'agent_has_bonds', minCount: 3, basis: 'loyalty' },
        prose: ['Enough hands willing to stand the wall beside them.'],
      },
      {
        id: 'protect_ward',
        condition: { type: 'agent_controls_location', locationType: 'fortress' },
        prose: ['Somewhere with walls now. Somewhere that can be held.'],
      },
      {
        id: 'protect_iron',
        condition: { type: 'agent_reach_above', reach: 'iron', threshold: 0.5 },
        prose: ['They will not be caught unarmed a second time.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'homeless_wanderer' },
        prose: ['There was nothing left to guard. The vigil ended.'],
      },
    ],
    abandonmentCooldown: 40,
    selectionProse: [
      'Never again — they swore it to the smoke still hanging over the roofs.',
      'What the raiders left standing, they would make unbreakable.',
    ],
    milestoneProse: {
      protect_kin: ['A watch assembles. The frightened learn to be fierce.'],
      protect_ward: ['Walls. A gate. A place that answers back.'],
      protect_iron: ['The hand that trembled has steadied on the haft.'],
    },
    completionProse: [
      'The home stands warded. Let the next storm come and break on it.',
    ],
    abandonmentProse: [
      'The watch could not hold forever. What was lost stayed lost.',
    ],
  },

  // 3. Flee the Ravaged Land (survival) — get out before the ground claims them
  {
    id: 'ambition_flee_the_ravaged_land',
    displayName: 'Flee the Ravaged Land',
    category: 'survival',
    reachFloors: { star: 0.1 },
    requiredTraits: [],
    blockingTraits: ['rooted'],
    sphereAffinities: ['entropy', 'time'],
    bondModifiers: [{ bondType: 'fellow_refugee', modifier: 0.3 }],
    boostingTraits: ['trait.mastery.steadfast', 'trait.condition.exhausted', 'trait.condition.terrified'],
    reachAffinity: { star: 0.6, stone: 0.5, shadow: 0.4 },
    milestones: [
      {
        id: 'flee_endurance',
        condition: { type: 'agent_reach_above', reach: 'star', threshold: 0.45 },
        prose: ['The body has learned to keep going past where it wanted to stop.'],
      },
      {
        id: 'flee_company',
        condition: { type: 'agent_has_bonds', minCount: 1, basis: 'fellow_refugee' },
        prose: ['Not alone on the road, at least. That is something.'],
      },
    ],
    completion: { requires: 2, of: 2 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'made_peace_with_the_land' },
        prose: ['The road unspooled and then, quietly, ended. They stayed.'],
      },
    ],
    abandonmentCooldown: 30,
    selectionProse: [
      'Staying meant the same slow ending as everyone else. They chose the road.',
      'The land had turned against its people. There was nothing to do but leave it.',
    ],
    milestoneProse: {
      flee_endurance: ['Still walking. Somehow, still walking.'],
      flee_company: ['Strangers become kin when they share the same flight.'],
    },
    completionProse: [
      'Clean wind, unfamiliar country. Behind them, the poison keeps its own.',
    ],
    abandonmentProse: [
      'The land kept what it was owed. The flight ended where it began.',
    ],
  },

  // 4. Rebuild from Ashes (legacy) — stay, and raise it up again
  {
    id: 'ambition_rebuild_from_ashes',
    displayName: 'Rebuild from Ashes',
    category: 'legacy',
    reachFloors: { stone: 0.1 },
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: ['matter', 'life'],
    bondModifiers: [{ bondType: 'labor', modifier: 0.3 }],
    boostingTraits: ['trait.reputation.stone.positive', 'trait.mastery.steadfast', 'trait.personality.star.virtue'],
    reachAffinity: { stone: 0.6, gold: 0.5, iron: 0.4 },
    milestones: [
      {
        id: 'rebuild_hands',
        condition: { type: 'agent_has_bonds', minCount: 3, basis: 'labor' },
        prose: ['Hands enough now. Grief turned to the work of clearing rubble.'],
      },
      {
        id: 'rebuild_ground',
        condition: { type: 'agent_controls_location', locationType: 'construction_site' },
        prose: ['The ground is staked again. Foundations where ash had settled.'],
      },
      {
        id: 'rebuild_craft',
        condition: { type: 'agent_reach_above', reach: 'stone', threshold: 0.5 },
        prose: ['They read the ruined stone and know how it wants to stand.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'stone', threshold: 0.05 },
        prose: ['The strength for it drained away. The ashes stayed ashes.'],
      },
    ],
    abandonmentCooldown: 45,
    selectionProse: [
      'Others fled. They stayed, and started stacking the fallen stones.',
      'What was broken could be built again — smaller, maybe, but theirs.',
    ],
    milestoneProse: {
      rebuild_hands: ['A workforce of the bereaved. Purpose in calloused grief.'],
      rebuild_ground: ['Stakes and string over the burned footprint. A beginning.'],
      rebuild_craft: ['The old skill returns to the hands, surer for the loss.'],
    },
    completionProse: [
      'It stands again where it fell. Not the same. Standing all the same.',
    ],
    abandonmentProse: [
      'The rebuilding faltered. The ruin kept the shape of what it lost.',
    ],
  },

  // 5. Found Something New (legacy) — carry the spark somewhere untouched
  {
    id: 'ambition_found_anew',
    displayName: 'Found Something New',
    category: 'legacy',
    reachFloors: { heart: 0.1 },
    requiredTraits: [],
    blockingTraits: [],
    sphereAffinities: ['life', 'time'],
    bondModifiers: [{ bondType: 'alliance', modifier: 0.3 }],
    boostingTraits: ['trait.personality.star.virtue', 'trait.mastery.silver-tongue', 'pioneer'],
    reachAffinity: { heart: 0.6, gold: 0.5, star: 0.4 },
    milestones: [
      {
        id: 'found_followers',
        condition: { type: 'agent_has_bonds', minCount: 3, basis: 'alliance' },
        prose: ['Others bind their hope to the same unmarked horizon.'],
      },
      {
        id: 'found_seat',
        condition: { type: 'agent_controls_location', locationType: 'estate' },
        prose: ['A first hearth in new country. A place to gather around.'],
      },
    ],
    completion: { requires: 2, of: 2 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_has_trait', trait: 'trait.core.core_hope.vice' },
        prose: ['The vision thinned to nothing. The new country stayed empty.'],
      },
    ],
    abandonmentCooldown: 45,
    selectionProse: [
      'What they had witnessed could not be unmade. So they set out to make it anew.',
      'The old place was finished. They would plant a name where none had grown.',
    ],
    milestoneProse: {
      found_followers: ['A handful of believers. Every founding starts so.'],
      found_seat: ['One roof, then. From one roof, everything begins.'],
    },
    completionProse: [
      'A new thing stands where nothing did. Its founder can rest, a little.',
    ],
    abandonmentProse: [
      'The founding never took root. The horizon stayed a horizon.',
    ],
  },

  // 6. Chase the Wonder (discovery) — the numinous seen, and never let go
  {
    id: 'ambition_chase_the_wonder',
    displayName: 'Chase the Wonder',
    category: 'discovery',
    reachFloors: { eye: 0.1 },
    requiredTraits: [],
    blockingTraits: ['incurious'],
    sphereAffinities: ['mind', 'spirit'],
    bondModifiers: [{ bondType: 'fellow_seeker', modifier: 0.3 }],
    boostingTraits: ['#eye', 'obsessive', '#veil'],
    reachAffinity: { eye: 0.7, veil: 0.6, star: 0.4 },
    milestones: [
      {
        id: 'wonder_sight',
        condition: { type: 'agent_reach_above', reach: 'eye', threshold: 0.5 },
        prose: ['They have learned to look until the world gives up its seams.'],
      },
      {
        id: 'wonder_veil',
        condition: { type: 'agent_reach_above', reach: 'veil', threshold: 0.45 },
        prose: ['The thing they saw has taught their hands its grammar.'],
      },
      {
        id: 'wonder_keeper',
        condition: { type: 'agent_has_trait', trait: 'trait.reputation.shadow.positive' },
        prose: ['What was glimpsed once, they now carry, heavy and quiet.'],
      },
    ],
    completion: { requires: 2, of: 3 },
    abandonmentTriggers: [
      {
        condition: { type: 'agent_reach_below', reach: 'eye', threshold: 0.05 },
        prose: ['The vision dimmed to an old story they no longer believed.'],
      },
    ],
    abandonmentCooldown: 45,
    selectionProse: [
      'They had seen something the world was not supposed to show. They wanted it again.',
      'The wonder passed in an instant and left a hunger that would not.',
    ],
    milestoneProse: {
      wonder_sight: ['Seeing clearly now — perhaps too clearly for comfort.'],
      wonder_veil: ['The mystery answers, syllable by careful syllable.'],
      wonder_keeper: ['The wonder lives in them now, a second and stranger pulse.'],
    },
    completionProse: [
      'They caught the edge of it at last. Whether it was worth the chase, only they can say.',
    ],
    abandonmentProse: [
      'The wonder receded past reach. The world went ordinary again.',
    ],
  },
] as const;

/** Count of event-minted templates authored in v1 (THR-726). */
export const MINT_TEMPLATE_COUNT = EVENT_MINTED_AMBITION_TEMPLATES.length;

/**
 * Resolve an ambition template id across all three pools — standard, reactive, and
 * event-minted. Consumers that only searched `AMBITION_TEMPLATES` miss minted
 * ambitions (milestone eval, agent-detail display); use this instead. (THR-726)
 */
export function findAmbitionTemplateById(
  templateId: string,
): AmbitionTemplate | undefined {
  return (
    AMBITION_TEMPLATES.find((t) => t.id === templateId) ??
    EVENT_MINTED_AMBITION_TEMPLATES.find((t) => t.id === templateId) ??
    REACTIVE_AMBITION_TEMPLATES.find((t) => t.id === templateId)
  );
}
