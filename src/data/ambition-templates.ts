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
    blockingTraits: ['hermit'],
    sphereAffinities: ['matter', 'mind'],
    bondModifiers: [{ bondType: 'trade_partner', modifier: 0.3 }],
    boostingTraits: ['merchant', 'networker'],
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
    boostingTraits: ['commander', 'ruthless'],
    reachAffinity: { iron: 0.8, heart: 0.6, eye: 0.3 },
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
    boostingTraits: ['perfectionist', 'rune_touched'],
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
    boostingTraits: ['scholar', 'veil_touched'],
    reachAffinity: { veil: 0.9, eye: 0.5, star: 0.3 },
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
        condition: { type: 'agent_has_trait', trait: 'enlightened' },
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
    boostingTraits: ['noble_blood', 'charismatic'],
    reachAffinity: { gold: 0.6, heart: 0.7, star: 0.4 },
    strategicProfile: {
      behaviorFamily: 'court-political',
      preferredVerbs: ['create', 'control', 'change', 'gather_info'],
      templateIds: [
        'strategic_survey_market',
        'strategic_negotiate_storage',
        'strategic_build_warehouse',
        'strategic_found_guild_chapter',
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
        condition: { type: 'agent_lacks_trait', trait: 'living' },
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
    boostingTraits: ['survivor', 'desperate'],
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
    boostingTraits: ['scholar', 'ruin_delver'],
    reachAffinity: { eye: 0.8, veil: 0.5, stone: 0.4 },
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
        condition: { type: 'agent_has_trait', trait: 'keeper_of_secrets' },
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
    boostingTraits: ['zealot', 'orator'],
    reachAffinity: { star: 0.8, heart: 0.6, eye: 0.2 },
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
        condition: { type: 'agent_has_trait', trait: 'faith_broken' },
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
    boostingTraits: ['architect', 'visionary'],
    reachAffinity: { gold: 0.5, iron: 0.4, stone: 0.7 },
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
    boostingTraits: ['healer', 'empathic'],
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
        condition: { type: 'agent_has_trait', trait: 'miracle_worker' },
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
    blockingTraits: ['forgiving'],
    sphereAffinities: ['force', 'entropy'],
    bondModifiers: [{ bondType: 'enemy', modifier: 0.5 }],
    boostingTraits: ['grudge_bearer', 'ruthless'],
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
        condition: { type: 'agent_has_trait', trait: 'forgiven' },
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
    boostingTraits: ['exile', 'determined'],
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
    boostingTraits: ['grief_stricken', 'loyal'],
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
        condition: { type: 'agent_has_trait', trait: 'grief_resolved' },
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
    boostingTraits: ['destiny_marked', 'resolute'],
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
