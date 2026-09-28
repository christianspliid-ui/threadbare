/**
 * Culture and spheres showing through — the stated-fact line tables (THR-1635).
 *
 * An encounter's opening stays authored once. At render time one extra sentence is
 * added to the end of its situation-and-complication paragraph, chosen by keys the
 * graph already carries:
 *
 *   - {@link CULTURE_CUSTOMS}`[foundation][reach]` — how the people of the town the
 *     scene plays out in handle this kind of trouble. `foundation` is the culture's
 *     social contract (chaos = honour and challenge, order = written law, light = open
 *     witness, darkness = closed circles).
 *   - {@link SPHERE_FACTS}`[dominantSphere][reach]` — what the place's power does to
 *     this kind of trouble, stated only when that sphere holds at least
 *     {@link SPHERE_FACT_MIN_SHARE} of the place's sphere score.
 *
 * One line per opening, culture first. The decision and its measurements:
 * `Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md` (from THR-1599).
 *
 * **Authoring rules** — checked by `colorationLineProblems` (doctrine checker) and the
 * table tests:
 *   - one sentence, at most {@link COLORATION_LINE_MAX_WORDS} words;
 *   - it states a custom, a cost or a pressure that bears on the test, never a mood;
 *   - tokens `{actor}`, `{demonym}`, `{place}` only — never `{culture}`, which names the
 *     *actor's* culture, and a stranger in town is exactly where the two differ;
 *   - a sphere line never names its sphere as game jargon ("matter-heavy ground") — say
 *     what the power does;
 *   - a culture cell's variants differ in the custom, not the wording, because they are
 *     what two same-foundation cultures read side by side.
 *
 * `Partial` cells are deliberate: an unauthored cell means no line, never a crash
 * (NFP #4). Slice 1 (THR-1635) ported the prototype's iron/stone/eye cells; slice 2
 * (THR-1638) authored the other five reaches for every foundation and all eight reaches
 * for the seven spheres that ever dominate a place.
 */

import type { ReachDomain } from '../types/traits';
import type { FoundationSphereName, SphereName } from '../types/index';
import { NUDGE_WORD_BUDGETS } from './content-eval/nudgeAuthoringConstants';

// ─── Constants (NFP #1) ────────────────────────────────────────────

/**
 * The dominant sphere's share of a place's total sphere score at or above which the
 * sphere line is stated. Measured on medium worlds (seeds 42 / 99): 0.35 fired on 74%
 * of places (noise); 0.55 fires on 30% · 18%.
 */
export const SPHERE_FACT_MIN_SHARE = 0.55;

/** Variants authored per culture cell; the worldgen stamp takes an ordinal modulo this. */
export const CULTURE_CUSTOM_VARIANTS = 3;

/** Variants authored per sphere cell. */
export const SPHERE_FACT_VARIANTS = 2;

/**
 * Word budget for one added line. Lives in {@link NUDGE_WORD_BUDGETS} as its own row so
 * the doctrine checker counts it separately from the opening's 80.
 */
export const COLORATION_LINE_MAX_WORDS = NUDGE_WORD_BUDGETS.colorationLine;

/** Precedence when both a culture line and a sphere line apply. The decision fixes culture first. */
export const COLORATION_CULTURE_FIRST = true;

/** Tokens a table line may use. `resolveOpeningColoration` fills `{demonym}` and `{place}`;
 *  `{actor}` is left for the rest of `enrichProse`. */
export const COLORATION_ALLOWED_TOKENS: readonly string[] = ['{actor}', '{demonym}', '{place}'];

/** A culture's social contract — its Foundation sphere. */
export type CultureFoundation = FoundationSphereName;

// ─── Culture customs ───────────────────────────────────────────────

export const CULTURE_CUSTOMS: Readonly<
  Record<CultureFoundation, Partial<Record<ReachDomain, readonly string[]>>>
> = {
  chaos: {
    iron: [
      'Among the {demonym}, whoever names a danger first has the right to face it, and three people in {place} have already claimed that right out loud.',
      'The {demonym} settle fear by challenge; if {actor} backs away now, someone else will call it cowardice by nightfall.',
      'The {demonym} give the kill to whoever strikes first, not whoever planned it, so the hunters of {place} are already racing {actor} to it.',
    ],
    stone: [
      'The {demonym} teach a craft by making the student beat the master at it once; the master here has not lost in eleven years.',
      'A {demonym} workshop keeps nothing secret from anyone willing to fight for it, and two rivals are already waiting at the door.',
      'Among the {demonym}, a craft secret changes hands by wager; the smith of {place} will teach {actor} only after losing one.',
    ],
    eye: [
      'The {demonym} have no healers\' guild; the loudest remedy wins, and three are being sold in the square this morning.',
      'Among the {demonym}, whoever brings the answer first takes the credit, and a rival is already asking the same questions.',
      'The {demonym} trust a finding only after its finder defends it in open argument, and the elders of {place} argue to win.',
    ],
    gold: [
      'Among the {demonym}, a price is settled by contest, not by haggling, and the trader of {place} has already named the game.',
      'The {demonym} pay a debt only to a creditor bold enough to collect it face to face, and {place} will judge {actor} by how it is done.',
      'A {demonym} bargain is sealed with a wager on top of the price, and backing out after the handshake is a public insult.',
    ],
    shadow: [
      'Among the {demonym}, a trick played in secret is cowardice; {actor} will be expected to claim it openly once it is done.',
      'The {demonym} settle a caught spy by duel, not trial, and anyone found sneaking in {place} must fight whoever caught them.',
      'In {place}, stolen goods belong to whoever can hold them until dawn, so the owners are already out hunting for them.',
    ],
    veil: [
      'The {demonym} let anyone practise magic, but a spell that fails before witnesses costs its caster the right to try again.',
      'Among the {demonym}, a spirit or a curse is challenged, not appeased, and {place} expects {actor} to call it out by name.',
      'The {demonym} settle rival omens by trial, and two seers of {place} have each sworn to prove the other wrong.',
    ],
    heart: [
      'Among the {demonym}, a quarrel between families is ended by a contest of champions, and both families of {place} are looking for one.',
      'The {demonym} trust a friend only after a fight, so a stranger who refuses a challenge in {place} is never let in.',
      'A {demonym} oath counts only if sworn loudly before rivals, and a promise made quietly in {place} binds no one.',
    ],
    star: [
      'The {demonym} race each other for every road worth taking, and whoever reaches the far end first claims the route.',
      'Among the {demonym}, a traveller who takes the safe road is mocked, and the guides of {place} only lead the dangerous way.',
      'The {demonym} read fate by daring it, so {place} expects {actor} to set out on the day the omens are worst.',
    ],
  },
  order: {
    iron: [
      '{place} keeps a written ordinance for this: no one approaches until the reeve signs a warrant, and the reeve is two days away.',
      'The {demonym} record every danger in the ward ledger; this one has an entry, a date, and no name beside it.',
      'By {demonym} law, whoever deals with this danger answers for any damage done, and the magistrate of {place} keeps a tally of fines.',
    ],
    stone: [
      'The {demonym} guild rolls list who may learn which technique; {actor} is not on it, and the clerk will not bend.',
      'In {place} a craft passes by indenture only; learning it outside the contract carries a fine the guild collects.',
      'The {demonym} certify a craft by examination; {actor} must pass the guild test in {place}, and the examiners fail half who sit it.',
    ],
    eye: [
      'The {demonym} close a sick quarter by ordinance; the order goes out at dusk whether the illness is named or not.',
      'The reeve of {place} wants a written finding, signed and witnessed, before anyone may act on what {actor} learns.',
      'The {demonym} permit only licensed examiners to inquire into this, and {actor} holds no licence from the council of {place}.',
    ],
    gold: [
      'In {place}, every sale over a few coins must be written in the market register, and the registrar takes a tenth.',
      'The {demonym} fix prices by council decree, so {actor} cannot haggle, only petition the council to change the rate.',
      'By {demonym} law, a debt passes to the debtor\'s heirs, and the clerk of {place} keeps the ledger of who owes what.',
    ],
    shadow: [
      'The {demonym} keep a roll at every gate of who entered and when, and the name of {actor} is already on it.',
      'In {place}, a thief is branded by statute, and the magistrate hears no plea about why it was done.',
      'The {demonym} pay informers a fixed bounty for every name, so half of {place} is watching the other half.',
    ],
    veil: [
      'The {demonym} license every practitioner of magic, and working a spell in {place} without the council\'s seal is a crime.',
      'By {demonym} law, every rite must follow the written form exactly, and a priest of {place} stands by to record each step.',
      'The {demonym} keep a register of every haunting and curse, and nothing may be done about one until it is entered.',
    ],
    heart: [
      'Among the {demonym}, a dispute goes to arbitration by statute, and anything {actor} promises outside the court is void.',
      'The {demonym} write every marriage, adoption and oath into the town book, and the book of {place} is checked before any word is trusted.',
      'In {place}, speaking for someone else needs a written mandate, and the council will not hear {actor} without one.',
    ],
    star: [
      'The {demonym} issue papers for every road, and the wardens of {place} turn back any traveller who lacks them.',
      'By {demonym} law, only a licensed guide may lead strangers out of {place}, and the licensed guides are booked for weeks.',
      'The {demonym} fix the lucky and unlucky days by decree, and leaving {place} on an unlucky one is fined.',
    ],
  },
  light: {
    iron: [
      'The {demonym} hold that a danger faced in secret is a danger lied about; half of {place} has turned out to watch.',
      'Among the {demonym}, whoever goes in must report everything to the assembly, including what they got wrong.',
      'Among the {demonym}, a danger must be announced before it is faced, so {place} will know exactly when {actor} goes in, and so will the danger.',
    ],
    stone: [
      'The {demonym} teach every craft in the open square; the master will teach {actor}, with the whole town watching every mistake.',
      'A {demonym} craft belongs to everyone, so the secret is no secret; the trouble is that nobody agrees on which version is right.',
      'A {demonym} apprentice must demonstrate each step before the town; one public failure in {place} and no master will take {actor} on again.',
    ],
    eye: [
      'The {demonym} name the sick in public; the families on that list have stopped opening their doors.',
      'The assembly of {place} meets tomorrow and will hear whatever {actor} has found, true or not.',
      'The {demonym} post every finding on the temple door, so whatever {actor} writes down will be read aloud in {place} by evening.',
    ],
    gold: [
      'The {demonym} strike every bargain aloud in the market square, and anyone in earshot may bid against it.',
      'Among the {demonym}, a seller must name the true cost of the goods first, and a hidden margin is a public shame.',
      'The {demonym} read every debt aloud at the monthly assembly, so all of {place} knows what {actor} owes and to whom.',
    ],
    shadow: [
      'The {demonym} keep no closed doors in {place}, and anyone seen going somewhere unannounced is questioned by the neighbours.',
      'Among the {demonym}, a confessed theft is forgiven and a hidden one means exile, so {actor} must decide whether to confess first.',
      'The {demonym} keep lamps burning in every street of {place} all night, so nothing moves after dark without being seen.',
    ],
    veil: [
      'The {demonym} allow magic only in the open temple court, where every word of a rite is heard and judged by the crowd.',
      'Among the {demonym}, a vision must be told to the assembly before anyone acts on it, and {place} votes on whether to believe it.',
      'The {demonym} hold that a spirit loses its grip once it is named in public, so {place} wants the name spoken aloud.',
    ],
    heart: [
      'The {demonym} settle every quarrel before the whole assembly, so both sides in {place} will speak to the crowd, not to {actor}.',
      'Among the {demonym}, a promise counts only if witnesses heard it, and {actor} will be held to every word said in {place}.',
      'The {demonym} air their grudges at the spring gathering, and a grievance kept quiet until then is treated as a lie.',
    ],
    star: [
      'The {demonym} announce every departure at the gate, and {place} expects travellers to report the road honestly when they return.',
      'Among the {demonym}, the star-readers publish every omen, so everyone in {place} already knows what the signs say about this journey.',
      'The {demonym} will not let a traveller leave unseen, so half of {place} turns out to walk {actor} to the road.',
    ],
  },
  darkness: {
    iron: [
      'The {demonym} do not speak of this thing outside the circle; the circle knows what it is and has chosen not to say.',
      'In {place}, whoever learns what lives here is bound to silence by an oath older than the town.',
      'The {demonym} send one unnamed person against such dangers at night, and {place} will deny {actor} was ever asked.',
    ],
    stone: [
      'The {demonym} pass a craft by initiation; the last step is taught only to those the circle has tested, and {actor} has not been tested.',
      'The {demonym} master will teach the method but not the reason for it, and the reason is the part that matters.',
      'Among the {demonym}, a craft is taught only to kin; {actor} must be adopted into a {place} household before the first lesson.',
    ],
    eye: [
      'The {demonym} tend their sick behind closed doors, and the circle will not say how many there are.',
      'A tribunal of {place} already knows the cause of this and has decided the answer is not for outsiders.',
      'The {demonym} burn written records of such matters; in {place}, anything {actor} learns must be carried in memory alone.',
    ],
    gold: [
      'The {demonym} trade only through a trusted go-between, and no one in {place} will name a price to a stranger\'s face.',
      'Among the {demonym}, a debt spoken of in public is void, so the lender of {place} will only discuss it behind a closed door.',
      'The {demonym} pay a tithe to their circle on every deal, and no trader of {place} will say how much of the price that is.',
    ],
    shadow: [
      'The {demonym} keep their own secrets and ask no one else\'s, so nobody in {place} will report what {actor} does after dark.',
      'Among the {demonym}, a circle that is spied on takes its own revenge, and the circles of {place} never call the watch.',
      'The {demonym} pass every secret by word of mouth alone, so what {actor} wants to learn is written down nowhere in {place}.',
    ],
    veil: [
      'The {demonym} keep their rites inside sworn circles, and a stranger who watches one in {place} is either initiated or driven out.',
      'Among the {demonym}, the true name of a spirit belongs to one family, and that family of {place} does not share it.',
      'The {demonym} work magic only by night and in silence, and they hold that a spell spoken aloud is wasted.',
    ],
    heart: [
      'The {demonym} settle quarrels inside the family, and an outsider who takes a side in {place} makes enemies of both.',
      'Among the {demonym}, loyalty is sworn to the circle before the town, so no one in {place} will speak against their own.',
      'The {demonym} grieve and heal behind closed doors, and a stranger in {place} is turned away until someone invites them in.',
    ],
    star: [
      'The {demonym} keep their roads secret, and the safe paths out of {place} are shown only to those a family vouches for.',
      'Among the {demonym}, travellers leave before dawn and tell no one their road, so {actor} will find no company in {place}.',
      'The {demonym} believe a journey spoken of is a journey cursed, and no one in {place} will even say where the road goes.',
    ],
  },
};

// ─── Sphere facts ──────────────────────────────────────────────────

/**
 * Keyed by the place's dominant sphere. Force, mind, spirit and chaos cells are not
 * authored: none of them dominated a place on either measured seed, so their lines
 * would never fire (the trace names the cell as `sphere_cell_unauthored` if a later
 * world proves otherwise). The order cells are the prototype's, ported because they
 * cost nothing.
 */
export const SPHERE_FACTS: Readonly<Partial<Record<SphereName, Partial<Record<ReachDomain, readonly string[]>>>>> = {
  life: {
    iron: [
      'Everything that grows around {place} heals too fast; a wound dealt to this thing closes before a second blow can land.',
      'The beasts near {place} grow larger than they should, and this one has been feeding well all season.',
    ],
    stone: [
      'The local craft in {place} works in living material, wood and hide that still grow, and one careless cut kills the stock.',
      'In {place} a graft or a planting takes root overnight, so a mistake in the craft grows along with the work.',
    ],
    eye: [
      'Sickness spreads fast in {place}, where everything living quickens, and recovery comes just as fast to those who survive the first days.',
      'In {place} every living thing multiplies, including whatever carries this illness from house to house.',
    ],
    gold: [
      'Crops and herds around {place} grow faster than the market can use them, so food sells cheap and everything else sells dear.',
      'In {place} a harvest rots as fast as it ripens, so every bargain for food must be closed the same day.',
    ],
    shadow: [
      'The undergrowth around {place} grows back within a day, hiding any trail and any hiding place with it.',
      'In {place} vines grow thick over every wall, so there is always a way up and always cover, for {actor} and for anyone watching.',
    ],
    veil: [
      'Every spell cast in {place} feeds the growing things, and a rite done carelessly makes the nearest field run wild.',
      'The spirits around {place} live in the trees and the herds, and harming either turns them against whoever did it.',
    ],
    heart: [
      'Wounds and grief both heal quickly in {place}, so old quarrels are forgotten fast and fresh ones burn hot.',
      'In {place} families are large and every household is related, so a quarrel with one person is a quarrel with dozens.',
    ],
    star: [
      'The roads out of {place} are overgrown within a season, and a guide who has not walked them lately will get lost.',
      'Game and water are plentiful on every road around {place}, so a traveller will not starve, but the beasts grow bold.',
    ],
  },
  matter: {
    iron: [
      'The thing is bound into the stone of {place} itself and cannot be driven out, only broken along with the ground it holds.',
      'The ground of {place} resists every spade and lever, so whatever is lodged here cannot be dug out or carried off.',
    ],
    stone: [
      'The stone and ore of {place} take a shape once and will not take another, so {actor} gets one attempt at the work.',
      'Tools wear down fast on the hard stone of {place}; every mistake costs a blade the smith will not replace.',
    ],
    eye: [
      'The illness in {place} lives in the wells and the cellars, not in the air, and it stays where the water stays.',
      'In {place} what is buried stays whole for generations, so the old graves under the square still hold what killed them.',
    ],
    gold: [
      'The ground around {place} is rich in ore and stone, so metal is cheap here and everything that must be grown is dear.',
      'In {place} goods made once last for generations, so the market is full of old wares and new ones are hard to sell.',
    ],
    shadow: [
      'The walls of {place} are thick stone that carries no sound, so what happens behind them stays unheard.',
      'Locks and doors in {place} are heavy and do not break, so getting in quietly means finding a key or another way.',
    ],
    veil: [
      'Magic takes hold slowly in {place}, where stone and iron resist it, and a spell must be worked twice as long to hold.',
      'In {place} every ward is carved into stone, and once carved it cannot be changed, only broken.',
    ],
    heart: [
      'People in {place} hold to what they have said as they hold to their land, and none of them changes their mind easily.',
      'In {place} houses stand for centuries and families never move, so every quarrel here is older than the people having it.',
    ],
    star: [
      'The roads around {place} are hard, stony and steep, and a cart or a tired traveller breaks down long before the end.',
      'In {place} the landmarks never change, so the old route maps still hold, if {actor} can find someone who owns one.',
    ],
  },
  entropy: {
    iron: [
      'Everything around {place} is rotting, and the thing that must be faced has grown stronger feeding on the decay.',
      'In {place} walls crumble and weapons rust fast, so any fight here is fought with worn gear on failing ground.',
    ],
    gold: [
      'Goods spoil fast in {place}, so every merchant here is desperate to sell and slow to pay.',
      'In {place} coin tarnishes and stock rots in the store, so wealth held for a season is wealth lost.',
    ],
    shadow: [
      'The old buildings of {place} are half fallen in, full of gaps to slip through and floors that give way underfoot.',
      'In {place} locks rust through and records rot, so what was hidden here is easy to reach and hard to find.',
    ],
    veil: [
      'Spells unravel quickly in {place}, and a ward set here must be renewed before it fails.',
      'In {place} the old seals and rites are wearing out, and whatever they held back is already slipping loose.',
    ],
    heart: [
      'Old bonds are fraying in {place}, and families that stood together for generations are breaking apart.',
      'In {place} people expect things to end, so they give up on each other quickly, and a plea for loyalty is met with shrugs.',
    ],
    eye: [
      'Records in {place} crumble to dust within a few years, so the answers {actor} needs survive only in failing memories.',
      'Sickness lingers in {place} long after it should have passed, and the sick weaken slowly instead of recovering.',
    ],
    stone: [
      'Work done in {place} does not last; timber rots and mortar crumbles, so {actor} must build against a fast decay.',
      'In {place} tools rust and wear by the week, and a craftsman spends as long mending as making.',
    ],
    star: [
      'The roads out of {place} are breaking up, with bridges fallen and wells gone dry along the way.',
      'In {place} every journey seems to end worse than it began, and travellers come back fewer than they left.',
    ],
  },
  energy: {
    iron: [
      'Storms and wildfires strike {place} without warning, and anything faced here may be faced in the middle of one.',
      'In {place} people and beasts are restless and quick to anger, and the thing to be faced is no exception.',
    ],
    gold: [
      'Trade in {place} moves fast and prices change by the hour, so a good deal must be taken the moment it appears.',
      'In {place} forges and mills run day and night, so anything made here is cheap and plentiful.',
    ],
    shadow: [
      'Nobody in {place} stays still, and a busy street full of hurrying people is easy to disappear into.',
      'In {place} sparks and flashes of light come without warning, so any hiding place can be lit up at the worst moment.',
    ],
    veil: [
      'Spells cast in {place} come out stronger than intended, and a small rite can break loose and burn.',
      'In {place} the air hums with power, so any working here is easy to start and hard to stop.',
    ],
    heart: [
      'Tempers run hot in {place}, and a quarrel here turns into a fight faster than anywhere else.',
      'People in {place} act before they think, so a rousing word can win them in a moment and lose them just as fast.',
    ],
    eye: [
      'Fevers burn high and fast in {place}, killing or breaking within days, so there is little time to find a cure.',
      'In {place} news travels quickly and grows in the telling, so every witness has heard three versions already.',
    ],
    stone: [
      'Forges burn hotter in {place} than anywhere else, so metal works fast, and a moment of inattention ruins the piece.',
      'In {place} the ground trembles often and shakes loose whatever is not built well, so hurried work does not last.',
    ],
    star: [
      'Winds and currents around {place} are strong and sudden, carrying a traveller far in a day or far off course.',
      'Travellers from {place} make good time on every road, but horses and people tire early from the pace.',
    ],
  },
  time: {
    iron: [
      'Old dangers never quite end around {place}; this one was beaten before and has come back, as it always does.',
      'In {place} the elders remember every past attack, so there is plenty of advice for {actor}, and much of it is out of date.',
    ],
    gold: [
      'Old debts in {place} never lapse, and a bargain struck by grandparents still binds their grandchildren.',
      'In {place} goods age slowly and gain value, so no one sells old stock cheap and everyone waits for a better price.',
    ],
    shadow: [
      'Everything in {place} happens at the same hour each day, so anyone patient can learn exactly when a door is left unguarded.',
      'In {place} secrets surface in their own time, and something buried long ago is due to come out soon.',
    ],
    veil: [
      'Rites in {place} work only at the right hour, and missing it means waiting a full turn of the season.',
      'In {place} omens show what is coming but never when, and the seers cannot agree on the timing.',
    ],
    heart: [
      'People in {place} live long and forget nothing, so a slight from years ago still decides who will help {actor}.',
      'In {place} promises are kept across generations, and {actor} may be asked to honour one made by strangers long dead.',
    ],
    eye: [
      'The records of {place} go back further than anywhere nearby, and the answer is in them, if {actor} has the patience to look.',
      'In {place} the same sickness returns every generation, and the temple still keeps the old accounts of it.',
    ],
    stone: [
      'Work in {place} must be done slowly, the way it was done generations ago; hurried work here fails within a season.',
      'In {place} the old masters are still alive and still working, and they will not be rushed by anyone.',
    ],
    star: [
      'Journeys from {place} take longer than they should, as if the road stretches, so every trip needs extra supplies.',
      'The star-readers of {place} say every journey has its right day, and leaving on the wrong one has ended badly before.',
    ],
  },
  light: {
    iron: [
      'The sun over {place} is harsh and the land is open, so the thing can be seen coming from far off, and so can {actor}.',
      'Nothing hides for long around {place}; the danger is out in the open, and so is everyone who faces it.',
    ],
    gold: [
      'Lies do not hold in {place}, and a trader caught cheating is known to the whole town by nightfall.',
      'In {place} goods are judged in bright daylight, so flaws are easy to spot and hard to talk away.',
    ],
    shadow: [
      'Nights around {place} are short and bright, so there is little darkness to work in and none to hide in.',
      'In {place} secrets come out on their own, so whatever {actor} hides here will not stay hidden for long.',
    ],
    veil: [
      'Spells cast in {place} shine for all to see, so no working here can be done in secret.',
      'In {place} visions come clear and easy, but they show only what is true, and the truth may not be welcome.',
    ],
    heart: [
      'People in {place} say what they mean and expect the same, so a smooth word from {actor} will be heard as a lie.',
      'In {place} feelings show plainly on every face, so {actor} can tell who is lying, and they can tell too.',
    ],
    eye: [
      'Anyone who lies to {actor} in {place} gives themselves away almost at once, because the truth here is hard to hide.',
      'In {place} the sick are easy to spot, but the cause keeps out of sight, as if it avoids the daylight.',
    ],
    stone: [
      'Work in {place} is done in strong daylight, and every flaw in a finished piece shows plainly to any buyer.',
      'In {place} the sun bleaches and cracks whatever is left out, so the work must be sheltered or it spoils.',
    ],
    star: [
      'Roads around {place} are long, open and bright, easy to follow by day and easy for anyone to watch from far off.',
      'The sky over {place} is clear on most nights, so the stars give a traveller a true course.',
    ],
  },
  darkness: {
    iron: [
      'The thing cannot be seen in daylight around {place}, only in what it leaves behind after dark.',
      'Lamps burn low and short in {place}; whoever faces this after nightfall faces it nearly blind.',
    ],
    stone: [
      'In {place} the craft is worked at night, and nobody who has watched it done will describe it.',
      'The workshops of {place} keep no windows, and a method learned there is learned by touch, not by sight.',
    ],
    eye: [
      'The sick of {place} hide their symptoms, and the count everyone quotes is far too low.',
      'In {place} people forget what they saw by morning, so every witness to the first cases already remembers it differently.',
    ],
    gold: [
      'The markets of {place} trade mostly after dark, where goods are hard to inspect and short weight is easy to hide.',
      'In {place} no one shows their coin openly, so {actor} cannot tell who is able to pay until the deal is struck.',
    ],
    shadow: [
      'Nights in {place} are long and the dark is deep, so hiding is easy, and so is being followed without knowing it.',
      'Shadows in {place} fall deeper than the light allows, and a watcher standing still can go unnoticed at arm\'s length.',
    ],
    veil: [
      'Spells cast in {place} work best unseen, and a rite performed in daylight here often fails outright.',
      'In {place} spirits come only when the lamps are out, so the work must be done in full darkness.',
    ],
    heart: [
      'People in {place} keep their feelings hidden, and a stranger cannot tell a friend from an enemy until it matters.',
      'In {place} secrets outlast the people who keep them, so every family carries an old grudge it will not explain.',
    ],
    star: [
      'Nights around {place} fall early and stay long, so a traveller must cover the road in half a day or walk it blind.',
      'The stars cannot be seen from {place} on most nights, so no one here can steer by them.',
    ],
  },
  order: {
    iron: [
      'The thing keeps a strict schedule around {place}, and it has missed none of its appointed nights in living memory.',
      'Whatever this is takes the same path around {place} each time, and anyone who waits at the right spot will meet it.',
    ],
    stone: [
      'The craft in {place} has one correct method, and the master can tell at a glance when a single step is broken.',
      'In {place} work done out of sequence cracks as it cools, so {actor} must learn the whole order before starting.',
    ],
    eye: [
      'The illness spreads along the trade roads from {place} in a regular pattern that someone patient could map.',
      'In {place} the sick fall ill in the same order every season, so the next house on the list can be warned.',
    ],
  },
};

/** Every authored line, with its cell address — the doctrine checker's and tests' sweep. */
export function allColorationLines(): readonly { readonly cell: string; readonly line: string }[] {
  const out: { cell: string; line: string }[] = [];
  for (const [foundation, byReach] of Object.entries(CULTURE_CUSTOMS)) {
    for (const [reach, lines] of Object.entries(byReach ?? {})) {
      for (const line of lines ?? []) out.push({ cell: `culture.${foundation}.${reach}`, line });
    }
  }
  for (const [sphere, byReach] of Object.entries(SPHERE_FACTS)) {
    for (const [reach, lines] of Object.entries(byReach ?? {})) {
      for (const line of lines ?? []) out.push({ cell: `sphere.${sphere}.${reach}`, line });
    }
  }
  return out;
}
