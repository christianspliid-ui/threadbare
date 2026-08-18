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
 *   2. Two Roads Named — the leadership dispute: two of them have named
 *      different ways, and the company is standing still while they settle it.
 *   3. The Third Watch — the romance: two of them have become something to
 *      each other, and the company has to decide what that is to the company.
 *   4. The Quiet Offer — the betrayal: somebody is buying, and one of them is
 *      being asked, and the first thing asked for is small.
 *
 * **Why the betrayal is told from inside it.** The other three subjects can put
 * the company on one side and a situation on the other. This one cannot: its
 * subject is a *member*, and the aftermath vocabulary has no sentinel for "a
 * different member of the actor's company" — `$actor`, `$target` and
 * `$cast:<key>` are the whole set. Anchoring the betrayer to a materialized
 * cast NPC would make them an outsider and turn `actorAffinities: ['group']`
 * back into decoration, which is the trap subject 3 recorded. So `{actor}` is
 * the one being asked, every consequence anchors to the actor by default, and
 * the company is what is being sold rather than what is watching.
 *
 * **What this subject does not promise.** The `betrayal` mark minted below is now
 * a real dissolution producer — `findCompanyBetrayer` (THR-1174) ends a company
 * *already below the fray line* as a betrayal, told in its own parting register.
 * Even so, no band here claims that ending: the mark is the cause, and whether it
 * proves fatal is the engine's call from cohesion. A company still holding
 * survives its betrayer, and the mark decays out of range in roughly fifty ticks,
 * so what this subject sells is the slow burn — marks, bonds and seeds — never a
 * guaranteed collapse. (When this file was written the union member had a
 * consumer and no producer at all; THR-1174 closed that loop from the engine side.)
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

/**
 * Ticks until a badly-settled road comes back up (~5 game days).
 *
 * Much shorter than the gate's sequel delay, and for the opposite reason: a
 * dispute that was closed rather than settled does not need time to travel, it
 * needs the next fork. Five days is about one leg of a march.
 */
export const COMPANY_DISPUTE_RETURN_DELAY_TICKS = 60;

/**
 * Severity of the mark left when a company argues about its own direction where
 * strangers can hear it. Low on the 0–1 scale: a company that cannot name its
 * own road is worth remarking on, but it is gossip rather than a crime.
 */
export const COMPANY_DISPUTE_HEARD_SEVERITY = 0.3;

/**
 * Ticks until an unnamed pairing comes back up (~7 game days).
 *
 * Between the dispute's five days and the gate's thirteen, and for a reason
 * that is neither of theirs: this is not travelling news and it is not the next
 * fork, it is the next time the company has to decide who goes back for whom.
 * A week is about how long a company can run a watch list before the same
 * question is standing in front of it again.
 */
export const COMPANY_ROMANCE_RETURN_DELAY_TICKS = 84;

/**
 * Sentiment the company earns with the one who heard them say it plainly.
 * Modest and positive: this is a good opinion formed in one evening, not a
 * friendship, and the trust step is deliberately the smaller of the two because
 * hearing somebody be honest is evidence about their honesty and not yet about
 * their reliability.
 */
export const COMPANY_OATH_WITNESS_SENTIMENT = 0.2;
/** The same evening, read as a smaller step toward being counted on. */
export const COMPANY_OATH_WITNESS_TRUST = 0.15;

/**
 * Severity of the mark left when a company is seen to carry a loyalty it will
 * not name. Just above the dispute's gossip and well below the gate's
 * abandonment: a company keeping something quiet about its own is more than a
 * remark and less than a wrong done to anybody.
 */
export const COMPANY_UNSAID_SEVERITY = 0.35;

/**
 * Ticks until a refused buyer tries again (~10 game days).
 *
 * Longer than the romance's week and shorter than the gate's thirteen days, for
 * a reason belonging to neither: a buyer who was turned down is not waiting for
 * news to travel or for the next fork, they are waiting for the company to be in
 * worse shape than it was. Ten days is about how long that takes to become
 * visible from outside.
 */
export const COMPANY_OFFER_RETURN_DELAY_TICKS = 120;

/**
 * Severity of the mark left when a member of a company sells the company.
 *
 * The heaviest in this file by a clear step — above the gate's abandonment
 * (0.5), which is a thing done in the open under pressure and survivable in the
 * telling. This is the only one of the four subjects where the member acts
 * against the company on purpose and arranges for it not to be known, and the
 * severity is what makes it findable by an ordinary reveal rather than needing
 * a lucky one.
 */
export const COMPANY_SOLD_SEVERITY = 0.65;

/**
 * Severity of the mark the buyer carries away when the refusal itself taught
 * them something. Low: what a company will not sell is a smaller fact than what
 * it would, and this is a stranger's inference rather than anybody's admission.
 */
export const COMPANY_READ_OFF_SEVERITY = 0.25;

/**
 * What the buyer thinks of a member who heard the whole offer and walked it
 * straight back to the company. Negative on both counts and unequal: a buyer
 * dislikes being refused, but what they actually revise is whether this person
 * can be worked with again, so the trust step is the larger of the two.
 */
export const COMPANY_BUYER_SENTIMENT = -0.2;
/** The same conversation, read as the larger correction to "can be approached". */
export const COMPANY_BUYER_TRUST = -0.3;

export const COMPANY_DRAMA_TEMPLATE_IDS = {
  gateHeld: 'encounter.company.gate_held',
  twoRoadsNamed: 'encounter.company.two_roads_named',
  thirdWatch: 'encounter.company.third_watch',
  quietOffer: 'encounter.company.quiet_offer',
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

// ═════════════════════════════════════════════════════════════════════
// 2. TWO ROADS NAMED — the leadership dispute
// ═════════════════════════════════════════════════════════════════════
//
// Crux: the company has to move, and two of them have named different ways,
//       and the company is standing still while they settle it.
// Shape: Single Test · Setting: wayside + rural · Pressure: a decision that
// cannot be deferred (the light is going) · Form: a fork · Objective: the
// company leaves as one company · Stakes: whether it keeps its shape ·
// Step: Gold — "Settle the road".
// Why here: a company at a fork with daylight running out.
// Connected systems (Q8): cast, rewards, seeds, conditions, reputation — five,
// against a quota of three.
// Choice: none at the step. The fork is in the aftermath reaction — whether the
// company settles the say now or carries the question to the next fork.
// Promise → payoff: the opening states that the light has an hour in it and the
// road is unnamed; the step answers which road, and at what price to the shape
// of the company.
//
// **Why Gold and not Heart.** The subject is who the company will follow, which
// is standing and influence — the Patron ↔ Extractor axis, where winning the
// road either leads the company or takes it. Heart is the bond itself, and is
// reserved for this file's romance subject.

/**
 * Somebody else at the wayside, and the reason this scene has a cast at all: a
 * company that argues about its own direction in the open has been *heard*, and
 * the aftermath's mark needs a party who was there. Materializing rather than
 * inherited, for the THR-1165 reason — an inherited bind-only default lands the
 * mark on whatever ambient figure happens to exist, and on nobody otherwise.
 */
const WAYSIDE_WITNESS_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'wayside_witness',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  supportRole: 'wayside_witness',
  reuseNpcRoles: ['wanderer', 'merchant'],
  spawnNpcRole: 'wanderer',
  spawnName: 'Someone Camped at the Same Fork',
};

/** Composed, not replaced — the wayside keeps its own ambient cast. */
const DISPUTE_SUPPORT_BUNDLE: EncounterSupportBundle = [
  ...DEFAULT_SETTING_SUPPORT_BUNDLES.wayside,
  WAYSIDE_WITNESS_SPEC,
];

const DISPUTE_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — the common option. Acts on the exchange, not the argument.
    id: 'company.dispute.hear_it_out',
    name: 'Hear It Out',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine:
      'You slow the exchange so each of them finishes a sentence before the other starts. A small help.',
    fiction: 'Let the man finish.',
    bandProse: {
      success: 'They got through it without talking over each other, which was most of it.',
      near_miss: 'Both of them were heard. Being heard was not the thing in short supply.',
    },
  },
  {
    // Type: Boost — order, acting on the arrangement rather than the merits.
    id: 'company.dispute.whose_say_it_is',
    name: 'Whose Say It Is',
    sphere: 'order',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.oath',
    effectLine:
      'You surface the arrangement they already agreed to, so who decides stops being the open question. A real help.',
    fiction: 'Somebody has the say. That was settled before this.',
    bandProse: {
      success: 'Somebody had the say, and once that was in the open the road took a minute.',
      failure: 'The arrangement was clear. Neither of them liked what it said, so it decided nothing.',
    },
  },
  {
    // Type: Boost — mind, moving the argument onto the ground it is about.
    id: 'company.dispute.read_the_ground',
    name: 'Read the Ground',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.memory',
    effectLine:
      'You sharpen what each of them remembers of the country ahead, so the argument runs on the ground instead of on pride. A real help.',
    fiction: 'The ridge this month is not the ridge they are picturing.',
    bandProse: {
      critical_success: 'The ground settled it. Once they were arguing about the country, they stopped arguing.',
      near_miss: 'They agreed on the country exactly. They still did not agree on the road.',
    },
  },
  {
    // Type: Boost — spirit, measuring the road against the purpose.
    id: 'company.dispute.what_they_are_for',
    name: 'What They Are For',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.warmth',
    effectLine:
      'You raise the thing the company came out here to do, so the road gets measured against it. A real help.',
    fiction: 'They did not come out here for a road.',
    bandProse: {
      success_at_cost: 'The purpose picked the road. It did not do anything for the one who lost.',
      failure: 'They remembered what they were for, and each of them heard his own road in it.',
    },
  },
  {
    // Type: Boost — light, acting on what is unstated rather than what is said.
    id: 'company.dispute.say_the_real_reason',
    name: 'Say the Real Reason',
    sphere: 'light',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.light',
    effectLine:
      'You bring the unstated reason into the open, whichever of them is carrying it. A small help.',
    fiction: 'One of them wants the road for what is on it.',
    bandProse: {
      critical_success: 'The real reason came out early and turned out to be a small one, and it went easier after that.',
      critical_failure: 'The real reason came out, and it was not small, and there was no walking it back.',
    },
  },
];

const DISPUTE_STEP: ActionStep = {
  reach: 'gold',
  duration: { min: 1, max: 2 },
  difficulty: 0.42,
  purposeLine: 'Settle the road',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The map is weighted down on a flat stone, a knife on one corner and somebody\'s cup on ' +
    'the other, and the tea in the cup has gone cold. {actor} has named the river road. The ' +
    'other one named the ridge, named it first, and has not moved off it since. The rest of ' +
    'the company has stopped pretending to be busy and stands in a loose ring around the ' +
    'stone, and the light has about an hour left in it.',
  successAfterimage:
    'The company took one road, and took it together.',
  failureAfterimage:
    'The company camped where it stood, and the road was still unnamed in the morning.',
  successAtCostAfterimage:
    'The company took a road. {actor} walked it a long way without speaking.',
  criticalSuccessAfterimage:
    'They settled it in the open, in front of everyone, and the company came out of it steadier than it went in.',
  criticalFailureAfterimage:
    'The company took two roads.',
  nudges: DISPUTE_HAND,
};

export const COMPANY_TWO_ROADS_NAMED: UnifiedActionTemplate = {
  id: COMPANY_DRAMA_TEMPLATE_IDS.twoRoadsNamed,
  rarityTier: 3,
  intrinsicTier: 'shaping',
  name: 'Two Roads Named',
  reach: 'gold',
  crudType: 'read',
  scale: 'local',
  steps: [DISPUTE_STEP],
  apCost: 1,
  // Group-EXCLUSIVE: the authoring claim, not a swept affinity. A company of one
  // has nobody to disagree with, which is the whole subject.
  actorAffinities: ['group'],
  minGroupMembers: COMPANY_DRAMA_MIN_MEMBERS,
  motivations: ['loyalty_ambition', 'courage_prudence'],
  settings: ['wayside', 'rural'],
  openings: {
    wayside:
      'The track divides about thirty paces past the camp, and the company has been packed ' +
      'and ready to move for most of an hour. Two of them are still at the map. The rest ' +
      'have put their loads back down, which is the part that matters, because a company ' +
      'that has put its loads down twice does not pick them up as fast the third time.',
    rural:
      'The hamlet has one street and it ends in a fork, and the company has eaten through ' +
      'whatever welcome it had here. Two of them are working out which arm of the fork, ' +
      'loudly enough that the woman shuttering the near window has stopped shuttering it. ' +
      'The road out is the same either way for the first mile, which is not helping.',
  },
  locationSubtypes: expandSettings(['wayside', 'rural']),
  supportBundle: DISPUTE_SUPPORT_BUNDLE,
  traitVariants: [
    {
      // Being Humble is precisely the capacity to lose this argument without
      // treating the loss as a wound — which is what makes the road settle.
      traitId: 'trait.core.core_humility.virtue',
      forecastDelta: 0.05,
      factorLine: 'Being Humble, they can lose the argument without losing the road.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The map is off the stone and the cup has been emptied into the grass. Whichever way ' +
        'the company is about to walk, the question underneath it — who names the road when ' +
        'the road is not obvious — is still sitting there. It can be settled now, while ' +
        'everyone is present and it is only about a road, or it can be carried to the next fork.',
      changes: [],
      reactions: [
        {
          id: 'company.dispute.settle_the_say',
          label: 'Settle the say',
          intent: 'The company decides who names the road, out loud, before it walks.',
          effects: [
            { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_GAIN },
          ],
        },
        {
          id: 'company.dispute.carry_it_to_the_next_fork',
          label: 'Carry it to the next fork',
          intent: 'Nobody wants the second argument tonight. It keeps.',
          effects: [
            // A question carried is a question that arrives again, and the seed
            // is what makes "movement dissent" a thing the world does rather
            // than a thing the prose asserts.
            {
              kind: 'encounter_seed',
              templateId: COMPANY_DRAMA_TEMPLATE_IDS.twoRoadsNamed,
              delayTicks: COMPANY_DISPUTE_RETURN_DELAY_TICKS,
              seedLabel: 'The same question, at the next fork',
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'It took eleven minutes and ended with the one who named the ridge folding the map ' +
            'himself and handing it over. Nobody had to be talked round in private afterwards. ' +
            'The company picked its loads up and was walking inside the hour, and the person ' +
            'camped at the same fork watched the whole thing and did not hear a raised voice.',
          changes: [
            {
              id: 'company.dispute.the_say_settled',
              kind: 'trait',
              title: 'The Say Settled',
              causeClause: 'They named the road in the open and nobody had to be handled afterwards',
              detail:
                'The company knows who decides when the map is ambiguous, and it will move faster at the next fork for knowing it.',
              polarity: 'gain',
              category: 'boon',
              direction: 'gain',
              stateNoun: {
                text: 'inspired',
                entityId: 'trait.condition.inspired',
                visualKind: 'attachment',
              },
              concepts: [{ text: 'who decides when the map is ambiguous' }],
            },
          ],
          reactions: [
            {
              id: 'company.dispute.walk_it',
              label: 'Walk it',
              intent: 'The road is named and the light is going. The company moves.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_GAIN },
                { kind: 'condition_attachment', templateId: 'trait.condition.inspired' },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            'The company is on the river road, which is the road {actor} named, and has been ' +
            'on it for three hours. The one who named the ridge is walking at the back of the ' +
            'column where he does not usually walk. Nothing was said that has to be taken ' +
            'back. That is not the same as nothing having happened.',
          changes: [
            {
              id: 'company.dispute.carried_quiet',
              kind: 'trait',
              title: 'Carried Quiet',
              causeClause: 'The road was decided against him in front of the whole company',
              detail:
                'A full day\'s march on a road he argued against, taken at the back of the column. The legs will say so tomorrow.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              // The live condition vocabulary carries no word for swallowed
              // resentment, and a chip may only name a state the engine writes
              // (Law 56). So the chip claims the march — which is real and was
              // really taken badly — and the resentment stays in the overview,
              // where scene facts belong and nothing is claimed of the engine.
              stateNoun: {
                text: 'exhausted',
                entityId: 'trait.condition.exhausted',
                visualKind: 'attachment',
              },
              concepts: [{ text: 'at the back of the column' }],
            },
          ],
          reactions: [
            {
              id: 'company.dispute.let_him_walk_it_off',
              label: 'Let him walk it off',
              intent: 'It is a road, not a grievance. Give it a day.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.twoRoadsNamed,
                  delayTicks: COMPANY_DISPUTE_RETURN_DELAY_TICKS,
                  seedLabel: 'The ridge, brought up again',
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            'The light went while they were still on it, so the company is camped thirty ' +
            'paces short of the fork it was going to take, which is the worst available place ' +
            'to camp and everybody knows it. The loads are down. The map is still on the ' +
            'stone. In the morning this starts from the beginning.',
          changes: [
            {
              id: 'company.dispute.camped_on_the_question',
              kind: 'trait',
              title: 'Camped on the Question',
              causeClause: 'Neither road was named before the light went',
              detail:
                'A day spent standing at a fork, and a night camped where nobody wanted to camp. The company starts tomorrow already behind.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              stateNoun: {
                text: 'exhausted',
                entityId: 'trait.condition.exhausted',
                visualKind: 'attachment',
              },
              concepts: [{ text: 'already behind' }],
            },
          ],
          reactions: [
            {
              id: 'company.dispute.camp_and_start_again',
              label: 'Camp, and start again at first light',
              intent: 'Nothing is getting decided tonight. Put it down properly.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_LOSS },
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.twoRoadsNamed,
                  delayTicks: COMPANY_DISPUTE_RETURN_DELAY_TICKS,
                  seedLabel: 'The fork, in the morning',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'Both roads were taken. The ridge party went up at first light without a great ' +
            'deal of discussion about it, and what is on the river road now is a smaller ' +
            'company than the one that stopped here. Neither half has said the word for what ' +
            'this is. The person camped at the same fork saw which way each of them went, and ' +
            'what this company\'s name is worth is now being carried down two roads by people ' +
            'who are not speaking to each other.',
          changes: [
            {
              // Reports the seed, not the standing move. The reaction does write
              // a `reputation_tally`, but that number renders only in the
              // designer's TalliesDebugTab — a chip reporting it would claim a
              // quantity the player cannot inspect (Law 13 parity), so the
              // standing sentence lives in the overview above and the chip
              // reports the opening the engine will actually act on: word of the
              // other half, planted and coming back.
              id: 'company.dispute.two_roads',
              kind: 'future_hook',
              title: 'Two Roads',
              causeClause: 'The company could not name one road, so it took both',
              detail:
                'The one camped at the same fork watched both halves choose, and word of which way the other half went will reach whoever is still on the river road.',
              polarity: 'loss',
              category: 'path',
              direction: 'loss',
              // Anchored to the witness rather than to the seed. A seed has no
              // node to open until it fires, so it cannot be the referent — but
              // the band's reaction writes a `hidden_mark` **onto this cast
              // member**, which makes them the object the ending actually wrote
              // and the one thing on this chip a player can open (Law 56
              // clause 2). `$cast:` resolves against the declared support key.
              concepts: [
                {
                  text: 'The one camped at the same fork',
                  entityId: '$cast:wayside_witness',
                  visualKind: 'agent',
                  visualName: 'Someone Camped at the Same Fork',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'company.dispute.take_the_river_road',
              label: 'Take the river road',
              intent: 'The ones still here are still here. Walk, and count later.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_LOSS },
                // A company that came apart at a fork in front of a stranger is
                // doing a thing that can be found out. The mark anchors to the
                // wayside witness — a cast actor this template declares and the
                // world instantiates — who watched both halves choose.
                {
                  kind: 'hidden_mark',
                  category: 'concealed_action',
                  severity: COMPANY_DISPUTE_HEARD_SEVERITY,
                  label: 'Came to a fork as one company and left it as two',
                  targetAgentId: '$cast:wayside_witness',
                  revealFamilies: ['investigation'],
                },
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.twoRoadsNamed,
                  delayTicks: COMPANY_DISPUTE_RETURN_DELAY_TICKS,
                  seedLabel: 'Word of which way the other half went',
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
      'A company has to move, and two of them have named different roads.',
    success: 'The road got named, and the company walked it as one company.',
    failure: 'The road did not get named, and the company paid for the hour.',
  },
  description:
    'A company is standing at a fork with the light going, and two of its members have named '
    + 'different roads and neither has moved. The argument is about a road and it is not about '
    + 'a road. A god can lean on how they hear each other, on the arrangement they already '
    + 'made, on the country ahead, on what the company is for, or on the reason one of them '
    + 'is not saying — and fate decides whether the company leaves here as one company.',
};

// ═════════════════════════════════════════════════════════════════════
// 3. THE THIRD WATCH — the romance
// ═════════════════════════════════════════════════════════════════════
//
// Crux: two of the company have become something to each other, everybody can
//       see it, and nobody has said it — and a company that travels armed runs
//       on knowing who will go back for whom.
// Shape: Single Test · Setting: urban + sacred · Pressure: an open secret ·
// Form: a thing said or not said · Objective: settle what the pair is to the
// company · Stakes: whether the company reorganises honestly or carries a
// loyalty it will not name · Step: Heart — "Settle what they are".
// Why here: downtime, under a roof, which is the only place this gets said.
// Connected systems (Q8): cast, rewards, seeds, conditions, reputation — five,
// against a quota of three, as the gate counts them. The `bond_change` on the
// good bands is a sixth real write and is deliberately not claimed as a sixth
// system: `check:encounter` does not score it, and a comment that counts higher
// than the gate is the kind of drift nobody re-measures.
// Choice: none at the step. The fork is in the aftermath reaction — whether the
// company writes the pairing into how it works, or leaves the list as it is.
// Promise → payoff: the opening states that the watch list has come out the same
// way for days and that somebody wrote it; the step answers whether the company
// gets to know why.
//
// **Why this is a company scene and not two people with an audience.** The
// ticket's own framing ("Heart encounters between members during downtime")
// would permit a two-hander, and a two-hander would be the wrong template in
// this file: `actorAffinities: ['group']` would then be decoration. The subject
// is therefore not whether the pair love each other — that is settled offscreen
// and is nobody's business — but what the pair *is to the company*: who covers
// whom, who can be sent out alone, and who will not make the cold call when the
// company needs it made. The watch list is the company's own machinery
// producing the evidence, which is what keeps the frame honest.
//
// **Why Heart and not Gold.** Gold went to the dispute, where the subject is who
// the company will follow. Here the axis is Sworn ↔ Renegade: the same bond
// sworn into the company and reorganised around, or kept private and running
// underneath everything the company does.

/**
 * The party under whose roof it gets said — a celebrant at a shrine, a steward
 * at an inn. Materializing rather than inherited for the THR-1165 reason, and
 * load-bearing beyond that: the good bands write a real `bond_change` onto this
 * person, so an inherited bind-only default would put the company's best
 * evening on whichever ambient figure happened to exist, and on nobody at all
 * otherwise.
 */
const OATH_WITNESS_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'oath_witness',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  supportRole: 'oath_witness',
  reuseNpcRoles: ['priest', 'steward'],
  spawnNpcRole: 'priest',
  spawnName: 'The One Who Heard It Said',
};

/** Composed, not replaced — the town keeps its own ambient cast. */
const THIRD_WATCH_SUPPORT_BUNDLE: EncounterSupportBundle = [
  ...DEFAULT_SETTING_SUPPORT_BUNDLES.urban,
  OATH_WITNESS_SPEC,
];

const THIRD_WATCH_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — the common option. Acts on the room, not on the pair.
    id: 'company.romance.give_them_the_room',
    name: 'Give Them the Room',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine:
      'You thin out the traffic past their corner, so the sentence does not have to be started three times. A small help.',
    fiction: 'The next two people who were going to walk past find a reason not to.',
    bandProse: {
      success: 'They got a clear run at it, and used it.',
      near_miss: 'The corner stayed quiet the whole evening. Quiet was not the difficulty.',
    },
  },
  {
    // Type: Boost — spirit, putting the size of the thing where it can be felt.
    id: 'company.romance.say_the_weight',
    name: 'Say the Weight',
    sphere: 'spirit',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.warmth',
    effectLine:
      'You let them feel how much of the last year this has been, so it comes out as large as it is. A real help.',
    fiction: 'Not a fondness. The other thing.',
    bandProse: {
      critical_success: 'It came out at its full size, and the company took it at that size.',
      failure: 'They understood exactly how much of it there was. That made it harder to start, not easier.',
    },
  },
  {
    // Type: Boost — life, steadying the body so the voice survives the sentence.
    id: 'company.romance.steady_the_hands',
    name: 'Steady the Hands',
    sphere: 'life',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.vigor',
    effectLine:
      'You settle the pulse and the hands, so the words arrive in the order they were meant in. A real help.',
    fiction: 'Say it once, and say it level.',
    bandProse: {
      success: 'It came out level, which is most of why it was heard as it was meant.',
      failure: 'The hands stayed steady the whole evening. Steady hands were not the difficulty.',
    },
  },
  {
    // Type: Boost — time, holding the evening open a little past its length.
    id: 'company.romance.the_hour_they_have',
    name: 'The Hour They Have',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.time-slow',
    effectLine:
      'You stretch the last of the evening, so the company is still sitting when it finally gets started. A real help.',
    fiction: 'Nobody has gone up yet. There is still an hour in this.',
    bandProse: {
      success: 'The company was still at the table when it got said, which is the only reason it got said to the company.',
      critical_failure: 'The evening ran long enough for all of it to come out, including the part that should have kept.',
    },
  },
  {
    // Type: Boost — darkness, narrowing the audience rather than the truth. A
    // deliberate settlement between the people it concerns is still a
    // settlement; the step asks what the pair is to the company, not how loudly.
    id: 'company.romance.keep_it_between_them',
    name: 'Keep It Between Them',
    sphere: 'darkness',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.dark',
    effectLine:
      'You draw the light down at their end of the table, so it can be settled among the people it concerns. A small help.',
    fiction: 'Three of them need to hear it. The room does not.',
    bandProse: {
      success_at_cost: 'It was settled at their end of the table. The rest of the company worked it out later, and from each other.',
      near_miss: 'The room heard none of it. Neither did the two people it was about.',
    },
  },
];

const THIRD_WATCH_STEP: ActionStep = {
  reach: 'heart',
  duration: { min: 1, max: 2 },
  difficulty: 0.44,
  purposeLine: 'Settle what they are',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The watch list is chalked on the back of a shutter and it has come out the same '
    + 'way eleven nights running. {actor} writes the list. The other one has never asked to '
    + 'be moved off the third watch, and the rest of the company has never asked either, and '
    + 'that second silence is the one that has gone on too long. It can be said now, while it '
    + 'is still a question about a chalked list, or it can wait until the night it is a '
    + 'question about who went back for whom.',
  successAfterimage:
    'The company knows what the pair are, and the list got rewritten in front of everybody.',
  failureAfterimage:
    'The list came out the same as it always does, and the company chalked it up and went to bed.',
  successAtCostAfterimage:
    'It got said. {actor} has not been asked to write the list since.',
  criticalSuccessAfterimage:
    'They said it plainly, the company took it plainly, and the list came out different in the morning because it should have.',
  criticalFailureAfterimage:
    'It came out as a loyalty the company had not been told about, and that is the half the company kept.',
  nudges: THIRD_WATCH_HAND,
};

export const COMPANY_THIRD_WATCH: UnifiedActionTemplate = {
  id: COMPANY_DRAMA_TEMPLATE_IDS.thirdWatch,
  rarityTier: 3,
  intrinsicTier: 'shaping',
  name: 'The Third Watch',
  reach: 'heart',
  crudType: 'read',
  scale: 'local',
  steps: [THIRD_WATCH_STEP],
  apCost: 1,
  // Group-EXCLUSIVE: the authoring claim, not a swept affinity. A company of one
  // has no watch rotation and nobody to be told, which is the whole subject.
  actorAffinities: ['group'],
  minGroupMembers: COMPANY_DRAMA_MIN_MEMBERS,
  motivations: ['loyalty_ambition', 'revelation_discretion'],
  settings: ['urban', 'sacred'],
  openings: {
    urban:
      'The company has coin and a roof for the first time in a fortnight, and it has taken '
      + 'the long table by the shutters. The packs are stacked where everyone can see them, '
      + 'so a watch still has to be set, so the list is still chalked up — and the two at the '
      + 'quiet end of the table have stopped pretending they came down separately.',
    sacred:
      'They are waiting out a night of rain in the shrine\'s side hall, where the floor is dry '
      + 'and the celebrant does not much mind. A watch on the packs is still a watch, so the '
      + 'list is chalked on the doorframe. Two of them have been sitting against the same wall '
      + 'since the rain started, and this is a building where people say things out loud on '
      + 'purpose.',
  },
  locationSubtypes: expandSettings(['urban', 'sacred']),
  supportBundle: THIRD_WATCH_SUPPORT_BUNDLE,
  traitVariants: [
    {
      // Warmth is what lets a person say a large thing without turning it into
      // an announcement — which is exactly the difference between the company
      // hearing it and the company being told.
      traitId: 'trait.core.core_warmth.virtue',
      forecastDelta: 0.05,
      factorLine: 'Warm, they can say it without making it an announcement.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The chalk is still on the shutter and the list still says what it said. What the '
        + 'company does about it is a separate decision from knowing about it, and the company '
        + 'is at the table with the evening in front of it. The rotation can be written to fit '
        + 'the pair, plainly, in front of everyone — or the list can be left exactly as it is '
        + 'and the company can go on being a company that has noticed and not said so.',
      changes: [],
      reactions: [
        {
          id: 'company.romance.rewrite_the_rotation',
          label: 'Rewrite the rotation',
          intent: 'The company works out loud who covers whom, and chalks it up that way.',
          effects: [
            { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_GAIN },
          ],
        },
        {
          id: 'company.romance.leave_the_list',
          label: 'Leave the list as it is',
          intent: 'It works. Nobody wants to be the one who made it a company matter.',
          effects: [
            // A question left on the shutter is a question that arrives again,
            // and the seed is what makes the pairing a thing the world acts on
            // rather than a thing the prose asserts.
            {
              kind: 'encounter_seed',
              templateId: COMPANY_DRAMA_TEMPLATE_IDS.thirdWatch,
              delayTicks: COMPANY_ROMANCE_RETURN_DELAY_TICKS,
              seedLabel: 'The list, still coming out the same',
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'It got said at the table with everybody sitting there, and it took about a minute, '
            + 'and the loudest reaction was one person saying they had a bet on it. The '
            + 'rotation was rewritten before the candles went, out loud, with the pair arguing '
            + 'their own case for keeping the third watch and losing that argument on grounds '
            + 'nobody had to soften. The one who heard it said has known worse evenings and '
            + 'says so.',
          changes: [
            {
              id: 'company.romance.said_in_front_of_everyone',
              kind: 'trait',
              title: 'Said in Front of Everyone',
              causeClause: 'They named it at the table instead of letting the company work it out',
              detail:
                'The company knows who covers whom and has written the rotation to match. Nobody is guessing at the next hard call.',
              polarity: 'gain',
              category: 'bond',
              direction: 'gain',
              stateNoun: {
                text: 'inspired',
                entityId: 'trait.condition.inspired',
                visualKind: 'attachment',
              },
              // Anchored to the person the band's reaction actually writes an
              // edge to (Law 56 clause 2). The `bond_change` below is a real,
              // inspectable relationship write; the condition on the stateNoun
              // is the other one. `$cast:` resolves against the declared key.
              concepts: [
                {
                  text: 'The one who heard it said',
                  entityId: '$cast:oath_witness',
                  visualKind: 'agent',
                  visualName: 'The One Who Heard It Said',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'company.romance.chalk_it_up_new',
              label: 'Chalk up the new rotation',
              intent: 'The list gets written to fit what the company now knows.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_GAIN },
                { kind: 'condition_attachment', templateId: 'trait.condition.inspired' },
                // Said plainly in front of a party whose business is words that
                // bind. That is a person who will vouch for this company, and a
                // relationship edge is what "will vouch" actually means.
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:oath_witness',
                  sentimentDelta: COMPANY_OATH_WITNESS_SENTIMENT,
                  trustDelta: COMPANY_OATH_WITNESS_TRUST,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            'It was settled at the quiet end of the table with three of them present, which is '
            + 'a settlement and is not the same as the company being told. The rest worked it '
            + 'out over the following days, from each other, in the order that suited whoever '
            + 'was telling it. {actor} has not been asked to write the list since, and has not '
            + 'asked why, and the not-asking is the expensive part.',
          changes: [
            {
              id: 'company.romance.off_the_list',
              kind: 'trait',
              title: 'Off the List',
              causeClause: 'It was settled among three people and reached the rest sideways',
              detail:
                'The rotation is somebody else\'s job now. It was not taken away in words, so there is nothing to take back.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              // The condition vocabulary has no word for a job quietly moved off
              // you, and a chip may only name a state the engine writes
              // (Law 56). So the chip claims the tiredness of a week of it,
              // which the reaction really attaches, and the sideways route the
              // news took stays in the overview where scene facts belong.
              stateNoun: {
                text: 'exhausted',
                entityId: 'trait.condition.exhausted',
                visualKind: 'attachment',
              },
              concepts: [{ text: 'somebody else writes the list now' }],
            },
          ],
          reactions: [
            {
              id: 'company.romance.let_it_travel',
              label: 'Let it travel on its own',
              intent: 'The three who were there know. The rest will get there.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.thirdWatch,
                  delayTicks: COMPANY_ROMANCE_RETURN_DELAY_TICKS,
                  seedLabel: 'The version of it that reached the rest',
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            'The evening ended the ordinary way. The candles went, the packs got carried up, '
            + 'and the list on the shutter says what it has said for eleven nights. Twice it '
            + 'was nearly started and twice the table turned to a different subject at the '
            + 'exact wrong second, and by the second time that had stopped being bad luck and '
            + 'become the company\'s decision.',
          changes: [
            {
              id: 'company.romance.still_the_same_list',
              kind: 'future_hook',
              title: 'Still the Same List',
              causeClause: 'The company had an evening under a roof and did not use it',
              detail:
                'The rotation keeps coming out the same and the company keeps chalking it up, so the question arrives again on a night with less room in it.',
              polarity: 'loss',
              category: 'path',
              direction: 'loss',
              // A seed has no node to open until it fires, so it cannot be its
              // own referent (Law 56 clause 2). The chip anchors to the one
              // person on this scene who is written: the member who keeps
              // writing the list, and whose next chance this seed schedules.
              stateNoun: {
                text: 'the list they keep chalking up',
                entityId: '$actor',
                visualKind: 'agent',
              },
              concepts: [{ text: 'the night it is a question about who went back for whom' }],
            },
          ],
          reactions: [
            {
              id: 'company.romance.go_up_to_bed',
              label: 'Carry the packs up and leave it',
              intent: 'It has kept eleven nights. It will keep another.',
              effects: [
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.thirdWatch,
                  delayTicks: COMPANY_ROMANCE_RETURN_DELAY_TICKS,
                  seedLabel: 'The same list, on a worse night',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'It came out late and badly and in front of the whole room, and what the company '
            + 'heard was not a pairing, it was two of its own agreeing in advance who they '
            + 'would go back for. Nobody has said the word for that either. The one who heard '
            + 'it said heard all of it, including the part that was about the rest of the '
            + 'company, and what this company is understood to be is now partly in the keeping '
            + 'of a stranger who was there for the worst of an evening.',
          changes: [
            {
              // Reports the mark, not the standing move. The reaction does write
              // a `reputation_tally`, but that number renders only in the
              // designer's TalliesDebugTab — a chip reporting it would claim a
              // quantity the player cannot inspect (Law 13 parity, THR-1136 §5),
              // so the standing sentence stays in the overview and the chip
              // reports the thing the engine will act on: a stranger carrying
              // something about this company that an investigation can reach.
              id: 'company.romance.what_they_owe_each_other',
              kind: 'future_hook',
              title: 'What They Owe Each Other',
              causeClause: 'The company heard the pairing as a promise made over its head',
              detail:
                'A stranger sat through the whole of it and can repeat the part about who would be gone back for first.',
              polarity: 'loss',
              category: 'path',
              direction: 'loss',
              concepts: [
                {
                  text: 'The one who heard it said',
                  entityId: '$cast:oath_witness',
                  visualKind: 'agent',
                  visualName: 'The One Who Heard It Said',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'company.romance.sleep_on_it',
              label: 'Break the table up for the night',
              intent: 'Nothing said after this improves it. End the evening.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_LOSS },
                // A company overheard agreeing who it will go back for first is
                // doing a thing that can be found out. The mark anchors to the
                // cast member who sat through it — a declared actor the world
                // instantiates, not ambient scenery.
                {
                  kind: 'hidden_mark',
                  category: 'concealed_action',
                  severity: COMPANY_UNSAID_SEVERITY,
                  label: 'Two of the company settled between them who gets gone back for',
                  targetAgentId: '$cast:oath_witness',
                  revealFamilies: ['investigation'],
                },
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.thirdWatch,
                  delayTicks: COMPANY_ROMANCE_RETURN_DELAY_TICKS,
                  seedLabel: 'What the room took away from that evening',
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
      'Two of a company have become something to each other, and the company has not been told.',
    success: 'It got said, and the company wrote itself around it.',
    failure: 'It did not get said, and the list came out the same again.',
  },
  description:
    'Two members of a company have become something to each other, everybody in the company '
    + 'can see it, and the watch list has come out the same way for eleven nights. The scene is '
    + 'not about whether they love each other, which is settled; it is about what the pair is '
    + 'to a company that has to know who covers whom before the next hard night. A god can lean '
    + 'on the room, on the size of the thing, on the steadiness of a voice, on the length of '
    + 'the evening, or on how narrow the audience is — and fate decides whether the company '
    + 'reorganises honestly or carries a loyalty it will not name.',
};

// ═════════════════════════════════════════════════════════════════════
// 4. THE QUIET OFFER — the betrayal
// ═════════════════════════════════════════════════════════════════════
//
// Crux: somebody is buying what a company knows, and one of the company is
//       being asked, and the first thing asked for is small enough to refuse
//       badly.
// Shape: Single Test · Setting: arcane + battlefield · Pressure: an offer that
// expires when the company finishes its work · Form: a first step ·
// Objective: settle the offer while it is still one conversation ·
// Stakes: whether the company is a thing this member is inside or a thing they
// have a price for · Step: Shadow — "Settle the offer".
// Why here: both places spread a company out over its own work, which is the
// condition an approach needs — nobody can see who is talking to whom.
// Connected systems (Q8): cast, rewards, seeds, conditions, reputation — five,
// against a quota of three.
// Choice: none at the step. The fork is in the aftermath reaction — whether the
// conversation is carried back to the company or closed off alone.
// Promise → payoff: the opening states that the company is spread out and that
// somebody has been waiting for that; the step answers what the member does
// with the hour nobody is watching them in.
//
// **The first ask is small on purpose.** A scene where the offer is obviously
// vile is a scene with no question in it. What is asked for here — where the
// company is going next, and who it is working for — is the kind of thing that
// gets said out loud in a taproom for free, which is exactly what makes it
// takeable. The size is the difficulty.
//
// **Shadow, and the axis is the fork.** `honesty_cunning` runs Confessor ↔
// Puppeteer, which is this subject stated as a value: bring it into the light,
// or keep it and run it. Iron went to the sacrifice, Gold to the dispute, Heart
// to the romance; Shadow was left, and it is the one this needed.
//
// **The history is minted here, not presumed.** Nothing in this template asserts
// the member has taken money before — the file's register rule forbids it, and
// it would also be a worse scene: an offer already half-accepted has no question
// in it. The worst band is where the first payment *happens*, and what it leaves
// behind is a `hidden_mark` on the member, so the obligation starts existing at
// the moment it is incurred rather than being backstory the prose asserts.

/**
 * The party doing the buying — a broker at a tower, a quartermaster's fixer
 * walking a field. Materializing rather than inherited: three of the five bands
 * write a real edge or mark involving this person, so an inherited bind-only
 * default would hang the scene's consequences on whichever ambient figure
 * happened to exist, and on nobody at all otherwise.
 */
const OFFER_BUYER_SPEC: EncounterSupportActorSpec = {
  kind: 'actor',
  key: 'the_buyer',
  delivery: 'lazy-materialize-on-trigger',
  persistence: 'must-persist',
  supportRole: 'the_buyer',
  reuseNpcRoles: ['broker', 'informant'],
  spawnNpcRole: 'broker',
  spawnName: 'The One Who Is Buying',
};

/** Composed, not replaced — the field keeps its own ambient cast. */
const QUIET_OFFER_SUPPORT_BUNDLE: EncounterSupportBundle = [
  ...DEFAULT_SETTING_SUPPORT_BUNDLES.battlefield,
  OFFER_BUYER_SPEC,
];

const QUIET_OFFER_HAND: readonly StepNudge[] = [
  {
    // Type: Boost — the common option. Acts on the company's work, not on the
    // member: the surest way to end a quiet conversation is to be needed loudly.
    id: 'company.betrayal.the_work_calls',
    name: 'The Work Calls Them Back',
    essenceCost: 1,
    forecastDelta: 0.06,
    imageTag: 'generic.focus',
    effectLine:
      'You make the company\'s work want them — a call across the ground, a load that needs two. A small help.',
    fiction: 'Somebody says their name from forty feet away, twice.',
    bandProse: {
      success: 'The conversation ended because it ran out of privacy, which is a fine reason.',
      near_miss: 'They got called away and came back. The offer had waited.',
    },
  },
  {
    // Type: Boost — mind, pricing the thing rather than judging it. The scene's
    // difficulty is that the first ask looks cheap; arithmetic is the answer.
    id: 'company.betrayal.price_it_out',
    name: 'Price It Out',
    sphere: 'mind',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.memory',
    effectLine:
      'You run the sum forward — what is asked now, and what is asked once it can be asked. A real help.',
    fiction: 'The first one is cheap. That is what the first one is for.',
    bandProse: {
      critical_success: 'They worked out what it was worth before answering, and the answer came easily after that.',
      failure: 'They followed the sum right to the end and took the offer anyway, which is a worse thing than not having done the sum.',
    },
  },
  {
    // Type: Boost — light, putting the conversation where it can be seen. Not a
    // moral lean: being visible is a practical way to end a private offer.
    id: 'company.betrayal.stand_in_the_open',
    name: 'Stand in the Open',
    sphere: 'light',
    essenceCost: 2,
    forecastDelta: 0.08,
    imageTag: 'generic.light',
    effectLine:
      'You move the light so the two of them are standing where the company can see them talking. A real help.',
    fiction: 'Nothing has been done wrong yet. It is easier to keep it that way in the open.',
    bandProse: {
      success: 'It got settled where people could see it happening, which took most of the weight out of it.',
      critical_failure: 'The company saw the whole conversation and drew the obvious conclusion from the wrong half of it.',
    },
  },
  {
    // Type: Boost — time, refusing the pressure the offer depends on. An offer
    // that can wait an hour is an offer that can be thought about.
    id: 'company.betrayal.let_it_wait',
    name: 'Let It Wait',
    sphere: 'time',
    essenceCost: 2,
    forecastDelta: 0.09,
    imageTag: 'generic.time-slow',
    effectLine:
      'You take the hurry out of it, so the answer does not have to be given while the offer is still warm. A real help.',
    fiction: 'It will still be an offer in an hour. That is worth knowing.',
    bandProse: {
      success_at_cost: 'The hour was taken and the answer was the right one, and the buyer used the hour too.',
      near_miss: 'There was all the time in the world to decide, and it went unused.',
    },
  },
  {
    // Type: Boost — darkness, working the buyer instead of the offer. Cunning is
    // the flaw pole of this reach's axis, and it still *settles* the matter: a
    // member who turns the approach into a source has closed it, not taken it.
    // The step asks what the member does with the offer, not how virtuously.
    id: 'company.betrayal.ask_who_sent_them',
    name: 'Ask Who Sent Them',
    sphere: 'darkness',
    essenceCost: 1,
    forecastDelta: 0.07,
    imageTag: 'generic.rumor',
    effectLine:
      'You turn the conversation around, so the one asking questions starts answering them. A small help.',
    fiction: 'Somebody is paying for this. That somebody has a name.',
    bandProse: {
      critical_success: 'They came out of it knowing who was buying, which is worth more than the offer was.',
      failure: 'They asked a great many questions and answered a few without noticing the trade.',
    },
  },
];

const QUIET_OFFER_STEP: ActionStep = {
  reach: 'shadow',
  duration: { min: 1, max: 2 },
  difficulty: 0.46,
  purposeLine: 'Settle the offer',
  onSuccess: [],
  onFailure: [],
  failBehavior: 'fail_action',
  narrativeTemplate:
    'The company is spread out across its own work and has been for an hour, which is '
    + 'the first time this week no one has been within earshot of anyone. Somebody has '
    + 'been waiting for that. What they want from {actor} to begin with is where the '
    + 'company goes next and whose coin it is on — the kind of thing that gets said for '
    + 'nothing in a taproom, and they are not offering nothing for it. The rest of the '
    + 'company is thirty feet away and getting on with it. This is still one '
    + 'conversation, and it is still the sort that can be ended.',
  successAfterimage:
    'The offer was settled standing up, and the company got its hour of work out of {actor} as well.',
  failureAfterimage:
    'Nothing was agreed and nothing was refused, and the buyer went away content with that.',
  successAtCostAfterimage:
    'It was refused. The buyer had an hour to watch a company at work and did not waste it.',
  criticalSuccessAfterimage:
    'It was refused and then carried straight back, so the company learned it had a price on it.',
  criticalFailureAfterimage:
    'A small thing was told for money, and the small thing is not the part that matters.',
  nudges: QUIET_OFFER_HAND,
};

export const COMPANY_QUIET_OFFER: UnifiedActionTemplate = {
  id: COMPANY_DRAMA_TEMPLATE_IDS.quietOffer,
  rarityTier: 3,
  intrinsicTier: 'shaping',
  name: 'The Quiet Offer',
  reach: 'shadow',
  crudType: 'read',
  scale: 'local',
  steps: [QUIET_OFFER_STEP],
  apCost: 1,
  // Group-EXCLUSIVE: the authoring claim, not a swept affinity. A member alone
  // has nothing to sell — what is being bought is the company, so the company
  // has to exist for the offer to mean anything.
  actorAffinities: ['group'],
  minGroupMembers: COMPANY_DRAMA_MIN_MEMBERS,
  motivations: ['honesty_cunning', 'loyalty_ambition'],
  settings: ['arcane', 'battlefield'],
  openings: {
    arcane:
      'The company has been at the tower most of the day on business that belongs to '
      + 'somebody else, and waiting is the whole of it. People have drifted to where there '
      + 'is shade or a wall to sit against. Somebody who has been at the tower longer than '
      + 'they have has worked out which of the company is the one worth standing next to.',
    battlefield:
      'The company is working the ground the day after, which is slow and spreads people '
      + 'out over a wide area — a count here, a load there, and nobody within earshot of '
      + 'anybody for an hour at a time. There are others on the field doing the same, and '
      + 'not all of them are here for what they are carrying.',
  },
  locationSubtypes: expandSettings(['arcane', 'battlefield']),
  supportBundle: QUIET_OFFER_SUPPORT_BUNDLE,
  traitVariants: [
    {
      // Hope is what makes the company still worth being inside of. A member who
      // expects it to come to something has a reason to refuse that does not
      // depend on being watched — which is the only kind of reason available here.
      traitId: 'trait.core.core_hope.virtue',
      forecastDelta: 0.05,
      factorLine: 'Hopeful, they still expect this company to come to something.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 0,
    variants: {},
    fallback: {
      overview:
        'The conversation happened and the company\'s work got done around it. What the '
        + 'company knows about it is a separate matter from what took place, and that is '
        + 'still open: the whole of it can be walked back to them while it is a story about '
        + 'somebody else\'s offer, or it can be left where it happened, which keeps it small '
        + 'and keeps it {actor}\'s.',
      changes: [],
      reactions: [
        {
          id: 'company.betrayal.carry_it_back',
          label: 'Carry it back to the company',
          intent: 'They should know somebody is buying, and what was being asked for.',
          effects: [
            { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_GAIN },
          ],
        },
        {
          id: 'company.betrayal.leave_it_where_it_fell',
          label: 'Leave it where it happened',
          intent: 'Nothing was taken. There is nothing to report and no good way to report it.',
          effects: [
            // An approach that went unreported is an approach that can be made
            // again, and the seed is what makes the buyer a thing the world does
            // rather than a thing this scene mentioned once.
            {
              kind: 'encounter_seed',
              templateId: COMPANY_DRAMA_TEMPLATE_IDS.quietOffer,
              delayTicks: COMPANY_OFFER_RETURN_DELAY_TICKS,
              seedLabel: 'The offer, made again on a worse week',
            },
          ],
        },
      ],
      byOutcome: {
        critical_success: {
          overview:
            'It was refused on the spot and then walked straight back to the company before '
            + 'the day\'s work was finished, which is the part that mattered — not the refusing, '
            + 'which anybody might do, but the telling, which turns one member\'s private hour '
            + 'into something the whole company knows it has. What the company has now is the '
            + 'shape of somebody\'s interest in it: what was asked for first, and what that '
            + 'says about what is wanted next. The one who was buying has revised their '
            + 'estimate of this company, and not upward.',
          changes: [
            {
              id: 'company.betrayal.told_it_the_same_day',
              kind: 'trait',
              title: 'Told It the Same Day',
              causeClause: 'The offer was refused and then reported before the day was out',
              detail:
                'The company knows it has a price on it and knows what was asked for first. That is the company\'s information now, not one member\'s.',
              polarity: 'gain',
              category: 'bond',
              direction: 'gain',
              stateNoun: {
                text: 'inspired',
                entityId: 'trait.condition.inspired',
                visualKind: 'attachment',
              },
              // Anchored to the person the band's effects actually write to
              // (Law 56 clause 2): the `bond_change` below moves a real edge with
              // the buyer, and the buyer is a declared cast key the world
              // instantiates rather than ambient scenery.
              concepts: [
                {
                  text: 'The one who is buying',
                  entityId: '$cast:the_buyer',
                  visualKind: 'agent',
                  visualName: 'The One Who Is Buying',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'company.betrayal.name_the_buyer',
              label: 'Name the buyer to the company',
              intent: 'Everything that was said, said again with the company sitting there.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_GAIN },
                { kind: 'condition_attachment', templateId: 'trait.condition.inspired' },
                // A buyer who was heard out and then reported revises two
                // separate things, and revises the second one harder: whether
                // this person can be approached at all.
                {
                  kind: 'bond_change',
                  withAgentId: '$cast:the_buyer',
                  sentimentDelta: COMPANY_BUYER_SENTIMENT,
                  trustDelta: COMPANY_BUYER_TRUST,
                },
              ],
            },
          ],
        },
        success_at_cost: {
          overview:
            'It was refused, properly and without much drama, and the refusing took long '
            + 'enough that the one asking got an hour on a working company and used all of '
            + 'it. What a company will not sell is a smaller fact than what it would, but it '
            + 'is not nothing: they left knowing roughly how many, roughly how good, and '
            + 'exactly which one of them is worth approaching. {actor} has the tiredness of '
            + 'an hour spent being careful, and nobody to explain it to.',
          changes: [
            {
              id: 'company.betrayal.read_off_the_refusal',
              kind: 'trait',
              title: 'Read Off the Refusal',
              causeClause: 'The offer was refused at length, and the length was informative',
              detail:
                'Somebody walked away with a working estimate of this company, assembled from an hour of watching it and one careful no.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              // The condition vocabulary has no word for an hour of being
              // careful, and a chip may only name a state the engine writes
              // (Law 56). So the chip claims the tiredness the reaction really
              // attaches, and what the buyer inferred stays in the overview.
              stateNoun: {
                text: 'exhausted',
                entityId: 'trait.condition.exhausted',
                visualKind: 'attachment',
              },
              concepts: [
                {
                  text: 'The one who is buying',
                  entityId: '$cast:the_buyer',
                  visualKind: 'agent',
                  visualName: 'The One Who Is Buying',
                },
              ],
            },
          ],
          reactions: [
            {
              id: 'company.betrayal.say_nothing_about_it',
              label: 'Refuse it and say nothing after',
              intent: 'It was handled. Reporting it now only makes it a thing that needed handling.',
              effects: [
                { kind: 'condition_attachment', templateId: 'trait.condition.exhausted' },
                // The mark sits on the *buyer*, who is the one carrying a
                // discoverable fact about this company — `targetAgentId` names
                // the bearer, and the bearer here is not the actor.
                {
                  kind: 'hidden_mark',
                  category: 'secret_knowledge',
                  severity: COMPANY_READ_OFF_SEVERITY,
                  label: 'Holds a working estimate of the company, assembled while being turned down',
                  targetAgentId: '$cast:the_buyer',
                  revealFamilies: ['investigation'],
                },
              ],
            },
          ],
        },
        failure: {
          overview:
            'Nothing was agreed to and nothing was refused. It got left at the place where '
            + 'people leave things they intend to think about, and both of them knew that is '
            + 'what had happened. The work finished, the company packed up, and the offer is '
            + 'still standing exactly where it was — which is the outcome the one who made it '
            + 'would have chosen, given the choice, because an offer nobody refused is an '
            + 'offer that can be made again in a month when there is less coin in the company.',
          changes: [
            {
              id: 'company.betrayal.left_standing',
              kind: 'future_hook',
              title: 'Left Standing',
              causeClause: 'The offer was neither taken nor refused',
              detail:
                'It stays open, and the next time it is put it will be put to a member who has already not said no once.',
              polarity: 'loss',
              category: 'path',
              direction: 'loss',
              // A seed has no node to open until it fires, so it cannot be its
              // own referent (Law 56 clause 2). The chip anchors to the one
              // person here who is written: the member the standing offer
              // belongs to, and whose next hearing of it this seed schedules.
              stateNoun: {
                text: 'the offer they did not answer',
                entityId: '$actor',
                visualKind: 'agent',
              },
              concepts: [{ text: 'a month from now, with less coin in the company' }],
            },
          ],
          reactions: [
            {
              id: 'company.betrayal.think_about_it',
              label: 'Leave it open and get back to work',
              intent: 'No answer is not an answer. It can keep.',
              effects: [
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.quietOffer,
                  delayTicks: COMPANY_OFFER_RETURN_DELAY_TICKS,
                  seedLabel: 'The offer, put again to someone who did not say no',
                },
              ],
            },
          ],
        },
        critical_failure: {
          overview:
            'It was taken. What got told was small — where the company is going and whose '
            + 'coin it is on, which is worth about what it was paid — and the smallness is '
            + 'the trap rather than the mitigation, because the thing that has actually '
            + 'changed is that there is now a first time. The coin is real and so is the '
            + 'expectation attached to it. Nobody in the company noticed anything, which is '
            + 'the worst available version of this: there is no conversation coming that '
            + 'would end it, only the next ask, which will be larger and will be made to '
            + 'somebody who has already said yes once.',
          changes: [
            {
              id: 'company.betrayal.the_first_time',
              kind: 'trait',
              title: 'The First Time',
              causeClause: 'Something small about the company was sold, and paid for',
              detail:
                'There is coin taken and an expectation standing against it. What was told is not the part that matters; the part that matters is that there is now a first time.',
              polarity: 'loss',
              category: 'scar',
              direction: 'loss',
              // There is no attachable condition for "has taken money against
              // their own company". The engine's nearest word, `debt-laden`,
              // lives in ECONOMIC_TRAIT_DEFINITIONS, which is not one of
              // `ATTACHMENT_TEMPLATE_SOURCES` — so it resolves to no shipped
              // attachment template and a chip naming it would render a dead
              // pointer as a live link (Law 56 clause 2). The obligation
              // therefore stays in the overview where scene facts belong, and
              // the chip anchors to the effect on this band that does name a
              // person: the `hidden_mark` below, which takes no `targetAgentId`
              // and so lands on the actor.
              stateNoun: {
                text: 'what they took the coin for',
                entityId: '$actor',
                visualKind: 'agent',
              },
              concepts: [{ text: 'the next ask, which will be larger' }],
            },
          ],
          reactions: [
            {
              id: 'company.betrayal.take_the_coin',
              label: 'Take the coin and go back to work',
              intent: 'It was one small thing. Nobody is any worse off for it today.',
              effects: [
                { kind: 'reputation_tally', key: COMPANY_REPUTE_KEY, delta: COMPANY_REPUTE_LOSS },
                // No `targetAgentId`: the default is the actor, and the actor is
                // the one who did the concealed thing. This is the only mark in
                // the file that lands on the member rather than a witness, which
                // is what telling the betrayal from inside it buys.
                {
                  kind: 'hidden_mark',
                  category: 'betrayal',
                  severity: COMPANY_SOLD_SEVERITY,
                  label: 'Sold the company\'s road and paymaster for coin, and was not seen doing it',
                  revealFamilies: ['investigation', 'confession'],
                },
                {
                  kind: 'encounter_seed',
                  templateId: COMPANY_DRAMA_TEMPLATE_IDS.quietOffer,
                  delayTicks: COMPANY_OFFER_RETURN_DELAY_TICKS,
                  seedLabel: 'The second ask, made to somebody who said yes once',
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
      'Somebody is buying what a company knows, and one of the company is being asked.',
    success: 'The offer was settled while it was still one conversation.',
    failure: 'The offer is still standing, and so is the one who made it.',
  },
  description:
    'A company spread out over its own work is a company nobody is within earshot of, and '
    + 'somebody has been waiting for that. What is asked for first is small — where the '
    + 'company is going, whose coin it is on — and the smallness is the whole difficulty, '
    + 'because there is no version of this where the first ask is bad enough to make '
    + 'refusing easy. A god can call the member back to the work, price the offer out, put '
    + 'the conversation where it can be seen, take the hurry out of it, or turn it around '
    + 'on the one asking — and fate decides whether it ends as one conversation or as a '
    + 'first time.',
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
  COMPANY_TWO_ROADS_NAMED,
  COMPANY_THIRD_WATCH,
  COMPANY_QUIET_OFFER,
].map(compileOpeningEnvelope);
