/**
 * Ascendant Pool-Beat Content Templates (THR-514)
 *
 * The rich, player-facing content each *cadence-gated pool beat* resolves into. The
 * lightweight scheduling descriptors (`kind`/`weight`/`grantsActionIds`/`eligibility`)
 * live on `ASCENDANT_BEAT_POOL` (`ascendant-beat-content.ts`, THR-505/516); the offer→
 * enter→resolve plumbing ships in `resolvePendingBeat` + `AscendantBeatModal` (THR-517).
 * This module supplies the prose those surfaces render.
 *
 * ── How these are wired ───────────────────────────────────────────────────────
 * Each pool `BeatDefinition` now carries `templateId === beatId`. Two consumers read it:
 *   1. `resolvePendingBeat`'s `templateResolver` (`id => getUnifiedTemplateById(id)`)
 *      uses it for the missing-template fail-soft — a beat whose template can't be
 *      found clears gracefully instead of wedging the queue. So every `templateId`
 *      MUST resolve to a template here (asserted in tests).
 *   2. `AscendantBeatModal` (via `GameView`) reads this template's `name` + `description`
 *      and runs them through `enrichProse` against the god's anchor mortal (The First),
 *      so the same beat reads bespoke each run ("…at the edge of what {name}'s kind can
 *      see"). Placeholders resolve to run-specific names; see `src/engine/proseEnrichment.ts`.
 *
 * ── Registration (no drawer/hand leak) ────────────────────────────────────────
 * These are deliberately kept OUT of `UNIFIED_ACTION_TEMPLATES`. That array feeds the
 * ascendant hand (`phaseAscendantHandFilter` filters by `actorAffinities: ['ascendant']`),
 * the Codex, the CMS catalogue, and the unified-action structural tests. Beats are not
 * castable cards — they are encounters *addressed to* the god, resolved through the beat
 * loop, not the action pipeline. Registering them as actions would surface them as hand
 * cards. Instead `getUnifiedTemplateById` checks this pool as a third lookup, which is all
 * the resolver + modal need.
 *
 * ── Unlock representation ──────────────────────────────────────────────────────
 * The shipped resolve contract (`resolvePendingBeat`, THR-517) grants a beat's action
 * cards from `BeatDefinition.grantsActionIds` and emits `action.unlock.granted` per id —
 * it does NOT execute template aftermath. So the unlock for each pool beat is carried by
 * `grantsActionIds` on the descriptor, not by an `unlock_action` aftermath effect on this
 * template (which the resolve path would never run). The richer "beat resolution runs the
 * template's aftermath / GraphOps" contract is the deferred engine change TODO(THR-520).
 *
 * VOICE. Threadbare, second person, player-as-god, indirect intervention (you lean, you
 * offer, you do not seize). Long-form `description` (read + TTS). Introduction beats end
 * on an investment hook; they anchor enrichment on The First + the world the god already
 * knows (the un-introduced group itself is not bound until the Director seeds it —
 * TODO(THR-520)).
 */

import type { UnifiedActionTemplate } from '../types/unifiedAction';

/**
 * Shared scaffold for a pool-beat template. Pool beats are not run through the action
 * pipeline (they resolve via `resolvePendingBeat`), so the mechanical fields are nominal:
 * a single no-op `star`-reach step, zero AP/essence, and empty `actorAffinities` (so even
 * a stray enumerator never matches the ascendant-hand affinity filter). The prose fields
 * (`name`, `description`, `narrativeTemplates`) are the real payload.
 */
function poolBeatTemplate(args: {
  id: string;
  name: string;
  description: string;
  initiation: string;
  success: string;
  failure: string;
}): UnifiedActionTemplate {
  return {
    id: args.id,
    name: args.name,
    rarityTier: 2,
    intrinsicTier: 'story_beat',
    reach: 'star',
    crudType: 'read',
    scale: 'cosmic',
    steps: [
      {
        reach: 'star',
        duration: { min: 1, max: 1 },
        difficulty: 0,
        onSuccess: [],
        onFailure: [],
        failBehavior: 'fail_action',
        narrativeTemplate: args.initiation,
      },
    ],
    apCost: 0,
    actorAffinities: [],
    motivations: [],
    description: args.description,
    narrativeTemplates: {
      initiation: args.initiation,
      success: args.success,
      failure: args.failure,
    },
  };
}

// ─── Introduction beats — surface a generated culture/faction (no grant) ───────
// Enrichment anchors on The First ({name}) + the world the god already knows; the
// un-introduced group is referred to generically until the Director binds it (THR-520).

const INTRODUCTION_TEMPLATES: UnifiedActionTemplate[] = [
  poolBeatTemplate({
    id: 'beat.pool.intro.first_stirring',
    name: 'The First Stirring',
    description:
      'Far past the reach of {name} and everything {name} knows, a people you have never named lifts its first prayer toward you — not to you by name, for they have no name for you yet, but upward, into the dark where gods are said to wait. It is faint, the way a single candle is faint across a valley. But you heard it. Lean toward that light, and it will learn to call you something.',
    initiation: 'a people beyond {name}\'s horizon lifts its first prayer into the dark',
    success: 'you turn your face toward the stirring; a new people enters your awareness',
    failure: 'the prayer thins to nothing before you can answer it',
  }),
  poolBeatTemplate({
    id: 'beat.pool.intro.rising_faction',
    name: 'A Rising Ambition',
    description:
      'Somewhere out past {name}, an ambition has grown loud enough to crack the quiet of the heavens. A banner is rising — a faction gathering strength, certain it is owed more than the world has given it. They do not yet know you are listening. You could let them rise alone, as most do. Or you could let them feel, just once, that something vast has noticed them.',
    initiation: 'a gathering ambition grows loud enough to reach your stillness',
    success: 'you let the rising faction feel your notice settle over it',
    failure: 'the ambition burns itself low before you choose to answer',
  }),
  poolBeatTemplate({
    id: 'beat.pool.intro.distant_people',
    name: 'A Distant Rite',
    description:
      'On the far edge of the map {name} will never walk, a rite is being kept — old hands, old words, a fire tended in the same hollow for longer than anyone alive remembers why. The smoke of it rises differently tonight: it bends toward you. A distant people is asking, in the only grammar it has, to be known by something larger than itself. You may answer that asking, or let the smoke disperse.',
    initiation: 'a far people\'s rite bends its smoke toward you, asking to be known',
    success: 'you accept the distant rite; its people pass into your sight',
    failure: 'the fire gutters and the rite folds back into its own silence',
  }),
  poolBeatTemplate({
    id: 'beat.pool.intro.zealous_order',
    name: 'A Patronless Order',
    description:
      'A devout order has spent itself for years on faith with no face to receive it. Now its zealots kneel and demand — not beg, demand — a patron worthy of their fervor. Their certainty is a heat you can feel from here, brighter even than {name}\'s steadier flame. Such devotion is a tool and a danger both. Claim it, and it is yours; ignore it, and it will find another sky to shout at.',
    initiation: 'a zealous order kneels and demands a patron worthy of its fervor',
    success: 'you let the order\'s fervor find you; it has its patron now',
    failure: 'the zealots\' certainty curdles toward some other, nearer power',
  }),
  poolBeatTemplate({
    id: 'beat.pool.intro.sundered_court',
    name: 'A Sundered Court',
    description:
      'A faction has split itself down the middle, and both halves have looked up at the same moment — each begging you to declare the other false. They want a verdict, an end to the question of who is owed the throne of their cause. You are not bound to give one. But silence, too, is an answer, and they will read whatever you do as judgment. Attend the sundered court, or let it tear at itself unwatched.',
    initiation: 'a fractured faction begs you to declare which of its halves is true',
    success: 'you turn your attention on the sundered court; both halves fall quiet',
    failure: 'the split widens past the point where any verdict would matter',
  }),
  poolBeatTemplate({
    id: 'beat.pool.intro.old_power',
    name: 'An Old Power Wakes',
    description:
      'Something far older than {name}\'s people has begun to remember itself. A buried culture — sunken, salted-over, half-myth even to those who descend from it — is surfacing a memory it should not still hold: the shape of a god who walked before you. You are not that god. But you are the one who is here. Lean close to the old power as it wakes, and what it remembers may yet become what it worships.',
    initiation: 'a buried culture surfaces the memory of a god who walked before you',
    success: 'you meet the old power as it wakes; its memory turns toward you',
    failure: 'the ancient thing sinks back beneath its own salt and silence',
  }),
];

// ─── Investment beats — "the world calls": offer one real card (the grant) ─────
// Enrichment anchors on The First / the god's existing threads + holdings.

const INVESTMENT_TEMPLATES: UnifiedActionTemplate[] = [
  poolBeatTemplate({
    id: 'beat.pool.invest.the_worthy_mortal',
    name: 'The Worthy Mortal',
    description:
      'One soul among the many has begun to outgrow the size of its own life — the way {name} once did, before your thread found them. You feel the pitch of it: a worth the world has not yet rewarded, a fate straining at its seams. A god\'s attention is the rarest currency there is. Spend a little of it here, and draw this one into the small bright circle of the watched.',
    initiation: 'a mortal outgrows the size of its life, the way {name} once did',
    success: 'you draw a thread toward the worthy soul; it is yours to watch now',
    failure: 'the moment passes, and the soul folds back into the unremarkable crowd',
  }),
  poolBeatTemplate({
    id: 'beat.pool.invest.a_place_of_power',
    name: 'A Place of Power',
    description:
      'There is a place in the world that hums — a confluence, a height, a hollow where the weave runs thin and the faith of mortals pools instead of draining away. It belongs to no power yet. Bind it to yourself, as you bound the seat where {name}\'s prayers first reached you, and the devotion gathered there will rise back to you as strength, tide after patient tide.',
    initiation: 'a place where faith pools instead of draining stands unclaimed',
    success: 'you bind the place of power; its gathered faith will flow to you',
    failure: 'the confluence scatters before your touch can settle on it',
  }),
  poolBeatTemplate({
    id: 'beat.pool.invest.raw_relic',
    name: 'Raw Material',
    description:
      'A humble thing waits in mortal hands — a blade, a cup, a band of worn iron, no different from {artifact:any} until a god decides otherwise. Mortals outlast themselves through the things they make and leave behind. Press a sliver of your nature into this one and it wakes, carrying your will into years you will not stay to watch and hands you will never touch.',
    initiation: 'a humble object waits, no different from {artifact:any} until you choose',
    success: 'you press your nature into the object; it wakes carrying your will',
    failure: 'the thing stays only a thing; your nature finds no purchase in it',
  }),
  poolBeatTemplate({
    id: 'beat.pool.invest.the_restless_soul',
    name: 'The Restless Soul',
    description:
      'A life is turning at a hinge and does not know it — the kind of crossroads {name} would recognize. You cannot yet read what this one will become; the future folds away from you, dim and uncommitted. But you can open your eye upon them and watch, gathering the small evidences of a fate before you decide whether it is worth a thread. Look closer, or look away.',
    initiation: 'a restless life turns at a hinge it cannot see, and you might watch',
    success: 'you open your sight upon the restless soul; its small fate begins to clarify',
    failure: 'the soul slips past the crossroads unseen, its future still closed to you',
  }),
  poolBeatTemplate({
    id: 'beat.pool.invest.the_half_faithful',
    name: 'The Half-Faithful',
    description:
      'Someone has half-believed in you for a long while — a doubt with the shape of a prayer, a hope they are ashamed to say aloud. They are not devout like {name}; they are worse and better than that, a soul still arguing with itself about whether the heavens are empty. Reach down now, while the argument is live, and the thread you draw will be the thing that settles it.',
    initiation: 'a soul half-believes in you, still arguing whether the heavens are empty',
    success: 'you reach down mid-argument; the half-faithful is bound to your sight',
    failure: 'the doubt wins out, and the half-prayer goes quiet for good',
  }),
  poolBeatTemplate({
    id: 'beat.pool.invest.claim_the_wild',
    name: 'Claim the Wild',
    description:
      'Past the last fence and the last named road lies ground no power has ever stooped to claim — wild, indifferent, older than worship. There is strength in such places precisely because nothing has spent it. Set your seat there, far from {name} and the warm crowded center of things, and make the wilderness gather its quiet faith for you alone.',
    initiation: 'unclaimed wild ground waits, older than worship, spent by no power',
    success: 'you set your seat in the wild; its quiet strength begins to gather for you',
    failure: 'the wilderness shrugs off your claim and stays no one\'s',
  }),
];

// ─── Selection beats — choose 1-of-N within-run (picker resolves the grant) ────

const SELECTION_TEMPLATES: UnifiedActionTemplate[] = [
  poolBeatTemplate({
    id: 'beat.pool.select.first_true_gift',
    name: 'The First True Gift',
    description:
      'You have leaned and watched and waited; now the world holds still and offers you a choice of how to spend yourself. A thread to bind a soul as you bound {name}; a place to claim and draw faith from; a thing to wake with your nature and send forward through time. Each is a different kind of god to be. Take one — the others will keep.',
    initiation: 'the world holds still and offers you a choice of how to spend yourself',
    success: 'you take the gift that fits the god you mean to become',
    failure: 'the moment of stillness passes with the gift unspent',
  }),
  poolBeatTemplate({
    id: 'beat.pool.select.shape_of_devotion',
    name: 'The Shape of Devotion',
    description:
      'Devotion can be shaped two ways, and the world is still soft enough to take either. You may wake a thing into a vessel of your will, to be carried where you cannot go; or you may open your eye wider on the living, reading the hidden grain of a soul like {name}\'s before you ever touch it. Choose the shape your attention prefers to take — for now.',
    initiation: 'devotion can be shaped two ways, and the world is soft enough for either',
    success: 'you choose the shape your attention will take',
    failure: 'the softness sets before you choose, and the shape is lost',
  }),
];

/**
 * All pool-beat content templates (THR-514). One per cadence-gated pool beat in
 * `ASCENDANT_BEAT_POOL`; `id === beatId` by convention. Resolved by
 * {@link getUnifiedTemplateById} (which checks this pool) and rendered, enriched, by
 * `AscendantBeatModal`. NOT part of `UNIFIED_ACTION_TEMPLATES` — see module header.
 */
export const ASCENDANT_POOL_BEAT_TEMPLATES: readonly UnifiedActionTemplate[] = [
  ...INTRODUCTION_TEMPLATES,
  ...INVESTMENT_TEMPLATES,
  ...SELECTION_TEMPLATES,
];
