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
    'They say {name} came from {culture} already carrying something heavy. A {archetype} built for greatness, bent by what it costs.',
    'Everyone in {culture} knows {name}\'s story except {name}. A {archetype} whose fall, if it comes, will be remembered.',
    'Ask about {name} in {culture} and you get the same story with different endings. A {archetype} who reached too far.',
    'The old women of {culture} shake their heads when {name} passes. They have seen this kind before.',
  ],
  trickster: [
    'In {culture}, {name} is spoken of the way people speak of weather — unpredictable, occasionally useful, not quite trusted.',
    'They say {name} arrived in {culture} as one thing and became another. Nobody noticed the transition.',
    'The stories about {name} in {culture} never quite match. A {archetype} whose reputation is itself a performance.',
    'A merchant in {culture} claims {name} sold them their own horse back. Three people swear to different versions.',
  ],
  coming_of_age: [
    'People in {culture} watch {name} the way you watch something forming. A {archetype} in the middle of becoming.',
    '{name} carries the awkwardness of someone between states. Not yet the person they are becoming.',
    'From {culture} comes {name} — not yet finished, as anyone can see. The story is still being assembled.',
    'The elders of {culture} disagree about {name}. Some see promise. Others see a fall waiting to happen.',
  ],
  brooding_warrior: [
    'In {culture} they call {name} the quiet kind of dangerous. The violence is visible only if you know what to look for.',
    '{name}\'s history in {culture} is written in what they do not say. A {archetype} shaped by things that bear no repeating.',
    'Children in {culture} stare at {name}\'s hands. Adults look away. The scars tell a story the market would rather not hear.',
    '{name} occupies a room in {culture} with a settled, heavy weight. Already tested. Does not speak of it.',
  ],
  fallen_noble: [
    '{name} came from higher in {culture} than they now stand. A {archetype} whose manner speaks of former station.',
    'In {culture}, {name} is recognized by how they move, not what they wear. The bearing outlasted the station.',
    'Tavern keepers in {culture} notice {name} holds a cup like a goblet. The body remembers a life the rest of them left behind.',
    '{name} carries the gravity of dispossession through {culture}. Once held something significant. Has not forgotten.',
  ],
  true_believer: [
    'In {culture}, {name} is organized around conviction. The certainty is the first thing everyone navigates.',
    'Ask about {name} in {culture} and you hear the same word first: conviction. The object matters less than the purity of holding it.',
    'People step aside when {name} walks with purpose in {culture}. Which is always.',
    '{name}\'s faith in {culture} is not in question. A {archetype} who found their principle and arranged everything else around it.',
  ],
  schemer: [
    'They say {name} thinks three moves ahead in {culture}. Appears to think only of the immediate.',
    'In {culture}, {name} reads rooms. Sees the conversation beneath the surface one.',
    '{name} is the {archetype} in {culture} that other careful people watch. Patience mistaken for passivity — until it isn\'t.',
    'They say {name} settled a dispute in {culture} by doing nothing for three seasons, then speaking one sentence.',
  ],
  wanderer: [
    '{name} passed through {culture} as they pass through everywhere. A {archetype} for whom belonging is always temporary.',
    'In {culture} they know {name} the way you know a river that changes course. Motion is the one constant.',
    'A trader in {culture} swears they saw {name} on three different roads the same week, heading different directions each time.',
    '{name} has been through {culture} before. No one agrees when, or which direction.',
  ],
  monster: [
    '{name} from {culture} is not quite what they appear. The shape resists the categories others press onto it.',
    'In {culture}, {name} is spoken of with careful ambivalence. A {archetype} reserved for things that do not fit cleanly.',
    'Dogs go quiet when {name} enters a room in {culture}. People say it is nothing, but they say it every time.',
    '{name} occupies a category in {culture} that the available categories do not contain. The wrongness is felt before it is understood.',
  ],
  folk_hero: [
    '{name} became a story in {culture} before they finished being a person. A {archetype} whose reputation runs ahead of the facts.',
    'They say {name} of {culture} did something. The details vary by who you ask.',
    'In the markets of {culture}, {name}\'s name settles arguments. Whether {name} would agree is a question nobody asks.',
    'The stories about {name} in {culture} already have the inconsistencies of legend. More interesting at a remove than in person.',
  ],
  reluctant_king: [
    '{name} holds authority in {culture} the way someone holds a borrowed object. A {archetype} who did not seek this.',
    'They say {name} was given power in {culture} three times, refused it, and accepted the fourth.',
    'The advisors of {culture} say {name} makes better decisions tired than most leaders make rested.',
    '{name}\'s discomfort with authority in {culture} is itself a form of authority. Reluctance worn visibly is still a statement.',
  ],
  oathkeeper: [
    '{name} from {culture} is someone whose word is load-bearing. Said something once and has been carrying it since.',
    'In {culture}, {name}\'s promises are treated as facts. A {archetype} for whom the oath is the end itself.',
    'They say {name} walked three weeks through winter to keep an appointment in {culture} the other party had forgotten.',
    'In {culture}, {name}\'s word is treated as infrastructure. Predictable the way foundations are predictable.',
  ],
  poisoned_court: [
    '{name} reads every room in {culture} for the conversation beneath the surface one. Trained where inattention had costs.',
    'In {culture}, {name} is known as someone who knows things. A {archetype} trained where information and danger were the same resource.',
    'Those who deal with {name} in {culture} describe the same quality: being assessed while the conversation proceeds on other terms.',
    '{name} smiles at everyone in {culture}. The warmth is real. None of it prevents them from using what they learn.',
  ],
  doomed_innocent: [
    '{name} moves through {culture} with a goodness that observers find admirable and faintly alarming.',
    'In {culture} they speak of {name} the way they speak of something fragile that keeps not breaking. A {archetype} whose integrity has survived.',
    'Hardened people in {culture} find themselves lying to {name} about how bad things are.',
    '{name} carries goodness in {culture}. The world conspires to protect it. The protection cannot last.',
  ],
  old_power: [
    '{name} has the authority in {culture} that accumulates over time. Watched enough cycles repeat to know this moment is temporary.',
    'In {culture}, {name} was here before the current arrangement. A {archetype} who will likely be here after.',
    'Ask about {name} in {culture} and people lower their voices before answering.',
    'Young leaders in {culture} seek {name}\'s counsel and then wish they had not.',
  ],
  kingmaker: [
    '{name} in {culture} prefers authority that does not require a crown. Shapes thrones from a careful distance.',
    'In {culture}, {name} stands behind the person making decisions. A {archetype} whose power is most comfortable when held by someone else.',
    'Three rulers in {culture} owe their positions to {name}. Two of them know it.',
    '{name}\'s influence in {culture} is most visible in decisions they appear not to have made.',
  ],
  seeker: [
    '{name} has been looking for something since before they could name it. The destination keeps revising itself.',
    'In {culture}, {name} asks questions other people have stopped asking. A {archetype} for whom the search is the primary fact.',
    '{name}\'s attention in {culture} snags on things others pass by. Bystanders feel inadequate for not having noticed.',
    'A librarian in {culture} said {name} reads the way a starving person eats — without pause, without discrimination.',
  ],
  maker: [
    '{name} in {culture} is known by what they have built. A {archetype} for whom making is not optional but constitutional.',
    'Visit any workshop in {culture} and someone will point to a technique and say: that is how {name} taught them.',
    '{name} is known in {culture} by what they left behind. Not monuments — smaller, more persistent things.',
    'In {culture}, {name} participates in the world by imposing intention on the available material.',
  ],
  noble_savage: [
    '{name} belongs to {culture} and somewhere else simultaneously. A {archetype} conversant in both worlds, claiming neither.',
    'In {culture}, {name} carries more than one set of assumptions. The value comes from belonging fully to neither.',
    'When {culture} and the wilds disagree, {name} is who both sides send for.',
    '{name} arrives in {culture} as a question. Formed in circumstances most of {culture} cannot fully imagine.',
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
    'There is an economy in how {name} applies {sphere} — nothing wasted, nothing held in reserve beyond what the moment requires. Observers feel it as readiness rather than threat, though the readiness contains it.',
    'The {sphere} is present in {name} in the gap between provocation and response — a potential that does not require demonstration to be understood. This is what long discipline produces, and in {name} it is thorough.',
  ],
  matter: [
    'The {sphere} is present in {name} as a kind of groundedness — an attention to the physical texture of things, the weight of objects, the resistance of what cannot simply be wished different.',
    '{name} carries the mark of {sphere} in their practical intelligence. They think in terms of what things are made of and what that determines about what can be done with them.',
    'The {sphere} shows in {name} through their hands — how they touch things to assess them, how they check structural integrity before trusting weight to a surface. They know the difference between what looks solid and what is.',
    'There is something the {sphere} has organized in {name} around patience with the physical: the understanding that materials have their own requirements and working against them produces inferior results.',
  ],
  energy: [
    'The {sphere} moves through {name} in the way heat moves through metal — not announced, but detectable in the warmth of nearby surfaces and the speed with which things near them tend to change.',
    'Those sensitive to such things feel {sphere} in {name} as a restlessness, an orientation toward motion and transformation that makes stillness feel like a temporary condition, not a resting state.',
    'Those near {name} feel {sphere} as a shift in available possibility — not that more is possible, but that what is possible feels closer, more immediately live, like something about to move.',
    'The {sphere} manifests in {name} as a structural preference for what is changing over what is settled. Observers read this as vitality or instability depending on their own relationship to stillness.',
  ],
  life: [
    'The {sphere} is present in {name} in the way vitality is present — as an appetite, a responsiveness, a tendency to grow in available directions rather than stop at imposed boundaries.',
    '{name} carries {sphere} in the specific quality of their attention: a sensitivity to what is alive and what is dying, what has momentum and what has run down.',
    'The {sphere} is visible in {name} in their attention toward things that grow: plants left to wilt in others\' care that find their way toward health in {name}\'s. {life} chooses its agents partly through tendency.',
    'Those who know {name} recognize the {sphere} in their inconvenient empathy — the inability to pass suffering without calculating what address would cost. Not goodness exactly, but the orientation of someone for whom life is the primary concern.',
  ],
  mind: [
    'The {sphere} marks {name} in the clarity of their reasoning and the speed with which they navigate between evidence and conclusion. Thought is their primary medium.',
    'Those near {name} feel {sphere} in the way the conversation becomes more structured, more careful, more oriented toward understanding than toward comfort.',
    'The {sphere} shows in {name} in how they receive information: each fact placed in relation to existing structure, tested for fit, assigned a position. Not simply intelligence — a particular architecture of it.',
    'There is something in how {name} handles disagreement that marks them as touched by {sphere}: a genuine desire to understand the other position before refuting it, a belief that error deserves attention rather than dismissal.',
  ],
  spirit: [
    'The {sphere} is present in {name} as a quality of seriousness — the sense that certain things are weighted, that some obligations are older than the people carrying them.',
    '{name} carries {sphere} in the way they attend to what cannot be seen: the obligation, the memory, the presence of what has not finished making its demands.',
    'The {sphere} marks {name} in their relationship to the dead — an acknowledgment of obligation toward the past that others find either moving or excessive, depending on their own relationship to what has gone.',
    'Those near {name} feel {sphere} in the weight of certain conversations — the sense that what is being discussed has roots they cannot see, that the present moment is also a point in a very long story.',
  ],
  time: [
    'The {sphere} marks {name} as someone who thinks in befores and afters — who hears the current moment as a note in a longer sequence, not as something that stands alone.',
    'Those who know {name} feel {sphere} in how they carry the past forward without being crushed by it, and how they read the present for the future already embedded in it.',
    'The {sphere} shows in {name} through what they notice: the weathered pattern on stone that speaks of repeated passage, the way a settlement\'s newest buildings reveal what its oldest ones were protecting against.',
    'There is a patience in {name} that {sphere} produces and nothing else could — the specific calm of someone who has accepted that the present is not the whole story, and that they are not the only relevant chapter in it.',
  ],
  entropy: [
    'The {sphere} is present in {name} as an unsentimental clarity about endings — a matter-of-fact acknowledgment that things wind down, and that this is information, not catastrophe.',
    '{name} carries {sphere} in their particular patience with decay: the knowledge that what falls apart does so according to its own logic, and that logic can be worked with.',
    'The {sphere} marks {name} in how they respond to failure: not grief, not anger, but assessment. What gave way. Why. Whether the collapse was structural or circumstantial. What would need to differ for the next attempt.',
    'Those near {name} feel {sphere} in their relationship to attachment: the quality of valuing things while understanding they are temporary, the equanimity that produces, and the specific grief it does not prevent.',
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
    'The {basis} between {name} and {bond} survived several tests it should not have survived, which is either demonstration of its quality or an indictment of {name}\'s judgment — probably both, and the combination is its own kind of durability.',
    'It was not any single thing that made {name} trust {bond}. It was the accumulation: small consistencies over enough time that the pattern became undeniable. A {basis} that built itself without announcement.',
  ],
  rivalry: [
    'The {basis} with {bond} is the kind that sharpens rather than destroys — {name} understands their own edges better for having pressed against someone who pushes back.',
    '{name} and {bond} have been measuring each other for long enough that the measurement has become its own form of intimacy. Some rivalries are the most honest relationships a person has.',
    'The day {name} and {bond}\'s {basis} began, neither intended it to last this long. Most rivalries are extinguished by victory or defeat; what sustained theirs was the specific equality of the contest.',
    '{name} and {bond} discovered through their {basis} that competition done right is a form of care — the specific respect of refusing to let the other remain less than capable.',
  ],
  loyalty: [
    'The {basis} {name} bears toward {bond} was not chosen so much as arrived at — a commitment that accumulated through shared difficulty until it became foundational rather than incidental.',
    '{name}\'s {basis} to {bond} has been tested in the specific way that demonstrates whether loyalty is real or merely comfortable. It has proven real.',
    'There is a moment in every {basis} when the question stops being theoretical and the answer turns out to be yes. For {name} and {bond}, that moment came once, and the answer was not in question after it.',
    'What {name}\'s {basis} to {bond} cost them, over the years, is not what anyone watching from outside would have guessed. The cost was specific, real, and paid without accounting.',
  ],
  alliance: [
    'The {basis} between {name} and {bond} began in mutual interest and has lasted long enough to become something else — a cooperation that neither party fully remembers beginning.',
    '{name} and {bond} built their {basis} on the practical ground of shared goals and have been surprised to discover, over time, that practical ground can support weight neither expected.',
    'The {basis} between {name} and {bond} was built on the kind of foundation that supports real structures: not affection, but complementary need that persisted beyond the original circumstances that created it.',
    'What {name} and {bond} discovered over the course of their {basis} is that shared interest, maintained long enough, generates something that cannot be fully distinguished from regard.',
  ],
  trade: [
    'The {basis} relationship with {bond} showed {name} something about exchange that abstracted principles never could — that what passes between people carries more than its stated value.',
    '{name} and {bond} know each other through the honest medium of {basis}: what one has that the other needs, and whether the price asked is the price meant.',
    'The first {basis} between {name} and {bond} established something neither of them named at the time: not the transaction, but the reliability of it. Fair dealing, repeated. The trust grew from the consistency.',
    'In the {basis} with {bond}, {name} learned something that took time to articulate: that what you offer and what you receive says something about what you believe the other person is worth.',
  ],
  faith: [
    'The {basis} that connects {name} and {bond} runs deeper than personal affection — it is a shared orientation toward something larger than either of them, which makes it both more durable and more fragile.',
    '{name} and {bond} share a {basis} that has survived the specific tests that shared conviction survives: the moments when the conviction costs something real.',
    'The {basis} that connected {name} and {bond} was built on shared conviction — the kind of agreement that functions as identity, that says not just what you believe but who you are for believing it.',
    'Through {bond}, {name}\'s {basis} encountered the specific challenge of shared belief held differently. The difference required negotiation. The negotiation deepened the bond in ways agreement never would.',
  ],
  lineage: [
    'The {basis} between {name} and {bond} is older than their choices — a connection established before either of them had language for it, carrying obligations and gifts in equal measure.',
    '{name}\'s {basis} bond with {bond} is the kind that does not require maintenance because it was not constructed. It simply is, and has been, and carries weight accordingly.',
    'The {basis} that connects {name} and {bond} carries weight accumulated before either was old enough to understand its terms. By the time they could, it had already shaped them both.',
    '{name}\'s {basis} with {bond} has always been partly an argument with the past: a negotiation between the inheritance they were given and the relationship they would have chosen.',
  ],
  gratitude: [
    'What {name} owes {bond} is the kind of {basis} that resists being repaid — not because {bond} holds it over them, but because the scale of it exceeds what accounting can reach.',
    'The {basis} {name} bears toward {bond} was not asked for and could not have been anticipated. Some debts are of the kind that become love before they become obligation.',
    'What {bond} did for {name} in the moment of {basis} was not asked for and could not have been anticipated. {name} has spent time since then tracing what they have now back to that one intervention.',
    'The {basis} {name} bears toward {bond} has the texture of something that has outlasted its reason — transformed from obligation into something more complicated and more real.',
  ],
};

// ─── Table 4: BOND_HISTORY_NEGATIVE_PROSE ────────────────────────────────────
// Stratum 2. Significant negative-sentiment bond by basis type.
// Key: bond basis. Placeholders: {name}, {bond}, {basis}.

export const BOND_HISTORY_NEGATIVE_PROSE: Record<string, string[]> = {
  friendship: [
    'The {basis} that once existed between {name} and {bond} has become something else — not its opposite exactly, but its shadow, carrying the shape of what it was without the warmth.',
    '{name}\'s history with {bond} contains a {basis} that did not survive what happened to it. What remains is the memory of trust and the specific pain of its absence.',
    'What ended the {basis} between {name} and {bond} was not one thing but an accumulation — each failure insufficient on its own, together decisive. The sum became impossible after the components had each seemed survivable.',
    'The specific difficulty of {name}\'s current relationship with {bond} is the memory of what it was. Trust broken leaves a shape. The new thing occupies the same space but is not the same thing.',
  ],
  rivalry: [
    'The {basis} with {bond} has moved past productive friction into something sharper — a competition that no longer sharpens {name} so much as occupies them.',
    '{name} and {bond} have been in {basis} long enough that it has become a habit neither has chosen to break, though both might benefit from ending it.',
    'The {basis} between {name} and {bond} became damaging when it lost its purpose — when defeating the other stopped being the goal and became, instead, the occupation that crowded everything else out.',
    'What {name}\'s {basis} with {bond} revealed, over time, was a calculation: how much of the available energy was going to the contest and could not be recovered. The answer was more than {name} was prepared to admit.',
  ],
  loyalty: [
    'The {basis} {name} gave to {bond} was returned in ways that have made future loyalty significantly more expensive. The lesson was specific and has not faded.',
    '{name}\'s {basis} to {bond} encountered something it could not survive and did not. What replaced it is not the opposite of loyalty but its scar.',
    'The {basis} {name} gave to {bond} was not given lightly, which is why the quality of its return has taken so long to process. Things given with that weight, returned poorly, leave something that does not resolve into a simple emotion.',
    'What {name} learned through {bond}\'s failure of {basis} was specific and useful: the difference between the display of reliability and its substance. The lesson cost more than it should have and was learned completely.',
  ],
  alliance: [
    'The {basis} with {bond} revealed that mutual interest extends only as far as the interests actually align, and that {name} and {bond} discovered the edges of that distance.',
    '{name} and {bond} built an {basis} on shared goals and discovered that goals shared on the surface can diverge at the root. The divergence was costly.',
    'The {basis} between {name} and {bond} was built on premises that turned out to be imprecise — goals that seemed shared and revealed themselves, when tested, to diverge at exactly the point where it mattered most.',
    'What the failure of the {basis} with {bond} revealed was not dishonesty exactly — both parties had believed what they claimed. It was the discovery that belief without examination is insufficient.',
  ],
  trade: [
    'The {basis} relationship with {bond} ended in an imbalance that neither party will describe the same way. {name} remembers the terms differently than {bond} does.',
    '{name} and {bond} know what {trade} looks like when it fails: what was given and not returned, what was promised and not delivered, what was taken without asking.',
    'The ledger of {name}\'s {basis} with {bond} has never balanced, and {name} is aware that there are two accounts of why: their own and {bond}\'s, and the distance between them is unnavigable.',
    'What the {basis} with {bond} ended in was not bad faith so much as asymmetric calculation — both parties attending to the same exchange and arriving at entirely different conclusions about its terms.',
  ],
  faith: [
    'The {basis} that connected {name} and {bond} did not survive the discovery that faith is not always equally distributed, or equally sincere.',
    '{name} and {bond} shared a {basis} that was tested by something that revealed one of them had always held it lightly. The revelation was not easily forgiven.',
    'The fracture in the {basis} that connected {name} and {bond} came not through belief failing but through the discovery that the shared belief had been shared less completely than either had assumed. The difference was, in the end, fundamental.',
    'What {name}\'s history with {bond} in the domain of {basis} revealed was something about conviction: that it is not portable between people even when the same words are being used.',
  ],
  lineage: [
    'The {basis} between {name} and {bond} is older than their choices and more difficult to escape for that reason. Some connections are burdens before they are gifts.',
    '{name}\'s {basis} bond with {bond} carries obligations that feel more like chains than roots — an inheritance that was not chosen and has not been welcome.',
    'The {basis} that binds {name} and {bond} is not chosen and cannot be ended — only managed. {name} has arrived at a position on this that functions in practical terms and requires not examining too closely.',
    'What the {basis} bond with {bond} has taught {name} is that unchosen connection is no less real than chosen connection and no more virtuous. It simply is, and the absence of choice makes the weight no lighter.',
  ],
  gratitude: [
    'What {name} owes {bond} has become a weight rather than a bond — a {basis} invoked in ways that transform it from connection into leverage.',
    'The {basis} that should connect {name} and {bond} has curdled into something else: a debt cited rather than honored, a history used rather than shared.',
    'What began as {name}\'s {basis} toward {bond} has been converted, through the way {bond} has referenced it, into something else — a history cited more than acknowledged, a connection transformed by use into leverage.',
    'The {basis} has curdled not because {bond} wronged {name}, but because {bond} understood the {basis} differently. What {name} felt as connection, {bond} appears to have experienced as obligation — and has collected accordingly.',
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
  mercy_ruthlessness: [
    'Something shifted in {name} when they chose {value} in a situation where the other option was genuinely available. The choice revealed a hierarchy that has been consistent since.',
    'The day {name} committed to {value} came through an encounter with suffering — their own or someone else\'s — that made the question immediate rather than philosophical.',
    '{name}\'s relationship with {value} was shaped by a circumstance in which the cost of it was visible and they paid it anyway. That payment established a precedent.',
    'Something shifted in {name} when {value} was tested against a provocation significant enough that the alternative would have been understood. They chose {value}. The choice had consequences.',
  ],
  asceticism_extravagance: [
    'Something shifted in {name} the day they chose {value} in a circumstance where scarcity or abundance made the choice real rather than abstract.',
    'The moment {name} settled into {value} as an operating principle came through a specific event that made the alternative visible and, ultimately, insufficient.',
    '{name}\'s relationship with {value} was established through a situation that required it to be enacted rather than merely believed. The enactment has been consistent since.',
  ],
  honesty_cunning: [
    'Something shifted in {name} when {value} became the operating principle rather than the occasional tactic — a moment when it moved from behavior to character.',
    'The turn toward {value} for {name} came through a situation where the alternative was possible and declined. The decline was a statement about the kind of person they intended to be.',
    '{name}\'s commitment to {value} was tested once in a specific way, and the test was passed at a cost. The cost has been consistent with having a principle.',
  ],
  tradition_novelty: [
    'Something shifted in {name} when they chose {value} in a situation where the alternative was not only available but recommended by people they respected. The choice was a declaration.',
    'The turn toward {value} arrived for {name} through a moment when the past and the future were both live options. What they chose in that moment has been their orientation since.',
    '{name}\'s relationship with {value} was forged in circumstances that made the choice between inheritance and change consequential and irreversible.',
  ],
  loyalty_ambition: [
    'Something shifted in {name} the day they chose {value} over its opposite — a decision that set a direction they have been traveling in since, further than they can see back to the origin.',
    '{name}\'s relationship with {value} was not always settled. There was a moment when the alternative was genuinely available, and the choice made then has been the organizing fact since.',
    'Something shifted in {name} when {value} was tested against something that made it genuinely costly. The test was passed. The passing left a mark.',
  ],
  revelation_discretion: [
    'Something shifted in {name} when {value} became a reflex rather than a choice — the moment when speaking or withholding became character rather than tactic.',
    '{name}\'s commitment to {value} was tested in a conversation that could not be taken back. What was said or unsaid in that moment has been the template since.',
    'The turning point for {name} and {value} arrived through a situation where what they knew could protect someone or destroy them depending on how it was handled. The handling defined them.',
    'The day {name} chose {value} came through holding a dangerous secret — the kind that could topple a person, a house, a quiet arrangement that had lasted decades. How they held it told them what kind of truth-seeker or secret-keeper they were.',
  ],
  preservation_transformation: [
    'Something shifted in {name} the day they chose {value} in a situation where the other posture was available. The choice was a statement about what kind of authority they intended to exercise.',
    'The moment {name} settled into {value} came through a circumstance that offered them a different kind of power than they chose. The declining was the declaration.',
    '{name}\'s commitment to {value} was established through a situation in which the alternative would have been satisfying in the short term and damaging in the long. They chose correctly.',
    'When the ancient wall crumbled, {name} faced a choice that had no clean answer: shore up the old stones at great cost, or let them fall and build something new. The fortress posture and the forge posture were both available. The one they chose has been their stance since.',
    'Something shifted in {name} when the structure they had spent years protecting began to fail. Repair or replace, fortress or forge — the choice, and the reasoning behind it, established the kind of builder they were willing to be.',
  ],
  sacrifice_survival: [
    'Something shifted in {name} the day they chose {value} — a declaration about where their allegiance finally resided that has not been revised since.',
    'The turn toward {value} arrived for {name} in circumstances that forced the question from abstract to immediate. What they chose in that moment was not a statement about belief but about self.',
    '{name}\'s relationship with {value} was established through an event that made the alternative not just undesirable but impossible — a choice that was also a discovery.',
    'Something shifted in {name} when {value} stopped being temperament and became discipline — the moment endurance was either mastered or surrendered to deliberately.',
  ],
  courage_prudence: [
    'Something shifted in {name} the day they chose {value} — not dramatically, but definitively, in a circumstance that required the thing to be named.',
    '{name}\'s relationship with {value} was forged in a situation that made the alternative visible and rejected it. The rejection was a declaration.',
    'The moment {name} settled into {value} arrived through a test that was not abstract. What it cost them to choose it is part of why the choice has held.',
  ],
};

// ─── Table 7: CONTRADICTION_PROSE ────────────────────────────────────────────
// Stratum 3. Internal contradiction where opposing values are near-equal.
// Key: ValuePair. Placeholders: {name}, {left_pole}, {right_pole}.
// Tone: Psychological exposure. "{name} is both {left_pole} and {right_pole} — not in balance, but in war..."

export const CONTRADICTION_PROSE: Record<string, string[]> = {
  mercy_ruthlessness: [
    '{name} holds {left_pole} and {right_pole} in approximately equal measure — both are genuine, neither is settled, and the question of which operates depends on circumstances they do not always control.',
    'The hardness and the softness in {name} have not resolved into a hierarchy. {left_pole} and {right_pole} coexist, each active in the circumstances that call for it.',
    'The balance of {left_pole} and {right_pole} in {name} produces something that looks like calm but is more accurately described as held tension. The patience is real; what it contains is also real.',
  ],
  asceticism_extravagance: [
    '{name} holds both {left_pole} and {right_pole} in near-equal measure — they are often in direct competition, and the winner is situational.',
    'The {left_pole} part of {name} and the {right_pole} part are close enough in strength that the outcome is often a compromise neither fully satisfies.',
    'What the near-equal {left_pole} and {right_pole} produces in {name} is a person who experiences abundance and scarcity simultaneously — who can give in one moment and calculate the cost of giving in the next, and find both responses genuine.',
  ],
  honesty_cunning: [
    '{name} is pulled toward both {left_pole} and {right_pole} with equal force — the honest part and the strategic part are in ongoing negotiation that neither wins.',
    'The contradiction between {left_pole} and {right_pole} in {name} has not simplified. They are sometimes more open than useful and sometimes more closed than comfortable.',
    'The war in {name} between {left_pole} and {right_pole} is not ethical. It is practical. Both work; which works better in a given circumstance is not always clear until after. This is what sustains the argument between them.',
  ],
  tradition_novelty: [
    '{name} is equally drawn to {left_pole} and {right_pole} — the appeal of each is partly the critique it offers of the other, a loop without obvious exit.',
    'The {left_pole} and the {right_pole} in {name} are matched forces. They respect inheritance and resist it in approximately equal measure.',
    'What {name}\'s equal {left_pole} and {right_pole} produces is a specific restlessness: the sense that both the inherited and the invented are inadequate, that what is needed has no name yet.',
  ],
  loyalty_ambition: [
    '{name} is both {left_pole} and {right_pole} — not in balance, but in war. The desire to achieve and the desire to stop achieving cancel each other in cycles that have become weather rather than choice.',
    '{name} is neither reliably {left_pole} nor reliably {right_pole} — the near-equal weight of both makes every significant relationship a variable outcome.',
    'The {left_pole} and {right_pole} in {name} are not in conflict so much as in ongoing negotiation about what any given relationship actually merits.',
  ],
  revelation_discretion: [
    '{name}\'s {left_pole} and {right_pole} wage constant war — the urge to speak plain and the instinct to smooth things over alternate without resolution.',
    'The contradiction between {left_pole} and {right_pole} in {name} surfaces in every conversation that matters. They say too much and then too little, and neither feels like the right amount.',
    'What others read as inconsistency in {name} is the genuine tension between {left_pole} and {right_pole} — knowing that every disclosure is also a concealment, and every silence is also a choice.',
  ],
  preservation_transformation: [
    '{name} navigates between {left_pole} and {right_pole} without having resolved which is more natural. Both are genuine; neither is settled.',
    'The part of {name} that needs to be in charge and the part that needs to not be responsible are in approximate balance, making every situation of authority slightly uncomfortable.',
    '{name}\'s {left_pole} and {right_pole} produce the specific discomfort of someone who is always aware of both options — who cannot take authority without questioning it, and cannot decline it without questioning that too.',
  ],
  sacrifice_survival: [
    '{name}\'s pull toward {left_pole} and pull toward {right_pole} have reached suspended tension — they cannot fully give themselves over and cannot fully withdraw.',
    'Every bond {name} forms contains the implicit negotiation between {left_pole} and {right_pole} — an internal argument that has not concluded and may not.',
    'What the equal pull of {left_pole} and {right_pole} produces in {name} is a person who enters commitments while holding the exit in view — not intending to use it, but unable to stop keeping it available.',
    '{name}\'s {left_pole} and {right_pole} are locked in a war that produces unpredictable weather — long calms interrupted by sudden storms, and neither state feels entirely chosen.',
  ],
  courage_prudence: [
    '{name} is pulled equally toward {left_pole} and {right_pole} — the part that faces danger and the part that calculates it are of equal influence, producing a person who acts and second-guesses with equal facility.',
    'The tension between {left_pole} and {right_pole} runs through every significant decision {name} makes. Neither wins cleanly. Both leave marks.',
    'What the balance of {left_pole} and {right_pole} produces in {name} is a person who acts and then second-guesses the action with equal investment. The doubt is not weakness; it is the other half of them, with equal claim.',
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
  'What {name} has that most people do not is settled hierarchy — a clear answer to the question of what matters most, arrived at not through certainty but through having been forced to choose repeatedly until the question stopped feeling open.',
];

// ─── Table 9: FEAR_PROSE ─────────────────────────────────────────────────────
// Stratum 3. Shadow fear from the agent's strongest axiological value.
// Key: valuePair_positive (fear from positive pole) or valuePair_negative (fear from negative pole).
// Placeholders: {name}, {fear}, {value}.
// Tone: Vulnerability exposed. "What {name} will never admit..."

export const FEAR_PROSE: Record<string, string[]> = {
  // mercy_ruthlessness
  courage_prudence_positive: [
    'What {name} will never admit is that {value} is maintained partly against the {fear} of exposure — the moment when the strength they project would be revealed as calculation in disguise.',
    'Beneath the {value} in {name} is a {fear} they do not name: that the courage they display would, under sufficient pressure, reveal itself as performed rather than real.',
    'The {value} that {name} projects has behind it the {fear} of what they would discover about themselves if the projection were dropped — not cowardice, but something more specific: that the {value} is maintenance, not identity.',
    '{name} volunteers first for every danger and sleeps poorly afterward. The {fear} is not of the danger. It is of the night they hesitate — and what the hesitation would confirm about the distance between {value} and performance.',
  ],
  courage_prudence_negative: [
    'What {name} will never admit is that their {value} is partly about the {fear} of their own recklessness — the conviction that without careful calculation, something catastrophic would result.',
    'The {value} in {name} sits over a {fear} of what happens when calculation fails and impulse takes over. The discipline is as much protection against themselves as against the world.',
    'The specific fear inside {name}\'s {value} is not of external danger but of internal failure: the moment when the calculation fails and the instinct takes over, and the instinct turns out to have been wrong about what it understood.',
    'People close to {name} notice the lists, the contingencies, the plans within plans. What they do not see is the {fear} that the plans are for: one reckless moment undoing everything {value} has carefully kept intact.',
  ],
  // honesty_cunning
  honesty_cunning_positive: [
    'What {name} will never admit is that behind the {value} they practice is the {fear} of being outwitted — found by someone better at the same game, aimed in the other direction.',
    'The {value} in {name} is maintained partly against the {fear} that the deception, if discovered, will define everything that came before it. The fear makes the practice more careful and no less present.',
    'The specific {fear} beneath {name}\'s {value} is erosion: the question of whether the practice, maintained long enough, has made them into something that cannot return to the alternative even when the alternative becomes necessary.',
    '{name} keeps no journal, writes no letters, avoids being alone with people who ask direct questions. The {fear} is not of enemies knowing the truth. It is of anyone knowing — because {value}, practiced long enough, has left {name} uncertain which version is the original.',
  ],
  honesty_cunning_negative: [
    'What {name} will never admit is that their {value} sits next to a {fear} that circumstances will require deception and that they will be visibly bad at it.',
    'Beneath the {value} in {name} is a {fear} of what it would cost them to lie in a situation that demanded it — not moral cost, but the simpler fear of the lie being seen.',
    '{name}\'s {value} contains a quiet, specific {fear}: that the world will present a situation where {value} is not sufficient and deception would have been, and that in that moment they will be unable to deploy it in time.',
    '{name} watches the cunning prosper and says nothing. The {fear} is not that {value} is wrong. It is that {value} is expensive — and that the invoice arrives in the form of people they could have protected if they had been willing to lie.',
  ],
  // sacrifice_survival
  sacrifice_survival_positive: [
    'What {name} will never admit is that {value} contains within it the {fear} of abandonment by what they are devoted to — the discovery that the thing they organized around was unworthy.',
    'The {value} in {name} protects against, but cannot eliminate, the {fear} that what they have given themselves to will eventually require something they cannot give.',
    'The {fear} that lives inside {name}\'s {value} is not of its object failing them. It is of {value} itself — the suspicion that what they call devotion is dependency wearing a more respectable name.',
    '{name} tends the object of their {value} the way a gardener tends a plant in drought — too much water, too much attention, checking the roots when the leaves look fine. The {fear} is visible in the excess of care.',
  ],
  sacrifice_survival_negative: [
    'What {name} will never admit is that the {value} they protect is maintained against the {fear} of obligation so total it leaves no remainder of themselves.',
    'Beneath the {value} in {name} is a {fear} of being consumed by a commitment they did not fully choose, of finding that belonging has closed around them.',
    'What the {value} in {name} protects against is not external constraint but the {fear} of their own need — the possibility that the independence is elaborate avoidance of the vulnerability that connection requires.',
    '{name} leaves before being asked to stay. The {fear} has a rhythm to it — closeness building to a threshold, then departure, then the specific relief of a door closing behind them. They call this {value}. It is also flight.',
  ],
  // loyalty_ambition
  loyalty_ambition_positive: [
    'What {name} will never admit is that {value} lives next to a {fear} that is specific and named: betrayal by those they have trusted most. Not hypothetical. Already experienced, and still feared.',
    'Beneath the {value} in {name} is the {fear} that the people and causes they have bound themselves to will, when tested, prove to have been bound to something else all along.',
    'The {fear} at the center of {name}\'s {value} is not abstract. It has a history: the specific memory of having given it fully and had the giving made into a liability. The {value} continues; the {fear} is present at the foundation of it.',
    '{name} tests the people closest to them — small betrayals staged to see who notices, who stays, who leaves. They hate themselves for the testing. The {fear} is that without it, {value} is just a bet placed blind.',
  ],
  loyalty_ambition_negative: [
    'What {name} will never admit is that behind every turn they make is the {fear} of being bound by a {value} they did not choose — loyalty as chain rather than bond.',
    'The {value} in {name} is partly a response to the {fear} of being owned by commitments, of discovery that the cost of keeping faith exceeds any benefit.',
    'Behind the {value} that {name} practices is not coldness but a {fear} with a specific shape: the discovery that their defection, in the wrong circumstance, will be toward something they value less than what they abandoned.',
    '{name} has never kept a promise longer than it was useful and has never stopped counting the cost. The {fear} is not of obligation but of the door it closes — the specific future where {value} has been traded for a cage, and the key handed to someone who does not deserve it.',
  ],
  // tradition_novelty
  tradition_novelty_positive: [
    'What {name} will never admit is that behind {value} is the {fear} of loss — that the old ways are irreplaceable, and that their abandonment would mean losing something that cannot be rebuilt once gone.',
    'The {value} in {name} is maintained against the {fear} that what has been accumulated over time will be discarded by people who do not understand what it cost.',
    'The {fear} beneath {name}\'s {value} is not of change itself but of dissolution — the specific loss that comes when accumulated investment is let go by people who did not pay the cost and cannot feel what is leaving.',
    '{name} keeps objects that no longer serve a purpose and tends rituals that no one else remembers. The {fear} is in the keeping — that if they stop, the last thread connecting what was to what is will break, and no one else is holding the other end.',
  ],
  tradition_novelty_negative: [
    'What {name} will never admit is that behind the {value} is a {fear} — the fear of stagnation, of the same answer applied to every new problem, of arriving at a future that is simply the past with different furniture.',
    'The {value} in {name} sits over a {fear} of being fixed in place: of finding that adaptation is no longer possible, that the old solutions are the only ones, that the world has moved and they have not.',
    'What the {value} in {name} is defending against is not the past but the {fear} of meeting its own limit — of pushing into new territory and discovering that innovation runs out before it arrives somewhere stable.',
    '{name} dismantles things that still work and builds replacements that are not always better. The {fear} is not of the past catching them — it is of turning around and discovering they have built something that will outlive its purpose and become the very weight they were running from.',
  ],
  // preservation_transformation
  preservation_transformation_positive: [
    'What {name} will never admit is that the {value} they exercise is maintained partly against the {fear} of losing it — that control, once relinquished, cannot be recovered.',
    'Beneath the {value} in {name} is the {fear} that things without direction will not simply stall but collapse — that the absence of their intervention is not neutrality but catastrophe.',
    'The {fear} behind {name}\'s {value} is visible in its emergency form: the quality of attention given to situations that might escape management — not tyranny, but the specific anxiety of believing that without intervention, things collapse in unrecoverable ways.',
    '{name} cannot delegate without checking. Cannot leave a room without arranging it. Cannot sleep without knowing what happens next. The {fear} is not of others failing — it is of the chaos that {value} keeps at bay being real, and permanent, and patient.',
  ],
  preservation_transformation_negative: [
    'What {name} will never admit is that the {value} they display contains the {fear} of being forced into dominance — of authority arriving like a sentence rather than a choice.',
    'The {value} in {name} is maintained against the {fear} that if they occupied more space, they would do damage they could not take back. The restraint is not only principle.',
    'The {fear} at the center of {name}\'s {value} is not of responsibility avoided. It is of what responsibility reveals — the possibility that the capacity they are withholding, exercised, would confirm something about themselves they cannot currently claim is absent.',
    '{name} speaks last in every council and sits nearest the door. The {fear} is of being looked at — truly looked at — and found to contain something large enough to require the room. The {value} is a practiced smallness that costs more than it appears.',
  ],
  // mercy_ruthlessness
  mercy_ruthlessness_positive: [
    'What {name} will never admit is that behind the {value} is the {fear} of powerlessness — of having reason for anger and finding that the anger accomplishes nothing.',
    'The {value} in {name} is maintained against the {fear} that beneath the restraint is something that, once released, would not stop at the appropriate moment.',
    'The {fear} beneath {name}\'s {value} is not of powerlessness exactly. It is of a specific combination: powerlessness without the capacity for anger to make it bearable. The {value} is held partly because the alternative is only grief.',
    '{name} breaks things when alone — small things, replaceable things, in rooms where no one can hear. The {fear} is not of the anger. It is of the day the anger finds a person instead of an object, and the {value} finally arrives at what it has been building toward.',
  ],
  mercy_ruthlessness_negative: [
    'What {name} will never admit is that the {value} they display contains within it the {fear} of what happens when it runs out — the moment when the patience finally exhausts itself in an unrecoverable way.',
    'Beneath the {value} in {name} is a {fear} of their own anger: not that it doesn\'t exist, but that it is larger than they have admitted, and that one day the occasion for it will arrive.',
    'What the {value} in {name} covers is not simply anger but the {fear} of its own extinction — the possibility that the patience, held long enough, will finally exhaust itself and leave a person who cannot feel it anymore.',
    'People praise {name}\'s calm and {name} accepts the praise and does not mention what the calm is sitting on. The {fear} is geological — something buried deep enough that no one measures it, building pressure on a timeline longer than the conversations about it.',
  ],
  // asceticism_extravagance
  asceticism_extravagance_positive: [
    'What {name} will never admit is that behind the {value} is the {fear} of scarcity — not merely material want but the hollow interior state that scarcity produces, the knowledge of not-enough applied to everything.',
    'The {value} in {name} sits over a {fear} that is older than reason: that it will run out, that there will not be enough, that the margin between sufficient and insufficient is thinner than it looks.',
    'The {fear} beneath {name}\'s {value} is not about objects. It is about the interior state of not-enough: the specific quality of hunger that does not know how to recognize satisfaction and so continues past the point where a different person would stop.',
    '{name} counts things — coins, stores, alliances, debts owed. The counting is a ritual against the {fear}. The number is never large enough because the {fear} is not a number. It is a feeling, and feelings do not respond to arithmetic.',
  ],
  asceticism_extravagance_negative: [
    'What {name} will never admit is that behind the {value} they practice is the {fear} of discovering it was conditional — that the generosity will eventually reach a limit and the limit will say something about who they actually are.',
    'The {value} in {name} contains the {fear} of its own dissolution: that the conditions that make it possible will be removed, and what will emerge is not what they have shown the world.',
    'What the {value} in {name} sits on top of is not virtue but {fear}: the discovery that at some depth, the same calculus operates that they most dislike in others — that the generosity is generous partly because they are afraid of what they are when it is absent.',
    '{name} gives until it hurts and then gives past the hurting. The {fear} is of the moment they stop — not because stopping is wrong, but because stopping would require them to sit with who they are when they are not giving. And they have not met that person yet.',
  ],
  // revelation_discretion
  revelation_discretion_positive: [
    'What {name} will never admit is that their {value} is maintained against the {fear} of being silenced — of learning that the truth, spoken plainly, costs more than the silence it replaces.',
    'Beneath the {value} in {name} is the {fear} that bluntness, in the wrong moment, will do damage that diplomacy could have prevented. The {value} continues; the {fear} shapes every word.',
  ],
  revelation_discretion_negative: [
    'What {name} will never admit is that behind the {value} they practise is the {fear} of exposure — of having the raw, unpolished self seen by someone who matters.',
    'The {value} in {name} sits over the {fear} that without the mask of courtesy, something unacceptable would be visible. The propriety is armour; the {fear} is of going without it.',
  ],
};

// ─── Table 10: HIDDEN_MOTIVE_PROSE ───────────────────────────────────────────
// Stratum 3. Hidden motive by cooperation strategy.
// Key: cooperationStrategy (hyphens, not underscores).
// Placeholders: {name}, {strategy_description}.
// Tone: Behavioral insight. "Watch {name} long enough and a pattern emerges..."

export const HIDDEN_MOTIVE_PROSE: Record<string, string[]> = {
  'tit-for-tat': [
    '{name} is a mirror wearing a face. {strategy_description} — but strip the behavior back and there is no fixed position underneath, only the reflection of whoever stands opposite.',
    'Watch {name} in different company and you are watching different people. {strategy_description}, and the hidden truth is that the compass needle points wherever the nearest magnet pulls it. In good company, {name} is good. The other possibility keeps their allies close.',
    'The pattern beneath {name}\'s {strategy_description} is not fairness but absence — the absence of a position that exists independent of stimulus. They return what they receive with the precision of an echo, and an echo has no opinion about what it carries.',
    '{name} matches every gesture they are given, and the consistency of it looks like principle. It is not principle. {strategy_description}, and what that means is that {name}\'s moral architecture is load-bearing only when someone else provides the load.',
  ],
  grudger: [
    '{name} keeps a ledger no one has ever seen. {strategy_description} — the warmth is real, the trust is real, and both are provisional. One entry in the wrong column and the book closes permanently.',
    'The hidden architecture of {name}\'s {strategy_description} is a single threshold: every relationship is an open account until the first betrayal, at which point it becomes a closed file. The filing system is perfect. There is no appeals process.',
    'Watch how freely {name} gives trust to the untested and how completely they withdraw it from the once-tested. {strategy_description}, and the warmth that people mistake for unconditional regard is, in fact, a loan with terms written in ink that only becomes visible when the terms are broken.',
    '{name} remembers every debt. {strategy_description}, and beneath the cooperative surface runs a single wire: the certain knowledge that forgiveness, once extended to someone who has already failed the test, is not generosity but structural weakness.',
  ],
  pavlov: [
    '{name} is not choosing — {name} is optimizing. {strategy_description}, and the mechanism underneath is simpler than it appears: whatever worked yesterday, they are doing again today. If kindness paid, they are kind. If cruelty paid, they do not hesitate.',
    'The pattern beneath {name}\'s {strategy_description} is not strategy but appetite. They move toward what has previously resulted in reward and away from what brought pain, with the directness of a hand pulling back from a hot stove. Principles do not enter into it.',
    'Watch {name} long enough and you see the seams — {strategy_description}, but the behavior shifts whenever the outcomes shift. What looked like conviction last season was just a successful experiment being repeated. The experiment is always running.',
    '{name} has no fixed position on cooperation or betrayal. {strategy_description}, and what that reveals is a person shaped entirely by feedback — not learning in any moral sense, but adapting the way water adapts to the shape of its container.',
  ],
  'always-cooperate': [
    '{name} gives and gives and the giving is not generosity — it is hunger. {strategy_description}, and beneath the endless cooperation is a need to be needed that operates with the force of a compulsion. Take away the people who depend on {name} and watch what remains.',
    'The hidden motive beneath {name}\'s {strategy_description} is fear: the specific terror of being useless. They help because helping is the only state in which the fear goes quiet. The recipients do not know they are medication.',
    '{name} cooperates even when it costs them, even when the cost is visible to everyone, even when the recipients have stopped pretending to be grateful. {strategy_description} — not because {name} believes in goodness, but because the alternative is sitting with the silence of not being needed.',
    'Watch {name} when they have nothing to offer and you see the panic. {strategy_description}, and what drives it is not virtue but the bone-deep conviction that a person who is not actively useful is a person who will be left behind.',
  ],
  'always-defect': [
    '{name} takes from every exchange and the taking is not greed — it is certainty. {strategy_description}, and the conviction underneath is simple: the world is zero-sum, every gift is a trap, and the only honest move is the one that does not pretend otherwise.',
    'Watch {name} observe an act of trust between others. The expression is not contempt — it is pity. {strategy_description}, and {name} has concluded, with the patience of someone who has gathered sufficient evidence, that the trusting are simply the last to understand what is happening to them.',
    'The pattern beneath {name}\'s {strategy_description} is not malice but a finished calculation. They tried the alternatives, or watched others try them, and arrived at a conclusion that has the weight of personal empiricism. Every cooperative gesture they witness is, to them, a data point that has not yet matured.',
    '{name} is not cruel. {name} is convinced. {strategy_description}, and the architecture of that conviction is a world observed carefully enough to reveal that vulnerability is not rewarded — it is merely exploited on a longer timeline.',
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
    'Since the Ascendant first touched {name}, the arc has been visible: a {arc_phase} that was already written into the structure of who they are. Divine attention does not alter trajectories like {name}\'s — it accelerates them.',
  ],
  trickster: [
    'The thread of {name}\'s story bends toward exposure — a {arc_phase} in which the irreconcilable versions of events they have been maintaining will need to be resolved, one way or another.',
    'The arc of {name} is in {arc_phase}: the confidence is constructed, the actors positioned, and the question of which element will prove unstable is the only remaining variable.',
    'The thread of {name}\'s story contains a {arc_phase} that the trickster\'s arc always contains: the moment when the audience discovers they have been watching an improvisation. Whether {name} knows this is coming is the remaining question.',
  ],
  coming_of_age: [
    'The thread of {name}\'s story bends toward formation — a {arc_phase} in which the person they will be is being assembled from the materials the world is providing. The assembly is not finished.',
    'The arc of {name} is in {arc_phase}: old enough to understand the stakes, not yet experienced enough to have fixed their response to them. The world\'s real shape is becoming undeniable.',
    'The thread of {name}\'s story is in the long middle of {arc_phase}: the chapter that most stories gloss over because it contains more becoming than arriving. The arrival, when it comes, will be irreversible.',
  ],
  brooding_warrior: [
    'The thread of {name}\'s story bends toward release — a {arc_phase} in which the pressure that has been gathering will find its occasion. Whether the release is productive or destructive is not yet determined.',
    'The arc of {name} is in {arc_phase}: the long middle of carrying what came before toward something that has not yet announced itself. The weight is visible; the destination is not.',
    'The thread of {name}\'s story has been moving through {arc_phase} for some time — the long endurance chapter in which the burden is carried because there is no one else and no credible reason to set it down.',
  ],
  fallen_noble: [
    'The thread of {name}\'s story bends toward reckoning — a {arc_phase} in which the question of what one does with dispossession must be answered in a way that determines what comes next.',
    'The arc of {name} is in {arc_phase}: past the fall, in the territory where recovery and its impossibility are being assessed simultaneously.',
    'The thread of {name}\'s story turns on the question that dispossession always poses: {arc_phase}. Whether what was lost is recovered, transcended, or mourned into acceptance determines everything that follows.',
  ],
  true_believer: [
    'The thread of {name}\'s story bends toward cost — a {arc_phase} in which the full price of absolute conviction becomes visible, and the question of whether the belief is worth what it requires arrives.',
    'The arc of {name} is in {arc_phase}: the commitment is total, the cost is becoming visible, and the faith is being tested not by opposition but by the complexity of what it actually requires.',
    'The thread of {name}\'s story bends toward the test that conviction always encounters: {arc_phase}. When belief meets the full cost of itself, the question of whether it was ever really held is answered.',
  ],
  schemer: [
    'The thread of {name}\'s story bends toward verification — a {arc_phase} in which the long calculation either proves accurate or reveals the variable that was not accounted for.',
    'The arc of {name} is in {arc_phase}: plans in motion, contingencies prepared, waiting for events to confirm which version of the future will arrive.',
    'The thread of {name}\'s story moves through {arc_phase}: the phase of the plan where the variables that were estimated must become concrete. What was projected and what exists are about to be compared.',
  ],
  wanderer: [
    'The thread of {name}\'s story bends through — a {arc_phase} of the journey, not the destination. What they encounter now deposits something; what they carry forward will be slightly different than what they carried in.',
    'The arc of {name} is in {arc_phase}: defined by what they are passing through rather than what they are arriving at. The destination, if there is one, remains to be determined.',
    'The thread of {name}\'s story is in {arc_phase}: a passage between a place that is finished and a place that has not been found. The wanderer\'s arc is full of these — the in-between is their native country.',
  ],
  monster: [
    'The thread of {name}\'s story bends toward definition — a {arc_phase} in which the category that has been contested will be settled, one way or another, by what they do next.',
    'The arc of {name} is in {arc_phase}: what they are is not yet fixed in the permanent way it will eventually be. The current chapter is the one where definition is being made.',
    'The thread of {name}\'s story moves through {arc_phase}: the section in which the question of what they are is no longer purely a matter of perception but of choice. The monster archetype always contains the possibility of the other thing.',
  ],
  folk_hero: [
    'The thread of {name}\'s story bends toward legend — a {arc_phase} in which the gap between the events and the stories of the events is widening, and the story is becoming more real than the facts.',
    'The arc of {name} is in {arc_phase}: the process by which fact becomes myth is in progress. They are living inside it.',
    'The thread of {name}\'s story is in {arc_phase}: the moment when the person and the myth have diverged enough to require, eventually, a choice about which one continues. The legend is growing; the person underneath it is unchanged.',
  ],
  reluctant_king: [
    'The thread of {name}\'s story bends toward demonstration — a {arc_phase} in which what it means to hold power without having wanted it must be shown rather than declared.',
    'The arc of {name} is in {arc_phase}: past refusal, not yet at resolution, still carrying the authority they did not seek with visible strain.',
    'The thread of {name}\'s story moves through {arc_phase}: the section where unwanted authority either hardens into willingness or breaks under the weight of what it costs. Neither outcome is comfortable. Both are endings of a kind.',
  ],
  oathkeeper: [
    'The thread of {name}\'s story bends toward the test — a {arc_phase} in which the oath encounters something that makes keeping it significantly more difficult, and whether it holds will determine everything that follows.',
    'The arc of {name} is in {arc_phase}: the commitment is past its swearing and not yet at its completion. The long middle, where the structure of the oath is tested.',
    'The thread of {name}\'s story bends through {arc_phase}: the chapter in which the structure of the oath is visible as both architecture and cage, and the question of whether a promise that costs this much is still freely kept has not been answered.',
  ],
  poisoned_court: [
    'The thread of {name}\'s story bends toward revelation — a {arc_phase} in which the true objectives of all the established relationships become visible simultaneously.',
    'The arc of {name} is in {arc_phase}: all the pieces are in position, the game is in progress, and the question of which move will prove to be the real one is still open.',
    'The thread of {name}\'s story moves through {arc_phase}: the point in every court intrigue where the board is visible and the pieces positioned, but which move is the decisive one has not yet announced itself.',
  ],
  doomed_innocent: [
    'The thread of {name}\'s story bends toward the encounter — a {arc_phase} in which the goodness they carry meets the fact that goodness does not guarantee good outcomes.',
    'The arc of {name} is in {arc_phase}: innocence and experience in direct contact, the story either hardening the person or confirming that hardening was never the point.',
    'The thread of {name}\'s story bends through {arc_phase}: the section that the innocent archetype has to cross — the encounter with the world\'s actual terms, after which nothing will be quite as it was before.',
  ],
  old_power: [
    'The thread of {name}\'s story bends toward judgment — a {arc_phase} in which accumulated knowledge must decide whether to be applied or withheld, and the decision has permanent consequences.',
    'The arc of {name} is in {arc_phase}: they can see the shape of things from a remove that younger people cannot achieve. What they do with that perspective is the question.',
    'The thread of {name}\'s story has entered {arc_phase}: not the beginning of the end but the chapter in which accumulated pattern-recognition must decide what to do with what it knows. The knowing is complete; the application is not.',
  ],
  kingmaker: [
    'The thread of {name}\'s story bends toward consequence — a {arc_phase} in which the structures they built or enabled must either hold or reveal their weaknesses.',
    'The arc of {name} is in {arc_phase}: the architecture of influence is established; the question is what it will be used for, and by whom, and at what cost.',
    'The thread of {name}\'s story bends through {arc_phase}: the chapter in which the architect\'s work is tested not by planning but by the behavior of the things they built and the people they made powerful.',
  ],
  seeker: [
    'The thread of {name}\'s story bends toward complication — a {arc_phase} in which what they have found has complicated what they are looking for in ways that must be integrated before proceeding.',
    'The arc of {name} is in {arc_phase}: deep enough in the search that the original question has been refined several times and may no longer be recognizable from its starting form.',
    'The thread of {name}\'s story moves through {arc_phase}: deep enough in the search that the original question has been revised several times, and the most important discovery may turn out to be about the nature of searching rather than the nature of the object sought.',
  ],
  maker: [
    'The thread of {name}\'s story bends toward completion — a {arc_phase} in which the work is demanding things that were not anticipated when the making was begun.',
    'The arc of {name} is in {arc_phase}: the creation is in process, taking on its own requirements, developing a logic that was not fully present in the original intention.',
    'The thread of {name}\'s story bends through {arc_phase}: the chapter in which the created thing has started to make its own demands — in which making something brought something else into being that was not part of the original intention.',
  ],
  noble_savage: [
    'The thread of {name}\'s story bends toward resolution — a {arc_phase} in which the two inheritances must reach a working arrangement, because the crossing cannot continue indefinitely.',
    'The arc of {name} is in {arc_phase}: between worlds, the two frameworks in active negotiation, neither settled, both present, the final form still being determined.',
    'The thread of {name}\'s story moves through {arc_phase}: the chapter in which two inheritances must reach a working arrangement, because they cannot both be held at full strength indefinitely and the moment of choosing is arriving.',
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
