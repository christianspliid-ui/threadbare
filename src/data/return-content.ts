/**
 * Return content — prose for the 6 Return outcomes and ripple consequences.
 *
 * TB-035 Phase 3. Each outcome gets rich narrative prose.
 * Ripple consequences describe secondary effects on the First's connections.
 *
 * Phase 6 will expand this with per-archetype variants and
 * sphere-filtered god voice overlays.
 */

import type { ReturnOutcome } from '../types/returnEngine';

// ─── Return Outcome Prose ──────────────────────────────────────────

/**
 * Rich prose for each Return outcome. {name} is replaced with the agent's name.
 * Phase 3 starter set — one per outcome.
 * Phase 6 target: ~10 per outcome (archetype-grouped).
 */
export const RETURN_OUTCOME_PROSE: Record<ReturnOutcome, string> = {
  loyal_ascension:
    'The thread between god and mortal blazes white — and then transforms. {name} rises, ' +
    'not as the uncertain soul who first answered the call, but as something new. Divine ' +
    'power settles into their bones like an old friend coming home. The mortal shell does ' +
    'not break — it expands. Where once there was a champion, now there stands a young god, ' +
    'loyal and luminous, ready to walk beside the one who wove their fate.',

  sacrifice:
    'In the end, {name} chooses what no one should have to choose. The sacrifice is not ' +
    'dramatic — there is no great explosion of light, no triumphant last stand. There is ' +
    'only a quiet decision, made with clear eyes and steady hands. The thread snaps clean. ' +
    'Where they fall, the ground remembers. The air tastes of something sacred. Nothing will ' +
    'ever grow quite the same in this place — and nothing should.',

  vanishing:
    'One morning, {name} is simply gone. No farewell, no dramatic departure. The thread ' +
    'hangs loose, untethered, reaching for someone who has already walked beyond its reach. ' +
    'Perhaps they found something more important than destiny. Perhaps the weight of divine ' +
    'attention finally became too much to carry. The god searches, briefly, but the mortal ' +
    'world is vast and {name} does not wish to be found.',

  transcendence:
    '{name} does not die and does not ascend — they become. The boundary between mortal ' +
    'and immortal dissolves like morning frost, and what remains is neither person nor god ' +
    'but something older than both. A genius loci, a spirit of place, an eternal guardian ' +
    'woven into the land itself. Their voice is in the wind now. Their heartbeat is the ' +
    'rhythm of the seasons. The thread does not sever — it roots itself in the earth.',

  usurper:
    'The betrayal, when it comes, is almost elegant. {name} does not rage or weep — they ' +
    'simply reach for the thread of fate and pull it toward themselves. The divine power ' +
    'that was lent is seized, claimed, made their own. A new Ascendant is born — not ' +
    'from devotion but from ambition, not from gratitude but from hunger. They meet their ' +
    'former patron\'s gaze with eyes that burn with stolen fire, and they do not look away.',

  monster:
    'Something breaks in {name} — or perhaps something that was always broken finally ' +
    'tears free. The divine power that was meant to elevate instead corrupts, twisting ' +
    'purpose into obsession and strength into savagery. What stands in their place is ' +
    'recognizable but wrong, like a familiar face reflected in dark water. The thread ' +
    'withers. The god watches their creation walk into the darkness and knows: this one ' +
    'is their responsibility, and their shame.',
};

// ─── Ripple Consequence Prose ──────────────────────────────────────

/**
 * Prose templates for ripple consequences.
 * Keys: "{outcome}_{targetType}" or "{outcome}_default".
 * {name} = First's name, {target} = target entity name.
 */
export const RIPPLE_CONSEQUENCE_PROSE: Record<string, string> = {
  // ── Sacrifice ──
  sacrifice_artifact:
    'The {target} rests upon the altar where {name} fell. It will never be lifted again — ' +
    'or so they say. Some relics are more powerful as symbols than as weapons.',
  sacrifice_ally:
    '{target} carries the grief like a second skin. They speak of {name} rarely, and when ' +
    'they do, it is with the careful reverence of someone tending a flame that must not go out.',
  sacrifice_spouse:
    'The loss carves something permanent into {target}. Not weakness — something harder. ' +
    'They inherit what {name} left behind and carry it with a quiet ferocity that dares ' +
    'the world to take anything else.',
  sacrifice_faction:
    'The {target} transforms overnight. What was an organization becomes a memorial order, ' +
    'its purpose reshaped by the sacrifice of its leader. The name of {name} becomes a prayer.',
  sacrifice_location:
    'The ground where {name} fell becomes sacred. Pilgrims come. The {target} is changed — ' +
    'not by decree but by the weight of what happened here.',
  sacrifice_default:
    'The echo of {name}\'s sacrifice ripples outward, touching {target} in ways that will ' +
    'take years to fully understand.',

  // ── Usurper ──
  usurper_artifact:
    '{name} keeps the {target}, but it changes in their hands — darker, hungrier. Tools ' +
    'reflect their wielders, and this one now serves a usurper\'s ambition.',
  usurper_ally:
    '{target} must choose: follow {name} into rebellion, or remain loyal to the god who ' +
    'made them both. There is no comfortable middle ground.',
  usurper_spouse:
    'The betrayal cuts {target} deepest. They loved {name} before the ambition consumed them. ' +
    'Now they must decide what that love is worth.',
  usurper_faction:
    'The {target} fractures. Half follow {name} into their new divine claim. Half remain ' +
    'loyal to the old patron. Civil war is not declared — it simply begins.',
  usurper_location:
    '{target} becomes contested territory — a place where two divine claims overlap and ' +
    'neither yields.',
  usurper_default:
    '{name}\'s usurpation sends shockwaves through {target}. Loyalties are tested. Nothing ' +
    'is certain.',

  // ── Monster ──
  monster_artifact:
    'The {target} twists in {name}\'s grip, its purpose corrupted by the darkness that ' +
    'now drives its wielder. What was once a tool of creation becomes an instrument of terror.',
  monster_ally:
    '{target} was the first to sense the change — and the first to flee. The creature ' +
    'that {name} has become has no use for allies, only prey.',
  monster_spouse:
    '{target} is the monster\'s first target — not out of malice, but because {name} ' +
    'remembers just enough to know that this person once mattered. The memory is a wound ' +
    'the monster cannot stop picking at.',
  monster_faction:
    'The members of {target} scatter like birds from a burning tree. Their leader has become ' +
    'something beyond loyalty or reason.',
  monster_location:
    '{target} becomes a place of dread. The shadow of {name} hangs over it like a bruise ' +
    'on the sky. Travelers learn to go around.',
  monster_default:
    'The monster that was {name} casts a long shadow over {target}.',

  // ── Loyal Ascension ──
  loyal_ascension_artifact:
    'The {target} hums with renewed purpose in {name}\'s ascended hands — a mortal tool ' +
    'now wielded by a young god.',
  loyal_ascension_ally:
    '{target} watches their friend rise beyond mortality with a mix of pride and loss. ' +
    'The bond endures, but the distance between mortal and divine is real.',
  loyal_ascension_faction:
    'The {target} basks in the reflected glory. Their leader has become divine — and their ' +
    'purpose has never been clearer.',
  loyal_ascension_location:
    '{target} becomes a place of divine favor, blessed by the presence of a new Ascendant ' +
    'who remembers being mortal.',
  loyal_ascension_default:
    '{name}\'s ascension ripples through {target} like light through stained glass.',

  // ── Transcendence ──
  transcendence_artifact:
    'The {target} dissolves into the land alongside {name}, becoming part of the genius loci. ' +
    'Its power is now woven into the very earth.',
  transcendence_ally:
    '{target} sometimes hears {name}\'s voice in the wind. Not words — just presence. ' +
    'The friendship transcended mortality, and it transcends this too.',
  transcendence_location:
    '{target} becomes the heart of {name}\'s domain — a place where the genius loci is ' +
    'strongest, where the seasons answer to a will that was once human.',
  transcendence_default:
    '{name}\'s transcendence touches {target} like rain on old stone — gentle, permanent.',

  // ── Vanishing ──
  vanishing_artifact:
    '{name} left the {target} behind. It sits where they placed it, waiting for hands ' +
    'that will never return.',
  vanishing_ally:
    '{target} searches for {name} — at first desperately, then dutifully, then not at all. ' +
    'Some departures are their own kind of answer.',
  vanishing_spouse:
    '{target} wakes to an empty bed and a silence that never fully lifts. {name} left ' +
    'nothing behind — not even an explanation.',
  vanishing_faction:
    'The {target} carries on without their leader. The work does not stop because one ' +
    'person chose to vanish from the story.',
  vanishing_default:
    '{name}\'s absence touches {target} — a hole in the world where someone used to be.',
};
