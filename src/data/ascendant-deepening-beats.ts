/**
 * Deepening Beat content — god-side tier-crossing vignettes (THR-613, plan §4.1, Slice 2).
 *
 * Slice 1 (engine substrate) taught the ascendant to accrue `reachPractice` in its two
 * permanent reaches and, on an upward Domain Capability tier crossing, to enqueue a
 * Deepening beat (`beat.deepening.<reach>`, {@link deepeningBeatIdForReach}) into the
 * Director's `pending` slot. But the beat had no catalogue entry, so `resolvePendingBeat`
 * skipped it as `missing_template` and the vignette never reached the player.
 *
 * This module is the content half: the eight `BeatDefinition`s (one per Reach, so no
 * identity ships with a dead Deepening path — the same correctness property that governs
 * the reach-signature matrix) plus their authored per-reach presentation prose. The
 * `ascendantBeat.ts` catalogue lookup (`findBeatDefinition` / `forceOfferBeatById`)
 * consults `ASCENDANT_DEEPENING_BEATS` so an enqueued Deepening beat resolves (Slice 2).
 * Surfacing `DEEPENING_BEAT_PRESENTATION` in `AscendantBeatModal` — replacing the generic
 * `KIND_PRESENTATION.deepening` copy with the reach-flavored vignette — is Slice 3 (the
 * plan's "Deepening modal wiring"); until then the modal renders the shipped generic copy.
 *
 * GRANT NOTE (plan §4.1 vs. current catalogue). A Deepening beat grants **no** action card
 * in v1. The reward is the *tier-up itself* — already applied by `phaseAscendantProgression`
 * feeding `reachPractice` through the Domain-Capability sigmoid — which makes deeper
 * tier-gated templates in the same reach newly reachable. The plan's "offer a choice of one
 * tier-appropriate {reach} card (or hold)" needs per-tier reach-card content that does not
 * exist in the catalogue yet (the only reach-gated cards today are the eight signatures,
 * already granted by the acquisition beats — re-offering one would be a no-op reveal that
 * lies about a card the god already holds). The card-choice picker + per-tier reach cards are
 * deferred to Slice 3 (modal card-choice grammar) + a content tail. So the beats stay
 * prose-first and grant nothing — honest, and never a fake reveal.
 *
 * VOICE (THR-609 plain register). Second-person, player-as-god, indirect intervention (you
 * lean, you press — never command). Deterministic and identical every run, so the prose
 * carries no `enrichProse` placeholders and never states "+1 tier" — the growth is narrated,
 * not counted.
 */

import type { BeatDefinition } from '../types/ascendantBeat';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import { deepeningBeatIdForReach } from './player-progression';
import type { SpineBeatPresentation } from './ascendant-beat-content';

/**
 * The eight Deepening beats — one per Reach. `kind: 'deepening'`; `identity: { reach }`
 * so any Director-side treatment (there is none today — the beat is enqueued directly by
 * `phaseAscendantProgression`, bypassing the cadence draw) would bias by the god's affinity.
 * No `grantsActionIds` (see the GRANT NOTE above); no `templateId` (presentation is the
 * authored map below, not an `enrichProse` template). The `trigger` matters only for a
 * `__DEBUG.fireBeat` force-offer — it is `{ kind: 'turn' }` so a dev fire is unconditional.
 */
export const ASCENDANT_DEEPENING_BEATS: readonly BeatDefinition[] = REACH_DOMAINS.map(
  (reach): BeatDefinition => ({
    beatId: deepeningBeatIdForReach(reach),
    kind: 'deepening',
    trigger: { kind: 'turn' },
    identity: { reach },
  }),
);

/** Look a Deepening beat up by id. Null when the id is not a `beat.deepening.<reach>`. */
export function getDeepeningBeatById(beatId: string): BeatDefinition | null {
  return ASCENDANT_DEEPENING_BEATS.find(b => b.beatId === beatId) ?? null;
}

/**
 * Authored per-reach presentation for each Deepening beat, keyed by `beatId`. Slice 3's
 * modal wiring reads this in place of the generic `KIND_PRESENTATION.deepening` copy.
 * Plain register (THR-609), never "+1": each vignette names a *concrete* deepening of the
 * god's reach — a shield-wall that now holds, a debt that now binds, a road that now lasts.
 */
export const DEEPENING_BEAT_PRESENTATION: Readonly<Record<string, SpineBeatPresentation>> = {
  'beat.deepening.iron': {
    eyebrow: 'A Deepening',
    title: 'The Iron in Your Voice',
    prose:
      'The world has learned the shape of your will in war. Where once your urging only stiffened a captain’s nerve, now whole shield-walls hold when you turn your gaze along them. In this, at least, the world has decided you are to be obeyed.',
    cta: 'Receive',
  },
  'beat.deepening.gold': {
    eyebrow: 'A Deepening',
    title: 'The Weight of Your Favor',
    prose:
      'Coin has begun to move the way you lean on it. A debt forgiven here, a caravan turned there — small pressures once, and easy to shrug off. No longer. Where your interest falls, markets bend toward it, and men call the bending their own good sense.',
    cta: 'Receive',
  },
  'beat.deepening.shadow': {
    eyebrow: 'A Deepening',
    title: 'The Reach of Your Whisper',
    prose:
      'Your secrets travel further than they did. A word set loose in the dark used to fade before it found a listening ear; now it arrives, and is believed, and is passed on. The hidden hands of the world have started to move when you tug their strings.',
    cta: 'Receive',
  },
  'beat.deepening.veil': {
    eyebrow: 'A Deepening',
    title: 'The Thinning of the Veil',
    prose:
      'The threshold between the seen world and the other has worn thin where you press on it. What once took all your attention to stir — a ward loosened, a gate held ajar — now answers a lighter touch. The between has grown used to your hand upon it.',
    cta: 'Receive',
  },
  'beat.deepening.heart': {
    eyebrow: 'A Deepening',
    title: 'The Pull of Your Devotion',
    prose:
      'Oaths sworn in your name hold tighter than they used to. Where once a vow to you was a fond hope, easily set aside, now it binds — mortals keep faith through hardship they would once have fled, and cannot always say why.',
    cta: 'Receive',
  },
  'beat.deepening.eye': {
    eyebrow: 'A Deepening',
    title: 'The Clarity of Your Sight',
    prose:
      'Less and less stays hidden from you. Doors that once cost you long watching now open at a glance — a face in a crowd, a lie beneath a courtesy, a road not yet walked. The world has fewer places left to keep its secrets.',
    cta: 'Receive',
  },
  'beat.deepening.stone': {
    eyebrow: 'A Deepening',
    title: 'The Endurance of Your Work',
    prose:
      'What you set your hand to lasts longer than it did. Walls raised under your regard settle deeper; a road, a hall, a boundary-stone — they hold their shape against the years now, as though the world had agreed to remember them for you.',
    cta: 'Receive',
  },
  'beat.deepening.star': {
    eyebrow: 'A Deepening',
    title: 'The Turn of Your Fate',
    prose:
      'The far pattern has begun to lean your way. Omens that once took all your strength to bend now tilt at a touch, and the long arc of things — who rises, what falls, which road a life takes — answers your intent a little more surely than before.',
    cta: 'Receive',
  },
};

/**
 * The chronicle line written when the god's Domain Capability rises a tier in `reach`
 * (plan §4.3). One sentence, plain register, reach-named. Consumed by
 * `phaseAscendantProgression` at the enqueue point (chronicle ↔ Deepening beat 1:1).
 */
export function deepeningChronicleProse(reach: ReachDomain): string {
  const named = reach.charAt(0).toUpperCase() + reach.slice(1);
  return `Your hand in ${named} deepened. Where once your will only leaned on the world, now the world holds a little more of the shape you give it.`;
}
