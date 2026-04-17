/**
 * Hidden Mark Revelation Prose — THR-132
 *
 * Two tables per HiddenMarkCategory:
 *  - HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE — dramatic, present-tense; surfaces when
 *    a matching encounter consumes the mark.
 *  - HIDDEN_MARK_DECAY_PROSE — elegiac, past-tense-leaning; surfaces when the
 *    mark has aged below the severity floor and is dropped.
 *
 * Authoring bar (see Docs/plans/2026-04-17-thr-132-mark-reveal-prose.md §C2):
 *  - Every template uses `{mark_label}` once (author-provided anchor).
 *  - Every template uses `{name}` at least once.
 *  - Every template uses at least one of `{location}`/`{their}`/`{they}`/`{them}` for enrichment.
 *  - 1–2 sentences, ≤200 chars.
 *  - Avoid literal category names (a betrayal template should evoke betrayal without saying "betrayal").
 *
 * Placeholder inventory: everything supported by `enrichProse()` in
 * `src/engine/proseEnrichment.ts`, plus the mark-local `{mark_label}`.
 */

import type { HiddenMarkCategory } from '../types/unifiedAction';

/** Fallback template used when a category table is missing or empty. */
export const MARK_PROSE_DEFAULT_TEMPLATE =
  'Something long buried rises up: {mark_label}. {name} cannot look away.';

/**
 * Encounter-reveal prose — present-tense, dramatic. Fires when a matching
 * encounter probabilistically consumes the mark.
 */
export const HIDDEN_MARK_ENCOUNTER_REVEAL_PROSE:
  Record<HiddenMarkCategory, readonly string[]> = {
  betrayal: [
    'The moment breaks open. {name} sees {their} own face in what {mark_label} exposes — and so does everyone else at {location}.',
    'A voice {name} thought silenced speaks {mark_label} aloud, and every head at {location} turns toward {them}.',
    "{name} tries to smile, but {mark_label} is already on everyone's tongue. The circle around {them} widens.",
    'Someone at {location} places {mark_label} between {them} and {name} like a blade laid on a table. No one moves.',
    "What {name} did to stay in {their} chair comes back as {mark_label}, delivered in front of the very people {they}'d most wanted to keep it from.",
  ],
  debt: [
    'A ledger {name} thought long-closed is reopened at {location}: {mark_label}. The tally waits.',
    'The hand on {name}\'s shoulder is polite. The voice is quiet. But {mark_label} is written in the air between {them}, and {they} will settle it now.',
    "{name}'s coin is refused. So is {their} apology. Only {mark_label} is acceptable, and the creditor at {location} has come in person to collect.",
    'A stranger reads {mark_label} from a folded paper as if reading a sentence. {name} has nothing to say that the paper does not already know.',
    "The door of {location} closes behind {name} and a soft voice says, 'About {mark_label}.' The room is very full and very quiet.",
  ],
  secret_knowledge: [
    'What {name} knew, {they} now know {they} know. {mark_label} — and the silence that held it cracks.',
    'A phrase drops into the conversation at {location} — {mark_label} — and {name} feels the floor tilt beneath {them}.',
    "Someone across the table names {mark_label} without looking up, and {name}'s hands go still around {their} cup.",
    '{name} hears {mark_label} spoken aloud for the first time, and realizes the speaker has been waiting to say it for years.',
    'The question comes in gently, the way a lockpick enters a lock. {mark_label}, asked of {name} at {location}, turns something {they} had buried.',
  ],
  concealed_action: [
    'The door {name} closed years ago swings open at {location}. Behind it: {mark_label}, still wet, still warm.',
    'A witness {name} thought long-dispersed stands up at {location} and recites {mark_label}, dates intact, hours accounted for.',
    "{name}'s story has holes in it now. {mark_label} fills them, and the shape that emerges is not flattering.",
    'A thing {name} left behind at the scene of {mark_label} has finally been brought into {their} presence at {location}. {They} recognize it immediately.',
    "The room at {location} is not accusing {name} of {mark_label}. Not yet. But {they} all know, and {name} can feel the knowing.",
  ],
  forbidden_contact: [
    '{name} cannot pretend anymore. The thread leads from {their} hand to {mark_label}, and it is visible now.',
    "Someone at {location} speaks the name of what {name} has been touching — {mark_label} — and the word lands like a struck bell.",
    'The company {name} has been keeping comes calling at {location}. {mark_label} is on {their} lips, and {they} do not bother to lower {their} voice.',
    "{name}'s excuses run out mid-sentence. {mark_label} sits between {them} and the room, and everyone has already done the arithmetic.",
    "A door {name} was certain no one knew about opens at {location}, and {mark_label} walks through it in broad daylight.",
  ],
  soul_diminishment: [
    'The hollow {name} has been carrying is suddenly weighed. {mark_label} surfaces, and {their} shadow is thinner than it should be.',
    'A priest at {location} goes pale mid-blessing. {mark_label} is what {they} have seen in {name}, and the word for it has no comfort attached.',
    "The light in {name}'s eyes does not quite match {their} smile anymore. {mark_label} is the reason, and someone at {location} has just said so aloud.",
    "{name} lifts a cup at {location} and notices {their} own hand from a great distance. {mark_label} is nearer than {they} are, now.",
    'A child at {location} will not come near {name}. {mark_label} is why, and the child has better instincts than the adults pretending not to see.',
  ],
  mystical_contract: [
    'The signature {name} made in the dark becomes legible at {location}. {mark_label} — and the counterparty is listening.',
    'A wind that should not be in {location} turns the candles. {mark_label} is being remembered, and {name} is the one who must answer.',
    "{name} feels the line {they} once signed pull taut. {mark_label}, and something at the far end of it has decided tonight is the night.",
    'The bargain {name} made comes to {location} wearing a face. {mark_label} is the greeting, and no introduction is needed.',
    "A symbol {name} hoped {they} had outgrown flickers in the lamplight of {location}. {mark_label}. The flame does not return to its former color.",
  ],
};

/**
 * Decay prose — elegiac, past-tense-leaning. Fires when a mark ages below the
 * severity floor and is dropped without having been consumed by an encounter.
 * Lower significance → logs to the chronicle without toasting.
 */
export const HIDDEN_MARK_DECAY_PROSE:
  Record<HiddenMarkCategory, readonly string[]> = {
  betrayal: [
    'Time did what accusation could not. {mark_label} has blurred into story, and {name} is the one telling it now.',
    'The people who remembered {mark_label} have moved on or moved away. {name} is no longer the center of that particular room.',
    "At {location}, no one mentions {mark_label} anymore. {name}'s face is {their} own again, or close enough to pass.",
    'The rumor of {mark_label} thinned the way rumors do, one careful silence at a time. {name} can walk into {location} without flinching now.',
    "{name} hears {their} own name in a conversation at {location} and the conversation is not about {mark_label}. {They} exhale for the first time in seasons.",
  ],
  debt: [
    "The creditor has died or forgotten. {mark_label} fades from {name}'s ledger, unreturned and uncollected.",
    'No one comes to {location} asking after {mark_label} any longer. {name} stops listening for the knock.',
    'The paper that named {mark_label} has been lost, burned, or misfiled. {name} is, quietly, released.',
    "{mark_label} ages out. The counterparty chose other fights, other grudges. {name} gets to keep {their} weight and {their} walk.",
    'An old collector dies at {location}, and with {them} goes the memory of {mark_label}. {name} sends no flowers.',
  ],
  secret_knowledge: [
    "No one asks anymore. {mark_label} has slipped beneath more recent weights, and {name} lets it go.",
    'A new wonder has come to {location}, and {mark_label} is an old story no one wants to hear. {name} stops rehearsing {their} answer.',
    "The one person who would have recognized {mark_label} in {name}'s eyes has moved on. {They} do not look back.",
    "{name} realizes at {location} that {they} have not thought about {mark_label} in weeks. The thought is lighter than {they} expected.",
    "Time has sanded {mark_label} down to a shape {name} can carry without noticing. {Their} step at {location} is lighter for it.",
  ],
  concealed_action: [
    "The witnesses are dead or departed. {mark_label} survives only in {name}'s sleep, and less and less even there.",
    "{name} passes the place where {mark_label} happened. {They} notice nothing in particular. {Their} feet have learned to keep walking.",
    "The evidence of {mark_label} has been weathered away at {location} — whether by rain or by people, {name} does not ask.",
    "A season changes at {location}, then another. {mark_label} is buried under small grasses now. {name} does not tend the spot.",
    "What {name} did at {mark_label} is no longer spoken of because no one remembers well enough to speak of it. {They} have outlived the story.",
  ],
  forbidden_contact: [
    "The thread frays. {mark_label} is no longer a rope {name} can be pulled by — only a memory of having once been tied.",
    "The company {name} kept has dispersed. {mark_label} cannot find {them} at {location} anymore, and stops looking.",
    "What {name} once touched has moved on to touch others. {mark_label} is someone else's problem now, and {name} is grateful for the silence.",
    'A letter that would have accused {name} of {mark_label} is written but never sent. The writer dies; the letter stays folded. {name} never knows.',
    "The door at {location} that led to {mark_label} has been bricked over or repurposed. {name} walks past it without looking.",
  ],
  soul_diminishment: [
    "{name}'s shadow is no thicker, but the world has forgotten to notice. {mark_label} fades into the common weight.",
    "The priests at {location} move on to fresher hollows. {mark_label} is old news now, and {name} blends back into the congregation.",
    "{name} has lived long enough alongside {mark_label} that {they} no longer think of {themself} as diminished — only as {name}.",
    "A child at {location} runs up and takes {name}'s hand without hesitation. {mark_label} has apparently lost its power to warn.",
    '{name} looks at {their} reflection and does not flinch. {mark_label} is still there, but {they} have grown around it like a tree around a stone.',
  ],
  mystical_contract: [
    "The counterparty has found someone easier. {mark_label} lapses, and {name} is released — quietly, without ceremony.",
    'The lamp in the old chapel at {location} goes out for good. {mark_label} is no longer watched over; no one comes to enforce it — not even against {name}.',
    "A clause expires. {name} does not learn which one, only that {mark_label} has stopped pressing at the back of {their} thoughts.",
    'The symbol {name} feared has weathered off the stone at {location}. {mark_label} is, in some legal sense {they} do not understand, void.',
    "Whatever once held {name} to {mark_label} has turned its attention elsewhere. The air at {location} feels, for the first time in years, merely ordinary.",
  ],
};
