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
}

// ─── 36 Action Templates (4 per reach × 9 reaches) ───────────────

export const ACTION_TEMPLATES: ActionTemplateData[] = [
  // Iron (warfare) — create, read, update, delete
  {
    id: 'action.iron.raise-force',
    name: 'Raise Force',
    crudType: 'create',
    reach: 'iron',
    durationRange: { min: 2, max: 4 },
    motivations: ['courage_prudence', 'ambition_contentment'],
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
    crudType: 'read',
    reach: 'iron',
    durationRange: { min: 1, max: 2 },
    motivations: ['courage_prudence', 'cunning_honesty'],
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
    crudType: 'update',
    reach: 'iron',
    durationRange: { min: 2, max: 3 },
    motivations: ['dominance_humility', 'courage_prudence'],
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
    crudType: 'delete',
    reach: 'iron',
    durationRange: { min: 3, max: 5 },
    motivations: ['dominance_humility', 'wrath_patience'],
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
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 2, max: 4 },
    motivations: ['greed_generosity', 'cunning_honesty', 'ambition_contentment'],
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
    crudType: 'read',
    reach: 'gold',
    durationRange: { min: 1, max: 2 },
    motivations: ['cunning_honesty', 'ambition_contentment'],
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
    crudType: 'update',
    reach: 'gold',
    durationRange: { min: 2, max: 3 },
    motivations: ['greed_generosity', 'cunning_honesty'],
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
    crudType: 'delete',
    reach: 'gold',
    durationRange: { min: 3, max: 5 },
    motivations: ['greed_generosity', 'loyalty_treachery'],
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
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 2, max: 4 },
    motivations: ['greed_generosity', 'cunning_honesty', 'loyalty_treachery'],
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
    crudType: 'update',
    reach: 'gold',
    durationRange: { min: 2, max: 3 },
    motivations: ['greed_generosity', 'dominance_humility'],
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
    crudType: 'delete',
    reach: 'gold',
    durationRange: { min: 1, max: 2 },
    motivations: ['loyalty_treachery', 'greed_generosity', 'cunning_honesty'],
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
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 2, max: 3 },
    motivations: ['greed_generosity', 'courage_prudence', 'ambition_contentment'],
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
    crudType: 'delete',
    reach: 'gold',
    durationRange: { min: 3, max: 5 },
    motivations: ['greed_generosity', 'cunning_honesty', 'loyalty_treachery'],
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
    crudType: 'update',
    reach: 'gold',
    durationRange: { min: 1, max: 3 },
    motivations: ['greed_generosity', 'cunning_honesty', 'dominance_humility'],
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
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 3, max: 5 },
    motivations: ['ambition_contentment', 'greed_generosity', 'tradition_innovation'],
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
    crudType: 'create',
    reach: 'gold',
    durationRange: { min: 4, max: 6 },
    motivations: ['greed_generosity', 'dominance_humility', 'ambition_contentment'],
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
    crudType: 'create',
    reach: 'shadow',
    durationRange: { min: 2, max: 4 },
    motivations: ['cunning_honesty', 'courage_prudence', 'loyalty_treachery'],
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
    crudType: 'read',
    reach: 'shadow',
    durationRange: { min: 1, max: 2 },
    motivations: ['cunning_honesty', 'courage_prudence'],
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
    crudType: 'update',
    reach: 'shadow',
    durationRange: { min: 2, max: 3 },
    motivations: ['loyalty_treachery', 'cunning_honesty'],
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
    crudType: 'delete',
    reach: 'shadow',
    durationRange: { min: 3, max: 5 },
    motivations: ['loyalty_treachery', 'wrath_patience'],
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
    crudType: 'create',
    reach: 'veil',
    durationRange: { min: 2, max: 4 },
    motivations: ['tradition_innovation', 'devotion_independence'],
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
    crudType: 'read',
    reach: 'veil',
    durationRange: { min: 1, max: 2 },
    motivations: ['tradition_innovation', 'cunning_honesty'],
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
    crudType: 'update',
    reach: 'veil',
    durationRange: { min: 2, max: 3 },
    motivations: ['tradition_innovation', 'devotion_independence'],
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
    crudType: 'delete',
    reach: 'veil',
    durationRange: { min: 3, max: 5 },
    motivations: ['tradition_innovation', 'courage_prudence'],
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
    crudType: 'create',
    reach: 'heart',
    durationRange: { min: 2, max: 4 },
    motivations: ['loyalty_treachery', 'cruelty_compassion', 'dominance_humility'],
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
    crudType: 'read',
    reach: 'heart',
    durationRange: { min: 1, max: 2 },
    motivations: ['loyalty_treachery', 'cruelty_compassion'],
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
    crudType: 'update',
    reach: 'heart',
    durationRange: { min: 2, max: 3 },
    motivations: ['dominance_humility', 'cruelty_compassion'],
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
    crudType: 'delete',
    reach: 'heart',
    durationRange: { min: 3, max: 5 },
    motivations: ['loyalty_treachery', 'dominance_humility'],
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
    crudType: 'create',
    reach: 'eye',
    durationRange: { min: 2, max: 4 },
    motivations: ['cunning_honesty', 'ambition_contentment', 'tradition_innovation'],
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
    crudType: 'read',
    reach: 'eye',
    durationRange: { min: 1, max: 2 },
    motivations: ['cunning_honesty', 'ambition_contentment'],
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
    crudType: 'update',
    reach: 'eye',
    durationRange: { min: 2, max: 3 },
    motivations: ['ambition_contentment', 'tradition_innovation'],
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
    crudType: 'delete',
    reach: 'eye',
    durationRange: { min: 3, max: 5 },
    motivations: ['cunning_honesty', 'loyalty_treachery'],
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
    crudType: 'create',
    reach: 'stone',
    durationRange: { min: 2, max: 4 },
    motivations: ['tradition_innovation', 'ambition_contentment', 'devotion_independence'],
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
    crudType: 'read',
    reach: 'stone',
    durationRange: { min: 1, max: 2 },
    motivations: ['tradition_innovation', 'ambition_contentment'],
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
    crudType: 'update',
    reach: 'stone',
    durationRange: { min: 2, max: 3 },
    motivations: ['devotion_independence', 'ambition_contentment'],
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
    crudType: 'delete',
    reach: 'stone',
    durationRange: { min: 3, max: 5 },
    motivations: ['ambition_contentment', 'devotion_independence'],
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
    crudType: 'create',
    reach: 'star',
    durationRange: { min: 2, max: 4 },
    motivations: ['devotion_independence', 'tradition_innovation', 'courage_prudence'],
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
    crudType: 'read',
    reach: 'star',
    durationRange: { min: 1, max: 2 },
    motivations: ['devotion_independence', 'tradition_innovation'],
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
    crudType: 'update',
    reach: 'star',
    durationRange: { min: 2, max: 3 },
    motivations: ['devotion_independence', 'courage_prudence'],
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
    crudType: 'delete',
    reach: 'star',
    durationRange: { min: 3, max: 5 },
    motivations: ['courage_prudence', 'loyalty_treachery'],
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

  // Flesh (biology) — create, read, update, delete
  {
    id: 'action.flesh.heal',
    name: 'Heal',
    crudType: 'create',
    reach: 'flesh',
    durationRange: { min: 2, max: 4 },
    motivations: ['cruelty_compassion', 'devotion_independence', 'courage_prudence'],
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
    crudType: 'read',
    reach: 'flesh',
    durationRange: { min: 1, max: 2 },
    motivations: ['cruelty_compassion', 'cunning_honesty'],
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
    crudType: 'update',
    reach: 'flesh',
    durationRange: { min: 2, max: 3 },
    motivations: ['devotion_independence', 'cruelty_compassion'],
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
    crudType: 'delete',
    reach: 'flesh',
    durationRange: { min: 3, max: 5 },
    motivations: ['cruelty_compassion', 'wrath_patience'],
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
