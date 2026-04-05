/**
 * The Healer at the Ward-Gate — a short, linear encounter.
 *
 * A wandering healer named Maret is blocked at the Thornwall Ward gate
 * by gate-warden Jorik. A sick child inside needs moonwort from the
 * shrine garden. The player-god nudges the social fabric to open the
 * gate — or fails, and the community's caution holds.
 *
 * Design doc: Docs/plans/encounters/wandering-healer-shrine-access-revised.md
 */

import type { UnifiedActionTemplate, ActionStep } from '../../types/unifiedAction';
import type {
  EncounterSupportBundle,
  EncounterSupportActorSpec,
} from '../../types/encounter';

// ─── Support Bundle ──────────────────────────────────────────────

const maretSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'maret',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['healer', 'herbalist', 'physician'],
  supportRole: 'healer',
  spawnNpcRole: 'healer',
  spawnName: 'Maret',
};

const jorikSpec: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'jorik',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  reuseNpcRoles: ['guard', 'warden', 'gatekeeper'],
  supportRole: 'warden',
  spawnNpcRole: 'guard',
  spawnName: 'Jorik',
};

const SUPPORT_BUNDLE: EncounterSupportBundle = [
  maretSpec,
  jorikSpec,
];

// ─── Step Definition ────────────────────────────────────────────

/**
 * Step 0: The Nudge.
 * Single intervention pass — the player-god leans on the social fabric
 * around the ward-gate standoff. Moderate difficulty (0.35) because the
 * community's historical caution is a real force.
 */
const step0TheNudge: ActionStep = {
  reach: 'heart',
  duration: { min: 2, max: 3 },
  difficulty: 0.35,
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The healer had been sitting on the bench outside the Thornwall gate for three ' +
    'hours when the god noticed her. Her mule stood tethered to the bench\'s iron ring, ' +
    'its panniers half-open, bundles of dried comfrey and willow-bark visible in neat rolls. ' +
    'Above her, in a second-story window, a woman held a damp cloth to a child\'s forehead. ' +
    'The gate-warden stood at his post in the alcove beside the heavy oak doors, arms folded, ' +
    'jaw set. He was a man who had buried his mother nineteen years ago because someone from ' +
    'outside the ward had brought a sickness through these same doors. The god leaned into ' +
    'the moment the way wind leans into a flame — not enough to extinguish, just enough to bend.',
};

// ─── Aftermath Config ────────────────────────────────────────────

/**
 * Linear encounter — no branching. We use aftermathConfig with
 * branchOnStep: 0 and an empty variants map so the fallback is always
 * selected, giving us curated aftermath content without needing branches.
 */
const LINEAR_AFTERMATH = {
  overview:
    'By evening, the child\'s fever had broken. Maret had ground the moonwort into ' +
    'a paste with something from her own kit and applied it to the joints where the ' +
    'bone-fever settled. The child slept. Jorik waited at the gate. When she passed ' +
    'through on her way out, he pulled it shut behind her with more force than was ' +
    'necessary, and the bolt rang like a bell in the quiet street. In the ward, Jorik ' +
    'sat in his alcove and stared at the closed gate. His mother had been kind to ' +
    'strangers. His mother had died for it.',
  changes: [
    {
      id: 'healer_departs',
      kind: 'reputation' as const,
      title: 'Maret Departs',
      detail: 'The wandering healer leaves the settlement. Her disposition toward the agent is set by the outcome.',
      polarity: 'mixed' as const,
    },
    {
      id: 'ward_policy_tested',
      kind: 'reputation' as const,
      title: 'Ward Policy Tested',
      detail: 'Thornwall Ward\'s outsider ban was either bent or held. The community remembers.',
      polarity: 'mixed' as const,
    },
    {
      id: 'child_recovers',
      kind: 'future_hook' as const,
      title: 'The Sick Child',
      detail: 'The child recovers from bone-fever — quickly if the healer got through, slowly if not.',
      polarity: 'gain' as const,
    },
  ],
} as const;

// ─── Template ────────────────────────────────────────────────────

export const WANDERING_HEALER_SHRINE_ACCESS_TEMPLATE: UnifiedActionTemplate = {
  id: 'healer.quest.wandering_healer_shrine_access',
  rarityTier: 1,
  intrinsicTier: 'background',
  name: 'The Healer at the Ward-Gate',
  reach: 'heart',
  crudType: 'update',
  scale: 'local',

  steps: [step0TheNudge],

  apCost: 1,
  essenceCost: 1,

  actorAffinities: ['individual'],
  motivations: ['mercy_ruthlessness'],

  narrativeTemplates: {
    initiation:
      'A wandering healer sits outside a locked ward-gate, waiting for something to change. ' +
      'Inside, a child is sick with bone-fever and the shrine garden holds the only moonwort ' +
      'that can treat it. The gate-warden enforces a nineteen-year-old outsider ban written ' +
      'in grief. The god notices.',
    success:
      'The social fabric bends just enough. A neighbor speaks, the warden\'s jaw works, ' +
      'the gate opens six inches. The healer gathers moonwort and treats the child. ' +
      'The ward remembers what happened.',
    failure:
      'The community\'s caution holds against the divine nudge. The healer is turned away. ' +
      'She will find moonwort elsewhere, but the child suffers longer. The ward remembers ' +
      'that a god tried to push their gate open and failed.',
  },

  supportBundle: SUPPORT_BUNDLE,

  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: { ...LINEAR_AFTERMATH },
  },
};
