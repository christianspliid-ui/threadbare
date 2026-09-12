/**
 * Remembrance mandate milestone prose — THR-1198.
 *
 * The campaign's spine is what the god remembers (ruled 2026-09-11). Every live
 * run's mandate is minted by `generateRememberedMandate`, so the ids that reach
 * `resolveMilestoneProse` are the two remembrance shapes — never a
 * `MANDATE_TEMPLATES` id:
 *
 * * `mandate.remembrance.{hunger}` — the identity path (`gameInit.ts:512`). The
 *   player picked a Hunger in remembrance; the mandate is derived from it. This
 *   is what every real playthrough holds.
 * * `mandate.remembrance.{primary}_{secondary}` — the identity-less path
 *   (`gameInit.ts:306`): the CLI, and a bare `?view=game` with no remembrance.
 *
 * ## Why two tables rather than one
 *
 * The pair form's key space is **132 ordered pairs** (12 spheres × 11), and no
 * pair-keyed table of that size could be authored honestly or kept true. The
 * sphere table keys on the *primary* sphere alone — 12 rows — because that is
 * what the remembrance mandate is actually about: `generateRememberedMandate`
 * names the mandate for the primary and asks the player to raise it. Every one
 * of the 132 pairs therefore resolves to an authored line, and the content stays
 * a set a person can read in one sitting.
 *
 * The hunger table is the richer one and takes precedence, because a Hunger says
 * what the god *wants*, which is a better beat than what sphere is rising.
 *
 * ## Register
 *
 * A mandate stage transition is a designated peak surface — the campaign spine,
 * a sibling of doom stage transitions (`Docs/canon/prose.md` § register model) —
 * written at the plain end of peak: short declaratives, at most one image, the
 * god addressed directly, no exclamation marks. GM narration reporting what the
 * world did, never the god's interior.
 *
 * Keys are authored **without** the `mandate.` namespace, matching what the
 * resolver's `toProseKeyPrefix` strips and what the mandate JSON loader keys on.
 */

/** Milestone prose for the 12 Hungers, keyed `remembrance.{hunger}.{transition}`. */
export const REMEMBRANCE_HUNGER_PROSE: Record<string, string> = {
  // ─── gather (life/spirit) — build a devoted community ───────────────
  'remembrance.gather.setup_to_escalation':
    'The first of them came to you, and stayed. Word travels the roads faster than you sent it. The flock has an edge now, and the edge is moving outward.',
  'remembrance.gather.escalation_to_culmination':
    'They no longer arrive alone. Families move, villages tilt toward your name. What began as shelter is becoming a claim on the world.',
  'remembrance.gather.completed':
    'Every soul you meant to hold is held. The world has learned where the lost go. Your flock has no edge left to find.',
  'remembrance.gather.failed':
    'The gathering scattered. The ones who came went home, or went elsewhere, or went nowhere at all. The shelter you built stands empty.',

  // ─── witness (mind/spirit) — an information network ─────────────────
  'remembrance.witness.setup_to_escalation':
    'The first threads of the network have taken. Somewhere a secret is moving toward you that nobody meant you to hear.',
  'remembrance.witness.escalation_to_culmination':
    'Little happens now that you do not hear twice. The silence between courts has begun to speak in your language.',
  'remembrance.witness.completed':
    'Nothing is hidden from you. Every whisper finds the silk and travels home. The world is transparent, and does not know it.',
  'remembrance.witness.failed':
    'The threads went slack. Your listeners stopped listening, or stopped being. The world keeps its secrets and you are outside them.',

  // ─── reclaim (force/time) — recover what was lost ───────────────────
  'remembrance.reclaim.setup_to_escalation':
    'The first ruin answered you. Old stone remembers what it was for, and the ground remembers who held it.',
  'remembrance.reclaim.escalation_to_culmination':
    'Buried things are surfacing faster than the living can bury them again. What was lost has become a debt the world has started to pay.',
  'remembrance.reclaim.completed':
    'What was taken is back. The ruins stand, the old wrongs are named, the forgotten power answers a living hand. The world owes you nothing further.',
  'remembrance.reclaim.failed':
    'The ruins stayed ruins. What was lost stayed lost. Time closed over the work like water over a stone.',

  // ─── reshape (force/mind) — transform cultures ─────────────────────
  'remembrance.reshape.setup_to_escalation':
    'A culture bent. Small things first: a law rewritten, a custom quietly dropped, nobody objecting yet.',
  'remembrance.reshape.escalation_to_culmination':
    'The changes are compounding. Whole regions do things your way now and have already forgotten there was another way.',
  'remembrance.reshape.completed':
    'The world wears your pattern. Its people teach their children customs you invented and call them ancient.',
  'remembrance.reshape.failed':
    'The old shapes held. Your changes were absorbed, softened, and finally forgotten. The world snapped back to what it was.',

  // ─── preserve (time/spirit) — hold back decay ──────────────────────
  'remembrance.preserve.setup_to_escalation':
    'The first decay has been halted. A library that should have burned did not. A tradition that should have died has one more year.',
  'remembrance.preserve.escalation_to_culmination':
    'You are outpacing rot on several fronts at once. What was going has stopped going.',
  'remembrance.preserve.completed':
    'What remains, remains. The knowledge is kept, the cultures hold their shape, entropy has been made to wait. Nothing more will be lost on your watch.',
  'remembrance.preserve.failed':
    'The rot won on schedule. The libraries thinned, the customs blurred, the names went out one by one. You slowed it, and nothing more.',

  // ─── kindle (energy/life) — ignite movements ───────────────────────
  'remembrance.kindle.setup_to_escalation':
    'Something caught. A movement that had no name last season has one now, and it is spreading.',
  'remembrance.kindle.escalation_to_culmination':
    'There are fires you did not start burning in your direction. Purpose has become contagious.',
  'remembrance.kindle.completed':
    'The world is alight with new purpose. What you kindled outgrew you and kept burning. Nothing here is sleeping any more.',
  'remembrance.kindle.failed':
    'The fires went out. What you lit burned bright and briefly and left the world colder than it was.',

  // ─── sever (entropy/mind) — break systems of control ───────────────
  'remembrance.sever.setup_to_escalation':
    'The first covenant broke. What it held together is discovering that it can move.',
  'remembrance.sever.escalation_to_culmination':
    'The bindings are failing faster than they can be retied. Old powers are spending everything they have on knots.',
  'remembrance.sever.completed':
    'The systems are down. No covenant, no faction, no inherited order holds what it used to hold. The world is loose.',
  'remembrance.sever.failed':
    'The knots held. What you cut was retied by hands you never saw. The machinery grinds on, and it has learned your name.',

  // ─── bind (matter/mind) — an unbreakable covenant ──────────────────
  'remembrance.bind.setup_to_escalation':
    'The first covenant holds. Two powers that would have gone to war have signed instead.',
  'remembrance.bind.escalation_to_culmination':
    'The agreement is spreading past its signatories. Factions are keeping terms that nobody is enforcing.',
  'remembrance.bind.completed':
    'The covenant holds across the world. Order is not imposed here. It is kept, by people who chose it and will not be moved.',
  'remembrance.bind.failed':
    'The covenant broke. The signatures meant nothing, and what you bound came apart along the old seams.',

  // ─── wander (energy/time) — walk the edges ─────────────────────────
  'remembrance.wander.setup_to_escalation':
    'The first blank places have names. What was edge is now map.',
  'remembrance.wander.escalation_to_culmination':
    'The unknown is shrinking on every side. Your roads go where roads did not.',
  'remembrance.wander.completed':
    'No corner is unwalked. Every hidden place is found, every edge crossed. The world has no outside left.',
  'remembrance.wander.failed':
    'The map stayed blank. The far places kept their distance, and the roads you walked closed behind you.',

  // ─── consume (entropy/force) — absorb rival power ──────────────────
  'remembrance.consume.setup_to_escalation':
    'The first territory is inside you. What was a rival’s is a possession.',
  'remembrance.consume.escalation_to_culmination':
    'Your domain is eating the space between borders. Rivals are spending their strength staying whole.',
  'remembrance.consume.completed':
    'Nothing remains outside your domain. What was rival power is your power. There is no edge left to expand toward.',
  'remembrance.consume.failed':
    'The expansion stalled, then reversed. What you swallowed came back up. Your rivals kept theirs, and took some of yours.',

  // ─── haunt (spirit/darkness) — rule unseen ─────────────────────────
  'remembrance.haunt.setup_to_escalation':
    'The dreams have started. Somewhere a stranger woke with your sign in their head and no idea why.',
  'remembrance.haunt.escalation_to_culmination':
    'The omens are being read now, and read correctly. You are a presence in rooms you have never entered.',
  'remembrance.haunt.completed':
    'The world is haunted. Every sleeper dreams toward you, every omen points home. You rule without once being seen.',
  'remembrance.haunt.failed':
    'The dreams thinned to nothing. Omens went unread, then unnoticed. The world forgot it was being watched.',

  // ─── illuminate (light/order) — bring truth to light ───────────────
  'remembrance.illuminate.setup_to_escalation':
    'The first lie is public. A corruption that ran for generations has a name and a witness.',
  'remembrance.illuminate.escalation_to_culmination':
    'The exposures are compounding. What was hidden is now expected to be found.',
  'remembrance.illuminate.completed':
    'The hidden is visible. Corruption has nowhere to sit, and the truth is no longer a favor anyone can withhold.',
  'remembrance.illuminate.failed':
    'The light did not hold. What you exposed was buried again under better lies, and the ones who helped you are not answering.',
};

/**
 * Milestone prose for the 12 Spheres, keyed `remembrance.sphere.{sphere}.{transition}`.
 *
 * Reached when the mandate id carries no Hunger — the identity-less path, whose
 * id is `remembrance.{primary}_{secondary}`. Keyed on the primary because that is
 * the sphere the mandate is named for and asks the god to raise.
 */
export const REMEMBRANCE_SPHERE_PROSE: Record<string, string> = {
  // ─── Foundation spheres ────────────────────────────────────────────
  'remembrance.sphere.chaos.setup_to_escalation':
    'Chaos found its opening. Patterns that held for centuries are slipping, and nobody can say when it started.',
  'remembrance.sphere.chaos.escalation_to_culmination':
    'The world is improvising. Plans fail in ways no one predicted, and the failures are spreading.',
  'remembrance.sphere.chaos.completed':
    'Chaos runs the world. Nothing can be relied on and nothing can be stopped. Every door is unlocked, because there are no longer locks.',
  'remembrance.sphere.chaos.failed':
    'Order reasserted itself. The slippage was catalogued, corrected, closed. The world is predictable again, and you are not in it.',

  'remembrance.sphere.order.setup_to_escalation':
    'Order is taking. Schedules are kept, borders honored, the arbitrary quietly retired.',
  'remembrance.sphere.order.escalation_to_culmination':
    'The world is becoming legible. What was custom is law, and the law is obeyed without being watched.',
  'remembrance.sphere.order.completed':
    'Order is the world’s default. Everything has a place and stays in it. Nothing here happens by accident.',
  'remembrance.sphere.order.failed':
    'The structures came apart. What you ordered drifted, then argued, then broke. The world went back to improvising.',

  'remembrance.sphere.light.setup_to_escalation':
    'Light is gaining. Dark ground is being crossed at night now, which is new.',
  'remembrance.sphere.light.escalation_to_culmination':
    'The lit ground is winning. What sheltered in shadow is moving, or being found.',
  'remembrance.sphere.light.completed':
    'There is light everywhere. Nothing hides, and nothing needs to. The world’s night is a short and well-lit thing.',
  'remembrance.sphere.light.failed':
    'The light receded. The dark places widened and rejoined one another. Ground you held is unlit again.',

  'remembrance.sphere.darkness.setup_to_escalation':
    'Darkness is spreading, patiently. Lamps burn later, and fewer people are out to see them.',
  'remembrance.sphere.darkness.escalation_to_culmination':
    'The dark has taken the roads. Travel happens in daylight now, or not at all.',
  'remembrance.sphere.darkness.completed':
    'The world belongs to the dark. Light is a thing people carry briefly, and it does not reach far. Everything that matters happens unseen.',
  'remembrance.sphere.darkness.failed':
    'The dark was pushed back. Lamps went up where you had put them out, and the roads are busy again at dusk.',

  // ─── Creation spheres ──────────────────────────────────────────────
  'remembrance.sphere.force.setup_to_escalation':
    'Force is answering. Things move because they are pushed, and the pushing works.',
  'remembrance.sphere.force.escalation_to_culmination':
    'Strength is the argument that wins. Walls come down, rivers are turned, objections are outlasted.',
  'remembrance.sphere.force.completed':
    'Force decides everything. What is willed is moved. The world has stopped asking whether a thing is possible.',
  'remembrance.sphere.force.failed':
    'The strength drained out. The pushes stopped landing. What you moved has settled back where it always was.',

  'remembrance.sphere.matter.setup_to_escalation':
    'Matter is thickening. Stone sets harder, walls stand longer, the built world is getting heavier.',
  'remembrance.sphere.matter.escalation_to_culmination':
    'Permanence is winning. What is made now outlives its makers as a matter of course.',
  'remembrance.sphere.matter.completed':
    'The world is solid through. Everything built stands, everything standing holds. Nothing here is provisional.',
  'remembrance.sphere.matter.failed':
    'The solidity failed. What was raised has cracked and settled. The world went back to being temporary.',

  'remembrance.sphere.energy.setup_to_escalation':
    'Energy is rising. Things run hotter and longer than they should, and nobody is complaining yet.',
  'remembrance.sphere.energy.escalation_to_culmination':
    'The world is accelerating. What took a season takes a week, and nobody is resting.',
  'remembrance.sphere.energy.completed':
    'Energy saturates everything. The world does not slow and does not stop. Its pace is your pace now.',
  'remembrance.sphere.energy.failed':
    'The world cooled. The quick seasons ended, the momentum bled away, and everything takes as long as it ever did.',

  'remembrance.sphere.life.setup_to_escalation':
    'Life is gaining ground. Harvests come in heavy, and the herds are larger than the counts.',
  'remembrance.sphere.life.escalation_to_culmination':
    'Growth is outrunning the record-keepers. Where there was one village there are three.',
  'remembrance.sphere.life.completed':
    'Life has filled the world. Every viable place is inhabited, every field bears, nothing fallow stays fallow.',
  'remembrance.sphere.life.failed':
    'The growth reversed. Fields thinned, herds shrank, villages folded into fewer and smaller ones. The world has room again.',

  'remembrance.sphere.mind.setup_to_escalation':
    'Mind is sharpening. Questions are being asked that were not asked last year.',
  'remembrance.sphere.mind.escalation_to_culmination':
    'Knowledge compounds now. Every answer opens three more, and somebody is writing all of them down.',
  'remembrance.sphere.mind.completed':
    'The world thinks. Nothing goes unexamined, nothing stays a mystery long. Understanding is the default state.',
  'remembrance.sphere.mind.failed':
    'The thinking stopped. Questions went unasked, records went unread, and what was understood is understood by fewer people each year.',

  'remembrance.sphere.spirit.setup_to_escalation':
    'Spirit is stirring. People are dreaming in common and do not know why.',
  'remembrance.sphere.spirit.escalation_to_culmination':
    'The unseen has weight now. Shrines are tended, omens argued over, the dead consulted before the living.',
  'remembrance.sphere.spirit.completed':
    'The spirit world is the real one. The living move carefully, listen more than they speak, and never assume they are alone.',
  'remembrance.sphere.spirit.failed':
    'The spirit thinned to nothing. The shrines are empty, the dreams are private again, and the dead have stopped being asked.',

  'remembrance.sphere.time.setup_to_escalation':
    'Time is settling into a pattern. Cycles that ran ragged have become reliable.',
  'remembrance.sphere.time.escalation_to_culmination':
    'Continuity is holding across generations. What is begun now is finished by somebody’s grandchildren, as planned.',
  'remembrance.sphere.time.completed':
    'Time runs straight and runs with you. Nothing is lost between the generations. The world remembers everything it has been.',
  'remembrance.sphere.time.failed':
    'The thread of it snapped. Generations stopped handing things on, and the world forgot faster than it learned.',

  'remembrance.sphere.entropy.setup_to_escalation':
    'Entropy has taken hold. Things are wearing out ahead of schedule.',
  'remembrance.sphere.entropy.escalation_to_culmination':
    'The decay is outpacing repair. What is mended fails again, sooner.',
  'remembrance.sphere.entropy.completed':
    'Entropy governs. Everything is coming apart at its own pace and nothing is being rebuilt. The world is winding down exactly as you meant it to.',
  'remembrance.sphere.entropy.failed':
    'The decay was arrested. Repairs held, rot was cut out, and the world is in better condition than when you began.',
};

/**
 * The merged remembrance prose map — the production input to
 * `resolveMilestoneProse`. Hunger keys and sphere keys share one namespace and
 * cannot collide: sphere keys carry the `sphere.` segment, and no Hunger id is
 * `sphere`.
 */
export const REMEMBRANCE_MILESTONE_PROSE: Record<string, string> = {
  ...REMEMBRANCE_HUNGER_PROSE,
  ...REMEMBRANCE_SPHERE_PROSE,
};
