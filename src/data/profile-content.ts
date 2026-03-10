/**
 * Profile Content Package — quotes, backstory templates, and sphere flavor text.
 *
 * These templates are used by the profile generator to create memorable
 * character quotes and backstories in the Threadbare aesthetic: dark world,
 * hidden magic, wonder layered over grief, mythic and poetic.
 *
 * Source: Docs/plans/2026-03-08-progressive-disclosure-design.md (Task 4)
 */

// ─── §1. Quote Templates ──────────────────────────────────────────────────────

export const QUOTE_TEMPLATES = [
  // Philosophical — power, weaving, fate
  '{name} once said: "Power is not taken — it is woven in the {sphere}, thread by thread, from the silence between words."',
  '"The {sphere} teaches patience," {name} was known to say. "Even the longest night ends."',
  '"I did not choose this path," {name} once confessed. "The path chose me, and I was too {value} to refuse."',
  '"{name} once warned: The threads of fate are thinner than you think in the {sphere}. Pull too hard and they snap."',
  '"{name} asked: What is a kingdom but a {value} story that enough people believe?"',

  // Commanding — assertion, conviction
  '"Let them call me {value}," {name} said. "Better that than forgotten."',
  '"In the {sphere}, I found what others seek in temples," {name} observed. "A truth that does not flinch."',
  '"{name} once claimed in the {sphere}: Do not mistake my silence for weakness. I am simply deciding."',
  '"The {sphere} does not care for your ambitions," {name} would say. "But it rewards those who listen."',

  // Wistful — loss, memory, grief
  '"{name} spoke of what lies beyond the veil in the {sphere}. It is not darkness, {name} said, but patience."',
  '"{name}, ever {value}, forges bonds like threads in the great weave. Every betrayal cuts a thread."',
  '"They will remember what {name} built with their {value} hands, {name} mused. Not what I destroyed."',

  // Threatening — shadow, consequence
  '"Those who speak {name}\'s name in darkness — do they know {name} guards the {sphere}? I always hear."',
  '"The world offers many {value} choices, {name} observed. Most of them end in ash."',

  // Mystical — magic, connection, transcendence
  '"{name} claimed there is a voice beneath the {sphere} that speaks only to those {value} enough to listen."',
  '"{name} heard songs in stones, and stories in the {sphere}. Whether mad or {value}, none could say."',
];

// ─── §2. Sphere Flavor Text ───────────────────────────────────────────────────

export const SPHERE_FLAVOR: Record<string, string> = {
  force: 'clash of arms',
  matter: 'weight of stone',
  energy: 'crackling light',
  life: 'pulse of growing things',
  mind: 'whisper of thought',
  spirit: 'echo of the divine',
  time: 'slow turn of ages',
  entropy: 'quiet unraveling',
  chaos: 'wild surge',
  order: 'perfect symmetry',
  light: 'radiance',
  darkness: 'deep shadow',
};

// ─── §3. Backstory Origin Templates ───────────────────────────────────────────

export const ORIGIN_TEMPLATES = [
  // Birth and belonging
  '{name} was born among the {culture}, in a time when the world still remembered what it had lost.',
  'The {culture} tell stories of {name} — how even as a child, the threads of {sphere} clung to them.',
  'No one remembers when {name} first appeared among the {culture}. Some say they were always there, waiting.',
  'Before {name} earned their name, they were simply another soul of the {culture}, shaped by the land and its demands.',

  // Foundling and exception
  '{name} arrived during a season of storm, carried by no mother anyone could name, adopted by the {culture} as one of their own.',
  'They say {name} was found at the edge of the {culture}\'s lands, old enough to remember loss, young enough to forget.',
  'The {culture} never agreed on where {name} came from, only that when they arrived, something shifted in the web of things.',

  // Destiny and threads
  'Something in {name}\'s blood called to the {sphere}, marking them as different from the first breath they drew among the {culture}.',
  'Even in childhood, {name} seemed touched by threads the {culture}\'s seers could barely perceive.',

  // Mystery and arrival
  '{name} emerged from the margins of the {culture}\'s lands like a name written in water, present but never quite fixed.',
  'The {culture} whisper that {name}\'s birth was foretold by signs in the {sphere}, though none now remembers what those signs were.',
];

// ─── §4. Backstory Middle Templates ──────────────────────────────────────────

export const MIDDLE_TEMPLATES = [
  // Character and consequence
  'Those who knew {name} spoke of their {trait} nature — a quality that set them apart from their peers. Their bond with {bond} defined much of what came next.',
  'It was {name}\'s {trait} character that first drew attention, and their connection to {bond} that sealed their fate.',
  'The {sphere} marked {name} early. Their {trait} ways made them both feared and admired, and {bond} became the axis around which their story turned.',

  // Choice and breaking
  'A turning point came when {name} chose {bond} over the safety their {trait} nature might have afforded them.',
  'People whispered about what {name} did when their {trait} impulses and their loyalty to {bond} came into conflict.',

  // Growth and darkening
  'As {name} grew, their {trait} disposition only deepened, and {bond} learned to either walk beside them or step away.',
  'The {sphere} shaped {name} with each passing year — in ways {trait} and terrible — while {bond} witnessed every change.',

  // Reckoning and power
  'When {name}\'s {trait} gifts finally blossomed, {bond} was the first to see both the wonder and the cost.',

  // Isolation and self-reliance
  '{name} walked alone for a long time. Their {trait} nature kept others at a careful distance, and only {bond} ever saw what that distance cost.',

  // Ambition and consequence
  'The {sphere} called to {name} with promises that matched their {trait} hunger. {bond} watched the transformation and said nothing — there was nothing left to say.',

  // Tenderness beneath armor
  'For all their {trait} reputation, {name} kept one thing gentle: the bond with {bond}. It was the crack in the armor that made everything else bearable.',

  // Dread and premonition
  'Something changed in {name} the season the {sphere} went quiet. Their {trait} certainty wavered, and {bond} noticed the way they started watching the horizon.',

  // Quiet strength
  '{name} never spoke of what the {sphere} demanded. Their {trait} silence said enough, and {bond} learned to read the weight in it.',

  // Defiance
  'When the {sphere} tried to claim {name} entirely, their {trait} stubbornness held. {bond} was the anchor — the one thread even divine power could not sever.',

  // Loss that reshapes
  'After the loss, {name} became something new — still {trait}, but colder, more precise. {bond} remembered who they had been before and grieved quietly.',

  // Transformation accepted
  '{name} did not resist the change. Their {trait} nature made them suited to what the {sphere} required, and {bond} could only watch as the person they knew became something else entirely.',
];

// ─── §5. Backstory Closing Templates ─────────────────────────────────────────

export const CLOSING_TEMPLATES = [
  // Threshold and becoming
  'Now {name} stands at a crossroads, their choices rippling through the weave of the world.',
  'What {name} will become is not yet written. But the threads are gathering, and the pattern grows clearer with each passing day.',
  'The world watches {name}, though it does not yet know why. The threads know. They always do.',

  // Weight and burden
  '{name} carries now a burden that few could bear — the weight of what they have learned, and the memory of what they were.',
  'Many have attempted to read {name}\'s future in the threads. None have succeeded. Perhaps {name} alone knows which path they will walk.',

  // Legend and echo
  'Some claim {name}\'s story is already written in the great chronicle, waiting only for time to reveal it.',
  'In time, {name}\'s name may be sung in the songs of the {culture}, or forgotten entirely. The threads have not yet decided.',

  // Consequence and reckoning
  'All {name} has done and chosen has led to this moment — a moment that will scatter consequences like seeds on the wind.',

  // Uncertainty as power
  'No one can predict what {name} will do next. That uncertainty is itself a kind of power — and {name} knows it.',

  // Approaching storm
  'The threads around {name} are tightening. Whether this means triumph or unraveling, even the gods cannot say.',

  // Quiet resolve
  '{name} has stopped asking for permission. Whatever comes next, they will meet it standing.',

  // Legacy already forming
  'Already the {culture} speak of {name} in tones reserved for legends. Whether that legend ends in glory or cautionary tale remains unwritten.',

  // Cost acknowledged
  '{name} knows the price of what they carry. They have counted the cost and chosen to pay it — not because they must, but because no one else will.',

  // Earned peace (rare, wonder-tinted)
  'For now, {name} rests. Not in defeat, not in victory, but in the brief stillness between storms. It will not last. It never does.',

  // Ironic reversal
  'Everything {name} fought to avoid has come to pass. And yet — here they stand, unbroken. Perhaps that was the point all along.',

  // The world watching
  'The weave bends around {name} like water around a stone. They may not know it yet, but the world is already reshaping itself to accommodate what they will become.',
];

// ─── §6. Lookup Functions ────────────────────────────────────────────────────

/**
 * Get sphere flavor text for a given sphere name.
 * Falls back to the sphere name itself if not found.
 */
export function getSphereFlavorText(sphereName: string): string {
  return SPHERE_FLAVOR[sphereName.toLowerCase()] ?? sphereName;
}

/**
 * Get a random quote template.
 */
export function getRandomQuoteTemplate(index: number): string {
  return QUOTE_TEMPLATES[index % QUOTE_TEMPLATES.length];
}

/**
 * Get a random origin template.
 */
export function getRandomOriginTemplate(index: number): string {
  return ORIGIN_TEMPLATES[index % ORIGIN_TEMPLATES.length];
}

/**
 * Get a random middle template.
 */
export function getRandomMiddleTemplate(index: number): string {
  return MIDDLE_TEMPLATES[index % MIDDLE_TEMPLATES.length];
}

/**
 * Get a random closing template.
 */
export function getRandomClosingTemplate(index: number): string {
  return CLOSING_TEMPLATES[index % CLOSING_TEMPLATES.length];
}
