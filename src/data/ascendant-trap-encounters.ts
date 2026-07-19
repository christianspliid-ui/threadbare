/**
 * Ascendant Trap Encounter (THR-605 Slice 4) — the beat a planted snare springs.
 *
 *   - encounter.trap.sprung — seeded by `sub.trap` (Plant Trap / "Hidden Snare")
 *
 * `sub.trap` plants a `plant_trap` GraphOp against a target sublocation. The
 * resolution-intercept helper `applyPlantTrap` (ascendantExpression.ts) resolves
 * the intended victim present at the sublocation (or its hex) and seeds this
 * template against them via `state.pendingEncounterSeeds`. `evaluateEncounterSeeds`
 * then spawns it as a real, self-targeting negative encounter — so the harm lands
 * through this beat's `condition`-weighted reward pools, the same consumed
 * substrate the faction governance encounters use (no bespoke harm op needed).
 *
 * Register: plainspoken baseline (THR-609) — short, concrete, no ornament. Prose
 * is written from the mortal victim's point of view; the god who set the snare is
 * never named to them (the trap is "invisible to mortal senses", per sub.trap).
 *
 * Enrichment placeholders used: `{name}` (the victim), `{location}` (the site),
 * `{?has_ally}{ally}…{/has_ally}` / `{?no_ally}…{/no_ally}` (a co-present ally).
 * See systemic wiring guide §1.
 *
 * Plan: Docs/plans/2026-07-05-six-noop-ascendant-actions.md §Content pillar
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';
import { TRAP_SPRUNG_TEMPLATE_ID } from './ascendant-expression-constants';

// ─── encounter.trap.sprung ───────────────────────────────────────────────────

export const TRAP_SPRUNG_TEMPLATE: UnifiedActionTemplate = {
  id: TRAP_SPRUNG_TEMPLATE_ID,
  name: 'The Snare Springs',
  rarityTier: 2,
  intrinsicTier: 'shaping',
  reach: 'shadow',
  crudType: 'update',
  scale: 'local',
  apCost: 1,
  actorAffinities: ['individual'],
  motivations: ['courage_prudence', 'mercy_ruthlessness'],
  narrativeTemplates: {
    initiation: 'steps wrong in a place that was waiting for them',
    success: 'they tear free before the snare can close all the way',
    failure: 'the snare closes, and there is no arguing with it',
  },
  steps: [
    {
      reach: 'shadow',
      duration: { min: 1, max: 1 },
      difficulty: 0.30,
      failBehavior: 'continue_weakened',
      onSuccess: [],
      onFailure: [],
      narrativeTemplate:
        '{name} stops. Something in {location} is wrong — the quiet has weight to it, ' +
        'and their own footing feels borrowed. They cannot name what changed, only that ' +
        'the place has been arranged around them. ' +
        '{?has_ally}{ally} is close enough to call out, if there were time to say what.{/has_ally}' +
        '{?no_ally}There is no one to warn them, and no time to be warned.{/no_ally}',
      successAfterimage: 'They shift their weight back. A hair too late, or just in time.',
      failureAfterimage: 'They take the next step. The ground was never theirs.',
    },
    {
      reach: 'shadow',
      duration: { min: 1, max: 1 },
      difficulty: 0.45,
      failBehavior: 'fail_action',
      onSuccess: [],
      onFailure: [],
      successMetadata: {
        rewardPool: { categoryWeights: { condition: 1.0 } },
      },
      failureMetadata: {
        rewardPool: { categoryWeights: { condition: 1.0 } },
        reputationDelta: -0.03,
      },
      narrativeTemplate:
        'The snare springs. It was set with care and it does exactly what it was set to do. ' +
        '{name} wrenches against it — and either the timing is theirs and they come away ' +
        'marked but moving, or it holds, and they are held with it. No one built this to be fair. ' +
        'It was built to catch whoever came, and someone did.',
      successAfterimage: 'They pull loose, breathing hard, and do not look back at the spot.',
      failureAfterimage: 'The place keeps them a while. Whatever set the snare has its answer.',
    },
  ],
};

/** Bundle spread into UNIFIED_ACTION_TEMPLATES (unified-action-templates.ts). */
export const ASCENDANT_TRAP_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[] = [
  TRAP_SPRUNG_TEMPLATE,
];
