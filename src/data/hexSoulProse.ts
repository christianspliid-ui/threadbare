/**
 * Hex Soul Prose Registry — per-hex sphere affinity prose descriptions.
 *
 * Used by HexChronicle's Soul layer to describe the spiritual character of a
 * specific hex tile based on its SphereAffinity scores.
 *
 * Three registries:
 *   SOUL_PROSE         — dominant sphere at 4 intensity levels
 *   SOUL_SECONDARY_PROSE — secondary sphere addendum (second-highest score)
 *   SOUL_THREAT_PROSE  — opposing sphere pressure at low/high severity
 *
 * Prose strings use **SphereName** markers for IPK (ProseKeyword) rendering.
 *
 * Design doc: Docs/plans/2026-03-28-world-soul-connection-design.md
 */

import type { SphereName } from '../types';

export type HexSoulLevel = 'weak' | 'moderate' | 'strong' | 'dominant';
export type ThreatLevel = 'low' | 'high';

// ─── Dominant Sphere Prose ────────────────────────────────────────────────────

export const SOUL_PROSE: Record<SphereName, Record<HexSoulLevel, string>> = {
  // Foundation Spheres
  chaos: {
    weak: 'Something here resists certainty — paths shift, and plans feel fragile.',
    moderate: 'The influence of **Chaos** touches this land. Nothing stays fixed for long.',
    strong: '**Chaos** runs deep here — the landscape itself seems to rearrange when no one is watching.',
    dominant:
      'This is a place of deep **Chaos** — unfixed, unpredictable, and alive with dangerous possibility.',
  },
  order: {
    weak: 'There is a quiet regularity to this place — things fall into pattern easily.',
    moderate: 'The weight of **Order** settles here. Boundaries hold, and change comes slowly.',
    strong:
      '**Order** is strong in this place. The land obeys rules older than memory, and deviation carries cost.',
    dominant:
      'This is a place of deep **Order** — rigid, enduring, and absolute. What is built here lasts, but what is new struggles to take root.',
  },
  light: {
    weak: 'The air here feels clear — secrets seem harder to keep.',
    moderate: 'The touch of **Light** rests on this land. Hidden things surface, and truth carries weight.',
    strong:
      '**Light** blazes through this place. Nothing hides, nothing festers unseen.',
    dominant:
      'This is a place of deep **Light** — exposed, clarified, and merciless in its honesty. Every shadow is burned away.',
  },
  darkness: {
    weak: 'Shadows linger here longer than they should.',
    moderate: 'The presence of **Darkness** deepens this land. Secrets take root, and the unseen grows strong.',
    strong:
      '**Darkness** saturates this place. The hidden is more powerful than the known, and trust comes hard.',
    dominant:
      'This is a place of deep **Darkness** — veiled, uncertain, and layered with secrets that may never surface.',
  },
  // Creation Spheres
  force: {
    weak: 'A faint martial restlessness lingers here — old battles, not yet forgotten.',
    moderate: 'The currents of **Force** run through this land. Conflict finds easy footing.',
    strong: '**Force** flows strong here — the earth itself seems to lean toward struggle.',
    dominant:
      'This is a place of deep **Force** — ancient, contested, and unyielding. War has left its mark on every stone.',
  },
  matter: {
    weak: 'There is something solid and enduring about this land, as if the earth itself remembers.',
    moderate: 'The weight of **Matter** settles here — stone does not crumble, and what is built holds.',
    strong:
      '**Matter** runs deep through this place. The ground is ancient, the rock is dense, and craft finds easy footing.',
    dominant:
      'This is a place of deep **Matter** — immovable, enduring, and heavy with permanence. The land outlasts everything.',
  },
  energy: {
    weak: 'There is an undertow of movement here — a restlessness the wind carries.',
    moderate: 'The pulse of **Energy** flows through this land. Trade and travel find paths others miss.',
    strong: '**Energy** crackles through this place. Motion is easy, stillness is difficult.',
    dominant:
      'This is a place of deep **Energy** — vibrant, relentless, and alive with possibility. Nothing stays the same for long.',
  },
  life: {
    weak: 'A faint green pulse stirs beneath the soil.',
    moderate: 'The currents of **Life** run through this land.',
    strong: '**Life** flows strong here — the earth itself breathes.',
    dominant:
      'This is a place of deep **Life** — ancient, rooted, and unyielding. Even the stones seem to grow.',
  },
  mind: {
    weak: 'The air here feels sharp, as if it asks questions.',
    moderate: 'The clarity of **Mind** seeps through this land. Thought sharpens, memory holds.',
    strong:
      '**Mind** is vivid here — scholars gravitate to this place, and secrets have a way of surfacing.',
    dominant:
      'This is a place of deep **Mind** — every wall has heard a theory, every road has carried an argument.',
  },
  spirit: {
    weak: 'The veil seems thinner here. Something just outside of sight listens.',
    moderate: 'The influence of **Spirit** touches this land. Prayers echo differently. Dreams speak plainly.',
    strong: '**Spirit** moves strongly through this place. The unseen is close, and sometimes it answers.',
    dominant:
      'This is a place of deep **Spirit** — sacred, haunted, or both. The gods have walked here, and they left something behind.',
  },
  time: {
    weak: 'The land here feels older than it should. Something repeats.',
    moderate:
      'The depth of **Time** is felt in this place. Memory runs long, and the past has weight here.',
    strong:
      '**Time** saturates this land. The old cycles press against the present. What came before echoes forward.',
    dominant:
      'This is a place of deep **Time** — layered, inevitable, and patient. What was foretold here has not yet finished.',
  },
  entropy: {
    weak: 'Something at the edges of this place has begun to unravel.',
    moderate: 'The touch of **Entropy** is present here — slow, patient, and hungry.',
    strong:
      '**Entropy** has taken hold. The old orders break down. What endures does so despite everything.',
    dominant:
      'This is a place of deep **Entropy** — broken, dissolving, and magnificent in its ruin. Something new may yet grow here, or nothing will.',
  },
};

// ─── Secondary Sphere Addendum ────────────────────────────────────────────────

export const SOUL_SECONDARY_PROSE: Record<SphereName, string> = {
  // Foundation Spheres
  chaos: 'A quiet note of **Chaos** hums beneath the surface — nothing here is entirely settled.',
  order: 'The presence of **Order** steadies this place — a secondary structure beneath the primary current.',
  light: 'A trace of **Light** moves here as well — an undercurrent of clarity and exposure.',
  darkness: 'A quiet veil of **Darkness** lingers beneath the surface — secrets find shelter here.',
  // Creation Spheres
  force: 'A quiet resonance of **Force** hums beneath the surface — tension held in check.',
  matter: 'The presence of **Matter** grounds this place — a steadiness beneath the primary current.',
  energy: 'A quiet current of **Energy** moves through, lending restlessness to the dominant character.',
  life: 'A quiet resonance of **Life** hums beneath the surface, insistent and patient.',
  mind: 'The presence of **Mind** lends a certain sharpness to the air — an observant quality.',
  spirit: 'A trace of **Spirit** moves here as well — a secondary hum of the unseen.',
  time: 'The presence of **Time** deepens this place — a weight of old days beneath the surface.',
  entropy: 'A note of **Entropy** threads through, suggesting that nothing here is entirely permanent.',
};

// ─── Threat Prose (opposing sphere pressure) ─────────────────────────────────

export const SOUL_THREAT_PROSE: Record<SphereName, Record<ThreatLevel, string>> = {
  // Foundation Spheres
  chaos: {
    low: 'A restless tremor disturbs the settled order here.',
    high: '**Chaos** presses hard against this land — certainties crack, and familiar patterns begin to dissolve.',
  },
  order: {
    low: 'Something rigid is hardening at the edges of this place.',
    high: '**Order** bears down on this land. Freedom contracts, and the weight of law grows heavy.',
  },
  light: {
    low: 'A probing clarity begins to strip away comfortable shadows.',
    high: '**Light** presses hard against this land — there is nowhere left to hide, and exposure carries its own cruelty.',
  },
  darkness: {
    low: 'Shadows are deepening where they should not.',
    high: '**Darkness** encroaches on this land. Certainty fades, and what was known becomes doubtful.',
  },
  // Creation Spheres
  force: {
    low: 'A distant drumbeat hints at coming conflict.',
    high: '**Force** presses hard against this land — tension approaches a breaking point.',
  },
  matter: {
    low: 'Something rigid begins to resist the natural flow here.',
    high: '**Matter** bears down on this place. Change becomes costly, and the old forms resist transformation.',
  },
  energy: {
    low: 'A restless current disturbs the steadiness of the land.',
    high: '**Energy** surges against this place, threatening to scatter what was built.',
  },
  life: {
    low: 'The growing things press at the borders here.',
    high: '**Life** pushes hard against this land — forest, vine, and root demand their territory back.',
  },
  mind: {
    low: 'Questions without answers have begun to accumulate.',
    high: '**Mind** cuts into this place — old certainties are questioned, and some truths have been found wanting.',
  },
  spirit: {
    low: 'Something just outside of sight circles this land with growing interest.',
    high: '**Spirit** presses against the veil here. The boundary between worlds is dangerously thin.',
  },
  time: {
    low: 'Something dark gnaws at the edges.',
    high: '**Entropy** presses hard against this land\'s defenses. The unravelling is patient, but close.',
  },
  entropy: {
    low: 'Something dark gnaws at the edges.',
    high: '**Entropy** presses hard against this land\'s defenses. The unravelling is patient, but close.',
  },
};
