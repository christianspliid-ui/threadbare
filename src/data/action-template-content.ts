/**
 * Action Template Content Package — 36 action templates (4 per reach × 9 reaches).
 *
 * ═══════════════════════════════════════════════════════════════════
 * CONTENT MANAGER: This is the file you edit to change action templates,
 * motivations, graph outcomes, difficulties, and narrative text.
 * ═══════════════════════════════════════════════════════════════════
 */

import type { ReachDomain } from '../types/traits';
import type { ValuePair } from '../types/agent';
import type { GraphOp } from '../types/graphOp';
import type { RarityTier } from '../types/rarity';

export type ActorType = 'individual' | 'faction' | 'settlement';

export interface ActionTemplateData {
  id: string;
  name: string;
  crudType: 'create' | 'read' | 'update' | 'delete';
  reach: ReachDomain;

  // Duration model
  durationRange: { min: number; max: number };

  // Motivation mapping
  motivations: ValuePair[];

  // Graph outcomes
  onSuccess: GraphOp[];
  onFailure: GraphOp[];
  onCritical?: GraphOp[];

  // Resolution parameters
  difficulty: number;

  // Narrative
  narrativeTemplates: {
    initiation: string;
    success: string;
    failure: string;
    critical?: string;
  };

  // Filtering
  locationSubtypes?: string[];
  actorAffinities?: ActorType[];
  sphereAffinity?: string;

  // Economic gate: actor must have wealth >= this value to select the action.
  // Wealth is on 0–100 scale. Fail-soft: agents with insufficient wealth skip this action.
  minWealthRequired?: number;

  // Phase 17 display fields
  /** Evocative spell-like display name (Ars Magica style, max 3 words). */
  spellName?: string;
  /** Qualitative game-mechanical description — 2-3 sentences, no numbers. */
  description?: string;

  // TB-100: Rarity tier (1–4). Drives visual treatment in ActionDrawer.
  /** Narrative significance tier. 1=Mundane, 2=Storied, 3=Mythic, 4=Legendary. */
  rarityTier?: RarityTier;
}

// ─── 36 Action Templates (4 per reach × 9 reaches) ───────────────

export const ACTION_TEMPLATES: ActionTemplateData[] = [
  // Iron (warfare) — create, read, update, delete
  {
    id: 'action.iron.raise-force',
    name: 'Raise Force',
    spellName: 'Call to Arms',
    description: 'Summons the martial will of a willing host, drawing fighters to the banner. Troop cohesion tightens and defensive posture strengthens across the force. Effects are amplified near fortifications and loyal settlements.',
    rarityTier: 1,
    crudType: 'create',
    reach: 'iron',
    durationRange: { min: 2, max: 4 },
    motivations: ['courage_prudence', 'loyalty_ambition'],
    onSuccess: [
      {
        op: 'add_node',
        nodeType: 'agent',
        nodeName: 'Recruited Soldier',
        properties: { tier: 'militia', affiliation: '$actor' },
      },
      { op: 'add_edge', edgeType: 'commands', source: '$actor', target: '$location' },
    ],
    onFailure: [
      {
        op: 'update_node',
        nodeId: '$actor',
        changes: { reputation: -0.05 },
      },
    ],
    difficulty: 0.45,
    narrativeTemplates: {
      initiation: '{{actor}} gathers {{their}} forces, calling to those who would answer the banner.',
      success: 'The call is heeded. {{actor}}\'s forces swell with fresh recruitment, ready for battle.',
      failure: 'The call falls silent. {{actor}} struggles to find any who would march.',
    },
  },
  {
    id: 'action.iron.assess-threat',
    name: 'Assess Threat',
    spellName: 'Iron Scrutiny',
    description: 'Studies an enemy formation or opposing force with a martial eye, cataloguing strengths and vulnerabilities. Tactical understanding deepens, revealing the true measure of a threat. A clear assessment allows better counter-strategies to be chosen.',
    rarityTier: 1,
    crudType: 'read',
    reach: 'iron',
    durationRange: { min: 1, max: 2 },
    motivations: ['courage_prudence', 'honesty_cunning'],
    onSuccess: [
      {
        op: 'update_node',
        nodeId: '$target',
        changes: { scouted: true, threatLevel: 'calculated' },
      },
    ],
    onFailure: [
      {
        op: 'update_node',
        nodeId: '$actor',
        changes: { insight: -0.02 },
      },
    ],
    difficulty: 0.35,
    narrativeTemplates: {
      initiation: '{{actor}} scrutinizes {{the-target}}, weighing every detail of threat and strength.',
      success: 'The assessment is clear. {{actor}} sees the exact measure of {{the-target}}\'s force.',
      failure: '{{actor}}\'s estimate proves dangerously wrong, missing vital signs of danger.',
    },
  },
  {
    id: 'action.iron.fortify',
    name: 'Fortify',
    spellName: 'Bastion Rite',
    description: 'Reinforces a location with disciplined military labor, raising walls and sharpening every defensive measure. The site becomes hardened against assault and more difficult for enemies to breach. Sustained effort compounds the fortification over time.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'iron',
    durationRange: { min: 2, max: 3 },
    motivations: ['preservation_transformation', 'courage_prudence'],
    onSuccess: [
      {
        op: 'update_node',
        nodeId: '$location',
        changes: { defense: 1, fortified: true },
      },
    ],
    onFailure: [
      {
        op: 'update_node',
        nodeId: '$location',
        changes: { defense: -0.5 },
      },
    ],
    difficulty: 0.50,
    narrativeTemplates: {
      initiation: '{{actor}} reinforces {{the-location}}, raising walls and sharpening defenses.',
      success: 'The fortifications rise strong. {{the-location}} becomes a bastion under {{actor}}\'s command.',
      failure: 'The work crumbles. {{actor}}\'s fortifications weaken {{the-location}} instead.',
    },
  },
  {
    id: 'action.iron.conquer',
    name: 'Conquer',
    spellName: 'Shatter the Line',
    description: 'Launches a decisive military campaign to break an opposing force and seize their holdings. Victory overwrites the existing order and brings the target location under the conqueror\'s control. Failure carries steep costs in morale and standing.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'iron',
    durationRange: { min: 3, max: 5 },
    motivations: ['preservation_transformation', 'mercy_ruthlessness'],
    onSuccess: [
      { op: 'remove_node', nodeId: '$target' },
      { op: 'add_edge', edgeType: 'controls', source: '$actor', target: '$location' },
    ],
    onFailure: [
      {
        op: 'update_node',
        nodeId: '$actor',
        changes: { morale: -0.10 },
      },
    ],
    difficulty: 0.65,
    narrativeTemplates: {
      initiation: '{{actor}} marches to war, seeking to seize {{the-target}} by force of arms.',
      success: '{{target}} falls. {{actor}} stands victorious, {{the-location}} now {{their}} prize.',
      failure: '{{actor}}\'s forces are broken. {{target}} holds strong, and {{actor}} retreats in disgrace.',
    },
  },

  // Gold (trade) — create, read, update, delete
  {
    id: 'action.gold.establish-trade',
    name: 'Establish Trade',
    spellName: 'Golden Accord',
    description: 'Opens a formal trade relationship between two parties, creating a channel for ongoing commerce. Wealth flows along the new route and both parties gain access to each other\'s markets. The connection grows more valuable the longer it is maintained.',
    rarityTier: 1,
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 2, max: 4 },
    motivations: ['asceticism_extravagance', 'honesty_cunning', 'loyalty_ambition'],
    onSuccess: [
      { op: 'add_edge', edgeType: 'trades_with', source: '$actor', target: '$target' },
      { op: 'update_node', nodeId: '$actor', changes: { wealth: 0.15 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.05 } },
    ],
    difficulty: 0.40,
    narrativeTemplates: {
      initiation: '{{actor}} opens negotiations, seeking profitable trade with {{the-target}}.',
      success: 'The deal is struck. Wealth flows between {{actor}} and {{the-target}} like rivers of gold.',
      failure: '{{actor}}\'s proposal is rejected. {{the-target}} has no interest in {{actor}}\'s commerce.',
    },
  },
  {
    id: 'action.gold.survey-resources',
    name: 'Survey Resources',
    spellName: 'Ledger Sight',
    description: 'Conducts a careful audit of a location\'s economic assets, mapping the full extent of its wealth. Hidden resources and untapped commodities are brought into clear view. This knowledge enables better trade and exploitation strategies.',
    rarityTier: 1,
    crudType: 'read',
    reach: 'gold',
    durationRange: { min: 1, max: 2 },
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    onSuccess: [
      { op: 'update_node', nodeId: '$location', changes: { resourcesKnown: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { insight: -0.03 } },
    ],
    difficulty: 0.30,
    narrativeTemplates: {
      initiation: '{{actor}} inventories {{the-location}}, counting every coin and commodity.',
      success: '{{actor}}\'s audit is precise. {{the-location}}\'s wealth is now transparent.',
      failure: '{{actor}}\'s count is muddled. The true state of {{the-location}}\'s resources remains hidden.',
    },
  },
  {
    id: 'action.gold.trade',
    name: 'Trade',
    spellName: 'Gilded Exchange',
    description: 'Executes a direct exchange of goods or services along an existing trade route, deepening the commercial bond. Both parties profit when the deal is struck honestly, and the route grows more robust over time. Failure exposes the trader to exploitation.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'gold',
    durationRange: { min: 2, max: 3 },
    motivations: ['asceticism_extravagance', 'honesty_cunning'],
    onSuccess: [
      { op: 'update_edge', edgeType: 'trades_with', source: '$actor', target: '$target', changes: { volume: 1 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.03 } },
    ],
    difficulty: 0.45,
    narrativeTemplates: {
      initiation: '{{actor}} executes a trade, swapping goods with {{the-target}} for mutual gain.',
      success: 'The exchange prospers. {{actor}} gains wealth and favor with {{the-target}}.',
      failure: '{{actor}}\'s trade goes awry. {{the-target}} cheats {{actor}}, and wealth is lost.',
    },
  },
  {
    id: 'action.gold.disrupt-trade',
    name: 'Disrupt Trade',
    spellName: 'Gilded Ruin',
    description: 'Sabotages a rival\'s commercial operations through targeted interference, corrupt agents, or blocked routes. Success strips their wealth and severs trade connections they depend on. Exposure carries reputational damage that lingers long after the act.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'gold',
    durationRange: { min: 3, max: 5 },
    motivations: ['asceticism_extravagance', 'loyalty_ambition'],
    onSuccess: [
      { op: 'remove_edge', edgeType: 'trades_with', source: '$actor', target: '$target' },
      { op: 'update_node', nodeId: '$target', changes: { wealth: -0.20 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.10 } },
    ],
    difficulty: 0.60,
    narrativeTemplates: {
      initiation: '{{actor}} sabotages {{the-target}}\'s trade routes, seeking to cripple {{their}} commerce.',
      success: '{{target}}\'s trade is in ruins. {{actor}}\'s sabotage is complete, and {{their}} wealth evaporates.',
      failure: '{{actor}}\'s plot is exposed. {{the-target}} retaliates, and {{actor}}\'s own wealth suffers.',
    },
  },

  // Gold (trade) — Phase 3 extensions: Negotiate Agreement, Tax Trade Route, Break Agreement,
  //                Hire Mercenaries, Commission Assassination, Buy Influence, Fund Construction
  {
    id: 'action.gold.negotiate-agreement',
    name: 'Negotiate Agreement',
    spellName: 'Sealed Compact',
    description: 'Formalizes an arrangement between two parties through careful diplomacy and contractual ink. The resulting agreement grants both sides structured obligations and protections. A well-struck deal becomes a lasting foundation for cooperation.',
    rarityTier: 1,
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 2, max: 4 },
    motivations: ['asceticism_extravagance', 'honesty_cunning', 'loyalty_ambition'],
    onSuccess: [
      {
        op: 'add_node',
        nodeType: 'attachment',
        nodeName: 'Trade Agreement',
        properties: {
          category: 'agreement',
          subcategory: 'treaty',
          terms: 'Mutual trade terms formalized between parties',
          parties: ['$actor', '$target'],
          source: 'action.gold.negotiate-agreement',
          tier: 1,
        },
      },
      { op: 'update_node', nodeId: '$actor', changes: { wealth: 0.02 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.05 } },
    ],
    difficulty: 0.50,
    narrativeTemplates: {
      initiation: '{{actor}} opens formal negotiations with {{the-target}}, seeking to bind trade terms in ink and coin.',
      success: 'The agreement is sealed. {{actor}} and {{the-target}} shake hands over terms that suit them both.',
      failure: '{{actor}}\'s negotiations founder. {{the-target}} rejects the terms, and the deal collapses.',
    },
  },
  {
    id: 'action.gold.tax-trade-route',
    name: 'Tax Trade Route',
    spellName: 'Tollkeeper\'s Grip',
    description: 'Asserts economic dominance over an existing trade corridor by stationing collectors and levying fees. Steady wealth flows to the controlling party as long as the route remains active. Merchants resent the imposition, souring goodwill over time.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'gold',
    durationRange: { min: 2, max: 3 },
    motivations: ['asceticism_extravagance', 'preservation_transformation'],
    onSuccess: [
      {
        op: 'update_edge',
        edgeType: 'trades_with',
        source: '$actor',
        target: '$target',
        changes: { controlledBy: '$actor', taxRate: 0.1 },
      },
      { op: 'update_node', nodeId: '$actor', changes: { wealth: 0.05 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.08 } },
    ],
    difficulty: 0.55,
    narrativeTemplates: {
      initiation: '{{actor}} moves to assert control over the route to {{the-target}}, stationing collectors at every junction.',
      success: 'The route bends to {{actor}}\'s will. Coin flows in, though merchants grumble at the toll.',
      failure: '{{actor}}\'s tax collectors are driven off. {{the-target}} will not yield the route so easily.',
    },
  },
  {
    id: 'action.gold.break-agreement',
    name: 'Break Agreement',
    spellName: 'Broken Seal',
    description: 'Unilaterally dissolves a standing contract or treaty, prioritizing short-term gain over trust. The act carries immediate reputational damage but frees the actor from burdensome obligations. Partners who witness the betrayal become wary of future dealings.',
    rarityTier: 1,
    crudType: 'delete',
    reach: 'gold',
    durationRange: { min: 1, max: 2 },
    motivations: ['loyalty_ambition', 'asceticism_extravagance', 'honesty_cunning'],
    onSuccess: [
      { op: 'remove_edge', edgeType: 'party_to', source: '$actor', target: '$target' },
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.15 } },
      { op: 'update_node', nodeId: '$target', changes: { wealth: -0.10 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.08 } },
    ],
    difficulty: 0.30,
    narrativeTemplates: {
      initiation: '{{actor}} moves to renege on terms with {{the-target}}, calculating that betrayal costs less than compliance.',
      success: '{{actor}} walks away from the agreement. {{the-target}} is left holding nothing but broken promises.',
      failure: '{{actor}}\'s attempted breach is blocked. The terms hold, though {{actor}}\'s intent is now known.',
    },
  },
  {
    id: 'action.gold.hire-mercenaries',
    name: 'Hire Mercenaries',
    spellName: 'Coin of Swords',
    description: 'Purchases the temporary loyalty of a professional fighting company, bringing their martial expertise under the actor\'s banner. The hired force bolsters military capability for a limited time before their contract expires. Merc bands are effective but unreliable once the gold runs dry.',
    rarityTier: 1,
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 2, max: 3 },
    motivations: ['asceticism_extravagance', 'courage_prudence', 'loyalty_ambition'],
    minWealthRequired: 10, // WEALTH_MERCENARY_COST
    onSuccess: [
      {
        op: 'add_node',
        nodeType: 'attachment',
        nodeName: 'Mercenary Band',
        properties: {
          category: 'retainer',
          ironCapability: 30,
          source: 'action.gold.hire-mercenaries',
          hiredBy: '$actor',
          durationTicks: 10,
          tier: 1,
        },
      },
      // WEALTH_MERCENARY_COST = 10 (represented as 0.10 on 0–100 scale)
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.10 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.03 } },
    ],
    difficulty: 0.45,
    narrativeTemplates: {
      initiation: '{{actor}} seeks sellswords, coin in hand, looking for blades that ask no questions.',
      success: 'A company of mercenaries answers {{actor}}\'s call. Their loyalty lasts as long as the gold does.',
      failure: '{{actor}}\'s coin draws only unreliable sorts. The mercenaries melt away before the first order.',
    },
  },
  {
    id: 'action.gold.commission-assassination',
    name: 'Commission Assassination',
    spellName: 'Shadow Contract',
    description: 'Pays a capable operative to permanently remove a target from the board while keeping the commissioner\'s hands clean. Success eliminates the threat entirely and leaves no visible trail. Discovery invites catastrophic retaliation and lasting infamy.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'gold',
    durationRange: { min: 3, max: 5 },
    motivations: ['asceticism_extravagance', 'honesty_cunning', 'loyalty_ambition'],
    minWealthRequired: 15, // WEALTH_ASSASSINATION_COST
    onSuccess: [
      { op: 'remove_node', nodeId: '$target' },
      // WEALTH_ASSASSINATION_COST = 15 (represented as 0.15)
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.15 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.25, wealth: -0.08 } },
    ],
    difficulty: 0.65,
    narrativeTemplates: {
      initiation: '{{actor}} pays handsomely for a shadow to fall on {{the-target}}, keeping {{their}} own hands clean.',
      success: '{{the-target}} does not survive the night. {{actor}} receives only a nod from the shadows.',
      failure: '{{actor}}\'s plot unravels. The assassin is caught, and {{actor}}\'s name is on the confession.',
    },
  },
  {
    id: 'action.gold.buy-influence',
    name: 'Buy Influence',
    spellName: 'Whisper of Coin',
    description: 'Spreads carefully placed payments to win favor, opening doors that would otherwise remain shut. The target\'s disposition warms toward the actor, smoothing future negotiations and cooperation. The effect is genuine but transactional — it fades without reinforcement.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'gold',
    durationRange: { min: 1, max: 3 },
    motivations: ['asceticism_extravagance', 'honesty_cunning', 'preservation_transformation'],
    minWealthRequired: 8, // WEALTH_INFLUENCE_COST
    onSuccess: [
      {
        op: 'update_edge',
        edgeType: 'relates_to',
        source: '$actor',
        target: '$target',
        changes: { sentiment: 0.20 },
      },
      // WEALTH_INFLUENCE_COST = 8 (represented as 0.08)
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.08 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.08, wealth: -0.04 } },
    ],
    difficulty: 0.50,
    narrativeTemplates: {
      initiation: '{{actor}} spreads coin quietly, buying smiles and open doors where walls stood before.',
      success: '{{the-target}} warms to {{actor}}\'s cause. Money, as ever, makes friends faster than words.',
      failure: '{{the-target}} pockets {{actor}}\'s gift and gives nothing in return. {{actor}} has been played.',
    },
  },
  {
    id: 'action.gold.fund-construction',
    name: 'Fund Construction',
    spellName: 'Stone of Wealth',
    description: 'Pours capital into building a new structure that reshapes the economic landscape of a location. The completed building generates opportunity and draws commerce, amplifying the actor\'s grip on local prosperity. Abandoned projects leave only half-built ruins and wasted coin.',
    rarityTier: 2,
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 3, max: 5 },
    motivations: ['loyalty_ambition', 'asceticism_extravagance', 'tradition_novelty'],
    minWealthRequired: 12, // WEALTH_CONSTRUCTION_COST
    onSuccess: [
      {
        op: 'add_node',
        nodeType: 'location',
        nodeName: 'New Construction',
        properties: {
          sublocationTypeId: 'sublocation-type.market-district',
          parentLocationId: '$location',
          persistence: { type: 'permanent' },
          source: 'action.gold.fund-construction',
          fundedBy: '$actor',
        },
      },
      // WEALTH_CONSTRUCTION_COST = 12 (represented as 0.12)
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.12 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.06 } },
    ],
    difficulty: 0.55,
    narrativeTemplates: {
      initiation: '{{actor}} pours gold into foundations, commissioning a new structure to cement {{their}} grip on {{the-location}}.',
      success: 'The structure rises. {{actor}}\'s investment reshapes {{the-location}}, drawing commerce and curiosity alike.',
      failure: 'The construction founders. Contractors pocket the coin and vanish; only half-built walls remain.',
    },
  },

  {
    id: 'action.gold.establish-monopoly',
    name: 'Establish Monopoly',
    spellName: 'Market Stranglehold',
    description: 'Systematically buys out rivals and consolidates control over a key commodity or trade corridor. Once dominant, the actor sets prices and terms without competition, extracting maximum value from the market. The act breeds deep resentment among those shut out.',
    rarityTier: 2,
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 4, max: 6 },
    motivations: ['asceticism_extravagance', 'preservation_transformation', 'loyalty_ambition'],
    minWealthRequired: 25, // WEALTH_MONOPOLY_COST
    onSuccess: [
      // Mark the target location as monopoly-controlled by this actor
      { op: 'update_node', nodeId: '$location', changes: { monopolyControlledBy: '$actor', prosperityDelta: -10 } },
      // Negative sentiment ripple — other factions feel the squeeze
      { op: 'update_edge', edgeType: 'relates_to', source: '$target', target: '$actor', changes: { sentiment: -0.25 } },
      // WEALTH_MONOPOLY_COST = 25 (represented as 0.25)
      { op: 'update_node', nodeId: '$actor', changes: { wealth: -0.25 } },
    ],
    onFailure: [
      // Failed attempt damages reputation and still costs some wealth
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.20, wealth: -0.10 } },
    ],
    difficulty: 0.65,
    narrativeTemplates: {
      initiation: '{{actor}} begins quietly buying out rivals, consolidating grip on the supply. The market grows uneasy.',
      success: '{{actor}} tightens its hold on the trade. Prices rise. Other merchants speak in whispers of what has been taken from them.',
      failure: '{{actor}}\'s attempt to corner the market fails — rivals coordinate, the guild council intervenes, and word of the scheme spreads.',
    },
  },

  // Shadow (stealth) — create, read, update, delete
  {
    id: 'action.shadow.establish-network',
    name: 'Establish Network',
    spellName: 'Veil of Night',
    description: 'Builds a covert intelligence network by recruiting trusted operatives and placing them throughout a region. Information flows back through hidden channels, giving the actor an unseen advantage over rivals. Discovery before the network takes root scatters it entirely.',
    rarityTier: 1,
    crudType: 'create',
    reach: 'shadow',
    durationRange: { min: 2, max: 4 },
    motivations: ['honesty_cunning', 'courage_prudence', 'loyalty_ambition'],
    onSuccess: [
      {
        op: 'add_node',
        nodeType: 'agent',
        nodeName: 'Network Agent',
        properties: { hidden: true, allegiance: '$actor' },
      },
      { op: 'add_edge', edgeType: 'controls', source: '$actor', target: '$location' },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { security: -0.05 } },
    ],
    difficulty: 0.50,
    narrativeTemplates: {
      initiation: '{{actor}} builds a hidden network, recruiting agents in the shadows.',
      success: '{{actor}}\'s spies are in place. Information flows through {{their}} network like blood.',
      failure: '{{actor}}\'s network is discovered before it takes root. Agents scatter.',
    },
  },
  {
    id: 'action.shadow.spy',
    name: 'Spy',
    spellName: 'Silent Witness',
    description: 'Dispatches covert agents to observe a target and extract hidden information without detection. Secrets about intentions, capabilities, and vulnerabilities are brought back to the actor. If the agents are caught, the target is alerted and the actor is exposed.',
    rarityTier: 1,
    crudType: 'read',
    reach: 'shadow',
    durationRange: { min: 1, max: 2 },
    motivations: ['honesty_cunning', 'courage_prudence'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { secret: 'revealed' } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { security: -0.04 } },
    ],
    difficulty: 0.40,
    narrativeTemplates: {
      initiation: '{{actor}} dispatches spies to {{the-target}}, seeking hidden truths.',
      success: '{{actor}}\'s agents return with secrets. {{the-target}}\'s hidden nature is laid bare.',
      failure: '{{actor}}\'s spies are caught. {{the-target}} discovers the betrayal.',
    },
  },
  {
    id: 'action.shadow.recruit-agent',
    name: 'Recruit Agent',
    spellName: 'Umbral Pact',
    description: 'Turns an individual to secret service through a careful approach of leverage, promise, or shared interest. The recruited agent acts as a hidden operative within their existing position, providing access and information. Rejection reveals the attempt and may trigger retaliation.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'shadow',
    durationRange: { min: 2, max: 3 },
    motivations: ['loyalty_ambition', 'honesty_cunning'],
    onSuccess: [
      { op: 'add_edge', edgeType: 'serves', source: '$target', target: '$actor', properties: { secret: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.06 } },
    ],
    difficulty: 0.55,
    narrativeTemplates: {
      initiation: '{{actor}} approaches {{the-target}}, seeking to turn {{them}} to {{actor}}\'s service.',
      success: '{{target}} is turned. {{actor}} has secured a secret agent in {{their}} enemy\'s camp.',
      failure: '{{target}} rejects {{actor}}\'s overture. {{actor}}\'s attempt at recruitment is spurned.',
    },
  },
  {
    id: 'action.shadow.assassinate',
    name: 'Assassinate',
    spellName: 'Silent Step',
    description: 'Sends a skilled killer directly after a target, relying on stealth and precision rather than coin. The actor\'s own hand is closer to the act than a commission, carrying greater personal risk but also greater certainty of intent. Failure invites devastating exposure.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'shadow',
    durationRange: { min: 3, max: 5 },
    motivations: ['loyalty_ambition', 'mercy_ruthlessness'],
    onSuccess: [
      { op: 'remove_node', nodeId: '$target' },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { security: -0.15 } },
    ],
    difficulty: 0.70,
    narrativeTemplates: {
      initiation: '{{actor}} plots {{the-target}}\'s death, arranging for an assassin in the night.',
      success: '{{target}} falls in darkness. {{actor}}\'s enemy is no more.',
      failure: '{{actor}}\'s assassin is caught. {{the-target}} survives, and {{actor}}\'s hand is revealed.',
    },
  },

  // Veil (magic) — create, read, update, delete
  {
    id: 'action.veil.cast-spell',
    name: 'Cast Spell',
    spellName: 'Arcane Weaving',
    description: 'Shapes raw magical energy into a directed working that binds a lasting enchantment to the target. The spell anchors the caster\'s will into the fabric of the target, producing persistent effects that endure beyond the moment of casting. Failure bleeds mana and leaves the caster drained.',
    rarityTier: 2,
    crudType: 'create',
    reach: 'veil',
    durationRange: { min: 2, max: 4 },
    motivations: ['tradition_novelty', 'sacrifice_survival'],
    onSuccess: [
      {
        op: 'add_edge',
        edgeType: 'enchanted_by',
        source: '$actor',
        target: '$target',
        properties: { magicType: 'spell' },
      },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { mana: -0.10 } },
    ],
    difficulty: 0.50,
    narrativeTemplates: {
      initiation: '{{actor}} weaves the threads of magic, casting a spell toward {{the-target}}.',
      success: 'The spell takes root. {{the-target}} is touched by {{actor}}\'s arcane will.',
      failure: '{{actor}}\'s spell fizzles. The magic dissipates, leaving only smoke and regret.',
    },
  },
  {
    id: 'action.veil.detect-magic',
    name: 'Detect Magic',
    spellName: 'Mist Parting',
    description: 'Extends arcane perception to sense the presence and nature of hidden magical workings on or within a target. The invisible becomes visible, exposing enchantments, wards, and bound spirits that would otherwise remain concealed. Failure leaves the caster\'s perceptions dulled.',
    rarityTier: 1,
    crudType: 'read',
    reach: 'veil',
    durationRange: { min: 1, max: 2 },
    motivations: ['tradition_novelty', 'honesty_cunning'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { magicRevealed: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { insight: -0.02 } },
    ],
    difficulty: 0.35,
    narrativeTemplates: {
      initiation: '{{actor}} senses for magic afoot, reaching out with ethereal perception.',
      success: '{{actor}} feels it. The magic in {{the-target}} is now visible to {{their}} eyes.',
      failure: '{{actor}} feels nothing. {{the-target}}\'s magic remains cloaked.',
    },
  },
  {
    id: 'action.veil.modify-enchantment',
    name: 'Modify Enchantment',
    spellName: 'Veil Reforged',
    description: 'Reaches into an existing magical working and reshapes its parameters without fully unraveling it. The modified enchantment emerges stronger or better aligned with the caster\'s intent. Misjudgment of the magical structure can cause the working to destabilize instead.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'veil',
    durationRange: { min: 2, max: 3 },
    motivations: ['tradition_novelty', 'sacrifice_survival'],
    onSuccess: [
      {
        op: 'update_edge',
        edgeType: 'enchanted_by',
        source: '$actor',
        target: '$target',
        changes: { strength: 1 },
      },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { mana: -0.08 } },
    ],
    difficulty: 0.55,
    narrativeTemplates: {
      initiation: '{{actor}} reaches into {{the-target}}\'s enchantment, seeking to reshape its nature.',
      success: '{{actor}} succeeds. {{the-target}}\'s magic is reforged, more potent than before.',
      failure: '{{actor}}\'s attempt backfires. {{the-target}}\'s enchantment resists and grows unstable.',
    },
  },
  {
    id: 'action.veil.dispel',
    name: 'Dispel',
    spellName: 'Veil Torn Asunder',
    description: 'Unmakes an active magical enchantment by disrupting the binding threads that hold it together. The target is freed from the spell\'s influence as the magical working collapses and dissipates. Resistance from a powerful enchantment can exhaust the caster\'s reserves.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'veil',
    durationRange: { min: 3, max: 5 },
    motivations: ['tradition_novelty', 'courage_prudence'],
    onSuccess: [
      { op: 'remove_edge', edgeType: 'enchanted_by', source: '$actor', target: '$target' },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { mana: -0.12 } },
    ],
    difficulty: 0.60,
    narrativeTemplates: {
      initiation: '{{actor}} gathers {{their}} will to unmake {{the-target}}\'s magic.',
      success: '{{actor}} shatters the spell. {{the-target}} is freed from enchantment.',
      failure: '{{actor}} cannot break the magic. {{the-target}}\'s enchantment endures, growing stronger in resistance.',
    },
  },

  // Heart (social) — create, read, update, delete
  {
    id: 'action.heart.forge-alliance',
    name: 'Forge Alliance',
    spellName: 'Kindred Bond',
    description: 'Extends a hand of genuine partnership to another party, building a mutual commitment grounded in trust and shared interest. The alliance grants both parties protection, cooperation, and a strengthened social position. Spurned offers leave a quiet wound in the relationship.',
    rarityTier: 2,
    crudType: 'create',
    reach: 'heart',
    durationRange: { min: 2, max: 4 },
    motivations: ['loyalty_ambition', 'mercy_ruthlessness', 'preservation_transformation'],
    onSuccess: [
      { op: 'add_edge', edgeType: 'allied_with', source: '$actor', target: '$target' },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.08 } },
    ],
    difficulty: 0.45,
    narrativeTemplates: {
      initiation: '{{actor}} extends {{their}} hand to {{the-target}}, seeking alliance and accord.',
      success: 'The bond is forged. {{actor}} and {{the-target}} are now allies, standing together.',
      failure: '{{actor}}\'s offer is spurned. {{the-target}} has no wish to stand with {{actor}}.',
    },
  },
  {
    id: 'action.heart.assess-loyalty',
    name: 'Assess Loyalty',
    spellName: 'Heart\'s Gaze',
    description: 'Reads the emotional truth beneath another person\'s words and behavior to determine where their allegiance truly lies. Hidden resentments, divided loyalties, and secret devotions surface under careful scrutiny. Misreading the signs leaves the actor no wiser than before.',
    rarityTier: 1,
    crudType: 'read',
    reach: 'heart',
    durationRange: { min: 1, max: 2 },
    motivations: ['loyalty_ambition', 'mercy_ruthlessness'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { loyaltyKnown: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { insight: -0.03 } },
    ],
    difficulty: 0.35,
    narrativeTemplates: {
      initiation: '{{actor}} peers into {{the-target}}\'s heart, seeking the truth of {{their}} allegiance.',
      success: '{{actor}} sees clearly. {{the-target}}\'s loyalty is now transparent.',
      failure: '{{actor}} is deceived. {{the-target}}\'s true allegiance remains hidden.',
    },
  },
  {
    id: 'action.heart.inspire',
    name: 'Inspire',
    spellName: 'Heart\'s Refuge',
    description: 'Speaks with genuine conviction and personal warmth to rekindle another\'s sense of purpose and resilience. The inspired individual\'s morale lifts and their resolve strengthens against adversity. The effect is authentic but requires the speaker\'s own emotional investment.',
    rarityTier: 2,
    crudType: 'update',
    reach: 'heart',
    durationRange: { min: 2, max: 3 },
    motivations: ['preservation_transformation', 'mercy_ruthlessness'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { morale: 0.15 } },
      { op: 'add_edge', edgeType: 'inspired_by', source: '$actor', target: '$target' },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { morale: -0.05 } },
    ],
    difficulty: 0.40,
    narrativeTemplates: {
      initiation: '{{actor}} speaks to {{the-target}}, seeking to kindle hope in {{their}} heart.',
      success: '{{target}} is uplifted. {{actor}}\'s words kindle a flame of resolve.',
      failure: '{{actor}}\'s words fall flat. {{the-target}} remains unmoved and weary.',
    },
  },
  {
    id: 'action.heart.betray',
    name: 'Betray',
    spellName: 'Pact Severed',
    description: 'Deliberately breaks trust with an ally or intimate, exploiting access and shared history for personal gain. The betrayal destroys the existing bond and inflicts emotional damage that weakens the target\'s resolve. Discovery before the act is complete turns the weapon back on the betrayer.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'heart',
    durationRange: { min: 3, max: 5 },
    motivations: ['loyalty_ambition', 'preservation_transformation'],
    onSuccess: [
      { op: 'remove_edge', edgeType: 'allied_with', source: '$actor', target: '$target' },
      { op: 'update_node', nodeId: '$target', changes: { morale: -0.20 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.15 } },
    ],
    difficulty: 0.65,
    narrativeTemplates: {
      initiation: '{{actor}} turns on {{the-target}}, ready to shatter {{their}} faith.',
      success: '{{target}} is broken. {{actor}}\'s betrayal shatters {{their}} trust forever.',
      failure: '{{actor}}\'s attempt at betrayal is discovered. {{the-target}} strikes first.',
    },
  },

  // Eye (knowledge) — create, read, update, delete
  {
    id: 'action.eye.research',
    name: 'Research',
    spellName: 'Unveiling Gaze',
    description: 'Initiates a sustained investigation into a subject, systematically gathering evidence and cross-referencing sources. The result is a deep, reliable body of knowledge about the target that informs future decisions. Failure wastes the researcher\'s time and yields misleading conclusions.',
    rarityTier: 1,
    crudType: 'create',
    reach: 'eye',
    durationRange: { min: 2, max: 4 },
    motivations: ['honesty_cunning', 'loyalty_ambition', 'tradition_novelty'],
    onSuccess: [
      { op: 'add_edge', edgeType: 'investigates', source: '$actor', target: '$target', properties: { depth: 'deep' } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { insight: -0.04 } },
    ],
    difficulty: 0.45,
    narrativeTemplates: {
      initiation: '{{actor}} begins a research into {{the-target}}, seeking knowledge.',
      success: '{{actor}}\'s research bears fruit. {{the-target}} yields {{their}} secrets.',
      failure: '{{actor}}\'s research finds nothing. {{the-target}} remains opaque.',
    },
  },
  {
    id: 'action.eye.investigate',
    name: 'Investigate',
    spellName: 'Third Sight',
    description: 'Asks focused questions and follows evidence threads to reveal the hidden nature of a person, place, or situation. What is concealed rises to the surface under methodical scrutiny. A failed investigation deepens confusion rather than resolving it.',
    rarityTier: 1,
    crudType: 'read',
    reach: 'eye',
    durationRange: { min: 1, max: 2 },
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { investigated: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { insight: -0.02 } },
    ],
    difficulty: 0.30,
    narrativeTemplates: {
      initiation: '{{actor}} investigates {{the-target}}, asking questions and following threads.',
      success: '{{actor}} uncovers the truth. {{the-target}}\'s nature is revealed.',
      failure: '{{actor}} finds only confusion. {{the-target}}\'s mysteries deepen.',
    },
  },
  {
    id: 'action.eye.refine-knowledge',
    name: 'Refine Knowledge',
    spellName: 'Lens of Truth',
    description: 'Returns to an existing body of knowledge with fresh perspective, correcting errors and filling gaps in understanding. The refined picture reveals subtleties that earlier investigation missed. A misguided refinement can entrench false conclusions even deeper.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'eye',
    durationRange: { min: 2, max: 3 },
    motivations: ['loyalty_ambition', 'tradition_novelty'],
    onSuccess: [
      { op: 'update_edge', edgeType: 'investigates', source: '$actor', target: '$target', changes: { depth: 'deeper' } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { wisdom: -0.03 } },
    ],
    difficulty: 0.50,
    narrativeTemplates: {
      initiation: '{{actor}} delves deeper into {{their}} knowledge of {{the-target}}.',
      success: '{{actor}}\'s understanding deepens. {{the-target}}\'s nuances become clear.',
      failure: '{{actor}}\'s inquiry leads to dead ends. {{the-target}} reveals nothing new.',
    },
  },
  {
    id: 'action.eye.suppress-knowledge',
    name: 'Suppress Knowledge',
    spellName: 'Blinding Archive',
    description: 'Actively buries a truth — destroying records, discrediting sources, and pressuring witnesses into silence. The concealed knowledge becomes inaccessible to those who would use it against the actor. Failure allows the suppressed truth to spread further than it would have naturally.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'eye',
    durationRange: { min: 3, max: 5 },
    motivations: ['honesty_cunning', 'loyalty_ambition'],
    onSuccess: [
      { op: 'remove_edge', edgeType: 'investigates', source: '$actor', target: '$target' },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { reputation: -0.10 } },
    ],
    difficulty: 0.60,
    narrativeTemplates: {
      initiation: '{{actor}} acts to bury {{the-target}}\'s secrets, hiding truth from the world.',
      success: '{{actor}} succeeds. {{the-target}}\'s truth is buried, hidden from all.',
      failure: '{{actor}}\'s suppression fails. {{the-target}}\'s secrets spread further than before.',
    },
  },

  // Stone (construction) — create, read, update, delete
  {
    id: 'action.stone.build',
    name: 'Build',
    spellName: 'Foundation Ward',
    description: 'Lays the groundwork for a permanent structure that reshapes the landscape and serves as a lasting monument to the builder\'s ambition. The finished building anchors the actor\'s presence in a location and provides ongoing benefits. Collapsed projects drain resources and leave visible evidence of failure.',
    rarityTier: 2,
    crudType: 'create',
    reach: 'stone',
    durationRange: { min: 2, max: 4 },
    motivations: ['tradition_novelty', 'loyalty_ambition', 'sacrifice_survival'],
    onSuccess: [
      {
        op: 'add_node',
        nodeType: 'location',
        nodeName: 'Built Structure',
        properties: { type: 'construction', builder: '$actor' },
      },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { resources: -0.10 } },
    ],
    difficulty: 0.50,
    narrativeTemplates: {
      initiation: '{{actor}} lays foundations, beginning {{their}} grand construction.',
      success: '{{actor}}\'s structure stands. A new building rises, {{actor}}\'s legacy in stone.',
      failure: '{{actor}}\'s construction collapses. Resources are wasted, and shame remains.',
    },
  },
  {
    id: 'action.stone.assess-structure',
    name: 'Assess Structure',
    spellName: 'Unyielding Survey',
    description: 'Conducts a thorough physical and structural examination of a building or fortification to understand its integrity and potential. Hidden weaknesses, repair needs, and defensive qualities are revealed by the assessment. A flawed survey leaves dangerous gaps in the actor\'s understanding.',
    rarityTier: 1,
    crudType: 'read',
    reach: 'stone',
    durationRange: { min: 1, max: 2 },
    motivations: ['tradition_novelty', 'loyalty_ambition'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { assessed: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { insight: -0.02 } },
    ],
    difficulty: 0.35,
    narrativeTemplates: {
      initiation: '{{actor}} surveys {{the-target}}, examining every stone and beam.',
      success: '{{actor}} sees all. {{the-target}}\'s structure is now fully understood.',
      failure: '{{actor}}\'s assessment is flawed. {{the-target}}\'s true integrity remains unknown.',
    },
  },
  {
    id: 'action.stone.repair',
    name: 'Repair',
    spellName: 'Bastion\'s Oath',
    description: 'Dedicates labor and materials to restoring a damaged structure to its former strength and functionality. The repaired building regains its protective and operational qualities, better serving those who rely on it. Poor workmanship can weaken the structure further instead of mending it.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'stone',
    durationRange: { min: 2, max: 3 },
    motivations: ['sacrifice_survival', 'loyalty_ambition'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { integrity: 0.20 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$target', changes: { integrity: -0.05 } },
    ],
    difficulty: 0.45,
    narrativeTemplates: {
      initiation: '{{actor}} begins repairs on {{the-target}}, restoring what time has worn away.',
      success: '{{actor}}\'s repairs hold. {{the-target}} is restored to strength.',
      failure: '{{actor}}\'s repairs are poor. {{the-target}} crumbles further.',
    },
  },
  {
    id: 'action.stone.demolish',
    name: 'Demolish',
    spellName: 'Unyielding Core',
    description: 'Brings deliberate, systematic destruction to a structure until only rubble remains. The cleared site can be repurposed, or the act serves as a demonstration of power that cannot be ignored. Resistance from the structure or its defenders can exhaust the demolition effort.',
    rarityTier: 1,
    crudType: 'delete',
    reach: 'stone',
    durationRange: { min: 3, max: 5 },
    motivations: ['loyalty_ambition', 'sacrifice_survival'],
    onSuccess: [
      { op: 'remove_node', nodeId: '$target' },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { resources: -0.15 } },
    ],
    difficulty: 0.55,
    narrativeTemplates: {
      initiation: '{{actor}} readies the tools of demolition, preparing to tear down {{the-target}}.',
      success: '{{target}} crumbles to dust. {{actor}}\'s demolition is complete.',
      failure: '{{actor}}\'s demolition goes awry. {{the-target}} stands defiant.',
    },
  },

  // Star (fate) — create, read, update, delete
  {
    id: 'action.star.consecrate',
    name: 'Consecrate',
    spellName: 'Celestial Mandate',
    description: 'Performs sacred rites that bind a location to a higher purpose, infusing the site with divine resonance and marking it as holy ground. Consecrated places attract the faithful and resist corruption. The rites fail when the site resists the specific domain being invoked.',
    rarityTier: 2,
    crudType: 'create',
    reach: 'star',
    durationRange: { min: 2, max: 4 },
    motivations: ['sacrifice_survival', 'tradition_novelty', 'courage_prudence'],
    onSuccess: [
      { op: 'add_edge', edgeType: 'blessed_by', source: '$actor', target: '$target', properties: { sacred: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { faith: -0.05 } },
    ],
    difficulty: 0.45,
    narrativeTemplates: {
      initiation: '{{actor}} performs the rites, seeking to sanctify {{the-target}}.',
      success: '{{actor}}\'s blessing is accepted. {{the-target}} becomes sacred ground.',
      failure: '{{actor}}\'s ritual fails. {{the-target}} remains mundane.',
    },
  },
  {
    id: 'action.star.divine',
    name: 'Divine',
    spellName: 'Starfall Omen',
    description: 'Reads the signs and portents available in the sky, the bones, or the entrails to glimpse the likely fate of a target. A successful reading reveals the direction of events and the forces shaping them. A failed reading provides a dangerously false sense of certainty.',
    rarityTier: 2,
    crudType: 'read',
    reach: 'star',
    durationRange: { min: 1, max: 2 },
    motivations: ['sacrifice_survival', 'tradition_novelty'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { divined: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { insight: -0.03 } },
    ],
    difficulty: 0.40,
    narrativeTemplates: {
      initiation: '{{actor}} seeks guidance, divining the fate of {{the-target}}.',
      success: '{{actor}} receives a vision. {{the-target}}\'s destiny is revealed.',
      failure: '{{actor}} receives no sign. {{the-target}}\'s fate remains hidden.',
    },
  },
  {
    id: 'action.star.deepen-faith',
    name: 'Deepen Faith',
    spellName: 'Astral Decree',
    description: 'Delivers teachings, miracles, or testimony that strengthens a believer\'s connection to their spiritual practice and convictions. The deepened faith makes the individual more resilient to doubt and more devoted to the actor\'s cause. Poorly received teachings can plant seeds of doubt instead.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'star',
    durationRange: { min: 2, max: 3 },
    motivations: ['sacrifice_survival', 'courage_prudence'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { faith: 0.15 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { faith: -0.04 } },
    ],
    difficulty: 0.50,
    narrativeTemplates: {
      initiation: '{{actor}} strengthens {{the-target}}\'s faith, drawing {{them}} closer to the divine.',
      success: '{{target}}\'s faith deepens. {{actor}}\'s words kindle unwavering belief.',
      failure: '{{actor}}\'s words sow doubt. {{the-target}}\'s faith weakens.',
    },
  },
  {
    id: 'action.star.desecrate',
    name: 'Desecrate',
    spellName: 'Profane Star',
    description: 'Commits deliberate sacrilege against a consecrated site or holy object, severing its divine connection and polluting its spiritual resonance. The desecrated place loses its sacred protection and becomes tainted ground. Divine retribution can strike the perpetrator when the act goes too far.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'star',
    durationRange: { min: 3, max: 5 },
    motivations: ['courage_prudence', 'loyalty_ambition'],
    onSuccess: [
      { op: 'remove_edge', edgeType: 'blessed_by', source: '$actor', target: '$target' },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { faith: -0.15 } },
    ],
    difficulty: 0.65,
    narrativeTemplates: {
      initiation: '{{actor}} commits sacrilege, seeking to profane {{the-target}}.',
      success: '{{actor}} succeeds. {{the-target}} is desecrated, {{its}} sacred nature shattered.',
      failure: '{{actor}}\'s sacrilege is punished. Divine retribution strikes {{actor}} down.',
    },
  },

  // Former Flesh (biology) actions — redistributed to Gold/Eye/Shadow per TB-075 Phase 1
  {
    id: 'action.flesh.heal',
    name: 'Heal',
    spellName: 'Mending Touch',
    description: 'Applies skilled care to a wounded or ailing individual, drawing on knowledge of the body to accelerate recovery. Health returns and the patient is restored to function they had lost. A healer who misjudges the condition can inadvertently worsen the affliction.',
    rarityTier: 1,
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 2, max: 4 },
    motivations: ['mercy_ruthlessness', 'sacrifice_survival', 'courage_prudence'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { health: 0.20 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { vitality: -0.03 } },
    ],
    difficulty: 0.40,
    narrativeTemplates: {
      initiation: '{{actor}} reaches for {{the-target}}, seeking to mend {{their}} wounds.',
      success: '{{target}} is healed. {{actor}}\'s touch restores {{their}} health.',
      failure: '{{actor}}\'s healing fails. {{the-target}} remains afflicted.',
    },
  },
  {
    id: 'action.flesh.diagnose',
    name: 'Diagnose',
    spellName: 'Healer\'s Sight',
    description: 'Applies careful examination to identify the root cause of a target\'s physical or psychological condition. Once the ailment is named, it becomes possible to treat effectively rather than guess. Misidentification sends subsequent healing efforts in the wrong direction entirely.',
    rarityTier: 1,
    crudType: 'read',
    reach: 'eye',
    durationRange: { min: 1, max: 2 },
    motivations: ['mercy_ruthlessness', 'honesty_cunning'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { ailmentKnown: true } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { insight: -0.02 } },
    ],
    difficulty: 0.35,
    narrativeTemplates: {
      initiation: '{{actor}} examines {{the-target}}, seeking the source of {{their}} affliction.',
      success: '{{actor}} sees clearly. {{the-target}}\'s ailment is identified.',
      failure: '{{actor}} cannot determine {{the-target}}\'s illness. The cause remains a mystery.',
    },
  },
  {
    id: 'action.flesh.cultivate',
    name: 'Cultivate',
    spellName: 'Vital Tending',
    description: 'Provides sustained care and nourishment that builds a target\'s baseline vitality over time. The effort compounds to produce lasting improvement in health, resilience, and physical capacity. Neglect or incorrect methods can cause regression rather than growth.',
    rarityTier: 1,
    crudType: 'update',
    reach: 'gold',
    durationRange: { min: 2, max: 3 },
    motivations: ['sacrifice_survival', 'mercy_ruthlessness'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { vitality: 0.15 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$target', changes: { vitality: -0.05 } },
    ],
    difficulty: 0.45,
    narrativeTemplates: {
      initiation: '{{actor}} tends to {{the-target}}, cultivating {{their}} strength and vitality.',
      success: '{{target}} flourishes. {{actor}}\'s care enhances {{their}} vigor.',
      failure: '{{actor}}\'s methods are crude. {{the-target}}\'s vitality wanes.',
    },
  },
  {
    id: 'action.flesh.plague',
    name: 'Plague',
    spellName: 'Cursed Contagion',
    description: 'Unleashes a targeted curse of sickness and pestilence on an individual or group, degrading their health and fighting ability. The affliction spreads and deepens, weakening the target beyond their capacity to resist. Mishandling the curse risks turning the contagion back on the caster.',
    rarityTier: 2,
    crudType: 'delete',
    reach: 'shadow',
    durationRange: { min: 3, max: 5 },
    motivations: ['mercy_ruthlessness', 'mercy_ruthlessness'],
    onSuccess: [
      { op: 'update_node', nodeId: '$target', changes: { health: -0.50 } },
    ],
    onFailure: [
      { op: 'update_node', nodeId: '$actor', changes: { health: -0.20 } },
    ],
    difficulty: 0.60,
    narrativeTemplates: {
      initiation: '{{actor}} curses {{the-target}}, seeking to spread plague and pestilence.',
      success: '{{target}} sickens. {{actor}}\'s curse takes hold, and disease spreads.',
      failure: '{{actor}}\'s curse rebounds. {{actor}} becomes the victim of {{their}} own plague.',
    },
  },
];

// ─── Lookup Functions ────────────────────────────────────────────

/**
 * Get action template by ID
 */
export function getActionTemplateById(id: string): ActionTemplateData | undefined {
  return ACTION_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all action templates for a specific reach
 */
export function getActionsByReach(reach: string): ActionTemplateData[] {
  return ACTION_TEMPLATES.filter(t => t.reach === reach);
}

/**
 * Get all action templates for a specific CRUD type
 */
export function getActionsByCrudType(crudType: string): ActionTemplateData[] {
  return ACTION_TEMPLATES.filter(t => t.crudType === crudType);
}
