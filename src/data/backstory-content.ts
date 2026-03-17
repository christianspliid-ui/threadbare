/**
 * Backstory Content — pre-authored prose fragments for tiered agent backstory generation.
 *
 * 12 content tables covering stratum 1–4 backstory layers.
 * Templates use {name}, {culture}, {archetype}, {bond}, {basis}, {trait}, {value},
 * {left_pole}, {right_pole}, {fear}, {arc_phase}, {ascendant_sphere} placeholder syntax.
 * All prose follows the Threadbare aesthetic: beauty first, darkness emerging from detail.
 *
 * Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md
 */

// ─── Table 1: SURFACE_ORIGIN_PROSE ───────────────────────────────────────────
// Stratum 1. Surface origin by narrative archetype.
// Key: narrativeArchetype. Placeholders: {name}, {culture}, {archetype}.
// Tone: Third-person hearsay. "They say..." / "Known as..."

export const SURFACE_ORIGIN_PROSE: Record<string, string[]> = {
  tragic_hero: [
    'They say {name} came from {culture}, already carrying the shape of something that would not end well — a {archetype} built for greatness, bent by what greatness actually costs.',
    '{name} is known in {culture} as the kind of figure whose story everyone can see except the person living it — a {archetype} whose fall, if it comes, will be remembered.',
  ],
  trickster: [
    'In {culture}, {name} is spoken of the way people speak of weather — unpredictable, occasionally useful, not quite trusted. A {archetype} who learned early that the gap between what is claimed and what is true is inhabitable.',
    'They say {name} arrived in {culture} as one thing and became another without anyone noticing the transition — the mark of a {archetype} who understands that identity is provisional.',
  ],
  coming_of_age: [
    '{name} is the kind of person from {culture} that people watch with the specific attention of those who know something significant is forming. A {archetype} in the middle of becoming.',
    'From {culture}, {name} carries the particular awkwardness of someone between states — a {archetype} who has not yet arrived at the person they are becoming.',
  ],
  brooding_warrior: [
    'In {culture} they call {name} the quiet kind of dangerous — a {archetype} whose capacity for violence is visible only to those who know what to look for.',
    '{name} is known in {culture} as someone whose history is written in what they do not say. A {archetype} shaped by things that do not bear repeating in public.',
  ],
  fallen_noble: [
    'From {culture}, {name} carries the particular gravity of dispossession — a {archetype} who once held something significant and now moves through the world with the bearing of someone who has not forgotten what they lost.',
    'They say {name} came from higher in {culture} than they now stand. A {archetype} whose manner speaks of former station the way old scars speak of old wounds.',
  ],
  true_believer: [
    'In {culture}, {name} is known as someone organized around conviction — a {archetype} whose certainty is the fact everyone around them navigates first.',
    '{name} carries the reputation in {culture} of someone who has found their principle and arranged everything else around it. A {archetype} whose faith, whatever its object, is not in question.',
  ],
  schemer: [
    'They say {name} thinks three moves ahead in {culture} while appearing to think only of the immediate — a {archetype} whose patience is their primary weapon.',
    'In {culture}, {name} is known as someone who reads rooms. A {archetype} who sees the conversation beneath the surface one and responds to both simultaneously.',
  ],
  wanderer: [
    '{name} passed through {culture} as they pass through everywhere — a {archetype} whose belonging to any particular place is always temporary, always slightly provisional.',
    'In {culture} they know {name} the way you know a river that occasionally changes course. A {archetype} for whom motion is the one constant.',
  ],
  monster: [
    'They say {name} from {culture} is not quite what they appear — a {archetype} whose shape resists the categories others try to press them into.',
    'In {culture}, {name} is spoken of with the careful ambivalence reserved for things that do not fit cleanly. A {archetype} whose existence complicates the available explanations.',
  ],
  folk_hero: [
    'From {culture}, {name} has become a story before they finished being a person — a {archetype} whose reputation runs ahead of the facts and has already diverged from them.',
    'They say {name} of {culture} did something — the details vary by who you ask. A {archetype} whose legend is a collective projection as much as a record.',
  ],
  reluctant_king: [
    'In {culture}, {name} holds authority the way someone holds a borrowed object — carefully, and with the awareness that it will eventually need to be returned. A {archetype} who did not seek this.',
    'They say {name} of {culture} was given power they refused three times and accepted the fourth. A {archetype} who leads with the bearing of someone who knows command is a burden, not a prize.',
  ],
  oathkeeper: [
    '{name} from {culture} is known as someone whose word is load-bearing — a {archetype} who said something and has been carrying it ever since.',
    'In {culture}, {name} is the kind of person whose promises are treated as facts. A {archetype} for whom the oath is not a means to an end but the end itself.',
  ],
  poisoned_court: [
    'They say {name} from {culture} reads every room for the conversation happening beneath the surface one — a {archetype} shaped by an environment where every exchange is simultaneously what it appears to be and something else.',
    'In {culture}, {name} is known as someone who knows things. A {archetype} trained in an environment where information and danger were the same resource.',
  ],
  doomed_innocent: [
    'From {culture}, {name} moves through the world with a goodness that observers find both admirable and faintly alarming — a {archetype} who has seen the darkness and chosen not to let it change the essential thing.',
    'In {culture} they speak of {name} the way they speak of something fragile that keeps not breaking. A {archetype} whose integrity has survived circumstances that should have compromised it.',
  ],
  old_power: [
    '{name} from {culture} has the specific authority that accumulates over time — a {archetype} who has watched enough cycles repeat to know the current moment to be temporary.',
    'In {culture}, {name} is known as someone who was here before the current arrangement and will likely be here after. A {archetype} whose patience is not calm but simply old.',
  ],
  kingmaker: [
    'They say {name} from {culture} prefers the authority that does not require wearing a crown — a {archetype} who shapes thrones and the people who sit in them from a careful distance.',
    'In {culture}, {name} is known as the person standing behind the person making decisions. A {archetype} whose power is most comfortable when held by someone else.',
  ],
  seeker: [
    'From {culture}, {name} has been looking for something since before they could name it — a {archetype} organized around a search whose destination keeps revising itself.',
    'In {culture} they know {name} as someone who asks questions other people have stopped asking. A {archetype} for whom the search itself is the primary fact.',
  ],
  maker: [
    '{name} from {culture} is known by what they have built or made or organized — a {archetype} who participates in the world by imposing intention on the available material.',
    'In {culture}, {name} is defined by their creations. A {archetype} for whom making is not optional but constitutional.',
  ],
  noble_savage: [
    'They say {name} belongs to {culture} and somewhere else simultaneously — a {archetype} formed at a border between two ways of understanding the world, conversant in both, claiming neither.',
    'In {culture}, {name} is recognized as someone who carries more than one set of assumptions. A {archetype} whose value comes precisely from belonging fully to neither world.',
  ],
};

// ─── Table 2: SURFACE_SPHERE_PROSE ───────────────────────────────────────────
// Stratum 1. Sphere influence manifest on the agent.
// Key: SphereName. Placeholders: {name}, {sphere}.
// Tone: Observable manifestation. "The {sphere} clings to {name} like..."

export const SURFACE_SPHERE_PROSE: Record<string, string[]> = {
  force: [
    'The {sphere} clings to {name} like the smell of iron on cold days — an ambient authority that makes the air around them feel slightly more consequential than elsewhere.',
    'Those who know what to look for see {sphere} in how {name} moves through space: the unconscious calculation of where force could be applied, and where it has already been.',
  ],
  matter: [
    'The {sphere} is present in {name} as a kind of groundedness — an attention to the physical texture of things, the weight of objects, the resistance of what cannot simply be wished different.',
    '{name} carries the mark of {sphere} in their practical intelligence. They think in terms of what things are made of and what that determines about what can be done with them.',
  ],
  energy: [
    'The {sphere} moves through {name} in the way heat moves through metal — not announced, but detectable in the warmth of nearby surfaces and the speed with which things near them tend to change.',
    'Those sensitive to such things feel {sphere} in {name} as a restlessness, an orientation toward motion and transformation that makes stillness feel like a temporary condition, not a resting state.',
  ],
  life: [
    'The {sphere} is present in {name} in the way vitality is present — as an appetite, a responsiveness, a tendency to grow in available directions rather than stop at imposed boundaries.',
    '{name} carries {sphere} in the specific quality of their attention: a sensitivity to what is alive and what is dying, what has momentum and what has run down.',
  ],
  mind: [
    'The {sphere} marks {name} in the clarity of their reasoning and the speed with which they navigate between evidence and conclusion. Thought is their primary medium.',
    'Those near {name} feel {sphere} in the way the conversation becomes more structured, more careful, more oriented toward understanding than toward comfort.',
  ],
  spirit: [
    'The {sphere} is present in {name} as a quality of seriousness — the sense that certain things are weighted, that some obligations are older than the people carrying them.',
    '{name} carries {sphere} in the way they attend to what cannot be seen: the obligation, the memory, the presence of what has not finished making its demands.',
  ],
  time: [
    'The {sphere} marks {name} as someone who thinks in befores and afters — who hears the current moment as a note in a longer sequence, not as something that stands alone.',
    'Those who know {name} feel {sphere} in how they carry the past forward without being crushed by it, and how they read the present for the future already embedded in it.',
  ],
  entropy: [
    'The {sphere} is present in {name} as an unsentimental clarity about endings — a matter-of-fact acknowledgment that things wind down, and that this is information, not catastrophe.',
    '{name} carries {sphere} in their particular patience with decay: the knowledge that what falls apart does so according to its own logic, and that logic can be worked with.',
  ],
};

// ─── Table 3: BOND_HISTORY_PROSE ─────────────────────────────────────────────
// Stratum 2. Significant positive-sentiment bond by basis type.
// Key: bond basis. Placeholders: {name}, {bond}, {basis}.
// Tone: Specific, named. "The first time {name} met {bond}, it was through {basis}..."

export const BOND_HISTORY_PROSE: Record<string, string[]> = {
  friendship: [
    'The {basis} between {name} and {bond} arrived without announcement and proved more durable than relationships that had been formally established. Some of the best ones do.',
    '{name} and {bond} arrived at trust through enough shared time that the trust is more like scar tissue than sentiment — less beautiful than it started, but significantly harder to damage.',
  ],
  rivalry: [
    'The {basis} with {bond} is the kind that sharpens rather than destroys — {name} understands their own edges better for having pressed against someone who pushes back.',
    '{name} and {bond} have been measuring each other for long enough that the measurement has become its own form of intimacy. Some rivalries are the most honest relationships a person has.',
  ],
  loyalty: [
    'The {basis} {name} bears toward {bond} was not chosen so much as arrived at — a commitment that accumulated through shared difficulty until it became foundational rather than incidental.',
    '{name}\'s {basis} to {bond} has been tested in the specific way that demonstrates whether loyalty is real or merely comfortable. It has proven real.',
  ],
  alliance: [
    'The {basis} between {name} and {bond} began in mutual interest and has lasted long enough to become something else — a cooperation that neither party fully remembers beginning.',
    '{name} and {bond} built their {basis} on the practical ground of shared goals and have been surprised to discover, over time, that practical ground can support weight neither expected.',
  ],
  trade: [
    'The {basis} relationship with {bond} showed {name} something about exchange that abstracted principles never could — that what passes between people carries more than its stated value.',
    '{name} and {bond} know each other through the honest medium of {basis}: what one has that the other needs, and whether the price asked is the price meant.',
  ],
  faith: [
    'The {basis} that connects {name} and {bond} runs deeper than personal affection — it is a shared orientation toward something larger than either of them, which makes it both more durable and more fragile.',
    '{name} and {bond} share a {basis} that has survived the specific tests that shared conviction survives: the moments when the conviction costs something real.',
  ],
  lineage: [
    'The {basis} between {name} and {bond} is older than their choices — a connection established before either of them had language for it, carrying obligations and gifts in equal measure.',
    '{name}\'s {basis} bond with {bond} is the kind that does not require maintenance because it was not constructed. It simply is, and has been, and carries weight accordingly.',
  ],
  gratitude: [
    'What {name} owes {bond} is the kind of {basis} that resists being repaid — not because {bond} holds it over them, but because the scale of it exceeds what accounting can reach.',
    'The {basis} {name} bears toward {bond} was not asked for and could not have been anticipated. Some debts are of the kind that become love before they become obligation.',
  ],
};

// ─── Table 4: BOND_HISTORY_NEGATIVE_PROSE ────────────────────────────────────
// Stratum 2. Significant negative-sentiment bond by basis type.
// Key: bond basis. Placeholders: {name}, {bond}, {basis}.

export const BOND_HISTORY_NEGATIVE_PROSE: Record<string, string[]> = {
  friendship: [
    'The {basis} that once existed between {name} and {bond} has become something else — not its opposite exactly, but its shadow, carrying the shape of what it was without the warmth.',
    '{name}\'s history with {bond} contains a {basis} that did not survive what happened to it. What remains is the memory of trust and the specific pain of its absence.',
  ],
  rivalry: [
    'The {basis} with {bond} has moved past productive friction into something sharper — a competition that no longer sharpens {name} so much as occupies them.',
    '{name} and {bond} have been in {basis} long enough that it has become a habit neither has chosen to break, though both might benefit from ending it.',
  ],
  loyalty: [
    'The {basis} {name} gave to {bond} was returned in ways that have made future loyalty significantly more expensive. The lesson was specific and has not faded.',
    '{name}\'s {basis} to {bond} encountered something it could not survive and did not. What replaced it is not the opposite of loyalty but its scar.',
  ],
  alliance: [
    'The {basis} with {bond} revealed that mutual interest extends only as far as the interests actually align, and that {name} and {bond} discovered the edges of that distance.',
    '{name} and {bond} built an {basis} on shared goals and discovered that goals shared on the surface can diverge at the root. The divergence was costly.',
  ],
  trade: [
    'The {basis} relationship with {bond} ended in an imbalance that neither party will describe the same way. {name} remembers the terms differently than {bond} does.',
    '{name} and {bond} know what {trade} looks like when it fails: what was given and not returned, what was promised and not delivered, what was taken without asking.',
  ],
  faith: [
    'The {basis} that connected {name} and {bond} did not survive the discovery that faith is not always equally distributed, or equally sincere.',
    '{name} and {bond} shared a {basis} that was tested by something that revealed one of them had always held it lightly. The revelation was not easily forgiven.',
  ],
  lineage: [
    'The {basis} between {name} and {bond} is older than their choices and more difficult to escape for that reason. Some connections are burdens before they are gifts.',
    '{name}\'s {basis} bond with {bond} carries obligations that feel more like chains than roots — an inheritance that was not chosen and has not been welcome.',
  ],
  gratitude: [
    'What {name} owes {bond} has become a weight rather than a bond — a {basis} invoked in ways that transform it from connection into leverage.',
    'The {basis} that should connect {name} and {bond} has curdled into something else: a debt cited rather than honored, a history used rather than shared.',
  ],
};

// ─── Table 5: TRAIT_ORIGIN_PROSE ─────────────────────────────────────────────
// Stratum 2. How the agent's defining trait was acquired by category.
// Key: trait category (innate, mastery, reputation, scar, condition, destiny).
// Placeholders: {name}, {trait}.
// Tone: Causal. "The {trait} in {name} was not born — it was forged..."

export const TRAIT_ORIGIN_PROSE: Record<string, string[]> = {
  innate: [
    'The {trait} in {name} is not a thing they acquired — it arrived with them, written into the way they respond to the world before they had the language to name it.',
    '{name}\'s {trait} is constitutional rather than chosen. They cannot remember a time without it, which means they also cannot imagine being without it.',
    'The {trait} is so fundamental to {name} that others mistake it for personality rather than property — a permanent feature of how they occupy space.',
  ],
  mastery: [
    'The {trait} in {name} was not born — it was worked into them through repetition and failure and the specific education that comes from doing something badly enough times to do it right.',
    '{name}\'s {trait} has the texture of something earned rather than given. It is present not because it is natural but because they spent themselves acquiring it.',
    'The {trait} carries {name}\'s history of labor in it. Every competency has a scar; this one has several.',
  ],
  reputation: [
    'The {trait} attributed to {name} arrived through what others have said about them — a characteristic assembled from outside that they have now had long enough to make their own.',
    '{name}\'s {trait} is partly projection, partly accurate. People saw something and named it, and the name has been worn long enough to fit.',
    'The {trait} came to {name} through the testimony of people who had reason to know. Whether the reputation is entirely deserved is a question {name} has stopped asking.',
  ],
  scar: [
    'The {trait} in {name} is the specific result of a specific wound. Something happened, and this is what grew from it — not despite the event, but because of it.',
    '{name} carries {trait} the way people carry injuries that have healed badly: the original damage has become part of the structure, load-bearing in ways that cannot be removed without collapse.',
    'The {trait} that marks {name} arrived through cost. It was forged in something they would not choose again, which is precisely what makes it permanent.',
  ],
  condition: [
    'The {trait} in {name} arrived through circumstance rather than intention — a characteristic shaped by the particular environment they occupied for long enough to leave a mark.',
    '{name}\'s {trait} is the deposit of conditions they did not design and could not escape. The world pressed a shape into them, and this is the shape.',
    'The {trait} came to {name} through the accumulated pressure of their situation — not a single event but a sustained weather that left a permanent pattern.',
  ],
  destiny: [
    'The {trait} in {name} feels less like something they developed and more like something that was waiting for them — a characteristic that arrived with the sense of inevitability rather than surprise.',
    '{name}\'s {trait} has a quality that others find almost predetermined — as if the story was already written and this was the form it was always going to take.',
    'The {trait} came to {name} as if by appointment: the right quality arriving at the moment it was needed, as though the world had arranged for it to be available.',
  ],
};

// ─── Table 6: TURNING_POINT_PROSE ────────────────────────────────────────────
// Stratum 2. The moment when the dominant axiological value crystallized.
// Key: ValuePair. Placeholders: {name}, {value} (the dominant pole label).
// Tone: Pivotal moment. "Something shifted in {name} the day they chose {value}..."

export const TURNING_POINT_PROSE: Record<string, string[]> = {
  ambition_contentment: [
    'Something shifted in {name} the day they chose {value} over its opposite — a decision that set a direction they have been traveling in since, further than they can see back to the origin.',
    '{name}\'s relationship with {value} was not always settled. There was a moment when the alternative was genuinely available, and the choice made then has been the organizing fact since.',
    'The turn toward {value} happened in a circumstance that made the stakes undeniable for {name}. What was chosen in that moment has functioned as a template for every similar choice since.',
  ],
  courage_prudence: [
    'Something shifted in {name} the day they chose {value} — not dramatically, but definitively, in a circumstance that required the thing to be named.',
    '{name}\'s relationship with {value} was forged in a situation that made the alternative visible and rejected it. The rejection was a declaration.',
    'The moment {name} settled into {value} arrived through a test that was not abstract. What it cost them to choose it is part of why the choice has held.',
  ],
  cruelty_compassion: [
    'Something shifted in {name} when they chose {value} in a situation where the other option was genuinely available. The choice revealed a hierarchy that has been consistent since.',
    'The day {name} committed to {value} came through an encounter with suffering — their own or someone else\'s — that made the question immediate rather than philosophical.',
    '{name}\'s relationship with {value} was shaped by a circumstance in which the cost of it was visible and they paid it anyway. That payment established a precedent.',
  ],
  cunning_honesty: [
    'Something shifted in {name} when {value} became the operating principle rather than the occasional tactic — a moment when it moved from behavior to character.',
    'The turn toward {value} for {name} came through a situation where the alternative was possible and declined. The decline was a statement about the kind of person they intended to be.',
    '{name}\'s commitment to {value} was tested once in a specific way, and the test was passed at a cost. The cost has been consistent with having a principle.',
  ],
  devotion_independence: [
    'Something shifted in {name} the day they chose {value} — a declaration about where their allegiance finally resided that has not been revised since.',
    'The turn toward {value} arrived for {name} in circumstances that forced the question from abstract to immediate. What they chose in that moment was not a statement about belief but about self.',
    '{name}\'s relationship with {value} was established through an event that made the alternative not just undesirable but impossible — a choice that was also a discovery.',
  ],
  loyalty_treachery: [
    'Something shifted in {name} when {value} was tested against something that made it genuinely costly. The test was passed. The passing left a mark.',
    'The moment {name} settled into {value} came through a situation where the alternative would have been easier, more profitable, and probably wiser. They chose {value} anyway.',
    '{name}\'s commitment to {value} was established through the specific experience of choosing it when it hurt — which is the only test of whether a commitment is real.',
  ],
  tradition_innovation: [
    'Something shifted in {name} when they chose {value} in a situation where the alternative was not only available but recommended by people they respected. The choice was a declaration.',
    'The turn toward {value} arrived for {name} through a moment when the past and the future were both live options. What they chose in that moment has been their orientation since.',
    '{name}\'s relationship with {value} was forged in circumstances that made the choice between inheritance and change consequential and irreversible.',
  ],
  dominance_humility: [
    'Something shifted in {name} the day they chose {value} in a situation where the other posture was available. The choice was a statement about what kind of authority they intended to exercise.',
    'The moment {name} settled into {value} came through a circumstance that offered them a different kind of power than they chose. The declining was the declaration.',
    '{name}\'s commitment to {value} was established through a situation in which the alternative would have been satisfying in the short term and damaging in the long. They chose correctly.',
  ],
  wrath_patience: [
    'Something shifted in {name} when {value} was tested against a provocation significant enough that the alternative would have been understood. They chose {value}. The choice had consequences.',
    'The turn toward {value} arrived through the specific experience of holding it in circumstances that made holding it difficult — which is where all real commitments are established.',
    '{name}\'s relationship with {value} was shaped by a moment when they discovered what it cost them, and paid it, and found that the cost was worth what it bought.',
  ],
  greed_generosity: [
    'Something shifted in {name} the day they chose {value} in a circumstance where scarcity or abundance made the choice real rather than abstract.',
    'The moment {name} settled into {value} as an operating principle came through a specific event that made the alternative visible and, ultimately, insufficient.',
    '{name}\'s relationship with {value} was established through a situation that required it to be enacted rather than merely believed. The enactment has been consistent since.',
  ],
};

// ─── Table 7: CONTRADICTION_PROSE ────────────────────────────────────────────
// Stratum 3. Internal contradiction where opposing values are near-equal.
// Key: ValuePair. Placeholders: {name}, {left_pole}, {right_pole}.
// Tone: Psychological exposure. "{name} is both {left_pole} and {right_pole} — not in balance, but in war..."

export const CONTRADICTION_PROSE: Record<string, string[]> = {
  ambition_contentment: [
    '{name} is both {left_pole} and {right_pole} — not in balance, but in war. The desire to achieve and the desire to stop achieving cancel each other in cycles that have become weather rather than choice.',
    'The war between {left_pole} and {right_pole} in {name} has no winner. They move toward each in turn, arriving at neither, finding the movement itself the only honest position.',
  ],
  courage_prudence: [
    '{name} is pulled equally toward {left_pole} and {right_pole} — the part that faces danger and the part that calculates it are of equal influence, producing a person who acts and second-guesses with equal facility.',
    'The tension between {left_pole} and {right_pole} runs through every significant decision {name} makes. Neither wins cleanly. Both leave marks.',
  ],
  cruelty_compassion: [
    '{name} holds {left_pole} and {right_pole} in approximately equal measure — both are genuine, neither is settled, and the question of which operates depends on circumstances they do not always control.',
    'The hardness and the softness in {name} have not resolved into a hierarchy. {left_pole} and {right_pole} coexist, each active in the circumstances that call for it.',
  ],
  cunning_honesty: [
    '{name} is pulled toward both {left_pole} and {right_pole} with equal force — the honest part and the strategic part are in ongoing negotiation that neither wins.',
    'The contradiction between {left_pole} and {right_pole} in {name} has not simplified. They are sometimes more open than useful and sometimes more closed than comfortable.',
  ],
  devotion_independence: [
    '{name}\'s pull toward {left_pole} and pull toward {right_pole} have reached suspended tension — they cannot fully give themselves over and cannot fully withdraw.',
    'Every bond {name} forms contains the implicit negotiation between {left_pole} and {right_pole} — an internal argument that has not concluded and may not.',
  ],
  loyalty_treachery: [
    '{name} is neither reliably {left_pole} nor reliably {right_pole} — the near-equal weight of both makes every significant relationship a variable outcome.',
    'The {left_pole} part of {name} and the {right_pole} part have reached an unstable equilibrium that shifts based on what is at stake and who is watching.',
  ],
  tradition_innovation: [
    '{name} is equally drawn to {left_pole} and {right_pole} — the appeal of each is partly the critique it offers of the other, a loop without obvious exit.',
    'The {left_pole} and the {right_pole} in {name} are matched forces. They respect inheritance and resist it in approximately equal measure.',
  ],
  dominance_humility: [
    '{name} navigates between {left_pole} and {right_pole} without having resolved which is more natural. Both are genuine; neither is settled.',
    'The part of {name} that needs to be in charge and the part that needs to not be responsible are in approximate balance, making every situation of authority slightly uncomfortable.',
  ],
  wrath_patience: [
    '{name}\'s {left_pole} and their {right_pole} are of roughly equal force — slow to ignite, fast to exhaust their own patience once ignited.',
    'The line between {name}\'s {left_pole} and their {right_pole} is not reliably drawn. They can hold one a long time and shift to the other suddenly.',
  ],
  greed_generosity: [
    '{name} holds both {left_pole} and {right_pole} in near-equal measure — they are often in direct competition, and the winner is situational.',
    'The {left_pole} part of {name} and the {right_pole} part are close enough in strength that the outcome is often a compromise neither fully satisfies.',
  ],
};

// ─── Table 8: DECISIVE_NATURE_PROSE ──────────────────────────────────────────
// Stratum 3. Fallback when no contradiction is found — the agent is decisive.
// Flat array. Placeholder: {name}.

export const DECISIVE_NATURE_PROSE: string[] = [
  'There is no war inside {name}. The values are settled, the hierarchy is clear. That certainty is itself a kind of wound — the ones who know exactly who they are have usually paid to know it.',
  '{name} is not torn. The internal arguments that plague others appear to have concluded for them, replaced by a clarity that functions like armor. Armor has weight.',
  'The contradictions that define most people are absent in {name}, or so thoroughly resolved that the resolution has become invisible. What looks like peace from the outside may be suppression from the inside.',
  'Unlike most people, {name} knows what they value and in what order. The knowing is real. The cost of having arrived at that knowing is something they do not discuss.',
];

// ─── Table 9: FEAR_PROSE ─────────────────────────────────────────────────────
// Stratum 3. Shadow fear from the agent's strongest axiological value.
// Key: valuePair_positive (fear from positive pole) or valuePair_negative (fear from negative pole).
// Placeholders: {name}, {fear}, {value}.
// Tone: Vulnerability exposed. "What {name} will never admit..."

export const FEAR_PROSE: Record<string, string[]> = {
  // ambition_contentment
  ambition_contentment_positive: [
    'What {name} will never admit — even to those closest to them — is that {value} is not a direction but a flight from the {fear} that effort alone cannot prevent.',
    'Beneath the {value} that organizes {name}\'s life is the specific dread of {fear}: that all the striving could reach its natural end and still not be enough.',
  ],
  ambition_contentment_negative: [
    'What {name} will never admit is that behind the {value} they display is the {fear} of being forced to want more — of peace being taken from them and replaced with demands they did not agree to.',
    'The {value} in {name} is partly resistance: the {fear} of endless striving makes stillness feel like safety rather than simply comfort.',
  ],
  // courage_prudence
  courage_prudence_positive: [
    'What {name} will never admit is that {value} is maintained partly against the {fear} of exposure — the moment when the strength they project would be revealed as calculation in disguise.',
    'Beneath the {value} in {name} is a {fear} they do not name: that the courage they display would, under sufficient pressure, reveal itself as performed rather than real.',
  ],
  courage_prudence_negative: [
    'What {name} will never admit is that their {value} is partly about the {fear} of their own recklessness — the conviction that without careful calculation, something catastrophic would result.',
    'The {value} in {name} sits over a {fear} of what happens when calculation fails and impulse takes over. The discipline is as much protection against themselves as against the world.',
  ],
  // cruelty_compassion
  cruelty_compassion_positive: [
    'What {name} will never admit is that the {value} they are capable of is partly a defense against the {fear} of being made vulnerable — hurt before being hurt.',
    'Beneath the capacity for {value} in {name} is a {fear} they do not examine: that softness, shown once, would be found and used against them.',
  ],
  cruelty_compassion_negative: [
    'What {name} will never admit is that their {value} contains within it the {fear} of discovering they are capable of worse — that the hardness is in there, only waiting for the right provocation.',
    'The {value} in {name} sits next to a {fear} they rarely name: that kindness will be mistaken for weakness, and that the mistake will cost someone else.',
  ],
  // cunning_honesty
  cunning_honesty_positive: [
    'What {name} will never admit is that behind the {value} they practice is the {fear} of being outwitted — found by someone better at the same game, aimed in the other direction.',
    'The {value} in {name} is maintained partly against the {fear} that the deception, if discovered, will define everything that came before it. The fear makes the practice more careful and no less present.',
  ],
  cunning_honesty_negative: [
    'What {name} will never admit is that their {value} sits next to a {fear} that circumstances will require deception and that they will be visibly bad at it.',
    'Beneath the {value} in {name} is a {fear} of what it would cost them to lie in a situation that demanded it — not moral cost, but the simpler fear of the lie being seen.',
  ],
  // devotion_independence
  devotion_independence_positive: [
    'What {name} will never admit is that {value} contains within it the {fear} of abandonment by what they are devoted to — the discovery that the thing they organized around was unworthy.',
    'The {value} in {name} protects against, but cannot eliminate, the {fear} that what they have given themselves to will eventually require something they cannot give.',
  ],
  devotion_independence_negative: [
    'What {name} will never admit is that the {value} they protect is maintained against the {fear} of obligation so total it leaves no remainder of themselves.',
    'Beneath the {value} in {name} is a {fear} of being consumed by a commitment they did not fully choose, of finding that belonging has closed around them.',
  ],
  // loyalty_treachery
  loyalty_treachery_positive: [
    'What {name} will never admit is that {value} lives next to a {fear} that is specific and named: betrayal by those they have trusted most. Not hypothetical. Already experienced, and still feared.',
    'Beneath the {value} in {name} is the {fear} that the people and causes they have bound themselves to will, when tested, prove to have been bound to something else all along.',
  ],
  loyalty_treachery_negative: [
    'What {name} will never admit is that behind every turn they make is the {fear} of being bound by a {value} they did not choose — loyalty as chain rather than bond.',
    'The {value} in {name} is partly a response to the {fear} of being owned by commitments, of discovery that the cost of keeping faith exceeds any benefit.',
  ],
  // tradition_innovation
  tradition_innovation_positive: [
    'What {name} will never admit is that behind {value} is the {fear} of loss — that the old ways are irreplaceable, and that their abandonment would mean losing something that cannot be rebuilt once gone.',
    'The {value} in {name} is maintained against the {fear} that what has been accumulated over time will be discarded by people who do not understand what it cost.',
  ],
  tradition_innovation_negative: [
    'What {name} will never admit is that behind the {value} is a {fear} — the fear of stagnation, of the same answer applied to every new problem, of arriving at a future that is simply the past with different furniture.',
    'The {value} in {name} sits over a {fear} of being fixed in place: of finding that adaptation is no longer possible, that the old solutions are the only ones, that the world has moved and they have not.',
  ],
  // dominance_humility
  dominance_humility_positive: [
    'What {name} will never admit is that the {value} they exercise is maintained partly against the {fear} of losing it — that control, once relinquished, cannot be recovered.',
    'Beneath the {value} in {name} is the {fear} that things without direction will not simply stall but collapse — that the absence of their intervention is not neutrality but catastrophe.',
  ],
  dominance_humility_negative: [
    'What {name} will never admit is that the {value} they display contains the {fear} of being forced into dominance — of authority arriving like a sentence rather than a choice.',
    'The {value} in {name} is maintained against the {fear} that if they occupied more space, they would do damage they could not take back. The restraint is not only principle.',
  ],
  // wrath_patience
  wrath_patience_positive: [
    'What {name} will never admit is that behind the {value} is the {fear} of powerlessness — of having reason for anger and finding that the anger accomplishes nothing.',
    'The {value} in {name} is maintained against the {fear} that beneath the restraint is something that, once released, would not stop at the appropriate moment.',
  ],
  wrath_patience_negative: [
    'What {name} will never admit is that the {value} they display contains within it the {fear} of what happens when it runs out — the moment when the patience finally exhausts itself in an unrecoverable way.',
    'Beneath the {value} in {name} is a {fear} of their own anger: not that it doesn\'t exist, but that it is larger than they have admitted, and that one day the occasion for it will arrive.',
  ],
  // greed_generosity
  greed_generosity_positive: [
    'What {name} will never admit is that behind the {value} is the {fear} of scarcity — not merely material want but the hollow interior state that scarcity produces, the knowledge of not-enough applied to everything.',
    'The {value} in {name} sits over a {fear} that is older than reason: that it will run out, that there will not be enough, that the margin between sufficient and insufficient is thinner than it looks.',
  ],
  greed_generosity_negative: [
    'What {name} will never admit is that behind the {value} they practice is the {fear} of discovering it was conditional — that the generosity will eventually reach a limit and the limit will say something about who they actually are.',
    'The {value} in {name} contains the {fear} of its own dissolution: that the conditions that make it possible will be removed, and what will emerge is not what they have shown the world.',
  ],
};

// ─── Table 10: HIDDEN_MOTIVE_PROSE ───────────────────────────────────────────
// Stratum 3. Hidden motive by cooperation strategy.
// Key: cooperationStrategy (hyphens, not underscores).
// Placeholders: {name}, {strategy_description}.
// Tone: Behavioral insight. "Watch {name} long enough and a pattern emerges..."

export const HIDDEN_MOTIVE_PROSE: Record<string, string[]> = {
  'tit-for-tat': [
    'Watch {name} long enough and a pattern emerges — {strategy_description}. Not revenge; a deeper conviction that systems built on asymmetric exchange will fail, and they intend to be somewhere else when that happens.',
    'The hidden motive beneath {name}\'s {strategy_description} is the maintenance of a precisely calibrated ledger: the belief that fairness is not virtue but structural requirement.',
  ],
  grudger: [
    'Watch {name} long enough and a pattern emerges — {strategy_description}. Not bitterness; a long-form calculation that trust given carelessly is the beginning of a chain of events they have already seen end badly.',
    'The hidden motive beneath {name}\'s {strategy_description} is the permanence of certain records. They cooperate only with those who have demonstrated reliability, because the alternative is to trust the untrustworthy.',
  ],
  pavlov: [
    'Watch {name} long enough and a pattern emerges — {strategy_description}. Not calculation; something closer to appetite. They navigate toward what has previously resulted in reward with an automatism that resists articulation.',
    'The hidden motive beneath {name}\'s {strategy_description} is the accumulated memory of outcomes. What brought relief, they approach again. What brought harm, they move away from with an animal certainty.',
  ],
  'always-cooperate': [
    'Watch {name} long enough and a pattern emerges — {strategy_description}. Not naivety; a belief, not always conscious, that the world they want to live in must be enacted before it can exist.',
    'The hidden motive beneath {name}\'s {strategy_description} is a logic about propagation: that defection spreads and cooperation must spread too, and someone has to begin the chain.',
  ],
  'always-defect': [
    'Watch {name} long enough and a pattern emerges — {strategy_description}. Not cruelty; the exhausted conclusion of someone who has decided the world rewards the move they are making, and that the alternative is merely slower arrival at the same end.',
    'The hidden motive beneath {name}\'s {strategy_description} is preemption: the certainty that everyone else is running the same calculation and they have simply chosen to finish it first.',
  ],
};

// ─── Table 11: STORY_ARC_PROSE ────────────────────────────────────────────────
// Stratum 4. Current story arc phase by narrative archetype.
// Key: narrativeArchetype. Placeholders: {name}, {arc_phase}.
// Tone: Fatalistic, oracular. "The thread of {name}'s story bends toward..."

export const STORY_ARC_PROSE: Record<string, string[]> = {
  tragic_hero: [
    'The thread of {name}\'s story bends toward its necessary conclusion — a {arc_phase} that was visible to anyone paying attention from the beginning. Whether they know it yet is irrelevant. The pattern is set.',
    'The arc of {name} is in {arc_phase}: they have not yet arrived at the event that will define their story\'s final shape, but the shape is already determined by the choices that have been made.',
  ],
  trickster: [
    'The thread of {name}\'s story bends toward exposure — a {arc_phase} in which the irreconcilable versions of events they have been maintaining will need to be resolved, one way or another.',
    'The arc of {name} is in {arc_phase}: the confidence is constructed, the actors positioned, and the question of which element will prove unstable is the only remaining variable.',
  ],
  coming_of_age: [
    'The thread of {name}\'s story bends toward formation — a {arc_phase} in which the person they will be is being assembled from the materials the world is providing. The assembly is not finished.',
    'The arc of {name} is in {arc_phase}: old enough to understand the stakes, not yet experienced enough to have fixed their response to them. The world\'s real shape is becoming undeniable.',
  ],
  brooding_warrior: [
    'The thread of {name}\'s story bends toward release — a {arc_phase} in which the pressure that has been gathering will find its occasion. Whether the release is productive or destructive is not yet determined.',
    'The arc of {name} is in {arc_phase}: the long middle of carrying what came before toward something that has not yet announced itself. The weight is visible; the destination is not.',
  ],
  fallen_noble: [
    'The thread of {name}\'s story bends toward reckoning — a {arc_phase} in which the question of what one does with dispossession must be answered in a way that determines what comes next.',
    'The arc of {name} is in {arc_phase}: past the fall, in the territory where recovery and its impossibility are being assessed simultaneously.',
  ],
  true_believer: [
    'The thread of {name}\'s story bends toward cost — a {arc_phase} in which the full price of absolute conviction becomes visible, and the question of whether the belief is worth what it requires arrives.',
    'The arc of {name} is in {arc_phase}: the commitment is total, the cost is becoming visible, and the faith is being tested not by opposition but by the complexity of what it actually requires.',
  ],
  schemer: [
    'The thread of {name}\'s story bends toward verification — a {arc_phase} in which the long calculation either proves accurate or reveals the variable that was not accounted for.',
    'The arc of {name} is in {arc_phase}: plans in motion, contingencies prepared, waiting for events to confirm which version of the future will arrive.',
  ],
  wanderer: [
    'The thread of {name}\'s story bends through — a {arc_phase} of the journey, not the destination. What they encounter now deposits something; what they carry forward will be slightly different than what they carried in.',
    'The arc of {name} is in {arc_phase}: defined by what they are passing through rather than what they are arriving at. The destination, if there is one, remains to be determined.',
  ],
  monster: [
    'The thread of {name}\'s story bends toward definition — a {arc_phase} in which the category that has been contested will be settled, one way or another, by what they do next.',
    'The arc of {name} is in {arc_phase}: what they are is not yet fixed in the permanent way it will eventually be. The current chapter is the one where definition is being made.',
  ],
  folk_hero: [
    'The thread of {name}\'s story bends toward legend — a {arc_phase} in which the gap between the events and the stories of the events is widening, and the story is becoming more real than the facts.',
    'The arc of {name} is in {arc_phase}: the process by which fact becomes myth is in progress. They are living inside it.',
  ],
  reluctant_king: [
    'The thread of {name}\'s story bends toward demonstration — a {arc_phase} in which what it means to hold power without having wanted it must be shown rather than declared.',
    'The arc of {name} is in {arc_phase}: past refusal, not yet at resolution, still carrying the authority they did not seek with visible strain.',
  ],
  oathkeeper: [
    'The thread of {name}\'s story bends toward the test — a {arc_phase} in which the oath encounters something that makes keeping it significantly more difficult, and whether it holds will determine everything that follows.',
    'The arc of {name} is in {arc_phase}: the commitment is past its swearing and not yet at its completion. The long middle, where the structure of the oath is tested.',
  ],
  poisoned_court: [
    'The thread of {name}\'s story bends toward revelation — a {arc_phase} in which the true objectives of all the established relationships become visible simultaneously.',
    'The arc of {name} is in {arc_phase}: all the pieces are in position, the game is in progress, and the question of which move will prove to be the real one is still open.',
  ],
  doomed_innocent: [
    'The thread of {name}\'s story bends toward the encounter — a {arc_phase} in which the goodness they carry meets the fact that goodness does not guarantee good outcomes.',
    'The arc of {name} is in {arc_phase}: innocence and experience in direct contact, the story either hardening the person or confirming that hardening was never the point.',
  ],
  old_power: [
    'The thread of {name}\'s story bends toward judgment — a {arc_phase} in which accumulated knowledge must decide whether to be applied or withheld, and the decision has permanent consequences.',
    'The arc of {name} is in {arc_phase}: they can see the shape of things from a remove that younger people cannot achieve. What they do with that perspective is the question.',
  ],
  kingmaker: [
    'The thread of {name}\'s story bends toward consequence — a {arc_phase} in which the structures they built or enabled must either hold or reveal their weaknesses.',
    'The arc of {name} is in {arc_phase}: the architecture of influence is established; the question is what it will be used for, and by whom, and at what cost.',
  ],
  seeker: [
    'The thread of {name}\'s story bends toward complication — a {arc_phase} in which what they have found has complicated what they are looking for in ways that must be integrated before proceeding.',
    'The arc of {name} is in {arc_phase}: deep enough in the search that the original question has been refined several times and may no longer be recognizable from its starting form.',
  ],
  maker: [
    'The thread of {name}\'s story bends toward completion — a {arc_phase} in which the work is demanding things that were not anticipated when the making was begun.',
    'The arc of {name} is in {arc_phase}: the creation is in process, taking on its own requirements, developing a logic that was not fully present in the original intention.',
  ],
  noble_savage: [
    'The thread of {name}\'s story bends toward resolution — a {arc_phase} in which the two inheritances must reach a working arrangement, because the crossing cannot continue indefinitely.',
    'The arc of {name} is in {arc_phase}: between worlds, the two frameworks in active negotiation, neither settled, both present, the final form still being determined.',
  ],
};

// ─── Table 12: DIVINE_TRANSFORMATION_PROSE ───────────────────────────────────
// Stratum 4. How divine investment has changed the agent.
// Key: 'low' | 'medium' | 'high' | 'massive'. Placeholders: {name}, {ascendant_sphere}.
// Tone: Transformation narrative. "Since the Ascendant's touch first reached {name}..."

export const DIVINE_TRANSFORMATION_PROSE: Record<string, string[]> = {
  low: [
    'Since the Ascendant\'s touch first reached {name}, small things have shifted — a tendency, a sensitivity to certain patterns, a preference that was not there before and cannot be explained as personal history. The {ascendant_sphere} is faint but present.',
    'There is something in how {name} responds to certain situations that suggests the {ascendant_sphere} has been at work. The mark is recent, light, and has not yet fully settled.',
    'The first evidence of divine engagement is subtle in {name}: an instinct that arrives slightly before its cause, a quality of attention that was not present before the {ascendant_sphere} first touched them.',
  ],
  medium: [
    'Since the Ascendant\'s touch deepened, {name} has adjusted to the {ascendant_sphere} the way one adjusts to a new altitude — not always consciously, but thoroughly. Something in the architecture of their thinking has been revised.',
    'The {ascendant_sphere} has left marks in {name} that are now structural: habits of attention, sensitivities to patterns, a direction of perception that only makes sense if something has been communicating through them for some time.',
    'The divine relationship has gone deep enough for {name} that the gaps between {ascendant_sphere} contact are noticed. Something in how they process the world has changed.',
  ],
  high: [
    'The {ascendant_sphere} has become structural in {name} — not an experience they are having but a condition they are in. The self before it is retrievable only as memory.',
    'Since the Ascendant\'s touch went deep, what the {ascendant_sphere} has done to {name} is thorough: their responses, instincts, and sense of what matters have all been reoriented around a center that was not originally theirs.',
    'The {ascendant_sphere} runs through {name} now in the way that long practice runs through a skilled practitioner — not visible in any single action, but present in all of them.',
  ],
  massive: [
    'The transformation is complete in the sense that the original structure is no longer primary. {name} exists in relationship to the {ascendant_sphere} the way a riverbed exists in relationship to water — shaped entirely by what has moved through them.',
    'The Ascendant\'s sustained engagement has changed {name} into something that does not have a clean category. Not a god, not fully mortal, but a hybrid condition that operates according to rules the {ascendant_sphere} wrote.',
    'The {ascendant_sphere} has not merely influenced {name} — it has become a layer of their cognition. They perceive through a filter they did not build and cannot fully remove.',
  ],
};
