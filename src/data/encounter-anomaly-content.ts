/**
 * encounter-anomaly-content.ts â€” Anomaly encounter templates.
 *
 * Migrated to UnifiedActionTemplate (THR-106).
 *
 * 10 templates covering anomalous locations: gem deposits, crystal caverns,
 * golden groves, herb gardens, ancient vaults, sunken treasuries, fossil beds,
 * iron seeps, pearl shoals, and glowcap hollows.
 *
 * Each template rewrites legacy EncounterTemplate prose to the Threadbare
 * aesthetic bar (sensory-first, enrichment placeholders, conditional blocks)
 * and adds authored aftermath with sphere-specific consequences: hidden marks
 * for cosmic exposure, intelligence grants for discovered knowledge, encounter
 * seeds for echoes that follow.
 *
 * Two templates â€” fallen_star and dreaming_light â€” have authored choice cards
 * where the player-god's reaction meaningfully shapes what the anomaly does
 * to the agent.
 *
 * NFP #1: All difficulty values are named constants.
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { ENCOUNTER_TYPE_MOTIVATIONS } from '../types/encounter';

// â”€â”€ Difficulty Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Base Eye discovery step difficulty â€” achievable by mid-game agents. */
const DISCOVERY_DIFFICULTY = 0.12;

/** Standard extraction step â€” themed reach test. */
const EXTRACTION_DIFFICULTY = 0.18;

/** Elevated extraction for 3-step encounters with dangerous complications. */
const DANGEROUS_EXTRACTION_DIFFICULTY = 0.22;

/** Complication or climax step (3-step encounters only). */
const COMPLICATION_DIFFICULTY = 0.28;

// â”€â”€ Templates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const ANOMALY_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  // â”€â”€ gem_deposit: "The Gleaming Vein" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'encounter.anomaly.gleaming_vein',
    name: 'The Gleaming Vein',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['gem_deposit'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'matter',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The hillside at {location} runs in the same grey strata it has for a thousand years â€” ' +
          'except here, where a band of rock catches the light at an angle that doesn\'t quite match the rest. ' +
          '{name} stops. The striations are fine, regular, and they wink out at a specific point near the ridge. ' +
          '{?has_faction}The guild\'s survey maps noted unusual mineral activity in this sector. ' +
          '{name} had half-dismissed it as bureaucratic optimism.{/has_faction}' +
          '{?no_faction}No surveyor has been through here in a decade. ' +
          'Whatever this is, {name} found it first.{/no_faction}',
        successAfterimage:
          '{name} traces the striation band with two fingers and feels it: the faint crystalline regularity of a mineral vein beneath the surface rock.',
        failureAfterimage:
          'Feldspar and wet mica. The hillside keeps its secrets.',
      },
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: EXTRACTION_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.6, bestowed_power: 0.3, condition: 0.1 },
            tagFilters: ['#gem'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.12,
        },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The vein runs deeper than the surface band suggested. ' +
          '{name} works the rock in careful wedges â€” ' +
          'one wrong strike at the wrong angle and the crystalline structure fractures through. ' +
          'The stone is cold here, even in afternoon heat, and the chips that fall ring with a pitch that ordinary rock doesn\'t make.',
        successAfterimage:
          'The vein opens. Faceted stones spill into {name}\'s palm: dense, cold, their color saturated in a way that polished gems in a jeweller\'s case never quite are.',
        failureAfterimage:
          'The rock shifts wrong. The vein seals itself along a fault line, and nothing {name} can do will lever it back open today.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} investigates unusual mineral striations on a hillside at {location}.',
      success: 'The vein opens. Gems that have been dark for centuries see light for the first time.',
      failure: 'The rock yields nothing. The vein is there â€” {name} could feel it â€” but the stone won\'t cooperate today.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The hillside at {location} is quieter now. Whether {name} extracted anything or not, ' +
          'the survey is done â€” the knowledge of what lies beneath is a kind of possession even before anything is removed.',
        changes: [
          {
            id: 'gleaming_vein_knowledge',
            kind: 'future_hook',
            title: 'Mineral Survey',
            detail: 'Knowledge of the seam\'s location and composition.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god take from the hillside?',
        reactions: [
          {
            id: 'gleaming_vein_record_location',
            label: 'Mark the location. This vein has more to give.',
            intent:
              '{name} notes the exact striation angle, the rock type, the depth at which the vein turns. ' +
              'The knowledge is precise. It will be useful again.',
            effects: [
              {
                kind: 'intelligence',
                category: 'trade_route',
                label: 'Gem-bearing vein at {location}',
                detail:
                  'A mineral seam of unusual depth and clarity, accessible by careful extraction from the hillside\'s south face. ' +
                  'The vein runs approximately two meters deep before widening.',
                reliability: 0.9,
              },
              {
                // Returning prospectors with prior trade_route intel read the vein
                // through the lens of where similar seams have run in the past.
                kind: 'intel_referenced_prose',
                category: 'trade_route',
                prose: {
                  reliable: '{name} priced the goods by what {name} already knew the route would bear — the market spoke, but it spoke a language already learned.',
                  uncertain:
                    '{name} measured the seam\'s yield against routes {name} had partly mapped — close enough to estimate the price, off enough to require a careful note on what the buyers in {location} would actually pay.',
                  dubious:
                    '{name} reached for the trade arithmetic the rumor had supplied, and the rumor had aged — the route this seam fed was no longer the route the dossier had described, and the value would have to be reckoned fresh.',
                },
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'gleaming_vein_extraction_mark',
            label: 'The stone remembers being opened.',
            intent:
              'Deep extractions don\'t go unnoticed by the systems that track such things. ' +
              '{name} took something from the dark, and the dark has noted the transaction.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.25,
                label: 'Drew from a deep mineral vein â€” the site registered the extraction',
                revealFamilies: ['encounter.anomaly', 'investigation', 'stone'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ crystal_cavern: "The Singing Dark" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'encounter.anomaly.singing_dark',
    name: 'The Singing Dark',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['crystal_cavern'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'energy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY + 0.03,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The ground at {location} carries a vibration that isn\'t sound. ' +
          '{name} feels it first in the soles of {their} feet, then in the small bones of the inner ear â€” ' +
          'a resonance that has been running so long it has worn a groove in the landscape. ' +
          '{?has_ally}Later, {ally:strongest} will say {they} felt nothing. ' +
          'That\'s the thing about crystal harmonics: they speak to the frequency of the person listening.{/has_ally}',
        successAfterimage:
          '{name} presses one ear to a flat stone. Below â€” a hollow, lined with crystal formations, each one amplifying the others in a closed acoustic loop.',
        failureAfterimage:
          'The vibration fades before {name} can trace its source. The ground goes quiet. Whatever was singing has stopped.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: DANGEROUS_EXTRACTION_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The cavern opens below the rock shelf â€” a chamber the size of a small hall, every surface ' +
          'covered in crystal growths that range from finger-length to three meters tall. ' +
          'They are all singing. Each formation has its own pitch, and the combinations overlap ' +
          'into something that is almost music and almost warning. ' +
          '{name} picks a path through the closest formations. One wrong vibration â€” a knocked crystal, ' +
          'a raised voice â€” could cascade through the whole system.',
        successAfterimage:
          '{name} passes through the outer ring of formations without disturbing the chord. The inner chamber comes clear.',
        failureAfterimage:
          'A formation grazes {their} pack. One note goes wrong, then another, then the whole outer ring shrieks. {name} retreats.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: COMPLICATION_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { bestowed_power: 0.5, possession: 0.3, condition: 0.2 },
            tagFilters: ['#crystal', '#arcane'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.15,
        },
        failureMetadata: { reputationDelta: -0.08 },
        narrativeTemplate:
          'The cavern recognises {name}\'s presence. The crystals don\'t stop singing â€” they change what they sing. ' +
          'The resonance builds, concentrating at the point where {they} stand{s}, ' +
          'as if the entire system has found a focus. This is not hostile. It is thorough. ' +
          'The cavern is doing what the cavern does: it is evaluating.',
        successAfterimage:
          '{name} lets the resonance move through rather than resist it. After a long moment, the song changes again â€” resolved, settled. The crystals accept the visitor.',
        failureAfterimage:
          'The energy overwhelms {name}\'s ability to hold a single frequency. {they} surface{s} from the cave with ringing ears and a strange metallic taste that lasts for hours.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} follows a sub-audible vibration into a crystal cavern beneath {location}.',
      success: 'The singing dark accepts {name}. What the crystals gave was something more than material.',
      failure: 'The cavern did not accept {name} today. The harmonics offered a frequency {they} couldn\'t hold.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The crystal cavern is what it was before {name} arrived â€” singing to itself in the dark, ' +
          'indifferent to visits on the surface scale. But something has been exchanged. ' +
          'Resonance leaves marks on the things that enter it.',
        changes: [
          {
            id: 'singing_dark_attunement',
            kind: 'future_hook',
            title: 'Crystal Attunement',
            detail: 'The cavern registered {name}\'s frequency. Some crystalline systems remember.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god do with the resonance {name} carries out?',
        reactions: [
          {
            id: 'singing_dark_mark_attuned',
            label: 'The cavern has learned {name}\'s pitch.',
            intent:
              'A crystalline system that runs on frequency will remember the frequencies that entered it. ' +
              '{name} is now a known quantity to the singing dark â€” which may open doors or draw attention, depending on what listens.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'mystical_contract',
                severity: 0.4,
                label: 'Crystal-attuned: the singing dark registered {name}\'s resonant frequency',
                revealFamilies: ['encounter.anomaly', 'veil', 'arcane_circle'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'singing_dark_seed_return',
            label: 'The cavern will call {name} back.',
            intent:
              'Crystalline systems of sufficient complexity develop memory. ' +
              'Not intention, exactly â€” but a preference. The frequency that matched will be invited again.',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'encounter.anomaly.singing_dark',
                delayTicks: 30,
                priority: 0.8,
                seedLabel: 'The crystal cavern\'s harmonics have shifted toward the frequency {name} left behind',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ golden_grove: "Sap of Ages" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'encounter.anomaly.sap_of_ages',
    name: 'Sap of Ages',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['golden_grove'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'life',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY - 0.02,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The grove at the edge of {location} has bark with an amber cast that doesn\'t come from sunlight. ' +
          '{name} steps under the canopy and the smell changes â€” something between honey and old wood, ' +
          'specific enough to be a thing rather than a general impression of sweetness. ' +
          '{?has_artifact}The {artifact:any} reacts slightly to the proximity. Whatever is in the bark resonates with older things.{/has_artifact}' +
          '{?no_artifact}Nothing to compare it to, but the smell is distinctive. It will be easy to find again.{/no_artifact}',
        successAfterimage:
          'The bark weeps slowly where the wood has cracked â€” a golden fluid, thick and warm, beading at the grain. {name} touches it. It doesn\'t harden on contact.',
        failureAfterimage:
          'Ordinary sap. The amber cast was the angle of light through old leaves. The grove keeps nothing extraordinary.',
      },
      {
        reach: 'heart',
        duration: { min: 2, max: 2 },
        difficulty: EXTRACTION_DIFFICULTY - 0.03,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.4, condition: 0.4, bestowed_power: 0.2 },
            tagFilters: ['#nature', '#healing'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.10,
        },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The grove responds to how {name} approaches it. ' +
          'Pull or demand and the bark seals; come with attention and patience and the trees read that, too. ' +
          '{name} works slowly through the grove, checking which trees are giving and which are holding, ' +
          'taking only from the ones that have excess â€” a distinction that can only be made by looking carefully.',
        successAfterimage:
          'The vessels fill. The grove gave what it could afford to give, which was more than {name} expected.',
        failureAfterimage:
          'The trees tighten. {name} moved through the grove with something the wood read as urgency, and urgency is precisely what the grove will not reward.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} investigates an amber-barked grove at {location} that smells of honey and old wood.',
      success: 'The grove gave what it could afford. The sap is warm and the vessels are full.',
      failure: 'The grove closed against {name}. Whatever the trees measure, today\'s approach didn\'t meet it.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The grove at {location} goes on being what it is. A long-lived system, generous in its own terms, ' +
          'unmoved by individual visits. Whether {name} harvested anything today, ' +
          'the knowledge of where it is has its own value.',
        changes: [
          {
            id: 'sap_of_ages_grove_knowledge',
            kind: 'future_hook',
            title: 'Grove Location',
            detail: 'The amber-barked grove and its unusual sap properties are now known.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god mark from this encounter?',
        reactions: [
          {
            id: 'sap_grove_record',
            label: 'Record the grove\'s location and properties.',
            intent:
              'The grove\'s amber sap has specific medicinal and alchemical properties. ' +
              '{name} knows where it is, what the bark smells like, and which trees are giving â€” knowledge worth keeping.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Amber-sap grove at {location}',
                detail:
                  'A grove of trees producing a slow amber sap with preserved alchemical and healing properties. ' +
                  'The grove responds to patient, attentive approach. Urgency closes it.',
                reliability: 0.85,
              },
              {
                // THR-139 pilot: returning to anomalous cultural sites surfaces what
                // {name} already learned about the practice — useful when the grove
                // remembers, hollow when it doesn't.
                kind: 'intel_referenced_prose',
                category: 'cultural_knowledge',
                prose: {
                  reliable: '{name} read the working with the unhurried recognition of someone who had seen its bones before — the lore came back, exactly as remembered.',
                  uncertain: '{name} works half from instinct, half from a half-recalled fragment — the lore returned in pieces, but enough pieces lined up to carry the working.',
                  dubious: '{name} reached for the lore they thought they knew. What surfaced was older, and stranger, and not quite what was expected.',
                },
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'sap_grove_tally',
            label: 'This was taken with care. That matters.',
            intent:
              'Living systems in this world notice how they\'re treated. The grove won\'t remember {name} by name, ' +
              'but its memory is structural â€” agents who take carefully are more welcome next time.',
            effects: [
              { kind: 'reputation_tally', key: 'natural.grove_harmony', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ herb_garden: "The Wild Apothecary" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'encounter.anomaly.wild_apothecary',
    name: 'The Wild Apothecary',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['herb_garden'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'life',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY - 0.04,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          '{name} moves through the common growth at the edge of {location} â€” ' +
          'shepherd\'s purse, dock, the usual ground-covering flora â€” and stops. ' +
          'Feverfew doesn\'t grow this far inland. Dreamroot doesn\'t grow this far north. ' +
          'They are both here, three handspans apart, thriving in soil that should be wrong for both of them. ' +
          '{?has_faction}The guild\'s herbalists maintain a catalog of impossible combinations. ' +
          'This one would be new to it.{/has_faction}',
        successAfterimage:
          '{name} identifies eight distinct medicinal species in a patch the size of a large table. None of them should share soil this well.',
        failureAfterimage:
          'Weeds. The arrangement was coincidence, not anomaly.',
      },
      {
        reach: 'eye',
        duration: { min: 1, max: 2 },
        difficulty: DISCOVERY_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.5, bestowed_power: 0.3, possession: 0.2 },
            tagFilters: ['#healing', '#herb'],
          },
          tierPromotionEligible: false,
          reputationDelta: 0.08,
        },
        failureMetadata: { reputationDelta: -0.03 },
        narrativeTemplate:
          'The plants grow in relationship with each other â€” their roots share fungal networks, ' +
          'their canopies shade in a specific pattern, each one dependent on the others. ' +
          '{name} maps the root architecture before touching anything. ' +
          'To pull one plant carelessly would stress three others. ' +
          'This is slower work than ordinary foraging and more demanding.',
        successAfterimage:
          '{name} harvests from the outer ring first, taking specimens that the inner plants can afford to lose. The network holds.',
        failureAfterimage:
          'A careless pull tears a root connection. The adjacent plants begin wilting within minutes. {name} stops immediately, but the damage is done.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} discovers an impossible combination of medicinal plants growing together near {location}.',
      success: 'The wild apothecary yields samples from a botanical assembly that has no business existing.',
      failure: 'The root network was more fragile than it looked. {name} left with less than {they} came for.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The impossible herb garden at {location} persists in its improbability. ' +
          'Whether {name} harvested cleanly or damaged the network, ' +
          'the knowledge of what grows here and how is worth carrying forward.',
        changes: [
          {
            id: 'wild_apothecary_botanical',
            kind: 'future_hook',
            title: 'Botanical Knowledge',
            detail: 'The plant combinations and their properties are catalogued.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god preserve from this garden?',
        reactions: [
          {
            id: 'wild_apothecary_catalogue',
            label: 'Record the plant combinations. This knowledge has value.',
            intent:
              'An impossible botanical assembly has specific properties because of the specific network it forms. ' +
              '{name} carries a working understanding of what grows here, how, and what it can do.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Wild apothecary at {location}: impossible botanical combinations',
                detail:
                  'An anomalous herb garden where species incapable of co-habitation grow in a shared root network. ' +
                  'Medicinal properties enhanced by proximity. Harvest requires mapping the network first.',
                reliability: 0.9,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'wild_apothecary_tally',
            label: '{name} treated the network as a system, not a resource.',
            intent:
              'The distinction between foraging and stewardship is sometimes the only thing that keeps a garden alive. ' +
              'Whatever {name} took, {they} took{s} it knowing what the network could afford.',
            effects: [
              { kind: 'reputation_tally', key: 'natural.apothecary_practice', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ ancient_vault: "The Sealed Chamber" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'encounter.anomaly.sealed_chamber',
    name: 'The Sealed Chamber',
    rarityTier: 3,
    intrinsicTier: 'story_beat',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['ancient_vault'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'time',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY + 0.06,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The stone here at {location} has marks that should have weathered out centuries ago. ' +
          '{name} traces one with a fingernail: the edge is crisp, the angles precise, the depth consistent. ' +
          'These weren\'t cut into stone â€” they were anchored into it, preserved through some process ' +
          'that has outlasted every civilization that might have authored them. ' +
          '{?has_ally}Later, {ally:strongest} will want to know what {name} found here. ' +
          'That conversation will require deciding how much to say.{/has_ally}',
        successAfterimage:
          'The mark-pattern is a lock, not a warning. {name} identifies the sequence it responds to â€” and that it responds to sequence at all.',
        failureAfterimage:
          'The symbols shift in focus. The builders hid their work from casual reading, and {name}\'s reading was too casual.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: DANGEROUS_EXTRACTION_DIFFICULTY + 0.03,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The wards have been active for as long as there has been anything in {location} to remember. ' +
          '{name} works through the counter-sequence, speaking each element precisely â€” ' +
          'not because the vault is listening for sincerity, but because the mechanism requires exact input. ' +
          'One phrase wrong, and the failsafe doesn\'t discharge. It redirects.',
        successAfterimage:
          'The wards dim one by one. The seal breaks. Air from a chamber that has been closed since before the current age rushes out â€” cool, stale, and faintly charged.',
        failureAfterimage:
          'The counter-phrase was close but not correct. The wards flare and push back. {name}\'s hands ache where the discharge ran through {them}.',
      },
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: COMPLICATION_DIFFICULTY + 0.02,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.3, condition: 0.2 },
            tagFilters: ['#ancient', '#relic'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.18,
        },
        failureMetadata: { reputationDelta: -0.10 },
        narrativeTemplate:
          'The vault doesn\'t want to be open. The ceiling confirms this in slow, incremental ways: ' +
          'first a trickle of dust, then a groan from the far wall, then a crack that {name} can see widening ' +
          'as the support structure adjusts to the sudden pressure differential. ' +
          '{name} has perhaps four minutes before the entrance seals itself permanently.',
        successAfterimage:
          '{name} moves fast and deliberately â€” takes what the vault offers at arm\'s reach and goes. Behind {them}, the chamber closes forever.',
        failureAfterimage:
          '{name} gets out. That is the best that can be said. The vault seals empty, and whatever it held is locked away until the next person who can read the marks comes along.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} deciphers ward-marks on a sealed vault at {location} that has not been opened in centuries.',
      success: 'The vault gave up what it held. {name} carries knowledge and material that predates every living institution.',
      failure: '{name} escaped the vault. What it held remains sealed.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The sealed chamber at {location} is closed again, or open and collapsed â€” either way, it won\'t be opened a second time. ' +
          'What passed in that hour between seal-break and closure is part of {name} now, whether {they} wanted{s} it or not. ' +
          'Knowledge of what a vault was sealed to contain is its own kind of burden.',
        changes: [
          {
            id: 'sealed_chamber_knowledge',
            kind: 'future_hook',
            title: 'Vault Knowledge',
            detail: 'What the ancient builders sealed away â€” and why.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What weight does the god place on what {name} has seen?',
        reactions: [
          {
            id: 'sealed_chamber_ancient_intel',
            label: 'The vault\'s contents are worth understanding.',
            intent:
              'What a pre-civilizational culture sealed and preserved this carefully was not accidental. ' +
              '{name} now knows what it was, and that knowledge has implications for anyone doing the same work in this region.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Contents of the sealed vault at {location}',
                detail:
                  'A vault sealed by pre-civilizational builders containing relics and records from a culture that predates current institutions. ' +
                  'The sealing mechanism was designed for permanence, not merely security.',
                reliability: 0.75,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'sealed_chamber_mark_opener',
            label: 'Some seals were sealed for a reason.',
            intent:
              'There are systems in this world that track when sealed things are opened. ' +
              '{name} is now the person who opened this particular vault â€” a fact that certain encounter types will find significant.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'secret_knowledge',
                severity: 0.5,
                label: 'Opened a vault sealed by pre-civilizational builders â€” the opening was noted',
                revealFamilies: ['encounter.anomaly', 'investigation', 'lorekeepers_covenant'],
              },
              {
                kind: 'encounter_seed',
                encounterFamily: 'investigation',
                delayTicks: 20,
                priority: 0.9,
                seedLabel: 'The disturbance in the old vault at {location} has begun to draw interest from those who track such things',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ sunken_treasury: "The Drowned Hoard" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'encounter.anomaly.drowned_hoard',
    name: 'The Drowned Hoard',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['sunken_treasury'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'entropy',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY + 0.02,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The water near {location} is murky and slow, and {name} has been walking the bank for ten minutes ' +
          'before {they} notice{s} what\'s wrong: the shallows near the far edge have straight angles ' +
          'where the silt-banks only have curves. ' +
          'Nature doesn\'t cut corners at ninety degrees. Something built is down there. ' +
          '{?has_faction}The guild keeps records of sunken holdings from the years before the flooding. ' +
          'If this matches the catalog, the jurisdiction on salvage is complicated.{/has_faction}',
        successAfterimage:
          '{name} maps the outline: a three-room structure, one wall still standing. A treasury, based on the door placement.',
        failureAfterimage:
          'Shadows in the silt. The angles were an accident of erosion and wishful thinking.',
      },
      {
        reach: 'iron',
        duration: { min: 2, max: 2 },
        difficulty: EXTRACTION_DIFFICULTY + 0.02,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The water is four degrees above what the season should allow â€” cold enough to make hands clumsy after two minutes. ' +
          '{name} dives to the treasury door, which is corroded but structurally intact, and braces {their} feet against the doorframe. ' +
          'Something else in the water noticed the disturbance. Not something hostile, but not nothing.',
        successAfterimage:
          'The door gives with a sound that carries wrong through the water. Gold spills into the current â€” coins, ingots, the occasional piece of jewelry.',
        failureAfterimage:
          'The door holds. The current pulls {name} off-axis and {their} lungs decide the question for {them}. {they} surface{s} empty.',
      },
      {
        reach: 'iron',
        duration: { min: 1, max: 2 },
        difficulty: COMPLICATION_DIFFICULTY - 0.02,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.6, condition: 0.3, bestowed_power: 0.1 },
            tagFilters: ['#gold', '#cursed'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.15,
        },
        failureMetadata: { reputationDelta: -0.08 },
        narrativeTemplate:
          'The water changes while {name} is below the surface. ' +
          'What was still becomes a current, pulling toward the far channel where the treasury is draining into deeper water. ' +
          'The suction is not violent but it is steady, and it is accelerating.',
        successAfterimage:
          '{name} fights toward the shallows with both arms full. The treasury closes behind {them} as the channel empties. What {they} held onto is what there was.',
        failureAfterimage:
          'The current takes the hoard and {name} together. {they} surface{s} a hundred meters downstream, waterlogged and empty-handed. Alive.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} locates the sunken outline of an ancient treasury beneath the waters near {location}.',
      success: '{name} came up with the hoard. The treasury is closed now, for good.',
      failure: 'The treasury gave up nothing. {name} came up with water and the knowledge of where it is.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The water near {location} looks the same as it did before {name} went in. ' +
          'The treasury is sealed or empty. Whatever was taken comes with the history of where it spent its centuries.',
        changes: [
          {
            id: 'drowned_hoard_provenance',
            kind: 'future_hook',
            title: 'Recovered Provenance',
            detail: 'Objects taken from drowned holdings carry their history with them.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god note from the water?',
        reactions: [
          {
            id: 'drowned_hoard_cursed_weight',
            label: 'Gold from the drowned keeps its debts.',
            intent:
              'Objects preserved underwater for centuries absorb something from the circumstances of their loss. ' +
              'The people who drowned here weren\'t finished with what they owned. ' +
              '{name} carries some of that now.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'debt',
                severity: 0.35,
                label: 'Recovered goods from a drowned treasury â€” the original owners\' claims persist',
                revealFamilies: ['encounter.anomaly', 'investigation', 'entropy'],
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'drowned_hoard_observers',
            label: 'The dive was visible from the bank.',
            intent:
              'A person entering deep water and emerging carrying things is not an invisible act. ' +
              '{name}\'s dive may have been observed â€” and whoever watched had time to think about what they saw.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'investigation',
                delayTicks: 12,
                priority: 0.7,
                seedLabel: 'The salvage dive near {location} was seen by someone with an interest in sunken holdings',
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ fossil_bed: "Bones of the Old World" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'encounter.anomaly.bones_old_world',
    name: 'Bones of the Old World',
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['fossil_bed'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'time',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The rock face at {location} is mostly grey shale, cross-hatched with the usual compression layers. ' +
          'But there is a white seam that runs at the wrong angle â€” ' +
          'too regular to be mineral intrusion, too curved to be fault displacement. ' +
          '{name} brushes away the surface grit and finds a smooth radius that could only be bone. ' +
          '{?has_faction}The guild\'s scholars would pay for access to this. ' +
          'Whether {name} tells them is a separate question from whether {they} found{s} it.{/has_faction}',
        successAfterimage:
          '{name} traces the exposed section. The bone structure belongs to something much larger than anything currently living, and it has been here since before the rock layer formed around it.',
        failureAfterimage:
          'Chalk. Limestone. The shapes were geological, not biological.',
      },
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: EXTRACTION_DIFFICULTY - 0.02,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { bestowed_power: 0.4, possession: 0.3, condition: 0.3 },
            tagFilters: ['#ancient', '#time'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.10,
        },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The fossils have been in the rock so long that the surrounding matrix has crystallised around them. ' +
          'Breaking them free isn\'t excavation â€” it\'s surgery. ' +
          '{name} works the stone in thin flakes, following the crystal boundary, ' +
          'aware that the resonance still running through the bones is the remnant of something that was alive ' +
          'when the world was organised differently.',
        successAfterimage:
          '{name} frees a section intact: bone enclosed in amber-coloured crystal that still carries a faint warmth, an echo of what animated it.',
        failureAfterimage:
          'The chisel slips along the crystal boundary instead of across it. The resonance dies with a sound like a string breaking, and the fossil is rubble.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} uncovers bone-white shapes in the rock face at {location} â€” fossils from a world before the current age.',
      success: 'The bones came free intact, still carrying the resonance of what they once were.',
      failure: 'The extraction failed. The ancient lattice is rubble now.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The fossil bed at {location} holds more than what {name} found today. ' +
          'What {they} took{s} or failed to take is a small fraction of what the rock has preserved. ' +
          'But the knowledge of what creatures walked this ground before history is harder to set down.',
        changes: [
          {
            id: 'bones_old_world_knowledge',
            kind: 'future_hook',
            title: 'Pre-Historical Knowledge',
            detail: 'The size and structure of what once lived here.',
            polarity: 'info',
          },
        ],
        reactionPrompt: 'What does the god make of the old bones?',
        reactions: [
          {
            id: 'bones_old_world_catalogue',
            label: 'Record what lived here before everything else.',
            intent:
              'The fossil record is a kind of history that doesn\'t require witnesses. ' +
              '{name} carries knowledge of what the land at {location} held before the current age â€” ' +
              'large, slow, and structurally unlike anything currently living.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Fossil record at {location}: pre-historical megafauna',
                detail:
                  'Fossilised bones of creatures from before the current age, crystallised in amber-coloured matrix. ' +
                  'The resonance still present suggests these creatures had biological relationships with magical energy.',
                reliability: 0.8,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'bones_old_world_time_mark',
            label: 'The bones touched {name} as much as {they} touched{s} them.',
            intent:
              'There are systems in this world that were old when these creatures were young. ' +
              'Handling their remains creates a brief connection to that deep time â€” and leaves a trace in both directions.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'mystical_contract',
                severity: 0.2,
                label: 'Handled fossils from the pre-historical era â€” time-depth contact registered',
                revealFamilies: ['encounter.anomaly', 'lorekeepers_covenant', 'time'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ iron_seep: "The Fallen Star" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Two authored choice cards: keep the metal vs chip a fragment vs seal it back.
  {
    id: 'encounter.anomaly.fallen_star',
    name: 'The Fallen Star',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['iron_seep'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'force',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY - 0.02,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The water running from this hillside near {location} is rust-red. ' +
          'That much is not unusual for iron-bearing ground. ' +
          'What is unusual is the moss choking the depression at the source: ' +
          'dark, dense, and growing in a circle whose centre is unnaturally clear. ' +
          '{name} clears a section with one boot and the ground underneath is warm despite the morning air. ' +
          '{?has_artifact}The {artifact:any} has been behaving strangely since {name} entered this valley. Something here is answering it.{/has_artifact}',
        successAfterimage:
          '{name} brushes away the moss and finds dark metal â€” dense, cold to the touch despite the warm ground, and vibrating at a frequency just below hearing.',
        failureAfterimage:
          'Iron-rich clay seeping rust into the stream. The warmth was a thermal vent. Nothing extraordinary.',
      },
      {
        reach: 'stone',
        duration: { min: 2, max: 2 },
        difficulty: EXTRACTION_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.5, bestowed_power: 0.3, condition: 0.2 },
            tagFilters: ['#star_metal', '#fate'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.10,
        },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The crater is shallow but the metal goes deep â€” fused to bedrock by the heat of impact. ' +
          '{name} works without tools designed for this, prying at the rock around the metal ' +
          'until the underlying stone cracks and the mass can be levered free. ' +
          'It\'s heavier than iron by a third. The air around it smells of ozone ' +
          'and something else â€” distant, like the smell of cold above a mountain pass. ' +
          'Not of this earth means something specific when {name} is holding it.',
        successAfterimage:
          'The metal comes free. It sits in {name}\'s hands, cold and heavy, the vibration steady against {their} palms.',
        failureAfterimage:
          'The bedrock won\'t yield without proper equipment. {name}\'s tools are broken. The metal stays where it fell.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} follows rust-red water uphill to find a crater of iron-dense earth â€” and something buried in it that isn\'t from here.',
      success: 'The star metal comes free. It is not like any iron {name} has handled.',
      failure: 'The metal holds. The star keeps what it brought when it fell.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          '{name} stands at the edge of the crater with the star metal in hand, or with the crater still full and {their} tools broken. ' +
          'Either way, the decision about what to do with an object that fell from somewhere else is not a small one. ' +
          'The god is watching. This is the kind of moment the god watches for.',
        changes: [
          {
            id: 'fallen_star_possession',
            kind: 'item',
            title: 'Star Metal',
            detail: 'Dense, cold, vibrating. Not of this earth.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god do with what fell from above?',
        reactions: [
          {
            id: 'fallen_star_claim',
            label: 'Let {name} carry it. What falls from above belongs to whoever finds it.',
            intent:
              'The star metal will change {name} â€” not dramatically, not immediately, but the contact registers. ' +
              'Objects from outside the world\'s usual physics carry their origin with them. ' +
              'So does the agent who keeps one.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'mystical_contract',
                severity: 0.45,
                label: 'Carries star metal â€” cosmic-origin contact registered by sphere systems',
                revealFamilies: ['encounter.anomaly', 'temple_of_spheres', 'force'],
              },
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Star metal seam at {location}',
                detail:
                  'A crater containing metal of non-terrestrial origin, cold to the touch, denser than iron, ' +
                  'vibrating at a frequency below hearing. More mass may remain in the bedrock.',
                reliability: 0.95,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'fallen_star_partial',
            label: 'Chip a fragment. Leave the rest where it landed.',
            intent:
              'The crater keeps the bulk of the mass. {name} takes a small piece â€” enough to understand what it is, ' +
              'not enough to exhaust the deposit. That choice leaves something for others to find, ' +
              'and something for other interests to pursue.',
            effects: [
              {
                kind: 'encounter_seed',
                encounterFamily: 'investigation',
                delayTicks: 18,
                priority: 0.75,
                seedLabel: 'The partial excavation at the star-metal crater has drawn the attention of forge-masters and collectors',
              },
              { kind: 'reputation_tally', key: 'natural.measured_taking', delta: 1 },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'fallen_star_seal',
            label: 'Cover the crater back over. Some things should stay where they fell.',
            intent:
              'The moss returns. The rust-red water keeps running. The metal stays in the bedrock ' +
              'and the god keeps the knowledge of where it is and what it is â€” ' +
              'which is a different kind of possession.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Sealed star-metal deposit at {location}',
                detail:
                  'A covered crater containing star metal fused to bedrock. The deposit is intact and unknown to others.',
                reliability: 0.95,
              },
              { kind: 'reputation_tally', key: 'cosmic.steward_of_fallen', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ pearl_shoal: "The Moon's Tears" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  {
    id: 'encounter.anomaly.moons_tears',
    name: "The Moon's Tears",
    rarityTier: 1,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['pearl_shoal'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'spirit',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The shallows near {location} have a peculiarity that {name} takes three passes to confirm: ' +
          'the tidal rhythm is wrong. Not dramatically â€” a few minutes off, ' +
          'the water pulling back slightly earlier than the moon\'s position should allow. ' +
          'The surface has a quality like very old polished metal, refracting light at a slightly different angle than clear water does. ' +
          '{?has_title}{name} {title} has seen tidal anomalies before. This one is quieter than most.{/has_title}',
        successAfterimage:
          'The off-rhythm tide corresponds to a specific sub-surface feature: a bed of pearl-producing organisms whose growth cycle governs their own small tidal system.',
        failureAfterimage:
          'The sheen was ordinary. {name}\'s sense of the tidal timing was off. The water holds nothing unusual.',
      },
      {
        reach: 'star',
        duration: { min: 2, max: 2 },
        difficulty: EXTRACTION_DIFFICULTY,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { possession: 0.4, bestowed_power: 0.3, condition: 0.3 },
            tagFilters: ['#pearl', '#spirit'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.10,
        },
        failureMetadata: { reputationDelta: -0.05 },
        narrativeTemplate:
          'The window when the water pulls back far enough to reach the bed is brief â€” twelve minutes by {name}\'s count, ' +
          'and it won\'t repeat for another tidal cycle. ' +
          '{name} wades in to waist depth and reaches below the thermocline, ' +
          'where the water temperature drops and the visibility changes. ' +
          'The pearls are warm against cold fingers. They come free without resistance, ' +
          'as if the bed expected to give them at this specific moment.',
        successAfterimage:
          '{name} comes up with both hands full. The pearls are moon-white, warmer than the water they came from, and perfectly spherical.',
        failureAfterimage:
          'The window closes. The water surges back before {name} reaches the depth {they} need{s}. {they} retreat{s} salt-stung and empty.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} reads an unusual tidal rhythm at {location} and tracks it to a pearl bed that surfaces at a specific conjunction.',
      success: '{name} timed the tide correctly. The pearls are warm in {their} hands.',
      failure: 'The tide closed before {name} reached the bed. The conjunction won\'t repeat for a full cycle.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The shoal at {location} returns to its slow tidal rhythm. ' +
          'The pearls {name} took â€” or didn\'t take â€” are part of a larger system, ' +
          'one that measures its cycles against something larger than individual visits.',
        changes: [
          {
            id: 'moons_tears_tidal',
            kind: 'future_hook',
            title: 'Tidal Knowledge',
            detail: 'The specific timing of the pearl-bed conjunction.',
            polarity: 'gain',
          },
        ],
        reactionPrompt: 'What does the god note from the tidal visit?',
        reactions: [
          {
            id: 'moons_tears_tidal_intel',
            label: 'Record the tidal window. This can be returned to.',
            intent:
              'The conjunction that surfaces the pearl bed has a predictable cycle. ' +
              '{name} has the timing now â€” a knowledge that makes the next visit much more reliable.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Pearl-bed tidal cycle at {location}',
                detail:
                  'A pearl shoal whose access window is determined by an off-phase tidal rhythm. ' +
                  'The conjunction occurs on a predictable cycle. The bed is warm and gives without resistance during the window.',
                reliability: 0.85,
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'moons_tears_spirit_mark',
            label: 'The moon noticed {name} taking what it gives.',
            intent:
              'Spirit-sphere systems that operate on lunar cycles keep a different kind of record than material ones. ' +
              'An agent who times their actions to the moon\'s own rhythm enters a category that the spirit systems track.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'divine_favor',
                severity: 0.3,
                label: 'Harvested moon-pearls at the correct tidal conjunction â€” spirit systems registered the timing',
                revealFamilies: ['encounter.anomaly', 'temple_of_spheres', 'spirit'],
              },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },

  // â”€â”€ glowcap_hollow: "The Dreaming Light" â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Two authored choice cards: discipline vs. breathe the spores vs. seal the hollow.
  {
    id: 'encounter.anomaly.dreaming_light',
    name: 'The Dreaming Light',
    rarityTier: 2,
    intrinsicTier: 'shaping',
    reach: 'eye',
    crudType: 'read',
    scale: 'local',
    locationSubtypes: ['glowcap_hollow'],
    apCost: 1,
    actorAffinities: ['individual'],
    sphereAffinity: 'mind',
    motivations: ENCOUNTER_TYPE_MOTIVATIONS.explore,
    steps: [
      {
        reach: 'eye',
        duration: { min: 1, max: 1 },
        difficulty: DISCOVERY_DIFFICULTY + 0.02,
        failBehavior: 'continue_weakened',
        onSuccess: [],
        onFailure: [],
        narrativeTemplate:
          'The hollow at {location} is dark, and the dark is glowing. ' +
          'Not brightly â€” nothing like firelight â€” but a steady blue-green pulse from every surface, ' +
          'coming from fungal caps the size of dinner plates that cover the floor and lower walls. ' +
          'The pulse has a rhythm: three-second intervals, slightly irregular, like breathing. ' +
          '{name} stands at the entrance for a while before stepping in. ' +
          '{?has_ally}The hollow feels like the kind of place {ally:strongest} would want {them} to be cautious about. ' +
          '{name} is noting that thought and not necessarily following it.{/has_ally}',
        successAfterimage:
          '{name}\'s eyes fully adjust. The caps number in the hundreds. The light they produce has no heat source â€” it\'s chemical, metabolic, the byproduct of a digestion process {name} can\'t identify.',
        failureAfterimage:
          'Foxfire in rotting wood. The hollow was dark enough to make ordinary phosphorescence look like intention.',
      },
      {
        reach: 'veil',
        duration: { min: 2, max: 2 },
        difficulty: EXTRACTION_DIFFICULTY + 0.02,
        failBehavior: 'fail_action',
        onSuccess: [],
        onFailure: [],
        successMetadata: {
          rewardPool: {
            categoryWeights: { condition: 0.4, bestowed_power: 0.3, possession: 0.3 },
            tagFilters: ['#fungus', '#mind'],
          },
          tierPromotionEligible: true,
          reputationDelta: 0.12,
        },
        failureMetadata: { reputationDelta: -0.06 },
        narrativeTemplate:
          'The spores drift at the level of {name}\'s face: visible in the hollow\'s own light, ' +
          'small enough that {name} cannot tell if {they} {are} already breathing them. ' +
          '{name} works with {their} collar pulled up over the nose. ' +
          'The caps seal when handled correctly â€” pressure at the stem base ' +
          'before cutting, then into a vessel before the cap releases. ' +
          'The psychoactive properties that have ended three expeditions {name} has heard about ' +
          'are in the spore cloud, not the cap tissue. ' +
          'Probably.',
        successAfterimage:
          '{name} seals the last vessel. The hollow still glows. The harvest is done, and whatever {name} breathed was evidently not enough.',
        failureAfterimage:
          'One vessel doesn\'t seal in time. The spore cloud hits {name} at close range. ' +
          '{they} wake{s} several hours later at the hollow\'s entrance with no memory of leaving it.',
      },
    ],
    narrativeTemplates: {
      initiation: '{name} enters a hollow near {location} where hundreds of bioluminescent fungal caps pulse in the dark.',
      success: '{name} extracted the spore-caps without breathing the cloud. The hollow still glows.',
      failure: 'The spores won. {name} woke outside the hollow with the caps ungathered.',
    },
    aftermathConfig: {
      branchOnStep: 0,
      variants: {},
      fallback: {
        overview:
          'The hollow at {location} goes on glowing at its three-second pulse, indifferent to {name}\'s visit. ' +
          'But what {name} carries out â€” in vessels or in {their} bloodstream or simply as knowledge â€” is the god\'s to shape. ' +
          'The dreaming light is a threshold. What crosses it matters.',
        changes: [
          {
            id: 'dreaming_light_threshold',
            kind: 'future_hook',
            title: 'The Threshold',
            detail: 'What the hollow gave {name}, or tried to.',
            polarity: 'mixed',
          },
        ],
        reactionPrompt: 'What does the god do at the threshold of the dreaming light?',
        reactions: [
          {
            id: 'dreaming_light_controlled',
            label: 'The harvest is clean. The hollow keeps its secrets.',
            intent:
              '{name} extracted material value from the hollow without being changed by it. ' +
              'That is the professional choice. The hollow will continue to offer what it offers to whoever comes next.',
            effects: [
              { kind: 'reputation_tally', key: 'natural.spore_discipline', delta: 1 },
              {
                kind: 'encounter_seed',
                encounterFamily: 'investigation',
                delayTicks: 24,
                priority: 0.6,
                seedLabel: 'The glowcap hollow harvest has reached the notice of those who trade in rare alchemical reagents',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'dreaming_light_breathe',
            label: 'Let the hollow show {name} what it shows.',
            intent:
              'The spore visions are not random. The mycelial network in this hollow has been accumulating knowledge ' +
              'of what lives in its vicinity for longer than the surrounding settlement has existed. ' +
              'What {name} sees may not be comfortable, but it is specific.',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'mystical_contract',
                severity: 0.55,
                label: 'Breathed the dreaming-light spores â€” the mycelial network has registered {name}\'s mind',
                revealFamilies: ['encounter.anomaly', 'veil', 'mind', 'arcane_circle'],
              },
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Mycelial network knowledge at {location}',
                detail:
                  'The glowcap hollow\'s fungal network holds accumulated environmental memory. ' +
                  'What the spore-vision showed was specific to {name}\'s context and the hollow\'s history.',
                reliability: 0.6,
              },
              {
                kind: 'encounter_seed',
                encounterFamily: 'investigation',
                delayTicks: 15,
                priority: 0.85,
                seedLabel: 'The dreams from the spore exposure are bleeding into {name}\'s waking hours â€” and they contain something real',
              },
            ],
            closeAfterSelection: true,
          },
          {
            id: 'dreaming_light_preserve',
            label: 'The hollow is still glowing. Leave it as it is.',
            intent:
              '{name} takes nothing and disturbs nothing. The hollow continues its pulse at three-second intervals, ' +
              'unchanged, unaware of the visit in any way that matters to the mycelium. ' +
              'The god, however, knows where it is.',
            effects: [
              {
                kind: 'intelligence',
                category: 'cultural_knowledge',
                label: 'Intact glowcap hollow at {location}',
                detail:
                  'A bioluminescent fungal colony of unusual size and psychoactive potency, undisturbed. ' +
                  'The hollow pulses at three-second intervals and the spore density is significant.',
                reliability: 0.95,
              },
              { kind: 'reputation_tally', key: 'natural.restraint_observed', delta: 1 },
            ],
            closeAfterSelection: true,
          },
        ],
      },
    },
  },
];
