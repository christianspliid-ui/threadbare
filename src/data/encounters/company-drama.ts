/**
 * Company drama — intra-group encounters for the THR-74 company layer (THR-733).
 *
 * The THR-74 engine shipped the drama *loop* proven by a minimal set: the
 * founding spotlight (Seeking Companions), the dissolution moment (The Parting,
 * farewell + betrayal), a fray moment, and a rivalry piece. This file completes
 * the catalogue the original Expansion D design asked for
 * (`Docs/plans/2026-03-31-social-systems-expansion-design.md`), one subject per
 * block:
 *
 *   1. The Gate Held — the sacrifice: one member stays to hold the way out.
 *
 * Remaining subjects on THR-733, unauthored here and tracked on the ticket:
 * leadership dispute, romance, the slow-burn betrayal.
 *
 * **Why these are templates and not threshold pools.** The fray and parting
 * moments fire from `groupFray.ts` on a cohesion threshold, and each one needed
 * an engine trigger. These are drawn by the *existing* group-encounter path — a
 * company at a qualifying place draws them the way it draws a delve — so the
 * subject arrives with no engine change, which is what keeps THR-733
 * content-only as its description claims.
 *
 * **Group-EXCLUSIVE, by authoring claim.** `actorAffinities: ['group']` with no
 * `'individual'`, plus `minGroupMembers`. That combination is not derivable from
 * a template's shape — "only a company may take this" is a design claim — so it
 * is declared here rather than swept by `groupEligibility.withGroupAffinity`,
 * exactly as the party-exclusive delves are. The gate is enforced on both paths
 * a template reaches an agent by (`generateUnifiedCandidates` and the
 * location-cache path's `filterByPrerequisites`).
 *
 * **Best-member substitution is the point.** `{actor}` is the member the engine
 * spotlighted for the step, and the prose is written so that the others are
 * present in every sentence the actor appears in. A company encounter whose
 * prose reads as one person acting alone would be a solo encounter wearing a
 * company's affinity.
 *
 * Register: rule zero — game prose, not novel prose. No agent history is
 * asserted anywhere: these templates mint the history, they do not presume it.
 */

import type {
  ActionStep,
  StepNudge,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import type {
  EncounterSupportActorSpec,
  EncounterSupportBundle,
} from '../../types/encounter';
import { DEFAULT_SETTING_SUPPORT_BUNDLES } from '../default-support-bundles';
import { compileOpeningEnvelope, expandSettings } from '../settingClasses';

// ─── Company-drama tuning (NFP #1 — every magic number is named) ──────

/** A company encounter needs two living members before it can be drawn. */
export const COMPANY_DRAMA_MIN_MEMBERS = 2;

/**
 * Ticks until the one who held the gate is heard of again (~13 game days).
 *
 * Sized so the seed lands well after the company has moved on and the loss has
 * stopped being the day's news — the point of the sequel is that it arrives when
 * they have started to believe the matter is closed.
 */
export const COMPANY_GATE_RETURN_DELAY_TICKS = 156;

/**
 * Standing tally the company writes to: what this company's name is worth to the
 * people who watched it leave somewhere under pressure.
 */
export const COMPANY_REPUTE_KEY = 'company.standing';
/** One step of company standing earned. */
export const COMPANY_REPUTE_GAIN = 1;
/** The same step, spent the other way. */
export const COMPANY_REPUTE_LOSS = -1;

/**
 * Severity of the mark left when a company leaves someone at a gate and does not
 * say so afterwards. Mid-range on the 0–1 scale: heavier than a rumour, lighter
 * than a betrayal, and reachable by an ordinary reveal.
 */
export const COMPANY_LEFT_BEHIND_SEVERITY = 0.5;

export const COMPANY_DRAMA_TEMPLATE_IDS = {
  gateHeld: 'encounter.company.gate_held',
} as const;

// ═════════════════════════════════════════════════════════════════════
// 1. THE GATE HELD — the sacrifice
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the company is coming out under pressure, and the way out only stays
//       open while somebody stands in it.
// Shape: Single Test · Setting: ruin + stronghold · Pressure: pursuit ·
// Form: a closing threshold · Objective: get the company clear ·
// Stakes: who walks out, and whether the company says so afterwards ·
// Step: Iron — "Hold the gate".
// Why here: a company withdrawing through a place with one usable exit.
// Connected systems (Q8): cast, conditions, reputation, rewards, seeds — five,
// against a quota of three.
// Choice: none at the step. The fork is in the aftermath reaction — whether the
// company carries the name out with them or walks on quiet.
// Promise → payoff: the gate is stated as the only way out in the opening; the
// step answers who is still on the near side of it when it shuts.

/**
 * The thing pressing them. Cast as a materializing actor rather than inherited
 * scenery, because the aftermath writes a mark that has to land on somebody who
 * exists: an inherited bind-only default would put it on whichever ambient
 * figure happened to stand there, and on nobody at all otherwise (the THR-1165
 * lesson, learned on the bridge keeper).
 */
const PURSUIT_LEAD_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'pursuit_lead',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  supportRole: 'pursuit_leader',
  spawnNpcRole: 'raider',
  spawnName: 'The One Who Came Through First',
};

/**
 * Composed, not replaced: the setting families keep their own ambient cast and
 * the scene adds the one figure it needs to name.
 */
const GATE_SUPPORT_BUNDLE: EncounterSupportBundle = [
  ...DEFAULT_SETTING_SUPPORT_BUNDLES.ruin,
  PURSUIT_LEAD_SPEC,
];

const GATE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — the common option. Acts on the company, not the gate.
    id: 'company.gate.shoulder_to_shoulder',
    name: 'Shoulder to Shoulder',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine:
      'You close the spacing between them, so the ones behind arrive before the gap opens. A small help.',
    fiction: 'Nobody stands in that gateway alone.',
    bandProse: {
      success: 'They fought the width of the gate, not the width of one person.',
      near_miss: 'The spacing held. The gate was still wider than the company was.',
    },
  },
  {
    // Type: Boost — force, acting on the structure rather than the people.
    id: 'company.gate.brace_the_hinge',
    name: 'Brace the Hinge',
    sphere: 'force',
    essenceCost: 2,
    forecastDelta: 0.1,
    imageTag: 'generic.strength',
    effectLine:
      'You take the strain off the failing hinge, so the gate answers a push it should not survive. A real help.',
    fiction: 'Old iron, asked for one more.',
    bandProse: {
      critical_success: 'The hinge turned like new work, and the gate came round in one movement.',
      failure: 'The hinge held longer than it had any right to. The gateway was lost anyway.',
    },
  },
  {
    // Type: Boost — order, acting on the promise rather than the body.
    id: 'company.gate.hold_the_line',
    name: 'Hold the Line',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.oath',
    effectLine:
      'You steady the word they gave each other, so nobody breaks first. A real help.',
    fiction: 'Said once, at the start. Still standing.',
    bandProse: {
      success_at_cost: 'Nobody broke. The line simply ran out of people before it ran out of will.',
      critical_failure: 'The word they gave each other was the last thing to go.',
    },
  },
  {
    // Type: Boost — life, buying the body more than it has.
    id: 'company.gate.second_breath',
    name: 'Second Breath',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.vigor',
    effectLine:
      'You find them air they had already spent, so the arms come up one more time. A real help.',
    fiction: 'The lungs get one more.',
    bandProse: {
      success: 'The arms came up again past the point where they had stopped coming up.',
      near_miss: 'The breath arrived. It was not the breath that decided it.',
    },
  },
  {
    // Type: Boost — darkness, working on what the pursuit can see.
    id: 'company.gate.the_dark_behind',
    name: 'The Dark Behind',
    sphere: 'darkness',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.dark',
    effectLine:
      'You thicken the dark past the gateway, so the pursuit cannot count how few are left. A small help.',
    fiction: 'Let them guess at the number.',
    bandProse: {
      success: 'The pursuit came on carefully, against a company it could not count.',
      failure: 'The dark bought a few seconds. The gateway needed longer than that.',
      critical_failure: 'They came through the dark faster than anyone had planned for.',
    },
  },
];

const GATE_STEP: ActionStep = {
  reach: 'iron',
  duration: { min: 1, max: 2 },
  difficulty: 0.45,
  purposeLine: 'Hold the gate',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The gateway is a stone arch with one leaf of the door still hanging, and it is the ' +
    'only way back to open ground. Behind the company the passage runs straight for forty ' +
    'paces, which is long enough to be seen coming down and short enough to be crossed. ' +
    '{actor} takes the arch and sets their feet where the flagstones are dry. The others ' +
    'go past at a run, one hand each on {actor}\'s shoulder as they pass, and none of them ' +
    'says the thing they are all counting.',
  successAfterimage:
    'The company came through the arch together, and the gate shut on an empty passage.',
  failureAfterimage:
    'The arch was carried before the company was clear, and they came out of it scattered.',
  successAtCostAfterimage:
    'The company reached open ground. {actor} did not come out with them.',
  criticalSuccessAfterimage:
    'They held the arch until the pursuit stopped spending people on it, and walked out whole.',
  criticalFailureAfterimage:
    'The arch went in the first rush, and what the company left behind it was not only {actor}.',
  nudges: GATE_HAND,
};

export const COMPANY_GATE_HELD: UnifiedActionTemplate = {
  id: COMPANY_DRAMA_TEMPLATE_IDS.gateHeld,
  rarityTier: 3,
  intrinsicTier: 'shaping',
  name: 'The Gate Held',
  reach: 'iron',
  crudType: 'read',
  scale: 'local',
  steps: [GATE_STEP],
  apCost: 1,
  // Group-EXCLUSIVE: the authoring claim, not a swept affinity. A company of one
  // cannot have a rearguard, which is the whole subject.
  actorAffinities: ['group'],
  minGroupMembers: COMPANY_DRAMA_MIN_MEMBERS,
  motivations: ['courage_prudence', 'loyalty_ambition'],
  settings: ['ruin', 'stronghold'],
  openings: {
    ruin:
      'The company came in through a breach and found the breach shut behind them, which ' +
      'leaves the old gate arch at the far end and nothing else. Something has been coming ' +
      'up the passage since the second turning, unhurried, in no danger of losing them. The ' +
      'arch is wide enough for two abreast and no wider.',
    stronghold:
      'The muster yard empties through one gate, and the gate is the wrong width for the ' +
      'number of people trying to use it. The company has the yard for as long as the yard ' +
      'stays theirs. Somebody is already at the far wall, working out how few of them there ' +
      'are and how tired.',
  },
  locationSubtypes: expandSettings(['ruin', 'stronghold']),
  supportBundle: GATE_SUPPORT_BUNDLE,
  traitVariants: [
    {
      // Being True, the arch is a thing they said they would do, and a rearguard
      // is mostly the refusal to revise that once the passage fills up.
      traitId: 'trait.core.core_integrity.virtue',
      forecastDelta: 0.05,
      factorLine: 'Being True, they hold ground they already said they would hold.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The company is on open ground with the arch behind them and the passage quiet. ' +
        'They count heads out of habit and then stop counting, because the number is the ' +
        'number. What happens next is whether they carry the name out of here with them or ' +
        'walk on and let the place keep it.',
      changes: [],
      reactions: [
        {
          id: 'company.gate.say_the_name',
          label: 'Say the name',
          intent: 'The company names who held the arch, out loud, before it moves.',
          effects: [
            { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_GAIN },
          ],
        },
        {
          id: 'company.gate.walk_on_quiet',
          label: 'Walk on quiet',
          intent: 'The company moves off without saying it. Somebody else will, later.',
          effects: [
            // A company that leaves someone at a gate and does not say so is
            // doing a thing that can be found out. The mark anchors to the
            // pursuit lead, who is a cast actor the template declares and the
            // world instantiates — the one party who was there and lived to
            // describe the arithmetic.
            {
              kind: 'hidden_mark',
              category: 'concealed_action',
              severity: COMPANY_LEFT_BEHIND_SEVERITY,
              label: 'Came out of the ruin fewer than they went in, and said nothing',
              targetAgentId: '$cast:pursuit_lead',
              revealFamilies: ['investigation'],
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'The pursuit spent four people on the arch and then stopped spending them. The ' +
            'company came out through the gate at a walk, in order, with {actor} last and ' +
            'unhurried. The one who came through the passage first watched them go and did ' +
            'not follow. That is the version that gets told, and for once it is the version ' +
            'that happened.',
          changes: [
            {
              id: 'company.gate.the_arch_holds',
              kind: 'trait',
              title: 'Held the Arch',
              causeClause: 'They held a two-wide gateway until the pursuit stopped paying for it',
              detail:
                'The company walks off knowing what it is worth in a doorway, and it shows in how they take the next one.',
              polarity: 'gain',
              category: 'boon',
              direction: 'gain',
              stateNoun: {
                text: 'inspired',
                entityId: 'trait.condition.inspired',
                visualKind: 'attachment',
              },
              concepts: [{ text: 'what it is worth in a doorway' }],
            },
          ],
          reactions: [
            {
              id: 'company.gate.walk_out_together',
              label: 'Walk out together',
              intent: 'Nobody was left. The company goes on with its number intact.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_GAIN },
                { kind: 'condition_attachment', templateId: 'trait.condition.inspired' },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            'The company is out. {actor} is not, and the arch is shut, and the passage on ' +
            'the other side of it has gone quiet in the way that answers the question. They ' +
            'stand on the open ground for longer than they need to before somebody says it ' +
            'is time to move.',
          changes: [
            {
              id: 'company.gate.one_short',
              kind: 'trait',
              title: 'One Short',
              causeClause: 'The gate shut with {actor} on the wrong side of it',
              detail:
                'The company walks with a gap in it, and the ones who came out did not come out clean.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              // The shipped condition vocabulary carries no grief state, and a
              // chip may only name a state the engine actually writes (Law 56).
              // So the chip claims the injury the rearguard action really cost
              // them, and the grief stays in the overview, where scene facts
              // belong and nothing is claimed of the engine.
              stateNoun: {
                text: 'wounded',
                entityId: 'trait.condition.wounded',
                visualKind: 'attachment',
              },
              concepts: [{ text: 'a gap in it' }],
            },
          ],
          reactions: [
            {
              id: 'company.gate.go_back_for_them',
              label: 'Go back for them',
              intent: 'The arch is shut. That is not the same as certain.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.wounded' },
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.gateHeld,
                  delayTicks: COMPANY_GATE_RETURN_DELAY_TICKS,
                  seedLabel: 'Word of who came back out of that ruin',
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            'The arch was carried while half the company was still in the passage, and what ' +
            'came out came out in ones and twos over the next hour, by ways nobody had ' +
            'planned to use. They find each other on the open ground by walking until they ' +
            'do. Everybody is accounted for and nobody is pleased about how.',
          changes: [
            {
              id: 'company.gate.scattered',
              kind: 'trait',
              title: 'Scattered',
              causeClause: 'The gateway went while the company was still coming through it',
              detail:
                'They came out by separate ways and spent the night finding each other. The legs will do tomorrow and say so.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'exhausted',
                entityId: 'trait.condition.exhausted',
                visualKind: 'attachment',
              },
              concepts: [{ text: 'by separate ways' }],
            },
          ],
          reactions: [
            {
              id: 'company.gate.regroup',
              label: 'Regroup and move',
              intent: 'Everyone is out. The order they came out in is a thing to fix later.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_LOSS },
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'The arch went in the first rush and the passage did the rest. The company that ' +
            'reaches open ground is smaller than the one that went in, and it is not only ' +
            '{actor} missing from it. The one who came through first is still counting them ' +
            'from the gateway, out loud, so the ones walking away can hear the number.',
          changes: [
            {
              id: 'company.gate.the_number',
              kind: 'trait',
              title: 'The Number',
              causeClause: 'The gateway went in the first rush and took more than the rearguard',
              detail:
                'The company knows exactly how many it is now, and it slows at the next doorway it has to use.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'terrified',
                entityId: 'trait.condition.terrified',
                visualKind: 'attachment',
              },
              concepts: [{ text: 'the next doorway it has to use' }],
            },
          ],
          reactions: [
            {
              id: 'company.gate.carry_what_is_left',
              label: 'Carry what is left',
              intent: 'The ones still walking keep walking, and carry the rest as far as they can.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_LOSS },
                { kind: 'condition_attachment', templateId: 'trait.condition.terrified' },
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.gateHeld,
                  delayTicks: COMPANY_GATE_RETURN_DELAY_TICKS,
                  seedLabel: 'The count that came out of that gateway',
                },
              ],
            },
          ],
        },
      },
    },
  },
  narrativeTemplates: {
    initiation:
      'A company comes out of a place under pressure, and the way out is one arch wide.',
    success: 'The gateway held long enough, and the company came through it together.',
    failure: 'The gateway was carried early, and the company came out of it in pieces.',
  },
  description:
    'A company is withdrawing through the only usable exit, and the exit stays open for '
    + 'exactly as long as somebody stands in it. One member takes the arch while the rest go '
    + 'past. A god can lean on the arch, on the arms holding it, or on what the pursuit is '
    + 'able to see — and fate decides who is on which side when it shuts.',
};

/**
 * Every company-drama template, in authoring order.
 *
 * THR-932: `compileOpeningEnvelope` turns each template's authored `openings`
 * table into the `opening` context-fragment set the prose layer actually
 * renders. A template that authors openings and skips this compiles no fragment
 * set, so the opening is data nothing reads — pinned by
 * `settingClasses.test.ts`.
 */
export const COMPANY_DRAMA_TEMPLATES: readonly UnifiedActionTemplate[] = [
  COMPANY_GATE_HELD,
].map(compileOpeningEnvelope);
